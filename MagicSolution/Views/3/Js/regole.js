function loadscript() {
    addHtmlElements();
    buildgrids();
	//$('.panel-heading span.clickable').trigger("click");
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
    htmldivs[0] = htmlinnerdiv.format('12', 'Classi e tipi di regole', 'grid1');
    htmldivs[1] = htmlinnerdiv.format('12', 'Regole', 'grid2');

   
   
    var htmltoappend = htmlrow.format(htmldivs[0], "Classi e tipi di regole");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[1],"Regole");
    $("#appcontainer").append(htmltoappend);

   
};

function buildgrids() {
    var grid1 = getrootgrid("EV_RULCLA_RULES_CLASS");
    renderGrid(grid1, null, null, "grid1");

    var grid2 = getrootgrid("EV_RULCAT_RULES_CATALOG");
    renderGrid(grid2, null, null, "grid2");

    
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


//if (grid.gridcode === "US_DEPROL_departments_role") {
//    grid.dataBinding = function () {
//        $(".k-grid-save-changes").each(function () {
//            $(this).one("click", refreshsubgrid_deprol);
//        });
//    };
//}