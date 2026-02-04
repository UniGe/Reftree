define(["angular"], function (angular) {
	return angular
		.module('ShowConfirmationBasedOnMonth',[])
		.controller('ShowConfirmationBasedOnMonthController', [
			'config',
			'$scope',
			'$http',
			'$timeout',
			function (config, $scope, $http, $timeout) {
				var cntrl = this;

				this.parentData = config.data;
				var options = config.options;
				var e = config.el;
				var key = e.id == "" ? e.className : e.id;
				var storedprocedure = options && options.storedprocedure ? options.storedprocedure : toolbarbuttonattributes[key].storedprocedure;
				var storedproceduredataformat = options && options.storedproceduredataformat ? options.storedproceduredataformat : toolbarbuttonattributes[key].storedproceduredataformat;
				var jsonpayload = {};
				try {
					jsonpayload = options && options.payload ? options.payload : JSON.parse(toolbarbuttonattributes[key].jsonpayload);
				}
				catch (e) {
					console.log("jsonpayload is not a valid json:" + e.message);
				}

				var monthText = $("#month-drop option:selected").text();
				this.monthText = monthText;



				this.DescriptionText = jsonpayload.DescriptionText.replace('{0}', monthText);
				this.Title = jsonpayload.Title;

				this.save = function () {
					var monthValue = $("#month-drop").val();
					var yearValue = $("#year-drop").val();
					var data = {};
					data.month = monthValue;
					data.year = yearValue;
					var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat ,  null, null, data, null);
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
							if (config.containerWindowSelector) {
								$(config.containerWindowSelector).modal('hide');
							} else {
								$(config.containerWindowSelector).modal('hide');
							}
							kendoConsole.log(msg, msgtype);
							$(config.el).closest(".k-grid").data("kendoGrid").dataSource.read();
						},
						error: function (message) {
							kendoConsole.log(message.responseText, true);
						}
					});
				}

				this.showModal = function () {
					if (config.containerWindowSelector) {
						$(config.containerWindowSelector).modal('show');
					}
				};
				
			}
		]);
});