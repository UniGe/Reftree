/// <reference path="Metronic.js" />


function getbreadcrumbs(menuid) {
    $.ajax({
        type: "GET",
        async: false,
        url: "/api/MenuData/GetBreadCrumbs/" + menuid,
        contentType: "application/json; charset=utf-8",
        success: function (bread) {
            $(".breadcrumbs-alt").empty();
            var splittedbread = bread.split('|');
            for (var i = 0; i < splittedbread.length - 1; i++) {
                var aclass = "";
                if (i === splittedbread.length - 2)
                    aclass = "active";
                
                $(".breadcrumbs-alt").append('<li><a class="'+ aclass +'" href="javascript:void(0);">' + splittedbread[i] + '</a></li>');
            }
            setCookie("mid", menuid, 1);
        },
        error: function (errordata,errorxhr,errorpar) {
            console.log("bread error!");
        }
    });

};

function generateSideMenu() {

    //Appendo a #sidemenu della master page di metronic il menu com e da Database
    appendMenuToDom("nav-accordion", template);
    sessionStorage.SideMenuDomID = "nav-accordion";
    $("#main-menu li.openpage").click(function () {
        $("#main-menu li.openpage").removeClass("active"); //Rimozione della classe "active" su tutti i punti 
        $(this).addClass("active"); //Class solo sul punto selezionato
        $(this).find("a").append("<span class=\"selected\"/>");
    });

    if (isPostbackPage()) {
        openmenu();
    }
}

function genericMenuClick(functionid, menuid) {

    //MenuDataManager.js
    var func = genericMenuClickHeader(functionid, menuid);

    //#region metroniconly
    getbreadcrumbs(menuid);

    //#endregion

}

function genericMenuClickManageTitle(title, description) {
    $(".page-title").remove();
    $(".page-header").empty();
  //  $(".breadcrumbs-alt").after(('<h3 class="page-header">{0} :: {1}</h3>').format(title, description));
   
}


