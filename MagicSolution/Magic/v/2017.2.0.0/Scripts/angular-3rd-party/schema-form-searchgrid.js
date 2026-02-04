define(['angular', 'bootstrap-decorator', 'angular-schema-form-dynamic-select-ui'], function (angular) {
    angular.module("schemaForm").run(["$templateCache", function ($templateCache) {
        //var uiselectTemplate = $templateCache.get("directives/decorators/bootstrap/uiselect/uiselect.html");
        //$templateCache.put("directives/decorators/searchgrid.html", uiselectTemplate.replace(/\<input\s+type="hidden"/i, '<div class="btn searchgrid-btn" ng-click="c.openSearchgrid()"><i class="fa fa-search"></i></div><input type="hidden"'));
        $templateCache.put("directives/decorators/searchgrid.html", 
        "<div ng-controller=\"dynamicSelectController\" class=\"form-group\" ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess(), \'has-feedback\': form.feedback !== false}\" ng-init=\"insideModel=$$value$$;\">\
            <label class=\"control-label {{form.labelHtmlClass}}\" ng-show=\"showTitle()\">{{form.title}}</label>\
            <div class=\"form-group\">\
                <div class=\"sf-searchgrid-wrapper\">\
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
                    <searchgrid-btn sf-input-options=\"form\" model=\"model\"></searchgrid-btn>\
                </div>\
                <input type=\"hidden\" name=\"{{form.key.slice(-1)[0]}}\" toggle-single-model sf-changed=\"form\" ng-model=\"insideModel\" schema-validate=\"form\"/>\
                <span ng-if=\"form.feedback !== false\" class=\"form-control-feedback\" id=\"{{form.key.slice(-1)[0] + \'Status\'}}\" ng-class=\"evalInScope(form.feedback) || {\'glyphicon\': true, \'glyphicon-ok\': hasSuccess(), \'glyphicon-remove\': hasError() }\"></span>\
                <div class=\"help-block\" sf-message=\"form.description\"></div>\
            </div>\
        </div>\
        <style>\
            .sf-searchgrid-wrapper > div { float: left; width: calc(100% - 34px) }\
            .sf-searchgrid-wrapper > .input-group-addon { display: inline-table; }\
            .sf-searchgrid-wrapper .ui-select-placeholder,\
            .sf-searchgrid-wrapper .ui-select-match-text { text-overflow: ellipsis; overflow: hidden; max-width: 100%; }\
            .sf-searchgrid-wrapper .ui-select-container .caret { display: none; }\
            .sf-searchgrid-wrapper .ui-select-container input,\
            .sf-searchgrid-wrapper .ui-select-container .btn { border-right: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }\
            .angularstrap .sf-searchgrid-wrapper + input[type=hidden] + .form-control-feedback {margin-right: 34px;}" +
            (template == 'metronic' ? ".sf-searchgrid-wrapper > .btn {padding: 8px 10px 9px}" : "") +
        "</style>");
    }]);

    angular.module('schemaForm').config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider', function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
        schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'searchgrid', 'directives/decorators/searchgrid.html');
    }])
    .directive("searchgridBtn", function () {
        return {
            restrict: "E",
            replace: true,
            template: "<span ng-disabled=\"form.disabled\" class=\"input-group-addon btn btn-default\" ng-click=\"openSearchgrid()\"><i class=\"fa fa-search\"></i></span>",
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
                    var self = this;
                    $scope.openSearchgrid = function () {
                        var grid,
                            searchGridOptions = self.sfInputOptions.options.searchGrid,
                            $grid = $('<div id="' + searchGridOptions.searchGridName + '_searchgrid"></div>'),
                            $magicForm = $element.closest('magic-form'),
                            $closeBtn = $("#wndmodalContainer .modal-header .close"),
                            gridobj = getrootgrid(searchGridOptions.searchGridName, null, searchGridOptions.searchGridName + "_searchgrid", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, searchGridOptions.cascadeFromColumn && searchGridOptions.cascadeFilterColumn),
                            origparmap = gridobj.dataSource.transport.parameterMap,
                            open = function () { };

                        //if form is in modal, hide the form and show the grid. otherwise open the grid in a modal
                        if ($magicForm.closest('#wndmodalContainer').length) {
                            $closeBtn.one('click', function () {
                                $magicForm.show();
                                $grid.remove();
                                return false;
                            });
                            open = function () {
                                $magicForm.hide().after($grid);
                            };
                        } else {
                            open = function () {
                                showModal({
                                    content: $grid,
                                    wide: true
                                });
                            };
                        }

                        gridobj.dataSource.transport.parameterMap = function (options, operation) {
                            if (searchGridOptions.apiCallData)
                                options.data = typeof searchGridOptions.apiCallData === 'function' ? searchGridOptions.apiCallData() : searchGridOptions.apiCallData;
                            var opts = origparmap.call(this, options, operation);
                            var optsobj = JSON.parse(opts);
                            optsobj.data = JSON.stringify(getCurrentModelInEdit());
                            return kendo.stringify(optsobj);
                        };
                        for (var i = 0 ; i < gridobj.columns.length; i++) {
                            if (gridobj.columns[i].command !== undefined) {
                                for (var h = 0; h < gridobj.columns[i].command.length; h++) {
                                    if (gridobj.columns[i].command[h].name === "edit" || gridobj.columns[i].command[h].name == "destroy") {
                                        gridobj.columns[i].command[h].attributes = { "class": "modifications" };
                                    } else {
                                        gridobj.columns[i].command.splice(h, 1);
                                    }
                                }
                                gridobj.columns[i].width = 83;
                            }
                        }
                        gridobj.columns.unshift({ template: "<input style='width:50px;' type='checkbox' class='checkbox searchgrid'/>", width: "64px", locked: gridobj.columns[0].locked || false });
                        gridobj.groupable = false;
                        gridobj.dataSource.pageSize = 5;
                        gridobj.selectable = false;
                        gridobj.pageable = getDefaultGridSettings().pageable;
                        gridobj.detailTemplate = null;
                        gridobj.detailTemplateName = null;
                        gridobj.detailInit = null;

                        if (searchGridOptions.cascadeFromColumn && searchGridOptions.cascadeFilterColumn && self.model[searchGridOptions.cascadeFromColumn]) {
                            var filter = { field: searchGridOptions.cascadeFilterColumn, operator: 'eq', value: self.model[searchGridOptions.cascadeFromColumn], type: "cascadeSearch" };
                            if (gridobj.dataSource.filter == null)
                                gridobj.dataSource.filter = filter;
                            else
                                gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, filter);
                        }

                        open();
                        $grid.kendoGrid(gridobj);
                        grid = $grid.data("kendoGrid");
                        $grid.on("change", "input.checkbox.searchgrid", function (e) {
                            var selected = grid.dataItem($(e.target).closest("tr")),
                                columnName = self.sfInputOptions.key[0];
                            self.sfInputOptions.titleMap = $.map(grid.dataSource.data(), function (data, k) { return { name: data[searchGridOptions.searchGridDescColName], value: data.id } });
                            if (!self.sfInputOptions.required)
                                self.sfInputOptions.titleMap.unshift({ value: "", name: "", description: "&nbsp;" });
                            self.sfInputOptions.titleMap[0].ignorePropsFilter = true;

                            self.model[columnName] = selected.id;
                            self.sfInputOptions.options.scope.select_model.selected = self.sfInputOptions.options.scope.find_in_titleMap(selected.id);
                            self.sfInputOptions.options.scope.insideModel = self.sfInputOptions.options.scope.inside_model = self.sfInputOptions.options.scope.select_model.selected.value;
                            self.sfInputOptions.options.scope.$parent.ngModel.$setViewValue(self.sfInputOptions.options.scope.select_model.selected.value);

                            $closeBtn.trigger('click');
                        });
                    }
                }
            ]
        };
    });
});