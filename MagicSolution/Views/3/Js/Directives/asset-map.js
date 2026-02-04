define(["angular", "MagicSDK", "angular-google-maps", "angular-ui-bootstrap"], function (angular, MF) {
    angular
        .module("assetMap", ["uiGmapgoogle-maps", "ui.bootstrap"])
        .config(function (uiGmapGoogleMapApiProvider) {
            uiGmapGoogleMapApiProvider.configure({
                key: window.mapAK,
                v: '3',
                libraries: 'places,drawing'
            });
        })
        .directive("assetMap", [
            '$timeout',
            'uiGmapGoogleMapApi',
            '$filter',
            function ($timeout, map, $filter) {
                return {
                    replace: false,
                    restrict: "E",
                    templateUrl: window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Templates/Directives/asset-map.html",
                    scope: {
                        model: '=',
                        onselectAsset: '&',
                        grid: "="
                    },
                    link: function (self, element, attrs, ctrl) {
                        var mapScrollInterval,
                            mapScrollTimeout,
                            infoWindow,
                            lastMarkerClickedLocationID,
                            rectangle,
                            drawingMananger,
                            mapReady = $.Deferred();
                        self.addAction = false;
                        self.moveToFirstAsset = false;
                        self.isMapReady = false;


                        self.$watch("grid", function (newValue, oldValue) {
                            if (self.grid && self.grid.bind) {
                                self.grid.bind("dataBound", self.addMarkersFromGridData);
                                if (self.grid.dataSource.data().length) {
                                    self.addMarkersFromGridData();
                                    self.goToCurrentAsset();
                                }
                            }
                            checkForGridActions();
                        });

                        function checkForGridActions() {
                            if (!self.addAction && self.grid) {
                                if (self.grid.columns && self.grid.columns.length) {
                                    $.each(self.grid.columns, function (k, v) {
                                        if (v.columnType === "actions") {
                                            $timeout(function () {
                                                self.addAction = true;
                                            });
                                            return false;
                                        }
                                    });
                                }
                                else {
                                    self.grid.one("dataBound", function () {
                                        if (self.addAction)
                                            return;
                                        checkForGridActions();
                                    });
                                }
                            }
                        }
                        checkForGridActions();

                        self.markers = {};
                        self.selectedAssets = [];
                        self.shallMoveToAsset = true;

                        self.$watch('model', function (newValue) {
                            self.selectedAssets = newValue || [];
                            if (self.selectedAssets.length)
                                self.selectedAsset = newValue[0];
                            else
                                self.selectedAsset = null;
                            if (self.shallMoveToAsset)
                                self.goToCurrentAsset();
                            self.shallMoveToAsset = true;
                        });

                        self.map = {
                            center:
                                {
                                    latitude: 41.905116,
                                    longitude: 12.486788299999944
                                },
                            zoom: 6,
                            events: {
                                "tilesloaded": function () {
                                    if (!self.selectedAssets.length && isMobile())
                                        self.goToCurrentLocation();
                                    var gmap = self.mapControl.getGMap();
                                    drawingManager.setMap(gmap);
                                    map.event.addListener(gmap, 'mousedown', function () {
                                        if (rectangle != undefined) {
                                            rectangle.setMap(null);
                                            rectangle = undefined;
                                        }
                                    });
                                    self.isMapReady = true;
                                    mapReady.resolve();
                                    $timeout();
                                    self.map.events.tilesloaded = function () { };
                                }
                            }
                        };
                        self.mapControl = {};

                        map.then(function (m) {
                            map = m;
                            self.autocomplete = new map.places.Autocomplete(document.getElementById("am-google-autocomplete"));
                            self.autocomplete.addListener("place_changed", function () {
                                var place = self.autocomplete.getPlace();
                                if (place)
                                    self.goToPosition(place.geometry.location.lng(), place.geometry.location.lat(), 15);
                            });
                            infoWindow = new map.InfoWindow();
                            drawingManager = new map.drawing.DrawingManager({
                                drawingMode: null,
                                drawingControl: true,
                                drawingControlOptions: {
                                    position: map.ControlPosition.TOP_CENTER,
                                    drawingModes: [
                                      map.drawing.OverlayType.RECTANGLE
                                    ]
                                }
                            });
                            map.event.addListener(drawingManager, 'overlaycomplete', function (e) {
                                if (rectangle != undefined) {
                                    rectangle.setMap(null);
                                }
                                rectangle = e.overlay;
                            });
                        });

                        self.goToCurrentLocation = function () {
                            if (window.navigator && navigator.geolocation && navigator.geolocation.getCurrentPosition) {
                                navigator.geolocation.getCurrentPosition(
                                    function (pos) {
                                        self.goToPosition(pos.coords.longitude, pos.coords.latitude, 15);
                                    },
                                    function (error) {
                                        kendoConsole.log(error.message, true);
                                    }
                                );
                            }
                        }

                        self.removeMarkers = function () {
                            $.each(self.markers, function (k, v) {
                                v.setMap(null);
                            });
                            self.markers = {};
                        };

                        self.addMarkersFromGridData = function () {
                            mapReady.then(function () {
                                self.removeMarkers();
                                var data = self.grid.dataSource.data();
                                if (data) {
                                    $.each(data, function (k, v) {
                                        if (v.LOCATION_ID) {
                                            if (!(v.LOCATION_ID in self.markers)) {
                                                var gmap = self.mapControl.getGMap();
                                                if (k == 0 && self.moveToFirstAsset)
                                                    self.goToPosition(v.LOCATION_LONGITUDE, v.LOCATION_LATITUDE);
                                                self.markers[v.LOCATION_ID] = new map.Marker({
                                                    position: {
                                                        lat: v.LOCATION_LATITUDE,
                                                        lng: v.LOCATION_LONGITUDE
                                                    },
                                                    map: gmap,
                                                    animation: map.Animation.DROP,
                                                    title: v.LOCATION_GOOGLE_ADDRESS,
                                                    assets: {},
                                                    icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                                                });
                                                self.markers[v.LOCATION_ID].addListener("click", function () {
                                                    var $container = $('<div><div><b>' + v.LOCATION_GOOGLE_ADDRESS + '</b></div><div class="gm-content"><ul></ul></div></div>'),
                                                        $ul = $container.find("ul"),
                                                        assetCount = 0;
                                                    infoWindow.setContent($container[0]);
                                                    infoWindow.open(gmap, self.markers[v.LOCATION_ID]);
                                                    $.each(self.markers[v.LOCATION_ID].assets, function (k, vv) {
                                                        assetCount++;
                                                        var content = "<li><span>" + vv.AS_ASSET_DESCRIZIONE + "</span>";
                                                        if (vv.AS_ASSET_THUMBNAIL)
                                                            content += '<div><img src="' + vv.AS_ASSET_THUMBNAIL + '" alt="' + vv.AS_ASSET_DESCRIZIONE + '" class="img-rounded"></div>';
                                                        content += "</li>";
                                                        var $li = $(content);
                                                        $li.find("span").click(function () {
                                                            self.shallMoveToAsset = false;
                                                            self.selectedAssets = [self.selectedAsset = $.extend({}, v, vv)];
                                                            $timeout();
                                                        });
                                                        $li.find("img").click(function () {
                                                            var $content = $('<div>' + largeSpinnerHTML + '</div>');
                                                            showModal({
                                                                content: $content,
                                                                title: '<i class="fa fa-picture-o" aria-hidden="true"></i>'
                                                            });
                                                            $.ajax({    //#mfapireplaced
                                                                type: "POST",
                                                                url: "/api/AS_V_ASSET_assetgroups/GetAsAssetImages",
                                                                data: JSON.stringify({ AS_ASSET_ID: "" + vv.AS_ASSET_ID }),
                                                                contentType: "application/json; charset=utf-8",
                                                                dataType: "json",
                                                                error: function (err) { console.log("ERROR while getting AsAssetImages", err) },
                                                            })
                                                            .then(function (res1) {
                                                                var imgs = res1.Data[0].Table;
                                                                if (imgs.length)
                                                                    $.get("/api/Documentale/GetDocumentPaths?documentIDs=" + imgs.map(function (v) {
                                                                        return v.DO_DOCUME_ID;
                                                                    }).join())
                                                                        .then(function (res) {
                                                                            if (res) {
                                                                                res = JSON.parse(res);
                                                                                if (res.length)
                                                                                    bootstrapAddCarouselTo$el($content, "asset-gallery", imgs.map(function (v) {
                                                                                        var path = $filter("filter")(res, { DO_DOCUME_ID: v.DO_DOCUME_ID })[0].path;
                                                                                        return {
                                                                                            src: "/api/MAGIC_SAVEFILE/GetFile?path=" + path + "\\" + JSON.parse(v.DO_DOCVER_LINK_FILE)[0].name
                                                                                        };
                                                                                    }));
                                                                                else
                                                                                    $content.html();
                                                                            }
                                                                        });
                                                            });
                                                        });
                                                        $ul.append($li);
                                                    });
                                                    if (assetCount == 1) {
                                                        setTimeout(function () {
                                                            $ul.find("li").eq(0).find("span").click();
                                                        });
                                                    }
                                                });
                                            }
                                            else
                                                self.markers[v.LOCATION_ID].setIcon(null);
                                            self.markers[v.LOCATION_ID].assets[v.AS_ASSET_ID] = v;
                                        }
                                    });
                                    self.moveToFirstAsset = true;
                                }
                            });
                        };

                        self.getAssetByDescription = function (description) {
                            var deferred = $.Deferred();
                            $.ajax({ //#mfapireplaced
                                type: "POST",
                                url: "/api/AS_V_ASSET_assetgroups/GetAsAssetByDescription",
                                data: JSON.stringify({ AS_ASSET_DESCRIZIONE: description }),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                error: function (err) { console.log("ERROR while getting AS_ASSETS by description", err) },                                
                            }).then(function (res) {
                                var data = res.Data[0].Table;
                                deferred.resolve(data);
                            });
                            return deferred.promise();
                        };

                        self.selectAsset = function (asset) {
                            return self.addLocationInfoToAsset(asset)
                            .then(function (res) {
                                self.selectedAssets = [self.selectedAsset = res];
                                //self.goToCurrentAsset();
                                self.setModel();
                                return self.selectedAsset;
                            });
                        };

                        self.addLocationInfoToAsset = function (asset) {
                            var deferred = $.Deferred();
                            $.ajax({ //#mfapireplaced
                                type: "POST",
                                url: "/api/AS_V_ASSET_assetgroups/GetAsAssetLocation",
                                data: JSON.stringify({ AS_ASSET_LOCATION_ID: ""+asset.AS_ASSET_LOCATION_ID }),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                error: function (err) { console.log("ERROR while getting AS_ASSETS by description", err) },
                            }).then(function (res) {
                                var data = res.Data[0].Table;
                                deferred.resolve(data);
                                return $.extend({}, asset, data.shift() || {});
                            });
                            return deferred.promise();
                        };

                        self.goToCurrentAsset = function (secondAttempt) {
                            if (self.selectedAsset) {
                                if (self.selectedAsset.LOCATION_LATITUDE && self.selectedAsset.LOCATION_LONGITUDE) {
                                    self.goToPosition(self.selectedAsset.LOCATION_LONGITUDE, self.selectedAsset.LOCATION_LATITUDE, 15);
                                }
                                else if (!secondAttempt) {
                                    self.addLocationInfoToAsset(self.selectedAsset)
                                        .then(function (res) {
                                            $.extend(self.selectedAsset, res);
                                            self.goToCurrentAsset(true);
                                        });
                                }
                            }
                        };

                        self.goToPosition = function (lng, lat, zoom) {
                            mapReady.then(function () {
                                $timeout(function () {
                                    self.map.center = {
                                        longitude: lng,
                                        latitude: lat
                                    };
                                    self.mapControl.getGMap().setCenter({
                                        lat: lat,
                                        lng: lng
                                    });
                                    if (zoom)
                                        self.mapControl.getGMap().setZoom(zoom);
                                });
                            });
                        };

                        self.removeAllMarkersFromMap = function () {
                            $.each(self.markers, function (k, v) {
                                v.map = null;
                            });
                            self.markers = {};
                        };

                        self.getTranslation = function (key) {
                            return getObjectText(key);
                        };

                        self.setModel = function (event) {
                            if (!event)
                                event = "select";
                            if (rectangle != undefined) {
                                var locationIDs = getLocationIDsOfMarkersWithinRectangle(self.markers, rectangle);
                                if (locationIDs.length) {
                                    $.ajax({ //#mfapireplaced
                                        type: "POST",
                                        url: "/api/AS_V_ASSET_assetgroups/GetAsAssetsByLocationIDs",
                                        data: JSON.stringify({ locationIDs: locationIDs }),
                                        contentType: "application/json; charset=utf-8",
                                        dataType: "json",
                                        error: function (err) { console.log("ERROR while getting AS_ASSETS by description", err) },
                                    }).then(function (res) {
                                        var data = res.Data[0].Table;
                                        self.model = data;
                                        self.onselectAsset({ assets: self.model, event: event });
                                    });
                                    return;
                                }
                                self.model = [];
                            }
                            else {
                                self.model = self.selectedAssets;
                            }
                            self.onselectAsset({ assets: self.model, event: event });
                        };

                        function getLocationIDsOfMarkersWithinRectangle(markers, rectangle) {
                            var markersWithinShape = [],
                                bounds = rectangle.getBounds();
                            $.each(markers, function (k, marker) {
                                if (bounds.contains(marker.getPosition()))
                                    markersWithinShape.push(k);
                            });
                            return markersWithinShape;
                        };
                    }
                };
            }]);
});