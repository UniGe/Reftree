define([ //requireJs deps    
    "angular",
    "MagicSDK",
    "angular-ui-bootstrap",
    "angular-easy-map",
], function (angular, MF) {
    return angular
        .module("ReftreeShowcaseViewer", ["ui.bootstrap", "easyMap" ,    
        ])
        .controller("ReftreeShowcaseViewerController", [
            "config",
            "$scope",
            "$timeout",
            "$uibModal",
            "$sce",
            function (config, $scope, $timeout, $uibModal, $sce,) {
                var self = this;
                self.assets = [];
                self.mapMarkers = [];
                self.isGridEditPage = config.isGridEditPage;
                self.ContainerAll = {
                    'all': true,
                    'pictures': false,
                    'floorPlans': false,
                    'videos': false,
                    'documents': false,
                    'warning': false
                };
                self.docToDownload = [];

                self.classReadAll = {
                    'descriptions-content': false
                }

                self.backGroubndSlider = "url('" + window.includesVersion + '/Views/3/Images/sfondo_vetrina_immo.png' + "')";
                self.backGroubndSlider = '';
                $('.page-title').hide();

                self.getLabels = function (key) {
                    if (key in self.labels) {
                        return self.labels[key][window.culture.substring(0, 2)];
                    }
                    return getObjectText(key);
                };

                self.labels = {
                    Descrizione: {
                        it: 'Descrizione',
                        en: 'Description',
                    },
                    Caratteristiche: {
                        it: 'Caratteristiche',
                        en: 'Characteristics',
                    },
                    Locali: {
                        it: 'Locali',
                        en: 'Locals',
                    },
                    Bagni: {
                        it: 'Bagni',
                        en: 'Bathrooms',
                    },
                    Superficie: {
                        it: 'Superficie',
                        en: 'Surface',
                    },
                    Piano: {
                        it: 'Piano',
                        en: 'Floor',
                    },
                    Piani: {
                        it: 'Piani',
                        en: 'Floors',
                    },
                    Lusso: {
                        it: 'Lusso',
                        en: 'Luxury',
                    },
                    rif: {
                        it: 'Riferimento e data annuncio',
                        en: 'Reference code and date',
                    },
                    contratto: {
                        it: 'Contratto',
                        en: 'Contract',
                    },
                    totPiani: {
                        it: 'Totale piani',
                        en: 'Tot FLoors',
                    },
                    disponibilita: {
                        it: 'Disponibilita',
                        en: 'Disponibilita',
                    },
                    costi: {
                        it: 'Costi',
                        en: 'Costs',
                    },
                    prezzo: {
                        it: 'Prezzo',
                        en: 'Price',
                    },
                    specond: {
                        it: 'Spese condominio',
                        en: 'Spese condominio',
                    },
                    APE: {
                        it: 'Efficienza energetica',
                        en: 'Efficienza energetica',
                    },
                    annoCostr: {
                        it: 'Anno di costruzione',
                        en: 'Anno di costruzione',
                    },
                    stato: {
                        it: 'Stato',
                        en: 'Status',
                    },
                    Riscaldamento: {
                        it: 'Riscaldamento',
                        en: 'Riscaldamento',
                    },
                    planimetria: {
                        it: 'Planimetria',
                        en: 'Planimetria',
                    },
                    classe: {
                        it: 'Classe',
                        en: 'class',
                    },
                    readAll: {
                        it: 'Leggi tutto',
                        en: 'Read all',
                    },
                    mappa: {
                        it: 'Mappa',
                        en: 'Maps',
                    },
                    giardino: {
                        it: 'Giardino',
                        en: 'Garden',
                    },
                    terazzo: {
                        it: 'Terrazzo',
                        en: 'Terrace',
                    },
                    balcone: {
                        it: 'Balcone',
                        en: 'Balcony',
                    },
                    ascensore: {
                        it: 'Ascensore',
                        en: 'Elevator',
                    },
                    impiantoTv: {
                        it: 'Impianto TV',
                        en: 'tv',
                    },
                    porta: {
                        it: 'Porta blindata',
                        en: 'Security door',
                    },
                    cantina: {
                        it: 'Cantina',
                        en: 'Basement',
                    },
                    apriVideo: {
                        it: 'Video',
                        en: 'Videos',
                    },
                    APEVAL: {
                        it: 'APE Valore',
                        en: 'APE value',
                    },
                    apriFoto: {
                        it: 'Foto',
                        en: 'Photo',
                    },
                    apriPlanimetrie: {
                        it: 'Planimetrie',
                        en: 'Floor planners',
                    },
                    apriDocumenti: {
                        it: 'Documenti',
                        en: 'Documents',
                    },
                    apriWarning: {
                        it: 'Warning',
                        en: 'Warning',
                    },
                    Top: {
                        it: 'Top',
                        en: 'Top',
                    }
                }

                self.onLoadAsset = function onLoadAsset() {
                    MF.api.get({
                        storedProcedureName: "core.AS_SP_ASSET_SHOWCASE_GET_XML",
                        models: config.rowData,
                        data: {
                            ApplicationInstanceId: window.ApplicationInstanceId
                        }
                    }).then(function (result) {
                        if (!result[0]) {
                            console.log('Stored personalizzate non trovate.')
                            return
                        }

                        if (result[1]) {
                            self.labels = Object.assign(self.labels, JSON.parse(result[1][0].labelsToAdd));
                        }

                        $.each(result[0], function (ii, vv) {

                            $.each(JSON.parse(vv.assets), function (i, v) {
                                v['descriptions-content'] != null ? v['descriptions-content'] = $sce.trustAsHtml(v['descriptions-content'].replaceAll('\n', '<br>')) : '';
                                v.warnings = v['warning'] != null ? v['warning'].split(",") : [];
                                v.mapMarkers = [];
                                console.log(v)
                                


                                v.mapMarkers.push({
                                    id: v.AS_ASSET_ID,
                                    LOCATION_ID: v.LOCATION_ID,
                                    longitude: v.longitude,
                                    latitude: v.latitude,
                                });

                                v.documents = $.map(v.documentsAll, function (docume) {
                                    if (v.AS_ASSET_ID == docume.AS_ASSET_ID && docume.DOCUMENTS) {
                                        return docume
                                    }
                                });

                                v.pictures = $.map(v.documentsAll, function (docume) {
                                    if (v.AS_ASSET_ID == docume.AS_ASSET_ID && docume.PICTURES) {
                                        return docume
                                    }
                                });

                                v.floorPlans = $.map(v.documentsAll, function (docume) {
                                    if (v.AS_ASSET_ID == docume.AS_ASSET_ID && docume.PLANIMETRIA && docume.isFloorPlans) {
                                        return docume
                                    }
                                });

                                v.videos = $.map(v.documentsAll, function (docume) {
                                    if (v.AS_ASSET_ID == docume.AS_ASSET_ID && docume.VIDEO) {
                                        return docume
                                    }
                                });

                                v.broker = $.map(v.brokersAll, function (broker) {
                                    if (v.AS_ASSET_ID == broker.AS_ASSET_ID) {
                                        return broker
                                    }
                                });

                                self.assets.push(v);
                            });

                        });

                        if (!self.isGridEditPage) {
                            self.onOpenPreView();
                        }

                    }, function (err) {
                        console.log(err);
                    });
                }

                self.onOpenPreView = function onOpenPreView() {
                    $uibModal.open({
                        templateUrl: window.includesVersion + '/Views/3/Templates/ReftreeShowcaseViewer.html', //sTemplate, // loads the template
                        animation: true,
                        backdrop: false, // setting backdrop allows us to close the modal window on clicking outside the modal window
                        windowClass: 'portal-window', // windowClass - additional CSS class(es) to be added to a modal window template
                        size: '',
                        scope: $scope,
                        controller: ("previewController", ["$scope", "$uibModalInstance", function (
                            $scope,
                            $uibModalInstance,

                        ) {
                            $scope.start = true;
                            $scope.assets = self.assets;
                            $scope.startMaps = true;

                            $scope.cancel = function () {
                                if ($scope.$parent.rsv.ContainerAll['all']) {
                                    $uibModalInstance.dismiss("cancel");
                                } else {
                                    self.onChangePage('all');
                                }

                            };
                        }]),
                        resolve: {
                            user: function () {
                                return "hello";
                            },
                        },
                    }); //end of modal.
                }

                self.onLoadAsset();

                self.onDownload = function onDownload() {
                    data = [];

                    $.each(self.docToDownload, function (i, v) {
                        var obj = {
                            DO_DOCUME_ID: 0,
                            OBJECT_ID: 0,
                        };
                        obj.DO_DOCUME_ID = v.DO_DOCUME_ID;
                        obj.OBJECT_ID = v.AS_ASSET_ID;
                        data.push(obj);
                    });

                    var objpost = {
                        list: []
                    };

                    objpost.list = data;

                    $.fileDownload("/api/Documentale/ExportzipforDocumentList/", {
                        data: objpost,
                        httpMethod: "POST",
                    });

                }


                self.onDownloadObj = function onDownloadObj(docToDownload) {
                    data = [];

                    $.each(docToDownload, function (i, v) {
                        var obj = {
                            DO_DOCUME_ID: 0,
                            OBJECT_ID: 0,
                        };
                        obj.DO_DOCUME_ID = v.DO_DOCUME_ID;
                        obj.OBJECT_ID = v.AS_ASSET_ID;
                        data.push(obj);
                    });

                    var objpost = {
                        list: []
                    };

                    objpost.list = data;

                    $.fileDownload("/api/Documentale/ExportzipforDocumentList/", {
                        data: objpost,
                        httpMethod: "POST",
                    });

                }

                self.onChangePage = function onChangePage(current, asset) {
                    for (page in self.ContainerAll) {
                        self.ContainerAll[page] = false;
                    }

                    self.ContainerAll[current] = true;

                    if (current == 'all') {
                        self.docToDownload = [];
                    }
                    if (current == 'pictures') {
                        self.docToDownload = asset.pictures;
                    }
                    if (current == 'videos') {
                        self.docToDownload = asset.videos;
                    }
                    if (current == 'documents') {
                        self.docToDownload = asset.documents;
                    }
                    if (current == 'floorPlans') {
                        self.docToDownload = asset.floorPlans;
                    }

                }

                config.ready();

            }
        ])
        .directive('slider', ["$compile", function ($compile) {
            return {
                restrict: 'AE',
                replace: true,
                scope: {
                    images: '=',
                    asset: '=',
                    rsv: '='

                },
                link: function (scope, elem, attrs) { },
                templateUrl: 'templateurl.html',
                link: function (scope) {
                    scope.currentIndex = 0; // Initially the index is at the first image


                    scope.next = function () {
                        scope.currentIndex < scope.images.length - 1 ? scope.currentIndex++ : scope.currentIndex = 0;
                    };

                    scope.prev = function () {
                        scope.currentIndex > 0 ? scope.currentIndex-- : scope.currentIndex = scope.images.length - 1;
                    };

                    scope.$watch('currentIndex', function () {
                        scope.images.forEach(function (image) {
                            image.visible = false; // make every image invisible
                        });

                        if (scope.images.length > 0) {
                            scope.images[scope.currentIndex].visible = true; // make the current image visible
                        }

                    });
                },
            };
        }]);

});