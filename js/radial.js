var shown_depth=4;
var height = $("#radial-draw-svg").height();
var width = $("#radial-draw-svg").width();
var svg = d3.select("#radial-draw-svg")
	.append("svg")
	.attr("id","radial")
	.attr("width", width)
	.attr("height", height);
var sliderDivHeight = $("#slider-view").height();
var sliderDivWidth = $("#slider-view").width();
var sliderSvg = d3.select("#slider-view")
	.append("svg")
	.attr("id","slider-svg")
	.attr("width",sliderDivWidth)
	.attr("height",sliderDivHeight);
var cur_chosen_background_index="none";
//同时一共最多容纳5课树
var barcode_tree_num_max = 5;
//存储5个rect的信息
var background_rect_record=[];
//画每个barcode背后的rect
var mem_last_used_rect_index = 0;
//画每个barcode背后的rect
//同时初始化记录这些rect的信息的background_rect_record
//barcode的tip
var radial = function(dataList){
		var barcodeNum = dataList.length;
		var rectAllHeight = 70;
		var rectHeight = rectAllHeight / 7 * 6;
		var verticalInterval = rectAllHeight / 7;
		var rectY = 10;
		var xCompute = 0;
		var maxBarNum = Math.floor((height - rectY * 2)/(rectHeight + verticalInterval));
		if(barcodeNum <= maxBarNum){
			for(var i = 0; i < dataList.length; i++){
				background_rect_record[i] = new Object();
				background_rect_record[i].y = rectY + (rectHeight + verticalInterval) * i;
			}
		}else{
			rectAllHeight = (height - rectY * 2)/dataList.length;
			rectHeight = rectAllHeight / 7 * 6;
			verticalInterval = rectAllHeight / 7;
			for(var i = 0; i < dataList.length; i++){
				background_rect_record[i] = new Object();
				background_rect_record[i].y = rectY + (rectHeight + verticalInterval) * i;
			}
		}
		var widthArray = [12, 8, 6, 4, 2];
		var linearTreeArray = [];
		for(var i = 0; i < dataList.length; i++){
			//对于数据进行预先的处理
			var dataProcessor = dataCenter.datasets[i].processor;
			var dataset = dataProcessor.result;
			linearTreeArray[i] = [];
			var target_root={//用树结构存储公共树
				//因为mark=0有特殊含义，所以输入的树的标号不能取0
				mark:0,//mark为0表示这个结点至少在两棵树中出现，mark不为0时，用于标记这个结点出现过的那棵树
				_depth:0,//结点所在的深度，在数据转换时d3的预处理函数已经用过depth了，所以这里要用_depth防止被覆盖
				name:"root",
				description:"root",
				//_children在下面自己会生成
				children:new Array(),//最底层结点没有children这个维度
				//size:...//只有最底层的结点有size：...
				//如果用sunburst的layout，上层的size会自己算出来，否则需要手动算才有
				_father: undefined
			};
			var curtreeindex = 1;
			merge_preprocess_rawdata(dataset.dataList,target_root,curtreeindex);
			reorder_tree(target_root);
			cal_repeat_time(target_root);
			cal_nth_different_subtree_traverse(target_root);
			cal_repeat_group_size(target_root);
			linearlize(target_root,linearTreeArray[i]);
			//根据处理得到的数据以及计算得到的坐标值进行实际的绘制
			draw_barcode(i);
		}
		function draw_barcode(index){
			var barcoded_tree_rectbackground_index = index;
			d3.select('#radial')
				.selectAll(".rect_background_index-" + barcoded_tree_rectbackground_index)
				.remove();
			var originNodeArray = [];
			var reduceNodeArray = [];
			var GlobalTreeDesArray = [];
			var tip_array = [];
			var originArray = [];
			for(var i = 0; i < widthArray.length; i++){
				originArray[i] = widthArray[i];
			}
			var barcoded_tree_biasy = background_rect_record[barcoded_tree_rectbackground_index].y;
			//var rectY = 10;
			//调整barcode的y坐标偏移，使得barcode始终处在rect的高度的中间
			//var rectY = (background_rect_record[0].height-rectHeight)/2;
			var Radial = {};
			ObserverManager.addListener(Radial);
			var handleColor = ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9"];
			var treeIndex = dataCenter.datasets.length;
			var GlobalFormerDepth = 4;
			var linear_tree = linearTreeArray[index];//用数组存储公共树

			//注意：JS中函数参数传递不是按引用传的
			//函数内部如果直接给传入的对象赋值，效果是对内部的拷贝赋值；如果修改传入的对象的成员，那么修改能够影响到传入的对象
			originNodeArray = get_origin_attr(index);
			function get_origin_attr(index){
				var originNodeArray = new Array();
				var xCompute = 0;
				var level = 0;
				var linear_tree = linearTreeArray[index];
				for(var i = 0; i < linear_tree.length; i++){
					originNodeArray[i] = new Object();
					originNodeArray[i].x = xCompute;
					level = + linear_tree[i]._depth;
					xCompute = xCompute + widthArray[level] + 1; 
					originNodeArray[i].width = widthArray[level];
				}
				return originNodeArray;
			}
			function get_origin_attr_depth(max_depth, barcoded_tree_biasy, index){
				var originNodeArrayDepth = new Array();
				var xCompute = 0;
				var maxDepth = max_depth;
				var level = 0;
				var linear_tree = linearTreeArray[index];
				for(var i = 0; i < linear_tree.length; i++){
					originNodeArrayDepth[i] = new Object();
					originNodeArrayDepth[i].x = xCompute;
					level = + linear_tree[i]._depth;
					if(level <= max_depth){
						xCompute = xCompute + widthArray[level] + 1;
						originNodeArrayDepth[i].width = widthArray[level];
					}else{
						originNodeArrayDepth[i].width = 0;
					}
					originNodeArrayDepth[i].height = rectHeight;
					originNodeArrayDepth[i].y = rectY + barcoded_tree_biasy
				}
				return originNodeArrayDepth;
			}
			function get_origin_attr_click(max_depth, origin_depth, treeDesArray, treeDesNow, barcoded_tree_biasy, index){
				var clickNodeArrayDepth = new Array();
				var xCompute = 0;
				var maxDepth = max_depth;
				var level = 0;
				var originRoute = "";
				var compareRoute = "";
				var treeDesLength = treeDesNow.length;
				var isHide = false;
				var linear_tree = linearTreeArray[index];
				for(var i = 0; i < linear_tree.length; i++){
					clickNodeArrayDepth[i] = new Object();
					clickNodeArrayDepth[i].x = xCompute;
					level = +linear_tree[i]._depth;
					originRoute = linear_tree[i].route;
					isHide = false;
					for(var j = 0; j < treeDesArray.length; j++){
						if(treeDesArray[j] != treeDesNow){
							compareRoute = originRoute.substring(0, treeDesArray[j].length);
							if(compareRoute == treeDesArray[j] && originRoute != treeDesArray[j]){
								isHide = true;
								break;
							}
						}
					}
					compareRoute = linear_tree[i].route.substring(0, treeDesLength);
					if(level <= origin_depth){
						if((level > maxDepth && compareRoute == treeDesNow && originRoute != treeDesNow) || isHide){
							clickNodeArrayDepth[i].width = 0;
						}else{
							xCompute = xCompute + widthArray[level] + 1;
							clickNodeArrayDepth[i].width = widthArray[level];
						}
					}else{
						clickNodeArrayDepth[i].width = 0;
					}
					clickNodeArrayDepth[i].height = rectHeight;
					clickNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
				}
				return clickNodeArrayDepth;
			}
			//---------------------------------------------------------------------------------
			reduceNodeArray = get_reduce_attr(index);
			function get_reduce_attr(index){
				var reduceNodeArray = new Array();
				var xCompute = 0;
				var level = 0;
				var initReduceLevel = 10;
				var colNum = 5;
				var divideNum = colNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight / divideNum;
				var repeatTime = 0;
				var curDepth = 0;
				var maxRepeatTime = 0;
				var linear_tree = linearTreeArray[index];
				for(var i = 0; i < linear_tree.length; i++){
					reduceNodeArray[i] = new Object();
					repeatTime = linear_tree[i].continuous_repeat_time;
					maxRepeatTime = linear_tree[i].maximum_continuous_repeat_group_size;
					curDepth = linear_tree[i]._depth;
					if(repeatTime > 1 && curDepth <= initReduceLevel){
						initReduceLevel = curDepth;
					}else if(repeatTime == 1 && curDepth == initReduceLevel){
						initReduceLevel = 10;
					}else if(curDepth < initReduceLevel){
						initReduceLevel = initReduceLevel;
					}
					reduceNodeArray[i].x = xCompute;
					if(repeatTime == 1 && curDepth <= initReduceLevel){
						xCompute = xCompute + widthArray[curDepth] + 1;
						reduceNodeArray[i].width = widthArray[curDepth];
						reduceNodeArray[i].height = rectHeight;
						reduceNodeArray[i].y = rectY + barcoded_tree_biasy;
					}else if(repeatTime > 1 && (repeatTime - 1)%colNum != 0 && curDepth == initReduceLevel){
						if(repeatTime == maxRepeatTime){
							xCompute = xCompute + widthArray[curDepth] + 1;
						}
						reduceNodeArray[i].width = widthArray[curDepth];
						reduceNodeArray[i].height = barHeight;
						reduceNodeArray[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
					}else if(repeatTime > 1 && (repeatTime - 1)%colNum == 0 && curDepth == initReduceLevel){
						xCompute = xCompute + widthArray[curDepth] + 1;
						reduceNodeArray[i].width = widthArray[curDepth];
						reduceNodeArray[i].height = barHeight;
						reduceNodeArray[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
					}else if(curDepth > initReduceLevel){
						reduceNodeArray[i].width = 0;
						reduceNodeArray[i].height = barHeight;
						reduceNodeArray[i].y = rectY + barcoded_tree_biasy;
					}
				}
				return reduceNodeArray;
			}
			function get_reduce_attr_depth(max_depth, barcoded_tree_biasy, index){
				var reduceNodeArrayDepth = new Array();
				var maxDepth = max_depth;
				var xCompute = 0;
				var level = 0;
				var initReduceLevel = 10;
				var colNum = 5;
				var divideNum = colNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight / divideNum;
				var repeatTime = 0;
				var curDepth = 0;
				var maxRepeatTime = 0;
				var linear_tree = linearTreeArray[index];
				for(var i = 0; i < linear_tree.length; i++){
					reduceNodeArrayDepth[i] = new Object();
					repeatTime = linear_tree[i].continuous_repeat_time;
					maxRepeatTime = linear_tree[i].maximum_continuous_repeat_group_size;
					curDepth = linear_tree[i]._depth;
					if(curDepth <= maxDepth){
						if(repeatTime > 1 && curDepth <= initReduceLevel){
							initReduceLevel = curDepth;
						}else if(repeatTime == 1 && curDepth == initReduceLevel){
							initReduceLevel = 10;
						}else if(curDepth < initReduceLevel){
							initReduceLevel = initReduceLevel;
						}
						reduceNodeArrayDepth[i].x = xCompute;
						if(repeatTime == 1 && curDepth <= initReduceLevel){
							xCompute = xCompute + widthArray[curDepth] + 1;
							reduceNodeArrayDepth[i].width = widthArray[curDepth];
							reduceNodeArrayDepth[i].height = rectHeight;
							reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
						}else if(repeatTime > 1 && (repeatTime - 1)%colNum != 0 && curDepth == initReduceLevel){
							if(repeatTime == maxRepeatTime){
								xCompute = xCompute + widthArray[curDepth] + 1;
							}
							reduceNodeArrayDepth[i].width = widthArray[curDepth];
							reduceNodeArrayDepth[i].height = barHeight;
							reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
						}else if(repeatTime > 1 && (repeatTime - 1)%colNum == 0 && curDepth == initReduceLevel){
							xCompute = xCompute + widthArray[curDepth] + 1;
							reduceNodeArrayDepth[i].width = widthArray[curDepth];
							reduceNodeArrayDepth[i].height = barHeight;
							reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
						}else if(curDepth > initReduceLevel){
							reduceNodeArrayDepth[i].width = 0;
							reduceNodeArrayDepth[i].height = barHeight;
							reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
						}
					}else{
						reduceNodeArrayDepth[i].x = xCompute;
						reduceNodeArrayDepth[i].width = 0;
					}
				}
				return reduceNodeArrayDepth;
			}
			function get_reduce_attr_click(max_depth, origin_depth, treeDesArray, treeDesNow, barcoded_tree_biasy, index){
				var reduceNodeArrayDepth = new Array();
				var maxDepth = max_depth;
				var xCompute = 0;
				var level = 0;
				var initReduceLevel = 10;
				var colNum = 5;
				var divideNum = colNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight / divideNum;
				var repeatTime = 0;
				var curDepth = 0;
				var maxRepeatTime = 0;
				var originRoute = "";
				var compareRoute = "";
				var treeDesLength = treeDesNow.length;
				var isHide = false;
				var linear_tree = linearTreeArray[index];
				for(var i = 0; i < linear_tree.length; i++){
					reduceNodeArrayDepth[i] = new Object();
					reduceNodeArrayDepth[i].x = xCompute;
					level = +linear_tree[i]._depth;
					originRoute = linear_tree[i].route;
					isHide = false;
					for(var j = 0; j < treeDesArray.length; j++){
						if(treeDesArray[j] != treeDesNow){
							compareRoute = originRoute.substring(0, treeDesArray[j].length);
							if(compareRoute == treeDesArray[j] && originRoute != treeDesArray[j]){
								isHide = true;
								break;
							}
						}
					}
					compareRoute = linear_tree[i].route.substring(0, treeDesLength);
					if(level <= origin_depth){
						if((level > maxDepth && compareRoute == treeDesNow && originRoute != treeDesNow) || isHide){
							reduceNodeArrayDepth[i].width = 0;
						}else{
							//-----------------------------------
							repeatTime = linear_tree[i].continuous_repeat_time;
							maxRepeatTime = linear_tree[i].maximum_continuous_repeat_group_size;
							curDepth = linear_tree[i]._depth;
							if(repeatTime > 1 && curDepth <= initReduceLevel){
								initReduceLevel = curDepth;
							}else if(repeatTime == 1 && curDepth == initReduceLevel){
								initReduceLevel = 10;
							}else if(curDepth < initReduceLevel){
								initReduceLevel = initReduceLevel;
							}
							if(repeatTime == 1 && curDepth <= initReduceLevel){
								xCompute = xCompute + widthArray[curDepth] + 1;
								reduceNodeArrayDepth[i].width = widthArray[curDepth];
								reduceNodeArrayDepth[i].height = rectHeight;
								reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
							}else if(repeatTime > 1 && (repeatTime - 1)%colNum != 0 && curDepth == initReduceLevel){
								if(repeatTime == maxRepeatTime){
									xCompute = xCompute + widthArray[curDepth] + 1;
								}
								reduceNodeArrayDepth[i].width = widthArray[curDepth];
								reduceNodeArrayDepth[i].height = barHeight;
								reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
							}else if(repeatTime > 1 && (repeatTime - 1)%colNum == 0 && curDepth == initReduceLevel){
								xCompute = xCompute + widthArray[curDepth] + 1;
								reduceNodeArrayDepth[i].width = widthArray[curDepth];
								reduceNodeArrayDepth[i].height = barHeight;
								reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
							}else if(curDepth > initReduceLevel){
								reduceNodeArrayDepth[i].width = 0;
								reduceNodeArrayDepth[i].height = barHeight;
								reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
							}
							//-------------------------------------------
						}
					}else{
						reduceNodeArrayDepth[i].width = 0;
					}	
				}
				return reduceNodeArrayDepth;
			}
			draw_slide_bar();
			function draw_slide_bar(){
				function changePercentage(text){
					text = +text;
					var format_text = parseFloat(Math.round(text * 100) / 100).toFixed(2);
					d3.select("#now-value")
						.html(format_text);
				}
				function clearPercentage(){
					d3.select("#now-value")
						.html(null);
				}
				var min = 0;
				var max = 30;
				var sliderHeight = sliderDivHeight;
				var sliderWidth = sliderDivWidth * 2 / 10;
				sliderSvg.append("g")
					.attr("id","slider-g")
					.attr("transform","translate(" + sliderDivWidth * 4 / 10 + "," + 0 + ")");
				var sliderHandleHeight = sliderHeight/30;
				var dragDis = 0;
				var drag = d3.behavior.drag()
			        .on("drag", function(d,i) {
			        	var oy = originArray[i] / max * sliderHeight;
			            var dx = +d3.event.x;
			            var dy = +d3.event.y - oy;
			            if((d3.event.y > 0)&&(d3.event.y < sliderHeight - sliderHandleHeight)){
			            	d3.select(this).attr("transform", function(d,i){
				                return "translate(" + 0 + "," + dy + ")";
				            });
			            }
			            dragDis = dy;
			            var value = dragDis / sliderDivHeight * max;
			        	var finalValue = originArray[i] + value;
			        	finalValue = finalValue > max ? max : finalValue;
			        	finalValue = finalValue < min ? min : finalValue;
			        	changePercentage(finalValue);
			        })
			        .on("dragend",function(d,i){
			        	var value = dragDis / sliderDivHeight * max;
			        	var finalValue = originArray[i] + value;
			        	finalValue = finalValue > max ? max : finalValue;
			        	finalValue = finalValue < min ? min : finalValue;
			        	widthArray[i] = finalValue;
			        	if($("#state-change").hasClass("active")){
							draw_reduced_barcoded_tree(linear_tree,1);
							//animation_reduced_barcoded_tree_depthchange_shrink(linear_tree,shown_depth,shown_depth);
							GlobalFormerDepth = shown_depth;
						}else{
							draw_barcoded_tree(linear_tree,1);
							//animation_unreduced_barcoded_tree_depthchange_shrink(linear_tree,shown_depth,shown_depth);
							GlobalFormerDepth = shown_depth;
						}
			        	changePercentage(finalValue);
			        });

			    sliderSvg.select("#back-slider").remove();
			    sliderSvg.select("#slider-g")
					.append("rect")
					.attr("id","back-slider")
					.attr("height",sliderHeight)
					.attr("width",sliderWidth)
					.attr("x",0)
					.attr("y",0)
					.attr("fill","gray");
				sliderSvg.selectAll(".slider").remove();
				sliderSvg.select("#slider-g")
					.selectAll(".slider")
					.data(widthArray)
					.enter()
					.append("rect")
					.attr("class","slider")
					.attr("id",function(d,i){
						return "slider-" + i;
					})
					.attr("x",-sliderWidth/4)
					.attr("y",function(d,i){
						var value = +d;
						return value / max * sliderHeight; 
					})
					.attr("width",sliderWidth + sliderWidth/2)
					.attr("height",sliderHandleHeight)
					.attr("fill",function(d,i){
						return handleColor[i];
					})
					.on("mouseover",function(d,i){
						d3.select(this).classed("slider-hover-" + i,true);
						var changeClass = "hover-depth-" + i;
						d3.selectAll(".num-" + i).classed(changeClass,true);
						changePercentage(widthArray[i]);
					})
					.on("mouseout",function(d,i){
						var changeClass = "hover-depth-" + i;
						d3.select(this).classed("slider-hover-" + i,false);
						d3.selectAll(".num-" + i).classed(changeClass,false);
						clearPercentage();
					})
					.call(drag);
			}
			var changeWidthArray = [];
			for(var i = 0;i < widthArray.length;i++){
				changeWidthArray[i] = widthArray[i];
			}
			//----------------------------------------------------------------------------------
			var maintain_tooltip_display=[];

			if($("#state-change").hasClass("active")){
				draw_reduced_barcoded_tree(linear_tree,1);
				GlobalFormerDepth = shown_depth;
			}else{
				draw_barcoded_tree(linear_tree,1);
				GlobalFormerDepth = shown_depth;
			}
			//-----------------------------------------------------------------------------
			function animation_click_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow, biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeArrayDepth = get_origin_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_origin_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return beforeArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowArrayClick[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = 0;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('x',function(d,i){
						return nowArrayClick[i].x;
					})
					.call(endall, function(){
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							GlobalTreeDesArray.push(treeDesNow);
							svg.selectAll(".triangle").remove();
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k]);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_click_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_click_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数				
				var beforeArrayClick = get_origin_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_origin_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return nowArrayClick[i].x;
				})
				.attr('width',function(d,i){
					return beforeArrayClick[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = 0;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('width',function(d,i){
						return nowArrayClick[i].width;
					})
					.call(endall, function(){
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							GlobalTreeDesArray.splice(GlobalTreeDesArray.indexOf(treeDesNow),1);
							svg.selectAll(".triangle").remove();
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k]);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_click_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_click_reduce_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
				//按下换depth的button时，要把原来的tip全都删光
				var index = biasy_index;
				var biasy = background_rect_record[index].y;

				var linear_tree = linearTreeArray[index];

				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeArrayDepth = get_reduce_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_reduce_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return beforeArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowArrayClick[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = 0;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('x',function(d,i){
						return nowArrayClick[i].x;
					})
					.call(endall, function(){
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							GlobalTreeDesArray.push(treeDesNow);
							svg.selectAll(".triangle").remove();
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k]);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_click_reduce_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_click_reduce_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
				//按下换depth的button时，要把原来的tip全都删光
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeArrayDepth = get_reduce_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_reduce_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return nowArrayClick[i].x;
				})
				.attr('width',function(d,i){
					return beforeArrayDepth[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = 0;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('width',function(d,i){
						return nowArrayClick[i].width;
					})
					.call(endall, function(){
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							GlobalTreeDesArray.splice(GlobalTreeDesArray.indexOf(treeDesNow),1);
							svg.selectAll(".triangle").remove();
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k]);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_click_reduce_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_unreduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
				//按下换depth的button时，要把原来的tip全都删光
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];

				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeArrayDepth = get_origin_attr_depth(before_depth, biasy, index);
				var nowArrayDepth = get_origin_attr_depth(now_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()//过渡动画
				.duration(400)
				.attr('x',function(d,i){
					return beforeArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowArrayDepth[i].width;
				})
				.call(endall, function() { 
					draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = 0;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('x',function(d,i){
						return nowArrayDepth[i].x;
					})
					//call 相当于定义一个函数，再把选择的元素给它
					.call(endall, function(){
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							if(treeDesNow!=undefined){
								GlobalTreeDesArray.push(treeDesNow);
								svg.selectAll(".triangle").remove();
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k]);
								}
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_unreduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------------------
			function animation_unreduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];

				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeArrayDepth = get_origin_attr_depth(before_depth, biasy, index);
				var nowArrayDepth = get_origin_attr_depth(now_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return nowArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return beforeArrayDepth[i].width;
				})
				.call(endall, function() {
					draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow); 
				});
				//----------------------------------------------------------
				function draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = 0;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('width',function(d,i){
						return nowArrayDepth[i].width;
					})
					.call(endall, function() { 
						now_depth = +now_depth;
						before_depth = +before_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							if(treeDesNow!=undefined){
								GlobalTreeDesArray.splice(GlobalTreeDesArray.indexOf(treeDesNow),1);
								svg.selectAll(".triangle").remove();	
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k]);
								}					
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_unreduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}			
			//---------------------------------------------------------------------------
			function animation_reduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeReduceArrayDepth = get_reduce_attr_depth(before_depth, biasy, index);
				var nowReduceArrayDepth = get_reduce_attr_depth(now_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()//过渡动画
				.duration(600)
				.attr('x',function(d,i){	
					return beforeReduceArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowReduceArrayDepth[i].width;
				})
				.call(endall, function() { 
					draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(400)
					.attr('x',function(d,i){
						return nowReduceArrayDepth[i].x;
					})
					.call(endall, function(){
						now_depth = +now_depth;
						before_depth = +before_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							if(treeDesNow != undefined){
								GlobalTreeDesArray.push(treeDesNow);
								svg.selectAll(".triangle").remove();	
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k]);
								}
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_reduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}
			//---------------------------------------------------------------------------
			function animation_reduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeReduceArrayDepth = get_reduce_attr_depth(before_depth, biasy, index);
				var nowReduceArrayDepth = get_reduce_attr_depth(now_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(600)
				.attr('x',function(d,i){
					return nowReduceArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return beforeReduceArrayDepth[i].width;
				})
				.call(endall, function() {
				 	draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index); 
				});
				//----------------------------------------------------------
				function draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(400)
					.attr('width',function(d,i){
						return nowReduceArrayDepth[i].width;
					})
					.call(endall, function() { 
						now_depth = +now_depth;
						before_depth = +before_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							draw_link(biasy,index);
							if(treeDesNow != undefined){
								GlobalTreeDesArray.splice(GlobalTreeDesArray.indexOf(treeDesNow));
								svg.selectAll(".triangle").remove();	
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k]);
								}
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_reduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index);
						}
					});
				}
			}
			//---------------------------------------------------------------------------
			function animation_reduced2unreduced(shown_depth, biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var targetReduceArray = get_origin_attr_depth(shown_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(1500)
				.attr('x',function(d,i){
					return targetReduceArray[i].x;
				})
				.attr('width',function(d,i){
					return targetReduceArray[i].width;
				})
				.call(endall, function() {
				 	animation_change_y(); 
				});
				function animation_change_y(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('y',function(d,i){
						return targetReduceArray[i].y;
					})
					.call(endall, function() {
					 	animation_change_height(); 
					});
				}
				function animation_change_height(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('height',function(d,i){
						return targetReduceArray[i].height;
					})
					.call(endall, function() {
					 	draw_link(biasy,index);
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_unreduced2reduced(shown_depth, biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = linearTreeArray[index];
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var targetUnreduceArray = get_reduce_attr_depth(shown_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(600)
				.attr('height',function(d,i){
					return targetUnreduceArray[i].height;
				})
				.call(endall, function() {
				 	animation_change_y(); 
				});
				function animation_change_y(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('y',function(d,i){
						return targetUnreduceArray[i].y;
					})
					.call(endall, function() {
					 	animation_change_x(); 
					});
				}
				function animation_change_x(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(1500)
					.attr('x',function(d,i){
						return targetUnreduceArray[i].x;
					})
					.attr('width',function(d,i){
						return targetUnreduceArray[i].width;
					})
					.call(endall, function() {
					 	draw_link(biasy,index);
					});
				}
			}
			//-------------------------------------------------------------------------------
			function endall(transition, callback) { 
			    if (transition.size() === 0) { callback() }
			    var n = 0; 
			    transition
			        .each(function() { ++n; }) 
			        .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
			}
			function draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index){
				var depth = 4;
				var linear_tree = linearTreeArray[barcoded_tree_rectbackground_index];
				svg.selectAll('.arc_background_index-' + barcoded_tree_rectbackground_index).remove();
				var beginRadians = Math.PI/2,
					endRadians = Math.PI * 3/2,
					points = 50;
				for(var i = 0;i < linear_tree.length;i++){
					var fatherWidth =  +svg//.selectAll(".rect_background_index-"+barcoded_tree_rectbackground_index)
											.select('#bar-id' + i + 
													'rect_background_index-' + barcoded_tree_rectbackground_index)
											.attr('width');
					var fatherX = +svg.select('#bar-id' + i + 
												'rect_background_index-' + barcoded_tree_rectbackground_index)
										.attr('x') + fatherWidth/2;
					var thisNode = linear_tree[i];
					var fatherIndex = thisNode.linear_index;
					var children = thisNode.children;
					if(children != undefined){
						for(var j = 0;j < children.length;j++){
							var child = children[j];
							if(thisNode._depth <= depth){
								var childIndex = child.linear_index;
								var childWidth = +svg.select('#bar-id' + childIndex + 
															'rect_background_index-' + barcoded_tree_rectbackground_index)
														.attr('width');
								var childX = +svg.select('#bar-id' + childIndex + 
															'rect_background_index-' + barcoded_tree_rectbackground_index)
													.attr('x') + childWidth/2;
								var radius = (childX - fatherX)/2;
								var angle = d3.scale.linear()
							   		.domain([0, points-1])
							   		.range([beginRadians, endRadians]);
							   	var line = d3.svg.line.radial()
							   		.interpolate("basis")
							   		.tension(0)
							   		.radius(radius)
							   		.angle(function(d, i) { return angle(i); });
								svg.append("path").datum(d3.range(points))
									.attr("class", "line " + "bg-" + barcoded_tree_rectbackground_index + "f-" + fatherIndex 
					    							+ " bg-" + barcoded_tree_rectbackground_index + "c-" + childIndex 
													+ " arc_background_index-" + barcoded_tree_rectbackground_index
													+ " class_end"
					    				)
					    			.attr('id','path-f' + fatherIndex +'-c-'+ childIndex)
					    			.attr("d", line)
					    			.attr("transform", "translate(" + (fatherX + radius) + ", " + (barcoded_tree_biasy+rectY + rectHeight) + ")");
							}
						}
					}
				}
			}
			var g;
			//---------------------------------------------------------------------------
			//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index
			function draw_barcoded_tree(linear_tree,cur_tree_index)
			{
				var svg = d3.select('#radial'); 
				xCompute = 0;//用于累积当前方块的横坐标
				var acc_depth_node_num=[];//记录各个深度的结点数
				for (var i=0;i<=4;++i){
					acc_depth_node_num[i]=0;
				}
				//先画条码
				for (var i=0;i<linear_tree.length;++i)//对于线性化的并集树中每个元素循环
				{
					acc_depth_node_num[linear_tree[i]._depth]=acc_depth_node_num[linear_tree[i]._depth]+1;
				}
				svg.selectAll(".rect_background_index-"+barcoded_tree_rectbackground_index)
				.data(linear_tree)
				.enter()
				.append('rect')
				.attr('class',function(d,i){
					var fatherIndex = -1;
					if(d._father!=undefined){
						fatherIndex = d._father.linear_index;
					}
					return  'bar-class' + 
							' bar-class-' + barcoded_tree_rectbackground_index + 
						    ' num-' + d._depth + 'father-' + fatherIndex + "bg-" + barcoded_tree_rectbackground_index + 
							" num-" + d._depth +
							' father-' + fatherIndex + 
							" father-" + fatherIndex + "subtree-" + d.nth_different_subtree +
							" rect_background_index-" + barcoded_tree_rectbackground_index +
							" class_end" + 
							" " + d.route;
				})
				.attr('id',function(d,i){
					return  'bar-id' + d.linear_index + "rect_background_index-" + barcoded_tree_rectbackground_index;
				})
				.attr('x',function(d,i){
					return originNodeArray[i].x;
				})
				.attr('y',function(d,i){
					return rectY + barcoded_tree_biasy;
				})
				.attr('width',function(d,i){
					return originNodeArray[i].width;
				})
				.attr('height',function(d,i){
					return rectHeight;
				})
				.attr('fill','black')
				.on('mouseover',function(d,i){
					var fatherIndex = -1;
					var thisIndex = d.linear_index;
					if(d._father!=undefined){
						fatherIndex = d._father.linear_index;
						father = d._father;
						sibling_group=father.children;
						for (var j=0;j<sibling_group.length;++j)
						{
							var cur_sibling=sibling_group[j];
							var siblingId=cur_sibling.linear_index;
							svg.selectAll('#bar-id' + siblingId + "rect_background_index-" + barcoded_tree_rectbackground_index)
									.classed("sibiling-highlight",true);
						}
					}
					//-------------highlight parent node-----------------
					var fatherId = 0;
					if(d._father!=undefined){
						fatherId = d._father.linear_index;
					}else{
						fatherId = -1;
					}
					svg.selectAll('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.classed("father-highlight",true);
					var children = [];
					if(d.children!=undefined){
						children = d.children;
					}
					for(var i = 0;i < children.length;i++){
						var childId = children[i].linear_index;
						svg.selectAll('#bar-id' + childId + "rect_background_index-" + barcoded_tree_rectbackground_index)
							.classed("children-highlight",true);
					}
					d3.select(this)
						.classed("this-highlight",true);
					svg.selectAll('.bg-'+ barcoded_tree_rectbackground_index + 'f-' + thisIndex)
				    	.classed('path-highlight',true)
				    	.classed('children-highlight',true);

				    svg.selectAll('.bg-'+ barcoded_tree_rectbackground_index + 'c-' + thisIndex)
				    	.classed('path-highlight',true)
				    	.classed('father-highlight',true);

				    if(d._father!=undefined){
				    	svg.selectAll(".father-" + d._father.linear_index +
				    				  "subtree-" + d.nth_different_subtree + 
				    				  "rect_background_index-" + barcoded_tree_rectbackground_index)
				    		.classed("same-sibling",true);
				    } 
				    //changed
				    ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length , d._depth]);
				})
				.on('mouseout',function(d,i){
					svg.selectAll('.bar-class')
					.classed("sibiling-highlight",false);

					svg.selectAll('.bar-class')
					.classed("father-highlight",false);

					svg.selectAll('.bar-class')
					.classed("children-highlight",false);

					svg.selectAll('.bar-class')
					.classed("this-highlight",false);

					svg.selectAll('path')
						.classed('children-highlight',false);

					svg.selectAll('path')
				    	.classed('path-highlight',false);

				    svg.selectAll('path')
				    	.classed('father-highlight',false);
				    if(d._father!=undefined){
				    	svg.selectAll(".father-" + d._father.linear_index + 
				    				  "subtree-" + d.nth_different_subtree + 
				    				  "rect_background_index-" + barcoded_tree_rectbackground_index)
				    		.classed("same-sibling",false);
				    }
				    ObserverManager.post("percentage", [0 ,-1]);
				})
				.on('click',function(d,i){
					var id = d3.select(this).attr('id');
					var idArray = id.split('-');
					var biasy_index = +idArray[2];
					//var biasy = background_rect_record[index].y;
					//click一下转换hide或保持的状态
					var this_x=this.x.animVal.valueInSpecifiedUnits;
					var this_y=this.y.animVal.valueInSpecifiedUnits;
					var this_width=this.width.animVal.valueInSpecifiedUnits;
					var this_height=this.height.animVal.valueInSpecifiedUnits;
					var routeIndex = GlobalTreeDesArray.indexOf(d.route);
					var add = true;
					if(routeIndex == -1){
						if($("#state-change").hasClass("active")){
							animation_click_reduce_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,biasy_index);
						}else{
							animation_click_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,biasy_index);
						}
					}else{
						if($("#state-change").hasClass("active")){
							animation_click_reduce_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,biasy_index);
						}else{
							animation_click_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,biasy_index);
						}
					}
					draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
				});
				draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
			}
			//---------------------------------------------------------------------------
			//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index
			function draw_reduced_barcoded_tree(linear_tree,cur_tree_index)
			{
				var svg = d3.select('#radial'); 
				var rowNum = 5;
				var divideNum = rowNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight/divideNum;
				var barWidth = 10;
				var curDrawDep = 10;
				var formerNodeRepeat = 0;
				var formerDepth = 0;
				xCompute = 0;//用于累积当前方块的横坐标
				var acc_depth_node_num=[];//记录各个深度的结点数
				for (var i=0;i<=4;++i){
					acc_depth_node_num[i]=0;
				}
				//先画条码
				for (var i=0;i<linear_tree.length;++i)//对于线性化的并集树中每个元素循环
				{
					acc_depth_node_num[linear_tree[i]._depth]=acc_depth_node_num[linear_tree[i]._depth]+1;
				}
				//把当前要使用的那块rect收拾干净
				/*background_rect_record[barcoded_tree_rectbackground_index].is_used=false;
				recycle();
				background_rect_record[barcoded_tree_rectbackground_index].is_used=true;*/
				svg.selectAll(".rect_background_index-"+barcoded_tree_rectbackground_index)
				.data(linear_tree)
				.enter()
				.append('rect')
				.attr('class',function(d,i){
					var fatherIndex = -1;
					if(d._father!=undefined){
						fatherIndex = d._father.linear_index;
					}
					return 'bar-class' +
						   ' bar-class-' + barcoded_tree_rectbackground_index + 
						   ' num-' + d._depth + 'father-' + fatherIndex + 'bg-' + barcoded_tree_rectbackground_index +
						   " num-" + d._depth + 
						   ' father-' + fatherIndex + 
						   " father-" + fatherIndex + "subtree-" + d.nth_different_subtree  + 
						   " rect_background_index-" + barcoded_tree_rectbackground_index + 
						   " class_end" + 
						   " " + d.route;
				})
				.attr('id',function(d,i){
					return  'bar-id' + d.linear_index  + "rect_background_index-" + barcoded_tree_rectbackground_index;
				})
				.attr('x',function(d,i){
					return reduceNodeArray[i].x;
				})
				.attr('y',function(d,i){
					return reduceNodeArray[i].y;
				})
				.attr('width',function(d,i){
					return reduceNodeArray[i].width;
				})
				.attr('height',function(d,i){
					return reduceNodeArray[i].height;
				})
				.attr('fill','black')
				.on('mouseover',function(d,i){
					var fatherIndex = -1;
					var thisIndex = d.linear_index;
					if(d._father!=undefined){
						/*fatherIndex = d._father.linear_index;
						svg.selectAll('.num-' + d._depth + 'father-' + fatherIndex + 'bg-' + barcoded_tree_rectbackground_index)
						.classed("sibiling-highlight",true);*/
						father = d._father;
						sibling_group=father.children;
						for (var j=0;j<sibling_group.length;++j)
						{
							var cur_sibling=sibling_group[j];
							var siblingId=cur_sibling.linear_index;
							svg.selectAll('#bar-id' + siblingId + "rect_background_index-" + barcoded_tree_rectbackground_index)
									.classed("sibiling-highlight",true);
						}
					}
					// 高亮父亲节点
					var fatherId = 0;
					if(d._father!=undefined){
						fatherId = d._father.linear_index;
					}else{
						fatherId = -1;
					}
					svg.selectAll('#bar-id' + fatherId  + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.classed("father-highlight",true);
					var children = [];
					if(d.children!=undefined){
						children = d.children;
					}
					for(var i = 0;i < children.length;i++){
						var childId = children[i].linear_index;
						svg.selectAll('#bar-id' + childId  + "rect_background_index-" + barcoded_tree_rectbackground_index)
							.classed("children-highlight",true);
					}
					d3.select(this)
						.classed("this-highlight",true);
					svg.selectAll(".bg-" + barcoded_tree_rectbackground_index + "f-" + thisIndex)
						.classed("path-highlight",true)
						.classed("children-highlight",true);
					svg.selectAll(".bg-" + barcoded_tree_rectbackground_index + "f-" + thisIndex)
						.classed("path-highlight",true)
						.classed("father-highlight",true);
				    if(d._father!=undefined){
				    	svg.selectAll(".father-" + d._father.linear_index +
				    				  "subtree-" + d.nth_different_subtree + 
				    				  "rect_background_index-" + barcoded_tree_rectbackground_index)
				    	.classed("same-sibling",true);
				    }
				    //changed
				    ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length , d._depth]);
				})
				.on('mouseout',function(d,i){
					svg.selectAll('.bar-class')
					.classed("sibiling-highlight",false);

					svg.selectAll('.bar-class')
					.classed("father-highlight",false);

					svg.selectAll('.bar-class')
					.classed("children-highlight",false);

					svg.selectAll('.bar-class')
					.classed("this-highlight",false);

					svg.selectAll('path')
					.classed('path-highlight',false);

					svg.selectAll('path')
				    	.classed('children-highlight',false);

				    svg.selectAll('path')
				    	.classed('father-highlight',false);
				    if(d._father != undefined){
				    	svg.selectAll(".father-" + d._father.linear_index + 
				    				  "subtree-" + d.nth_different_subtree +
				    				  "rect_background_index-" + barcoded_tree_rectbackground_index)
				    	.classed("same-sibling",false);
				    }
				    ObserverManager.post("percentage", [0 ,-1]);
				})
				.on('click',function(d,i){
					//click一下转换hide或保持的状态
					var id = d3.select(this).attr('id');
					var idArray = id.split('-');
					var biasy_index = +idArray[2];
					var this_x=this.x.animVal.valueInSpecifiedUnits;
					var this_y=this.y.animVal.valueInSpecifiedUnits;
					var this_width=this.width.animVal.valueInSpecifiedUnits;
					var this_height=this.height.animVal.valueInSpecifiedUnits;
					var routeIndex = GlobalTreeDesArray.indexOf(d.route);
					var add = true;
					if(routeIndex == -1){
						if($("#state-change").hasClass("active")){
							animation_click_reduce_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,biasy_index);
						}else{
							animation_click_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,biasy_index);
						}
					}else{
						if($("#state-change").hasClass("active")){
							animation_click_reduce_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,biasy_index);
						}else{
							animation_click_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,biasy_index);
						}	
					}
					draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
				});
				draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
			}
			//---------------------------------------------------------------------------
			//传入三角形的位置，然后将三角形绘制在对应的位置上
			function draw_adjust_button(this_class)
			{
				var this_x = +svg.select("." + this_class).attr("x"),
					this_y = +svg.select("." + this_class).attr("y"),
					this_width = +svg.select("." + this_class).attr("width"),
					this_height = +svg.select("." + this_class).attr("height");
				var rect_attribute_button={
					height:50,
					biasx:this_x+this_width/2,
					biasy:this_y+this_height,
					cur_id:"ratio_adjust",
					button_shape: (	"M" + 0 + "," + 0 + 
									"L" + -4 + ","+ 12 + 
									"L" + 4 + ","+ 12 +
									"L" + 0 + "," + 0),
					background_color: "black",
					cur_svg:svg
				};		
				if(this_width != 0){
					creat_button(rect_attribute_button);
				}
				function creat_button(rect_attribute_button){
					var width = rect_attribute_button.width;  
					var height = rect_attribute_button.height; 
					var biasx=rect_attribute_button.biasx;
					var biasy=rect_attribute_button.biasy;
					var background_color=rect_attribute_button.background_color;
					var mouseover_function=rect_attribute_button.mouseover_function;
					var mouseout_function=rect_attribute_button.mouseout_function;
					var mouseclick_function=rect_attribute_button.mouseclick_function;
					var shown_string=rect_attribute_button.button_string;
					var font_color=rect_attribute_button.font_color;
					var font_size=rect_attribute_button.font_size;
					var cur_id=rect_attribute_button.cur_id;
					var cur_class=rect_attribute_button.cur_class;
					var cur_data=rect_attribute_button.cur_data;
					var cur_button_shape=rect_attribute_button.button_shape;
					var cur_svg=rect_attribute_button.cur_svg;
						
					var tooltip=d3.selectAll("#tooltip");
					if (typeof(cur_button_shape)=="undefined")
					{
						var button = cur_svg.append("rect");
					}
					else//自定义按钮形状
					{
						var button = cur_svg.append("path")
									 		.attr("d",cur_button_shape)
									 		.attr("stroke","black")
									 		.attr("stroke-width",1);
					}
					button.datum(cur_data)//绑定数据以后，后面的function才能接到d，否则只能接到this
							.on("mouseover",mouseover_function)
							.on("click",mouseclick_function)
							.on("mouseout",function(){
								if (typeof(mouseout_function)!="undefined")
									mouseout_function(this);
								tooltip.style("opacity",0.0);
							})
							.on("mousemove",function(){
								// 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 
								tooltip.style("left", (d3.event.pageX) + "px")
										.style("top", (d3.event.pageY + 20) + "px");
							})
							.attr("class","rect_button triangle")
							.attr("id",cur_id)						
							.attr("style",	"width:"+width+"px;"+
											"height:"+height+"px;"+
											"color:"+font_color+";"+
											"font-size:"+font_size)
							.attr("transform",function(d,i){  
								return "translate(" + (biasx) + "," + (biasy) + ")";  
							}) 
							.attr("fill",function(d,i){  
								return background_color;  
							});
				}
			}
			$("#default").attr("checked",true);
			$("#radial-depth-controller").unbind().on("click", ".level-btn", function(){
				var dep = $(this).attr("level");
				shown_depth = dep;
				var treeDesNow = undefined;
				$("#radial-depth-controller .level-btn").removeClass("active");		
				for (var i = 0; i <= dep; i++)
					$("#radial-depth-controller .level-btn[level=" + i + "]").addClass("active");
				if(GlobalFormerDepth < dep){
					if($("#state-change").hasClass("active")){
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_reduced_barcoded_tree_depthchange_stretch(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j);
						}
					}else{
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_unreduced_barcoded_tree_depthchange_stretch(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j);
						}
					}
				}else if(GlobalFormerDepth > dep){
					if($("#state-change").hasClass("active")){
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_reduced_barcoded_tree_depthchange_shrink(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j);
						}
					}else{
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_unreduced_barcoded_tree_depthchange_shrink(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j);
						}
					}
				}
				GlobalFormerDepth = dep;

				for (var i=0;i<tip_array.length;++i){
					tip_array[i].hide();
				}
				for (var i=0;i<maintain_tooltip_display.length;++i)
				{
					maintain_tooltip_display[i]=false;
				}
			});
			$("#state-change").unbind().click(function(){
				if($("#state-change").hasClass("active")){
					for(var j = 0; j < linearTreeArray.length; j++){
						animation_reduced2unreduced(GlobalFormerDepth, j);
					}
					$("#state-change").removeClass("active");
				}else{
					for(var j = 0; j < linearTreeArray.length; j++){
						animation_unreduced2reduced(GlobalFormerDepth, j);
					}
					$("#state-change").addClass("active");
				}
			});
		    Radial.OMListen = function(message, data) {
		    	if (message == "treeselectsend_radialreceive_highlight"){
		    		var cur_highlight_depth=data;
		    		var changeClass = "hover-depth-" + cur_highlight_depth;
		    		d3.selectAll(".num-" + cur_highlight_depth).classed(changeClass,true);
		    	}
		    	if (message == "treeselectsend_radialreceive_disable_highlight"){
		    		var cur_highlight_depth=data;
		    		var changeClass = "hover-depth-" + cur_highlight_depth;
		    		d3.selectAll(".num-" + cur_highlight_depth).classed(changeClass,false);
		    	}
		    }
		    return Radial;

	}
}