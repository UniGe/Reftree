(function () {
    var dependencies = ["angular", "MagicSDK", "angular-filter","angular-kendo"],
        angular,
        controllerName = "Process_Menu";

    define(dependencies, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        $("#spansmall").text(" - Navigazione per processi");
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true))[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        angular
            .module(controllerName, ["angular.filter","kendo.directives"])
            .controller(controllerName + "Controller", [
                '$timeout',
                '$scope',
                '$filter',
                '$http',
                function ($timeout, $scope, $filter, $http) {
                    var self = this,
                        sessionStorageKey = self.functionId + "-process-menu-level";

                    self.level = 0;
                    self.functionId = getCurrentFunctionID();
                    self.deptPrfs = {};
                    self.result = [];
                    self.claprfCols = 12;
                    self.hasLevelAfter = false;
                    self.hasLevelBefore = false;
                    self.requestFinished = false;
                    self.searchText = "";
                    self.searchPlaceholder = getObjectText('search');
                    self.claprfExpanded = {};
                    self.userselected = null;
                   
                    var ds = {
                        serverFiltering:true,
                        transport:{
                                read:
                                  {
                                      url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                                      type: "POST",
                                      data: { storedprocedure: "CUSTOM.GetProcessMenu" },
                                      dataType: "json",
                                      contentType: "application/json; charset=utf-8"
                                  },
                                parameterMap: function (options, operation) {
                                    // ALWAYS return options
                                    options.functionId = self.functionId;
                                    options.level = self.level;
                                    options.userfilter = options.filter.filters[0].value;
                                    return kendo.stringify(options);
                                }
                        },
                        group:"claprfLabel",
                        schema: {
                            parse: function (res) {
                                if (res[1].drows[0])
                                    return res[1].drows[0].Table;
                                else
                                    return [];
                            }
                        }
                    };


                    self.autocompleteOptions = {
                        select: function(e) {
                           
                            self.requestFinished = false;
                            MF.api.get({
                                storedProcedureName: "CUSTOM.GetProcessMenu",
                                data: {
                                    userselectedId: this.dataItem(e.item.index()).id,
                                    functionId: self.functionId
                                }
                            }).then(function (res) {
                                sessionStorage[sessionStorageKey] = res[2][0].levelid;
                                self.requestFinished = true;
                                self.result = res[1] || [];
                                self.hasLevelBefore = res[0][0].hasLevelBefore;
                                self.hasLevelAfter = res[0][0].hasLevelAfter;
                                if (res[2] && res[2].length)
                                    $.each(res[2], function (i, v) {
                                        self.claprfExpanded[v.claprfId] = v.Expanded ? true : false;
                                    });
                                $timeout();
                            });
                        },
                        dataSource: new kendo.data.DataSource(ds),
                        filter:"contains",
                        dataTextField: "label"
                    };
                        

                    $scope.$watch(angular.bind(self, function () {
                        return self.level;
                    }), function (newLevel) {
                        self.requestFinished = false;
                        MF.api.get({
                            storedProcedureName: "CUSTOM.GetProcessMenu",
                            data: {
                                level: newLevel,
                                functionId: self.functionId,
                                userselectedId: self.userselectedid
                            }
                        }).then(function (res) {
                            sessionStorage[sessionStorageKey] = newLevel;
                            self.userselectedid = null;
                            self.requestFinished = true;
                            self.result = res[1] || [];
                            self.claprfCols = Math.min(Math.ceil(12 / Object.size($filter('groupBy')(self.result, 'claprfId'))), 4);
                            self.hasLevelBefore = res[0][0].hasLevelBefore;
                            self.hasLevelAfter = res[0][0].hasLevelAfter;
                            if (res[2] &&  res[2].length)  
                                $.each(res[2], function (i, v) {
                                    self.claprfExpanded[v.claprfId] = v.Expanded ? true : false;
                                });
                            $timeout();
                        });
                    });

                    self.launchAction = function (event, deptPrf) {
                        if (deptPrf.actionType == "LEVCH")
                        {
                           // '{ "logic": "and", "filters" : [{ "field": "level", "operator": "eq", "value": "2" }, { "field": "userselectedId", "operator": "eq", "value": "8"}] }'
                            var filter = JSON.parse(deptPrf.actionFilter);
                            self.userselectedid = filter.filters[1].value;
                            self.level = filter.filters[0].value;
                            return;
                        }
                        dispatchAction(event.currentTarget, {
                            actiontype: deptPrf.actionType,
                            actioncommand: deptPrf.actionCommand,
                            actionfilter: deptPrf.actionFilter,
                            subsettings: null
                        });
                    }

                    self.claprfOrder = function (deptPrfs) {
                        return deptPrfs[0].claprfOrder
                    }

                    self.level = parseInt(sessionStorage[sessionStorageKey] || 1);
                }
            ]);
    }
})();