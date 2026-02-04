/**
 * controlla che un valore sia incluso in un array
 * @param {Array} array da controllare
 * @param {Var} elemento da controllare
 * @return {Boolean} 
*/
function arrayContains(arr, value) {
	var i = arr.length;
	while (i--) {
		if (arr[i] === value) {
			return true;
		}
	}
	return false;
}

/**
 * determina la reale lunghezza di un array associativo
 * @param {Obejct} object array associativo di cui si vuole controllare la lunghezza
 * @return {Number} lunghezza dell'array assocciativo  
*/
function getRealSize(object){
	var size =0 ;
	for(key in object){
		if(typeof key != "undefined" && key != null){
			size++;
		}
	}
	return size;
}

/**
* determina l'esatta lunghezza di un array (escludendo i valori null e undefined)
* @param {Array} array di cui si vuole ottenedere la lunghezza
* @returns {Number} lunghezza dell'array
*/
function getRealArrayLength(inputArray){
	var size =0 ;
	for(key in inputArray){
		if(typeof key != "undefined" && key != null && typeof inputArray[key] != "undefined" && inputArray[key] != null ){
			size++;
		}
	}
	return size;
}

/**
 * determina la lunghezza elementare dell'array senza fare controlli sulle variabili contenute
 * @param {Array} array da controllare
 * @returns {Number} lunghezza
*/
function getElementarArrayLength(a) {
	var i = 0;
	for ( var key in a) {
		i++;
	}
	return i;
}

/**
 * mi restituisce un array copiato
 * @param {Array} arr array da copiare
 * @returns {Array} array copiato 
*/
function arrayCopy(arr) {
	var newArray = new Array();
	for ( var val in arr) {
		newArray[val] = (arr[val]);
	}
	return newArray;
}

/**
 * determina l'indice massimo dell'array
 * @param {Array} inputArray array in input
 * @return {Number} massimo indice dell'array  
*/
function getMaxIndexArraySmart(inputArray) {
	var maxIndex = 0;
	for (var i = 0; i < inputArray.length; i++) {
		if (inputArray[i] !== undefined
				&& parseInt(inputArray[i].index) > maxIndex) {
			maxIndex = inputArray[i].index;
		}
	}
	return maxIndex;
}/**
 * controlla che una variabile sia dichiarata, non sia nulla e non sia vuota
 * @param {Object} variable variabile da controllare
 * @returns {Boolean} 
*/
function isDefined(variable) {
	if (typeof variable == 'undefined' || variable == null || (typeof variable != "boolean" && variable == "")) {
		return false;
	} else {
		return true;
	}
}

/**
 * carica lo script nella pagina
 * @param {String} url url da cui prendere lo script
 * @param {Function} funzione di callback da chiamare 
*/
function loadScript(url, callback) {
	// adding the script tag to the head as suggested before
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;

	// then bind the event to the callback function
	// there are several events for cross browser compatibility
	script.onreadystatechange = callback;
	script.onload = callback;

	// fire the loading
	head.appendChild(script);
}

/**
 * automatizza le chiamate ajax asincrone
 * @param {String} url
 * @param {Function} success funzione di callback nel caso di success
 * @param {Function} failure funzione di callback nel caso di failure
 */
function callUrlGET(url, success, failure) {
	$.ajax({
		type : "GET",
		contentType : "application/json",
		url : url,
		dataType : "json",
		processData : false, // tell jQuery not to process the data
		async : true,
		success : function(data) {
			if (data == "ERROR")
				failure();
			else
				success(data);
		},
		error : function() {
			failure();
		}
	});
}

/**
* funziona che dato un oggetto json ad un livello ritorna true solo se contiene dei dati validi
* @param {Object} jsonData json da validare
* @return {Boolean}
*/
function isEmptyJsonObject(jsonData) {
	for ( var prop in jsonData) {
		if (jsonData[prop] != null && jsonData[prop] != "null"
				&& jsonData[prop] != "") {
			return false;
		}
	}
	return true;
}//funzioni per la gestione delle date
//TODO: meglio sarebbe cambiare il prototype
var dateFormat = {
	YYYYMMDD: "YYYYMMDD",
	YYYYMMDD_DASH : "YYYY-MM-DD",
	DDMMYYYY_SLASH : "DD/MM/YYYY",
	WMS : "WMS"
};
/**
 * restituisce la stringa della data formattata
 * @param {Date} data da formattare
 * @param {String} format formato, i formati accettati sono quelli definiti dall'enum dateFormat
 * @return {String} data formattata come YYYY-MM-DD
*/
function formatDate(date, format){
	//separo gli elementi della data
	var dd = date.getDate();
	dd = dd < 10 ? "0" + dd : (dd+"");
	var mm = date.getMonth() + 1; // i mesi partono da 0
	mm = mm < 10 ? "0" + mm : (mm+"");
	
	var formattedDate;
	switch(format){
		case dateFormat.YYYYMMDD_DASH:
			formattedDate = date.getFullYear() + "-" + mm + "-" + dd;
			break;
		case dateFormat.WMS:
			formattedDate = date.getFullYear() + "-" + mm + "-" + dd + "T00:00:00.001Z";
			break;
		case dateFormat.DDMMYYYY_SLASH:
			formattedDate = dd+"/"+mm+"/"+date.getFullYear();
			break;
		case dateFormat.YYYYMMDD:
			formattedDate = date.getFullYear()+mm+dd;
			break;
		default:
			console.log("Attenzione, il formato di data "+format+" non e' stato riconosciuto");
			return null;
	}
	return formattedDate;
}

/**
 * restituisce un oggetto date partendo da una stringa in un formato specificato
 * @param {String} dateAsString stringa rappresentante la data
 * @param {String} format elemento dell'enumerations
 * @return {Date} data
*/
function parseDate(dateAsString, format){
	var date;
	switch(format){
		case dateFormat.YYYYMMDD:
			var dd = parseInt(dateAsString.substring(6,8));
			var mm = parseInt(dateAsString.substring(4,6))-1;
			var yyyy = parseInt(dateAsString.substring(0,4));
			date = new Date(yyyy, mm, dd);
			break;
		default:
			console.log("Attenzione, il formato di data "+format+" non e' gestito");
			return null;
	}
	return date;
}/**
 * mi dice se si e' cliccato un numero, la freccia o il tab
 * @param {Object} event evento di click su tastiera
 * @returns {Boolean}
*/
function isADigitTabOrArrow(event) {
	var key = getEventKey(event);
	// 0-> TAB e frecce su FF, 8 -> backspace su FF, 9 -> TAB su Chrome e IE,
	// fra 48 e 57 sono le cifre
	return (key == 0) || (key == 8) || (key == 9) || (key >= 48 && key <= 57);
}

/**
 * mi dice se si e' cliccato un numero, la freccia o il tab o un punto
 * @param {Object} event evento di click su tastiera
 * @returns {Boolean}
*/
function isADigitTabOrArrowOrPoint(event) {
	var key = getEventKey(event);
	// 190 -> punto
	return (isADigitTabOrArrow(event) || key == 190 || key ==46);
}

/**
 * restituisce la key relativa al tasto premuto sulla tastiera
 * @param {Object} event evento di click su tastiera
 * @returns {Number} key
*/
function getEventKey(event) {
	var key;
	if (window.event) {
		key = window.event.keyCode;
	} else {
		key = event.which;
	}
	return key;
}//metodi per le elaborazioni geometriche

/**
 * calcola la proiezione del punto P3 sulla retta che passa per P1 e P2 o sulla
 * perpendicolare (la piu' vicina)
 * @param {OpenLayers.Geometry.Point} P1
 * @param {OpenLayers.Geometry.Point} P2
 * @param {OpenLayers.Geometry.Point} P3
 * @returns {Number} proiezione
*/
function getClosestProjection(P1,P2,P3){
	//segmento P1-P2	
	var P2P1y = P2.y-P1.y;
	var P2P1x = P2.x-P1.x;
	
	//segmento P1-P2 normalizzato
	var P2P1 = Math.sqrt(P2P1x*P2P1x+P2P1y*P2P1y);
	var P2P1x = (P1.x-P2.x)/P2P1;
	var P2P1y = (P1.y-P2.y)/P2P1;
	
	//segmento P1-P2 perpendicolare normalizzato
	var P2P1Perpx = -P2P1y;
	var P2P1Perpy = P2P1x;
	
	
	//segmento P3-P2
	var P3P2x = P3.x-P2.x;
	var P3P2y = P3.y-P2.y;
	
	//calcolo la proiezione di P3-P2 su P1-P2
	var proj1 = P2P1x*P3P2x+P2P1y*P3P2y;
	//calcolo la proiezione di P3-P2 su P1-P2 perp
	var proj2 = P2P1Perpx*P3P2x+P2P1Perpy*P3P2y;
	

	var lastPointModifiedX;
	var lastPointModifiedY;
	//vedo quale proiezione e' maggiore in valore assoluto
	if(Math.abs(proj1)>Math.abs(proj2)){
		//proietto il segmento P3-P2 su P1-P2 normalizzato
		lastPointModifiedX = P2.x+proj1*(P2P1x);
		lastPointModifiedY = P2.y+proj1*(P2P1y);
	}else{
		//proietto il segmento P3-P2 su P1-P2 normalizzato
		lastPointModifiedX = P2.x+proj2*(P2P1Perpx);
		lastPointModifiedY = P2.y+proj2*(P2P1Perpy);
	}
	
	return new OpenLayers.Geometry.Point(lastPointModifiedX, lastPointModifiedY);
}

/**
 * calcola l'area di un geojsonObject
 * @param {Object} oggetto in formato geojson di cui si vuole calcolare l'area
 * @returns {Numeric} area 
*/
function getArea(geojsonObject) {
	var areaVano = 0.00;
	if (geojsonObject.geometry != null) {
		var geoms = geojson_format.read(geojsonObject.geometry);
		areaVano = geoms[0].geometry.getArea();
	}
	return areaVano;
}/**
 * esegue il parsing di una variabile a double
 * @param {Object} value variabile di cui fare il parsing
 * @returns {Number} double risultato
*/ 
function parseDouble(value) {
	if (typeof value == "string") {
		value = value.match(/^-?\d*/)[0];
	}
	return !isNaN(parseInt(value)) ? value * 1 : NaN;
}

/**
 * converte gradi in radianti
 * @param {Number} value angolo in gradi
 * @returns {Number} double risultato
*/ 
function toRad(value) {
	return value * Math.PI / 180;
}

/**
 * converte radianti in gradi
 * @param {Number} value angolo in radianti
 * @returns {Number} double risultato
*/ 
function toDegrees(value) {
	return value * 180 / Math.PI;
}/**
 * implementa lo startsWith di una stringa 
 * @param {String} prefisso da testare 
 * @returns {Boolean} 
*/
String.prototype.startsWith = function(str) {
	// NB la soluzione con indexOf non e' efficente con stringhe lunghe
	// return this.indexOf(str) == 0;
	return this.slice(0, str.length) == str;
};


/**
 * indica se la strigna termina con una determinata sottostringa
 * @param {String} s, stringa con cui si vuole vedere se finisce
 * @returns {Boolean}
*/
String.prototype.endsWith = function(s) {
	return this.length >= s.length && this.substr(this.length - s.length) == s;
}

/**
 * trasforma una stringa da camel case a regular (con spazi)
 * @returns {String} stringa trasfromata
*/
String.prototype.camelCaseToRegular = function() {
	return this
	// insert a space before all caps
	.replace(/([a-z])([A-Z])/g, '$1 $2')
	// uppercase the first character
	.replace(/^./, function(str) {
		return str.toUpperCase();
	})
}

/** 
 * funzione per definire a livello di tutte le stringhe il replaceAll
 * @param {String} find strindga da sostituire
 * @param {String} replace strigna con cui sostituire
 * @returns {String} stringa modificata
*/
String.prototype.replaceAll = function(find, replace) {
	var str = this;
	return str.replace(new RegExp(find
			.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

/**
 * rimuove gli zeri inziali dalla stringa
 * @param {String} stringa a cui devono essere rimessi gli zeri 
 * @returns {String} stringa con gli zeri rimossi
*/
function removeInitialZeroes(stringa) {
	if (typeof stringa !== "undefined" && stringa.length > 0) {
		if (stringa.substring(0, 1) == '0') {
			if (stringa.length == 1) {
				return '';
			} else {
				return removeInitialZeroes(stringa.substring(1, stringa.length));
			}
		} else {
			return stringa;
		}
	} else {
		return '';
	}
}

/**
 * dice se una stringa e' vuota (a meno di spazi)
 * @param {String} string la stringa da controllare
 * @returns {Boolean}
*/
function isEmptyString(string) {
	var tmp = string.trim();
	if (tmp == "") {
		return true;
	} else {
		return false;
	}
}/**
 * restituisce un oggetto con il nome e il relativo valore dei parametri trovati nell'url
 * @return {Object} oggetto javascript con nomi e valori dei parametri in url
*/
function getUrlVars() {
	var vars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key,
			value) {
		vars[key] = value;
	});
	return vars;
}

//TODO controllare se e' esatto
/**
 * restituisce un oggetto con il nome e il relativo valore dei parametri trovati nell'url della finestra padre
 * @return {Object} oggetto javascript con nomi e valori dei parametri in url della finestra padre
*/
function getTopWindowUrlVars() {
	var vars = {};
	top.window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,
			key, value) {
		vars[key] = value;
	});
	return vars;
}

//TODO: questo deve morire
/**
 * restiuisce un array associativo dei parametri in url cancellando la parte dopo #
 * @returns {Array} array associativo con nome parametro e vaore dello stesso
*/
function getUrlVarsWithoutAnchor() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
			function(m, key, value) {
				if (value.indexOf("#") >= 0) {
					value = value.substr(0, value.indexOf("#"));
				}
				vars[key] = value;
			});
	return vars;
}

/**
 * restituisce i children di un elemento con un certo tag name
 * @param {Obejct} element elemento html all'interno del quale si vuole cercare
 * @param {String} tagName nome per cui ricercare
 * @returns {Array} array di elementi
*/
function getChildrenByTagName(element, tagName) {
	var results = new Array();
	var childrenElements = element.children;

	for (var i = 0; i < childrenElements.length; i++) {
		var element = childrenElements[i];
		if (element.tagName.toUpperCase() === tagName.toUpperCase()) {
			results.push(element);
		}
	}

	return results;
}

/**
 * ricarica la finestra 
*/
function reloadWindow() {
	window.location.reload(true);
}

/**
 * ricarica la finestra principale e chiude la corrente
*/
function reloadWindowOpener() {
	window.top.opener.location.reload(true);
	window.top.close();
}/**
 * crea un bounds
 * @param {String} stringa contenente le coordinate
 * @returns {Bounds} risultato
*/ 
function createBounds(boundCoords) {
	if (typeof OpenLayers != 'undefined')
		return new OpenLayers.Bounds(boundCoords);
	else if (typeof ol != 'undefined')
		return new ol.extent.boundingExtent(boundCoords);
	else
		alert('oops [createBounds]');
}

/**
 * crea un point
 * @param {double} double contenente la coordinata x
 * @param {double} double contenente la coordinata y
 * @returns {Point} risultato
*/ 
function createPoint(x, y) {
	if (typeof OpenLayers != 'undefined')
		return new OpenLayers.Geometry.Point(x, y);
	else if (typeof ol != 'undefined')
		return new ol.geom.Point([x, y]);
	else
		alert('oops [createPoint]');
}

/**
 * restituisce i layer sulla base del nome
 * @param {Map} oggetto map
 * @param {String} nome del layer
 * @returns {Layer[]} risultato
*/ 
function getLayersByName(map, key) {
	if (typeof OpenLayers != 'undefined')
		return map.getLayersByName(key);
	else if (typeof ol != 'undefined') {
		map.getLayers().forEach(function (lyr) {
            if (key == lyr.get('name')) {
                layer = lyr;
            }            
        });
	}
	else
		alert('oops [getLayersByName]');
}function getLayerById(map, layerId) {
	var layers = map.getLayers().getArray();
	for (var i=0; i<layers.length; i++) {
		if(layers[i].get('id') == layerId)
			return layers[i];
	}
	return undefined;
}

function removeLayerOnMaps(map, layerId) {
	map.removeLayer(getLayerById(map, layerId));
}