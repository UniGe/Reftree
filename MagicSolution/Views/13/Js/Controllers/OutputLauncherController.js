define(["angular", "angular-magic-form"], function (angular) {
	return angular
		.module('OutputLauncher', ["magicForm"])
		.controller('OutputLauncherController', [
			'config',
			'$scope',
			'$http',
			function (config, $scope, $http) {
				var self = this;
				self.rowdata = config.data;
				self.translate = function (text) {
					return getObjectText(text);
				};
				self.save = function (form) {
					doModal(true);
					var data = self.form.data;
                    data.ID = self.rowdata.ID;
                    data.OutputName = self.rowdata.OutputName;
                    data.OutputName = self.rowdata.OutputName;
                    data.PythonScript = self.rowdata.PythonScript;
                    data.TemplateScript = self.rowdata.TemplateScript;
					if (data.DateFrom)
						data.DateFrom = toTimeZoneLessString(new Date(data.DateFrom));
					if (data.DateTo)
                        data.DateTo = toTimeZoneLessString(new Date(data.DateTo));
					$http.post("/api/CE_CALCIO/GenerateOutput/", data)
						.then(function (success) {
							doModal(false);
							kendoConsole.log("Uscita generata correttamente!", false);
							$("#wndmodalContainer").modal('hide');
						}, function (error) {
							doModal(false);

							kendoConsole.log(error.data, true);
						});
				}
			}
		]);
});