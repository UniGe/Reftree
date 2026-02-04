<%@ Page Title="" Language="C#" MasterPageFile="~/Webarch.Master" AutoEventWireup="true" Inherits="MagicFramework.Helpers.PageBase" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <div id="rootwizard">
        <ul class="nav nav-pills">
            <li role="presentation" class="active"><a id="wactsopener" href="#tab1" data-toggle="tab">Portafoglio</a></li>
            <li  id="wkfli" role="presentation" style="display:none;"><a id="actopener" href="#tab2" data-toggle="tab">Gestione attività</a></li>
            <li  id="maintli" role="presentation" style="display:none;"><a id="manuopener" href="#tab3" data-toggle="tab">Gestione interventi manutentivi</a></li>
        </ul>
        <div class="tab-content">
            <div class="tab-pane active" id="tab1">
                <div id="indicatorsrow1" class="row">
                </div>
                <br>
                <div class="clearfix"></div>
                <div id="graphSpot"></div>
                <div class="clearfix"></div>
            </div>
            <div class="tab-pane" id="tab2">
                <div class="row">
                    <div class="clearfix"></div>
                    <div class="col-md-12" id="scheduledtasks">
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Task list
					                <span id="statspan" class="pull-right clickable"><i class="glyphicon glyphicon-chevron-up"></i></span>
                                </h3>
                            </div>
                            <div class="panel-body">
                                <div id="grid"></div>
                            </div>
                        </div>
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Monitor
					                <span id="Span1" class="pull-right clickable panel-collapsed"><i class="glyphicon glyphicon-chevron-down"></i></span>
                                </h3>
                            </div>
                            <div class="panel-body" style="display: none">
                                <div id="gridmoni"></div>
                            </div>
                            
                            <div class="panel-body" style="display: none">
                                <div id="gridact"></div>
                            </div>

                        </div>
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Audit
					                <span id="Span2" class="pull-right clickable panel-collapsed"><i class="glyphicon glyphicon-chevron-up"></i></span>
                                </h3>
                            </div>
                            <div class="panel-body">
                                <div id="graph1"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tab-pane" id="tab3">
                <div class="row">
                    <div class="clearfix"></div>
                    <div class="col-md-12" id="scheduledmanutasks">
                        <div id="manugrid"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
   
    


    <script>
	        $(document).ready(function () {
            $("#wactsopener").text(getObjectText("portfolio"));
            $("#actopener").text(getObjectText("taskmanagement"));
        });
        $('.panel-heading span.clickable').on("click", function (e) {
            if ($(this).hasClass('panel-collapsed')) {
                // expand the panel
                $(this).parents('.panel').find('.panel-body').slideDown();
                $(this).removeClass('panel-collapsed');
                $(this).find('i').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
            }
            else {
                // collapse the panel
                $(this).parents('.panel').find('.panel-body').slideUp();
                $(this).addClass('panel-collapsed');
                $(this).find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
            }
        });

        function showMaintenancetabworkflow(start,dstart, dend)
        {
            doModal(true);
            if ($("#manugrid").data("kendoGrid") === undefined)
                $.ajax({
                    type: "GET",
                    url: "/api/MAGIC_TEMPLATES/GetTemplateForUrl/",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        if ($("#templatecontainer").length === 0) {
                            $("#appcontainer").append('<div id="templatecontainer"></div>');
                        }
                            $("#templatecontainer").html(result);
                            var grid = getrootgrid("WF_V_ACTAGG_aggregate_manut",null,"manugrid");
                            renderGrid(grid, null, null, "manugrid");
                            $("#manugrid").data("kendoGrid").dataSource.read();
                        doModal(false);
                    }
                });
            else
                doModal(false);
        }

        function showtabworkflow(start,dstart,dend)
        {
            doModal(true);
            if ($("#grid").data("kendoGrid") === undefined)
                $.ajax({
                    type: "GET",
                    url: "/api/MAGIC_TEMPLATES/GetTemplateForUrl/",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        if ($("#templatecontainer").length === 0)
                            $("#appcontainer").append('<div id="templatecontainer"></div>');
                        $("#templatecontainer").html(result);
                        
                             var grid = getrootgrid("WF_V_ACTAGG_aggregate_activities");
                            grid.dataSource.filter = initFilters(grid, dstart, dend);
                            grid.toolbar = [{ template: '<div id="eventsRangePicker" style="display: inline-block; float: right;"></div>' }];

                            renderGrid(grid, null);
                            addRangePickers({
                                'eventsRangePicker': { 'start': null, 'end': null, 'startDate': null, 'endDate': null, 'defaultStart': dstart, 'defaultEnd': dend, 'updateView': "refreshActGrid" }
                            });
                            $("#grid").data("kendoGrid").dataSource.read();

                            var gridmoni = getrootgrid("WF_V_MONITOR_WF");
                            renderGrid(gridmoni, null, undefined, "gridmoni");
                            $("#gridmoni").data("kendoGrid").dataSource.read();

                            var gridact = getrootgrid("WF_MONITOR_ACTIVITY");
                            renderGrid(gridact, null, undefined, "gridact");
                            $("#gridact").data("kendoGrid").dataSource.read();

                        
                            var datastart = kendo.toString(dstart, "yyyyMMdd");
                            var dataend = kendo.toString(dend, "yyyyMMdd");
                            buildChartSeries("eff_1", "graph1", datastart, dataend, "effort", "TipoAttivitàPerScadenza", "Tipo attività per scadenza", null, "Scadute", "Totale");
                

                        doModal(false);
                    }
                });
            else
                doModal(false);
        }
        
        function onRefTreeSeriesClick(e)
        {
            console.log(e);
            try {
                sessionStorage.setItem("graphFiltersToAdd", e.dataItem.customparam);
                openfunc(JSON.parse(e.dataItem.customparam).functionId);
            }
            catch (err)
            {
                console.log("Graph click handler has not been defined!");
            }
        }
    $.getScript(window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/dashboard.js")
        .done(function () {
            $("#spanbig").text("Dashboard");
            //filters building
            var d = new Date();
            var start = new Date(d.getFullYear(), 0, 1);
            var dend = d;

            var dstart = start;
            var datastart = kendo.toString(dstart, "yyyyMMdd");

            var dataend = kendo.toString(dend, "yyyyMMdd");
            //definisco le date dell'intervallo per il calendario
            dstart = new Date();
            dstart.setFullYear(dstart.getFullYear() - 10);
            dend = new Date();
            dend.setDate(dend.getDate() + 360);
            //se l' utente puo' vedere tutte le griglie contenute in un certo tab lo visualizzo altrimenti lo nascondo 
            try {
                $.when(isGridVisiblePromise("WF_V_ACTAGG_aggregate_activities"), isGridVisiblePromise("WF_V_MONITOR_WF"), isGridVisiblePromise("WF_MONITOR_ACTIVITY"))
                    .then(function () {
                        $("#actopener").click(function (e) {
                            showtabworkflow(start, dstart, dend);
                        });
                        $("#wkfli").css("display", "block");
                    }, function () {
                        console.log("not ok");

                    });
                $.when(isGridVisiblePromise("WF_V_ACTAGG_aggregate_manut"))
                 .then(function () {
                     $("#manuopener").click(
                         function (e) {
                             showMaintenancetabworkflow(start, dstart, dend);
                             $("#maintfli").css("display", "block");
                         }, function () {
                             console.log("not ok manute");

                         })
                 });
            }
            catch (e) {
                console.log(e);
            }
            //setto i bound delle estrazioni dati per grafici ed indicatori
            Index.dateFrom = dstart;
            Index.dateTo = dend;
            createDashboardTemplates();
            Index.init();
            //inizializzazione indicatori
            Index.initIndicators(datastart, dataend);
            
            refreshallcharts(datastart, dataend, onRefTreeSeriesClick);
     
            if (typeof taskLoad != 'undefined') {
                taskLoad.resolve();
            }
            //adaptive graphs
            window.onresize = function () { refreshallcharts(datastart, dataend, onRefTreeSeriesClick) };

        });
        function initFilters(grid, dstart, dend)
        {
            var datefilter =  { logic: "AND", filters: [{ field: "start", operator: "gte", value: dstart }, { field: "start", operator: "lte", value: dend }] };
            //il filtro sull' utente viene fatto lato controller (specificato nel datasource) 
            return datefilter;
        }
        function refreshActGrid(e) {
            var dstart = $("div#eventsRangePicker input.start.k-input").data("kendoDatePicker").value();
            var dend = $("div#eventsRangePicker input.end.k-input").data("kendoDatePicker").value();
            $("#grid").data("kendoGrid").dataSource.filter({ logic: "AND", filters: [{ field: "start", operator: "gte", value: dstart }, { field: "start", operator: "lte", value: dend }] });

        }
        function refreshActGridmanu(e) {
            var dstart = $("div#eventsRangePickermanu input.start.k-input").data("kendoDatePicker").value();
            var dend = $("div#eventsRangePickermanu input.end.k-input").data("kendoDatePicker").value();
            $("#manugrid").data("kendoGrid").dataSource.filter({ logic: "AND", filters: [{ field: "start", operator: "gte", value: dstart }, { field: "start", operator: "lte", value: dend }] });

        }
        //function badge(e)
        //{
        //    var badgetempl = '<button style="font-size:10px;border-radius:24px!important;float:right;background-color:{1};cursor:auto;" class="btn btn-primary" type="button">\
        //                          {0} <span class="badge">{2}</span>\
        //                        </button>'
        //    return e.Activity + ' ' + badgetempl.format(e.taskTypeDescription, e.Color, e.Activity_counter);
        //}
        //function taskoverdue(e)
        //{
        //    var d = new Date();
        //    if (e.DueDate < d)
        //        return e.description + ' <span class="label label-important">!!</span>';
        //    else
        //        return e.description;
        //}

        function buildChartSeries(graphid,graphrow,datastart,dataend,aggr,analysistype,description,icon,serie1,serie2)
        {

       
            var parstring = { "dst": datastart, "dend": dataend, "aggrdim": aggr, "analysisType": analysistype };

            $.ajax({
                async: true,
                type: "POST",
                url: "/api/DataAnalysis/DataforBusinessObject/",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: kendo.stringify(parstring),
                success: function (data) {
                    var series = [{name:serie1, data:[]}, {name:serie2,data:[]}];
                    var categories = [];
                    $(data).each(function (i, v) {
                        series[0].data.push(v.Partial1);
                        series[1].data.push(v.Partial2);
                        categories.push(v.X);
                        buildBarChart(graphid, series, categories, description, "col-md-12", "graph1", 150);
                    });
                }
            });
        }
        function buildBarChart(graphid, series, categories,description, graphcolmd, containerrow, height, tooltip) {

            var tooltipcontent = null;
            if (tooltip != undefined) {
                tooltipcontent = tooltip;
            }


            var chart = $("#" + graphid).data("kendoChart");
            if (chart !== undefined) {
                chart.destroy();
                $("#" + graphid).remove();
            }
            if ($("#" + graphid).length == 0)
                $("#" + containerrow).append('<div class="' + graphcolmd + '" id="' + graphid + '"><div>');

            $("#" + graphid).kendoChart({
                title: {
                    text: description
                },
                legend: {
                    position: "top"
                },
                seriesDefaults: {
                    type: "bar"
                },
                series:series,
                valueAxis: {
                    line: {
                        visible: false
                    }
                },
                categoryAxis: {
                    categories:categories
                },
                tooltip: {
                    visible: true,
                    template: "#= series.name #: #= value #"
                }
            });


            if (tooltip != null) {
                $("#" + graphid).kendoTooltip({
                    content: tooltip.text,
                    width: tooltip.width,
                    height: tooltip.height,
                    position: tooltip.position,
                    animation: {
                        open: {
                            effects: "fade:in",
                            duration: 1000
                        }
                    }
                });
                $("#" + graphid).data("kendoTooltip").show();
            }
        }
        
       
    
    </script>

</asp:Content>

