define(["MagicSDK"], function (MF) {

	return {
		html: function (controller) {
			var html = $.Deferred();

			html.resolve(
			//html.resolve("<magic-grid-sp data='md.data' ng-if='md.storedName' storedprocedure={{md.storedName}} options='{gridExtension:{showMap:true} , groupable:true,resizable:true,sortable:true}'></magic-grid-sp>");
			//html.resolve("<magic-grid external-grid-object='md.externalGridObjectStart' gridname='{{md.gridName}}' filterpk={{md.filterpkGrid}} data='md.data'></magic-grid>");
			html.resolve('<magic-grid external-grid-object="md.externalGridObjectStart" gridName="{{md.gridName}}" filterPk="{{md.filterpk}}" data="md.data"></magic-grid>"');
			return html.promise();
		},
		js: async function (controller, $scope) {
			var self = this;
			var js = $.Deferred();
			 
			//$.ajax({
			//	type: "POST",
			//	url: "/api/RefTreeServices/StartServiceFromModelNew/",
			//	data: result,
			//	contentType: "application/json; charset=utf-8",
			//	dataType: "json",
			//	success: function (data) {
			//		var data1 = {};
			//		data1.response = data.Response;
			//		data1.status = data.Status;
			//		resolve(data1)
			//	},
			//	error: function (error) {
			//		reject(error)
			//	},
			//})
			 
			res = await MF.api.get({
				storedProcedureName: "custom.get_twin_grid",
				data: {
					gridname: controller.config.evt.sender.element.attr("gridname"),
					rowData: controller.config.data
				}
			})


			if (res.length > 0) {
				try {
					await isGridVisiblePromise(res[0][0].gridNameStart);
					await isGridVisiblePromise(res[0][0].gridNameEnd);
					 
					self.gridName = await res[0][0].gridNameStart;
					self.filterpk = res[0][0].gridNameStartPk;
					self.data = controller.config.data;
					controller.config.model = controller.config.data;

					self.externalGridObjectStart = await MF.kendo.getGridObject({ gridName: res[0][0].gridNameStart });
					self.externalGridObjectStart.dataSource.transport.CustomJSONParam = CustomJSONParam
					self.externalGridObjectEnd = await MF.kendo.getGridObject({ gridName: res[0][0].gridNameEnd });
					self.externalGridObjectStart.columns = self.externalGridObjectStart.columns.concat(self.externalGridObjectEnd.columns);

				} catch (ex) {

				}
			}
 
			js.resolve({
				storedName: res[0][0].storedName,
				data: controller.config.data,
				externalGridObjectStart: self.externalGridObjectStart,
				filterpk: self.filterpk,
				gridName : self.gridName
			});

			controller.$timeout();

			//});
			return js.promise();
		}

	}
});