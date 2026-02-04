define(["angular", "ThreeGLTFViewer"], function (angular, ThreeGLTFViewer) {
    angular
        .module("gltfViewer", [])
        .directive("gltfViewer",
            function ($timeout) {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        filename: "=",
                        pathfile: "=",
                    },
                    template: '<div id="gltf_1"\
                             class="gltf-viewer-container"\
                             style="position:relative;"></div>',
                    controllerAs: "glt",
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
                        function ($scope, $element, $timeout, $sce, $http) {
                            var self = this;
                            var element = $element.find('.gltf-viewer-container')[0];

                            self.pathFileOrigin = self.pathfile.replace(/\\/g, "/");
                            //"/api/MAGIC_SAVEFILE/GetFile?path=RILAPP/RILEVAZIONE/";

                            $scope.$watch('d.filename', function (newOne, oldOne) {
                                if (self.filename.split('.').pop() != 'glb') {
                                    kendoConsole.log('Errore nel caricamento del file.', true);
                                    return
                                }

                                const viewer = new ThreeGLTFViewer.GLTFViewer({
                                    container: element,
                                    model: self.pathFileOrigin + encodeURIComponent(self.filename)
                                });
                            });
                        }]
                }
            }
        )
});