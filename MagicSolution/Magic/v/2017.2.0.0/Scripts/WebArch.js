/// <reference path="Metronic.js" />
//metodo usato nei cambi di menu per reinizializzarlo
function initMenu() {
  
    var handleSidenarAndContentHeight = function () {
        var content = $('.page-content');
        var sidebar = $('.page-sidebar');

        if (!content.attr("data-height")) {
            content.attr("data-height", content.height());
        }

        if (sidebar.height() > content.height()) {
            content.css("min-height", sidebar.height() + 120);
        } else {
            content.css("min-height", content.attr("data-height"));
        }
    }

    jQuery('.page-sidebar li > a').on('click', function (e) {
        if ($(this).next().hasClass('sub-menu') == false) {
            return;
        }
        var parent = $(this).parent().parent();

        parent.children('li.open').children('a').children('.arrow').removeClass('open');
        parent.children('li.open').children('.sub-menu').slideUp(200);
        parent.children('li.open').removeClass('open');

        var sub = jQuery(this).next();
        if (sub.is(":visible")) {
            jQuery('.arrow', jQuery(this)).removeClass("open");
            jQuery(this).parent().removeClass("open");
            sub.slideUp(200, function () {
                handleSidenarAndContentHeight();
            });
        } else {
            jQuery('.arrow', jQuery(this)).addClass("open");
            jQuery(this).parent().addClass("open");
            sub.slideDown(200, function () {
                handleSidenarAndContentHeight();
            });
        }

        e.preventDefault();
    });
}

function getbreadcrumbs(menuid) {
    $(".breadcrumb").empty();
    var crumbs = [];
    var $node = $('li#m' + menuid + ' > a[funcid]').closest('li');
    crumbs.unshift($node.text());
    $node.parentsUntil('#sidemenu').each(function (k, v) {
        if (v.tagName === "LI")
            crumbs.unshift($(v).children('a').text());
    });
    for (var i = 0; i < crumbs.length; i++) {
        $(".breadcrumb").append('<li>' + crumbs[i] + '</li>');
    }

    getConfig("favoriteLinks").done(function (favoriteLinks) {
        var guid = $node.find('>a').data('guid'),
            isFavorite = $.map(favoriteLinks || [], function (v) { if (v.guid == guid) return v; }).length;
        $(".breadcrumb li:last-child").append('&nbsp;<a title="' + getObjectText(isFavorite ? "removeLinkFromFavorites" : "addLinkToFavorites") + '"  href="javascript:void(0)" onclick="favorizeLink(\'' + guid + '\', \'' + crumbs[crumbs.length - 1] + '\', \'' + crumbs[crumbs.length - 2] + '\', this)" class="fa ' + (isFavorite ? 'fa-star' : 'fa-star-o') + '"></a>');
    });
};

function clearMenu()
{
    $("#sidemenu").hide();
    $($("#sidemenu li")[0]).nextAll().remove();
}
//richiamata da appendMenuToDom
function changemenuTitle(modulename)
{ //cambio dell' etichetta sopra al menu
    $("#mf_moduleDescription.menu-title").text(modulename).fadeIn('slow');
}

function generateSideMenu() {
    clearMenu();
    //Appendo a #sidemenu della master page di webarch il menu come da Database
    appendMenuToDom(template, function () {
        $("#sidemenu li.start, #sidemenu li.openpage").on("click", function () {
            $("#sidemenu li.start, #sidemenu li.openpage").removeClass("active"); //Rimozione della classe "active" su tutti i punti 
            $("#sidemenu li.openpage").removeClass("open"); //Rimozione della classe "open" su tutti i punti 
            $("#sidemenu li.openpage a span.selected").remove(); //Rimozione dell'HTML selected su tutti i punti 
            $(this).addClass("active"); //Class solo sul punto selezionato
            $(this).find("a").append("<span class=\"selected\"/>");
        });
        $("#sidemenu").fadeIn();
        initMenu();
    });
}

function genericMenuClick(functionid, menuid) {

    //MenuDataManager.js
    genericMenuClickHeader(functionid,menuid);

    //#region bread
    getbreadcrumbs(menuid);

    //#endregion

}

function genericMenuClickManageTitle(title, description,functionid)
{
    $(".page-title").empty();
    $(".page-title")
        .append(('<a href="javascript:history.back()"><i class="icon-custom-left"></a></i><h3 id="spanbig">{0}<span id="spansmall" class="semi-bold"> - {1}</span></h3>').format(title, description));
    //Workflowmanagement. queryWorkflowsWhenOpeningFunctions is set in AdminAreaCustomizations.js
    if (sessionStorage.getItem("queryWorkflowsWhenOpeningFunctions") == "true" && functionid) {
        evaluateWorkflowBadgeCounter(functionid);
    }
}

$(window).load(function () {
    var isMobile = detectmobile();
    //alert(screen.width);
    //mobile adjustment
    if (isMobile && screen.width < 640) {
        $('#searchedtextautocomplete').parent().hide();
        $('#LoginName2').hide();
        $('.spanBusinessUnit').hide();
        $('.chat-toggler').css('min-width', '0px');
        $('.chat-toggler .profile-pic').hide();
        $('#moveToTheLeft2').removeClass('pull-right');
        $('#moveToTheLeft').attr('style', 'margin-left: 0px');
        $('#searchedtextautocomplete').parent().prev().click(function () {
            if($('#searchedtextautocomplete').parent().css('display') == 'none')
                $('#searchedtextautocomplete').parent().show();
            else
                $('#searchedtextautocomplete').parent().hide();
        });
    }
});

function initNotificationsTooltip() {
    var tooltip = $('.notificationcounter').kendoTooltip({
        show: function() {
            tooltip.refresh();
        },
        content: function (e) {
            return e.target.text() + " " + getObjectText('newnotifications');
        }
    }).data("kendoTooltip");
}

$(window).click(function (e) {
    var $menu = $("#main-menu");
    if ($menu.hasClass("mini")) {
        if (!$(e.target).closest("#main-menu").length) {
            $menu.find("#sidemenu").find("ul").hide();
            resetMenu();
        }
    }
});