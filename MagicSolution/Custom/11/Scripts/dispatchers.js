///Questi metodi vanno reimplementati in ogni solution 
function prerenderdispatcher(grid, functionname, e, gridselector) {
    switch (grid.code)
    {
        case "PM_DISEVE":
            var _origdb_ = grid.dataBound;
            //refresh del tree on refresh del grid
            grid.dataBound = function (e) {
                _origdb_.call(this,e);
                $("a#rootrefresh").trigger("click");
            }
            break;
    }
    return;
}
function postrenderdispatcher(grid, functionname, e)
{
    return;
}


//function printReceipt(e)
//{
//    var rowdata = getRowDataFromButton(e);
//    $.fileDownload("/Helpers/downloadreport?report=/kiba/invoice&id=" + rowdata.FATTES_ID + "&format=pdf");
//}