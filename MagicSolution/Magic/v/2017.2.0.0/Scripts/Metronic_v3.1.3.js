/// <reference path="Metronic.js" />

function getbreadcrumbs(menuid) {
    $(".breadcrumb").empty();
    var crumbs = [];
    var $node = $('li#m' + menuid + ' > a[funcid]').closest('li');
    crumbs.unshift($node.text());
    $node.parentsUntil('#sidemenu').each(function (k, v) { if (v.tagName === "LI") crumbs.unshift($(v).children('a').text()) });
    for (var i = 0; i < crumbs.length; i++) {
        $(".breadcrumb").append('<li>' + crumbs[i] + '</li>');
    }

    getConfig("favoriteLinks").done(function (favoriteLinks) {
        var guid = $node.find('>a').data('guid'),
            isFavorite = $.map(favoriteLinks || [], function (v) { if (v.guid == guid) return v; }).length;
        $(".breadcrumb li:last-child").append('&nbsp;<a title="' + getObjectText(isFavorite ? "removeLinkFromFavorites" : "addLinkToFavorites") + '" style="text-decoration: none;" href="javascript:void(0)" onclick="favorizeLink(\'' + guid + '\', \'' + crumbs[crumbs.length - 1] + '\', \'' + crumbs[crumbs.length - 2] + '\', this)" class="fa ' + (isFavorite ? 'fa-star' : 'fa-star-o') + '"></a>');
    });
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

function clearMenu()
{
    //cancello tutto cio' che sta sotto Dashboard.
    $(".sidebar-search-wrapper").next().nextAll().remove();
    
}
function generateSideMenu() {
    clearMenu();
    //Appendo a #sidemenu della master page di metronic il menu com e da Database
    appendMenuToDom(template, function () {
        $("#sidemenu li.openpage, #sidemenu li.start").click(function () {
            $("#sidemenu li.openpage").removeClass("active"); //Rimozione della classe "active" su tutti i punti 
            $("#sidemenu li.openpage").removeClass("open"); //Rimozione della classe "open" su tutti i punti 
            $("#sidemenu li.openpage a span.selected").remove(); //Rimozione dell'HTML selected su tutti i punti 
            $(this).addClass("active"); //Class solo sul punto selezionato
            $(this).find("a").append("<span class=\"selected\"/>");
        });
    });
}



function genericMenuClickManageTitle(title, description, functionid) {
    $(".page-title i").remove();
    $("#spansmall").text(description);
    $("#spanbig").text(title);
    // function id serve per gestire l' eventuale presenza di workflow pending activities legate al function ID 
}

// chat
htmltemplates = {};

htmltemplates["metronic@contacthmtl"] = '\
	<li id="chatuser_{5}" class="media" data-chat-status="{4}" data-username="{5}">\
		<div class="media-status">\
			<span class="badge {6}">{7}</span>\
		</div>\
		<img class="media-object" src="{0}" alt="{1} {2}" style="height: 38px; widht: 38px" onerror="this.onerror=null;this.src=\'/Views/AccountImages/developer.jpg\'">\
		<div class="media-body">\
			<h4 class="media-heading">{1} {2}</h4>\
			<div class="media-heading-sub">\
					{3}\
			</div>\
		</div>\
	</li>';
htmltemplates["metronic@groupcontacthmtl"] = '\
	<li id="chatuser_{5}" class="media" data-chat-status="{4}" data-username="{5}">\
		<div class="media-status">\
			<span class="badge {6}">{7}</span>\
		</div>\
		<div class="media-body">\
            <div style="height: 38px; width: 38px; position: relative; display: inline-block; float: left;">\
                <span class="glyphicon glyphicon-user" aria-hidden="true" style="position: absolute;"></span>\
                <span class="glyphicon glyphicon-user" aria-hidden="true" style="position: absolute; top: 7px; left: 13px;"></span>\
            </div>\
			<h4 class="media-heading" style="display: inline-block">{1} {2}</h4>\
		</div>\
	</li>';
htmltemplates["metronic@messagehtml"] = '\
        <div class="post in">\
			<img class="avatar" alt="#" src="{0}" style="height: 38px; widht: 38px" onerror="this.onerror=null;this.src=\'/Views/AccountImages/developer.jpg\'" />\
			<div class="message">\
				<span class="arrow"></span>\
				<a href="#" class="name">{3}</a><br>\
				<span class="datetime">{2}</span><br>\
				<span class="body">\
				{1}</span>\
			</div>\
		</div>';
htmltemplates["metronic@messageownhtml"] = '\
        <div class="post out ownChatMessage" data-message-id="{4}">\
			<img class="avatar" alt="#" src="{0}" style="height: 38px; widht: 38px" onerror="this.onerror=null;this.src=\'/Views/AccountImages/developer.jpg\'" />\
			<div class="message">\
				<span class="arrow"></span>\
				<a href="#" class="name">{3}</a><br>\
				<span class="datetime">{2}<span class="readby"> {5}</span></span><br>\
				<span class="body">\
				{1}</span>\
			</div>\
		</div>';

htmltemplates["metronic"] = {};
htmltemplates["metronic"]["status"] = {
    "online": "badge-success",
    "offline": "badge-none",
    "busy": "badge-danger",
    "away": "badge-warning"
};
htmltemplates["metronic"]["classes"] = {
    "chat_group_title": "#friends-list .list-heading",
    "status": " .media-status",
    "status_message": " .media-heading-sub",
    "contact": " li.media",
    "notification": " .badge",
    "close": ".page-quick-sidebar-back-to-list",
    "global_notification": "#header_inbox_bar span",
    "global_notification_empty_value" : "0",
    "scrollbox": ".page-quick-sidebar-chat-user-messages",
    "scroll_bottom": function () {
        var scrollTo_val = $(htmltemplates["metronic"]["classes"]["scrollbox"]).prop('scrollHeight') + 'px';
        $(htmltemplates["metronic"]["classes"]["scrollbox"]).slimScroll({ scrollTo: scrollTo_val });
        //if (htmltemplates[template].classes.max_scroll == "")
        //    htmltemplates[template].classes.max_scroll = $('#main-chat-wrapper').prop('scrollTop');
    },
    "scroll_height": function () { return $(htmltemplates["metronic"]["classes"]["scrollbox"]).prop('scrollHeight'); },
    "max_scroll": "",
    "scroll_position": function () { return $(htmltemplates["metronic"]["classes"]["scrollbox"]).prop('scrollTop'); },
    "scroll_to": function (to) {
        if (!to)
            to = 35;
        to = to + 'px';
        $(htmltemplates["metronic"]["classes"]["scrollbox"]).slimScroll({ scrollTo: to });
    },
    "group": '<div class="chat-group"><a class="collapsed" data-toggle="collapse" href="#chat_group_{0}"><h3 class="list-heading">{1}</h3></a><ul class="media-list list-items"><div id="chat_group_{0}" class="media-list list-items collapse"></ul></div>',
    "message_window": "#messages-wrapper",
    "messages_container": " .chat-messages",
    "message_window_status": " .media-status",
    "message_window_name": " .name",
    "single_message": " .post.out",
    "chat_input_wrapper": " .chat-input-wrapper",
    "contacts_wrapper": "#chat-users",
    "text_field": ".page-quick-sidebar-chat-user-form .input-group .form-control",
    "load_img": '<div id="chat_loading" style="text-align:center; background-color: white;"><img src="/magic/htmltemplates/metronic/assets/img/loading.gif" /></div>',
    "notifications_container": "#dropdownMenuListScroller",
    "notifications_counter": "#header_notification_bar .notificationcounter",
    "button_addFile": "#chatAddFile",
    "chat_message_text_container": ".body"
};

function setupChat(search) {
    $(htmltemplates[template]["classes"]["scrollbox"]).slimScroll().bind('slimscroll', function (e, pos) {
        if (pos == "top") {
            setTimeout(function () {  
                if (active_chat.length > 0 && htmltemplates[template]["classes"]["scroll_position"]() == 0)
                    getMessages(active_chat.join(","));
            }, 50);
        }
    });
    $(htmltemplates[template]["classes"]["chat_group_title"]).css('cursor', 'pointer');
    $(htmltemplates[template]["classes"]["chat_group_title"]).click(function () {
        $(this).next().toggle();
    });
    if (!window.chatDeactivateBOHashtags)
        $(htmltemplates.metronic.classes.text_field).textBOSelector();
}

function individualOpenChat() {
    $('#quick_sidebar_tab_1').addClass('page-quick-sidebar-content-item-shown');
}

function individualCloseChat() {
    $('#quick_sidebar_tab_1').removeClass('page-quick-sidebar-content-item-shown');
}