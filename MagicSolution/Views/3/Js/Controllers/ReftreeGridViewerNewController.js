define([
    "angular",
    "MagicSDK",
    "angular-kendo",
    "angular-magic-form-sp",
    "angular-ui-bootstrap",
    "angular-dxf-viewer",
    "angular-magic-grid",
    "angular-easy-map",
    "tree-view-r3",
    "angular-filter",
    "reftree-action-menu",
    "angular-magic-grid-sp",
    "zip",
], function (angular, MF, zip) {
    return angular
        .module("ReftreeGridViewerNew", [
            "ui.bootstrap",
            "kendo.directives",
            "dxfViewer",
            "magicGrid",
            "easyMap",
            "treeViewR3",
            "angular.filter",
            "reftreeActionMenu",
            "magicGridSp",
            'ngSanitize'
        ])
        .controller("ReftreeGridViewerNewController", [
            "config",
            "$timeout",
            "$scope",
            "$uibModal",
            "$sce",
            function (config, $timeout, $scope, $uibModal, $sce) {
                var self = this;

                self.showViewerDetail = false;

                config.ready();



            }
        ])
    });