(function () {
    var dependencies = ["angular", "MagicSDK", "angular-search-drop", "angular-filter"],
        angular,
        MF,
        controllerName = "BIM";

   
    var custom3rdPartyPath = window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/bim/",
        BIMSurferPath = custom3rdPartyPath + "BIMsurfer/",
        BIMJSApiPath = custom3rdPartyPath + "BIMserver-JavaScript-API/",
        baseUrl = requirejs.s.contexts._.config.baseUrl,
        client = null,
        bimServerUrl = "/api/BimCaller/callApiMethod",
        flatTreeSearchVals = {};

    //is added to restore requirejs base url in case of user intervention
    window.addEventListener("beforeunload", beforelUnload);
    //loadCss(["css/tree"], BIMSurferPath);

    define(dependencies, function (a, b) {
        angular = a;
        MF = b;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true, false, "templateReady"))[0];
        angular.bootstrap(element, [controllerName]);
    }

    function restoreBaseRequireUrl() {
        requirejs.config({
            baseUrl: baseUrl
        });
    }

    function beforelUnload() {
        restoreBaseRequireUrl();
        window.removeEventListener("beforeunload", beforelUnload);
    }

    function login() {
        var deferred = $.Deferred();
        if (!client)
        {
            callApiMethod("AuthInterface", "login", { username: "", password: "" }).then(function (res) {
                client = { token: res.response.result };
                deferred.resolve(client.token);
            });
        }
        else
            deferred.resolve(client.token);
        return deferred.promise();
    }

    function callApiMethod(interfaceName, methodName, data)
    {
        var payload = {
            request: {
                "interface": interfaceName,
                "method": methodName,
                "parameters": data
            }
        }
        if (client && client.token)
            payload.token = client.token;
        return $.ajax({
            url: bimServerUrl,
            data: JSON.stringify(payload),
            type: "POST", contentType: "application/json; charset=utf-8",dataType:"JSON"
        });
    }

    function getProjects() {
        return callApiMethod("ServiceInterface", "getAllProjects", {
            "onlyTopLevel": "true",
            "onlyActive": "true"
        });
    }

    function getAssets() {
        return MF.api.get({ //#felixnottodo
            table: "bim.BIM_V_PROJECTS",
            where: "bimServerPublished = 1",
            order: "AS_ASSET_DESCRIPTION, BIM_PROJECT_CODE"
        })
    }

    function getAllRevisionsOfProject(poid) {
        return callApiMethod("ServiceInterface", "getAllRevisionsOfProject", {
            "poid": poid
        });
    }

    function getAllRelatedProjects(poid)
    {
        return callApiMethod("ServiceInterface", "getAllRelatedProjects", {
            "poid": poid
        });

    }

    function synchDB(poid,roid,treeData,token)
    {
        return callApiMethod("RefTreeInterface", "synchdb", {
            "poid": poid,
            "roid": roid,
            "treeData": treeData,
            "requestObject": {
                "token": token,
                "request": {
                    "interface":"LowLevelInterface",
                    "method":"getDataObjectByOid",
                    "parameters": {
                        "roid": roid,
                        "oid": null
                    }
                }
            },
            "requestGeometryInfo": {
                "token": token,
                "request": {
                    "interface": "ServiceInterface",
                    "method": "getGeometryInfo",
                    "parameters": {
                        "roid": roid,
                        "oid":null
                    }
                }
            }
        });
    }
    //models are the bimSurfer models
    function createTreeHtml(tree, depth, roid, dbItems, model) {
        if (tree.roid)
            roid = tree.roid;
        flatTreeSearchVals[tree.id] = tree;
        var statusClass = function ()
        {
            if (depth < 3)//level 2 is the asset which is always linked to database.
                return '';
            if (!dbItems || !dbItems[tree.id])
                return '<i class="fa fa-chain-broken pull-right" aria-hidden="true"></i>';
            if (dbItems[tree.id].targetId)
                return '<i class="fa fa-link pull-right" aria-hidden="true"></i>';
            //ToDo  manage an element which is in DB but not into the IFC .... 
        }
        var ifcType = "";
        if (model && model.get)
            model.get(tree.id, function (data) {
                ifcType = data.object._t;
            });
        var html = '<li data-initially-expanded="' + (depth > 1 ? "false" : "true") + '" data-expanded="' + (depth > 1 ? "false" : "true") + '" data-ifctype="'+ ifcType +'" data-id="' + tree.id + '" data-roid="' + (roid  ? roid : '') + '" >';
        html += tree.name + statusClass();
        if (tree.children && tree.children.length) {
            html += '<ul data-initially-expanded="' + (depth > 1 ? "false" : "true") + '" data-expanded="' + (depth > 1 ? "false" : "true") + '">';
            $.each(tree.children, function (k, v) {
                html += createTreeHtml(v, depth + 1, tree.roid ? tree.roid : roid, dbItems, model);
            })
            html += '</ul>';
        }
        return html + "</li>";
    }

    function selectTreeItem($tree, $el,selectedCallback) {
        var tree = $tree.data("kendoTreeView");
        var duration = tree.options.animation.collapse.duration;
        tree.options.animation.collapse.duration = 0;
        $('.item-selected', $tree).removeClass('item-selected');
        tree.collapse(".k-item[aria-expanded=true]");
        setTimeout(function () { 
            //tree.select($el);
            if ($el) {
                $el.each(function () {
                    if (selectedCallback)
                        selectedCallback();
                    $(this)
                        .find('.k-in')
                        .addClass('item-selected');
                    tree.expandTo(tree.dataItem($(this)));
                });
            }
            tree.options.animation.collapse.duration = duration;
        }, 0);
    }

    function getIdsOfAllChildren(node, ids) {
        if (!ids)
            ids = [];
        if (!node.children || (node.children && !node.children.length)) {
            if (node.gid)
                ids.push(node.roid + ":" + node.id);
        }
        else {
            $.each(node.children, function (k, node) {
                getIdsOfAllChildren(node,ids);
            });
        }
        return ids;
    }

    function controller(angular, MF) {
        angular
            .module(controllerName, ["searchDrop", "angular.filter"])
            .controller(controllerName + "Controller", [
                '$timeout',
                '$scope',
                '$element',
                function ($timeout, $scope, $element) {
                    var self = this,
                        token,
                        kendoTree,
                        $tree,
                        shallSelect = true,
                        treeSelectionIds = [],
                        ifcTypes,
                        $typeSelector,
                        templateReady = $.Deferred();

                    $element = $element.parent();
                    self.metadata = null;
                    self.trees = {};
                    self.modelsToLoad = 0;
                    self.modelsLoaded = 0;
                    self.showTreeAndRenderingArea = false;
                    self.templateReady = function () {
                            templateReady.resolve();
                    };

                    requirejs.config({
                        baseUrl: BIMJSApiPath
                    });
                    require([
                        "bimserverclient",
                        "model",
                        "bimserverapiwebsocket",
                        "bimserverapipromise",
                        "geometry",
                        "ifc2x3tc1",
                        "ifc4",
                        "translations_en",
                    ], function () {
                        requirejs.config({
                            baseUrl: BIMSurferPath
                        });
                        require([
                            "BimSurfer",
                            "StaticTreeRenderer",
                            "MetaDataRenderer",
                            "../lib/domReady!"
                        ], function (BimSurfer, StaticTreeRenderer, MetaDataRenderer) {
                            var bimSurfer = null;
                            restoreBaseRequireUrl();
                            self.selectedProjectId = null;
                            self.selectedRevision = null;
                            self.currentProject = null;
                            self.currentRevision = null;
                            self.projects = [];
                            self.assets = [];
                            self.revisions = [];
                            self.dataContainerOpened = true;

                            templateReady.then(function () {

                                login().then(function (token) {
                                    //getProjects().then(function (projects) {
                                    //    self.projects = projects.response.result;
                                    //    $timeout();
                                    //});
                                    getAssets().then(function (assets) {
                                        self.assets = $.map(assets, function (asset) {
                                            return {
                                                asset: asset.AS_ASSET_DESCRIPTION + " - " + asset.AS_ASSET_ADDRESS,
                                                oid: asset.bimServerProjectId,
                                                name: asset.BIM_PROJECT_DESCRIPTION || asset.BIM_PROJECT_CODE,
                                                hasSubProjects: asset.HasSubProjects,
                                                HasToImportRawData: asset.HasToImportRawData
                                            };
                                        });
                                        $timeout();
                                    });
                                });

                                self.initSurfer = function () {
                                    bimSurfer = new BimSurfer({
                                        domNode: "bim-viewer"
                                    });

                                    bimSurfer.on("loading-finished", function () {
                                        if (self.modelsLoaded == self.modelsToLoad) {
                                            ifcTypes = [];
                                            bimSurfer.getTypes().forEach(function (ifc_type) {
                                                ifcTypes.push(ifc_type.name);
                                                var on = ifc_type.visible;
                                                var $typeButton = $('<div class="btn btn-' + (on ? "success" : "default") + ' btn-xs"><i class="fa fa-eye ' + (on ? "active" : "inactive") + '">' + ifc_type.name + '</i></div>');
                                                $typeButton.click(function () {
                                                    $typeButton.toggleClass("btn-default").toggleClass("btn-success");
                                                    $typeButton.find("i").toggleClass("inactive").toggleClass("active");
                                                    bimSurfer.setVisibility({ types: [ifc_type.name], visible: $typeButton.hasClass("btn-success") });
                                                });
                                                $typeSelector.append($typeButton);
                                            });
                                            self.treeSearchVals = flatTreeSearchVals;
                                            $timeout();

                                            var tree = null;
                                            if (Object.keys(self.trees).length > 1) {
                                                tree = {
                                                    id: self.currentProject.oid,
                                                    name: self.currentProject.name,
                                                    children: $.map(self.trees, function (v, k) {
                                                        return $.extend(v, { roid: k.split(":")[1] })
                                                    })
                                                }
                                            }
                                            else
                                                tree = self.trees[self.currentProject.oid + ":" + self.currentRevision.oid];

                                            $tree = $element.find("#treeContainer .tree-root").html(createTreeHtml(tree, 0,null,self.dbItems,self.models[tree.poid]));
                                            if (kendoTree) {
                                                kendoTree.destroy();
                                            }
                                            $tree = $element.find("#treeContainer .tree-root").html(createTreeHtml(tree, 0, null, self.dbItems, self.models[tree.poid]));
                                            kendoTree = $tree.kendoTreeView({
                                                select: function (e) {
                                                    var SELCLASS = 'item-selected',
                                                        SELECTOR = '.' + SELCLASS,
                                                        node = $(e.node).closest('.k-item'),
                                                        kin = node.find('> div span.k-in'),
                                                        isSel = kin.is(SELECTOR);

                                                    node.find(SELECTOR).removeClass(SELCLASS);
                                                    $.each(node.parentsUntil('.k-treeview ', '.k-item'), function () {
                                                        $(this).find('> div span.k-in').filter(SELECTOR).removeClass(SELCLASS);
                                                    });

                                                    if (!isSel)
                                                        kin.addClass(SELCLASS);
                                                    else
                                                        kin.removeClass(SELCLASS);

                                                    setTimeout(function () {
                                                        $('.k-state-focused', e.node).removeClass('k-state-focused');
                                                    }, 0);

                                                    shallSelect = false;
                                                    var ids = [],
                                                        roids = [];
                                                    self.enableActions = false;
                                                    $('.item-selected', e.sender.element).each(function () {
                                                        self.enableActions = true;
                                                        var $node = $(this).closest('[data-id]');
                                                        roids.push($node.data("roid"));
                                                        ids.push($node.data("id"))
                                                    });

                                                    self.setRevisionSelection(ids, roids);

                                                    e.preventDefault();
                                                    return true;
                                                }
                                            }).data("kendoTreeView");
                                            self.showTreeAndRenderingArea = true;
                                        }
                                    });
                                }
                              
                                //clear viewer and the type filters section
                                self.initViewer = function (options) {
                                    self.showTreeAndRenderingArea = false;
                                    self.treeSearchVals = null;
                                    self.trees = {};
                                    self.models = {};
                                    self.modelsLoaded = 0;
                                    if (options.modelsToLoad)
                                        self.modelsToLoad = options.modelsToLoad;

                                    var $viewer = $('#bim-viewer');
                                    $viewer.replaceWith($viewer.clone().html(''));
                                    self.initSurfer();
                        
                                    if (!$typeSelector)
                                        $typeSelector = $("#typeSelector");
                                    $typeSelector.html("");
                                }

                                self.drawRevision = function (options) {
                                    var deferred = $.Deferred();
                                    var projectToDraw = { oid: options.poid, name: options.name };
                                    var revisionToDraw = { oid: options.roid };
                                   //gets the database objects for the given project 
                                    MF.api.getDataSet({
                                        bimServerProjectId: options.poid
                                    }, "bim.usp_GetAssetItems").then(
                                    function (dbItems) {
                                        self.dbItems = {};
                                        if (dbItems.length)
                                            $.each(dbItems[0], function (i, v) {
                                                self.dbItems[v.oid] = v;
                                            });
                                        
                                        bimSurfer.load({
                                            bimserver: bimServerUrl,
                                            token: client.token,
                                            poid: projectToDraw.oid,
                                            roid: revisionToDraw.oid,
                                            schema: "ifc2x3tc1" // < TODO: Deduce automatically
                                        }).then(function (model) {
                                            model.getTree().then(function (tree) {
                                                self.models[projectToDraw.oid] = model.model;
                                                self.modelsLoaded = self.modelsLoaded + 1;
                                                tree.name = projectToDraw.name;
                                                tree.poid = projectToDraw.oid;
                                                self.trees[projectToDraw.oid + ":" + revisionToDraw.oid] = tree;
                                                var roidAdder = function (roid, tree) {
                                                    tree.roid = roid;
                                                    if (tree.children)
                                                        $.each(tree.children, function (i, v) {
                                                            roidAdder(roid, v);
                                                        });
                                                };
                                                roidAdder(revisionToDraw.oid, tree);
                                                // Build a tree view of the elements in the model. The fact that it
                                                // is 'static' refers to the fact that all branches are loaded and
                                                // rendered immediately.
                                                /*var domtree = new StaticTreeRenderer({
                                                    domNode: 'treeContainer'
                                                });
                                                domtree.addModel({name: "", id: self.currentRevision.oid, tree:tree});
                                                domtree.build();*/

                                                // Add a widget that displays metadata (IfcPropertySet and instance
                                                // attributes) of the selected element.
                                                if (!self.metadata)
                                                    self.metadata = new MetaDataRenderer({
                                                        domNode: 'dataContainer'
                                                    });
                                                self.metadata.addModel({ name: projectToDraw.name, id: revisionToDraw.oid, model: model });

                                                //set selection-changed handler only once! bug on subprojects
                                                if (!bimSurfer.handlers["selection-changed"]) {
                                                    bimSurfer.on("selection-changed", function (selected) {
                                                        if (!selected.length)
                                                            return;
                                                        self.metadata.setSelected(selected);
                                                        if (shallSelect) {
                                                            var objectIds = $.map(selected, function (s) {
                                                                var oid = s.split(':')[1];
                                                                if (oid in model.model.objects)
                                                                    return model.model.objects[oid].object.id;
                                                            });
                                                            selectTreeItem($tree, self.findTreeElementById(treeSelectionIds.length ? treeSelectionIds : objectIds), function () {
                                                                $scope.bim.enableActions = true;
                                                                $timeout();
                                                            });
                                                        }
                                                        shallSelect = true;
                                                        treeSelectionIds = [];
                                                        //domtree.setSelected(selected, domtree.SELECT_EXCLUSIVE);
                                                    });
                                                }
                                                deferred.resolve();
                                                /*domtree.on("click", function (oid, selected) {
                                                    // Clicking an explorer node fits the view to its object and selects
                                                    if (selected.length) {
                                                        bimSurfer.viewFit({
                                                            ids: selected,
                                                            animate: true
                                                        });
                                                    }
                                                    bimSurfer.setSelection({
                                                        ids:selected,
                                                        clear:true,
                                                        selected:true
                                                    });
                                                });*/

                                            });
                                        });
                                    });
                                    return deferred.promise();
                                };
                                self.drawRevisionsSequentially = function(queueOfProjects)
                                {
                                    var func = self.drawRevision;
                                    var promise = func(queueOfProjects[0]);
                                    var j = 0;
                                    for (var i = 1; i < queueOfProjects.length; i++)
                                        promise = promise.then(function (tree) {
                                            j++;
                                            setTimeout(function () {
                                                func(queueOfProjects[j]);
                                            }, 1000);
                                        });
                                };
                                self.findTreeElementById = function (ids) {
                                    if (!ids || typeof ids != "number" && !ids.length)
                                        return;

                                    if (!$.isArray(ids))
                                        ids = [ids];

                                    return $tree.find("[data-id=" + ids.join('], [data-id=') + "]")
                                };

                                self.onTreeSearchSelect = function (id) {
                                    if (!id) {
                                        return;
                                    }
                                    shallSelect = false;
                                    selectTreeItem($tree, self.findTreeElementById(id), function () {
                                        $scope.bim.enableActions = true;
                                        $timeout();
                                    });
                                    self.setRevisionSelection(id);
                                    return "";
                                };

                                self.setRevisionSelection = function (selectedIds, roids) {
                                    var ids = [],
                                        treeSelectionIds = [];
                                    $.each(!$.isArray(selectedIds) ? [selectedIds] : selectedIds, function (k, id) {
                                        if (flatTreeSearchVals[id] && flatTreeSearchVals[id].children && flatTreeSearchVals[id].children.length) {
                                            treeSelectionIds.push(id);
                                            bimSurfer.setVisibility({ types: ifcTypes, visible: false });
                                            ids = ids.concat(getIdsOfAllChildren(flatTreeSearchVals[id]));
                                            bimSurfer.setVisibility({ ids: ids, visible: true });
                                            $typeSelector.find(".btn-default").removeClass("btn-default").addClass("btn-success");
                                        }
                                        else {
                                            ids.push((roids && roids[k] ? roids[k] : self.currentRevision.oid) + ":" + id);
                                        }
                                    });
                                    if (ids.length) {
                                        bimSurfer.viewFit({
                                            ids: ids,
                                            animate: true
                                        });
                                    }
                                    //if (ids.length == 1) {
                                        bimSurfer.setSelection({
                                            ids: ids,
                                            clear: true,
                                            selected: true
                                        });
                                    //}
                                    //else {
                                    //    bimSurfer.setSelection({
                                    //        ids: [],
                                    //        clear: true,
                                    //    });
                                    //}
                                };

                                self.revisionSelected = function (revision) {
                                    if ((!self.currentProject) || self.currentProject.hasSubProjects)
                                        return;
                                    if (!revision) {
                                        self.currentRevision = null;
                                        self.treeSearchVals = null;
                                        flatTreeSearchVals = {};
                                        return;
                                    }
                                    if (self.currentRevision && self.currentRevision.oid == revision.oid)
                                        return;
                                    self.currentRevision = revision;
                                    self.initViewer({
                                        modelsToLoad: 1
                                    });
                                    self.drawRevision({ poid: self.currentProject.oid, roid: revision.oid, name: self.currentProject.name });
                                };

                                self.projectSelected = function (project) {
                                    //self.selectedProject = project;
                                    if (!project) {
                                        self.currentProject = null;
                                        self.selectedRevision = null;
                                        self.revisions = [];
                                        self.revisionSelected(null);
                                        return;
                                    }
                                    //If the projects has subprojects last revisions are shown in a single tree + bimsurfer
                                    if (project.hasSubProjects)
                                    {
                                        getAllRelatedProjects(project.oid).then(function (res) {
                                            self.selectedSubProjects = $.map(res.response.result, function (subProj) {
                                                if (subProj.oid != project.oid)
                                                    return { poid: subProj.oid, roid: subProj.lastRevisionId, name: subProj.name };
                                            });
                                            self.initViewer({ modelsToLoad: self.selectedSubProjects.length });
                                            self.drawRevisionsSequentially(self.selectedSubProjects);
                                        });
                  
                                    }

                                    if (self.currentProject && self.currentProject.oid == project.oid)
                                        return;
                                    self.currentProject = project;
                                    self.getRevisions();
                                };

                                self.assetSelected = function (asset) {
                                    if (asset) {
                                        self.projects = asset;
                                        self.selectedProjectId = asset[0].oid;
                                        self.projectSelected(asset[0]);
                                    } else {
                                        self.projects = [];
                                        self.selectedProjectId = null;
                                        self.projectSelected(null);
                                    }
                                }

                                self.getRevisions = function () {
                                    getAllRevisionsOfProject(self.currentProject.oid).then(function (revisions) {
                                        self.revisions = revisions.response.result;
                                        if (self.revisions) {
                                            self.selectedRevision = self.revisions[self.revisions.length - 1];
                                            self.revisionSelected(self.selectedRevision);
                                        }
                                        $timeout();
                                    });
                                };

                                self.synchDB = function () {
                                    var data = $("#treeContainer .k-widget.k-treeview .tree-root").data("kendoTreeView").dataSource.data()[0].children.options.data;
                                    if (!self.currentProject.hasSubProjects)
                                        synchDB(self.currentProject.oid,
                                            self.currentRevision.oid,
                                            data).then(function (message) {
                                                kendoConsole.log(message.message, false);
                                                $timeout(function () {
                                                    self.currentProject.HasToImportRawData = false;
                                                });
                                            });
                                    else
                                    {
                                        $.each(self.selectedSubProjects, function (i, v) {
                                            synchDB(v.poid,
                                            v.roid,
                                            data.items[i]).then(function (message) {
                                                kendoConsole.log(message.message, false);
                                                $timeout(function () {
                                                    self.currentProject.HasToImportRawData = false;
                                                });
                                            });
                                        });
                                    }
                                };

                                self.getActions = function () {
                                    //get all selected items and ask the database what to do (3 level accordion is displayed)
                                    var selection = $.map(kendoTree.element.find("li .item-selected"), function (v, i) {
                                        var targetData = {
                                            targetId: null,
                                            targetType: null,
                                            targetClass: null,
                                        }
                                        if (self.dbItems && self.dbItems[$(v).closest("li").data().id])
                                            $.extend(targetData, {
                                                targetId: self.dbItems[$(v).closest("li").data().id].targetId,
                                                targetType: self.dbItems[$(v).closest("li").data().id].targetType,
                                                targetClass: self.dbItems[$(v).closest("li").data().id].targetClass
                                            });
                                        var selobject = $.extend($(v).closest("li").data(), targetData);
                                        delete selobject.expanded;
                                        delete selobject.initiallyExpanded;
                                        delete selobject.uid;
                                        return selobject;
                                    });
                                    MF.api.getDataSet({ selected: selection,bimServerProjectId:self.selectedProjectId }, "BIM.usp_GetActions").then(function (actions) {
                                        //console.log(actions);
                                        $.extend(actions, {
                                            selected: selection,
                                            referenceObjectId: self.selectedProjectId,
                                            success_callback: function (res) {
                                                //refresh the tree
                                                console.log("resfreshing tree...");
                                            }
                                        });
                                        if (actions.status && actions.status == 500)
                                        {
                                            kendoConsole.log(actions.responseText, true);
                                            return;
                                        }
                                        requireConfigAndMore(["MagicActions"], function () {
                                            var accordionid = "bimaccordion";
                                            var e = $("#actionButton div");
                                            var position = "right";
                                            $("#" + accordionid).remove();
                                                //e e' l' action span 
                                                $(e).kendoTooltip({
                                                    position: position,
                                                    showOn: "click",
                                                    autoHide: false,
                                                    hide: function () {
                                                        $(this.popup.element[0]).closest('.k-animation-container').remove();
                                                    },
                                                    content: function () {
                                                        if (actions && actions[0] && actions[0].length)
                                                            return build3LevelBootstrapAccordion({ recordid: self.selectedProjectId, currentTarget: e, actions: actions[0] }, accordionid, actionLinkReferenceBuilder);
                                                        else
                                                            return "None";
                                                    },
                                                    width: "250px"
                                                }).trigger("tooltipCreated");
                                                $(e).data("kendoTooltip").show();
                                                if (actions && actions[0].length)
                                                {
                                                    setActionSettings(actions[0], "actionsettings", accordionid);
                                                    setActionSettings(null, "subsettings");
                                                }
                                        });
                                    });
                                };
                            });

                        }, restoreBaseRequireUrl);
                    }, restoreBaseRequireUrl);
                }
            ]);
    }
})();