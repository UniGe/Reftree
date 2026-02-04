function loadscript() {
    var gridobj = getrootgrid("v_Magic_FunctionLabels");
    gridobj.dataSource.serverPaging = true;
    gridobj.dataSource.serverFiltering = true;
    gridobj.dataSource.serverSorting = true;
    var $grid = renderGrid(gridobj, null);
    initManageCultureDropdownFilter($grid, "FunctionCultureID");
}