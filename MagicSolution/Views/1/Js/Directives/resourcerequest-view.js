define(['angular', "MagicSDK", "angular-sanitize", "angular-filter"], function (angular, MF) {
    angular
        .module('resourceRequestView', ['angular.filter', 'ngSanitize'])
        //config is used in magicFormSp
        .value("config", {
            data: '{}'
        })
        .directive('resourceRequestView', ['$timeout', function ($timeout) {
            return {
                replace: true,
                restrict: "E",
                templateUrl: window.includesVersion + "/Views/1/Templates/Directives/resourcerequest-view.html",
                link: function ( scope, element, attrs, ctrls) {
                    scope.months = [];
                    scope.projects = [];
                    scope.skills = [];
                    scope.locations = [];
                    scope.projectDates = [];
                    scope.addedLines = [];
                    scope.lines = 0;
                    scope.dataSetObj = [];

                    scope.save = function (dataSet) {
                      //  Costruisco l'array da mandare in pasto alla stored
                        for (var i = 0; i < dataSet.length; i++) {
                            var keys = Object.keys(dataSet[i]);

                            var len = keys.length;
                            for (var k = 0; k < len; k++) {
                                if (dataSet[i][k].timeFrom && dataSet[i][k].timeTo)
                                    scope.dataSetObj.push({ project_ID: scope.project.ID, location: dataSet[i][0].location, skill: dataSet[i][0].skill, quantity: dataSet[i][k].quantity, date: scope.projectDates[k].RealDate, timeFrom: new Date(new Date(dataSet[i][k].timeFrom.getTime() + (-1 * dataSet[i][k].timeFrom.getTimezoneOffset() * 60 * 1000))), timeTo: new Date(new Date(dataSet[i][k].timeTo.getTime() + (-1 * dataSet[i][k].timeTo.getTimezoneOffset() * 60 * 1000))) });
                                else
                                    scope.dataSetObj.push({ project_ID: scope.project.ID, location: dataSet[i][0].location, skill: dataSet[i][0].skill, quantity: dataSet[i][k].quantity, date: scope.projectDates[k].RealDate, timeFrom: null, timeTo: null });

                            }
                        }                 
                        
                        MF.api.get({
                            storedProcedureName: "nameOfStored",
                            data: { models: scope.dataSetObj } , // an object to pass into tag p of stored procedure
                            }).then(function (res) {
                                if (res.length) {
                                    console.log(res);
                                    // handle result here
                                }
                            });
                        scope.dataSetObj = [];
                    }

                    MF.api.get({ storedProcedureName: "HR.GetResourceRequestData" })
                        .then(function (res) {
                           // console.log(res);
                            scope.months = res[0];
                            scope.projects = res[1];
                            scope.skills = res[2];
                            scope.locations = res[3];
                            scope.project = [];
                            scope.month = scope.months[new Date().getMonth()].ID;
                            $timeout();
                        });

                    scope.$watch("project", function () {
                        scope.getProjectCalendar();
                    });
                    
                    scope.getProjectCalendar = function () {
                        if (scope.project.ID) {
                            MF.api.get({
                                table: "HR.V_Project_Calendar",
                                filter: { field: "Project_ID", operator: "eq", value: self.project.ID }//"Project_ID = " + self.project.ID + ""
                            })
                                .then(function (res) {
                                    //console.log(res); show result on success
                                    scope.projectDates = res;
                                    $timeout();
                                    });
                        }
                    }
                    
                    scope.addLine = function () {
                        scope.lines++;
                        scope.addedLines.push(scope.lines);
                        
                    }
                }
            };
        }]);
});
