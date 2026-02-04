
function validateStep(formController, step, scope) {
    var result = true;
    var wsserviceList;    
    var fc = formController[step];

    //var wsservice = fc.$form.Par_Service_ID;
    //var wsserviceID = wsservice.$viewValue;
    //var wsservicename = wsservice.$name;
    var wsservicecalled = "";

    var UserGroupDescrition = window.UserGroupDescription;
    var ApplicationInstanceId = window.ApplicationInstanceId;
    var ApplicationInstanceName = window.ApplicationInstanceName;
    var ApplicationInstanceId = window.ApplicationInstanceId;
    var LoginTimestamp = window.LoginTimestamp;
    var host = window.location.host;
    var location = window.location;
    var origin = window.origin;
    var requestid = 0;
    var datapayload;
    var jsonpayload;
    var datapayload2;
    var jsonpayload2;


    if (step == 0) {

        doModal(true);
        var wsservice = fc.$form.Par_Service_ID;
        var wsserviceID = wsservice.$viewValue;
        var wsservicename = wsservice.$name;
        
        var docsloader = new $.Deferred;
        datapayload = scope.models.STEP1;        

        var docsuccess = function (result) {
            if (result) {
                requestid = result.Response_ID;
                kendoConsole.log(result, true);
                docsloader.resolve();                
            }            
            docsloader.resolve();
        };

        $.ajax({
            type: "POST",            
            url: "/api/Assicom/CallAssicomWiz/",            
            data: JSON.stringify({ models: datapayload, outputPath: "Assicom", location: location, step: step.toString() }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (err) {

                doModal(false);
                kendoConsole.log(err.responseText, true);
                reject(err);
                docsloader.reject();
            }
        }).then(function (res) {
            kendoConsole.log(res.Result, false);
            requestid = res.Response_ID;
            var fc = formController[step];
            fc.$form.Request_ID.$setViewValue(requestid.toString());
            $("#Request_ID").val(requestid.toString());
            //$("#Request_ID2").val(requestid.toString());
            alert('Resolve');
            doModal(false);
        });

        return docsloader.promise();
    }

    if (step == 1) {

        doModal(true);

        var req = fc.$form.Request_ID2;
        var reqID = req.$viewValue;

        //var datapayload;
        //var jsonpayload;

        var docsloader = new $.Deferred;
        datapayload2 = scope.models.STEP2;
        datapayload = scope.models.STEP1;

        var docsuccess = function (result) {
            if (result) {
                requestid = result.Response_ID;
                kendoConsole.log(result, true);
                docsloader.resolve();
                //return true;
            }
            docsloader.resolve();
        };

        $.ajax({
            type: "POST",
            //async: true,
            url: "/api/Assicom/CallAssicomWiz/",
            //data: JSON.stringify({ models: datapayload, outputPath: "Assicom", service: wsservice, servicecall: wsservicecalled, location: location }),
            data: JSON.stringify({ models: datapayload, models2: datapayload2, outputPath: "Assicom", request: reqID, location: location, step: step.toString() }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            //success: docsuccess,

            error: function (err) {

                doModal(false);
                kendoConsole.log(err.responseText, true);
                //reject(err);
                docsloader.reject();
            }
        }).then(function (res) {
            kendoConsole.log(res.Result, false);
            requestid = res.Response_ID;
            var fc = formController[step];
            //fc.$form.Request_ID.$setViewValue(requestid.toString());
            $("#Request_ID").val(requestid.toString());
            $("#Request_ID2").val(requestid.toString());
            alert('Resolve');
            doModal(false);
        });;

        return docsloader.promise();

    }
}

