define(["angular", "MagicSDK", "angular-kendo"], function (angular, MF) {
    return angular
   .module('TaskWorkedHours', ["kendo.directives"])
   .controller('TaskWorkedHoursController', [
       'config',
       '$timeout',
       '$scope',
       function (config,$timeout,$scope) {
           var self = this;
           self.translate = function (text) {
               return getObjectText(text);
           };
           self.save_worked_hours_SP = window.workedHours_SP ? window.workedHours_SP : "CUSTOM.usp_Calendar_timesheet_write";
           //var get_schedulableUsersForTask_API = window.workflow_get_schedulableUsersForTask_API ? window.workflow_get_schedulableUsersForTask_API : "/api/MAGIC_MMB_USERS/PostSchedulableUsers";
           self.taskDescription = config.taskDescription;
           self.taskid = config.taskid;
           self.DateFrom = new Date(config.start);
           self.hourFrom = new Date(config.start);
           self.hourTo = new Date(config.end);
           self.minDate = new Date(config.start);
           self.hourFromString = kendo.toString(new Date(config.start), "t");
           self.hourToString = kendo.toString(new Date(config.end), "t");
           self.MF = config.MF;
           self.fromChanged = function () {
               self.minDate = new Date(self.hourFrom);
               $("#toTimePicker").data("kendoTimePicker").min(self.minDate);
               self.hourTo = null;
           };

          self.save = function (form)
          {
              $scope.$broadcast('schemaFormValidate');
              if (!form.$valid)
                  return false;
              //prevent double click
              if ($("#executesave").attr("clicked") == "clicked")
                  return;
              $("#executesave").attr("clicked", "clicked");
              
              var data = {
                  DateFrom: toTimeZoneLessString($scope.twh.DateFrom),
                  HourFrom: toTimeZoneLessString($scope.twh.hourFrom),
                  HourTo: toTimeZoneLessString($scope.twh.hourTo),
                  taskId: $scope.twh.taskid,
                  Bill: $scope.twh.Bill ? $scope.twh.Bill : false,
                  Booked: false,
                  Close: $scope.twh.Close ? $scope.twh.Close : false,
                  Note: $scope.twh.Note
              }

              $scope.twh.MF.api.get({
                  storedProcedureName: $scope.twh.save_worked_hours_SP,
                      data: data
              }).then(function () {
                  kendoConsole.log(getObjectText("genericok"), false);
                  $("#wndmodalContainer").modal('hide');
              });

          }
       }
   ]);
});