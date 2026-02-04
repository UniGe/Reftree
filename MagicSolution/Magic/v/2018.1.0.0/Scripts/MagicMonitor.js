function initMonitor(title, filterField, tabStripProcedureName, gridOptions) {
    create_monitor_elements(title,gridOptions);  // crea elementi del dom
    $("#gridtotals").data("gridOptions", gridOptions);
    $("#tabstripcontainer").empty();

    var opts = {
        Definition: {
            Type: "StoredProcedure",
            Definition: tabStripProcedureName
        },
        Read: {
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/Select",
            contentType: "application/json"
		}		
        
	};
	if (gridOptions.entityName)
		opts.EntityName = gridOptions.entityName;
    if (getQsPars())
        opts.Data = { actionfilter:getQsPars() };
    getGenericSelectDataSource(opts, function (response) {
        if (response.Count) {
            reBuildGrid(gridOptions, response.Data[0].Table[0].ID, response.Data[0].Table[0].COLOUR).then(function () {
                tabStrip.enable(tabStrip.tabGroup.children());
            });

            var $tabstrip = $("<div id='tabstrip'><ul></ul></div>"),
                $tabstripUl = $tabstrip.find('ul');
            $.each(response.Data[0].Table, function (k, v) {
                if ($("#grid").length > 0 && k==0)
                    $("#grid").attr("tabSelClassId", v.ID);
                $tabstripUl.append('<li style="background-color:' + v.COLOUR + '" class="k-state-disabled ' + (k == 0 ? 'k-state-active' : "") + '" data-class-id="' + v.ID + '">' + v.DESCRIPTION + '</li>')
            });

            $("#tabstripcontainer").append($tabstrip);
            var tabStrip = $tabstrip.kendoTabStrip({
                select: function (e) {
                    var grid = $("#grid").data("kendoGrid");
                    if (!grid.dataSource._filter || grid.dataSource._filter.filters.length != 1 || grid.dataSource._filter.filters[0].field != filterField || grid.dataSource._filter.filters[0].operator != "eq" || grid.dataSource._filter.filters[0].value != 0)
                        grid.dataSource.filter({ field: filterField, operator: "eq", value: 0 });

                    tabStrip.disable(tabStrip.tabGroup.children());
                    if ($("#grid").length>0)
                        $("#grid").attr("tabSelClassId", $(e.item).data('class-id'));
                    var customfiltertext;
                    if ($("#inpGridTotalsCustomFilter").length > 0)
                        customfiltertext = $("#inpGridTotalsCustomFilter").val();
                    reBuildGrid(gridOptions, $(e.item).data('class-id'), $(e.item).css("background-color"), customfiltertext).then(function () {
                        tabStrip.enable(tabStrip.tabGroup.children());
                    });
                }
            }).data("kendoTabStrip");
        }
    }).read();
}

function refreshTotalsGrid($activeItem, gridOptions) {
    var $gridtotals = $("#gridtotals"),
        gridtotals = $gridtotals.data("kendoGrid");
    $gridtotals.css('background-color', $activeItem.css("background-color"));
}

function selectCol(e) {
    var $el = $(e.target),
        grid = $el.closest('[data-role=grid]').data('kendoGrid');
    if (!e.ctrlKey)
        grid.clearSelection();
    grid.select($el.closest('tr').find('[data-status=all]').closest('td'));
}

function create_monitor_elements(title,gridOptions) {
    $("#grid").remove();
    var $appcontainer = $("#appcontainer");
    if (gridOptions) {
        if (gridOptions.addSearchInput) {
            $appcontainer.append('<div class="row">\
                                  <div class="col-lg-3">\
                                    <div class="input-group">\
                                      <input id="inpGridTotalsCustomFilter" type="text" class="form-control" placeholder="...">\
                                      <span class="input-group-btn">\
                                        <button id="btnGridTotalsCustomFilter" class="btn btn-default" type="button"><span class="glyphicon glyphicon-filter"></span></button>\
                                      </span>\
                                       <span class="input-group-btn">\
                                        <button id="btnGridTotalsCustomFilterRemove" class="btn btn-default" type="button"><span class="glyphicon glyphicon-remove"></span></button>\
                                      </span>\
                                    </div>\
                                  </div>\
                                </div><div class="row" style="height:10px;"/>');
            $("#btnGridTotalsCustomFilterRemove").click(function (e) {
                $("#inpGridTotalsCustomFilter").val("");
                $("#btnGridTotalsCustomFilter").trigger("click");
            })
            $("#btnGridTotalsCustomFilter").click(function (e) {
                var tabStrip = $("#tabstrip").data("kendoTabStrip"),
                    activeItem = tabStrip.tabGroup.find('.k-state-active');
                tabStrip.disable(tabStrip.tabGroup.children());
                reBuildGrid(gridOptions, activeItem.data('class-id'), activeItem.css("background-color"), $("#inpGridTotalsCustomFilter").val()).then(function () {
                    tabStrip.enable(tabStrip.tabGroup.children());
                });
            })
        }
    }
    $appcontainer.append("<div id='tabstripcontainer' class='k-content' style='background-color: transparent;'></div>");  // il tabstrip
    $appcontainer.append("<div id='gridtotals'></div><br/><br/>"); //griglia dei totali
    if (title)
        $appcontainer.append("<div id='gridtitle'><p class='gridtitle'>" + title + "</p></div>");   // titolo delle griglia sotto il tabstrip
    $appcontainer.append("<div id='grid'></div><br/><br/>");   // griglia kendo con i documenti
}

function reBuildGrid(gridOptions, filterValue, color, customTextSearch) {
    var $gridTotals = $('#gridtotals'),
        deferred = $.Deferred();
    $gridTotals.css("background-color", color);
    if (!$gridTotals.is(':empty')) {
        $gridTotals.data('kendoGrid').destroy();
        $gridTotals.empty();
    }
    var filter = {
        field: gridOptions.filterField,
        operator: "eq",
        value: filterValue
    };
    var opts = {
        Definition: {
            Type: "StoredProcedure",
            Definition: gridOptions.procedureName
        },
        Read: {
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/Select",
            contentType: "application/json"
        },
        Data: {
            classId: filterValue
        },
        PageSize: 1000 
	};
	if (gridOptions.entityName)
		opts.EntityName = gridOptions.entityName;

    if (getQsPars())
        opts.Data.actionfilter = getQsPars();
    if (gridOptions.isPaging)
        opts.PageSize = 1;//serve solo per avere la struttura del grid #gridtotals
    if (customTextSearch)
        opts.Data.customTextSearch = customTextSearch;
    var ds = getGenericSelectDataSource(opts, function (response) {
        if (response.Count && gridOptions.isPaging)
            gridOptions.success(response, opts, filter);
        else
            if (response.Count)
                gridOptions.success(response);
        deferred.resolve()
    });
    ds.filter(filter);

    return deferred.promise();
}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
	ss.rel = "stylesheet";
	ss.href = window.includejs +  href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}