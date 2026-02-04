function loadscript() {
    addHtmlElements();
    buildgrids();
	$('.panel-heading span.clickable').trigger("click");
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
    htmldivs[0] = htmlinnerdiv.format('6', 'Definizione Campi', 'grid1');
    htmldivs[1] = htmlinnerdiv.format('12', 'Schede', 'grid2');
	htmldivs[2] = htmlinnerdiv.format('6', 'Raggruppamenti', 'grid3');

   
   
   var htmltoappend = htmlrow.format(htmldivs[0]+htmldivs[2],"Definizione Campi");    
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[1],"Schede");
    $("#appcontainer").append(htmltoappend);


   
};

function buildgrids() {
    var grid1 = getrootgrid("WF_FIENAM_Field_name");
    renderGrid(grid1, null, null, "grid1");

    var grid2 = getrootgrid("WF_FORM");
    renderGrid(grid2, null, null, "grid2");

	var grid3 = getrootgrid("WF_GROFIE_Group_field");
    renderGrid(grid3, null, null, "grid3");

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

