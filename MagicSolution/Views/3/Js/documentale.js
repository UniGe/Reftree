function loadscript() {
    create_elements();
}

function create_elements() {
    apply_style("/Views/3/Styles/fascicolo.css");
    $("#grid").remove();

    var gridobj = getrootgrid("DO_V_DOCUME", null, "grid1");
    renderGrid(gridobj, null, null, "grid1");
}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}
