define([
    "angular",
    "MagicSDK",
    "reftree-action-menu"
], function (angular, MF, tree) {
    return angular
        .module("reftreeDirective", [
            "kendo.directives",
            "reftreeActionMenu",
        ])
        .controller("reftreeDirectiveController", [
            "config",
            "$scope",
            "$compile",
            function (config, $scope, $compile
                //, $uibModalInstance
            ) {
                var self = this;
                self.reloadHtmlPage = true;
                self.actionTemplate = config.actionTemplate;
                self.multiAction = config.multiAction ? config.multiAction : false;
                self.spActionToLaunch = config.spActionToLaunch ? config.spActionToLaunch : undefined;
                self.spMultiActionToLaunch = config.spMultiActionToLaunch ? config.spMultiActionToLaunch : undefined;

                self.requestData = {
                    entityname: config.entityname, //'core.SG_VI_REQUES_L_USER_ASS',                    //Rendere parametrico...
                    id: config.rowData.id,
                    pk: config.pk,
                    queryType: 'stageactions',
                    functionGUID: null,
                    gridName: config.entityname,
                    masterEntityName: config.entityname, //'core.SG_VI_REQUES_L_USER_ASS',             //Rendere parametrico...
                    itemid: !config.rowData.id ? 0 : config.rowData.id,
                    type: 'A',
                    ugvi: !config.rowData.US_AREVIS_ID ? 0 : config.rowData.US_AREVIS_ID
                };

                tDivAction = angular.element($("div[name='divAction']"));
                tDivAction.empty();
                tDivAction.html('<reftree-action-menu request-data="d.requestData" my-html="d.actionTemplate" multi-action="d.multiAction" sp-action-to-launch="d.spActionToLaunch" sp-multi-action-to-launch="d.spMultiActionToLaunch"></reftree-action-menu>');
                $compile(tDivAction.contents())($scope);
               
            }
        ])

});