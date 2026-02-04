function loadscript() {
    var gridobj = getrootgrid("Magic_Functions");
    renderGrid(gridobj, null);
}
function detailInit(e) {
        var dsvaluesfunc = getdroparray(getdatasource("Magic_Functions", "FunctionName"), "FunctionID", "FunctionName");
        var dsvaluestmpl = getdroparray(getdatasource("Magic_Templates", "MagicTemplateName"), "MagicTemplateID", "MagicTemplateName");
        var dsvaluesgrids = getdroparray(getdatasource("Magic_Grids", "MagicGridName"), "MagicGridID", "MagicGridName");
        var dsvaluesds = getdroparray(getdatasource("Magic_DataSource", "Name"), "MagicDataSourceID", "Name");
            

        var gridcolumns = getrootgrid("Magic_FunctionsTemplates");
        gridcolumns.dataSource.filter = { field: "MagicFunction_ID", operator: "eq", value: e.data.FunctionID };
        gridcolumns.dataSource.schema.model.fields.ManualInsertion.editable = false;
        gridcolumns.dataSource.schema.model.fields.ManualInsertion.defaultValue = true;
        gridcolumns.dataSource.schema.model.fields.MagicFunction_ID.editable = false;
        gridcolumns.dataSource.schema.model.fields.MagicFunction_ID.defaultValue = e.data.FunctionID;
        gridcolumns.columns[getcolumnindex(gridcolumns.columns, "MagicFunction_ID")].hidden = true;
        gridcolumns.toolbar = [{ name: "create", text: getObjectText("create") }, { name: "save", text: getObjectText("save") }, { name: "cancel", text: getObjectText("cancel") }];
        gridcolumns.edit = function (e) { };
        //gridcolumns.editable.confirmation = "Cancel?";
        gridcolumns.columns[getcolumnindex(gridcolumns.columns, "MagicFunction_ID")].values = dsvaluesfunc;
        gridcolumns.columns[getcolumnindex(gridcolumns.columns, "MagicTemplate_ID")].values = dsvaluestmpl;


        var gridfuncs = getrootgrid("Magic_FunctionsGrids");
        gridfuncs.dataSource.filter = { field: "MagicFunction_ID", operator: "eq", value: e.data.FunctionID };
        gridfuncs.dataSource.schema.model.fields.MagicFunction_ID.editable = false;
        gridfuncs.dataSource.schema.model.fields.MagicFunction_ID.defaultValue = e.data.FunctionID;
        gridfuncs.columns[getcolumnindex(gridfuncs.columns, "MagicFunction_ID")].hidden = true;
        gridfuncs.toolbar = [{ name: "create", text: getObjectText("create") }, { name: "save", text: getObjectText("save") }, { name: "cancel", text: getObjectText("cancel") }];
        gridfuncs.edit = function (e) { };
        //gridcolumns.editable.confirmation = "Cancel?";
        gridfuncs.columns[getcolumnindex(gridfuncs.columns, "MagicFunction_ID")].values = dsvaluesfunc;
        gridfuncs.columns[getcolumnindex(gridfuncs.columns, "MagicGrid_ID")].values = dsvaluesgrids;

        var gridtrees = getrootgrid("Magic_FunctionTrees");
        gridtrees.dataSource.filter = { field: "MagicFunction_ID", operator: "eq", value: e.data.FunctionID };
        gridtrees.dataSource.schema.model.fields.MagicFunction_ID.editable = false;
        gridtrees.dataSource.schema.model.fields.MagicFunction_ID.defaultValue = e.data.FunctionID;
        gridtrees.columns[getcolumnindex(gridtrees.columns, "MagicFunction_ID")].hidden = true;
  
       
        var detailRow = e.detailRow;
        var tab = detailRow.find(".tabstrip").kendoTabStrip({
            animation: {
                open: { effects: "fadeIn" }
            },
            activate: function (e) {
                var grids = $($("div .tabstrip .k-grid"));
                for (var i = 0; i < grids.length; i++) {
                    $(grids[i]).data("kendoGrid").dataSource.read();
                }
            }
        });
 
        renderGrid(gridcolumns, "Templates", e.detailRow);
        renderGrid(gridfuncs, "Grids", e.detailRow);
        renderGrid(gridtrees, "Trees", e.detailRow);

    }