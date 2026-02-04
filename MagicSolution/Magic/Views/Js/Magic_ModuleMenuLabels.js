function loadscript() {
    var $grid = renderGrid(getrootgrid("v_Magic_ModMenuLabels"), null);
    initManageCultureDropdownFilter($grid, "Magic_CultureID");
}