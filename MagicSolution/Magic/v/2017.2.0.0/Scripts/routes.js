define([
    "angular",
    "angular-route"
], function (angular) {
    var fromEmptyHash = false;

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
                .when('/notes', {
                    template: emptyTemplate,
                    controller: [function () {
                        if (fromEmptyHash) {
                            fromEmptyHash = false;
                            return;
                        }
                        setLastLocation();
                        requireConfigAndMore([window.includesVersion + "/Magic/Views/Js/Controllers/Magic_NotesController.js"], function (init) {
                            $(".page-title #spanbig").text(getObjectText("memosNotes"));
                            $(".page-title #spansmall").text("");
                            $("#appcontainer").html('<div id="grid"></div>');
                            init();
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
                                $(".page-title #spanbig").text("Wizard");
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
                });
        }]);

    angular.bootstrap(document.getElementById("routing-content"), ['routing']);
});