define(['angular', "MagicSDK", "angular-sanitize", "angular-filter"], function (angular, MF) {
    angular
        .module('internalnewsView', ['angular.filter', 'ngSanitize'])
        //config is used in magicFormSp
        .value("config", {
            data: '{}'
        })
        .directive('internalnewsView', ['$timeout', function ($timeout) {
            return {
                replace: true,
                restrict: "E",
                templateUrl: window.includesVersion + "/Views/1/Templates/Directives/internalnews-view.html",
                link: function (scope, element, attrs, ctrls) {


                    scope.personOfDepartment = "";
                    scope.selectednews = "";

                    MF.api.get({ storedProcedureName: "Utils.usp_newsForInternalNewsView_select" })
                        .then(function (res) {
                            console.log(res);
                            scope.news = res[0];
                            $timeout();
                        });

                    scope.translate = function (label) {
                        return getObjectText(label);
                    }
                    scope.getNews = function (News_ID) {
                        MF.api.get({ storedProcedureName: "Utils.usp_newsForInternalNewsView_Filtered", data: { News: News_ID } })
                            .then(function (res) {
                                console.log(res);
                                scope.selectednews = res[0];
                                $timeout();
                                MF.api.get({ storedProcedureName: "Utils.usp_personByDepartmentID", data: { Department_IDs: scope.selectednews[0].Department_IDs, nRecipients: scope.selectednews[0].nRecipients } })
                                    .then(function (res) {
                                        console.log(res);
                                        scope.personOfDepartment = res[0];
                                        $timeout();
                                    });
                            });
                      
                    }

                
                    scope.showPersonDepartment = function (event) {
                        if (scope.personOfDepartment[0].PersonList) {

                            $(event.target).kendoTooltip({
                                content: scope.personOfDepartment[0].PersonList,
                                autoHide: false,
                                showOn: "click",
                                width: 180
                            })
                                .data("kendoTooltip")
                                .show();
                        }
                    }
                }

            };
        }]);
});
