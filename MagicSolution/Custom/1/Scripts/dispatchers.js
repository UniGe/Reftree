function custommethod(grid, selected, model) {
    console.log(grid);
    console.log(selected);
    console.log(model);
}

//this defines the grid and fields which value should determine an hide / show of other fields.
var changeEvents = {
    V_PhoneSIM: {
        ContractType_ID: {
            3: {
                to_show: ["LastName", "FirstName", "FiscalCode", "TransferCredit", "MobileOperatorFrom_ID", "MobileNumber", "SimSerialNumber", "T_DocumentAuthority_ID", "DocumentNumber"]
            },
            5: {
                to_hide: ["LastName", "FirstName", "FiscalCode", "TransferCredit", "MobileOperatorFrom", "MobileOperatorFrom_ID", "T_DocumentAuthority_ID", "DocumentNumber"],
                to_show: ["MobileNumber", "SimSerialNumber"]
            },
            4: {
                to_hide: ["LastName", "FirstName", "FiscalCode", "TransferCredit", "MobileOperatorFrom_ID", "MobileNumber", "SimSerialNumber", "T_DocumentAuthority_ID", "DocumentNumber"]
            },
            6: {
                to_hide: ["LastName", "FirstName", "FiscalCode", "TransferCredit", "MobileOperatorFrom", "MobileOperatorFrom_ID", "T_DocumentAuthority_ID", "DocumentNumber", "SimSerialNumber"],
                to_show: ["MobileNumber"]
            }

        }

    },
    V_PhoneLineData_Z: {
        T_PhoneContractType_ID: {
            2: {
                to_show: ["LinePrefix", "LineNumber", "ActualVoice_Provider_ID", "ActualVoice_SecretCode", "ActualVoice_MigrationCode", "T_ADSL_ID"]
            },
            3: {
                to_hide: ["ActualVoice_Provider_ID", "ActualVoice_SecretCode", "ActualVoice_MigrationCode", "T_ADSL_ID", "ActualAdsl_Provider_ID", "ActualAdsl_MigrationCode"],
                to_show: ["LinePrefix", "LineNumber"]
            },
            1: {
                to_hide: ["LinePrefix", "LineNumber", "ActualVoice_Provider_ID", "ActualVoice_SecretCode", "ActualVoice_MigrationCode", "T_ADSL_ID", "ActualAdsl_Provider_ID", "ActualAdsl_MigrationCode"]
            }
        },
        T_ADSL_ID: {
            3: {
                to_hide: ["ActualAdsl_MigrationCode"]
            },
            1: {
                to_show: ["ActualAdsl_MigrationCode"]
            },
            2: {
                to_show: ["ActualAdsl_MigrationCode"]
            }
        }

    }
}

var editableFields = {
    V_PhoneSIM: {
        ContractType_ID: {
            3: {//portabilita
                editable: [],
                not_editable: ['ContractType_ID', 'MobileNumber']
            },
            4: {//nuova sim
                editable: [],
                not_editable: ['ContractType_ID']
            },
            6: {//Customer base
                editable: [],
                not_editable: ['ContractType_ID']
            }

        }
    }
}

// this defines the grid name out of function guid

var function_grid = {
    "68c56305-2a6a-4426-8ebb-6a0ffca917cb": "V_MonthlySalary",
    "83dfd613-4f70-470a-b00e-8cfdb624a19d": "TargetKPI",
    "4439a2ab-457e-4d48-b52b-f6b10ee17ab9": "MonthlySalaryStaff",
    "0f655aa2-7ec7-4f44-a257-972f26228d93": "V_TargetOperator",
    "19a6d342-6273-4058-ac8f-dbd1afd3f86d": "TargetKPIResult",
    "b44d35cf-becd-437d-99a8-ec0167aead2c": "MinimalTargetHours",
    "10441121-2b1a-4529-8670-f2e60495c86e": "TargetKPIResultOperatorGroupped",
    "b9f497f7-94df-4a78-8741-1bfa4fbc00ca": "TargetKPIResult_TeamLeader",
    "8b546f6e-02ae-41c3-8ff1-f83fa8aaee61": "TargetKPIResultOperator",
    "e6bef2cb-0ce8-4f50-b58f-adfa7de6ec56": "VM_ProductionResponsable",
    "216f8395-2bf3-435e-bb8c-4e538a8e9169": "V_TutorProgress"

}

function editSimContract(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    hideFieldsBasedOn(e, "ContractType_ID");

    var kGrid = e.sender;
    if (getWizardScope(kGrid.magicFormScope)) {
        var wholeModel = getWizardScope(kGrid.magicFormScope).models;
        if (isVodafoneNOTEditable(wholeModel)) {
            checkEditableFields(e, "ContractType_ID");
        }
    }
}
function editContractType(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    hideFieldsBasedOn(e, "T_PhoneContractType_ID");
}

function editanagra(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    managegenere(e.model.Genre_ID, e.container);
}

function generechange(e) {
    managegenere(this.value(), this.element.closest('.k-popup-edit-form'));
}


function checkEditableFields(e, fn) {

    var gridname, fieldname, $container, value;
    if (e.sender) {
        gridname = e.sender.element.attr("gridname") ? e.sender.element.attr("gridname") : $('tr[data-uid=' + e.sender.element.closest('.k-popup-edit-form').data("uid") + ']').closest('.k-grid').attr("gridname");
    } else {
        gridname = $('tr[data-uid=' + $(e).closest('.k-popup-edit-form').data("uid") + ']').closest('.k-grid').attr("gridname");
    }

    if (!gridname) {
        gridname = e.sender ? e.sender.element.closest('.k-popup-edit-form').data("gridname") : $(e).closest('.k-popup-edit-form');
    }
    //called from the field change event
    if (e.sender && !e.sender.element.data("kendoGrid")) {

        fieldname = e.sender.element.attr("name");
        $container = e.sender.element.closest('.k-popup-edit-form');
        value = e.sender.value();
    } else if (!e.sender && !$(e).data("kendoGrid")) {
        fieldname = $(e).attr("name");
        $container = $(e).closest('.k-popup-edit-form');

        var value = $(e)
        var type = value.attr("type");

        if (type && (type.toLowerCase() == 'radio' || type.toLowerCase() == "checkbox"))
            value = value.is(":checked");
        else
            value = value.val();
        //	value = $(e).value();
    }
    else {
        //called from the grid popup

        fieldname = fn;
        value = e.model[fn];
        $container = e.container;
    }

    makeFieldsEditableBasedOn(gridname, fieldname, value, $container);

}



function makeFieldsEditableBasedOn(gridname, fieldname, value, $container) {

    if (fieldname && editableFields[gridname] && editableFields[gridname][fieldname] && editableFields[gridname][fieldname][value]) {
        if (editableFields[gridname][fieldname][value].editable)
            makeFieldEditable(editableFields[gridname][fieldname][value].editable, $container);
        if (editableFields[gridname][fieldname][value].not_editable)
            makeFieldNotEditable(editableFields[gridname][fieldname][value].not_editable, $container);

    }
}

function makeFieldEditable(a, $container) {
    $.each(a, function (i, v) {
        $container.find("[name=" + v + "]").closest("[class*=col-]").attr("readonly", false);
    });
}

function makeFieldNotEditable(a, $container) {


    $.each(a, function (i, v) {
        var dropdownlist = $container.find('input[name=' + v + ']').data("kendoDropDownList");
        if (dropdownlist) {

            dropdownlist.enable(false);
        } else {

            $container.find('input[name=' + v + ']').attr('disabled', 'disabled');
        }
    });
}
//function minTimePickerValue(e){
//     getStandardEditFunction(e, e.sender.options.code, "grid");
//       e.container.find.FromHour;
//    var timepicker = e.container.find.FromHour;

//    var min = timepicker.min();
//    console.log(min);
//    return min;

//}
function editAbsence(e) {

    var Person_ID;

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "HR.AbsenceDefaultPerson" })
            .then(function (res) {
                Person_ID = res[0][0];
                e.container
                    .find("input[name=Person_ID_Request]") // get the input element for the field
                    .val(Person_ID.Person_ID) // set the value
                    .change(); //trigger change in order to notify the model binding
                getStandardEditFunction(e, e.sender.options.code, "grid0");

                var fromHour = e.container.find("input[name=FromHour]").data("kendoTimePicker");
                fromHour.setOptions({
                    min: new Date(2000, 0, 1, 8, 0, 0),
                    max: new Date(2000, 0, 1, 19, 0, 0),
                    interval: 15,
                    timeFormat: "HH:mm"
                });

                var toHour = e.container.find("input[name=ToHour]").data("kendoTimePicker");
                toHour.setOptions({
                    min: new Date(2000, 0, 1, 8, 0, 0),
                    max: new Date(2000, 0, 1, 19, 0, 0),
                    interval: 15,
                    timeFormat: "HH:mm"
                });

            })
    });
    AbsenceTypeChange(e.model.AbsenceType_ID, e.container);

}

//function defaultDate(e) {
//	if (e.model.isNew()) //ON ADD NEW
//	{
//		e.container
//			.find("input[name=Date]") // get the input element for the field
//			.val(kendo.toString(new Date(), "dd/MM/yyyy")) // set the value
//			.change(); //trigger change in order to notify the model binding
//		getStandardEditFunction(e, e.sender.options.code, "grid0");
//	}
//}

function editAbsenceConfirm(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    AbsenceTypeChange(e.model.AbsenceType_ID, e.container);

    var monthDays = [];
    if (e.model.FreeHoursDate) {
        monthDays.push({
            weekday: e.model.FreeHoursDate.getDay(),
            day: e.model.FreeHoursDate.getDate(),
            month: e.model.FreeHoursDate.getMonth(),
            year: e.model.FreeHoursDate.getFullYear()
        });
    } else {
        for (var d = new Date(e.model.FromDate); d <= e.model.ToDate; d.setDate(d.getDate() + 1)) {
            monthDays.push({
                weekday: d.getDay(),
                day: d.getDate(),
                month: d.getMonth(),
                year: d.getFullYear()
            });
        }
    }

    if (monthDays.length) {
        var $element = $('<div ng-controller="AbsenceViewController as av"><absence-view hide-filters="true" period="month" person-id="' + e.model.Person_ID_Request + '"></absence-view></div>'),
            from = e.model.FromDate || e.model.FreeHoursDate,
            to = e.model.ToDate || new Date(new Date(e.model.FreeHoursDate).setDate(e.model.FreeHoursDate.getDate() + 1));
        $element
            .find('absence-view')
            .attr('month-days-string', JSON.stringify(monthDays))
            .attr('from', from.getFullYear() + '-' + (from.getMonth() + 1) + '-' + from.getDate())
            .attr('to', to.getFullYear() + '-' + (to.getMonth() + 1) + '-' + to.getDate());
        initAngularController($element[0], 'AbsenceViewController', undefined, null, true);
        e.container
            .find('.k-tabstrip-wrapper')
            .append($element)
            .closest('.k-widget.k-window')
            .css({ width: 1200 });
        setTimeout(function () {
            e.container.data("kendoWindow").center();
        }, 300);
    }
}

function absenceChange(e) {
    AbsenceTypeChange(this.value(), this.element.closest('.k-popup-edit-form'));
}

function AbsenceTypeChange(e, $element) {
    //  var id = this.value();
    var WholeDay;
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "HR.GetAbsenceTypeDetails", data: { ID: e } }).then(function (res) {
            if (res && res.length && res[0].length)
                WholeDay = res[0][0].WholeDay;
            NeedCertificateCode = res[0][0].NeedCertificateCode;

            if (WholeDay) {
                $element.find("[name='FreeHoursDate'], [name='FromHour'], [name='ToHour'], [name='TotalHours']").closest("[class*=col-]").hide();
                $element.find("[name='FromDate'], [name='ToDate']").closest("[class*=col-]").show();

            }
            else {
                $element.find("[name='FreeHoursDate'], [name='FromHour'], [name='ToHour'], [name='TotalHours']").closest("[class*=col-]").show();
                $element.find("[name='FromDate'], [name='ToDate']").closest("[class*=col-]").hide(); //nascondi/mostra
            }
            if (NeedCertificateCode) {
                $element.find("[name='CertificateCode']").closest("[class*=col-]").show();
            }
            else {
                $element.find("[name='CertificateCode']").closest("[class*=col-]").hide();
            }
        })
    });


}

function managegenere(type, $element) {
    var gridname = $element.data().gridname;
    if ((type == 2) || (type == undefined)) { //persona giuridica
        $element.find("[name='LastName'], [name='FirstName'], [name='Title_ID'], [name='DateOfBirth'], [name='CityOFBirth_ID'], [name='NationOfBirth_ID'], [name='Gender_ID']").closest("[class*=col-]").hide();
        $element.find("[name='LastName'], [name='FirstName'], [name='Title_ID'], [name='DateOfBirth'], [name='CityOFBirth_ID'], [name='NationOfBirth_ID'], [name='Gender_ID']").val(null);

        $element.find("[name='CompanyName'], [name='CompanyName_2'], [name='VatNumber'], [name='Ateco_ID']").closest("[class*=col-]").show();
        $element.find("[name='VatNumber']").prop('required', true);
        $element.find("[name='TaxCode']").removeAttr('required');
    }
    if (type == 1) { //fisica
        $element.find("[name='LastName'], [name='FirstName'], [name='Title_ID'], [name='DateOfBirth'], [name='CityOFBirth_ID'], [name='NationOfBirth_ID'], [name='Gender_ID']").closest("[class*=col-]").show();
        $element.find("[name='CompanyName'], [name='CompanyName_2'], [name='VatNumber'], [name='Ateco_ID']").val('');
        $element.find("[name='CompanyName'], [name='CompanyName_2'], [name='VatNumber'], [name='Ateco_ID']").trigger('change');

        $element.find("[name='VatNumber']").val('');
        $element.find("[name='VatNumber']").trigger('change');
        $element.find("[name='TaxCode']").prop('required', true);//#5479 FA

        $element.find("[name='CompanyName'], [name='CompanyName_2'], [name='VatNumber'], [name='Ateco_ID']").closest("[class*=col-]").hide();
        $element.find("[name='CompanyName'], [name='CompanyName_2'], [name='VatNumber'], [name='Ateco_ID']").removeAttr('required');
    }
    if (type == 4) { //Ditta individuale
        $element.find("[name='LastName'], [name='FirstName'], [name='Title_ID'], [name='DateOfBirth'], [name='CityOFBirth_ID'], [name='NationOfBirth_ID'], [name='Gender_ID']").closest("[class*=col-]").show();
        $element.find("[name='CompanyName'], [name='CompanyName_2'], [name='VatNumber'], [name='Ateco_ID']").closest("[class*=col-]").show();
        $element.find("[name='VatNumber']").prop('required', true);
        $element.find("[name='TaxCode']").prop('required', true);
    }
    if (type == 5) { //Ente/associazione
        $element.find("[name='LastName'], [name='FirstName'], [name='Title_ID'], [name='DateOfBirth'], [name='CityOFBirth_ID'], [name='NationOfBirth_ID'], [name='Gender_ID']").closest("[class*=col-]").hide();
        $element.find("[name='CompanyName'], [name='CompanyName_2'], [name='Ateco_ID'],[name='TaxCode'], [name='VatNumber']").closest("[class*=col-]").show();
        $element.find("[name='TaxCode']").prop('required', true);
        $element.find("[name='VatNumber']").prop('required', false);
        $element.find("[name='VatNumber']").removeAttr('required');
    }

    if (gridname == "V_Person_POT") {
        $element.find("[name='VatNumber']").prop('required', false);
    }
}

function editCallOPRow(model, $grid) {
    model.set("Note", null);
    $grid.data("kendoGrid").editRow($('tr[data-uid="' + model.uid + '"]', $grid));
}

function editCallOP(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    let dropdown = e.container.find("[name='Outcome_ID']");
    if (!dropdown || !dropdown.length) {
        dropdown = e.container.find("[name='OutCome_ID']");
    }
    dropdown.data("kendoDropDownList").one("dataBound", function (drop) {
        manageCallOP(drop.sender, e.container, e.model.IsAppointment);
    });
}

function callOPChange(e) {
    manageCallOP(this, this.element.closest('.k-popup-edit-form'), true);
}


function manageCallOP(dropdown, $element, actualIsAppointment) {
    var value = dropdown.value(),
        isAppointment = true;
    if (!value) {
        isAppointment = actualIsAppointment
    }
    else {
        $.each(dropdown.dataSource.data(), function (k, data) {
            if (data.ID == value) {
                isAppointment = data.IsAppointment;
                console.log(isAppointment);
                return false;
            }
        });
    }

    if (isAppointment) {
        $element.find("[name='ExpectedDate']").closest("[class*=col-]").show();
    } else {
        $element.find("[name='ExpectedDate']").closest("[class*=col-]").hide();
    }
}

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

function retblank(value) { return value || ''; }
//#region address management
function gmap_geocode(data, $element) {
    var location = "{0} {1} - {2} {3} ";
    location += data.Province_abbr === null ? "" : "({4})";
    location = location.format(retblank(data.Address), retblank(data.Municipality), retblank(data.PostalCode), retblank(data.City), retblank(data.Province_abbr));
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': location }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK)
            requireConfigAndMore(["MagicSDK"], function (MF) {
                MF.api.set({
                    table: "Geo.Addresses", primaryKeyColumn: "ID", data: {
                        Longitude: results[0].geometry.location.lng(),
                        Latitude: results[0].geometry.location.lat(),
                        ID: data.Address_ID
                    }
                }, data.Address_ID).then(function () {
                    if ($element) {
                        $element.closest(".k-grid").data("kendoGrid").dataSource.read();
                    }
                    else
                        kendoConsole.log("Geo coding saved to database", "info");
                });
            });
    });

}

//#Work place address management
function gmap_geocode_wp(data, $element) {
    var location = "{0} {1} - {2} {3} ";
    location += data.Province_abbr === null ? "" : "({4})";
    location = location.format(retblank(data.Address), retblank(data.Municipality), retblank(data.PostalCode), retblank(data.City), retblank(data.Province_abbr));
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': location }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK)
            requireConfigAndMore(["MagicSDK"], function (MF) {
                MF.api.set({
                    table: "HR.WorkPlace", primaryKeyColumn: "ID", data: {
                        Longitude: results[0].geometry.location.lng(),
                        Latitude: results[0].geometry.location.lat(),
                        ID: data.WorkPlace_ID
                    }
                }, data.WorkPlace_ID).then(function () {
                    if ($element) {
                        $element.closest(".k-grid").data("kendoGrid").dataSource.read();
                    }
                    else
                        kendoConsole.log("Geo coding saved to database", "info");
                });
            });
    });

}

function geocodeAddress(e) {
    var $element = $(e);
    var data = $element.closest(".k-grid").data("kendoGrid").dataItem($element.closest("tr"));
    if (!data.Address_ID && !data.WorkPlace_ID)
        return;
    if (data.Address_ID) {
        if (typeof google == "undefined")
            require(["https://maps.googleapis.com/maps/api/js?key=" + window.mapAK + "&libraries=drawing"],
                function () {
                    gmap_geocode(data, $element);
                });
        else
            gmap_geocode(data, $element);
    }
    else if (data.WorkPlace_ID) {
        if (typeof google == "undefined")
            require(["https://maps.googleapis.com/maps/api/js?key=" + window.mapAK + "&libraries=drawing"],
                function () {
                    gmap_geocode_wp(data, $element);
                });
        else
            gmap_geocode_wp(data, $element);
    }
}

function solveHolidayBalance(e) {
    var compose = '';
    var res = e.whichvalue.split("|");
    compose = "{0}:{1}<br/>{2}:{3}";
    compose = compose.format(getObjectText('hours'), res[0], getObjectText('days'), res[1])
    return compose;
}

function solveNegativeNumberColor(e) {
    var result = '';
    var number = e.value;
    if (number > 0) {
        result = '<p style="color: green;">' + e.value + '</p>'
        return result;
    }
    else if (number < 0) {
        result = '<p style="color: red;">' + e.value + '</p>'
        return result;
    }
    else if (number == 0) {
        result = '<p style="color: #e6bc42;"> 0 </p>'
        return result;
    }
    else
        return result

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
function solveJsonTeamLeaders(e) {
    var teamLeaders = JSON.parse(e.TeamLeadersSuggestions);

    var valuations = '';

    for (var i = 0; i < teamLeaders.length; i++) {
        var color = 'style="background-color: #f0ad4e;border: 1px solid #eea236;"';
        if (teamLeaders[i].TLExtension && teamLeaders[i].TLExtension != '') {
            if (e.SuggestedExtension && kendo.toString(e.SuggestedExtension, 'd') == teamLeaders[i].TLExtension) {
                color = 'style="background-color: #449d44;border: 1px solid #398439;"';
            } else {
                color = 'style="background-color: #c9302c;border: 1px solid #ac2925;"';
            }
        }
        valuations += '<li class="list-group-item" '
            + color
            //+ ((teamLeaders[i].Note && teamLeaders[i].Note != '') ? ' title="'.concat(teamLeaders[i].Note, '"') : '')
            + '>' + teamLeaders[i].TeamLeader + ':' + teamLeaders[i].TLExtension + ((teamLeaders[i].Note && teamLeaders[i].Note != '') ? " <a style='cursor:pointer;' title=\"" + teamLeaders[i].Note.replace(/\"/g, '\\"') + "\" class='pull-right'><span class='fa fa-question-circle fa-2x'/></a>" : '') + '</li>';
    }
    valuations = '<ul class="list-group">' + valuations + '</ul>';
    return valuations;
}
function solveJsonConnectedTeamLeaders(e) {
    if (!e.TeamLeader) {
        return '<ul class="list-group"></ul>';
    }

    var teamLeaders = JSON.parse(e.TeamLeader);

    var valuations = '';

    for (var i = 0; i < teamLeaders.length; i++) {
        var color = 'style="background-color: #f0ad4e;border: 1px solid #eea236;"';
        valuations += '<li class="list-group-item" '
            + color
            //+ ((teamLeaders[i].Note && teamLeaders[i].Note != '') ? ' title="'.concat(teamLeaders[i].Note, '"') : '')
            + '>' + ((teamLeaders[i].WorkingHours && teamLeaders[i].WorkingHours != '') ? teamLeaders[i].WorkingHours + 'h- ' : '') + teamLeaders[i].TeamLeader + (teamLeaders[i].ToDate ? ': ' + teamLeaders[i].ToDate : '') + ((teamLeaders[i].Note && teamLeaders[i].Note != '') ? " <a style='cursor:pointer;' title='" + teamLeaders[i].Note + "' class='pull-right'><span class='fa fa-question-circle fa-2x'/></a>" : '') + '</li>';
    }
    valuations = '<ul class="list-group">' + valuations + '</ul>';
    return valuations;
}

function solveJsonConnectedCampaigns(e) {
    var campaigns = JSON.parse(e.ActiveAssociated_Campaigns);

    var valuations = '';

    for (var i = 0; i < campaigns.length; i++) {
        var color = 'style="background-color: #f0ad4e;border: 1px solid #eea236;"';
        valuations += '<li class="list-group-item" '
            + color
            //+ ((teamLeaders[i].Note && teamLeaders[i].Note != '') ? ' title="'.concat(teamLeaders[i].Note, '"') : '')
            + '>' + campaigns[i].Campaign + ': ' + campaigns[i].ToDate + ((campaigns[i].Note && campaigns[i].Note != '') ? " <a style='cursor:pointer;' title='" + campaigns[i].Note + "' class='pull-right'><span class='fa fa-question-circle fa-2x'/></a>" : '') + '</li>';
    }
    valuations = '<ul class="list-group">' + valuations + '</ul>';
    return valuations;
}

function solveJsonConnectedBonuses(e) {
    var details = JSON.parse((e.DetailJSON ? e.DetailJSON : '[]'));

    var total = '';

    for (var i = 0; i < details.length; i++) {
        var color = 'style="background-color: #f0ad4e;border: 1px solid #eea236;"';
        total += '<li class="list-group-item" '
            + color
            //+ ((teamLeaders[i].Note && teamLeaders[i].Note != '') ? ' title="'.concat(teamLeaders[i].Note, '"') : '')
            + '>' + details[i].Description + ': ' + details[i].Value + '</li>';
    }
    total = '<ul class="list-group">' + total + '</ul>';
    return total;
}

function solveJsonConnectedBonusesAdditional(e) {
    var details = JSON.parse((e.DetailsNotSummableJSON ? e.DetailsNotSummableJSON : '[]'));

    var total = '';

    for (var i = 0; i < details.length; i++) {
        var color = 'style="background-color: #f0ad4e;border: 1px solid #eea236;"';
        total += '<li class="list-group-item" '
            + color
            //+ ((teamLeaders[i].Note && teamLeaders[i].Note != '') ? ' title="'.concat(teamLeaders[i].Note, '"') : '')
            + '>' + details[i].Description + ': ' + details[i].Value + '</li>';
    }
    total = '<ul class="list-group">' + total + '</ul>';
    return total;
}



function solveJsonConstraints(e) {
    var constraints = JSON.parse((e.ConstraintProgress ? e.ConstraintProgress : '[]'));

    var total = '';

    for (var i = 0; i < constraints.length; i++) {
        constraints[i].Progress = Number(constraints[i].Progress);
        var color = 'success';
        if (constraints[i].Progress < 100) {
            color = 'danger';
        }
        //<li class="list-group-item" style="background-color: #f0ad4e;border: 1px solid #eea236;">0319-CTZ-TIM-RES-ACC-B: 31/12/2099 </li>
        if (constraints[i].Progress > 0 && constraints[i].Progress < 100) {
            color = 'info';
        }
        total += '<div >' +
            constraints[i].ConstraintDescription
            + '<div class="progress pull-left" style="height: 20px; width: calc(100% - 2px);"> <div class="progress-bar progress-bar-' + color + '" role="progressbar" aria-valuenow="' + constraints[i].Progress + '" aria-valuemin="0" aria-valuemax="100" style="width:' + constraints[i].Progress + '%">'
            + constraints[i].Progress + '%</div></div></div>';
    }
    //total = '<ul class="list-group">' + total + '</ul>';
    return total;
}


function solveJsonConnectedCallCenters(e) {
    var callcenters = JSON.parse(e.CallCenter);

    var cc = '';

    for (var i = 0; i < callcenters.length; i++) {
        var color = '';
        cc += '<li class="list-group-item" style="background-color: #f0ad4e;border: 1px solid #eea236;" >' + callcenters[i].Description + '</li>';
    }
    cc = '<ul class="list-group">' + cc + '</ul>';
    return cc;
}

function solveJsonConnectedBrokers(e) {
    var brokers = JSON.parse(e.Brokers);

    var cc = '';

    for (var i = 0; i < brokers.length; i++) {
        var color = '';
        cc += '<li class="list-group-item" style="background-color: #f0ad4e;border: 1px solid #eea236;" >' + brokers[i].Broker + '</li>';
    }
    cc = '<ul class="list-group">' + cc + '</ul>';
    return cc;
}


//#endregion
//#region contact data functions
function getContactData(personId, el) {
    $.get("/api/Person/GetContactInfo/" + personId)
        .then(function (res) {
            openContact(personId, res, el);
        }, function (res) {
            kendoConsole.log(res.responseText, "error");
        });
    return false;
}

function openContact(personId, data, el) {
    var content = "";
    var isMobile = 'ontouchstart' in window;
    $.each(data.data, function (k, v) {
        if (v.linktype) {
            var attr = "";
            if (v.linktype == 'http://') {
                if (v.rif.match(/^https?:\/\//))
                    v.linktype = "";
                attr = " target='_blank'"
            }
            content += "<a href='{0}{1}' title='{1}'{3} style='margin: 10px;' class='btn btn-lg'><i class='fa fa-{2} fa-2x'></i></a>".format(v.linktype, v.rif, v.icon, attr);
        }
    });
    if (!content) {
        openEmptyContact(personId, data, el);
        return;
    }

    var modal = new kendo.mobile.ui.ModalView('<div style="margin-left: 1px;"><div style="padding: 10px;"><h3>' + data.FullDescription + '</h3><div class="text-center">' + content + '</div></div></div>', {
        modal: false
    });
    modal.open();
}

function openEmptyContact(personId, data, el) {
    var isMobile = 'ontouchstart' in window;
    var html = '<ul>' +
        '<li class="km-actionsheet-title show-always">' + getObjectText('contactDataMissing').format(data.FullDescription) + '</li>' +
        '<li><a href="\\#" class="k-button insert-data">' + getObjectText('insertThem') + '</a></li>' +
        '</ul>';
    var actionSheet = new kendo.mobile.ui.ActionSheet(html, {
        type: isMobile ? "auto" : "phone",
        cancelTemplate: '<li><a class="k-button" href="\\#">' + getObjectText('cancel') + '</a></li>',
        close: function () {
            this.destroy();
        },
        isDesktop: !isMobile,
        command: function (e) {
            if ($(e.currentTarget).hasClass("insert-data")) {
                var location, gridName, funcID;
                switch (data.PersonTypeCode) {
                    case 'CLI':
                        gridName = "V_Person_CLI";
                        funcID = 53;  //TODO: correggere ID
                        location = "/app#/function/65-4-Clienti";
                        break;
                    case 'POT':
                        gridName = "V_Person_POT";
                        funcID = 2181; //TODO: correggere ID
                        location = "/app#/function/4378-1015-Clienti-potenziali"; //TODO: correggere ID
                        break;
                    default:
                        return;
                }

                if (el && window.location.pathname + window.location.hash == location) {
                    openContactEdit($(el).closest('tr[data-uid]'));
                    return;
                }

                setSessionStorageGridFilters(gridName, funcID, { field: 'FullDescription', operator: 'eq', value: data.FullDescription, type: "anagraFilter" })
                window.location = location;

                $("#appcontainer").one("kendoGridRendered", function (event, grid, gridid) {
                    grid.one("dataBound", function (e) {
                        $.each(grid.dataSource.data(), function (k, v) {
                            if (v.Person_ID == personId) {
                                openContactEdit(grid.tbody.find('tr[data-uid="' + v.uid + '"]'));
                                return;
                            }
                        });
                    });
                });
            }
        }
    });

    actionSheet.open();
}

function openContactEdit($row) {
    $row.find('.k-hierarchy-cell .k-icon.k-plus').trigger("click");
    //$row.next('.k-detail-row').find('.k-tabstrip-items > li[containedgridclass=V_ANARIF]').trigger("click");
}
//#endregion
function dropDownListOnChange(e) {
    e.container = [$(e.sender.wrapper).closest(".k-edit-form-container")];
    onChangeFieldmanageStageConstraints(e, e.sender.element.attr("name"), $("tr[data-uid=" + e.container[0].parent().data().uid + "]").closest('div .k-grid'));

}

function manageStageInCellConstraints(item, gridcode, gridentity, onChangeField, action) {
    var deferred = $.Deferred();
    if (!(action == "remove" || action == "add" || action == "itemchange")) {
        deferred.resolve();
        return deferred.promise();
    }
    var data = item;
    var stageid = null;

    for (var prop in data) {
        //se e' il campo di stage
        if (data.hasOwnProperty(prop) && prop.indexOf("EV_STAGE_ID") !== -1) {
            stageid = data[prop];
            break;
        }
    }
    //ask the DB for value changes
    var ds = buildXMLStoredProcedureJSONDataSource({ stageid: stageid, gridname: gridcode, gridentity: gridentity, data: data, onChangeField: onChangeField, incellaction: action }, function (fields) {
        $(fields.items).each(function (i, v) {
            item[v.ColumnName] = v.defaultvalue;
            item.dirty = true;
        });
        deferred.resolve(fields);
    }, "Base.Get_GridsEditBehaviour");
    ds.read();
    return deferred.promise();
}
function manageStageConstraints(e, gridcode, gridentity, onChangeField) {


    var defer = $.Deferred();
    var data = e.model;
    window.gridineditdatasourcemodel = e.model;
    var stageid = null;
    for (var prop in data) {
        //se e' il campo di stage
        if (data.hasOwnProperty(prop) && prop.indexOf("EV_STAGE_ID") !== -1) {
            stageid = data[prop];
            break;
        }
    }
    //chiedo al DB quali siano i vincoli per lo stage trovato
    var ds = buildXMLStoredProcedureJSONDataSource({ stageid: stageid, gridname: gridcode, gridentity: gridentity, data: data, onChangeField: onChangeField }, function (res) {
        $(res.items).each(function (i, v) {
            detectWidgetTypeAndOverrideBehaviour(v.ColumnName, v.required, v.editable, v.defaultvalue, v.hidden, v.DetailDOMID, e, v.label);
        });
        defer.resolve(res.items);
    }, "Base.Get_GridsEditBehaviour");
    ds.transport.async = false;
    ds.read();
    return defer.promise();
}

function prerenderdispatcher(grid, functionname, e, gridselector) {
    query_for_template_document(grid);

    //require([window.includesVersion + "/Custom/1/Scripts/Wms.js"], function () { });

    switch (grid.gridcode) {
        case "v_ResponseSummary":
            //alert(window.Request_ID);
            break;
        case "Magic_Mmb_Users":
            if (window.UserIsDeveloper == "True") {
                grid.columns.push({ command: { text: getObjectText("loginAs"), click: loginAs }, title: "", width: "90px" });
            }
            break;
        case "DocumentBasePosition_OFV":
        case "DocumentBasePosition":
        case "DocumentBasePosition_ORA":
        case "DocumentBasePosition_FP":
        case "ProjectBillingMethod":
            //include il manager prime con la gestione degli eventi di change
            //require([window.includesVersion + "/Custom/1/Scripts/PopUpValuesHandler.js"], function () { });
            var origedit = grid.edit;
            grid.edit = function (e) {
                origedit.call(this, e);
                var jContainer = e.container;
                //aggiungo la gestione dell'  evento "spin" (variazione numerictextbox da "freccia") 
                kendo.widgetInstance(jContainer.find("[name=Quantity]")).bind("spin", UpdatePriceOnFieldChange);
                kendo.widgetInstance(jContainer.find("[name=UnitAmount]")).bind("spin", UpdatePriceOnFieldChange);
                kendo.widgetInstance(jContainer.find("[name=Discount]")).bind("spin", UpdatePriceOnFieldChange);
                kendo.widgetInstance(jContainer.find("[name=PriceUnit]")).bind("spin", GetPriceAttributeSpin);
            };
            break;
        case "DocumentBasePositionS":
        case "DocumentBasePosition_OFVS":
        case "DocumentBasePosition_ORAS":
        case "DocumentBasePosition_FPS":
            //Switch a tab posizioni prodotti a magazzino per Prime_Tecnonext
            if (window.ApplicationInstanceName == "prime_tecnonext") {
                switch (functionname) {
                    case "Sales offers":
                        $('li[data-guid="4e0361d9-321f-46a1-9ac4-42a213ed0054"]').click();
                        break;

                    case "Sales orders":
                        $('li[data-guid="a4c2f3b9-b756-4fd0-9269-153eaecc04d4"]').click();
                        break;

                    case "Purchase orders":
                        $('li[data-guid="140c3921-6b4f-480d-ac04-42959d423d4a"]').click();
                        break;

                    case "Sales invoices":
                        $('li[data-guid="09da4fde-b5be-45a9-a6a6-0a5c41fbad45"]').click();
                        break;

                    case "Purchase invoices":
                        $('li[data-guid="120095bd-e2da-4808-923a-40561f473d7d"]').click();
                        break;

                    case "DocumentBase_RF":
                        $('li[data-guid="929281f8-6e4b-4098-845e-a1d2c753e240"]').click();
                        break;

                    case "Electronic invoices":
                        $('li[data-guid="dd15db71-2b54-484f-94d9-d8b2d6452685"]').click();
                        break;
                }
            }

            //include il manager prime con la gestione degli eventi di change
            //require([window.includesVersion + "/Custom/1/Scripts/PopUpValuesHandler.js"], function () { });
            var origedit = grid.edit;
            grid.edit = function (e) {
                origedit.call(this, e);
                var jContainer = e.container;
                //aggiungo la gestione dell'  evento "spin" (variazione numerictextbox da "freccia") 
                kendo.widgetInstance(jContainer.find("[name=Quantity]")).bind("spin", UpdatePriceOnFieldChange);
                kendo.widgetInstance(jContainer.find("[name=UnitAmount]")).bind("spin", UpdatePriceOnFieldChange);
                kendo.widgetInstance(jContainer.find("[name=Discount]")).bind("spin", UpdatePriceOnFieldChange);
                if (functionname == "DocumentBase_RF")
                    e.container.find("[name='Project_ID']").prop('required', false);
            };
            break;

        case "ProjectExpenses":
        case "ProjectExpenses_Resp":
            //require([window.includesVersion + "/Custom/1/Scripts/PopUpValuesHandler.js"], function () { });
            var origedit = grid.edit;
            grid.edit = function (e) {
                origedit.call(this, e);
                var jContainer = e.container;
                //aggiungo la gestione dell'  evento "spin" (variazione numerictextbox da "freccia") 
                kendo.widgetInstance(jContainer.find("[name=Quantity]")).bind("spin", UpdatePriceOnQuantityChangeOnProjectExpenses);
                kendo.widgetInstance(jContainer.find("[name=UnitaryAmount]")).bind("spin", UpdatePriceOnUnitAmountChangeOnProjectExpenses);
            };
            break;
        case "ProjectBillingMethod":
            //include il manager prime con la gestione degli eventi di change
            //require([window.includesVersion + "/Custom/1/Scripts/PopUpValuesHandler.js"], function () { });
            var origedit = grid.edit;
            grid.edit = function (e) {
                origedit.call(this, e);
                var jContainer = e.container;
                //aggiungo la gestione dell'  evento "spin" (variazione numerictextbox da "freccia") 
                kendo.widgetInstance(jContainer.find("[name=Quantity]")).bind("spin", UpdatePriceOnFieldChange);
                kendo.widgetInstance(jContainer.find("[name=UnitAmount]")).bind("spin", UpdatePriceOnFieldChange);
                kendo.widgetInstance(jContainer.find("[name=Discount]")).bind("spin", UpdatePriceOnFieldChange);
            };
            break;
        case "V_Project":
        case "V_Project_INT":
        case "V_Project_EXT":
        case "Worksheet":
        case "WorkSheet_Closed":
            var orig_dataBound__ = grid.dataBound;
            grid.dataBound = function (e) {
                $('.gauge').each(function (i, v) {
                    $(v).kendoLinearGauge({
                        pointer: {
                            value: $(v).attr("value"),
                            shape: "arrow"
                        },
                        scale: {
                            majorUnit: 20,
                            minorUnit: 10,
                            min: -100,
                            max: 100,
                            vertical: false,
                            labels: { visible: false },
                            ranges: [
                                {
                                    from: -100,
                                    to: 0,
                                    color: "#ff0000"
                                }, {
                                    from: 0,
                                    to: 100,
                                    color: "#3cb371"
                                }
                            ]
                        }
                    });
                })
                orig_dataBound__.call(this, e);
            }

            break;

        case "PhoneContractWizard":
            //Data bound (evento chiamato all' arrivo dei dati) per gestire lo show/hide dei pulsanti sulla base della funzione e dei dati / profili
            var orig_dataBound__ = grid.dataBound;
            grid.dataBound = function (e) {
                // var $takecharge = e.sender.element.find("div.k-header.k-grid-toolbar #takecharge_DOM");
                var $contractGroupButt = e.sender.element.find("div.k-header.k-grid-toolbar #contractgroup_dom");
                var $InsertionFinished = e.sender.element.find("div.k-header.k-grid-toolbar #InsertionFinished_DOM");
                var $deleteButton = e.sender.element.find("div.k-header.k-grid-toolbar #ContractDelete_But");
                $(document).ready(function () {
                    $('#div1 input[name="btn1"]').val('test hello');
                });
                switch (getCurrentFunctionGUID()) {
                    case "d4ad7284-39b2-4819-a2fa-c4e7f6686e7a": //Nuovo Contratto
                        //    $takecharge.remove(); //take charge
                        $InsertionFinished.remove();
                        $contractGroupButt.remove(); //creazione distinte
                        $deleteButton.remove();
                        break;
                    //case "0ea66ba9-56a4-40cb-b5f2-ae25137923a3": //Presa in carico
                    //   $InsertionFinished.remove(); //fine inserimento
                    //  $contractGroupButt.remove(); //creazione distinte
                    // break;
                    case "3f1a8ad6-7f73-457e-a64e-d31f06e0484e": //Gestione Distinte
                        //    $takecharge.remove(); //take charge
                        $InsertionFinished.remove(); //fine inserimento
                        //refresh the shipmentgroupGrid if it exists
                        if ($("#grid2[gridname=PhoneContractShipmentGroup]").data("kendoGrid"))
                            $("#grid2[gridname=PhoneContractShipmentGroup]").data("kendoGrid").dataSource.read();
                        break;
                }




                orig_dataBound__.call(this, e);


                //Customizzazione visualizzazione errori
                var columns = e.sender.columns;
                // iterate the table rows and apply custom row and cell styling
                var rows = e.sender.tbody.children();
                for (var j = 0; j < rows.length; j++) {
                    var row = $(rows[j]);
                    var dataItem = e.sender.dataItem(row);

                    var errorNoOffer = (dataItem.get("PhoneLineOffer_ID") == null);

                    if (errorNoOffer) {
                        row.addClass("mf-row-grid-in-error");
                    }

                }


            }

            break;
        case 'Application':

            var orig_dataBound__ = grid.dataBound;
            grid.dataBound = function (e) {
                var columns = e.sender.columns;
                // iterate the table rows and apply custom row and cell styling
                var rows = e.sender.tbody.children();
                for (var j = 0; j < rows.length; j++) {
                    var row = $(rows[j]);
                    var dataItem = e.sender.dataItem(row);

                    var errorNoOffer = (dataItem.get("ApplicationCount") > 1);

                    if (errorNoOffer) {
                        row.addClass("mf-row-grid-in-error");
                    }
                }


            }


            break

        case 'WorkAgreement':



            var orig_dataBound__ = grid.dataBound;
            grid.dataBound = function (e) {
                var columns = e.sender.columns;
                // iterate the table rows and apply custom row and cell styling
                var rows = e.sender.tbody.children();
                for (var j = 0; j < rows.length; j++) {
                    var row = $(rows[j]);
                    var dataItem = e.sender.dataItem(row);

                    var errorNoPerson = (!(dataItem.get("Person_ID")));

                    if (errorNoPerson) {
                        row.addClass("mf-row-grid-in-error");
                    }
                }

            }
            break
        case "V_PhoneSIM":
            var origedit = grid.edit;

            grid.edit = function (e) {
                var kGrid = e.sender;
                if (e.model.isNew()) {
                    if (getWizardScope(kGrid.magicFormScope)) {
                        var wholeModel = getWizardScope(kGrid.magicFormScope).models;
                        var model = wholeModel.PhoneContractWizard;
                        if (model.MaxSIMs) {
                            var totalRecords = kGrid.dataSource.data().length;
                            if (totalRecords > model.MaxSIMs) {
                                kGrid.cancelRow();
                                e.preventDefault();
                                kendoConsole.log("Il numero massimo di SIM vendibili per questa offerta ?  {0}!".format(model.MaxSIMs), 'error');
                                return;
                            }
                        }
                        if (isVodafoneNOTEditable(wholeModel)) {
                            kGrid.cancelRow();
                            e.preventDefault();
                            kendoConsole.log("Le sim non sono piu aggiungibili!", 'error');
                            return;
                        }
                    }


                }
                origedit.call(this, e);

            };
            let scope = $("div[wizard-code='CRMZenit']").scope().$$childTail;
            let wizardScope = getWizardScope(scope)
            if (wizardScope) {
                let wizardModel = wizardScope.models;

                if (isVodafoneNOTEditable(wizardModel)) {
                    grid.columns[0].command = grid.columns[0].command.filter(item => (item.name == 'destroy'));
                    console.log(grid.columns[0].command)//	grid.columns
                }
            }
            break;

        case "PhoneContract_FrontOffice":
            var orig_dataBound__ = grid.dataBound;
            grid.dataBound = function (e) {
                // var $takecharge = e.sender.element.find("div.k-header.k-grid-toolbar #takecharge_DOM");
                var $InsertionFinished = e.sender.element.find("div.k-header.k-grid-toolbar #InsetionFInished_DOM");
                var $selectAll = e.sender.element.find("div.k-header.k-grid-toolbar input[title='Seleziona tutti']");

                switch (getCurrentFunctionGUID()) {
                    case "d4ad7284-39b2-4819-a2fa-c4e7f6686e7a": //Nuovo Contratto
                        //    $takecharge.remove(); //take charge
                        $selectAll.remove();
                        $InsertionFinished.remove();
                        break;

                }




                orig_dataBound__.call(this, e);


                //Customizzazione visualizzazione errori
                var columns = e.sender.columns;
                // iterate the table rows and apply custom row and cell styling
                var rows = e.sender.tbody.children();
                for (var j = 0; j < rows.length; j++) {
                    var row = $(rows[j]);
                    var dataItem = e.sender.dataItem(row);

                    var errorNoOffer = (dataItem.get("PhoneLineOffer_ID") == null);

                    if (errorNoOffer) {
                        row.addClass("mf-row-grid-in-error");
                    }

                }


            }
            break;

        case "Logon_vwtestataOrdini_Grid":
            var orig_dataBound__ = grid.dataBound;
            grid.dataBound = function (e) {
                e.sender.element.find("div.k-header.k-grid-toolbar").find("a.autoResize").trigger("click");
            }
            break;
        case "TargetKPIResult":
        case "TargetKPIResult_TeamLeader":
        case "VM_ProductionResponsable":
        case "V_TutorProgress":
            var orig_dataBound__ = grid.dataBound;
            grid.dataBound = function (e) {
                e.sender.element.find('.magicGridTd').removeAttr('style').css("max-height", "500px");
            }
            break;

        case "WorksheetRecurringActivitiy_List":
            var origedit = grid.edit;
            grid.edit = function (e) {
                origedit.call(this, e);
                var jContainer = e.container;
                //aggiungo la gestione dell'  evento "spin" (variazione numerictextbox da "freccia") 
                kendo.widgetInstance(jContainer.find("[name=FinalSellPrice]")).bind("spin", getFinalPrice);
                kendo.widgetInstance(jContainer.find("[name=Discount]")).bind("spin", getFinalPrice);
            };
            break;
        case "V_WorkAgreementValuation":
        case "V_WorkAgreementValuationSupervisor":
            grid.columns[0].locked = true;
            grid.columns[1].locked = true;
            grid.columns[2].locked = true;
            grid.columns[3].locked = true;
            grid.columns[4].locked = true;
            grid.columns[5].locked = true;
            grid.columns[6].locked = true;
            grid.columns[7].locked = true;
            if (grid.gridcode == "V_WorkAgreementValuationSupervisor")
                grid.columns[8].locked = true;
            else {
                //Customizzazione visualizzazione errori
                grid.dataBound = function (e) {
                    var columns = e.sender.columns;
                    // iterate the table rows and apply custom row and cell styling
                    var rows = e.sender.tbody.children();
                    for (var j = 0; j < rows.length; j++) {
                        var row = $(rows[j]);
                        var dataItem = e.sender.dataItem(row);

                        var errorNoOffer = (dataItem.get("SuggestionFestivity") == 1);



                        if (errorNoOffer) {
                            var selectedRow = $("tr[data-uid='" + dataItem.uid + "']");
                            selectedRow.addClass("mf-row-grid-in-error-background");
                        }

                    }
                }
            }

            break;
        default:
            break;
    }
    var origedit__ = grid.edit;
    //#region dataBase edit manipulation
    grid.edit = function (e) {
        var defVal_model_fn = function (defaultValue) {
            if (defaultValue.indexOf("{") != -1)
                return JSON.parse(defaultValue).value;
            else
                return defaultValue;

        }
        var gridcode = grid.gridcode;
        var gridentity = grid.EntityName;
        e.entityName = gridentity;
        e.xmlFieldsToAlter = {};
        var defvals = {};
        manageStageConstraints.call(this, e, gridcode, gridentity).then(function (items) {
            $(items).each(function (i, v) {
                if (v.IsXml)
                    e.xmlFieldsToAlter[v.ColumnName] = { columnname: v.ColumnName, required: v.required, editable: v.editable, defvalue: v.defaultvalue, hide: v.hidden, label: v.label };
                if (v.EV_DEFAULT_VALUE && e.model.isNew()) {
                    e.model.set(v.ColumnName, defVal_model_fn(v.defaultvalue));
                    defvals[v.ColumnName] = { value: defVal_model_fn(v.defaultvalue), editable: v.editable };
                }
            });
            if (origedit__ != null) {
                var promise = origedit__.call(this, e);
                try {
                    if (promise) //gestione delle cascade + valori impostati da DB per le drop down
                        $.when(promise).then(function (selectDataBounds) {
                            var all = function (array) {
                                var deferred = $.Deferred();
                                var fulfilled = 0, length = array.length;
                                var results = [];

                                if (length === 0) {
                                    deferred.resolve(results);
                                } else {
                                    array.forEach(function (promise, i) {
                                        $.when(promise).then(function (value) {
                                            results[i] = value;
                                            fulfilled++;
                                            if (fulfilled === length) {
                                                deferred.resolve(results);
                                            }
                                        });
                                    });
                                }

                                return deferred.promise();
                            };
                            var promisesarray = []
                            $.each(selectDataBounds, function (i, v) { promisesarray.push(v) });
                            //when all the FK data has been loaded into the form 
                            $.when(all(promisesarray)).then(function (results) {
                                setTimeout(function () {
                                    $.each(defvals, function (k, v) {
                                        if (e.container.find("input[name=" + k + "]").data("kendoDropDownList")) {
                                            e.container.find("input[name=" + k + "]").data("kendoDropDownList").value(defvals[k].value);
                                            //hide the validation tooltips...it has a value!
                                            e.container.find("input[name=" + k + "]").closest("div.k-edit-field").find('span.k-tooltip-button').find('a.k-icon.k-i-close').trigger('click');
                                            if (!defvals[k].editable)
                                                e.container.find("input[name=" + k + "]").data("kendoDropDownList").enable(false);
                                        }
                                    });
                                }, 1000);
                            });


                        });
                }
                catch (ex) {
                    console.log(ex);
                }
            }
        });
    }

    //#endregion

    return;
}
function isVodafoneNOTEditable(wholeModel) {
    var provider_id = wholeModel.PhoneContractWizard.Provider_ID;
    var creationDate = null;
    if (wholeModel.WizardInfo) {
        creationDate = new Date(wholeModel.WizardInfo.CreationDate);
    }
    var hours = null;
    if (creationDate == null) {
        hours = 0;
    } else {
        hours = Math.abs(new Date() - creationDate) / 36e5;
    }

    return (provider_id == 3 && hours >= 1);

}


function postrenderdispatcher(grid, functionname, e) {
    if (grid.gridcode === "PM_ANAHIS") {
        var ss = document.createElement("link");
        ss.type = "text/css";
        ss.rel = "stylesheet";
        ss.href = "/Views/1/Styles/prohis.css";
        document.getElementsByTagName("head")[0].appendChild(ss);
    };
    return;
}

//#region INVOICES    
function buildInvoice(e) {
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
    //FA: Riordino i campi che mi servono per verificare la presenza dei dati delle fatture e per la loro eventuale creazione
    var alldata = $.map(selecteddata, function (v, i) {
        return { ID: targetgrid.dataItem(v).ID, Number: targetgrid.dataItem(v).Number, Code: targetgrid.dataItem(v).Code, Date: targetgrid.dataItem(v).Date };
    });
    checkInvoiceData(alldata).then(function (res) {

        $.each(res[0], function (k, v) {
            if (res[0][k].correct) //Creo il datapayload solo per le fatture che hanno tutti i dati essenziali
                datapayload.push(res[0][k]);

        });
        if (datapayload.length > 0) { // Non chiamo il C# se non ci sono fatture valide da creare
            doModal(true);
            $.ajax({
                type: "POST",
                url: "/api/INVOICE/BuildInvoice/",
                data: JSON.stringify({ models: datapayload, outputPath: jsonpayload.outputPath, reportName: jsonpayload.reportName, electronic: jsonpayload.electronic }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    kendoConsole.log(getObjectText("Invoicesbuilt"), false);
                    $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
                    doModal(false);
                },
                error: function (message) {
                    doModal(false);
                    kendoConsole.log(message.responseText, true);
                }
            });
        }
        $.each(res[0], function (k, v) { // Qualora ci fossero fatture non valide do una visualizzazione  dei problemi per ogni singola fattura
            if (!(res[0][k].correct))
                kendoConsole.log(res[0][k].err, true);

        });

    })
    //outputPath will be added to standard file upload directory (application root if the directory Rootdirforupload is not defined)
    //The reports will be created in root + outputPath
}


function evomaticReading(e) {
    //outputPath will be added to standard file upload directory (application root if the directory Rootdirforupload is not defined)
    //The reports will be created in root + outputPath
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
    doModal(true);
    $.ajax({
        type: "POST",
        url: "/api/ServiceWrapper/Evomaticreading/",
        data: JSON.stringify({ models: datapayload, connectionType: jsonpayload.action }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log(result.message, false);
            $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
            doModal(false);
        },
        error: function (message) {
            doModal(false);
            kendoConsole.log(message.responseText, true);
        }
    });
}



function downloadDataSheet(e) {
    //outputPath will be added to standard file upload directory (application root if the directory Rootdirforupload is not defined)
    //The reports will be created in root + outputPath
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
    if (selecteddata.length > 1) {
        kendoConsole.log(getObjectText("selectonerow"), true);
        return;
    }
    else if (!selecteddata.length) {
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
    var obj = {};
    obj.ID = datapayload[0].id;
    $.fileDownload('/api/SchriftArt/GetDataSheet/', { data: obj, httpMethod: "POST" });
}

function buildElectronicInvoice(e) {
    var key = !(e.id) ? e.className : e.id;
    var targetgrid = getGridFromToolbarButton(e);
    jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);

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
    var datapayload = [];
    //if (selecteddata.length > 0) {
    //	for (var i = 0; i < selecteddata.length; i++) {
    //		datapayload.push(targetgrid.dataItem(selecteddata[i]));
    //	}
    //}
    //FA: Riordino i campi che mi servono per verificare la presenza dei dati delle fatture e per la loro eventuale creazione
    var alldata = $.map(selecteddata, function (v, i) {
        return { ID: targetgrid.dataItem(v).ID, Number: targetgrid.dataItem(v).Number, Code: targetgrid.dataItem(v).Code, Date: targetgrid.dataItem(v).Date, InvoiceCopy: targetgrid.dataItem(v).InvoiceCopy, ModifiedUser_ID: targetgrid.dataItem(v).ModifiedUser_ID };
    });
    checkInvoiceData(alldata).then(function (res) {

        $.each(res[0], function (k, v) {
            if (res[0][k].correct) //Creo il datapayload solo per le fatture che hanno tutti i dati essenziali
                datapayload.push(res[0][k]);

        });

        if (datapayload.length > 0) { // Non chiamo il C# se non ci sono fatture valide da creare
            doModal(true);

            if (datapayload[0].InvoiceCopy) { //FA #5961: Chiave in settings che determina la generazione o meno della copia di cortesia
                $.ajax({
                    type: "POST",
                    url: "/api/FatEle/getFatEle/",
                    data: JSON.stringify({ models: datapayload, outputPath: jsonpayload, reportName: jsonpayload.reportName }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        kendoConsole.log(getObjectText("Invoicesbuilt"), false);
                        $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
                        doModal(true);
                        $.ajax({
                            type: "POST",
                            url: "/api/INVOICE/BuildInvoice/",
                            data: JSON.stringify({ models: datapayload, outputPath: jsonpayload.outputPath, reportName: datapayload[0].ReportName, electronic: jsonpayload.electronic }),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function (result) {
                                kendoConsole.log(getObjectText("InvoicesDocumentBuilt"), false);
                                $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
                                doModal(false);
                            },
                            error: function (message) {
                                doModal(false);
                                kendoConsole.log(message.responseText, true);
                            }
                        });
                        doModal(false);
                    },
                    error: function (message) {
                        doModal(false);
                        kendoConsole.log(message.responseText, true);
                    }
                });
            }
            else {//FA #5961: Chiave in settings = 0, genero solo la fattura elettronica e non la copia di cortesia
                $.ajax({
                    type: "POST",
                    url: "/api/FatEle/getFatEle/",
                    data: JSON.stringify({ models: datapayload, outputPath: jsonpayload, reportName: jsonpayload.reportName }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        kendoConsole.log(getObjectText("Invoicesbuilt"), false);
                        doModal(false);
                    },
                    error: function (message) {
                        doModal(false);
                        kendoConsole.log(message.responseText, true);
                    }
                });
            }

        }
        $.each(res[0], function (k, v) { // Qualora ci fossero fatture non valide do una visualizzazione  dei problemi per ogni singola fattura
            if (!(res[0][k].correct))
                kendoConsole.log(res[0][k].err, true);

        });
    });
}

function SendElectronicInvoice(e) {
    var key = !(e.id) ? e.className : e.id;
    var targetgrid = getGridFromToolbarButton(e);
    jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
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
    var datapayload = [];

    var alldata = $.map(selecteddata, function (v, i) {
        return { ID: targetgrid.dataItem(v).ID, Number: targetgrid.dataItem(v).Number, Code: targetgrid.dataItem(v).Code, Date: targetgrid.dataItem(v).Date, Action: "sending" };
    });
    checkInvoiceData(alldata).then(function (res) {

        $.each(res[0], function (k, v) {
            if (res[0][k].correct) //Creo il datapayload solo per le fatture che hanno tutti i dati essenziali
                datapayload.push(res[0][k]);

        });

        if (datapayload.length > 0) { // Non chiamo il C# se non ci sono fatture valide da creare
            doModal(true);
            $.ajax({
                type: "POST",
                url: "/api/FattureElettroniche/SendFatturaSvc/",
                data: JSON.stringify({ models: datapayload, outputPath: jsonpayload.outputPath }),
                contentType: "application/json; charset=utf-8",
                //dataType: "json",
                success: function (result) {
                    kendoConsole.log(getObjectText("Invoicessent"), false);
                    $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
                    doModal(false);
                },
                error: function (message) {
                    doModal(false);
                    kendoConsole.log(message.responseText, true);
                }
            });
        }
        $.each(res[0], function (k, v) { // Qualora ci fossero fatture non valide do una visualizzazione  dei problemi per ogni singola fattura
            if (!(res[0][k].correct))
                kendoConsole.log(res[0][k].err, true);

        });
    });
}

//function hideTab(value, formItems, scope) {
//    //hides the tab of the previous contract subscriber person (tab 2.8) in the wizard
//    var wizardScope = getWizardScope(scope),
//        subscriberShown = wizardScope.models.PhoneContractWizard.OldOwner,
//        t_phoneContractType_ID = wizardScope.models.PhoneContractWizard.T_PhoneContractType_ID ; 

//    if (subscriberShown == 1 && t_phoneContractType_ID == 2 ) {
//        delete wizardScope.settings.steps[2].hidden;
//    } else {  
//        wizardScope.settings.steps[2].hidden = true;
//    }

//    wizardScope.$broadcast('schemaFormValidate');
//}

function GetCityDetails(e, formItems, scope, element) {
    if (!scope) {
        return;
    }



    var stepKey = element.closest("[data-step-key]").data("stepKey");

    if (stepKey != "Legal_V_Address_Z") {
        var legalCity_ID;

        if (scope.$parent.models.Legal_V_Address_Z && scope.$parent.models.Legal_V_Address_Z.City_ID) {
            legalCity_ID = scope.$parent.models.Legal_V_Address_Z.City_ID;
            if (legalCity_ID == e) {
                return;
            }
        }

    } else {
        var providerCity_ID;

        if (scope.$parent.models.Provider_V_Address_Z && scope.$parent.models.Provider_V_Address_Z.City_ID) {
            providerCity_ID = scope.$parent.models.Provider_V_Address_Z.City_ID;
            if (providerCity_ID = e)
                return;
        }

    }

    var model = scope.model;
    var Description;
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "HR.GetCityDetails", data: { City_ID: model.City_ID } }).then(function (res) {
            model.PostalCode = res[0][0].PostalCode;

            model.dirty = true;
        })
    });
}

function getInputItem(formItems, fieldName) {
    if (formItems != null) {
        for (var rowKey = 0; rowKey < formItems.length; rowKey++) {
            for (var colKey = 0; colKey < formItems[rowKey].items.length; colKey++) {
                if (formItems[rowKey].items[colKey].items[0].key[0] == fieldName) {
                    return formItems[rowKey].items[colKey].items[0];
                    break;
                }
            }
        }
    }
}

function populatePhoneLineOffers(value, formItems, scope, element, $timeout) {
    var input = getInputItem(formItems, "PhoneLineOffer_ID"),
        filters = [],
        requestKey = new Date().getTime() + "-" + Math.random().toString(36).substring(7);

    scope.requestKeys["PhoneLineOffer_ID"] = requestKey;

    if (scope.model.Provider_ID)
        filters.push({ field: "CampaignProvider_ID", operator: "eq", value: scope.model.Provider_ID });
    if (scope.model.CoverageType_ID)
        filters.push({ field: "CoverageType_ID", operator: "eq", value: scope.model.CoverageType_ID });
    if (scope.model.T_PhoneLineOfferType_ID)
        filters.push({ field: "T_PhoneLineOfferType_ID", operator: "eq", value: scope.model.T_PhoneLineOfferType_ID });
    if (scope.model.ID && scope.model.ID > 0) {
        filters.push({ field: "fromDate", operator: "le", value: new Date(scope.model.PhoneContractDate + "Z").toISOString() });
        filters.push({ field: "toDate", operator: "ge", value: new Date(scope.model.PhoneContractDate + "Z").toISOString() });
    } else {
        filters.push({ field: "fromDate", operator: "le", value: new Date().toISOString() });
        filters.push({ field: "toDate", operator: "ge", value: new Date().toISOString() });
    }

    //get new values
    GetDropdownValues("V_PhoneLineOffer_Drop", "ID", "Description", "Crm", null, filters.length ? { filters: filters, logic: "and" } : null, true)
        .then(function (res) {
            if (res && scope.requestKeys["PhoneLineOffer_ID"] == requestKey) {
                input.titleMap = [];
                var vals = [];
                $.each(res, function (k, v) {
                    var val = parseInt(v.value);
                    input.titleMap.push({
                        value: val,
                        name: v.text
                    });
                    vals.push(val);
                });
                if (vals.length)
                    scope.schema.properties.PhoneLineOffer_ID.enum = vals;
            }
            $timeout();
        });
}

function populatePhoneLineOfferOptions(value, formItems, scope, element, $timeout, columnName) {
    var input = getInputItem(formItems, "PhoneLineOfferOptions"),
        filters = value ? { field: "PhoneLineOffer_ID", operator: "eq", value: value } : null,
        requestKey = new Date().getTime() + "-" + Math.random().toString(36).substring(7);

    scope.requestKeys["PhoneLineOfferOptions"] = requestKey;
    scope.model.PhoneLineOfferOptions = scope.model.PhoneLineOfferOptions || [];
    if (!$.isArray(scope.model.PhoneLineOfferOptions))
        scope.model.PhoneLineOfferOptions = [scope.model.PhoneLineOfferOptions];

    //get new values
    GetDropdownValues("PhoneLineOption", "ID", "Description", "Crm", null, filters, true)
        .then(function (res) {
            input.titleMap = [];
            var values = [];
            if (res && scope.requestKeys["PhoneLineOfferOptions"] == requestKey) {
                $.each(res, function (k, v) {
                    var val = parseInt(v.value);
                    input.titleMap.push({
                        value: val,
                        name: v.text
                    });
                    values.push(val);
                });
            }
            var i = 0;
            while (i < scope.model.PhoneLineOfferOptions.length) {
                if (values.indexOf(scope.model.PhoneLineOfferOptions[i]) === -1)
                    scope.model.PhoneLineOfferOptions.splice(i, 1);
                else
                    i++;
            }
        });

    GetDropdownValues("PhoneLineOffer", "ID", "MaxSIMs", "Crm", null, { field: "ID", operator: "eq", value: value }, true)
        .then(function (res) {
            if (res.length) {
                if (scope.model.MaxSIMs != parseInt(res[0].text))
                    scope.model.MaxSIMs = parseInt(res[0].text);
            } else {
                scope.model.MaxSIMs = null;
            }
            return;

        });

    //requireConfigAndMore(["MagicSDK"], function (MF) {


    //    //MF.api.get({ table: "Crm.PhoneLineOffer", where: "ID = " + value }).then(function (res) {
    //    //    if (res.length) {
    //    //        if (scope.model.MaxSIMs != res[0].MaxSIMs)
    //    //            scope.model.MaxSIMs = res[0].MaxSIMs;
    //    //    } else {
    //    //        if (scope.model.MaxSIMs != null)
    //    //            scope.model.MaxSIMs = null;
    //    //    }
    //    //    return;
    //    //});
    //});

    //var wScope = getWizardScope(scope);
    //if (wScope) {
    //    var wModel = wScope.models;
    //    if (wModel[4].SIM) {
    //        wModel[4].SIM = [];
    //   }
    //}

    wizard_hideFieldsAndSteps(value, formItems, scope, element, $timeout, columnName);
}

function CallAssicom(e) {
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
        url: "/api/AssicomSoap/CallAssicom/",
        data: JSON.stringify({ models: datapayload, outputPath: jsonpayload.outputPath, service: jsonpayload.service }),
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

function FillAssicom(e) {
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
        url: "/api/Assicom/FillAssicom/",
        data: JSON.stringify({ models: datapayload, outputPath: jsonpayload.outputPath, service: jsonpayload.service }),
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



function generateVOForm(e) {
    cleanModal();
    var data = getRowDataFromButton(e);
    $("#wndmodalContainer .modal-content").html(getAngularControllerElement("VocalScriptLauncherController", { data: data, el: e, form: "Form_VocalOrder" }));
    $("#wndmodalContainer").modal('show');
}

function showQueryEdit(e) {
    $("#qb_wndmodalContainer").remove();
    var data = getRowDataFromButton(e);
    $("#appcontainer").append(getAngularControllerElement("QueryBuilderController", { data: data, el: e, containerWindowSelector: "#qb_wndmodalContainer" }));
    //$("#qb_wndmodalContainer").modal('show');

}


function showGenericModalConfirmationMonthAndYear(e, options) {
    $("#scc_wndmodalContainer").remove();
    $("#appcontainer").append(getAngularControllerElement("ShowConfirmationBasedOnMonthController", { el: e, options: options, containerWindowSelector: "#scc_wndmodalContainer" }));
    //$("#qb_wndmodalContainer").modal('show');
}

function showGenericModalConfirmationOrder(e, grid, filter) {
    $("#appcontainer").append(getAngularControllerElement("ShowConfirmationBasedOnOrderController", { el: e, grid: grid, filter: filter, containerWindowSelector: "#scc_wndmodalContainer" }));
}


function createReimbursementRequest(id) {
    var obj = {};
    obj.ID = id;
    $.fileDownload('/api/WLS/CreateReport/', { data: obj, httpMethod: "POST" });
}



//#endregion

////#region corsiformazione
//function planLessonInCalendar(e) {
//    e.preventDefault();

//    var grid = $(e.currentTarget).closest(".k-grid").data("kendoGrid");
//    var data = grid.dataItem($(e.currentTarget).closest("tr"));

//    var startDate = data.CORDAT_DATA_DAL;
//    var endDate = new Date(startDate);
//    endDate.setDate(endDate.getDate() + 7);

//    setCookie('calendarInterval', '{ "start": "' + startDate + '", "end": "' + endDate + '" }', 1);
//    SchedulerFunctionSearch();

//}
//function corsiFormazioneInviaRichiestaProdotti(e)
//{


//    $.ajax({
//        url: '/api/SKUMAG/ConfermaRichiestaGeneraOrdine',
//        type: 'POST',
//        datatype: 'json',
//        success: function (result) {
//            kendoConsole.log(result, false);
//            $("#grid").data("kendoGrid").dataSource.read();
//        },
//        error: function (result) {
//            kendoConsole.log(result, true);
//        }
//    });

//    return false;
//}
////#endregion




function execVocalOrder(e) {
    var storedprocedure = getRowStoredProcedure(e);
    var storedproceduredataformat = getRowStoreProcedureDataFormat(e);

    var jsonpayload = {};
    try {
        jsonpayload = getRowJSONPayload(e);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }
    var rowdata = getRowDataFromButton(e);
    //aggiunge ai dati di riga il payload impostato dall utente
    //D.t modified in order to prevent modifications of the grid's model  
    var mergeddata = jQuery.extend({}, rowdata, jsonpayload);
    //delete useless fields
    if ('defaults' in mergeddata)
        delete mergeddata.defaults;
    if ('fields' in mergeddata)
        delete mergeddata.fields;
    if ('_defaultId' in mergeddata)
        delete mergeddata._defaultId;

    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, sessionStorage.fid ? sessionStorage.fid : null, null, mergeddata, null);

    rebuildGenericModal();
    if (jsonpayload && (jsonpayload.form || jsonpayload.formMassiveUpdate == true)) {
        buildVocalOrderForm({ e: e, datatopost: datatopost, jsonpayload: jsonpayload, targetgrid: $(e.currentTarget).closest(".k-grid").data("kendoGrid"), storedprocedure: storedprocedure });
    }
    else {
        $("#executesave").click(function () {
            var data = datatopost;
            $.ajax({
                type: "POST",
                url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
                data: data,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    var msg = "OK";
                    var msgtype = false;
                    if (result.message !== undefined) {
                        msg = result.message;
                        if (result.msgtype == "WARN")
                            msgtype = "info";
                    }
                    kendoConsole.log(msg, msgtype);
                    refreshGridAfterButtonPress(e);
                    $("#wndmodalContainer").modal('toggle');
                },
                error: function (message) {
                    kendoConsole.log(message.responseText, true);
                }
            });
        });
        $("#wndmodalContainer").modal('toggle');
    }

}
function buildVocalOrderForm(buttondata) {
    var e = buttondata.e;
    var datatopost = buttondata.datatopost;
    var jsonpayload = buttondata.jsonpayload;
    var targetgrid = buttondata.targetgrid;
    var storedprocedure = buttondata.storedprocedure;
    var idObject = JSON.parse(buttondata.datatopost);
    var ID;
    if (idObject) {
        ID = idObject.ID
    }
    if (jsonpayload.formMassiveUpdate == true) {
        //if it's a massiveUpdate and the form/grid is not specified i get the container grid as a form base
        if (!jsonpayload.form)
            jsonpayload.form = targetgrid.wrapper.attr("gridname");
        //if a stored procedure is not specified i use the update default stored for the container grid
        if (!storedprocedure && targetgrid.dataSource.transport.options.CustomJSONParam)
            storedprocedure = JSON.parse(targetgrid.dataSource.transport.options.CustomJSONParam).update.Definition;
    }
    //check diritti utente
    isGridVisiblePromise(jsonpayload.form)
        .fail(function () {
            kendoConsole.log(getObjectText("missingrights"), true);
        })
        .then(function () {
            if (jsonpayload.formWide == true)
                $("#wndmodalContainer").addClass("modal-wide");
            var itemsPerRow = 2; //default
            var hideTabs = "false";
            if (jsonpayload.formItemsPerRow)
                itemsPerRow = jsonpayload.formItemsPerRow > 3 ? 3 : jsonpayload.formItemsPerRow;
            if (jsonpayload.formHideTabs)
                hideTabs = "true";
            requireConfigAndMore(["MagicSDK"], function (MF) {
                $("div.modal-footer").remove();
                var useLoadSP = jsonpayload.formLoadSp ? true : false;
                var directive = '<magic-form  model="c.formData" table-name="' + jsonpayload.form + '" options="{itemsPerRow: ' + itemsPerRow + ' , where: c.options.where ,hideTabs:' + hideTabs + ' }"></magic-form>';
                if (useLoadSP)
                    directive = '<magic-form-sp  model="c.formData" storedprocedure="' + jsonpayload.formLoadSp + '" isreadonly=false formname="' + jsonpayload.form + '" hidetabs=' + hideTabs + ' itemsperrow=' + itemsPerRow + ' options="{where: c.options.where }"></magic-form-sp>';
                var extVOscriptUrl = "http:\/\/10.10.30.3:8200\/checkcall.php?idcontract=" + ID;
                var $el = $("#contentofmodal").html('<div id="multiselectform-controller" ng-controller="MultiSelectFormController as c">\
					 <a class="btn btn-primary" href="'+ extVOscriptUrl + '" target="_blank">Visualizza script</a>\
                                                    <form name="form" ng-submit="c.callStoredProcedure(form)">{0}\
                                                        <div><button class="btn btn-primary">OK</button></div>\
                                                    </form>\
                                                </div>'.format(directive)).find("#multiselectform-controller")[0];
                console.log()
                var config = { MF: MF, e: e, data: datatopost, gridFields: targetgrid.dataSource.options.schema.model.fields, gridModel: targetgrid.dataSource.options.schema.model };
                config.massiveUpdate_form_columns = [];
                config.formMassiveUpdate = jsonpayload.formMassiveUpdate;
                config.formPK = targetgrid.dataSource.options.schema.model.id;
                config.jsonpayload = jsonpayload;
                config.filter = targetgrid.dataSource.filter();
                $.each(targetgrid.dataSource.options.schema.model.fields, function (k, v) {
                    if (v.visibleForMassiveUpdate == true)
                        config.massiveUpdate_form_columns.push(k);
                });
                var angular = initAngularController($el, "MultiSelectFormController", config, null, false);
            });
            $("#executesave").show();
            $("#wndmodalContainer").modal('show');
        });
}

function createXmlContract(e) {
    //outputPath will be added to standard file upload directory (application root if the directory Rootdirforupload is not defined)
    //The reports will be created in root + outputPath
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
    var ID = [];

    var alldata = $.map(selecteddata, function (v, i) {
        if (jsonpayload.WA_Type == "ASSUNZIONI") {
            return { WorkAgreement_ID: targetgrid.dataItem(v).CON_ID, WA_Type: jsonpayload.WA_Type };
        }
        else if (jsonpayload.WA_Type == "PROROGHE") {
            return { Extension_ID: targetgrid.dataItem(v).PRO_ID, WA_Type: jsonpayload.WA_Type };
        }
        else if (jsonpayload.WA_Type == "TRASFORMAZIONI") {
            return { Transformation_ID: targetgrid.dataItem(v).TRA_ID, WA_Type: jsonpayload.WA_Type };
        }
        else if (jsonpayload.WA_Type == "CESSAZIONI") {
            return { Cessation_ID: targetgrid.dataItem(v).CES_ID, WA_Type: jsonpayload.WA_Type };
        }
        else {
            return { ID: targetgrid.dataItem(v).ID, WA_Type: jsonpayload.WA_Type };
        }
    });

    checkXmlWorkAgreement(alldata).then(function (res) {
        $.each(res[0], function (k, v) {
            if (res[0][k].correct) //Creo il datapayload solo per le fatture che hanno tutti i dati essenziali
                datapayload.push(res[0][k]);
        });
        if (datapayload.length > 0) {
            for (var i = 0; i < datapayload.length; i++) {
                if (jsonpayload.WA_Type == "ASSUNZIONI") {
                    ID[i] = datapayload[i].WorkAgreement_ID
                }
                else if (jsonpayload.WA_Type == "PROROGHE") {
                    ID[i] = datapayload[i].Extension_ID
                }
                else if (jsonpayload.WA_Type == "TRASFORMAZIONI") {
                    ID[i] = datapayload[i].Transformation_ID
                }
                else if (jsonpayload.WA_Type == "CESSAZIONI") {
                    ID[i] = datapayload[i].Cessation_ID
                }
                else {
                    ID[i] = datapayload[i].ID
                }
            }
            doModal(true);
            $.ajax({
                type: "POST",
                url: "/api/CSU/SetParamsForCreateXml/",
                data: JSON.stringify({ models: { ID: ID, Type: jsonpayload.WA_Type } }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    kendoConsole.log(result.message, false);
                    $(e).closest(".k-grid").data("kendoGrid").dataSource.read();
                    doModal(false);
                },
                error: function (message) {
                    doModal(false);
                    kendoConsole.log(message.responseText, true);
                }
            });
        }

        $.each(res[0], function (k, v) { // Qualora ci fossero contratti che non presentano tutti i dati segnalo gli errori
            if (!(res[0][k].correct))
                kendoConsole.log(res[0][k].err, true);

        });
    });
}
function createConsultantFile(id) {
    var obj = {};
    obj.ID = id;

    var largeSpinnerHTML = '<p class="text-center" style="padding: 20px;"><i class="fa fa-spinner fa-spin fa-5x"></i></p>';

    $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');

    $.fileDownload('/api/CSU/CreateConsultantReport/', { data: obj, httpMethod: "POST" }).then(
        function () {
            $("#spin_modal_overlay").remove();
        });
}

function checkInvoiceData(data) { ///FA #5450
    var deferrer = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Accounting.CheckInvoicedata", data: { models: data } }).then(function (res) {
            deferrer.resolve(res);
        })

    });
    return deferrer.promise();
}
function shippingAddress(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    if (e.model.ExistingShippingLocation_ID) {
        e.container.find("[name='Address'], [name='Municipality'], [name='PostalCode'], [name='City_ID']").closest("[class*=col-]").hide();
    }

}

function shippingAddressFields(e) {
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    //var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Geo.GetShippingAddressDataFromLocation", data: { ID: model.ExistingShippingLocation_ID } })
            .then(function (res) {
                if (res.length) {


                    dataInfo.container
                        .find("input[name=AddressBy]")
                        .val(res[0][0].FullDescription)
                        .change();

                    dataInfo.container
                        .find("input[name=Address]")
                        .val(res[0][0].Address)
                        .change();

                    dataInfo.container
                        .find("input[name=Municipality]")
                        .val(res[0][0].Municipality)
                        .change();

                    dataInfo.container
                        .find("input[name=PostalCode]")
                        .val(res[0][0].PostalCode)
                        .change();

                    dataInfo.container
                        .find("input[name=City_ID]")
                        .val(res[0][0].City_ID)
                        .change();


                    dataInfo.container.find(" [name='Municipality'], [name='PostalCode']").closest("[class*=col-]").hide();


                    //#6640: Campi obbligatori (City_ID, Address), quindi qualora la location di spedizione selezionata dovesse avere indirizzo e/o City_ID a blank, non nascondo quei campi in modo che l'utente abbia comunque la possibilit? di inserirlo
                    if (res[0][0].City_ID) {
                        dataInfo.container.find(" [name='City_ID']").closest("[class*=col-]").hide();
                    }
                    else {
                        dataInfo.container.find("[name='City_ID']").closest("[class*=col-]").show();
                    }

                    if (res[0][0].Address || res[0][0].Address != "") {
                        dataInfo.container.find(" [name='Address']").closest("[class*=col-]").hide();
                    }
                    else {
                        dataInfo.container.find("[name='Address']").show();
                    }

                }
                else
                    dataInfo.container.find("[name='Address'], [name='Municipality'], [name='PostalCode'], [name='City_ID']").closest("[class*=col-]").show();
            })
    });
}

function parseXml(xmlStr) {
    try {
        return new window.DOMParser().parseFromString(xmlStr, "text/xml");
    }
    catch (err) {
        return;
    }
}

function loadXMLDoc(filename) {
    if (window.ActiveXObject) {
        xhttp = new ActiveXObject("Msxml2.XMLHTTP");
    }
    else {
        xhttp = new XMLHttpRequest();
    }
    xhttp.open("GET", filename, false);
    try { xhttp.responseType = "msxml-document" } catch (err) { } // Helping IE11
    xhttp.send("");
    return xhttp.responseXML;
}



function transformFE(e) {
    var $element = $(e);
    var data = $element.closest(".k-grid").data("kendoGrid").dataItem($element.closest("tr"));

    xml = parseXml(data.XmlDoc);
    if (data.Code == 'FP')
        xsl = loadXMLDoc("/views/1/Templates/Xsl/Stile_Compact.xsl");
    else
        xsl = parseXml(data.XslDefinition);
    // code for IE
    if (window.ActiveXObject) {
        ex = xml.transformNode(xsl);
        alert(ex);
        return;
        // document.getElementById("example").innerHTML = ex;
    }
    // code for Chrome, Firefox, Opera, etc.
    else if (document.implementation && document.implementation.createDocument) {

        //var parser = new DOMParser();
        //var xsl_doc = parser.parseFromString(xsl, "application/xml");
        //var xml_doc = parser.parseFromString(xml, "application/xml");
        //// end of secret sauce.

        xsltProcessor = new XSLTProcessor();
        try {
            xsltProcessor.importStylesheet(xsl);
        } catch (error) {
            console.log('err=' + error);
        }
        resultDocument = xsltProcessor.transformToFragment(xml, document);
        cleanModal();


        //visualizzazione documento su pagina esterna 
        var myWindow = window.open();
        myWindow.document.write('<head> <title>' + data.Description + '</title> </head> <div id="esito"> </div> ');
        myWindow.document.getElementById("esito").appendChild(resultDocument);

    }
}
function extendImage(path, e) {
    var $element = $(e);
    var data = $element.closest(".k-grid").data("kendoGrid").dataItem($element.closest("tr"));
    if (path) {
        var myWindow = window.open();
        myWindow.document.write("<head> <title>" + data.headTitle + "</title> </head> <img src='" + path + "'/>");
    }
}
function createPresenceTimeTableFile(year, month) {
    var largeSpinnerHTML = '<p class="text-center" style="padding: 20px;"><i class="fa fa-spinner fa-spin fa-5x"></i></p>';

    $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;>' + largeSpinnerHTML + '</div></div>');
    var obj = {};
    obj.Year = year;
    obj.Month = month;
    $.fileDownload('/api/CSU/PresenceTimeTableReport/', { data: obj, httpMethod: "POST" }).then(
        function () {
            $("#spin_modal_overlay").remove();
        });
}

function editListPrice(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    manageListPriceChange(e.model.PriceType_ID, e.container);
}

function listPriceChange(e) {
    this.element.closest('.k-popup-edit-form').find("input[name=Person_ID_Customer]").val(null);
    this.element.closest('.k-popup-edit-form').find("input[name=Person_ID_Supplier]").val(null);

    manageListPriceChange(this.value(), this.element.closest('.k-popup-edit-form'));
}

function manageListPriceChange(type, $element) {

    if (type == 1) //Listino di acquisto 
    {
        $element.find("[name='Person_ID_Customer']").closest("[class*=col-]").hide();
        $element.find("[name='Person_ID_Supplier']").closest("[class*=col-]").show();
    }
    if (type == 2) {
        $element.find("[name='Person_ID_Supplier']").closest("[class*=col-]").hide();
        $element.find("[name='Person_ID_Customer']").closest("[class*=col-]").show();
    }
}

function checkXmlWorkAgreement(data) { ///FA #6223
    var deferrer = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "HR.CheckXmlWorkAgreement", data: { models: data } }).then(function (res) {
            deferrer.resolve(res);
        })

    });
    return deferrer.promise();
}
function getWorkshopProductPrice(e) {

    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    //var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;

    if (!model.Quantity) {
        container.find("[name=Quantity]").data("kendoNumericTextBox").value(1);
        model.Quantity = 1;
    }

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({
            storedProcedureName: "Machines.GetProductPrice", data: {
                Product_ID: model.Product_ID,
                UnitMeasure_ID: model.UnitMeasure_ID,
                Quantity: model.Quantity,
                ProductAttributeSize_ID: model.ProductAttributeSize_ID,
                ProductAttributeColor_ID: model.ProductAttributeColor_ID,
                RecurringActivity_ID: model.RecurringActivity_ID,
                Surcharge: model.Surcharge
            }
        }).then(function (res) {
            var purchasePrice = res[0][0].PurchasePrice;
            var sellPrice = res[0][0].SellPrice;
            var surcharge = res[0][0].Surcharge;

            if (!purchasePrice) {
                purchasePrice = model.ActualListPrice;
                if (model.Surcharge)
                    sellPrice = purchasePrice + (purchasePrice / 100.00 * model.Surcharge);
                else
                    sellPrice = purchasePrice;


            }
            model["ActualListPrice"] = purchasePrice;
            model["FinalSellPrice"] = sellPrice;
            model["Surcharge"] = surcharge;

            container.find("[name=ActualListPrice]").data("kendoNumericTextBox").value(purchasePrice);
            container.find("[name=FinalSellPrice]").data("kendoNumericTextBox").value(sellPrice);
            container.find("[name=Surcharge]").data("kendoNumericTextBox").value(surcharge);
            model.dirty = true;
        })
    })

}
function calculateProductPrice(e) {

    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    //var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;


    var actualPrice = model.ActualListPrice;
    var surcharge = model.Surcharge;
    var finalPrice;

    if (surcharge) {
        finalPrice = actualPrice + (actualPrice / 100.00 * surcharge);

    }
    else {
        finalPrice = actualPrice;
    }

    container.find("[name=FinalSellPrice]").data("kendoNumericTextBox").value(finalPrice);
    model.dirty = true;

}

function editWorkAgreement(e) {
    if (!e.model.id) { ////Entro solo se sono in edit, ovvero se non ho un ID associato al record
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "HR.GetWorkAgreementDefaultValues" })
                .then(function (res) {
                    var data = res[0][0];
                    e.container
                        .find("input[name=Person_ID_CED]") // get the input element for the field
                        .val(data.Person_ID_CED) // set the value
                        .change(); //trigger change in order to notify the model binding

                    e.container
                        .find("input[name=T_ProvidentSocieties_ID]") // get the input element for the field
                        .val(data.T_ProvidentSocieties_ID) // set the value
                        .change(); //trigger change in order to notify the model binding

                    e.container
                        .find("input[name=T_CCNL_ID]") // get the input element for the field
                        .val(data.T_CCNL_ID) // set the value
                        .change(); //trigger change in order to notify the model binding
                })
        });
    }
    getStandardEditFunction(e, e.sender.options.code, "grid");
}
function editDocumentBase(e) {
    //the key is a field that will trigger reload  of the values which binded to dropdowns
    var automationsForDrops = {
        Person_ID_Dest: ["ListPriceBase_ID"]
    };

    var gridname = e.sender.element.attr("id");
    var promise = getStandardEditFunction(e, null, gridname);
    var gridDs = e.sender.dataSource;
    $.when(promise).then(function () {
        gridDs.bind('change', function (ev) {
            $.each(automationsForDrops, function (key, value) {
                if (key == ev.field) {
                    $.each(value, function (i, v) {
                        var $kendodrop = e.container.find("[name=" + v + "]");
                        var kdrop = $kendodrop.data("kendoDropDownList");
                        var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                        getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                    });
                }
            });
        });
    });
}

function editWorkSheet(e) {
    //the key is a field that will trigger reload  of the values which binded to dropdowns
    var automationsForDrops = {
        Person_ID_DES: ["ListPriceBase_ID"]
    };

    var gridname = e.sender.element.attr("id");
    var promise = getStandardEditFunction(e, null, gridname);
    var gridDs = e.sender.dataSource;
    $.when(promise).then(function () {
        gridDs.bind('change', function (ev) {
            $.each(automationsForDrops, function (key, value) {
                if (key == ev.field) {
                    $.each(value, function (i, v) {
                        var $kendodrop = e.container.find("[name=" + v + "]");
                        var kdrop = $kendodrop.data("kendoDropDownList");
                        var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                        getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                    });
                }
            });
        });
    });
}

function shipmentFeesSurcharge(e) {  //manage Dimension Drop - used in Journal Position Field Product_ID:  Dettaglio onchange: WMSJournalProductChange
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({
            storedProcedureName: "Crm.getShipmentFeesSurchrgeForPaymentType", data: {
                PaymentType_ID: model.PaymentType_ID
            }
        }).then(function (res) {
            var PaymentTypeFee = res[0][0].PaymentTypeFee;

            container.find("[name=ShipmentFees]").data("kendoNumericTextBox").value(PaymentTypeFee);
            model["ShipmentFees"] = PaymentTypeFee;
        })
    })
}

function getBlankDivForZero(color, fieldValue) {
    var result = '';
    if (fieldValue == "0") {///Se ? 0
        result = "<div style=\"background-color:" + color + ";  \"><p style=\"align-content: center\"></p></div>";
    }
    else {///Se non ? 0
        result = "<div style=\"background-color:" + color + ";  \"><b><p style=\"align-content: center\">" + fieldValue + "</p></b></div>";
    }
    return result;
}

function hrProjectChange(e) {
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    //var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;



    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "HR.GetProjectDatesForBilling", data: { Project_ID: model.Project_ID } }).then(function (res) {

            var data = res[0][0];

            container.find("[name=StartDate]").data("kendoDatePicker").value(data.StartDate);
            model["StartDate"] = data.StartDate;


            container.find("[name=EndDate]").data("kendoDatePicker").value(data.EndDate);
            model["EndDate"] = data.EndDate;



            model.dirty = true;
        })
    })
}

function populateMonthAndYear(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    //caso evento spin di kendo

    var model = e.model;
    var month = $("#month-drop").data("kendoDropDownList").value();
    model["Month"] = month;
    var year = $('#year-drop').data("kendoDropDownList").value();
    model["Year"] = year;
    model.dirty = true;
}


function editAbsence_zenit(e) {

    var Person_ID;

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "HR.AbsenceDefaultPerson" })
            .then(function (res) {
                Person_ID = res[0][0];
                e.container
                    .find("input[name=Person_ID_Request]") // get the input element for the field
                    .val(Person_ID.Person_ID) // set the value
                    .change(); //trigger change in order to notify the model binding
                getStandardEditFunction(e, e.sender.options.code, "grid0");

                var fromHour = e.container.find("input[name=FromHour]").data("kendoTimePicker");
                fromHour.setOptions({
                    min: new Date(2000, 0, 1, 8, 0, 0),
                    max: new Date(2000, 0, 1, 22, 0, 0),
                    interval: 15,
                    timeFormat: "HH:mm"
                });

                var toHour = e.container.find("input[name=ToHour]").data("kendoTimePicker");
                toHour.setOptions({
                    min: new Date(2000, 0, 1, 8, 0, 0),
                    max: new Date(2000, 0, 1, 22, 0, 0),
                    interval: 15,
                    timeFormat: "HH:mm"
                });

            })
    });
    AbsenceTypeChange(e.model.AbsenceType_ID, e.container);

}
function manageFirstListPriceValue(val, $element, init, model) {

    var listPriceDrop = $("[name='ListPriceBase_ID']").data("kendoDropDownList");


    $element.find("[name=ListPriceBase_ID]").data("kendoDropDownList").value(val);
    model["ListPriceBase_ID"] = val;
    model.dirty = true;

}


function firstListPriceForPerson(e) {
    var dataInfo = e; // getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;
    var ListPriceBase_ID;

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Base.DocumentBaseListPriceBase_drop", data: { Person_ID_Dest: model.Person_ID_Dest, DocumentBaseType: model.DocumentBaseType } })
            .then(function (res) {
                if (res.length) {

                    ListPriceBase_ID = res[0][0].ID;
                    //model["ListPriceBase_ID"] = ListPriceBase_ID;
                    //container.find("[name=ListPriceBase_ID]").data("kendoDropDownList").value(ListPriceBase_ID);

                    manageFirstListPriceValue(ListPriceBase_ID, container, 0, model);
                }


            })
    })
}
function getServicesForTask(n, description, id) {
    var result = '';

    if (n == 1) {
        result = '<div><p style=\"align-content: center\">' + description + '</p></div>';
    }
    else if (n > 1) {
        result = '<div onmouseout="hideServicesDescription(\'' + description + '\', ' + id + ',' + n + ')" onmouseover="showServicesDescription(\'' + description + '\', ' + id + ')"><p id="description-' + id + '" style=\"align-content: center\">' + n + '</p></div>';
    }

    return result;
}

function showServicesDescription(description, id) {
    document.getElementById('description-' + id).innerText = description;
    initGridCellTooltip(description);
}

function hideServicesDescription(description, id, n) {
    document.getElementById('description-' + id).innerText = n;
}

function solveJsonWarehouseProductStatus(e) {
    if (!e.Overall) {
        return '';
    }

    var callcenters = JSON.parse(e.Overall);

    var cc = '';

    for (var i = 0; i < callcenters.length; i++) {
        var color = '';
        cc += '<li class="list-group-item" style="background-color: #f0ad4e;border: 1px solid #eea236;" >' + callcenters[i].CallCenter + '- disp.:' + callcenters[i].Disponibili + '</li>';
    }
    cc = '<ul class="list-group">' + cc + '</ul>';
    return cc;
}