(function () {
    var dependencies = ["angular", "MagicSDK", window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Directives/asset-map.js", "angular-kendo"];
    var angular,
    controllerName = "AssetsMobile";

    define(dependencies, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        if (googleMapsDoRefreshIfNeeded()) //refresh because of googleMap infoWindow issue
            return;
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName, true))[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular, MF) {
        angular
           .module(controllerName, ["assetMap", "kendo.directives"])
           .controller(controllerName + "Controller", [
               '$timeout',
               '$scope',
               function ($timeout, $scope) {
                   var self = this,
                       assetIdMatch = window.location.search.replace("?", "").match(/AS_ASSET_ID=([\d,]+)/);
                   self.view = "grid";
                   self.gridObject = {};
                   self.asset = null,
                   self.mapLoaded = isMobile();
                   if (assetIdMatch)
                       self.mapLoaded = false;
                   self.showGrid = !self.mapLoaded;
                   self.dropdownOptions = {
                       dataSource: [{
                           label: getObjectText("showOnMap"),
                           value: "showOnMap"
                       }, {
                           label: getObjectText("showTickets"),
                           value: "showTickets"
                       }, {
                           label: getObjectText("showDocuments"),
                           value: "showDocuments"
                       }],
                       dataTextField: "label",
                       dataValueField: "value",
                       optionLabel: {
                           label: '',
                           value: ''
                       },
                       optionLabelTemplate: '<span class="fa fa-sign-out"></span>',
                       open: function (e) {
                           e.sender.list.width("auto");
                       },
                       change: function (e) {
                           var value = this.value();
                           if (value) {
                               var uid = e.sender.wrapper.closest('tr[data-uid]').data("uid"),
                                   asset = self.gridInstance.dataSource.getByUid(uid);
                               if (value == "showOnMap") {
                                   self.asset = [asset];
                                   self.showGrid = false;
                                   self.mapLoaded = true;
                                   $timeout();
                               } else {
                                   var guid;
                                   switch (value) {
                                       case "showTickets":
                                           guid = "E852F0B3-C191-469D-B909-3887F78EB867";
                                           break;
                                       case "showDocuments":
                                           guid = "5A9D2774-7F39-421B-A4F0-D7BF45C9DB0E";
                                           break;
                                   }
                                   redirectToFunction(guid, "?AS_ASSET_ID=" + asset.AS_ASSET_ID);
                               }
                           }
                       }
                   };

                   self.onselectAsset = function (assets, event) {
                       self.setAssetFilter(assets, event);
                   };

                   self.getObjectText = function (a) {
                       return getObjectText(a);
                   };

                   var clonedTooltip;
                   self.setAssetFilter = function (assets, event) {
                       var assets = assets || self.asset;
                       if (event == "select")
                           self.showGrid = true;
                       if (self.gridInstance) {
                           if (assets && assets.length) {
                               if (event == "actionClicked") {
                                   var $span = $("#asset-map-actions-button");
                                   $span.find("i").addClass("fa-spinner fa-spin");
                                   if (clonedTooltip)
                                       clonedTooltip.remove();
                                   else {
                                       $span
                                            .click(function () {
                                                clonedTooltip.toggle();
                                            });
                                   }
                                   self.gridInstance.dataSource.one("requestEnd", function () {
                                       $.each(self.gridInstance.dataSource.data(), function (k, v) {
                                           var tooltip,
                                               actions = self.gridInstance.element.find("tr[data-uid=" + v.uid + "] .glyphicon-th-list");
                                           actions.click();
                                           function copyTooltip() {
                                               actions.data("kendoTooltip").one("show", function () {
                                                   setTimeout(function () {
                                                       clonedTooltip = actions.data("kendoTooltip").content.closest(".k-animation-container").clone(true);
                                                       actions.data("kendoTooltip").hide();
                                                       clonedTooltip.find(".k-i-close").click(function () {
                                                           clonedTooltip.hide();
                                                       });
                                                       $span.parent().append(clonedTooltip.css({ "position": "absolute", "top": "6px", "left": "-185px" }));
                                                       $span.find("i").removeClass("fa-spinner fa-spin");
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
                                           return false;
                                       });
                                   });
                               }
                               var filter = {
                                   logic: "or",
                                   type: "user",
                                   filters: []
                               };
                               $.each(assets, function (k, v) {
                                   filter.filters.push({
                                       field: "AS_ASSET_ID",
                                       operator: "eq",
                                       value: v.AS_ASSET_ID
                                   });
                               });
                               self.gridInstance.dataSource.filter(combineDataSourceFilters(self.gridInstance.dataSource.filter(), filter));
                           }
                           else {
                               self.gridInstance.dataSource.filter(removeFiltersByType(self.gridInstance.dataSource.filter(), ["user"]));
                           }
                       }
                   };

                   self.showMap = function () {
                       self.mapLoaded = true
                       self.showGrid = false;
                   };

                   MF.kendo.getGridObject({ gridName: "MOB_AS_V_ASSET_L_MAIN_VERO" })
                       .then(function (gridObject) {
                           self.gridObject = gridObject;
                           //self.gridObject.columns.unshift({
                           //    template: '<input kendo-drop-down-list k-options="am.dropdownOptions" style="max-width: 50px;" />',
                           //    width: 65
                           //});
                           $timeout(function () {
                               if (self.gridInstance) {
                                   if (assetIdMatch) {
                                       self.gridObject.dataSource.filter = {
                                           filters: [],
                                           logic: "or",
                                           type: "user"
                                       };
                                       $.each([assetIdMatch[1]], function (k, v) {
                                           self.gridObject.dataSource.filter.filters.push({
                                               field: "AS_ASSET_ID",
                                               operator: "eq",
                                               value: parseInt(v)
                                           });
                                       });
                                       self.gridInstance.one("dataBound", function () {
                                           var data = self.gridInstance.dataSource.data();
                                           if (data.length)
                                               self.asset = data;
                                       });
                                   }
                                   self.gridInstance.setOptions(self.gridObject);
                               }
                           });
                       });
               }
           ]);
    }

})();