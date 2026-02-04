define(["angular", "MagicSDK"], function (angular, MF) {
    angular.module("magicTree", [])
        .directive("magicTree",
		function () {
			var timestamp = Date.now();
				return {
					restrict: "E",
					scope: {},
					bindToController: {
						name: "@",
						treeOptions: "="
					},
					template: '<div  class="magic-tree" id="tree_' + timestamp + '"></div>',
					controllerAs: "c",
					controller: [
						function () {
							var self = this;
							MF.kendo.appendTreeToDom($.extend({
								name: self.name,
								treecontainer: "#tree_" + timestamp,
							}, self.treeOptions));
                        }
                    ]
                }
            });
});