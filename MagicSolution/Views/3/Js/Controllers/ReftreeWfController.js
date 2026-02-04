////define(["angular",
////    "MagicSDK",
////    "angular-kendo",
////    "angular-magic-grid"], function (angular, MF) {
////    return {
////        html: function (controller) {
////            var html = $.Deferred();

////            html.resolve(window.includesVersion + "/views/3/templates/ReftreeWf.html");
////            return html.promise();
////        },
////        js: async function (controller, $scope) {

////        }
////    }
////});


define([
    "angular",
    "MagicSDK",
    window.includesVersion + "/Views/3/Js/Directives/reftree-action-menu.js",
    "angular-kendo",
    "angular-magic-grid",
    "angular-magic-actions",
 ], function (angular, MF, Action) {
    return angular
        .module("ReftreeWf", ["reftreeActionMenu", "kendo.directives", "magicGrid","magicActions"
        ]).controller("ReftreeWfController", ["config",
            "$timeout",
            "$scope",
            "$compile",

            function (config, $timeout, $scope, $compile) {
                var self = this;                

                self.showInitTab = false;
                self.showMainGrid = false;                                
                self.showDetailGrid = false;

                //controllare il funzionamento delle due griglie alternative al ritorno da fare !!!!!!!
                self.initGridAction = false;
                
                self.actionSelected = {};
                self.initActionFilter = true;
                self.showFatherAction = true;
                self.requestData = {};
                self.errorList = [];
                self.showAction = false;
                self.spActionToLaunch = "core.usp_ev_get_action_constraint";
                self.spMultiActionToLaunch = "";
                 
                self.checkMobile = function isMobile() {
                    var check = false;
                    (function (a) {
                        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
                            check = true;
                    })(navigator.userAgent || navigator.vendor || window.opera);
                    return check;
                };

                self.labels = {
                    noRecord: {
                        it: 'Nessun record trovato',
                        en: 'No records found',
                    },
                    back: {
                        it: 'Indietro',
                        en: 'Back',
                    },                    
                }

                self.getErrorFromDb = function (errorList) {
                    self.errorList = [];
                    $.each(errorList, function (i, v) {
                        if (v.culture == window.culture.substring(0, 2)) {
                            self.errorList.push({"text": v.error });
                        }
                    });
                }

                self.getLabels = function (key) {
                    if (key in self.labels) {
                        return self.labels[key][window.culture.substring(0, 2)];
                    }
                    return getObjectText(key);
                };
 
                self.onInitReset = function onInitReset() {
                    self.errorList = [];
                    self.showInitTab = false;
                    self.showFatherAction = false;
                     
                }
                 
                self.onGetProcess = function onGetProcess() {
                    self.onInitReset();

                    MF.api
                        .get({
                            storedProcedureName: "core.wfp_sp_get_process",
                            guidid: config.guidid
                        }).then(
                            function (result) {
                                self.requestData = JSON.parse(result[0][0].requestData)

                                self.actionTemplate = !self.requestData.showGrid ? '<div ng-show="rtmm.showFather"\
                                            ng-repeat="father in rtmm.fatherAction"\
                                            class="">\
	                                    <button type="button"\
	                                            ng-click="rtmm.onSelectedAction($index)"\
	                                            class="btn btn-success actionButton"\
	                                            dropdown-toggle"\
	                                            data-toggle="dropdown"\
	                                            aria-haspopup="true"\
	                                            aria-expanded="true">\
		                                    <span style="margin-right: 3px;"\
		                                            class="fa fa-bars"/>{{father.name}}</button>\
                                    </div>\
                                    <div id="actionDetail_{{$index}}"\
                                            ng-show="!rtmm.showFather"\
                                            ng-repeat="father in rtmm.fatherAction"\
                                            class="">\
                                    <div id="actionBack" ng-if="rtmm.index==$index" >\
                                            <button type="button"\
                                                    ng-click="rtmm.scope.$parent.rw.onShowFatherAction()"\
                                                    class="btn btn-success actionButton"\
                                                    data-toggle="dropdown"\
                                                    aria-haspopup="true"\
                                                    aria-expanded="true">{{rtmm.scope.$parent.rw.getLabels("back")}}\
                                            </button>\
                                        </div>\
	                                    <div ng-if="rtmm.index==$parent.$index"\
	                                            ng-repeat="action in rtmm.fatherAction[$index].action  | orderBy:' + "'orderBy'" + '">\
	                                    <button\
	                                            type="button"\
	                                            ng-click="rtmm.dispatch(action)"\
	                                            class="btn btn-success actionButton"\
	                                            dropdown-toggle"\
	                                            data-toggle="dropdown"\
	                                            aria-haspopup="true"\
	                                            aria-expanded="true">{{action.label}}</button>\
	                                    </div>\
                                    </div>' :   '<div ng-repeat="father in rtmm.fatherAction" class="btn-group" style="margin:3px;">\
                                                <button type="button" style="border-top-left-radius: 4px;border-bottom-right-radius: 4px;" class="btn btn-success btn-group-father" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><span style="margin-right: 5px;" class="fa fa-bars"></span>{{father.name}}</button>\
                                                <ul  id="mnav" class="dropdown-menu scrollable-menu-r3" role="menu">\
                                                <li style="cursor:pointer;"ng-repeat="action in rtmm.fatherAction[$index].action | orderBy:' + "'orderBy'" + '"><a ng-click="rtmm.dispatch(action)">{{action.label}}</a></li>\
                                                </ul>\
                                                </div>'

                                //controllo se non ritornano dati dalla sp
                                if (jQuery.isEmptyObject(self.requestData)) {
                                    self.errorList.push({ "text": self.getLabels("noRecord") });
                                    $timeout();
                                    return;
                                }

                                //controllo che non ci siano errori nella sp
                                if (self.requestData.error != "") {
                                    self.getErrorFromDb(self.requestData.error)
                                    $timeout();
                                    return;
                                }

                                self.applyPortfolioChange().then(function () {
                                    MF.kendo.getGridObject({
                                        gridName: self.requestData.gridName
                                    }).then(function (grid) {

                                        //autoResizeColumns($('div[gridName="' + grid.code + '"]')[0])
                                        grid.columns.map(function (col) {

                                            if (!self.requestData.columnsToShow) {
                                                return
                                            }
                                            col.hidden = true;


                                            $.each(self.requestData.columnsToShow, function (i, v) {
                                                if (v.item == col.field) {
                                                    col.hidden = false;
                                                }
                                            })                                            
                                        });

                                        $.each(grid.columns, function (i, v) {
                                            if (v.columnType == "actions") {
                                                v.hidden = true;
                                            }
                                        });

                                        //imposto il filtro per la griglia
                                        grid.dataSource.filter = combineDataSourceFilters(grid.dataSource.filter, $.extend(self.requestData.filterGrid, {
                                            type: "customFilter"
                                        }));

                                        //self.mainGridDataSrc = new kendo.data.DataSource(grid.dataSource);
                                        self.mainGridDataSrc = new kendo.data.DataSource(
                                            $.extend({}, grid.dataSource, {
                                                filter: grid.dataSource.filter
                                            }, {
                                                requestEnd: function (e) {
                                                    console.log(e);
                                                }
                                            }))

                                        self.mainGridDataSrc.read().then(function () {
                                            self.currentDataRow = self.mainGridDataSrc.view()[0];

                                            $timeout(function () {
                                                self.mainGrid = grid;
                                                self.showInitTab = true;
                                                //self.showMainGrid = true;
                                            }, 500);
                                        });
                                    });
                                })
                            }, function (err) {
                                console.log('Errore wfp_sp_get_process: ' + err);
                            });
                }

                self.applyPortfolioChange = function () {
                    return $.ajax({
                        type: "POST",
                        url: "/api/Visibility/setSessionUserVisibilityGroup",
                        data: JSON.stringify({
                            id: self.requestData.idBusinessUnit,
                            isDefault: false
                        }),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json"
                    })
                };

                self.onDataBindingGrid = function (e) {
                    if (e.sender.dataSource._data.length == 0) {
                        return;
                    }

                    var gridobj = e.sender;

                    if (!self.requestData.showGrid) {
                        self.getItemForForm(gridobj);
                    }
                     
                    self.actionRequestData = {
                        entityname: gridobj.options.EntityName, 
                        id: gridobj.dataSource._data[0].id,
                        pk: self.requestData.filterPkGrid,
                        queryType: 'stageactions',
                        functionGUID: null,
                        gridName: gridobj.options.EntityName,
                        masterEntityName: gridobj.options.EntityName,  
                        itemid: !gridobj.dataSource._data[0].id ? 0 : gridobj.dataSource._data[0].id,
                        type: 'A',
                        ugvi: !self.requestData.idBusinessUnit ? 0 : self.requestData.idBusinessUnit
                    };

                    self.actionRequestDataCustom = self.actionRequestData;
                    self.actionRequestDataCustom.queryType = "customactions";
                    self.actionRequestDataCustom.gridName = gridobj.options.code;

                    config.rowData = gridobj.dataSource._data[0];
                    config.pk = self.requestData.filterPkGrid;
                    config.rowData.id = gridobj.dataSource._data[0].id;
                    config.entityname = gridobj.options.EntityName;

                    config.actionCallback = function (p) {
                        if (p.type != "read" && !!p.type) {
                            $timeout(function () {
                                self.onActionExecuted(p);
                            }, 500)
                        }
                    }


                    $timeout(function () {
                        tDivAction = angular.element($("div[name='divAction']"));
                        tDivAction.empty();
                        tDivAction.html('<reftree-action-menu request-data="rw.actionRequestData"  request-data-custom="rw.actionRequestDataCustom" my-html="rw.actionTemplate" multi-action="rw.multiAction" sp-action-to-launch="rw.spActionToLaunch" sp-multi-action-to-launch="rw.spMultiActionToLaunch">');
                        $compile(tDivAction.contents())($scope);
                         
                        $scope.$$childTail.rtmm.showFather = true;
                        self.showFatherAction = true;

                        $scope.$$childTail.rtmm.onSelectedAction = function (e) {
                            $timeout(function () {
                                $scope.$$childTail.rtmm.index = e;
                                $scope.$$childTail.rtmm.showFather = false;
                                self.showFatherAction = false;               
                            })
                        }

                        self.initGridAction = true;
                        //autoResizeColumns($('div[gridName="' + gridobj.options.code + '"]')[0])
                    },1000);
                }

                self.onActionExecuted = function (refreshPage) {
                    self.onGetProcess();


                    //$('div[gridName="' + self.requestData.gridName + '"]').data('kendoGrid').dataSource.read();
                    //$('div[gridName="' + self.requestData.gridName + '"]').data('kendoGrid').refresh();
                }

                self.onClose = function () {
                    window.location.href = "/login";
                }

                self.onShowFatherAction = function onShowFatherAction() {
                    $scope.$$childTail.rtmm.showFather = true;
                    self.showFatherAction = true;
                    $timeout();
                }

                self.getItemForForm = function (grid) {
                    self.columnsForm = [];

                    $.each(grid.columns, function (i, v) {
                        if (!v.hidden && v.field) {
                            v.value = grid.dataSource._data[0][v.field];
                            if (v.value != null) {
                                self.columnsForm.push(v);
                            }
                            
                        }
                    });


                    self.showDetailGrid = true;
                }

                self.onGetProcess();

            }])
});

