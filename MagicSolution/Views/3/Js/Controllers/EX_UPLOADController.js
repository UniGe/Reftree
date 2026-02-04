define(["angular", "angular-filter", "angular-magic-form"], function (angular) {
   return  angular
        .module("EX_UPLOAD", ["angular.filter", "magicForm"])
        .controller("EX_UPLOADController",
            [    'config',
                '$http',
				'$scope',
				'$timeout',
                function (config,$http, $scope,$timeout) {
                    var self = this;
                    self.appareData = [];
                    self.ImportData = {};
                    self.lastUpdate = null;
				
					self.config = config;
					//When called from FunctionSubMenu
					if (config && config.appAreaId)
						self.ImportData.appareData = config.appAreaId;
					if (config && config.classId) 
						self.ImportData.exclassData = config.classId;
					if (config && config.modelId)
						self.ImportData.exmodData = config.modelId;

		            self.lang = {
                        appare: getObjectText("appare"),
                        exclass: getObjectText("exclass"),
                        exmodel: getObjectText("exmodel"),
                        eximport: getObjectText("eximport"),
                        simulation: getObjectText("simulation"),
                        excInputs: getObjectText("excInputs"),
                        uploadErrorMsg: getObjectText('vErequired').format('File excel')
                    };

                    self.init = function () {
                        $http
                            .get(   //#mfapireplaced
                                "/api/MF_API/GetEX_V_MODEXC_User"
                            )
                            .then(
							function (res) {
								      if (res.data.Count > 0) {
										  self.appareData = res.data.Data[0].Table;
										  self.appAreasHash = {};
										  self.appAreasArray = $.map(self.appareData, function (v, i) {
											  if (!self.appAreasHash[v.US_APPARE_ID]) {
												  self.appAreasHash[v.US_APPARE_ID] = true;
												  return { "US_APPARE_ID": v.US_APPARE_ID, "US_APPARE_DESCRIPTION": v.US_APPARE_DESCRIPTION };
											  }
											  else
												  return null;
										  });

										  self.classesHash = {};
										  self.classesArray = $.map(self.appareData, function (v, i) {
											  if (!self.classesHash[v.EX_CLAEXC_ID]) {
												  self.classesHash[v.EX_CLAEXC_ID] = true;
												  return { "US_APPARE_ID": v.US_APPARE_ID, "EX_CLAEXC_ID": v.EX_CLAEXC_ID, "EX_CLAEXC_DESCRIPTION": v.EX_CLAEXC_DESCRIPTION };
											  }
											  else {
												  return null;
											  }

										  });
										  

										if (!config || !config.appAreaId)
											self.ImportData.appareData = res.data.Data[0].Table[0].US_APPARE_ID;
						             }
                                },
                                function (res) {
                                    console.log("error on retrieving appare,claexc,modexc data");
                                }
                            );
                        
                    };

                    self.initUpload = function () {
                        var $container = $('#appcontainer');
                        initKendoUploadField($('input#excelupload'), {
                            multiple: false,
                            success: function (e) {
                                if (e.operation == "upload")
                                    self.uploadError = false;
                                else
                                    self.uploadError = true;
                                $scope.$apply();
								uploadSuccess(e, $container);
                            }
                        });
                    }
                    self.importExcel = async function (form) {
                        $scope.$broadcast('schemaFormValidate');
                        var file = $('input#excelupload').data("kendoUpload").options.files; //nome del file uploadato su Root 
                        if (!file.length) {
                            self.uploadError = true;
                            return
                        } else
                            self.uploadError = false;
                        if (form.$valid) {

                            doModal(true);

                            var gridOptions = getDefaultGridSettings();
                            gridOptions.height = 400;
                            gridOptions.toolbar = [{
                                template: buildToolbarButtons("PdfExport", "k-button-icontext k-grid-pdf", "PdfExport", "(function(){})", "none", "<span class=\'k-icon k-i-pdf\'></span>")
                            }, {
                                name: "excel",
                                text: getObjectText("XlsExport")
                            }];
                            await manageGridUploadedFiles($('#appcontainer'));
                            var data = {
                                file: file.length ? JSON.stringify(file) : null,
                                exctractModelId: self.ImportData.exmodData,
                                //  simulation: self.ImportData.simulation
							}
							$.extend(data, self.ImportData);
							//https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/145
							$.each(data, function (k, val) {
								if (typeof val == 'string' &&
									val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
									data[k] = toTimeZoneLessString(new Date(val));
								
							}); 
                            $.ajax({
                                url: "/api/ExeclUpload/ProcessExcel", type: "POST", data: JSON.stringify(data),
                                success: function (e) {
                                    doModal(false);
                                    $("#gridcontainer .k-grid").each(function (i, v) {
                                        $(v).data("kendoGrid").destroy();
                                    });
                                    $("#gridcontainer").empty();

                                    $(e).each(function (i, v) {
                                        var title = "";
                                        var columnshash = {};
                                        var columns = [];
                                        if (!v || !v.drows || !v.drows.length || !v.drows[0].Table) {
                                            console.log(i);
                                            console.log(v);
                                            return; //skip iteration
                                        }
                                        var ds = v.drows[0].Table;

                                        //success message handling
                                        if (ds.length > 0 && ds[0].Magic_SuccessMsg){
                                        	  kendoConsole.log(ds[0].Magic_SuccessMsg, false);
                                        }

                                        if (ds.length > 0 && !ds[0].Magic_SuccessMsg) {
                                            var title = $.trim(ds[0].GridTitle);
                                            var ds2 = ds.map(function (val) {
                                                delete val.GridTitle;
                                                var newobj = {};
                                                $.each(val, function (field, value) {
                                                    newobj[field.replace(/ |#/g, '_')] = value;
                                                    columnshash[field.replace(/ |#/g, '_')] = true;
                                                });
                                                return newobj;
                                            });
                                            $.each(columnshash, function (key, value) {
                                                columns.push({
                                                    field: key,
                                                    width: "110px"
                                                });
                                            });
                                            gridOptions.dataSource = { data: ds2 };
                                            if (columns.length > 10)
                                                gridOptions.columns = columns;
                                            $("#gridcontainer").append("<h3>" + title + "</h3>");
                                            $("#gridcontainer").append("<div class='kendogrid'/>");
                                            $("#gridcontainer div.kendogrid:last").kendoGrid(gridOptions);
                                        }

                                    });
                                },
                                error: function (err) {
                                    doModal(false);
                                    if (err && err.responseText)
                                        kendoConsole.log(err.responseText, true);
                                },
                                dataType: "json",
                                contentType: "application/json; charset=utf-8"
                            });
                        }
                        
                    };
                    self.init();
                   
                }
            ]
        )
});