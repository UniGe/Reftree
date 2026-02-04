(function () {
    var extension = {};
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
                url: "/api/Upload/ProcessExcel", type: "POST", data: JSON.stringify(data),
                success: function (e) {
                    kendoConsole.log(getObjectText("FileUploadOK"), false);
                    doModal(false);
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