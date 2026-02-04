define(['angular', 'angular-kendo'], function (angular) {
    angular.module('magicChart', ['kendo.directives'])
        .directive('magicChart', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: {
                },
                bindToController: {
                    chartid: "@",
                    chartguid: "@",
                    options: "=",
                    storedproceduredata: "=",
                    onChartReady: "=",
                },
                controllerAs: "mc",
                template: '<h3>{{mc.Description}}</h3><div kendo-chart="mc.chartInstance" k-options="mg.chartObject" chartid="{{ mc.chartid }}" chartguid = "{{ mc.chartguid }}"></div>',
                controller: [
                    "$timeout",
                    "config",
                    "$http",
                    function ($timeout, config, $http) {
                        var self = this;
                        kendo.culture(window.culture);
                        this.chartInstance = {};

                        if (isNaN(self.chartid)) {    //handle new GridEditPage-configuration
                            self.chartguid = "" + self.chartid;
                            self.chartid = null;
                        }

                        $http.post("/api/Magic_Dashboard/GetChartData", { guid: self.chartguid || null, id: self.chartid || null }).then(function (res) {
                            var chartData = res.data.Data[0].Table[0];
                            self.getChartData(chartData, null, null, $.extend({}, self.storedproceduredata || {}, config.model)).then(function (data) {
                                if (data && data.length) {
                                    self.chartObject = self.initChart(chartData, data[0]);
                                }
                                self.Description = chartData.Description;
                                if (data && data.length) {
                                    $timeout(function () {
                                        if (self.chartInstance) {
                                            if (self.onChartReady) {
                                                self.onChartReady(self.chartInstance);
                                            }
                                            self.chartInstance.setOptions(self.initChart(chartData, data[0]));
                                        }
                                    });
                                }
                            })
                        })

                        self.parseDateChartX = function (chart, dataItem) {
                            var x = dataItem.X;
                            if (chart.aggregationDim == 'months')
                                x = kendo.toString(new Date(dataItem.X), 'y');
                            if (chart.aggregationDim == 'years')
                                x = kendo.toString(new Date(dataItem.X), 'yyyy');
                            return x;
                        }
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
                                businessData: JSON.stringify(options)
                            };
                            var extendedDataObj = $.extend({}, dataObj, options);
                             
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
                            switch (chart.ChartType) {
                                case "kendopiechart":
                                    var series = [],
                                        showLegendOutsideGraph = data && data.length > 20;
                                    if (data) {
                                        for (var i = 0; i < data.length; i++) {
                                            series.push({ category: self.parseDateChartX(chart, data[i]), value: data[i].Tot, customparam: data[i].CustomParameter ? JSON.parse(data[i].CustomParameter) : null });
                                            if (series[i].customparam && series[i].customparam.color) {
                                                series[i].color = series[i].customparam.color;
                                            }
                                        }
                                    }
                                    return $.extend(true, {
                                        dataSource: {
                                            data: series,
                                        },
                                        title: {
                                            position: "bottom",
                                            text: chart.Description
                                        },
                                        legend: {
                                            visible: showLegendOutsideGraph
                                        },
                                        chartArea: {
                                            background: "",
                                        },
                                        seriesDefaults: {
                                            labels: {
                                                visible: true,
                                                background: "transparent",
                                                template: (showLegendOutsideGraph ? "" : "#= category #: \n") + "#= value #" + chart.YAxisMeasurementUnit
                                            }
                                        },
                                        series: [{
                                            type: "pie",
                                            field: "value"
                                        }],
                                        categoryAxis: {
                                            field: "categories"
                                        },
                                        tooltip: {
                                            visible: true,
                                            format: "{0} " + chart.YAxisMeasurementUnit
                                        }
                                    }, extension, self.options || {});

                                    break;
                                case "kendolinechart_column":
                                case "kendolinechart":
                                    var type = chart.ChartType == "kendolinechart_column" ? "column" : "line",
                                        partialLabels = chart.partialLabels ? chart.partialLabels.split(',') : [];
                                    //check if the user has defined the labels for multi value columns (stacked or not) 
                                    var partialsAreDefinedByUser = false;
                                    if (partialLabels.length)
                                        partialsAreDefinedByUser = true;
                                    var labels = [],
                                        param = JSON.parse(data[0].CustomParameter || "{}"),
                                        isstacked = partialLabels.length > 1,// && type == "column",
                                        series = $.map(isstacked ? data[0].Partials : [0], function (v, k) {
                                            return {
                                                data: [],
                                                markers: { type: "square" },
                                                color: param["colorPartial" + (k + 1)],
                                                name: isstacked ? partialLabels[k] || "P" + (k + 1) : null
                                            };
                                        });
                                    //if the partialLabels have been defined show only the series which have a legend
                                    if (partialsAreDefinedByUser && series.length > partialLabels.length)
                                        series.splice(partialLabels.length, series.length - partialLabels.length);

                                    for (var i = 0; i < data.length; i++) {
                                        data[i].X = self.parseDateChartX(chart, data[i]);
                                        labels.push(data[i].X);
                                        $.each(isstacked ? data[i].Partials : [data[i].Tot], function (k, v) {
                                            if (series.length > k)
                                                series[k].data.push(v);
                                        });
                                    }

                                    var graphobj = {
                                        title: {
                                            text: chart.Description,
                                            position: "bottom"
                                        },
                                        legend: {
                                            position: "bottom"
                                        },
                                        seriesDefaults: {
                                            type: type,
                                            stack: isstacked
                                        },
                                        series: series,
                                        valueAxis: {
                                            line: {
                                                visible: false
                                            }
                                        },
                                        categoryAxis: {
                                            labels: {
                                                rotation: 90
                                            },
                                            categories: labels,
                                            majorGridLines: {
                                                visible: false
                                            }
                                        },
                                        tooltip: {
                                            visible: true,
                                            format: "{0} " + chart.YAxisMeasurementUnit
                                        },
                                        zoomable: {
                                            mousewheel: {
                                                lock: "y"
                                            },
                                            selection: {
                                                lock: "y"
                                            }
                                        }
                                    };
                                    return $.extend(true, graphobj, extension, self.options || {});
                            }

                        }
                    }

                ]
            }
        }]);
});