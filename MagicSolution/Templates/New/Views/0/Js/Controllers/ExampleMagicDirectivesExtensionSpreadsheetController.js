define(["MagicSDK"], function (MF) {

    return {
        html: function (controller) {
            var html = $.Deferred();
			html.resolve('<magic-timesheet selector="{{ md.selector }}" options=md.options name="{{ md.name }}" range="{ data: { columns: [2, 8], from: -0.1, to: 24, message: \'mustbeanhour\' } }"></magic-timesheet>"');
            return html.promise();
        },
		js: function (controller) {
			var timestamp = Date.now();
			var js = $.Deferred();
			//var gridItemid = controller.config.data[controller.config.evt.sender.options.dataSource.schema.model.id];
            // look at controller.config.data to access row data
			var selector = "#mf_spreadsheet" + timestamp;
			
				js.resolve({
					name: "Spreadsheet1",
					options: controller.config.data ? controller.config.data.toJSON() : null,
					selector: "#mf_spreadsheet" + timestamp
			});
            return js.promise();
        }

    }
});