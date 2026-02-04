define([
    "angular",
    "MagicSDK",
    "angular-kendo",
    "angular-magic-form-sp",
    "angular-ui-bootstrap",
    "angular-dxf-viewer",
    "angular-magic-grid",
    "angular-easy-map",
    "tree-view-r3",
    "angular-filter",
    "reftree-action-menu",
    "angular-magic-grid-sp",

], function (angular, MF) {
    return angular
        .module("GridDwgViewer", [
            "ui.bootstrap",
            "kendo.directives",
            "dxfViewer",
            "magicGrid",
            "easyMap",
            "treeViewR3",
            "angular.filter",
            "reftreeActionMenu",
            "magicGridSp"
        ])
        .controller("GridDwgViewerController", [
            "config",
            "$timeout",
            "$scope",
            "$uibModal",
            "$sce",
            function (config, $timeout, $scope, $uibModal, $sce) {
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
                self.clearExternalBlocks = {};
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


                self.BlocksToCopy = {};
                self.scale = 1;
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
                self.selectedThema = [];
                self.showTreeThemati = true;
                self.objClathem = null;
                self.objThemati = null;
                self.initTree = true;
                self.storedForCad = {};
                self.activateActionDirective = false;
                self.initGridAction = false;
                self.layerSwitchOn = false;
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
                self.activateInitGridCadInfo = false;
                self.oGridInfoCadData = [];
                self.onCheckSplitter = true;
                self.viewerWidth = 50;
                self.showTreeData = false;
                self.groupThematiList = [];
                /*gestione magic telecomando*/
                self.showMagic = true;

                self.onShowGroupThemati = false;

                self.refresTreeChange = true;
                self.features = {
                    map: true,
                    sidebarAccordion: true,
                    closeButton: true,
                };

                config.onClose = function () {
                    $scope.$destroy();
                };

                try {

                    self.gridActionSingle = config.dwgCadInfo.actionDirectiverGrid ? config.dwgCadInfo.actionDirectiverGrid : "AS_US_VI_ROOM_ANAL_CAD";
                    self.activateActionDirective = config.dwgCadInfo.actionDirective ? true : false;
                    self.layerSwitchOn = config.dwgCadInfo.layerSwitchOn ? true : false;
                    self.layerContainer = config.dwgCadInfo.layerContainer ? config.dwgCadInfo.layerContainer : ["M7-SUPERFICI NETTE LOCALI"];
                    self.multiAction = config.dwgCadInfo.multiAction ? true : false;
                    config.multiAction = self.multiAction;
                    self.mainContentPreview = config.dwgCadInfo.mainContentPreview ? 'dwg_preview_r3' : 'dwg_preview_r3';
                    self.initGridNameExportThemati = config.dwgCadInfo.initGridNameExportThemati ? config.dwgCadInfo.initGridNameExportThemati : "AS_US_VI_THEMATI_XLSX";
                    self.initGridNameInfoCad = config.dwgCadInfo.initGridNameInfoCad ? config.dwgCadInfo.initGridNameInfoCad : "AS_US_VI_ROOM_ANAL_CAD_INFO";
                    self.enableAllLayers = config.dwgCadInfo.enableAllLayers ? config.dwgCadInfo.enableAllLayers : false;
                    self.enableDwgExport = config.dwgCadInfo.enableDwgExport ? config.dwgCadInfo.enableDwgExport : false;
                    self.showTreeAsset = config.dwgCadInfo.showTreeAsset ? config.dwgCadInfo.showTreeAsset : false;
                    config.actionTemplate =
                        '<div ng-repeat="father in rtmm.fatherAction" class="btn-group navbar-btn" style="margin:3px; z-index:1000;">\
                        <button type="button" style="border-top-left-radius: 8px;border-bottom-left-radius: 8px;" class="btn btn-success">{{father.name}}</button> \
                        <button type="button" style="border-top-right-radius: 8px;border-bottom-right-radius: 8px;" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">\
                        <span class="caret"></span>\
                        </button>\
                        <ul  id="mnav" class="dropdown-menu scrollable-menu-r3" role="menu">\
                        <li ng-repeat="action in rtmm.fatherAction[$index].action | orderBy:' + "'orderBy'" + '"><a ng-click="rtmm.dispatch(action)">{{action.label}}</a></li>\
                        </ul>\
                        </div>'
                }
                catch (e) {
                    console.log(e);
                    console.log("actionDirective non specificato prende di default false")
                }



                self.init = function init() {
                    $("#layout-condensed-toggle").click();
                    $(".page-title").hide();

                    self.getStoredForCad().then(function () {

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
                                    if (self.gridSelection.length > 1) {
                                        self.mainContent = 'map';
                                    }
                                }

                                if (self.gridSelectionData[0].HANDLE && self.gridSelectionData[0].FIlename) {
                                    //self.createInitialFilesFromGridSelection();
                                }
                            });
                    });
                };

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

                self.openHandles = function () {
                    window.open('http://dev.reftree.it/api/DWG/Viewer?q=tIlp9rJjQ3S3lkSooV7tePRrm6%2FKiBn%2BdjJQwojz6iZRudBRHecJ0aWGdlS8BEpX1L8ROBDoPrvaR4J30v%2B6seKvyKiv61Cn63RI4h43xGrTrhVtMu6Rl0RH5zszH0Zl1UzqxZ%2Brxd29TysxhlbiC8yJTtW9ayGeEpUGc5vs%2F3ZmrCScUZ9AWzi8DQxRx2WXka029s%2FHH%2BRGOi7oSc3RsVzzRdRg6oPirplhp9QnPFk%3D', '_blank');
                }

                $scope.$watch("gdv.initGridAction", function (newValue) {
                    if (!newValue) {
                        angular.element($("div[name='divAction']")).empty();
                    }
                });

                $scope.$watch("gdv.selectedTreeData._data", function (newTreeData) {
                    if (newTreeData !== undefined && newTreeData.length > 0) {
                        if (self.selectedThema) {
                            self.addNodeToMenu(self.selectedThema);
                        } else {
                            doModal(false);
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
                    self.selectedThema = e;

                    if (!self.selectedTreeExpandedItem || self.selectedTreeExpandedItem.ThematiId != e.ThematiId) {
                        if (self.activateActionDirective) {
                            self.onResetGridAction();
                        }

                        self.selectedTreeExpandedItem = null;
                        self.tematismiTreeCheckedNodes = {};
                        self.tematismiTreeOpenPaths = [];
                        $("#divtreeThemati").append($("#treeThemati"));
                        self.files = {};
                        self.refreshTree();

                    } else if (self.selectedTreeExpandedItem && self.selectedTreeExpandedItem.ThematiId == e.ThematiId) {
                        console.log("aperto")
                        if (!angular.element($('#dxf-tree-2-' + e.ClathemId + '-' + e.ThematiId)).hasClass('.in')) {
                            angular.element($('#dxf-tree-2-' + e.ClathemId + '-' + e.ThematiId)).collapse('show');
                        }
                    }
                }

                self.getThematiFirstList = function () {
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
                            })
                            .then(
                                function (result) {
                                    if (!result.length) {
                                        return;
                                    }
                                    self.groupThematiList = [];
                                    $.each(result[0], function (i, v) {
                                        self.groupThematiList.push(v);
                                    });
                                    $scope.$apply();
                                },
                                function (err) {
                                    console.log('Errore creazioen dwg: ' + err);
                                },
                            );

                        $timeout(function () {
                            if (!self.expandMenuThemati) {
                                if (self.refresTreeChange) {
                                    self.refreshTree();
                                }
                            }
                            self.refresTreeChange = true;
                        }, 1000)


                        $timeout(function () { self.onShowGroupThemati = true; }, 1000)


                        /*fine storeprocedure*/
                    }
                    catch (ex) {
                        console.log(ex);
                    }
                }

                self.onResizePanelBody = function onResizePanelBody() {
                    console.log('resize');
                }
                // set by first tree selection
                $scope.$watch("gdv.files", function (newFiles) {
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

                        if (!self.showViewerDetail) {
                            self.initGridInfoCadActivateAll();
                        }
                    }
                });

                // event handlers
                self.onActionWindowOpen = function (event) {
                    setTimeout(function () {
                        event.sender.element.closest('.k-window').css('z-index', 100);
                    });
                };

                self.triggerWindowResize = function triggerWindowResize() {
                    window.dispatchEvent(new Event('resize'));
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
                            config.multiAction = true;
                            e.sender.tbody.find('tr').addClass('k-state-selected');
                            if (config.onClickMultiAction) {
                                self.actionCallback();
                                doModal(false);
                                return
                            }
                        }

                        getAngularControllerElement("reftreeDirectiveController", config);
                        //$timeout(function () {
                        //    doModal(false);
                        //},500);
                    }
                    else {
                        self.onShowBtnDetail = false;
                        angular.element($("div[name='divAction']")).empty();
                        self.viewers[self.fileInDetail.fileName].viewer.viewer.controls.selectTools.deselectAll();
                        //doModal(false);
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
                    self.viewerRefresh();
                }

                self.onClickShowActionsSingle = function onClickShowActionsSingle() {

                    self.viewerSelection[self.eventClick.handle] = true;
                    if (self.eventClick.renderer.controls.selectTools.selected.length > 0) {
                        self.initGridActionSingle(self.eventClick.handle);
                    } else {
                        self.initGridActionSingle();
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

                    if (event.renderer.controls.selectTools.selected.length > 0) {
                        $.each(event.renderer.controls.selectTools.selected, function (i, v) {
                            self.viewerSelectionRefresh.push(v);
                        });
                    } else {
                        self.viewerSelectionRefresh = [];
                    }
                }

                self.initGridActionMulti = function initGridActionMultiOld() {
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
                            filters: [{ operator: 'eq', field: 'ID_PIANO', value: self.selectedFloor }, {
                                logic: "or",
                                filters: oHandle
                            }]
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
                    self.eventClick = event;
                    //doModal(true);
                    //aggiunto in data 30/10/2019
                    self.previousViewerSelection = $.extend({}, self.viewerSelection);

                    if (self.activateActionDirective) {
                        if (self.multiAction) {
                            self.onSelecDeselectHandle(event);
                            self.onClickShowActionsMulti();
                        } else {
                            self.onSelecDeselectHandle(event);
                            self.onClickShowActionsSingle();
                        }
                    }
                    self.initGridInfoCadActivate(event);
                };

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

                self.onDetailDragStart = function onDetailDragStart(cadViewerEvent) {
                    self.showBlockToSave = true;

                    self.externalBlocksToSave[cadViewerEvent.handle] = {
                        handle: cadViewerEvent.handle,
                        x: cadViewerEvent.element.position.x,
                        y: cadViewerEvent.element.position.y,
                        xref: cadViewerEvent.element.position.x - cadViewerEvent.renderer.dwg.canvas.extmin.x,
                        yref: (cadViewerEvent.element.position.y - cadViewerEvent.renderer.dwg.canvas.extmin.y) * -1,
                    }
                }

                self.onDetailDragEnd = function onDetailDragEnd(cadViewerEvent) {
                    var type_block = self.externalBlocks[self.fileInDetail.fileName].filter(function (block) {
                        if (block.blockName == cadViewerEvent.entity.name) {
                            return block
                        }
                    })[0].type_block;



                    if (!cadViewerEvent.container || self.layerContainer.filter(function (layer) {
                        return layer == cadViewerEvent.container.layer;
                    }).length == 0 || !self.checkContainerBlock(cadViewerEvent.container.handle, type_block)) {
                        cadViewerEvent.entity.setPosition(
                            self.externalBlocksToSave[cadViewerEvent.entity.handle].x,
                            self.externalBlocksToSave[cadViewerEvent.entity.handle].y, 0
                        );

                        return
                    }

                    self.clearSelectionViewer[self.fileShownInDetail] = false;

                    self.externalBlocksToSave[cadViewerEvent.entity.handle] = {
                        handle: cadViewerEvent.entity.handle,
                        handle_father: cadViewerEvent.container.handle,
                        x: cadViewerEvent.entity.element.position.x,
                        y: cadViewerEvent.entity.element.position.y,
                        xref: cadViewerEvent.entity.element.position.x - cadViewerEvent.entity.renderer.dwg.canvas.extmin.x,
                        yref: (cadViewerEvent.entity.element.position.y - cadViewerEvent.entity.renderer.dwg.canvas.extmin.y) * -1,
                    }

                }

                self.onDetailViewerSelected = function onDetailViewerSelected(event) {
                    self.viewerSelection[event.handle] = true;
                    self.clearSelectionViewer[self.fileShownInDetail] = false;

                    if (self.assetMode) {
                        self.externalBlocksToSave[event.handle] = {
                            handle: event.handle,
                            x: event.nativeElement.position.x - event.renderer.dwg.canvas.extmin.x,
                            y: (event.nativeElement.position.y - event.renderer.dwg.canvas.extmin.y) * -1,
                            xref: event.nativeElement.position.x - event.renderer.dwg.canvas.extmin.x,
                            yref: (event.nativeElement.position.y - event.renderer.dwg.canvas.extmin.y) * -1,
                            xscale: event.nativeElement.scale.x,
                            yscale: event.nativeElement.scale.y,
                        }
                    }
                    $timeout();
                };

                self.onDetailViewerDeselected = function onDetailViewerDeselected(event) {
                    delete self.viewerSelection[event.handle];
                    delete self.externalBlocksToSave[event.handle]
                    $timeout();
                };

                self.checkContainerBlock = function checkContainerBlock(handle, type_block) {
                    var ret = false;

                    $.each(self.fillPolilyneForAddBlocks[self.fileShownInDetail], function (i, v) {
                        if (v.handle == handle && v.type_block == type_block && v.allowInsert) {
                            ret = true;
                            return
                        }
                    });

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
                            viewer: viewer
                        }

                        self.setBlocksAndLayersAll(data, fileName);
                        self.resolveViewersIfReady();



                        if (self.selectedFiles.length == 1) {
                            console.log('un file solo');
                            self.setSelectedFiles(self.selectedFiles);
                        }

                    } else {
                        delete self.viewers[fileName];
                    }
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
                                VISIBLE: self.layerSwitchOn,
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
                                checked: false
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
                                $.each(result[0], function (i, v) {
                                    self.tooltipDescription.push(v);
                                });
                            },
                            function (err) {
                                console.log(err);
                            },
                        );

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


                    if (self.showViewerDetail || !(file.fileName in self.viewers)) {
                        return;
                    }


                    self.onResetGridInfoCad();


                    self.showViewersOverlay = true;

                    $timeout(function () {
                        self.fileShownInDetail = file.fileName;
                        self.fileInDetail = file;
                        self.selectedFloor = self.fileInfo[self.fileInDetail.fileName].id;
                        config.model = self.fileInfo[self.fileInDetail.fileName];

                        self.setSelectedFiles(self.selectedFiles, true);
                        self.showViewersOverlay = false;
                        self.setActiveBlocksAndLayersPerFileAll(file.fileName)
                        self.getClassForAsset();
                        self.onSetSplitterViewer();

                        if (self.activateActionDirective) {

                            self.initGridActionSingle();
                        }

                        self.initGridAction = true;
                        self.activateInitGridCadInfo = true;

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
                        self.getClassForAsset();

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
                    self.externalBlocks[self.fileInDetail.fileName] = {};
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
                    self.mainContent = 'map';
                    self.refreshTree();
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
                    self.shownMarkersLocationIds = $.map(self.gridSelection, function (value) {
                        value = config.grid.dataItem(value);
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
                                externalBlocks[block.DESCRIPTION] = block;
                            });


                            return self.blocksAndLayersFromDb = {
                                blocks: blocks,
                                layers: layers,
                                externalBlocks: externalBlocks
                            };
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


                    if (selectedFiles.length === 1) {
                        self.onSingleFileSelect(selectedFiles[0]);
                    }
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

                    for (key in self.blocksAndLayersAll[fileName].layers) {
                        var layer = self.blocksAndLayersAll[fileName].layers[key];
                        if (layer.checked) {
                            visibleLayer.push(layer);
                        }
                    }

                    return visibleLayer;
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

                self.getViewerContainerClass = function () {
                    if (self.showViewerDetail) {
                        return 'col-md-12';
                    } else {
                        var colVal = Math.floor(12 / self.selectedFiles.length);
                        colVal = colVal < 3 ? 3 : colVal > 6 ? 6 : colVal;
                        return 'col-md-' + colVal + ' ' + self.mainContentPreview;
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
                        en: "Selection floor",
                    },
                    selezionaTemi: {
                        it: "Seleziona temi",
                        en: "Selection thema",
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
                        it: "Seleziona penne",
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
                        en: "Stampa Architettonico"
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
                        it: "Includi tutti i layer",
                        en: "Include all layer",

                    },
                    blockIncludeAll: {
                        it: "Includi tutti i blocchi",
                        en: "Include all block",
                    }
                    ,
                    profiesPdf: {
                        it: "Profili",
                        en: "Profiles",
                    },
                    selezionaLayersStampa: {
                        it: "Layers stampa",
                        en: "Layers print",
                    }



                };

                self.getLabels = function (key) {
                    if (key in self.labels) {
                        return self.labels[key][window.culture.substring(0, 2)];
                    }
                    return getObjectText(key);
                };

                self.grid = config.grid;
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

                    if (self.showFilesGridData ||
                        self.showExtraction ||
                        self.showExtractionPdf
                    ) {
                        self.disableGridAndExtraction()
                    } else {
                        $(event.currentTarget)
                            .closest("#grid-dwg-controller")
                            .hide(1000);
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

                config.setFiles = function (grid) {
                    self.grid = grid;
                    self.files = self.getTematFromGrid();
                    self.reload = true; //force file reload when changing selection from grid
                    self.selectedTree.setDataSource(
                        new kendo.data.DataSource(self.TreesDs),
                    );
                    $timeout(); //wakes-up the "files" watcher of the directive (dwg-viewer)...
                };

                var sourceItemIds = $.map(self.grid.select(), function (v, i) {
                    return self.grid.dataItem(
                        v,
                    )[self.grid.dataSource.options.schema.model.id];
                });



                var sourceItemIdsPdf = sourceItemIds;

                var sourcegridname = self.grid.element.attr("gridname");

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

                    self.optionsExternalBlock = self.selectedTree.dataSource._data.filter(function (node) {
                        return node.ID == self.selectedTree.value()
                    })[0].RSN_THEMAT_FLAG_BLOCK

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

                                if (!data[0].drows.length) return [];

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
                                                    scale: fileInfo.scale,
                                                    LOCATION_ID: fileInfo.LOCATION_ID,
                                                    id: fileInfo.AS_ASSET_ID,
                                                    description: fileInfo.shortDesc
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

                    var blocks = {};
                    var externalBlocks = [];

                    $.each(tableBlocks, function (i, el) {
                        if (!blocks[el.fileName]) {
                            blocks[el.fileName] = {
                                "fileName": el.fileName,
                                "blockName": el.blockName,
                                "type_block": el.type_block,

                                options: []
                            };
                        }

                        self.clearExternalBlocks[self.fileShownInDetail] = false;

                        blocks[el.fileName].options.push({
                            "blockName": el.blockName,
                            "handle": el.handle,
                            "draggable": el.draggable ? el.draggable : false,
                            "selectable": el.selectable ? el.selectable : false,
                            "visible": el.visible ? el.visisle : false,
                            "external": el.external ? el.external : false,
                            "position": {
                                "x": el.x,
                                "y": el.y,
                                "xscale": el.xscale * el.indexScale,
                                "yscale": el.yscale * el.indexScale,
                                "rotation": el.rotation,
                                "indexScale": el.indexScale //da passare a Giliuo quando sarà possibile
                            },
                            "xZoomScale": el.xZoomScale,
                            "yZoomScale": el.yZoomScale,
                            "xScale": el.xscale * el.indexScale,
                            "yScale": el.yscale * el.indexScale,
                            "colorScaleStart": el.colorScaleStart,
                            "colorScaleEnd": el.colorScaleEnd,
                            "scaleDwg": el.scaleDwg,
                            "indexScale": el.indexScale

                        });
                    });

                    for (var k in blocks) {
                        externalBlocks.push(blocks[k]);
                    }
                    self.assetMode = true;
                    self.externalBlocks[self.fileInDetail.fileName] = externalBlocks;
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

                    if (self.activateActionDirective) {
                        self.onResetGridAction();
                    }
                    self.onResetGridInfoCad();


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

                self.getTematFromGrid = function () {
                    var jitems = self.grid.select();
                    var dataSource = self.grid.dataSource;
                    var readerInputs = {};
                    $.each(jitems, function (i, v) {
                        var rowdata = self.grid.dataItem(v);
                        self.getFileInfo(rowdata, readerInputs);
                    });

                    return readerInputs;
                };

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
                    var config = {
                        title: '<i aria-hidden="true"></i>',
                        wide: false,
                        backdrop: true,
                        modalId: 'treeModalMenu',
                        container: 'grid-dwg-controller',
                        class: 'dialogTree',
                        onClose: function () {
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

                self.paperOrientation = [{
                    code: "V",
                    text: "Verticale"
                },
                {
                    code: "H",
                    text: "Orizzontale"
                }
                ];

                self.optionsPdf = [{
                    value: "NC",
                    text: "Nascondi Campiture"
                },
                {
                    value: "stampa_logo",
                    text: "Stampa Logo"
                },
                {
                    value: "stampa_titolo",
                    text: "Stampa Titolo"
                },
                {
                    value: "excludeThemati",
                    text: "Escludi tematismi"
                },
                ];

                self.legendaPdf = [{
                    code: "V",
                    text: "Verticale"
                },
                {
                    code: "H",
                    text: "Orizzontale"
                }
                ];

                self.themasType = [{
                    code: "V",
                    text: "Verticale",
                    value: true
                },
                {
                    code: "O",
                    text: "Orizzontale",
                    value: false
                }
                ];

                self.multiPage = [{
                    id: true,
                    text: "Un tema per pagina"
                },
                {
                    id: false,
                    text: "Temi su Layer"
                }
                ];

                self.onChangeColor = function (e) {
                    //if (e.dataItem.checked) {
                    $('input[name="' + e.dataItem.ValueTemat + '"]').click();
                    $('input[name="' + e.dataItem.ValueTemat + '"]').click();
                    //}
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
                                        //themas
                                        //case 3:
                                        //    $.each(result[i], function(i, v) {
                                        //        self.allObject.push(v);                                              
                                        //    });
                                        //    break;
                                        ////DWG
                                        //case 4:
                                        //    //floors
                                        //    $.each(result[i], function(i, v) { 
                                        //        self.floors.push({id:v.AS_ASSET_ID, text:v.AS_ASSET_DESCRIZIONE,value:true});
                                        //    });
                                        //    break;


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

                self.viewerRefresh = function (refreshNodes) {
                    if (refreshNodes) {
                        self.selectedThema = null;
                        self.selectedTreeExpandedItem = null;
                        self.tematismiTreeCheckedNodes = {};
                        self.tematismiTreeOpenPaths = [];
                        self.viewerSelectionRefresh = {};
                        self.refresTreeChange = false;
                        self.getThematiFirstList();


                        self.initGridInfoCadActivate("");
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
                }

                //gestione pl_asset

                self.onSaveChanges = function (e) {
                    if (e.type != "read") {
                        self.renderBlocks[self.fileShownInDetail] = [self.currentBlock];
                        self.polileneContainer.fillColor("#ffffff");
                        self.selectedClassForAsset = {};
                        self.toolTipDesc(self.fileInDetail);
                        self.getClassForAsset()
                    }
                    //else {
                    //    self.onBindGridBlock(e);
                    //}
                }

                self.getOpenHandleForBlocks = function getOpenHandleForBlocks(e) {

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

                            self.fillPolilyneForAddBlocks[self.fileShownInDetail] = val;



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

                self.onAddBlock = function onAddBlockNew(e) {

                    if (self.onCheckHandle(self.onAddedBlock, e.entity.handle).length == 0) {
                        self.selectedClassForAsset = {};
                        kendoConsole.log("Azione non consentita", true);
                        return;
                    }

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
                                            "blockName": optionsBlock.fileName,
                                            "handle": self.requestData.handleBlock ? self.requestData.handleBlock : newHandle,
                                            "draggable": true,
                                            "selectable": true,
                                            "visible": true,
                                            "external": true,
                                            "position": {
                                                "x": e.point.x,
                                                "y": e.point.y,
                                                "xscale": optionsBlock.scale * optionsBlock.indexScale,
                                                "yscale": optionsBlock.scale * optionsBlock.indexScale,
                                                "rotation": 0,
                                                "xScaleRef": optionsBlock.scale,
                                                "yScaleRef": optionsBlock.scale,
                                            }
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

                    for (handle in self.externalBlocksToSave) {
                        if (handle != "") {
                            blockToSave.push(self.externalBlocksToSave[handle])
                        }
                    }
                    config.MF.api
                        .get({
                            storedProcedureName: self.storedForCad['DWG_SaveExternalBlock'] ? self.storedForCad['DWG_SaveExternalBlock'] : "core.DWG_SaveExternalBlock",
                            data: {
                                handles: blockToSave,
                            },
                        })
                        .then(
                            function (result) {
                                self.toolTipDesc(self.fileInDetail);
                                kendoConsole.log(self.getLabels('saveOk'), false);
                                self.clearSelectionViewer[self.fileShownInDetail] = true;
                                self.externalBlocksToSave = {};
                            },
                            function (err) {
                                console.log(err);
                                kendoConsole.log(self.getLabels('saveKO'), true);
                            },
                        );
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
                    $.each(self.fillPolilyneForAddBlocks[self.fileShownInDetail], function (i, select) {
                        select.color = select.colorStart
                        select.allowInsert = select.allowInsertStart
                    });
                }

                self.setVisibleInsertBlock = function setVisibleInsertBlock(e) {
                    self.onAddedBlock = null;
                    self.onResetOpenHandleBlock();
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

                    self.externalBlocks[self.fileInDetail.fileName] = [{
                        "fileName": e.fileNameComplete,
                        "blockName": e.blockName,
                        "type_block": e.typeBlock,
                        options: [{
                            blockName: e.fileName
                        }]
                    }];

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
                        self.viewerRefresh();
                        self.onTreeChange('blocks');
                    }

                    self.viewInsertBlock = !self.viewInsertBlock;
                    self.selectedClassForAsset = {};

                    self.loadingTree = false;
                    doModal(false);
                }

                self.getActionForBlock = function getActionForBlock() {
                    self.activeAction = [];

                    return MF.api.get({
                        storedProcedureName: self.storedForCad['usp_ev_get_action_constraint_cad'] ? self.storedForCad['usp_ev_get_action_constraint_cad'] : "core.usp_ev_get_action_constraint_cad",
                        data: self.requestData
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


                            if (!bAction) {
                                self.polileneContainer.fillColor("#ffffff");
                                self.selectedClassForAsset = {};
                                kendoConsole.log('Azione non consentita', true);


                                return false
                            }
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

                self.addFisicalBlock = function (e) {
                    console.log(e);
                }

                self.setSelectTreeDataValue = function setSelectTreeDataValue(e) {
                    //self.showTreeThemati = false;

                    if (e.ID != self.selectedTree.value()) {
                        self.files = {};
                        self.viewInsertBlock = false;
                        $("#divtreeThemati").append($("#treeThemati"));

                        self.selectedTree.value(e.ID);
                    }
                }

                self.setTreeExpandedItemNew = function (e, toggle) {
                    self.selectedThema = e;



                    //if (!self.selectedTreeExpandedItem || self.selectedTreeExpandedItem.ThematiId != e.ThematiId) {
                    //    if (self.activateActionDirective) {
                    //        self.onResetGridAction();
                    //    }

                    //    self.selectedTreeExpandedItem = null;
                    //    self.tematismiTreeCheckedNodes = {};
                    //    self.tematismiTreeOpenPaths = [];
                    //    $("#divtreeThemati").append($("#treeThemati"));
                    //    self.files = {};
                    //    self.refreshTree();

                    //}


                    //$timeout(function () {
                    //    if (!!e.$$hashKey) {
                    //        self.objThemati = $("#dxf-tree-2-" + e.ClathemId + "-" + e.ThematiId);
                    //        self.selectedTreeExpandedItem = self.selectedTreeData._data.filter(function (node) {
                    //            return node.ThematiId == e.ThematiId
                    //        })[0];

                    //        if (!!self.selectedTreeExpandedItem) {
                    //            $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").closest('ul').children().hide()
                    //            $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").show()
                    //            if (!$("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").attr("aria-expanded")) {
                    //                $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").find('span:first').click();
                    //            }
                    //            $("li[data-uid='" + self.selectedTreeExpandedItem.uid + "']").first('.k-plus').click()
                    //            $("#contain_" + self.selectedTreeExpandedItem.ClathemId + "_" + e.ThematiId).append($("#treeThemati"));
                    //            if (!self.objThemati.is(":visible")) {
                    //                self.objThemati.addClass('panel-collapse in');
                    //            }
                    //        }
                    //    }
                    //}, 3000)


                };

                self.onMouseOverBlock = function onMouseOverBlock(e) {
                    if (self.assetMode && e.dataItem.dwg_theme && e.dataItem.dwg_theme != "") {
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

                                        if (!!extblock) {
                                            extblock.setColor(vv.colorScaleStart);
                                        }
                                    }
                                });
                            });
                        });
                    }
                }

                self.onMouseLeaveBlock = function onMouseOverBlock(e) {
                    if (self.assetMode && e.dataItem.dwg_theme && e.dataItem.dwg_theme != "") {
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

                                        if (!!extblock) {
                                            extblock.setColor(vv.colorScaleEnd);
                                        }
                                    }
                                });
                            });
                        });
                    }
                }

                self.getTreeThemas = function getTreeThemas() {
                    MF.api.get({
                        storedProcedureName: self.storedForCad['DWG_GetTreeContent'] ? self.storedForCad['DWG_GetTreeContent'] : "core.DWG_GetTreeContent",
                        gridData: {
                            gridname: sourcegridname,
                            id: sourceItemIds,
                            idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
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
                    }).then(
                        function (data) {
                            if (data.length > 1 && self.selectedFiles.length === 0 && !self.showViewerDetail) {
                                var allFiles = [];

                                $.each(data[1], function (i, fileInfo) {
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
                                            scale: fileInfo.scale,
                                            LOCATION_ID: fileInfo.LOCATION_ID,
                                            id: fileInfo.AS_ASSET_ID,
                                            description: fileInfo.shortDesc
                                        };
                                    } catch (e) {
                                        console.error(e);
                                    }
                                });




                                self.filesGridData = new kendo.data.DataSource({
                                    data: data[1],
                                });


                                self.setSelectedFiles(allFiles);

                                self.newThemasForTree = data[0];
                            }

                        },
                        function (err) {
                            console.log(err);
                            return;
                        }
                    );
                }

                //gestione pl_asset fine


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
                            $scope.ProfileUser = '';
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

                            $scope.xmlExtractPdf = {
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
                                defaultProfile: "Unige",
                                excludeThemati: false,
                                Architettonico: false,
                                id: 0
                            };

                            $scope.setProfile = function (ProfileUser) {
                                var oScopeXmlExtractPdf = $scope.xmlExtractPdf;
                                var oProfiles = $scope.gdv.ProfilesUser.filter(function (item) {
                                    return item.value === ProfileUser;
                                })[0];

                                $.each(oProfiles, function (item, v) {
                                    if (item != 'value' && item != 'text') {
                                        try {
                                            oScopeXmlExtractPdf[item] = v;
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
                                    windowClass: 'themati-window', // windowClass - additional CSS class(es) to be added to a modal window template
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
                                        $scope.showProfiles = false;
                                        


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
                                            $.each(node.children, function (i, child) {
                                                child.checked = node.checked;
                                            });

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
                                $("#pdfEstratto").attr("href", $scope.pdfHref);
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
                                            layerToConside[file] =  $scope.blocksAndLayersAllPdf[file].layers 
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
                                        $.each(blockToConside[file], function (i, v) {
                                            if (v.checked) {
                                                block.push({
                                                    fileName: file,
                                                    name: v.name
                                                })
                                            }
                                        })
                                        //if ($scope.includeAllLayer) {
                                        //    $.each(self.blocksAndLayersAll[file].layers, function (i, v) {
                                        //        if (v.name != "") {
                                        //            layer.push({
                                        //                fileName: file,
                                        //                name: v.name
                                        //            });
                                        //        }
                                        //    });
                                        //}
                                        //else {
                                        //    $.each(layerToConside[file], function (i, v) {
                                        //        if (v.checked) {
                                        //            layer.push({
                                        //                fileName: file,
                                        //                name: v.name
                                        //            })
                                        //        }
                                        //    })
                                        //}
                                    }

                                    return block;

                                    //var block = [];
                                    //for (file in self.fileActiveBlocks) {

                                    //    if ($scope.includeAllBlock) {
                                    //        $.each(self.blocksAndLayersAll[file].blocks, function (i, v) {
                                    //            if (v.name != "") {
                                    //                block.push({
                                    //                    fileName: file,
                                    //                    name: v.name
                                    //                })
                                    //            }

                                    //        });
                                    //    }
                                    //    else {
                                    //        for (key in self.fileActiveBlocks[file]) {
                                    //            if (self.fileActiveBlocks[file][key].checked) {
                                    //                block.push({
                                    //                    fileName: file,
                                    //                    name: self.fileActiveBlocks[file][key].name
                                    //                })
                                    //            }
                                    //        }
                                    //    }
                                    //}

                                    //return block;
                                }




                                config.MF.api
                                    .get({
                                        storedProcedureName: self.storedForCad['DWG_Export_PDF'] ? self.storedForCad['DWG_Export_PDF'] : "core.DWG_Export_PDF",
                                        data: {
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
                                        },
                                    })
                                    .then(
                                        function (result) {
                                            if (!result.length) {
                                                self.showDetail = false;
                                                return;
                                            }


                                            $.each(result[0], function (i, v) {
                                                if (v.status == "OK") {
                                                    $scope.pdfHref = v.response;
                                                    $scope.pdfShow = true;
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
                                                            <label>{{gdv.getLabels("Blocchi e layer")}}</label>\
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

                                            angular.forEach($scope.$parent.blocksAndLayersAllPdf[fileName].blocks   , function (item) {
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
                            $scope.gdv = self;
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

                            $scope.getProfileDgw = function getProfileDwg() {
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

                            $scope.getProfileDgw();

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
                                                        $scope.dwgHref = v.response;
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
                self.oFilterAssetTree = $.map(self.grid.select(), function (v, i) {
                    return self.grid.dataItem(
                        v,
                    )[self.grid.dataSource.options.schema.model.id];
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
                                //selectedFiles: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,
                                //selectedFilesStart: self.showViewerDetail && self.fileInDetail ? [self.fileInDetail] : undefined,
                                //treeFilter: self.filterHandler(),
                                //viewBlockThemati: self.showViewerDetail && self.fileInDetail ? 1 : 0,
                                //idFloor: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].id : undefined,
                                //guid_handle: self.showViewerDetail && self.fileInDetail ? self.fileInfo[self.fileInDetail.fileName].guid_handle : undefined,
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
                        }
                        else {
                            doModal(false);
                            kendoConsole.log("Nessun record selezionato.", true);
                            config.model = {}
                            self.initGridExportThemati = false
                        }
                    }, 500)
                }



                self.onDataBoundGridExportThemati = function (e) {
                    if (e.sender.dataSource.data().length > 0) {
                        e.sender.saveAsExcel();

                        $timeout(function () {

                            kendoConsole.log("Elaborazione effettuata attendere il file.", false);

                            doModal(false);
                        }, 2000)

                    }
                }

                /************************************************
                 * Gestione dell info tramite griglia
                 *************************************************
                 */

                self.onResetGridInfoCad = function onResetGridInfoCad() {
                    //self.activateInitGridCadInfo = false;

                    self.initGridInfoCadFilterStart = {
                        logic: 'or',
                        filters: [
                            {
                                operator: 'eq',
                                field: 'HANDLE',
                                value: '0',
                            }
                        ]
                    }

                    self.onSetFilterGridInfoCad(self.initFilterGridInfoCad);
                    //self.activateInitGridCadInfo = true;

                }

                self.initGridInfoCadFilterStart = {
                    logic: 'or',
                    filters: [
                        {
                            operator: 'eq',
                            field: 'HANDLE',
                            value: '0',
                        }
                    ]
                }

                self.initGridInfoCad = function initGridInfoCad(handle) {

                    self.initFilterGridInfoCad = {
                        logic: 'or',
                        filters: [
                            {
                                operator: 'eq',
                                field: 'HANDLE',
                                value: handle,
                            }
                        ]
                    }
                    self.onSetFilterGridInfoCad(self.initFilterGridInfoCad);
                }

                self.onSetFilterGridInfoCad = function onSetFilterGridInfoCad(filter) {
                    var oGrid = $('div[gridname="' + self.initGridNameInfoCad + '"]');

                    if (oGrid.length > 0 && !!oGrid.data('kendoGrid')) {
                        oGrid.data('kendoGrid').dataSource.filter(filter);

                    }
                }

                self.initGridInfoCadActivate = function initGridInfoCadActivate(e) {
                    self.activateInitGridCadInfo = true;
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
                    self.activateInitGridCadInfo = true;

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




                    self.onSetFilterGridInfoCad(self.initFilterGridInfoCad);
                }

                self.onDataBoundGridInfoCad = function onDataBoundGridInfoCad(e) {
                    e.sender.element.find('.k-grid-toolbar').hide();
                    self.oGridInfoCadData = e.sender.dataSource.data();

                    if (e.sender.dataSource.data().length > 0) {
                        //self.activateInitGridCadInfo = true;


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

                self.onExportExcelAllAsset = function () {
                    var oGrid = $('div[gridname="' + self.initGridNameInfoCad + '"]');

                    if (oGrid.length > 0) {
                        if (oGrid.data('kendoGrid').dataSource._data.length > 0) {
                            oGrid.find('span[id="XlsExport"]').click();
                            kendoConsole.log("Elaborazione effettuata attendere il file.", false);

                        }
                        else {

                            kendoConsole.log("Nessun record selezionato.", true);
                        }






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
                        logic: 'or',
                        filters: [
                            {
                                operator: 'eq',
                                field: 'HANDLE',
                                value: handle,
                            }
                        ]
                    }

                    //self.initGridAction = true;

                    self.onSetFilterGridAction(self.initFilterGrid);
                }

                /************************************************
                 * Gestione della griglia delle azioni fine
                 *************************************************/

                self.onSetSplitterViewer = function () {
                    if (self.onCheckSplitter) {
                        if (self.showViewerDetail) {
                            $("#vertical").find('.k-splitbar-vertical').show();
                            $("#vertical").find('.k-collapse-next').click();
                        } else {
                            if ($("#vertical").find('.k-collapse-next').length > 0) {
                                $("#vertical").find('.k-collapse-next').click();
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
                    self.setActiveBlocksAndLayersPerFileAll(self.fileInDetail.fileName);
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


                self.init();

            },
        ])
        .directive('elemReady', function ($parse) {
            return {
                restrict: 'A',
                link: function ($scope, elem, attrs) {
                    elem.ready(function () {
                        var func = $parse(attrs.elemReady);
                        func($scope);

                    });
                }
            }
        })
    //.directive('class', function () {
    //    return {
    //        link: function (scope, element, attrs) {
    //            attrs.$observe("class", function (value) {
    //                console.log(value);
    //            });
    //        }
    //    };

    //});
});