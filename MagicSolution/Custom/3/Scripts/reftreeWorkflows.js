function actionLinkReferenceBuilderWF(data, currentTarget) {
    return "javascript:closetask(" + data.taskId + "," + data.generateBO + ");";
}
function clickworkflowsbadge(e)
{
    var functionid = $(e.currentTarget).attr("functionid");
    //workflow management
    //get della count di tutte le activity pending che fanno a capo ad un certo Function_ID             
    $.ajax({
        type: "POST",
        url: "/api/WORKFLOWS/GetActivitiesForFunction/",
        data: JSON.stringify({ FunctionID: functionid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            $("#accordion_" + functionid).remove();
            var accordiontoadd = build3LevelBootstrapAccordion({ actions: result }, "accordion_" + functionid, actionLinkReferenceBuilderWF);
            //popolamento del sessionStorage per ogni funzione con la lista delle attivita
            //activitiescounterbadge viene creato nel metodo genericMenuClickManageTitle dei template (WebArch.js o Metronic.js)
            var tooltip = $("#wrkactdiv").kendoTooltip({
                position: "left",
                showOn: "click",
                autoHide: false,
                hide: function () {
                    $(this.popup.element[0]).closest('.k-animation-container').remove();
                },
                content: function () {
                    return accordiontoadd;
                },
                width: "250px"
            }).data("kendoTooltip");
            tooltip.show($("#activitiescounterbadge"));
        },
        error: function (result) {
            kendoConsole.log("Error loading activities", true);
        }
    });
    //mock (class = workflow, type = tipo att. , action = attivita')
    //var mock = [{ id: 10, Typeid: 1, Type: "Censim. nuovo asset", Classid: 1, Class: "Censimento Asset", Catid: 12, actionid: 1, actionDescription: "inserisci asset", actiontype: "Open Stored Procedure", actiontypeid: 1, actioncommand: '{"SP":"dbo.prova"}' }
    //];

    
}

//popolamento del counter di attivita'
function evaluateWorkflowBadgeCounter(functionid)
{
    $.ajax({
        type: "POST",
        url: "/api/WORKFLOWS/GetActivitiesForFunctionCounter/",
        data: JSON.stringify({ FunctionID: functionid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            var counter = result.counter;
            if (result.counter > 0) {
                //num attivita, testo, id del bottone , attributo functionid
                var htmlbadge = buildCounterBadgeButton(counter, getObjectText("wrkflacts"), "activitiescounterbadge");
                $(".page-title")
                    .append('<div functionid=' + functionid + ' id="wrkactdiv" style="float:right;margin-top: 2px;display:none;"> ' + htmlbadge + '</div>');
                //clickworkflowsbadge definita in reftreeWorkflows.js
                $("#wrkactdiv").click(clickworkflowsbadge);
                $("#wrkactdiv").fadeIn();
            }
        },
        error: function (result) {
            kendoConsole.log("Error loading activities", true);
        }
    });

}
