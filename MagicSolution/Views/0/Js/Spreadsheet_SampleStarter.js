function loadscript() {
    
    function buildDateFilter(cal)
    {
        var currentDate = new Date();
        if (cal)
         currentDate = cal.current();
        var dateFrom = getMonday(currentDate);
        if ($("#mf_spreadsheet").data("MF"))
            $("#mf_spreadsheet").data("MF").dateFrom = dateFrom;
        else
            $("#mf_spreadsheet").data("MF", { dateFrom: dateFrom });
        var dateTo = new Date(dateFrom.toString());
        dateTo.setDate(dateTo.getDate() + 6);
        $("#curdate").text(kendo.toString(dateFrom, "dddd d MMMM yyyy") + " - " + kendo.toString(dateTo, "dddd d MMMM yyyy"));
        return { logic: "AND", filters: [{ field: "dateFrom", operator: "gte", value: dateFrom }, { field: "dateTo", operator: "lte", value: dateTo }] };
    }

    function buildSpreadSheet(cal)
    {
        var monday  = cal ?  getMonday(cal.current()) : getMonday(new Date());
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.kendo.getSpreadSheetObject("SpreadSheet1").done(function (res) {
                res.change = function (e) {
                    console.log(e);
                };
                $.when(MF.kendo.appendSpreadSheetToDom({ spreadSheetObject: res, selector: "#mf_spreadsheet", filter: buildDateFilter(cal) })).then(function (spreadsheet) {
                    //writes days on header....
                    evaluate1stRow(monday, spreadsheet);
                    if (!$("#weekselector").data("kendoCalendar"))
                        $("#weekselector").kendoCalendar({
                            change: function (e) {
                                monday = buildSpreadSheet(this);
                                evaluate1stRow(monday,spreadsheet);
                            }
                        });
                });
            });
        });
        return monday;
    }

  
    $("#appcontainer").append("<div class='row'><div class='col-md-2'><div id='weekselector'/></div>\
                                                <div class='col-md-10'>\
                                                    <div style='float:left;margin-right:10px;'><span style='cursor:pointer;' onclick='calOffset(-7);' class='fa fa-arrow-left'/></div>\
                                                    <div><span style='cursor:pointer;' onclick='calOffset(7);' class='fa fa-arrow-right'/><span style='margin-left:10px;' id='curdate'></span>\
                                                    <div style='float:right;margin-left:2px;'>\
                                                                        <button onclick='calOffset(0);' class='k-button k-button-icontext'>\
                                                                        <span class='k-icon k-i-refresh'></span>\
                                                                        </button>\
                                                    </div>\
                                                    <div style='float:right;'>\
                                                                        <button onclick='save();' class='k-button k-button-icontext'>"+getObjectText("save")+"</button>\
                                                    </div>\
                                                   </div>\
                                                  <div id='mf_spreadsheet' style='margin-top:25px;width:100%;'/>\
                                                </div>");
    
    buildSpreadSheet();

}

function save()
{
    var payload = $("#mf_spreadsheet").data("kendoSpreadsheet").toJSON();
    payload.currentDateFrom = $("#mf_spreadsheet").data("MF").dateFrom;
    console.log(payload);
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: $("#mf_spreadsheet").data("MF").writeSP, data: payload });
    });
}

function calOffset(offset) {
    var cal = $("#weekselector").data("kendoCalendar");
    if (!cal)
        return;
    var date = new Date(cal.current().toString());
    date.setDate(date.getDate() + offset);
    cal.value(date);
    cal.trigger("change");
}

function evaluate1stRow(monday,spreadsheet)
{
    
    var date = new Date(monday.toString());
    var range = ["C1","D1","E1","F1","G1","H1","I1"]
    for (var i = 0; i < 7;i++)
    {
        var literal = kendo.toString(date, "ddd d");
        date.setDate(date.getDate() + 1);
        spreadsheet.activeSheet().range(range[i]).value(literal);
    }
    
}