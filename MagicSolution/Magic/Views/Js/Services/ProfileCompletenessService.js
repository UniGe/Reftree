define(['angular', 'angular-count-to'], function (angluar) {
    var app = angular
    .module('ProfileCompleteness', ['countTo'])
    .service('ProfileCompletenessService', ['$http', '$timeout', function ($http, $timeout) {
        var self = this;

        self.update = function () {
            return $http.post("/api/OpenData/GetDataForNotifications/")
                .then(function (res) {
                    self.completeness = res.data[0];
                    self.numMandanti = res.data[1];
                    self.numProdotti = res.data[2];
                    self.brokerConnected = res.data[3];
                    self.opportunities = res.data[4];
                    self.fakedashboard = res.data[5];
                }, function () {
                    kendoConsole.log("Error during OpenData/GetDataForNotifications load");
                });
        };

        self.translate = function (text) {
            return getObjectText(text);
        }

        self.update();
    }]);
    return app;
});