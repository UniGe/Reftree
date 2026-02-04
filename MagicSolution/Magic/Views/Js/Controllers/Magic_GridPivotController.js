define(["angular", "angular-magic-pivot"], function (angular) {
    return angular
        .module("GridPivot", ["magicPivot"])
		.controller("GridPivotController", [
            "config",
            "$scope",
            function (config,  $scope) {
                var self = this;
				self.pivotCodes = config.magicPivotCodes.split(',');
				self.pivotFilter = {};
				self.outerGrid = {};//Filter (without pivot filter) and selected rows from grid
				self.pivotOptions = []; 
				var selected = [];
				try {
					var selected = config.grid.select();
				}
				catch (ex) {
					console.log(ex);
				}
				var data = [];
				$.each(selected, function (i, v) {
					data.push(config.grid.dataItem(v).toJSON());
				});
				$.each(self.pivotCodes, function (i, v) {
					self.outerGrid[v] = {
						filter: removeFiltersByType($.extend({}, config.grid.dataSource.filter()), ["pivot"]),
						selected: data
					}
					self.pivotOptions[i] = config.options;
				});

				self.close = function () {
					config.close();
				}
            }
        ]);
});