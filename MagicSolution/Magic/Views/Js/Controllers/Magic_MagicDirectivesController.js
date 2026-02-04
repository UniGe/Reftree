define([
    "angular",
    "MagicSDK",
    "angular-magic-grid",
    "angular-magic-chart",
    "angular-magic-form-sp",
    "angular-magic-pivot",
    "angular-magic-tree",
    "angular-magic-timesheet",
    "angular-magic-change-log",
    "angular-magic-grid-sp",
    "angular-magic-chart-gauge",
    "angular-magic-wizard"
], function (angular, MF) {
    var app = angular
        .module('MagicDirectives', [
            "magicGrid", "magicChart", "magicFormSp", "magicPivot", "magicTree", "magicTimesheet", "magicChangeLog", "magicGridSp", "magicChartGauge", "magicWizard"
        ])
        .controller('MagicDirectivesController',
            [
                'config',
                '$timeout',
                '$scope',
                '$compile',
                function (config, $timeout, $scope, $compile) {
                    var self = this;
                    self.renderDone = false;
                    self.spinner = largeSpinnerHTML;
                    self.randomId = Math.random() + "";
                    self.randomId = self.randomId.substring(2);
                    self.$timeout = $timeout;
                    self.$scope = $scope;

                    config.data = config.data || config.rowData || {};
                    self.config = config;

                    if (config.angularControllerExtension) {
                        var pathInfo = getPathInfoFromJSFilename(config.angularControllerExtension);
                        require(
                            [
                                pathInfo.path
                            ],
                            function (controllerInfo) {
                                var promises = [];
                                var jsPromise = null;
                                var htmlPromise = $.Deferred();
                                if (controllerInfo.js) {
                                    jsPromise = controllerInfo
                                        .js(self)
                                        .then(function (js) {
                                            $.extend(self, js);
                                            $.extend($scope, js);
                                        });
                                    promises.push(jsPromise);
                                }
                                if (controllerInfo.html) {
                                    if (jsPromise == null)
                                        jsPromise = $.Deferred().resolve().promise();
                                    jsPromise
                                        .then(function () {
                                            controllerInfo
                                                .html(self)
                                                .then(function (html) {
                                                    setHtml(htmlPromise, html);
                                                });
                                        });
                                    promises.push(htmlPromise.promise());
                                }
                                $
                                    .when
                                    .apply($, promises)
                                    .then(function () {
                                        self.renderDone = true;
                                        $timeout();
                                    });
                            }
                        );
                    }

                    function setHtml(htmlPromise, html) {
                        var $element = $('#magic-directives-' + self.randomId);
                        if ($element.length > 0) {
                            var $el = $compile(html)($scope);
                            $element.html($el);
                            htmlPromise.resolve();
                        }
                        else
                            setTimeout(function () {
                                setHtml(htmlPromise, html)
                            }, 250);
                    }
                    
                }
            ]
        );

    return app;
});