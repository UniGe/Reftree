function loadscript() {
    var $el = $("#appcontainer").html('<div id="templatecontainer"/><div id="pren-history-controller" ng-controller="PrenotationHistoryController as c" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/PrenotationHistory.html\'"></div>').find("#pren-history-controller");
    initAngularController($el[0], "PrenotationHistoryController", null, null, true);
}