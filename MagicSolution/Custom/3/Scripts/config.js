//async added in order to load google maps async

var prefix = window.serviceWorkerUrlPathPrefix ?? ''; // Fallback to empty string if undefined

var refcustom = prefix + window.includesVersion + "/Custom/3/Scripts/";
var magicpath = prefix + window.includesVersion + "/Magic/v/" + window.applicationVersion;
var dwgPath = "http://ref2space.idearespa.com/r2sviewer/";
var refTreeAngularDirectivesPath = prefix + window.includesVersion + "/Views/3/Js/Directives/";

requirejs.config({
    paths: {
        'async': refcustom + 'async',
        'geocomplete': refcustom+ 'jquery.geocomplete.min',
        'geo': refcustom + 'geo',
        'markerclustererplus': magicpath + '/Scripts/3rd-party/gmaps/markerclusterer_packed',
        'imagesdocmng': refcustom + 'doc_Image_management',
        'plAssetmanagement': refcustom + 'plAssetmanagement',
        'groups_filter': refcustom + 'groups_filter',
        'assetmanagement': refcustom + 'assetmanagement',
        'dwgviewer': dwgPath + "openseadragon-r2sDwgViewer",
        'openseadragon': dwgPath + "openseadragon",
        'openseadragon-svg-overlay': dwgPath + "openseadragon-svg-overlay",
        'openseadragon-r2sDwgService': dwgPath + "openseadragon-r2sDwgService",
        'angular-dwg-viewer': refTreeAngularDirectivesPath + "dwg-viewer",
        'microsoftAjax':  "http://ajax.aspnetcdn.com/ajax/4.5.2/1/MicrosoftAjax",
        'r3':  window.includesVersion + "/Views/3/Js/cad-viewer.min",
        'angular-dxf-viewer': refTreeAngularDirectivesPath + "dxf-viewer",
        'tree-view-r3': refTreeAngularDirectivesPath + "treeViewTest",       
        'reftree-action-menu': refTreeAngularDirectivesPath + "reftree-action-menu",
        'tree-bim-r3': refTreeAngularDirectivesPath + "treeBim",
        'angular.drag.resize': refTreeAngularDirectivesPath + "angular-drag-resize",
        'angular-bim-forge': refTreeAngularDirectivesPath + "bim-Forge",
        'forge-viewer': window.includesVersion + "/Views/3/Js/" + "Forge_viewer_2",
        'usdz-viewer': window.includesVersion + "/Views/3/Js/usdz-viewer/" + "usdz-viewer-library",
        'ThreeGLTFViewer': window.includesVersion + "/Views/3/Js/three-gltf-viewer-lib.min",
        'angular-usdz-viewer': refTreeAngularDirectivesPath + "usdz-viewer",
        'angular-gltf-viewer': refTreeAngularDirectivesPath + "gltf-viewer",		
        //'getUsdModule': window.includesVersion + "/Views/3/Js/usdz-viewer/wasm/" + "emHdBindings",

    },
    shim: {
        'plAssetmanagement': {
            deps: [magicpath + "/Scripts/MagicDragAndDropFunctionsUtils.js", "geo", "markerclustererplus"]
        },
        'assetmanagement': {
            deps: [magicpath + "/Scripts/MagicDragAndDropFunctionsUtils.js", "geo", "markerclustererplus"]
        },
        'openseadragon-svg-overlay': {
            deps:["openseadragon"]
        },
        'openseadragon-r2sDwgService': {
            deps: ["openseadragon"]
        },
        'dwgviewer': {
            deps: ["openseadragon-svg-overlay","openseadragon-r2sDwgService","microsoftAjax"]
        }      
    }
});