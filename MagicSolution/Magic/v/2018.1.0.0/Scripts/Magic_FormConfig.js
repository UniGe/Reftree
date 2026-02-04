function buildForm(e,metadataColumnToFill) {
 
    var grid = $(e).closest(".k-grid").data("kendoGrid"),
        rowData = grid.dataItem($(e).closest("tr"));
       
    requireConfigAndMore(["Magic_FormFieldsConfig"], function (FormFieldsConfig) {
        FormFieldsConfig.then(function (columnsSchema) {
            var schema = {
                type: "array",
                title: "Tabs",
                uniqueItems: true,
                items: {
                    type: "object",
                    format: "grid",
                    title: "Tab",
                    properties: {
                        MagicTemplateGroupLabel: {
                            type: "string",
                            title: "Name",
                            minLength: 3,
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
                                    title: "Italiano"
                                },
                                en: {
                                    type: "string",
                                    title: "English"
                                },
                                de: {
                                    type: "string",
                                    title: "Deutsch"
                                }
                            }
                        },
                        columns: columnsSchema

                    }
                }
            };
            var transfn = function () {
            }
            var savefn = function (e, editor) {
                var isvalid = true;
                $.each(editor.validation_results, function (i, v) {
                    isvalid = false;
                    return;
                });
                var editorvalue = editor.getValue();
                $.each(editorvalue.columns, function (i, v) {
                    if (!v.labels[window.culture.substring(0, 2)])
                        v.labels[window.culture.substring(0, 2)] = v.Column_name;
                    v.Column_name = v.Column_name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').replace(/\s+/g, '').replace(/^[0-9]/g, '');
                    v.Order = i;
                });
                var extension = JSON.stringify(editorvalue);
                rowData[metadataColumnToFill] = extension;
                rowData.dirty = true;
                grid.saveChanges();
                $("#wndmodalContainer").modal('toggle');
            }
            //if a managed language is missing i default it to italian which is supposed to be present
            function sanitizeLabels(obj)
            {
                $.each(obj, function (i, v) {
                    if (v.labels["it"])
                    {
                        if (!v.labels["en"])
                            v.labels["en"] = v.labels["it"];
                        if (!v.labels["de"])
                            v.labels["de"] = v.labels["it"];
                    }
                });
                return obj;
            }
            var jsoneditor = customizeModal({ title: getObjectText("definecolumns"), model: schema, transformation_fn: transfn, save_fn: savefn });
            jsoneditor.done(function (editor) {
                $("#wndmodalContainer").addClass("modal-full");
                if (rowData[metadataColumnToFill])
                    editor.setValue(sanitizeLabels(JSON.parse(rowData[metadataColumnToFill])));
                    //__adjustCss__();
            });
            
            
            $("#wndmodalContainer").modal('toggle');

        }, function (res) {
            console.log("Error while loading columns");
        });
    });
}
//function __adjustCss__()
//{ 
//    $("div[data-schemaid=root] h3:first").hide();
//    $("div[data-schemaid=root]").append("<style scoped>\
//        div.well.well-sm h3 { margin-top:0px;margin-bottom:0px;   }\
//        div.well.well-sm table td { padding:3px;}\
//        #contentofmodal button.json-editor-btn-delete:last-child { display:none; }\
//        </style>");
//}
