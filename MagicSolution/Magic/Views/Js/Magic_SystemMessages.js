function loadscript() {
    var $grid = renderGrid(getrootgrid("v_Magic_SystemMessages"), null);
    initManageCultureDropdownFilter($grid, "CultureId");
}