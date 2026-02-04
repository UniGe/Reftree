function loadscript() {
    var $grid = renderGrid(getrootgrid("v_Magic_SystemMessagesRaw"), null);
    initManageCultureDropdownFilter($grid, "CultureId");
}