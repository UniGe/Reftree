define(['angular', "MagicSDK", "angular-filter"], function (angular, MF) {
    angular
        .module('absenceView', ['angular.filter'])
        //config is used in magicFormSp
        .value("config", {
            data: '{}'
        })
        .directive('absenceView', ['$timeout', function ($timeout) {
            return {
                replace: true,
                restrict: "E",
                scope: {
                    hideFilters: "=",
                    personId: "=",
                    monthDaysString: "@",
                    from: "@",
                    to: "@",
                    setUserReferral: "="

                },
                templateUrl: window.includesVersion + "/Views/1/Templates/Directives/absence-view.html",
                link: function (scope, element, attrs, ctrls) {
                    scope.person = [];
                    scope.department = null;
                    scope.year = null;
                    scope.month = null;
                    scope.period = scope.monthDaysString ? "month" : "year";
                    scope.monthDays = scope.monthDaysString ? JSON.parse(scope.monthDaysString) : [];
                    scope.YearMonths = new Array(12);
                    scope.ResultPerson = [];
                    scope.festivity = [];
                    scope.absenceType = [];
                    scope.statusHoliday = null;
                    var time;

                    MF.api.get({ storedProcedureName: "HR.AbsenceViewFilter" })
                        .then(function (res) {
                            scope.departments = res[0];
                            scope.persons = res[1];
                            scope.personsCopy = scope.persons; //tengo una copia di scope.persons per quando viene selezionato un reparto e ho bisogno del Department_ID
                            scope.years = res[2];
                            scope.months = res[3];
                            scope.personsRef = res[4]; //
                            scope.referralsName = res[5];
                            scope.personsUnique = res[6];
                            scope.year = scope.years[0].Year;
                            scope.month = scope.months[new Date().getMonth()].ID;
                            if (scope.personId) {
                                scope.department = scope.persons.find(function (person) {
                                    return person.ID === scope.personId;
                                }).Department_ID;
                            }
                            if (!scope.setUserReferral) {
                                for (var i = 0; i < scope.persons.length; i++) {
                                    if (scope.persons[i].IsUser)
                                        scope.department = scope.persons[i].Department_ID;
                                }
                            }
                            $timeout();
                        });
                   

                    scope.translate = function (label) {
                        return getObjectText(label);
                    }


                    scope.$watch("department", function (department, oldDepartment) {
                        if (department !== oldDepartment)
                            scope.person = [];
                    });

                    scope.$watch("year", function (year, oldYear) {
                        if (year !== oldYear)
                            scope.fetchdata();
                    });

                    scope.$watch("month", function (month, oldMonth) {
                        if (month !== oldMonth)
                            scope.fetchdata();
                    });

                    scope.$watch("period", function (period, oldPeriod) {
                        if (period !== oldPeriod)
                            scope.fetchdata();
                    });

                    scope.$watch("person", function () {
                        scope.fetchdata();
                    });

                    scope.setMonth = function (n) {
                        //se da Gennaio vado indietro o da dicembre voglio andare avanti
                        if ((scope.month == 1 && n == -1) || (scope.month == 12 && n == 1)){
                            scope.month = scope.month;
                        }
                        else
                         scope.month += n;
                    }

                    scope.fetchdata = function () {
                        time = new Date().getTime();
                        var timeCheck = time;
                   
                        if (!scope.setUserReferral)
                            if (!scope.from || !scope.to) {
                                if (scope.department) {
                                    scope.persons = scope.personsCopy;
                                }
                                else {//quando non viene selezionato nessun reparto faccio visualizzare tutte le persone in modo univoco, perciò con la query che non presenta il dato del department che duplica o triplica la persona in base al reparto di appartenenza
                                    scope.persons = scope.personsUnique;
                                }
                            }
                        else {
                            if (scope.personsRef) {
                                scope.persons= scope.personsRef
                            }
                        }
                        MF.api.get({
                            storedProcedureName: "HR.PersonDepartment_Filter_select",
                            data: { isReferral: scope.setUserReferral, Month_ID: scope.month, Department_ID: scope.department, Person_IDs: scope.person.map(function (p) { return p.ID; }).join(","), DateFrom: scope.from, DateTo: scope.to, Year: scope.year, Period: scope.period  }
                        })
                            .then(function (res) {
                                if (timeCheck == time) {
                                    if (!scope.hideFilters) {
                                        scope.monthDays = [];
                                        var monthDays = new Date(scope.year, scope.month, 0).getDate();
                                        for (var i = 0; i < monthDays; i++) {
                                            scope.monthDays.push({
                                                weekday: new Date(scope.year, scope.month - 1, i + 1).getDay(),
                                                day: i + 1,
                                                month: scope.month - 1,
                                                year: scope.year
                                            });
                                        }
                                    }
                                    scope.ResultPerson = res[0];
                                    $timeout();
                                }
                            });
                       
                        MF.api.get({ storedProcedureName: "HR.T_AbsenceL" })
                            .then(function (res) {
                                scope.absenceType = res[0];
                                $timeout();
                            });


                        MF.api.get({ storedProcedureName: "HR.GetFestivity", data: { Year: scope.year } })
                            .then(function (res) {
                                scope.festivity = res;
                                $timeout();
                            });

                        //MF.api.get({
                        //    table: "dbo.V_Festivity",
                        //    filter: { field: "FestivityYear", operator: "eq", value: scope.year },
                        //    GridName: "V_Festivity"
                        //})
                        //    .then(function (res) {
                        //        scope.festivity = res;
                        //        $timeout();
                        //    });
                      
                           
                    }
                    scope.getAbsenceClass = function (Person_ID, day) {
                        if (scope.ResultPerson) {
                            var date = new Date(day.year, day.month, day.day);
                            for (var i = 0; i < scope.ResultPerson.length; i++) {
                                if (scope.ResultPerson[i].Person_ID_Request == Person_ID) {
                                    if ((new Date(scope.ResultPerson[i].FromDate) <= date && new Date(scope.ResultPerson[i].ToDate) >= date) || scope.ResultPerson[i].FreeHoursDate && new Date(scope.ResultPerson[i].FreeHoursDate).getTime() == date.getTime()) {
                                        if (scope.ResultPerson[i].Status == 'APP')
                                            return "is-app";
                                        else if (scope.ResultPerson[i].Status == 'IAP')
                                            return "is-onapp";   
                                    }
                                }
                            }
                        }
                        return "";
                    }

                    scope.getBoxColour = function (Person_ID, day) {
                        if (scope.ResultPerson && scope.absenceType) {
                            var date = new Date(day.year, day.month, day.day);
                            for (var i = 0; i < scope.ResultPerson.length; i++) {
                                if (scope.ResultPerson[i].Person_ID_Request == Person_ID) {
                                    if ((new Date(scope.ResultPerson[i].FromDate) <= date && new Date(scope.ResultPerson[i].ToDate) >= date) || scope.ResultPerson[i].FreeHoursDate && new Date(scope.ResultPerson[i].FreeHoursDate).getTime() == date.getTime()) {
                                        for (var j = 0; j < scope.absenceType.length; j++) {
                                            if (scope.ResultPerson[i].Code == scope.absenceType[j].Code && (scope.ResultPerson[i].Status == 'APP' || scope.ResultPerson[i].Status == 'IAP'))
                                                return scope.absenceType[j].Colour;
                                        }
                                     }
                                }
                            }
                        }
                    }
                  
                    scope.getFestivityClass = function (day) {
                        var date = new Date(day.year, day.month , day.day);
                        for (var c = 0; c < scope.festivity.length; c++)
                            if (date.getTime() == new Date(scope.festivity[c].Festivity_Date).getTime())
                                return 1;
                    }
                    scope.getColour = function (type) {
                        for (var i = 0; i < scope.absenceType.length; i++) {
                            if (scope.absenceType[i].Code == type) {
                                return scope.absenceType[i].Colour;
                            }
                        } 
                    }
                    scope.getReferralName = function (type) {
                        if (scope.referralsName)
                            return scope.referralsName[0][type];
                        else
                            return "";

                    }
                    scope.yearHolidayStyle = function (holiday) {
                        if (holiday.Status == 'APP' || holiday.Status == 'IAP') {
                            var from = new Date(holiday.FromDate);
                            var to = new Date(holiday.ToDate);
                            

                            if (holiday.FreeHoursDate) {
                                from = new Date(holiday.FreeHoursDate);
                                to = new Date(holiday.FreeHoursDate);
                            }
                            to.setDate(to.getDate() + 1)

                            var left = 0;
                            var right = 100;

                            if (from.getFullYear() === scope.year) {
                                var frommonthDays = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
                                left += from.getMonth() * (100 / 12);
                                left += (100 / 12 / (frommonthDays / (from.getDate() - 1)));
                            }
                            if (to.getFullYear() === scope.year) {
                                var tomonthDays = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
                                right -= to.getMonth() * (100 / 12);
                                right -= (100 / 12 / (tomonthDays / (to.getDate() - 1)));
                            } else
                                right = 0;
                            return "position: absolute; height: 100%; left: " + left + "%; right: " + right + "%;  background: " + holiday.Colour + ";";
                        }
                    }
                    scope.festivityStyle = function (festivity) {
                        
                            var from = new Date(festivity.Festivity_Date);
                            var to = new Date(festivity.Festivity_Date);
                            to.setDate(to.getDate() + 1)
                            var left = 0;
                            var right = 100;

                            var frommonthDays = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
                            left += from.getMonth() * (100 / 12);
                            left += (100 / 12 / (frommonthDays / (from.getDate() - 1)));

                            var tomonthDays = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
                            right -= to.getMonth() * (100 / 12);
                            right -= (100 / 12 / (tomonthDays / (to.getDate() - 1)));

                            return "position: absolute; height: 100%;  left: " + left + "%; right: " + right + "%;  background: #a9a9a9;";
                       
                    }
                    scope.showHoliday = function (holiday, event) {
                        if (holiday.Status == 'IAP')
                            scope.statusHoliday = "In approvazione";
                        else if (holiday.Status == 'APP')
                            scope.statusHoliday = "Approvate";
                        if (!$(event.target).data("kendoTooltip") && holiday.FromDate) {
                            $(event.target).kendoTooltip({
                                content: 'Dal: ' + kendo.toString(new Date(holiday.FromDate), "dd/MM/yyyy") + '<br />Al: ' + '  ' + kendo.toString(new Date(holiday.ToDate), "dd/MM/yyyy") + ' <br /> Status: '+ scope.statusHoliday,
                                autoHide: false,
                                showOn: "click",
                                width: 180
                            })
                                .data("kendoTooltip")
                                .show();
                        }
                       
                        else if (holiday.FreeHoursDate) {
                            $(event.target).kendoTooltip({
                                content: 'Giorno: ' + kendo.toString(new Date(holiday.FreeHoursDate), "dd/MM/yyyy") + '<br />Dalle: ' + holiday.FromHour + '<br />Alle: ' + holiday.ToHour + ' <br /> Stato: ' + scope.statusHoliday,
                                autoHide: false,
                                showOn: "click",
                                width: 180
                            })
                                .data("kendoTooltip")
                                .show();
                        }
                    }
                    scope.showFestivity = function (festivity,event) {
                        if (!$(event.target).data("kendoTooltip")) {
                            $(event.target).kendoTooltip({
                                content:  festivity.Description,
                                autoHide: false,
                                showOn: "click",
                                width: 180
                            })
                                .data("kendoTooltip")
                                .show();
                        }

                      
                    }


                    scope.showAbsenceDetails = function (Person_ID, day) {
                        if (scope.ResultPerson) {
                            var date = new Date(day.year, day.month, day.day);
                            for (var i = 0; i < scope.ResultPerson.length; i++) {
                                if (scope.ResultPerson[i].Person_ID_Request == Person_ID) {
                                    if ((new Date(scope.ResultPerson[i].FromDate) <= date && new Date(scope.ResultPerson[i].ToDate) >= date) || scope.ResultPerson[i].FreeHoursDate && new Date(scope.ResultPerson[i].FreeHoursDate).getTime() == date.getTime()) {
                                        if (scope.ResultPerson[i].WholeDay) {
                                            $(event.target).kendoTooltip({
                                                content: 'Dal: ' + kendo.toString(new Date(scope.ResultPerson[i].FromDate), "dd/MM/yyyy") + '<br />Al: ' + kendo.toString(new Date(scope.ResultPerson[i].ToDate), "dd/MM/yyyy")+ scope.ResultPerson[i].CertificateDescription,
                                                autoHide: false,
                                                showOn: "click",
                                                width: 180
                                            })
                                                .data("kendoTooltip")
                                                .show();
                                           
                                        }
                                        else {
                                            $(event.target).kendoTooltip({
                                                content: 'Giorno: ' + kendo.toString(new Date(scope.ResultPerson[i].FreeHoursDate), "dd/MM/yyyy") + '<br />Dalle: ' + scope.ResultPerson[i].FromHour + '<br />Alle: ' + scope.ResultPerson[i].ToHour + scope.ResultPerson[i].CertificateDescription,
                                                autoHide: false,
                                                showOn: "click",
                                                width: 180
                                            })
                                                .data("kendoTooltip")
                                                .show();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
        }]);
});