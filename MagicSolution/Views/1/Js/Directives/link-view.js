define(['angular', "MagicSDK", "angular-filter"], function (angular, MF) {
    angular
        .module('linkView', ['angular.filter'])
        //config is used in magicFormSp
        .value("config", {
            data: '{}'
        })
        .directive('linkView', ['$timeout', function ($timeout) {
            return {
                replace: true,
                restrict: "E",
                templateUrl: window.includesVersion + "/Views/1/Templates/Directives/link-view.html",
                link: function (scope, element, attrs, ctrls) {

                    MF.api.get({ storedProcedureName: "Utils.usp_linkForLinkView_select" })
                        .then(function (res) {
                            console.log(res);
                            scope.links = res[0];
                            $timeout();
                        });

                    scope.translate = function (label) {
                        return getObjectText(label);
                    }
                }
            };
        }]);
});
