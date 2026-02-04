define(['angular'], function (angular) {

    return angular
        .module('GridAggregation', [])
        .controller('GridAggregationController', ['config', '$filter', function (config, $filter) {
            
            var $el = config.$el,
                self = this,
                kendoGrid = $el.closest(".k-grid").data("kendoGrid"),
                aggregations,
                groups,
                gridObject = $.extend(true, getDefaultGridSettings(), {
                    toolbar: null,
                    groupable: false,
                    pageable: {
                        pageSize: 25
                    }
                });
            self.columns = {};
            self.aggregation = {};
            kendoGrid.columns
                .map(function (column) {
                    if (column.field)
                        self.columns[column.field] = column;
                });

            var dataSource = $.extend({}, kendoGrid.dataSource.options);
            delete dataSource.fields;
            delete dataSource.schema.model;
            dataSource.schema.parse = function (response) {
                if (response.Data && response.Data.length) {
                    return { Data: response.Data[0].Table, Errors: response.Errors, Count: response.Count };
                }
                return response;
            };
            var pM = dataSource.transport.parameterMap;
            dataSource.transport.parameterMap = function (options, action) {
                var data = pM(options, action);
                if (data && typeof data !== "string") {
                    data.groupBy = groups;
                    data.aggregations = aggregations;
                    return data;
                }
                else {
                    options.groupBy = groups;
                    options.aggregations = aggregations;
                    return JSON.stringify(options);
                }
                //TODO: else throw error kendoConsole
            };

            self.aggregateGrid = function () {
                recreateGrid = true;
                var sortedGroups = [],
                    columns = [];
                aggregations = [];
                groups = [];
                $.each(self.aggregation, function (k, v) {
                    var index = aggregations.push({ column: k, functions: [] }) - 1;
                    if (v.GROUPBY && v.GROUPBY.field)
                        groups.push({ column: k, pos: isNaN(v.GROUPBY.pos) ? 0 : v.GROUPBY.pos });
                    $.each(v, function (_k, v) {

                        if (v && _k != "GROUPBY") {
                            aggregations[index].functions.push(_k);

                            columns.push({
                                title: self.columns[k].title + " " + _k,
                                field: k + "_" + _k,
                                footerTemplate: function () {
                                    var value = 0,
                                        values = $.map($("#aggregation-grid").data("kendoGrid").dataSource.data(), function (v) {
                                            return v[k + "_" + _k];
                                        }); 

                                    switch (_k) {
                                        case "MIN":
                                            value = Math.min.apply(null, values);
                                            break;
                                        case "MAX":
                                            value = Math.max.apply(null, values);
                                            break;
                                        case "COUNT":
                                            value = values.reduce((a, b) => a + b, 0);
                                            break;
                                        case "SUM":
                                            value = values.reduce((a, b) => a + b, 0);
                                            break;
                                        case "AVG":
                                            value = values.reduce((a, b) => a + b, 0) / values.length;
                                            break;
                                    }
                                    return "Total " + _k + ": " + value;
                                },
                                pos: 1000,
                                lockable: false
                            });
                        } else if(v.field) {
                            columns.push($.extend({}, self.columns[k], {
                                width: null,
                                pos: v.pos || 0,
                                footerTemplate: "",
                                lockable: false
                        }));
                        }
                    });
                    if (aggregations[index].functions.length === 0)
                        aggregations.splice(index, 1);
                });
                sortedGroups = $filter("orderBy")(groups, "+pos");
                groups = sortedGroups.map(function (group) {
                    return group.column;
                });
                if (aggregations.length || groups.length) {
                    self.show = false;
                    gridObject.columns = $filter("orderBy")(columns, "+pos");
                    gridObject.dataSource = $.extend({}, dataSource);
                    $("#aggregation-grid")
                        .empty()
                        .kendoGrid(gridObject);
                }
            };

        }]);
});