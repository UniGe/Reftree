//Get filters from session ...
try {
    if (!sessionStorage.getItem("MF_ASPSessionGridFilter")) {
        let prefix = '';
        if (window.ApplicationInstanceName.indexOf("roma_capitale") != -1) {
            prefix = '/servizi3/reftree2roma';
        }
        $.get(prefix+"/api/Cei/GetGridFiltersForLoggedUser").done(function (thisSessionFilter) {
            var filtersToapply = {};
            if (thisSessionFilter)
                filtersToapply = JSON.parse(thisSessionFilter);

            if (filtersToapply.length) {
                sessionStorage.setItem("MF_ASPSessionGridFilter", filtersToapply[0].filter);
                window.MF_ASPSessionGridFilter = JSON.parse(filtersToapply[0].filter);
            }
            //la custom event for cei Dashboard
            $('#appcontainer').trigger("onFilterSession");
        }).fail(function (e) {
            console.log(e);
        });
    } 
    else {
        window.MF_ASPSessionGridFilter = JSON.parse(sessionStorage.getItem("MF_ASPSessionGridFilter"));
        $('#appcontainer').trigger("onFilterSession");
    }

    //EXTENDED RANGE OF DATEPICKERS STARTING FROM 1800
    kendo.ui.DatePicker.fn.options.min = new Date(1800, 0, 1);

}
catch (ex) {
    console.log(ex);
}
//if The application is on a Mobile system ask the user to enable geo location
//if (isMobile())  
if (location.protocol == "https:")
    fetchUsersGeoLocation();//works with https only


//TEMPORARY SET LATITUDE AND LONGITUDE FOR DEVELOPMENT in desktop environment !!!
if (location.protocol == "http:")
    usersGeoLocation = {
        coords: {
            latitude: 46.485524299999994,
            longitude: 11.351578199999999
        }
    };
//store which gets the receivers if a certain message from grid
window.userMessageReceiversSp = "CORE.MF_GetUsersForGridMessage";

//use kendo style in "television"
//window.prefKendoStyle = true;
//#region gmap
//drop down above the themes' tree with gmaps
window.gmapTreeListLoaderSP = "core.GEO_GetAllTreesList";
window.gmapDetailSP = "core.GEO_GetTreeDetail";
window.gmapActionSP = "core.GEO_GMAPTREE_ACTION";
window.schedulerActionSP = "core.TreeScheduler_GetAction";
window.schedulerTreeListLoaderSP = "CUSTOM.TreeScheduler_GetAllTreeList";
window.schedulerTreeDetailSP = "CUSTOM.TreeScheduler_GetDetail";
window.schedulerInitFromGridSp = "core.GridScheduler_GetTasks";
window.showAllAtOnceFilter = true;
//shared between DWG and gmaps
window.userSessionManagementSp = "core.DWG_ManageFilterForUser";
//#endregion
//#region scheduler customizations
window.schedulerUpdate = "/api/RefTreeScheduler/PostU";
window.schedulerCreate = "/api/RefTreeScheduler/PostI";
window.schedulerDestroy = "/api/RefTreeScheduler/PostD";
window.schedulerRead = "/api/RefTreeScheduler/Select";
var userDashboardVisibleSP = "config.USP_DashBoardGetUserObjects";

window.fixedKendoGridHeaders = true;
window.chatDeactivateBOHashtags = true;
window.businessObjectSelectorDisableTextualSearch = true;
//window.businessObjectSelectorDropdownStored = "CUSTOM.GetBoTypes";
//gives the possibility to access the searchgrid current item by clicking the label
window.searchGridCurrentValue = true;
window.searchGridCurrentValueToolTip = false;
//if true: Adress & Marker in GoogleMaps are independent; if false: Adress depends on Marker-Position & changes when Marker is moved;
window.independentGoogleMapMarkerApplications = ["cei_diocesi", "dev_sidi", "stonehenge", "cotral","amco"];
//set default max-height for all grids
window.grid_maxContentHeight = "55vh";
//Disable the task opening when merging word docs with data for the grids below
window.mergePrintSynchGrids = { "CENS_VI_DICCEN_CAF_chiusi": true, "CENS_VI_DICCEN_CAF_lavorati": true, "CENS_VI_DICCEN_CAF": true };
//Custom logout per ICSC
if (window.ApplicationInstanceName.indexOf("inail") != -1
    || window.ApplicationInstanceName.indexOf("stonehenge") != -1
    || window.ApplicationInstanceName.indexOf("unicredit") != -1
    || window.ApplicationInstanceName.indexOf("unige") != -1
    || window.ApplicationInstanceName.indexOf("enasco") != -1
    || window.ApplicationInstanceName.indexOf("creval") != -1
    || window.ApplicationInstanceName.indexOf("fimit") != -1
    || window.ApplicationInstanceName.indexOf("neprix") != -1
    || window.ApplicationInstanceName.indexOf("roma_capitale") != -1) {
    window.logoutOverwrite = function () {
        $.ajax({
            type: "GET",
            url: "/api/MenuData/AbandonSession",
            success: function (res) {
                sessionStorage.clear();//pulisce eventuali dati messi in sessionStorage
                window.location.href = "/Views/3/SSOLogOut.html?a=" + window.ApplicationInstanceName;
            }
        });
    };
}
//where to redirect the user when session expires  https://gitlab.ilosgroup.com/ilos/operations/-/issues/421
window.SAMLSSOLoginEndpoints = {
    inail: "/api/cei/inaillogin",
    roma_capitale: "/api/cei/rcAuthLogin"
};

window.calendarAlternativeUserTree = function () {
    var deferred = $.Deferred(), maintree = [], tree = [];
    buildXMLStoredProcedureJSONDataSource({}, function (res) {
        $.each(res.items, function (k, user) {
            tree.push({ items: [], USERID: user.UserID, symbol: "", assettoexplode: user.text });
        });
        maintree.push({ assettoexplode: getObjectText('user'), items: tree });
        maintree.push({ items: [], USERID: 0, symbol: '', assettoexplode: getObjectText('showUnassigned') });
        deferred.resolve(maintree);
    }, 'core.usp_wf_get_task_resources').read();
    return deferred.promise();
};

var schedulerbOselectorOptions = function (e) {
    return {
        onChange: function (event) {
            e.container.find("[data-container-for=taskType_ID] select").data("kendoDropDownList").dataSource.read();
        }
    }
}
//override delle risorse associate allo scheduler kendo
function schedulerOverrideResources() {
    var getSchedulerModelAndBO = function () {
        var container = $("div.k-popup-edit-form.k-scheduler-edit-form.k-window-content.k-content");
        if (container.length == 1 && container.data("kendoEditable")) {
            var model = container.data("kendoEditable").options.model;
            if (!model)
                model = {};
            var tags = $(".bo-tagbox", container).bOSelector('getBOs');
            var data = {};
            if (tags && tags.length) {
                data.BusinessObjectType = tags[0].Type;
                data.BusinessObject_ID = tags[0].Id;
            }
            return $.extend(model, data);
        }
        return null;
    };
    return [
        {
            field: "taskType_ID",
            title: getObjectText('tipoEvento'),
            dataTextField: "Description",
            dataValueField: "taskTypeID",
            dataColorField: "Color",
            dataSource: {
                transport: {
                    read: {
                        url: "/api/MANAGEFK/CallFKStoredProcedure",
                        type: "POST",
                        contentType: "application/json",
                        data: { storedprocedurename: "usp_cal_GetTaskTypes", schema: "core", textfield: "Description", valuefield: "taskTypeID" },
                    },
                    parameterMap: function (options, operation) {
                        if (operation == "read") {
                            return kendo.stringify($.extend(options, { rowdata: getSchedulerModelAndBO() ? getSchedulerModelAndBO() : {} }));
                        }
                    }
                }
            }
        },
        {
            field: "TaskStatusId",
            title: getObjectText('statoEvento'),
            multiple: false,
            dataTextField: "text",
            dataValueField: "value",
            dataSource: {
                transport: {
                    read: {
						url: "/api/MAGIC_CALENDAR_TASKSTATUS/GetAvailableStatusesFK",
                        type: "GET",
                        contentType: "application/json"
                    }
                }
            }
        },
        {
            field: "ownerId",
            //dataValueField: "UserID",
            title: getObjectText('assegnatoA'),
            dataSource: {
                transport: {
                    read: {
                        url: "/api/WORKFLOWS/GetSchedulableUsersForTask",
                        type: "POST",
                        contentType: "application/json"
                    },
                    parameterMap: function (options, operation) {
                        if (operation == "read") {
                            return kendo.stringify($.extend(options, { rowdata: getSchedulerModelAndBO() ? getSchedulerModelAndBO() : {} }));
                        }
                    }
                },
                schema: {
                    // data: "Data",
                    parse: function (data) {
                        if (data[0] == undefined)
                            return data;
                        else
                            return parseUsers(data[0].Table);

                    }
                }
            }
        },
        {
            field: "teammembersattendees",
            title: getObjectText('invitati'),
            multiple: true,
            dataSource: {
                transport: {
                    read: {
                        url: "/api/WORKFLOWS/GetAttendeesForTask",
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        dataType: "json"
                    },
                    parameterMap: function (options, operation) {
                        if (operation == "read") {
                            return kendo.stringify($.extend(options, { rowdata: getSchedulerModelAndBO() ? getSchedulerModelAndBO() : {} }));
                        }
                    }
                },
                schema: {
                    // data: "Data",
                    parse: function (data) {
                        if (data[0] == undefined)
                            return data;
                        else
                            return data[0].Table;

                    }
                }
            }
        }
    ];
}

//#endregion
window.manageSubActions = true;
window.linkActionStoredProcedure = "BIM.usp_ActionLinkItems";
window.actionColumnIsFirst = true;
window.detailinitTabFilter = true; //serve per abilitare la query per eliminare i TAB in navigabilita' sulla base dei dati. Se questo e' true va anche definita la funzione getStandard_GetTabRestrictions 
window.xmlExtensionOverride = { AS_ASSET_asset: true }; //serve per eliminare le estensioni XML (il popup modale) sulle griglie. Considerati solo i casi a false, true e' il deafult se c'e' il campo XML
window.documentPhotoValueTrue = { DO_V_DOCUME_IMG: true, DO_V_DOCUME_ENTITY_IMG: true };
window.dashboardRightsLogic = "COMPONENTS"; //set user rights type for dashboard (default is menu)
//campi da non filtrare nella feature di filtro testuale da toolbar delle grid 
window.gridexcludefromfastsearch = [
  'AS_ASSET_XML_CAMASS_VALUES',
  'AS_ASSET_XML_CAMUSE_VALUES',
  'Visible_group',
  'IDECAT',
  'DO_DOCUME_XML_CAMASS_VALUES',
  'DO_DOCUME_XML_CAMUTE_VALUES',
  'Children',
  'Feature',
  'value',
  'DIMENS',
  'LogField',
  'MagicDataSource_ID'
];


function alternativePortfolioSelector() {
    if ($("#grid-portfolio-selection-controller").length) {
        kendo.destroy($("#grid-portfolio-selection-controller"));
        $("#grid-portfolio-selection-controller").remove();
    }
    requireConfigAndMore(["MagicSDK"], function (MF) {
        $('<div id="grid-portfolio-selection-controller" class="k-grid" style="position: relative">')
            .append($(getAngularControllerElement("GridPortfolioSelectionController", { MF: MF }, "", false)).css("height", "100%").addClass("fadeout"))
            .insertBefore("#appcontainer");
    });


}

//chiamata custom sul change del PTF(AREVIS)

//D.t trying to fix some regressions on Grosel refresh... 
function after_grosel(reloadrights, callback) {
    sessionStorage.setItem("groupsfilter", "false");
    //reload grid rights (depending on AREVIS_ID value) 
    if (reloadrights)
        $.ajax({
            url: "/api/Magic_Mmb_UserGroupVisibility/getUserVisibleGridsAndRights",
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).then(function (result) {
            sessionStorage.VisibleGridAndRights = JSON.stringify(result);
            callback();
        });
    else
        callback();
}

function onChangePTFCustomization(e, callback) {
    var reloadrights = true;
    if (!callback) {
        callback = function () { console.log("onChangePTFCustomization executed") };
        reloadrights = false;
    }
    var arr = [];
    var options = { table: "core.US_GROSEL_selected_groups", data: { us_groups: arr.join() }, procedure: "core.US_GROSEL_REFRESH", action: "create", primaryKeyColumn: "US_GROSEL_ID", contentType: "XML" };
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.set(options).then(function () { 
            after_grosel(reloadrights, callback);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // Handle error
            console.error("AJAX Error:", textStatus, errorThrown);
            console.error("Server response:", jqXHR.responseText);
            after_grosel(reloadrights, callback);
        });
    });
}
//richiamata in main.js (Magic/v)  permette di customizzare l' init dell' app sul browser
function applicationInitCustomization() {
    onChangePTFCustomization();
}

//usata per nascondere i TAB contenenti Griglie (es. Dimensioni) che non sono associate a certe tipologie di dati (es. alcuni TIPSAS non vogliono le dimensioni , le features...)
function getStandard_GetTabRestrictions(e) {
    var gridname = "";
    if (typeof e.sender != 'undefined') {
        gridname = e.sender.element.attr("gridname");
    } else {
        gridname = e.gridname;
    }
    var data = e.data ? e.data : e.model;
    var grights = getGridRights(gridname);     
    var deferred = $.Deferred();
    var ds = buildXMLStoredProcedureJSONDataSource($.extend({ gridname: gridname, data: (data.toJSON ? data.toJSON() : data), fromForm:e?.fromForm }, grights), function (result) {
        deferred.resolve(result);
    }, "config.cf_usp_grid_Nav_Tabs_restrictions");

    ds.read();
    return deferred;
}


//Aggiundngo qui i JS che sono contenuti solo nella app instance
//includejs('/Custom/3/Scripts/AppLabels.js');
includejs('/Custom/3/Scripts/assetmanagement.js');
includejs('/Custom/3/Scripts/refTreeDashboard.js');
includejs('/Custom/3/Scripts/reftreeWorkflows.js');
includejs('/Custom/3/Scripts/boselection.js');
apply_style((window.serviceWorkerUrlPathPrefix??'') + "/Views/3/Styles/reftree.css");  //applica css specifici per ref

includejs('/Custom/3/Scripts/dispatcherCei.js');

//dispatcher personalizzato per cei 


//metto questo flag per attivare solo in Ref le query di reperimento delle attivita' di Workflow che fanno capo ad una certa funzione
//che verranno eseguite ad ogni click su punto di menu
sessionStorage.setItem("queryWorkflowsWhenOpeningFunctions", "true");
//Chiamata dal "Televisore" sulle griglie (quando e' impostata la "stored procedure" per sapere  la pagina della scheda oggetto in GridExtension) 
function showItemCustomForm(rowData, gridName, storedProcedure, controllerName, $grid, $row) {
    if (!controllerName)
        controllerName = 'FormOptionsController';
    var config = {};
    requireConfigAndMore(["MagicSDK"], function (MF) {
        config.model = rowData;
        config.$grid = $grid;
        config.$row = $row;
        config.options = rowData;
        MF.api.get({ storedProcedureName: storedProcedure, data: $.extend(rowData, { gridName: gridName, }) }).then(function (res) {
            var page = res[0][0].HtmlPage;
            //page = "/Views/3/Templates/Custom/Asset_form.html"
            if ($("div.itemReport").length)
                $("div.itemReport").remove();
            var element = $("<div class='itemReport'><div id='datahidden'/><div id='mg-form' ng-controller='" + controllerName + " as foc' ng-include=\"'" + window.includesVersion + page + "'\">" + largeSpinnerHTML + "</div></div>");
            $("#appcontainer").data("customItemInfo", config.model);//adds the data to the js domain
            var $modalContent = showModal({
                title: '<i class="fa fa-television"></i>',
                content: element,
                wide: true
            });

            initAngularController($("#mg-form"), controllerName, config);
        })
    });
}
function showItemCustomFormBCE(rowData, gridName, storedProcedure, controllerName,$grid,$row) {
    if (!controllerName)
        controllerName = 'FormOptionsController';
    var config = {};
    requireConfigAndMore(["MagicSDK"], function (MF) {
        config.model = rowData;
        config.$grid = $grid;
        config.$row = $row;
        config.options = rowData;
        MF.api.get({ storedProcedureName: storedProcedure, data: $.extend(rowData, { gridName: gridName, }) }).then(function (res) {
            var page = res[0][0].HtmlPage;
            //page = "/Views/3/Templates/Custom/Asset_form.html"
            if ($("div.itemReport").length)
                $("div.itemReport").remove();
            var element = $("<div class='itemReport'><div id='datahidden'/><div id='mg-form' ng-controller='" + controllerName + " as foc' ng-include=\"'" + window.includesVersion + page + "'\">" + largeSpinnerHTML + "</div></div>");
            $("#appcontainer").data("customItemInfo", config.model);//adds the data to the js domain
                var $modalContent = showModal({
                    title: '<i class="fa fa-television"></i>',
                    content: element,
                    wide: true
            });
			
			 var filterSess=JSON.parse(sessionStorage.selectedGridsSettings);
                var fid =sessionStorage.fid;
                var prop="BCE_VI_RICHIE_INTEGRA-"+fid;

                if (filterSess[prop])
                {

                    filterSess[prop]={};
                    sessionStorage.setItem('selectedGridsSettings', JSON.stringify(filterSess));
                }
				else
				{
					fid="-1"
					prop="BCE_VI_RICHIE_INTEGRA-"+fid;
					if (filterSess[prop])
					{

						filterSess[prop]={};
						sessionStorage.setItem('selectedGridsSettings', JSON.stringify(filterSess));
					}
					
				}
           
		    config.options.filterNote={ "logic": "and", "filters" :[ { "field": "BCE_INVASS_ID", "operator": "eq", "value":  config.options.BCE_INVASS_ID,type: "custom" }, { "field": "BCE_INVASS_AS_ASSET_ID", "operator": "eq", "value":config.options.AS_ASSET_ID ,type: "custom" }]}

		   
            initAngularController($("#mg-form"), controllerName, config);
        })
    });
}

function showItemCustomFormFas(rowData, gridName, storedProcedure, controllerName, $grid, $row) {
    if (!controllerName)
        controllerName = 'FormOptionsController';
    var config = {};
    requireConfigAndMore(["MagicSDK"], function (MF) {
        config.model = rowData;
        config.$grid = $grid;
        config.$row = $row;
        config.options = rowData;
        MF.api.get({ storedProcedureName: storedProcedure, data: $.extend(rowData, { gridName: gridName, }) }).then(function (res) {
            var page = res[0][0].HtmlPage;
            //page = "/Views/3/Templates/Custom/Asset_form.html"
            if ($("div.itemReport").length)
                $("div.itemReport").remove();
            var element = $("<div class='itemReport'><div id='datahidden'/><div id='mg-form' ng-controller='" + controllerName + " as foc' ng-include=\"'" + window.includesVersion + page + "'\">" + largeSpinnerHTML + "</div></div>");
            $("#appcontainer").data("customItemInfo", config.model);//adds the data to the js domain
            var $modalContent = showModal({
                title: '<i class="fa fa-television"></i>',
                content: element,
                wide: true
            });

            // reset filtri griglia doc
            var filterSess = JSON.parse(sessionStorage.selectedGridsSettings);
            var fid = sessionStorage.fid;
            var prop = "FASC_DOCUMENTI-" + fid;

            if (filterSess[prop]) {

                filterSess[prop] = {};
                sessionStorage.setItem('selectedGridsSettings', JSON.stringify(filterSess));
            }


            config.options.FASC_DOCUMENTI_filter_PAT = { logic: 'AND', filters: [{ field: 'classe_modello_id', operator: 'eq', value: '207', type: "custom" }, { field: 'invio_id', operator: 'eq', value: config.options.id_invio_DOC, type: "custom" }] };
            config.options.FASC_DOCUMENTI_filter_AMM = { logic: 'AND', filters: [{ field: 'classe_modello_id', operator: 'eq', value: '208', type: "custom" }, { field: 'invio_id', operator: 'eq', value: config.options.id_invio_DOC, type: "custom" }] };
            config.options.FASC_DOCUMENTI_filter_TEC = { logic: 'AND', filters: [{ field: 'classe_modello_id', operator: 'eq', value: '209', type: "custom" }, { field: 'invio_id', operator: 'eq', value: config.options.id_invio_DOC, type: "custom" }] };
            config.options.FASC_DOCUMENTI_filter_IMP = { logic: 'AND', filters: [{ field: 'classe_modello_id', operator: 'eq', value: '210', type: "custom" }, { field: 'invio_id', operator: 'eq', value: config.options.id_invio_DOC, type: "custom" }] };
            config.options.FASC_DOCUMENTI_filter_SPE = { logic: 'AND', filters: [{ field: 'classe_modello_id', operator: 'eq', value: '211', type: "custom" }, { field: 'invio_id', operator: 'eq', value: config.options.id_invio_DOC, type: "custom" }] };
            config.options.FASC_DOCUMENTI_filter_MAN = { logic: 'AND', filters: [{ field: 'classe_modello_id', operator: 'eq', value: '212', type: "custom" }, { field: 'invio_id', operator: 'eq', value: config.options.id_invio_DOC, type: "custom" }] };

            initAngularController($("#mg-form"), controllerName, config);
        })
    });
}

function showEventGrid(entityName, recordid) {
    if (!checkGridVisibility("EV_V_EVENTS_HISTORY")) {
        kendoConsole.log("missingrights", "info");
        $("#wndmodalContainer").modal('hide');
        return;
    }

    var gridobjev = getrootgrid("EV_V_EVENTS_HISTORY");
    gridobjev.dataSource.transport.parameterMap = function (options, operation) {
        options.EntityName = "core.EV_V_EVENTS_HISTORY";
        options.data = JSON.stringify({ recordId: recordid, EntityName: entityName });
        options.layerID = null;
        options.functionID = null;
        options.operation = operation;
        options.Model = null;
        options.Columns = [];
        options.DataSourceCustomParam = '{ read: { type: "StoredProcedure", Definition:"core.usp_ev_get_events_history"} }';
        return kendo.stringify(options);
    }
    //init modal
    $("#wndmodalContainer").addClass("modal-wide");
    $("#contentofmodal").empty();
    $("#contentofmodal").append('<div id="grideve"></div>');
    $("#executesave").unbind("click");
    $("#executesave").hide();
    $("#wndmodalContainer").modal('show');
    setTimeout(function () { $("#wndmodalContainer h4.modal-title").text(getObjectText("events")) }, 300);

    renderGrid(gridobjev, undefined, undefined, "grideve");
}
$(document).ready(function () {
    window.schedulerOverrideResources = schedulerOverrideResources();
});
// funzione custom che ritorna le tipologie di aree organizzative per l' applicazione corrente per la funzione "Gerarchia Gruppi"
function getSpecificAppAssignedCodeValues() {
    var resultarray = [];
    $.ajax({
        type: "POST",
        async: false,
        url: manageAsyncCallsUrl(false,"/api/GENERICSQLCOMMAND/Select"),
        data: JSON.stringify({ EntityName: "core.US_CLAVIS_class_visibility", sort: ["US_CLAVIS_DESCRIPTION"],skip:0,take:1000 }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) { //do something with the data in result  }
            $.each(result.Data[0].Table, function (index, valuein) {
                resultarray.push({ value: valuein.US_CLAVIS_ID, text: valuein.US_CLAVIS_DESCRIPTION });
            });
        }
    });

    return resultarray;
}
function removeUnwantedGroupInfo() {
    $("#ownerdiv").remove();
    return;
}

function showAdhoxViewer(buttonEl) {    
    //if (window.Forge) {
    //    if (!!Forge) {
    //        Forge.clearViewer();
    //    }        
    //}

    var controllerNameHtml = 'adhox-viewer-controller';
    var controllerName = 'AdhoxViewerController'
    
    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        adhoxController = $("#" + controllerNameHtml),
        config;
    if (!grid.select().length) {
        kendoConsole.log(getObjectText("selectatleastone"), true);
        return;
    }

    if (!!grid.dataItem(grid.select()[0]).controllerName) {
        if (grid.dataItem(grid.select()[0]).controllerName != '') {
            controllerNameHtml = 'reftree-bim-viewer-controller'
            controllerName = 'ReftreeBimViewerController'
        }
    }

    if (adhoxController.length) {
        adhoxController.remove();
    }

    $("html, body").animate({ scrollTop: 0 }, "slow");

    var deferred = $.Deferred();

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: userSessionManagementSp, data: { useraction: "init" } })
            .then(function (result) {
                MF.api.get({
                    storedProcedureName: "core.BIM_Get_Bim_config", data: { ApplicationInstanceId: window.ApplicationInstanceId }
                }).then(function (result) {

                    try {
                        bimInfo = JSON.parse(result[0][0].jsonConfig);
                        deferred.resolve(MF);
                    }
                    catch (ex) {
                        kendoConsole.log(getObjectText("Errore configurazione cad config"), true);
                        return;
                    }

                }, function (err) {
                    console.log(err);
                });

            }, function (err) {
                console.log(err);
            });
    });


    $.when(deferred).then(function (MF) {
        config = {
            id: "adhox_" + grid.element.attr("gridname"),
            controllerNameHtml: controllerNameHtml,
            controllerName: controllerName,
            grid: grid,
            bimInfo: bimInfo,
            selectedItems: $.map(grid.select(), function (x) {
                return grid.dataItem(x);
            }),
            ready: function () {
                var interval = setInterval(function () {
                    var fadeout = $("#" + controllerNameHtml).find(".fadeout");
                    if (fadeout.length > 0) {
                        clearInterval(interval);
                        $("#" + controllerNameHtml + "-spinner").remove();
                        fadeout.addClass("fadein");
                    }
                }, 100);
            },
            close: function () {
                console.log(config);
                if (adhoxController.length) {
                    adhoxController.remove();
                }
            }
        };

        
        $("#appcontainer").css("padding-top", "50px;");

        adhoxViewerController = $('<div id="' + controllerNameHtml + '"  style="position: relative">')
            .append($(getAngularControllerElement(controllerName, config)).css("height", "100%").addClass("fadeout"))
            .css("height", "95vh");
        adhoxViewerController
            .append('<div id="' + controllerNameHtml + '-spinner" style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
            .insertBefore("#appcontainer");



    })

}

function showGridDwg(buttonEl) {
    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        userSessionManagementSp = window.userSessionManagementSp ? window.userSessionManagementSp : "core.DWG_ManageFilterForUser",
        dwgController = $("#grid-dwg-controller"),
        config;

    $(".page-title").find('a[href="javascript:history.back()"]').hide();
    var dwgCadInfo = {};

    if (!grid.select().length) {
        kendoConsole.log(getObjectText("selectatleastone"), true);
        return;
    }

    var rowData = grid.dataItem(grid.select()[0]);

    if (dwgController.length) {
        kendo.destroy(".gd-dg-viewer");
        dwgController.remove();
    }
    var deferred = $.Deferred();

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: userSessionManagementSp, data: { useraction: "init" } })
            .then(function (result) {
                MF.api.get({
                    storedProcedureName: "core.DWG_Cad_config", data: { ApplicationInstanceId: window.ApplicationInstanceId }
                }).then(function (result) {

                    try {
                        dwgCadInfo = JSON.parse(result[0][0].RSN_CADCFG_JSON_CONFIG);
                        deferred.resolve(MF);
                    }
                    catch (ex) {
                        kendoConsole.log(getObjectText("Errore configurazione cad config"), true);
                        return;
                    }

                }, function (err) {
                    console.log(err);
                });

            }, function (err) {
                console.log(err);
            });
    });

    $.when(deferred).then(function (MF) {
        $("html, body").animate({ scrollTop: 0 }, "slow");

        config = {
            MF: MF,
            id: "dwg_" + grid.element.attr("gridname"),
            userSessionManagementSp: userSessionManagementSp,
            grid: grid,
            serviceUrl: dwgCadInfo.serviceUrl,
            serviceUrlInterface: dwgCadInfo.serviceUrlInterface,
            rootForDxf: dwgCadInfo.rootForDxf,
            dwgCadInfo: dwgCadInfo,
            ready: function () {
                var interval = setInterval(function () {
                    var fadeout = dwgController.find(".fadeout");
                    if (fadeout.length > 0) {
                        clearInterval(interval);
                        $("#grid-dwg-controller-spinner").remove();
                        fadeout.addClass("fadein");
                    }
                }, 100);
            },
            // dwgFilename: "636167041781167492_02 Pianta Piano S1.dwg",
            serviceUrl: "http://ref2space.idearespa.com/TeighaService5/teighaservice.svc/webhttp/",
            serviceUrlInterface: "http://ref2space.idearespa.com/TeighaService5/teighaservice.svc/webhttp/js"
        };

        //temporary workaround to change pointers to services based on appid
        /*
        if (window.ApplicationInstanceId = 3101) //UNIGE
        {
            config.serviceUrl = "http://ref2space.idearespa.com/teighaservicenewunige/teighaservice.svc/webhttp/";
            config.serviceUrlInterface = "http://ref2space.idearespa.com/teighaservicenewunige/teighaservice.svc/webhttp/js"
        }
        */

        // var $dxf = $('<div>').insertBefore("#appcontainer");
        // initReact($dxf, 'dxf');

        //var controllerName = "GridDwgViewerController";
        //dwgController = $('<div id="grid-dwg-controller" class="k-grid" style="position: relative">')
        //    .append($(getAngularControllerElement(controllerName, config)).css("height", "100%").addClass("fadeout"))
        //    .css("height", "80vh")

        if (!!rowData.start_viewer_by_handle && rowData.start_viewer_by_handle == 1) {
            

            config.features = {
                map: false,
                sidebarAccordion: false,
                closeButton: false,
            };

            var oDwg = {};
            var oAllFile = [];
            oDwg.files = [];
            var oRowSelected = [];


            $.each(grid.select(), function (i, obj) {
                oRowSelected.push(grid.dataItem(obj));
                if (!!grid.dataItem(grid.select()[i]).filename) {
                    oAllFile.push(grid.dataItem(grid.select()[i]).filename);
                }
            });

            oAllFile = oAllFile.filter(function (v, i) { return oAllFile.indexOf(v) == i; });




            $.each(oAllFile, function (i, v) {
                var rowGrid = [];
                var allPolilyne = {}
                var tooltip = [];
                var polylines = [];

                oRowSelected.filter(function (row) {
                    if (row.filename == v) {
                        return row
                    }
                }).map(function (row) {
                    if (row.HANDLE != "") {
                        rowGrid.push({
                            handle: row.HANDLE,
                            color: row.color ? row.color : "#FF0000",
                            tooltip: row.handle_tooltip ? row.handle_tooltip : "",
                            checked : true
                        })
                    }
                });

                //    if (!allPolilyne[row.color]) {
                //        allPolilyne[row.color] = {
                //            color: row.color,
                //            handles: []
                //        }
                //        if (-1 == $.map(allPolilyne[row.color].handles, function (handle) { return handle }).indexOf(row.HANDLE)) {
                //            allPolilyne[row.color].handles.push(row.HANDLE);
                //        }
                //    } else {
                //        if (-1 == $.map(allPolilyne[row.color].handles, function (handle) { return handle }).indexOf(row.HANDLE)) {
                //            allPolilyne[row.color].handles.push(row.HANDLE);
                //        }
                //    }
                //    tooltip.push({ "handles": row.HANDLE, "tooltip": row.handle_tooltip ? row.handle_tooltip : "", "color": row.color ? row.color : "#FF0000" })
                //    })


                //for (c in allPolilyne) {
                //    polylines.push(allPolilyne[c]);
                //}
                //oDwg.files.push({ "name": v, "polylines": polylines, "tooltip": tooltip });   

                oDwg.files.push({ "name": v, "rowGrid": rowGrid, "polylines": [] });
                            
            });

            if (oDwg.files.length > 0) {

                config.fileDwg = oDwg;
                config.modalId = "dwgHandleController";
                config.rowData = rowData;

                showModalCustomR3({
                    title: '<i aria-hidden="true"></i>',
                    wide: true,
                    backdrop: false,
                    content: getAngularControllerElement("dwgHandleController", config),
                    onClose: function () {
                        //$("#wndmodalContainer-r3").remove();
                        $("#" + config.modalId).remove();
                        if ($("#wndmodalContainer-r3").length > 0) {
                            $("#wndmodalContainer-r3").css({ display: 'inline' });

                            if (angular.element($('tree-view-r3')).length > 0) {
                                angular.element($('tree-view-r3')).scope().t.onRefresh = true;
                                angular.element($('tree-view-r3')).scope().t.loadHtmlForm(angular.element($('tree-view-r3')).scope().t.selectedNode.htmlPage);

                                var myModal = $("#" + angular.element($('tree-view-r3')).scope().t.modalId)

                                if (myModal.length > 0) {
                                    myModal.css({ display: 'inline' });
                                }
                            }
                        }

                        grid.refresh();
                        grid.dataSource.read();
                    }, modalId: config.modalId
                }, true);
            }
            else {

                kendoConsole.log("Record non presente in planimetria", true);
                if ($("#wndmodalContainer-r3").length > 0) {
                    $("#wndmodalContainer-r3").css({ display: 'inline' });

                    if (angular.element($('tree-view-r3')).length > 0) {
                        angular.element($('tree-view-r3')).scope().t.onRefresh = true;
                        angular.element($('tree-view-r3')).scope().t.loadHtmlForm(angular.element($('tree-view-r3')).scope().t.selectedNode.htmlPage);

                        var myModal = $("#" + angular.element($('tree-view-r3')).scope().t.modalId)

                        if (myModal.length > 0) {
                            myModal.css({ display: 'inline' });
                        }
                    }
                }
            }

            // window.open(window.origin + '/views/3/dxf-viewer.aspx?q=' + encodeURIComponent(rowData.JSON_FOR_DWG), '' , "width=500,height=500");
        }
        else {

            var controllerName = "GridDwgViewerController";
            dwgController = $('<div id="grid-dwg-controller" class="k-grid" style="position: relative">')
                .append($(getAngularControllerElement(controllerName, config)).css("height", "100%").addClass("fadeout"))
                .css("height", "80vh")


            dwgController
                .append('<div id="grid-dwg-controller-spinner" style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
                .insertBefore("#appcontainer");

            dwgController.removeData();
            dwgController.data("dwgConfig", config);
            $.each(data, function (k, v) {
                dwgController.data(k, v);
            });
        }

        
    });

}
function redirectToFunctionButtonLinkQS(dataItem) {
    if (!dataItem.ButtonLinkQS)
        return '';
    var o = JSON.parse(dataItem.ButtonLinkQS);
    return '<a href="javascript:void(0);" onclick="redirectToFunction(\'' + o.functionGUID + '\',\'' + o.qs + '\');" >Censimento</a >';
}


function showTreeGISMap_implementation(buttonEl) {
	//TODO replace this values with values read from database...waiting for IDEARE's tables...
	var GISipServer = "https://atergis.reftree.it/"; //http://213.178.201.133:8080; 
	var featureName = "ater:lista_edifici_lat_long";
	var featureId = "ater:lista_edifici_lat_long";
	var gisApi = GISipServer + "geoserver/wms";
	var mainDivId = "map-container";
	//dichiarazione dell'indirizzo di configurazione che permette di recuperare la mappa
	var configUrl = GISipServer + "ater/rest/geostore/data/22";
	//dichiarazione dell'indirizzo di visualizzazione della mappa
	var originalUrl = GISipServer + "ater/#viewer/openlayers/22";
	var deps = [GISipServer + "ater/dist/ms2-api.js", GISipServer + "ater/jsapi/LocalFunctions-min.js", "https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.10/proj4.js"];

    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        mapController = $("#assets-gis-controller"),
        config,
        sessionID;
    if (mapController.length) {
        mapController.remove();
    }
    doModal(true);
    var deferred = $.Deferred();
    apply_style("https://cdnjs.cloudflare.com/ajax/libs/ol3/4.0.1/ol.css");
    apply_style("/Views/3/Styles/abitatGis.css");
    requireConfigAndMore(["MagicSDK"].concat(deps), function (MF) {
        if (window.userSessionManagementSp) {
            MF.api.get({ storedProcedureName: window.userSessionManagementSp, data: { useraction: "init" } })
                .then(function (result) {
                    $.each(result[0], function (i, v) {
                        sessionID = v.sessionID;
                    });
                    deferred.resolve(MF);
                }, function (err) {
                    console.log(err);
                });
        }
        else
            deferred.resolve(MF);
    });

    $.when(deferred).then(function (MF) {
        doModal(false);
		config = {
			gisServerIP: GISipServer,
			gisServerApi: gisApi,
			featureName: featureName,
			featureId: featureId,
			configUrl: configUrl,
			originalUrl: originalUrl,
            grid: grid,
			sessionID: sessionID,
			mainDivId: mainDivId,
            userSessionManagementSp: window.userSessionManagementSp,
            MF: MF,
            ready: function () {
                mapController.find(".fadeout").addClass("fadein");
                setTimeout(function () {
                    mapController.find("i.fa.fa-spinner").remove();
                }, 1000)
            }
        };
        mapController = $('<div id="assets-gis-controller" class="k-grid" style="position: relative">')
            .append('<div style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
            .append($(getAngularControllerElement("AssetsGisController", function () { return config; })).css("height", "100%").addClass("fadeout"))
            .css("height", " 70vh")
            .insertBefore("#appcontainer");
        mapController.removeData();
        mapController.data("mapsConfig", config);
        $.each(data, function (k, v) {
            mapController.data(k, v);
        });
    });
}

function reportToHelpDeskHandler(el) {
    var actionid = $(el).attr("id");
    var actionrefs = getActionSettings(actionid, $(el).parents("[role=tooltip]"), "actionrefs");
    reportToHelpDesk(actionrefs.button);
}

//get help actions for a set of selected rows in underlying grid from toolbar button click
function getHelpActionsFromToolbarButton(e) {
    var targetgrid = getGridFromToolbarButton(e);
	var sp = "core.GetHelp";
    //Build the actions
    openActionsTooltip({
        requestOptions: {
            helpAction: 1,
            caller: targetgrid.element.attr('gridname'),
            gridData: {
                gridname: targetgrid.element.attr('gridname'),
                pk: targetgrid.dataSource.options.schema.model.id
            },
            user_latitude: usersGeoLocation ? usersGeoLocation.coords.latitude : null,
            user_longitude: usersGeoLocation ? usersGeoLocation.coords.longitude : null
        },
        storeProcedureName: sp,
        accordionId: "multiActionsAccordionHelp",
        element: $(e),
        actionrefs: {
            button: e,
        }
    });

}
//check existance of defined constraints
function checkGridConstraintsFromDatabase(gridName) {
    var deferred = $.Deferred();

    //ask the database wether to go on
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api
            .getDataSet({
                gridName
            }, "config.mf_GridConstraintsCheck")
            .then(function (res) {
                if (res.status == 500) {
                    console.log(res.responseText || "error calling mf_GridConstraintsCheck");
                    deferred.reject();
                }
                else
                    deferred.resolve(res[0][0]["enabled"]);
            });
    });
    return deferred.promise();
}
//CheckConstaintsExistance will be called (if defined when kendo grids are rendered). Used to prevent constraints calls when none is defined in the db
function CheckGridConstaintsExistance(kgrid) {
    //generic code for all grids
    let $grid = kgrid.element;
    let gridname = kgrid.element.attr("gridname");
    console.log(`${gridname} constraints check will be called.Will set key ${gridname}_pendingconstraintcheck in session storage to make actions wait for this to end.This is necessary to avoid making renderGrid async which will cause disruption.`);

    sessionStorage.setItem(`${gridname}_pendingconstraintcheck`, "true");
    //check for constraints existance on this grid. The data attribute will be later checked in order to avoid calling the constraints (when not set)
    checkGridConstraintsFromDatabase(gridname).then((enabled) => {
        if (enabled) 
            $grid.data("constraint_enabled", "true");
        
        console.log(`${gridname} constraints check says enabled:${enabled}`);
        sessionStorage.removeItem(`${gridname}_pendingconstraintcheck`);

    });
}

function gridWaitForConstraintCall(gridname) {

    let aPromise = $.Deferred();
    let waitForConstraintsCheck = sessionStorage.getItem(`${gridname}_pendingconstraintcheck`);
    var i = 20;
    if (waitForConstraintsCheck) {
        myInterval = setInterval(function () {
            //let pending = !sessionStorage.getItem(`${gridname}_pendingconstraintcheck`);
            let pending = sessionStorage.getItem(`${gridname}_pendingconstraintcheck`);
            //not pending anymore or tried more than n times. Stop checking and goon...constraints will be disabled ...
            if (!i || !pending) {
                clearInterval(myInterval);
                aPromise.resolve();
            }
            //still checking
            if (pending)
                i--;
        }, 500);
    }
    else
        aPromise.resolve();
    return aPromise;
}


function StartServiceFromModel(data) {
    return $.ajax({
        type: "POST",
        url: "/api/RefTreeServices/StartServiceFromModelNew/",
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            //console.log(res);
        },
        error: function (err) {
            //console.log(err);
        }
    });
}

function StartServiceFromModelFromButton(e) {
    e.preventDefault();

    var jsonpayload = {};
    var pdfViewerController = $("#pdf-viewer-controller");
    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

    // Try to get jsonpayload configuration (like viewerPDF does)
    try {
        jsonpayload = getRowJSONPayload(e);
        if (jsonpayload && typeof getRowDataFromButton === 'function') {
            jsonpayload.rowData = getRowDataFromButton(e);
        } else {
            jsonpayload.rowData = dataItem;
        }
    } catch (ex) {
        // If no jsonpayload configuration exists, create a simple one
        jsonpayload = {
            rowData: dataItem
        };
    }

    return $.ajax({
        type: "POST",
        url: "/api/RefTreeServices/StartServiceFromModelNew/",
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            //console.log(res);
        },
        error: function (err) {
            //console.log(err);
        }
    });
}

function FileManagement(buttonEl) {
    var removeReservedWordsFromPayload = function (jsonpayload) {
        if (!jsonpayload) return jsonpayload;
        var payloadForExtension = $.extend({}, jsonpayload);
        delete payloadForExtension.form;
        delete payloadForExtension.formLoadSp;
        delete payloadForExtension.storedProcedure;
        delete payloadForExtension.selectionMandatory;
        delete payloadForExtension.formWide;
        delete payloadForExtension.formHideTabs;
        return payloadForExtension;
    };
    
    var key = !buttonEl.id ? buttonEl.className : buttonEl.id,
        jsonpayload = {},
        data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid

    try {
        jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
    } catch (e) {
        kendoConsole.log("JsonPayload is not valid", true);
        return;
    }

    dataRow = { "models": [] };

    // L.S. 01/07/2025 Se la griglia è selezionabile passo le righe selezionate altrimenti passo tutte le righe
    //$.each(grid.dataSource.data(), function (i, v) {
    //    dataRow.models.push(v.toJSON());
    //});
    rowData = grid.selectable ? getAllSelectedRowsFromGrid(buttonEl) : grid.dataSource.data(); 

    //if (rowData.length == 0) {
    //    kendoConsole.log("Nessun record selezionato.", true);
    //    return;
    //}

    $.each(rowData, function (i, v) {
        dataRow.models.push(v.toJSON());
    });
    

    var payloadForExtension = removeReservedWordsFromPayload(jsonpayload);
    var datapayload = jQuery.extend({}, datapayload, payloadForExtension);
    datapayload = jQuery.extend({}, datapayload, dataRow);

    
    doModal(true);

    $.ajax({
        type: "POST",
        url: "/api/RefTreeServices/FileManagementJson/",
        data: JSON.stringify(datapayload),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            //console.log(res);
            if (res.Status == "OK") {
                if (res.Download) {
                    downloadFileReftree(res.FileName);
                    doModal(false);
                    kendoConsole.log(res.ResponseMessage, false);
                    //$.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=' + res.FileName);
                } else {
                    doModal(false);
                    kendoConsole.log(res.ResponseMessage,false);
                }
            } else {
                doModal(false);
                kendoConsole.log(res.ErrorMessage, true);
            }
        },
        error: function (err) {
            doModal(false);
            //console.log(err);
            kendoConsole.log(err.responseText, true);
        }
    });

    function downloadFileReftree(FileName) {
        var url = FileName.includes("/api/MAGIC_SAVEFILE/GetFile?path=") ? encodeURIComponent(FileName) : "/api/MAGIC_SAVEFILE/GetFile?path=" + encodeURIComponent(FileName);
        var a = $("<a target='_blank' style='display: none;'/>");
        a.attr("href", url);
        $("body").append(a);
        a[0].click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }
    //$.fileDownload("/api/RefTreeServices/FileManagementJson/", {
    //    data: datapayload,
    //    httpMethod: "POST",
    //}).done(function (e) {
    //    console.log(e);
    //});



    //$.fileDownload("/api/RefTreeServices/FileManagementJson/", {
    //    data: datapayload,
    //    httpMethod: "POST",
    //    successCallback: function (url) {
    //        console.log(url);
    //    },
    //    prepareCallback: function (url) {
    //        console.log(url);
    //    },
    //    failCallback: function (responseHtml, url) {
    //        console.log(responseHtml);
    //        console.log(url);
            
    //    }
    //});
     
      
    //$.ajax({
    //    type: "POST",
    //    url: "/api/RefTreeServices/FileManagementJson/",
    //    data: JSON.stringify(datapayload),
    //    contentType: "application/json; charset=utf-8",
    //    dataType: "json",
    //    success: function (res) {
    //        console.log("here lives the response:", response);
    //        var headers = response.headers;
    //        var blob = new Blob([response.body], { type: headers['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] });
    //        var link = document.createElement('a');
    //        link.href = window.URL.createObjectURL(blob);
    //        link.download = "Filename";
    //        link.click();
    //    },
    //    error: function (err) {
    //        console.log(err);
    //        $.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=export_stipendi/' + err.responseText);
    //    }
    //});
         
}

function showReftreeTreeScheduler(buttonEl, showTree) {
    
    var key = !buttonEl.id ? buttonEl.className : buttonEl.id;
    var jsonpayload = {};

    try {
        jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
    } catch (e) {
        kendoConsole.log("JsonPayload is not valid", true);
        return;
    }


    showTree = jsonpayload.showTree;

    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        schedulerController = $("#reftree-tree-scheduler-controller"),
        config;
    if (schedulerController.length) {
        kendo.destroy("#mfkendoscheduler");
        schedulerController.remove();
    }
    doModal(true);
    var deferred = $.Deferred();
    //if the session is managed at the DB level 
    requireConfigAndMore(["MagicSDK"], function (MF) {
        if (window.userSessionManagementSp) {
            MF.api.get({ storedProcedureName: window.userSessionManagementSp, data: { useraction: "init" } })
                .then(function (result) {
                    deferred.resolve(MF);
                }, function (err) {
                    doModal(false);
                    console.log(err);
                });
        }
        else
            deferred.resolve(MF);
    });


    var initTasks = $.Deferred();
    //if the tree is hidden the tasks are initialized before opening the scheduler 
    if (!showTree) {
        if (window.schedulerInitFromGridSp) {
            requireConfigAndMore(["MagicSDK"], function (MF) {
                MF.api.get({
                    storedProcedureName: window.schedulerInitFromGridSp, data: {
                        useraction: "init", view: "month", selected: getAllSelectedRowsFromGrid(buttonEl), gridname: (grid && grid.element ? grid.element.attr('gridname') : "")
                    }
                })
                    .then(function (result) {
                        doModal(false);
                        $.each(result[0], function (i, v) {
                            if (v.editOptions) {
                                try {
                                    v.editOptions = JSON.parse(v.editOptions);
                                }
                                catch (e) {
                                    console.log(e);
                                }
                            }
                        })

                        initTasks.resolve(result);
                    }, function (err) {
                        doModal(false);
                        initTasks.reject();
                        console.log(err);
                    });
            });
        }

    }
    else {
        doModal(false);
        initTasks.resolve([]);
    }
    $.when(deferred, initTasks).then(function (MF, tasks) {
        config = {
            showTree: showTree,
            tasks: tasks,
            grid: grid,
            selected: getAllSelectedRowsFromGrid(buttonEl),
            userSessionManagementSp: window.userSessionManagementSp,
            MF: MF,
            ready: function () {
                schedulerController.find(".fadeout").addClass("fadein");
                setTimeout(function () {
                    schedulerController.find("i.fa.fa-spinner").remove();
                }, 1000)
            }
        };
        schedulerController = $('<div id="reftree-tree-scheduler-controller"  class="k-grid" style="position: relative;">')
            .append('<div style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
            .append($(getAngularControllerElement("ReftreeTreeSchedulerController", function () { return config; })).addClass("fadeout"))
            .css("height", "1000px")
            .prependTo("#appcontainer");
        schedulerController.removeData();
        schedulerController.data("schedulerConfig", config);
        $.each(data, function (k, v) {
            schedulerController.data(k, v);
        });
    });

}


function showUsdzViewerR3(buttonEl) {
    var data = $(buttonEl)
        .closest(".k-grid")
        .data(),
        grid = data.kendoGrid,
        userSessionManagementSp = window.userSessionManagementSp
            ? window.userSessionManagementSp
            : "core.DWG_ManageFilterForUser",
        usdzController = $("#grid-usdz-controller"),
        config;

    if (!grid.select().length) {
        kendoConsole.log(getObjectText("selectatleastone"), true);
        return;
    }

    var rowData = grid.dataItem(grid.select()[0]);

    if (usdzController.length) {
        kendo.destroy(".re-uz-viewer");
        usdzController.remove();
    }

    var deferred = $.Deferred();

    requireConfigAndMore(["MagicSDK"], function (MF) {

        deferred.resolve(MF);
    });

    $.when(deferred).then(function (MF) {
        config = {
            MF: MF,
            id: "usdz_" + grid.element.attr("gridname"),
            userSessionManagementSp: userSessionManagementSp,
            grid: grid,
            ready: function () {
               
            },
            close: function () {
                console.log(config);
                if (usdzController.length) {
                    usdzController.remove();
                }
            }
        };

        var controllerName = "ReftreeUsdzViewerController";

        usdzController = $(
            '<div id="grid-usdz-controller" class="k-grid" style="position: relative">'
        )
            .append(
                $(getAngularControllerElement(controllerName, config)).css("height", "100%")).css("height", "90vh");

        usdzController
            .append(
                '<div id="grid-usdz-controller-spinner" style="position: absolute; left: 50%; top: 40%">' +
                "</div>"
            )
            .insertBefore("#appcontainer");


        // $("#appcontainer").css('display', 'none');

        usdzController.removeData();
        usdzController.data("dwgConfig", config);
        $.each(data, function (k, v) {
            usdzController.data(k, v);
        });
    });
    
}

function showGltfViewerR3(buttonEl) {
    var data = $(buttonEl)
        .closest(".k-grid")
        .data(),
        grid = data.kendoGrid,
        userSessionManagementSp = window.userSessionManagementSp
            ? window.userSessionManagementSp
            : "core.DWG_ManageFilterForUser",
        usdzController = $("#grid-gltf-controller"),
        config;

    if (!grid.select().length) {
        kendoConsole.log(getObjectText("selectatleastone"), true);
        return;
    }

    var rowData = grid.dataItem(grid.select()[0]);

    if (usdzController.length) {
        kendo.destroy(".re-gltf-viewer");
        usdzController.remove();
    }

    var deferred = $.Deferred();

    requireConfigAndMore(["MagicSDK"], function (MF) {

        deferred.resolve(MF);
    });

    $.when(deferred).then(function (MF) {
        config = {
            MF: MF,
            id: "usdz_" + grid.element.attr("gridname"),
            userSessionManagementSp: userSessionManagementSp,
            grid: grid,
            ready: function () {

            },
            close: function () {
                console.log(config);
                if (usdzController.length) {
                    usdzController.remove();
                }
            }
        };

        var controllerName = "ReftreeGltfViewerController";

        usdzController = $(
            '<div id="grid-gltf-controller" class="k-grid" style="position: relative">'
        )
            .append(
                $(getAngularControllerElement(controllerName, config))
                    .css("height", "100%")
            )
            .css("height", "90vh");

        usdzController
            .append(
                '<div id="grid-gltf-controller-spinner" style="position: absolute; left: 50%; top: 40%">' +
                "</div>"
            )
            .insertBefore("#appcontainer");


        // $("#appcontainer").css('display', 'none');

        usdzController.removeData();
        usdzController.data("dwgConfig", config);
        $.each(data, function (k, v) {
            usdzController.data(k, v);
        });
    });

}

function downloadFileFromReftreeService(data) {
    $.fileDownload('/api/MAGIC_SAVEFILE/GetFile?path=' + encodeURIComponent(data.Response));

    //var url = data.Response.includes("/api/MAGIC_SAVEFILE/GetFile?path=") ? encodeURIComponent(data.Response) : "/api/MAGIC_SAVEFILE/GetFile?path=" + encodeURIComponent(data.Response);
    //var a = $("<a target='_blank' style='display: none;'/>");
    //a.attr("href", url);
    //$("body").append(a);
    //a[0].click();
    //window.URL.revokeObjectURL(url);
    //a.remove();
}