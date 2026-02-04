var typeField = "FL_FILEST_FL_TIPFIL_ID";

function loadscript() {
    requireConfigAndMore(["MagicMonitor"], function () {
        apply_style("/Views/3/Styles/monitor.css");  //applica css
        initMonitor("Elenco File In/Out", typeField, "core.FL_USP_GET_MONIT_CLAFIL", {
            procedureName: "core.FL_USP_GET_MONIT_STATUS",
            filterField: "FL_CLAFIL_ID",
            success: manageFilters,
            isPaging: true,
            addSearchInput: false
        });
        var gridobj = getrootgrid("MONIT_FILOUT");
        gridobj.dataSource.filter = { field: typeField, operator: "eq", value: 0 };
        gridobj.dataSource.sort = { field: typeField, dir: "desc" };
        var origparmap = gridobj.dataSource.transport.parameterMap;
        gridobj.dataSource.transport.parameterMap = function (options,operations)
        {
            origparmap.call(this, options, operations);
            options.data = kendo.stringify({ classId: $("#grid").attr("tabSelClassId") });
            return kendo.stringify(options);
        }
        renderGrid(gridobj, null);
    })
};

//TODO: Aggiungere sezione visualizzazione griglia sulla base di stored lanciata

function selectColo(e) {    
    function showFormContentInModal(gridName, groupsData, FL_FILINP, itemsPerRow) {
        var element = getAngularControllerRootHTMLElement("FL_FILINP", true);
        var $modalContent = showModal({
            title: '<i class="fa fa-cog"></i>',
            content: element,
            wide: true
        });
        initAngularController(element, "FL_FILINPController", {FL_FILEST_FL_TIPFIL_ID: $(e.currentTarget).attr("data-id") }, null, true);
    }   
    var res = "";
    var gridName = 2;
    showFormContentInModal(gridName, res, 2, 2);
    //var $el = $(e.target),
    //    grid = $el.closest('[data-role=grid]').data('kendoGrid');
    //if (!e.ctrlKey)
    //    grid.clearSelection();
    //grid.select($el.closest('tr').find('[data-status=all]').closest('td'));
};


function manageFilters(response,opts,filter) {
    var columns = [];
    $.each(response.Data[0].Table[0], function (field, v) {
        switch (field) {
            case 'FL_FILEST_FL_TIPFIL_ID':
            case 'FL_CLAFIL_ID':            
                return;            
            case 'FL_TIPFIL_DESCRIPTION':
                columns.push({ field: field, filterable: true, title: "Tipo", width: 300, template: '<a data-id="#: FL_FILEST_FL_TIPFIL_ID #" class="k-button data-item" onclick="selectColo(event)" >#: FL_TIPFIL_DESCRIPTION  #</a>', lockable: false });
                break;
            case 'Totali':            
                columns.push({ field: field, filterable:false, title: field, template: '<span class="data-item" data-status="all">#: Totali  #</span>', width: 100 });
                break;
            default:
                columns.push({ field: field, filterable: false, title: field.replace(/_/g, " "), template: '<span class="data-item" data-status="' + field.replace(/ /g,"_") + '">#: ' + field + '  #</span>', width: 100 });
                break;
        }
    });
    opts.PageSize = 10;//pagino a 5
    var ds = getGenericSelectDataSource(opts);
   
    $("#gridtotals").kendoGrid({
        autoBind:false,
        dataSource:ds,
        columns: columns,
        selectable: "multiple cell",
        navigatable: true,
        filterable: setDefaultFilterSettings(),
        sortable: true,
        groupable: false,
        height: 340,   //aggiunta per avere never ending scroll
        scrollable: {
            virtual: true
        },
        change: function (e) {
            var selected = this.select();
            if (selected.length) {
                var grid = this,
                    hasSelectedCell,
                    $row,
                    rowFilter,
                    filter = { filters: [], logic: "or" };
                $('tr[data-uid]', grid.tbody).each(function () {
                    hasSelectedCell = false;
                    $row = $(this);
                    rowFilter = {
                        filters: [
                            {
                                field: typeField,
                                operator: "eq",
                                value: null,
                            },
                             {
                                 filters: [],
                                 logic: "or",
                                 type: "statusFilter"
                             }
                        ],
                        logic: "and"
                    };
                    $('td.k-state-selected', $row).each(function () {
                        hasSelectedCell = true;
                        var data = $(this).find('.data-item').data();
                        if ("status" in data) { // add to statusFilter
                            if (data.status == "all") {
                                rowFilter = removeFiltersByType(rowFilter, "statusFilter");
                                $row.find('td.k-state-selected [data-status]:not([data-status=all])').closest('td').removeClass('k-state-selected');
                            } else if (rowFilter.filters[1] && rowFilter.filters[1].type == "statusFilter") {
                                rowFilter.filters[1].filters.push({ field: "EV_STAGE_DESCRIPTION", operator: "eq", value: data.status })
                            }
                        }
                    });

                    if (hasSelectedCell) {
                        rowFilter.filters[0].value = grid.dataSource.getByUid($row.data('uid'))[typeField];
                        filter.filters.push(rowFilter);
                    }
                });

                //remove a filter level, if has only one filter
                if (filter.filters.length == 1)
                    filter = filter.filters[0];

                $("#grid").data("kendoGrid").dataSource.filter(filter);

            }
        }
    });
    ds.filter(filter);
}


function startcreatefile(e) {
    // Mettere wrapper di scelta campi basati su tabella FL_FILIMP

    var obj = { TIPFIL_ID: 0 };
    obj.TIPFIL_ID = 3;
    $.fileDownload('/api/InOutFile/GenerateFile/', { data: obj, httpMethod: "POST" });
}

function runexport(data, closeModal) {
    var obj = { TIPFIL_ID: 0, inputdata: null };
    obj.TIPFIL_ID = data.FL_FILEST_FL_TIPFIL_ID;
    obj.inputdata = data.inputdata;    
    $.fileDownload('/api/InOutFile/GenerateFile/', { data: { data: JSON.stringify(obj) }, httpMethod: "POST" });
    if (closeModal == true)
        $("#wndmodalContainer").modal("toggle");

    //$.ajax({
    //    type: "POST",
    //    url: isfirststep ? "/api/Elaborazioni/RunFirstJob/" : "/api/Elaborazioni/RunJob/",
    //    data: JSON.stringify(data),
    //    contentType: "application/json; charset=utf-8",
    //    dataType: "text",
    //    success: function (result) {
    //        var grid = "";
    //        if (isfirststep) {
    //            // change del numero di elaborazioni attive tra ()
    //            var t = $(".subarea .k-state-focused")[0].innerHTML;
    //            var n = t.substring(t.indexOf("(") + 1, t.indexOf(")"));
    //            var nn = parseInt(n) + 1;
    //            $(".subarea .k-state-focused")[0].innerHTML = t.replace(n, nn);
    //            grid = $("#grid").data("kendoGrid");
    //        }
    //        else {
    //            grid = $("#JO_JOBANA_job_steps").data("kendoGrid");
    //        }
    //        grid.dataSource.read();
    //        kendoConsole.log(getObjectText("Processo_avviato_correttamente"), false);
    //        if (closeModal == true)
    //            $("#wndmodalContainer").modal("toggle");
    //    },
    //    error: function (result) {
    //        kendoConsole.log(getObjectText("Errore_nell_avvio_del_processo"), true);
    //    }
    //});
}