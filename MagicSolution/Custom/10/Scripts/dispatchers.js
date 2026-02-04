///Questi metodi vanno reimplementati in ogni solution 
function prerenderdispatcher(grid, functionname, e, gridselector) {
    switch (grid.gridcode) {
        case "Magic_Mmb_Users":
            if (window.UserIsDeveloper == "True") {
                grid.columns.push({ command: { text: getObjectText("loginAs"), click: loginAs }, title: "", width: "90px" });
            }
            break;
        case "V_ANAGRA_OPERATORI":
            var origdatabound = grid.dataBound;
            grid.dataBound = function (e) {
                origdatabound.call(this, e);
                //BOUsersManager.js
                showanagrausercreationbutton.call(this, e); //funzione aggiuntiva.call(this,parametro)
            }
            break;
        case "PRENOT_PRENOTAZIONI":
            var origdatabound = grid.dataBound;
            grid.dataBound = function (e) {
                origdatabound.call(this, e);
                //BOUsersManager.js
                console.log(e);
            }
            break;
    }
    return;
}
function postrenderdispatcher(grid, functionname, e) {
    return;
}
function solveJsonContacts(e) {
    if (e.JSON_FOR_CONTACT === undefined) {
        console.log("ERROR :: field jsonForContact is not defined in current grid even if the solveJsonContacts has been called.");
        return "<div>NO INFO</div>";
    }
    if (e.JSON_FOR_CONTACT === "")
        return "<div>NO INFO</div>";
    var addressobj = JSON.parse(e.JSON_FOR_CONTACT);
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

function printReceipt(e) {
    var rowdata = getRowDataFromButton(e);
    $.fileDownload("/Helpers/downloadreport?report=/kiba/invoice&id=" + rowdata.FATTES_ID + "&format=pdf");
}

function printBookingAssistance(e) {
    var rowdata = getRowDataFromButton(e);
	
	$.fileDownload("/Helpers/downloadreport?report=/kiba/"+rowdata.report+"&num_prenotazione=" + rowdata.PRENOT_CODICE + "&format=pdf");
	
}

function concatEtaDenominazione(dataItem) {
    var denominazione = dataItem.MINORE_DENOMINAZIONE + " (" + (dataItem.ANAGRA_ETA ? dataItem.ANAGRA_ETA.toString() : '?') + ')';
    var errorTemplate = '<div title="ETA\' NON CONSENTITA" style="background-color:red">' + denominazione + '</div>';
    if (!isAgeOk(dataItem))
        return errorTemplate;
    return denominazione;
}
function isAgeOk(dataItem) {
    if ((dataItem.PROGET_ETA_MINORE_MAX && (dataItem.ANAGRA_ETA >= dataItem.PROGET_ETA_MINORE_MAX)) || (dataItem.PROGET_DATA_NASCITA_MINORE_MIN && (dataItem.PROGET_DATA_NASCITA_MINORE_MIN > dataItem.ANAGRA_ETA)))
        return false;
    return true;
}

function checkTAXCode(e, showOk, isCheck) {
    try {
        if (isCheck || (undefined !== e.value && !e.value.length)) {
            var data = extractPersonKibaModel(e);
            var result = "";

            var info = {
                async: false,
                onSuccess: function (result) {
                    if (showOk)
                        kendoConsole.log(result.userMessage, 'success');
                },
                onError: function (result) {
                    kendoConsole.log(result.userMessage, 'error');
                },
                onWarning: function (result) {
                    kendoConsole.log(result.userMessage, 'warning');
                }
            }

            info.data = data;
            if (isCheck)
                apiCallCheckTaxCode(info);
            else
                if (data.hasError)
                    info.onWarning({ userMessage: getObjectText('errorCalculateTaxCode') });
                else 
                    result = apiCallInsertTaxCode(info);

            e.value = result;
            getModelAndContainerFromKendoPopUp(e).model.ANAGRA_CODICE_FISCALE = result;
            getModelAndContainerFromKendoPopUp(e).model.dirty = true;
        }
    }
    catch (err) {
        kendoConsole.log(err.message, true);
    }
}

function extractPersonKibaModel(e) {
    var data = new Object();
    var dataInfo = getModelAndContainerFromKendoPopUp(e);

    if (dataInfo.model.ANAGRA_T_GENERE_ID == 4)
        data.gender = 'M';
    else if (dataInfo.model.ANAGRA_T_GENERE_ID == 5)
        data.gender = 'F';
    else
        data.gender = null;

    if (dataInfo.container.find('input#ANAGRA_COGNOME').val() == "" || dataInfo.container.find('input#ANAGRA_NOME').val() == "" ||
        dataInfo.container.find('input#T_STATI_statidd').val() == "" || dataInfo.container.find('input#ANAGRA_DATA_NASCITA').val() == "" ||
        dataInfo.model.ANAGRA_T_COMUNI_ID_NASCITA == 0)
        data.hasError = true;
    else
        data.hasError = false;

    data.surname = dataInfo.model.ANAGRA_COGNOME;
    data.name = dataInfo.model.ANAGRA_NOME;
    data.nationOfBirthId = dataInfo.model.T_STATI_statidd;
    data.DOB = (dataInfo.model.ANAGRA_DATA_NASCITA) ? toTimeZoneLessString(new Date(dataInfo.model.ANAGRA_DATA_NASCITA)) : null;
    data.fiscalCode = dataInfo.container.find('input#ANAGRA_CODICE_FISCALE').val();
    data.cityOfBirthId = dataInfo.model.ANAGRA_T_COMUNI_ID_NASCITA;

    return data;
}

function apiCallInsertTaxCode(info) {
    if (!isaValidFormatTaxcode(info.data.fiscalCode)) {
        var jData = JSON.stringify(info.data);
        var result = "";
        $.ajax({
            url: 'api/Helper/checkFiscalCode',
            type: 'POST',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            async: false,
            data: jData,
            success: function (res) {
                try {
                    if (res.info.resultCode == 0) {
                        result = res.payload.calculatedFiscalCode.toUpperCase();
                    }
                    else {
                        info.onWarning({ userMessage: apiGetResultUserMessage(res) });
                    }
                }
                catch (err) {
                    info.onError({ userMessage: err.message });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var errMessage = textStatus + ' - ' + jqXHR.responseText;
                info.onError({ userMessage: errMessage });
            }
        });

        return result;
    }
}
