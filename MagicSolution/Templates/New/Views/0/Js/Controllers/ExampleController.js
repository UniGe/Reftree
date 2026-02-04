var controllerName = "Example";

define(['angular'], function (angular) {
    return angular
        .module(controllerName, [])
        .controller(controllerName + "Controller", [
            '$timeout',
            '$scope',
            '$http',
            '$element',
            function ($timeout, $scope, $http, $element) {
                var self = this;

                self.helloWorld = "Hi from Angular1";
            }
        ]);
});