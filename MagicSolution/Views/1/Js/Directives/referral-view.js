define(['angular', "MagicSDK", "angular-filter"], function (angular, MF) {
    angular
        .module('referralView', ['angular.filter'])
        //config is used in magicFormSp
        .value("config", {
            data: '{}'
        })
        .directive('referralView', ['$timeout', function ($timeout) {
            return {
                replace: true,
                restrict: "E",
                scope: {
                    hideFilters: "=",
                    personId: "=",
                    monthDaysString: "@",
                    from: "@",
                    to: "@",
                    setUserReferral: "="

                },
                templateUrl: window.includesVersion + "/Views/1/Templates/Directives/referral-view.html",
                link: function (scope, element, attrs, ctrls) {

                    MF.api.get({ storedProcedureName: "HR.PersonReferral" })
                        .then(function (res) {
                            scope.referralsName = res[0];
                            $timeout();
                        });

                    MF.api.get({ storedProcedureName: "HR.LastHolidaysCounterModifiedMonth" })
                        .then(function (res) {
                            scope.lastModifiedDetails = res[0];
                            $timeout();
                        });
                    
                    MF.api.get({ storedProcedureName: "HR.TodayAbsent" })
                        .then(function (res) {
                            scope.personAbsent = res[0];
                            $timeout();
                        });
                    

                    scope.translate = function (label) {
                        return getObjectText(label);
                    }

                    scope.getReferralName = function (type) {
                        return scope.referralsName[0][type];
                    }
                }
            };
        }]);
});
