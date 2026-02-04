define(["angular", "angular-magic-form"], function (angular) {
    return angular
   .module('RowReader', ["magicForm"])
   .controller('RowReaderController', [
       '$http',
       'config',
       '$q',
       '$filter',
       function ($http, config, $q, $filter) {
           var self = this;
           $.extend(self, config);
           self.magicFormOptions = {
               itemsPerRow: config.itemsPerRow,
               readonly: true,
               layerID: config.layerID,
               valuesToResolve: config.rowData
           };
           $.extend(self.magicFormOptions, config.magicFormSettings);
       }
   ]);
});