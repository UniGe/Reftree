var alyssoPath = "/Views/3/tematismi/";
requirejs.config({
	waitSeconds:30, //highered to 30 from 7
	paths: {
        'alysso': alyssoPath + "/maps2.0/plani3d-maps",
        'alysso3D': alyssoPath + "/3d/plani3d-3d.min",
	    'alysso-utils': alyssoPath + "js/plani3d-utilities.min",
	    //'alysso-jQuery': alyssoPath + "js/jq/jquery/2.2.3/jquery.min",
	    'jQuery-typing': alyssoPath + "js/jq/jquery.typing-0.2.0.min",
	    //'jQuery-blockUI': alyssoPath + "js/jq/jquery.blockUI",
	    //'bootstrap': alyssoPath + "bootstrap/3.0.2/js/bootstrap.min",
	    'alysso-jQueryUI': alyssoPath + "js/jq/jqueryui/1.10.1/jquery-ui.min",
	    'ol': alyssoPath + "build/ol-debug",
	    'alyssoTestData': alyssoPath + "tematismi/_test/data.json",
        'proj': alyssoPath + "build/proj4",
        'cesium': alyssoPath + "build/Cesium/Cesium"
	},
    shim: {
        'alysso3D': {
            deps: ["alysso-utils", "cesium"],
            exports: "plani3dmodel"
        },
	    'alysso': {
	        deps: ["alysso-utils"],
	        exports: "plani3d"
	    },
	    'alysso-utils': {
	        deps: ["ol"]
	    },
	    'ol': {
	        deps: ["alysso-jQueryUI"],
	        exports: "ol"
	    },
	    'alysso-jQueryUI': {
	        //deps: ["bootstrap"]
	        deps: ["jQuery-typing"]
	    },
	    //'bootstrap': {
	    //    deps: ["jQuery-blockUI"]
	    //},
	    //'jQuery-blockUI': {
	        //deps: ["jQuery-typing"]
	    //},
	    //'jQuery-typing': {
	    //    deps: ["alysso-jQuery"]
	    //},
	    'proj': {
	        deps: ["alysso-jQueryUI"],
	        exports: "proj4"
	    },
	    'alyssoTestData': {
	        exports: "tematismiREFtree"
	    }
	}
});