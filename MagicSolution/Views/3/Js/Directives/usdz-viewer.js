define(["angular"], function (angular) {
    angular
        .module("usdzViewer", [])
        .directive("usdzViewer",
        function ($timeout) {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        filename: "=",
                    },
                    template : '<div id="usdz_1"\
                             class="usdz-viewer-container"\
                             style="position:relative;"></div>',
                    //template: ' <iframe id="iframeUsdz" src="https://usdzviewer.reftree.it" credentialless> </iframe>',    
                    //template: ' <iframe id="iframeUsdz" ng-init="u.init()" sandbox="allow-same-origin allow-forms allow-scripts" style=width="1000px" height="1000px" srcdoc="<div ng-init=\'u.init()\' id=\'usdz_1\'\
                    //            class= \'usdz-viewer-container\'\
                    //            style=\'position:relative;\'\
                    //        ></div>"></iframe>',                       
                    //templateUrl: window.includesVersion + '/Views/3/Templates/dxfViewer.html',
                    controllerAs: "u",
                    link: function (scope, element, attrs) {
                        
                        $timeout(function () {
                            console.log(element);
                        }, 0);
                    },
                    controller: [
                        '$scope',
                        '$element',
                        '$timeout',
                        '$sce',
                        '$http',
                        function ($scope, $element, $timeout, $sce,$http) {
                            var self = this;
                            var element = $element.find('.usdz-viewer-container')[0];
                            var hdr = window.includesVersion + "/Views/3/Js/usdz-viewer/hdr/royal_esplanade_1k.hdr";
                            var wasm = window.includesVersion + "/Views/3/Js/usdz-viewer/wasm";
                            var usdzViewer;
                             
                            self.pathFileOrigin = "/api/MAGIC_SAVEFILE/GetFile?path=RILAPP/RILEVAZIONE/";

                            self.init = function init() {
                                console.log('init');
                            }

                            $scope.$watch('d.fileName', function (newOne, oldOne) {
                                if (!usdzViewer) {
                                    if (typeof usdzViewer == "undefined") {
                                        require(["usdz-viewer"], function (a) {
                                            usdzViewer = a;
                                            if (self.filename.endsWith('.ply')) {
                                                self.usdzViewer = new usdzViewer.PLYViewer(element);
                                            } else {
                                                self.usdzViewer = new usdzViewer.USDZViewer(element, hdr, wasm);
                                            }
                                            self.loadUsdzIntoViewer();
                                        });
                                    }
                                    else {

                                        self.usdzViewer = new usdzViewer.USDZViewer(element, hdr, wasm);
                                    }

                                }
                            });                            

                            self.loadUsdzIntoViewer = function setFiles() {
                                var filename = self.filename;

                                if (!filename)
                                    return;

                                self.usdzViewer.initViewer().then(function () {
                                    doModal(true);
                                    self.usdzViewer.loadFile(self.pathFileOrigin + encodeURIComponent(filename)).then(function () {
                                        doModal(false);
                                        console.log('file caricato');
                                    }, function err() {
                                        doModal(false);
                                    });
                                });
                            }
                             
                            $scope.$on('$destroy', function () {
                                self.destroyViewer();
                            });

                            self.destroyViewer = function destroyViewer() {
                                if (self.usdzViewer) {
                                    if (self.usdzViewer.controls) {
                                        self.usdzViewer.dispose();
                                        self.usdzViewer = null;
                                    }
                                    
                                }
                            };
                        }]
                }
            }
        )
});