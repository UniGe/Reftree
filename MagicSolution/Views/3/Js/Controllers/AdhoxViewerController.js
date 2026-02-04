define([ //requireJs deps    
    "angular",
    "MagicSDK",
    "angular-kendo",
    "angular-filter",
    "angular-ui-bootstrap",
    "tree-bim-r3",
    "angular-magic-grid",
    "angular.drag.resize",
    //"https://api-stg-eggon-forge.herokuapp.com/lib/viewer.js",
    //window.includesVersion + "/Views/3/Js/viewer.js",
    //window.includesVersion + "/Views/3/Js/forge_viewer_2.js",
    "forge-viewer",

], function (angular, MF) {
    return angular
        .module("AdhoxViewer", [
            "kendo.directives",
            "angular.filter",
            "ui.bootstrap",
            "treeBimR3",
            "magicGrid",
            "angular.drag.resize"
        ])
        .controller("AdhoxViewerController", [
            "config",
            "$scope",
            "$timeout",
            "$compile",
            "$uibModal",
            function (config, $scope, $timeout, $compile, $uibModal) {
                var self = this;
                self.initViewer = false;
                self.grid = config.grid;
                self.storedForCad = [];
                self.bimConfiguration = {};
                self.fileLabels = {};
                self.features = {
                    map: true,
                    sidebarAccordion: true,
                    closeButton: true,
                };
                self.gridSelection = config.grid.select();
                self.gridSelectionData = $.map(self.gridSelection, function (val) {
                    return config.grid.dataItem(val)
                });
                self.bimModelsUrns = [];
                self.reftreeModels = [];
                self.nodeReftree = [];
                self.nodeSelected = null;
                self.nodeSelectionTree = {};
                self.selctNodeForGrid = [];
                self.gridDetail = [];
                self.isolateNode = [];
                self.detailGridNameLocali = ''
                self.selectionsNode = [];
                self.onCheckedNode = false;
                self.filterDbId = [];
                self.search = null;
                self.showSearchBim = false;
                self.selectionViewerObject = {};


                //Forge.forgeViewer.impl.selector.setSelection([5308], Forge.models[0]);

                var sourceItemIds = $.map(self.grid.select(), function (v, i) {
                    return self.grid.dataItem(
                        v,
                    )[self.grid.dataSource.options.schema.model.id];
                });
                var sourcegridname = self.grid.element.attr("gridname");

                self.labels = {
                    close: {
                        it: 'Chiudi',
                        en: 'Close',
                    },
                    modelli: {
                        it: 'Modelli',
                        en: 'Models',
                    },
                    tematismi: {
                        it: 'Tematismi',
                        en: 'Themes',
                    },
                    Impianti: {
                        it: 'Impianti',
                        en: 'Impianti',
                    },
                    Locali: {
                        it: 'Locali',
                        en: 'Locali',
                    },
                    Reftree: {
                        it: 'Reftree',
                        en: 'Reftree',
                    },
                    Bim: {
                        it: 'Bim',
                        en: 'Bim',
                    },
                    treeBim: {
                        it: 'Tree',
                        en: 'Tree',
                    },
                    PropertiesBim: {
                        it: 'Proprietà Bim',
                        en: 'Proprietà Bim',
                    },
                    gridReftree: {
                        it: 'Proprietà RefTree',
                        en: 'Proprietà RefTree',
                    }

                }

                self.getLabels = function (key) {
                    if (key in self.labels) {
                        return self.labels[key][window.culture.substring(0, 2)];
                    }
                    return getObjectText(key);
                };


                self.hideObjectPageRefTree = function (showHide) {
                    $("#layout-condensed-toggle").click();



                    showHide ? $(".page-title").show() : $(".page-title").hide()
                }

                self.closeViewer = function (event) {
                    self.hideObjectPageRefTree(true);
                    self.onUnloadViewable();
                    $(event.currentTarget).closest("#adhox-viewer-controller").remove();
                    $scope.$destroy();
                    // config.close();
                };

                self.triggerWindowResize = function triggerWindowResize() {
                    window.dispatchEvent(new Event('resize'));
                    if (!$("#main-menu").hasClass("mini")) {
                        $("#layout-condensed-toggle").click();
                    }


                    if (!!Forge.forgeViewer) {
                        if (!!Forge.forgeViewer.canvas) {
                            Forge.forgeViewer.resize();
                        }
                    }
                };

                /**sezione watch**/
                //$scope.$watchCollection('av.reftreeModels', function (reftreModel) {
                //    $.each(reftreModel, function (i, v) {
                //        var eleToWatch = 'av.reftreeModels[' + i + '].urns'
                //        $scope.$watchCollection(eleToWatch, function (urns) {
                //            if (urns.length > 0) {
                //                self.onLoadModelByUrns(v, urns).then(() => {
                //                });
                //            }
                //        });
                //    });
                //});
                /**Fine sezione watch**/

                self.hideObjectPageRefTree(false);

                self.onLoadModelReftree = function onLoadModelReftree(models) {
                    models.map(function (model) {
                        self.onLoadTreeBim(model).then(() => {
                            Forge.forgeViewer.viewer.loadExtension('Autodesk.VisualClusters', { attribName: 'Material', searchAncestors: true });
                            doModal();
                            $timeout();


                        }, reject => {
                            doModal();
                            console.log('Error onLoadTreeBim');
                        });
                    });
                }

                self.init = function init() {
                    self.getNodeReftree();
                    self.onShowDetailGrid();
                    self.modelSearch = [];

                    Forge.init().then(() => {
                        Forge.getViewer("forgeViewer").then(() => {
                            Forge.forgeViewer.getModelsByProjectId(143).then((models) => {

                                Forge.forgeViewer.viewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, self.onSelectedNodeChange);
                                Forge.forgeViewer.viewer.setSelectionMode(Autodesk.Viewing.SelectionMode.FIRST_OBJECT);


                                self.reftreeModels = models;

                                let promiseList = new Promise(function (resolve, reject) {
                                    if (models.length == 0) {
                                        return
                                    }

                                    modelToCheck = [];

                                    $.each(self.reftreeModels, function (i, model) {
                                        model.modelBim = [];
                                        modelToCheck.push(model);

                                        Forge.forgeViewer.loadModel(model).then(e => {
                                            self.modelSearch.push(e);

                                            //resolve();
                                            self.onLoadTreeBim(e).then(() => {

                                                model.modelBim.push(e);
                                                e.start = true;

                                                if (models.length == modelToCheck.length) {
                                                    resolve(modelToCheck);
                                                    $timeout(function () {
                                                        $scope.$apply();
                                                    }, 50);
                                                }
                                            });
                                        }), function (err) {
                                            console.log('Errore in loadModel');
                                            resolve();
                                        }
                                    })
                                })
                            });
                        })

                        config.ready();
                    }, reject => {
                        doModal();
                        console.log('Forge-init error');
                    });


                    //self.getReftreeModelBim().then(() => {

                    //});
                }

                /**Gestione sideBar **/
                self.bShowSidebarProperties = false;
                self.bShowSidebar = false;

                self.openNav = function openNav() {
                    self.bShowSidebar = !self.bShowSidebar
                }

                self.closeNav = function closeNav() {
                    self.bShowSidebar = false;
                }

                self.openNavProperties = function openNavProperties() {
                    self.bShowSidebarProperties = !self.bShowSidebarProperties;
                }

                self.closeNavProperties = function closeNavProperties() {
                    self.bShowSidebarProperties = false;
                }

                self.openNavGrid = function openNav() {
                    self.bShowsidebarGrid = !self.bShowsidebarGrid;
                }

                self.closeNavGrid = function closeNav() {
                    self.bShowsidebarGrid = false;
                }
                /**Fine Gestione sideBar **/

                //self.refreshModelBim = function refreshModelBim(modelBim) {
                //    var instanceTree = modelBim.getData().instanceTree
                //    var rootId = instanceTree.getRootId()
                //    //Forge.forgeViewer.show(rootId, modelBim);

                //    Forge.forgeViewer.show(modelBim,rootId);
                //    Forge.forgeViewer.fitToView(null, modelBim)
                //    Forge.forgeViewer.clearSelection();

                //    self.nodeSelected = null;
                //}

                self.refreshModelBim = function refreshModelBim(model) {
                    var rootId = model.getData().instanceTree.getRootId()
                    var forgeViewer = Forge.forgeViewer;

                    forgeViewer.viewer.show(rootId, model);
                    forgeViewer.viewer.fitToView(null, model);
                    forgeViewer.viewer.clearSelection();
                }



                self.onResetModel = function onResetModel(refreshTree) {
                    //self.onRefreshThemati();
                    //self.onResetThemati();

                    //self.onForgeClearColor();

                    if (!!Forge.forgeViewer) {
                        Forge.forgeViewer.models.map(function (modelBim) {
                            self.refreshModelBim(modelBim);
                            if (refreshTree) {
                                doModal(true)
                                self.onLoadTreeBim(modelBim).then(() => {
                                    doModal(false)

                                }, reject => {
                                    doModal(false);

                                });
                            }
                        })
                    }
                }

                //self.onResetModel = function onResetModel(reftreeModel, reftreeTree) {
                //    if (!!reftreeModel) {
                //        doModal(true);

                //        reftreeModel.modelBim.map(function (model) {
                //            self.refreshModelBim(model);
                //        })

                //        if (reftreeTree) {
                //            reftreeModel.modelBim = [];

                //            Forge.models.map(function (modelBim) {
                //                reftreeModel.modelBim.push(modelBim);
                //                self.onLoadTreeBim(modelBim).then(() => {
                //                });
                //            })

                //        }


                //        doModal(false);
                //    } else {
                //        doModal(true);

                //        self.reftreeModels.map(function (reftreeModel) {
                //            reftreeModel.modelBim.map(function (model) {
                //                self.refreshModelBim(model);
                //            });

                //            if (reftreeTree) {
                //                reftreeModel.modelBim = [];
                //                Forge.models.map(function (modelBim) {

                //                    reftreeModel.modelBim.push(modelBim);
                //                    self.onLoadTreeBim(modelBim).then(() => {

                //                    });
                //                })
                //            }
                //            doModal(false);
                //        })
                //    }
                //}

                /* caricamento modelli BIM */
                self.onLoadModelByUrns = function onLoadModelByUrns(reftreeModel, urns) {
                    return new Promise(resolve => {
                        doModal(true);


                        self.onResetModel(reftreeModel);
                        if (urns.length == 0) self.resolveModel(resolve);

                        $.each(urns, function (i, urn) {

                            self.onLoadModel([urn]).then((e) => {
                                self.onLoadTreeBim(e).then(() => {
                                    reftreeModel.modelBim.push(e);
                                    if (urns.length == reftreeModel.modelBim.length) {
                                        self.resolveModel(resolve);


                                    }
                                });
                            });
                        });
                    });
                }

                self.resolveModel = function (resolve) {
                    doModal();
                    resolve();
                }

                //self.onUnloadViewable = function onUnloadViewable() {

                //    Forge.models = [];
                //    if (Forge.forgeViewer) {
                //        Forge.forgeViewer.finish();
                //        Forge.forgeViewer = null;
                //    }
                //}

                self.onUnloadViewable = function onUnloadViewable() {
                    if (Forge.forgeViewer) {
                        Forge.forgeViewer.models = [];
                        if (Forge.forgeViewer.viewer) {
                            Forge.getViewer("forgeViewer");
                        }
                    }
                }

                self.onLoadViewable = function onLoadViewable(reftreeModel) {
                    return new Promise(resolve => {
                        let xhr = new XMLHttpRequest();
                        xhr.open("GET", `${Forge._api_endpoint}/sdk/viewable/${reftreeModel.idKey}`)
                        xhr.onload = () => {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    resolve((JSON.parse(xhr.responseText)).data.attributes.models);
                                    //self.onLoadModel((JSON.parse(xhr.responseText)).data.attributes.models).then(() => {
                                    //    resolve();
                                    //});
                                } else {
                                    console.error(xhr.statusText);
                                }
                            }
                        };

                        xhr.onerror = (e) => {
                            console.error(e);
                            return false;
                        };

                        xhr.setRequestHeader('authorization', `Bearer ${Forge._api_token}`)
                        xhr.send()
                    });
                }

                self.onLoadModel = function onLoadModel(urns) {
                    return new Promise(resolve => {

                        viewerOptions = {
                            env: 'AutodeskProduction',
                            accessToken: Forge._api_token,
                        };

                        Autodesk.Viewing.Initializer(viewerOptions, () => {

                            Autodesk.Viewing.endpoint.setEndpointAndApi(`${Forge._api_endpoint}/sdk`, 'modelDerivativeV2')
                            Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS = {
                                'Authorization': `Bearer ${Forge._api_token}`
                            }

                            if (!Forge.forgeViewer) {
                                const div = document.getElementById('forgeViewer');
                                Forge.forgeViewer = new Autodesk.Viewing.GuiViewer3D(div);
                                Forge.forgeViewer.start();
                                Forge.forgeViewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, self.onSelectedNodeChange);
                            }




                            urns.map((m) => {
                                Autodesk.Viewing.Document.load(`urn:${m.urn}`, (doc) => {
                                    const viewables = doc.getRoot().getDefaultGeometry();

                                    let transformations
                                    if (m.coords || m.rotation) {
                                        transformations = new THREE.Matrix4();
                                        if (m.rotation) {
                                            if (m.rotation.x) transformations.makeRotationX(m.rotation.x)
                                            if (m.rotation.y) transformations.makeRotationY(m.rotation.y)
                                            if (m.rotation.z) transformations.makeRotationZ(m.rotation.z)
                                        }
                                        if (m.coords) {
                                            transformations.setPosition(m.coords)
                                        }
                                    }

                                    Forge.forgeViewer.loadDocumentNode(doc, viewables, {
                                        placementTransform: transformations,
                                        keepCurrentModels: true,
                                        globalOffset: {
                                            x: 0,
                                            y: 0,
                                            z: 0
                                        }
                                    }).then((model) => {
                                        // Add model to loaded models
                                        Forge.forgeViewer.waitForLoadDone(model).then(() => {
                                            Forge.models.push(model);
                                            resolve(model);
                                        });
                                    });

                                });

                            })
                        });

                    });
                }

                self.onGetExternalIdMapping = function (model) {
                    model.getExternalIdMapping(function (data) {
                        model.guidMap = data;
                    });
                }

                self.onLoadTreeBim = function onLoadTreeBim(modelBim) {
                    return new Promise(resolve => {


                        //$.each(modelBim.element, function (i, v) {

                        //    console.log(v);
                        //})

                        self.getAllLeafComponents(modelBim, function (e) {


                            modelBim.elements = e;
                            self.onGetExternalIdMapping(modelBim);


                            modelBim.getBulkProperties(modelBim.elements.map(function (ele) { return ele.dbId }), ['IfcGUID'],
                                function (elements) {
                                    if (elements.length == 0) {
                                        resolve();
                                        return
                                    }
                                    elements.map(function (element) {
                                        var node = modelBim.elements.filter(function (nd) { return nd.dbId == element.dbId })[0]
                                        var prop = element.properties.filter(function (e) { return e.displayCategory === 'Entità' && e.displayName === 'IfcGUID' })[0];
                                        if (!!prop) {
                                            node.globalIfc = prop.displayValue;
                                            var oRefObj = self.nodeReftree.filter(function (asset) {
                                                return asset.globalIfc == node.globalIfc
                                            })[0];
                                            if (!!oRefObj) {
                                                var parent = self.nodeReftree.filter(function (parent) {
                                                    return parent.Id == oRefObj.parentId
                                                })[0]
                                                oRefObj.model = modelBim;
                                                oRefObj.dbId = node.dbId;
                                                parent.dbId = node.parentId;
                                                parent.model = modelBim;
                                            }

                                            node.idRef = oRefObj ? oRefObj.id : 0;
                                            node.type = oRefObj ? oRefObj.type : '';
                                            node.isRefTree = oRefObj ? true : false;
                                            node.style = oRefObj ? 'isRefTreeNode' : '';
                                            node.selectedClass = true;
                                        }
                                    })
                                    //modelBim.start = true;

                                    $timeout(function () {
                                        $scope.$apply();
                                        resolve();
                                    }, 50);
                                })
                        }).then((e) => {

                        });
                    });
                }

                self.getAllLeafComponents = function getAllLeafComponents(model, callback) {
                    return new Promise(resolve => {
                        var cbCount = 0;
                        var tree;
                        var jsData = []

                        function getLeafComponentsRec(current, parent) {
                            cbCount++;
                            if (tree.getChildCount(current) != 0) {

                                tree.enumNodeChildren(current, function (children) {

                                    var nodeName = model.getInstanceTree().getNodeName(children);

                                    if (nodeName != 'Body' && nodeName != 'Solido') {

                                        getLeafComponentsRec(children, current);
                                    }
                                }, false);
                            }


                            var nodeName = model.getInstanceTree().getNodeName(current)
                            var nodeChild = {
                                dbId: current,
                                Id: current,
                                parentId: parent,
                                name: nodeName,
                                showCheck: true,
                                show: true,
                                iconClass: 'glyphicon glyphicon-plus-sign',
                                iconClassDetail: 'glyphicon glyphicon-eye-open',
                                showIconDetail: true,
                                properties: [],
                                showHide: true,
                                modelId: model.id,
                                modelName: model.name,
                                checked: false,
                            }


                            if (current != 1) {
                                jsData.push(nodeChild)
                            }


                            if (--cbCount == 0) callback(jsData);
                        }

                        tree = model.getData().instanceTree;
                        var rootId = tree.getRootId()
                        var nodeName = tree.getNodeName(rootId)


                        if ('0FGfI2bJY8FDjgad.nwc' == nodeName) {
                            nodeName = 'Architettonico'
                            model.name = nodeName
                        } else if ('4msjfCEVcAMlpg63.nwc' == nodeName) {
                            nodeName = 'Meccanico cv 37'
                            model.name = nodeName
                        }
                        else if ('1Ozmsm3Enmik02Ji.nwc' == nodeName) {
                            nodeName = 'Elettrico'
                            model.name = nodeName
                        }
                        else if ('oA5UIV3ZwuvImOzt.nwc' == nodeName) {
                            nodeName = 'Meccanico cv 42 48'
                            model.name = nodeName
                        }

                        var node = {
                            dbId: rootId,
                            Id: rootId,
                            parentId: '#',
                            name: nodeName,
                            showCheck: true,
                            show: true,
                            iconClass: 'glyphicon glyphicon-plus-sign',
                            iconClassDetail: 'glyphicon glyphicon-eye-open',
                            showIconDetail: true,
                            properties: [],
                            showHide: true,
                            modelId: model.id,
                            modelName: model.name,
                            pathTree: rootId,
                            checked: false,


                        }

                        jsData.push(node);

                        var allLeafComponents = getLeafComponentsRec(rootId, '#');

                        resolve(allLeafComponents);
                    });
                }
                /* Fine caricamento modelli BIM */

                /**gestione del treee Bim**/
                self.onShowSearchBim = function () {
                    self.filterDbId = [];
                    self.showSearchBim = !self.showSearchBim;
                    $("#myDropdown").toggle("showSearch");
                }

                self.openSearch = function (vehicle) {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'myModalContent.html',
                        animation: true,

                        keyboard: true,
                        backdrop: "static",
                        resolve: {
                            items: function () {
                                return $scope.items;
                            }
                        },
                        controller: function ($scope, $uibModal) {
                            $scope.av = self;

                            $scope.ok = function () {
                                $uibModal.close({ test: "test" });
                            };

                            $scope.cancel = function () {

                            };

                            $timeout(function () {
                                $(".modal-dialog").draggable();

                                var resizeOpts = {
                                    handles: "all", autoHide: true
                                };

                                $(".modal-dialog").resizable(resizeOpts);
                            }, 0);
                        },

                    });
                };

                self.onGetPathNode = function onGetPathNode() {

                }

                self.onFilterTreeBim = function () {
                    if (self.search.toUpperCase() == '' || self.search.length <= 2) {
                        self.filterDbId = [];
                        return
                    }



                    self.filterDbId = $.map(Forge.models, function (model) {
                        var tree = model.getData().instanceTree;

                        return $.map(model.elements, function (ele) {
                            if (ele.name.toUpperCase().startsWith(self.search.toUpperCase())) {
                                function getParentNode(parentId, model, dbId) {
                                    var parent = model.getData().instanceTree.getNodeParentId(dbId)
                                    var nodeName = model.getInstanceTree().getNodeName(dbId);
                                    if (parent != 0) {
                                        parentId.push({ dbId: parent, name: nodeName });
                                        getParentNode(parentId, model, parent);
                                    }
                                }
                                var parentId = [];


                                if (ele.parentId != '') {
                                    getParentNode(parentId, model, ele.parentId)
                                }
                                var sDescSearch = model.name + ' > ';
                                $.each(parentId.reverse(), function (i, v) {
                                    sDescSearch += v.name + ' > ';
                                });

                                ele.searchDesc = sDescSearch + ele.name;
                                return ele;
                            }
                        })
                    })

                }

                self.getTreeNode = function (model, dbId) {
                    return model.elements.filter(function (node) { return node.dbId == dbId })[0]
                }

                self.onSelectNodeSearch = function onSelectNodeSearch(node) {
                    model = Forge.models.filter(function (mod) { return mod.id == node.modelId })[0]
                    model.getProperties(node.dbId,
                        function (res) {
                            var externaId = '';
                            var nodeToExpand = self.getTreeNode(model, 1);
                            self.expandNode(nodeToExpand, 0, 'isolate');

                            res.externalId.split("/").map(function (i, v) {
                                externaId += i
                                var dbId = model.guidMap[externaId]
                                var nodeToExpand = self.getTreeNode(model, dbId);
                                self.expandNode(nodeToExpand, node.dbId, 'isolate');
                                console.log(model.guidMap[externaId]);
                                externaId += '/'
                            });
                            self.onShowSearchBim();
                        })
                }

                self.onNodeClick = function onNodeClick(model, e) {
                    self.onLoadPropertiesObj(model, e).then((node) => {
                        self.nodeSelected = node;


                        $timeout(function () {
                            $scope.$apply();
                        }, 50);
                    });


                }

                self.onAddRemoveNode = function onAddRemoveNode(model, node) {
                    return new Promise(resolve => {
                        child = [];
                        if (!!node.children) {
                            child = node.children;
                        } else {
                            child = model.elements.filter(function (ele) {
                                return ele.parentId == node.Id
                            });
                        }

                        child.map(function (nodeChild) {
                            nodeChild.showHide = node.showHide;
                            nodeChild.iconClassDetail = nodeChild.showHide ? 'glyphicon glyphicon-eye-open' : 'glyphicon glyphicon-eye-close';
                        })

                        $('[data-toggle="tooltip"]').tooltip();
                        node.show = !node.show;
                        node.iconClass = node.show ? 'glyphicon glyphicon-plus-sign' : 'glyphicon glyphicon-minus-sign'

                        node.children = child;

                        resolve();
                    });
                }

                self.onHideShowNode = function onHideShowNode(model, e) {
                    function onShowHideChild(child) {
                        child.showHide = !child.showHide;
                        child.iconClassDetail = child.showHide ? 'glyphicon glyphicon-eye-open' : 'glyphicon glyphicon-eye-close'

                        $.each(child.children, function (i, v) {
                            onShowHideChild(v);
                        })
                    }

                    e.showHide = !e.showHide;

                    e.showHide ? Forge.forgeViewer.show(model, e.dbId) : Forge.forgeViewer.hide(model, e.dbId)

                    e.iconClassDetail = e.showHide ? 'glyphicon glyphicon-eye-open' : 'glyphicon glyphicon-eye-close'

                    $.each(e.children, function (i, v) {
                        onShowHideChild(v);
                    })
                }

                self.onCheckChange = function (model, e) {
                    self.onCheckedNode = true;

                    self.gridDetail.map(function (grid) {
                        var globalIfc = [];

                        model.elements.filter(function (ele) {
                            if (ele.checked == true && ele.type == grid.type) {
                                globalIfc.push({ operator: 'eq', field: grid.handle_key, value: ele.globalIfc })
                            }
                        })

                        grid.initFilterGridStart = {
                            logic: "or",
                            filters: globalIfc.length == 0 ? [{ operator: 'eq', field: grid.handle_key, value: "" }] : globalIfc
                        }

                        self.onResetGrid(grid);
                        grid.start = true;
                    });

                    var dbIds = model.elements.filter(function (ele) { if (ele.checked == true) { return ele.dbId } }).map(function (o) { return o.dbId })



                    $timeout(function () {
                        Forge.forgeViewer.impl.selector.setSelection(dbIds, model);
                    }, 50);
                }

                self.onNodeDbClick = function onNodeDbClick(model, e) {
                    //var dbIds = model.elements.filter(function (ele) { if (ele.checked == true) { return ele.dbId } }).map(function (o) { return o.dbId })
                    //Forge.isolate(dbIds, model);
                    if (((window.event.shiftKey) && (window.event.ctrlKey)) || (window.event.shiftKey)) {

                        $("#spanNocr_" + e.modelId + '_' + e.dbId).css("color", "green").css("font-weight", "bold").css("font-size", "16px");
                        self.isolateNode.push(e);
                    } else {
                        $('span[id *="spanNocr_"]').css('color', '').css('font-size', '').css('font-weight', '');
                        self.isolateNode = [];
                        $("#spanNocr_" + e.modelId + '_' + e.dbId).css("color", "green").css("font-weight", "bold").css("font-size", "16px");
                        self.isolateNode.push(e);
                    }


                    //var dbIds = model.elements.filter(function (ele) { if (ele.checked == true) { return ele.dbId } }).map(function (o) { return o.dbId })
                    Forge.forgeViewer.isolate(model, self.isolateNode.map(function (dbId) { return dbId.dbId }));

                }

                self.showHideReftreeNode = function showHideReftreeNode(modelReftree) {
                    modelReftree.hideNodeBim = !modelReftree.hideNodeBim;
                }

                self.onLoadPropertiesObj = function onLoadPropertiesObj(model, node) {
                    return new Promise(resolve => {
                        model.getBulkProperties([node.dbId], null,
                            function (elements) {
                                node.properties = elements[0].properties;

                                resolve(node);
                            })
                    });
                }

                self.selectionNodeProperty = function (node) {

                }

                self.onSelectedNodeChange = function onSelectedNodeChange(e) {


                    if (self.selectionsNode.length > 0) {
                        self.selectionsNode.map(function (sel) {
                            $.each(sel.nodeArray, function (i, v) {
                                var node = sel.model.elements.filter(function (ele) { return ele.dbId == v })[0]
                                if (!!node) {
                                    node.checked = false;
                                    $("#spanNocr_" + sel.model.id + '_' + v).css('color', '').css('font-size', '').css('font-weight', '');
                                }
                            })
                        })
                    }

                    function getParentNode(oNodes, model, dbId) {
                        var parent = model.getData().instanceTree.getNodeParentId(dbId)
                        if (parent != 0) {
                            oNodes.push(parent);
                            getParentNode(oNodes, model, parent);
                        }
                    }

                    e.target.impl.setSelectionColor(new THREE.Color(1, 0, 0));
                    self.selectionsNode = e.selections;

                    self.selectionsNode.map(function (sel) {
                        sel.nodePath = [];

                        $.map(sel.nodeArray, function (node) {
                            var nodeTreePath = [];
                            nodeTreePath.push(node);
                            getParentNode(nodeTreePath, sel.model, node)

                            sel.nodePath.push({ id: node, nodes: nodeTreePath });
                        })


                        sel.nodePath.map(function (root) {
                            $.each(root.nodes.reverse(), function (i, v) {
                                var node = self.getTreeNode(sel.model, v);

                                //sel.model.elements.filter(function (ele) { return ele.dbId === v })[0];

                                self.expandNode(node, root.id, 'select');

                                //if (!!node) {
                                //    if (node.show) {
                                //        $("#spanDetail_" + node.modelId + '_' + node.dbId).click();

                                //        if (node.dbId == root.id) {
                                //            //$("#spanNocr_" + node.modelId + '_' + node.dbId).css("color", "blue").css("font-weight", "bold").css("font-size", "16px");
                                //            angular.element("#tree_" + node.modelId + '_' + node.dbId)[0].scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
                                //            node.checked = true
                                //        }
                                //    } else {
                                //        if (node.dbId == root.id) {
                                //            //$("#spanNocr_" + node.modelId + '_' + node.dbId).css("color", "blue").css("font-weight", "bold").css("font-size", "16px");
                                //            angular.element("#tree_" + node.modelId + '_' + node.dbId)[0].scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
                                //            node.checked = true
                                //        }
                                //    }
                                //}
                            });

                        });

                    });



                    $timeout(function () {
                        $scope.$apply();
                    }, 50);

                }

                self.expandNode = function (node, rootId, action) {
                    if (!!node) {
                        if (node.show) {
                            $("#spanDetail_" + node.modelId + '_' + node.dbId).click();
                        }
                        if (node.dbId == rootId) {

                            angular.element("#tree_" + node.modelId + '_' + node.dbId)[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });


                            if (action == 'isolate') {
                                $("#spanNocr_" + node.modelId + '_' + node.dbId).dblclick();
                            } else if (action == 'select') {
                                node.checked = true;
                            }
                        }



                        $timeout(function () {
                            $scope.$apply();
                        }, 50);

                    }
                }

                self.onExpandAllNode = function onExpandAllNode(model, ShowHide) {
                    $.each(model.elements.reverse(), function (i, v) {
                        if (!v.show) {
                            $("#spanDetail_" + v.modelId + '_' + v.dbId).click();
                        }
                    });
                }
                /**Fine gestione del treee Bim**/

                /**gestione del treee Reftree**/
                self.onAddRemoveNodeReftree = function onAddRemoveNodeReftree(node) {
                    return new Promise(resolve => {

                        child = self.nodeReftree.filter(function (ele) {
                            return ele.parentId == node.Id
                        }).map(function (nodeChild) {
                            return nodeChild;
                        })


                        $('[data-toggle="tooltip"]').tooltip();
                        node.show = !node.show;
                        node.iconClass = node.show ? 'glyphicon glyphicon-plus-sign' : 'glyphicon glyphicon-minus-sign'
                        node.children = child;

                    });
                }

                self.onCheckChangeReftree = function onCheckChangeReftree(model, e) {
                    var dbIds = [];
                    var dbIdsParent = [];


                    $.each(self.nodeReftree, function (i, v) {
                        if (v.checked == true) {
                            dbIds.push(v.dbId);
                            dbIdsParent.push(self.nodeReftree.filter(function (node) { return node.Id == v.parentId })[0].dbId);
                        }
                    });

                    //var dbIds = self.nodeReftree.filter(function (ele) { if (ele.checked == true) { return ele.dbId } }).map(function (o) { return o.dbId })
                    //var dbIdsParent = self.nodeReftree.filter(function (ele) { if (ele.checked == true) { return ele.parentId } }).map(function (o) { return o.dbId })

                    Forge.forgeViewer.isolate(model, dbIdsParent);
                    Forge.forgeViewer.impl.selector.setSelection(dbIds, model);
                }
                /**Fine gestione del treee Reftree**/


                /**Gestione reftree griglie**/
                self.onResetGrid = function onResetGrid(selGrid) {
                    var $grid = $('div[gridname="' + selGrid.magicGridName + '"]')

                    if ($grid.length > 0) {
                        try {
                            grid = $grid.data("kendoGrid");
                            filter = grid.dataSource.filter();
                            filter = removeFiltersByType(filter, ["searchBar", "user", "pivot", "zoom", undefined]); //user filters
                            grid.dataSource.filter(filter);
                            $grid.find("#maingridsearchandfilter").val('');
                            updateUserFilterLabel($grid);



                            self.onSetFilterGrid(selGrid);
                        }
                        catch (ex) {
                            console.log(ex);
                        }
                    }
                }

                self.onSetFilterGrid = function onSetFilterGrid(grid) {
                    var oGrid = $('div[gridname="' + grid.magicGridName + '"]');

                    if (oGrid.length > 0 && !!oGrid.data('kendoGrid')) {
                        oGrid.data('kendoGrid').dataSource.filter(grid.initFilterGridStart);
                    }
                }

                self.getNodeReftree = function getNodeReftree() {
                    self.nodeReftree = [];

                    MF.api.get({
                        storedProcedureName: self.storedForCad['BIM_GetPlAsset'] ? self.storedForCad['BIM_GetPlAsset'] : 'core.BIM_GetPlAsset',
                        data: {
                            ApplicationInstanceId: window.ApplicationInstanceId,
                            id: sourceItemIds
                        }
                    }).then(function (result) {
                        if (!result[0]) {
                            return
                        }

                        $.each(result[0], function (i, v) {
                            self.nodeReftree.push(v);
                        });


                        //$scope.$apply();

                    }, function (err) {
                        console.log('pLAsset');
                        console.log(err);
                    });
                }

                self.onShowDetailGrid = function onShowDetailGrid() {
                    //if (!self.actionGridName) {

                    MF.api.get({
                        storedProcedureName: self.storedForCad['BIM_Get_Detail_Grid_Name'] ? self.storedForCad['BIM_Get_Detail_Grid_Name'] : 'core.BIM_Get_Detail_Grid_Name',
                        assetMode: self.assetMode
                    })
                        .then(function (res) {
                            if (!res.length || !res[0].length) {
                                return;
                            }

                            self.gridDetail = res[0];

                            self.gridDetail.map(function (grid) {

                                grid.initFilterGridStart = {
                                    logic: "or",
                                    filters: [{ operator: 'eq', field: grid.handle_key, value: "" }]
                                }



                                grid.start = true;

                            });
                        });
                };

                self.onDataBoundGrid = function onDataBoundGrid(e) {
                    var grid = $("div[gridname='" + e.sender.options.gridcode + "']").data('kendoGrid');
                    grid.tbody.delegate('tr', 'dblclick', function (grid, e) {
                        console.log(e);
                    });

                    //$("div[gridname='" + e.sender.options.gridcode + "']").on("dblclick", "td", self.gridDblclick());
                }

                self.gridDblclick = function (e) {
                    console.log('grid  dblclick');
                    console.log(e);
                }

                /**Gestione reftree griglie**/


                /*recupero le configurazioni*/
                self.getBimConfiguration = function () {
                    MF.api.get({
                        storedProcedureName: "core.BIM_Get_Bim_config",
                    })
                        .then(function (result) {
                            if (!result[0]) return

                            $.each(result[0], function (i, v) {
                                self.bimConfiguration["jsonConfig"] = v.jsonConfig;
                                self.bimConfiguration["apiKey"] = v.forgeApiKey;
                            });

                        }, function (err) {
                            console.log(err);
                            resolve();
                        });
                }

                self.getBimConfiguration();
                /*fine recupero configurazioni*/

                /*recupero le procedure personalizzate*/
                self.getStoredForCad = function getStoredForCad() {
                    MF.api.get({
                        storedProcedureName: "core.DWG_Stored_for_cad",
                        data: {
                            ApplicationInstanceId: window.ApplicationInstanceId
                        }
                    })
                        .then(function (result) {
                            if (!result[0]) return

                            $.each(result[0], function (i, v) {
                                self.storedForCad[v.code] = v.stored;
                            });

                        }, function (err) {
                            console.log(err);
                            resolve();
                        });
                }

                self.getStoredForCad();
                /*fine recupero le procedure personalizzate*/

                /*Recupero i modelli censiti per reftree*/
                self.getReftreeModelBim = function getReftreeModelBim() {
                    return new Promise(resolve => {
                        MF.api.get({
                            storedProcedureName: self.storedForCad['BIM_GetModelContent'] ? self.storedForCad['BIM_GetModelContent'] : 'core.BIM_GetModelContent',
                            data: {
                                ApplicationInstanceId: window.ApplicationInstanceId,
                                id: sourceItemIds
                            }
                        }).then(function (result) {
                            if (!result[0]) resolve();

                            var oModel = [];

                            $.each(result[0], function (_i, v) {
                                v.urns = [];
                                v.modelBim = [];
                                oModel.push(v);
                            });

                            self.reftreeModels = oModel;
                            oModel = null;
                            $timeout(function () {
                                $scope.$apply();
                            }, 50);
                            resolve();

                        }, function (err) {
                            console.log('BIM_GetModelContent');
                            console.log(err);
                        });
                    });


                }
                /*Recupero i modelli censiti per reftree*/

                self.init();
            }
        ]);


});