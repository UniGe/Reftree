(function () {
    var dependencies = ["angular", "MagicSDK","angular-bo-selector"],
        angular,
        MF,
        controllerName = "DocSearch";

    define(dependencies, function (a,b) {
        angular = a;
        MF = b;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#appcontainer").html(getAngularControllerRootHTMLElement(controllerName))[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular) {
        angular
            .module(controllerName, [ "boSelector"])
            .controller(controllerName + "Controller", [
                '$timeout',
                '$scope',
                function ($timeout, $scope ) {
                    var self = this;
                    self.doctypes = null;
                    self.showGrid = false;
                    self.lang = {
                        search: getObjectText("search"),
                     };
                    self.initBOSelector = function (e) {
                        console.log(e);
                    };
                    self.boChange = function (event, docsearch) {
                        docsearch.BusinessObjectDescription = event.item.Description;
                        docsearch.BusinessObjectType = event.item.Type;
                        docsearch.BusinessObject_ID = event.item.Id;
                    };
                   
                    self.searchDocuments = function () {
                        doModal(true);
                        MF.api.getDataSet({ BusinessObjectType: self.BusinessObjectType, BusinessObject_ID: self.BusinessObject_ID, textInFile: self.semanticSearchInput },
                            "dbo.Magic_SearchDocuments").then(function (res) {
                            self.doctypes = $.map(res, function (doctype) {
                                            return doctype;
                            });
                            doModal(false);
                            $timeout();
                        });
                    }
                    self.createGrid = function (businessObjectType, gridName, gridFilter)
                    {
                        var addCustomFilter = function (filter) {
                            if (filter && !filter.type)
                                filter.type = "customFilter";
                            $.each(filter.filters, function (i, v) {
                                addCustomFilter(v);
                            });
                        }

                        doModal(true);
                        Jgrid = $("#docGrid");
                        if (Jgrid.data("kendoGrid"))
                        {
                            kendo.destroy(Jgrid);
                            Jgrid.html("");
                        }
                        MF.kendo.getGridObject({ gridName: gridName }).then(function (gridObj) {
                            if (gridFilter) {
                                gridFilter = JSON.parse(gridFilter);
                                addCustomFilter(gridFilter);
                                gridObj.dataSource.filter = combineDataSourceFilters(gridObj.dataSource.filter, gridFilter);
                            }
                            self.showGrid = true;
                            MF.kendo.appendGridToDom({ kendoGridObject: gridObj, selector: "docGrid" });
                            $timeout();
                            doModal(false);
                        });
                    }

                }
            ]);
    }
})();