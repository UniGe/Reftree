define(["angular", "angular-magic-form", "angular-ui-select"], function (angular) {
   return angular
        .module("JO_JOBANA", ["magicForm","ui.select"])
        .controller("JO_JOBANAController",
            [
               '$http',
               'config',
               '$q',
               '$filter',
               function ($http, config, $q, $filter) {
                   var self = this;
                   self.ProcessData = {};
                   self.lang = {
                       save: getObjectText("save"),
                       groups: getObjectText("groups")
                   };
                   $.extend(self, config);
                   self.magicFormOptions = {
                       itemsPerRow: config.itemsPerRow,
                       source:"core.JO_V_JOBFIE_JOBFIELDS"
                   };
                
                   self.but_submit= function (form) {
                       var inputform = [];
                       var data = {};
                       if (self.isfirststep == true && self.selectedGroups.length == 0) {
                           kendoConsole.log(getObjectText("Selezionare_un_gruppo"), true);
                           return;
                       }
                       if (form.$valid) {
                           data.JO_TIPJOB_ID = $("#appcontainer").prop("JO_TIPJOB_ID");
                           data.isfirststep = self.isfirststep;
                           self.isfirststep ? data.groups = self.selectedGroups : data.JO_JOBANA_ID = self.JO_JOBANA_ID;
                           $.each(self.ProcessData, function (key, value) {
                               if (value instanceof Date)
                                   value = toTimeZoneLessString(value);
                               inputform.push({ name: key, value: value });
                           });
                           data.inputdata = inputform;
                           self.c_runjob(data);
                       }
                   };

                   self.c_runjob = function(data) {
                       runjob(data, self.isfirststep,true);
                   }
               }
            ]
        )
});