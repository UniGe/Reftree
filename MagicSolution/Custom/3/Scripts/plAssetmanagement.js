//Custom functions for treebased funcs

function isGeo()
{
    if ($(".gmaps").length > 0)
        return true;
    return false;
}

//gestione drop su Tree
function droptargetOnDropRootImpianti(e) {
    window.DragAndDropFuncsCurrentParentID = null;
    window.DragAndDropFuncsCurrentTypeID = $(e.draggable.element).attr('tipassid');
    window.DragAndDropFuncsCurrentClassID = $(e.draggable.element).attr('claassid');
    window.DragAndDropFuncsCurrentLayerid = $(e.draggable.element).attr('layerid');
    editHiddenGrid();
}

function droptargetOnDropImpianti(e) {
    //detect if the drop occured over a tree node
    var nodeds = $('[data-role="treeview"]').data('kendoTreeView').dataItem(e.dropTarget);
    window.DragAndDropFuncsCurrentParentID = nodeds.assetid;
    window.DragAndDropFuncsCurrentTypeID = $(e.draggable.element).attr('tipassid');
    window.DragAndDropFuncsCurrentClassID = $(e.draggable.element).attr('claassid');
    window.DragAndDropFuncsCurrentLayerid = $(e.draggable.element).attr('layerid');
    //check compatibility
    var ds = buildXMLStoredProcedureJSONDataSource({ PL_ASSET_ID: nodeds.assetid, PL_TIPASS_ID: window.DragAndDropFuncsCurrentTypeID }, function (e) {
        if (e.items[0].FL_CHECK)
            editHiddenGrid();
        else
            kendoConsole.log(getObjectText("incomptypes"), true);
    }, "core.PL_USP_ASSTRE_CHECK");
    ds.read();
}

//pressione del bottone explore su pl asset
function plassetselected(e) {
    e.preventDefault();
    var selectedrow = $(e.currentTarget).closest("tr");
    var PL_ASSET_ID = this.dataItem(selectedrow).PL_ASSET_ID;
    var PL_ASSET_DESCRIPTION = this.dataItem(selectedrow).PL_ASSET_DESCRIPTION;
    if (this.dataItem(selectedrow) != null) {
        buildPLTree(PL_ASSET_DESCRIPTION, PL_ASSET_ID);
    }
};
//template di nodo
function treePlAssetTemplate(item) { return (item.assettoexplode); }
//selezione di un nodo del tree
function plAssetSelectTree(event) {
    if (isGeo())
    {
        geoBound_PlAssetSelectTree(event);
        return;
    }
    var $item = $(event.node);
    var plassetid = $("#treeview-left [data-role=treeview]").data("kendoTreeView").dataItem($item).assetid;
    refreshTypesTabStrip(plassetid);
}

function buildPLTree(PL_ASSET_DESCRIPTION,PL_ASSET_ID)
{
    function activateDragAndDropInTree() {
        if (isGeo()) // le funzioni con google map non prevedono il drag and drop
        {
            $("#treeview-left [data-role=treeview]").data("kendoTreeView").trigger("select", {
                node: $("#treeview-left .k-item:first")[0]
            });
            return;
        }
        var gridrights = getGridRights(treefuncpars.gridname);
        if (gridrights.usercanupdate == true) {
            $("#newRootItem img").after("<span>" + getObjectText("dragonroot") + "</span>");
            $("#newRootItem").kendoDropTarget({
                drop: droptargetOnDropRootImpianti,
                dragenter: dropgenerictargetOnDragEnter,
                dragleave: dropgenerictargetOnDragLeave
            });
            $("#treeview-left li").kendoDropTarget({
                dragenter: dropgenerictargetOnDragEnter,
                dragleave: dropgenerictargetOnDragLeave,
                drop: droptargetOnDropImpianti //customize this
            });
        }
        else {
            $("#treeview-left span.treeButton").hide();
        }
    }
    $("#newRootItem").remove();
    $("#complistheader")
      .html(PL_ASSET_DESCRIPTION + '<a href="javascript:;" onclick="undoitemselection();" class="k-button" style="background-color: transparent !important; margin-top: 3px; padding-top: 0; padding-bottom: 0; float: right;">\<i class="k-icon k-si-cancel"></i>Annulla</a>');
    var options = { name: "PL_USP_GetAsset", data: { PL_ASSET_ID: PL_ASSET_ID }, treecontainer: "#treeview-left", showtreedescription: false, callback: activateDragAndDropInTree };
    getrootAndRenderDBTree(options); //crea il tree nel container dato        
    //classi e tipi di componenti compatibili con l' asset selezionato
    if (!isGeo())
        refreshTypesTabStrip(PL_ASSET_ID);
}

function buildComponentImpiantiDataSource(items, assetid) {

    function solveid(id) {
        if (!id || id == null)
            return 0;
        else
            return id;
    }

    var ds = [];
    var hashofIC = {};
    for (var i = 0; i < items.length; i++) {
        var content = '<span layerid=' + solveid(items[i].MagicBOLayer_ID) + ' assetid=' + solveid(assetid) + ' claassid=' + items[i].PL_CLAASS_ID + ' tipassid=' + items[i].PL_TIPASS_ID + '  id="sp_cc_' + items[i].PL_TIPASS_ID + '" class="tipimp">' + items[i].PL_TIPASS_DESCRIPTION + '</span>';
        if (hashofIC[items[i].PL_CLAASS_ID] == null) {
            var obj = {};
            obj.text = items[i].PL_CLAASS_DESCRIPTION;
            obj.imageUrl = "";
            obj.value = items[i].PL_CLAASS_ID;
            obj.Content = content;
            hashofIC[items[i].PL_CLAASS_ID] = obj;
        }
        else if (hashofIC[items[i].PL_CLAASS_ID].Content.indexOf('id="sp_cc_' + items[i].PL_TIPASS_ID.toString()) == -1)
            hashofIC[items[i].PL_CLAASS_ID].Content += content;

    }
    Object.keys(hashofIC).forEach(function (key) {
        var value = hashofIC[key];
        ds.push(value);
    });

    return ds;
}

//richiamate nel PL_asset_tree_Template associato ai nodi
function modifyplasset(e) {
    var assetid = $("[data-role=treeview]").data('kendoTreeView').dataItem($($(e).closest("li")[0])).assetid;
    editHiddenGrid(assetid);
}

function destroyplasset(e) {
    if (confirm(getObjectText("CONFIRMATION"))) {
        var assetid = $("[data-role=treeview]").data('kendoTreeView').dataItem($($(e).closest("li")[0])).assetid;
        var onsucc = function (result) {
            $("#grid").data("kendoGrid").dataSource.read();
            refreshtree();
            if (result.msgType !== "WARN")
                kendoConsole.log(result.message, false);
            else
                kendoConsole.log(result.message, "info");
        }
        performGenericPostD(assetid, "core.PL_ASSET_plant_asset", "PL_ASSET_ID", "core.usp_ins_upd_del_stmt_PL_asset", "XML", -1, -1, {}, onsucc);
    }
}
function GetPlAsset(PL_ASSET_ID) {
    return $.ajax({ //#mfapireplaced
        type: "POST",
        url: "/api/AS_V_ASSET_assetgroups/GetPlAssets",
        data: JSON.stringify({ PL_ASSET_ID: ""+PL_ASSET_ID }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    });
}
function setWindowAsModels_(model)
{
    window.DragAndDropFuncsCurrentTypeID = model["PL_ASSET_PL_TIPASS_ID"];
    window.DragAndDropFuncsCurrentClassID = model["PL_TIPASS_CLAASS_ID"];
    window.DragAndDropFuncsCurrentParentID = model["PL_ASSET_ASSET_ID_FATHER"];

}

//associata alla hidden grid onedit serve a preimpostare i valori che derivano dal drag della tipologia
function editHiddenGridOverride(e) {
    if (window.DragAndDropFuncsAction == "update")
        setWindowAsModels_(e.model);
    var tip = (window.DragAndDropFuncsCurrentTypeID ? window.DragAndDropFuncsCurrentTypeID : null);
    var cla = (window.DragAndDropFuncsCurrentClassID ? window.DragAndDropFuncsCurrentClassID : null);
    var par = (window.DragAndDropFuncsCurrentParentID ? window.DragAndDropFuncsCurrentParentID : null);
    $("input[name=PL_TIPASS_CLAASS_ID],input[name=PL_ASSET_PL_TIPASS_ID]").removeAttr("required");
    e.model.set("PL_ASSET_ASSET_ID_FATHER", parseInt(par == null ? 0 : par));
    e.model.set("PL_TIPASS_CLAASS_ID", parseInt(cla == null ? 0 : cla));
    e.model.set("PL_ASSET_PL_TIPASS_ID", parseInt(tip == null ? 0 : tip));
    $("input[name=PL_TIPASS_CLAASS_ID]").data("kendoDropDownList").bind("dataBound", function (dd) {
        e.model.set("PL_TIPASS_CLAASS_ID", parseInt(cla == null ? 0 : cla)); dd.sender.value(parseInt(cla)); dd.sender.enable(false);
    });
    $("input[name=PL_ASSET_PL_TIPASS_ID]").data("kendoDropDownList").bind("dataBound", function (dd) { 
        e.model.set("PL_ASSET_PL_TIPASS_ID", parseInt(tip == null ? 0 : tip)); dd.sender.value(parseInt(tip)); dd.sender.enable(false);
    });
    manageStageConstraints.call(this,e, treefuncpars.gridname, treefuncpars.entityname).then(function (items) {
        $(items).each(function (i, v) {
            if (v.EV_DEFAULT_VALUE)
                e.model[v.ColumnName] = v.EV_DEFAULT_VALUE;
        });
        getStandardEditFunction(e, null, "derivativeassetgrid");
    });
    return true;
}

function initContainers()
{
    var gridrights = getGridRights(treefuncpars.gridname);
    if (gridrights.usercanupdate) {
        $("#treeview-left-container").prepend('<div id="newRootItem"><img class="k-image" alt="" src="/Magic/Styles/Images/tree.png"><span>' + getObjectText("dragonroot") + '</span></div>');
        $("#newRootItem").kendoDropTarget({
            drop: droptargetOnDropRootImpianti,
            dragenter: dropgenerictargetOnDragEnter,
            dragleave: dropgenerictargetOnDragLeave
        });
    }
    refreshTypesTabStrip(null);
    
}
//estrae i tipi compatibili e ricrea il tabstrip sulla DX
function refreshTypesTabStrip(PL_ASSET_ID)
{
    var gridrights = getGridRights(treefuncpars.gridname);
    var ds = buildXMLStoredProcedureJSONDataSource({ PL_ASSET_ID: PL_ASSET_ID }, function (e) {
        $("#assclassi_tabstrip").remove();
        $("#assclassi").append("<div id='assclassi_tabstrip'/>");
        var ds = buildComponentImpiantiDataSource(e.items, PL_ASSET_ID);
        if (ds && ds.length > 0)
            $("#assclassi_tabstrip").kendoTabStrip({
                animation: { open: { effects: "fadeIn" } },
                dataTextField: "text",
                dataImageUrlField: "imageUrl",
                dataContentField: "Content",
                dataSource: ds
            }).data("kendoTabStrip").select(0);
        if (gridrights.usercanupdate) {
            makegenericspandraggable(".tipimp");
        }
    }, "core.usp_pl_get_tipsas");
    ds.read();
}
function undoitemselection()
{
    $("#treeview-left-container").html('<div id="treeview-left"></div>');
    $("#complistheader")
            .html(getObjectText("structure")+'<a href="javascript:;" onclick="undoitemselection();" class="k-button" style="background-color: transparent !important; margin-top: 3px; padding-top: 0; padding-bottom: 0; float: right;">\<i class="k-icon k-si-cancel"></i>'+getObjectText("cancel")+'</a>');
    initContainers();
}