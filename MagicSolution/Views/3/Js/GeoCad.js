var treesearchmanager = function () {
    var thetree = $("#treeview-left").data('kendoTreeView');
    thetree.expand(".k-item");
    var filterText = $("#treesearch").val();
    if (filterText !== "") {
        $("#treeview-left .k-group .k-in").closest("li").hide();
        $("#treeview-left .k-group .k-in:containsIgnoreCase('" + filterText + "')").each(function () {
            $(this).parents("ul, li").each(function () {
                $(this).show();
            });
            //visualizzo i figli TODO valutare se fare ricorsivo
            $.each(thetree.dataItem(this).items, function (i, value) {
                var uid = value.uid;
                $(thetree.findByUid(uid)).show()
            });
        });
    }
    else {
        $("#treeview-left .k-group").find("ul").show();
        $("#treeview-left .k-group").find("li").show();
    }
}

var geopagehtml = '\
    <br><div id="treecontainer" class="k-content" style="background-color: transparent;">\
       <div class="row">\
        <div class="col-md-6 col-sm-6">\
            <div class="k-block" style="overflow-y:scroll;">\
                <div class="k-header k-shadow" style="height:30px;">\
                   Struttura\
                   <a href="javascript:;" onclick="undoselection();" class="k-button" style="background-color: transparent !important;margin-top: 3px;padding-top: 0;padding-bottom: 0;float:right; ">\
                            <i class="k-icon k-si-cancel"></i> Annulla\
                        </a>\
                </div>\
                <div class="portlet-body to-do-list">\
                    <div class="input-group" style="display: none;">\
                        <span class="input-group-addon">\
                            <i class="k-icon k-i-search"></i>\
                        </span>\
                        <span class="twitter-typeahead" style="position: relative; display: inline-block; direction: ltr;">\
                            <input type="text" class="form-control tt-hint" disabled="" autocomplete="off" spellcheck="false" style="position: absolute; top: 0px; left: 0px; border-color: transparent; box-shadow: none; background-attachment: scroll; background-clip: border-box; background-color: rgb(255, 255, 255); background-image: none; background-origin: padding-box; background-size: auto; background-position: 0% 0%; background-repeat: repeat repeat;">\
                            <input type="text" id="treesearch" name="treesearch" class="form-control tt-input" autocomplete="off" spellcheck="false" dir="auto" style="position: relative; vertical-align: top; background-color: transparent;">\
                            <pre aria-hidden="true" style="position: absolute; visibility: hidden; white-space: pre; font-family: \'Open Sans\', sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: 400; word-spacing: 0px; letter-spacing: 0px; text-indent: 0px; text-rendering: auto; text-transform: none;"></pre>\
                            <span class="tt-dropdown-menu" style="position: absolute; top: 100%; z-index: 100; display: none; left: 0px; right: auto;">\
                                <div class="tt-dataset-0"></div>\
                            </span></span>\
                    </div>\
                    <div id="treeview-left-container" class="scroller" style="height: 300px;" data-always-visible="1" data-rail-visible="0">\
                        <br>\
                        <div id="treeview-left"></div>\
                    </div>\
                </div>\
            </div>\
        </div>\
        <div class="col-md-6 col-sm-6">\
					<!-- BEGIN REGIONAL STATS PORTLET-->\
					<div class="k-block">\
						<div class="k-header k-shadow" style="height:30px;">\
								Geo Localizzazione\
						        <a href="javascript:;" onclick="redrawmap();" class="k-button" style="background-color: transparent !important;margin-top: 3px;padding-top: 0;padding-bottom: 0;float:right;">\
                                    <i class="k-icon k-si-cancel"></i>Annulla\
                                </a>\
                                <a href="javascript:;" onclick="applyfilter();" class="k-button" style="background-color: transparent !important;margin-top: 3px;padding-top: 0;padding-bottom: 0;float:right;">\
                                    <i class="k-icon k-i-funnel"></i>Filtra\
                                </a>\
                        </div>\
						<div class="portlet-body to-do-list">\
								 <div id="assetmap-canvas" class="gmaps" style="height:500px;"></div>\
						</div>\
					</div>\
					<!-- END REGIONAL STATS PORTLET-->\
				</div>\
       </div>\
     </div>\
        <div id="assetinsertupdatedatawindow" class="k-popup-edit-form k-window-content k-content">\
            <div class="derivativeassetgrid"></div>\
        </div>';

function loadscript() {

    if (typeof define === 'undefined') {
        $.getScript(window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/require.js")
        .done(function () {
            require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
                require(["async!https://maps.googleapis.com/maps/api/js?sensor=false&key=" + window.mapAK, "geo"],
                    function () {
                        google.maps.event.addDomListener(window, 'load', initialize);
                        geoLauncher();
                    });
            });
        });
    }

   
}

function geoLauncher() {
    //creo la pagina custom
    $("#appcontainer").append(geopagehtml);
    //#region main
    initialize();
    var grid = getrootgrid('AS_ASSET_asset', null, 'grid', null, null);
    grid.dataBound = function (e) { $(".k-grid-explorebtn span").addClass("k-icon k-i-custom"); }
    grid.dataSource.pageSize = 5;
    grid.selectable = "row";
    grid.columns[0].command.splice(0, 2);
    grid.change = function (e) {
        var data = $("#grid").data("kendoGrid").dataItem(this.select());
        var myLatlng = new google.maps.LatLng(data.LOCATION_LATITUDE, data.LOCATION_LONGITUDE);
        setMarkerAndCenter(myLatlng, data.AS_ASSET_DESCRIZIONE);
        if (data.AS_ASSET_ADDRESS !== null && data.AS_ASSET_ADDRESS !== undefined)
            geocode(JSON.parse(data.AS_ASSET_ADDRESS).LOCALITY_NAME + ',' + JSON.parse(data.AS_ASSET_ADDRESS).STREET_NAME);

    };
    renderGrid(grid, null, null);
    $("#treesearch").keyup(treesearchmanager);  //form assetmanagement.js

    //#endregion
}

function redrawmap() {
    initialize();
    $("#grid").data("kendoGrid").dataSource.filter(null);
}

function applyfilter() {
    if (window.customcoords !== undefined) {
        var newfilter = {
            logic: "and",
            filters: [{ field: "LOCATION_LONGITUDE", operator: "lt", value: window.customcoords.nelng },
                      { field: "LOCATION_LATITUDE", operator: "lt", value: window.customcoords.nelat },
                      { field: "LOCATION_LATITUDE", operator: "gt", value: window.customcoords.swlat },
                      { field: "LOCATION_LONGITUDE", operator: "gt", value: window.customcoords.swlng }]
        };
        $('#grid').data("kendoGrid").dataSource.filter(newfilter);
    }

}