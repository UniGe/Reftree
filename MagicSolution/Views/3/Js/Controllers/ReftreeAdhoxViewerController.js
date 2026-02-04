define([ //requireJs deps    
    "angular",
    "MagicSDK",
    "angular-kendo",
    "angular-filter",
    "angular-ui-bootstrap",
    "tree-bim-r3",
    "angular-magic-grid",
    "angular.drag.resize",
    "angular-adhox-viewer",
    "https://api-stg-eggon-forge.herokuapp.com/lib/viewer.js",

], function (angular, MF) {
    return angular
        .module("ReftreeAdhoxViewer", [
            "kendo.directives",
            "angular.filter",
            "ui.bootstrap",
            "treeBimR3",
            "magicGrid",
            "angular.drag.resize",
            "AdhoxViewer",
        ])
        .controller("ReftreeAdhoxViewerController", [
            "config",
            "$scope",
            "$timeout",
            "$compile",
            "$uibModal",
            function (config, $scope, $timeout, $compile, $uibModal) {
                var self = this;



            }
        ]);


});