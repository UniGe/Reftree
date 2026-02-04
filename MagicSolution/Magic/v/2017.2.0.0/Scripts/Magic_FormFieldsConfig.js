define(["MagicSDK"], function (MF) {
    return MF.api.get({
        table: "dbo.Magic_TemplateDataRoles",
        where: "1=1",
        order: "MagicTemplateDataRole"
    })
    .then(function (dataRoles) {
        return {
            type: "array",
            format: "grid",
            title: getObjectText("fields"),
            uniqueItems: true,
            options: {
                collapsed: true
            },
            items: {
                type: "object",
                format: "grid",
                title: getObjectText("field"),
                options: {
                    collapsed: false
                },
                properties: {
                    ColumnName: {
                        type: "string",
                        title: getObjectText("fieldname"),
                        minLength: 3,
                        propertyOrder: 10,
                        options: {
                            grid_columns: 2
                        }
                    },
                    MagicTemplateDataRole: {
                        type: "string",
                        title: getObjectText("columntype"),
                        enum: $.map(dataRoles, function (v, i) { return v.MagicTemplateDataRole; }),
                        propertyOrder: 20,
                        options: {
                            grid_columns: 2
                        }
                    },
                    Schema: {
                        type: "object",
                        title: "Schema",
                        propertyOrder: 30,
                        options: {
                            collapsed: true,
                            grid_columns: 2
                        },
                        properties: {
                            Schema_required: {
                                type: "checkbox",
                                title: getObjectText("required"),
                                default: false,
                                propertyOrder: 10
                            },
                            Schema_defaultvalue: {
                                type: "string",
                                title: "Default value",
                                propertyOrder: 55
                            },
                            Schema_numeric_max: {
                                type: "integer",
                                title: "Num max",
                                propertyOrder: 30
                            },
                            Schema_numeric_min: {
                                type: "integer",
                                title: "Num min",
                                propertyOrder: 40
                            },
                            Schema_numeric_step: {
                                type: "integer",
                                title: "Num step",
                                propertyOrder: 50
                            },
                            Schema_type: {
                                type: "string",
                                title: "Schema type",
                                propertyOrder: 55,
                                enum: ["", "string", "number", "boolean"]
                            },
                            StringLength: {
                                type: "integer",
                                title: "Max Length (string)",
                                propertyOrder: 60,
                                default: 4000
                            },
                            DetailonchangeFunctionName: {
                                type: "string",
                                title: "Function onChange",
                                propertyOrder: 70
                            }
                        }
                    },
                    DataSource: {
                        type: "object",
                        title: "Data source",
                        propertyOrder: 30,
                        options: {
                            collapsed: true,
                            grid_columns: 2
                        },
                        properties: {
                            MagicDataSourceType_ID: {
                                type: "integer",
                                enum: [1, 2],
                                default: 2,
                                propertyOrder: 40,
                                options: {
                                    enum_titles: ["Stored procedure", "View or Table"],
                                }
                            },
                            MagicDataSource: {
                                type: "string",
                                title: "FK / DetailGridSP data source",
                                propertyOrder: 50,
                            },
                            MagicDataSourceValueField: {
                                type: "string",
                                title: "Fk data source Key field",
                                propertyOrder: 55,
                            },
                            MagicDataSourceTextField: {
                                type: "string",
                                title: "Fk data source Text field",
                                propertyOrder: 60,
                            }
                        }
                    },
                    Cascade: {
                        type: "object",
                        title: "Cascade",
                        propertyOrder: 45,
                        options: {
                            collapsed: true,
                            grid_columns: 2
                        },
                        properties: {
                            CascadeColumnName: {
                                type: "string",
                                title: "Cascade column",
                                propertyOrder: 70,
                            },
                            CascadeFilterColumnName: {
                                type: "string",
                                title: "Column to filter on cascade",
                                propertyOrder: 80,
                            }
                        }
                    },
                    searchGrid: {
                        type: "object",
                        title: "SearchGrid / DetailGrid",
                        propertyOrder: 90,
                        options: {
                            collapsed: true,
                            grid_columns: 2
                        },
                        properties: {
                            SearchGridName: {
                                title: getObjectText("searchGridMagicGridName") +  ' / DetailGrid',
                                type: "string",
                                propertyOrder: 10,
                            },
                            SearchGridDescColName: {
                                title: getObjectText("searchGridLabelColumn"),
                                type: "string",
                                propertyOrder: 20,
                            }
                        }
                    },
                    labels: {
                        type: "object",
                        title: getObjectText("labels"),
                        propertyOrder: 100,
                        options: {
                            collapsed: true,
                            grid_columns: 2
                        },
                        properties: {
                            it: {
                                type: "string",
                                title: "Italiano",
                            },
                            en: {
                                type: "string",
                                title: "English",
                            },
                            de: {
                                type: "string",
                                title: "Deutsch",
                            }
                        }
                    },
                    Upload_SavePath: {
                        type: "string",
                        propertyOrder: 110,
                        title: "File upload save path",
                        options: {
                            grid_columns: 2
                        }
                    },
                    FormExtension: {
                        title: 'JSON with form and schema properties to extend ',
                        type: "string",
                        format: "json",
                        options: {
                            grid_columns: 8
                        }
                    }
                }
            }
        };
    });
});