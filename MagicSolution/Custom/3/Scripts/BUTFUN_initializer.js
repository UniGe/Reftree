function BUTFUN_initializer() //to be used when initialization must be performed on each require
{
    var $el = $("#appcontainer").prepend('<div id="navbar-controller" ng-controller="FunctionSubMenuController as c" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/HtmlTemplates/bootstrap-navbar.html\'"></div>').find("#navbar-controller")[0];
	var functionGUID = getCurrentFunctionGUIDFromMenu();
	var qs = window.getQsPars();
	var initial_SUBBUT_ID = null;
	if (qs) {
		let qsSplit = qs.split('&');
		let subbut = qsSplit.find((q) => q.indexOf("SUBBUT_ID") != -1);
		if (subbut)
			initial_SUBBUT_ID = subbut.split('=')[1];
	}
    var btngroups = [];
    requireConfigAndMore(["MagicSDK", "MagicActions"], function (MF) {
        MF.kendo.getStoredProcedureDataSource("core.MB_usp_get_function_buttons",
            {
                data: { functionGUID: functionGUID },
                success: function (e) {
					var insertedgroups = [];
					var objcmd;

					//i suppose the list to be hierarchically oredered , if a subbut is a dropdown it should be listed before ...
                    $.each(e.items, function (i, v) {
                        var columnsoverride= "";
                        if (v.actiontype == "SHOGD" && v.actioncommand && v.actioncommand.indexOf('{') != -1)
                        {
                            var cmnd = JSON.parse(v.actioncommand);
                            if (cmnd.command)
                                v.actioncommand = cmnd.command;
                            if (cmnd.columnsoverride)
                                columnsoverride = cmnd.columnsoverride;
						}

						
						var filterFormName = null;
						if (v.actiontype == "FRMPI") //FORM + SHOW PIVOT
						{
							objcmd = JSON.parse(v.actioncommand);
							v.actioncommand = objcmd.pivot;
							filterFormName = objcmd.form;
							v.actiontype = "PIVOT";
						}
						if (v.actiontype == "MGDSP") //Magic Grid sp + optional form
						{
							objcmd = JSON.parse(v.actioncommand);
							v.actioncommand = objcmd;
							filterFormName = objcmd.form;
						}
						if (v.actiontype == "FRMGD") //FORM + SHOW GRID
						{
							objcmd = JSON.parse(v.actioncommand);
							v.actioncommand = objcmd.grid;
							filterFormName = objcmd.form;
							v.actiontype = "SHOGD";
						}
						let isInitialButton = false;
						if (initial_SUBBUT_ID && initial_SUBBUT_ID == v.SUBBUT_ID)
							isInitialButton = true;

                        if (insertedgroups.indexOf(v.FUNBUT_ID) == -1) {
                            btngroups.push({
                                id: v.FUNBUT_ID,
                                grouplabel: v.FUNBUT_DESCRIPTION,
								btns: [{ isInitialButton, id: v.SUBBUT_ID, btnlabel: v.SUBBUT_DESCRIPTION, actioncommand: v.actioncommand, actiontype: v.actiontype, actionfilter: v.actionfilter, color: v.SUBBUT_COLOR, appendmode: v.SUBBUT_APPENDMODE, columnsoverride: columnsoverride ? columnsoverride.split(',') : null, filterFormName: filterFormName, btns:[] }]
                            });
                            insertedgroups.push(v.FUNBUT_ID);
                        } 
                        else {
							var idx = insertedgroups.indexOf(v.FUNBUT_ID);
							if (!v.SUBBUT_PARENT_ID)
								btngroups[idx].btns.push({ isInitialButton, id: v.SUBBUT_ID, btnlabel: v.SUBBUT_DESCRIPTION, actioncommand: v.actioncommand, actiontype: v.actiontype, actionfilter: v.actionfilter, color: v.SUBBUT_COLOR, appendmode: v.SUBBUT_APPENDMODE, columnsoverride: columnsoverride ? columnsoverride.split(',') : null, filterFormName: filterFormName ,btns:[]});
							else {
								var parent = btngroups[idx].btns.filter(function (x) { return x.id == v.SUBBUT_PARENT_ID });
								if (parent.length) {
									parent[0].hasChildren = true;
									parent[0].btns.push({ isInitialButton,id: v.SUBBUT_ID, btnlabel: v.SUBBUT_DESCRIPTION, actioncommand: v.actioncommand, actiontype: v.actiontype, actionfilter: v.actionfilter, color: v.SUBBUT_COLOR, appendmode: v.SUBBUT_APPENDMODE, columnsoverride: columnsoverride ? columnsoverride.split(',') : null, filterFormName: filterFormName });
								}
							}
						}
                    }
					);
					requireConfigAndMore(["angular-devExpress-globalized"], function () {
						initAngularController($el, "FunctionSubMenuController", { btngroups: btngroups, MF: MF }, null, false);
					});
                    
                }
            }).read();
    });
}