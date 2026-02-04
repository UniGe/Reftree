//inside the functions "this" is the controller scope (e.g onChange)
(function () {

    var extension = {};
    extension.cascadeFired = false;
    extension.bikeCubeds = {
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                dataType: "json",
                contentType: "application/json",
                data: { storedprocedure: "BIKECUBE.usp_GetCubeListForMonitor" },
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
    extension.refreshGrids = function () {
        function refresh(gridDataSources)
        {
            $.each(gridDataSources, function (i, v) {
                v.read();
            });
        }
        //if i'm refreshing i stop
        if (this.Interval_ID) {
            kendoConsole.log("Auto-refresh  OFF!", false);
            this.refreshActive = false;
            clearInterval(this.Interval_ID);
            this.Interval_ID = null;
            return;
        }
        else //start refreshing grids every 30 seconds
        {
            var gridDataSources = [this.kendoGridInstanceCube.dataSource, this.kendoGridInstanceBoxes.dataSource];
            this.refreshActive = true;
            kendoConsole.log("Auto-refresh ON!", false);
            refresh(gridDataSources);
            this.Interval_ID = setInterval(function () {
                refresh(gridDataSources);
            }, 10000);
        }
    }
    extension.initialFilter = {
        field: "ID", operator: "eq", value: 0, type: "customFilter"
    };

    extension.setFilter = function () {
        this.cascadeFired = true;
        this.initialFilter = {
            field: "ID", operator: "eq", value: this.cubesDropDown.dataItem(this.cubesDropDown.select()).ID, type: "customFilter"
        }
    }
 
    define([], function () {
        return extension;
    });

})()