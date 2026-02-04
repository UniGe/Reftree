 

    function loadscript() {
        $('.breadcrumb').hide()
        $('.header').hide();
        $('.page-sidebar').hide();
        $('#grid-dwg-controller').css("height", "100vh");
        var gridobj = getrootgrid('AS_US_VI_ASSET_VIEW');
        

 
        renderGrid(gridobj, null);

        var kGrid = $('div[gridname="' + gridobj.code + '"]').data('kendoGrid');
        
        kGrid.bind('dataBound', function (e) {
            kGrid.tbody.children('tr').addClass('k-state-selected');
            $('div[gridname="' + gridobj.code + '"]').find('a[title="2D viewer"]').triggerHandler('click');


        });

        //$timeout(function () {
        //    var grid = $('div[gridname="' + gridobj.code + '"]').data('kendoGrid');
        //    grid.tbody.children('tr').addClass('k-state-selected');
        //}, 1000)
   

        
        $('div[gridname="' + gridobj.code + '"]').hide();
       
        

    }
 