define(["angular", "MagicSDK", "angular-magic-grid","angular-kendo"], function (angular,MF) {
    return angular
        .module("GridPortfolioSelection", ["magicGrid","kendo.directives" ])
        .controller("GridPortfolioSelectionController", [
            "config",
            "$timeout",
            "$scope",
            function (config,$timeout, $scope) {
                var self = this;
                config.MF.api.get({
					storedProcedureName: "dbo.Magic_Mmb_GetLoggedUserExtensions"
                })
                    .then(function (res) {
                        if (res.length) {
                            self.currentDefaultUserGroupID = res[0].DefaultUserGroupVisibility_ID;
                        if (self.currentDefaultUserGroupID == window.UserGroupVisibilityID)
                        {
                            self.is_default_usergroup_visibility = true;
                            $timeout();
                        }
                    }
                    }, function (res) {
                        //handle error or not
                    });

                self.currentgroup = $("span.spanBusinessUnit").text();
         
				self.labels = {
					setAsDefaultUserGroupVisibility: getObjectText("setAsDefaultUserGroupVisibility"),
					changeBusinessUnit: getObjectText("changebusinessunit"),
					wndtitle: getObjectText(window.AppAreasOverrideLabelKey),
					confirm: getObjectText("Applymodifcation")
				};
                self.portfolioSelectionGrid = "vi_change_portfolio";

				self.applyPortfolioChange = function (e) {
					var data = {
						id: self.selectedId,
						isDefault: self.is_default_usergroup_visibility
					};
					if (self.userGroupLogo)
						data.userGroupLogo = self.userGroupLogo;
					doModal(true);
					$.ajax({
						type: "POST",
						url: "/api/Visibility/setSessionUserVisibilityGroup",
						data: JSON.stringify(data),
						contentType: "application/json; charset=utf-8",
						dataType: "json"
					}).then(function () {
						window.UserGroupDescription = self.currentgroup;
						if (typeof onChangePTFCustomization == "function")
							onChangePTFCustomization(e, function () { location.reload(true); });
						else
							location.reload(true);
					});
				};
				self.onGridSelect = function (e) {
					self.is_default_usergroup_visibility = false;
					var jSelectedGroup = e.sender.select();
					var rowdata = e.sender.dataItem(jSelectedGroup);
					self.selectedId = rowdata.AREVIS_ID;
					self.is_default_usergroup_visibility = rowdata.isDefault;
					self.currentgroup = rowdata.US_AREVIS_DESCRIPTION;
					if ("userGroupLogo" in rowdata)
						self.userGroupLogo = rowdata.userGroupLogo;
					self.changed = true;
					$timeout();
				};
				self.onDataBound = function (e) {
					self.portfolioSelectorWnd.center();
				};
            }
        ]);
});