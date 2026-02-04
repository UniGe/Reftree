var rectangle;
var map;
var infoWindow;
var drawingManager;
var lastShape;
var markers = [];
var markerImagesPath = window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/3rd-party/gmaps/images/m"
var mcOptions = { gridSize: 50, maxZoom: 15, imagePath: markerImagesPath };
var mc;

//#region marker manager

// Sets the map on all markers in the array.
function setAllMap(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}
function clearMarkers() {
    setAllMap(null);
}

// Shows any markers currently in the array.
function showMarkers() {
    setAllMap(map);
}

// Deletes all markers in the array by removing references to them. Do not use when using clusterer.
function deleteMarkers() {
    clearMarkers();
    markers = [];
}
function deleteClustererMarkers() {
    console.log(mc);
    if (mc !== undefined) {
        mc.clearMarkers();
        markers = [];
    }
}
function pinSymbol(color) {
    return {
        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#000',
        strokeWeight: 2,
        scale: 1,
    };
}

function setMarkerAndCenter(myLatlng, description, id) {
    //check if marker already exists
    found = null;

    for (var i = 0; i < markers.length; i++) {
        if (markers[i].getPosition().lat() === myLatlng.lat() && markers[i].getPosition().lng() === myLatlng.lng() && description === markers[i].title && id === markers[i].itemid) {
            markers[i].setAnimation(google.maps.Animation.BOUNCE);
            found = i;
        }
        else if (markers[i].getAnimation() != null)
            markers[i].setAnimation(null);
    }
    if (found == null) {
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title: description
        });
        marker.itemid = id;

        google.maps.event.addListener(marker, 'click', function () {
            //map.setZoom(8);
            //map.setCenter(marker.getPosition());
            $.each($("#grid").data("kendoGrid").dataSource.data(), function (i, v) {
                if (v.id == id) {
                    console.log(v);
                    $("#grid").data("kendoGrid").select("tr[data-uid=" + v.uid + "]");
                }
            })
        });


        markers.push(marker);
    }
    console.log("settingzoom 13");
    map.setZoom(13);
    map.setCenter(myLatlng);


}
function fitBoundsToVisibleMarkers() {

    var bounds = new google.maps.LatLngBounds();

    for (var i = 0; i < markers.length; i++) {
        if (markers[i].getVisible()) {
            bounds.extend(markers[i].getPosition());
        }
    }

    map.fitBounds(bounds);

}
//#endregion
function geoAssetDataBound(e) {
    //deleteMarkers();
    deleteClustererMarkers();
    var data = e.sender.dataSource.data();
    $.each(data, function (i, v) {
        console.log("setMarker");
        if (v.LOCATION_LATITUDE && v.LOCATION_LONGITUDE) {
            var myLatlng = new google.maps.LatLng(v.LOCATION_LATITUDE, v.LOCATION_LONGITUDE);
            setMarkerAndCenter(myLatlng, v.AS_ASSET_DESCRIZIONE, v.AS_ASSET_ID);
        }
    });

    mc = new MarkerClusterer(map, markers, mcOptions);
    //fitBoundsToVisibleMarkers();
    if (data.length > 0)
        mc.fitMapToMarkers();
    $(".k-grid-explorebtn span").addClass("k-icon k-i-custom");
}
//#region GeoLocalizzazione funzione

//cerca ricorsivamente un campo ed un operatore e ne cambia il valore
function visitFilterLookUpFieldName(filter, lookupfield, operator, value) {
    if (filter.field == lookupfield && operator == filter.operator) {
        filter.value = value;
        return;
    }
    if (filter.filters != undefined)
        $(filter.filters).each(function (i, v) {
            visitFilterLookUpFieldName(v, lookupfield, value);
        });

    return;
}

function applyfilter() {
    var newfilter = {
        logic: "and",
        filters: [{ field: "LOCATION_LONGITUDE", operator: "lt", value: window.customcoords.nelng, type: "geofilter" },
        { field: "LOCATION_LATITUDE", operator: "lt", value: window.customcoords.nelat, type: "geofilter" },
        { field: "LOCATION_LATITUDE", operator: "gt", value: window.customcoords.swlat, type: "geofilter" },
        { field: "LOCATION_LONGITUDE", operator: "gt", value: window.customcoords.swlng, type: "geofilter" }
        ]
    };
    var currentfilter = $('#grid').data("kendoGrid").dataSource.filter();
    $('#grid').data("kendoGrid").dataSource.filter(combineDataSourceFilters(currentfilter, newfilter));
}

function geoModalAsset(location) {
    if ($("#assetmap-canvas").length == 0) //apro il popup solo se non c'e' un' altra mappa in funzione
    {
        $("#wndmodalContainer").modal('toggle');
        setTimeout(function () {
            $("#wndmodalContainer").removeClass("modal-wide");
            if ($("#wndmodalContainer").hasClass("modal-full"))
                $("#wndmodalContainer").removeClass("modal-full");
            $(".modal-title").html("Geo");
            $("#contentofmodal").html('<div id="assetmap-canvas-popup" class="gmaps" style="height:500px;"></div>');
            $(".modal-footer").html("");
            initializeSimpleMapAndMarker(location);
        }, 500);
    }
}

function initializeSimpleMapAndMarker(location) {
    require([window.includesVersion + "/Custom/1/Scripts/config.js"], function () {
        require(["async!https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places&key=" + window.mapAK, "geocomplete"],
            function () {
                var mapOptions = {
                    center: new google.maps.LatLng(41.9000, 12.5000),
                    zoom: 18
                };
                map = new google.maps.Map(document.getElementById('assetmap-canvas-popup'),
                    mapOptions);

                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'address': location }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        map.setCenter(results[0].geometry.location);
                        var marker = new google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location
                        });
                    }
                });
            });
    });



}
function initialize(options) {

    var mapOptions = {
        center: new google.maps.LatLng(41.9000, 12.5000),
        zoom: 5
    };
    if (options)
        mapOptions = options;

    map = new google.maps.Map(document.getElementById('assetmap-canvas'),
        mapOptions);

    var geocoder = new google.maps.Geocoder();
    var location = "Italy";
    geocoder.geocode({ 'address': location }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            var shapeOptions = {
                strokeWeight: 1,
                strokeOpacity: 1,
                fillOpacity: 0.2,
                editable: false,
                clickable: false,
                strokeColor: '#3399FF',
                fillColor: '#3399FF'
            };
            // create a drawing manager attached to the map to allow the user to draw
            // markers, lines, and shapes.
            drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControlOptions: { drawingModes: [google.maps.drawing.OverlayType.RECTANGLE] },
                rectangleOptions: shapeOptions,
                map: map
            });
            google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
                if (lastShape != undefined) {
                    lastShape.setMap(null);
                }

                // cancel drawing mode
                if (shift_draw == false) { drawingManager.setDrawingMode(null); }

                lastShape = e.overlay;
                lastShape.type = e.type;


                if (lastShape.type == google.maps.drawing.OverlayType.RECTANGLE) {

                    lastBounds = lastShape.getBounds();

                    var ne = lastBounds.getNorthEast();
                    var sw = lastBounds.getSouthWest();
                    window.customcoords = {};
                    window.customcoords.nelat = ne.lat();
                    window.customcoords.nelng = ne.lng();
                    window.customcoords.swlat = sw.lat();
                    window.customcoords.swlng = sw.lng();
                    applyfilter();
                    $("#btncancelgeofilter").fadeIn('slow');
                }

            });

            var shift_draw = false;

            $(document).bind('keydown', function (e) {
                if (e.keyCode == 16 && shift_draw == false) {
                    map.setOptions({ draggable: false, disableDoubleClickZoom: true });
                    shift_draw = true; // enable drawing
                    drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
                }

            });

            $(document).bind('keyup', function (e) {
                if (e.keyCode == 16) {
                    map.setOptions({ draggable: true, disableDoubleClickZoom: true });
                    shift_draw = false // disable drawing
                    drawingManager.setDrawingMode(null);
                }

            });

            var thePanorama = map.getStreetView();
            google.maps.event.addListener(thePanorama, 'visible_changed', function () {

                if (thePanorama.getVisible()) {

                    if ($("#googlemapcontainer").length > 0) {
                        $("#googlemapcontainer").draggable('disable');
                    }

                } else {

                    if ($("#googlemapcontainer").length > 0)
                        $("#googlemapcontainer").draggable('enable');

                }

            });

            google.maps.event.addListener(map, 'mousedown', function () {
                if (lastShape != undefined) {
                    lastShape.setMap(null);
                }
            });
            google.maps.event.addListener(map, 'mouseover', function () {
                try {
                    if ($("#googlemapcontainer").length > 0) {
                        $("#googlemapcontainer").draggable('disable');
                    }
                }
                catch (e) {
                    console.log(e);
                }
            });
            google.maps.event.addListener(map, 'mouseout', function () {
                try {
                    if ($("#googlemapcontainer").length > 0) {
                        $("#googlemapcontainer").draggable('enable');
                    }
                }
                catch (e) {
                    console.log(e);
                }
            });
            google.maps.event.addListener(map, 'drag', function () {
                if (lastShape != undefined) {
                    lastShape.setMap(null);
                }
            });

        } else {
            kendoConsole.log("Could not find location: " + location, 1);
        }
    });
    // Define an info window on the map.
    //infoWindow = new google.maps.InfoWindow();
}

//#endregion

//#region geoautocomplete
//e riferimento al bottone "Seleziona"
//valueDBSource la vista/tabella che alimenta il componente (funziona solo con autocomplete alimentati da database)
function selectPlace(e) {
    var data = {};
    var pk = "LOCATION_ID";
    $("#geosearchsection .details span").each(function (i, v) {
        data[v.attributes["data-geo"].value] = v.textContent;
    });

    data["google_address"] = $("#geocomplete").val();
    if (MAP_AND_MARKER_BEHAVE_INDEPENDENTLY) {
        var independentGeoData = {
            address: $('#donotgeocomplete').val(),
            marker: current_position,
            pov: current_pov,
        };
        data["exact_geodata"] = independentGeoData;
    }

    var contentpost = buildGenericPostInsertUpdateParameter("create", "core.AS_V_LOCATION_locationextended", pk, "core.usp_location_ins_upd", "XML", -1, -1, data, -1);
    return $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/PostI/",
        data: contentpost,
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    })
        .then(function (result) {
            if (result.Errors != null) {
                kendoConsole.log(result.Errors, true);
                return null;
            } else {
                if (result.Warning != null)
                    kendoConsole.log(result.Warning, "info");
                //else {
                console.log("Address correctly registered in DB");
                return result.Data[0].Table[0];
                //}
            }
        }, function (message) {
            kendoConsole.log(message, true);
        });
}

function closeGeoSearch(e) {
    var tabStrip = $(e.currentTarget).closest("[data-role=tabstrip]").data("kendoTabStrip");  //tabstrip corrente
    tabStrip.enable(tabStrip.tabGroup.children());
    $(e.currentTarget).closest(".k-window").removeClass("geo-map-opened");
    $("#geosearchsection").remove();
    marker = null;
}

function showGeoSearch(e) {
    //Issue #5424 do not open popup if the field is not editable
    if ($(e).closest("span").find("span.k-widget").hasClass("k-state-disabled"))
        return;

    if (e !== undefined) {
        var tabStrip = $(e).closest(".k-tabstrip").data("kendoTabStrip"); //tabstrip corrente
        tabStrip.select();
        tabStrip.disable(tabStrip.tabGroup.children().not(".k-state-active"));
    }

    var $container = $(e).closest(".k-window");
    $container.addClass("geo-map-opened");
    $(e).closest(".k-content.k-state-active").prepend(getGeosearchSectionHtml());

    $("#backtoeditform").click(closeGeoSearch);
    $("#selectgeo").click(function (evt) {
        selectPlace(evt)
            .then(location => {
                if (location) {
                    var $addressautocomplete = $(e).closest("div").find("input");


                    var container = $addressautocomplete.closest(".k-edit-form-container");
                    var kendoEditable = $(container).parent().data('kendoEditable');
                    try {
                        kendoEditable.options.model[$addressautocomplete.attr("name")] = location['LOCATION_ID'];
                    }
                    catch (e) {
                        console.log("Problems while getting location from DB (accessing model by pk):" + e.message);
                    }
                    kendoEditable.options.model.dirty = true;
                    var kendoac = $addressautocomplete.data("kendoAutoComplete");
                    var actext = kendoac.options.dataTextField;
                    var acvalue = kendoac.options.dataValueField;
                    var locationvalue = location[actext];
                    if (MAP_AND_MARKER_BEHAVE_INDEPENDENTLY) {
                        locationvalue = current_address;
                    }
                    var newaddress = {};
                    newaddress[acvalue] = location['LOCATION_ID'];
                    newaddress[actext] = locationvalue;
                    kendoac.dataSource.add(newaddress);
                    kendoac.value(locationvalue);
                    if ($addressautocomplete.data("change"))
                        window[$addressautocomplete.data("change")]($addressautocomplete, location['LOCATION_ID']);
                    if ($addressautocomplete.attr("name") + "_text" in kendoEditable.options.model)
                        kendoEditable.options.model[$addressautocomplete.attr("name") + "_text"] = locationvalue;// result.Data[0].Table[0][actext];
                    $("#backtoeditform").trigger("click");
                    marker = null;
                }
            });
    });


    var currentaddress = "";
    try {
        currentaddress = $(e).closest("div").find("input").data("kendoAutoComplete").value();
    }
    catch (e) {
        console.log("problems finiding autocomplete while initiliazing address");
    }
    
    if (mapAndMarkerShouldBehaveIndependently()) {
        var $dataDOM = $(e).closest(".k-popup-edit-form.k-window-content.k-content");
        initIndependentMode($dataDOM, currentaddress);
        return;
    }

    require([window.includesVersion + "/Custom/1/Scripts/config.js"], function () {
        var deps = ["geocomplete"];
        if (!window.google || !window.google.maps)
            deps.push("async!https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places&key=" + window.mapAK);
        require(deps,
            function () {
                $("#geocomplete").geocomplete({
                    map: ".map_canvas",
                    location: currentaddress,
                    markerOptions: {
                        draggable: true
                    },
                    details: ".details",
                    detailsAttribute: "data-geo"
                }).bind("geocode:dragged", function (event, result) {
                    var geocoder = new google.maps.Geocoder();
                    var latlng = { lat: parseFloat(result.lat()), lng: parseFloat(result.lng()) };
                    geocoder.geocode({ 'location': latlng }, function (results, status) {
                        if (status === 'OK') {
                            if (results[0]) {
                                $("#geocomplete").geocomplete("find", results[0].formatted_address);
                            } else {
                                window.alert('No results found');
                            }
                        } else {
                            window.alert('Geocoder failed due to: ' + status);
                        }
                    });

                });
            });
    });

}

function getGeosearchSectionHtml() {
    return '<div id="geosearchsection" style="height:400px;"><div class="details" style="display:none;">\
                                                                                                            Latitude:     <span data-geo="lat" />\
                                                                                                            Longitude:    <span data-geo="lng" />\
                                                                                                            Locality:      <span data-geo="locality" />\
                                                                                                            Locality_short:      <span data-geo="locality_short" />\
                                                                                                            Country Code: <span data-geo="country_short" />\
                                                                                                            Country: <span data-geo="country" />\
                                                                                                            Administrative area level 1_short: <span data-geo="administrative_area_level_1_short" />\
                                                                                                            Administrative area level 1: <span data-geo="administrative_area_level_1" />\
                                                                                                            Administrative area level 2_short: <span data-geo="administrative_area_level_2_short" />\
                                                                                                            Administrative area level 2: <span data-geo="administrative_area_level_2" />\
                                                                                                            Administrative area level 3_short: <span data-geo="administrative_area_level_3_short" />\
                                                                                                            Administrative area level 3: <span data-geo="administrative_area_level_3" />\
                                                                                                            Sublocality Level 1_short: <span data-geo="sublocality_level_1_short" />\
                                                                                                            Sublocality Level 1: <span data-geo="sublocality_level_1" />\
                                                                                                            Postal: <span data-geo="postal_code" />\
                                                                                                            Street Address: <span data-geo="street_address"/>\
                                                                                                            Street Number: <span data-geo="street_number"/>\
                                                                                                            Route:<span data-geo="route"/>\
			                                                                                                Address:<span data-geo="formatted_address" />\
																											Location Type:<span data-geo="location_type" />\
                                                                                                          </div>\
                    <form style="display: inline-block;">\
                        <input style="width: 70%;margin-left:15px;width: calc(100% - 140px);" id="geocomplete" type="text" placeholder="Type in an address" size="90" />\
                        <input style="width: 70%;margin-left:15px;width: calc(100% - 140px); display:none;" id="donotgeocomplete" type="text" placeholder="Type in an address" size="90" hidden />\
                        <div style="margin-right:20px;float:right;">\
                        <a id="selectgeo" class="btn btn-primary" style="margin-left:2px;"><span class="fa fa-check"></span></a>\
                        <a style="margin-left:2px;"id="backtoeditform" class="btn btn-primary"><span class="fa fa-reply"></span></a></div></form>\
                         <div class="map_canvas" style="height: 300px; margin: 10px 20px 10px 15px;"></div>\
                         <div class="invisible_map_canvas" style="display:none;"></div>\
                         <div style="width:100%;"><div style="float:left; margin-right: 5px;"><span class="label label-info"><span class="fa fa-map-marker"></span></span></div><div style="float:left;"><span class="label label-default">Latitude</span><span class="label label-info" id="lat">-</span></div><div style="float: left;"><span class="label label-default">Longitude</span><span class="label label-info" id="lng">-</span></div></div>\
                         </div>\
                        <style>\
                            .custom-streetview-control {\
                                background-color: rgb(255, 255, 255);\
                                height: 20px;\
                                margin-top: 10px;\
                                color: rgb(86, 86, 86);\
                                border-bottom-left-radius: 2px;\
                                border-top-left-radius: 2px;\
                                background-clip: padding-box;\
                                box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;\
                                font-family: Roboto, Arial, sans-serif;\
                                font-size: 18px;\
                                font-weight: 400;\
                                padding: 10px 17px;\
                                display: table-cell;\
                                vertical-align: middle;\
                                text-align: center;\
                            }\
                            .custom-streetview-control:hover {\
                                background-color: rgb(235,235,235);\
                                color: rgb(0,0,0);\
                                cursor:pointer;\
                            }\
                            .no-streetview-available {\
                                z-index: 1000;\
                                pointer-events: none; \
                                background-color: rgb(235, 235, 228);\
                            }\
                            .no-streetview-available:hover {\
                                cursor: not-allowed;\
                            }\
                        </style>';
}
//#endregion

//#region independent Adress&Marker
var GET_GEODATA_STORED_PROCEDURE = "Custom.GetGeoData";
var STREET_VIEW_BUTTON_TEXT = "Street";
var MAP_AND_MARKER_BEHAVE_INDEPENDENTLY = false;
var STREET_VIEW_AVAILABLE_AT_CURRENT_POSITION = false;
var current_record = {}, current_position = {}, current_pov = {}, current_address = "";
var street_view = null;

var mapAndMarkerShouldBehaveIndependently = function (e) {  //unused e?
    MAP_AND_MARKER_BEHAVE_INDEPENDENTLY = false;
    for (var i = 0; i < window.independentGoogleMapMarkerApplications.length; i++) {
        if (window.independentGoogleMapMarkerApplications[i] == window.ApplicationInstanceName) {
            MAP_AND_MARKER_BEHAVE_INDEPENDENTLY = true;
            return true;
        }
    }
    return false;
};

var initIndependentMode = function ($dataDOM, address) {
    current_record = getCurrentlyEditedGridRecord($dataDOM)
    if (current_record != null) {
        if (address.length > 0) {
            current_address = address;
        } else {
            current_address = current_record['AS_ASSET_ADDRESS'];
        }
        queryGeoData(current_record, GET_GEODATA_STORED_PROCEDURE).then(function (existingGeoData) {
            if (existingGeoData.position && existingGeoData.position.lat && existingGeoData.position.lng) {
                current_position.lat = existingGeoData.position.lat;
                current_position.lng = existingGeoData.position.lng;
            } 
            if (existingGeoData.pov) {
                current_pov = existingGeoData.pov;
            } else {
                current_pov = { heading: 0, pitch: 0, zoom: 1 }; //default
            }
            if (existingGeoData.address) {
                current_address = existingGeoData.address;
            }
            loadMapDependencies().then(function () {
                initMapWithIndependentMarker();
            });
        });
    } else {
        console.error("can't get grid record");
    }
};

var getCurrentlyEditedGridRecord = function ($dataDOM) {
    var uid = $dataDOM.data("uid");
    var data_array = $dataDOM.data("gridDS").data();
    for (var i = 0; i < data_array.length; i++) {
        if (data_array[i].uid == uid) {
            return data_array[i].toJSON();
        }
    }
    return null;
};

var queryGeoData = function (inputData, storedProcedure) {  //or getGeoData #naming
    var deferred = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.getDataSet(inputData, storedProcedure)
            .then(function (res) {
                if (res[0][0].geo_data) {
                    var parsedGeoData = JSON.parse(res[0][0].geo_data);
                    deferred.resolve(parsedGeoData);
                } else {
                    deferred.reject();
                }
            });
    });
    return deferred.promise();
};

var loadMapDependencies = function () {
    var deferred = $.Deferred();
    require([window.includesVersion + "/Custom/1/Scripts/config.js"], function () {
        var deps = ["geocomplete"];
        if (!window.google || !window.google.maps)
            deps.push("async!https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places&key=" + window.mapAK);
        require(deps, function () {
            deferred.resolve();
        });
    });
    return deferred.promise();
};
var marker = null;

var initMapWithIndependentMarker = function () {
    var positionAlreadySet = false;
   
    var options = {
        location: current_address,
        map: ".map_canvas",
        markerOptions: {
            disabled: false,
            draggable: true,
        },
        mapOptions: {
            streetViewControl: false
        },
        details: ".details",
        detailsAttribute: "data-geo"
    };
    if (current_position.lat && current_position.lng) {        
        positionAlreadySet = true;
        options.markerOptions.disabled = true;
    }
    $("#geocomplete").geocomplete(options).bind("geocode:dragged", onMarkerDragged)
        .bind("geocode:result", function (event, result) {
            if (!positionAlreadySet) {
                current_position.lat = result.geometry.location.lat();
                current_position.lng = result.geometry.location.lng();
            } else {
                if (!map) {
                    map = $("#geocomplete").geocomplete('map');
                }
                if (marker) {
                    current_position.lat = result.geometry.location.lat();
                    current_position.lng = result.geometry.location.lng();
                    var markerLatlng = new google.maps.LatLng(current_position.lat, current_position.lng);
                    marker.setPosition(markerLatlng);
                }
                else {
                    var markerLatlng = new google.maps.LatLng(current_position.lat, current_position.lng);
                    marker = new google.maps.Marker({ position: markerLatlng, map: map, draggable: true });
                }
                google.maps.event.addListener(
                    marker,
                    'drag',
                    function (evt, res) { 
                        var lat  = marker.position.lat();
                        var lng = marker.position.lng();
                        onMarkerDragged(null, { lat,lng })
                    }
                );
                //$("#geocomplete").geocomplete(options);
            }
            current_address = result.formatted_address;
            onCurrentPositionChanged();
            //disableGeocoding();
        });

    //if (positionAlreadySet) {
        
    //}

    map = $("#geocomplete").geocomplete('map');
    $('#geocomplete').val(current_address); 
    //$('#donotgeocomplete').val(current_address);//not needed anymore: was used to DISABLE geocoding! comment below also!
    //$('#donotgeocomplete').geocomplete({
    //    map: ".invisible_map_canvas",
    //    details: ".details",
    //    detailsAttribute: "data-geo"
    //});

    initStreetView();
    onCurrentPositionChanged();
    //if (current_address.length > 0) {
    //    disableGeocoding();        
    //        var geocoder = new google.maps.Geocoder();
    //        geocoder.geocode({ 'address': current_address }, function (results, status) {
    //            if (status === 'OK') {
    //                if (results[0]) {
    //                    $("#donotgeocomplete").geocomplete("find", results[0].formatted_address);

    //                } else {
    //                    window.alert('No results found');
    //                }
    //            } else {
    //                window.alert('Geocoder failed due to: ' + status);
    //                //try with coords?
    //            }
    //        });
    //}
};

var initStreetView = function () {
    var streetViewBtn = document.createElement("DIV");
    streetViewBtn.setAttribute("role", "button");
    streetViewBtn.classList.add("custom-streetview-control");
    streetViewBtn.innerHTML = STREET_VIEW_BUTTON_TEXT;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(streetViewBtn);
    var options = {
        pov: current_pov,
        enableCloseButton: true
    };
    if (current_position.lat && current_position.lng) {
        options.position = current_position;
    }
    street_view = new google.maps.StreetViewPanorama(document.getElementsByClassName('map_canvas')[0], options);
    street_view.setVisible(false);
    map.setStreetView(street_view);
    google.maps.event.addListener(street_view, 'visible_changed', onStreetViewVisibilityChanged);
    google.maps.event.addListener(street_view, 'position_changed', onStreetViewPositionChanged);
    google.maps.event.addListener(street_view, 'pov_changed', onStreetViewPovChanged);
    streetViewBtn.addEventListener('click', onStreetViewButtonClicked);
};

var onStreetViewButtonClicked = function (e) {
    if (!street_view.getVisible() && STREET_VIEW_AVAILABLE_AT_CURRENT_POSITION) { //if not visible, enter StreetView on current marker-position and current point-of-view
        street_view.setPosition(current_position);
        street_view.setPov(current_pov);
        street_view.setVisible(true);
    }
};

var onStreetViewVisibilityChanged = function () {
    if (!street_view.getVisible()) { //if StreetView was closed, update POV and POSITION
        current_pov = street_view.getPov();
        current_position.lat = street_view.getPosition().lat();
        current_position.lng = street_view.getPosition().lng();
        onCurrentPositionChanged();
    }
};

var onStreetViewPositionChanged = function () {
    current_position.lat = street_view.getPosition().lat();
    current_position.lng = street_view.getPosition().lng();
    onCurrentPositionChanged();
};

var onStreetViewPovChanged = function () {
    current_pov = street_view.getPov();
};

var onMarkerDragged = function (event, result) {
    current_position = { lat: result.lat || result.lat(), lng: result.lng || result.lng() };
    current_pov = { heading: 0, pitch: 0, zoom: 1 };
    onCurrentPositionChanged();
};

var onCurrentPositionChanged = function () {
    checkStreetViewAvailabilityForPosition();
    $('#lat').text(current_position.lat);
    $('#lng').text(current_position.lng);
};

var checkStreetViewAvailabilityForPosition = function () {
    var streetViewService = new google.maps.StreetViewService();
    var STREETVIEW_MAX_DISTANCE = 100;
    var latLng = new google.maps.LatLng(current_position.lat, current_position.lng);
    streetViewService.getPanoramaByLocation(latLng, STREETVIEW_MAX_DISTANCE, function (streetViewPanoramaData, status) {
        if (status === google.maps.StreetViewStatus.OK) {
            STREET_VIEW_AVAILABLE_AT_CURRENT_POSITION = true;
            $('.custom-streetview-control').removeClass('no-streetview-available');
        } else {
            STREET_VIEW_AVAILABLE_AT_CURRENT_POSITION = false;
            $('.custom-streetview-control').addClass('no-streetview-available');
        }
    });
}

var enableGeocoding = function () {     //those two methods are currently unused, they might be useful when new features are requested...
    $('#donotgeocomplete').hide();
    $('#geocomplete').val($('#donotgeocomplete').val());
    $('#geocomplete').show();
};

var disableGeocoding = function () {
    $('#donotgeocomplete').val($('#geocomplete').val());
    $('#geocomplete').hide();
    $('#donotgeocomplete').show();
};
//#endregion independent Adress&Marker