function loadscript() {
    var $grid = renderGrid(getrootgrid("v_Magic_UIComponentsLabels"), null);
    initManageCultureDropdownFilter($grid, "Magic_CultureID");
}