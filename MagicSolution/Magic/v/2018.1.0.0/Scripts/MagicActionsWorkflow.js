var get_next_acts_SP = window.workflow_get_next_acts_SP ? window.workflow_get_next_acts_SP : "dbo.WKF_get_next_acts";
//var get_schedulableUsersForTask_API = window.workflow_get_schedulableUsersForTask_API ? window.workflow_get_schedulableUsersForTask_API : "/api/MAGIC_MMB_USERS/PostSchedulableUsers";
var get_schedulableUsersForTask_SP = window.workflow_get_schedulableUsersForTask_SP ? window.workflow_get_schedulableUsersForTask_SP : "dbo.WKF_GetSchedulableUsersForTask";
var close_task_SP = window.workflow_close_task_SP ? window.workflow_close_task_SP : "dbo.WKF_close_task";
var assign_task_SP = window.workflow_assign_task_SP ? window.workflow_assign_task_SP : "dbo.WKF_assign_task";
var user_can_perform_task_SP = window.workflow_user_can_perform_task_SP ? window.workflow_user_can_perform_task_SP : "dbo.WKF_user_can_perform";
var undo_task_SP = window.workflow_undo_task_SP ? window.workflow_undo_task_SP : "dbo.WKF_UndoTask";
var unassign_task_SP = window.workflow_unassign_task_SP ? window.workflow_unassign_task_SP : "dbo.WKF_UnassignTask";

function parseWkfUsers(res) {
    var users = res[0].Table;
    if (!users) {
        if (res.length > 0)
            return res;
    }
    return [];
}
function editGridRequireActions(target) {
    requireConfigAndMore(["MagicActions"], function () {
        editActionGrid(target);
    });
}

function getWfActionsList(e) {
    window.jqueryEditRefTreeGrid = { jqgrid: $(e).closest(".k-grid"), jrow: $(e).closest(".k-grid tr") };
    window.jqueryEditRefTreeGrid.rowData = window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataItem(window.jqueryEditRefTreeGrid.jrow);

    function setWkfActionSettings(actions, type) {
        if (!type)
            type = "actionsettings";
        switch (type) {
            case "actionsettings":
                if (actions) {
                    if (actions.GenerateBO) {
                        actions.id = actions.actionid;
                    }
                    $("[role=tooltip]").data(type, actions);
                }
                else $("[role=tooltip]").data(type, null);
                break;
            default:
                if (actions) {
                    $("#appcontainer").data(type, actions);
                }
                else
                    $("#appcontainer").data(type, null);
                break;
        }
    }

    var rowdata = getRowDataFromButton(e);
    //look for workflow special column (e.g { "taskId": 5087,"actionid":0 ,"actioncommand":"","actionfilter":"","actiontype":"","actiondescription":""})
    if (rowdata.WorkflowActivity) {
        var wkf = JSON.parse(rowdata.WorkflowActivity.replace(/\\t/g, ""));
        rowdata.taskId = wkf.taskId;
        rowdata.GenerateBO = wkf.generatebo ? true : false;
        rowdata.fileRequired = wkf.fileRequired;
        rowdata.singleUser = wkf.singleUser;
        if (wkf.actionid) {
            rowdata.actionid = wkf.actionid;
            rowdata.actionfilter = wkf.actionfilter;
            rowdata.actiondescription = wkf.actiondescription;
            rowdata.actioncommand = wkf.actioncommand;
            rowdata.actiontype = wkf.actiontype;
            //if the actiondescription is an object  e.g { "de":"Kebab Traume", "it":"Sogni di kebab" ,"en":"Kebab dreams" } the user culture is picked
            if (typeof rowdata.actiondescription.indexOf != "function") {
                if (rowdata.actiondescription[window.culture.substring(0, 2)])
                    rowdata.actiondescription = rowdata.actiondescription[window.culture.substring(0, 2)];
                else
                    rowdata.actiondescription = rowdata.actiondescription["it"];
            }
        }
    }
    window.workflowactions_rowdata = rowdata;
    //actions :  1)assign to 2) take charge 3) go to cal 4) go to function 5) upload docs 6) activity report 7) Close 
    // take charge is shown only if the task has MandatoryAssignment equal to false and ownerId is null

    var listgroup = {
        listofitems: [
            { item: "assignto", show: true, id: "openassignTo", text: getObjectText("Task_assign"), onclick: "assign(" + rowdata.taskId + ");" },
            { item: "unassign", show: false, id: "unassignTask", text: getObjectText("Task_unassign"), onclick: "unassign(" + rowdata.taskId + ");" },
            //{ item: "takecharge", show: false, id: "opentakeCharge", text: getObjectText("takecharge"), onclick: "takecharge(" + rowdata.taskId + ");" },
            //{ item: "gotocal", show: true, id: "opengotoCal", text: getObjectText("calendar"), onclick: "showincal();" },
            //{ item: "gotofunc", show: false, id: "openFunc", text: getObjectText("openfunc"), onclick: "openfunc(" + rowdata.ProcessFunction_ID + ");" },
            //{ item: "activityrepo", show: false, id: "openactivityRepo", text: getObjectText("activityreport"), onclick: "activityreport(" + rowdata.taskId + "," + rowdata.LinkedModelActivity_ID + ");" },
            { item: "editActionGrid", show: false, id: rowdata.id, text: rowdata.actiondescription || getObjectText("dataEntry"), onclick: "editGridRequireActions(this);" },
            { item: "close", show: true, id: "opencloseactivityForm", text: getObjectText("Task_close"), onclick: "closetask(" + rowdata.taskId + "," + rowdata.GenerateBO + ");" },
            { item: "undo", show: false, id: "undolast", text: getObjectText("cancel"), onclick: "undotask(" + rowdata.taskId + ");" }

        ],
        itemTemplate: '<a id={0} href="javascript:void(0)" class="list-group-item" onclick="{3}" taskid={2}>{1}</a>',
        groupTemplate: '<div id="wfactionslistgroup"  class="list-group">{0}</div>'
    };
    //Begin hack - prevents a problem when clicking the action span in 2nd page ... 
    $(window).scrollTop($(window).scrollTop() - 1);
    $(window).scrollTop($(window).scrollTop() + 1);
    //end
    buildXMLStoredProcedureJSONDataSource($.extend({ gridname: window.jqueryEditRefTreeGrid.jqgrid.attr("gridname") }, rowdata),
        function (data) {
            if (!$(e).data("kendoTooltip"))
                $(e).kendoTooltip({
                    position: "left",
                    showOn: "focus",
                    autoHide: false,
                    animation: {
                        open: {
                            effects: "fade:in",
                            duration: 500
                        }
                    },
                    content: rowdata.taskId ? renderListGroup(rowdata, listgroup, data.items) : getObjectText("noTaskAssigned"),
                    width: "150px"
                });
            window.opportunityGridDsource = $(e).parents('.k-grid').data("kendoGrid").dataSource;
            $(e).data("kendoTooltip").show();
            setWkfActionSettings([rowdata]);
            setWkfActionSettings(null, "subsettings");
        }, user_can_perform_task_SP).read();

}

function renderListGroup(rowdata, listgroup, flags) {
    //compongo l' html del listgroup
    if (flags) {
        $.each(flags, function (i, v) {
            listgroup.listofitems[i].show = v.flag;
        })
    }
    if (!rowdata.actionid)
        listgroup.listofitems[2].show = false;
    var html = '';
    if (rowdata && !rowdata.ownerId) {
        listgroup.listofitems[1].show = false;
    }
    $(listgroup.listofitems).each(function (i, v) {
        if (v.show === true) {
            html += listgroup.itemTemplate.format(v.id, v.text, rowdata.taskId, v.onclick);
        }
    });
    return html ? listgroup.groupTemplate.format(html) : getObjectText("noTaskAssigned");
}
function closetask(taskid, generatebo, refreshCallBack) {
    if (!refreshCallBack) 
        refreshCallBack = function () {
            if (window.jqueryEditRefTreeGrid && window.jqueryEditRefTreeGrid.jqgrid && window.jqueryEditRefTreeGrid.jqgrid.data('kendoGrid')) 
                window.jqueryEditRefTreeGrid.jqgrid.data('kendoGrid').dataSource.read()
                }
        

    requireConfigAndMore(["MagicSDK"], function (MF) {
        $.ajax({ //#mfapireplaced
            type: "POST",
            url: "/api/Magic_Actions/GetCalendarTask_v",
            data: JSON.stringify({ taskId: "" + taskid }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (err) { console.log(err.responseText) }
        }).then(function (result) {
            var res = result.Data[0].Table;
            //initialization
            var MagicTemplateGroupID,
                MagicTemplateGroupLabel = "",
                lang = window.culture.substring(0, 2),
                customFormModel = [],
                customForm = res[0].onCloseCustomForm ? JSON.parse(res[0].onCloseCustomForm) : null;
            if (customForm) {
                $.each(customForm, function (i, tab) {
                    MagicTemplateGroupID = i;
                    MagicTemplateGroupLabel = (tab.labels && tab.labels[lang]) ? tab.labels[lang] : tab.MagicTemplateGroupLabel;
                    $.each(tab.columns, function (j, column) {
                        var obj = {
                            MagicTemplateGroupID: MagicTemplateGroupID,
                            MagicTemplateGroupLabel: MagicTemplateGroupLabel,
                            CultureGroups_label: MagicTemplateGroupLabel,
                            MagicTemplate_ID: 1,
                            MagicTemplateDetailID: j + i,
                            OrdinalPosition: j + i,
                            GroupOrdinalPosition: j
                        };
                        obj.ColumnName = column.ColumnName;
                        obj.MagicTemplateDataRole = column.MagicTemplateDataRole;
                        if (column.Schema)
                            $.extend(obj, column.Schema);
                        if (column.DataSource)
                            $.extend(obj, column.DataSource);
                        if (column.Cascade)
                            $.extend(obj, column.Cascade);
                        if (column.SearchGrid)
                            $.extend(obj, column.SearchGrid);
                        obj.Upload_SavePath = column.Upload_SavePath;
                        column.CultureColumns_label = (column.labels && column.labels[lang]) ? column.labels[lang] : column.Columns_label;
                        if (column.CultureColumns_label)
                            obj.CultureColumns_label = column.CultureColumns_label;
                        customFormModel.push(obj);
                    });
                });

            }

            var statuses = [];
            var statusID;

            MF.api.get({ storedProcedureName: "dbo.WKF_get_outstatus", taskId: taskid, culture: window.culture.substring(0, 2) }).then(function (result) {
                if (result && result.length && result[0].length) {
                    $.each(result[0], function (index, value) {
                        if (index == 0)
                            statusID = value.ID;
                        statuses.push(value);
                    });
                } else
                    statuses = [{ ID: null, Description: getObjectText("closedOutStatus") }];

                var wact = JSON.parse(res[0].WorkflowActivity);

                var config = {
                    taskid: taskid,
                    generatebo: generatebo,
                    refreshCallBack: refreshCallBack,
                    isFileRequired: wact && wact.fileRequired ? wact.fileRequired : false,
                    isSingleUser: wact && wact.singleUser ? wact.singleUser : true,
                    taskDescription: res[0].description,
                    statusID: statusID,
                    statuses: statuses,
                    customForm: customFormModel,
                    MF: MF
                };
                cleanModal();
                $("#wndmodalContainer .modal-content").html(getAngularControllerElement("Magic_WorkflowActivityClosureController", config));
                $("#wndmodalContainer").modal('show');

            });

        });


    });
};
//insert timesheet from calendar
function taskTimeSheet(taskid, refreshCallBack) {
    requireConfigAndMore(["MagicSDK"], function (MF) {
        $.ajax({    //#mfapireplaced
            type: "POST",
            url: "/api/Magic_Actions/GetCalendarTask_v",
            data: JSON.stringify({ taskId: "" + taskid }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (err) { console.log(err.responseText) }
        }).then(function (result) {
            var res = result.Data[0].Table;
            var config = {
                taskid: taskid,
                refreshCallBack: refreshCallBack,
                taskDescription: res[0].title || res[0].description,
                start: res[0].start,
                end: res[0].DueDate,
                MF: MF
            };
            cleanModal();
            $("#wndmodalContainer .modal-content").html(getAngularControllerElement("Magic_TaskWorkedHoursController", config));
            $("#wndmodalContainer").modal('show');
            cleanModal();
            $("#wndmodalContainer .modal-content").html(getAngularControllerElement("Magic_TaskWorkedHoursController", config));
            $("#wndmodalContainer").modal('show');
        })
    });
}


function showincal() {
    var startDate = window.workflowactions_rowdata.start;
    setCookie('calendarInterval', '{ "start": "' + startDate + '", "end": "' + startDate + '" }', 1);
    window.location = $("#schedulerlink").attr("href");
}
function undotask(taskid) {
    var datatopost = buildGenericPostInsertUpdateParameter("customaction", undo_task_SP, null, undo_task_SP, "XML", sessionStorage.fid ? sessionStorage.fid : null, null, { taskId: taskid }, null);
    rebuildGenericModal();
    $("#executesave").click(function () {
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
            data: datatopost,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                var msg = "OK";
                var msgtype = false;
                if (result.message !== undefined) {
                    msg = result.message;
                    if (result.msgtype == "WARN")
                        msgtype = "info";
                }
                kendoConsole.log(msg, msgtype);
                $("#grid").data("kendoGrid").dataSource.read();
                $("#wndmodalContainer").modal('toggle');
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    });
    $("#wndmodalContainer").modal('toggle');
}

function unassign(taskid) {
    var datatopost = buildGenericPostInsertUpdateParameter("customaction", unassign_task_SP, null, unassign_task_SP, "XML", sessionStorage.fid ? sessionStorage.fid : null, null, { taskId: taskid }, null);
    rebuildGenericModal();
    $("#executesave").click(function () {
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
            data: datatopost,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                var msg = "OK";
                var msgtype = false;
                if (result.message !== undefined) {
                    msg = result.message;
                    if (result.msgtype == "WARN")
                        msgtype = "info";
                }
                kendoConsole.log(msg, msgtype);
                $("#grid").data("kendoGrid").dataSource.read();
                $("#wndmodalContainer").modal('toggle');
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    });
    $("#wndmodalContainer").modal('toggle');
}

function assign(taskid, refreshCallBack) {
    var minDate,
        duedate,
        duration = 60,
        assigneeUserID,
        userInputType = window.workflowactions_rowdata.singleUser != false ? "kendoDropDownList" : "kendoMultiSelect",
        schema = {
            type: "object",
            format: "grid",
            properties: {
                user: {
                    type: "string",
                    title: getObjectText("username"),
                    description: getObjectText("selectuser"),
                    options: {
                        grid_columns: 12
                    }
                },
                duedate: {
                    type: "string",
                    title: getObjectText("duedateselection"),
                    description: getObjectText("duedateselectionhelp"),
                    options: {
                        grid_columns: 6
                    }
                },
                duration: {
                    type: "string",
                    title: getObjectText("durationMin"),
                    description: getObjectText("durationhelp"),
                    options: {
                        grid_columns: 6
                    }
                }
            }
        };
    if (!refreshCallBack) {
        refreshCallBack = function () { $("#grid").data("kendoGrid").dataSource.read(); }
    }
    //alimento datepicker e drop
    var transfn = function () {
        $("input[name*='[duration]']")
            .kendoNumericTextBox({
                format: "n0",
                min: 0,
                step: 10,
                value: duration
            })
            .closest('.k-widget')
            .removeClass('form-control');
        $("input[name=root\\[duedate\\]]")
            .kendoDateTimePicker({
                min: minDate,
                value: duedate
            })
            .closest('.k-widget')
            .removeClass('form-control');

        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.getDataSet({ taskId: taskid }, get_schedulableUsersForTask_SP).then(function (result) {
                var usrs = result[0];
                $("input[name=root\\[user\\]]").each(function () {
                    if (!$(this).val())
                        usrs.unshift({ text: "", value: null });
                    $(this)
                        .css("height", "auto")
                    [userInputType]({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: usrs,
                        value: assigneeUserID,
                        change: function (e) {
                            var item = e.sender.dataSource.at(0);
                            if (!item.value)
                                e.sender.dataSource.remove(item);
                        }
                    })
                        .closest('.k-widget')
                        .removeClass('form-control');
                });
            })
        });
    };
    //onsave
    var savefn = function () {
        //d.T fix cause selector is not working on Safari...
        //var duration = $("input[name='root[duration]'").data("kendoNumericTextBox").value();
        var duration = $("input[name=root\\[duration\\]]").data("kendoNumericTextBox").value();
        duration = (duration == null) ? 60 : duration;
        var duedate = $("input[name=root\\[duedate\\]]").data("kendoDateTimePicker").value();
        if (duedate == null) {
            kendoConsole.log(getObjectText("duedateselectionmandatory"), "info");
            return;
        }

        var users = $("input[name=root\\[user\\]]").data(userInputType).value();
        users = Array.isArray(users) ? users : (users ? [users] : []);
        //if (!users || !users.length) {
        //    kendoConsole.log(getObjectText("vErequired").format(getObjectText("dueuserselection")), "info");
        //    return;
        //}
        var postcontent = buildGenericPostInsertUpdateParameter("update", "dbo.V_CalendarTask", "taskId", assign_task_SP, "XML", -1, -1, { taskId: taskid, assigneeUserID: users.join(), dueDate: duedate ? toTimeZoneLessString(duedate) : duedate, duration: duration, red_at: window.workflowactions_rowdata.red_at });
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/PostU/" + taskid,
            data: postcontent,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log(getObjectText("activityassigned"), false);
                refreshCallBack();
                $("#wndmodalContainer").modal('toggle');
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    };
    var nowPlusAnHour = function () {
        var now = new Date();
        now.setHours(now.getHours() + 1);
        return now;
    }

    function parseISOLocal(s) {
        var b = s.split(/\D/);
        return new Date(b[0], b[1] - 1, b[2], (b[3] || 0),
            (b[4] || 0), (b[5] || 0), (b[6] || 0));
    }

    $.ajax({ //#mfapireplaced
        type: "POST",
        url: "/api/Magic_Actions/GetCalendarTask_v",
        data: JSON.stringify({ taskId: "" + taskid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        error: function (err) { console.log(err.responseText) }
    }).then(function (result) {
        var res1 = result.Data[0].Table;
        schema.title = res1[0].description;
    }).then(function () {
        $.ajax({ //#mfapireplaced
            type: "POST",
            url: "/api/Magic_Actions/GetCalendarTask",
            data: JSON.stringify({ taskId: taskid }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (err) { console.log(err.responseText) }
        }).then(function (result) {
            var res = result.Data[0].Table;
            duedate = minDate = res[0].end;
            //if (kendo.parseDate(duedate) > new Date())
            //    minDate = new Date();
            //Safari fix GMT problem Bug #5151
            //duedate = new Date(duedate);
            duedate = parseISOLocal(duedate);
            startDate = parseISOLocal(res[0].start);
            duration = diff_minutes(startDate, duedate)

            assigneeUserID = res[0].ownerId
            //if non assigned i suggest a future start (duedate - default duration 60mins) and duedate
            if (duedate < nowPlusAnHour() && !assigneeUserID) {
                duedate = nowPlusAnHour();
                minDate = duedate;
            }
            else
                if (duedate > new Date())
                    minDate = new Date();

            customizeModal({ title: getObjectText("taskassignment"), model: schema, transformation_fn: transfn, save_fn: savefn });
            $("#wndmodalContainer").modal('toggle');
        })
    });
}

function diff_minutes(dt2, dt1) {
    if (!dt2 || !dt1) {
        return 60;
    }
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));

}