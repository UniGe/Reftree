$(document).ready(function () {
    $('.page-title #spanbig').text("Dashboard");
    var $dashboardTabs = $("[id$=dashboardTabs]");

    if ($('[data-content*=\'"type":"GRID"\']', $dashboardTabs).length) {
        var templateRequest = $.get("/api/MAGIC_TEMPLATES/GetTemplateForUrl/").then(function (result) {
            if ($("#templatecontainer").length === 0)
                $("#appcontainer").append('<div id="templatecontainer"></div>');
            $("#templatecontainer").append(result);
        });
    }

    var lastClickedTab = getLocalUserData("lastDashboardTabClicked");
    if (lastClickedTab)
        $("> ul > li > a[href=\\" + lastClickedTab + "]", $dashboardTabs).click();

    initTabContent($dashboardTabs, templateRequest, $("> ul > li.active > a, > ul > li:first-child > a", $dashboardTabs).text());
    $('a[data-toggle=tab]', $dashboardTabs).on('shown.bs.tab', function (e) {
        initTabContent($dashboardTabs, templateRequest, $(this).text());
        setLocalUserData("lastDashboardTabClicked", $(this).attr("href"));
    });
});

function initTabContent($dashboardTabs, templateRequest, title) {
    var $dashboardTabContent = $("> .tab-content > .tab-pane.active:not(.initialized)", $dashboardTabs);
    if ($dashboardTabContent.length) {
        $dashboardTabContent.addClass('initialized');
        var indicators = {},
            indicatorStored = '',
            charts = {},
            grids = [],
            additionalFormDeferrer = $.Deferred();

        $("[data-content]", $dashboardTabContent).each(function () {
            var $element = $(this),
                content = $element.data("content");
            switch (content.type) {
                case "GRID":
                    grids.push($element);
                    require(["MagicSDK"], function (MF) {
                        templateRequest.then(function () {
                            $.when(isGridVisiblePromise(content.gridName)).then(function () {
                                MF.kendo.getGridObject({
                                    gridName: content.gridName,
                                }).then(function (gridObject) {
                                    additionalFormDeferrer.then(function () {
                                        var parameterMap = gridObject.dataSource.transport.parameterMap;
                                        gridObject.dataSource.transport.parameterMap = function (options, operation) {
                                            if (operation == "read") {
                                                options.data = JSON.stringify($.extend(JSON.parse(options.data || "{}"), getTabAdditionalData($dashboardTabContent)));
                                            }
                                            options = parameterMap(options, operation);
                                            return options;
                                        }
                                        MF.kendo.appendGridToDom({
                                            kendoGridObject: gridObject,
                                            selector: $element.attr("id")
                                        }).done(function () { //D.T: add the user customizations Html
                                            if ($element.find("div.k-header.k-grid-toolbar").length && dshb_isCustomizable()) {
                                                var user_customization_links = '<a title="Swap with another element" onclick="dshb_swapElements(this);" href="javascript:;" class="fa fa-random"></a>\
                                                <a title="Resize" onclick="dshb_resize(this);" href="javascript:;" class="fa fa-expand"></a>\
                                                <a title="Remove from tab" onclick="dshb_remove(this);" href="javascript:;" class="fa fa-times"></a>'
                                                $element.find("div.k-header.k-grid-toolbar").prepend(user_customization_links);
                                                $element.attr("ordinalposition", $element.parent().attr("ordinalposition")); $element.parent().removeAttr("ordinalposition");
                                                $element.attr("btstrpclmnclss", $element.parent().attr("btstrpclmnclss")); $element.parent().removeAttr("btstrpclmnclss");
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                    break;
                case "INDICATOR":
                    content.deferred = $.Deferred();
                    initAngularController($element, "DashboardIndicatorController", content);
                    indicatorStored = content.objectLoadSP;
                    indicators[content.indicatorId] = content.deferred;
                    break;
                case "CHART":
                    content.$element = $element;
                    charts[content.chartId] = content;
                    if (dshb_isCustomizable() && $element.find(".controller").length)
                        $element.find(".controller").show();
                    break;
                case "CUSTOM":
                    requireConfigAndMore(["angular-devExpress-globalized"], function () {
                        initAngularController($element, "FormOptionsController", {});
                    });
                    break;
            }
        });

        if (indicatorStored) {
            initIndicators({
                indicators: indicators,
                indicatorStored: indicatorStored,
                $tabContent: $dashboardTabContent,
                deferred: additionalFormDeferrer
            });
        }

        if (!$.isEmptyObject(charts)) {
            initCharts(charts, $dashboardTabContent, additionalFormDeferrer);
        }

        if ($dashboardTabContent.data("gridName") && (indicatorStored || !$.isEmptyObject(charts) || grids.length)) {
            addParameterForm($dashboardTabContent, additionalFormDeferrer, {
                indicators: indicators,
                indicatorStored: indicatorStored,
                charts: charts,
                grids: grids
            });
        } else {
            additionalFormDeferrer.resolve();
        }

        var $exportButtons = getExportButtons({
            exportElement: $dashboardTabContent,
            style: "margin-left: 15px;"
        }, title.trim());

        if ($('.global-range-picker', $dashboardTabContent).length)
            $('.global-range-picker', $dashboardTabContent).prepend($exportButtons);
        else {
            $dashboardTabContent.prepend($exportButtons);
            $exportButtons.wrap('<div class="col-md-12" style="margin-bottom: 15px; display: inline-block;"></div>');
        }
    }
}

function initIndicators(data) {
    var globalRangePickerObject = getGlobalRangePickerObject(data.$tabContent);

    globalRangePickerObject.$button.click(function () {
        data.deferred.then(function () {
            getIndicatorData(data, globalRangePickerObject.from.value(), globalRangePickerObject.to.value(), data.$tabContent);
        });
    });
    data.deferred.then(function () {
        getIndicatorData(data, globalRangePickerObject.dateStart, globalRangePickerObject.dateEnd, data.$tabContent);
    });
}

function initCharts(charts, $tabContent, deferred) {
    var globalRangePickerObject = getGlobalRangePickerObject($tabContent),
        rangePickerObjects = [];
    $.each(charts, function (id, chart) {
        var rangePickerObject = getRangePickerObject(),
            obj = {};

        rangePickerObjects.push(rangePickerObject);
        $('.grid-title, .portlet-title', chart.$element)
            .before('<span class="grid-view-btn pull-right"><button class="k-button" type="button" onclick="openChartDataGrid(this)"><span class="fa fa-table"></span></button></span>')
            .before(rangePickerObject.$rangePicker);

        if (chart.functionGUID) {
            $('.grid-title span, .portlet-title .caption', chart.$element)
                .wrap('<a href="javascript:void(0);"></a>')
                .parent()
                .click(function () {
                    redirectWithFilter(chart.functionGUID, chart.gridName, chart.functionID, chart.functionFilter);
                });
        }

        obj[id] = chart;
        rangePickerObject.$button.click(function () {
            deferred.then(function () {
                getChartData(obj, rangePickerObject.from.value(), rangePickerObject.to.value(), $tabContent);
            });
        });
    });

    globalRangePickerObject.$button.click(function () {
        //set all chart datepickers and get data
        $.each(rangePickerObjects, function (k, rangePickerObject) {
            rangePickerObject.from.value(globalRangePickerObject.from.value());
            rangePickerObject.to.value(globalRangePickerObject.to.value());
        });
        deferred.then(function () {
            getChartData(charts, globalRangePickerObject.from.value(), globalRangePickerObject.to.value(), $tabContent);
        });
    });
    deferred.then(function () {
        getChartData(charts, globalRangePickerObject.dateStart, globalRangePickerObject.dateEnd, $tabContent);
    });
}

function getRangePickerObject() {
    var dateEnd = new Date(),
        dateStart = new Date(dateEnd.getFullYear(), 0, 1),
        $rangePicker = $('<div class="rangePicker pull-right"><label>' + getObjectText('from') + '&nbsp;</label><input class="start" style="width: 9em" /><label>' + getObjectText('to') + '&nbsp;</label><input class="end" style="width: 9em" /><a class="k-button"><span class="k-icon k-i-tick"></span></a></div>'),
        from = $('.start', $rangePicker).kendoDatePicker({
            change: function (e) {
                to.min(this.value())
            },
            value: dateStart,
            max: dateEnd
        }).data("kendoDatePicker"),
        to = $('.end', $rangePicker).kendoDatePicker({
            change: function (e) {
                from.max(this.value())
            },
            value: dateEnd,
            min: dateStart
        }).data("kendoDatePicker");

    return {
        $rangePicker: $rangePicker,
        from: from,
        to: to,
        $button: $('a.k-button', $rangePicker),
        dateEnd: dateEnd,
        dateStart: dateStart
    };
}

function getGlobalRangePickerObject($tabContent) {
    if ($('.global-range-picker', $tabContent).length)
        return $('.global-range-picker', $tabContent).data('rangePickerObject');

    var rangePickerObject = getRangePickerObject();
    $tabContent.prepend(rangePickerObject.$rangePicker);
    rangePickerObject.$rangePicker
        .wrap('<div class="col-md-12 global-range-picker" style="width: 100%; display: inline-block"></div>')
        .parent()
        .data('rangePickerObject', rangePickerObject);

    return rangePickerObject;
}

function getIndicatorData(data, from, to, $tabContent) {
    $.ajax({
        type: "POST",
        url: "/api/DataAnalysis/PeriodIndicators/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify($.extend({}, getTabAdditionalData($tabContent), {
            dateFrom: kendo.toString(from, "yyyyMMdd"),
            dateTo: kendo.toString(to, "yyyyMMdd"),
            indicatorIDs: $.map(data.indicators, function (e, i) { return i }).join("|"),
            qualfilter: null,
            storedName: data.indicatorStored
        })),
        success: function (res) {
            $.each(res, function (k, v) {
                if (k in data.indicators) {
                    data.indicators[k].then(function (pic) {
                        pic.setValues(v, from, to);
                    });
                }
            });
        }
    });
}

function getChartData(charts, from, to, $tabContent) {
    var chartIDs = $.map(charts, function (e, i) { return i });
    $.ajax({
        type: "POST",
        url: "/api/DataAnalysis/PeriodCharts/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify($.extend({}, getTabAdditionalData($tabContent), {
            dateFrom: kendo.toString(from, "yyyyMMdd"),
            dateTo: kendo.toString(to, "yyyyMMdd"),
            chartIDs: chartIDs.join("|"),
            storedName: charts[chartIDs[0]].objectLoadSP
        })),
        success: function (res) {
            $.each(res, function (k, data) {
                if (data && data.length && data[0].ID in charts) {
                    initChart(charts[data[0].ID], data);
                }
            });
            //if data has not been loaded for charts:
            $.each(charts, function (key, value) {
                if (value.$element && !value.$element.find(".loader").hasClass("hidden")) {
                    if (!value.$element.find(".mfchartcontainer").find("span.fa fa-exclamation-triangle").length) {
                        //append triangle
                        value.$element.find(".mfchartcontainer").append('<span title="Data is not available in the selected period!!!" class="fa fa-exclamation-triangle fa-3x"/>');
                        //hide loader 
                        $('.loader', value.$element).addClass("hidden");
                    }
                }
            });
        }
    });
}

function initChart(chart, data) {

    function parseDateChartX(chart,dataItem)
    {
        var x = dataItem.X;
        if (chart.aggregationDim == 'months')
            x = kendo.toString(new Date(dataItem.X), 'y');
        if (chart.aggregationDim == 'years')
            x = kendo.toString(new Date(dataItem.X), 'yyyy');
        return x;
    }

    var $chartContainer = $('.chart', chart.$element),
        extension = {};

    if (chart.extension) {
        try {
            extension = JSON.parse(chart.extension);
        } catch (ex) {
            console.log("ERROR: " + ex);
        }
    }

    $('.loader', chart.$element).addClass("hidden");
    $chartContainer.removeClass("hidden");
    chart.$element.find('span.fa-exclamation-triangle').remove();

    switch (chart.chartType) {
        case "kendopiechart":
            var series = [],
                showLegendOutsideGraph = data.length > 20;

            for (var i = 0; i < data.length; i++) {
                series.push({ category: parseDateChartX(chart, data[i]), value: data[i].Tot, customparam: data[i].CustomParameter ? JSON.parse(data[i].CustomParameter) : null });
                if (series[i].customparam && series[i].customparam.color) {
                    series[i].color = series[i].customparam.color;
                }
            }

            var valueOut = function (x) {
                //numero intero
                if (parseInt(x) = x && (x % 1) == x)
                    return kendo.toString(x, 'n0');
                else
                    return kendo.toString(x, 'n');
            }

            $chartContainer.kendoChart($.extend(true, {
                dataSource: {
                    data: series,
                },
                title: {
                    text: chart.description,
                    visible: false
                },
                legend: {
                    visible: showLegendOutsideGraph
                },
                chartArea: {
                    background: ""
                },
                seriesDefaults: {
                    labels: {
                        visible: true,
                        background: "transparent",
                        template: (showLegendOutsideGraph ? "" : "#= category #: \n") + "#= value.toLocaleString('" + window.culture + "') # " + chart.yMeasureUnit
                    }
                },
                series: [{
                    type: "pie",
                    field: "value"
                }],
                categoryAxis: {
                    field: "categories"
                },
                tooltip: {
                    visible: true,
                    format: "{0} " + chart.yMeasureUnit
                }
            }, extension));

            $chartContainer.data("kendoChart").bind("seriesClick", function (e) {
                if (e.dataItem.customparam && e.dataItem.customparam.functionGuid) {
                    try {
                        var param = e.dataItem.customparam;
                        redirectWithFilter(param.functionGuid, param.gridName, param.functionId, param.filter);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            });
            break;
        case "kendolinechart_column":
        case "kendolinechart":
           
            var type = chart.chartType == "kendolinechart_column" ? "column" : "line",
                partialLabels = chart.partialLabels ? chart.partialLabels.split(',') : [],
                labels = [],
                param = JSON.parse(data[0].CustomParameter || "{}"),
                isstacked = partialLabels.length > 1 && type == "column",
                series = $.map(isstacked ? data[0].Partials : [0], function (v, k) {
                    return {
                        data: [],
                        markers: { type: "square" },
                        color: param["colorPartial" + (k + 1)],
                        name: isstacked ? partialLabels[k] || "P" + (k + 1) : null
                    };
                });

            for (var i = 0; i < data.length; i++) {
                data[i].X = parseDateChartX(chart, data[i]);
                labels.push(data[i].X);
                $.each(isstacked ? data[i].Partials : [data[i].Tot], function (k, v) {
                    if (series.length > k)
                        series[k].data.push(v);
                });
            }

            var graphobj = {
                title: {
                    text: chart.description,
                    visible: false
                },
                legend: {
                    position: "bottom"
                },
                seriesDefaults: {
                    type: type,
                    stack: isstacked
                },
                series: series,
                valueAxis: {
                    line: {
                        visible: false
                    }
                },
                categoryAxis: {
                    labels: {
                        rotation: 90
                    },
                    categories: labels,
                    majorGridLines: {
                        visible: false
                    }
                },
                tooltip: {
                    visible: true,
                    format: "{0} " + chart.yMeasureUnit
                },
                pannable: {
                    lock: "y"
                },
                zoomable: {
                    mousewheel: {
                        lock: "y"
                    },
                    selection: {
                        lock: "y"
                    }
                }
            };
            $chartContainer.kendoChart($.extend(true, graphobj, extension));
            break;
        case "kendogauge":
            var pointers = [];
            for (var i = 0; i < data.length; i++) {
                pointers.push({ value: data[i].Tot || data[i].Partials[0], customparam: data[i].CustomParameter ? JSON.parse(data[i].CustomParameter) : null });
                if (pointers[i].customparam && pointers[i].customparam.color) {
                    pointers[i].color = pointers[i].customparam.color;
                }
            }
            $chartContainer.kendoRadialGauge($.extend(true, {
                pointer: pointers,
                title: {
                    text: chart.description,
                    visible: false
                }
            }, extension));
            //use extension for scale e.g  
            //scale:{
            //  minorUnit: 20000,
            //  startAngle: -30,
            //  endAngle: 210,
            //  max: 10000000 ,
            //  ranges: [      
            //    {        
            //        from: 80,
            //        to: 120,
            //        color: "#ffc700"
            //        }...
            //          ]
            //}
            break;
    }

    if (!$('.btn-group.pull-right', chart.$element).length) {
        $('.rangePicker', chart.$element).before(getExportButtons({
            exportElement: chart.$element,
            style: "margin-left: 15px;"
        }, chart.description));
    }
}

function openChartDataGrid(e) {
    var $chart = $(e).closest('div').find('[data-role=chart], [data-role=radialgauge]'),
        chart = $chart.getKendoChart() || $chart.data("kendoRadialGauge"),
        $content = showModal({
            content: '<div></div>',
            title: chart.options.title.text
        }),
        gridOptions = {
            sortable: true,
            columns: [{
                field: "category",
                title: " "
            }],
            dataSource: []
        };

    if (chart.options.series) {
        switch (chart.options.series[0].type) {
            case "column":
            case "line":
                gridOptions.columns = gridOptions.columns.concat($.map(chart.options.series, function (serie, k) {
                    return {
                        field: "column_" + k,
                        title: serie.name,
                        template: chart.options.tooltip.format.replace("{0}", "#: column_" + k + " #")
                    };
                }));
                $.each(chart.options.series[0].data, function (k, v) {
                    var row = {
                        category: chart.options.categoryAxis.categories[k] || ""
                    };
                    $.each(chart.options.series, function (_k, serie) {
                        row["column_" + _k] = serie.data[k];
                    });
                    gridOptions.dataSource.push(row);
                });
                break;
            case "pie":
                gridOptions.columns = gridOptions.columns.concat([{
                    field: "value",
                    title: chart.options.tooltip.format.replace(/\{0\}\s*/, "")
                }]);
                gridOptions.dataSource = $.map(chart.dataSource.data(), function (d) {
                    return {
                        category: d.category,
                        value: d.value
                    };
                });
                break;
        }
    } else {
        gridOptions.columns = ["value"];
        gridOptions.dataSource = $.map(chart.options.pointer, function (p) {
            return { value: p.value };
        });
    }

    $('> div', $content).kendoGrid(gridOptions);
}

function redirectWithFilter(funcGuid, gridName, funcId, filter) {
    if (gridName && funcId && filter) {
        filter = typeof filter == "string" ? JSON.parse(filter) : filter;
        filter.type = "chartFilter";
        setSessionStorageGridFilters(gridName, funcId, filter, true);//the true value means that the filter will be ovewritten
    }
    redirectToFunction(funcGuid);
}
//#region user customizations
//clones a tab asking for a new label
function cloneTabUserCustomization(tab) {
    rebuildGenericModal();
    $("#wndmodalContainer").modal("toggle");
    $("#contentofmodal").prepend("<div class='col-md-12'><label for='user_label'>New label</label><input id='user_label'/><div/>");
    $("#executesave").click(function (e) {
        var user_label = $("#user_label").val();
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.set({
                contentType: "XML",
                procedure: "dbo.DashBoardCustomizeCloneTab",
                data: { Tab_ID: $(tab).closest("a").attr("href").substring(15), User_Label: user_label }
            }).then(function (res) {
                window.location.reload(); //rebuilds the page (the user customizations will be considered) 
            }, function (res) {
                console.log(res);
            });

        });
    }); //require
}
//add new objects to a TAB 
function addUserCustomization(tab) {
    var iconsToShow = { INDICATOR: "fa fa-line-chart", CHART: "fa fa-pie-chart", GRID: "fa fa-table", CUSTOM: "fa fa-html5" };
    var tabcontent = $(tab).closest("a").attr("href").substring(1);
    var defer1 = $.Deferred();
    var defer2 = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function (MF) {
        rebuildGenericModal();
        $("#wndmodalContainer").modal("toggle");
        //aggiungo le drop al DOM
        $("#contentofmodal").prepend("<div id='dshb_loadingdata'>" + largeSpinnerHTML + "</div><div style='display:none;' id='dshb_drops'><div><input id='drop1'/></div><div style='height:10px'/><div><input id='drop2'/></div><div style='height:30px'/></div>");
        MF.api.get({
            table: "dbo.Magic_DashBoardContentType", where: "1=1", order: "Code"
        }).then(function (res) {
            var contentTypes = $.map(res, function (v, i) { return $.extend(v, { icon: iconsToShow[v.Code] }); });
            defer1.resolve(contentTypes);
        }, function (res) {
            console.log(res);
            defer1.resolve([]);
        });
        //userDashboardVisibleSP define in AdminAreaCustomizations.js eventual custom SP. 
        var getsp = typeof userDashboardVisibleSP == "string" ? userDashboardVisibleSP : "dbo.DashBoardGetUserObjects";
        MF.api.get({
            storedProcedureName: getsp
        }).then(function (res) {
            defer2.resolve(res[0]);
        }, function (res) {
            console.log(res);
            defer2.resolve([]);
        });

        $.when(defer1, defer2).then(function (contentTypes, items) {
            $("#drop1").kendoDropDownList({
                dataTextField: "Code",
                dataValueField: "ID",
                valueTemplate: '<span class="#:data.icon#">&nbsp;</span><span>#:data.Code#</span>',
                template: '<span class="#:data.icon# k-state-default"</span></div><span class="k-state-default"><h4>#: data.Code #</h4></span>',
                dataSource: contentTypes,
                height: 400
            });
            $("#drop2").kendoDropDownList({
                dataTextField: "Description",
                dataValueField: "ID",
                cascadeFrom: "drop1",
                cascadeFromField: "ContentType_ID",
                dataSource: items,
                height: 400
            });
            $("#dshb_loadingdata").remove(); $("#dshb_drops").show();

        });
        //insert the customizations in dbo.Magic_DashBoardUserCustom
        $("#executesave").click(function (e) {
            doModal(true);
            var addedItem = $("#drop2").data("kendoDropDownList").dataItem($("#drop2").data("kendoDropDownList").select());
            MF.api.set({
                contentType: "XML",
                procedure: "dbo.DashBoardCustomizeTab",
                data: { Tab_ID: $(tab).closest("a").attr("href").substring(15), ContentType_ID: addedItem.ContentType_ID, ContentObject_ID: addedItem.ID }
            }).then(function (res) {
                doModal(false)
                window.location.reload(); //rebuilds the page (the user customizations will be considered) 
            }, function (res) {
                doModal(false);
                console.log(res);
            });

        });
    }); //require

}
//clear customizations of a Tab --> deletes tab itself if it has been defined by the user
function deleteUserCustomizations(tab) {
    rebuildGenericModal();
    $("#wndmodalContainer").modal("toggle");
    $("#executesave").click(function () {
        doModal(true);
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.set({
                contentType: "XML",
                procedure: "dbo.DashBoardCustomizeDelete",
                data: { Tab_ID: $(tab).closest("a").attr("href").substring(15) }
            }).then(function (res) {
                doModal(false);
                window.location.reload(); //rebuilds the page (the user customizations will be considered) 
            }, function (res) {
                doModal(false);
                console.log(res);
            });
        });
    });
}


function addParameterForm($dashboardTabContent, deferred, data) {
    var gridName = $dashboardTabContent.data("gridName"),
        id = $dashboardTabContent.attr("id") + "-form",
        $dropRow = $('<div class="col-md-12"><div class="panel panel-default">\
                    <div class="text-right" role="tab"><a href="#' + id + '" class="btn" data-toggle="collapse"><i class="fa fa-filter"></i></a></div>\
                    <div class="panel-collapse collapse" style="height: 0; overflow: hidden; display: block;" id="' + id + '"><div ng-controller="AdditionalDataFormController as adf" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/AdditionalDataForm.html\'"></div></div>\
                </div></div>');
    $dashboardTabContent.prepend($dropRow);
    initAngularController($dropRow.find('[ng-controller]')[0], "AdditionalDataForm", {
        container: $dashboardTabContent,
        gridName: gridName,
        deferred: deferred,
        callback: function () {
            //reove style attributes after init (magic-form must be visible during inizialization -> uimultiselect input width bug)
            $dropRow.find('.panel-collapse.collapse').removeAttr('style');
            var globalRangePickerObject = getGlobalRangePickerObject($dashboardTabContent);
            if (!$.isEmptyObject(data.charts))
                getChartData(data.charts, globalRangePickerObject.dateStart, globalRangePickerObject.dateEnd, $dashboardTabContent);
            if (!$.isEmptyObject(data.indicators))
                getIndicatorData(data, globalRangePickerObject.dateStart, globalRangePickerObject.dateEnd, $dashboardTabContent);
            if (data.grids.length) {
                $.each(data.grids, function (k, $grid) {
                    var grid = $grid.data("kendoGrid");
                    if (grid)
                        grid.dataSource.read();
                });
            }
        }
    });
}

function getTabAdditionalData($tabContent) {
    var additionalData = {};
    if ($tabContent.data('gridName')) {
        try {
            additionalData = angular.element($tabContent.find('[ng-controller^=AdditionalDataFormController]')).scope().adf.getModel();
        } catch (e) { }
    }
    return additionalData;
}


//Swaps the ordinal positions of objects in the dashboard 
function dshb_swapElements(e) {
    $(e).css("color", "white");
    var $el = $(e).closest("div[id^=dashboard-tab-content]");
    var tab = $el.closest(".tab-pane").attr("id");
    if (!window.mf_Dashboard_SwappingElements)
        window.mf_Dashboard_SwappingElements = {};
    //se non ho ancora selezionato il primo dei 2 elementi 
    if (!window.mf_Dashboard_SwappingElements[tab])
        window.mf_Dashboard_SwappingElements[tab] = { $swappingElement: $el, id: $el.attr("id").substring(22), tabID: tab.substring(14) };
    else //ho selezionato i 2 elementi
    {
        var deferred1st = $.Deferred(), deferred2nd = $.Deferred();
        // devo aggiornare i 2 elementi il primo con la posizione del 2o e viceversa
        requireConfigAndMore(["MagicSDK"], function (MF) {
            doModal(true);
            //update 1o elemento aggiorno con posizione di quello corrente (ultimo selezionato) 
            var dataOfFirst = window.mf_Dashboard_SwappingElements[tab];
            MF.api.set({
                contentType: "XML", procedure: "dbo.DashBoardCustomizeTab",
                data: { Tab_ID: dataOfFirst.tabID, ContentType: dataOfFirst.$swappingElement.data("content").type, TabContent_ID: dataOfFirst.id, BtstrpClmnClss: dataOfFirst.$swappingElement.attr("btstrpclmnclss"), OrdinalPosition: $el.attr("ordinalposition") }
            }, dataOfFirst.id).then(function (res) {
                deferred1st.resolve();
            }, function (res) { console.log(res); doModal(false); });
            //update 2o elemento con posizione del 1o
            MF.api.set({
                contentType: "XML", procedure: "dbo.DashBoardCustomizeTab",
                data: { Tab_ID: dataOfFirst.tabID, ContentType: $el.data("content").type, TabContent_ID: $el.attr("id").substring(22), BtstrpClmnClss: $el.attr("btstrpclmnclss"), OrdinalPosition: dataOfFirst.$swappingElement.attr("ordinalposition") }
            }, $el.attr("id").substring(22)).then(function (res) {
                deferred2nd.resolve();
            }, function (res) { console.log(res); doModal(false); });
        });
        $.when(deferred1st, deferred2nd).then(function () {
            window.location.reload();
        });
    }
}
//resize of a dashboard item (standard classes only)
function dshb_resize(e) {

    var $el = $(e).closest("div[id^=dashboard-tab-content]");
    var tab = $el.closest(".tab-pane").attr("id");
    function joinKendoObjectArray(arr) {
        var arr2 = [];
        arr2.push(arr[0]); arr2.push(arr[1]); arr2.push(arr[2]);
        return arr2.join(' ');
    }
    rebuildGenericModal();
    var wnd = $("#wndmodalContainer").modal("toggle");
    var config = { currentclass: $(e).closest("div[id^=dashboard-tab-content]").attr("btstrpclmnclss") }
    $("#contentofmodal").prepend($(getAngularControllerElement("Magic_DashboardResizeController", config)));

    $("#executesave").click(function () {
        doModal(true);
        var btstrpclassarray = [];
        btstrpclassarray = $("#contentofmodal select").map(function (i, v) {
            return $(v).data("kendoDropDownList").value() == "N/A" ? "" : $(v).data("kendoDropDownList").value();
        });
        var btstrpclass = joinKendoObjectArray(btstrpclassarray).trim().replace(/\s{2,}/, " ");
        requireConfigAndMore(["MagicSDK"], function (MF) {

            MF.api.set({
                contentType: "XML",
                procedure: "dbo.DashBoardCustomizeTab",
                data: {
                    Tab_ID: tab.substring(14), ContentType: $el.data("content").type, action: "destroy",
                    TabContent_ID: $el.attr("id").substring(22),
                    BtstrpClmnClss: btstrpclass,
                    OrdinalPosition: $el.attr("ordinalposition")
                }
            },
            $el.attr("id").substring(22)).then(function (res) {
                window.location.reload();
            },
            function (res) {
                console.log(res); doModal(false);
            });
        });
    });
}
function dshb_remove(e) {
    var $el = $(e).closest("div[id^=dashboard-tab-content]");
    if (!dshb_isCustomizable()) {
        $el.fadeOut();
        return;
    }
    doModal(true);
    var tab = $el.closest(".tab-pane").attr("id");
    requireConfigAndMore(["MagicSDK"], function (MF) {
        //personalizzo il dashboard di questo utente in modo che non veda piu' l'elemento, aggiorno a 0 il flag "Active"
        MF.api.delete({
            contentType: "XML", procedure: "dbo.DashBoardCustomizeTab",
            data: {
                Tab_ID: tab.substring(14), ContentType: $el.data("content").type,
                TabContent_ID: $el.attr("id").substring(22),
                Active: false
            }
        }, $el.attr("id").substring(22)).then(function (res) {
            doModal(false);
            $el.fadeOut();
        }, function (res) { console.log(res); doModal(false); });
    });
}
function dshb_isCustomizable() {
    if ($(".customizationSpan").length > 0)
        return true;
    return false;
}
//#endregion