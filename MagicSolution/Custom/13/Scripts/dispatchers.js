

var changeEvents = {
	V_Goals: {
		Rigore: {
			true: {
				to_show: ["Realizzato"] },
			false: {
				to_hide: ["Realizzato"] }
		}

	}
}

function custommethod(grid, selected, model) {
    switch (grid.element.attr("gridname")) {
        case "MasterData":
            model.set("FK_Code", selected.Description);
            break;
    }
}

///Questi metodi vanno reimplementati in ogni solution 
function prerenderdispatcher(grid, functionname, e, gridselector) {


	

	var origdatabound_ = grid.dataBound;
    var origedit__ = grid.edit;

    return;
}
function postrenderdispatcher(grid, functionname, e) {

	if (grid.gridcode === "PM_ANAHIS") {
		var ss = document.createElement("link");
		ss.type = "text/css";
		ss.rel = "stylesheet";
		ss.href = "/Views/1/Styles/prohis.css";
		document.getElementsByTagName("head")[0].appendChild(ss);
	};

	switch (grid.gridcode) {
		case "Risultati":
			grid.table.on('keydown', function (e) {
				if (e.keyCode === kendo.keys.TAB && $($(e.target).closest('.k-edit-cell'))[0]) {
					e.preventDefault();
					var row = $(e.target).closest('tr').index();
					var col = grid.cellIndex($(e.target).closest('td'));

					var dataItem = grid.dataItem($(e.target).closest('tr'));
					var field = grid.columns[col].field;
					var value = $(e.target).val();

					dataItem.set(field, value);

					var nextCellCol = 3;
					if (row >= 0 && col >= 0 && col < grid.columns.length) {
						var nextCellRow;
						if (col === 3) {
							nextCellCol = 5;
						}
						else if (col === 4) {
							nextCellCol = 4;
						}



						nextCellRow = nextCellCol === 5 ? row + 1 : row;

						//if (nextCellRow === 4 || nextCellRow === 8 || nextCellRow === 13) {
						//	nextCellRow += 2;
						//}

						// wait for cell to close and Grid to rebind when changes have been made
						setTimeout(function () {
							console.log("nextCellRow: " + nextCellRow + "  nextCellCol: " + nextCellCol);
							grid.editCell(grid.tbody.find("tr:eq(" + nextCellRow + ") td:eq(" + nextCellCol + ")"));
						});
					}
				}
			});
	}
    return;
}



//#region CE output    

function generateOutputCE(e) {
	cleanModal();
	var targetgrid = getGridFromToolbarButton(e);
	var selecteddata = targetgrid.select();
	var data = [];
	if (selecteddata.length) {
		for (var i = 0; i < selecteddata.length; i++) {
			//D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
			data.push(targetgrid.dataItem(selecteddata[i]).toJSON());
		}
	}
	$("#wndmodalContainer .modal-content").html(getAngularControllerElement("OutputLauncherController", { data: data[0], form:"Form_OutputLauncher" }));
	$("#wndmodalContainer").modal('show');
}

function solveJsonAddress(e) {
	var compose = '';
	if (!(e.latitude && e.longitude)) //i need to geocode
		compose += " <a style='cursor:pointer;' title='Clicca per geo-localizzare' class='pull-right' onclick='geocodeAddress(this);'><span class='fa fa-question-circle fa-2x'/></a>"
	else // no need to geocode...
		compose += " <span class='fa fa-globe fa-2x pull-right'></span>";
	compose += "{0} {1} - {2} {3} ";
	compose += e.Province_abbr === null ? "" : "({4})";
	compose = compose.format(retblank(e.Address), retblank(e.Municipality), retblank(e.PostalCode), retblank(e.City), retblank(e.Province_abbr));

	return compose;
}

function retblank(value) { return value || ''; }



function solveJsonContacts(e) {
	if (e.JsonForContact === undefined) {
		console.log("ERROR :: field jsonForContact is not defined in current grid even if the solveJsonContacts has been called.");
		return "<div>NO INFO</div>";
	}
	if (e.JsonForContact === "")
		return "<div>NO INFO</div>";
	var addressobj = JSON.parse(e.JsonForContact);
	var ret = "<div>";
	if (addressobj !== null) {
		for (i = 0; i < addressobj.length; i++) {
			var compose = "";
			if (addressobj[i].rif !== "") {
				var linktype = addressobj[i].linktype === 'http://' && addressobj[i].rif.match(/^https?\:\/\//i) ? '' : addressobj[i].linktype; //remove http:// if already in rif
				if (addressobj[i].imgonly == 1) {
					compose = "<a href='{0}' target='_blank'><i class='fa fa-{1}'></i></a>&nbsp;";
					compose = compose.format(linktype + addressobj[i].rif, addressobj[i].icon);
				}
				else {
					if (addressobj[i].linktype !== "") {
						compose = "<a href='{1}'><i class='fa fa-{0}'></i>&nbsp;{2}</a><br />";
						compose = compose.format(addressobj[i].icon, linktype + addressobj[i].rif, addressobj[i].rif);
					}
					else {
						compose = "<i class='fa fa-{0}'></i>&nbsp;<span>{1}</span><br />";
						compose = compose.format(addressobj[i].icon, addressobj[i].rif);
					}
				}
			}
			ret += compose;
		}
	}
	return ret;
}


function ReFillPlayers(e) {
	$("#tabstrippopup-1").find(".k-textbox.k-space-right.searchgrid.k-required a.k-icon.k-i-cancel").trigger("click");
}

function editGoals(e) {

	getStandardEditFunction(e, e.sender.options.code, "grid");
	hideFieldsBasedOn(e, "Rigore");
}


function generateXmlCE(e) {
	var key = !(e.id) ? e.className : e.id;
    var targetgrid = getGridFromToolbarButton(e);
    jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
    //se la griglia e' selezionabile vado a prendermi tutte le righe selezionate
    var selecteddata = [];
    try {
        selecteddata = targetgrid.select();
    }
    catch (err) {
        console.log("grid is not selectable");
    }
    if (!selecteddata.length) {
        kendoConsole.log(getObjectText("selectatleastonerow"), true);
        return;
    }
    //aggiunge ai dati di riga il payload impostato dall utente
    var datapayload = [];
    if (selecteddata.length > 0) {
        for (var i = 0; i < selecteddata.length; i++) {
            datapayload.push(targetgrid.dataItem(selecteddata[i]));
        }
    }
    //outputPath will be added to standard file upload directory (application root if the directory Rootdirforupload is not defined)
    //The reports will be created in root + outputPath
    doModal(true);
    $.ajax({
        type: "POST",
        url: "/api/CE_CALCIO/GenerateXml/",
        data: JSON.stringify({ ID: datapayload[0].ID, OutputName: datapayload[0].OutputName,  OutputType_Code: datapayload[0].Code }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            //kendoConsole.log(getObjectText("Invoicesbuilt"), false);
            $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
            doModal(false);
        },
        error: function (message) {
            doModal(false);
            kendoConsole.log(message.responseText, true);
        }
    });
}