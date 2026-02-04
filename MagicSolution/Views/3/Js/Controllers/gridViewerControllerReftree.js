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

], function (angular, MF) {
    return angular
        .module("gridViewerReftree", [
            "ui.bootstrap",
            "kendo.directives",
            "dxfViewer",
            "magicGrid",
            "easyMap",
            "treeViewR3",
            "angular.filter",

        ])
        .controller("gridViewerReftreeController", [
            "config",
            "$timeout",
            "$scope",
            "$uibModal",
            "$sce",
            function (config, _$timeout, $scope, $uibModal, $sce) {
                var self = this;
                console.log(self);

                self.triggerWindowResize = function triggerWindowResize() {
                    window.dispatchEvent(new Event('resize'));
                };

            },
        ]);
});