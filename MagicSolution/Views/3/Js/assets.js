var treefuncpars = {
    //customfuncs: "assetmanagement", // JS da caricare 
    //explorefunc: "treeselected", //funzione contenuta (di solito) nel customfuncs che scatta alla pressione del tasto "explore" sulla griglia degli asset
    //page: "/Views/3/Templates/AST_Assets.html", //html page
    //style: "/Views/3/Styles/assets.css", // css
    gridname: "AS_ASSET_asset",
    entityname: "AS_V_ASSET_assetExtended",
    pk: "AS_ASSET_ID",
    pkfilter: function (editid) { return { field: "AS_ASSET_ID", operator: "eq", value: editid } },
};



var pagehtml = '\
    <br />\
    <div id="treecontainer" class="k-content" style="background-color: transparent;">\
        <div class="row">\
            <div class="col-md-6 col-sm-6">\
                <!--BEGIN RECENT ACTIVITIES-->\
                <div class="k-block" style="overflow-y:scroll;">\
                    <div class="k-header k-shadow" style="height: 30px;">\
                        Struttura\
                    <a href="javascript:;" onclick="undoselection();" class="k-button" style="background-color: transparent !important; margin-top: 3px; padding-top: 0; padding-bottom: 0; float: right;">\
                        <i class="k-icon k-si-cancel"></i>Annulla\
                    </a>\
                    </div>\
                    <div class="portlet-body to-do-list">\
                        <div id="newRootItem">\
                            <img class="k-image" alt="" src="/Magic/Styles/Images/tree.png"><span>Trascina qui le tipologie per generare un nuovo elemento padre</span>\
                        </div>\
                        <div id="treeview-left-container" class="scroller" style="height: 300px;" data-always-visible="1" data-rail-visible="0">\
                            <br>\
                            <div id="treeview-left"></div>\
                        </div>\
                    </div>\
                </div>\
                <!--END RECENT ACTIVITIES-->\
            </div>\
            <div class="col-md-6 col-sm-6">\
                <!-- BEGIN PORTLET-->\
                <div class="k-block" style="overflow-y:scroll;">\
                    <div class="k-header k-shadow" style="height: 30px;">\
                        <div class="caption"><i class="icon-check"></i>Tipologie</div>\
                    </div>\
                    <div class="portlet-body">\
                        <div id="tipsastabstripcontainer" class="scroller" style="height: 305px;" data-always-visible="1" data-rail-visible1="1">\
                            <div id="tabstrip">\
                                <ul>\
                                </ul>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
                <!-- END PORTLET-->\
            </div>\
        </div>\
    </div>\
    <div id="assetinsertupdatedatawindow" class="k-popup-edit-form k-window-content k-content">\
        <div class="derivativeassetgrid"></div>\
    </div>';

function loadscript()
{
    require([window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/MagicDragAndDropFunctionsUtils.js"],
        function () {
            assetLauncher();
        }
    );
}


function assetLauncher()
{
    if ($(".derivativeassetgrid"))
    {
        if ($(".derivativeassetgrid").data("kendoGrid"))
            $(".derivativeassetgrid").data("kendoGrid").destroy();
        $(".derivativeassetgrid").remove();
    }

    
    apply_style("/Views/3/Styles/assets.css");  //applica css
    //creo la pagina custom
    $("#appcontainer").append(pagehtml);

    //#region main
    $("#assetinsertupdatedatawindow")
                               .kendoWindow({
                                   title: "Asset",
                                   modal: true,
                                   visible: false,
                                   resizable: false,
                                   width: "80%",
                                   position: { top: "15%", left: "10%" }
                               });

    var grid = getrootgrid('AS_ASSET_asset', null, 'grid', null, null);
    if (grid.columns[getcolumnindex(grid.columns, "AS_ASSET_ID_PADRE")] !== undefined)
        grid.columns[getcolumnindex(grid.columns, "AS_ASSET_ID_PADRE")].hidden = true;
    if (grid.columns[getcolumnindex(grid.columns, "AS_ASSET_DATA_FINE")] !== undefined)
        grid.columns[getcolumnindex(grid.columns, "AS_ASSET_DATA_FINE")].hidden = true;
    grid.dataSource.pageSize = 5;
   
   // grid.selectable = false;
	//TODO aggiungere filtro di datafine == null
	grid.dataSource.filter = !grid.dataSource.filter ? { field: "AS_ASSET_ID_PADRE", operator: "eq", value: null } : combineDataSourceFilters(grid.dataSource.filter, { field: "AS_ASSET_ID_PADRE", operator: "eq", value: null } );
    if (grid.columns[0].command) //se la prima colonna contiene gia' comandi
    {
        grid.columns[0].command.push({ name: "explorebtn", text: "explore", click: window["treeselected"], iconClass: "k-icon k-i-custom" });
        var gridrights = getGridRights(treefuncpars.gridname);
        if (grid.columns[0].command != undefined && gridrights.usercanupdate == true) //da eseguire solo se l' utente ha diritti full (perche' se no i bottoni li toglie la getrootgrid) 
            grid.columns[0].command.splice(0, 2);
    }
    renderGrid(grid, null, null);
   
    buildTabStripDataSource().then(function (ds) { 
        //async call to get  the list of AS_TIPSAS_specifica_asset
        $("#tabstrip").kendoTabStrip({
            animation: { open: { effects: "fadeIn" } },
            dataTextField: "text",
            dataImageUrlField: "imageUrl",
            dataContentField: "Content",
            dataSource: ds
        }).data("kendoTabStrip").select(0);
        if (gridrights.usercanupdate != false) { // se non ha diritti di modifica non attivo il drag and drop
            $("#newRootItem").kendoDropTarget({
                drop: droptargetOnDropCreateNewParent,
                dragenter: dropgenerictargetOnDragEnter,
                dragleave: dropgenerictargetOnDragLeave
            });
            makegenericspandraggable(".tipsas");
        }
    });
    var gridrights = getGridRights(treefuncpars.gridname);
    
    var gridobj = getrootgrid(treefuncpars.gridname, null, "derivativeassetgrid");
    gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
    var origedit__ = gridobj.edit;
    gridobj.edit = function (e) {
        editHiddenGridOverride_as(e, origedit__);
    }
    var kgrid = renderHiddenGrid(gridobj);
    kgrid.dataSource.bind("requestEnd", function (e) {
        if (e.type == "create") {
            //   console.log(e);
            if (e.response.Errors)
                return;
       
            var response = e.response.Data[0].Table[0];
            if (!response.AS_ASSET_ID_PADRE) {
                $("#newRootItem").hide();
                window.currentTreeAsset_ID = response.AS_ASSET_ID;
                window.currentTreeTipSas_ID = response.AS_ASSET_TIPSAS_ID;
                getassettree(window.currentTreeAsset_ID, window.currentTreeTipSas_ID);
                $(".input-group").show();
            }
            
        }
    });
    //#endregion
}
function assetSelectTree(event) {
    var $item = $(event.node);
    var assetid = $("#treeview-left [data-role=treeview]").data("kendoTreeView").dataItem($item).assetid;
    refreshAssetTabstrip(assetid);
}