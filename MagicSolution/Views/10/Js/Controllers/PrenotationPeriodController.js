loadCss([
    "select"
]);
define(["angular", window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Directives/Kiba.js", "MagicSDK", "angular-filter", "angular-sanitize", "angular-strap-tpl", "angular-magic-form", "angular-ui-select"], function (angular, kiba, magic) {
    angular
        .module("PrenotationPeriod", ["Kiba", "angular.filter", "ngSanitize", "mgcrea.ngStrap", "magicForm"])
        .controller("PrenotationPeriodController", [
            "$http",
            "$scope",
            "$sce",
            "$filter",
            "$timeout",
            function ($http, $scope, $sce, $filter, $timeout) {
                var self = this;
                self = kiba(self, $http, $scope, $sce, $filter, $timeout);

                self.lang.prenotationData = getObjectText("prenotationData");
                self.lang.dayFrom = getObjectText("from");
                self.lang.dayTo = getObjectText("t");
                self.lang.interval = getObjectText("interval");

                self.searchPeriod = {};
                self.checkedPeriods = {};
            
                //var baseAdd = self.add;
                //self.add = function (type, data) {
                //    if (self.checkInData[type].length)
                //        self.checkInData[type] = [];
                //    baseAdd(type, data);
                //};

                self.searchTimetable = function () {
                    var where = [];
                    if(self.selectedVenues && self.selectedVenues.length)
                        where.push("ANASED_ID IN (" + self.selectedVenues.join(",") + ")");
                    if(self.searchPeriod.from){
                        where.push("SEDCAL_DATA_INIZIO >= '" + self.searchPeriod.from + "'");
                    }
                    if(self.searchPeriod.to){
                        where.push("SEDCAL_DATA_FINE <= '" + self.searchPeriod.to + "'");
                    }
                    where.push("PROGET_ID = " + self.checkInData.project);
                    magic
                        .api.get({
                            table: "dbo.V_SEDCAL_CAP_RESIDUA",
                            where: where.length ? where.join(" AND ") : "1=1",
                            order: "SEDCAL_PROSED_ID, SEDCAL_DATA_INIZIO",
                            $scope: $scope
                        })
                        .then(function (res) {
                            self.timetable = res;
                        });
                };

                self.isDataComplete = function () {
                    if (!self.checkInData || !self.checkInData.children || !self.checkInData.children.length || !self.checkInData.responsible || !self.checkInData.responsible.length)
                        return false;
                    self.periods = $.map(self.checkedPeriods, function (v, k) {
                        if (v)
                            return k;
                    });
                    if (!self.periods.length)
                        return false;
                    return true;
                };

                self.getHighlightColor = function (capacity) {
                    return {
                        "row-danger": capacity < 0,
                        "row-warning": capacity == 0,
                    };
                };

                self.savePrenotation = function () {
                    if (!self.isDataComplete()) {
                        return;
                    }
                    var data = {
                        children: $.map(self.checkInData.children, function (v) { return v.ANAGRA_ID }).join(","),
                        responsible: $.map(self.checkInData.responsible, function (v) { return v.ANAGRA_ID }).join(","),
                        SEDCAL_IDS: self.periods.join(",")
                    };
                    magic
                        .api
                        .set({
                            procedure: "dbo.USP_PRENOT_PERIOD",
                            data: data,
                            $scope: $scope,
                            contentType: "XML"
                        })
                        .then(function (res) {
                            self.searchTimetable();
                            self.success("success");
                        }, function () {
                            self.success("error", "danger");
                        });
                };

                self.init();
            }
        ]);
});