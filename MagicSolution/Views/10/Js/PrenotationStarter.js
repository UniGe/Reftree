function loadscript() {
    var $el = $("#appcontainer").html('<div id="prenotation-controller" ng-controller="PrenotationController as p" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/Prenotation.html\'"></div>').find("#prenotation-controller");
    initAngularController($el[0], "PrenotationController", null, null, true);
}