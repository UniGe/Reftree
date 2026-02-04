(function () {
    var dependencies = ["angular", "MagicSDK", "angular-kendo", "angular-search-drop", "bootstrap-tagsinput"];
    var angular,
    controllerName = "Fascicolo";

    define(dependencies, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    // Helper function to read cookies
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Function to show a notification to the user
    function showNotification(message) {
        // Depending on your UI framework, this could be:
        // 1. A simple alert: alert(message);
        // 2. A toast notification
        // 3. A modal dialog
        // 4. Or updating a status element on the page

        // For example, with Kendo UI:
        if (typeof kendo !== 'undefined' && kendo.ui && kendo.ui.notification) {
            var notification = $("<div></div>").kendoNotification({
                position: {
                    pinned: true,
                    top: 30,
                    right: 30
                },
                autoHideAfter: 5000,
                stacking: "down"
            }).data("kendoNotification");

            notification.success(message);
        } else {
            // Fallback to alert if Kendo UI is not available
            alert(message);
        }
    }
    function init() {
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true, false, "onTemplateLoaded"))[0];
        angular.bootstrap(element, [controllerName]);
    }
                
    function controller(angular, MF) {
        angular
            .module(controllerName, ["kendo.directives", "searchDrop"])
            .controller(controllerName + "Controller",
            [
                '$timeout',
                '$scope',
                '$http',
                '$element',
                function ($timeout, $scope, $http, $element) {
                    var self = this;
                    
                    self.searchPlaceholder = getObjectText("Selezionafascicolo...");
                    self.transSelBO = getObjectText("Selezionaelementi...");
                    self.transDocumenti = getObjectText("Elencodeidocumentipresentinelfascicolo");
                    self.transDocumentiMissing = getObjectText("Elencodeidocumentimancantiperlaproduzionecompletadelfascicolo");
                    self.transDownload = getObjectText("Downloadfascicolo");

                    self.init = function () {
                        self.showSpinner = false;
                        self.getFascicoli().then(function (res) {
                            if (res && res.length) {
                                self.fascicoli = res[0];
                                //$timeout() apertura combo automatica richiesta da revalo. 2019-04-30
                                $timeout(function () {
                                    $('search-drop').find('input').click();
                                }, 1000);
                            }
                        });
                    };

                    self.onTemplateLoaded = function () {
                        self.$tagsinput = $element.parent().find("#fascicolo-bo-tagcloud");
                        self.$tagsinput.tagsinput({
                            itemValue: "__description",
                            freeInput: false
                        });
                        self.$tagsinput.on("itemRemoved", function () {
                            self.filterDocumentGrids();
                        });
                        self.$tagsinput.on("itemAdded", function () {
                            self.filterDocumentGrids();
                        });
                    };

                    self.filterDocumentGrids = function () {
                        var bOIds = self.$tagsinput.tagsinput("items");
                        if (!bOIds || !bOIds.length) {
                            self.showDocumentGrids = false;
                            $timeout();
                            return;
                        }
                        self.selectedBOs = {
                            DOSSIE_ID: self.selectedFascicolo.DO_DOSSIE_ID,
                            DO_Magic_BusinessObjectType_ID: self.selectedFascicolo.DO_Magic_BusinessObjectType_ID,
                            OBJIDS: JSON.stringify(bOIds.map(function (v) {
                                return v.BOId;
                            })),
                            request: "grid"
                        };
                        $timeout(function () { 
                            if (!self.documentGrids)
                                self.documentGrids = self.createDocumentGrids();
                            self.showDocumentGrids = true;
                            self.documentGrids.then(function () {
                                self.DO_V_DOCUME_DOSSIERGrid.dataSource.read();
                                self.DO_V_DOCUME_MISSINGGrid.dataSource.read();
                            });
                        });
                    };

                    self.createDocumentGrids = function () {
                        var deferred = $.Deferred();
                        $.when(MF.kendo.getGridObject({ gridName: "DO_V_DOCUME_DOSSIER" }), MF.kendo.getGridObject({ gridName: "DO_V_DOCUME_MISSING" }))
                            .then(function (DO_V_DOCUME_DOSSIERgridObject, DO_V_DOCUME_MISSINGgridObject) {
                                var oldParamMap = DO_V_DOCUME_DOSSIERgridObject.dataSource.transport.parameterMap;
                                DO_V_DOCUME_DOSSIERgridObject.dataSource.transport.parameterMap = function (options, operation) {
                                    if (operation == "read") {
                                        options.data = JSON.stringify(self.selectedBOs);
                                    }
                                    return oldParamMap(options, operation);
                                };
                                DO_V_DOCUME_MISSINGgridObject.dataSource.transport.parameterMap = function (options, operation) {
                                    if (operation == "read") {
                                        options.data = JSON.stringify(self.selectedBOs);
                                    }
                                    return JSON.stringify(options);
                                };
                                DO_V_DOCUME_MISSINGgridObject.dataSource.transport.read.url = "/api/Fascicolo/GetMissing";
                                $.when(
                                    MF.kendo.appendGridToDom({
                                        kendoGridObject: DO_V_DOCUME_DOSSIERgridObject,
                                        selector: "DO_V_DOCUME_DOSSIERGrid"
                                    }).then(function (grid) {
                                        self.DO_V_DOCUME_DOSSIERGrid = grid;
                                    }),
                                    MF.kendo.appendGridToDom({
                                        kendoGridObject: DO_V_DOCUME_MISSINGgridObject,
                                        selector: "DO_V_DOCUME_MISSINGGrid"
                                    }).then(function (grid) {
                                        self.DO_V_DOCUME_MISSINGGrid = grid;
                                    })
                                )
                                .then(function () {
                                    deferred.resolve();
                                });
                            });
                        return deferred.promise();
                    };

                    self.createBOGrid = function (gridName) {
                        if (self.gridName == gridName) {
                            self.showBOGrid = true;
                            $timeout();
                            return;
                        }
                        self.gridName = gridName;
                        MF.kendo
                            .getGridObject({
                                gridName: gridName
                            })
                            .then(function (gridObject) {
                                if (self.gridName != gridName)
                                    return;
                                gridObject.selectable = true;
                                gridObject.change = function () {
                                    var selectedRows = this.select();
                                    for (var i = 0; i < selectedRows.length; i++) {
                                        self.$tagsinput.tagsinput("add", self.addDescription(this.dataItem(selectedRows[i]), gridObject));
                                    }
                                };
                                self.bOGridObject = gridObject;
                                self.showBOGrid = true;
                                $timeout();
                            });
                    };

                    self.addDescription = function (item, gridObject) {
                        var description = ""
                            count = 0;
                        $.each(gridObject.columns, function (k, v) {
                            if (v.field) {
                                count++;
                                description += item[v.field] + " - ";
                            }
                            if (count == 3)
                                return false;
                        });
                        item.__description = description.substring(0, description.length - 3);
                        return item;
                    };

                    self.fascicoloSelected = function (value) {
                        if (!value) {
                            self.showBOGrid = false;
                            self.showDocumentGrids = false;
                            $timeout();
                            return;
                        }
                        MF.api
							.get({
								storedProcedureName: "config.cfg_usp_ret_botypes",
								data: { BO_ID: value.DO_Magic_BusinessObjectType_ID }
                            })
                            .then(function (res) {
                                if (res.length) {
                                    self.selectedFascicolo = value;
                                    self.createBOGrid(res[0][0].MagicGridName);
                                    self.$tagsinput.tagsinput("removeAll");
                                    self.filterDocumentGrids();
                                }
                            });
                    };

                    self.getFascicoli = function (descriptionFilter) {
                        if (!descriptionFilter)
                            descriptionFilter = "";
                        return MF.api
                            .get({
                                storedProcedureName: "core.usp_do_fascicolo_GetList2",
                                data: {
                                    descriptionFilter: descriptionFilter
                                }
                            });
                    };

                   self.downloadFascicolo = function () {
                        if (!self.DO_V_DOCUME_DOSSIERGrid || self.DO_V_DOCUME_DOSSIERGrid.dataSource.total() <= 100 || confirm(getObjectText("filesCountWarning").format(self.DO_V_DOCUME_DOSSIERGrid.dataSource.total()))) {
                            if (self.DO_V_DOCUME_DOSSIERGrid.dataSource.total() == 0) {
                                alert(getObjectText("noFilesCountWarning"));
                                return;
                            }

                            self.showSpinner = true;
                            var data = $.extend({}, self.selectedBOs);
                            data.reqtype = "dossier";
                            data.objtype = "";
                            data.filters = self.DO_V_DOCUME_DOSSIERGrid.dataSource.filter();

                            $.fileDownload('/api/Fascicolo/GetDossier/', {
                                data: data,
                                httpMethod: "POST",
                                successCallback: function (url, responseText) {
                                    // Add timeout to ensure cookies are properly set
                                    setTimeout(function () {
                                        var jobType = getCookie("fileDownloadJobType");
                                        var jobId = getCookie("fileDownloadJobId") || "unknown";

                                        // Check both cookies and response content for more reliability
                                        if (jobType === "rabbitmq" || (responseText && responseText.indexOf("elaborazione") !== -1)) {
                                            // This was a RabbitMQ job, not an immediate download
                                            showNotification("Il dossier è in fase di elaborazione. Riceverai una notifica via email quando sarà pronto per essere scaricato.");

                                            // Clear the cookies after reading them
                                            document.cookie = "fileDownloadJobType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                            document.cookie = "fileDownloadJobId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                        } else {
                                            // This was an immediate file download - always provide feedback
                                            showNotification("Download del dossier avviato.");
                                            console.log("Dossier download started");
                                        }

                                        self.showSpinner = false;
                                        $timeout(); // Trigger digest cycle to update UI
                                    }, 1000); // Small delay to ensure cookies are registered
                                },

                                failCallback: function (responseHtml, url) {
                                    // Improved error handling
                                    var errorMessage = "Si è verificato un errore durante l'elaborazione del dossier.";

                                    if (responseHtml && typeof responseHtml === "string") {
                                        if (responseHtml.indexOf("già in fase di elaborazione") !== -1) {
                                            errorMessage = "Un dossier è già in fase di elaborazione. Si prega di attendere il completamento dell'operazione corrente.";
                                        } else if (responseHtml.indexOf("Servizio temporaneamente non disponibile") !== -1) {
                                            errorMessage = "Servizio temporaneamente non disponibile. Si prega di riprovare più tardi.";
                                        }
                                    }

                                    showNotification(errorMessage, "error");
                                    console.error("Error processing dossier request: ", responseHtml);

                                    self.showSpinner = false;
                                    $timeout(); // Trigger digest cycle to update UI
                                }
                            });
                        }
                    };
                    self.init();
                }
           ]);
    }

})();