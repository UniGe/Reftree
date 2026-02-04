//Sezione debug in caso di js legato a /views/elaborazioni.aspx
//$(document).ready(function () {
//    loadscript();
//});

function loadscript() {
    apply_style("/Views/3/Styles/monitor.css");  //applica css
    create_elements();  // crea elementi del dom
    getTabStrip(grid);
    var gridobj = getrootgrid("DO_V_DOCUME_MONITOR");
    gridobj.dataSource.filter = { field: "DO_DOCUME_DO_TIPDOC_ID", operator: "eq", value: 0 };
    gridobj.dataSource.sort = { "field": "DO_DOCUME_ISSUE_DATE", "dir": "desc" };
    renderGrid(gridobj, null);
    // griglia dei totali

    // grafici per il momento disabilitati DB  18/09/2015
    //var datastart = kendo.toString(new Date(), "yyyyMMdd");
    //creategraph(datastart, datastart, null, 'documentiperclasse', 'graphrow1', 'Distribuzione dei documenti per classe',null, 0)
    //creategraph(datastart, datastart, null, 'documentiperscadenza', 'graphrow1', 'Distribuzione dei documenti per scadenza', null, 1)
    
};

function create_elements() {
    $("#grid").remove();
    var $appcontainer = $("#appcontainer");
    $appcontainer.append("<div id='tabstripcontainer' class='k-content' style='background-color: transparent;'></div>");  // il tabstrip
    $appcontainer.append("<div id='gridtotals'></div><br/><br/>"); //griglia dei totali
    $appcontainer.append("<div id='gridtitle'><p class='gridtitle'>"+ getObjectText("doclist")+"</p></div>");   // titolo delle griglia sotto il tabstrip
    $appcontainer.append("<div id='grid'></div><br/><br/>");   // griglia kendo con i documenti
    //$appcontainer.append("<div class='panel panel-default'>\
	//			                <div class='panel-heading'>\
	//				                <h3 class='panel-title'>Sezione grafici\
	//				                <span class='pull-right clickable panel-collapsed'><i class='glyphicon glyphicon-chevron-down'></i></span>\
    //                                </h3>\
	//			                </div>\
	//			                    <div class='panel-body' style='display: none;'>\
    //                                    <div class='row-fluid'><div id='graphrow1' class='row graphs'></div></div>\
    //                                </div>\
    //                             </div>");

    //$('.panel-heading span.clickable').on("click", function (e) {
    //    if ($(this).hasClass('panel-collapsed')) {
    //        // expand the panel
    //        $(this).parents('.panel').find('.panel-body').slideDown();
    //        $(this).removeClass('panel-collapsed');
    //        $(this).find('i').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    //    }
    //    else {
    //        // collapse the panel
    //        $(this).parents('.panel').find('.panel-body').slideUp();
    //        $(this).addClass('panel-collapsed');
    //        $(this).find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    //    }
    //});

}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}

function getTabStrip() {
    $("#tabstripcontainer").empty();
    $.ajax({
        type: "POST",
        url: "/api/Documentale/GetTabStrip/",
        //data: JSON.stringify({ id: id, nometabella: nometabella }),
        data:JSON.stringify({ actionfilter : getQsPars() ? getQsPars() : ""  }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            $("#tabstripcontainer").append($.parseHTML(result));
            var tabStrip = $("#tabstrip").kendoTabStrip({
                select: function (e) {
                    var grid = $("#grid").data("kendoGrid");
                    if (!grid.dataSource._filter || grid.dataSource._filter.filters.length != 1 || grid.dataSource._filter.filters[0].field != "DO_DOCUME_DO_TIPDOC_ID" || grid.dataSource._filter.filters[0].operator != "eq" || grid.dataSource._filter.filters[0].value != 0)
                        grid.dataSource.filter({ field: "DO_DOCUME_DO_TIPDOC_ID", operator: "eq", value: 0 });

                    tabStrip.disable(tabStrip.tabGroup.children());
                    reBuildGrid($(e.item).data('do_cladoc_id'), $(e.item).css("background-color")).then(function () {
                        tabStrip.enable(tabStrip.tabGroup.children());
                    });
                }
            }).data("kendoTabStrip");

            var $activeItem = $("#tabstrip li.k-state-active");
            reBuildGrid($activeItem.data('do_cladoc_id'), $activeItem.css("background-color")).then(function () {
                tabStrip.enable(tabStrip.tabGroup.children());
            });
        },
        error: function (result) {
            kendoConsole.log("Errore nel reperimento dei dati per la UI.", true);
        }
    });
}

function selectCol(e) {
    var $el = $(e.target),
        grid = $el.closest('[data-role=grid]').data('kendoGrid');
    if (!e.ctrlKey)
        grid.clearSelection();
    grid.select($el.closest('tr').find('[data-status=all]').closest('td'));
}

function reBuildGrid(filterValue, color) {
    var $gridTotals = $('#gridtotals'),
        deferred = $.Deferred();
    $gridTotals.css("background-color", color);
    if (!$gridTotals.is(':empty')) {
        $gridTotals.data('kendoGrid').destroy();
        $gridTotals.empty();
    }
    var opts = {
        Definition: {
            Type: "StoredProcedure",
            Definition: "core.DO_DOCUME_SELECT_RIEP"
        },
        Read: {
            type: "POST",
            url: "/api/GENERICSQLCOMMAND/Select",
            contentType: "application/json"
        },
        Data: {
            classId: filterValue
        }

    };
    if (getQsPars())
		opts.Data.actionfilter = getQsPars();
	opts.EntityName = "core.DO_DOCUME_documents";
    var ds = getGenericSelectDataSource(opts, function (response) {
        if (response.Data && response.Data.length && response.Data[0].Table && response.Data[0].Table.length) {
            var columns = [];
            $.each(response.Data[0].Table[0], function (field, v) {
                switch (field) {
                    case 'DO_TIPDOC_DO_CLADOC_ID':
                    case 'DO_DOCUME_DO_TIPDOC_ID':
                        return;
                    case 'Tipologia':
                        columns.push({ field: field, title: getObjectText(field), template: '<a class="k-button data-item" onclick="selectCol(event)" >#: Tipologia  #</a>', lockable: false });
                        break;
                    case 'Totali':
                        columns.push({ field: field, title: getObjectText(field), template: '<span class="data-item" data-status="all">#: Totali  #</span>', width: 100 });
                        break;
                    case 'Scaduti':
                        columns.push({ field: field, title: getObjectText(field), template: '<span class="data-item" data-expired="true">#: Scaduti  #</span>', width: 100 });
                        break;
                    case 'Senza_data_scadenza':
                        columns.push({ field: field, title: getObjectText(field), template: '<span class="data-item" data-expired="false">#: Senza_data_scadenza  #</span>', width: 100 });
                        break;
                    default:
                        columns.push({ field: field, title: getObjectText(field), template: '<span class="data-item" data-status="' + field + '">#: ' + field + '  #</span>', width: 100 });
                        break;
                }
            });
            $("#gridtotals").kendoGrid({
                dataSource: response.Data[0].Table,
                columns: columns,
                pageable: false,
                selectable: "multiple cell",
                navigatable: false,
                filterable: false,
                sortable: true,
                groupable: false,
                change: function (e) {
                    var selected = this.select();
                    if (selected.length) {
                        var grid = this,
                            hasSelectedCell,
                            $row,
                            rowFilter,
                            filter = { filters: [], logic: "or" };
                        $('tr[data-uid]', grid.tbody).each(function () {
                            hasSelectedCell = false;
                            $row = $(this);
                            rowFilter = {
                                filters: [
                                    {
                                        field: "DO_DOCUME_DO_TIPDOC_ID",
                                        operator: "eq",
                                        value: null,
                                        type: "typeFilter"
                                    },
                                    {
                                        filters: [],
                                        logic: "or",
                                        type: "statusFilter"
                                    }
                                ],
                                logic: "and"
                            }
                            $('td.k-state-selected', $row).each(function () {
                                hasSelectedCell = true;
                                var data = $(this).find('.data-item').data();
                                if ("status" in data) { // add to statusFilter
                                    if (data.status == "all") {
                                        rowFilter = removeFiltersByType(rowFilter, "statusFilter");
                                        $row.find('td.k-state-selected [data-status]:not([data-status=all])').closest('td').removeClass('k-state-selected');
                                    } else if (rowFilter.filters[1] && rowFilter.filters[1].type == "statusFilter") {
                                        rowFilter.filters[1].filters.push({ field: "DO_STADOC_DESCRIPTION", operator: "eq", value: data.status })
                                    }
                                } else if ("expired" in data) {
                                    if (data.expired) // add the expirationFilter
                                    {
                                        rowFilter.filters.push({
                                            field: "DO_DOCUME_EXPIRY_DATE",
                                            operator: "lt",
                                            value: new Date(),
                                            type: "expirationFilter"
                                        });
                                        rowFilter.filters.push({
                                            field: "DO_STADOC_FLAG_HISTORY",
                                            operator: "eq",
                                            value: false,
                                            type: "archiveFilter"
                                        })
                                    }
                                    else {
                                        $row.find('td.k-state-selected [data-expired=true]').closest('td').removeClass('k-state-selected');
                                        rowFilter = removeFiltersByType(rowFilter, "expirationFilter");
                                        rowFilter = removeFiltersByType(rowFilter, "archiveFilter");
                                        rowFilter.filters.push({
                                            field: "DO_DOCUME_EXPIRY_DATE",
                                            operator: "eq",
                                            value: null,
                                            type: "expirationFilter"
                                        })
                                    }
                                }
                            });

                            if (hasSelectedCell) {
                                rowFilter.filters[0].value = grid.dataSource.getByUid($row.data('uid')).DO_DOCUME_DO_TIPDOC_ID;
                                if (rowFilter.filters[1] && rowFilter.filters[1].type == "statusFilter") {
                                    //remove or reduce statusFilter if is empty
                                    if (!rowFilter.filters[1].filters.length)
                                        rowFilter.filters.splice(1, 1);
                                    else if (rowFilter.filters[1].filters.length == 1) {
                                        rowFilter.filters[1].filters[0].type = rowFilter.filters[1].type;
                                        rowFilter.filters[1] = rowFilter.filters[1].filters[0];
                                    }
                                }
                                filter.filters.push(rowFilter);
                            }
                        });

                        //remove a filter level, if has only one filter
                        if (filter.filters.length == 1)
                            filter = filter.filters[0];

                        $("#grid").data("kendoGrid").dataSource.filter(filter);

                    }
                }
            });
        }
        deferred.resolve()
    });

    ds.filter({
        field: "DO_TIPDOC_DO_CLADOC_ID",
        operator: "eq",
        value: filterValue
    });

    return deferred.promise();
};

function creategraph(datastart, dataend, aggr, analysistype, graphrow, description, icon, index) {
    var graphmodel = {};
    graphmodel['webarch'] = ' <div class="col-md-6">'
                       + '<div class="grid simple">'
                       + '<div class="grid-title no-border">'
                       + '<h4>Stat:: <span class="semi-bold">{1}</span></h4>'
                       + '<div class="tools"> <a href="javascript:;" class="collapse"></a> <a href="#grid-config" data-toggle="modal" class="config"></a> <a href="javascript:;" class="reload"></a> <a href="javascript:;" class="remove"></a> </div>'
                       + '</div>'
                       + '<div class="grid-body no-border">'
                       + ' <div id="{0}"> </div>'
                       + '</div>'
                       + '</div>'


    var graphid = "line" + index.toString();
    $("#" + graphrow).append(graphmodel[template].format(graphid, description, icon));
    var parstring = { "dst": datastart, "dend": dataend, "aggrdim": aggr, "analysisType": analysistype };

    $.ajax({
        async: true,
        type: "POST",
        url: "/api/DataAnalysis/DataforBusinessObject/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: kendo.stringify(parstring),
        success: function (piedata) {
            var series = [];

            for (var i = 0; i < piedata.length; i++) {
                var element = { category: piedata[i].X, value: piedata[i].Tot };
                series.push(element);
            }
            var showlegendoutsidegraph = false;
            var showlegendingraph = true;
            if (piedata.length > 10)
            {
                showlegendingraph = false;
                showlegendoutsidegraph = true;
            }
            //if (piedata.length > 15)
            //{
            //    showlegendingraph = false;
            //    showlegendoutsidegraph = false;

            //}
            var template = "#= category #: \n (#= value #) ";
            if (showlegendingraph === false)
                template = "#= value #";
            if ($('#' + graphid + '_loading').length > 0) {
                $('#' + graphid + '_loading').hide();
                $('#' + graphid + '_content').show();
            }
            // INTERACTIVE
            $("#"+graphid).kendoChart({
                title: {
                    position: "bottom",
                    text: description
                },
                legend: {
                    visible: showlegendoutsidegraph
                },
                chartArea: {
                    background: ""
                },
                seriesDefaults: {
                    labels: {
                        visible: true,
                        background: "transparent",
                        template: template
                    }
                },
                series: [{
                    type: "pie",
                    data: series
                }],
                tooltip: {
                    visible: true,
                    format: "{0}"
                }
            });
                       
                        

        },
        error: function () {
            kendoConsole.log("Error during piedata calc");
        }
    })
}

