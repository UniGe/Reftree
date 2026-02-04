function loadscript() {
    addHtmlElements();
    buildgrids();
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
    htmldivs[0] = htmlinnerdiv.format('6', 'Livelli di urgenza', 'grid1');
    htmldivs[1] = htmlinnerdiv.format('6', 'Definizione commesse', 'grid2');
    htmldivs[2] = htmlinnerdiv.format('12', 'Elenco servizi', 'grid3');
    htmldivs[3] = htmlinnerdiv.format('12', 'Gestione attività', 'grid4');
    htmldivs[4] = htmlinnerdiv.format('12', 'Classificazione servizi', 'grid5');
    htmldivs[5] = htmlinnerdiv.format('12', 'Oggetti del ticket', 'grid6');
    htmldivs[6] = htmlinnerdiv.format('12', 'Descrizione problematiche suggerite', 'grid7');


    var htmltoappend = htmlrow.format(htmldivs[0] + htmldivs[1], "Definizione livelli di urgenza e commesse");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[4] +htmldivs[2], "Elenco servizi");
    $("#appcontainer").append(htmltoappend);
    //htmltoappend = htmlrow.format(htmldivs[2], "Elenco servizi");
    //$("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[3], "Gestione attività");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[5], "Oggetti del ticket");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[6], "Descrizione problematiche suggerite");
    $("#appcontainer").append(htmltoappend);
};


function buildgrids() {

    var grid1 = getrootgrid("TK_URGENC_urgency");
    renderGrid(grid1, null, null, "grid1");

    var grid2 = getrootgrid("TK_GENCON_general_contract");
    renderGrid(grid2, null, null, "grid2");

    var grid5 = getrootgrid("TK_GENSER_gen_servic");
    renderGrid(grid5, null, null, "grid5");

    var grid3 = getrootgrid("TK_SERVIC_service");
    renderGrid(grid3, null, null, "grid3");

    var grid4 = getrootgrid("TK_ACTIVI_activity");
    renderGrid(grid4, null, null, "grid4");

    var grid6 = getrootgrid("TK_TYPOBJ_type_object");
    renderGrid(grid6, null, null, "grid6");

    var grid7 = getrootgrid("TK_DESSUG_description_suggestions");
    renderGrid(grid7, null, null, "grid7");



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