function loadscript() {
    var gridobj = getrootgrid("AS_TIPSAS_specifica_asset");
    renderGrid(gridobj, null);
}

//function refresh_click(e) {    
//    e.preventDefault();
//    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
//    refresh(dataItem.AS_TIPSAS_ID,dataItem.AS_TIPSAS_TABELLA);
//}

//function refresh(id,nometabella) {
//    if (nometabella === null) {
//        kendoConsole.log("Nome di tabella DB obbligatorio", true);
//        return;
//    }
//    alert(nometabella);
//    $.ajax({
//        async: false,
//        type: "POST",
//        url: "/api/AS_TIPSAS_SPECIFICA_ASSET/Refresh_AS_CAMASS/",
//        data: JSON.stringify({ id: id, nometabella: nometabella }),
//        contentType: "application/json; charset=utf-8",
//        dataType: "json",
//        success: function (result) {
//            kendoConsole.log("Aggiornamento eseguito correttamente.", false);
//            var grid = $("#grid").data("kendoGrid");
//            grid.dataSource.read();

//        },
//        error: function (result) {
//            kendoConsole.log("Aggiornamento fallito.", true);
//        }
//    });
//}

