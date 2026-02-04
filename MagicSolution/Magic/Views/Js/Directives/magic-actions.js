define(["angular"], function (angular) {
    angular
        .module("magicActions", [])
        .directive('magicActions', function () {
            return {
                restrict: 'EA',
                scope: {
                    parentgridinstance: "=",
                    rowdata: "=",
                    gridname: "=",
                    entityname: "=",
                    actiontype: "@",
                    callback: "=",
                },
                controllerAs: "ma",
                templateUrl: "/Magic/Views/Templates/Directives/magic-actions.html",
                controller: ["$scope",
                    "$timeout",
                    "config",
                    function ($scope) {
                        $scope.actionTypes = {};
                        var pk = $scope.parentgridinstance.options.schema.model.id
                        var id = $scope.rowdata[pk];

                        $.ajax({
                            type: "POST",
                            url: "/api/EVENTS/GetRecordActions/",
                            data: JSON.stringify({
                                entityname: $scope.entityname,
                                id: id,
                                pk: pk,
                                queryType: $scope.actiontype,
                                gridName: $scope.gridname,
                                isGridEditPage: true
                            }),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function (result) {
                                if (result.length) {
                                    $(result).each(function (i, v) {
                                        var jsonpayload = {};
                                        jsonpayload.id = v.ActionId;
                                        jsonpayload.Typeid = v.TypeId;
                                        jsonpayload.Type = v.Type;
                                        jsonpayload.Classid = v.ClassId;
                                        jsonpayload.Class = v.Class;
                                        jsonpayload.actionDescription = v.ActionDescription;
                                        jsonpayload.actiontype = v.ActionType;
                                        jsonpayload.actioncommand = v.ActionCommand;
                                        jsonpayload.actionfilter = v.ActionFilter;
                                        jsonpayload.actioniconclass = v.ActionIconClass;
                                        jsonpayload.actionbackgroundcolor = v.ActionBackgroundColor;
                                        jsonpayload.typeiconclass = v.TypeIconClass;
                                        jsonpayload.rowData = $scope.rowdata;
                                        jsonpayload.EditPageRefreshPageAfterAction = v.EditPageRefreshPageAfterAction;
                                        if ($scope.actionTypes[v.Type]) {
                                            $scope.actionTypes[v.Type].push(jsonpayload);
                                        } else {
                                            $scope.actionTypes[v.Type] = [];
                                            $scope.actionTypes[v.Type].push(jsonpayload);
                                        }
                                    });
                                }
                            },
                            error: function (result) {
                                console.log("Error getting " + $scope.actiontype + " popUp actions");
                            }
                        });
                        $scope.dispatch = function (action, $event) {
                            var btnelement = $($event.currentTarget).children('.k-button');
                            action.jqgrid = $('<div gridname="' + $scope.gridname + '"></div>"');
                            action.rowData = $scope.rowdata && $scope.rowdata.toJSON ? $scope.rowdata.toJSON() : $scope.rowdata;
                            if ($scope.rowdata)
                                action.rowData.id = $scope.rowdata.id;
                            action.actionCallback = onActionExecuted;
                            window.jqueryEditRefTreeGrid = { jqgrid: action.jqgrid, jrow: null, rowData: action.rowData };
                            dispatchAction(btnelement, action);
                        };
                        onActionExecuted = function (requestEndEvent, refreshPage) {
                            if ((requestEndEvent == null || typeof requestEndEvent == 'undefined' || !requestEndEvent) && refreshPage === true) {
                                $scope.callback(refreshPage);
                                return;
                            }
                            if (requestEndEvent && requestEndEvent.hasOwnProperty('type') && requestEndEvent.type !== 'read' && refreshPage !== false) {
                                $scope.callback(refreshPage);
                            }
                        };
                    }
                ]
            };
        })
});