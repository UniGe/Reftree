define(['angular', "MagicSDK", 'bootstrap-decorator', 'angular-kendo'], function (angular, MF) {
    angular.module("schemaForm").run(["$templateCache", function ($templateCache) {
        $templateCache.put("directives/decorators/grid.html", "<div class='form-group schema-form-grid' ng-class=\"{\'is-disabled\': form.readonly, \'has-error\': hasError(), \'has-success\': hasSuccess(), \'has-feedback\': form.feedback !== false}\" ng-init=\"insideModel=$$value$$;\">\
            <label class=\"control-label {{form.labelHtmlClass}}\" ng-show=\"showTitle()\">{{form.title}}</label>\
            <grid-input sf-input-options=\"form\" model=\"model\"></grid-input>\
        </div>");
    }]);

    angular.module('schemaForm').config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider', function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
        schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'grid', 'directives/decorators/grid.html');
    }])
        .directive("gridInput", function () {
            return {
                restrict: "E",
                replace: true,
                template: "<div><div class='text-center' style='padding-top: 30px'><span class='fa fa-spin fa-spinner fa-4x'></span></div></div>",
                controllerAs: "c",
                scope: {
                    sfInputOptions: "=",
                    model: "="
                },
                bindToController: true,
                controller: [
                    '$element',
                    '$scope',
                    '$timeout',
                    '$rootScope',
                    function ($element, $scope, $timeout, $rootScope) {
                        var self = this,
                            colmnName = self.sfInputOptions.key[0],
                            cascadeColumns = self.sfInputOptions.options.cascadeColumn ? self.sfInputOptions.options.cascadeColumn.split(",") : null,
                            cascadeFilterColumns = cascadeColumns ? self.sfInputOptions.options.cascadeFilterColumn.split(",") : null,
                            $formScope = $scope.$parent,
                            spinner = "<div class='text-center' style='padding-top: 30px'><span class='fa fa-spin fa-spinner fa-4x'></span></div>",
                            isGridEdit = null,
                            readonly = self.sfInputOptions.readonly || false,
                            originalEditable = true;

                        $scope.$parent.$on('reRenderGrid', function (data) {
                            createGrid()
                                .then(function () {
                                    if (data.deferrer) {
                                        data.deferrer.resolve();
                                    }
                                })
                        });

                        $scope.$watch('c.sfInputOptions.readonly', function (_readonly) {
                            readonly = _readonly;
                            if (self.gridInstance) {
                                if (readonly)
                                    gridObject.editable = false;
                                else
                                    gridObject.editable = originalEditable;
                            }
                        });


						/**
						* called on itemchange in the change event of the datasource of the "offline" grid in order to refresh footers' aggregates 
						* @param {any} e - the kendo payload for datasource change event 
						 * */
						self.footerUpdater = function (e) {
							let grid = self.gridInstance;
							let model = e && e.items && e.items.length ?  e.items[0] : null;
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
								$.each(keys, function (j,field) {
									if (aggrf.indexOf(field) != -1) {
										if (vv[field] !== parseFloat(vv[field])) {
											vv.set(field,parseFloat(vv[field]));
										}
									}
								});
							});
							
							updateGroupFooters(grid.dataSource.view());
							
							let allTotals = grid.dataSource.aggregates();
							
							let fieldFormats = {};
							$.each(aggregatedefs, function (i, agg) {
								fieldFormats[agg.field] =  agg.format;
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

                        if (cascadeColumns) {
                            $.each(cascadeColumns, function (i, v) {
                                cascadeColumns[i] = v.trim();
                                cascadeFilterColumns[i] = cascadeFilterColumns[i].trim();
                            });
                        }

                        while (!$formScope.$form && $formScope.$parent)
                            $formScope = $formScope.$parent;

                        var gridOptions = {
                            gridName: self.sfInputOptions.options.gridName,
                            initialGridObject: {
                                __apiCallData: {}
                            }
                        };

                        Object.defineProperty(gridOptions.initialGridObject, '__apiCallData', {
                            get: getApiCallData
                        });

                        createGrid();

                        $scope.$watch(function () {
                            return self.model[colmnName];
                        }, function (v) {
                            if (isGridEdit === false)
                                createGrid();
                            if (isGridEdit !== null)
                                isGridEdit = false;
                        }, true);

                        if (cascadeColumns) {
                            $.each(cascadeColumns, function (i, cascadeColumn) {
                                var cascadeColumnArray = cascadeColumn.split('.');
                                if (cascadeColumnArray.length === 1) {
                                    $scope.$watch(function () {
                                        return self.model[cascadeColumn];
                                    }, function (newValue, oldValue) {
										if (newValue != oldValue) {
											//D.T: on cascade the grid values have  to be reset...
											self.model[colmnName] = [];
                                            createGrid();
                                        }
                                    });
                                }
                                else {
                                    if (!self.sfInputOptions.options.events[cascadeColumnArray[0]])
                                        self.sfInputOptions.options.events[cascadeColumnArray[0]] = [];
                                    self.sfInputOptions.options.events[cascadeColumnArray[0]].push(function (oldValue, newValue) {
										if (!oldValue || !newValue || oldValue[cascadeColumnArray[1]] != newValue[cascadeColumnArray[1]]) {
											//D.T: on cascade the grid values have to be reset...
											self.model[colmnName] = [];
											createGrid();
										}
                                    });
                                }
                            });
                        }

                        function getItemData(item, dataSource, childGridsData) {
                            var _item = {};
                            $.each(dataSource.options.schema.model.fields, function (field, options) {
                                if (field in item) {
                                    if (item[field] instanceof Date)
                                        _item[field] = toTimeZoneLessString(item[field]);
                                    else
                                        _item[field] = item[field];
                                }
                            });
                            _item.__action = item.__action;
                            _item.__firstAction = item.__firstAction;
                            _item.uid = item.uid;
                            if (childGridsData) {
                                _item.childGridsData = childGridsData;
                                item.__childGridsData = childGridsData;
                            }
                            return _item;
                        }

                        function modelItemChanged(newValue, oldValue) {
                            if (self.sfInputOptions.options.events && self.sfInputOptions.options.events[colmnName]) {
                                $.each(self.sfInputOptions.options.events[colmnName], function (k, fn) {
                                    fn(newValue, oldValue);
                                });
                            }
                            if ($formScope.$form && typeof $formScope.$form.$setDirty == "function")
                                $formScope.$form.$setDirty(true);
                        }
						function createGrid() {
							isGridEdit = null;
							$element.html(spinner);
							self.gridInstance = null;
							
				            return MF.kendo.appendGridToDom({
                                selector: $element,
                                kendoGridObject: getGridObject()
                                    .then(function (gridObject) {
                                        originalEditable = gridObject.editable;
                                        if (readonly)
                                            gridObject.editable = false;

                                        gridObject.isSchemaFormGrid = true;
										//remove the zoom button in this case
                                        removeZoomButton(gridObject.columns);
                                        gridObject.dataSource.filter = combineWithCascadeFilters(gridObject.dataSource.filter, gridObject.dataSource.schema.model.fields);
                                        var userFilter = getFiltersByType(gridObject.dataSource.filter),
                                            hasUserFilter = userFilter && !!Object.keys(userFilter).length;
                                        if (hasUserFilter)
                                            gridObject.dataSource.filter = removeFiltersByType(gridObject.dataSource.filter);
                                        gridObject.getApiCallData = getApiCallData;
                                        gridObject = getOfflineGridObject(gridObject);
                                        if (hasUserFilter) {
                                            var __origDataBound = gridObject.dataBound,
                                                isUserFilterSet = false;
                                            gridObject.dataBound = function (e) {
                                                if (__origDataBound)
                                                    __origDataBound.call(this, e);
                                                if (!isUserFilterSet) {
                                                    isUserFilterSet = true;
                                                    e.sender.dataSource.filter(userFilter);
                                                }
                                            };
                                        }
                                        var oldSave = gridObject.save;
                                        gridObject.save = function (e) {
                                            if (e.sender.dataSource.transport.options.CustomJSONParam) {
                                                let serviceWorkerExtension = '';
                                                if (window.synchCallsApiPrefix) {
                                                    serviceWorkerExtension = window.synchCallsApiPrefix;
                                                }
                                                $.ajax({
                                                    type: 'POST',
                                                    url: `${serviceWorkerExtension}/api/GENERICSQLCOMMAND/Validate`,
                                                    data: e.sender.dataSource.transport.parameterMap($.extend(true, {}, e.model, e.values), e.model.__firstAction === 'add' ? 'create' : 'update'),
                                                    contentType: 'application/json',
                                                    async: false,
                                                    success: function () {
                                                        if (oldSave) {
                                                            oldSave.call(this, e);
														}
														// D.T: used by wizard to inject immediate save to DB of data, requires an extension of field definition in magic-form { schema:{submitWizardOnSave:true}}
                                                        if (self.sfInputOptions.options && self.sfInputOptions.options.wizardSaveCallback) {
                                                            // wait for DS change events to set values and dirty
                                                            setTimeout(function () {
                                                                self.sfInputOptions.options.wizardSaveCallback();
                                                            });
														}
                                                    },
                                                    error: function (error) {
                                                        e.preventDefault();
                                                        if (error.responseText) {
                                                            kendoConsole.log(error.responseText, true);
                                                        } else if (error.responseJSON) {
                                                            if (error.responseJSON.ExceptionMessage) {
                                                                kendoConsole.log(error.responseJSON.ExceptionMessage, true);
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                        //when the grid inside the form is offline the save button is renamed to Apply
                                        if (gridObject.toolbar) {
                                            $.each(gridObject.toolbar, function (i, v) {
                                                if ((gridObject.editable == true || gridObject.editable == "incell") && v.name == "save")
                                                    v.text = getObjectText("Applymodifcation");
                                            });
                                        }
                                        var oldChange = gridObject.dataSource.change;
                                        gridObject.remove = function (e) {
											e.model.__action = "remove!";
											// D.T: used by wizard to inject immediate save to DB of data, requires an extension of field definition in magic-form { schema:{submitWizardOnSave:true}}
											if (self.sfInputOptions.options && self.sfInputOptions.options.wizardSaveCallback) {
												$timeout(function () { self.sfInputOptions.options.wizardSaveCallback(); }, 500);
											}
                                        };
                                        gridObject.dataSource.change = function (e) {
                                            if (typeof oldChange == "function")
                                                oldChange(e);
                                            if (!e.action || isGridEdit === null)
                                                return;

                                            isGridEdit = true;
                                            if (!self.model[colmnName])
                                                self.model[colmnName] = [];

                                            if (self.sfInputOptions.options.onChange) {
                                                self.sfInputOptions.options.onChange(e);
                                            }

                                            if (e.action == "remove") {
                                                $.each(e.items, function (itemIndex, item) {
                                                    var found = false;
                                                    if (item.__action != "remove!") {
                                                        setTimeout(function () {
                                                            $.each(self.model[colmnName], function (k, v) {
                                                                if (v.uid === item.uid) {
                                                                    e.sender.insert(e.index, $.extend(item, getItemData(item, e.sender)));
                                                                    return false;
                                                                }
                                                            });
                                                            if (!item.isNew())
                                                                item.__firstAction = "remove";
                                                        });
                                                    }
                                                    else {
                                                        $.each(self.model[colmnName], function (k, v) {
                                                            if (v.uid === item.uid) {
                                                                if (v.__firstAction === "add" || v.__action === "add") {
                                                                    self.model[colmnName].splice(k, 1);
                                                                    modelItemChanged(null, v);
                                                                }
                                                                else {
                                                                    found = true;
                                                                    item.__action = e.action;
                                                                    self.model[colmnName][k] = getItemData(item, e.sender);
                                                                    modelItemChanged(self.model[colmnName][k], v);
                                                                }
                                                                return false;
                                                            }
                                                        });
                                                        if (!found && !item.isNew()) {
                                                            item.__action = e.action;
                                                            var length = self.model[colmnName].push(getItemData(item, e.sender));
                                                            modelItemChanged(self.model[colmnName][length - 1], null);
                                                        }
                                                    }

                                                });
                                            }
                                            else if (e.action == "sync") {
                                                var pk = self.gridInstance.dataSource.options.schema.model.id;
                                                $.each(e.items, function (itemIndex, item) {
                                                    var found = false,
                                                        childGridsData,
                                                        parameterMap = JSON.parse(e.sender.transport.parameterMap($.extend(true, {}, item)));
                                                    if (parameterMap.childGridsData && $('.k-window > [data-uid="' + item.uid + '"]').length) {
                                                        childGridsData = parameterMap.childGridsData;
                                                    }
                                                    if (self.sfInputOptions.submitWholeDataSet === true) {
                                                        $.each(self.model[colmnName], function (k, v) {
                                                            found = pk && v[pk] && v[pk] === item[pk] || v.uid === item.uid;
															//D.T: update the data if found
															if (found)
                                                                $.extend(v, getItemData(item, e.sender, childGridsData));
                                                            return !found;
                                                        });
                                                        if (!found) {
                                                            var length = self.model[colmnName].push(getItemData(item, e.sender, childGridsData));
                                                            modelItemChanged(self.model[colmnName][length - 1], null);
                                                        }
                                                        return true;
                                                    }

                                                    if (!item.__firstAction && childGridsData) {
                                                        item.__firstAction = "itemchange";
                                                    }

                                                    //item.dirty = false;
                                                    if (!item.__firstAction)
                                                        return true;
                                                    
                                                    if (item.__firstAction == "itemchange" || item.__action == "add") {
                                                        $.each(self.model[colmnName], function (k, v) {
                                                            if (pk && v[pk] && v[pk] === item[pk] || v.uid === item.uid) {
                                                                found = true;
                                                                if (!item.__action)
                                                                    item.__action = item.__firstAction;
                                                                item.__firstAction = null;
                                                                self.model[colmnName][k] = getItemData(item, e.sender, childGridsData);
                                                                modelItemChanged(self.model[colmnName][k], v);
                                                                return false;
                                                            }
                                                        });
                                                    }
                                                    if (item.__firstAction == "add" || !found) {
                                                        if (!item.__action)
                                                            item.__action = item.__firstAction;
                                                        item.__firstAction = null;
                                                        var length = self.model[colmnName].push(getItemData(item, e.sender, childGridsData));
                                                        modelItemChanged(self.model[colmnName][length - 1], null);
                                                    }
                                                    item.__firstAction = null;
                                                });
                                            }
                                            else {
                                                $.each(e.items, function (itemIndex, item) {
                                                    if (!item.__firstAction)
                                                        item.__firstAction = e.action;
                                                    if (e.action == "add" && cascadeColumns) {
                                                        $.each(cascadeColumns, function (i, cascadeColumn) {
                                                            item[cascadeFilterColumns[i]] = self.model[cascadeColumn];
                                                        })
                                                    }
                                                });
												//D.T. added check for save button in toolbar because of #5022. This is performed only if the save button has been removed from toolbar
												// call self with action == "sync" if grid is incell (so you dont have to push the save button)
												if ((self.gridInstance.options.editable === true || self.gridInstance.options.editable === "incell") && !(self.gridInstance.element.find(".k-grid-save-changes").length)) {
                                                    gridObject.dataSource.change($.extend(true, {}, e, {
                                                        action: "sync"
                                                    }));
                                                }
                                            }

                                            if (!self.model[colmnName].length)
                                                delete self.model[colmnName];
                                            //D.T: workaround in order to fix the problem which was preventing the grid  to show the added record when the grid "field" is incell editable.
                                            if (self.gridInstance && self.gridInstance.options && self.gridInstance.options.editable
                                                && (self.gridInstance.options.editable == true || self.gridInstance.options.editable.mode == "incell") && (e.action == "add"))
                                                self.gridInstance.element.find(".k-grid-save-changes").trigger("click");
                                            //D.T: End workaround

											try {
												//update the footer as item changes
												if (e.field &&  e.action == "itemchange")
													self.footerUpdater(e);
											}
											catch (exc) {
												console.log(exc);
											}

                                            $timeout();
                                        };

                                        gridObject.__apiCallData = getApiCallData();
                                        $element.html("");
                                        return $.extend(true, {}, gridObject);
                                    })
                                })
                                .then(function (gridInstance) {
                                    self.gridInstance = gridInstance;

                                    Object.defineProperty(gridInstance.options, '__apiCallData', {
                                        get: getApiCallData
                                    });

                                    gridInstance.one("dataBound", function () {
										updateDataSourceFromModel();
										self.footerUpdater();
                                        isGridEdit = false;
                                    });
                                    gridInstance.bind("dataBound", function () {
                                        self.footerUpdater();
                                    });
                                    if (gridInstance.options.editable.mode === 'inline') {
                                        gridInstance.bind("edit", function (e) {
                                            if (e.model[e.sender.dataSource.options.schema.model.id]) {
                                                e.sender.dataSource.options.change({
                                                    action: "itemchange",
                                                    sender: e.sender.dataSource,
                                                    items: [e.model]
                                                });
                                            }
                                        });
                                    }

                                    var magicFormScope = $scope;
                                    do {
                                        magicFormScope = magicFormScope.$parent;
                                    } while (magicFormScope.$parent && !magicFormScope.$form)
                                    self.gridInstance.magicFormScope = magicFormScope;
                                });
                        }

                        function getApiCallData() {
                            return typeof $formScope.options.apiCallData === 'function' ? $formScope.options.apiCallData() : $formScope.options.apiCallData;
						}

                        function getGridObject() {
                            if (self.sfInputOptions.options.dataSource) {
                                return MF.api.getDataSet(gridOptions, self.sfInputOptions.options.dataSource)
                                    .then(function (res) {
                                        var columns = $.map(JSON.parse(res[1][0].columns), function (column) {
                                            column.filterable = true;
                                            return column;
                                        });
                                        columns.unshift({
                                            command: [
                                                { name: "destroy", text: "" }
                                            ],
                                            title: "&nbsp;",
                                            width: "110px"
										});

										return $.extend(true, getDefaultGridSettings(), {
                                            columns: columns,
                                            pageable: {
                                                pageSize: 10
                                            },
                                            toolbar: [
                                                { name: 'save', text: getObjectText("save") },
                                                { name: 'cancel', 'text': getObjectText("cancel") },
                                                { name: "create", text: getObjectText("create") }
                                            ],
                                            editable: true,
                                            groupable: false,
                                            dataSource: {
                                                data: res[0],
                                                schema: {
                                                    model: $.extend({
                                                        id: res[1][0].primaryKey
                                                    }, JSON.parse(res[1][0].model))
                                                }
                                            }
                                        });
                                    });
                            } else {
                                return MF.kendo.getGridObject(gridOptions);
                            }
                        }

                        function updateDataSourceFromModel() {
                            if (self.model[colmnName] && self.model[colmnName].length) {
                                $.each(self.model[colmnName], function (k, data) {
                                    switch (data.__action) {
                                        case "remove":
                                        case "itemchange":
                                            $.each(self.gridInstance.dataSource.data(), function (k, item) {
                                                if (item[self.gridInstance.dataSource.options.schema.model.id] == data[self.gridInstance.dataSource.options.schema.model.id]) {
                                                    if (data.__action == "itemchange") {
                                                        $.extend(item, data);
                                                    } else {
                                                        self.gridInstance.dataSource.remove(item);
                                                    }
                                                    return false;
                                                }
                                            });
                                            break;
                                        case "add":
                                            self.gridInstance.dataSource.insert(0, data).uid = data.uid;
                                            break;
                                    }
                                });
                            }
                        }


                        function combineWithCascadeFilters(filters, schemaFields) {
                            if (cascadeColumns) {
                                var filter = {logic: "and", filters: [] },
                                    calendar = kendo.culture().calendar;
                                $.each(cascadeColumns, function (i, cascadeColumn) {
                                    if (self.model[cascadeColumn]) {
                                        var value = self.model[cascadeColumn],
                                            field = cascadeFilterColumns[i],
                                            operator = 'eq';
                                        if (
                                            schemaFields[field]
                                            && value
                                            && schemaFields[field].type
                                            && schemaFields[field].type.indexOf('date') !== -1
                                        )
                                            value = new Date(value);

                                        if (
                                            schemaFields[field]
                                            && value
                                            && schemaFields[field].type
                                            && schemaFields[field].type.indexOf('bool') !== -1
                                            && typeof (value) == "string"
                                        )
                                            value = (value == "1") ? true : false;

                                        if (Array.isArray(value)) {
                                            filter.filters.push({
                                                filters: value.map(v => ({
                                                    field: field,
                                                    operator: "eq",
                                                    value: v
                                                })),
                                                logic: "or",
                                                type: "cascade"
                                            });
                                        } else {
                                            filter.filters.push({
                                                field: field,
                                                operator: "eq",
                                                value: value,
                                                type: "cascade"
                                            });
                                        }
                                    }
                                });
                                if (filters == null)
                                    filters = filter;
                                else
                                    filters = combineDataSourceFilters(filters, filter);
                            }
                            return filters;
                        }
                    }
                ]
            };
        });
});