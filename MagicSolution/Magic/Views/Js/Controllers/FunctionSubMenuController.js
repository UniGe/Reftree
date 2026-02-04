define(["angular", "angular-filter", "angular-magic-form-sp","angular-magic-pivot","angular-magic-grid-sp"], function (angular) {
	return angular
		.module("FunctionSubMenu", ["angular.filter", "magicFormSp", "magicPivot", "magicGridSp"])
		.controller("FunctionSubMenuController",
			['config',
				'$http',
				'$scope',
				function (config, $http, $scope) {
					var self = this;
					self.showForm = false;//filter before loading grid 

					self.form = {
						//formName:"MY_FORM",
						loadSp: "config.USP_GET_FormData",
						setGridFilter: function (form,filterlogic) {//apply filter button of form
							$scope.$broadcast('schemaFormValidate');
							if (form.$valid) //reload the tree with the updated filter values 
							{
								let globalFilter = $.extend(this.filter, { logic: filterlogic });
								self.showForm = false;
								switch (this.btn.actiontype) {
									case "SHOGD":
										//the filter is written as model of the form which we are using for filtering
										self.showFunctionSubMenuGrid(globalFilter, this.btn);
										break;
									case "MGDSP":
										self.showAngularMagicGridSP(this.btn, globalFilter);
										break;
									default:
										this.filter = globalFilter;
										self.loadPivot(this.btn, this.filter);

								}
							}
						}
					};

					self.btngroups = [];
					self.MF = config.MF;
					let initialButton = null;
					self.init = function () {
						self.btngroups = config.btngroups;
						//https://gitlab.ilosgroup.com/ilos/operations/-/issues/325
						self.btngroups.forEach((btngroup) => {
							btngroup.btns.forEach((btn) => {
								if (btn.isInitialButton)
									initialButton = btn;
							});
						});
						if (initialButton)
							setTimeout(() => {
								self.dispatch(initialButton);
							}, 1000);
							
					};
					self.setFilterType = function (filter) {
						if (!filter)
							return;
						if (filter.filters)
							$.each(filter.filters, function (i, v) {
								v.type = "submenu_filter";
							});
						if (typeof filter == "object")
							filter.type = "submenu_filter";
					};
					self.setDefaultValues = function (filter, grid) {
						if (!filter)
							return;
						if (filter.filters && filter.logic.toUpperCase() == "AND")
							$.each(filter.filters, function (i, v) {
								if (v.field && grid.dataSource.schema.model.fields[v.field])
									grid.dataSource.schema.model.fields[v.field].defaultValue = v.value;
								if (!grid.dataSource.schema.model.fields[v.field]) //log if a field to filter has been defined in grid
									console.log(v);
							});
						else
							if (filter.field)
								grid.dataSource.schema.model.fields[filter.field].defaultValue = filter.value;
					};
					self.showFunctionSubMenuGrid = function (formfilter, btn, isEdit, gridAppendMode) {
						self.clearComponents();
						var filter = btn.actionfilter;
						if (typeof filter == "string")
							filter = JSON.parse(filter);

						var gridarray;
						//check if it's an array of grids to show 
						if (btn.actioncommand && btn.actioncommand.indexOf("[") != -1)
							gridarray = JSON.parse(btn.actioncommand); // [ {"gridName":"AS_ASSET..." , "title" : "Assets...","columnsoverride":"['col1','col2']"},{"gridName": "AS_V_aaa", "title":"AAA"} ]
						else
							gridarray = [{ gridName: btn.actioncommand, title: btn.btnlabel, columnsoverride: btn.columnsoverride }];

						if ($("#FunctionSubMenuGrid").length == 0) {
							$("nav").after("<div id ='FunctionSubMenuGrid'/>");
						}
						$.each(gridarray, function (i, v) {
							var selector = "FunctionSubMenuGrid-" + $("div[id^='FunctionSubMenuGrid']").length;
							var content = "<h3>" + v.title + "</h3><div id ='" + selector + "' class='" + v.gridName + "'/>";
							if (gridAppendMode == "APPEND" || gridAppendMode == "CLEAR" || !gridAppendMode) {
								$("#FunctionSubMenuGrid").append(content);
							}
							if (gridAppendMode == "PREPEND") {
								$("#FunctionSubMenuGrid").prepend(content);
							}
							//override behaviour of xml columns in this menu point....
							if (btn.columnsoverride)
								setOverridesToMenuData(v.gridName, { xmlcolumnsoverride: btn.columnsoverride });
							self.MF.kendo.getGridObject({ gridName: v.gridName }).then(function (gridobj) {
								if (formfilter) {
									var origparmap = gridobj.dataSource.transport.parameterMap;

									var filterData = function replaceTimezonesInDataObject(formFilterData) {
										$.each(formFilterData, function (k, v) {
											if (v instanceof Date)
												formFilterData[k] = toTimeZoneLessString(v);
											else if (typeof v == "string" && v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
												formFilterData[k] = toTimeZoneLessString(new Date(v));
										});
										return formFilterData;
									}($.extend({},formfilter));
									gridobj.dataSource.transport.parameterMap = function (options, operation) {
										var opts = origparmap.call(this, options, operation);
										var optsobj = JSON.parse(opts);
										optsobj.data = JSON.stringify(filterData);
										return kendo.stringify(optsobj);
									};
								}
								var gridfilter;

								if (filter)
									gridfilter = gridarray.length == 1 ? filter : filter[v.gridName];

								self.setFilterType(gridfilter);

								if (gridfilter)
									gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, gridfilter);

								self.setDefaultValues(gridobj.dataSource.filter, gridobj);


								self.MF.kendo.appendGridToDom({ kendoGridObject: gridobj, selector: selector });

								if (isEdit) {
									var defer = new $.Deferred();
									var $kgrid = $("#FunctionSubMenuGrid").data("kendoGrid");
									$kgrid.one("dataBound", function () { defer.resolve(); })
									$.when(defer).then(function () {
										var $row = $("#FunctionSubMenuGrid").find("div.k-grid-content tr").eq(0);
										if (btn.actiontype == "NEWGD")
											$kgrid.addRow();
										else
											$kgrid.editRow($row);
									});
								}
							});
						});
					};
					self.clearComponents = function (gridAppendMode) {
						self.showForm = false;
						$("#pivot__area").html("");
						$("#excel__area").html("");
						$("#gridsp__area").html("");
						if (gridAppendMode == "CLEAR" || !gridAppendMode) {
							$("#appcontainer .k-grid").each(function (i, v) {
								if ($(v).data("kendoGrid")) {
									$(v).data("kendoGrid").destroy();
									$(v).prev("h3").remove();
									$(v).remove();
								}
							});
							if ($("#FunctionSubMenuGrid").length > 0)
								$("#FunctionSubMenuGrid").remove();
						}
					};
					self.loadPivot = function (btn, formFilterData) {
						self.clearComponents();
						//inject html and init bootstrap controller
						var pivotsList = btn.actioncommand.split(",");
						$.each(pivotsList, function (i, v) {
							pivotsList[i] = "'" + v + "'";
						});
						var pivotHTML = '    <div id="piv__"  ng-controller="MultiTabPivotController as cc" class="ng-cloak">\
												<magic-pivot pivot-filter="cc.pivotFilter" pivot-codes="[{0}]" ></magic-pivot >\
											</div>'.format(pivotsList.join(","));
						$("#piv__").remove();
						$("#pivot__area").html(pivotHTML);
						angular
							.module("magicPivot")
							.controller("MultiTabPivotController", [function () {
								this.pivotFilter = {};
								if (formFilterData)
									this.pivotFilter[btn.actioncommand] = formFilterData;
							}
							]);

						angular.bootstrap($("#piv__")[0], ["magicPivot"]);
					};
					self.importExcel = function (btn) {
						self.clearComponents();
						var cmd = JSON.parse(btn.actioncommand);
						var config = {
							appAreaId: cmd.appAreaId,
							classId: cmd.classId,
							modelId: cmd.modelId
						};
						//inject html and init bootstrap controller
						//var excHTML = '    <div id="exc__"  class="ng-cloak"></div>';
						//$("#excel__area").append(excHTML);
						//getAngularControllerElement(cmd.Controller + "Controller", config);
						controllerRootElement = getAngularControllerRootHTMLElement(cmd.Controller, true, "c");
						initAngularController(controllerRootElement, cmd.Controller + "Controller", config, null, true);
						$("#excel__area").append(controllerRootElement);
					};

					self.translate = function (text) {
						return getObjectText(text);
					};
					self.showAngularMagicGridSP = function (btn,formFilter) {
						self.clearComponents();
						var cmd = btn.actioncommand;
						//inject html and init bootstrap controller
						var gridspHTML = '<h3>{4}</h3>\
											<div id = "gridsp__"  ng-controller="MagicGridSpController as mgsp" class="ng-cloak" >\
												<magic-grid-sp storedprocedure="{1}" savestoredprocedure="{2}" gridname="{0}" options="{3}"></magic-grid-sp>\
											</div>'.format(cmd.gridname, cmd.storedprocedure, cmd.savestoredprocedure, cmd.options, btn.btnlabel);
						$("#gridsp__").remove();
						$("#gridsp__area").html(gridspHTML);
						//add a form filter at db side
						if (formFilter)
							config.filter = formFilter;

						angular
							.module("magicGridSp")
							.controller("MagicGridSpController", [function () {
								//this.config = config;
							}
							]).value("config", config);
						angular.bootstrap($("#gridsp__")[0], ["magicGridSp"]);
					};
					self.dispatch = function (btn) {
						//to delete 
						//btn.filterFormName = "MY_FORM";

						if (btn.filterFormName) {
							self.form.btn = btn;
							//$("#appcontainer .k-grid").hide();
							self.clearComponents();
							self.showForm = true;
							self.form.formName = btn.filterFormName;
							self.form.Operator = "AND";
							return;
						}

						switch (btn.actiontype) {
							case "SHOGD": self.showFunctionSubMenuGrid(null, btn);
								break;
							case "EDTGD":
							case "NEWGD":
								self.showFunctionSubMenuGrid(null, btn, true);
								break;
							case "PIVOT":
								self.loadPivot(btn);
								break;
							case "EXCIMP":
								self.importExcel(btn);
								break;
							//magic-grid-sp
							case "MGDSP":
								self.showAngularMagicGridSP(btn);
								break;
						}
					};
					self.init();
				}
			]
		);
});