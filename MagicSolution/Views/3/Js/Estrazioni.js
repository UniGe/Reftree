                                              function loadscript() {
    addHtmlElements();
    buildgrids();
//    $('.panel-heading span.clickable').trigger("click");

$(maingridsearchandfilter).hide();

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

    htmldivs[0] = htmlinnerdiv.format('12', 'Classi/Estrazioni/Impostazioni', 'grid2');    
    //htmldivs[1] = htmlinnerdiv.format('12', 'Relazioni tra oggetti db', 'grid5');



   var htmltoappend = htmlrow.format(htmldivs[0],"Estrazioni");
    $("#appcontainer").append(htmltoappend);

    //htmltoappend = htmlrow.format(htmldivs[1],"Relazioni");
    //$("#appcontainer").append(htmltoappend);

   
};

function buildgrids() {
    //   var grid1 = getrootgrid("DM_EXTRAC_extraction");
    //renderGrid(grid1, null, null, "grid1");
       var grid2 = getrootgrid("DM_CLAEXT_class_extraction");
    renderGrid(grid2, null, null, "grid2");


	//var grid3 = getrootgrid("DM_CLAOBJ_class_object");
    //renderGrid(grid3, null, null, "grid3");
    //	var grid4 = getrootgrid("DM_OBJECT_object_db");
    //renderGrid(grid4, null, null, "grid4");

    //    var grid5 = getrootgrid("DM_EXTREL_relation_object");
    //renderGrid(grid5, null, null, "grid5");



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

