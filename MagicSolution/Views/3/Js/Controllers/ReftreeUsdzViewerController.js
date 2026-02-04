define([
    "angular",
    "MagicSDK",
    "angular-kendo",
    //"angular-magic-form-sp",
    "angular-ui-bootstrap",
    "angular-usdz-viewer",
    //"angular-magic-grid",
    //"angular-easy-map",
    //"tree-view-r3",
    //"angular-filter",
    //"reftree-action-menu",
    //"angular-magic-grid-sp",
    //"zip",
], function (angular, MF) {
    return angular
        .module("ReftreeUsdzViewer", [
            "ui.bootstrap",
            "kendo.directives",
            "usdzViewer",
            //"magicGrid",
            //"easyMap",
            //"treeViewR3",
            //"angular.filter",
            //"reftreeActionMenu",
            //"magicGridSp",
            //'ngSanitize'
        ])
        .controller("ReftreeUsdzViewerController", [
            "config",
            "$timeout",
            "$scope",
            "$http",
            //"$uibModal",
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

                self.gridSelection = config.grid.select();
                self.gridSelectionData = $.map(self.gridSelection, function (val) {
                    return config.grid.dataItem(val)
                });
                var sourcegridname = config.id.replace("usdz_", '');
                //var sourceItemIds = $.map(self.gridSelectionData, function (v, i) {
                //    return v.AS_ASSET_ID ? v.AS_ASSET_ID : v.id;
                //});

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

                self.onLoadFile = function onLoadFile(filename) {
                    self.loadFile = false;
                    self.filename = filename;
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
                    var oGrid = $('div[gridname="' + sourcegridname + '"]');

                    if (oGrid.length > 0 && !!oGrid.data('kendoGrid')) {
                        oGrid.data('kendoGrid').dataSource.filter(filterSel);
                    }


                    $(event.currentTarget)
                        .closest("#grid-usdz-controller")
                        .hide(1000);

                    $(event.currentTarget).closest("#grid-usdz-controller").remove();

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
        
