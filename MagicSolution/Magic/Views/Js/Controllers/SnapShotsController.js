define(['angular', 'angular-kendo'], function (angular) {
    return angular
    .module('SnapShots', ['kendo.directives'])
    .controller('SnapShotsController', ['$http', '$scope', 'config', '$timeout','$filter', function ($http, $scope, config, $timeout,$filter) {
        var self = this;
        self.dateFrom = function () {
            var date = new Date();
            date.setDate(date.getDate() - 7);
            return date;
        };
        self.dateTo = function () {
            var date = new Date();
            return date;
        };

        self.mDateFrom = self.dateFrom();
        self.mDateTo = self.dateTo();
        self.midnight = function (date) {
            date.setHours(0, 0, 0, 0);
            return toTimeZoneLessString(date);
        };
        self.endofday = function (date) {
            date.setHours(23, 59, 59, 0);
            return toTimeZoneLessString(date);
        }
        self.translate = function (text) {
            return getObjectText(text);
        }
        self.checkBool = function (datavalue) {
            return typeof datavalue == "boolean" ? true : false;
        }
        $scope.initSnapShots = function () {
            self.spin = true;
            $http.post("/api/GENERICSQLCOMMAND/SelectFromXMLStoredProcedure", {
                EntityName: 'dbo.Magic_GridDataSnapShot',
                DataSourceCustomParam: JSON.stringify({ read: { Type: "StoredProcedure", Definition: 'dbo.Magic_GetGridDataSnapShot' } }),
                data: JSON.stringify($.extend(config, { dateFrom: self.midnight(self.mDateFrom), dateTo: self.endofday(self.mDateTo) }))
            }).then(function (res) {
                self.spin = false;
                if (res.data.Errors != null)
                {
                    kendoConsole.log(res.Data.Errors, true);
                    return;
                }
                self.tableObj = {};
                self.headerObj = [];
                if (!res.data.Data.length)
                    return;
              
                self.snapshots = res.data.Data[0].Table;
                self.headerObj.push(self.translate("fieldname"));
                //dates 
                var datesToFill = [];
                $.each(self.snapshots, function (i, v) {
                    datesToFill.push(v.SnapShotDate);
                });

                $.each(self.snapshots, function (i, v) {
                    self.headerObj.push(v.SnapShotDate);
                    var snap = JSON.parse(v.SnapShot);
                    var j = 0;
                    $.each(snap, function (key, value) {
                        if (!self.tableObj[key])
                            self.tableObj[key] = {
                                label: value.label,
                                data: []
                            };
                        self.tableObj[key].data.push(
                            {
                                date: v.SnapShotDate,
                                text: value.value,
                                name: v.Name
                            });
                        j++;
                    });
                });
                var fillDateInArray = function (datesToFill, data) {
                    $.each(datesToFill, function (i, v) {
                        var found = false;
                        $.each(data, function (j, k) {
                            if (k.date == v)
                                found = true;
                        });
                        if (!found)
                            data.push({
                                date: v,
                                text: ""
                            });

                    });
                }
                $.each(self.tableObj, function (key, value) {
                    fillDateInArray(datesToFill, value.data);
                    value.data = $filter('orderBy')(value.data,'-date');
                });
          
            });
           
        };
        self.load = function () {
            $scope.initSnapShots();
        };
        $timeout(self.load(), 200);
    }]);
});
