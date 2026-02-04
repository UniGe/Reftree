window.fixedKendoGridHeaders = true;
window.actionColumnIsFirst = true;
//Aggiunngo qui i JS che sono contenuti solo nella app instance
//var head = document.getElementsByTagName('head')[0];
//Called when the action span is clicked for workflows.
//#region workflow custom
//window.workflow_user_can_perform_task_SP = "CUSTOM.WKF_user_can_perform";
//window.workflow_get_schedulableUsersForTask_SP = "CUSTOM.WKF_GetSchedulableUsersForTask";
window.workflow_undo_task_SP = "Base.WKF_UndoTask"
window.workedHours_SP = "Base.usp_Calendar_timesheet_write";
//#endregion
//add Calibri font to kendo editor 
kendo.ui.Editor.prototype.options.fontName.push({ text: "Calibri", value: "Calibri,sans-serif" });
//var script = document.createElement('script');
//script.type = 'text/javascript';
//script.src = '/Custom/1/Scripts/foglio_presenze.js';
//head.appendChild(script);

window.gridexcludefromfastsearch = ["JsonForContact"];

// funzione custom che ritorna le tipologie di aree organizzative per le applicazioni
function getSpecificAppAssignedCodeValues() {
    return [{ value: "DEF", text: "DEFAULT" }];
}

function removeUnwantedGroupInfo() {
    //$("#rolediv").remove();
    return;
}

//#region scheduler

//if the task is binded to a wkf the BO must not change
function schedulerbOselectorOptions(e) {
    if (e.event.LinkedActualWorkflow_ID)
        return {
            isReadonly: true
        }
    return {};
}

//Management of the workflow closure and the activities timesheet 
function overrideSchedulerWhenWorkflow(e) {
    requireConfigAndMore(["MagicSDK", "MagicActionsWorkflow"], function (MF) {
        var infohtml = '<span class="label label-success" style=" margin-left: 144px;">' + getObjectText("workflow") + '</span>';
        var ttip = false;
        MF.api.get({ storedProcedureName: "dbo.WKF_get_previous_task_info", data: { taskId: e.event.taskId } }).then(function (res) {
            if (res && res[0] && res[0][0]) {
                var previousOwner = res[0][0].OwnerLongName;
                var previousTitle = res[0][0].title;
                var previousNotes = res[0][0].Notes;
                ttip = true;
                infohtml = '<span class="label label-info" style=" margin-left: 144px;">' + getObjectText("workflow") + ' <i class="fa fa-info-circle" aria-hidden="true"></i></span>';
            }
            //Aggiunge un bootstrap label per indicare che il task fa parte di una trattativa.
            $('[data-container-for=taskType_ID] select').data("kendoDropDownList").enable(false);
            $('[data-container-for=TaskStatusId] select').data("kendoDropDownList").enable(false);
            $('[data-container-for=ownerId] select').attr("required", "required");
            $('span.k-window-title').after(infohtml);
            if (ttip)
                $(".k-window-titlebar.k-header").kendoTooltip({
                    filter: "span",
                    content: "<div style='text-align:left;'><b>" + getObjectText("prevtask") + ":</b><br>" + previousTitle + "<br><b>" + previousOwner + ": </b><br><em>" + previousNotes + "</em></div>",
                    position: "left",
                    width: 400
                });
            if (e.event.TaskStatusId != 3)//il task deve essere aperto
            {
                var $btn = $('<a id="closure__wkf" class="k-button k-primary" href="javascript:void(0)">' + getObjectText("taskClosure") + '</a>');
                e.container.find(".k-edit-buttons.k-state-default a.k-button.k-primary.k-scheduler-update").before($btn);
                $btn.click(function (el) {
                    //close scheduler modal
                    e.container.closest(".k-window").find(".k-window-actions a").trigger("click");
                    window.workflowactions_rowdata = { "singleUser": true };
                    //general activity closure method in MagicActionsWorkflow with bootstrap modal
                    closetask(e.event.taskId, false, function () {
                        $("#scheduler").data("kendoScheduler").dataSource.read();
                    });
                });
            }
        });
    });
}

function overrideSchedulerWorkedHoursTimesheet(e) {
    requireConfigAndMore(["MagicSDK", "MagicActionsWorkflow"], function (MF) {
        var istma = false;
        var attendees = e.event.teammembersattendees && e.event.teammembersattendees.length ? e.event.teammembersattendees.join(",") : [-1];
        //check if logged user is an attendee
        MF.api.get({ table: "dbo.v_Magic_Calendar_Relations", where: "AttendeeUser_ID in (" + attendees + ") and Calendar_ID=" + e.event.taskId }).then(function (res) {
            istma = res.length > 0 ? true : false;
            //the owner username has to be equal to the logged user's name or the logged user sould be an attendee, otherwise i return
            if (window.Username != e.event.ownerName
                && !istma)
                return;

            //show the button only if the timesheet is still open for that task and a projectid is related to the task directly or via workflow
            MF.api.get({ table: "Custom.v_Magic_Calendar", where: "TaskAvailableForTimeSheet = 0 AND taskid = " + e.event.taskId }).then(function (res) {
                if (res.length)
                    return;
                var $btn = $('<a class="k-button k-primary" href="javascript:void(0)">' + getObjectText("taskTimeSheet") + '</a>');
                var iswkf = $("#closure__wkf").length;
                if (!iswkf) //it the task closure's button exists (wkf) then put the button before it else put it before the save btn
                    e.container.find(".k-edit-buttons.k-state-default a.k-button.k-primary.k-scheduler-update").before($btn);
                else
                    e.container.find("#closure__wkf").before($btn);
                $btn.click(function (el) {
                    //close scheduler modal
                    e.container.closest(".k-window").find(".k-window-actions a").trigger("click");
                    //    window.workflowactions_rowdata = { "singleUser": true };
                    //general activity closure method in MagicActionsWorkflow with bootstrap modal
                    taskTimeSheet(e.event.taskId, function () {
                        $("#scheduler").data("kendoScheduler").dataSource.read();
                    });
                });

            });

        });
    })
}

//#endregion 

apply_style("/Views/1/Styles/Prime.css");  //applica css