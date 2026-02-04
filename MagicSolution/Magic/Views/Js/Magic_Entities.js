function generatestandardpage(e) {
	var grid = $("#grid").data("kendoGrid");
	var ds = grid.dataSource.data();
	var i;
	for (i = 0; i < ds.length; i++) {
		if (ds[i].Checked == true) {
			var data = { gridname: ds[i].GRID_NAME, name: ds[i].TABLE_NAME, maintable: ds[i].MAIN_TABLE, pk: ds[i].pagingcolumn, generatefunction: ds[i].GenerateFunction, schema: ds[i].TABLE_SCHEMA };

			$.ajax({
				type: "POST",
				async: true,
				url: "/api/ObjectGenerator/generateStandardPageFromTable",
				data: JSON.stringify(data),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function (result) {
					kendoConsole.log(new Date().toLocaleString() + ":: Grid, detail and edit templates have been generated", false);
				},
				error: function (request, status, error) {
					kendoConsole.log(new Date().toLocaleString() + ":: Error in Grid, detail and edit templates generation, read genlog.txt for further details", true);
				}
			});
		}
	}
}


function generateserver(e) {
    $.ajax({
        type: "POST",
        async: false,
        url: manageAsyncCallsUrl(false,"/api/ObjectGenerator/emptyControllerDir"),
        data: '{}',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log(new Date().toLocaleString() + "::" + result, false);
        }

    });
    var grid = $("#grid").data("kendoGrid");
    var ds = grid.dataSource.data();        
    var i;
    for (i = 0; i < ds.length; i++) {
        if (ds[i].Checked == true) {
            var data = { entityname: ds[i].TABLE_NAME, pagingcol: ds[i].pagingcolumn, visibilitycol: ds[i].visibilityfield, pagingcoltype: ds[i].DATA_TYPE, dbschema: ds[i].TABLE_SCHEMA };
            $.ajax({
                type: "POST",
                async: true,                
                url: "/api/ObjectGenerator/generateController",
                data : JSON.stringify(data),           
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    kendoConsole.log(new Date().toLocaleString() + "::" + result, false);
                },
                error: function (e) {
                    console.log(e);
                    kendoConsole.log(new Date().toLocaleString() + "::" + JSON.parse(e.responseText).ExceptionMessage, true);
                }
            });

            var data1 = { name: ds[i].TABLE_NAME };

            $.ajax({
                type: "POST",
                async: true,
                url: "/api/ObjectGenerator/generateModel",
                data: JSON.stringify(data1),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    kendoConsole.log(new Date().toLocaleString() + "::" + result, false);
                }
            });
        }

    }

}

function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex]
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

function loadscript() {
    var toolbar = [ { text: getObjectText("buttongen"), className: "buttongen" }, { text: getObjectText("buttongenstdfnctn"), className: "buttongenstdfnctn" }];
    var gridobj = getrootgrid("EntityList");
    gridobj.columns.push({ field: "GRID_NAME" ,width:"120px"});

    arraymove(gridobj.columns, 8, 0);
    arraymove(gridobj.columns, 9, 1);
    arraymove(gridobj.columns, 10, 2);

    gridobj.toolbar = toolbar;
    //gridobj.pageable = false;
    gridobj.filterable = defaultfiltersettings;
    gridobj.sortable = true;
    gridobj.dataSource.serverSorting = false;
    gridobj.dataSource.serverFiltering = false;
    gridobj.groupable = false;    
    renderGrid(gridobj, null);
    $(".buttongen").click(function (e) { generateserver(e); });
    $(".buttongenstdfnctn").click(function (e) { generatestandardpage(e); });

    
}