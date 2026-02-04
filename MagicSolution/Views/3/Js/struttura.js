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
    htmldivs[0] = htmlinnerdiv.format('6', 'Dipartimenti', 'grid1');
    htmldivs[1] = htmlinnerdiv.format('6', 'Ruoli', 'grid2');
    htmldivs[2] = htmlinnerdiv.format('12', 'Dipartimenti/Ruoli', 'grid3');
   // htmldivs[3] = htmlinnerdiv.format('6', 'Griglie --> Aree applicative', 'grid4');
   // htmldivs[4] = htmlinnerdiv.format('6', 'Funzioni --> Aree applicative', 'grid5');
   

    var htmltoappend = htmlrow.format(htmldivs[0]+htmldivs[1],"Dipartimenti e Ruoli");    
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[2], "Dipartimenti/ruoli e loro diritti");
    $("#appcontainer").append(htmltoappend);
  //  htmltoappend = htmlrow.format(htmldivs[3] + htmldivs[4], "Aree applicative e componenti UI");
   // $("#appcontainer").append(htmltoappend);
};

function buildgrids() {
    var grid1 = getrootgrid("US_DEPART_Departments");
    renderGrid(grid1, null, null, "grid1");

    var grid2 = getrootgrid("US_USEROL_User_role");
    renderGrid(grid2, null, null, "grid2");

    var grid3 = getrootgrid("Dipartimenti_Ruoli");
    renderGrid(grid3, null, null, "grid3");

 //   var grid4 = getrootgrid("V_US_MAGICGRIDS_griglie");
  //  renderGrid(grid4, null, null, "grid4");

  //  var grid5 = getrootgrid("V_US_MAGICFUNCTIONS");
 //   renderGrid(grid5, null, null, "grid5");

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