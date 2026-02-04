//var tasktypesds = getdatasource("MAGIC_CALENDAR_TASKTYPES", "taskTypeID", "GetAll", "desc", null);
components = [];
//if (typeof (schedulerFilter) == 'undefined') {
//    schedulerFilter = {};
//}
waitToRenderScheduler = null;
schedulerImgErrors = {};

function loadscript()
{
    if ($(".page-title #spansmall").length>0)
            $(".page-title #spansmall").text("");
    var userTreeReady = $.Deferred(), customFilterHtmlReady = $.Deferred();

    var functionlayouttemplate = kendo.template(schedulerTemplates["schedulerLayoutTemplate"]);
    $("#appcontainer").html(functionlayouttemplate);
    
    $("#appcontainer").wrapInner('<div id="rightPane" class="col-md-12"></div>');
    $("#appcontainer").prepend('<div id="leftPane" style="display: none" class="col-md-2"></div>');
    $("#appcontainer").wrapInner('<div id="appcontainer2" class="row"></div>');
    var tree = new Array();

    var getusers =window.calendarAlternativeUserTree ? window.calendarAlternativeUserTree : function () {
        var deferred = $.Deferred(), maintree = [], tree = [];
        buildXMLStoredProcedureJSONDataSource({}, function (res) {
            $.each(res.items, function (k, user) {
                tree.push({ items: [], USERID: user.UserID, symbol: "", assettoexplode: user.text });
            });
            maintree.push({ assettoexplode: getObjectText('user'), items: tree });
            maintree.push({ items: [], USERID: 0, symbol: '', assettoexplode: getObjectText('showUnassigned') });
            deferred.resolve(maintree);
        }, 'dbo.Magic_GetSchedulableUser').read();
        return deferred.promise();
    };
    //creazione dell' albero degli utenti a partire dallo usergroup selezionato (da SessionHandler)
    getusers().then(function (tree) {
            components.unshift({ assettoexplode: getObjectText("filterByCalendar"), items: tree });
            userTreeReady.resolve();
    });
  
    var locationsReady = $.ajax({
        type: "GET",
		url: "/api/MAGIC_CALENDAR_TASKSTATUS/GetAvailableLocations",
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    });

    var statusReady = $.ajax({
        type: "GET",
		url: "/api/MAGIC_CALENDAR_TASKSTATUS/GetAvailableStatuses",
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    });
    var taskTypesReady = $.ajax({
        url: "/api/MAGIC_CALENDAR_TASKTYPES/GetAll",
        contentType: "application/json"
    });
    $.when(userTreeReady, locationsReady, statusReady, getConfig("calendar"), taskTypesReady).done(function (userTree, locationsTree, statusTree, calendarConfig,taskTypes) {
        if (taskTypes[1] == "success" && taskTypes[0].length > 0) {
            var items_ = [];
            $.each(taskTypes[0], function (k, v) {
                items_.push({ assettoexplode: v.Description, items: [], taskTypeID: v.taskTypeID, color: v.Color, type: "Type" });
            });
            var tree_ = [{ assettoexplode: getObjectText('filtraPerTipologia'), expanded: false, items: items_, type: "Group" }];
            components.push(tree_[0]);
        }
        if (locationsTree[1] == "success" && locationsTree[0].Count > 0) {
            var items = [];
            $.each(locationsTree[0].Data[0].Table, function (k, v) {
                items.push({ assettoexplode: v.Description, items: [], location_ID: v.ID, type: "Location", expanded: true, color: v.Color });
            });
            var tree = [{ assettoexplode: getObjectText('filterByLocation'), expanded: false, items: items, type: "Group" }];
            components.push(tree[0]);
        }

        if (statusTree[1] == "success" && statusTree[0].Count > 0) {
                var items = [];
                $.each(statusTree[0].Data[0].Table, function (k, v) {
                    items.push({ assettoexplode: v.Description, items: [], taskStatusID: v.taskStatusID, color: v.Color, code: v.Code, type:"Status" });
                });
                var tree = [{ assettoexplode: getObjectText('filterByStatus'), expanded: false, items: items, type: "Group" }];
                components.push(tree[0]);
            }
           

            var query = (function (a) {
                if (a == "") return {};
                var b = {};
                for (var i = 0; i < a.length; ++i) {
                    var p = a[i].split('=', 2);
                    if (p.length == 1)
                        b[p[0]] = "";
                    else
                        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
                }
                return b;
            })(window.location.search.substr(1).split('&'));
            var accordion = new MagicAccordion(components, function (item, depth, panel) {
                var html = '';
                if (depth != 0 && item.items.length > 0)
                    html = '<input  type="checkbox" class="checkAll">' + item.assettoexplode;
                else if (panel == 0 && item.USERID == 0)
                    html += '<label><input class="ck" value="' + item.USERID + '" type="checkbox">' + item.assettoexplode + '</label>';
                else if (panel == 1 && item.location_ID == 0)
                    html += '<label><input class="ck" value="' + item.location_ID + '"  type="checkbox">' + item.assettoexplode + '</label>';
                else if (panel == 0 && depth > 1 || panel > 0 && depth > 0) {
                    if (panel == 0)
                        if (item.symbol != null && item.symbol != '')
                            html += '<label><input class="ck" value="' + item.USERID + '"  type="checkbox"><img class="calendar-img" data-userid="' + item.USERID + '" src="' + item.symbol + '" onerror="calendarImgError(this, \'' + item.assettoexplode + '\')">' + item.assettoexplode + '</label>';
                        else {
                            var color = getRandomColor();
                            color += isTooDark(color) ? "; color: white" : "";
                            html += '<label><input class="ck" value="' + item.USERID + '"  type="checkbox"><span data-userid="' + item.USERID + '" class="calendar-label" style="background-color: ' + color + '">' + getInitials(item.assettoexplode) + '</span>' + item.assettoexplode + '</label>';
                        }
                    else if (panel == 2) {
                        if (item.color)
                            html += '<label><input class="ck" value="' + item.location_ID + '"  type="checkbox"><span data-location-id="' + item.location_ID + '" class="calendar-label csml" style="background-color: ' + item.color + ';"></span>' + item.assettoexplode + '</label>';
                        else
                            html += '<label><input class="ck" value="' + item.location_ID + '"  type="checkbox">' + item.assettoexplode + '</label>';
                    }
                    else if (panel == 1) {
                        html += '<label><input class="ck" value="' + item.taskTypeID + '"  type="checkbox"><span class="calendar-label csml" style="background-color: ' + item.color + ';"></span>' + item.assettoexplode + '</label>';
                    }
                    else if (panel == 3) {
                        html += '<label><input class="ck" value="' + item.taskStatusID + '" type="checkbox">' + item.assettoexplode + '</label>';
                      //  if (item.code == "New" || item.code == "InProg") {
                            //html += '<label><input class="ck" value="' + item.taskStatusID + '" type="checkbox" checked>' + item.assettoexplode + '</label>';
                      //  }
                      //  else
                      //      html += '<label><input class="ck" value="' + item.taskStatusID + '" type="checkbox">' + item.assettoexplode + '</label>';
                    }
                }
                else
                    html = item.assettoexplode;

                return html;
            }, { id: "calendarAccordion", classes: ['userTree', 'typesTree', 'locationsTree', 'statusTree'] });
            $('#leftPane').html(accordion.getAccordionHtml());
            $(".userTree").attr("field-name", "ownerId");
            $(".typesTree").attr("field-name", "taskType_ID");
            $(".locationsTree").attr("field-name", "location_ID");
            $(".statusTree").attr("field-name", "TaskStatusId");

            if (window.customCalendarFiltersHtml) {
                window.customCalendarFiltersHtml().then(function (html) { $("#calendarAccordion").append(html); customFilterHtmlReady.resolve(); });
            }
            else
                customFilterHtmlReady.resolve();

            $.when(customFilterHtmlReady).done(function () {
                $('#calendarAccordion input.checkAll').change(function () {
                    var changeTo = this.checked;
                    var el = $(this).parent().find('ul input:checkbox');
                    el.each(function (k, v) {
                        v.checked = changeTo;
                        if (k == el.length - 1) {
                            $(v).trigger('change');
                        }
                    });
                });

                var schedulerobj = getscheduler(new Date(), query);
                var $scheduler = $("#scheduler");
                var scheduler = $scheduler.kendoScheduler(schedulerobj).data('kendoScheduler');
                
                calendarConfig = calendarConfig || {};
                var shouldRefreshStandardView = false;
                var shouldRefreshStandardFilters = false;
                //#region config
                if ("view" in calendarConfig)
                    shouldRefreshStandardView = true;
                
                $('<a class="k-button resetBtn" title="' + getObjectText("resetSettings") + '" data-role="tooltip" style="margin-left: 5px; float:right;" href="javascript:void(0)" onclick="resetCalendarSettings()"><span class="fa fa-trash-o"></span></a><a class="k-button" title="' + getObjectText("saveSettings") + '" data-role="tooltip" style="margin-left: 20px; float:right;" href="javascript:void(0)" onclick="saveSchedulerSettings(this)"><span class="fa fa-save"></span></a><a class="k-button" title="Map" style="margin-right: -15px; margin-left: 20px; float:right;" href="javascript:void(0)" onclick="showSchedulerMap(this)"><span class="fa fa-globe"></span></a>' + (window.GoogleCalendarsSynchActive ? '<a class="k-button" title="' + getObjectText("importfromgcal") + '" style="margin-right: -15px; margin-left: 10px; float:right;" href="javascript:void(0)" onclick="getEventsFromGoogle()"><span class="fa fa-google"></span></a>' : '')).insertBefore($scheduler.find(".k-scheduler-views"));

                if ("filter" in calendarConfig) {
                    //date independent filters: ownerId = 0 $('span[data-userid=""]').prev("input"), TaskTypeId = 1 [input], location_ID = 2 ,TaskStatusId = 3
                    if (calendarConfig.filter.filters && calendarConfig.filter.filters[2] && calendarConfig.filter.filters[2].filters) {
                        $.each(calendarConfig.filter.filters[2].filters, function (i, v) {
                            if (v.filters)
                                $.each(v.filters, function (j, value) {
                                    var htmlvalue = value.value ? value.value : "0";
                                    switch (value.field) {
                                        case "ownerId": $('div .userTree[field-name="ownerId"] input[value="' + htmlvalue + '"]').attr("checked", "checked"); break;
                                        case "taskType_ID": $('div .typesTree[field-name="taskType_ID"] input[value="' + htmlvalue + '"]').attr("checked", "checked"); break;
                                        case "location_ID": $('div .locationsTree[field-name="location_ID"] input[value="' + htmlvalue + '"]').attr("checked", "checked"); break;
                                        case "TaskStatusId": $('div .statusTree[field-name="TaskStatusId"] input[value="' + htmlvalue + '"]').attr("checked", "checked"); break;
                                        default: break;
                                    }
                                });
                        });
                        //apply recovered filters.
                        shouldRefreshStandardFilters = true;
                    }
                }

                scheduler.bind('dataBound', function (e) {
                    getUserSymbolsFromTree(scheduler.dataSource.data(), scheduler.view());
                });

                 if (shouldRefreshStandardView)
                        scheduler.view(calendarConfig.view);
                 if (shouldRefreshStandardFilters)
                        filterScheduler();
                
                //#endregion

                $(window).trigger("magicSchedulerLoaded", scheduler);

                $("#calendarAccordion div.panel :checkbox.ck").change(function (e) {
                    filterScheduler();
                });

                $('.breadcrumb').html('');
                setTimeout(function () { $('.breadcrumb').html(''); }, 1000)
                if (template !== 'metronic')
                    $('.page-title').html('');
                if (template == 'webarch') {
                    var el = $('#layout-condensed-toggle');
                    if (!el.data('reScheEv')) {
                        el.data('reScheEv', true);
                        $('#layout-condensed-toggle').on('click', refreshSchedulerLayout);
                    }
                }

                $('#scheduler').on('dblclick', '.k-scheduler-agendaview .k-task', function () {
                    var event = scheduler.dataSource.getByUid($(this).attr('data-uid'));
                    schedulerGoTo(event.start);
                });
                $('<li class="k-state-default k-header k-nav-filter"><a class="k-link" href="#"><span class="glyphicon glyphicon-filter"></span>' + getObjectText('filter') + '</a></li>').insertAfter('#scheduler .k-nav-next');
                $('#scheduler .k-nav-filter')
                    .on('mouseover', function () { $(this).addClass('k-state-hover') })
                    .on('mouseout', function () { $(this).removeClass('k-state-hover') })
                    .on('click', function () {
                        $('#leftPane').toggle(1000);
                        if ($('#rightPane').hasClass('col-md-10')) {
                            $('#rightPane').addClass('col-md-12');
                            $('#rightPane').removeClass('col-md-10');
                        }
                        else {
                            $('#rightPane').removeClass('col-md-12');
                            $('#rightPane').addClass('col-md-10');
                        }
                        setTimeout(filterScheduler, 1000);
                    });

                if (query.filterId) {
                    var $filterBlock = $('#calendarAccordion .' + (query.filterType || "types") + "Tree")
                    $(".panel-title > a", $filterBlock).trigger('click');
                    $("input.ck[value=" + query.filterId + "]", $filterBlock)[0].checked = true;
                    $('#scheduler .k-nav-filter').trigger("click");
                }
            });
        });
    
}

function showSchedulerMap(el) {
    var scheduler = $(el).closest("[data-role=scheduler]").data("kendoScheduler"),
        mapController = $("#scheduler-map-controller"),
        config;

    if (!mapController.length) {
        config = {
            scheduler: scheduler,
            ready: function () {
                mapController.find(".fadeout").addClass("fadein");
                setTimeout(function () {
                    mapController.find("i").remove();
                }, 1000);
            }
        };

        mapController = $('<div id="scheduler-map-controller" style="position: relative">')
            .append('<div style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
            .append($(getAngularControllerElement("Magic_SchedulerGoogleMapController", config)).css("height", "100%").addClass("fadeout"))
            .css("height", " 70vh")
            .insertBefore(scheduler.element);
    }
    else {
        mapController.show();
    }
}

function getEventsFromGoogle() {
    var scheduler = $("#scheduler").data("kendoScheduler");
    var view = scheduler.view();
    var from = new Date(view._startDate);
    from.setDate(view._startDate.getDate() - 1);
    var to = new Date(view._endDate);
    to.setDate(view._endDate.getDate() + 1);
    $.ajax({
        url: '/api/Scheduler/GetGoogleEvents',
        data: {
            from: from.toUTCString(),
            to: to.toUTCString()
        }
    }).then(function () {
            scheduler.dataSource.read();
        },
        function (res) {
            console.log(res);
        }
    );
}

function editSchedulerEvent(i) {
    var scheduler = $("#scheduler").data("kendoScheduler");
    scheduler.editEvent(scheduler.dataSource.at(i));
}

function calendarImgError(image, name) {
    image = $(image);
    var userid = image.attr('data-userid');
    var html = '';
    image.onerror = '';
    if (userid in schedulerImgErrors)
        html = schedulerImgErrors[userid];
    else{
        var initials = getInitials(name);
        var color = getRandomColor();
        var bgc = '';
        if (isTooDark(color)) {
            bgc = 'color: white; ';
        }
        html = '<span data-userid="' + userid + '" class="calendar-label" style="' + bgc + 'background-color: ' + color + ';">' + initials + '</span>';
        schedulerImgErrors[userid] = html;
    }
    $(html).insertBefore(image);
    image.remove();
    return true;
}

function getUserSymbolsFromTree(data, view) {
    if ($('.userTree').length <= 0)
        return;
    var hasLocationsTree = $('.locationsTree').length > 0;
    if (waitToRenderScheduler != null)
        clearTimeout(waitToRenderScheduler);
    waitToRenderScheduler = setTimeout(function () {
        $.each(data, function (k, v) {
            var event;
            if (view.options.name === 'agenda')
                event = $('div[data-uid=' + v.uid + '].k-task');
            else
                event = $('div[data-uid=' + v.uid + '].k-event');
            if (v.ownerId != null) {
                var img = $('.userTree [data-userid=' + v.ownerId + ']');
                    if (img.length>0)
                        img = img[0].outerHTML;
                else
                        img = "?";
                if (view.options.name === 'month') {
                    event.height(event.height() * 1.5);
                    event.find('div:first-of-type').prepend(img);
                }
                else if (view.options.name === 'agenda') {
                    event.prepend(img);
                }
                else {
                    if (event.find('.k-event-template').length > 0) {
                        event.find('.k-event-template').prepend(img);
                    }
                    else {
                        event.prepend(img);
                        event.find('img').css({ 'float': 'left', 'display': 'inline-block' });
                        event.find('.calendar-label').css({ 'float': 'left', 'display': 'inline-block' });
                    }
                }
            }
            if (hasLocationsTree && v.LocationColor != null && v.LocationColor != "") {
                event.css({ 'border': '1px solid ' + v.LocationColor, 'border-top': '5px solid ' + v.LocationColor });
            }
        });
    }, 100);
}



