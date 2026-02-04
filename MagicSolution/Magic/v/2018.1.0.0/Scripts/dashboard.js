//#region template items

var dashboardstatdef = {};

var graphmodel = {};

var taskmodel = {};

var upcomingeventsmodel = {};

var overduetaskmodel = {};

var eventscontainer = {};

var functemplate = '<span style="margin-left:10px;cursor:pointer;" onclick="openfunc({0})" class="label label-default">{1}</span>';

function createDashboardTemplates() {



    dashboardstatdef['metronic'] = ' <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12">'
                           + '<div class="dashboard-stat {4}">'
                           + '<div class="visual">'
                           + '<i class="{2}"></i>' //icon
                           + '</div>'
                           + '<div class="details">'
                           + '    <div id="indicator{3}" class="number">'  // indicator number
                           + '{0}' //value
                           + '</div>'
                           + '<div id="indicator{3}desc" class="desc">'
                           + '{1}' //description
                           + '     </div>'
                           + '     </div>'
                           + '<a class="more" href="#">'
                           + 'View more <i class="m-icon-swapright m-icon-white"></i></a>'
                           + ' </div>'
                           + ' </div>';



    dashboardstatdef['webarch'] = '<div class="col-md-3 col-sm-6 m-b-20">'
                            + ' <div class="tiles {4} added-margin">'
                            + ' <div class="tiles-body">'
                            + ' <div class="controller"> <a href="javascript:;" class="reload"></a> <a href="javascript:;" class="remove"></a> </div>'
                            + ' <div class="tiles-title"> {1} </div>'
                            + ' <div class="heading"> <span class="animate-number" data-value="{0}" data-animation-duration="1200">{0}</span> </div>'
                            + '  <div class="progress transparent progress-small no-radius">'
                            + '<div class="progress-bar progress-bar-white animate-progress-bar" data-percentage="{0}%" style="width: {0}%;"></div>'
                            + ' </div>'
                            //+ ' <div class="description"><i style="color:black;" class="icon-custom-up" style"color:black;"></i><span class="text-black mini-description ">&nbsp; 1% :: incremento  <span class="blend">sul quadrimestre</span></span></div>'
                            + ' </div>'
                            + '</div>'
                            + ' </div>';

    dashboardstatdef['bucket'] = '<div class="col-md-3">' +
                                ' <div class="mini-stat clearfix">' +
                                ' <span class="mini-stat-icon {4}"><i class="fa fa-gavel"></i></span>' +
                                ' <div class="mini-stat-info">' +
                                '    <span>{0}</span>' + '{1}' +
                                '</div>' +
                                '</div>' +
                                '</div>';

    graphmodel['metronic'] = '<div class="col-md-6 col-sm-6">'
                    + '<div class="portlet solid bordered light-grey">'
                    + '<div class="portlet-title">'
                    + '<div class="caption"><i class={2}></i>{1}</div></div>'
                    + '<div class="portlet-body">'
                    + '<div id="{0}_loading">'
                    + ' <img src="/magic/htmltemplates/metronic/assets/img/loading.gif" alt="loading" /></div>'
                    + ' <div id="{0}_content" class="display-none">'
                    + '  <div id="{0}" class="chart"></div>'
                    + '   </div>'
                    + '</div>'
                    + '</div>'
                    + '</div>'



    graphmodel['webarch'] = ' <div class="col-md-6">'
                           + '<div class="grid simple">'
                           + '<div class="grid-title no-border">'
                           + '<h4><span class="semi-bold">{1}</span>{3}</h4>'
                           + '</div>'
                           + '<div class="grid-body no-border">'
                           + ' <div id="{0}"> </div>'
                           + '</div>'
                           + '</div>'


    graphmodel['bucket'] = ' <div class="col-md-6">'
                           + ' <section class="panel">'
                           + '<header class="panel-heading">'
                           + '{1} <span class="tools pull-right">'
                           + '<a href="javascript:;" class="fa fa-chevron-down"></a>'
                           + '<a href="javascript:;" class="fa fa-cog"></a>'
                           + '<a href="javascript:;" class="fa fa-times"></a>'
                           + '</span>'
                           + '</header>'
                           + '<div class="panel-body">'
                           + '   <div id="{0}" class="main-chart">'
                           + '  </div>'
                           + '</div>'
                           + '</section>'
                           + '</div>'


    taskmodel['metronic'] = "<li class=\"rigaTask singleEventHead\" taskid=\"{0}\" data-start-date=\"{14}\" data-end-date=\"{15}\">" +
                                    "<div class=\"task-title\">" +
                                    "<span class=\"task-title-sp\">{1}.{2}.{3} - {9}.{10}.{11}:: {4} :: {5}</span>" +
                                    "<span class=\"label label-sm\" style=\"background-color:{6}\">{13}</span>{8}" +
                                    "</div>" +
                                    "<div class=\"task-config\">" +
                                    "<div class=\"task-config-btn btn-group\">" +
                                        "<a class=\"btn btn-xs default\" href=\"#\" data-toggle=\"dropdown\" data-hover=\"dropdown\" data-close-others=\"true\">" +
                                        "<i class=\"fa fa-cog\"></i><i class=\"fa fa-angle-down\"></i></a>" +
                                        "<ul class=\"dropdown-menu pull-right\">" +
                                            "{12}" +
                                       "</ul>" +
                                    "</div>" +
                                    "</div>" +
                                "</li>";


    taskmodel['webarch'] = "<tr class=\"singleEventHead\" taskid=\"{0}\" data-start-date=\"{14}\" data-end-date=\"{15}\"{16}>"
                                     + "<td><div>{4} <span class=\"label label-important\" style=\"background-color:{6}\">{13}</span>{8}</div><div style=\"font-size:10px;\">{5}</div></td>"
                                     + "<td><div style=\"font-size:11px;\">{1} - {2} - {3}</div><div style=\"font-size:11px;\">{9} - {10} - {11}</div></td>"
                                     //+ "<td>{7}"
                                     //+ "  </td>"
                                     + "<td><div class=\"btn-group\">"
                                     + "<a class=\"btn btn-mini btn-white dropdown-toggle btn-demo-space\" data-toggle=\"dropdown\">" + getObjectText('actions') + "<span class=\"caret\"></span></a>"
                                     + "<ul id=\"eventactioncontainer\" class=\"dropdown-menu\">"
                                     + "{12}" //actions
                                     + "</ul>"
                                     + " </div></td>"
                                     + "</tr>";


    taskmodel['bucket'] = "<tr>"
                       + "<td>"
                       + "<input id=\"checkbox{0}\" type=\"checkbox\" value=\"1\">"
                       + "</td>"
                       + "<td><div>{4} {8}</div><div>{5}</div></td>"
                       + "<td><div style=\"font-size:11px;\">{1} - {2} - {3}</div><div style=\"font-size:11px;\">{9} - {10} - {11}</div></td>"
                       + "<td>	<span class=\"label label-important\" style=\"background-color:{6}\">{7}</span>"
                       + "  </td>"
                       + "<td><div class=\"btn-group\">"
                       + "<button data-toggle=\"dropdown\" class=\"btn btn-success dropdown-toggle btn-xs\" type=\"button\">Actions <span class=\"caret\"></span></button>"
                       + "<ul id=\"eventactioncontainer\" role =\"menu\" class=\"dropdown-menu\">"
                                     + "{12}" //actions
                                     + "</ul>"
                         + "  </div></td>"
                       + "</tr>";




    upcomingeventsmodel['metronic'] = taskmodel['metronic'];

    upcomingeventsmodel['webarch'] = taskmodel['webarch'];

    upcomingeventsmodel['bucket'] = taskmodel['bucket'];



    overduetaskmodel['metronic'] = "<span class=\"label label-important\">!!</span>";
    overduetaskmodel['webarch'] = "<span class=\"label label-sm\" style=\"\">!!</span>";
    overduetaskmodel['bucket'] = "<span class=\"label label-danger\">Danger</span>";




    eventscontainer['webarch'] = "<div class=\"grid simple\">"
                          + "<div class=\"grid-title no-border\">"
                          + "<h4 style=\"width: auto;\">{1} <span class=\"semi-bold\">{2}</span></h4>"
                          + "<div class=\"tools\"><a href=\"javascript:;\" class=\"collapse\"></a> <a href=\"javascript:;\" class=\"remove\"></a> </div>"
                          + "<div id=\"{3}\" style=\"display: inline-block; float: right;\"></div><div></div>"
                          + "<div style=\"float: left;\"><input id=\"eventresdshb\" onkeyup=\"searchevents(this, '#{0}body');\" type=\"search\" placeholder=\"" + getObjectText('RicercaEventi') + "\"></div>"
                          + "<div style=\"padding-top: 13px;\" class=\"checkbox check-default\">"
						  + "<input id=\"checkbox-{0}\" type=\"checkbox\" value=\"1\" class=\"checkall\" checked=\"checked\">"
						  + "<label onclick=\"selectevents(this, '{0}')\" for=\"checkbox-{0}\">"+ getObjectText("mytasks") +"</label>"
						  +	"</div>"
                          + "</div>"
                          + "<div class=\"grid-body no-border\">"
                          + "<div class=\"row-fluid\">"
                          + "<div class=\"scroller\" data-height=\"220px\" data-always-visible=\"1\">"
                          + " <table class=\"table table-striped table-flip-scroll cf\">"
                          + "<thead class=\"cf\">"
                          + "<tr>"
                          + "<th>" + getObjectText('task') + "</th>"
                          + "<th>" + getObjectText('period') + "</th>"
                          + "<th>" + getObjectText('actions') + "</th>"
                          + "</tr>"
                          + " </thead>"
                          + "<tbody id=\"{0}body\" class=\"show-own\">"
                          + "</tbody>"
                          + "</table>"
                          + "</div>"
                          + "</div>"
                          + "</div>"
                          + "</div>";

    eventscontainer['metronic'] = '<div class="portlet box blue-madison tasks-widget">' +
                                   '<div class="portlet-title">' +
                                   '    <div class="caption"><i class="icon-check"></i>{1} {2}</div>' +
                                   '     <div class="tools">' +
                                   '        <div id="{3}" style="display: inline-block; float: right;"></div>' +
                                   '    </div>' +
                                   '   </div>' +
                                   '<div class="portlet-body">' +
                                   '    <div class="task-content">' +
                                   '        <div class="scroller" style="height: 305px;" data-always-visible="1" data-rail-visible1="1">' +
                                   '            <ul class="task-list" id ="{0}body">' +
                                   '           </ul>' +
                                   '        </div>' +
                                   '    </div>' +
                                   '    <div class="task-footer">' +
                                   //'        <span class="pull-right">' +
                                   //'            <a href="/Magic/Views/Magic_Scheduler">Visualizza tutte le attività <i class="m-icon-swapright m-icon-gray"></i></a>&nbsp;' +
                                   //'        </span>' +
                                   //'    </div>' +
                                   '</div>' +
                                   '</div>'

    eventscontainer['bucket'] = ' <section class="panel">' +
                                  '     <header class="panel-heading">' +
                                   '        {1} {2} <span class="tools pull-right">' +
                                   '        <a href="javascript:;" class="fa fa-chevron-down"></a>' +
                                   '        <a href="javascript:;" class="fa fa-cog"></a>' +
                                   '        <a href="javascript:;" class="fa fa-times"></a>' +
                                   '        </span>' +
                                   '    </header>' +
                                   '    <div class="panel-body to-do-list">' +
                                   '       <table class="table">' +
                                                 '</th>' +
                                                       '<th>Select</th>' +
                                                       '<th>Event</th>' +
                                                       '<th>From :: To</th>' +
                                                      '<th>Assigned To</th>' +
                                                      '<th>Actions</th>' +
                                                  ' <tbody id="{0}body">' +
                                                  ' </tbody>' +
                                            '</table>' +
                                           '</div>' +
                                       '</div>' +
                                  '</section>';
}
    //#endregion
    //#region usermngmnt

    function scheduletaskonchange(e) {
        var taskId = $("#usergridwnd").prop("taskid");

        var userid = $("#usergridwnd").data("kendoGrid").dataItem(this.select()).UserID;

        $("#upcomingevents tr,#upcomingevents li").each(function (i, data) {
            if (data.attributes['taskid'] !== undefined)
                if (parseInt(data.attributes['taskid'].nodeValue) === taskId) {
                    $(data).fadeOut();

                    //assegno l' utente scelto all' evento 
                    var parstring = { "taskid": taskId, "userid": userid };

                    $.ajax({
                        async: false,
                        type: "POST",
                        url: "/api/Scheduler/updateTaskAssignToUser/",
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: kendo.stringify(parstring),
                        success: function (data) {
                            Index.initCalendarTasks(Index.dateFrom, Index.dateTo, true);
                            $("#usergridwnd").data("kendoWindow").close();
                        }
                    });

                }

        });
    }
    
    function assignTaskToUser(taskid) {

        var schema = {
            type: "object",
            title: getObjectText("taskassignment"),
            properties: {
                user: {
                    type: "string",
                    title: getObjectText("username"),
                    description: getObjectText("selectuser")
                },
                duedate: {
                    type: "string",
                    title: getObjectText("duedateselection"),
                    description: getObjectText("duedateselectionhelp")

                }
            }
        }



        var transfn = function () {
            $("input[name=root\\[duedate\\]]").kendoDateTimePicker({ min: new Date() });

            $("input[name=root\\[user\\]]").kendoDropDownList({
                dataTextField: "text",
                dataValueField:"value",
                delay: 500,
                dataSource: {
                    transport: {
                        read: {
                            url: "/api/Magic_Mmb_Users/PostSchedulableUsers",
                            contentType: "application/json; charset=utf-8",
                            type: "POST",
                            dataType: "json"
                        },
                        parameterMap: function (options, operation) {
                            options.taskId = taskid;
                            return kendo.stringify(options);
                        }
                    }//,
                    //schema: {
                    //    parse: function (data) {
                    //        if (data[0] != undefined)
                    //            return data[0].Table;
                    //    }
                    //}

                }
            });
        }

        var savefn = function () {

            var duedate = $("input[name=root\\[duedate\\]]").data("kendoDateTimePicker").value();

            var val = $("input[name=root\\[user\\]]").val();

            var postcontent = buildGenericPostInsertUpdateParameter("update", "dbo.Magic_Calendar", "taskId", "dbo.MagicBroker_assign_task", "XML", -1, -1, { taskId: taskid, assigneeUserID: val, dueDate: duedate });
            $.ajax({
                type: "POST",
                url: "/api/GENERICSQLCOMMAND/PostU/" + taskid,
                data: postcontent,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    kendoConsole.log(getObjectText("activityassigned"), false);
                    $("#scheduledtasks .rangePicker a").trigger('click');
                    $("#wndmodalContainer").modal('toggle');
                },
                error: function (message) {
                    kendoConsole.log(message.responseText, true);
                }
            });
        }


        customizeModal({ title: getObjectText("taskmanagement"), model: schema, transformation_fn: transfn, save_fn: savefn });
        $("#wndmodalContainer").modal('toggle');
    }

    //function assignTaskToUser(taskId) {
       
    //    $("#usergridwnd").prop("taskid", taskId);

    //    var datasource = {
    //        transport: {
    //            read: { url: "/api/Magic_Mmb_Users/SelectChildren", contentType: "application/json", type: "POST" },
    //            parameterMap: function (options, operation) {
    //                if (operation != "destroy")
    //                    return kendo.stringify(options);
    //                return options;
    //            }
    //        },
    //        batch: false,
    //        // error: error,
    //        pageSize: 10,
    //        serverPaging: true,
    //        serverSorting: false,
    //        serverFiltering: true,
    //        schema: {
    //            data: "Data",
    //            total: "Count",
    //            errors: "Errors",
    //            model: {
    //                id: "UserID",
    //                fields: {
    //                    UserID: { editable: false },
    //                    Username: { editable: false },
    //                    FirstName: { editable: false },
    //                    LastName: { editable: false },
    //                    Email: { editable: false }
    //                }
    //            }

    //        }
    //    };

    //    if ($("#usergridwnd").data("kendoGrid") === undefined)
    //        $("#usergridwnd").kendoGrid({
    //            dataSource: datasource,
    //            editable: false,
    //            toolbar: [],
    //            sortable: true,
    //            groupable: false,
    //            reorderable: true,
    //            resizable: true,
    //            selectable: true,
    //            change: scheduletaskonchange,
    //            filterable: defaultfiltersettings,
    //            pageable: {
    //                buttonCount: 10
    //            },
    //            navigatable: true,
    //            columns: [{ field: "Username", title: "Username" },
    //                        { field: "FirstName" },
    //                        { field: "LastName" },
    //                        { field: "Email" }
    //            ]


    //        });
    //    else $("#usergridwnd").data("kendoGrid").dataSource.read();

    //}
//#endregion

    function searchevents(e, selector) {
        if (e.value.length > 0) {
            var reg = new RegExp(e.value.trim().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
            $(selector + ' tr').each(function () {
                var $this = $(this),
                    text = $this.find('td:first-child').text();
                if (reg.test(text)) {
                    $this.removeClass('no-match');
                } else {
                    $this.addClass('no-match');
                }
            });
        } else {
            $(selector + ' tr').removeClass('no-match');
        }
    }

    function selectevents(e, selector) {
        var checked = $('#checkbox-' + selector)[0].checked;
        //revert because click trigger runs before check
        if (!checked)
            $('#' + selector + 'body').addClass('show-own');
        else 
            $('#' + selector + 'body').removeClass('show-own');
    }

    function refreshallcharts(datastart, dataend, seriesclickhandler) {

        if (typeof seriesclickhandler == "function") //definito in dashboard.aspx se presente
            window.graphSeriesClickHandler = seriesclickhandler;

        $(".row .graphs").empty();

        var charts = [];

        if ($("#graphSpot").length > 0)
            $.ajax({
                async: true,
                type: "POST",
                url: "/api/DataAnalysis/PostChartConfigurations/",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: null,
                success: function (results) {
                    var graphRows = 0;
                    if (results[0]) {
                        for (var i = 0; i < results[0].Table.length; i++) {
                            var r = results[0].Table[i];
                            graphRows++;
                            var measunit = (r.YAxisMeasurementUnit == undefined || r.YAxisMeasurementUnit == null) ? '' : r.YAxisMeasurementUnit;
                            var obj = { type: r.ChartType, aggregationDim: r.AggregationDim, analysistype: r.AnalysisType, graphrow: "graphrow" + r.GraphRowNumber, description: r.Description, icon: r.IconClass, aggrdimistime: r.AggregationDimensionIsDate, partialLabels: r.PartialLabels, functionID: r.FunctionID, ymeasunit: measunit };
                            charts.push(obj);
                        }

                        for (var i = 1; i <= graphRows; i++) //creo un row per ogni grafico
                            if ($('#graphrow' + i).length == 0)
                                $('#graphSpot').append('<div id="graphrow' + i + '" class="row graphs"></div><div class="clearfix"></div>');

                        for (var j = 0; j < charts.length; j++) {
                            //var introw = Math.floor(j / 2);
                            //var gr = "graphrow" + (introw + 1).toString();
                            var gr = charts[j].graphrow; //utilizzo il row da configurazione
                            if (charts[j].type === "piechart") {
                                Charts.initPieCharts(datastart, dataend, charts[j].aggregationDim, charts[j].analysistype, gr, charts[j].description, charts[j].icon, j);
                            }
                            if (charts[j].type === "linechart") {
                                Charts.initLineCharts(datastart, dataend, charts[j].aggregationDim, charts[j].analysistype, gr, charts[j].description, charts[j].icon, j, charts[j].aggrdimistime);
                            }
                            if (charts[j].type === "kendopiechart") {
                                Charts.initKendoPieCharts(datastart, dataend, charts[j].aggregationDim, charts[j].analysistype, gr, charts[j].description, charts[j].icon, j, charts[j].functionID, seriesclickhandler, charts[j].ymeasunit);
                            }
                            if (charts[j].type.indexOf("kendolinechart") != -1) {
                                Charts.initKendoLineCharts(datastart, dataend, charts[j].aggregationDim, charts[j].analysistype, gr, charts[j].description, charts[j].icon, j, charts[j].aggrdimistime, charts[j].partialLabels, charts[j].functionID, charts[j].ymeasunit,charts[j].type);
                            }
                        }
                    }
                    if (typeof chartLoad != 'undefined') {
                        chartLoad.resolve();
                    }

                    //    Tasks.initDashboardWidget();
                },
                error: function () {
                    kendoConsole.log("Error during Chart configuration load");
                }
            });
    }




    var Index = function (dfrom, dto) {
        return {
            dateFrom: dfrom,
            dateTo: dto,
            //main function
            init: function () {
                if (typeof App !== "undefined")
                    App.addResponsiveHandler(function () {
                        jQuery('.vmaps').each(function () {
                            var map = jQuery(this);
                            map.width(map.parent().width());
                        });
                    });
            },
            initIndicators: function (datastart, dataend) {
                $("#indicatorsrow1").empty();
                var parstring = { "dst": datastart, "dend": dataend, "qualfilter": null };

                $.ajax({
                    async: false,
                    type: "POST",
                    url: "/api/DataAnalysis/PostPeriodIndicators/",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: kendo.stringify(parstring),
                    success: function (synthindicators) {
                        i = 0;
                        for (var key in synthindicators[0]) {
                            if (synthindicators[0].hasOwnProperty(key) && key.substring(0, 9) === "Indicator") {
                                if (synthindicators[0][key].IndicatorValue !== "") {
                                    $("#indicatorsrow1").append(dashboardstatdef[template].format(synthindicators[0][key].IndicatorValue, synthindicators[0][key].IndicatorDescription, synthindicators[0][key].IndicatorHTMLClass, i.toString(), synthindicators[0][key].IndicatorDivColor));
                                    i++;
                                }
                            }
                        }

                    }
                });
            },
            initCalendarTasks: function (dstart, dend, tasksonly, eventgridoptions) {

                var taskmodel_ = taskmodel[template];
                var eventmodel_ = eventscontainer[template];
                var singlegrid = false;
                if (eventgridoptions != undefined)
                {
                    taskmodel_= eventgridoptions.taskmodel;
                    eventmodel_ = eventgridoptions.eventmodel;
                    singlegrid = eventgridoptions.singlegrid;
                }

                if (!tasksonly)
                    $("#upcomingeventsbody").empty();
                $("#scheduledtasksbody").empty();
                //append the event containers 
                if ($("#upcomingeventsbody").length === 0 && $("#upcomingevents").length>0)
                    $("#upcomingevents").append(eventmodel_.format("upcomingevents", getObjectText('events') + ":: ", getObjectText('toBeAssigned'), "upcomingEventsRangePicker"));
                if ($("#scheduledtasksbody").length === 0 && $("#scheduledtasks").length > 0)
                    $("#scheduledtasks").append(eventmodel_.format("scheduledtasks", getObjectText('events') + ":: ", getObjectText('yourActivities'), "eventsRangePicker"));

                var tasks = getschedulerdatasource(dstart, dend);
                tasks.change = function (e) {
                    //recupero le tipologia possibili del task con la relativa label
                    var tipoTask = getdatasource("Magic_Calendar_TaskTypes", "taskTypeID", "GetAll", "desc");
                    var h = {};
                    var t = {};
                    for (var j = 0; j < tipoTask.length; j++) {
                        h[tipoTask[j].taskTypeID] = tipoTask[j].Color;
                        t[tipoTask[j].taskTypeID] = tipoTask[j].Description;
                    }

                    //recupero gli status possibili del task
                    var statusTask = getdatasource("Magic_Calendar_TaskStatus", "taskStatusID", "GetAll", "desc");
                    var s = {};
                    var sdesc = {};
                    for (var y = 0; y < statusTask.length; y++) {
                        s[statusTask[y].taskStatusID] = statusTask[y].Code;
                        sdesc[statusTask[y].taskStatusID] = statusTask[y].Description;
                    }


                    var testoDaAppendereTasks = ""
                    var testoDaAppendereScadenze = ""

                    var unscheduledactions = "{1}<li onclick=\"deleteEvent(this)\"><a href=\"#\">" + getObjectText('delete') + "</a></li>"
                                      + "<li><a href=\"javascript:void(0)\" onclick=\"assignTaskToUser({0});\">" + getObjectText('assign') + "</a></li>" // 0 is the taskID
                                      + "<li class=\"divider\"></li>"
                                      + "<li onclick=\"goToCalendar(this)\"><a href=\"javascript:void(0)\">" + getObjectText('calendar') + "</a></li>"
                                      + "<li onclick=\"closeEvent(this)\"><a href=\"#\">" + getObjectText('closeTask') + "</a></li>";
                    //!!! Mock
                    var scheduledactions = "{0}" // 0 is the taskID
                                      + "<li class=\"divider\"></li>"
                                      + "<li onclick=\"goToCalendar(this)\"><a href=\"javascript:void(0)\">" + getObjectText('calendar') + "</a></li>"
                                      + "<li onclick=\"closeEvent(this)\"><a href=\"javascript:void(0)\">" + getObjectText('closeTask') + "</a></li>";

                    var amountOfActivities = 0;

                    for (var i = 0; i < e.items.length; i++) {

                        var scaduto = "";
                        if (new Date(e.items[i].start) < (new Date())) {
                            scaduto = overduetaskmodel[template];
                        }

                        var statusTask = s[e.items[i].TaskStatusId];
                        var statusTaskDescr = sdesc[e.items[i].TaskStatusId];

                        var formattedDate = new Date(e.items[i].start.toString());
                        var dstart = formattedDate.getDate();
                        var mstart = formattedDate.getMonth();
                        mstart += 1;  // JavaScript months are 0-11
                        var ystart = formattedDate.getFullYear();

                        var formattedDateend = new Date(e.items[i].end.toString());
                        var dend = formattedDateend.getDate();
                        var mend = formattedDateend.getMonth();
                        mend += 1;  // JavaScript months are 0-11
                        var yend = formattedDateend.getFullYear();

                        var coloreTask = h[e.items[i].taskType_ID];
                        var tipologiaTask = t[e.items[i].taskType_ID];
                        var ownerData = e.items[i].currentUserID == e.items[i].ownerId ? ' data-owner="1"' : '';

                        //compongo il testo per i task assegnati all' utente loggato
                        if (singlegrid == true && statusTask != "End") {
                            var actions = formatActionMenuItem(e.items[i].Function_ID);
                            var trtemplate = scheduledactions.format(actions);
                            if (e.items[i].ownerId == null)
                                trtemplate = unscheduledactions.format(e.items[i].taskId, actions);
                            var testoDaAppendereTasks = testoDaAppendereTasks + taskmodel_.format(e.items[i].taskId, dstart, mstart, ystart, e.items[i].title, e.items[i].description, coloreTask, e.items[i].ownerName, scaduto, dend, mend, yend, trtemplate, tipologiaTask, mstart + '/' + dstart + '/' + ystart, mend + '/' + dend + '/' + yend, ownerData);
                            amountOfActivities++;
                        }
                        else
                            if (!singlegrid) {
                            if ((statusTask != "End") && (e.items[i].ownerId === e.items[i].currentUserID)) {
                                var actions = formatActionMenuItem(e.items[i].Function_ID);
                                var testoDaAppendereTasks = testoDaAppendereTasks + taskmodel_.format(e.items[i].taskId, dstart, mstart, ystart, e.items[i].title, e.items[i].description, coloreTask, e.items[i].ownerName, scaduto, dend, mend, yend, scheduledactions.format(actions), tipologiaTask, mstart + '/' + dstart + '/' + ystart, mend + '/' + dend + '/' + yend, ownerData);
                                amountOfActivities++;
                            }

                            //compongo il testo per i le scadenze non assegnate create dall' utente loggato
                            if (e.items[i].ownerId === null && e.items[i].creatorId === e.items[i].currentUserID && !tasksonly) {
                                var actions = formatActionMenuItem(e.items[i].Function_ID);
                                var testoDaAppendereScadenze = testoDaAppendereScadenze + taskmodel_.format(e.items[i].taskId, dstart, mstart, ystart, e.items[i].title, e.items[i].description, coloreTask, "", scaduto, dend, mend, yend, e.items[i].Editable ? unscheduledactions.format(e.items[i].taskId, actions) : '', tipologiaTask, mstart + '/' + dstart + '/' + ystart, mend + '/' + dend + '/' + yend, ownerData);
                            }

                        }
                    }

                    updateActivityCounter(amountOfActivities);

                    $("#scheduledtasksbody").append(testoDaAppendereTasks);
                    $("#upcomingeventsbody").append(testoDaAppendereScadenze);

                }
                var dashboardcalendards = new kendo.data.DataSource(tasks);
                dashboardcalendards.read();

                // sul click del bottone di refresh, rinfresco i task
                $("#taskRefresh").click(function () {
                    $("ul.task-list").empty();
                    dashboardcalendards.read();
                });

            },



            initMiniCharts: function () {

                return;

            }

        };

    }();

    function formatActionMenuItem(functionID) {
        var action = "";
        //var actionTemplate = '<li onclick="{1}"{2}>{0}</li>';
        var actionTemplate = '<li{1}>{0}</li>';
        if (functionID != "") {
            var elem = $('a[funcid=' + functionID + ']');
            if (elem.length > 0) {
                action = actionTemplate.format(elem.prop('outerHTML'), '');
            }
            else {
                action = actionTemplate.format('', ' id="waitForID' + functionID + '"');
                setTimeout(function () {
                    elem = $('a[funcid=' + functionID + ']');
                    if (elem.length > 0) {
                        action = $('#waitForID' + functionID).html(elem.prop('outerHTML')).attr('id', '');
                    }
                }, 1500);
            }
        }
        return action;
    }


    var Charts = function () {

        return {
            //main function to initiate the module
            init: function (datastart, dataend, aggr, analysistype, graphrow, description, icon, index) {

                App.addResponsiveHandler(function () {
                    Charts.initPieCharts(datastart, dataend, aggr, analysistype, graphrow, description, icon, index);
                });

            },
            initLineCharts: function (datastart, dataend, aggr, analysistype, graphrow, description, icon, index, xistime,partialLables,functionid) {
                var graphid = "line" + index.toString();
                $("#" + graphrow).append(graphmodel[template].format(graphid, description, icon));

                if (!jQuery.plot) {
                    return;
                }

                var data = [];
                var totalPoints = 250;


                function showTooltip(title, x, y, contents) {
                    $('<div id="tooltip" class="chart-tooltip"><div class="date" style="text-align:center;">' + title + '<\/div><div class="label label-success">' + contents + '<\/div><\/div>').css({
                        position: 'absolute',
                        display: 'none',
                        top: y - 60,
                        width: 100,
                        left: x - 40,
                        border: '0px solid #ccc',
                        padding: '2px 6px',
                        'background-color': '#fff',
                    }).appendTo("body").fadeIn(200);
                }

                var parstring = { "dst": datastart, "dend": dataend, "aggrdim": aggr, "analysisType": analysistype };
                if ($('#' + graphid).size() !== 0) {
                    var api = "/api/DataAnalysis/DataforBusinessObject/";
                    if (xistime)
                       api=  "/api/DataAnalysis/timeDataforBusinessObject/";
                    $.ajax({
                        async: true,
                        type: "POST",
                        url: api,
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: kendo.stringify(parstring),
                        success: function (timedatafat) {
                            var datafat = [];
                            var datafatnum = [];
                            var datafatcons = [];
                            var labels = [];
                            for (var i = 0; i < timedatafat.length; i++) {
                                datafat.push([i, timedatafat[i].Tot]);
                                labels.push(timedatafat[i].X.substring(0, 10));
                            }



                            if ($('#' + graphid + '_loading').length > 0) {
                                $('#' + graphid + '_loading').hide();
                                $('#' + graphid + '_content').show();
                            }
                            var plot_statistics = $.plot($("#" + graphid), [{
                                data: datafat,
                                label: description
                            }
                            ], {
                                series: {
                                    lines: {
                                        show: true,
                                        lineWidth: 2,
                                        fill: true,
                                        fillColor: {
                                            colors: [{
                                                opacity: 0.05
                                            }, {
                                                opacity: 0.01
                                            },
                                            {
                                                opacity: 0.02
                                            }
                                            ]
                                        }
                                    },
                                    points: {
                                        show: true
                                    },
                                    shadowSize: 2

                                },
                                grid: {
                                    hoverable: true,
                                    clickable: true,
                                    tickColor: "#eee",
                                    borderWidth: 0
                                },
                                colors: ["#d12610", "#37b7f3", "#52e136"],
                                xaxis: {
                                    ticks: 11,
                                    tickDecimals: 0
                                },
                                yaxis: {
                                    ticks: 11,
                                    tickDecimals: 0
                                }
                            });

                            var previousPoint = null;
                            $("#" + graphid).bind("plothover", function (event, pos, item) {
                                $("#x").text(pos.x.toFixed(2));
                                $("#y").text(pos.y.toFixed(2));
                                if (item) {
                                    if (previousPoint != item.dataIndex) {
                                        previousPoint = item.dataIndex;

                                        $("#tooltip").remove();
                                        var x = item.datapoint[0].toFixed(2),
                                            y = item.datapoint[1].toFixed(2);

                                        showTooltip(labels[item.dataIndex], item.pageX, item.pageY, y);
                                    }
                                } else {
                                    $("#tooltip").remove();
                                    previousPoint = null;
                                }
                            });


                        },
                        error: function () {
                            kendoConsole.log("Problems during hist series calc");

                        }
                    });

                }

            },
            initKendoPieCharts: function (datastart, dataend, aggr, analysistype, graphrow, description, icon, index, functionid, seriesclickhandler, ymeasunit) {
                 var graphid = "line" + index.toString();
                var ft = "";
                if (functionid && functionid!=null)
                     ft = functemplate.format(functionid,getObjectText('gotolist'));
                $("#" + graphrow).append(graphmodel[template].format(graphid, description, icon,ft));
                var parstring = { "dst": datastart, "dend": dataend, "aggrdim": aggr, "analysisType": analysistype };

                $.ajax({
                    async: true,
                    type: "POST",
                    url: "/api/DataAnalysis/DataforBusinessObject/",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: kendo.stringify(parstring),
                    success: function (piedata) {
                        var series = [];
                        for (var i = 0; i < piedata.length; i++) {
                            var element = { category: piedata[i].X, value: piedata[i].Tot , customparam: piedata[i].CustomParameter };
                            series.push(element);
                        }
                        var showlegendoutsidegraph = false;
                        var showlegendingraph = true;
                        if (piedata.length > 10)
                        {
                            showlegendingraph = false;
                            showlegendoutsidegraph = true;
                        }
                        
                        var template = "#= category #: \n #= value #" + ymeasunit;
                        if (showlegendingraph === false)
                            template = "#= value #"+ymeasunit;
                        if ($('#' + graphid + '_loading').length > 0) {
                            $('#' + graphid + '_loading').hide();
                            $('#' + graphid + '_content').show();
                        }
                        // INTERACTIVE
                        $("#" + graphid).kendoChart({
                            dataSource: {
                                data: series,
                            },
                            title: {
                                position: "bottom",
                                text: description
                            },
                            legend: {
                                visible: showlegendoutsidegraph
                            },
                            chartArea: {
                                background: ""
                            },
                            seriesDefaults: {
                                labels: {
                                    visible: true,
                                    background: "transparent",
                                    template: template
                                }
                            },
                            series: [{
                                type: "pie",
                                field: "value"
                            }],
                            categoryAxis: {
                                field: "categories"
                            },
                            tooltip: {
                                visible: true,
                                format: "{0} "+ymeasunit
                            }
                        });
                       
                        if (seriesclickhandler) {
                            var chart = $("#" + graphid).data("kendoChart");
                            chart.bind("seriesClick", seriesclickhandler);
                        }
                    },
                    error: function () {
                        kendoConsole.log("Error during piedata calc");
                    }
                })
            },
            initPieCharts: function (datastart, dataend, aggr, analysistype, graphrow, description, icon, index,functionid) {
                var graphid = "line" + index.toString();
                $("#" + graphrow).append(graphmodel[template].format(graphid, description, icon));
                var parstring = { "dst": datastart, "dend": dataend, "aggrdim": aggr, "analysisType": analysistype };

                $.ajax({
                    async: true,
                    type: "POST",
                    url: "/api/DataAnalysis/DataforBusinessObject/",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: kendo.stringify(parstring),
                    success: function (piedata) {
                        var ymeasunit = getYMeasUnit(timedatafat);
                        var data = [];
                        var series = piedata.length;
                        for (var i = 0; i < series; i++) {
                            data[i] = {
                                label: piedata[i].X,
                                data: piedata[i].Tot
                            }
                        }
                        if ($('#' + graphid + '_loading').length > 0) {
                            $('#' + graphid + '_loading').hide();
                            $('#' + graphid + '_content').show();
                        }
                        // INTERACTIVE
                        $.plot($("#" + graphid), data, {
                            series: {
                                pie: {
                                    show: true,
                                    innerRadius: 0.5
                                }
                            },
                            grid: {
                                hoverable: true,
                                clickable: true
                            }
                        });
                        $("#" + graphid).bind("plothover", pieHover);
                        $("#" + graphid).bind("plotclick", pieClick);

                    },
                    error: function () {
                        kendoConsole.log("Error during piedata calc");
                    }
                });


                function pieHover(event, pos, obj) {
                    if (!obj)
                        return;
                    percent = parseFloat(obj.series.percent).toFixed(2);
                    $("#hover").html('<span style="font-weight: bold; color: ' + obj.series.color + '">' + obj.series.label + ' (' + percent + '%)</span>');
                }

                function pieClick(event, pos, obj) {
                    if (!obj)
                        return;
                    percent = parseFloat(obj.series.percent).toFixed(2);
                    alert('' + obj.series.label + ': ' + percent + '%');
                }

            },
            initKendoLineCharts: function (datastart, dataend, aggr, analysistype, graphrow, description, icon, index, xistime, partialLabels, functionid, ymeasunit,type) {
                var graphid = "line" + index.toString();
                var ft = "";
                if (functionid && functionid != null)
                    ft = functemplate.format(functionid, getObjectText('gotolist'));

                if (type.indexOf("column") != -1)
                    type = "column";
                else
                    type = "line";

            $("#" + graphrow).append(graphmodel[template].format(graphid, description, icon,ft));
            var plab = ["P1", "P2", "P3"];
            if (partialLabels && partialLabels != null)
                plab = partialLabels.split(',');
            var parstring = { "dst": datastart, "dend": dataend, "aggrdim": aggr, "analysisType": analysistype };
            if ($('#' + graphid).size() !== 0) {
                var api = "/api/DataAnalysis/DataforBusinessObject/";
                if (xistime)
                   api= "/api/DataAnalysis/timeDataforBusinessObject/";
                $.ajax({
                    async: true,
                    type: "POST",
                    url: api,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: kendo.stringify(parstring),
                    success: function (timedatafat) {
                        var labels = [];
                        //possibile avere uno stacked da 3 sub-cols
                        var datafat1 = [];
                        var datafat2 = [];
                        var datafat3 = [];
                        var isstacked = false;
                        var ismultiseries = false;
                        for (var i = 0; i < timedatafat.length; i++) {
                            var x = timedatafat[i].X;
                            if (aggr == 'months')
                                x =kendo.toString(new Date(timedatafat[i].X),'y');
                            labels.push(x);
                            datafat1.push(timedatafat[i].Partial1);
                            datafat2.push(timedatafat[i].Partial2);
                            datafat3.push(timedatafat[i].Partial3);
                            if (timedatafat[i].Partial2 != 0) {
                              if( type == "column")
                                isstacked = true;
                             ismultiseries = true;
                            }
                        }

                        if ($('#' + graphid + '_loading').length > 0) {
                            $('#' + graphid + '_loading').hide();
                            $('#' + graphid + '_content').show();
                        }

                        var graphobj = {
                            title: {
                                text: description,
                                position: "bottom"
                            },
                            legend: {
                                position: "bottom"
                            },
                            seriesDefaults: {
                                type: type,
                                stack: isstacked
                            },
                            series: [{
                                data: datafat1,
                                // Line chart marker type
                                markers: { type: "square" }
                                }],
                            valueAxis: {
                                line: {
                                    visible: false
                                }
                            },
                            categoryAxis: {
                                labels: {
                                    rotation: 90
                                },
                                categories: labels,
                                majorGridLines: {
                                    visible: false
                                }
                            },
                            tooltip: {
                                visible: true,
                                format: "{0} " + ymeasunit
                            }
                        };
                        if (ismultiseries) {
                            graphobj.series[0].name = plab[0];
                            if (datafat2.length > 0)
                                graphobj.series.push({
                                    name: plab[1],
                                    data: datafat2
                                });
                            if (datafat3.length > 0)
                                graphobj.series.push({
                                    name: plab[2],
                                    data: datafat3
                                });
                        }
                        $("#"+graphid).kendoChart(graphobj);
                  
                    },
                    error: function (err) {
                        console.log({ obj: "initKendoLineCharts", error: err });

                    }
                });

            }

        }
        };

    }();


    rangePickers = {};

    function addRangePickers(pickers) {

       
        $.each(pickers, function (k, v) {
            var elem = $('#' + k);
            if (elem.length) {
                rangePickers[k] = v;

                var fn = 'updateData';
                if (v.updateView != null && v.updateView != undefined)
                    fn = v.updateView;
                //var dateStart = '01/01/' + dateNow.getFullYear();
                var dateStart = v.defaultStart.getDate() + '/' + (v.defaultStart.getMonth() + 1) + '/' + v.defaultStart.getFullYear();
                var dateEnd = v.defaultEnd.getDate() + '/' + (v.defaultEnd.getMonth() + 1) + '/' + v.defaultEnd.getFullYear();
                //var dateEnd = v.defaultEnd.getDate() + '/' + (v.defaultEnd.dateNow.getMonth() + 1) + '/' + v.defaultEnd.dateNow.getFullYear();
                var rangePickerHTML = '<div class="rangePicker"><label>' + getObjectText('from') + '&nbsp;</label><input class="start" style="width: 200px" value="' + dateStart + '" /><label>' + getObjectText('to') + '&nbsp;</label><input class="end" style="width: 200px" value="' + dateEnd + '"/><a class="k-button" onclick="' + fn + '(this)"><span class="k-icon k-i-tick"></span></a></div>';
                elem.html(rangePickerHTML);
                var format = 'dd/MM/yyyy';
                //if (culture.substring(0, 2) === 'en' || culture.substring(0, 2) === 'de')//Inglese
                //    format = 'MM/dd/yyyy';
                rangePickers[k].start = $('#' + k + " .start").kendoDatePicker({
                    change: startChange,
                    format: format
                }).data("kendoDatePicker");
                rangePickers[k].end = $('#' + k + " .end").kendoDatePicker({
                    change: endChange,
                    format: format
                }).data("kendoDatePicker");
                rangePickers[k].start.max(rangePickers[k].end.value());
                rangePickers[k].end.min(rangePickers[k].start.value());
            }
        });
    }

    function startChange() {

        var id = $(this.element).parent().parent().parent().parent().attr('id');
        rangePickers[id].startDate = this.value();
        rangePickers[id].endDate = rangePickers[id].end.value();

        if (rangePickers[id].startDate) {
            rangePickers[id].startDate = new Date(rangePickers[id].startDate);
            rangePickers[id].startDate.setDate(rangePickers[id].startDate.getDate());
            rangePickers[id].end.min(rangePickers[id].startDate);
        } else if (rangePickers[id].endDate) {
            rangePickers[id].start.max(new Date(rangePickers[id].endDate));
        } else {
            rangePickers[id].endDate = new Date();
            rangePickers[id].start.max(rangePickers[id].endDate);
            rangePickers[id].end.min(rangePickers[id].endDate);
        }
    }

    function endChange() {

        var id = $(this.element).parent().parent().parent().parent().attr('id');
        rangePickers[id].endDate = this.value();
        rangePickers[id].startDate = rangePickers[id].start.value();

        if (rangePickers[id].endDate) {
            rangePickers[id].endDate = new Date(rangePickers[id].endDate);
            rangePickers[id].endDate.setDate(rangePickers[id].endDate.getDate());
            rangePickers[id].start.max(rangePickers[id].endDate);
        } else if (startDate) {
            rangePickers[id].end.min(new Date(rangePickers[id].startDate));
        } else {
            rangePickers[id].endDate = new Date();
            rangePickers[id].start.max(endDate);
            rangePickers[id].end.min(endDate);
        }
    }

    function updateData(context) {
        var id = $(context).parent().parent().attr('id');
        rangePickers[id].updateView(rangePickers[id].start.value(), rangePickers[id].end.value());
    }

    function refreshEvents(dstart, dend, eventgridoptions) {
        Index.dateFrom = dstart;
        Index.dateTo = dend;
        //Index.init();
        //Index.initIndicators(dstart, dend);
        if (eventgridoptions)
            Index.initCalendarTasks(dstart, dend, eventgridoptions.singlegrid, eventgridoptions);
        else
            Index.initCalendarTasks(dstart, dend, false);
        //Index.initCalendarTasks(Index.dateFrom, Index.dateTo, false);
    }

    function refreshGraphs(from, to) {
        var datastart = kendo.toString(from, "yyyyMMdd");
        var dataend = kendo.toString(to, "yyyyMMdd");
        Index.initIndicators(datastart, dataend);
        refreshallcharts(datastart, dataend, window.graphSeriesClickHandler);
    }

    function closeEvent(elem) {
        elem = $(elem).closest(".singleEventHead");
        var id = elem.attr("taskid");
        $.ajax({
            async: true,
            type: "GET",
            url: "/api/Scheduler/TriggerTaskStatus/" + id.toString(),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log(getObjectText("registraztaskcompleted"), false);
                $(elem).remove();
                updateActivityCounter();
            }
        });
        return false;
    }

    //if amountOfActivities is given it sets the activityCounter to the given amount, if not the activityCounter is reduced by 1
    //NOTE: the activityCounter is only implemented for the Webarch template
    function updateActivityCounter(amountOfActivities) {
        var activityCounter = $('#activityCounter');
        if (activityCounter.length > 0) {
            if (amountOfActivities === undefined) {
                amountOfActivities = parseInt(activityCounter.text());
                if (amountOfActivities == 'NaN')
                    amountOfActivities = 0;
                else
                    amountOfActivities--;
            }
            if (amountOfActivities == 0)
                activityCounter.attr('class', 'arrow');
            else
                activityCounter.attr('class', 'badge badge-important pull-right');
            activityCounter.html(amountOfActivities == 0 ? '' : amountOfActivities);
        }
    }

    function deleteEvent(elem) {
        elem = $(elem).closest(".singleEventHead");
        var id = elem.attr("taskid");
        $.ajax({
            async: true,
            type: "POST",
            url: "/api/Scheduler/PostD/" + id.toString(),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log(getObjectText("Event deleted"), false);
                $(elem).remove();
            }
        });
    }

    function goToCalendar(elem) {
        var elem = $(elem).closest(".singleEventHead");
        window.location = "/app?start=" + elem.data("start-date") + "&end=" + elem.data("end-date") + "#/calendar";
    }