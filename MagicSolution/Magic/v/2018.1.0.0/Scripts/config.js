(function () {
    var prefix = window.serviceWorkerUrlPathPrefix ?? ''; // Fallback to empty string if undefined

    var kendoPath =  window.includesVersion + "/Magic/kendo/2016.1.226/js/",
        angularDirectivesPath = prefix+ window.includesVersion + "/Magic/Views/Js/Directives/",
        devExpressPath = prefix+ window.includesVersion + "/Magic/DevExtreme/Lib/js/",
        angularVersion =
            //(prefix ? prefix + "/" : "") +
            "angular-1.4.6/",
        reactPath = prefix+ window.includesVersion + "/Magic/Views/Js/react/build/",
        baseUrl = prefix + window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts";

    var paths= {
            "angular": angularVersion + "angular",
            "angular-sanitize": angularVersion + "angular-sanitize.min",
            "angular-animate": angularVersion + "angular-animate.min",
            "angular-route": angularVersion + "angular-route.min",
            "angular-count-to": angularDirectivesPath + 'angular-count-to',
            "angular-search-drop": angularDirectivesPath + 'search-drop',
            "angular-magic-form": angularDirectivesPath + 'magic-form',
            "angular-magic-form-sp": angularDirectivesPath + 'magic-form-sp',
            "angular-easy-map": angularDirectivesPath + 'easy-map',
            "angular-bo-selector": angularDirectivesPath + 'bo-selector',
            "angular-tag-selector": angularDirectivesPath + 'tag-selector',
            "angular-grid-form": angularDirectivesPath + 'grid-form',
            "angular-grid-form-legacy": angularDirectivesPath + 'grid-form-legacy',
            "angular-magic-slider": angularDirectivesPath + 'magic-image-slider',
            "angular-magic-gantt": angularDirectivesPath + 'magic-gantt',
            "angular-magic-grid": angularDirectivesPath + 'magic-grid',
            "angular-magic-grid-sp": angularDirectivesPath + 'magic-grid-sp',
            "angular-magic-change-log": angularDirectivesPath + 'magic-change-log',
            "angular-magic-chart": angularDirectivesPath + 'magic-chart',
            "angular-magic-chart-gauge": angularDirectivesPath + 'magic-chart-gauge',
            "angular-magic-pivot": angularDirectivesPath + 'magic-pivot',
            "angular-magic-tree": angularDirectivesPath + 'magic-tree',
            "angular-magic-timesheet": angularDirectivesPath + 'magic-timesheet',
            "angular-magic-action-menu": angularDirectivesPath + 'magic-action-menu',
            "angular-magic-wizard": angularDirectivesPath + 'magic-wizard',
            "angular-magic-actions": angularDirectivesPath + 'magic-actions',
            "angular-magic-indicator": angularDirectivesPath + 'magic-indicator',
            "angular-magic-carousel": angularDirectivesPath + 'magic-carousel',
            "angular-underscore": "angular-3rd-party/angular-underscore.min",
            "angular-ui-select": "angular-3rd-party/ui-select-0.19.8/dist/select.min", //loadCss(["select"]);
            "angular-ui-sortable": "angular-3rd-party/sortable",
            "angular-strap": "angular-3rd-party/angular-strap.min",
            "angular-strap-tpl": "angular-3rd-party/angular-strap.tpl.min",
            "angular-ui-bootstrap": "angular-3rd-party/ui-bootstrap-tpls.min",
            "angular-translate": "angular-3rd-party/angular-translate.min",
            "angular-filter": "angular-3rd-party/angular-filter.min",
            "angular-schema-form": "angular-3rd-party/schema-form-lang",
            "angular-schema-form-core": "angular-3rd-party/schema-form.min",
            "angular-schema-form-dynamic-select": "angular-3rd-party/angular-schema-form-dynamic-select.min",
            "angular-schema-form-dynamic-select-ui": "angular-3rd-party/angular-schema-form-dynamic-select.min",
            "angular-schema-form-datetimepicker": "angular-3rd-party/schema-form-date-time-picker.min",
            "angular-schema-form-searchgrid": "angular-3rd-party/schema-form-searchgrid",
            "angular-schema-form-grid": "angular-3rd-party/schema-form-grid",
            "angular-schema-form-bo-selector": "angular-3rd-party/schema-form-bo-selector",
            "angular-schema-form-geo-autocomplete": "angular-3rd-party/schema-form-geo-autocomplete",
            "angular-kendo": window.includesVersion + "/Magic/kendo/2014.3.1316/js/kendo.angular.min",
            "angular-json-editor": "angular-3rd-party/angular-json-editor",
            "angular-ace": "angular-3rd-party/ui-ace",
            "angular-google-maps": "angular-3rd-party/angular-google-maps.min",            
            "angular-ng-map": "angular-3rd-party/ng-map.no-dependency", //NF20180308: https://github.com/allenhwkim/angularjs-google-maps Ver. 1.18.4 introduced for x-co-bim
            "angular-simple-logger": "angular-3rd-party/angular-simple-logger.min",
            "angular-drag-and-drop-lists": "angular-3rd-party/angular-drag-and-drop-lists.min",
            "angular-devExpress-globalized": devExpressPath + "globalize/main",
            "ace": "3rd-party/ace/ace",
            "gridstack": "angular-3rd-party/gridstack/gridstack", //loadCss(["gridstack"], window.includesVersion + "/Magic/v/2018.1.0.0/Styles/3rd-party/gridstack/"); //add this line to your Controller                           
            "gridstack-angular": "angular-3rd-party/gridstack/gridstack-angular",
            "tv4": "3rd-party/tv4.min",
            'jquery-textcomplete': "jquery.textcomplete.min",
            'bootstrap-tagsinput': "3rd-party/bootstrap-tagsinput.min",
            'bootstrap-decorator': "angular-3rd-party/bootstrap-decorator.min",
            "JSONEditor": "jsoneditor.min",
            "vkbeautify": "vkbeautify", //beautify/uglify xml, html, sql, json, css
            'ObjectPath': '3rd-party/ObjectPath',
            "underscore": "3rd-party/underscore-min",
            "jQueryUI": "3rd-party/jquery-ui.min",
            "jsondiffpatch-formatter": "3rd-party/jsondiffpatch-formatters.min",
            "jsondiffpatch": "3rd-party/jsondiffpatch-full.min",
            "lodash": "3rd-party/lodash.min",
            "jsPlumb": "3rd-party/jquery.jsPlumb-1.6.4-min",
            "devExpress": devExpressPath + "dx.viz-web.debug.patched.min",
            'cldr': devExpressPath + "cldr",
            'cldr/event': devExpressPath + "cldr/event.patched",
            'cldr/supplemental': devExpressPath + "cldr/supplemental.patched",
            "devExpress-message": devExpressPath + "globalize/message.patched",
            "devExpress-globalize": devExpressPath + "globalize",
            "devExpress-number": devExpressPath + "globalize/number.patched",
            "devExpress-date": devExpressPath + "globalize/date.patched",
            "devExpress-currency": devExpressPath + "globalize/currency.patched",
            "devExpress-globalized": devExpressPath + "globalize/main",
            "bootstrap-notifications": "3rd-party/bootstrap-notify.min",
            "jsPDF": "3rd-party/jsPDF",
            "html2canvas": "3rd-party/html2canvas",
            "google-maps-api": "https://maps.googleapis.com/maps/api/js?libraries=places,drawing&key=" + window.mapAK,
            "babel-polyfill": reactPath + "babel-polyfill",
            "tag-selector": "TagSelector",
            "bootstrap3-typeahead": "3rd-party/bootstrap3-typeahead.min",
            "angular-messages": angularVersion + "angular-messages.min",
            "momentjs": "3rd-party/moment-with-locales.min",
			"zip": "3rd-party/zip/zip",
			"jquery-extendext": "3rd-party/jQuery.extendext",
			"dot/doT": "3rd-party/doT.min",
			"query-builder": "3rd-party/query-builder.standalone.min",
			"pdfjs-dist/build/pdf": "3rd-party/pdfjs/pdf.min",
			//"pdfjs-dist/build/pdf.worker": "3rd-party/pdfjs/pdf.worker.min",
    };

    //tells require that it doesent need to load jquery if required
    define("jquery", function () { return jQuery; });
    requirejs.config({
        config: {
            "angular-devExpress-globalized": {
                kendoPath: kendoPath,
                devExpressPath: devExpressPath
            },
            "devExpress-globalized": {
                kendoPath: kendoPath,
                devExpressPath: devExpressPath
            }
        },
        waitSeconds: 30, //highered to 30 from 7
        baseUrl: baseUrl,
        map: {
            "*": {
                'kendo.core.min': prefix+ kendoPath + "kendo.all.min.js"
            }
        },
        paths: paths,
        shim: {
            'angular': {
                exports: "angular",
                init: function () {
                    require(["angular-1.4.6/i18n/angular-locale_" + culture]); //loads the il8n localization for the angular $locale service
                }
            },
            'angular-sanitize': {
                deps: ['angular']
            },
            'angular-animate': {
                deps: ['angular']
            },
            "angular-route": {
                deps: ['angular']
            },
            'angular-count-to': {
                deps: ['angular']
            },
            'angular-search-drop': {
                deps: ['angular']
            },
            'angular-magic-form': {
                deps: ['angular']
            },
            'angular-filter': {
                deps: ['angular']
            },
            'angular-underscore': {
                deps: ['angular', 'underscore']
            },
            'angular-ui-select': {
                deps: ['angular']
            },
            'angular-ui-sortable': {
                deps: ['angular']
            },
            'angular-strap': {
                deps: ['angular']
            },
            'angular-strap-tpl': {
                deps: ['angular-strap']
            },
            'angular-ui-bootstrap': {
                deps: ['angular']
            },
            'angular-translate': {
                deps: ['angular']
            },
            'angular-kendo': {
                deps: ['angular']
            },
            "angular-json-editor": {
                deps: ['angular', 'JSONEditor']  
            },
            "angular-ace": {
                deps: ["angular", "ace"]
            },
            "angular-simple-logger": {
                deps: ["angular"]
            },
            "angular-google-maps": {
                deps: ["angular", "angular-simple-logger", "lodash"]
            },
            // "angular-magic-slider": {
            //     deps: ["angular", "angular-animate"]
            // },
            "ace": {
                exports: 'ace'
            },
            "jsondiffpatch": {
                exports: "jsondiffpatch"
            },
            "jsondiffpatch-formatter": {
                deps: ["jsondiffpatch"], //add this function to your script: loadCss(["annotated", "html"]);
                exports: 'jsondiffpatch'
            },
            'ObjectPath': {
                exports: 'ObjectPath'
            },
            'angular-schema-form': {
                deps: ['angular-sanitize'],
            },
            'bootstrap-decorator': {
                deps: ['angular-schema-form']
            },
            'angular-schema-form-dynamic-select': {
                deps: ['bootstrap-decorator', 'angular-strap-tpl']
            },
            'angular-schema-form-dynamic-select-ui': {
                deps: ['bootstrap-decorator', 'angular-strap-tpl', /*'jQueryUI', 'angular-underscore', */'angular-ui-select', 'angular-translate', 'angular-ui-sortable']
            },
            "angular-schema-form-datetimepicker": {
                deps: ['bootstrap-decorator', 'angular-strap-tpl']
            },
            "angular-schema-form-searchgrid": {
                deps: ['bootstrap-decorator', 'angular-strap-tpl', 'angular-schema-form-dynamic-select-ui']
            },
            "angular-devExpress": {
                deps: ['angular', 'angular-sanitize']
            },
            "angular-devExpress-globalized": {
                deps: ['angular', 'angular-sanitize']
            },
            "gridstack": {
                deps: ['jQueryUI']
            },
            'JSONEditor': {
                exports: 'JSONEditor'
            },
            "jQueryUI": {
                exports: "$"
            },
            "underscore": {
                exports: "_"
            },
            "jsPlumb": {
                exports: "jsPlumb"
            },
            "html2canvas": {
                exports: "html2canvas"
			},
            "zip": {
                init: function () {
                    this.zip.workerScriptsPath = baseUrl + "/3rd-party/zip/";
                    return this.zip;
                }
            }
        }
    });
})();