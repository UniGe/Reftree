define(["angular" ,window.includesVersion + "/Views/3/Js/split-pane.js"], function (angular) {
    angular
        .module('angular.drag.resize', [])
        .provider('adrConfig', function adrConfigProvider() {
            //defaults
            var defaultConfig = {
                iconPosition: [0, 0],
                mode: 'all',
                modes: ['all', 'horizontal', 'vertical']
            };
            var config = angular.extend({}, defaultConfig);
            this.$get = [function () {
                return {
                    iconPosition: config.iconPosition,
                    mode: config.mode,
                    modes: config.modes
                };
            }];
        })
        .directive('resize', ['adrConfig', '$document', function (adrConfig, $document) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    var dimension = {};
                    var iconPosition = adrConfig.iconPosition;

                    var mode = attr.resize && adrConfig.modes.indexOf(attr.resize) > -1 ? attr.resize : adrConfig.mode;
                    var position = {};
                    //create button for resizing
                    var btn = document.createElement("span");
                    btn.style.width = '15px';
                    btn.style.height = '15px';
                    btn.innerHTML = "<svg>\
            <circle cx='12.5' cy='2.5' r='2' fill='#777777'></circle>\
            <circle cx='7.5' cy='7.5' r='2' fill='#777777'></circle>\
            <circle cx='12.5' cy='7.5' r='2' fill='#424242'></circle>\
            <circle cx='2.5' cy='12.5' r='2' fill='#777777'></circle>\
            <circle cx='7.5' cy='12.5' r='2' fill='#424242'></circle>\
            <circle cx='12.5' cy='12.5' r='2' fill='#212121'></circle></svg>";
                    btn.style.bottom = iconPosition[0] + 'px';
                    btn.style.right = iconPosition[1] + 'px';
                    btn.style.position = 'absolute';
                    btn.style.visibility = 'hidden';
                    if (mode == 'horizontal') {
                        btn.style.cursor = 'ew-resize';
                    } else if (mode == 'vertical') {
                        btn.style.cursor = 'ns-resize';
                    } else {
                        btn.style.cursor = 'nwse-resize';
                    }
                    //bind resize function to button;
                    btn.onmousedown = function ($event) {
                        $event.stopImmediatePropagation();
                        position.x = $event.clientX;
                        position.y = $event.clientY;
                        dimension.width = element.prop('offsetWidth');
                        dimension.height = element.prop('offsetHeight');
                        $document.bind('mousemove', mousemove);
                        $document.bind('mouseup', mouseup);
                        return false;
                    };

                    function mousemove($event) {
                        var deltaWidth = dimension.width - (position.x - $event.clientX);
                        var deltaHeight = dimension.height - (position.y - $event.clientY);
                        var newDimensions = {};
                        if (mode == 'horizontal') {
                            newDimensions = {
                                width: deltaWidth + 'px'
                            };
                        } else if (mode == 'vertical') {
                            newDimensions = {
                                height: deltaHeight + 'px'
                            };
                        } else {
                            newDimensions = {
                                width: deltaWidth + 'px',
                                height: deltaHeight + 'px'
                            };
                        }
                        element.css(newDimensions);
                        return false;
                    }

                    function mouseup() {
                        $document.unbind('mousemove', mousemove);
                        $document.unbind('mouseup', mouseup);
                    }
                    element.append(btn);
                    //show button on hover
                    element.bind('mouseover', function () {
                        btn.style.visibility = 'visible';
                    });
                    element.bind('mouseout', function () {
                        btn.style.visibility = 'hidden';
                    });
                }
            };
        }])
    //.directive('draggable', function ($document) {
    //    return function (scope, element, attr) {
    //        var startX = 0,
    //            startY = 0,
    //            x = 0,
    //            y = 0;
    //        var container = null;
    //        var position = {};

    //        element.css({
                
    //            cursor: 'pointer'
    //        });

    //        //element.bind('mousedown', function ($event) {

    //        //    position.x = element[0].getBoundingClientRect().left;
    //        //    position.y = element[0].getBoundingClientRect().top;
    //        //    position.initialMouseX = $event.clientX;
    //        //    position.initialMouseY = $event.clientY;
    //        //    $document.bind('mousemove', mousemove);
    //        //    $document.bind('mouseup', mouseup);
    //        //    return false;
    //        //});



    //        element.on('mousedown', function (event) {
    //            // Prevent default dragging of selected content
    //            event.preventDefault();

    //            position.x = x
    //            position.y = y;
                               
    //            startX = event.screenX - x;
    //            startY = event.screenY - y;

    //            $document.on('mousemove', mousemove);
    //            $document.on('mouseup', mouseup);
    //            container = attr.$$element.parent();

    //            //console.log(container);
    //        });

    //        function mousemove(event) {
    //            var containerPosititon = $(attr.parent)[0].getBoundingClientRect();
    //            var elementPosititon = element[0].getBoundingClientRect() 
    //            var iMaxY = containerPosititon.height - elementPosititon.height;
    //            var iMaxX = containerPosititon.width - elementPosititon.width;

    //            y = event.screenY - startY;
    //            x = event.screenX - startX;

                 
    //            if (x < 0) {
    //                x = 0;
    //            } else if (x > iMaxX) {
    //                x = iMaxX -2;
    //            }

    //            if (y < 0) {
    //                y = 0;
    //            } else if (y > iMaxY) {
    //                y = iMaxY -2;
    //            }

    //            console.log("x: " + x + " y: " + y)
    //            //if (x < 0 && $(attr.parent).length > 0) {
    //            //    x = 0;
    //            //}

    //            container.css({
    //                top: y + 'px',
    //                left: x + 'px'
    //            });
    //        }

    //        function mouseup() {
    //            $document.unbind('mousemove', mousemove);
    //            $document.unbind('mouseup', mouseup);
    //        }
    //    }
    //})
    .directive('draggable', ['$document', function ($document) {
        return {
            restrict: 'A',
            link: function (scope, elm, attrs) {
                var startX, startY, initialMouseX, initialMouseY;
                var lastPosition = {};
                    

                elm.css({ position: 'absolute' });

                //container.bind('resize', function () {
                //    console.log('resized parent');
                //});
                 
                elm.bind('mousedown', function ($event) {
                    startX = elm.prop('offsetLeft');
                    startY = elm.prop('offsetTop');
                    initialMouseX = $event.clientX;
                    initialMouseY = $event.clientY;
                    $document.bind('mousemove', mousemove);
                    $document.bind('mouseup', mouseup);
                    container = attrs.$$element.parent();

                    window.addEventListener('resize', function (event) {
                        var containerPosititon = container[0].getBoundingClientRect();
                        var elementPosititon = elm[0].getBoundingClientRect() 
                        var variaz = containerPosititon.width - lastPosition.width
                         
                    }, true);

                    return false;
                });

                
               
            
                            
                function mousemove($event) {
                    var containerPosititon = container[0].getBoundingClientRect(); 
                    var elementPosititon = elm[0].getBoundingClientRect() 
                    var iMaxY = containerPosititon.height - elementPosititon.height;
                    var iMaxX = containerPosititon.width - elementPosititon.width;

                    var dx = $event.clientX - initialMouseX;
                    var dy = $event.clientY - initialMouseY;

                    var x = startX + dx;
                    var y = startY + dy;

                    if (x < 0) {
                        x = 0
                    } else if (x > iMaxX) {
                        x = iMaxX - 2;
                    }

                    if (y < 0) {
                        y = 0
                    } else if (y > iMaxY) {
                        y = iMaxY - 2;
                    }

                    elm.css({
                        top: y + 'px',
                        left: x + 'px'
                    });

                     lastPosition = {
                            height: containerPosititon.height,
                         width: containerPosititon.width
                        }

                    //elm.css({
                    //    top: startY + dy + 'px',
                    //    left: startX + dx + 'px'
                    //});
                    return false;
                }

                function mouseup() {
                    $document.unbind('mousemove', mousemove);
                    $document.unbind('mouseup', mouseup);
                }
            }
        };
    }])
    .directive('resizable', ['$document', function ($document) {
        var toCall;
        function throttle(fun) {
            if (toCall === undefined) {
                toCall = fun;
                setTimeout(function () {
                    toCall();
                    toCall = undefined;
                }, 100);
            } else {
                toCall = fun;
            }
        }
        return {
            restrict: 'AE',
            scope: {
                rDirections: '=',
                rCenteredX: '=',
                rCenteredY: '=',
                rWidth: '=',
                rHeight: '=',
                rFlex: '=',
                rGrabber: '@',
                rDisabled: '@'
            },
            link: function (scope, element, attr) {
                var flexBasis = 'flexBasis' in document.documentElement.style ? 'flexBasis' :
                    'webkitFlexBasis' in document.documentElement.style ? 'webkitFlexBasis' :
                        'msFlexPreferredSize' in document.documentElement.style ? 'msFlexPreferredSize' : 'flexBasis';

                // register watchers on width and height attributes if they are set
                scope.$watch('rWidth', function (value) {
                    element[0].style.width = scope.rWidth + 'px';
                });
                scope.$watch('rHeight', function (value) {
                    element[0].style.height = scope.rHeight + 'px';
                });

                element.addClass('resizable');

                var style = window.getComputedStyle(element[0], null),
                    w,
                    h,
                    dir = scope.rDirections,
                    vx = scope.rCenteredX ? 2 : 1, // if centered double velocity
                    vy = scope.rCenteredY ? 2 : 1, // if centered double velocity
                    inner = scope.rGrabber ? scope.rGrabber : '<span></span>',
                    start,
                    dragDir,
                    axis,
                    info = {};

                var updateInfo = function (e) {
                    info.width = false; info.height = false;
                    if (axis === 'x')
                        info.width = parseInt(element[0].style[scope.rFlex ? flexBasis : 'width']);
                    else
                        info.height = parseInt(element[0].style[scope.rFlex ? flexBasis : 'height']);
                    info.id = element[0].id;
                    info.evt = e;
                };

                var dragging = function (e) {
                    var prop, offset = axis === 'x' ? start - e.clientX : start - e.clientY;
                    switch (dragDir) {
                        case 'top':
                            prop = scope.rFlex ? flexBasis : 'height';
                            element[0].style[prop] = h + (offset * vy) + 'px';
                            break;
                        case 'bottom':
                            prop = scope.rFlex ? flexBasis : 'height';
                            element[0].style[prop] = h - (offset * vy) + 'px';
                            break;
                        case 'right':
                            prop = scope.rFlex ? flexBasis : 'width';
                            element[0].style[prop] = w - (offset * vx) + 'px';
                            break;
                        case 'left':
                            prop = scope.rFlex ? flexBasis : 'width';
                            element[0].style[prop] = w + (offset * vx) + 'px';
                            break;
                    }
                    updateInfo(e);
                    throttle(function () { scope.$emit('angular-resizable.resizing', info); });
                };
                var dragEnd = function (e) {
                    updateInfo();
                    scope.$emit('angular-resizable.resizeEnd', info);
                    scope.$apply();
                    document.removeEventListener('mouseup', dragEnd, false);
                    document.removeEventListener('mousemove', dragging, false);
                    element.removeClass('no-transition');
                };
                var dragStart = function (e, direction) {
                    dragDir = direction;
                    axis = dragDir === 'left' || dragDir === 'right' ? 'x' : 'y';
                    start = axis === 'x' ? e.clientX : e.clientY;
                    w = parseInt(style.getPropertyValue('width'));
                    h = parseInt(style.getPropertyValue('height'));

                    //prevent transition while dragging
                    element.addClass('no-transition');

                    document.addEventListener('mouseup', dragEnd, false);
                    document.addEventListener('mousemove', dragging, false);

                    // Disable highlighting while dragging
                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();
                    e.cancelBubble = true;
                    e.returnValue = false;

                    updateInfo(e);
                    scope.$emit('angular-resizable.resizeStart', info);
                    scope.$apply();
                };

                dir.forEach(function (direction) {
                    var grabber = document.createElement('div');

                    // add class for styling purposes
                    grabber.setAttribute('class', 'rg-' + direction);
                    grabber.innerHTML = inner;
                    element[0].appendChild(grabber);
                    grabber.ondragstart = function () { return false; };
                    grabber.addEventListener('mousedown', function (e) {
                        var disabled = (scope.rDisabled === 'true');
                        if (!disabled && e.which === 1) {
                            // left mouse click
                            dragStart(e, direction);
                        }
                    }, false);
                });
            }
        };
        }])
        .directive('splitPane', function () {
            return {
                restrict: 'EA',
                replace: true,
                transclude: true,
                scope: {
                    splitPaneProperties: '='
                },
                controller: ['$scope', function ($scope) {
                    $scope.components = [];
                    this.addComponent = function (attributes) {
                        $scope.components.push(attributes);
                    };
                    this.addDivider = function (attributes) {
                        $scope.divider = attributes;
                    };
                }],
                link: function ($scope, element, attrs) {
                    var $firstComponent = element.children('.split-pane-component:first'),
                        $divider = element.children('.split-pane-divider'),
                        $lastComponent = element.children('.split-pane-component:last');
                    if ($scope.components[0].width && $scope.components[0].width.match(/%$/)) {
                        element.addClass('vertical-percent');
                        var rightPercent = (100 - parseFloat($scope.components[0].width.match(/(\d+)%$/)[1])) + "%";
                        $firstComponent.css({ right: rightPercent, marginRight: $scope.divider.width });
                        $divider.css({ right: rightPercent, width: $scope.divider.width });
                        $lastComponent.css({ width: rightPercent });
                    } else if ($scope.components[0].width) {
                        element.addClass('fixed-left');
                        $firstComponent.css({ width: $scope.components[0].width });
                        $divider.css({ left: $scope.components[0].width, width: $scope.divider.width });
                        $lastComponent.css({ left: $scope.components[0].width, marginLeft: $scope.divider.width });
                    } else if ($scope.components[1].width && $scope.components[1].width.match(/%$/)) {
                        element.addClass('vertical-percent');
                        $firstComponent.css({ right: $scope.components[1].width, marginRight: $scope.divider.width });
                        $divider.css({ right: $scope.components[1].width, width: $scope.divider.width });
                        $lastComponent.css({ width: $scope.components[1].width });
                    } else if ($scope.components[1].width) {
                        element.addClass('fixed-right');
                        $firstComponent.css({ right: $scope.components[1].width, marginRight: $scope.divider.width });
                        $divider.css({ right: $scope.components[1].width, width: $scope.divider.width });
                        $lastComponent.css({ width: $scope.components[1].width });
                    } else if ($scope.components[0].height && $scope.components[0].height.match(/%$/)) {
                        element.addClass('horizontal-percent');
                        var bottomPercent = (100 - parseFloat($scope.components[0].height.match(/(\d+)%$/)[1])) + "%";
                        $firstComponent.css({ bottom: bottomPercent, marginBottom: $scope.divider.height });
                        $divider.css({ bottom: bottomPercent, height: $scope.divider.height });
                        $lastComponent.css({ height: bottomPercent });
                    } else if ($scope.components[0].height) {
                        element.addClass('fixed-top');
                        $firstComponent.css({ height: $scope.components[0].height });
                        $divider.css({ top: $scope.components[0].height, height: $scope.divider.height });
                        $lastComponent.css({ top: $scope.components[0].height, marginTop: $scope.divider.height });
                    } if ($scope.components[1].height && $scope.components[1].height.match(/%$/)) {
                        element.addClass('horizontal-percent');
                        $firstComponent.css({ bottom: $scope.components[1].height, marginBottom: $scope.divider.height });
                        $divider.css({ bottom: $scope.components[1].height, height: $scope.divider.height });
                        $lastComponent.css({ height: $scope.components[1].height });
                    } else if ($scope.components[1].height) {
                        element.addClass('fixed-bottom');
                        $firstComponent.css({ bottom: $scope.components[1].height, marginBottom: $scope.divider.height });
                        $divider.css({ bottom: $scope.components[1].height, height: $scope.divider.height });
                        $lastComponent.css({ height: $scope.components[1].height });
                    }
                    element.splitPane();
                    var localFirstComponentSize, localLastComponentSize;
                    element.on('splitpaneresize', function (event, splitPaneProperties) {
                        if ($scope.splitPaneProperties && event.target === element[0] &&
                            localFirstComponentSize !== splitPaneProperties.firstComponentSize &&
                            localLastComponentSize !== splitPaneProperties.lastComponentSize) {
                            $scope.$apply(function () {
                                localFirstComponentSize = splitPaneProperties.firstComponentSize;
                                $scope.splitPaneProperties.firstComponentSize = splitPaneProperties.firstComponentSize;
                                localLastComponentSize = splitPaneProperties.lastComponentSize;
                                $scope.splitPaneProperties.lastComponentSize = splitPaneProperties.lastComponentSize;
                            });
                        }
                    });
                    $scope.$watch('splitPaneProperties.firstComponentSize', function (firstComponentSize) {
                        if ((firstComponentSize || firstComponentSize === 0) && firstComponentSize !== localFirstComponentSize) {
                            localFirstComponentSize = firstComponentSize;
                            element.splitPane('firstComponentSize', firstComponentSize);
                        }
                    });
                    $scope.$watch('splitPaneProperties.lastComponentSize', function (lastComponentSize) {
                        if ((lastComponentSize || lastComponentSize === 0) && lastComponentSize !== localLastComponentSize) {
                            localLastComponentSize = lastComponentSize;
                            element.splitPane('lastComponentSize', lastComponentSize);
                        }
                    });
                },
                template: '<div class="split-pane" ng-transclude></div>'
            };
        })
        .directive('splitPaneComponent', function () {
            return {
                restrict: 'EA',
                replace: true,
                transclude: true,
                require: '^splitPane',
                link: function ($scope, element, attrs, paneCtrl) {
                    paneCtrl.addComponent({ width: attrs.width, height: attrs.height });
                },
                template: '<div class="split-pane-component" ng-transclude></div>'
            };
        })
        .directive('splitPaneDivider', function () {
            return {
                restrict: 'EA',
                replace: true,
                transclude: true,
                require: '^splitPane',
                link: function ($scope, element, attrs, paneCtrl) {
                    paneCtrl.addDivider({ width: attrs.width, height: attrs.height });
                },
                template: '<div class="split-pane-divider" ng-transclude></div>'
            };
        });
});
