(function (window) {
    function parseXmlJsonValue(result, xmlColumns) {
        var abort = true;
        if(!result.length)
            return;
        if (Array.isArray(result[0]))
            $.each(result, function (k, v) {
                parseXmlJsonValue(v, xmlColumns);
            });
        else{
            var columnsToParse = [];
            $.each(xmlColumns, function (k, v) {
                if(v in result[0])
                    columnsToParse.push(v);
            });
            if (columnsToParse.length) {
                $.each(result, function (k, v) {
                    $.each(columnsToParse, function (kk, vv) {
                        result[k][vv] = JSON.parse(result[k][vv]).root;
                    });
                });
            }
        }
    }

    function handleResFromGenericSQLController(res, maybePartiallyWentWell, config) {
        return $.Deferred(function (promise) {
            if (maybePartiallyWentWell) {
                console.log("if you want to know if inserted/updated with success add table and primaryKeyColumn to your insert/update call");
                promise.resolve(null);
                return;
            }
            else if (res.Errors) {
                kendoConsole.log(res.Errors, true);
                return promise.reject(res.Errors);
                //throw ("ERROOOORRR!!!!!! in response from GenericSQLCommand: " + res.Errors);
            }

            var result;
            if (res.Data && res.Data.length) {
                result = res.Data[0].Table;
            }
            else if(Array.isArray(res)){
                result = [];
                $.each(res, function (k, v) {
                    if (v.drows && v.drows.length && v.drows[0].Table)
                        result.push(v.drows[0].Table);
                });
            }
            else
                result = [];

            if (config.xmlToJson) {
                parseXmlJsonValue(result, config.xmlToJson);
            }

            if (config.$http) {
                result = {
                    status: 200,
                    data: result,
                    headers: {},
                    config: {},
                    statusText: ""
                };
            }
            if (config.$scope) {
                setTimeout(function () {
                    config.$scope.$apply();
                }, 0);
            }

            promise.resolve(result);
        }).promise();
    }

    function parseMongoJSON(JSONString) {
        var JSONObject = JSON.parse(JSONString);
        return parseMongoObject(JSONObject);
    }

    function parseMongoObject(JSONObject, parent, parentKey) {
        $.each(JSONObject, function (k, v) {
            if (v && typeof v == "object")
                parseMongoObject(v, JSONObject, k);
            else if (k[0] == "$") {
                switch (k) {
                    case "$date":
                        parent[parentKey] = new Date(v);
                        break;
                    case "$oid":
                        parent[parentKey] = v;
                        break;
                }
            }
        });
    }
    function getTreeDataFromDB(options) {
        var treedataavailable = new $.Deferred();
        if (!options.name)
            treedataavailable.resolve(null);
        else {
            $.getJSON("/api/Magic_Trees/GetByName/" + options.name, createtree);
            function createtree(thetreeobj) {
                var ds = buildGenericSelectDataSource(thetreeobj.DataSourceRead, thetreeobj.DataSourceCustomJSONParam, thetreeobj.BaseEntityName, -1, options.data);
                ds.change = function (e) {
                    var array = this.data();
                    var tree = [];
                    var root = convertDatabaseToLocalJSONTreeSearchRoot(array);
                    treerecursivevisit(tree, array, root, null, array, thetreeobj.StartExpanded);
                    treedataavailable.resolve(tree);
                }
                var dataSource = new kendo.data.DataSource(ds).read();
            }
        }
        return treedataavailable.promise();
    }
    function removeConfigValues(data) {
        var config = {};
        config.xmlToJson = data.xmlToJson;
        config.$http = data.$http;
        config.$scope = data.$scope;
        config.action = data.action;
        delete data.$http;
        delete data.$scope;
        return config;
    }
    function kendoGantt_(config)
    {
        var self = {};
        //build the object 
        var dateto = new Date();
        //add 1 month as default To...
        dateto.setMonth(dateto.getMonth() + 1);
        self.magicDateFilter = {
            logic: "AND",
            filters: [
             { field: "start", operator: "gte", value: new Date() },
             { field: "end", operator: "lte", value: dateto }],
            type: "dateFilters"
        };
        self.magicTreeFilter = config.treeFilter;
        self.magicTreeData = config.treeData;
        self.containerSelector = config.containerSelector;
        self.magicTreeOptions = config.treeOptions;
        var columns =
                [
                    { field: "title", title: getObjectText("task"), width: "250px" },
                    { field: "start", title: getObjectText("dateFrom"), format: "{0:yyyy-MM-dd HH:mm}" },
                    { field: "end", title: getObjectText("dateTo"), format: "{0:yyyy-MM-dd HH:mm}" }
                ];
        var saveTasksSp = config.storedProcedures.saveTasks;
        var saveDepsSp = config.storedProcedures.saveDeps;
        var tasksDataSource = new kendo.data.GanttDataSource({
            batch: true,
            serverFiltering: true,
            transport: {
                read: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    contentType: "application/json",
                    data: { storedprocedure: config.storedProcedures.tasksAndDependenciesLoad },
                    type: "POST"
                },
                update: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    data: { storedprocedure: saveTasksSp, ganttaction: "update" },
                    contentType: "application/json",
                    type: "POST"
                },
                destroy: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    data: { storedprocedure: saveTasksSp, ganttaction: "destroy" },
                    contentType: "application/json",
                    type: "POST"
                },
                create: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    data: { storedprocedure: saveTasksSp, ganttaction: "create" },
                    contentType: "application/json",
                    type: "POST"
                },
                parameterMap: function (options, operation) {
                    if (operation == "read") {
                        var $gantt = $(self.containerSelector);
                        options.filter = combineDataSourceFilters($gantt.data("filter"), $gantt.data("External_filter"));
                        options.selectedIds = $gantt.data("checkedIds");
                    }
                    if (operation != "read") { //kendo management of timezones fix...
                        var $gantt = $(self.containerSelector);
                        options.filter = $gantt.data("filter");
                        $.each(options.models, function (i, data) {
                            if (!data.startUTC) { //D.T 9/3/2016:Stop adding offset if previously i had server side errors !!!
                                data.startUTC = new Date(data.start.getTime());
                                data.endUTC = new Date(data.end.getTime());
                                data.start = toTimeZoneLessString(data.start);
                                data.end = toTimeZoneLessString(data.end);
                            }
                        });
                    }
                    return kendo.stringify(options);
                }
            },
            error: function (e) {
                if (e.xhr && e.xhr.responseText)
                    kendoConsole.log(e.xhr.responseText, true);
                else
                    kendoConsole.log("KO !!!", true);
            },
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: { from: "id", type: "number" },
                        orderId: { from: "orderId", type: "number", validation: { required: true } },
                        parentId: { from: "parentId", type: "number", validation: { required: true } },
                        start: { from: "start", type: "date" },
                        end: { from: "end", type: "date" },
                        title: { from: "title", defaultValue: "", type: "string" },
                        percentComplete: { from: "percentComplete", type: "number" },
                        virtual: { from: "virtual", type: "boolean", defaultValue: true },
                        tasktypeId: { from: "tasktypeId", type: "number", defaultValue: 1, validation: { required: true } },
                        summary: { from: "summary" },
                        expanded: { from: "expanded" }
                    }
                },
                parse: function (data) {
                    return data[0].drows.length ? data[0].drows[0].Table : [];
                }
            }
        });
        var assignments = {
            dataSource: {
                batch: true,
                serverFiltering: true,
                transport: {
                    read: {
                        url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                        dataType: "json",
                        contentType: "application/json",
                        data: { storedprocedure: config.storedProcedures.assignmentsLoad },
                        type: "POST"
                    },
                    //update: {
                    //    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    //    dataType: "json",
                    //    contentType: "application/json",
                    //    data: { storedprocedure: config.storedProcedures.assignmentsSave },
                    //    type: "POST"
                    //},
                    //destroy: {
                    //    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    //    dataType: "json",
                    //    contentType: "application/json",
                    //    data: { storedprocedure: config.storedProcedures.assignmentsSave },
                    //    type: "POST"
                    //},
                    //create: {
                    //    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    //    dataType: "json",
                    //    contentType: "application/json",
                    //    data: { storedprocedure: config.storedProcedures.assignmentsSave },
                    //    type: "POST"
                    //},
                    parameterMap: function (options, operation) {
                        return kendo.stringify(options);
                    }
                },
                schema: {
                    parse: function (data) {
                        return data[0].drows.length ? data[0].drows[0].Table : [];
                    }
                }
            }
        };
        var depsDataSource = new kendo.data.GanttDependencyDataSource({
            batch: true,
            serverFiltering: true,
            transport: {
                read: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    contentType: "application/json",
                    data: { storedprocedure: config.storedProcedures.tasksAndDependenciesLoad, dependency: true },
                    type: "POST"
                },
                update: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    data: { storedprocedure: saveDepsSp, ganttaction: "update" },
                    contentType: "application/json",
                    type: "POST"
                },
                destroy: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    data: { storedprocedure: saveDepsSp, ganttaction: "destroy" },
                    contentType: "application/json",
                    type: "POST"
                },
                create: {
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    data: { storedprocedure: saveDepsSp, ganttaction: "create" },
                    contentType: "application/json",
                    type: "POST"
                },
                parameterMap: function (options, operation) {
                    if (operation == "read") {
                        var $gantt = $(self.containerSelector);
                        options.filter = $gantt.data("filter");
                        options.selectedIds = $gantt.data("checkedIds");
                    }
                    return kendo.stringify(options);
                }
            },
            error: function (e) {
                if (e.xhr && e.xhr.responseText)
                    kendoConsole.log(e.xhr.responseText, true);
                else
                    kendoConsole.log("KO !!!", true);
            },
            schema: {
                parse: function (data) {
                    return data[0].drows.length ? data[0].drows[0].Table : [];
                }
            }
        });


        self.magicGanttOptions = {
            editable: { template: $("#gantt_editor").html() },//defined in MagicSDK
            edit: function (e) {
                requireConfigAndMore(["MagicSDK"], function (MF) {
                    MF.api.get({
                        table: "dbo.Magic_Calendar_TaskTypes",
                        where: "1 = 1",
                        order: "Description"
                    }).then(function (res) {
                        $("#tasktypeIddd").data("kendoDropDownList").setDataSource(res);
                        $("#tasktypeIddd").data("kendoDropDownList").value(e.task.tasktypeId);
                    });
                });
                var gantt = e.sender;
                if (e.task) {
                    e.container.on('click', 'div[data-container-for="resources"] > a', function (event) {
                        e.task.MF_Assignments_opened = true;
                        event.preventDefault();
                        gantt._createResourceEditor(e.container.find('div.k-gantt-resources'), e.task);
                    });
                }
                if (config.bOSelector) {
                    $bOSelector = $('<div class="col-sm-10"></div>');
                    e.container.find('[class=k-edit-field]:last').after($bOSelector);
                    var bOselector = $bOSelector.bOSelector({
                        tags: e.task.MagicBusinessObjectList ? JSON.parse(e.task.MagicBusinessObjectList) : [],
                        multiselect: false
                    });
                    //manage  BO selector 

                    if (config.bOSelector.linkedBoType)
                        $bOSelector.bOSelector('setFilter', config.linkedBoType);
                    else
                        $bOSelector.bOSelector('deleteFilter');
                }
            },
            save: function (e) {
                if (e.task && e.task.MF_Assignments_opened) {
                    e.task.dirty = true; // if the popup of resource assignments has been opened the save event is triggered (even if resources are the same) 
                    this._updateAssignments(e.task.get("id"), e.task.get(this.resources.field)); //updates the fornt-end assignments ... there's no other way to customize the template ...
                    e.task.MF_Assignments_opened = false;
                }
            },
            dataSource: tasksDataSource,
            views: [
                "day",
                { type: "week", selected: true },
                "month"
            ],
            columns: columns,
            height: 500,
            showWorkHours: false,
            showWorkDays: false,
            snap: false,
            resizable: true,
            toolbar: ["append", "pdf"],
            pdf: {
                fileName: "Gantt_Export.pdf"
            },
            messages: {
                actions: {
                    addChild: getObjectText("gantt_addnewchild"),
                    append: getObjectText("gantt_append"),
                    insertAfter: getObjectText("gantt_insertafter"),
                    insertBefore: getObjectText("gantt_insertbefore"),
                    pdf: getObjectText("PdfExport")
                },
                cancel: getObjectText("cancel"),
                deleteDependencyConfirmation: getObjectText("proceedwithoperation"),
                deleteDependencyWindowTitle: getObjectText("gantt_deletedependencywindowtitle"),
                deleteTaskConfirmation: getObjectText("proceedwithoperation"),
                deleteTaskWindowTitle: getObjectText("gantt_deletetaskwindowtitle"),
                destroy: getObjectText("delete"),
                editor: {
                    assignButton: getObjectText("assign"),
                    editorTitle: getObjectText("gantt_editortitle"),
                    end: getObjectText("dateTo"),
                    percentComplete: getObjectText("gantt_percentcomplete"),
                    resources: getObjectText("gantt_resources"),
                    resourcesEditorTitle: getObjectText("gantt_resources"),
                    resourcesHeader: getObjectText("gantt_resources"),
                    title: getObjectText("task"),
                    start: getObjectText("dateFrom"),
                    unitsHeader: getObjectText("gantt_unitsheader")
                },
                save: getObjectText("save"),
                views: {
                    day: getObjectText("days"),
                    end: getObjectText("end"),
                    month: getObjectText("months"),
                    week: getObjectText("weeks"),
                    year: getObjectText("years")
                }
            }
        };
        if (depsDataSource)
            self.magicGanttOptions.dependencies = depsDataSource;
        if (config.resourcesDataSource) {
            self.magicGanttOptions.resources = {};
            self.magicGanttOptions.resources.dataSource = config.resourcesDataSource;
            self.magicGanttOptions.resources.dataFormatField = "unit";
        }
        if (config.storedProcedures.assignmentsLoad)
            self.magicGanttOptions.assignments = assignments;
        return self;
    }
    //builds the object which should be used when e.g initializing the angular magic-gantt directive
    function buildGanttObject(options,containerselector)
    {
        var deferred = new $.Deferred();
        function getResources(data, sp, MF) {
            var resdataavailable = new $.Deferred();
            if (!sp)
                resdataavailable.resolve(null);
            else
                MF.api.getDataSet(options.data, options.storedProcedures.resourcesLoad).then(function (ds) {
                    resdataavailable.resolve(ds);
                });
            return resdataavailable.promise();
        }

        if (!options.storedProcedures)
            throw ("Stored procedure names are required!");
        if (!options.storedProcedures.tasksAndDependenciesLoad)
            throw ("Stored procedure name for tasksAndDependenciesLoad is required!");
        if (!options.storedProcedures.saveTasks)
            throw ("Stored procedure name for saveTasks is required!");
        if (!options.storedProcedures.saveDeps)
            throw ("Stored procedure name for saveDeps is required!");
        var element = getAngularControllerRootHTMLElement("Gantt", false);

        if (!options.data)
            options.data = { x: 1 };
        var dateto = new Date();
        //add 1 month as default To...
        dateto.setMonth(dateto.getMonth() + 1);
        treeData = { dateFrom: new Date(), dateTo: dateto };
        var treeoptions = { name: options.treeFilter, data: treeData };
        $.when(getTreeDataFromDB(treeoptions), getResources({ ganttName: options.ganttName }, options.storedProcedures.resourcesLoad, MF)).then(function (tree, resourceTables) {
            options.treeData = tree;
            options.treeOptions = treeoptions;
            options.containerSelector = containerselector;
            if (resourceTables && resourceTables.length) {
                options.resourcesDataSource = resourceTables[0];
                //if (resourceTables.length > 1)
                //    options.assignmentsDataSource = resourceTables[1];
            }
            //add the gantt edit tamplate to the page
            var gantt_editTemplate = '<script id="gantt_editor" type="text/x-kendo-template">\
                                           <div class="k-edit-label">\
                                            <label for="title">'+ getObjectText("task") + '</label>\
	                                        </div>\
	                                        <div class="k-edit-field">\
		                                        <input type="text" id="title" class="k-input k-textbox" name="title" data-bind="value:title" required/>\
	                                        </div>\
	                                        <div class="k-edit-label">\
		                                        <label for="start">'+ getObjectText("dateFrom") + '</label>\
	                                        </div>\
	                                        <div class="k-edit-field">\
		                                        <input type="date" name="start" id="start" data-bind="value:start" data-role="datetimepicker" required/>\
	                                        </div>\
	                                        <div class="k-edit-label">\
		                                        <label for="end">'+ getObjectText("dateTo") + '</label>\
	                                        </div>\
	                                        <div class="k-edit-field">\
		                                        <input type="date" name="end" id="end" data-bind="value:end" data-role="datetimepicker" required/>\
	                                        </div>\
	                                        <div class="k-edit-label">\
		                                        <label for="percentComplete">'+ getObjectText("gantt_percentcomplete") + '</label>\
	                                        </div>\
	                                        <div class="k-edit-field">\
		                                        <input name="percentComplete" data-bind="value:percentComplete" data-role="numerictextbox" data-format="p0" min="0" max="1" step="0,1" />\
	                                        </div>\
	                                        <div class="k-edit-label">\
                                            <label for="virtual">' + getObjectText("gantt_planonly") + '</label>\
	                                        </div>\
	                                        <div class="k-edit-field">\
		                                        <input type="checkbox" id="virtual" name="virtual" data-bind="checked:virtual" />\
	                                        </div>\
	                                        <div class="k-edit-label">\
		                                        <label for="tasktypeId">' + getObjectText("tasktype") + '</label>\
	                                        </div>\
	                                        <div class="k-edit-field">\
		                                        <input id="tasktypeIddd" name="tasktypeId" data-bind="value:tasktypeId" data-option-label="N/A" data-value-field="taskTypeID" data-text-field="Description" data-source="res" data-role="dropdownlist" required  data-value-primitive="true" />\
	                                        </div>\
                                        ';
            if (options.resourcesDataSource)
                gantt_editTemplate = gantt_editTemplate + '<div>\
                                                              <div class="k-edit-label">\
		                                                        <label for="resources">' + getObjectText("gantt_resources") + '</label>\
	                                                        </div>\
                                                              <div class="k-gantt-resources" style="display: none;">\
                                                              </div>\
                                                              <div id="resources" class="k-edit-field" data-container-for="resources">\
                                                                <a class="k-button" href="\\#">'+ getObjectText("assign") + '</a>\
                                                              </div>\
                                                            </div>';

            gantt_editTemplate = gantt_editTemplate + '</script>';
            if (!$("#gantt_editor").length)
                $("#templatecontainer").append(gantt_editTemplate);

           


            deferred.resolve(kendoGantt_(options));
            //initAngularController(element, "GanttController", options, undefined, false);
        });
        return deferred.promise();
    }
    //initialize and show the gantt in a modal or append it to a certain container (containerselector is the $ for the container if not modal) 
    function showGanttContentInModalOrGivenContainer(options, containerselector) {
       
        var element = getAngularControllerRootHTMLElement("Gantt", false);

        var containerDefault = "#wndmodalContainer";
        if (!containerselector)
            containerselector = containerDefault;
        var currGantt = $(containerselector).find("[data-role=gantt]");
        if (currGantt.data("kendoGantt")) {
            currGantt.data("kendoGantt").destroy();
        }
        if (containerselector == containerDefault) {
            cleanModal();
            var $modalContent = showModal({
                title: '<i class="fa fa-tasks"></i>',
                content: element,
                wide: true
            });
        }
        else 
            $(containerselector).append(element);

        buildGanttObject(options,containerselector).then(function (ganttobject) {
            initAngularController(element, "GanttController", ganttobject, undefined, false);
        });
    }

    var MF =
    {
        devExtreme: {
            getDxPivotObject: function (options)
            {
                function buildPivot(code) {
                    return $.getJSON("/api/Magic_Pivot/Get/" + code)
                        .then(function (pivotdata) {
                            var config = pivotdata.config.Table[0],
                                data = JSON.parse(pivotdata.data);
                                options = {},
                                onLoadFieldsLayout = JSON.parse(config.OnLoadFieldsLayout),
                                general = onLoadFieldsLayout.general,
                                fields = onLoadFieldsLayout.fields,
                                store = config.DataSourceType == "OLAP" ? JSON.parse(config.OLAPDataSource).store : data[0].drows[0].Table;

                            $.each(fields, function (i, field) {
                                for (var k in field) {
                                    if (!field[k]) {
                                        delete field[k];
                                    }
                                    else {
                                        if (k == "format" && field[k] == "currency")
                                            field[k] = { currency: "EUR" } //default to EUR 
                                    }
                                }
                                if (field.extension)
                                {
                                    var extObj = JSON.parse(field.extension);
                                    $.extend(field, extObj);
                                    delete field.extension;
                                }
                            });
                            try {
                                if (general.extension) {
                                    $.extend(general, JSON.parse(general.extension));
                                    //EVAL string function defs in the extension JSON...
                                    $.each(general, function (key, value) {
                                        if (key.indexOf("on") == 0) //event 
                                        {
                                            if (typeof value == "string" && value.indexOf("function") != -1)
                                            {
                                                //eval needs the function to be included in ()
                                                if (value.indexOf("(") == -1)
                                                    value = "(" + value + ")";
                                                general[key] = eval(value);
                                            }
                                        }
                                    });
                                    delete general.extension;
                                }
                            }
                            catch (exc) {
                                console.log(exc);
                            }
                            $.extend(options, general, {
                                scrolling: {
                                    mode: "virtual"
                                },
                                height:"100%",
                                showBorders: true,
                                fieldPanel:{
                                    visible: true
                                },
                                export: {
                                    enabled: true
                                },
                                dataSource:{
                                    store: store,
                                    fields: fields
                                }
                            });
                            return options;
                    });
                }

                if (!options) {
                    throw "options are undefined";
                }
                if (!options.code)
                {
                    throw "pivot code is mandatory";
                }
                var code = options.pivotCode;
                return buildPivot(options.code);
            },
            appendPivotToDom: function (options)
            {
                var promise = $.Deferred();
                loadCss(["dx.common", "dx.light"], window.includesVersion + "/Magic/DevExtreme/Lib/css/");
                if (!options.selector)
                    throw "specify a selector";
                if (!options.dxPivotObject)
                    throw "provide the pivot configuration (getPivotObject api)";
                requireConfigAndMore(["devExpress"], function () {
                    $(options.selector).dxPivotGrid(options.dxPivotObject);
                    var pivotinstance = $(options.selector).dxPivotGrid("instance");
                    promise.resolve(pivotinstance);
                });
                return promise;
            }
        },
        kendo: {
            //get the gantt options for Angular directive
            getGanttObject: buildGanttObject, 
            //show gantt in a given container, if not specified the gantt will be shown in a modal
            appendGanttToDom: showGanttContentInModalOrGivenContainer,
            //gets tree configuration from database and builds the tree object
            //returns a promise with the tree "business" data as parameter
            getTreeObject: getTreeDataFromDB,
            //gets grid configuration form database
            getGridObject: function (options) {

                var defaultOptions = {
                    gridName: "", //gridcode -> id -> MagicGridName
                    functionName: null,
                    BindedGridFilter: undefined,
                    BindedGridHideFilterCol: undefined,
                    BindedGridRelType_ID: undefined,
                    parentGridRowDataInEdit: null, //if u pass in the properties starting with Binded u need also to pass in the data of the model in edit
                    initialGridObject: null
                    //gridHtmlName: "", useless?
                    //functionId: null,
                    //layerId: "",
                    //async: true,
                    //filterField: "",
                    //e: "",
                    //hideFilterColumn: "",
                    //tabClass: "",
                    //showLayerOnly: "",
                    //gridTabIndex: "",
                    //gridRelationType: "",
                    //isCascadeSearch: ""
                };

                if (!options.gridName) {
                    throw ("gridName required!");
                }

                options = $.extend(defaultOptions, options);

                var gridObject = getrootgrid(options.gridName, options.functionName, undefined, undefined, undefined, undefined, undefined/*options.BindedGridFilter*/, undefined, options.BindedGridHideFilterCol, undefined, undefined, undefined, options.BindedGridRelType_ID, undefined, true, options.initialGridObject);

                if (options.BindedGridFilter) {
                    gridObject.then(
                        function (gridObject) {
                            filtersolver(options.BindedGridFilter.replace(/({|})\1+/g, "$1"), gridObject, { data: options.parentGridRowDataInEdit }, options.BindedGridHideFilterCol, "editPopup")
                            return gridObject;
                        }
                    );
                }
                
                return gridObject;
            },
            //returns data("kendoGrid")
            appendGridToDom: function (options) {
                var defaultOptions = {
                    kendoGridObject: null,
                    selector: undefined, //has to be an html id attribute without #, 2017: can now also be a jQuery element
                    pageTitle: ""
                };

                if (!options.kendoGridObject)
                    throw ("kendoGridObject required! Call getGridObject");

                options = $.extend(defaultOptions, options);

                var evalResult = function (kendoGridObject) {
                    var res = renderGrid(kendoGridObject, null, null, options.selector, options.pageTitle);
                    if (!res)
                        throw "error";
                    return $(res).data("kendoGrid");
                }

                if (options.kendoGridObject && options.kendoGridObject.then && options.kendoGridObject.always) {
                    return options.kendoGridObject.then(function (kendoGridObject) {
                        return evalResult(kendoGridObject);
                    });
                }
                else {
                    var promise = $.Deferred();
                    promise.resolve(evalResult(options.kendoGridObject));
                    return promise;
                }
            },
            //api per creare il tree definito in Magic_Trees sulla base del nome
            //options.name = nome del tree obligatorio (nome tree su tabella Magic_Trees)
            //options.data = oggetto JS da passare nell' xml in input alla stored di selezione indicata nel datasource del tree nei CustomJSONParam
            //options.showTreeDescription = mostrare h3 con la descrizione del Tree presa da DB (default true) 
            //options.treecontainer = il selettore (es.#divid) a cui appendere il tree
            //options.callback
            //showtreedescription = false / true   default true
            //hidenodeselector = ".k-top.k-bot"  permette di nascondere uno o piu' nodi sulla base del selettore (in questo caso toglie la root)
            appendTreeToDom: function (options) {
                if (!options.name)
                    throw ("name required!");

                return getrootAndRenderDBTree(options);
            },

            //returns kendoDataSource
            //options:
            //url: to read from
            getSelectDataSource: function (options) {
                if (!options.url)
                    throw ("url required");
                else {
                    options.Read = {
                        url: options.url
                    };
                }

                if (!options.data)
                    throw ("data required");
                else
                    options.Data = options.data;

                return getGenericSelectDataSource(options, options.success);
            },

            getStoredProcedureDataSource: function (storedProcedureName, options) {
                if (!storedProcedureName)
                    throw ("storedProcedureName is required!");
                if (!options.data)
                    throw ("data is required!");
                if (!options.success)
                    options.success = function () { };

                return buildXMLStoredProcedureJSONDataSource(options.data, options.success, storedProcedureName);
            },

            getSpreadSheetObject: function (code) {
                function kendofyMFObject(obj, JSONExtension)
                {
                    var kendoobject = obj.general;
                    var extension = JSONExtension ? JSON.parse(JSONExtension) : {};
                    kendoobject.sheets = obj.sheets;
                    return $.extend(kendoobject,extension);
                }

                var deferred = $.Deferred();
                if (!code)
                    throw ("code is mandatory!!!");
                $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/GetWithFilter",
                    contentType: "application/json",
                    data: JSON.stringify({ table: "dbo.Magic_SpreadSheet", where: "Code='" + code + "'", order: "Code" }),
                    dataType: "json"
                })
               .then(function (res) {
                   if (!res || !res.Data || !res.Data.length || !res.Data[0].Table.length)
                       throw ("No spreadsheet definition found with that code!!!");
                   var data = JSON.parse(res.Data[0].Table[0].SheetsDefinition);
                       deferred.resolve(kendofyMFObject(data, res.Data[0].Table[0].JSONExtension));
               });
                return deferred.promise();
            },

            appendSpreadSheetToDom: function (options)
            {
                var defer = new $.Deferred();
                function replaceFormulas(obj, rawDataFromDB)
                {
                    //get all the predefined rows with the Last set to true 
                     //each data corresponds to the sheet with the same index  ..
                    for (var i = 0 ; i < options.spreadSheetObject.sheets.length; i++) {
                        var datacount = 0;
                        if (rawDataFromDB[i].drows[0]) 
                            datacount = rawDataFromDB[i].drows[0].Table.length;
                        $.each(options.spreadSheetObject.sheets[i].rows, function (j, v) {
                        //Last means that should be put after data
                            v.index = (v.index ? v.index : j) + (v.Last ? datacount : 0);
                            $.each(v.cells, function (k, x) {
                                //replace the # with the data count in formulas and delete empty formulas
                                if (x.formula == "" || datacount==0)
                                    delete x.formula;
                                if (x.formula && x.formula.indexOf("#") != -1)
                                    x.formula = x.formula.replace(/#/g, (datacount+1).toString());
                            });
                        });
                    }
                }
                function loadFromJSON(kobj, obj, rawDataFromDB,dataValidator)
                {
                    function hideCols(obj,kobj)
                    {
                        for (var i = 0 ; i < obj.sheets.length; i++) {
                            $.each(obj.sheets[i].columns, function (j, v) {
                                try {
                                    if (v.hidden)
                                        kobj.sheetByIndex(i).hideColumn(j);
                                }
                                catch (e) {
                                    console.log("Problems hiding column");
                                    console.log(e);
                                }
                            });
                        }
                    }

                    $.each(rawDataFromDB, function (i, v) {
                        var columnsSettings = obj.sheets[i].columns;
                        var offset = obj.sheets[i].DataAppendOffset ? obj.sheets[i].DataAppendOffset : 0;
                        if (v.drows.length && v.drows[0])
                        $.each(v.drows[0].Table, function (index, value) {
                            var j = 0;
                            var indexPlusOffset = offset + index;
                            //if (!obj.sheets[i].rows[indexPlusOffset])
                            obj.sheets[i].rows.push({ index: indexPlusOffset, cells: [] });
                            $.each(value, function (prop, propval) {
                                var valueObj = {};
                                //if only a value is specified it will be assigned to the value property. If a JSON is passed it will be directly used as cell content
                                if (propval && typeof propval.indexOf == "function"  && propval.indexOf('{') != -1)// && propval.indexOf("formula") != -1)
                                    valueObj = JSON.parse(propval);
                                else 
                                    valueObj = { value: propval };
                                var val = {};
                                $.extend(val,columnsSettings[j], valueObj);
                                //number validator (hours in day)
                                if (dataValidator && j >= dataValidator[0].range[0] && j <= dataValidator[0].range[1]) 
                                    $.extend(val, { validation: dataValidator[0].validation });
                                //Yes/no list
                                if (dataValidator && dataValidator[1] && j >= dataValidator[1].range[0] && j <= dataValidator[1].range[1])
                                    $.extend(val, { validation: dataValidator[1].validation });
                                obj.sheets[i].rows.slice(-1)[0].cells.push(val);
                                j++;
                            });
                        });
                    });
                        
                    kobj.fromJSON(obj);//load spreadsheet with data 
                    hideCols(obj, kobj);
                }
                if (!options || !options.spreadSheetObject)
                    throw ("The spreadSheetObject property does not exist!!!");
                if (!options.selector) {
                    console.log("WARN - no selector has been provided, the spreadsheet will be appended to the #appcontainer");
                    $("#appcontainer").append("<div id='mf_spreadsheet'/>");
                }
                var $selector = $(options.selector ? options.selector : "#mf_spreadsheet");
                var spreadSheet = $selector.data("kendoSpreadsheet");
                
                var payload = { storedprocedure: options.spreadSheetObject.LoadSP, filter: options.filter };
                if (options.data)
                    $.extend(payload, options.data);
                    //load data
                $.ajax({
                    url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                    dataType: "json",
                    contentType: "application/json",
                    data: JSON.stringify(payload),
                    type: "POST"
                }).then(function (rawData) {
                        replaceFormulas(options.spreadSheetObject, rawData);
                    if (!spreadSheet) 
                        spreadSheet = $selector.kendoSpreadsheet(options.spreadSheetObject).data("kendoSpreadsheet");
                    loadFromJSON(spreadSheet, options.spreadSheetObject, rawData,options.dataValidator);
                    if (!$selector.data("MF"))
                        $selector.data("MF", { writeSP: options.spreadSheetObject.WriteSP });
                    else
                        $selector.data("MF").writeSP = options.spreadSheetObject.WriteSP;
                    defer.resolve(spreadSheet);
                });

                return defer.promise();
            }
        },
        api: {
            get: function (data) {
                if (!data.table && !data.storedProcedureName)
                    throw ("table or storedProcedureName is required!");
                //custom management of exceptions
                var errorCallBack = null;
                if (typeof data.errorCallBack == "function")
                    errorCallBack = data.errorCallBack;

                var defaultOptions = {
                    where: "1=1",
                    //order: string,
                    //parse: boolean,
                    //storedProcedureName: name of the stored to be called - currently works only for stored that returns multiple select
                    //data: data passed to the stored
                };

                var config = removeConfigValues(data);

                if (data.storedProcedureName) {
                    data.storedprocedure = data.storedProcedureName;
                    delete data.storedProcedureName;
                    if (data.data) {
                        $.extend(data, data.data);
                        delete data.data;
                    }
                }
                else
                    data = $.extend(defaultOptions, data);

                return $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/" + (data.storedprocedure ? "SelectDataSetFromXMLStoredProcedure" : "GetWithFilter"),
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    dataType: "json",
                    error: function (err) {
                        if (errorCallBack)
                            errorCallBack(err);
                        else
                            kendoConsole.log(err, true);
                    }
                })
                .then(function (res) {
                    return handleResFromGenericSQLController(res, null, config)
                });
            },
            set: function (options, id) {

                var defaultOptions = {
                    table: "",
                    primaryKeyColumn: "none",
                    action: id ? "update" : "create",
                    contentType: "JSON",
                    procedure: "dbo.Magic_Cmnds_ins_upd_del_stmt",
                    data: {},
                    id: id,
                    functionId: null,
                    layerId: null,
                    errorHandling: true
                };

                var config = removeConfigValues(options);

                options = $.extend(defaultOptions, options);

                if (!options.path) {
                    if (options.action == "update"){
                        if (!id)
                            throw ("provide an id for an update");
                        options.path = "PostU/" + id;
                        if (options.primaryKeyColumn)
                            options.data[options.primaryKeyColumn] = options.id;
                    }
                    else
                        options.path = "PostI";
                }

                var data = buildGenericPostInsertUpdateParameter(options.action, options.table, options.primaryKeyColumn, options.procedure, options.contentType, options.functionId, options.layerId, options.data, options.id);

                return $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/" + options.path,
                    contentType: "application/json",
                    data: data
                })
                .then(function (res) {
                    return options.errorHandling ? handleResFromGenericSQLController(res, options.action == "create" && (!options.table || !options.primaryKeyColumn), config) : res;
                });
            },
            delete: function (options, id) {
                if (!id || !options || !options.procedure)
                    throw ("You must hand in an id and options at least containing the procedure");

                var data = {
                    cfgoperation: "destroy",
                    cfgDataSourceCustomParam: '{ read:{Type: "StoredProcedure", Definition:"dbo.Magic_XMLCommands_usp_sel_stmt"}, destroy:{ Type: "StoredProcedure", DataFormat: "' + (options.contentType || "JSON") + '", Definition: "' + options.procedure + '" } }',
                    cfgfunctionID: options.functionId || 0,
                    cfgEntityName: options.tableName || options.procedure,
                    cfglayerID: options.layerId || 0,
                    cfgpkName: options.tablePrimaryKeyName || "sepp",
                    cfgColumns: []
                };

                if(options.data)
                    $.extend(data, options.data);

                if (options.tablePrimaryKeyName)
                    data[options.tablePrimaryKeyName] = id + "";

                return $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/PostD/" + id,
                    data: JSON.stringify(data),
                    contentType: "application/json",
                });
            },
            ///returns an array of data tables give a storedprocedurename and an object with input data of type object for the stored
            getDataSet: function (options,storeprocedurename)
            {
                var data = new $.Deferred();
                if (!storeprocedurename) {
                    console.log("Missing stored procedure name...");
                    data.resolve([]);
                }
                $.when(buildXMLStoredProcedureReturnDataSet(options, storeprocedurename)).then(function (tables) {
                    data.resolve(tables);
                })
                return data.promise();
            }
        },
        helpers: {
            handleResFromGenericSQLController: handleResFromGenericSQLController,
            parseMongoJSON: parseMongoJSON,
            parseMongoObject: parseMongoObject
        }
    };
    if (typeof define == "function") {
        define([],
            function () {
                return MF;
            }
        );
    }
    else
        window.MF = MF;
})(window);