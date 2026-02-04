define(["angular", "angular-magic-form"], function (angular) {
    var app = angular
        .module("Magic_DocumentModel", ["magicForm"])
        .controller("Magic_DocumentModelController", ['config', '$scope', '$http', function (config, $scope, $http) {
            var self = this;
            self.formInputs = null;
            self.requestSent = false;
			self.exportProgress = 0;

			function synchTask(gridname) {
				if (window.mergePrintSynchGrids && window.mergePrintSynchGrids[gridname])
					return true;
				return false;
			}

            self.formData = {
                tipmodId: config.modelType.id,
                where: config.filter,
                selectedRows: config.selectedRows,
				isPublic: config.isPublic ? config.isPublic : false,
				synch: synchTask(config.grid.element.attr("gridname"))
            };
            
            self.formCallback = function (data) {
                self.formInputs = data;
                if (!data)
                    self.getDocuments();
            };

            self.formSubmit = function (form) {
                $scope.$broadcast("schemaFormValidate");
                if (form.$valid)
                    self.getDocuments();
            };
		
			self.getDocuments = function () {
				let sanitizeFileNameAddDate = function (filename) {
					let isoDate = new Date().toISOString().substring(0, 10);
					let newfname = filename + "_" + isoDate;
					return newfname.replace(/[^a-z0-9_-]/gi, "_").substring(0, 254);
				}
				var formData = $.extend({}, self.formData);
				$.each(formData, function (k, v) {
					if (v instanceof Date || typeof v == "string" && v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
						formData[k] = toTimeZoneLessString(new Date(v));
				});
				formData = allPropertiesToTimeZoneLessString_full(formData);

				if (config.modelType && config.modelType.outCode == "excel") {
					delete formData.where;
					doModal(true);
					$.fileDownload('/api/Magic_DocumentModel/BuildExcel/', {
						data: {
							tipmodId: config.modelType.id,
							fileName: sanitizeFileNameAddDate(config.modelType.description) || "",
							storedProcedure: "",
							data: JSON.stringify(formData),
							filter: config && config.filter ? JSON.stringify(config.filter) : undefined
						}, httpMethod: "POST"
					}).then(
						function () {
							doModal(false);
						},
						function () {
							// Error handler
							doModal(false);
						});;
					self.closeModal();
					return;
				}

				self.requestSent = true;
				var formDataCopy = Object.assign({}, formData)
				formDataCopy = allPropertiesToTimeZoneLessString_full(formDataCopy);

				self.resumeTask = function () {
					$http.post("/api/" + config.controllerName + "/ResumeTask?taskID=" + self.taskID)
					self.taskID = null; //not killable anymore
				}
				self.stopTask = function () {
					$http.post("/api/" + config.controllerName + "/StopTask?taskID=" + self.taskID)
					clearInterval(self.interval);
					self.closeModal();
				}

				$http.post("/api/" + config.controllerName + "/BuildDocumentsFromModel", {
					tipmodId: config.modelType.id,
					formData: JSON.stringify(formDataCopy),
					openTask: config.openTask
				}).then(function (res) {
					if (!config.modelType.batch) {
						var taskID = self.taskID = res.data.taskID;
						self.isTaskPaused = false;
						self.isPreviewConfirmed = false;
						self.documentFillSessionId = res.data.documentFillSessionId;
						var getExportedZip = false,
							zipName = encodeURIComponent(res.data.zipName),
							isPDF = config.modelType.outCode == 'pdf',
							showPreview = res.data.showPreview == true,
							isPreviewConfirmed = false,
							minPercentage = Math.min(Math.floor(100 / res.data.fileCount * 2 * 100000) / 100000, 99); // in PDF at least 2 files must be ready (doc & pdf)
						self.interval = setInterval(function () {
							if (self.interval && res.data.fileCount && res.data.fileCount > 0) {
									$http.get("/api/" + config.controllerName + "/GetExportProgress?documentFillSessionId=" + self.documentFillSessionId + "&fileCount=" + res.data.fileCount + "&zipName=" + zipName).then(function (res) {
										var percent = parseFloat(res.data);
										if (self.taskID && showPreview && !isPreviewConfirmed && percent >= minPercentage) {
											if (!self.isTaskPaused) {
												self.isTaskPaused = true
											}
                                        }
										if (percent >= 100 && !getExportedZip) {
											if (self.taskID && showPreview && !isPreviewConfirmed)
												return; // all files ready, but preview not shown
											clearInterval(self.interval);
											$.fileDownload("/api/" + config.controllerName + "/GetExportedFile?documentFillSessionId=" + self.documentFillSessionId + "&zipName=" + zipName + "&taskID=" + taskID);
											getExportedZip = true;
											self.closeModal();
											if (config.grid && config.grid.dataSource && config.grid.dataSource.online())
												config.grid.dataSource.read();
											if (config.docIsReadyCallback && typeof config.docIsReadyCallback == 'function')
												config.docIsReadyCallback();
										}
										if (percent > self.exportProgress)
											self.exportProgress = percent;
									}, function (res) {
										clearInterval(interval);
										kendoConsole.log(res.data, "error");
										self.closeModal();
									});
								}
								else {
									clearInterval(self.interval);
									kendoConsole.log("No files generated! Please select one or more records!", true);
									self.closeModal();
                                }
							}, isPDF ? 500 : 100);
					} else {
						kendoConsole.log(getObjectText("buildDocuments") + " started...", "success");
						self.closeModal();
					}
				}, function (res) {
					kendoConsole.log(res.data, "error");
					self.closeModal();
				});
				//}
			};

			self.closeModal = function () {
				cleanModal().closest('.modal').modal('hide');
			};

            if(!config.formTableName)
                self.getDocuments();
        }]);
    return app;
});