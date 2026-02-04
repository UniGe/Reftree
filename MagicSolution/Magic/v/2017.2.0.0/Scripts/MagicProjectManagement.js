
function closeProject(e) {
    e.preventDefault();
    var rowdata = getRowDataFromButton(e);
    $.ajax({
        type: "POST",
        url: "/api/PROJECTS/CloseProject/",
        data: JSON.stringify(rowdata),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log(result.message, false);
            refreshGridAfterButtonPress(e);
        },
        error: function (message) {
            kendoConsole.log(message.responseText, true);
        }
    });
}

function linkWorkflowToProject(e) {
    e.preventDefault();
    var grid = $(e.currentTarget).closest(".k-grid").data("kendoGrid");
    var data = grid.dataItem($(e.currentTarget).closest("tr"));
    //Get all the existing processes TODO (filter by project type)
    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/GetWithFilter",
        data: JSON.stringify({ table: "dbo.Magic_WorkFlow", order: "Code", where: "1=1" }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) { //do something with the data in result  }

            var workflows = result.Data[0].Table;
            //append a div to container from string
            $("#appcontainer").append('<div id="workflowselectorwindow" style="display:none;width:390px;"> <div>\
                                        <label for="workflowactivationdate">Activation</label>\
                                       <input style="margin-left:5px;width:200px;" id="workflowactivationdate" name = "workflowactivationdate" type="text">\
                                       </input></div>\
                                        <div style ="margin-top:10px;">\
                                         <label for="workflowselectiondrop">Workflow</label>\
                                        <input style="margin-left:5px;width:250px;" id="workflowselectiondrop" name = "workflowselectiondrop" type ="text" ></input></div>\
                                       <button class="k-button" style="margin-top:25px;margin-left:170px;">Link</button>\
                                       </div>');
            $("#workflowselectiondrop").kendoDropDownList({
                dataTextField: "Description",
                dataValueField: "ID",
                dataSource: workflows,
                index: 0
            });
            $("#workflowactivationdate").kendoDatePicker({ value: new Date() });
            //create  a Kendo Window as a wrapper 
            $("#workflowselectorwindow").kendoWindow({ title: data.PROGET_CODICE, resizable: false, close: destroyWindow });
            $("#workflowselectorwindow").data("kendoWindow").center().open();
            $("#workflowselectorwindow").attr("projid", data.PROGET_ID);

            //bind the click function to the Link button
            $("#workflowselectorwindow .k-button").click(linkWorkflowToProjectDB)

        }
    });



}

function destroyWindow() {
    $("#workflowselectorwindow").data("kendoWindow").destroy();
    $("#workflowselectorwindow").remove();
}


function linkWorkflowToProjectDB() {
    var workflowid = $("#workflowselectiondrop").data("kendoDropDownList").value();
    var activationdate = $("#workflowactivationdate").data("kendoDatePicker").value();
    var projectid = $("#workflowselectorwindow").attr("projid");
    var data = buildGenericPostInsertUpdateParameter("update", "dbo.PROFLW_workflow_progetto", "PROFLW_ID", "dbo.USPT_PROFLW_MF", "XMLSTRING", null, null, { PROFLW_WKRFLW_ID: workflowid, PROFLW_PROGET_ID: projectid, PROFLW_DATA_ATTIVAZIONE: activationdate, PROFLW_ID: 0 }, 0);
    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall",
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (e) {
            kendoConsole.log("OK", false);
            destroyWindow();
        },
        error: function (msg) {
            kendoConsole.log(msg.responseText, true);
        }
    });
}


function replicateWorkflowActivity(e) {
    e.preventDefault();
    var grid = $(e.currentTarget).closest(".k-grid").data("kendoGrid");
    var data = grid.dataItem($(e.currentTarget).closest("tr"));

    data.DUPL = 1;
    data.dirty = true;

    grid.dataSource.sync();
}

function planActivityInCalendar(e) {
    e.preventDefault();

    var grid = $(e.currentTarget).closest(".k-grid").data("kendoGrid");
    var data = grid.dataItem($(e.currentTarget).closest("tr"));

    var startDate = data.PROAKT_DATA;
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    setCookie('calendarInterval', '{ "start": "' + startDate + '", "end": "' + endDate + '" }', 1);
    $("#schedulerlink").trigger("click");

}

function buildOpportunityDealColumn(e) {
    var datafine = "N/A";
    var successperc = "50";
    var estimateincomes = "0";

    if (e.EstimateIncomes != null)
        estimateincomes = e.EstimateIncomes.toString();
    if (e.SuccessPerc != null)
        successperc = e.SuccessPerc.toString();
    if (e.EstimateEndDate != null)
        datafine = kendo.toString(e.EstimateEndDate, 'd');

    return '<b>Fine</b>:' + datafine + '</b><br><b>Ricavo</b>:€ ' + estimateincomes + '<br><b>Prob. successo</b>:' + successperc + '%';
}

