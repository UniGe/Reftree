function loadscript() {
    var $el = $("#appcontainer").html('<div id="templatecontainer"/><div id="check-in-monitor-controller" ng-controller="CheckIn_monitorController as c" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/CheckIn_monitor.html\'"></div>').find("#check-in-monitor-controller");
    initAngularController($el[0], "CheckIn_monitorController", null, null, true);
}