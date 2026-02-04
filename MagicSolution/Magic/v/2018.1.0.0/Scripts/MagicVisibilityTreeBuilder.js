
var rolesds = [];

function appendwindows() {
    var windowshtml = ' <div id="modalAddUser" class="k-popup-edit-form k-window-content k-content"></div>\
                        <div id="modalAssocGroups" class="k-popup-edit-form k-window-content k-content"></div>\
                        <div id="modalRootElementAdmin" class="k-popup-edit-form k-window-content k-content"></div>\
                        <div id="modalUpdateGroup" class="k-popup-edit-form k-window-content k-content"></div>';
    $("#appcontainer").append(windowshtml);
}
//#region utils

function selectFirst(e) {
    var dropdownlist = $("#" + e.sender.element[0].id).data("kendoDropDownList");
    dropdownlist.select(0);

}

function hideUsers()
{
    var treedata = $("#thetree").data("kendoTreeView");
    if ($("#hideusersbtn").text() === getObjectText("hideusers")) {

        $.each($("#thetree li"), function (index, value) {
            if (treedata.dataItem(value).type === "User")
                $(value).hide();
        });

        $("#hideusersbtn").text(getObjectText("showusers"));
    }
    else {
        $.each($("#thetree li"), function (index, value) {
            if (treedata.dataItem(value).type === "User")
                $(value).show();
        });

        $("#hideusersbtn").text(getObjectText("hideusers"));
            
    }

    return false;
}

//#endregion
//#region treebehaviours
function onDrop(e) {
    if (e.destinationNode === undefined) {
        e.setValid(false);
        return;
    }
    if (e.sender.dataItem(e.sourceNode).type == "User") {
        e.setValid(false);
    }
    if ((e.sender.dataItem(e.destinationNode).type == "User") && (e.sender.dataItem(e.sourceNode).type == "Group")) {
        e.setValid(false);
    }
    if (($(e.dropTarget)[0].className == "k-drop-hint") && (e.dropPosition == "before")) {
        e.setValid(false);
    }

    if ((e.sender.dataItem(e.destinationNode).type == "Group") && (e.sender.dataItem(e.sourceNode).type == "Group")) {

        var newparentid = e.sender.dataItem(e.destinationNode).GROUPID;
        var newchild = e.sender.dataItem(e.sourceNode).GROUPID;

        if (newparentid !== newchild) {
            var parstring = { GroupID: newchild, ParentID: newparentid };
            var res = $.ajax({
                type: "POST",
                url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/PostUpdateUserGroupParent",
                data: JSON.stringify(parstring),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function () {
                    openTree();
                    $(".k-header.k-drag-clue").remove();
                },
                error: function (e) {
                    kendoConsole.log(getObjectText("buupdateerror"), true);
                    e.setValid(false);
                }
            });
        }
        else
            e.setValid(false);


    }

}

function onDragStart(e) {
    if (e.sender.dataItem(e.sourceNode).type == "User") {
        e.preventDefault();
    }

}

//#endregion

//#region BusinessUnits
function updategroup(e) {

    var wnd1 = $("#modalUpdateGroup").data("kendoWindow");

    var detailsTemplate = kendo.template($("#UpdateBUName").html());
    wnd1.content(detailsTemplate);

    $("#tabstrippopupupdateBUName").kendoTabStrip({
        animation: {
            open: {
                effects: "fadeIn"
            }
        }
    });
    //per fare in modo che i data-role funzionino
    kendo.init($("#modalUpdateGroup"));
    removeUnwantedGroupInfo();

    var Uid = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).uid;
    var text = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).assettoexplode;
    var botype = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).ownerbotype;
    var ownerid = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).ownerboid;
    $("#modalUpdateGroup").attr("nodeuid", Uid);

    $("#bued").val(text);
    if ($("#burolesed").length > 0) {
        var drop = $("#burolesed").data('kendoDropDownList');
        drop.value(botype);
    }
    if ($("#ownerboideddd").length > 0) {
        var dropowner = $("#ownerboideddd").data('kendoDropDownList');
        dropowner.value(ownerid);
    }
    wnd1.open();
    wnd1.center();
}


function AppendBusinessUnit(e) {
    var value = $("#bu").val();
    var typevalue = null;
    var ownerid = null;
    if ($("#burolesdd").length > 0)
        typevalue = $("#burolesdd").data('kendoDropDownList').value();
    if ($("#ownerboiddd").length > 0)
        ownerid = $("#ownerboiddd").data('kendoDropDownList').value();


    if (value.trim() == "")// || ownerid == "")
    {
        kendoConsole.log(getObjectText("bunamemandatory"), true);
    }
    else {
        //append the business unit to the root into the database
        var treeviewds = $("#thetree").data("kendoTreeView").dataSource;

        var parstring = { assettoexplode: value, parentid: treeviewds.data()[0].GROUPID, ownerboid: ownerid, ownerbotype: typevalue };
        var res = $.ajax({
            type: "POST",
            async: true,
            url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/PostCreateUserGroup",
            data: JSON.stringify(parstring),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                if (result.BusinessUnitID == 0 || result.BusinessUnitID == null) {
                    kendoConsole.log(getObjectText("bucreateerror"), true);
                }
                else {
                    // appends a new node to the root level in the UI
                    var groupid = result.BusinessUnitID;

                    var usertoadd = null;
                    if (result.OwnerUserID != null) {
                        var symbol = result.OwnerUserSymbol;
                        var text = result.OwnerUserDescription;

                        var parstring = { UserID: result.OwnerUserID, GroupID: groupid };
                        var res = $.ajax({
                            type: "POST",
                            async: false,
                            url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/PostLinkUserToGroup",
                            data: JSON.stringify(parstring),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function (e) {
                                usertoadd = {
                                    assettoexplode: text, type: "User",
                                    USERID: result.OwnerUserID, GROUPID: groupid, expanded: true, symbol: "http://" + window.location.host + symbol,
                                    imageUrl: "http://" + window.location.host + "/Magic/Styles/Images/user.png", items: []
                                }
                            },
                            error: function (request, status, error) {
                                kendoConsole.log(getObjectText("usertobuerror"), true);
                            }

                        });

                    }
                    var itemstoadd = [];
                    if (usertoadd != null)
                        itemstoadd.push(usertoadd);
                    treeviewds.data()[0].items.push({
                        assettoexplode: value, type: "Group",
                        GROUPID: groupid, expanded: true, ownerboid: ownerid, ownerbotype: typevalue,
                        imageUrl: "http://" + window.location.host + "/Magic/Styles/Images/group.png", items: itemstoadd
                    });



                }
                var wnd = $("#modalRootElementAdmin").data("kendoWindow");
                wnd.close();
            }
        });

    }
}
function UpdateBusinessUnit(e) {
    var value = $("#bued").val();
    var typevalue = null;
    var ownerid = null;
    if ($("#burolesed").length > 0) {
        typevalue = $("#burolesed").data('kendoDropDownList').value();
    }
    if ($("#ownerboideddd").length > 0) {
        ownerid = $("#ownerboideddd").data('kendoDropDownList').value();
    }
   
    var Uid = $("#modalUpdateGroup").attr("nodeuid");
    var treeview = $("#thetree").data("kendoTreeView");
    var node = treeview.findByUid(Uid);
    var treeviewds = $("#thetree").data("kendoTreeView").dataItem(node);

    if (value.trim() == "")//|| ownerid == "")
        kendoConsole.log(getObjectText("bunamemandatory"), true);
    else {

        //append the business unit to the root into the database
        var parstring = { Name: value, GroupID: treeviewds.GROUPID, ownerboid: ownerid, ownerbotype: typevalue };
        var res = $.ajax({
            type: "POST",
            url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/PostUpdateUserGroupName",
            data: JSON.stringify(parstring),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (e) {
                treeview.text(node, value);
                treeviewds.ownerboid = ownerid;
                treeviewds.ownerbotype = typevalue;
            },
            error: function (request, status, error) {
                kendoConsole.log(request.responseText, true);
            }
        });

        var wnd = $("#modalUpdateGroup").data("kendoWindow");
        wnd.close();
    }
}
function DestroyBusinessUnit(e) {
    var treeview = $("#thetree").data("kendoTreeView");
    var Uid = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).uid;
    var node = treeview.findByUid(Uid);

    var treeviewds = $("#thetree").data("kendoTreeView").dataItem(node);

    var res = $.ajax({
        type: "GET",
        async: true,
        url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/DeleteUserGroup/" + treeviewds.GROUPID,
        data: "{}",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (e) {
            //MVVM 
            var treeview = $("#thetree").data("kendoTreeView");
            treeview.remove(node);
        },
        error: function (request, status, error) {
            kendoConsole.log(request.responseText, true);
        }

    });
}

//#endregion
//#region Groups
function assocgroups(e) {
    var wnd1 = $("#modalAssocGroups").data("kendoWindow");

    var detailsTemplate = kendo.template($("#GroupSelect").html());
    wnd1.content(detailsTemplate);
    var arevisid = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).GROUPID;

    if ($(".k-grid").length === 0) {
        var grid = getrootgrid("US_V_CROSS_AREGRO", null, null);
        renderGrid(grid, null, null);
    }

    $("#grid").data("kendoGrid").dataSource.filter({ field: "US_AREVIS_ID", operator: "eq", value: arevisid });

    wnd1.open();
    wnd1.center();
}


//#endregion

//#region  Users 
//gestione finestra
function adduser(e) {

    var wnd1 = $("#modalAddUser").data("kendoWindow");

    var detailsTemplate = kendo.template($("#UserSelect").html());
    wnd1.content(detailsTemplate);

    $("#userselect").kendoTabStrip({
        animation: {
            open: {
                effects: "fadeIn"
            }
        }
    });
    //per fare in modo che i data-role funzionino
    kendo.init($("#modalAddUser"));

    getmultiselectdatasource("Magic_Mmb_UserGroupVisibility", "Username", "GetManagedUsersList", "userdd");

    var Uid = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).uid;

    $("#modalAddUser").attr("nodeuid", Uid);

    wnd1.open();
    wnd1.center();
}
function DetachUserFromBusinessUnit(e) {
    var treeview = $("#thetree").data("kendoTreeView");
    var Uid = $("#thetree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).uid;
    var node = treeview.findByUid(Uid);

    var treeviewds = $("#thetree").data("kendoTreeView").dataItem(node);
    if (treeviewds.USERID != undefined) {
        var parstring = { UserID: treeviewds.USERID, GroupID: treeviewds.GROUPID };
        var res = $.ajax({
            type: "POST",
            async: true,
            url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/PostDeleteUserFromGroup/",
            data: JSON.stringify(parstring),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (e) {
                //MVVM 
                var treeview = $("#thetree").data("kendoTreeView");
                treeview.remove(node);
            },
            error: function (request, status, error) {
                kendoConsole.log(request.responseText, true);
            }

        });
    }
}
function userremoval(e) {
    var treeview = $("#thetree").data("kendoTreeView");
    //ho appeso in fase di apertura della finestra il nodeuid su cui sto operando.
    var node = treeview.findByUid($("#modalAddUser").attr("nodeuid"));
    var treeviewds = $("#thetree").data("kendoTreeView").dataItem(node);
    var currentvalues = this.dataItems(); // i valori presenti nel  ms
    //itero sui nodi dell' albero e se non trovo corrispondenza con gli elementi selzionati sul multiselect li cancello dal DB
    var itemstopliceuid = [];
    $.each(treeviewds.items,
     function (i, value) {
         var found = false;
         for (var j = 0; j < currentvalues.length; j++) {
             var user = parseInt(value.USERID);
             if (currentvalues[j].UserID === user) {
                 found = true;
             }
         }
         if (!found && value.USERID !== undefined) {
             var parstring = { UserID: value.USERID, GroupID: value.GROUPID };
             var res = $.ajax({
                 type: "POST",
                 async: false,
                 url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/PostDeleteUserFromGroup/",
                 data: JSON.stringify(parstring),
                 contentType: "application/json; charset=utf-8",
                 dataType: "json",
                 success: function (e) {
                     //itemstopliceuid.push(value.uid);
                     var nodetoremove = treeview.findByUid(value.uid);
                     treeview.remove(nodetoremove);
                     kendoConsole.log(getObjectText("userremovalok"), "info");
                 },
                 error: function (request, status, error) {
                     kendoConsole.log(request.responseText, true);
                 }

             });
             //break disassocio dal gruppo un utente alla volta
             return false;
         }
     });
    //$.each(itemstopliceuid, function (e,val) {
    //                                          treeview.remove(treeview.findByUid(val));
    //                                  });
}
//quando viene aperto il multiselect (click utente) vengono messi nei values gli utenti gia' legati e tolti dai selezionabili quelli gia' presenti
function filtermultiselectuservalues(e) {
    var treeview = $("#thetree").data("kendoTreeView");
    //ho appeso in fase di apertura della finestra il nodeuid su cui sto operando.
    var node = treeview.findByUid($("#modalAddUser").attr("nodeuid"));
    var treeviewds = $("#thetree").data("kendoTreeView").dataItem(node);
    var values = [];
    $.each(treeviewds.items,
     function (i, value) {
         values.push(value.USERID);
     });

    e.sender.value(values);

}
function onUserSelect(e) {

    var dataItem = this.dataSource.view()[e.item.index()];

    var userid = dataItem.UserID;
    var text = dataItem.Username + " - " + dataItem.EMail;
    var symbol = dataItem.Symbol;
    //MVVM i modify the datasource in order to update the UI tree and the data model
    var treeview = $("#thetree").data("kendoTreeView");
    var node = treeview.findByUid($("#modalAddUser").attr("nodeuid"));

    var treeviewds = $("#thetree").data("kendoTreeView").dataItem(node);

    for (var i = 0; i < treeviewds.items.length; i++) {
        if (treeviewds.items[i].USERID == userid) {
            kendoConsole.log(getObjectText("doubleuserinbu"), true);
            return;
        }

    }

    var parstring = { UserID: userid, GroupID: treeviewds.GROUPID };
    var res = $.ajax({
        type: "POST",
        async: false,
        url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/PostLinkUserToGroup",
        data: JSON.stringify(parstring),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (e) {
            treeviewds.items.unshift({
                assettoexplode: text, type: "User",
                USERID: userid, GROUPID: treeviewds.GROUPID, expanded: true, symbol: "http://" + window.location.host + symbol,
                imageUrl: "http://" + window.location.host + "/Magic/Styles/Images/user.png", items: []
            });

        },
        error: function (request, status, error) {
            kendoConsole.log(getObjectText("usertobuerror"), true);
        }

    });
    // appends a new node to the root level
    //           var wnd1 = $("#modalAddUser").data("kendoWindow");
    //wnd1.close();
}
//#endregion   

//#endregion
function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}

function openTree() {
    rolesds = getSpecificAppAssignedCodeValues();
    apply_style("/Magic/Views/Styles/Magic_UserGroupVisibilityTree.css");  //applica css
    appendwindows();
    var tree = new Array();
    var res = $.ajax({
        type: "POST",
        async: false,
        url: "/api/Visibility/GetSessionUserVisibilityGroup",
        data: JSON.stringify({}),
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    });
    tree = getJSONTree(res.responseText, "Magic_Mmb_UserGroupVisibility", "PostBuildUserGroupTree");
    var network = getdatasource("Magic_Mmb_UserGroupVisibility", "Description", "GetNetworkByGroup/" + res.responseText, "desc", null);
    //metto  in variabile l' elenco dei possibili proprietari di Business Units effettuando una POST. L' utente loggato apperterra' ad una certa applicazione che di conseguenza prendera' un ' entita' ben precisa (es. Broker etc...)

    buildHtmlTree("grouptree", "thetree", "true", "treeview-template", null, "onDrop", "onDragStart", "treesearch");
    
    if ($("#hideusersbtn").length === 0) {
        $("#grouptree > div > .input-group").append('<button id="hideusersbtn" onclick="return hideUsers();" style="float:right;"></button>');
        $("#hideusersbtn").text(getObjectText("hideusers"));
    }
    renderTree(tree, "grouptree", "thetree", network[0].Description, "treesearch");
 
    var wnd = $("#modalRootElementAdmin")
    .kendoWindow({
        title: getObjectText("addbu"),
        modal: true,
        visible: false,
        resizable: false,
        width: 400
    }).data("kendoWindow");

    var wnd1 = $("#modalAddUser")
     .kendoWindow({
         title: getObjectText("adduser"),
         modal: true,
         visible: false,
         resizable: false,
         width: 600
     }).data("kendoWindow");

    var wnd2 = $("#modalUpdateGroup")
     .kendoWindow({
         title: getObjectText("updatebu"),
         modal: true,
         visible: false,
         resizable: false,
         width: 400
     }).data("kendoWindow");

    var wnd3 = $("#modalAssocGroups")
     .kendoWindow({
         title: getObjectText("AssocGroups"),
         modal: true,
         visible: false,
         resizable: false,
         width: 800
     }).data("kendoWindow");


    $("#root").click(function () {
        var wnd = $("#modalRootElementAdmin").data("kendoWindow");

        detailsTemplate = kendo.template($("#SelectRootElement").html());

        wnd.content(detailsTemplate);

        $("#tabstrippopupSelectRootElement").kendoTabStrip({
            animation: {
                open: {
                    effects: "fadeIn"
                }
            }
        });
        //per fare in modo che i data-role funzionino
        kendo.init($("#modalRootElementAdmin"));
        //Scripts/AdminAreaCustomizations.js
        removeUnwantedGroupInfo();
        wnd.open();
        wnd.center();

    });
}