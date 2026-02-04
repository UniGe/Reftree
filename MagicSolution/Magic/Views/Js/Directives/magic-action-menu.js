define(['angular', "MagicSDK"], function (angular, MF) {
    angular.module('magicActionMenu',[])
        .directive('magicActionMenu', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: { 
                },
                bindToController: {
                    options: "="
                },
                controllerAs:"mam",
                template: '<nav class="navbar navbar-default">\
                            <div class="container-fluid">\
                                <div class="navbar-collapse" id="bs-example-navbar-collapse-1">\
                                    <ul class="nav navbar-nav">\
                                        <li ng-repeat="btngroup in mam.btngroups track by btngroup.id" class="dropdown">\
                                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\
                                                {{btngroup.label}}<span class="caret"></span>\
                                            </a>\
                                            <ul class="dropdown-menu">\
                                                <li ng-style="{\'background-color\':btn.color}" ng-repeat="btn in btngroup.btns track by btn.id"><a href="#" ng-click="mam.dispatch(btn)" ng-bind="btn.label"></a></li>\
                                            </ul>\
                                        </li>\
                                    </ul>\
                                </div>\
                            </div>\
                        </nav>',
                controller: ["config",
                        function (config) {
                            var self = this;
                            self.btngroups = self.options;
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
                            }
                            self.dispatch = function (btn)
                            {
                                self.showMenuActionGrid(this, btn);
                            }
                            self.showMenuActionGrid = function (btnelement, btn)
                            {
                                console.log("before dispatchAction(btnelem, btn) in magic-action-menu.js", btnelement, btn);
                                btn.jqgrid = self.$grid;
                                btn.jrow = self.$row;
                                btn.rowData = self.rowData;
                                //MagicUtils.js
                                dispatchAction(btnelement, btn);
                            }
                            //init self properties
                            self.init();
                          }
                        ]
            }
        }]);
});