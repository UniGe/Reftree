function loadscript() {
    var $el = $("#appcontainer").html('<div id="prenotation-controller" ng-controller="PrenotationPeriodController as p" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/PrenotationPeriod.html\'"></div>').find("#prenotation-controller");
    initAngularController($el[0], "PrenotationPeriodController", null, null, true);
}