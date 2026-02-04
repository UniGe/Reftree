function onchartclick(e) {


    col = [{ field: "index", width: "150px", title: "Osservazione" },
        { field: "val", type: "number", width: "100px", title: "Totale" },
        { field: "valprovv", type: "number", width: "100px", title: "Provvigioni", format: "{0:c2}" },
        { field: "valcons", type: "number", width: "100px", title: "Consulenze", format: "{0:c2}" }
    ];

    if (e.sender.wrapper.context.id == "timebarchart") {
        col[0].format = "{0:dd/MM/yyyy}";

        col[1].format = "{0:c2}";
        col.splice(2, 1);
    }
    if (e.sender.wrapper.context.id == "timebarchartbynum") {
        col[0].format = "{0:dd/MM/yyyy}";
        col.splice(2, 1);
    }
    if (e.sender.wrapper.context.id == "paretochart") {
        col[1].format = "{0:c2}";
        col[2].format = "{0:c2}";
        col[3].format = "{0:c2}";

    }
    if (e.sender.wrapper.context.id == "paretochartbynum") {
        col.splice(2, 1);

    }
    $("#detailgrid").empty();
    $("#detailgrid").kendoGrid({
        dataSource: e.sender.dataSource.data(),
        sortable: {
            mode: "multiple",
            allowUnsort: true
        },
        columns: col
    });



}

function getFilter(data, start, length, fieldtofilter, dir) {

    if (start < 0)
        start = 0;

    var op1 = "gte";
    var op2 = "lte";

    if (dir == "desc") {
        op1 = "lte";
        op2 = "gte"
    }

    return [{
        field: fieldtofilter,
        operator: op1,
        value: eval("data[start]." + fieldtofilter)
    }, {
        field: fieldtofilter,
        operator: op2,
        value: eval("data[Math.min(start + length,data.length-1)]." + fieldtofilter)
    }]
}
function getChartRanges(domid, chartindex) {
    var i = 0;
    for (i = 0; i <= chartindex.length; i++) {
        if (chartindex[i].domid == domid)
            return i;
    }
}
function createChart(paretodata, paretodatabynum, timedatafat, timedatacount, aggr, transitionflag) {

    if (transitionflag == null)
        transitionflag = false;

    var chartIndex = new Array();

    var rangeStart = 0;
    var rangeLength = 20;

    chartIndex.push({ domid: "timebarchart", MIN_RANGE: 20, MAX_RANGE: 40, rangeStart: 0, rangeLength: 20, DRAG_STEP: 50, fieldtofilter: "index", dir: "asc" });
    chartIndex.push({ domid: "timebarchartbynum", MIN_RANGE: 20, MAX_RANGE: 40, rangeStart: 0, rangeLength: 20, DRAG_STEP: 50, fieldtofilter: "index", dir: "asc" });
    chartIndex.push({ domid: "paretochart", MIN_RANGE: 20, MAX_RANGE: 40, rangeStart: 0, rangeLength: 20, DRAG_STEP: 50, fieldtofilter: "val", dir: "desc" });
    chartIndex.push({ domid: "paretochartbynum", MIN_RANGE: 20, MAX_RANGE: 40, rangeStart: 0, rangeLength: 20, DRAG_STEP: 50, fieldtofilter: "val", dir: "desc" });


    var datelabels = new Array();

    var countpolizze = new Array();

    var piedata = new Array();
    var piedatabynum = new Array();
    var contractcount = new Array();

    var i;
    var sumfat = 0;
    var timesumfat = 0;
    var totcon = 0;
    var relfreq = new Array();
    var relfreqnum = new Array();

    var datafat = new Array();
    for (i = 0; i < timedatafat.length; i++) {

        if (timedatafat[i].Tot > 0) {
            datafat.push({ index: new Date(timedatafat[i].X), val: timedatafat[i].Tot })
            timesumfat += timedatafat[i].Tot;

        }
    }
    var timesumcount = 0;
    var datecountlabels = new Array();
    var datacount = new Array();
    for (i = 0; i < timedatacount.length; i++) {

        if (timedatacount[i].NumTot > 0) {
            datacount.push({ index: new Date(timedatacount[i].X), val: timedatacount[i].NumTot })
            timesumcount += timedatacount[i].NumTot;


        }
    }
    var dataparetofat = new Array();
    for (i = 0; i < paretodata.length; i++) {

        if (paretodata[i].Tot > 0) {
            sumfat += paretodata[i].Tot;

        }
    }

    var sum = 0;

    for (i = 0; i < paretodata.length; i++) {
        if (paretodata[i].Tot > 0) {
            var pieunit = { category: paretodata[i].X == null ? "N/A" : paretodata[i].X, value: paretodata[i].Tot * 100 / sumfat };
            sum += paretodata[i].Tot;
            piedata.push(pieunit);
            dataparetofat.push({ index: paretodata[i].X == null ? "N/A" : paretodata[i].X, val: paretodata[i].Tot, valcons: paretodata[i].Partial1, valprovv: paretodata[i].Partial3, relfreq: (sum * 100) / sumfat });

        }
    }

    var sum = 0;
    var sumcont = 0;
    var dataparetocount = new Array();
    for (i = 0; i < paretodatabynum.length; i++) {

        if (paretodatabynum[i].NumTot > 0) {
            sumcont += paretodatabynum[i].NumTot;
        }
    }

    for (i = 0; i < paretodatabynum.length; i++) {

        if (paretodatabynum[i].NumTot > 0) {
            var pieunitbynum = { category: paretodatabynum[i].X == null ? "N/A" : paretodatabynum[i].X, value: paretodatabynum[i].NumTot * 100 / sumcont };
            sum += paretodatabynum[i].NumTot;
            piedatabynum.push(pieunitbynum);
            dataparetocount.push({ index: paretodatabynum[i].X == null ? "N/A" : paretodatabynum[i].X, val: paretodatabynum[i].NumTot, valcons: 0, valprovv: 0, relfreq: (sum * 100) / sumcont });


        }
    }


    var fat = kendo.toString(sumfat, "c0");

    $("#totfatt").text(fat).end();


    $("#timebarchart").kendoChart({
        title: {
            text: "Analisi temporale fatturato"
        },
        legend: {
            position: "top"
        },
        dataSource: {
            data: datafat,
            filter: getFilter(datafat, rangeStart, rangeLength, "index", "asc")
        },
        series: [{
            field: "val",
            type: "column",
            name: "fatturato"
        }],
        categoryAxis: {
            field: "index",
            categories: datelabels,
            labels: {
                format: "d MMM yy",
                rotation: -90
            },
            majorGridLines: {
                visible: false
            }
        },
        valueAxis: {
            title: { text: "fatturato" },
            name: "val",
            line: {
                visible: false
            }
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        },
        transitions: transitionflag,
        drag: onDrag,
        dragEnd: onDragEnd,
        zoom: onZoom//,
        //seriesClick: onchartclick
    });

    $("#timebarchartbynum").kendoChart({
        title: {
            text: "Analisi # contratti per data emissione"
        },
        legend: {
            position: "top"
        },
        dataSource: {
            data: datacount,
            filter: getFilter(datacount, rangeStart, rangeLength, "index", "asc")
        },
        series: [{
            field: "val",
            type: "column",
            name: "# polizze"
        }],
        categoryAxis: {
            field: "index",
            labels: {
                format: "d MMM yy",
                rotation: -90
            },
            majorGridLines: {
                visible: false
            }
        },
        valueAxis: {
            title: { text: "# polizze" },
            name: "val",
            line: {
                visible: false
            }
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        },
        transitions: transitionflag,
        drag: onDrag,
        dragEnd: onDragEnd,
        zoom: onZoom//,
        //seriesClick: onchartclick
    });


    $("#paretochart").kendoChart({
        title: {
            text: "Analisi del Fatturato per " + aggr
        },
        legend: {
            position: "top"
        },
        dataSource: {
            data: dataparetofat,
            filter: getFilter(dataparetofat, rangeStart, rangeLength, "val", "desc")
        },
        series: [{
            type: "column",
            field: "valcons",
            stack: true,
            name: "FatturatoConsulenza",
            color: "#cc6e38"
        },
        {
            type: "column",
            field: "valprovv",
            stack: true,
            name: "FatturatoProvvigioniAgenzia",
            color: "#f3ac32"
        },
         {
             type: "line",
             field: "relfreq",
             name: "CumulataFrequenza",
             color: "#ec5e0a",
             axis: "percfatturato"
         }
        ],
        valueAxes: [{
            title: { text: "fatturato" },
            min: 0,
            max: sumfat
        },
        {
            name: "percfatturato",
            title: { text: "% fatturato" },
            min: 0,
            max: 100,
            majorUnit: 32
        }
        ],
        categoryAxis: {
            field: "index",
            labels: {
                rotation: -90
            },
            axisCrossingValues: [0, 100]
        },


        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        },
        transitions: transitionflag,
        drag: onDrag,
        dragEnd: onDragEnd,
        zoom: onZoom//,
        //seriesClick: onchartclick

    });

    $("#paretochartbynum").kendoChart({
        title: {
            text: "Analisi numero contratti per " + aggr
        },
        legend: {
            position: "top"
        },
        dataSource: {
            data: dataparetocount,
            filter: getFilter(dataparetocount, rangeStart, rangeLength, "val", "desc")
        },
        series: [{
            type: "column",
            field: "val",
            name: "# polizze",
            color: "#cc6e38"
        },
         {
             type: "line",
             field: "relfreq",
             name: "CumulataFrequenza",
             color: "#ec5e0a",
             axis: "perccontratti"
         }
        ],
        valueAxes: [{
            title: { text: "# polizze" },
            min: 0,
            max: sumcont
        },
        {
            name: "perccontratti",
            title: { text: "% # polizze" },
            min: 0,
            max: 100,
            majorUnit: 32
        }
        ],
        categoryAxis: {
            field: "index",
            labels: {
                rotation: -90
            },
            axisCrossingValues: [0, 100]
        },


        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        },
        transitions: transitionflag,
        drag: onDrag,
        dragEnd: onDragEnd,
        zoom: onZoom//,
        //seriesClick: onchartclick

    });

    $("#piechart").kendoChart({
        title: {
            position: "top",
            text: "Distribuzione % Fatturato"
        },
        legend: {
            visible: false
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            labels: {
                visible: true,
                background: "transparent",
                template: "#= category #: #= kendo.format(\"{0:n2}\",value)#%"
            }
        },
        transitions: transitionflag,
        series: [{
            type: "pie",
            startAngle: 150,
            data: piedata
        }],
        tooltip: {
            visible: true,
            format: "{0}%"
        }
    });

    $("#piechartbynum").kendoChart({
        title: {
            position: "top",
            text: "Distribuzione % numero contratti"
        },
        legend: {
            visible: false
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            labels: {
                visible: true,
                background: "transparent",
                template: "#= category #: #= kendo.format(\"{0:n2}\",value)#%"
            }
        },
        transitions: transitionflag,
        series: [{
            type: "pie",
            startAngle: 150,
            data: piedatabynum
        }],
        tooltip: {
            visible: true,
            format: "{0}%"
        }


    });



    var newStart;
    function onDrag(e) {

        var chart = e.sender;
        var i = getChartRanges(e.sender.element[0].id, chartIndex);


        var ds = chart.dataSource;
        var delta = Math.round(e.originalEvent.x.initialDelta / chartIndex[i].DRAG_STEP);

        if (delta != 0) {
            newStart = Math.max(0, chartIndex[i].rangeStart - delta);
            newStart = Math.min(ds.options.data.length - chartIndex[i].rangeLength, newStart);
            ds.filter(getFilter(ds.options.data, newStart, chartIndex[i].rangeLength, chartIndex[i].fieldtofilter, chartIndex[i].dir));
        }
    }

    function onDragEnd(e) {

        var i = getChartRanges(e.sender.element[0].id, chartIndex);

        chartIndex[i].rangeStart = newStart;
    }

    function onZoom(e) {
        var chart = e.sender;
        var i = getChartRanges(e.sender.element[0].id, chartIndex);

        var ds = chart.dataSource;
        chartIndex[i].rangeLength = Math.min(Math.max(chartIndex[i].rangeLength + e.delta, chartIndex[i].MIN_RANGE), chartIndex[i].MAX_RANGE);

        ds.filter(getFilter(ds.options.data, chartIndex[i].rangeStart, chartIndex[i].rangeLength, chartIndex[i].fieldtofilter, chartIndex[i].dir));

        // Prevent document scrolling
        e.originalEvent.preventDefault();
    }
}