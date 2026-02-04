(function () {
    var deps = ["angular", "MagicSDK", "angular-magic-grid","angular-magic-form"]
    var angular;
    var MF;
    var app;
    var controllerName = "InvoiceRemindersSent";
    define(deps, function (a, MFsdk) {
        MF = MFsdk;
        angular = a;
        app = controller.apply({}, arguments);
        return init;
    });

    function init() {
        var config = { MF: MF };
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true, false, "onTemplateLoaded"))[0];
        app.value("config", config);
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        return angular
        .module('InvoiceRemindersSent', ["magicGrid", "magicForm"])
        .controller('InvoiceRemindersSentController', ['config','$scope','$timeout',
            function (config,$scope,$timeout) {
                var self = this;
                self.formModel = { ID: 1 };
                //options are user as a parameter for selection queries run bythe directives
               self.translate = function (text) {
                    return getObjectText(text);
                }
               $scope.$watch('irs.formModel', function () {
                   self.initialFilter = { field: "T_InvoiceReminder_ID", operator: "eq", value: self.formModel.ID };
               },true);

            }
        ]);
    }
}())