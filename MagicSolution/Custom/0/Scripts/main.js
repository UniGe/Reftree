define([], function () {
    if (location.pathname === "/example" || location.pathname === "/example.aspx") {
        requireConfigAndMore(["angular"], function (angular) {
            $("#exampleMain").html(getAngularControllerElement("ExampleController"));
        });
        initReact($('#react-example'), 'example');
    }
});