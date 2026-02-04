define(["angular", "query-builder"], function (angular) {
	return angular
		.module('QueryBuilder',[])
		.controller('QueryBuilderController', [
			'config',
			'$scope',
			'$http',
			'$timeout',
			function (config, $scope, $http, $timeout) {
				var cntrl = this;

				apply_style("/Views/1/Styles/query-builder.default.min.css"); 
				
				this.parentData = config.data;
				var storedprocedure = getRowStoredProcedure(config.el);
				var storedproceduredataformat = getRowStoreProcedureDataFormat(config.el);
				var jsonPayload = getRowJSONPayload(config.el);
				var entity = jsonPayload.Entity;
				var rules_basic = (this.parentData[jsonPayload.filterField] && this.parentData[jsonPayload.filterField] != '') ? JSON.parse(this.parentData[jsonPayload.filterField]) : null; 

				GetDropdownValues("usp_getEntityFields_drop", "ID", "Description", "HR", 1, null
					, true, config.data)
					.then(function (fields) {

						var filters = [];
						for (var i = 0; i < fields.length; i++) {
							var filter = {
								id: fields[i].Field,
								label: fields[i].Description,
								type: fields[i].Code,
							};

							if (fields[i].FieldType == 'boolean') {
								filter.type = 'integer';
								filter.input = 'radio';
								filter.values = {
									1: 'Yes',
									0: 'No'
								};
								filter.operators = ['equal'];
							}
							filters.push(filter);
							$timeout(function () {
								$('#queryBuilder').queryBuilder({
									plugins: ['bt-tooltip-errors'],

									filters: filters
									,
									lang_code: 'it'
									,
									rules: rules_basic
								});
								$('#btn-get-sql').on('click', function () {
									var result = $('#queryBuilder').queryBuilder('getSQL');
									if (result.sql.length) {
										alert(result.sql + '\n\n' + JSON.stringify(result.params, null, 2));
									}
								});
							}, 300);

						}
					});

				this.save = function () {

					var sqlRules = $('#queryBuilder').queryBuilder('getSQL');
					var plainRules = $('#queryBuilder').queryBuilder('getRules');
					var data = this.parentData;
					if (sqlRules.sql && sqlRules.sql.length) {
						data.sqlRules = JSON.stringify(sqlRules.sql);
					}
					data.plainRules = JSON.stringify(plainRules);
					
					var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat , sessionStorage.fid ? sessionStorage.fid : null, null, data, null);
					var data = datatopost;
					data.entity = entity;
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
								$("#qb_wndmodalContainer").modal('hide');
							}
							kendoConsole.log(msg, msgtype);
							console.log($scope);
							$(config.el.currentTarget).closest(".k-grid").data("kendoGrid").dataSource.read();
							//cntrl.kendoGridInstance.dataSource.read();
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