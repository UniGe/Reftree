function loadscript() {
    create_elements();
}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}

function create_elements()
{
    apply_style("/Views/3/Styles/fascicolo.css");
    $("#grid").remove();
    var initialdiv = "<div id='initialidiv'><div id='multisel_obj' >\
      <select id='objs' data-placeholder='Seleziona asset per filtrare ...'></select>\
      <button type='button' class='k-button' id='getdata'>Filtra</button>\
      <button type='button' class='k-button' id='getfiles'>Download files</button>\
    </div></div>\
    <div id='grid' class='fascicoligrid' >";

    $("#appcontainer").append(initialdiv);
    $("#getfiles").hide();

    var data = '{}';
    var objs = $("#objs").kendoMultiSelect({
        dataTextField: "DESCR_FOR_SEARCH",
        dataValueField: "AS_ASSET_ID",
        //filtering: onFiltering,
        autoBind: false,
        dataSource: {
            serverFiltering: true,
            transport: {
                read: {
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    data: data,
                    async: false,
                    type: "POST",
                    url: "/api/Documentale/GetAssetMaster"
                },
                parameterMap: function (options, operation) {
                    if (operation === "read") {
                        // convert the parameters to a json object
                        return kendo.stringify(options);
                    }
                    // ALWAYS return options
                    return options;
                }
            }
        }
    }).data("kendoMultiSelect");
    
    var gridobj = getrootgrid("DO_V_DOCUME");
    renderGrid(gridobj, null);


    $("#getdata").click(function () {
        var OBJIDS = objs.value();
        if (OBJIDS.length == 0) {
            kendoConsole.log("Selezionare alemeno un asset per filtrare", true);
            return;
        }

        var test = gridobj.dataSource.transport.read.url;
        alert(test);

        //var gridobj = getrootgrid("DO_V_DOCUME_DOSSIER");
        //// filtrare con le logiche giuste
        //gridobj.dataSource.transport.read.url = "/api/Fascicolo/GetDocuments";

        //gridobj.dataSource.transport.parameterMap = function (options, operation) {
        //    if (operation === "read") {
        //        // convert the parameters to a json object
        //        options.data = {};
        //        options.data.DOSSIE_ID = DOSSIE_ID;
        //        options.data.DO_Magic_BusinessObjectType_ID = DO_Magic_BusinessObjectType_ID;
        //        options.data.OBJIDS = JSON.stringify(OBJIDS);
        //        options.data.request = "grid";
        //        options.data = JSON.stringify(options.data);
        //        //options.data = "[{ \"field\": \"DOSSIE_ID\", \"value\": \"" + DOSSIE_ID + "\"},{ \"field\": \"OBJIDS\", \"value\":\"" + OBJIDS + "\"}]";
        //        return kendo.stringify(options);
        //    }
        //    return options;
        //};
    });
}

