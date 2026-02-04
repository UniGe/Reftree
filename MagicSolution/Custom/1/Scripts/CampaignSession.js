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
                data: { storedprocedure: "Crm.GetCampaignsForOperator" },
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
       
    };

    extension.setFilter = function () {
        this.cascadeFired = true;
        this.initialFilter = {
          
                    field: "Campaign_ID", operator: "eq", value: this.campaignDropDown.dataItem(this.campaignDropDown.select()).ID, type: "customFilter"
             
        }
    }

    define([], function () {
        return extension;
    });

})()