define(['angular', 'bootstrap-decorator', 'angular-schema-form-dynamic-select-ui', 'angular-schema-form-datetimepicker', 'angular-schema-form-searchgrid', 'angular-schema-form-grid', 'angular-schema-form-bo-selector', 'angular-schema-form-geo-autocomplete', 'angular-filter', 'angular-sanitize'], function (angular) {
    angular.module('magicForm', ['schemaForm', 'mgcrea.ngStrap', "mgcrea.ngStrap.modal",
        "pascalprecht.translate", "ui.select", "mgcrea.ngStrap.select",
        'schemaForm-datepicker', 'schemaForm-timepicker', 'schemaForm-datetimepicker', 'angular.filter'])
        .config(['$provide', function ($provide) {
            $provide.decorator('propsFilterFilter', ['$delegate', function ($delegate) {
                var srcFilter = $delegate;
                return extendsFilter = function () {

                    if (angular.isArray(arguments[0]) && arguments[0].length && arguments[0][0].ignorePropsFilter)
                        return arguments[0];

                    return srcFilter.apply(this, arguments);
                }
            }])
        }])
        .directive('magicForm', ['$http', '$filter', '$q', '$timeout', '$sce', function ($http, $filter, $q, $timeout, $sce) {
            return {
                replace: false,
                restrict: "E",
                templateUrl: "/Magic/Views/Templates/Directives/magic-form.html",
                scope: {
                    tableName: "@",
                    model: "=",
                    events: "=",
                    options: "="
                },
                link: function (scope, element, attrs, ctrls) {
                    //scope.events
                    // in order to handle events on field level there exists a form definition property "DetailonchangeFunctionName"
                    // {"columnName":[eventHandler]} eventhandler then get's called with newValue as first and oldValue as second argument, this is currently only passed to the grid input

                    //scope.options
                    //itemsPerRow define how many items shall be shown per row (max 12)
                    //source to specify another table/view to read from
                    //readonly makes form readonly
                    //layerID pass in a layerID to show corresponding columns only
                    //valuesToResolve model for the schema form directive
                    //callback function to call after form data request
                    //renderDone function that gets called after form is rendered
                    //kendoStyle true adapt to kendo style
                    //formDefinition
                    //hideTabs :boolean that decides to show tabs or not
                    //where FUNCTION which gets default where-condition and has to return a where-condtion
                    //apiCallData {} or FUNCTION that gets passed/called and result passed to the server with every component api call, ex. grids or dropdowns - as default the own model data gets passed
                    scope.vocalCommandsInitialized = false; //#vocalCommands #felix: bool currently unused 2020/09/08
                    scope.requestKeys = {};
                    scope.showForm = true;
                    scope.model = scope.model || {};
                    scope.events = scope.events || {};
                    scope.hasEditFormLayout = false; //#formedit
                    scope.textareaWithNumOfRowsProp = []; //#formedit #numberOfTextareaRows
                    scope.labelsWithCustomCSS = [];

                    var $element = $(element),
                        uploadFields = {},
                        requiredMultiselect = {},
                        numericFormatFields = {},
                        wysiwygEditorFields = {},
                        defaultOptions = {
                            itemsPerRow: 1,
                            where: function (whereCondition) {
                                return whereCondition;
                            },
							apiCallData: function () { return scope.model }
                        };

                    scope._options = $.extend(true, {}, defaultOptions, scope.options || {});                     
                    scope.tableDataRoleButtonClick = function (storedProcedureName) {
                        var parent = scope;
                        while (parent = parent.$parent) {
                            if (parent.tableDataRoleButtonClick) {
                                parent.tableDataRoleButtonClick(storedProcedureName);
                                break;
                            }
                        }
                    };

                    scope.formOptions = {
                        formDefaults: {
                            readonly: !!scope._options.readonly
                        }
                    };
                    var dateInputs = [];
                    scope.$on("sf-render-finished", function () {
                        if (scope.model && scope._options &&  scope._options.readonly) {
                            dateInputs.map(function (v) {
                                if (scope.model[v.column] && scope.model[v.column] instanceof Date)
                                    scope.model[v.column] = $filter("date")(scope.model[v.column], v.format);
                            });
                        }
                    });

                    //create button groups for subTabs
                    scope.$on("sf-render-finished", function () {
                        setTimeout(function () {
                            var $uls = $element.find("ng-form ul.nav"),
                                $firstLevelTabs = $uls
                                    .first()
                                    .find("li");

                            if (scope._options.kendoStyle) {
                                $element.addClass("bend");

                                $firstLevelTabs
                                    .addClass("k-item k-state-default")
                                    .find('a')
                                    .addClass('k-link');

                                $element
                                    .find('.tab-content')
                                    .first()
                                    .addClass('k-tabstrip')
                                    .find('> .tab-pane')
                                    .addClass('k-content k-state-active')
                            }

                            if (scope._options.readonly)
                                $element.addClass("readonly");

                            $uls.each(function (k, ul) {
                                var $ul = $(ul);
                                if (scope._options.kendoStyle) {
                                    $ul
                                        .removeClass("nav nav-tabs")
                                        .addClass("k-tabstrip-items k-reset");
                                }

                                if (k != 0) {
                                    var $lis = $ul.find("li"),
                                        $tabPane = $ul.closest("div.tab-pane"),
                                        tabPosition;

                                    $tabPane
                                        .closest("div.tab-content")
                                        .children()
                                        .each(function (k, el) {
                                            if (el == $tabPane[0]) {
                                                tabPosition = k;
                                                return false;
                                            }
                                        });
                                    var $parentTab = $firstLevelTabs.eq(tabPosition),
                                        color = null;
                                    $parentTab
                                        .html(scope._options.kendoStyle ?
                                            '<div class="dropdown"><span class="k-link dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + $parentTab.text() + '<span class="caret"></span></span><ul class="dropdown-menu"></ul></div>' :
                                            '<div class="btn-group"><button class="dropdown-toggle btn btn-default" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + $parentTab.text() + '&nbsp;<span class="caret"></span></button><ul class="dropdown-menu"></ul></div>');
                                    var $parentButtonList = $parentTab.find("ul");
                                    $lis.each(function (k, v) {
                                        var $li = $(v),
                                            $button = $('<li><a href="#"' + (scope._options.kendoStyle ? ' class="k-button"' : '') + '><span' + (scope._options.kendoStyle ? ' class="k-link"' : '') + '>' + $li.text() + '</span></a></li>');
                                        $parentButtonList.append($button);
                                        $button.click(function () {
                                            $li.trigger("click");
                                        });
                                    });
                                    $ul.hide();
                                }
                            });
                            $uls.first().find("li span.color").each(function (k, v) {
                                var $v = $(v);
                                $v.parent().css("background-color", $v.text());
                            });
                            $.each(uploadFields, function (uploadField, options) {
                                var $field = $('#' + uploadField, element);
                                if (options.accept)
                                    $field.attr('accept', '.' + options.accept.replace('@', ',.'));
                                if (options.savePath)
                                    $field.data('savePath', options.savePath);

                                if ($field && $field.data() && $field.data().$ngModelController && $field.data().$ngModelController.$modelValue) {
                                    try {
                                        options.files = JSON.parse($field.data().$ngModelController.$modelValue);
                                    } catch (exc) {
                                        options.files = [];
                                    }
                                }
                                var upload = initKendoUploadField($('#' + uploadField, element), options, element);
                                if (upload) {
                                    upload.bind("success", function (e) {
                                        //scope.model[uploadField] = upload.options.files.length ? JSON.stringify(upload.options.files) : null;
                                        scope.$form[uploadField].$setViewValue(upload.options.files.length ? JSON.stringify(upload.options.files) : '');
                                    });
                                }
                            });
                            $.each(numericFormatFields, function (numericFormatField, format) {
                                var $input = $('#' + numericFormatField, element);
                                if (!$input.next().hasClass('k-numerictextbox')) {
                                    $input.hide();
                                    var numericTextBox = $input
                                        .after('<input/>')
                                        .next()
                                        .kendoNumericTextBox({
                                            value: scope.$form[numericFormatField].$modelValue,
                                            format: format.replace(/^0:/, ''),
                                            change: function () {
                                                scope.$form[numericFormatField].$setViewValue(this.value());
                                            }
                                        })
                                        .data('kendoNumericTextBox');
                                    numericTextBox.wrapper
                                        .width('100%');
                                if ($input.is(':disabled'))
                                    numericTextBox.readonly();
                                }
                            });
                            $.each(wysiwygEditorFields, function (wysiwygEditorField, format) {
                                var $textarea = $('#' + wysiwygEditorField, element);
                                if (!$textarea.next().hasClass('k-editor')) {
                                    var editor = $textarea
                                        .hide()
                                        .after('<textarea>')
                                        .next()
                                        .kendoEditor({
                                            tools: ["viewHtml", "bold", "italic", "underline", "strikethrough", "justifyLeft", "justifyCenter", "justifyRight", "justifyFull", "insertUnorderedList", "insertOrderedList", "indent", "outdent", "createLink", "unlink", "insertImage", "insertFile", "subscript", "superscript", "createTable", "addRowAbove", "addRowBelow", "addColumnLeft", "addColumnRight", "deleteRow", "deleteColumn", "formatting", "cleanFormatting", "fontName", "fontSize", "foreColor", "backColor", "print"],
                                            value: scope.$form[wysiwygEditorField].$modelValue,
                                            change: function () {
                                                scope.$form[wysiwygEditorField].$setViewValue(this.value());
                                            },
                                        })
                                        .data('kendoEditor');
                                    if ($textarea.is(':disabled'))
                                        editor.readonly();
                                }
                            });

                            //datepickers to the top! https://gitlab.ilosgroup.com/ilos/operations/-/issues/306
                            function calculateDatepickerPosition(e) {
                                var boundingRect = e.target.getBoundingClientRect();
                                var newX = parseInt(boundingRect.x);
                                var newY = parseInt(boundingRect.y + boundingRect.height);  //render on bottom of input

                                var picker = $(e.target).siblings('.datepicker');
                                var padding = 20;

                                if (newY + picker.height() >= window.innerHeight - padding) {         //render on top of input if new picker position overflows window
                                    newY = boundingRect.y - boundingRect.height - picker.height();
                                }

                                $(e.target).siblings('.datepicker').css('position', 'fixed').css('left', newX + 'px').css('top', newY + 'px');
                            }
                            $('input[data-date-type]').filter(function () { return $(this).parents('.modal-body').length == 0 }).on('click', calculateDatepickerPosition); //apply only if form is not shown not inside a modal

                            if (scope._options.renderDone) {
                                if (window.vocalCommandsActive) { // && !scope.vocalCommandsInitialized
                                    var inputs = $('input[type=text]:not(.k-input):not(:disabled):not([bs-datepicker]):not([data-time-format]):not([data-date-format])').filter(function () { return $(this).width() > 1 });
                                    var wizardTextareas = $('form').not('.ng-hide').find('textarea').not('disabled')
                                    enableVocalCommandsForMagicFormElements(inputs); //#vocalDev
                                    enableVocalCommandsForMagicFormElements(wizardTextareas); //#vocalDev #vocalCommands
                                    var $kendoEditorContainers = $('table').find('.k-editable-area');
                                    enableVocalCommandsForKendoEditorFields($kendoEditorContainers);
                                    scope.vocalCommandsInitialized = true;
                                }
                                if (!scope.options.isGridFilterForm) {
                                    applyFormEditAdditionalStyles();
                                }
                                scope._options.renderDone(element, scope.tabDefinition, scope.form); //#formedit
                                //hide help block temporary
                                $('input[type=search]').closest('.schema-form-section.row').find('.help-block').hide(); //https://redmine.ilosgroup.com/issues/7118
                            }
                        });
                    });

                    var applyFormEditAdditionalStyles = function () { //#formedit #numberOfTextareaRows #labelCSS
                        $.each(scope.textareaWithNumOfRowsProp, function (i, textarea) {
                            var textareaEl = $('magic-form[table-name="' + scope.tableName + '"]').find('#' + textarea.columnName)[0];
                            if (textareaEl) {
                                textareaEl.rows = textarea.numberOfRows;
                            }
                        });

                        $.each(scope.labelsWithCustomCSS, function (i, label) {
                            var formField = $('magic-form[table-name="' + scope.tableName + '"]').find('[name=' + label.columnName + ']');

                            if (!formField.length) {
                                formField = $('input[ng-model="model[\'' + label.columnName + '\']"]');
                            }

                            var el = null;

                            if (formField.length) {
                                if (formField[0].type && formField[0].type == 'checkbox') {
                                    el = formField.siblings('span')
                                } else {
                                    el = formField.siblings('label');
                                }
                            }

                            if (!el.length) {
                                el = $('label:contains("' + label.columnName + '")');
                            }

                            if (el && el.length > 0) {
                                el = el[0];
                                el.style.fontSize = label.fontSize;
                                el.style.fontWeight = label.fontWeight;
                                el.style.fontStyle = label.fontStyle;
                                el.style.fontVariantCaps = label.fontVariantCaps;
                                el.style.color = label.color;
                                el.style.backgroundColor = label.backgroundColor;
                                if (label.shadow && label.shadow.length > 0) {
                                    el.style.textShadow = label.shadow;
                                }
                                el.style.textDecorationLine = label.textDecorationLine;
                                el.style.textDecorationStyle = label.textDecorationStyle;
                                el.style.textDecorationColor = label.textDecorationColor;
                            }
                        });
                    }

                    var parseValueBySchemaType = function (key, value) {
                        if (value && !$.isArray(value) && typeof value != 'object' && (key in scope.schema.properties)) {
                            var type = scope.schema.properties[key].type;
                            if (type) {
                                if (Array.isArray(type)&& type[0]) {
                                    type = type[0];
                                }
                                switch (type.toLowerCase()) {
                                    case "string":
                                        return value.toString();
                                    case "integer":
                                        return parseInt(value);
                                    case "number":
                                        return parseFloat(value);
                                    case "bool":
                                    case "boolean":
                                        return toBoolean(value);
                                    case "date":
                                    case "datetime":
                                        return new Date(value);
                                    default:
                                        return value;
                                }
                            }
                        }
                        return value === "null" ? null : value;
                    }

                    function resolveSearchgridValue(columnName) {
                        if (scope._options.valuesToResolve[scope.tableName] && scope._options.valuesToResolve[scope.tableName][columnName]) {
                            return scope._options.valuesToResolve[scope.tableName][columnName];
                        } else {
                            return false;
                        }
                    }

                    var foreignKeys = [];
                    function resolveForeignKeys() {
                        if (scope._options && scope._options.valuesToResolve) {

                            $.each(scope._options.valuesToResolve, function (key, value) {
                                if (value && key in scope.schema.properties) {
                                    if ($.isArray(scope.model[key]) && !$.isArray(value))
                                        value = [value];
                                    if ($.isArray(value)) {
                                        scope._options.valuesToResolve[key] = $.map(value, function (v) {
                                            return parseValueBySchemaType(key, v);
                                        });
                                    } else {
                                        scope._options.valuesToResolve[key] = parseValueBySchemaType(key, value);
                                    }
                                }
                            });

                            if (scope._options.gridEditPage) {
                                scope.model = $.extend(scope._options.valuesToResolve, scope.model);
                            } else {
                                $.extend(scope.model, scope._options.valuesToResolve);
                            }
                            $.each(foreignKeys, function (k, v) {
                                if (v.data.MagicTemplateDataRole.indexOf("searchgrid") == 0 && (scope._options.valuesToResolve[v.data.ColumnName] || resolveSearchgridValue(v.data.ColumnName))) {
                                    if (v.data.MagicDataSource) {
                                        var isMulti = v.data.MagicTemplateDataRole.indexOf("multiselect") >= 0;
                                        getsearchgridvalueinpopup(
                                            v.data.MagicDataSource,
                                            v.data.MagicDataSourceTextField,
                                            undefined,
                                            undefined,
                                            scope._options.valuesToResolve[v.data.ColumnName] || resolveSearchgridValue(v.data.ColumnName),
                                            v.data.MagicDataSourceValueField,
                                            v.data.MagicDataSourceSchema,
                                            v.data.MagicDataSourceType_ID,
                                            function (value) {
                                                //v.input.titleMap = [
                                                //    {
                                                //        value: scope.model[v.data.ColumnName],
                                                //        name: value
                                                //    }
                                                //];
                                                //if (scope._options.readonly)
                                                //    scope.model[v.data.ColumnName] = value;
                                                //else
                                                //    v.input.placeholder = value;
                                                //$timeout(function () { });
                                                $timeout(function () {
                                                    if (scope._options.readonly)
                                                        scope.model[v.data.ColumnName] = value;
                                                    else {
                                                        var titleMap = isMulti ? value.map(_v => ({
                                                            value: (scope._options.valuesToResolve[v.data.ColumnName] || resolveSearchgridValue(v.data.ColumnName)).find(__v => __v == _v.value),
                                                            name: _v.text
                                                        })) : [{
                                                            value: scope._options.valuesToResolve[v.data.ColumnName] || resolveSearchgridValue(v.data.ColumnName),
                                                            name: value
                                                        }];
                                                        if (!v.data.Schema_required && !isMulti) {
                                                            titleMap.unshift({ value: "", name: "", description: "&nbsp;" });
                                                        }
                                                        if (v.input.options.asyncCallback)
                                                            v.input.defaultValuesTitleMap = titleMap;
                                                        else
                                                            v.input.titleMap = titleMap;

                                                        if (isMulti)
                                                            v.input.options.scope.select_model.selected = titleMap;
                                                        else
                                                            scope.$broadcast('schemaFormRedraw');
                                                    }
                                                });
                                            },
                                            undefined,
                                            isMulti
                                        );
                                    }
                                    else {
                                        if (scope._options.readonly)
                                            scope.model[v.data.ColumnName] = scope._options.valuesToResolve[v.data.MagicDataSourceTextField];
                                        else
                                            v.input.placeholder = scope._options.valuesToResolve[v.data.MagicDataSourceTextField];
                                    }
                                }
                                else {
                                    if (scope._options.valuesToResolve[v.data.ColumnName] && v.data.MagicDataSource) {
                                        var filters = [{
                                            field: v.data.MagicDataSourceValueField,
                                            operator: "eq",
                                            value: scope._options.valuesToResolve[v.data.ColumnName]
                                        }];
                                        if (Array.isArray(filters[0].value)) {
                                            filters = $.map(filters[0].value, function (value) {
                                                return {
                                                    field: v.data.MagicDataSourceValueField,
                                                    operator: "eq",
                                                    value: value
                                                };
                                            });
                                        }
                                        GetDropdownValues(v.data.MagicDataSource.replace(/ds$/, ""),
                                            v.data.MagicDataSourceValueField,
                                            v.data.MagicDataSourceTextField,
                                            v.data.MagicDataSourceSchema || "",
                                            v.data.MagicDataSourceType_ID,
                                            {
                                                logic: "or",
                                                filters: filters
                                            }
                                            , true
                                            , typeof scope._options.apiCallData === 'function' ? scope._options.apiCallData() : scope._options.apiCallData
                                        )
                                            .then(function (res) {
                                                $timeout(function () {
                                                    if (scope._options.readonly)
                                                        scope.model[v.data.ColumnName] = $.map(res, function (_v) { return _v.text }).join(', ');
                                                    else {
                                                        var titleMap = $.map(res, function (_v) {
                                                            return {
                                                                value: v.data.Schema_type === "number" ? parseInt(_v.value) : _v.value,
                                                                name: _v.text
                                                            };
                                                        });
                                                        if (v.input.options.asyncCallback)
                                                            v.input.defaultValuesTitleMap = titleMap;
                                                        else
                                                            v.input.titleMap = titleMap;

                                                        scope.$broadcast('schemaFormRedraw');
                                                    }
                                                });
                                            });
                                    }
                                }
                            });
                            //scope._options.valuesToResolve = null;
                        }
                    }

                    scope.lang = {
                        search: getObjectText("search")
                    };

                    //highlight the error tab
                    scope.$on("schemaFormValidate", function (e) {

                        // multiselect validation
						var requiredMultiselectWithValue = [];
                        $.each(requiredMultiselect, function (columnName, input) {
                            scope.$form.$setValidity("required", scope.model[columnName] && !!scope.model[columnName].length, input.options.scope);
                            $("[ng-init=\"uiMultiSelectInitInternalModel(model['" + columnName + "'])\"]")
								.toggleClass('has-error', !scope.model[columnName] || !scope.model[columnName].length);
							if (scope.model[columnName] && !!scope.model[columnName].length)
								requiredMultiselectWithValue.push(columnName);
                        });

						//BUG #6501 required multiselect are not properly managed in validation, they keep on being marked as "errors" even after a value has been set (if a previous validation failed).
						//If the only errors are multiselect with values i will reset the errors...
						var msMarkedAsError = 0;
						var totErrors = 0;
						var msNotInError = 0;
                        if (scope.$form.$invalid) {
                        	//show help block again
                            $('input[type=search]').closest('.schema-form-section.row').find('.help-block').show(); https://redmine.ilosgroup.com/issues/7118
							$.each(scope.$form.$error, function (erroCode, errorObjects) {
								$.each(errorObjects, function (k, error) {
									totErrors++;
										if (erroCode == "required" && error.form.key && error.form.key.length) {
											if (requiredMultiselect[error.form.key[0]])
												msMarkedAsError++;
											if (requiredMultiselectWithValue.indexOf(error.form.key[0]) != -1)
												msNotInError++;
										}
								});
							});
							if (msMarkedAsError == msNotInError && totErrors == msMarkedAsError) {
								scope.$form.$error = {};
							}
						}


                        //problem with this code is we dont know the key of the plugin inputs :/
                        //if (scope.$form.$invalid) {
                        //    $.each(scope.$form.$error, function (erroCode, errorObjects) {
                        //        $.each(errorObjects, function (k, error) {
                        //            console.log(error.$name);
                        //        });
                        //    });
                        //}
                        //so I solved it with jquery :*
                        setTimeout(function () {
                            var tabHeaders = $element.find(".nav-tabs li a");
                            $element.find(".tab-pane").each(function (k, tab) {
                                if ($(tab).find(".ng-invalid").length) {
                                    tabHeaders.eq(k).css({ "text-decoration": "underline", "color": "red" });
                                }
                                else {
                                    tabHeaders.eq(k).removeAttr("style");
                                }
                            });
                        }, 0);
                    });

                    scope.$watch('options', function (newValue, oldValue) {
                        scope._options = $.extend(true, {}, defaultOptions, scope.options || {});
                        if (!!newValue.readonly !== !!oldValue.readonly) {
                            scope.formOptions.formDefaults.readonly = newValue.readonly;
                            scope.buildForm();
                        }
                    });

                    scope.$watch('tableName', function (newValue, oldValue) {
                        scope.$form.$valid = false;
                        scope.$form.$invalid = true;
                        scope.buildForm();
                    });

                    scope.$watch('model', function (newMod, oldMod) { //only used to update uploadFields
                        $.each(uploadFields, function (uploadField, options) {                            
                            var $field = $('#' + uploadField);
                            if ($field && scope.model[uploadField]) {
                                try {
                                    options.files = JSON.parse(scope.model[uploadField]);                                    
                                    initKendoUploadField($field, options, element);                                    
                                } catch (exc) {
                                    options.files = [];
                                }
                            }
                        });
                    })

                    scope.getCascadeColumnNames = function (CascadeColumnName) {
                        return !CascadeColumnName ? null : CascadeColumnName.split(",");
                    }
                    scope.areDependenciesReady = function (cascadeColumnNames) {
                        return !cascadeColumnNames.some(cascadeColumnName => scope.model[cascadeColumnName] === null || typeof scope.model[cascadeColumnName] === 'undefined')
                    }

                    scope.buildForm = function () {
                        var tabs = {};
                        dateInputs = [];
                        foreignKeys = [];
                        scope.isFormLoading = true;
                        scope.form = [
                            {
                                "type": "fieldset",
                                "title": "",
                                "items": [{
                                    type: "tabs",
                                    tabs: []
                                }]
                            }
                        ];
                        scope.schema = {
                            type: "object",
                            required: [],
                            properties: {
                            }
                        };
                        var promises = [];
                        var layerIDs = [];
                        if (scope._options && !scope._options.formDefinition) {
                            promises.push(
                                $http
                                    .post(
                                        "/api/MAGIC_TEMPLATEDETAILS/GetTempDetails_Culture",
                                        { //#mfapireplaced
                                            table: scope._options.source || null,
                                            MagicGridName: scope.tableName ||  'XYZ___WYG___XMN_____WHY?' //D.T ... workaround when tableName is false
                                        }
                                    )
                            );
                        }
                        else
                            promises.push({ data: { Data: [{ Table: scope._options.formDefinition }] } });
                        if (scope._options && scope._options.layerID) {
                            if (window["layerlist" + scope._options.layerID] && window["layerlist" + scope._options.layerID].length) {
                                layerIDs = window["layerlist" + scope._options.layerID];
                            }
                            else {
                                promises.push($http.get("/api/Magic_Grids/GetLayerList/" + scope._options.layerID).then(function (res) {
                                    layerIDs = window["layerlist" + scope._options.layerID] = res.data;
                                }));
                            }
                        }
                        return $q.all(promises)
                            .then(
                            function (results) {
                                res = results[0];
                                var layerHashset = {};
                                layerIDs.map(function (v) { layerHashset[v] = null; });
                                if (res.data.Data && res.data.Data.length) {
                                    var data = res.data.Data[0].Table;

                                    if (scope._options && scope._options.dateToFields) {
                                        var datePickers = $.grep(data, function (field) { return field.MagicTemplateDataRole == "datepicker" });
                                        var timePickers = $.grep(data, function (field) { return field.MagicTemplateDataRole == "datetimepicker" });
                                        
                                        $.each(datePickers, function (i, dPicker) {
                                            dPicker.hasDateToField = true;                                            
                                        });
                                        $.each(timePickers, function (i, tPicker) {
                                            tPicker.hasDateToField = true;                                            
                                        });

                                    }

                                    if (scope._options && scope._options.callback) {
                                        scope._options.callback(data, scope);
                                    }
                                    for (var i = 0; i < data.length; i++) {
                                        if (data[i].ColumnName == "VirtualColumn")
                                            continue;
                                        else if (scope._options.layerID === null && data[i].Layer_ID)
                                            continue;
                                        else if (data[i].Layer_ID && layerIDs.length && !(data[i].Layer_ID in layerHashset))
                                            continue;
                                        var schema = {
                                            title: (data[i].CultureColumns_label || data[i].Columns_label || data[i].ColumnName) + (data[i].Schema_required ? ' *' : ''),
                                            type: (!data[i].Schema_type || data[i].Schema_type == "date") ? "string" : data[i].Schema_type,
                                        };
                                        if (data[i].Schema_defaultvalue && data[i].Schema_defaultvalue.toLowerCase() != "null") {
                                            schema.default = data[i].Schema_defaultvalue.replace(/\(\(/g, "").replace(/\)\)/g, "");
                                            if (schema.type == "boolean" || schema.type == "bool")
                                                schema.default = toBoolean(schema.default);
                                            else if (schema.type == "number")
                                                schema.default = parseFloat(schema.default);
                                        }
                                        scope.schema.properties[data[i].ColumnName] = schema;
                                        if (!(data[i].MagicTemplateGroupLabel in tabs)) {
                                            tabs[data[i].MagicTemplateGroupLabel] = {
                                                pos: data[i].GroupOrdinalPosition,
                                                title: data[i].CultureGroups_label || data[i].MagicTemplateGroupLabel,
                                                items: [],
                                                hasSubTabs: false
                                            }
                                        }
                                        if (data[i].StringLength && !scope.options.isGridFilterForm)
                                            schema.maxLength = data[i].StringLength;
                                        var input = {
                                            key: data[i].ColumnName
                                        };

                                        //modelDateFormat: "yyyy-MM-dd'T'HH:mm:ss'.000'", //has no effekt so we need to convert it before sending to the server, use toTimeZoneLessString(new Date(isostringUGetFromThisComponent))
                                        if (data[i].MagicTemplateDataRole == "datetimepicker") {
                                            //if (!scope._options.readonly) {
                                                schema.type = "datetime";
                                                input.type = "datetimepicker";
                                                input.options = {
                                                    dateType: "iso",
                                                    timeType: "iso",
                                                    hasDateToField: data[i].hasDateToField || false
                                                };
                                            input.title = schema.title || "";
                                            //}
                                            dateInputs.push({ column: data[i].ColumnName, format: "medium" });
                                        }
                                        else if (data[i].MagicTemplateDataRole == "taxcode_ita") {
                                            if (!scope._options.readonly) {
                                                (function (columnName) {
                                                    input.type = "text";
                                                    input.$asyncValidators = {
                                                        invalidTax: function (value) { return mfCheckTAXCode(value, columnName, scope); }
                                                    };
                                                    input.ngModelOptions = {
                                                        updateOn: "blur"
                                                    };
                                                })(data[i].ColumnName);
                                            }                                        
                                        }
                                        else if (data[i].MagicTemplateDataRole == "vatnumber_ita") {
                                            if (!scope._options.readonly) {
                                                (function (columnName) {
                                                    input.type = "text";
                                                    input.$asyncValidators = {
                                                        invalidVat: function (value) { return mfCheckVATCode(value, columnName, scope); }
                                                    };
                                                    input.ngModelOptions = {
                                                        updateOn: "blur"
                                                    };
                                                })(data[i].ColumnName);
                                            }
                                        }
                                        else if (data[i].MagicTemplateDataRole == "IBAN") {
                                            if (!scope._options.readonly) {
                                                (function (columnName) {
                                                    input.type = "text";
                                                    input.$asyncValidators = {
                                                        invalidIBAN: function (value) { return mfCheckIBAN(value, columnName, scope); }
                                                    };
                                                    input.ngModelOptions = {
                                                        updateOn: "blur"
                                                    };
                                                })(data[i].ColumnName);
                                            }
                                        } else if (data[i].MagicTemplateDataRole == "datepicker") {
                                            //if (!scope._options.readonly) {
                                            if (!data[i].Schema_required) {
                                                schema.type = [schema.type, 'null']
                                            } 
                                            input.type = "datepicker";
                                                input.dateOptions = {
                                                    dateType: "iso",
                                                    trigger: "hover",
                                                    placement: "top"
                                            };
                                            input.options = {
                                                hasDateToField: data[i].hasDateToField || false
                                            }
                                            //}
                                            dateInputs.push({ column: data[i].ColumnName, format: "fullDate" });
                                        }
                                        else if (data[i].MagicTemplateDataRole == "timepicker") {
                                            if (!scope._options.readonly) {
                                                input.type = "timepicker";
                                                input.timeOptions = {
                                                    timeType: "iso"
                                                };
                                            }
                                            dateInputs.push({ column: data[i].ColumnName, format: "mediumTime" });
                                        }
                                        else if (data[i].MagicTemplateDataRole == "applicationupload") {
                                            var path = data[i].Upload_SavePath || "",
                                                useController = path == "" || !path.match(/^\//),
                                                output = "";
                                            if ((!path || path.match(/^\//)) && window.FileUploadRootDir) {
                                                path = managesavepath(window.FileUploadRootDir) + path.replace(/^\//, '');
                                                useController = true;
                                            }
                                            if (scope._options && scope._options.readonly && scope._options.valuesToResolve && scope._options.valuesToResolve[data[i].ColumnName]) {
                                                input.type = "help";
                                                var columnValue = scope._options.valuesToResolve[data[i].ColumnName] && scope._options.valuesToResolve[data[i].ColumnName].match(/^\[{/) ? JSON.parse(scope._options.valuesToResolve[data[i].ColumnName]) : [{ name: scope._options.valuesToResolve[data[i].ColumnName] }];
                                                $.each(columnValue, function (k, v) {
                                                    output += uploadTemplate(v, path, useController, false, false, scope.tableName, data[i].ColumnName);
                                                });
                                                input.helpvalue = $sce.trustAsHtml(output);
                                            } else {
                                                input.type = "file";
                                                uploadFields[data[i].ColumnName] = {
                                                    savePath: path,
                                                    useController: useController,
                                                    files: scope._options.valuesToResolve && scope._options.valuesToResolve[data[i].ColumnName] ? JSON.parse(scope._options.valuesToResolve[data[i].ColumnName]) : [],
                                                    multiple: data[i].Upload_Multi,
                                                    //savePath: data[i].Upload_SavePath,
                                                    accept: data[i].UploadAllowedFileExtensions
                                                };
                                            }
                                        }
                                        else if (data[i].MagicTemplateDataRole == "number" && data[i].Schema_Format) {
                                            numericFormatFields[data[i].ColumnName] = data[i].Schema_Format;
                                        }
                                        else if (data[i].MagicTemplateDataRole == "editor") {
                                            wysiwygEditorFields[data[i].ColumnName] = data[i];
                                            input.type = "textarea";
                                        }
                                        else if (data[i].MagicTemplateDataRole == "geoautocomplete") {
                                            schema.type = "string";
                                            foreignKeys.push({ data: data[i], input: input });
                                        }
                                        else if (data[i].MagicTemplateDataRole == "table") {
                                            input.type = "button";
                                            input.title = schema.title;
                                            input.onClick = "tableDataRoleButtonClick('" + data[i].MagicDataSource + "')";
                                            input.readonly = false;
                                        }
                                        else if (data[i].MagicTemplateDataRole == "textarea") {
                                            input.type = "textarea";
                                        }
                                        else if ((data[i].MagicTemplateDataRole == "html" || data[i].MagicTemplateDataRole == "labelfield") && scope._options.valuesToResolve && scope._options.valuesToResolve[data[i].ColumnName]) {
                                            input.type = "help";
                                            input.helpvalue = $sce.trustAsHtml(scope._options.valuesToResolve[data[i].ColumnName]);
                                        }
                                        if (data[i].TabGroupID) {
                                            tabs[data[i].MagicTemplateGroupLabel].hasSubTabs = true;
                                            input.TabGroupID = data[i].TabGroupID;
                                            input.TabGroupColor = data[i].TabGroupColor;
                                            input.TabGroupOrdinalPosition = data[i].TabGroupOrdinalPosition;
                                            input.TabGroupLabel = data[i].TabGroupLabel || data[i].TabGroupDefaultLabel;
                                            input.TabLabel = data[i].CultureGroups_label || data[i].MagicTemplateGroupLabel;

                                        }
                                        tabs[data[i].MagicTemplateGroupLabel].items.push(input);
                                        if (data[i].Schema_required) {   
                                            scope.schema.required.push(data[i].ColumnName);
                                        }
										//CHECK if it's initially hidden
										if (data[i].Detailisvisible === 0 || data[i].Detailisvisible === false) {
											input.condition = "false";
										}
										//SET EDITABLE/READONLY/MODIFY PROPERTY
                                        if (data[i].Schema_editable === false) {
                                            scope.schema.properties[data[i].ColumnName].readonly = true;
                                        }
                                        (function (input, schema, data) {
                                            if (data.MagicFormExtension && typeof data.MagicFormExtension === 'string') {
                                                try {
                                                    data.MagicFormExtension = JSON.parse(data.MagicFormExtension);
                                                } catch (e) {
                                                    data.MagicFormExtension = JSON.parse(data.MagicFormExtension.replace(/\\n/g, " ").replace(/\\r/g, " "));
                                                }
                                            }


                                            

                                            if (
                                                data.MagicTemplateDataRole === "autocomplete"
                                                || data.MagicTemplateDataRole.substring(0, 10) === "searchgrid"
                                                || data.MagicTemplateDataRole === "multiselect"
                                                || data.MagicTemplateDataRole === "geoautocomplete"
                                            ) {
                                                //if (!scope._options.readonly) {
                                                    var lastValues;
                                                    input.type = "uiselect";
                                                    input.options = {};
                                                    if (data.MagicTemplateDataRole.indexOf("multiselect") >= 0) {
                                                        scope.model[data.ColumnName] = scope.model[data.ColumnName] || [];
                                                        if (!$.isArray(scope.model[data.ColumnName]))
                                                            scope.model[data.ColumnName] = [scope.model[data.ColumnName]];
                                                        input.type = "uiselectmultiple";
                                                        if (data.Schema_required) {
                                                            requiredMultiselect[data.ColumnName] = input;
                                                        }
                                                    }
                                                    if (data.MagicTemplateDataRole.indexOf("searchgrid") >= 0) {
                                                        input.type = "searchgrid";
                                                        input.options.searchGrid = {
                                                            searchGridName: data.SearchGridName,
                                                            cascadeFromColumn: data.CascadeColumnName,
                                                            cascadeFilterColumn: data.CascadeFilterColumnName,
                                                            searchGridDescColName: data.SearchGridDescColName,
                                                            apiCallData: typeof scope._options.apiCallData == "function" ? scope._options.apiCallData() : scope._options.apiCallData,
                                                            isMulti: data.MagicTemplateDataRole.indexOf("multiselect") >= 0
                                                        };
                                                    } else if (data.MagicTemplateDataRole === "geoautocomplete") {
                                                        input.type = "geo-autocomplete";
                                                        input.options = {
                                                            geoAutocomplete: {
                                                                valueField: data.MagicDataSourceValueField,
                                                                textField: data.MagicDataSourceTextField
                                                            }
                                                        };
                                                    }

                                                    input.placeholder = scope.lang.search;
                                                    if (data.MagicDataSource) {
                                                        input.options.asyncCallback = function (options, searchValue) {
                                                            var deferred = $q.defer();
                                                            if (!searchValue && (!input.schema.default || input.defaultValuesTitleMap)) {
                                                                var _lastValues = lastValues || input.defaultValuesTitleMap || input.titleMap;
                                                                deferred.resolve({
                                                                    data: _lastValues && _lastValues.length ? _lastValues : (data.Schema_required || data.MagicTemplateDataRole === "multiselect" ? [] : (scope.model[data.ColumnName] ? [{ value: "", name: "", description: "&nbsp;" }] : []))
                                                                });
                                                            } else {
                                                                var filters = [];
                                                                if (searchValue) {
                                                                    filters.push({
                                                                        field: data.MagicDataSourceTextField,
                                                                        operator: data.MagicFormExtension &&
                                                                            data.MagicFormExtension.autocompleteFilterOperator ?
                                                                            data.MagicFormExtension.autocompleteFilterOperator : "contains",
                                                                        value: searchValue
                                                                    });
                                                                } else
                                                                    if (input.schema.default) {
                                                                        filters.push({
                                                                            field: data.MagicDataSourceValueField,
                                                                            operator: "equals",
                                                                            value: input.schema.default
                                                                        });
                                                                    }
                                                                //1 to 1 filtering CascaceColumnName to CascadeFilterColumnName   (a,b) --> (col1,col2)
                                                                $.each(scope.getCascadeColumnNames(data.CascadeColumnName), function (i, v) {
                                                                    if (!scope._options.readonly && v && scope.model[v] && scope.getCascadeColumnNames(data.CascadeFilterColumnName) && scope.getCascadeColumnNames(data.CascadeFilterColumnName).length > i)
                                                                        filters.push({ field: scope.getCascadeColumnNames(data.CascadeFilterColumnName)[i], operator: "eq", value: scope.model[v] });
                                                                });
                                                                //if (!scope._options.readonly && data.CascadeColumnName && scope.model[data.CascadeColumnName])
                                                                //    filters.push({ field: data.CascadeFilterColumnName, operator: "eq", value: scope.model[data.CascadeColumnName] });

                                                                GetDropdownValues(data.MagicDataSource.replace(/ds$/, ""), data.MagicDataSourceValueField, data.MagicDataSourceTextField, data.MagicDataSourceSchema || "", data.MagicDataSourceType_ID,
                                                                    { 
                                                                        logic: "and",
                                                                        filters: filters
                                                                    }
                                                                    , true, typeof scope._options.apiCallData === 'function' ? scope._options.apiCallData() : scope._options.apiCallData)
                                                                    .then(function (res) {
                                                                        var values = [];
                                                                        //add empty option to clear value if is not required
                                                                        if (!data.Schema_required && data.MagicTemplateDataRole.indexOf("multiselect") === -1)
                                                                            values.push({ value: "", name: "", description: "&nbsp;" });
                                                                        if (res) {
                                                                            var textField = res.length && data.MagicDataSourceTextField in res[0] ? data.MagicDataSourceTextField : "text",
                                                                                valueField = res.length && data.MagicDataSourceValueField in res[0] ? data.MagicDataSourceValueField : "value";
                                                                            $.each(res, function (k, v) {
                                                                                var value = schema.type == "number" ? parseInt(v[valueField]) : v[valueField];
                                                                                values.push({ value: value, name: v[textField] });
                                                                            });
                                                                        }
                                                                        if (values.length)
                                                                            values[0].ignorePropsFilter = true;
                                                                        lastValues = values;
                                                                        deferred.resolve({ data: values });
                                                                    });
                                                            }
                                                            return deferred.promise;
                                                        };
                                                    }

                                                    if (data.CascadeColumnName && !scope._options.readonly) {
                                                        $.each(scope.getCascadeColumnNames(data.CascadeColumnName), function (i, v) {
                                                            scope.$watch('model.' + v, function (newValue, oldValue) {
                                                                if (newValue != oldValue) {
                                                                    scope.model[data.ColumnName] = "";
                                                                    if (scope.$form && data.ColumnName in scope.$form)
                                                                        scope.$form[data.ColumnName].$setViewValue("");
                                                                    if (input.options.scope && input.options.scope.select_model && input.options.scope.select_model.selected)
                                                                        input.options.scope.select_model.selected = Array.isArray(input.options.scope.select_model.selected) ? [] : {};
                                                                    if (input.titleMap && input.titleMap.length)
                                                                        input.titleMap = [];
                                                                }
                                                            });
                                                        });

                                                    }
                                                //}
                                                //else {
                                                //    input.type = "text";
                                                //    schema.type = "string";
                                                //}
                                                foreignKeys.push({ data: data, input: input });
                                            }
                                            else if (data.MagicTemplateDataRole === "dropdownlist") {
                                                input.type = "select";

                                                if (data.CascadeColumnName && !scope._options.readonly) {
                                                    var cascadeColumnNames = scope.getCascadeColumnNames(data.CascadeColumnName),
                                                        areDependenciesReady = scope.areDependenciesReady(cascadeColumnNames);
                                                    input.readonly = !areDependenciesReady;
                                                    $.each(cascadeColumnNames, function (i, v) {
                                                        scope.$watch('model.' + v, function (newValue, oldValue) {
                                                            if (newValue)
                                                                input.readonly = !scope.areDependenciesReady(cascadeColumnNames);
                                                            if (newValue != oldValue) {
                                                                loadDropdownValues();
                                                                if (scope.$form && data.ColumnName in scope.$form)
                                                                    scope.$form[data.ColumnName].$setViewValue("");
                                                            }
                                                        });
                                                    });
                                                   
                                                }

                                                var loadDropdownValues = function () {
                                                    var requestKey = new Date().getTime() + "-" + Math.random().toString(36).substring(7);
                                                    scope.requestKeys[data.ColumnName] = requestKey;
                                                    var filter = (!scope._options.readonly && data.CascadeColumnName) ? { logic: "AND", filters: [] } : null;
                                                    if (filter)
                                                        $.each(scope.getCascadeColumnNames(data.CascadeColumnName), function (i, v) {
															if (scope.getCascadeColumnNames(data.CascadeFilterColumnName) && scope.getCascadeColumnNames(data.CascadeFilterColumnName).length > i && scope.model && scope.model[v])
                                                                filter.filters.push({ field: scope.getCascadeColumnNames(data.CascadeFilterColumnName)[i], operator: "eq", value: scope.model[v] });
                                                        });
                                                    if (filter && !filter.filters.length)
                                                        filter = null;
                                                //    var filter = !scope._options.readonly && data.CascadeColumnName && scope.model[data.CascadeColumnName] ? { logic: "AND", filters: [{ field: data.CascadeFilterColumnName, operator: "eq", value: scope.model[data.CascadeColumnName] }] } : null;
                                                    GetDropdownValues(data.MagicDataSource.replace(/ds$/, ""), data.MagicDataSourceValueField, data.MagicDataSourceTextField, data.MagicDataSourceSchema || "", data.MagicDataSourceType_ID, filter, true, typeof scope._options.apiCallData === 'function' ? scope._options.apiCallData() : scope._options.apiCallData)
                                                        .then(function (res) {
                                                            if (res && scope.requestKeys[data.ColumnName] == requestKey) {
                                                                input.titleMap = data.Schema_required ? [] : [{ value: "", name: " " }];
                                                                schema.enum = data.Schema_required ? [] : [""];
                                                                var textField = res.length && data.MagicDataSourceTextField in res[0] ? data.MagicDataSourceTextField : "text",
                                                                    valueField = res.length && data.MagicDataSourceValueField in res[0] ? data.MagicDataSourceValueField : "value";
                                                                $.each(res, function (k, v) {
                                                                    var value = schema.type == "number" ? parseInt(v[valueField]) : v[valueField];
                                                                    input.titleMap.push({ value: value, name: v[textField] });
                                                                    schema.enum.push(value);
                                                                });
                                                                $timeout(function () { });
                                                            }
                                                        });
                                                };
                                                //if field is not required and no value exists set empty value otherwise there are 2 "empty" options in select
                                                if (!data.Schema_required && !data.Schema_defaultvalue && !(data.ColumnName in scope.model))
                                                    scope.model[data.ColumnName] = "";
                                                loadDropdownValues();
                                            }
                                            else if (data.MagicTemplateDataRole === "detailgrid") {
                                                input.type = "grid";
												input.options = {
													gridName: data.SearchGridName,
													dataSource: data.MagicDataSource,
													cascadeColumn: data.CascadeColumnName,
													cascadeFilterColumn: data.CascadeFilterColumnName,
													events: scope.events,
													wizardSaveCallback: (data.MagicFormExtension && data.MagicFormExtension.schema && data.MagicFormExtension.schema.submitWizardOnSave) ? scope._options.outerSaveForDetailGrids : null
                                                };
                                                if (data.DetailonchangeFunctionName && typeof window[data.DetailonchangeFunctionName] == 'function') {
                                                    input.options.onChange = function (e) {
                                                        window[data.DetailonchangeFunctionName](e.items, scope._options.hideTabs ? scope.form : scope.form[0].items[0].tabs[0].items, scope, element, $timeout, data.ColumnName, e);
                                                    };
                                                }
                                            }
                                            else if (data.MagicTemplateDataRole === "business_object_selector") {
                                                scope.model[data.ColumnName] = scope.model[data.ColumnName] || [];
                                                if (!$.isArray(scope.model[data.ColumnName]))
                                                    scope.model[data.ColumnName] = [scope.model[data.ColumnName]];
                                                input.type = "boSelector";
                                                input.options = {
                                                    isReadonly: scope._options.readonly
                                                };
                                            }
                                            if (data.DetailonchangeFunctionName && typeof window[data.DetailonchangeFunctionName] == 'function') {
                                                if (data.MagicTemplateDataRole === "detailgrid") {
                                                    scope.model[data.ColumnName] = scope.model[data.ColumnName] || [];
                                                }
                                                scope.$watch('model.' + data.ColumnName, function (newValue, oldValue) {
                                                    if (newValue !== undefined) {
                                                        if (newValue != oldValue)
                                                            window[data.DetailonchangeFunctionName](newValue, scope._options.hideTabs ? scope.form : scope.form[0].items[0].tabs[0].items, scope, element, $timeout, data.ColumnName);
                                                        //first call (newValue == oldValue) set timeout to wait until form is created
                                                        else {
                                                            $timeout(function () {
                                                                window[data.DetailonchangeFunctionName](newValue, scope._options.hideTabs ? scope.form : scope.form[0].items[0].tabs[0].items, scope, element, $timeout, data.ColumnName);
                                                            });
                                                        }
                                                    }
                                                }, true);
                                            }
                                            if (data.MagicFormExtension) {
                                                if (data.MagicFormExtension.form) {
                                                    $.extend(true, input, deepEvalEscapedJSONFunctions(data.MagicFormExtension.form, scope));
                                                }
                                                if (data.MagicFormExtension.schema)
                                                    $.extend(true, schema, deepEvalEscapedJSONFunctions(data.MagicFormExtension.schema, scope));

                                                input.editFormClass = data.MagicFormExtension.bootstrapClass; //#formedit
                                                input.row = data.MagicFormExtension.row;
                                                input.x = data.MagicFormExtension.x;
                                                if (data.MagicFormExtension.isApplied && data.MagicFormExtension.isMagicFormLayout && data.MagicFormExtension.isApplied === true && data.MagicFormExtension.isMagicFormLayout === true) {
                                                    scope.hasEditFormLayout = true;

                                                    if (data.MagicTemplateDataRole
                                                        && data.MagicTemplateDataRole == "textarea"
                                                        && data.MagicFormExtension.numberOfRows) { //#formedit #numberOfTextareaRows                                                        
                                                        scope.textareaWithNumOfRowsProp.push({ columnName: data.ColumnName, numberOfRows: data.MagicFormExtension.numberOfRows });
                                                    }
                                                    
                                                    if (data.MagicFormExtension.hasCustomCSS) { //#labelCSS
                                                        scope.labelsWithCustomCSS.push({ columnName: data.ColumnName, fontSize: data.MagicFormExtension.fontSize || 14, fontWeight: data.MagicFormExtension.fontWeight || "", fontStyle: data.MagicFormExtension.fontStyle || "", fontVariantCaps: data.MagicFormExtension.fontVariantCaps || "", color: data.MagicFormExtension.color || "", backgroundColor: data.MagicFormExtension.backgroundColor || "", shadow: data.MagicFormExtension.shadow || "", textDecorationLine: data.MagicFormExtension.textDecorationLine || "none", textDecorationStyle: data.MagicFormExtension.textDecorationStyle || "solid", textDecorationColor: data.MagicFormExtension.textDecorationColor || "#000000"   });
                                                    }

                                                } else {
                                                    scope.hasEditFormLayout = false;
                                                }
                                            }
                                        })(input, schema, data[i]);
                                    }
                                    //handling sections, multiple items per row
                                    var sectionWidth = 0;
                                    if (scope._options && scope._options.itemsPerRow > 0) {
                                        if (scope._options.itemsPerRow > 12)
                                            scope._options.itemsPerRow = 12;
                                        sectionWidth = Math.floor(12 / scope._options.itemsPerRow);
                                    }
                                    $.each(tabs, function (k, v) {
                                        //handling subTabs
                                        if (v.hasSubTabs) {
                                            var subTabs = $filter("groupBy")(v.items, "TabGroupID");
                                            var index = scope.form[0].items[0].tabs.push({
                                                "type": "fieldset",
                                                "title": v.items[0].TabGroupLabel + (v.items[0].TabGroupColor ? ('<span class="color" style="display: none;">' + v.items[0].TabGroupColor) + '</span>' : ''),
                                                "items": [{
                                                    type: "tabs",
                                                    tabs: []
                                                }]
                                            }) - 1;
                                            $.each(subTabs, function (k, v) {
                                                v.title = v[0].TabLabel;
                                                v.pos = v[0].TabGroupOrdinalPosition || 0;
                                                v.items = divideTabItemsIntoSections(sectionWidth, { items: v });
                                                scope.form[0].items[0].tabs[index].items[0].tabs.push(v);
                                            });
                                            scope.form[0].items[0].tabs[index].items[0].tabs = $filter("orderBy")(scope.form[0].items[0].tabs[index].items[0].tabs, "+pos");
                                        }
                                        else {
                                            v.items = divideTabItemsIntoSections(sectionWidth, v);
                                            scope.form[0].items[0].tabs.push(v);
                                        }
                                    });
                                    if (scope._options && scope._options.hideTabs)
                                        scope.form = scope.form[0].items[0].tabs[0].items;
                                    else
                                        scope.form[0].items[0].tabs = $filter("orderBy")(scope.form[0].items[0].tabs, "+pos");
                                    resolveForeignKeys();
                                }
                                else {
                                    if (scope._options && scope._options.callback)
                                        scope._options.callback(null, scope);
                                }
                            })
                            .finally(function () {
                                scope.isFormLoading = false;
                                scope.showForm = false;
                                $.each(scope.schema.properties, function () {
                                    scope.showForm = true;
                                    return false;
                                });
                            });

                        //handling sections, multiple items per row
                        function divideTabItemsIntoSections(sectionWidth, v) {
                            if (scope.hasEditFormLayout && scope.hasEditFormLayout === true && !scope.options.isGridFilterForm) { //#formedit
                                return buildSectionsWithEditFormCss(v.items);
                            } else {
                                if (sectionWidth) {
                                    var sections = [];
                                    while (v.items.length) {
                                        var items = v.items.splice(0, scope._options.itemsPerRow);
                                        var section = {
                                            type: "section",
                                            htmlClass: "row",
                                            items: []
                                        };
                                        $.each(items, function (k, v) {
                                            if (v.options && v.options.hasDateToField) {	//handling case for Magic_GridFilters, duplicate date/datetime fields to select timerange
                                                var toField = JSON.parse(JSON.stringify(v));
                                                toField.key += "_toField";

                                                let dateField = {
                                                    type: "section",
                                                    htmlClass: "col-md-" + (sectionWidth/3),
                                                    items: [v]
                                                };
                                                let dateToField = {
                                                    type: "section",
                                                    htmlClass: toField.key + " toField col-md-" + 2*(sectionWidth / 3),
                                                    items: [v,toField]
                                                };
                                                 
                                                let row = {
                                                    type: "section",
                                                    htmlClass: "",
                                                    items: [dateField, dateToField]
                                                };

                                                section.items.push(row);
                                            }
                                            else {
                                                let formEl = {
                                                    type: "section",
                                                    htmlClass: "col-md-" + sectionWidth,
                                                    items: [v]
                                                };
                                                if (v.condition) {
                                                    formEl.condition = v.condition;
                                                    delete v.condition;
                                                }
                                                section.items.push(formEl);
                                            }
                                        });
                                        sections.push(section);
                                    }
                                    return sections;
                                }
                            }
                            return v;
                        }
                        function setupDefaultFormEditBootstrapClass(items) {
                            items.forEach(function (item, i) {

                                if (typeof item.row == 'undefined' || !item.editFormClass) {
                                    var maxRow = Math.max.apply(Math, items.map(function (o) { return o.row ? o.row : -1; }));
                                    if (isNaN(maxRow) || !maxRow) {
                                        maxRow = items[i - 1] ? (items[i - 1].row + 1) : 100;
                                    }
                                    item.editFormClass = "col-md-12 col-md-offset-0";
                                    item.row = maxRow + 1;
                                    item.x = 0;
                                }
                            });
                            return items;
                        }
                        function buildSectionsWithEditFormCss(items) { //#formedit
                            items = setupDefaultFormEditBootstrapClass(items);
                            var maxRowIdx = Math.max.apply(Math, items.map(function (o) { return o.row ? o.row : -1; }));
                            var stopLoop = false;
                            var sections = [];
                            var rowIdx = 0;
                            while (items.length > 0 && !stopLoop) {
                                var rowItems = items.filter(function (item) { return item.row == rowIdx });
                                
                                var section = {
                                    type: "section",
                                    htmlClass: "row",
                                    items: []
                                };
                                $.each(rowItems, function (i, rItem) {
                                    let formEl = {
                                        type: "section",
                                        htmlClass: rItem.editFormClass,
                                        items: [rItem]
                                    };
                                    if (rItem.condition) {
                                        formEl.condition = rItem.condition;
                                        delete rItem.condition;
                                    }

                                    section.items.push(formEl);             //push to section
                                    items.splice(items.indexOf(rItem), 1);  //splice pushed item                                     
                                });
                                sections.push(section);
                                rowIdx++;

                                if (rowItems.length == 0 && rowIdx > maxRowIdx) { //breaks while loop in order to avoid page_out_of_memory
                                    stopLoop = true;
                                }
                            }
                            return sections;
                        }
                    };
                }
            };
        }]);
});