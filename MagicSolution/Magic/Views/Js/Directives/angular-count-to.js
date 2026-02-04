var countTo = angular.module('countTo', [])
    .directive('countTo', ['$timeout', function ($timeout) {
        return {
            replace: false,
            scope: true,
            link: function (scope, element, attrs) {

                var e = element[0];
                var num, refreshInterval, duration, steps, step, countTo, value, increment, isFloat, commaCount, multiplicator;

                var calculate = function () {
                    refreshInterval = 30;
                    step = 0;
                    scope.timoutId = null;
                    isFloat = attrs.countTo.match(/\.(\d+)/);
                    commaCount = attrs.commaCount || (isFloat ? isFloat[1].length : 0);
                    multiplicator = commaCount ? Math.pow(10, commaCount) : 0;
                    countTo = (commaCount ? parseFloat(Math.round(attrs.countTo * multiplicator) / multiplicator) : parseInt(attrs.countTo)) || 0;
                    scope.value = (commaCount ? parseFloat(Math.round(e.textContent * multiplicator) / multiplicator) : parseInt(e.textContent, 10)) || 0;
                    duration = (parseFloat(attrs.duration) * 1000) || 0;

                    steps = Math.ceil(duration / refreshInterval);
                    increment = ((countTo - scope.value) / steps);
                    num = scope.value;
                }

                var tick = function () {
                    scope.timoutId = $timeout(function () {
                        num += increment;
                        step++;
                        if (step >= steps) {
                            $timeout.cancel(scope.timoutId);
                            num = countTo;
                            e.textContent = countTo.toLocaleString(window.culture);
                        } else {
                            e.textContent = (commaCount ? parseFloat(Math.round(num * multiplicator) / multiplicator).toFixed(commaCount) : Math.round(num)).toLocaleString(window.culture);
                            tick();
                        }
                    }, refreshInterval);

                }

                var start = function () {
                    if (scope.timoutId) {
                        $timeout.cancel(scope.timoutId);
                    }
                    calculate();
                    tick();
                }

                attrs.$observe('countTo', function (val) {
                    if (val) {
                        start();
                    }
                });

                attrs.$observe('value', function (val) {
                    start();
                });

                return true;
            }
        }

    }]);