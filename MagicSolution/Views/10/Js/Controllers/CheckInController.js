define(["angular", "underscore", window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Directives/Kiba.js", "momentjs", "angular-sanitize", "angular-filter", "angular-magic-form"], function (angular, _, Kiba, moment) {
    angular
        .module("CheckIn", ["ngSanitize", "angular.filter", "magicForm", "Kiba"])
        .controller("CheckInController",
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

                    self.lang.terzi = getObjectText("terzi");
                    self.lang.yes = getObjectText("yes");
                    self.lang.no = getObjectText("no");
                    self.lang.selectTerzi = getObjectText("selectTerzi");

                    self.checkAvailability = function () {
                        $http
                            .post(
                                "/api/GENERICSQLCOMMAND/GetWithFilter",
                                {
                                    GridName: "dbo.REGPRE_Registrazioni_presenze",
                                    table: "dbo.REGPRE_Registrazioni_presenze",
                                    order: "REGPRE_ID",
                                    where: "REGPRE_ANASED_ID = " + self.checkInData.venue.ANASED_ID + " AND REGPRE_CHECK_OUT IS NULL",
                                    parse: true
                                }
                            )
                            .then(
                                function (res) {
                                    if (res.data.Data && res.data.Data.length) {
                                        self.freeCapacity = self.checkInData.venue.ANASED_CAPIENZA - res.data.Data[0].Table.length;
                                    }
                                    else
                                        self.freeCapacity = self.checkInData.venue.ANASED_CAPIENZA;
                            });
                    };

                    self.terziAnswers = [{ label: self.lang.yes, val: true }, { label: self.lang.no, val: false }, { label: '', val: null }];

                    self.checkIn = function () {
                        if (!self.checkCheckInData())
                            return;

                        self.spinner.checkRights = $sce.trustAsHtml(mediumSpinnerHTML); //magicutils.js
                        self.checkRights()
                            .then(function (missingRights) {
                                self.missingPromos = {};
                                var switchview = false;
                                //get all the promos that the involved persons have not declared yet
                                self.getMissingPromos().then(function (res) {

                                    if (res.data.Data.length) {
                                        $.each(res.data.Data[0].Table, function (i, v) {
                                                if (Array.isArray(self.missingPromos[v.ANAGRA_ID]))
                                                    self.missingPromos[v.ANAGRA_ID].push(v);
                                                else
                                                    self.missingPromos[v.ANAGRA_ID] = [v];
                                        });
                                        if (self.missingPromos && Object.keys(self.missingPromos).length)//there's switch of view responding to action. the 'rights' contains both promos and rights 
                                        {
                                            switchview = true;
                                            self.showPromo = true;
                                        }
                                        else self.showPromo = false;
                                    }
                                    if (missingRights.length) {
                                        self.missingRights = [];
                                        $.each(missingRights, function (k, v) {
                                            $.each(v.items, function (kk, vv) {
                                                self.missingRights.push({ type: v.type, id: vv });
                                            });
                                        });
                                        //      self.action = "rights";
                                        switchview = true;
                                        self.showRights = true;
                                    }
                                    else self.showRights = false;
                                    
                                        self.action = !switchview ? "confirm" : "rights";
                                })

                                
                            })
                            .finally(function () {
                                self.spinner.checkRights = "";
                            });
                    };

                    self.confirmCheckIn = function () {
                        var promises = [];
                        self.spinner.checkIn = $sce.trustAsHtml(mediumSpinnerHTML); //magicutils.js
                        $.each(self.checkInData.children, function (k, v) {
                            var data = {
                                REGPRE_ANAGRA_ID: v.ANAGRA_ID,
                                REGPRE_CHECK_IN_RESP_ID: self.checkInData.responsible[0].ANAGRA_ID,
                                REGPRE_PROGET_ID: self.checkInData.project,
                                REGPRE_ANASED_ID: self.checkInData.venue.ANASED_ID,
                                REGPRE_PRENOT_ID: self.checkInData.prenotatione
                            };
                            var post = buildGenericPostInsertUpdateParameter("create", "dbo.REGPRE_Registrazioni_presenze", "REGPRE_ID", "dbo.Magic_Cmnds_ins_upd_del_stmt", "JSON", null, null, data, undefined);
                            promises.push(
                                $http.post("/api/GenericSqlCommand/PostI", post)
                                    .then(function (res) {
                                        if (res.data.Errors) {
                                            kendoConsole.log(res.data.Errors, true);
                                            throw new Error(res.data.Errors);
                                        }
                                    },
                                    function (res) {
                                        kendoConsole.log(res.data, true);
                                    })
                            );
                            //save relation for children and responsibles
                            $.each(self.checkInData.responsible, function (kk, vv) {
                                var data = {
                                    M_RESMIN_MINORE_ID: v.ANAGRA_ID,
                                    M_RESMIN_RESPONSABILE_ID: vv.ANAGRA_ID
                                };
                                var post = buildGenericPostInsertUpdateParameter("create", "dbo.M_RESMIN_responsabili_minori", "M_RESMIN_ID", "dbo.USP_INS_UPD_DEL_LINK_RESP", "XML", null, null, data, undefined);
                                $http.post("/api/GenericSqlCommand/PostI", post);
                            });
                        });
                        $q.all(promises).then(function () {
                            self.success("sucCheckIn");
                            self.updatePrenotationData();
                        }).finally(function () {
                            self.spinner.checkIn = "";
                        });
                    };

                    self.saveRights = function () {
                        var error = false, error2 = false;
                        $.each(self.rights, function (k, v) {
                            if (v.RESAUT_ACCETTA_TERMINI != undefined && v.RESAUT_ACCETTA_TERMINI === false) {
                                error = true;
                                return false;
                            }
                            else if (v.RESAUT_DATI_TERZI === null) {
                                error2 = true;
                                return false;
                            }
                        });

                      
                        if (error) {
                            self.message = self.lang.messages.acceptTerms;
                            self.messageType = "danger";
                            return;
                        }
                        else if (error2) {
                            self.message = self.lang.selectTerzi;
                            self.messageType = "danger";
                            return;
                        }
                        var promises = [];
                        self.spinner.rights = $sce.trustAsHtml(mediumSpinnerHTML); //magicutils.js
                        $.each(self.rights, function (k, v) {
                            v.ANAGRA_ID = parseInt(k);
                            v.PROGET_ID = self.checkInData.project;
                            v.T_ANATIP_CODICE = self.code[v.type];
                            var post = buildGenericPostInsertUpdateParameter("create", "dbo.V_ANAGRA", "ANAGRA_ID", "dbo.USP_INS_UPD_DEL_ANAGRA", "XML", null, null, v, v.ANAGRA_ID);
                            promises.push(
                                $http.post("/api/GenericSqlCommand/PostI", post)
                                    .then(function (res) {
                                        if (res.data.Errors) {
                                            kendoConsole.log(res.data.Errors, true);
                                            throw new Error(res.data.Errors);
                                        }
                                    },
                                    function (res) {
                                        kendoConsole.log(res.data, true);
                                    })
                            );
                            //if(v.RESAUT_ACCETTA_TERMINI == undefined)
                            //    $.fileDownload("/Helpers/downloadreport?report=/kiba/authlist&RESP_ID=" + self.checkInData.responsible[0].ANAGRA_ID + "&CHILD_ID=" + v.ANAGRA_ID + "&MINAUT_FOTO_VIDEO=" + v.MINAUT_FOTO_VIDEO + "&MINAUT_USCITA_AUTONOMA=" + v.MINAUT_USCITA_AUTONOMA + "&MINAUT_SPOSTAMENTO=" + v.MINAUT_SPOSTAMENTO + "&MINAUT_AUTORIZZAZIONE_DOC=" + v.MINAUT_AUTORIZZAZIONE_DOC + "&format=pdf");
                        })
                        $.each(self.selectedPromos, function (k, v) {
                            var data = {};
                            data.ANAGRA_ID = parseInt(k);
                            data.PROGET_ID = self.checkInData.project;
                            data.selectedPromos = v;
                            var post = buildGenericPostInsertUpdateParameter("create", "dbo.V_ANAGRA", "ANAGRA_ID", "dbo.USP_INS_UPD_DEL_ANAGRA_PROMO", "XML", null, null, data, k);
                            promises.push(
                                $http.post("/api/GenericSqlCommand/PostU/" + k.toString(), post)
                                    .then(function (res) {
                                        if (res.data.Errors) {
                                            kendoConsole.log(res.data.Errors, true);
                                            throw new Error(res.data.Errors);
                                        }
                                    },
                                    function (res) {
                                        kendoConsole.log(res.data, true);
                                    })
                            );
                        });
                        $q.all(promises).then(function () {
                            self.message = "";
                            self.action = "confirm";
                        }).finally(function () {
                            self.spinner.rights = "";
                        });
                    };

                    self.checkRights = function () {
                        self.rights = {};
                        var ids = {
                            children: $.map(self.checkInData.children, function (val) { return val.ANAGRA_ID }),
                            responsible: $.map(self.checkInData.responsible, function (val) { return val.ANAGRA_ID })
                        };
                        return $q.all([
                                $http
                                    .post(
                                        "/api/GENERICSQLCOMMAND/GetWithFilter",
                                        {
                                            GridName: "dbo.RESAUT_autorizzazioni_responsabili",
                                            table: "dbo.RESAUT_autorizzazioni_responsabili",
                                            order: "RESAUT_ID",
                                            where: "RESAUT_PROGET_ID = " + self.checkInData.project + " AND RESAUT_ANAGRA_ID IN (" + ids.responsible.join(",") + ")"
                                        }
                                    )
                                    .then(function (res) {
                                        res.data.type = "responsible";
                                        res.data.idName = "RESAUT_ANAGRA_ID";
                                        if (res.data.Data && res.data.Data.length) {
                                            $.each(res.data.Data[0].Table, function (k, v) {
                                                self.rights[v.RESAUT_ANAGRA_ID] = {
                                                    RESAUT_ACCETTA_TERMINI: v.RESAUT_ACCETTA_TERMINI
                                                };
                                                if (self.checkInData.venue.PROIMP_DATI_TERZI && v.RESAUT_DATI_TERZI_INS == null) {
                                                    res.data.Data[0].Table.splice(k, 1);
                                                }
                                            });
                                        }
                                        return res.data;
                                    })
                                ,
                                $http
                                    .post(
                                        "/api/GENERICSQLCOMMAND/GetWithFilter",
                                        {
                                            GridName: "dbo.MINAUT_autorizzazioni_minori",
                                            table: "dbo.MINAUT_autorizzazioni_minori",
                                            order: "MINAUT_ID",
                                            where: "MINAUT_PROGET_ID = " + self.checkInData.project + " AND MINAUT_ANAGRA_ID IN (" + ids.children.join(",") + ") AND MINAUT_AUTORIZZAZIONE_DOC = 1"
                                        }
                                    )
                                    .then(function (res) {
                                        res.data.type = "children";
                                        res.data.idName = "MINAUT_ANAGRA_ID";
                                        return res.data;
                                    })
                            ])
                            .then(function (rights) {
                                var missingRigths = [];
                                $.each(rights, function (k, v) {
                                    if (rights[k].Data && rights[k].Data.length)
                                        rights[k].items = rights[k].Data[0].Table;
                                    else
                                        rights[k].items = [];
                                    if (rights[k].items.length != self.checkInData[rights[k].type].length) {
                                        var mr = rights[k];
                                        mr.items = _.difference(ids[rights[k].type], $.map(rights[k].items, function (val) { return val[rights[k].idName] }));
                                        missingRigths.push(mr);
                                    }
                                });
                                return missingRigths;
                            })
                    };
                    self.getMissingPromos = function () {
                        var ids = {
                            children: $.map(self.checkInData.children, function (val) { return val.ANAGRA_ID })
                          };
                        return $http
                                  .post(
                                      "/api/GENERICSQLCOMMAND/GetWithFilter",
                                      {
                                          GridName: "dbo.V_M_ANAGRA_PROMO",
                                          table: "dbo.V_M_ANAGRA_PROMO",
                                          order: "ANAGRA_DENOMINAZIONE",
                                          where: "ANAGRA_ID IN (" + ids.children.join(",") + ") and Checked=0 and PROMO_ID in (select pp.M_PROGET_PROMO_PROMO_ID from M_PROGET_PROMO pp inner join PROMO_promozioni p on pp.M_PROGET_PROMO_PROMO_ID = p.PROMO_ID where getdate() between isnull(p.PROMO_DAL,DATEADD(day,-1,getdate())) AND isnull(p.PROMO_AL,DATEADD(day,1,getdate()))   and pp.M_PROGET_PROMO_PROGET_ID=" + self.checkInData.project + ")"
                                      }
                                  );
                    }

                    self.childFormRendered = function (formElement) {
                        var input = $(formElement).find('[ng-model="model[\'ANAGRA_DATA_NASCITA\']"]');
                        var ageInfo = $('<div>');
                        input.closest('.form-control-date').after(ageInfo);
                        input.on('focusout', function () {
                            var val = input.val();
                            var newVal = '';
                            if (val) {
                                newVal = 'Età in anni: ' + moment().diff(moment(val, 'DD/MM/YYYY'), 'years');
                            }
                            ageInfo.text(newVal);
                        });
                    };

                    self.init()
                        .then(function () {
                            self.updatePrenotationData();
                        });
                }
            ]
        );
});