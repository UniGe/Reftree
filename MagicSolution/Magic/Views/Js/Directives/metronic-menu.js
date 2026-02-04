define(['angular'], function (angular) {
	angular.module('metronicMenu', [])
		.directive('metronicMenu', ['$compile','$location',function ($compile,$location) {
			return {
				replace: false,
				restrict: "E",
				scope: {
				},
				bindToController: {
					menu: "=",
					ready: "=",
					element: "="
				},
				controllerAs: "mm",
				templateUrl: "Magic/Views/Templates/Directives/metronic-menu.html",
				compile: function (el) {
					var contents = el.contents().remove();
					var compiled;
					return function (scope, el) {
						if (!compiled)
							compiled = $compile(contents);

						compiled(scope, function (clone) {
							el.append(clone);
						});
					};
				},
				controller: ['$scope','$window',
					function ($scope, $window) {
						var self = this;
						//self.collapseMenu = function () {
						//	self.element.find(".m-menu__item--open").removeClass("m-menu__item--open");
						//};
						//self.openParentsOfActive= function () {
						//	self.element.find(".m-menu__item--active").parents("li").addClass("m-menu__item--open");
						//}
						//self.deactivateAll = function () {
						//	self.element.find(".m-menu__item--active").removeClass("m-menu__item--active") ;
						//};
						//$scope.$watch(function () {
						//	return self.element.find('li.m-menu__item--active').length;
						//}, function (newVal, oldVal) {
						//	if (newVal !== oldVal) {
						//		self.currentActive = false;
						//	}
						//});
						self.addLiClass = function (item) {
							var liclass = "m-menu__item m-menu__item--submenu m-menu__item--expanded";
							if (!item.Children.length > 0)
								liclass = "m-menu__item";
							if (item.isactive)
								liclass = liclass + " m-menu__item--active"
							return liclass + " menu-" + item.ITEM_ID + "-" + item.ITEM_PATH.split("|")[0] + " menuId-" + item.ITEM_ID;
						}
						self.buildHref = function (item) {
							var moduleId = item.ITEM_PATH.split("|")[0];
							return ((item.ITEM_HREF && item.ITEM_HREF != "javascript:void(0)")
								? item.ITEM_HREF + "?menuId=" + item.ITEM_ID
								: "/app#/function/" + item.ITEM_ID + "-" + moduleId + "-" + encodeURI(item.ITEM_LABEL)).replace(/%20/g, "-");
						}
						self.getIconClass = function (item) {
							if (item.ITEM_ICON)
								return 'm-menu__link-icon ' + item.ITEM_ICON;
							return 'm-menu__link-bullet m-menu__link-bullet--dot';
						}
						self.activateMenu = function (item) {
						    //if i'm there already do nothing
                            //nf20180523: disabled, in case of BIM projects (where $location.search() is not empty by design!)
							//if ("/app#" + $location.path() == self.buildHref(item))
							//	return;
							var href = self.buildHref(item);
							//self.deactivateAll();
							if (self.currentActive)
								self.currentActive.isactive = false;
							self.currentActive = item;
							item.isactive = true;
							$window.location = href;
						}
						
						
					}]
			}
		}]);
});