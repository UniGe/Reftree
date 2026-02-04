(function () {
    var deps = ["angular", "MagicSDK", window.includesVersion + "/Views/1/Js/Directives/resourcerequest-view.js"]
    var angular;
    var controllerName = "ResourceRequest";

    define(deps, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html('<div ng-controller="ResourceRequestController as rr"> <ng-include src="rr.templateUrl"></ng-include></div>')[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        return angular
            .module(controllerName, ["resourceRequestView"])
            .controller(controllerName + "Controller", ['$timeout', '$scope',
                function ($timeout, $scope) {
                    var self = this;

                    self.templateUrl = window.includesVersion + "/Views/1/Templates/Directives/resourcerequest-view.html";

                    self.months = [];
                    self.projects = [];
                    self.activityGroups = [];
                    self.skills = [];
                    self.locations = [];
                    self.projectDates = [];
                    self.plannedDateFrom = 1;//Data di filtro durante assegnazione incarichi
                    self.plannedDateTo = 31;//Data di filtro durante assegnazione incarichi
                    self.addedLines = [];
                    self.lines = [];
                    self.dataSetTable = [];
                    self.dataSetRow = [];
                    self.dataSetColumn = [];
                    self.dataSetObj = [];
                    self.dataSet = [];
                    self.requestsDates = [];
                    self.dateFilter = 0;
                    self.view = "";
                    self.nothing = "";
                    self.checkIcon = "https://img.icons8.com/color/24/000000/approval.png";
                    self.checkToSaveIcon = "https://img.icons8.com/color/48/000000/spinner-frame-7.png";
                    self.notCheckIcon = "https://img.icons8.com/color/24/000000/do-not-disturb.png";
                    var largeSpinnerHTML = '<p class="text-center" style="padding: 20px;"><i class="fa fa-spinner fa-spin fa-5x"></i></p>';

                    self.translate = function (label) {
                        return getObjectText(label);
                    }

                    self.dataView = function (modality) {
                        self.view = modality;

                        if (modality != "dailyAssignment") {
                            self.activityGroup = null;
                        }

                        self.dateDailyAssignment = null;
                        self.getRescourceRequest();
                        $timeout();
                    }

                    self.save = function (dataSet) {
                        self.dataSetObj = [];
                        //  Costruisco l'array da mandare in pasto alla stored
                        var skillLocationMissing = 0;
                        var dataRow = dataSet;
                        if (self.project) {
                            for (var i = 0; i < dataSet.length; i++) {
                                //Riga da sfogliare
                                for (var k = 0; k < self.projectDates.length; k++) {
                                    if (dataRow) {
                                        if (dataRow[i][k]) {
                                            var skill = dataRow[i][0].skill;
                                            var location = dataSet[i][0].location;
                                            if (!dataSet[i][0].skill || !dataSet[i][0].location) {
                                                skillLocationMissing = 1;
                                                break;
                                            }
                                            if (dataRow[i][k].timeFrom && dataRow[i][k].timeTo)
                                                self.dataSetObj.push({ ID: dataRow[i][k].ID, project_ID: self.project.ID, location: location, skill: skill, quantity: dataRow[i][k].quantity, date: self.projectDates[k].RealDate, timeFrom: new Date(dataRow[i][k].timeFrom.getTime() + (-1 * dataRow[i][k].timeFrom.getTimezoneOffset() * 60 * 1000)), timeTo: new Date(dataRow[i][k].timeTo.getTime() + (-1 * dataRow[i][k].timeTo.getTimezoneOffset() * 60 * 1000)) });
                                            else
                                                self.dataSetObj.push({ ID: dataRow[i][k].ID, project_ID: self.project.ID, location: location, skill: skill, quantity: dataRow[i][k].quantity, date: self.projectDates[k].RealDate, timeFrom: null, timeTo: null });
                                        }
                                    }
                                }
                            }
                        }


                        if (!skillLocationMissing) {
                            $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');
                            MF.api.get({
                                storedProcedureName: "HR.usp_createResourceRequest",
                                data: { models: self.dataSetObj },
                            }).then(function (res) {
                                $("#spin_modal_overlay").remove();
                                if (res.length) {
                                    if (res[0][0].Err) {
                                        kendoConsole.log(res[0][0].Err, true);
                                    }
                                    else {
                                        kendoConsole.log("Richieste create", false);
                                    }
                                }

                                $timeout();
                            });
                        }
                        else
                            kendoConsole.log("Compilare i campi mansione e location di tutte le righe", true);

                        self.getRescourceRequest();//REFRESH
                        if (self.POP) {
                            self.getDevelopment(); //Refresh dello sviluppo
                            //self.view = "development";
                            $timeout();
                        }
                        $timeout();

                    }


                    MF.api.get({ storedProcedureName: "HR.GetResourceRequestData" })
                        .then(function (res) {
                            self.months = res[0];
                            self.projects = res[1];
                            self.skills = res[2];
                            self.locations = res[3];
                            self.years = res[4];
                            self.activityGroups = res[5];

                            self.project = [];

                            self.year = self.years[0].Year;
                            self.month = self.months[new Date().getMonth()].ID;
                            $timeout();
                        });

                    $scope.$watch("rr.project", function () {
                        self.lines = [];
                        self.dataSet = [];
                        self.dataSetRow = [];
                        self.addedLines = [];
                        self.availabilities = [];
                        self.personAssignment = [];
                        self.requestAvailability = [];
                        self.view = "insert";
                        self.getProjectCalendar();
                        $timeout();

                        self.getRescourceRequest();
                        $timeout();
                    });

                    $scope.$watch("rr.plannedDateFrom", function () {
                        if (!self.plannedDateFrom) {
                            self.dateFilter = 0;
                            //self.plannedDateTo = 31;
                        }
                        else {
                            self.dateFilter = 1; //Filtro data presente
                        }
                        if (!self.plannedDateTo && self.plannedDateFrom) {
                            self.plannedDateTo = 31; ///In caso di data al  nulla inserisco il valore di data da 
                        }
                        $timeout();
                    });

                    $scope.$watch("rr.activityGroup", function () {
                        if (self.activityGroup) {
                            if (self.activityGroup.ID) {
                                self.view = "dailyAssignment";
                                self.getDailyPlanning();
                            }
                            else {
                                self.project = [];
                            }
                        }
                        $timeout();
                    });

                   


                    self.getProjectCalendar = function () {
                        if (self.project) {
                            if (self.project.ID) {
                                MF.api.get({
                                    table: "HR.V_Project_Calendar",
                                    filter: { field:"Project_ID", operator:"eq" , value:  self.project.ID }//"Project_ID = " + self.project.ID + ""
                                })
                                    .then(function (res) {
                                        self.projectDates = res;

                                        if (!self.projectDates.length) {
                                            kendoConsole.log("Date di progetto non presenti", true);
                                        }
                                        else {
                                            self.POP = self.projectDates[0].POP
                                        }
                                        $timeout();
                                    });


                                MF.api.get({
                                    table: "HR.V_RequestDates",
                                    filter: { field: "Project_ID", operator: "eq", value: self.project.ID }//"Project_ID = " + self.project.ID + ""
                                })
                                    .then(function (res) {
                                        self.requestsDates = res;
                                        $timeout();
                                        if (!self.requestsDates.length) {
                                            kendoConsole.log("Nessuna richiesta presente per il progetto", true);
                                        }
                                    });

                                MF.api.get({
                                    table: "HR.V_ResourceRequestAvailability",
                                    filter: { field: "Project_ID", operator: "eq", value: self.project.ID }//"Project_ID = " + self.project.ID + ""
                                })
                                    .then(function (res) {
                                        self.requestAvailability = res;
                                        $timeout();
                                    });
                                $timeout();
                            }
                        }
                    }


                    self.addLine = function () {
                        self.addedLines.push({});
                    }

                    self.saveAssignment = function (dataSet, assignment) {
                        toSave = [];

                        for (var i = 0; i < self.availabilities.length; i++) {///Righe
                            var skill = self.availabilities[i].Skill_ID;
                            var eventVenue = self.availabilities[i].EventVenue_ID;

                            for (var k = 0; k < self.requestsDates.length; k++) {//Colonne
                                if (assignment[i] || self.planneHoursIDs[i][k]) {
                                    toSave.push({ ResourceRequest_ID: dataSet[i][k], Person_ID: assignment[i][k], Skill_ID: skill, EventVenue_ID: eventVenue, PlannedHours_ID: self.planneHoursIDs[i][k] });
                                }
                            }
                        }
                        $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');
                        MF.api.get({
                            storedProcedureName: "HR.usp_createPlannedHoursFromRequest",
                            data: { models: toSave },
                        }).then(function (res) {
                            $("#spin_modal_overlay").remove();
                            if (res.length) {
                                if (res[0][0].Err) {
                                    kendoConsole.log(res[0][0].Err, true);
                                }
                            }
                            else {
                                kendoConsole.log("Incarichi assegnati con successo", false);
                            }
                            $timeout();
                        });
                        self.getAvailabilities();
                    }

                    self.getAvailabilities = function () {
                        $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');
                        self.getProjectCalendar();
                        MF.api.get({ storedProcedureName: "HR.GetAvailabititiesForProjectRequests", data: { Project_ID: self.project.ID } })
                            .then(function (res) {
                                $("#spin_modal_overlay").remove();
                                if (res) {
                                    self.availabilities = res[0];
                                    self.personAssignment = res[1];
                                    self.planneHoursIDs = res[2];
                                }
                                $timeout();
                            });
                        $timeout();
                    }

                    self.sendPlanning = function () {
                        MF.api.get({ storedProcedureName: "HR.usp_SendProjectPlanningCalendar", data: { Project_ID: self.project.ID } })
                            .then(function (res) {
                                if (res.length) {
                                    if (res[0][0].Err) {
                                        kendoConsole.log(res[0][0].Err, true);
                                    }
                                }
                                else {
                                    kendoConsole.log("Calendari inviati con successo", false);
                                }
                                $timeout();
                            });
                        $timeout();

                    }

                    self.closePianification = function () {
                        MF.api.get({ storedProcedureName: "HR.usp_ClosePianificationForProject", data: { Project_ID: self.project.ID } }).then(function (res) {
                            kendoConsole.log("Progetto posto in status PIANIFICATO", false);
                            $timeout();
                        });
                        $timeout();
                    }

                    self.getRescourceRequest = function () {
                        self.dataSet = [];
                        self.addedLines = [];
                        if (self.project) {
                            if (self.project.ID) {
                                $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');
                                MF.api.get({ storedProcedureName: "HR.ResourceRequest_Pivot", data: { Project_ID: self.project.ID } })
                                    .then(function (res) {
                                        $("#spin_modal_overlay").remove();
                                        var requests = res[0];
                                        var inserted = 0;
                                        if (requests) {
                                            for (var i = 0; i < requests.length; i++) {
                                                for (var k = 0; k < self.projectDates.length; k++) {
                                                    var inserted = 0;
                                                    if (requests[i]) {
                                                        var skillID = requests[i].Skill_ID;
                                                        var eventVenueID = requests[i].EventVenue_ID;
                                                        if (requests[i][k]) {

                                                            var date = requests[i][k].toString().split("|")[0];
                                                            var quantity = parseInt(requests[i][k].toString().split("|")[1]);
                                                            var timeFrom = requests[i][k].toString().split("|")[2];
                                                            var timeTo = requests[i][k].toString().split("|")[3];
                                                            var requestID = requests[i][k].toString().split("|")[4];
                                                            self.dataSetRow.push({ ID: requestID, skill: skillID, location: eventVenueID, quantity: quantity, timeFrom: new Date(timeFrom), timeTo: new Date(timeTo) });//, timeFrom: new Date(timeFrom), timeTo: new Date(timeto)
                                                            inserted = 1;
                                                        }
                                                    }
                                                    if (!inserted) {
                                                        self.dataSetRow.push({ skill: skillID, location: eventVenueID });
                                                    }

                                                }
                                                self.dataSet.push(self.dataSetRow);
                                                self.addedLines.push({});
                                                self.dataSetRow = [];
                                            }
                                        }
                                     
                                        $timeout();
                                    });
                                $timeout();
                            }

                        }
                    }

                    self.getPlanForPersons = function () {
                        MF.api.get({ storedProcedureName: "HR.PlannedHoursForPerson_Pivot", data: { Project_ID: self.project.ID } })
                            .then(function (res) {

                                self.planningForPerson = res[0];
                                self.planningHilightedCells = res[1];
                                $timeout();
                            });
                    }

                    //POP
                    self.getDevelopment = function () {
                        self.dataSetTable = [];
                        self.dataSetTableRow = [];
                        self.containers = [];
                        if (self.project) {
                            if (self.project.ID) {
                                MF.api.get({ storedProcedureName: "HR.PlannedHoursContainerForPerson_Pivot", data: { Project_ID: self.project.ID } })
                                    .then(function (res) {
                                        self.numberOfContainers = [];
                                        var planning = res[0];
                                        var inserted = 0;
                                        if (planning) {
                                            for (var i = 0; i < planning.length; i++) {
                                                for (var k = 0; k < self.projectDates.length; k++) {
                                                    var inserted = 0;
                                                    if (planning[i]) {
                                                        var skill_ID = planning[i].Skill_ID;
                                                        var eventVenue_ID = planning[i].EventVenue_ID;
                                                        var skill = planning[i].Skill;
                                                        var eventVenue = planning[i].EventVenue;
                                                        var plannedHoursContainer_ID = planning[i].PlannedHoursContainer_ID;
                                                        var person_ID = planning[i].Person_ID;

                                                        if (planning[i][k]) {
                                                            var date = planning[i][k].toString().split("|")[0];
                                                            var timeFrom = planning[i][k].toString().split("|")[1];
                                                            var timeTo = planning[i][k].toString().split("|")[2];
                                                            var plannedHours_ID = planning[i][k].toString().split("|")[3];
                                                            self.dataSetTableRow.push({ Person_ID: person_ID, PlannedHoursContainer_ID: plannedHoursContainer_ID, PlannedHours_ID: plannedHours_ID, Skill_ID: skill_ID, EventVenue_ID: eventVenue_ID, Date: date, skill: skill, location: eventVenue, timeFrom: new Date(timeFrom), timeTo: new Date(timeTo) });
                                                            inserted = 1;
                                                        }
                                                        else {
                                                            self.dataSetTableRow.push({ Person_ID: person_ID, PlannedHoursContainer_ID: plannedHoursContainer_ID, Date: self.projectDates[k].RealDate, skill: skill, location: eventVenue, Skill_ID: skill_ID, EventVenue_ID: eventVenue_ID });
                                                        }

                                                    }
                                                }
                                                var rowColor;
                                                if (i % 2 != 0)
                                                    rowColor = "#d4d4d4";
                                                else
                                                    rowColor = "";
                                                self.dataSetTable.push(self.dataSetTableRow);
                                                self.numberOfContainers.push({ RowColor: rowColor });
                                                self.dataSetTableRow = [];
                                            }
                                        }
                                        $timeout();
                                    });
                                MF.api.get({
                                    table: "HR.V_PersonProjectDisponibility",
                                    filter: '{ "field":"Project_ID", "operator":"eq" , "value":' + self.project.ID + '}'//"Project_ID = " + self.project.ID + ""
                                })
                                    .then(function (res) {
                                        self.allEventAvailabilities = res;
                                        $timeout();
                                    });

                                $timeout();
                            }
                        }
                    }

                    self.saveDevelopment = function (development) {
                        self.dataSetObj = [];
                        //  Costruisco l'array da mandare in pasto alla stored

                        var dataRow = development;
                        if (self.project) {
                            for (var i = 0; i < development.length; i++) {
                                //Riga da sfogliare
                                for (var k = 0; k < self.projectDates.length; k++) {

                                    if (dataRow[i][k].PlannedHours_ID || (dataRow[i][k].timeFrom && dataRow[i][k].timeTo)) {
                                        if (dataRow[i][k].timeFrom && dataRow[i][k].timeTo)//Inserimenti o update
                                            self.dataSetObj.push({ PlannedHoursContainer_ID: dataRow[i][k].PlannedHoursContainer_ID, Person_ID: dataRow[i][0].Person_ID, Skill_ID: dataRow[i][k].Skill_ID, EventVenue_ID: dataRow[i][k].EventVenue_ID, PlannedHours_ID: dataRow[i][k].PlannedHours_ID, Date: dataRow[i][k].Date, timeFrom: new Date(dataRow[i][k].timeFrom.getTime() + (-1 * dataRow[i][k].timeFrom.getTimezoneOffset() * 60 * 1000)), timeTo: new Date(dataRow[i][k].timeTo.getTime() + (-1 * dataRow[i][k].timeTo.getTimezoneOffset() * 60 * 1000)), toDelete: 0 });
                                        else///Righe con ID ma senza orari, quindi record da cancellare 
                                            self.dataSetObj.push({ PlannedHoursContainer_ID: dataRow[i][k].PlannedHoursContainer_ID, Skill_ID: dataRow[i][k].Skill_ID, EventVenue_ID: dataRow[i][k].EventVenue_ID, PlannedHours_ID: dataRow[i][k].PlannedHours_ID, Date: dataRow[i][k].Date, timeFrom: null, timeTo: null, toDelete: 1 });
                                    }
                                }
                            }
                        }

                        MF.api.get({
                            storedProcedureName: "HR.usp_createPlannedHoursFromFrontEnd",
                            data: { models: self.dataSetObj, Project_ID: self.project.ID },
                        }).then(function (res) {
                            kendoConsole.log("Pianificazioni salvate", false);
                            self.getDevelopment();
                            $timeout();
                        });
                    }


                    self.getResourceTimetable = function (Person_ID) {
                        if (Person_ID) {
                            self.view = "resourceTimetable";

                            MF.api.get({
                                storedProcedureName: "HR.usp_PlanPropositionAndResourceTimetable_select",
                                data: { Person_ID: Person_ID, Project_ID: self.project.ID },
                            }).then(function (res) {
                                self.projectRows = [];
                                self.NoJobs = res[0][0].NoJobsInMonth;
                                self.selectedPerson = res[1][0];
                                if (!self.NoJobs) {
                                    var table = res[2];
                                    var projectCounter = res[3][0].nOfProjects;
                                    self.plannedDates = res[4];

                                    self.timeTable = [];
                                    var tableRow = [];



                                    for (var i = 0; i < projectCounter; i++) {
                                        for (var k = 0; k < self.plannedDates.length; k++) {
                                            if (table[i][k]) {
                                                var skill = table[i][k].toString().split("|")[0];
                                                var eventVeneue = table[i][k].toString().split("|")[1];
                                                var timePeriod = table[i][k].toString().split("|")[2];
                                                var busy = table[i][k].toString().split("|")[4];
                                                var bgColor = "";
                                                var fontColor = "";
                                                if (busy == "1") {
                                                    bgColor = "#980b0b";
                                                    fontColor = "white"
                                                }


                                                tableRow.push({ Skill: skill, EventVenue: eventVeneue, Time: timePeriod, BgColor: bgColor, FontColor: fontColor });
                                            }
                                            else
                                                tableRow.push({});
                                        }

                                        self.timeTable.push(tableRow);
                                        if (table[i].ActualProject) {
                                            self.projectRows.push({ Project: table[i].Project, BgColor: "white" })
                                        }
                                        else {
                                            self.projectRows.push({ Project: table[i].Project });
                                        }
                                        tableRow = [];
                                    }
                                }

                                $timeout();
                            });

                        }
                        else {
                            alert("Nessuna persona selezionata")
                        }
                    }

                    self.getColorByIndex = function (index) {
                        if (index % 2 != 0)
                            rowColor = "#d4d4d4";
                        else
                            rowColor = "";
                        return rowColor;
                    }

                    self.getDailyPlanning = function () {
                      

                     

                        self.dailyPlanLines = [];
                        self.dailyPlanCols = [];
                        self.dailyPlan = [];
                        self.dailyTimeTable = [];
                        self.dailyTimeTableRow = [];

                        if (self.activityGroup && self.dateDailyAssignment) {

                            $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');
                            MF.api.get({
                                storedProcedureName: "HR.ups_getRequestsForTheDay_Pivot",
                                data: { Day: self.dateDailyAssignment, ActivityGroup_ID: self.activityGroup.ID, Month_ID: self.month, Year: self.year },
                            }).then(function (res) {
                                ///Righe della tabella 
                                self.dailyTimeTable = [];
                                self.dailyTimeTableRow = [];


                                if (res[0][0].nCols) {

                                    var cols = res[0][0].nCols;
                                    var rows = res[2][0].nRows;

                                    self.dailyPlan = res[1];


                                    for (var i = 0; i < rows; i++) {
                                        self.dailyPlanLines.push({});
                                    }

                                    //Colonne
                                    for (var k = 0; k < cols; k++) {
                                        self.dailyPlanCols.push({});
                                    }

                                    for (var i = 0; i < rows; i++) {
                                        for (var k = 1; k <= cols; k++) {

                                            var checkBoxValue = self.dailyPlan[i][k].split("|")[0];
                                            var plannedHours_ID = self.dailyPlan[i][k].split("|")[1];
                                            var resourceRequest_ID = self.dailyPlan[i][k].split("|")[2];
                                            var colDescription = self.dailyPlan[i][k].split("|")[3];
                                            var person_ID = self.dailyPlan[i][k].split("|")[4];
                                            var available = self.dailyPlan[i][k].split("|")[5];
                                            self.dailyTimeTableRow.push({ CheckBoxValue: checkBoxValue, PlannedHours_ID: plannedHours_ID, ResourceRequest_ID: resourceRequest_ID, ColDescription: colDescription, Person_ID: person_ID, Available: available })
                                        }
                                        self.dailyTimeTable.push(self.dailyTimeTableRow);
                                        self.dailyTimeTableRow = [];
                                    }
                                }

                                $("#spin_modal_overlay").remove();
                                $timeout();
                            });

                        }
                    }
                    self.dailyTimeTableStatus = function (i, k) {
                        //Cambio il valore del CheckBox che determina l'assegnazione dell'incarico

                        //Se è 1 diventa 0
                        if (self.dailyTimeTable[i][k].CheckBoxValue == "1") {
                            self.dailyTimeTable[i][k].CheckBoxValue = "0";
                        }
                        //Se è 0 diventa 1
                        else {
                            self.dailyTimeTable[i][k].CheckBoxValue = "1";
                        }
                        $timeout();
                    }

                    self.saveDailyChanges = function () {
                        MF.api.get({
                            storedProcedureName: "HR.usp_saveDailyPlanChanges",
                            data: { models: self.dailyTimeTable},
                        }).then(function (res) {
                            kendoConsole.log("Pianificazioni salvate", false);
                            self.getDailyPlanning();
                            $timeout();
                        });
                    }

                    $timeout();
                }

                
            ]);
    }
}())