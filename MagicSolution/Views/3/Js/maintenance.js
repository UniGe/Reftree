function loadscript()
{
   $("#appcontainer").append("<div id='appsubcontainer'/>");
    $("#appsubcontainer").load("/Views/3/Templates/AST_Maintenance.html",createpage); 
}
function createpage()
{
    sessionStorage.removeItem("assele");
    apply_style("/Views/3/Styles/assets.css");  //applica css
    var grid = getrootgrid("AS_ASSET_asset");
    grid.dataSource.pageSize = 5;
    renderGrid(grid);
    $("[gridname=AS_ASSET_asset]").attr("explore","components"); //serve per contestualizzare il click su explore sulla griglia degli asset 
}

