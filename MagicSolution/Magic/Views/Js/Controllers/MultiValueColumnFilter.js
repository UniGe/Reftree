define(['angular', 'angular-kendo'], function (angular) {
    var app = angular
    .module('MultiValueColumnFilter', ["kendo.directives"])
    .controller('MultiValueColumnFilterController', ['config', '$scope', function (config, $scope) {
        kendo.culture(window.culture);
        var i = 0,
            filterType = "multiValueFilter",
            self = this,
            defaultFilter = {},
            filters = getFiltersByType(config.dataSource.filter(), filterType);

        self.filters = [];
        config.filterColumns = {};
        config.logics = [{
            text: config.messages.and,
            value: "and"
        }, {
            text: config.messages.or,
            value: "or"
        }];

        $.each(config.operators, function (k, v) {
            config.operators[k] = $.map(v, function (v, k) { return { text: v, value: k }; });
        });

        $.each(config.columnFields, function (k, v) {
            var field = config.dataSource.options.schema.model.fields[k];
            config.filterColumns[k] = {
                role: field.dataRole,
                operators: config.operators[field.type],
                text: v
            };
            $.each(config.dataSource.options.fields, function (_k, _field) {
                if (_field.field == k) {
                    if (_field.values) {
                        config.filterColumns[k].values = _field.values;
                        config.filterColumns[k].values.unshift({
                            text: config.messages.selectValue,
                            value: ""
                        });
                        config.filterColumns[k].operators = config.operators["enums"];
                    }
                    return false;
                }
            });
            if (i == 0) {
                if (config.filterColumns[k].role == "checkbox") {
                    defaultFilter = {
                        field: k,
                        operator: "eq",
                        values: "",
                        logic: "and"
                    }
                } else {
                    defaultFilter = {
                        field: k,
                        operator: config.filterColumns[k].operators[0].value,
                        values: config.filterColumns[k].values ? config.filterColumns[k].values : "",
                        logic: "and"
                    }
                }
            }
            i++;
        });

        if (filters && filters.filters && filters.filters.length) {
            $.each(filters.filters, function (k, f) {
                if (f.filters) {
                    $.each(f.filters, function (_k, _f) {
                        if (_f.field in config.filterColumns) {
                            self.filters.push({
                                field: _f.field,
                                value: _f.value == " " && (_f.operator == "isnull" || _f.operator == "isnotnull") ? "" : _f.value,
                                operator: _f.operator,
                                logic: _k == filters.filters.length ? "and" : f.logic
                            });
                        }
                    });
                } else if (f.field in config.filterColumns) {
                    self.filters.push({
                        field: f.field,
                        value: f.value,
                        operator: f.operator,
                        logic: filters.logic
                    });
                }
            });
        } else if (filters && filters.field && filters.field in config.filterColumns) {
            self.filters.push({
                field: filters.field,
                value: filters.value,
                operator: filters.operator,
                logic: filters.logic || "and"
            });
        } else {
            self.filters.push($.extend({}, defaultFilter));
        }

        $.each(self.filters, function (k, f) {
            if (config.filterColumns[f.field].role.match('^date(time)?picker$')) {
                self.filters[k].formatedValue = kendo.toString(new Date(f.value), kendo.culture().calendar.patterns[config.filterColumns[f.field] == "datepicker" ? "d" : "g"]);
                self.filters[k].value = new Date(f.value);
            }
        });

        config.columnFields = $.map(config.columnFields, function (v, k) { return { text: v, value: k }; });
        self.options = config;

        function getValue(filter){
            return !filter.value && (filter.operator == "isnull" || filter.operator == "isnotnull") ? " " : filter.value;
        }

        self.submitFilters = function () {
            var orFilters = [];
            var filters = {
                filters: [],
                type: filterType,
                logic: "and"
            }
            for (var i = 0; i < self.filters.length; i++) {
                if (self.filters[i].value || (self.filters[i].operator == "isnull" || self.filters[i].operator == "isnotnull")) {
                    if (self.filters[i].logic == "or" && self.filters[i + 1]) {
                        orFilters.push({
                            field: self.filters[i].field,
                            operator: self.filters[i].operator,
                            value: getValue(self.filters[i])
                        });
                        do {
                            i++;
                            orFilters.push({
                                field: self.filters[i].field,
                                operator: self.filters[i].operator,
                                value: getValue(self.filters[i])
                            });
                        } while (self.filters[i + 1] && self.filters[i].logic == "or")
                        filters.filters.push({
                            filters: orFilters,
                            type: filterType,
                            logic: "or"
                        });
                        orFilters = [];
                        continue;
                    } else {
                        filters.filters.push({
                            field: self.filters[i].field,
                            operator: self.filters[i].operator,
                            value: getValue(self.filters[i]),
                            type: filterType
                        });
                    }
                }
            }
            if (filters.filters.length == 1){
                if (filters.filters[0].filters && filters.filters[0].filters.length == 1)
                    config.dataSource.filter(combineDataSourceFilters(config.dataSource.filter(), filters.filters[0].filters[0]));
                else
                    config.dataSource.filter(combineDataSourceFilters(config.dataSource.filter(), filters.filters[0]));
            }
            else if (filters.filters.length)
                config.dataSource.filter(combineDataSourceFilters(config.dataSource.filter(), filters));
            else
                config.dataSource.filter(removeFiltersByType(config.dataSource.filter(), filterType));
        };

        self.resetFilters = function (e) {
            self.filters = [$.extend({}, defaultFilter)];
            config.dataSource.filter(removeFiltersByType(config.dataSource.filter(), filterType));
        };

        self.addFilterRow = function () {
            self.filters.push($.extend({}, defaultFilter));
        };
    }]);
    return app;
});