



function cellFocus(e, oGrid)
{
     
    var gridcode = oGrid.element.attr("gridname");
    var gridentity = 'core.' + oGrid.element.attr("gridname");
    var data = oGrid.dataSource.data();
    var onChangeField = e.sender.columns[e.container[0].cellIndex].field;
     
 
    if (data.length > 0) {

        var selectedRow = oGrid.select();
        var selectedRowIndex = selectedRow.closest('tr').index();
        var selectedCellIndex = oGrid.cellIndex(oGrid.select());

        if (selectedRowIndex == -1) { selectedRowIndex = 0; }
        if (selectedCellIndex == -1) { selectedCellIndex = 0; }

        var onChangeField = oGrid.columns[selectedCellIndex].field;
        var Row = data.filter(function (i, n) { return i.uid === data[selectedRowIndex].uid; });

        var oArray = Row[0].get('Disabilita').split(',');

        //var input2 = e.container.find(".k-input");

        //input2.on({
        //    keyup: function (e) {


        //        Row[0].set(oGrid.columns[selectedCellIndex].field,this.value);
        //        navigaTest(oGrid);
        //    }
        //});


        oArray.forEach(function (element) {
            if (e.sender.columns[e.container[0].cellIndex].field == element)
            {
                var input = e.container.find(".k-input");
                input.attr("disabled", "disabled");


            }
        });
    }
}

function cambiaValore(oGrid) {

    navigaTest(oGrid)
}
 
function navigaTest(e,oGrid) {

    var defer = $.Deferred();
    //var oGrid = e.detailRow.find("#PRW_VI_PRIANA_L").data('kendoGrid');
    var gridcode = oGrid.element.attr("gridname");
    var gridentity = 'core.' + oGrid.element.attr("gridname");
    var data = oGrid.dataSource.data();
     
    var onChangeField = '';


    if (data.length > 0)
    {

            var selectedRow = oGrid.select();
            var selectedRowIndex = selectedRow.closest('tr').index();
            var selectedCellIndex = e.detailCell.index(); //oGrid.cellIndex(oGrid.select());

            if (selectedRowIndex == -1) { selectedRowIndex = 0; }
            if (selectedCellIndex == -1) { selectedCellIndex = 0; }

            
            var tr = $("tr[data-uid=" + data[selectedRowIndex].uid + "]");
            var Row = oGrid.dataItem(tr); // data.filter(function (i, n) { return i.uid === data[selectedRowIndex].uid; });
            
            var tdIndex = tr.find('td[class="k-edit-cell"]').index();
            var onChangeField = oGrid.columns[tdIndex].field;
            

            var ds = buildXMLStoredProcedureJSONDataSource({ stageid: 0, gridname: gridcode, gridentity: gridentity, data: Row, onChangeField: onChangeField },
                function (res){
                    $(res.items).each(function (i, v) {
                    Row[0].set(v.ColumnName, v.EV_DEFAULT_VALUE);
                    });

                defer.resolve(res.items);
            }, "core.usp_ev_ret_grid_contraints");
            ds.transport.async = false;
            ds.read();
            return defer.promise();

    }
    
    }


function naviga(oGrid) {
  
    //var oGrid = $("#" + grid.code).data('kendoGrid');
    

    var oData = oGrid.dataSource.data();





    if (oData.length > 0) {
        var selectedRow = oGrid.select();
        var selectedRowIndex = selectedRow.closest('tr').index();
        var selectedCellIndex = oGrid.cellIndex(oGrid.select());

        if (selectedRowIndex == -1) { selectedRowIndex = 0; }

        if (selectedCellIndex == -1) { selectedCellIndex = 0; }



        if (selectedRowIndex != -1) {
            var oRow = oData.filter(function (i, n) { return i.uid === oData[selectedRowIndex].uid; });

            if (selectedCellIndex != -1) {

               

                var sItem = oGrid.columns[selectedCellIndex].field;





                var iPriceuId = oRow[0].get('TK_PRIANA_TK_PRICEU_ID');
                var iWorordId = oRow[0].get('TK_PRIANA_TK_WORORD_ID');


                if (iPriceuId != 0) {

                    requireConfigAndMore(["MagicSDK"], function (MF) {
                        MF.api.get({    //#felixtodo
                            table: "core.usp_ev_ret_grid_contraints",
                            where: "TK_PRICEU_ID  =" + iPriceuId,
                            order: "1"
                        })
                        .then(function (res) {
                            console.log(res); //show result on success


                        }, function (res) {
                            //handle error or not
                            console.log(res);

                        });
                    });

                 
                
                        $.ajax({    //#mfapireplaced
                            type: "POST",
                            url: "/api/MF_API/GetPRW_VI_PRICEU_L",
                            data: JSON.stringify({
                                TK_PRICEU_ID: "" + iPriceuId,
                                TK_WORORD_ID: "" + iWorordId,
                            }),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function (result) {

                                var values = result.Data[0].Table[0];

                                oRow[0].set("TK_PRIANA_PRICE_UNIT", values.TK_PRICEU_VALUE);
                                oRow[0].set("TK_PRIANA_PERC_REBATE", values.TK_PRLCON_REBATE);
                                oRow[0].set("TK_PRIANA_PERC_ADDON", values.TK_PRLCON_PERC_ADDON);


                            }
                        });
                }



                var TK_PRIANA_PRICE_UNIT = oRow[0].get("TK_PRIANA_PRICE_UNIT");
                var TK_PRIANA_QTA = oRow[0].get("TK_PRIANA_QTA");
                var TK_PRIANA_PERC_REBATE = oRow[0].get("TK_PRIANA_PERC_REBATE");
                var TK_PRIANA_PERC_ADDON = oRow[0].get("TK_PRIANA_PERC_ADDON");

                var dcImportoTot = TK_PRIANA_PRICE_UNIT * TK_PRIANA_QTA;

                var TK_PRIANA_TOT_AMOUNT = dcImportoTot + (dcImportoTot * (TK_PRIANA_PERC_REBATE / 100.00))
                TK_PRIANA_TOT_AMOUNT = TK_PRIANA_TOT_AMOUNT - (TK_PRIANA_TOT_AMOUNT * (TK_PRIANA_PERC_ADDON / 100.00))

                
                oRow[0].set("TK_PRIANA_TOT_AMOUNT", TK_PRIANA_TOT_AMOUNT);

            }

        }

    }



}

function customOnChange(dataItem, sItem, sGridName) {

    var values = result.Data[0].Table[0];
    var grid = $("#" + sGridName).data('kendoGrid');
    var oData = grid.dataSource.data();
    var oRow = oData.filter(function (i, n) { return i.uid === dataItem.uid; });



    if (dataItem.TK_PRIANA_TK_PRICEU_ID != 0) {


        $.ajax({ //#mfapireplaced
            type: "POST",
            url: "/api/MF_API/GetPRW_VI_PRICEU_L",
            data: JSON.stringify({
                TK_PRICEU_ID: "" + dataItem.TK_PRIANA_TK_PRICEU_ID
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {

                var values = result.Data[0].Table[0];
                var grid = $("#" +sGridName).data('kendoGrid');
                var oData = grid.dataSource.data();
                var oRow = oData.filter(function (i, n) { return i.uid === dataItem.uid; });

                grid.dataSource.options.schema.model.fields["TK_PRIANA_TOT_AMOUNT"].editable = true

                if (sItem == "TK_PRIANA_TK_PRICEU_ID")
                {

                    oRow[0].set("TK_PRIANA_PRICE_UNIT", values.TK_PRICEU_VALUE);
                    oRow[0].set("TK_PRIANA_PERC_REBATE", values.TK_PRLCON_REBATE);
                    oRow[0].set("TK_PRIANA_TOT_AMOUNT", values.TK_PRICEU_VALUE + (values.TK_PRICEU_VALUE * (values.TK_PRLCON_REBATE/100.00)));
                    
                }

                
                

            }
        });

    }
}


function editTicket(ee) {

    var info = getRowDataFromButton(ee);
    var gridcode = 'MOB_TK_V_LIST_TICKET'; //gridname
    var filter = '{ "field": "TK_TICKET_AS_ASSET_ID", "operator": "eq", "value": ' + info.AS_ASSET_ID + '}'; //filtro
    var edittype = 'NEWGD' //settings.actiontype; //nuovo o edit

    try {
        var lab = "actiongrid" //gridcode;
        var gridobj = getrootgrid(gridcode);

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
            data: info
        };


        if (sessionStorage.getItem("actions_gridmodelstring") != null)
            e.data = JSON.parse(sessionStorage.getItem("actions_gridmodelstring"));

        if (filter)
            filtersolver(filter, gridobj, e);

        renderGrid(gridobj, null, null, lab);
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

function editDocument(e) {
    e.sender.element.data("saveFilesAsync", false)
    var gridhtmlid = e.sender.element.attr("id");
    var gridname = e.sender.element.attr("gridname");
    //In AdminAreaCustomizations.js c'e' la definizione dell' hash con il valore del flag foto per i nuovi elementi (per quelli esistenti non c'e' problema)
    var DO_CLADOC_FLAG_PHOTO = window.documentPhotoValueTrue[gridname] == null ? false : window.documentPhotoValueTrue[gridname];
    var assignedtipdoc = new $.Deferred;
    var layerpreselect = function (e) {

        var optionsmodel = {
            disable_properties: true,
            disable_edit_json: true,
            disable_collapse: true,
            iconlib: "bootstrap3",
            no_additional_properties: true,
            show_errors: 'always',
            schema: {
                title: getObjectText("selectatypetoproceed"),
                type: "object",
                properties: {

                    documentClass: {
                        type: "string",
                        title: getObjectText("docclass")
                    },
                    documentType: {
                        type: "string",
                        title: getObjectText("doctype")
                    }
                }
            }

        };
        var dataloader = new $.Deferred;

        requireConfig(function () {
            require(['JSONEditor'], function (JSONEditor) {
                //e.container.find(".k-tabstrip").hide();
                JSONEditor.defaults.options.theme = 'bootstrap3';
                var editor = new JSONEditor(e.container[0], optionsmodel);
                var classes = [];
                var types = [];
                e.model.set("DO_CLADOC_FLAG_PHOTO", DO_CLADOC_FLAG_PHOTO);
                var rowdata = e.model;
                $.ajax({
                    type: "POST",
                    url: "/api/MANAGEFK/CallFKStoredProcedure",
                    data: JSON.stringify({ storedprocedurename: "get_do_cladoc_for_user", schema: "core", textfield: "DO_CLADOC_DESCRIPTION", valuefield: "DO_CLADOC_ID", rowdata: JSON.stringify(rowdata) }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    error: function (err) { dataloader.resolve(); },
                    success: function (result) {
                        if (result.length > 0) {
                            $.each(result, function (i, v) {
                                classes.push({ DO_CLADOC_ID: parseInt(v.value), text: v.text, MagicBOLayer_ID: v.MagicBOLayer_ID });
                            });
                            $.ajax({
                                type: "POST",
                                url: "/api/MANAGEFK/CallFKStoredProcedure",
                                data: JSON.stringify({ storedprocedurename: "get_do_tipdoc_for_user", schema: "core", textfield: "DO_TIPDOC_DESCRIPTION", valuefield: "DO_TIPDOC_ID", rowdata: JSON.stringify(rowdata) }),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                error: function (err) {
                                    dataloader.resolve();
                                },
                                success: function (result) {
                                    $.each(result, function (i, v) {
                                        types.push({
                                            value: v.DO_TIPDOC_ID,
                                            text: v.DO_TIPDOC_DESCRIPTION,
                                            DO_CLADOC_ID: v.DO_TIPDOC_DO_CLADOC_ID,
                                            MagicBOLayer_ID: v.MagicBOLayer_ID,
                                            DO_TIPDOC_DO_STADOC_ID: v.DO_TIPDOC_DO_STADOC_ID
                                        });
                                    });
                                    dataloader.resolve();
                                }
                            });
                        }
                        else {
                            dataloader.resolve();
                        }
                    }
                });
                $.when(dataloader).then(function () {
                    e.container.find("[name$=\\[documentClass\\]]").attr("id", "parentdoc");
                    e.container.find("[name$=\\[documentClass\\]]").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "DO_CLADOC_ID",
                        dataSource: { data: classes }
                    });
                    e.container.find("[name$=\\[documentType\\]]").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: { data: types },
                        cascadeFrom: "parentdoc"
                    });
                    e.container.prev(".k-window-titlebar.k-header").after(e.container.find("div[data-schemaid=root]"));
                    e.container.closest('.k-window').show().animate({
                        'marginTop': "-=150px" //moves up
                    });

                    if (types.length > 0) {
                        e.container.parent().find(".well").append("<button id=\"btnlayerdoc\" class=\"k-button proceed\">" + getObjectText("proceed") + "</button>");

                        e.container.parent().find("#btnlayerdoc").click(function (el) {
                            var btnwindow = $(el.currentTarget).closest(".k-window");
                            var selclass = btnwindow.find("[name$=\\[documentClass\\]]").data("kendoDropDownList").value();
                            var seltype = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").value();
                            var stadoc = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                            btnwindow.find("div[data-schemaid=root]").remove();
                            e.container.show().data("kendoWindow").center();
                            e.container.closest('.k-window').css('marginTop', 0);
                            e.model.DO_DOCUME_DO_TIPDOC_ID = parseInt(seltype);
                            e.model.DO_TIPDOC_DO_CLADOC_ID = parseInt(selclass);
                            if (stadoc)
                                e.model.DO_DOCUME_DO_STADOC_ID = parseInt(stadoc);
                            btnwindow.find("input[name=DO_TIPDOC_DO_CLADOC_ID]").attr("disabled");
                            btnwindow.find("input[name=DO_DOCUME_DO_TIPDOC_ID]").attr("disabled");
                            var closeValidationTooltip = function () {
                                btnwindow.find("input[name=DO_DOCUME_DO_STADOC_ID]").closest('div').find(".k-widget .k-tooltip a").trigger("click");
                                btnwindow.find("div.k-tab-error-underline").remove();
                            }
                            assignedtipdoc.resolve(e.model.DO_DOCUME_DO_TIPDOC_ID, closeValidationTooltip);

                        });
                    }
                    else {
                        if (classes.length == 0)
                            kendoConsole.log(getObjectText("classesnotloaded"), true);
                        else
                            kendoConsole.log(getObjectText("typesnotloaded"), true);
                    }
                });
            });
        });
    }

    if (!e.model.isNew())
        assignedtipdoc.resolve(e.model.DO_DOCUME_DO_TIPDOC_ID);
    else {
        e.container.hide();
        e.container.closest('.k-window').hide();
        layerpreselect(e);
    }
    //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il TIPDOC
    $.when(assignedtipdoc).then(function (tipdocid, closeValidationTooltip) {
        var selectDataBoundsPromises;
        if (e.model.DO_DOCREL_ID_RECORD !== null && e.model.DO_DOCREL_ID_RECORD !== undefined)
            selectDataBounds = getStandardEditFunction(e, null, gridhtmlid);//lo appendo al fondo del 1o TAB 
        else
            selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined, {
                appendTo: "#tabstrippopup-1", callback: function () {
                    getBoTypeFilterFieldKey(tipdocid, 'DO_DOCUME_DO_TIPDOC_ID'); //OBTIDO relazioni tra il tipo ed i business objects
                    //D.T: aggiungo al BOSelector le informazioni sull'  entita' che e' in EDIT
                    setBOLinkedEntity("DO_V_DOCUME", tipdocid);
                }
            });
        $.when(selectDataBounds).then(function (selectDataBoundspromises) {
            $.when(selectDataBoundspromises["DO_DOCUME_DO_STADOC_ID"]).then(function () {
                if (closeValidationTooltip && typeof closeValidationTooltip == 'function')
                    closeValidationTooltip();
            });
        });

        //Sovrascrivo le estensioni che sono accettate a livello di TIPDOC
        $.ajax({ //#mfapireplaced
            url: "/api/MF_API/GetDO_TIPDOC_document_type",
            type: "POST",
            data: JSON.stringify({
                DO_TIPDOC_ID: "" + tipdocid
            }),
            contentType: "application/json; charset=utf-8",
            error: function (err) { console.log(err); },
            success: function (res) {
                var allowedextensions = res.Data[0].Table[0].DO_TIPDOC_EXTENSIONS;
                overrideAcceptedExtensions(e, allowedextensions);
            }, dataType: "json"
        });
    });
}

function editTicketOld(ee) {

    var info = getRowDataFromButton(ee);
    var filter = getRowJSONPayload(ee)["filtri"];
    var sActionCode;
    var sFilter;
    var sGuid;

    $(filter).each(function () {
        if (this["actionCode"])
        {
            sActionCode = this["actionCode"];
        }
        else if (this["filter"])
        {
            sFilter = this["filter"];

        }
        else if (this["guid"]) {
            sGuid = this["guid"];

        }
    });


    info.EV_ACTION_CODE = ee.data.commandName;


    var lanciaAction = function (e) {

        var dataloader = new $.Deferred;

        requireConfig(function () {
            require(['JSONEditor'], function (JSONEditor) {
                JSONEditor.defaults.options.theme = 'bootstrap3';
                var act = [];
                var rowdata = getRowDataFromButton(e);

                $.ajax({
                    type: "POST",
                    url: "/api/MANAGEFK/CallFKStoredProcedure",
                    data: JSON.stringify({ storedprocedurename: "get_action_from_button", schema: "core", textfield: "EV_ACTION_CODE", valuefield: "EV_ACTION_ID", rowdata: JSON.stringify(rowdata) }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    error: function (err) { dataloader.resolve(); },
                    success: function (result) {
                        if (result.length > 0) {

                            $.each(result, function (i, v) {
                                act.push({ EV_ACTION_ID: parseInt(v.value), EV_ACTION_CODE: v.text, EV_ACTION_COMMAND: v.EV_ACTION_COMMAND, EV_ACTION_FILTER: v.EV_ACTION_FILTER, actiontype: v.EV_ACTTYP_CODE });

                                dataloader.resolve(act);
                            });
                        }
                        else {
                            dataloader.resolve();
                        }

                        // dataloader.resolve();
                    }
                });

                $.when(dataloader).then(function (act) {
                    actionButtonStart(data, act)
                });
            });
        });
    }

    lanciaAction(ee);  
}
  
function actionButtonStart(data, action) {
    //Actions
    switch (data.actiontype) {
        case "RTFUN":
            return { click: "launchActionFunction(this);" };
            break;
        case "NEWGD":
        case "EDTGD":
            return { click: "editButtonGrid("+ action + ");" };
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
            //REFTREE ONLY!!!
        case "R3BDOC":
            return { click: "launchReftreeBuildDocumentFromModel(this);" };
            break;
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

function editButtonGrid(action) {

    var gridcode = action.EV_ACTION_COMMAND; //gridname
    var filter = '{ "field": ' + action.filter +', "operator": "eq", "value": ' + info.AS_ASSET_ID + '}'; //filtro
    var edittype = action.actiontype;

    try {
        var lab = "actiongrid" //gridcode;
        var gridobj = getrootgrid(gridcode);

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
            data: info
        };


        if (sessionStorage.getItem("actions_gridmodelstring") != null)
            e.data = JSON.parse(sessionStorage.getItem("actions_gridmodelstring"));

        if (filter)
            filtersolver(filter, gridobj, e);

        renderGrid(gridobj, null, null, lab);
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

function redirectElencoTicket(e) {

    var funcGuid = '741111C3-399F-40CB-9085-AC9A8B37CFB3';
        var gridName = 'MOB_TK_V_LIST_TICKET';
        var funcId = 1379;
        var filter = '{ "field": "TK_TICKET_AS_ASSET_ID", "operator": "eq", "value": ' + getRowDataFromButton(e).AS_ASSET_ID + '}';

        if (gridName && funcId && filter) {
            filter = typeof filter == "string" ? JSON.parse(filter) : filter;
            filter.type = "chartFilter";
            setSessionStorageGridFilters(gridName, funcId, filter, true);//the true value means that the filter will be ovewritten
        }

        redirectToFunction(funcGuid);
}

function redirectMonitorDocumeDyn(e) {

    var jsonpayload = {};
    try {
        jsonpayload = getRowJSONPayload(e);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }

    jsonpayload.filter = jsonpayload.filter + getRowDataFromButton(e).AS_ASSET_ID;

    redirectToFunctionTextDyn(jsonpayload.functionGuid, jsonpayload.filter, jsonpayload.openInNewTab, jsonpayload.functionModule);

}

function redirectToFunctionTextDyn(funcIdOrGuid, queryString, doOpenInNewTab, funcMod) {

    if (!funcMod) {
        var key = typeof funcIdOrGuid == "string" && !funcIdOrGuid.match(/^\d$/) ? "funcGuid" : "funcId";
        $.post("/api/MenuData/PostPerformMenuResearch?" + key + "=" + funcIdOrGuid, null).then(function (res) {
            if (res.Data.length) {
                var path = "/app" + (queryString || "") + "#/function/" + funcMod + "-" + encodeURI(res.Data[0].label).replace(/%20/g, "-");
                if (!doOpenInNewTab)
                    window.location.href = path;
                else
                    window.open(path, "_blank");
            }
        });
    }
    else {
        var key = typeof funcIdOrGuid == "string" && !funcIdOrGuid.match(/^\d$/) ? "funcGuid" : "funcId";
        $.post("/api/MenuData/PostPerformMenuResearch?" + key + "=" + funcIdOrGuid, null).then(function (res) {
            if (res.Data.length) {
                var path = "/app" + (queryString || "") + "#/function/" + funcMod + "-" + encodeURI(res.Data[0].label).replace(/%20/g, "-");
                if (!doOpenInNewTab)
                    window.location.href = path;
                else
                    window.open(path, "_blank");
            }
        });
    }


}

function redirectMonitorDocume(e) {
    var funcGuid = 'F61E3551-CA4C-4138-AC56-4F39D4414699';
    var gridName = 'MOB_AS_V_ASSET_L_MAIN';
    var funcId = 158;
    var filter = '?AS_ASSET_ID=' + getRowDataFromButton(e).AS_ASSET_ID;


    //var path = "/app" + (filter || "") + "#/function/" + 472 + "-" + 38 + "-" + 'Documenti-mobile';
     
       // window.location.href = path;
    redirectToFunctionText(funcGuid, filter,null, 472 + "-" + 38);
}


function redirectToFunctionText(funcIdOrGuid, queryString, doOpenInNewTab, funcMod) {

    if (!funcMod)
    {
        var key = typeof funcIdOrGuid == "string" && !funcIdOrGuid.match(/^\d$/) ? "funcGuid" : "funcId";
        $.post("/api/MenuData/PostPerformMenuResearch?" + key + "=" + funcIdOrGuid, null).then(function (res) {
            if (res.Data.length) {
                var path = "/app" + (queryString || "") + "#/function/" + funcMod + "-" + encodeURI(res.Data[0].label).replace(/%20/g, "-");
                if (!doOpenInNewTab)
                    window.location.href = path;
                else
                    window.open(path, "_blank");
            }
        });
    }
    else
    {
        var key = typeof funcIdOrGuid == "string" && !funcIdOrGuid.match(/^\d$/) ? "funcGuid" : "funcId";
        $.post("/api/MenuData/PostPerformMenuResearch?" + key + "=" + funcIdOrGuid, null).then(function (res) {
            if (res.Data.length) {
                var path = "/app" + (queryString || "") + "#/function/" + 472 + "-" + 38 + "-" + encodeURI(res.Data[0].label).replace(/%20/g, "-");
                if (!doOpenInNewTab)
                    window.location.href = path;
                else
                    window.open(path, "_blank");
            }
        });
    }

    
}

function activateTkTesto(e) {

    function refreshParentGrid(jqitems) {
        //D.T:aggiorno la griglia principale in cui ci sono le actions e quella eventuale dei conteggi come da redmine #487
        if (jqitems.jqgrid.data("kendoGrid"))
            jqitems.jqgrid.data("kendoGrid").dataSource.read();
        refreshTotalsGrid();
    }
    
    var info = getRowDataFromButton(e);

    if (info.checked == true) {

        var TK_CONART_ID = info.TK_CONART_ID;
        var gridobjstr = 'CK_VI_CONART_D';

        if ($("#" + gridobjstr).data("kendoGrid"))
            $("#" + gridobjstr).data("kendoGrid").destroy();

        if ($("#" + gridobjstr).length == 0) {
            $("#appcontainer").append("<div id='" + gridobjstr + "' style='display:none'>");
        }
        else {
            if ($('#' + gridobjstr).data("kendoGrid")) {
                $('#' + gridobjstr).data("kendoGrid").destroy();
                $('#' + gridobjstr).remove();
                $("#appcontainer").append("<div id='" + gridobjstr + "' style='display:none'>");
            }
        }


        var grid = getrootgrid(gridobjstr);
        grid.dataSource.filter = { field: "TK_CONART_ID", operator: "eq", value: TK_CONART_ID };
        renderGrid(grid, null, null, gridobjstr);

        var defer = new $.Deferred();
        $('#' + gridobjstr).data("kendoGrid").one("dataBound", function () { defer.resolve(); })
        $.when(defer).then(function () {
            var $row = $("#" + gridobjstr).find("div.k-grid-content tr").eq(0);
            var $kgrid = $("#" + gridobjstr).data("kendoGrid");

            //$kgrid.addRow();
            $kgrid.editRow($row);
            //        $('#CK_VI_CONART_D').data('kendoGrid').refresh();
        });


        $('#' + gridobjstr).data("kendoGrid").dataSource.bind('requestEnd', function (e) {

            if (e.type != "read") {
                var jqitems = $("#appcontainer").find('[id="grid"]')
                //refreshParentGrid(jqitems)
                $('#CK_VI_CONART_L').data('kendoGrid').dataSource.read();
                $('#CK_VI_CONART_L').data('kendoGrid').refresh();

                //jqitems.data('kendoGrid').dataSource.read();
                //jqitems.data('kendoGrid').refresh();                
            }

        });


    }
    
   
    }

function autowidthDropDown(e) {
    e.origfunction__();

    //$('[data-role="dropdownlist"]').data("kendoDropDownList").bind("select", function (e) {
    //    console.log("logo");
    //});

    $('[data-role="dropdownlist"]').each(function (i) {
        var $Container = $(this).closest(".k-widget.k-dropdown.k-header");
        $(this).data("kendoDropDownList").bind("select", function (e) {
            $Container.attr("title", e.item.text());
        });

        $(this).data("kendoDropDownList").bind("dataBound", function (e) {

            var $dropDown = $(e.sender.element),
                dataWidth = $dropDown.data("kendoDropDownList").list.width(),
                listWidth = dataWidth + 20,
                containerWidth = listWidth + 6;

            if ($dropDown.data("kendoDropDownList").list.width() < listWidth)
            {
                $dropDown.data("kendoDropDownList").list.width(listWidth);
                $dropDown.closest(".k-widget").width(containerWidth);

            }
            
        });

    });

       }

//function editRefereXml(e) {

//    e.sender.element.data("saveFilesAsync", false)
//    var gridhtmlid = e.sender.element.attr("id");
//    var gridname = e.sender.element.attr("gridname");
//    var assignedtipdoc = new $.Deferred;

//    //var vcClarefCode = e.sender._data[1].LE_CLAREF_CODE;
//    var vcClarefCode;

//    if(e.sender.element.data("kendoGrid").dataSource._filter == undefined){
//        vcClarefCode = null;
//    }
//    else {
//        var vcClarefCode = e.sender.element.data("kendoGrid").dataSource._filter.filters[0].value;
//    }
    


//    var layerpreselect = function (e) {

//        var optionsmodel = {
//            disable_properties: true,
//            disable_edit_json: true,
//            disable_collapse: true,
//            iconlib: "bootstrap3",
//            no_additional_properties: true,
//            show_errors: 'always',
//            schema: {
//                title: getObjectText("selectatypetoproceed"),
//                type: "object",
//                properties: {

//                    documentClass: {
//                        type: "string",
//                        title: getObjectText("claref")
//                    },
//                    documentType: {
//                        type: "string",
//                        title: getObjectText("detref")
                        
//                    }
//                }
//            }

//        };
//        var dataloader = new $.Deferred;

//        requireConfig(function () {
//            require(['JSONEditor'], function (JSONEditor) {
//                //e.container.find(".k-tabstrip").hide();
//                JSONEditor.defaults.options.theme = 'bootstrap3';
//                var editor = new JSONEditor(e.container[0], optionsmodel);
//                var classes = [];
//                var types = [];
               
//                e.model.set("LE_CLAREF_CODE", vcClarefCode);
//                var rowdata = e.model;


//                //var vcClareCode = e.model.
//                $.ajax({
//                    type: "POST",
//                    url: "/api/MANAGEFK/CallFKStoredProcedure",
//                    data: JSON.stringify({ storedprocedurename: "LE_USP_get_claref_for_user", schema: "core", textfield: "LE_CLAREF_DESCRIPTION", valuefield: "LE_CLAREF_ID", rowdata: JSON.stringify(rowdata) }),
//                    contentType: "application/json; charset=utf-8",
//                    dataType: "json",
//                    error: function (err) { dataloader.resolve(); },
//                    success: function (result) {
//                        if (result.length > 0) {
//                            $.each(result, function (i, v) {
//                                classes.push({ LE_CLAREF_ID: parseInt(v.value), text: v.text});
//                            });
//                            $.ajax({
//                                type: "POST",
//                                url: "/api/MANAGEFK/CallFKStoredProcedure",
//                                data: JSON.stringify({ storedprocedurename: "LE_USP_get_detref_for_user", schema: "core", textfield: "LE_DETREF_DESCRIPTION", valuefield: "LE_DETREF_ID", rowdata: JSON.stringify(rowdata) }),
//                                contentType: "application/json; charset=utf-8",
//                                dataType: "json",
//                                error: function (err) {
//                                    dataloader.resolve();
//                                },
//                                success: function (result) {
//                                    $.each(result, function (i, v) {
//                                        types.push({
//                                            value: v.LE_DETREF_ID,
//                                            text: v.LE_DETREF_DESCRIPTION,
//                                            LE_CLAREF_ID: v.LE_DETCLA_LE_CLAREF_ID
//                                            //MagicBOLayer_ID: v.MagicBOLayer_ID
//                                            //DO_TIPDOC_DO_STADOC_ID: v.DO_TIPDOC_DO_STADOC_ID
//                                        });
//                                    });
//                                    dataloader.resolve();
//                                }
//                            });
//                        }
//                        else {
//                            dataloader.resolve();
//                        }
//                    }
//                });
//                $.when(dataloader).then(function () {
//                    e.container.find("[name$=\\[documentClass\\]]").attr("id", "parentdoc");
//                    e.container.find("[name$=\\[documentClass\\]]").kendoDropDownList({
//                        dataTextField: "text",
//                        dataValueField: "LE_CLAREF_ID",
//                        dataSource: { data: classes }
//                    });
//                    e.container.find("[name$=\\[documentType\\]]").kendoDropDownList({
//                        dataTextField: "text",
//                        dataValueField: "value",
//                        dataSource: { data: types },
//                        cascadeFrom: "parentdoc"
//                    });
//                    e.container.prev(".k-window-titlebar.k-header").after(e.container.find("div[data-schemaid=root]"));
//                    e.container.closest('.k-window').show().animate({
//                        'marginTop': "-=150px" //moves up
//                    });

//                    if (types.length > 0) {
//                        e.container.parent().find(".well").append("<button id=\"btnlayerdoc\" class=\"k-button proceed\">" + getObjectText("proceed") + "</button>");

//                        e.container.parent().find("#btnlayerdoc").click(function (el) {
//                            var btnwindow = $(el.currentTarget).closest(".k-window");
//                            var selclass = btnwindow.find("[name$=\\[documentClass\\]]").data("kendoDropDownList").value();
//                            var seltype = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").value();
                              
//                           // var stadoc = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

//                            btnwindow.find("div[data-schemaid=root]").remove();
//                            e.container.show().data("kendoWindow").center();
//                            e.container.closest('.k-window').css('marginTop', 0);
//                            e.model.LE_REFERE_LE_DETREF_ID = parseInt(seltype);
//                            e.model.LE_REFCLA_CLAREF_ID = parseInt(selclass);

//                            if (seltype)
//                                //btnwindow.find("input[name=LE_REFCLA_CLAREF_ID]").attr("disabled");
//                                //btnwindow.find("input[name=LE_REFERE_LE_DETREF_ID]").attr("disabled");

//                            assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
//                        });
//                    }
//                    else {
//                        if (classes.length == 0)
//                            kendoConsole.log(getObjectText("classesnotloaded"), true);
//                        else
//                            kendoConsole.log(getObjectText("typesnotloaded"), true);
//                    }
//                });
//            });
//        });
//    }

//    if (!e.model.isNew())
//        assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
//    else {
//        e.container.hide();
//        e.container.closest('.k-window').hide();
//        layerpreselect(e);
//    }

//    //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il TIPDOC
//    $.when(assignedtipdoc).then(function (detretId) {
//        var selectDataBoundsPromises;
//        selectDataBounds = getStandardEditFunction(e, null, gridhtmlid, undefined);
//    });
//}

function editRefereXmlAction(e) {

 
    e.sender = $($(e.parent).find('[id="grid"]')).data("kendoGrid");


    e.sender.element.data("saveFilesAsync", false)

    var gridhtmlid = e.sender.element.attr("id");
    var gridname = e.sender.element.attr("gridname");
    var assignedtipdoc = new $.Deferred;

    //var vcClarefCode = e.sender._data[1].LE_CLAREF_CODE;
    var vcClarefCode;

    if (e.sender.element.data("kendoGrid").dataSource._filter == undefined) {
        vcClarefCode = null;
    }
    else {
        var vcClarefCode = e.sender.element.data("kendoGrid").dataSource._filter.filters[0].value;
    }



    var layerpreselect = function (e) {

        var optionsmodel = {
            disable_properties: true,
            disable_edit_json: true,
            disable_collapse: true,
            iconlib: "bootstrap3",
            no_additional_properties: true,
            show_errors: 'always',
            schema: {
                title: getObjectText("selectatypetoproceed"),
                type: "object",
                properties: {

                    documentClass: {
                        type: "string",
                        title: getObjectText("claref")
                    },
                    documentType: {
                        type: "string",
                        title: getObjectText("detref")

                    }
                }
            }

        };
        var dataloader = new $.Deferred;

        requireConfig(function () {
            require(['JSONEditor'], function (JSONEditor) {
                //e.container.find(".k-tabstrip").hide();
                JSONEditor.defaults.options.theme = 'bootstrap3';
                var editor = new JSONEditor(e.container[0], optionsmodel);
                var classes = [];
                var types = [];

                e.model.set("LE_CLAREF_CODE", vcClarefCode);
                var rowdata = e.model;


                //var vcClareCode = e.model.
                $.ajax({
                    type: "POST",
                    url: "/api/MANAGEFK/CallFKStoredProcedure",
                    data: JSON.stringify({ storedprocedurename: "LE_USP_get_claref_for_user", schema: "core", textfield: "LE_CLAREF_DESCRIPTION", valuefield: "LE_CLAREF_ID", rowdata: JSON.stringify(rowdata) }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    error: function (err) { dataloader.resolve(); },
                    success: function (result) {
                        if (result.length > 0) {
                            $.each(result, function (i, v) {
                                classes.push({ LE_CLAREF_ID: parseInt(v.value), text: v.text });
                            });
                            $.ajax({
                                type: "POST",
                                url: "/api/MANAGEFK/CallFKStoredProcedure",
                                data: JSON.stringify({ storedprocedurename: "LE_USP_get_detref_for_user", schema: "core", textfield: "LE_DETREF_DESCRIPTION", valuefield: "LE_DETREF_ID", rowdata: JSON.stringify(rowdata) }),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                error: function (err) {
                                    dataloader.resolve();
                                },
                                success: function (result) {
                                    $.each(result, function (i, v) {
                                        types.push({
                                            value: v.LE_DETREF_ID,
                                            text: v.LE_DETREF_DESCRIPTION,
                                            LE_CLAREF_ID: v.LE_DETCLA_LE_CLAREF_ID
                                            //MagicBOLayer_ID: v.MagicBOLayer_ID
                                            //DO_TIPDOC_DO_STADOC_ID: v.DO_TIPDOC_DO_STADOC_ID
                                        });
                                    });
                                    dataloader.resolve();
                                }
                            });
                        }
                        else {
                            dataloader.resolve();
                        }
                    }
                });
                $.when(dataloader).then(function () {
                    e.container.find("[name$=\\[documentClass\\]]").attr("id", "parentdoc");
                    e.container.find("[name$=\\[documentClass\\]]").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "LE_CLAREF_ID",
                        dataSource: { data: classes }
                    });
                    e.container.find("[name$=\\[documentType\\]]").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: { data: types },
                        cascadeFrom: "parentdoc"
                    });
                    e.container.prev(".k-window-titlebar.k-header").after(e.container.find("div[data-schemaid=root]"));
                    e.container.closest('.k-window').show().animate({
                        'marginTop': "-=150px" //moves up
                    });

                    if (types.length > 0) {
                        e.container.parent().find(".well").append("<button id=\"btnlayerdoc\" class=\"k-button proceed\">" + getObjectText("proceed") + "</button>");

                        e.container.parent().find("#btnlayerdoc").click(function (el) {
                            var btnwindow = $(el.currentTarget).closest(".k-window");
                            var selclass = btnwindow.find("[name$=\\[documentClass\\]]").data("kendoDropDownList").value();
                            var seltype = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").value();

                            // var stadoc = btnwindow.find("[name$=\\[documentType\\]]").data("kendoDropDownList").dataItem().DO_TIPDOC_DO_STADOC_ID;

                            btnwindow.find("div[data-schemaid=root]").remove();
                            e.container.show().data("kendoWindow").center();
                            e.container.closest('.k-window').css('marginTop', 0);
                            e.model.LE_REFERE_LE_DETREF_ID = parseInt(seltype);
                            e.model.LE_REFCLA_CLAREF_ID = parseInt(selclass);

                            if (seltype)
                                //btnwindow.find("input[name=LE_REFCLA_CLAREF_ID]").attr("disabled");
                                //btnwindow.find("input[name=LE_REFERE_LE_DETREF_ID]").attr("disabled");

                                assignedtipdoc.resolve(e.model.LE_REFERE_LE_DETREF_ID);
                        });
                    }
                    else {
                        if (classes.length == 0)
                            kendoConsole.log(getObjectText("classesnotloaded"), true);
                        else
                            kendoConsole.log(getObjectText("typesnotloaded"), true);
                    }
                });
            });
        });
    }

    assignedtipdoc.resolve(e.LE_REFERE_LE_DETREF_ID);

    //if (!e.model.isNew())
    //    assignedtipdoc.resolve(e.LE_REFERE_LE_DETREF_ID);
    //else {
    //    e.container.hide();
    //    e.container.closest('.k-window').hide();
    //    layerpreselect(e);
    //}

    //eseguo la gestione std + gestione BOselector ed estensioni che deve avvenire quando conosco gia' il TIPDOC
    $.when(assignedtipdoc).then(function (detretId) {
        var selectDataBoundsPromises;
        selectDataBounds = getStandardEditFunction(e.sender, null, gridhtmlid, undefined);
    });
}

function editRefereXmlDetRef(e) {
    function appendUserFieldsAndInitKendo(options) {
        var htmlToAdd = options.htmlToAdd;
        var $tab;
        if (e.container.find(options.tabSelector).length) {

            $tab = e.container.find(options.tabSelector).find("div[class^=row]");
            $tab.append(htmlToAdd);
            kendo.init($tab.find("[iscustomerfield=true]")); kendo.bind($tab.find("[iscustomerfield=true]"), options.model);
        }
    }

    e = myGrid;

    var listOfXMLFieldsInPopUp = {};
    var defer = new $.Deferred(), htmlToAdd = "";

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.getDataSet({ rowData: e.model, gridName: e.sender.wrapper.attr("gridName") }, "USERFIELDS.Magic_GetGridUserColumnsVisible")
             .then(function (res) {
                 if (!res.length) {
                     if (res.status == 500 && res.responseText)
                         console.log(res.responseText);
                     defer.resolve();
                 }
                 var selectors = {};
                 var vtabs = {};
                 $.each(res[0], function (i, v) {
                     //if "UserTabToAppend" from stored procedure has value the a new tab is inserted and the tabselector is ignored 
                     listOfXMLFieldsInPopUp[v.fieldname] = true;
                     if (v.tabtoappend) {
                         var uta = JSON.parse(v.tabtoappend)[window.culture.substring(0, 2)];
                         if (!uta)
                             uta = JSON.parse(v.tabtoappend)["it"];
                         if (!vtabs[uta])
                             vtabs[uta] = [v.fieldname];
                         else
                             vtabs[uta].push(v.fieldname);
                     }
                         //look up for a tabselector
                     else if (v.tabselector) {
                         if (!selectors[v.tabselector])
                             selectors[v.tabselector] = [v.fieldname];
                         else
                             selectors[v.tabselector].push(v.fieldname);
                     }
                 });
                 var ktabstrip = e.container.find(".k-tabstrip").data("kendoTabStrip")
                 //append Vtabs into kendo tabstrip after the 1st 
                 var tabs = [];
                 var j = 2;
                 var tclass = e.container.find("#tabstrippopup-1").find(".row:first").attr("class");
                 $.each(vtabs, function (k, v) {
                     tabs.push({ text: k, content: "<div class='{0}'/>".format(tclass) });
                     if (!selectors["#tabstrippopup-" + j.toString()])
                         selectors["#tabstrippopup-" + j.toString()] = v;
                     else
                         selectors["#tabstrippopup-" + j.toString()].push(v);
                     j++;
                 });
                 //append tabs to kendo
                 if (ktabstrip)
                     ktabstrip.insertAfter(tabs, ktabstrip.tabGroup.children().eq(0));
                 $.each(selectors, function (k, v) {
                     var tabselector = k, fields = v;
                     htmlToAdd = "";
                     $.each(fields, function (i, value) {
                         if (e.model.fields[value] && e.model.fields[value].isCustomUserField)
                             if (e.container.find('[name="' + value + '"]').length == 0) {
                                 htmlToAdd += e.model.fields[value].popupHtml;
                             }
                     });
                     //kendo always generates lower case selectors while GUID in sql are uppercase...
                     appendUserFieldsAndInitKendo({ htmlToAdd: htmlToAdd, tabSelector: (tabselector ? tabselector : "").toLowerCase(), model: e.model });
                 });
                 defer.resolve(listOfXMLFieldsInPopUp);
             });
    });
}
 
 