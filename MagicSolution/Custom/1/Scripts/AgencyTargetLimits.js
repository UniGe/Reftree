(function () {
    var extension = {};
    //extension.curreDateTime = new Date().toString();
    //extension.refreshDateTime = function (e) {
    //    var self = this; //controller scope
    //    self.curreDateTime = new Date().toString();
    //}



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



	extension.currentYear = (new Date()).getFullYear();
	extension.currentMonth = ((new Date()).getMonth()+1);
	extension.years = [];
	for (var i = 0; i < 30; i++) {
		extension.years.push({ year: 2016 + i });
	}

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


    extension.ImportData = {};
    extension.lastUpdate = null;
    extension.logs = [];
    extension.lang = {
        eximport: getObjectText("eximport"),
        excInputs: getObjectText("excInputs"),
        uploadErrorMsg: getObjectText('vErequired').format('File excel')
	}; 
    extension.initUpload = function () {
        var self = this;
        var $container = $('#appcontainer');
        initKendoUploadField($('input#excelupload'), {
            multiple: false,
            success: function (e) {
                if (e.operation == "upload")
                    self.uploadError = false;
                else
                    self.uploadError = true;
                //$scope.$apply();
                uploadSuccess(e, $container)
            }
        });
    }
    extension.importExcel = function () {
        var self = this;
        var file = $('input#excelupload').data("kendoUpload").options.files; //nome del file uploadato su Root 
        if (!file.length) {
            self.uploadError = true;
            return
        } else
            self.uploadError = false;

        manageGridUploadedFiles($('#appcontainer')).done(function () {
            var data = {
				file: file.length ? JSON.stringify(file) : null,
				ImportSetting_ID: 12,
				month: self.monthDropDown.value(),
				year: self.yearsDrop.value()

			}
			

            doModal(true);
            $.ajax({
                url: "/api/CustomerUpload/ProcessExcel", type: "POST", data: JSON.stringify(data),
                success: function (e) {
                    doModal(false);

                    var importreport = "";
                    if (e && e.length && e[0].drows.length && e[0].drows[0].Table.length)
                        importreport = e[0].drows[0].Table[0];
					if (importreport) {
						var sr = "";
						if (importreport.hasOwnProperty('ImportedRows')) {
							sr = sr + '<li class="list-group-item">{1}: {0}</li>'.format(importreport.ImportedRows, getObjectText("ImportedRows"));
						} else {
							$.each(importreport, function (fieldName, fieldValue) {
								if (fieldValue && fieldValue !="") {
									sr = sr + '<li class="list-group-item">{1}: {0}</li>'.format(fieldValue, getObjectText(fieldName));
								}
							});
						}
						$("div#Importlog").append('<div class="panel panel-primary"><div class="panel-heading">Risultati importazione</div><ul class="list-group">{0}</ul></div>'.format(sr));

                    }
                },
                error: function (error) {
                    kendoConsole.log(error, true);
                    doModal(false)
                },
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            });
        });

    }

    define([], function () {
        return extension;
    });

})()