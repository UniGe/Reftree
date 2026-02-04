define(['angular', 'MagicSDK', 'angular-magic-form', 'angular-kendo'], function (angular, MF) {
    var app = angular
    .module('TabContent', ['magicForm', 'kendo.directives'])
    .controller('TabContentController',
        [
            'config',
            '$filter',
            '$scope',
            '$timeout',
            function (config, $filter, $scope, $timeout) {
                var self = this;
                self.activeTab = 0;
                self.forms = [];
                self.showForms = true;
                self.renderDone = false;
                self.spinner = largeSpinnerHTML;

                config.data = config.data || config.rowData || {};

                config.data.displayedInEdit = true;
                if (!config.tabHeaderElement && !config.tabContentElement) {
                    config.data.displayedInEdit = false;
                }

                MF.api.get({
                    storedProcedureName: config.storedProcedureName,
                    data: config.data,
                    $scope: $scope
                })
                .then(function (res) {
                    if (config.tabHeaderElement && config.tabContentElement) {
                        var $tabHeader = $(config.tabHeaderElement),
                            $tabContent = $(config.tabContentElement);
                        $tabContent.css("padding", 0);
                        $tabHeader
                            .css(
                                "z-index", 1000
                            )
                            .hover(
                                function () {
                                    $(this).addClass("k-state-hover");
                                },
                                function () {
                                    $(this).removeClass("k-state-hover");
                                }
                            )
                            .html(
                                '<span class="k-link dropdown-toggle" data-toggle="dropdown">' + $tabHeader.text() + '<span class="caret"></span></span><ul class="dropdown-menu"></ul>'
                            );
                        var $dropDownList = $tabHeader.find("ul");
                        $.each(res.shift(), function (k, v) {
                            var $button = $('<button class="k-button" role="tab"><span class="k-link">' + v.label + '</span></button>');
                            $dropDownList.append($button);
                            $button.click(function () {
                                self.showForms = true;
                                self.activeTab = k;
                                $timeout();
                            });
                        });
                    }
                    var lastIndex = -1;
                    $.each(res, function (k, v) {
                        if (v[0].ColumnName)
                            lastIndex = self.forms.push($.extend({
                                formDefinition: v,
                                kendoStyle: true,
                                readonly: true,
                                valuesToResolve: {},
                                itemsPerRow: config.itemsPerRow || 1,
                                renderDone: lastIndex == -1 ? formRenderDone : null
                            }, v[0].__settings ? JSON.parse(v[0].__settings) : {})) - 1;
                        else if (lastIndex != -1)
                            self.forms[lastIndex].valuesToResolve = $.extend({}, v[0]);
                    });
                });

                function formRenderDone() {
                    $timeout(function () { 
                        self.renderDone = true;
                    });
                }

                $scope.tableDataRoleButtonClick = function (storedProcedureName) {
                    if (storedProcedureName.indexOf(".") !== -1) {
                        MF.api.get({
                            storedProcedureName: storedProcedureName,
                            data: config.data,
                            $scope: $scope
                        })
                        .then(function (res) {
                            if (res.length) {
                                self.gridOptions = {
                                    dataSource: res.shift()
                                };
                                if (res.length) {
                                    self.gridOptions.columns = [];
                                    $.each(res.shift()[0], function (k, v) {
                                        self.gridOptions.columns.push({
                                            field: k,
                                            title: v
                                        });
                                    });
                                }
                                self.showForms = false;
                            }
                        });
                    }
                    else {
                        MF.kendo.getGridObject({ gridName: storedProcedureName })
                            .then(function (res) {
                                $timeout(function () {
                                    self.gridOptions = res;
                                    self.showForms = false;
                                });
                            });
                    }
                };
            }
        ]
    );

    return app;
});