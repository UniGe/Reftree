define(['angular', "MagicSDK", 'angular-kendo'], function (angular, MF) {
    angular.module('magicGridSp', ['kendo.directives'])
        .directive('magicGridSp', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: { 
                },
                bindToController: {
                    storedprocedure: "@",
                    gridname: "@",
                    kendoGridInstance: "=",
                    options: "=",
                    savestoredprocedure: "@",
                    filter: "=",
                    data: "=",
                    removeNewButton: "="
                },
                controllerAs:"mg",
                template: '<div  kendo-grid="mg.gridInstance"  k-options="mg.gridObject"  gridname ="{{mg.gridname}}" storedprocedure="{{ mg.storedprocedure }}" savestoredprocedure="{{ mg.savestoredprocedure }}"></div>',
                controller: ["$scope",
                        "$timeout",
                        "config",
                        function ($scope, $timeout, config) {
                            var self = this;
							self.customItem = function (rowData, gridName, storedProcedure, controllerName, $grid, $row) {
								if (!controllerName)
									controllerName = 'FormOptionsController';
								var config = {};
								requireConfigAndMore(["MagicSDK"], function (MF) {
									config.model = rowData;
									config.$grid = $grid;
									config.$row = $row;
									config.options = rowData;
									MF.api.get({ storedProcedureName: storedProcedure, data: $.extend(rowData, { gridName: gridName }) }).then(function (res) {
										var page = res[0][0].HtmlPage;
										//page = "/Views/3/Templates/Custom/Asset_form.html"
										if ($("div.itemReport").length)
											$("div.itemReport").remove();
										var element = $("<div class='itemReport'><div id='datahidden'/><div id='mg-form' ng-controller='" + controllerName + " as foc' ng-include=\"'" + window.includesVersion + page + "'\">" + largeSpinnerHTML + "</div></div>");
										$("#appcontainer").data("customItemInfo", config.model);//adds the data to the js domain
										var $modalContent = showModal({
											title: '<i class="fa fa-television"></i>',
											content: element,
											wide: true
										});
										initAngularController($("#mg-form"), controllerName, config);
									});
								});
                            };



                          
                            self.createDataSource = function (res) {
                                return new kendo.data.DataSource({
                                    data: res[0],
                                    schema: {
                                        model: $.extend({ id: res[1][0].primaryKey }, JSON.parse(res[1][0].model))
                                    }
                                });
                            };
                            kendo.culture(window.culture);
							this.gridInstance = {}; 

							var data = self.data || config.model;
							if (config.model && config.model.toJSON) {
								data = config.model.toJSON();
								data.id = config.model.id;
							}

							MF.api.getDataSet({ data: data, gridName: self.gridname }, self.storedprocedure).then(function (res) {
								//Bug #6362 issues when the first dataset is empty...it's not part of the dataset
								if (res.length && res.length < 2 && res[0][0].columns) {
									//no data has been returned only definitions.
									res.unshift([]);
								}

                                var columns = JSON.parse(res[1][0].columns);
                           
                                var toolbar;

                                try {
                                    toolbar = JSON.parse(res[1][0].toolbar); 
                                }
                                catch (e) {
                                    console.error(e);
                                }

                                query_for_template_document(self.options, typeof document_template_manager != "undefined" ? (document_template_manager ? document_template_manager : {}) : {});
                                if (self.options.gridExtension && self.options.gridExtension.commandcolumn) {
                                    if (self.options.gridExtension.commandcolumn.commands && Array.isArray(self.options.gridExtension.commandcolumn.commands))
                                    {
                                        var commands = $.map(self.options.gridExtension.commandcolumn.commands, function (v, i) {
                                            var obj = ("per_record_summary_sp" in v) ? {
                                                type: "dataReader",
                                                text: getObjectText(v.text),
                                                name: self.gridname + "_view_"+i.toString(),
                                                click: function (e) {
                                                    var tr = $(e.target).closest("tr");
                                                    var $grid = $(e.target).closest(".k-grid");
                                                    var rowData = this.dataItem(tr);
                                                    self.customItem(rowData, self.gridname, v.per_record_summary_sp, null, $grid, tr);
                                                } 
                                            } : obj = v;

                                            if (v.className)
                                                obj.className = v.className;
                                            return obj;
                                        });
                                        if (!self.options.gridExtension.commandcolumn.islast)
                                            columns.unshift({ command: commands });
                                        else
                                            columns.push({ command: commands });

                                        if (self.options.gridExtension.commandcolumn.width)
                                            columns[0].width = self.options.gridExtension.commandcolumn.width;
                                    }
                                    else
                                        columns.unshift(self.options.gridExtension.commandcolumn);
                                }
                                self.gridObject = {
                                    saveChanges: function (e) {
                                        var datapayload = $.map(e.sender.dataSource.data(), function (v, i) {
                                            if (v.dirty)
                                                return v;
                                            else
                                                return;
                                        });
                                        if (!datapayload.length) {
                                            e.preventDefault();
                                            return;
                                        }
                                        var datatopost = buildGenericPostInsertUpdateParameter("customaction", self.savestoredprocedure, null, self.savestoredprocedure, "XML", sessionStorage.fid ? sessionStorage.fid : null, null, { models: datapayload }, null);
                                        var data = JSON.parse(datatopost);
                                        $(data.models).each(function (k, v) {
                                            $.each(v, function (key, val) {
                                                if (typeof val == "string" && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
                                                    v[key] = toTimeZoneLessString(new Date(val));
                                            });
                                        });
                                        $.ajax({
                                            type: "POST",
                                            url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
                                            data: JSON.stringify(data),
                                            contentType: "application/json; charset=utf-8",
                                            dataType: "json",
                                            success: function (result) {
                                                var msg = "OK";
                                                var msgtype = false;
                                                if (result.message !== undefined) {
                                                    msg = result.message;
                                                    if (result.msgtype == "WARN")
                                                        msgtype = "info";
                                                }
                                                kendoConsole.log(msg, msgtype);
                                                MF.api.getDataSet({ gridName: self.gridname }, self.storedprocedure).then(function (res) {
                                                    self.gridInstance.setDataSource(self.createDataSource(res));
                                                });
                                            },
                                            error: function (message) {
                                                kendoConsole.log(message.responseText, true);
                                                MF.api.getDataSet({ gridName: self.gridname }, self.storedprocedure).then(function (res) {
                                                    self.gridInstance.setDataSource(self.createDataSource(res));
                                                });
                                            }
                                        });
                                    },
                                    filterable:setDefaultFilterSettings(),
                                    columns: columns,
                                    toolbar: toolbar,
                                    dataSource: self.createDataSource(res)
                                };

                               
                                self.gridObject = $.extend(self.gridObject, self.options);

                                if (toolbar)
                                    self.gridObject.toolbar = toolbar;//FA
                                if (self.options.gridExtension && self.options.gridExtension.showMap) {
                                    if (!self.gridObject.toolbar)
                                        self.gridObject.toolbar = [];
                                    self.gridObject.toolbar.unshift({
                                        template: "<a class=\"k-button pull-right\" title=\"Map\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"showGridMap(this)\"><span class=\"fa fa-globe\"></span></a>"
                                    });
                                    self.gridObject.toolbar.unshift({
                                        template:"<a class=\"k-button pull-right\" title=\"" + getObjectText("resetUserfilter") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"removeUserFiltersFromToolBarButton(this)\"><span class=\"fa fa-eraser\"></span></a>"
                                        + "<a class=\"k-button pull-right\" title=\"" + getObjectText("autoResizeColumns") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"autoResizeColumns(this)\"><span class=\"fa fa-arrows-h\"></span></a>"
                                    });
                                }
                                if (self.removeNewButton === true) {        //REMOVE NEW BUTTON IF PARENT TAB IS READONLY
                                    var newButton = self.gridObject.toolbar.find((tb) => { return tb.name == "create" });
                                    var spliceIdx = self.gridObject.toolbar.indexOf(newButton);
                                    if (spliceIdx != -1) {
                                        var spliced = self.gridObject.toolbar.splice(spliceIdx, 1);
                                    }
                                }
                                $timeout(function () {
                                    if (self.gridInstance) {
                                        self.gridInstance.setOptions(self.gridObject);
                                        self.kendoGridInstance = self.gridInstance;
                                        $timeout(function () {
											$("#appcontainer").trigger("kendoGridRendered", [self.gridInstance, self.gridname]);
											//D.t added specific per grid event 
                                            $("#appcontainer").trigger("kendoGridRendered_" + self.gridname, [self.gridInstance, self.gridname]);
                                            if (typeof CheckGridConstaintsExistance == "function")
                                                CheckGridConstaintsExistance(self.gridInstance);
                                        });
                                   }
                                });
                                $scope.$watch('mg.filter', function () {
                                    if (self && self.gridInstance && self.filter && self.gridInstance.dataSource) {
                                        self.gridInstance.dataSource.filter(combineDataSourceFilters(self.gridInstance.dataSource.filter(), $.extend(self.filter, { type: "user" })));
                                    }
                                });
                  
                                });
                        }]
            }
        }]);
});