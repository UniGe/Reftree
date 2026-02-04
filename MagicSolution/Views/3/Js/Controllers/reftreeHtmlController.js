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
        .module("reftreeHtml", [
            "ui.bootstrap",
            "kendo.directives",
            "dxfViewer",
            "magicGrid",
            "easyMap",
            "treeViewR3",
            "angular.filter",
            "magicFormSp",
        ])
        .controller("reftreeHtmlController", [
            "config",
            "$timeout",
            "$scope",
            "$uibModal",
            "$sce",
            "$compile",
            function (config, $timeout, $scope, $uibModal, $sce, $compile, ) {
                var self = this;

                self.prova = "CIAO"
                self.storedForHtmlForm = [];
                self.formName = config.actioncommand.formName;
                self.customForm = {};
                self.tab = ''
                self.startForm = false;


                self.getConfigHtml = function getConfigHtml() {
                    MF.api
                        .get({
                            storedProcedureName: self.storedForHtmlForm['HTML_SP_Config'] ? self.storedForHtmlForm['HTML_SP_Config'] : "config.HTML_SP_Config",
                            formName: self.formName,
                        })
                        .then(
                        function (result) {


                            $timeout(function () {

                                try {
                                    self.customForm = result[0];
                                    var oTab = ''
                                    var OtabDetail = ''

                                    oTab += '<magic-form-sp storedprocedure="config.USP_GET_FormData" isreadonly="false" hidetabs="true" formname="CONTRA_TEST"></magic-form-sp>';
                                    oTab += '<div id="tab-princ" class="panel with-nav-tabs panel-default">';
                                    OtabDetail += '<div class="tab-content-r3 tab-content">';
                                    oTab += '<ul class="nav nav-tabs ul-nav-r3">';

                                    $.each(self.customForm, function (i, tab) {
                                        oTab += '<li class="' + (i == 0 ? 'active ' : ' ') + 'li-nav-r3"><a href="#tab' + tab.HT_TABHML_ID + '" data-toggle="tab">' + tab.HT_TABHML_DESCRIPTION + '</a></li>'
                                        OtabDetail += '<div class="tab-pane fade ' + (i == 0 ? 'active in ' : ' ') + '" id="tab' + tab.HT_TABHML_ID + '">' + tab.HT_TABHML_DESCRIPTION + '</div>'
                                    });

                                    oTab += '</ul>'
                                    oTab += OtabDetail
                                    oTab += '</div>'


                                    angular.element($("#tabAppend")).empty().append($compile(oTab)($scope, function (clonedElement) {
                                        console.log(clonedElement);
                                    }));

                                }
                                catch (e) {
                                    console.log(e);
                                }
                            }, 1000);
                                


                            },
                            function (err) {
                                console.log(err);
                            },
                        );
                }

                self.init = function init() {
                    self.getConfigHtml();
                    self.startForm = true;
                }

                self.init();

            }
        ])
        .directive('reftreeHtml', ["$compile", function ($compile) {
            return {
                restrict: 'E',
                scope: {
                    localNodes: '=model',
                    localClick: '&click',
                    checkChange: '&change',
                    selectedNode: '=',
                    searchTree: "&search",
                    bFilterTree: "=",
                    onSearchDropDown: "&onSearchDropDown",
                    localFilterDrop: '=modelDrop',
                    dataSource: "=source",
                    onCheckBlock: "=",
                    bSelectedAll: "=",
                    selectedNodeBlock: '=',
                    onShowBlock: "&onShowBlock"
                },
                link: function (scope, tElement, tAttrs, transclude) {
 
                    
                    self.initForm = function initForm() {
                        console.log(scope);
                    };

                    self.initForm();

                },
            };
        }]);
});