(function () {
	var dependencies = ["angular", "MagicSDK", "angular-sanitize", "angular-ui-sortable", "angular-kendo", "angular-filter", "angular-magic-grid",
		"jQueryUI", "lodash", "gridstack", "gridstack-angular", "angular-magic-chart", "angular-magic-chart-gauge", "angular-magic-grid", "angular-magic-grid-sp", "angular-magic-form", "angular-easy-map", "angular-magic-slider", "angular-magic-form-sp", "angular-magic-actions", "angular-magic-indicator", "angular-magic-carousel"],     // "angular-magic-action-menu"
		angular, MF,
		controllerName = "GridEditDisplay", currentCode, currentRowID;

	define(dependencies, function (a, m) {
		angular = a;
		MF = m;
		controller.apply({}, arguments);
		return init;
	});

	loadCss(["gridstack"], window.includesVersion + "/Magic/v/2018.1.0.0/Styles/3rd-party/gridstack/");

	function init(code, rowid) {
		currentCode = code;
		currentRowID = parseInt(rowid);
		var element = getAngularControllerRootHTMLElement(controllerName);
		$("#grid").html(element);
		angular.bootstrap(element, [controllerName]);
	}

	function controller(angular, MF) {
		angular
			.module(controllerName, ["kendo.directives", "angular.filter", "ui.sortable", "gridstack-angular", "magicGrid", "magicGridSp", "magicChart", "magicChartGauge", "magicForm", "easyMap", "magicSlider", "magicFormSp", "magicActions", "magicIndicator", "magicCarousel"])
			.value("config", {})
			.controller(controllerName + "Controller", [
				'$timeout',
				'$http',
				'$scope',
				'$sce',
				function ($timeout, $http, $scope, $sce) {
					var self = this;
					self.redirectPath = '';
					self.templateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-display.html";
					self.widgetTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-display-widget.html";
					self.widgetGroupTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-display-group_widget.html";
					self.tabstripTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-display-tabstrip_widget.html";
					self.text = {
						NO_ACCESS_TO_PAGE: getObjectText('noAccessToPage'),
						NO_ACCESS_TO_PAGE_LINK: getObjectText('backToDashboard'),
						NO_LAYOUT_FOUND_IN_DB: getObjectText('noLayoutFound'),
						NO_TITLE_SPECIFIED: getObjectText('noTitleSpecified'),
					};
					self.PageLayout = null;
					self.IsAuthentificated = false;
					self.userAuthStoredProcedure = "dbo.Magic_EditPageAuth";

					self.mobileLayout = false;
					self.tabletLayout = false;
					self.desktopLayout = true;
					self.currentLayoutType = 'desktop';

					self.showStandardActions = false;
					self.showCustomActions = false;

					self.mainFormSubmitted = false;
					self.mainFormInitialized = false;
					self.rowDataInitialized = false;
					self.widgetDataInitialized = false;
					self.reloadingCharts = false;
					self.reloadingGrids = false;
					self.currentTabId = 0;
					self.loadTabContent = {};
					self.loadTabContent[0] = true;
					
					self.rowIsReadonly = false;
					self.mainForms = {
						desktop: null,
						tablet: null,
						mobile: null,
					};
					self.mainFormTableName = '';
					self.mainFormData = {};
					self.mainFormModel = null;
					self.magicFormScopes = [];
					self.gridInstances = {};
					self.parentGridFilter = null; //variable is set if EditPage was opened from <magic-grid> inside other EditPage


					initFilter = function (wdgt) {
						/**
						 * evaluates filter values
						 * @param {any} filter - the filter from configuration
						 * @param {any} data - the model of the main grid
						 * @param {any} grid - the grid which has to be filtered
						 */
						var filterEval = function (filter, data) {
							function getFilterValue(data, filter) {
								//the property exists but is = null
								if (filter.value in data && data[filter.value] == null)
									return null;
								//it does have a look up in data
								if (data && data[filter.value] != undefined)
									return data[filter.value];
								//no look up, and it's a string (constant)
								if (filter.value && typeof filter.value.indexOf == "function")
									return filter.value.replace("@", '');
								//return the value given by the config
								return filter.value == undefined ? null : filter.value;
							}

							function lookUpValues(filter, type, data) {
								for (i = 0; i < filter.filters.length; i++) {
									var slice = filter.filters[i];
									if (slice.logic) //recur if nested
										lookUpValues(slice, type, data);
									slice.value = getFilterValue(data, slice);
									if (filter.logic.toUpperCase() === "AND")
										slice.type = type; //if is a AND-filter set type to every subfilter
								}
								if (filter.logic.toUpperCase() === "OR") //if is a OR-filter set type in first level of filter-object
									filter.type = type;
								return;
							}
							var type = "editpage";
							if (filter.logic)
								lookUpValues(filter, type, data);
							else { //caso di filtri senza logic specificato
								filter.value = getFilterValue(data, filter);
								filter.type = type;
							}
							return filter;
						}
						if (wdgt.filterObj && Object.keys(wdgt.filterObj).length && self.mainFormSubmitted || wdgt.contentType == 'MAGIC-FORM') {
							wdgt.filterObj = filterEval(wdgt.filterObj, self.mainFormModel);
						}
						if (wdgt.filterObj && wdgt.filterObj.field) {
							wdgt.magicChartFilter = {};
							wdgt.filter = {};
							wdgt.magicChartFilter[wdgt.filterObj.field] = wdgt.filterObj.value;
							wdgt.filter[wdgt.filterObj.field] = wdgt.filterObj.value;
							return;
						}
						if (wdgt.filterObj && typeof wdgt.filterObj.filters !== 'undefined' && wdgt.filterObj.filters[0].operator == 'eq') {
							wdgt.magicChartFilter = {};
							wdgt.filter = {};
							wdgt.magicChartFilter[wdgt.filterObj.filters[0].field] = wdgt.filterObj.filters[0].value;
							wdgt.filter[wdgt.filterObj.field] = wdgt.filterObj.value;
						}
					};
					initTitle = function (wdgt) {
						switch (window.culture) {
							case 'it-IT':
								wdgt.title = wdgt?.titles?.it || wdgt.title;
								break;
							case 'de-DE':
								wdgt.title = wdgt?.titles?.de || wdgt.title;
								break;
							case 'en-GB':
								wdgt.title = wdgt?.titles?.en || wdgt.title;
								break;
							case 'en-US':
								wdgt.title = wdgt?.titles?.en || wdgt.title;
								break;
							default:
								wdgt.title = wdgt?.titles?.en || wdgt.title;
								break;
						}

						if (wdgt.groupWidgets) {
							$.each(wdgt.groupWidgets, function (i, groupWdgt) {
								initTitle(groupWdgt);
							})
						}
						if (wdgt.tabs) {
							$.each(wdgt.tabs, function (i, tab) {
								initTitle(tab);
							})
						}

					};
					initCss = function (wdgt, layoutType) {
						var css = wdgt.additionalCSSObj[layoutType];

						if (!css) {
							return;
                        }

						if (typeof css == 'string' && css.includes('col')) {
							var parts = css.split("-");
							var parsedWidth = parseInt(parts[2]);
							if (parsedWidth) {
								wdgt.width = parsedWidth;
							}
						} else {
							wdgt.css = css;
						}
					};
					self.mapWidgets = [];
					self.mapDataReady = false;
					self.mapMarkers = [];
					initMapMarkers = function (data, widget, layoutType) {
						widget.layoutType = layoutType;
						self.mapWidgets.push(widget);
						var markers = [];
						$.each(data, function (i, el) {
							if (!isNaN(parseFloat(el.latitude)) && isFinite(el.latitude)) { //check if numeric value
								var marker = {};
								marker.latitude = parseFloat(el.latitude);
								marker.longitude = parseFloat(el.longitude);
								marker.title = el.code;
								markers.push(marker);
							} else {
								return false;
							}
						});
						widget.mapMarkers = markers;
						self.mapDataReady = true;
						$timeout();
					};
					self.slideWidgets = [];
					initImages = function (data, widget, layoutType) {
						widget.layoutType = layoutType;
						self.slideWidgets.push(widget);
						var images = [];
						$.each(data, function (i, el) {
							if (el.image && typeof el.image != 'undefined') {
								var imgDataObj = {};
								imgDataObj.image = el.image;
								imgDataObj.title = el.description;
								imgDataObj.data = el;
								images.push(imgDataObj);
							}
						});
						if (widget.contentType == 'MAGIC-IMAGE-SLIDER') {
							widget.slideImages = images;
							widget.slideImagesInitialized = true;
						} else if (widget.contentType == 'MAGIC-IMAGE-CAROUSEL') {
							widget.carouselImages = images;  
						}
						$timeout();
					};
					var magicGridCount = 0;
					initGridListener = function (gridWidget) {

						var gridInstanceName = 'grid' + magicGridCount;
						self.gridInstances[gridInstanceName] = {};
						gridWidget.gridInstance = gridInstanceName;
						magicGridCount++;

					};
					self.activateGridListeners = function () {
						$timeout(function () {
							$.each(self.gridInstances, function (key, instance) {
								if (instance && instance.dataSource) {
									instance.dataSource.bind("change", onMagicGridChanged);
								}
							});
						}, 1000);
					};
					onMainFormChanged = function (param) {
					}
					onMainFormRendered = function (elem) {
						self.activateGridListeners();
						self.isSaving = false;
					};
					onMagicFormChanged = function (param) {
					};
					onMagicFormRendered = function (elem) {

					};
					self.onMapReady = function () {

					};
					self.onMapSelect = function () {

					};
					self.onMagicChartRendered = function () {
						self.activateGridListeners();
					};
					var lastAction = '';
					onMagicGridChanged = function (e) {
						if (!e.action && lastAction == 'sync') {
							refreshCharts();
							refreshMapsAndSlides();
							lastAction = null;
						}
						if (e.action) {
							lastAction = e.action;
						}
					};
					formsAreValid = function () {
						$scope.$broadcast('schemaFormValidate');
						for (var i = 0; i < self.magicFormScopes.length; i++) {
							var $form = self.magicFormScopes[i];
							if (!$form.$valid) {
								return false;
							}
						}
						return true;
					};
					removeObjectPropsFromModel = function () {	//clears "double"-props
						var mainFormModelKeys = Object.keys(self.mainFormModel)
						mainFormModelKeys.forEach(function (key) {
							var prop = self.mainFormModel[key];

							if (typeof prop === 'object' && prop != null) {
								var propKeys = Object.keys(prop);

								propKeys.forEach(function (propKey) {
									if (prop[propKey] != null && typeof prop[propKey] === 'object') {

										delete prop[propKey];
									}
								});
							}
						})
					}
					/* MAIN-FORM callback --> save() */
					self.isSaving = false;	//disables save-btn while saving
					self.onMainFormSubmitted = function () {
						if (self.isSaving) {
							return;
						}
						self.isSaving = true;
						$timeout(function () {
							self.isSaving = false;
						}, 5000)
						if (!formsAreValid()) { //FORM-VALIDATION
							self.isSaving = false;
							kendoConsole.log(getObjectText('fillInRequiredFieldsBeforeSaving'), true);
							return; //skip saving if one of the displayed forms is invalid
						}

						//fix problems with datepickers writing UTC iso strings ...
						var dateFixer = function (val) {
							if (typeof val == "string" && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
								return toTimeZoneLessString(new Date(val));
							return val;
						};
						var extensionsFinder = function (model) {
							let extensionKeys = [];
							$.each(model.toJSON ? model.toJSON() : model, function (k, v) {
								if (v instanceof Object && !v.getMonth)
									extensionKeys.push(k);
							});
							return extensionKeys;
						};
						if (self.editExistingRow) {         //EDIT
							doModal(true)
							$.each(self.mainFormModel, function (key, val) {
								self.mainFormModel[key] = dateFixer(val); // D.t fixes datepicker UTC in main form
							});

							$.each(extensionsFinder(self.mainFormModel), function (i, value) {  //D.T fixes UTC datepicker issues in extension forms
								$.each(self.mainFormModel[value], function (key, val) {
									self.mainFormModel[value][key] = dateFixer(val);
								});
							});

							$.each(self.mainGridDataSrc.data(), function (i, mainGridRow) { //needed to set row to dirty
								if (mainGridRow[self.mainGridDataSrc.options.schema.model.id] == self.mainFormModel[self.mainGridPrimaryKey]) {
									mainGridRow.dirty = true;
									$.each(self.mainFormModel, function (k, v) {
										mainGridRow[k] = v;
									});
								}
							});

							removeObjectPropsFromModel();
							self.mainGridDataSrc.sync()
								.then(() => {
									self.mainFormSubmitted = true;
									kendoConsole.log("Saved successfully!");									
									doModal(false)
									$timeout(function () {
										self.notifyParentGrid();
										refreshGrids();
										resizeWidgets();
										//refreshForms();
										initWidgets(true);
										//self.reloadingForms = true;
										//$timeout(function () {
										//	self.reloadingForms = false;
										//}, 1);
									});
								})
						} else {
							doModal(true)
							$.each(self.mainFormModel, function (key, val) {
								self.mainFormModel[key] = dateFixer(val); // D.t fixes datepicker UTC in main form
							});
							$.each(extensionsFinder(self.mainFormModel), function (i, value) {  //D.T fixes UTC datepicker issues in extension forms
								$.each(self.mainFormModel[value], function (key, val) {
									self.mainFormModel[value][key] = dateFixer(val);
								});
							});

							self.mainGridDataSrc.add(self.mainFormModel);
							self.mainGridDataSrc.filter([]);

							self.mainGridDataSrc.sync().then(() => {
								doModal(false)
							});
						}

						$timeout(function () {
							doModal(false)
						}, 5000)
					};
					self.notifyParentGrid = function (id = null) {
						try {
							window.opener.postMessage(id || self.mainFormModel[self.mainGridPrimaryKey]); //sending message to refresh PARENT-GRID
						} catch (ex) {
							console.log("window.opener is undefined: parent-grid can't be refreshed.");
						}
					};
					var lastBootstrapBreakpoint = null;
					var resizetime;
					var resizetimeout = false;
					var resizedelta = 500;

					function resizeend() {
						if (new Date() - resizetime < resizedelta) {
							setTimeout(resizeend, resizedelta);
						} else {
							resizetimeout = false;

							var bootstrapBreakpoint = getBootstrapEnvironment();

							if (lastBootstrapBreakpoint != null && bootstrapBreakpoint == lastBootstrapBreakpoint) { //onWindowResize is fired frequently while dragging window								
								return;
							}

							switch (bootstrapBreakpoint) {
								case 'xs':
									self.mobileLayout = true;
									self.tabletLayout = false;
									self.desktopLayout = false;
									self.currentLayoutType = 'mobile';
									break;
								case 'sm':
									self.mobileLayout = false;
									self.tabletLayout = true;
									self.desktopLayout = false;
									self.currentLayoutType = 'tablet';
									break;
								case 'lg':
									self.mobileLayout = false;
									self.tabletLayout = false;
									self.desktopLayout = true;
									self.currentLayoutType = 'desktop';
									break;
								default:
									self.mobileLayout = false;
									self.tabletLayout = false;
									self.desktopLayout = true;
									self.currentLayoutType = 'desktop';
									break;
							}
							initWidgets(); //widgets for that layoutType were NOT YET initialized!
							$timeout();
						}
					}

					onWindowResized = function (initCall = false) {

						if (initCall == true) {
							$timeout(function () {
								resizeWidgets();
								self.activateGridListeners();
							}, 1000);
						} else {
							resizetime = new Date();
							if (resizetimeout === false) {
								resizetimeout = true;
								setTimeout(resizeend, resizedelta);
							}
						}

						if (initCall == true) {
							$timeout(function () {
								resizeWidgets();
								self.activateGridListeners();
							}, 1000);
						}
					};
					self.onGroupToggle = function (widget, $event) {
						var target = $($event.target);

						var gsItem = target.closest('.grid-stack-item');
						var gridstack = gsItem.parent().data('gridstack');
						if (!widget.groupExpanded) {  //show group

							gridstack.resize(gsItem, widget.expandedWidth, widget.expandedHeight);
							widget.groupExpanded = true;
							// updateWidgetsBelow(gsItem, gridstack); //no need to call, gridstack does the trick                                       
						} else {                      //hide group

							var expandedHeight = $(gsItem).attr('data-gs-height');
							var yOffset = parseInt(expandedHeight) - 1; //!! -1 necessary
							widget.expandedWidth = widget.width;
							widget.expandedHeight = widget.height;
							gridstack.resize(gsItem, widget.width, 0);
							widget.groupExpanded = false;
							updateWidgetsBelow(gsItem, gridstack, yOffset);
						}
					};
					self.gaugeCallback = function (obj) {
						$timeout(function () {
							$('[data-role="radialgauge"]').css({
								width: '',
								height: ''
							});
							kendo.resize('#appcontainer');
						});
					};					
					self.changeTab = function (tabId) {
						$('.li-nav-editpage').removeClass('active');
						$('a[href="#tab' + tabId + '"]').parent('li').addClass('active');
						self.currentTabId = tabId;
						self.loadTabContent = {};
						self.loadTabContent[tabId] = true;
						$timeout();
						resizeWidgets();
						initWidgets();
					};
					self.onTabstripTabSelected = function (tabId) {
						//self.loadTabstripTabContent = {}; resetting object not cool for tabstrips inside tabstrips https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/97
						self.loadTabstripTabContent[tabId] = true;
						resizeWidgets();
					};
					/**
					 * gets minimum tabstrip tab index
					 * @param {any}  listOfTabs - the list of tabs
					 * @returns {number} - min
					 */
					self.getMinimumIdx = function (listOfTabs) {
						var min;
						listOfTabs.forEach(function (x) {
							if (!min && min != 0)
								min = x.tabNum;
							if (min && x.tabNum < min)
								min = x.tabNum;
						});
						return min;
					};
					self.getMinimumId = function (listOfTabs) {
						var min;
						listOfTabs.forEach(function (x) {
							if (!min && min != 0)
								min = x.id;
							if (min && x.id < min)
								min = x.id;
						});
						return min;
					};
					self.onChartReady = function (chartInstance) {

					};
					updateWidgetsBelow = function (gsNode, gridstack, yOffset) {
						var currentY = $(gsNode).attr('data-gs-y');
						var currentHeigth = $(gsNode).attr('data-gs-height');
						var nextFreeYPos = parseInt(currentY) + parseInt(currentHeigth);

						$.each(gridstack.grid.nodes, function (i, node) {
							if (node.y > nextFreeYPos) {
								//check if area is clear
								//var freeSpace = gridstack.willItFit(node.x, nextFreeYPos, node.width, node.height);
								gridstack.move(node.el, node.x, node.y - yOffset);
							}
						});
					};
					self.reloadingForms = false;
					refreshCharts = function () {
						self.reloadingCharts = true;
						$timeout();
						$timeout(function () {
							self.reloadingCharts = false;
						}, 1);
					};
					refreshGrids = function () {
						self.reloadingGrids = true;
						$timeout();
						$timeout(function () {
							self.reloadingGrids = false;
						}, 1);
					};
					refreshMapsAndSlides = function () {
						$.each(self.mapWidgets, function (i, mapWdgt) {
							initMapWidget(mapWdgt);
						});
						$.each(self.slideWidgets, function (i, slideWdgt) {
							initSliderOrCarouselWidget(slideWdgt);
						});
					};
					resizeWidgets = function () {
						//set GAUGE containers
						kendo.resize('#appcontainer');          //GRID-resizing
						var charts = $('.k-chart');
						$.each(charts, function (key, chart) {  //CHART-resizing
							var chartData = $(chart).data('kendoChart');
							chartData.redraw();
						}); // (FORMS-resizing with CSS)
					};
					getBootstrapEnvironment = function () {
						var envs = ['xs', 'sm', 'md', 'lg'];
						var $el = $('<div>');
						$el.appendTo($('body'));
						for (var i = envs.length - 1; i >= 0; i--) {
							var env = envs[i];
							$el.addClass('hidden-' + env);
							if ($el.is(':hidden')) {
								$el.remove();
								return env;
							}
						}
					};
					getRedirectUrl = function () {  // (( 1 ))
						if (sessionStorage.gridEditPage_parentGridFilter) {	//defined if page was opened from previous GridEditPage #parentGridFilter
							self.parentGridFilter = JSON.parse(sessionStorage.gridEditPage_parentGridFilter);
                        }

						var url = window.location.href;
						var urlSplitted = url.split('/');
						var mode = urlSplitted[4];
						if (mode == 'edit') {               //detect mode from URL, generate URL to redirect after creating new Row
							self.editExistingRow = true;
							self.mainFormSubmitted = true;
						} else if (mode == 'new') {
							self.editExistingRow = false;
							self.mainFormSubmitted = false;
							urlSplitted[4] = 'edit';
							urlSplitted.pop();  //remove wrong id (0) at end of path
							$.each(urlSplitted, function (key, urlPart) {
								self.redirectPath += urlPart;
								self.redirectPath += '/';
							});
						}
						self.noAccessRedirectPath = window.location.origin;
						self.noAccessRedirectPath += "/dashboard-v2";
					};
					getLayoutDataFromDB = function () {  // (( 2 ))
						/* GET EditPage-Layout from DB */
						$http.get("api/MAGIC_GRIDS/GetEditPage", {
							params: { code: currentCode }
						}).then(function (response) {
							if (response.data) {
								if (self.UserStatus != false) {
									$('.page-title > h3').text(response.data.Description);  //set title
									var jsonDef = response.data.JsonDefinition;
									self.PageLayout = JSON.parse(jsonDef);
									initMainFormData(); // ((3))
									if (self.mainFormInitialized) {
										getRowDataFromDB(); // ((4))  //calls initWidgets   
									}
								}
							} else {
								alert(self.text.NO_LAYOUT_FOUND_IN_DB);
								return;
							}
						});
					};
					getUserAuthData = function () {
						return MF.api.getDataSet({ code: currentCode, model: self.mainFormModel },
							self.userAuthStoredProcedure);
					};
					getTabRestrictions = function () {
						var e = {};
						e.gridname = self.mainGridName;
						e.data = self.mainFormModel;
						return window.getStandard_GetTabRestrictions(e);
					};
                    /**
                     * Gets user rights
                     * 
                     */
					authentificateUser = function (res) {
						try {
							var userRights = getGridRights(self.mainGridName);

							if (userRights.usercanupdate === false) {
								return 'read';
							}

							if (res && res.length) {
								var status = res[0][0];
								if (status.update === true && userRights.usercanupdate === true) {
									if (!(self.MainGridIsEditable === false)) {
										return 'update';
									}
								} else if (status.read === true) {
									return 'read';
								} else {
									return false;
								}
							}
							return false;
						}
						catch (ex) {
							console.log(ex);
						}
						console.error("check stored-procedure" + self.userAuthStoredProcedure);
						return false;
					};
					initMainFormData = function () {  // (( 3 ))
						var minTabIdx = self.getMinimumId(self.PageLayout);
						var mainTab = self.PageLayout.find(function (tab) {
							return tab.id == minTabIdx;
						});

						self.mainFormGroupData = mainTab.widgets[self.currentLayoutType].find(wdgt => { return wdgt.id == 'mainFormGroup' });
						self.mainFormData = self.mainFormGroupData.groupWidgets.find(grWdgt => { return grWdgt.id == 'mainForm' });
						self.mainFormGroupData.isMainFormGroup = true;
						self.mainFormTableName = self.mainFormData.contentObjectPath;
						self.mainFormOptions.itemsPerRow = self.mainFormData.numOfFormColumns;
						self.mainFormOptions.hideTabs = self.mainFormData.hideTabs;
						self.mainFormInitialized = true;
					};
					var datepickerfields = [];
					getRowDataFromDB = function () {  // ((4))
						/* GET data of clicked Row */
						MF.kendo.getGridObject({ gridName: self.mainFormTableName }).then(function (gridobj) {
							if (gridobj.editable === false) { //Grid not editable 
								self.UserStatus = 'read';
								self.MainGridIsEditable = false;
							}
							self.mainGridName = gridobj.code;	//MainForm's parent grid
							self.mainGridEntityName = gridobj.EntityName;
							self.mainGridDataSrc = new kendo.data.DataSource(
								$.extend({}, gridobj.dataSource, { filter: { field: gridobj.dataSource.schema.model.id, operator: "eq", value: parseInt(currentRowID) } },
									{
										requestEnd: function (e) {
											if (!e.type || e.type == "read") {
												$("#grid-is-loading-spinner").remove();
												return;
											}
											if (e.response.Errors) {
												console.error(e.response.Errors);
												return;
											} else if (!self.editExistingRow) {
												var idOfInsertedRow = e.response.Data[0].Table[0][gridobj.dataSource.schema.model.id];
												self.redirectPath += idOfInsertedRow;
												self.notifyParentGrid(idOfInsertedRow);
												window.location.assign(self.redirectPath);
											}
										}
									})
							);
							self.mainGridDataSrc.read().then(function () {
								var currDataRow = self.mainGridDataSrc.view().find(row => row[gridobj.dataSource.schema.model.id] == currentRowID);
								if (!currDataRow && self.editExistingRow) {
									self.text.NO_ACCESS_TO_PAGE = getObjectText('recordDoesNotExistAnymore');
									kendoConsole.log(self.text.NO_ACCESS_TO_PAGE, true);
									self.IsAuthentificated = true;
									self.UserStatus = false;
									return;
								}
								self.mainGridPrimaryKey = self.mainGridDataSrc.options.schema.model.id;
								setupModelFieldsForFormValidation(self.mainGridDataSrc.options.schema.model.fields);
								getUserAuthData().then(function (res) {

									if (self.mainFormModel && (self.mainFormModel.Editable === false || self.mainFormModel.Readonly)) {     //ROW READONLY
										self.rowIsReadonly = true;
									}
									if (self.editExistingRow) {
										self.mainFormModel = currDataRow.toJSON();
										self.actionsModel = currDataRow;
									} else {
										self.mainFormModel = {};
										self.mainFormModel[self.mainGridPrimaryKey] = currentRowID; //set id to 0
									}

									formatDateFieldsForFormValidation(self.mainFormModel);		//workaround for buggy sf-validation of datepickers
									formatTextFieldsForFormValidation(self.mainFormModel);
									formatUploadFieldsForFormValidation(self.mainFormModel)
									self.UserStatus = authentificateUser(res);
									self.IsAuthentificated = true;

									if (typeof getStandard_GetTabRestrictions == 'function') {

										getTabRestrictions().then(function (tabFilter) {
											if (tabFilter.items) {
												let ritems = tabFilterReader(tabFilter.items);
												self.nonVisibleTabs = ritems.restrictedtabs;     //non visible
												self.readonlyTabs = ritems.noneditabletabs; //readonly
											}
											applyTabRestrictions();
											self.rowDataInitialized = true;
											initWidgets();
											initActions();
											self.RenderLayout = self.PageLayout;   //start RENDERING LAYOUT
											$timeout();
										});
									} else {
										self.rowDataInitialized = true;
										initWidgets();
										self.RenderLayout = self.PageLayout;   //start RENDERING LAYOUT
										$timeout();
									}
								});
							});
						});
					};
					applyTabRestrictions = function () {
						$.each(self.nonVisibleTabs, function (i, nonvistabCode) {
							var match = self.PageLayout.find(tab => { return tab.code == nonvistabCode });
							if (match) {
								self.PageLayout.splice(self.PageLayout.indexOf(match), 1);
							}
						});
						$.each(self.readonlyTabs, function (i, readonlytabCode) {
							var match = self.PageLayout.find(tab => { return tab.code == readonlytabCode });
							if (match) {
								match.isReadonly = true;
							}
						});
					};
					initTabTitle = function (tab) {
						if (tab.titles.en == '' && tab.titles.it == '' && tab.titles.de == '') {
							if (tab.titles.working != '') {
								tab.title = tab.titles.working;
							} else {
								tab.title = self.text.NO_TITLE_SPECIFIED;
							}
							return;
						} else {
							switch (window.culture) {
								case 'en-GB':
									tab.title = tab.titles.en;
									break;
								case 'it-IT':
									tab.title = tab.titles.it;
									break;
								case 'de-DE':
									tab.title = tab.titles.de;
									break;
								default:
									if (tab.titles.working != '') {
										tab.title = tab.titles.working;
									} else {
										tab.title = self.text.NO_TITLE_SPECIFIED;
									}
							}
						}
						if (tab.title.length == 0) {
							tab.title = tab.titles.it || tab.titles.en || tab.titles.de;
						}
					};
					initMagicFormOptions = function (widget, layoutType) {						
						var valsToResolve = {};
						if (Object.keys(self.mainFormModel).length > 1) {
							valsToResolve = $.extend({}, self.mainFormModel);
						}
						var opts = {
							itemsPerRow: parseInt(widget.numOfFormColumns),
							hideTabs: widget.hideTabs,
							callback: function ($data, $magicFormScope) {
								if ($magicFormScope.$form) {
									self.magicFormScopes.push($magicFormScope.$form);
								}
							},//onMainFormChanged,
							renderDone: onMainFormRendered,
							valuesToResolve: valsToResolve,
							gridEditPage: true,
						};
						widget.magicFormOptions = opts;
						if (widget.id == 'mainForm') {
							self.mainForms[layoutType] = widget;
							if (self.parentGridFilter) { //#parentGridFilter
								var filter = null;
								if (self.parentGridFilter.filters && Array.isArray(self.parentGridFilter.filters) && self.parentGridFilter.filters.length > 0) {									
									filter = self.parentGridFilter.filters[0];
								}
								else if (self.parentGridFilter.field && self.parentGridFilter.operator && self.parentGridFilter.value) {
									filter = self.parentGridFilter;
                                }
								if (filter && filter.operator == "eq") {
									self.mainFormModel[filter.field] = filter.value;
                                }
                            }
						} else {
							setupMFModel(widget);
						}
					};
					var extensionForms = [];
					setupMFModel = function (widget) { //async
						var deferrer = $.Deferred();
						initFilter(widget);
						MF.kendo.getGridObject({ gridName: widget.contentObjectPath }).then(function (gridobj) {
							var ds = new kendo.data.DataSource(
								$.extend({},
									gridobj.dataSource,
									{
										filter: widget.filterObj.value ? widget.filterObj : { field: gridobj.dataSource.schema.model.id, operator: "eq", value: parseInt(currentRowID) }
									}
								)
							);
							var optionsBool = true;
							ds.options.serverAggregates = optionsBool; 
							ds.options.serverFiltering = optionsBool;
							ds.options.serverGrouping = optionsBool;
							ds.options.serverPaging = optionsBool;
							ds.options.serverSorting = optionsBool;

							setupModelFieldsForFormValidation(ds.options.schema.model.fields);

							ds.read().then(function () {
								var formModel = ds.view()[0];
								if (formModel) {
									formatDateFieldsForFormValidation(formModel);
									formatTextFieldsForFormValidation(formModel);
									formatUploadFieldsForFormValidation(formModel)
									if (widget.id == 'mainForm') {
										//$.extend({}, self.mainFormModel, formModel.toJSON());
										self.mainFormModel = formModel.toJSON();
									} else if (self.editExistingRow) {
										self.mainFormModel[widget.contentObjectPath] = formModel.toJSON();
										self.mainFormModel[widget.contentObjectPath]['LIC_MINUTE_DESC_BACK_RETURN'] = "";

										Object.keys(self.mainFormModel[widget.contentObjectPath]).forEach((k) => {
										
											if (self.mainFormModel[k]) {
												delete self.mainFormModel[k];
												self.mainFormModel[k] = self.mainFormModel[widget.contentObjectPath][k];

												delete self.mainFormModel[widget.contentObjectPath][k];
												self.mainFormModel[widget.contentObjectPath][k] = self.mainFormModel[k];
											}

										})

									}
								} else {
									if (widget.id == 'mainForm') {
										self.mainFormModel = $.extend({}, self.mainFormModel);
									} else if (self.editExistingRow) {
										self.mainFormModel[widget.contentObjectPath] = {};
									}
									
								}
								if (!extensionForms.includes(widget)) {
									extensionForms.push(widget);
								}
								//$.extend(widget.magicFormOptions.valuesToResolve, self.mainFormModel);
								widget.magicFormOptions.valuesToResolve = $.extend({}, self.mainFormModel);
								deferrer.resolve();
							})
						})
						return deferrer.promise();
					};
					initWidgets = function (onlyMagicForms = false) {
						if (self.rowDataInitialized) {
							$.each(self.PageLayout, function (i, tab) {
								initTabTitle(tab);
								if (self.loadTabContent[tab.id]) {
									//if (self.loadTabContent[tab.id] && !self.tabsInitialized.includes(tab.id)) {
									//	self.tabsInitialized.push(tab.id);
									$.each(tab.widgets, function (type, widgets) {
										if (type == self.currentLayoutType) {
											$.each(widgets, function (i, widget) {
												if (!widget.isInitialized || onlyMagicForms) {
													initWidget(widget, type, widgets, onlyMagicForms);
                                                }
											});
										}
									});
								}
							});
						}
					}
					initWidget = function (widget, type, widgets, onlyMagicForms = false) {
						if (widget.contentType == 'MAGIC-WIDGET-GROUP' && widget.groupWidgets) { //above return condition
							initGroupWidget(widget, type);
							pullUpWidgetsBelowGroup(widget, widgets);
						}
						if (widget.contentType == 'MAGIC-TABSTRIP' && widget.tabs) {
							initTabstripWidget(widget, type);
						}
						//if (onlyMagicForms && (widget.contentType != 'MAGIC-FORM') || onlyMagicForms && (widget.contentType != 'MAGIC-FORM-SP')) {
						//	return;
						//}

						widget.data = { selectedItems: [self.mainFormModel] };
						if (!onlyMagicForms) {
							initFilter(widget);
							initTitle(widget);
                        }

						if (widget.additionalCSSObj) {
							initCss(widget, type);
						}
						if (widget.contentType == 'MAGIC-GRID' && !onlyMagicForms) {
							initGridListener(widget);
						}
						if (widget.contentType == 'GOOGLE-MAP' && !onlyMagicForms) {
							initMapWidget(widget, type);
						}
						if ((widget.contentType == 'MAGIC-IMAGE-SLIDER' || widget.contentType == 'MAGIC-IMAGE-CAROUSEL') && !onlyMagicForms) {
							initSliderOrCarouselWidget(widget, type);							
						}
						if (widget.contentType == 'MAGIC-FORM' || widget.contentType == 'MAGIC-FORM-SP') {
							initMagicFormOptions(widget, type);
						}
						
						if (widget.contentType == 'MAGIC-GRID-SP') {
							widget.spOptions = { resizable: true, sortable: true };
							if (widget.SSPpath && widget.SSPpath.length > 0) {
								widget.spOptions.editable = true;
								widget.spOptions.toolbar = ["create", "save", "cancel"];
							}
						}

						if (widget.contentType == 'CUSTOM-HTML') {
							initCustomHtmlWidget(widget, type);
						}
						widget.isInitialized = true;
					};

					self.tabstripHeaderHeight = 1;
					self.groupHeaderHeight = 2;
					initGroupWidget = function (group, type) {
						group.height -= self.groupHeaderHeight;
						$.each(group.groupWidgets, function (i, widget) {
							initWidget(widget, type);
						});
					};
					pullUpWidgetsBelowGroup = function (groupWidget, otherWidgets) {
						$.each(otherWidgets, function (i, wdgt) {
							if (wdgt != groupWidget && wdgt.y > groupWidget.y) {
								wdgt.y -= self.groupHeaderHeight;
							}
						});
					};
					initTabstripWidget = function (tabstripWidget, type) {
						$.each(tabstripWidget.tabs, function (i, tab) {
							$.each(tab.tabWidgets, function (i, tabWidget) {
								initWidget(tabWidget, type);
							});
						});
					};
					initMapWidget = function (widget, layoutType) {
						if (!widget.layoutType || widget.layoutType == self.currentLayoutType) { //refresh only same layoutType
							if (!self.mainFormModel)
								return;
							MF.api.getDataSet({ data: self.mainFormModel, gridName: self.mainFormTableName, id: self.mainFormModel[self.mainGridPrimaryKey] }, widget.SPpath
							).then(function (res) {
								if (res) {
									initMapMarkers(res[0], widget, layoutType);
								} else {
									//ERROR
								}
							});
						}
					};
					initSliderOrCarouselWidget = function (widget, layoutType) {
						if (!widget.layoutType || widget.layoutType == self.currentLayoutType) { //refresh only same layoutType
							if (!self.mainFormModel)
								return;
							MF.api.getDataSet({ data: self.mainFormModel, gridName: self.mainFormTableName, id: self.mainFormModel[self.mainGridPrimaryKey] }, widget.SPpath
							).then(function (res) {
								if (res) {
									initImages(res[0], widget, layoutType);
								} else {
									console.log('error retriving data in initSliderOrCarouselWidget()')
								}
							});
						}
					};
					initCustomHtmlWidget = function (widget, layoutType) {
						if (widget.contentObjectPath && widget.contentObjectPath.length > 0 && !isNaN(widget.contentObjectPath)) {
							$http.post("/api/Magic_Dashboard/GetCustomHtml", { id: widget.contentObjectPath || null }).then(function (res) { //#mfapireplace

								if (res && res.data && res.data.Data && res.data.Data.length > 0) {
									var data = res.data.Data[0].Table[0];
									widget.customHtml = $sce.trustAsHtml(data.HtmlContent);
									if (data.HtmlUrl) {
										require([data.HtmlUrl], function (initFunction) {
											initFunction(self, $timeout, $http, $scope);
										});
                                    }
								} else {
									widget.customHtml = "";
                                }
							});
						} else {
							widget.customHtml = "";
						}

					}
					initMenuesAndTitle = function () {
						$('#layout-condensed-toggle').click();       //hide sidebar menu
						var backBtn = $('.page-title > a[href*="javascript:history.back()"]');
						backBtn = backBtn.detach();//remove back-button
						var closeBtn = $('<a id="closeBtn" title="Close page" class="pointer" style="float: right;"><i class="fa fa-close"></i></a>');
						closeBtn.on('click', function () {
							window.top.close();             //manage close event
						});
						if ($("#closeBtn").length == 0) {
							$('.page-title').append(closeBtn);  //add close button                         
						}
						$('#main-menu').detach()            //remove main menu
						$('.header').detach();
					};
					initActions = function () {
						if (self.mainFormData) {
							if (self.mainFormData.showCustomActions) {
								self.showCustomActions = true;
							}
							if (self.mainFormData.showStandardActions) {
								self.showStandardActions = true;
							}
						}
						if (self.mainFormGroupData) {
							if (self.mainFormGroupData.showCustomActions) {
								self.showCustomActions = true;
							}
							if (self.mainFormGroupData.showStandardActions) {
								self.showStandardActions = true;
							}
						}
					};

					if (jQuery.ui) {
						if (jQuery.ui.draggable) {
							getRedirectUrl();
							getLayoutDataFromDB();
							initMenuesAndTitle();
							window.onresize = onWindowResized;
							onWindowResized(true); //init=TRUE
						}
					} else {
						location.reload();
					};

					self.mainFormOptions = {
						callback: onMainFormChanged,
						renderDone: onMainFormRendered,
					};
					self.onActionExecuted = function (refreshPage) {
						if (refreshPage) {
							location.reload();
						}
					};
					self.initGauge = function (widget) {
						var $gaugeContainer = $('#' + widget.uid);
						var guid = null, id = null;

						if (!isNaN(widget.contentObjectPath)) {
							id = widget.contentObjectPath;
						} else {
							guid = widget.contentObjectPath;
						}

						$http.post("/api/Magic_Dashboard/GetChartData", { guid: guid, id: id }).then(function (res) { //#mfapireplace
							var gaugeData = res.data.Data[0].Table[0];
							self.getGaugeData(gaugeData, null, null, widget.magicChartFilter).then(function (data) {
								if (data && data.length) {
									var gauge = self.getGaugeObject(gaugeData, data[0]);
									$gaugeContainer.kendoRadialGauge(gauge);
								}
							})
						});

					}
					self.getGaugeData = function (chart, from, to, options) {
						if (!from || !to)
							var dateEnd = new Date(),
								dateStart = new Date(dateEnd.getFullYear(), 0, 1);

						var dataObj = {
							dateFrom: kendo.toString(dateStart, "yyyyMMdd"),
							dateTo: kendo.toString(dateEnd, "yyyyMMdd"),
							chartIDs: chart.ID,
							storedName: chart.objectLoadSP,
							businessData: JSON.stringify(options)
						};
						var extendedDataObj = $.extend({}, dataObj, self.options);

						return $.ajax({
							type: "POST",
							url: "/api/DataAnalysis/PeriodCharts/",
							contentType: "application/json; charset=utf-8",
							dataType: "json",
							data: JSON.stringify(extendedDataObj)
						});
					}
					self.getGaugeObject = function (chart, data) {
						if (!chart.YAxisMeasurementUnit)
							chart.YAxisMeasurementUnit = "";
						var extension = {};
						if (chart.ChartExtension) {
							try {
								extension = JSON.parse(chart.ChartExtension);
							} catch (ex) {
								console.log("ERROR getting gauge data:::check json parsing of ChartExtension", ex);
							}
						}
						var pointers = [];
						for (var i = 0; i < data.length; i++) {
							pointers.push({ value: data[i].Tot || data[i].Partials[0], customparam: data[i].CustomParameter ? JSON.parse(data[i].CustomParameter) : null });
							if (pointers[i].customparam && pointers[i].customparam.color) {
								pointers[i].color = pointers[i].customparam.color;
							}
						}
						return $.extend(true, {
							pointer: pointers,
							title: {
								text: chart.description,
								visible: false
							}
						}, extension, {});
					}
					self.dateFieldsToFormat = [];
					self.textFieldsToFormat = [];
					self.uploadFieldsToFormat = [];
					self.foreignKeyFieldsToFormat = [];
					setupModelFieldsForFormValidation = function (fields) {
						var objKeys = Object.keys(fields);

						for (var i = 0; i < objKeys.length; i++) {
							var k = objKeys[i];
							var v = fields[k];

							if (v.dataRole == "text" || v.dataRole == "textarea") {
								self.textFieldsToFormat.push(k);
							}
							if (v.dataRole == "datepicker") {
								self.dateFieldsToFormat.push(k);
							}
							if (v.dataSourceInfo && v.dataSourceInfo.dataSource) {
								self.foreignKeyFieldsToFormat.push(k);
							}
							if (v.dataRole == 'file' || v.dataRole == 'applicationupload') {
								self.uploadFieldsToFormat.push(k);
                            }
						}
					};
					formatDateFieldsForFormValidation = function (model) {	//workaround for buggy sf-validation (schema-forms)
						$.each(self.dateFieldsToFormat, function (i, field) {
							if (model[field]) {
								model[field] = new Date(model[field]).toISOString();
							}
						});
						$.each(self.foreignKeyFieldsToFormat, function (i, field) {
							if (model[field] === null) { //fix for duplicated form-fields ===
								model[field] = "";
							}
						});
					};
					formatTextFieldsForFormValidation = function (model) {	//replaces text-field value null with "" empty string
						$.each(self.textFieldsToFormat, function (i, field) {
							
							if (model[field] === null) {
								model[field] = "";
							}
						})
					};
					formatUploadFieldsForFormValidation = function (model) {	//replaces value null with "" empty string
						$.each(self.uploadFieldsToFormat, function (i, field) {

							if (model[field] === null) {
								model[field] = "";
							}
						})
					};
				}
			]);
	}
})();