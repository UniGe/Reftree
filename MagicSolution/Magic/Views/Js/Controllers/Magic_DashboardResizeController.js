define(["angular", "MagicSDK", "angular-kendo", "angular-filter"], function (angular) {
    return angular
            .module("DashboardResize", ["kendo.directives", "angular.filter"])
            .controller("DashboardResizeController", ["$scope", "$http", "$filter","config", function ($scope, $http, $filter,config) {
                var self = this,
                    bootstrapBreakpoints = ["xs", "sm", "md"],
                    bootstrapColumns = {
                        2: "1/6",
                        3: "1/4",
                        4: "1/3",
                        6: "1/2",
                        8: "2/3",
                        9: "3/4",
                        12: "Full Width"
                    },
                regex = /col-(xs|sm|md)-(2|3|4|6|8|9|12)/g;
                self.initSelections = function (btstrpclass) {
                    self.selections = ["", "", ""];
                        $.each(btstrpclass.split(' '), function (i, v) {
                            while (m = regex.exec(v)) {
                                self.selections[bootstrapBreakpoints.indexOf(m[1])] = m[0];
                            }
                        });
                };
                //init selections looking at current class... 
                self.selections = [];
                self.initSelections(config.currentclass);
                self.dropdownData = {
                    dataTextField: "label",
                    dataValueField: "value"
                };

                self.bootstrapClasses = {};
                $.each(bootstrapBreakpoints, function (k, bp) {
                    self.bootstrapClasses[bp] = bp != "md" ? [{
                        value: "",
                        label: "N/A"
                    }] : [];

                    $.each(bootstrapColumns, function (k, v) {
                        self.bootstrapClasses[bp].push({
                            value: "col-" + bp + "-" + k,
                            label: v
                        });
                    });
                });
            }]);
});