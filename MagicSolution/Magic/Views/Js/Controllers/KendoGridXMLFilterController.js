define(['angular', 'angular-search-drop'], function (angular) {
    var app = angular
    .module('KendoGridXMLFilter', ['searchDrop'])
    .controller('KendoGridXMLFilterController', ['config', '$q', '$filter', '$scope', function (config, $q, $filter, $scope) {
        if (!config)
            throw "No config provided for KendoGridXMLFilter";

        var self = this;
        self.dropData = {};
        self.activeFilters = [];
        self.searchValuesTranslations = config.searchValues;
        self.duplicateDescription = {};
        self.foreignValues = {};
        var kendoGrid = config.kendoGrid;

        filterDetails = config.filterDetails;
        self.lang = {
            and: getObjectText("and"),
            or: getObjectText("or"),
            apply: getObjectText("Applyfilter"),
            eq: getObjectText("eq"),
            neq: getObjectText("neq"),
            contains: getObjectText("contains"),
            startswith: getObjectText("startswith"),
        };
        self.logicOptions = [
            { logic: "and", label: self.lang.and },
            { logic: "or", label: self.lang.or }
        ];
        self.operatorOptions = [
            { operator: "eq", label: self.lang.eq },
            { operator: "neq", label: self.lang.neq },
            { operator: "contains", label: self.lang.contains },
            { operator: "startswith", label: self.lang.startswith },
            //{ operator: "endswith", label: self.lang.neq },
            //{ operator: "doesnotcontains", label: self.lang.neq },
        ];

        self.addFilter = function (selectedKey) {
            if (selectedKey === "")
                return "";
            self.activeFilters.push({ field: selectedKey, logic: "and", value: self.getType({ type: filterDetails[selectedKey].type }) === "bool" ? false : "", operator: "eq", type: filterDetails[selectedKey].type });
            return "";
        };

        self.removeFilter = function (index) {
            self.activeFilters.splice(index, 1);
        };

        self.applyFilters = function () {
            var filter = kendoGrid.dataSource.filter();
            var xmlFilters = [];
            //remove all xml filters from this grid
            if (filter && filter.filters) {
                var i = 0;
                while (i < filter.filters.length) {
                    if (filter.filters[i].type && filter.filters[i].type == "xmlFilter")
                        filter.filters.splice(i, 1);
                    else
                        i++;
                }
                if (!filter.filters.length)
                    filter = null;
            }
            $.each(self.activeFilters, function (k, v) {
                if (v.value || v.value === false) {
                    var set = false;
                    var f;
                    if (self.searchValuesTranslations[v.field] in self.duplicateDescription) {
                        f = { logic: "or", filters: [] };
                        $.each(self.duplicateDescription[self.searchValuesTranslations[v.field]], function (kk, vv) {
                            f.filters.push({ field: vv, operator: v.operator, value: v.value });
                        });
                    }
                    else
                        f = { field: v.field, operator: v.operator, value: v.value };
                    $.each(xmlFilters, function (kk, vv) {
                        if (v.logic == vv.logic) {
                            xmlFilters[kk].filters.push(f);
                            set = true;
                        }
                    })
                    if(!set)
                        xmlFilters.push({
                            logic: v.logic, type: "xmlFilter",  filters: [
                                f
                            ]
                        });
                }
            });
            if (xmlFilters.length) {
                filter = combineDataSourceFilters(filter, { logic: "and", filters: xmlFilters });
                config.filterIcon.addClass("k-state-active");
            } else
                config.filterIcon.removeClass("k-state-active");
            kendoGrid.dataSource.filter(filter);
        };

        self.setInitialFilters = function () {
            var filter = kendoGrid.dataSource.filter();
            if (filter) {
                $.each(filter.filters, function (k, v) {
                    if (v.type && v.type == "xmlFilter") {
                        $.each(v.filters, function (kk, vv) {
                            if (vv.filters)
                                self.activeFilters.push({ field: vv.filters[0].field, logic: v.logic, value: vv.filters[0].value, operator: vv.filters[0].operator, type: filterDetails[vv.filters[0].field].type });
                            else
                                self.activeFilters.push({ field: vv.field, logic: v.logic, value: vv.value, operator: vv.operator, type: filterDetails[vv.field].type });
                        });
                    }
                });
                if (self.activeFilters.length)
                    config.filterIcon.addClass("k-state-active");
            }
        };

        self.getType = function (filter) {
            if (!filter.field || !kendoGrid.dataSource.options.schema.model.fields[filter.field].dataSourceInfo) {
                switch (filter.type) {
                    //case "multiselect":
                    //case "dropdownlist":
                    //case "autocomplete":
                    //case "searchgrid":
                    case "bool":
                    case "bit":
                    case "boolean":
                        return "bool";
                    default:
                        return "string";
                }
            }
            if (!(filter.field in self.foreignValues)) {
                self.setForeignValues(filter);
            }
            return "drop";
        };

        self.setForeignValues = function (filter) {
            self.foreignValues[filter.field] = [];
            var dataSourceInfo = kendoGrid.dataSource.options.schema.model.fields[filter.field].dataSourceInfo;
            GetDropdownValues(dataSourceInfo.dataSource, dataSourceInfo.dsValueField, dataSourceInfo.dsTextField, dataSourceInfo.dsSchema, dataSourceInfo.dsTypeId, null, true)
                .success(function (res) {
                    self.foreignValues[filter.field] = res ? $filter("orderBy")(res, "+text") : [];
                    $scope.$apply();
                });
        }

        self.getOperators = function (filter) {
            var type = self.getType(filter);
            if (type == "string")
                return self.operatorOptions;
            else
                return self.operatorOptions.slice(0, 2);
        };

        self.dropValueSelected = function (key, index) {
            if (key !== "")
                self.activeFilters[index].value = key;
        };

        (function () {
            var duplicates = {};
            self.searchValues = $filter("orderBy")($.map(config.searchValues, function (v, k) {
                if (v in duplicates) {
                    if(v in self.duplicateDescription)
                        self.duplicateDescription[v].push(k);
                    else
                        self.duplicateDescription[v] = [k, duplicates[v]];
                }
                else {
                    duplicates[v] = k;
                    return { value: k, label: v };
                }
            }), "+label");
            self.setInitialFilters();
        })();
    }]);

    return app;
});