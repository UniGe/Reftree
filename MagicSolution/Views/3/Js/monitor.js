//Sezione debug in caso di js legato a /views/elaborazioni.aspx
//$(document).ready(function () {
//    loadscript();
//});

function loadscript() {
    apply_style("/Views/3/Styles/monitor.css");  //applica css
    create_elements();  // crea elementi del dom
    getTabStrip();
    var gridobj = getrootgrid("JO_JOBEVE_jobs");
    gridobj.dataSource.filter = { field: "JO_JOBEVE_ID", operator: "eq", value: 0 };
    gridobj.dataSource.sort = { "field": "JO_JOBEVE_START_DATE", "dir": "desc" };
    gridobj.toolbar = kendo.template($("#template").html());
    renderGrid(gridobj, null);
};

function create_elements() {
    $("#appcontainer").append("<div id='tabstripcontainer' class='k-content' style='background-color: transparent;'></div>");  // il tabstrip
    $("#grid").remove();
    $("#appcontainer").append("<div id='gridtitle'><p class='gridtitle'>Elaborazioni attive</p></div>");   // titolo delle griglia sotto il tabstrip
    $("#appcontainer").append("<div id='grid'></div>");   // griglia kendo con elaborazioni attive    
    $("#appcontainer").append("<div id='popupwindow' class='k-popup-edit-form k-window-content k-content'></div>");  // kendowindow per inserimento dati
    $("#appcontainer").prop("JO_TIPJOB_ID", 0);  // proprieta custom per gestire il tipjob selezionato
    // $("#appcontainer").append("<div id='modalelab'><div id='gridelab'></div></div>");   // form modale per gestione dati elaborati  
}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}

function getTabStrip() {
    $("#tabstripcontainer").empty();
    $.ajax({
        async: false,
        type: "POST",
        url: manageAsyncCallsUrl(false, "/api/Elaborazioni/GetTabStrip/"),
        //data: JSON.stringify({ id: id, nometabella: nometabella }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            $("#tabstripcontainer").append($.parseHTML(result));
        },
        error: function (result) {
            kendoConsole.log(getObjectText("Errore_nel_reperimento_dei_dati_per_la_UI."), true);
        }
    });

    var ts = $("#tabstrip").kendoTabStrip({
        animation: { open: { effects: "fadeIn" } }
    }).data('kendoTabStrip');
    setTimeout(function () {
        ts.reload($('#tabstrip li:last'));
    });

    $("#tabstrip ul li").click(function () {
        var grid = $("#grid").data("kendoGrid");
        grid.dataSource.filter({ field: "JO_JOBEVE_ID", operator: "eq", value: 0 });
        $("#appcontainer").prop("JO_TIPJOB_ID", 0);
    });
}

function refreshgrid(event, JO_TIPJOB_ID, rights) {

    var upd = rights.split("|")[1];
    if (upd == 0)
        $("#but_new_grid").hide();
    else
        $("#but_new_grid").show();
    var grid = $("#grid").data("kendoGrid");
    grid.dataSource.filter({ logic: "and", filters: [{ field: "JO_JOBEVE_JO_TIPJOB_ID", operator: "eq", value: JO_TIPJOB_ID }, { field: "JO_JOBEVE_END_DATE", operator: "eq", value: null }] });
    $("#appcontainer").prop("JO_TIPJOB_ID", JO_TIPJOB_ID);

    $(".subarea").children().removeClass("k-state-focused");
    event.currentTarget.className += " k-state-focused";
}


function new_elab() {
    if (($("#appcontainer").prop("JO_TIPJOB_ID") == null) || ($("#appcontainer").prop("JO_TIPJOB_ID") == 0)) {
        kendoConsole.log(getObjectText("Selezionare_una_tipologia_di_elaborazione"), true);
        return;
    };
    get_elabform(null, true);
}

function get_elabform(dataItem, isfirststep) {

    function showFormContentInModal(gridName, groupsData, JO_JOBANA_ID, itemsPerRow) {
        var element = getAngularControllerRootHTMLElement("JO_JOBANA", true);
        var $modalContent = showModal({
            title: '<i class="fa fa-cog"></i>',
            content: element,//'<div id="row-reader" ng-controller="RowReaderController as rr" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/RowReader.html\'">' + largeSpinnerHTML + '</div>'
            wide: true
        });
        initAngularController(element, "JO_JOBANAController", { JO_JOBANA_ID: JO_JOBANA_ID, groupsData: groupsData, rowData: null, gridName: gridName, itemsPerRow: itemsPerRow, layerID: null, isfirststep: isfirststep }, undefined, true);
    }

    var JO_TIPJOB_ID = $("#appcontainer").prop("JO_TIPJOB_ID");
    var JO_JOBANA_ID = isfirststep ? null : dataItem.JO_JOBANA_ID;
    var JO_JOBANA_JO_EXEORD_ID = isfirststep ? null : dataItem.JO_JOBANA_JO_EXEORD_ID;

    var defer1 = new $.Deferred();
    var defer2 = new $.Deferred();
    $.ajax({    //#mfapireplaced
        url: "/api/MF_API/GetJO_EXEORD_execution_order",
        type: "POST",
        data: JSON.stringify({
            JO_EXEORD_JO_TIPJOB_ID: "" + JO_TIPJOB_ID
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            var gridname = "";
            if (res.Count > 0) {
                if (isfirststep)
                    gridname = res.Data[0].Table[0].JO_EXEORD_ID.toString();
                else
                    gridname = JO_JOBANA_JO_EXEORD_ID.toString();
                defer1.resolve(gridname);
            }
            else {
                var data = {};
                data.id = $("#appcontainer").prop("JO_TIPJOB_ID");
                data.JO_JOBANA_ID = JO_JOBANA_ID;
                data.inputdata = [];
                runjob(data, isfirststep, false);
                kendoConsole.log(getObjectText("Elaborazione_avviata_senza_dati_di_input"), false);
                defer1.resolve(null);
            }
        },
        error: function (res) {
            console.log("error on retrieving job input data");
        }
    });

    $.get("/api/Elaborazioni/GetGroups", null, function (res) {
        defer2.resolve(res);
    });

    $.when(defer1, defer2).then(function (gridName, res) {
        if (gridName != null)
            showFormContentInModal(gridName, res, JO_JOBANA_ID, 2);
    });
}
function step_assign(e) {
    e.preventDefault();
    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
    //var JO_ANAPRO_JO_PROARE_ID = dataItem.JO_ANAPRO_JO_PROARE_ID
    $.ajax({
        async: false,
        type: "POST",
        url: manageAsyncCallsUrl(false,"/api/Elaborazioni/SaveJobanaProare"),
        data: JSON.stringify(dataItem),
        contentType: "application/json; charset=utf-8",
        dataType: "text",
        success: function (result) {
            kendoConsole.log(getObjectText("Processo_assegnato_correttamente"), false);

        },
        error: function (result) {
            kendoConsole.log(getObjectText("Errore_nell_assegnamento_del_processo"), true);
        }
    });
    var grid = $(e.currentTarget).closest(".k-grid").data("kendoGrid");
    grid.dataSource.read();
}

function step_next(e) {
    e.preventDefault();
    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
    if (dataItem.FLAG_JOBINP == false)
           runjob(dataItem, false, false);
        else
           get_elabform(dataItem, false);
}

function open_jobrec(e) {
    e.preventDefault();
    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

    $("#wndmodalContainer").addClass("modal-wide");
    $(".modal-title").text(getObjectText("RecordElaborati"));
    $("#contentofmodal").empty();
    $("#contentofmodal").append('<div id="gridelab"></div>');
    $("#executesave").unbind("click");
    $("#executesave").hide();
    $("#wndmodalContainer").modal('toggle');

    var grid = $("#gridelab").data("kendoGrid");
    if (grid != undefined) {
        grid.destroy();
    }

    buildgrid(dataItem.JO_EXEORD_VIEW_POST, dataItem.JO_JOBANA_ID);
};

//#region 'popup jobrec'
function buildgrid(viewname, JO_JOBANA_ID) {
    var dataSource = {
        transport: {
            read: { url: "/api/GENERICSQLCOMMAND/Select", type: "POST", contentType: "application/json" },
            update: { url: function (e) { return "/api/Elaborazioni/UpdateJOBREC/" + e.JO_JOBREC_ID }, type: "POST", contentType: "application/json", dataType: "json" },
            create: { url: "/api/Elaborazioni/UpdateJOBREC", type: "POST", contentType: "application/json", dataType: "json" },
            destroy: { url: "/api/Elaborazioni/UpdateJOBREC", type: "POST", contentType: "application/json", dataType: "json" },
            parameterMap: function (options, operation) {
                options.layerID = null;
                options.EntityName = viewname;
                options.functionID = 0;
                options.operation = "read";
                options.Model = "";
                options.DataSourceCustomParam = '{ read:{ Type:"StoredProcedure", Definition:"dbo.Magic_XMLCommands_usp_sel_stmt"}}'
                options.Columns = [];
                return kendo.stringify(options)
            },
        },
        requestEnd: function (e) {
            if (e.type != "read") {
                kendoConsole.log(e.response.message, false);
            }
        },
        error: function (e) {
            kendoConsole.log(e.responseText, true);
        },
        batch: false,
        pageSize: 5,
        serverPaging: true,
        serverSorting: true,
        filter: { field: "JO_JOBANA_ID", operator: "eq", value: JO_JOBANA_ID },
        serverFiltering: true,
        autoSync: false,
        schema: {
            model: { id: "JO_JOBREC_ID", fields: {} },
            parse: function (response) {
                if (response.Data != null)
                    if (response.Data.length >= 1)
                        if (response.Data[0].Table != undefined) {
                            return { Data: response.Data[0].Table, Errors: response.Errors, Count: response.Count };
                        }
                return response;
            },
            data: "Data",
            errors: "Errors",
            total: "Count"
        }
    };

    var datasource = new kendo.data.DataSource(dataSource);
    datasource.read();

    datasource.one("change", function (e) {
        var columns = [];
        if (datasource._data.length > 0) {
            var item = this.data()[0].toJSON();

            var fields = '{';
            for (var field in item) {
                if (field.indexOf("JO_JOBREC_SELECTED") > -1) {
                    columns.push({ field: field, title: "Seleziona" });
                    fields += field + ': {editable: true, type: "boolean"},'
                }
                else if (field.indexOf("_ID") == -1) {
                    columns.push({ field: field });
                    fields += field + ': {editable: false},'
                }
            };
            fields = fields.slice(0, -1) + '}';
            //columns[0].template = "<input type='checkbox' #= JO_JOBREC_SELECTED ? 'checked=checked' : '' # disabled='disabled' ></input>";
            columns[0].template = '<input type="checkbox" onclick="checkboxClicked(this,\'JO_JOBREC_SELECTED\')" #= JO_JOBREC_SELECTED ? "checked=checked" : "" # ></input>'
            columns[0].headerTemplate = "<input type='checkbox' id='masterCheckBox' onclick='checkAll(this)'/>"
            columns[0].sortable = false;
            columns[0].filterable = false;
            columns[0].width = '40px';
            eval('dataSource.schema.model.fields=' + fields);
        }

        $("#gridelab").kendoGrid({
            columnMenu: {
                messages: {
                    columns: getObjectText("columns"),
                    filter: getObjectText("filter"),
                    sortAscending: getObjectText("sortAsc"),
                    sortDescending: getObjectText("sortDesc"),
                    settings: getObjectText("settings"),
                    done: getObjectText("done"),
                    lock: getObjectText("lock"),
                    unlock: getObjectText("unlock"),
                }
            },
            dataSource: dataSource,
            columns: columns,
            pageable: {
                refresh: true,
                pageSize: 10,
                pageSizes: [10, 20, 50, 100],
                messages: {
                    display: getObjectText("showitems"),//"Showing {0}-{1} from {2} data items"
                    empty: getObjectText("nodataingrid"),
                    itemsPerPage: getObjectText("dataitemsperpage")
                }
            },
            filterable: setDefaultFilterSettings(),
            sortable: true,
            groupable: false,
            editable: true,
            navigatable: true,
            toolbar: [{ "name": "save", "text": getObjectText('Salva') }]
        });


    });

};

function checkAll(ele) {
    var state = $(ele).is(':checked');
    var grid = $('#gridelab').data().kendoGrid;
    $.each(grid.dataSource.view(), function () {
        if (this['JO_JOBREC_SELECTED'] != state)
            this.dirty = true;
        this['JO_JOBREC_SELECTED'] = state;
    });
    grid.refresh();
};



function editjobanagrid(e) {
    // disable edit of Proare if not applicable
    if (e.model.JO_ANAPRO_JO_PROARE_ID != 0) {
        e.sender.closeCell();
    }
}
function runjob(data, isfirststep, closeModal) {
    $.ajax({
        type: "POST",
        url: isfirststep ? "/api/Elaborazioni/RunFirstJob/" : "/api/Elaborazioni/RunJob/",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "text",
        success: function (result) {
            var grid = "";
            if (isfirststep) {
                // change del numero di elaborazioni attive tra ()
                var t = $(".subarea .k-state-focused")[0].innerHTML;
                var n = t.substring(t.indexOf("(") + 1, t.indexOf(")"));
                var nn = parseInt(n) + 1;
                $(".subarea .k-state-focused")[0].innerHTML = t.replace(n, nn);
                grid = $("#grid").data("kendoGrid");
            }
            else {
                grid = $("#JO_JOBANA_job_steps").data("kendoGrid");
            }
            grid.dataSource.read();
            kendoConsole.log(getObjectText("Processo_avviato_correttamente"), false);
            if (closeModal == true)
                $("#wndmodalContainer").modal("toggle");
        },
        error: function (result) {
            kendoConsole.log(getObjectText("Errore_nell_avvio_del_processo"), true);
        }
    });
}
//#endregion 
