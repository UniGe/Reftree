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
                        parentGridInstance: "="
                    },
                    template: '<div></div>',
                    controllerAs: "gf",
                    controller: [
                        "$element",
                        "$timeout",
                        function ($element, $timeout) {
                            var self = this;

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
														//remove the zoom button in this case
														removeZoomButton(gridObject.columns);
                                                        origGridObject = gridObject;
                                                        gridObject.getApiCallData = function () {
                                                            return self.parentGridInstance.options.__apiCallData;
                                                        };
                                                        gridObject = getOfflineGridObject(gridObject, { removeSaveButton: true });
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
                                                                                if (childGridInstance.element) {
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
                                                        gridObject.dataSource.change = function (e) {
                                                            if (typeof oldChange == "function")
                                                                oldChange(e);
                                                            if (!e.action || e.action == "sync")
                                                                return;
                                                            if (!self.formData[id])
                                                                self.formData[id] = [];
                                                            $.each(e.items, function (itemIndex, item) {
                                                                var found = false;
                                                                if (e.action == "add")
                                                                    self.formData[id].push(item);
                                                                else {
                                                                    $.each(self.formData[id], function (k, v) {
                                                                        if (v.uid == item.uid) {
                                                                            found = true;
                                                                            if (e.action == "itemchange") {
                                                                                self.footerUpdater(e, $el.data('kendoGrid') );
                                                                                v = item;
                                                                            }
                                                                            else {
                                                                                if (!item.id)
                                                                                    self.formData[id].splice(k, 1);
                                                                            }
                                                                            return false;
                                                                        }
                                                                    });
                                                                    if (!found)
                                                                        self.formData[id].push(item);
                                                                }
                                                                if (!item.__action)
                                                                    item.__action = e.action;
                                                            });
                                                            if (!self.formData[id].length)
                                                                delete self.formData[id];
                                                            self.form.dirty = false;
                                                            $.each(self.formData, function (k, v) {
                                                                self.form.dirty = true;
                                                                return false;
                                                            });
                                                            if (self.parentGridInstance && self.filterData && "dirty" in self.filterData && self.form.dirty)
																self.filterData.dirty = self.form.dirty;
															try { //trying to recenter the window when the grid-form height grows...
															  $("div.k-popup-edit-form.k-window-content.k-content").last().data("kendoWindow").center();
															}
															catch(err) {
																console.log("could not center the container...");
															}
                                                            $timeout();
                                                        };
                                                        gridObject.isSchemaFormGrid = true; //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/193
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
                                            self.gridInstance = gridInstance;
                                            Object.defineProperty(gridInstance.options, '__apiCallData', {
                                                get: function () {
                                                    return self.parentGridInstance.options.__apiCallData;
                                                }
                                            });

                                            gridInstance.bind("dataBound", function () {
                                                self.footerUpdater();
                                            });
                                            // update childGridsData from model (from schema-form-grid)
                                            if (self.filterData.__childGridsData && self.filterData.__childGridsData[id]) {
                                                gridInstance.one("dataBound", function () {
                                                    self.footerUpdater();
                                                    $.each(self.filterData.__childGridsData[id], function (k, data) {
                                                        switch (data.__action) {
                                                            case "remove":
                                                            case "itemchange":
                                                                $.each(gridInstance.dataSource.data(), function (k, item) {
                                                                    if (item[gridInstance.dataSource.options.schema.model.id] == data[gridInstance.dataSource.options.schema.model.id]) {
                                                                        if (data.__action == "itemchange") {
                                                                            $.extend(item, data);
                                                                        } else {
                                                                            gridInstance.dataSource.remove(item);
                                                                        }
                                                                        return false;
                                                                    }
                                                                });
                                                                break;
                                                            case "add":
                                                                gridInstance.dataSource.insert(0, data).uid = data.uid;
                                                                break;
                                                        }
                                                    });
                                                    gridInstance.refresh();
                                                });
                                            }
                                        });
                                    });
                                }
                            };


                            /**
                            * called on itemchange in the change event of the datasource of the "offline" grid in order to refresh footers' aggregates 
                            * @param {any} e - the kendo payload for datasource change event 
                             * */
                            self.footerUpdater = function (e, gridObject) {
                                let grid = self.gridInstance;
                                let model = e && e.items && e.items.length ? e.items[0] : null;
                                let groupFooterIndex = 0;
                                let groupFooters = grid.tbody.children(".k-group-footer");

                                function updateGroupFooters(items) {
                                    if (!model)
                                        return;
                                    var updatedSubGroup;
                                    var updatedElement;
                                    for (var idx = 0; idx < items.length; idx++) {
                                        var item = items[idx];
                                        if (item.hasSubgroups) {
                                            updatedSubGroup = updateGroupFooters(item.items);
                                        }
                                        if (updatedSubGroup || $.inArray(model, item.items) !== -1) {
                                            updatedElement = true;
                                            groupFooters.eq(groupFooterIndex).replaceWith(grid.groupFooterTemplate(item.aggregates));
                                        }
                                        groupFooterIndex++;
                                    }
                                    return updatedElement;
                                }
                                let aggregatedefs = grid.dataSource.options.aggregate;
                                //sanitize the datasource: fields to aggregate must be javascript numbers
                                let aggrf = $.map(aggregatedefs, function (v, i) {
                                    return v.field;
                                });

                                //This is needed because of grid constraints which set a string in a numeric field. I an aggregation has been set than the value has to be a number
                                $.each(grid.dataSource.data(), function (ii, vv) {
                                    let keys = Object.keys(vv);
                                    $.each(keys, function (j, field) {
                                        if (aggrf.indexOf(field) != -1) {
                                            if (vv[field] !== parseFloat(vv[field])) {
                                                vv.set(field, parseFloat(vv[field]));
                                            }
                                        }
                                    });
                                });

                                updateGroupFooters(grid.dataSource.view());

                                let allTotals = grid.dataSource.aggregates();

                                let fieldFormats = {};
                                $.each(aggregatedefs, function (i, agg) {
                                    fieldFormats[agg.field] = agg.format;
                                });
                                let $footertemplate = grid.footer.find(".k-footer-template");
                                let content = '<span class="to-be-replaced" data-column="{0}" data-template-pos="footer"><div style="text-align:left">{1}</div></span></td> <td >&nbsp;</td> <td >&nbsp;</td> <td >&nbsp;';
                                $.each(allTotals, function (fieldname, value) {
                                    let alltotalsforcolumn = [];
                                    $.each(value, function (fun, val) {
                                        if (fieldFormats[fieldname])
                                            val = kendo.toString(val, fieldFormats[fieldname]);
                                        alltotalsforcolumn.push(fun + ": " + val);
                                    });
                                    $footertemplate.find("span[data-column=" + fieldname + "]").replaceWith(content.format(fieldname, alltotalsforcolumn.join(",")));
                                });
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