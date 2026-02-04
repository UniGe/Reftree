function loadscript() {
    $("#appcontainer").append("<div id='mfGantt'></>")
    var config = {};
    config.ganttName = "GANTT_OPERATIONS"; //mandatory
    config.treeFilter = "Project_Tree_Gantt_Filter"; //optional
    //config.bOSelector = { show: true, linkedBoType: [8] };//optional
    config.storedProcedures = {
        tasksAndDependenciesLoad: "Base.usp_Gantt_Tasks_Load", //mandatory
        saveTasks: "Base.usp_Gantt_Tasks_Save", //mandatory
        saveDeps: "Base.usp_Gantt_Dependencies_Save", //mandatory 
        resourcesLoad: "Base.usp_Gantt_Resources_Load", //optional
        assignmentsLoad: "Base.usp_Gantt_Assignments_Load" //optional
        //assignmentsSave: "Base.usp_Gantt_Assignments_Save" //optional
    }
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.kendo.appendGanttToDom(config, "#mfGantt");  //a further parameter will be considered as the selector where the gantt will be appended. Default is modal container (parameter undefined) 
    });

}