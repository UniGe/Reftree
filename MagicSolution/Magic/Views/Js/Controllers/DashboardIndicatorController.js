define(['angular', 'MagicSDK','angular-count-to'], function (angular,MF) {
    var app = angular
    .module('DashboardIndicator', ['countTo'])
    .controller('DashboardIndicatorController', ['$timeout', 'config', '$scope', function ($timeout, config, $scope) {
        var that = this,
            fromDate = new Date(),
            toDate = fromDate;
		that.config = config;
		that.MF = MF;
		that.hasSubValues = false;
		that.subValues = [];
        that.value = that.percentValue = 0;
        that.lang = {
            viewMore: getObjectText('viewMore'),
            noLink:getObjectText('noLink')
        };
        

        that.setValues = function (values, from, to) {
            that.value = values.value;
			that.percentValue = values.percentValue || 0;

            if (!$scope.$$phase)
                $scope.$apply();

            fromDate = from;
            toDate = to;

            config.dateFrom = from.toISOString().slice(0, 10).replace(/-/g, "");
            config.dateTo = to.toISOString().slice(0, 10).replace(/-/g, "");
            that.getSubvalues()
        };

		that.refresh = function (event) {
		    var data = {
                indicators: {},
                indicatorStored: config.objectLoadSP
            };
            data.indicators[config.indicatorId] = config.deferred;
			var currentTab = $(event.currentTarget).closest("[id^=dashboard-tab-].tab-pane");
			getIndicatorData(data, fromDate, toDate, currentTab);
        };
        that.getSubvalues = function () {
            if (config.subValuesLoadSp) {
                that.MF.api.get({ storedProcedureName: config.subValuesLoadSp, data: config }).then(function (data) {
                    if (!data.length)
                        return;
                    that.subValues = data[0];
                    that.hasSubValues = true;
                    $timeout();
                });
            }
        };
        that.dshb_isCustomizable = function () {
            if (typeof dshb_isCustomizable != "undefined") {
                return dshb_isCustomizable(); //dashboard-v2.js
            }
        };
		that.more = function () {
			//check if a gridName is specified inside the filter in order to override the default grid from the stored..
			try {
				var filterObj = JSON.parse(config.functionFilter);
				config.gridName = filterObj.gridName ? filterObj.gridName : config.gridName;
				config.functionFilter = filterObj.filter ? filterObj.filter : config.functionFilter;
			}
			catch (ex) {
				console.log(ex);
			}
			redirectWithFilter(config.functionGUID, config.gridName, config.functionID, config.functionFilter);
		};

        that.onload = function () {
            config.deferred.resolve(that);
        };
        that.getSubvalues();

    }]);
    return app;
});