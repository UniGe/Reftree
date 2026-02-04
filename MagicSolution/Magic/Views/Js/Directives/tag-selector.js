define(["angular"], function (angular) {
    angular
        .module("tagSelector", [])
        .directive("tagSelector",
        function () {
            return {
                restrict: "A",
                scope: {
                    tagSelector: "="
                },
                link: function (scope, element, attrs) {
                    var isInitialWatch = true,
                        tagSelector = element.tagSelector({
                            tags: scope.tagSelector,
                            onChange: function (e) {
                                scope.tagSelector = tagSelector.getTags();
                            }
                        })[0];

                    //scope.$watch('tagSelector', function (tags) {
                    //    if (!isInitialWatch) {
                    //        tagSelector.removeAll();
                    //        tagSelector.addTags(tags);
                    //    }
                    //    isInitialWatch = false;
                    //});
                }
            }
        }
        );
});