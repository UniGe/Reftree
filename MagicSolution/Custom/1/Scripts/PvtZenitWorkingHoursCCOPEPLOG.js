// JavaScript source code
//inside the functions "this" is the controller scope (e.g onChange)
(function () {
    var extension = {};


    extension.dateFrom = function () {
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        firstDay.setHours(0);
        firstDay.setMinutes(0);
        firstDay.setSeconds(0);
        return firstDay;
    };
    extension.dateTo = function () {
        var date = new Date();
        var lastDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        lastDay.setHours(0);
        lastDay.setMinutes(0);
        lastDay.setSeconds(0);
        return lastDay;
    };
	extension.provider = {
		transport: {
			read: {
				url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
				dataType: "json",
				contentType: "application/json",
				data: { storedprocedure: "Zenit.usp_getSelectableProvidersOnDashboard" },
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
	extension.campaign = {
		transport: {
			read: {
				url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
				dataType: "json",
				contentType: "application/json",
				data: { storedprocedure: "Zenit.usp_getSelectableCampaignsOnDashboard" },
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

	extension.offerType = {
		transport: {
			read: {
				url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
				dataType: "json",
				contentType: "application/json",
				data: { storedprocedure: "Zenit.usp_getSelectableOfferTypeOnDashboard" },
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

 
    extension.mDateFrom = extension.dateFrom();
    extension.mDateTo = extension.dateTo();
 
	extension.initialFilter = {
        type: "customFilter", logic: 'and', filters: [ { field: "DateFrom", operator: "neq", value: extension.mDateFrom, type: "customFilter" }
                                    , { field: "DateTo", operator: "neq", value: extension.mDateTo, type: "customFilter" }]
    };



	extension.onChange = function () {
		if (this.mDateFrom && this.mDateTo && this.providerDropDown.value() && this.providerDropDown.value() != null && this.campaignDropDown.value() && this.campaignDropDown.value()!=null && this.offerTypeDropDown.value() && this.offerTypeDropDown.value()!=null)
		this.initialFilter = {
			type: "customFilter", logic: "and", filters: [
				{ field: "DateFrom", operator: "neq", value: this.mDateFrom, type: "customFilter" }, 
				{ field: "DateTo", operator: "neq", value: this.mDateTo, type: "customFilter" },
				{ field: "Provider_ID", operator: "neq", value: this.providerDropDown.value(), type: "customFilter"},
				{ field: "Campaign_ID", operator: "neq", value: this.campaignDropDown.value(), type: "customFilter" },
				{ field: "T_PhoneLineOfferType_ID", operator: "neq", value: this.offerTypeDropDown.value(), type: "customFilter" }
				]
		};
	}
   
    define([], function () {
        return extension;
    });

})()