//#region general

//pressione del bottone explore
function treeselected(e) {
    e.preventDefault();
    var selectedrow = $(e.currentTarget).closest("tr");//this.select();
    var ASSET_ID = this.dataItem(selectedrow).AS_ASSET_ID;
    var ASSET_DESCRIPTION = this.dataItem(selectedrow).AS_ASSET_DESCRIZIONE;
    if (this.dataItem(selectedrow) != null) {
        if ($(e.currentTarget).parents(".k-grid").attr("explore") == "components") //caso explore da componenti
        {
            $("#complistheader").html(ASSET_DESCRIPTION);
            var options = { name: "AS_USP_GetComponets_Tree", data: { assetid: ASSET_ID }, treecontainer: "#treeview-left", showtreedescription: false, hidenodeselector: ".k-top.k-bot" };
            getrootAndRenderDBTree(options); //crea il tree nel container dato

            //classi e tipi di componenti compatibili con l' asset selezionato
            var ds = buildXMLStoredProcedureJSONDataSource({ assetid: ASSET_ID }, function (e) {
                $("#assoccomponenti_tabstrip").remove();
                $("#assoccomponenti").append("<div id='assoccomponenti_tabstrip'/>");
                var ds = buildComponentClassesDataSource(e.items, ASSET_ID);
                if (ds && ds.length > 0)
                    $("#assoccomponenti_tabstrip").kendoTabStrip({
                        animation: { open: { effects: "fadeIn" } },
                        dataTextField: "text",
                        dataImageUrlField: "imageUrl",
                        dataContentField: "Content",
                        dataSource: ds
                    }).data("kendoTabStrip").select(0);
            }, "core.get_fp_component_classes_types");
            ds.read();

        }
        else {  //caso da asset definizione e geo
            $("#newRootItem").hide();
            window.currentTreeAsset_ID = ASSET_ID;
            window.currentTreeTipSas_ID = this.dataItem(selectedrow).AS_ASSET_TIPSAS_ID;
            getassettree(window.currentTreeAsset_ID, window.currentTreeTipSas_ID, treefuncpars.currentDbTree,treefuncpars.gridname);
            $(".input-group").show();
        }
    }
};
//#endregion
//#region Asset

//Pressione di Clear su Struttura asset
function undoselection() {
    $("#treeview-left").remove();
    $("#newRootItem").show();
    $("#tabstrip").remove();
    $("#tipsastabstripcontainer").append('<div id="tabstrip"> <ul></ul> </div>');
    refreshAssetTabstrip(null,treefuncpars.gridname);
}

//drop per creazione di un nuovo asset
function droptargetOnDropCreateNewParent(e) {
    window.DragAndDropFuncsCurrentParentID = null;
    window.DragAndDropFuncsCurrentTypeID = $(e.draggable.element).attr('tipsasID');
    window.DragAndDropFuncsCurrentClassID = $(e.draggable.element).attr('tipassID');
    window.DragAndDropFuncsCurrentLayerid = $(e.draggable.element).attr('layerid');
    editHiddenGrid();
}

//update/delete da action button sul tree 
function modifyasset(e) {
    var assetid = $("[data-role=treeview]").data('kendoTreeView').dataItem($($(e).closest("li")[0])).assetid;
    editHiddenGrid(assetid);
}

function destroyasset(e) {
    if (confirm(getObjectText("CONFIRMATION"))) {
        var assetid = $("[data-role=treeview]").data('kendoTreeView').dataItem($($(e).closest("li")[0])).assetid;
        var onsucc = function (result) {
            $("#grid").data("kendoGrid").dataSource.read();
            getassettree(window.currentTreeAsset_ID, window.currentTreeTipSas_ID,treefuncpars.currentDbTree, treefuncpars.gridname);
            if (result.msgType !== "WARN")
                kendoConsole.log(result.message, false);
            else
                kendoConsole.log(result.message, "info");
        }
        //performGenericPostD(assetid, "core.AS_ASSET_asset", "AS_ASSET_ID", "core.usp_ins_upd_del_stmt_asset", "XML", -1, -1, {}, onsucc);
        performGenericPostD(assetid, "core.AS_VI_ASSET_VIEW", "AS_ASSET_ID", "core.usp_ins_upd_del_stmt_asset", "XML", -1, -1, {}, onsucc);
    }
}

//data load and DOM rebuild
function GetAssetById(AS_ASSET_ID) {
    return $.ajax({
        type: "POST",
        url: "/api/AS_V_ASSET_assetgroups/GetAsAsset_assetExtended",
        data: JSON.stringify({ AS_ASSET_ID: "" + AS_ASSET_ID }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    });
}

function buildTabStripDataSource(assetid) {

    function getSpecificheHash(listofspecifiche)
    {
        var specificheHash = {};
        $.each(listofspecifiche, function (i, v) {
            if (!specificheHash[v.AS_TIPASS_ID])
                // 2018-09-04 - Nicola Migliore: Gestito ordinamento delle Classi in base al campo AS_SUBTIP_ORDINE
                //specificheHash[v.AS_TIPASS_ID] = { AS_TIPASS_DESCRIPTION: v.AS_TIPASS_DESCRIPTION, GENVAM: {} };
                specificheHash[v.AS_TIPASS_ID] = { AS_TIPASS_DESCRIPTION: v.AS_TIPASS_DESCRIPTION, GENVAM: {}, order: v.AS_SUBTIP_ORDINE && v.AS_SUBTIP_ORDINE!=null ? v.AS_SUBTIP_ORDINE : 0 };
            if (v.AS_GENVAM_CODE) {
                if (!specificheHash[v.AS_TIPASS_ID].GENVAM[v.AS_GENVAM_CODE])
                    specificheHash[v.AS_TIPASS_ID].GENVAM[v.AS_GENVAM_CODE] = { AS_GENVAM_CODE: v.AS_GENVAM_CODE, AS_GENVAM_DESCRIPTION: v.AS_GENVAM_DESCRIPTION, TIPSAS: [] };
                specificheHash[v.AS_TIPASS_ID].GENVAM[v.AS_GENVAM_CODE].TIPSAS.push(v);
            }
            else {
                if (!specificheHash[v.AS_TIPASS_ID]["_"])
                    specificheHash[v.AS_TIPASS_ID]["_"] = [];
                specificheHash[v.AS_TIPASS_ID]["_"].push(v)
            }
        })
        return specificheHash;
    }

    var step1 = $.Deferred(), result = $.Deferred();
    var ds = [];
    buildXMLStoredProcedureJSONDataSource({ AS_ASSET_ID: assetid }, function (e) {
        step1.resolve(e.items);
    }, "core.usp_AS_get_tipsas").read();

    var innernavbarheader = '<li {2}><a data-toggle="tab" href="#genvan{1}">{0}</a></li>';
    var innernavbarcontent = '<div id="genvan{1}" class="tab-pane fade {2}">{0}</div>';
    var innernavbartemplate = '<ul class="nav nav-tabs">\
                                  {0}\
                                </ul>\
                                <div class="tab-content">\
                                  {1}\
                                </div>';

    var hashoftipasset = {};
    $.when(step1)
        .then(function (listofspecifiche) {
            var hashsp = getSpecificheHash(listofspecifiche);
            var i = 0;
            $.each(hashsp, function (key, val) {
                // 2018-09-04 - Nicola Migliore: Gestito ordinamento delle Classi in base al campo AS_SUBTIP_ORDINE
                //var objtipasset = { text: val.AS_TIPASS_DESCRIPTION, imageUrl: "", value: key};
                var objtipasset = { text: val.AS_TIPASS_DESCRIPTION, imageUrl: "", value: key, order: val.order && val.order!=null ? val.order : 0 };

                //GENVAM cases
                var genvamHeaders = [];
                var genvambodies = [];

                console.log('GENVAM:' + JSON.stringify(val.GENVAM, null, 4));
   
                $.each(val.GENVAM, function (k, v) {
                    genvamHeaders.push(innernavbarheader.format(v.AS_GENVAM_DESCRIPTION, v.AS_GENVAM_CODE + "_" + key.toString(), i == 0 ? 'class="active" ' : ""));
                    var content = "";
                    $.each(v.TIPSAS, function (ii, vv) {
                        content += '<span id="sp_' + vv.AS_TIPSAS_ID.toString() + '" class="tipsas"  layerid="' + vv.MagicBOLayerID + '" templateid="' + vv.MagicTemplateID + '" gridname="' + vv.MagicGridName + '" tipsasID="' + vv.AS_TIPSAS_ID + '" tipassID="' + vv.AS_TIPASS_ID + '"><img alt="" class="k-image" src="/views/images/' + vv.AS_TIPSAS_ICONA + '" >' + vv.AS_TIPSAS_DESCRIPTION + '</span>';
                    });
                    genvambodies.push(innernavbarcontent.format(content, v.AS_GENVAM_CODE + "_" + key.toString(), i == 0 ? "in active" : ""));
                    i++;
                });
                objtipasset.Content = innernavbartemplate.format(genvamHeaders.join(''), genvambodies.join(''));

                //case of TIPASS direct link (mutual exclusive)
                if (val["_"] && val["_"].length) {
                    var content = "";
                    $.each(val["_"], function (i, vv) {
                        content += '<span id="sp_' + vv.AS_TIPSAS_ID.toString() + '" class="tipsas"  layerid="' + vv.MagicBOLayerID + '" templateid="' + vv.MagicTemplateID + '" gridname="' + vv.MagicGridName + '" tipsasID="' + vv.AS_TIPSAS_ID + '" tipassID="' + vv.AS_TIPASS_ID + '"><img alt="" class="k-image" src="/views/images/' + vv.AS_TIPSAS_ICONA + '" >' + vv.AS_TIPSAS_DESCRIPTION + '</span>';
                    });
                    objtipasset.Content = content;
                }
                hashoftipasset[key] = objtipasset;
            });
            //var spectable = listofspecifiche;
            //for (var i = 0; i < spectable.length; i++) {
            //    //the items are ordered by AS_TIPASS_CODE and AS_GENVAM_CODE
            //    if (hashoftipasset[spectable[i].AS_TIPASS_ID] == null) {
            //            var objtipasset = {};
            //            objtipasset.text = spectable[i].AS_TIPASS_DESCRIPTION;
            //            objtipasset.imageUrl = "";
            //            objtipasset.value = spectable[i].AS_TIPASS_ID;
            //            objtipasset.Content = '<span id="sp_' + spectable[i].AS_TIPSAS_ID.toString() + '" class="tipsas"  layerid="' + spectable[i].MagicBOLayerID + '" templateid="' + spectable[i].MagicTemplateID + '" gridname="' + spectable[i].MagicGridName + '" tipsasID="' + spectable[i].AS_TIPSAS_ID + '" tipassID="' + spectable[i].AS_TIPASS_ID + '"><img alt="icon" class="k-image" src="/views/images/' + spectable[i].AS_TIPSAS_ICONA + '" >' + spectable[i].AS_TIPSAS_DESCRIPTION + '</span>';
            //            hashoftipasset[spectable[i].AS_TIPASS_ID] = objtipasset;
            //    }
            //    else 
            //            hashoftipasset[spectable[i].AS_TIPASS_ID].Content += '<span id="sp_' + spectable[i].AS_TIPSAS_ID.toString() + '" class="tipsas"  layerid="' + spectable[i].MagicBOLayerID + '" templateid="' + spectable[i].MagicTemplateID + '" gridname="' + spectable[i].MagicGridName + '" tipsasID="' + spectable[i].AS_TIPSAS_ID + '" tipassID="' + spectable[i].AS_TIPASS_ID + '"><img alt="icon" class="k-image" src="/views/images/' + spectable[i].AS_TIPSAS_ICONA + '" >' + spectable[i].AS_TIPSAS_DESCRIPTION + '</span>';
            //}
            Object.keys(hashoftipasset).forEach(function (key) {
                var value = hashoftipasset[key];
                ds.push(value);
            });

            // 2018-09-04 - Nicola Migliore: Gestito ordinamento delle Classi in base al campo AS_SUBTIP_ORDINE
            //Fornisco funzione di ordiinamento e aggiorno l'array con i valori ordinati
            ds = ds.sort((a,b) => {
                if(!a.order || !b.order){           //Controllo che siano presenti i paramentri di ordinamento
                    return 0;
                }
                return a.order >= b.order ? 1 : -1;
            });

            return result.resolve(ds);
        });
    return result.promise();
}

//function buildTabStripDataSource(items, assetid) {

//    function solveid(id) {
//        if (!id || id == null)
//            return 0;
//        else
//            return id;
//    }

//    var ds = [];
//    var hashofIC = {};
//    for (var i = 0; i < items.length; i++) {
//        var content = '<span layerid=' + solveid(items[i].MagicBOLayer_ID) + ' assetid=' + solveid(assetid) + ' claassid=' + items[i].AS_TIPASS_ID + ' tipassid=' + items[i].AS_TIPSAS_ID + '  id="sp_cc_' + items[i].AS_TIPSAS_ID + '" class="tipimp">' + items[i].AS_TIPSAS_DESCRIPTION + '</span>';
//        if (hashofIC[items[i].AS_TIPASS_ID] == null) {
//            var obj = {};
//            obj.text = items[i].AS_TIPSAS_DESCRIPTION;
//            obj.imageUrl = "";
//            obj.value = items[i].AS_TIPASS_ID;
//            obj.Content = content;
//            hashofIC[items[i].AS_TIPASS_ID] = obj;
//        }
//        else if (hashofIC[items[i].AS_TIPASS_ID].Content.indexOf('id="sp_cc_' + items[i].AS_TIPSAS_ID.toString()) == -1)
//            hashofIC[items[i].AS_TIPASS_ID].Content += content;

//    }
//    Object.keys(hashofIC).forEach(function (key) {
//        var value = hashofIC[key];
//        ds.push(value);
//    });

//    return ds;
//}

function getassettree(asset_id, selectedrow, dbTreeName,gridname) {
    if (true) {
        $("#treeview-left").remove();
        $("#treeview-left-container").append('<div id="treeview-left"></div>');
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.kendo.appendTreeToDom({
                name: dbTreeName || "AS_USP_ASTREE_asset_tree",
                treecontainer: "#treeview-left",
                showtreedescription: false,
                data: { AS_ASSET_ID: asset_id },
                callback: function () {
                    $("#treeview-left").data("kendoTreeView", $("#treeview-left").find(".k-treeview").data("kendoTreeView"));
                    if ($(".gmaps").length > 0)
                        $("#treeview-left").data("kendoTreeView").trigger("select", {
                            node: $("#treeview-left .k-item:first")[0]
                        });
                    var gridrights = getGridRights(gridname || "AS_ASSET_asset");
                    //tolgo i bottoni per la modifica se non puo' aggiornare
                    if (gridrights.usercanupdate == false) {
                        $("#treeview-left span.treeButton").hide();
                    }
                    else {
                        var treeview = $("#treeview-left").data("kendoTreeView");
                        $("#treeview-left").kendoDropTarget({
                            // drop: droptargetOnDrop
                        });
                        //expand all in order to have all the nodes as drop targets (TODO get all the nodes which are currently collapsed and collapse them later...)
                        $("#treeview-left .k-item:not([data-expanded])").attr("shouldcollapse", true);
                        treeview.expand(".k-item");
                        $("#treeview-left li").kendoDropTarget({
                            dragenter: dropgenerictargetOnDragEnter,
                            dragleave: dropgenerictargetOnDragLeave,
                            drop: droptargetOnDrop
                        });
                        //then recollapse the nodes configured as collapsed...
                        treeview.collapse(".k-item[shouldcollapse]");
                        $("#treeview-left .k-item").removeAttr("shouldcollapse");
                        //rebuild tabstrip 
                        refreshAssetTabstrip(asset_id,gridname);
                    }
                }
            });
        });
        return;
    }
    function droptargetOnDrop(e) {
        //detect if the drop occured over a tree node
        var nodeds = $('#treeview-left').data('kendoTreeView').dataItem(e.dropTarget);
        var theparentid = nodeds.assetid;
        window.DragAndDropFuncsCurrentParentID = nodeds.assetid;
        window.DragAndDropFuncsCurrentTypeID = $(e.draggable.element).attr('id').replace(/^sp_/, "");
        window.DragAndDropFuncsCurrentClassID = $(e.draggable.element).attr('tipassID');
        window.DragAndDropFuncsCurrentLayerid = $(e.draggable.element).attr('layerid');

        var ds = buildXMLStoredProcedureJSONDataSource({ parent_asset_id: nodeds.assetid, tipsas_id: DragAndDropFuncsCurrentTypeID }, function (e) {
            if (e.items[0].FL_CHECK)
                editHiddenGrid();
            else
                kendoConsole.log(getObjectText("incomptypes"), true);
        }, "core.AS_CHECK_TREE_TYPES");
        ds.read();

        return;

        var theparentlocationid = nodeds.assetlocationid;
        var theparenttipsasid = nodeds.assettipsasid;
        var gridname = $(e.draggable.element).attr('gridname');
        var idtip = $(e.draggable.element).attr('id');
        var templateid = $(e.draggable.element).attr('templateid');
        var layerid = $(e.draggable.element).attr('layerid');
        //e' il value del tab attivo da cui ho fatto il drag
        var droppedtipassid = $("#tabstrip").data("kendoTabStrip").dataSource.options.data[$("#tabstrip").data("kendoTabStrip").select().index()].value;
        if (templateid == null)
            templateid = 0;

        var droppedtipsasid = idtip.substring(3, idtip.length);

        var restrictions;
        $.ajax({
            type: "POST",
            async: false,
            url: manageAsyncCallsUrl(false,"/api/AssetTree/PostRestrictions"),
            data: JSON.stringify({ tipsas_id: theparenttipsasid }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) { restrictions = data; }
        });

        if (restrictions.length > 0)
            if (restrictions.indexOf(parseInt(droppedtipsasid)) !== -1) {
                kendoConsole.log("Compatible", false);
                //open asset insertion/edit form
                renderDerivativeGrid(droppedtipsasid, templateid === "null" ? "" : templateid, gridname === "null" ? "" : gridname, theparentid, null, layerid === "null" ? "" : layerid, droppedtipassid, theparentlocationid);
            }
            else kendoConsole.log("Creazione asset non possibile perche' le tipologie non sono compatibili.", true);
        if (restrictions.length === 0)
            kendoConsole.log("Creazione asset non possibile perche' le tipologie non sono compatibili.", true);

    }
}

function refreshAssetTabstrip(assetid,gridname)
{
    if ($("#tabstrip").length > 0) {
        buildTabStripDataSource(assetid)
            .then(function (ds) {
                $("#tabstrip").remove();
                $("#tipsastabstripcontainer").append('<div id="tabstrip"> <ul></ul> </div>');
                 $("#tabstrip").kendoTabStrip({
                    animation: { open: { effects: "fadeIn" } },
                    dataTextField: "text",
                    dataImageUrlField: "imageUrl",
                    dataContentField: "Content",
                    dataSource: ds
                }).data("kendoTabStrip").select(0);

                 var gridrights = getGridRights(gridname || "AS_ASSET_asset");
                //il drag and drop viene attivato solo se l'  utente puo' aggiornare
                if (gridrights.usercanupdate == true)
                    makegenericspandraggable(".tipsas");
            });
    }
}

//function refreshAssetTabstrip(assetid)
//{
//    var gridrights = getGridRights("AS_ASSET_asset");
//    var ds = buildXMLStoredProcedureJSONDataSource({ AS_ASSET_ID: assetid }, function (e) {
//        // $("#assclassi_tabstrip").remove();
//        $("#tabstrip").remove();
//        //  $("#assclassi").append("<div id='assclassi_tabstrip'/>");
//        $("#tipsastabstripcontainer").append('<div id="tabstrip"> <ul></ul> </div>');
//        var ds = buildTabStripDataSource(e.items,assetid);
//        if (ds && ds.length > 0)
//            $("#assclassi_tabstrip").kendoTabStrip({
//                animation: { open: { effects: "fadeIn" } },
//                dataTextField: "text",
//                dataImageUrlField: "imageUrl",
//                dataContentField: "Content",
//                dataSource: ds
//            }).data("kendoTabStrip").select(0);
//        if (gridrights.usercanupdate) {
//            makegenericspandraggable(".tipsas");
//        }
//    }, "core.usp_AS_get_tipsas");
//    ds.read();
//}

//#endregionf
//#region failuremanagement(obsolete)
function getCheckedComponents()
{
    var assele = [];
    $("#treeview-left [type=checkbox]").each(function (i, v) {
        if ($(v).is(':checked')) {
            var parentliUID = $(v).parents("li").attr("data-uid");
            var tree = $("#treeview-left [data-role=treeview]").data("kendoTreeView");
            var jqdata = tree.findByUid(parentliUID);
            var data = tree.dataItem(jqdata);
            assele.push(data.assetid); //si chiama assetid genericamente l'objectID di un tree (in questo caso sono partito dalla assele) 
        }
    });
    sessionStorage.setItem("assele", assele.join());
    return assele;

}

function treeElementTemplate(item)
{
        return componentTemplate(item);
}
//richiamata nel template maintenance-tree-template definito su DB per costruire il template dei vari nodi. 
function componentTemplate(item)
{   //assetid corrisponde al TMP_OBJ_ID della stored di creazione del tree
    var template = item.assettoexplode;
    var checked = "";
    var arr = sessionStorage.getItem("assele"); //aggiornato ogni volta che un checkbox del tree viene modificato
    if (arr)
        arr = arr.split(',');

    if (arr != null && arr.indexOf(item.assetid.toString()) != -1)
        checked = "checked='checked'";
    switch (item.type)
    {
        case 'SPEELE':
            template += "<input type='checkbox' style='margin-left:5px;' onclick='showFaultAndIntervetionClass(this);' " + checked + '><span class="treeButton"><a onclick="editComponent(' + item.assetid + ');" class="k-button"><span class="k-icon k-edit"></span></a></span>';
            break;
        case 'STMANR':
            template += "<i class='icon-wrench' style='margin-left:5px;'></i>";
            break;
        case 'INTPRR':
            template += "<i class='icon-calendar' style='margin-left:5px;'></i>";
            break;
        case 'INTPRG':
            template += '<span style="margin-right:5px;" class="treeButton"><a onclick="editIntervetion(' + item.assetid + ');" class="k-button"><span class="k-icon k-edit"></span></a></span>';
            break;
    }
    return template;
}

function showFaultAndIntervetionClass(e)
{
    var assele = getCheckedComponents();
   //classi e tipi di guasto
    var ds = buildXMLStoredProcedureJSONDataSource({ asselelist: assele.join()}, function (e) {
        $("#stato_tabstrip").remove();
        $("#statomanutentivo").append("<div id='stato_tabstrip'/>");
        var ds = buildFaultClassesDataSource(e.items);
        if (ds && ds.length>0)
            $("#stato_tabstrip").kendoTabStrip({
                    animation: { open: { effects: "fadeIn" } },
                    dataTextField: "text",
                    dataImageUrlField: "imageUrl",
                    dataContentField: "Content",
                    dataSource: ds
                }).data("kendoTabStrip").select(0);
    }, "core.get_fc_fault_classes_types");
    ds.read();

    //classi e tipi di intervento
    var ds = buildXMLStoredProcedureJSONDataSource({ asselelist: assele.join() }, function (e) {
        $("#interventi_tabstrip").remove();
        $("#interventiprg").append("<div id='interventi_tabstrip'/>");
        var ds = buildIntervetionClassesDataSource(e.items);
        if (ds && ds.length > 0)
            $("#interventi_tabstrip").kendoTabStrip({
                animation: { open: { effects: "fadeIn" } },
                dataTextField: "text",
                dataImageUrlField: "imageUrl",
                dataContentField: "Content",
                dataSource: ds
            }).data("kendoTabStrip").select(0);
    }, "core.get_fp_intervetion_classes_types");
    ds.read();

   


    
}
function buildComponentClassesDataSource(items,assetid) {
    var ds = [];
    var hashofIC = {};
    for (var i = 0; i < items.length; i++) {
        var content = '<span assetid='+assetid+' onclick="addComponent(this);" id="sp_cc_' + items[i].FC_TIPELE_ID + '" class="tipsas">' + items[i].FC_TIPELE_DESCRIPTION + '</span>';
        if (hashofIC[items[i].FC_CLAELE_ID] == null) {
            var obj = {};
            obj.text = items[i].FC_CLAELE_DESCRIPTION;
            obj.imageUrl = "";
            obj.value = items[i].FC_CLAELE_ID;
            obj.Content = content;
            hashofIC[items[i].FC_CLAELE_ID] = obj;
        }
        else if (hashofIC[items[i].FC_CLAELE_ID].Content.indexOf('id="sp_cc_' + items[i].FC_CLAELE_ID.toString()) == -1)
            hashofIC[items[i].FC_CLAELE_ID].Content += content;

    }
    Object.keys(hashofIC).forEach(function (key) {
        var value = hashofIC[key];
        ds.push(value);
    });

    return ds;
}


function buildIntervetionClassesDataSource(items) {
    var ds = [];
    var hashofIC = {};
   for (var i = 0; i < items.length; i++) {
       var content = '<span recurrent=' + items[i].FP_TIPWOK_RECURRENCY + ' onclick="addIntervetion(this);" id="sp_fc_' + items[i].FP_TIPWOK_ID + '" class="tipsas">' + items[i].FP_TIPWOK_DESCRIPTION + '</span>';
       if (hashofIC[items[i].FP_CLAWOK_ID] == null) {
            var obj = {};
            obj.text = items[i].FP_CLAWOK_DESCRIPTION;
            obj.imageUrl = "";
            obj.value = items[i].FP_CLAWOK_ID;
            obj.Content = content;
            hashofIC[items[i].FP_CLAWOK_ID] = obj;
        }
        else if (hashofIC[items[i].FP_CLAWOK_ID].Content.indexOf('id="sp_fc_' + items[i].FP_TIPWOK_ID.toString()) == -1)
            hashofIC[items[i].FP_CLAWOK_ID].Content += content;

    }
    Object.keys(hashofIC).forEach(function (key) {
        var value = hashofIC[key];
        ds.push(value);
    });

    return ds;
}

function buildFaultClassesDataSource(items)
{
    var ds = [];
    var hashofFC = {};
    for (var i = 0; i < items.length; i++) {
        var content = '<span  onclick="addFault(this);" style="background-color:'+items[i].FP_TFAULT_COLOUR+';" id="sp_fc_' + items[i].FP_TFAULT_ID + '" class="tipsas">' + items[i].FP_TFAULT_DESCRIPTION + '</span>';
        if (hashofFC[items[i].FP_CFAULT_ID] == null) {
            var obj = {};
            obj.text = items[i].FP_CFAULT_DESCRIPTION;
            obj.imageUrl = "";
            obj.value = items[i].FP_CFAULT_ID;
            obj.Content = content;
            hashofFC[items[i].FP_CFAULT_ID] = obj;
        }
        else if (hashofFC[items[i].FP_CFAULT_ID].Content.indexOf('id="sp_fc_' + items[i].FP_TFAULT_ID.toString()) == -1)
            hashofFC[items[i].FP_CFAULT_ID].Content += content;
    }
    Object.keys(hashofFC).forEach(function (key) {
        var value = hashofFC[key];
        ds.push(value);
    });

    return ds;    
}
//#region datemanagement
function takeoffUTC(date)
{
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

function defaultDate(datestring) {
    if (datestring == "" || datestring == null)
        return new Date()
    else
        return new Date(datestring);
}
//#endregion

function editIntervetion(intervetionid) {
    
    $.ajax({
        type: "POST",
        url: "/api/MF_API/GetAsInterv",
        data: JSON.stringify({ FP_INTELE_ID: "" + intervetionid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            var values = result.Data[0].Table[0];
            var schema = {
                type: "object",
                title: getObjectText("intervetiondata"),
                properties: {
                    intstartdate: {
                        type: "string",
                        title: getObjectText("intstartdateselection"),
                        description: getObjectText("intstartdateselectionhelp")

                    },
                    intenddate: {
                        type: "string",
                        title: getObjectText("intenddateselection"),
                        description: getObjectText("intenddateselectionhelp")

                    },
                    intstartconsdate: {
                        type: "string",
                        title: getObjectText("intstartconsdateselection"),
                        description: getObjectText("intstartconsdateselectionhelp")

                    },
                    intendconsdate: {
                        type: "string",
                        title: getObjectText("intendconsdateselection"),
                        description: getObjectText("intendconsdateselectionhelp")

                    },
                    intcost: {
                        type: "string",
                        title: getObjectText("intcost"),
                        description: getObjectText("intcosthelp")
                    },
                    intcostcons: {
                        type: "string",
                        title: getObjectText("intcostcons"),
                        description: getObjectText("intcostconshelp")
                    }
                }
            }


            var transfn = function () {
                $("input[name=root\\[intstartdate\\]]").kendoDateTimePicker({  value: defaultDate(values["FP_INTERV_DATE_START_PREV"]) });
                $("input[name=root\\[intenddate\\]]").kendoDateTimePicker({ value: defaultDate(values["FP_INTERV_DATE_END_PREV"]) });
                $("input[name=root\\[intstartconsdate\\]]").kendoDateTimePicker({ value: defaultDate(values["FP_INTERV_DATE_START"]) });
                $("input[name=root\\[intendconsdate\\]]").kendoDateTimePicker({ value: defaultDate(values["FP_INTERV_DATE_END"]) });
                $("input[name=root\\[intcost\\]]").kendoNumericTextBox({ value: values["FP_INTERV_COST_PREV"], format: "c3" });
                $("input[name=root\\[intcostcons\\]]").kendoNumericTextBox({ min: 0 , value: values["FP_INTERV_COST_CONS"], format: "c3" });

            }

            var savefn = function () {

                var startdate = $("input[name=root\\[intstartdate\\]]").data("kendoDateTimePicker").value();
                startdate = startdate ? takeoffUTC(startdate) : startdate
                var enddate = $("input[name=root\\[intenddate\\]]").data("kendoDateTimePicker").value();
                enddate = enddate ? takeoffUTC(enddate) : enddate

                var consstartdate = $("input[name=root\\[intstartconsdate\\]]").data("kendoDateTimePicker").value();
                consstartdate = consstartdate ? takeoffUTC(consstartdate) : consstartdate
                var consenddate = $("input[name=root\\[intendconsdate\\]]").data("kendoDateTimePicker").value();
                consenddate = consenddate ? takeoffUTC(consenddate) : consenddate

                var cost = $("input[name=root\\[intcost\\]]").data("kendoNumericTextBox").value();
                var costcons = $("input[name=root\\[intcostcons\\]]").data("kendoNumericTextBox").value();

                var postcontent = buildGenericPostInsertUpdateParameter("update", "core.FP_INTELE_intervetion_elements", "FP_INTELE_ID", "core.usp_fp_add_intervetion", "XML", -1, -1, { FP_INTELE_ID: intervetionid, FP_INTERV_DATE_START_PREV: startdate, FP_INTERV_DATE_END_PREV: enddate, FP_INTERV_DATE_START_CONS: consstartdate, FP_INTERV_DATE_END_CONS: consenddate, FP_INTERV_COST_CONS: costcons, FP_INTERV_COST_PREV: cost }, intervetionid);
                $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/PostU/" + intervetionid,
                    data: postcontent,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        kendoConsole.log(getObjectText("intervetionupdated"), false);
                        refreshtree();
                        $("#wndmodalContainer").modal('toggle');
                    },
                    error: function (message) {
                        kendoConsole.log(message.responseText, true);
                    }
                });
            }


            customizeModal({ title: getObjectText("intervetionupdate"), model: schema, transformation_fn: transfn, save_fn: savefn });
            $("#wndmodalContainer").modal('toggle');
        }
    });

   
}

function addIntervetion(e)
{
    var typeintervetion = $(e).attr("id").substring(6);
    var isrecurrent = JSON.parse($(e).attr("recurrent"));
    var assele = getCheckedComponents();

    var schema = {
        type: "object",
        title: getObjectText("intervetiondata"),
        properties: {
            intstartdate: {
                type: "string",
                title: getObjectText("intstartdateselection"),
                description: getObjectText("intstartdateselectionhelp")

            },
            intcost: {
                type: "string",
                title: getObjectText("intcost"),
                description: getObjectText("intcosthelp")
            },
        }
    }

    if (isrecurrent)
        schema.properties["intenddate"] = {
            type: "string",
            title: getObjectText("intenddateselection"),
            description: getObjectText("intenddateselectionhelp")
        }

    var transfn = function () {
        $("input[name=root\\[intstartdate\\]]").kendoDateTimePicker({ min: new Date() , value:new Date()});
        $("input[name=root\\[intcost\\]]").kendoNumericTextBox({ value: 0, format: "c3" });
        if (isrecurrent)
            $("input[name=root\\[intenddate\\]]").kendoDateTimePicker({ min: new Date() });

    }

    var savefn = function () {

        var startdate = $("input[name=root\\[intstartdate\\]]").data("kendoDateTimePicker").value();
        startdate = startdate ? takeoffUTC(startdate) : startdate
        var enddate = null;
        if (isrecurrent)
        {
            enddate = $("input[name=root\\[intenddate\\]]").data("kendoDateTimePicker").value();
            enddate = enddate ? takeoffUTC(enddate) : enddate
        }

        var cost = $("input[name=root\\[intcost\\]]").data("kendoNumericTextBox").value();

        var postcontent = buildGenericPostInsertUpdateParameter("update", "core.FP_INTERV_intervetion", "FP_INTERV_ID", "core.usp_fp_add_intervetion", "XML", -1, -1, { FP_INTERV_FP_TIPWOK_ID: typeintervetion, FP_INTERV_DATE_START_PREV: startdate, FP_INTERV_DATE_END_PREV: enddate, FP_INTERV_COST_PREV: cost, assele: assele.join() }, -1);
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/PostU/" + typeintervetion,
            data: postcontent,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log(getObjectText("intervetionadded"), false);
                refreshtree();
                $("#wndmodalContainer").modal('toggle');
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    }


    customizeModal({ title: getObjectText("intervetionaddition"), model: schema, transformation_fn: transfn, save_fn: savefn });
    $("#wndmodalContainer").modal('toggle');
}

function addComponent(e)
{
    var typeComponent = $(e).attr("id").substring(6);
    var assetid =   $(e).attr("assetid");
    var schema = {
        type: "object",
        title: getObjectText("componentdata"),
        properties: {
            component: {
                type: "string",
                title: getObjectText("componentselection"),
                description: getObjectText("componentselectionhelp")

            },
            compsize: {
                type: "string",
                title: getObjectText("compsize"),
                description: getObjectText("compsizehelp")

            }

        }
    }

    var transfn = function () {
        $.ajax({
            type: "POST",
            url: "/api/AS_V_ASSET_assetgroups/GetFcSpeele_asset_elements",
            data: JSON.stringify({ FC_SPEELE_FC_TIPELE_ID:"" + typeComponent }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                var values = result.Data[0].Table;
                $("input[name=root\\[component\\]]").kendoDropDownList({ dataSource: values, dataValueField: "FC_SPEELE_ID", dataTextField: "FC_SPEELE_DESCRIPTION" });
                $("input[name=root\\[compsize\\]]").kendoNumericTextBox({ min: 0, value: 0, format: "n3" });
            }
        });
        }

    var savefn = function () {

        var speeleid = $("input[name=root\\[component\\]]").data("kendoDropDownList").value();
        var size = $("input[name=root\\[compsize\\]]").data("kendoNumericTextBox").value();

        var postcontent = buildGenericPostInsertUpdateParameter("create", "core.FC_ASSELE_asset_elements", "FC_ASSELE_ID", "core.usp_fp_add_component", "XML", -1, -1, { assetid: assetid, speeleid: speeleid ,size:size }, -1);
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/PostI/",
            data: postcontent,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log(getObjectText("componentadded"), false);
                refreshtree();
                $("#wndmodalContainer").modal('toggle');
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    }


    customizeModal({ title: getObjectText("componentaddition"), model: schema, transformation_fn: transfn, save_fn: savefn });
    $("#wndmodalContainer").modal('toggle');
}

function editComponent(asseleid)
{
    $.ajax({    //#mfapireplaced
        type: "POST",
        url: "/api/AS_V_ASSET_assetgroups/GetFcAssele_asset_elements", 
        data: JSON.stringify({ FC_ASSELE_ID: ""+asseleid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            var val = result.Data[0].Table[0].FC_ASSELE_SIZE ? result.Data[0].Table[0].FC_ASSELE_SIZE : 0;
            var schema = {
                type: "object",
                title: getObjectText("compsizemanagement"),
                properties: {
                    compsize: {
                        type: "string",
                        title: getObjectText("compsize"),
                        description: getObjectText("compsizehelp")

                    }
                }
            }

            var transfn = function () {
                $("input[name=root\\[compsize\\]]").kendoNumericTextBox({ min:0,value: val , format:"n3" });

            }

            var savefn = function () {
                var size = $("input[name=root\\[compsize\\]]").data("kendoNumericTextBox").value();
                var postcontent = buildGenericPostInsertUpdateParameter("update", "core.FC_ASSELE_asset_elements", "FP_FAUELE_ID", "core.usp_fp_add_component", "XML", -1, -1, { size: size, assele: asseleid }, -1);
                $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/PostU/" + asseleid,
                    data: postcontent,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        kendoConsole.log(getObjectText("componentsizeupdated"), false);
                        //$("#grid").data("kendoGrid").dataSource.read();
                        refreshtree();
                        $("#wndmodalContainer").modal('toggle');
                    },
                    error: function (message) {
                        kendoConsole.log(message.responseText, true);
                    }
                });
            }


            customizeModal({ title: getObjectText("componentsize"), model: schema, transformation_fn: transfn, save_fn: savefn });
            $("#wndmodalContainer").modal('toggle');
        }
    });
    
}

function addFault(e)
    {
        var typefault = $(e).attr("id").substring(6);
        var assele = getCheckedComponents();
   
        var schema = {
            type: "object",
            title: getObjectText("faultdata"),
            properties: {
                faultdate: {
                    type: "string",
                    title: getObjectText("faultdateselection"),
                    description: getObjectText("faultdateselectionhelp")

                }
            }
        }

        var transfn = function () {
            $("input[name=root\\[faultdate\\]]").kendoDateTimePicker({ min: new Date(), value: new Date() });

        }

        var savefn = function () {

            var faultdate = $("input[name=root\\[faultdate\\]]").data("kendoDateTimePicker").value();
            faultdate = faultdate ? takeoffUTC(faultdate) : faultdate;
            var postcontent = buildGenericPostInsertUpdateParameter("update", "core.FP_FAUELE_fault_elements", "FP_FAUELE_ID", "core.usp_fp_add_fault", "XML", -1, -1, { tfault: typefault, faultDate: faultdate , assele:assele.join() }, -1);
            $.ajax({
                type: "POST",
                url: "/api/GENERICSQLCOMMAND/PostU/" + typefault,
                data: postcontent,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    kendoConsole.log(getObjectText("faultadded"), false);
                    //$("#grid").data("kendoGrid").dataSource.read();
                    refreshtree();
                    $("#wndmodalContainer").modal('toggle');
                },
                error: function (message) {
                    kendoConsole.log(message.responseText, true);
                }
            });
        }


        customizeModal({ title: getObjectText("faultaddition"), model: schema, transformation_fn: transfn, save_fn: savefn });
        $("#wndmodalContainer").modal('toggle');
    }
//#endregion
//#region cadlight(obsolete)
function estraiTemati(e)
{
    var info = getRowDataFromButton(e);
    window.open("http://caddem.idearespa.com/r2sreftree/CadLight.aspx?edid={0}&cid=99&uid=2&dbh=99".format(info.AS_ASSET_ID));
}
//#endregion

function editHiddenGridOverride_as(e,origedit__) {
    if (window.DragAndDropFuncsAction == "update")
        setWindowAsModels(e.model);
    var tip = (window.DragAndDropFuncsCurrentTypeID ? window.DragAndDropFuncsCurrentTypeID : null);
    var cla = (window.DragAndDropFuncsCurrentClassID ? window.DragAndDropFuncsCurrentClassID : null);
    var par = (window.DragAndDropFuncsCurrentParentID ? window.DragAndDropFuncsCurrentParentID : null);
    e.container.find("input[name=AS_ASSET_TIPASS_ID],input[name=AS_ASSET_TIPSAS_ID]").removeAttr("required");
    e.model.AS_ASSET_ID_PADRE = parseInt(par == null ? 0 : par);
    e.model.AS_ASSET_TIPASS_ID = parseInt(cla == null ? 0 : cla);
    e.model.AS_ASSET_TIPSAS_ID = parseInt(tip == null ? 0 : tip);
    e.container.find("input[name=AS_ASSET_TIPASS_ID]").data("kendoDropDownList").bind("dataBound", function (dd) {
        e.model.AS_ASSET_TIPASS_ID = parseInt(cla == null ? 0 : cla);
        dd.sender.value(parseInt(cla));
        dd.sender.enable(false);
    });
    e.container.find("input[name=AS_ASSET_TIPSAS_ID]").data("kendoDropDownList").bind("dataBound", function (dd) {
        e.model.AS_ASSET_TIPSAS_ID = parseInt(tip == null ? 0 : tip);
        dd.sender.value(parseInt(tip));
        dd.sender.enable(false);
    });
    //manageStageConstraints.call(this,e, treefuncpars.gridname, treefuncpars.entityname).then(function (items) {
    //    $(items).each(function (i, v) {
    //        if (v.EV_DEFAULT_VALUE)
    //            e[v.ColumnName]=v.EV_DEFAULT_VALUE;
    //    });
    //    getStandardEditFunction(e, null, "derivativeassetgrid");//, window.DragAndDropFuncsCurrentLayerid == "null" ? null : window.DragAndDropFuncsCurrentLayerid);
    //});
    if (origedit__)
        origedit__.call(this, e);
    return true;
}

function setWindowAsModels(model) {
    window.DragAndDropFuncsCurrentTypeID = model["AS_ASSET_TIPSAS_ID"];
    window.DragAndDropFuncsCurrentClassID = model["AS_ASSET_TIPASS_ID"];
    window.DragAndDropFuncsCurrentParentID = model["AS_ASSET_ID_PADRE"];
}

var lastClickedTreeEvent = {};
function handleCheckAssetTreeMouseup(event) {
    var $target = $(event.target).closest("li");
    var $el = $target.find("i").eq(0);
    $el.toggleClass("fa-square-o");
    if ($target[0] === lastClickedTreeEvent.target && (event.timeStamp - lastClickedTreeEvent.timeStamp) > 200) {
        var $lis = $target.find("li i");
        if ($el.hasClass("fa-square-o"))
            $lis.addClass("fa-square-o");
        else
            $lis.removeClass("fa-square-o");
    }
}

function handleCheckAssetTreeMousedown(event) {
    var $target = $(event.target).closest("li");
    lastClickedTreeEvent = { target: $target[0], timeStamp: event.timeStamp };
}

function getfunctionsforRecordAsset(e, entityName, dbcalls) {
    if (dbcalls)
        dbcalls = dbcalls.split(',');
    else
        dbcalls = ["stageactions"];
    var functionGUID = getCurrentFunctionGUIDFromMenu();
    
    window.jqueryEditRefTreeGrid = { jqgrid: $(".derivativeassetgrid"), jrow: $(".derivativeassetgrid tr.k-master-row") };
    window.jqueryEditRefTreeGrid.rowData = window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataItem(window.jqueryEditRefTreeGrid.jrow);

    var rowdata = window.jqueryEditRefTreeGrid.rowData;
    var pk = $(".derivativeassetgrid").data("kendoGrid").dataSource.options.schema.model.id;
    var gridname = $(".derivativeassetgrid").attr("gridname")
    var entityName = "core.AS_V_ASSET_assetExtended"

    requireConfigAndMore(["MagicActions"], function (magic) {
        //id 3o livello , class: 1o liv , Type : 2oliv 
        $.each(dbcalls, function (i, v) {
            var position = v == "stageactions" ? "left" : "right"
            var accordionid = position == "right" ? ("refactionsaccordion_" + position) : "refactionsaccordion";
            $.ajax({
                type: "POST",
                url: "/api/EVENTS/GetRecordActions/",
                data: JSON.stringify({ entityname: entityName, id: rowdata.id, pk: pk, queryType: v, functionGUID: functionGUID, gridName: gridname }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    var boid = rowdata.id;
                    if (result.length > 0) {
                        //var mock = [{ id: 10, Typeid: 1, Type: "Registrazione firma contratto", Classid: 1, Class: "Modifiche Asset", Catid: 12, actionid: 1, actionDescription: "Link1", actiontype: "Open Stored Procedure", actiontypeid: 1, actioncommand: '{"SP":"dbo.prova"}' },
                        //               { id: 10, Typeid: 1, Type: "Validazione contratto", Classid: 1, Class: "Modifiche Asset", Catid: 12, actionid: 1, actionDescription: "Link1", actiontype: "Open Stored Procedure", actiontypeid: 1, actioncommand: '{"SP":"dbo.prova"}' },
                        //           ];
                        var actions = [];
                        $(result).each(function (i, v) {
                            var act = {};
                            act.id = v.ActionId;
                            act.Typeid = v.TypeId;
                            act.Type = v.Type;
                            act.Classid = v.ClassId;
                            act.Class = v.Class;
                            act.actionDescription = v.ActionDescription;
                            act.actiontype = v.ActionType;
                            act.actioncommand = v.ActionCommand;
                            act.actionfilter = v.ActionFilter;
                            act.actioniconclass = v.ActionIconClass;
                            act.actionbackgroundcolor = v.ActionBackgroundColor;
                            act.typeiconclass = v.TypeIconClass;
                            actions.push(act);
                        });


                        $("#" + accordionid).remove();
                        //e e' l' action span 
                        $(e).kendoTooltip({
                            position: position,
                            showOn: "click",
                            autoHide: false,
                            hide: function () {
                                $(this.popup.element[0]).closest('.k-animation-container').remove();
                            },
                            content: function () {
                                return build3LevelBootstrapAccordionAsset({ recordid: boid, currentTarget: e, actions: actions }, accordionid, actionLinkReferenceBuilder);
                            },
                            width: "250px"
                        }).trigger("tooltipCreated");
                        $(e).data("kendoTooltip").show();
                        setActionSettings(actions, "actionsettings", accordionid);
                        setActionSettings(null, "subsettings");
                    }
                    else {
                        $(e).kendoTooltip({
                            position: position,
                            showOn: "click",
                            autoHide: false,
                            hide: function () {
                                $(this.popup.element[0]).closest('.k-animation-container').remove();
                            },
                            content: function () {
                                return getObjectText("noactionfound");
                            },
                            width: "250px"
                        }).trigger("tooltipCreated");

                        $(e).data("kendoTooltip").show();
                    }
                    if (position == "right")
                        $("#" + accordionid).parents(".k-tooltip").css("background-color", "rgb(156, 161, 189)");
                },
                error: function (result) {
                    kendoConsole.log("Errore nel reperimento delle funzioni per record", true);
                }
            });
        });
    });
    return;
}

function build3LevelBootstrapAccordionAsset(data, accordionid, referencebuilder) {
    //ActionDescription - id: 3o livello , class-classid: 1o liv , Type - typeid : 2oliv 
    var classhash = {};

    $(data.actions).each(function (i, v) {
        var actobj = { id: v.id, actionfilter: v.actionfilter, actiondescription: v.actionDescription || v.actiondescription, actiontype: v.actiontype, boid: data.recordid, actioncommand: v.actioncommand, taskId: v.taskId, actioniconclass: v.actioniconclass, generateBO: v.GenerateBO, botype: v.botype, count: v.count, actionbackgroundcolor: v.actionbackgroundcolor, bodescription: data.description };
        //adapt to other formats of SP returns...
        if (!v.Class)
            v.Class = v.ActionClassDescription;
        if (!v.Type)
            v.Type = v.TypeDescription;
        if (!v.typeiconclass)
            v.typeiconclass = v.type_icon_class;

        if (classhash[v.Class] == undefined) {
            var typehash = {};
            typehash[v.Type] = { icon: v.typeiconclass, actions: [actobj] };
            classhash[v.Class] = typehash;

        }
        else
            if (classhash[v.Class][v.Type] == undefined) {
                var typehash = {};
                typehash[v.Type] = { icon: v.typeiconclass, actions: [actobj] };
                classhash[v.Class][v.Type] = typehash[v.Type];
            }
            else {
                classhash[v.Class][v.Type].actions.push(actobj);
            }
    });

    var content = "";
    var m = 0;


    var firstlevopen ='<div class="btn-group-vertical" role="group" aria-label="Vertical button group">'


    var firstlevopen = ' <div class="panel panel-info">\
                                <div class="panel-heading" style="display:none;">\
                                <h4 class="panel-title">\
                                  <a data-toggle="collapse" data-parent="#' + accordionid + '" href="#' + accordionid + '-collapse-{1}"><span class="glyphicon glyphicon-folder-close">\
                                    </span>{0}</a>\
                                </h4>\
                                </div>\
                                <div id="' + accordionid + '-collapse-{1}" class="panel-collapse collapse in">\
                                <ul style="white-space:nowrap;text-overflow:ellipsis;" class="list-group actionaccordion" >';

        

    //   var firstlevclosure = '</ul></div></div>';
    //var secondlevopen = '<li class="list-group-item"><a class="btn btn-info {4}" style="width:90%;background-color:#13688c;" data-toggle="collapse" href="#inner-collapse-m-{1}"><span class="{2}"></span>{0}</a> <ul id="inner-collapse-m-{1}" class="list-group  {3}">'
    //   var secondlevclosure = '</ul></li>';
    //var thirdlev = '<li {5} class="list-group-item"><a style="width:90%;white-space:pre-wrap;" class="btn btn-success" id="{4}" href="{1}" {3}><span class="{2}"></span> {0}</a></li>'

    //https://gitlab.ilosgroup.com/ilos/operations/-/issues/316
    var firstlevclosure = '</ul></div></div>';
    var secondlevopen = '<li class="list-group-item" style="background-color: #a3d0e4;padding-top:10px;padding-bottom:0px;margin-bottom:3px;"><a class="{4}" style="font-weight:bold;width:90%;" data-toggle="collapse" href="#inner-collapse-m-{1}"><span class="{2}"></span>{0}</a> <ul style="white-space:nowrap;text-overflow:ellipsis;" id="inner-collapse-m-{1}" class="list-group  {3}">'
    var secondlevclosure = '</ul></li>';
    var thirdlev = '<li {5} class="list-group-item"><a style="font-style:italic;"  id="{4}" href="{1}" {3}><span class="{2}"></span> {0}</a></li>'

    for (var key in classhash) {
        if (classhash.hasOwnProperty(key)) {
            content += firstlevopen.format(key, m);
            m++;
            let i_ = 0;
            for (var innerkey in classhash[key]) {
                content += secondlevopen.format(innerkey, m, classhash[key][innerkey].icon ? classhash[key][innerkey].icon : "fa fa-bars", i_ ? 'collapse' : 'in', i_ ? 'collapsed' : 'in');
                m++;
                i_++;
                $.each(classhash[key][innerkey].actions, function (j, k) {
                    var actionexecutor = "javascript:void(0);"
                    if (referencebuilder)
                        actionexecutor = referencebuilder(k, data.currentTarget);
                    var ref = "javascript:void(0);";
                    var click = "";
                    if (typeof actionexecutor == 'string') //caso di javascript:function  su href con parametri espliciti
                        ref = actionexecutor;
                    else
                        click = 'onclick="' + actionexecutor.click + '"';  //caso di click event con parametri su $.data() dell' a
                    var iclass = "glyphicon glyphicon-pencil";
                    if (k.actioniconclass)
                        iclass = k.actioniconclass;
                    if (k.count !== undefined) {
                        k.actiondescription += " (" + k.count + ")";
                        if (k.count < 1)
                            ref = "javascript:void(0);";
                    }
                    var bckcolor = "";
                    if (k.actionbackgroundcolor)
                        bckcolor = "style=\"background-color:" + k.actionbackgroundcolor + ";\"";
                    content += thirdlev.format(k.actiondescription, ref, iclass, click, k.id, bckcolor);
                });
                content += secondlevclosure;
            }
            content += firstlevclosure;
        }
    }
   
    content = '<div class="panel-group magicaccordion" style="margin-bottom: 4px;margin-top: 20px;width: fit-content;min-width:100%" id="' + accordionid + '">' + content + '</div>';
     
    return content;

}