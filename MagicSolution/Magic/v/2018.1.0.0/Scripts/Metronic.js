/// <reference path="Metronic.js" />


function getbreadcrumbs(menuid) {
    var bread = $.ajax({
        type: "GET",
        async: false,
        url: "/api/MenuMetronic/GetBreadCrumbs/" + menuid,                                
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    });
    $("ul#breadcrumb > li:not(:first)").remove();  //per non rimuovere le action  
    $("#breadcrumb").append(bread.responseJSON.breadcrumbs);
};



function risettaDimensioni() {
    var content = $('.page-content');
    var sidebar = $('.page-sidebar');
    var body = $('body');
    var height;

    if (body.hasClass("page-footer-fixed") === true && body.hasClass("page-sidebar-fixed") === false) {
        var available_height = $(window).height() - $('.footer').outerHeight();
        //inizio codice ILOS
        if (sidebar.height() > available_height) {
            available_height = sidebar.height()
        }
        //inizio codice ILOS
        if (content.height() < available_height) {
            content.attr('style', 'min-height:' + available_height + 'px !important');
        }
    } else {
        if (body.hasClass('page-sidebar-fixed')) {
            height = _calculateFixedSidebarViewportHeight();
        } else {
            height = sidebar.height() + 20;
        }
        if (height >= content.height()) {
            content.attr('style', 'min-height:' + height + 'px !important');
        }
    }
}

function genericMenuClick(functionid, menuid) {

    //MenuDataManager.js
    genericMenuClickHeader(functionid,menuid);
    getbreadcrumbs(menuid);
    //Metroniconly
    risettaDimensioni();
}

function generateSideMenu() {
    //Appendo a #sidemenu della master page di metronic il menu com e da Database
    appendMenuToDom(template, function () {
        $("#sidemenu li.openpage").click(function () {
            $("#sidemenu li.openpage").removeClass("active"); //Rimozione della classe "active" su tutti i punti 
            $(this).addClass("active"); //Class solo sul punto selezionato
            $(this).find("a").append("<span class=\"selected\"/>");
        });
    });
}

function genericMenuClickManageTitle(title, description) {
    $("#spansmall").text(description);
    $("#spanbig").text(title);
}
