define(['angular', 'angular-magic-form'], function (angular) {
    var app = angular
    .module('AdditionalDataForm', ["magicForm"])
    .controller('AdditionalDataFormController', ['$http', 'config', '$scope', function ($http, config, $scope) {
        var self = this;
        self.model = {};
        self.tableName = config.gridName;
        self.lang = {
            applyfilter: getObjectText('Applyfilter')
        }

        self.getModel = function () {
            return self.model;
        };

        self.formReady = function () {
            config.deferred.resolve();
        };

        self.formSubmit = function (form) {
            if (form.$valid && form.$dirty)
                config.callback();
            return false;
        }

        self.options = {
            itemsPerRow: 2,
            callback: self.formReady
        };

    }]);
    return app;
});