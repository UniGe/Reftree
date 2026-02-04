define([
    "angular",
    "angular-route"
], function (angular) {
    var fromEmptyHash = false;
    var executeOnRouteChange = [];

    function updateGoogleAnalytics() {
        if (typeof googleAnalytics == 'function') {
            googleAnalytics('set', 'page', window.location.pathname + window.location.hash);
            googleAnalytics('send', 'pageview');
        }

        //nf20170306: qui facebook non mi consente di effettuare il tracking dell'hash, a differenza di Analytics e quindi comment
        //if (typeof fbq == 'function') {
        //    fbq('track', 'PageView');
        //}

        
    }

    //rebuild hash if a-tag with href="#" is clicked
    window.onhashchange = function (e) {            
        if (!window.location.hash) {
            fromEmptyHash = true;
            window.location.hash = getLastLocation();
        } else {
            updateGoogleAnalytics();
        }
    };

    function setLastLocation() {
        //close opened kendo windows
        $('body > .k-window > .k-window-content').each(function () {
            $(this).data("kendoWindow").close();
        });
        localStorage.lastAppLocation = window.location.hash;
        var func;
        while((func = executeOnRouteChange.pop()) !== undefined) {
            func();
        }
    }

    function getLastLocation(){
        return localStorage.lastAppLocation ? localStorage.lastAppLocation.substring(1) : "";
    }

    var $sideMenu = $("#sidemenu");

    function initMagicFunction(menuId, moduleId, shallNotSearch) {
        if ($sideMenu.data("status") == "ready")
            return initFunctionality(menuId, moduleId, shallNotSearch);
        else
            $sideMenu.one("menuReady", function () {
                initFunctionality(menuId, moduleId, shallNotSearch);
            });
    }

    function initFunctionality(menuId, moduleId, shallNotSearch){
        var clickedOn = ".menu-" + menuId + "-" + moduleId,
            $menuPt = $(clickedOn);
        if ($menuPt.length) {
            genericMenuClick($menuPt.find("a").attr("funcid"), menuId);
            openMenu(clickedOn);
            setLastLocation();
            return true;
        }
        else {
            if ($sideMenu.data("status") == "ready" && !shallNotSearch)
                searchInOtherAreas(menuId, moduleId);
            else if (shallNotSearch) {
                return false;
            }
        }
    }

    var errorMessage = '<p class="text-center" style="font-size: 3em">404 - Not found</p>';

    function searchInOtherAreas(menuId, moduleId) {
        $.get("/api/MAGIC_MMB_MODULES/GetAllApplicationAreas", function (res) {
            var storedProcedure = "",
                externalModuleProcedure = "",
                nullIdProcedure = "",
                internalModuelId = 0;
            for (var i = 0; i < res.length; i++) {
                if (res[i].MagicFrameworkModuleId == moduleId) {
                    externalModuleProcedure = res[i].Solver;
                    internalModuelId = res[i].ID;
                    break;
                }
                else if (res[i].ID == moduleId) {
                    storedProcedure = res[i].Solver;
                }
                else if(res[i].ID == "0")
                    nullIdProcedure = res[i].Solver;
            }
            generateMenuFor(
                externalModuleProcedure || storedProcedure || nullIdProcedure || undefined,
                moduleId,
                (externalModuleProcedure || storedProcedure) ? (internalModuelId || moduleId) : "0",
                menuId,
                nullIdProcedure
            );
        }).error(function () {
            $("#appcontainer").html(errorMessage);
        });
    }

    function generateMenuFor(procedure, moduleId, foundModule, menuId, nullIdProcedure) {
        if (foundModule === "0" && (!procedure || procedure === "")) {
            foundModule = "-1";
        }
        sessionStorage.MenuControllerParameter = procedure;
        sessionStorage.ApplicationAreaId = foundModule;
        generateSideMenu();
        $sideMenu.one("menuReady", function () {
            var relevantURLComponents = window.location.hash.match(/[^\D-]+/g);
            if (relevantURLComponents[0] == menuId && relevantURLComponents[1] == moduleId) {
                var success = initMagicFunction(menuId, moduleId, true);
                if (!success && nullIdProcedure && nullIdProcedure != procedure) {
                    generateMenuFor(nullIdProcedure, moduleId, foundModule, menuId);
                    return;
                }
            }
            if (!success) {
                $("#appcontainer").html(errorMessage);
                $(".breadcrumb, .page-title").html('');
            }
        });
    }

    var emptyTemplate = '<span></span>';

    angular.module('routing', ['ngRoute'])
        .config(['$routeProvider', function ($routeProvider, $location) {
            $routeProvider
                .when('/function/:functionName', {
                    template: emptyTemplate,
                    controller: [
                        "$routeParams",
                        function (params) {
                            if (fromEmptyHash) {
                                fromEmptyHash = false;
                                return;
                            }
                            var pathComponents = params.functionName.split("-"),
                                menuId = pathComponents[0],
                                moduleId = pathComponents[1];
                            $("#appcontainer").html(largeSpinnerHTML);
                            initMagicFunction(menuId, moduleId)
                        }
                    ]
                })
                .when('/mail', {
                    template: emptyTemplate,
                    controller: [function () {
                        if (fromEmptyHash) {
                            fromEmptyHash = false;
                            return;
                        }
                        setLastLocation();
                        openfastlink("/Magic/Views/Js/Magic_MailStarter.js", "Mail");
                    }]
                })
                .when('/calendar', {
                    template: emptyTemplate,
                    controller: [function () {
                        if (fromEmptyHash) {
                            fromEmptyHash = false;
                            return;
                        }
                        setLastLocation();
                        openfastlink("/Magic/Views/Js/Magic_SchedulerStarter.js", "calendar");
                    }]
                })
                .when('/profile', {
                    template: emptyTemplate,
                    controller: [function () {
                        if (fromEmptyHash) {
                            fromEmptyHash = false;
                            return;
                        }
                        setLastLocation();
                        openfastlink(window.customProfile || "/Magic/Views/Js/Magic_AccountStarter.js", "personaldata");
                    }]
                })
                .when('/messages', {
                    template: emptyTemplate,
                    controller: [function () {
                        if (fromEmptyHash) {
                            fromEmptyHash = false;
                            return;
                        }
                        setLastLocation();
                        $(".page-title #spanbig").text("Messages");
                        $(".page-title #spansmall").text("");
                        $("#appcontainer").html('<div id="grid"></div>');
                        initReact($("#appcontainer").find('#grid'), 'Magic_DocumentRepository')
                            .then(function (fnUnmount) {
                                executeOnRouteChange.push(fnUnmount);
                            });
                    }]
                })
                .when('/news', {
                    template: '<magic-change-log></magic-change-log>',
                    controller: [function () {
                        if (fromEmptyHash) {
                            fromEmptyHash = false;
                            return;
                        }
                        setLastLocation();
                        requireConfigAndMore([window.includesVersion + "/Magic/Views/Js/Controllers/Magic_ChangeLogController.js"], function (init) {
                            $(".page-title #spanbig").text(getObjectText("news"));
                            $(".page-title #spansmall").text(getObjectText("newFeatures"));
                            $("#appcontainer").html('<div id="grid"></div>');
                            init();
                        });
                    }]
                })
                .when('/wizard/:code', {
                    template: emptyTemplate,
                    controller: [
                        "$routeParams",
                        function (params) {
                            if (fromEmptyHash) {
                                fromEmptyHash = false;
                                return;
                            }
                            setLastLocation();
                            requireConfigAndMore([window.includesVersion + "/Magic/Views/Js/Controllers/Magic_WizardController.js"], function (init) {
                                var currentMenuLabel = $(".menuId-" + params.menuId).find("a").text();
                                $(".page-title #spanbig").text(currentMenuLabel ? currentMenuLabel : "Wizard");
                                $(".page-title #spansmall").text("");
                                $("#appcontainer").html('<div id="grid"></div>');
                                init(params.code);
                        });
                    }]
                })
                .when('/', {
                    template: emptyTemplate,
                    controller: [
                        "$location",
                        function ($location) {
                            if (location.search.match("path=")) {
                                $location.path(location.search.match(/path=([^&]+)/)[1]);
                            }
                            else if (getLastLocation())
                                $location.path(getLastLocation());
                        }]
                })
                .when('/edit/:code/:rowid', {
                    template: emptyTemplate,
                    controller: [
                        "$routeParams",
                        function (params) {
                            var code = params.code;
                            var rowid = params.rowid;
                            if (fromEmptyHash) {
                                fromEmptyHash = false;
                                return;
                            }
                            setLastLocation();
                            requireConfigAndMore([window.includesVersion + "/Magic/Views/Js/Controllers/Magic_GridEditDisplayController.js"], function (init) {
                                var currentMenuLabel = $(".menuId-" + params.menuId).find("a").text();
                                $(".page-title #spanbig").text(currentMenuLabel ? currentMenuLabel : ""); //no title until it's loaded (instead of EditPagesDisplay)
                                $(".page-title #spansmall").text("");
                                $("#appcontainer").html('<div id="grid"></div>');
                                init(code, rowid);
                            });
                        }]
                })
                .when('/new/:code/:rowid', {
                    template: emptyTemplate,
                    controller: [
                        "$routeParams",
                        function (params) {
                            var code = params.code;
                            var rowid = params.rowid;
                            if (fromEmptyHash) {
                                fromEmptyHash = false;
                                return;
                            }
                            setLastLocation();
                            requireConfigAndMore([window.includesVersion + "/Magic/Views/Js/Controllers/Magic_GridEditDisplayController.js"], function (init) {
                                var currentMenuLabel = $(".menuId-" + params.menuId).find("a").text();
                                $(".page-title #spanbig").text(currentMenuLabel ? currentMenuLabel : ""); //no title until it's loaded (instead of EditPagesDisplay)
                                $(".page-title #spansmall").text("");
                                $("#appcontainer").html('<div id="grid"></div>');
                                init(code, rowid);
                            });
                        }]
                })
                .when('/powerbi/workspace/:workspaceId/report/:reportId', {
                    template: emptyTemplate,
                    controller: [
                        "$routeParams",
                        function (params) {
                            $('#layout-condensed-toggle').click();       //hide sidebar menu
                            $('.page-title > a[href*="javascript:history.back()"]').detach();
                            $('#main-menu').detach()            //remove main menu
                            $('.header').detach();
                            $('ul.breadcrumb').remove();
                            $('div.page-title').remove();
                            $('#container').append('<iframe id="powerBiFullscreenFrame" src="" hidden></iframe>')

                            var url = "/api/PowerBi/GetEmbedLink";
                            var data = {
                                workspace_ID: params.workspaceId,
                                report_ID: params.reportId,
                            };

                            $.ajax({
                                type: "POST",
                                url: url,
                                data: JSON.stringify(data),
                                contentType: "application/json; charset=utf-8",
                                success: function (result) {
                                    $('.page-content,.content').css("padding", "10px");
                                    
                                    var response = JSON.parse(result);
                                    if (response && response.url) {
                                        $('#powerBiFullscreenFrame').css('width', '100vw');
                                        $('#powerBiFullscreenFrame').css('height', '95vh');
                                        $('#powerBiFullscreenFrame').removeAttr('hidden');
                                        $('#powerBiFullscreenFrame').attr('src', response.url);
                                    }
                                },
                                error: function (message) {
                                    console.log("Error while loading PowerBI-fullscreen:::", message);
                                }
                            });
                        }]
                });
        }]);

    angular.bootstrap(document.getElementById("routing-content"), ['routing']);
});