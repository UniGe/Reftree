define(["angular"], function (angular) {
    angular
        .module("magicSlider", [])
        .directive('magicSlider', function () {
            return {
                restrict: 'EA',
                scope: {
                    images: '=images',
                    group: '=group'
                },
                templateUrl: "/Magic/Views/Templates/Directives/magic-image-slider.html",
                controller: ["$scope",
                "$timeout",
                "config",
                    function ($scope) {
                        $scope.group = $scope.group || 1;
                        $scope.currentIndex = 0;
                        $scope.direction = 'left';

                        var init = function () {
                            var images = [];
                            var source = []; 
                            angular.copy($scope.images, source);
                            var gridstackContainer = $('.slides').closest('.grid-stack-item');
                            var newImageHeight = gridstackContainer.height();

                            for (var i = 0; i < source.length; i + $scope.group) {
                                if (source[i]) {
                                    images.push(source.splice(i, $scope.group));                                    
                                }
                            }
                            $scope.setCurrent(0);

                            images.forEach(function (imageArray) {
                                imageArray.forEach(function (image) {
                                    image.height = newImageHeight;
                                });
                            })

                            $scope.slides = images;
                        };
                        $scope.setCurrentPagination = function() {
                            $('.dot').each(function(key, dot) {
                                $(dot).removeClass('active');
                            });                            
                            $($('.dot')[$scope.currentIndex]).addClass('active');
                        }

                        $scope.$watch('group', init);

                        $scope.setCurrent = function (index) {                             
                            $scope.direction = (index > $scope.currentIndex) ? 'left' : 'right';
                            $scope.currentIndex = index;
                            $scope.setCurrentPagination();
                        };

                        $scope.isCurrent = function (index) {
                            return $scope.currentIndex === index;
                        };

                        $scope.next = function () {
                            $scope.direction = 'left';
                            $scope.currentIndex = $scope.currentIndex < $scope.slides.length - 1 ? ++$scope.currentIndex : 0;
                            $scope.setCurrentPagination();
                        };

                        $scope.prev = function () {
                            $scope.direction = 'right';
                            $scope.currentIndex = $scope.currentIndex > 0 ? --$scope.currentIndex : $scope.slides.length - 1;
                            $scope.setCurrentPagination();
                        };
                    }
                ]
            };
        })
});