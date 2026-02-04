define(["angular", "MagicSDK", "angular-grid-form-legacy"], function (angular, MF) {
    return angular
        .module("gridForm")
        .controller("GridPopupChildGridsFormController", [
            "config",
            "$timeout",
            "$scope",
            function (config, $timeout, $scope) {
                var self = this;
                self.definition = [];
                self.formData = {};
                self.createGrids = false;
                self.parentGridRowDataInEdit = config.parentGridRowDataInEdit;
                self.parentGridInstance = config.parentGridInstance;

                MF.api
                    .getDataSet(
                        //table: "dbo.v_Magic_Grid_NavigationTabs",
                        { guids: [config.gridDefinitions.map(g => g)] },
                        "dbo.Magic_GetGridNavTabsAndLabels",
                        true
                    )
                    .then(function (res) {
                        var res1 = res[0];
                        var res2 = res[1];
                        //D.T: fix labels logic 21022018
                        //var label = (res2 && res2.length && res2[0].MagicTemplateGroupLabel) ? res2[0].MagicTemplateGroupLabel : null;
                        let orderFn = function (tab1, tab2) {
                            if (tab1.OrdinalPosition > tab2.OrdinalPosition)
                                return 1;
                            if (tab1.OrdinalPosition < tab2.OrdinalPosition)
                                return -1;
                            return 0;
                        };
                        if (res1 && res1.length)
                            res1 = res1.sort(orderFn);

                        var promise = false;
                        if (window.getStandard_GetTabRestrictions) {
                            promise = window.getStandard_GetTabRestrictions({
                                gridname: config.parentGridInstance.options.gridcode,
                                data: config.parentGridRowDataInEdit,
                            });
                        }

                        $.when(promise).then(function (tabFilters) {

                            $.each(res1, function (k, v) {

                                var labels = res2.filter(function (item) {
                                    return item.MagicTemplateGroup_ID == v.MagicTemplateGroupID
                                });
                                var title = (labels && labels.length) ? labels[0].MagicTemplateGroupLabel : v.MagicTemplateGroupLabel;

                                if (tabFilters && tabFilters.items.find(f => (f.gridname === v.BindedGridName || f.gridname === title) && !f.show)) {
                                    return;
                                }

                                self.definition.push({
                                    title,
                                    grids: [
                                        $.extend(
                                            v,
                                            {
                                                id: null,//v.MagicTemplateGroupID
                                                gridName: v.BindedGridName
                                            }
                                        )
                                    ]
                                });
                            });
                            if (res2?.length) {
                                $.each(self.definition, function (k, v) {
                                    $.each(res2, function (kk, vv) {
                                        if (v.grids[0].id == vv.TemplateGroupLabelID) {
                                            v.title = vv.MagicTemplateGroupLabel;
                                            res2.splice(kk, 1);
                                        }
                                    });
                                    if (!res2.length)
                                        return false;
                                });
                            }
                            self.createGrids = true;
                            $timeout();
                        });
                    });

                $scope.$watch("gpcgf.formData", function (newValue) {
                    config.childGridsData = newValue;
                }, true);
            }
        ]);
});