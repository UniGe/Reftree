function renderHiddenGrid(gridobj) {
    $(".derivativeassetgrid").kendoGrid(gridobj);
    var grid = $(".derivativeassetgrid").data("kendoGrid");
    grid.bind("save", function (e) {
        setTimeout(
            function (e) {
                $("#grid").data("kendoGrid").dataSource.read();
                refreshtree();
            }, 2000);
    });
    $(".derivativeassetgrid").attr("gridname", gridobj.gridcode);
    $(".derivativeassetgrid").attr("detailTemplateName", gridobj.detailTemplateName);
    $(".derivativeassetgrid").attr("editableName", gridobj.editableName);
    $(".derivativeassetgrid").attr("editablecolumnnumber", $("#grid").attr("editablecolumnnumber"));
    return grid;
}
function manageHiddenGridWnd() {
    $("#assetinsertupdatedatawindow").empty();
    $("#assetinsertupdatedatawindow").append('<div class="derivativeassetgrid" ></div>');
    $("#assetinsertupdatedatawindow")
                               .kendoWindow({
                                   title: "",
                                   modal: true,
                                   visible: false,
                                   resizable: false,
                                   width: "80%",
                                   position: { top: "15%", left: "10%" }
                               });
}
function dropgenerictargetOnDragEnter(e) {
    $($(e.draggable.hint)[0]).css('background-color', 'red');

}
function dropgenerictargetOnDragLeave(e) {
    $($(e.draggable.hint)[0]).css('background-color', '#ffffff');

}
function makegenericspandraggable(selector) {
    $.each($(selector), function (index, value) {
        $(value).kendoDraggable({
            hint: function () {
                return $(value).clone();
            }
        });

    });
}
//chiamata onDrop dei tipi
function editHiddenGrid(editid) {
    if (!editid) {
        window.DragAndDropFuncsAction = "create";
        $(".derivativeassetgrid").data("kendoGrid").addRow();
    }
    else {
        var defer = new $.Deferred;
        $(".derivativeassetgrid").data("kendoGrid").one("dataBound", function () {
            defer.resolve();
        })
        $(".derivativeassetgrid").data("kendoGrid").dataSource.filter(treefuncpars.pkfilter(editid));
        $.when(defer).then(function () {
            window.DragAndDropFuncsAction = "update";
            $(".derivativeassetgrid").data("kendoGrid").editRow($(".derivativeassetgrid tr:eq(1)"));
        });
    }
}
function manageBtns(grid, explorefunction,enable_edit) {
    if (grid.columns[0].command) //se la prima colonna contiene gia' comandi
    {
        var gridrights = getGridRights(treefuncpars.gridname);
        if (gridrights.usercanupdate == true && !enable_edit) { //da eseguire solo se l' utente ha diritti full (perche' se no i bottoni li toglie la getrootgrid)
            grid.columns[0].command = $.map(grid.columns[0].command, function (v) {
              //  if (v.type == "dataReader")
              if (v.name != "edit" && v.name!="destroy")  
                return v;
            });
        }
        grid.columns[0].command.push({ name: "explorebtn", text: "explore", click: window[explorefunction], iconClass: "k-icon k-i-custom" });

    }
}