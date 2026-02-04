define([
    "angular", 
    "MagicSDK", 
    "zip", 
    "lodash",
    window.includesVersion + "/Views/3/Js/Forge_viewer_2.js",
    ],
function (angular, zip) {
    angular
        .module("bimForge", [])
        .directive("bimForge",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    link: function (scope, element, attr) {
                        console.log(scope);
                    },
                    bindToController: {
                        onInitViewer: "=",
                        project: "=",
                        forgeSpinnerCheck: '=',
                        onLoadModelReturn: '=',
                        onGetAllLeafComponents: '=',
                        onRefreshViewer: '=',
                        onHideShowNode: '=',
                        onGetSelectedNode: '=',
                        setCustomToolbar: '=',
                        showSidenav: '=',
                        fileToLoad: '=',
                        onIsolate: '=',
                        onClearColors:'=',
                    },
                    templateUrl: window.includesVersion + '/Views/3/templates/bim-forge.html',
                    controllerAs: "b",
                    controller: [
                        '$scope',
                        '$element',
                        '$timeout',
                        '$sce',
                        function ($scope, $element, $timeout, $sce) {
                            var self = this;
                            self.models = [];
                            self.nodesSelected = [];

                            //$scope.$watchCollection('b.models', function (models) {
                            //    $.each(models, function (i, v) {
                            //        var nodes = 'b.models[' + i + '].elements'
                            //        $scope.$watchCollection(nodes, function (ii) {
                            //            $.each(ii, function (iii, vv) {
                            //                $scope.$watch('b.models[' + i + '].elements[' + iii + '].isIsolated', function (val, oldVal) {
                            //                    console.log(val)
                            //                });
                            //            })
                            //        });
                            //    });
                            //});


                            $scope.$watchCollection('b.models', function (models) {
                                $.each(models, function (i, v) {
                                    var nodes = 'b.models[' + i + '].isolatedNodes'
                                    $scope.$watchCollection(nodes, function (m) {
                                        self.onIsolate(v, m);
                                    });
                                });
                            });


                            $scope.$watchCollection('b.models', function (models) {
                                $.each(models, function (i, v) {
                                    var nodes = 'b.models[' + i + '].isolatedNodes'
                                    $scope.$watchCollection(nodes, function (m) {    
                                        self.onIsolate(v, m);
                                    });
                                });
                            });

                            $scope.$watchCollection('b.models', function (models) {
                                $.each(models, function (i, v) {
                                    var nodes = 'b.models[' + i + '].selectedNodes'
                                    $scope.$watchCollection(nodes, function (newOne, oldOne) {
                                        console.log(newOne)
                                        console.log(oldOne)                                        
                                    });
                                });
                            });


                            $scope.$watch('b.project', function (newOne, oldOne) {
                                self.onUnloadViewable();
                                if (!jQuery.isEmptyObject(newOne)) {
                                    self.loadProject(newOne);
                                }                             
                            });

                            $scope.$watch('b.onHideShowNode', function (newOne, oldOne) {                                
                                if (!jQuery.isEmptyObject(newOne)) {
                                    self.onShowHide(newOne);
                                }
                            });
                             
                            $scope.$watch('b.onRefreshViewer', function (newOne) {
                                if (newOne) {
                                    self.onRefreshModel()                                
                                } 
                            });

                            $scope.$watch('b.onClearColors', function (newOne) {
                                if (!jQuery.isEmptyObject(newOne)) {
                                    self.onClearColors(newOne);
                                }
                            });

                            self.onUnloadViewable = function onUnloadViewable() {                                
                                if (Forge) {
                                    Forge.models = [];
                                    if (Forge.viewer) {
                                        Forge.viewer = null;
                                        Forge.viewer = Forge.getViewer("forgeViewer");
                                    }
                                }
                            }

                            self.loadProject = function loadProject(project) {   
                                if (jQuery.isEmptyObject(Forge.forgeViewer)) {
                                    kendoConsole.log("Forge viewer non disponibile.", true);
                                    if (self.onLoadModelReturn) {
                                        self.onLoadModelReturn();
                                    }

                                    return

                                } else {
                                    Forge.forgeViewer.viewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, self.onSelectedNodeChange);
                                    Forge.forgeViewer.viewer.setSelectionMode(Autodesk.Viewing.SelectionMode.FIRST_OBJECT);


                                    if (self.setCustomToolbar) {
                                        self.onCustomToolBarActivate();
                                    }

                                    Forge.forgeViewer.getModelsByProjectId(project.idKey).then(models => {
                                        if (models.length == 0) {
                                            kendoConsole.log("Nessun modello trovato conversione in atto.", true);
                                            if (self.onLoadModelReturn) {
                                                self.onLoadModelReturn();
                                            }
                                            return
                                        } else {
                                            var modelToLoad = [];
                                            $.each(self.project.files, function (i, file) {
                                                $.each(models, function (ii, model) {
                                                    if (model.name == file.fileName) {
                                                        modelToLoad.push(model);
                                                    }
                                                })
                                            })


                                            let promiseList = new Promise(function (resolve, reject) {
                                                if (modelToLoad.length == 0) {
                                                    if (self.onLoadModelReturn) {
                                                        


                                                        self.onLoadModelReturn(arrList);
                                                    }

                                                    return
                                                }

                                                $.each(modelToLoad, function (i, p) {
                                                    if (p.id != 8) {
                                                        self.onLoadModel(p).then((model) => {
                                                            resolve(model);
                                                        }), function (err) {
                                                            console.log('Errore in loadModel');
                                                            resolve();
                                                        }
                                                    } else {
                                                        resolve();
                                                    }
                                                })
                                            })

                                            //if (!jQuery.isEmptyObject(promiseList)) {
                                            Promise.all([promiseList]).then((arrList) => {
                                                if (arrList.length == modelToLoad.length) {
                                                    if (self.onLoadModelReturn) {
                                                        self.models = arrList;

                                                        self.onLoadModelReturn(arrList);
                                                    }
                                                }
                                            });
                                            //}
                                        }
                                    }), function (err) {
                                        console.log('Errore in getModelsByProjectId')
                                        if (self.onLoadModelReturn) {
                                            self.onLoadModelReturn();
                                        }
                                    }

                                }

                                
                            }
 
                            self.onLoadModel = function onLoadModel(model) {
                                return new Promise(resolve => {
                                    Forge.forgeViewer.loadModel(model).then(m => {
                                        m.elements = [];
                                        m.selectedNodes = [];
                                        m.isolatedNodes = [];
                                        $timeout();

                                        resolve(m);

                                    }, function (err) {
                                        console.log('Errore loadModel modello: ' + err);
                                        resolve();
                                    }
                                    );
                                }, function (err) {
                                    resolve();
                                    });
                            }

                            self.onRefreshModel = function onRefreshModel() {   
                                $.each(Forge.forgeViewer.models, function (i,model) {
                                    var rootId = model.getData().instanceTree.getRootId()
                                    Forge.forgeViewer.viewer.show(rootId, model);
                                    Forge.forgeViewer.viewer.fitToView(null, model);
                                    Forge.forgeViewer.viewer.clearSelection();
                                    Forge.forgeViewer.viewer.start();
                                })
                               
                                if (self.onLoadModelReturn) {
                                    self.onLoadModelReturn(Forge.forgeViewer.models);
                                }

                                self.onRefreshViewer = false;
                            }

                            self.onSelectedNodeChange = function onSelectedNodeChange(e) {
                                e.target.impl.setSelectionColor(new THREE.Color(1, 0, 0));


                                e.selections.map(function (s) {
                                    $.map(s.nodeArray, function (dbId) {
                                        
                                        var node = Forge.forgeViewer.getComponentByModel(s.model.id ,dbId);

                                        console.log(node)


                                    })
                                })
                                

                                return self.onGetSelectedNode(e);                            
                            }

                            self.onIsolate = function onIsolate(model, nodes) {
                                var dbIds = [];

                                function getElemetsChild(parent, child) {
                                    child.isIsolated = parent.isIsolated;
                                    child.style = parent.style;

                                    $.each(child.children, function (i, v) {
                                        getElemetsChild(child, v);
                                    });
                                }
                                 
                                self.refreshStyleTree(model,'is-isolated');

                                $.each(nodes, function (i, v) {
                                    v.isIsolated = true;
                                   
                                    v.style = v.style + ' is-isolated'
                                    dbIds.push(v.dbId);
                                    $.each(v.children, function (ii, vv) {
                                        getElemetsChild(v, vv);
                                    })
                                })

                                Forge.forgeViewer.isolate(model, dbIds);
                            }

                            self.refreshStyleTree = function (model,style) {
                                function getElemetsChild(parent, child) {

                                    child.isIsolated = parent.isIsolated;
                                    child.isSelected = parent.isSelected;
                                    child.style = parent.style;
                                    

                                    $.each(child.children, function (i, v) {
                                        getElemetsChild(child, v);
                                    });

                                }

                                $.each(model.elements, function (i, v) {
                                    if (style == 'is-isolated') {
                                        v.isIsolated = false;
                                        v.style = v.style.replace('is-isolated', '');
                                    } else if (v.isIsolated = false) {
                                        v.isSelected = true;
                                        v.style = v.style.replace('is-selected', '');                                        
                                    }
                                    
                                    $.each(v.children, function (ii, vv) {
                                        getElemetsChild(v, vv);
                                    })
                                });
                            }

                            self.onShowHide = function onShowHide(nodes) {                              
                                nodes.show ? Forge.forgeViewer.show(nodes.model, nodes.dbId) : Forge.forgeViewer.hide(nodes.model, nodes.dbId)        
                            }

                            self.onCustomToolBarActivate = function onCustomToolBarActivate() {
                                AutodeskNamespace('Autodesk.Research.TtIf.Extension');

                                Autodesk.Research.TtIf.Extension.Toolbar = function (viewer, options) {
                                    Autodesk.Viewing.Extension.call(this, viewer, options);
                                    var _viewer = viewer;
                                    var _this = this;

                                    _this.load = function () {
                                        createToolbar();
                                        console.log('Autodesk.Research.TtIf.Extension.Toolbar loaded');
                                        return true;
                                    };

                                    _this.unload = function () {
                                        deleteToolbar();
                                        console.log('Autodesk.Research.TtIf.Extension.Toolbar unloaded');
                                        return true;
                                    };

                                    function createToolbar() {
                                        var toolbar = new Autodesk.Viewing.UI.ToolBar('toolbar-TtIf');
                                        var ctrlGroup = new Autodesk.Viewing.UI.ControlGroup(
                                            'Autodesk.Research.TtIf.Extension.Toolbar.ControlGroup'
                                        );
                                        ctrlGroup.addClass('toolbar-vertical-group');

                                        // Names, icons and tooltips for our toolbar buttons

                                        var names = ['CGB1', 'CGB2', 'CGB3'];
                                        var icons = ['dashboard', 'tasks', 'flash'];
                                        var tips = ['Modelli', 'Tematismi', 'Proprietà'];

                                        names = ['CGB3']
                                        icons = ['tasks']
                                        tips = ['Proprietà']

                                        // Operations for when the buttons are clicked
                                        var clicks = [
                                            function () {
                                                self.forgeViewerState = Forge.forgeViewer.viewer.getState();
                                                var excludedFragIds = [];
                                                var iFloorId = [333,1839,3430,4524]
                                                $.each(iFloorId, function (ii, vv) {
                                                    $.each(Forge.forgeViewer.getAllChildrenComponent(vv), function (i, v) {
                                                        excludedFragIds.push(v.id)
                                                    })
                                                })
                                                 
                                                self.onSelectiveExplode(Forge.forgeViewer, 1, excludedFragIds, Forge.forgeViewer.models[0]);
                                                Forge.forgeViewer.viewer.impl.sceneUpdated(true);
                                            },
                                            function () {
                                                console.log('Temperature clicked');
                                            },
                                            function () {
                                                console.log('Power clicked');
                                            }
                                        ]
                                        // Operations for when buttons are unclicked (i.e. toggled off)
                                        // If false, then the button won't have any 'state'    var unclicks =
                                        var unclicks =
                                            [
                                                function () {
                                                    console.log('Dashboard clicked');
                                                    self.forgeViewerState = Forge.forgeViewer.viewer.getState();
                                                    var excludedFragIds = [];
                                                    var iFloorId = [333, 1839, 3430, 4524]
                                                    $.each(iFloorId, function (ii, vv) {
                                                        $.each(Forge.forgeViewer.getAllChildrenComponent(vv), function (i, v) {
                                                            excludedFragIds.push(v.id)
                                                        })
                                                    })
                                                    
                                                    self.onSelectiveExplode(Forge.forgeViewer, 0, excludedFragIds, Forge.forgeViewer.models[0]);
                                                    Forge.forgeViewer.viewer.impl.sceneUpdated(true);
                                                    //Forge.forgeViewer.viewer.restoreState(self.forgeViewerState);
                                                    //Forge.forgeViewer.viewer.impl.sceneUpdated(true)       
                                                },
                                                function () {
                                                    console.log('Temperature clicked');
                                                }
                                            ]
                                        // The loop to create our buttons
                                        var button;

                                        for (var i = 0; i < names.length; i++) {
                                            // Start by creating the button
                                            button = new Autodesk.Viewing.UI.Button(
                                                'Autodesk.Research.TtIf.Extension.Toolbar.' + names[i]
                                            );

                                            // Assign an icon
                                            if (icons[i] && icons[i] !== '') {
                                                button.icon.classList.add('myicon');
                                                button.icon.classList.add('glyphicon');
                                                button.icon.classList.add('glyphicon-' + icons[i]);
                                            }

                                            // Set the tooltip
                                            button.setToolTip(tips[i]);

                                            // Only create a toggler for our button if it has an unclick operation
                                            if (unclicks[i]) {
                                                button.onClick = createToggler(button, clicks[i], unclicks[i]);
                                            } else {
                                                button.onClick = clicks[i];
                                            }
                                            ctrlGroup.addControl(button);
                                        }
                                        toolbar.addControl(ctrlGroup);

                                        var toolbarDivHtml = '<div id="divToolbar"> </div>';
                                        $(_viewer.container).append(toolbarDivHtml);

                                        // We want our toolbar to be centered vertically on the page
                                        toolbar.centerToolBar = function () {
                                            $('#divToolbar').css({
                                                'top': 'calc(50% + ' + toolbar.getDimensions().height / 2 + 'px)'
                                            });
                                        };

                                        toolbar.addEventListener(
                                            Autodesk.Viewing.UI.ToolBar.Event.SIZE_CHANGED,
                                            toolbar.centerToolBar
                                        );

                                        // Start by placing our toolbar off-screen (top: 0%)

                                        $('#divToolbar').css({
                                            'top': '0%',
                                            'left': '0%',
                                            'z-index': '100',
                                            'position': 'absolute'
                                        });

                                        $('#divToolbar')[0].appendChild(toolbar.container);
                                        // After a delay we'll center it on screen
                                        setTimeout(function () {
                                            toolbar.centerToolBar();
                                        }, 100);
                                    }

                                    function deleteToolbar() {
                                        $('#divToolbar').remove();
                                    }

                                    function createToggler(button, click, unclick) {
                                        return function () {
                                            var state = button.getState();
                                            if (state === Autodesk.Viewing.UI.Button.State.INACTIVE) {
                                                button.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
                                                click();
                                            } else if (state === Autodesk.Viewing.UI.Button.State.ACTIVE) {
                                                button.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
                                                unclick();

                                            }
                                        };
                                    }

                                    function setVisibility(panel, flag) {
                                        if (panel)
                                            panel.setVisible(flag);
                                    }

                                    var css = [
                                        '.myicon {',
                                        'font-size: 20px;',
                                        'padding-top: 1px !important;',
                                        '}',
                                        '.toolbar-vertical-group > .adsk-button > .adsk-control-tooltip {',
                                        'left: 120%;',
                                        'bottom: 25%;',
                                        '}'
                                    ].join('\n');
                                    $('<style type="text/css">' + css + '</style>').appendTo('head');
                                };

                                Autodesk.Research.TtIf.Extension.Toolbar.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
                                Autodesk.Research.TtIf.Extension.Toolbar.prototype.constructor = Autodesk.Research.TtIf.Extension.Toolbar;
                                Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.Research.TtIf.Extension.Toolbar', Autodesk.Research.TtIf.Extension.Toolbar);

                                Forge.forgeViewer.viewer.loadExtension('Autodesk.Research.TtIf.Extension.Toolbar').then(
                                    (toolbar) => {
                                        toolbar.activate();
                                    })
                            }

                            self.onSelectiveExplode = function onSelectiveExplode(viewer, scale, excludedFragIds, model) {
                                model = model || viewer.model

                                var svf = model.getData();
                                var mc = model.getVisibleBounds(true).center();
                                var fragList = model.getFragmentList();
                                var pt = new THREE.Vector3();

                                //Input scale is in the range 0-1, where 0
                                //means no displacement, and 1 maximum reasonable displacement.
                                scale *= 2;

                                //If we have a full part hierarchy we can use a
                                //better grouping strategy when exploding
                                if (svf.instanceTree && svf.instanceTree.nodeAccess.nodeBoxes && scale !== 0) {

                                    var scaledExplodeDepth = scale * (svf.instanceTree.maxDepth - 1) + 1;
                                    var explodeDepth = 0 | scaledExplodeDepth;
                                    var currentSegmentFraction = scaledExplodeDepth - explodeDepth;

                                    var it = svf.instanceTree;
                                    var tmpBox = new Float32Array(6);

                                    (function explodeRec(nodeId, depth, cx, cy, cz, ox, oy, oz) {

                                        var oscale = scale * 2;

                                        // smooth transition of this tree depth
                                        // from non-exploded to exploded state
                                        if (depth == explodeDepth)
                                            oscale *= currentSegmentFraction;

                                        it.getNodeBox(nodeId, tmpBox);

                                        //var mycx = 0.5 * (tmpBox[0] + tmpBox[3]);
                                        var mycy = 0.5 * (tmpBox[1] + tmpBox[4]);
                                        var mycz = 0.5 * (tmpBox[2] + tmpBox[5]);

                                        if (depth > 0 && depth <= explodeDepth) {
                                            var dx = (mycx - cx) * oscale;
                                            //  var dy = (mycy - cy) * oscale;
                                            var dz = (mycz - cz) * oscale;

                                            //var omax = Math.max(dx, Math.max(dy, dz));
                                            //ox += dx;
                                            oy += dy;
                                            oz += dz;
                                        }

                                        svf.instanceTree.enumNodeChildren(nodeId, function (dbId) {

                                            explodeRec(dbId, depth + 1, mycx, mycy, mycz, ox, oy, oz);

                                        }, false);

                                        svf.instanceTree.enumNodeFragments(nodeId, function (fragId) {

                                            if (excludedFragIds.indexOf(fragId.toString()) < 0) {

                                                pt.x = ox;
                                                pt.y = oy;
                                                pt.z = oz;

                                                fragList.updateAnimTransform(fragId, null, null, pt);
                                            }

                                        }, false);

                                    })(svf.instanceTree.getRootId(), 0, mc.x, mc.y, mc.x, 0, 0, 0);

                                } else {

                                    var boxes = fragList.fragments.boxes;

                                    var nbFrags = fragList.getCount()

                                    for (var fragId = 0; fragId < nbFrags; ++fragId) {

                                        if (excludedFragIds.indexOf(fragId) < 0) {

                                            if (scale == 0) {

                                                fragList.updateAnimTransform(fragId);

                                            } else {

                                                var box_offset = fragId * 6;

                                                var cx = 0.5 * (boxes[box_offset] + boxes[box_offset + 3]);
                                                var cy = 0.5 * (boxes[box_offset + 1] + boxes[box_offset + 4]);
                                                var cz = 0.5 * (boxes[box_offset + 2] + boxes[box_offset + 5]);

                                                cx = scale * (cx - mc.x);
                                                cy = scale * (cy - mc.y);
                                                cz = scale * (cz - mc.z);

                                                pt.x = cx;
                                                pt.y = cy;
                                                pt.z = cz;

                                                fragList.updateAnimTransform(fragId, null, null, pt);
                                            }
                                        }
                                    }
                                }
                            }

                            self.onClearColors = function onClearColors(model) {

                                Forge.forgeViewer.clearColors(model);
                            }

                            Forge.init().then(() => {
                                Forge.viewer = Forge.getViewer("forgeViewer");
                            }, reject => {
                                console.log('Forge-init error');
                            })
                         }
                    ]
                }
            }
    );
    }
);
