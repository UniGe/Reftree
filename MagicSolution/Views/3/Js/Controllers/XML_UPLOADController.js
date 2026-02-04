define(["angular", "MagicSDK", "angular-filter", "angular-magic-form"], function (angular, MF) {
    angular
        .module("XML_UPLOAD", ["angular.filter", "magicForm"])
        .controller("XML_UPLOADController",
            [
                '$http',
                '$sce',
                '$scope',
                '$timeout',
                function ($http, $sce, $scope, $timeout) {
                    var self = this;
                    self.ImportData = {};
                    self.lastUpdate = null;
                    self.xmlmodData = [];
                    self.lang = {
                        appare: getObjectText("appare"),
                        modxml: getObjectText("exmodel"),
                        uploadErrorMsg: getObjectText('vErequired').format('File xml'),
                        xmlimport: getObjectText("xmlimport"),
                        simulation: getObjectText("simulation")
                    };

                    self.init = function () {
                        MF.kendo.getStoredProcedureDataSource("core.XM_SP_READ_MODXML_L", {
                            data: {},
                            success: function (e) {
                                self.appareData = $.map(e.items, function (v) { return v;});
                                self.ImportData.appareData = self.appareData[0].XM_XMLMOD_US_APPARE_ID;
                                $timeout();
                            }
                        }).read();
                        
                    };

                    self.initUpload = function () {
                        var $container = $('#appcontainer');
                        initKendoUploadField($('input#xmlupload'), {
                            multiple: true,
                            success: function (e) {
                                if (e.operation == "upload")
                                    self.uploadError = false;
                                else
                                    self.uploadError = true;
                                $scope.$apply();
                                uploadSuccess(e, $container)
                            }
                        });
                    }
                    self.importXML = function (form) {
                        $scope.$broadcast('schemaFormValidate');
                        var file = $('input#xmlupload').data("kendoUpload").options.files; //nome del file uploadato su Root 
                        if (!file.length) {
                            self.uploadError = true;
                            return
                        } else
                            self.uploadError = false;
                        if (form.$valid) {
                            var gridOptions = getDefaultGridSettings();
                            gridOptions.height = 400;
                            gridOptions.toolbar = [{
                                template: buildToolbarButtons("PdfExport", "k-button-icontext k-grid-pdf", "PdfExport", "(function(){})", "none", "<span class=\'k-icon k-i-pdf\'></span>")
                            }, {
                                name: "excel",
                                text: getObjectText("XlsExport")
                            }];
                            manageGridUploadedFiles($('#appcontainer')).done(function () {
                                var data = {
                                    file: file.length ? JSON.stringify(file) : null,
                                    exctractModelId: self.ImportData.modxml_id
                                }
                                $.extend(data, self.ImportData);

                                doModal(true);
                                $.ajax({
                                    url: "/api/XmlUpload/ProcessXml", type: "POST", data: JSON.stringify(data),
                                    success: function (e) {
                                        doModal(false);
                                        $("#gridcontainer .k-grid").each(function (i, v) {
                                            $(v).data("kendoGrid").destroy();
                                        });
                                        $("#gridcontainer").empty();

                                        $(e).each(function (i, v) {
                                            var title = "";
                                            var ds = v.drows[0].Table;
                                            if (ds.length > 0) {
                                                var title = $.trim(ds[0].GridTitle);
                                                if (title && title.toLowerCase() == "filetomove")
                                                {
                                                    var paths = ds.map(function (val) {
                                                        var newobj = { };
                                                        $.each(val, function (field, value) {
                                                            newobj[field.toLowerCase()] = value;
                                                        })
                                                        return newobj;
                                                    });
                                                    $.ajax({
                                                        type: "POST",
                                                        url: "/api/Documentale/MoveFilesToPath",
                                                        data: JSON.stringify({ files: paths, extension: ".pdf" }),
                                                        success: function (res) {
                                                            console.log(res);
                                                        },
                                                        error: function (err) {
                                                            console.log(err);
                                                        },
                                                        dataType: "json",
                                                        contentType:"application/json; charset=utf-8"
                                                    });
                                                }
                                                var ds2 = ds.map(function (val) {
                                                    delete val.GridTitle;
                                                    var newobj = {};
                                                    $.each(val, function (field, value) {
                                                        var replaced = field;
                                                        if (replaced.indexOf(" ") != -1)
                                                            var replaced = replaced.replace(/ /g, '_');
                                                        newobj[replaced] = value;
                                                    })
                                                    return newobj;
                                                });
                                                gridOptions.dataSource = { data: ds2 };
                                                $("#gridcontainer").append("<h3>" + title + "</h3>");
                                                $("#gridcontainer").append("<div class='kendogrid'/>");
                                                $("#gridcontainer div.kendogrid:last").kendoGrid(gridOptions);
                                            }

                                        });
                                    },
                                    error: function (err) {
                                        kendoConsole.log(err, true);
                                        doModal(false)
                                    },
                                    dataType: "json",
                                    contentType: "application/json; charset=utf-8"
                                });
                            });
                        }
                        
                    };
                    self.init();
                   
                }
            ]
        )
});