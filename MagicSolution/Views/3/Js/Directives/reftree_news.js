define(['angular', 'angular-kendo', 'angular-filter'], function (angular) {
    angular.module('reftreeNews', ['kendo.directives', 'angular.filter'])
        .directive('reftreeNews', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: {
                },
                bindToController: {
                },
                controllerAs: "rnc",
                templateUrl: '/Views/3/Templates/Directives/reftreeNews.html',
                controller: ["$timeout", "$http", function ($timeout, $http) {
                    kendo.culture(window.culture);
                     
                }]
            }
        }]);
});