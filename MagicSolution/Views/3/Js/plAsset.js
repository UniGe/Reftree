//#region INIT
var treefuncpars = {
    explorefunc: "plassetselected",
    customfuncs: "plAssetmanagement",
    page: "/Views/3/Templates/PL_Asset.html",
    style: "/Views/3/Styles/assets.css",
    gridname: "PL_V_ASSET_LIST",
    entityname: "PL_V_ASSET_LIST",
    pk: "PL_ASSET_ID",
    pkfilter: function (editid) { return { field: "PL_ASSET_ID", operator: "eq", value: editid } },
    parentfilter: { field: "PL_ASSET_ASSET_ID_FATHER", operator: "eq", value: null },
    currentDbTree: "PL_USP_GetAsset"
};
//#endregion
function loadscript()
{
    require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
        require([treefuncpars.customfuncs],
            function () {
                $("#appcontainer").append("<div id='appsubcontainer'/>");
                $("#appsubcontainer").load(treefuncpars.page, createpage);
            });
    });
}
function createpage()
{
    apply_style(treefuncpars.style);  //applica css
    var grid = getrootgrid(treefuncpars.gridname);
    manageBtns(grid, treefuncpars.explorefunc);
    grid.dataSource.pageSize = 5;
    grid.dataSource.filter = treefuncpars.parentfilter;
    renderGrid(grid);
    //creo un window che ospita la griglia hidden che uso per fare il new ed l' edit su drop dei tipi 
    manageHiddenGridWnd();
    var gridobj = getrootgrid(treefuncpars.gridname, null, "derivativeassetgrid");
    gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
    gridobj.edit = editHiddenGridOverride;
    var kgrid = renderHiddenGrid(gridobj);
    kgrid.dataSource.bind("requestEnd", function (e) {
        if (e.type == "create")
        {
            console.log(e);
            var response = e.response.Data[0].Table[0];
            if (!response.PL_ASSET_ASSET_ID_FATHER)
            {
                var plassetid = response.PL_ASSET_ID;
                var plassetdescription = response.PL_ASSET_DESCRIPTION;
                buildPLTree(plassetdescription,plassetid);
            }
        }
    });
    initContainers();
}



