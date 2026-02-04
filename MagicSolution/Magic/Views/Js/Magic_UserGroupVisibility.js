function loadscript() {
    var gridobj = getrootgrid('Magic_Mmb_UserGroupVisibility');
    var data = {};
    $.ajax({
        type: "POST",
        async: false,
        url: manageAsyncCallsUrl(false,"/api/Visibility/getSessionUserVisibilityGroup"),
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            gridobj.dataSource.schema.model.fields.ParentGroup_ID.defaultValue = result.d;
            renderGrid(gridobj, null);

        }
    });
}