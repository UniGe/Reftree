define([
    "angular",
    "MagicSDK",
    //"jsPDF",
    "angular-kendo",
    "angular-magic-form-sp",
    "angular-ui-bootstrap",
    "angular-dxf-viewer",
    "angular-magic-grid",
    "angular-easy-map",
    "tree-view-r3",
    "angular-filter",
    "reftree-action-menu",
    "angular-magic-grid-sp"
], function (angular, MF) {
    return angular
        .module("ReftreeGridViewer", [
            "ui.bootstrap",
            "kendo.directives",
            "dxfViewer",
            "magicGrid",
            "easyMap",
            "treeViewR3",
            "angular.filter",
            "reftreeActionMenu",
            "magicGridSp",   
            'ngSanitize'
        ])
        .controller("ReftreeGridViewerController", [
            "config",
            "$timeout",
            "$scope",
            "$uibModal",
            function (config, $timeout, $scope, $uibModal) {
                var self = this;

          

                self.tooltipDescription = [];
                self.gridSelection = config.grid.select();
                self.gridSelectionData = $.map(self.gridSelection, function (val) {
                    return config.grid.dataItem(val)
                });
               
                self.startClathem = false;
                self.ready = false;
                self.showViewerDetail = false;
                self.showViewersOverlay = false;
                self.mainContent = 'viewer';
                self.shownTree = 'tematismi';
                self.viewersReady = $.Deferred();
                self.blocksAndLayersReady = false;

                self.actionGridName = null;
                self.isActionGridReady = false;
                self.actionGridFilter = null;
                self.actionBlockGridFilter = null;
                self.actionGridData = null;
                self.history = [];
                self.selectedFiles = [];
                self.initialSelectedFiles = [];

                // map
                self.shownMarkersLocationIds = [];
                self.initialMarkersLocationIds = [];
                self.locations = {};

                // file in detail
                self.fileShownInDetail = '';
                self.fileInDetail = null;
                self.fileInDetailEvents = null;
                self.viewerSelection = {};
                self.previousViewerSelection = {};
                self.clearSelectionViewer = {};


                //file related
                self.viewers = {};
                self.viewerEvents = {};
                self.visibleBlocksAndLayers = {};
                self.fileActiveLayers = {};
                self.fileActiveBlocks = {};
                self.fileLabels = {};
                self.fileInfo = {};
                self.externalBlocks = {};
                self.dxfLayersAll = {};
                self.dxfBlocksAll = {};
                self.blocksAndLayersAll = {};
                self.assetMode = false;
                self.isAllBlocksSelect = true;
                self.isAllLayerSelect = true;

                self.tematismiTreeCheckedNodes = {};
                self.tematismiTreeOpenPaths = [];
                self.activeLayers = {};
                self.activeBlocks = {};
                self.pathFileCad = config.rootForDxf;
                self.fileSelectedId = 0;
                self.optionsExternalBlock = false;
                self.externalBlocksToSave = {};
                self.showBlockToSave = false;
                self.layerContainer = ["M7-SUPERFICI NETTE LOCALI"];

                /*gestrione file pdf */
                self.thematiForPdf = [];
                self.thematiForBlockPdf = [];
                self.pdfBlock = [];
                self.thematiSelected = [];
                self.handleSelected = [];
                self.thematiSelected = [];
                self.handleSelected = [];
                self.GroupPdf = [];
                self.fileDxfBlock = [];
                self.blockAttivo = false; //true se attiviamo gestione blocchi livi
                self.handleGuidBlock = "";
                self.fileViewerReady = 0;
                self.handlesForGrid = [];
                self.BlocksToCopy = {};
                self.gridAddBlock = false;
                self.activateGridAddBlock = false;
                self.addBlocksGridName = null;
                self.isBlockGridReady = false;
                self.pl_asset_code = null;
                self.renderBlocks = {};
                self.classForAsset = [];
                self.visibleInsertBlock = false;
                self.selectedClassForAsset = {};
                self.fillPolilyneForAddBlocks = {};
                self.currentBlock = {};
                self.viewInsertBlock = false;
                self.activeAction = [];
                self.selectedThema = {};
                self.showTreeThemati = true;
                self.objClathem = null;
                self.objThemati = null;
                self.initTree = true;
                self.storedForCad = {};
                self.activateActionDirective = false;
                self.initGridAction = false;
                self.layerSwitchOn = false;
                self.blockSwitchOn = false;
                
                self.activeAferActionCallBack = false;
                self.viewerSelectionRefresh = [];
                self.bCreateControllerAction = true;
                self.newThemasForTree = [];
                self.historyAction = [];
                //aggiunto 30/10/2019
                self.polilyneSelected = [];
                self.DisableAll = true;

                //gestione filtri
                self.onShowFilterGridTree = false;
                self.onResetFilterGridTree = true;

                //gestione exportazione
                self.initGridExportThemati = false;
                self.initFilterGridExportThemati = [];
                self.initGridNameExportThemati = ""
                self.activateInitGridCadInfo = true;
                self.oGridInfoCadData = [];
                self.onCheckSplitter = true;
                self.viewerWidth = 50;
                self.showTreeData = false;
                self.groupThematiList = [];
                /*gestione magic telecomando*/
                self.showMagic = true;
                self.actionBlockGridName =""
                self.onShowGroupThemati = false;
                self.toolBarButton = true;
                self.refresTreeChange = true;
                self.clathemSelected = {};
                self.features = {
                    map: true,
                    sidebarAccordion: true,
                    closeButton: true,
                };
                self.zoomIcon = "glyphicon glyphicon-zoom-in"
                self.showThemati = true;
                self.openPopup = true;
                self.fileToZipDwg = {};
                self.onInitGridInfoAsset = false;
                self.selectedBlock = null;
                self.showSpliHorizontal = true;
                self.openLayout = false;
                self.enableForLog = false;
                self.activatedMeasure = false;
                self.showInfoCad = false;
                self.showInfoCadButton = false;
                self.enableLogInfo = false;
                self.showDetailBlock = false;
                self.showMeasureMode = true;
                self.bMeasureMode = false;
                self.measureFile = {};
                self.iContaFile = 0;
                self.layerImportOrder = ['RM$'];
                self.showCompare = false;
                self.fileCompare = {};
                self.comparebleEntities = {};
                self.ShowHideAdded = false;
                self.ShowHideMinus = false;
                self.enableButtonCompare = true;
                self.dxfToCompare = [];
                self.modalityMode = 'V';
                self.onAddedPolyline = false;
                self.optionsPolyline = {};

                config.onClose = function () {
                    $scope.$destroy();
                };

                try {

                    //se si aggiunge un prprieta di configurazione aggiornare la vista RSN_VI_CADCFG_L e la relativa griglia compreso salvataggio
                    self.guidIsntance = window.crypto.getRandomValues(new Uint32Array(1))[0];
                    self.gridActionSingle = config.dwgCadInfo.actionDirectiverGrid ? config.dwgCadInfo.actionDirectiverGrid : "";
                    self.actionBlockGridName = config.dwgCadInfo.actionBlockGridName ? config.dwgCadInfo.actionBlockGridName : "";
                    self.initGridNameBlockInfoCad = config.dwgCadInfo.initGridNameBlockInfoCad ? config.dwgCadInfo.initGridNameBlockInfoCad : "";
                    self.activateActionDirective = config.dwgCadInfo.actionDirective ? true : false;
                    self.layerSwitchOn = config.dwgCadInfo.layerSwitchOn ? true : false;
                    self.blockSwitchOn = config.dwgCadInfo.blockSwitchOn ? true : false;
                    self.layerContainer = config.dwgCadInfo.layerContainer ? config.dwgCadInfo.layerContainer : ["M7-SUPERFICI NETTE LOCALI"];
                    self.multiAction = config.dwgCadInfo.multiAction ? true : false;
                    config.multiAction = self.multiAction;
                    self.mainContentPreview = config.dwgCadInfo.mainContentPreview ? 'dwg_preview_r3' : 'dwg_preview_r3';
                    self.initGridNameExportThemati = config.dwgCadInfo.initGridNameExportThemati ? config.dwgCadInfo.initGridNameExportThemati : "AS_US_VI_THEMATI_XLSX";
                    self.initGridNameInfoCad = config.dwgCadInfo.initGridNameInfoCad ? config.dwgCadInfo.initGridNameInfoCad : "AS_US_VI_ROOM_ANAL_CAD_INFO";
                    self.enableAllLayers = config.dwgCadInfo.enableAllLayers ? config.dwgCadInfo.enableAllLayers : false;
                    self.enableDwgExport = config.dwgCadInfo.enableDwgExport ? config.dwgCadInfo.enableDwgExport : false;
                    self.enableBlockLayerOnPreview = config.dwgCadInfo.enableBlockLayerOnPreview ? config.dwgCadInfo.enableBlockLayerOnPreview : true;
                    self.showTreeAsset = config.dwgCadInfo.showTreeAsset ? config.dwgCadInfo.showTreeAsset : false;
                    self.isRef2Space = config.dwgCadInfo.isRef2Space === undefined ? true : config.dwgCadInfo.isRef2Space 
                    self.toolBarButton = config.dwgCadInfo.toolBarButton === undefined ? false : config.dwgCadInfo.toolBarButton 
                    self.isGridEditPage = config.isGridEditPage ? config.isGridEditPage : false;
                    self.enabledLayuot = config.dwgCadInfo.enabledLayuot ? true : false;                    
                    self.launchTeighaFromDb = isNullOrUndefined(config.dwgCadInfo.launchTeighaFromDb) ? true : config.dwgCadInfo.launchTeighaFromDb;
                    self.enableLogInfo = config.dwgCadInfo.enableLogInfo ? config.dwgCadInfo.enableLogInfo : false;
                    self.showDetailBlock = config.dwgCadInfo.showDetailBlock ? config.dwgCadInfo.showDetailBlock : false;
                    self.enableDowloadDwg = config.dwgCadInfo.enableDowloadDwg ? config.dwgCadInfo.enableDowloadDwg : false;
                    self.showMeasureMode = config.dwgCadInfo.showMeasureMode ? true : false;
                    self.layerImportOrder = config.dwgCadInfo.layerImportOrder ? config.dwgCadInfo.layerImportOrder : [];
                    self.enabledCompareMode = config.dwgCadInfo.enabledCompareMode ? config.dwgCadInfo.enabledCompareMode : false;
                    self.addDocverToGridFilter = config.dwgCadInfo.addDocverToGridFilter ? config.dwgCadInfo.addDocverToGridFilter : false;
                    self.showDrawingMode = config.dwgCadInfo.showDrawingMode ? true : false;
                    self.showSavePdf = config.dwgCadInfo.showSavePdf ? config.dwgCadInfo.showSavePdf : false;


                    config.actionTemplate =
                        '<div ng-repeat="father in rtmm.fatherAction" class="btn-group navbar-btn" style="margin:3px; z-index:1000;">\
                        <button type="button" style="border-top-left-radius: 4px;border-bottom-left-radius: 4px;" class="btn btn-success" dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><span style="margin-right: 3px;" class="fa fa-bars"></span>{{father.name}}</button>\
                        <ul  id="mnav" class="dropdown-menu scrollable-menu-r3" role="menu">\
                        <li style="cursor:pointer;"ng-repeat="action in rtmm.fatherAction[$index].action | orderBy:' + "'orderBy'" + '"><a ng-click="rtmm.dispatch(action)">{{action.label}}</a></li>\
                        </ul>\
                        </div>'
                }
                catch (e) {
                    console.log(e);
                    console.log("action Directive non specificato prende di default false")
                }

                function isNullOrUndefined(value) {
                    return value === undefined || value === null;
                }
                 
                self.resizeMenuReftree = function () {
                    if (!$('#main-menu').hasClass('mini')) {                        
                    
                        $('#main-menu').addClass('mini');
                        $('.page-content').addClass('condensed');
                        $('.scrollup').addClass('to-edge');
                        $('.header-seperation').hide();
                        $('.footer-widget').hide();
                        $('#main-menu').find('li').hide();
                    }
                    $(document).trigger('menuToggled');
                    calculateHeight();
                }

                self.onGetTipmodForcad = function onGetTipmodForcad() {
                    try {
                        config.MF.api
                            .get({
                                storedProcedureName: self.storedForCad['DWG_GET_TIPMOD_FOR_CAD'] ? self.storedForCad['DWG_GET_TIPMOD_FOR_CAD'] : "core.DWG_GET_TIPMOD_FOR_CAD",
                                gridData: {
                                    gridname: sourcegridname,
                                    id: sourceItemIds,
                                },
                            })
                            .then(
                                function (result) {
                                    if (!result.length) {
                                        return;
                                    }

                                    self.tipmodForCad = [];

                                    $.each(result[0], function (i, v) {
                                        self.tipmodForCad.push(v);
                                    });

                                },
                                function (err) {
                                    console.log('Errore DWG_GET_TIPMOD_FOR_CAD: ' + err);
                                },
                            );
                    }
                    catch (ex) {
                        console.log(ex);
                    }
                }

                self.getStoredForCad = function getStoredForCad() {
                    return MF.api.get({
                        storedProcedureName: "core.DWG_Stored_for_cad",
                        data: {
                            ApplicationInstanceId: window.ApplicationInstanceId
                        }
                    })
                        .then(function (result) {
                            if (!result[0]) {
                                return
                            }

                            $.each(result[0], function (i, v) {
                                self.storedForCad[v.code] = v.stored;
                            });

                            //aggiungere procedura personalizzata per le azioni e le multiaxioni da fare
                            config.spActionToLaunch = self.storedForCad['usp_ev_get_action_constraint'] ? self.storedForCad['usp_ev_get_action_constraint'] : undefined
                            config.spMultiActionToLaunch = self.storedForCad['usp_ev_get_multi_action_constraint'] ? self.storedForCad['usp_ev_get_multi_action_constraint'] : undefined

                        }, function (err) {
                            console.log(err);
                        });
                }

                self.getInfoForCad = function getInfoForCad() {
                    self.cadInformation = {};

                    if (!self.storedForCad['DWG_get_info_for_cad']) {
                        console.log('Stored informazioni non parametrizzata nell tabella stocad');
                        return
                    }

                    MF.api.get({
                        storedProcedureName: self.storedForCad['DWG_get_info_for_cad'] ? self.storedForCad['DWG_get_info_for_cad'] : 'core.DWG_get_info_for_cad',
                        data: {
                            gridname: config.grid.options.code,
                            id: sourceItemIds,
                            ApplicationInstanceId: window.ApplicationInstanceId,
                        },
                    }).then(function (result) {
                        if (!result[0]) {
                            $timeout(function () {
                                self.showInfoCadButton = false;
                                self.showInfoCad = false;
                            }, 500);


                            return
                        }

                        $.each(result[0], function (i, v) {
                            if (!self.cadInformation[v.fileName]) {
                                self.cadInformation[v.fileName] = { bannerMessage: v.value };
                            } else {
                                self.cadInformation[v.fileName].bannerMessage += ' -- ' + v.value;
                            }
                        });

                        $timeout(function () {
                            self.showInfoCadButton = true
                            self.showInfoCad = true;
                        })

                    }, function (err) {
                        console.log(err);
                    });
                }

                self.getBlocksAndLayersFromDb = function getBlocksAndLayersFromDb() {
                    if (self.blocksAndLayersFromDb) {
                        return self.blocksAndLayersFromDb;
                    }

                    self.layerContainer = [];
                    return MF
                        .api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_GetAllBlockLayer'] ? self.storedForCad['DWG_GetAllBlockLayer'] : 'core.DWG_GetAllBlockLayer',
                            data: {
                                gridname: config.grid.options.code,
                                id: sourceItemIds
                            },
                        })
                        .then(function (data) {
                            var blocks = {};
                            var layers = {};
                            var externalBlocks = {};

                            //gestione dei blocchi
                            $.each(data[0], function (i, block) {
                                if (block.ID != 0) {
                                    blocks[block.DESCRIPTION] = block;
                                }
                            });

                            //gestione dei layer
                            $.each(data[1], function (i, layer) {
                                if (layer.ID != 0) {
                                    layers[layer.DESCRIPTION] = layer;

                                    if (layer.container) {
                                        self.layerContainer.push(layer.DESCRIPTION);
                                    }
                                }
                            });

                            //gestione dei blocchi di tipo impianti da caricare nei viewer
                            $.each(data[2], function (i, block) {
                                if (block.ID != 0) {
                                    externalBlocks[block.DESCRIPTION] = block;
                                }
                            });


                            return self.blocksAndLayersFromDb = {
                                blocks: blocks,
                                layers: layers,
                                externalBlocks: externalBlocks
                            };
                        });
                };

                self.init = function init() {
                    //$("#layout-condensed-toggle").click();
                    $(".page-title").hide();

                    self.getStoredForCad().then(function () {
                        self.onGetTipmodForcad();
                        self.getInfoForCad();
                        self.getBlocksAndLayersFromDb().then(
                            function () {
                                self.fileInDetailEvents = {
                                    'entity:select': self.onDetailViewerSelected,
                                    'entity:deselect': self.onDetailViewerDeselected,
                                    'entity:click': self.onDetailViewerClick,
                                    'entity:dblclick': self.onDetailViewerDblClick,
                                    'entity:dragend': self.onDetailDragEnd,
                                    'entity:dragstart': self.onDetailDragStart,
                                    'entity:mouseleave': self.onDetailMouseLeave,
                                };

                                self.startClathem = true;

                                self.features = $.extend(self.features, config.features || {});

                                if (self.features.map) {
                                    self.setMarkersFromGridSelection();
                                    if (self.gridSelectionData.length > 1) {
                                        self.mainContent = 'map';
                                    }
                                }
                            });
                    });
                };

                self.init();

                self.getActionAll = function getActionAll(e) {
                    self.fileInDetailEvents["entity:click"].call("click",e);
                }

                self.openHandles = function () {
                    window.open('http://dev.reftree.it/api/DWG/Viewer?q=tIlp9rJjQ3S3lkSooV7tePRrm6%2FKiBn%2BdjJQwojz6iZRudBRHecJ0aWGdlS8BEpX1L8ROBDoPrvaR4J30v%2B6seKvyKiv61Cn63RI4h43xGrTrhVtMu6Rl0RH5zszH0Zl1UzqxZ%2Brxd29TysxhlbiC8yJTtW9ayGeEpUGc5vs%2F3ZmrCScUZ9AWzi8DQxRx2WXka029s%2FHH%2BRGOi7oSc3RsVzzRdRg6oPirplhp9QnPFk%3D', '_blank');
                }              

                $scope.$watch("rgv.initGridAction", function (newValue) {
                    if (!newValue) {
                        angular.element($("div[name='divAction']")).empty();
                    }
                });

                $scope.$watchCollection('rgv.selectedTreeExpandedItem.children._data', function (_data) {
                    if (!!_data) {
                        if (_data.length) {
                            self.selectedTreeExpandedItem.TotArea = 0;
                            $.each(_data, function (i, v) {
                                if (v.checked) {
                                    self.selectedTreeExpandedItem.TotArea   += v.Area
                                }
                            })

                            self.selectedTreeExpandedItem.TotArea = parseFloat(self.selectedTreeExpandedItem.TotArea).toFixed(2);
                        }
                    }
                });

                $scope.$watch("rgv.selectedTree.value()", function (newTree) {
                    self.showGrid = false;

                    if (!!newTree) {
                        if (newTree != "") {
                            $.each(self.selectedTree.dataSource._data, function (i, x) {
                                if (x.ID == self.selectedTree.value()) {
                                    self.initGridNameExportThemati = config.dwgCadInfo.initGridNameExportThemati ? config.dwgCadInfo.initGridNameExportThemati : "AS_US_VI_THEMATI_XLSX";
                                    self.initGridNameBlockInfoCad = config.dwgCadInfo.initGridNameBlockInfoCad ? config.dwgCadInfo.initGridNameBlockInfoCad : "";
                                    self.initGridNameInfoCad = config.dwgCadInfo.initGridNameInfoCad ? config.dwgCadInfo.initGridNameInfoCad : "AS_US_VI_ROOM_ANAL_CAD_INFO";
                                    self.infoCadSpDetails = x.infoCadSpDetails ? x.infoCadSpDetails : '';
                                    if (self.assetMode) {
                                        self.initGridNameBlockInfoCad = x.initGridNameInfoCad ? x.initGridNameInfoCad : self.initGridNameBlockInfoCad
                                    } else {
                                        self.initGridNameInfoCad = x.initGridNameInfoCad ? x.initGridNameInfoCad : self.initGridNameInfoCad
                                    }
                                                                       
                                    self.initGridNameExportThemati = x.initGridNameExportThemati ? x.initGridNameExportThemati : self.initGridNameExportThemati                                    
                                }
                            });

                            $timeout(function () {                                
                                self.showGrid = true;
                            }, 500)                            
                        }
                    }
                    
                });
 
                $scope.$watch("rgv.selectedTreeData._data", function (newTreeData) {
                    if (newTreeData !== undefined && newTreeData.length > 0) {
                        self.selectedTreeData._data.map(function (menu) { return menu.Description = self.getLabels("selectAll") });
                        if (self.selectedThema) {
 
                            self.addNodeToMenu(self.selectedThema);
                        } else {
                            doModal(false);
                        }
                    }
                });

                // set by first tree selection
                $scope.$watch("rgv.files", function (newFiles) {
                    if (self.ready) {

                        if (self.mainContent === 'map') {
                            self.setMarkersFromFiles(newFiles);
                        } else {
                            for (var i = 0; i < self.selectedFiles.length; i++) {
                                if (
                                    self.showViewerDetail &&
                                    self.selectedFiles[i].fileName === self.fileShownInDetail ||
                                    !self.showViewerDetail
                                ) {
                                    var fileName = self.selectedFiles[i].fileName;
                                    if (fileName in newFiles) {
                                        self.selectedFiles[i] = newFiles[fileName];
                                        self.selectedFiles[i].fileName = fileName;
                                    } else {
                                        self.selectedFiles[i].tdata = [];
                                    }
                                }
                            }
                        }
                        self.uncheckNodesNotContainingAnyHighlightedHandle();

                        if (!self.showViewerDetail && !self.assetMode) {
                            self.initGridInfoCadActivateAll();
                        } else if (self.showViewerDetail && self.assetMode) {

                            self.initGridBlockInfoCadActivate();
                        }
                    }
                });

                self.addNodeToMenu = function addNodeToMenu(e) {

                    $timeout(function () {
                        //if (!!e.$$hashKey) {
                        //chiudo eventuali aperti 
                        $.each(angular.element($('#dxf-tree-one')).find('.in'), function (i, v) {
                            if (v.id != "dxf-tree-2-" + e.ClathemId + "-" + e.ThematiId) {
                                $(v).collapse('hide');
                            }
                        });

                        self.selectedTreeExpandedItem = self.selectedTreeData._data.filter(function (node) {
                            return node.ThematiId == e.ThematiId
                        })[0];

                        if (!!self.selectedTreeExpandedItem) {
                            $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").closest('ul').children().hide();
                            $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").show();

                            if (!$("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").attr("aria-expanded")) {
                                $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").find('span:first').click();
                            }
                            $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").first('.k-plus').click()
                            $("#contain_" + self.selectedTreeExpandedItem.ClathemId + "_" + e.ThematiId).append($("#treeThemati"));
                        }

                        if (!angular.element($('#dxf-tree-2-' + e.ClathemId + '-' + e.ThematiId)).hasClass('.in')) {
                            angular.element($('#dxf-tree-2-' + e.ClathemId + '-' + e.ThematiId)).collapse('show');
                        }

                        doModal(false);
                    }, 1000)
                }

                self.setGroupThematiList = function setGroupThematiList(e) {
                    self.selectedBlock = null;

                    if (self.assetMode) {
                        self.onResetGridBlock();
                        self.externalBlocks[self.fileInDetail.fileName] = [];
                    }

                    self.selectedThema = e;



                    if (!self.selectedTreeExpandedItem || self.selectedTreeExpandedItem.ThematiId != e.ThematiId) {
                        /* spostato dentro self.refreshTree();*/
                        self.centerView();

                        if (self.assetMode) {
                            self.onResetGridBlockInfoCad();
                        }

                        if (self.activateActionDirective && !self.assetMode) {
                            self.onResetGridAction();
                        }

                        self.selectedTreeExpandedItem = null;
                        self.tematismiTreeCheckedNodes = {};
                        self.tematismiTreeOpenPaths = [];
                        $("#divtreeThemati").append($("#treeThemati"));
                        self.files = {};
                        self.refreshTree();

                    } else if (self.selectedTreeExpandedItem && self.selectedTreeExpandedItem.ThematiId == e.ThematiId) {
                      
                        //if (!angular.element($('#dxf-tree-2-' + e.ClathemId + '-' + e.ThematiId)).hasClass('.in')) {
                        //    angular.element($('#dxf-tree-2-' + e.ClathemId + '-' + e.ThematiId)).collapse('show');
                        //}
                    }
                }

                self.onCheckTotal = function onCheckTotal(file) {                
                   

                    function onGetTotal(_data, parent) {                        
                        parent.TotArea = 0;

                        $.each(_data, function (i, v) {
                            
                            if (v.checked) {
                                parent.TotArea += v.Area;
                            }

                            onGetTotal(v.children._data,v);
                        })

                        //parent.TotArea = parent.TotArea.toFixed(2);
                    }

                    $.each(self.selectedTreeData._data, function (i, v) {   
                        
                        if (!jQuery.isEmptyObject(self.selectedThema) && self.selectedThema.ThematiId == v.ThematiId) {                       
                            onGetTotal(v.children._data, v);
                            v.TotArea = parseFloat(v.TotArea).toFixed(2);


                        }
                    })


                     
                }

                self.getThematiFirstList = function getThematiFirstList() {
                    doModal(true);

                    self.groupThematiList = [];
                    self.onShowGroupThemati = false;
                     
                    try {
                        config.MF.api
                            .get({
                                storedProcedureName: self.storedForCad['DWG_GetTreeContent_Menu'] ? self.storedForCad['DWG_GetTreeContent_Menu'] : "core.DWG_GetTreeContent_Menu",
                                gridData: {
                                    gridname: sourcegridname,
                                    id: sourceItemIds,
                                },
                                treeData: {
                                    id: self.selectedTree.value(),
                                },
                                selectedFiles: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,
                                selectedFilesStart: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,
                                treeFilter: self.filterHandler(),
                                viewBlockThemati: self.showViewerDetail && self.fileInDetail ? 1 : 0,
                            })
                            .then(
                                function (result) {
                                    if (!result.length) {
                                        doModal(false);
                                        kendoConsole.log('Nessun tematismo trovato.', true);

                                        return;
                                    }

                                    self.groupThematiList = result[0];
                                    self.onShowGroupThemati = true;
                                   
                                    $timeout(function () {
                                        doModal(false);
                                        if (!self.expandMenuThemati) {
                                            if (self.refresTreeChange) {
                                                self.refreshTree();
                                            }
                                        }
                                        self.refresTreeChange = true;


                                    },1000)

                                },
                                function (err) {
                                    console.log('DWG_GetTreeContent_Menu: ' + err);

                                    $timeout(function () {
                                        if (!self.expandMenuThemati) {
                                            if (self.refresTreeChange) {
                                                self.refreshTree();
                                            }
                                        }

                                        self.refresTreeChange = true;
                                        doModal(false);

                                    }, 0)

                                },
                            );
                       
                        
                    }
                    catch (ex) {
                        
                        console.log('DWG_GetTreeContent_Menu: ' + ex);
                        doModal(false);
                    }
                }

                self.onResizePanelBody = function onResizePanelBody() {
                    console.log('resize');
                }
                 
                // event handlers
                self.onActionWindowOpen = function (event) {
                    setTimeout(function () {
                        event.sender.element.closest('.k-window').css('z-index', 100);
                    });
                };

                self.triggerWindowResize = function triggerWindowResize() {

                    window.dispatchEvent(new Event('resize'));
                    self.resizeMenuReftree();
                };

                self.cloneFileInDetailsActions = function cloneFileInDetailsActions() {
                    if (!self.fileInDetail || !self.tdataOld) {
                        return null;
                    }
                    var file = {
                        fileName: self.fileInDetail.fileName,
                        tdata: self.tdataOld,
                        selectedLayers: self.getVisibleLayerForFile(self.fileInDetail.fileName)
                    };
                    for (var i = 0; i < self.fileInDetail.tdata.length; i++) {
                        file.tdata.push(
                            Object.assign(
                                Object.assign({}, self.fileInDetail.tdata[i]), {
                                    handles: self.fileInDetail.tdata[i].handles.slice(0),
                                    treelevel: self.fileInDetail.tdata[i].treelevel.slice(0),
                                }
                            )
                        );
                    }
                    return file;
                };

                self.addHistoryAction = function addHistoryAction(showViewerDetail) {
                    self.storeTematismiTreeState();
                    self.historyAction.push({
                        selectedFile: self.cloneFileInDetailsActions(),
                        selectedFiles: self.selectedFiles,
                        isDetail: showViewerDetail,
                        tematismiTreeCheckedNodes: Object.assign({}, self.tematismiTreeCheckedNodes),
                        tematismiTreeOpenPaths: self.tematismiTreeOpenPaths.slice(0),
                        expandMenu: true
                    });


                    if (self.historyAction.length > 1) {
                        self.historyAction.shift();
                    }
                };

                self.onDataBoundGridActionSingle = function onDataBoundGridActionSingle(e) {
                    if (e.sender.dataSource.data().length > 0) {

                        self.onShowBtnDetail = true;
                        //doModal(true);
                        config.rowData = e.sender.dataSource._data[0];
                        config.pk = "AS_ASSET_ID"
                        config.entityname = e.sender.options.EntityName;
                        config.actionCallback = function (p) {
                            if (p.type != "read" && !!p.type) {
                                self.actionCallback(p);
                            }
                        }
                        config.multiAction = false;

                        if (e.sender.dataSource.data().length > 1) {

                            config.multiAction = self.fileInfo[self.fileInDetail.fileName].multiActionFile;

                            e.sender.tbody.find('tr').addClass('k-state-selected');

                            if (config.onClickMultiAction) {
                                self.actionCallback();
                                doModal(false);
                                return
                            }
                        }
                        doModal(false);
                        getAngularControllerElement("reftreeDirectiveController", config);
                    }
                    else {
                        self.onShowBtnDetail = false;
                        angular.element($("div[name='divAction']")).empty();
                        self.viewers[self.fileInDetail.fileName].viewer.viewer.controls.selectTools.deselectAll();
                        doModal(false);
                    }
                }

                self.buildFilesAction = function buildFilesAction(data, newfiles, isIntersection) {
                    if (data.checked) {
                        var fileInfo = {};
                        fileInfo = self.getFileInfo(data, fileInfo);
                        //se tra i nuovi file selezionati non c'e' quello del nodo corrente deseleziono il nodo
                        $.each(fileInfo, function (file, obj) {
                            if (!newfiles[file])
                                newfiles[file] = {
                                    tdata: [],
                                };
                            $.each(obj.tdata, function (j, tdata) {
                                if (isIntersection) {
                                    tdata.handles = $.map(
                                        tdata.handles,
                                        function (vv, ii) {
                                            if (
                                                self.intersectHandles.indexOf(
                                                    vv,
                                                ) != -1
                                            )
                                                return vv;
                                            else return null;
                                        },
                                    );
                                }
                                if (tdata.handles && tdata.handles.length)
                                    newfiles[file].tdata.push(tdata);
                            });
                        });
                    }
                    if (data.items)
                        $.each(data.items, function (i, v) {
                            self.buildFilesAction(v, newfiles, isIntersection);
                        });
                }

                //aggiunta il 30/10/2019
                self.onBuildDataFile = function buildDataFile(item, tdata) {
                    for (var i = item.items.length - 1; i >= 0; i--) {
                        var oitem = item.items[i];
                        if (oitem.items && oitem.items.length > 0) {
                            buildDataFile(oitem, tdata);
                        }

                        if (oitem.checked) {
                            var handelToadd = [];

                            for (handle in oitem.handles._handlers) {
                                handelToadd.push(handle);
                            }

                            tdata.push({
                                id: oitem.ValueTemat,
                                tematid: oitem.ThematiId,
                                color: oitem.ColourTemat ?
                                    oitem.ColourTemat.replace(
                                        /[\s]/g,
                                        "",
                                    ) :
                                    null,
                                treelevel: oitem.Treedesc ?
                                    oitem.Treedesc.split("|") :
                                    null,
                                handles: handelToadd,
                                isBlock: oitem.isBlock ? oitem.isBlock : false
                            });
                        }
                    }
                }

                self.actionCallback = function (p) {
                    self.activeAferActionCallBack = true;
                    self.getInfoForCad();
                    self.viewerRefresh();
                    
                }

                self.onClickShowActionsSingle = function onClickShowActionsSingle() {
                    self.viewerSelection[self.eventClick.handle] = true;
                    if (self.assetMode) {
                        doModal(false);
                    } else {
                        
                        if (self.eventClick.renderer.controls.selectTools.selected.length > 0) {
                            self.initGridActionSingle(self.eventClick.handle);
                        } else {
                            self.initGridActionSingle("");
                            doModal(false);
                        }
                    }
                    

                    self.addHistoryAction(true);
                }

                //blocco multi azioni
                self.onSetFilterGridAction = function onSetFilterGridAction(filter) {
                    if ($('div[gridname="' + self.gridActionSingle + '"]').length > 0) {
                        $('div[gridname="' + self.gridActionSingle + '"]').data('kendoGrid').dataSource.filter(filter);
                    }
                }

                self.onClickShowActionsMulti = function onClickShowActionsMulti() {
                    self.initGridActionMulti();
                    self.addHistoryAction(true);
                }

                self.onSelecDeselectHandle = function (event) {
                    self.viewerSelectionRefresh = [];
                    var viewer = self.viewers[self.fileInDetail.fileName].viewer.viewer
                    var oSelected = viewer.renderer.controls.selectTools.selected;

                    if (oSelected.length > 0) {
                        $.each(oSelected, function (i, v) {
                            if (-1 == $.map(self.viewerSelectionRefresh, function (ele) {
                                return ele._handle
                            }).indexOf(v._handle)) {
                                self.viewerSelectionRefresh.push(v);
                            }
                        });
                    } else {
                        self.viewerSelectionRefresh = [];
                    }
                }

                self.initGridActionMulti = function initGridActionMulti() {
                    var oHandle = [];

                    config.onClickMultiAction = false;

                    $.each(self.viewerSelectionRefresh, function (i, v) {
                        oHandle.push(
                            { operator: 'eq', field: 'HANDLE', value: v.handle }
                        )
                    });

                    if (oHandle.length > 0) {
                        self.initFilterGrid = {
                            logic: "and",
                            filters: [
                                { operator: 'eq', field: 'ID_PIANO', value: self.selectedFloor },
                                { logic: "or", filters: oHandle },
                                self.addDocverToGridFilter ? { operator: 'eq', field: 'ID_DOCVER', value: self.fileInfo[self.fileInDetail.fileName].id_dwg } : '' 
                            ]
                        };
                    } else {
                        self.initFilterGrid = {
                            logic: "and",
                            filters: [{ operator: 'eq', field: 'HANDLE', value: "" }]
                        }
                    }

                    //self.initGridAction = true;

                    self.onSetFilterGridAction(self.initFilterGrid);
                }

                //FIne blocco multi azioni

                self.onDetailViewerClick = function onDetailViewerClick(event) {

                    

                    if (self.activatedMeasure)
                        return

                    doModal(true);

                    self.eventClick = event ? event : undefined;

                    //aggiunto in data 30/10/2019
                    self.previousViewerSelection = $.extend({}, self.viewerSelection);

                    if (self.activateActionDirective) {
                        self.onFilterGridSelection();
                        self.onSelecDeselectHandle(event);


                        if (self.multiAction && !self.assetMode || event === undefined) {
                            //self.onSelecDeselectHandle(event);
                                self.onClickShowActionsMulti();
                            } else {
                                //self.onSelecDeselectHandle(event);
                                self.onClickShowActionsSingle();
                            }
                        }


                    self.assetMode ? self.initGridBlockInfoCadActivate(event) : self.initGridInfoCadActivate(event)                                    
                };


                self.onFilterGridSelection = function onFilterGridSelection() {
                    handleSelection = [];

                    if (!!self.storedForCad['DWG_setFilterForGridAction']) {
                        for (handle in self.viewerSelection) {
                            handleSelection.push(handle)
                        }

                        config.MF.api
                            .get({
                                storedProcedureName: self.storedForCad['DWG_setFilterForGridAction'] ? self.storedForCad['DWG_setFilterForGridAction'] : "core.DWG_setFilterForGridAction",
                                data: {
                                    gridname: sourcegridname,
                                    id: sourceItemIds,
                                    treeData: {
                                        id: self.selectedTree.value(),
                                    },
                                    idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                                    assetMode: self.assetMode,
                                    handleSelection: handleSelection
                                },
                            })
                            .then(
                                function (result) {
                                    return
                                },
                                function (err) {
                                    console.log(err);
                                },
                            );


                    }

                    

                     

                    

                }

                self.onDetailViewerDblClick = function onDetailViewerDblClick(event) {
                    if (!self.activateActionDirective) {
                        self.previousViewerSelection = $.extend({}, self.viewerSelection);
                        self.viewerSelection = {};
                        self.viewerSelection[event.handle] = true;
                        self.onClickShowActions();
                        $timeout();
                    }
                };

                self.getIndexScaleBlock = function (handle, name) {
                    var iIndexScale = 1;

                    self.externalBlocks[self.fileInDetail.fileName].filter(function (block) {
                        if (block.blockName == name) {
                            $.each(block.options, function (i, v) {
                                if (v.handle == handle) {
                                    iIndexScale = v.indexScale;
                                }
                            });
                        }
                    });

                    return iIndexScale;
                }

                self.setExternalBlocksToSave = function (block) {
                    var rotation = 0;

                    $.each(self.externalBlocks[self.fileInDetail.fileName], function (i, v) {
                        if (v.blockName == block.name) {
                            $.each(v.options, function (ii, vv) {
                                if (vv.handle == block._handle) {
                                    rotation = vv.position.rotation;
                                }
                            });
                        }
                       
                    })


                    self.externalBlocksToSave[block.handle] = {
                        handle: block.handle,
                        //handle_father: !!block.container ? block.container.handle : null  ,
                        handle_father: block.handle_father,
                        x: block.element.position.x,
                        y: block.element.position.y,
                        xref: block.element.position.x - block.renderer.dwg.canvas.extmin.x,
                        yref: (block.element.position.y - block.renderer.dwg.canvas.extmin.y) * -1,
                        xscale: block.element.scale.x,
                        yscale: block.element.scale.y,
                        rotation: rotation

                    }
                }

                self.onDetailDragStart = function onDetailDragStart(cadViewerEvent) {
                    if (cadViewerEvent._type == "insert") {
                        self.showBlockToSave = true;
                        //self.setExternalBlocksToSave(cadViewerEvent);
                        self.externalBlocksToSave[cadViewerEvent.handle] = {
                            handle: cadViewerEvent.handle,
                            x: cadViewerEvent.element.position.x,
                            y: cadViewerEvent.element.position.y,
                            xref: cadViewerEvent.element.position.x - cadViewerEvent.renderer.dwg.canvas.extmin.x,
                            yref: (cadViewerEvent.element.position.y - cadViewerEvent.renderer.dwg.canvas.extmin.y) * -1,
                            xscale: cadViewerEvent.element.scale.x,
                            yscale: cadViewerEvent.element.scale.y,
                        }
                    }
                  
                }

                self.onDetailDragEnd = function onDetailDragEnd(cadViewerEvent) {
                    self.showBlockToSave = true;

                    if (cadViewerEvent.entity._type == "insert" || cadViewerEvent.entity._type == "text") {
                        var handlerFather = ''

                        var type_block = self.externalBlocks[self.fileInDetail.fileName].filter(function (block) {
                            if (block.blockName == cadViewerEvent.entity.name) {
                                $.each(block.options, function (i, v) {
                                    if (v.handle == cadViewerEvent.entity._handle) {
                                        handlerFather = v.handleFather
                                    }
                                })
                                return block
                            }
                        })[0].type_block;


                        if (!!cadViewerEvent.container) {
                            if (!cadViewerEvent.container || self.layerContainer.filter(function (layer) {
                                return layer == cadViewerEvent.container.layer;
                            }).length == 0 || !self.checkContainerBlock(cadViewerEvent.container.handle, type_block, cadViewerEvent.entity.name) && handlerFather != cadViewerEvent.container.handle) {

                                cadViewerEvent.entity.setPosition(
                                    self.externalBlocksToSave[cadViewerEvent.entity.handle].x,
                                    self.externalBlocksToSave[cadViewerEvent.entity.handle].y,
                                );

                                return
                            }
                        }

                        

                        self.clearSelectionViewer[self.fileShownInDetail] = false;
                        //self.setExternalBlocksToSave(cadViewerEvent);
                        cadViewerEvent.entity.handle_father = !!cadViewerEvent.container ? cadViewerEvent.container.handle : null;
                        self.externalBlocksToSave[cadViewerEvent.entity.handle] = {
                            handle:  cadViewerEvent.entity.handle ,
                            handle_father: !!cadViewerEvent.container ?  cadViewerEvent.container.handle : null,
                            x: cadViewerEvent.entity.element.position.x,
                            y: cadViewerEvent.entity.element.position.y,
                            xref: cadViewerEvent.entity.element.position.x - cadViewerEvent.entity.renderer.dwg.canvas.extmin.x,
                            yref: (cadViewerEvent.entity.element.position.y - cadViewerEvent.entity.renderer.dwg.canvas.extmin.y) * -1,
                            xscale: cadViewerEvent.entity.element.scale.x,
                            yscale: cadViewerEvent.entity.element.scale.y
                        }
                    }
                }

                self.onDetailViewerSelected = function onDetailViewerSelected(event) {
                    self.viewerSelection[event.handle] = true;
                    self.clearSelectionViewer[self.fileShownInDetail] = false;
                    if (self.assetMode) {
                        self.setExternalBlocksToSave(event);

                        //self.externalBlocksToSave[event.handle] = {
                        //    handle: event.handle,
                        //    x: event.nativeElement.position.x - event.renderer.dwg.canvas.extmin.x,
                        //    y: (event.nativeElement.position.y - event.renderer.dwg.canvas.extmin.y) * -1,
                        //    xref: event.nativeElement.position.x - event.renderer.dwg.canvas.extmin.x,
                        //    yref: (event.nativeElement.position.y - event.renderer.dwg.canvas.extmin.y) * -1,
                        //    xscale: event.nativeElement.scale.x,
                        //    yscale: event.nativeElement.scale.y,
                        //}
                    }
                    $timeout();
                };

                self.onDetailViewerDeselected = function onDetailViewerDeselected(event) {
                    delete self.viewerSelection[event.handle];
                    delete self.externalBlocksToSave[event.handle]
                    $timeout();
                };

                self.checkContainerBlock = function checkContainerBlock(handleBlock, type_block, blockName) {
                    var ret = false;
                    try {
                        var handle = [] = self.fillPolilyneForAddBlocks[self.fileShownInDetail].open.handle;
                        return handle.filter(function (block) {
                            return block.handle == handleBlock && block.type_block == type_block && block.blockName == blockName
                        }).length > 0;
                    }
                    catch (ex) {
                        console.log(ex);
                        return false;
                    }
                    
                    return ret;
                }

                self.onShowTree = function showTree(treeName) {
                    self.shownTree = treeName;
                };

                self.onSetViewerData = function setViewerData(data, fileName, viewer) {
                    if (data) {
                        self.viewers[fileName] = {
                            blocks: data.blocks,
                            layers: data.layers,
                            viewer: viewer,
                            layouts: data.layouts
                        }

                        

                        $timeout(function () {
                            self.setBlocksAndLayersAll(data, fileName);
                            self.resolveViewersIfReady();

                            if (self.selectedFiles.length == 1) {
                                self.onSingleFileSelect(self.selectedFiles[0])
                            }
                        }, 1000)

                    } else {
                        delete self.viewers[fileName];
                    }

                    //if (self.iContaFile == self.selectedFiles.length) {
                    //    $timeout(function () {
                    //        self.setBlocksAndLayersAll(data, fileName);
                    //        self.resolveViewersIfReady();
                    //    }, 1000)
                    //}
                };

                self.setBlocksAndLayersAll = function setBlocksAndLayersAll(data, fileName) {
                    var blocksAndLayersFiles = {
                        layers: {},
                        blocks: {}
                    }

                    $.each(data.layers, function (i, layer) {
                        if (!self.blocksAndLayersFromDb.layers[layer.name]) {
                            blocksAndLayersFiles.layers[layer.name] = {
                                name: layer.name,
                                ID: undefined,
                                VISIBLE: true , //self.layerSwitchOn,
                                selectable: true,
                                checked: self.layerSwitchOn
                            }
                        } else {
                            var oLayer = self.blocksAndLayersFromDb.layers[layer.name];
                            blocksAndLayersFiles.layers[layer.name] = {
                                name: oLayer.DESCRIPTION,
                                ID: oLayer.ID,
                                VISIBLE: oLayer.VISIBLE == 1,
                                selectable: oLayer.selectable == 1,
                                checked: oLayer.VISIBLE == 1
                            }
                        }
                    });

                    $.each(data.blocks, function (i, block) {
                        if (!self.blocksAndLayersFromDb.blocks[block.name]) {
                            blocksAndLayersFiles.blocks[block.name] = {
                                name: block.name,
                                ID: undefined,
                                VISIBLE: true,
                                selectable: true,
                                checked: self.blockSwitchOn
                            }
                        } else {
                            var oblock = self.blocksAndLayersFromDb.blocks[block.name];
                            blocksAndLayersFiles.blocks[block.name] = {
                                name: oblock.DESCRIPTION,
                                ID: oblock.ID,
                                VISIBLE: true, //oblock.VISIBLE,
                                selectable: oblock.selectable == 1,
                                checked: oblock.VISIBLE == 1
                            }
                        }
                    });

                    $.each(self.blocksAndLayersFromDb.blocks, function (i, block) {
                        if (!blocksAndLayersFiles.blocks[block.DESCRIPTION]) {
                            blocksAndLayersFiles.blocks[block.DESCRIPTION] = {
                                name: block.DESCRIPTION,
                                ID: block.ID,
                                VISIBLE: true, //oblock.VISIBLE,
                                selectable: block.selectable == 1 ? true : false,
                                checked: block.VISIBLE == 1 ? true : false
                            }
                        }
                    })

                    $.each(self.blocksAndLayersFromDb.layers, function (i, layer) {
                        if (!blocksAndLayersFiles.layers[layer.DESCRIPTION]) {
                            blocksAndLayersFiles.layers[layer.DESCRIPTION] = {
                                name: layer.DESCRIPTION,
                                ID: layer.ID,
                                VISIBLE: layer.VISIBLE == 1 ? true : false, //oblock.VISIBLE,
                                selectable: layer.selectable == 1 ? true : false,
                                checked: layer.VISIBLE == 1 ? true : false
                            }
                        }
                    })

                    $.each(blocksAndLayersFiles.layers, function (i, layer) {
                        if (layer.checked) {
                            self.activeLayers[layer.name] = layer;
                        }
                    })

                    if (!self.isAllLayerSelectFileName[fileName]) {
                        self.isAllLayerSelectFileName[fileName] = true;
                    }

                    for (layer in blocksAndLayersFiles.layers) {
                        if (!blocksAndLayersFiles.layers[layer].checked && blocksAndLayersFiles.layers[layer].selectable) {
                            self.isAllLayerSelect = false;
                            self.isAllLayerSelectFileName[fileName] = false;
                        }
                    }

                    if (!self.isAllBlockSelectFileName[fileName]) {
                        self.isAllBlockSelectFileName[fileName] = true;
                    }

                    for (block in blocksAndLayersFiles.blocks) {
                        if (!blocksAndLayersFiles.blocks[block].checked && blocksAndLayersFiles.blocks[block].selectable) {
                            self.isAllBlocksSelect = false;
                            self.isAllBlockSelectFileName[fileName] = false;
                        }
                    }


                    self.blocksAndLayersAll[fileName] = {
                        layers: blocksAndLayersFiles.layers,
                        blocks: blocksAndLayersFiles.blocks,
                    }




                    self.setActiveBlocksAndLayersPerFileAll(fileName);
                }

                //toggle all checkboxes blocks
                self.toggleSelectBlocks = function () {
                    self.isAllBlockSelectFileName[self.fileInDetail.fileName] = event.target.checked;

                    angular.forEach(self.blocksAndLayersAll[self.fileInDetail.fileName].blocks, function (item) {
                        if (item.selectable) {
                            item.checked = event.target.checked;
                        }
                    });
                    self.setActiveBlocksAndLayersPerFileAll(self.fileInDetail.fileName);


                }

                //toggle all checkboxes Layers
                self.toggleSelectLayers = function () {
                    self.isAllLayerSelectFileName[self.fileInDetail.fileName] = event.target.checked;

                    angular.forEach(self.blocksAndLayersAll[self.fileInDetail.fileName].layers, function (item) {
                        if (item.selectable) {
                            item.checked = event.target.checked;
                        }
                    });

                    self.setActiveBlocksAndLayersPerFileAll(self.fileInDetail.fileName);
                }

                self.handleDescription = [];

                self.toolTipDesc = function (file) {

                    config.MF.api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_GetTreeToolTip'] ? self.storedForCad['DWG_GetTreeToolTip'] : "core.DWG_GetTreeToolTip",
                            data: {
                                gridname: sourcegridname,
                                //handle: event._handle,
                                fileName: file.fileName,
                                id: sourceItemIds,
                                treeData: {
                                    id: self.selectedTree.value(),
                                },
                                idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                                assetMode: self.assetMode
                            },
                        })
                        .then(
                        function (result) {

                                self.tooltipDescription = [];
                                self.handleDescription = [];

                                $.each(result[0], function (i, v) {
                                    self.tooltipDescription.push(v);
                                });

                                $.each(result[1], function (i, v) {
                                    self.handleDescription.push(v);
                                });
                            },
                            function (err) {
                                console.log(err);
                            },
                        );

                }

                self.onShowTextBlock = function onShowTextBlock(event, fileName) {

                }

                self.onShowViewerTooltip = function onShowViewerTooltip(event, fileName) {
                    if (event.handle) {
                        var fileInfo = self.fileInfo[fileName];
                        var tematismi = self.getTematFromTreeByHandle(event.handle);
                        var area = event.area >= 0 ? event.area : -event.area;
                        var description = $.map(self.tooltipDescription, function (value) {
                            if (value.handle) {
                                if (value.handle.toUpperCase() == event._handle.toUpperCase()) {
                                    return value.tooltip
                                }
                            }
                        });

                        if (!self.assetMode) {
                            description = (description + "").replace('##tematismo', tematismi);
                            $('div[gridname="' + self.initGridNameInfoCad + '"]').find('tr').removeClass('k-state-selected');
                            $.each(self.oGridInfoCadData, function (i, v) {
                                if (event.handle == v.HANDLE) {
                                    $('div[gridname="' + self.initGridNameInfoCad + '"]').find('tr[data-uid="' + v.uid + '"]').addClass('k-state-selected');
                                }
                                //console.log(v)
                            })


                        }

                        return description + ""
                    }

                    return "";

                };

                self.onClickCursorInfo = function onClickCursorInfo(showCursorInfo) {
                    self.onViewInfoCad = !showCursorInfo
                    return self.onViewInfoCad;
                }

                self.onSingleFileSelect = function selectSingleFile(file) {

                    

                    if (jQuery.isEmptyObject(self.viewers[file.fileName]) && self.selectedFiles.length) {
                        kendoConsole.log('File non ancora caricato, Attendere!!.', true)
                        return
                    }
                   
                  
                    if (self.showViewerDetail || !(file.fileName in self.viewers)) {
                        return;
                    }

                    self.showCompare = false;
                    self.activatedMeasure = false;
                    self.onResetGridInfoCad();
                    self.showViewersOverlay = true;
                    self.selectedBlock = null;
                    self.showInfoCad = true;


                    $timeout(function () {
                        self.fileShownInDetail = file.fileName;
                        self.fileInDetail = file;
                        self.selectedFloor = self.fileInfo[self.fileInDetail.fileName].id;
                        self.multiAction = self.fileInfo[self.fileInDetail.fileName].multiActionFile;
                        config.model = self.fileInfo[self.fileInDetail.fileName];
                        self.setSelectedFiles(self.selectedFiles, true);
                        self.showViewersOverlay = false;
                        self.setActiveBlocksAndLayersPerFileAll(file.fileName)
                        self.getClassForAsset();
                        self.onSetSplitterViewer();

                        if (self.activateActionDirective) {
                            self.initGridActionSingle("");
                        }

                        self.initGridAction = true;
                        self.optionsPolyline[file.fileName] = {
                            layer: ""
                        }

                    }, 50);

                    $("[data-toggle=popover]").popover({
                        html: true,
                        content: function () {
                            return $('#popover-content').html();
                        }
                    });
                };

                self.onSingleFileSelectRefresh = function selectSingleFile(file, block) {
                    self.fileDxfBlock = [];
                    self.selectedBlock = null;
                    self.showViewersOverlay = true;

                    $timeout(function () {
                        self.fileShownInDetail = file.fileName;

                        if (block) {
                            self.fileDxfBlock = true;
                            self.fileDxfBlock = file.fileName;
                        }

                        self.fileInDetail = file;
                        self.setSelectedFiles(self.selectedFiles, true);
                        self.showViewersOverlay = false;
                    }, 50);

                };

                self.onBack = function back() {
                    self.modalityMode = 'V';

                    if (self.bMeasureMode) {
                        angular.element($("#detailTopPaneContainer")).append(angular.element($("#dxfContainer")));
                        
                        //self.bMeasureMode = false;
                    }
                    
                    self.onClearCompare();
                   

                    if (self.mainContent !== 'viewer') {
                        self.mainContent = 'viewer';
                        // case dbl click handle of viewer we restore old selection on close
                        if (self.previousViewerSelection) {
                            self.viewerSelection = self.previousViewerSelection;
                            self.previousViewerSelection = null;
                            self.clearSelectionViewer[self.fileShownInDetail] = true;
                        }

                        self.clearSelectionViewer[self.fileShownInDetail] = true;
                        self.viewerRefresh();
                        //self.getClassForAsset();

                        //aggiunto 30/10/2019 
                        $timeout(function () {
                            var tdata = [];
                            $.each(self.openTree.dataSource.data(), function (i, v) {
                                if (v.items.length > 0) {
                                    self.onBuildDataFile(v, tdata);
                                }
                            });
                            self.viewers[self.fileInDetail.fileName].viewer.fillPolylines = tdata;
                            //self.viewers[self.fileInDetail.fileName].viewer.onClickHandle(self.eventClick);

                            $.each(self.polilyneSelected, function (i, v) {
                                self.viewers[self.fileInDetail.fileName].viewer.viewer.renderer.controls.selectTools.select(v);
                            });

                            doModal(false);
                        }, 2000);


                        self.initGridAction = false;
                        self.getInfoForCad();
                        return;

                    }

                    if (self.activateActionDirective) {
                        self.initGridAction = false;
                    }

                    self.setActiveBlocksAndLayersPerFileAll(self.fileInDetail.fileName)
                    self.fillPolilyneForAddBlocks[self.fileShownInDetail] = {};

                    if (!self.history.length) {
                        return;
                    }

                    var lastState = self.history[self.history.length - 1];

                    self.selectedTree.value(lastState.selectedTreeValue);
                    self.selectedThema = lastState.selectedThema;
                    self.tematismiTreeCheckedNodes = lastState.tematismiTreeCheckedNodes;
                    self.tematismiTreeOpenPaths = lastState.tematismiTreeOpenPaths;
                    self.restoreSelectedFile(lastState);
                    self.setSelectedFiles(lastState.selectedFiles, lastState.isDetail, true);
                    self.expandMenuThemati = true;
                    self.history.pop();
                    self.fileShownInDetail = '';
                    self.assetMode = false;
                    self.viewInsertBlock = false;
                    self.externalBlocks[self.fileInDetail.fileName] = [];
                    self.fileInDetail = null;
                    self.onSetSplitterViewer();
                };

                self.restoreSelectedFile = function restoreSelectedFile(lastState) {
                    $.each(lastState.selectedFiles, function (i, file) {
                        if (file.fileName === lastState.selectedFile.fileName) {
                            var fileName = lastState.selectedFile.fileName;

                            lastState.selectedFiles[i] = lastState.selectedFile;
                        }
                    });
                };

                self.onLayerClick = function onLayerClick(layerToHandle) {
                    if (layerToHandle.name in self.activeLayers) {
                        delete self.activeLayers[layerToHandle.name];
                    } else {
                        self.activeLayers[layerToHandle.name] = layerToHandle;
                    }
                    self.setActiveBlocksAndLayersPerFile();
                };

                self.onLayerClickAll = function toggleActiveLayerAll(layerToHandle) {
                    var layers = self.blocksAndLayersAll[self.fileInDetail.fileName].layers;
                    self.isAllLayerSelect = true;
                    for (key in layers) {
                        if (layers[key].selectable && !layers[key].checked) {
                            self.isAllLayerSelect = false;
                            self.isAllLayerSelectFileName[self.fileInDetail.fileName] = false;
                        }
                    }

                    self.setActiveBlocksAndLayersPerFileAll(self.fileInDetail.fileName);
                };

                self.onBlockClick = function onBlockClick(blockToHandle) {
                    if (blockToHandle.name in self.activeBlocks) {
                        toggleActiveLayer
                        delete self.activeBlocks[blockToHandle.name];
                    } else {
                        self.activeBlocks[blockToHandle.name] = blockToHandle;
                    }
                    self.setActiveBlocksAndLayersPerFile();
                };

                self.onBlockClickAll = function onBlockClickAll(blockToHandle) {
                    var blocks = self.blocksAndLayersAll[self.fileInDetail.fileName].blocks;
                    self.isAllBlocksSelect = true;
                    for (key in blocks) {
                        if (blocks[key].selectable && !blocks[key].checked) {
                            self.isAllBlocksSelect = false;
                            self.isAllBlockSelectFileName[self.fileInDetail.fileName] = false;
                        }
                    }
                    self.setActiveBlocksAndLayersPerFileAll(self.fileInDetail.fileName);
                };

                // map
                self.mapsTooltipTimeStamp = Date.now();

                self.onMapMarkerClick = function (marker) {
                    self.shownMarkersLocationIds = [marker.data.LOCATION_ID];
                    self.createMarkers();
                    $timeout();
                };

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

                self.onMapSelect = function onMapSelect() {
                    self.filterSelectedFilesByMarkers();
                    self.mainContent = 'viewer';
                    self.refreshTree();
                };

                self.onMapReset = function onMapReset() {
                    self.setInitialMarkersState();
                    self.selectedFiles = self.initialSelectedFiles;
                };

                self.onShowMap = function onShowMap() {
                    var bLanciaMappa = true;

                    $.each(self.mapMarkers, function (i, v) {
                        if (v.latitude == null || v.longitude == null) {
                            bLanciaMappa = false;
                        }
                    })

                    if (bLanciaMappa) {
                        self.mainContent = 'map';
                        self.refreshTree();
                    } else {
                        kendoConsole.log('Indirizzo non normalizzato.', true);
                        
                    }
                    
                };

                // end event handlers

                self.filterSelectedFilesByMarkers = function () {
                    self.selectedFiles = $.map(self.selectedFiles, function (value) {
                        if (self.shownMarkersLocationIds.indexOf(self.fileInfo[value.fileName].LOCATION_ID) !== -1) {
                            return value;
                        }
                    });
                    // self.initialMarkersLocationIds = self.shownMarkersLocationIds.slice(0);
                };

                self.setMarkersFromGridSelection = function setMarkersFromGridSelection() {
                    self.shownMarkersLocationIds = $.map(self.gridSelectionData, function (value) {
                        //value = config.grid.dataItem(value);
                        self.locations[value.LOCATION_ID] = {
                            AS_ASSET_ID: value.AS_ASSET_ID,
                            longitude: value.longitude,
                            latitude: value.latitude,
                        };
                        return value.LOCATION_ID;
                    });
                    self.initialMarkersLocationIds = self.shownMarkersLocationIds.slice(0);
                    self.createMarkers();
                };

                self.setInitialMarkersState = function setInitialMarkersState() {
                    self.shownMarkersLocationIds = self.initialMarkersLocationIds.slice(0);
                    self.createMarkers();
                };

                self.setMarkersFromFiles = function setMarkersFromFiles(newFiles) {
                    var fileNames = Object.keys(newFiles);
                    if (!fileNames.length) {
                        self.setInitialMarkersState();
                        return;
                    }
                    var newMarkerLocationIds = {};
                    $.each(fileNames, function (i, fileName) {
                        newMarkerLocationIds[self.fileInfo[fileName].LOCATION_ID] = true;
                    });
                    self.shownMarkersLocationIds = Object.keys(newMarkerLocationIds);
                    self.createMarkers();
                };

                self.createMarkers = function createMarkers() {
                    self.mapMarkers = $.map(self.shownMarkersLocationIds, function (LOCATION_ID) {
                        return {
                            id: self.locations[LOCATION_ID].AS_ASSET_ID,
                            LOCATION_ID: LOCATION_ID,
                            longitude: self.locations[LOCATION_ID].longitude,
                            latitude: self.locations[LOCATION_ID].latitude,
                            events: {
                                click: self.onMapMarkerClick,
                                mouseover: self.onMapMarkerMouseover,
                            }
                        };
                    });
                };

                // end map

                self.getTematFromTreeByHandle = function getTematFromTreeByHandle(handle) {
                    var description = [];
                    self.forEachCheckedInput(function ($li, $checkedInput, tree) {
                        var nodeInfo = tree.dataItem($li);

                        if (nodeInfo) {
                            var nodeInfo = tree.dataItem($li);
                            if (nodeInfo.handles && handle in nodeInfo.handles) {
                                description.push(nodeInfo.Description);
                            }
                        }
                    });
                    return description.join(', ');
                };

                self.setActiveBlocksAndLayersPerFile = function setActiveBlocksAndLayersPerFile() {
                    self.fileActiveLayers = {};
                    self.fileActiveBlocks = {};
                    $.each(self.viewers, function (fileName) {
                        var activeLayers = [];
                        var activeBlocks = [];
                        if (self.visibleBlocksAndLayers[fileName]) {
                            // set layers
                            if (self.visibleBlocksAndLayers[fileName].layers) {
                                var visibleLayers = self.visibleBlocksAndLayers[fileName].layers;
                                $.each(visibleLayers, function (i, layer) {
                                    if (layer.name in self.activeLayers) {
                                        activeLayers.push(layer);
                                    }
                                });
                            }
                            if (self.visibleBlocksAndLayers[fileName].alwaysOnLayers && activeLayers.length) {
                                activeLayers = activeLayers.concat(self.visibleBlocksAndLayers[fileName].alwaysOnLayers);
                            }

                            // set blocks
                            if (self.visibleBlocksAndLayers[fileName].blocks) {
                                var visibleBlocks = self.visibleBlocksAndLayers[fileName].blocks;
                                $.each(visibleBlocks, function (i, block) {
                                    if (block.name in self.activeBlocks) {
                                        activeBlocks.push(block);
                                    }
                                });
                            }
                        }
                        self.fileActiveLayers[fileName] = activeLayers;
                        self.fileActiveBlocks[fileName] = activeBlocks;
                    });
                };

                self.setActiveBlocksAndLayersPerFileAll = function setActiveBlocksAndLayersPerFileAll(fileName) {
                    var activeLayers = [];
                    var activeBlocks = [];

                    if (self.blocksAndLayersAll[fileName]) {
                        // set layers
                        if (self.blocksAndLayersAll[fileName].layers) {
                            $.each(self.blocksAndLayersAll[fileName].layers, function (i, layer) {
                                if (layer.checked) {
                                    activeLayers.push(layer);
                                }
                            });
                        }

                        // set blocks
                        if (self.blocksAndLayersAll[fileName].blocks) {
                            $.each(self.blocksAndLayersAll[fileName].blocks, function (i, block) {
                                if (block.checked) {
                                    activeBlocks.push(block);
                                }
                            });
                        }
                    }

                    self.fileActiveLayers[fileName] = activeLayers;
                    self.fileActiveBlocks[fileName] = activeBlocks;
                };

                self.hasProperties = function (object) {
                    return Object.keys(object).length !== 0;
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

                self.buildVisibleBlocksAndLayers = function buildVisibleBlocksAndLayers() {
                    $.when(
                        self.getBlocksAndLayersFromDb(), self.viewersReady.promise()
                    )
                        .then(function (access) {
                            $.each(self.selectedFiles, function (i, file) {
                                self.visibleBlocksAndLayers[file.fileName] = {
                                    blocks: $.map(self.viewers[file.fileName].blocks, function (block) {
                                        if (
                                            block.name in access.blocks &&
                                            access.blocks[block.name].VISIBLE === 1
                                        ) {
                                            return {
                                                handle: block.handle,
                                                name: block.name,
                                                id: access.blocks[block.name].ID,
                                            }
                                        }
                                    }),
                                    layers: $.map(self.viewers[file.fileName].layers, function (layer) {
                                        if (
                                            layer.name in access.layers &&
                                            access.layers[layer.name].VISIBLE === 1 &&
                                            access.layers[layer.name].selectable === 1
                                        ) {
                                            return layer;
                                        }
                                    }),
                                    alwaysOnLayers: $.map(self.viewers[file.fileName].layers, function (layer) {
                                        if (
                                            layer.name in access.layers &&
                                            access.layers[layer.name].VISIBLE === 0 &&
                                            access.layers[layer.name].selectable === 1
                                        ) {
                                            return layer;
                                        }
                                    }),
                                }
                            });
                            self.blocksAndLayersReady = true;


                            self.setActiveBlocksAndLayersPerFile();
                            $timeout();
                        });
                };

                self.setShowViewerDetail = function setShowViewerDetail(isDetail, isBack) {
                    if (isDetail === undefined) {
                        return;
                    }

                    if (isDetail !== self.showViewerDetail) {

                        self.showViewerDetail = isDetail;
                        if (!self.showViewerDetail) {
                            self.viewerSelection = {};
                        }
                        if (self.showViewerDetail && !isBack) {
                            self.addHistory(!self.showViewerDetail);
                            self.fillPolilyneForAddBlocks[self.fileShownInDetail] = [];
                            self.getOpenHandleForBlocks();
                        }

                        self.refreshTree();
                    }
                };

                self.setSelectedFiles = function setSelectedFiles(selectedFiles, isShowDetail, isBack) {
                    if (self.selectedFiles.length === 0) {
                        self.initialSelectedFiles = selectedFiles.slice(0);
                    }

                    self.selectedFiles = selectedFiles;

                    if (!self.resolveViewersIfReady()) {
                        self.blocksAndLayersReady = false;
                        self.viewersReady = $.Deferred();
                    }

                    self.setShowViewerDetail(isShowDetail, isBack);
                    self.onShowTree(self.shownTree);


                    //if (selectedFiles.length === 1) {
                    //    self.onSingleFileSelect(selectedFiles[0]);
                    //}
                };

                self.refreshTree = function refreshTree() {
                    if (!self.features.sidebarAccordion) {
                        return;
                    }

                    self.openTree.one('dataBound', self.openTematismiTree);
                    $("#divtreeThemati").append($("#treeThemati"));
                    self.onTreeChange();
                };

                self.getVisibleLayerForFile = function (fileName) {
                    var visibleLayer = [];

                    $timeout(function () {
                        for (key in self.blocksAndLayersAll[fileName].layers) {
                            var layer = self.blocksAndLayersAll[fileName].layers[key];
                            if (layer.checked) {
                                visibleLayer.push(layer);
                            }
                        }

                        return visibleLayer;
                    },500)

                    
                }

                self.cloneFileInDetails = function cloneFileInDetails() {
                    if (!self.fileInDetail) {
                        return null;
                    }
                    var file = {
                        fileName: self.fileInDetail.fileName,
                        tdata: [],
                        selectedLayers: self.getVisibleLayerForFile(self.fileInDetail.fileName)
                    };
                    for (var i = 0; i < self.fileInDetail.tdata.length; i++) {
                        file.tdata.push(
                            Object.assign(
                                Object.assign({}, self.fileInDetail.tdata[i]), {
                                    handles: self.fileInDetail.tdata[i].handles.slice(0),
                                    treelevel: self.fileInDetail.tdata[i].treelevel.slice(0),
                                }
                            )
                        );
                    }
                    return file;
                };

                self.addHistory = function addHistory(showViewerDetail) {
                    self.storeTematismiTreeState();
                    self.history.push({
                        selectedThema: self.selectedThema,
                        selectedTreeValue: self.selectedTree.value(),
                        selectedFile: self.cloneFileInDetails(),
                        selectedFiles: self.selectedFiles,
                        isDetail: showViewerDetail,
                        tematismiTreeCheckedNodes: Object.assign({}, self.tematismiTreeCheckedNodes),
                        tematismiTreeOpenPaths: self.tematismiTreeOpenPaths.slice(0)

                    });
                    if (self.history.length > 1) {
                        self.history.shift();
                    }
                };

                self.getViewerContainerClass = function (e) {

                    
                    if (self.showViewerDetail) {
                        return 'col-lg-12';
                    } else {
                        
                        var colVal = Math.floor(12 / self.selectedFiles.length);
                        colVal = colVal < 3 ? 3 : colVal > 6 ? 6 : colVal;
                        return 'col-lg-' + colVal + ' ' + self.mainContentPreview;

                    }
                };

                self.createInitialFilesFromGridSelection = function createInitialFilesFromGridSelection() {
                    var files = {};
                    self.selectedFiles = [];
                    self.labels = {};
                    self.fileInfo = {};
                    $.each(self.gridSelectionData, function (i, val) {
                        var file = self.parseFile(val);
                        var color = val.HANDLE_COLOR || 'blue';
                        var handleFound = false;
                        if (file.fileName in files) {
                            file = files[file.fileName];
                            $.each(file.tdata, function (i, handleInfo) {
                                if (handleInfo.color === color) {
                                    handleFound = true;
                                    handleInfo.handles.push(val.HANDLE);
                                }
                            });
                        } else {
                            files[file.fileName] = file;
                            self.fileLabels[file.fileName] = val.FLOOR_DS;
                            self.fileInfo[file.fileName] = {
                                scale: val.scala
                            };
                        }
                        if (!handleFound) {
                            file.tdata.push({
                                color: color,
                                handles: [val.HANDLE],
                                treelevel: [],
                            });
                        }
                    });
                    self.setSelectedFiles($.map(files, function (val) {
                        return val;
                    }));
                };

                self.parseFile = function parseFile(fileInfo) {
                    var fileName = JSON.parse(fileInfo.FIlename)[0].name;
                    return {
                        fileName: fileName,
                        tdata: []
                    };
                };

                // tree methods
                self.uncheckNodesNotContainingAnyHighlightedHandle = function uncheckNodesNotContainingAnyHighlightedHandle() {
                    if (!self.intersectHandles || !self.intersectHandles.length) {
                        return;
                    }
                    self.forEachCheckedInput(function ($li, $checkedInput, tree) {
                        var nodeInfo = tree.dataItem($li);
                        var containsAnyHandle = false;
                        if (nodeInfo && nodeInfo.handles) {
                            $.each(self.intersectHandles, function (i, handleId) {
                                if (handleId in nodeInfo.handles) {
                                    containsAnyHandle = true;
                                    return false;
                                }
                            });
                            if (!containsAnyHandle && !nodeInfo.items) {
                                nodeInfo.set('checked', false);
                            }
                        }
                    });
                };

                self.openTematismiTree = function openTree() {
                    var tree = self.openTree;
                    var path = path = self.tematismiTreeOpenPaths.shift();
                    if (!path) {
                        return;
                    }
                    if (!tree) {
                        return;
                    }
                    tree.expandPath(path, self.openTematismiTree);
                };

                self.forEachCheckedInput = function forEachCheckedInput(func) {
                    if (!self.features.sidebarAccordion) {
                        return;
                    }
                    var tree = self.openTree;

                    if (tree.element) {

                        tree.element.find('input:checked').each(function (i, checkedInput) {
                            var $checkedInput = $(checkedInput);
                            var $li = checkedInput.closest('li');
                            return func($li, $checkedInput, tree);
                        }
                        );
                    }
                };

                self.parseHandles = function parseHandles(treeNode) {
                    var handles = {};
                    if (treeNode.dwg_theme) {
                        var handlesInfo = treeNode.dwg_theme.split('#');
                        for (var i = 0; i < handlesInfo.length; i++) {
                            try {
                                var handleFragments = handlesInfo[i].split('|');
                                var handleId = handleFragments[0];
                                handles[handleId] = JSON.parse(handleFragments[1]);
                            } catch (e) {
                                console.log(e, "handled error");
                            }
                        }
                    }
                    return handles;
                };

                self.storeTematismiTreeState = function storeTematismiTreeState() {
                    self.tematismiTreeCheckedNodes = {};
                    self.forEachCheckedInput(function ($li, $checkedInput, tree) {
                        var data = tree.dataItem($li);


                        self.tematismiTreeCheckedNodes[data.id] = true;


                        self.exploreTreeTilRoot($li);
                    });
                };

                self.exploreTreeTilRoot = function exploreTreeTilRoot($li, path) {
                    var tree = self.openTree;
                    if (!path) {
                        path = [];
                    }
                    var parentNode = tree.parent($li);
                    if (!parentNode || !parentNode.length) {
                        if (!path.length) {
                            return;
                        }
                        return self.storePathToExplore(path);
                    }
                    var parentData = tree.dataItem(parentNode);
                    // optimization, further path is already contained in path to open
                    if (self.tematismiTreeCheckedNodes[parentData.id] === false) {
                        return;
                    }
                    if (!(parentData.id in self.tematismiTreeCheckedNodes)) {
                        self.tematismiTreeCheckedNodes[parentData.id] = false;
                    }
                    path.unshift(parentData.id);
                    self.exploreTreeTilRoot(parentNode, path);
                };

                self.storePathToExplore = function storePathToExplore(path) {
                    self.tematismiTreeOpenPaths.push(path);
                };

                //end tree functions

                //before rework -->
                self.callContext = "GridDwgViewer";
                self.labels = {
                    activeLayers: {
                        it: 'Layers attivi',
                        en: 'Active layers',
                    },
                    activeBlocks: {
                        it: 'Blocchi attivi',
                        en: 'Active blocks',
                    },
                    blocks: {
                        it: 'Blocchi',
                        en: 'Blocks',
                    },
                    layers: {
                        it: 'Layers',
                        en: 'Layers',
                    },
                    polylines: {
                        it: 'Polylinee',
                        en: 'Polylines',
                    },
                    blocchiLayer: {
                        it: 'Blocchi e layer',
                        en: 'Blocks and layers',
                    },
                    attendere: {
                        it: 'Attendere',
                        en: 'Waiting',
                    },
                    tematismi: {
                        it: 'Tematismi',
                        en: 'Themes',
                    },
                    selecteditemnotfoundinfiles: {
                        it: "L' elemento selezionato non è presente per il tematismo corrente",
                        en: "The selected item is not present for current theme",
                    },
                    operator: {
                        it: "Operatore",
                        en: "Operator",
                    },
                    applyfilter: {
                        it: "Applica filtro",
                        en: "Apply filter",
                    },
                    Descfile: {
                        it: "Descrizione",
                        en: "Description",
                    },
                    Descfile_1: {
                        it: "Descrizione alt.",
                        en: "Alt. description",
                    },
                    extract: {
                        it: "Esporta",
                        en: "Export",
                    },
                    extract_1: {
                        it: "Esporta PDF",
                        en: "Export PDF",
                    },
                    extract_lyt: {
                        it: "Layout",
                        en: "Layout",
                    },
                    extract_2: {
                        it: "Stampa Cartiglio",
                        en: "Print Cartiglio",
                    },
                    filtertree: {
                        it: "Filtra l'albero",
                        en: "Filter the tree",
                    },
                    removefiltertree: {
                        it: "Rimuovi i filtri dall'albero",
                        en: "Remove tree filters",
                    },
                    filesAvailable: {
                        it: "Visualizza i file disponibili",
                        en: "View available files",
                    },
                    showDetail: {
                        it: "Visualizza i dettagli di tutti gli elementi selezionati nel DWG",
                        en: "Show the details of all the selected elements in DWG",
                    },
                    clearDetail: {
                        it: "Annulla la selezione degli elementi sul DWG",
                        en: "Unselect all the selected items in the DWG",
                    },
                    showActions: {
                        it: "Mostra le azioni disponibili per gli elementi selezionati nella griglia sottostante.Nel caso non ce ne siano le azioni saranno riferite all' ultimo selezionato sul DWG",
                        en: "Show all the available actions for grid's selected items. If none is selected then the actions will refer to the last selected item on DWG",
                    },
                    TitlePdf: {
                        it: "Crea PDF Edificio",
                        en: "Create Edific PDF",
                    },
                    selezionaPiani: {
                        it: "Seleziona piani",
                        en: "Floors selection ",
                    },
                    selezionaTemi: {
                        it: "Seleziona temi",
                        en: "Themes selection",
                    },
                    orientamentoPagina: {
                        it: "Orientamento pagina",
                        en: "Paper orientation",
                    },
                    selectAll: {
                        it: "Seleziona tutti",
                        en: "Select all",
                    },
                    checkOpzioni: {
                        it: "Opzioni",
                        en: "Options",
                    },
                    legendaPdf: {
                        it: "Posizione legenda",
                        en: "Legend position",
                    },
                    exit: {
                        it: "Esci",
                        en: "Exit",
                    },
                    save: {
                        it: "Salva",
                        en: "Save",
                    },
                    selectPen: {
                        it: "Penna",
                        en: "Pens select",
                    },
                    profilesDwg: {
                        it: "Profili",
                        en: "Profiles",
                    },
                    sizePrint: {
                        it: "Dimensione stampa",
                        en: "Size print",
                    },
                    selectFormat: {
                        it: "Formato",
                        en: "Format",
                    },
                    abilitaLayer: {
                        it: "Abilita Layer",
                        en: "Enable Layer",
                    },
                    filterThemati: {
                        it: "Filtra tematismi",
                        en: "Themes filter",
                    },
                    backToInitialMapState: {
                        it: "Torna allo stato iniziale",
                        en: "Return to initial state",
                    },
                    selectAssets: {
                        it: "Mostra 2d viewer per marker visibili",
                        en: "Show 2d viewer for visible markers",
                    },
                    showMap: {
                        it: "Mostra mappa",
                        en: "Show map",
                    },
                    maps: {
                        it: "Mappa",
                        en: "Map",
                    },
                    fileSelezionato: {
                        it: "Seleziona file",
                        en: "Check file",
                    },
                    selectedAll: {
                        it: "Seleziona Tutti",
                        en: "Selecte All",
                    },
                    UnselectedAll: {
                        it: "Deseleziona Tutti",
                        en: "Unselect All",
                    },
                    blockGroup: {
                        it: "Raggruppamento",
                        en: "Group",
                    },
                    viewBlock: {
                        it: "Visualizza come blocco",
                        en: "View block",
                    },
                    viewHandle: {
                        it: "Visualizza come handle",
                        en: "View Handle",
                    },
                    newExternalBlock: {
                        it: "Nuova attrezzatura",
                        en: "New",
                    },
                    copyExternalBlock: {
                        it: "Copia attrezzatura",
                        en: "Copy",
                    },
                    saveExternalBlock: {
                        it: "Salva",
                        en: "Save",
                    },
                    saveOk: {
                        it: "Salvataggio effettuato con successo",
                        en: "Save ok",
                    },
                    saveKO: {
                        it: "Salvataggio non effettuato",
                        en: "Save KO",
                    },
                    insertBlock: {
                        it: "Inserimento blocco",
                        en: "Insert Blocks"
                    },
                    action: {
                        it: "Azioni",
                        en: "Actions"
                    },
                    viewDetail: {
                        it: "Dettaglio",
                        en: "Detail"
                    },
                    refreshTree: {
                        it: "Aggiorna",
                        en: "Refresh"
                    },
                    InfoObjectAction: {
                        it: "Informazioni e Azioni",
                        en: "Informazioni e Azioni"
                    },
                    Architettonico: {
                        it: "Stampa Architettonico",
                        en: "Architectural Print"
                    },
                    esportaDwg: {
                        it: "Esporta Dwg",
                        en: "Export Dwg",
                    },
                    dwgExport: {
                        it: "Esporta",
                        en: "Export",
                    },
                    infoArea: {
                        it: "Aggiungi informazioni area",
                        en: "Add area information",
                    },
                    dimensioneCarattere: {
                        it: "Dimensione carattere",
                        en: "Font size",
                    },
                    stampaEtichette: {
                        it: "Stampa etichette",
                        en: "Print labels",
                    },
                    colorePredTesto: {
                        it: "Colore testo predefinito",
                        en: "Default text color",
                    },
                    colorTestoPers: {
                        it: "Colore testo personalizzato",
                        en: "Custom text color",
                    },
                    colorTestoSfondo: {
                        it: "Colore sfondo testo",
                        en: "Color text background",
                    },
                    getThemiTitle: {
                        it: "Seleziona tematismo",
                        en: "Select thematic",
                    },
                    getLayerLayout: {
                        it: "Seleziona Layout",
                        en: "Select Layout",
                    },
                    getLayerTitle: {
                        it: "Escludi layer",
                        en: "Exclude layer",
                    },
                    getBlockTitle: {
                        it: "Escludi blocco",
                        en: "Exclude Block",
                    },
                    idCartiglio: {
                        it: "Cartiglio",
                        en: "Cartauge",
                    },
                    layerIncludeAll: {
                        it: "Includi tutti i layers",
                        en: "Include all layers",

                    },
                    blockIncludeAll: {
                        it: "Includi tutti i blocchi",
                        en: "Include all blocks",
                    },
                    close: {
                        it: "Esci",
                        en: "Exit",
                    },
                    profiesPdf: {
                        it: "Profilo",
                        en: "Profile",
                    },
                    exportDwg: {
                        it: "Dwg",
                        en: "Dwg",
                    },
                    addProfile: {
                        it: "Aggiungi",
                        en: "Add",
                    },
                    profiesPdf: {
                    it: "Profili",
                        en: "Profiles",
                    },
                    selezionaLayersStampa: {
                        it: "Layers stampa",
                        en: "Layers print",
                    },
                    dwgCartiglio: {
                    it: "Cartiglio",
                        en: "Cartouche",
                    },
                    Measure: {
                        it: "Misurazione",
                        en: "Measure",
                    },
                    Measure: {
                        it: "Disegna",
                        en: "Drawing",
                    },
                    Estrazioni: {
                        it: "Estrazioni",
                        en: "Extracions",
                    },
                    EstraiTemes: {
                        it: "Estrai tematismi",
                        en: "Extract themes",
                    },
                    Estrai: {
                        it: "Estrai",
                        en: "Extract",
                    },
                    EstraiLocali: {
                        it: "Estrai locali",
                        en: "Extract rooms",
                    },
                    EstraiImpianti: {
                        it: "Estrai impianti",
                        en: "Extract plants",
                    },
                    Verticale: {
                        it: "Verticale",
                        en: "Vertical",
                    },
                    Orizzontale: {
                        it: "Orizzontale",
                        en: "Horizontal",
                    },
                    unTemaPerP: {
                        it: "Un tema per pagina",
                        en: "One theme per page",
                    },
                    temiSuLayer: {
                        it: "Temi su layer",
                        en: "Themes on layers",
                    },
                    stampa_titolo: {
                        it: "Stampa titolo",
                        en: "Print title",
                    },
                    stampa_logo: {
                        it: "Stampa logo",
                        en: "logo print ",
                    },
                    excludeThemati: {
                        it: "Escludi tematismi",
                        en: "Exclude themes",
                    },
                    compareDxf: {
                        it: "Comparazione",
                        en: "Comparison",
                    },
                    selezionaFile: {
                        it: "Seleziona file",
                        en: "File selection",
                    },
                    caricaFile: {
                        it: "Carica file",
                        en: "Load file",
                    },
                    setTransparent: {
                        it: "Trasparente",
                        en: "Transparent",
                    },
                    added: {
                        it: "Aggiunti",
                        en: "Added",
                    },
                    minus: {
                        it: "Rimossi",
                        en: "Minus",
                    },
                    optionsDwg: {
                        it: "Opzioni dwg",
                        en: "Dwg options",
                    },
                    exportDxf: {
                        it: "Esporta DXF",
                        en: "Export DXF",
                    },

                    saveDxf: {
                        it: "Salva DXF",
                        en: "Save DXF",
                    },
                };

                self.getLabels = function (key) {
                    if (key in self.labels) {
                        return self.labels[key][window.culture.substring(0, 2)];
                    }
                    return getObjectText(key);
                };

                //self.grid = config.grid;
                self.treeFilters = {
                    Operator: "AND"
                };
                self.showFilters = false;
                self.disabledAll = false;
                self.showFilesGridData = false;
                self.showExtraction = false;
                self.showExtractionPdf = false;
                self.Themes = {};
                self.filtersActive = false;
                self.options = config;
                self.detailInfo = [];
                self.showDetail = false;
                config.ready();

                self.closeViewer = function (event) {
                    $("#layout-condensed-toggle").click();
                    $(".page-title").show();
                    $('.header-seperation').show();
                    $('.footer-widget').show();
                    $('#main-menu').find('li').show();
                   
                    if (self.showFilesGridData ||
                        self.showExtraction ||
                        self.showExtractionPdf
                    ) {
                        self.disableGridAndExtraction()
                    } else {
                        $(event.currentTarget)
                            .closest("#grid-dwg-controller")
                            .hide(1000);
                        $(event.currentTarget).closest("#grid-dwg-controller").remove();

                        $scope.$destroy();
                    }
                    $(".page-title").find('a[href="javascript:history.back()"]').show();

                    if (window.treeControllerR3) {
                        window.treeControllerR3.onRefresh = true;
                        window.treeControllerR3.loadHtmlForm(window.treeControllerR3.selectedNode.htmlPage);

                        var myModal = $("#" + window.treeControllerR3.modalId);

                        if (myModal.length > 0) {
                            myModal.css({
                                display: 'inline'
                            });
                        }
                    }

                    //if (angular.element($('tree-view-r3')).length > 0) {
                    //    angular.element($('tree-view-r3')).scope().t.onRefresh = true;
                    //    angular.element($('tree-view-r3')).scope().t.loadHtmlForm(angular.element($('tree-view-r3')).scope().t.selectedNode.htmlPage);

                    //    var myModal = $("#" + angular.element($('tree-view-r3')).scope().t.modalId)

                    //    if (myModal.length > 0) {
                    //        myModal.css({
                    //            display: 'inline'
                    //        });
                    //    }
                    //}
                };

                self.disableGridAndExtraction = function () {
                    self.showFilesGridData = false;
                    self.showExtractionPdf = false;
                    self.showExtraction = false;
                };

                self.currentDetail = [];

                self.disableDetail = function () {
                    self.showDetail = false;
                    self.currentDetail = [];
                    $(".openseadragon-container")
                        .find("path[stroke]")
                        .removeAttr("stroke");
                    $(".openseadragon-container")
                        .find("path[stroke-width]")
                        .removeAttr("stroke-width");
                };

                self.showActionGrid = function showActionGrid() {
                    $timeout(function () {
                        self.isActionGridReady = true;
                    });
                };

                self.onDataBoundGrid = function (e) {
                    $('div[gridName="' + e.sender.options.code + '"]').find('.k-grid-add').hide();
                    //console.log(e);
                }

                self.onDataBoundGridBlocks = function (e) {

                    console.log('arrivato');
                }

                self.onSaveGrid = function (e) {
                    console.log(e);
                }

                self.onClickShowActionsDett = function onClickShowActionsDett() {
                    //if (!self.actionGridName) {


                    MF.api.get({
                        storedProcedureName: self.storedForCad['DWG_Get_Action_Grid_Name'] ? self.storedForCad['DWG_Get_Action_Grid_Name'] : 'core.DWG_Get_Action_Grid_Name',
                        assetMode: self.assetMode
                    })
                        .then(function (res) {
                            if (!res.length || !res[0].length) {
                                return;
                            }

                            self.actionGridData = {
                                selectedTree: self.selectedTree.value(),
                                openedByGridName: sourcegridname,
                                idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined

                            };

                            self.actionGridFilter = {
                                logic: 'or',
                                filters: $.map(Object.keys(self.viewerSelection), function (value) {
                                    return {
                                        operator: 'eq',
                                        field: 'HANDLE',
                                        value: value,
                                    };
                                })
                            };

                            self.actionGridNameDett = res[0][0].magicGridName;
                            self.gridAddBlockHandleKey = res[0][0].handle_key;

                        });



                    self.showDetail = true;
                };

                self.onClickShowActions = function onClickShowActions() {

                    //aggiunto 30/10/2019
                    self.polilyneSelected = [];
                    $.each(self.viewers[self.fileInDetail.fileName].viewer.viewer.renderer.controls.selectTools.selected, function (i, v) {
                        self.polilyneSelected.push(v);
                    });

                    self.addHistoryAction(true);
                    self.clearSelectionViewer[self.fileShownInDetail] = false;
                    self.isActionGridReady = false;
                    self.mainContent = 'actionGrid';
                    self.actionGridName = ''

                    //if (!self.actionGridName) {
                    MF.api.get({
                        storedProcedureName: self.storedForCad['DWG_Get_Action_Grid_Name'] ? self.storedForCad['DWG_Get_Action_Grid_Name'] : 'core.DWG_Get_Action_Grid_Name',
                        assetMode: self.assetMode
                    })
                        .then(function (res) {
                            if (!res.length || !res[0].length) {
                                return;
                            }

                            self.actionGridData = {
                                selectedTree: self.selectedTree.value(),
                                openedByGridName: sourcegridname,
                                idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined

                            };

                            self.actionGridFilter = {
                                logic: 'or',
                                filters: $.map(Object.keys(self.viewerSelection), function (value) {
                                    return {
                                        operator: 'eq',
                                        field: 'HANDLE',
                                        value: value,
                                    };
                                })
                            };

                            self.actionGridName = res[0][0].magicGridName;
                            self.gridAddBlock = res[0][0].addBlock;
                            self.gridAddBlockHandleKey = res[0][0].handle_key;

                            $timeout(function () {
                                self.showActionGrid();
                            });
                        });

                    self.showDetail = true;
                };

                self.options.onClick = function (event) {
                    if (event.svgPath) {
                        var color = "red";
                        if (
                            $(event.svgPath).attr("fill") == color ||
                            $(event.svgPath).attr("fill") == "#FF0000" ||
                            $(event.svgPath).attr("fill") == "rgb(255, 0, 0)"
                        )
                            color = "black";

                        //event has been already selected
                        if ($(event.svgPath).attr("stroke")) {
                            $(event.svgPath).removeAttr("stroke");
                            $(event.svgPath).removeAttr("stroke-width");
                            //delete from datasource of the grid
                            var tosplice = -1;
                            $.each(self.currentDetail, function (i, v) {
                                if (v.handle == event.handle) tosplice = i;
                            });
                            if (tosplice > -1) self.currentDetail.splice(i, 1);
                            if (!self.currentDetail.length)
                                self.showDetail = false;
                            return;
                        }
                        $(event.svgPath).attr("stroke", color);
                        $(event.svgPath).attr("stroke-width", 0.005);
                    }

                    self.currentDetailIdentifier = {
                        ThematiId: event.tematid,
                        Handle: event.handle,
                        LinkFile: Object.keys(self.files)[0],
                    };
                    config.MF.api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_GetTreeDetail'] ? self.storedForCad['DWG_GetTreeDetail'] : "core.DWG_GetTreeDetail",
                            data: {
                                ThematiId: event.tematid,
                                Handle: event.handle,
                                LinkFile: Object.keys(self.files)[0],
                            },
                        })
                        .then(
                            function (result) {
                                if (!result.length) {
                                    self.showDetail = false;
                                    return;
                                }
                                var entry = {
                                    handle: event.handle
                                };
                                var columns = [];
                                $.each(result[0], function (i, v) {
                                    //self.detailInfo.push({ label: v.label, value: v.Value, bold: v.Bold });
                                    var field = v.label
                                        .replace("#", "")
                                        .replace(" ", "_");
                                    entry[field] = v.Bold ?
                                        "<b>" + v.Value + "</b>" :
                                        v.Value;
                                    columns.push({
                                        field: v.label
                                            .replace("#", "")
                                            .replace(" ", "_"),
                                        title: v.label,
                                        width: "140px",
                                        template: function (dataItem) {
                                            return dataItem[field];
                                        },
                                    });
                                });
                                self.currentDetail.push(entry);
                                self.showDetail = true;
                                $timeout();
                            },
                            function (err) {
                                console.log(err);
                            },
                        );
                };

                self.getLabelForFile = function () {
                    var grid = self.openGrid;
                    if (grid && self.filekey)
                        $.each(grid.dataSource.data(), function (i, v) {
                            if (v.FIlename) {
                                var filename = JSON.parse(v.FIlename)[0].name;
                                if (filename == self.filekey)
                                    self.Label = v.Descfile_1;
                            }
                        });
                };

                self.toggleFilter = function () {
                    self.showFilters = !self.showFilters;
                };

                //config.setFiles = function (grid) {
                //    self.grid = grid;
                //    self.files = self.getTematFromGrid();
                //    self.reload = true; //force file reload when changing selection from grid
                //    self.selectedTree.setDataSource(
                //        new kendo.data.DataSource(self.TreesDs),
                //    );
                //    $timeout(); //wakes-up the "files" watcher of the directive (dwg-viewer)...
                //};

                //var sourceItemIds = $.map(self.grid.select(), function (v, i) {
                //    return self.grid.dataItem(
                //        v,
                //    )[self.grid.dataSource.options.schema.model.id];
                //});

                var sourceItemIds = $.map(self.gridSelectionData, function (v, i) {
                    //return v.WorkflowInstance_ID ? v.WorkflowInstance_ID : v.AS_ASSET_ID ? v.AS_ASSET_ID : v.id;
                    return v.AS_ASSET_ID ? v.AS_ASSET_ID : v.id;
                });

                var WorkflowInstanceItemIds = $.map(self.gridSelectionData, function (v, i) {
                    return v.WorkflowInstance_ID ? v.WorkflowInstance_ID : 0;
                });

                var objectType = $.map(self.gridSelectionData, function (v, i) {
                    return v.objectType ? v.objectType : 'ASSET';
                })[0];

                //self. sourceItemIds = $.map(self.gridSelectionData, function (v, i) {
                //    return v.id
                //});

                //self.sourceItemTipassCode = sourceItemTipassCode;

                var sourcegridname = config.id.replace("dwg_", '');//self.grid.element.attr("gridname");

                self.checkboxesTemplate = {
                    template: "<input type='checkbox' dwg_file='#= item.dwg_theme #' thematiid:'#= item.ThematiId #' name='#= item.ValueTemat ? item.ValueTemat : item.ThematiId #' \
                            #if (!item.checkable){#\
                                disabled \
                            #}#\
                            #if (item.checked){#\
                                checked\
                            #}# />",
                };

                self.TreesDs = {
                    transport: {
                        read: {
                            url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                            dataType: "json",
                            contentType: "application/json",
                            data: {
                                storedprocedure: self.storedForCad['DWG_GetAllTreesList'] ? self.storedForCad['DWG_GetAllTreesList'] : "core.DWG_GetAllTreesList",
                                gridname: sourcegridname,
                                id: sourceItemIds,
                                caller: self.callContext,
                                viewBlockThemati: self.showViewerDetail && self.fileInDetail ? 1 : 0,
                            },

                            type: "POST",
                        },
                        parameterMap: function (options, operation) {
                            return kendo.stringify(options);
                        },
                    },
                    schema: {
                        parse: function (data) {


                            return data[0].drows.length ?
                                data[0].drows[0].Table :
                                [];

                        },
                    },
                };

                //triggered on databound of the tree in order to load the form corresponding to the selected item in the drop down

                self.loadFilterForm = function (e) {

                    self.ready = true;
                    if (self.selectedTree && self.selectedTree.select() > -1)
                        self.formName = self.selectedTree.dataItem(
                            self.selectedTree.select(),
                        ).Form;

                    $timeout(function () {
                        self.loadingTree = false;
                        if (!self.activeAferActionCallBack) {
                            // doModal(false);
                            if (!self.showViewerDetail) {
                                self.initGridInfoCadActivateAll();
                            }
                        }

                    }, 1500)
                };

                self.filterHandler = function () {
                    if (!self.treeFilters) return null;

                    var filterForDB = {
                        Operator: self.treeFilters.Operator
                    };
                    var valuesArray = [];
                    var obj = {};
                    if (self.treeFilters.Values) {
                        var obj = {};
                        $.each(self.treeFilters.Values, function (key, value) {
                            var iof = key.indexOf("__filterOperator");
                            if (iof != -1) {
                                var sk = key.substring(0, iof);
                                if (!obj[sk])
                                    obj[sk] = {
                                        condition: value,
                                    };
                                else obj[sk].condition = value;
                            } else {
                                if (!obj[key]) obj[key] = {
                                    value: value
                                };
                                else obj[key].value = value;
                            }
                        });
                    }
                    $.each(obj, function (key, value) {
                        valuesArray.push($.extend({
                            field: key
                        }, value));
                    });
                    filterForDB.Values = valuesArray;
                    return filterForDB;
                };

                self.resetViewer = function () {
                    self.filtersActive = false;
                    self.treeFilters = {
                        Operator: "AND",
                        Values: {}
                    };
                    $scope.$broadcast("schemaFormValidate");
                    self.selectedTreeExpandedItem = null;
                    // self.files = {};
                    // self.filekey = null;
                    self.Label = null;
                };

                self.showFilesGridData_ = function () {
                    self.onFilesGridShow();
                    self.showFilesGridData = true;
                };

                self.filesGridColumns = [{
                    field: "Descfile",
                    title: self.getLabels("Descfile")
                },
                {
                    field: "Descfile_1",
                    title: self.getLabels("Descfile_1"),
                },
                ];

                self.onFilesGridShow = function () {
                    self.openGrid.clearSelection();
                };

                self.onFilesGridChange = function (e) {
                    if (!e.sender.select().length) return;

                    var datarow = self.openGrid.dataItem(e.sender.select());
                    var key = JSON.parse(datarow.FIlename)[0].name;
                    if (self.files[key]) {
                        self.filekey = JSON.parse(datarow.FIlename)[0].name;
                        self.Label = datarow.Descfile_1;
                    } else
                        kendoConsole.log(
                            self.getLabels("selecteditemnotfoundinfiles"),
                            "info"
                        );
                    //close the file selector
                    self.closeViewer();
                };

                self.onTreeChange = function (caller) {
                    
                    var iCountParameterMap = 0;
                    self.initTree = true;
                    self.loadingTree = true;

                    if (caller != 'blocks') {
                        doModal(true)
                    }

                    // self.getTreeThemas();

                    var node = self.selectedTree.dataSource._data.filter(function (node) {
                        return node.ID == self.selectedTree.value()
                    })

                    self.optionsExternalBlock = node.length> 0 ? node[0].RSN_THEMAT_FLAG_BLOCK : false;
                    self.assetMode = self.optionsExternalBlock;
                    self.viewerSelection = {};
                    self.externalBlocksToSave = {};

                    if (self.fileShownInDetail != "") {
                        self.viewers[self.fileShownInDetail].viewer.clearExternalBlocks();
                        self.toolTipDesc(self.fileInDetail);
                    }

                    //the filter evaluates caller, while the change event on the drop does not
                    if (!caller) {
                        self.resetViewer();
                    }

                    self.pdfThemes = [];

                   


                    //The data load of the tree items
                    self.selectedTreeData = new kendo.data.HierarchicalDataSource({
                        transport: {
                            read: {
                                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                                dataType: "json",
                                contentType: "application/json",
                                data: {
                                    storedprocedure: self.storedForCad['DWG_GetTreeContent'] ? self.storedForCad['DWG_GetTreeContent'] : "core.DWG_GetTreeContent",
                                    gridData: {
                                        gridname: sourcegridname,
                                        id: sourceItemIds,
                                        idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                                        fileName: self.showViewerDetail && self.fileInDetail ? self.fileInDetail.fileName : ''  
                                    },
                                    treeData: {
                                        id: self.selectedTree.value(),
                                    },
                                    selectedFiles: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,
                                    selectedFilesStart: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,
                                    treeFilter: self.filterHandler(),
                                    viewBlockThemati: self.showViewerDetail && self.fileInDetail ? 1 : 0,
                                    idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                                    guid_handle: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].guid_handle : undefined,
                                    WorkflowInstanceItemId: WorkflowInstanceItemIds,
                                    objectType: objectType
                                },
                                type: "POST",
                            },
                            parameterMap: function (options, operation) {
                                options.treeData.expandedItem = self.selectedTreeExpandedItem ? self.selectedTreeExpandedItem : null;
                                options.idFloor = self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined;
                                options.selectedFiles = self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined;
                                options.viewBlockThemati = self.showViewerDetail && self.fileInDetail ? 1 : 0;
                                options.guid_handle = self.handleGuidBlock ? self.handleGuidBlock : undefined;
                                iCountParameterMap += 1
                                return kendo.stringify(options);
                            },
                        },
                        schema: {
                            parse: function (data) {


                                if (iCountParameterMap == self.selectedTreeData.transport.parameterMap.length && self.activeAferActionCallBack) {
                                    $timeout(function () {
                                        function buildDataFile(item, tdata) {

                                            for (var i = item.items.length - 1; i >= 0; i--) {
                                                var oitem = item.items[i];
                                                if (oitem.items && oitem.items.length > 0) {
                                                    buildDataFile(oitem, tdata);
                                                }

                                                if (oitem.checked) {
                                                    var handelToadd = [];

                                                    for (handle in oitem.handles._handlers) {
                                                        handelToadd.push(handle);
                                                    }

                                                    tdata.push({
                                                        id: oitem.ValueTemat,
                                                        tematid: oitem.ThematiId,
                                                        color: oitem.ColourTemat ?
                                                            oitem.ColourTemat.replace(
                                                                /[\s]/g,
                                                                "",
                                                            ) :
                                                            null,
                                                        treelevel: oitem.Treedesc ?
                                                            oitem.Treedesc.split("|") :
                                                            null,
                                                        handles: handelToadd,
                                                        isBlock: oitem.isBlock ? oitem.isBlock : false
                                                    });
                                                }
                                            }
                                        }

                                        var tdata = [];

                                        $.each(self.openTree.dataSource.data(), function (i, v) {
                                            if (v.items.length > 0) {
                                                buildDataFile(v, tdata);
                                            }
                                        });

                                        self.onReloadGrid(tdata);

                                        //self.viewers[self.fileInDetail.fileName].viewer.fillPolylines = tdata;
                                        //self.viewers[self.fileInDetail.fileName].viewer.viewer.renderer.controls.selectTools.select(self.eventClick);

                                        //self.viewers[self.fileInDetail.fileName].viewer.onClickHandle(self.eventClick);
                                        //self.onDetailViewerClick(self.eventClick);
                                        //self.onDetailViewerClick(self.eventClick);
                                        //self.activeAferActionCallBack = false;

                                    }, 3000)

                                }

                                if (!data[0].drows.length) {
                                    console.log('Classificazione tematismi non trovata');
                                    doModal(false);
                                    return [];
                                } 

                                $.each(data[0].drows[0].Table, function (
                                    i,
                                    v
                                ) {
                                    v.showColor = true;
                                  

                                   
                                    //1st level
                                    if (
                                        !v.WhereBefore &&
                                        v.ThematiId &&
                                        !v.ValueTemat &&
                                        v.Description
                                    ) {
                                        ////themas for pdf
                                        self.pdfThemes.push({
                                            id: v.ThematiId,
                                            text: v.Description,
                                            value: true
                                        });
                                        v.showColor = false;
                                        self.Themes[v.ThematiId] = v.Description;
                                    }

                                    v.ColourTemat =
                                        v.ColourTemat &&
                                            v.ColourTemat.indexOf(" ") != -1 ?
                                            v.ColourTemat.replace(
                                                / /g,
                                                "",
                                            ) :
                                            v.ColourTemat;

                                    if (
                                        v.ColourTemat &&
                                        v.ColourTemat.indexOf("#") == -1
                                    )
                                        v.ColourTemat = "#" + v.ColourTemat;

                                    v.id = (
                                        v.ValueTemat ?
                                            v.Treedesc + v.ValueTemat :
                                            v.ThematiId
                                    ) +
                                        (
                                            v.SubmatId ?
                                                'SubmatId' + v.SubmatId :
                                                ''
                                        );
                                    v.handles = self.parseHandles(v);
                                    if (v.id && self.tematismiTreeCheckedNodes[v.id] === true) {
                                        v.checked = true;
                                    }
                                });

                                if (data.length > 1 && self.selectedFiles.length === 0 && !self.showViewerDetail) {
                                    var allFiles = [];
                                    try {
                                        $.each(data[1].drows[0].Table, function (i, fileInfo) {
                                            try {
                                                self.locations[fileInfo.LOCATION_ID] = {
                                                    longitude: fileInfo.LOCATION_LONGITUDE,
                                                    latitude: fileInfo.LOCATION_LATITUDE,
                                                    AS_ASSET_ID: fileInfo.AS_ASSET_ID,
                                                };

                                                var file = self.parseFile(fileInfo);

                                                allFiles.push(file);
                                                self.fileLabels[file.fileName] = fileInfo.Descfile_1;
                                                self.fileInfo[file.fileName] = {
                                                    longitude: fileInfo.LOCATION_LONGITUDE,
                                                    latitude: fileInfo.LOCATION_LATITUDE,
                                                    scale: fileInfo.scale ? fileInfo.scale : 1,
                                                    LOCATION_ID: fileInfo.LOCATION_ID,
                                                    id: fileInfo.AS_ASSET_ID,
                                                    description: fileInfo.shortDesc,
                                                    idDwg: fileInfo.dwg_id === undefined ? fileInfo.AS_ASSET_ID : fileInfo.dwg_id,
                                                    multiActionFile: fileInfo.multiActionFile ? true : false,
                                                    pathFileCad: fileInfo.pathFileCad ? fileInfo.pathFileCad : self.pathFileCad,
                                                    useCompression: fileInfo.useCompression === undefined ? true : fileInfo.useCompression,
                                                    isInCad: fileInfo.isInCad === undefined ? true : fileInfo.isInCad,
                                                    id_asset: fileInfo.AS_ASSET_ID,
                                                    scaleDrawing: fileInfo.scaleDrawing ? fileInfo.scaleDrawing : 1
                                                        };
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        });




                                        self.filesGridData = new kendo.data.DataSource({
                                            data: data[1].drows[0].Table,
                                        });

                                        self.setSelectedFiles(allFiles);
                                    }
                                    catch (e) {
                                        console.log("Record per i tematismi non trovati");

                                    }

                                }

                                if (data.length > 2 && self.showViewerDetail) {
                                    self.findExternalBlocks(data[2].drows[0].Table);
                                }

                                return data[0].drows[0].Table;
                            },

                        },
                    });
                };

                self.onReloadGrid = function (tdata) {
                    self.viewers[self.fileInDetail.fileName].viewer.fillPolylines = tdata;

                    $.each(self.viewerSelectionRefresh, function (i, v) {
                        iEsiste = 0;

                        $.each(tdata, function (ii, vv) {
                            if (iEsiste == 1) { return }
                            $.each(vv.handles, function (iii, vvv) {
                                if (iEsiste == 1) { return }
                                if (v.handle == vvv) {
                                    iEsiste = 1;
                                }
                            });
                        });

                        if (iEsiste == 1) {
                            self.viewers[self.fileInDetail.fileName].viewer.viewer.renderer.controls.selectTools.select(v);
                        }
                        else {
                            self.viewers[self.fileInDetail.fileName].viewer.viewer.renderer.controls.selectTools.deselect(v);
                        }
                    });

                    self.viewers[self.fileInDetail.fileName].viewer.onClickHandle(self.eventClick);
                    self.onDetailViewerClick(self.eventClick);

                    if (self.activeAferActionCallBack) {
                        doModal(false);
                    }
                    self.activeAferActionCallBack = false;
                }

                self.selectedTreeDataNew = function () {

                    return MF.api.get({
                        storedProcedureName: self.storedForCad['DWG_GetTreeContent_father'] ? self.storedForCad['DWG_GetTreeContent_father'] : "core.DWG_GetTreeContent_father",
                        data: {
                            gridname: sourcegridname,
                            id: sourceItemIds,
                            caller: self.callContext,
                            viewBlockThemati: 0 //self.showViewerDetail && self.fileInDetail ? 1 : 0,
                        },
                        treeData: {
                            id: self.selectedTree.value(),
                        },
                    })
                        .then(function (result) {

                            self.clathemList = result[0];
                            return result[0];

                        }, function (err) {
                            console.log(err);
                        });
                }

                self.findExternalBlocks = function findExternalBlocks(tableBlocks) {
                    
                    function createBlock(el) {
                        return {
                            "blockName": el.blockName,
                            "handle": el.handle,
                            "draggable": el.draggable ? el.draggable : false,
                            "selectable": el.selectable ? el.selectable : false,
                            "visible": el.visible ? el.visisle : false,
                            "external": el.external ? el.external : false,
                            "position": {
                                "x": el.x,
                                "y": el.y,
                                "xscale": el.xscale ,//* el.indexScale ? el.indexScale : 1,
                                "yscale": el.yscale ,//* el.indexScale ? el.indexScale : 1,
                                "rotation": el.rotation,
                                "indexScale": 1 //el.indexScale ? el.indexScale : 1  //da passare a Giliuo quando sarà possibile
                            },
                            "xZoomScale": el.xZoomScale,
                            "yZoomScale": el.yZoomScale,
                            "xScale": el.xscale ,//* //el.indexScale ? el.indexScale : 1,
                            "yScale": el.yscale ,//* //el.indexScale ? el.indexScale : 1,
                            "colorScaleStart": el.colorScaleStart,
                            "colorScaleEnd": el.colorScaleEnd,
                            "scaleDwg": el.scaleDwg,
                            "indexScale": el.indexScale,
                            "handleFather": el.handleFather,
                            "color":el.color,
                            "handle_father": el.handle_father,
                            "useCompression" : el.useCompression == false ? false : true
                        }
                    }

                    var blocks = {};
                    var externalBlocks = self.externalBlocks[self.fileInDetail.fileName] === undefined ? [] : self.externalBlocks[self.fileInDetail.fileName];                    
                    self.externalBlocks[self.fileInDetail.fileName] = [];
                    $.each(tableBlocks, function (i, el) {



                        if (-1 == $.map(externalBlocks, function (block) { return block.fileName }).indexOf(el.fileName)) {

                            blocks[el.fileName] = {
                                fileName: el.fileName,
                                blockName: el.blockName,
                                type_block: el.type_block,
                                useCompression: el.useCompression,
                                options: []
                            };
                            blocks[el.fileName].options.push(createBlock(el));
                            externalBlocks.push(blocks[el.fileName]);
                        } else {
                            $.each(externalBlocks, function (i, v) {
                                if (v.fileName == el.fileName) {
                                    if (-1 == $.map(v.options, function (block) { return block.handle }).indexOf(el.handle)) {
                                        v.options.push(createBlock(el));
                                    }
                                }
                            })

                            
                        }

                        
                    });


                    //$.each(tableBlocks, function (i, el) {
                    //    if (-1 == $.map(externalBlocks, function (block) { return block.fileName }).indexOf(el.fileName)) {
                    //        blocks[el.fileName] = {
                    //            fileName: el.fileName,
                    //            blockName: el.blockName,
                    //            type_block: el.type_block,
                    //            options: []
                    //        };

                    //        externalBlocks.push(blocks[el.fileName]);
                    //    }

                    //    $.map(externalBlocks, function (block) {
                    //        if (block.fileName == el.fileName ) {
                    //            if (-1 == $.map(block.options, function (block) { return block.handle }).indexOf(el.handle)) {
                    //                block.options.push(createBlock(el));
                    //            }
                    //        }
                    //    })
                    //});


                    $.each(externalBlocks, function (i, v) {
                        self.externalBlocks[self.fileInDetail.fileName].push(v);
                    })
                    
                    self.assetMode = true;   

                   
                }

                //data of the expanded node.It's called before the data load
                self.setTreeExpandedItem = function (e) {
                    self.selectedTreeExpandedItem = self.openTree.dataItem(
                        e.node,
                    );


                    //$timeout(function () {
                    //    self.setTreeExpandedItemNew(self.openTree.dataItem(e.node), true);
                    //},1000)


                };

                self.reftrehR3Page = function (e) {
                    console.log(e);
                }

                //get info for a single node
                self.getFileInfo = function (data, readerInputs) {
                    //decode the very weird data format from db stored procedure...ED9FC|[{"name":"..."}]#EDRFC|[{"name":"..."}]#...
                    if (data.dwg_theme && data.dwg_theme.indexOf("|") != -1) {
                        var splitstring = data.dwg_theme.split("#"); //
                        data.dwg_file = [];
                        if (splitstring.length) {
                            $.each(splitstring, function (i, v) {
                                var filename = JSON.parse(v.split("|")[1])[0]
                                    .name;
                                data.dwg_file.push(filename);
                                self.assetMode = data.isBlock || false;
                                if (!readerInputs[filename])
                                    readerInputs[filename] = {
                                        tdata: [{
                                            id: data.ValueTemat,
                                            tematid: data.ThematiId,
                                            color: data.ColourTemat ?
                                                data.ColourTemat.replace(
                                                    /[\s]/g,
                                                    "",
                                                ) :
                                                null,
                                            treelevel: data.Treedesc ?
                                                data.Treedesc.split("|") :
                                                null,
                                            handles: [],
                                            isBlock: data.isBlock ? data.isBlock : false
                                        },],
                                    };

                                readerInputs[filename].tdata[0].handles.push(
                                    v.split("|")[0],
                                );

                                //console.log(data.Area);


                            });
                            // data.dwg_theme = JSON.stringify(theme);
                        }
                    } else if (
                        data.dwg_file &&
                        data.dwg_file.indexOf("{") != -1
                    ) {
                        data.dwg_file = JSON.parse(data.dwg_file)[0].name;
                        if (!readerInputs[data.dwg_file])
                            readerInputs[data.dwg_file] = data.dwg_theme ?
                                JSON.parse(data.dwg_theme) :
                                [];
                        else
                            readerInputs[data.dwg_file].tdata.push(
                                data.dwg_theme ?
                                    JSON.parse(data.dwg_theme).tdata[0] :
                                    [],
                            );
                    }
                    return readerInputs;
                };
                //check event
                self.getTematFromTree = function (e, refreshGrid) {



                    function arraysEqual(arr1, arr2) {
                        if (arr1.length !== arr2.length) return false;
                        for (var i = arr1.length; i--;) {
                            if (arr1[i] !== arr2[i]) return false;
                        }

                        return true;
                    }

                    function uncheckChildren(nodedata, isfirst) {
                        if (nodedata.checked && !isfirst)
                            nodedata.set("checked", false);
                        if (nodedata.items)
                            $.each(nodedata.items, function (i, v) {
                                uncheckChildren(v, false);
                            });
                    }

                    // Calculate intersection of multiple array or object values.
                    function intersect(arrList) {
                        var arrLength = Object.keys(arrList).length;
                        // (Also accepts regular objects as input)
                        var index = {};
                        for (var i in arrList) {
                            for (var j in arrList[i]) {
                                var v = arrList[i][j];
                                if (index[v] === undefined) index[v] = {};
                                index[v][i] = true; // Mark as present in i input.
                            }
                        }
                        var retv = [];
                        for (var i in index) {
                            if (Object.keys(index[i]).length == arrLength)
                                retv.push(i);
                        }
                        return retv;
                    }

                    function getHandlesIntersection() {
                        var all = [];
                        $.each(self.checkedThemes, function (key, value) {
                            all.push(value.handles);
                        });
                        return intersect(all);
                    }
                    //Build the files based on checked items
                    function buildFiles(data, newfiles, isIntersection) {
                        if (data.checked) {
                            var fileInfo = {};
                            fileInfo = self.getFileInfo(data, fileInfo);
                            //se tra i nuovi file selezionati non c'e' quello del nodo corrente deseleziono il nodo
                            $.each(fileInfo, function (file, obj) {
                                if (!newfiles[file])
                                    newfiles[file] = {
                                        tdata: [],
                                    };
                                $.each(obj.tdata, function (j, tdata) {
                                    if (isIntersection) {
                                        tdata.handles = $.map(
                                            tdata.handles,
                                            function (vv, ii) {
                                                if (
                                                    self.intersectHandles.indexOf(
                                                        vv,
                                                    ) != -1
                                                )
                                                    return vv;
                                                else return null;
                                            },
                                        );
                                    }
                                    if (tdata.handles && tdata.handles.length)
                                        newfiles[file].tdata.push(tdata);
                                });
                            });
                        }
                        if (data.items)
                            $.each(data.items, function (i, v) {
                                buildFiles(v, newfiles, isIntersection);
                            });
                    }

                    //recur to top from node's parent
                    function uncheckParentsWithValues(node) {
                        var parentnode = self.openTree.parent(node);
                        if (!parentnode || !parentnode.length) return;
                        var parentdata = self.openTree.dataItem(
                            self.openTree.parent(node),
                        );
                        var fileInfo = {};
                        if (parentdata.checkable && parentdata.checked) {
                            fileInfo = self.getFileInfo(parentdata, fileInfo);
                            //se il nodo ha handles ed un file allora lo deseleziono per non avere conflitti
                            if (Object.keys(fileInfo).length) {
                                parentdata.set("checked", false);
                            }
                        }
                        //recursively uncheck all parents with values
                        uncheckParentsWithValues(parentnode);
                    }

                    function getCheckedThemesBlocks(node, themes) {

                        var theme = node.Treedesc ?
                            node.Treedesc.split("|")[0] :
                            "";
                        var files = {};
                        files = self.getFileInfo(node, files);
                        if (
                            Object.keys(files).length &&
                            node.checked &&
                            theme
                        ) {
                            if (!themes[theme])
                                themes[theme] = {
                                    handles: [],
                                };
                            $.each(files, function (key, value) {
                                $.each(value.tdata, function (j, t) {
                                    $.each(t.handles, function (pos, val) {
                                        if (
                                            themes[theme].handles.indexOf(
                                                val,
                                            ) == -1
                                        )


                                            themes[theme].handles.push(val);
                                    });
                                });
                            });
                        }
                        if (node.items)
                            $.each(node.items, function (i, v) {
                                getCheckedThemesBlock(v, themes);
                            });
                    }


                    function getCheckedThemes(node, themes) {

                        var theme = node.Treedesc ?
                            node.Treedesc.split("|")[0] :
                            "";
                        var files = {};
                        files = self.getFileInfo(node, files);
                        if (
                            Object.keys(files).length &&
                            node.checked &&
                            theme
                        ) {
                            if (!themes[theme])
                                themes[theme] = {
                                    handles: [],
                                };
                            $.each(files, function (key, value) {
                                $.each(value.tdata, function (j, t) {
                                    $.each(t.handles, function (pos, val) {
                                        if (
                                            themes[theme].handles.indexOf(
                                                val,
                                            ) == -1
                                        )


                                            themes[theme].handles.push(val);
                                    });
                                });
                            });
                        }
                        if (node.items)
                            $.each(node.items, function (i, v) {
                                getCheckedThemes(v, themes);
                            });
                    }

                    var readerInputs = {};

                    if (!self.optionsExternalBlock) {
                        if (self.activateActionDirective) {
                            self.onResetGridAction();
                        }
                        self.onResetGridInfoCad();
                    } else {
                        self.onResetGridBlockInfoCad();
                    }
                    

                    var nodedata = refreshGrid ? refreshGrid : e.sender.dataItem(e.node);

                    //self.onBlockClick({ "handle":"1E0DD","name":"prova", "id":"5"})
                    //save current list of files as an array
                    //get the newly selected files
                    if (
                        (!self.files || Object.keys(self.files).length == 0) &&
                        Object.keys(self.getFileInfo(nodedata, readerInputs))
                            .length
                    ) {
                        self.reload = true;
                        //show the first you got if not previously set or ig previously set file is not in the new list...
                        if (
                            !self.filekey ||
                            Object.keys(readerInputs).indexOf(self.filekey) ==
                            -1
                        ) {
                            self.filekey = Object.keys(readerInputs)[0];
                            self.getLabelForFile();
                            $scope.$broadcast("dfx.reload", {
                                from: "new selection?",
                            });
                        }
                        self.files = readerInputs;
                        return;
                    }
                    var newfiles = self.getFileInfo(nodedata, readerInputs);

                    var uncheckallbutcurrent = false;
                    //a node without handles/ files
                    if (!newfiles || !Object.keys(newfiles).length) {
                        //still haven't loaded data...
                        if (
                            nodedata.hasChildren &&
                            nodedata.items &&
                            !nodedata.items.length
                        ) {
                            nodedata.set("checked", false);
                            self.openTree.expand(
                                self.openTree.findByUid(nodedata.uid),
                            );
                            return;
                        }
                        $.each(nodedata.items, function (i, v) {
                            readerInputs = self.getFileInfo(v, readerInputs);
                            v.set(
                                "checked",
                                nodedata.checked ? nodedata.checked : false,
                            );
                        });
                        newfiles = nodedata.checked ? readerInputs : {};
                    } else uncheckallbutcurrent = true;

                    if (nodedata.checked) {
                        //uncheckParentsWithValues(e.node);
                        if (
                            uncheckallbutcurrent &&
                            newfiles &&
                            Object.keys(newfiles).length
                        )
                            uncheckChildren(nodedata, true);
                    }

                    self.checkedThemes = {};
                    newfiles = {};
                    $.each(self.openTree.dataSource.data(), function (i, v) {
                        getCheckedThemes(v, self.checkedThemes);
                    });

                    self.intersectHandles = getHandlesIntersection();

                    if (Object.keys(self.checkedThemes).length > 1) {
                        //more than one theme has been selected --> INTERSECT
                        $.each(self.openTree.dataSource.data(), function (i, v) {

                            buildFiles(v, newfiles, true);
                        });
                    } //all the selected items have the same theme --> UNION
                    else {
                        $.each(self.openTree.dataSource.data(), function (i, v) {
                            buildFiles(v, newfiles, false);
                        });
                    }

                    //select a file and  check if a complete reload is necessary
                    // keep currently selected file if it's one of the keys of newfiles otherwise reload and get the 1st of new files
                    if (!self.files || !newfiles[self.filekey]) {
                        self.reload = true;
                        self.filekey = Object.keys(newfiles)[0];
                        self.getLabelForFile();
                        $scope.$broadcast("dfx.reload", {
                            from: "select file",
                        });
                    } else self.reload = false;

                    self.files = newfiles;
                    //if 2 or more files are available enable selector button
                    if (self.files && Object.keys(self.files).length > 1) {
                        self.filesAvailable = true;
                    }
                };

                //self.getTematFromGrid = function () {
                //    var jitems = self.grid.select();
                //    var dataSource = self.grid.dataSource;
                //    var readerInputs = {};
                //    $.each(jitems, function (i, v) {
                //        var rowdata = self.grid.dataItem(v);
                //        self.getFileInfo(rowdata, readerInputs);
                //    });

                //    return readerInputs;
                //};

                self.filterTree = function (form) {
                    $scope.$broadcast("schemaFormValidate");
                    if (form.$valid) {
                        //reload the tree with the updated filter values
                        self.showFilters = false;
                        self.filtersActive = true;
                        self.manageFilterForUser("apply").then(function () {
                            self.onTreeChange("filter");
                            $timeout();
                        });
                    }
                };

                self.undoFilterTree = function () {
                    self.showFilters = false;
                    self.filtersActive = false;
                    self.treeFilters = {
                        Operator: "AND",
                        Values: {}
                    };
                    $scope.$broadcast("schemaFormValidate");
                    self.selectedTreeExpandedItem = null;
                    self.manageFilterForUser("remove").then(function () {
                        self.onTreeChange("filter");
                        $timeout();
                    });
                };

                self.manageFilterForUser = function (useraction) {
                    var deferred = $.Deferred();
                    config.MF.api
                        .get({
                            storedProcedureName: config.userSessionManagementSp,
                            data: {
                                useraction: useraction,
                                gridData: {
                                    gridname: sourcegridname,
                                    id: sourceItemIds,
                                },
                                treeData: {
                                    id: self.selectedTree.value()
                                },
                                treeFilter: self.filterHandler(),
                            },
                        })
                        .then(
                            function (result) {
                                //anytime the user applies a filter the selected node is reset
                                if (useraction == "apply")
                                    self.selectedTreeExpandedItem = null;
                                deferred.resolve();
                            },
                            function (err) {
                                console.log(err);
                            },
                        );
                    return deferred.promise();
                };

                self.showActions = function () {
                    //no detail is shown
                    if (
                        !self.hasProperties(self.viewerSelection)
                    ) {
                        kendoConsole.log(
                            getObjectText("selectatleastone"),
                            true,
                        );
                        return;
                    }
                    var ids = [];
                    openActionsTooltip({
                        requestOptions: {
                            // id: self.currentDetailIdentifier.Handle,
                            ids: Object.keys(self.viewerSelection), // handle selezionati
                            caller: self.callContext,
                            gridData: {
                                gridname: sourcegridname,
                                id: sourceItemIds,
                            },
                            filename: self.filekey,
                            treeData: {
                                id: self.selectedTree.value(),
                                currentlyCheckedTreeItems: $.map(
                                    self.files,
                                    function (value, key) {
                                        return {
                                            filename: key,
                                            tdata: self.files[key].tdata,
                                        };
                                    },
                                ),
                            },
                            // currentDetail: self.currentDetailIdentifier,
                        },
                        storeProcedureName: self.storedForCad['DWG_GetAction'] ? self.storedForCad['DWG_GetAction'] : "core.DWG_GetAction",
                        accordionId: "dwgViewerActionsAccordion",
                        element: $("#actions___dwg"),
                    });
                };

                self.getFileArray = function () {
                    if (self.files) return Object.keys(self.files);
                    return [];
                };

                /*gestione informazioni griglia azioni*/
                self.openModalInGridAction = function () {
                    $timeout(function () {
                        angular.element($("#treeR3")).empty().append(angular.element($("#actionGridSingleSP")));
                    }, 1500);
                    self.onShowActionGridSingle = true;
                }

                self.openModalOutGridAction = function () {
                    self.onShowActionGridSingle = false;

                    $timeout(function () {
                        angular.element($("#actionGridSingleSP")).insertAfter(angular.element($('#actionGridSingleContainer')));
                    }, 500);


                }

                self.openModalGridAction = function openModal() {
                    var config = {
                        title: '<i aria-hidden="true"></i>',
                        wide: false,
                        backdrop: true,
                        modalId: 'treeModalGeidAction',
                        container: 'grid-dwg-controller',
                        class: 'dialogActionGrid',
                        ready: function () {
                            $timeout(function () {
                                angular.element($("#treeR3")).empty().append(angular.element($("#actionGridSingleSP")));
                            }, 1000);
                        },
                        onClose: function () {
                            self.openModalOutGridAction();
                        }
                    }
                    showModalCustom(config, true);


                    self.openModalInGridAction();
                }

                /*fine gestione informazioni griglia azioni*/

                self.openModalIn = function () {
                    self.showMagic = false;
                    $('.k-splitbar').hide();
                    angular.element($("#treeR3")).empty().append(angular.element($("#gantttree")));
                    $('.k-collapse-prev').click();
                }

                self.openModalOut = function () {
                    $('.k-splitbar').show();
                    self.showMagic = true;
                    angular.element($("#gantttree")).insertAfter(angular.element($('#buttonTree')));
                    //angular.element($('#gantttree')).empty().append(angular.element($("#treeThemati")));
                    $('.k-expand-prev').click();
                    $('.k-splitbar').show();
                }

                self.openModal = function openModal() {
                    self.openPopup = false;
                    var config = {
                        title: '<i aria-hidden="true"></i>',
                        wide: false,
                        backdrop: true,
                        modalId: 'treeModalMenu',
                        container: 'grid-dwg-controller',
                        class: 'dialogTree',
                        onClose: function () {
                            self.openPopup = true;
                            self.openModalOut();
                        }
                    }
                    showModalCustom(config, true);


                    self.openModalIn();
                }

                function showModalCustom(config, dontClean) {
                    var modalId = config.modalId ? config.modalId : "wndmodalContainer-r3";
                    $("#" + modalId).empty();
                    $("#" + modalId).remove();

                    var $modal = $('<div id="' + modalId + '" class="" aria-hidden="true" role="dialog" style="height: 1vh;">\
                        <div id="dialog_' + modalId + '" class="modal-dialog ' + config.class + '">\
                            <div id="content_' + modalId + '" class="modal-content">\
                                <div id="contentTreeMenuR3" style="overflow: auto;" class="modal-body">\
                                    <div style="text-align: right;">\
                                            <button type="button" style="padding: 1px 5px !important;" class="btn btn-danger btn-xs ng-scope" data-dismiss="modal">\
                                            <i class="fa fa-times" aria-hidden="true"></i>\
                                        </button>\
                                    </div>\
                                    <div class="panel-group">\
                                    </br>\
                                    <div id="treeR3" class="class="row ltree">Contenuto</div>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                    </div >'),
                        $content;


                    $modal.insertBefore($("#" + config.container));

                    if (!config)
                        config = {};

                    if (!dontClean)
                        $content = cleanModal();
                    else
                        $content = $modal.find("#contentTreeMenuR3");

                    if (config.content) {
                        if (typeof config.content == "string")
                            $content.html(config.content);
                        else
                            $content.html('').prepend(config.content);
                    }

                    if (config.wide)
                        $modal.addClass("modal-wide");

                    if (config.onClose) {
                        $modal.one('hidden.bs.modal', config.onClose);
                    }

                    $('#content_' + modalId).resizable({
                        //alsoResize: ".modal-content",
                        minHeight: 300,
                        minWidth: 300
                    });

                    $('#dialog_' + modalId).draggable();

                    //$('#content_' + modalId).draggable({
                    //    handle: ".modal-header",
                    //    containment: "window"
                    //});

                    $('#' + modalId).on('show.bs.modal', function () {
                        $(this).find('.modal-body').css({
                            'max-height': '100%'
                        });
                    });


                    $modal.modal({
                        backdrop: false

                    });

                    return $content;
                }

                $("#treeModalMenu").empty();
                $("#treeModalMenu").remove();
                self.pdfThemes = [];
                self.PenList = [];
                self.PaperSizeList = [];
                self.ProfilesUser = [];
                self.floors = [];
                self.allObject = [];
                self.dwgcartouche = [];

                self.paperOrientation = [{
                    code: "V",
                    text: self.getLabels('Verticale')
                },
                {
                    code: "H",
                    text: self.getLabels('Orizzontale')
                }
                ];
                
                self.optionsPdf = [{
                    value: "NC",
                    text: "Nascondi Campiture"
                },
                {
                    value: "stampa_logo",
                    text: self.getLabels('stampa_logo')
                },
                {
                    value: "stampa_titolo",
                    text: self.getLabels('stampa_titolo')  
                },
                {
                    value: "excludeThemati",
                    text: self.getLabels('excludeThemati')  
                },
                ];

                self.legendaPdf = [{
                    code: "V",
                    text: self.getLabels('Verticale')
                },
                {
                    code: "H",
                    text: self.getLabels('Orizzontale')
                }
                ];

                self.themasType = [{
                    code: "V",
                    text: self.getLabels('Verticale'),
                    value: true
                },
                {
                    code: "O",
                    text: self.getLabels('Orizzontale'),
                    value: false
                }
                ];

                self.multiPage = [{
                    id: true,
                    text: self.getLabels('unTemaPerP')
                },
                {
                    id: false,
                    text: self.getLabels('temiSuLayer')
                    }
                ];

                self.onChangeColor = function (e) {
                    $('input[name="' + e.dataItem.ValueTemat + '"]').click();
                    $('input[name="' + e.dataItem.ValueTemat + '"]').click();
                }


                //DWG_Get_profil_Dwg
                self.getConfigTable = function () {
                    config.MF.api
                        .get({
                            storedProcedureName: self.storedForCad["DWG_GetAllConfig"] ? self.storedForCad["DWG_GetAllConfig"] : "core.DWG_GetAllConfig",
                            data: {
                                gridname: sourcegridname,
                                id: sourceItemIds,
                            }
                            //treeData: {
                            //    id: self.selectedTree.value(),
                            //},
                        })
                        .then(
                            function (result) {
                                $.each(result, function (i) {
                                    switch (i) {
                                        //pens
                                        case 0:
                                            self.PenList = [];

                                            $.each(result[i], function (i, v) {
                                                self.PenList.push({
                                                    value: v.value,
                                                    text: v.text,
                                                    Id: v.Id
                                                });
                                            });
                                            break;
                                        //print size
                                        case 1:
                                            self.PaperSizeList = [];
                                            $.each(result[i], function (i, v) {
                                                self.PaperSizeList.push({
                                                    value: v.value,
                                                    text: v.text
                                                });
                                            });
                                            break;
                                        //profilis pdf
                                        case 2:
                                            self.ProfilesUser = [];
                                            $.each(result[i], function (i, v) {
                                                self.ProfilesUser.push(v);
                                            });
                                            break;
                                        //pdf format
                                        case 3:
                                            self.pdfPrintFormat = [];

                                            $.each(result[i], function(i, v) {
                                                self.pdfPrintFormat.push(v);                                              
                                            });
                                            break;
                                        //layout
                                        case 4:
                                            self.LayoutCode = [];

                                            $.each(result[i], function(i, v) { 
                                                self.LayoutCode.push(v);
                                            });
                                            break;

                                        //layout
                                        case 5:
                                            self.dwgcartouche = [];

                                            $.each(result[i], function (i, v) {
                                                self.dwgcartouche.push(v);
                                            });
                                            break;
                                    }


                                    $timeout();
                                    return;
                                });
                            },

                            function (err) {
                                console.log(err);
                                return;
                            },
                        );
                }

                self.getConfigTable();

                self.treeDataSource = [];

                self.filterThemesOpen = function () {
                    $uibModal.open({
                        templateUrl: window.includesVersion + '/Views/3/Templates/filterThemes.html', //sTemplate, // loads the template
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        //windowClass: "modal-dialog-pdf", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        scope: $scope,
                        controller: ("filterThemesOpen", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {

                            $scope.jsnoSource = self.allObject;

                            $scope.setData = function (object) {

                                $.each(self.allObject, function (i, v) {
                                    if (!!object.id) {
                                        if (v.TREE_PARENT_ID === object.id) {
                                            var oChild = {
                                                id: v.TREE_ID,
                                                name: v.TREE_LABEL,
                                                checked: false,
                                                children: []
                                            }

                                            $scope.setData(oChild);
                                            if (oChild.children.length == 0) {
                                                delete oChild.children;
                                            }

                                            object.children.push(oChild);
                                        }
                                    } else {
                                        if (v.TREE_PARENT_ID === -1) {
                                            var oItem = {
                                                id: v.TREE_ID,
                                                name: v.TREE_LABEL,
                                                checked: false,
                                                children: []
                                            };

                                            $scope.setData(oItem);

                                            if (oItem.children.length == 0) {
                                                delete oItem.children;
                                            }
                                            object.push(oItem);

                                        }
                                    }

                                });
                            };

                            $scope.dataSet = function () {
                                //$scope.setData($scope.jsnoSource);
                            };

                            $scope.dataSet();


                            $scope.cancel = function () {
                                $uibModalInstance.dismiss("cancel");
                            };
                        }]),
                    });
                }

                self.openXLS = function (sTemplate) {
                    $uibModal.open({
                        templateUrl: window.includesVersion + sTemplate, //sTemplate, // loads the template
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        windowClass: 'pdf-div-container', // windowClass - additional CSS class(es) to be added to a modal window template
                        size: '',
                        scope: $scope,
                        controller: ("pdfExtract", ["$scope", "$uibModalInstance", function (
                            $scope,
                            $uibModalInstance,
                        ) {

                            $scope.checkall = true;


                            $scope.toggleAll = function () {
                                var toggleStatus = !$scope.checkall;

                                for (var key in self.pdfThemes) {
                                    self.pdfThemes[key].value = toggleStatus;
                                }

                                $scope.checkall = toggleStatus;
                            };


                            $scope.optionToggled = function () {
                                $scope.checkall = self.pdfThemes.every(function (itm) {
                                    return itm.value;
                                })
                            }

                            $scope.save = function () {
                                $uibModalInstance.dismiss("cancel");


                            }

                            $scope.cancel = function () {
                                $uibModalInstance.dismiss("cancel");
                            };
                        }]),
                        resolve: {
                            user: function () {
                                return "hello";
                            },
                        },
                    }); //end of modal.
                }; // end of scope.open function

                self.centerView = function () {
                    if (self.showViewerDetail) {
                        self.viewers[self.fileInDetail.fileName].viewer.viewer.centerView();
                    }
                }

                self.viewerRefresh = function (refreshNodes) {
                    if (self.bMeasureMode) {
                        self.centerView();
                    }  
                    
                    self.onResetGridInfoCad();
                    self.onResetGridBlockInfoCad();
                    self.onResetGridAction();
                    self.getClassForAsset();

                    if (self.showViewerDetail) {
                        self.externalBlocks[self.fileInDetail.fileName] === undefined ? '' : self.externalBlocks[self.fileInDetail.fileName] = [];
                    }

                    if (refreshNodes) {
                        self.selectedThema = null;
                        self.selectedTreeExpandedItem = null;
                        self.tematismiTreeCheckedNodes = {};
                        self.tematismiTreeOpenPaths = [];
                        self.viewerSelectionRefresh = {};
                        self.refresTreeChange = false;
                        self.getThematiFirstList();
                        if (self.showViewerDetail) {
                            self.assetMode ? self.initGridInfoCadActivate("") : self.initGridBlockInfoCadActivate("")
                        }
                    }

                    self.selectedFiles.filter(function (file) {
                        if (!!self.fileInDetail) {
                            if (self.fileInDetail.fileName == file.fileName) {
                                self.tdataOld = file.tdata;
                                return file.tdata = []
                            }
                        }
                        else {
                            return file.tdata = []
                        }

                    });

                    self.refreshTree();
                    //$timeout(function () {
                    //    self.refreshTree();
                    //}, 1000);                    
                }

                //gestione pl_asset

                self.onSaveChanges = function (e) {
                    if (e.type != "read" && e.type !== undefined) {
                        self.renderBlocks[self.fileShownInDetail] = [self.currentBlock];
                        self.polileneContainer.fillColor("#ffffff");
                        self.selectedClassForAsset = {};
                        self.toolTipDesc(self.fileInDetail);
                        self.getClassForAsset();
                        self.getInfoForCad();
                    }
                    //else {
                    //    self.onBindGridBlock(e);
                    //}
                }

                self.getOpenHandleForBlocks = function getOpenHandleForBlocks(e) {
                    //return [];
                    return MF.api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_GetOpenHandleForBlocks'] ? self.storedForCad['DWG_GetOpenHandleForBlocks'] : "core.DWG_GetOpenHandleForBlocks",
                            clathemId: self.selectedTree.value(),
                            idFloor: self.fileInfo[self.fileInDetail.fileName].id ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                            class: self.classForAsset.map(function (block) {
                                return block.typeBlock
                            }).unique(),
                            block: e
                        })
                        .then(function (result) {
                            if (!result.length) {
                                return;
                            }
                            var val = [];

                            $.each(result[0], function (i, v) {
                                val.push({
                                    handle: v.handle,
                                    locale: v.locale,
                                    allowInsert: v.allowInsert,
                                    color: v.color,
                                    type_block: v.type_block,
                                    blockName: v.blockName,
                                    allowInsertStart: v.allowInsertStart,
                                    colorStart: v.colorStart
                                });
                            });

                            //vecchia modalità
                            //self.fillPolilyneForAddBlocks[self.fileShownInDetail] = val;

                            //nuovaModalità
                            self.fillPolilyneForAddBlocks[self.fileShownInDetail].open = {
                              handle:  val.filter(function (open) {
                                    return open.allowInsert === true
                                }),
                                color : "#00FF00"
                            };

                            self.fillPolilyneForAddBlocks[self.fileShownInDetail].close = 
                                {
                                    handle: val.filter(function (open) {
                                        return open.allowInsert === false
                                    }),
                                    color: "#FF0000"
                                };




                            return val;
                        });
                }

                self.showGridAddBlock = function showActionGrid() {
                    $timeout(function () {
                        self.isBlockGridReady = true;
                    });
                };

                self.onSaveGridBlocks = function (e) {
                    self.pl_asset_code = e.model.PL_ASSET_CODE
                }

                self.onCheckHandle = function onCheckHandl(block, hanlde) {
                    return self.fillPolilyneForAddBlocks[self.fileShownInDetail].filter(function (polilyne) {
                        if (polilyne.type_block == block.typeBlock && polilyne.blockName == block.blockName && polilyne.handle == hanlde && polilyne.allowInsert) {
                            return polilyne;
                        }
                    });
                }

                self.onCloseGridNewBlocks = function onCloseGridNewBlocks(e) {
                    self.selectedClassForAsset = {};
                }

                self.onAddBlock = function onAddBlock(e) {

                    //if (self.onCheckHandle(self.onAddedBlock, e.entity.handle).length == 0) {
                    //    self.selectedClassForAsset = {};
                    //    kendoConsole.log("Azione non consentita", true);
                    //    return;
                    //}

                    doModal(true);

                    self.visibleInsertBlock = false;
                    self.polileneContainer = e.entity;

                    config.MF.api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_getHandleFather'] ? self.storedForCad['DWG_getHandleFather'] : "core.DWG_getHandleFather",
                            data: {
                                handle: e.entity.handle,
                                x: e.point.x,
                                y: e.point.y,
                                //xref: e.point.x - e.entity.renderer.dwg.canvas.extmin.x,
                                //yref: (e.point.y - e.entity.renderer.dwg.canvas.extmin.y) * -1,
                                xref: e.point.x,
                                yref: e.point.y,
                                PL_CLAASS_ID: self.selectedClassForAsset[self.fileShownInDetail].id_father,
                                PL_TIPASS_ID: self.selectedClassForAsset[self.fileShownInDetail].id_child,
                                typeBlock: self.typeBlock,
                                idActionKey: self.selectedClassForAsset[self.fileShownInDetail].idAction,
                                idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                                plTipassId: self.selectedClassForAsset[self.fileShownInDetail].pl_tipass_id,
                            },
                        })
                        .then(
                            function (result) {
                                if (!result) {
                                    doModal(false);
                                    return;
                                }


                                if (result[0][0].idFhater != 0) {


                                    var newHandle = result[0][0].handle;
                                    self.requestData.id = result[0][0].idFhater;
                                    self.requestData.itemid = result[0][0].idFhater;

                                    if (self.getActionForBlock()) {
                                        var optionsBlock = self.selectedClassForAsset[self.fileShownInDetail];

                                        self.currentBlock = {
                                            "blockName": optionsBlock.blockName,
                                            "handle": self.requestData.handleBlock ? self.requestData.handleBlock : newHandle,
                                            "draggable": true,
                                            "selectable": true,
                                            "visible": true,
                                            "external": true,
                                            "position": {
                                                "x": e.point.x,
                                                "y": e.point.y,
                                                "xscale": optionsBlock.scale ,//*  optionsBlock.indexScale ? optionsBlock.indexScale : 1,
                                                "yscale": optionsBlock.scale ,//* optionsBlock.indexScale ? optionsBlock.indexScale : 1,
                                                "rotation": 0,
                                                "xScaleRef": optionsBlock.scale,
                                                "yScaleRef": optionsBlock.scale,
                                            },
                                            "handleFather": optionsBlock.handleFather,
                                            "color": optionsBlock.color ? optionsBlock.color : "#000000",
                                            "handle_father": optionsBlock.handle_father
                                        }
                                    }

                                    $timeout(function () {
                                        doModal(false);
                                    }, 2000);
                                } else {
                                    doModal(false);
                                    self.selectedClassForAsset = {};
                                    kendoConsole.log("Attenzione locale non attivo", true);
                                }
                            },
                            function (err) {
                                doModal(false);
                                console.log(err);
                                kendoConsole.log(self.getLabels('saveKO'), true);
                                self.selectedClassForAsset = {};
                            },
                        );
                };

                self.onBlockCopy = function blockCopy() {

                    config.MF.api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_CopyExternalBlock'] ? self.storedForCad['DWG_CopyExternalBlock'] : "core.DWG_CopyExternalBlock",
                            data: {
                                handles: self.BlocksToCopy,
                            },
                        })
                        .then(
                            function (result) {
                                self.onTreeChange();
                                kendoConsole.log(self.getLabels('saveOk'), false);
                            },
                            function (err) {
                                console.log(err);
                                kendoConsole.log(self.getLabels('saveKO'), true);
                            },
                        );
                }

                self.onBlockSave = function BlockSave() {
                    var blockToSave = [];

                    if (!!self.selectedBlock) {
                        self.setExternalBlocksToSave(self.selectedBlock);
                    }

                    for (handle in self.externalBlocksToSave) {
                        if (handle != "") {
                            blockToSave.push(self.externalBlocksToSave[handle])
                        }
                    }

                    if (blockToSave.length > 0) {
                        config.MF.api
                            .get({
                                storedProcedureName: self.storedForCad['DWG_SaveExternalBlock'] ? self.storedForCad['DWG_SaveExternalBlock'] : "core.DWG_SaveExternalBlock",
                                data: {
                                    handles: blockToSave,
                                },
                                idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                            })
                            .then(
                                function (result) {
                                    self.toolTipDesc(self.fileInDetail);
                                    kendoConsole.log(self.getLabels('saveOk'), false);
                                    self.clearSelectionViewer[self.fileShownInDetail] = true;
                                    self.externalBlocksToSave = {};
                                    self.initGridBlockInfoCadActivate();
                                    
                                },
                                function (err) {
                                    console.log(err);
                                    kendoConsole.log(self.getLabels('saveKO'), true);
                                },
                            );
                    } else {
                        kendoConsole.log('Non sono presenti blocchi da Salvare', true)
                    }


                    
                }

                self.onChangeScale = function (value, fileName) {
                    var oBlocks = [];

                    for (handle in self.viewerSelection) {
                        self.externalBlocksToSave[handle].xscale = value
                        self.externalBlocksToSave[handle].yscale = value

                        oBlocks.push(self.externalBlocksToSave[handle]);
                    }

                    return oBlocks;
                }

                self.getClassForAsset = function getClassForAsset() {
                    self.classForAsset = [];
                    config.MF.api
                        .get({
                            //storedProcedureName: "core.DWG_getTipassForAsset",
                            storedProcedureName: self.storedForCad['DWG_getInsertBlock'] ? self.storedForCad['DWG_getInsertBlock'] : "core.DWG_getInsertBlock",
                            idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                            clathemId: self.selectedTree.value(),
                        })
                        .then(
                            function (result) {
                                self.classForAsset = [];


                                $.each(result[0], function (i, v) {
                                    self.classForAsset.push(v);
                                })
                            },
                            function (err) {
                                console.log("errore recupero inserimento blocco");
                            },
                        );
                }

                Array.prototype.unique = function () {
                    return this.filter(function (value, index, self) {
                        return self.indexOf(value) === index;
                    });
                }

                self.onResetOpenHandleBlock = function onResetOpenHandleBlock() {
                    $.each(self.fillPolilyneForAddBlocks[self.fileShownInDetail].close, function (i, select) {
                        select.color = select.colorStart
                        select.allowInsert = select.allowInsertStart
                    });

                    $.each(self.fillPolilyneForAddBlocks[self.fileShownInDetail].open, function (i, select) {
                        select.color = select.colorStart
                        select.allowInsert = select.allowInsertStart
                    });
                }

                self.setVisibleInsertBlock = function setVisibleInsertBlock(e) {
                    self.onAddedBlock = null;
                    self.onResetOpenHandleBlock();
                    var externalBlocks = self.externalBlocks[self.fileInDetail.fileName];
                    self.externalBlocks[self.fileInDetail.fileName] = [];
                    $.each(self.fillPolilyneForAddBlocks[self.fileShownInDetail], function (i, select) {
                        if (e.container) {
                            if (select.blockName == e.blockName && select.type_block == e.typeBlock) {
                                if (e.container != select.locale && e.container != 0) {
                                    select.color = "#FF0000"
                                    select.allowInsert = false;
                                }
                            }
                        }
                    });



                    if (!externalBlocks) {
                        externalBlocks = [{
                        "fileName": e.fileNameComplete,
                        "blockName": e.blockName,
                        "type_block": e.typeBlock,
                        options: [{
                            blockName: e.blockName
                        }]
                    }];
                    } else {
                        if (externalBlocks.filter(function (blo) {
                            if (blo.blockName == e.blockName) { return true }
                        }).length == 0) {
                            externalBlocks.push({
                                "fileName": e.fileNameComplete,
                                "blockName": e.blockName,
                                "type_block": e.typeBlock,
                                options: [{
                                    blockName: e.blockName
                                }]
                            })
                        }                        
                    }
                    $timeout(function () {
                        self.externalBlocks[self.fileInDetail.fileName] = externalBlocks;
                    },500)
                    

                    //self.externalBlocks[self.fileInDetail.fileName] = [{
                    //    "fileName": e.fileNameComplete,
                    //    "blockName": e.blockName,
                    //    "type_block": e.typeBlock,
                    //    options: [{
                    //        blockName: e.blockName
                    //    }]
                    //}];

                    

                    self.selectedClassForAsset[self.fileShownInDetail] = e;

                    self.onAddedBlock = e;

                    self.typeBlock = e.typeBlock;

                    self.requestData = {
                        entityname: e.entityname,
                        id: null,
                        pk: e.pk,
                        queryType: 'stageactions',
                        functionGUID: null,
                        gridName: e.entityname,
                        masterEntityName: e.entityname,
                        itemid: 0,
                        type: 'A',
                        ugvi: e.ugvi,
                        actionId: e.actionId,
                        primaryKey: e.idAction,
                        handleBlock: e.handleBlock,
                        scale: e.scale,
                        indexScale: e.indexScale
                    };

                    self.visibleInsertBlock = true;
                }

                self.onShowAddExternalBlock = function onShowAddExternalBlock() {

                    if (self.viewInsertBlock || !self.assetMode) {                        
                      self.viewerRefresh(true);
                      self.onTreeChange('blocks');
                    }

                    self.viewInsertBlock = !self.viewInsertBlock;
                    self.selectedClassForAsset = {};

                    $timeout(function () {
                        doModal(false);
                    }, 500);
                    
                }

                self.getActionForBlock = function getActionForBlock() {
                    self.activeAction = [];

                    return MF.api.get({
                        storedProcedureName: self.storedForCad['usp_ev_get_action_constraint_cad'] ? self.storedForCad['usp_ev_get_action_constraint_cad'] : "core.usp_ev_get_action_constraint_cad",
                        data: self.requestData,
                        actcad: 1
                    }).then(
                        function (result) {
                            var bAction = false;

                            $.each(result[0], function (i, v) {
                                if (v.EV_ACTION_ID == self.requestData.actionId) {

                                    var action = {
                                        id: v.EV_ACTION_ID,
                                        actioncommand: v.EV_ACTION_COMMAND,
                                        actiontype: v.EV_ACTTYP_CODE,
                                        actionfilter: self.selectedClassForAsset[self.fileShownInDetail].filter ? self.selectedClassForAsset[self.fileShownInDetail].filter : v.EV_ACTION_FILTER,
                                        color: v.colour,
                                        label: v.EV_ACTION_DESCRIPTION,
                                        father: v.EV_ACTCLA_DESCRIPTION,
                                        orderBy: v.EV_ACTSTA_ORDER,
                                        actionCallback: self.onSaveChanges
                                    }
                                    bAction = true;
                                    //self.activeAction.push(action);
                                    self.dispatchActionHtml(null, action);

                                    return true

                                }
                            });


                            //if (!bAction) {
                            //    self.polileneContainer.fillColor("#ffffff");
                            //    self.selectedClassForAsset = {};
                            //    kendoConsole.log('Azione non consentita', true);


                            //    return false
                            //}
                        },
                        function (err) {
                            console.log(err);
                            return;
                        }
                    );
                }

                self.dispatchActionHtml = function dispatchActionHtml(element, btn) {
                    btn.jqgrid = undefined;
                    btn.jrow = undefined;
                    btn.rowData = {
                        "id": self.requestData.primaryKey == 0 ? self.requestData.id : self.requestData.primaryKey
                    };
                    //MagicUtils.js
                    dispatchAction(null, btn);
                }

                self.onBindGridBlock = function onBindGridBlock(grid) {
                    if (grid.sender) {
                        grid.sender.dataSource.transport.options.create.complete = self.onSaveChanges;
                    } else {
                        grid.dataSource.transport.options.create.complete = self.onSaveChanges;
                    }
                    grid.container.data("kendoWindow").one("close", self.onCloseGridNewBlocks);
                }

                self.onChangeThemati = function () {
                    //self.centerView();

                    //if (self.assetMode) {
                    //    self.onResetGridBlockInfoCad();
                    //}

                    //if (self.activateActionDirective && !self.assetMode) {
                    //    self.onResetGridAction();
                    //}

                    //self.selectedTreeExpandedItem = null;
                    //self.tematismiTreeCheckedNodes = {};
                    //self.tematismiTreeOpenPaths = [];
                    //$("#divtreeThemati").append($("#treeThemati"));
                    //self.files = {};


                }

                self.setSelectTreeDataValue = function setSelectTreeDataValue(e) {      
                    if (e.ID != self.selectedTree.value()) {                        
                        self.assetMode = e.RSN_THEMAT_FLAG_BLOCK;

                        if (self.assetMode) {
                            self.onResetGridBlockInfoCad();
                        }

                        if (self.activateActionDirective && !self.assetMode) {
                            self.onResetGridAction();
                        }

                        self.selectedTreeExpandedItem = null;
                        self.tematismiTreeCheckedNodes = {};
                        self.tematismiTreeOpenPaths = [];
                        
                        self.files = {};
                        self.viewInsertBlock = false;
                         


                        $("#divtreeThemati").append($("#treeThemati"));

                        self.selectedTree.value(e.ID);
                    }
                }

                self.setTreeExpandedItemNew = function (e, toggle) {
                    self.selectedThema = e;
                };

                self.onMouseOverBlock = function onMouseOverBlock(e) {
                    return
                    if (self.assetMode && e.dataItem.dwg_theme && e.dataItem.dwg_theme != "") {
                        if (!e.dataItem.checked)
                            return;

                        var viewer = self.viewers[self.fileInDetail.fileName].viewer.viewer;
                        var handles = e.dataItem.dwg_theme.split("#");

                        $.each(handles, function (i, select) {
                            var handle = select.split("|")[0];

                            $.each(self.externalBlocks[self.fileInDetail.fileName], function (i, v) {
                                $.each(v.options, function (ii, vv) {
                                    if (vv.handle == handle) {

                                        viewer.applyTransform(handle, {
                                            "xscale": vv.xScale * vv.xZoomScale,
                                            "yscale": vv.yScale * vv.yZoomScale,
                                            "zscale": 1
                                        });

                                        var extblock = viewer.renderer.stack.filter(function (block) {
                                            if (block.handle == handle) {
                                                return block;
                                            }
                                        })[0];

                                        //if (!!extblock) {
                                        //    extblock.setColor(vv.colorScaleStart);
                                        //}
                                    }
                                });
                            });
                        });
                    }
                }

                self.onMouseLeaveBlock = function onMouseOverBlock(e) {
                    return
                    if (self.assetMode && e.dataItem.dwg_theme && e.dataItem.dwg_theme != "") {
                        if (!e.dataItem.checked)
                            return;
                        var viewer = self.viewers[self.fileInDetail.fileName].viewer.viewer;
                        var handles = e.dataItem.dwg_theme.split("#");

                        $.each(handles, function (i, select) {
                            var handle = select.split("|")[0];

                            $.each(self.externalBlocks[self.fileInDetail.fileName], function (i, v) {
                                $.each(v.options, function (ii, vv) {
                                    if (vv.handle == handle) {

                                        viewer.applyTransform(handle, {
                                            "xscale": vv.xScale ? vv.xScale : 1,
                                            "yscale": vv.xScale ? vv.xScale : 1,
                                            "zscale": 1
                                        });

                                        var extblock = viewer.renderer.stack.filter(function (block) {
                                            if (block.handle == handle) {
                                                return block;
                                            }
                                        })[0];

                                        //if (!!extblock) {
                                        //    extblock.setColor(vv.colorScaleEnd);
                                        //}
                                    }
                                });
                            });
                        });
                    }
                }                
                //gestione pl_asset fine 

                $scope.openLayout = function (sTemplate, tree) {
                    self.openLayout = true;

                    //$scope.openPdf(sTemplate, tree)


                    $uibModal.open({
                        templateUrl: window.includesVersion + sTemplate, //sTemplate, // loads the template
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        windowClass: "laybloPdf-window", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        //scope: $scope,
                        controller: ("modalPdfLayout", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {
                            $scope.gdv = self;
                            $scope.LayoutCode = [];
                            $scope.selectAllLayoutValue = false;
                            $scope.gdv.openLayout = true;
                            $scope.pdfShow = false;
                            $scope.DisabledAll = false;
                            $scope.ngClassLoader = "";
                            $scope.pdfHref = "";
                            $scope.enabledLayer = false;
                            $scope.paperSize = '2';
                            $scope.penPath = 0;
                            $scope.PdfVer = 15

                            $.each(self.viewers[self.fileInDetail.fileName].layouts, function (i, v) {
                                v.checked = false;
                                $scope.LayoutCode.push(v);
                            })

                            $scope.selectSingle = function selectSingle(classe, value) {
                                if (classe == 'selectLayout') {
                                    if ($("." + classe).length == $("." + classe + ":checked").length) {
                                        $scope.selectAllLayoutValue = true
                                    } else {
                                        $scope.selectAllLayoutValue = false
                                    }
                                }
                            }

                            $scope.selectAllLayout = function selectAllLayout(type, e) {
                                if (type == 'layout') {
                                    $.each($scope.LayoutCode, function (i, v) {
                                        v.checked = $scope.selectAllLayoutValue;
                                    })
                                }
                            }

                            $scope.printPdfStart = function () {
                                $scope.DisabledAll = true;
                                $scope.pdfShow = false;
                                $scope.ngClassLoader = "spinner-border spinner-border-sm";
                                $("#pdfEstratto").attr("href", "");
                            }

                            $scope.printPdfEnd = function () {
                                $scope.DisabledAll = false;
                                $scope.ngClassLoader = "";
                                $timeout();
                            }

                            $scope.exportToPDF = function () {
                                $scope.printPdfStart();

                                var data = {
                                    gridname: sourcegridname,
                                    clathemId: self.selectedTree.value(),
                                    id: self.fileShownInDetail != '' ? self.fileInfo[self.fileShownInDetail].id : sourceItemIds,
                                    ApplicationInstanceId: window.ApplicationInstanceId,
                                    selectedLayout: $scope.LayoutCode.filter(function (layout) { if (layout.checked) { return layout; } }),
                                    enabledLayer: $scope.enabledLayer,
                                    penPath: $scope.penPath,
                                    paperSize: $scope.penPath,
                                    PdfVer: $scope.PdfVer,
                                    ApplicationInstanceId: window.ApplicationInstanceId,
                                }

                            config.MF.api
                                .get({
                                    storedProcedureName: self.storedForCad['DWG_Export_Layout'] ? self.storedForCad['DWG_Export_Layout'] : "core.DWG_Export_Layout",
                                    data: data,
                                }).then(
                                    function (result) {
                                        if (!result.length) {
                                            self.showDetail = false;
                                            $scope.printPdfEnd();
                                            return;
                                        }

                                        $.each(result[0], function (i, v) {
                                            if (v.status == "OK") {
                                                try {
                                                    $scope.pdfFiles = [];
                                                    var file = parseXml(v.response).getElementsByTagName("file");

                                                    if (file.length > 0) {
                                                        $.each(file, function (i, v) {
                                                            if (self.isRef2Space) {
                                                                v.href = v.innerHTML;
                                                            } else {
                                                                v.href = '/api/MAGIC_SAVEFILE/GetFile?path=' + v.innerHTML.replace(FileUploadRootDir, '');
                                                            }
                                                            $scope.pdfFiles.push(v);
                                                        })
                                                    } else {
                                                        $scope.pdfFiles = [];

                                                        if (self.isRef2Space) {
                                                            $scope.pdfFiles.push({ href: v.response });
                                                        } else {
                                                            $scope.pdfFiles.push({ href: '/api/MAGIC_SAVEFILE/GetFile?path=' + v.response.replace(FileUploadRootDir, '') });
                                                        }
                                                    }
                                                }
                                                catch (ex) {

                                                }

                                                $timeout(function () {
                                                    //$scope.pdfHref = v.response;
                                                    $scope.pdfShow = true;
                                                }, 1000)


                                            } else {
                                                kendoConsole.log(result[0][0].response, true);
                                            }
                                        });

                                        self.showDetail = true;
                                        $scope.printPdfEnd();
                                    },
                                    function (err) {
                                        $scope.printPdfEnd();
                                        $("#pdfButton").show();
                                        console.log(err);

                                    },
                                );
                            /*fine storeprocedure*/
                              
                                
                            };

                            $scope.cancel = function () {
                                $scope.gdv.openLayout = false;
                                $uibModalInstance.dismiss("cancel");
                            };

                        }])
                    })
                }
                 
                /*gestione della maschera del pdf*/
                $scope.openPdf = function (sTemplate, tree) {
                    $uibModal.open({
                        templateUrl: window.includesVersion + sTemplate, //sTemplate, // loads the template
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        //windowClass: "modal-dialog-pdf", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        //scope: $scope,
                        controller: ("modalPdf", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {
                            $scope.gdv = self;
                            $scope.pdfShow = false;
                            $scope.DisabledAll = false;
                            $scope.ngClassLoader = "";
                            $scope.pdfHref = "";
                            $scope.checkedThemesPdf = [];
                            $scope.ProfileUser = 'Unige';
                            $scope.ProfileDwgDefault = '';
                            doModal(true);
                            self.thematiSelected = [];
                            self.handleSelected = [];
                            self.thematiForBlockPdf = [];
                            self.expanded = false;
                            $scope.includeAllLayer = false;
                            $scope.includeAllBlock = false;
                            $scope.selectedFloor = 0;
                            $scope.blocksAndLayersAllPdf = {};   

                            $scope.countFloor = function () {
                                $scope.selectedFloor = 0;

                                for (oFloor in self.fileInfo) {
                                    if (self.fileInfo[oFloor].checked) {
                                        $scope.selectedFloor += 1;
                                    }
                                }
                            }

                            $scope.resetFloor = function () {
                                for (oFloor in self.fileInfo) {
                                    self.fileInfo[oFloor].checked = false;
                                }
                            }

                            $scope.countFloor();

                            $scope.showCheckboxes = function () {
                                var checkboxes = document.getElementById("chkPiani");
                                if (!self.expanded) {
                                    checkboxes.style.display = "block";
                                    self.expanded = true;
                                } else {
                                    checkboxes.style.display = "none";
                                    self.expanded = false;
                                }
                            }

                            $scope.treeThemesAll = function () {
                                config.MF.api
                                    .get({
                                        storedProcedureName: self.storedForCad['DWG_GetTreeContent_for_pdf_all'] ? self.storedForCad['DWG_GetTreeContent_for_pdf_all'] : "core.DWG_GetTreeContent_for_pdf_all",
                                        clathemId: self.selectedTree.value(),
                                        data: {
                                            storedprocedure: self.storedForCad['DWG_GetTreeContent_for_pdf_all'] ? self.storedForCad['DWG_GetTreeContent_for_pdf_all'] : "core.DWG_GetTreeContent_for_pdf_all",
                                            gridData: {
                                                gridname: sourcegridname,
                                                id: sourceItemIds,
                                            },
                                            selectedFiles: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,
                                            treeFilter: self.filterHandler(),
                                        },
                                    })
                                    .then(
                                        function (result) {
                                            if (!result.length) {
                                                return;
                                            }

                                            $.each(result[0], function (i, v) {
                                                self.thematiForBlockPdf.push(v);
                                            });

                                            $timeout(function () {
                                                doModal(false)
                                            }, 1000);
                                        },
                                        function (err) {
                                            console.log(err);
                                        },
                                    );
                            }

                            $scope.xmlExtractPdf = {};

                            $scope.oScopeXmlExtractPdf = {
                                PaperOrientation: "V",
                                TableOrientation: "H",
                                HideHact: true,
                                PrintLogo: true,
                                PrintTitle: true,
                                dbhkey: "",
                                cid: "",
                                logoBasePath: "",
                                PdfVer: "",
                                EnableLayers: false,
                                MultiPage: true,
                                XeHatch: "",
                                paperSize: null,
                                penPath: null,
                                printRaster: true,
                                defaultProfile: "Default",
                                excludeThemati: false,
                                Architettonico: false,
                                id: 0,
                                cartouche : null
                            };

                            $scope.setProfile = function (ProfileUser) {
                                $scope.xmlExtractPdf = angular.copy($scope.oScopeXmlExtractPdf);
                                
                                var oProfiles = $scope.gdv.ProfilesUser.filter(function (item) {
                                    return item.value === ProfileUser;
                                })[0];

                                $.each(oProfiles, function (item, v) {
                                    if (item != 'value' && item != 'text') {
                                        try {
                                            $scope.xmlExtractPdf[item] = v;
                                        } catch (e) {
                                            console.log('profili: campo non trovato ' + v);
                                        }
                                    }
                                });
                            }

                            $.each($scope.gdv.ProfilesUser, function (i, profile) {
                                if (profile.principal) {
                                    $scope.ProfileUser = profile.value;
                                    //$scope.setProfile();
                                };
                            });

                            $scope.Themati = function (sTemplate) {
                                $uibModal.open({
                                    templateUrl: window.includesVersion + sTemplate, //sTemplate, // loads the template
                                    animation: true,
                                    backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                                    windowClass: 'pdf-div-container', // windowClass - additional CSS class(es) to be added to a modal window template
                                    size: '',
                                    scope: $scope,
                                    controller: ("thematiPdf", ["$scope", "$uibModalInstance", function (
                                        $scope,
                                        $uibModalInstance,
                                    ) {

                                        $scope.checkall = true;

                                        $scope.toggleAll = function () {
                                            var toggleStatus = !$scope.checkall;
                                            for (var key in self.pdfThemes) {
                                                self.pdfThemes[key].value = toggleStatus;
                                            }
                                            $scope.checkall = toggleStatus;
                                        };

                                        $scope.optionToggled = function () {
                                            $scope.checkall = self.pdfThemes.every(function (itm) {
                                                return itm.value;
                                            })
                                        }

                                        $scope.save = function () {
                                            $uibModalInstance.dismiss("cancel");
                                        }

                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss("cancel");
                                        };
                                    }]),
                                    resolve: {
                                        user: function () {
                                            return "hello";
                                        },
                                    },
                                }); //end of modal.
                            }; // end of scope.open function

                            $scope.openThematiPdf = function (sTemplate, type) {
                                $uibModal.open({
                                    templateUrl: window.includesVersion + sTemplate, //sTemplate, // loads the template
                                    animation: true,
                                    backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                                    windowClass: 'laybloPdf-window', // windowClass - additional CSS class(es) to be added to a modal window template
                                    size: '',
                                    scope: $scope,
                                    controller: ("floorsPdf", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {
                                        $scope.type = type;
                                        $scope.gdv = self;
                                        $scope.tab = (type == 'TEMI') ? 1 : 3;
                                        $scope.thematiGroup = [];
                                        $scope.idThematiGroup = 0;
                                        $scope.ThematiForGroup = [];
                                        $scope.ThematiForGroupBlock = [];


                                        $scope.setTab = function (newTab) {
                                            if (newTab === 2) {
                                                $scope.ThematiForGroup = [];
                                                $scope.ThematiForGroupBlock = [];
                                                $scope.initThematiForGroup();
                                            }

                                            //if (newTab === 3) {
                                            $scope.tab = newTab;
                                            //}
                                        };

                                        $scope.isSet = function (tabNum) {
                                            return $scope.tab === tabNum;
                                        };

                                        $scope.themes = [];
                                        $scope.nodeBlock = [];
                                        $scope.selectAllFloorValue = $scope.$parent.selectedFloor === self.selectedFiles.length ? true : false;


                                        $scope.init = function () {
                                            if ($scope.tab != 3) {
                                                $.each(self.thematiForBlockPdf, function (i, v) {
                                                    $scope.themes.push(v);
                                                });
                                            }

                                        }

                                        $scope.selectAllFloor = function (e) {
                                            for (oFloor in self.fileInfo) {
                                                self.fileInfo[oFloor].checked = $scope.selectAllFloorValue;
                                            }
                                        }

                                        $scope.selectSingleFloor = function () {
                                            if ($(".selectFloor").length == $(".selectFloor:checked").length) {
                                                $scope.selectAllFloorValue = true
                                            } else {
                                                $scope.selectAllFloorValue = false
                                            }
                                        }

                                        $scope.checkChange = function (node) {

                                            function checkChild(node) {
                                                $.each(node.children, function (i, child) {
                                                    child.checked = node.checked;


                                                    if (!!child.children) {
                                                        checkChild(child)
                                                    }
                                                    
                                                });

                                            }
                                            checkChild(node);
                                            //$.each(node.children, function (i, child) {
                                            //    child.checked = node.checked;
                                            //});

                                            $.each($scope.themes, function (i, parent) {

                                                if (parent.TREE_ID == node.TREE_PARENT_ID) {
                                                    parent.checked = parent.children.every(function (itm) {
                                                        return itm.checked;
                                                    })
                                                }

                                            });
                                        }

                                        $scope.setThematiPdf = function (node) {
                                            var check = false;
                                            $.each(node.children, function (i, child) {
                                                if (child.checked) {
                                                    check = true;
                                                    return
                                                }
                                            });

                                            if (check) {
                                                if (node.checkedEnd) {
                                                    var block = {
                                                        "id": node.TEMP_OBJ_ID,
                                                        "renderAsBlock": true,
                                                        "infoArea": node.infoArea,
                                                        "blockBackGroundColor": node.blockBackGroundColor,
                                                        "blockFontColor": node.blockFontColor,
                                                        "bStampaEtiche": node.bStampaEtiche,
                                                        "blockFontSize": node.blockFontSize
                                                    };
                                                    self.pdfBlock.push(block);
                                                }

                                                $.each(node.children, function (i, child) {
                                                    $scope.setHandlesPdf(child, node.TEMP_OBJ_ID);
                                                });

                                                self.thematiSelected.push({
                                                    "thematiId": node.TEMP_OBJ_ID,
                                                    "themati_label": node.label,
                                                    "themati_father": node.father
                                                });
                                            }
                                        }

                                        $scope.setHandlesPdf = function (node, nodeId) {
                                            if (node.checked) {
                                                self.handleSelected.push({
                                                    "ColourTemat": node.ColourTemat,
                                                    "id": node.TEMP_OBJ_ID,
                                                    "id_themati": nodeId
                                                });
                                            }

                                        }

                                        $scope.setThematiForGroup = function () {
                                            $.each($scope.ThematiForGroupBlock, function (i, block) {
                                                if (block.value) {
                                                    var oGroup = {
                                                        "name": "GRUPPO 1",
                                                        "groupThemati": $scope.idThematiGroup,
                                                        "blockThemati": block.id
                                                    }

                                                    self.GroupPdf.push(oGroup);
                                                }
                                            });
                                        }

                                        $scope.saveThemati = function () {

                                            self.thematiSelected = [];
                                            self.handleSelected = [];
                                            self.pdfBlock = [];
                                            self.GroupPdf = [];

                                            $.each(self.thematiForBlockPdf, function (ii, vv) {
                                                if (vv.TREE_PARENT_ID != -1) {
                                                    $scope.setThematiPdf(vv);
                                                }
                                            });

                                            $scope.setThematiForGroup();
                                        }

                                        $scope.save = function () {
                                            $scope.saveThemati();
                                            $uibModalInstance.dismiss("cancel");
                                            $scope.$parent.countFloor();

                                        }

                                        $scope.$watch('nodeBlock', function (newNode, oldNode) {
                                            oldNode.activateBlock = false;
                                            if (newNode.checked) {
                                                newNode.activateBlock = true;
                                            }
                                        });

                                        $scope.onShowBlock = function (node) {
                                            if (node.TREE_PARENT_ID != -1 && node.children) {
                                                if (node.checked) {
                                                    node.activateBlock = true;
                                                }

                                                $scope.nodeBlock = node;
                                            }
                                        }

                                        $scope.initThematiForGroup = function () {
                                            $.each($scope.themes, function (i, node) {
                                                $.each(node.children, function (ii, child) {
                                                    var oNode = {
                                                        "id": child.TEMP_OBJ_ID,
                                                        "text": child.TREE_LABEL,
                                                        "value": false
                                                    };

                                                    if (child.checked && !child.checkedEnd) {

                                                        $scope.ThematiForGroup.push(oNode);
                                                    }

                                                    if (child.checked && child.checkedEnd) {
                                                        $scope.ThematiForGroupBlock.push(oNode);
                                                    }

                                                });

                                            });
                                        }

                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss("cancel");
                                            $scope.$parent.countFloor();
                                        };

                                        $scope.init();

                                        //$scope.getFloors();
                                    }]),
                                    resolve: {
                                        user: function () {
                                            return "hello";
                                        },
                                    },
                                }); //end of modal.
                            }; // end of scope.open function

                            $scope.printPdfStart = function () {
                                $scope.DisabledAll = true;
                                $scope.pdfShow = false;
                                $scope.ngClassLoader = "spinner-border spinner-border-sm";
                                $("#pdfEstratto").attr("href", "");
                            }

                            $scope.printPdfEnd = function () {
                                $scope.DisabledAll = false;
                                $scope.ngClassLoader = "";
                                $timeout();
                            }

                            $scope.apriPdf = function () {                                 
                                $("#pdfEstratto").attr("href", self.isRef2Space ? $scope.pdfHref : '/api/MAGIC_SAVEFILE/GetFile?path=' + $scope.pdfHref.replace(FileUploadRootDir,'') );
                                $("#pdfEstratto")[0].click();
                            }

                            $scope.exportToPDF = function () {
                                
                                $("input[type=checkbox].thethemestobeexported____").each(function (i, v) {
                                    if ($(v).is(":checked"))
                                        self.ThemesPdf.push($(v).attr("id"));
                                });

                                $scope.printPdfStart();

                                function layerForPdf() {
                                    var layer = [];
                                    var layerToConside = {};

                                    if (!jQuery.isEmptyObject($scope.blocksAndLayersAllPdf)) {
                                        for (file in self.fileActiveLayers) {
                                            layerToConside[file] = $scope.blocksAndLayersAllPdf[file].layers
                                        }
                                    } else {
                                        layerToConside = self.fileActiveLayers
                                    }

                                    for (file in layerToConside) {
                                        if ($scope.includeAllLayer) {
                                            $.each(self.blocksAndLayersAll[file].layers, function (i, v) {
                                                if (v.name != "") {
                                                    layer.push({
                                                        fileName: file,
                                                        name: v.name
                                                    });
                                                }
                                            });
                                        }
                                        else {
                                            $.each(layerToConside[file], function (i, v) {
                                                if (v.checked) {
                                                    layer.push({
                                                        fileName: file,
                                                        name: v.name
                                                    })
                                                }
                                            })
                                        }
                                    }

                                    return layer;
                                }

                                function blockForPdf() {
                                    var block = [];
                                    var blockToConside = {};

                                    if (!jQuery.isEmptyObject($scope.blocksAndLayersAllPdf)) {
                                        for (file in self.fileActiveBlocks) {
                                            blockToConside[file] = $scope.blocksAndLayersAllPdf[file].blocks
                                        }
                                    } else {
                                        blockToConside = self.fileActiveBlocks
                                    }

                                    for (file in blockToConside) {
                                        if ($scope.includeAllBlock) {
                                            $.each(self.blocksAndLayersAll[file].blocks, function (i, v) {
                                                if (v.name != "") {
                                                    block.push({
                                                        fileName: file,
                                                        name: v.name
                                                    });
                                                }
                                            });
                                        } else {
                                            $.each(blockToConside[file], function (i, v) {
                                                if (v.checked) {
                                                    block.push({
                                                        fileName: file,
                                                        name: v.name
                                                    })
                                                }
                                            });
                                        }
                                    }

                                    return block;
                                }

                                var data = {
                                    gridname: sourcegridname,
                                    clathemId: self.selectedTree.value(),
                                    id: self.fileShownInDetail != '' ? self.fileInfo[self.fileShownInDetail].id : sourceItemIds,
                                    themes: self.pdfThemes.map(function (theme) {
                                        return theme.value ? theme.id : 0
                                    }).join(","),
                                    thematiSelected: self.thematiSelected,
                                    handleSelected: self.handleSelected,
                                    options: $scope.xmlExtractPdf,
                                    block: self.pdfBlock,
                                    groups: self.GroupPdf,
                                    treeSelected: self.thematiSelected.length > 0 ? null : $scope.checkedThemesPdf,
                                    fileActiveBlocks: blockForPdf(), //self.fileActiveBlocks[self.fileShownInDetail].filter(function (block) { if (block.checked) { return block } }),
                                    fileActiveLayers: layerForPdf(), //self.fileActiveLayers[self.fileShownInDetail].filter(function (layer) { if (layer.checked) { return layer } })
                                    ApplicationInstanceId: window.ApplicationInstanceId,
                                    selectedFloors: self.showViewerDetail ? [] : $.map(self.fileInfo, function (e) { if (e.checked) { return e.id } }),
                                    launchTeighaFromDb: self.launchTeighaFromDb,
                                    reftreeServiceCode: "EXTRACTPDF",
                                    Workflow_Instance_Id: WorkflowInstanceItemIds,
                                    selectedFloorsDocver: self.showViewerDetail ? [] : $.map(self.fileInfo, function (e) { if (e.checked) { return { docver_id: e.idDwg } } }),
                                    docver_id: self.fileShownInDetail != '' ? self.fileInfo[self.fileShownInDetail].idDwg : null,
                                }

                                if (!self.launchTeighaFromDb) {
                                    self.callTeighaService(JSON.stringify(data))
                                        .then(function (res) {
                                            $scope.responsePdf(res);
                                            self.showDetail = true;
                                            $scope.printPdfEnd();
                                        }, function (err) {
                                            self.showDetail = false;
                                            $scope.printPdfEnd();
                                        });
                                } else {
                                    config.MF.api
                                        .get({
                                            storedProcedureName: self.storedForCad['DWG_Export_PDF'] ? self.storedForCad['DWG_Export_PDF'] : "core.DWG_Export_PDF",
                                            data: data,
                                        })
                                        .then(
                                            function (result) {
                                                if (!result.length) {
                                                    self.showDetail = false;
                                                    return;
                                                }

                                                $.each(result[0], function (i, v) {
                                                    $scope.responsePdf(v);
                                                });

                                                self.showDetail = true;
                                                $scope.printPdfEnd();
                                            },
                                            function (err) {
                                                $scope.printPdfEnd();
                                                $("#pdfButton").show();
                                                console.log(err);
                                            }
                                        );
                                    /*fine storeprocedure*/
                                }
                            };

                            $scope.responsePdf = function (v) {
                                if (v.status == "OK") {
                                    try {
                                        $scope.pdfFiles = [];
                                        var file = parseXml(v.response).getElementsByTagName("file");

                                        if (file.length > 0) {
                                            $.each(file, function (i, v) {
                                                v.href = self.isRef2Space ? v.innerHTML : v.href = '/api/MAGIC_SAVEFILE/GetFile?path=' + v.innerHTML.replace(FileUploadRootDir, '');
                                                $scope.pdfFiles.push(v);
                                            })
                                        } else {
                                            $scope.pdfFiles = [];
                                            if (self.isRef2Space) {
                                                $scope.pdfFiles.push({ href: v.response });
                                            } else {
                                                $scope.pdfFiles.push({ href: '/api/MAGIC_SAVEFILE/GetFile?path=' + v.response.replace(FileUploadRootDir, '') });
                                            }
                                        }
                                    }
                                    catch (ex) {
                                        console.log('Errore nel reperimeto del file pdf');
                                    }

                                    $timeout(function () {
                                        $scope.pdfShow = true;
                                    }, 1000);
                                }
                            }

                            $scope.createThemesForPdf = function (listThemes, node, themas) {
                                if (node.dwg_theme && node.checked) {

                                    var files = {};
                                    files = self.getFileInfo(node, files);
                                    $.each(files, function (key, value) {
                                        $.each(value.tdata, function (j, t) {
                                            $.each(t.handles, function (pos, val) {
                                                if (!!node.handles[val]) {
                                                    listThemes.push({
                                                        "ClathemId": node.ClathemId,
                                                        "ColourTemat": node.ColourTemat ? node.ColourTemat : null,
                                                        "SubmatId": node.SubmatId ? node.SubmatId : null,
                                                        "ThematiId": node.ThematiId,
                                                        "Tot_nr": node.Tot_nr ? node.Tot_nr : "",
                                                        "ValueTemat": node.ValueTemat ? node.ValueTemat : null,
                                                        "unit_measure": node.unit_measure ? node.unit_measure : "",
                                                        "id": node.ThematiId,
                                                        "description": themas + " - " + node.Description,
                                                        "label": node.Description,
                                                        "filename": key,
                                                        "handle": val,
                                                        "theme_description": themas,
                                                        "Treedesc": node.Treedesc
                                                    });
                                                }
                                            });
                                        });
                                    });

                                    $.each(node.items, function (i, child) {
                                        $scope.createThemesForPdf(listThemes, child, themas);
                                    });
                                } else {
                                    themas += themas == "" ? node.Description : " - " + node.Description;
                                    $.each(node.items, function (i, child) {
                                        $scope.createThemesForPdf(listThemes, child, themas);
                                    });
                                }
                            }

                            $scope.useTreeThemati = function () {
                                $scope.checkedThemesPdf = [];
                                $.each($("#treeThemati").data("kendoTreeView").dataSource._data, function (i, node) {
                                    var themasTitle = "";
                                    $scope.createThemesForPdf($scope.checkedThemesPdf, node, themasTitle);
                                });
                            }

                            $scope.treeThemesAll();

                            $scope.setProfile($scope.ProfileUser);

                            $scope.cancel = function () {
                                self.openLayout = false;
                                $uibModalInstance.dismiss("cancel");
                                $scope.resetFloor();
                            };

                            $scope.useTreeThemati();

                            $scope.openAddProfile = function () {
                                $uibModal.open({
                                    template: '<div id="myheader" class="modal-header">\
                                                    <div class="row">\
                                                        <div style="text-align:right;" class="col-lg-12">\
                                                            <button ng-model="button" id="btnExit" class="btn btn-danger" ng-click="cancel()">X</button>\
                                                        </div>\
                                                    </div>\
                                                    <div class="row">\
                                                        <div style="text-align:center;" class="col-lg-12">\
                                                            <label>{{gdv.getLabels("Profili")}}</label>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                                <div class="modal-body" id="blockBody">\
                                                    <div class="row">\
                                                        <div class="col-lg-12">\
				                                            <magic-grid  gridname="RSN_VI_PROPDF_PERS_L"  gridoptionsextension="{dataBound: onDataBoundGridProfiles}"></magic-grid>\
                                                        </div>\
		                                            </div>\
                                                </div>\
                                                <div class="modal-footer">\
                                                     <div class="row">\
                                                        <div class="col-lg-12">\
                                                        </div>\
                                                    </div>\
                                                </div>',
                                    animation: true,
                                    backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                                    windowClass: 'themati-window', // windowClass - additional CSS class(es) to be added to a modal window template
                                    size: '',
                                    scope: $scope,
                                    controller: ("floorsPdf", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {

                                        $scope.onDataBoundGridProfiles = function (e) {
                                            self.getConfigTable();
                                            
                                        }

                                        $scope.gdv = self;

                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss("cancel");
                                            $scope.setProfile($scope.$parent.ProfileUser);
                                        };



                                        //$scope.getFloors();
                                    }]),
                                    resolve: {
                                        user: function () {
                                            return "hello";
                                        },
                                    },
                                }); //end of modal.
                            }; // end of scope.open function

                            $scope.openLayersBlocksPdf = function () {
                                $scope.modalLayerBlocks = $uibModal.open({
                                    template: '<div id="myheader" class="modal-header">\
                                                    <div class="row">\
                                                        <div style="text-align:right;" class="col-lg-12">\
                                                            <button ng-model="button" id="btnExit" class="btn btn-danger" ng-click="cancel()">X</button>\
                                                        </div>\
                                                    </div>\
                                                    <div class="row">\
                                                        <div style="text-align:center;" class="col-lg-12">\
                                                            <label>{{gdv.getLabels("blocchiLayer")}}</label>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                                <div class="modal-body" id="blockBody">\
                                                    <div ng-if="onInit" ng-include="\'layersBlocksHtml.html\'"></div>\
                                                </div>\
                                                <div class="modal-footer">\
                                                     <div class="row">\
                                                        <div class="col-lg-12">\
                                                            <button ng-if="false" class="btn btn-success" ng-click="save()">{{gdv.getLabels(\'save\')}}</button>\
                                                        </div>\
                                                    </div>\
                                                </div>',
                                    animation: true,
                                    backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                                    windowClass: 'laybloPdf-window', // windowClass - additional CSS class(es) to be added to a modal window template
                                    size: '',
                                    scope: $scope,
                                    controller: ("laybloPdf", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {
                                        $scope.gdv = self;
                                        $scope.fileList = [];
                                        $scope.onInit = false;



                                        $scope.toggleSelectBlocksFileNamePdf = function (fileName) {
                                            $scope.$parent.blocksAndLayersAllPdf[fileName].isSelectedBlocksAll = event.target.checked;

                                            angular.forEach($scope.$parent.blocksAndLayersAllPdf[fileName].blocks, function (item) {
                                                if (item.selectable) {
                                                    item.checked = event.target.checked;
                                                }
                                            });
                                        }

                                        $scope.toggleSelectLayersFileNamePdf = function (fileName) {
                                            $scope.$parent.blocksAndLayersAllPdf[fileName].isSelectedLayersAll = event.target.checked;

                                            angular.forEach($scope.$parent.blocksAndLayersAllPdf[fileName].layers, function (item) {
                                                if (item.selectable) {
                                                    item.checked = event.target.checked;
                                                }
                                            });
                                        }

                                        $scope.init = function () {

                                            $.each(self.selectedFiles, function (i, v) {
                                                if (self.fileShownInDetail != '') {
                                                    if (v.fileName == self.fileShownInDetail) {
                                                        $scope.fileList.push(v);
                                                    }
                                                } else {
                                                    $scope.fileList.push(v);
                                                }
                                            })

                                            if (jQuery.isEmptyObject($scope.$parent.blocksAndLayersAllPdf)) {
                                                for (bl in self.blocksAndLayersAll) {
                                                    var layers = [];
                                                    var blocks = [];


                                                    $.each(self.blocksAndLayersAll[bl].layers, function (i, v) {
                                                        var layer = {
                                                            ID: v.ID,
                                                            VISIBLE: v.VISIBLE,
                                                            checked: v.checked,
                                                            name: v.name,
                                                            selectable: v.selectable,
                                                        }
                                                        layers.push(layer);
                                                    })

                                                    $.each(self.blocksAndLayersAll[bl].blocks, function (i, v) {
                                                        var block = {
                                                            ID: v.ID,
                                                            VISIBLE: v.VISIBLE,
                                                            checked: v.checked,
                                                            name: v.name,
                                                            selectable: v.selectable,
                                                        }
                                                        blocks.push(block);
                                                    })

                                                    $scope.$parent.blocksAndLayersAllPdf[bl] = {
                                                        layers: layers,
                                                        blocks: blocks,
                                                        isSelectedLayersAll: true,
                                                        isSelectedBlocksAll: true

                                                    }

                                                    $.each($scope.$parent.blocksAndLayersAllPdf[bl].layers, function (i, v) {
                                                        if (v.checked == false) {
                                                            $scope.$parent.blocksAndLayersAllPdf[bl].isSelectedLayersAll = false;
                                                            return
                                                        }
                                                    })

                                                    $.each($scope.$parent.blocksAndLayersAllPdf[bl].blocks, function (i, v) {
                                                        if (v.checked == false) {
                                                            $scope.$parent.blocksAndLayersAllPdf[bl].isSelectedBlocksAll = false;
                                                            return
                                                        }
                                                    })
                                                }
                                            }

                                            $scope.onInit = true;
                                            $timeout();
                                        };

                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };

                                        $scope.save = function () {
                                            $scope.$close($scope.blocksAndLayersAllPdf);
                                        };

                                        $scope.init();

                                    }]),
                                    resolve: {
                                        user: function () {
                                            return "hello";
                                        },
                                    },
                                }); //end of modal.

                                var promise = $scope.modalLayerBlocks.result;

                                promise.then(function (result) {

                                    console.log("Save", result);
                                }).catch(function (reason) {
                                    console.log("Cancel", reason);
                                });
                            }; // end of scope.open function

                        },


                        ]),
                        resolve: {
                            user: function () {
                                return "hello";
                            },
                        },
                    }); //end of modal.
                }; // end of scope.open function

                $scope.openPdfDwg = function (sTemplate, tree) {
                    $uibModal.open({
                        templateUrl: window.includesVersion + sTemplate, //sTemplate, // loads the template
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        //windowClass: "modal-dialog-pdf", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        //scope: $scope,
                        controller: ("modalPdf", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {
                            $scope.rgv = self;
                            $scope.initForm = false;
                            $scope.dwgExtraInfo = { Id: 0, FontSize: 14, BlockForeGround: "#ff0000", BlockBackGround: "#ffffff", OutPutType: 0 };
                            $scope.DisabledAll = false;
                            $scope.ngClassLoader = "";
                            $scope.dwgHref = "";
                            $scope.dwgShow = false;
                            $scope.selectAllBlocksValue = true;
                            $scope.selectAllLayersValue = true;
                            $scope.selectAllThemaValue = false;


                            $scope.profilesDwg = [];
                            $scope.ProfileDwgDefault = '';
                            $scope.carassList = [];
                            $scope.thematiList = [];
                            $scope.layerListForDwg = [];
                            $scope.blockListForDwg = [];

                            $scope.fileActiveBlocks = {};
                            $scope.fileActiveLayers = {};
                            $scope.viewFile = false;
                             
                            $scope.init = function init() {
                                $scope.getCartoucheDgw();

                                doModal(true);
                                $timeout(function () {
                                    doModal(false);
                                    layerListForDwg();
                                    blockForPdfDwg();
                                    $scope.initForm = true;
                                    $scope.viewFile = true;

                                    $scope.activateBlocksLayers(self.fileInDetail.fileName);



                                }, 2000)
                            }

                            $scope.onSetViewerData = function setViewerData(data, fileName, viewer) {
                                console.log(viewer)
                                //if (data) {
                                //    $scope.viewers[fileName] = {
                                //        blocks: data.blocks,
                                //        layers: data.layers,
                                //        viewer: viewer
                                //    }
                                //}

                            };

                            $scope.getCarass = function getCarass() {

                                try {
                                    config.MF.api
                                        .get({
                                            storedProcedureName: self.storedForCad['DWG_Get_carass_DWG'] ? self.storedForCad['DWG_Get_carass_DWG'] : "core.DWG_Get_carass_DWG",
                                            data: {
                                                gridname: sourcegridname,
                                            }
                                        })
                                        .then(
                                            function (result) {
                                                if (!result.length) {
                                                    return;
                                                }

                                                $.each(result[0], function (i, v) {
                                                    $scope.carassList.push(v);
                                                });
                                            },
                                            function (err) {
                                                console.log("erorre tematisimi DWG export");
                                            },
                                        );
                                }
                                catch (ex) {
                                    console.log('DWG_Get_carass_DWG: ' + ex)
                                }
                            }

                            $scope.getThemati = function getThemati() {
                                $scope.thematiList = []

                                try {
                                    config.MF.api
                                        .get({
                                            storedProcedureName: self.storedForCad['DWG_Get_themati'] ? self.storedForCad['DWG_Get_themati'] : "core.DWG_Get_themati",
                                            data: {
                                                gridname: sourcegridname,
                                            }
                                        })
                                        .then(
                                            function (result) {
                                                if (!result.length) {
                                                    return;
                                                }

                                                $.each(result[0], function (i, v) {
                                                    $scope.thematiList.push(v);
                                                });
                                            },
                                            function (err) {
                                                console.log("erorre tematisimi DWG export");
                                            },
                                        );
                                }
                                catch (ex) {
                                    console.log('DWG_Get_themati: ' + ex)
                                }
                            }

                            $scope.selectAll = function (type) {
                                if (type == 'themati') {
                                    $.each($scope.thematiList, function (i, v) {
                                        v.checked = $scope.selectAllThemaValue;
                                    })
                                }
                                else if (type == 'layers') {
                                    $.each($scope.layerListForDwg, function (i, v) {
                                        v.checked = $scope.selectAllLayersValue;
                                    })
                                }
                                else if (type == 'blocks') {
                                    $.each($scope.blockListForDwg, function (i, v) {
                                        v.checked = $scope.selectAllBlocksValue;
                                    })
                                }

                                $scope.activateBlocksLayers(self.fileShownInDetail);
                            }

                            $scope.selectAllThema = function (e) {
                                $.each($scope.thematiList, function (i, v) {
                                    v.checked = $scope.selectAllThemaValue;
                                })
                            }


                            function layerListForDwg() {
                                $scope.layerListForDwg = [];
                                $.each(self.blocksAndLayersAll[self.fileInDetail.fileName].layers, function (i, v) {
                                    $scope.layerListForDwg.push({
                                        name: v.name,
                                        checked: v.checked,
                                        VISIBLE: true,
                                        selectable: true,
                                        external: true
                                    })
                                })
                            }

                            function blockForPdfDwg() {
                                $scope.blockListForDwg = [];

                                $.each(self.blocksAndLayersAll[self.fileInDetail.fileName].blocks, function (i, v) {
                                    $scope.blockListForDwg.push({
                                        name: v.name,
                                        checked: true,
                                        VISIBLE: true,
                                        selectable: true
                                    })
                                })


                            }

                            $scope.selectSingle = function selectSingle(classe, value) {
                                if (classe == 'selectThema') {
                                    if ($("." + classe).length == $("." + classe + ":checked").length) {
                                        $scope.selectAllThemaValue = true
                                    } else {
                                        $scope.selectAllThemaValue = false
                                    }
                                }
                                else if (classe == 'selectLayer') {
                                    if ($("." + classe).length == $("." + classe + ":checked").length) {
                                        $scope.selectAllLayersValue = true
                                    } else {
                                        $scope.selectAllLayersValue = false
                                    }
                                }
                                else if (classe == 'selectBlock') {
                                    if ($("." + classe).length == $("." + classe + ":checked").length) {
                                        $scope.selectAllBlocksValue = true
                                    } else {
                                        $scope.selectAllBlocksValue = false
                                    }
                                }


                                $scope.activateBlocksLayers(self.fileShownInDetail);
                            }

                            $scope.printDwgStart = function () {
                                $scope.DisabledAll = true;
                                $scope.dwgShow = false;
                                $scope.ngClassLoader = "spinner-border spinner-border-sm";
                                $("#dwgEstratto").attr("href", "");
                            }

                            $scope.printDwgEnd = function () {
                                $scope.DisabledAll = false;
                                $scope.ngClassLoader = "";
                                $timeout();
                            }

                            $scope.apriDwg = function () {
                                $("#dwgEstratto").attr("href", $scope.dwgHref);
                                $("#dwgEstratto")[0].click();
                            }

                            $scope.getProfileDwg = function getProfileDwg() {
                                $scope.profilesDwg = [];


                                try {

                                    config.MF.api
                                        .get({
                                            storedProcedureName: self.storedForCad["DWG_Get_profil_Dwg"] ? self.storedForCad["DWG_Get_profil_Dwg"] : "core.DWG_Get_profil_Dwg",
                                            data: {
                                                gridname: sourcegridname,
                                                id: sourceItemIds,
                                            },
                                            ApplicationInstanceId: window.ApplicationInstanceId
                                            //treeData: {
                                            //    id: self.selectedTree.value(),
                                            //},
                                        })
                                        .then(
                                            function (result) {
                                                if (result.length == 0) {
                                                    return
                                                }
                                                $.each(result[0], function (i, v) {

                                                    if (v.Code == '0') {
                                                        $scope.setProfileDwg(v);
                                                    }
                                                    $scope.profilesDwg.push(v);
                                                });

                                            },
                                            function (err) {
                                                console.log(err);
                                                return;
                                            },
                                        );
                                }

                                catch (ex) {
                                    console.log('profili dwg: ' + ex)
                                }
                            }

                            $scope.getCartoucheDgw = function getCartoucheDgw() {
                                $scope.cartoucheDwg = [];


                                try {

                                    config.MF.api
                                        .get({
                                            storedProcedureName: self.storedForCad["DWG_Get_cartouche_Dwg"] ? self.storedForCad["DWG_Get_cartouche_Dwg"] : "core.DWG_Get_cartouche_Dwg",
                                            data: {
                                                gridname: sourcegridname,
                                                id: sourceItemIds,
                                            },
                                            ApplicationInstanceId: window.ApplicationInstanceId
                                            //treeData: {
                                        })
                                        .then(
                                            function (result) {
                                                if (result.length == 0) {
                                                    return
                                                }
                                                $.each(result[0], function (i, v) {
                                                    $scope.cartoucheDwg.push(v);
                                                });

                                            },
                                            function (err) {
                                                console.log(err);
                                                return;
                                            },
                                        );
                                }

                                catch (ex) {
                                    console.log('cartouche dwg: ' + ex)
                                }

                            }

                            $scope.setProfileDwg = function setProfileDwg(v) {

                                if (!v) {
                                    $scope.dwgExtraInfo = { Id: 0, FontSize: 14, BlockForeGround: "#ff0000", BlockBackGround: "#ffffff", OutPutType: 0 };
                                    return
                                }


                                $scope.dwgExtraInfo = {

                                    Code: v.code,
                                    Description: v.Description ? v.Description : "",
                                    FontSize: v.FontSize ? v.FontSize : 14,
                                    AtrFontSize: v.AtrFontSize ? v.AtrFontSize : 0,
                                    InfoArea: v.InfoArea ? v.InfoArea : 0,
                                    SetAtrColor: v.SetAtrColor ? v.SetAtrColor : 0,
                                    ColorBlock: v.ColorBlock ? v.ColorBlock : 0,

                                    //ExtraInfo
                                    DescArea: v.DescArea,
                                    OutPutType: v.OutPutType,
                                    LayerToEx: v.LayerToEx ? v.LayerToEx : "",
                                    BlockToEx: v.BlockToEx ? v.BlockToEx : "",
                                    WriteLabels: v.WriteLabels ? v.WriteLabels : 0,
                                    //ExtraInfo

                                    //profile
                                    Id: v.Id ? v.Id : 0,
                                    Name: v.Name ? v.Name : "",
                                    PostDwg: v.PostDwg,
                                    ClassName: v.ClassName ? v.ClassName : "",
                                    TemplatePath: v.TemplatePath ? v.TemplatePath : "",
                                    ReObjToExclude: v.ReObjToExclude ? v.ReObjToExclude : "",
                                    ReAtrToInclude: v.ReAtrToInclude ? v.ReAtrToInclude : "",
                                    PdfFormat: v.PdfFormat,
                                    PdfDim: v.PdfDim,
                                    idCartiglio: v.idCartiglio ? v.idCartiglio : 0,
                                    idPen: v.idPen ? v.idPen : 0,
                                    //profile

                                    //PdfPars
                                    BlockForeGround: v.BlockForeGround ? v.BlockForeGround : "#FFFFFF",
                                    BlockBackGround: v.BlockBackGround ? v.BlockBackGround : "#FFFFFF",
                                    LayOutName: v.LayOutName,
                                    Version: v.Version,
                                    ExportLayers: v.ExportLayers ? v.ExportLayers : "",
                                    BgColor: v.BgColor ? v.BgColor : "#FFFFFF",
                                    PaperOrientation: v.PaperOrientation ? v.PaperOrientation : "H|0",
                                    PenPath: v.PenPath ? v.PenPath : "",
                                    UsePens: v.UsePens ? v.UsePens : 0,
                                    UseDef: v.UseDef ? v.UseDef : 0,
                                    //PdfPars
                                }

                                $scope.includeThema($scope.dwgExtraInfo.ReAtrToInclude.split("|"));
                                $scope.excludeLayers($scope.dwgExtraInfo.LayerToEx.split("|"));
                                $scope.excludeBlocks($scope.dwgExtraInfo.BlockToEx.split("|"));

                            }

                            $scope.cancel = function () {
                                $uibModalInstance.dismiss("cancel");
                            };

                            $scope.activateBlocksLayers = function activateBlocksLayers(fileName) {
                                $scope.fileActiveLayers[fileName] = $scope.layerListForDwg.filter(function (layer) { if (layer.checked) { return layer } });
                                $scope.fileActiveBlocks[fileName] = $scope.blockListForDwg.filter(function (block) { if (block.checked) { return block } });
                            };

                            $scope.getProfileDwg();

                            $scope.getThemati();

                            $scope.excludeLayers = function excludeLayers() {
                                $.each($scope.layersli, function (ii, vv) {
                                    vv.checked = false;
                                })

                                $.each(oThemati, function (i, v) {
                                    $.each($scope.thematiList, function (ii, vv) {
                                        if (v == vv.Code) {
                                            vv.checked = true;
                                        }
                                    })
                                })
                            }

                            $scope.excludeLayers = function excludeLayers(layers) {
                                $.each($scope.layerListForDwg, function (ii, vv) {
                                    vv.checked = true;
                                })

                                $.each(layers, function (i, v) {
                                    $.each($scope.layerListForDwg, function (ii, vv) {
                                        if (v == vv.Code) {
                                            vv.checked = false;
                                        }
                                    })
                                })
                            }

                            $scope.excludeBlocks = function excludeLayers(blokcs) {
                                $.each($scope.blockListForDwg, function (ii, vv) {
                                    vv.checked = true;
                                })

                                $.each(blokcs, function (i, v) {
                                    $.each($scope.blockListForDwg, function (ii, vv) {
                                        if (v == vv.Code) {
                                            vv.checked = false;
                                        }
                                    })
                                })
                            }

                            $scope.includeThema = function excludeLayers(thema) {
                                $.each($scope.thematiList, function (ii, vv) {
                                    vv.checked = false;
                                })

                                $.each(thema, function (i, v) {
                                    $.each($scope.thematiList, function (ii, vv) {
                                        if (v == vv.Code) {
                                            vv.checked = true;
                                        }
                                    })
                                })
                            }

                            $scope.exportToDwg = function exportToDwg() {
                                $scope.printDwgStart();

                                try {
                                    config.MF.api
                                        .get({
                                            storedProcedureName: self.storedForCad['DWG_Export_dwg'] ? self.storedForCad['DWG_Export_dwg'] : "core.DWG_Export_dwg",
                                            clathemId: self.selectedTree.value(),


                                            data: {
                                                gridData: {
                                                    gridname: sourcegridname,
                                                    id: sourceItemIds,
                                                },
                                                id: self.fileShownInDetail != '' ? self.fileInfo[self.fileShownInDetail].id : sourceItemIds,
                                                dwgExtraInfo: $scope.dwgExtraInfo,
                                                fileActiveBlocks: $scope.blockListForDwg.filter(function (block) { if (!block.checked) { return block } }),
                                                fileActiveLayers: $scope.layerListForDwg.filter(function (layer) { if (!layer.checked) { return layer } }),
                                                thematiList: $scope.thematiList.filter(function (thema) { if (thema.checked) { return thema } }),
                                                ApplicationInstanceId: window.ApplicationInstanceId,
                                                selectedFloors: self.showViewerDetail ? [] : $.map(self.fileInfo, function (e) { if (e.checked) { return e.id } }),
                                                atrFontSize: $scope.dwgExtraInfo.FontSize ? $scope.dwgExtraInfo.FontSize : 0,
                                                setAtrColor: $scope.dwgExtraInfo.setAtrColor ? $scope.dwgExtraInfo.setAtrColor : false,
                                                infoArea: $scope.dwgExtraInfo.InfoArea ? $scope.dwgExtraInfo.InfoArea : false,
                                                LabelCartDwg: self.fileInfo[self.fileInDetail.fileName].description,
                                                handles: self.viewers[self.fileShownInDetail].viewer.viewer.renderer.stack.map(function (handle) { if (handle._type == "polyline") { return { "handle": handle._handle } } })

                                            },
                                            selectedFiles: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,

                                        })
                                        .then(
                                            function (result) {
                                                if (!result.length) {
                                                    self.showDetail = false;
                                                    return;
                                                }


                                                $.each(result[0], function (i, v) {
                                                    if (v.status == "OK") {
                                                        
                                                        $scope.dwgHref = '/api/MAGIC_SAVEFILE/GetFile?path=' + v.response.replace(FileUploadRootDir != "/" ? FileUploadRootDir : '', '');
                                                        $scope.dwgShow = true;
                                                    }
                                                });

                                                self.showDetail = true;
                                                $scope.printDwgEnd();
                                            },
                                            function (err) {
                                                $scope.printDwgEnd();
                                                $("#dwgButton").show();
                                                console.log('Errore creazioen dwg: ' + err);

                                            },
                                        );
                                    /*fine storeprocedure*/
                                }
                                catch (ex) {
                                    $scope.printDwgEnd();
                                    console.log(ex);
                                }

                            }

                            $scope.init();

                        }])
                    });
                }

                self.initGridTreeFilter = 'US_VI_RELPOL_ASSET_FILTER_CAD'

                self.onSetfilteTreeGrid = function onSetfilteTreeGrid(filter) {
                    if ($('div[gridname="' + self.initGridTreeFilter + '"]').length > 0) {
                        $('div[gridname="' + self.initGridTreeFilter + '"]').data('kendoGrid').dataSource.filter(filter);
                    }
                }

                /*gestione filtri per il tree*/
                self.oFilterAssetTree = $.map(self.gridSelectionData, function (v, i) {
                    return v.AS_ASSET_ID ? v.AS_ASSET_ID : v.id;

                    //return self.grid.dataItem(
                    //    v,
                    //)[self.grid.dataSource.options.schema.model.id];
                });

                self.filteTreeStart = {
                    logic: 'or',
                    filters:
                        [{
                            operator: 'eq',
                            field: 'AS_ASSET_ID',
                            value: 0
                        }]
                }

                self.setfilteTreeStart = function () {
                    self.oFilterAssetTree = [];

                    $.each(sourceItemIds, function (i, v) {
                        self.oFilterAssetTree.push({
                            operator: 'eq',
                            field: 'AS_ASSET_ID',
                            value: v,
                        })
                    })

                    self.filteTreeStart = {
                        logic: 'or',
                        filters: self.oFilterAssetTree
                    }

                    self.onSetfilteTreeGrid(self.filteTreeStart);
                }

                $scope.openFilterModal = function (sTemplate) {
                    $uibModal.open({

                        templateUrl: window.includesVersion + sTemplate,
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        //windowClass: "modal-dialog-pdf", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        resolve: {
                            user: function () {
                                return "hello";
                            },
                        },

                        //scope: $scope,
                        controller: ("modalPdf", ["$scope", "$uibModalInstance", function ($scope, $uibModalInstance) {

                            $scope.gdv = self;



                            $uibModalInstance.opened.then(function () {
                                $timeout(function () {
                                    angular.element($("#filterGrid")).empty().append(angular.element($("#showFilterGridTree")));
                                    self.onShowFilterGridTree = true;
                                }, 500)
                            });

                            $scope.cancel = function () {
                                $uibModalInstance.dismiss("cancel");
                                self.onShowFilterGridTree = false;
                                //removeUserFiltersFromToolBarButton($('div[gridname="' + 'US_VI_RELPOL_ASSET_FILTER_CAD' + '"]').find('.fa-eraser').parent());
                                angular.element($("#actionGridSingleContainer")).append((angular.element($("#showFilterGridTree"))));
                            };
                        },


                        ]),
                    }); //end of modal.
                }; // end of scope.open function

                self.setfilteTreeStart();
                /*fine gestione filtri per il tree*/

                self.onExportExcelThemati = function () {
                    if (!self.selectedTreeExpandedItem) {
                        kendoConsole.log("Nessun record selezionato.", true);
                        return
                    }

                    doModal(true);

                    self.initGridExportThemati = false

                    var thema;
                    $.each(self.selectedTreeData._view, function (i, v) {
                        if (self.selectedTreeExpandedItem.ThematiId == v.ThematiId) {
                            thema = v;
                        }
                    });


                    $timeout(function () {
                        config.model = {
                            id: self.selectedThema.ThematiId,
                            data: {
                                storedprocedure: self.storedForCad['AS_SP_THEMATI_EXPORT_XLSX'] ? self.storedForCad['AS_SP_THEMATI_EXPORT_XLSX'] : "core.AS_SP_THEMATI_EXPORT_XLSX",
                                gridData: {
                                    gridname: sourcegridname,
                                    id: sourceItemIds,
                                    idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                                },
                                treeData: {
                                    treeDataelement: {
                                        id: self.selectedTree.value(),
                                        expandedItem: thema
                                         

                                    }
                                },
                                idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                            }
                        }

                        for (var i = 0; i < self.selectedFiles.length; i++) {
                            var nameFile = self.selectedFiles[i].fileName;
                            $.each(self.selectedFiles[i].tdata, function (i, v) {
                                $.each(v.handles, function (ii, vv) {

                                    self.initFilterGridExportThemati.push(vv);
                                });
                            });
                        }

                        if (self.initFilterGridExportThemati.length > 0) {
                            self.initGridExportThemati = true
                            doModal(false);
                        }
                        else {
                            doModal(false);
                            kendoConsole.log("Nessun record selezionato.", true);
                            config.model = {}
                            self.initGridExportThemati = false
                        }
                    }, 500)
                }

                self.onExportExcelNew = function () {
                    var obj = {
                        isPublic: false,
                        selectedRows: [{"AS_ASSET_ID": 1}],
                        synch: false,
                        tipmodId: 112
                    }

                    $.fileDownload('/api/Magic_DocumentModel/BuildExcel/', {
                        data: {
                            tipmodId: 112,
                            fileName: "",
                            storedProcedure: "",
                            data: JSON.stringify(obj),
                            filter: JSON.stringify(config.filter)
                        }, httpMethod: "POST"
                    });
                     
 
                }

                self.downloadDwg = function () {
                    self.fileToZipDwg = {};
                    doModal(true)

                    var data = {
                        gridname: sourcegridname,
                        id: sourceItemIds,
                        idFloor: self.fileShownInDetail != '' ? self.fileInfo[self.fileShownInDetail].id : null,
                        launchTeighaFromDb: self.launchTeighaFromDb,
                        reftreeServiceCode: "EXTRACTDWG",
                        ApplicationInstanceId: window.ApplicationInstanceId,
                    }


                    if (!self.launchTeighaFromDb) {
                        self.callTeighaService(JSON.stringify(data))
                            .then(function (v) {
                                if (v.status == "OK") {
                                    kendoConsole.log("Elaborazione effettuata attendere il file.", false);

                                    $.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=' + v.response.replace(FileUploadRootDir, ''));
                                } else {
                                    kendoConsole.log("Elaborazione non effettuata.", true);
                                }

                                doModal();
                            }, function (err) {
                                console.log(err);
                                doModal();
                            });
                    } else {
                        config.MF.api
                            .get({
                                storedProcedureName: self.storedForCad['DWG_Export_download_dwg'] ? self.storedForCad['DWG_Export_download_dwg'] : "core.DWG_Export_download_dwg",
                                //ApplicationInstanceId: window.ApplicationInstanceId,
                                data: data,
                            })
                            .then(
                                function (result) {
                                    doModal(false)
                                    if (!result.length) {
                                        return;
                                    }

                                    $.each(result[0], function (i, v) {
                                        if (v.status == "OK") {
                                            kendoConsole.log("Elaborazione effettuata attendere il file.", false);

                                            $.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=' + v.pathFile.replace(FileUploadRootDir, ''));
                                        } else {
                                            kendoConsole.log("Elaborazione non effettuata.", true);
                                        }
                                    });
                                },
                                function (err) {
                                    console.log(err);
                                    doModal(false)
                                },
                            );
                    }

                    

                }

                self.onDataBoundGridExportThemati = function (e) {
                    if (e.sender.dataSource.data().length > 0) {
                        e.sender.saveAsExcel();

                        $timeout(function () {

                            kendoConsole.log("Elaborazione effettuata attendere il file.", false);

                            doModal(false);
                        }, 2000)

                    } else {
                        kendoConsole.log("Nessun dato estratto.", true);
                        doModal(false)
                    }
                }

                /************************************************
                            Gestione degli impianti
                 ***********************************************/

                self.onDataBoundGridActionBlock = function onDataBoundGridActionBlock(e) {
                    if (e.sender.dataSource.data().length > 0) {
                        self.onShowBtnDetail = true;
                        config.rowData = e.sender.dataSource._data[0];
                        config.pk = "PL_ASSET_ID"
                        config.rowData.id = config.rowData.PL_ASSET_ID;
                        config.entityname = e.sender.options.EntityName;
                        config.actionCallback = function (p) {
                            if (p.type != "read" && !!p.type) {
                                $timeout(function () {
                                    self.actionCallback(p);
                                }, 500)
                                
                            }
                        }
                        config.multiAction = false;                        
                        getAngularControllerElement("reftreeDirectiveController", config);
                    }else {
                        self.onShowBtnDetail = false;
                        angular.element($("div[name='divAction']")).empty();                       
                    }
                }

                self.onTreeClickItem = function onTreeClickItem(e) {
                    if (e.dataItem.dwg_theme == null || e.dataItem.Tot_nr > 1) {
                        return
                    }

                    self.centerView();

                    var viewer = self.viewers[self.fileInDetail.fileName].viewer;
                    viewer.viewer.centerView();
                    viewer.viewer.controls.selectTools.deselectAll();

                    $.each(viewer.viewer.externalBlocks, function (i, v) {

                        //v.setColor(v.color ? v.color : "#000000");
                        v.setColor("#000000");
                        if (e.dataItem.checked && self.assetMode && v.handle == e.dataItem.dwg_theme.split("|")[0]) {
                            self.onSetFilterGridBlock({
                                    logic: 'and',
                                    filters: [
                                        {
                                            operator: 'eq',
                                            field: 'RS_RELPOL_HANDLE_BLK',
                                            value: v.handle,
                                        }
                                    ]
                            });

                            viewer.viewer.controls.selectTools.selected.push(v);
                            viewer.viewer.zoomTo(v.handle, 0.05);

                            v.setColor("#FF0000");
                            self.selectedBlock = v;

                            self.onDetailViewerClick(v);

                            if (v._draggable) {
                                self.showBlockToSave = true;
                                self.viewers[self.fileInDetail.fileName].viewer.onClickHandle(v);
                                self.onDetailViewerClick(v);
                            }
                        }
                    })


                    //self.externalBlocks[self.fileInDetail.fileName].map(function (extBlock) {
                    //    extBlock.options.map(function (opt) {
                    //        if (extBlock.blockName == self.selectedBlock.name && opt.handle == self.selectedBlock._handle) {
                    //            xScale = opt.xScale * 2;
                    //            yScale = opt.yScale * 2;
                    //        } else {

                    //            self.selectedBlock.setColor("#FF0000");
                    //            //xScale = opt.xScale;
                    //            //yScale = opt.yScale;
                    //        }

                    //        viewer.viewer.applyTransform(opt.handle, {
                    //            "xscale": xScale,
                    //            "yscale": yScale,
                    //            "zscale": 1
                    //        });
                    //    })
                    //});
                }

                self.actionBlockGridFilterStart = {
                    logic: 'and',
                    filters: [
                        {
                            operator: 'eq',
                            field: 'RS_RELPOL_HANDLE_BLK',
                            value: '',
                        }
                    ]
                }

                self.onResetGridBlock = function onResetGridBlock() {
                    var $grid = $('div[gridname="' + self.actionBlockGridName + '"]')
                    
                    if ($grid.length > 0) {
                        try {
                            grid = $grid.data("kendoGrid");
                            filter = grid.dataSource.filter();
                            filter = removeFiltersByType(filter, ["searchBar", "user", "pivot", "zoom", undefined]); //user filters
                            grid.dataSource.filter({
                                logic: 'and',
                                filters: [
                                    {
                                        operator: 'eq',
                                        field: 'RS_RELPOL_HANDLE_BLK',
                                        value: '',
                                    }
                                ]
                            });
                            $grid.find("#maingridsearchandfilter").val('');
                            updateUserFilterLabel($grid);

                            //self.onSetFilterGridBlock(self.actionBlockGridFilterStart);
                        }
                        catch (ex) {
                            console.log(ex);
                        }

                    }
                }

                self.onSetFilterGridBlock = function onSetFilterGridBlock(filterSel) {
                    var oGrid = $('div[gridname="' + self.actionBlockGridName + '"]');

                    if (oGrid.length > 0 && !!oGrid.data('kendoGrid')) {
                        oGrid.data('kendoGrid').dataSource.filter(filterSel);
                    }
                }

                /*gestione delle info impianti*/

                self.initBlockGridInfoCadFilterStart = {
                    logic: 'and',
                    filters: [
                        {
                            operator: 'eq',
                            field: 'RS_RELPOL_HANDLE_BLK',
                            value: '',
                        }
                    ]
                }

                self.onSetFilterGridBlockInfoCad = function onSetFilterGridBlockInfoCad(filterSel) {
                    var oGrid = $('div[gridname="' + self.initGridNameBlockInfoCad + '"]');

                    if (oGrid.length > 0 && !!oGrid.data('kendoGrid')) {
                        oGrid.data('kendoGrid').dataSource.filter(filterSel);
                    }
                }

                self.onDataBoundBlockGridInfoCad = function onDataBoundGridInfoCad(e) {
                    e.sender.element.find('.k-grid-toolbar').hide();
                }

                self.onResetGridBlockInfoCad = function onResetGridBlockInfoCad() {
                    self.selectedBlock = null;
                    var $grid = $('div[gridname="' + self.initGridNameBlockInfoCad + '"]')

                    if ($grid.length > 0) {
                        try {
                            grid = $grid.data("kendoGrid");
                            filter = grid.dataSource.filter();
                            filter = removeFiltersByType(filter, ["searchBar", "user", "pivot", "zoom", undefined]); //user filters
                            grid.dataSource.filter(filter);
                            $grid.find("#maingridsearchandfilter").val('');
                            updateUserFilterLabel($grid);

                            self.onSetFilterGridBlockInfoCad(self.initBlockGridInfoCadFilterStart);
                            self.onSetSplitterViewer();
                        }
                        catch (ex) {
                            console.log(ex);
                        }

                    }   
                }

                self.initGridBlockInfoCadActivate = function initGridBlockInfoCadActivate(e) {                    
                    var oHandle = [];
                    var oFloor = [];
                    $.each(self.selectedFiles, function (i, file) {
                        if (file.fileName == self.fileInDetail.fileName){
                            oFloor.push({ operator: 'eq', field: 'ID_PIANO', value: self.fileInfo[file.fileName].id })
                            $.each(file.tdata, function (k, data) {
                                $.each(data.handles, function (y, handle) {
                                    oHandle.push({ operator: 'eq', field: 'RS_RELPOL_HANDLE_BLK', value: handle });
                                });
                            })
                        }
                    })


                    if (oHandle.length > 0) {
                        self.filterBlockGridInfoCad = {
                            logic: "and",
                            filters: [{ logic: "or", filters: oFloor }, {
                                logic: "or",
                                filters: oHandle
                            }]
                        };
                    } else {
                        self.filterBlockGridInfoCad = {
                            logic: "and",
                            filters: [{ operator: 'eq', field: 'RS_RELPOL_HANDLE_BLK', value: "" }]
                        }
                    }

                    self.onSetFilterGridBlockInfoCad(self.filterBlockGridInfoCad);
                }

                /*gestione delle info impianti*/

                /************************************************
                 * Fine Gestione degli impianti
                 *************************************************
                 */

                /************************************************
                 * Gestione dell info tramite griglia
                 *************************************************
                 */
   
                self.initGridInfoCadFilterStart = {
                                    logic: 'or',
                                    filters: [
                                        {
                                            operator: 'eq',
                                            field: 'HANDLE',
                                            value: '',
                                        }
                                    ]
                }               

                self.onResetGridInfoCad = function onResetGridInfoCad() {
                    //self.onInitGridInfoAsset = false;
                    //return;

                    var $grid = $('div[gridname="' + self.initGridNameInfoCad + '"]')
                       
                    if ($grid.length > 0) {
                        try {
                            grid = $grid.data("kendoGrid");
                            filter = grid.dataSource.filter();
                            filter = removeFiltersByType(filter, ["searchBar", "user", "pivot", "zoom", undefined]); //user filters
                            //grid.dataSource.filter(filter);
                            //$grid.find("#maingridsearchandfilter").val('');
                            //updateUserFilterLabel($grid);

                            self.onSetFilterGridInfoCad(self.initGridInfoCadFilterStart);
                        }
                        catch (ex) {
                            console.log(ex);
                        }
                      
                    }      
                }

                self.onSetFilterGridInfoCad = function onSetFilterGridInfoCad(filter) {
                    var oGrid = $('div[gridname="' + self.initGridNameInfoCad + '"]');

                    if (oGrid.length > 0 && !!oGrid.data('kendoGrid')) {
                        oGrid.data('kendoGrid').dataSource.filter(filter);
                    }
                }

                self.initGridInfoCadActivate = function initGridInfoCadActivate(e) {
                    //self.onInitGridInfoAsset = true;
                    var oHandle = [];

                    $.each(self.viewerSelectionRefresh, function (i, v) {
                        oHandle.push({ operator: 'eq', field: 'HANDLE', value: v.handle }
                        )
                    });

                    if (oHandle.length > 0) {
                        self.initFilterGridInfoCad = {
                            logic: "and",
                            filters: [{ operator: 'eq', field: 'ID_PIANO', value: self.selectedFloor }, {
                                logic: "or",
                                filters: oHandle
                            }]
                        };
                    } else {
                        self.initFilterGridInfoCad = {
                            logic: "and",
                            filters: [{ operator: 'eq', field: 'HANDLE', value: "" }]
                        }
                    }

                    self.onSetFilterGridInfoCad(self.initFilterGridInfoCad);
                }

                self.initGridInfoCadActivateAll = function initGridInfoCadActivateAll() {
                    var oHandle = [];
                    var oFloor = [];
                    $.each(self.selectedFiles, function (i, file) {
                        oFloor.push({ operator: 'eq', field: 'ID_PIANO', value: self.fileInfo[file.fileName].id })
                        $.each(file.tdata, function (k, data) {
                            $.each(data.handles, function (y, handle) {
                                oHandle.push({ operator: 'eq', field: 'HANDLE', value: handle });
                            });
                        })
                    })


                    if (oHandle.length > 0) {
                        self.initFilterGridInfoCad = {
                            logic: "and",
                            filters: [{ logic: "or", filters: oFloor }, {
                                logic: "or",
                                filters: oHandle
                            }]
                        };
                    } else {
                        self.initFilterGridInfoCad = {
                            logic: "and",
                            filters: [{ operator: 'eq', field: 'HANDLE', value: "" }]
                        }
                    }



                    //self.activateInitGridCadInfo = true;
                    self.onSetFilterGridInfoCad(self.initFilterGridInfoCad);
                }

                self.onDataBoundGridInfoCad = function onDataBoundGridInfoCad(e) {
                    e.sender.element.find('.k-grid-toolbar').hide();
                    self.oGridInfoCadData = e.sender.dataSource.data();

                    if (e.sender.dataSource.data().length > 0) {
                        $timeout(function () {
                            try {
                                e.sender.element.find('a[title="autoResizeColumns"]').click();
                                
                            } catch (ex) {
                                console.log(ex);
                            }

                            if (self.showViewerDetail) {
                                var handleSelected = self.eventClick ? self.eventClick.handle : "";

                                $.each(e.sender.dataSource.data(), function (i, v) {
                                    if (handleSelected == v.HANDLE) {
                                        $('div[gridname="' + self.initGridNameInfoCad + '"]').find('tr[data-uid="' + v.uid + '"]').addClass('k-state-selected');
                                    }
                                })
                            }
                        }, 1000)
                    }
                }

                self.onExportExcelAllAsset = function (gridName) {


                    var oGrid = $('div[gridname="' + gridName + '"]');
                    if (oGrid.length > 0) {
                        if (oGrid.data('kendoGrid').dataSource._data.length > 0) {
                            oGrid.find('span[id="XlsExport"]').click();
                            kendoConsole.log("Elaborazione effettuata attendere il file.", false);

                        }
                        else {
                            kendoConsole.log("Nessun record selezionato.", true);
                        }
                    } else {
                        kendoConsole.log("Nessun record selezionato.", true);
                    }
                }

                /************************************************
                * Gestione dell info tramite griglia fine
                *************************************************
                */

                /************************************************
                * Gestione della griglia delle azioni
                *************************************************
                */

                self.onResetGridAction = function onResetGridAction() {
                    self.initFilterGridStart = {
                        logic: 'or',
                        filters: [
                            {
                                operator: 'eq',
                                field: 'HANDLE',
                                value: "",
                            }
                        ]
                    }

                    self.onSetFilterGridAction(self.initFilterGridStart);
                    self.onSetSplitterViewer();
                }

                self.initFilterGridStart = {
                    logic: 'or',
                    filters: [
                        {
                            operator: 'eq',
                            field: 'HANDLE',
                            value: "",
                        }
                    ]
                }

                self.initGridActionSingle = function initGridActionSingle(handle) {                    
                    self.initFilterGrid = {
                        logic: "and",
                        filters: [
                            {
                                operator: 'eq',
                                field: 'ID_PIANO',
                                value: self.selectedFloor
                            },
                            {
                             
                                operator: 'eq',
                                field: 'HANDLE',
                                value: handle,                            
                        }]
                    }

                    self.onSetFilterGridAction(self.initFilterGrid);
                }

                /************************************************
                 * Gestione della griglia delle azioni fine
                 *************************************************/
                 
                self.onSetSplitterViewer = function () {

                    if (self.onCheckSplitter) {



                        if (self.showViewerDetail) {
                            $("#vertical").find('.k-splitbar-vertical').show();
                            $("#vertical").find('.k-splitbar-vertical').find('.k-collapse-next').click();
                        } else {
                            if ($("#vertical").find('.k-splitbar-vertical').find('.k-collapse-next').length > 0) {
                                $("#vertical").find('.k-splitbar-vertical').find('.k-collapse-next').click();
                            }
                            $("#vertical").find('.k-splitbar-vertical').hide();
                        }
                    }

                }

                self.onDetailMouseLeave = function onDetailMouseLeave(e) {
                    $('div[gridname="' + self.initGridNameInfoCad + '"]').find('tr').removeClass('k-state-selected');
                }

                self.maximizeSvgViewer = function (increase) {
                    self.viewerWidth = $(".dwg_preview_r3").width();
                    if (increase) {
                        self.viewerWidth += 20;
                    }
                    else {
                        self.viewerWidth -= 20;
                    }

                    if ($(".dwg_preview_r3").parent().width() > self.viewerWidth + 20 && self.viewerWidth > 100) {
                        $(".dwg_preview_r3").width(self.viewerWidth);
                    }
                }

                self.setSvgViewer = function () {
                    $(".dwg_preview_r3").removeClass().addClass(self.getViewerContainerClass);
                }

                /************************************************
                 * Aggiunto in data 13/04/2020
                 * Gestione dei layer e blocchi in preview
                 *************************************************/

                self.isAllLayerSelectFileName = {};
                self.isAllBlockSelectFileName = {};

                //toggle all checkboxes blocks
                self.toggleSelectBlocksFileName = function (fileName) {
                    self.isAllBlocksSelect = event.target.checked;

                    angular.forEach(self.blocksAndLayersAll[fileName].blocks, function (item) {
                        if (item.selectable) {
                            item.checked = event.target.checked;
                        }
                    });
                    self.setActiveBlocksAndLayersPerFileAll(fileName);
                }

                //toggle all checkboxes Layers
                self.toggleSelectLayersFileName = function (fileName) {
                    self.isAllLayerSelect = event.target.checked;


                    angular.forEach(self.blocksAndLayersAll[fileName].layers, function (item) {
                        if (item.selectable) {
                            item.checked = event.target.checked;
                        }
                    });

                    self.setActiveBlocksAndLayersPerFileAll(fileName);
                }

                self.onBlockClickFileName = function onBlockClickFileName(layerToHandle, fileName) {

                    var blocks = self.blocksAndLayersAll[fileName].blocks;
                    self.isAllBlocksSelect = true;
                    for (key in blocks) {
                        if (blocks[key].selectable && !blocks[key].checked) {

                            self.isAllBlocksSelect = false;
                            self.isAllBlockSelectFileName[fileName] = false;
                        }
                    }
                    self.setActiveBlocksAndLayersPerFileAll(fileName);
                };

                self.onLayerClickAllFileName = function onLayerClickAllFileName(layerToHandle, fileName) {
                    var layers = self.blocksAndLayersAll[fileName].layers;
                    self.isAllLayerSelect = true;
                    for (key in layers) {
                        if (layers[key].selectable && !layers[key].checked) {
                            self.isAllLayerSelect = false;
                            self.isAllLayerSelectFileName[fileName] = false;
                        }
                    }

                    self.setActiveBlocksAndLayersPerFileAll(fileName);
                };

                 /************************************************
                 * Fine Gestione dei layer e blocchi in preview
                 *************************************************/

                 /************************************************
                 * Aggiunto in data  01/12/2021
                 * Gestione estrazioni personalizzate
                 *************************************************/

                self.callTipmod = function callTipmod(tipmod) {
                    if (!self.selectedTreeExpandedItem) {
                        kendoConsole.log("Nessun record selezionato.", true);
                        return
                    }

                    var handles = [];

                    $.each(self.selectedFiles, function (i, file) {
                        if (self.showViewerDetail && self.fileInDetail) {
                            if (self.fileInfo[self.fileInDetail.fileName].id == self.fileInfo[file.fileName].id) {
                                $.each(file.tdata, function (ii, tdata) {
                                    $.each(tdata.handles, function (iii, handle) {
                                        handles.push({ handle: handle, id_piano: self.fileInfo[file.fileName].id });
                                    })
                                })
                            }
                        } else {
                            $.each(file.tdata, function (ii, tdata) {
                                $.each(tdata.handles, function (iii, handle) {
                                    handles.push({ handle: handle, id_piano: self.fileInfo[file.fileName].id });
                                })
                            })
                        }
                    })

                    var thema;
                    $.each(self.selectedTreeData._view, function (i, v) {
                        if (self.selectedTreeExpandedItem.ThematiId == v.ThematiId) {
                            thema = v;
                        }
                    });

                     
                    var obj = {
                        isPublic: false,
                        selectedRows: handles,
                        synch: false,
                        tipmodId: tipmod.PS_TIPMOD_ID,
                        idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                        initGridNameInfoCad: config.dwgCadInfo.initGridNameInfoCad,
                        id: sourceItemIds,
                    }

                    $.fileDownload('/api/Magic_DocumentModel/BuildExcel/', {
                        data: {
                            tipmodId: tipmod.PS_TIPMOD_ID,
                            fileName: "",
                            storedProcedure: "",
                            data: JSON.stringify(obj),
                            filter: JSON.stringify(config.filter)
                        }, httpMethod: "POST"
                    });

                }
                 
                 /************************************************
                 * Aggiunto in data  01/12/2021
                 * fine gestione estrazioni personalizzate
                 *************************************************/


                 /************************************************
                 * Aggiunto in data 
                 * Gestione tree asset per gestione
                 *************************************************/
                self.treeDataAsset = [];

                self.bShowTreeAsset = false;

                self.onSetTreeAsset = function onSetTreeAsset() {
                    try {
                        config.MF.api
                            .get({
                                storedProcedureName: self.storedForCad['DWG_Get_asset_tree'] ? self.storedForCad['DWG_Get_asset_tree'] : "core.DWG_Get_asset_tree",
                                gridData: {
                                    gridname: sourcegridname,
                                    id: sourceItemIds,
                                },
                                //treeData: {
                                //    id: self.selectedTree.value(),
                                //},
                            })
                            .then(
                                function (result) {
                                    if (!result.length) {
                                        return;
                                    }
                                    self.treeDataAsset = [];

                                    $.each(result[0], function (i, v) {
                                        self.treeDataAsset.push(v);
                                    });

                                    self.bShowTreeAsset = true;

                                    //$scope.$apply();
                                },
                                function (err) {
                                    console.log('Errore treeview asset: ' + err);
                                },
                        );

                        /*fine storeprocedure*/
                    }
                    catch (ex) {
                        console.log(ex);
                    }
                }

                self.treeAssetClick = function treeAssetClick(e) {
                    console.log(e);
                }
                
                self.callTeighaService = function callTeighaService(result) {
                    return new Promise((resolve, reject) => {
                        $.ajax({
                            type: "POST",
                            url: "/api/RefTreeServices/StartServiceFromModelNew/",
                            data: result,
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function (data) {
                                var data1 = {};

                                data1.response = data.Response;
                                data1.status = data.Status;

                                resolve(data1)
                            },
                            error: function (error) {
                                
                                reject(error)

                            },
                        })
                    })
                }
                 /************************************************
                 * FineGestione tree asset per gestione
                 *************************************************/
                 
                self.openDetailObject = function (dataItem) {
                    $uibModal.open({
                        template: '<div ng-include="userTemplate"></div>',
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        windowClass: "modal-dialog-detail", // windowClass - additional CSS class(es) to be added to a modal window template
                        //size: "lg",
                        //restrict: "AC",
                        keyboard: true,
                        //scope: $scope,
                        controller: ("modalDetail", ["$scope", "$uibModalInstance", "$timeout", "$compile", function ($scope, $uibModalInstance, $timeout, $compile) {
                            $scope.rgv = self;
                            $scope.userTemplate = "blockDetailTemplateUrl.html";
                            $scope.title = '';
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss("cancel");
                            };

                            $scope.getInfoCadDetails = function getImages() {
                                if (self.infoCadSpDetails == '') {
                                    console.log('Stored slider cad');
                                    return [];
                                }

                                return MF.api.get({
                                    storedProcedureName: self.infoCadSpDetails,
                                    entity: dataItem,
                                    data: {
                                        ApplicationInstanceId: window.ApplicationInstanceId,
                                    },
                                }).then(function (result) {
                                    if (!result[0]) {
                                        return
                                    }

                                    $.each(result[0], function (i, v) {
                                        
                                        $scope.title = v.title;
                                        $scope[v.obj] = JSON.parse(v['data']);

                                        $timeout(function () {
                                            angular.element($("#blockDetailInfo")).empty().append($compile(v.template)($scope));
                                        })
                                        
                                    })
                                }, function (err) {
                                    console.log(err);
                                });
                            }
 
                        }])
                    });
                }

                self.onShowMeasure = function onShowMeasure() {
                    self.bMeasureMode = !self.bMeasureMode;    
                }

                self.onSetMode = function onSetMode(mode) {
                    self.modalityMode = self.modalityMode == mode ? 'V' : mode;                     
                }


                /************************************************
                 * Comparazione tra i file
                 *************************************************/

                self.onShowHideCompare = function onShowHideCompare() {
                    self.showCompare = !self.showCompare;

                    $timeout(function () {
                        var filename = self.fileShownInDetail;

                        if (self.showCompare) {
                            var filename = self.fileShownInDetail;
                            var comparabled = ["LWPOLYLINE", "POLYLINE"];
                            self.enableButtonCompare = true;
                            self.comparebleEntities[filename] = comparabled;
                        } else {
                            self.enableButtonCompare = true;
                            self.comparebleEntities[filename] = [];
                            self.fileCompare[self.fileInDetail.fileName] = {};
                        }
                    });
                }

                self.compareDxfPython = function compareDxfPython(btn, file) {
                    doModal(true);

                    self.dxfToCompare = [];
                    self.dxfToCompare.push(
                        [
                            { "fileStart": false, "file": file.fileName }
                        ],
                        [
                            { "fileStart": true, "file": self.fileInDetail.fileName }
                        ]
                    );

                    var data = {
                        gridname: sourcegridname,
                        clathemId: self.selectedTree.value(),
                        id: self.fileShownInDetail != '' ? self.fileInfo[self.fileShownInDetail].id : sourceItemIds,
                        ApplicationInstanceId: window.ApplicationInstanceId,
                        selectedFile: self.dxfToCompare,
                        reftreeServiceCode: "COMPAREDXF"
                    }



                    self.callTeighaService(JSON.stringify(data))
                        .then(function (res) {

                            kendoConsole.log(JSON.parse(res.response).message);
                            $.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=' + JSON.parse(res.response).fileName.replace(FileUploadRootDir, ''));
                            doModal(false);
                        }, function (err) {
                            kendoConsole.log(err.responseText);
                            doModal(false);
                        });
                }
                 
                self.compareDxf = function compareDxf(btn, file) {

                    self.dxfToCompare = [];
                    self.dxfToCompare.push([file.fileName], [self.fileInDetail.fileName])


                    doModal(true);

                    $timeout(function () {
                        self.fileCompare = {};
                    });         
                    
                    $timeout(function () {
                        if (btn.file) {
                            

                            self.fileCompare[self.fileInDetail.fileName] = {
                                useCompression: false,
                                isReftree: true,
                                fileName: btn.file.fileName
                            }
                            
                            
                        } else {
                            var fileInput = document.getElementById('fileUpload');

                            if (fileInput && fileInput.files) {
                                const files = fileInput.files;

                                if (files.length > 0) {
                                    const file = files[0];

                                    const reader = new FileReader();
                                    reader.onload = (e) => {

                                        self.fileCompare[self.fileInDetail.fileName] = {
                                            data: e.currentTarget.result,
                                            isReftree: false,
                                        }
                                    };
                                    reader.readAsText(file);

                                } else {
                                    doModal(false);
                                    console.log('Nessun file selezionato');
                                }
                            }
                        }
                    });                    
                }

                self.onShowHideAdded = function onShowHideAdded() {
                    self.ShowHideAdded = !self.ShowHideAdded
                    var cadwebgl = self.viewers[self.fileInDetail.fileName].viewer.viewer;

                    cadwebgl.fillDifferencePolyline('ADDED', self.ShowHideAdded);
                }

                self.onShowHideMinus = function onShowHideMinus() {
                    self.ShowHideMinus = !self.ShowHideMinus
                    var cadwebgl = self.viewers[self.fileInDetail.fileName].viewer.viewer;

                    cadwebgl.fillDifferencePolyline('MINUS', self.ShowHideMinus);
                }

                self.onPdfComparePython = function onPdfComparePython() {
                    
                }

                self.onPdfCompare = function onPdfCompare() {
                    //delete require.cache[require.resolve('./b.js')]

                    if (typeof self.jsPDF == "undefined")
                        requireConfigAndMore(["jsPDF"], function (a) {
                            self.jsPDF = a;
                            
                            self.reallyCreatePdfNow();
                        });
                    else
                        self.reallyCreatePdfNow();
                    //self.reallyCreatePdfNow();

                }

                self.reallyCreatePdfNow = function () {
                    const pdfInput = {
                        pathFilename: "pdf_compare.pdf",
                        pages: []
                    }
                    var cadwebgl = self.viewers[self.fileInDetail.fileName].viewer.viewer;

                    cadwebgl.fillDifferencePolyline('ADDED', false);
                    cadwebgl.fillDifferencePolyline('MINUS', false);

                    pdfInput.pages.push({ lines: cadwebgl.getEntitiesComparable(false), ignoreColor: true })

                    if (cadwebgl.getEntitiesComparable(true).length > 0) {
                        cadwebgl.fillDifferencePolyline('ADDED', true);
                        cadwebgl.fillDifferencePolyline('MINUS', true);

                        pdfInput.pages.push({ lines: cadwebgl.getEntitiesComparable(true), ignoreColor: true })
                        pdfInput.pages.push({ lines: cadwebgl.getEntitiesComparable(false), ignoreColor: false })
                        pdfInput.pages.push({ lines: cadwebgl.getEntitiesComparable(true), ignoreColor: false })
                    }

                    var pdf = new self.jsPDF('p', 'mm', 'a4');
                    //var pdf = new jspdf('p', 'mm', 'a4');

                    pdfInput.pages.forEach((page, index) => {
                        if (page.lines.length > 0) {
                            self.printPage(cadwebgl , page, pdf)

                            if (index < pdfInput.pages.length - 1) {
                                pdf.addPage();
                            }
                        }
                    });

                    pdf.save(pdfInput.pathFilename);

                    self.insertDocumePdfCompare(pdfInput.pathFilename,pdf);
                     
                    cadwebgl.fillDifferencePolyline('ADDED', self.ShowHideAdded);
                    cadwebgl.fillDifferencePolyline('MINUS', self.ShowHideMinus);
                    cadwebgl.renderer.render();
                }

                self.insertDocumePdfCompare = function (filename, pdf) {
                    var filenameCompare = self.fileCompare[self.fileInDetail.fileName].fileName
                    var fileInfo = self.fileInfo[self.fileInDetail.fileName];
                    fileInfo.filenamePdf = filename  
                    
                    config.MF.api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_upload_file_compare_pdf'] ? self.storedForCad['DWG_upload_file_compare_pdf'] : "core.DWG_upload_file_compare_pdf",
                            id: sourceItemIds,                             
                            gridData: {
                                gridname: sourcegridname,                                
                            },                            
                            gridSelectionData: self.gridSelectionData,
                            file: fileInfo,
                            fileCompare: self.fileInfo[filenameCompare],
                        })
                        .then(
                        function (result) {
                            if (!result.length) {
                                return;
                            }

                            var documeId = result[0][0].DO_DOCUME_ID
                            var savepath = result[0][0].savepath
                            var filenamePdf = result[0][0].filenamePdf

                            
                            self.uploadFilePdf(savepath, pdf, filenamePdf)
                            },
                            function (err) {
                                console.log('Errore treeview asset: ' + err);
                            },
                        );


                }

                self.uploadFilePdf = function (savePath, pdf, filename) {
                    var blob = new Blob([pdf.output('blob')], {
                        type: "application/pdf"
                    }); 
                    
                    var config = {
                        method: "POST",
                        url: "/api/MAGIC_SAVEFILE/SaveApplication",
                        data: blob,
                        processData: false,
                        contentType: "application/octet-stream",
                        headers: {
                            "File-Name": filename,
                            responseType: "application/pdf",
                        },
                    };
                    $.ajax(config).then(function (result) {


                        var serverFileInfo = JSON.parse(result);
                        serverFileInfo[0].savePath = savePath || '';
                        serverFileInfo[0].adminAreaUpload = false || false;
                        var config = {
                            method: 'POST',
                            url: '/api/MAGIC_SAVEFILE/ManageUploadedFiles',
                            data: JSON.stringify({
                                filesToDelete: [],
                                filesToSave: [
                                    serverFileInfo[0],
                                ]
                            }),
                            contentType: 'application/json',
                        };
                        
                        return $.ajax(config).then(function (result) {
                            console.log(result);
                        })
                    })
                }

                self.printPage = function printPage(cadwebgl, page, pdf) {
                    const scale = 1
                    const pdfWidth = pdf.internal.pageSize.width * scale;
                    const pdfHeight = pdf.internal.pageSize.height * scale;
                    const bounds = cadwebgl.renderer.getBoundingBox(page.lines) //calculateBounds(line);
                    const width = (bounds.max.x - bounds.min.x * scale);
                    const height = (bounds.max.y - bounds.min.y * scale);
                    const scaleFactor = Math.min(pdfWidth / width, pdfHeight / height);
                    const translateX = (pdfWidth - (width * scaleFactor)) / 2 - (bounds.min.x * scale * scaleFactor);
                    const translateY = (pdfHeight - (height * scaleFactor)) / 2 - (bounds.min.y * scale * scaleFactor);

                    page.lines.forEach((el) => {
                        if (el.type.toUpperCase() == 'POLYLINE' || el.type.toUpperCase() == 'LINE') {

                            if (!page.ignoreColor) {
                                const color = el.element.material.color;
                                const r = Math.floor(color.r * 255);
                                const g = Math.floor(color.g * 255);
                                const b = Math.floor(color.b * 255);

                                if (r == 0 && g == 0 && b == 0) {
                                    pdf.setLineWidth(0.1);
                                    pdf.setDrawColor(r, g, b, 128);
                                } else {
                                    pdf.setLineWidth(1);
                                    pdf.setDrawColor(r, g, b);
                                }
                            }

                            const line = el.getVertices()
                            const start = {
                                x: (line[0].x * scale * scaleFactor) + translateX,
                                y: (line[0].y * scale * scaleFactor) + translateY
                            }

                            //pdf.moveTo(start.x, pdfHeight - start.y);

                            for (let i = 1; i < line.length; i++) {
                                const point = {
                                    x: (line[i].x * scale * scaleFactor) + translateX,
                                    y: (line[i].y * scale * scaleFactor) + translateY
                                }

                                pdf.line(start.x, pdfHeight - start.y, point.x, pdfHeight - point.y);

                                start.x = point.x;
                                start.y = point.y;
                            }
                        }
                    });
                }

                self.onShowTranparent = function onShowTranparent() {

                }

                self.onLoadComapare = function onLoadComapare() {
                    $timeout(function () {
                        doModal(false);
                        self.enableButtonCompare = false;
                    })
                }

                self.onClearCompare = function onClearCompare() {
                    self.showCompare = false;
                    self.fileCompare[self.fileInDetail.fileName] = {};
                }
 
                self.toolbarButtonConfig = {
                    showCompare: [
                        'btnTematismi',
                        'details___dwg',
                        'view_cad_block',
                        'view_cad_block2',
                        'insertCadBlock',
                        'blockSave',
                        'showActions',
                        'showInfoCad',
                        'btnEstrazioni',
                        'export___PDF1',
                        'export___LYT1',
                        'export___DWG',
                        'mapShowHideAsset',
                        'showMeasureMode'
                    ],
                    showMeasure: [
                        'btnTematismi',
                        'details___dwg',
                        'compare___dwg',
                        'view_cad_block',
                        'view_cad_block2',
                        'insertCadBlock',
                        'blockSave',
                        'showActions',
                        'showInfoCad',
                        'btnEstrazioni',
                        'export___PDF1',
                        'export___LYT1',
                        'export___DWG',
                        'mapShowHideAsset',
                        'showDrawingMode'
                    ],
                    showDrawing: [
                        'btnTematismi',
                        'details___dwg',
                        'compare___dwg',
                        'view_cad_block',
                        'view_cad_block2',
                        'insertCadBlock',
                        'blockSave',
                        'showActions',
                        'showInfoCad',
                        'btnEstrazioni',
                        'export___PDF1',
                        'export___LYT1',
                        'export___DWG',
                        'mapShowHideAsset',
                        'showMeasureMode'
                    ],
                }

                self.disableToolbarButton = function disableToolbarButton(name) {
                    var disabled = false;

                    if (self.showCompare) {
                        self.toolbarButtonConfig.showCompare.filter((el) => {
                            if (el.indexOf(name) == 0) {
                                disabled = true;
                            }
                        });
                    }


                    if (self.modalityMode == 'D' ) {
                        self.toolbarButtonConfig.showDrawing.filter((el) => {
                            if (el.indexOf(name) == 0) {
                                disabled = true;
                            }
                        });
                    }

                    if (self.modalityMode == 'M'  ) {
                        self.toolbarButtonConfig.showMeasure.filter((el) => {
                            if (el.indexOf(name) == 0) {
                                disabled = true;
                            }
                        });
                    }
 
                    return disabled;
                }
                 
                self.onAddPolyline = function onAddPolyline() {
                    self.onAddedPolyline = true;
                    
                   console.log("add polyline")
                }

                self.saveDxf = function saveDxf() {
                    console.log("saveDxf");
                }

            },
        ]).directive("ngMobileClick", [function () {
            return function (scope, elem, attrs) {
                elem.bind("touchstart", function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    scope.$apply(attrs["ngMobileClick"]);
                });
            }
        }]);
});