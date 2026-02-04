define(["angular", "angular-easy-map"], function (angular) {
    return angular
        .module("SchedulerGoogleMap", ["easyMap"])
        .controller("SchedulerGoogleMapController", [
            "config",
            "$timeout",
            "$scope",
            function (config, $timeout, $scope) {
                var self = this;
                self.scheduler = config.scheduler;
                self.markers = [];
                self.onMapReady = config.ready,
                self.taskTypeColors = {};

                $.each(self.scheduler.resources, function (k, res) {
                    if (res.field == "taskType_ID") {
                        $.each(res.dataSource.data(), function (k, v) {
                            self.taskTypeColors[v.taskTypeID] = v[res.dataColorField];
                        });
                        return false;
                    }
                });

                self.getMarkersFromScheduler = function () {
                    self.markers = $.map(self.scheduler.dataSource.data().sort(function (a, b) {
                        return a.start > b.start;
                    }), function (marker, k) {
                        if (marker.longitude && marker.latitude) {
                            if (marker.taskType_ID && (marker.taskType_ID in self.taskTypeColors)) {
                                marker.color = self.taskTypeColors[marker.taskType_ID];
                                marker.opacity = 1;
                            }

                            marker.click = function (m) {
                                return '<div style="max-width: 250px;"><a class="pull-right" href="javascript:void(0)" onclick="editSchedulerEvent(' + k + ')"><span class="fa fa-pencil"></span></a>\
                                        <small>' + kendo.toString(marker.start, marker.isAllDay ? 'd' : 'g') + (marker.isAllDay ? '' : ' - ' + kendo.toString(marker.end, "g")) + '</small>\
                                        <h3>' + marker.title + '</h3>\
                                        <p>' + marker.description + '</p>\
                                        <p><span class="fa fa-map-marker"></span>&nbsp;' + marker.address + '</p></div>';
                            }
                            marker.markerOptions = {
                                label: {
                                    text: (k + 1).toString(),
                                    color: "#fff"
                                }
                            };
                            return marker;
                        }
                    });
                    $timeout();
                };

                self.scheduler.bind("dataBound", self.getMarkersFromScheduler);
                self.getMarkersFromScheduler();
            }
        ]);
});