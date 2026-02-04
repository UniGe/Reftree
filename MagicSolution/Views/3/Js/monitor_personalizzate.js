function loadscript() {
    apply_style("/Views/3/Styles/monitor.css");  //applica css
    var $controller = $("<div id='tabstripcontainer' ng-controller='PersonalMonitorController as pmc' ng-include=\"'" + window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Templates/PersonalMonitor.html'\"></div>");
    $("#appcontainer").append($controller);
    initAngularController($controller, "PersonalMonitorController", null, null, true);
};

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}
