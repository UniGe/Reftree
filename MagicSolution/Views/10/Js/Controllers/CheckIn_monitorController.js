define(["angular", "angular-filter"], function (angular) {
    angular
        .module("CheckIn_monitor", ["angular.filter"])
        .controller("CheckIn_monitorController",
            [
                '$http',
                '$scope',
                function ($http, $scope) {
                    var self = this;
                    self.projectData = [];
                    self.checkInData = {
                      };
                    self.lastUpdate = null;
                    var userCode = window.ApplicationInstanceId + "-" + window.Username,
                        checkInDataCode = "checkIn-" + userCode

                    self.lang = {
                        project: getObjectText("project"),
                        venue: getObjectText("venue"),
                        room: getObjectText("room"),
                        refresh: getObjectText("refreshcheckinlist"),
                    };

                    self.init = function () {
                        $http
                            .post(
                                "/api/GENERICSQLCOMMAND/GetWithFilter",
                                {
                                    GridName: "dbo.V_CheckIn_ProgettoSedeAula",
                                    table: "dbo.V_CheckIn_ProgettoSedeAula",
                                    order: "PROGET_DESCRIZIONE",
                                    where: "User_ID = {userId}",
                                    parse: true
                                }
                            )
                            .then(
                                function (res) {
                                    if (res.data.Data.length) {
                                        self.projectData = res.data.Data[0].Table;
                                       /* var checkInData = sessionStorage.getItem(checkInDataCode);
                                        if (checkInData) {
                                            checkInData = JSON.parse(checkInData);
                                            self.checkInData.project = checkInData.project;
                                            self.checkInData.venue = checkInData.venue;
                                          //  self.checkInData.room = checkInData.room;
                                        }
                                        else {*/
                                            if (self.projectData.length) {
                                                self.checkInData.project = self.projectData[0].PROGET_ID;
                                                self.checkInData.venue = self.projectData[0].ANASED_ID;
                                           //     self.checkInData.room = self.projectData[0].SPASED_ID;
                                            }
                                        //}
                                    }
                                    
                                },
                                function (res) {
                                    console.log("error on retrieving project data");
                                }
                            );
                    };

                  /*  self.saveProjectInSession = function () {
                        sessionStorage.setItem(checkInDataCode, JSON.stringify(
                            self.checkInData
                        ));
                    };*/

                    self.refreshGrid = function () {
                        //get and render the grid with filters.
                        var filter = {
                            logic: "AND", filters: [{ field: "REGPRE_CHECK_OUT", operator: "eq", value: null }, { field: "REGPRE_PROGET_ID", operator: "eq", value: self.checkInData.project }, { field: "REGPRE_ANASED_ID", operator: "eq", value: self.checkInData.venue }//, { field: "REGPRE_SPASED_ID", operator: "eq", value: self.checkInData.room }
                            ]
                        };
                        if ($("#grid").data("kendoGrid") == null) {
                            var gridobj = getrootgrid("REGPRE_Registrazioni_presenze");
                            gridobj.dataSource.filter = filter;
                            gridobj.dataBound = function () {
                                self.lastUpdate = kendo.toString(new Date(), "G");
                                $scope.$apply();
                            }
                            renderGrid(gridobj);
                        }
                        else {
                            var grid = $("#grid").data("kendoGrid");
                            grid.dataSource.filter(filter);
                        }
                    };
                    self.init();
                }
            ]
        )
});