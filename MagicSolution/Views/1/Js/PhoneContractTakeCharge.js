function loadscript() {
    var grid1 = getrootgrid("PhoneContractWizard");
    //Set the filter to the non -visible column which represents the state
    grid1.dataSource.filter = {
        type: "customFilter", logic: 'AND', filters: [{ field: "T_PhoneContractStatus", operator: "eq", value: "COMPDATA", type: "customFilter" }]
    };
    renderGrid(grid1);
}