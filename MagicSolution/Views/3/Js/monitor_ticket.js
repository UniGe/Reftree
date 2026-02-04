var typeField = "TK_TICKET_AS_ASSET_ID";

function loadscript() {
    requireConfigAndMore(["MagicMonitor"], function () {
        apply_style("/Views/3/Styles/monitor.css");  //applica css
        initMonitor("Elenco ticket", typeField, "core.TK_USP_GET_MONIT_TICKET", {
            procedureName: "core.TK_USP_GET_MONIT_STATUS",
			filterField: "TK_TICKET_TK_SERVIC_ID",
			entityName: "core.PL_V_ASSET_LIST",
            success: manageFilters,
            isPaging: true,
            addSearchInput: true
        });
        var gridobj = getrootgrid("TK_V_LIST_TICKET");
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

function manageFilters(response,opts,filter) {
    var columns = [];
    $.each(response.Data[0].Table[0], function (field, v) {
        switch (field) {
            case 'TK_TICKET_TK_SERVIC_ID':
            case 'TK_TICKET_AS_ASSET_ID':
                return;
            case 'Asset':
                columns.push({ field: field, filterable: true, title: "Asset", width: 300, template: '<a class="k-button data-item" onclick="selectCol(event)" >#: Asset  #</a>', lockable: false });
                break;
            case 'Totali':
                columns.push({ field: field, filterable: false, title: getObjectText(field), template: '<span class="data-item" data-status="all">#: Totali  #</span>', width: 100 });
                break;
            default:
                columns.push({ field: field, filterable: false, title: getObjectText(field.replace(/_/g, " ")), template: '<span class="data-item" data-status="' + field.replace(/ /g,"_") + '">#: ' + field + '  #</span>', width: 100 });
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