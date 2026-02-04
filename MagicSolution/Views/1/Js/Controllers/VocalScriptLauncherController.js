define(["angular", "angular-magic-form"], function (angular) {
	return angular
		.module('VocalScriptLauncher', ["magicForm"])
		.controller('VocalScriptLauncherController', [
			'config',
			'$scope',
			'$http',
			function (config, $scope, $http) {
				var self = this;
				self.rowdata = config.data;
				self.e = config.el;
				self.translate = function (text) {
					return getObjectText(text);
				};

				var gridname = $("#grid").attr("gridname");
				var storedprocedure = getRowStoredProcedure(self.e);
				var storedproceduredataformat = getRowStoreProcedureDataFormat(self.e);
				var rowdata = getRowDataFromButton(self.e);

				var ID = self.rowdata.ID;
				self.isBOGrid = (gridname === "PhoneContractWizard") || (gridname === "TaskList_unassigned_Z") || (gridname === "TaskList_complete_Z");
				self.VO_Code = self.rowdata.VO_Code;
				self.VO_ConsensesCode = self.rowdata.VO_ConsensesCode;
				self.VO_Check = self.rowdata.VO_Check;
				self.IDOrderVola = self.rowdata.IDOrderVola;
				self.extVOscriptUrl = "http:\/\/10.10.30.3:8200\/checkcall.php?idcontract=" + ID;

				self.extVOscriptConsenseUrl = "http:\/\/10.10.30.3:8200\/referee.php?idcontract=" + ID;
				self.extVOscriptBOUrl = 'http://10.10.30.3:8200/checkcall.php?idcontract='+ID+'&IsBoSript=1';

				self.isVodafone = function () {
					return (self.rowdata.Provider_ID == 3);
				}

				self.save = function (form) {
					if ((!self.VO_Code || self.VO_Code == "") && !self.isVodafone()) {
						kendoConsole.log("Il codice Vocal Order è obbligatorio!", true);
						return;
					}

					var data = {};
					data.ID = ID;
					data.VO_Code = self.VO_Code;
					data.VO_ConsensesCode = self.VO_ConsensesCode;
					data.VO_Check = self.VO_Check;
					data.IDOrderVola = self.IDOrderVola;
					data.isBOGrid = self.isBOGrid;
					var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, sessionStorage.fid ? sessionStorage.fid : null, null, data, null);
					var data = datatopost;
					$.ajax({
						type: "POST",
						url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
						data: data,
						contentType: "application/json; charset=utf-8",
						dataType: "json",
						success: function (result) {
							var msg = "OK";
							var msgtype = false;
							if (result.message !== undefined) {
								msg = result.message;
								if (result.msgtype == "WARN")
									msgtype = "info";
							}
							$("#wndmodalContainer").modal('hide');
							kendoConsole.log(msg, msgtype);
							$("#grid").data("kendoGrid").dataSource.read();

						},
						error: function (message) {
							kendoConsole.log(message.responseText, true);
						}
					});

				}
			}
		]);
});