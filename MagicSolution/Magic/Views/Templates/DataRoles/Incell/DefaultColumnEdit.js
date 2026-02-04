function defaultColumnEdit (container, options) {
    getTemplate(window.includesVersion + "#templatePath#")
        .then(function (res) {
            var data = #data#,
                $container = $(container);
            console.log(options);
            console.log(data);
            $container.html(res.format.apply(res, data));
            $container.find("input")
                .data("columnData", options)
                .trigger("focus");
        });
}