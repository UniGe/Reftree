define([
    "angular",
    "MagicSDK",
    "tree-view-r3",
    "angular-kendo",
    "angular-magic-form-sp",
    "angular-ui-bootstrap",
    "angular-magic-grid",
    "angular-easy-map",
    "angular-magic-action-menu",
    "reftree-action-menu",
    "angular-magic-grid-sp",
], function (angular, MF, tree) {
    return angular
        .module("Tree", [
            "treeViewR3",
            "kendo.directives",
            "magicFormSp",
            "ui.bootstrap",
            "treeViewR3",
            "magicGrid",
            "easyMap",
            "magicActionMenu",
            "reftreeActionMenu",
            "magicGridSp",
        ])
        .controller("TreeController", [
            "config",
            "$timeout",
            "$scope",
            "$compile",
            "$uibModal",
            "$sce",

            // "c",

            function (config, $timeout, $scope, $compile, $uibModal, $sce
                //, $uibModalInstance
            ) {

                var self = this;
                window.treeControllerR3 = self;


                config.rowData = [];
                self.modalId = config.modalId;
                self.localNodes = [];
                self.htmlVisibe = false;
                self.treeDataSp = [];
                self.htmlPage = "";
                self.parentId = 0;
                self.bMapsVisible = false;
                self.templateForm = '<div id="divAppendContainer" class="nascondi" ng-include="' + "t.includeInPage" + '"></div>';
                self.bShowRefresh = false;
                self.selectedNode = [];
                self.mapClass = "col-md-6";
                self.selectedtext = "";
                self.endToInit = false;
                self.titleScheda = "";
                self.reloadTree = true;
                self.objectList = [];
                self.includesVersion = window.includesVersion;
                self.bTreeVisible = true;
                // map
                self.shownMarkersLocationIds = [];
                self.initialMarkersLocationIds = [];
                self.locations = {};
                self.gridToRefresh = [];
                self.onRefresh = true;
                self.initGridAction = false;

                self.actionTemplate = '<div ng-repeat="father in rtmm.fatherAction"  class="btn-group navbar-btn" style="margin:3px;">\
                  <button type="button" style="padding: 5px 10px; border-top-left-radius: 8px;border-bottom-left-radius: 8px;" class="btn btn-success">{{father.name}}</button> \
                  <button type="button" style="padding: 5px 10px; border-top-right-radius: 8px;border-bottom-right-radius: 8px;"class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">\
                  <span class="caret"></span>\
                  </button>\
                  <ul  id="mnav" class="dropdown-menu scrollable-menu-r3" role="menu">\
                  <li class="dropdown-item" ng-repeat="action in rtmm.fatherAction[$index].action"><a  ng-click="rtmm.dispatch(action)">{{action.label}}</a></li>\
                  </ul>\
                  </div>'

                // map

                //configuration
                self.nodeDwg = [];
                self.dwgConfig = config.dwgViewer;
                self.filterDropDown = [];
                self.actionRefresh = false;
                self.actionGroupBy = [];
                self.actionList = [];
                self.iframeEditContainer = "";
                self.includeForm = config.actioncommand.includeForm ? config.actioncommand.includeForm : "HTML";
                self.actionShow = config.action ? config.action.actionShow ? config.action.actionShow : false : false;
                self.actionGrid = config.action ? config.action.actionGrid ? config.action.actionGrid : "" :"";
                self.actionPk = config.action ? config.action.actionPk ? config.action.actionPk : "" : "";

                self.filterGridDwg = self.filterGridDwg = !!self.dwgConfig ? {
                    logic: "or", filters: [{
                        field: !!self.dwgConfig.dwg_key ? self.dwgConfig.dwg_key : "",
                        operator: "eq",
                        value: 0
                    }]
                } : "";

                //$watch
                $scope.$watch("gdv.initGridAction", function (newValue) {
                    if (!newValue) {
                        angular.element($("div[name='divAction']")).empty();
                    }
                });

                $scope.$watch('t.selectedNode', function (newNode, oldNode) {
                    oldNode.showIcon = false;
                    if (newNode) {

                        angular.element($("#nocr_" + oldNode.TREE_ID)).removeClass('selectedNode-r3');
                        angular.element($("#nocr_" + newNode.TREE_ID)).addClass('selectedNode-r3');
                    } else {
                        self.loadHtmlForm("");
                    }
                });

                $scope.$on('onAfterRender', function (e) {
                    $timeout(function () {
                        self.setTree();
                        doModal(false)
                    }, 500);

                });
                
                self.setMarkersFromGridSelection = function setMarkersFromGridSelection() {

                    self.shownMarkersLocationIds = $.map(self.objectList, function (value) {

                        self.locations[value.LOCATION_ID] = {
                            ID: value.parentId,
                            longitude: value.longitude ? value.longitude :0,
                            latitude: value.latitude ? value.latitude : 0 ,
                            color: value.color
                        };
                        return value.LOCATION_ID;
                    });

                    self.initialMarkersLocationIds = self.shownMarkersLocationIds.slice(0);
                    self.createMarkers();
                };

                self.createMarkers = function createMarkers() {
                    self.mapMarkers = $.map(self.shownMarkersLocationIds, function (LOCATION_ID) {
                        return {
                            id: self.locations[LOCATION_ID].ID,
                            LOCATION_ID: LOCATION_ID,
                            longitude: self.locations[LOCATION_ID].longitude ? self.locations[LOCATION_ID].longitude : 0,
                            latitude: self.locations[LOCATION_ID].latitude ? self.locations[LOCATION_ID].latitude : 0,
                            color: self.locations[LOCATION_ID].color,
                            events: {
                                click: self.onMapMarkerClick,
                                mouseover: self.onMapMarkerMouseover,
                            }
                        };
                    });
                };

                self.onMapMarkerClick = function onMapMarkerClick(e) {

                    $.each(self.treeDataSp, function (i, v) {
                        if (v.TREE_ID == e.data.id) {
                            angular.element('#nocr_' + v.TREE_ID).triggerHandler('click');
                            angular.element('#nocr_' + v.TREE_ID)[0].scrollIntoView({ behavior: "smooth", block: "end", inline: "start" });
                            return
                        }
                    })
                }

                self.onMapMarkerMouseover = function (marker) {
                    var timestamp = Date.now();
                    var $content = $(mediumSpinnerHTML);
                    self.mapsTooltipTimeStamp = timestamp;
                    MF.api.get({
                        storedProcedureName: window.gmapDetailSP,
                        data: marker.data,
                    }).then(function (result) {
                        if (self.mapsTooltipTimeStamp === timestamp) {
                            if (result.length) {
                                var html = '';
                                $.each(result[0], function (i, val) {
                                    html += val.label + ': ' + val.Value + '<br />';
                                });
                                $content.html(html);
                            } else {
                                $content.html('');
                            }
                        }
                    }, function (error) {
                        if (self.mapsTooltipTimeStamp === timestamp) {
                            $content.html('');
                            console.error(error);
                        }
                    });
                    return $content[0];
                };

                self.openViewCad = function openViewCad() {
                    try {

                        var dwgGrid = $("#" + self.modalId).find('div[gridname="' + self.dwgConfig.gridName + '"]');
                        dwgGrid.data('kendoGrid').dataSource.options.schema.model.id = self.dwgConfig.dwg_key;
                        dwgGrid.data('kendoGrid').tbody.find('tr').addClass('k-state-selected');

                        if (!dwgGrid.data('kendoGrid').select().length) {
                            kendoConsole.log(getObjectText("selectatleastone"), true);
                            return;
                        }


                        $(dwgGrid).find('a[title="2D viewer"]').parent().triggerHandler('click');

                        $("#" + self.modalId).css({ display: 'none' });
                        self.onRefresh = false;

                        angular.element($("#templateFormContainer")).empty();
                        self.iframeVisible = false;
                    }
                    catch (err) {
                        console.log(err);
                        kendoConsole.log(getObjectText("selectatleastone"), true);
                        return;
                    }
                    //self.showGridDwg(dwgGrid.find('a[title="2D viewer"]'));
                }

                self.loadHtmlForm = function loadHtmlForm(nodehtmlPage) {


                    if (self.includeForm == "HTML") {
                        doModal(true);

                        self.includeInPage = "";
                        self.includeInPage = nodehtmlPage === "" ? self.htmlPage : nodehtmlPage;

                        angular.element($("#templateFormContainer")).empty().append($compile(self.templateForm)($scope, function (clonedElement) {

                            $timeout(function () {
                                doModal(false);
                            }, 3000);
                        }));
                    }
                    else {

                        self.iframeEditContainer = window.location.protocol + "//" + window.location.host + "/app#/" + (config.model.isNew() ? "new" : "edit") + "/" + config.rowData.htmlPage + "/" + config.rowData.id;
                        var iFrame = $('<iframe id="editFrameContainer" class="myFrame" src="' + self.iframeEditContainer + '" style="width:100%; height:90vh; border: none;"></iframe>');
                        $("#editPageIframe").empty();
                        $("#editPageIframe").append(iFrame);

                        iFrame.load(function () {
                            self.iframeVisible = false;

                            $timeout(function () {

                                var oStyle = "<style type='text/css'>  .page-title{display:none;} .tab-pane{height:90vh;} .panel-info{height:auto !important;} .grid-stack-item{ height: auto !important; top: auto !important; display: contents; } .page-content { background-color: white;} </style>";

                                $('#editFrameContainer').contents().find("body").append($(oStyle));

                                self.iframeVisible = true;
                                doModal(false);
                            }, 3000);

                            //window.frames["editFrameContainer"].contentDocument.oncontextmenu = function () { return false; };
                        })


                        doModal(true);

                        $timeout(function () {

                            var oStyle = "<style type='text/css'>  .page-title{display:none;} .tab-pane{height:90vh;} .panel-info{height:auto !important;} .grid-stack-item{ height: auto !important; top: auto !important; display: contents; } .page-content { background-color: white;} </style>";

                            $('#editFrameContainer').contents().find("body").append($(oStyle));

                            self.iframeVisible = true;
                            doModal(false);
                        }, 3000);

                    }

                    if (!window.jqueryEditRefTreeGrid) {

                        window.jqueryEditRefTreeGrid = { rowData: config.rowData };
                    }
                    else {
                        window.jqueryEditRefTreeGrid.rowData = config.rowData;
                    }

                    config.controller = self;
                    window.jqueryEditRefTreeGrid.controller = config.controller;

                }

                self.onclickIconTree = function onclickIconTree(node) {
                    window.open(window.location.protocol + "//" + window.location.host + "/app#/" + (config.model.isNew() ? "new" : "edit") + "/" + node.htmlPage + "/" + node.id);
                }

                self.onTreeClick = function (node) {

                    self.iframeVisible = false;
                    config.rowData = node;
                    self.selectedNode = node;
                    config.model.id = node.TREE_ID;

                    $.each(self.mapMarkers, function (i, v) {
                        if (v.id == node.TREE_ID) {
                            v.color = "#E01F25";
                        }
                        else {
                            v.color = "#002F80";
                        }
                    });

                    self.loadHtmlForm(node.htmlPage);

                    if (self.actionShow) {
                        self.initGridAction = false;
                        $timeout(function () {
                            self.onShowAction();
                        }, 2000);   
                    }
                }

                self.changeCheck = function changeCheck(node) {
                    if (!node.checked) {
                        for (var i = self.nodeDwg.length - 1; i >= 0; i--) {
                            if (self.nodeDwg[i] === node.TREE_ID) {
                                self.nodeDwg.splice(i, 1);
                            }
                        }
                    } else {
                        self.nodeDwg.push(node.TREE_ID);
                    }



                    self.filterGridDwg = !!self.dwgConfig ? { logic: "or", filters: [{ field: !!self.dwgConfig.dwg_key ? self.dwgConfig.dwg_key : "", operator: "eq", value: 0 }] } : "";


                    $.each(self.nodeDwg, function (i, v) {
                        self.filterGridDwg.filters.push({ field: self.dwgConfig.dwg_key, operator: "eq", value: v })
                    });


                    var dwgGrid = $("#containerModalR3").find('div[gridname="' + self.dwgConfig.gridName + '"]');
                    dwgGrid.data('kendoGrid').dataSource.read();
                    dwgGrid.data('kendoGrid').refresh();
                    dwgGrid.data('kendoGrid').tbody.find('tr').addClass('k-state-selected');

                    $timeout(function () {

                        doModal(false);

                    }, 1000)

                }

                self.onCheckChange = function (node) {
                    doModal(true);
                    self.changeCheck(node);
                }

                config.onClose = function () {
                    $scope.$destroy();
                   
                }

                self.onRefresh = function ($scope) {
                    self.loadHtmlForm();
                }
               
                self.init = function init() {

                    doModal(true);
                    self.localNodes = [];
                    self.treeDataSp = [];


                    MF.api.get({
                        storedProcedureName: config.actioncommand.storedProcedure,
                        filterText: $("#input-search").val(),
                        data: {
                            gridname: config.model
                        }
                    }).then(
                        function (result) {
                            $.each(result, function (i) {
                                switch (i) {
                                    case 0:
                                        $.each(result[i], function (i, v) {
                                            var oObj = [];
                                            oObj.htmlPage = v.htmlPage;
                                            oObj.parentId = v.parentId;
                                            oObj.bMapsVisible = v.mapsVisible;
                                            oObj.mapClass = self.bMapsVisible ? "col-md-6" : "col-md-12";
                                            oObj.titleScheda = v.name;
                                            oObj.LOCATION_ID = v.LOCATION_ID;
                                            oObj.longitude = v.LOCATION_LONGITUDE;
                                            oObj.latitude = v.LOCATION_LATITUDE;
                                            oObj.color = v.color;
                                            oObj.mapFormTemplate = v.mapFormTemplate;


                                            self.objectList.push(oObj);
                                        });
                                        self.setMarkersFromGridSelection();
                                        break;
                                    case 1:
                                        $.each(result[i], function (i, v) {
                                            self.treeDataSp.push(v);
                                        });
                                        break;
                                    case 2:
                                        $.each(result[i], function (i, v) {
                                            self.filterDropDown.push(v);
                                        });
                                        break;
                                    //griglie da refresh
                                    case 3:
                                        $.each(result[i], function (i, v) {
                                            self.gridToRefresh.push(v);
                                        });
                                        break;
                                }

                                //$timeout(function () {
                                //    doModal(false)
                                //}, 500);

                                //doModal(false);
                            });

  
                            angular.element($("#treeRefTree")).empty().append($compile('<tree-view-r3 search="t.findFilter()" change="t.onCheckChange(node)" selected-node="t.selectedNode" id="treeAsset" click="t.onTreeClick(node)" b-filter-tree="false" model="t.treeDataSp" model-drop="t.filterDropDown" source="t.treeDataSp" iconClick="t.onclickIconTree(node)"></tree-view-r3>')($scope));

                        },
                        function (err) {
                            console.log(err);
                            return;
                        }
                    );

                }

                self.findFilter = function findFilter() {
                    doModal(true);


                    try {
                        //$timeout(
                        //    $.each(self.treeDataSp, function (i, v) {
                        //        check(v);
                        //    }), 100);

                        $.each(self.treeDataSp, function (i, v) {
                            check(v);
                        })
                    }
                    catch (e) {
                        doModal(false);
                    }


                    doModal(false);

                    //console.log(self.treeDataSp);
                }

                function check(node) {
                    var childrenVisible = false;

                    if (node.children) {

                        $.each(node.children, function (i, v) {
                            if (check(v)) {
                                childrenVisible = true;
                            }
                            //childrenVisible = check(v);
                        })
                    }

                    node.isVisible = (node.TREE_LABEL != "" && node.TREE_LABEL.toUpperCase().indexOf($("#input-search").val().toUpperCase()) > -1) || childrenVisible ? true : false;
                    //node.isVisible ? $("#tree_" + node.TREE_ID).show() : $("#tree_" + node.TREE_ID).hide();


                    return node.isVisible;

                }

                self.refreshTree = function refreshTree() {
                    self.actionRefresh = true;
                    self.loadHtmlForm(self.selectedNode.htmlPage);
                    self.init();
                }

                self.setTree = function setTree() {
                    if (self.treeDataSp.length > 0) {
                        if (self.actionRefresh) {

                            if (self.selectedNode.as_path.split("|").length > 1) {
                                self.selectedNode.as_path.split("|").slice().reverse().forEach(function (x) {
                                    if (!!angular.element('#tree_li_' + x)) {
                                        angular.element('#tree_li_' + x).click();
                                    }
                                })
                            }


                            if (angular.element('#nocr_' + self.selectedNode.TREE_ID).length > 0) {
                                angular.element('#nocr_' + self.selectedNode.TREE_ID).triggerHandler('click');
                                angular.element('#nocr_' + self.selectedNode.TREE_ID)[0].scrollIntoView({ behavior: "smooth", block: "end", inline: "start" });
                            }
                            else {

                                if (angular.element('#nocr_' + self.treeDataSp[0].TREE_ID).length > 0) {
                                    angular.element('#nocr_' + self.treeDataSp[0].TREE_ID).triggerHandler('click');
                                }
                                else {
                                    self.selectedNode = null;
                                    $.each(self.gridToRefresh, function (i, v) {
                                        if ($('div[gridname="' + v.gridName + '"]').length > 0) {
                                            $('div[gridname="' + v.gridName + '"]').find('.k-pager-refresh').trigger('click');
                                        }
                                    })
                                    self.selectedNode = null;
                                    $("#btnExit").click();
                                }
                            }
                            self.actionRefresh = false;
                        }
                        else {
                            angular.element('#nocr_' + self.treeDataSp[0].TREE_ID).triggerHandler('click');
                        }
                    }
                    else {

                        $.each(self.gridToRefresh, function (i, v) {
                            if ($('div[gridname="' + v.gridName + '"]').length > 0) {
                                $('div[gridname="' + v.gridName + '"]').find('.k-pager-refresh').trigger('click');
                            }
                        })
                        self.selectedNode = null;
                        $("#btnExit").click();
                    }

                }

                self.openMaps = function () {
                    $uibModal.open({
                        templateUrl: window.includesVersion + self.objectList[0].mapFormTemplate, // loads the template
                        // template:'<easy-map  map-options="{zoom:20}" markers="t.mapMarkers"></easy-map>',
                        animation: true,
                        backdrop: true, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        //windowClass: "modal-dialog-pdf", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        scope: $scope,
                        controller: ("openMaps", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {

                            $scope.mapMarkers = self.mapMarkers;



                            $scope.cancel = function () {
                                $uibModalInstance.dismiss("cancel");
                            };
                        }]),
                    });

                }


                //gestione azioni
                self.onShowAction = function onShowAction() {
                  
                        self.initFilterGridAction = {
                                                logic: 'or',
                                                filters: [
                                                    {
                                                        operator: 'eq',
                                                        field: self.actionPk,
                                                        value: self.selectedNode.id,
                                                    }
                                                ]
                                            }
                   
                    self.initGridAction = true;



                    
                }

                self.onActionCallBack = function onActionCallBack() {
                    self.refreshTree();
                }

                self.onDataBoundGridAction = function onDataBoundGridAction(e) {
                    if (e.sender.dataSource.data().length > 0) {
                        config.rowData = e.sender.dataSource._data[0];
                        config.pk = self.actionPk
                        config.entityname = e.sender.options.EntityName;
                        config.actionTemplate = self.actionTemplate;

                        config.actionCallback = function (p) {
                            if (p.type != "read" && !!p.type) {
                                self.onActionCallBack(p);
                            }
                        }
                   
                        getAngularControllerElement("reftreeDirectiveController", config);
                    }
                }

                self.init();
            }
        ])

    });
