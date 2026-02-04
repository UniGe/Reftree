define(
    [
        //window.includesVersion +    "/views/3/js/controllers/ReftreeGridViewerController.js",
       
    ], function ( ) {

        return function init(gridEditPage, $timeout) {
            if (gridEditPage.mainGridName == "AS_VI_PORASS_SEND_ASSETS") {
                config = {                    
                    id: 'portal_' + gridEditPage.mainGridName,                    
                    //grid: gridEditPage.gridInstances["grid0"],                    
                    rowData: gridEditPage.actionsModel,
                    isGridEditPage: true,
                    ready: function () {
                        console.log('ritorno')
                    }
                }
                var controllerName = 'ReftreePortalViewerController';
                //dwgController = $('<div id="portal-viewer-controller" class="k-grid" style="position: relative">').append($(getAngularControllerElement(controllerName, config)).css('height', '100%')
                //    )
                //    .css('height', '80vh');

                dwgController = $(getAngularControllerElement(controllerName, config))

                $("#grid").hide();
                $('#appcontainer').append(dwgController);

            } else {
                //$('#container').children().css('display', 'none');
                //modificato per nascondere le griglie della editpage che non voglio vedere 

                $('#PARENT_OF_EVERYTHING').children().css('display', 'none');
                //console.log(gridEditPage);
                var deferred = $.Deferred();

                requireConfigAndMore(['MagicSDK'], function (MF) {
                    MF.api
                        .get({
                            storedProcedureName: userSessionManagementSp,
                            data: { useraction: 'init' },
                        })
                        .then(
                            function (result) {
                                MF.api
                                    .get({
                                        storedProcedureName: 'core.DWG_Cad_config',
                                        data: { ApplicationInstanceId: window.ApplicationInstanceId },
                                    })
                                    .then(
                                        function (result) {
                                            try {
                                                dwgCadInfo = JSON.parse(result[0][0].RSN_CADCFG_JSON_CONFIG);

                                                $timeout(function () {
                                                    deferred.resolve(MF);
                                                }, 2000)

                                            } catch (ex) {
                                                kendoConsole.log(
                                                    getObjectText('Errore configurazione cad config'),
                                                    true
                                                );
                                                return;
                                            }
                                        },
                                        function (err) {
                                            console.log(err);
                                        }
                                    );
                            },
                            function (err) {
                                console.log(err);
                            }
                        );
                });
                $.when(deferred).then(function (MF) {



                    var row = gridEditPage.gridInstances["grid0"].content.find('tr')
                    gridEditPage.gridInstances["grid0"].select(row);


                    config = {
                        MF: MF,
                        id: 'dwg_' + gridEditPage.mainGridName,
                        userSessionManagementSp: userSessionManagementSp,
                        grid: gridEditPage.gridInstances["grid0"],
                        serviceUrl: dwgCadInfo.serviceUrl,
                        serviceUrlInterface: dwgCadInfo.serviceUrlInterface,
                        rootForDxf: dwgCadInfo.rootForDxf,
                        dwgCadInfo: dwgCadInfo,
                        isGridEditPage: true,
                        ready: function () {
                            console.log('ritorno')
                        }
                    }


                    var controllerName = 'ReftreeGridViewerController';
                    dwgController = $(
                        '<div id="grid-dwg-controller" class="k-grid" style="position: relative">'
                    )
                        .append(
                            $(getAngularControllerElement(controllerName, config))
                                .css('height', '100%')
                        )
                        .css('height', '80vh');

                    $('#container').append(dwgController);

                })

            }
        }
    }
)