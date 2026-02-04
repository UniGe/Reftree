(function () {
    var dependencies = ["angular", "angular-magic-grid", "angular-magic-wizard"];
    var angular,
        app,
        controllerName = "HRCandidatureWizard";

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
            .module(controllerName, ["magicGrid", "magicWizard"])
			.controller(controllerName + "Controller", ['config', '$scope', '$timeout',
				function (config, $scope, $timeout) {
					var self = this;
					self.wizardChange = false;
					self.winOptions = {
					    actions: [],
					    title: "Impostazione dei parametri iniziali del wizard",
					    modal: true,
					    visible: false,
					    width: "600px",
					    position: { top: "15%", left: "35%" }
					};
					self.filter = {
						logic: "AND",
						filters:
							[
								{ field: "CampaignProvider_ID", operator: "eq", value: 0 },
								{ field: "T_PhoneLineOfferType_ID", operator: "eq", value: 0 },
								{ field: "CoverageType_ID", operator: "eq", value: 0 },
								{ field: "fromDate", operator: "lte", value: new Date() },
								{ field: "toDate", operator: "gte", value: new Date() }
							]
					}
					self.loadOffers = function () {
						GetDropdownValues("usp_PhoneLineOffer_Drop_Z", "ID", "Description", "Zenit", 1, self.filter
							, true, { wizardCode: "CRMZenit" })
							.then(function (offers) {
								self.offers = offers;
								$timeout();
							});

					};
					self.reloadTeamLeaders = function () {

						var deferred = $.Deferred();
						
						var data = { provider_id: self.filter.filters[0].value, T_PhoneLineOfferType_ID: self.filter.filters[1].value };
						//ask the database wether to go on 
						requireConfigAndMore(["MagicSDK"], function (MF) {
							MF.api.getDataSet(data, "Zenit.get_teamLeaders")
								.then(function (res) {
										if (res.status == 500 && res.responseText) {
											kendoConsole.log(res.responseText, true);
											deferred.reject();
										}
										if (res[0] && res[1]) {
											self.teamLeaders = res[0];
											self.teamLeaders.visible = res[1][0] ? res[1][0].VISIBLE : 0; 
										}
									deferred.resolve();
									$timeout();
								});
						});
						deferred.promise();
					}
					GetDropdownValues("usp_CampaignProviders_Drop_Z", "ID", "Description", "CRM", 1, null
						, true, { wizardCode: "CRMZenit" })
						.then(function (providers) {
							self.providers = providers;
						});
					//triggered when segment chaneges
					self.onChangeSegment = function () {
						self.loadOffers();
						self.reloadTeamLeaders();
					}
					//triggered when coverage type changes
					self.onChangeCoverageType = function () {
						self.loadOffers();
					}

					//triggered when provider changes
					self.onChangeProviders = function () {

						GetDropdownValues("usp_Segmente_Drop", "ID", "Description", "CRM", 1, null
							, true,
							{
								wizardCode: "CRMZenit",
								data: {
									PhoneContractWizard:
										{
											Provider_ID: self.filter.filters[0].value
										}
								}
							})
							.then(function (segments) {
								self.segments = segments;
								self.loadOffers();
							});

						GetDropdownValues("usp_CoverageType_Drop", "ID", "Description", "CRM", 1, null
							, true, {
								wizardCode: "CRMZenit",
								data: {
									PhoneContractWizard:
										{
											Provider_ID: self.filter.filters[0].value
										}
								}
							})
							.then(function (coveragetypes) {
								self.coveragetypes = coveragetypes;
								$timeout();
							});
					}

					self.gridFilter = {
						type: "customFilter", logic: 'AND', filters: [
							{ field: "T_PhoneContractStatus_ID", operator: "eq", value: "1", type: "customFilter" },
							{ field: "OperatorUser_ID", operator: "eq", value: "[userId]", type: "customFilter" }
						]
					};
					$scope.$watch("zcw.offer", function () {
					    if (!self.offers || !self.offer)
					        return;
					    var choosenOffer = self.offers.filter(x => x.ID == self.offer)[0];
					    if (choosenOffer.WizardCode != self.wizardCode)
					        self.wizardChange = true;
					});
					self.setWizardCode = function () {
						var choosenOffer = self.offers.filter(x => x.ID == self.offer)[0];

						var stepkey = choosenOffer.WizardStepKey;
						var model = {
						};

						model[stepkey] = {
							CoverageType_ID: self.filter.filters[2].value,
							PhoneLineOffer_ID: self.offer,
							T_PhoneLineOfferType_ID: self.filter.filters[1].value,
							Provider_ID: self.filter.filters[0].value,
							TeamLeader_ID: self.selectedTeamLeader_ID,
							PhoneLineOfferOptions: []
						}

						if (!self.models)
							self.models = {};
						self.models[stepkey] = $.extend(self.models[stepkey], model[stepkey]);
						self.wizardOptions = {
							onWizardComplete: function () {
								console.log(arguments);
								if (self.gridInstance)
									self.gridInstance.dataSource.read();
							},
							beforeSave: wizardClearHiddenFields
						}
						self.wizardCode = choosenOffer.WizardCode;
						self.wizardChange = false;
						self.winSelectionWizard.close();
					}

					self.redirectToDashboard = function () {
						window.location.replace('dashboard-v2');
					}
					self.openWindow = function () {
						self.wizardChange = false;
						self.winSelectionWizard.open();
					}

					self.closeWindow = function () {
					    self.wizardChange = false;
					    self.winSelectionWizard.close();
                    }

					if (window.sessionStorage.compiledWizards) {
					    var compiledWizards = JSON.parse(window.sessionStorage.compiledWizards)
					    var foundWizardCode = Object.keys(compiledWizards)[0];
					    if (foundWizardCode) {
					        self.wizardOptions = {
					            onWizardComplete: function () {
					                console.log(arguments);
					                if (self.gridInstance)
					                    self.gridInstance.dataSource.read();
					            },
					            beforeSave: wizardClearHiddenFields
					        }
					        self.wizardCode = foundWizardCode;
					        self.wizardChange = false;					        					       
					    }
					}




				}
            ]);
    }

})();