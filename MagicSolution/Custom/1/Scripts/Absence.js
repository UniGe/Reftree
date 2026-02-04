// JavaScript source code
// JavaScript source code
//inside the functions "this" is the controller scope (e.g onChange)
(function () {
    var extension = {};

    extension.cascadeFired = false;
    extension.years = {
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                dataType: "json",
                contentType: "application/json",
                data: { storedprocedure: "HR.usp_GetAbsenceYears" },
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
    extension.DateF = function () {
        var date = new Date();
        var FirstDayOfTheYear = new Date(date.getFullYear(), 0, 1);
        return FirstDayOfTheYear;
    };

    extension.mDateFrom = extension.DateF()

    extension.initialFilter = {
        type: "customFilter", logic: 'or', filters: [{ field: "FromDate", operator: "gte", value: extension.mDateFrom, type: "customFilter" }
            , { field: "FreeHoursDate", operator: "gte", value: extension.mDateFrom, type: "customFilter" }]
    };

    extension.setFilter = function () {
        this.cascadeFired = true;
        this.initialFilter = {
            type: "customFilter", logic: 'or', filters:
            [{

                type: "customFilter", logic: 'and', filters: [{ field: "FromDate", operator: "gte", value: new Date(this.yearDropDown.dataItem(this.yearDropDown.select()).FromDate, 0, 1), type: "customFilter" }
                    , { field: "FromDate", operator: "lte", value: new Date(this.yearDropDown.dataItem(this.yearDropDown.select()).FromDate + 1, 0, 1), type: "customFilter" }]
            },
            {
                type: "customFilter", logic: 'and', filters: [{ field: "FreeHoursDate", operator: "gte", value: new Date(this.yearDropDown.dataItem(this.yearDropDown.select()).FromDate, 0, 1), type: "customFilter" }
                    , { field: "FreeHoursDate", operator: "lte", value: new Date(this.yearDropDown.dataItem(this.yearDropDown.select()).FromDate + 1, 0, 1), type: "customFilter" }]
            }]
        }
    }

    define([], function () {
        return extension;
    });

})()