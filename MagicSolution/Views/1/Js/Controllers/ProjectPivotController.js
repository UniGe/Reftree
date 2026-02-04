define([], function () {

    return {
        html: function (controller) {       
            var html = $.Deferred();
            html.resolve("<magic-pivot pivot-codes='md.pivotCodes' pivot-options='md.pivotOptions'></magic-pivot>");
            return html.promise();
        },
        js: function (controller) {
            var js = $.Deferred();
            // look at controller.config.data to access row data
            js.resolve({
                pivotCodes: ["PROJEBITTAB"],
                pivotOptions: [
                    {
                        dataSource: {
                            filter: ['Project_ID', '=', controller.config.data.ID]
                        }
                    }
                ],                
                myExtensionFunction: function () {
                    console.log('hi, I am very extending');
                }
            });
            return js.promise();
        }

    }
});