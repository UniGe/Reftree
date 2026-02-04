define(['angular', "MagicSDK", 'angular-magic-form', 'angular-magic-form-sp'], function (angular, MF) {
    angular
        .module('magicWizard', ['magicForm', 'magicFormSp'])
        //config is used in magicFormSp
        .value("config", {
                data: '{}'
            })
        .directive('magicWizard', ['$timeout', function ($timeout) {
            return {
                replace: true,
                restrict: "E",
                scope: {
                    wizardCode: "@",
                    models: "=",
                    stepsSettings: "=",
                    options: "="
                },
                templateUrl: "/Magic/Views/Templates/Directives/magic-wizard.html",
                link: function (scope, element, attrs, ctrls) {
                    var interStepCascades = {};
                    var compiledWizards = {};
                    scope.language = culture.substring(0, 2);
                    scope.translations = {
                        next: getObjectText("next"),
                        previous: getObjectText("previous"),
                        save: getObjectText("save"),
                        clear: getObjectText("clear"),
                        last: getObjectText("last"),
                        first: getObjectText("first")
                    };
					scope.reload = {}; //used to refresh forms...
                    scope.getValuesToResolve = function (stepKey) {
                        if (scope.models[stepKey] && !$.isEmptyObject(scope.models[stepKey]))
                            return $.extend({}, scope.models[stepKey])
                        return null;
                    };

                    var insertDefaultValues = function () {
						var activeSetp = scope.settings.steps[scope.activeStep];
						if (activeSetp && activeSetp.defaultValues && activeSetp.defaultValues.length && !scope.models[activeSetp.stepKey]) {
                            scope.models[activeSetp.stepKey] = {};
                            $.each(activeSetp.defaultValues, function (k, defaultValue) {
                                if ((defaultValue.fromStep in scope.models) && (defaultValue.fromFieldName in scope.models[defaultValue.fromStep]))
                                    scope.models[activeSetp.stepKey][defaultValue.toFieldName] = scope.models[defaultValue.fromStep][defaultValue.fromFieldName];
                            });
                        }
                    };

                    scope.magicFormCallback = function (stepKey) {
                        return function (data, mfScope) {
                            setTimeout(function () {
                                scope.formsItems[stepKey] = mfScope.options.hideTabs ? mfScope.form : mfScope.form[0].items[0].tabs[0].items;
                            });
                        };
					};
					scope.intermediateSaveCallback = function (form,step) {
						return function () {
							scope.intermediateSaveAndReloadStep(form,step);
						};
					};

                    scope.isDirty = function (form, i) {
                        var isDirty = false;
                        for (var _i = 0; _i <= i; _i++) {
                            if (!scope.settings.steps[_i].hidden && form[_i] && form[_i].$dirty) {
                                isDirty = true;
                                break;
                            }
                        }
                        return isDirty;
                    };

                    scope.isValid = function (form, i) {
                        scope.$broadcast('schemaFormValidate');

                        //workaround to ignode hidden forms from validation
                        for (var _i = 0; _i <= i; _i++) {
                            if (!scope.settings.steps[_i].hidden && form[_i] && !form[_i].$valid) {
                                scope.activeStep = _i;
                                return false;
                            }
                        }

                        return true;
                    };

                    scope.validate = function (form, i,initializer) {
                        var deferrer = $.Deferred();

                        if (!scope.isValid(form, i))
                            deferrer.reject();
						else if (scope.settings.validationCallback && window[scope.settings.validationCallback]) {
							var valid = window[scope.settings.validationCallback](form, i, scope, element, initializer);

                            // valid is set and is not boolean (is a promise)
                            if (valid && typeof valid !== 'boolean' && valid.then) {
                                valid
                                    .then(function (response) {
                                        if (response)
                                            deferrer.resolve();
                                        else
                                            deferrer.reject();
                                    }, function () {
                                        deferrer.reject();
                                    });
                            }
                            else if (valid)
                                deferrer.resolve();
                            else
                                deferrer.reject();
                        }
                        else
                            deferrer.resolve();

                        return deferrer.promise();
					};
					let findTheOpenerGridAndBindReadOnClose = function () {
						let thePopupUIDOfTheOpenerRow = element.closest("div.k-popup-edit-form").data("uid");
						//search through all the grids in page the match with the rowId 
						let openerDs;
						$('.k-grid').each(function (i, g) {
							if ($(g).data("kendoGrid").dataSource.getByUid(thePopupUIDOfTheOpenerRow)) {
								openerDs = $(g).data("kendoGrid").dataSource;
								return false;//break
							}
						});
						if (openerDs) {
							let theWindowCloseButton = element.closest(".k-window").find(".k-i-close");
							theWindowCloseButton.closest("a").one("click",function () {
								openerDs.read(); //refesh data of opener grid even without saving the wizard using save buttons
							});
						}
					};
					//used to immediately save step to database when a detailgrid is saved ({immediatelySubmitStep in grid properties})
					scope.intermediateSaveAndReloadStep = function (form,step) {
						let stepKey = step.stepKey;
						let formDefinition = scope.getFormDefinition(step.fields);
						let detailGrids = [];
						//look for detailgrids which have the submitWizardOnSave extension , if one of them 
						formDefinition.forEach(function (x) {
							if (x.MagicTemplateDataRole == "detailgrid")
								detailGrids.push(x.ColumnName);	
						});
						if (!detailGrids.length)
							return;
                        handleInlineGrids();
						if (scope.isDirty(form, scope.compiledSteps)) {
							scope.validate(form, scope.compiledSteps,"detailgrid")
								.then(function () {
									MF.api.set({
										procedure: scope.settings.saveStored,
										data: scope.getApiCallData(form),
										contentType: 'XML',
										errorHandling: false
									}, -1)
										.then(function (res) {
											var message = getObjectText("success");
											if (res)
												message = JSON.parse(res).message;
											kendoConsole.log(message, "success");
											if (!(scope.models && scope.models.ID)) //new case
												location.reload();
											else {
												//here i  reinit with an empty array all the detailgrids in this form because the database is uptodate and they will be reloaded
												detailGrids.forEach(function (x) {
													if (scope.models[stepKey] && Array.isArray(scope.models[stepKey][x])) {
														scope.models[stepKey][x] = [];
													}
												});
												scope.reload[stepKey] = true;
												$timeout();
												findTheOpenerGridAndBindReadOnClose();
												$timeout(function () {
													scope.reload[stepKey] = false;
												}, 500);
											}
										}, function (error) {
											kendoConsole.log(error, "error");
										});
								});
						}
					};
					scope.intermediateSave = function (form) {
                        handleInlineGrids();
                        if (scope.isDirty(form, scope.compiledSteps)) {
                            scope.validate(form, scope.compiledSteps)
                                .then(function () {
                                    MF.api.set({
                                        procedure: scope.settings.saveStored,
                                        data: scope.getApiCallData(form),
                                        contentType: 'XML',
                                        errorHandling: false
                                    }, -1)
                                        .then(function (res) {
                                            var fileManagePromises = $('magic-form', element).map(function () {
                                                return manageGridUploadedFiles($(this));
                                            });
                                            return $.when.apply($, fileManagePromises)
                                                .then(function () {
                                                    return res;
                                                });
                                        })
                                        .then(function (res) {
                                            if (scope.options.onWizardComplete)
                                                scope.options.onWizardComplete(res, scope);
                                            var message = getObjectText("success");
                                            if (res)
                                                message = JSON.parse(res).message;
                                            kendoConsole.log(message, "success");
                                            if (!(scope.models && scope.models.ID)) //new case
                                                location.reload();
                                        }, function (error) {
                                            kendoConsole.log(error, "error");
                                        });
                                });
                        }
                    };

                    scope.submitStep = function (form, i) {
                        handleInlineGrids();

                        //get dirty before schemaFormValidate (schemaFormValidate sets at dirty)
                        var isDirty = scope.isDirty(form, i);

                        scope.validate(form, i)
                            .then(function () {
                                if (i == scope.settings.steps.length - 1) {
                                    if (!compiledWizards[scope.wizardCode])
                                        compiledWizards[scope.wizardCode] = {};
                                    compiledWizards[scope.wizardCode].models = scope.models;
                                    //last step
                                    scope.submitted = true;
                                    scope.fullyCompleted = true;
                                    if (isDirty) {
                                        MF.api.set({
                                            procedure: scope.settings.saveStored,
                                            data: (scope.options.beforeSave) ? scope.options.beforeSave(scope, scope.getApiCallData(), element) : scope.getApiCallData(),
                                            contentType: 'XML',
                                            errorHandling: false
                                        }, -1)
                                            .then(function (res) {
                                                var fileManagePromises = $('magic-form', element).map(function () {
                                                    return manageGridUploadedFiles($(this));
                                                });
                                                return $.when.apply($, fileManagePromises)
                                                    .then(function () {
                                                        return res;
                                                    });
                                            })
                                            .then(function (res) {
                                                scope.submitted = false;
                                                if (!res.Errors) {
                                                    var shouldNotClear = false;
                                                    if (scope.options.onWizardComplete)
                                                        shouldNotClear = !!scope.options.onWizardComplete(res, scope);

                                                    if (!shouldNotClear) {
                                                        //reset wizard & sessionStorage
                                                        scope.clearWizard();
                                                    }
                                                    var message = getObjectText("success");
                                                    if (res)
                                                        message = JSON.parse(res).message;
                                                    kendoConsole.log(message, "success");
                                                } else {
                                                    kendoConsole.log(res.Errors, "error");
                                                }
                                                $timeout();
                                            }, function (error) {
                                                scope.submitted = false;
                                                kendoConsole.log(error.responseText, "error");
                                                $timeout();
                                            });
                                    } else {
                                        var shouldNotClear = false;
                                        if (scope.options.onWizardComplete)
                                            shouldNotClear = !!scope.options.onWizardComplete(null, scope);

                                        if (!shouldNotClear) {
                                            //reset wizard & sessionStorage
                                            scope.clearWizard();
                                        }
                                    }
                                } else {
                                    //set steps
                                    scope.activeStep = scope.getNextStepIndex();
                                    do {
                                        if (i == scope.compiledSteps)
                                            scope.compiledSteps = scope.activeStep;
                                        i++;
                                    } while (scope.settings.steps[i].hidden);

                                    compiledWizards[scope.wizardCode] = {
                                        models: $.extend({}, scope.models),
                                        activeStep: scope.activeStep,
                                        compiledSteps: scope.compiledSteps,
                                        filesToManage: scope.getFilesToManage()
                                    };
                                    insertDefaultValues();
                                    $timeout();
                                }

                                //refresh data in sessionStorage if is not in edit
                                if (!scope.models.ID)
                                    window.sessionStorage.compiledWizards = JSON.stringify(compiledWizards);
                            });
                    };

                    scope.getFilesToManage = function () {
                        var filesToManage = {};
                        $('magic-form', element).each(function () {
                            var data = $(this).data();
                            if (data && data.filesToDelete || data.filesToSave) {
                                filesToManage[$(this).closest('[data-step-key]').data('stepKey')] = {
                                    filesToDelete: data.filesToDelete,
                                    filesToSave: data.filesToSave
                                };
                            }
                        });
                        return filesToManage;
                    };

					scope.getApiCallData = function (form) {
						var valueSolver = function (val) {
							if (typeof val == "string" && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
                                return toTimeZoneLessString(new Date(val));
                            if ($.isArray(val) && val.length && (typeof val[0] === "string" || typeof val[0] === "number"))
                                return val.join(',');
							return val instanceof Date ? toTimeZoneLessString(new Date(val.valueOf())) : val;
						};
                        var models = {};
                        $.each(scope.models, function (stepKey, model) {
                            if (typeof model == "object" || $.isArray(model)) {
                                var _model = {};
                                $.each(model, function (k, v) {
                                    //_model[k] = v;
                                    //if (typeof v == "string" && v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
                                    //    _model[k] = toTimeZoneLessString(new Date(v));
									_model[k] = valueSolver(v);
                                });
                                models[stepKey] = _model;
                            }
                            else
                                models[stepKey] = model;
                        });
                        return {
                            data: models,
                            wizardCode: attrs.wizardCode,
                            activeStep: form ? scope.activeStep : undefined,
                            compiledSteps: form ? scope.compiledSteps : undefined,
                            filesToManage: form ? scope.getFilesToManage() : undefined,
                            dirtySteps: form ? $.map(scope.settings.steps, function (step, i) {
                                if (form[i] && form[i].$dirty)
                                    return step.stepKey;
                            }) : undefined
                        };
                    };

                    scope.goToStep = function (i, form) {
                        if (i <= scope.compiledSteps) {
                            if (i > scope.activeStep) {
                                scope.validate(form, scope.activeStep)
                                    .then(function () {
                                        scope.activeStep = i;
                                        $timeout();
                                    });
                            }
                            else {
                                scope.activeStep = i;
                            }
                        }
                        return false;
                    };

                    scope.getPreviousStepIndex = function () {
                        for (var i = scope.activeStep - 1; i >= 0; i--) {
                            if (!scope.settings.steps[i].hidden) {
                                return i;
                            }
                        }
                    };

                    scope.getNextStepIndex = function () {
                        for (var i = scope.activeStep + 1; i < scope.settings.steps.length; i++) {
                            if (!scope.settings.steps[i].hidden) {
                                return i;
                            }
                        }
                        return false;
                    };

                    scope.clearWizard = function () {
                        var settings = $.extend({}, scope.settings);
                        delete scope.settings;
                        scope.fullyCompleted = false;
                        scope.activeStep = 0;
                        scope.compiledSteps = 0;
                        scope.models = {};
						compiledWizards={};
                        //delete compiledWizards[scope.wizardCode];
                        //window.sessionStorage.compiledWizards = JSON.stringify(compiledWizards);
                        delete window.sessionStorage.compiledWizards;

                        $timeout(function () {
                            scope.settings = settings;
                            handleInterStepCascades();
                            insertDefaultValues();
                            if (scope.options.onWizardRendered)
                                scope.options.onWizardRendered(scope);
                        }, 10);
                    }

                    scope.getFormDefinition = function (fields) {
                        if (!fields)
                            return null;
                        return $.map(fields, function (field) {
                            return {
                                MagicDataSourceValueField: field.DataSource.MagicDataSourceValueField,
                                MagicDataSourceTextField: field.DataSource.MagicDataSourceTextField,
                                MagicDataSource: field.DataSource.MagicDataSource,
                                MagicDataSourceType_ID: field.DataSource.MagicDataSourceType_ID,
                                //"MagicDataSourceSchema": null,
                                ColumnName: field.ColumnName,
                                Columns_label: field.labels[scope.language] || field.labels.en || field.labels.it || field.labels.de || field.ColumnName,
                                SearchGridName: field.searchGrid.SearchGridName,
                                SearchGridDescColName: field.searchGrid.SearchGridDescColName,
                                Schema_defaultvalue: field.Schema.Schema_defaultvalue,
                                StringLength: field.Schema.StringLength,
                                Schema_Numeric_max: field.Schema.Schema_numeric_max,
                                Schema_Numeric_min: field.Schema.Schema_numeric_min,
                                Schema_Numeric_step: field.Schema.Schema_numeric_step,
                                Schema_required: field.Schema.Schema_required,
                                Schema_type: field.Schema.Schema_type,
                                Schema_Format: field.Schema.Schema_Format,
                                MagicTemplateDataRole: field.MagicTemplateDataRole,
                                //"Layer_ID": null,
                                Upload_SavePath: field.Upload_SavePath,
                                CascadeColumnName: field.Cascade.CascadeColumnName,
                                CascadeFilterColumnName: field.Cascade.CascadeFilterColumnName,
                                DetailonchangeFunctionName: field.Schema.DetailonchangeFunctionName,
                                MagicFormExtension: field.FormExtension
                            }
                        });
                    };

                    scope.renderDone = function ($mf) {
                        var stepKey = $mf.closest('[data-step-key]').data('stepKey');
                        if (compiledWizards[scope.wizardCode] && compiledWizards[scope.wizardCode].filesToManage && (stepKey in compiledWizards[scope.wizardCode].filesToManage)) {
                            $mf.data('filesToDelete', compiledWizards[scope.wizardCode].filesToManage[stepKey].filesToDelete);
                            $mf.data('filesToSave', compiledWizards[scope.wizardCode].filesToManage[stepKey].filesToSave);
                        }
                        if (window.vocalCommandsActive) {
                            $('.k-i-close').click(function () {
                                stopAllRecordings();
                            })
                        }
                    };

                    var init = function () {
                        delete scope.settings;
                        interStepCascades = {};
                        compiledWizards = {};
                        scope.models = scope.models || {};
                        scope.options = scope.options || {};
                        scope.formsItems = {};
                        scope.activeStep = scope.options.activeStep || 0;
                        scope.compiledSteps = scope.options.compiledSteps || 0;
                        scope.submitted = false;
                        scope.fullyCompleted = false;
                        scope.events = {};

                        if (window.sessionStorage.compiledWizards && $.isEmptyObject(scope.models)) {
                            compiledWizards = JSON.parse(window.sessionStorage.compiledWizards)
                            if (compiledWizards[scope.wizardCode]) {
                                scope.models = compiledWizards[scope.wizardCode].models;
                                scope.activeStep = compiledWizards[scope.wizardCode].activeStep;
                                scope.compiledSteps = compiledWizards[scope.wizardCode].compiledSteps;
                            }
                        }
                        $.ajax({    //#mfapireplaced
                            type: "POST",
                            url: "/api/Wizard/GetWizard",
                            data: JSON.stringify({ Code: attrs.wizardCode }),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            error: function (err) { console.log(err.responseText) }
                        }).then(function (res) {
                                var wizards = res.Data[0].Table;
                                if (wizards.length) {
                                    scope.settings = JSON.parse(wizards[0].Settings);
                                    if ("useKendoStyle" in scope.options)
                                        scope.settings.useKendoStyle = scope.options.useKendoStyle;

                                    handleInterStepCascades();

                                    if (scope.stepsSettings) {
                                        var wizardIsReadonly = true;
                                        $.each(scope.settings.steps, function (k, step) {
                                            if (step.stepKey in scope.stepsSettings) {
                                                $.extend(step, scope.stepsSettings[step.stepKey], {
                                                    readonly: scope.stepsSettings[step.stepKey] ? !toBoolean(scope.stepsSettings[step.stepKey].editable) : false
                                                });
                                            }
                                            if (!step.readonly)
                                                wizardIsReadonly = false;
                                        });
                                        scope.options.readonly = wizardIsReadonly;
                                    }

                                    if (scope.options.compiledSteps == undefined && !$.isEmptyObject(scope.models) && !scope.compiledSteps) {
                                        $.each(scope.settings.steps, function (stepIndex, step) {
                                            if (!(step.stepKey in scope.models))
												return false;
											scope.compiledSteps = stepIndex;

                                        });
                                    }

                                    if (scope.options.activeStep == undefined) {
                                        scope.activeStep = scope.compiledSteps = Math.min(scope.compiledSteps, scope.settings.steps.length - 1);
                                        if (!scope.models || !scope.models.ID)
                                            scope.activeStep = 0;
                                    }
                                    insertDefaultValues();
                                }
                                $timeout();
                                if (scope.options.onWizardRendered)
                                    scope.options.onWizardRendered(scope);
                                if (scope.settings.onRenderCallback && window[scope.settings.onRenderCallback] && typeof window[scope.settings.onRenderCallback] === 'function') {
                                    window[scope.settings.onRenderCallback](scope);
                                }
                            });
                    }

                    function handleInterStepCascades() {
                        interStepCascades = {};
                        $.each(scope.settings.steps, function (k, step) {
                            $.each(step.fields, function (kk, field) {
                                if (field.Cascade.CascadeColumnName.indexOf('.') !== -1) {
                                    var cascadeColumns = field.Cascade.CascadeColumnName.split(',');
                                    $.each(cascadeColumns, function (kkk, column) {
                                        if (column.indexOf('.') !== -1) {
                                            var stepColumn = column.split('.');
                                            if (!interStepCascades[stepColumn[0]])
                                                interStepCascades[stepColumn[0]] = [];

                                            interStepCascades[stepColumn[0]].push({
                                                column: stepColumn.slice(1).join('.'),
                                                stepKey: step.stepKey
                                            });
                                            cascadeColumns[kkk] = stepColumn.slice(1).join('.');
                                        }
                                    });
                                    field.Cascade.CascadeColumnName = cascadeColumns.join(',');
                                }
                            });
                        });
                        $.each(interStepCascades, function (masterStepKey, cascadeInfo) {
                            $.each(cascadeInfo, function (i, cinfo) {
                                if (cinfo.column.match(/\./)) {
                                    var column = cinfo.column.split('.'),
                                        inputName = column[0];
                                    if (!scope.events[masterStepKey])
                                        scope.events[masterStepKey] = {};
                                    if (!scope.events[masterStepKey][inputName])
                                        scope.events[masterStepKey][inputName] = [];

                                    scope.events[masterStepKey][inputName].push(function () {
                                        var args = arguments;
                                        if (scope.events[cinfo.stepKey] && scope.events[cinfo.stepKey][inputName]) {
                                            $.each(scope.events[cinfo.stepKey][inputName], function (k, fn) {
                                                fn.apply(this, args);
                                            });
                                        }
                                    });

                                } else {
                                    scope.$watch(
                                        function () {
                                            if (scope.models[masterStepKey])
                                                return scope.models[masterStepKey][cinfo.column];
                                            return null;
                                        }
                                        , function (newVal, oldVal) {
                                            if (newVal !== undefined) {
                                                if (!scope.models[cinfo.stepKey])
                                                    scope.models[cinfo.stepKey] = {};
                                                if (scope.models[cinfo.stepKey][cinfo.column] !== newVal)
                                                    scope.models[cinfo.stepKey][cinfo.column] = newVal;
                                            }
                                        }
                                    );
                                }
                            });
                            
                        });
                    }

                    function handleInlineGrids() {
                        try {
                            $("form .tab-pane.active .k-grid.k-editable").each(function () {
                                var $btn = $(".k-grid-save-changes", this);
                                if ($btn.length) {
                                    //D.T #6525 Bug:  add a trigger to kendo grid "save" button in order to apply the changes automatically when the user performes an intermediate save
                                    $btn.click();
                                } else {
                                    //manageGridUploadedFiles($(this));
                                    let grid = $(this).data('kendoGrid');
                                    if (grid.options?.editable?.mode != 'popup') {
                                        manageGridUploadedFiles($(this));
                                    }
                                }
                            });
                        } catch (e) {
                            console.warn('Error during handleInlineGrids', e)
                        }
                    }

                    scope.$watch('wizardCode', init);
                }
            }
        }])
})