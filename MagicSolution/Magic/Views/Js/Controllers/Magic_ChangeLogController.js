(function () {
    var dependencies = ["angular", "angular-magic-change-log"],
        angular,
        controllerName = "ChangeLog";

    define(dependencies, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html('<div ng-controller="' + controllerName + 'Controller as cl"><magic-change-log></magic-change-log></div>')[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular) {
        angular
            .module(controllerName, ['magicChangeLog'])
            .controller(controllerName + "Controller", [function () {}]);
    }
})();