notificationsActive = true;

(function ($) {
    window.kendoConsole = {
        log: function (message, isError, silent) {
            if (!notificationsActive)
                return;
            requireConfigAndMore(["bootstrap-notifications"], function () {
                //true=errore, false=successo,  altrimenti chi chiama passa info o warning
                isError = isError === undefined ? "info" : isError;
                var type = isError;
                var title = "";
                if (type === false)
                    type = "success";
                else if (type === true)
                    type = "error";
                else if (type === "event")
                    type = "info";

                if (type === "success")
                    title = "Success";
                else if (type === "error")
                    title = "Error";
                else if (isError === "event")
                    title = "Event reminder";
                else title = "Info";

                if (typeof message == "object" && "responseText" in message)
                    message = message.responseText
                else if (typeof message == "string" && message.match(/^{.+}$/))
                    message = JSON.parse(message);
                message = message.ExceptionMessage || message.Message || message.content || message;

                var options = {
                    type: type == "error" ? "danger" : type,
                    offset: 60,
                    z_index: 100000
                };

                if (isMobile())
                    options.placement = {
                        align: "center"
                    };

                if (type == "error")
                    options.delay = 10000;

                if (isError == "event")
                    options.delay = 0;

                if (!silent) {
                    $.notify(
                        {
                            title: "<b>" + title + "</b>",
                            message: message,
                            icon: type == "error" ? "glyphicon glyphicon-warning-sign" : "glyphicon glyphicon-info-sign"
                        },
                        options
                    );
                }
                if (isError == true || isError == 'info' || type == "error") {
                    try {
                        angular.element($('[ng-controller*=NotificationsController]')).scope().nc.saveNotification(type, message);
                    } catch (e) {
                        window.notifications = window.notifications || {};
                        window.notifications.notes = window.notifications.notes || [];
                        window.notifications.notes.push({
                            Type: type,
                            Message: message
                        });
                    }
                }
            });
        }
    };

})(jQuery);