function loadscript() {
    $("#appcontainer").append("<div id='mfGantt'></>")
    var config = {};
    config.ganttName = "GANTT_SAMPLE"; //mandatory
    config.treeFilter = "Table_Example_Tree"; //optional
    //config.bOSelector = { show: true, linkedBoType: [8] };//optional
    config.storedProcedures = {
        tasksAndDependenciesLoad: "CUSTOM.Gantt_Load", //mandatory
        saveTasks: "CUSTOM.Gantt_Save", //mandatory
        saveDeps: "CUSTOM.Gantt_Save_Dependencies", //mandatory 
        resourcesAndAssignmentsLoad: "CUSTOM.Gantt_Load_Assignments" //optional
    }
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.kendo.appendGanttToDom(config, "#mfGantt");  //a further parameter will be considered as the selector where the gantt will be appended. Default is modal container (parameter undefined) 
    });

}