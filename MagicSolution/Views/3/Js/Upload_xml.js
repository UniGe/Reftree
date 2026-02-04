function loadscript() {
    var $el = $("#appcontainer").html('<div id="templatecontainer"/><div id="xml-upload-controller" ng-controller="XML_UPLOADController as c" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/XML_UPLOAD.html\'"></div>').find("#xml-upload-controller");
    initAngularController($el[0], "XML_UPLOADController", null, null, true);
}