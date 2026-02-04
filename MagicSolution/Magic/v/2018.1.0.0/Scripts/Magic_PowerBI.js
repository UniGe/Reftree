(function () {
	var extension = {};

	extension.workSpaceDS = {
		transport: {
			read: {
				url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
				dataType: "json",
				contentType: "application/json",
				data: { storedprocedure: "dbo.usp_getPowerBI_Workspaces_drop" },
				type: "POST"
			},
			parameterMap: function (options, operation) {
				return kendo.stringify(options);
			}
		},
		schema: {
			parse: function (data) {
				extension.workspaceId = data[0].drows[0].Table[0].ID;
				return data[0].drows.length ? data[0].drows[0].Table : [];
			}
		}
	};

	extension.reportDS = {
		transport: {
			read: {
				url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
				dataType: "json",
				contentType: "application/json",
				data: { storedprocedure: "dbo.usp_getPowerBI_Reports_drop" },
				type: "POST"
			},
			parameterMap: function (options, operation) {
				return kendo.stringify(options);
			}
		},
		schema: {
			parse: function (data) {
				if (!extension.reportId && data[0].drows.length) {
					extension.reportId = data[0].drows[0].Table[0].ID;
				}
				return data[0].drows.length ? data[0].drows[0].Table : [];
			}
		}
	};


	extension.onReportSelected = function () {
		extension.reportId = this.reportDrop.value()
	}

	extension.onWorkspaceSelected = function () {
		extension.workspaceId = this.workspaceDropDown.value();
		this.reportDrop.dataSource.read({ storedprocedure: "dbo.usp_getPowerBI_Reports_drop", Workspace_ID: this.workspaceDropDown.value() })
	}

	$(document).on('click', '#loadReportInNewTab', (e) => {
		window.open(window.location.protocol + "//" + window.location.host + "/app#/powerbi/workspace/" + extension.workspaceId + "/report/" + extension.reportId, "_blank");
	});

	$(document).on('click', '#loadReport', (e) => {
		var url = "/api/PowerBi/GetEmbedLink";
		var data = {
			workspace_ID: extension.workspaceId,
			report_ID: extension.reportId,
		};

		$.ajax({
			type: "POST",
			url: url,
			data: JSON.stringify(data),
			contentType: "application/json; charset=utf-8",
			success: function (result) {
				$($('#powerBiControls').children()[2]).height($($('#powerBiControls').children()[0]).height()); //same height for id-selectors and load-button

				var powerBiContainerWidth = $('.content').width();
				var powerBiContainerHeight = parseInt(window.innerHeight - $('.header').height() - $('.breadcrumb').height() - $('.page-title').height());
				powerBiContainerHeight -= 100; //padding
				var powerBiFrameHeight = powerBiContainerHeight - $('#powerBiControls').height();
				if (typeof powerBiContainerHeight == 'number') {
					$('#powerBiContainer').width(powerBiContainerWidth);
					$('#powerBiContainer').height(powerBiContainerHeight);
				}

				var response = JSON.parse(result);
				$('#powerBiFrame').css('width', powerBiContainerWidth);
				$('#powerBiFrame').css('height', powerBiFrameHeight)
				$('#powerBiFrame').removeAttr('hidden');
				$('#powerBiFrame').attr('src', response.url);
			},
			error: function (message) {
				console.log("errrrr", message);
			}
		});
	});

	define([], function () {
		return extension;
	});

})()