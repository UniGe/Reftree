define(["angular", "MagicSDK", "angular-magic-form"], function (angular, magic) {
    angular
        .module("InserimentoGruppi", ["magicForm"])
        .controller("InserimentoGruppiController", [
            "$scope",
            "$timeout",
            function ($scope, $timeout) {
                var self = this;

                self.activeTab = 0;
                self.formData = {};

                self.isActiveTab = function (index) {
                    return { "active": index == self.activeTab };
                };

                var tables = {
                    AS_V_ASSGRO_insert_mcheck: null,
                    AS_V_PLTAGR_insert_mcheck: null,
                    US_V_DEPGRU_insert_mcheck: null,
                    AS_V_PLASGRO_insert_mcheck: null
                };

                var initialCallResult = {};
                var addFormData = function (data) {
                    $.extend(data, initialCallResult);
                };

                var modifyKendoObject = function (gridObject) {
                    var oldParaMap = gridObject.dataSource.transport.parameterMap;
                    gridObject.dataSource.transport.parameterMap = function (data, operation) {
                        addFormData(data);
                        return oldParaMap(data, operation);
                    };
                    return gridObject;
                };

                self.initGrids = function () {
                    magic.kendo.appendGridToDom({
                        kendoGridObject: magic.kendo.getGridObject({ gridName: "AS_V_ASSGRO_insert_mcheck" })
                                            .then(modifyKendoObject),
                        selector: "AS_V_ASSGRO_insert_mcheck"
                    })
                    .then(function (grid) {
                        tables.AS_V_ASSGRO_insert_mcheck = grid;
                    });
                    magic.kendo.appendGridToDom({
                        kendoGridObject: magic.kendo.getGridObject({ gridName: "US_V_DEPGRU_insert_mcheck" })
                                            .then(modifyKendoObject),
                        selector: "US_V_DEPGRU_insert_mcheck"
                    })
                    .then(function (grid) {
                        tables.US_V_DEPGRU_insert_mcheck = grid;
                    });
                    magic.kendo.appendGridToDom({
                        kendoGridObject: magic.kendo.getGridObject({ gridName: "AS_V_PLTAGR_insert_mcheck" })
                                            .then(modifyKendoObject),
                        selector: "AS_V_PLTAGR_insert_mcheckk"
                    })
                    .then(function (grid) {
                        tables.AS_V_PLTAGR_insert_mcheck = grid;
                    });
                    magic.kendo.appendGridToDom({
                        kendoGridObject: magic.kendo.getGridObject({ gridName: "AS_V_PLASGRO_insert_mcheck" })
                                            .then(modifyKendoObject),
                        selector: "AS_V_PLASGRO_insert_mcheck"
                    })
                    .then(function (grid) {
                        tables.AS_V_PLASGRO_insert_mcheck = grid;
                    });
                };

                var messageRemoveTimeout;
                self.showMessage = function (message, type, showForever) {
                    if (!type)
                        type = "default";
                    $timeout.cancel(messageRemoveTimeout);
                    self.message = message;
                    self.messageType = type;
                    if (!showForever)
                        messageRemoveTimeout = $timeout(function () {
                            self.message = "";
                        }, 6000);
                };

                self.submit = function () {
                    $scope.$broadcast('schemaFormValidate');
                    if (self.$form.$invalid) {
                        self.showMessage("Prego compilare i campi obbligatori.", "danger");
                        return;
                    }
                    var selectDataForTable = "";
                    var data = $.extend({}, self.formData);
                    data.US_GROUPS_FROM = toTimeZoneLessString(data.US_GROUPS_FROM);
                    var tableData = {
                        AS_V_ASSGRO_insert_mcheck: []
                    };
                    if (self.formData.LINK_PL_ASSETS) {
                        tableData["AS_V_PLTAGR_insert_mcheck"] = [];
                        tableData["AS_V_PLASGRO_insert_mcheck"] = [];
                    }
                    if (self.formData.LINK_DOCS)
                        tableData["US_V_DEPGRU_insert_mcheck"] = [];

                    //if other table is shown also add her data
                    $.each(tableData, function (k, v) {
                        $.each(tables[k].dataSource.data(), function (kk, vv) {
                            if (vv.Checked)
                                v.push(vv);
                        });
                        if (!v.length) {
                            selectDataForTable = k;
                            return false;
                        }
                    });
                    console.log(tableData);
                    if (selectDataForTable) {
                        self.showMessage("Prego selezionare al meno una riga in ogni griglia.", "danger");
                        return;
                    }
                    var promises = [];
                    magic.api.set({
                        procedure: "core.US_USP_INSERT_GROUP",
                        data: data,
                        $scope: $scope,
                        contentType: "XML",
                        table: "core.US_GROUPS_groups",
                        primaryKeyColumn: "US_GROUPS_ID"
                    })
                    .then(function (res) {
                        initialCallResult = { US_GROUPS_ID: res[0].US_GROUPS_ID };
                        $.each(tableData, function (k, v) {
                            promises.push(tables[k].dataSource.sync());
                            //promises.push(magic.api.set({
                            //    procedure: "core.US_USP_INSERT_" + k,
                            //    data: $.extend(v, { US_GROUPS_ID: res[0].US_GROUPS_ID }),
                            //    $scope: $scope,
                            //    contentType: "XML"
                            //}));
                        });
                    }, function (res) {
                        self.showMessage("Error on writing to core.US_USP_INSERT_GROUP - look into console for further information");
                        console.error(res);
                    });
                    if (!promises.length)
                        return;
                    $.when.apply(promises)
                        .then(function () {
                            self.showMessage("Operazione completata con successo", "success");
                            $.each(tables, function (k, v) {
                                $.each(tables[k].dataSource.data(), function (kk, vv) {
                                    vv.Checked = false;
                                    vv.dirty = false;
                                });
                            });
                            self.formData = {};
                        }, function (res) {
                            console.log("error");
                            console.log(res);
                        });
                };
            }
        ]);

    return function () {
        var element = $("#grid").html('<div ng-controller="InserimentoGruppiController as ig" onload="ig.initGrids()" ng-include="\'' + window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/Templates/InserimentoGruppi.html\'"></div>')[0];
        angular.bootstrap(element, ["InserimentoGruppi"]);
    };
});