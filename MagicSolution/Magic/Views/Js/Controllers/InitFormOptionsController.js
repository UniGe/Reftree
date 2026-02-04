(function () {
    var deps = ["angular", "MagicSDK", "angular-magic-grid", "angular-magic-chart", "angular-magic-form-sp", "angular-magic-pivot", "angular-magic-tree", "angular-magic-timesheet", "angular-magic-change-log", "angular-magic-grid-sp", "angular-magic-chart-gauge", "angular-magic-wizard"]
    var angular;
    var MF;
    var app;
    define(deps, function (a, MFsdk) {
        MF = MFsdk;
        angular = a;
        app = controller.apply({}, arguments);
        return init;
    });
    function init(path,extension) {
        var config = { MF: MF }
        if (extension)
            $.extend(config, extension);
        $("#appcontainer").append('<div id="appconthtml" ng-controller="InitFormOptionsController as cd" ng-include="\'' + window.includesVersion + "/"+ path.replace(/^\//,'') + '\'"></div>');
        app.value("config", config);
        //NF20170413: appoggio in config l'injector restutito dal metodo per poter accedere anche dalle varie extension ai servizi angular (cfr ScadenzeExtension.js) 
        var injector = angular.bootstrap($("#appconthtml"), ["InitFormOptions"]);
        config.injector = injector;

    }

    function controller(angular,MF)
    {
       return angular
       .module('InitFormOptions', ["magicGrid", "magicChart", "magicFormSp", "magicPivot", "magicTree", "magicTimesheet","magicChangeLog","magicGridSp","magicChartGauge","magicWizard"])
       .controller('InitFormOptionsController', ['config',
           function (config) {
               var self = this;
               //options are user as a parameter for selection queries run bythe directives
               self.options = config;
               
               self.translate = function (text) {
                   return getObjectText(text);
               }
            }
       ]);
    }
}())