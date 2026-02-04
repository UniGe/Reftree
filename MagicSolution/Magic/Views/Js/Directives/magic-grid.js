define(['angular', "MagicSDK", 'angular-kendo'], function (angular, MF) {
    angular.module('magicGrid', ['kendo.directives'])
        .directive('magicGrid', ['$http', function ($http) {
            return {
                replace: false,
                restrict: "E",
                scope: {
                },
                bindToController: {
                    gridname: "@",
                    filterpk: "@",
                    filter: "=",
                    kendoGridInstance: "=",
                    gridoptionsextension: "=",
                    data: "=",
                    command: "=",
                    removeNewButton: "=",
                    externalGridObject: "="
                },
                controllerAs: "mg",
                template: '<div editablecolumnnumber="{{  mg.editablecolumnnumber }}"  kendo-grid="mg.gridInstance" gridoptionsextension="mg.gridoptionsextension" command="mg.command" k-options="mg.gridObject" gridname="{{ mg.gridname }}"></div>',
                controller: ["$scope",
                    "$timeout",
                    "config",
                    function ($scope, $timeout, config) {
                        var self = this;
                        kendo.culture(window.culture);
                        this.gridInstance = {};

                        self.setGridObject = function (gridObject) {
                            //options are key-values which are passed in the select as a parameter                                 
                            if (gridObject) {
                                self.editablecolumnnumber = gridObject.editablecolumnnumber || "2";
                                if (self.command) {
                                    gridObject.columns.push(self.command);
                                }
                                if (self.removeNewButton === true) { //REMOVE NEW BUTTON IF PARENT TAB IS READONLY
                                    var newButton = gridObject.toolbar.find((tb) => { return tb.name == "create" });
                                    var spliceIdx = gridObject.toolbar.indexOf(newButton);
                                    var spliced = gridObject.toolbar.splice(spliceIdx, 1);
                                }

                                if (gridObject.MasterGridName
                                    && gridObject.code
                                    && gridObject.code != gridObject.MasterGridName) //the returned configuration corresponds to a layer for this env, chabge the gridname attr
                                    self.gridname = gridObject.code;

                            }
                            if (config.model || self.data) {
                                var origparmap = gridObject.dataSource.transport.parameterMap;
                                gridObject.dataSource.transport.parameterMap = function (options, operations) {
                                    var orig_options = JSON.parse(origparmap.call(this, options, operations));
                                    if (config.model && operations == "read")
                                        orig_options.data = kendo.stringify(config.model);
                                    if (self.data) {
                                        orig_options.data = kendo.stringify($.extend(JSON.parse(orig_options.data ? orig_options.data : "{}") || {}, self.data));
                                    }
                                    return kendo.stringify({ ...orig_options, MergedScenario: config?.MergedScenario });
                                    //return kendo.stringify(orig_options);
                                };
                                if (config.model && self.filterpk && config.model.id) {
                                    gridObject.dataSource.filter = combineDataSourceFilters(gridObject.dataSource.filter, { field: self.filterpk, operator: "eq", value: config.model.id, type: "customPKFilter" });
                                }
                            }
                            if (self.filter && Object.keys(self.filter).length) {
                                gridObject.dataSource.filter = combineDataSourceFilters(gridObject.dataSource.filter, $.extend(self.filter, { type: "customFilter" }));
                                setDefaultValues(self.filter, gridObject.dataSource.schema.model.fields);
                            }
                            self.gridObject = gridObject;
                            if (self.gridoptionsextension) {
                                $.extend(self.gridObject, self.gridoptionsextension);
                            }

                            $timeout(function () {
                                if (self.gridInstance) {
                                    self.gridInstance.setOptions(self.gridObject);
                                    self.kendoGridInstance = self.gridInstance;

                                    //manage user settings
                                    var grid = self.gridInstance;
                                    //S.mariani bug fix, file upload not initialized in magic-grid
                                    if (self.gridObject.editable) {
                                        grid.bind('save', function (e) {
                                            manageGridUploadedFiles(grid.element);
                                        }
                                        );
                                        grid.bind('saveChanges', function (e) {
                                            manageGridUploadedFiles(grid.element);
                                        }
                                        );
                                        try {
                                            $(grid.element).on("mousedown", ".k-grid-cancel-changes", function (e) {
                                                var gridElement = $(e.target).closest('[data-role="grid"]');
                                                gridElement.removeData('filesToSave');
                                                gridElement.removeData('filesToDelete');
                                            });
                                        } catch (e) {
                                            console.log('No "Undo" button present');
                                        }
                                    }

                                    if (grid.options.columnMenu) {
                                        grid.bind('columnHide', setSessionStorageGridColumnSettings);
                                        grid.bind('columnShow', setSessionStorageGridColumnSettings);
                                        grid.bind('columnResize', setSessionStorageGridColumnSettings);
                                        grid.bind('columnLock', setSessionStorageGridColumnSettings);
                                        grid.bind('columnUnlock', setSessionStorageGridColumnSettings);
                                    }

                                    if (grid.options.reorderable) {
                                        var usersGridSettings = getSessionStorageGridSettings(grid.options.gridcode, grid.options.functionid);
                                        if (usersGridSettings.columnOrder && !$.isEmptyObject(usersGridSettings.columnOrder)) {
                                            var hasCustomOrder = false;
                                            $.each(usersGridSettings.columnOrder, function (field, pos) {
                                                $.each(grid.columns, function (k, col) {
                                                    if (col.field == field && pos != k) {
                                                        hasCustomOrder = true;
                                                        grid.reorderColumn(pos, col);
                                                        return false;
                                                    }
                                                });
                                            });
                                            if (!hasCustomOrder)
                                                deleteSessionStorageGridSettingByType(grid);
                                        }

                                        grid.bind('columnReorder', function (e) {
                                            setTimeout(function () { setSessionStorageGridColumnOrderSettings(e) }, 0);
                                        });
                                    }

                                    bindRemoveListenerToGrid(grid);

                                    //this is needed to render print models...Bug #6269
                                    $timeout(function () {
                                        if (window.vocalCommandsActive) {
                                            var searchField = grid.element.find('#maingridsearchandfilter');
                                            enableVocalCommandsForMainGridSearchField(searchField);
                                        }
                                        $("#appcontainer").trigger("kendoGridRendered", [self.gridInstance, self.gridname]);
                                        //D.t added specific per grid event 
                                        $("#appcontainer").trigger("kendoGridRendered_" + self.gridname, [self.gridInstance, self.gridname]);
                                        if (typeof CheckGridConstaintsExistance == "function")
                                            CheckGridConstaintsExistance(self.gridInstance);
                                    });


                                }
                            }, 200);
                        }

                        setDefaultValues = function (filter, fields) {

                            if (filter.logic && filter.logic.toLowerCase() == 'or') {
                                return;
                            }
                            if (typeof filter == 'object' && filter.hasOwnProperty('field') && filter.hasOwnProperty('operator') && filter.hasOwnProperty('value')) {
                                setDefaultValue(filter, fields);
                            }
                            else {
                                $.each(filter, function (filterKey, filterObject) {
                                    if (typeof filterObject == 'object') {
                                        if (filterObject.hasOwnProperty('field') && filterObject.hasOwnProperty('operator') && filterObject.hasOwnProperty('value')) {
                                            setDefaultValue(filterObject, fields);
                                        } else {
                                            setDefaultValues(filterObject, fields);  //RECURSION starts here
                                        }
                                    }
                                });
                            }
                        };
                        setDefaultValue = function (filter, fields) {
                            if (fields[filter.field]) {
                                var isNum = /^\d+$/.test(filter.value);
                                if (isNum) {
                                    //IF value is numeric -> set to filter's int-value
                                    fields[filter.field].defaultValue = parseInt(filter.value);
                                } else {
                                    //ELSE set defaultValue to filter's string-value
                                    fields[filter.field].defaultValue = filter.value;
                                }
                            }
                        }


                        //verify rights..
                        $.when(isGridVisiblePromise(self.gridname)).then(function () {
                            if (self.externalGridObject) {
                                self.setGridObject(self.externalGridObject);
                            } else {
                                MF.kendo.getGridObject({ gridName: self.gridname }).then(function (gridObject) {
                                    self.setGridObject(gridObject);
                                });
                            }

                            $scope.$watch('mg.filter', function () {
                                if (self && self.gridInstance && self.filter && self.gridInstance.dataSource) {
                                    self.gridInstance.dataSource.filter(combineDataSourceFilters(self.gridInstance.dataSource.filter(), $.extend(self.filter, { type: "customFilter" })));
                                }
                            });
                        });

                        //verify rights..
        //                $.when(isGridVisiblePromise(self.gridname)).then(function () {
        //                    MF.kendo.getGridObject({ gridName: self.gridname }).then(function (gridObject) {

        //                        //options are key-values which are passed in the select as a parameter                                 
        //                        if (gridObject) {
        //                            self.editablecolumnnumber = gridObject.editablecolumnnumber || "2";
        //                            if (self.command) {
        //                                gridObject.columns.push(self.command);
        //                            }
        //                            if (self.removeNewButton === true) { //REMOVE NEW BUTTON IF PARENT TAB IS READONLY
        //                                var newButton = gridObject.toolbar.find((tb) => { return tb.name == "create" });
        //                                var spliceIdx = gridObject.toolbar.indexOf(newButton);
        //                                var spliced = gridObject.toolbar.splice(spliceIdx, 1);
        //                            }
        //                        }
        //                        if (config.model || self.data) {
        //                            var origparmap = gridObject.dataSource.transport.parameterMap;
        //                            gridObject.dataSource.transport.parameterMap = function (options, operations) {
        //                                var orig_options = JSON.parse(origparmap.call(this, options, operations));
        //                                if (config.model && operations == "read")
        //                                    orig_options.data = kendo.stringify(config.model);
        //                                if (self.data) {
        //                                    orig_options.data = kendo.stringify($.extend(JSON.parse(orig_options.data ? orig_options.data : "{}") || {}, self.data));
        //                                }
        //                                return kendo.stringify({ ...orig_options, MergedScenario: config?.MergedScenario });
        //                            };
        //                            if (config.model && self.filterpk && config.model.id) {
        //                                gridObject.dataSource.filter = combineDataSourceFilters(gridObject.dataSource.filter, { field: self.filterpk, operator: "eq", value: config.model.id, type: "customPKFilter" });
        //                            }
								//}
								//if (self.filter && Object.keys(self.filter).length) {
        //                            gridObject.dataSource.filter = combineDataSourceFilters(gridObject.dataSource.filter, $.extend(self.filter, { type: "customFilter" }));
        //                            setDefaultValues(self.filter, gridObject.dataSource.schema.model.fields);
        //                        }
        //                        self.gridObject = gridObject;
        //                        if (self.gridoptionsextension) {
        //                            $.extend(self.gridObject, self.gridoptionsextension);
        //                        }

        //                        $timeout(function () {
								//	if (self.gridInstance) {
								//		self.gridInstance.setOptions(self.gridObject);
								//		self.kendoGridInstance = self.gridInstance;

								//		//manage user settings
								//		var grid = self.gridInstance;
								//		//S.mariani bug fix, file upload not initialized in magic-grid
								//		if (self.gridObject.editable) {
								//			grid.bind('save', function (e) {
								//					manageGridUploadedFiles(grid.element);
								//			}
								//			);
								//			grid.bind('saveChanges', function (e) {
								//					manageGridUploadedFiles(grid.element);
								//				}
        //                                    );
        //                                    try {
        //                                        $(grid.element).on("mousedown", ".k-grid-cancel-changes", function (e) {
        //                                                var gridElement = $(e.target).closest('[data-role="grid"]');
        //                                                gridElement.removeData('filesToSave');
        //                                                gridElement.removeData('filesToDelete');
        //                                            });
        //                                    } catch (e) {
        //                                        console.log('No "Undo" button present');
        //                                    }
								//		}
										
								//		if (grid.options.columnMenu) {
								//			grid.bind('columnHide', setSessionStorageGridColumnSettings);
								//			grid.bind('columnShow', setSessionStorageGridColumnSettings);
								//			grid.bind('columnResize', setSessionStorageGridColumnSettings);
								//			grid.bind('columnLock', setSessionStorageGridColumnSettings);
								//			grid.bind('columnUnlock', setSessionStorageGridColumnSettings);
								//		}

								//		if (grid.options.reorderable) {
								//			var usersGridSettings = getSessionStorageGridSettings(grid.options.gridcode, grid.options.functionid);
								//			if (usersGridSettings.columnOrder && !$.isEmptyObject(usersGridSettings.columnOrder)) {
								//				var hasCustomOrder = false;
								//				$.each(usersGridSettings.columnOrder, function (field, pos) {
								//					$.each(grid.columns, function (k, col) {
								//						if (col.field == field && pos != k) {
								//							hasCustomOrder = true;
								//							grid.reorderColumn(pos, col);
								//							return false;
								//						}
								//					});
								//				});
								//				if (!hasCustomOrder)
								//					deleteSessionStorageGridSettingByType(grid);
								//			}

								//			grid.bind('columnReorder', function (e) {
								//				setTimeout(function () { setSessionStorageGridColumnOrderSettings(e) }, 0);
								//			});
								//		}
								//		//this is needed to render print models...Bug #6269
        //                                $timeout(function () {
        //                                    if (window.vocalCommandsActive) {
        //                                        var searchField = grid.element.find('#maingridsearchandfilter');                                                
        //                                        enableVocalCommandsForMainGridSearchField(searchField);
        //                                    }
								//			$("#appcontainer").trigger("kendoGridRendered", [self.gridInstance, self.gridname]);
								//			//D.t added specific per grid event 
        //                                    $("#appcontainer").trigger("kendoGridRendered_" + self.gridname, [self.gridInstance, self.gridname]);
        //                                    if (typeof CheckGridConstaintsExistance == "function")
        //                                        CheckGridConstaintsExistance(self.gridInstance);
								//		});

									
								//	}
        //                        }, 200);
        //                    });
        //                    $scope.$watch('mg.filter', function () {
        //                        if (self && self.gridInstance && self.filter && self.gridInstance.dataSource) {
        //                            self.gridInstance.dataSource.filter(combineDataSourceFilters(self.gridInstance.dataSource.filter(), $.extend(self.filter, { type: "customFilter" })));
        //                        }
        //                    });
        //                });


                    }]
            }
        }]);
});