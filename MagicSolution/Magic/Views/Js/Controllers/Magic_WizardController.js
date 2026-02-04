(function () {
    var dependencies = ["angular", "angular-magic-wizard"],
        angular,
        controllerName = "Wizard";

    define(dependencies, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init(code) {
        var element = $("#grid").html('<div ng-controller="WizardController as wc"><magic-wizard wizard-code="' + code + '"></magic-wizard></div>')[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular) {
        angular
            .module(controllerName, ["magicWizard"])
            .controller(controllerName + "Controller", [
                '$timeout',
                '$scope',
                '$element',
                '$http',
                function ($timeout, $scope, $element, $http) {
                    var self = this;
                }
            ]);
    }
})();