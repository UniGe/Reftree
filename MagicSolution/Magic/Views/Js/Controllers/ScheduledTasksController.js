define(['angular'], function (angular) {
    angular
    .module('ScheduledTasks', [])
    .controller('ScheduledTasksController', ['$http', '$scope', '$q', function ($http, $scope, $q) {
        var self = this;
        var userprofiles = window.UserAppProfiles.split(';');
        self.userCanSchedule = false;
        self.taskIndicators = [];
        self.title = getObjectText('taskmanagement').toUpperCase();

        for (var i = 0; i < userprofiles.length - 1; i++) {
            //se l' utente ha un profilo che puo' schedulare
            if (userprofiles[i].split('|')[2].toLowerCase() == "true") {
                self.userCanSchedule = true;
                break;
            }
        }

        $scope.initTaskIndicators = function () {
            $http.post("/api/GENERICSQLCOMMAND/SelectFromXMLStoredProcedure", {
                EntityName: 'dbo.DashboardGetTaskIndicators',
                DataSourceCustomParam: JSON.stringify({ read: { Type: "StoredProcedure", Definition: 'dbo.DashboardGetTaskIndicators' } })
            }).then(function (res) {
                if (res.data.Errors == null)
                    self.taskIndicators = res.data.Data[0].Table;
            });
        };

        self.showTaskIndicator = function (typeofindicators, gridcode) {
            var tabselector = '[href="#tasks"]';
            var gridselector = "tasks";
            if (gridcode === "V_TSKMON_task_wrkflw_monitor") {
                tabselector = '[href="#leads"]';
                gridselector = "leads";
            }
            $(tabselector).attr("data-toggle", "tab");
            $(tabselector).parent("li").removeClass("disabled");
            require([window.includesVersion + "/Custom/6/Scripts/magicBrokerDashboard.js"], function () {
                var d = new Date();
                var start = new Date(d.getFullYear(), 0, 1);
                var dend = d;
                //definisco le date dell'intervallo per il calendario
                dstart = new Date();
                dstart.setFullYear(dstart.getFullYear() - 10);
                dend = new Date();
                dend.setDate(dend.getDate() + 30);

                //fires when the tab is about to be shown
                $(tabselector).one('shown.bs.tab', function (event) {
                    showtabworkflow({
                        gridcode: gridcode,
                        start: start,
                        dstart: dstart,
                        dend: dend,
                        gridselector: gridselector,
                        indicatortype: typeofindicators
                    });
                });

                $(tabselector).trigger('click');

            });
        };

        $scope.initTaskIndicators();

    }]);
});
