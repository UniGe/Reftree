function closeActionsToolTip(e) {
    $(e).closest('[role=tooltip]').find('a.k-icon.k-i-close').trigger('click');
}

function actionLinkReferenceBuilder(data, currentTarget) {
    //Actions
    switch (data.actiontype) {
        case "RTFUN":
            return { click: "launchActionFunction(this);" };
            break;
        case "NEWGD":
        case "EDTGD":
            return { click: "editActionGrid(this);closeActionsToolTip(this);" };
            break;
        case "JSFUU":
            return { click: "launchActionJsFunction(this);" };
            break;
        case "SQLPU":
            return { click: "launchStoredProcedure(this);closeActionsToolTip(this);" };
            break;
        case "OPURL":
            return { click: "openURLInNewWindow(this);" };
            break;
        case "SHOGD":
            return { click: "showGrid(this);closeActionsToolTip(this);" };
            break;
        case "LINKSEL":
            return { click: "showGridAndLinkButton(this);closeActionsToolTip(this);" };
            break;
            //#region REFTREE ONLY
        case "R3BDOC":
            return { click: "launchReftreeBuildDocumentFromModel(this);" };
            break;
        case "R3ASTG":
            return { click: "launchReftreeAssetGallery(this);closeActionsToolTip(this);" };
            break;
        case "CUSTFORM": //an html page initialized with an angular 1 controller. Default is FormOptionsController
            return { click: "launchCustomForm(this);closeActionsToolTip(this);" };
            break;
            //#endregion
            //History
         case "EVTGD":
            return { click: "showEventGrid('" + data.actioncommand + "'," + data.boid + ")" };
            break;
         case "EVTCHATMESSAGES":
            return "javascript:showReader('" + data.actioncommand + "'," + data.boid + ",'chat')";
            break;
         case "EVTMAILS":
            return "javascript:showReader('" + data.actioncommand + "'," + data.boid + ",'mail')";
            break;
    }
    //readlist component that takes array of objects where to define which field is title and which is description or pass template to define how to display the content and how to display the list
}

//#region actions funcs
//All the functions can be called outside the std accordion by passing "ext_settings" directly { "actiontype":...,"actioncommand":...,"actionfilter":...,"jqgrid":...,"jrow":...,"rowData":.... ,"subsettings":...}
function launchActionFunction(target, ext_settings) {
    var settings = ext_settings ? manage_Ext_settings(ext_settings) : getActionSettings($(target).attr("id"), $(target).parents("[role=tooltip]"));
    var functionid = settings.actioncommand;
    var functionfilter = settings.actionfilter;
    if (functionfilter) {
        //The parameter is passed as a query string es. AS_ASSET_ID=3
        if (functionfilter.substring(0, 1) != '?')
            functionfilter = '?' + functionfilter;
        redirectToFunction(functionid, functionfilter);
    }
    else
        getfuncdata(functionid);
    return;
}
function launchStoredProcedure(target, ext_settings) {
    var settings = ext_settings ? manage_Ext_settings(ext_settings) : getActionSettings($(target).attr("id"), $(target).parents("[role=tooltip]"));
    var storedprocedure = settings.actioncommand; //stored name
    var payload = {};
    var rowdata = {};
    try {
        if (settings.actionfilter)  //expects a JSON object
            $.extend(payload, JSON.parse(settings.actionfilter));
    }
    catch (e) {
        console.log(e.message);
    }
    $.extend(rowdata,window.jqueryEditRefTreeGrid.rowData,payload)
    var storedproceduredataformat = "XML";
    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, null, null, rowdata, null);
    rebuildGenericModal();
    $("#executesave").click(function () {
        //double click prevention
        if ($("#executesave").attr("clicked"))
            return;
        $("#executesave").attr("clicked", true);
        var data = datatopost;
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
            data: data,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                var msg = "OK";
                var msgtype = false;
                if (result.message !== undefined) {
                    msg = result.message;
                    if (result.msgtype == "WARN")
                        msgtype = "info";
                }
                kendoConsole.log(msg, msgtype);
                jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataSource.read();
                //timeout prevents double click ...
                setTimeout(function () { $("#executesave").removeAttr("clicked"); }, 1500);
                $("#wndmodalContainer").modal('hide');
                if (typeof callAfterLaunchStoredProcedure == "function")
                    callAfterLaunchStoredProcedure(rowdata);
            },
            error: function (message) {
                $("#wndmodalContainer").modal('hide');
                //timeout prevents double click ...
                setTimeout(function () { $("#executesave").removeAttr("clicked"); }, 1500);
                kendoConsole.log(message.responseText, true);
            }
        });
    });
    $("#wndmodalContainer").modal('toggle');

}
function refreshTotalsGrid()
{
    if ($("#gridtotals").data("kendoGrid")) {
        var tabstrip = $("div#tabstrip");
        if (tabstrip.length > 0 && $("#gridtotals").data("gridOptions").isPaging == true) //rigenera la struttura della griglia dei totali e ne ricarica i dati
        {
            var tsel = tabstrip.data("kendoTabStrip").select();
            reBuildGrid($("#gridtotals").data("gridOptions"), tsel.data('class-id'), tsel.css("background-color"));
        }
    }
}
//Crea un hidden grid, applica un filtro sulla base del row model della griglia di partenza e mette in edit il grid (nuovo o modifica) 
function editActionGrid(target,ext_settings) {
    var allsettings = ext_settings ? { settings: manage_Ext_settings(ext_settings), subsettings: ext_settings.subsettings } : getSettingsFromTarget(target);
    var settings = allsettings.settings;
    var subsettings = allsettings.subsettings;
    var gridcode = settings.actioncommand; //gridname
    var filter = settings.actionfilter; //filtro
    var edittype = settings.actiontype; //nuovo o edit

    if (edittype == "SHOGD") {
        showGrid(target, ext_settings);
        closeActionsToolTip(target);
        return;
    }
    var jqitems = window.jqueryEditRefTreeGrid;
    try {
        var lab = "actiongrid";
        var gridobj = getrootgrid(gridcode);
        //refresh of the main grid. If it's a subaction this will be managed differently in manageSubActionsOnActionEnd
        if ((edittype == "NEWGD" || edittype == "EDTGD") && !subsettings) {
            //refresh the action grid which is supposed to differ from the actioncommand gridname
            var ore_ = gridobj.dataSource.requestEnd;
            gridobj.dataSource.requestEnd = function (p) {
                ore_.call(this, p);
                if (jqitems.jqgrid && p.type!="read")
                    jqitems.jqgrid.data("kendoGrid").dataSource.read();
            };
        }
        if (gridobj.editable == true || gridobj.editable.mode == "incell")
        {
            showGrid(target, true);
        }
        var origedit = gridobj.edit;
        gridobj.edit = function (e) {
            e.model.set("ACTION_ID", settings.id);
            if (settings.subid)
                e.model.set("SUBACTION_ID", settings.subid);
            origedit.call(this, e);
        };
        if ($("#actiongrid").length == 0)
            $("#appcontainer").append("<div id='" + lab + "' style='display:none'>");
        else {
            if ($('#' + lab).data("kendoGrid")) {
                $('#' + lab).data("kendoGrid").destroy();
                $('#' + lab).remove();
                $("#appcontainer").append("<div id='" + lab + "' style='display:none'>");
            }
        }
        //applico i defaults come nel caso navigabilita' creando un oggetto kendo like con il modello della riga in cui sono state create le actions
        var e = {
            data: jqitems ? jqitems.rowData : {}
        };
        if (sessionStorage.getItem("actions_gridmodelstring") != null)
            e.data = JSON.parse(sessionStorage.getItem("actions_gridmodelstring"));
        if (filter)
            filtersolver(filter, gridobj, e);
        renderGrid(gridobj, null, null, lab);
        //gestione dei refresh e delle sequenze di grid/form
        if (window.manageSubActions)
            $('#' + lab).data("kendoGrid").dataSource.bind('requestEnd', function (e) {
            if (e.type != "read") {
                manageSubActionsOnActionEnd(target,settings,subsettings);
            }
            });
        var defer = new $.Deferred();
        $('#' + lab).data("kendoGrid").one("dataBound", function () { defer.resolve(); })
        $.when(defer).then(function () {
            var $row = $("#" + lab).find("div.k-grid-content tr").eq(0);
            var $kgrid = $("#" + lab).data("kendoGrid");
            if (edittype == "NEWGD")
                $kgrid.addRow();
            else
                //$('#' + lab).data("kendoGrid").editRow($("#" + lab + " tr:eq(1)"));
                $kgrid.editRow($row);
        });
    }
    catch (err) {
        console.log("function editRefTreeGrid, error while trying to edit " + gridcode + " from actions:" + err);
    }
    return;
}

function showGrid(target, ext_settings, closeonsave) {
    var allsettings = ext_settings ? { settings: manage_Ext_settings(ext_settings), subsettings: ext_settings.subsettings } : getSettingsFromTarget(target);
    var jqitems = window.jqueryEditRefTreeGrid;
    var settings = allsettings.settings;
    var subsettings = allsettings.subsettings;
    var gridcode = settings.actioncommand; //gridname
    var filter = settings.actionfilter; //filtro
    var edittype = settings.actiontype; //nuovo o edit

    $("#wndmodalContainer").addClass("modal-wide");
    $(".modal-title").text("");
    $("#contentofmodal").empty();
    $("#executesave").unbind("click");
    $("#executesave").hide();
    $("#wndmodalContainer").modal('show');
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.kendo.getGridObject({ gridName: gridcode }).then(function (gridobj) {
            if (typeof filter == "string" && filter && filter.indexOf("{")!=-1)
                filter = JSON.parse(filter);
            var e = {
                data: jqitems ? jqitems.rowData : {}
            };
            if (filter)
                    filtersolver(filter, gridobj, e);
            //add pk of starting grid as parameter
            var origpmap__ = gridobj.dataSource.transport.parameterMap;
            gridobj.dataSource.transport.parameterMap = function (options, operation)
            {
                try {
                    if (operation != "read") {
                        var id = jqitems.rowData.id;
                        $.extend(options, { PARENT_ID__: id });
                    }
                }
                catch (err)
                {
                    console.log("Problems extending...:" + err);
                }
                var options = origpmap__.call(this, options, operation);
                return options;
            }

            if ($("#gridshowactions").data("kendoGrid")) {
                $("#gridshowactions").data("kendoGrid").destroy();
                $("#gridshowactions").remove();
            }
            $("#contentofmodal").append('<div id="gridshowactions"></div>');
            MF.kendo.appendGridToDom({ kendoGridObject: gridobj, selector: "gridshowactions" });
            if (closeonsave)
                $("#gridshowactions").attr("closeonsave", true);
            
        });
    });
   

}

function showGridAndLinkButton(target,ext_settings)
{
    //settings will be the selected action db settings 
    var settings;
    //contextInfo is an info which comes from the action caller context
    var contextInfo = $(target).closest(".k-tooltip").data("actionsettings");
    $.each(contextInfo[0], function (i, v) {
         if (v.id = $(target).attr("id"))
             settings = v;
     })
    var gridcode = settings.actioncommand; //gridname
    var filter = settings.actionfilter; //filter
   // var edittype = settings.actiontype; //

    var $container = cleanModal();
    var $modal = $("#wndmodalContainer");
    $modal.addClass("modal-wide");
    $container.html(largeSpinnerHTML);
    $modal.find("h4.modal-title").text(getObjectText("linkobjects"));
    $modal.modal('show');

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.kendo.getGridObject({ gridName: gridcode }).then(function (gridobj) {
            if (typeof filter == "string" && filter && filter.indexOf("{") != -1)
                filter = JSON.parse(filter);
            if (filter)
                filtersolver(filter, gridobj, null);
          
            if ($("#gridshowactions").data("kendoGrid")) {
                $("#gridshowactions").data("kendoGrid").destroy();
                $("#gridshowactions").remove();
            }
            $container.append('<div class="row"><div id="gridshowactions"></div></div>');
            $container.find("p").remove();
            MF.kendo.appendGridToDom({ kendoGridObject: gridobj, selector: "gridshowactions" }).then(function (kendoGrid) {
                //adds a link button which submits the selected records on the grid and calls a database stored procedure
                $container.prepend('<div class="row"><button id="linkbtn__actions" type="button" class="btn btn-primary">' + getObjectText('linkobjects') + '</button></div><div class="row" style="height:10px;"/>');
                $container.find("#linkbtn__actions").click(function (e) {
                    //selected is the previously selected list of items
                    var selectedItemsInGrid = kendoGrid.select();
                    if (!selectedItemsInGrid.length)
                    {
                        kendoConsole.log(getObjectText("selectatleastone"), true);
                        return;
                    }
                    var items = $.map(selectedItemsInGrid, function (v, i) {
                        return kendoGrid.dataItem(v);
                    });
                    MF.api.getDataSet({ preSelectedItems: contextInfo.selected, 
                        selectedGridItems: items, selectionGridName: gridcode, actionid: settings.id, referenceObjectId: contextInfo.referenceObjectId
                    },
                        window.linkActionStoredProcedure).then(function (res) {
                            //output from stored procedure ... 
                            if (contextInfo.success_callback)
                                contextInfo.success_callback(res);
                            $modal.modal('hide');
                        });
                });
            });
        });
    });
 }

function launchActionJsFunction(target, ext_settings) {
    var settings = ext_settings ? manage_Ext_settings(ext_settings) : getActionSettings($(target).attr("id"), $(target).parents("[role=tooltip]"));
    var rowdata = window.jqueryEditRefTreeGrid.rowData;
    window[settings.actioncommand](rowdata, window.jqueryEditRefTreeGrid.jqgrid);
    return;
}
function openURLInNewWindow(target, ext_settings) {
    var settings = ext_settings ? manage_Ext_settings(ext_settings) : getActionSettings($(target).attr("id"), $(target).parents("[role=tooltip]"));
    var urlToFormat = settings.actioncommand;
    //replace placeholder of rowdata ex: /test?test={test_ID}
    if (urlToFormat.match(/\{\w+\}/)) {
        var rowdata = window.jqueryEditRefTreeGrid.rowData;
        urlToFormat = urlToFormat.replace(/\{(\w+)\}/g, function (match, contents) {
            if (contents in rowdata)
                return rowdata[contents];
            return match;
        });
    }
    window.open(urlToFormat);
}
function launchCustomForm(target, ext_settings) {
    var settings = ext_settings ? manage_Ext_settings(ext_settings) : getActionSettings($(target).attr("id"), $(target).parents("[role=tooltip]"));
    var rowData = window.jqueryEditRefTreeGrid.rowData;
    var gridName = window.jqueryEditRefTreeGrid.jqgrid.attr("gridname");
    var actioncommand = settings.actioncommand ? JSON.parse(settings.actioncommand) : null;
    if (typeof showItemCustomForm == "function" && actioncommand)//showItemCustomForm To be defined in AdminAreaCustomizations
        showItemCustomForm(rowData, gridName, actioncommand.storedProcedure, actioncommand.controllerName);   
}

/*Spefic JsFunction for REFTREE only...*/
function launchReftreeAssetGallery(target,ext_settings)
{
    var allsettings = ext_settings ? { settings: manage_Ext_settings(ext_settings) } : getSettingsFromTarget(target);
    var assetid = allsettings.settings.actioncommand; //TipMod Code 
    var rowdata = { AS_ASSET_ID: assetid };
    //creates thumbs if missing and lauches the gallery
    $.when(createThumbsForAsset(rowdata.AS_ASSET_ID)).then(function () {
        require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
            require(["imagesdocmng"],
                function () {
                    showAssetGallery(rowdata);
                });
        });
    });

}
function launchReftreeBuildDocumentFromModel(target,ext_settings) {
    var allsettings = ext_settings ? { settings: manage_Ext_settings(ext_settings), subsettings: ext_settings.subsettings } : getSettingsFromTarget(target);
    var rowdata = window.jqueryEditRefTreeGrid.rowData;
    var settings = allsettings.settings;
    var subsettings = allsettings.subsettings;
    var tipmodcode = settings.actioncommand; //TipMod Code 
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({
            table: "core.PS_TIPMOD_type_model",
            where: "PS_TIPMOD_CODE = '"+settings.actioncommand+"'",
            order: "PS_TIPMOD_ID"
        })
    .then(function (res) {
        var tipmod = {
            id: res[0].PS_TIPMOD_ID,
            code: res[0].PS_TIPMOD_CODE,
            description: res[0].PS_TIPMOD_DESCRIPTION,
            batch: res[0].PS_TIPMOD_FLAG_BATCH,
            tipoutId: res[0].PS_TIPMOD_PS_TIPOUT_ID,
            tipoutCode: res[0].PS_TIPOUT_CODE,
            tipoutDescription: res[0].PS_TIPOUT_DESCRIPTION
        };
        //disparchers of reftree...
        buildDocuments(null, tipmod, [rowdata], function () {
            //window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataSource.read();
            refreshTotalsGrid();
            manageSubActionsOnActionEnd(target,settings,subsettings);
        }, null, "Documentale", window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid"));
    }, function (res) {
        console.log(res);
    });
    });
   
}
//#endregion
//#region actionSettingsManagement
//sets the window vars and returns the settings back
function manage_Ext_settings(ext_settings) {
    window.jqueryEditRefTreeGrid = { jqgrid: ext_settings.jqgrid, jrow: ext_settings.jrow, rowData: ext_settings.rowData };
    return ext_settings;
}
function manageSubActionsOnActionEnd(target,settings,subsettings) {
    function refreshParentGrid(jqitems) {
        //D.T:aggiorno la griglia principale in cui ci sono le actions e quella eventuale dei conteggi come da redmine #487
        if (jqitems.jqgrid.data("kendoGrid"))
            jqitems.jqgrid.data("kendoGrid").dataSource.read();
        refreshTotalsGrid();

    }
    //GESTIONE "WIZARD" subactions 
    //row della griglia su cui risiede il "pulsante" Actions
    var jqitems = window.jqueryEditRefTreeGrid;
    refreshParentGrid(jqitems);
    var model;
    if (subsettings == null) //action principale
    {
        model = jqitems.rowData;
        model.PKVALUE = model.id;
        sessionStorage.setItem("actions_gridmodelstring", JSON.stringify(model)); //salvo il riferimento al model come stringa (in modo che rimanga se la row sparisce dal grid) 
    }
    else  //subaction recupero il model dalla sessionStorage.
    {
        model = JSON.parse(sessionStorage.getItem("actions_gridmodelstring"));
    }
    if (!model.id)
        model.id = model.PKVALUE;
    //vado a chiedere al db se dopo il salvataggio (senza errori) di questa actionid / subactionid (eventuale) ci sia un nuovo form da aprire. Mi fermo se viene tornato un empty recordset

    requireConfigAndMore(["MagicSDK"], function (MF) {
        //your code here
        try {
            MF.kendo.getStoredProcedureDataSource("core.usp_ev_get_action_sub_next",//nome STORED 
                {
                    data: { RecordId: model.id, actionid: settings.id, subActionid: settings.subid == undefined ? '' : settings.subid }, //parametri TAG P
                    success: function (e) { //funzione eseguita dopo la read()
                        if (e.items.length) {
                            setActionSettings(e.items[0], "subsettings");

                            switch (e.items[0].actiontype) {
                                case "NEWGD":
                                case "EDTGD":
                                    editActionGrid(target);
                                    break;
                                case "SHOGD":
                                    showGrid(target);
                                    break;
                                    //REFTREE ONLY!!!
                                case "R3BDOC":
                                    launchReftreeBuildDocumentFromModel(target);
                                    break;
                                    //History
                            }
                        }
                        else //fine della chain di aperture
                        {
                            setActionSettings(null, "subsettings");
                            sessionStorage.removeItem("actions_gridmodelstring");
                        }
                    }
                }).read(); // esegue la chiamata
        }
        catch (ex) {
            console.log("subactions not managed");
        }
    });
}
function getSettingsFromTarget(target) {
    var settings = getActionSettings($(target).attr("id"), $(target).parents("[role=tooltip]"));
    var subsettings = getActionSettings($(target).attr("id"), "#appcontainer", "subsettings");
    if (subsettings != null)
        settings = subsettings; //se sono in una sottosequenza considero quei setting e non quelli dell' action di partenza.
    else
        sessionStorage.removeItem("actions_gridmodelstring");
    return { settings: settings, subsettings: subsettings };
}
function getActionSettings(actionid, datahtml, type) {
    if (!type)
        type = "actionsettings";
    var acts = $(datahtml).data(type);

    //if (type != "actionsettings")
    //    acts = $(datahtml).data(type);

    var ret = null;
    $(acts).each(function (i, v) {
        if (v.id == actionid)
            ret = v;
    });
    return ret;
}
function setActionSettings(actions, type, containedelementid) {
    if (!type)
        type = "actionsettings";
    if (!containedelementid)
        containedelementid = "refactionsaccordion";
    switch (type) {
        case "actionsettings":
            if (actions)
                $("[role=tooltip]").has("#" + containedelementid).data(type, actions);
            else $("[role=tooltip]").has("#" + containedelementid).data(type, null);
            break;
        default:
            if (actions)
                $("#appcontainer").data(type, actions);
            else
                $("#appcontainer").data(type, null);
            break;
    }
}
//#endregion
