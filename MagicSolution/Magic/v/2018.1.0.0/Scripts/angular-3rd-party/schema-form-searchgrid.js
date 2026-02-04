define(['angular', 'bootstrap-decorator', 'angular-schema-form-dynamic-select-ui'], function (angular) {
    angular.module("schemaForm").run(["$templateCache", function ($templateCache) {
        //var uiselectTemplate = $templateCache.get("directives/decorators/bootstrap/uiselect/uiselect.html");
        //$templateCache.put("directives/decorators/searchgrid.html", uiselectTemplate.replace(/\<input\s+type="hidden"/i, '<div class="btn searchgrid-btn" ng-click="c.openSearchgrid()"><i class="fa fa-search"></i></div><input type="hidden"'));
        $templateCache.put("directives/decorators/searchgrid.html", 
        "<div ng-controller=\"dynamicSelectController\" class=\"form-group\" ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess(), \'has-feedback\': form.feedback !== false}\" ng-init=\"form.options.isMulti ? uiMultiSelectInitInternalModel($$value$$) : insideModel=$$value$$;\">\
            <label class=\"control-label {{form.labelHtmlClass}}\" ng-show=\"showTitle()\">{{form.title}}</label>\
            <div class=\"form-group\" ng-class=\"{ 'disabled': form.disabled }\">\
                <div class=\"sf-searchgrid-wrapper\">\
                    <div>\
                        <ui-select multiple=\"\" ng-model=\"select_model.selected\" ng-if=\"form.options.searchGrid.isMulti && !(form.options.tagging||false)\" theme=\"bootstrap\" ng-disabled=\"form.disabled\" search-enabled=\"false\" on-remove=\"$$value$$.splice($$value$$.indexOf($item.value), 1)\" on-select=\"$$value$$.push($item.value)\" class=\"{{form.options.uiClass}}\">\
                            <ui-select-match placeholder=\"\">{{ $item.name }}</ui-select-match>\
                            <ui-select-choices style=\"display: none;\" refresh=\"populateTitleMap(form, $select.search)\" refresh-delay=\"form.options.refreshDelay\" group-by=\"form.options.groupBy\" repeat=\"item in form.titleMap | propsFilter: {name: $select.search, description: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\') }\">\
                                <div ng-bind-html=\"item.name | highlight: $select.search\"></div>\
                                <div ng-if=\"item.description\">\
                                    <span ng-bind-html=\"\'<small>\' + (\'\'+item.description | highlight: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\'))+ \'</small>\'\"></span>\
                                </div>\
                            </ui-select-choices>\
                        </ui-select>\
                        <ui-select ng-model=\"select_model.selected\" ng-if=\"!form.options.searchGrid.isMulti && !(form.options.tagging||false)\" theme=\"bootstrap\" ng-disabled=\"form.disabled\" on-select=\"$$value$$=$item.value\" class=\"{{form.options.uiClass}}\">\
                            <ui-select-match placeholder=\"{{form.placeholder || form.schema.placeholder || (\'placeholders.select\' | translate)}}\">{{select_model.selected.name}}</ui-select-match>\
                            <ui-select-choices refresh=\"populateTitleMap(form, $select.search)\" refresh-delay=\"form.options.refreshDelay\" group-by=\"form.options.groupBy\" repeat=\"item in form.titleMap | propsFilter: {name: $select.search, description: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\') }\">\
                                <div ng-bind-html=\"item.name | highlight: $select.search\"></div>\
                                <div ng-if=\"item.description\">\
                                    <span ng-bind-html=\"\'<small>\' + (\'\'+item.description | highlight: (form.options.searchDescriptions===true ? $select.search : \'NOTSEARCHINGFORTHIS\'))+ \'</small>\'\"></span>\
                                </div>\
                            </ui-select-choices>\
                        </ui-select>\
                        <ui-select ng-controller=\"dynamicSelectController\" ng-model=\"select_model.selected\" ng-if=\"(form.options.tagging||false) && !(form.options.groupBy || false)\" tagging=\"form.options.tagging||false\" tagging-label=\"form.options.taggingLabel\" tagging-tokens=\"form.options.taggingTokens\" theme=\"bootstrap\" ng-disabled=\"form.disabled\" on-select=\"form.options.searchGrid.isMulti ? $$value$$.push($item.value) : $$value$$=$item.value\" class=\"{{form.options.uiClass}}\">\
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
                        <ui-select ng-controller=\"dynamicSelectController\" ng-model=\"select_model.selected\" ng-if=\"(form.options.tagging||false) && (form.options.groupBy || false)\" tagging=\"form.options.tagging||false\" tagging-label=\"form.options.taggingLabel\" tagging-tokens=\"form.options.taggingTokens\" theme=\"bootstrap\" ng-disabled=\"form.disabled\" on-select=\"form.options.searchGrid.isMulti ? $$value$$.push($item.value) : $$value$$=$item.value\" class=\"{{form.options.uiClass}}\">\
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
                    <clear-btn ng-class=\"{ 'disabled': form.disabled }\" sf-input-options=\"form\" model=\"model\"></clear-btn>\
                    <searchgrid-btn ng-class=\"{ 'disabled': form.disabled }\" sf-input-options=\"form\" model=\"model\"></searchgrid-btn>\
                </div>\
                <input type=\"hidden\" name=\"{{form.key.slice(-1)[0]}}\" toggle-single-model sf-changed=\"form\" ng-model=\"insideModel\" schema-validate=\"form\"/>\
                <span ng-if=\"form.feedback !== false\" class=\"form-control-feedback\" id=\"{{form.key.slice(-1)[0] + \'Status\'}}\" ng-class=\"evalInScope(form.feedback) || {\'glyphicon\': true, \'glyphicon-ok\': hasSuccess(), \'glyphicon-remove\': hasError() }\"></span>\
                <div class=\"help-block\" sf-message=\"form.description\"></div>\
            </div>\
        </div>\
        <style>\
            .sf-searchgrid-wrapper > div { float: left; width: calc(100% - 68px) }\
            .sf-searchgrid-wrapper .ui-select-multiple input[type=search] { display: none; }\
            .sf-searchgrid-wrapper .ui-select-multiple { min-height: 36px; }\
            .sf-searchgrid-wrapper .ui-select-multiple .btn { padding: 5px 12px 3px; }\
            .sf-searchgrid-wrapper > .input-group-addon { display: inline-table; float: left; padding: 7px 10px; }\
            .sf-searchgrid-wrapper .ui-select-placeholder,\
            .sf-searchgrid-wrapper .ui-select-match-text { text-overflow: ellipsis; overflow: hidden; max-width: 100%; }\
            .sf-searchgrid-wrapper .ui-select-container .caret { display: none; }\
            .sf-searchgrid-wrapper .ui-select-container input,\
            .sf-searchgrid-wrapper .ui-select-container.ui-select-multiple,\
            .sf-searchgrid-wrapper .ui-select-container:not(.ui-select-multiple) .btn { border-right: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }\
            .angularstrap .sf-searchgrid-wrapper + input[type=hidden] + .form-control-feedback {margin-right: 75px;}" +
            (template == 'metronic' ? ".sf-searchgrid-wrapper > .btn {padding: 8px 10px 9px}" : "") +
        "</style>");
    }]);

    angular.module('schemaForm').config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider', function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
        schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'searchgrid', 'directives/decorators/searchgrid.html');
    }])
    .directive("clearBtn", function () {
        return {
            restrict: "E",
            replace: true,
            template: "<span ng-disabled=\"form.disabled\" class=\"input-group-addon btn btn-default\" ng-click=\"clearModel()\"><i class=\"fa fa-times\"></i></span>",
            controllerAs: "c",
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
                    var self = this;
                    $scope.clearModel = function () {
                        if (self?.sfInputOptions?.disabled) {
                            alert("Campo disabilitato");
                            return;
                        }
                        var columnName = self.sfInputOptions.key[0];
                        if (self.model[columnName]) {
                            self.model[columnName] = self.sfInputOptions.options.searchGrid.isMulti ? [] : null;
                            self.sfInputOptions.options.scope.select_model.selected = self.sfInputOptions.options.searchGrid.isMulti ? [] : null;
                            if (!self.sfInputOptions.options.searchGrid.isMulti) {
                                self.sfInputOptions.options.scope.insideModel = self.sfInputOptions.options.scope.inside_model = null;
                                self.sfInputOptions.options.scope.$parent.ngModel.$setViewValue('');
                            } else {
                                $timeout();
                            }
                        }
                    }
                }]
        }
    })
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
                '$timeout',
                function ($element, $scope, $timeout) {
                    var self = this;
                    $scope.openSearchgrid = function () {
                        if (self?.sfInputOptions?.disabled) {
                            alert("Campo disabilitato");
                            return;
                        }
                        var grid,
                            searchGridOptions = self.sfInputOptions.options.searchGrid,
                            $grid = $('<div id="' + searchGridOptions.searchGridName + '_searchgrid"></div>'),
                            $magicForm = $element.closest('magic-form'),
                            $closeBtn = $element.closest("#wndmodalContainer, .k-window")
                                .find('.modal-header .close, .k-window-actions .k-i-close'),
                            gridobj = getrootgrid(searchGridOptions.searchGridName, null, searchGridOptions.searchGridName + "_searchgrid", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, searchGridOptions.cascadeFromColumn && searchGridOptions.cascadeFilterColumn),
                            origparmap = gridobj.dataSource.transport.parameterMap,
                            open = function () { };

                        //if form is in modal, hide the form and show the grid. otherwise open the grid in a modal
                        if ($closeBtn.length) {
                            $closeBtn.one('click', function () {
                                $magicForm.show();
                                $grid.remove();
                                return false;
                            });
                            open = function () {
                                $magicForm.hide().after($grid);
                            };
                        } else {
                            $closeBtn = $("#wndmodalContainer .modal-header .close");
                            open = function () {
                                showModal({
                                    content: $grid,
                                    wide: true,
                                    zIndex: $('#filtersModalContainer').hasClass('in') ? 10040 : undefined //aggiuntoo controllo della modale filtersModalContainer se è attiva passa 10040 altrimenti undefined S.M
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

                        var currentValue = self.model[self.sfInputOptions.key[0]];
                        if (!searchGridOptions.isMulti) {
                            gridobj.columns.unshift({ template: "<input style='width:50px;' type='checkbox' class='checkbox searchgrid'/>", width: "64px", locked: gridobj.columns[0].locked || false });
                        } else {
                            gridobj.columns.unshift({
                                template: (data) => "<input style='width:50px;' type='checkbox' class='checkbox searchgrid'" + (currentValue.find(id => id == data.id) ? ' checked=\"checked\"' : '') + " />",
                                width: "64px",
                                locked: gridobj.columns[0].locked || false
                            });
                        }
                        gridobj.groupable = false;
                        gridobj.dataSource.pageSize = gridobj?.dataSource?.pageSize || 5;
                        gridobj.selectable = false;
                        gridobj.pageable = getDefaultGridSettings().pageable;
                        gridobj.detailTemplate = null;
                        gridobj.detailTemplateName = null;
                        gridobj.detailInit = null;
                        var getCascadeColumnNames =  function (CascadeColumnName) {
                            return !CascadeColumnName ? [] : CascadeColumnName.split(",");
                        }
                        var filter = searchGridOptions.cascadeFromColumn ? { logic: "AND", filters: [], type:"cascadeSearch"} : null;
                        //   if (searchGridOptions.cascadeFromColumn && searchGridOptions.cascadeFilterColumn && self.model[searchGridOptions.cascadeFromColumn]) {
                        if (searchGridOptions.cascadeFromColumn && searchGridOptions.cascadeFilterColumn ) {
                            $.each(getCascadeColumnNames(searchGridOptions.cascadeFromColumn), function (i, v) {
                                if (getCascadeColumnNames(searchGridOptions.cascadeFilterColumn) && getCascadeColumnNames(searchGridOptions.cascadeFilterColumn).length > i)
                                    filter.filters.push({ field: getCascadeColumnNames(searchGridOptions.cascadeFilterColumn)[i], operator: 'eq', value: self.model[v], type: "cascadeSearch" });
                            });
                            if (gridobj.dataSource.filter == null)
                                gridobj.dataSource.filter = filter;
                            else
                                gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, filter);
                        }

                        open();
                        $grid.kendoGrid(gridobj);
                        grid = $grid.data("kendoGrid");
                        $grid.attr("gridName", gridobj.gridcode);
                        $grid.on("change", "input.checkbox.searchgrid", function (e) {
                            var selected = grid.dataItem($(e.target).closest("tr"));
                            if (searchGridOptions.isMulti) {
                                if (e.target.checked) {
                                    currentValue.push(selected.id);
                                    self.sfInputOptions.titleMap.push({
                                        name: selected[searchGridOptions.searchGridDescColName],
                                        value: selected.id
                                    });
                                }
                                else {
                                    var i = currentValue.findIndex(v => v == selected.id);
                                    if (i > -1)
                                        currentValue.splice(i, 1);

                                }
                            } else {
                                var columnName = self.sfInputOptions.key[0];
                                self.sfInputOptions.titleMap = self.sfInputOptions.defaultValuesTitleMap = $.map(grid.dataSource.data(), function (data, k) { return { name: data[searchGridOptions.searchGridDescColName], value: data.id } });
                                if (!self.sfInputOptions.required)
                                    self.sfInputOptions.titleMap.unshift({ value: "", name: "", description: "&nbsp;" });
                                self.sfInputOptions.titleMap[0].ignorePropsFilter = true;

                                self.model[columnName] = selected.id;
                                self.sfInputOptions.options.scope.select_model.selected = self.sfInputOptions.options.scope.find_in_titleMap(selected.id);
                                self.sfInputOptions.options.scope.insideModel = self.sfInputOptions.options.scope.inside_model = self.sfInputOptions.options.scope.select_model.selected.value;
                                self.sfInputOptions.options.scope.$parent.ngModel.$setViewValue(self.sfInputOptions.options.scope.select_model.selected.value);

                                $closeBtn.trigger('click');
                            }
                        });
                        if (searchGridOptions.isMulti) {
                            $grid
                                .append(
                                    $('<button class="k-button k-button-icontext k-primary k-grid-update pull-right" style="margin-top: 10px;"><span class="k-icon k-update"></span>OK</button>')
                                        .click(() => {
                                            self.model[self.sfInputOptions.key[0]] = currentValue;
                                            self.sfInputOptions.options.scope.select_model.selected = currentValue
                                                .map(id => self.sfInputOptions.options.scope.find_in_titleMap(id));
                                            $timeout();
                                            $closeBtn.trigger('click');
                                        })
                                )
                                .css('marginBottom', '50px');
                        }
                    }
                }
            ]
        };
    });
});