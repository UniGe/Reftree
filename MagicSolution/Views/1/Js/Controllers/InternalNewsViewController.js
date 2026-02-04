(function () {
    var deps = ["angular", window.includesVersion + "/Views/1/Js/Directives/internalnews-view.js"]
    var angular;
    var controllerName = "InternalNewsView";

    define(deps, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html('<div ng-controller="InternalNewsViewController as inv"><internalnews-view></internalnews-view></div>')[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        return angular
            .module(controllerName, ["InternalNewsView"])
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