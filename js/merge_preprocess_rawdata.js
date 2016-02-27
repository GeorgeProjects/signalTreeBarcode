//将data合并到init_root中
//如果init_root不是空树，merge的过程就是在做两棵树的合并
//curtreeindex表示当前合并的树的编号
	function merge_preprocess_rawdata(data,init_root,curtreeindex){
		//第一步检查SPE
		for (var i=0;i<data.length;++i)//循环一遍所有数据，建完所有SPE层节点再看下面的节点
		{
			//不是有效数据的暂时丢掉
			if (data[i]["ATM数据"]=="有效数据")
			{
				//传的是地址而不是内容
				//所以修改cur_SPE_group时init_root.children也会变
				var cur_SPE_group=init_root.children;//当前考虑的那组SPE
				var flag_new_SPE=1;

				var cur_SPE=data[i].atm;
				for (var j=0;j<cur_SPE_group.length;++j)//检查一遍当前已经创建出来的SPE层节点
				{
					if (cur_SPE_group[j].name==data[i].atm)//如果已经创建过了，那么就不是新的了
					{
						//如果是对其他树调用merge时创建过的SPE，那么这个SPE至少在两棵树里面出现过的	
						if (cur_SPE_group[j].mark !=curtreeindex)
						{
							cur_SPE_group[j].mark=0;
						}
						flag_new_SPE=0;
						break;
					}
				}				
				//原来没有创建过的SPE号
				if (flag_new_SPE==1)
				{
					var new_SPE_group_length=cur_SPE_group.length+1;

					cur_SPE_group[new_SPE_group_length-1]={
						mark:curtreeindex,
						_depth:1,
						name:cur_SPE,
						description:cur_SPE,
						children:new Array(),//最底层结点没有children这个维度
						//只有最底层的结点有size
						_father:init_root
					}
				}
			}
		}			
		//第二步检查AAL
		for (var i=0;i<data.length;++i)//对于每个数据
		{
			//不是有效数据的暂时丢掉
			if (data[i]["ATM数据"]=="有效数据")
			{
				var cur_SPE=data[i].atm;
				var cur_AAL=data[i].aal;//可能为AAL1/AAL2/AAL5
				
				//循环寻找当前的SPE在树中位置
				for (var j=0;j<init_root.children.length;++j)
				{
					if (init_root.children[j].name==cur_SPE)
					{
						//当前的SPE在树中的位置
						var cur_SPE_position=init_root.children[j];
					}
				}

				var cur_AAL_group=cur_SPE_position.children;
				//当前的SPE的children数
				var cur_AAL_group_length=cur_AAL_group.length;
					
				var flag_new_AAL=1;
				var cur_AAL_index=0;//这个AAL在当前的SPE中的下标位置
				var cur_AAL_position;//当前的AAL在树中的位置

				//循环寻找当前的AAL在树中位置
				for (var j=0;j<cur_AAL_group_length;++j)
				{
					if (cur_AAL_group[j].name==cur_AAL)
					{
						cur_AAL_index=j;
						cur_AAL_position=cur_AAL_group[j];
						flag_new_AAL=0;

						if (cur_AAL_position.mark !=curtreeindex)
						{
							cur_AAL_position.mark=0;
						}
						break;
					}
				}

				//原来没有创建过的AAL
				if (flag_new_AAL==1)
				{
					var new_length_AAL=cur_AAL_group_length+1;
						
					cur_AAL_group[new_length_AAL-1]={
						mark:curtreeindex,
						_depth:2,
						name:cur_AAL,
						description:cur_AAL,
						children:new Array(),//最底层结点没有children这个维度
						//只有最底层的结点有size
						_father:cur_SPE_position
					}
					cur_AAL_index=new_length_AAL-1;
					cur_AAL_position=cur_AAL_group[new_length_AAL-1];
				}
					
					
				//第三步检查VPI_VCI，创建VPI
				var cur_VPI=data[i].vpi;
				var cur_VPI_group=cur_AAL_position.children;
				//当前AAL的children数
				var cur_VPI_group_length=cur_VPI_group.length;
					
				var flag_new_VPI=1;
				var cur_VPI_index=0;//这个VPI在当前的AAL中的下标位置
				var cur_VPI_position;//当前的VPI在树中的位置

				for (var j=0;j<cur_VPI_group_length;++j)
				{
					if (cur_VPI_group[j].name==cur_VPI)
					{
						cur_VPI_index=j;
						cur_VPI_position=cur_VPI_group[j];
						flag_new_VPI=0;

						if (cur_VPI_group[j].mark !=curtreeindex)
						{
							cur_VPI_group[j].mark=0;
						}
						break;
					}
				}

					
				//原来没有创建过的VPI
				if (flag_new_VPI==1)
				{
					var new_length_VPI=cur_VPI_group_length+1;

					cur_VPI_group[new_length_VPI-1]={
						mark:curtreeindex,
						//depth:3,
						_depth:3,
						name:cur_VPI,
						description:cur_VPI,
						children:new Array(),//最底层结点没有children这个维度
						//只有最底层的结点有size：...

						_father:cur_AAL_position
					}
					cur_VPI_index=new_length_VPI-1;
					cur_VPI_position=cur_VPI_group[new_length_VPI-1];
				}
					
					
				//第四步检查VPI_VCI，创建cid
				var cur_CID=data[i].cid;

				//需要检查是否是undefined，因为data数组中有的元素不存在cid分量
				if (cur_CID=="" || typeof(cur_CID)=="undefined")//检查是否有cid
				{
					cur_CID="none";
				}

				var cur_CID_group=cur_VPI_position.children;
				//当前VPI的children分量的length
				var cur_CID_group_length=cur_CID_group.length;
					
				var flag_new_CID=1;
				var cur_CID_index=0;//这个CID在当前的VPI中的下标位置
				var cur_CID_position;//当前的CID在树中的位置

				for (var j=0;j<cur_CID_group_length;++j)
				{
					if (cur_CID_group[j].name==cur_CID)
					{
						cur_CID_index=j;
						cur_CID_position=cur_CID_group[j];
							
						flag_new_CID=0;

						//原来在别的树的这个结点创建过的CID						
						if (cur_CID_group[j].mark !=curtreeindex)
						{
							var new_length_CID=cur_CID_group_length;
							
							cur_CID_group[j].mark=0;

							var cur_CID_numvalue=+data[i].flowSize;

							cur_CID_group[j].trees_values[curtreeindex]=cur_CID_numvalue;

							//size统计该节点在所有树上的值的总和
							cur_CID_group[j].size=0;
							for (var k=0;k<cur_CID_group[j].trees_values.length;++k)
							{
								if (typeof(cur_CID_group[j].trees_values[k])!="undefined")
								{
									cur_CID_group[j].size=(+cur_CID_group[j].size)+(+cur_CID_group[j].trees_values[k]);
								}
							}
						}					
						break;
					}
				}

				//原来没有创建过的CID
				if (flag_new_CID==1)
				{
					var new_length_CID=cur_CID_group_length+1;

					var cur_CID_numvalue=+data[i].flowSize;
						
					cur_CID_group[new_length_CID-1]={
						mark:curtreeindex,
						_depth:4,
						name:cur_CID,
						description:cur_CID,
						//children:new Array(),//最底层的CID层结点没有children这个维度
						//size统计该节点在所有树上的值的总和
						size:cur_CID_numvalue,//只有最底层的CID层结点有size：...

						_father:cur_VPI_position
					}
					cur_CID_group[new_length_CID-1].trees_values=[];
					cur_CID_group[new_length_CID-1].trees_values[curtreeindex]=cur_CID_numvalue;
					
					cur_CID_index=new_length_CID-1;
					cur_CID_position=cur_VPI_group[new_length_CID-1];
				}			
			}
		}
		aggregate_separate_tree_value(init_root);
	}


//在并集树只有cid层的结点记录了每个结点在每个tree上的val的情况下，向上导出所有节点的在每个tree上的val的情况
//并且给每个结点记录上其route
	function aggregate_separate_tree_value(init_root)
	{
		//cur_node_layer0是人为添加的结点
		var cur_node_layer0=init_root;

		cur_node_layer0.route="route"+"r";

		//记录所有的tree在该结点处的值
		var layer0_trees_values=[];

		for (var i=0;i<cur_node_layer0.children.length;++i)
		{
			//cur_node_layer1是一个SPE层节点
			var cur_node_layer1=cur_node_layer0.children[i];
			//cur_node_layer1.route="route"+String(i);
			cur_node_layer1.route="route"+"r"+String(i);

			//记录所有的tree在该结点处的值
			var layer1_trees_values=[];

			for (var j=0;j<cur_node_layer1.children.length;++j)
			{
				//cur_node_layer2是一个AAL层节点
				var cur_node_layer2=cur_node_layer1.children[j];
				cur_node_layer2.route="route"+"r"+String(i)+"_"+String(j);

				//记录所有的tree在该结点处的值
				var layer2_trees_values=[];
				
				for (var k=0;k<cur_node_layer2.children.length;++k)
				{
					//cur_node_layer3是一个VPI层节点
					var cur_node_layer3=cur_node_layer2.children[k];
					cur_node_layer3.route="route"+"r"+String(i)+"_"+String(j)+"_"+String(k);

					//记录所有的tree在该结点处的值
					var layer3_trees_values=[];

					for (var l=0;l<cur_node_layer3.children.length;++l)
					{
						//cur_node_layer4是一个CID层节点
						//CID层是叶子层
						var cur_node_layer4=cur_node_layer3.children[l];
						cur_node_layer4.route="route"+"r"+String(i)+"_"+String(j)+"_"+String(k)+"_"+String(l);

						//对每个被合并的树提供的值进行循环
						//cur_node_layer4.trees_values.length是被合并的树的数量上限
						for (var m=0;m<cur_node_layer4.trees_values.length;++m)//往上层聚集
						{
							//如果原来累计过
							if (isInt(layer3_trees_values[m]))
								layer3_trees_values[m]=layer3_trees_values[m]+cur_node_layer4.trees_values[m];
							else//没有累计过
								layer3_trees_values[m]=cur_node_layer4.trees_values[m];
						}
					}


					cur_node_layer3.trees_values=[];//先开数组之后才能对数组元素赋值
					//cur_node_layer4.trees_values.length是被合并的树的数量上限
					for (var m=0;m<cur_node_layer4.trees_values.length;++m)
					{
						cur_node_layer3.trees_values[m]=layer3_trees_values[m];
						if (! isInt(cur_node_layer3.trees_values[m]))
						{
							cur_node_layer3.trees_values[m]=0;
						}
					}
					for (var m=0;m<cur_node_layer3.trees_values.length;++m)
					{
						if (isInt(layer2_trees_values[m]))
							layer2_trees_values[m]=layer2_trees_values[m]+cur_node_layer3.trees_values[m];
						else
							layer2_trees_values[m]=cur_node_layer3.trees_values[m];
					}
					
				}


				cur_node_layer2.trees_values=[];//先开数组之后才能对数组元素赋值
				//cur_node_layer3.trees_values.length也是被合并的树的数量上限
				for (var m=0;m<cur_node_layer3.trees_values.length;++m)
				{
					cur_node_layer2.trees_values[m]=layer2_trees_values[m];
					if (! isInt(cur_node_layer2.trees_values[m]))
					{
						cur_node_layer2.trees_values[m]=0;
					}
				}
				for (var m=0;m<cur_node_layer2.trees_values.length;++m)
				{
					if (isInt(layer1_trees_values[m]))
						layer1_trees_values[m]=layer1_trees_values[m]+cur_node_layer2.trees_values[m];
					else
						layer1_trees_values[m]=cur_node_layer2.trees_values[m];
				}
			}


			cur_node_layer1.trees_values=[];//先开数组之后才能对数组元素赋值
			//cur_node_layer2.trees_values.length也是被合并的树的数量上限
			for (var m=0;m<cur_node_layer2.trees_values.length;++m)
			{
				cur_node_layer1.trees_values[m]=layer1_trees_values[m];
				if (! isInt(cur_node_layer1.trees_values[m]))
				{
					cur_node_layer1.trees_values[m]=0;
				}
			}
			for (var m=0;m<cur_node_layer1.trees_values.length;++m)
			{
				if (isInt(layer0_trees_values[m]))
					layer0_trees_values[m]=layer0_trees_values[m]+cur_node_layer1.trees_values[m];
				else
					layer0_trees_values[m]=cur_node_layer1.trees_values[m];
			}
		}


		cur_node_layer0.trees_values=[];//先开数组之后才能对数组元素赋值
		//cur_node_layer1.trees_values.length也是被合并的树的数量上限
		for (var m=0;m<cur_node_layer1.trees_values.length;++m)
		{
			cur_node_layer0.trees_values[m]=layer0_trees_values[m];
			if (! isInt(cur_node_layer0.trees_values[m]))
			{
				cur_node_layer0.trees_values[m]=0;
			}
		}
		
	}

//判断一个数字或者字符串里面有没有数字以外的值
	function isInt(str){
		var reg = /^(-|\+)?\d+$/ ;
		return reg.test(str);
	}

//传入root以后，将tree的每个结点的孩子的顺序，按照直接分叉从少到多，对每个结点的children重新排序
//直接分叉数量相同的结点暂时先不规定顺序
function reorder_tree(root)
{
	reorder_tree_traverse(root);
	function reorder_tree_traverse(root)
	{
		if (typeof(root)=="undefined")
			return;

		var cur_children_group=root.children;
		if (typeof(root.children)=="undefined")
			return;
		
		var cur_children_group_size=cur_children_group.length;
		if (cur_children_group_size!=1)
		{
			for (var i=cur_children_group_size-1;i>=0;--i)
			{
				for (var j=i-1;j>=0;--j)
				{
					var cur_child_1=cur_children_group[j];
					var cur_child_2=cur_children_group[i];

					var cur_child_1_branchnum=0;
					if (typeof(cur_child_1.children)!="undefined")
						cur_child_1_branchnum=cur_child_1.children.length;

					var cur_child_2_branchnum=0;
					if (typeof(cur_child_2.children)!="undefined")
						cur_child_2_branchnum=cur_child_2.children.length;

					//要让孩子数更少的结点排在前面
					if (cur_child_1_branchnum > cur_child_2_branchnum)
					{

						cur_children_group[i]=cur_child_1;
						cur_children_group[j]=cur_child_2;
					}
				}
			}
		}
		//对每个子递归地整理顺序
		for (var i=0;i<cur_children_group_size;++i)
		{
			reorder_tree_traverse(root.children[i]);
		}
	}
}	




//传入root以后，对于每个结点，标记这个结点与他的所有兄弟组成的结点组中
//按照下标来看，在他的下标之前包括他本身，有多少个连续的子树结构相同的兄弟结点
function cal_repeat_time(root)
{
	cal_repeat_time_traverse(root);
	function cal_repeat_time_traverse(root)
	{
		if (typeof(root)=="undefined")
			return;

		if (typeof(root._father)=="undefined")
		{
			root.continuous_repeat_time=1;
		}
		else
		{
			var root_sibling_group=root._father.children;
			var root_route=root.route;
			var root_index=0;//记录当前的root在其父的孩子数组中的下标
			for (var i=0;i<root_sibling_group.length;++i)
			{
				var cur_sibling=root_sibling_group[i];
				if (cur_sibling.route==root_route)
				{
					var root_index=i;
					break;
				}
			}
			var count_continuous_same_subtree=1;

			for (var i=root_index-1;i>=0;--i)
			{
				var cur_sibling=root_sibling_group[i];
				var is_equal=tree_equality_compare(root,cur_sibling);
				if (is_equal)//如果相等
				{
					count_continuous_same_subtree=count_continuous_same_subtree+1;
				}
				else
					break;
			}
			root.continuous_repeat_time=count_continuous_same_subtree;
		}


		//对每个子递归计算
		var cur_children_group=root.children;
		if (typeof(root.children)=="undefined")
			return;
		var cur_children_group_size=cur_children_group.length;
		for (var i=0;i<cur_children_group_size;++i)
		{
			cal_repeat_time_traverse(root.children[i]);
		}
	}

	//比较root1和root2对应的树的结构是否完全相同，返回0或1
	function tree_equality_compare(root1,root2)
	{
		if (typeof(root1)=="undefined" && typeof(root2)=="undefined")
			return 1;
		if (typeof(root1)!="undefined" && typeof(root2)!="undefined")
		{
			if (typeof(root1.children)=="undefined" && typeof(root2.children)=="undefined")
				return 1;
			if (typeof(root1.children)!="undefined" && typeof(root2.children)!="undefined")
			{
				if (root1.children.length == root2.children.length)
				{
					var flag=1;
					for (var i=0;i<root1.children.length;++i)
					{
						flag=flag && tree_equality_compare(root1.children[i],root2.children[i]);
					}
					return flag;
				}
			}
		}
		return 0;
	}
}

//利用cal_repeat_time得到的结果
//传入root以后，对于包括root的这个子树的每个结点，以及root的所有兄弟结点（但不包括兄弟结点的子孙节点）
//标记这个结点与他的所有兄弟组成的结点群中
//按照下标来看，将连续的拥有相同的结构的兄弟归为同一组时，每个结点所处的局部的组号
function cal_nth_different_subtree_traverse(root)
{
	cal_nth_different_subtree_traverse(root);
	//传入root以后，对于包括不root的这个子树的每个结点（从root的孩子开始看），
	//标记这个结点与他的所有兄弟组成的结点群中按照下标来看，
	//将连续的拥有相同的结构的兄弟归为同一组时，每个结点所处的局部的组号
	function cal_nth_different_subtree_traverse(root)
	{
		if (typeof(root)=="undefined")
			return;
		if (typeof(root._father)=="undefined")
		{
			//如果root没有father，那么他就没有兄弟，那么他的就是唯一的一组，是第一组
			root.nth_different_subtree=1;
		}
		else
		{
			var acc_nth_different_subtree=0;

			var root_sibling_group=root._father.children;

			for (var i=0;i<root_sibling_group.length;++i)
			{
				var cur_node=root_sibling_group[i];
				if (cur_node.continuous_repeat_time==1)
				{
					acc_nth_different_subtree=acc_nth_different_subtree+1;
				}
				cur_node.nth_different_subtree=acc_nth_different_subtree;
			}
		}

		var cur_children_group=root.children;
		if (typeof(root.children)=="undefined")
			return;
		var cur_children_group_size=cur_children_group.length;
		//对每个子递归计算
		for (var i=0;i<cur_children_group_size;++i)
		{
			cal_nth_different_subtree_traverse(root.children[i]);
		}
	}
}

function cal_repeat_group_size(root)
{
	cal_repeat_group_size_traverse(root);
	function cal_repeat_group_size_traverse(root)
	{
		if (typeof(root)=="undefined")
			return;

		if (typeof(root._father)=="undefined")
		{
			root.maximum_continuous_repeat_group_size=1;
		}
		else
		{
			var root_sibling_group=root._father.children;
			var root_route=root.route;
			var root_index=0;//记录当前的root在其父的孩子数组中的下标
			for (var i=0;i<root_sibling_group.length;++i)
			{
				var cur_sibling=root_sibling_group[i];
				if (cur_sibling.route==root_route)
				{
					var root_index=i;
					break;
				}
			}

			if (typeof(root.maximum_continuous_repeat_group_size)=="undefined")
			{
				
				root.maximum_continuous_repeat_group_size=root.continuous_repeat_time;

				for (var i=root_index-1;i>=0;--i)
				{
					var cur_sibling=root_sibling_group[i];
					if (cur_sibling.nth_different_subtree == root.nth_different_subtree)
					{
						cur_sibling.maximum_continuous_repeat_group_size=root.maximum_continuous_repeat_group_size;
					}
				}
			}
			else if (root.maximum_continuous_repeat_group_size < root.continuous_repeat_time)
			{
				
				root.maximum_continuous_repeat_group_size=root.continuous_repeat_time;

				for (var i=root_index-1;i>=0;--i)
				{
					var cur_sibling=root_sibling_group[i];
					if (cur_sibling.nth_different_subtree == root.nth_different_subtree)
					{
						cur_sibling.maximum_continuous_repeat_group_size=root.maximum_continuous_repeat_group_size;
					}
				}
			}
		}

		

		//对每个子递归计算
		var cur_children_group=root.children;
		if (typeof(root.children)=="undefined")
			return;
		var cur_children_group_size=cur_children_group.length;
		for (var i=0;i<cur_children_group_size;++i)
		{
			cal_repeat_group_size_traverse(root.children[i]);
		}
	}

	//比较root1和root2对应的树的结构是否完全相同，返回0或1
	function tree_equality_compare(root1,root2)
	{
		if (typeof(root1)=="undefined" && typeof(root2)=="undefined")
			return 1;
		if (typeof(root1)!="undefined" && typeof(root2)!="undefined")
		{
			if (typeof(root1.children)=="undefined" && typeof(root2.children)=="undefined")
				return 1;
			if (typeof(root1.children)!="undefined" && typeof(root2.children)!="undefined")
			{
				if (root1.children.length == root2.children.length)
				{
					var flag=1;
					for (var i=0;i<root1.children.length;++i)
					{
						flag=flag && tree_equality_compare(root1.children[i],root2.children[i]);
					}
					return flag;
				}
			}
		}
		return 0;
	}
}



//把traverse和需要使用的局部静态变量包起来
function linearlize(root,target_linear_tree)
{
	//traverse递归中要保持的static变量
	var cur_index = 0;
	//传入树根和用于存储线性化的树的数组
	//traverse中按深度优先进行线性化以及标记每个结点的linear_index
	function traverse(root,target_linear_tree)
	{
		if (typeof(root)=="undefined")
			return;

		root.linear_index=cur_index;//记录每个结点在数组中的index
		target_linear_tree[cur_index]=root;

		if (typeof(root.children)=="undefined")
			return;

		var cur_root_children_num=root.children.length;
		for (var i=0;i<cur_root_children_num;++i)
		{
			cur_index=cur_index+1;
			traverse(root.children[i],target_linear_tree);
		}
	}
	traverse(root,target_linear_tree);
}