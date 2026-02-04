/// <reference path="jquery-2.1.1.min.js" />
function getContextResources() {
   var resources = [
            {
                field: "taskType_ID",
                title: getObjectText('tipoEvento'),
                dataTextField: "Description",
                dataValueField: "taskTypeID",
                dataColorField: "Color",
                dataSource: {
                    transport: {
                        read: {
                            url: "/api/Magic_Calendar_TaskTypes/Select",
                            type: "POST",
                            contentType: "application/json"
                        },
                        parameterMap: function (options, operation) {
                            if (operation == "read") {
                                return kendo.stringify(options);
                            }
                        }
                    },
                    //serverFiltering: true,
                    schema: {
                        data: "Data"
                    }
                }
            },
            {
                field: "TaskStatusId",
                title: getObjectText('statoEvento'),
                multiple: false,
                dataTextField: "text",
                dataValueField: "value",
                dataSource: {
                    transport: {
                        read: {
                            url: "/api/ManageFK/GetDropdownValues",
                            type: "POST",
                            contentType: "application/json",
                            data: { tablename: "Magic_Calendar_TaskStatus", valuefield: "TaskStatusID", textfield: "Description" }
                        },
                        parameterMap: function (options, operation) {
                            if (operation == "read") {
                                return kendo.stringify(options);
                            }
                        }
                    },
                }
            },
            {
                field: "ownerId",
                title: getObjectText('assegnatoA'),
                dataSource: {
                    transport: {
                        read: {
                            url: "/api/MAGIC_MMB_USERS/GetSchedulableUsers",
                            type: "GET",
                            contentType: "application/json"
                        },
                        parameterMap: function (options, operation) {
                            if (operation == "read") {
                                return kendo.stringify(options);
                            }
                        }
                    },
                    schema: {
                        // data: "Data",
                        parse: parseUsers
                    }
                }
            },
            {
                field: "teammembersattendees",
                title: getObjectText('invitati'),
                multiple: true,
                dataSource: {
                    transport: {
                        read: {
                            url: "/api/MAGIC_MMB_USERS/GetLeafs",
                            type: "GET",
                            contentType: "application/json"
                        },
                        parameterMap: function (options, operation) {
                            if (operation == "read") {
                                return kendo.stringify(options);
                            }
                        }
                    },
                    schema: {
                        //  data:"Data",
                        parse: parseUsers
                    }
                }
            },
            {
                field: "location_ID",
                title: getObjectText('location'),
                multiple: false,
                dataTextField: "text",
                dataValueField: "value",
                dataSource: {
                    transport: {
                        read: {
                            url: "/api/ManageFK/GetDropdownValues",
                            type: "POST",
                            contentType: "application/json",
                            data: { tablename: "v_Magic_CalendarLocations", valuefield: "ID", textfield: "Description" }
                        },
                        parameterMap: function (options, operation) {
                            if (operation == "read") {
                                return kendo.stringify(options);
                            }
                        }
                    },
                    schema: {parse: parseLocations}
                }
            }
    ];

    if (window.schedulerOverrideResources !== undefined)
        resources = window.schedulerOverrideResources;


    var resout = [];
    //#region Resources customization
    //customization remove resources 
     if (window.schedulerRemoveResourcesIndex) {  //se in AdminAreaCustomi
        $(resources).each(function (i, v) {
            if (window.schedulerRemoveResourcesIndex.indexOf(i) == -1)
                resout.push(resources[i]);
        });
    }//#endregion
    else resout = resources;
    
    return resout;

}

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function manageSelectableWkf(e)
{
    // vado a vedere se presente la selezione del portafoglio dati 
    var ugvidd = $("[data-container-for=UserGroupVisibility_ID] select").data("kendoDropDownList"); // e' una resource da aggiungere in AdminAreaCustomizations.js es. RefTree(3)
    if (ugvidd !== undefined) {
        if (ugvidd.value() != null)
            window.usr_ugviselected = ugvidd.value();
        ugvidd.bind("cascade", function (e) {
            window.usr_ugviselected = e.sender.dataItem().ID;
            $("[data-container-for=LinkedModelActivity_ID] select").data("kendoDropDownList").value(null);
            $("[data-container-for=ownerId] select").data("kendoDropDownList").value(null);
            $("[data-container-for=LinkedModelActivity_ID] select").data("kendoDropDownList").dataSource.read();
            $("[data-container-for=ownerId] select").data("kendoDropDownList").dataSource.read();
        })

    }
    //aggiungo in corrispondenza del change della drop dei workflow (Se presente) un evento che vada a resettare e ricaricare i valori possibili
    //per le drop degli utenti e dei tipi di task 
    var wrkactdd = $("[data-container-for=LinkedModelActivity_ID] select").data("kendoDropDownList"); // e' una resource da aggiungere in AdminAreaCustomizations.js es. RefTree(3)
    if (wrkactdd !== undefined) {
        if ($("[name=WorkflowEstimatedEnd]").length == 0) //aggiungo l' input per la data di fine prevista del processo
        {
            var htmlwrkdate = '<div class="k-edit-label wendest"><label for="WorkflowEstimatedEnd">' + getObjectText('workflowEstimatedEnd') + '</label></div>\
                                                        <div data-container-for="WorkflowEstimatedEnd" class="k-edit-field wendest"><input data-bind="value:WorkflowEstimatedEnd" name="WorkflowEstimatedEnd"></div>';
            $("div[data-container-for=LinkedModelActivity_ID].k-edit-field").after(htmlwrkdate);
            $("input[name=WorkflowEstimatedEnd]").kendoDatePicker();
            $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").enable(false);
            $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").value(e.event.WorkflowEstimatedEnd);
        }

        if (wrkactdd.value() != null) {
            window.usr_activityselected = wrkactdd.value();
            if (wrkactdd.value() != "")
                $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").enable(true);
        }
        wrkactdd.bind("cascade", function (e) {
            //metto in window l' attivita' selezionata in modo da poterla usare nei parameterMap delle drop / search di selezione degli utenti
            if (e.sender.dataItem() !== undefined) {
                window.usr_activityselected = e.sender.dataItem().Activity_ID;
                if (window.usr_activityselected != "")
                    $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").enable(true);
                else
                    $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").enable(false);
            }
            else {
                window.usr_activityselected = "";
                $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").enable(false);
            }
            //forzo una lettura degli utenti abilitati. la variabile usr_activityslected viene usata come filtro
            $("[data-container-for=ownerId] select").data("kendoDropDownList").value(null);
            $("[data-container-for=teammembersattendees] select").data("kendoMultiSelect").value(null);
            $("[data-container-for=ownerId] select").data("kendoDropDownList").dataSource.read();
            $("[data-container-for=teammembersattendees] select").data("kendoMultiSelect").dataSource.read();
            if (window.usr_activityselected != "") {
                //vado  a posizionare il tipo task corretto sulla base dell'  activity selezionata se esiste il legame sulla ActivityType
                $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/GetWithFilter",
                    data: JSON.stringify({ table: "dbo.v_Magic_ActTaskType", order: "1", where: "ActivityID =" + window.usr_activityselected }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        if (result.Count > 0) {
                            $.each(result.Data[0].Table, function (index, value) {
                                $("[data-container-for=taskType_ID] select").data("kendoDropDownList").value(value.TaskType_ID);
                            })
                        }
                    },
                    error: function (err) {
                        console.log("Task type - Activity Type link not found. Check dbo.Magic_WrkflwActivityType, field: TaskType_ID");
                    }
                });
            }
            else {
                //$(".wendest").fadeOut('slow');
                if ($("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker") !== undefined)
                    $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").value(null);
                $("[data-container-for=taskType_ID] select").data("kendoDropDownList").value(null);
            }
        });
    }
}

function getscheduler(stdate, query) {
    if (query.start || getCookie('calendarInterval')) {
        if (!query.start)
            var calendarInterval = $.parseJSON(getCookie('calendarInterval'));
        else
            var calendarInterval = {
                start: query.start,
                end: query.end || query.start
            };

        stdate = new Date(calendarInterval.start);
        var firstdayofweek = getMonday(new Date(calendarInterval.start));
        var lastdayofweek = getMonday(new Date(calendarInterval.end));
        lastdayofweek = new Date(lastdayofweek.setDate(firstdayofweek.getDate() + 7));
        DeleteCookie('calendarInterval');
    }
    else {
        //var stdate = new Date("2013/9/24");
        stdate.setHours(0, 0, 0, 0)
        var firstdayofweek = getMonday(stdate);
        var lastdayofweek = getMonday(stdate);
        lastdayofweek = new Date(lastdayofweek.setDate(firstdayofweek.getDate() + 7));
    }

    //altezzaCalendario = $(".page-content").height();
    var editableobj = {
        confirmation: getObjectText("CONFIRMATION")
    };
    if (window.schedulerEditableMove == false) //adminareacustomizations.js
        editableobj.move = false;
    if (window.schedulerEditableResize == false)
        editableobj.resize = false;

    var scheduler = {
    //    timezone: "Etc/UTC", // Use the etc timezone
        editable: editableobj,
        eventTemplate: schedulerTemplates["eventlayout"],
        allDayEventTemplate: schedulerTemplates["eventlayout"],
        date: stdate,
        mobile: true,
        showWorkHours: true,
        workDayStart: new Date("1900/1/1 7:00"),
        workDayEnd: new Date("1900/1/1 19:00"),
        height: 820,
        width: "auto",
        //startTime: new Date("1900/1/1 07:00"),
        messages: {
            today: getObjectText('oggi'),
            allDay: getObjectText('interaGiornata'),
            date: getObjectText('data'),
            time: getObjectText('orario'),
            event: getObjectText('evento'),
            save: getObjectText('save'),
            cancel: getObjectText('cancel'),
            destroy: getObjectText('Clearfilter'),
            deleteWindowTitle: getObjectText('deleteWindowTitle'),
            showFullDay: getObjectText('showFullDay'),
            showWorkDay: getObjectText('showWorkDay'),
            views: {
                day: getObjectText('giorno'),
                week: getObjectText('settimana'),
                workWeek: getObjectText('workWeek'),
                agenda: "Agenda",
                month: getObjectText('mese'),
            },
            recurrenceMessages: {
                deleteWindowTitle: getObjectText('deleteWindowTitle'),
                deleteWindowOccurrence: getObjectText('deleteWindowOccurrence'),
                deleteWindowSeries: getObjectText('deleteWindowSeries'),
                editWindowTitle: getObjectText('editWindowTitle'),
                editWindowOccurrence: getObjectText('editWindowOccurrence'),
                editWindowSeries: getObjectText('editWindowSeries')
            },
            editor: {
                title: getObjectText('title'),
                start: getObjectText('start'),
                end: getObjectText('end'),
                allDayEvent: getObjectText('allDayEvent'),
                description: getObjectText('description'),
                repeat: getObjectText('repeat'),
                timezone: getObjectText('timezone'),
                startTimezone: getObjectText('startTimezone'),
                endTimezone: getObjectText('endTimezone'),
                separateTimezones: getObjectText('separateTimezones'),
                timezoneEditorTitle: getObjectText('timezoneEditorTitle'),
                timezoneEditorButton: getObjectText('timezoneEditorButton'),
                timezoneTitle: getObjectText('timezoneTitle'),
                noTimezone: getObjectText('noTimezone'),
                editorTitle: getObjectText('editorTitle'),
            }

        },
        views: [
           {
               type: "day",
               //title: getObjectText('giorno'),
               selected: false
           },
           { type: "workWeek", selected: true },
           {
               type: "week",
               //title: getObjectText('settimana'),
               selected: false
           },
            {
                type: "month",
                //title: getObjectText('mese'),
                selected: false
            },
            {
                type: "agenda",
                selected: false
            },
            {
                type: getSearchView(),
                title: getObjectText('search')
            }
        ],
        edit: function (e) {
         
            e.container.find("textarea[name=description]").attr("rows", 4);

            $("input[data-role='datetimepicker']", e.container).each(function () {
                $(this).data("kendoDateTimePicker").timeView.options.min = new Date(2000, 0, 1, 7, 30, 0);
                $(this).data("kendoDateTimePicker").timeView.options.max = new Date(2000, 0, 1, 20, 0, 0);
            });
            if (e.event.LinkedModelWorkflow_ID != null)
                window.usr_workflowselected = e.event.LinkedModelWorkflow_ID;
            if (e.event.UserGroupVisibility_ID != null)
                window.usr_ugviselected = e.event.UserGroupVisibility_ID;

            if ($("[data-container-for=LinkedModelActivity_ID] select", e.container).length > 0)
                $("[data-container-for=LinkedModelActivity_ID] select", e.container).data("kendoDropDownList").dataSource.read();

            window.usr_activityselected = null;
            if (e.event.Editable == false)
                e.container.find(".k-edit-buttons").hide();

            $('.k-edit-form-container', e.container).addClass('scheduler-popup');
            $("[for=recurrenceRule]", e.container).hide();
            $("[data-container-for=recurrenceRule]", e.container).hide();

            //if google api key is set show the address selector
            var html = window.mapAK ? '<div class="alignFullWidth"><div class="k-edit-label"><label>' + getObjectText('address') + '</label></div><div class="k-edit-field"><input value="' + (e.event.address || '') + '" class="k-input k-textbox" type="text" data-bind="value:address" placeholder="' + getObjectText("insertaddress") + '" /></div><input value="' + (e.event.longitude || '') + '" type="hidden" data-bind="value:longitude" /><input value="' + (e.event.latitude || '') + '" type="hidden" data-bind="value:latitude" /></div>' : '';
            var notificationsHtml = "";
            notificationsHtml = '<div id="scheduler-notify-me" class="alignFullWidth"><div class="k-edit-label"><label>' + getObjectText('notifyme') + '</label></div><div class="k-edit-field"><div class="scheduler-notifications"><a href="javascript:void(0)" onclick="$(schedulerTemplates.notifyMeHtml).addClass(\'new\').insertBefore(this)">' + getObjectText("addNotification") + '</a></div></div></div>';
            if (window.schedulerShowAlertFlag == true) //da settare in AdminAreaCustomization.js a livello di singola applicazione
            {
                //se gestisco le notifiche con il flag disabilito la modalita' standard (flag a true solo in Training Courses) 
                notificationsHtml = "";
                if (e.event.AlertSent == true) {
                    var lastnotific = kendo.toString(e.event.AlertLastDate, "d");
                    notificationsHtml += '<div class="k-edit-label"><label for="AlertSent">' + getObjectText('notificationsent') + '</label></div>\
                            <div data-container-for="AlertSent" class="k-edit-field"><input type="checkbox" name="AlertSent" data-type="boolean" checked="checked" disabled></div>\
                            <div class="k-edit-label"><label for="AlertLastDate">' + getObjectText('notificationlastdate') + '</label></div>\
                            <div data-container-for="AlertLastDate" class="k-edit-field"><input  name="AlertLastDate" value="'+ lastnotific + '"  disabled></div>';
                }
                var check = e.event.Alert == true ? "checked=checked" : '';
                notificationsHtml += '<div class="k-edit-label"><label for="Alert">' + getObjectText('notification') + '</label></div>\
                            <div data-container-for="Alert" class="k-edit-field"><input type="checkbox" name="Alert" data-type="boolean" '+ check + '></div>';
            }
            html = (html ? html : "") + notificationsHtml;
            var $bOContainer = $('<div class="alignFullWidth"></div>'),
                isBOReadOnly = false,
                BOtags = [];
            $("div[data-container-for]:last", e.container)
                .after($bOContainer)
                .after(html);

            if (window.mapAK) {
                var $adr = $('[data-bind="value:address"]', e.container),
                    $lng = $('[data-bind="value:longitude"]', e.container),
                    $lat = $('[data-bind="value:latitude"]', e.container);

                $adr.change(function () {
                    $lng.val("");
                    $lat.val("");
                });

                require(["google-maps-api"], function () {
                    autocomplete = new google.maps.places.Autocomplete($adr[0], { types: ['geocode'] });
                    autocomplete.addListener('place_changed', function () {
                        var place = autocomplete.getPlace();
                        $lng.val(place.geometry.location.lng());
                        $lat.val(place.geometry.location.lat());
                    });
                });
            }

            if (e.event.BusinessObject_ID)
                BOtags = [{ Description: e.event.BusinessObjectDescription, Id: e.event.BusinessObject_ID, Type: e.event.BusinessObjectType }];
            else if (query.boType && query.boId) {
                isBOReadOnly = true;
                BOtags = [{ Description: query.boDescription, Id: query.boId, Type: query.boType }];
            }

            var boselectoroptions = {
                tags: BOtags,
                isReadonly: isBOReadOnly
            };
            if (typeof schedulerbOselectorOptions == "function")
                $.extend(boselectoroptions, schedulerbOselectorOptions(e));
            $bOContainer.bOSelector(boselectoroptions);

            $("#scheduler-notify-me", e.container).data("notifications_to_delete", []);
            $("#scheduler").data("initialStartDate", e.event.start);
            $("#scheduler").data("initialEndDate", e.event.end);
            $("#scheduler").data("initialOwner", e.event.ownerId);
            if (e.event.has_notifications) {
                $.ajax({
                    url: "/api/Scheduler/GetNotifications/" + e.event.taskId,
                    dataType: "json",
                    success: function (result) {
                        if (result.length) {
                            var list = $('.scheduler-notifications a');
                            $.each(result, function (k, notification) {
                                var olNoti = $(schedulerTemplates.notifyMeHtml).attr("data-id", notification.id);
                                olNoti.find("input").val(notification.value);
                                olNoti.find("select").each(function (k, v) {
                                    if(k == 0)
                                        $(v).val(notification.notify_via);
                                    else
                                        $(v).val(notification.unit);
                                });
                                list.before(olNoti);
                            });
                        }
                    }
                });
            }
            manageSelectableWkf(e);
            //se l' evento scaturisce da un processo non rendo editabile l' attivita' modello relativa
            if (e.event.LinkedActualWorkflow_ID !== null && e.event.LinkedActualWorkflow_ID !== undefined) {
                if ($("[data-container-for=LinkedModelActivity_ID] select").data("kendoDropDownList")!==undefined)
                    $("[data-container-for=LinkedModelActivity_ID] select").data("kendoDropDownList").enable(false);
                if (typeof overrideSchedulerWhenWorkflow == "function")
                    window["overrideSchedulerWhenWorkflow"](e);
            }
            if (typeof overrideSchedulerWorkedHoursTimesheet == "function")
                window["overrideSchedulerWorkedHoursTimesheet"](e);
            //remove timezone
            $('div[data-container-for=timezone]').prev().hide();
            $('div[data-container-for=timezone]').hide();
            $('div[data-container-for=start] > span, div[data-container-for=end] > span').each(function () { if ($(this).attr('data-bind')) $(this).remove(); });

            unescapeHTMLTags(['[data-container-for=ownerId] span.k-input', '[data-container-for=location_ID] span.k-input']);
            $('[data-container-for=ownerId] select')[0].kendoBindingTarget.target.bind('change', function () {
                unescapeHTMLTags(['[data-container-for=ownerId] span.k-input']);
            });
            if ($('[data-container-for=location_ID] select').length)
                $('[data-container-for=location_ID] select')[0].kendoBindingTarget.target.bind('change', function () {
                    unescapeHTMLTags(['[data-container-for=location_ID] span.k-input']);
                });

            function unescapeHTMLTags(inputsToUnescape) {
                $.each(inputsToUnescape, function (k, v) {
                    var el = $(v);
                    var value = el.html();
                    if (value) {
                        value = value.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
                        el.html(value);
                    }
                });
            }
        },
        navigate: function (e) {
            dstart = new Date(e.date);
            dend = new Date(e.date);
            var backwardoffset = 0;
            var forwardoffset = 0;

            if (e.action == "next") { //pressione di next o previous sul calendario (frecce)
                if (e.view == "week" || e.view == "workWeek" || e.view == "agenda") {
                    dend = new Date(dend.setDate(dend.getDate() + (7)));
                }
                else if (e.view == "month") {
                    dend = new Date(dend.setDate(dend.getDate() + (31)));
                    backwardoffset = 7;
                    forwardoffset = 8;
                }
                else if (e.view == "day") {
                    dstart = new Date(dstart.setDate(dstart.getDate() - 1));
                    dend = new Date(dend.setDate(dend.getDate() + (2)));
                }
            }
            else if (e.action == "previous") {
                if (e.view == "week" || e.view == "workWeek") {
                    dstart = new Date(dstart.setDate(dstart.getDate() - (7)));
                    dend = new Date(dend.setDate(dend.getDate() + (2)));
                }
                else if(e.view == "agenda"){
                    dstart = new Date(dstart.setDate(dstart.getDate() - (2)));
                    dend = new Date(dend.setDate(dend.getDate() + (8)));
                }
                else if (e.view == "month") {
                    dstart = new Date(dstart.setDate(dstart.getDate() - (31)));
                    backwardoffset = 7;
                    forwardoffset = 8;
                }
                else if (e.view == "day") {
                    dend = new Date(dend.setDate(dend.getDate() + (2)));
                    dstart = new Date(dstart.setDate(dstart.getDate() - 1));
                }
            }
            else if (e.action === "changeDate" || e.action === "changeView" || e.action === "today" || e.action === "changeWorkDay") {
                if (e.view == "week" || e.view == "workWeek" || e.view == "agenda") {
                    dstart = getMonday(e.date);
                    dend = getMonday(stdate);
                    dend = new Date(dend.setDate(dstart.getDate() + 7));
                }
                else if (e.view == "month") {

                    dstart = new Date(dstart.getFullYear(), dstart.getMonth(), 1, 0, 0, 0, 0);
                    dend = new Date(dstart);
                    dend = new Date(dend.setDate(dend.getDate() + (31)));
                    backwardoffset = 7;
                    forwardoffset = 8;
                }
                else if (e.view == "day") {

                    dstart = new Date(e.date);
                    dend = new Date(e.date);
                    dend = new Date(dend.setDate(dstart.getDate() + 2));
                    dstart = new Date(dstart.setDate(dstart.getDate() - 1));

                }
            }

            $('#scheduler-search').hide();
            $('.k-scheduler-navigation').show();

            var scheduler = $("#scheduler").data("kendoScheduler");
            
            var offsetdstart = new Date(dstart);
            offsetdstart.setDate(dstart.getDate() - backwardoffset);
            var offsetdend = new Date(dend);
            offsetdend.setDate(dend.getDate() + forwardoffset);

            scheduler.dataSource.filter(getSchedulerFilterFromHtml(offsetdstart, offsetdend));
            if (scheduler.view() != e.view)
                scheduler.view(e.view);
        },
        dataSource: getschedulerdatasource(firstdayofweek, lastdayofweek),
        resources: getContextResources(),
        cancel: function (e) {
        //    $("#schedulertoppanel").show();
        },
        save: manageModifications,
        remove: function (e) {
            e.preventDefault();

            if (e.event.Editable == false)
            {
                kendoConsole.log(getObjectText("missingrightschangeevnt"), "info");
                return;
            }

            var method = "PostD";
            var controller = "/api/Scheduler";
            var id = e.event.id;
            var data = e.event;
            data.old_start = $("#scheduler").data("initialStartDate");
            data.old_end = $("#scheduler").data("initialEndDate");
            data.old_owner = $("#scheduler").data("initialOwner");
            var uid = e.event.uid;
            var url = controller + "/" + method + "/" + id;
            if (window.schedulerDestroy !== undefined && window.schedulerDestroy !== null)
                url = window.schedulerDestroy+"/"+id;
            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data:JSON.stringify(data),
                success: function (result) {
                    if (result.msgtype === "WARN")
                        kendoConsole.log(result.message, "info");
                    else 
                        kendoConsole.log(getObjectText("calendareventok"), false);
                    var scheduler = $("#scheduler").data("kendoScheduler");
                    scheduler.dataSource.read();
                    //$("#schedulertoppanel").show();

                },
                error: function (result) {
                    kendoConsole.log(result.responseText, true);
                }
            });
        },
        moveStart: function (e) {
            if (e.event.Editable == false) {
                kendoConsole.log(getObjectText("missingrightschangeevnt"), "info");
                e.preventDefault();
                return;
            }
            $("#scheduler").data("initialStartDate", e.event.start);
            $("#scheduler").data("initialEndDate", e.event.end);
        },
        resizeStart: function (e) {
            if (e.event.Editable == false) {
                kendoConsole.log(getObjectText("missingrightschangeevnt"), "info");
                e.preventDefault();
                return;
            }

        }
    };

    return scheduler;
}

function manageModifications(e) {
    //e.preventDefault();
    var alert = false;
    if ($("input[name=Alert]").is(':checked')) {
        if (!confirm(getObjectText("alert")))
            return;
        alert = true;
    }
    var controller = "/api/Scheduler";
    var data = e.event;
    data.Alert = alert;
    //annullo l' offset che kendo aggiunge automaticamente  
    var offset = new Date().getTimezoneOffset();
    //offset will be in minutes. Add/subtract the minutes from your date
    if (!data.startUTC) { //D.T 9/3/2016:Stop adding offset if previously i had server side errors !!!
        data.startUTC = new Date(data.start.getTime());
        data.endUTC = new Date(data.end.getTime());
        data.start = toTimeZoneLessString(data.start);
        data.end = toTimeZoneLessString(data.end);
    }
    //se presente vado  a  leggere la data di fine workflow e la bindo al campo 
    if ($("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker") !== undefined) {
        data.WorkflowEstimatedEnd = $("input[name=WorkflowEstimatedEnd]").data("kendoDatePicker").value();
        if (data.WorkflowEstimatedEnd!==null)
            data.WorkflowEstimatedEnd.setMinutes(data.WorkflowEstimatedEnd.getMinutes() - offset);
    }

    if (window.mapAK) {
        data.address = $('[data-bind="value:address"]', e.container).val();
        data.longitude = $('[data-bind="value:longitude"]', e.container).val() || null;
        data.latitude = $('[data-bind="value:latitude"]', e.container).val() || null;
    }


    var BOType = "";
    var BOID = null;
    //Get Bo infos from Business Object Selector
    try {
        var tags = $(".bo-tagbox", e.container).bOSelector('getBOs');
        if (tags.length > 0) {
            data.BusinessObjectType = tags[0].Type;
            data.BusinessObject_ID = tags[0].Id;
        }
        else {
            data.BusinessObjectType = null;
            data.BusinessObject_ID = null;
        }
    }
    catch (e) {
        console.log("Problems while getting BO info");
    }

    //notifications
    data.notifications = [];
    if ($("#scheduler").data("initialStartDate"))
        data.old_start = toTimeZoneLessString($("#scheduler").data("initialStartDate"));
    if ($("#scheduler").data("initialEndDate"))
        data.old_end = toTimeZoneLessString($("#scheduler").data("initialEndDate"));
    data.old_owner = $("#scheduler").data("initialOwner");
    var ntd = $("#scheduler-notify-me").data("notifications_to_delete");
    var notiCheck = {};
    $("#scheduler-notify-me .scheduler-notifications .form-inline").each(function (k, notification) {
        notification = $(notification);
        var amount = notification.find("input").val(),
            selects = $(notification).find("select"),
            check = amount + selects[1].value + selects[0].value;
        if (amount != "" && !isNaN(amount) && notification.hasClass("new") && !notiCheck[check]) {
            data.notifications.push({ value: amount, unit: selects[1].value, notify_via: selects[0].value });
        }
        notiCheck[check] = true;
    });
    data.notifications_to_delete = ntd ? ntd.join(",") : "";

    var url = '';

    if (data.id === 0) {//create
        method = "PostI";
        url = controller + "/" + method;
        if (window.schedulerCreate !== undefined && window.schedulerCreate !== null)
            url = window.schedulerCreate;
    }
    else {
        method = "PostU" + "/" + data.id.toString();
        url = controller + "/" + method;
        if (window.schedulerUpdate !== undefined && window.schedulerUpdate !== null)
            url = window.schedulerUpdate + "/" + data.id.toString();
    }

    $.ajax({
        type: "POST",
        async:false,
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(data),
        success: function (result) {
            if (result.msgtype === "WARN")
                kendoConsole.log(result.message, "info");
            else
            kendoConsole.log(getObjectText("calendareventok"), false);
            var scheduler = $("#scheduler").data("kendoScheduler");
            scheduler.dataSource.read();
        },
        error: function (result) {
            e.preventDefault();
            kendoConsole.log(result.responseText, true);
        }
    });

}

function getschedulerdatasource(dstart, dend) {

    var tasktypedef = window.schedulerDefaultTaskType_ID == undefined ? null : window.schedulerDefaultTaskType_ID;
    var taskmodel = { from: "taskType_ID", validation: { required: true } };
    if (tasktypedef !== null)
        taskmodel.defaultValue = tasktypedef;
    var readurl = "/api/Scheduler/Select";
    if (typeof window.schedulerRead !== "undefined")
        readurl = window.schedulerRead;

    var datasource = {
        autoBind: true,
        serverFiltering: true,
        mobile: true,
        filter: getSchedulerFilterFromHtml(dstart, dend),
        transport: {
            read: {
                url: readurl,
                type: "POST",
                contentType: "application/json"
            },
            update: {},
            create: {},
            destroy: {},
            parameterMap: function (options, operation) {
                if (operation != "destroy")
                    return kendo.stringify(options);
                return options;
            }
        },
        schema: {
            data: "Data",
            model: {
                id: "taskId",
                fields: {
                    taskId: { from: "taskId", type: "number" },
                    title: { from: "title", defaultValue: "N/A", validation: { required: true } },
                    taskType_ID: taskmodel,
                    LinkedModelWorkflow_ID: { from: "LinkedModelWorkflow_ID", nullable: true },
                    LinkedModelActivity_ID: { from: "LinkedModelActivity_ID", nullable: true },
                    BusinessObject_ID: { from: "BusinessObject_ID", nullable: true },
                    start: { type: "date", from: "start" ,validation: { required: true }},
                    end: { type: "date", from: "end", validation: { required: true } },
                    startTimezone: { from: "startTimezone" },
                    endTimezone: { from: "endTimezone" },
                    description: { from: "description" },
                    recurrenceId: { from: "recurrenceId", nullable: true },
                    recurrenceRule: { from: "recurrenceRule" },
                    recurrenceException: { from: "recurrenceException" },
                    ownerId: { from: "ownerId", nullable: true },
                    isAllDay: { type: "boolean", from: "isAllDay" },
                    teammembersattendees: { from: "teammembersattendees", nullable: true },
                    TaskStatusId: { from: "TaskStatusId", defaultValue: 1, validation: { required: true } },
                    Notes: { from: "Notes", nullable: true },
                    Editable: { from: "Editable", nullable: true },
                    location_ID: { from: "location_ID", nullable: true },
                    Alert: { type: "boolean", from: "Alert"},
                    AlertSent: { type: "boolean", from: "AlertSent", nullable: true },
                    AlertLastDate: { type: "date", from: "AlertLastDate", nullable: true },
                    WorkflowEstimatedEnd: { type: "date", from: "WorkflowEstimatedEnd", nullable: true },
                    UserGroupVisibility_ID: { from: "UserGroupVisibility_ID", nullable: true },
                    address: { from: "address", nullable: true },
                    longitude: { type: "number", from: "longitude", nullable: true },
                    latitude: { type: "number", from: "latitude", nullable: true }
                }

            }

        }

    }

    return datasource;
}

function setdatasource(url, selector, value, currentvalue) {

    var datasource = new kendo.data.DataSource({
        transport: {
            read: {
                async: true,
                url: url + String(value == null ? "0" : value),
                dataType: "json",
                type: "GET"

            }
        },
        change: function (e) {

            var dropdown = $(selector).data("kendoDropDownList");
            if (e.items.length == 0) {
                dropdown.text("N/A");
                dropdown.enable(false);
            }
            else {
                dropdown.enable(true);
                dropdown.refresh();
                if (currentvalue != undefined)
                    dropdown.value(String(currentvalue));
            }
        }
    });

    var dropdown = $(selector).data("kendoDropDownList");
    if (dropdown != null) {
        dropdown.setDataSource(datasource);
        dropdown.dataSource.read();
    }
}
//function CalendarDropDownChange(e) {
//    var value = "0";
//    //testo il nome del campo del calendario
//    if (e.sender.element[0].name == "taskType_ID") {
//        value = e.sender.value();
//        var url = "/api/Processi/GetByTaskType/";
//        var selector = "select[name='LinkedSpotProcess_ID']";
//        setdatasource(url, selector, value == "" ? "0" : value);


//        $("select[name='activityType_ID']").data("kendoDropDownList").select(0);
//        $("select[name='activityType_ID']").data("kendoDropDownList").enable(false);

//    }
//    if (e.sender.element[0].name == "LinkedSpotProcess_ID") {
//        value = e.sender.value();
//        var url = "/api/ProcessiAttivita/GetByProcess/";
//        var selector = "select[name='activityType_ID']";

//        setdatasource(url, selector, value == "" ? "0" : value);

//        $("select[name='activityType_ID']").data("kendoDropDownList").enable(true);
//    }
//    if (e.sender.element[0].name == "TaskStatusId") {
//        value = e.sender.value();
//        if (value == 3)
//            createnextevent();
//    }

//}

function typesMultiSelectChange(e) {
    filterScheduler();
    return;
}

function cal_click(e) {
    var theEvent = this.dataItem($(e.currentTarget).closest("tr"));
    var theeventdate = theEvent.start;

    var scheduler = $("#scheduler").data('kendoScheduler');
    scheduler.date(theeventdate);
    scheduler.view("day");
    var dend = new Date(theeventdate);
    dend = new Date(dend.setDate(dend.getDate() + 2));
    theeventdate = new Date(theeventdate.setDate(theeventdate.getDate() - 1));
    scheduler.setDataSource(new kendo.data.SchedulerDataSource(getschedulerdatasource(theeventdate, dend)));
    var wnd = $("#modalSearch").data("kendoWindow");
    wnd.close();

}

//function createnextevent() {
//    // $("#completedcheck").after('<div class="k-edit-label"> <label for="newtask" style="color: black;">Creare Task Successivo</label>  </div> <div class="k-edit-field" id="newtask">  <input type="checkbox" name="newtask" data-type="boolean"  onchange="createnexteventtemplate()"></div>');
//    //creare 1 drop di selezione prox attivita con default alla data success.
//    // drop di selezione a chi e' assegnata l' attivita' 
//    console.log("event closure detected");

//}

var schedulerTemplates = {
    schedulerLayoutTemplate: '\
  <div class="SchedulerContainer">\
    <div id="scheduler"></div>\
  </div>\
  <div id="modalSearch"></div>\
  ',
    SearchEventsGridTemplate: '\
        <div class="k-edit-form-container">\
            <div id="searchgrid" style="width:890px;">\
        </div>',
    'task-template': '\
    <div class="type-template">\
        <img src="/Magic/Styles/Images/#= taskTypeDescription #.png">\
        <p>\
           :: #:title# :: #: kendo.toString(start, "hh:mm") # - #: kendo.toString(end, "hh:mm") #\
        </p>\
        <h3>#: title #</h3>\
    </div>',
    tagTemplate: '\
    <li class="k-button" unselectable="on" style="border-top:3px solid #: Color #">\
        <span unselectable="on">#: Description #</span>\
        <span unselectable="on" class="k-icon k-delete">delete</span>\
    </li>',
    eventlayout: function (event) {
        return '<div>' + (event.has_notifications ? '<i class="fa fa-bell"></i> ' : '') + event.title + '</div><div>' + (event.description ? ' :: ' + event.description : '') + '</div>';
    },
    notifyMeHtml: '<div class="form-inline">\
                    <div class="form-group">\
                        <select class="k-input">\
                            <option value="popup">popup</option>\
                            <option value="mail">mail</option>\
                        </select>\
                    </div>\
                    <div class="form-group">\
                        <input type="text" class="k-input" />\
                    </div>\
                    <div class="form-group">\
                        <select class="k-input">\
                            <option value="m">' + getObjectText("minutes") + '</option>\
                            <option value="h">' + getObjectText("hours") + '</option>\
                            <option value="d">' + getObjectText("days") + '</option>\
                            <option value="w">' + getObjectText("weeks") + '</option>\
                        </select>\
                    </div>\
                    <div class="form-group" onclick="removeNotificationItem(this)">&nbsp;<a href="javascript:void(0)">X</a></div>\
                  </div>'
}

function getSearchView() {
    var kendo = window.kendo,
        ui = kendo.ui,
        NS = ".kendoSearchView";


    return ui.AgendaView.extend({

        init: function (element, options){
            ui.AgendaView.fn.init.call(this, element, options);
            var val = '';
            var scheduler = $("#scheduler").data("kendoScheduler");
            if (element.find('#scheduler-search').length < 1) {
                $('<input class="k-state-default form-control" id="scheduler-search" type="text" placeholder="' + getObjectText('search') + '">').insertAfter('.k-scheduler-navigation');
                $('#scheduler-search').on('input', function () {
                    if (typeof waitToFilterScheduler !== 'undefined')
                        clearTimeout(waitToFilterScheduler);
                    var val = this.value;
                    if (val.length > 2) {
                        waitToFilterScheduler = setTimeout(function () {
                            scheduler.dataSource.filter({ logic: "or", filters: [{ field: "title", operator: "contains", value: val }, { field: "description", operator: "contains", value: val }] });
                        }, 1000);
                    }
                    else
                        $('.k-scheduler-table').eq(1).html('');
                });
                $('#scheduler-search').keypress(function (event) { return event.keyCode != 13; });
            }
            else {
                var val = element.find('#scheduler-search').val();
                if (val.length > 2) {
                    scheduler.dataSource.filter({ logic: "or", filters: [{ field: "title", operator: "contains", value: val }, { field: "description", operator: "contains", value: val }] });
                }
                element.find('#scheduler-search').show();
            }
            element.find('.k-scheduler-navigation').hide();
        },
        startDate: function () {
            var date = new Date(-864000000000000);
            return date;
        },
        endDate: function () {
            var date = new Date(864000000000000);
            return date;
        },
        render: function (events) {
            ui.AgendaView.fn.render.call(this, events);
            var val = $('#scheduler-search').val();
            if (val.length <= 2) {
                this.content.find("table").empty();
            }
        },
        resize: function () {
           
        }

    });
}

function parseUsers(response) {
    var resvet = new Array();
    for (var i = 0; i < response.length; i++) {
        var resobj = {};
        var text = '';
        if (response[i].text)
            text = response[i].text
        else
            text = response[i].FirstName + ' ' + response[i].LastName;
        if ($('.userTree [data-userid=' + response[i].UserID + ']').length > 0)
            text = $('.userTree [data-userid=' + response[i].UserID + ']')[0].outerHTML + text;
        resobj.text = text;
        resobj.value = response[i].UserID;
        resvet.push(resobj);
    }
    response = resvet;
    return response;
}

function parseLocations(loc) {
    if ($('.locationsTree').length > 0) {
        for (var i = 0; i < loc.length; i++) {
            if ($('.locationsTree [data-location-id=' + loc[i].value + ']').length)
                loc[i].text = $('.locationsTree [data-location-id=' + loc[i].value + ']')[0].outerHTML.replace('calendar-label csml', 'calendar-label csml c-drop') + '<span style="position: absolute;">' + loc[i].text + '</span>';
        }
    }
    return loc;
}

function schedulerGoTo(date, view) {
    if (!date)
        date = new Date();
    if (!view)
        view = 'day';
    var scheduler = $("#scheduler").data("kendoScheduler");
    scheduler.date(date);
    scheduler.view(view);
}

function refreshSchedulerLayout() {
    $('#scheduler').data('kendoScheduler').refresh();
}

function filterScheduler() {
    var scheduler = $("#scheduler").data("kendoScheduler"),
        view = scheduler.view(),
        dstart = view.startDate(),
        dend = view.endDate();
    scheduler.dataSource.filter(getSchedulerFilterFromHtml(dstart, dend));
}

function getSchedulerFilterFromHtml(dstart, dend) {
    var filter = { logic: "and", filters: [{ field: "end", operator: "gte", value: dstart }, { field: "start", operator: "lte", value: dend }] },
    customFilter = { logic: "and", filters: [] };
    $("#calendarAccordion div.panel").each(function (k, panel) {
        panel = $(panel);
        var fieldName = panel.attr("field-name"),
            fieldFilter = [];
        panel.find("input[value]").each(function (k, input) {
            if (input.checked) {
                if (input.value == 0)
                    fieldFilter.push({ field: fieldName, operator: "eq", value: null });
                else
                    fieldFilter.push({ field: fieldName, operator: "eq", value: input.value });
            }
        });
        if (fieldFilter.length)
            customFilter.filters.push({ logic: "or", filters: fieldFilter });
    });
    if (customFilter.filters.length)
        filter.filters.push(customFilter);
    return filter;
}

function removeNotificationItem(el) {
    var self = $(el);
    if (!self.parent().hasClass("new")) {
        var s = $("#scheduler-notify-me");
        var a = s.data("notifications_to_delete");
        a.push(self.parent().attr("data-id"));
        s.data("notifications_to_delete", a);
    }
    self.parent().remove();
}
function resetCalendarSettings()
{
    setConfig('calendar', null);
}
function saveSchedulerSettings(element)
{
    var $scheduler = $(element).closest(".k-scheduler");
    var scheduler = $scheduler.data('kendoScheduler');
    var dstart = scheduler.view().startDate,
    dend = scheduler.view().endDate;
    var settings = {
        view: scheduler.view().name,
        filter:getSchedulerFilterFromHtml(dstart, dend) 
    };
    setConfig("calendar", settings);
}