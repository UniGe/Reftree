function loadscript() {
    var grid1 = getrootgrid("PhoneContractWizard");
    var grid2 = getrootgrid("PhoneContractShipmentGroup");

    grid1.dataSource.filter = {
        type: "customFilter", logic: 'AND', filters: [{ field: "T_PhoneContractStatus_ID", operator: "eq", value: 5, type: "customFilter" }, ]
    };
    renderGrid(grid1, null, null, "grid1");
    renderGrid(grid2, null, null, "grid2");

    $("#grid1").before("<h3>Contratti</h3>");
    $("#grid2").before("<h3>Distinte</h3>");
}