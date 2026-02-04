


(function () {
    var dependencies = ["angular", "angular-magic-grid", "angular-magic-wizard"];
    var angular,
        app,
        controllerName = "RecruitmentWizard";

    define(dependencies, function (a) {
        angular = a;
        app = controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true))[0];
        app.value("config", {});
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        return angular
            .module(controllerName, ["magicGrid", "magicWizard"])
			.controller(controllerName + "Controller", ['config', '$scope', '$timeout',
				function (config, $scope, $timeout) {
					var self = this;

				}
            ]);
    }

})();