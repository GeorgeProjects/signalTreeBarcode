(function() {
    this.dataCenter = {};
})();

var mainController = function(){
    var treeSelectView, radialView, treeCompareView, parsetView;
    var datasetID = [];
    function loadStatData() {
        var dtd = $.Deferred();
        d3.json("stat.json", function(error, data){
            if (error) {
                dtd.reject();
                throw error;
            }
            else {
                dataCenter.stats = data;
            }
            dtd.resolve();
        });
        return dtd.promise();
    }

    function initInteractionHandler() {
        ObserverManager.addListener(this);
    }
    dataCenter.datasets = [];
    this.OMListen = function(message, data) {
        if (message == "addData") {
            var id = data;
            var processor = new sigtree.dataProcessor();
            var dataset = {
                id: id,
                processor: processor
            }
            dataCenter.datasets.push(dataset);
            dataCenter.datasets.sort(function(obj1,obj2){
                return obj1.id - obj2.id;
            })
            var file = dataCenter.stats[id].file;
            file = "data/" + file;
            var defers = dataset.processor.loadData(file);
            $.when(defers)
                .done(function() {
                    //var listeners = _.without(ObserverManager.getListeners(), radialView, treeCompareView, parsetView); //remove old views in listeners
                    //ObserverManager.setListeners(listeners);
                    console.log(dataCenter.datasets);
                    radial(dataCenter.datasets);
                    //for(var i = 0; i < dataCenter.datasets.length; i++){
                        //radial(i);
                    //}
                });
        }else if(message == "removeData"){
            var id = data;
            var processor = new sigtree.dataProcessor();
            var dataset = {
                id: id,
                processor: processor
            }
            for(var i = 0;i < dataCenter.datasets.length;i++){
                if(id == dataCenter.datasets[i].id){
                    dataCenter.datasets.splice(i,1);
                         d3.select('#radial')
                            .selectAll(".rect_background_index-"+i)
                            .remove();
                    break;
                }
            }
            radial(dataCenter.datasets);
        }
    }
    initInteractionHandler();
    $.when(loadStatData())
        .done(function() {
            treeSelectView = treeSelect();         
        })

}

$(document).ready(function() {
    mainController();
})


