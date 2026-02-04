define(["angular", "angular-magic-gantt"], function (angular) {
    return angular
   .module('Gantt', ["magicGantt"])
   .controller('GanttController', [
       '$http',
       'config',
       '$q',
       '$filter',
       function ($http, config, $q, $filter) {
           var self = this;
           $.extend(self,config);
       }
   ]);
});

