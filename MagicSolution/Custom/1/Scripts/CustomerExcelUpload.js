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
                        if (importreport)
                        {
                            $("div#Importlog").append('<a href="#"  class="list-group-item list-group-item-action">{1}: {0}</a>'.format(importreport.ImportedPersons, getObjectText("ImportedPersons")));
                            $("div#Importlog").append('<a href="#"  class="list-group-item list-group-item-action">{1}: {0}</a>'.format(importreport.ImportedCalls, getObjectText("ImportedCalls")));
                            $("div#Importlog").append('<a href="#"  class="list-group-item list-group-item-action">{1}: {0}</a>'.format(importreport.ImportedContacts, getObjectText("ImportedContacts")));
                            $("div#Importlog").append('<a href="#"  style="background-color:yellow" class="list-group-item list-group-item-action"></a>'.format(importreport.ImportedContacts, getObjectText("ImportedContacts")));

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