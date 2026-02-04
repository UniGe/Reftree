function loadscript() {
    var $el = $("#appcontainer").html('<div id="check-out-controller" ng-controller="CheckOutController as c" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/CheckOut.html\'"></div>').find("#check-out-controller");
    initAngularController($el[0], "CheckOutController", null, null, true);
}