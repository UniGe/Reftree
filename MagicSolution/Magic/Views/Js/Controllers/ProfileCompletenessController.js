define(['angular', window.includesVersion + '/Magic/Views/Js/Services/ProfileCompletenessService.js'], function (angular, app) {
    app
    .controller('ProfileCompletenessController', ['$http', '$scope', 'ProfileCompletenessService', '$timeout', function ($http, $scope, pcs, $timeout) {
        var self = this;
        var count = $timeout(function () { count = null; }, 1000);
        self.showCompleteness = true;

        self.remove = function () {
            self.showCompleteness = false;
        };

        self.progressBarCompleteness = function () {
            if (count === null)
                return self.data.getCompleteness();
            return 0;
        };

        self.data = pcs;

        self.completeness = pcs.completeness;

    }])
});