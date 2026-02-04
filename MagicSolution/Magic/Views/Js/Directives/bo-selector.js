define(["angular"], function (angular) {
    angular
        .module("boSelector", [])
        .directive("boSelector",
            function () {
                return {
                    restrict: "A",
                    scope: {},
                    bindToController: {
                        boOptions: "=boSelector",
                        onChange: "&"
                    },
                    controllerAs: "bos",
                    controller: [
                        "$scope",
                        "$timeout",
                        "$element",
                        function ($scope, $timeout, $element) {
                            var boSelector = $element.bOSelector($scope.bos.onChange ? $.extend($scope.bos.boOptions, {
                                onChange: function (event) {
                                    $scope.bos.onChange({
                                        event: event,
                                    });
                                }
                            }) : $scope.bos.boOptions);
                        }
                    ]
                }
            }
    );
});