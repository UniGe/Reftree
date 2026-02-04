define(['angular', 'bootstrap-decorator', 'angular-schema-form-dynamic-select-ui'], function (angular) {
    angular.module("schemaForm").run(["$templateCache", function ($templateCache) {
        $templateCache.put("directives/decorators/geo-autocomplete.html",
            "<div ng-controller=\"dynamicSelectController\" class=\"form-group\" ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess(), \'has-feedback\': form.feedback !== false}\" ng-init=\"insideModel=$$value$$;\">\
            <label class=\"control-label {{form.labelHtmlClass}}\" ng-show=\"showTitle()\">{{form.title}}</label>\
            <div class=\"form-group\">\
                <div class=\"sf-geo-autocomplete-wrapper\">\
                    <div>\
                        <ui-select ng-model=\"select_model.selected\" ng-if=\"!(form.options.tagging||false)\" theme=\"bootstrap\" ng-disabled=\"form.disabled\" on-select=\"$$value$$=$item.value\" class=\"{{form.options.uiClass}}\">\
                            <ui-select-match\ placeholder=\"{{form.placeholder || form.schema.placeholder || (\'placeholders.select\' | translate)}}\">{{select_model.selected.name}}</ui-select-match>\
                            <ui-select-choices refresh=\"populateTitleMap(form, $select.search)\" refresh-delay=\"form.options.refreshDelay\" group-by=\"form.options.groupBy\" repeat=\"item in form.titleMap | propsFilter: {name: $select.search, description: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\') }\">\
                                <div ng-bind-html=\"item.name | highlight: $select.search\"></div>\
                                <div ng-if=\"item.description\">\
                                    <span ng-bind-html=\"\'<small>\' + (\'\'+item.description | highlight: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\'))+ \'</small>\'\"></span>\
                                </div>\
                            </ui-select-choices>\
                        </ui-select>\
                        <ui-select ng-controller=\"dynamicSelectController\" ng-model=\"select_model.selected\" ng-if=\"(form.options.tagging||false) && !(form.options.groupBy || false)\" tagging=\"form.options.tagging||false\" tagging-label=\"form.options.taggingLabel\" tagging-tokens=\"form.options.taggingTokens\" theme=\"bootstrap\" ng-disabled=\"form.disabled\" on-select=\"$$value$$=$item.value\" class=\"{{form.options.uiClass}}\">\
                            <ui-select-match placeholder=\"{{form.placeholder || form.schema.placeholder || (\'placeholders.select\' | translate)}}\">{{select_model.selected.name}}&nbsp;<small>{{(select_model.selected.isTag===true ? form.options.taggingLabel : \'\')}}</small></ui-select-match>\
                            <!--repeat code because tagging does not display properly under group by but is still useful -->\
                            <ui-select-choices refresh=\"populateTitleMap(form, $select.search)\" refresh-delay=\"form.options.refreshDelay\" repeat=\"item in form.titleMap | propsFilter: {name: $select.search, description: (form.options.searchDescription===true ? $select.search : \'NOTSEARCHINGFORTHIS\') }\">\
                                <div ng-if=\"item.isTag\" ng-bind-html=\"\'<div>\' + (item.name   | highlight: $select.search) + \' \' + form.options.taggingLabel + \'</div><div class=&quot;divider&quot;></div>\'\"></div>\
                                <div ng-if=\"!item.isTag\" ng-bind-html=\"item.name + item.isTag| highlight: $select.search\"></div>\
                                <div ng-if=\"item.description\">\
                                    <span ng-bind-html=\"\'<small>\' + (\'\'+item.description | highlight: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\')) + \'</small>\'\"></span>\
                                </div>\
                            </ui-select-choices>\
                        </ui-select>\
                        <!--repeat code because tagging does not display properly under group by but is still useful -->\
                        <ui-select ng-controller=\"dynamicSelectController\" ng-model=\"select_model.selected\" ng-if=\"(form.options.tagging||false) && (form.options.groupBy || false)\" tagging=\"form.options.tagging||false\" tagging-label=\"form.options.taggingLabel\" tagging-tokens=\"form.options.taggingTokens\" theme=\"bootstrap\" ng-disabled=\"form.disabled\" on-select=\"$$value$$=$item.value\" class=\"{{form.options.uiClass}}\">\
                            <ui-select-match placeholder=\"{{form.placeholder || form.schema.placeholder || (\'placeholders.select\' | translate)}}\">\
                                {{select_model.selected.name}}&nbsp;<small>{{(select_model.selected.isTag===true ? form.options.taggingLabel : \'\')}}</small>\
                            </ui-select-match>\
                            <ui-select-choices group-by=\"form.options.groupBy\" refresh=\"populateTitleMap(form, $select.search)\" refresh-delay=\"form.options.refreshDelay\" repeat=\"item in form.titleMap | propsFilter: {name: $select.search, description: (form.options.searchDescription===true ? $select.search : \'NOTSEARCHINGFORTHIS\') }\">\
                                <div ng-if=\"item.isTag\" ng-bind-html=\"\'<div>\' + (item.name  | highlight: $select.search) + \' \' + form.options.taggingLabel + \'</div><div class=&quot;divider&quot;></div>\'\"></div>\
                                <div ng-if=\"!item.isTag\" ng-bind-html=\"item.name + item.isTag| highlight: $select.search\"></div>\
                                <div ng-if=\"item.description\">\
                                    <span ng-bind-html=\"\'<small>\' + (\'\'+item.description | highlight: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\')) + \'</small>\'\"></span>\
                                </div>\
                            </ui-select-choices>\
                        </ui-select>\
                    </div>\
                    <geo-autocomplete-btn sf-input-options=\"form\" model=\"model\"></geo-autocomplete-btn>\
                </div>\
                <input type=\"hidden\" name=\"{{form.key.slice(-1)[0]}}\" toggle-single-model sf-changed=\"form\" ng-model=\"insideModel\" schema-validate=\"form\"/>\
                <span ng-if=\"form.feedback !== false\" class=\"form-control-feedback\" id=\"{{form.key.slice(-1)[0] + \'Status\'}}\" ng-class=\"evalInScope(form.feedback) || {\'glyphicon\': true, \'glyphicon-ok\': hasSuccess(), \'glyphicon-remove\': hasError() }\"></span>\
                <div class=\"help-block\" sf-message=\"form.description\"></div>\
            </div>\
        </div>\
        <style>\
            .sf-geo-autocomplete-wrapper > div { float: left; width: calc(100% - 34px) }\
            .sf-geo-autocomplete-wrapper > .input-group-addon { display: inline-table; }\
            .sf-geo-autocomplete-wrapper .ui-select-placeholder,\
            .sf-geo-autocomplete-wrapper .ui-select-match-text { text-overflow: ellipsis; overflow: hidden; max-width: 100%; }\
            .sf-geo-autocomplete-wrapper .ui-select-container .caret { display: none; }\
            .sf-geo-autocomplete-wrapper .ui-select-container input,\
            .sf-geo-autocomplete-wrapper .ui-select-container .btn { border-right: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }\
            .angularstrap .sf-geo-autocomplete-wrapper + input[type=hidden] + .form-control-feedback {margin-right: 34px;}" +
            (template == 'metronic' ? ".sf-geo-autocomplete-wrapper > .btn {padding: 8px 10px 9px}" : "") +
            "</style>");
    }]);

    angular.module('schemaForm').config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider', function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
        schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'geo-autocomplete', 'directives/decorators/geo-autocomplete.html');
    }])
        .directive("geoAutocompleteBtn", function () {
            return {
                restrict: "E",
                replace: true,
                template: "<span ng-disabled=\"form.disabled\" class=\"input-group-addon btn btn-default\" ng-click=\"openMap()\"><i class=\"fa fa-globe\"></i></span>",
                controllerAs: "c",
                scope: {
                    sfInputOptions: "=",
                    model: "="
                },
                bindToController: true,
                controller: [
                    '$element',
                    '$scope',
                    function ($element, $scope) {
                        var self = this,
                            columnName = self.sfInputOptions.key[0];
                        $scope.openMap = function () {
                            require([window.includesVersion + "/Custom/3/Scripts/config.js"], function () {
                                var deps = ["geocomplete"];
                                if (!window.google || !window.google.maps)
                                    deps.push("async!https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places&key=" + window.mapAK);
                                require(deps,
                                    function () {
                                        var $geosearchSection = $(getGeosearchSectionHtml()),
                                            $magicForm = $element.closest('magic-form'),
                                            $closeBtn = $element.closest("#wndmodalContainer, .k-window")
                                                .find('.modal-header .close, .k-window-actions .k-i-close');

                                        //if form is in modal, hide the form and show the grid. otherwise open the grid in a modal
                                        if ($closeBtn.length) {
                                            $closeBtn
                                                .one('click', function () {
                                                    $magicForm.show();
                                                    $geosearchSection.remove();
                                                    return false;
                                                });
                                            $magicForm
                                                .hide()
                                                .after($geosearchSection);
                                        } else {
                                            $closeBtn = $("#wndmodalContainer .modal-header .close");
                                            showModal({
                                                content: $geosearchSection,
                                                wide: true
                                            });
                                        }

                                        $("#backtoeditform", $geosearchSection)
                                            .click(function (e) {
                                                $closeBtn.trigger('click');
                                            });
                                        $("#selectgeo", $geosearchSection)
                                            .click(function (e) {
                                                selectPlace(e)
                                                    .then(location => {
                                                        if (location) {
                                                            // geo-autocomplete only accepts string values
                                                            const valueAsString = "" + location[self.sfInputOptions.options.geoAutocomplete.valueField];
                                                            const nameAsString = "" + location[self.sfInputOptions.options.geoAutocomplete.textField];

                                                            //set model
                                                            self.model[columnName] = valueAsString;

                                                            //set address which was chosen from map as only available option and trigger a click on it
                                                            const titleMapItem = {
                                                                name: nameAsString,
                                                                value: valueAsString,
                                                            };
                                                            self.sfInputOptions.titleMap = [titleMapItem];
                                                            const geoCompleteCtrl = $('[ng-init="insideModel=model[\'' + self.sfInputOptions.key[0] + '\'];"]');

                                                            if (geoCompleteCtrl.length) {
                                                                geoCompleteCtrl.find('.btn.btn-default.form-control.ui-select-toggle').click();
                                                                geoCompleteCtrl.find('.ui-select-choices-row').click();
                                                            }

                                                            //hide the maps popup
                                                            $closeBtn.trigger('click');
                                                        }
                                                    });
                                            });
                                        $("#geocomplete", $geosearchSection)
                                            .geocomplete({
                                                map: ".map_canvas",
                                                location: $element.parent().find('.ui-select-match-text').text(),
                                                markerOptions: {
                                                    draggable: true
                                                },
                                                details: ".details",
                                                detailsAttribute: "data-geo"
                                            })
                                            .bind("geocode:dragged", function (e, result) {
                                                $("#geocomplete", $geosearchSection)
                                                    .geocomplete("find", result.lat() + " , " + result.lng());
                                            });
                                    });
                            });
                        }
                    }
                ]
            };
        });
});