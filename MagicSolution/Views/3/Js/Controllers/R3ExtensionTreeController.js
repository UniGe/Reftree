define(["MagicSDK"], function (MF) {

    return {
        html: function (controller) {
            var html = $.Deferred();
			html.resolve("<magic-tree ng-if='md.treeName' name='{{md.treeName}}' tree-options='md.treeOptions'></magic-tree>");
            return html.promise();
        },
        js: function (controller) {
			var js = $.Deferred();
			//var gridItemid = controller.config.data[controller.config.evt.sender.options.dataSource.schema.model.id];
            // look at controller.config.data to access row data
			MF.api.get({
				storedProcedureName: "CORE.usp_GetGridTreeName",
				data: {
					gridname: controller.config.evt.sender.element.attr("gridname"),
					rowData:controller.config.data
				}
			}).then(function (res) {

				window.showActions__ = function (e) {
					var id = $(e).closest("button").attr("id");
					var itemid = $(e).closest("button").attr("itemid")
					
					openActionsTooltip({
						requestOptions: {
							caller: res[0][0].MagicTreeName,
							id: itemid,
							gridname: controller.config.evt.sender.element.attr("gridname"),
							rowData: controller.config.data
						},
						storeProcedureName: "CORE.usp_GetTreeActions",
						accordionId: "treeViewerActionsAccordion_" + id ,
						element: "#"+id
					});
				}


				if (!$('#script_' + res[0][0].MagicTreeName).length) {
					//var nodetemplate = '<script id="script_' + res[0][0].MagicTreeName + '" type="text/kendo-ui-template"> #: item.assettoexplode#  <span class="treeButton"><a class="updateGroup k-button k-button-icontext" href="javascript:void(0)" onclick="javascript:void(0);"><span class="k-icon k-edit" /></a><a class="deleteGroup k-button k-button-icontext" href="javascript:void(0)" onclick="javascript:void(0);"><span class="k-icon k-delete" /></a></span></script>'
					var nodetemplate = '<script id="script_' + res[0][0].MagicTreeName +'"  type="text/kendo-ui-template">\
											#: item.assettoexplode#\
											<button  class="pull-right" itemid="#: item.assetid #" id="actions___tree_#: item.nodeparentid + "_" + item.assetid #" style = "float:left;margin-left:1px;" title = "Show actions" type = "button" class="btn btn-primary" onclick="showActions__(this)">\
														<i class="fa fa-list" aria-hidden="true" ></i>\
											</button>\
										</script>'
					//append the template to the templatecontainer
					$("#templatecontainer").append(nodetemplate);
				}
				js.resolve({
						treeName: res[0][0].MagicTreeName,
					treeOptions: {
						altNodeTemplate: 'script_' + res[0][0].MagicTreeName,
						data: controller.config.data
					}
				});
				controller.$timeout();
			});
            return js.promise();
        }

    }
});