function buildMagicSpreadSheets(e) {

    function buildSchema(row) {
        //upper case props are MF props, others are Kendo
        var items_def = {
            type: "object",
            format: "grid",
            title: "Sheet",
            properties: {
                name: {
                    type: "string",
                    title: "Sheet name",
                    options: {
                        grid_columns: 6
                    }
                },
                DataAppendOffset: {
                    type: "integer",
                    default: 0,
                    title:"Starting row for data from DB"
                },
                mergedCells: {
                    type: "array",
                    title: "Merged cells",
                    uniqueItems: true,
                    format: "table",
                    items: {
                        type:"string"
                    },
                    options: {
                        collapsed: true
                    }
                },
                rows: {
                    type: "array",
                    title: "Predefined rows",
                    format:"table",
                    uniqueItems: true,
                    options: {
                        collapsed: true
                    },
                    items: {
                        type: "object",
                        format:"grid",
                        title:"Row",
                        properties: {
                            height: {
                                type: "integer",
                                title: "Height",
                                default: 20,
                                options: {
                                    grid_columns: 1
                                }
                            },
                             Last: {
                                    type: "checkbox",
                                    title: "Bottom",
                                    default: false,
                                    options: {
                                        grid_columns: 1
                                    },
                                }
                            ,
                            cells: {
                                type: "array",
                                format: "table",
                                title: "Cells",
                                options: {
                                    grid_columns:10
                                },
                                items: {
                                    type: "object",
                                    format: "grid",
                                    title:"Cell",
                                    properties: {
                                        index: {
                                            type: "integer",
                                            title: "Index",
                                            options: {
                                                grid_columns: 1
                                            }
                                        },
                                        enable: {
                                            type: "checkbox",
                                            title: "Editable",
                                            default: true,
                                            options: {
                                                grid_columns: 1
                                            }
                                        },
                                        textAlign: {
                                            type: "string",
                                            title: "Text alignment",
                                            enum: ["center", "left", "right"],
                                            default:"center",
                                            options: {
                                                grid_columns: 2
                                            }
                                        },
                                        background: {
                                            type: "string",
                                            title: "Background",
                                            format: "color",
                                            default:"#FFFFFF",
                                            options: {
                                                grid_columns:1
                                            }
                                        },
                                        color: {
                                            type: "string",
                                            title: "Color",
                                            format: "color",
                                            options: {
                                                grid_columns: 1
                                            }
                                            
                                        },
                                        value: {
                                            type: "string",
                                            title: "Value",
                                            options: {
                                                grid_columns: 4,
                                                input_width:"200px"
                                            }
                                        },
                                        
                                        fontSize: {
                                            type: "integer",
                                            title: "Font size",
                                            default:14,
                                            options: {
                                                grid_columns: 1
                                            }
                                        },
                                        bold: {
                                            type: "checkbox",
                                            title: "Bold",
                                            default: true
                                        },
                                        formula: {
                                            type: "string",
                                            title: "Formula (use '#' to include all values)" 
                                        }
                                        
                                    }
                                }
                            }
                        }
                    }
                },
                columns: {
                    type: "array",
                    format:"table",
                    title: "Columns",
                    uniqueItems:true,
                    items: {
                        type: "object",
                        format: "grid",
                        title:"Column",
                        properties: {
                            width: {
                                type: "integer",
                                title: "Width",
                                default: 150
                            },
                            index:{
                                type: "integer",
                                title: "Index"
                            },
                            enable: {
                                type: "checkbox",
                                title: "Editable",
                                default:true
                            },
                            hidden: {
                                type: "checkbox",
                                title: "Hidden",
                                default:false
                            },
                            format: {
                                type: "string",
                                title: "format"
                            },
                            textAlign: {
                                type: "string",
                                title: "Text alignment",
                                enum: ["center", "left", "right"],
                                default: "center",
                                options: {
                                    grid_columns: 2
                                }
                            },
                            background: {
                                type: "string",
                                title: "Background",
                                format: "color",
                                default:"#FFFFFF",
                                options: {
                                    grid_columns: 1
                                }
                            },
                            color: {
                                type: "string",
                                title: "Color",
                                format: "color",
                                default:"black",
                                options: {
                                    grid_columns: 1
                                }

                            },
                            fontSize: {
                                type: "integer",
                                title: "Font size",
                                default:12,
                                options: {
                                    grid_columns: 1
                                }
                            },
                            bold: {
                                type: "checkbox",
                                title: "Bold",
                                default: true
                            }

                        }
                    }
                }
            }
        };

        var schema = {
            title: row.Code,
            type: "object",
            properties: {
                general: {
                    type: "object",
                    format:"grid",
                    title: "General settings",
                    options: {
                        collapsed: true
                    },
                    properties: {
                        LoadSP: {
                            type: "string",
                            title: "Read stored procedure (with schema)",
                            options: {
                                grid_columns: 6
                            }
                        },
                        WriteSP: {
                            type: "string",
                            title: "Write stored procedure (with schema)",
                            options: {
                                grid_columns: 6
                            }
                        },
                        columns: {
                            type: "integer",
                            title: "Columns number",
                            default: 50
                        },
                        rows: {
                            type: "integer",
                            title: "Rows number",
                            default: 200
                        },
                        columnWidth: { //usate in refTree per i BUTGRI
                            type: "integer",
                            title: "Default col width",
                            default: 64
                        },
                        headerHeight: {
                            type: "integer",
                            title: "Header heigth",
                            default: 20
                        },
                        headerWidth: {
                            type: "integer",
                            title: "Header width",
                            default: 32
                        },
                        rowHeight: {
                            type: "integer",
                            title: "Default row heigth",
                            default: 20
                        }
                    }
                },
                sheets: {
                    type: "array",
                    title: "Sheets",
                    uniqueItems: true,
                    options: {
                        collapsed: true
                    },
                    items: items_def
                }
            }
        };
        return schema;
    }

    var rowdata = $(e).closest(".k-grid").data("kendoGrid").dataItem($(e).closest("tr"));
    var targetgrid = $(e).closest(".k-grid").data("kendoGrid");

    var schema = buildSchema(rowdata);
    var defaultrow = { general:{  }, sheets: [] };
    var transfn = function () {
    }
    var savefn = function (e, editor) {
        rowdata.SheetsDefinition = JSON.stringify(editor.getValue());
        rowdata.dirty = true;
        targetgrid.saveChanges();
        $("#wndmodalContainer").modal('toggle');
    }
    var jsoneditor = customizeModal({ title: "Definition of sheets", model: schema, transformation_fn: transfn, save_fn: savefn });
    jsoneditor.done(function (editor) {
        

        //   console.log(rowdata.OnLoadFieldsLayout);
        $("#wndmodalContainer").addClass("modal-wide");
        if (rowdata.SheetsDefinition)
            editor.setValue($.extend(defaultrow, JSON.parse(rowdata.SheetsDefinition)));
    });
    $("#wndmodalContainer").modal('toggle');

}

