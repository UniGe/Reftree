(function () {
    var deps = ["angular", "MagicSDK", "angular-magic-grid"]
    var angular;
    var controllerName = "StaffHours";

    define(deps, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html('\
        <div ng-controller="StaffHoursController as sh">\
            <style>\
                .square {\
                    width: 20px;\
                    height: 20px;\
                    color: white;\
                }\
            </style>\
            <div>\
                <ul class= "nav nav-tabs" style = "background-color: #e5e9ec; font-size: 20px;" >\
                    <li ng-click="sh.dataView(\'splitHours\')" ng-model="sh.view">\
                         <a data-toggle="tab" href="#">Calcolo ore del personale</a>\
                    </li>\
                    <li ng-click="sh.dataView(\'WorkAgrements\')" ng-model="sh.view">\
                    <a data-toggle="tab" href="#"> Lista contratti </a>\
                    </li>\
                    <li ng-click="sh.dataView(\'PresenceHours\')" ng-model="sh.view">\
                        <a data-toggle="tab" href="#">Ore personale</a>\
                    </li>\
                     <li ng-click="sh.dataView(\'payCheck\')" ng-model="sh.view">\
                         <a data-toggle="tab" href="#">File ore</a>\
                    </li>\
                 </ul>\
            </div>\
            <br>\
            <div class="workagreement" ng-show="sh.view == \'WorkAgrements\'">\
                 <div class="row">\
                        <div class="col-sm-2">\
                                 <label> {{ sh.translate("Year") }}  </label >\
                                <select class="form-control" ng-options="y as y.Year for y in sh.years" ng-model="sh.selectedYear"> </select>\
                        </div>\
                         <div class="col-sm-2">\
                                    <label> {{ sh.translate("Month") }} </label >\
                                    <select class="form-control" ng-options="m as m.Month for m in sh.months" ng-model="sh.selectedMonth"> </select>\
                         </div>\
                      <div class="col-sm-2">\
                                 <label> {{ sh.translate("Project") }} </label >\
                                <input type="text" ng-model="sh.project"  style="width:100%;"> </input>\
                        </div>\
                        <div class="col-sm-2">\
                                 <label> {{ sh.translate("LastName") }} </label >\
                                <input type="text" ng-model="sh.lastname"  style="width:100%;"> </input>\
                        </div>\
                        <div class= "col-sm-2">\
                                 <label> {{ sh.translate("FirstName") }} </label >\
                                <input type="text" ng-model="sh.name" style="width:100%;"> </input>\
                        </div>\
                 </div>\
                 <br>\
                    <div>\
                         <table ng-show="sh.view == \'WorkAgrements\'">\
                                <tr>\
                                    <td>\
                                             <label> {{ sh.translate("ReportedHours") }} </label >\
                                            <input type="checkbox" ng-model="sh.reportedHours"> </input>\
                                    </td>\
                                </tr>\
                                <tr>\
                                     <td>\
                                             <label> {{ sh.translate("Confirmed") }} </label >\
                                            <input type="checkbox" ng-model="sh.confirmed"> </input>\
                                    </td>\
                                </tr >\
                            </table>\
                        </div>\
                  <div>\
                     <magic-grid ng-if="sh.gridReady" id="wa" gridname="WA_ForPresenceHours" filter="sh.workagreementFilter" kendo-grid-instance="sh.workagreementGrid"> </magic-grid> \
                  </div>\
            </div>\
            <br>\
            <div class="presence" ng-show="sh.view ==\'PresenceHours\'">\
            <table class="table table-bordered">\
                <tr>\
                    <td>\
                            <b> {{ sh.translate("Period")}} </b> \
                    </td>\
                    <td>\
                            <b> {{ sh.translate("Resource")}} </b> \
                    </td>\
                     <td>\
                            <b> {{ sh.translate("FromDate")}} </b> \
                    </td>\
                    <td>\
                            <b> {{ sh.translate("ToDate")}} </b> \
                    </td>\
                    <td>\
                            <b> {{ sh.translate("WeekHoursAvg")}} </b> \
                    </td>\
                </tr>\
                <tr>\
                    <td>\
                            {{sh.period}} \
                    </td>\
                    <td>\
                            {{sh.fullDescription}} \
                    </td>\
                    <td>\
                             {{ sh.fromDate }} \
                    </td>\
                    <td>\
                            {{ sh.toDate }}  \
                    </td>\
                    <td>\
                             {{ sh.weeklyHoursAvg }}  \
                    </td>\
                </tr >\
                <tr>\
                    <td>\
                         <table class="table table-bordered" >\
                            <tr>\
                                        <td>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.translate("OrdinaryHours") }}\ </b>\
                                        </td>\
                                        <td>\
                                                <b> 6a giornata\ </b>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.translate("NightHours") }}\ </b>\
                                        </td>\
                                         <td>\
                                                <b> Straordinari\ </b>\
                                        </td>\
                                         <td>\
                                                <b> Supplementari </b>\
                                        </td>\
                                    </tr>\
                                 <tr>\
                                        <td>\
                                                Da rendicontazione\
                                         </td>\
                                        <td>\
                                                <b> {{ sh.ordinaryHours }}\ </b>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.sundaysHours }}\ </b>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.nightHours }}\ </b>\
                                        </td>\
                                         <td>\
                                                <b> 0\ </b>\
                                        </td>\
                                         <td>\
                                                <b> 0\ </b>\
                                        </td>\
                                </tr>\
                                <tr>\
                                        <td>\
                                                Da inserimento ore\
                                         </td>\
                                        <td>\
                                                <b> {{ sh.ordinaryHoursM }}\ </b>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.sundaysHoursM }}\ </b>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.nightHoursM }}\ </b>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.extraH }}\ </b>\
                                        </td>\
                                        <td>\
                                                <b> {{ sh.extrasH }}\ </b>\
                                        </td>\
                                </tr>\
                        </table >\
                        <button style="margin-left:15px;" class="btn btn-primary" ng-click="sh.refreshHoursTable()"> Aggiorna dati </button>\
                    </td >\
                    <td>\
                         <button style="margin-left:15px;" class="btn btn-primary" ng-click="sh.confirmHours(1)"> Conferma </button>\
                         <button style="margin-left:15px;" class="btn btn-primary" ng-click="sh.confirmHours(0)"> Rimuovi conferma </button>\
                         <button style="margin-left:15px;" class="btn btn-primary" ng-click="sh.generateSplit()"> Rigenera split ore </button>\
                    </td>\
                </tr>\
                <tr>\
                    <td>\
                        <table>\
                                <tr>\
                                    <td>\
                                        <div style="margin-right:10px;">\
                                            <div class="square" style="background-color: lightblue;float:left; margin-right:2px;"></div>\
                                            <div style="float:left;padding-top:6px;">  {{sh.translate("DoubleDates") }}</div>\
                                        </div>\
                                    </td>\
                                    <td>\
                                        <div style="margin-right:10px;">\
                                             <div class="square" style="background-color: #9dff89;float:left; margin-right:2px;"></div>\
                                            <div style="float:left;padding-top:6px;"> {{ sh.translate("Sundays") }} </div>\
                                        </div>\
                                    </td>\
                                    <td>\
                                        <div style="margin-right:10px;">\
                                           <div class="square" style="background-color: orange;float:left; margin-right:2px;"></div>\
                                            <div style="float:left;padding-top:6px;"> {{ sh.translate("Festivity") }} </div>\
                                        </div>\
                                    </td>\
                                    <td>\
                                        <div style="margin-right:10px;">\
                                           <div class="square" style="background-color: #ff00008c;float:left; margin-right:2px;"></div>\
                                            <div style="float:left;padding-top:6px;"> {{ sh.translate("DateWithoutContract") }} </div>\
                                        </div>\
                                    </td>\
                                </tr >\
                          </table>\
                      </td>\
                       <td>\
                        <label> Inserisci note </label>\
                        <textarea rows="4" cols="50" ng-model="sh.notes">\
                            {{sh.notes}}\
                        </textarea>\
                         <button style="margin-left:15px;" class="btn btn-primary"   ng-click="sh.saveNotes()"> Salva note </button>\
                    </td>\
                </tr>\
            </table>\
             <magic-grid id="presence" gridname="V_WA_PresenceHoursInsert" filter="sh.presenceFilter" kendo-grid-instance="sh.presenceGrid"> </magic-grid>\
            </div>\
            <br>\
            <div ng-show="sh.view == \'splitHours\'">\
                 <div class="row">\
                        <div class="col-sm-2">\
                                 <label> {{ sh.translate("Year") }}  </label >\
                                <select class="form-control" ng-options="y as y.Year for y in sh.timesheetSplitYears" ng-model="sh.splitSelectedYear"> </select>\
                        </div>\
                         <div class="col-sm-2">\
                                    <label> {{ sh.translate("Month") }} </label >\
                                    <select class="form-control" ng-options="m.ID as m.Month for m in sh.months" ng-model="sh.splitSelectedMonth"> </select>\
                         </div>\
                 </div>\
                 <br />\
            </div>\
             <button ng-show="sh.view == \'splitHours\'" style="margin-left:15px;" class="btn btn-primary" ng-click="sh.splitHours()"> Calcola ore </button>\
            <br>\
            <div ng-show="sh.view == \'payCheck\'">\
                 <div class="row">\
                        <div class="col-sm-2">\
                                 <label> {{ sh.translate("Year") }}  </label >\
                                <select class="form-control" ng-options="y as y.Year for y in sh.payCheckYears" ng-model="sh.payCheckSelectedYear"> </select>\
                        </div>\
                         <div class="col-sm-2">\
                                    <label> {{ sh.translate("Month") }} </label >\
                                    <select class="form-control" ng-options="m.ID as m.Month for m in sh.months" ng-model="sh.payCheckSelectedMonth"> </select>\
                         </div>\
                 </div>\
             <br />\
            </div >\
            <button ng-show="sh.view==\'payCheck\'" style="margin-left:15px;" class= "btn btn-primary" ng-click="sh.generatePayCheck()"> Genera file ore </button >\
            <br />\
            <br />\
            <br />\
             <div ng-show="sh.view==\'payCheck\'">\
                    <magic-grid  gridname="PayCheckFiles"  kendo-grid-instance="sh.payCheckFiles"> </magic-grid>\
             </div>\
       </div >\
        ')[0];
        angular.bootstrap(element, [controllerName]);
    }



    function controller(angular, MF) {
        return angular
            .module(controllerName, ["magicGrid"])
            .value("config", {})
            .controller(controllerName + "Controller", ['$scope', 'config', '$timeout',
                function ($scope, $timeout) {
                    var self = this;
                    var largeSpinnerHTML = '<p class="text-center" style="padding: 20px;"><i class="fa fa-spinner fa-spin fa-5x"></i></p>';

                    //griglie
                    self.workagreementGrid;
                    self.presenceGrid;



                    //Dati provenitenti da stored
                    self.months;
                    self.years;
                    self.timesheetSplitYears;


                    //Variabili modificabili dall'utente
                    self.name = "";
                    self.lastname = "";
                    self.project = "";
                    self.reportedHours = 0;
                    self.confirmed = 0;
                    self.month = new Date().getMonth();
                    self.splitSelectedMonth = new Date().getMonth();
                    self.payCheckSelectedMonth = new Date().getMonth();

                    ///Dati provenienti dal record selezionato
                    self.fullDescription;
                    self.period;
                    self.workAgreementCode;
                    self.fromDate;
                    self.toDate;
                    self.weeklyHoursAvg;
                    self.WorkAgreement_ID;
                    self.nWorkingDays;
                    self.originalHours;


                    //Ore originali
                    self.ordinaryHours;
                    self.sundaysHours;
                    self.nightHours;

                    //Ore modificate
                    self.ordinaryHoursM;
                    self.sundaysHoursM;
                    self.nightHoursM;


                    //Straordinari e supplementari
                    self.extraH;
                    self.extrasH;

                    ///Note su contratto 
                    self.notes;

                    self.workagreementGridtcharray = ['sh.selectedMonth', 'sh.lastname', 'sh.name', 'sh.selectedYear', 'sh.reportedHours', 'sh.confirmed','sh.project'];


                    self.view = "WorkAgrements";

                    MF.api.get({
                        storedProcedureName: "HR.usp_GetTimesheetYears"
                    }).then(function (res) {
                        if (res.length) {
                            self.timesheetSplitYears = res[0];
                            self.splitSelectedYear = self.timesheetSplitYears[0];
                        }

                    });



                    MF.api.get({
                        storedProcedureName: "HR.StaffHoursViewDrop"
                    }).then(function (res) {
                        if (res.length) {
                            self.years = res[0];
                            self.months = res[1];
                            self.payCheckYears = res[2];

                            self.payCheckSelectedYear = self.years[0];
                            self.selectedYear = self.years[0];

                            self.selectedMonth = self.months[new Date().getMonth() - 1];

                            var actual = new Date().getMonth();

                            if (actual == 0) {
                                self.selectedYear = self.years[1];
                                self.selectedMonth = self.months[11];
                            }

                            self.firstDayOfTheMonth = new Date(self.years[0].Year, self.selectedMonth.ID - 1, 1);
                            self.lastDayOfTheMonth = new Date(self.years[0].Year, self.selectedMonth.ID - 1, self.months[new Date().getMonth()].DaysOfTheMonth);
                        }

                    });

                    self.dataView = function (modality) {
                        self.view = modality;
                    }

                    self.splitHours = function () {

                        var largeSpinnerHTML = '<p class="text-center" style="padding: 20px;"><i class="fa fa-spinner fa-spin fa-5x"></i></p>';
                        $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');
                        MF.api.get({
                            storedProcedureName: "HR.usp_SplitTimesheetHours",
                            data: { Year: self.splitSelectedYear.Year, Month_ID: self.splitSelectedMonth },
                        }).then(function (res) {
                            if (res.length) {
                                kendoConsole.log(res[0][0].n + " record di presenza inseriti", false);
                            }
                            $("#spin_modal_overlay").remove();
                        });
                    }

                    self.translate = function (label) {
                        return getObjectText(label)
                    }

                    self.generatePayCheck = function () {
                        MF.api.get({
                            storedProcedureName: "Custom.CreatePresenceTxt",
                            data: { Year: self.payCheckSelectedYear.Year, Month_ID: self.payCheckSelectedMonth },
                        }).then(function (res) {
                            if (res.length) {
                                if (res[0][0].Succ) {
                                    kendoConsole.log(res[0][0].Succ, false);
                                }
                                else {
                                    kendoConsole.log(res[0][0].Err, true);
                                }

                            }
                        });

                        self.payCheckFiles.dataSource.read();
                    }



                    $scope.$watch("sh.workagreementGrid", function (grid) {
                        if (!grid)
                            return;
                        grid.bind("change", self.gridselect);
                        $("#wa .k-grid-toolbar").hide();
                    });

                    $scope.$watchGroup(self.workagreementGridtcharray, function () {


                        if ((self.selectedMonth && self.selectedYear) || (self.lastname || self.name)) {

                            self.gridReady = true;

                            self.firstDayOfTheMonth = new Date(self.selectedYear.Year, self.selectedMonth.ID - 1, 1);
                            self.lastDayOfTheMonth = new Date(self.selectedYear.Year, self.selectedMonth.ID - 1, self.selectedMonth.DaysOfTheMonth);


                            self.workagreementFilter = {
                                type: "customFilter", logic: "and", filters: [
                                    {
                                        type: "customFilter", logic: "or", filters: [
                                            {
                                                //Caso in cui sia la data di inizio che la data di fine sono compresi nel periodo 
                                                //Esempio: Perdiodo = 01/05 - 31/05, Date = 05/05 - 17/05
                                                type: "customFilter", logic: "and", filters: [
                                                    { field: "FromDate", operator: "gte", value: self.firstDayOfTheMonth, type: "customFilter" }
                                                    , { field: "FromDate", operator: "lte", value: self.lastDayOfTheMonth, type: "customFilter" }

                                                    , { field: "ToDateFilter", operator: "gte", value: self.firstDayOfTheMonth, type: "customFilter" }
                                                    , { field: "ToDateFilter", operator: "lte", value: self.lastDayOfTheMonth, type: "customFilter" }
                                                ]
                                            },
                                            {
                                                //Caso in cui la data di inizio e la data di fine comprendono il periodo selezionato
                                                // Esempio: Perdiodo = 01/05 - 31/05, Date: 02/01 - 22/10
                                                type: "customFilter", logic: "and", filters: [
                                                    { field: "FromDate", operator: "lte", value: self.firstDayOfTheMonth, type: "customFilter" }

                                                    , { field: "ToDateFilter", operator: "gte", value: self.lastDayOfTheMonth, type: "customFilter" }
                                                ]
                                            },

                                            {
                                                //Caso in cui la data di inizio è più piccola della data di inizio ma la data di fine è compresa nel periodo selezionato
                                                // Esempio: Perdiodo = 01/05 - 31/05, Date: 02/01 - 22/05
                                                type: "customFilter", logic: "and", filters: [
                                                    { field: "FromDate", operator: "lte", value: self.firstDayOfTheMonth, type: "customFilter" }

                                                    , { field: "ToDateFilter", operator: "gte", value: self.firstDayOfTheMonth, type: "customFilter" }
                                                    , { field: "ToDateFilter", operator: "lte", value: self.lastDayOfTheMonth, type: "customFilter" }
                                                ]
                                            },

                                            {
                                                //Caso in cui la data di inizio è compresa nel periodo e la  data di fine è al di fuori del periodo selezionato 
                                                // Esempio: Perdiodo = 01/05 - 31/05, Date: 02/01 - 22/05
                                                type: "customFilter", logic: "and", filters: [
                                                    { field: "FromDate", operator: "gte", value: self.firstDayOfTheMonth, type: "customFilter" }
                                                    , { field: "FromDate", operator: "lte", value: self.lastDayOfTheMonth, type: "customFilter" }

                                                    , { field: "ToDateFilter", operator: "gte", value: self.lastDayOfTheMonth, type: "customFilter" }
                                                ]
                                            }
                                        ]
                                    }, {
                                        type: "customFilter", logic: "and", filters: [
                                            { field: "FirstName", operator: "contains", value: self.name, type: "customFilter" }
                                            , { field: "LastName", operator: "contains", value: self.lastname, type: "customFilter" }
                                            , { field: "ProjectDescription", operator: "contains", value: self.project, type: "customFilter" }
                                            , { field: "Closed", operator: "eq", value: self.reportedHours, type: "customFilter" }
                                            , { field: "Confirmed", operator: "eq", value: self.confirmed, type: "customFilter" }
                                        ]
                                    }
                                ]
                            }
                        }

                    });


                    self.confirmHours = function (confirm) {
                        MF.api.get({
                            storedProcedureName: "HR.usp_ConfirmWorkedHours",
                            data: { WorkAgreement_ID: self.WorkAgreement_ID, Confirm: confirm },
                        }).then(function (res) {
                            if (res.length) {
                                if (res[0][0].Succ) {
                                    kendoConsole.log(res[0][0].Succ, false);
                                }
                                else {
                                    kendoConsole.log(res[0][0].Err, true);
                                }
                            }
                            self.workagreementGrid.dataSource.read();
                            self.view = "WorkAgrements";

                        });
                    }

                    self.refreshHoursTable = function () {
                        MF.api.get({
                            storedProcedureName: "HR.usp_GetWorkInfo",
                            data: { Person_ID: self.Person_ID, Month_ID: self.selectedMonth.ID, Year: self.selectedYear.Year, WorkAgreement_ID: self.WorkAgreement_ID },
                        }).then(function (res) {
                            if (res.length) {
                                self.originalHours = res[0][0].TimeSheetHours;
                                self.nWorkingDays = res[1][0].nPlanned;
                                self.period = res[2][0].YearPeriod;
                                self.ordinaryHours = res[3][0].Hours;
                                self.sundaysHours = res[4][0].Hours;
                                self.nightHours = res[5][0].Hours;
                                self.notes = res[6][0].Note;
                                self.extraH = res[7][0].STRA;
                                self.extrasH = res[7][0].SUPP;


                                self.ordinaryHoursM = res[3][0].HoursM;
                                self.sundaysHoursM = res[4][0].HoursM;
                                self.nightHoursM = res[5][0].HoursM;
                            }
                            });
                    }
                    //generateSplit


                    self.generateSplit = function () {
                        MF.api.get({
                            storedProcedureName: "HR.usp_SplitTimesheetHours_For_Person",
                            data: { Person_ID: self.Person_ID, Year: self.payCheckSelectedYear.Year, Month_ID: self.payCheckSelectedMonth},
                        }).then(function (res) {
                            if (res.length) {
                                if (res[0][0].Succ) {
                                    kendoConsole.log(res[0][0].Succ, false);
                                }
                                else {
                                    kendoConsole.log(res[0][0].Err, true);
                                }

                            }
                        });

                        self.refreshHoursTable();
                        self.presenceGrid.dataSource.read();
                    }

                    self.saveNotes = function () {
                        MF.api.get({
                            storedProcedureName: "HR.SavePayCheckNotes",
                            data: { Person_ID: self.Person_ID, Year: self.payCheckSelectedYear.Year, Month_ID: self.selectedMonth.ID, Notes: self.notes},
                        }).then(function (res) {
                            if (res.length) {
                                if (res[0][0].Succ) {
                                    kendoConsole.log(res[0][0].Succ, false);
                                }
                                else {
                                    kendoConsole.log(res[0][0].Err, true);
                                }

                            }
                            });

                        self.refreshHoursTable();
                        self.payCheckFiles.dataSource.read();
                    }

                    self.gridselect = function (e) {

                        selecteddata = self.workagreementGrid.select();


                        var datapayload = [];
                        if (selecteddata.length > 0) {
                            for (var i = 0; i < selecteddata.length; i++) {
                                datapayload.push(self.workagreementGrid.dataItem(selecteddata[i]));
                            }

                            self.fullDescription = datapayload[0].LastName + " " + datapayload[0].FirstName;

                            self.workAgreementCode = datapayload[0].Code;
                            self.fromDate = datapayload[0].FromDateFormat;
                            self.toDate = datapayload[0].ToDateFormat;
                            self.weeklyHoursAvg = datapayload[0].WeekHoursAvg;
                            self.WorkAgreement_ID = datapayload[0].WorkAgreement_ID;
                            self.Person_ID = datapayload[0].Person_ID;


                            self.presenceFilter = {
                                type: "customFilter", logic: "and", filters: [
                                    { field: "WorkAgreement_ID", operator: "eq", value: self.WorkAgreement_ID, type: "customFilter" }
                                    , { field: "Date", operator: "gte", value: self.firstDayOfTheMonth, type: "customFilter" }
                                ]
                            }

                            self.refreshHoursTable();

                            self.presenceGrid.refresh();

                            self.view = "PresenceHours";
                            $("#presence .k-grid-pager").hide();
                        }
                    }
                }

            ]);
    }
}())