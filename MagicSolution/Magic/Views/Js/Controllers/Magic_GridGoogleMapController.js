define(["angular", "angular-easy-map"], function (angular) {
    return angular
        .module("GridGoogleMap", ["easyMap"])
        .controller("GridGoogleMapController", [
            "config",
            "$timeout",
            "$scope",
            function (config, $timeout, $scope) {
                var self = this;
                self.grid = config().grid;
                config().setGrid = function (grid) {
                    self.grid = grid;
                    self.getMarkersFromGrid();
                    setTimeout(function () {
                        $scope.$broadcast("gm-resize");
                    }, 1100);
                };
                self.markers = [];
                self.mapOptions = {

                };

                $scope.$watch(
                    function () { return $('#grid-map-controller').length; },
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            // code goes here
                        }
                    }
                );
                  
                self.onMapReady = function () {
                    config().ready();
				};
				self.hideMap = function (btn) {
					var $btn = $(btn.target);
                    if ($btn.closest('#grid-map-controller').length) {
                        $btn.closest('#grid-map-controller').hide(1000);
                        $btn.closest('#grid-map-controller').remove();
                        //da verifdicare se distruggere oppure no

                    }
                    if ($btn.closest('#grid-popup-map-controller').length) {
                        $btn.closest('#grid-popup-map-controller').hide(1000);
                        $btn.closest('#grid-popup-map-controller').remove();
                    }
				};
                self.setGridFilter = function (event) {
                    if (event.type == "gm-markerClick" && !config().ignoreMarkerClickTrigger) {
                        if (self.grid.dataSource.options.schema && self.grid.dataSource.options.schema.model && self.grid.dataSource.options.schema.model.id) {
                            self.grid.dataSource.filter(combineDataSourceFilters(self.grid.dataSource.filter(), { type: "user", field: self.grid.dataSource.options.schema.model.id, operator: "eq", value: event.marker.data[self.grid.dataSource.options.schema.model.id] }));
                        }
                        else {
                            throw "Cannnot apply filter to grid because no self.grid.dataSource.options.schema.model.id is defined";
                        }
                    }
                    else {
                        var ne = event.rectangle.getBounds().getNorthEast(),
                            sw = event.rectangle.getBounds().getSouthWest(),
                            filter = {
                                type: "user",
                                logic: "and",
                                filters: [
                                    { field: "longitude", operator: "lte", value: ne.lng(), type: "user" },
                                    { field: "longitude", operator: "gte", value: sw.lng(), type: "user" },
                                    { field: "latitude", operator: "lte", value: ne.lat(), type: "user" },
                                    { field: "latitude", operator: "gte", value: sw.lat(), type: "user" }
                                ]
                            };
                        //self.grid.dataSource.filter(combineDataSourceFilters(self.grid.dataSource.filter(), filter));

                        if ($('#filtersModalContainer').length > 0 && $('#filtersModalContainer').length > 0) {
                            $('#resetFilters').click();
                        }

                   

                        self.grid.dataSource.filter(filter);
                        self.grid.one("dataBound", function (e) {
                            event.getMarkersWithinRectangle(self.getMarkersFromGrid(), event.rectangle);
                            event.rectangle.setMap(null);
                            $('button[title="Smetti di tracciare"]').click();

                        });

                        
                    }
                };

                self.getMarkersFromGrid = function () {
                    var data = self.grid.dataSource.options.serverPaging ? self.grid.dataSource.data() : self.grid.dataSource.view(),
                        visibleColumns;
                    if (self.grid.columns) {
                        var thead = self.grid.element.find("thead"),
                            tColumns = thead.find("th");
                        visibleColumns = {};
                        $.each(self.grid.columns, function (k, v) {
                            if (v.field && !v.hidden)
                                visibleColumns[v.field] = {
                                    label: v.title || v.field,
                                    columnIndex: tColumns.index(thead.find("[data-field=" + v.field + "]")[0])
                                };
                        });
                    }
                    self.markers = [];
                    $timeout(function () {
                        if (!data)
                            return;
                        $.each(data, function (k, v) {
                            if (v.latitude !== null && v.longitude !== null && !isNaN(v.latitude) && !isNaN(v.longitude)) {
                                var marker = {};
                                if (visibleColumns) {
                                    var row = self.grid.element.find("tr[data-uid=" + v.uid + "]"),
                                        rowColumns = row.find("td"),
                                        actions =  row.find(".glyphicon-th-list");
                                    marker.click = function () {
                                        var content = $("<div>"),
                                            htmlContent = "";
                                        if (actions.length) {
                                            var tooltip,
                                                $span = $('<span class="fa fa-spinner fa-spin" style="cursor:pointer;"></span>');
                                            content.append($span);
                                            self.grid.dataSource.one("requestEnd", function () {
                                                setTimeout(function () {
                                                    $span.addClass("glyphicon glyphicon-th-list");
                                                    $span.removeClass("fa fa-spinner fa-spin");
                                                    $span.one("click", function () {
                                                        actions = self.grid.element.find(".glyphicon-th-list");
                                                        actions.click();
                                                        function copyTooltip() {
                                                            actions.data("kendoTooltip").one("show", function () {
                                                                setTimeout(function () {
                                                                    var clonedTooltip = actions.data("kendoTooltip").content.closest(".k-animation-container").clone(true);
                                                                    actions.data("kendoTooltip").hide();
                                                                    clonedTooltip.find(".k-i-close").click(function () {
                                                                        clonedTooltip.hide();
                                                                    });
                                                                    $span
                                                                        .click(function () {
                                                                            clonedTooltip.toggle();
                                                                        })
                                                                        .parent()
                                                                        .append(clonedTooltip.css({ "position": "absolute", "top": 0, "left": 0 }));
                                                                }, 10);
                                                            });
                                                            actions.data("kendoTooltip").show();
                                                        }
                                                        if (actions.data("kendoTooltip")) {
                                                            setTimeout(copyTooltip);
                                                        }
                                                        else {
                                                            actions.one("tooltipCreated", copyTooltip);
                                                        }
                                                    });
                                                });
                                            });
                                        }
                                        htmlContent += "<ul>";
                                        $.each(visibleColumns, function (k, vv) {
                                            var cell = rowColumns.eq(vv.columnIndex),
                                                gridTd = cell.find(".magicGridTd"),
                                                cellContent = gridTd.length ? gridTd.html() : cell.html();
                                            htmlContent += "<li><b>" + vv.label + "</b>: " + cellContent + "</li>";
                                        });
                                        htmlContent += "</ul>";
                                        return content.append(htmlContent)[0];
                                    };
                                }
                                if (v.map_marker_icon) {
                                    v.markerOptions = {
                                        icon: v.map_marker_icon
                                    };
                                }
                                else if (v.map_marker_color)
                                    marker.color = v.map_marker_color;
                                self.markers.push($.extend(marker, v));
                            }
                        });
                    });
                };

                self.getMarkersFromGrid();
            }
        ]);
});