/// <reference path="../../../../Scripts/jquery-2.1.1.js" />
//{0} text
//{1} type
//{2} read
//{3} date
//{4} time
//{5} id
//{6} adds calss "read" if the notification was already read

var allNotifications = [],
    unreadNotifications = 0,
    classUnread = "unread",
    $scrollContainer,
    loadingNextPage = false;

function initNotifications() {
    if (!window.NotificationsActive)
        return;

    var runScrollTrigger = true,
        $notifications_container = $(htmltemplates[template]["classes"]["notifications_container"]);

    $.ajax({
        type: "GET",
        url: "/api/StaticNotifications/Get/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            result = $.parseJSON(result);
            unreadNotifications = result.unreadNotificationsCount;
            addNotifications(result.notifications);
            initPopupNotifications(result.events);
            if (typeof setSettings == 'function')
                setSettings(result.enableNotifications);
            notificationsActive = result.enableNotifications;

        }
    });

    $('#markAllNotificationsRead').click(initMarkAllNotificationsReadButton);

    $notifications_container.on('click', '.' + classUnread, function () {
        if (!$(this).data('read')) {
            markNotificationRead($(this).data('id'));
            $(this).data('read', true).removeClass(classUnread);
            if(unreadNotifications > 0)
                unreadNotifications--;
            setNotificationCounter();
        }
    });

    $notifications_container.on('click', '#remove_notification', function () {
        var $element = $(this).parent();
        var id = $element.data('id');
        deleteNotification(id);
        if (unreadNotifications > 0 && !$element.data("read")) {
            unreadNotifications--;
            setNotificationCounter();
        }
        $element.parent().remove();

        for (var i = 0; i < allNotifications.length; i++){
            if (allNotifications[i].Id == id) {
                allNotifications.splice(i, 1);
                break;
            }
        }

        if (!loadingNextPage && allNotifications.length < 10)
            loadNextNotifications();
    });

    $(document).ready(function () {
        $scrollContainer = template == "webarch" ? $notifications_container.find('.popover-content') : $notifications_container;
        $scrollContainer.on('scroll', function () {
            if (!loadingNextPage && $scrollContainer.scrollTop() + $scrollContainer.innerHeight() >= this.scrollHeight - 100) {
                loadNextNotifications();
            }
        });
    });
}

function loadNextNotifications() {
    loadingNextPage = true;
    return $.ajax({
        type: "GET",
        url: "/api/StaticNotifications/GetByOffset/",
        contentType: "application/json; charset=utf-8",
        data: { offset: allNotifications.length },
        dataType: "json",
        success: function (result) {
            result = $.parseJSON(result);
            if (result.length) {
                addNotifications(result, true);
                loadingNextPage = false;
            } else {
                $scrollContainer.unbind('scroll');
            }
        }
    });
}

function initMarkAllNotificationsReadButton() {
    markNotificationRead('all');
    unreadNotifications = 0;
    setNotificationCounter();
    $(htmltemplates[template]["classes"]["notifications_container"] + ' .' + classUnread).each(function () {
        $(this).removeClass(classUnread);
    });
}

function initPopupNotifications(eventNotifications) {
    if (!eventNotifications)
        return;
    var offset = new Date().getTimezoneOffset() * 60000;
    $.each(eventNotifications, function (k, noti) {
        eventNotifications[k].notify_at = Date.parse(eventNotifications[k].notify_at) + offset;
    });
    handlePopupNotifications(eventNotifications)
}

function handlePopupNotifications(eventNotifications) {
    var now = Date.now() + 5000;
    while (eventNotifications.length && eventNotifications[0].notify_at <= now){
        showPopupNotification(eventNotifications.shift());
    }
    if (eventNotifications.length) {
        var nextRound = eventNotifications[0].notify_at - Date.now();
        if (nextRound <= 0)
            handlePopupNotifications(eventNotifications);
        else
            setTimeout(function () { handlePopupNotifications(eventNotifications) }, nextRound);
    }
}

function showPopupNotification(notification) {
    kendoConsole.log(notification.title + '<br>' + getObjectText("start") + ": " + new Date(notification.event_start.replace("T", " ")).toLocaleString() + '<br><br><a href="javascript:void(0)" onclick="markNotificationRead(\'' + notification.id + '\', true)">' + getObjectText("read") + '</a>', "event");
}

function showNotification(notification, staticNotification) {
    staticNotification.show({
        title: capitaliseFirstLetter(notification.Type),
        message: notification.Text != null ?  notification.Text.replace(/</g, "&lt;") : "",
        id: notification.Id,
        read: notification.Read,
        class_unread: notification.Read == false ? " " + classUnread : "",
        date: notification.Date
    }, notification.Type);
}

function markNotificationRead(id, isEvent) {
    $.ajax({
        type: "POST",
        url: "/api/StaticNotifications/Read/",
        data: { Message: id, Type: isEvent ? "events" : "noti" }
    });
}

function saveNotification(type, message) {
    var data = JSON.stringify({ Type: type, Message: message });
    $.ajax({
        type: "POST",
        url: "/api/StaticNotifications/Post/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: data,
        success: function (result) {
            if (type != "error") {
                unreadNotifications ++;
                addNotifications([$.parseJSON(result)]);
            }
        },
        error: function (error) {
            if (type != "error") {
                unreadNotifications++;
                var staticNotification = $("#staticNotification").data("kendoNotification");
                staticNotification.show({
                    title: "Error",
                    message: message,
                    id: "",
                    read: "",
                    class_unread: ""
                }, type);
            }
        }
    });
}

function addNotifications(notifications, addAfter) {
    var staticNotification = $("#staticNotification").data("kendoNotification");

    if (addAfter) {
        staticNotification.options.stacking = "down";
        for (var i = 0; i < notifications.length; i++) {
            showNotification(notifications[i], staticNotification);
        }
        staticNotification.options.stacking = "up";
        allNotifications = allNotifications.concat(notifications);
    } else {
        for (var i = notifications.length - 1; i >= 0; i--) {
            showNotification(notifications[i], staticNotification);
        }

        allNotifications = notifications.concat(allNotifications);

        if ($scrollContainer)
            $scrollContainer.animate({
                scrollTop: 0
            }, 200);
    }

    setNotificationCounter();
}

function setNotificationCounter() {
    $(htmltemplates[template]["classes"]["notifications_counter"]).html(unreadNotifications);
}

function deleteNotification(id) {
    $.ajax({
        type: "POST",
        url: "/api/StaticNotifications/Delete/" + id
    });
}

function capitaliseFirstLetter(string) {
    if (string == null)
        return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function saveNotificationsStatus(status) {
    $.post("/api/StaticNotifications/SaveSettings/", { '': status });
}