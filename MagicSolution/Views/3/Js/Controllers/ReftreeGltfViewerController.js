define([
    "angular",
    "MagicSDK",
    "angular-kendo",
    "angular-ui-bootstrap",
    "angular-gltf-viewer",
], function (angular, MF) {
    return angular
        .module("ReftreeGltfViewer", [
            "ui.bootstrap",
            "kendo.directives",
            "gltfViewer",
        ])
        .controller("ReftreeGltfViewerController", [
            "config",
            "$timeout",
            "$scope",
            "$http",
            function (config, $timeout, $scope, $uibModal) {
                var self = this;
                self.loadFile = false;
                self.files = [];
                self.bShowHideViewer = true;
                config.ready();

                self.labels = {
                    filesList: {
                        it: 'Elenco file',
                        en: 'Files list',
                    }
                }


                self.filename = "";
                self.pathfile = "";

                self.gridSelection = config.grid.select();
                self.gridSelectionData = $.map(self.gridSelection, function (val) {
                    return config.grid.dataItem(val)
                });
                var sourcegridname = config.id.replace("dwg_", '');

                var sourceItemIds = $.map(self.gridSelectionData, function (v, i) {
                    return v.WorkflowInstance_ID ? v.WorkflowInstance_ID : v.id;
                });

                self.features = {
                    map: true,
                    sidebarAccordion: true,
                    closeButton: true,
                };

                self.triggerWindowResize = function triggerWindowResize() {
                    window.dispatchEvent(new Event('resize'));
                    self.resizeMenuReftree();
                };

                self.getLabels = function (key) {
                    if (key in self.labels) {
                        return self.labels[key][window.culture.substring(0, 2)];
                    }
                    return getObjectText(key);
                };

                self.getFile = function getFile() {
                    config.MF.api
                        .get({
                            storedProcedureName: "core.rnw_sp_getFileUsdz",
                            gridData: {
                                gridname: sourcegridname,
                                id: sourceItemIds,
                            },

                        })
                        .then(
                            function (result) {
                                if (!result.length) {
                                    return;
                                }

                                $.each(result[0], function (i, v) {
                                    self.files.push(v);
                                });

                                $timeout();

                            },
                            function (err) {
                                console.log('Errore: ' + err);
                            },
                        );
                }

                self.onLoadFile = function onLoadFile(file) {
                    self.loadFile = false;
                    self.filename = file.filename;
                    self.pathfile = file.pathfile;

                    $timeout(function () {
                        self.loadFile = true;
                    }, 1000);
                }

                self.resizeMenuReftree = function () {
                    if (!$('#main-menu').hasClass('mini')) {

                        $('#main-menu').addClass('mini');
                        $('.page-content').addClass('condensed');
                        $('.scrollup').addClass('to-edge');
                        $('.header-seperation').hide();
                        $('.footer-widget').hide();
                        $('#main-menu').find('li').hide();
                    }
                    $(document).trigger('menuToggled');
                    calculateHeight();
                }

                self.closeViewer = function (event) {
                    $(event.currentTarget)
                        .closest("#grid-gltf-controller")
                        .hide(1000);
                    $(event.currentTarget).closest("#grid-gltf-controller").remove();
                    $scope.$destroy();
                };

                self.showHideViewer = function showHideViewer() {
                    self.bShowHideViewer = !self.bShowHideViewer;
                }

                self.init = function init() {
                    self.getFile();
                }
            }
        ])
});

