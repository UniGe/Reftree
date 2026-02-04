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
    }

//gives the possibility to access the searchgrid current item by clicking the label
window.searchGridCurrentValue = true;
window.searchGridCurrentValueToolTip = true;
//window.businessObjectSelectorDropdownStored = "CUSTOM.GetBoTypes";
window.prefKendoStyle = true;
window.actionColumnIsFirst = true;
window.fixedKendoGridHeaders = true;
window.gmapTreeListLoaderSP = "CUSTOM.GoogleMap_GetAllTreeList";
window.schedulerTreeListLoaderSP = "CUSTOM.TreeScheduler_GetAllTreeList";
window.schedulerTreeDetailSP = "CUSTOM.TreeScheduler_GetDetail";
window.GridForPortfolioSelection = "Magic_Mmb_UserGroupVisibility";
window.treeActionSP = "CUSTOM.GetActionsTree";
window.userMessageReceiversSp = "CUSTOM.GetUsersForGridMessage";
window.schedulerActionSP = "CUSTOM.ActionsFake";
//window.mergePrintSynchGrids = { "Table_fileupl_prova": true };
// funzione custom che ritorna le tipologie di aree organizzative per le applicazioni
function getSpecificAppAssignedCodeValues() {
    return [{ value: "DEF", text: "DEFAULT" }];
}
window.detailinitTabFilter = true;
//usata per nascondere i TAB contenenti Griglie (es. Dimensioni) che non sono associate a certe tipologie di dati (es. alcuni TIPSAS non vogliono le dimensioni , le features...)
function getStandard_GetTabRestrictions(e) {
    var gridname = "";
    if (e.sender) {
        gridname = e.sender.element.attr("gridname");
    } else {
        gridname = e.gridname;
    }

    var data = e.data ? e.data : e.model;
    var grights = getGridRights(gridname);
    var deferred = $.Deferred();
     
    var ds = buildXMLStoredProcedureJSONDataSource($.extend({ gridname: gridname, data: (data.toJSON ? data.toJSON() : data) }, grights), function (result) {
        deferred.resolve(result);
    }, "custom.cf_usp_grid_Nav_Tabs_restrictions");
    ds.read();     
    return deferred;
}



function removeUnwantedGroupInfo() {
    //$("#rolediv").remove();
    return;
}
function showItemCustomForm(rowData, gridName, storedProcedure, controllerName) {
    if (!controllerName)
        controllerName = 'FormOptionsController';
    var config = {};

    requireConfigAndMore(["MagicSDK"], function (MF) {
        config.MF = MF;
        config.model = rowData;
        MF.api.get({ storedProcedureName: storedProcedure, data: $.extend(rowData, { gridName: gridName, }) }).then(function (res) {
            var page = res[0][0].HtmlPage;
            if ($("div.itemReport").length)
                $("div.itemReport").remove();
            var element = $("<div class='itemReport'><div id='datahidden'/><div   id='mg-form' ng-controller='" + controllerName + " as foc' ng-include=\"'" + window.includesVersion + page + "'\">" + largeSpinnerHTML + "</div></div>");
            var $modalContent = showModal({
                title: '<i class="fa fa-television"></i>',
                content: element,
                wide: true
            });
            $("#datahidden").data("itemInfo", config.model);
            initAngularController($("#mg-form"), controllerName, config);
        })
    });
}

function actionJSFUU(rowdata, grid, functionfilter) {
	console.log(grid);
	console.log(rowdata);
	alert(JSON.stringify(functionfilter));
}

////overwrite of upload Select for e-invoice 
//function overrideOnUploadSelect(e) {
//	$.each(e.files, function (k, file) {
//		if (e.files[k].extension !== '.p7m') {
//			e.files[k].name = Date.now().toString() + "-" + e.files[k].name.replace(/&(#\d+|\w+);|[^\w\.-]/g, '');
//		}
//	});
//}