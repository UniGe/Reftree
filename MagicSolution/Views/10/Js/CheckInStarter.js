function loadscript() {
    var $el = $("#appcontainer").html('<div id="check-in-controller" ng-controller="CheckInController as c" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/CheckIn.html\'"></div>').find("#check-in-controller");
    initAngularController($el[0], "CheckInController", null, null, true);
}