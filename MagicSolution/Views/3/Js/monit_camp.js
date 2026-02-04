var typeField = "SI_PIAPLA_SI_CLASIT_ID";
var typField = "SI_CLASIT_ID";

function loadscript() {
    requireConfigAndMore(["MagicMonitor"], function () {
        apply_style("/Views/3/Styles/monitor.css");  //applica css
        initMonitor("Campagna censimento", typeField, "core.SI_USP_GET_MONIT_STACLA", {
            procedureName: "core.SI_USP_GET_MONIT_CLASIT",
            filterField: "EV_STAGE_EV_STACLA_ID",
            success: manageFilters
        });
        var gridobj = getrootgrid("SI_VI_PIANT_L_ACT_GR_ALL");
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
            case 'EV_STAGE_EV_STACLA_ID':
            case 'SI_CLASIT_ID':
                return;
            case 'SI_CLASIT_DESCRIPTION':
                columns.push({ field: field, title: "Classe", template: '<a class="k-button data-item" onclick="selectCol(event)" >#: SI_CLASIT_DESCRIPTION  #</a>', lockable: false });
                break;
           case 'Totale':
                columns.push({ field: field, title: field, template: '<span class="data-item" data-status="all">#: Totale  #</span>', width: 200 });
                break;
            case 'Inserito':
                columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item" data-doc="Inserito">#: Inserito  #</span>', width: 200 });
                break;
            case 'Validato':
                columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item"  data-doc="Validato">#: Validato  #</span>', width: 200 });
                break;
            case 'Assegnato':
                columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item"  data-doc="Assegnato">#: Assegnato  #</span>', width: 200 });
                break;
            case 'Concluso':
                columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item" data-doc="Concluso">#: Concluso  #</span>', width: 200 });
                break;
                // default:
                //     columns.push({ field: field, title: field.replace(/_/g, " "), template: '<span class="data-item" data-status="' + field + '">#: ' + field + '  #</span>', width: 300 });
                //     break;
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
                                field: "EV_STAGE_DESCRIPTION",
                                operator: "eq",
                                value: data.doc,
                            });
                            return false;
                        }
                    });

                    if (hasSelectedCell) {
                        rowFilter.filters[0].value = grid.dataSource.getByUid($row.data('uid'))[typField];
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