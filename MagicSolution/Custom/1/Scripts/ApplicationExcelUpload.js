(function () {
    var extension = {};
    //extension.curreDateTime = new Date().toString();
    //extension.refreshDateTime = function (e) {
    //    var self = this; //controller scope
    //    self.curreDateTime = new Date().toString();
    //}

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
                file: file.length ? JSON.stringify(file) : null
            }
            $.each(self.ImportData, function (k, v) {
                if (v instanceof Date) {
                    self.ImportData[k] = toTimeZoneLessString(v);
                }
            });
            $.extend(data, self.ImportData);
            doModal(true);
            $.ajax({
                url: "/api/CustomerUpload/ProcessExcel", type: "POST", data: JSON.stringify(data),
                success: function (e) {
                    doModal(false);

                    var importreport = "";
                    if (e && e.length && e[0].drows.length && e[0].drows[0].Table.length)
                        importreport = e[0].drows[0].Table[0];
					if (importreport) {
						if (!importreport.ImportGoneWrong || importreport.ImportGoneWrong == null || importreport.ImportGoneWrong == 0) {
							$("div#Importlog").append('<a href="#"  class="list-group-item list-group-item-action">Importati: {0}</a>'.format(importreport.ImportedCandidatures));
							$("div#Importlog").append('<a href="#"  class="list-group-item list-group-item-action">Candidati già presenti: {0}</a>'.format(importreport.CandidateAlreadyPresentCount));
						} else {
							$("div#Importlog").append('<a href="#"  style="background-color:red" class="list-group-item list-group-item-action">Import fallito</a>');
						}
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