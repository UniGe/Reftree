define(["angular", "angular-filter", "angular-magic-form", "angular-magic-form-sp"], function (angular) {
    return angular
           .module("MultiSelectForm", ["angular.filter", "magicForm","magicFormSp"])
           .controller("MultiSelectFormController",
               ['config',
                   '$http',
                   '$scope',
                   '$timeout',
                   '$element',
                   function (config, $http, $scope, $timeout, $element) {
                       var self = this;
                       self.MF = config.MF;
                       self.formData = {};
                       self.options = {
                           where: function (defaultwhere) {
                               //if the form is for massive update i restrict visible fields to the updatable ones
                               if (config.massiveUpdate_form_columns && config.massiveUpdate_form_columns.length > 0 && config.formMassiveUpdate == true) {
                                   var incondition = "'" + config.massiveUpdate_form_columns.join("','") + "'";
                                   return "(" + defaultwhere + ")" + "AND ColumnName in (" + incondition + ")";
                               }
                               else
                                   return defaultwhere;
                           }
                       }
                       self.restrictDataModel = function (data) {
                           $(data.models).each(function (i, v) {
                               $.each(v, function (key) {
                                   if (config.massiveUpdate_form_columns.indexOf(key) == -1 && key!=config.formPK)
                                       delete v[key];
                               });
                           });
                       };
                       self.callStoredProcedure = function (form) {
                           $scope.$broadcast('schemaFormValidate');
						   if (form.$valid) {
							   //Ui can will be locked (default)
							   if (!(config.jsonpayload && config.jsonpayload.UI_ImmediateRelease))
								   doModal(true);
							   else  //UI_ImmediateRelease == true --> i have to immediately release the UI, i will hide the modal before stored gets called...
								   $("#wndmodalContainer").modal('hide');

							   var data = $.extend({},self.formData); // data in the form
                               //load current grid filter in the payload (GRID WHERE A TOOLBAR BUTTON LIES)
                               if (!data.filter && config.filter)
                                   data.filter = config.filter;
                               if (!data.cfgModel && config.gridModel)
                                   data.cfgModel = [config.gridModel];
                               var selectedData = JSON.parse(config.data); // rows selected by the user
                               if (config.massiveUpdate_form_columns && config.massiveUpdate_form_columns.length > 0) // restricts the selected grid rows' fields to the properties in the massiveUpdate_form_columns array which has been set in the grid config 
                                   self.restrictDataModel(selectedData);
                               $.extend(data, selectedData,config.jsonpayload);

							   extendPayloadWithUserGeoLocation(data);

                               data = function replaceTimezonesInDataObject(data) {
                                   $.each(data, function (k, v) {
									   if (v instanceof Date) //D.T 14/08/2019 bug #6242 modified adding new Date(v.valueOf()) in order to decouple payload dates (modified for the UTC removal) and the original dates in model. This would affect the error case increasing datetime 
										   data[k] = toTimeZoneLessString(new Date(v.valueOf(v)));
                                       else if (typeof v == "string" && (config.gridFields && config.gridFields[k] && (config.gridFields[k].dataRole && config.gridFields[k].dataRole.indexOf("date") != -1) || v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)))
                                           data[k] = toTimeZoneLessString(new Date(v));
                                       else if (v && typeof v == "object")
                                           v = replaceTimezonesInDataObject(v);
                                   });
                                   return data;
                               }(data);


                               //S.M. 29/11/2023 get tmpFile before to execute so or Url and add to data
                               if ($('magic-form', $element).data() && $('magic-form', $element).data().filesToSave) {
                                   var filesBosyPart_reftree = [];

                                   $.each($('magic-form', $element).data().filesToSave, function (i, f) {
                                       filesBosyPart_reftree.push({Id : i+1 ,name: f.name, tmpFile: f.tmpFile });
                                   });

                                   if (filesBosyPart_reftree.length > 0) {
                                    data.filesBosyPart_reftree = filesBosyPart_reftree;
                                   }
                               }
                               manageGridUploadedFiles($('magic-form', $element))
                                   .then(function () {
                                       $.ajax({
                                           type: "POST",
                                           url: config.url || "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
                                           data: JSON.stringify(data),
                                           contentType: "application/json; charset=utf-8",
                                           dataType: "json",
                                           success: function (result) {

                                               if (!(config.jsonpayload && config.jsonpayload.UI_ImmediateRelease))
                                                   doModal(false);

                                               if (config.jsonpayload && config.jsonpayload.fileMoveDirectory) {
                                                   var filesToSave = $.extend({}, $('magic-form', $element).data().filesToSave);
                                                   moveFiles(filesToSave, config.jsonpayload.fileMoveDirectory)
                                               }

                                               var msg = "OK";
                                               var msgtype = false;
                                               if (result.message !== undefined) {
                                                   msg = result.message;
                                                   if (result.msgtype == "WARN")
                                                       msgtype = "info";
                                               }
                                               kendoConsole.log(msg, msgtype);
                                               //Fix for form + multiselect where e contains the click event
                                               var gridToRefresh = $(config.e).closest(".k-grid").length ? $(config.e).closest(".k-grid").data("kendoGrid") : $(config.e.target.closest(".k-grid")).data("kendoGrid");
                                               if (gridToRefresh)
                                                   gridToRefresh.dataSource.read();
                                               $("#wndmodalContainer").modal('hide');
                                           },
                                           error: function (message) {
                                               kendoConsole.log(message.responseText, true);
                                               if (!(config.jsonpayload && config.jsonpayload.UI_ImmediateRelease))
                                                   doModal(false);
                                           }
                                       });

                                   });
                       }
                       moveFiles = function (filesToSave, moveTo) {
                           var data = { filesToSave, moveTo };

                           $.ajax({
                               type: "POST",
                               url: "/api/Documentale/MoveFiles/",
                               data: JSON.stringify(data),
                               contentType: "application/json; charset=utf-8",
                               success: function (result) {
                                   kendoConsole.log(result, false);
                               },
                               error: function (err) {
                                   kendoConsole.log(err, 'WARN');
                               },
                           })
                       }
                   }
                  }
               ]
           )
});