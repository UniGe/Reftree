define(["MagicSDK"], function (MF) {

    return {
        html: function (controller) {
            var html = $.Deferred();
            html.resolve('<magic-timesheet selector="{{ md.selector }}" options=md.options name="{{ md.name }}" range="{presence: { columns: [2, 8] },  data : { columns: [2, 8] } }"></magic-timesheet>"');
            return html.promise();
        },
        js: function (controller) {
            var timestamp = Date.now();
            var js = $.Deferred();
            //var gridItemid = controller.config.data[controller.config.evt.sender.options.dataSource.schema.model.id];
            // look at controller.config.data to access row data
            var selector = "#mf_spreadsheet" + timestamp;
            //page limit set to 30. Over 35 elements, the timesheet does not handle it!
            let config_data = Object.assign({}, controller.config.data, { pageElementsLimit: 30 }, { numItems: controller.config.data.NoAttendees});

            js.resolve({
                name: "SpreadSheet_CourseAttendeesPresence_timesheet",
                options: config_data,
                selector: "#mf_spreadsheet" + timestamp
            });
            return js.promise();
        }

    }
});