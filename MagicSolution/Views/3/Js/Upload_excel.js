function loadscript() {
    var $el = $("#appcontainer").html('<div id="templatecontainer"/><div id="ex-upload-controller" ng-controller="EX_UPLOADController as c" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/EX_UPLOAD.html\'"></div>').find("#ex-upload-controller");
	initAngularController($el[0], "EX_UPLOADController", {appAreaId:null,classId:null,modelId:null}, null, true);
}