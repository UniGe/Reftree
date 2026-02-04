function onModuleChange(e) {
    var Mmb_Menusdatasource = getdatasource("Magic_Mmb_Menus", "MenuLabel", "GetAllParentsOfModule/" + e.sender.value());
    var dropdown = $("#MAGIC_MMB_MENUSdd").data("kendoDropDownList");
    dropdown.setDataSource(Mmb_Menusdatasource);

}


function disableMenuDrop(e) {

    var ischecked = $(e).prop("checked");
    var dropdown = $("#MAGIC_MMB_MENUSdd").data("kendoDropDownList")
    if (ischecked) {
        dropdown.select(0);
        dropdown.enable(false);
    }
    else dropdown.enable(true);
}


function loadscript() {
    var gridobj = getrootgrid("Magic_Mmb_Menus");
    gridobj.sortable = {
        mode: "multiple",
        allowUnsort: true
    };
    //gridobj.dataBinding = function (e) {

    //    var grid = $("#grid").data('kendoGrid');
    //    var Mmb_Menusdatasource = getdatasource("Magic_Mmb_Menus", "MenuLabel", "GetAllParents");
    //    var Mmb_Menusvalues = getdroparray(Mmb_Menusdatasource, "MenuID", "MenuLabel");
    //    grid.columns.filter(function (item) {
    //        return item.field === "MenuParentID";
    //    }).forEach(function (item) {
    //        item.values = Mmb_Menusvalues;
    //    });
    //    grid.setOptions({ columns: grid.columns });

    //};
    gridobj.edit = function (e) {

        requiredCss(e.container);
        var Magic_Functionsds = getdatasource("Magic_Functions", "FunctionName", "GetAllFK");
        var dropdown1 = $("#Magic_Functionsdd").data("kendoDropDownList");
        dropdown1.setDataSource(Magic_Functionsds);
        dropdown1.value(e.model.FunctionID);

        var Magic_Mmb_Modulesds = getdatasource("Magic_Mmb_Modules", "ModuleName", "GetAll");
        var dropdown2 = $("#MAGIC_MMB_MODULESdd").data("kendoDropDownList");
        dropdown2.setDataSource(Magic_Mmb_Modulesds);
  
        dropdown2.value(e.model.Module_ID);

        var dropdown = $("#MAGIC_MMB_MENUSdd").data("kendoDropDownList");
        if (e.model.ModuleID === 0 || e.model.ModuleID === "") {
            var Mmb_Menusdatasource = getdatasource("Magic_Mmb_Menus", "MenuLabel", "GetAllParents");
            dropdown.setDataSource(Mmb_Menusdatasource);
        }
        else {
            var Mmb_Menusdatasource = getdatasource("Magic_Mmb_Menus", "MenuLabel", "GetAllParentsOfModule/" + (e.model.Module_ID == "" ? 0 : e.model.Module_ID));
            dropdown.setDataSource(Mmb_Menusdatasource);
        }
        if (e.model.MenuParentID)
            dropdown.value(e.model.MenuParentID);


        setEditContext("grid", e);
    };




    renderGrid(gridobj, null);
}

