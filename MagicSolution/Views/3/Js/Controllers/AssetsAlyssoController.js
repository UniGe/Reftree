(function () {
    var dependencies = ["angular", "MagicSDK", "angular-kendo"];
    var angular,
    controllerName = "AssetsAlysso";

    define(dependencies, function (a) {
        //window.alyssoSelect = function () { };
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true, null, "initAlysso"))[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        angular
            .module(controllerName, ["kendo.directives"])
            .controller(controllerName + "Controller", [
                '$timeout',
                '$http',
                '$scope',
                function ($timeout, $http, $scope) {
                    var self = this,
                        assetIdMatch = window.location.search.replace("?", "").match(/AS_ASSET_ID=([\d,]+)/),
                        gridCodeMatch = window.location.search.replace("?", "").match(/CODE=([a-zA-Z_]+)/),
                        p3dmaps;
                    self.latlongCenter = {};
                    self.view = "grid";
                    self.gridObject = {};
                    self.asset = null,
                        self.mapLoaded = isMobile();
                    self.is3d = false;
                    if (assetIdMatch)
                        self.mapLoaded = false;
                    self.showGrid = !self.mapLoaded;
                    self.showCatasto = false;
                    self.dropdownOptions = {
                        dataSource: [{
                            label: getObjectText("showOnMap"),
                            value: "showOnMap"
                        }, {
                            label: getObjectText("showTickets"),
                            value: "showTickets"
                        }, {
                            label: getObjectText("showDocuments"),
                            value: "showDocuments"
                        }],
                        dataTextField: "label",
                        dataValueField: "value",
                        optionLabel: {
                            label: '',
                            value: ''
                        },
                        optionLabelTemplate: '<span class="fa fa-sign-out"></span>',
                        open: function (e) {
                            e.sender.list.width("auto");
                        },
                        change: function (e) {
                            var value = this.value();
                            if (value) {
                                var uid = e.sender.wrapper.closest('tr[data-uid]').data("uid"),
                                    asset = self.gridInstance.dataSource.getByUid(uid);
                                if (value == "showOnMap") {
                                    self.asset = [asset];
                                    self.showGrid = false;
                                    self.mapLoaded = true;
                                    $timeout();
                                } else {
                                    var guid;
                                    switch (value) {
                                        case "showTickets":
                                            guid = "E852F0B3-C191-469D-B909-3887F78EB867";
                                            break;
                                        case "showDocuments":
                                            guid = "5A9D2774-7F39-421B-A4F0-D7BF45C9DB0E";
                                            break;
                                    }
                                    redirectToFunction(guid, "?AS_ASSET_ID=" + asset.AS_ASSET_ID);
                                }
                            }
                        }
                    };

                    self.initAlysso = function () {
                        $.ajax({    //mfapireplaced
                            type: "GET",
                            url: "/api/MF_API/GetACCPAT_AccessPaths",
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            error: function (err) { console.log("ERROR while getting ACCPAT_AccessPaths", err) },
                        }).then(
                            function (res) {
                                var settings = res.Data[0].Table; 

                                var dbSettingsAdapter = function (obj) {
                                    var output = {};
                                    if (obj.ACCPAT_ServerName)
                                        output.server = obj.ACCPAT_ServerName;
                                    if (obj.ACCPAT_AlyssoMapLayers)
                                        output.layers = JSON.parse(obj.ACCPAT_AlyssoMapLayers);
                                    if (obj.ACCPAT_AlyssoZoom)
                                        output.zoom = parseInt(obj.ACCPAT_AlyssoZoom);
                                    if (obj.ACCPAT_AlyssoMaps)
                                        output.maps = obj.ACCPAT_AlyssoMaps;
                                    if (obj.ACCPAT_AlyssoLatitudine && obj.ACCPAT_AlyssoLongitude)
                                        self.latlongCenter[obj.ACCPAT_TYPE] = { latitude: obj.ACCPAT_AlyssoLatitudine, longitude: obj.ACCPAT_AlyssoLongitude, zoom: obj.ACCPAT_AlyssoZoom ? obj.ACCPAT_AlyssoZoom : 15 };

                                    return output;
                                };
                                //alysso config settings
                                self.tematSettings = $.extend({
                                    server: '94.177.184.169', // '213.203.177.28:8765' 'srvtest01:8765' 'refp3d-demo:8081'
                                    layers: ['OSM', 'RV', 'v_CAT'],
                                    //tematismi: data,
                                    imgpath: '/views/3/tematismi/maps2.0/',
                                    ricerche: ['search-parcel', 'search-address'],
                                    maps: "to2"
                                },
                                    dbSettingsAdapter(settings.filter(function (v) {
                                        if (v.ACCPAT_TYPE == "TEMAT") {
                                            return v;
                                        }
                                    })[0] || {}));

                                self.catastoSettings = $.extend({
                                    server: '94.177.184.169',
                                    maps: 'pds2',
                                    layers: ['v_CAT', 'v_CATp', 'RV', 'OSM'],
                                    // center: [1237766, 5791005],
                                    zoom: 16,
                                    target: "p3dt-catasto"
                                },
                                    dbSettingsAdapter(settings.filter(function (v) {
                                        if (v.ACCPAT_TYPE == "GEO")
                                            return v;
                                    })[0] || {}));

                                self.catasto3dSettings = $.extend({
                                    server: '94.177.184.169:81', // '213.203.177.28:8765' 'srvtest01:8765' 'refp3d-demo:8081'
                                    imgpath: '/views/3/tematismi/maps2.0/',
                                    maps: "to2"
                                }, dbSettingsAdapter(settings.filter(function (v) {
                                    if (v.ACCPAT_TYPE == "3d")
                                        return v;
                                })[0] || {}));

                                require(["/Views/3/tematismi/tematismi/config.js"], function () {
                             //      require(["alysso", "ol", "proj" , "alysso3D"], function (plani3d, ol, proj4, plani3dmodel) {
								  require(["alysso", "ol", "proj"], function (plani3d, ol, proj4) {
                                        $.get("/api/AssetThemes/List")
                                            .then(function (data) {
                                                data = JSON.parse(data);
                                             //   var p3d = new plani3dmodel.Plani3D(self.catasto3dSettings);
                                                // p3d.init().then(function () {
                                                //     setTimeout(function () {
                                                //         p3d.loadTematismi(function (f) {
                                                //             self.alyssoAssets = [{ AS_ASSET_ID: f.get("assetid") }];
                                                //             self.assetDescription = f.get("descrizione");
                                                //             $timeout();
                                                //         }, { themes: data }, true);
                                                //         $timeout(function () {
                                                //             self.alyssoMapReady = true;
                                                //         });
                                                //     }, 1000);
                                                // });

                                                var p3dtematismi = new plani3d.Maps($.extend({ ol: ol, proj4: proj4 }, self.tematSettings));
                                                p3dtematismi.init().then(function () {
                                                    p3dtematismi.loadTematismi(function (f) {
                                                        self.alyssoAssets = [{ AS_ASSET_ID: f.get("assetid") }];
                                                        self.assetDescription = f.get("descrizione");
                                                        $timeout();
                                                    }, data, true);
                                                    $timeout(function () {
                                                        self.alyssoMapReady = true;
                                                        if (self.latlongCenter["TEMAT"])
                                                            p3dtematismi.zoomToLatLon(self.latlongCenter["TEMAT"].latitude, self.latlongCenter["TEMAT"].longitude, self.latlongCenter["TEMAT"].zoom ? self.latlongCenter["TEMAT"].zoom : 15);
                                                    });
                                                });
                                            });

                                        p3dmaps = new plani3d.Maps($.extend({ ol: ol, proj4: proj4 }, self.catastoSettings));

                                        p3dmaps.init().then(function () {
                                            setTimeout(function () {
                                                if (self.latlongCenter["GEO"])
                                                    p3dmaps.zoomToLatLon(self.latlongCenter["GEO"].latitude, self.latlongCenter["GEO"].longitude, self.latlongCenter["GEO"].zoom ? self.latlongCenter["GEO"].zoom : 15);
                                                p3dmaps.createSelection(null, 'v_CATp', true, function (features) {
                                                    if (typeof features === 'string') {
                                                        openActionsTooltip({
                                                            requestOptions: { models: JSON.parse(features) },
                                                            storeProcedureName: "core.USP_GEOCAT_ACTION",
                                                            accordionId: "catastoActionsAccordion",
                                                            element: $('#p3dt-catasto #end-selection')
                                                        });
                                                    }
                                                });
                                                $timeout(function () {
                                                    self.alyssoCatastoReady = true;
                                                });
                                            }, 500);
                                        });

                                        $(document).on('menuToggled', function () {
                                            $("#p3dt-map").resize();
                                            $("#p3dt-catasto").resize();
                                        });
                                    });
                                });
                            });
                    };

                    //window.alyssoSelect = function (f) {
                    //    self.alyssoAssets = [{ AS_ASSET_ID: f.get("assetid") }];
                    //    self.assetDescription = f.get("descrizione")
                    //    $timeout();
                    //};

                    self.onselectAsset = function (event) {
                        if (!event)
                            event = "select";
                        if (self.alyssoAssets)
                            self.setAssetFilter(self.alyssoAssets, event);
                    };

                    self.getObjectText = function (a) {
                        return getObjectText(a);
                    };


                    self.showActions = function (ids) {
                        openActionsTooltip({
                            requestOptions: {
                                id: ids.length ? ids[0] : 0,
                                assetids: ids,
                                caller: "GeoAlysso_GetAction",
                                gridname: self.gridInstance ? self.gridInstance.element.attr("gridname") : null
                            },
                            storeProcedureName: "core.usp_GeoAlysso_GetAction",
                            accordionId: "alyssoViewerActionsAccordion",
                            element: $("#asset-map-actions-button")
                        });
                    }

                    self.setAssetFilter = function (assets, event) {
                        var assets = assets || self.asset;
                        if (event == "select")
                            self.showGrid = true;
                        if (self.gridInstance) {
                            if (assets && assets.length) {
                                var filter = {
                                    logic: "or",
                                    type: "user",
                                    filters: []
                                };
                                $.each(assets, function (k, v) {
                                    filter.filters.push({
                                        field: "AS_ASSET_ID",
                                        operator: "eq",
                                        value: v.AS_ASSET_ID
                                    });
                                });
                                self.gridInstance.dataSource.filter(combineDataSourceFilters(self.gridInstance.dataSource.filter(), filter));
                            }
                            else {
                                self.gridInstance.dataSource.filter(removeFiltersByType(self.gridInstance.dataSource.filter(), ["user"]));
                            }
                        }
                        if (event == "actionClicked")
                            self.showActions($.map(assets || [], function (v, i) {
                                return v.AS_ASSET_ID;
                            }));
                   };

                   self.showMap = function (is3d) {
                       self.mapLoaded = true
                       self.showGrid = false;
                       self.showCatasto = false;
                       if (is3d)
                           self.is3d = true;
                       else
                           self.is3d = false;
                   };
                   self.showCatastoFn = function () {
                       if (!self.gridInstance)
                           return;
                       self.mapLoaded = true
                       self.showGrid = false;
                       self.showCatasto = true;
                       self.is3d = false;
                       if (p3dmaps) {
                           var ds = new kendo.data.DataSource($.extend(true, {}, self.gridInstance.dataSource.options, {
                               transport: {
                                   parameterMap: function (options, operation) {
                                       options = JSON.parse(self.gridInstance.dataSource.options.transport.parameterMap(options, operation));
                                       options.DataSourceCustomParam = options.DataSourceCustomParam.replace(/(read.+?Definition.+?")([^"\\]+)/i, '$1core.GetLandRegistryMap');
                                       options.filter = self.gridInstance.dataSource.filter();
                                       options.models = $.map(self.gridInstance.select() || [], function (row) {
                                           return self.gridInstance.dataItem(row);
                                       });
                                       return JSON.stringify(options);
                                   }
                               }
                           }));
                           ds
                               .read()
                               .then(function () {
                                   var data = ds.data();
                                   if (data.length && data[0].Column1) {
                                       var res = JSON.parse(data[0].Column1);
                                       //1st record is used to center the map TODO (wait for zoom to Lat long from alysso)
                                       var latcenter = null;
                                       var longcenter = null;
                                       if (res.length) {
                                           latcenter = res[0].lat;
                                           longcenter = res[0].long;
                                           res.splice(0, 1);
                                       }
                                       p3dmaps.refreshSelection(res);
                                       if (latcenter || self.latlongCenter["GEO"])
                                           p3dmaps.zoomToLatLon(latcenter ? latcenter : self.latlongCenter["GEO"].latitude, longcenter ? longcenter : self.latlongCenter["GEO"].longitude, self.latlongCenter["GEO"].zoom ? self.latlongCenter["GEO"].zoom : 15);
                                   }
                               });
                       }
                   };

                   MF.kendo.getGridObject({ gridName: gridCodeMatch[1] })
                       .then(function (gridObject) {
                           self.gridObject = gridObject;
                           //self.gridObject.columns.unshift({
                           //    template: '<input kendo-drop-down-list k-options="am.dropdownOptions" style="max-width: 50px;" />',
                           //    width: 65
                           //});
                           $timeout(function () {
                               if (self.gridInstance) {
                                   if (assetIdMatch) {
                                       self.gridObject.dataSource.filter = {
                                           filters: [],
                                           logic: "or",
                                           type: "user"
                                       };
                                       $.each([assetIdMatch[1]], function (k, v) {
                                           self.gridObject.dataSource.filter.filters.push({
                                               field: "AS_ASSET_ID",
                                               operator: "eq",
                                               value: parseInt(v)
                                           });
                                       });
                                       self.gridInstance.one("dataBound", function () {
                                           var data = self.gridInstance.dataSource.data();
                                           if (data.length)
                                               self.asset = data;
                                       });
                                   }
                                   self.gridInstance.setOptions(self.gridObject);
                               }
                           });
                       });
               }
           ]);
    }

})();