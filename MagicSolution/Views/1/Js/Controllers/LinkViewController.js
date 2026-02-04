(function () {
    var deps = ["angular", window.includesVersion + "/Views/1/Js/Directives/link-view.js"]
    var angular;
    var controllerName = "LinkView";

    define(deps, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html('<div ng-controller="LinkViewController as lvc"><link-view></link-view></div>')[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        return angular
            .module(controllerName, ["LinkView"])
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