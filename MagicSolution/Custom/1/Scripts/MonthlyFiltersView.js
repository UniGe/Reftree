(function () {
    var extension = {};

	//extension.functionGuid = getCurrentFunctionGUIDFromMenu();
	extension.gridName = function_grid[getCurrentFunctionGUIDFromMenu()];



	extension.month = {
		transport: {
			read: {
				url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
				dataType: "json",
				contentType: "application/json",
				data: { storedprocedure: "Zenit.usp_getMonths" },
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


	
	extension.years = [];
	for (var i = 0; i < 30; i++) {
		extension.years.push({ year: 2016 + i });
	}

	var d = new Date();
	d.setMonth(d.getMonth() - 1);

	extension.currentYear = d.getFullYear();
	extension.currentMonth = (d.getMonth() + 1);

	extension.yearsDS = {
		transport: {
			read: extension.years
			
		},
		schema: {
			parse: function (data) {
				return extension.years ;
			}
		}
	};


	extension.initialFilter = {
		type: "customFilter", logic: 'and', filters: [{ field: "Month", operator: "eq", value: extension.currentMonth, type: "customFilter" }
			, { field: "Year", operator: "eq", value: extension.currentYear, type: "customFilter" }]
	};

	extension.onChange = function () {
		this.initialFilter = {
			type: "customFilter", logic: 'and', filters: [{ field: "Month", operator: "eq", value: this.monthDropDown.value(), type: "customFilter" }
				, { field: "Year", operator: "eq", value: this.yearsDrop.value(), type: "customFilter" }]
		};
	}

    define([], function () {
        return extension;
    });

})()