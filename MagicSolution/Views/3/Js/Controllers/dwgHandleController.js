define([
    "angular"
    , "MagicSDK"
    , "angular-dxf-viewer"
    , "angular-ui-bootstrap"
    , "tree-view-r3"
    
], function (angular,MF) {
    return angular
        .module("dwgHandle", ["dxfViewer", "ui.bootstrap", "treeViewR3"])
        .controller(
        "dwgHandleController",
        ["config", "$timeout","$compile","$scope",
            function (config, $timeout, $compile,$scope) {
                var self = this;
              
                self.selectedFiles = {};
                self.viewers = {};
                self.mode = 'webgl';
                self.mainContentPreview = 'dwg_preview_r3';
                self.rootForDxf = config.rootForDxf;
                self.treeModel = [];
                self.initTree = false;
                self.newViewer = true;
                self.layerImportOrder = ['$RM'];
                //self.tooltip = config.rowData.handle_tooltip;
 
                self.onShowViewerTooltip = function (e) {
                    var toolTipDesc = '';
                    try {
                        $.each(self.selectedFiles, function (i, v) {
                            toolTipDesc = v.tooltip.filter(function (desc) {
                                if (desc.handles == e.handle) {
                                    return desc
                                }
                            })[0].tooltip;
                        });
                    }
                    catch (ex) {
                        toolTipDesc = 'Error toolTip';
                    }

                    return toolTipDesc === '' ? self.tooltip : toolTipDesc;
                }

                self.onSetViewerData = function setViewerData(data, fileName) {
                    if (data) {
                        self.viewers[fileName] = data;
                        self.resolveViewersIfReady();
                    }
                    else {
                        delete self.viewers[fileName];
                    }
                };

                self.resolveViewersIfReady = function resolveViewersIfReady() {
                    var allContained = true;
                    $.each(self.selectedFiles, function (i, file) {
                        if (!(file.fileName in self.viewers)) {
                            allContained = false;
                            return false;
                        }
                    });
                    if (allContained) {
                        self.viewersReady.resolve();
                    }
                    return allContained;
                };

                self.getViewerContainerClass = function () {
                    if (self.selectedFiles.length == 1) {
                        self.mode = '';
                        return 'col-sm-' + 12 + ' ' +  self.mainContentPreview;
                        
                    }

                    var colVal = Math.floor(12 / (self.selectedFiles.length ));
                    colVal = colVal < 3 ? 3 : colVal > 6 ? 6 : colVal;
                    self.mode = 'svg';
                    return 'col-sm-' + colVal + ' ' + self.mainContentPreview;
                } 

                self.init = function init() {
                    self.selectedFiles = config.fileDwg.files;
                    self.tooltip = config.rowData.handle_tooltip;                    
                    self.viewersReady = $.Deferred();     
                    self.getDataTree();
                    self.getPolyline()
                }

                self.getPolyline = function getPolyline() {


                    $.each(self.selectedFiles, function (i, v) {
                        v.polylines = [];


                        var allPolilyne = {}
                        
                    
                        v.rowGrid.map(function (row) {
                            if (row.checked) {
                                if (!allPolilyne[row.color]) {

                                    allPolilyne[row.color] = {
                                        color: row.color,
                                        handles: []
                                    }

                                    if (-1 == $.map(allPolilyne[row.color].handles, function (handle) { return handle }).indexOf(row.handle)) {
                                        allPolilyne[row.color].handles.push(row.handle);
                                    }
                                } else {
                                    if (-1 == $.map(allPolilyne[row.color].handles, function (handle) { return handle }).indexOf(row.handle)) {
                                        allPolilyne[row.color].handles.push(row.handle);
                                    }
                                }
                            }
                        });


                        for (c in allPolilyne) {
                            v.polylines.push(allPolilyne[c]);
                        }

                    });
                }

                self.triggerWindowResize = function triggerWindowResize() {

                    window.dispatchEvent(new Event('resize'));
                };

                self.onChangeColor = function (e) {
                    console.log(e.row);
                    
                    $.each(e.$parent.file.polylines, function (i, v) {
                        $.each(v.handles, function (ii,vv) {
                            if (e.row.handle == vv) {
                                e.$parent.file.polylines[i].color = e.row.color
                            }
                        })
                    })

                    var polylines = e.$parent.file.polylines;
                    
                    e.$parent.file.polylines = [];

                    $timeout(function () {
                        e.$parent.file.polylines = polylines;
                    }, 500)
                    //e.$parent.file.polylines = polylines;   
                }

                self.onChangeChecked = function (e) {
                    self.getPolyline();


                }

                self.getDataTree = function getDataTree() {
                    try {

                        self.treeModel = [];

                        return MF.api.get({
                            storedProcedureName: "core.DWG_get_data_for_tree_log",
                            data: {
                                ApplicationInstanceId: window.ApplicationInstanceId
                            }
                            ,dataRow : config.rowData
                        })
                            .then(function (result) {
                                if (!result[0]) { return }

                                
                                self.treeModel = result[0];


                                angular.element($("#treeRefTree")).empty().append($compile('<tree-view-r3 change="h.getPolyline(node)" b-selected-all="true" model="h.treeModel" source="h.treeModel"></tree-view-r3>')($scope));

                                //$.each(result[0], function (i,v) {
                                //    self.treeModel.push(v);
                                //})

                                self.initTree = true;
                                

                            }, function (err) {
                                console.log(err);
                            });
                    }
                    catch(ex){

                    }
                }

                self.init();   


            }
        ]
        );
});
