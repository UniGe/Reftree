function getactivityactionscolumn() {
    var buttondrop = '<div style="text-align:center;"><span class="glyphicon glyphicon-th-list" style="cursor:pointer;"  onclick="getlistofWfActions(this)"  class="glyphicon glyphicon-th-list">\
                    </span></div>';
    return buttondrop;

}

function renderListGroup(rowdata, listgroup,isScheduler) {
    //GESTIONE voci condizionate da dati
    if (rowdata.ownerId === null && isScheduler==true)
        listgroup.listofitems[0].show = true;
    //presa in carico
    if (rowdata.ownerId === null && rowdata.MandatoryAssignment === 0)
        listgroup.listofitems[1].show = true;
    //rapportino 
    if (rowdata.RequiresCheckList === 1)
        listgroup.listofitems[4].show = true;
    //link a funzione
    if (rowdata.ProcessFunction_ID !== null && rowdata.ownerId!==null)
        listgroup.listofitems[3].show = true;
    //link a editGrid 
    if (rowdata.actionid !== null && rowdata.ownerId !== null)
        listgroup.listofitems[5].show = true;
    //compongo l' html del listgroup 
    var html = '';
    $(listgroup.listofitems).each(function (i, v) {
        if (v.show === true) {
            html += listgroup.itemTemplate.format(v.id, v.text, rowdata.taskId, v.onclick);
        }
    })
    return listgroup.groupTemplate.format(html);
}

function editRefTreeGridRequireActions(target)
{
    requireConfigAndMore(["MagicActions"], function () {
        editActionGrid(target);
    });
}

function getlistofWfActions(e) {
    window.jqueryEditRefTreeGrid = { jqgrid: $(e).closest(".k-grid"), jrow: $(e).closest(".k-grid tr") };
    window.jqueryEditRefTreeGrid.rowData = window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataItem(window.jqueryEditRefTreeGrid.jrow);
    function  setWkfActionSettings(actions,type)
    {
        if (!type)
            type = "actionsettings";
        switch (type) {
            case "actionsettings":
                if (actions) {
                    if (actions.actionid)
                        actions.id = actions.actionid;
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
    window.workflowactions_rowdata = rowdata;
    //actions :  1)assign to 2) take charge 3) go to cal 4) go to function 5) upload docs 6) activity report 7) Close 
    // take charge is shown only if the task has MandatoryAssignment equal to false and ownerId is null

    var listgroup = {
        listofitems: [
        { item: "assignto", show: false, id: "openassignTo", text: getObjectText("assign"), onclick: "assign(" + rowdata.taskId + ");" },
        { item: "takecharge", show: false, id: "opentakeCharge", text: getObjectText("takecharge"), onclick: "takecharge(" + rowdata.taskId + ");" },
        { item: "gotocal", show: true, id: "opengotoCal", text: getObjectText("calendar"), onclick: "showincal();" },
        { item: "gotofunc", show: false, id: "openFunc", text: getObjectText("openfunc"), onclick: "openfunc(" + rowdata.ProcessFunction_ID + ",'" + rowdata.FunctionGUID + "');" },
        { item: "activityrepo", show: false, id: "openactivityRepo", text: getObjectText("activityreport"), onclick: "activityreport(" + rowdata.taskId + "," + rowdata.LinkedModelActivity_ID + ");" },
        { item: "editRefTreeGrid", show: false, id: rowdata.id, text: getObjectText("dataEntry"), onclick: "editRefTreeGridRequireActions(this);" },
        { item: "close", show: true, id: "opencloseactivityForm", text: getObjectText("closeTask"), onclick: "closetask(" + rowdata.taskId + "," + rowdata.GenerateBO + ");" }],
        itemTemplate: '<a id={0} href="javascript:void(0)" class="list-group-item" onclick="{3}" taskid={2}>{1}</a>',
        groupTemplate: '<div id="wfactionslistgroup"  class="list-group">{0}</div>'
    };


    var ds = buildXMLStoredProcedureJSONDataSource({ taskId: rowdata.taskId }, function (data) {
        var listgrouphtmlstring = renderListGroup(rowdata, listgroup,data.items[0].flag);

        $("#wfactionslistgroup").remove();

        $(e).kendoTooltip({
            position: "left",
            showOn: "click",
            autoHide: false,
            show: function () {
                var that = this,
                    tooltips = $("[data-role=tooltip]");

                tooltips.each(function () {
                    var tooltip = $(this).data("kendoTooltip");
                    if (tooltip && tooltip != that) {
                        tooltip.hide();
                    }
                });
            },
            hide: function () {
                $(this.popup.element[0]).closest('.k-animation-container').remove();
            },
            content: listgrouphtmlstring,
            width: "250px"
        });

        $(e).data("kendoTooltip").show();
        setWkfActionSettings([rowdata]);
        setWkfActionSettings(null, "subsettings");
       
    }, "core.usp_wf_get_scheduler_check");

    ds.read();


    
}
function showincal() {
    var startDate = window.workflowactions_rowdata.start;
    try {
        startDate = new Date(startDate);
    }
    catch (e)
    {
        console.log(e);
    }
    var dstart = startDate.getDate();
    var mstart = startDate.getMonth();
    mstart += 1;  // JavaScript months are 0-11
    var ystart = startDate.getFullYear();
    var fromdate = mstart + '/' + dstart + '/' + ystart;
    window.location = "/app?start=" + fromdate + "&end=" + fromdate + "#/calendar";
}

function takecharge(taskid) {

    var schema = {
        type: "object",
        title: getObjectText("takecharge"),
        properties: {
            duedate: {
                type: "string",
                title: getObjectText("duedateselection"),
                description: getObjectText("duedateselectionhelp")

            }
        }
    }

    var transfn = function () {
        $("input[name=root\\[duedate\\]]").kendoDateTimePicker({ min: new Date() });
    }

    var savefn = function () {

        var duedate = $("input[name=root\\[duedate\\]]").data("kendoDateTimePicker").value();
        var postcontent = buildGenericPostInsertUpdateParameter("update", "dbo.Magic_Calendar", "taskId", "core.usp_wf_takecharge_task", "XML", -1, -1, { taskId: taskid, dueDate: duedate },taskid);
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/PostU/" + taskid,
            data: postcontent,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log(getObjectText("activityassigned"), false);
                $(".k-grid[gridname=WF_V_ACTAGG_aggregate_activities]").data("kendoGrid").dataSource.read();
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
function openfunc(functionid,functionGUID) {
    //get appare and menuid for the given functionid
    var ds = buildXMLStoredProcedureJSONDataSource({ functionid: functionid, FunctionGUID: functionGUID }, function (e) {
        var data = e.items[0];
        //open the (1st found) menu which hosts functionid 
        MenuSearchExecutor(clickswitchColorBlue, data.MenuLabel, data.MenuID, data.US_APPARE_ID.toString());
    }, "core.usp_get_area_menu_from_funcid");

    ds.read();
}

function closetask(taskid,generatebo)
{
    var statuses = [];
    //carico gli stati output possibili in modo sincrono
    $.ajax({
        type: "POST",
        async: false,
        url: manageAsyncCallsUrl(false, "/api/MF_API/GetMagic_Cal_Wkf_OutStatuses"),
        data: JSON.stringify({ taskId:"" + taskid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            if (result.Count > 0) {
                $.each(result.Data[0].Table, function (index, value) {
                    statuses.push(value);
                })
            } else statuses = [{ ID: null, Description: getObjectText("closedOutStatus") }];

        }
    });
    

    var schema = {
        type: "object",
        title: getObjectText("taskclosure"),
        properties: {
            outstatus: {
                type: "string",
                title: getObjectText("outstatus"),
                description: getObjectText("selectoutstatus")
            },
            notes: {
                type: "string",
                format: "textarea",
                title: getObjectText("outStatusNote"),
                options: {
                    input_height: "60px",
                    grid_columns: 7
                }
            },
            files: {
                type: "string",
                format: "file",
                title: getObjectText("outStatusFiles"),
                options: {
                    grid_columns: 5
                }
            }
        }
    }

    var transfn = function () {
      //debug  generatebo = true;
        if (generatebo ==  true)
        {   
            $("#wndmodalContainer .form-group").prepend('<div id="closetaskautocomplete" ></div><p class="help-block">' + getObjectText("mandatorybo") + '</p>');
            $('#closetaskautocomplete').bOSelector({grid: false});
        }

        $("input[name=root\\[outstatus\\]]").kendoDropDownList({
            dataValueField:"ID",
            dataTextField: "Description",
            dataSource: statuses
        });
        initKendoUploadField($("input[name='root[files]']"), {}, $('#wndmodalContainer'));


    }

    var savefn = function () {
        $("a#executesave").hide().before('<div id ="xyz123" style="display:inline-block;">' + smallSpinnerHTML + '</div>');
        var val = $("input[name=root\\[outstatus\\]]").data("kendoDropDownList").value();
        var selbo = $('#closetaskautocomplete').bOSelector('getBOs');
        var files = $("[name='root[files]").data("kendoUpload").options.files;
        var notes = $("[name='root[notes]").val();
       
        var boId = null;
        var boType = null;
        if ($("#closetaskautocomplete").length > 0) { //solo se il selector e' presente testo che il BO sia stato selezionato
            if (selbo !== undefined && selbo.length > 0) {
                boId = selbo[0].Id;
                boType = selbo[0].Type;
            }
            else {
                kendoConsole.log(getObjectText("mandatorybo"), true);
                return;
            }
        }
        manageGridUploadedFiles($("#wndmodalContainer"));
        var postcontent = buildGenericPostInsertUpdateParameter("update", "dbo.Magic_Calendar", "taskId", "core.usp_wf_close_task", "XML", -1, -1, { taskId: taskid, outStatusID: val, boId: boId, boType: boType, Notes: notes, UploadedFiles: files.length ? JSON.stringify(files) : null });
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/PostU/" + taskid,
            data: postcontent,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                $("a#executesave").show();
                $("#xyz123").remove(); 
                kendoConsole.log(getObjectText("activityclosed"), false);
                if ($(".k-grid[gridname=WF_V_ACTAGG_aggregate_activities]").data("kendoGrid") !== undefined)
                    $(".k-grid[gridname=WF_V_ACTAGG_aggregate_activities]").data("kendoGrid").dataSource.read();
                //se sono in una funzione aggiorno l' activity counter
                if ($("#activitiescounterbadge span.badge").length > 0)
                {
                    var actcounter = parseInt($("#activitiescounterbadge span.badge").text());
                    if (actcounter >= 1) {
                        actcounter = actcounter - 1;
                        $("#activitiescounterbadge span.badge").text(actcounter.toString());
                    }

                }
                $("#wndmodalContainer").modal('toggle');
            },
            error: function (message) {
                $("a#executesave").show();
                $("#xyz123").remove();
                kendoConsole.log(message.responseText, true);
            }
        });
    }


    customizeModal({ title: getObjectText("taskmanagement"), model: schema, transformation_fn: transfn, save_fn: savefn });
    $("#wndmodalContainer").modal('toggle');

}

function activityreport_maintenance(rowdata,$grid)
{
    activityreport(null, null, { TK_INTERV_ID: rowdata.TK_INTERV_ID, TK_INTERV_SK_ACTCAR_ID: rowdata.TK_INTERV_SK_ACTCAR_ID }, $grid);
}

function activityreport(taskid, activityid, outerInput, $grid)
{
    var input = { ActivityID: activityid, taskId: taskid };
    if (outerInput)
        input = outerInput;
    var ds = buildXMLStoredProcedureJSONDataSource(input, function (e) {
        var res = e.items[0];
        var $xml = null;
        for (var k in res) {
            if (res.hasOwnProperty(k)) {
                if (k.indexOf('XML') > -1) {
                    $xml = $($.parseXML(res[k]));
                    break;
                }
            }
        }
        if ($xml != null) {
            openQuestionnaire($xml, taskid, activityid, outerInput, $grid);
        }
    }, "core.WF_SP_GetForm");
    ds.read();
    //customizeModal({ title: getObjectText("taskmanagement"), model: schema, transformation_fn: transfn, save_fn: savefn });
    return;
}
//Standard is task / activity for other cases of Bos tied to questionnaires the input is given by outerInput object
function openQuestionnaire($xml, taskid, activityid,outerInput,$grid) {
    requireConfig(function () {
        require(['angular', window.includesVersion + '/Views/3/Js/Controllers/QuestionnaireController.js'], function (angular, setQuestions) {
            setQuestions($xml, taskid, activityid,outerInput,$grid);
            var include = '<div ng-controller="QuestionnaireController as q" ng-include="\'' + window.includesVersion + '/Views/3/Templates/Questionnaire.html\'" onload="q.addEventListeners()"></div>';
            var $el = $('#contentofmodal');
            $el.html(include);
            angular.bootstrap($el.find('div')[0], ['Questionnaire']);
            $(".modal-title").html(getObjectText("activityReport"));
            $(".modal-footer").html("");
            $("#wndmodalContainer").modal('toggle');
        });
    });
}

function openQuestionnaireGivenUID(uid, tablename, xmlField) {
    //FIX D.T.: cerco lo uid all' interno di tutte le grid "tablename" presenti in pagina
    var xml;
    $('.' + tablename).each(function (i, v) {
        if ($(v).data("kendoGrid").dataSource.getByUid(uid) !== undefined)
            xml = $(v).data("kendoGrid").dataSource.getByUid(uid)[xmlField];
    });
    //ORIG
    //var xml = $('#' + tablename).data("kendoGrid").dataSource.getByUid(uid)[xmlField];
    if (xml)
        openQuestionnaire($($.parseXML(xml)));
}

function assign(taskid) {

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
        $("input[name=root\\[duedate\\]]").kendoDateTimePicker({ min:new Date() });

        $("input[name=root\\[user\\]]").kendoAutoComplete({
            template: '<span item-id="#: value #"><b>#: text  #</b></span>',
            filter: "contains",
           // minLength: 2,
            dataTextField: "text",
            //groupField: "UserDepRol",
            delay: 500,
            select:function (e) {
                $("input[name=root\\[user\\]]").prop("idsel", $(e.item[0]).find('span').attr("item-id"));
            },
            dataSource: {
                transport: {
                    read: {
                        url: "/api/WORKFLOWS/GetSchedulableUsersForTask",
                        serverFiltering: true,
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        dataType: "json"
                    },
                    parameterMap: function (options, operation)
                    {
                        options.filter = $("input[name=root\\[user\\]]").val();
                        options.taskId = taskid;
                        return kendo.stringify(options);
                    }
                },
                schema: {
                    parse: function (data) {
                        if (data[0]!=undefined)
                                return data[0].Table;
                            }
                        }

            }
        });
    }

    var savefn = function () {

        var duedate = $("input[name=root\\[duedate\\]]").data("kendoDateTimePicker").value();

        var val = $("input[name=root\\[user\\]]").prop("idsel");
        if (val === undefined || val === null || $("input[name=root\\[user\\]]").val()==="") {
            kendoConsole.log(getObjectText("userselectionmandatory"), true);
            return;
        }
        var postcontent = buildGenericPostInsertUpdateParameter("update", "dbo.Magic_Calendar", "taskId", "core.usp_wf_assign_task", "XML", -1, -1, { taskId: taskid, assigneeUserID: val , dueDate:duedate});
      $.ajax({
          type: "POST",
          url: "/api/GENERICSQLCOMMAND/PostU/" + taskid,
          data: postcontent,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function (result) {
              kendoConsole.log(getObjectText("activityassigned"), false);
              $(".k-grid[gridname=WF_V_ACTAGG_aggregate_activities]").data("kendoGrid").dataSource.read();
              $("#wndmodalContainer").modal('toggle');
          },
          error: function (message) {
              kendoConsole.log(message.responseText, true);
          }
      });
    }


    customizeModal({ title: getObjectText("taskmanagement"), model: schema , transformation_fn : transfn , save_fn: savefn });
    $("#wndmodalContainer").modal('toggle');

}