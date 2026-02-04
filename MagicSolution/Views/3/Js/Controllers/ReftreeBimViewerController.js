define([ //requireJs deps    
    "angular",
    "MagicSDK",
    "angular-kendo",
    "angular-filter",
    "angular-ui-bootstrap",
    "tree-bim-r3",
    "angular-magic-grid",
    "forge-viewer",
    // window.includesVersion + "/Views/3/Js/Forge_viewer_2.js",    
    //"https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.js"

], function (angular, MF) {
    return angular
        .module("ReftreeBimViewer", [
            "kendo.directives",
            "angular.filter",
            "ui.bootstrap",
            "treeBimR3",
            "magicGrid",
        ])
        .controller("ReftreeBimViewerController", [
            "config",
            "$scope",
            "$timeout",
            //"$compile",
            //"$uibModal",
            //"$sce",
            //"$window",         
            function (config, $scope, $timeout) {
                var self = this;

                self.storedForCad = {};
                self.selectionViewer = [];
                self.reftreeProjects = {};
                self.showMenuDocument = true;
                self.nodeReftree = [];

                config.ready();

                self.resizeMenuReftree = function () {
                    if (!$('#main-menu').hasClass('mini')) {
                        $('#main-menu').addClass('mini');
                        $('.page-content').addClass('condensed');
                        $('.scrollup').addClass('to-edge');
                        $('.header-seperation').hide();
                        $('.footer-widget').hide();
                    }
                    $(document).trigger('menuToggled');
                    calculateHeight();
                }

                Forge.init().then(() => {

                }, reject => {
                    console.log('Forge-init error');
                });

                $scope.$watch('rbv.selectedProject', function (newOne, oldOne) {
                    if (!jQuery.isEmptyObject(newOne)) {
                        self.onSelectedProject(newOne, false)
                    } else {
                        self.onResetProject()
                    }
                });

                var sourceItemIds = $.map(config.grid.select(), function (v, i) {
                    return config.grid.dataItem(
                        v,
                    )[config.grid.dataSource.options.schema.model.id];
                });

                var sourcegridname = config.grid.element.attr("gridname");

                self.triggerWindowResize = function triggerWindowResize() {
                    window.dispatchEvent(new Event('resize'));

                    if (!!Forge.forgeViewer) {
                        if (!!Forge.forgeViewer.canvas) {
                            Forge.forgeViewer.resize();
                        }
                    }
                };

                self.getLabels = function (key) {
                    if (key in self.labels) {
                        return self.labels[key][window.culture.substring(0, 2)];
                    }
                    return getObjectText(key);
                };

                self.labels = {
                    visualizza: {
                        it: 'Visualizza',
                        en: 'Viewer',
                    },
                    back: {
                        it: 'Indietro',
                        en: 'Back',
                    },
                    close: {
                        it: 'Esci',
                        en: 'Exit',
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
                    },
                    refreshModel: {
                        it: 'Aggiorna',
                        en: 'Refresh',
                    },
                    importaOggetti: {
                        it: 'Importa oggetti',
                        en: 'Import objects',
                    },
                    importaLocali: {
                        it: 'Importa Locali',
                        en: 'Import Locali',
                    },
                    importaImpianti: {
                        it: 'Importa Impianti',
                        en: 'Import Impianti',
                    },
                    importaImpianti: {
                        it: 'Carica',
                        en: 'Import',
                    },
                    modelList: {
                        it: 'Elenco modelli',
                        en: 'Models list',
                    },
                    category: {
                        it: 'Categorie',
                        en: 'Category',
                    },
                    modelloforge: {
                        it: 'Forge',
                        en: 'Forge',
                    },
                    eliminare: {
                        it: 'Eliminare ?',
                        en: 'Delete ?',
                    },
                    salvare: {
                        it: 'Salvare ?',
                        en: 'Save ? ',
                    }
                }

                self.closeViewer = function (event) {
                    $(event.currentTarget).closest("#" + config.controllerNameHtml).remove();
                    $scope.$destroy();
                    config.close();
                };

                self.getStoredForCad = function getStoredForCad() {
                    return new Promise(resolve => {
                        MF.api.get({
                            storedProcedureName: "core.DWG_Stored_for_cad",
                            data: {
                                ApplicationInstanceId: window.ApplicationInstanceId
                            }
                        }).then(function (result) {
                            if (!result[0]) {
                                console.log('Stored personalizzate non trovate.')
                                return
                            }

                            self.storedForCad = result[0];

                            resolve();
                        }, function (err) {

                            console.log(err);
                            resolve();
                        });
                    });
                }

                self.getNodeReftree = function getNodeReftree() {
                    MF.api.get({
                        storedProcedureName: self.storedForCad['BIM_GetPlAsset'] ? self.storedForCad['BIM_GetPlAsset'] : 'core.BIM_GetPlAsset',
                        data: {
                            ApplicationInstanceId: window.ApplicationInstanceId,
                            id: sourceItemIds
                        }
                    }).then(function (result) {
                        if (!result[0]) { return }

                        $.each(result[0], function (i, v) {
                            self.nodeReftree.push(v);
                        });
                    });
                }

                self.onGetSelectionViewer = function onGetSelectionViewer() {
                    MF.api.get({
                        storedProcedureName: self.storedForCad['BIM_GetSelectionViewer'] ? self.storedForCad['BIM_GetSelectionViewer'] : 'core.BIM_GetSelectionViewer',
                        data: {
                            ApplicationInstanceId: window.ApplicationInstanceId
                        }
                    }).then(function (result) {
                        if (!result[0]) return

                        $.each(result[0], function (i, v) {
                            i == 0 ? self.selectedTabFile = v : null;
                        });

                        self.selectionViewer = result[0];

                    }, function (err) {
                        console.log(err);
                    });
                }

                self.getReftreeModelBim = function getReftreeModelBim() {
                    self.reftreeModels = [];

                    return new Promise(resolve => {
                        MF.api.get({
                            storedProcedureName: self.storedForCad['BIM_GetModelContent'] ? self.storedForCad['BIM_GetModelContent'] : 'core.BIM_GetModelContent',
                            gridName: sourcegridname,
                            data: {
                                ApplicationInstanceId: window.ApplicationInstanceId,
                                id: sourceItemIds
                            }
                        }).then(function (result) {
                            if (!result[0]) {
                                resolve();
                            }

                            self.reftreeProjects = JSON.parse(result[0][0].project);

                            //$.each(self.reftreeProjects, function (i, p) {
                            //    //Forge.forgeViewer.getModelsByProjectId(project.id).then(m => {
                            //    //    p.modelBim.push(m);
                            //    //})
                            //})

                            $timeout();

                            resolve();
                        });
                    }, function (err) {
                        console.log('BIM_GetModelContent:' + err);
                        resolve();
                    });
                }

                self.onResetProject = function onResetProject() {
                    if (Forge.forgeViewer) {
                        Forge.forgeViewer.unloadViewable();
                    }

                    self.getReftreeModelBim()
                    self.showMenuDocument = true;
                    $timeout(function () {
                        doModal();
                    }, 50);
                }

                self.onSelectedProject = function onSelectedProject(p) {
                    doModal(true);
                    self.showMenuDocument = false;



                    $timeout(
                        function () {
                            Forge.getViewer("forgeViewer")

                            //                        .then(() => {

                            Forge.forgeViewer.viewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, self.onSelectedNodeChange);
                            Forge.forgeViewer.viewer.setSelectionMode(Autodesk.Viewing.SelectionMode.FIRST_OBJECT);

                            self.loadProject(p).then((modelToadd) => {
                                if (modelToadd.length == p.models.length) {
                                    $.each(p.modelBim, function (i, m) {
                                        m.start = true;
                                    })
                                }

                                doModal(false)

                                $timeout();
                                //}, function (err) {
                                //    doModal(false);

                                //    $timeout();
                                //});
                            });
                        }

                    , 1000)
                    //Forge.clearViewer();

                    
                }

                self.loadProject = function loadProject(project) {
                    return new Promise(resolve => {
                        Forge.forgeViewer.getModelsByProjectId(project.id).then(m => {
                            project.modelBim = [];

                            if (m.length == 0) {
                                kendoConsole.log("Nessun modello trovato conversione in atto.", true);
                                resolve();
                            } else {
                                modelToAdd = [];

                                let promiseList = new Promise(function (resolve, reject) {

                                    $.each(m, function (i, p) {
                                        Forge.forgeViewer.loadModel(p).then((model) => {
                                            self.onLoadTreeBim(model).then((modelBim) => {
                                                project.modelBim.push(modelBim);
                                                if (project.modelBim.length == m.length) {
                                                    resolve(project.modelBim);
                                                }
                                            });
                                        }), function (err) {
                                            console.log('Errore in loadModel');
                                            resolve();
                                        }
                                    })
                                })

                                Promise.all([promiseList]).then((arrList) => {
                                    if (arrList.length) {
                                        if (arrList[0].length == m.length) {



                                            console.log('finito caricamento modelli');

                                            resolve(arrList[0]);
                                        }
                                    }

                                    //if (arrList.length == modelToLoad.length) {
                                    //    console.log('finito caricamento modelli');
                                    //}
                                });
                            }
                        }, function (err) {
                            console.log('Errore loadModel modello: ' + err);

                            resolve([]);
                        });





                    }, function (err) {

                        resolve([]);
                    });
                }

                self.onLoadTreeBim = function onLoadTreeBim(modelBim) {
                    return new Promise(resolve => {

                        modelBim.elements = Forge.forgeViewer.getAllComponentsByCategoryPropertyValue("", "", "", undefined, undefined, modelBim.id).filter(
                            function (node) {
                                node.dbId = node.id;
                                node.Id = node.id;
                                node.parentId = node.parent ? node.parent : '#';
                                node.name = node.object.name;
                                node.showCheck = true;
                                node.show = true;
                                node.iconClass = 'glyphicon glyphicon-plus-sign';
                                node.iconClassDetail = 'glyphicon glyphicon-eye-open';
                                node.showIconDetail = true;
                                node.showHide = true;
                                node.pathTree = node.id;
                                node.checked = false;
                                node.showThemati = true;
                                node.iconThemati = 'glyphicon glyphicon-tasks';
                                node.showHideChange = false;
                                node.isIsolated = false;
                                node.isSelected = false;
                                node.style = '';
                                node.nodeChild = node.object.objects ? node.object.objects.length : '';

                                return node;
                            })

                        modelBim.getBulkProperties(modelBim.elements.map(function (ele) { return ele.dbId }), ['IfcGUID'],
                            function (elements) {
                                if (elements.length == 0) {
                                    resolve(modelBim);
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
                                resolve(modelBim);
                            })
                    })
                }

                self.onNodeDbClick = function onNodeDbClick(model, e) {                    
                    if (((window.event.shiftKey) && (window.event.ctrlKey)) || (window.event.shiftKey)) {

                        $("#spanNocr_" + e.modelId + '_' + e.dbId).css("color", "green").css("font-weight", "bold").css("font-size", "16px");
                        self.isolateNode.push(e);
                    } else {
                        $('span[id *="spanNocr_"]').css('color', '').css('font-size', '').css('font-weight', '');
                        self.isolateNode = [];
                        $("#spanNocr_" + e.modelId + '_' + e.dbId).css("color", "green").css("font-weight", "bold").css("font-size", "16px");
                        self.isolateNode.push(e);
                    }

                    Forge.forgeViewer.isolate(model, self.isolateNode.map(function (dbId) { return dbId.dbId }));
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

                self.init = function init() {
                    self.resizeMenuReftree();

                    self.getStoredForCad().then(() => {
                        self.getNodeReftree();


                        //self.onGetSelectionViewer();  
                    });
                }

                self.init();
            }
        ]);


});