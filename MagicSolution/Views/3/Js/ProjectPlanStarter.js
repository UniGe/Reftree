function loadscript()
{
    $("#appcontainer").append("<div id='mfGantt'></>")
    var config = {};
    config.ganttName = "TK_INTERV_order"; //mandatory
    //config.treeFilter = "usp_tk_interv_tree_filter"; //optional
    //config.bOSelector = { show: true, linkedBoType: [8] };//optional
    config.storedProcedures = {
        tasksAndDependenciesLoad: "CORE.NT_SP_GANTT_READ_HOUPLA", //mandatory
        saveTasks: "CORE.NT_SP_GANTT_SAVE_TASKS", //mandatory
        saveDeps: "CORE.NT_SP_GANTT_SAVE_DEPS", //mandatory 
        resourcesAndAssignmentsLoad: "CORE.NT_SP_GANTT_ASSIGN" //optional
    }
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.kendo.appendGanttToDom(config,"#mfGantt");  //a further parameter will be considered as the selector where the gantt will be appended. Default is modal container (parameter undefined) 
    });

}