function showAssetGallery(data)
{
    if (!$("#wndmodalContainer").hasClass("modal-wide"))
            $("#wndmodalContainer").addClass("modal-wide");
    $(".modal-title").text(getObjectText("imggallery"));
    $("#contentofmodal").empty();
    $("#contentofmodal").append('<div id="imggallerycontent"></div>');
    $("#executesave").unbind("click");
    $("#executesave").hide();
    $("#wndmodalContainer").modal('toggle');
    $("#imggallerycontent").load("/Views/3/Templates/DOC_AssetImageGallery.html", buildGalleryTree);
    //buildTree
    function buildGalleryTree() {
        var options = { name: "AS_USP_GetAssetTypeImages", data: { assetid: data.AS_ASSET_ID }, treecontainer: "#treeofassettypes", showtreedescription: false, hidenodeselector: ".k-top.k-bot" };
        getrootAndRenderDBTree(options); //crea il tree nel container dato
        $("#treeofassettypes").attr("assetid", data.AS_ASSET_ID);
    }
}
function buildRefreshAssetGallery(docfiles) {
    if (docfiles.length > 0) {
        var dataSource = new kendo.data.DataSource({
            data: docfiles,
            pageSize: 10
        });

        if ($("#pager").data("kendoPager") != null)
            $("#pager").data("kendoPager").setDataSource(dataSource);
        else {
            $("#pager").kendoPager({
                dataSource: dataSource,
                pageSizes:true
            });
        }
        if ($("#listView").data("kendoListView")!=null)
            $("#listView").data("kendoListView").setDataSource(dataSource);
        else
            $("#listView").kendoListView({
            dataSource: dataSource,
            template: kendo.template($("#template").html())
        });
    }
}
//selezione di un elemento del tree della galleria associata ad un asset
function onAssetTypeSelection(e)
{
    var tree = e.sender;
    var jqdata = tree.findByUid($(e.node).attr("data-uid"));
    var data = tree.dataItem(jqdata);
    var id = data.assetid;
    if (data.type == "CLADOC") {
        e.preventDefault();
    }
    else {//TIPDOC id = TIPDOC_ID
        //load dei files legati ad un TFAULT
        var assetmainID = $("#treeofassettypes").attr("assetid");
        var docfiles = [];
        var docsloader = new $.Deferred;
       // var api = "/api/GENERICSQLCOMMAND/GetWithFilter";
       // var docsdata = { table: "core.DO_V_DOCFIL_ASSET", order: "DO_DOCFIL_NOTE", where: "AS_ASSET_ID = " + assetmainID + " AND DO_TIPDOC_ID = " + id };
        var docsuccess = function (result) {
            docfiles = result;
            docsloader.resolve();
        };

        //$.ajax({ url: api, type: "POST", contentType: "application/json; charset=utf-8", data: JSON.stringify(docsdata), error: ajaxerror, success: docsuccess, dataType: "json" });
        //$.when(docsloader).then(
        //    function () {
        //        buildRefreshAssetGallery(docfiles);
        //    });

		requireConfigAndMore(["MagicSDK"], function (MF) {
			MF.api.getDataSet({ DO_DOCUME_ID: data.DO_DOCUME_ID, DO_TIPDOC_ID: id }, "core.DO_USP_IMG_GALLERY_SELECT")
				.then(function (res) {
					if (!res.length) {
						if (res.status == 500 && res.responseText)
							console.log(res.responseText);
						doModal(false);
						docsloader.reject();
					}
					docsuccess(res[0]);
					buildRefreshAssetGallery(docfiles);
				});
		});
    }
}

function showGallery(data)
{
    doModal(true);
        function buildGallery() {
            if (docfiles.length > 0) {
                var dataSource = new kendo.data.DataSource({
                    data: docfiles,
                    pageSize: 10
                });

                $("#pager").kendoPager({
                    dataSource: dataSource,
                    pageSizes:true
                });
                $("#listView").kendoListView({
                    dataSource: dataSource,
                    template: kendo.template($("#template").html())
                });
            }
        }
            //load dei files legati ad un TFAULT
            var docfiles = [];
            var docsloader = new $.Deferred;

            //var api = "/api/GENERICSQLCOMMAND/GetWithFilter";
            //var docsdata = { table: "core.DO_V_DOCFIL", order: "DO_DOCFIL_NOTE", where: "DO_DOCFIL_DO_DOCUME_ID = " + data.DO_DOCUME_ID };

            var docsuccess = function (result) {
                docfiles = result;
                docsloader.resolve();
            };
           
	//$.ajax({ url: api, type: "POST", contentType: "application/json; charset=utf-8", data: JSON.stringify(docsdata), error: ajaxerror, success: docsuccess, dataType: "json" });

	requireConfigAndMore(["MagicSDK"], function (MF) {
		MF.api.getDataSet({ DO_DOCUME_ID: data.DO_DOCUME_ID }, "core.DO_USP_IMG_GALLERY_SELECT")
			.then(function (res) {
				if (!res.length) {
					if (res.status == 500 && res.responseText)
						console.log(res.responseText);
					doModal(false);
					docsloader.reject();
				}
				docsuccess(res[0]);
				doModal(false);
				if ($("#wndmodalContainer").hasClass("modal-wide"))
					$("#wndmodalContainer").removeClass("modal-wide");
				if ($("#wndmodalContainer").hasClass("modal-full"))
					$("#wndmodalContainer").removeClass("modal-full");
				$(".modal-title").text(getObjectText("imggallery"));
				$("#contentofmodal").empty();
				$("#contentofmodal").append('<div id="imggallerycontent"></div>');
				$("#executesave").unbind("click");
				$("#executesave").hide();
				$("#wndmodalContainer").modal('show');
				$("#imggallerycontent").load("/Views/3/Templates/DOC_ImageGallery.html", buildGallery);

			});
	});
}
//usato nel gallery DOC_ImageGallery.html per creare il link al file originale
function buildImageGalleryWindowVar(id, file,docfilid) {
    if (!window.CurrentImageGallery)
        window.CurrentImageGallery = {};
    window.CurrentImageGallery[id+ "-" +docfilid] = file;
}
function viewOrigPicture(id,docfilid) {
    var obj = { DO_DOCFIL_DO_DOCUME_ID: id, DO_DOCVER_LINK_FILE: window.CurrentImageGallery[id + "-" + docfilid] };
    $.fileDownload('/api/Documentale/ViewFile/', { data: obj, httpMethod: "POST" });
}
