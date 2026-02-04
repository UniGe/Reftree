// JavaScript source code
// JavaScript source code
//inside the functions "this" is the controller scope (e.g onChange)
(function () {
    var extension = {};

    extension.cascadeFired = false;
    extension.campaigns = {
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                dataType: "json",
                contentType: "application/json",
                data: { storedprocedure: "Crm.GetCampaignsForOperator_overall" },
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

    extension.users = {
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                dataType: "json",
                contentType: "application/json",
                data: { storedprocedure: "Crm.GetActiveOperators" },
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



    extension.initialFilter = {};

    extension.setFilter = function () {
        this.cascadeFired = true;
        extension.Campaign_ID = eval(this.campaignDropDown.value())
        extension.User_id = eval(this.usersDropDown.value());
        if (extension.User_id && extension.Campaign_ID) {
            this.initialFilter = {
                type: "customFilter", logic: 'and', filters: [{ field: "Campaign_ID", operator: "eq", value: extension.Campaign_ID, type: "customFilter" }
                    , { field: "User_id", operator: "eq", value: extension.User_id, type: "customFilter" }]
            };
        }
    }

    define([], function () {
        return extension;
    });

})()