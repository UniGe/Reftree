define(["angular", "MagicSDK"], function (angular, MF) {
    angular
        .module("gridForm", [])
        .directive("gridForm",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        definition: "=",
                        form: "=",
                        filterData: "=",
                        parentGridInstance: "=",
                        options: "="
                    },
                    template: '<div></div>',
                    controllerAs: "gf",
                    controller: [
                        "$element",
                        "$timeout",
                        function ($element, $timeout) {
                            var self = this;
                            self.options = self.options || {};

                            self.gridDefinitions = {};
                            self.form = {
                                dirty: false,
                                data: self.formData = {}
                            };

                            self.init = function () {
                                var tabStripOptions = {
                                    animation: {
                                        open: { effects: "fadeIn" }
                                    },
                                    activate: self.activateTab
                                };
                                self.$tabstrip = createKendoTabstrip(self.definition, tabStripOptions);
                                self.tabstrip = self.$tabstrip.data("kendoTabStrip");
                                $element.html(self.$tabstrip);
                            };

                            self.activateTab = function (e) {
                                var $tabContent = $(e.contentElement);
                                if (!$tabContent.attr("grids-initialized")) {
                                    $tabContent.attr("grids-initialized", "true");
                                    $tabContent.find("[data-tab-grid-id]").each(function (k, el) {
                                        var $el = $(el),
                                            gridDefinition = self.gridDefinitions[$el.attr("data-tab-grid-id")],
                                            id = gridDefinition.id || gridDefinition.gridName,
                                            childGridInstance;
                                        $el.html(mediumSpinnerHTML);
                                        MF.kendo.appendGridToDom({
                                            selector: $el,
                                            kendoGridObject: MF.kendo
                                                .getGridObject(
                                                    $.extend({
                                                        parentGridRowDataInEdit: self.filterData
                                                    },
                                                    gridDefinition)
                                                )
                                                .then(
                                                    function (gridObject) {
														origGridObject = gridObject;
														//remove the zoom button if any
														removeZoomButton(gridObject.columns);
                                                        gridObject = getOfflineGridObject(gridObject, self.options.offlineGridOptions);
                                                        if (gridDefinition.filter)
                                                            gridObject.dataSource.filter = filter;
                                                        if (self.parentGridInstance && gridDefinition.BindedGridFilter) {
                                                            if (typeof gridDefinition.BindedGridFilter == 'string' && gridDefinition.BindedGridFilter.trimStart()[0] == "{") {
                                                                var findValues = /"value"\s*:\s*"([\w\d]+)"/g,
                                                                    matches,
                                                                    fields = self.parentGridInstance.dataSource.options.schema.model.fields;
                                                                while ((matches = findValues.exec(gridDefinition.BindedGridFilter)) !== null) {
                                                                    var field = matches[1];
                                                                    if (fields[field]) {
                                                                        (function (field) {
                                                                            var changeFunction = function (e) {
                                                                                if(childGridInstance.element) {
                                                                                    self.parentGridInstance.dataSource.one("change", changeFunction);
                                                                                    if (e.field == field) {
                                                                                        var newGridObject = $.extend(true, {}, gridObject);
                                                                                        removeFiltersByType(newGridObject.dataSource.filter, "editPopup");
                                                                                        filtersolver(gridDefinition.BindedGridFilter.replace(/({|})\1+/g, "$1"), newGridObject, { data: self.filterData }, gridDefinition.BindedGridHideFilterCol, "editPopup");
                                                                                        origGridObject.dataSource.filter = newGridObject.dataSource.filter; // i set the filter for the initial gridObject because parameterMap doesnt care about current dataSource
                                                                                        childGridInstance.setDataSource(new kendo.data.DataSource(newGridObject.dataSource));
                                                                                    }
                                                                                }
                                                                            }
                                                                            self.parentGridInstance.dataSource.one("change", changeFunction);
                                                                        }(field));
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        var oldChange = gridObject.dataSource.change;
                                                        gridObject.remove = function (e) {
                                                            e.model.__action = "remove!"
                                                        };
                                                        gridObject.dataSource.change = function (e) {
                                                            if (typeof oldChange == "function")
                                                                oldChange(e);
                                                            if (!e.action)
                                                                return;

                                                            if (!self.formData[id])
                                                                self.formData[id] = [];

                                                            if (e.action == "remove") {
                                                                $.each(e.items, function (itemIndex, item) {
                                                                    var found = false;
                                                                    if (item.__action != "remove!") {
                                                                        setTimeout(function () {
                                                                            $.each(self.formData[id], function (k, v) {
                                                                                if (v.uid === item.uid) {
                                                                                    $.each(e.sender.options.schema.model.fields, function (k, vv) {
                                                                                        if (k in v)
                                                                                            item[k] = v[k];
                                                                                    });
                                                                                    e.sender.insert(e.index, item);
                                                                                    return false;
                                                                                }
                                                                            });
                                                                            if (!item.isNew())
                                                                                item.__firstAction = "remove";
                                                                        });
                                                                    }
                                                                    else {
                                                                        $.each(self.formData[id], function (k, v) {
                                                                            if (v.uid === item.uid) {
                                                                                if (v.__firstAction === "add" || v.__action === "add")
                                                                                    self.formData[id].splice(k, 1);
                                                                                else {
                                                                                    found = true;
                                                                                    item.__action = e.action;
                                                                                    self.formData[id][k] = $.extend({}, item);
                                                                                }
                                                                                return false;
                                                                            }
                                                                        });
                                                                        if (!found && !item.isNew()) {
                                                                            item.__action = e.action;
                                                                            self.formData[id].push($.extend({}, item));
                                                                        }
                                                                    }

                                                                });
                                                            }
                                                            else if (e.action == "sync") {
                                                                $.each(e.items, function (itemIndex, item) {
                                                                    //item.dirty = false;
                                                                    if (!item.__firstAction)
                                                                        return true;

                                                                    var found = false;
                                                                    if (item.__firstAction == "itemchange" || item.__action == "add") {
                                                                        $.each(self.formData[id], function (k, v) {
                                                                            if (v.uid === item.uid) {
                                                                                found = true;
                                                                                if (!item.__action)
                                                                                    item.__action = item.__firstAction;
                                                                                item.__firstAction = null;
                                                                                self.formData[id][k] = $.extend({}, item);
                                                                                return false;
                                                                            }
                                                                        });
                                                                    }
                                                                    if (item.__firstAction == "add" || !found) {
                                                                        if (!item.__action)
                                                                            item.__action = item.__firstAction;
                                                                        item.__firstAction = null;
                                                                        self.formData[id].push($.extend({}, item));
                                                                    }
                                                                    item.__firstAction = null;
                                                                });
                                                            }
                                                            else {
                                                                $.each(e.items, function (itemIndex, item) {
                                                                    if (!item.__firstAction)
                                                                        item.__firstAction = e.action;
                                                                });
                                                            }

                                                            if (!self.formData[id].length)
                                                                delete self.formData[id];
                                                            self.form.dirty = false;
                                                            $.each(self.formData, function (k, v) {
                                                                self.form.dirty = true;
                                                                return false;
                                                            });
                                                            if (self.parentGridInstance && self.filterData && "dirty" in self.filterData && self.form.dirty)
                                                                self.filterData.dirty = self.form.dirty;
                                                            $timeout();
                                                        };
                                                        $el.html("");
                                                        return $.extend(true, {}, gridObject);
                                                    },
                                                    function (error) {
                                                        kendoConsole.log("grid: " + gridDefinition.gridName + " - id: " + gridDefinition.id + " - Error: " + JSON.stringify(error, null, "   "), true);
                                                        $el.html("");
                                                    }
                                                )
                                        })
                                        .then(function (gridInstance) {
                                            childGridInstance = gridInstance;
                                        });
                                    });
                                }
                            };

                            function createKendoTabstrip(definition, tabStripOptions) {
                                var $el = $(createTabstripHtml(definition)).kendoTabStrip(tabStripOptions);
                                $el.data("kendoTabStrip").activateTab($el.find("[role=tab]").eq(0));
                                self.activateTab({ contentElement: $el.find(".k-content.k-state-active") });
                                return $el;
                            }

                            function createTabstripHtml(definition) {
                                var res = createHtml(definition, 0);
                                self.gridDefinitions = res.grids;
                                var html = '<div><ul class="k-tabstrip-items k-reset">';
                                html += res.tabs;
                                html += '</ul>';
                                html += res.content;
                                return html += '</div>';
                            }

                            function createHtml(definition, depth, grids) {
                                var tabs = "",
                                    prependTabs = "",
                                    content = '';
                                if (!grids)
                                    grids = {};
                                $.each(definition, function (k, v) {
                                    if (v.gridName) {
                                        var id = v.id || v.gridName;
                                        content += '<div data-tab-grid-id="' + id + '"></div>';
                                        grids[id] = v;
                                    }
                                    else if (v.grids) {
                                        if (depth == 0)
                                            tabs += '<li class="k-item k-state-default" role="tab"><span class="k-link">' + v.title + "</span></li>";
                                        else {
                                            var id = Date.now() + "-" + k + "-" + depth + "-" + Math.random().toString().substr(2);
                                            prependTabs += '<li data-tab-id="' + id + '" class="k-item k-state-default" role="tab"><span class="k-link">' + v.title + "</span></li>";
                                            tabs += '<button onclick="kendoTabStripDropdownItemClick(this)" class="k-button" data-tab-id="' + id + '"><span class="k-link">' + v.title + '</span></button>';
                                        }
                                        content += '<div class="k-content" role="tabpanel">' + createHtml(v.grids, depth + 1, grids).content + '</div>';
                                    }
                                    else if (v.subTabs) {
                                        var res = createHtml(v.subTabs, depth + 1, grids);
                                        if (depth == 0)
                                            tabs += res.prependTabs + '<li class="dropdown k-item k-state-default k-last" role="tab"><span class="k-link dropdown-toggle" data-toggle="dropdown">' + v.title + '</span><ul class="dropdown-menu">' + res.tabs + '</ul></li>';
                                        else {
                                            prependTabs += res.prependTabs;
                                            tabs += '<li class="dropdown-submenu k-button"><a href="javascript:void(0)" class="k-button dropdown-toggle" data-toggle="dropdown">' + v.title + '</a><ul class="dropdown-menu">' + res.tabs + '</ul></li>';
                                        }
                                        content += res.content;
                                    }
                                });
                                return {
                                    prependTabs: prependTabs,
                                    tabs: tabs,
                                    content: content,
                                    grids: grids
                                };
                            }

                            self.init();
                        }
                    ]
                }
            }
        );
});

                            /*self.definition = [
                                {
                                    title: "flat",
                                    grids: [
                                        {
                                            id: "sepp",
                                            gridName: "Table_fileupl_prova",
                                            filter: [],
                                            maxRecords: 1
                                        }
                                    ]
                                },
                                {
                                    title: "nested",
                                    subTabs: [
                                        {
                                            title: "first",
                                            grids: [
                                                {
                                                    id: 2,
                                                    gridName: "Table_fileupl_prova"
                                                },
                                                {
                                                    gridName: "Table_fileupl_prova"
                                                }
                                            ]
                                        },
                                        {
                                            title: "second",
                                            subTabs: [
                                                {
                                                    title: "first",
                                                    grids: [
                                                        {
                                                            gridName: "Table_fileupl_prova"
                                                        },
                                                        {
                                                            gridName: "Table_fileupl_prova"
                                                        },
                                                        {
                                                            gridName: "Table_fileupl_prova"
                                                        }
                                                    ]
                                                },
                                                {
                                                    title: "hundert",
                                                    subTabs: [
                                                        {
                                                            title: "first",
                                                            grids: [
                                                                {
                                                                    gridName: "Table_fileupl_prova"
                                                                },
                                                                {
                                                                    gridName: "Table_fileupl_prova"
                                                                },
                                                                {
                                                                    gridName: "Table_fileupl_prova"
                                                                },
                                                                {
                                                                    gridName: "Table_fileupl_prova"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ];*/