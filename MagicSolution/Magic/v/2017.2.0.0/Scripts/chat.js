/// <reference path="../../../../Scripts/jquery-2.1.1.js" />

//{0} img
//{1} name
//{2} surname
//{3} status_message
//{4} status
//{5} username
//{6} style for status img
//{7} new messages

//{0} img from
//{1} message
//{2} date
//{3} from
//{4} id
//{5} message_read

var contacts_grouped;
var contacts;
var chats = [];
var chatUser;
var chat_constants;
active_chat = []; //to adapt if multiple chat windows are possible
var all_messages_retrieved = [];
var notifications = {};
var pending_messages = [];
var message_read_sign = '&#10003;';
var upload_file_path = "";
var last_message_received_at;

//uncomment one line after adapting to metronic
function populateChat(data) {
    data = $.parseJSON(data);
    chatUser = data.user;
    contacts = data.contacts;
    chat_constants = data.constants;
    groups = data.groups;
    last_message_received_at = chatUser.session_start;
    //chats = data.chats;
    contacts_grouped = {};
    var search = [];
    $('#friends-list').html('');
    //adding contacts to chat div with id=friends-list, generating contacts_grouped and search
    $('#friends-list').append(htmltemplates[template]["classes"]["group"].format("unread", getObjectText('unreadMessages') + '&nbsp;(<span class="message-counter"></span>)'));
    $('#chat_group_unread').closest('.chat-group').hide();
    $('#friends-list').append(htmltemplates[template]["classes"]["group"].format("online", getObjectText('online')));
    $('#friends-list').append(htmltemplates[template]["classes"]["group"].format("BU", getObjectText('groupChats')));
    $.each(groups, function (index, value) {
        $('#chat_group_BU').append(htmltemplates[template + '@groupcontacthmtl'].format("", value['description'], "", "", "", index, "").replace("{7}", value['unreadMessages']));
        if (value.unreadMessages != "")
            notifications[index] = value.unreadMessages;
        search.push({ "searchTerms": value.description, "username": index, "img": "" });
    });
    $('#friends-list').append(htmltemplates[template]["classes"]["group"].format("offline", getObjectText('offline')));
    $.each(contacts, function (index, value) {
        //$.each(value.group, function (index, group) {
        //    if (contacts_grouped[group] === undefined) {
        //        contacts_grouped[group] = { "online": [], "offline": [] };
        //        $('#friends-list').append(htmltemplates[template]["classes"]["group"].format(group, groups[group]['description'] || group));
        //    }
        //    contacts_grouped[group][value.status == "offline" ? "offline" : "online"].push(value.username);
        //});
        if (value.unreadMessages != "")
            notifications[value.username] = value.unreadMessages;
        if (value.name == "" && value.surname) {
            value.name = value.surname;
            value.surname = "";
        }
        else if (value.name == "" && value.surname == "") {
            value.name = value.username;
        }
        search.push({ "searchTerms": value.name + " " + value.surname, "username": value.username, "img": value.img });
        var pushTo = ' #chat_group_online';
        if(value.status == "offline")
            pushTo = ' #chat_group_offline'
        $(pushTo).append(htmltemplates[template + '@contacthmtl'].format((value.img == "" ? '/Views/AccountImages/developer.jpg' : value.img), value.name, value.surname, value.status_message, value.status, value.username, htmltemplates[template]["status"][value.status]).replace("{7}", value.unreadMessages));

    });
    var address = htmltemplates[template]["classes"]["global_notification"];
    var amount = Object.size(notifications);
    updateUnreadMessagesGroup();
    if (amount == 0)
        $(address).html(htmltemplates[template]["classes"]["global_notification_empty_value"]);
    else
        $(address).html(amount);
    //$.each(contacts_grouped, function (i, v) {
    //    $.each(v.online, function (ind, val) {
    //        var value = contacts[val];
    //        $('#chat_group_' + i + ' .online').append(htmltemplates[template + '@contacthmtl'].format(value.img, value.name, value.surname, value.status_message, value.status, value.username, htmltemplates[template]["status"][value.status]).replace("{7}", value.unreadMessages));
    //    });
    //    $.each(v.offline, function (ind, val) {
    //        var value = contacts[val];
    //        $('#chat_group_' + i + ' .offline').append(htmltemplates[template + '@contacthmtl'].format(value.img, value.name, value.surname, value.status_message, value.status, value.username, htmltemplates[template]["status"][value.status]).replace("{7}", value.unreadMessages));
    //    });
    //});
    //set current user status
    $('#chat_status').html($('#chat_status').html().replace(htmltemplates[template]["status"]["online"], htmltemplates[template]["status"][chatUser.status]).replace("online", getObjectText(chatUser.status)));
    $('#chat_status').attr('data-chat-status', chatUser.status);
    //set status message
    $('#chat_status_message').val(chatUser.status_message);
    $('#chat_status_message').keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            updateStatusMessage($(this).val());
        }
    });
    //add listener for chat message input field
    $(htmltemplates[template]["classes"]["text_field"]).keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            if ($(this).val()) {
                sendMessageTo(active_chat, $(this).val());
                if (!window.chatDeactivateBOHashtags) {
                    BOSMessageType = 'Documento Chat';
                    var message = { current: { Timestamp: new Date().toJSON(), Text: $(this).val().trim(), From: $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_name"]).first().text() } };
                    if (active_chat in chats) {
                        message.history = [];
                        var i = chats[active_chat].length;
                        while (i >= 1 && i > chats[active_chat].length - 5) {
                            i--;
                            message.history.push(chats[active_chat][i]);
                        }
                    }
                    BOSMessageText = JSON.stringify(message);
                    if (typeof saveBO == 'function') {
                        BOSdata = {
                            'BOType': '1',
                            'BOId': '1',
                            'BOTags': $(htmltemplates[template]["classes"]["text_field"]).textBOSelector('getBOs')
                        };
                        if (BOSdata.BOTags.length > 0)
                            saveBO(BOSdata.BOTags);
                    }
                }
            }
            $(this).val('');
        }
    });
    //add listener to contacts to open on click
    $('#friends-list').on('click', htmltemplates[template]["classes"]["contact"], function () {
        openChat($(this).attr('data-username'));
    });
    $(htmltemplates[template]["classes"]["close"]).click(function () {
        closeChat();
    })
    //click trigger to change user status
    $('#chat_status').click(function () {
        if (typeof os === 'undefined') {
            os = $('#chat_status').attr('data-chat-status');
        }
        else {
            clearTimeout(timeout);
        }
        oldstatus = $('#chat_status').attr('data-chat-status');
        var newstatus = chat_constants["status"][(chat_constants["status"].indexOf($('#chat_status').attr('data-chat-status')) + 1) % chat_constants["status"].length];
        $('#chat_status').attr('data-chat-status', newstatus);
        var address = '#chat_status';
        replaceStatus(address, oldstatus, newstatus);
        $(address).html($(address).html().replace(getObjectText(oldstatus), getObjectText(newstatus)));
        timeout = setTimeout(function () {
            if (os != newstatus)
                updateStatus(newstatus);
            delete os;
        }, 5000);
    });

    $(htmltemplates[template]["classes"]["button_addFile"]).click(function () {
        populateUploadFileWindow({
            entityInfo: {
                entityName: "__chat",
                refValueId: null
            }
        });
        $('#uploadFileWrapper').show();
        $('#addToChatMessageContainer').hide();
    });

    $(htmltemplates[template]["classes"]["messages_container"]).on('dblclick', '.ownChatMessage', function () {
        populateUploadFileWindow({
            showGrid: true,
            entityInfo: {
                entityName: "__chat",
                refValueId: null
            }
        });
        var $messageEl = $(this),
            message = { current: { Text: $messageEl.find(htmltemplates[template]["classes"]["chat_message_text_container"]).text().trim(), From: $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_name"]).text() } };
        if (active_chat in chats) {
            message.history = [];
            var i = chats[active_chat].length,
                messageId = $messageEl.data("message-id"),
                messageIndex = false;
            for (i = 0; i < chats[active_chat].length; i++) {
                if (i === messageIndex) {
                    message.current.Timestamp = chats[active_chat][i].Received;
                    break;
                }
                else if (messageIndex !== false)
                    message.history.push(chats[active_chat][i]);
                else if (chats[active_chat][i].Id == messageId) {
                    messageIndex = i;
                    i -= 6;
                    if (i < -1)
                        i = -1;
                }
            }
            message.history.reverse();
        }
        BOSMessageText = JSON.stringify(message);
        BOSMessageType = 'Documento Chat';
        $('#uploadFileWrapper').hide();
        $('#addToChatMessageContainer').show();
    });


    //add autocomplete to input field with id=chat_contact_search

    setupChat(search);

    //var list = autocomplete_chat.list;
    //var ul = autocomplete_chat.ul;
    /*$('#chat-window-wrapper').on('scroll', function (event) {
        var element, height, scrollHeight, scrollTop;
        element = $(this);
        scrollTop = element.scrollTop();
        scrollHeight = element.prop('scrollHeight');
        height = element.height();
        if (scrollTop < scrollHeight - height - 25) {
            disableScroll();
        }
        if (scrollTop > scrollHeight - height - 10) {
            return enableScroll();
        }
    });*/
    setTimeout(function () {
        var status = chatUser['status'];
        if (status != 'offline')
            updateStatus(status);
    }, 5000);
    setTimeout(function () {
        var status = chatUser['status'];
        if (status != 'offline')
            updateStatus(status);
    }, 15000);
}

function updateUnreadMessagesGroup() {
    var amount = 0;
    $.each(notifications, function (k, v) { amount += v; });
    $chatGroup = $('#chat_group_unread').closest('.chat-group');
    $('.message-counter', $chatGroup).text(amount);
    if (amount) {
        $('#chat_group_unread', $chatGroup).html('');
        $chatGroup.show();
        $.each(notifications, function (index, count) {
            if (index.match(/^\d+$/)) {
                var value = groups[index];
                $('#chat_group_unread', $chatGroup).append(htmltemplates[template + '@groupcontacthmtl'].format("", value['description'], "", "", "", index, "").replace("{7}", count));
            } else {
                var value = contacts[index];
                $('#chat_group_unread', $chatGroup).append(htmltemplates[template + '@contacthmtl'].format((value.img == "" ? '/Views/AccountImages/developer.jpg' : value.img), value.name, value.surname, value.status_message, value.status, value.username, htmltemplates[template]["status"][value.status]).replace("{7}", count));
            }
        });
    } else {
        $chatGroup.hide();
    }
}

function openChat(usernames) {
    $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["messages_container"]).html('');
    clearNotificationsFor(usernames);
    if (usernames instanceof Array) {
        //clearNotificationsFor(usernames.join("-"));
        //usernames.push(user.username);
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_status"]).hide();
        var output = "";
        $.each(usernames, function (index, username) {
            output += contacts[username].name + " " + contacts[username].surname;
        });
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_name"]).html(output);
        usernames.sort();
    }
    else if (!isNaN(usernames)) {
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_status"]).hide();
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_name"]).html(groups[usernames].description);
        usernames = [usernames];
    }
    else {
        var oldStatus = $(htmltemplates[template]["classes"]["message_window"]).attr('data-chat-status');
        var newStatus = contacts[usernames].status;
        var address = htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_status"];
        replaceStatus(address, oldStatus, newStatus);
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_status"]).show();
        $(htmltemplates[template]["classes"]["message_window"]).attr('data-chat-status', newStatus);
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_name"]).html(contacts[usernames].name + " " + contacts[usernames].surname);
        usernames = [chatUser.username, usernames];
        usernames.sort();
    }
    active_chat = usernames;
    usernames = usernames.join(",");
    individualOpenChat();
    if (!(usernames in chats) || chats[usernames].length < chat_constants.numberOfMessagesToRetrieveAtOnce)
        getMessages(usernames);
    appendMessages(usernames);
}

function replaceStatus(address, oldStatus, newStatus) {
    var search = htmltemplates[template]["status"][oldStatus];
    var replace = htmltemplates[template]["status"][newStatus];
    $(address).html($(address).html().replace(search, replace));
}

function getMessages(usernames) {
    if (window.realtimehubconnection !== undefined) {
        var c = window.realtimehubconnection;
        if (usernames in chats)
            date = chats[usernames][0].Received;
        else
            date = last_message_received_at;
        if (all_messages_retrieved.indexOf(usernames) < 0 && pending_messages.indexOf(usernames) < 0) {
            $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["messages_container"]).prepend(htmltemplates[template]["classes"]["load_img"]);
            c.server.getMessagesFor(usernames.split(','), date);
            pending_messages.push(usernames);
        }
    }
}

function appendMessages(usernames) {
    if (usernames in chats) {
        $.each(chats[usernames], function (index, message) {
            appendMessage(message);
        });
        markAllMessagesRead(usernames);
        htmltemplates[template].classes.scroll_bottom();
    }
}

function unShiftMessages(messages) {
    messages = $.parseJSON(messages);
    fu = active_chat.join(",");
    var index = pending_messages.indexOf(fu);
    if (messages && messages.length > 0) {
        var not_first_messages = (fu in chats);
        if (not_first_messages) {
            setTimeout(function () {
                $('#chat_loading').remove();
                prependMessages(messages);
                //htmltemplates[template].classes.scroll_to();
                messages.reverse();
                chats[fu] = messages.concat(chats[fu]);
                if (index > -1)
                    pending_messages.splice(index, 1);
            }, 1500);
        }
        else {
            $('#chat_loading').remove();
            prependMessages(messages);
            messages.reverse();
            chats[fu] = messages;
            if (index > -1) {
                pending_messages.splice(index, 1);
            }
            htmltemplates[template].classes.scroll_bottom();
        }
    }
    else
        $('#chat_loading').remove();
    if (messages && messages.length < chat_constants.numberOfMessagesToRetrieveAtOnce)
        all_messages_retrieved.push(fu);
}

function prependMessages(messages) {
    $.each(messages, function (index, message) {
        appendMessage(message, true);
    });
    markMessagesRead(messages);
}

function appendMessage(message, prepend) {
    var t, img, name, date, messageRead, text;
    text = message.Text;
    if (message.From == chatUser.username) {
        t = htmltemplates[template + "@messageownhtml"];
        name = chatUser.name + " " + chatUser.surname;
        img = chatUser.img;
    }
    else {
        t = htmltemplates[template + "@messagehtml"];
        try{
            name = contacts[message.From]["name"] + " " + contacts[message.From]["surname"];
            img = contacts[message.From]["img"];
        }
        catch (e){
            name = '(deleted user)';
            img = '';
        }
        if (active_chat.length == 1 && template == 'webarch')
            text = name + ': ' + text;
    }
    date = new Date(message.Received);
    date = date.toLocaleString();
    if (message.For.length > 1 && Object.keys(message.ReadBy).length > 0) {
        messageRead = message_read_sign;
    }
    else
        messageRead = '';
    if (prepend)
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["messages_container"]).prepend(t.format(img, text, date, name, message.Id, messageRead));
    else
        $(htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["messages_container"]).append(t.format(img, text, date, name, message.Id, messageRead));
}

function markAllMessagesRead(usernames) {
    if (usernames in chats) {
        markMessagesRead(chats[usernames]);
    }
}

function markMessagesRead(messages) {
    var ids = [];
    $.each(messages, function (index, message) {
        if (message.From != chatUser.username && !(chatUser.username in message.ReadBy)) {
            ids.push(message.Id);
            message.ReadBy[chatUser.username] = {};
        }
    });
    if (ids.length) {
        if (window.realtimehubconnection !== undefined) {
            var c = window.realtimehubconnection;
            c.server.userReadMessages(ids);
        }
    }
}

function markMessageRead(messageId) {
    if (window.realtimehubconnection !== undefined) {
        var c = window.realtimehubconnection;
        c.server.userReadMessages([messageId]);
    }
}

function autoScroll() {
    if (htmltemplates[template].classes.max_scroll == "")
        htmltemplates[template].classes.scroll_bottom();
    else if (htmltemplates[template].classes.scroll_position >= htmltemplates[template].classes.max_scroll - 15)
        htmltemplates[template].classes.scroll_bottom();
}

function pushMessage(message) {
    message = $.parseJSON(message);
    last_message_received_at = message.Received;
    fu = message.For.join(",");
    if (arrayEquals(active_chat, message.For)) {
        appendMessage(message);
        if(message.From != chatUser.username)
            markMessageRead(message.Id);
        autoScroll();
    }
    else {
        notifyNewMessage(message);
    }
    if (!(fu in chats)) {
        chats[fu] = [message];
    }
    else
        chats[fu].push(message);

    updateUnreadMessagesGroup();
}

function notifyNewMessage(message) {
    var who;
    if (message.For.length == 2) {
        who = message.For[1 - message.For.indexOf(chatUser.username)];
    }
    else if (message.For.length == 1)
        who = message.For[0]
    addNotificationFor(who, 1);
}

function addNotificationFor(who, amount) {
    if (who in notifications)
        notifications[who] += amount;
    else
        notifications[who] = amount;
    var address = '#chatuser_' + who + htmltemplates[template]["classes"]["notification"];
    if ($(address).html() == "")
        $(address).html(amount);
    else
        $(address).html(parseInt($(address).html()) + amount);
    var address = htmltemplates[template]["classes"]["global_notification"];
    amount = Object.size(notifications);
    if (amount == 0)
        $(address).html(htmltemplates[template]["classes"]["global_notification_empty_value"]);
    else
        $(address).html(amount);
}

function clearNotificationsFor(who) {
    if (who in notifications) {
        delete notifications[who];
        $('#chatuser_' + who + htmltemplates[template]["classes"]["notification"]).html('');
        var globalValue = Object.size(notifications);
        if (globalValue == 0)
            $(htmltemplates[template]["classes"]["global_notification"]).html(htmltemplates[template]["classes"]["global_notification_empty_value"]);
        else
            $(htmltemplates[template]["classes"]["global_notification"]).html(globalValue);
        updateUnreadMessagesGroup();
    }
}

function closeChat() {
    active_chat = [];
    individualCloseChat();
}

function updateStatus(status) {
    chatUser['status'] = status;
    if (window.realtimehubconnection !== undefined) {
        var c = window.realtimehubconnection;
        c.server.updateStatus(status);
    }
}

function updateStatusMessage(status_message) {
    if (window.realtimehubconnection !== undefined) {
        var c = window.realtimehubconnection;
        c.server.updateStatusMessage(status_message);
    }
}

function sendMessageTo(to, message) {
    if (window.realtimehubconnection !== undefined) {
        if (to.length == 1 && !isNaN(to[0]))
            to = ['#GROUPMESSAGE'].concat(to);
        var c = window.realtimehubconnection;
        if (typeof message == 'string')
            message = { Text: message };
        if (message.Text && !!message.Text && message.Text.trim()) {
            c.server.sendMessageTo(to, JSON.stringify(message));
        }
    }
}

function updateStatusFor(username, status) {
    if ($('#chatuser_' + username).length) {
        var old_status = $('#chatuser_' + username).attr('data-chat-status');
        $('#chatuser_' + username).attr('data-chat-status', status);
        var address = '#chatuser_' + username + htmltemplates[template]["classes"]["status"];
        replaceStatus(address, old_status, status);
        contacts[username].status = status;
        if (active_chat.length == 2 && active_chat.indexOf(username) > -1) {
            address = htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["message_window_status"];
            replaceStatus(address, old_status, status);
            $(htmltemplates[template]["classes"]["message_window"]).attr('data-chat-status', status);
        }
        if (old_status == "offline" || status == "offline") {
            old_status = old_status == "offline" ? "offline" : "online";
            status = status == "offline" ? "offline" : "online";
            var group = '#chat_group_' + status;
            var grouplength = $(group + ' > *').length;
            var html = $('#chatuser_' + username);
            $('#chatuser_' + username).remove();
            if (grouplength < 1) {
                $(group).prepend(html);
            }
            else {
                var insertAfter = '';
                var insert = true;
                $(group + ' > *').each(function (i, elements) {
                    var un = $(this).attr('data-username');
                    if (i == 0 && contacts[username].name.toLowerCase() < contacts[un].name.toLowerCase()) {
                        $(group).prepend(html);
                        insert = false;
                        return;
                    }
                    else if (contacts[username].name.toLowerCase() < contacts[un].name.toLowerCase()) {
                        return;
                    }
                    insertAfter = un;
                });
                if(insert)
                    html.insertAfter('#chatuser_' + insertAfter);
            }
        }
    }
}

function updateStatusMessageFor(username, status_message) {
    var address = '#chatuser_' + username + htmltemplates[template]["classes"]["status_message"];
    $(address).html(status_message);
}

function compareContacts(a, b) {
    if (contacts[a].name.toLowerCase() < contacts[b].name.toLowerCase())
        return -1;
    if (contacts[a].name.toLowerCase() > contacts[b].name.toLowerCase())
        return 1;
    return 0;
}

function addContact(group, value) {
    value = $.parseJSON(value);
    if (!(value.username in contacts)) {
        contacts[value.username] = value;
        $('#chat_group_' + value.status).append(htmltemplates[template + '@contacthmtl'].format(value.img, value.name, value.surname, value.status_message, value.status, value.username, htmltemplates[template]["status"][value.status]).replace("{7}", ""));
    }
}

function messageRead(username, readInfo) {
    readInfo = $.parseJSON(readInfo);
    if (active_chat.indexOf(username) > -1) {
        var address = htmltemplates[template]["classes"]["message_window"] + htmltemplates[template]["classes"]["messages_container"] + htmltemplates[template]["classes"]["single_message"];
        $(address).each(function (index, value) {
            var elem = $(value);
            if (elem.attr('data-message-id') == readInfo.Id) {
                elem.find('.readby').html(message_read_sign);
            }
        });
    }
    var fu = readInfo.For.join(',');
    if (fu in chats) {
        $.each(chats[fu], function (index, value) {
            if (value.Id == readInfo.Id) {
                value.ReadBy[username] = "";
            }
        });
    }
}

function  pushConsoleMessage(message, state) {
    // Html encode display name and message. 
    kendoConsole.log(message, state);
};

function initChat(chat) {
    chat.client.populateChat = populateChat;
    chat.client.updateStatusFor = updateStatusFor;
    chat.client.updateStatusMessageFor = updateStatusMessageFor;
    chat.client.unShiftMessages = unShiftMessages;
    chat.client.pushMessage = pushMessage;
    chat.client.addContact = addContact;
    chat.client.messageRead = messageRead;
    chat.client.pushConsoleMessage = pushConsoleMessage;

    //error and session handling
    var errorState = null;
    var reconTimeout = null;

    $.connection.hub.error(function (error) {
        if (error.context) {
            errorState = error.context.status;
            if (error.context.status = 500)
                console.log('SignalR error: ' + error)
        }
    });

    $.connection.hub.disconnected(function () {
        if (reconTimeout)
            clearTimeout(reconTimeout);
        if (errorState != 500) { //if the session is still up try to recon
            reconTimeout = setTimeout(function () {
                $.connection.hub.start();
            }, 5000);
        }
        else { //else show messge to relog
            doModal(true, '<a href="/login?ReturnUrl=' + encodeURI(window.location.pathname) + '">' + getObjectText("relogMessage") + '</a>');
            setTimeout(function () {
                window.location.href = "/login?ReturnUrl=" + encodeURI(window.location.pathname);
            }, 10000)
        }
    });
}

var arrayEquals = function (array1, array) {
    if (!array)
        return false;

    if (array1.length != array.length)
        return false;

    for (var i = 0, l = array1.length; i < l; i++) {
        if (array1[i] instanceof Array && array[i] instanceof Array) {
            if (!arrayEquals(array1[i], array[i]))
                return false;
        }
        else if (array1[i] != array[i]) {
            return false;
        }
    }
    return true;
}

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};