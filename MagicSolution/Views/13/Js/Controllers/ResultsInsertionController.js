(function () {
	var dependencies = ["angular", "angular-magic-grid", "angular-magic-wizard", "MagicSDK"];
	var angular,
		app,
		controllerName = "ResultsInsertion";

	define(dependencies, function (a) {
		angular = a;
		app = controller.apply({}, arguments);
		return init;
	});

 
	function init() {
		var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true))[0];
		app.value("config", {});
		angular.bootstrap(element, [controllerName]);
		
	}

	var extension = {};

	extension.dateFrom = function () {
		var date = new Date();
		var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
		firstDay.setHours(0);
		firstDay.setMinutes(0);
		firstDay.setSeconds(0);
		return firstDay;
	};
	extension.dateTo = function () {
		var date = new Date();
		var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		lastDay.setHours(0);
		lastDay.setMinutes(0);
		lastDay.setSeconds(0);
		return lastDay;
	};

	extension.mDateFrom = extension.dateFrom();
	extension.mDateTo = extension.dateTo();
	
	function controller(angular, MF) {
		return angular
			.module(controllerName, ["magicGrid", "magicWizard"])
			.controller(controllerName + "Controller", ['config', '$scope', '$timeout',
				function (config, $scope, $timeout) {
					var self = this;
					var scope = $scope;
					self.filter = {};
					self.filter.comitato = null;
					self.filter.campionato = null;
					self.filter.fromDate = null;
					self.filter.toDate = null;
					self.treeReady = false;
					self.dataReady = false;
					self.selectTreeItem = function (e) {
						
						var nodeData = self.modelTree.dataItem(e.node);
						if (nodeData.id && nodeData.id > 0 && self.filter.campionato !== null) {
							self.initialFilter = {
								type: "customFilter", logic: 'and', filters: [{ field: "IdCampionato", operator: "eq", value: self.filter.campionato, type: "customFilter" }
									, { field: "Giornata", operator: "eq", value: nodeData.id  , type: "customFilter" }]
							};

						}
						
					}
					GetDropdownValues("usp_getComitati", "ID", "Description", "Sport", 1, null
						, true)
						.then(function (comitati) {
							self.comitati = comitati;
							self.dataReady = true;

							$timeout();
						});
					GetDropdownValues("usp_getCampionati", "ID", "Description", "Sport", 1, null
						, true)
						.then(function (campionati) {
							self.campionati = campionati;
							$timeout();
						});

					self.onChangeDates = function () {
						self.treeReady = false;
					}
					self.onChangeComitato = function () {

						GetDropdownValues("usp_getCampionati", "ID", "Description", "Sport", 1, null
							, true,
							{
								data: {
									IR:
										{
											cmt: self.filter.comitato
										}
								}
							})
							.then(function (campionati) {
								self.campionati = campionati;
								$timeout();
							});
					}
					self.onChangeCampionato = function () {


						self.treeReady = false;
						$timeout();
					}
					self.initialFilter = {
						type: "customFilter", logic: 'and', filters: [{ field: "IdCampionato", operator: "eq", value: self.filter.campionato, type: "customFilter" }
							, { field: "Giornata", operator: "eq", value: 0, type: "customFilter" }]
					};
					self.searchDayMatches = function () {
						var dataToReturn = null;
						requireConfigAndMore(["MagicSDK"], function (MF) {
							if (self.filter.fromDate !== null) {
								var fromDate = toTimeZoneLessString(self.filter.fromDate);
							}
							
							self.treeReady = false;
							MF.api.get({ storedProcedureName: 'SPORT.getDaysForChampionship', data: { Comitato_ID: self.filter.comitato, Campionato_ID: self.filter.campionato, fromDate: fromDate } }).then(function (res) {
								var results = res[0];
								treeds = [{id:"1a",text:"Risultati",items:[],expanded: true, hasChildren: true}];
								$.each(results, function (i, v) {
									treeds[0].items.push({ id: v.ID, text: v.Description,gridName:v.GridName, items: [], expanded: false, hasChildren: false });
								});
								self.treeDs = new kendo.data.HierarchicalDataSource({
									data: treeds
								});
								


								self.treeReady = true;
								$timeout();
							})
						});
						return dataToReturn;
					}
					$("#comitatoselect").prop("selectedIndex", -1);
				}
			]);
	}

})()

