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
    // htmldivs[0] = htmlinnerdiv.format('6', 'Dipartimenti', 'grid1');
    //  htmldivs[1] = htmlinnerdiv.format('6', 'Ruoli', 'grid2');
    htmldivs[0] = htmlinnerdiv.format('12', 'Codici gara', 'grid1');
    htmldivs[1] = htmlinnerdiv.format('12', 'Tipologie gara', 'grid2');
    htmldivs[2] = htmlinnerdiv.format('12', 'Stati gara', 'grid3');
    htmldivs[3] = htmlinnerdiv.format('12', 'Tipologia richiedenti', 'grid4');
    htmldivs[4] = htmlinnerdiv.format('12', 'Cause annullamento', 'grid5');
    htmldivs[5] = htmlinnerdiv.format('12', 'Modalità invio offerte', 'grid6');
	htmldivs[6] = htmlinnerdiv.format('12', 'Modalità di assegnazione', 'grid7');
	htmldivs[7] = htmlinnerdiv.format('12', 'Attività', 'grid8');


    var htmltoappend = htmlrow.format(htmldivs[0], "Codici gara");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[1], "Tipologie gara");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[2], "Stati gara");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[3], "Tipologia richiedenti");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[4], "Cause annullamento");
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[5], "Modalità invio offerte");
    $("#appcontainer").append(htmltoappend);
	htmltoappend = htmlrow.format(htmldivs[6], "Modalità di assegnazione");
    $("#appcontainer").append(htmltoappend);
	htmltoappend = htmlrow.format(htmldivs[7], "Attività");
    $("#appcontainer").append(htmltoappend);
	
};

function buildgrids() {


    var grid1 = getrootgrid("TK_TIPCOD_type_code");
    renderGrid(grid1, null, null, "grid1");

    var grid2 = getrootgrid("TK_TIPTEN_type_tender");
    renderGrid(grid2, null, null, "grid2");

    var grid3 = getrootgrid("TK_V_STAGE_LIST");
    renderGrid(grid3, null, null, "grid3");

    var grid4 = getrootgrid("TK_TIPREQ_type_request");
    renderGrid(grid4, null, null, "grid4");

    var grid5 = getrootgrid("TK_SUSCAN_suspension_cancellation");
    renderGrid(grid5, null, null, "grid5");

    var grid6 = getrootgrid("LE_TIPSHI_type_shipping_method");
    renderGrid(grid6, null, null, "grid6");
	
	var grid7 = getrootgrid("TK_TIPASS_type_assigment");
    renderGrid(grid7, null, null, "grid7");
	
	var grid8 = getrootgrid("EV_V_RULCLA_NOAUTO_L");
    renderGrid(grid8, null, null, "grid8");


    $('.panel-heading span.clickable').parents('.panel').find('.panel-body').slideUp();
    $('.panel-heading span.clickable').addClass('panel-collapsed');
    $('.panel-heading span.clickable').find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');



 
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


 