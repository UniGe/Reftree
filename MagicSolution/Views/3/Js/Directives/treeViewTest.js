define(['angular', 'MagicSDK'], function (angular, MF) {
  return  angular
        .module("treeViewR3", ['ui.bootstrap'])
      .directive('treeViewR3', ["$compile", function ($compile) {
            return {
                restrict: 'E',
                scope: {
                    localNodes: '=model',
                    localClick: '&click',
                    checkChange: '&change',
                    selectedNode: '=',
                    searchTree: "&search",
                    bFilterTree: "=",
                    onSearchDropDown: "&onSearchDropDown",
                    localFilterDrop: '=modelDrop',
                    dataSource: "=source",
                    onCheckBlock: "=",
                    bSelectedAll: "=",
                    selectedNodeBlock: '=',
                    onShowBlock: "&onShowBlock",
                    iconClick: '&iconClick',
                },

                bindToController: {
                    onTreeClick: "=",
                    onInitTree: "=",
                    localNodes: '=model',
                    dataSource: "=source"
                    
                },
    
                link: function (scope, tElement, tAttrs, transclude) {

                    var maxLevels = (angular.isUndefined(tAttrs.maxlevels)) ? 10 : tAttrs.maxlevels;
                    var hasCheckBox = (angular.isUndefined(tAttrs.checkbox)) ? false : true;
                    scope.showItems = [];

                    if (tAttrs) { scope.$eval(tAttrs.treeViewR3) }

                    scope.findElement = function (e) {
                        $.each(e.localNodes, function (i, v) {
                            if (v.expanded) {
                                scope.showHide(v.id);
                                $.each(v.children, function (i, v) {
                                    if (v.expanded) {
                                        scope.showHide(v.id);
                                    }
                                });
                            }
                        });
                    }

                    scope.dwgSelectedNode = [];

                    scope.expandAll = function (e, ShowHide) {

                        $.each(e.localNodes, function (i, v) {
                            if (v.expanded) {
                                scope.showHideAll(v.id, ShowHide);
                                $.each(v.children, function (i, v) {
                                    if (v.expanded) {
                                        scope.showHideAll(v.id, ShowHide);
                                    }
                                });
                            }
                        });

                        scope.bShowHide = !scope.bShowHide
                    }

                    scope.showHideAll = function (ulId, showHide) {
                        var oClass = angular.element('#tree_li_' + ulId).attr('class');
                        angular.element('#tree_li_' + ulId).attr('class', (showHide ? 'glyphicon glyphicon-minus-sign' : 'glyphicon glyphicon-plus-sign'));
                        var hideThis = document.getElementById(ulId);
                        angular.element(hideThis).attr('class', (showHide ? 'show' : 'hide'));

                    }

                    scope.showHide = function (node) {
                        //console.log('showHide');

                        var ulId = node.TREE_ID;
                        var oClass = angular.element('#tree_li_' + ulId).attr('class');
                        angular.element('#tree_li_' + ulId).attr('class', (oClass === 'glyphicon glyphicon-plus-sign' ? 'glyphicon glyphicon-minus-sign' : 'glyphicon glyphicon-plus-sign'));

                        var hideThis = document.getElementById('ul_tree_' + ulId);
                        var showHide = angular.element(hideThis).attr('class');
                        angular.element(hideThis).attr('class', (showHide === 'show' ? 'hide' : 'show'));
                    }
                   
                    scope.showIcon = function (node) {
                        //console.log('showIcon');
                        if (!angular.isUndefined(node.children)) return true;
                    }

                    scope.appendBlock = function (node) {
 
                        block = '<div ng-if="n.activateBlock" class="container">'
                        block += '<table style="margin:10px; border-style:solid;" isvisible id="tblBlock_{{n.TREE_ID}}" ng-show="(n.activateBlock && n.checkedEnd)">'
                        block += '<tbody>'
                        block += '<tr>'
                        block += '<td class="td_block"><span style ="padding-right: 5px; padding-left: 5px;">Dimensione carattere</span><input ng-model=n.blockFontSize type="text" style="width:30px; min-height: 20px; font-size: 14px; text-align: center;"></input></td>'
                        block += '<td class="td_block"><input ng-model=n.infoArea type="checkbox"><span  style ="padding-right: 5px; padding-left: 5px;">Aggiungi informazioni Area</span></input></td>'
                        block += '<td class="td_block"></td>'
                        block += '</tr>'
                        block += '<tr>'
                        block += '<td class="td_block"><input type="checkbox" ng-model=n.bStampaEtiche><span style ="padding-right: 5px; padding-left: 5px;">Stampa etichette</span></input></td>'
                        block += '<td></td>'
                        block += '<td></td>'
                        block += '</tr>'
                        block += '<tr>'
                        //block += '<td class="td_block"><input type="checkbox"><span  style ="padding-right: 5px; padding-left: 5px;">Colore sfondo testo</span></input><div><input type="color"></input></div></td>'
                        //block += '<td class="td_block"><p><span  style ="padding-right: 5px; padding-left: 5px;">Colore sfondo testo</span></p><input type="color"></input></td>'

                        block += '<td class="td_block">'
                        block += '<label class="lbl-r3">'
                        block += '<input class="itemColor-r3" type="checkbox" ng-model=n.bBlockBackGroundColor></input>Colore sfondo testo'
                        block += '</label>'
                        block += '<div >'
                        block += '<input   ng-class="n.bBlockBackGroundColor ? itemColor-r3 : itemColor-r3-ro" ng-model="n.blockBackGroundColor" ng-value="n.blockBackGroundColor" type="color"></input>'
                        block += '</div>'
                        block += '</td>'

                        block += '<td class="td_block">' 
                        block += '<label class="lbl-r3">Colore testo</label>'
                        block += '<input class="itemColor-r3" type="color" colorformat="rgb" ng-model="n.blockFontColor" ng-value="n.blockFontColor"></input>'
                        block += '</td>'

                        block += '<td></td>'
                        block += '</tr>'
                        block += '</tbody>'
                        block += '</table>'
                        block += '</div>'

         
                        return block;



                    }

                    scope.checkedEnd = function (node) { 
                        
                    }

 
                    function renderTreeView(collection, level, max) {
                        var text = '';

                        text += '<li ng-click="onShowBlock({node:n})" id="tree_{{n.TREE_ID}}" ng-show="isVisible(n)" class="li-r3" node_id="{{n.TREE_ID}}"  ng-repeat="n in ' + collection + '" >';
                        text += '<table><tbody>'
                        text += '<tr>'
                        text += '<td class="td-r3">'
                        text += '<span title="{{n.TREE_LABEL}}" ng-show=showIcon(n) class="show-hide nobr" expanded="{{n.expanded}}" ng-click=showHide(n)><i id="tree_li_{{n.TREE_ID}}" class="glyphicon glyphicon-plus-sign"></i></span>';
                        text += '</td>'
                        text += '<td class="td-r3">'
                        text += '<a ng-show=n.showIcon ng-click="iconClick({node:n})"  class="edit nobr"><i class="glyphicon glyphicon-th-list"></a>';
                        text += '</td>'

                        text += '<td class="td-r3">'
                        text += '<span ng-if="n.isCheckBox"></span>';
                        text += '</td>'
                        text += '<td class="td-r3">'
                        text += '<input ng-if="n.isCheckBox" class="tree-checkbox" type=checkbox ng-model=n.checked ng-change=checkChange({node:n})></input>';
                        text += '</td>'

                        text += '<td class="td-r3">'
                        //text += '<div class="column_test">'
                        text += '<span id="nocr_{{n.TREE_ID}}" class="edit nobr" ng-click=localClick({node:n}) ng-if="n.isClick" title="{{n.TREE_LABEL}}"><i class="fa fa-newspaper"></i>{{n.TREE_LABEL}}</span>';
                        text += '</td>'

                        text += '<td class="td-r3">'
                        //text += '<div class="column">'
                        text += '<span title="{{n.TREE_LABEL}}" class="edit nobr" ng-if="!n.isClick">{{n.TREE_LABEL}}</span>';
                        text += '</td>'
                        text += '<td class="td-r3">'
                        text += '<input ng-if=n.showColor type="color" id="color_{{n.TREE_ID}}" ng-model="n.ColourTemat" ng-value="n.ColourTemat"></input>'
                        text += '</td>'


                        if (scope.onCheckBlock) {

                        text += '<td  class="td-r3">'
                        text += '<div ng-show="n.activateBlock" padding-left:5px;" id="divCheckBlock_{{n.TREE_ID}}">'
                        text += '<input id="checkBlock_{{n.TREE_ID}}"  class="tree-checkbox" type="checkbox" ng-model=n.checkedEnd ng-change="checkedEnd(n)"></input >'
                        text += '<span style="padding-left:5px;">{{n.labelCheckBox }}</span>'
                        text += '</div>';
                        text += '</td>'

                        //td per l'cona del come blocco
                            text += '<td id="td_icon_block_{{n.TREE_ID}}" class="td-r3" ng-show="(n.activateBlock || n.checkedEnd)">'
                            text += '<div style="text-align:center; font-weigth:bold; background-color:{{n.blockBackGroundColor}}; font-size:14px; width:20px; height:20px;">'
                            text +='<span style="color:{{n.blockFontColor}}; background-color:{{n.blockBackGroundColor}}; font-size:14px; width:20px; height:20px;" >B</span>'
                        text += '</div>'      
                        text += '</td>'

                        text += '</tr>'

                        
                            text += '<tr>' + scope.appendBlock(); +'</tr>'
                        }
                        
                        text += '</tbody></table>'
                      

                        if (level < max) {
                            text += '<ul id="ul_tree_{{n.TREE_ID}}" class="hide ul-r3" >' + renderTreeView('n.children', level + 1, max) + '</ul></li>';
                        } else {
                            text += '</li>';
                        }
                       
                        return text;
                    } // end renderTreeView();

                    // <input ng-model="treeSearchQuery" ng-model-options="{debounce: 500}" clear-input="grey" select-on-focus>\

                    scope.initTree = function initTree() {
                        try {
                            //<button type="button" ng-click="searchTree()" class="btn btn-success" id="btn-search">Search</button>\
                            var text = '<div ng-if="bFilterTree" class="form-group">\
                                        <label for="input-disable-node" class="sr-only">Search Tree:</label>\
                                        <input type="input" ng-change="searchTree()" ng-model="treeSearchQuery" class="form-control" id="input-search" placeholder="Identify node...">\
                                        <select class="pdf-form-control" ng-model="ProfileUser" ng-change="onSearchDropDown(this);">\
                                        <option  ng-value="0">Tutti</option>\
                                        <option  ng-repeat="value in localFilterDrop" ng-value="{{value.id}}" >{{value.description}}</option>\
                                        </select>\
                                        </div>\
                                        <div ng-if="bSelectedAll">\
                                        <input type="checkbox" ng-model="checkAll" ng-change="selectedAll()"><span style="padding-left:5px;">{{selectAllText}}</span></input>\
                                        </div>'
                            text += '<ul class="ul-r3">';
                            text += renderTreeView('localNodes', 1, maxLevels);
                            text += '</ul>';
                            tElement.html(text);
                            $compile(tElement.contents())(scope);
                            scope.$emit('onAfterRender') 
                        } catch (err) {
                            tElement.html('<b>ERROR!!!</b> - ' + err);
                            $compile(tElement.contents())(scope);
                             
                        }
                    }

                    scope.modelInput = [];

                    scope.isVisible = function isVisible(node) {
                        return node.isVisible;
                    }

                    scope.expand = function expand(node) {
                        angular.element(node).triggerHandler('click');
                    }


                    

                    scope.initTree();
                    
                     
                    
                    //Initialization of treeviews
                },
                controllerAs: "r3t",
                controller: ('treeCtrl', ['config', '$scope',
                    '$element',
                    '$timeout',
                    function (config, $scope, $element, $timeout) {
                        var self = this;

                        $scope.checkAll = true;
                        $scope.nodeBlock = [];
                        $scope.bShowHide = true;
                        $scope.selectAllText = "Deseleziona tutti";
                        $scope.treeData = [];

                        $scope.selectedAll = function selectedAll() {
                            $scope.selectAllText = $scope.checkAll ? "Deseleziona tutti" : "Seleziona tutti";
                            $.each($scope.localNodes, function (i, node) {
                                node.checked = $scope.checkAll;
                                $scope.setCheckedAll(node, $scope.checkAll);
                            });
                        }

                        $scope.$evalAsync(
                            function ($scope) {
                                console.log("$evalAsync");
                            }
                        );

                        $scope.setCheckedAll = function (node,value) {
                            $.each(node.children, function (i, child) {
                                child.checked = value;
                                $scope.setCheckedAll(child, value);
                            });
                        }

                        //$scope.$watch('nodeBlock', function (newNode, oldNode) {
                        //    //console.log('showBlock$watch');
                        //    //oldNode.activateBlock = false;
                            
                        //    //if (newNode.checked || newNode.TREE_PARENT_ID != -1) {
                        //    //    newNode.activateBlock = true;
                        //    //}
                        //    //oldNode.activateBlock = false;
                        //    //if (newNode.TREE_PARENT_ID != - 1 && newNode.children) {
                        //    //    newNode.activateBlock = true;
                        //    //}
                        //    console.log(newNode);
                        //    console.log(oldNode);
                        //});

                        //$scope.showBlock = function (node,e) {
                        //    console.log(node);
                        //    if (node.TREE_PARENT_ID != - 1 && node.children) {
                        //        $scope.nodeBlock = node;
                        //    }
                            
                        //    //console.log('showBlock');
                        //    //if ($scope.onCheckBlock) {
                        //    //    if (node.TREE_PARENT_ID != -1) {
                        //    //        if (!node.checked) {
                        //    //            node.activateBlock = false;
                        //    //            node.checkedEnd = false;
                        //    //        }
                        //    //        else {
                        //    //            $scope.nodeBlock = node;
                        //    //            node.activateBlock = true;
                        //    //        }
                        //    //    }
                        //    //}
                        //}

                        self.setData = function (object) {
                            $.each(self.dataSource, function (i, v) {
                                if (!!object.TREE_ID) {
                                    if (v.TREE_PARENT_ID == object.TREE_ID) {
                                        v['children'] = [];
                                        if ($scope.onCheckBlock) {
                                            v.blockFontSize = v.blockFontSize ? v.blockFontSize : 10;
                                            v.blockBackGroundColor = v.blockBackGroundColor ? v.blockBackGroundColor : "#FFFFFF";
                                            v.blockFontColor = v.blockFontColor ? v.blockFontColor : "#000000";
                                            v.infoArea = v.infoArea ? v.infoArea : false;
                                            v.bStampaEtiche = v.bStampaEtiche ? v.bStampaEtiche : false;
                                            v.renderAsBlock = v.checkedEnd ? v.checkedEnd : false;
                                            v.bBlockBackGroundColor = v.bBlockBackGroundColor ? v.bBlockBackGroundColor : false;
                                            v.activateBlock = false;
                                            v.father = object.TEMP_OBJ_ID;
                                        }

                                        var oChild = v;
                                        self.setData(oChild);
                                        if (oChild.children.length == 0) {
                                            delete oChild.children;
                                        }
                                        //oChild["father"] = object;
                                        object.children.push(oChild);
                                    }
                                } else {
                                    if (v.TREE_PARENT_ID == -1) {
                                        v['children'] = [];
                                        var oItem = v;


                                        self.setData(oItem);

                                        if (oItem.children.length == 0) {
                                            delete oItem.children;
                                        }
                                        object.push(oItem);
                                    }
                                }

                            });

                        }

                        self.localNodes = [];
                     
                        //self.setData(self.localNodes);
                         
                       
                        if ($scope.bSelectedAll) {
                            $scope.selectedAll();
                        }

                        self.init = function () {
                            var promises = self.setData($scope.treeData);
                            $.when.apply($, promises)
                                .then(function () {
                                    self.localNodes = $scope.treeData;
                                });
                        }

                        self.init();
                        //end of controller
                    }
                ])
            };
        }])
})
  