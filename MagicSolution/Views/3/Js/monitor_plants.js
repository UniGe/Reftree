var typeField = "PL_ASSET_PL_TIPASS_ID";

function loadscript() {
    requireConfigAndMore(["MagicMonitor"], function () {
        apply_style("/Views/3/Styles/monitor.css");  //applica css
        initMonitor("Elenco impianti", typeField, "core.PL_USP_GET_MONIT_CLAAS", {
            procedureName: "core.PL_USP_GET_MONIT_TPSAS",
            filterField: "PL_TIPASS_CLAASS_ID",
			success: manageFilters,
			entityName:"core.PL_V_ASSET_LIST"
        });
        var gridobj = getrootgrid("PL_V_ASSET_LIST");
        gridobj.dataSource.filter = { field: typeField, operator: "eq", value: 0 };
        gridobj.dataSource.sort = { field: typeField, dir: "desc" };
        renderGrid(gridobj, null);
    })
};

console.log("passo");

function manageFilters(response) {
    var columns = [];
    $.each(response.Data[0].Table[0], function (field, v) {
        switch (field) {
            case 'PL_TIPASS_CLAASS_ID':
            case 'PL_ASSET_PL_TIPASS_ID':
                return;
            case 'PL_TIPASS_DESCRIPTION':
                columns.push({ field: field, title: "Tipologia", template: '<a class="k-button data-item" onclick="selectCol(event)" >#: PL_TIPASS_DESCRIPTION  #</a>', lockable: false });
                break;
            case 'Totale':
                columns.push({ field: field, title: field, template: '<span class="data-item" data-status="all">#: Totale  #</span>', width: 200 });
                break;
            case 'Impianti_privi_di_documenti':
                columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item" data-doc="PL_ASSET_NO_DOC">#: Impianti_privi_di_documenti  #</span>', width: 200 });
                break;
            case 'Impianti_con_documenti_in_scadenza':
                columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item" data-doc="PL_ASSET_SCA_DOC">#: Impianti_con_documenti_in_scadenza  #</span>', width: 200 });
                break;
            default:
                columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item" data-status="' + field + '">#: ' + field + '  #</span>', width: 300 });
                break;
        }
    });

    $("#gridtotals").kendoGrid({
        dataSource: response.Data[0].Table,
        columns: columns,
        pageable: false,
        selectable: "multiple cell",
        navigatable: false,
        filterable: false,
        sortable: true,
        groupable: false,
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
                            }
                        ],
                        logic: "and"
                    };
                    $('td.k-state-selected', $row).each(function () {
                        hasSelectedCell = true;
                        var data = $(this).find('.data-item').data();
                        if ("status" in data && data.status == "all") { // deselect other filters, if "all" is selected
                            $row.find('td.k-state-selected [data-doc]').closest('td').removeClass('k-state-selected');
                            return false;
                        } else if ("doc" in data) {
                            $row.find('td.k-state-selected [data-doc]:not([data-doc="' + data.doc + '"])').closest('td').removeClass('k-state-selected');
                            rowFilter.filters.push({
                                field: data.doc,
                                operator: "eq",
                                value: 1,
                            });
                            return false;
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
}