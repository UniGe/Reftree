define(["angular", "angular-devExpress-globalized", "devExpress"], function (angular, devExpressReady) {
    loadCss(["dx.common", "dx.light"], window.includesVersion + "/Magic/DevExtreme/Lib/css/");
    var app = angular.module("magicPivot", ["dx"]),
        compileProvider;
    app
        .config([
            '$compileProvider',
            function ($compileProvider) {
                compileProvider = $compileProvider;
            }])
        .directive("magicPivot",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        pivotCodes: "=",
						pivotOptions: "=",
						pivotFilter: "=",
						outerGrid: "="
                    },
                    template: '',
                    controllerAs: "c",
                    controller: [
                        '$timeout',
                        '$element',
                        '$compile',
                        '$scope',
                        function ($timeout, $element, $compile, $scope) {
                            var self = this;
                            devExpressReady
                                .then(function () {
                                    require([window.includesVersion + '/Magic/Views/Js/Directives/magic-pivot-logic.js'], function (directive) {
                                        compileProvider.directive.apply(null, directive);
                                        var $el = $compile('<magic-pivot-logic outer-grid="c.outerGrid" pivot-filter="c.pivotFilter" pivot-codes="c.pivotCodes" pivot-options="c.pivotOptions"></magic-pivot-logic>')($scope);
                                        $element.html($el);
                                        $timeout();
                                    });
                                });
                        }
                    ]
                }
            });
});