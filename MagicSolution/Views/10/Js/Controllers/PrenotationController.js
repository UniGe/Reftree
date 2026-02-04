define(["angular", window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Directives/Kiba.js", "angular-filter", "angular-sanitize", "angular-strap-tpl", "angular-magic-form"], function (angular, kiba) {
    angular
        .module("Prenotation", ["Kiba", "angular.filter", "ngSanitize", "mgcrea.ngStrap", "magicForm"])
        .controller("PrenotationController", [
            "$http",
            "$scope",
            "$sce",
            "$filter",
            "$timeout",
            function ($http, $scope, $sce, $filter, $timeout) {
                var self = this;
                self = kiba(self, $http, $scope, $sce, $filter, $timeout);

                self.lang.book = getObjectText("book");
                self.lang.prenotationData = getObjectText("prenotationData");
                self.lang.day = getObjectText("day");
                self.lang.from = getObjectText("from");
                self.lang.to = getObjectText("t");
                self.lang.toPay = getObjectText("toPay");
                self.lang.bought = getObjectText("bought");
                self.lang.remaining = getObjectText("remaining");
                self.lang.printReceipt = getObjectText("printReceipt");
                self.lang.note = getObjectText("note");
                self.lang.messages.sucPrenotation = getObjectText("sucPrenotation");
                self.lang.yes = getObjectText("yes");
                self.lang.no = getObjectText("no");
                self.lang.printInvoice = getObjectText("printInvoice");

                var baseAdd = self.add;
                self.add = function (type, data) {
                    if (self.checkInData[type].length)
                        self.checkInData[type] = [];
                    baseAdd(type, data);
                };

                self.checkBookingData = function () {
                    if (!self.checkCheckInData())
                        return;
                    if (self.bookingData.$invalid)
                        return;
                    self.action = 'print';
                };

                self.book = function (shallPrint) {
                    if (!self.checkCheckInData())
                        return;
                    if (self.bookingData.$invalid)
                        return;

                    self.spinner.checkIn = $sce.trustAsHtml(mediumSpinnerHTML); //magicutils.js
                    var data = {
                        PRENOT_DATA_INGRESSO: self.checkInData.day + "T" + self.checkInData.from + ".000",
                        PRENOT_DATA_USCITA: self.checkInData.day + "T" + self.checkInData.to + ".000",
                        PRENOT_PROGET_ID: self.checkInData.project,
                        PRENOT_ANASED_ID: self.checkInData.venue.ANASED_ID,
                        PRENOT_SPASED_ID: self.checkInData.room,
                        PRENOT_NUM_PERSONE: self.checkInData.amountChildren,
                        PRENOT_NOTE: self.checkInData.note,
                        PRENOT_IMPORTO: self.checkInData.toPay,
                        PRENOT_ACCONTO: self.checkInData.bought,
                        PRENOT_RESPONSABILE_ID: self.checkInData.responsible[0].ANAGRA_ID,
                        PRENOT_MINORE_ID: self.checkInData.children[0].ANAGRA_ID,
                        PRENOT_DESCR: self.checkInData.children[0].ANAGRA_DENOMINAZIONE + " - " + self.checkInData.responsible[0].ANAGRA_COGNOME + " " + self.checkInData.responsible[0].ANAGRA_NOME
                        //Magic_Calendar_ID: self.checkInData.amountChildren,
                    };
                    var post = buildGenericPostInsertUpdateParameter("create", "dbo.PRENOT_Prenotazioni", "PRENOT_ID", "dbo.Magic_Cmnds_ins_upd_del_stmt", "JSON", null, null, data, undefined);
                    var promise = $http.post("/api/GenericSqlCommand/PostI", post)
                        .then(function (res) {
                            if (res.data.Errors) {
                                kendoConsole.log(res.data.Errors, true);
                                throw new Error(res.data.Errors);
                                return;
                            }
                            self.success("sucPrenotation");
                            return res;
                        },
                        function (res) {
                            kendoConsole.log(res.data, true);
                        })
                        .finally(function () {
                            self.spinner.checkIn = "";
                        });
                    if (shallPrint)
                        self.print(promise);
                };

                self.print = function (promise) {
                    promise.then(function (res) {
                        if (res.data.Errors) {
                            return;
                        }
                        if (!res.data.Data || !res.data.Data.length)
                            return;
                        var data = {
                            PRENOTATION_ID: res.data.Data[0].Table[0].PRENOT_ID
                        };
                        var post = buildGenericPostInsertUpdateParameter("create", "dbo.FATTES_testata" /*table*/, "FATTES_ID" /*table_id_name*/, "dbo.USP_BUILD_INVOICE", "XML", null, null, data, undefined);
                        $http.post("/api/GenericSqlCommand/PostI", post)
                            .then(function (res) {
                                if (res.data.Errors) {
                                    kendoConsole.log(res.data.Errors, true);
                                    return;
                                }
                                $.fileDownload("/Helpers/downloadreport?report=/kiba/invoice&id=" + res.data.Data[0].Table[0].FATTES_ID + "&format=pdf");
                            },
                            function (res) {
                                kendoConsole.log(res.data, true);
                            });
                    });
                };

                self.init();
            }
        ]);
});