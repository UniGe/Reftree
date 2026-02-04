(function () {
    var dependencies = ["angular", "MagicSDK", window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Directives/asset-map.js", "angular-kendo"],
        angular,
        controllerName = "TicketsMobile";

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
                   var self = this;
                   self.asset = (self.asset = window.location.search.substring(1).match(/AS_ASSET_ID=([\d]+)/)) ? [{ AS_ASSET_ID: parseInt(self.asset[1]) }] : [];
                   self.view = self.asset.length || !isMobile() ? "grid" : "map";
                   self.shallLoadMap = self.view == "map";
                   self.gridObject = {};

                   $scope.$watch("tm.asset", function (value) {
                       if (value && value.length && !value[0].AS_ASSET_DESCRIZIONE) {
                           self.getAssetByID(value[0].AS_ASSET_ID)
                           .then(function (res) {
                               if (res.length)
                                   self.asset[0] = res[0];
                           });
                       }
                   });

                   self.getAssetByID = function (AS_ASSET_ID) {                       
                       var deferred = $.Deferred(); //#mfapireplaced
                       $.ajax({
                           type: "POST",
                           url: "/api/AS_V_ASSET_assetgroups/GetAsAsset",
                           data: JSON.stringify({ AS_ASSET_ID: "" + AS_ASSET_ID }),
                           contentType: "application/json; charset=utf-8",
                           dataType: "json",
                           error: function (err) {
                               console.log("ERROR", err);
                               deferred.reject(err);
                           },
                       }).then(function (res) {
                           var data = res.Data[0].Table;
                           deferred.resolve(data);
                       });
                       return deferred.promise();
                   };

                   self.setGridFilter = function () {
                       if (self.gridInstance && self.asset && self.asset.length) {
                           var filter = {
                               logic: "or",
                               type: "user",
                               filters: []
                           };
                           $.each(self.asset, function (k, v) {
                               filter.filters.push({
                                   field: "TK_TICKET_AS_ASSET_ID",
                                   operator: "eq",
                                   value: v.AS_ASSET_ID
                               });
                           });
                           self.gridInstance.dataSource.filter(combineDataSourceFilters(self.gridInstance.dataSource.filter(), filter));
                       }
                   };

                   MF.kendo.getGridObject({ gridName: "MOB_TK_V_LIST_TICKET" })
                       .then(function (gridObject) {
                           self.gridObject = gridObject;
                           //self.gridObject.columns.unshift({
                           //    template: '<input kendo-drop-down-list k-options="tm.dropdownOptions" style="max-width: 50px;" />',
                           //    width: 65
                           //});
                           $timeout(function () {
                               if (!self.gridInstance)
                                   return;
                               self.gridInstance.setOptions(self.gridObject);
                               self.setGridFilter();
                           });
                       });

                   self.goOffline = function () {
                       makeGridOfflineAvailable(self.gridInstance, $("#templatecontainer").html());
                   };

                   self.showMap = function () {
                       self.shallLoadMap = true;
                       self.view = "map";
                   };

                   self.getObjectText = function (key) {
                       return getObjectText(key);
                   };

                   self.setAsset = function (assets) {
                       $timeout(function () {
                           self.view = "grid";
                           self.asset = assets;
                           self.setGridFilter();
                       });
                   };

                   self.dropdownOptions = {
                       dataSource: [
                            {
                                label: getObjectText("showOnMap"),
                                value: "showOnMap"
                            },
                            {
                                label: getObjectText("showAssets"),
                                value: "showAssets"
                            },
                            {
                                label: getObjectText("showDocuments"),
                                value: "showDocuments"
                            }
                       ],
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
                                   document = self.gridInstance.dataSource.getByUid(uid);
                                if (value == "showOnMap") {
                                    self.getAssetByID(document.TK_TICKET_AS_ASSET_ID)
                                        .then(function (res) {
                                            if(!res.length)
                                                return;
                                            $timeout(function () {
                                                self.asset = res;
                                                self.showMap();
                                            });
                                        });
                                }
                                else
                                {
                                    var guid;
                                    switch (value) {
                                        case "showAssets":
                                            guid = "869AE66A-940A-491A-8338-594DC79910DE";
                                            break;
                                        case "showDocuments":
                                            guid = "5A9D2774-7F39-421B-A4F0-D7BF45C9DB0E";
                                            break;
                                    }
                                    redirectToFunction(guid, "?AS_ASSET_ID=" + document.TK_TICKET_AS_ASSET_ID);
                                }
                           }
                       }
                   };
               }
           ]);
    }

})();