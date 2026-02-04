define(["angular", "angular-magic-wizard"], function (angular) {
    return angular
        .module("GridWizard", ["magicWizard"])
        .controller("GridWizardController", [
            "config",
            "$timeout",
            "$scope",
            "$element",
            function (config, $timeout, $scope, $element) {
                var self = this;
                self.wizardOptions = config.wizardOptions;
				self.wizardCode = config.wizardCode;
				var multiactionsdata = config.grid && config.grid.element ? config.grid.element.data("multiactionsdata") : null;
                $scope.$watch(function () {
					return config.recordId;
                }, function () {
                    self.models = null;
                    self.stepsSettings = null;
                    if (config.recordId) {
                        $.post({
                            url: '/api/Wizard/getModel',
                            data: JSON.stringify({
                                wizardCode: config.wizardCode,
                                ID: config.recordId,
								gridName: config.grid.options.code,
								multiActionsGridData: multiactionsdata,
                                selectedGridRowIds: config.grid.selectable ? config.grid
                                    .select()
                                    .map(function () {
                                        return config.grid.dataItem(this)[config.grid.dataSource.options.schema.model.id];
                                    })
                                    .toArray()
                                    .join('|') : undefined
                            }),
                            contentType: "application/json; charset=utf-8"
                        }).then(function (res) {
                            $.each(res.model, function (k, model) {
                                if (model && typeof model == "object") {
                                    $.each(model, function (column, value) {
                                        if ($.isArray(value) && value.length && $.isPlainObject(value[0])) {
											$.each(value, function (k, v) {
												delete v.__action;
												delete v.__firstAction;
											});
                                        }
                                    });
                                }
                            });
                            var filesToManage = {};
                            self.stepsSettings = res.info;
                            if (res.model.__activeStep !== undefined) {
                                self.wizardOptions.activeStep = parseInt(res.model.__activeStep);
                                delete res.model.__activeStep;
                            }
                            if (res.model.__compiledSteps !== undefined) {
                                self.wizardOptions.compiledSteps = parseInt(res.model.__compiledSteps);
                                delete res.model.__compiledSteps;
                            }
                            if (res.model.__filesToManage !== undefined) {
                                filesToManage = parseInt(res.model.__filesToManage);
                                delete res.model.__filesToManage;
                            }
                            self.models = res.model;
                            self.models.ID = config.recordId;
                            $timeout(function () {
                                $.each(filesToManage, function (stepKey, filesToManage) {
                                    var $step = $element.find('[data-step-key="' + stepKey + '"]');
                                    $step.data('filesToDelete', filesToManage.filesToDelete);
                                    $step.data('filesToSave', filesToManage.filesToSave);
                                });
                            });
                        }, function (error) {
                            if (config.onError)
                                config.onError();
                            kendoConsole.log(error, 'error');
                        });
                    } else {
                        try {
                            // handle prepopulation of model with data from parent grid looking also at detail grid filter
                            if (config.$parentGridRow) {
                                var parentGrid = config.$parentGridRow.closest('.k-grid').data('kendoGrid');
                                var dataItem = parentGrid.dataItem(config.$parentGridRow);
                                var additionalFilterData = {};
                                try {
                                    if (config.grid && config.grid.options && config.grid.options.initialFilter) {
                                        var filter = config.grid.options.initialFilter;
                                        if (typeof filter === 'string') {
                                            additionalFilterData[filter] = dataItem[parentGrid.dataSource.options.schema.model.id];
                                        }
                                        else {
                                            console.warn('filter objects not implemented for prepopulating detail grid wizard with parent grid data');
                                        }
                                    }
                                }
                                catch (e) {
                                    console.warn(e);
                                }
                                var oldFn = self.wizardOptions.onWizardRendered;
                                self.wizardOptions.onWizardRendered = function (wizard) {
                                    $.each(wizard.settings.steps, function (k, step) {
                                        wizard.models[step.stepKey] = $.extend({}, dataItem, additionalFilterData);
                                    });
                                    if (oldFn)
                                        oldFn(wizard);
                                };
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                        self.models = {};
                    }
                });
            }
        ]);
});