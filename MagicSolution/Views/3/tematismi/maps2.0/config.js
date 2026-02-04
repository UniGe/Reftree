requirejs.config({
	waitSeconds:30, //highered to 30 from 7
	paths: {
		'plani3d-maps': "plani3d-maps.min",
		'plani3d-maps-utils': "../js/plani3d-utilities.min",
		'jQuery': "../js/jq/jquery/2.2.3/jquery.min",
		'jQuery-typing': "../js/jq/jquery.typing-0.2.0.min",
		'jQuery-blockUI': "../js/jq/jquery.blockUI",
		'bootstrap': "../bootstrap/3.0.2/js/bootstrap.min",
		'jQueryUI': "../js/jq/jqueryui/1.10.1/jquery-ui.min",
		'ol': "../build/ol-debug",
		'proj': "../build/proj4",
		'alyssoTestData': "_test/atc-data",
		'alyssoTestCartData': "_test/thememap"
	},
	shim: {
		'plani3d-maps': {
			deps: [ "plani3d-maps-utils" ],
			exports: "plani3d"
		},
		'plani3d-maps-utils': {
			deps: [ "ol" ]
		},
		'ol': {
			deps: [ "proj" ],
			exports: "ol"
		},
		'proj': {
			deps: [ "jQueryUI" ],
			exports: "proj4"
		},
		'jQueryUI': {
			deps: [ "bootstrap" ]
		},
		'bootstrap': {
			deps: [ "jQuery-blockUI" ]
		},
		'jQuery-blockUI': {
			deps: [ "jQuery-typing" ]
		},
		'jQuery-typing': {
			deps: [ "jQuery" ]
		},
		'alyssoTestData': {
			exports: "themes"
		},
		'testData2': {
			exports: "themes"
		},
		'alyssoTestCartData': {
			exports: "tematismiCartografici"
		}
	}
});