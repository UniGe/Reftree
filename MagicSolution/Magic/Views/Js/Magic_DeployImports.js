function loadscript()
{
    requireConfigAndMore(["MagicSDK"], function (MF) { //remove?
        var obj = getrootgrid("Magic_Deploy_Imports");
        pushCustomGroupToolbarButton(obj, [//downloadtemplates["downloadmaintenanceplan"], downloadtemplates["downloadmaintenancemanual"],
            '<a onclick="showImportableGrids(this);" class="k-button k-button-icontext">\
                     <span class="fa fa-th" aria-hidden="true"></span> ' + getObjectText("partialgridimport") + '</a>'], "Partial import");
        var origdatabaound = obj.dataBound;
        obj.dataBound = function (e) {
            origdatabaound.call(this, e);
            var items = this._data;
            var tableRows = $(this.table).find("tr");
            tableRows.each(function (index) {
                var row = $(this);
                var Item = items[index];
                //console.log(Item);
                if (Item.Candidate == 1) {
                    row.css("background-color", "#66CCFF");
                    $("#grid").find(".btn-group").attr("candidateId", Item.Id);
                }
                if (Item.ImportedHelp == true && Item.ImportedSQL == true && Item.ImportedOverrides == true)
                    row.css("background-color", "#B8B8B8");
            });
        }
        renderGrid(obj);
    });
}

function import_selected_grids() {
    var grid = $("#gridstoimport___").data("kendoGrid")
    var selected = grid.select();

    if (!selected || !selected.length) {
        kendoConsole.log(getObjectText("selectatleastone"));
        return;
    }
    doModal(true);
    var selectedgrids = $.map(selected, function (v, i) { return grid.dataItem(v) });

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Deploy.Magic_Deploy_Import_GridsPartial", data: { models: selectedgrids } }).then(function (imported) {
            kendoConsole.log(imported[0][0].result, false);
            $("#wndmodalContainer").modal("hide");
            doModal(false);
        }, function (err) {
            doModal(false);
        })
    });
    

}
function showImportableGrids(e)
{
    $.ajax({ //#mfapireplaced
        type: "GET",
        url: "/api/MAGIC_GRIDS/GetImportableGrids",
        error: function (err) { console.log(err.responseText) }
    }).then(function (res) {
        var grids = res.Data[0].Table;
        setTimeout(function () { $container.find("p").remove(); });
        var gridselectionoptions =
            {
                dataSource: grids,
                toolbar: [
                    {
                        template: '<a class="k-button" href="\\#" onclick="import_selected_grids()">Import</a>'
                    }
                ],
                editable:false,
                sortable: true,
                filterable:true,
                selectable:"multiple,row",
                pageable: {
                    refresh: true,
                    pageSizes: true,
                    buttonCount: 10,
                    pageSize:20
                },
                columns:
                [
                    {
                    field: "MagicGridName",
                    title: "Name"
                    },
                    {
                        field: "GUID",
                        title: "GUID"
                    },
                    {
                        field: "FromTable",
                        title:"From table"
                    }
                ]
            };
        var $container = cleanModal();
        var $modal = $("#wndmodalContainer");
        $modal.addClass("modal-wide");
        $container.html(largeSpinnerHTML);
        $modal.find("h4.modal-title").text(getObjectText("partialgridimport"));
        $modal.modal('show');
        if ($("#gridshowactions").data("kendoGrid")) {
            $("#gridshowactions").data("kendoGrid").destroy();
            $("#gridshowactions").remove();
        }
        $container.append('<div class="row"><div id="gridstoimport___"></div></div>');
        $("#gridstoimport___").kendoGrid(gridselectionoptions)
            
    });

}

function importConfigs(e)
{
    console.log(e);
    var id = $(e).attr("id");
    var attrs = toolbarbuttonattributes[id];
    var data = { ImportID: $("#grid").find(".btn-group").attr("candidateId"), ImportHelp: false, ImportSQL: false, ImportOverrides: false };
    switch (JSON.parse(attrs.jsonpayload).type)
    {
        //case "HELP":
        //    data.ImportHelp = true;
        //    break;
        //case "OVERRIDES":
        //    data.ImportOverrides = true;
        //    break;
        //case "ALL":
        //    data.ImportOverrides = true;
        //    data.ImportHelp = true;
        //    data.ImportSQL = true;
        //    break;
        case "SQL":
            data.ImportSQL = true;
            break;
        default:
            break;
    }
	
    buildmodal(data, JSON.parse(attrs.jsonpayload).type);

}

function buildmodal(data,title) {
    var schema = {
        type: "object",
        title: title,
		properties: {
			//commented in version 41 after migration to SQL , now help and overwrites are target data which can be optionally managed in the standard SQL deploy...
            //mongohelp: {
            //    type: "object",
            //    title: "Mongo Help",
            //    properties: {
            //        importmode: {
            //            title: getObjectText("importmode"),
            //            type: "string",
            //            enum: [
            //             getObjectText("Appendandrefreshonly"),
            //             getObjectText("Append/refreshanddestroymismatchondestination"),
            //            ],
            //            default: getObjectText("Appendandrefreshonly")
            //        }
            //    }
            //},
            //mongooverrides: {
            //    type: "object",
            //    title: "Mongo Grid Overrides",
            //    properties: {
            //        importmode: {
            //            title: getObjectText("importmode"),
            //            type: "string",
            //            enum: [
            //             getObjectText("Append/refreshanddestroymismatchondestination"),
            //            ],
            //            default: getObjectText("Append/refreshanddestroymismatchondestination")
            //        }
            //    }
            //},
            sql: {
                type: "object",
                title: "SQL database",
                properties: {
                    sqlmenu: {
                        title: getObjectText("importmenu"),
                        type: "string",
                        enum: [
                         getObjectText("importmenu"),
                         getObjectText("leavemenuunchanged"),
                        ],
                        default: getObjectText("importmenu")
                    },
                    sqlalign: {
                        title: getObjectText("aligncomplete"),
                        type: "boolean",
                        format: "checkbox",
                        default:false
                    }

                }
            }
        }
    }

    if (title != "ALL" && title != "SQL")
        delete schema.properties.sql;
    //if (title != "ALL" && title != "HELP")
    //    delete schema.properties.mongohelp;
    //if (title != "ALL" && title != "OVERRIDES")
    //    delete schema.properties.mongooverrides;



    var mapids = {};
    mapids[getObjectText("Appendandrefreshonly")] = false;
    mapids[getObjectText("Append/refreshanddestroymismatchondestination")] = true;
    mapids[getObjectText("importmenu")] = 1;
    mapids[getObjectText("leavemenuunchanged")] = 0;

    customizeModal({
        model: schema, title: "", save_fn: function (e, editor) {
            data.deleteMismatch = false;
            data.importMenu = 1;
            data.importWithIdentityInsert = false;
            //if (editor.getValue().mongohelp) {
            //    var mongohelpsel = editor.getValue().mongohelp.importmode;
            //    data.deleteMismatch = mapids[mongohelpsel];
            //}
            if (editor.getValue().sql) {
                var mongosqlsel = editor.getValue().sql.sqlmenu;
                var sqlalignsel = editor.getValue().sql.sqlalign;
                data.importMenu = mapids[mongosqlsel];
                data.importWithIdentityInsert = sqlalignsel;
            }
            doModal(true);
               // console.log(data);
                $.ajax({
                    url: "/api/MAGIC_DEPLOYS/ImportConfigurations", type: "POST", data: JSON.stringify(data), dataType: "JSON", contentType: "application/json; charset=utf-8",
                    timeout:300000, //5 minutes max
                    success: function (e) {
                        doModal(false);
                        kendoConsole.log(e.message, false);
                        $("#wndmodalContainer").modal('toggle');
                        $("#grid").data("kendoGrid").dataSource.read();
                    },
                    error: function (e) {
                        doModal(false);
                        $("#wndmodalContainer").modal('toggle');
                        kendoConsole.log(e.responseText, true);
                    }
                });
        }
    });
    $("#wndmodalContainer").modal('toggle');
    $("#executesave").text(getObjectText("confirmimport"));
}