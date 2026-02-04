function loadscript() {
    addHtmlElements();
};

function addHtmlElements() {
    var categories = ['Presenza', 'Ferie', 'Permesso', 'Malattia', 'CIG'];

    $("#grid").remove();

    $("#appcontainer").append(' <div class="k-block k-shadow">\
                                    <div><button id="savetodbbtn" style="float:left;display:none;">' + getObjectText('save') + '</button></div>\
                                    <div><button id="freezetodbbtn" style="float:left;margin-left:5px;display:none;">' + getObjectText('freeze') + '</button></div>\
                                    <div><input  style="width:150px;float:right;" id="monthyearselector"></input></div><div><input style="margin-left:10px;"id="resourcesdropdown"/></div></div>\
                                    <div><table id="workcalendar" class="table">\
                                 </div>');

    $("#monthyearselector").kendoDatePicker({
                    start: "year",                          
                    depth: "year",                           
                    format: "MM/yyyy",
                    value: new Date(),
                    change: function () {
                        var value = this.value();
                        var resource = $("#resourcesdropdown").data("kendoDropDownList").value();
                        rebuildonchange(value, resource,categories); //value is the selected date in the datepicker
                    }
    });

    $("#resourcesdropdown").kendoDropDownList({
        dataTextField: "description",
        dataValueField: "anagraid",
        dataSource: {
            transport: {
                read: {
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    url: "/api/FOGPRE/GetAvailableResources/0",
                }
            }
        },
         dataBound: function () {
            var resource = this.value();
            var date = $("#monthyearselector").data("kendoDatePicker").value();
            rebuildonchange(date, resource,categories);

        }

    });

 
    $("#savetodbbtn").click(function () { savesheet($("#workcalendar"), categories); return false; });
    $("#freezetodbbtn").click(function () { freezesheet(); return false; });

   
  
}



