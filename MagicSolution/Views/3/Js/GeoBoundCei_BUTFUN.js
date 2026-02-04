//Combinazione degli scritp: GeoboundCei.js, BUTFUN_initializer.js


//----------------------------------------------------------------//
//	2)	geoBoundCei.js
//----------------------------------------------------------------//
//#region INIT
var treefuncpars = {
    customfuncs: "assetmanagement", // JS da caricare 
    explorefunc: "treeselected", //funzione contenuta (di solito) nel customfuncs che scatta alla pressione del tasto "explore" sulla griglia degli asset
    page: "/Views/3/Templates/AST_Assets_CEI.html", //html page
    style: "/Views/3/Styles/assets.css", // css
    gridname: "ASSET_LIST_CEI_NEW",
    entityname: "AS_V_ASSET_List_cei",
    pk: "AS_ASSET_ID",
    pkfilter: function (editid) { return { field: "AS_ASSET_ID", operator: "eq", value: editid } },
    currentDbTree: "AS_ASSET_Tree"
};

console.log('GeoBundCei');
//#endregion

//Inizio instanziazione oggetti particolare (BUTFUN, tree)
function loadscript() {
    console.log('GeoBundCei1');
    require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
        require(["async!https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places,drawing&key=" + window.mapAK, treefuncpars.customfuncs],
            function () {
                require([window.includesVersion + "/Custom/3/Scripts/BUTFUN_initializer.js"], function () {
                    BUTFUN_initializer();                                                                       //Inizializzazione della barra BUTFUN
                });
                //google.maps.event.addDomListener(window, 'load', initialize);
                geoLauncher();
            });
    });
}



function geoLauncher() {
    //creo la pagina custom
    apply_style(treefuncpars.style);

    $("#appcontainer").append("<div id='appsubcontainer'/>");
    $("#appsubcontainer").load(treefuncpars.page, function (e) {
        maketranslations();


        //Prendo il modello della griglia
        var grid = getrootgrid(treefuncpars.gridname);

        //grid.dataSource.pageSize = 5;
        grid.selectable = "row";
        //   manageBtns(grid, treefuncpars.explorefunc);

        //////Non dovrebbero più servire----------------------//
        ////grid.change = function (e) {
        ////    //Gestione del diverso selettore necessario per la griglia
        ////    //  al primo caricamento della pagina la griglia ha id="grid"
        ////    //  dopo i lcaricamento da BUTFUN la griglia ha id="FunctionSubMenuGrid-1"
        ////    if ($("#FunctionSubMenuGrid-1").length > 0) {
        ////        var gridSelector = $("#FunctionSubMenuGrid-1");
        ////    }
        ////    else if ($("#grid").length > 0) {
        ////        var gridSelector = $("#grid");
        ////    }
        ////    else {
        ////        console.log("Contrrollare id della griglia");
        ////    }
        ////    var data = gridSelector.data("kendoGrid").dataItem(this.select());

        ////    //Non dovrebbero più servire----------------------//
        ////    var myLatlng = new google.maps.LatLng(data.LOCATION_LATITUDE, data.LOCATION_LONGITUDE);
        ////    setMarkerAndCenter(myLatlng, data.AS_ASSET_DESCRIZIONE);
        ////    //------------------------------------------------//
        ////};


        //Renderizza nuovamente la griglia dopo aver impostato i comandi
        renderGrid(grid, null, null);

        //var gridobj = getrootgrid("ASSET_LIST_CEI_NEW", null, "derivativeassetgrid");
        var gridobj = getrootgrid("ASSET_LIST_CEI", null, "derivativeassetgrid");
        gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
        renderHiddenGrid(gridobj);
        //#endregion

        ////Istanzio TipsasNavbar
        //setTimeout(BUTFUN_initializer(), 5000);
    });

    console.log("geoLauncher end.");
}

function geoBoundSelectTree(event) {
    var $item = $(event.node);
    var assetid = $("#treeview-left").data("kendoTreeView").dataItem($item).assetid;
    GetAssetById(assetid.toString()).then(function (assetdata) {
        var data = assetdata.Data[0].Table[0];
       // var myLatlng = new google.maps.LatLng(data.LOCATION_LATITUDE, data.LOCATION_LONGITUDE);
     //   setMarkerAndCenter(myLatlng, data.AS_ASSET_DESCRIZIONE);
    });
}

function redrawmap() {
    //Gestione del diverso selettore necessario per la griglia
    //  al primo caricamento della pagina la griglia ha id="grid"
    //  dopo i lcaricamento da BUTFUN la griglia ha id="FunctionSubMenuGrid-1"
    if ($("#FunctionSubMenuGrid-1").length > 0) {
        var gridSelector = $("#FunctionSubMenuGrid-1");
    }
    else if ($("#grid").length > 0) {
        var gridSelector = $("#grid");
    } else {
        console.log("Contrrollare id della griglia");
    }
    var currfilter = gridSelector.data("kendoGrid").dataSource.filter();
    var newfilter = removeFiltersByType(currfilter, "geofilter");
    gridSelector.data("kendoGrid").dataSource.filter(newfilter);
    $("#btncancelgeofilter").fadeOut('slow');
}

function maketranslations() {
    $(".translate").each(function (i, v) {
        var tobetranslated = $(v).html();
        var translation = tobetranslated.replace("-#Annulla#-", getObjectText("unselect")).replace("-#Struttura#-", getObjectText("structure")).replace("-#GeoLocalizzazione#-", getObjectText("geolocalization"));
        $(v).html(translation);
    })
}
//----------------------------------------------------------------//


//Setup Temporaneo in vista di una soluzione più valida
function GeoBoundCEISetup() {
    //Cambio id della griglia
    if ($("#FunctionSubMenuGrid-1").length > 0) {
        $("#FunctionSubMenuGrid-1")[0].id = 'grid';
    }
    //Rendering della griglia in popUp
    var foundGrid = false;                                      //Verifico che la griglia non sia già presente
    $('.derivativeassetgrid').each(function () {
        console.log($(this).attr('gridname'));
        if ($(this).attr('gridname') === 'ASSET_LIST_CEI') {
            foundGrid = true;
        }
    });
    if (!foundGrid) {
        var d = $("<div>", { "class": "derivativeassetgrid" });
        $('#assetinsertupdatedatawindow').append(d);
        var gridobj = getrootgrid("ASSET_LIST_CEI", null, "derivativeassetgrid");
        gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
        renderHiddenGrid(gridobj);
    }
}





////Setup Temporaneo in vista di una soluzione più valida
//function GeoBoundCEISetup() {

//    //Derivative grid
//    if ($(".derivativeassetgrid").length == 0) {
//        //Un hidddenGrid di test
//        var assetPopUpCEI = '<div class="derivativeassetgrid k-grid k-widget k-reorderable k-editable" data-role="grid" gridname="ASSET_LIST_CEI" detailtemplatename="ASSET_LIST_CEI_standardnavigation" editablename="ASSET_LIST_CEI_standardedit" editablecolumnnumber="2" style="touch-action: pan-y;"> <div class="k-header k-grid-toolbar"><a class="k-button k-button-icontext k-grid-save-changes" href="#"><span class="k-icon k-update"></span>Salva</a></div> <div class="k-grouping-header" data-role="droptarget" style="touch-action: pan-y;">Trascina la colonna per raggruppare</div> <div class="k-grid-header" style="padding-right: 17px;"> <div class="k-grid-header-wrap k-auto-scrollable" data-role="resizable" style="touch-action: pan-y;"> <table role="grid" tabindex="-1"> <colgroup> <col class="k-hierarchy-col"> <col style="width:110px"> <col style="width:60px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:60px"> <col style="width:90px"> </colgroup> <thead role="rowgroup"> <tr role="row"> <th class="k-hierarchy-cell k-header" scope="col">&nbsp;</th> <th scope="col" id="91906660-b9b5-40b2-83a5-85b1d50917dc" rowspan="1" data-index="0" class="k-header" data-role="droptarget">&nbsp;</th> <th scope="col" role="columnheader" rowspan="1" data-title="Azioni" data-index="1" id="473f2a9e-70e2-4ad4-9b7d-45f002b3d6e2" class="k-header" data-role="droptarget">Azioni</th> <th scope="col" role="columnheader" data-field="stato_fascicolo" rowspan="1" data-title="Stato fascicolo" data-index="2" id="e2e099d3-58fa-46f1-a42a-a0fff170afd1" style="display:none" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Stato fascicolo</a></th> <th scope="col" role="columnheader" data-field="CEI_COD_ENTE" rowspan="1" data-title="Codice Ente" data-index="3" id="cd369a6d-2781-4f01-b1f2-c65e81eb6604" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Codice Ente</a></th> <th scope="col" role="columnheader" data-field="Visible_group" rowspan="1" data-title="Parrocchia/Ente" data-index="4" id="c8a10734-ed39-4c4b-8483-b73e0434d674" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Parrocchia/Ente</a></th> <th scope="col" role="columnheader" data-field="Zona_past" rowspan="1" data-title="Zona pastorale" data-index="5" id="ffcfbb90-1dce-4ada-9c7e-14e7fefe770c" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Zona pastorale</a></th> <th scope="col" role="columnheader" data-field="Vicariato" rowspan="1" data-title="Vicariato/Decanato" data-index="6" id="ab6b9ab7-adc0-410c-bf57-7d48d2330262" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Vicariato/Decanato</a></th> <th scope="col" role="columnheader" data-field="Unit_past" rowspan="1" data-title="Unità pastorale" data-index="7" id="e7381dcc-af09-46c7-8192-374e00ffda2b" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Unità pastorale</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_CODE" rowspan="1" data-title="Codice" data-index="8" id="3d324a83-f9d8-453e-9d8f-8fd0acb4e293" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Codice</a></th> <th scope="col" role="columnheader" data-field="AS_TIPASS_DESCRIPTION" rowspan="1" data-title="Classe" data-index="9" id="d1ca30d5-2bd9-492d-8987-437a59892645" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Classe</a></th> <th scope="col" role="columnheader" data-field="AS_GENVAM_DESCRIPTION" rowspan="1" data-title="Tipologia" data-index="10" id="d4e67b70-c1dc-4180-9f08-71275b726086" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Tipologia</a></th> <th scope="col" role="columnheader" data-field="AS_TIPSAS_DESCRIPTION" rowspan="1" data-title="Qualifica" data-index="11" id="406e9c15-7f22-4365-8105-1711e3175805" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Qualifica</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_SASSPE_ID" rowspan="1" data-title="Specifica" data-index="12" id="cb708a4f-4966-41b7-bc55-870564765c10" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Specifica</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_DESCRIZIONE" rowspan="1" data-title="Denominazione" data-index="13" id="00ab4bd3-cd4f-4d41-8cd1-0d5ab4445dfa" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Denominazione</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_TIPSAS_ID" rowspan="1" data-title="Qualifica" data-index="14" id="bb8f54d6-e530-4f96-8a7b-aeeee42004de" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Qualifica</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_CODE_FATHER" rowspan="1" data-title="Codice asset principale" data-index="15" id="b40eb574-757f-4604-86ba-9905b1207f4d" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Codice asset principale</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_ADDRESS" rowspan="1" data-title="Indirizzo" data-index="16" id="d5e1f96c-cf1a-4da7-b2cf-17adf3808a53" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Indirizzo</a></th> <th scope="col" role="columnheader" data-field="LOCALITY_NAME" rowspan="1" data-title="Città" data-index="17" id="cf35023f-8653-46ec-8d07-17cfa5c1006b" style="display:none" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Città</a></th> <th scope="col" role="columnheader" data-field="district" rowspan="1" data-title="Provincia" data-index="18" id="3e5bd616-ca1c-4285-b00c-72df5cdf68e0" style="display:none" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Provincia</a></th> <th scope="col" role="columnheader" data-field="region" rowspan="1" data-title="Regione" data-index="19" id="fd406f15-9e0c-4f0f-aecd-05d738b184e2" style="display:none" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Regione</a></th> <th scope="col" role="columnheader" data-field="P_CODE" rowspan="1" data-title="Cap" data-index="20" id="6c76913e-cd5d-4ed5-ba01-b538659cdd52" style="display:none" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Cap</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_DATA_INIZIO" rowspan="1" data-title="Data inizio" data-index="21" id="fd522ed7-a51e-481b-9a55-f591b96aafea" style="display:none" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Data inizio</a></th> <th scope="col" role="columnheader" data-field="AS_ASSET_DATA_FINE" rowspan="1" data-title="Data fine" data-index="22" id="e6f8a15b-9df1-4e55-9245-64659e692778" style="display:none" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Data fine</a></th> <th scope="col" role="columnheader" data-field="Fl_FascicoloAttivo" rowspan="1" data-title="Fascicolo presente" data-index="23" id="0543979d-e081-45e0-8b8b-89433ccac8d4" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Fascicolo presente</a></th> <th scope="col" role="columnheader" data-field="CEI_SPECIFICA" rowspan="1" data-title="Specifica" data-index="24" id="b1fb8954-9936-41a4-b793-cf3bcc0c0174" class="k-header k-with-icon" data-role="columnsorter"><a class="k-header-column-menu" href="#" tabindex="-1"><span class="k-icon k-i-arrowhead-s">Impostazioni</span></a><a class="k-link" href="#" tabindex="-1">Specifica</a></th> <th scope="col" role="columnheader" rowspan="1" data-title="Registro" data-index="25" id="5c2636f4-edbf-4e7d-be31-a3a94a672584" class="k-header" data-role="droptarget">Registro</th> <th scope="col" role="columnheader" rowspan="1" data-title="<span class='k-header-column-menu'><span class='k-icon k-i-arrowhead-s'></span></span><span class='k-link'>Estensione</span>" data-index="26" id="94c72469-68ed-4bf0-9090-40b6cecd6a42" class="k-with-icon xmlFilterColumn k-header" onclick="addXMLFilters(this)" data-role="droptarget"><span class="k-header-column-menu"><span class="k-icon k-i-arrowhead-s"></span></span><span class="k-link">Estensione</span></th> </tr> </thead> </table> </div> </div> <div class="k-grid-content k-auto-scrollable"> <table role="treegrid" tabindex="0" data-role="selectable" class="k-selectable" style="touch-action: pan-y;"> <colgroup> <col class="k-hierarchy-col"> <col style="width:110px"> <col style="width:60px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:100px"> <col style="width:60px"> <col style="width:90px"> </colgroup> <tbody role="rowgroup"> <tr class="k-master-row" data-uid="5b709f8b-85a7-4b63-8881-20a27c8cabdd" role="row"> <td class="k-hierarchy-cell"><a class="k-icon k-plus" href="#" tabindex="-1"></a></td> <td role="gridcell"><a class="k-button k-button-icontext k-grid-edit" href="#"><span class="k-icon k-edit"></span></a><a class="k-button k-button-icontext k-grid-delete" href="#"><span class="k-icon k-delete"></span></a><a class="k-button k-button-icontext k-grid-FascImmID" href="javascript:void(0)"><span class=" "></span>Fascicolo</a><a class="k-button k-button-icontext k-grid-ASSET_LIST_CEI_view" href="javascript:void(0)"><span class=" "></span><i class="fa fa-television"></i></a></td> <td role="gridcell"> <div style="text-align:center;"><span title="Record status actions" class="glyphicon glyphicon-th-list" style="cursor:pointer;" onclick="getfunctionsforRecord(this,'Custom.AS_V_ASSET_List_cei','customactions')">                    </span></div> </td> <td style="display:none" role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Ente non abilitato</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">1F03</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)"> Santi Apostoli e Nazaro Maggiore</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">1 Zona Pastorale I - Milano</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">1J Decanato "Centro Storico"</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)"></div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">1F03_965</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Beni complessi</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Edificio di culto</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Chiesa</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Sussidiaria</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">S.Antonio</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Chiesa</div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)"></div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Via Sant&apos;Antonio, 20122 Milano MI, Italy</div> </td> <td style="display:none" role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Milano</div> </td> <td style="display:none" role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">MILANO</div> </td> <td style="display:none" role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">LOMBARDIA</div> </td> <td style="display:none" role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">20122</div> </td> <td style="display:none;text-align:center;" role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)"></div> </td> <td style="display:none;text-align:center;" role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)"></div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)"><img src=" /Magic/Styles/Images/cross.png"></div> </td> <td role="gridcell"> <div class="magicGridTd" onclick="initGridCellTooltip(this)">Edificio di culto tutelato</div> </td> <td role="gridcell"> <div style="text-align:center;"><span class="glyphicon glyphicon-list-alt" style="cursor:pointer;" onclick="recordHistory(this,'Custom.AS_V_ASSET_List_cei','Asset','')"></span></div> </td> <td role="gridcell"> <div style="text-align:center;"><span class="glyphicon glyphicon-th-list" style="cursor:pointer;" onclick="gridShowRowXml(this)"></span></div> </td> </tr> </tbody> </table> </div> <div class="k-pager-wrap k-grid-pager k-widget k-floatwrap" data-role="pager"> <a href="#" title="Go to the first page" class="k-link k-pager-nav k-pager-first k-state-disabled" data-page="1" tabindex="-1"><span class="k-icon k-i-seek-w">Go to the first page</span></a><a href="#" title="Go to the previous page" class="k-link k-pager-nav  k-state-disabled" data-page="1" tabindex="-1"><span class="k-icon k-i-arrow-w">Go to the previous page</span></a> <ul class="k-pager-numbers k-reset"> <li class="k-current-page"><span class="k-link k-pager-nav">1</span></li> <li><span class="k-state-selected">1</span></li> </ul> <a href="#" title="Go to the next page" class="k-link k-pager-nav  k-state-disabled" data-page="1" tabindex="-1"><span class="k-icon k-i-arrow-e">Go to the next page</span></a><a href="#" title="Go to the last page" class="k-link k-pager-nav k-pager-last k-state-disabled" data-page="1" tabindex="-1"><span class="k-icon k-i-seek-e">Go to the last page</span></a> <span class="k-pager-sizes k-label"> <span title="" class="k-widget k-dropdown k-header" unselectable="on" role="listbox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-owns="" aria-disabled="false" aria-readonly="false" aria-busy="false" aria-activedescendant="964a1c8a-0a88-44af-8e78-81a28ae7439c" style=""> <span unselectable="on" class="k-dropdown-wrap k-state-default"><span unselectable="on" class="k-input">10</span><span unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-arrow-s">select</span></span></span> <select data-role="dropdownlist" style="display: none;"> <option value="5">5</option> <option value="10">10</option> <option value="25">25</option> <option value="50">50</option> <option value="100">100</option> <option value="500">500</option> <option value="1000">1000</option> <option value="30000">30000</option> </select> </span> oggetti per pagina </span> <a href="#" class="k-pager-refresh k-link" title="Refresh"><span class="k-icon k-i-refresh">Refresh</span></a><span class="k-pager-info k-label">1-1 di 1 oggetti</span> </div> </div>';
//        $('#assetinsertupdatedatawindow')[0].append(assetPopUpCEI);

//        //Cambio id della griglia root (Per compatibilità con altre eventuali funzionalità)
//        $('#FunctionSubMenuGrid-1').each(function(){
//            if(this.id){this.id = 'grid';}
//        });

//        //REnderizzo la nuova HddenGrid
//        var gridobj = getrootgrid("ASSET_LIST_CEI", null, "derivativeassetgrid");
//        gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
//        renderHiddenGrid(gridobj);
//    }


//}





