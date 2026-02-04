var customDeps = (typeof(customFormOptionsModules) != "undefined" && customFormOptionsModules) ? $.map(customFormOptionsModules, function (dep) { return dep; }) : [];
var customModules = (typeof (customFormOptionsModules) != "undefined" && customFormOptionsModules) ? Object.keys(customFormOptionsModules) : [];
define(["angular", "MagicSDK", "angular-magic-grid", "angular-magic-chart", "angular-magic-form-sp", "angular-magic-pivot", "angular-magic-tree", "angular-magic-action-menu", "angular-magic-change-log", "angular-magic-grid-sp", "angular-magic-chart-gauge", "angular-magic-wizard"].concat(customDeps), function (angular, MF) {
    return angular
        .module('FormOptions', ["magicGrid", "magicChart", "magicFormSp", "magicPivot", "magicTree", "magicActionMenu", "magicChangeLog", "magicGridSp", "magicChartGauge", "magicWizard"].concat(customModules))
   .controller('FormOptionsController', [
       'config',
       function (config) {
           var self = this;
           //options are user as a parameter for selection queries run bythe directives
           self.options = config.options;
           self.translate = function (text) {
               self[text] = true;
               return getObjectText(text);
           };
           self.submitForm = function (formname,storedprocedure) {
               var self = this;
               var master_id = (self.options && self.options.id) ? self.options.id : null;
               //call database stored procedure with model data
               var formdata = self[formname];
               requireConfigAndMore(["MagicSDK"], function (MF) {
                   MF.api.set({
                       procedure: storedprocedure,
                       primaryKeyColumn: master_id ? "gridItem_ID" : "none",
                       contentType: "XML",
                       data: $.extend(formdata, { gridItem_ID: master_id, formName: formname })
                   }
                     , master_id ? master_id : 0).fail(function (err) { kendoConsole.log(err.responseText, true); }).then(function (res) {
                         kendoConsole.log(getObjectText("genericok"),false);
                         if ($('#wndmodalContainer').hasClass('in')) {
                             $('#wndmodalContainer').modal('hide');
                         }
                     });
               });
           }
       }
   ]);
});