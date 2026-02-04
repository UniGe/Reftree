(function () {
    var dependencies = ["angular", "MagicSDK", window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Directives/asset-map.js", "angular-kendo"],
        angular,
        controllerName = "DocumentiMobile";

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
                   self.asset = (self.asset = window.location.search.substring(1).match(/AS_ASSET_ID=([\d]+)/)) ? [{ AS_ASSET_ID: parseInt(self.asset[1])}] : [];
                   self.view = self.asset.length || !isMobile() ? "grid" : "map";
                   self.shallLoadMap = self.view == "map";
                   self.gridObject = {};

                   $scope.$watch("dm.asset", function (value) {
                       if (value && value.length && !value[0].AS_ASSET_DESCRIZIONE) {
                           $.ajax({ //#mfapireplaced
                               type: "POST",
                               url: "/api/AS_V_ASSET_assetgroups/GetAsAsset",
                               data: JSON.stringify({ AS_ASSET_ID: "" + self.asset[0].AS_ASSET_ID }),
                               contentType: "application/json; charset=utf-8",
                               dataType: "json",
                               error: function (err) { console.log("ERROR while getting AS_ASSET", err) },
                           }).then(function (res) {
                               var assets = res.Data[0].Table;
                               if (assets.length)
                                   self.asset[0] = assets[0];
                           });
                       }
                   });

                   self.setAsset = function (asset) {
                       $timeout(function () {
                           self.view = "grid";
                           self.asset = asset;
                           self.setGridFilter();
                       });
                   };

                   MF.kendo.getGridObject({ gridName: "MOB_DO_V_DOCUME_MAIN" })
                       .then(function (gridObject) {
                           self.gridObject = gridObject;
                           //self.gridObject.columns.unshift({
                           //    template: '<input kendo-drop-down-list k-options="dm.dropdownOptions" style="max-width: 50px;" />',
                           //    width: 65
                           //});
                           $timeout(function () {
                               self.gridInstance.setOptions(self.gridObject);
                               self.setGridFilter();
                           });
                       });

                   //TODO: set filter correcltly
                   self.setGridFilter = function () {
                       if (self.gridInstance && self.asset && self.asset.length) {
                           var asset_ids = [];
                           self.asset.forEach(function (v) { asset_ids.push("" + v.AS_ASSET_ID) })
                           $.ajax({     //#mfapireplaced
                               type: "POST",
                               url: "/api/MF_API/GetDocumentRelations",
                               data: JSON.stringify({ DO_DOCREL_DO_DOCUME_ID: "", DO_DOCREL_ID_RECORD: asset_ids }),
                               contentType: "application/json; charset=utf-8",
                               dataType: "json",
                               error: function (err) { console.log("ERROR while getting DocumentRelations", err) },
                           })
                           .then(function (res) {
                               var doc_relations = res.Data[0].Table;
                               var filter = {
                                   logic: "or",
                                   type: "user",
                                   filters: []
                               };
                               if (doc_relations && doc_relations.length) {
                                   $.each(doc_relations, function (k, v) {
                                       filter.filters.push({
                                           field: "DO_DOCUME_ID",
                                           operator: "eq",
                                           value: v.DO_DOCREL_DO_DOCUME_ID,
                                       });
                                   });
                               }
                               else {
                                   filter.filters.push({
                                       field: "DO_DOCUME_ID",
                                       operator: "eq",
                                       value: 0,
                                   });
                               }
                               self.gridInstance.dataSource.filter(combineDataSourceFilters(self.gridInstance.dataSource.filter(), filter));
                           });
                       }
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
                                label: getObjectText("showTickets"),
                                value: "showTickets"
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

                               $.ajax({     //#mfapireplaced
                                   type: "POST",
                                   url: "/api/MF_API/GetDocumentRelations",
                                   data: JSON.stringify({ DO_DOCREL_DO_DOCUME_ID: "" + document.DO_DOCUME_ID, DO_DOCREL_ID_RECORD: [] }),
                                   contentType: "application/json; charset=utf-8",
                                   dataType: "json",
                                   error: function (err) { console.log("ERROR while getting Document_Relations", err) },
                               }).then(function (res) {
                                   var doc_relations = res.Data[0].Table;
                                   if (!doc_relations.length)
                                       return;
                                   if (value == "showOnMap") {
                                       $.ajax({ //#mfapireplaced
                                           type: "POST",
                                           url: "/api/AS_V_ASSET_assetgroups/GetAsAsset",
                                           data: JSON.stringify({ AS_ASSET_ID: "" + res[0].DO_DOCREL_ID_RECORD }),
                                           contentType: "application/json; charset=utf-8",
                                           dataType: "json",
                                           error: function (err) { console.log("ERROR while getting AS_ASSET", err) },
                                       }).then(function (res) {
                                           var assets = res.Data[0].Table;                                           
                                           if (!assets.length)
                                               return;
                                           self.asset = assets;
                                           self.showMap();
                                           $timeout();
                                       });
                                   } else {
                                       var guid;
                                       switch (value) {
                                           case "showTickets":
                                               guid = "E852F0B3-C191-469D-B909-3887F78EB867";
                                               break;
                                           case "showAssets":
                                               guid = "869AE66A-940A-491A-8338-594DC79910DE";
                                               break;
                                       }
                                       redirectToFunction(guid, "?AS_ASSET_ID=" + doc_relations[0].DO_DOCREL_ID_RECORD);
                                   }
                               });
                           }
                       }
                   };

                   self.showMap = function () {
                       self.shallLoadMap = true;
                       self.view = "map";
                   };

                   self.getObjectText = function (key) {
                       return getObjectText(key);
                   };
               }
           ]);
    }

})();