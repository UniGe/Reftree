function loadscript() {    
    create_elements();
    create_autocomplete_fascicolo();    
}

function create_elements()
{
    apply_style("/Views/3/Styles/fascicolo.css");
    $("#grid").remove();

    var initialdiv = "<div id='initialidiv'>\
            <div class='srcdossiercontainer'>\
                <input id='srcdossier' data-role='autocomplete' type='text' autocomplete='off' role='textbox' aria-haspopup='true' aria-disabled='false' aria-readonly='false' aria-owns='customers_listbox' aria-autocomplete='list' aria-busy='false' aria-expanded='false' placeholder='" + getObjectText("Selezionafascicolo...") + "'>\
            </div>\
            </div>"
    $("#appcontainer").append(initialdiv);

    var htmlrow = "<div class='panel panel-default'>\
				                <div class='panel-heading'>\
					                <h3 class='panel-title'>{1}\
					                <span class='pull-right clickable'><i class='glyphicon glyphicon-chevron-up'></i></span>\
                                    </h3>\
				                </div>\
				                    <div class='panel-body'>\
                                        <div class='row-fluid'>{0}</div>\
                                    </div>\
                                 </div>";
    var htmlinnerdiv = "<div class='col-md-{0}'>\
                        <div id='{1}' class='fascicoligrid' >\
                        </div></div>";

    var htmldivs = [];
    htmldivs[0] = htmlinnerdiv.format('12', 'grid1');
    htmldivs[1] = htmlinnerdiv.format('12', 'grid2');

    htmltoappend = htmlrow.format(htmldivs[0], getObjectText("Elencodeidocumentipresentinelfascicolo"));
    $("#appcontainer").append(htmltoappend);
    htmltoappend = htmlrow.format(htmldivs[1], getObjectText("Elencodeidocumentimancantiperlaproduzionecompletadelfascicolo"));
    $("#appcontainer").append(htmltoappend);    
    
    //$("#appcontainer").append("<div id='grid' class='fascicoligrid'></div>");   // griglia documenti
    //$("#appcontainer").append("<div id='gridmissing' class='fascicoligrid'></div>");   // griglia missing
    $('.panel').hide();
    $("#multisel_obj").hide();
    $("#getdata").hide();
    $("#getdossier").hide();
}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}

function create_autocomplete_fascicolo() {
    var autocomplete = $("#srcdossier").kendoAutoComplete({
        minLength: 2,
        dataValueField: "DO_DOSSIE_ID",
        dataTextField: "DO_DOSSIE_DESCRIPTION",
        filter: "contains",
        headerTemplate: '',
        template: '<div class="srcdossiercontainer">' +
                    '<div class="srcdossierlist">#: data.DO_DOSSIE_DESCRIPTION # </div>' +
                  '</div>',
        dataSource: {
            transport: {
                read: {
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    async: false,
                    type: "POST",
                    url: manageAsyncCallsUrl(false,"/api/Fascicolo/GetList")
                },
                parameterMap: function (options, operation) {
                    if (operation === "read") {
                        // convert the parameters to a json object
                        return kendo.stringify(options);
                    }
                    // ALWAYS return options
                    return options;
                }
            },
            serverFiltering: true,
        },
        select: onDossierSelect,
        height: 370
    }).data("kendoAutoComplete");
}


function onDossierSelect(e) {
    var dataItem = this.dataItem(e.item.index());
    $("#srcdossier").prop("DOSSIE_ID", dataItem.DO_DOSSIE_ID);
    $("#srcdossier").prop("DO_Magic_BusinessObjectType_ID", dataItem.DO_Magic_BusinessObjectType_ID);

    $("#multisel_obj").remove(); // pulisco precedenti selezioni
    var objsearch = "<div id='multisel_obj' >\
      <select id='objs' data-placeholder='" + getObjectText("Selezionaelementi...") + "'></select>\
    </div>";
    $("#initialidiv").append(objsearch);

    $("#getdata").remove(); // pulisco precedenti selezioni
    $("#getdossier").remove(); // pulisco precedenti selezioni
    var butapply = "<button type='button' class='k-button' id='getdata'>" + getObjectText("Vedidocumenti") + "</button> ";
    var butdossie = "<button type='button' class='k-button' id='getdossier'>" + getObjectText("Downloadfascicolo") + "</button>";
    $("#initialidiv").append(butapply);
    console.log(getGridSessionStorageRights("DO_V_DOCUME_DOSSIER", "COMPONENTS").usercanexecute);
    if ((getGridSessionStorageRights("DO_V_DOCUME_DOSSIER", "COMPONENTS")).usercanexecute)
        $("#initialidiv").append(butdossie);
    $("#getdossier").hide();
    create_multiselect_objects(JSON.stringify(dataItem));
    $("#multisel_obj").show();
    $("#getdata").show();
}

function create_multiselect_objects(dataItem) {
    var data = JSON.parse(dataItem);
    //var datasource = getdsformultiselect(data);
    var objs = $("#objs").kendoMultiSelect({       
        dataTextField: "obj_description",
        dataValueField: "obj_id",
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
                    url: manageAsyncCallsUrl(false,"/api/Fascicolo/GetObjects")
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

    $("#getdata").click(function () {
        var DOSSIE_ID = $("#srcdossier").prop("DOSSIE_ID");
        var DO_Magic_BusinessObjectType_ID = $("#srcdossier").prop("DO_Magic_BusinessObjectType_ID");
        var OBJIDS = objs.value();

        if (OBJIDS.length == 0)
        {
            kendoConsole.log(getObjectText("selectatleastoneelementforthedossier"), true);
            return;
        }

        $('.panel').show();

        var gridobj = getrootgrid("DO_V_DOCUME_DOSSIER");
        
        // filtrare con le logiche giuste
        //gridobj.dataSource.transport.read.url = "/api/Fascicolo/GetDocuments";      
        //integro dati nel param map 
        var origparmap = gridobj.dataSource.transport.parameterMap;
        gridobj.dataSource.transport.parameterMap = function (options, operation) {
            var optionsorig = JSON.parse(origparmap.call(this, options, operation));
            if (operation === "read") {
                // convert the parameters to a json object
                optionsorig.data = {};
                optionsorig.data.DOSSIE_ID = DOSSIE_ID;
                optionsorig.data.DO_Magic_BusinessObjectType_ID = DO_Magic_BusinessObjectType_ID;
                optionsorig.data.OBJIDS = JSON.stringify(OBJIDS);
                optionsorig.data.request = "grid";
                optionsorig.data = JSON.stringify(optionsorig.data);
                //options.data = "[{ \"field\": \"DOSSIE_ID\", \"value\": \"" + DOSSIE_ID + "\"},{ \"field\": \"OBJIDS\", \"value\":\"" + OBJIDS + "\"}]";
                return kendo.stringify(optionsorig);
            }
            return optionsorig;
        };

        //D.T: va distrutta la griglia se la ricreo on click
        if ($("#grid1").data("kendoGrid")) {
            $("#grid1").data("kendoGrid").destroy();
            $("#grid1").empty();
        }
        renderGrid(gridobj, null, null, "grid1");

        var gridmissing = getrootgrid("DO_V_DOCUME_MISSING");
        // filtrare con le logiche giuste
        gridmissing.dataSource.transport.read.url = "/api/Fascicolo/GetMissing";

        gridmissing.dataSource.transport.parameterMap = function (options, operation) {
            if (operation === "read") {
                // convert the parameters to a json object
                options.data = {};
                options.data.DOSSIE_ID = DOSSIE_ID;
                options.data.DO_Magic_BusinessObjectType_ID = DO_Magic_BusinessObjectType_ID;
                options.data.OBJIDS = JSON.stringify(OBJIDS);
                options.data.request = "grid";
                options.data = JSON.stringify(options.data);
                //options.data = "[{ \"field\": \"DOSSIE_ID\", \"value\": \"" + DOSSIE_ID + "\"},{ \"field\": \"OBJIDS\", \"value\":\"" + OBJIDS + "\"}]";
                return kendo.stringify(options);
            }
            return options;
        };
        //D.T distruggo prima di ricreare on click
        if ($("#grid2").data("kendoGrid")) {
            $("#grid2").data("kendoGrid").destroy();
            $("#grid2").empty();
        }
        renderGrid(gridmissing, null, null, "grid2");
        
        $("#getdossier").show();

    });


    // Helper function to read cookies
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    $("#getdossier").click(function () {
        var data = {};
        data.DOSSIE_ID = $("#srcdossier").prop("DOSSIE_ID");
        data.DO_Magic_BusinessObjectType_ID = $("#srcdossier").prop("DO_Magic_BusinessObjectType_ID");
        data.OBJIDS = JSON.stringify(objs.value());
        data.reqtype = "dossier";
        data.objtype = "";

        var dataSource = $("#grid1").data("kendoGrid").dataSource;        
        data.filters = dataSource.filter();

        $.fileDownload('/api/Fascicolo/GetDossier/', {
            data: data,
            httpMethod: "POST",
            successCallback: function (url) {
                // Check if this was a RabbitMQ job submission
                var jobType = getCookie("fileDownloadJobType");
                if (jobType === "rabbitmq") {
                    // This was a RabbitMQ job, not an immediate download
                    kendoConsole.log("Your dossier is being prepared. You will be notified when it's ready for download.");

                    // Clear the cookie after reading it
                    document.cookie = "fileDownloadJobType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                } else {
                    // This was an immediate file download
                    kendoConsole.log("Your dossier is being downloaded.");
                }
            },
            failCallback: function (responseHtml, url) {
                // Handle errors
                kendoConsole.log("Error processing your request: " + responseHtml, true);
            }
        });

    });
}


