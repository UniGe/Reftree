function generatecolumnoverrideswindow(e) {

    e.preventDefault();

    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

    var wnd = $("#columnoverridesdetails").data("kendoWindow");
    var details = kendo.template($("#columnoverridesdetailstemplate").html());
    wnd.content(details(dataItem));
    $('#layer').css("width", "230px"); $('#derivativeentity').css("width", "230px");
    $('#layer').kendoDropDownList({
        optionLabel: "Please select an Application Layer...",
        dataSource: [],
        dataTextField: "LayerDescription",
        dataValueField: "LayerID"
    });
    //Leggo dalla vista contente i soli Layer Relazionali 
    getdropdatasource("v_Magic_RelationalAppLayers", "LayerDescription", null, "layer", 0, "LayerID","dbo",2);

    
    var ds = getdatasource("Magic_ENTITIES", "TABLE_NAME");

    $('#derivativeentity').kendoDropDownList({
        optionLabel: "Please select the derivative entity...",
        dataSource: ds,
        dataTextField: "TABLE_NAME",
        dataValueField: "TABLE_NAME"
    });


    wnd.center().open();
}
//This adds the column to the grid which are relative to a certain Derivative Entity and assigns a proper LAayer whose default value is the derivative entity DB schema
function generatelayeroverrides(e) {
    var layer = $('#layer').data("kendoDropDownList").value();
    var gridcore = $('#gridcore').val();
    var derivativeentity = $('#derivativeentity').data("kendoDropDownList").value();
    var schema = $('#derivativeentity').data("kendoDropDownList").dataItem().TABLE_SCHEMA;
    var usegenericcontroller = $("#usegencontr").prop("checked");

    console.log(layer + " " + gridcore + " " + derivativeentity);
    if (layer === "" || gridcore === "" || derivativeentity === "" || derivativeentity == $('#derivativeentity').data("kendoDropDownList").options.optionLabel)
        kendoConsole.log("All selections must be performed in order to generate the Layer Overrides", true);
    else {
        $.ajax({
            async: false,
            type: "POST",
            url: "/api/Magic_Grids/RefreshLayerOverrides/",
            data: JSON.stringify({ baseGridID: gridcore, targetEntity: derivativeentity, targetLayerID: layer, targetSchema: schema, useGenController: usegenericcontroller }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log("Grid successfully updated.", false);
                var grid = $("#grid").data("kendoGrid");
                grid.dataSource.read();
                $("#columnoverridesdetails").data("kendoWindow").close();
            },
            error:function (result) {
                kendoConsole.log("Grid update failed.", true);
            }
        });
        
    }
}

function loadscript() {
    var gridobj = getrootgrid("Magic_Grid");
    pushCustomGroupToolbarButton(gridobj, [
                     '<a onclick="extendGrid(this);" class="k-button k-button-icontext"><span class="fa fa-expand" aria-hidden="true"></span>  Extend selected grid</a>',
			 	 	'<a onclick="switchMainEntity(this);" class="k-button k-button-icontext"><span class="fa fa-exchange" aria-hidden="true"></span>  Switch main entity</a>',
			   		'<a title="Set a custom stored procedure in the datasource and run the creation script in the db" onclick="buildCustomStoredProcedure(this);" class="k-button k-button-icontext"><span class="fa fa-code-fork" aria-hidden="true"></span>  Set custom SP</a>',
                     '<a onclick="emptyCacheOrBuffers(this,\'cache\');" class="k-button k-button-icontext"><span class="fa fa-eraser" aria-hidden="true"></span>  Clear cache (all)</a>',
                     '<a onclick="emptyCacheOrBuffers(this,\'buffers\');" class="k-button k-button-icontext"><span class="fa fa-eraser" aria-hidden="true"></span>  Clear buffers (all)</a>'], "Advanced",true);
    //mostro il pulsante di ritorno alla funzione precedente solo se diversa da Grid e se esiste
    //gridobj.toolbar.unshift({
    //    template: "<a class=\"k-button\" href=\"javascript:void(0)\" onclick=\"window.history.back()\"><span class=\"k-icon k-i-arrow-w\"></span>Back</a>"
    //});
    
    if ($("#columnoverridesdetails").length == 0)
        $("#grid").after('<div id=columnoverridesdetails><div/>');

    wnd = $("#columnoverridesdetails")
           .kendoWindow({
               title: "Layer Custom Overrides",
               modal: true,
               visible: false,
               resizable: false,
               width: 400
           }).data("kendoWindow");

	if (gridobj.toolbar && gridobj.toolbar.length) {
		let createIdx = gridobj.toolbar.findIndex(x => x.name == "create");
		if (createIdx != -1)
			gridobj.toolbar.splice(createIdx, 1);
	}

    renderGrid(gridobj, null);

    $(".gridscoloverride").click(function (e) { generatecolumnoverrideswindow(e); });
}    
   
function refresh_click(e) {
	e.preventDefault();
	var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
	//check if this grid is a derivative grid which is linked to layers
	getAppNamesForGrid(dataItem).done(function (result) {
		let appNames = [];
		let res = JSON.parse(result);
		res.forEach(function (appname) {
			appNames.push(appname);
		});
		if (!appNames.length) //it's the standard case of refresh looking at the current application target db
			refresh(dataItem.MagicGridName, dataItem.FromTable);
		else
			rebuildApplicationLayerForGrid(e, appNames, dataItem.MagicGridName, dataItem.FromTable);
	});

}

function refresh(gridname, schema) {
	doModal(true);
        $.ajax({
           // async: false,
            type: "POST",
            url: "/api/Magic_Grids/RefreshGridToDb/",
            data: JSON.stringify({ GridName: gridname, Schema: schema }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
			success: function (result) {
				doModal(false);
                kendoConsole.log("Grid successfully updated.",false);
                var grid = $("#grid").data("kendoGrid");
                grid.dataSource.read();

            },
			error: function (result) {
				doModal(false);
                kendoConsole.log("message: "+result.responseText, true);
            }
        });
    }

function filterUnfilter(e, colname) {
    var jqgrid = $(e).closest(".k-grid");
    var kgrid = jqgrid.data("kendoGrid");
    var currfilter = kgrid.dataSource.filter();
    if ($(e).html().indexOf("k-i-funnel-clear") == -1) {
        //remove filter
        removeFromFilter(currfilter, colname);
        //build new one
        if (currfilter.filters)
            currfilter.filters.push({ field: colname, operator: "eq", value: null });
        else
            currfilter = { field: colname, operator: "eq", value: null };
        kgrid.dataSource.filter(currfilter);
        //turn it into expand
        $(e).html('<span class="k-icon k-i-funnel-clear"></span>Show all');
    }
    else {
        //remove filter 
        removeFromFilter(currfilter, colname);
        kgrid.dataSource.filter(currfilter);
        $(e).html('<span class="k-icon k-i-funnel"></span>Hide layers');
    }
}

function buildLayerFilterButton()
{
    return "<a title='Hide/Show all the columns wich are part of a specific application layer' class='k-button k-button-icontext assocman' onclick='filterUnfilter(this,\"Layer_ID\");' href='javascript:void(0)'><span class='k-icon k-i-funnel'></span>Hide layers</a>";
}

function removeFromFilter(filter, colname) {
    var filters = [];
    filters = $(filter.filters).map(function (i, v) {
        if (v.field != colname)
            return v;
    });
    if (filters.length > 0)
        filter.filters = filters;
}

function switchMainEntity(e) {
		var targetgrid = getGridFromToolbarButton(e);
		var selectedrow = targetgrid.select();
		if (selectedrow.length == 0) {
			kendoConsole.log("Select a grid!", true);
			return;
		}
		var rowdata = targetgrid.dataItem(targetgrid.select());
		var template = "<div class='row'>\
							<div class='form-group col-md-12'>\
								<label for='switchentity_newname'>From Table new value in format: schema.TABLE_OR_VIEW_NAME</label>\
								<input class='form-control' id='switchentity_newname' type='text'/>\
							</div >\
							<div class='form-group form-check col-md-12'>\
									<input checked='checked' type ='checkbox' class='form-check-input' id = 'switchentity_refresh' >\
									<label class='form-check-label' for='switchentity_refresh'>Automatically refresh grid</label>\
						  </div>\
						</div >";
		rebuildGenericModal();
		$("#wndmodalContainer").find(".modal-title").text("Change grid's main entity (From Table/Da Tabella)");
		$("#wndmodalContainer").modal("toggle");
		$("#contentofmodal").prepend(template);
		$("#executesave").click(function (e) {
			doModal(true);
			var user_label = $("#switchentity_newname").val();
			//prevent XSS cross side scripting 
			var p = document.createElement("p");
			p.textContent = user_label;
			console.log(rowdata);
			user_label = p.innerHTML;

			

			if (!user_label || user_label.indexOf('.') == -1 || user_label.length <= 2) {
				kendoConsole.log("Please insert a valid entity name (schema.table or view) !", true);
				doModal(false);
				return;
			}
			
			$.get("/api/Magic_Grids/SwitchEntity",
				{
					gridname: rowdata.MagicGridName,
					FromTableNew: user_label
				}).done(function (msg) {
					kendoConsole.log(msg, false);
					if ($("#switchentity_refresh").is(":checked"))
						refresh(rowdata.MagicGridName, user_label);
					else {
						targetgrid.dataSource.read();
					}
					$("#wndmodalContainer").modal("hide");
					doModal(false);
				}
			).fail(function (msg) {
				kendoConsole.log(msg, true);
				doModal(false);

				});
		}); 

}	

function getAppNamesForGrid(rowdata) {

	return $.get("/api/Magic_Grids/GetApplicationsAndLayersForAlternativeGrid",
		{
			gridName: rowdata.MagicGridName
		});
}

function rebuildApplicationLayerForGrid(e, appNames, gridName, schema) {
	var rowdata = getRowDataFromButton(e);
	rowdata.GridName = gridName;
	rowdata.Schema = schema;
	//current application is available 
	//appNames.unshift(window.ApplicationInstanceName);
	var targetgrid = $(e.currentTarget).closest(".k-grid").data("kendoGrid");
	var template = "<div class='row'>\
							<div class='form-group col-md-12'>\
								<label for='application_name_for_layer'>Select an app from the ones linked to this layer</label>\
								<select class='form-control' id='application_name_for_layer'>\
									{0}\
	   							</select >\
								<br\>\
							</div >\
						</div >";
	rebuildGenericModal();
	$("#wndmodalContainer").find(".modal-title").text("Refresh layer from information schema");
	$("#wndmodalContainer").modal("toggle");
	let contentOptions = "";
	appNames.forEach(function (a) {
		contentOptions += "<option>" + a + "</option>";
	});
	if (appNames.indexOf(window.ApplicationInstanceName) != -1)//if current app is among the appNames i will pre-select it
		$("#application_name_for_layer").val(window.ApplicationInstanceName).change();

	$("#contentofmodal").prepend(template.format(contentOptions));

	$("#executesave").click(function (e) {
		console.log(e);
		var appname = $("#application_name_for_layer option:selected").text();
		if (!appname) {
			kendoConsole.log("Please select the application instance name!");
			return;
		}
		doModal(true);
		let data = $.extend({}, rowdata.toJSON(), { appName: appname });

		$.ajax({
			type: "POST",
			url: "/api/Magic_Grids/RefreshLayerGridToDb",
			data: JSON.stringify(data),
			success: function (response) {
				kendoConsole.log(response.msg, false);
				targetgrid.dataSource.read();
				doModal(false);
				$("#wndmodalContainer").modal("hide");
			},
			error: function (error) {
				kendoConsole.log(error, true);
				doModal(false);
			},
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		});

		
	});

}	
    function emptyCacheOrBuffers(e, type)
    {
        if (type == "cache")
            $.get("/api/Magic_Grids/EmptyFunctionAndGridsCache", function (msg) {
                kendoConsole.log(msg, false);
                }
            );
        else 
            $.get("/api/Magic_Grids/CleanScriptBuffer", function (msg) {
                kendoConsole.log(msg, false);
                }
            );
    }

    function extendGrid(e)
    {
        function buildSchema(row,hideableCols,groupableCols,spCols) {
            var schema = {
                title: row.MagicGridName,
                type: "object",
                format:"grid",
                properties: {
                    status: {
                        type: "string",
                        propertyOrder: 10,
                        title:"Status",
                        enum: ["DEPLOY", "DEPLOYBLOCK", "OBSOLETE"],
                        default: "DEPLOY",
                        options: {
                            collapsed: true,
                            grid_columns: 4
                        }
                    },
                    hidden_columns: {
                        type: "array",
                        propertyOrder: 20,
                        title: "Hidden columns",
                        uniqueItems: true,
                        format:"table",
                        items: {
                            type: "object",
                            title: "Hidden col",
                            properties: {
                                Column: {
                                    type: "string",
                                    enum: hideableCols
                                },
                            }
                        },
                        options: {
                            collapsed: true,
                            grid_columns: 4
                        }
                    },
                    noconstraint_incell_columns: {
                        type: "array",
                        propertyOrder: 20,
                        title: "Don't run constraint columns",
                        description: "This only works for incell edit grids.",

                        uniqueItems: true,
                        format: "table",

                        items: {
                            type: "object",
                            title: "No constraint columns",
                            properties: {
                                Column: {
                                    type: "string",
                                    enum: hideableCols
                                },
                            },
                        },
                        options: {
                            collapsed: true,
                            grid_columns: 4,
                        }
                    },
                    grouped_columns: {
                        type: "array",
                        propertyOrder: 30,
                        title: "Grouped columns",
                        uniqueItems: true,
                        format: "table",
                        items: {
                            type: "object",
                            title: "Grouped col",
                            properties: {
                                Column: {
                                    type: "string",
                                    enum: groupableCols
                                },
                            }
                        },
                        options: {
                            collapsed: true,
                            grid_columns: 4
                        }
                    },
                    popupfieldgroups: {
                        title: "Popup field groups",
                        type: "array",
                        propertyOrder: 40,
                        uniqueItems: true,
                        format:"table",
                        options: {
                            collapsed: true,
                            grid_columns: 6
                        },
                        items: {
                            type: "object",
                            title: "Grouped col",
                            properties: {
                                collapsed: {
                                    type: "checkbox",
                                    title: "Collapsed",
                                    default: false
                                },
                                labels: {
                                    type: "object",
                                    title: "Labels",
                                    properties: {
                                        en_GB: { type: "string" },
                                        it_IT: { type: "string" },
                                        de_DE: { type: "string" }
                                    }
                                },
                                fields: {
                                    type: "array",
                                    title: "Columns",
                                    uniqueItems: true,
                                    format: "table",
                                    items: {
                                        type: "object",
                                        title: ".",
                                        properties: {
                                            Column: {
                                                type: "string",
                                                enum: groupableCols
                                            },
                                        }
                                    }
                                }
                            }
                        }
                    
                    }, searchgridInCellColumns: {
                        type: "array",
                        propertyOrder: 170,
                        title: "Searchgrid incell column config",
                        description: "Configure from which column will the incell searchgrid retrive text data.",

                        uniqueItems: true,
                        format: "table",

                        items: {
                            type: "object",
                            title: "No constraint columns",
                            properties: {
                                Column: {
                                    title:'Searchgrid column',
                                    type: "string",
                                    enum: hideableCols
                                },
                                ColumnDescriptionSource: {
                                    title:'Description source column (searchgrid)',
                                        type: "string"
                                },
                                ColumnDescriptionTarget: {
                                    title: 'Description target column (main grid)',
                                    type: "string",
                                    enum: spCols
                                }
                            },
                        },
                        options: {
                            collapsed: true,
                            grid_columns: 6,
                        }
                    },
                    massiveUpdate_form_columns: {
                        type: "array",
                        propertyOrder: 50,
                        title: "Multiselect fields restriction",
                        uniqueItems: true,
                        format:"table",
                        options: {
                            collapsed: true,
                            grid_columns: 6
                        },
                        items: {
                            type: "object",
                            title: "Column to update",
                            format:"grid",
                            properties: {
                                Column: {
                                    type: "string",
                                    enum: groupableCols
                                }
                            }
                        }
                    },
                    export_formats: {
                        type: "array",
                        propertyOrder: 55,
                        title: "Disabled exports",                        
                        format:"grid",
                        options: {
                            collapsed: true,
                            grid_columns: 6
                        },
                        items: {
                            type: "array",
                            title: "Column to update",
                            properties: {                                
                                disable_csv: {
                                    title: "Disable CSV",
                                    type: "checkbox",
                                    default: false,
                                    options: {
                                        grid_columns: 4
                                    }
                                },
                                disable_pdf: {
                                    title: "Disable PDF",
                                    type: "checkbox",
                                    default: false,
                                    options: {
                                        grid_columns: 4
                                    }
                                },disable_xlsx: {
                                    title: "Disable XLSX",
                                    type: "checkbox",
                                    default: false,
                                    options: {
                                        grid_columns: 4
                                    }
                                },

                            }
                        }
                    },
                    query_for_template_document: {
                        type: "checkbox",
                        propertyOrder: 60,
                        options: {
                            grid_columns: 6
                        },
                        title: "Query for Template Document",
                        default: false
                    },
                    show_workflow_actions_column: {
                        type: "checkbox",
                        propertyOrder: 70,
                        options: {
                            grid_columns: 6
                        },
                        title: "Add workflow action column",
                        default: false
                    },
                    show_function_grid_actions: { //usate in refTree per i BUTGRI
                        type: "checkbox",
                        propertyOrder: 80,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show function-grid custom actions",
                        default: false
                    },
                    show_popup_related_grids_on_insert: {
                        type: "checkbox",
                        propertyOrder: 90,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show tabs with grids in PopUp for new rows",
                        default: false
                    },
                    show_group_by_functionality: {
                        type: "checkbox",
                        propertyOrder: 100,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show GROUP-BY-functionality for grid",
                        default: false
                    },
                    show_map: {
                        type: "checkbox",
                        propertyOrder: 110,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show google map (required columns: longitude and latitude)",
                        default: false
                    },
                    show_tree_map: {
                        type: "checkbox",
                        propertyOrder: 115,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show google map with navigation tree",
                        default: false
                    },
                    show_tree_scheduler: {
                        type: "checkbox",
                        propertyOrder: 125,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show scheduler with navigation tree",
                        default: false
					},
					show_scheduler: {
						type: "checkbox",
						propertyOrder: 126,
						options: {
							grid_columns: 6
						},
						title: "Show scheduler in toolbar (without tree)",
						default: false

					},
                    show_2dviewer: {
                        type: "checkbox",
                        propertyOrder: 120,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show 2d cad viewer",
                        default: false
					},
					show_3dviewer: {
						type: "checkbox",
						propertyOrder: 123,
						options: {
							grid_columns: 6
						},
						title: "Show 3d viewer",
						default: false
					},
					show_gisviewer: {
						type: "checkbox",
						propertyOrder: 125,
						options: {
							grid_columns: 6
						},
						title: "Show GIS viewer",
						default: false
					},
                    show_copy_row_button: {
                        type: "checkbox",
                        propertyOrder: 130,
                        options: {
                            grid_columns: 6
                        },
                        title: "Activate copy row button",
                        default: false
                    },
                    show_bo_note_button: {
                        type: "checkbox",
                        propertyOrder: 140,
                        options: {
                            grid_columns: 6
                        },
                        title: "Show BO Note/Memo button",
                        default: false
					},
                    snapshot: {
                        type: "checkbox",
                        propertyOrder: 150,
                        options: {
                            grid_columns: 6
                        },
                        title: "Take a data snapshot when saving (Magic_GridDataSnapShot)",
                        default: false
					},
					autoresize: {
						type: "checkbox",
						propertyOrder: 155,
						options: {
							grid_columns: 6
						},
						title: "Automatic resize on data bound",
						default: false
					},
                    detailTemplateOnPopup: {
                        type: "checkbox",
                        propertyOrder: 156,
                        options: {
                            grid_columns: 6
                        },
                        title: "When grid is in kendo popup as a tab show its navigation (detail property of kendo) template",
                        default: false
                    },
                    addZoomButton: {
                        type: "checkbox",
                        propertyOrder: 157,
                        options: {
                            grid_columns: 6
                        },
                        title: "Add a row button which filters the row and expands the navigation template",
                        default: false
                    },
                    disableReadOnlyButton: {
                        type: "checkbox",
                        propertyOrder: 158,
                        options: {
                            grid_columns: 6
                        },
                        title: "Disable addition of the read only button (television)",
                        default: false
                    },
                    startEmpty: {
						type: "checkbox",
						propertyOrder: 159,
						options: {
							grid_columns: 6
						},
						title: "Don't load data before user sets a filter",
						default: false
                    },
                    showAllAtOnceFilter: {
						type: "checkbox",
						propertyOrder: 160,
						options: {
							grid_columns: 6
						},
						title: "Show all at once filter popup",
						default: false
                    },
                    reloadDashboard: {
                        type: "checkbox",
                        propertyOrder: 161,
                        options: {
                            grid_columns: 6
                        },
                        title: "When grid is in dashboard refresh other elements",
                        default: false
                    },
                    disabled_export_formats: {
                        title: "Disabled export formats",
                        format: "grid",
                        type: "object",
                        propertyOrder: 162,
                        options: {
                            collapsed: true,
                            grid_columns: 6
                        },
                        properties: {
                            csv: {
                                title: "Disable CSV",
                                type: "checkbox",
                                default: false,
                                options: {
                                    grid_columns: 4
                                }
                            },
                            pdf: {
                                title: "Disable PDF",
                                type: "checkbox",
                                default: false,
                                options: {
                                    grid_columns: 4
                                }
                            },
                            xlsx: {
                                title: "Disable XLSX",
                                type: "checkbox",
                                default: false,
                                options: {
                                    grid_columns: 4
                                }
                            },
                        }
                    },
                    f2FileColumns: {
                        type: "array",
                        propertyOrder: 163,
                        title: "framework2 file columns",
                        uniqueItems: true,
                        format: "table",
                        items: {
                            type: "object",
                            title: "File column",
                            properties: {
                                f1Column: {
                                    title: 'f1 column name',
                                    type: "string",
                                },
                                f2Column: {
                                    title: 'f2 column name',
                                    type: "string",
                                },
                            }
                        },
                        options: {
                            collapsed: true,
                            grid_columns: 6
                        }
                    },
                    paging_options: {
                        title: "Paging options",
                        format: "grid",
                        type: "object",
                        propertyOrder: 164,
                        options: {
                            collapsed: true,
                            grid_columns: 4
                        },
                        properties: {
                            disable_server_paging: {
                                title: "Disable server paging",
                                type: "checkbox",
                                default: false,
                                options: {
                                    grid_columns: 4
                                }
                            },
                            page_size: {
                                title: "Page size",
                                type: "number",
                                default: 10,
                                options: {
                                    grid_columns: 4
                                }
                            },
                        }
                    },
                    sp_columns: {
                        type: "array",
                        propertyOrder: 165,
                        title: "Select-all columns",
                        uniqueItems: true,
                        format: "table",
                        items: {
                            type: "object",
                            title: "Column",
                            properties: {
                                Column: {
                                    type: "string",
                                    enum: spCols
                                },
                            },
                        },
                        options: {
                            collapsed: true,
                            grid_columns: 4
                        }
                    },
					bo_message_settings: {
						title: "BO message settings",
						format: "grid",
						type: "object",
						options: {
							collapsed: true,
							grid_columns: 12
						},
						properties: {
							bo_description_column: {
								title: "BO description column",
								type: "string",
								options: {
									grid_columns: 12
								}
							},
							show_bo_message_button: {
								title: "Show BO instant message button",
								type: "checkbox",
								default: false,
								options: {
									grid_columns: 4
								}
							}
						}
                    },                   
                    new_bo_mail_settings: {
                        title: "BO settings",
                        format: "grid",
                        type: "object",
                        options: {
                            collapsed: true,
                            grid_columns: 12
                        },
                        properties: {
                            bo_description_column: {
                                title: "BO description column",
                                type: "string",
                                options: {
                                    grid_columns: 12
                                }
                            },
                            show_new_mail_button: {
                                title: "Show mail button",
                                type: "checkbox",
                                default: false,
                                options: {
                                    grid_columns: 4
                                }
                            },
                            system_message_templates: {
                                title: "Available mail templates",
                                type: "array",
                                uniqueItems: true,
                                options: {
                                    collapsed: true,
                                    grid_columns: 4
                                },
                                items: {
                                    type: "object",
                                    format: "grid",
                                    properties: {
                                        templateCode: {
                                            type: "string",
                                            title: "Template code",
                                            options: {
                                                grid_columns: 4
                                            }
                                        },
                                        attachmentColumn: {
                                            type: "string",
                                            title: "Column name with attachments",
                                            options: {
                                                grid_columns: 4
                                            }
                                        },
                                        isDefaultTemplate: {
                                            type: "checkbox",
                                            title: "is default template",
                                            default: false,
                                            options: {
                                                grid_columns: 4
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    per_record_summary_sp: {
                        type: "string",
                        propertyOrder: 166,
                        options: {
                            grid_columns: 12
                        },
                        title: "Summary from stored procedure",
                    },
                    columnsFilteredByParentsColumns: {
                        type: "array",
                        title: "Parent grids' columns to use as filters",
                        items: {
                            type: "object",
                            format:"grid",
                            properties: {
                                parentColumn: {
                                    type: "string",
                                    title: "Parent grid's column",
                                    options: {
                                        grid_columns: 4
                                    }
                                },
                                childColumn: {
                                    type: "string",
                                    title: "This grid's column (Child column)",
                                    options: {
                                        grid_columns: 4
                                    }
                                }
                            }
                        }
                    },
                    refreshParentGrid: {
                        type: "array",
                        title: "Grid name of the parent grid that shall refresh on changing data from this grid as its child",
                        items: {
                            type: "string"
                        }
                    },
                    magicWizardCode: {
                        type: "string",
                        title: "MagicWizardCode: the code of the wizard to open in edit"
					},
					magicPivotCodes: {
						type: "string",
						title: "Comma separated list of pivot codes for filtering (e.g. PIVOT1,PIVOT2...)"
                    },
                    editPageCode: {
                        type: "string",
                        title: "The code of the edit page to open when editing a grid's row"
                    },
                    magnifyBreadcrumbDescriptionColumn: {
                        type: "string",
                        title: "Name of the column used for magnify-breadcrumb"
					},
                    aggregateFunctionsForColumnsFooterTemplate: {
                        type: "string",
                        title: "Aggregate functions for columns footer template: Define the aggregate functions that should be executed for this table and been displayed in the columns.footerTemplate (has to be added to columnExtensions - see the example there). Example: max(aNumericColumnOfTheCurrentTable) as [max], min(aNumericColumnOfTheCurrentTable) as [min]"
                    },
                    documentSearchColumns: {
                        type: "string",
                        title: "Columns for the SQL document search (comma separated)"
                    },
                    columnExtensions: {
                        title: 'Column extensions: Extend columns, create a JSON of the form: { "columnToExtend": { footerTemplate: "Max: {{max}}, Min: {{min}}" }, "anotherColumnToExtend": "someOtherBeautifulKendoProperty" } - mind the footerTemplate in the example (you can also use the headerTemplate), use the {{columnNameFromAggregateFunctionsForColumnsFooterTemplate}} to be replaced with the result of the correpsonding aggregation query',
                        type: "string",
                        format: "json",
                        options: {
                            collapsed: true
                        }
					},
					dataSourceExtensions: {
						type: "string",
						title: 'JSON extension to kendo datasource e.g { "aggregate" : [{ "field": "InvrowAmountToPay", "aggregate": "sum" ,"format":"n2" }] }'
					},
                    addChildGridToParentPopup: {
                        title: "Shows the child grids (defined in the navigation properties) of this list (identified by GUID of Magic_TemplateGroups) in the popup edit of this grid and passes all the data modified as one object to the update/create endpoint.",
                        type: "array",
                        propertyOrder: 170,
                        items: {
                            type: "string"
                        },
                        options: {
                            collapsed: true
                        }
                    },
                    maxContentHeight: {
                        type: "string",
                        title: "Max Content height of Grid Content (must be a valid css e.g. 700px)"
                    },
                    selectAllSP: {
                        type: "string",
                        title: "SP to take all PK's for 'Select all'"
                    },
                    lockSelectAll: {
                        type: "checkbox",                        
                        title: "Suppress user selection and unselect all after select all",
                        default: false,
                        options: {
                            grid_columns: 12
                        }
                    },
                }
            };
            return schema;
        }

        
        var targetgrid = getGridFromToolbarButton(e);
        var selectedrow = targetgrid.select();
        if (selectedrow.length == 0)
            kendoConsole.log("Select a grid!", true);
        else
       { 
            var rowdata = targetgrid.dataItem(targetgrid.select());
            var defaultrow = {
                status: "DEPLOY",
                hidden_columns: [],
                grouped_columns: [],
                popupfieldgroups: [],
                massiveUpdate_form_columns: [],                
                query_for_template_document: false,
                show_workflow_actions_column: false,
                show_popup_related_grids_on_insert: false,
                show_group_by_functionality: false,
                show_function_grid_actions: false,
                show_map: false,
                show_tree_map: false,
				show_tree_scheduler: false,
				show_scheduler: false,
				show_2dviewer: false,
				show_3dviewer: false,
				show_gisviewer:false,
                show_copy_row_button: false,
				show_bo_note_button: false,
				show_bo_message_button: false,
				snapshot: false,
				autoresize: false,
				reloadDashboard: false,
				detailTemplateOnPopup:false,
				addZoomButton: false,
				disableReadOnlyButton:false,
                new_bo_mail_settings: {
                    show_new_mail_button: false,
                    bo_description_column: "",
                    system_message_templates: []
				},
				bo_message_settings: {
					show_bo_message_button: false,
					bo_description_column: ""
				},
                per_record_summary_sp: null,
                columnsFilteredByParentsColumns: [],
                startEmpty: false,
                showAllAtOnceFilter: true,
                disabled_export_formats: {
                    csv: false,
                    pdf: false,
                    xlsx: false,
                },
                paging_options: {
                    disable_server_paging: false,
                    page_size: 10,
                },
                sp_columns: [],
                refreshParentGrid: [],
                columnExtensions: "",
				magicWizardCode: "",
                magicPivotCodes:"",
                editPageCode: "",
                magnifyBreadcrumbDescriptionColumn: "",
                aggregateFunctionsForColumnsFooterTemplate: "",
				documentSearchColumns: "",
				dataSourceExtensions:"",
                addChildGridToParentPopup: [],
                maxContentHeight: "",
                f2FileColumns: [],
                selectAllSP: "",
                lockSelectAll: false,
                noconstraint_incell_columns: [],
                searchgridInCellColumns: []
            };
            //get the column list
            $.ajax({    //#mfapireplaced
                type: "POST",
                url: "/api/MAGIC_COLUMNS/GetColumns",
                data: JSON.stringify({ MagicGrid_ID: "" + rowdata.id }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                error: function (err) {
                    console.log("Error while loading Magic_Colums");
                    console.log(err.responseText);
                }
            }).then(function (res) {
                var magicColumns = res.Data[0].Table;
                var hideableColsSet = [];
                hideableColsSet = $.map(magicColumns, function (v, i) {
                    if (v.Columns_visibleingrid)
                        return v.ColumnName;
                });
                var groupableColsSet = [];
                groupableColsSet = $.map(magicColumns, function (v, i) {
                        return v.ColumnName;
                });
                var spColsSet = Object.assign([], groupableColsSet);
                //create JDORN Json editor form in modal 
                var schema = buildSchema(rowdata, hideableColsSet, groupableColsSet, spColsSet);
                var transfn = function () {
                }
                var savefn = function (e, editor) {
                    var editorValue = $.extend(true, {}, editor.getValue());
                    if (editorValue.columnsFilteredByParentsColumns) {
                        editorValue.columnFilteredByParentsColumn = {};
						$.each(editorValue.columnsFilteredByParentsColumns, function (k, v) {
							if (v.childColumn && v.parentColumn)
								editorValue.columnFilteredByParentsColumn[v.childColumn] = v.parentColumn;
                        });
                    }
                    if (editorValue.columnExtensions) {
                        try {
                            editorValue.columnExtensions = JSON.parse(editorValue.columnExtensions);
                        }
                        catch (e) {
                            kendoConsole.log("Error in column extensions, please review this field before u can save your changes! Error: " + e, true);
                            return;
                        }
                    }
                    rowdata.MagicGridExtension = JSON.stringify(editorValue);
                    rowdata.dirty = true;
                    targetgrid.saveChanges();
                    $("#wndmodalContainer").modal('toggle');
                }
                var jsoneditor = customizeModal({ title: "Extend grid", model: schema, transformation_fn: transfn, save_fn: savefn });
                jsoneditor.done(function (editor) {
                    $("#wndmodalContainer").addClass("modal-wide");
                    if (rowdata.MagicGridExtension) {
                        var gridExtension = JSON.parse(rowdata.MagicGridExtension);
                        if (gridExtension.columnExtensions)
                            gridExtension.columnExtensions = JSON.stringify(gridExtension.columnExtensions, null, "   ");
                        gridExtension = $.extend(defaultrow, gridExtension);
                        if (gridExtension.new_bo_mail_settings.system_message_templates.length) {
                            $.map(gridExtension.new_bo_mail_settings.system_message_templates, function (system_message_template, i) {
                                gridExtension.new_bo_mail_settings.system_message_templates[i] = $.extend({
                                    isDefaultTemplate: false,
                                    attachmentColumn: "",
                                    templateCode: ""
                                }, system_message_template);
                            });
                        }
                        editor.setValue(gridExtension);
                        $('#wndmodalContainer').find('.table.table-bordered').width('100%'); // stretch column-selects to parent-width (hiddenColumns, groupedColumns, spColumns, ...)
                    }
                });
                $("#wndmodalContainer").modal('toggle');
            });
            
        }
    }

    function buildCustomStoredProcedure(e)
    {
        var targetgrid = getGridFromToolbarButton(e);
        var selectedrow = targetgrid.select();
        console.log(selectedrow);
        if (selectedrow.length == 0)
        {
            kendoConsole.log("Select a grid!", true);
            return;
        }
        $.ajax({
            type: "POST",
            url: "/api/MAGIC_DATASOURCE/GenerateSetCustomStoredProcedure/" + targetgrid.dataItem(selectedrow).id,
            data: JSON.stringify(targetgrid.dataItem(selectedrow)),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log("Script and datasource settings performed", false);
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    }