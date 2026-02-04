define(["angular", "angular-filter", "angular-magic-form"], function (angular) {
    return angular
        .module("GridFilters", ["angular.filter", "magicForm"])
        .controller("GridFiltersController",
                ['config', '$scope', '$timeout',
                    function (config, $scope, $timeout) {
                        getAngularControllerRootHTMLElement("GridFilters");

                        $scope.globalOperator = "and";

                        var grid = config.$grid.data("kendoGrid"),
                            gridName = config.$grid.attr('gridname');

                        $scope.valuesModel = {};
                        $scope.gridName = gridName;
						$scope.operators = grid.options.filterable.operators;
                        $scope.fieldsToTitle = {};
                        $scope.multiSelectOps = {
                            all: getObjectText('all'),
                            atleastone: getObjectText('atleastone'),
                            contains: getObjectText('contains'),
                            isnull: getObjectText('isnull'),
                            isnotnull: getObjectText('isnotnull'),
                        };

                        function initWithMFDefinition(rows) {
                            $.each(rows, function (i, row) {

                                    $.each(row.items, function (i, sectionItem) {
                                        var item = sectionItem.items[0];
                                        if (item) {

                                            if (!item.key && item.type == 'section') {
                                                item = item.items[0];
                                            }

                                            var type = "";

                                            if (item && item.schema && item.schema.type && typeof item.schema.type == "object") {
                                                type = item.schema.type[0];
                                            }
                                            if (item && item.schema && item.schema.type && typeof item.schema.type == "string") {
                                                type = item.schema.type;
                                            }
                                            

                                            if (type == 'boolean') {
                                                type = 'enums';
                                            }

                                            if (type == 'object') {
                                                type = 'string';
                                            }

                                            var ops = $scope.operators[type];
                                            var noTitle = false;
                                            if (item && item.options && item.options.hasDateToField) {
                                                noTitle = true;
                                                ops = $scope.operators["date"]; //provided type for date-fields is also 'string', caused wrong operators https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/147
                                                ops = Object.assign({ range: getObjectText("datetimerange") }, ops);
                                            }
                                                                                        
                                            if (item && item.type && item.type == 'uiselectmultiple') { //use multiselect operators
                                                ops = $scope.multiSelectOps;
                                            }
											if(!item) {return}
											
                                            var key = item.key[0];
                                            var title = "";
                                            if (item.schema && item.schema.title) {
                                                title = item.schema.title;
                                            } else if (item.title) {
                                                title = item.title;
                                            }
                                            else {
                                                title = key || "";
                                            }

											$scope.fieldsToTitle[key] = title;

                                            var selectHtml = getOperatorsSelectHTML(title, key, ops, noTitle)
                                            var $label;

                                            if (item.options && item.options.hasDateToField) {  //date field handling
                                                $origLabel = $("label:contains('" + title + "')");
                                                // $label = $origLabel.closest('.row').find('.toField.' + key + '_toField').find('label');
                                                // $label = $origLabel.closest('.row').find('.schema-form-section').find('label');
                                                console.log("RorigLabel", $origLabel)
                                                
                                                selectHtml = '' + selectHtml;
                                                $origLabel.css("min-height", "30px");
                                                $origLabel.first().siblings('.row').remove()
                                                $origLabel.first().css('width', '100%').append(selectHtml);

                                                if($origLabel.length > 1) { //clear label of to-field
                                                    $($origLabel[1]).html('').hide();
                                                }

                                                if($origLabel.length > 2) { //clear label of to-field
                                                    $($origLabel[2]).html('').hide();
                                                }

                                                var select = $('#' + key + '_operator');
                                                select.on('change', onDateOperatorChanged);
                                            } 
                                            else if (type == 'enums') { //bool -> checkbox selector
                                                var $span = $('span:contains(' + title + ')');
                                                var checkboxOperators = $scope.operators[type];
                                                 //additional operator for booleans, added at [0] to default 'eqneq'
                                                checkboxOperators = Object.assign({ eqneq: getObjectText("eqneq") }, checkboxOperators);
                                                selectHtml = getOperatorsSelectHTML(title, key, checkboxOperators, true)
                                                $label = $span;
                                                $('input[name="' + key + '"]').parent().css('width', '100%').append(selectHtml); 
                                            }
                                            else {                            //all other types
                                                var $input = $('[name ="' + key + '"]');

                                                if (!$input || !$input.length) {
                                                    $label = $('label[name*="' + key + '"]');
                                                }

                                                if ($input) {
                                                    $label = $input.siblings("label");
                                                }  


                                                if (!$label || !$label.length) {
                                                    if (title.contains(" ")) {
                                                        $label = $("label:contains('" + title + "')");
                                                    } else {
                                                        $label = $('label[for=' + title + ']');
                                                    }
                                                }

                                                if (!$label || !$label.length) {
                                                    $label = $("label:contains('" + title + "')");
                                                }

                                                if (!$label || !$label.length) {
                                                    console.log("Label not found", item);
                                                    return;
                                                }

                                                $label.html(selectHtml);
                                                $("#" + key + "_operator").on('change', onOperatorChanged);
                                            }

                                            if($label)                                            
                                                $label.css("min-height", "30px");                                           
                                        }
                                    });

                            });
                        }

                        function onOperatorChanged(e) {
                            let key = $(this)[0].id.replace('_operator', '');
                            let inputField = $('[name=' + key + ']');

                            if ($(this).val() == 'isnull' || $(this).val() == 'isnotnull') {
                                inputField.attr("disabled", true);
                            } else {
                                inputField.attr("disabled", false);
                            }

                            if (inputField.val()) {
                                $scope.valuesModel[key] = inputField.val();
                            }
                            $scope.$broadcast('schemaFormValidate');
                        }

                        function onDateOperatorChanged(e) { //disable _toField if value is not "range"

                            if ($(this).val() == 'range') {
                                $(this).closest('.form-group').find('.form-control-date').find('input').attr("disabled", false);
                                $(this).closest('.form-group').find('.form-control-time').find('input').attr("disabled", false);
                            } else {
                                $(this).closest('.form-group').find('.form-control-date').find('input').attr("disabled", true);
                                $(this).closest('.form-group').find('.form-control-time').find('input').attr("disabled", true);
                            }

                        }

                        function getOperatorsSelectHTML(fieldName, key,operators, noTitle = false) {
                            initialSelectValues[key] = Object.keys(operators)[0];

                            var selectHtml = ""
                            if (noTitle) {
                                selectHtml = '<select id="' + key + '_operator" class="pull-right">';
                            } else {
                                selectHtml = fieldName + '<select id="' + key + '_operator" class="pull-right">';
                            }

                            $.each(operators, function (value, name) {
                                selectHtml += '<option value="' + value + '">' + name + '</option>'
                            });

                            selectHtml += '</select>'
                            return selectHtml;
                        }

                        function resetFilters() {
                            $('#grid-filters').find(":disabled").attr("disabled", false);
                            $('.ui-select-match-item').remove(); //could be removed, makes it more bulletproof
                            config.$grid.attr("globalFiltersLabels", "");
                            clearModel();
                            $scope.showMagicForm = false;
                            $timeout(function () {
                                $scope.showMagicForm = true;
                            }, 1);
                            resetSelects();
                        }

                        var initialSelectValues = {};
                        function resetSelects() {
                            $.each(initialSelectValues, function (fieldName,value) {
                                $('#' + fieldName + '_operator').val(value);
                            });
                            $('#grid-filters').find('.ui-select-match-item').remove(); //remove multiselect-matches
                        }

                        function setGlobalOperator(e) {
                            $scope.globalOperator = e.target.id;
                        }                        

                        function filterGrid() {
                            var filters = [];
                            var badgesToAdd = [];
                            var eqneqFilters = [];
                            config.$grid.attr("globalFiltersLabels", "");

                            $.each($scope.valuesModel, function (field, value) {
                                var operator = $('#' + field + '_operator');
                                if (operator) {                                   

                                    if (operator.val() == "range") {
                                        var dateRangeFilters = [];
                                        var date1 = value;
                                        var date2 = $scope.valuesModel[field + "_toField"];
                                        var startDate, endDate;

                                        if (!date1 || !date2) {
                                            return;
                                        }

                                        if (date1.length == 0 || date2.length == 0) {
                                            kendoConsole.log(getObjectText("datetimerangeunspecified"));
                                            return;
                                        }

                                        if (date1 < date2) {
                                            startDate = date1;
                                            endDate = date2;
                                        } else if (date1 > date2) {
                                            startDate = date2;
                                            endDate = date1;
                                        }

                                        dateRangeFilters.push({ field: field, operator: "gte", value: startDate });
                                        dateRangeFilters.push({ field: field, operator: "lte", value: endDate });
                                        filters.push({
                                            logic: "and",
                                            filters: dateRangeFilters
                                        });
                                        delete $scope.valuesModel[field + "_toField"];
                                        return;
                                    }

                                    if (typeof value == "boolean" && operator.val() == "eqneq") {    //handle both condition for booleans (true|false)
                                        var boolOrFilters = [];
                                        boolOrFilters.push({ field: field, operator: "eq", value: true }); //equal
                                        boolOrFilters.push({ field: field, operator: "eq", value: false }); //not equal
                                        eqneqFilters.push(field);
                                        eqneqFilters.push($scope.fieldsToTitle[field]);
                                        //filters.push({
                                        //    logic: "or",
                                        //    filters: boolOrFilters
                                        //});
                                        return;
                                    }

                                    if (typeof value == "string" && value.includes('|')) { //handle or conditions for strings |
                                        var splitted = value.split('|');
                                        var stringOrFilters = [];
                                        
                                        splitted.forEach(function (val) {
                                            val = val.trim();
                                            stringOrFilters.push({ field: field, operator: operator.val(), value: val });
                                        });
                                        if (stringOrFilters.length > 0) {
                                            filters.push({
                                                logic: "or",
                                                filters: stringOrFilters
                                            });
                                        }
                                        return;
                                    }

                                    if (Array.isArray(value)) {     //multiselect field
                                        var multiSelectFilters = [];
                                        var op = operator.val();
                                        var logic = "or";

                                        if (operator.val() == 'all') {
                                            logic = "and";
                                            op = "eq";
                                        }

                                        if (operator.val() == 'atleastone') {
                                            logic = "or";
                                            op = "eq";
                                        }

                                        value.forEach(function (val) {
                                            multiSelectFilters.push({ field: field, operator: op, value: val });
                                        });

                                        if (multiSelectFilters.length > 0) {
                                            filters.push({
                                                logic: logic,
                                                filters: multiSelectFilters
                                            });
                                        }
                                        return;
                                    }
                                    if (typeof value == "number") {

                                        filters.push({ field: field, operator: operator.val(), value: value });                                        
                                    }

                                    if ((operator.val() != 'isnull' && operator.val() != 'isnotnull') &&
                                        (typeof value == "object" ||
                                        typeof value == "boolean" ||
                                            (value && value.length > 0 && value != 'isnull' && value != 'isnotnull' && !value.startsWith("[") && !value.startsWith("{"))
                                        )
                                    ) { //TODO: implement JSON handling                                        
                                        filters.push({ field: field, operator: operator.val(), value: value });                                        
                                    }

                                    if (operator.val() == 'isnull' || operator.val() == 'isnotnull') {
                                        filters.push({ field: field, operator: operator.val() });
                                    }

                                    if (filters.find(x => x.field == field)) {
                                        badgesToAdd.push($scope.fieldsToTitle[field]);
                                    }
                                }
                            });

                            var currentFilter = grid.dataSource.filter();
                            var clearedFilter = removeFiltersByType(currentFilter, ["searchBar", "user", "pivot", "zoom", undefined]); //user filters
                                                        
                            var kendoFilter = {
                                logic: $scope.globalOperator,
                                filters: filters
                            }
                            var combinedFilter = combineDataSourceFilters(clearedFilter, kendoFilter);


                            //check if there are NOT ONLY EQNEQ-FILTERS
                            //var notOnlyEqneqFilters = false;
                            //combinedFilter.filters.forEach(function (f) {
                            //    if (f.filters) {
                            //        f.filters.forEach(function (filter) {
                            //            if (!eqneqFilters.includes(filter.field)) {
                            //                notOnlyEqneqFilters = true;
                            //            }
                            //        });
                            //    }

                            //    if (f.field) {
                            //        if (!eqneqFilters.includes(f.field)) {
                            //            notOnlyEqneqFilters = true;
                            //        }
                            //    }

                            //});

                            //if (!notOnlyEqneqFilters) {   //don't apply                            
                            //}

                            //if (notOnlyEqneqFilters) {    //apply
                            //    grid.dataSource.filter(combinedFilter);
                            //    grid.dataSource.read();
                            //}

                            grid.dataSource.filter(combinedFilter);
                            grid.dataSource.read();
                            config.$grid.attr("globalFiltersLabels", JSON.stringify(badgesToAdd));
                            config.$grid.attr("eqneqFilters", JSON.stringify(eqneqFilters));
                            $("#filtersModalContainer").modal('hide');
                        }

                        function clearModel() {
                            var modelKeys = Object.keys($scope.valuesModel);
                            modelKeys.forEach(function (key) {
                                if (Array.isArray($scope.valuesModel[key])) {
                                    $scope.valuesModel[key] = [];
                                }
                                if (typeof $scope.valuesModel[key] == "string" || typeof $scope.valuesModel[key] == "number") {
                                    $scope.valuesModel[key] = "";
                                }
                                                                
                                $('[name=' + key + ']').val('');
                                $('.form-control-feedback').remove();
                                $('.ng-dirty').removeClass('ng-valid-parse').removeClass('ng-dirty').removeClass('ng-touched');
                                $('.has-success').removeClass('has-success')                                
                            });;
                        }

                        (function initModalHTML() {
                            var operatorsHTML = '<span>'+ getObjectText('operator').toUpperCase() +': </span>\
                                            <div id="globalOperator" style="margin-right:100px" class="btn-group btn-group-toggle" data-toggle="buttons">\
                                                <label class="btn btn-warning active" >\
                                                    <input type="radio" name="options" id="and" autocomplete="off" checked>AND ^ \
                                                </label>\
                                                <label class="btn btn-warning">\
                                                    <input type="radio" name="options" id="or" autocomplete="off">OR | \
                                                </label>\
                                            </div>';

                            $globalOperatorBtn = $(operatorsHTML);
                            var resetBtnHTML = '<button id="resetFilters" type="button" class="btn btn-danger">Reset</button>';
                            $resetBtn = $()


                            var saveBtnHTML = '<a id="executefiltergrid" href="javascript:void(0)" type="button" class="btn btn-primary" aria-label="save">' + getObjectText('Applyfilter') + '</a>';

                            var footerHTML = operatorsHTML + resetBtnHTML + saveBtnHTML;
                            $('#contentofFiltersmodal').siblings('.modal-footer').html(footerHTML);

                            $('#contentofFiltersmodal').css("max-height", "710px");
                            $('#contentofFiltersmodal').css('overflow-y', "scroll")
                            $("#filtersModalContainer").addClass("modal-wide");
                            var setupFilters = getObjectText("setInitialFilter")
                            $('#contentofFiltersmodal').siblings('.modal-header').children('.modal-title').text(setupFilters)
                            $('#executefiltergrid').text(getObjectText("Applyfilter"));

                            $('#executefiltergrid').click(filterGrid);
                            $('#resetFilters').click(resetFilters);
                            $('input[type=radio]').on('change',setGlobalOperator);

                        })()


                        $scope.magicFormRendered = function (element, tabDefinition, f) {
                            console.log("INit", element, tabDefinition, f);
                            clearModel();
                            initWithMFDefinition(f);
                            if (config.callback) {
                                config.callback(f);
                            }
                        }
                        $scope.showMagicForm = true;
                    }
                ])
});