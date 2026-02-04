//inside the functions "this" is the controller scope (e.g onChange)
(function () {

    var extension = {};
    extension.bikeCubeSignalsds = {
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                dataType: "json",
                contentType: "application/json",
                data: { storedprocedure: "BIKECUBE.usp_GetCubeSignalListForMonitor" },
                type: "POST"
            },
            parameterMap: function (options, operation) {
                return kendo.stringify(options);
            }
        },
        schema: {
            parse: function (data) {
                return data[0].drows.length ? data[0].drows[0].Table : [];
            }
        }
    };
 
    extension.initialFilter = {
        field: "Signal_ID", operator: "neq", value: 0, type: "customFilter"
    };

    extension.setFilter = function () {
        if (this.signalsDropDown.dataItem(this.signalsDropDown.select()).ID == -1) //wildcard * show all
            this.initialFilter = {
                field: "Signal_ID", operator: "neq", value: 0, type: "customFilter"
            }
        else
            this.initialFilter = {
                field: "Signal_ID", operator: "eq", value: this.signalsDropDown.dataItem(this.signalsDropDown.select()).ID, type: "customFilter"
            }
    }
 
    define([], function () {
        return extension;
    });

})()