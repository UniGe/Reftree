//#region INIT
var treefuncpars = {
    customfuncs: "assetmanagement", // JS da caricare 
    explorefunc: "treeselected", //funzione contenuta (di solito) nel customfuncs che scatta alla pressione del tasto "explore" sulla griglia degli asset
    page: "/Views/3/Templates/AST_Assets.html", //html page
    style: "/Views/3/Styles/assets.css", // css
    gridname: "ASSET_LIST_CEI",
    entityname: "AS_V_ASSET_List_cei",
    pk: "AS_ASSET_ID",
    pkfilter: function (editid) { return { field: "AS_ASSET_ID", operator: "eq", value: editid } },
    currentDbTree: "AS_ASSET_Tree"
};
//#endregion
//window.currentDbTree = "AS_ASSET_Tree";

function loadscript() {
    require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
        require(["async!https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places,drawing&key=" + window.mapAK, treefuncpars.customfuncs],
            function () {
                google.maps.event.addDomListener(window, 'load', initialize);
                geoLauncher();
            });
    });
}

////Inizio instanziazione oggetti particolare (BUTFUN, tree)
//function loadscript() {
//    require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
//        require(["async!https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places,drawing&key=" + window.mapAK, treefuncpars.customfuncs],
//            function () {
//                require([window.includesVersion + "/Custom/3/Scripts/BUTFUN_initializer.js"], function () {
//                    BUTFUN_initializer();                                                                       //Inizializzazione della barra BUTFUN
//                });
//                google.maps.event.addDomListener(window, 'load', initialize);
//                geoLauncher();
//            });
//    });
//}


function geoLauncher() {
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
            geoAssetDataBound.call(this, e);

        }
        grid.dataSource.pageSize = 5;
        grid.selectable = "row";
        manageBtns(grid, treefuncpars.explorefunc);
        grid.change = function (e) {
            var data = $("#grid").data("kendoGrid").dataItem(this.select());
            var myLatlng = new google.maps.LatLng(data.LOCATION_LATITUDE, data.LOCATION_LONGITUDE);
            setMarkerAndCenter(myLatlng, data.AS_ASSET_DESCRIZIONE);
        };
        renderGrid(grid, null, null);
        var gridobj = getrootgrid("ASSET_LIST_CEI", null, "derivativeassetgrid");
        gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
        renderHiddenGrid(gridobj);
        //#endregion
    });

}

function geoBoundSelectTree(event) {
    var $item = $(event.node);
    var assetid = $("#treeview-left").data("kendoTreeView").dataItem($item).assetid;
    GetAssetById(assetid.toString()).then(function (assetdata) {
        var data = assetdata.Data[0].Table[0];
        var myLatlng = new google.maps.LatLng(data.LOCATION_LATITUDE, data.LOCATION_LONGITUDE);
        setMarkerAndCenter(myLatlng, data.AS_ASSET_DESCRIZIONE);
    });
}

function redrawmap() {
    var currfilter = $("#grid").data("kendoGrid").dataSource.filter();
    var newfilter = removeFiltersByType(currfilter, "geofilter");
    $("#grid").data("kendoGrid").dataSource.filter(newfilter);
    $("#btncancelgeofilter").fadeOut('slow');
}
function maketranslations() {
    $(".translate").each(function (i, v) {
        var tobetranslated = $(v).html();
        var translation = tobetranslated.replace("-#Annulla#-", getObjectText("unselect")).replace("-#Struttura#-", getObjectText("structure")).replace("-#GeoLocalizzazione#-", getObjectText("geolocalization"));
        $(v).html(translation);
    })
}



//$(document).ready(function () {
//    var DataGrid = $("#grid").data("kendoGrid").dataSource.view();
//    console.log(DataGrid);
//    //var grid = $("#Grid").data("kendoGrid");
//    //grid.bind("dataBound", function () {
//    //    console.log('passo2');
//    //});
//})