function buildWizardSettingsForm(e) {
    doModal(true);
    var grid = $(e.currentTarget).closest(".k-grid").data("kendoGrid"),
        rowData = grid.dataItem($(e.currentTarget).closest("tr"));

    requireConfigAndMore(["Magic_FormFieldsConfig"], function (FormFieldsConfig) {
        FormFieldsConfig.then(function (FormFields) {
            customizeModal({
                title: getObjectText("wizardSettings"),
                transformation_fn: function () {
                },
                save_fn: function (e, editor) {
                    var settings = editor.getValue();
                    $.map(settings.steps || [], function (step, k) {
                        if (step.fields) {
                            $.map(step.fields, function (field, _k) {
                                if (field.FormExtension && typeof field.FormExtension == "string")
                                    settings.steps[k].fields[_k].FormExtension = JSON.parse(field.FormExtension);
                            });
                        }
                    });
                    rowData.Settings = JSON.stringify(settings);
                    rowData.dirty = true;
                    grid.saveChanges();
                    $("#wndmodalContainer").modal('toggle');
                },
                model: {
                    type: "object",
                    format: "grid",
                    properties: {
                        saveStored: {
                            title: "Save stored procedure",
                            type: "string",
                            minLength: 5,
                            options: {
                                grid_columns: 3
                            }
                        },
                        validationCallback: {
                            title: "JS function name to call on validation",
                            type: "string",
                            options: {
                                grid_columns: 3
                            }
                        },
                        additionalNavClass: {
                            title: "Additional html-class for Nav",
                            type: "string",
                            default: "nav-tabs nav-justified",
                            options: {
                                grid_columns: 3
                            }
                        },
                        useKendoStyle: {
                            title: "Use Kendo style",
                            type: "checkbox",
                            options: {
                                grid_columns: 3
                            }
                        },
                        steps: {
                            type: "array",
                            title: getObjectText("wizardSteps"),
                            items: {
                                type: "object",
                                format: "grid",
                                title: getObjectText("step"),
                                options: {
                                    disable_collapse: true
                                },
                                properties: {
                                    title: {
                                        type: "object",
                                        title: getObjectText("title"),
                                        options: {
                                            collapsed: true,
                                            grid_columns: 4
                                        },
                                        properties: {
                                            badge: {
                                                type: "string",
                                                title: "Badge key",
                                            },
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
                                    defaultValues: {
                                        type: "array",
                                        format: "table",
                                        title: "Default values",
                                        uniqueItems: true,
                                        options: {
                                            collapsed: true,
                                            grid_columns: 5
                                        },
                                        items: {
                                            type: "object",
                                            title: "Default value",
                                            properties: {
                                                fromStep: {
                                                    type: "string",
                                                    title: "Copy from step Key"
                                                },
                                                fromFieldName: {
                                                    type: "string",
                                                    title: "Copy from field name"
                                                },
                                                toFieldName: {
                                                    type: "string",
                                                    title: "Field name to insert (in current step)"
                                                }
                                            }
                                        }
                                    },
                                    formColumnsPerRow: {
                                        type: "number",
                                        title: "Columns per row in Form",
                                        default: 2,
                                        options: {
                                            grid_columns: 2
                                        },
                                        enum: [1, 2, 3, 4, 6]
                                    },
                                    stepKey: {
                                        type: "string",
                                        title: "Step Key",
                                        options: {
                                            grid_columns: 1
                                        },
                                        minLength: 3
                                    }
                                },
                                oneOf: [
                                    {
                                        title: "Grid",
                                        type: "object",
                                        properties: {
                                            tableName: {
                                                title: "Grid name",
                                                type: "string",
                                                minLength: 5
                                            }
                                        }
                                    },
                                    {
                                        title: "Stored procedure",
                                        type: "object",
                                        properties: {
                                            storedProcedure: {
                                                title: "Stored procedure",
                                                type: "string",
                                                minLength: 5
                                            }
                                        }
                                    },
                                    {
                                        title: "Custom form",
                                        type: "object",
                                        properties: {
                                            fields: FormFields
                                        }
                                    },
                                    {
                                        title: "Function",
                                        type: "object",
                                        properties: {
                                            functionName: {
                                                title: "Function name",
                                                type: "string",
                                                minLength: 5
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }).done(function (editor) {
                if (rowData.Settings) {
                    var settings = JSON.parse(rowData.Settings);
                    $.map(settings.steps, function (step, k) {
                        if (step.fields) {
                            $.map(step.fields, function (field, _k) {
                                if (field.FormExtension && typeof field.FormExtension != "string")
                                    settings.steps[k].fields[_k].FormExtension = JSON.stringify(field.FormExtension, null, 4);
                            });
                        }
                    });
                    editor.setValue(settings);
                }
                $("#wndmodalContainer").addClass("modal-full").modal('toggle');
                doModal(false);
            });
        })
    });
}
