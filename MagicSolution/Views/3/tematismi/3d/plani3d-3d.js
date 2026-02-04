// Plani3D Maps 1.2.3

// global namespace
var alysso = alysso || {};
var plani3dmodel = plani3dmodel || {};///////////////////////////////////////////////////////////////////////
//                                                                   //
//  FILE CONTENENTE CONFIGURAZIONI, TIPICAMENTE OGGETTO DI MOFIFICA  //
//                                                                   //
///////////////////////////////////////////////////////////////////////


// valorizza i riferimenti in arrivo come parameters nella url
var alyssoInputDate = getUrlVars['dataRif'];

// VARIAZIONI AI PROTOTYPES
// metodo per controllare se una stringa comincia con un determinato prefisso
String.prototype.startsWithIgnorCase = function(elem){
	 return this.toUpperCase().indexOf(elem.toUpperCase()) === 0;
}

Set.prototype.union = function(setB) {
    var union = new Set(this);
	for (var it = setB.values(), elem = null; elem = it.next().value;) {
        union.add(elem);
    }
    return union;
}

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
	for (var it = setB.values(), elem = null; elem = it.next().value;) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

Set.prototype.difference = function(setB) {
    var difference = new Set(this);
	for (var it = setB.values(), elem = null; elem = it.next().value;) {
        difference.delete(elem);
    }
    return difference;
}

//metodo per fare replaceAll
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

//dizionario per l'eliminazione di lettere accentate
var alyLatinMap={"Á":"A","À":"A","É":"E","È":"E","Í":"I","Ì":"I","Ó":"O","Ờ":"O","Ú":"U","Ù":"U","á":"a","à":"a","é":"e","è":"e","í":"i","ì":"i","ó":"o","ờ":"o","ú":"u","ù":"u"};

//funzione per la sostituzione delle lettere accentate
String.prototype.alyLatinize = function(){
	return this.replace(/[^A-Za-z0-9\[\] ]/g,function(a){
		return alyLatinMap[a]||a})
	};

plani3dmodel.Config = function(objConfig) {
	// valorizza il riferimento al nome dell'oggetto al livello 0
	this.server = objConfig.server;
	this.maps = objConfig.maps;

	// ### inizio variabili costanti
	this.viewer;
	this.strJsonDataType = "json";
	this.strApplicationJson = "application/json";
	// ### fine variabili costanti

	this.init = function() {
		this.prepareBlockUIPanel();
	}

	// funzione che predispone le caratteristiche di default del blockui 
	this.prepareBlockUIPanel = function() {
	    // predispone una tantum le caratteristiche di default del ui-block
	    $.blockUI.defaults = {
			message: '<img src="./imgs/loading.gif" style="height: 20px; vertical-align: middle; padding-right: 8px;"/><span style="vertical-align: middle;">Attendere...</span>',
		    theme: false, // set to true to use with jQuery UI themes
		    // styles for the message when blocking
		    css: {
	        	margin: 0,
	        	width: '20%',
	        	top: '40%',
	    		left: '40%',
	    		textAlign: 'center',
		        cursor: 'defautl',
		        border: 'none',
		        padding: '15px',
		        backgroundColor: '#000',
		        'border-radius': '10px',
		        '-webkit-border-radius': '10px',
		        '-moz-border-radius': '10px',
		        opacity: 0.5,
		        color: '#fff'
		    },
		    // minimal style set used when themes are used
		    themedCSS: { 
		        width: '30%',
		        top: '40%',
		        left: '35%'
		    }, 
		    // styles for the overlay 
		    overlayCSS: {
		        backgroundColor: '#000',
		        opacity: 0.6,
		        cursor: 'defautl'
		    },
		    // style to replace wait cursor before unblocking to correct issue of lingering wait cursor 
		    cursorReset: 'default',
		    // styles applied when using $.growlUI
		    growlCSS: {
		        width: '350px',
		        top: '10px',
		        left: '',
		        right: '10px',
		        padding: '5px',
		        opacity: 0.6,
		        color: '#fff',
		        backgroundColor: '#000',
		        cursor: null,
		        border: 'none',
		        'border-radius': '10px',
		        '-webkit-border-radius': '10px',
		        '-moz-border-radius':    '10px'
		    },
		    // set these to true to have the message automatically centered
		    centerX: true, // <-- only effects element blocking (page block controlled via css above) 
		    centerY: true,
		    // allow body element to be stetched in ie6; this makes blocking look better
		    // on "short" pages.  disable if you wish to prevent changes to the body height
		    allowBodyStretch: true,
		    // enable if you want key and mouse events to be disabled for content that is blocked 
		    bindEvents: true,
		    // be default blockUI will supress tab navigation from leaving blocking content
		    // (if bindEvents is true)
		    constrainTabKey: true,
		    // fadeIn time in millis; set to 0 to disable fadeIn on block
		    fadeIn:  300,
		    // fadeOut time in millis; set to 0 to disable fadeOut on unblock
		    fadeOut:  300,
		    // time in millis to wait before auto-unblocking; set to 0 to disable auto-unblock 
		    timeout: 0,
		    // disable if you don't want to show the overlay
		    showOverlay: true,
		    // don't ask;
		    quirksmodeOffsetHack: 4,
		    // class name of the message block
		    blockMsgClass: 'p3d-blockMsg',
		    // if it is already blocked, then ignore it (don't unblock and reblock)
		    ignoreIfBlocked: false
	    };
	};
};
alysso.Utils = function(configObject) {
	this.objConfig = configObject;
	
	//funzione che controlla se una stringa è numerica
	this.isNumeric = function( input ) {
	    return !isNaN( input );
	}
	
	//function ritorna la data attuale nel formato YYYY-MM-DD
	this.getTodayFormatted = function() {
		var today = new Date();
		var dd = today.getDate();
		dd = dd<10?"0"+dd:dd;
		var mm = today.getMonth()+1; //i mesi partono da 0
		mm = mm<10?"0"+mm:mm;
		
		return today.getFullYear() + "-" + mm + "-" + dd;
	}

	this.getDateInWFSFormat = function(inDate) {
		return inDate + this.objConfig.validityDateTimeSection;
	}

	this.storeGeneralCallTimeAndReturnIt = function() {
		var currentTime = new Date().getTime();
		this.objConfig.lastIdentifyTime = currentTime;
		return currentTime;
	}

	//ritorna la stringa con la prima lettera in maiuscolo
	this.capitalizeFirstCharacter = function(inputString) {
		if (typeof inputString != 'undefined' && inputString.length > 0) {
			return inputString.charAt(0).toUpperCase() + inputString.slice(1);
		}
	}

	this.setInternalNulls = function(data) {
		// esegue un stringify per sostituire gli eventuali campi null e poi ritorna in formato oggetto tramite il parse
		var myJSONText = JSON.stringify(data, function(key, value) {
			return (value == null || value == "null")? "" : (($.type(value) === "string")? value.replaceAll("\"","'") : value);
		});
		return JSON.parse(myJSONText);
	}

	//funziona che ritorna l'oggetto di un array che ha un valore specifico per una determinata proprietà
	this.getObjFromArrayByPropValue = function(array, prop, value) {
	    for (var i in array) {
	    	if (typeof array[i][prop] != 'undefined' && array[i][prop] == value) {
	    		return array[i];
	    	}
	    }
	    return {};
	}

	//funzionalità che permette di inserire in uno specifico LayerVector le geometrie delle feature da evidenziare
	this.addGeometryFeatureToHighlightLayerVector = function(geom, hlLayerVector, featAttributes) {
		// se passati in input (es. in ricerca) valorizza gli attributi aggiuntivi della feature
		if (typeof featAttributes == 'undefined') {
			featAttributes = null;
		}
		
		if (geom.getType() == "Point") {
			var pointFeat = new ol.Feature({geometry: geom});
			hlLayerVector.getSource().addFeature(pointFeat);
		}
		else {
			// TODO provare new ol.Feature({geometry: geom});
			var polygons = geom.getPolygons();
		    for(var keyGeom in polygons) {
		        var feat = new ol.Feature({geometry: polygons[keyGeom]});
		        hlLayerVector.getSource().addFeature(feat);
		    }
		}
	}

	this.dehighlightSelection = function(vectorLayer){
		vectorLayer.getSource().clear();
	}

	//controlla se un oggetto e' contenuto in un array
	this.isContainedInArray = function(theObj, theArray){
		for(var ind in theArray){
			if(theArray[ind] == theObj){
				return true;
			}
		}
		return false;
	}

	//funziona che ritorna l'oggetto di un array che ha un valore specifico per una determinata proprietà
	this.getPropValueFromArray = function(array, prop, value, propToGet) {
		var propToGetValue = '';
		for (var i in array) {
			if (typeof array[i][prop] != 'undefined' && array[i][prop] == value && typeof array[i][propToGet] != 'undefined') {
				propToGetValue = array[i][propToGet];
				break;
			}
		}
		return propToGetValue;
	}

	this.getWebappUrl = function(protocol, server) {
		return protocol+"://"+server;
	}

	this.getServerUrl = function(protocol, server, webapp) {
		return this.getWebappUrl(protocol, server)+"/"+webapp;
	}

	this.resizeBodyHeight = function() {
		$('body').css('height', (window.innerHeight)+'px');
	}
	
	this.resizeHeighDiv = function (divIdToResize, newHeigth, divContainer) {
		var height = 0;
		
		if(divContainer) {
			height = divContainer.height();
		}
		newHeight = parseInt(""+(height * newHeigth / 100));
		$(divIdToResize).height(newHeight);
	}
	
	this.tableToJson = function(table) {
		
		var res = {};
		
		table = table.substring(table.indexOf("<td>")+4, table.length);
		table = table.substring(0, table.lastIndexOf("</td>"));
		
		var rows = table.split("</td></tr><tr><td>");
		
		for (var i in rows) {
			var row = rows[i];
			var cols = row.split("</td><td>");
			
			res[cols[0]] = cols[1];
		}
		
		return res;
	}
}

plani3dmodel.Plani3D = function(params) {

	// valorizza il riferimento 'conf' interno e il riferimento al nome dell'oggetto al livello 0
	var conf = params;

	var ready = false;

	// default 1/2
	if (typeof conf.imgpath == 'undefined')
		conf.imgpath = '';
	if (typeof conf.protocol == 'undefined')
		conf.protocol = 'http';
	if (typeof conf.webapp == 'undefined')
		conf.webapp = 'plani3d-viewer';
	if (typeof conf.maps == 'undefined')
		conf.maps = 'default';
	if (typeof conf.target == 'undefined')
		conf.target = 'p3d-model';

	var p3dconfig = new plani3dmodel.Config({server: params.server});
	var alyssoutils = new alysso.Utils(p3dconfig);

	// OpenStreetMap tile provider
	var osm = Cesium.createOpenStreetMapImageryProvider({
		url : 'https://a.tile.openstreetmap.org/'
	});
	var esri = new Cesium.ArcGisMapServerImageryProvider({
		url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
	});
	
	var styles = [];
	var styleByThemeItems = [];
	var items;
	var reloadDone = false;

	this.init = function() {
		
		return new Promise(
			function (resolve, reject) {
				try {
					p3dconfig.viewer = new Cesium.Viewer(conf.target, {
						imageryProvider: osm,
						baseLayerPicker: false,
						navigationHelpButton: false,
						animation: false,
						geocoder: false,
						homeButton: false,
						sceneModePicker: false,
						timeline: false,
						targetFrameRate: 5
					});

					// creo progress bar
					$('#'+conf.target+' .cesium-viewer').append(
							$('<div>')
							.attr('class','progress progress-striped active')
							.attr('id','myprogress'));

					$('#'+conf.target + ' #myprogress').append(
							$('<div>')
							.attr('class','progress-bar progress-bar-striped')
							.attr('id','myprogressbar')
							.attr('role','progressbar')
							.attr('style','width:100%'));

					resolve();
				}
				catch(e) {
					reject(e);
				}
				
				ready = true;
				console.log('3d init completed');
				
				loading(false);
			}
		);
	}
	
	this.loadGeojson = function(name, url, offset, height, color, zoomto, item) {
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.loadGeojson(name, url, offset, height, color, zoomto, item);
			}, 500);
			return;
		}

		loading(true);
		
		var filtro = {
			"sub" : {
				"display" : false
			},
			"nome_piano" : {
				"display" : true,
				"label" : "Piano"
			},
			"tipo_vano" : {
				"display" : true,
				"label" : "Vano"
			},
			"area_vano" : {
				"display" : true,
				"label" : "Superficie"
			},
			"area_uiu" : {
				"display" : true,
				"label" : "Superficie UIU"
			},
			"comune" : {
				"display" : false,
				"label" : "Comune"
			},
			"foglio" : {
				"display" : false,
				"label" : "Foglio"
			},
			"mappale" : {
				"display" : false,
				"label" : "Mappale"
			},
			"assetid" : {
				"display" : true,
				"label" : "AssetID"
			},
			"codice_asset" : {
				"display" : true,
				"label" : "Codice Asset"
			},
			"descrizione" : {
				"display" : true,
				"label" : "Subalterno"
			},
			"valori_tema" : {
				"display" : false
			}
		}

		var dataSource = Cesium.GeoJsonDataSource.load(url);
		dataSource.then(
			function(dataSource) {
				
				var cpxColor = getComplexColor(color);
				dataSource.name = name;
				dataSource.data = item;
				
				var p = dataSource.entities.values;   
				for (var i = 0; i < p.length; i++) {
					p[i].polygon.extrudedHeight = height;
					p[i].polygon.height = offset;
					p[i].polygon.material = cpxColor.fill;
					p[i].polygon.outlineColor = cpxColor.outline;
					
					for (var j in item) {
						p[i].properties.addProperty(j, item[j]);
					}
					
					var description = "<table><tbody>";
					var propNames = p[i].properties.propertyNames;
					for (var k in propNames) {
						if (typeof filtro[propNames[k]] != 'undefined' && filtro[propNames[k]].display == true) {
							description += "<tr><td>" + filtro[propNames[k]].label + "</td><td>" + p[i].properties[propNames[k]]._value + "</td></tr>";
						}
					}
					description += "</tbody></table>";
					
					p[i].description = description;
				}
				
				p3dconfig.viewer.dataSources.add(dataSource);
				if (zoomto)
					p3dconfig.viewer.zoomTo(dataSource);

				loading(false);
			}
		);
	}
	
	this.reloadGeojson = function(name, color, zoomto) {
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.reloadGeojson(name, color, zoomto);
			}, 500);
			return;
		}

		loading(true);
		
		var cpxColor = getComplexColor(color);
		
		var dataSource = getDatasourceByName(name);
		var p = dataSource.entities.values;   
		for (var i = 0; i < p.length; i++) {
			p[i].polygon.material = cpxColor.fill;
			p[i].polygon.outlineColor = cpxColor.outline;
		}
		if (zoomto)
			p3dconfig.viewer.zoomTo(dataSource);

		loading(false);
	}
	
	this.removeGeojson = function(name, destroy) {
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.removeGeojson(name, destroy);
			}, 500);
			return;
		}

		loading(true);
		
		p3dconfig.viewer.dataSources.remove(getDatasourceByName(name), destroy);

		loading(false);
	}
	
	this.loadTematismi = function(callback, objTemi) {
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.loadTematismi(callback, objTemi);
			}, 500);
			return;
		}

		window.plani3dmodel.callback3d = callback;
		
		if(reloadDone){
			$('#'+conf.target + ' #'+conf.target + '-legend-panel').remove();
			$('#'+conf.target + ' #'+conf.target + '-legend-panel-opener').remove();

			for (var i = 0; i < p3dconfig.viewer.dataSources.length; i++) {
				var dataSource = p3dconfig.viewer.dataSources.get(i);
				p3dconfig.viewer.dataSources.remove(dataSource, destroy);
			}
		}
		createLegendPanel();
		this.processTematismo(callback, objTemi);
	}
	
	this.reloadTematismi = function(callback, objTemi){
		reloadDone = true;
		this.loadTematismi(callback, objTemi);
	}
	
	var cacheTematismo = null;
	
	this.processTematismo = function(callback, data) {
		var mythis = this;
		if (!ready) {
			setTimeout(function() {
				mythis.processTematismo(callback, data);
			}, 500);
			return;
		}
		loading(true);

		if (data == null || data.length == 0) {
			alert("Nessuna informazione disponibile");
			$.unblockUI();
			loading(false);
			return;
		}
		
		items = data.items;
		
		cacheTematismo = data;
		var multi = false;
		
		populateLegendPanel(data.themes, multi, mythis);
		
		openLegend();
		
		// nasconde il pannello modale di caricamento
		$.unblockUI();
		
		// prima visualizzazione
		var tematismo = data.themes[0].title;
		for (var key in items) {
			var item = items[key];
			var value = item.valori_tema[tematismo];
			var tmp;
			for (var i=0; i<styles[tematismo].length; i++) {
				var styleItem = styles[tematismo][i];
				if ((typeof styleItem.value != 'undefined' && styleItem.value == value) ||
						(typeof styleItem.from != 'undefined' && alyssoutils.isNumeric(styleItem.from) && 
							typeof styleItem.to != 'undefined' && alyssoutils.isNumeric(styleItem.to) &&
							parseFloat(styleItem.from) <= parseFloat(value) && 
							parseFloat(styleItem.to) >= parseFloat(value))) {
					tmp = styleByThemeItems[tematismo + styleItem.label];
					break;
				}
				else if( (typeof styleItem.from != 'undefined' && typeof styleItem.to != 'undefined') &&
						(!alyssoutils.isNumeric(styleItem.from) || !alyssoutils.isNumeric(styleItem.to)) ){
					console.log("Attenzione, impossibile caricare il tematismo perchè non in formato numerico. Controllare i range di valori");
				}
			}
			
			if (typeof item.subalterno == 'undefined') {
				console.log('carico '+item.comune+'_'+item.foglio+'_'+item.mappale);
				$.ajax({
					type: "GET",
					url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+'/rest-plani3d/list/'+item.comune+'/'+item.foglio+'/'+item.mappale+'?profile=ATC',
					//contentType: p3dconfig.strApplicationJson, tolto per evitare "Request header field Content-Type is not allowed by Access-Control-Allow-Headers in preflight response"
					dataType: p3dconfig.strJsonDataType,
					async: false,
					context: this,
					success: function(dataOutput) {
						this.loadGeojson(dataOutput.name, 
								alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+'/rest-plani3d/geojson/'+dataOutput.url+'?profile=ATC', 
								dataOutput.offset, dataOutput.height, '#'+tmp, true, item);
					},
			    	error: function(response) {
			    		if (response.status == 0)
			    			$.blockUI({ 
				                message: 'Un ad-blocker impedisce il corretto funzionamento della pagina.<br>Disabilita ad-blocker per continuare!', 
				                timeout: 10000 
				            });
			    		else
				    		$.blockUI({ 
				                message: 'Problema nel caricamento della configurazione di sistema', 
				                timeout: 2000 
				            });
			    		loading(false);
			    	}
				});
			}
			else {
				console.log('carico '+item.comune+'_'+item.foglio+'_'+item.mappale+'_'+item.subalterno+'_'+item.data);
				$.ajax({
					type: "GET",
					url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+'/rest-plani3d/list/'+item.comune+'/'+item.foglio+'/'+item.mappale+'/'+item.subalterno+'/'+item.data+'?profile=ATC',
					//contentType: p3dconfig.strApplicationJson, tolto per evitare "Request header field Content-Type is not allowed by Access-Control-Allow-Headers in preflight response"
					dataType: p3dconfig.strJsonDataType,
					async: false,
					context: this,
					success: function(dataOutput) {
						for (var key in dataOutput) {
							var dataOutputItem = dataOutput[key];
							this.loadGeojson(dataOutputItem.name, 
									alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+'/rest-plani3d/geojson/'+dataOutputItem.url+'?profile=ATC', 
									dataOutputItem.offset, dataOutputItem.height, '#'+tmp, false, item);
						}
					},
			    	error: function(response) {
			    		if (response.status == 0)
			    			$.blockUI({ 
				                message: 'Un ad-blocker impedisce il corretto funzionamento della pagina.<br>Disabilita ad-blocker per continuare!', 
				                timeout: 10000 
				            });
			    		else
				    		$.blockUI({ 
				                message: 'Problema nel caricamento della configurazione di sistema', 
				                timeout: 2000 
				            });
			    		loading(false);
			    	}
				});
			}
		}
		
		//attivo gli a del primo elemento
		var radio_Id =$("input[name=radio_tematismi]:checked").attr('id');
		$('#show-all'+radio_Id.substring(6)).removeAttr("class", "disabled");
		$('#hide-all'+radio_Id.substring(6)).removeAttr("class", "disabled");
		
		loading(false);
	}

	var switchTheme = function(event) {
		// abilito/disabilito a seconda del comportamento della checkbox relativa al layer
		$('input[type=checkbox]', $(event.data.div_id)).each(function() {
			if($(this)[0].className != 'p3d-check-tematismo'){
				$(this).prop("disabled", !$((event.data.multi?"#check_":"#radio_")+event.data.id).is(":checked"));
			}
		});
		// abilito/disabilito il link di selezione multipla sui figli a seconda del comportamento della checkbox relativa al layer
		if($((event.data.multi?"#check_":"#radio_")+event.data.id).is(":checked")){
			$('#'+conf.target + ' #show-all'+event.data.id).removeAttr("class", "disabled");
			$('#'+conf.target + ' #hide-all'+event.data.id).removeAttr("class", "disabled");
			for(var k=0; k< themes.themes.length; k++){
				var tematismo = themes.themes[k].title;
				var values = themes.themes[k].values;
				if(event.data.id!="tematismo_"+tematismo){
					//ho cambiato il radio disabilito tuttu i check che non appartengono al radio
					$('#show-alltematismo_'+tematismo).prop("class", "disabled");
					$('#hide-alltematismo_'+tematismo).prop("class", "disabled");
					for(var j=0; j< values.length; j++){
						$("#check_"+k+"_"+j).prop("disabled", true);
					}
				}
			}
		}
		else{
			$('#'+conf.target + ' #show-all'+event.data.id).prop("class", "disabled");
			$('#'+conf.target + ' #hide-all'+event.data.id).prop("class", "disabled");
		}
		
		if (!event.data.multi) {
			console.log('cambio tematismo: '+event.data.tematismo);
			reloadItems(event.data.tematismo, event.data.mythis);
		}
		else {
			drawAndOr(cacheTematismo);
		}
	}
	
	var reloadItems = function(tematismo, mythis) {
		for (var key in items) {
			var item = items[key];
			var value = item.valori_tema[tematismo];
			var tmp;
			for (var i=0; i<styles[tematismo].length; i++) {
				var styleItem = styles[tematismo][i];
				if ((typeof styleItem.value != 'undefined' && styleItem.value == value) ||
						(typeof styleItem.from != 'undefined' && alyssoutils.isNumeric(styleItem.from) && 
							typeof styleItem.to != 'undefined' && alyssoutils.isNumeric(styleItem.to) &&
							parseFloat(styleItem.from) <= parseFloat(value) && 
							parseFloat(styleItem.to) >= parseFloat(value))) {
					tmp = styleByThemeItems[tematismo + styleItem.label];
					break;
				}
				else if( (typeof styleItem.from != 'undefined' && typeof styleItem.to != 'undefined') &&
						(!alyssoutils.isNumeric(styleItem.from) || !alyssoutils.isNumeric(styleItem.to)) ){
					console.log("Attenzione, impossibile caricare il tematismo perchè non in formato numerico. Controllare i range di valori");
				}
			}
			
			if (typeof item.subalterno == 'undefined') {
				console.log('ricarico '+item.comune+'_'+item.foglio+'_'+item.mappale);
				mythis.reloadGeojson(item.comune+'_'+item.foglio+'_'+item.mappale,
						'#'+tmp, false);
			}
			else {
				console.log('ricarico '+item.comune+'_'+item.foglio+'_'+item.mappale+'_'+item.subalterno+'_'+item.data);
				for (var i = 0; i < p3dconfig.viewer.dataSources.length; i++) {
					var dataSource = p3dconfig.viewer.dataSources.get(i);
					if (dataSource.name.startsWithIgnorCase(item.comune+'_'+item.foglio+'_'+item.mappale+'_'+item.subalterno+'_'+item.data)) {
						mythis.reloadGeojson(dataSource.name, '#'+tmp, false);
					}
				}
			}
		}
	}
	
	var showOrHideAll = function(event){
		//recupero i parametri che mi servono
		var div_id = event.data.div_id;
	    if(event.data.op == "show") {
			//seleziono tutte le checkbox relative al mio tema
    		$('input', $(div_id).parent()).each(function() {
    			if($(this)[0].className != 'p3d-check-tematismo'){
    				$(this).prop("checked", true);
    			}
    		});
	    }
	    else{
	    	//de-seleziono tutte le checkbox relative al mio tema
	    	$('input', $(div_id).parent()).each(function() {
    			if($(this)[0].className != 'p3d-check-tematismo'){
    				$(this).prop("checked", false);
    			}
    		});
	    }
		if (!event.data.multi) {
			for (var j in event.data.parameters) {
			    var value = event.data.parameters[j].value;
			    var from = event.data.parameters[j].from;
			    var to = event.data.parameters[j].to;
				for (var i = 0; i < p3dconfig.viewer.dataSources.length; i++) {
					var dataSource = p3dconfig.viewer.dataSources.get(i);
		    		if(typeof value != 'undefined' && value == dataSource.data.valori_tema[event.data.tematismo] || 
		    				(typeof from != 'undefined' && alyssoutils.isNumeric(from) && 
							typeof to != 'undefined' && alyssoutils.isNumeric(to) ) && 
			    			parseFloat(from) <= parseFloat(dataSource.data.valori_tema[event.data.tematismo]) 
			    			&& parseFloat(to) >= parseFloat(dataSource.data.valori_tema[event.data.tematismo])){
		    		    if(event.data.op == "show") {
		    		    	dataSource.show = true;
		    		    }
		    		    else{
		    		    	dataSource.show = false;
		    		    }
			    	}
				}
			}
		}
		else {
			drawAndOr(cacheTematismo);
		}
	}
	
	var changeStyleItemVisibility = function(event){
		//prendo indice del tematismo
		var b=event.data.check_id.substring(7);
		var indice_tematismo=b.substr(0,b.indexOf("_"));
		var elem=b.substr(b.indexOf("_")+1);
	if (!event.data.multi) {
		    var value = event.data.parameters.value;
		    var from = event.data.parameters.from;
		    var to = event.data.parameters.to;
			for (var i = 0; i < p3dconfig.viewer.dataSources.length; i++) {
				var dataSource = p3dconfig.viewer.dataSources.get(i);
	    		if(typeof value != 'undefined' && value == dataSource.data.valori_tema[event.data.tematismo] || 
	    				(typeof from != 'undefined' && alyssoutils.isNumeric(from) && 
						typeof to != 'undefined' && alyssoutils.isNumeric(to) ) && 
		    			parseFloat(from) <= parseFloat(dataSource.data.valori_tema[event.data.tematismo]) 
		    			&& parseFloat(to) >= parseFloat(dataSource.data.valori_tema[event.data.tematismo])){
	    		    if($(event.data.check_id).is(":checked")){
	    		    	dataSource.show = true;
	    		     	//devo deselezionare tutti
	    		    	for(var k=0; k< themes.themes.length; k++){
	    					var tematismo = themes.themes[k].title;
	    					var values = themes.themes[k].values;
	    					if(event.data.id!="tematismo_"+tematismo){
	    						//TODO gestire lunghezza diversa delle liste!
	    						$("#check_"+k+"_"+elem).prop('checked', true);
	    					}
	    					else{
	    						//uguale tematismo->setto il suo colore
	    						var p = dataSource.entities.values;
	    						var cpxColor = getComplexColor(values[elem].color);
	    						for (var i = 0; i < p.length; i++) {
	    							p[i].polygon.material = cpxColor.fill;
	    							p[i].polygon.outlineColor = cpxColor.outline;
	    						}
	    					}
	    		    	}
	    		    }
	    		    else{
	    		    	dataSource.show = false;
	    		    	//devo deseleziono tutti
	    		    	for(var k=0; k< themes.themes.length; k++){
	    					var tematismo = themes.themes[k].title;
	    					var values = themes.themes[k].values;
	    					if(event.data.id!="tematismo_"+tematismo){
	    						$("#check_"+k+"_"+elem).prop('checked', false);
	    					}
	    				}	    	
	    		    }
		    	}
			}
		}
		else {
			drawAndOr(cacheTematismo);
		}
	}

	var createLegendPanel = function() {
		$('#'+conf.target+' .cesium-viewer')
			.append($("<div>").attr("id", conf.target + "-legend-panel").attr("class", "p3d-legend-panel"));
		$("#"+conf.target + "-legend-panel")
			.append($("<div>").attr("id", conf.target + "-legend-panel-icon").attr("class", "p3d-legend-panel-icon")
				.append($("<a>").attr("id", conf.target + "-legend-panel-closer").attr("class", "p3d-legend-panel-closer")
					.append($("<img>").attr("src", conf.imgpath+"imgs/layer-switcher-minimize.png"))));
		$("#"+conf.target + "-legend-panel-closer").click(closeLegend);
		$("#"+conf.target + "-legend-panel").hide();

		$('#'+conf.target+' .cesium-viewer')
			.append($("<div>").attr("id", conf.target + "-legend-panel-opener").attr("class", "p3d-legend-panel-opener"));
		$("#"+conf.target + "-legend-panel-opener")
			.append($("<a>")
				.append($("<img>").attr("src", conf.imgpath+"imgs/layer-switcher-maximize.png")));
		$("#"+conf.target + "-legend-panel-opener a").click(openLegend);
		$("#"+conf.target + "-legend-panel-opener").hide();
	}
	
	var populateLegendPanel = function (themes, multi, mythis) {
		
		$("#"+conf.target + "-legend-panel").append($("<div>").attr("id", "legend-items-container"));
		for (var key in themes) {
			var tematismo = themes[key].title;
			var values = themes[key].values;
			var tematismoLabel = tematismo.alyLatinize().replaceAll(" ","-").replaceAll(" ","-")
					.replaceAll("&nbsp;","y").replaceAll(".","").replaceAll(":","");
			var tematismoId = "tematismo_"+tematismoLabel;
			
			$("#legend-items-container").append($("<div>").attr("id", "legend-item_"+key));
			$("#legend-item_"+key).append($("<div>").attr("id","openclose_"+key).attr("style","display:inline"));
			if (multi) {
				$("#legend-item_"+key)
					.append($("<input>")
						.attr("id", "check_"+tematismoId)
						.attr("level", "first")
						.attr("type", "checkbox")
						.attr("class", "p3d-check-tematismo")
						.prop("checked", false));
				$("#check_"+tematismoId).change({"id": tematismoId, "tematismo": tematismo, "div_id": "#legend-item_"+key, "multi": multi, "mythis": mythis}, switchTheme);
			}
			else {
				$("#legend-item_"+key)
					.append($("<input>")
						.attr("id", "radio_"+tematismoId)
						.attr("name", "radio_tematismi")
						.attr("level", "first")
						.attr("type", "radio")
						.attr("class", "p3d-check-tematismo")
						.prop("checked", key == 0));
				$("#radio_"+tematismoId).change({"id": tematismoId, "tematismo": tematismo, "div_id": "#legend-item_"+key, "multi": multi, "mythis": mythis}, switchTheme);
			}

			$("#legend-item_"+key).append($("<span>").text(tematismoLabel));
			$("#openclose_"+key).append($("<input>").attr("id", "legend-item_"+key+"_open").attr("type", "button")
					.attr("class", "openclose myopen").click({key: key}, function(event){ open(event); }));
			$("#openclose_"+key).append($("<input>").attr("id", "legend-item_"+key+"_close").attr("type", "button")
					.attr("class", "openclose myclose").click({key: key}, function(event){ close(event); }));
			$("#legend-item_"+key).append($("<div>").attr("id","legend-item_"+key+"_content"));
			$("#legend-item_"+key+"_content").append($("<div>").attr("id","all-none-div_"+tematismoId));
			$("#legend-item_"+key+"_content").hide();
			$("#legend-item_"+key+"_close").hide();
			$("#all-none-div_"+tematismoId).attr("style", "margin-left: 15px;")
				.append($("<a>")
						.prop("disabled", true)
						.attr("id", "show-all"+tematismoId)
						.attr("class", "disabled")
						.text("Mostra tutti")
						.click({
								"id": tematismoId, 
								"viewer": p3dconfig.viewer, 
								"div_id": "#legend-item_"+key, 
								"tematismo": tematismo, 
								"op": "show",
								"parameters" : themes[key].values,
								"multi": multi}, 
								showOrHideAll ))
						.append($("<span>").text(" / "))
							.append($("<a>")
								.prop("disabled", true)
								.attr("id", "hide-all"+tematismoId)
								.attr("class", "disabled")
								.text("Nascondi tutti")
								.click({
										"id": tematismoId, 
										"viewer": p3dconfig.viewer, 
										"div_id": "#legend-item_"+key, 
										"tematismo": tematismo, 
										"op": "hide",
										"parameters" : themes[key].values,
										"multi": multi}, 
										showOrHideAll));
			for(var j=0; j< values.length; j++){
				$("#legend-item_"+key+"_content")
					.append($("<div>").attr("id", "legend-item-value_"+key+"_"+j));
				$("#legend-item-value_"+key+"_"+j)
					.append($("<input>")
						.attr("id", "check_"+key+"_"+j)
						.attr("level", "second")
						.attr("parent", tematismoId)
						.attr("index", j)
						.attr("type", "checkbox")
						.attr("style", "margin-left: 20px; vertical-align: top;")
						.prop("checked", !multi).prop("disabled", key != 0));
				if (!multi) {
					$("#legend-item-value_"+key+"_"+j)
						.append($("<div>")
							.attr("class", "p3d-circle")
							.attr("style", "background: #"+values[j].color));
				}
				$("#check_"+key+"_"+j).change({
						"check_id": "#check_"+key+"_"+j, 
						"id": tematismoId, 
						"tematismo": tematismo, 
						"viewer": p3dconfig.viewer, 
						"parameters" : themes[key].values[j],
						"multi" : multi}, 
					changeStyleItemVisibility );
				values[j].label = values[j].label.replace('@from@', values[j].from).replace('@to@', values[j].to);
				$("#legend-item-value_"+key+"_"+j)
					.append($("<div>")
						.attr("style", "display: inline-block; width: 200px; padding-left: 5px;").text(values[j].label));
			}
			
			styles[tematismo] = themes[key].values;
			
			for (var i=0; i<styles[tematismo].length; i++) {
				var styleItem = styles[tematismo][i];
				if (typeof styleByThemeItems[tematismo + styleItem.label] == 'undefined' && styleItem.color != null) {
					styleByThemeItems[tematismo + styleItem.label] = styleItem.color;
				}
			}
		}
	}
	
	var getComplexColor = function (colorStr) {
		
		if (!colorStr.startsWith('#'))
			colorStr = '#'+colorStr;

		var cesiumColor = Cesium.Color.fromCssColorString(colorStr);
		var fillColor = new Cesium.Color(cesiumColor.red, cesiumColor.green, cesiumColor.blue, 0.5);
		var outlineColor = new Cesium.Color(cesiumColor.red, cesiumColor.green, cesiumColor.blue, 1.0);
		
		return {
			fill : fillColor,
			outline : outlineColor
		};
	}
	
	var getDatasourceByName = function (name) {
		for (var i = 0; i < p3dconfig.viewer.dataSources.length; i++) {
			var dataSource = p3dconfig.viewer.dataSources.get(i);
			if (dataSource.name.startsWithIgnorCase(name)) {
				return dataSource;
			}
		}
	}

	var openLegend = function() {
		$('#'+conf.target + ' #'+conf.target + '-legend-panel').show();
		$('#'+conf.target + ' #'+conf.target + '-legend-panel-opener').hide();
		if ($('#'+conf.target + ' #search-results-panel').is(':visible'))
			this.closeResults();
	}

	var closeLegend = function() {
		$('#'+conf.target + ' #'+conf.target + '-legend-panel').hide();
		$('#'+conf.target + ' #'+conf.target + '-legend-panel-opener').show();
	}
	
	var open = function (event) {
		$("#legend-item_"+event.data.key+"_content").show();
		$("#legend-item_"+event.data.key+"_open").hide();
		$("#legend-item_"+event.data.key+"_close").show();
	};
	
	var close = function (event) {
		$("#legend-item_"+event.data.key+"_content").hide();
		$("#legend-item_"+event.data.key+"_open").show();
		$("#legend-item_"+event.data.key+"_close").hide();
	};

	var pendingLoading = 0;
	var loading = function(isLoading) {
		if (isLoading) {
			$('#'+conf.target + ' #myprogress').fadeIn(200);
			pendingLoading++;
		}
		else if(pendingLoading > 0)
			pendingLoading--;

		if(pendingLoading == 0)
			$('#'+conf.target + ' #myprogress').fadeOut(200);
	}
}