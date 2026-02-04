define(['angular', 'angular-kendo', 'angular-filter'], function (angular) {
    angular.module('magicChangeLog', ['kendo.directives', 'angular.filter'])
        .directive('magicChangeLog', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: {
                },
                bindToController: {
                },
                controllerAs: "mcl",
                templateUrl: '/Magic/Views/Templates/Directives/magic-change-log.html',
                controller: ["$timeout","$http", function ($timeout, $http) {
                    kendo.culture(window.culture);
                    var mcl = this;
                    mcl.loaded = false;
                    mcl.showFullImage = function (avItem) {
                        //var ww = $(window).width() * 0.5;
                        var ww = screen.width * 0.7;
                        mcl.previewImage = avItem.image;
                        mcl.previewWindow.title(avItem.Title);
                        mcl.previewWindow.setOptions({
                            width: ww
                        });

                        mcl.previewWindow.center();
                        mcl.previewWindow.open();
                    }

                    mcl.closeModal = function () {
                        $("#myModalView").data("kendoMobileModalView").close();
                    }

                    var currentYear = new Date().getFullYear().toString();

                    $http.post("/api/Magic_VersionLog/GetVersionLogsExceptForThisYear", { Anno: currentYear })
                        .then(function (res) {  //#mfapireplaced
							$timeout();
							var versionLogYears = res.data.Data.length ? res.data.Data[0].Table : [];
                            mcl.years = versionLogYears;
                            mcl.loaded = true;
                        });

                    //Il change log da visualizzare è quello standard o quello eventualmente dell'istanza corrente
                    $http.post("/api/Magic_VersionLog/GetVersionLogForYear", { AppInstance: window.ApplicationInstanceName || null, Year: currentYear })
                        .then(function (res) {  //#mfapireplaced
							var versionLog = res.data.Data.length ? res.data.Data[0].Table : [];
                            $timeout();
                            mcl.data = versionLog;
                            mcl.loaded = true;
                        });

                    mcl.getVersionLogForYear = function (anno) {
                        var hasAlreadyChild = $('#collapseYear' + anno).children().length > 0;
                        if (!hasAlreadyChild) {
                            $http.post("/api/Magic_VersionLog/GetVersionLogForYear", { AppInstance: window.ApplicationInstanceName || null, Year: anno })
                                .then(function (res) {  //#mfapireplaced
									var versionLog = res.data.Data.length ? res.data.Data[0].Table : [];
                                    $timeout();
                                    mcl.dataForYear = versionLog;
                                    mcl.loadedForYear = true;
                                });
                        }
					}
					mcl.getVersionLabel = function (versionNumber) {
						if (versionNumber)
							return "Versione " + versionNumber + " del ";
						return "";
					}
                }]
            }
        }]);
});