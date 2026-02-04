define(['angular', 'angular-kendo'], function () {
    angular.module('magicGantt', ['kendo.directives'])
        .directive('magicGantt', [function () {
            return {
                replace: false,
                restrict: "E",
                scope: { 
                    options: "=",
                    treeoptions: "=",
                    datefilter: "=",
                    treefilter: "=",
                    treedata: "=",
					container: "="
                },
                templateUrl: "/Magic/Views/Templates/Directives/magic-gantt.html",
                link: function (scope) {
                    kendo.culture(window.culture);
                    scope.$gantt = $(scope.container);
                    scope.magicTreeOptions = scope.treeoptions;
                    scope.magicGanttOptions = scope.options;
					if (scope.datefilter) {
					scope.magicDateFilter = scope.datefilter;
						scope.$gantt.data("filter", scope.magicDateFilter);
					}
                    scope.magicTreeFilter = scope.treefilter;
                    scope.treeDivClass = "";
                    scope.ganttDivClass = "col-md-12";
                    //scope.magicLabels = {
                    //    dstartf: getObjectText("dateFrom"),
                    //    dendf: getObjectText("dateTo")
                    //}
                    scope.treeSettings = {
                        checkBoxes: {
                            checkChildren: true
                        },
                        treeSearch: function () {
                            var treedomid = "#gantttree [data-role=treeview]";
                            var thetree = $(treedomid).data('kendoTreeView');
                            thetree.expand(".k-item");
                            var filterText = $("#gantttreesearch").val();
                            if (filterText !== "") {
                                $(treedomid + " .k-group .k-group .k-in").closest("li").hide();
                                $(treedomid + " .k-group .k-group .k-in:containsIgnoreCase('" + filterText + "')").each(function () {
                                    $(this).parents("ul, li").each(function () {
                                        $(this).show();
                                    });
                                });
                            }
                            else {
                                $(treedomid+" .k-group").find("ul").show();
                                $(treedomid+" .k-group").find("li").show();
                            }
                        },
                        dataTextField: "assettoexplode",
                        check: function (e) {
                            function checkedNodeIds(nodes, checkedNodes) {
                                for (var i = 0; i < nodes.length; i++) {
                                    //checked leaves
                                    if (nodes[i].checked) { // && !(nodes[i].hasChildren)) {
                                        if (!checkedNodes[nodes[i].type])
                                            checkedNodes[nodes[i].type] = [];
                                        checkedNodes[nodes[i].type].push(nodes[i].assetid) ;
                                    }
                                    //recur if children are there...
                                    if (nodes[i].hasChildren) {
                                        checkedNodeIds(nodes[i].children.view(), checkedNodes);
                                    }
                                }
                            }
                            var checkedNodes = {};
                            treeView = $("#gantttree [data-role=treeview]").data("kendoTreeView");
                            checkedNodeIds(treeView.dataSource.view(), checkedNodes);
                            checkedNodes["_element_"] = [0]; //at least 2 elements needs to be on the list BUG M.F...
                            scope.$gantt.data("checkedIds", checkedNodes);
                            scope.applyFilterLoadGantt();
                        }
                    };
                    scope.magicTreeData = new kendo.data.HierarchicalDataSource({ data: scope.treedata });
                    if (scope.magicTreeFilter) {
                        scope.showTree = true;//determines wether the button and the tree may be visible
                        scope.treeStatus = false; // determines if the tree is hidden or visibile (only if showTree is true) 
                    }
                    else
                        scope.showTree = false;

                    

                    scope.applyFilterLoadGantt = function () {
                        var kendoGantt = scope.$gantt.find("[data-role=gantt]").data("kendoGantt");
						if (scope.magicDateFilter)
							scope.$gantt.data("filter", scope.magicDateFilter);
                        kendoGantt.dataSource.read().then(function () {
                            kendoGantt.dependencies.read();
                        });
                    }
                    scope.refreshTree = function (dateFrom, dateTo)
                    {
                        requireConfigAndMore(["MagicSDK"], function (MF) {
                            scope.magicTreeOptions.data.dateFrom = dateFrom;
                            scope.magicTreeOptions.data.dateTo = dateTo;
                            scope.$gantt.data("checkedIds", { _element_: [0] }); //dummy element means no filter
                            $.when(MF.kendo.getTreeObject(scope.magicTreeOptions)).then(function (TreeData) {
                                scope.magicTreeData = new kendo.data.HierarchicalDataSource({ data: TreeData });
                                scope.$apply();
                            });
                        });

                    }
                    scope.showHideTree = function () {
                        //adjust gantt width ... not adaptive
                        scope.treeStatus = !scope.treeStatus;
                        if (scope.treeStatus) {
                            scope.treeDivClass = "col-md-4";
                            scope.ganttDivClass = "col-md-8";
                        }
                        else 
                            scope.ganttDivClass = "col-md-12";
                        setTimeout(function () {
                            kendo.resize(scope.$gantt)
                        },300);
                    }
                }
            }
        }]);
});