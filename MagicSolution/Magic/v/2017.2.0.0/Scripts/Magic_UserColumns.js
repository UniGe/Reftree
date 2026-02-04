function extendUserCols(e) {
    var isDeveloperFunction = getCurrentFunctionGUID().toUpperCase() == "89DDF087-6D79-4F9C-924F-94EE7DD97ABD";
  
    function buildSchema(row, dataTypes, virtualTables,boTabs) {

        var dtypes_titles = $.map(dataTypes,function (v,i) { return v.Description; });
        var dtypes_values = $.map(dataTypes, function (v, i) {
            return v.ID;
        });

        var vtables_titles = $.map(virtualTables,function (v,i) { return v.Description; });
        var vtables_values = $.map(virtualTables, function (v, i) { return v.Code; });

        var tabs_titles = $.map(boTabs, function (v, i) { return v.Code; });
        var tabs_values = $.map(boTabs, function (v, i) { return v.ID; });

        vtables_values.unshift("");
        vtables_titles.unshift("N/A");
        tabs_titles.unshift("N/A");
        tabs_values.unshift(0);

        var schema = {
                    type: "array",
                    format: "table",
                    title: getObjectText("fields"),
                    uniqueItems:true,
                    items: {
                        type: "object",
                        format:"grid",
                        title: getObjectText("column"),
                        properties: {
                                name: {
                                    type:"string",
                                    title: getObjectText("fieldname"),
                                    minLength: 3                                },
                                tab: {
                                    type: "integer",
                                    title: "Tab",
                                    enum: tabs_values,
                                    options: {
                                        enum_titles: tabs_titles
                                    },
                                    default:0
                                },
                                type: {
                                    type: "integer",
                                    title: getObjectText("columntype"),
                                    enum: dtypes_values,
                                    options: {
                                        enum_titles: dtypes_titles
                                    },
                                    default: "string"
                                },
                                required: {
                                    type: "checkbox",
                                    title: getObjectText("required"),
                                    default: false
                                },
                                virtualTable: {
                                    type:"string",
                                    title: getObjectText("foreignkey"),
                                    enum: vtables_values,
                                    options: {
                                        enum_titles: vtables_titles,
                                        grid_columns:2

                                    },
                                    default: null
                                },
                                visibleAsColumn: {
                                    type: "checkbox",
                                    title: getObjectText("visibleAsColumn"),
                                    default: false
                                },
                                labels: {
                                    type: "object",
                                    title: getObjectText("labels"),
                                    format: "grid",
                                    options: {
                                        collapsed: true
                                    },
                                    properties: {
                                        it: {
                                            type: "string",
                                            title: "Italiano",
                                            options: {
                                               grid_columns:12
                                            }
                                        },
                                        en: {
                                            type: "string",
                                            title: "English",
                                            options: {
                                                grid_columns: 12
                                            }
                                        },
                                        de: {
                                            type: "string",
                                            title: "Deutsch",
                                            options: {
                                                grid_columns: 12
                                            }
                                        }
                                    }
                                },
                                searchGrid: {
                                    type:"object",
                                    title: getObjectText("SearchGrid"),
                                    format:"grid",
                                    options: {
                                        collapsed: true
                                    },
                                    properties: {
                                        searchGridMagicGridName: {
                                            title: getObjectText("searchGridMagicGridName"),
                                            type: "string",
                                            propertyOrder: 10,
                                            options: {
                                                grid_columns: 12
                                            }
                                        },
                                        searchGridLabelColumn: {
                                            title: getObjectText("searchGridLabelColumn"),
                                            type: "string",
                                            propertyOrder: 20,
                                            options: {
                                                grid_columns: 12
                                            }
                                        },
                                        MagicDataSource: {
                                            type: "string",
                                            title: "Db object name (with schema)",
                                            propertyOrder: 30,
                                            options: { grid_columns:12 }
                                        },
                                        MagicDataSourceValueField: {
                                                    type: "string",
                                                    title: "Key field",
                                                    propertyOrder: 40,
                                                    options: { grid_columns: 12 }
                                        },
                                        MagicDataSourceTextField: {
                                                    type: "string",
                                                    title: "Text field",
                                                    propertyOrder: 50,
                                                    options: { grid_columns:12}
                                        },
                                        MagicDataSourceType: {
                                                    type: "integer",
                                                    enum: [1, 2],
                                                    propertyOrder: 60,
                                                    default:2,
                                                    options: {
                                                        enum_titles: ["Stored procedure", "View or Table"],
                                                    grid_columns: 12 
                                                 }
                                        }
                                 
                                    }
                                }
                                
                            }
                            
                        }
        };
        if (!isDeveloperFunction  //developer always use the full configurations
            && !(window.UserIsDeveloper == "True"))
                
        {
            delete schema.items.properties.searchGrid;
        }

        return schema;
    }
    function buildXML(values) {
        var XML = "<rows>{0}</rows>";
        var rows = "";
        $.each(values, function (k, v) {
            var r = "";
            $.each(v, function (propname, propvalue) {
                var value = propvalue;
                if (typeof propvalue == "object")
                    value = JSON.stringify(propvalue);
                r += "<" + propname + ">" + value + "</" + propname + ">";
            });
            rows += "<row>"+ r +  "</row>";
        });
        return XML.format(rows);
    }
    var rowdata = $(e).closest(".k-grid").data("kendoGrid").dataItem($(e).closest("tr"));
    var targetgrid = $(e).closest(".k-grid").data("kendoGrid");
     
    var defer = $.Deferred();
    var defer_ = $.Deferred();
    var defer__ = $.Deferred();
    //get the column list 
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({
            table: "USERFIELDS.Magic_UserColumnDataTypes",
            where: (isDeveloperFunction || window.UserIsDeveloper=="True") ? "1=1" : "OnlyForDeveloper=0",
            order: "ID"
        })
        .then(function (res) {
            defer.resolve(res);
        });
        MF.api.get({
            table: "USERFIELDS.Magic_UserVirtualTables",
            order: "ID"
        })
        .then(function (res) {
            defer_.resolve(res);
        });
        MF.api.get({
            table: "USERFIELDS.Magic_BOTypeGridUserTabs",
            order: "iOrder",
            where: "BoType_ID =" + rowdata.ID.toString()
        })
       .then(function (res) {
           defer__.resolve(res);
       });

        $.when(defer, defer_, defer__).then(function (dataTypes, virtualTables, boTabs) {
            var schema = buildSchema(rowdata, dataTypes, virtualTables, boTabs);
            var transfn = function () {
            }
            var savefn = function (e, editor) {
                function transposeDefinitionToExtension(virtualTables, dataTypes, definition) {
                    var templatesAndFormats = function (dbtype, field) {
                        switch (dbtype) {
                            case "money":
                                return {
                                    format: '0:c2'
                                }
                                break;
                            case "int":
                                return {
                                    format: '0:n0'
                                }
                                break;
                            default:
                                return {};
                                break;
                        }
                    }
                    var datatype;
                    var virtualtable;
                    var extension = {};
                    var promises = [];
                    $.each(definition, function (i, v) {
                        $.each(dataTypes, function (j, k) {
                            if (k.ID == v.type)
                                datatype = k;
                        });
                        $.each(virtualTables, function (j, k) {
                            if (k.ID == v.virtualTables)
                                virtualtable = k;
                        });
                        v.type = datatype.SchemaType;
                        v.databasetype = datatype.SqlType;

                        var tandf = templatesAndFormats(datatype.SqlType, v.name);
                        if (tandf["format"])
                            v.column_format = tandf["format"];
                        if (tandf["template"])
                            v.column_template = tandf["template"];

                        v.dataRole = datatype.MagicTemplateDataRole;
                        if (v.required) {
                            v.validation = {
                                required: true
                            };
                        }
                        delete v.required;
                        //var ready = true;
                        if (v.virtualTable) {
                            v.dataRole = "dropdownlist";
                            v.databasetype = "int";
                            v.type = "numeric";
                            v.dataSourceInfo = {
                                dsValueField: v.virtualTable,
                                dsTextField: "Fk_TextLabel",
                                dataSource: "Magic_GetUserDropDownValues",
                                dsSchema: "USERFIELDS",
                                dsTypeId: 1
                            };
                        }
                        if (v.dataRole == "searchgrid" && v.searchGrid && v.searchGrid.MagicDataSource) {
                            var schema = v.searchGrid.MagicDataSource.indexOf(".") != -1 ? v.searchGrid.MagicDataSource.split(".")[0] : "dbo";
                            var datasource = v.searchGrid.MagicDataSource.indexOf(".") != -1 ? v.searchGrid.MagicDataSource.split(".")[1] : v.searchGrid.MagicDataSource;
                            v.databasetype = "int";
                            v.type = "numeric";
                            v.dataSourceInfo = {
                                dsValueField: v.searchGrid.MagicDataSourceValueField,
                                dsTextField: v.searchGrid.MagicDataSourceTextField,
                                dataSource: datasource,
                                dsSchema: schema,
                                dsTypeId: v.searchGrid.MagicDataSourceType
                            };
                        }
                        delete v.virtualTable;
                        extension[v.name] = v;
                        delete v.name;
                    });
                    return extension;
                }
                //look for validation problems 
                var isvalid = true;
                $.each(editor.validation_results, function (i, v) {
                    isvalid = false;
                    return;
                });
                //transposition from definition format to GridExtension format
                var editorvalue = editor.getValue();
                $.each(editorvalue, function (i, v) {
                    if (!v.labels[window.culture.substring(0, 2)])
                        v.labels[window.culture.substring(0, 2)] = v.name;
                    v.name = v.name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').replace(/\s+/g, '').replace(/^[0-9]/g, '');
                    v.Order = i;
                });
                var extension = JSON.parse(JSON.stringify(editorvalue));
                var fnamesHash = {};
                $.each(extension, function (i, v) {
                    if (fnamesHash[v.name]) {
                        isvalid = false;
                        kendoConsole.log(getObjectText("fieldnameduplicate"), true);
                        return;
                    } else
                        fnamesHash[v.name] = true;
                });
                if (!isvalid)
                    return;
                var errorMessage = function (error) {
                    kendoConsole.log("Magic_UserColumns: Error while retrieving userID. Error-message: " + error, true);
                };
                MF.api.get({
                    table: "dbo.Magic_Mmb_Users",
                    where: "Username = '" + window.Username + "'"
                }).then(
                    function (res) {
                        if (res.length) {
                            if (isDeveloperFunction) {
                                rowdata.DeveloperGridExtension = JSON.stringify(transposeDefinitionToExtension(virtualTables, dataTypes, extension));
                                rowdata.DeveloperColumnsDefinition = JSON.stringify(editorvalue);
                                rowdata.DeveloperColumnsDefinitionXML = buildXML(editorvalue);
                            }
                            else {
                                rowdata.GridExtension = JSON.stringify(transposeDefinitionToExtension(virtualTables, dataTypes, extension));
                                rowdata.ColumnsDefinition = JSON.stringify(editorvalue);
                                rowdata.ColumnsDefinitionXML = buildXML(editorvalue);
                            }
                            rowdata.isDeveloperFunction = isDeveloperFunction;
                            rowdata.dirty = true;
                            targetgrid.saveChanges();
                            $("#wndmodalContainer").modal('toggle');
                        }
                        else
                            errorMessage("User not found");
                    },
                    errorMessage
                    );
            }
            //if a managed language is missing i default it to italian which is supposed to be present
            function sanitizeLabels(obj) {
                $.each(obj, function (i, v) {
                    if (v.labels["it"]) {
                        if (!v.labels["en"])
                            v.labels["en"] = v.labels["it"];
                        if (!v.labels["de"])
                            v.labels["de"] = v.labels["it"];
                    }
                });
                return obj;
            }
            var jsoneditor = customizeModal({ title: getObjectText("definecolumns"), model: schema, transformation_fn: transfn, save_fn: savefn });
            function filter_fn() {
                doModal(true);
                var value = $("#searchcol___").val();
                //show them all
                $("[data-schemapath*=name]").find("input").closest("tr").show();
                if (value)
                {
                    $("[data-schemapath*=name]").find("input").each(function (i, v) {
                        if ($(v).val() && $(v).val().toUpperCase().indexOf(value.toUpperCase()) == -1)
                            $(v).closest("tr").hide();
                    });
                }
                doModal(false);
            };
            jsoneditor.done(function (editor) {
                $("#wndmodalContainer").addClass("modal-full");
              
                //add the column name filter 
                $("#contentofmodal.modal-body").prepend("<div class='well well-sm' style='height: 55px;'>\
                                                            <input style= 'float:left;height:36px;' id= 'searchcol___' placeholder= 'Search column name...' />\
                                                            <button id='btn___filter___' style='float:left;' title= 'Filter' type= 'button' class='btn btn-success'>\
                                                            <span class='glyphicon glyphicon-filter' ></span >\
                                                            </button>\
                                                        </div></br>");
                $("#btn___filter___").click(function () {
                    filter_fn();
                })
                if (isDeveloperFunction) {
                    if (rowdata.DeveloperColumnsDefinition)
                        editor.setValue(sanitizeLabels(JSON.parse(rowdata.DeveloperColumnsDefinition)));
                }
                else {
                    if (rowdata.ColumnsDefinition)
                        editor.setValue(sanitizeLabels(JSON.parse(rowdata.ColumnsDefinition)));
                }
                
                __adjustCss__();
            });
            
            
            $("#wndmodalContainer").modal('toggle');
           
        }, function (res) {
            console.log("Error while loading columns");
        });

    });
}
function __adjustCss__()
{ 
    $("div[data-schemaid=root] h3:first").hide();
    $("div[data-schemaid=root]").append("<style scoped>\
        div.well.well-sm h3 { margin-top:0px;margin-bottom:0px;   }\
        div.well.well-sm h3 span { font-size:10px;   }\
        div.well.well-sm table td { padding:3px!important;}\
        div#contentofmodal .select2-container.form-control {\
                                                                padding:0!important;\
                                                                max-width:200px;\
        }\
        #contentofmodal button.json-editor-btn-delete:last-child { display:none; }\
        </style>");
    $(".well.well-sm [data-schemapath*=name]").find("input").css("min-width", "200px");
    $(".well.well-sm [data-schemapath*=tab]").find("select").css("min-width", "120px")
    
}
