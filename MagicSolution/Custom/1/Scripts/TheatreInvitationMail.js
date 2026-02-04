
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
                data: { storedprocedure: "HR.usp_GetInvitationYears" },
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
    extension.month = {
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                dataType: "json",
                contentType: "application/json",
                data: { storedprocedure: "HR.usp_GetMonths" },
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
    extension.actGroup = {
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                dataType: "json",
                contentType: "application/json",
                data: { storedprocedure: "HR.usp_GetTheatreActGroups" },
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



    extension.sendInvitation = function () {
        var postcontent = buildGenericPostInsertUpdateParameter("create", "", "ID", "HR.SendTheatreDisponibilityMail", "XML", -1, -1, { Year: this.yearDropDown.dataItem(this.yearDropDown.select()).Year, Month_ID: this.monthsDropDown.dataItem(this.monthsDropDown.select()).ID, T_ActivityGroup_ID: this.actGroupDropDown.dataItem(this.actGroupDropDown.select()).ID }, -1);
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/PostI/",
            data: postcontent,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log("Mail di disponibilità inviate", false);
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    }

    extension.sendCalendar = function () {
        var postcontent = buildGenericPostInsertUpdateParameter("create", "", "ID", "HR.SendTheatreCalendarMail", "XML", -1, -1, { Year: this.yearDropDown.dataItem(this.yearDropDown.select()).Year, Month_ID: this.monthsDropDown.dataItem(this.monthsDropDown.select()).ID, T_ActivityGroup_ID: this.actGroupDropDown.dataItem(this.actGroupDropDown.select()).ID }, -1);
        $.ajax({
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/PostI/",
            data: postcontent,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                kendoConsole.log("Calendari inviati", false);
            },
            error: function (message) {
                kendoConsole.log(message.responseText, true);
            }
        });
    }

    define([], function () {
        return extension;
    });

})()

