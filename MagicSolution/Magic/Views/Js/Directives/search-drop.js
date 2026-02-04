define(['angular'], function () {
    angular.module('searchDrop', [])
        .directive('searchDrop', ['$timeout', function ($timeout) {
            return {
                replace: false,
                restrict: "E",
                templateUrl: "/Magic/Views/Templates/Directives/search-drop.html",
                scope: {
                    "sdValues": "=",
                    "sdSelected": "@",
                    "sdValue": "@",
                    "sdLabel": "@",
                    "sdMaxDropHeight": "@",
                    "sdOnselect": "&",
                    "sdCloseDropAfter": "@",
                    "sdInitialValue": "@",
                    "sdStayOpen": "=",
                    "sdPlaceholder": "@"
                },
                require: "?ngModel",
                link: function (scope, element, attrs, ngModel) {
                    scope.closeTimeout;
                    scope.show = false;
                    scope.sdCloseDropAfter = scope.sdCloseDropAfter || 1500;
                    scope.inputDirty = false;
                    scope.initialLabel = null;
                    scope.doNotCloseThisTime = false;
                    scope.sdPlaceholder = scope.sdPlaceholder || "";

                    if (ngModel)
                        ngModel.$render = function () {
                            scope.setLabel(ngModel.$viewValue);
                        };

                    $(window).click(function (event) {
                        if (!scope.doNotCloseThisTime) {
                            $timeout(function (){ scope.show = false; });
                        }
                        scope.doNotCloseThisTime = false;
                    });

                    scope.get = function (key, value, isLabel) {
                        var wanted = isLabel ? scope.sdLabel : scope.sdValue;
                        if (wanted == "$$key")
                            return key;
                        else if (wanted == "$$value")
                            return value;
                        else
                            return value[wanted];
                    };

                    scope.filterList = function () {
                        var results = {},
                            searchTerm;
                        scope.resultsLength = 0;
                        if (!scope.searchTerm) {
                            scope.resultsLength = true;
                            return scope.sdValues;
                        }
                        else
                            searchTerm = scope.searchTerm.toLowerCase();
                        if(scope.sdLabel == "$$key")
                            $.each(scope.sdValues, function (k, v) {
                                if (k.toLowerCase().indexOf(searchTerm) != -1) {
                                    results[k] = v;
                                    scope.resultsLength++;
                                }
                            });
                        else if(scope.sdLabel == "$$value")
                            $.each(scope.sdValues, function (k, v) {
                                if (v.toLowerCase().indexOf(searchTerm) != -1) {
                                    results[k] = v;
                                    scope.resultsLength++;
                                }
                            });
                        else
                            $.each(scope.sdValues, function (k, v) {
                                if (v[scope.sdLabel].toLowerCase().indexOf(searchTerm) != -1) {
                                    results[k] = v;
                                    scope.resultsLength++;
                                }
                            });
                        return scope.filteredValues = results;
                    };

                    scope.checkInput = function () {
                        if (scope.searchTerm == "") {
                            scope.sdOnselect({
                                selectedKey: "",
                                objectKey: "",
                                objectValue: null
                            });
                        }
                        else if (scope.searchTerm && scope.resultsLength === 1) {
                            $.each(scope.filteredValues, function (k, v) {
                                if (scope.searchTerm.toLowerCase() == scope.get(k, v, true).toLowerCase())
                                    scope.notify(k, v);
                                return false;
                            });
                        }
                    };

                    scope.notify = function (key, value) {
                        if (ngModel)
                            ngModel.$setViewValue(scope.get(key, value));
                        if (!scope.sdOnselect)
                            return;
                        var returnValue = scope.sdOnselect({
                            selectedKey: scope.get(key, value), //sdValue
                            objectKey: key, //if sdValues is object, then key of selected object, if array index of selection
                            objectValue: value
                        });
                        scope.searchTerm = returnValue !== undefined ? returnValue : scope.get(key, value, true);
                        if (scope.sdStayOpen === true)
                            return;
                        scope.show = false;
                    };

                    scope.open = function () {
                        scope.show = true;
                    };

                    scope.shallShow = function () {
                        return scope.show ? "open" : "";
                    };

                    scope.dropStyles = function () {
                        var styles = {};
                        if (scope.sdMaxDropHeight) {
                            styles["max-height"] = scope.sdMaxDropHeight;
                            styles["overflow"] = "auto";
                        }
                        return styles;
                    };

                    scope.setDirty = function () {
                        scope.inputDirty = true;
                    };

                    scope.setModelValue = function () {
                        if (ngModel)
                            ngModel.$setViewValue(scope.searchTerm);
                    };

                    scope.clearInput = function () {
                        scope.searchTerm = "";
                        if (ngModel)
                            ngModel.$setViewValue("");
                    };

                    scope.$watch(function (scope) {
                        return scope.sdValues;
                    }, function (newValue, oldValue) {
                        if (!scope.inputDirty && scope.sdInitialValue) {
                            if (!scope.initialLabel) {
                                scope.setLabel(scope.sdInitialValue);
                            } else {
                                scope.searchTerm = scope.initialLabel;
                            }
                        }
                    });

                    scope.setLabel = function (value) {
                        $.each(scope.sdValues, function (k, v) {
                            if (scope.sdValue == "$$key" && k == value) {
                                scope.searchTerm = scope.get(k, v, true);
                                return false;
                            }
                            else if (scope.sdValue == "$$value" && v == value) {
                                scope.searchTerm = scope.get(k, v, true);
                                return false;
                            }
                            else if (v[scope.sdValue] == value) {
                                scope.searchTerm = scope.get(k, v, true);
                                return false;
                            }
                        });
                    };
                }
            };

        }]);
});