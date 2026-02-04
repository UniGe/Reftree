//var user = $.ajax({ async: false, url: "/api/Magic_Mmb_Users/getSessionUser", contentType: "application/json; charset=utf-8", dataType: "json" });

function getJobNotificationDataByUser() {
    //  var $tbl = $('#tblJobInfo');
    $.ajax({
        url: "/api/Magic_Mmb_Users/getSessionUser",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success:
                    function (user) {
                        $.ajax({
                            url: '../api/NotificationValues/GetJobNotifications/' + user,
                            type: 'GET',
                            datatype: 'json',
                            success: function (data) {
                                // data contains the data of the monitored table.The controller initializes a SqlDependencies class tied to the Table with the JOB NOTIFICATIONS 
                                for (i = 0; i < data.length; i++) {
                                    $.ajax({ async: false, url: "/api/NotificationValues/setAsNotified/" + data[i].JobID, contentType: "application/json; charset=utf-8", dataType: "json" });
                                    kendoConsole.log(data[i].Name + " :: " + data[i].LastExecutionDate, "info");
                                }
                            }
                        });

                    }
    });
}

function pushUserNotification(name, showAll) {
    getJobNotificationDataByUser();
}

function broadcastMessage(name, message) {
    // Html encode display name and message. 
    kendoConsole.log(name + "::" + message, false);
}

function getConsoleMessage(name, message, state) {
    // Html encode display name and message. 
    kendoConsole.log(name + "::" + message, state);

};

