function loadscript() {
	$("#appcontainer").append("<div id='reportmaindiv'></div>");
	console.log('aaa');
	var reportToOpen = "/magic/utils/reportviewer.aspx?report=/CE/Classifica_calcio&fc=AnagraficaArbitri&removeugvi=1&FromMF=true&adduserID=true";
	appendReportToPage(reportToOpen, "reportmaindiv");
}