function loadscript() {
    addHtmlElements();
    buildgrids();
    //$('.panel-heading span.clickable').trigger("click");
};

function addHtmlElements() {
    $("#grid").remove();
    var htmlrow = "<div class='panel panel-default'>\
				                <div class='panel-heading panel-collapsed'>\
					                <h3 class='panel-title'>{1}\
					                <span class='pull-right clickable panel-collapsed'><i class='glyphicon glyphicon-chevron-down'></i></span>\
                                    </h3>\
				                </div>\
				                    <div class='panel-body' style='display:none;'>\
                                        <div class='row-fluid'>{0}</div>\
                                    </div>\
                                 </div>";
    var htmlinnerdiv = "<div class='col-md-{0}'>\
                                            <h3>{1}</h3>\
                                            <div id='{2}'>\
                        </div></div>";

    var htmldivs = [];
    htmldivs[0] = htmlinnerdiv.format('12', 'Stati del record', 'grid1');
    htmldivs[1] = htmlinnerdiv.format('12', 'Azioni', 'grid2');
    htmldivs[2] = htmlinnerdiv.format('12', 'Stati - Azioni', 'grid3');



    var htmltoappend = htmlrow.format(htmldivs[0], "Stati del record");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[1], "Azioni");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[2], "Stati - Azioni");
    $("#appcontainer").append(htmltoappend);


};

function buildgrids() {
    var grid1 = getrootgrid("EV_STACLA_stage_class");
    renderGrid(grid1, null, null, "grid1");

    var grid2 = getrootgrid("EV_ACTTYP_ACTION_TYPE");
    renderGrid(grid2, null, null, "grid2");

    var grid3 = getrootgrid("EV_ACTION_STAGE");
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


//if (grid.gridcode === "US_DEPROL_departments_role") {
//    grid.dataBinding = function () {
//        $(".k-grid-save-changes").each(function () {
//            $(this).one("click", refreshsubgrid_deprol);
//        });
//    };
//}