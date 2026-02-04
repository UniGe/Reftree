define(['angular', 'MagicSDK'], function (angular, MF) {
  return  angular
      .module("treeBimR3", ['ui.bootstrap'])
      .directive('treeBimR3', ["$compile", function ($compile) {
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
                    bSelectedAll: "=",
                    iconClick: '&iconClick',
                    hideNodeClick: '&hideNode',
                    localDbClick: '&dbClick',
                    showHideNode: "&showHideNode",
                    onAddChildrenNode: "&onAddChildrenNode",                                         
                    modelReftree: '=modelReftree',
                    showThemati: "&showThemati",
                },
                templateUrl: window.includesVersion + '/Views/3/Templates/TreeBim.html',
                bindToController: {
                    onTreeClick: "=",
                    onInitTree: "=",
                    localNodes: '=model',
                    localClick: '&click',
                    selectedNodes: '=',
                    isolatedNodes: '=',
                    showThemati: "&showThemati",
                },
                
                link: function (scope, tElement, tAttrs, transclude) {
                    scope.$watch("click", function (newValue) {
                        console.log('click')
                    })

                    var maxLevels = (angular.isUndefined(tAttrs.maxlevels)) ? 10 : tAttrs.maxlevels;
                    var hasCheckBox = (angular.isUndefined(tAttrs.checkbox)) ? false : true;
                    scope.showItems = [];
                  
                    
                    if (tAttrs) {
                        scope.$eval(tAttrs.treeViewR3)
                    }

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
                        child = [];
                        if (!!node.children) {
                            child = node.children;
                        } else {
                            child = scope.localNodes.filter(function (ele) {
                                return ele.parentId == node.Id
                            });
                        }

                        child.map(function (nodeChild) {

                            scope.$watch("n.showHide", function (newValue) {
                                console.log('showHide node')
                            })


                            if (!nodeChild.showHideChange) {
                                nodeChild.showHide = node.showHide;
                            }                            
                            nodeChild.style = nodeChild.isRefTree ? 'isRefTreeNode' : node.style;
                        })

                        $('[data-toggle="tooltip"]').tooltip();
                        node.show = !node.show;
                        node.iconClass = node.show ? 'glyphicon glyphicon-plus-sign' : 'glyphicon glyphicon-minus-sign'
                        node.children = child;
                    }
                   
                    scope.showIcon = function (node) {                        
                        return scope.localNodes.filter(function (child) { if (child.name != 'Body' && child.name != 'Solido') { return child.parentId == node.Id }}).length > 0 ? true : false;
                    }
                   
                    scope.isVisible = function isVisible(node) {
                        return node.isVisible;
                    }

                    scope.expand = function expand(node) {
                        angular.element(node).triggerHandler('click');
                    }

                    scope.click = function click(e) {
                        //$.each(scope.localNodes, function (i, v) {
                        //    v.isIsolate = false;
                        //    v.style = ''

                        //    if (v.ShowHide) {
                        //        v.style = ' ' + 'is-hide'
                        //    }

                        //    if (v.isSelected) {
                        //        v.style = 'is-selected'
                        //    }


                        //})

                        scope.localClick(e);
                    }
                },
                controllerAs: "r3t",
                controller: ('treeBimCtrl', ['config', '$scope',
                    '$element',
                    '$timeout',
                    function (config, $scope, $element, $timeout) {
                        var self = this;
                        $scope.checkAll = true;
                        $scope.nodeBlock = [];
                        $scope.bShowHide = true;
                        $scope.selectAllText = "Deseleziona tutti";
                        $scope.treeData = [];
                        $scope.localNodes = [];
                        
                        self.isolatedNodeNodes = [];

                        $scope.selectedAll = function selectedAll() {
                            $scope.selectAllText = $scope.checkAll ? "Deseleziona tutti" : "Seleziona tutti";
                            $.each($scope.localNodes, function (i, node) {
                                node.checked = $scope.checkAll;
                                $scope.setCheckedAll(node, $scope.checkAll);
                            });
                        }

                        $scope.$watch("hideNodeBim", function (newValue) {

                        })
                         

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

                        if ($scope.bSelectedAll) {
                            $scope.selectedAll();
                        }

                        self.init = function () {
                            $scope.localNodes = self.localNodes; 

                            //$.each(self.localNodes, function (i, v) {
                            //    $scope.$watch('r3t.localNodes[' + i + '].isIsolated', function (val, oldVal) {
                            //        console.log(val)
                            //    });
                            //})

                        }

                        self.onClick = function onClick(e) {                           
                            var node = e['node'];
                            self.onShowHideNode(node, true);
                            
                            var nodes = self.selectedNodes

                            if (!!self.selectedNodes) {
                                if (((window.event.shiftKey) && (window.event.ctrlKey)) || (window.event.shiftKey)) {
                                    if (!nodes.includes(node)) {
                                        nodes.push(node);
                                        e['node'].style = 'is-selected';
                                    } else {
                                        nodes.splice(nodes.indexOf(node), 1)
                                        e['node'].style = '';
                                    }
                                } else {
                                    $.each(nodes, function (i, v) {
                                        v.style = '';
                                    })
                                        if (!nodes.includes(node)) {
                                            nodes = [];
                                            nodes.push(node);
                                            e['node'].style = 'is-selected';
                                        } else {
                                            nodes.splice(nodes.indexOf(node), 1)
                                        }
                                }

                                self.selectedNodes = nodes;
                            }
                            
                            self.localClick(e);
                        }

                        self.onIsolate = function onIsolate(e) {
                            //var node = e['node'];

                            //if (((window.event.shiftKey) && (window.event.ctrlKey)) || (window.event.shiftKey)) {
                            //    if (!self.isolatedNodeNodes.includes(node.dbId)) {
                            //        self.isolatedNodeNodes.push(node.dbId);
                            //    }
                            //} else {
                            //    self.isolatedNodeNodes = [];
                            //    self.isolatedNodeNodes.push(node.dbId);
                            //}
                            //console.log(self.isolatedNodeNodes)
                            //e['node'].style = 'is-isolate';
                            //self.localDbClick(e); 
                        }

                        self.onShowHideNode = function onShowHideNode(e, value) {
                            function onShowHideChild(child, value) {
                                child.showHide = value;
                                child.iconClassDetail = child.showHide ? 'glyphicon glyphicon-eye-open' : 'glyphicon glyphicon-eye-close'

                                $.each(child.children, function (i, v) {
                                    onShowHideChild(v, value);
                                })
                            }

                            value = value == undefined ? !e.showHide : e.showHide;
                            e.showHide = value;
                            e.showHideChange = true;
                            e.iconClassDetail = e.showHide ? 'glyphicon glyphicon-eye-open' : 'glyphicon glyphicon-eye-close'


                            $.each(e.children, function (i, v) {
                                onShowHideChild(v, e.showHide);
                            })
                        }


                        self.init();
                    }
                ])
            };
        }])
      .directive('wrapperbim', ['$document', function ($document) {
          return {
              restrict: 'E',
              scope: {
              },
              link: function (scope, elm, attrs) {

              },
              template: '<div class="wrapper-bim-r3 wrapper1" ng-click="onCLickArrow($event);">\
	                        <p class="click-text-bim-r3">\
		                        {{r3wr.titleDs}}<span class="arrow-bim-r3"></span>\
	                        </p>\
	                        <ul class="wrapper-ul-r3">\
		                        <li class="wrapper-li-r3" ng-repeat="ele in elements" ng-click="r3wr.nodeClick(ele)">{{ele.description}}</li>\
	                        </ul>\
                        </div>', 
              bindToController: {
                  elements: '=model',
                  elementClick: '=',
                  titleDs:'='
              },
              controllerAs: "r3wr",
              controller: ('wrappeBim', ['config', '$scope',
                  '$element',
                  '$timeout',
                  function (config, $scope, $element, $timeout) {
                      var self = this;
                      $scope.elements = [];
                      self.titleDs = ''

                      $scope.$watch('r3wr.titleDs', function (newOne, oldOne) {
                          self.titleDs = newOne;
                      }); 

                      $scope.$watch('r3wr.elements', function (newOne, oldOne) {
                          if (!jQuery.isEmptyObject(newOne) && newOne.length > 0) {
                              $scope.elements = newOne;
                          }
                      }); 
  
                      $scope.onCLickArrow = function(e) {
                          var className = ' ' + e.currentTarget.className + ' ';
                          e.currentTarget.className = ~className.indexOf(' active ') ? className.replace(' active ', '') : e.currentTarget.className + ' active';
                      };

                      self.nodeClick = function nodeClick(e) {
                          if (self.elementClick) {
                              self.elementClick(e);
                          }
                      }
                  }
              ])
          };
      }])
})
  