//#region INIT
var treefuncpars = {
    customfuncs: "plAssetmanagement", // JS da caricare 
    explorefunc: "plassetselected", //funzione contenuta (di solito) nel customfuncs che scatta alla pressione del tasto "explore" sulla griglia degli asset
    page: "/Views/3/Templates/AST_Assets.html", //html page
    style: "/Views/3/Styles/assets.css", // css
    gridname: "PL_V_ASSET_LIST",
    entityname: "PL_V_ASSET_LIST",
    pk: "PL_ASSET_ID",
    pkfilter: function (editid) { return { field: "PL_ASSET_ID", operator: "eq", value: editid } },
    currentDbTree: "PL_USP_GetAsset"
};
//#endregion
//window.currentDbTree = "PL_USP_GetAsset";

function loadscript() {
    require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
		require(["async!https://maps.google.com/maps/api/js?sensor=false&libraries=drawing&key=" + window.mapAK, treefuncpars.customfuncs],
            function () {
                google.maps.event.addDomListener(window, 'load', initialize);
                plAsset_geoLauncher();
            });
    });
}

function plAsset_geoLauncher() {
    //creo la pagina custom
    apply_style(treefuncpars.style);

    $("#appcontainer").append("<div id='appsubcontainer'/>");
    $("#appsubcontainer").load(treefuncpars.page, function (e) {
        maketranslations();
        $("#googlemapcontainer").draggable({
            stack: ".windowmanager"
        });
        //#region main
        var mapOptions = {
            center: new google.maps.LatLng(41.9000, 12.5000),
            zoom: 5,
            streetViewControl: false
        };
        initialize(mapOptions); //geo.js
        var grid = getrootgrid(treefuncpars.gridname);
        var origAssetdataBound = grid.dataBound;
        grid.dataBound = function (e) {
            origAssetdataBound.call(this, e);
            geoAssetDataBound.call(this,e);

        }
        grid.dataSource.pageSize = 5;
        grid.selectable = "row";
        manageBtns(grid, treefuncpars.explorefunc,true);
        grid.change = function (e) {
            var data = $("#grid").data("kendoGrid").dataItem(this.select());
            var myLatlng = new google.maps.LatLng(data.LOCATION_LATITUDE, data.LOCATION_LONGITUDE);
            setMarkerAndCenter(myLatlng, data.PL_ASSET_DESCRIPTION);
        };
        renderGrid(grid, null, null);
        var gridobj = getrootgrid("PL_V_ASSET_LIST", null, "derivativeassetgrid");
        gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
        renderHiddenGrid(gridobj);
        //#endregion
    });
    
}

function geoBound_PlAssetSelectTree(event) {
    var $item = $(event.node);
    var assetid = $("#treeview-left [data-role=treeview]").data("kendoTreeView").dataItem($item).assetid;
    GetPlAsset(assetid.toString()).then(function (assetdata) {
        var data = assetdata.Data[0].Table[0];
        var myLatlng = new google.maps.LatLng(data.LOCATION_LATITUDE, data.LOCATION_LONGITUDE);
        setMarkerAndCenter(myLatlng, data.PL_ASSET_DESCRIPTION);
    });
}

function redrawmap() {
    var currfilter = $("#grid").data("kendoGrid").dataSource.filter();
    var newfilter = removeFiltersByType(currfilter, "geofilter");
    $("#grid").data("kendoGrid").dataSource.filter(newfilter);
    $("#btncancelgeofilter").fadeOut('slow');
}
function maketranslations()
{
    $(".translate").each(function (i, v) {
        var tobetranslated = $(v).html();
        var translation = tobetranslated.replace("-#Annulla#-", getObjectText("unselect")).replace("-#Struttura#-", getObjectText("structure")).replace("-#GeoLocalizzazione#-", getObjectText("geolocalization"));
        $(v).html(translation);
    })
}