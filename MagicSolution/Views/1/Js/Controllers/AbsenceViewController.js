(function () {
    var deps = ["angular", window.includesVersion + "/Views/1/Js/Directives/absence-view.js"]
    var angular;
    var controllerName = "AbsenceView";

    define(deps, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html('<div ng-controller="AbsenceViewController as av"><absence-view></absence-view></div>')[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        return angular
            .module(controllerName, ["absenceView"])
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