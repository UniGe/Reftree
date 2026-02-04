define([]
, function () {
    //init routing
    if (location.pathname === "/app")
        require(["routes"]);
    else if (location.pathname.indexOf("dashboard") > -1) {
        require(["dashboard-v2"]);
    }
    else if (location.search.indexOf("menuId") > -1) { //if not handled by routing and query contains menuId open menuPt by menuId
        var menuId = location.search.match(/menuId=([\d]+)/);
        if (menuId[1]) {
            var $sideMenu = $("#sidemenu");
            if ($sideMenu.data("status") == "loading")
                $sideMenu.one("menuReady", function () {
                    openMenu(".menuId-" + menuId[1]);
                });
            else
                openMenu(".menuId-" + menuId[1]);
        }
    }

    //get UserGridSettings and save them into sessionStorage
    if (sessionStorage.configLoadedTimestamp != window.LoginTimestamp) {
        $.get("/api/Config/GetUserConfig/grid")
            .always(function () {
                sessionStorage.configLoadedTimestamp = window.LoginTimestamp;
            })
            .done(function (res) {
                if (res != "null") {
                    //it should be an object of arrays within objects, otherwise (object of objects) write them in an array
                    if (res.match(/^\{\s*"[^"]+"\s*:\s*\[\{/))
                        sessionStorage.usersGridsSettings = res;
                    else {
                        var usersGridsSettings = {};
                        $.each(JSON.parse(res), function (k, v) {
                            if (Array.isArray(v))
                                usersGridsSettings[k] = v;
                            else if (typeof v === 'object' && !$.isEmptyObject(v)) {
                                v.settingsName = "No Name";
                                v.isDefaultSetting = true;
                                usersGridsSettings[k] = [v];
                            }
                        });
                        sessionStorage.usersGridsSettings = JSON.stringify(usersGridsSettings);
                    }
                }
            });
        if (typeof applicationInitCustomization == "function")
            applicationInitCustomization();
    }

    if (sessionStorage.rightsLoadedTimestamp != window.LoginTimestamp)
    {
        doModal(true);
        buildGridRightsSessionStorage()
            .then(function () {
                while (window.rightsQueue.length) {
                    window.rightsQueue.shift()();
                }
                sessionStorage.rightsLoadedTimestamp = window.LoginTimestamp;
                doModal();
            }, function () {
                doModal();
                console.error("While getting rights");
            });
    }

    initAngularController($('[ng-controller*=NotificationsController]'), 'NotificationsController');
    //require is in
    $("#appcontainer").trigger("requireLoaded");

    function resizeFixedKendoGridHeader() {
        $('.k-grid:not(.k-window .k-grid)').each(function () {
            var $wrapper = $(this),
                $header = $wrapper.find("> .k-grid-header.fixed-header")
            $header.css("width", $wrapper.width() - parseInt($header.css("padding-right")));
        })
    }

    function scrollFixedKendoGridHeader() {
        $('.k-grid:not(.k-window .k-grid)').each(function () {
            try {
                var $wrapper = $(this),
                    $header = $wrapper.find("> .k-grid-header"),
                    $content = $wrapper.find('> .k-grid-content'),
                    fixedHeaderHeight = (template == 'webarch' ? (window.outerWidth > 767 ? 60 : 0) : (template == 'metronic' ? (window.outerWidth > 991 ? 46 : 0) : 0)),
                    offsetTop = $(window).scrollTop() + fixedHeaderHeight,
                    tableOffsetTop = $content.offset().top - $header.outerHeight(),
                    tableOffsetBottom = tableOffsetTop + $content.height();

                if (offsetTop < tableOffsetTop || offsetTop > tableOffsetBottom) {
                    $content.css("margin-top", 0);
                    $header
                        .css({
                            width: "",
                            top: ""
                        })
                        .removeClass("fixed-header");
                } else if (offsetTop >= tableOffsetTop && offsetTop <= tableOffsetBottom && !$header.hasClass("fixed-header")) {
                    $content.css("margin-top", $header.outerHeight());
                    $header
                        .css({
                            width: $wrapper.width() - parseInt($header.css("padding-right")),
                            top: fixedHeaderHeight
                        })
                        .addClass("fixed-header");
                }
            } catch(e) {}
        })
    }

    //triggers for fixed headers on master grids
    if (window.fixedKendoGridHeaders) {
        $(window).resize(resizeFixedKendoGridHeader);
        $(window).scroll(scrollFixedKendoGridHeader);
    }
});