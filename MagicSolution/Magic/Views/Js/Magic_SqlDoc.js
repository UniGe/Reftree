function loadscript() {
    var grid = getrootgrid("V_Magic_SqlDoc");
    grid.dataSource.serverPaging = true;
    grid.dataSource.serverFiltering = true;
    grid.dataSource.serverSorting = true;
    var dropdata = $.ajax({
        async: false,
        type: "GET",
        url: "/api/v_magic_sqldoc/GetDbSchema/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (e) {
            grid.dataSource.filter = ({ field: "schemaname", operator: "eq", value: e[0].SCHEMA_NAME });
        }
    });

    renderGrid(grid, null, null);

    $("#Schema").kendoDropDownList({
        dataTextField: "SCHEMA_NAME",
        dataValueField: "SCHEMA_NAME",
        dataSource: JSON.parse(dropdata.responseText),
        change: function () {
            var value = this.value();
            if (value) {
                grid = $('#grid').data('kendoGrid');
                grid.dataSource.filter({ field: "schemaname", operator: "eq", value: value });
            }
        }
    });
}