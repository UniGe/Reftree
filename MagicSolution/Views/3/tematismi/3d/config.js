requirejs.config({
	waitSeconds:30, //highered to 30 from 7
	paths: {
		'plani3d-3d': "plani3d-3d.min",
		'plani3d-maps-utils': "../js/plani3d-utilities.min",
		'jQuery': "../js/jq/jquery/2.2.3/jquery.min",
		'jQuery-typing': "../js/jq/jquery.typing-0.2.0.min",
		'jQuery-blockUI': "../js/jq/jquery.blockUI",
		'bootstrap': "../bootstrap/3.0.2/js/bootstrap.min",
		'jQueryUI': "../js/jq/jqueryui/1.10.1/jquery-ui.min",
		'cesium': "../build/Cesium/Cesium",
		'testdata': "_test/theme-subs"
	},
	shim: {
		'plani3d-3d': {
			deps: [ "plani3d-maps-utils", "cesium" ],
			exports: "plani3dmodel"
		},
		'cesium': {
			deps: [ "jQueryUI" ],
			exports: "Cesium"
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
		'testdata': {
			exports: "themes"
		},
	}
});