define(["angular", "angular-magic-form", "angular-ui-select"], function (angular) {
   return angular
        .module("FL_FILINP", ["magicForm","ui.select"])
        .controller("FL_FILINPController",
            [
               '$http',
               'config',
               '$q',
               '$filter',
               function ($http, config, $q, $filter) {
                   var self = this;
				   self.FL_FILEST_FL_TIPFIL_ID = config.FL_FILEST_FL_TIPFIL_ID;
                   self.ProcessData = {};
                   self.lang = {
                       save: getObjectText("save"),
                       groups: getObjectText("groups")
                   };
                   $.extend(self, config);
                   self.magicFormOptions = {
                       itemsPerRow: 2,
                       source: "core.FL_V_FILINP_JOBFIELDS"
                   };
                
                   self.but_submit= function (form) {
                       var inputform = [];
                       var data = {};
                       if (form.$valid) {
                           data.FL_FILEST_FL_TIPFIL_ID = config.FL_FILEST_FL_TIPFIL_ID;
                           $.each(self.ProcessData,function (key, value) {
                               inputform.push({ name: key, value: value });
                           });
                           data.inputdata = inputform;
                           self.c_runjob(data);
                       }
                   };

                   self.c_runjob = function(data) {
                       runexport(data, true);
                   }
               }
            ]
        )
});