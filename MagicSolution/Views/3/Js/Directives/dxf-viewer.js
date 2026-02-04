define(["angular", "MagicSDK", "r3", "zip", "lodash"], function (angular, MF, r3, zip, _) {
    angular
        .module("dxfViewer", [])
        .directive("dxfViewer",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        onSetViewer: "=",
                        onSetData: "=",
                        onShowTooltip: "=",
                        data: "=",
                        fileName: "=",
                        fillPolylines: "=",
                        activeLayers: "=",
                        activeBlocks: "=",
                        externalBlocks: "=",
                        events: "=",
                        mode: "@",
                        settings: "=",
                        fileInfo: "=",
                        pathFileCad: "=",
                        onShowInfo: "=",
                        createBlocks: "=",
                        clearSelection: "=",
                        onClearExternalBlocks: "=",
                        assetMode: "=",
                        onAddNewBlock: "=",
                        onSetBlocksScale: "=",
                        onRenderBlocks: "=",
                        onGetClosePolilyne: "=",
                        onAddNewBlockNew: "=",
                        onInsertBlock: "=",
                        onClickDeselect: "=",
                        onCheckTotal: "=",
                        multiAction: "=",
                        onSelectAllHandle: "=",
                        selectedBlock: "=",
                        onShowTextBlock: "=",
                        activeLayout: "=",
                        measureMode: "=",
                        scale: "=",
                        layerImportOrder: "=",
                        useCompression: "=",
                        comparableEntities:"=",
                        fileCompare: "=",
                        onLoadCompare: "=",
                        modality: "=",
                        scaleDrawing: "=",
                        onAddPolyline: "=",
                        optionsPolyline: "=",
                    },
                    templateUrl: window.includesVersion + '/Views/3/Templates/dxfViewer.html',
                    //template: '\
                    //        <div id="Normal" ng-show="!d.isLoading" style="padding: 4px;height:5%; position:relative;" class="toolbar-container">\
                    //            <button  title="{{d.getLabel(\'center\')}}" ng-if="d.mode === \'webgl\'" type="button" class="btn btn-default" ng-click="d.center()">\
                    //                <i class="fa fa-dot-circle-o" aria-hidden="true"></i>\
                    //            </button>\
                    //            <button\
                    //                    title="{{d.getLabel(\'showInfo\')}}"\
                    //                    ng-if="d.mode === \'webgl\' && d.settings.showCursorInfo"\
                    //                    type="button"\
                    //                    ng-class="d.showCursorInfo ?  \'btn btn-success draggable\' : \'btn btn-default draggable\'"\
                    //                    ng-click="d.hideInfoView()"\
                    //                >\
                    //                <i class="fa fa-info-circle" aria-hidden="true"></i>\
                    //            </button>\
                    //            <button  title="{{d.getLabel(\'addScale\')}}" ng-if="d.assetMode && d.showActionSingle && d.mode === \'webgl\'" type="button" class="btn btn-default" ng-click="d.onchangeScale(true)">\
                    //                <i class="fa fa-plus" aria-hidden="true"></i>\
                    //            </button>\
                    //            <button  title="{{d.getLabel(\'removeScale\')}}" ng-if="d.assetMode && d.showActionSingle && d.mode === \'webgl\'" type="button" class="btn btn-default" ng-click="d.onchangeScale(false)">\
                    //                <i class="fa fa-minus" aria-hidden="true"></i>\
                    //            </button>\
                    //            <button  title="{{d.getLabel(\'ruota\')}}" ng-if="d.assetMode && d.showActionSingle && d.mode === \'webgl\'" type="button" class="btn btn-default" ng-click="d.onChangeRotate(true)">\
                    //                <i class="fa fa-arrow-circle-left" aria-hidden="true"></i>\
                    //            </button>\
                    //            <button  title="{{d.getLabel(\'ruota\')}}" ng-if="d.assetMode && d.showActionSingle && d.mode === \'webgl\'" type="button" class="btn btn-default" ng-click="d.onChangeRotate(false)">\
                    //                <i class="fa fa-arrow-circle-right" aria-hidden="true"></i>\
                    //            </button>\
                    //            <button  title="{{d.getLabel(\'selectAll\')}}" ng-if="d.mode === \'webgl\' && !d.assetMode && d.fillPolylines.length > 0 && !d.measureMode" type="button" class="btn btn-default" ng-click="d.onSelectAll()">\
                    //                <i class="fa fa-check" aria-hidden="true"></i>\
                    //            </button>\
                    //            <button title="{{d.getLabel(\'deleteLine\')}}" ng-if="d.mode === \'webgl\' && !d.assetMode && d.measureMode" type="button" class="btn btn-danger" ng-click="d.onClearLineMeasure()">\
                    //                <i class="fa fa-trash" aria-hidden="true"></i>\
                    //            </button>\
                    //            <div ng-if="d.showActionSingle" name="divAction" style="margin-left:15px;" class="btn-group"></div>\
                    //            <input ng-if="d.mode === \'webgl\' && !d.assetMode && d.measureMode" ng-value="d.scale" ng-model="d.scale" class="pull-right" style="width:70px; display:flex"; text-align:right;">\
                    //        </div>\
                    //        <div id="dwg_{{d.idFile}}"\
                    //            class= "dxf-viewer-container"\
                    //            ng-show="!d.isLoading"\
                    //            style="width: 100%; height: 100%;"\
                    //            ng-mousemove="d.onMouseMoveOverViewer($event)"\
                    //        >\
                    //        </div>\
                    //        <!--<div ng-if="d.isLoading" style="margin: 2em 0em">' + mediumSpinnerHTML + '</div>-->\
                    //        <div\
                    //            ng-if="true && d.mode === \'webgl\' && d.showCursorInfo"\
                    //            ng-show="d.showPopover"\
                    //            ng-class="d.getPopoverClass()"\
                    //            style="{{ d.getPopoverStyle() }}"\
                    //        >\
                    //            <h3 class="popover-title" style="display: none;"></h3>\
                    //            <div id="popoveTooltip"  class="popover-content" style="overflow-y: auto;" ng-bind-html="d.mouseOverDetailDescription"></div>\
                    //        </div>\
                    //            <div ng-show="false" class="dwg-tooltip-r3" ng-bind-html="d.infoHanlde"></div>\
                    //        </div>',
                                                   //<div  class="popover-content" style="overflow-y: auto;">{{d.mouseOverDetailDescription}}</div>\
                    //<div  class="dwg-tooltip-r3" ng-if="!d.isLoading && d.settings.showCursorInfo && d.mode === \'webgl\' && d.showCursorInfo" ng-bind-html="d.mouseOverDetailDescription">\
                    controllerAs: "d",
                    controller: [
                        '$scope',
                        '$element',
                        '$timeout',
                        '$sce',
                        function ($scope, $element, $timeout, $sce) {
                            var self = this;

                            self.parentController = $scope.$parent.$parent.$parent.$parent.rgv;
                            self.request = null;
                            self.useCompression = self.useCompression === undefined ? true : self.useCompression;
                            self.isLoading = true;
                            self.mode = self.mode || "svg";
                            self.settings = $.extend({
                                showCursorInfo: true,
                            }, self.settings || {});

                            self.lang = window.culture.substr(0, 2);
                            self.showCursorInfo = true;
                            self.mouseCoords = {};
                            self.popoverCoords = {};
                            self.showPopover = false;
                            self.dwgFileLayer = {};
                            self.renderedBlocks = {};
                            self.shouldUpdateBlocks = false;
                            self.shouldUpdateLayers = false;
                            self.shouldUpdateExternalBlocks = false;
                            self.shouldUpdateFillPolylines = false;
                            self.scale = 1;
                            self.shouldInsertBlock = true;
                            self.externalBlockincluded = [];
                            self.shwoTooltip = true;
                            self.showActionSingle = false;
                            self.bSelectAll = false;
                            self.externalBlockText = [];
                            self.bMeasure;
                            self.bCompare = false;
                           
                            var cadviewer;

                            $scope.$watch('d.comparableEntities', function (newOne, oldOne) {
                                if (Array.isArray(newOne)) {
                                    if (!Array.isArray(oldOne) || (Array.isArray(oldOne) && (newOne.length != oldOne.length))) {
                                        self.setComparableEntities(newOne);
                                    }
                                }                                
                            });

                            $scope.$watch('d.showDimension', function (newOne, oldOne) {
                                self.onShowDimension(newOne);
                            });
                            
                            $scope.$watch('d.fileCompare', function (newOne, oldOne) {
                                self.onClearCompare();

                                if (!jQuery.isEmptyObject(newOne) && newOne != "") {
                                    self.loadDxfsCompareIntoViewer();
                                }                                
                            });

                            $scope.$watch('d.onInsertBlock', function (newOne, oldOne) {
                                self.loadInsertBlock(newOne);
                            });

                            $scope.$watch('d.fileName', function (newOne, oldOne) {
                                self.loadDxfsIntoViewer();
                            });

                            $scope.$watch('d.onRenderBlocks', function (newOne, oldOne) {
                                self.renderBlocks(newOne);
                            });
                           
                            $scope.$watch('d.onGetClosePolilyne', function (newOne, oldOne) {
                                self.getClosePolilyne(newOne);
                            });

                            $scope.$watch('d.modality', function (newOne) {
                                newOne ? newOne : 'V';

                                if (self.mode == 'webgl') {
                                    if (self.viewer && self.viewer.renderer) {
                                        self.viewer.renderer.scaleDwg = self.scale ? self.scale : 1;
                                        self.viewer.renderer.setMode(newOne);

                                        window.addEventListener('keyup', function (event) {
                                            self.viewer.renderer.controls.selectTools.onkeyup(event);
                                            self.viewer.renderer.controls.dragtools.onkeyupDrag(event);
                                        })
                                    }
                                }
                            });


                            $scope.$watch('d.measureMode', function (newOne) {
                                if (self.mode == 'webgl') {
                                    if (self.viewer && self.viewer.renderer) {
                                        self.viewer.renderer.scaleDwg = self.scale ? self.scale : 1;

                                        //self.viewer.renderer.setMeasureMode();

                                        self.viewer.renderer.measure ? self.viewer.renderer.setMode('V') : self.viewer.renderer.setMode('M');
                                        window.addEventListener('keyup', function (event) {
                                            self.viewer.renderer.controls.selectTools.onkeyup(event);
                                            self.viewer.renderer.controls.dragtools.onkeyupDrag(event);
                                        }) 
                                        //window.addEventListener('keyup', self.onKeyUp.bind(null, self.viewer));
                                        //window.addEventListener('keyup', function (event) {

                                            //self.viewer.renderer.controls.selectTools.onkeyup(event);
                                        //})
                                    }
                                }
                            });

                            self.onKeyUp = function (viewer) {
                                viewer.renderer.controls.selectTools.onkeyup(event);
                                viewer.renderer.controls.dragtools.onkeyup(event);
                            }

                            $scope.$watch('d.scale', function (newOne) {
                                if (self.mode == 'webgl') {
                                    if (self.viewer && self.viewer.renderer) {
                                        self.viewer.renderer.scaleDwg = self.scale ? self.scale : 1;
                                    }
                                }
                            });


                            $scope.$watch('d.scaleDrawing', function (newOne) {
                                if (self.mode == 'webgl') {
                                    if (self.viewer && self.viewer.renderer) {
                                        self.viewer.scaleDrawingDwg(self.scaleDrawing ? self.scaleDrawing : 1);
                                    }
                                }
                            });

                            $scope.$watch('d.fillPolylines', function (newOne, oldOne) {                               
                                if (Array.isArray(newOne)) {

                                    if (self.assetMode) {
                                        self.shouldUpdateExternalBlocks = true;
                                        self.shouldUpdateBlocks = true;
                                    } else {
                                        self.shouldUpdateFillPolylines = true;
                                    }
                                    self.update();
                                }   
                            });

                            $scope.$watch('d.layerImportOrder', function (newOne, oldOne) {
                                if (Array.isArray(newOne)) {
                                    self.layerImportOrder = newOne;
                                }
                            });

                            $scope.$watch('d.activeLayers', function (newOne, oldOne) {
                                if (Array.isArray(newOne)) {
                                    if (!Array.isArray(oldOne) || (Array.isArray(oldOne) && (newOne.length != oldOne.length))) {
                                        self.shouldUpdateLayers = true;
                                        self.shouldUpdateBlocks = true;
                                        //self.activateLayers();
                                        self.update();
                                    }
                                }
                            });

                            $scope.$watch('d.onExportDxf', function (newOne, oldOne) {
                                //console.log('onExportDxf')
                            });
                             
                            $scope.$watch('d.activeBlocks', function (newOne, oldOne) {
                                if (Array.isArray(newOne)) {
                                    if (!Array.isArray(oldOne) || (Array.isArray(oldOne) && (newOne.length != oldOne.length))) {
                                        self.shouldUpdateBlocks = true;
                                        //self.activateBlocks();
                                        self.update();
                                    }
                                }
                            });
                            
                            $scope.$watch('d.externalBlocks', function (newOne, oldOne) {
                                self.loadExternalBlocks(newOne, oldOne);
                            });

                            $scope.$watch('d.createBlocks', function (newOne, oldOne) {
                                self.createBlocks(newOne, oldOne);
                            });

                            $scope.$watch('d.events', function (newOne, oldOne) {
                                self.updateEvents(newOne, oldOne);
                            });

                            $scope.$watch('d.clearSelection', function (newOne, oldOne) {
                                if (newOne) {
                                    self.onClearSelection();
                                }
                            });

                            $scope.$watch('d.onClearExternalBlocks', function (newOne, oldOne) {
                                if (newOne) {
                                    self.clearExternalBlocks();
                                }
                            });

                            $scope.$watch('d.mode', function (newOne, oldOne) {
                                if (oldOne) {
                                    self.isLoading = true;
                                    self.loadDataIntoViewer()
                                        .then(function () {
                                           
                                            self.select();
                                            self.activateLayers();
                                            self.activateBlocks();
                                            self.updateEvents(self.events);
                                        });
                                }
                            });

                            $scope.$on('$destroy', function () {
                                self.renderedBlocks = {};
                                self.destroyViewer();
                                self.setData(null);
                            });

                            self.triggerWindowResize = function triggerWindowResize() {
                                window.dispatchEvent(new Event('resize'));                                
                            };

                            self.onClearLineMeasure = function () {
                                self.viewer.renderer.removeCSS2DObjectAll();
                            }

                            self.update = function () {                            
                                if (self.shouldUpdateLayers) {
                                    var o = self.getVisibleExternalBlock();
                                    self.activateLayers();
                                    self.shouldUpdateLayers = false;
                                }

                                if (self.shouldUpdateExternalBlocks) {
                                    self.select();
                                    self.shouldUpdateExternalBlocks = false;
                                    self.showActionSingle = false; 
                                }

                                if (self.shouldUpdateBlocks) {
                                    self.shouldUpdateBlocks = false;
                                    self.activateBlocks();
                                    
                                }

                                if (self.shouldUpdateFillPolylines) {
                                    self.shouldUpdateFillPolylines = false;
                                    self.select();
                                }
                            }

                            self.getVisibleExternalBlock = function () {
                                return self.fillPolylines.filter(function (node) {
                                    return node.isBlock;
                                }).map(function (node) {
                                    return node.handles
                                    }).reduce(function (prev, current) {
                                        return prev.concat(current);
                                    },[]);
                            }

                            //self.onDeselectAll

                            self.onClearSelection = function onClearSelection() {
                                if (cadviewer.renderer.controls) {
                                    cadviewer.renderer.controls.selectTools.deselectAll();
                                }
                            }

                            self.onDeselectAll = function () {
                                if (cadviewer.renderer.controls) {
                                    cadviewer.renderer.controls.selectTools.deselectAll();
                                }
                            }

                            self.clearExternalBlocks = function() {
                                if (cadviewer) {
                                    var blockToClear = [];

                                    self.removeInsertBlock(null, false);

                                    $.each(self.externalBlocks, function (i, blocks) {
                                        $.each(blocks.options, function (ii, blocco) {
                                              blockToClear.push(blocco);
                                        })
                                    })

                                    var blocksName = $.map(blockToClear, function (block) { return block.blockName }).filter(function (item, pos) {
                                        return $.map(blockToClear, function (block) {
                                            return block.blockName
                                        }).indexOf(item) == pos;
                                    });

                                    cadviewer.removeBlocks(blocksName, cadviewer);
                                     
                                    self.renderedBlocks = {};
                                    self.externalBlocksAdded = {};

                                    cadviewer.clearAllPolylines();
                                }
                            }
                             
                            self.myRemoveElement = function myRemoveElement(t, cadviewer) {
                                //console.log(cadviewer.renderer.stack.length);
                                var handleToDelete = cadviewer.renderer.stack.filter(e => "insert" === e.type && -1 !== t.indexOf(e.name)).map(t => t.handle);
                                var blockTodelete = cadviewer.renderer.stack.filter(e => -1 !== handleToDelete.indexOf(e.handle));

                                if (blockTodelete.length > 0) {
                                    $.each(blockTodelete, function (i, element) {
                                        cadviewer.renderer.scene.remove(element.nativeElement);                                 
                                        //console.log(cadviewer.renderer.stack.length);
                                    })
                                    cadviewer.renderer.update();
                                }
                            }

                            self.hideInfoView = function hideInfoView() {
                                self.showCursorInfo = !self.showCursorInfo;
                                self.onShowHideRenderText() 
                                window.dispatchEvent(new Event('resize'));
                            }

                            self.onMouseMoveOverViewer = function onMouseMoveOverViewer(event) {
                                if (self.mode === 'svg') {
                                    return;
                                }

                                self.popoverCoords = self.mouseCoords = {
                                    offsetX: event.offsetX,
                                    offsetY: event.offsetY,
                                };
                                $timeout();
                            };

                            self.getPopoverClass = function getPopoverClass() {
                                return "popover fade left in dwgTooltipR3";
                            };

                            self.getPopoverStyle = function getPopoverStyle() {
                                return 'top: 55px; display: block;';
                                //return 'top: ' + (self.popoverCoords.offsetY + 80) + 'px; left: ' + self.popoverCoords.offsetX + 'px; display: block;';
                                //return 'top: ' + '20' + 'px; left: ' + '100' + '%; display: block;';
                            };

                            var lastCall = 0;

                            self.onClickHandle = function onClickHandle(cadViewerEvent) {                                
                                self.infoHanlde = "";
                                self.actionType = "sng" 

                                

                                if (self.onClickDeselect) {
                                    if (self.multiAction) {
                                        if (cadviewer.renderer.controls.selectTools.selected.length > 1) {
                                            self.actionType = "mlt"
                                            self.showActionSingle = true;
                                        }
                                        if (cadviewer.renderer.controls.selectTools.selected.length == 1) {

                                            self.showActionSingle = true;
                                            return
                                        }
                                        else {
                                            return
                                        }
                                    }

                                    if (self.actionType == "sng") {
                                        if (cadviewer.renderer.controls) {
                                            var handleToDeselect = [];

                                            $.each(cadviewer.renderer.controls.selectTools.selected, function (i, v) {
                                                if (v.handle != cadViewerEvent.handle) {
                                                    handleToDeselect.push(v);
                                                }
                                            })

                                            $.each(handleToDeselect, function (i, v) {
                                                cadviewer.renderer.controls.selectTools.deselect(v);
                                            })

                                            if (cadviewer.renderer.controls.selectTools.selected.length > 0) {
                                                self.showActionSingle = true;
                                                var content = self.getDescriptionFromViewerEvent(cadViewerEvent);
                                                if (content && content.then) {
                                                    var call = ++lastCall;
                                                    content
                                                        .then(function (content) {
                                                            if (content && call === lastCall) {
                                                                self.infoHanlde = $sce.trustAsHtml(content);
                                                                self.shwoTooltip = false;
                                                                //self.mouseOverDetailDescription = content;
                                                                $timeout();
                                                            }
                                                        });
                                                }
                                                else {
                                                    self.infoHanlde = $sce.trustAsHtml(content);
                                                    self.shwoTooltip = false;
                                                    //self.mouseOverDetailDescription = content;   
                                                    $timeout();
                                                }
                                            }
                                            else {
                                                self.shwoTooltip = true;
                                                self.showActionSingle = false;
                                            }
                                        }
                                    }
                                    else {
                                        if (cadviewer.renderer.controls.selectTools.selected.length > 0) {
                                            self.showActionSingle = true;
                                        }
                                    }                                    
                                }
                            }
                           
                            self.onCadviewerMouseEnter = function onCadviewerMouseEnter(cadViewerEvent, obj) {
                                $("#popoveTooltip").css.top = '0' + 'px';
                                $("#popoveTooltip").css.left = (window.event.clientX + 20) + 'px';

                                self.setCursorCanvas("pointer");
                                self.showPopover = true;

                                var content = self.getDescriptionFromViewerEvent(cadViewerEvent);
                                if (content && content.then) {
                                    var call = ++lastCall;
                                    content
                                        .then(function (content) {
                                            if (content && call === lastCall) {
                                                self.mouseOverDetailDescription = $sce.trustAsHtml(content);
                                                //self.mouseOverDetailDescription = content;
                                                $timeout();
                                            }
                                        });
                                }
                                else {
                                    self.mouseOverDetailDescription = $sce.trustAsHtml(content);    
                                    //self.mouseOverDetailDescription = content;   
                                    $timeout();
                                }
                                // self.popoverCoords = self.mouseCoords;
                            };

                            self.onCadviewerMouseLeave = function onCadviewerMouseLeave(cadViewerEvent) {
                                self.showPopover = false;
                                self.mouseOverDetailDescription = "";
                                self.setCursorCanvas("auto");
                                $timeout();
                            };

                            var tooltipResults = [];
                            self.findTooltipInfo = function (handle) {
                                for (var i = 0; i < tooltipResults.length; i++) {
                                    if (tooltipResults[i].handle === handle) {
                                        return tooltipResults[i].tooltip;
                                    }
                                }
                            };

                            self.getDescriptionFromViewerEvent = function getDescriptionFromViewerEvent(event) {
                                if (self.onShowTooltip) {
                                    return self.onShowTooltip(event, self.fileName);
                                }
                                var info = self.findTooltipInfo(event.handle);
                                if (info !== undefined) {
                                    return info;
                                }
                                return $.getJSON('/api/DWG/Tooltip', { handle: event.handle, fileName: self.fileName.replace(/.zip$/, '.dwg') })
                                    .then(function (result) {
                                        if (result && result.length) {
                                            tooltipResults = tooltipResults.concat(result);
                                            return self.findTooltipInfo(event.handle);
                                        }
                                    });
                                //var area = event.area >= 0 ? event.area : -event.area;
                                //var scale = self.fileInfo ? self.fileInfo.scale : 100;
                                //return 'handle: ' + event.handle
                                //    + ' - layer: ' + event.layer
                                //    + ' - area: ' + (Math.round(area / scale * 100) / 100);
                            };

                            self.updateEvents = function updateEvents(newObject, oldObject) {
                                $.when(self.request)
                                    .then(function () {
                                        newObject = newObject || {};
                                        oldObject = oldObject || {};
                                        $.each(_.difference(_.keys(newObject), _.keys(oldObject)), function (i, eventName) {
                                            cadviewer.on(eventName, newObject[eventName]);
                                        });
                                        $.each(_.difference(_.keys(oldObject), _.keys(newObject)), function (i, eventName) {
                                            cadviewer.removeListener(eventName, oldObject[eventName]);
                                        });
                                    });
                            };

                            self.destroyViewer = function destroyViewer() {
                                if (cadviewer) {
                                    cadviewer.destroy();
                                    self.setViewer(null);
                                    self.renderedBlocks = {};
                                }
                            };

                            self.center = function center() {
                                if (cadviewer) {
                                    cadviewer.centerView();
                                }
                            };

                            self.onSelectAll = function onSelectAll() {                                 
                                var selected = [];

                                self.bSelectAll = cadviewer.renderer.controls.selectTools.selected.length == 0 ? true : false;
                                //self.bSelectAll = !self.bSelectAll;
                                if (cadviewer) {
                                    cadviewer.renderer.controls.selectTools.deselectAll();
                                    self.showActionSingle = false;

                                    if (self.bSelectAll) {
                                        $.each(self.fillPolylines, function (i, v) {
                                            $.each(v.handles, function (ii, vv) {
                                                cadviewer.renderer._stack.filter(function (ele) {
                                                    if (ele.handle == vv) {
                                                        cadviewer.renderer.controls.selectTools.select(ele);
                                                        selected.push(ele);
                                                    }
                                                })
                                            })
                                        })   
                                    }

                                    try {
                                        $timeout(function () {
                                            self.onSelectAllHandle();
                                            self.onClickHandle();
                                        }, 500)
                                    } catch (ex) {
                                        console.log('Funzione seleziona tutti non abilitata');
                                        console.log(ex);
                                    }
                                }
                            }



                            self.activateLayers = function activateLayers() {
                                if (!Array.isArray(self.activeLayers)) {
                                    return;
                                }
                                $.when(self.request)
                                    .then(function () { 
                                        var allObject = self.getVisibleExternalBlock();

                                        if (self.activeLayers.length === 0) {
                                            //cadviewer.setVisibleLayers(allObject.concat($.map(self.data.layers, function (layer) { return layer.name })));
                                            cadviewer.setVisibleLayers([]);
                                        }
                                        else {

                                            cadviewer.setVisibleLayers(allObject.concat($.map(self.activeLayers, function (layer) { return layer.name })));
                                        }
                                    });
                            };

                            self.activateBlocks = function activateBlocks() {
                                if (!Array.isArray(self.activeBlocks)) {
                                    return;
                                }
                                $.when(self.request)
                                    .then(function () {
                                        if (self.activeBlocks.length === 0) {
                                            cadviewer.setVisibleBlocks([]);
                                            //cadviewer.setVisibleBlocks($.map(self.data.blocks, function (block) { return block.name }));
                                        }
                                        else {

                                            var oblock = cadviewer.renderer.stack.filter(function (e) {
                                                return "insert" === e.type && !1 === e.external
                                            });

                                            oblock.map(function (block) {
                                                if (-1 !== $.map(self.activeBlocks, function (block) { return block.name }).indexOf(block.name)) {
                                                    if (- 1 !== $.map(self.activeLayers, function (layer) { return layer.name }).indexOf(block._layer)) {
                                                        block.show();
                                                        
                                                    } else {
                                                        block.hide();

                                                    }
                                                    
                                                    
                                                }
                                                else {
                                                    block.hide();
                                                }
                                            })

                                            //cadviewer.setVisibleBlocks($.map(self.activeBlocks, function (block) { return block.name }));


                                        }
                                    });
                            };

                            self.select = function select() {
                                if (!Array.isArray(self.fillPolylines)) {
                                    return;
                                }
                                if (!!self.onCheckTotal) {
                                    self.onCheckTotal(self.fillPolylines);
                                }
                                

                                $.when(self.request)
                                    .then(function () {
                                        if (self.assetMode) {

                                            var allExternalBlocks = [];
                                            var blockToRenderer = [];
                                            var externalBlock = self.fillPolylines.filter(function (block) {
                                                return block.isBlock === true;
                                            });

                                            $.each(externalBlock, function (i, selection) {
                                                $.each(selection.handles, function (z, handleSelect) {
                                                    $.each(self.externalBlocks, function (x, block) {
                                                        $.each(block.options, function (y, option) {
                                                            if (option.handle == handleSelect) {
                                                                if (!self.renderedBlocks[option.handle]) {
                                                                    self.renderedBlocks[option.handle] = {
                                                                        renderer: false,
                                                                        block: option
                                                                    };
                                                                }
                                                            }
                                                        });
                                                    });

                                                    allExternalBlocks.push({ name: handleSelect, color: selection.color });
                                                });
                                            });

                                            for (blockToAdd in self.renderedBlocks) {
                                                if (!self.renderedBlocks[blockToAdd].renderer) {
                                                    self.renderedBlocks[blockToAdd].renderer = true;
                                                    blockToRenderer.push(self.renderedBlocks[blockToAdd].block);
                                                }
                                            }


                                            if (blockToRenderer.length > 0) {
                                                cadviewer.renderBlocks(blockToRenderer);
                                            }


                                            $.each(self.externalBlockincluded, function (k, include) {
                                                allExternalBlocks.push(include);
                                            });

                                            cadviewer.externalBlocks = [];

                                             
                                            var oblock = cadviewer.renderer.stack.filter(function (e) {
                                                return "insert" === e.type && 1 === e.external
                                            });

                                            oblock.map(function (block) {
                                                if (-1 !== $.map(allExternalBlocks, function (layer) { return layer.name }).indexOf(block._handle)) {
                                                    if (!block.element.visible) {
                                                        block.show();
                                                    }
                                                    cadviewer.externalBlocks.push(block);
                                                }
                                                else {
                                                    block.hide();
                                                }
                                            })
                                        }

                                        cadviewer.clearAllPolylines();

                                        var externalPolyLine = self.fillPolylines.filter(function (block) {
                                            return block.isBlock != true || block.isBlock === undefined;
                                        });

                                        self.externalBlockText = [];
                                        
                                        $.each(externalPolyLine, function (i, selection) {
                                            cadviewer.fillPolylinesWithColor(selection.handles, selection.color);
                                            self.externalBlockText = self.externalBlockText.concat(selection.handles)
                                        });
                                    });
                            }

                            self.selectOld = function selectOld() {
                                if (!Array.isArray(self.fillPolylines)) {
                                    return;
                                }
                                $.when(self.request)
                                    .then(function () {
                                        if (self.assetMode) {
                                            //cadviewer.clearAllPolylines();                                            
                                            var allExternalBlocks = [];
                                            var blockToRenderer = [];

                                            $.each(self.fillPolylines, function (i, selection) {
                                                $.each(selection.handles, function (i, handleSelect) {                                                   
                                                    $.each(self.externalBlocks, function (i, block) {
                                                        $.each(block.options, function (ii, option) {
                                                            if (option.handle == handleSelect) {
                                                                if (!self.renderedBlocks[option.handle]) {
                                                                    self.renderedBlocks[option.handle] = {
                                                                        renderer: false,
                                                                        block: option
                                                                    };
                                                                }
                                                            }
                                                        });
                                                    });

                                                    allExternalBlocks.push({ name: handleSelect });
                                                });
                                            });

                                            

                                            for (blockToAdd in self.renderedBlocks) {
                                                if (!self.renderedBlocks[blockToAdd].renderer) {
                                                    self.renderedBlocks[blockToAdd].renderer = true;
                                                        blockToRenderer.push(self.renderedBlocks[blockToAdd].block);
                                                    }
                                            }

                                            if (blockToRenderer.length > 0) {
                                                cadviewer.renderBlocks(blockToRenderer);
                                            }
                                            
                                            $.each(self.externalBlockincluded, function (k, include) {
                                                allExternalBlocks.push(include);
                                            }); 


                                           

                                            //allExternalBlocks.map(function (layer) {
                                            //    cadviewer.renderer.stack.filter(function (e) {
                                            //        return e.layer == layer.name
                                            //    }).map(
                                            //        function (final) {
                                            //            final.show()
                                            //        })
                                            //});

                                          


                                            var oblock = cadviewer.renderer.stack.filter(function (e) {
                                                return "insert" === e.type && 1 === e.external
                                            });

                                            oblock.map(function (block) {
                                                -1 !== $.map(allExternalBlocks, function (layer) { return layer.name }).indexOf(block._handle) ? block.show() : block.hide();
                                            })   
                                            
                                             
                                        }
                                        else {
                                            cadviewer.clearAllPolylines();

                                            $.each(self.fillPolylines, function (i, selection) {
                                                cadviewer.fillPolylinesWithColor(selection.handles, selection.color);
                                            });
                                        }
                                    });
                            };

                            self.renderBlocksSingle = function (t) {
                                var renderer = cadviewer.renderer;
                                var ii = [];

                                t.map(function (n) {
                                    var i = [];
                                    var r = {
                                        name: n.blockName,
                                        ownerHandle: "1F",
                                        handle: String(n.handle),
                                        layer: String(n.handle),
                                        type: "INSERT",
                                        position: {
                                            x: 0,
                                            y: 0,
                                            z: 0
                                        }
                                    }
                                    i = renderer.createElements([r], n.position);

                                    i[0].external = n.external;
                                    i[0].draggable = n.draggable;
                                    i[0].selectable = n.selectable;
                                    i[0].type_block = n.type_block;
                                     
                                    if (!1 === n.visible) {
                                        i[0].hide();
                                    }
                                    renderer._stack = renderer._stack.concat(i)
                                    renderer.addToScene(i[0]);
                                })

                                
                            }

                            self.getPolilyneExt = function getPolilyneExt(token) {
                                try {
                                    MF.api
                                        .get({
                                            storedProcedureName: "core.DWG_Get_Polilyne_external",
                                            token: token
                                        })
                                        .then(
                                            function (result) {
                                                
                                                $.each(JSON.parse(result[0][0].RSN_FILPOL_POLILYNE), function (i, selection) {
                                                    cadviewer.fillPolylinesWithColor(selection.handles, selection.color);
                                                });
                                            },
                                            function (err) {
                                                console.log('Errore creazioen dwg: ' + err);
                                            },
                                        );
                                }
                                catch (ex) {
                                    console.log(ex);
                                }
                            }

                            self.setViewer = function setViewer(viewer) {
                                if (self.onSetViewer) {
                                    self.onSetViewer(viewer, self.fileName);
                                }

                                self.viewer = cadviewer = viewer;
                                

                                self.showPopover = false;
                                if (viewer && self.mode === 'webgl') {
                                    cadviewer.on('entity:mouseenter', self.onCadviewerMouseEnter);
                                    cadviewer.on('entity:mouseleave', self.onCadviewerMouseLeave);
                                    cadviewer.on('entity:deselect', self.onBlockIncludedDeselect); 
                                    cadviewer.on('entity:dragstart', self.onBlockDragStart); 
                                    cadviewer.on('entity:dragend', self.onBlockDragEnd);
                                    cadviewer.on('entity:click', self.onClickHandle);
                                   
                                    
                                }
                            };

                            self.initViewer = function initViewer() {
                                var viewer = new r3.CadViewer($element.find('.dxf-viewer-container')[0], self.mode);
                                self.setViewer(viewer);
                                if (self.viewer.setLayerImportOrder) {
                                    self.viewer.setLayerImportOrder(self.layerImportOrder ? self.layerImportOrder : [] );
                                }
                                
                            };

                            self.loadDataIntoViewer = function loadDataIntoViewer() {
                                var defer = $.Deferred();
                                if (!self.data) {
                                    defer.reject();
                                    return defer.promise();
                                }
                                $timeout(function () {
                                    self.isLoading = false;
                                    self.triggerWindowResize();
                                });
                                $timeout(function () {
                                    self.destroyViewer();
                                    self.initViewer();
                                    cadviewer.load(self.data).render();
                                    defer.resolve();
                                });
                                return defer.promise();
                            };

                            self.loadDxfsIntoViewer = function setFiles() {
                                var fileName = self.fileName;

                                if (!fileName)
                                    return;

                                self.idFile = fileName.toUpperCase().replace('.DXF', '').replace('.DWG', '').replace("(", "").replace(")", "");
                                self.isLoading = true;
                                self.request = self.getDxf(fileName, self.useCompression)
                                    .then(function (dxf) {                                      
                                        self.setData(new r3.DxfLoader(dxf));
                                         
                                        return self.loadDataIntoViewer();
                                    });
                            };
                             
                            self.setData = function setData(data) {
                                self.data = data;

                                if (self.onSetData) {
                                    self.onSetData(data, self.fileName,self); 
                                }
                            };

                            

                            self.unzip = function unzip(data) {
                                var promise = $.Deferred();
                                zip.createReader(
                                    new zip.BlobReader(data)
                                    , function (reader) {
                                        reader.getEntries(function (entries) {
                                            if (entries.length) {
                                                entries[0].getData(new zip.TextWriter(), function (text) {
                                                    promise.resolve(text);
                                                    reader.close(function () {
                                                    });
                                                }, function (current, total) {
                                                });
                                            }
                                        });
                                    }
                                    , function (error) {
                                        console.error(error);
                                        promise.reject(error);
                                    }
                                );
                                return promise.promise();
                            };

                            self.getElementInfo = function (handle) {
                                return cadviewer.renderer.stak
                            }

                            self.externalBlocksAdded = {};

                            self.loadExternalBlocks = function (externalBlocks) {
                                if (!externalBlocks) {
                                    return
                                }

                                doModal(true);

                                var promises = $.map(externalBlocks, function (block) {
                                    if (block.fileName in self.externalBlocksAdded) {
                                        return;
                                    }
                                    
                                    self.externalBlocksAdded[block.fileName] = true;
                                    return self.getDxf(block.fileName, block.useCompression ? block.useCompression : self.useCompression);
                                });
                                $.when.apply($, promises)
                                    .then(function () {
                                        var dxfs = $.makeArray(arguments);
                                        
                                        return new Promise(resolve => {
                                            $.each(dxfs, function (i, dxf) {
                                                var blocks = new r3.DxfLoader(dxfs[i]);
                                                //da modificare sul viewer di Giulio 2021/02/25
                                                cadviewer.add(blocks);
                                                //$.each(blocks.blocks, function (i, v) {
                                                //    if (cadviewer.renderer.dwg.blocks.indexOf(v.name) == -1) {
                                                //        cadviewer.renderer.dwg.blocks = cadviewer.renderer.dwg.blocks.concat(v)
                                                //    }
                                                //})
                                            });
                                            doModal(false);
                                            resolve();
                                        });

                                        //var dxfs = $.makeArray(arguments);
                                        //var positions = [];

                                        //$.each(dxfs, function (i, dxf) {
                                        //    //vecchia modalità di chiamata
                                        //    //var blocks = new r3.DxfLoader(dxfs[i], externalBlocks[i].options);
                                        //    var blocks = new r3.DxfLoader(dxfs[i]);
                                        //    //positions = externalBlocks[i].options;
                                        //    cadviewer.add(blocks);
                                        //    //caricare le posizioni dei blocchi
                                        //});
                                        //cadviewer.renderBlocks(positions);
                                    });
                            };

                            self.createBlocks = function createBlocks(positions) {
                                if (!positions) {
                                    cadviewer.renderBlocks(positions);
                                }
                            }

                            self.getDxf = function getDxf(fileName, useCompression) {
                                if (useCompression) {
                                    fileName = fileName.toLowerCase().replace(/\.dwg$/, '.zip');
                                }
                                return $.ajax({
                                    url: (self.pathFileCad || window.refDXFFileURI || 'http://ref2space.idearespa.com/dxfunige/') + encodeURIComponent(fileName),
                                    cache: false,
                                    xhr: function () {
                                        var xhr = new XMLHttpRequest();
                                        xhr.responseType = 'blob'
                                        return xhr;
                                    }
                                }).then(function (res) {

                                    var promise = $.Deferred();

                                    if (res && res.size) {
                                        if (useCompression) {
                                            return self.unzip(res);
                                        }
                                        else {
                                             res.text().then(function (result) {
                                                promise.resolve(result);
                                            });                                            
                                        }
                                    }
                                    else {
                                        console.error('error on loading', fileName);
                                        promise.reject();
                                    }
                                    return promise.promise();
                                });
                            };

                            self.onchangeScale = function (add) {
                                if (!!self.selectedBlock) {

                                    $.each(self.externalBlocks, function (i, v) {
                                        if (v.blockName == self.selectedBlock.name) {
                                          
                                            var x = v.options[0].xScale / 100.00 * 10
                                            var y = v.options[0].yScale / 100.00 * 10
                                            if (add) {
                                                cadviewer.applyTransform(self.selectedBlock.handle, { "xscale": self.selectedBlock.element.scale.x + x, "yscale": self.selectedBlock.element.scale.y + y, "zscale": 1 });
                                            } else {
                                                cadviewer.applyTransform(self.selectedBlock.handle, { "xscale": self.selectedBlock.element.scale.x - x, "yscale": self.selectedBlock.element.scale.y - y, "zscale": 1 });
                                            }
                                        }
                                    });
                                }
                              
                            }

                            self.onChangeRotate = function (add) {
                                if (!!self.selectedBlock) {
                                    var x = self.selectedBlock.element.scale.x;
                                    var y = self.selectedBlock.element.scale.y;
                                    var z = self.selectedBlock.element.rotation._z

                                    $.each(self.externalBlocks, function (i, v) {

                                        if (v.blockName == self.selectedBlock.name) {
                                            $.each(v.options, function (ii, vv) {
                                                if (vv.handle == self.selectedBlock._handle) {
                                                    if (add) {
                                                        vv.position.rotation = vv.position.rotation + 10
                                                    } else {
                                                        vv.position.rotation = vv.position.rotation - 10
                                                    }
                                                    if (vv.position.rotation > 360) {
                                                        vv.position.rotation = 10
                                                    }
                                                    if (vv.position.rotation < -360) {
                                                        vv.position.rotation = -10
                                                    }

                                                    if (vv.position.rotation == 0) {
                                                        self.selectedBlock.nativeElement.rotation.z = 0;
                                                        cadviewer.applyTransform(self.selectedBlock.handle, { "xscale": x, "yscale": y, "zscale": 1, "rotation": vv.position.rotation });
                                                    }
                                                    else {
                                                        cadviewer.applyTransform(self.selectedBlock.handle, { "xscale": x, "yscale": y, "zscale": 1, "rotation": vv.position.rotation });
                                                    }
                                                }
                                            })
                                            
                                        }
                                    });                                    
                                }
                            }

                            self.onBlockDragStart = function (e) {                               
                                self.removeInsertBlock(null, false);

                                if (self.externalBlocks) {
                                    var block = self.externalBlocks.filter(function (block) {
                                        if (block.blockName == e.name) {
                                            return block
                                        }
                                    })[0];

                                    if (block) {
                                        self.showClosedPolyline({
                                            blockName: e.name,
                                            container: null,
                                            type_block: block.type_block
                                        });
                                    }                                    
                                }                                
                            }

                            self.onBlockDragEnd = function () {
                                self.shouldUpdateExternalBlocks = true;
                                self.shouldUpdateBlocks = true;
                                
                                self.update();
                            }
                            
                            self.onBlockIncludedDeselect = function (cadevent) {
                                if (self.assetMode && cadevent.type == 'insert') {

                                    $.each(self.externalBlockincluded, function (i, v) {
                                        if (v.name == cadevent.handle) {
                                            var block = cadviewer.renderer.stack.filter(function (object) {
                                                return object.handle == cadevent.handle;
                                            })

                                            block.length ? block.setColor("#66ff00") : null;
                                        }
                                    });
                                }

                                //gestione multi azione tipo polyline e non ci sono record selezionati allora elimino le multi action
                                if (self.actionType == "mlt" && cadevent.type == 'polyline' && cadviewer.renderer.controls.selectTools.selected.length == 0) {
                                    self.showActionSingle = false;
                                }

                                     
                            }

                            self.renderBlocks = function renderBlocks(blocks) {
                                if (cadviewer) { 
                                    try {
                                        cadviewer.renderBlocks(blocks);

                                        $.each(blocks, function (i, block) {
                                            self.externalBlockincluded.push({
                                                "name": block.handle
                                            });
                                            cadviewer.renderer.stack.filter(function (object) {
                                                return object.handle == block.handle;
                                            })[0].setColor("#66ff00");

                                        });
                                    }
                                    catch(e) {
                                        console.log(e);
                                    }
                                }                             
                            }

                            self.loadInsertBlock = function (e) {
                                if (cadviewer && !!e) {
                                    if (e.fileName != undefined) {
                                        self.removeInsertBlock(null, false);
                                        self.shouldInsertBlock = true;
                                        self.setCursorCanvas("crosshair");

                                        if (self.shouldInsertBlock) {
                                            cadviewer.on("viewer:click", self.insertblock);
                                            //self.showClosedPolyline(e);
                                            self.showClosedPolyline({
                                                blockName: e.blockName,
                                                container: e.container,
                                                type_block: e.typeBlock
                                            });
                                        }
                                    } 
                                }
                            };

                            self.insertblock = function insertblock(e) {
                                self.removeInsertBlock(e,true); 
                            }

                            self.removeInsertBlock = function (e, add) {
                                self.setCursorCanvas("auto");
                                self.shouldInsertBlock = false;
                                cadviewer.removeListener("viewer:click", self.insertblock)

                                //self.shouldUpdateExternalBlocks = true;
                                //self.shouldUpdateBlocks = true;
                                //self.update();


                                if (add) {
                                    self.onAddNewBlock(e);
                                    cadviewer.clearAllPolylines();
                                }
                            }

                            self.setCursorCanvas = function setCursorCanvas(mode) {
                                //$("#dwg_" + self.idFile).find('canvas').css('cursor', mode);
                                //$("#dwg_".concat(self.idFile)).find('canvas').css('cursor', mode);
                                $(document.getElementById("dwg_" + self.idFile)).find('canvas').css('cursor', mode);
                            }

                            self.showClosedPolyline = function (e) {                               
                                cadviewer.clearAllPolylines();
                                
                                var close = self.closedPolilyne.close.handle.filter(function (pol) { return pol.type_block == e.type_block && pol.type_block == e.type_block }).map(function (pol) { return pol.handle })
                                var open = self.closedPolilyne.open.handle.filter(function (pol) { return pol.type_block == e.type_block && pol.type_block == e.type_block }).map(function (pol) { return pol.handle })

                                cadviewer.fillPolylinesWithColor(close, self.closedPolilyne.close.color);
                                cadviewer.fillPolylinesWithColor(open, self.closedPolilyne.open.color);


                                //cadviewer.fillPolylinesWithColor(self.closedPolilyne.map(function (pol) { return pol.handle }), "#FF0000");
                                
                                //if (!!self.closedPolilyne) {
                                //    var arr = self.closedPolilyne
                                //    for (var j = 0; j < arr.length; j++) {
                                //        if (arr[j].blockName == e.blockName && arr[j].type_block == e.type_block) {
                                //            cadviewer.fillPolylinesWithColor([arr[j].handle], arr[j].color);
                                //        }
                                //    }

                                //    //self.closedPolilyne.filter(function (ee) { return (ee.blockName == e.blockName && ee.type_block == e.type_block) }).map(function (obj) {
                                //    //    cadviewer.fillPolylinesWithColor([obj.handle], obj.color);
                                //    //})
                                //}  
                                

                            }

                            self.getClosePolilyne = function (Poliline) {
                                if (cadviewer) {
                                    self.closedPolilyne = Poliline;
                                }
                            }

                            self.getLabel = function (name) {
                                return self.labels[self.lang][name];
                            }

                            self.visibleRenderText = false;

                            self.onClearRenderText = function onClearRenderText() {
                                cadviewer.renderer.stack.map(function (text) {
                                    if (text.externalText) {
                                        return text.hide();
                                    }
                                })
                            }

                            self.onShowHideRenderText = function onShowHideRenderText() {
                                cadviewer.renderer.stack.map(function (text) {
                                    if (text.externalText) {
                                        return self.showCursorInfo ? text.show() : text.hide()

                                    }
                                })
                            }

                            self.renderText = function renderText(handles, visible) {
                                self.onClearRenderText();
                                if (cadviewer) {

                                    if (cadviewer.renderer.scene) {
                                        var handleToAdd = [];

                                        $.each(self.externalBlockText, function (i, v) {
                                            var oRenderText = cadviewer.renderer.stack.filter(function (text) { if (text._handle == v + "_TEXT") { return text } });
                                            if (oRenderText.length > 0) {
                                                oRenderText[0].show()
                                            } else {

                                                var handleParent = cadviewer.renderer.stack.filter(function (text) { if (text._handle == v) { return text } });
                                                self.onAddRenderText(handleParent, handleParent[0]._handle, handleParent[0]._handle, handleToAdd)          
                                            }
                                        })
                                        if (handleToAdd.length > 0) {

                                            cadviewer.renderer.addToRender(handleToAdd)
                                        }
                                    }
                                }
                            }

                            self.onAddRenderText = function onAddRenderText(parent, h, text, handleToAdd) {
                                //var s = self.onShowTooltip(parent[0], self.fileName);
                                //var s = 'Tipologia spazio: prova + </br> + Cdc: prova 1'
                                //s = s.replace(/<[^>]+>/g, '')
                                var blockText = {
                                    startPoint: {
                                        x: parent[0].element.geometry.boundingSphere.center.x,
                                        y: parent[0].element.geometry.boundingSphere.center.y,
                                    },
                                    endPoint: {
                                        x: parent[0].element.geometry.boundingSphere.center.x ,
                                        y: parent[0].element.geometry.boundingSphere.center.y,
                                        z: 0
                                    },
                                    position: {
                                        x: parent[0].element.geometry.boundingSphere.center.x,
                                        y: parent[0].element.geometry.boundingSphere.center.y
                                    },
                                    ////halign: 0,
                                    //valign: 1,
                                    handle: h + "_TEXT" ,
                                    layer: parent[0]._layer,
                                    ownerHandle: "1F",                                    
                                    text:h, 
                                    textHeight: 0.1,
                                    type: "TEXT",
                                }

                                //var r = {
                                //    text: h,
                                //    height: 0.1,
                                //    position: {
                                //        x: parent[0].element.geometry.boundingSphere.center.x,
                                //        y: parent[0].element.geometry.boundingSphere.center.y,
                                //    },
                                //    externalText: 1,
                                //    handle: h + "_TEXT"
                                //}

                                var e = cadviewer.renderer.createElements([blockText]);
                                //e[0].externalText = 1
                                //e[0].draggable = 1
                                //e[0].selectable = 1
                                cadviewer.renderer._stack = cadviewer.renderer._stack.concat(e[0])

                                handleToAdd.push(e[0]);



                                //cadviewer.insertMTextNew([r]);


                                //cadviewer.insertMText("ytttttt ttttttttt tttttttt ttttttttt ttttttttt tttttttttt tttttttttt tttttttttt ttttttttttt tttttttttt  ttttttttt",   {
                                //    x: parent[0].element.geometry.boundingSphere.center.x,
                                //    y: parent[0].element.geometry.boundingSphere.center.y,
                                //}, 0.1, 0)



                                //cadviewer.renderer.stack.filter(function (text) { if (text._handle == h + "_TEXT") { return text.externalText = 1 } })
                                //var o = cadviewer.renderer.createElements([blockText]);
                                //handleToAdd.push(o[0]);
                            }

                            self.labels = {
                                'en': {
                                    center: 'center view',
                                    showInfo: 'show element info',
                                    deleteLine: 'Delete lines'
                                },
                                'it': {
                                    center: 'centrare',
                                    showInfo: 'mostrare info',
                                    addScale: 'Aumenta scala',
                                    removeScale: 'Diminuisci scala',
                                    deleteLine: 'Elimina linee'

                                }
                            };

                            self.setComparableEntities = function setComparableEntities(entities) {
                                if (cadviewer) {
                                    var entities = entities.length == 0 ? [] : entities;
                                    cadviewer.setComparableEntities(entities);                                    
                                    cadviewer.showHideComparable();                                  
                                }
                            }

                            self.onClearCompare = function onClearCompare() {
                                if (cadviewer) {
                                    self.bCompare = false;
                                    cadviewer.renderer.removeObjectsComapare();
                                    cadviewer.renderer.render();
                                }
                                
                            }

                            self.loadDxfsCompareIntoViewer = function loadDxfsCompareIntoViewer() {
                                if (self.fileCompare.isReftree) {
                                    var fileName = self.fileCompare.fileName;
                                    var useCompression = self.fileCompare.useCompression;

                                    if (!fileName)
                                        return;

                                    self.request = self.getDxfCompare(self.fileCompare)
                                        .then(function (dxf) {
                                            const dataLoader = new r3.DxfLoader(dxf);

                                            cadviewer.loadCompare(dataLoader, true).render();
                                            self.bCompare = true;
                                            if (self.onLoadCompare) {
                                                self.onLoadCompare();
                                            }
                                        });
                                } else {
                                    if (self.fileCompare) {
                                        const dataLoader = new r3.DxfLoader(self.fileCompare.data);
                                        cadviewer.loadCompare(dataLoader, true).render();
                                        
                                    }                                    
                                }        
                            }

                            self.onRotateRight = function onRotateRight() {
                                const angle = -1 * Math.PI / 180; // Converti gradi in radianti
                                cadviewer.rotateDXF(cadviewer.getEntitiesComparable(true), angle)
                                cadviewer.renderer.render();
                            }

                            self.onRotateLeft = function onRotateLeft() {
                                const angle = 1 * Math.PI / 180; // Converti gradi in radianti
                                cadviewer.rotateDXF(cadviewer.getEntitiesComparable(true), angle)
                                cadviewer.renderer.render();
                            }

                            self.onMoveLeft = function onMoveUp() {
                                cadviewer.moveDXF(cadviewer.getEntitiesComparable(true), -1, 0)
                            }

                            self.onMoveRight = function onMoveDown() {                                
                                cadviewer.moveDXF(cadviewer.getEntitiesComparable(true), 1, 0)                                
                            }

                            self.onMoveDown = function onMoveDown() {
                                cadviewer.moveDXF(cadviewer.getEntitiesComparable(true), 0, -1)
                            }

                            self.onMoveUp = function onMoveUp() {
                                cadviewer.moveDXF(cadviewer.getEntitiesComparable(true), 0, 1)
                            }
                        

                            self.getDxfCompare = function getDxfCompare(file) {
                                    var fileName = file.fileName;

                                    return $.ajax({
                                        url: (self.pathFileCad || window.refDXFFileURI || 'http://ref2space.idearespa.com/dxfunige/') + encodeURIComponent(fileName),
                                        cache: false,
                                        xhr: function () {
                                            var xhr = new XMLHttpRequest();
                                            xhr.responseType = 'blob'
                                            return xhr;
                                        }
                                    }).then(function (res) {

                                        var promise = $.Deferred();

                                        if (res && res.size) {
                                            if (file.useCompression) {
                                                return self.unzip(res);
                                            }
                                            else {
                                                res.text().then(function (result) {
                                                    promise.resolve(result);
                                                });
                                            }
                                        }
                                        else {
                                            console.error('error on loading', fileName);
                                            promise.reject();
                                        }
                                        return promise.promise();
                                    });
                            };

                            self.addPolyline = function () {
                                if (self.onAddPolyline) {
                                    if (self.viewer) {
                               
                                        self.viewer.addPolyline(self.optionsPolyline);
                                        return self.onAddPolyline();
                                    }                                    
                                }
                            }

                            self.onExportDxf = function onExportDxf() {
                                if (cadviewer) {
                                    cadviewer.createDxf();
                                }   
                            }

                            self.onShowDimension = function onShowDimension(activate) {
                                if (cadviewer) {
                                    cadviewer.createDimensionAll(activate);
                                }   
                            }
                        }
                    ]
                }
            }
    )}
);
