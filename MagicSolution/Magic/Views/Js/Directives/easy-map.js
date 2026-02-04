define(["angular", "google-maps-api"], function (angular) {
    angular
        .module("easyMap", [])
        .directive("easyMap",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        markers: "=",
                        mapOptions: "=",
                        onSelect: "&",
                        onMapReady: "&"
                    },
                    template: '<style>easy-map, .em { height: 100%; min-height: 140px; display: block;}</style><div class="em"></div>',
                    controllerAs: "em",
                    controller: [
                        "$scope",
                        "$element",
                        "$timeout",
                        function ($scope, $element, $timeout) {
                            /*marker options
                            - title: String
                            - infoWindowContent: String (html) | DOM-Element
                            -- events
                                - click: Function can return a string|DOM-Element which gets used as infoWindowContent
                                - mouseover: Function can return a string|DOM-Element which gets used as infoWindowContent
                                see https://developers.google.com/maps/documentation/javascript/events for more events
                            */

                            var gmap,
                                drawingManager,
                                rectangle,
                                infoWindow,
                                markersOnMap = [],
                                self = this,
                                markerIcon = {
                                    path: "M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z",
                                    anchor: new window.google.maps.Point(0, 0),
                                    labelOrigin: new window.google.maps.Point(0, -27),
                                    strokeWeight: 0,
                                    scale: 0.5
                                };

                            self.map = $.extend({
                                center:
                                {
                                    lat: 41.905116,
                                    lng: 12.486788299999944
                                },
                                zoom: 5,
                                events: {}
                            }, self.mapOptions || {});

                            $scope.$watch("em.markers", function (newValues, oldValues) {
                                var latLngValuesChanged = false;

                                if (newValues.length == oldValues.length) { //compare, setMarkers() only if lat/lng-values changed
                                    for (var i = 0; i < newValues.length; i++) {
                                        var newV = newValues[i];
                                        var oldV = oldValues[i];
                                        if (newV.latitude != oldV.latitude || newV.longitude != oldV.longitude) {
                                            latLngValuesChanged = true;
                                        }
                                    }
                                } else {
                                    latLngValuesChanged = true;
                                }
                                if (latLngValuesChanged) {
                                    setMarkers();
                                }
                            }, true);

                            $scope.$on("gm-resize", function () {
                                if (gmap)
                                    google.maps.event.trigger(gmap, 'resize');
                            });

                            $scope.$watch("em.mapOptions", function (newValue) {
                                if (newValue) {
                                    if (newValue.center)
                                        gmap.setCenter(new google.maps.LatLng(newValue.center.lat, newValue.center.lng));
                                    if (newValue.zoom)
                                        gmap.setZoom(newValue.zoom);
                                }
                            });

                            function setMarkers() {
                                removeAllMarkers();
                                if (self.markers && self.markers.length) {
                                    var bounds = new google.maps.LatLngBounds();
                                    $.each(self.markers, function (k, v) {
                                        var marker,
                                            markerOptions = {
                                                position: {
                                                    lat: v.latitude,
                                                    lng: v.longitude
                                                },
                                                map: gmap,
                                                animation: google.maps.Animation.DROP,
                                                data: v,
                                                //label: {fontWeight: 'bold', fontSize: '14px', text: v.AS_ASSET_CODE },
                                                icon: self.getMarkerIcon({ fillColor: v.color || "blue", fillOpacity: v.opacity || 1 }) //#FF69B4
                                            };
                                        if (v.title)
                                            markerOptions.title = v.title;
                                        if (v.markerOptions)
                                            $.extend(markerOptions, v.markerOptions);

                                        markersOnMap.push(marker = new google.maps.Marker(markerOptions));
                                        bounds.extend(marker.getPosition());

                                        self.addMarkerEvents(marker, v);
                                    });
                                    if (self.markers.length > 1) {
                                        //show all markers
                                        $timeout(function () {
                                            gmap.fitBounds(bounds, 0);
                                        }, 1000);
                                    } else {
                                        //set center & zoom to first marker
                                        gmap.setCenter(new google.maps.LatLng(self.markers[0].latitude, self.markers[0].longitude));
                                        gmap.setZoom(16);
                                    }
                                }
                            };

                            self.addMarkerEvents = function addMarkerEvents(marker, v) {
                                if (!('events' in v)) {
                                    v.events = {};
                                }
                                if (v.infoWindowContent) {
                                    v.events.click = function () {
                                        return v.infoWindowContent;
                                    };
                                }
                                if (v.click) {
                                    v.events.click = v.click;
                                }
                                if (v.events) {
                                    $.each(v.events, function (eventName, eventCallBack) {
                                        self.addMarkerEvent(marker, eventName, eventCallBack);
                                    });
                                }
                            };

                            self.addMarkerEvent = function addMarkerEvent(marker, eventName, eventCallBack) {
                                marker.addListener(eventName, function () {
                                    var content;
                                    content = eventCallBack(marker);
                                    if (content) {
                                        infoWindow.setContent(content);
                                        infoWindow.open(gmap, marker);
                                    }
                                    //if (eventName === 'click' && self.onSelect) {
                                    //    self.onSelect({
                                    //        event: {
                                    //            type: "gm-markerClick",
                                    //            marker: marker
                                    //        }
                                    //    });
                                    //}
                                });
                            }

                            function removeAllMarkers() {
                                if (markersOnMap.length) {
                                    var currentMarker;
                                    while (currentMarker = markersOnMap.pop()) {
                                        currentMarker.setMap(null);
                                    }
                                }
                            };

                            self.getMarkerIcon = function (options) {
                                return $.extend(options, markerIcon);
                            };

                            function getMarkersWithinRectangle(markers, rectangle){
                                var markersWithinShape = [],
                                bounds = rectangle.getBounds();
                                $.each(markers, function (k, marker) {
                                    if (bounds.contains(marker.getPosition()))
                                        markersWithinShape.push(marker);
                                });
                                return markersWithinShape;
                            }


                            //init map
                            gmap = new google.maps.Map($('> div', $element)[0], {
                                center: self.map.center,
                                zoom: self.map.zoom,
                                gestureHandling:'greedy'
                            });

                            //init listeners
                            gmap.addListener('mousedown', function () {
                                if (rectangle != undefined) {
                                    rectangle.setMap(null);
                                    rectangle = undefined;
                                }
                                infoWindow.setMap(null);
                            });

                            $.each(self.map.events, function (event, fn) {
                                gmap.addListener(event, fn);
                            });

                            //set markers
                            setMarkers();

                            //init drawingManager
                            drawingManager = new google.maps.drawing.DrawingManager({
                                drawingMode: null,
                                drawingControl: true,
                                drawingControlOptions: {
                                    position: window.google.maps.ControlPosition.TOP_CENTER,
                                    drawingModes: [
                                        window.google.maps.drawing.OverlayType.RECTANGLE
                                    ]
                                }
                            });
                            drawingManager.setMap(gmap);
                            drawingManager.addListener('overlaycomplete', function (e) {
                                if (rectangle != undefined) {
                                    rectangle.setMap(null);
                                }
                                rectangle = e.overlay;
                                if (self.onSelect) {
                                    self.onSelect({
                                        event: {
                                            type: "gm-rectangleSelection",
                                            rectangle: rectangle,
                                            getMarkersWithinRectangle: function () { return getMarkersWithinRectangle(markersOnMap, rectangle); }
                                        }
                                    });
                                }
                            });
                            infoWindow = new window.google.maps.InfoWindow();

                            if (self.onMapReady)
                                self.onMapReady();
                        }
                    ]
                }
        });
});