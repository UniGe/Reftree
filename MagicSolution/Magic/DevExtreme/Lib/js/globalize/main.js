(function () {
    define(["module"], function (module) {
        var deferred = $.Deferred(),
            devExpressPath = module.config().devExpressPath,
            cultureShort = culture.substring(0, 2);
        if (cultureShort != "en" && !window.Globalize) {
            require([
                "devExpress-message",
                "devExpress-currency",
                "devExpress-date",
                "devExpress-number",
            ], function (Globalize) {
                if (!window.Globalize) {
                    window.Globalize = Globalize;
                }
                Globalize = window.Globalize;
                require([
                "devExpress"
                ], function () {
                    require([devExpressPath + "localization/dx.web." + cultureShort + ".patched.js"], function () {
                        $.when(
                            $.getJSON(devExpressPath + "cldr/translations/" + cultureShort + "/ca-gregorian.json"),
                            $.getJSON(devExpressPath + "cldr/translations/" + cultureShort + "/numbers.json"),
                            $.getJSON(devExpressPath + "cldr/translations/" + cultureShort + "/currencies.json"),
                            $.getJSON(devExpressPath + "cldr/supplemental/likelySubtags.json"),
                            $.getJSON(devExpressPath + "cldr/supplemental/timeData.json"),
                            $.getJSON(devExpressPath + "cldr/supplemental/weekData.json"),
                            $.getJSON(devExpressPath + "cldr/supplemental/currencyData.json"),
                            $.getJSON(devExpressPath + "cldr/supplemental/numberingSystems.json")
                        ).then(function () {
                            return [].slice.apply(arguments, [0]).map(function (result) {
                                return result[0];
                            });
                        }).then(
                            Globalize.load
                        ).then(function () {
                            Globalize.locale(cultureShort);
                            deferred.resolve();
                        });
                    });
                });
            });
        }
        else
            deferred.resolve();
        return deferred.promise();
    });
})();