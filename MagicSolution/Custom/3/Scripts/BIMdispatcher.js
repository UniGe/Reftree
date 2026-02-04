    var client = null;
    var bimServerUrl = "/api/BimCaller";
  

//#region BimServer Interface caller
    function login() {
        var deferred = $.Deferred();
        if (!client) {
            callApiMethod("AuthInterface", "login", { username: "", password: "" }).then(function (res) {
                client = { token: res.response.result };
                deferred.resolve(client.token);
            });
        }
        else
            deferred.resolve(client.token);
        return deferred.promise();
    }
    //obtain token
    login();
    function getRequestObject(interfaceName, methodName, data)
    {
        var payload = {
            request: {
                "interface": interfaceName,
                "method": methodName,
                "parameters": data
            }
        }
        if (client && client.token)
            payload.token = client.token;
        return payload;
    }
    function callApiMethod(interfaceName, methodName, data) {
        var method = "/callApiMethod";
        var payload = getRequestObject(interfaceName, methodName, data);
        return $.ajax({
            url: bimServerUrl + method,
            data: JSON.stringify(payload),
            type: "POST", contentType: "application/json; charset=utf-8", dataType: "JSON"
        });
    }
//#endregion
//#region function for UI buttons
    function bim_dispatcher(e) {
        var jsonpayload = {};
        try {
            jsonpayload = getRowJSONPayload(e);
        }
        catch (e) {
            console.log("jsonpayload is not a valid json:" + e.message);
        }
        var rowdata = getRowDataFromButton(e.currentTarget);
        switch (jsonpayload.action) {
            case "checkin":
                checkIn(rowdata, e.currentTarget, jsonpayload.subproject);
                break;
            case "publishproject":
                publishProject(rowdata, e.currentTarget);
                break;
            case "detachproject":
                detachProject(rowdata, jsonpayload.subproject ? true : false, e.currentTarget);
                break;
            case "downloadBIMData":
                downloadBIMData(rowdata, e.currentTarget);
                break;
        }
        return;
    }
    function downloadBIMData(rowdata,e)
    {
        var obj = {
            BIM_PROJECT_ID: rowdata.BIM_PROJECT_ID,
            bimServerProjectId: rowdata.bimServerProjectId
        }
        $.fileDownload('/api/BIM_PROJECTS/downloadObjectDataAsZip/', { data: obj, httpMethod: "POST" });
    }
    function resetPendingCheckIns() {
        requireConfigAndMore(["MagicSDK"], function (MF) {
            return MF.api.set({
                table: "bim.checkin_process_queue",
                procedure: "BIM.ch_usp_reset_process_queue_dml",
                primaryKeyColumn: "queue_id",
                contentType: "XML",
            }, 1).then(function () {
                kendoConsole.log(getObjectText("resetperformed"), false);
            });
        });
    }
//#endregion
//#region logger
    function initDataBaseLogger(MF, data, id) {
        return MF.api.set({
            table: "bim.checkin_process_queue",
            procedure: "BIM.ch_usp_checkin_process_queue_dml",
            primaryKeyColumn: "queue_id",
            contentType: "XML",
            data: data
        }, id);
    }
    function logToDb(data, logger_id, topicId) {
        var payload = {};
        var loggerTablePk = "queue_id";
        var loggerTable = "bim.checkin_process_queue";
        var loggerStoredProcedure = "BIM.ch_usp_checkin_process_queue_dml";
        data[loggerTablePk] = logger_id;
        payload.requestObject = getRequestObject("NotificationRegistryInterface", "getProgress", { topicId: topicId });
        payload.dataBaseLogger = JSON.parse(buildGenericPostInsertUpdateParameter("update", loggerTable, loggerTablePk, loggerStoredProcedure, "XML", -1, -1, data, logger_id));
        payload.dataBaseLogger.procedure = loggerStoredProcedure;
        $.ajax({
            url: bimServerUrl + "/getProgressAndLogToDb/" + logger_id,
            data: JSON.stringify(payload),
            type: "POST", contentType: "application/json; charset=utf-8", dataType: "JSON"
        });
    }
    function updateProgressBar(value,title) {
        var html = '<label>{1}</label>\
                       <div class="progress">\
                        <div class="progress-bar" role="progressbar" aria-valuenow="{0}"\
                                                        aria-valuemin="0" aria-valuemax="100" style="width:{0}%">\
                                                            <span class="sr-only">{0}% Complete</span>\
                                                        </div>\
                    </div>'.format(value.toString(), title);
        $("#contentofmodal").html(html);
    }

    function getProgress(topicId) {
        return callApiMethod("NotificationRegistryInterface", "getProgress", {
            "topicId": topicId
        });
    }
    function progressLogger(topic, checkinqueue)//,MF)
    {
        getProgress(topic.topicId).then(function (progress) {
            var pr = progress.response.result;
            updateProgressBar(pr.progress, pr.title);
            if (pr.state == "AS_ERROR" || pr.state == "FINISHED") {
                kendoConsole.log(pr.title, pr.state == "AS_ERROR" ? true : false);
                return;
            }
            setTimeout(progressLogger(topic, checkinqueue//, MF
                ), 15000);
        });
    }

//#endregion
//#region Bim server calls implementation
    function getSuggestedDeserializerForExtension(rowdata)
    {
        return callApiMethod("ServiceInterface", "getSuggestedDeserializerForExtension", {
            "poid": rowdata.bimServerProjectId || rowdata.parentPoid,
            "extension":"ifc"
        });

    }
    function addProject(rowdata, subproject) {
        if (subproject)
            return addProjectAsSubProject(rowdata);
        else
            return callApiMethod("ServiceInterface", "addProject", {
                "schema": rowdata.BIM_SCHEMA_CODE,
                "projectName": rowdata.BIM_PROJECT_CODE
            });
    }
    function addProjectAsSubProject(rowdata) {
        return callApiMethod("ServiceInterface", "addProjectAsSubProject", {
            "schema": rowdata.BIM_SCHEMA_CODE,
            "projectName": rowdata.BIM_SUBPROJ_CODE,
            "parentPoid": rowdata.parentPoid
        });
    }
    function deleteProject(poid)
    {
        return callApiMethod("ServiceInterface", "deleteProject", {
            "poid":poid 
            });

    }
    function bim_project_manager(rowdata, subproject)
    {
        var deferred = $.Deferred();
        if ((!subproject && !rowdata.bimServerProjectId) || (subproject && !rowdata.bimServerSubProjectId))
            addProject(rowdata, subproject).then(function (res) {
                console.log(res);
                if (res.response.exception) {
                    kendoConsole.log(res.response.exception.message);
                    return;
                }
                requireConfigAndMore(["MagicSDK"], function (MF) {
                    MF.api.set({
                        contentType: "XML",
                        procedure: "BIM.usp_Upd_Proj_With_BimServerData",
                        data: $.extend(res.response.result, { SUBPROJECT: subproject ? true : false })
                    }, rowdata.id).then(function () {
                        deferred.resolve(res.response.result.oid);
                    });
                });
            });
        else
            deferred.resolve(subproject ? rowdata.bimServerSubProjectId : rowdata.bimServerProjectId);
        return deferred.promise();
    }
    function checkIn(rowdata,e,subproject)
    {
        if (subproject && !rowdata.bimServerSubProjectId && !rowdata.parentPoid)
        {
            kendoConsole.log("Check-in not allowed. Attach the parent project.",true);
            return;
        }

        if (!(rowdata.bimServerProjectId || rowdata.parentPoid))
        {
            kendoConsole.log("Check-in not allowed. Attach the project first.",true);
            return;
        }

        var checkin = function (MF,subproject) {
            if ((!subproject && !rowdata.BIM_PROJECT_LAST_IFC) || (subproject && !rowdata.BIM_SUBPROJ_LAST_IFC)) {
                kendoConsole.log("IFC file is missing!", true);
                return;
            }
            //create a project if it's the 1st checkin
            bim_project_manager(rowdata, subproject).then(function (poid) {
                getSuggestedDeserializerForExtension(rowdata).then(function (res) {
                    if (res.response.exception) {
                        console.log(res, true);
                        kendoConsole.log("Errors when getting deserializer", true);
                        return;
                    }
                    var deserialiredOid = res.response.result.oid;
                    var ifcfile = subproject ? JSON.parse(rowdata.BIM_SUBPROJ_LAST_IFC)[0].name : JSON.parse(rowdata.BIM_PROJECT_LAST_IFC)[0].name;
                    var project_id = subproject ? rowdata.BIM_SUBPROJ_BIM_PROJECT_ID : rowdata.BIM_PROJECT_ID;
                    var subproject_id = subproject ? rowdata.BIM_SUBPROJ_ID : null;
                    doModal(true);
                    callApiMethod("ServiceInterface","checkin",{ poid: poid, deserializerOid: deserialiredOid, token: client.token, comment: "reftree checkin: " + ifcfile, ifcfile: ifcfile,merge:false,sync:false })
                    .then(function (topic) {
                        doModal(false);
                        if (!topic.response.exception) {
                            var data = { queue_id: 0, type: "project", project_id: project_id, subproject_id: subproject_id, progress_perc: 0, topicId: topic.response.result, in_progress: true, process_state: "SUBMITTED", time_start: toTimeZoneLessString(new Date()), time_end: null };
                            initDataBaseLogger(MF, data)//writes the first record in the logging table and returns the id 
                               .then(function (checkinqueue) {
                                   logToDb(data, checkinqueue[0].queue_id, topic.response.result);//starts thread which logs progress to DB for the given id...
                                   rebuildGenericModal();
                                   $("div.modal-header .modal-title").html(ifcfile);
                                   updateProgressBar(0,"INIT");
                                   $("#executesave").hide();
                                   $("#wndmodalContainer").modal('show');
                                   setTimeout(progressLogger({ topicId: topic.response.result }, checkinqueue, MF), 1000);
                               });
                        }
                        else {
                            kendoConsole.log("Checkin failed!!!", true);
                            console.log(topic);
                        }
                    }).fail(function () { doModal(false); });
                });


            });
        }
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ //#felixnottodo
                table: "bim.checkin_process_queue",
                where: "in_progress = 1",
                order: "queue_id"
            })
            .then(function (res) {
                if (res.length)
                {
                    kendoConsole.log("Another check in is in progress.Check the pending checkins and retry later.",true);
                    return;
                }
                checkin(MF,subproject);
            }, function (res) {
                console.log(res);
            });
        });
        
    }
    function publishProject(rowdata, e)
    {
        if (rowdata.bimServerProjectId)
        {
            kendoConsole.log("Project already published to BIMServer!");
            return;
        }
        bim_project_manager(rowdata).then(function () {
            kendoConsole.log("Project published to BIMServer!", false);
            $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
        });
    }
    function detachProject(rowdata, subproject,e) {
        if ((!rowdata.bimServerProjectId && !subproject) || (!rowdata.bimServerSubProjectId && subproject)) {
            kendoConsole.log("Project is not linked to BIMServer!", true);
            return;
        }
        var oid = rowdata.bimServerProjectId ? rowdata.bimServerProjectId : rowdata.bimServerSubProjectId;
        deleteProject(oid).then(function (res) {
            if (res.response.exception) {
                kendoConsole.log(res.response.exception.message);
                return;
            }
            requireConfigAndMore(["MagicSDK"], function (MF) {
                MF.api.set({
                    contentType: "XML",
                    procedure: "BIM.usp_Upd_Proj_With_BimServerData",
                    data: { SUBPROJECT: subproject ? true : false, oid: null }
                }, rowdata.id).then(function () {
                    $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
                    kendoConsole.log("Project has been detached from BIMServer!",false);
                });
            });
        });
    }
//#endregion
