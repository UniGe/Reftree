htmltemplates = {};
htmltemplates["webarch@contacthmtl"] = '\
    <div class="user-details-wrapper" data-chat-status="{4}" data-chat-user-pic="{0}" data-chat-user-pic-retina="" data-username="{5}" id="chatuser_{5}"> \
	    <div class="user-profile"> \
		    <img src="{0}"  alt="" width="35" height="35" onerror="this.onerror=null;this.src=\'/Views/AccountImages/developer.jpg\'"> \
	    </div> \
	    <div class="user-details"> \
		    <div class="user-name"> \
		    {1} {2} \
		    </div> \
		    <div class="user-more"> \
		    {3} \
		    </div> \
	    </div> \
	    <div class="user-details-status-wrapper"> \
		    <span class="badge badge-important">{7}</span> \
	    </div> \
	    <div class="user-details-count-wrapper"> \
		    <div class="status-icon {6}"></div> \
	    </div> \
	    <div class="clearfix"></div> \
    </div>';

htmltemplates["webarch@groupcontacthmtl"] = '\
    <div class="user-details-wrapper" data-chat-status="{4}" data-chat-user-pic="{0}" data-chat-user-pic-retina="" data-username="{5}" id="chatuser_{5}"> \
	    <div class="user-profile">\
		    <div style="padding-left: 7px; height: 38px; width: 31px; position: relative; display: inline-block; float: left;">\
                <span class="glyphicon glyphicon-user" aria-hidden="true" style="position: absolute; color: white;"></span>\
                <span class="glyphicon glyphicon-user" aria-hidden="true" style="position: absolute; top: 7px; left: 20px; color: white;"></span>\
            </div>\
	    </div> \
	    <div class="user-details"> \
		    <div class="user-name"> \
		    {1} {2} \
		    </div> \
		    <div class="user-more"> \
		    {3} \
		    </div> \
	    </div> \
	    <div class="user-details-status-wrapper"> \
		    <span class="badge badge-important">{7}</span> \
	    </div> \
	    <div class="user-details-count-wrapper"> \
		    <div class="status-icon {6}"></div> \
	    </div> \
	    <div class="clearfix"></div> \
    </div>';

htmltemplates["webarch@messagehtml"] = '\
        <div class="user-details-wrapper">\
			<div class="user-profile">\
				<img src="{0}" width="35" height="35" onerror="this.onerror=null;this.src=\'/Views/AccountImages/developer.jpg\'"> \
			</div> \
			<div class="user-details">\
			  <div class="bubble">\
                    {2}<br>\
					{1}\
			   </div>\
			</div>\
			<div class="clearfix"></div>\
		</div>';
htmltemplates["webarch@messageownhtml"] = '\
        <div class="user-details-wrapper pull-right ownChatMessage" data-message-id="{4}">\
			<div class="user-details">\
			  <div class="bubble sender">\
                {2}<br>\
                <span class="readby">{5} </span>{1}\
			  </div>\
			</div>\
			<div class="clearfix"></div>\
		</div>';

htmltemplates["webarch"] = {};
htmltemplates["webarch"]["status"] = {
    "online": "green",
    "offline": "grey",
    "busy": "red",
    "away": "yellow"
};
htmltemplates["webarch"]["classes"] = {
    "chat_group_title": "#friends-list .side-widget-title",
    "status": " .user-details-count-wrapper",
    "status_message": " .user-more",
    "contact": " .user-details-wrapper",
    "notification": " .badge",
    "close": ".chat-back",
    "global_notification": "#chat-message-count",
    "global_notification_empty_value": "",
    "scrollbox": "#main-chat-wrapper",
    "scroll_bottom": function () {
        var scrollTo_val = $(htmltemplates["webarch"]["classes"]["scrollbox"]).prop('scrollHeight') + 'px';
        $(htmltemplates["webarch"]["classes"]["scrollbox"]).slimScroll({ scrollTo: scrollTo_val });
        //if (htmltemplates[template].classes.max_scroll == "")
        //    htmltemplates[template].classes.max_scroll = $('#main-chat-wrapper').prop('scrollTop');
    },
    "scroll_height": function () { return $(htmltemplates["webarch"]["classes"]["scrollbox"]).prop('scrollHeight'); },
    "max_scroll": "",
    "scroll_position": function () { return $(htmltemplates["webarch"]["classes"]["scrollbox"]).prop('scrollTop'); },
    "scroll_to": function (to) {
        if (!to)
            to = 15;
        to = to + 'px';
        $(htmltemplates["webarch"]["classes"]["scrollbox"]).slimScroll({ scrollTo: to });
    },
    "group": '<div class="chat-group"><a class="side-widget-title collapsed" data-toggle="collapse" href="#chat_group_{0}">{1}</a><div class="collapse" id="chat_group_{0}"></div></div>',
    "message_window": "#messages-wrapper",
    "messages_container": " .chat-messages",
    "message_window_status": " .status",
    "message_window_name": " .name",
    "single_message": " .user-details-wrapper.pull-right",
    "chat_input_wrapper": " .chat-input-wrapper",
    "contacts_wrapper": "#chat-users",
    "text_field": "#chat-message-textarea",
    "load_img": '<div id="chat_loading" style="text-align:center; background-color: white;"><img src="/magic/htmltemplates/metronic/assets/img/loading.gif" /></div>',
    "notifications_container": ".chat-toggler",
    "notifications_counter": ".notificationcounter",
    "button_addFile": "#chatAddFile",
    "chat_message_text_container": ".sender"
};

function setupChat(search) {
    $("#chat_contact_search").kendoAutoComplete({
        minLength: 1,
        dataTextField: "searchTerms",
        template: '<div onclick="openChat(\'#:data.username#\')">' +
                  '<span class="k-state-default"><h3>#: data.searchTerms #</h3></span></div>',
        dataSource: search,
        filter: "contains",
        open: function (e) {
            //$("#chat_contact_search-list").css("left", "auto");
            //$("#chat_contact_search-list").css("right", "-511px");
        },
        close: function (e) {
            //$("#chat_contact_search-list").css("right", "auto");
        },
        select: function (e) { setTimeout(function () { $('#chat_contact_search').val('') }, 1000) }
    });
    $(htmltemplates[template]["classes"]["scrollbox"]).slimScroll().bind('slimscroll', function (e, pos) {
        if (pos == "top") {
            setTimeout(function () {
                if (active_chat.length > 0 && htmltemplates[template]["classes"]["scroll_position"]() == 0)
                    getMessages(active_chat.join(","));
            }, 50);
        }
    });
    if (!window.chatDeactivateBOHashtags)
        $(htmltemplates.webarch.classes.text_field).textBOSelector({ placement: 'top|absright' });
}

function individualOpenChat() {
    $(htmltemplates["webarch"]["classes"]["message_window"]).show();
    $(htmltemplates["webarch"]["classes"]["chat_input_wrapper"]).show();
    $(htmltemplates["webarch"]["classes"]["contacts_wrapper"]).hide();
}

function individualCloseChat() {
    $(htmltemplates["webarch"]["classes"]["message_window"] + htmltemplates["webarch"]["classes"]["messages_container"]).html('');
    $(htmltemplates["webarch"]["classes"]["message_window"]).hide();
    $(htmltemplates["webarch"]["classes"]["chat_input_wrapper"]).hide();
    $(htmltemplates["webarch"]["classes"]["contacts_wrapper"]).show();
}


$(document).ready(function () {
	var conversation = [[1,"sadsadsad"],[1,"asdsad"],[0,"asdsada"]];
	$('.user-details-wrapper').click(function(){
			set_user_details($(this).attr('data-user-name'),$(this).attr('data-chat-status'));
			$('#messages-wrapper').addClass('animated');
			$('#messages-wrapper').show();			
			$('#chat-users').removeClass('animated');
			$('#chat-users').hide();
			$('.chat-input-wrapper').show();	
	})
	
	$('.chat-back').click(function(){
			$('#messages-wrapper .chat-messages-header .status').removeClass('online');
			$('#messages-wrapper .chat-messages-header .status').removeClass('busy');
			$('#messages-wrapper').hide();
			$('#messages-wrapper').removeClass('animated');
			$('#chat-users').addClass('animated');
			$('#chat-users').show();
			$('.chat-input-wrapper').hide();
	})
	$('.bubble').click(function(){
		$(this).parent().parent('.user-details-wrapper').children('.sent_time').slideToggle();
	})
	$('#chat-message-input').keypress(function (e) {
	    if (e.keyCode == 13) {
	        send_message($(this).val());
	        $(this).val("");
	        $(this).blur()
	    }
	});

	eleHeight = window.screen.height;
	eleHeight = eleHeight - (window.outerWidth <= 1024 ? 210 : 180);

	$('#main-chat-wrapper').slimScroll({
		color: '#a1b2bd',
		size: '7px',
		height: eleHeight,
		alwaysVisible: false
	});
})

	function set_user_details(username,status){
		$('#messages-wrapper .chat-messages-header .status').addClass(status);
		$('#messages-wrapper .chat-messages-header span').text(username);
	}	
	function build_conversation(msg,isOpponent,img,retina){
		if(isOpponent==1){
			$('.chat-messages').append('<div class="user-details-wrapper">'+
				'<div class="user-details">'+
					'<div class="user-profile">'+
					'<img src="'+ img +'"  alt="" data-src="'+ img +'" data-src-retina="'+ retina +'" width="35" height="35">'+
					'</div>'+
				  '<div class="bubble old sender">'+	
						msg+
				   '</div>'+
				'</div>'+				
				'<div class="clearfix"></div>'+
			'</div>');		
		}
		else{
		$('.chat-messages').append('<div class="user-details-wrapper pull-right">'+
			'<div class="user-details">'+
			  '<div class="bubble old sender">'+	
					msg+
			   '</div>'+
			'</div>'+				
			'<div class="clearfix"></div>'+
		'</div>')
		}
	}
	function send_message(msg){
		$('.chat-messages').append('<div class="user-details-wrapper pull-right animated fadeIn">'+
			'<div class="user-details">'+
			  '<div class="bubble old sender">'+	
					msg+
			   '</div>'+
			'</div>'+				
			'<div class="clearfix"></div>'+
		'</div>')
	}	