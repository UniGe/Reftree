function calculate(table) {
    var columnSum = {};
    var tr = table.find('tr');
    tr.each(function (k, v) {
        var rowSum = 0;
        var dayCount = 0;
        $(v).find('td div[contenteditable]').each(function (kk, vv) {
            if (!columnSum[kk + 1])
                columnSum[kk + 1] = 0;
            var cellVal = parseInt($(vv).html());
            if (!isNaN(cellVal) && cellVal > 0) {
                rowSum += cellVal;
                dayCount++;
                columnSum[kk + 1] += cellVal;
            }
        });
        if (k != 0) {
            var tds = $(v).find('td');
            $(tds[tds.length - 2]).html(rowSum);
            $(tds[tds.length - 1]).html(dayCount);
            if (!columnSum[tds.length - 2])
                columnSum[tds.length - 2] = 0;
            columnSum[tds.length - 2] += rowSum;
            if (!columnSum[tds.length - 1])
                columnSum[tds.length - 1] = 0;
            columnSum[tds.length - 1] += dayCount;
        }
    });
    var tds = $(tr[tr.length - 1]).find('td');
    $.each(columnSum, function (k, v) { $(tds[k]).html('<b>'+v+'</b>'); });
}


function matchEvent(events,d)
{
    for (var j=0;j<events.length;j++)
        if (events[j].date.getDate() === d.getDate())
            return events[j];
    return false;

}

function buildCalendar(categories, idtable, period)
{

    
    var year = new Date().getFullYear();
    var month = new Date().getMonth();
    //var year = 2014;
    //var month = 10;
    var d = new Date(year, month + 1, 0).getDate();

    if (period !== undefined)
    {
        year = period.getFullYear();
        month = period.getMonth();
        d = new Date(year, month + 1, 0).getDate();
    }

    var table = $("#"+idtable);
    var anagraid = $("#resourcesdropdown").data("kendoDropDownList").value();
    $.ajax({
        type: "POST",
        async: true,
        url: "/api/GENERICSQLCOMMAND/GetWithFilter",
        data: JSON.stringify({
            table: "dbo.V_FOGPRE_presenze_MF", order: "1", where: "DATEPART(month,FOGPRE_DATA) = " + (month + 1) + " AND DATEPART(year,FOGPRE_DATA)=" + year + " AND FOGPRE_ANAGRA_ID=" + anagraid
        }),
        //data: JSON.stringify({ table: "dbo.V_FOGPRE_presenze_MF", order: "1", where: "DATEPART(month,FOGPRE_DATA) = " + 10 + " AND DATEPART(year,FOGPRE_DATA)=" + 2014 + " AND ANAINT_ANAGRA_ID_UTENTE=" + 4 }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            var events = [];
            if (result.Count > 0) {
                $.each(result.Data[0].Table, function (index, value) {
                    events.push({ date: new Date(value.FOGPRE_DATA), ferie: value.FOGPRE_FERIE, permessi: value.FOGPRE_PERMESSI, malattia: value.FOGPRE_MALATTIA, CIG: value.FORPRE_CIG, presenza:value.FOGPRE_PRESENZE,id:value.FOGPRE_ID });
                });

            }


            for (var i = 0; i < categories.length + 2; i++) {
                var row = $('<tr>');
                for (var j = 0; j < d + 3; j++) {
                    html = "<td>";
                    if (1 <= j && j <= d) {
                        var day = new Date(year, month-1, j).getDay();
                        if (day == 0 || day == 6)
                            html = '<td class="info">';
                    }
                    if (i == 0) {
                        if (j == 0)
                            html += "Giorno";
                        else if (j == d + 1)
                            html += "Totale HH";
                        else if (j == d + 2)
                            html += "Totale GG";
                        else
                            html += j;
                    }
                    else if (i == categories.length + 1) {
                        if (j == 0)
                            html += "Totale";
                        else
                            html += 0;
                    }
                    else {
                        if (j == 0)
                            html += categories[i - 1];
                        else if (j > d)
                            html += 0;
                        else {
                            var val = 0;
                            var dbid = "new";
                            var vals = matchEvent(events, new Date(year,month+1,j));
                            if (vals != false) {
                                if (categories[i-1] == "Presenza")
                                    val = vals.presenza == null ? 0 : vals.presenza;
                                if (categories[i-1] == "Ferie")
                                    val = vals.ferie == null ? 0 : vals.ferie;
                                if (categories[i-1] == "Permesso")
                                    val = vals.permessi == null ? 0 : vals.permessi;
                                if (categories[i-1] == "Malattia")
                                    val = vals.malattia == null ? 0 : vals.malattia;
                                if (categories[i-1] == "CIG")
                                    val = vals.CIG == null ? 0 : vals.CIG;
                                dbid = vals.id;
                            }
                            var dateattr = year.toString() + '-' + month.toString() + '-' + j.toString();
                           html += '<div dateatt ="'+ dateattr +'" dbid='+ dbid +' contenteditable="true">' + val + '</div>'; //ore fatte
                        }
                    }
                    html += '</td>';
                    row.append(html);
                }
                table.append(row);
            }
            calculate(table);
        }
        });

    $(table).on('blur', '[contenteditable]', function () {
        calculate($(table));

    });

    
}


function savesheet(table,categories)
{
    var eventsTosave = [];
    var tr = table.find('tr');
    tr.each(function (k, v) {
        if ((k > 0) && k<categories.length) {
            $(v).find('td div[contenteditable]').each(function (kk, vv) {
                var cellVal = parseInt($(vv).html());
                var id = $(vv).attr("dbid");
                var date = $(vv).attr("dateatt");
                if (!isNaN(cellVal) && cellVal > 0) {
                    var element = { date: new Date(parseInt(date.split('-')[0]), parseInt(date.split('-')[1]), parseInt(date.split('-')[2])), id: id, type: categories[k - 1], value: cellVal, anagraid: $("#resourcesdropdown").data("kendoDropDownList").value() };
                    eventsTosave.push(element);
                }
            });
        }
    });

    $.ajax({
        type: "POST",
        async: true,
        url: "/api/FOGPRE/PostU/0",
        data: JSON.stringify(eventsTosave),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log(result.msg,false);
        },
        error:function (error) {
            kendoConsole.log(error.msg,true);
        }
    });

    return false;

 }

function freezesheet()
{
    var sheetfreezingdate = $("#monthyearselector").data("kendoDatePicker").value();

    var resourceid = $("#resourcesdropdown").data("kendoDropDownList").value();

    var data = { resourceid: resourceid, freezingdate: sheetfreezingdate };

    $.ajax({
        type: "POST",
        async: true,
        url: "/api/FOGPRE/Freeze/0",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log(result.msg, false);
        },
        error: function (error) {
            kendoConsole.log(error.msg, true);
        }
    });

    
}


function rebuildonchange(selecteddate, resource, categories) {
    $.ajax({
        type: "POST",
        url: "/api/FOGPRE/SheetIsFrozen/",
        data: JSON.stringify({ resourceid: resource, freezingdate: selecteddate }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            //       var value = $("#monthyearselector").data("kendoDatePicker").value();
            if (result.msg == "true") {
                $("#savetodbbtn").hide();
                $("#freezetodbbtn").hide();

            }
            else {
                $("#savetodbbtn").show();
                $("#freezetodbbtn").show();
            }
            var period = $("#monthyearselector").data("kendoDatePicker").value();
            rebuildCalendar(categories, period); //value is the selected date in the datepicker

        },
        error: function (error) {
            kendoConsole.log(error.msg, true);
        }
    });
}


function rebuildCalendar(categories, period) {
    $("#workcalendar").empty();
    buildCalendar(categories, "workcalendar", period);

}

function generaExcel(e)
{
    var data = getRowDataFromButton(e);
    $.ajax({
        url: '/api/FOGPRE/GenerateExcel',
        type: 'POST',
        datatype: 'json',
        contentType: 'application/json; charset=utf-8',
        data:JSON.stringify(data),
        success: function (result) {
            kendoConsole.log(JSON.parse(result).msg, false);
            $("#grid").data("kendoGrid").dataSource.read();
        },
        error: function (result) {
            kendoConsole.log(result, true);
        }
    });
    return false;
}