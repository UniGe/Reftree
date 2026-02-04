function loadscript() {
    apply_style("/Views/3/Styles/cadviewer.css");  //applica css
    var gridobj = getrootgrid('AS_ASSET_asset');
    renderGrid(gridobj, null);
}


function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}