var listofboids = [];
function loadscript() {
    create_elements();
}
function getbos()
{
    var objs =  $("#assetsautocomplete").bOSelector('getBOs');
    listofboids  = $.map(objs, function (v, i) {
        return v.Id;
    })
    console.log(listofboids);
    var ds = $("#grid").data("kendoGrid").dataSource;
    //passo alla stored (2o parametro) la lista degli id separata da ,
    ds.transport.parameterMap = overrideParameterMap("core.AS_STRUCT_structure", "core.usp_as_struct_get_all", { recordIds: listofboids.join() });
    $("#grid").data("kendoGrid").setDataSource(ds);

}
function create_elements() {
    apply_style("/Views/" + window.ApplicationCustomFolder + "/Styles/structures.css");
    $("#grid").remove();
    var htmlrow = "<div class='panel panel-default'>\
				                <div class='panel-heading'>\
					                <h3 class='panel-title'>Ricerca per asset di riferimento\
					                <span class='pull-right clickable'><i class='glyphicon glyphicon-chevron-up'></i></span>\
                                    </h3></div>\
				                    <div id='panelbody' class='panel-body'>\
                                    <div id='initialidiv'>\
                                                    <div id='assetsautocomplete' ></div>\
                                                    <button type='button' class='k-button' id='getstructdata' onclick='getbos();'>Filtra</button>\
                                                </div>\
                                        </div></div>";

    $("#appcontainer").append(htmlrow);
    $('#assetsautocomplete').bOSelector({ grid: false, filters: [1] ,multiselect:true,showLabel:false,isKendoForm:false});
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
    var griddiv = "<div id='grid'></div>";
    $("#appcontainer").append(griddiv);
    var gridobj = getrootgrid("AS_STRUCT_structure");
    renderGrid(gridobj,null,null,"grid");
}



