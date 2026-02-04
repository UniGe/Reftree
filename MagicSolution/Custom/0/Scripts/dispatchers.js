fetchUsersGeoLocation();
function custommethod(grid, selected, model) {
    switch (grid.element.attr("gridname")) {
        case "MasterData":
            model.set("FK_Code", selected.Description);
            break;    
    }
}

function validateFromDatabase(form, i, scope,element) {
	var deferred = $.Deferred();
	var stepKey = scope.settings.steps[i].stepKey;
	var filestosave = $('magic-form', element).data("filesToSave");
	var data = { wizardCode: scope.wizardCode, stepKey: stepKey, data: scope.models, filesToSave: filestosave };
	//ask the database wether to go on 
	requireConfigAndMore(["MagicSDK"], function (MF) {
		MF.api.getDataSet(data, "CUSTOM.Magic_WizardValidation")
			.then(function (res) {
				if (res.status == 500 && res.responseText) {
					kendoConsole.log(res.responseText,true);
					deferred.reject();
				}
				deferred.resolve();
			});
	});
	return deferred.promise();
}

function manageStageInCellConstraints(item, gridcode, gridentity, onChangeField,action)
{
    var deferred = $.Deferred();
    if (!(action == "remove" || action == "add" || action == "itemchange")) {
        deferred.resolve();
        return deferred.promise();
    }
    var data = item;
    var stageid = null;

    for (var prop in data) {
        //se e' il campo di stage
        if (data.hasOwnProperty(prop) && prop.indexOf("EV_STAGE_ID") !== -1) {
            stageid = data[prop];
            break;
        }
    }
    //ask the DB for value changes
    var ds = buildXMLStoredProcedureJSONDataSource({ stageid: stageid, gridname: gridcode, gridentity: gridentity, data: data, onChangeField: onChangeField, incellaction: action }, function (fields) {
        $(fields.items).each(function (i, v) {
            item[v.ColumnName] = v.EV_DEFAULT_VALUE || v.defaultvalue; //IDEARE and standard name field
            item.dirty = true;
        });
        deferred.resolve(fields);
    }, "CUSTOM.Get_EditConstraints");
    ds.read();
    return deferred.promise();
}
function manageStageConstraints(e, gridcode, gridentity, onChangeField) {


    var defer = $.Deferred();
    var data = e.model;
    window.gridineditdatasourcemodel = e.model;
    var stageid = null;
    for (var prop in data) {
        //se e' il campo di stage
        if (data.hasOwnProperty(prop) && prop.indexOf("EV_STAGE_ID") !== -1) {
            stageid = data[prop];
            break;
        }

        if (data.hasOwnProperty(prop) && data[prop] instanceof Date) {
            data[prop] = toTimeZoneLessString(data[prop]);
        }
    }
    //chiedo al DB quali siano i vincoli per lo stage trovato
    var ds = buildXMLStoredProcedureJSONDataSource({ stageid: stageid, gridname: gridcode, gridentity: gridentity, data: data, onChangeField: onChangeField }, function (res) {
        $(res.items).each(function (i, v) {
                detectWidgetTypeAndOverrideBehaviour(v.ColumnName, v.EV_STACOL_B_REQUIRED || v.required, v.EV_STACOL_B_EDITABLE || v.editable , v.EV_DEFAULT_VALUE || v.defaultvalue, v.EV_STACOL_B_HIDDEN || v.hidden, v.DetailDOMID, e, v.label);
        });
        defer.resolve(res.items);
    }, "CUSTOM.Get_EditConstraints");
    ds.transport.async = false;
    ds.read();
    return defer.promise();
}


function editMasterData(e)
{
    //the key is a field that will trigger reload  of the values which binded to dropdowns
    var automationsForDrops = {
        FK_ID: ["FK_3_ID"]
    };
    var gridname = e.sender.element.attr("id");
    var promise = getStandardEditFunction(e, null, gridname);
    var gridDs = e.sender.dataSource;
    $.when(promise).then(function () {
                gridDs.bind('change', function (ev) {
                    $.each(automationsForDrops, function (key, value) {
                        if (key == ev.field) {
                            $.each(value, function (i, v) {
                                var $kendodrop = e.container.find("[name=" + v + "]");
                                var kdrop = $kendodrop.data("kendoDropDownList");
                                var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                                getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                            });
                        }
                    });
                });
    });
}
///Questi metodi vanno reimplementati in ogni solution 
function prerenderdispatcher(grid, functionname, e, gridselector) {

    var origdatabound_ = grid.dataBound;
    var origedit__ = grid.edit;
    query_for_template_document(grid);
  
    //grid.dataBound = function (e) {
    //    if (origdatabound_ != null) 
    //        origdatabound_.call(this, e);
    //    ////MVVM in order to create automation between column values 
    //    //if (grid.editable == true)
    //    //        e.sender.tbody.find('tr').each(function () {
    //    //            var item = e.sender.dataItem(this);
    //    //            kendo.bind(this, item);
    //    //        });

    //}

    if (grid.editable == true) {
        var datasourcechange_ = grid.dataSource.change;
        var somethinghaschanged;
        grid.dataSource.change = function (e) {
            if (datasourcechange_)
                datasourcechange_.call(this, e);
            //called per each modification to grid's datasource. The database receives as input the data of the record which contains modifications and returns the list of fields to be changed as value. Modifications are made in the function itself
            $.each(e.items, function (i, v) {
                try {
                    manageStageInCellConstraints.call(this, v, grid.gridcode, grid.EntityName, e.field, e.action).then(function (fields) {
                        if (fields && fields.items && fields.items.length)
                            $("tr[data-uid=" + v.uid + "]").closest(".k-grid").data("kendoGrid").refresh();
                    });
                }
                catch (ex) {
                    console.log(ex);
                }
            });
          }
    }
   
    grid.edit = function (e) {
    var defVal_model_fn = function (defaultValue) {
        if (defaultValue.indexOf("{") != -1)
            return JSON.parse(defaultValue).value;
        else
            return defaultValue;

    }
    var gridcode = grid.gridcode;
    var gridentity = grid.EntityName;
    e.entityName = gridentity;
    e.xmlFieldsToAlter = {};
    var defvals = {};
    manageStageConstraints.call(this, e, gridcode, gridentity).then(function (items) {
        $(items).each(function (i, v) {
            if (v.IsXml)
                e.xmlFieldsToAlter[v.ColumnName] = { columnname: v.ColumnName, required: v.required, editable: v.editable, defvalue: v.defaultvalue, hide: v.hidden, label: v.label };
            if (v.EV_DEFAULT_VALUE && e.model.isNew()) {
                e.model.set(v.ColumnName, defVal_model_fn(v.defaultvalue));
                defvals[v.ColumnName] = { value: defVal_model_fn(v.defaultvalue), editable: v.editable };
            }
        });
        if (origedit__ != null) {
            var promise = origedit__.call(this, e);
            try {
                if (promise) //gestione delle cascade + valori impostati da DB per le drop down
                    $.when(promise).then(function (selectDataBounds) {
                        var all = function (array) {
                            var deferred = $.Deferred();
                            var fulfilled = 0, length = array.length;
                            var results = [];

                            if (length === 0) {
                                deferred.resolve(results);
                            } else {
                                array.forEach(function (promise, i) {
                                    $.when(promise).then(function (value) {
                                        results[i] = value;
                                        fulfilled++;
                                        if (fulfilled === length) {
                                            deferred.resolve(results);
                                        }
                                    });
                                });
                            }

                            return deferred.promise();
                        };
                        var promisesarray = []
                        $.each(selectDataBounds, function (i, v) { promisesarray.push(v) });
                        //when all the FK data has been loaded into the form 
                        $.when(all(promisesarray)).then(function (results) {
                            setTimeout(function () {
                                $.each(defvals, function (k, v) {
                                    if (e.container.find("input[name=" + k + "]").data("kendoDropDownList")) {
                                        e.container.find("input[name=" + k + "]").data("kendoDropDownList").value(defvals[k].value);
                                        //hide the validation tooltips...it has a value!
                                        e.container.find("input[name=" + k + "]").closest("div.k-edit-field").find('span.k-tooltip-button').find('a.k-icon.k-i-close').trigger('click');
                                        if (!defvals[k].editable)
                                            e.container.find("input[name=" + k + "]").data("kendoDropDownList").enable(false);
                                    }
                                });
                            }, 1000);
                        });


                    });
            }
            catch (ex) {
                console.log(ex);
            }
        }
    });
    };


    return;
}
function postrenderdispatcher(grid, functionname, e)
{
    return;
}

function prova(e,jsonpayload,storedprocedure)
{
    e.preventDefault();
    alert("toolbar cmd!");
}

function provarow(e)
{
    e.preventDefault();
    alert("row cmd!");
}
function IfcTowexBIM(e)
{
    var info = getRowDataFromButton(e);
    doModal(true);
    $.ajax({
        type: "POST",
        url: "api/BimCaller/prepareFilesForVisualization/",
        data: JSON.stringify(info),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            doModal(false);
        },
        error: function (message) {
            doModal(false);
            kendoConsole.log(message.responseText, true);
        }
    });
}
function getMagicMultiValueColumns() {
    return {
        is_test: {
            is_test: "is_test",
            num: "num",
            provattypeid: "provattypeid",
            provaanagraid: "provaanagraid",
            date_time: "date_time"
        }
    };
}


function editorSearchGrid(container,options,datarole)
{
    console.log(container);
    console.log(options);
    console.log(datarole);

    var $span = $("<span class=\"k-textbox k-space-right searchgrid_autocomplete\">\
        <input onfocus=\"openSearchgrid2('{3}', '{0}', '{4}', '{9}', this, '{5}', '{6}', '{7}')\" id=\"{0}_binder\" name=\"{0}\" type=\"text\" placeholder=\"N/A\" {8} data-cascade-from=\"{5}\" />\
        <a href=\"javascript:void(0)\" class=\"k-icon k-i-search\" onclick=\"selectItemFromResearchgrid('{3}','{0}','{4}','{5}','{6}','{7}',5,this);\">&nbsp;</a>\
    </span>".format(options.ColumnName,
                    options.label,
                    options.MagicDataSourceTextField,
                    options.searchgridname,
                    options.searchgriddesccol,
                    options.cascadecol,
                    options.cascadeFiltercol,
                    options.operatorforCascadefilter,
                    options.appendextraattribute,
                    options.MagicDataSourceValueField,
                    options.FromTable));
    
    $span.appendTo(container);
}

function linkListToColumnOfNewParentElement(dataItem) {

    var htmlouter = '<div class="list-group">\
                       {0}\
                     </div>';
    var htmlinner = '<a href="#" data-gridname="{1}" data-filter="{2}" data-field="{3}" class="list-group-item">{0}</a>';
    var htmla = '';
    function showColumnGrid(e) {
        var gridtoopenname = $(e).closest("div").data("gridname");
        var field = $(e).closest("div").data("field");
        var dataItem = $(e).closest(".k-grid").data("kendoGrid").dataItem($(e).closest("tr"));
        $("#wndmodalContainer").addClass("modal-wide");
        $(".modal-title").text(getObjectText("events"));
        $("#contentofmodal").empty();
        $("#executesave").unbind("click");
        $("#executesave").hide();
        $("#wndmodalContainer").modal('toggle');
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.kendo.getGridObject({ gridName: gridtoopenname }).then(function (gridobj) {
                gridobj.save = function (e) {
                    e.preventDefault();
                    console.log(dataItem);
                }
                var filter = null
                if (!isMtoN)
                    console.log("here i should set a filter which shows nothing... ");
                gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, filter);
                if ($("#gridinlist").data("kendoGrid")) {
                    $("#gridinlist").data("kendoGrid").destroy();
                    $("#gridinlist").remove();
                }
                $("#contentofmodal").append('<div id="gridinlist"></div>');
                MF.kendo.appendGridToDom({ kendoGridObject: gridobj, selector: "gridinlist" });
            });
        });

    }
    try {
        var items = JSON.parse(dataItem["EDITCOLUMN"]);
        $.each(items, function (i, v) {
            htmla += htmlinner.format(v.label, v.gridname, JSON.stringify(v.filter), v.field);
        })
    }
    catch (err) {
        return "";  console.log(err);
    }
    return htmlouter.format(htmla);
}

function initHTMLformSample(e)
{
    rebuildGenericModal();
    $("#wndmodalContainer").modal('toggle');
    var config = {};
    requireConfigAndMore(["MagicSDK"], function (MF) {
        config.MF = MF;
        config.model = { AS_ASSET_ID: 1234567, id: 1234567, address: "Via della posta 8", latitude: "46.4979688", longitude: "11.3506347" };
        if ($("div.itemReport").length)
            $("div.itemReport").remove();
        $("#contentofmodal").html("<div class='itemReport'><div id='datahidden'/><div   id='mg-form' ng-controller='FormOptionsController as foc' ng-include=\"'" + window.includesVersion + "/Views/0/sample.html'\">" + largeSpinnerHTML + "</div></div>");
        $("#datahidden").data("itemInfo", config.model);
        initAngularController($("#mg-form"), "FormOptionsController", config);
    });
    
}

function asimplefunctionOnChange(e)
{
	try {
		console.log(e.sender.value());
	}
	catch (ex) {
		console.log(e);
	}
}

function launchActionFromButton(e) {
    var jsonpayload = {};
    try {   jsonpayload = getRowJSONPayload(e); }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }
    jsonpayload.rowData = getRowDataFromButton(e);
    jsonpayload.jqgrid = $(e).closest(".k-grid");
    jsonpayload.jrow = $(e).closest(".k-grid tr");
    if (!jsonpayload.actiontype || !jsonpayload.actioncommand)
        console.log("actioncommand or actiontype not provided");
    requireConfigAndMore(["MagicActions"], function (magic) {
        switch (jsonpayload.actiontype) {
            case "RTFUN":
                launchActionFunction(e, jsonpayload);
                break;
            case "NEWGD":
            case "EDTGD":
                editActionGrid(e, jsonpayload);
                break;
            case "JSFUU":
                launchActionJsFunction(e, jsonpayload);
                break;
            case "SQLPU":
                launchStoredProcedure(e, jsonpayload);
                break;
            case "OPURL":
                openURLInNewWindow(e, jsonpayload);
                break;
            case "SHOGD":
                showGrid(e, jsonpayload);
                break;
                //#region REFTREE ONLY
            case "R3BDOC":
                launchReftreeBuildDocumentFromModel(e, jsonpayload);
                break;
            case "R3ASTG":
                launchReftreeAssetGallery(e, jsonpayload);
                break;
        }
    });
}

//toolbar button for ZIP download from selectable grid
function downloadZipFromSelectableGrid(e) {
	var targetgrid = getGridFromToolbarButton(e);
	var key = !e.id ? e.className : e.id;
	var jsonpayload = {};
	try {
		jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
	}
	catch (e) {
		kendoConsole.log("JsonPayload is not valid", true);
		return;
	}
	if (!jsonpayload.zipSP) {
		kendoConsole.log("zipSP not specified",true);
		return;
	}
	//get selected items 
	var selecteddata = [];
	var selectedIds = [];
	//selection is performed reading ids form database
	if (targetgrid.element.data('allRecords')) {
		selectedIds = $.map(targetgrid.element.data('allRecords'), function (v, i) {
			return jQuery.extend({}, v);
		});
	}
	else {
		//select all in current browser view
		selecteddata = targetgrid.select();
		if (detectTouch() && targetgrid.element.find(".rowselected__").length) {
			selecteddata = [];
			$.each(targetgrid.element.find(".rowselected__"), function (i, v) {
				if ($(v).prop('checked') == true)
					selecteddata.push($(v).closest("tr"));
			});
		}
	}
	//selection at front end side
	if (selecteddata.length > 0) {
		for (var i = 0; i < selecteddata.length; i++) {
			//D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
			selectedIds.push({ id: targetgrid.dataItem(selecteddata[i]).id });
		}
	}
	$.fileDownload('/api/Documentale/ExportzipforRefTreeGrid/', { data: { gridname: targetgrid.element.attr("gridname"), ids: selectedIds, zipSP: jsonpayload.zipSP }, httpMethod: "POST" });
}



function openCallbackLinks(linksToOpen) {
	$.each(linksToOpen, function (index, value) {
		window.open(value, '_blank');
		//	alert(index + ": " + value);
	});
}

function aButtonClickHandler(e) {
    console.log(e);
}