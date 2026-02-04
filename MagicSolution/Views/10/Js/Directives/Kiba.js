define(["angular", "MagicSDK", "angular-ui-select"], function (angular, magic) {
    function adviceCopied() {
        return kendoConsole.log(getObjectText("anagraCopied"));
    }

    angular
        .module("Kiba", ['ui.select'])
        .directive("childrenTable", [
            function () {
                return {
                    templateUrl: '/Views/' + window.ApplicationCustomFolder + '/Templates/ChildrenTable.html',
                    scope: {
                        data: '=',
                        lang: '=',
                        onSelect: '&',
                        selectLabel: '@',
                        copy: '=',
                        project: '='
                    },
                    link: function ($scope, $element, $attrs) {
                        $scope.select = function (selectedElement) {
                            if ($scope.onSelect)
                                $scope.onSelect({
                                    selectedElement: selectedElement
                                });
                        };
                        $scope.paste = function (child) {
                            $.each(child, function (k, v) {
                                if (v === undefined || v === null)
                                    delete child[k];
							});
                            $scope.copy.addToPeopleStore($.extend({}, child));
                            adviceCopied();
                            //$scope.copy.anagra['children'] = $.extend({}, child);
                            //$scope.copy.action = 'children';
                        };
                        $scope.checkAge = function (child) {
                            return isAgeOk($.extend(child, $scope.project)) ? '' : 'danger';
                        };
                    }
                }
            }
        ])
        .directive("responsibleTable", [
                function () {
                    return {
                        templateUrl: '/Views/' + window.ApplicationCustomFolder + '/Templates/ResponsibleTable.html',
                        scope: {
                            data: '=',
                            lang: '=',
                            onSelect: '&',
                            selectLabel: '@',
                            showRelation: '@',
                            copy: '='
                        },
                        link: function ($scope, $element, $attrs) {
                            $scope.select = function (selectedElement) {
                                if ($scope.onSelect)
                                    $scope.onSelect({
                                        selectedElement: selectedElement
                                    });
                            }
                            $scope.paste = function (responsible) {
                                $.each(responsible, function (k, v) {
                                    if (v === undefined || v === null)
                                        delete responsible[k];
                                });
                                $scope.copy.addToPeopleStore($.extend({}, responsible));
                                adviceCopied();
                                //$scope.copy.anagra['responsible'] = $.extend({}, responsible);
                                //$scope.copy.action = 'responsible';
                            }
                        }
                    }
                }
        ]);

    return function (self, $http, $scope, $sce, $filter, $timeout) {
        var userCode = window.ApplicationInstanceId + "-" + window.Username,
            checkInDataCode = "checkIn-" + userCode;

        self.searchType = "";
        self.searchResult = {};
        self.spinner = {};
        self.anagra = {
            responsible: {},
            children: {}
        };

        self.responsibleHistory = [];
        self.projectData = [];
        self.checkInData = {
            children: [],
            responsible: []
        };
        self.code = {
            children: "MIN",
            responsible: "RES"
        };

        self.lang = {
            amountChildren: getObjectText("amountChildren"),
            project: getObjectText("project"),
            venue: getObjectText("venue"),
            room: getObjectText("room"),
            checkAvailability: getObjectText("checkAvailability"),
            responsible: getObjectText("responsible"),
            children: getObjectText("children"),
            addNewChild: getObjectText("addNewChild"),
            addNewResponsible: getObjectText("addNewResponsible"),
            name: getObjectText("name"),
            surname: getObjectText("surname"),
            birthdate: getObjectText("birthdate"),
            birthLocation: getObjectText("birthLocation"),
            taxnumber: getObjectText("taxnumber"),
            relationWithChild: getObjectText("relationWithChild"),
            select: getObjectText("select"),
            remove: getObjectText("remove"),
            search: getObjectText("search"),
            //noResult: "Nothing found",
            empty: getObjectText("empty"),
            responsibleHistory: getObjectText("responsibleHistory"),
            searchResults: getObjectText("searchResults"),
            checkInData: getObjectText("checkInData"),
            checkIn: "Check in",
            reset: getObjectText("reset"),
            freeCapacity: getObjectText("freeCapacity"),
            totalCapacity: getObjectText("totalCapacity"),
            save: getObjectText("save"),
            back: getObjectText("back"),
            terms: getObjectText("terms"),
            foto: getObjectText("foto"),
            exit: getObjectText("exit"),
            doc: getObjectText("doc"),
            changeVenue: getObjectText("changeVenue"),
            messages: {
                noResOrChild: getObjectText("noResOrChild"),
                acceptTerms: getObjectText("acceptTerms"),
                sucCheckIn: getObjectText("sucCheckIn"),
                error: getObjectText("error"),
                success: getObjectText("success"),
                noProjectAssigned: getObjectText("noProjectAssigned")
            },
            confirm: getObjectText("confirmCheckIn"),
            prenotation: getObjectText("prenotation"),
            setRights: getObjectText("setRights"),
            checkForErrors: getObjectText("checkForErrors"),
            book: getObjectText("book"),
            problematiche: getObjectText("problematiche"),
            tessere: getObjectText("tessere"),
            copy: getObjectText("copy"),
            promo: getObjectText("Promo"),
            setPromo: getObjectText("setPromo"),
            pressEnter: getObjectText("pressEnter"),
            maxCapacity: getObjectText("maxCapacity"),
            totReservation: getObjectText("totReservation"),
            approvedPrenotation: getObjectText("approvedPrenotation"),
            selPeriod: getObjectText("selPeriod")           
        };

        self.peopleStore = getLocalUserData("kibaAnagre");
        if (!self.peopleStore)
            self.peopleStore = [];

        self.extend = function (objectToExtend) {
            delete objectToExtend.$$hashKey;
            return $.extend({}, objectToExtend);
        };

        self.init = function () {
            return $http
                .post(
                    "/api/GENERICSQLCOMMAND/GetWithFilter",
                    {
                        GridName: "dbo.V_CheckIn_ProgettoSedeAula",
                        table: "dbo.V_CheckIn_ProgettoSedeAula",
                        order: "PROGET_ID",
                        where: "User_ID = {userId}",
                        parse: true
                    }
                )
                .then(
                    function (res) {
                        if (res.data.Data && res.data.Data.length) {
                            self.disableButtons = false;
                            self.projectData = res.data.Data[0].Table;
                          //  var checkInData = localStorage.getItem(checkInDataCode);
                          /*  if (checkInData) {
                                checkInData = JSON.parse(checkInData);
                                self.checkInData.project = checkInData.project;
                                self.checkInData.venue = checkInData.venue;
                                self.checkInData.room = checkInData.room;
                            }
                            else {*/
                                if (self.projectData.length) {
                                    self.checkInData.project = self.projectData[0].PROGET_ID;
                                    self.checkInData.venue = $filter("filter")(self.projectData, { PROGET_ID: self.checkInData.project })[0];//.ANASED_ID;
                                    self.checkInData.room = self.checkInData.venue.SPASED_ID;
                                }
                           // }

                        }
                        else
                            self.success("noProjectAssigned", "danger", true);
                    },
                    function (res) {
                        console.log("error on retrieving project data");
                    }
                );
        };
        self.disableButtons = true;

        self.getProjectById = function (projectId) {
            return $filter("filter")(self.projectData, { PROGET_ID: projectId })[0];
        };

        self.addNew = function (type) {
            self.message = "";
            self.action = type;
            if (type == "children")
                self.getProblematiche();
            else
                self.getTessere();
        };

        self.resetAction = function () {
            self.action = '';
        };

        self.resetAnagra = function (type) {
            self.anagra[type] = {};
        };

        self.save = function (type, form) {
            $scope.$broadcast('schemaFormValidate');
            if (form.$valid) {
                self.anagra[type].T_ANATIP_CODICE = self.code[self.action];

                if (type == "children") {
                    var today = new Date();
                    var birthDate = new Date(self.anagra[type].ANAGRA_DATA_NASCITA);
                    var age = today.getFullYear() - birthDate.getFullYear();
                    var m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }

                    if ((age < 3 || age >= 12) && self.checkInData.venue.PROGET_DESCRIZIONE == "Twenty Kuni Kids Park") {
                        kendoConsole.log(getObjectText("ageControl"), true);
                        return;
                    }
                }
                if (self.anagra[type].ANAGRA_DATA_NASCITA)
                    self.anagra[type].ANAGRA_DATA_NASCITA = toTimeZoneLessString(new Date(self.anagra[type].ANAGRA_DATA_NASCITA)); //magicutils.js
                var post = buildGenericPostInsertUpdateParameter("create", "dbo.V_ANAGRA", "ANAGRA_ID", "dbo.USP_INS_UPD_DEL_ANAGRA", "XML", null, null, self.anagra[type], undefined);
                $http.post("/api/GenericSqlCommand/PostI", post)
                    .then(function (res) {
                        if (res.data.Errors) {
                            kendoConsole.log(res.data.Errors, true);
                            return;
                        }
                        self.checkInData[type].push(res.data.Data[0].Table[0]);
                        var promises = [];
                        if (type == "children" && self.selectedProblems && self.selectedProblems.length) {
                            self.updateResponsibleHistory();
                            promises = self.saveProblematiche(res.data.Data[0].Table[0].ANAGRA_ID, self.selectedProblems);
                        }
                        else if (self.selectedTessere && self.selectedTessere.length) {
                            promises = self.saveTessere(res.data.Data[0].Table[0].ANAGRA_ID, self.selectedTessere);
                        }
                        var cleanUp = function () {
                            self.anagra[type] = {};
                            self.resetAction();
                            self.selectedProblems = [];
                            self.selectedTessere = [];
                            self.success("success", "success");
                        };

                        self.addToPeopleStore(self.anagra[type]);

                        //des isch zu testn
                        if (promises.length) {
                            $.when.apply(null, promises)
                                .then(function () {
                                    cleanUp();
                                }, function () {
                                    self.success("error", "danger");
                                });
                        }
                        else
                            cleanUp();
                    },
                        function (res) {
                            kendoConsole.log(res.data, true);
                        });
            }
        };

        self.addToPeopleStore = function (anagra) {
            if ($filter("filter")(self.peopleStore, { ANAGRA_ID: anagra.ANAGRA_ID }).length)
                return;
            //save data locally in order to reuse it - last 10
            self.peopleStore.unshift($.extend({}, anagra));
            delete self.peopleStore[0].ANAGRA_CODICE_FISCALE;
            delete self.peopleStore[0].ANAGRA_DATA_NASCITA; // FA: #5755
            self.peopleStore = self.peopleStore.slice(0, 10);
            setLocalUserData("kibaAnagre", self.peopleStore, true);
        }

        self.getProblematiche = function () {
            magic.api.get({
                GridName: 'dbo.T_TIPPRO_tipo_problematica',
                table: "dbo.T_TIPPRO_tipo_problematica"
            })
                .then(function (res) {
                    self.allProblems = res;
                });
        };

        self.getTessere = function () {
            magic.api.get({
                GridName: 'dbo.TESRES_tessere',
                table: "dbo.TESRES_tessere"
            })
                .then(function (res) {
                    self.allTessere = res;
                });
        };

        self.saveProblematiche = function (anagraID, problemIDs) {
            var promises = [];
            if (problemIDs)
                $.each(problemIDs, function (k, v) {
                    promises.push(magic.api.set({
                        table: "dbo.PROMIN_problemi_minore",
                        primaryKeyColumn: "PROMIN_ID",
                        data: {
                            PROMIN_TIPPRO_ID: v,
                            PROMIN_ANAGRA_ID: anagraID
                        }
                    }));
                });
            return promises;
        };

        self.saveTessere = function (anagraID, tessereIDs) {
            var promises = [];
            if (tessereIDs)
                $.each(tessereIDs, function (k, v) {
                    promises.push(magic.api.set({
                        table: "dbo.M_TESRES_RESP",
                        primaryKeyColumn: "M_TESRES_RESP_ID",
                        data: {
                            M_TESRES_RESP_TESRES_ID: v,
                            M_TESRES_RESP_ANAGRA_ID: anagraID
                        }
                    }));
                });
            return promises;
        };

        self.saveProjectInSession = function () {
            localStorage.setItem(checkInDataCode, JSON.stringify(
                self.checkInData
            ));
        };

        var timeout;
        self.search = function (type, $event) {
            if ($event && $event.keyCode !== 13) {
                return;
            }
            if (timeout)
                clearTimeout(timeout);
            if (!self.searchValue[type]) {
                self.searchResult[type] = [];
                return;
            }
            timeout = setTimeout(function () {
                self.spinner[type] = $sce.trustAsHtml(mediumSpinnerHTML); //magicutils.js
                var nameFragments = self.searchValue[type].split(" "),
                    nameSearch = "";
                for (var i = 0; i < nameFragments.length; i++) {
                    if (i != 0)
                        nameSearch += " AND ";
                    nameSearch += "ANAGRA_DENOMINAZIONE LIKE '%" + nameFragments[i] + "%'";
                }
                $http
                    .post(
                        "/api/GENERICSQLCOMMAND/GetWithFilter",
                        {
                            GridName: "dbo.V_ANAGRA",
                            table: "dbo.V_ANAGRA",
                            order: "ANAGRA_COGNOME",
                            where: "(" + nameSearch + ") AND T_ANATIP_CODICE = '" + self.code[type] + "'"
                        }
                    )
                    .then(
                        function (res) {
                            if (res.data.Data && res.data.Data.length)
                                self.searchResult[type] = res.data.Data[0].Table;
                            else
                                self.searchResult[type] = [];
                        },
                        function (res) {
                            //self.spinner[type] = self.lang.noResult;
                        }
                    )
                    .finally(function () {
                        self.spinner[type] = "";
                    });
                timeout = null;
            }, 500);
        };

        self.resetCheckInData = function () {
            self.checkInData = {
                children: [],
                responsible: [],
                project: self.checkInData.project,
                venue: self.checkInData.venue,
                room: self.checkInData.room,
            };
            self.checkedPeriods = {};
            self.timetable = [];
            self.searchPeriod = {};
            self.searchResult = {};
            self.selectedVenues = [];
            self.responsibleHistory = [];
            self.resetAction();
        };

        self.add = function (type, data) {
            if (self.indexOfCheckInData(type, data) == -1) {
                self.checkInData[type].push(data);
                if (type == "children")
                    self.updateResponsibleHistory();
            }
        };

        self.indexOfCheckInData = function (type, data) {
            var i = 0;
            while (i < self.checkInData[type].length) {
                if (self.checkInData[type][i].ANAGRA_ID == data.ANAGRA_ID) {
                    return i;
                }
                i++;
            }
            return -1;
        };

        self.remove = function (type, data) {
            var i = 0;
            while (i < self.checkInData[type].length) {
                if (self.checkInData[type][i++].ANAGRA_ID == data.ANAGRA_ID) {
                    self.checkInData[type].splice(i - 1, 1);
                    i = self.checkInData[type].length;
                }
            }
            if (type == "children")
                self.updateResponsibleHistory();
        };

        self.updateResponsibleHistory = function () {
            var ids = [];
            for (var i = 0; i < self.checkInData.children.length; i++) {
                ids.push(self.checkInData.children[i].ANAGRA_ID);
            }
            if (!ids.length) {
                self.responsibleHistory = [];
                return;
            }
            self.getAssociatedResponsibles(ids)
                .then(function (res) {
                    if (res.data.Data && res.data.Data.length) {
                        self.responsibleHistory = res.data.Data[0].Table;
                    }
                    else {
                        self.responsibleHistory = [];
                    }
                });
        };

        self.getAssociatedResponsibles = function (ids) {
            return $http
                .post(
                    "/api/GENERICSQLCOMMAND/GetWithFilter",
                    {
                        GridName: "dbo.V_M_RESMIN_responsabili_minori",
                        table: "dbo.V_M_RESMIN_responsabili_minori",
                        order: "ANAGRA_COGNOME",
                        where: "M_RESMIN_MINORE_ID IN (" + ids.join(",") + ")"
                    }
                );
        }

        self.checkCheckInData = function () {
            if (!self.checkInData.children.length || !self.checkInData.responsible.length) {
                self.message = self.lang.messages.noResOrChild;
                self.messageType = "danger";
                return false;
            }
            self.message = "";
            return true;
        };

        self.success = function (messageName, messageType, showForever) {
            if (!messageType)
                self.resetCheckInData();
            self.message = self.lang.messages[messageName];
            self.messageType = messageType || "success";
            if (!showForever)
                $timeout(function () {
                    if (self.message == self.lang.messages[messageName])
                        self.message = "";
                }, 5000);
        };

        self.updatePrenotationData = function () {
            var startToday = new Date(); startToday.setHours(0, 0, 0, 0);
            return $http
                .post(
                    "/api/GENERICSQLCOMMAND/GetWithFilter",
                    {
                        GridName: "dbo.PRENOT_Prenotazioni",
                        table: "dbo.PRENOT_Prenotazioni",
                        order: "PRENOT_DESCR",
                        where: "PRENOT_ANASED_ID = " + self.checkInData.venue.ANASED_ID + " AND PRENOT_DATA_INGRESSO > '" + toTimeZoneLessString(startToday) + "' AND PRENOT_DESCR IS NOT NULL and PRENOT_Attiva=1",
                    }
                )
                .then(
                    function (res) {
                        if (res.data.Data && res.data.Data.length) {
                            self.prenotations = res.data.Data[0].Table;
                            self.prenotations.unshift({ PRENOT_ID: null, PRENOT_DESCR: "" });
                            self.checkInData.prenotatione = null;
                        }
                        else
                            self.prenotations = [];
                    });
        };


        self.getOverbookedChild = function (PROGET_ID, ANASED_ID, SEDCAL_DATA_INIZIO, SEDCAL_DATA_FINE, event) {
            self.getLista(PROGET_ID, ANASED_ID, SEDCAL_DATA_INIZIO, SEDCAL_DATA_FINE).then(function (res) {
                if (res.length) {
                    var output;
                    for (var i = 0; i < res[0].length; i++) {
                        if (i > 0)
                            output = output + ' <br /><br />';
                        if (i == 0)
                            output = 'Ordine di arrivo: ' + res[0][i].PRIORITA + ' <br />Bambino: ' + res[0][i].BAMBINO + ' <br /> Responsabile: ' + res[0][i].RESPONSABILE + ' <br /> Contatto: ' + res[0][i].ANARIF_RIFERIMENTO
                        else
                            output = output + 'Ordine di arrivo: ' + res[0][i].PRIORITA + ' <br />Bambino: ' + res[0][i].BAMBINO + ' <br /> Responsabile: ' + res[0][i].RESPONSABILE + ' <br /> Contatto: ' + res[0][i].ANARIF_RIFERIMENTO
                    }
                }
                
                $(event.target).kendoTooltip({
                    content: output,
                    autoHide: false,
                    showOn: "click",
                    width: 300,
                    position: "left"
                })
                    .data("kendoTooltip")
                    .show();
            });
        }

        self.getLista = function (PROGET_ID, ANASED_ID, SEDCAL_DATA_INIZIO, SEDCAL_DATA_FINE) { 
            var deferrer = $.Deferred();
            requireConfigAndMore(["MagicSDK"], function (MF) {
                MF.api.get({ storedProcedureName: "dbo.USP_LISTA_DI_ATTESA", data: { PROGET_ID: PROGET_ID, ANASED_ID: ANASED_ID, SEDCAL_DATA_INIZIO: SEDCAL_DATA_INIZIO, SEDCAL_DATA_FINE: SEDCAL_DATA_FINE } })
                    .then(function (res) {
                        deferrer.resolve(res);
                    });
            });
            return deferrer.promise();
        }



        return self;
    };
});