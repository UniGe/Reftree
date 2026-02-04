define(["MagicSDK"], function (MF) {
    loadCss(["dx.common", "dx.light"], window.includesVersion + "/Magic/DevExtreme/Lib/css/");
    return ["magicPivotLogic",
            function () {
                return {
                    restrict: "E",
                    scope: {
                    },
                    bindToController: {
                        pivotCodes: "=",
						pivotOptions: "=",
						pivotFilter: "=",
						outerGrid: "="
                    },
                    templateUrl: window.includesVersion + '/Magic/Views/Templates/Directives/magic-pivot-logic.html',
                    controllerAs: "c",
                    controller: [
                        "$scope",
                        "$timeout",
                        function ($scope, $timeout) {
                            var self = this,
                               pivotsConfig = self.pivotCodes;

                            self.init = function () {
                                self.pivots = $.map(pivotsConfig, function (v, i) {
                                    return {
                                        code: v, states: [], charts: [], optionsExtension: self.pivotOptions && self.pivotOptions.length > i ? self.pivotOptions[i] : {}
                                    };
                                });

                                //switch code with description of tabs                                
                                $.ajax({ // LIKE %% operator used #mfapireplaced
                                    type: "POST",
                                    url: "/api/MAGIC_Pivot/GetPivots",
                                    data: JSON.stringify({ Codes: pivotsConfig }),
                                    contentType: "application/json; charset=utf-8",
                                    dataType: "json",
                                    error: function (err) { console.log(err.responseText) }
                                })
                                .then(function (res) {
                                    var pivotTable = res.Data[0].Table; 
                                    $.each(pivotTable, function (k, v) {
                                        $.each(self.pivots, function (kk, vv) {
                                            if (vv.code == v.Code) {
                                                $.extend(vv, v);
                                                return false;
                                            }
                                        });
                                    })
                                    $timeout();
                                });
                            };

                            function loopTroughCriticalStateProperties(partialState, func) {
                                $.each(["columnExpandedPaths", "rowExpandedPaths"], function (k, vv) {
                                    $.each(partialState[vv], function (k, v) {
                                        partialState[vv][k] = func(v);
                                    });
                                });
                            }

                            self.savePivotState = function (pivot) {
                                var configName = prompt(getObjectText("name") + "?"),
                                    pivotInstance = pivot.pivotInstance;
                                if (!configName)
                                    return;
                                getConfig("pivot")
                                 .then(function (pivotConfig) {
                                     var pivotCode = pivot.Code;
                                     pivotConfig = pivotConfig || {};
                                     if (!(pivotCode in pivotConfig))
                                         pivotConfig[pivotCode] = [];
                                     var partialState = pivotInstance.getDataSource().state();
                                     var charts = pivot.charts.slice(0);
                                     $.each(charts, function (k, v) {
                                         delete v.chartInstance;
                                         delete v.$$hashKey;
                                     });
                                     var state = {
                                         name: configName,
                                         settings: {
                                             state: partialState,
                                             fields: pivotInstance.getDataSource().fields()
                                         },
                                         timestamp: Date.now(),
                                         charts: charts
                                     };
                                     pivotConfig[pivotCode].push(state);
                                     setConfig("pivot", pivotConfig)
                                         .then(function () {
                                             $timeout(function () {
                                                 pivot.states.push(state);
                                             });
                                         }, function () {
                                             $.each(pivotConfig[pivotCode], function (k, v) {
                                                 if (state.timestamp == v.timestamp) {
                                                     pivotConfig[pivotCode].splice(k, 1);
                                                     return false;
                                                 }
                                             });
                                         });
                                 });
                            };

                            self.getPivotStates = function (pivot) {
                                pivot.showStates = !pivot.showStates;
                                if (!pivot.showStates)
                                    return;
                                getConfig("pivot")
                                    .then(function (pivotConfig) {
                                        if (pivotConfig && pivot.Code in pivotConfig) {
                                            $timeout(function () {
                                                pivot.states = pivotConfig[pivot.Code];
                                            });
                                        }
                                    });
                            };

                            self.setPivotState = function (pivot, state) {
                                var dataSource = pivot.pivotInstance.getDataSource();
                                dataSource.fields(state.settings.fields);

                                dataSource.state(state.settings.state);
                                pivot.showCharts = false;
                                pivot.charts = [];
                                if (state.charts && state.charts.length) {
                                    $.each(state.charts, function (k, v) {
                                        self.addChartToPivot(pivot, v.type, v.options, true);
                                    });
                                    pivot.showCharts = true;
                                }
                            };

                            self.deleteState = function (pivot, index) {
                                if (!confirm(getObjectText("delete") + ": " + pivot.states[index].name + "?"))
                                    return;
                                getConfig("pivot")
                                    .then(function (pivotConfig) {
                                        pivot.states.splice(index, 1);
                                        pivotConfig[pivot.Code].splice(index, 1);
                                        setConfig("pivot", pivotConfig);
                                    });
                            };

                            self.buildPivot = function (pivot) {
                                if (pivot.initialized)
                                    return;
                                pivot.initialized = true;
								var code = pivot.code;
								$("magic-pivot").prepend('<div class="waitpivot___">' + largeSpinnerHTML + '</div>');
								MF.devExtreme.getDxPivotObject({ code: code, filterFormData: self.pivotFilter ? self.pivotFilter[code] : null, outerGrid: self.outerGrid ? self.outerGrid[code] : null }).then(function (dxPivotObject) {
									$(".waitpivot___").remove();
									$.extend(true, dxPivotObject, pivot.optionsExtension);
                                    dxPivotObject.onInitialized = function (e) {
                                        pivot.pivotInstance = e.component;
                                    };
                                    $timeout(function () {
                                        pivot.options = dxPivotObject;
                                    });
                                });
                            };

                            self.addChartToPivot = function (pivot, type, options, notReloadDataSource) {
                                var chart = {
                                    options: $.extend({
                                        onInitialized: function (e) {
                                            chart.chartInstance = e.component;
                                            pivot.pivotInstance.bindChart(chart.chartInstance);
                                            if (notReloadDataSource !== true)
                                                pivot.pivotInstance.getDataSource().reload();
                                        },
                                        dataSource: [],
                                        commonSeriesSettings: {
                                            type: 'bar'
                                        },
                                        export: {
                                            enabled: true
                                        }
                                    }, options || {}),
                                    type: type
                                };
                                pivot.charts.push(chart);
                            };

                            self.chartSubTypes = function (type) {
                                return {
                                    "default": [
                                         'line', 'stackedline', 'fullstackedline', 'area', 'stackedarea', 'fullstackedarea', 'bar', 'stackedbar', 'fullstackedbar', 'spline', 'splinearea', 'scatter', 'candlestick', 'stock', 'rangearea', 'rangebar', 'stepline', 'steparea', 'bubble', 'fullstackedspline', 'stackedspline', 'stackedsplinearea', 'fullstackedsplinearea'
                                    ]
                                }[type];
                            };

                            self.removeChart = function (pivot, chartIndex) {
                                console.log(chartIndex);
                                pivot.charts.splice(chartIndex, 1);
                            };

                            self.changeChartType = function (chart) {
                                var commonSeriesSettings = chart.chartInstance.option('commonSeriesSettings');
                                commonSeriesSettings.type = chart.options.commonSeriesSettings.type;
                                chart.chartInstance.option('commonSeriesSettings', commonSeriesSettings);
                            };

                            self.translate = function (key) {
                                return getObjectText(key);
                            };

                            self.clickShowCharts = function (pivot) {
                                pivot.showCharts = !pivot.showCharts;
                                if (!pivot.charts.length)
                                    self.addChartToPivot(pivot, 'default');
                            };

                            self.buttonsAreVisible = true;
                            self.toggleButtonsCount = 0;
                            self.toggleButtons = function (pivot) {
                                self.buttonsAreVisible = !self.buttonsAreVisible;

                                if (!self.buttonsAreVisible) {
                                    //hide
                                    $('.dx-data-header').children('div').first().css('display', 'none');
                                    $('.dx-data-header').siblings().children('div').first().css('display', 'none');
                                    $('.dx-area-description-cell').children('div').first().css('display', 'none');
                                    
                                    $timeout(function () {
                                        var container = $('.dx-scrollable-container').last();
                                        var maxScroll = container[0].scrollWidth;                                   
                                        console.log("container[0].scrollLeft", container[0].scrollLeft);
                                        if (self.toggleButtonsCount % 2 == 0) {
                                            container[0].scrollLeft = maxScroll;
                                        } else {
                                            container[0].scrollLeft = parseInt(maxScroll/2);
                                        }
                                    }, 100);

                                } else {
                                    //show
                                    $('.dx-data-header').children('div').first().css('display', 'block');
                                    $('.dx-data-header').siblings().children('div').first().css('display', 'block');
                                    $('.dx-area-description-cell').children('div').first().css('display', 'block');
                                    $(window).resize();                                    
                                }
                                self.toggleButtonsCount++;
                            }

                            self.init();
                        }]
                }
            }];
});