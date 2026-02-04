define(["angular", "MagicSDK", "angular-filter", "angular-magic-form", "angular-kendo"], function (angular, MF) {
    angular
    .module('PersonalMonitor', ["angular.filter", "magicForm", "kendo.directives"])
    .controller('PersonalMonitorController', ['$http', '$scope', '$q', '$filter', function ($http, $scope, $q, $filter) {
        var self = this;
        self.lang = {
            send: getObjectText("send")
        };
        self.formData = [];
        self.gridOptions = getDefaultGridSettings();
        self.gridOptions.toolbar = null;
        self.dropDownOptions = {
            dataTextField: 'PP_PROBUT_LABEL',
            dataValueField: 'PP_PROBUT_ID',
            template: '<span data-value="{{dataItem}}" ng-bind="dataItem.PP_PROBUT_LABEL"></span>',
            open: function(e) {
                e.sender.popup.element.addClass('monitor-dropdown-popup');
            },
            select: function (e) {
                self.selected = e.item.children().data('value');
                delete self.formData;
                delete self.gridOptions.dataSource;
                $scope.$apply();
            }
        };
        self.submitForm = function (form) {
            $scope.$broadcast('schemaFormValidate');
            if (form.$valid) {
                self.gridOptions.dataSource = MF.kendo.getStoredProcedureDataSource(self.selected.PP_PROBUT_SP_EXECUTE, {
                    data: $.extend({}, self.formData),
                    success: function (res) {
                        delete self.formData;
                    }
                });
            }
        };
        $http.post("/api/Procedure/GetTabStripData/")
            .then(function (result) {
                self.tabdata = result.data;
            }, function (result) {
                kendoConsole.log(result.data, true);
            });
    }]);
});