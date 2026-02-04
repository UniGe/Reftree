define(['angular', "MagicSDK", 'angular-kendo'], function (angular, MF) {
    angular.module('magicChartGauge', ['kendo.directives'])
        .directive('magicChartGauge', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: {
                },
                bindToController: {
                    chartid: "@",
                    chartguid: "@",
                    options: "=",
                    callback: "=",
                },
                controllerAs: "rg",
                template: '<h3>{{rg.Description}}</h3><div ng-if="rg.chartObject" id="gauge-container"><span kendo-radialgauge="rg.chartInstance" k-options="rg.chartObject"   chartid="{{ rg.chartid }}" chartguid = "{{ rg.chartguid }}"></span><div class="hidden" ng-init="rg.domIsReady()"></div></div>',
                controller: [
                    "$timeout",
                    "config",
                    "$http",
                    function ($timeout, config, $http) {
                        var self = this;
                        kendo.culture(window.culture);
                        this.chartInstance = {};
                        //#mfapireplace
                        $http.post("/api/Magic_Dashboard/GetChartData", { guid: self.chartguid || null, id: self.chartid || null }).then(function (res) {
                            var chartData = res.data.Data[0].Table[0];
                            self.getChartData(chartData, null, null, config.model).then(function (data) {
                                if (data && data.length)
                                    self.chartObject = self.initChart(chartData, data[0]);
                                self.Description = chartData.Description;
                                if (data && data.length)
                                    $timeout(function () {
                                        if (self.chartInstance) {
                                            self.chartObject = self.initChart(chartData, data[0]);
                                        }
                                    });
                            })
                        })

                        //options are given form the angular initializer and added to tag P 
                        self.getChartData = function (chart, from, to, options) {
                            if (!from || !to)
                                var dateEnd = new Date(),
                                    dateStart = new Date(dateEnd.getFullYear(), 0, 1);

                            var dataObj = {
                                dateFrom: kendo.toString(dateStart, "yyyyMMdd"),
                                dateTo: kendo.toString(dateEnd, "yyyyMMdd"),
                                chartIDs: chart.ID,
                                storedName: chart.objectLoadSP,
                                businessData: JSON.stringify(self.options)
                            };
                            var extendedDataObj = $.extend({}, dataObj, self.options);

                            return $.ajax({
                                type: "POST",
                                url: "/api/DataAnalysis/PeriodCharts/",
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                data: JSON.stringify(extendedDataObj)
                            });
                        }
                        self.initChart = function (chart, data) {
                            if (!chart.YAxisMeasurementUnit)
                                chart.YAxisMeasurementUnit = "";
                            var extension = {};
                            if (chart.ChartExtension) {
                                try {
                                    extension = JSON.parse(chart.ChartExtension);
                                } catch (ex) {
                                    console.log("ERROR: " + ex);
                                }
                            }
                            var pointers = [];
                            for (var i = 0; i < data.length; i++) {
                                pointers.push({ value: data[i].Tot || data[i].Partials[0], customparam: data[i].CustomParameter ? JSON.parse(data[i].CustomParameter) : null });
                                if (pointers[i].customparam && pointers[i].customparam.color) {
                                    pointers[i].color = pointers[i].customparam.color;
                                }
                            }
                            return $.extend(true, {
                                pointer: pointers,
                                title: {
                                    text: chart.description,
                                    visible: false
                                }
                            }, extension, self.options || {});
                        }
                        self.domIsReady = function () {
                            self.callback(self.chartObject);
                        }
                    }

                ]
            }
        }]);
});