define(["angular"], function (angular) {
    angular
        .module("magicIndicator", [])
        .directive('magicIndicator', function () {
            return {
                restrict: 'EA',
                scope: {
                    widgetdata: '=',
                    modeldata: '=',
                },
                template: '<div class="magic-indicator-container"></div>',
                controller: ["$scope",
                    "$element",
                    "$http",
                    function ($scope, $element, $http) { 
                        var indicator = null;                       
                        var indicatorStoredProcedure = "dbo.DashboardGetIndicators_v2";
                        var container = $('.magic-indicator-container', $element);
                        container.attr('ng-controller', "DashboardIndicatorController as dic");
                        container.attr('ng-include', "'/Magic/Views/Templates/HtmlTemplates/webarch-indicator.html'");
                        container.attr('onload', "dic.onload()");
                        
                        var indicatorID = null, indicatorCode = null;
                        if (isNaN(parseInt($scope.widgetdata.contentObjectPath))) { //set Code, leave ID null
                            indicatorCode = $scope.widgetdata.contentObjectPath;
                        } else {
                            indicatorID = parseInt($scope.widgetdata.contentObjectPath); //set ID, leave Code null
                        }

                        $http.post("/api/Magic_Dashboard/GetIndicator", { id: indicatorID ? "" + indicatorID : "", code: indicatorCode ? "" + indicatorCode : "" }).then(function (res) { //#mfapireplace
                            var indi = res.data.Data[0].Table[0];
                            indicatorID = parseInt(indi.ID);
                            var config = buildCamelCaseConfig(indi);
                            initAngularController(container, "DashboardIndicatorController", config);
                            config.deferred.then(function (indi) {
                                indicator = indi;
                                var from = new Date(2000, 1);
                                var to = new Date();
                                getIndicatorData(from, to);
                            });
                        });

                        function getIndicatorData(from, to) { 
                            $.ajax({
                                type: "POST",
                                url: "/api/DataAnalysis/PeriodIndicators/",
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                data: JSON.stringify($.extend({},{
                                    dateFrom: kendo.toString(from, "yyyyMMdd"),
                                    dateTo: kendo.toString(to, "yyyyMMdd"),
                                    indicatorIDs: indicatorID,  //id was set after loading indicator-config
                                    qualfilter: null,
                                    storedName: indicatorStoredProcedure,
                                    model: $scope.modeldata,
                                    businessData: JSON.stringify($scope.widgetdata.filter),
                                    businessDataUnresolved: JSON.stringify($scope.widgetdata.filterObj)                                    
                                })),
                                success: function (res) {
                                    indicator.setValues(res[indicatorID], from, to);                                    
                                }
                            });
                        }
                        function buildCamelCaseConfig(cfg) {
                            var d = $.Deferred();                            
                            var camelCaseConfig = {
                                color: cfg.Color,
                                deferred: d,
                                description: cfg.Description,
                                functionFilter: cfg.FunctionFilter,
                                functionGUID: cfg.FunctionGUID,
                                functionID: cfg.Function_ID,
                                gridName: null,
                                iconClass: cfg.IconClass,
                                indicatorId: cfg.ID,
                                measurementUnit: cfg.MeasurementUnit,
                                objectLoadSP: cfg.IndicatorLoadSP,
                                subValuesLoadSp: cfg.SubValuesLoadSP,
                                type: "INDICATOR",
                                model: $scope.modeldata  || {},
                                businessData: JSON.stringify($scope.widgetdata.filter) || "",
                            };
                            return camelCaseConfig;
                        }
                         
                    }
                ]
            };
        })
});