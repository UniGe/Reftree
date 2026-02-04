function loadscript() {
    $("#appcontainer").prepend('<style>#extract-tree.closed button.btn{right: -30px;}#extract-tree button.btn{z-index: 10; position: absolute; top: 0; right: -5px;}#extract-row > div {transition: width 0.5s; position: relative;} #extract-tree.closed{width: 0; padding: 0;} #extract-tree.closed + div{width: 100%;padding-left: 40px;}</style>\
<div class="row" id="extract-row"><div class="col-md-3" id="extract-tree"><button onclick="$(this).parent().toggleClass(\'closed\'); $(this).find(\'span\').toggleClass(\'fa-chevron-right\')" class="btn"><span class="fa fa-chevron-left"></span></button></div><div class="col-md-9"><div id="grid"></div></div></div>');
    getrootAndRenderDBTree({
        name: "DM_USP_GetExtract_Tree",
        treecontainer: "#extract-tree",
        showtreedescription:false,
        callback: function () {
            var $tree = $("#extract-tree [data-role=treeview]");
            $tree.data("kendoTreeView").collapse($tree.find("[role=group] [role=group] > li"));
        }
    });
}


function onExtracSelection(e) {
    var tree = e.sender,
        jqdata = tree.findByUid($(e.node).attr("data-uid")),
        data = tree.dataItem(jqdata);
    if (data.type != "EXTRAC")
        e.preventDefault();
    else {
        //vado a chiedere al db se dopo il salvataggio (senza errori) di questa actionid / subactionid (eventuale) ci sia un nuovo form da aprire. Mi fermo se viene tornato un empty recordset
        requireConfigAndMore(["MagicSDK"], function (MF) {
            //your code here
            var options = getDefaultGridSettings();
            options.dataSource = MF.kendo.getStoredProcedureDataSource("core.DM_SP_EXTRACT_RUN", { data: { DM_EXTRAC_ID: data.assetid } });
            options.toolbar = [{
                template: buildToolbarButtons("PdfExport", "k-button-icontext k-grid-pdf", "PdfExport", "(function(){})", "none", "<span class=\'k-icon k-i-pdf\'></span>")
            }, {
                name: "excel",
                text: getObjectText("XlsExport")
            }];
            options.dataBound = function (e) {
                $.each(e.sender.columns, function (k, v) {
                    e.sender.columns[k].title = v.field.replace(/_/g, ' ');
                });
            }
            $("#extract-tree button.btn").trigger("click");
            $("#grid").kendoGrid(options);
        });
    }
}