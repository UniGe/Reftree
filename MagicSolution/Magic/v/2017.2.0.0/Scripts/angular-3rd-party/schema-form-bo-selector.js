define(['angular', 'bootstrap-decorator'], function (angular) {
    angular.module("schemaForm").run(["$templateCache", function ($templateCache) {
        $templateCache.put("directives/decorators/bo-selector.html", "<div class='form-group schema-form-grid' ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess(), \'has-feedback\': form.feedback !== false}\" ng-init=\"insideModel=$$value$$;\">\
            <label class=\"control-label {{form.labelHtmlClass}}\" ng-show=\"showTitle()\">{{form.title}}</label>\
            <div bo-selector ng-show=\"form.key\" sf-input-options=\"form.options\" model=\"$$value$$\"></div>\
        </div>");
    }]);

    angular.module('schemaForm').config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider', function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
        schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'boSelector', 'directives/decorators/bo-selector.html');
    }])
        .directive("boSelector", function () {
            return {
                restrict: "A",
                controllerAs: "bos",
                scope: {
                    sfInputOptions: "=",
                    model: "="
                },
                bindToController: true,
                controller: [
                    '$element',
                    '$scope',
                    '$timeout',
                    function ($element, $scope, $timeout) {
                        var self = this,
                            boSelector = $element.bOSelector($.extend({
                                isKendoForm: false,
                                onChange: function (event) {
                                    self.model = boSelector.getBOs();
                                },
                                showLabel: false,
                                openGridInNewWindow: true,
                                tags: self.model
                            }, self.sfInputOptions))[0];
                    }]
            }
        });
});