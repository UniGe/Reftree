(function () {
	var dependencies = ["angular", "angular-magic-grid"];
	var angular,
		app,
		controllerName = "MonthlyView";

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

	function controller(angular, MF) {
		return angular
			.module(controllerName, ["magicGrid"])
			.controller(controllerName + "Controller", ['config', '$scope', '$timeout',
				function (config, $scope, $timeout) {
					var extension = {};
					var self = this;
					//extension.functionGuid = getCurrentFunctionGUIDFromMenu();
					self.gridName = function_grid[getCurrentFunctionGUIDFromMenu()];



					self.month = {
						transport: {
							read: {
								url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
								dataType: "json",
								contentType: "application/json",
								data: { storedprocedure: "Zenit.usp_getMonths" },
								type: "POST"
							},
							parameterMap: function (options, operation) {
								return kendo.stringify(options);
							}
						},
						schema: {
							parse: function (data) {
								return data[0].drows.length ? data[0].drows[0].Table : [];
							}
						}
					};



					self.years = [];
					for (var i = 0; i < 30; i++) {
						self.years.push({ year: 2016 + i });
					}

					var d = new Date();
					d.setMonth(d.getMonth() - 1);

					self.currentYear = d.getFullYear();
					self.currentMonth = (d.getMonth() + 1);

					self.yearsDS = {
						transport: {
							read: self.years

						},
						schema: {
							parse: function (data) {
								return self.years;
							}
						}
					};


					self.initialFilter = {
						type: "customFilter", logic: 'and', filters: [{ field: "Month", operator: "eq", value: self.currentMonth, type: "customFilter" }
							, { field: "Year", operator: "eq", value: self.currentYear, type: "customFilter" }]
					};

					self.onChange = function () {
						this.initialFilter = {
							type: "customFilter", logic: 'and', filters: [{ field: "Month", operator: "eq", value: this.monthDropDown.value(), type: "customFilter" }
								, { field: "Year", operator: "eq", value: this.yearsDrop.value(), type: "customFilter" }]
						};
					}
					
					$timeout();

				}
            ]);
    }
}) ();