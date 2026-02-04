function buildMagicPivotLayout(e)
{

    function buildSchema(row) {

        var items_def = {
            type: "object",
            format: "grid",
            title: "field definition",
            properties: {
                area: {
                    type: "string",
                    enum: ["column", "row", "data", "filter", ""],
                    options: {
                        grid_columns: 2
                    }
                },
                dataField: {
                    type: "string",
                    options: {
                        grid_columns: 2
                    }
                },
                caption: {
                    type: "string",
                    options: {
                        grid_columns: 2
                    }
                },
                dataType: {
                    type: "string",
                    enum: ["number", "string", "date"],
                    options: {
                        grid_columns: 2
                    },
                    default :"string"
                },
                format: {
                    type: "string",
                    enum: ['','currency', 'fixedPoint', 'percent', 'decimal', 'exponential', 'largeNumber', 'thousands', 'millions', 'billions', 'trillions', 'longDate', 'longTime', 'monthAndDay', 'monthAndYear', 'quarterAndYear', 'shortDate', 'shortTime', 'millisecond', 'day', 'month', 'quarter', 'year'],
                    options: {
                        grid_columns: 1
                    },
                    default:"none"
                },
                summaryType: {
                    type: "string",
                    enum: ['','sum', 'min', 'max', 'avg', 'count'],
                    options: {
                        grid_columns: 1
                    },
                    default: "none"
                },
                extension: {
                    type: "string",
                    title: "Extension",
                    default:"",
                    options: {
                        grid_columns: 2
                    }
                },
            }
        };

        var schema = {
            title: row.Code,
            type: "object",
            properties: {
                general: {
                    type: "object",
                    title: "General settings",
                    options: {
                        collapsed:true
                    },
                    properties: {
                        allowExpandAll: {
                            type: "checkbox",
                            title: "allow Expand All",
                            default: true
                        },
                        allowFiltering: {
                            type: "checkbox",
                            title: "allow Filtering",
                            default: true
                        },
                        allowSorting: { //usate in refTree per i BUTGRI
                            type: "checkbox",
                            title: "allow Sorting",
                            default: true
                        },
                        allowSortingBySummary: {
                            type: "checkbox",
                            title: "allow Sorting By Summary",
                            default: true
                        },
                        extension: {
                            type: "string",
                            title: "Extension",
                            format: "textarea"
                        },
                        retrieveFields: {
                            type: "checkbox",
                            title: "Retrieve fields from datasource (if not specified)",
                            default: false
                        },
                    }
                },
                fields: {
                    type: "array",
                    title: "Fields",
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
    var defaultrow = { measures: [], rows: [], columns: []};
    var transfn = function () {
    }
    var savefn = function (e, editor) {
        rowdata.OnLoadFieldsLayout = JSON.stringify(editor.getValue());
        rowdata.dirty = true;
        targetgrid.saveChanges();
        $("#wndmodalContainer").modal('toggle');
    }
    var jsoneditor = customizeModal({ title: "Definition of the pivot's layout", model: schema, transformation_fn: transfn, save_fn: savefn });
    jsoneditor.done(function (editor) {
        //   console.log(rowdata.OnLoadFieldsLayout);
        $("#wndmodalContainer").addClass("modal-wide");
        
        var onloadfiledsLayout = JSON.parse(rowdata.OnLoadFieldsLayout);
        $.each(onloadfiledsLayout.fields, function (i, v) {
            if (!v.extension)
                v.extension = "";
        });

        if (rowdata.OnLoadFieldsLayout)
            editor.setValue($.extend(defaultrow, onloadfiledsLayout));
    });
    $("#wndmodalContainer").modal('toggle');

}

function buildMagicPivotDataSource(e)
{
//{ store:{ type: 'xmla',
//    url: "https://demos.devexpress.com/Services/OLAP/msmdpump.dll",
//    catalog: "Adventure Works DW Standard Edition",
//    cube: "Adventure Works"}}
    function buildSchema(row)
    {
        var schema = {
            title: row.Code,
            type: "object",
            properties: {
                store: {
                    type: "object",
                    title: "Store",
                    options: {
                        collapsed: false
                    },
                    properties: {
                        type: {
                            type: "string",
                            title: "Type",
                            default: "xmla"
                        },
                        url: {
                            type: "string",
                            title: "Analysis Service url (e.g: 'https://service.com/Services/OLAP/msmdpump.dll')"
                        },
                        catalog: { //usate in refTree per i BUTGRI
                            type: "string",
                            title: "Catalog"
                        },
                        cube: {
                            type: "string",
                            title: "Cube"
                        }
                    }
                }
            }
        };
        return schema;
    }

    var rowdata = $(e).closest(".k-grid").data("kendoGrid").dataItem($(e).closest("tr"));
    var targetgrid = $(e).closest(".k-grid").data("kendoGrid");
    var schema = buildSchema(rowdata);
    var defaultrow = { store: { type:"",url:"",catalog:"",cube:""  } };
    var transfn = function () {
    }
    var savefn = function (e, editor) {
        rowdata.OLAPDataSource = JSON.stringify(editor.getValue());
        rowdata.dirty = true;
        targetgrid.saveChanges();
        $("#wndmodalContainer").modal('toggle');
    }
    var jsoneditor = customizeModal({ title: "Optional definition of the pivot's data source", model: schema, transformation_fn: transfn, save_fn: savefn });
    jsoneditor.done(function (editor) {
        //   console.log(rowdata.OnLoadFieldsLayout);
        $("#wndmodalContainer").addClass("modal-wide");
        if (rowdata.OLAPDataSource)
            editor.setValue($.extend(defaultrow, JSON.parse(rowdata.OLAPDataSource)));
    });
    $("#wndmodalContainer").modal('toggle');
}