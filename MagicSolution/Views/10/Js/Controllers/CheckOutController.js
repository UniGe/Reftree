define(["angular", window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Directives/Kiba.js", "angular-sanitize", "angular-filter"], function (angular, Kiba) {
    angular
        .module("CheckOut", ["ngSanitize", "angular.filter"])
        .controller("CheckOutController",
            [
                '$http',
                '$sce',
                '$scope',
                '$q',
                '$timeout',
                "$filter",
                function ($http, $sce, $scope, $q, $timeout, $filter) {
                    var self = this;
                    self = Kiba(self, $http, $scope, $sce, $filter, $timeout);
                    self.updateCheckOutData = function () {
                        self.spinner.refresh = $sce.trustAsHtml(mediumSpinnerHTML); //magicutils.js
                        $http
                            .post(
                                "/api/GENERICSQLCOMMAND/GetWithFilter",
                                {
                                    GridName: 'dbo.V_Checkout',
                                    table: "dbo.V_Checkout",
                                    order: "REGPRE_CHECK_IN",
                                    where: "REGPRE_CHECK_OUT IS NULL AND REGPRE_ANASED_ID = " + self.checkInData.venue.ANASED_ID + " AND REGPRE_PROGET_ID = " + self.checkInData.project
                                }
                            )
                            .then(function (res) {
                                self.refreshTime = Date.now();
                                if (res.data.Data && res.data.Data.length) {
                                    self.checkOutData = res.data.Data[0].Table;
                                }
                                else {
                                    self.checkOutData = [];
                                }
                            })
                            .finally(function () {
                                self.spinner.refresh = "";
                            });
                    };

                    self.toCheckOut = [];

                    self.lang.checkOut = "Check out";
                    self.lang.birthday = getObjectText("birthday");
                    self.lang.checkInTime = getObjectText("checkInTime");
                    self.lang.toCheckOut = getObjectText("toCheckOut");
                    self.lang.messages.sucCheckOut = getObjectText("sucCheckOut");
                    self.lang.refresh = getObjectText("refreshcheckinlist");
                    self.lang.prenotation = getObjectText("prenotation");
                    self.lang.errorSelResponsible = getObjectText("errorSelResponsible");
                    self.lang.yes = getObjectText("yes");
                    self.lang.no = getObjectText("no");
                    self.lang.printInvoice = getObjectText("printInvoice");

                    self.checkCheckOutData = function () {
                        if (!self.toCheckOut.length) {
                            return false;
                        }
                        for (var i = 0; i < self.toCheckOut.length; i++) {
                            if (!self.toCheckOut[i].REGPRE_CHECK_OUT_RESP_ID) {
                                self.message = self.lang.errorSelResponsible;
                                self.messageType = "danger";
                                return false;
                            }
                        }
                        self.message = "";
                        return true;
                    };

                    self.confirmCheckOut = function (shallPrintInvoice) {
                        if (!self.checkCheckOutData())
                            return;
                        self.spinner.checkOut = $sce.trustAsHtml(mediumSpinnerHTML); //magicutils.js
                        var promises = [];
                        $.each(self.toCheckOut, function (k, v) {
                            //TODO: add anagara_id for checkout_resp?
                            v.REGPRE_CHECK_OUT = toTimeZoneLessString(new Date());
                            var post = buildGenericPostInsertUpdateParameter("update", "dbo.REGPRE_Registrazioni_presenze", "REGPRE_ID", "dbo.Magic_Cmnds_ins_upd_del_stmt", "JSON", null, null, v, v.REGPRE_ID);
                            promises.push(
                                $http
                                    .post("/api/GenericSqlCommand/PostU/" + v.REGPRE_ID, post)
                                );
                        });
                        $q.all(promises)
                            .then(function () {
                                if (shallPrintInvoice)
                                    self.printInvoice();
                                self.updateCheckOutData();
                                self.success("sucCheckOut");
                                self.reset();
                            })
                            .finally(function () {
                                self.spinner.checkOut = "";
                            });
                    };

                    self.reset = function () {
                        self.toCheckOut = [];
                        self.action = '';
                    };

                    self.add = function (data) {
                        if (self.indexOfToCheckOut(data) > -1)
                            return;
                        self.toCheckOut.push(data);
                        self.getAssociatedResponsibles([data.REGPRE_ANAGRA_ID])
                            .then(function (res) {
                                if (res.data.Data && res.data.Data.length) {
                                    data.responsibles = res.data.Data[0].Table;
                                    if (data.responsibles.length == 1) {
                                        data.REGPRE_CHECK_OUT_RESP_ID = data.responsibles[0].ANAGRA_ID;
                                    }
                                    //var index = indexOfToCheckOut(data);
                                    //if (index != -1) {
                                        //self.toCheckOut[index].responsibles = res.data.Data[0].Table;
                                    //}
                                }
                            })
                    };

                    self.remove = function (data) {
                        var index = self.indexOfToCheckOut(data);
                        if (index !== -1)
                            self.toCheckOut.splice(index, 1);
                    };

                    self.indexOfToCheckOut = function (data) {
                        var i = 0;
                        while (i < self.toCheckOut.length) {
                            if (self.toCheckOut[i].REGPRE_ID == data.REGPRE_ID) {
                                return i;
                            }
                            i++;
                        }
                        return -1;
                    };

                    self.formatContactData = function (data) {
                        var contactData = [];
                        if(data.ANARIF_TELEFONO)
                            contactData.push(data.ANARIF_TELEFONO);
                        if(data.ANARIF_TELEFONO2)
                            contactData.push(data.ANARIF_TELEFONO2);
                        if(data.ANARIF_CELLULARE)
                            contactData.push(data.ANARIF_CELLULARE);
                        return "(" + contactData.join(", ") + ")";
                    };

                    self.printInvoice = function () {
                        var data = {
                            PRENOTATION_ID: self.checkInData.prenotatione,
                            services: $.map(self.services, function (v) { if (v.AMOUNT) return { amount: v.AMOUNT, PROLIS_PRODOT_ID: v.PROLIS_PRODOT_ID } }),
                            REGPRE_IDS: $.map(self.toCheckOut, function (v) { return v.REGPRE_ID }).join(",")
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
                    };

                    self.showServices = function () {
                        self.selectedServices = [];
                        self.updatePrenotationData().then(function () {
                            if (self.prenotations.length)
                                $.each(self.toCheckOut, function (k, v) {
                                    if (v.PRENOT_ID) {
                                        self.checkInData.prenotatione = v.PRENOT_ID;
                                        return false;
                                    }
                                });
                        });
                        $http
                            .post(
                                "/api/GENERICSQLCOMMAND/GetWithFilter",
                                {
                                    GridName: "dbo.V_LISTIN_PROGETTI",
                                    table: "dbo.V_LISTIN_PROGETTI",
                                    order: "PRODOT_DESCRIZIONE",
                                    where: "LISTIN_PROGET_ID = " + self.checkInData.project
                                }
                            )
                            .then(function (res) {
                                if (res.data.Data && res.data.Data.length) {
                                    self.services = res.data.Data[0].Table;
                                }
                                else {
                                    self.services = [];
                                }
                            })
                    };

                    self.calcTimeSpent = function (dateCheckIn) {
                        var date = new Date(dateCheckIn);
                        var dateDiff = Date.now() - date.getTime();
                        var hours = Math.floor(dateDiff / (1000 * 60 * 60));
                        var minutes = (dateDiff % (60 * 60 * 1000)) / (1000 * 60);
                        return hours + ':' + Math.round(minutes);
                    };

                    (function () {
                        self.init()
                        .then(function () {
                            self.updateCheckOutData();
                        })
                    })();
                }
            ]
        )
        .filter("filterOr", function () {
            return function (input, searchValue, searchProperties) {
                if(!searchValue)
                    return input;
                searchValue = searchValue.toLowerCase();
                var res = [];
                if (searchProperties && searchProperties.length) {
                    $.each(input, function (k, v) {
                        $.each(searchProperties, function (kk, vv) {
                            if (v[vv] && v[vv].toLowerCase().indexOf(searchValue) > -1) {
                                res.push(v);
                                return false;
                            }
                        });
                    });
                }
                else {
                    $.each(input, function (k, v) {
                        $.each(v, function (kk, vv) {
                            if (v[vv] && v[kk].toLowerCase().indexOf(searchValue) > -1) {
                                res.push(v);
                                return false;
                            }
                        });
                    });
                }
                return res;
            };
        });
});