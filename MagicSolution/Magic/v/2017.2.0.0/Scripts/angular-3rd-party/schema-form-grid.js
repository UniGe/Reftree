define(['angular', "MagicSDK", 'bootstrap-decorator', 'angular-kendo'], function (angular, MF) {
    angular.module("schemaForm").run(["$templateCache", function ($templateCache) {
        $templateCache.put("directives/decorators/grid.html", "<div class='form-group schema-form-grid' ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess(), \'has-feedback\': form.feedback !== false}\" ng-init=\"insideModel=$$value$$;\">\
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
                    function ($element, $scope, $timeout) {
                        var self = this,
                            colmnName = self.sfInputOptions.key[0],
                            cascadeColumns = self.sfInputOptions.options.cascadeColumn ? self.sfInputOptions.options.cascadeColumn.split(",") : null,
                            cascadeFilterColumns = cascadeColumns ? self.sfInputOptions.options.cascadeFilterColumn.split(",") : null,
                            $formScope = $scope.$parent,
                            spinner = "<div class='text-center' style='padding-top: 30px'><span class='fa fa-spin fa-spinner fa-4x'></span></div>",
                            isGridEdit = null;

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
                            get: function () {
                                return typeof $formScope.options.apiCallData === 'function' ? $formScope.options.apiCallData() : $formScope.options.apiCallData;
                            }
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
                                            createGrid();
                                        }
                                    });
                                }
                                else {
                                    if (!self.sfInputOptions.options.events[cascadeColumnArray[0]])
                                        self.sfInputOptions.options.events[cascadeColumnArray[0]] = [];
                                    self.sfInputOptions.options.events[cascadeColumnArray[0]].push(function (oldValue, newValue) {
                                        if (!oldValue || !newValue || oldValue[cascadeColumnArray[1]] != newValue[cascadeColumnArray[1]])
                                            createGrid();
                                    });
                                }
                            });
                        }

                        function getItemData(item, dataSource) {
                            var _item = {};
                            $.each(dataSource.options.schema.model.fields, function (field) {
                                if (field in item)
                                    _item[field] = item[field];
                            });
                            _item.__action = item.__action;
                            _item.__firstAction = item.__firstAction;
                            _item.uid = item.uid;
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
                            MF.kendo.appendGridToDom({
                                selector: $element,
                                kendoGridObject: getGridObject()
                                    .then(function (gridObject) {
                                        gridObject.dataSource.filter = combineWithCascadeFilters(gridObject.dataSource.filter);

                                        gridObject = getOfflineGridObject(gridObject);

                                        if (!self.sfInputOptions.options.dataSource) {
                                            var oldPm = gridObject.dataSource.transport.parameterMap;
                                            gridObject.dataSource.transport.parameterMap = function (options, operation) {
                                                if ($formScope && $formScope.options && $formScope.options.apiCallData)
                                                    options.data = JSON.stringify(typeof $formScope.options.apiCallData === 'function' ? $formScope.options.apiCallData() : $formScope.options.apiCallData);
                                                return oldPm(options, operation);
                                            };
                                        }

                                        var oldChange = gridObject.dataSource.change;
                                        gridObject.remove = function (e) {
                                            e.model.__action = "remove!";
                                        };
                                        gridObject.dataSource.change = function (e) {

                                            if (typeof oldChange == "function")
                                                oldChange(e);
                                            if (!e.action || isGridEdit === null)
                                                return;

                                            isGridEdit = true;
                                            if (!self.model[colmnName])
                                                self.model[colmnName] = [];

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
                                                $.each(e.items, function (itemIndex, item) {
                                                    //item.dirty = false;
                                                    if (!item.__firstAction)
                                                        return true;

                                                    var found = false;
                                                    if (item.__firstAction == "itemchange" || item.__action == "add") {
                                                        $.each(self.model[colmnName], function (k, v) {
                                                            if (v.uid === item.uid) {
                                                                found = true;
                                                                if (!item.__action)
                                                                    item.__action = item.__firstAction;
                                                                item.__firstAction = null;
                                                                self.model[colmnName][k] = getItemData(item, e.sender);
                                                                modelItemChanged(self.model[colmnName][k], v);
                                                                return false;
                                                            }
                                                        });
                                                    }
                                                    if (item.__firstAction == "add" || !found) {
                                                        if (!item.__action)
                                                            item.__action = item.__firstAction;
                                                        item.__firstAction = null;
                                                        var length = self.model[colmnName].push(getItemData(item, e.sender));
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
                                            }

                                            if (!self.model[colmnName].length)
                                                delete self.model[colmnName];
                                            $timeout();
                                        };

                                        $element.html("");
                                        return $.extend(true, {}, gridObject);
                                    })
                                })
                                .then(function (gridInstance) {
                                    self.gridInstance = gridInstance;

                                    gridInstance.one("dataBound", function () {
                                        updateDataSourceFromModel();
                                        isGridEdit = false;
                                    });

                                    var magicFormScope = $scope;
                                    do {
                                        magicFormScope = magicFormScope.$parent;
                                    } while (magicFormScope.$parent && !magicFormScope.$form)
                                    self.gridInstance.magicFormScope = magicFormScope;
                                });
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
                            }
                        }


                        function combineWithCascadeFilters(filters) {
                            if (cascadeColumns) {
                                var filter = { type: "cascade", logic: "and", filters: [] };
                                $.each(cascadeColumns, function (i, cascadeColumn) {
                                    if (self.model[cascadeColumn])
                                        filter.filters.push({
                                            field: cascadeFilterColumns[i],
                                            operator: "eq",
                                            value: self.model[cascadeColumn],
                                            type: "cascade"
                                        });
                                });
                                if (filters == null)
                                    filters = filter;
                                else
                                    combineDataSourceFilters(filters, filter);
                            }
                            return filters;
                        }
                    }
                ]
            };
        });
});