function showGroupsSelTree(e)
{

    $("#wndmodalContainer").removeClass("modal-wide");
    if ($("#wndmodalContainer").hasClass("modal-full"))
        $("#wndmodalContainer").removeClass("modal-full");
    $(".modal-title").text(getObjectText("addgroupfilter"));
    $("#contentofmodal").empty();
    $("#contentofmodal").append('<div id="groupselectortree"></div>');
    $("#executesave").unbind("click");
    $("#executesave").bind("click",updateGroupSelectionForUser);
    $("#wndmodalContainer").modal('toggle');
    $("#groupselectortree").load("/Views/3/Templates/US_GROUPS_Groups_selector.html", buildTree);
    //buildTree
    function buildTree() {

        var nodetempl = '<script id="grouptreeElementTemplate" type="text/x-kendo-template">#= grouptreeElementTemplate(item) #</script>';
        if ($("#grouptreeElementTemplate").length==0)
            $("#appcontainer").append(nodetempl);

        var options = { name: "SP_US_GROSEL_TREE", data: { }, treecontainer: "#treeofgroups", showtreedescription: false };
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.kendo.appendTreeToDom(options);
        });
    }
}

function grouptreeElementTemplate(item) {
    return groupcomponentTemplate(item);
}
//richiamata nel template maintenance-tree-template definito su DB per costruire il template dei vari nodi. 
function groupcomponentTemplate(item) {   //assetid corrisponde al TMP_OBJ_ID della stored di creazione del tree
    var template = item.assettoexplode;
    var checked = "";
    if (item.selected)
        checked = "checked='checked'";
    switch (item.type) {
        case 'GROUPS':
            template += "<input objid="+ item.assetid +" type='checkbox' style='margin-left:5px;'" + checked + '>';
            break;
        case 'CLAGRU':
            template += "<input type='checkbox' style='margin-left:5px;'" + checked + ' onclick="checkchildren(this);">';
            break;
        case 'TIPGRU':
            template += "<input type='checkbox' style='margin-left:5px;'" + checked + ' onclick="checkchildren(this);">';
            break;
    }
    return template;
}
function checkchildren(e)
{
    if ($(e).is(":checked"))
        $(e).closest(".k-item").find(".k-group .k-item").find("input").prop("checked", "checked");
    else
        $(e).closest(".k-item").find(".k-group .k-item").find("input").removeProp("checked");
}
function updateGroupSelectionForUser(e)
{
    var arr = [];
    //get all checked inputs
    var objids = $("#treeofgroups").find("input").each(function (i, v) {
        if ($(v).attr("objid") && $(v).is(":checked"))
            arr.push( $(v).attr("objid"));
    });
    if (arr.length>0)
        sessionStorage.setItem("groupsfilter", "true");
    else
        sessionStorage.setItem("groupsfilter", "false");
    var options = { table: "core.US_GROSEL_selected_groups", data: { us_groups: arr.join() } , procedure: "core.US_GROSEL_REFRESH", action: "create", primaryKeyColumn: "US_GROSEL_ID", contentType: "XML" };
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.set(options).then(function (e) {
            $("#wndmodalContainer").modal('toggle');
        });
    });

}