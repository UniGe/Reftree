function loadscript() {
	$("#appcontainer").append("<div id='app' style='height:700px;'></>");
	$(function () {
		var s = document.createElement("script");
		s.type = "text/javascript";
		s.src = "/magic/v/2018.1.0.0/scripts/3rd-party/bryntum-gantt/js/chunk-vendors.js";
		// Use any selector
		$("body").append(s);

		var s2 = document.createElement("script");
		s2.type = "text/javascript";
		s2.src = "/magic/v/2018.1.0.0/scripts/3rd-party/bryntum-gantt/js/app.js";
		// Use any selector
		$("body").append(s2);
		
	});
	$('.b-grid-body-container').height(700);
}