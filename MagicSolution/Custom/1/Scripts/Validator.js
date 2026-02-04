var urlCheckerAPI = 'api/Helper';
var regexpEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
var regexpPhoneNumber = /^(\+)39\d{10}$/
var regexpPhoneNo = /^[0-9]{5,10}$/;
function checkIfAdult(value, formItems, scope, element) {   
	// checks if the date inserted is at least 18 years smaller than the current date
	var wizardCode = this.options.apiCallData.wizardCode;
	var wizardScope = getWizardScope(this);
    var inUpdate = wizardScope.models.WizardInfo;
    var today = new Date();
    if (inUpdate) {
        today = new Date(inUpdate.CreationDate);
    }
    var birthDate = new Date(value);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
	}
	if (!value && wizardCode == "RECZenit") {
		return true;
	}
	if (age < 18) {  
        return false;
    }
	else 
		return true;
}

function checkIfTelephoneNoAlreadyExists(value) {
    var wizardScope = getWizardScope(this);
    var inUpdate = wizardScope.models.WizardInfo;
    //check if the inserted phone number already exists on the database
    if (inUpdate)
        var obj = { Telephone: value, Application_ID: inUpdate.ID };
    else
        var obj = {Telephone: value}
    var deferrer = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Zenit.checkIfTelNoExists", data: obj }).then(function (res) {
            var exist;
            exist = res[0][0]["result"];

            if (exist == "true")
                deferrer.reject();
            else
                deferrer.resolve();
        })
    });
        return deferrer.promise();
  
}
function checkIfPhoneNoAlreadyExists(value) {
    var wizardScope = getWizardScope(this);
    var inUpdate = wizardScope.models.WizardInfo;
    //check if the inserted phone number already exists on the database
    if (inUpdate)
        var obj = { Telephone: value, Application_ID: inUpdate.ID };
    else
        var obj = { Telephone: value }
    var deferrer = $.Deferred();
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "HR.checkIfTelNoExists", data: obj }).then(function (res) {
            var exist;
            exist = res[0][0]["result"];

            if (exist == "true")
                deferrer.reject();
            else
                deferrer.resolve();
        })
    });
    return deferrer.promise();
}


function checkIfPhoneNoIsValid(value) {
	var deferrer = $.Deferred();
	if (!value || value.length == 0)
		deferrer.resolve();
	else
		if (regexpPhoneNo.test(value) == true) {
			deferrer.resolve();
		} else {
			deferrer.reject();
		}
			
	return deferrer.promise();
}
function checkIfFuture(value) {
    
    // checks if the date is in the future
	var wizardCode = this.options.apiCallData.wizardCode;
    var result = false;
    if (value) {
        var wizardScope = getWizardScope(this);
        var inUpdate = wizardScope.models.WizardInfo;
        var today = new Date();
        if (inUpdate) {
            today = new Date(inUpdate.CreationDate);
        }
        var testedDay = new Date(value);
        var inFuture = testedDay.getTime() >= today.getTime();
        result = !inFuture;
	}
	if (!value && wizardCode == "RECZenit") {
		return true;
	}
    return result;   
}

function checkIfBeforeToday(value) {
    //checks if the date is before today
    if (value) {
        var wizardScope = getWizardScope(this);
        var inUpdate = wizardScope.models.WizardInfo;
        var today = new Date();
        if (inUpdate) {
            today = new Date(inUpdate.CreationDate);
        }
        var expireDate = new Date(value);
        if (expireDate.getTime() >= today.getTime())
            return true;
        else
            return false;
    }else return false
}

function checkContactedNumber(value) {
    //checks if contacted phone number is valid 
    var deferred = $.Deferred();
    var scope = this;
    if (value) {
        var data = new Object();
        data.contactedNumber = null;
        data.contactedNumber = value;
        //data.test = true;
        var jData = JSON.stringify(data);
        $.ajax(
        {
            url: 'api/Zenit/CheckContactedNumber',
            type: 'POST',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: jData,
            success: function (res) {
                try {
                    if (res.valid)
                        deferred.resolve();
                    else {
                        scope.$broadcast('schemaForm.error.CalledNumber', 'invalidCalledNumber', res.info.userMessage);
                        deferred.reject();
                    }
                }
                catch (err) {
                    deferred.reject();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                scope.$broadcast('schemaForm.error.CalledNumber', 'invalidCalledNumber', textStatus + ' - ' +jqXHR.responseText);
                deferred.reject();

            }
        }
        );
    } else
        deferred.reject();


    return deferred.promise();
}

function checkIDCCRM(value) {
	var scope = this;
	var wizardScope = getWizardScope(scope);
	var inUpdate = wizardScope.models.PhoneContractWizard;
	//check if the inserted phone number already exists on the database
	var obj = inUpdate;
	obj.IDContactCCRM = value;
	
	var deferrer = $.Deferred();
	if (!obj.IDContactCCRM) {
		deferrer.resolve();
		return deferrer.promise();

	}
	requireConfigAndMore(["MagicSDK"], function (MF) {
		MF.api.get({ storedProcedureName: "Zenit.CheckContactExistsOnCCRM_connector", data: obj }).then(function (res) {
			var exist;
			exist = res[0][0]["result"];

			if (exist == "true") {
				deferrer.resolve();
				wizardScope.models.PhoneContractWizard.CalledNumber = res[1][0]["CalledNumber"];
			}
			else {
				deferrer.reject();
				wizardScope.models.PhoneContractWizard.CalledNumber = "";
			}
		})
	});
	return deferrer.promise();

}

function checkEmailAddress(value) {
    if (!value || value.length ==0)
        return true;
    else 
        return regexpEmail.test(value); 
}

function checkCellphoneNumber(value) {
	if (!value || value.length == 0)
		return true;
	else
		return regexpPhoneNumber.test(value);
}

function checkCCYear(value) {
    var result=false;
    var model = this.model;
    if (model.MonthExpiry && value) {
        result = isValidCC(model.MonthExpiry, value);
    } else {
        result = true;
    }
    return result;
}

function checkCCMonth(value) {   
    try {
        var m = parseInt(value, 10);
        return ((m>=1) && (m<=12));
    }
    catch (err) {
        return false
    }
}

function isValidCC(month, year) {
    var today=new Date();
    today.setHours(0, 0, 0, 0);
    var expirationCC = new Date(year, month, 0);
    expirationCC.setHours(0, 0, 0, 0);
    var isValid = expirationCC.getTime() > today.getTime();
    return isValid
}

function onChangeMonth(value, formItems, scope, element) {

    if (!scope.$form.YearExpiry)
        return;

   if (scope.$form.YearExpiry.$viewValue){
    var year = scope.$form.YearExpiry.$viewValue;
    scope.$form.YearExpiry.$setViewValue("");
    setTimeout(function () {
        scope.$form.YearExpiry.$setViewValue(year);
    });}
}

function onChangeAnag(value, formItems, scope, element) {
    //if (scope.$form.TaxCode.$viewValue) {
    //    var cf = scope.$form.TaxCode.$viewValue;
    //    scope.$form.TaxCode.$setViewValue("");
    //    setTimeout(function () {
    //        scope.$form.TaxCode.$setViewValue(cf);
    //    });
    //}
}

function validateStep(formController, step, scope) {
    var result = true;
    var fc = formController[step];
    if (fc.$form.TaxCode) {
        if (fc.$form.TaxCode.$viewValue) {
            var cf = fc.$form.TaxCode.$viewValue;
            fc.$form.TaxCode.$setViewValue("");
            setTimeout(function () {
                fc.$form.TaxCode.$setViewValue(cf);
            });
        }
    }
    return result;
}