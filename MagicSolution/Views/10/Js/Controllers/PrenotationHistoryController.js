define(["angular", "angular-filter"], function (angular) {
    angular
        .module("PrenotationHistory", ["angular.filter"])
        .controller("PrenotationHistoryController",
            [
                '$http',
                '$sce',
                '$scope',
                function ($http, $sce, $scope) {
                    var self = this;
                    self.projectData = [];
                    self.checkInData = {
                    };
                    self.lastUpdate = null;
                    var userCode = window.ApplicationInstanceId + "-" + window.Username,
                        checkInDataCode = "checkIn-" + userCode

                    self.lang = {
                        project: getObjectText("project"),
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
                                        var checkInData = sessionStorage.getItem(checkInDataCode);
                                        if (checkInData) {
                                            checkInData = JSON.parse(checkInData);
                                            self.checkInData.project = checkInData.project;
                                        }
                                        else {
                                            if (self.projectData.length) {
                                                self.checkInData.project = self.projectData[0].PROGET_ID;
                                                      }
                                        }
                                   }

                                },
                                function (res) {
                                    console.log("error on retrieving project data");
                                }
                            );
                    };

                    self.saveProjectInSession = function () {
                        sessionStorage.setItem(checkInDataCode, JSON.stringify(
                            self.checkInData
                        ));
                    };

                   self.removeInscriptionBtn = function (e) {
                        $("#" + e.sender.element[0].id + " tbody tr .k-grid-reportiassis").each(function () {
                            var currentDataItem = $("#" + e.sender.element[0].id).data("kendoGrid").dataItem($(this).closest("tr"));
                            var code = currentDataItem.PRENOT_CODICE;
                            if (code == null)
                                $(this).remove();
                        });
                    }

                    self.refreshGrid = function () {
                        //get and render the grid with filters.
                        var filter = {
                            logic: "AND", filters: [{ field: "PRENOT_PROGET_ID", operator: "eq", value: self.checkInData.project }
                            ]
                        };
                        if ($("#grid").data("kendoGrid") == null) {
                            var gridobj = getrootgrid("PRENOT_Prenotazioni");
                            gridobj.dataSource.filter = filter;
                            var origdatabaound = gridobj.dataBound;
                            gridobj.dataBound = function (e) {
                                origdatabaound.call(this, e);
                                self.removeInscriptionBtn.call(this, e);
                                console.log(e);
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