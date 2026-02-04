define([
    "angular",
    "MagicSDK",
    "tree-view-r3",
    "angular-kendo",
    "angular-magic-form-sp",
    "angular-ui-bootstrap",
    "angular-magic-grid",
    "angular-easy-map",
    "angular-magic-action-menu",
    "reftree-action-menu",
    "angular-magic-grid-sp",
], function (angular, MF) {
    return angular
        .module("reftreeNews", [
            "treeViewR3",
            "kendo.directives",
            "magicFormSp",
            "ui.bootstrap",
            "treeViewR3",
            "magicGrid",
            "easyMap",
            "magicActionMenu",
            "reftreeActionMenu",
            "magicGridSp",
        ])
        .controller("reftreeNewsController", [
            "config",
            "$timeout",
            "$scope",
            "$compile",
            "$uibModal",
            function (config, $timeout, $scope, $compile, $uibModal
            ) {

                var self = this;
              

               
            }
        ])

});