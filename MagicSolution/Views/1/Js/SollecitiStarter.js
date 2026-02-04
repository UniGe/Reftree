function loadscript() {
    alert("here");    
    addHtmlElements();
    return;
    buildfunc();
};

function addHtmlElements() {
    $("#grid").remove();
    var htmlrow = "<div class='panel panel-default'>\
				                <div class='panel-heading'>\
					                <h3 class='panel-title'>{1}\
					                <span class='pull-right clickable'><i class='glyphicon glyphicon-chevron-up'></i></span>\
                                    </h3>\
				                </div>\
				                    <div class='panel-body'>\
                                        <div class='row-fluid'>{0}</div>\
                                    </div>\
                                 </div>";
    var htmlinnerdiv = "<div class='col-md-{0}'>\
                                            <h3>{1}</h3>\
                                            <div id='{2}'>\
                        </div></div>";

    var htmldivs = [];
    htmldivs[0] = htmlinnerdiv.format('12', '', 'creazsollecito');
    htmldivs[1] = htmlinnerdiv.format('12', 'Solleciti', 'grid');
 

    htmltoappend = htmlrow.format(htmldivs[0], "Creazione Solleciti");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[1], "Elenco completo");
    $("#appcontainer").append(htmltoappend);
};

function buildfunc() {
    var grid1 = getrootgrid("PM_V_PROSOL");
    renderGrid(grid1, null, null, "grid");

    $("#creazsollecito").append('<div class ="float:left;"><h3>Tipo sollecito</h3></div><div style="float:left;margin-left:5px;"><input id="solldd" name="solldd"/><button id="creasoll" style="width:100px;margin-left:5px;" class="k-primary">Crea</button></div>');
    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/GetWithFilter",
        data: JSON.stringify({ table: "dbo.T_TIPSOL_solleciti", order: "T_TIPSOL_DESCRIZIONE"}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) { //do something with the data in result  }
            var data = result.Data[0].Table;
            $("#solldd").kendoDropDownList({
                dataSource: data,
                dataTextField: "T_TIPSOL_DESCRIZIONE",
                dataValueField: "T_TIPSOL_ID"
            });

            $("#creasoll").kendoButton({
            });

            $("#creasoll").click(createsoll);

        }
    });


    $('.panel-heading span.clickable').on("click", function (e) {
        if ($(this).hasClass('panel-collapsed')) {
            // expand the panel
            $(this).parents('.panel').find('.panel-body').slideDown();
            $(this).removeClass('panel-collapsed');
            $(this).find('i').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
        }
        else {
            // collapse the panel
            $(this).parents('.panel').find('.panel-body').slideUp();
            $(this).addClass('panel-collapsed');
            $(this).find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
        }
    });

};

function createsoll(e)
{
    e.preventDefault();
    console.log("launching dbo.USPT_T_TIPSOL_CREA...");
    var dd = $("#solldd").data("kendoDropDownList");
    var rowdata =dd.dataItem();
    storedprocedurelauncher(rowdata, "dbo.USPT_T_TIPSOL_CREA", "XMLSTRING", "Solleciti creati",refreshgrid);
    
    return false;
    
}
function refreshgrid()
{
    $("#grid").data("kendoGrid").dataSource.read();
}