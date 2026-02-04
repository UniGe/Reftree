define([
    "angular",
    "https://api-stg-eggon-forge.herokuapp.com/lib/viewer.js",

], function (angular) {
    angular
        .module("AdhoxViewer", [])
        .directive("AdhoxViewer",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    template:'<div id="forgeViewer"></div>',
                    bindToController: {
                        onInit: "=",
                    },
                    controller: [
                        '$scope',
                        '$element',
                        '$timeout',
                        '$sce',
                        function ($scope, $element, $timeout, $sce) {
                            var self = this;
                            self.Forge = {
                                // State
                                initiated: false,
                                // Viewer
                                viewer: null,
                                // Configs
                                api_endpoint: 'https://api-stg-eggon-forge.herokuapp.com', // TODO - Insert endpoint here
                                api_token: null,
                                // Events
                                evt: {
                                    SELECTION: "selection" // Forge.viewer.addEventListener(Forge.evt.SELECTION, callback);
                                }
                            }

                            self.init = function init(pi_token, opt = {}) {
                                if (this.initiated) return new Promise((r) => r(true));
                                else this.initiated = true;
                                this.api_token = api_token;

                                if (opt.api_endpoint) this.api_endpoint = opt.api_endpoint;

                                return Promise.all([
                                    this.loadScript('https://xf79h9aa3l.execute-api.us-west-2.amazonaws.com/toolkit2/api/_adsk.js'),
                                    this.loadScript('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js'),
                                    this.loadStyle('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'),
                                ]);
                            };
                        }
                    ]
                }
            }
        );
}
);
