//wraps magic-form getting definitions and values from a stored procedure via SDK
define(['angular', "MagicSDK", 'angular-magic-form'], function (angular, MF) {
    angular.module('magicFormSp',['magicForm'])
        .directive('magicFormSp', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: {
                },
                bindToController: {
                    formname: "@",
                    storedprocedure: "@",
                    itemsperrow: "@",
                    isreadonly: "@",
                    hidetabs: "@",
                    useasfilter:"@",
                    model: "=",
                    options: "=",
                    data: "=" //data passed directly as attribute object { selectedItems: [{ ... }]}
                },
                controllerAs: "mfsp",
                template: '<magic-form ng-if="mfsp.dataIsReady" table-name="{{mfsp.formname}}" model="mfsp.model" options="mfsp.mf_options"></magic-form>',
                controller: ["$scope",
                        "$timeout",
                        "config",
                        function ($scope, $timeout, config) {
                            var self = this;
                            var selectedItems = [];
                            
							var valueSolver = function (v) {
								var value_;
                                switch(v.Schema_type) {
									case "number":
										value_ = (v.DetailValue ? parseFloat(v.DetailValue) : v.DetailValue);
										break;
										//D.T #4782 the form for datepicker expects date in format e.g 2018-01-05T23:00:00.000Z as strings , for datetimepicker an object ...
									case "date":
										if (v.MagicTemplateDataRole == "datetimepicker")
											value_ = (v.DetailValue ? new Date(v.DetailValue) : v.DetailValue);
										else
											value_ = v.DetailValue;
                                        break;
                                    case "boolean":
                                        if (v.DetailValue && (v.DetailValue == "true" || v.DetailValue == "1"))
											value_ = true;
										value_= false;
                                        break;
                                    default:
                                        return value_ = v.DetailValue;
								}
								return value_;
                            }
                            self.getFormDefinition = function () {
                               
                                self.dataIsReady = false;
                                if (!self.formname || !self.storedprocedure) {
                                    console.log("attributes 'formname' and 'storedprocedure' are mandatory !!!");
                                    return;
                                }
                                self.definition = [];
                                self.valuesToResolve = {};
                                if (!self.isreadonly)
                                    self.isreadonly = false;
                                if (!self.itemsperrow)
                                    self.itemsperrow = 2;
                                self.mf_options = {};
                                
								try {
									selectedItems = JSON.parse(config.data).models;
								}
                                catch (e) {
                                    console.log(e);
								}
								if (selectedItems && !selectedItems.length && self.data && self.data.selectedItems)
									selectedItems = self.data.selectedItems;
								//management of kendo model if passed via config
								var kmodel = null;
								if (config.model && config.model.toJSON)
									kmodel = config.model.toJSON();
								if (!kmodel && self.data && self.data.model)
									kmodel = self.data.model;
								//standard payload
								var payload = { FormCode: self.formname, ObjectID: config.model ? config.model.id : null, selectedItems: selectedItems };
								//if model has been given extend the payload with it.
								if (kmodel)
									payload = $.extend(payload, kmodel);

								MF.api.get({ storedProcedureName: self.storedprocedure, data: payload }).then(function (res) {
                                    //options are key-values which are passed in the select as a parameter
                                    if (res.length && res[0].length) {
                                        $.each(res[0], function (i, v) {
                                            if (self.useasfilter && toBoolean(self.useasfilter)) {
                                                var filterOperator =
                                                {
                                                    MagicTemplateDetailID: 1
	                                                , MagicGrid_ID: 1
	                                                , MagicGridName: ""
	                                                , OrdinalPosition: ""
	                                                , ColumnName: "Operator"
	                                                , Columns_label: "Operatore"
	                                                , Schema_required: false
                                                    , MagicDataRole_ID: 2
	                                               , MagicDataSource: "Magic_GetFormFilterOperators"
	                                                , MagicDataSourceValueField: "ID"
	                                                , MagicDataSourceTextField: "Description"
	                                                , Detailisvisible: true
	                                                , Schema_validation: null
	                                                , Magic_CultureID: 76
	                                                , GroupOrdinalPosition: 10
	                                                , MagicTemplateDataRole: "dropdownlist"
	                                                , Schema_type: "string"
	                                                , MagicTemplateGroupLabel: null
	                                                , MagicTemplateGroupID: 1
	                                                , MagicDataSourceType_ID: 1
	                                                , DetailonchangeFunctionName: null
	                                                , SearchGridName: null
	                                                , SearchGridDescColName: null
	                                                , Schema_Numeric_max: null
	                                                , Schema_Numeric_min: null
	                                                , Schema_Numeric_step: null
	                                                , CascadeColumnName: null
	                                                , CascadeFilterColumnName: null
	                                                , Schema_form_extension: null
                                                }
                                                self.definition.push(filterOperator);
                                                filterOperator.OrdinalPosition = v.OrdinalPosition;
                                                v.OrdinalPosition = v.OrdinalPosition + 1;
                                                filterOperator.MagicTemplateDetailID = v.MagicTemplateDetailID + 1000000;
												filterOperator.Columns_label = v.Columns_label;
												v.Columns_label = getObjectText("value"); 
                                                filterOperator.MagicTemplateGroupID = v.MagicTemplateGroupID;
                                                filterOperator.MagicTemplateGroupLabel = v.MagicTemplateGroupLabel;
                                                filterOperator.GroupOrdinalPosition = v.GroupOrdinalPosition;
                                                filterOperator.MagicDataSourceValueField = v.MagicTemplateDataRole == ("dropdownlist" || "multiselect")  ? "enums" : v.Schema_type; //use the ID field in order to know which filter operators to load 
                                                filterOperator.Magic_CultureID = v.Magic_CultureID;
                                                filterOperator.MagicGridName = v.MagicGridName;
                                                filterOperator.MagicGrid_ID = v.MagicGrid_ID;
                                                filterOperator.ColumnName = v.ColumnName + "__filterOperator";
                                            }
                                            if (v.Schema_form_extension && v.Schema_form_extension.indexOf('{') != -1)
                                                v.MagicFormExtension = JSON.parse(v.Schema_form_extension);

                                            self.definition.push(v);
                                            if (v.DetailValue)
                                                self.valuesToResolve[v.ColumnName] = valueSolver(v);
                                        });
                                        self.mf_options = { formDefinition: self.definition, valuesToResolve: self.valuesToResolve, itemsPerRow: self.itemsperrow, kendoStyle: true, readonly: toBoolean(self.isreadonly), hideTabs: toBoolean(self.hidetabs) };
										$.extend(self.mf_options, self.options);
                                        $timeout(function () { self.dataIsReady = true }, 100);
                                    }
                                    else console.log("form has no defnition !!!!");
                                });
                            };
                 
                            $scope.$watch('mfsp.formname', function () {
                                self.getFormDefinition();
                            });

                        }]
            }
        }]);
});