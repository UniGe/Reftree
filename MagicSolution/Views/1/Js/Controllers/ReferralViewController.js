(function () {
    var deps = ["angular", window.includesVersion + "/Views/1/Js/Directives/referral-view.js"]
    var angular;
    var controllerName = "ReferralView";

    define(deps, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html('<div ng-controller="ReferralViewController as rf"><referral-view></referral-view></div>')[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        return angular
            .module(controllerName, ["referralView"])
            .controller(controllerName + "Controller", ['$timeout',
                function ($timeout) {
                    var self = this;
                    self.translate = function (label) {
                        return getObjectText(label)
                    }
                }
            ]);
    }
}())