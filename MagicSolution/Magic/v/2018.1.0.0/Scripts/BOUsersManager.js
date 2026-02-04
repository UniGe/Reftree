function buildUserCreationWindow(e)
{
    var infosfromgridrow = getRowDataFromButton(e);


    var jsonpayload = {};
    try {
        jsonpayload = getRowJSONPayload(e);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }

    var scripttoadd = '<script type="text/x-kendo-template" id="createuserwndscrpt">\
                        <div id="userform" class="k-edit-form-container">\
                                <div>\
                                    <div class="k-edit-label"><label for="username">' + getObjectText("username") + '</label></div>\
                                    <div class="k-edit-field"><input name="username" placeholder="' + getObjectText("username") +'..." id="username" /></div></div>\
                                <div>\
                                    <div class="k-edit-label"><label for="password">Password</label></div>\
                                    <div class="k-edit-field"><input name="password" placeholder="password..." id="password" type="password" /></div></div>\
                                <div id="buttoncontainer" class="k-edit-buttons k-state-default">\
                                <a  class="k-button k-button-icontext k-grid-update" id="usersavebtn"><span class="k-icon k-update" ></span>'+getObjectText("save")+'</a>\
                             </div>\
                        </div>\
                        </script>';
    
    var wnddiv = '<div id="userdatawnd"><\div>';
    
    $("#appcontainer").append(scripttoadd);
    if ($("#userdatawnd").length === 0)
        $("#appcontainer").append(wnddiv);
    else
    {
        destroyUserWnd(e);
        $("#appcontainer").append(wnddiv);
    }



    $("#userdatawnd").kendoWindow({title:getObjectText("creautente"),visible:false ,resizable:false, height:150 , width:420});
    detailsTemplate = kendo.template($("#createuserwndscrpt").html());

    $("#userdatawnd").data("kendoWindow").content(detailsTemplate).open().center();

    $("#usersavebtn").click(saveuser);

    $("#usersavebtn").prop("ID",infosfromgridrow.ANAGRA_ID);
    $("#usersavebtn").prop("FirstName",infosfromgridrow.ANAGRA_NOME);
    $("#usersavebtn").prop("LastName",infosfromgridrow.ANAGRA_COGNOME);
    $("#usersavebtn").prop("Email", infosfromgridrow.ANAGRA_EMAIL || infosfromgridrow.ANARIF_MAIL);
    $("#usersavebtn").prop("ProfileName", jsonpayload.profileName);


    return false;
}
function destroyUserWnd(e)
{
    $("#userdatawnd").data("kendoWindow").destroy();
    $("#userdatawnd").remove();
}
function saveuser(e)
{
    var data = {}
    data.ID = $("#usersavebtn").prop("ID");
    data.FirstName = $("#usersavebtn").prop("FirstName");
    data.LastName = $("#usersavebtn").prop("LastName");
    data.Email = $("#usersavebtn").prop("Email");
    data.Name = $("#username").val();
    data.Username = $("#username").val();
    data.Password = $("#password").val();
    data.ProfileName = $("#usersavebtn").prop("ProfileName");

    if (!data.Email)
        data.Email = "";

    if (data.Username !== '' && data.Password !== '')
        $.ajax({
            type: "POST",
            url: "/api/ANAGRA/PostInsertUser/",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data:JSON.stringify(data),
            success: function (result) {
                kendoConsole.log(getObjectText("utentecreato"), false);
                $("#userdatawnd").data("kendoWindow").close();
                destroyUserWnd();
                //il bottone deve essere definito nei comandi della griglia con DomID = creaanagrauser
                $(".k-button.k-button-icontext.k-grid-creaanagrauser").closest(".k-grid").data("kendoGrid").dataSource.read();
            },
            error: function (error) {
                kendoConsole.log(error.responseText, true);
            }

        });
    else
        kendoConsole.log(getObjectText("invalidusernamepwd"),true);
}

//da integrare nel dataBound delle griglie di anagrafica in prerender dispatchers.js per nascondere/mostrare il bottone di creazione dell'  utente
function showanagrausercreationbutton(e)
{
    $("#" + e.sender.element[0].id + " tbody tr .k-grid-creaanagrauser").each(function () {
        var currentDataItem = $("#" + e.sender.element[0].id).data("kendoGrid").dataItem($(this).closest("tr"));
        var userid = currentDataItem.UTENTE_ID || currentDataItem.ANAINT_ANAGRA_ID_UTENTE;
        //Check in the current dataItem if the row is editable
        if (userid != undefined && userid!=null)
                 $(this).remove();
    });
}