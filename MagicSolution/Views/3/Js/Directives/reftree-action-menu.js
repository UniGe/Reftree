define(['angular', "MagicSDK"], function (angular, MF) {
    angular.module('reftreeActionMenu', [])
        .directive('reftreeActionMenu', ["$http", "$templateCache", "$compile", "$timeout", function ($http, $templateCache, $compile, $timeout) {
            return {
                replace: false,
                restrict: "E",
                scope: {
                    myHtml: "=",
                    requestData: "=",
                    localAction: "=",
                    requestDataCustom: "=",
                },
                bindToController: {
                    options: "=",
                    modelParent: "=",
                    rowData: '=rowdata',
                    multiAction: "=",
                    spActionToLaunch: "=",
                    spMultiActionToLaunch: "="
                },
                link: function (scope, tElement, tAttrs, transclude) {
                    
                    scope.includeHtml = function initAction() {
                        tElement.empty();
                        tElement.html(scope.myHtml);
                        $compile(tElement.contents())(scope);


                    }
                    scope.init = function getAction() {

                        scope.rtmm.localAction = [];
                        scope.rtmm.fatherAction = [];
                        scope.rtmm.localActionCustom = [];
                        scope.rtmm.fatherActionCustom = [];
                        doModal(true);
                          
                      
                        MF.api.get({
                            storedProcedureName: scope.rtmm.multiAction ? (!scope.rtmm.spMultiActionToLaunch ? "core.usp_ev_get_multi_action_constraint" : scope.rtmm.spMultiActionToLaunch) : (!scope.rtmm.spActionToLaunch ? "core.usp_ev_get_action_constraint" : scope.rtmm.spActionToLaunch),
                            data: scope.requestData
                        }).then(
                            function (result) {
                                if (result.length == 0) {
                                    doModal(false);
                                    return 
                                }

                                $.each(result, function (i) {
                                    switch (i) {
                                        case 0:
                                            var insert = 1;
                                            $.each($.unique(result[i].map(function (d) { return d.EV_ACTCLA_DESCRIPTION })), function (i, v) {
                                                insert = 1;
                                                var actsta = {
                                                    name: v,
                                                    action: []
                                                }
 
                                                $.each(scope.rtmm.fatherAction, function (ii, vv) {
                                                    if (vv.name == v) {
                                                        insert = 0;
                                                        return
                                                    }
                                                });
                                                    
                                                if (insert == 1) {
                                                    scope.rtmm.fatherAction.push(actsta); 
                                                }

                                                //scope.rtmm.fatherAction.push(actsta); 
                                            });

                                            $.each(result[i], function (i, v) {
                                                var oItem = {
                                                    id: v.EV_ACTION_ID,
                                                    actioncommand: v.EV_ACTION_COMMAND,
                                                    actiontype: v.EV_ACTTYP_CODE,
                                                    actionfilter: v.EV_ACTION_FILTER,
                                                    color: v.colour,
                                                    label: v.EV_ACTION_DESCRIPTION,
                                                    father: v.EV_ACTCLA_DESCRIPTION,
                                                    orderBy: v.EV_ACTSTA_ORDER
                                                };

                                                scope.rtmm.localAction.push(oItem);
                                                $.each(scope.rtmm.fatherAction, function (ii,vv) {
                                                    if (vv.name == oItem.father) {
                                                        vv.action.push(oItem);
                                                    }
                                                });
                                            });

                                            $timeout(function () {
                                                doModal(false);
                                                scope.includeHtml();

                                            }, 500);

                                            break;
                                    }
                                });
                            },
                            function (err) {
                                console.log(err);
                                return;
                            }
                        );
                         
                        if (!jQuery.isEmptyObject(scope.requestDataCustom)) {
                             
                            MF.api.get({
                                storedProcedureName: "core.ev_usp_get_action_but_grid",
                                data: scope.requestDataCustom
                            }).then(
                                function (result) {
                                    if (result.length == 0) {
                                        doModal(false);
                                        return
                                    }

                                    $.each(result, function (i) {

                                        switch (i) {
                                            case 0:
                                                var insert = 1;
                                                $.each($.unique(result[i].map(function (d) { return d.Class })), function (i, v) {
                                                    insert = 1;
                                                    var actsta = {
                                                        name: v,
                                                        action: []
                                                    }

                                                    $.each(scope.rtmm.fatherAction, function (ii, vv) {
                                                        if (vv.name == v) {
                                                            insert = 0;
                                                            return
                                                        }
                                                    });

                                                    if (insert == 1) {
                                                        scope.rtmm.fatherAction.push(actsta);
                                                    }

                                                    //scope.rtmm.fatherAction.push(actsta); 
                                                });

                                                $.each(result[i], function (i, v) {
                                                    var oItem = {
                                                        id: v.Action_Id,
                                                        actioncommand: v.Action_Command,
                                                        actiontype: v.Action_Type,
                                                        actionfilter: v.Filter,
                                                        color: v.Colour,
                                                        label: v.Action_Description,
                                                        father: v.Class,
                                                        orderBy: v.Order
                                                    };

                                                    scope.rtmm.localAction.push(oItem);
                                                    $.each(scope.rtmm.fatherAction, function (ii, vv) {
                                                        if (vv.name == oItem.father) {
                                                            vv.action.push(oItem);
                                                        }
                                                    });
                                                });

                                                $timeout(function () {
                                                    doModal(false);
                                                    scope.includeHtml();

                                                }, 500);

                                                break;
                                        }
                                    });
                                },
                                function (err) {
                                    console.log(err);
                                    return;
                                }
                            );
                        }
                    }

                    scope.init();
                   
                },
                controllerAs: "rtmm",
                template: '',
                controller: ["config","$scope", "$timeout",
                        function (config, $scope, $timeout) {
                            var self = this;
                            self.scope = $scope;                                                        
                            self.refreshActionMenu = function ($scope) {
                                console.log($scope);
                            }

                            self.init = function () {
                                //data of master row
                                if (config && config.options)
                                    self.rowData = config.options;
                                //master $grid
                                if (config && config.$grid)
                                    self.$grid = config.$grid;
                                //$row
                                if (config && config.$row)
                                    self.$row = config.$row;

                                //$controllerParent
                                if (config.controller)
                                    self.controller = config.controller;
                            }

                            self.dispatch = function (btn, $scope) {

                                console.log("INTEGRATE THIS DISPATCH() METHOD in NEW ACTIONS-DIRECTIVE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                                if (self.multiAction) {
                                    console.log("multiAction");
                                    var toolbarbutton = $("#" + btn.actiontype)[0];
                                    config.onClickMultiAction = true;
                                    if (!!toolbarbutton) {
                                        genericToolbarButtonFunction(toolbarbutton, null);
                                    } else {
                                        self.showMenuActionGrid(this, btn);
                                    }
                                    
                                    
                                }
                                else {
                                    config.onClickMultiAction = false;
                                    self.showMenuActionGrid(this, btn);
                                }
                                //self.showMenuActionGrid(this, btn);


                            }

                            self.showMenuActionGrid = function (btnelement, btn) {
                                //ripulisce lo storege per la griglia
                                sessionStorage.removeItem("actions_gridmodelstring");

                                MF.api.get({
                                    storedProcedureName: "core.usp_ev_get_action_sub_next",
                                    data: { RecordId: config.rowData.id, actionid: btn.id, subActionid: btn.subid == undefined ? '' : btn.subid }
                                }).then(
                                    function (result) {

                                        btn.actionCallback = config.actionCallback;

                                        if (result.length > 0) {
                                            btn.actionCallback = null;
                                        }

                                        btn.jqgrid = self.$grid
                                        btn.jrow = self.$row;
                                        btn.rowData = config.rowData;
                                        btnelement.id = btn.id

                                        //MagicUtils.js
                                        doModal(true);

                                        $timeout(function () {
                                            //console.log("calling dispatchAction(btnelem, btn)", btnelement, btn);

                                            dispatchAction(btnelement, btn);
                                            doModal(false);
                                        }, 1000);

                                    },
                                    function (err) {
                                        console.log(err);
                                        return;
                                    }
                                );

                            }


                            //init self properties
                            self.init();
                        }
                ]
            }
        }]);
});