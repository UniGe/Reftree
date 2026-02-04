// Plani3D Maps 1.2.3

// global namespace
var alysso = alysso || {};
var plani3d = plani3d || {};///////////////////////////////////////////////////////////////////////
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
var alyLatinMap={"Á":"A","Ă":"A","Ắ":"A","Ặ":"A","Ằ":"A","Ẳ":"A","Ẵ":"A","Ǎ":"A","Â":"A","Ấ":"A","Ậ":"A","Ầ":"A","Ẩ":"A","Ẫ":"A","Ä":"A","Ǟ":"A","Ȧ":"A","Ǡ":"A","Ạ":"A","Ȁ":"A","À":"A","Ả":"A","Ȃ":"A","Ā":"A","Ą":"A","Å":"A","Ǻ":"A","Ḁ":"A","Ⱥ":"A","Ã":"A","Ꜳ":"AA","Æ":"AE","Ǽ":"AE","Ǣ":"AE","Ꜵ":"AO","Ꜷ":"AU","Ꜹ":"AV","Ꜻ":"AV","Ꜽ":"AY","Ḃ":"B","Ḅ":"B","Ɓ":"B","Ḇ":"B","Ƀ":"B","Ƃ":"B","Ć":"C","Č":"C","Ç":"C","Ḉ":"C","Ĉ":"C","Ċ":"C","Ƈ":"C","Ȼ":"C","Ď":"D","Ḑ":"D","Ḓ":"D","Ḋ":"D","Ḍ":"D","Ɗ":"D","Ḏ":"D","ǲ":"D","ǅ":"D","Đ":"D","Ƌ":"D","Ǳ":"DZ","Ǆ":"DZ","É":"E","Ĕ":"E","Ě":"E","Ȩ":"E","Ḝ":"E","Ê":"E","Ế":"E","Ệ":"E","Ề":"E","Ể":"E","Ễ":"E","Ḙ":"E","Ë":"E","Ė":"E","Ẹ":"E","Ȅ":"E","È":"E","Ẻ":"E","Ȇ":"E","Ē":"E","Ḗ":"E","Ḕ":"E","Ę":"E","Ɇ":"E","Ẽ":"E","Ḛ":"E","Ꝫ":"ET","Ḟ":"F","Ƒ":"F","Ǵ":"G","Ğ":"G","Ǧ":"G","Ģ":"G","Ĝ":"G","Ġ":"G","Ɠ":"G","Ḡ":"G","Ǥ":"G","Ḫ":"H","Ȟ":"H","Ḩ":"H","Ĥ":"H","Ⱨ":"H","Ḧ":"H","Ḣ":"H","Ḥ":"H","Ħ":"H","Í":"I","Ĭ":"I","Ǐ":"I","Î":"I","Ï":"I","Ḯ":"I","İ":"I","Ị":"I","Ȉ":"I","Ì":"I","Ỉ":"I","Ȋ":"I","Ī":"I","Į":"I","Ɨ":"I","Ĩ":"I","Ḭ":"I","Ꝺ":"D","Ꝼ":"F","Ᵹ":"G","Ꞃ":"R","Ꞅ":"S","Ꞇ":"T","Ꝭ":"IS","Ĵ":"J","Ɉ":"J","Ḱ":"K","Ǩ":"K","Ķ":"K","Ⱪ":"K","Ꝃ":"K","Ḳ":"K","Ƙ":"K","Ḵ":"K","Ꝁ":"K","Ꝅ":"K","Ĺ":"L","Ƚ":"L","Ľ":"L","Ļ":"L","Ḽ":"L","Ḷ":"L","Ḹ":"L","Ⱡ":"L","Ꝉ":"L","Ḻ":"L","Ŀ":"L","Ɫ":"L","ǈ":"L","Ł":"L","Ǉ":"LJ","Ḿ":"M","Ṁ":"M","Ṃ":"M","Ɱ":"M","Ń":"N","Ň":"N","Ņ":"N","Ṋ":"N","Ṅ":"N","Ṇ":"N","Ǹ":"N","Ɲ":"N","Ṉ":"N","Ƞ":"N","ǋ":"N","Ñ":"N","Ǌ":"NJ","Ó":"O","Ŏ":"O","Ǒ":"O","Ô":"O","Ố":"O","Ộ":"O","Ồ":"O","Ổ":"O","Ỗ":"O","Ö":"O","Ȫ":"O","Ȯ":"O","Ȱ":"O","Ọ":"O","Ő":"O","Ȍ":"O","Ò":"O","Ỏ":"O","Ơ":"O","Ớ":"O","Ợ":"O","Ờ":"O","Ở":"O","Ỡ":"O","Ȏ":"O","Ꝋ":"O","Ꝍ":"O","Ō":"O","Ṓ":"O","Ṑ":"O","Ɵ":"O","Ǫ":"O","Ǭ":"O","Ø":"O","Ǿ":"O","Õ":"O","Ṍ":"O","Ṏ":"O","Ȭ":"O","Ƣ":"OI","Ꝏ":"OO","Ɛ":"E","Ɔ":"O","Ȣ":"OU","Ṕ":"P","Ṗ":"P","Ꝓ":"P","Ƥ":"P","Ꝕ":"P","Ᵽ":"P","Ꝑ":"P","Ꝙ":"Q","Ꝗ":"Q","Ŕ":"R","Ř":"R","Ŗ":"R","Ṙ":"R","Ṛ":"R","Ṝ":"R","Ȑ":"R","Ȓ":"R","Ṟ":"R","Ɍ":"R","Ɽ":"R","Ꜿ":"C","Ǝ":"E","Ś":"S","Ṥ":"S","Š":"S","Ṧ":"S","Ş":"S","Ŝ":"S","Ș":"S","Ṡ":"S","Ṣ":"S","Ṩ":"S","Ť":"T","Ţ":"T","Ṱ":"T","Ț":"T","Ⱦ":"T","Ṫ":"T","Ṭ":"T","Ƭ":"T","Ṯ":"T","Ʈ":"T","Ŧ":"T","Ɐ":"A","Ꞁ":"L","Ɯ":"M","Ʌ":"V","Ꜩ":"TZ","Ú":"U","Ŭ":"U","Ǔ":"U","Û":"U","Ṷ":"U","Ü":"U","Ǘ":"U","Ǚ":"U","Ǜ":"U","Ǖ":"U","Ṳ":"U","Ụ":"U","Ű":"U","Ȕ":"U","Ù":"U","Ủ":"U","Ư":"U","Ứ":"U","Ự":"U","Ừ":"U","Ử":"U","Ữ":"U","Ȗ":"U","Ū":"U","Ṻ":"U","Ų":"U","Ů":"U","Ũ":"U","Ṹ":"U","Ṵ":"U","Ꝟ":"V","Ṿ":"V","Ʋ":"V","Ṽ":"V","Ꝡ":"VY","Ẃ":"W","Ŵ":"W","Ẅ":"W","Ẇ":"W","Ẉ":"W","Ẁ":"W","Ⱳ":"W","Ẍ":"X","Ẋ":"X","Ý":"Y","Ŷ":"Y","Ÿ":"Y","Ẏ":"Y","Ỵ":"Y","Ỳ":"Y","Ƴ":"Y","Ỷ":"Y","Ỿ":"Y","Ȳ":"Y","Ɏ":"Y","Ỹ":"Y","Ź":"Z","Ž":"Z","Ẑ":"Z","Ⱬ":"Z","Ż":"Z","Ẓ":"Z","Ȥ":"Z","Ẕ":"Z","Ƶ":"Z","Ĳ":"IJ","Œ":"OE","ᴀ":"A","ᴁ":"AE","ʙ":"B","ᴃ":"B","ᴄ":"C","ᴅ":"D","ᴇ":"E","ꜰ":"F","ɢ":"G","ʛ":"G","ʜ":"H","ɪ":"I","ʁ":"R","ᴊ":"J","ᴋ":"K","ʟ":"L","ᴌ":"L","ᴍ":"M","ɴ":"N","ᴏ":"O","ɶ":"OE","ᴐ":"O","ᴕ":"OU","ᴘ":"P","ʀ":"R","ᴎ":"N","ᴙ":"R","ꜱ":"S","ᴛ":"T","ⱻ":"E","ᴚ":"R","ᴜ":"U","ᴠ":"V","ᴡ":"W","ʏ":"Y","ᴢ":"Z","á":"a","ă":"a","ắ":"a","ặ":"a","ằ":"a","ẳ":"a","ẵ":"a","ǎ":"a","â":"a","ấ":"a","ậ":"a","ầ":"a","ẩ":"a","ẫ":"a","ä":"a","ǟ":"a","ȧ":"a","ǡ":"a","ạ":"a","ȁ":"a","à":"a","ả":"a","ȃ":"a","ā":"a","ą":"a","ᶏ":"a","ẚ":"a","å":"a","ǻ":"a","ḁ":"a","ⱥ":"a","ã":"a","ꜳ":"aa","æ":"ae","ǽ":"ae","ǣ":"ae","ꜵ":"ao","ꜷ":"au","ꜹ":"av","ꜻ":"av","ꜽ":"ay","ḃ":"b","ḅ":"b","ɓ":"b","ḇ":"b","ᵬ":"b","ᶀ":"b","ƀ":"b","ƃ":"b","ɵ":"o","ć":"c","č":"c","ç":"c","ḉ":"c","ĉ":"c","ɕ":"c","ċ":"c","ƈ":"c","ȼ":"c","ď":"d","ḑ":"d","ḓ":"d","ȡ":"d","ḋ":"d","ḍ":"d","ɗ":"d","ᶑ":"d","ḏ":"d","ᵭ":"d","ᶁ":"d","đ":"d","ɖ":"d","ƌ":"d","ı":"i","ȷ":"j","ɟ":"j","ʄ":"j","ǳ":"dz","ǆ":"dz","é":"e","ĕ":"e","ě":"e","ȩ":"e","ḝ":"e","ê":"e","ế":"e","ệ":"e","ề":"e","ể":"e","ễ":"e","ḙ":"e","ë":"e","ė":"e","ẹ":"e","ȅ":"e","è":"e","ẻ":"e","ȇ":"e","ē":"e","ḗ":"e","ḕ":"e","ⱸ":"e","ę":"e","ᶒ":"e","ɇ":"e","ẽ":"e","ḛ":"e","ꝫ":"et","ḟ":"f","ƒ":"f","ᵮ":"f","ᶂ":"f","ǵ":"g","ğ":"g","ǧ":"g","ģ":"g","ĝ":"g","ġ":"g","ɠ":"g","ḡ":"g","ᶃ":"g","ǥ":"g","ḫ":"h","ȟ":"h","ḩ":"h","ĥ":"h","ⱨ":"h","ḧ":"h","ḣ":"h","":"h","ɦ":"h","ẖ":"h","ħ":"h","ƕ":"hv","í":"i","ĭ":"i","ǐ":"i","î":"i","ï":"i","ḯ":"i","ị":"i","ȉ":"i","ì":"i","ỉ":"i","ȋ":"i","ī":"i","į":"i","ᶖ":"i","ɨ":"i","ĩ":"i","ḭ":"i","ꝺ":"d","ꝼ":"f","ᵹ":"g","ꞃ":"r","ꞅ":"s","ꞇ":"t","ꝭ":"is","ǰ":"j","ĵ":"j","ʝ":"j","ɉ":"j","ḱ":"k","ǩ":"k","ķ":"k","ⱪ":"k","ꝃ":"k","ḳ":"k","ƙ":"k","ḵ":"k","ᶄ":"k","ꝁ":"k","ꝅ":"k","ĺ":"l","ƚ":"l","ɬ":"l","ľ":"l","ļ":"l","ḽ":"l","ȴ":"l","ḷ":"l","ḹ":"l","ⱡ":"l","ꝉ":"l","ḻ":"l","ŀ":"l","ɫ":"l","ᶅ":"l","ɭ":"l","ł":"l","ǉ":"lj","ſ":"s","ẜ":"s","ẛ":"s","ẝ":"s","ḿ":"m","ṁ":"m","ṃ":"m","ɱ":"m","ᵯ":"m","ᶆ":"m","ń":"n","ň":"n","ņ":"n","ṋ":"n","ȵ":"n","ṅ":"n","ṇ":"n","ǹ":"n","ɲ":"n","ṉ":"n","ƞ":"n","ᵰ":"n","ᶇ":"n","ɳ":"n","ñ":"n","ǌ":"nj","ó":"o","ŏ":"o","ǒ":"o","ô":"o","ố":"o","ộ":"o","ồ":"o","ổ":"o","ỗ":"o","ö":"o","ȫ":"o","ȯ":"o","ȱ":"o","ọ":"o","ő":"o","ȍ":"o","ò":"o","ỏ":"o","ơ":"o","ớ":"o","ợ":"o","ờ":"o","ở":"o","ỡ":"o","ȏ":"o","ꝋ":"o","ꝍ":"o","ⱺ":"o","ō":"o","ṓ":"o","ṑ":"o","ǫ":"o","ǭ":"o","ø":"o","ǿ":"o","õ":"o","ṍ":"o","ṏ":"o","ȭ":"o","ƣ":"oi","ꝏ":"oo","ɛ":"e","ᶓ":"e","ɔ":"o","ᶗ":"o","ȣ":"ou","ṕ":"p","ṗ":"p","ꝓ":"p","ƥ":"p","ᵱ":"p","ᶈ":"p","ꝕ":"p","ᵽ":"p","ꝑ":"p","ꝙ":"q","ʠ":"q","ɋ":"q","ꝗ":"q","ŕ":"r","ř":"r","ŗ":"r","ṙ":"r","ṛ":"r","ṝ":"r","ȑ":"r","ɾ":"r","ᵳ":"r","ȓ":"r","ṟ":"r","ɼ":"r","ᵲ":"r","ᶉ":"r","ɍ":"r","ɽ":"r","ↄ":"c","ꜿ":"c","ɘ":"e","ɿ":"r","ś":"s","ṥ":"s","š":"s","ṧ":"s","ş":"s","ŝ":"s","ș":"s","ṡ":"s","ṣ":"s","ṩ":"s","ʂ":"s","ᵴ":"s","ᶊ":"s","ȿ":"s","ɡ":"g","ᴑ":"o","ᴓ":"o","ᴝ":"u","ť":"t","ţ":"t","ṱ":"t","ț":"t","ȶ":"t","ẗ":"t","ⱦ":"t","ṫ":"t","ṭ":"t","ƭ":"t","ṯ":"t","ᵵ":"t","ƫ":"t","ʈ":"t","ŧ":"t","ᵺ":"th","ɐ":"a","ᴂ":"ae","ǝ":"e","ᵷ":"g","ɥ":"h","ʮ":"h","ʯ":"h","ᴉ":"i","ʞ":"k","ꞁ":"l","ɯ":"m","ɰ":"m","ᴔ":"oe","ɹ":"r","ɻ":"r","ɺ":"r","ⱹ":"r","ʇ":"t","ʌ":"v","ʍ":"w","ʎ":"y","ꜩ":"tz","ú":"u","ŭ":"u","ǔ":"u","û":"u","ṷ":"u","ü":"u","ǘ":"u","ǚ":"u","ǜ":"u","ǖ":"u","ṳ":"u","ụ":"u","ű":"u","ȕ":"u","ù":"u","ủ":"u","ư":"u","ứ":"u","ự":"u","ừ":"u","ử":"u","ữ":"u","ȗ":"u","ū":"u","ṻ":"u","ų":"u","ᶙ":"u","ů":"u","ũ":"u","ṹ":"u","ṵ":"u","ᵫ":"ue","ꝸ":"um","ⱴ":"v","ꝟ":"v","ṿ":"v","ʋ":"v","ᶌ":"v","ⱱ":"v","ṽ":"v","ꝡ":"vy","ẃ":"w","ŵ":"w","ẅ":"w","ẇ":"w","ẉ":"w","ẁ":"w","ⱳ":"w","ẘ":"w","ẍ":"x","ẋ":"x","ᶍ":"x","ý":"y","ŷ":"y","ÿ":"y","ẏ":"y","ỵ":"y","ỳ":"y","ƴ":"y","ỷ":"y","ỿ":"y","ȳ":"y","ẙ":"y","ɏ":"y","ỹ":"y","ź":"z","ž":"z","ẑ":"z","ʑ":"z","ⱬ":"z","ż":"z","ẓ":"z","ȥ":"z","ẕ":"z","ᵶ":"z","ᶎ":"z","ʐ":"z","ƶ":"z","ɀ":"z","ﬀ":"ff","ﬃ":"ffi","ﬄ":"ffl","ﬁ":"fi","ﬂ":"fl","ĳ":"ij","œ":"oe","ﬆ":"st","ₐ":"a","ₑ":"e","ᵢ":"i","ⱼ":"j","ₒ":"o","ᵣ":"r","ᵤ":"u","ᵥ":"v","ₓ":"x"};

//funzione per la sostituzione delle lettere accentate
String.prototype.alyLatinize = function(){
	return this.replace(/[^A-Za-z0-9\[\] ]/g,function(a){
		return alyLatinMap[a]||a})
	};

plani3d.Config = function(objConfig) {
	// valorizza il riferimento al nome dell'oggetto al livello 0
	this.server = objConfig.server;
	this.maps = objConfig.maps;

	// ### inizio variabili costanti
	this.geojson = new ol.format.GeoJSON();
	this.map;
	this.mapProjectionCode;
	this.dataAsJson;
	this.strJsonDataType = "json";
	this.strApplicationJson = "application/json";
	this.inputValidityDate;
	this.lastIdentifyTime;
	this.otherLayers = [];
	this.wfsService = '/wfs';
	this.wmsService = '/wms';
	this.requestMaxLength = 65000;
	// ### fine variabili costanti

	this.init = function() {
		this.prepareBlockUIPanel();
	}
	
	// #### sezioni configurabili
	// tipologie di layer gestite
	this.baseLayerTypeSAT = "SAT";
	this.baseLayerTypeRV = "RV";
	this.baseLayerTypeCAT = "CAT";
	this.baseLayerTypeOSM = "OSM";
	this.baseLayerTypeSTA = "STA";
	this.baseLayerTypeVectorPrefix = "v_";
	this.validityDateTimeSection = "T00:00:00.001Z"; // 1ms per identificare correttamente record con dataIni e dataFin uguali

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
		        cursor: 'default'
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
};var lasciamiPerIlMinifier = "";

(function() {
  var copyButton = document.getElementById('copy-button');
  if (copyButton) {
    var data = document.getElementById('example-source').textContent;
    new ZeroClipboard(copyButton).on('copy', function(event) {
      event.clipboardData.setData({
        'text/plain': data,
        'text/html': data
      });
    });
  }

  var fiddleButton = document.getElementById('jsfiddle-button');
  if (fiddleButton) {
    fiddleButton.onclick = function(event) {
      event.preventDefault();
      document.getElementById('jsfiddle-form').submit();
    };
  }

  if (window.location.host === 'localhost:3000') {
    return;
  }

  var container = document.getElementById('navbar-logo-container');
  if (!container) {
    return;
  }

  var form = document.createElement('form');
  var select = document.createElement('select');
  var possibleModes = {
    'raw' : 'Development',
    'advanced': 'Production'
  };
  var urlMode = window.location.href.match(/mode=([a-z0-9\-]+)\&?/i);
  var curMode = urlMode ? urlMode[1] : 'advanced';

  for (var mode in possibleModes) {
    if (possibleModes.hasOwnProperty(mode)) {
      var option = document.createElement('option');
      var modeTxt = possibleModes[mode];
      option.value = mode;
      option.innerHTML = modeTxt;
      option.selected = curMode === mode;
      select.appendChild(option);
    }
  }

  select.onchange = function(event) {
    var newMode = event.target.value;
    var search = window.location.search.substring(1);
    var baseUrl = window.location.href.split('?')[0];
    var chunks = search ? search.split('&') : [];
    var pairs = [];
    var modeFound = false;
    for (var i = chunks.length - 1; i >= 0; --i) {
      var pair = chunks[i].split('=');
      if (pair[0].toLowerCase() === 'mode') {
        pair[1] = newMode;
        modeFound = true;
      }
      var adjusted = encodeURIComponent(pair[0]);
      if (typeof pair[1] !== undefined) {
        adjusted += '=' + encodeURIComponent(pair[1] || '');
      }
      pairs.push(adjusted);
    }
    if (!modeFound) {
      pairs.push('mode=' + encodeURIComponent(newMode));
    }
    location.href = baseUrl + '?' + pairs.join('&');
  };

  select.className = 'input-medium';

  form.className = 'navbar-form version-form';
  form.appendChild(select);

  container.appendChild(form);
})();

var common = {};

common.getRendererFromQueryString = function(opt_default) {
  var obj = {};
  var queryString = location.search.slice(1);
  var re = /([^&=]+)=([^&]*)/g;

  var m = re.exec(queryString);
  while (m) {
    obj[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    m = re.exec(queryString);
  }
  if ('renderers' in obj) {
    return obj['renderers'].split(',');
  } else if ('renderer' in obj) {
    return [obj['renderer']];
  } else {
    return opt_default;
  }
};
/* http://prismjs.com/download.html?themes=prism&languages=markup+css+clike+javascript */
self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{};var Prism=function(){var e=/\blang(?:uage)?-(?!\*)(\w+)\b/i,t=self.Prism={util:{encode:function(e){return e instanceof n?new n(e.type,t.util.encode(e.content),e.alias):"Array"===t.util.type(e)?e.map(t.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1]},clone:function(e){var n=t.util.type(e);switch(n){case"Object":var a={};for(var r in e)e.hasOwnProperty(r)&&(a[r]=t.util.clone(e[r]));return a;case"Array":return e.map(function(e){return t.util.clone(e)})}return e}},languages:{extend:function(e,n){var a=t.util.clone(t.languages[e]);for(var r in n)a[r]=n[r];return a},insertBefore:function(e,n,a,r){r=r||t.languages;var i=r[e];if(2==arguments.length){a=arguments[1];for(var l in a)a.hasOwnProperty(l)&&(i[l]=a[l]);return i}var s={};for(var o in i)if(i.hasOwnProperty(o)){if(o==n)for(var l in a)a.hasOwnProperty(l)&&(s[l]=a[l]);s[o]=i[o]}return t.languages.DFS(t.languages,function(t,n){n===r[e]&&t!=e&&(this[t]=s)}),r[e]=s},DFS:function(e,n,a){for(var r in e)e.hasOwnProperty(r)&&(n.call(e,r,e[r],a||r),"Object"===t.util.type(e[r])?t.languages.DFS(e[r],n):"Array"===t.util.type(e[r])&&t.languages.DFS(e[r],n,r))}},highlightAll:function(e,n){for(var a,r=document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'),i=0;a=r[i++];)t.highlightElement(a,e===!0,n)},highlightElement:function(a,r,i){for(var l,s,o=a;o&&!e.test(o.className);)o=o.parentNode;if(o&&(l=(o.className.match(e)||[,""])[1],s=t.languages[l]),s){a.className=a.className.replace(e,"").replace(/\s+/g," ")+" language-"+l,o=a.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\s+/g," ")+" language-"+l);var u=a.textContent;if(u){u=u.replace(/^(?:\r?\n|\r)/,"");var g={element:a,language:l,grammar:s,code:u};if(t.hooks.run("before-highlight",g),r&&self.Worker){var c=new Worker(t.filename);c.onmessage=function(e){g.highlightedCode=n.stringify(JSON.parse(e.data),l),t.hooks.run("before-insert",g),g.element.innerHTML=g.highlightedCode,i&&i.call(g.element),t.hooks.run("after-highlight",g)},c.postMessage(JSON.stringify({language:g.language,code:g.code}))}else g.highlightedCode=t.highlight(g.code,g.grammar,g.language),t.hooks.run("before-insert",g),g.element.innerHTML=g.highlightedCode,i&&i.call(a),t.hooks.run("after-highlight",g)}}},highlight:function(e,a,r){var i=t.tokenize(e,a);return n.stringify(t.util.encode(i),r)},tokenize:function(e,n){var a=t.Token,r=[e],i=n.rest;if(i){for(var l in i)n[l]=i[l];delete n.rest}e:for(var l in n)if(n.hasOwnProperty(l)&&n[l]){var s=n[l];s="Array"===t.util.type(s)?s:[s];for(var o=0;o<s.length;++o){var u=s[o],g=u.inside,c=!!u.lookbehind,f=0,h=u.alias;u=u.pattern||u;for(var p=0;p<r.length;p++){var d=r[p];if(r.length>e.length)break e;if(!(d instanceof a)){u.lastIndex=0;var m=u.exec(d);if(m){c&&(f=m[1].length);var y=m.index-1+f,m=m[0].slice(f),v=m.length,k=y+v,b=d.slice(0,y+1),w=d.slice(k+1),N=[p,1];b&&N.push(b);var O=new a(l,g?t.tokenize(m,g):m,h);N.push(O),w&&N.push(w),Array.prototype.splice.apply(r,N)}}}}}return r},hooks:{all:{},add:function(e,n){var a=t.hooks.all;a[e]=a[e]||[],a[e].push(n)},run:function(e,n){var a=t.hooks.all[e];if(a&&a.length)for(var r,i=0;r=a[i++];)r(n)}}},n=t.Token=function(e,t,n){this.type=e,this.content=t,this.alias=n};if(n.stringify=function(e,a,r){if("string"==typeof e)return e;if("Array"===t.util.type(e))return e.map(function(t){return n.stringify(t,a,e)}).join("");var i={type:e.type,content:n.stringify(e.content,a,r),tag:"span",classes:["token",e.type],attributes:{},language:a,parent:r};if("comment"==i.type&&(i.attributes.spellcheck="true"),e.alias){var l="Array"===t.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(i.classes,l)}t.hooks.run("wrap",i);var s="";for(var o in i.attributes)s+=o+'="'+(i.attributes[o]||"")+'"';return"<"+i.tag+' class="'+i.classes.join(" ")+'" '+s+">"+i.content+"</"+i.tag+">"},!self.document)return self.addEventListener?(self.addEventListener("message",function(e){var n=JSON.parse(e.data),a=n.language,r=n.code;self.postMessage(JSON.stringify(t.util.encode(t.tokenize(r,t.languages[a])))),self.close()},!1),self.Prism):self.Prism;var a=document.getElementsByTagName("script");return a=a[a.length-1],a&&(t.filename=a.src,document.addEventListener&&!a.hasAttribute("data-manual")&&document.addEventListener("DOMContentLoaded",t.highlightAll)),self.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=Prism);;
Prism.languages.markup={comment:/<!--[\w\W]*?-->/,prolog:/<\?.+?\?>/,doctype:/<!DOCTYPE.+?>/,cdata:/<!\[CDATA\[[\w\W]*?]]>/i,tag:{pattern:/<\/?[\w:-]+\s*(?:\s+[\w:-]+(?:=(?:("|')(\\?[\w\W])*?\1|[^\s'">=]+))?\s*)*\/?>/i,inside:{tag:{pattern:/^<\/?[\w:-]+/i,inside:{punctuation:/^<\/?/,namespace:/^[\w-]+?:/}},"attr-value":{pattern:/=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,inside:{punctuation:/=|>|"/}},punctuation:/\/?>/,"attr-name":{pattern:/[\w:-]+/,inside:{namespace:/^[\w-]+?:/}}}},entity:/&#?[\da-z]{1,8};/i},Prism.hooks.add("wrap",function(t){"entity"===t.type&&(t.attributes.title=t.content.replace(/&amp;/,"&"))});;
Prism.languages.css={comment:/\/\*[\w\W]*?\*\//,atrule:{pattern:/@[\w-]+?.*?(;|(?=\s*\{))/i,inside:{punctuation:/[;:]/}},url:/url\((?:(["'])(\\\n|\\?.)*?\1|.*?)\)/i,selector:/[^\{\}\s][^\{\};]*(?=\s*\{)/,string:/("|')(\\\n|\\?.)*?\1/,property:/(\b|\B)[\w-]+(?=\s*:)/i,important:/\B!important\b/i,punctuation:/[\{\};:]/,"function":/[-a-z0-9]+(?=\()/i},Prism.languages.markup&&(Prism.languages.insertBefore("markup","tag",{style:{pattern:/<style[\w\W]*?>[\w\W]*?<\/style>/i,inside:{tag:{pattern:/<style[\w\W]*?>|<\/style>/i,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.css},alias:"language-css"}}),Prism.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\s*style=("|').*?\1/i,inside:{"attr-name":{pattern:/^\s*style/i,inside:Prism.languages.markup.tag.inside},punctuation:/^\s*=\s*['"]|['"]\s*$/,"attr-value":{pattern:/.+/i,inside:Prism.languages.css}},alias:"language-css"}},Prism.languages.markup.tag));;
Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\w\W]*?\*\//,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.+/,lookbehind:!0}],string:/("|')(\\\n|\\?.)*?\1/,"class-name":{pattern:/((?:(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,lookbehind:!0,inside:{punctuation:/(\.|\\)/}},keyword:/\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,"boolean":/\b(true|false)\b/,"function":{pattern:/[a-z0-9_]+\(/i,inside:{punctuation:/\(/}},number:/\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/,operator:/[-+]{1,2}|!|<=?|>=?|={1,3}|&{1,2}|\|?\||\?|\*|\/|~|\^|%/,ignore:/&(lt|gt|amp);/i,punctuation:/[{}[\];(),.:]/};;
Prism.languages.javascript=Prism.languages.extend("clike",{keyword:/\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|get|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|set|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)\b/,number:/\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|-?Infinity)\b/,"function":/(?!\d)[a-z0-9_$]+(?=\()/i}),Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,lookbehind:!0}}),Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/<script[\w\W]*?>[\w\W]*?<\/script>/i,inside:{tag:{pattern:/<script[\w\W]*?>|<\/script>/i,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.javascript},alias:"language-javascript"}});;

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

plani3d.Maps = function(params) {
	
	// valorizza il riferimento 'conf' interno e il riferimento al nome dell'oggetto al livello 0
	var conf = params;
	
	var ready = false;
	
	if (conf.ol && conf.proj4) {
		conf.proj4.defs("EPSG:25832","+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");
		conf.proj4.defs("EPSG:32632","+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs");
		conf.proj4.defs("EPSG:23032","+proj=utm +zone=32 +ellps=intl +units=m +no_defs");
		conf.proj4.defs("EPSG:3003","+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs");
		conf.proj4.defs("EPSG:6706", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
		conf.proj4.defs("EPSG:4258", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
		
		conf.ol.proj.setProj4(conf.proj4);
	}
	
	// default 1/2
	if (typeof conf.imgpath === 'undefined')
		conf.imgpath = '';
	if (typeof conf.protocol === 'undefined')
		conf.protocol = 'http';
	if (typeof conf.webapp === 'undefined')
		conf.webapp = 'plani3d-srv';
	if (typeof conf.maps === 'undefined')
		conf.maps = 'default';
	if (typeof conf.target === 'undefined')
		conf.target = 'p3dt-map';
	if (typeof conf.debug === 'undefined')
		conf.debug = false;
	
	var p3dconfig = new plani3d.Config({server: params.server});
	var alyssoutils = new alysso.Utils(p3dconfig);

	// registra la data di riferimento
	if (typeof alyssoInputDate === 'undefined' || alyssoInputDate == "") {
		// se la data di riferimento non è valorizzata la definisce come la data odierna
		p3dconfig.inputValidityDate = alyssoutils.getTodayFormatted();
	}
	else {
		if(!checkDateFormat(alyssoInputDate)){
			alert("ATTENZIONE: formato data in input non riconosciuto. Utilizzata la data odierna");
			console.log("checkDateFormat ha dato esito negativo, utilizzata data odierna");
			p3dconfig.inputValidityDate = alyssoutils.getTodayFormatted();
		}
		else {
			p3dconfig.inputValidityDate = alyssoInputDate;
		}
	}
	
	var view;
	var styles = [];
	var styleByThemeItems = {};
	var baseLayers = [];
	var availableBaseLayers = [];
	var arrayDivToResize = [];
	var matrixResolutionDim = 22;
	// variabile da inizializzare in modo fisso
	var pointSize = 0.6;
	var layerSelectableId;
	var sourceSelect, sourceVeil;
	var vectorLayerSelect, vectorLayerVeil;
	var vectorLayerVeilId = 'veil';
	var draw, cleanDraw;
	var layerSelectableId, activeControls, externalSelectFunction;
	var reloadDone = false;
	var reloadDoneCarto = false;
	var layerToIntersect, objTematismi;
	var selectClick, selectPointerMove;
	
	var projection = function() {
		return ol.proj.get(epsg);
	}

	var projectionExtent = function() {
		return projection().getExtent();
	}
	
	var size = function() {
		return ol.extent.getWidth(projectionExtent()) / 256;
	}

	var resolutions = new Array(matrixResolutionDim);
	var matrixIds = new Array(matrixResolutionDim);
	
	var hiddenStyle = {
	        'Point': [new ol.style.Style({
	            image: new ol.style.Circle({
	                radius: 5,
	                fill: new ol.style.Fill({
	                    color: 'rgba(0,0,0,0)'
	                }),
	                stroke: new ol.style.Stroke({
	                    color: 'rgba(0,0,0,0)'
	                })
	            })
	        })],
	        'MultiPolygon': [new ol.style.Style ({
                stroke: new ol.style.Stroke({
                	color: 'rgba(0,0,0,0)',
                    width: 1
                }),
                fill: new ol.style.Fill({
                	color: 'rgba(0,0,0,0)'
                })
            })],
            'Polygon': [new ol.style.Style ({
                stroke: new ol.style.Stroke({
                	color: 'rgba(0,0,0,0)',
                    width: 1
                }),
                fill: new ol.style.Fill({
                	color: 'rgba(0,0,0,0)'
                })
            })]
	    };
	
	this.init = function() {
		
		$.ajax({
			type: "GET",
			url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/i?s="+window.location.href,
			contentType: p3dconfig.strApplicationJson,
			async: true
	    });
		
		loading(true);
		
		// caricamento configurazioni dal server
	    return $.ajax({
			type: "GET",
			url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/config?loadAllConfig=true&code="+conf.maps,
			contentType: p3dconfig.strApplicationJson,
			dataType: p3dconfig.strJsonDataType,
			async: true,
			context: this,
			success: function(dataOutput) {
				p3dconfig.dataAsJson = dataOutput;
				initPhase2();
				loading(false);
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
	    		// TODO redirect a pagina di errore o div bianco con messaggio di errore?
	    	}
	    });
	}
	
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

	var initPhase2 = function() {
		loading(true);

		// default 2/2
		if (typeof conf.center === 'undefined')
			conf.center = p3dconfig.dataAsJson.centerCoords;
		if (typeof conf.zoom === 'undefined')
			conf.zoom = p3dconfig.dataAsJson.initialZoom;
	    
	    // valorizzazione variabile generale utilizzata anche da altri oggetti
		p3dconfig.mapProjectionCode = p3dconfig.dataAsJson.epsgCode;
	    
	    epsg = 'EPSG:'+p3dconfig.mapProjectionCode;
		for (var z = 0; z < matrixResolutionDim; ++z) {
			// generate resolutions and matrixIds arrays for this WMTS
			resolutions[z] = size() / Math.pow(2, z);
			matrixIds[z] = z;
		}
		view = new ol.View({
			center : conf.center,
			zoom : conf.zoom,
			maxZoom: p3dconfig.dataAsJson.maxZoom
		});
	    
	    // caricamento dei base layer disponibili in base alla configurazione in arrivo dal server
		for (var baseLayerKey in p3dconfig.dataAsJson.baseLayers) {
			var baseLayer = p3dconfig.dataAsJson.baseLayers[baseLayerKey];
			
			// gestione delle tre tipologie di base layer
			var checkLayerLoaded = true;
			var olBaseLayer;
			if (baseLayer.type == p3dconfig.baseLayerTypeSAT) {
				olBaseLayer = new ol.layer.Tile({
			    	id : baseLayer.type,
			    	label : baseLayer.label,
			    	show : baseLayer.show,
			    	source : new ol.source.WMTS({
			    		url : baseLayer.url,
			    		layer : baseLayer.name,
			    		matrixSet : epsg,
			    		format : 'image/png',
			    		projection : projection(),
			    		tileGrid : new ol.tilegrid.WMTS({
			    			origin : ol.extent.getTopLeft(projectionExtent()),
			    			resolutions : resolutions,
			    			matrixIds : matrixIds
			    		}),
			    		style : 'default',
			    		wrapX : true,
						attributions: [new ol.Attribution({
							html: "Powered by <a href='http://alysso.it/' target='_blank'>Alysso s.r.l.</a> | <a href='https://www.arcgis.com/home/index.html'>ArcGIS</a> contributors."
						})]
			    	})
			    });
			}
			else if (baseLayer.type == p3dconfig.baseLayerTypeRV) {
				olBaseLayer = new ol.layer.Tile({
			    	id : baseLayer.type,
			    	label : baseLayer.label,
		    		show : baseLayer.show,
					source: new ol.source.TileWMS({
						url: baseLayer.url,
						params: {'LAYERS': baseLayer.name},
						attributions: [new ol.Attribution({
							html: "Powered by <a href='http://alysso.it/' target='_blank'>Alysso s.r.l.</a> | <a href='https://tinyurl.com/ybvhxjju'>RealVistaWhere</a> contributors."
						})]
					})
			    });
			}
			else if (baseLayer.type == p3dconfig.baseLayerTypeSTA) {
				olBaseLayer = new ol.layer.Tile({
					id : baseLayer.type,
			    	label : baseLayer.label,
			    	show : baseLayer.show,
					source: new ol.source.Stamen({
						layer: 'toner',
						attributions: [new ol.Attribution({
							html: "Powered by <a href='http://alysso.it/' target='_blank'>Alysso s.r.l.</a> | <a href='http://http://maps.stamen.com'>Stamen</a> contributors."
						})]
					})
				});
			}
			else if (baseLayer.type == p3dconfig.baseLayerTypeOSM) {
				var osmSource = null;
				if (typeof baseLayer.url === 'undefined') {
					osmSource = new ol.source.OSM();
				}
				else {
					osmSource = new ol.source.OSM({
						url: baseLayer.url,
						crossOrigin: null,
						params: {'LAYERS': baseLayer.name},
						attributions: [new ol.Attribution({
							html: "Powered by <a href='http://alysso.it/' target='_blank'>Alysso s.r.l.</a> | <a href='https://www.openstreetmap.org'>my OpenStreetMap</a> contributors."
						})]
					})
				}
				olBaseLayer = new ol.layer.Tile({
			    	id: baseLayer.type,
			    	label : baseLayer.label,
			    	show : baseLayer.show,
					source: osmSource
			    });
			}
			else if (baseLayer.type.substr(0, p3dconfig.baseLayerTypeVectorPrefix.length) == p3dconfig.baseLayerTypeVectorPrefix) {
				if (baseLayer.isTiled) {
					olBaseLayer = new ol.layer.Tile({
				    	id : baseLayer.type,
				    	label : baseLayer.label,
				    	show : baseLayer.show,
				    	source : new ol.source.TileWMS({
				    		url : baseLayer.url,
				    		projection : projection(),
				    		params : {
				    			'LAYERS': baseLayer.name,
				    			'URLPROXY': baseLayer.urlProxy,
				    			'NS': baseLayer.featureNameSpace,
				    			'PREFIX': baseLayer.prefixName,
				    			'FIELDFILTER': baseLayer.fieldFilter
				    		},
				    		serverType : baseLayer.serverType
				    	})
				    });	
				}
				else {
					olBaseLayer = new ol.layer.Image({
				    	id : baseLayer.type,
				    	label : baseLayer.label,
				    	show : baseLayer.show,
						source: new ol.source.ImageWMS({
							ratio : 1,
							url : baseLayer.url,
							params : {
								'FORMAT': 'image/png',
								'VERSION': '1.1.1',
				    			'LAYERS': baseLayer.name,
				    			'URLPROXY': baseLayer.urlProxy,
				    			'NS': baseLayer.featureNameSpace,
				    			'PREFIX': baseLayer.prefixName,
				    			'FIELDFILTER': baseLayer.fieldFilter
							}
						})
					});	
				}
			}
			else {
				console.log("Tipologia di layer '" + baseLayer.type + "' non gestita");
				checkLayerLoaded = false;
			}
			
			if (checkLayerLoaded) {
				availableBaseLayers[baseLayer.type] = olBaseLayer;
			}
		}

		p3dconfig.map = new ol.Map({
			layers : getLayers(),
			target : conf.target,
			controls : ol.control.defaults({
					attributionOptions: ({
						collapsible: false
					})
				}).extend([ new ol.control.MousePosition({
					coordinateFormat: ol.coordinate.createStringXY(0),
					projection: epsg,
					undefinedHTML: '&nbsp;'
				})
			]),
			view : view
		});

		// sul resize, aggiorno la mappa (altrimenti si contrae/allunga)
		$("#p3dt-map").on( "resize", function() {
			p3dconfig.map.updateSize();
		} );
		
		for (var key in p3dconfig.otherLayers) {
			p3dconfig.map.addLayer(p3dconfig.otherLayers[key]);
		}
		
		createLayerSwitcher();
		
		createProgressBar();
		
		p3dconfig.init();

		if (typeof conf.autoresize !== undefined && conf.autoresize == true) {
			$(document).ready(function(){
				alyssoutils.resizeBodyHeight();
			    // registra evento per ridimensionare il div della mappa al ridimensionamento della finestra del browser
			    $(window).resize(function() {
			    	alyssoutils.resizeBodyHeight();
			    });
			});
		}
		
		ready = true;
		console.log('map init completed');
		
		loading(false);
	}
	
	this.registerToResize = function (idDivToResize, newRateHeight) {
		var obj = {id: idDivToResize, rate: newRateHeight};
		arrayDivToResize.push(obj);

		 for(var idx in arrayDivToResize) {
		    alyssoutils.resizeHeighDiv(arrayDivToResize[idx].id, arrayDivToResize[idx].rate, $('#'+conf.target));
		 }
		
		 $(window).resize(function() {
			 for(var idx in arrayDivToResize) {
			    alyssoutils.resizeHeighDiv(arrayDivToResize[idx].id, arrayDivToResize[idx].rate, $('#'+conf.target));
			 }
		 });
	}
	
	var getLayers = function() {
		
		if (conf.debug)
			console.log("getLayers");
		
	    for (var key in conf.layers) {
	    	if (typeof availableBaseLayers[conf.layers[key]] === 'undefined') {
	    		console.log("layer "+conf.layers[key]+" not available");
	    		continue;
	    	}
	    	baseLayers[conf.layers[key]] = availableBaseLayers[conf.layers[key]];
	    	if (key > 0) // lascio visibile solo il primo
	    		baseLayers[conf.layers[key]].setVisible(false);
	    }
	    var baseLayersValues = [];
	    for (var key in baseLayers) {
	    	baseLayersValues.push(baseLayers[key]);
	    }
	    return baseLayersValues;
	}
	
	var createProgressBar = function() {
		
		if (conf.debug)
			console.log("createProgressBar");
		
		// creazione div
		$('#'+conf.target+' .ol-viewport .ol-overlaycontainer-stopevent').append(
				$('<div>')
					.attr('class','progress progress-striped active')
					.attr('id','myprogress'));
		
		$('#'+conf.target + ' #myprogress').append(
				$('<div>')
				.attr('class','progress-bar progress-bar-striped')
				.attr('id','myprogressbar')
				.attr('role','progressbar')
				.attr('style','width:100%'));
	}

	var createLayerSwitcher = function() {
		
		if (conf.debug)
			console.log("createLayerSwitcher");
		
		// creazione div
		$('#'+conf.target+' .ol-viewport .ol-overlaycontainer-stopevent').append(
				$('<div>')
					.attr('class','p3d-layer-switcher btn-group switcher')
					.attr('id', conf.target + '-layer-switcher'));
		
		// creazione pulsanti
		for (var key in conf.layers) {
			if (baseLayers[conf.layers[key]].get('show'))
				$('#'+conf.target + ' #'+conf.target + '-layer-switcher').append(
						$('<button>')
							.attr('id','layer_switcher_'+conf.layers[key])
							.attr('type','button')
							.attr('class','btn btn-default')
							.append($('<span>').text(baseLayers[conf.layers[key]].get('label'))));
		}
		for (var key in conf.layers) {
			$('#'+conf.target + ' #layer_switcher_'+conf.layers[key]).click({id: conf.layers[key]}, switchBaseLayer);
		}
	}
	
	var createLayerPopup = function() {
		
		if (conf.debug)
			console.log("createLayerPopup");
		
		$('#'+conf.target+' .ol-viewport .ol-overlaycontainer-stopevent').append(
				$('<div>').attr('id',conf.target+'_popup').attr('class','ol-popup')
				.append($('<div>').attr('id',conf.target+'_popup-content')));
	}

	var switchBaseLayer = function(event){
		
		if (conf.debug)
			console.log("switchBaseLayer");
		
		for (var key in baseLayers) {
			if (key == event.data.id) {
				getLayerById(p3dconfig.map, key).setVisible(true);
			}
			else{
				getLayerById(p3dconfig.map, key).setVisible(false);
			}
		}
	}

	var createDetailPanel = function() {
		
		if (conf.debug)
			console.log("createDetailPanel");
		
		// creazione div
		$("#"+conf.target+" .ol-viewport .ol-overlaycontainer-stopevent").append(
				$("<div>")
					.attr("id", conf.target + "-detail-panel").attr("class", "p3d-detail-panel"));
		$("#"+conf.target + "-detail-panel").hide();
	}

	var createLegendPanel = function() {
		
		if (conf.debug)
			console.log("createLegendPanel");
		
		$("#"+conf.target+" .ol-viewport .ol-overlaycontainer-stopevent")
			.append($("<div>").attr("id", conf.target + "-legend-panel").attr("class", "p3d-legend-panel"));
		$("#"+conf.target + "-legend-panel")
			.append($("<div>").attr("id", conf.target + "-legend-panel-icon").attr("class", "p3d-legend-panel-icon")
				.append($("<a>").attr("id", conf.target + "-legend-panel-closer").attr("class", "p3d-legend-panel-closer")
					.append($("<img>").attr("src", conf.imgpath+"imgs/layer-switcher-minimize.png"))));
		$("#"+conf.target + "-legend-panel-closer").click(closeLegend);
		$("#"+conf.target + "-legend-panel").hide();

		$("#"+conf.target+" .ol-viewport .ol-overlaycontainer-stopevent")
			.append($("<div>").attr("id", conf.target + "-legend-panel-opener").attr("class", "p3d-legend-panel-opener"));
		$("#"+conf.target + "-legend-panel-opener")
			.append($("<a>")
				.append($("<img>").attr("src", conf.imgpath+"imgs/layer-switcher-maximize.png")));
		$("#"+conf.target + "-legend-panel-opener a").click(openLegend);
		$("#"+conf.target + "-legend-panel-opener").hide();
	}

	var openLegend = function() {
		
		if (conf.debug)
			console.log("openLegend");
		
		$('#'+conf.target + ' #'+conf.target + '-legend-panel').show();
		$('#'+conf.target + ' #'+conf.target + '-legend-panel-opener').hide();
		if ($('#'+conf.target + ' #search-results-panel').is(':visible'))
			this.closeResults();
	}

	var closeLegend = function() {
		
		if (conf.debug)
			console.log("closeLegend");
		
		$('#'+conf.target + ' #'+conf.target + '-legend-panel').hide();
		$('#'+conf.target + ' #'+conf.target + '-legend-panel-opener').show();
	}

	this.createPanel = function() {
		
		if (conf.debug)
			console.log("createPanel");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.createPanel();
			}, 500);
			return;
		}
		$("#"+conf.target+" .ol-viewport .ol-overlaycontainer-stopevent")
			.append($("<div>").attr("id", conf.target + "-panel").attr("class", "p3d-panel"));
		$("#"+conf.target + "-panel")
			.append($("<div>").attr("id", conf.target + "-panel-icon").attr("class", "p3d-panel-icon")
				.append($("<a>").attr("id", conf.target + "-panel-closer").attr("class", "p3d-panel-closer")
					.append($("<img>").attr("src", conf.imgpath+"imgs/layer-switcher-minimize.png"))));
		$("#"+conf.target + "-panel-closer").click(this.closePanel);
		$("#"+conf.target + "-panel").hide();

		$("#"+conf.target+" .ol-viewport .ol-overlaycontainer-stopevent")
			.append($("<div>").attr("id", conf.target + "-panel-opener").attr("class", "p3d-panel-opener"));
		$("#"+conf.target + "-panel-opener")
			.append($("<a>")
				.append($("<img>").attr("src", conf.imgpath+"imgs/layer-switcher-maximize.png")));
		$("#"+conf.target + "-panel-opener a").click(this.openPanel);
		$("#"+conf.target + "-panel-opener").hide();
	}

	this.openPanel = function() {
		
		if (conf.debug)
			console.log("openPanel");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.openPanel();
			}, 500);
			return;
		}
		$('#'+conf.target + ' #'+conf.target + '-panel').show();
		$('#'+conf.target + ' #'+conf.target + '-panel-opener').hide();
		if ($('#'+conf.target + ' #search-results-panel').is(':visible'))
			this.closeResults();
	}

	this.closePanel = function() {
		
		if (conf.debug)
			console.log("closePanel");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.closePanel();
			}, 500);
			return;
		}
		$('#'+conf.target + ' #'+conf.target + '-panel').hide();
		$('#'+conf.target + ' #'+conf.target + '-panel-opener').show();
	}
	
	this.loadTematismi = function(callback, objTemi, multi, detailsJson) {
		
		if (conf.debug)
			console.log("loadTematismi");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.loadTematismi(callback, objTemi, andor);
			}, 500);
			return;
		}
		if (multi == null || typeof multi === 'undefined')
			multi = false;
		
		if(reloadDone){
			$('#'+conf.target + ' #'+conf.target + '-legend-panel').remove();
			$('#'+conf.target + ' #'+conf.target + '-legend-panel-opener').remove();
			if (andorSource) {
				andorSource.clear();
			}
			for (var key in p3dconfig.map.getLayers().getArray()) {
				var layer = p3dconfig.map.getLayers().getArray()[key];
				if (layer.get('id').startsWithIgnorCase('tematismo_')){
					layer.getSource().clear();
					p3dconfig.map.removeLayer(layer);
				}
			}
		}
		else {
			createDetailPanel();
		}
		
		createLegendPanel();
		createLayerPopup();

		this.processTematismi(callback, objTemi, multi, detailsJson);
	}
	
	this.reloadTematismi = function(callback, objTemi, multi, detailsJson){
		
		if (conf.debug)
			console.log("reloadTematismi");
		
		reloadDone = true;
		this.loadTematismi(callback, objTemi, multi, detailsJson);
	}
	
	this.loadTematismiCarto = function(callback, layer, objTemi) {
		
		if (conf.debug)
			console.log("loadTematismiCarto");
		
		var mythis = this;
		if (!ready) {
			setTimeout(function() {
				mythis.loadTematismiCarto(callback, layer, objTemi);
			}, 500);
			return;
		}
		
		loading(true);
		
		if(reloadDoneCarto){
			$('#'+conf.target + ' #'+conf.target + '-legend-panel').remove();
			$('#'+conf.target + ' #'+conf.target + '-legend-panel-opener').remove();
		}
		else {
			createDetailPanel();
		}
		
		createLegendPanel();
		createLayerPopup();
		
		layerToIntersect = layer;
		objTematismi = objTemi;
		
		if(objTematismi !== null){
			conf.tematismi = objTematismi;
		}
		
		if (conf.tematismi !== null && conf.tematismi.length !== 0) {
			
			var intersectionLayer = layerToIntersect ? layerToIntersect : null;
			
			var abortedCall = false;
			// nel caso di tematismi cartografici, effettuo una pre-elaborazione per applicare i filtri topologici
			var data = $.ajax({
				type: "GET",
				url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/themecarto",
				async: true,
				data: {json: JSON.stringify(conf.tematismi) , layer: intersectionLayer},
				dataType: "json",
		        contentType: "application/x-www-form-urlencoded",
		        beforeSend: function (xhr) {
		        	if((this.url).length > p3dconfig.requestMaxLength){
		        		xhr.abort();
		        		abortedCall = true;
		        		console.log('Richiesta in GET a '+ alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/themecarto" + ' troppo lunga, passo in POST');
		                return false
		            }
		         },
		        success: function(data) {
		        	//elimino la legenda attuale per rifarla
		        	if(reloadDoneCarto){
		        		$( "#legend-items-container" ).empty();
		        		$( "#legend-items-container" ).remove();
		        	}
					mythis.processTematismi(callback, data, false);
					loading(false);
				},
				error: function(e) {
					console.log("Errore" + e);
					loading(false);
				}
			});
			
			if(abortedCall){
				data = $.ajax({
					type: "POST",
					url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/themecarto",
					async: true,
					data: {json: JSON.stringify(conf.tematismi)},
					dataType: "json",
			        contentType: "application/x-www-form-urlencoded",
			        success: function(data) {
			        	//elimino la legenda attuale per rifarla
			        	if(reloadDoneCarto){
			        		$( "#legend-items-container" ).empty();
			        		$( "#legend-items-container" ).remove();
			        	}
						mythis.processTematismi(callback, data, false);
						loading(false);
					},
					error: function(e) {
						console.log("Errore" + e);
						loading(false);
					}
				});
			}
		}
	}
	
	this.reloadTematismiCarto = function(callback, objTematism, objTemi){
		
		if (conf.debug)
			console.log("reloadTematismiCarto");
		
		reloadDoneCarto = true;
		this.loadTematismiCarto(callback, layerToIntersect, objTemi);
	}
	
	this.getServiceArea = function(point) {
		
		if (conf.debug)
			console.log("getServiceArea");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.getServiceArea(point);
			}, 500);
			return;
		}
		loading(true);

		$.ajax({
			type: "GET",
			dataType: "json",
			url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/service-area?x="+point.coordinate[0]+"&y="+point.coordinate[0]+"&epsg="+p3dconfig.map.getView().getProjection().getCode(),
			success: function(data) {
				geomJson = data.geom;
				processGeom(geomJson);
				loading(false);
			},
			error: function(e) {
				console.log("Errore" + e);
				loading(false);
			}
		});
	}
	
	var cacheTematismo = null;
	
	this.processTematismi = function(callback, data, multi, detailsJson) {
		
		if (conf.debug)
			console.log("processTematismi");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.processTematismi(callback, data, multi);
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
		
		cacheTematismo = data;
		
		$("#"+conf.target + "-legend-panel").append($("<div>").attr("id", "legend-items-container"));
		
		if (typeof data.items === 'undefined') {
			// vecchia struttura, il JSON è un array di coppie tema-oggetti
			for (var key in data) {
				var tematismo = data[key];
				var items = data[key].items ? data[key].items : data;
				var isChecked = typeof data[key].checked !== 'undefined' ? data[key].checked : false;
				
				processSingleTematismo(key, tematismo, items, isChecked, callback, multi, detailsJson, "legend-items-container");
			}
		}
		else {
			// nuova struttura, il JSON contiene un array di temi ed uno di oggetti
			// PREPARA IL DIV CON I tab LEGENDA/TEMATISMI
			var divContainerTematismiId = "legend-items-container";
			var legendExist = false;
			var legendAdded = false;
			for (var key in data.themes) {
				if(data.themes[key].values) {
					for(var j=0; j< data.themes[key].values.length; j++){
						
						if (data.themes[key].values[j].color) {
							// trovato un tematismo con lo stile definito => creazione legenda

							// verifico se è già stata predisposta la struttura con tematismi e legenda
							if(!legendAdded) {
								$("#legend-items-container").append($("<ul>").attr("id", "myTab").attr("class", "nav nav-tabs"));
								$("#myTab").append($("<li>").attr("class", "active").append($("<a>").attr("href", "#legend-tab-tematismi").attr("data-toggle", "tab").text("Filtri")));
								$("#myTab").append($("<li>").append($("<a>").attr("href", "#legend-tab-legend").attr("data-toggle", "tab").text("Legenda")));
								$("#legend-items-container").append($("<div>").attr("id", "legend-tab-container").attr("class", "tab-content"));
								$("#legend-tab-container").append($("<div>").attr("id", "legend-tab-tematismi").attr("class", "tab-pane active").attr("style", "padding-top: 3px;"));
								$("#legend-tab-container").append($("<div>").attr("id", "legend-tab-legend").attr("class", "tab-pane").attr("style", "padding-top: 3px;"));
								
								var tematismoLabel = data.themes[key].title.alyLatinize().replaceAll(" ","-").replaceAll(" ","-")
									.replaceAll("&nbsp;","y").replaceAll(".","").replaceAll(":","");
								
								$("#legend-tab-legend").append($("<div>").text(tematismoLabel).attr("class","legend-elem")
										.attr("style", "padding-left: 2px; font-weight: bold;"));

								divContainerTematismiId = "legend-tab-tematismi";
								legendAdded = true;
								legendExist = true;
							}

							$("#legend-tab-legend")
							.append($("<div>")
								.attr("class", "p3d-circle")
								.attr("style", "background: #"+data.themes[key].values[j].color))
								.append($("<div>").attr("class","legend-elem")
										.attr("style", "display: inline-block; padding-left: 5px;").text(data.themes[key].values[j].label));
						}
					}
				}
			}
			
			if(legendExist) {
				// aggiunge la voce di legenda "altri"
				$("#legend-tab-legend")
				.append($("<div>")
					.attr("class", "p3d-circle")
					.attr("style", "background: #1e8a7c")) // default altre feature in mappa
					.append($("<div>").attr("class","legend-elem")
							.attr("style", "display: inline-block; padding-left: 5px;").text("Altri"));
			}
			
			for (var key in data.themes) {
				var tematismo = data.themes[key];
				var items = data.items;
				var isChecked = typeof data.themes[key].checked !== 'undefined' ?  data.themes[key].checked : false;
				
				processSingleTematismo(key, tematismo, items, isChecked, callback, multi, detailsJson, divContainerTematismiId, legendExist);
			}
		}
		
	    $('#myTab a:first').tab('show')
	    $('#myTab a').click(function (e) {
	    	e.preventDefault()
	    	$(this).tab('show')
	    })
		
		openLegend();
		$.unblockUI();
		loading(false);
	}
	
	var processSingleTematismo = function(key, tematismo, items, isChecked, callback, multi, detailsJson, divContainerId, legendExist) {
		
		if (conf.debug)
			console.log("processSingleTematismo");
		
		var tematismoLabel = tematismo.title.alyLatinize().replaceAll(" ","-").replaceAll(" ","-")
			.replaceAll("&nbsp;","y").replaceAll(".","").replaceAll(":","");
		var tematismoId = "tematismo_"+tematismoLabel;
		
		createLegendItem(key, tematismo, tematismoId, tematismoLabel, isChecked, callback, multi, divContainerId, legendExist);
		
		styles[tematismo.title] = tematismo.values;
		
		var features = getFeaturesByTematismo(items, tematismo);
		
		if (reloadDoneCarto) {
			getLayerById(p3dconfig.map, tematismoId).getSource().clear();
			getLayerById(p3dconfig.map, tematismoId).getSource().addFeatures(features);
		}
		else {
			vectorSource = new ol.source.Vector({
				features: features
			});
			
			var target = this;
			p3dconfig.map.addLayer(new ol.layer.Vector({
				id: tematismoId,
				source: vectorSource,
				visible: false,
				style:	function(feature){ 
					for (var i=0; i<styles[feature.get('tematismo')].length; i++) {
						var styleItem = styles[feature.get('tematismo')][i];
						var exactValue = typeof styleItem.value !== 'undefined' && styleItem.value == feature.get('valore_tema');
						var exactWhere = typeof styleItem.where !== 'undefined' && styleItem.where == feature.get('valore_tema');
						var between = typeof styleItem.from !== 'undefined' && alyssoutils.isNumeric(styleItem.from) && 
										typeof styleItem.to !== 'undefined' && alyssoutils.isNumeric(styleItem.to) &&
										parseFloat(styleItem.from) <= parseFloat(feature.get('valore_tema')) && 
										parseFloat(styleItem.to) >= parseFloat(feature.get('valore_tema'));
						var noRange = (typeof styleItem.from !== 'undefined' && typeof styleItem.to !== 'undefined') &&
										(!alyssoutils.isNumeric(styleItem.from) || !alyssoutils.isNumeric(styleItem.to));
						if (exactValue || exactWhere || between) {
							return styleByThemeItems[feature.get('tematismo') + styleItem.label];
						}
						else if (conf.debug && noRange)
							console.log("Attenzione, impossibile caricare il tematismo perchè non in formato numerico. Controllare i range di valori");
					}
				}
			}));
			
			//TODO sistemare lo stile di overlay, ci sono problemi
			selectPointerMove = new ol.interaction.Select({
				condition: ol.events.condition.pointerMove
			});
			selectClick = new ol.interaction.Select({
				condition: ol.events.condition.click
			});
			
			p3dconfig.map.addInteraction(selectPointerMove);
			
			// aggiungo overlay per popup tematismi
			var overlay = new ol.Overlay({
				element: document.getElementById(conf.target + '_popup'),
				autoPan: true,
				autoPanAnimation: {
					duration: 250
				}
			});
			p3dconfig.map.addOverlay(overlay);
			
			selectPointerMove.on('select', function(e) {
				if (e.target.getFeatures().getLength() == 1) {
					var feature=e.selected[0];
					var pixel = e.mapBrowserEvent.pixel;
					$("#"+conf.target+"_popup").show();
					$("#"+conf.target+"_popup-content").text(feature.get('label') ? feature.get('label') : feature.get('descrizione'));
					overlay.setPosition(e.mapBrowserEvent.coordinate);
				}
				else {
					if ($('#'+conf.target +'_popup').is(':visible')){
						$('#'+conf.target +'_popup').hide();
					}
				}
			});
			p3dconfig.map.addInteraction(selectClick);
			selectClick.on('select', function(e) {
				$('#'+conf.target + ' #'+conf.target + '-detail-panel').hide();
				if (e.target.getFeatures().getLength() == 1) {
					if (callback) {
						$("#"+conf.target + "-detail-panel").empty();
						
						if (detailsJson) {
							var field;
							var fields;
							var fieldVal;
							var eleAlreadyAdded = false;
							var classToUse;
							for (var idx in detailsJson) {
								classToUse = "elem-single";
								if (detailsJson[idx].type) {
									// gestione dei diversi tipi
									if ("title" === detailsJson[idx].type) {
										classToUse = "elem-title";
									}
									else if("list" === detailsJson[idx].type && detailsJson[idx].level) {
										
										$("#"+conf.target + "-detail-panel").append($("<div>").attr("class","elem-single bold").text(detailsJson[idx].label));
										
										// deve scorrere la sottolista di elementi
										classToUse = "elem-list";

										fields = detailsJson[idx].field.split(",");
										if (fields.length > 0) {
											$("#"+conf.target + "-detail-panel").append($("<div>").attr("class",classToUse).append($("<table>").attr("id", "table-" + detailsJson[idx].level)));
										
											var subList = e.selected[0].get(detailsJson[idx].level);
											for (var idx1 in subList) {

												$("#table-" + detailsJson[idx].level).append($('<tr>').attr("id", "table-tr-" + idx1));
												for (var i = 0; i < fields.length; i++) {
													field = subList[idx1][fields[i]];
													if(typeof(field) === "boolean"){
													  // variable is a boolean
														fieldVal = (field===true)?"si":"no";
													}
													else {
														fieldVal = field;
													}
													
													// formatta se è un numero
													fieldVal = typeof fieldVal == "number"? numberFormatted(fieldVal) : fieldVal;
													
													$("#table-tr-" + idx1).append($('<td>').text((fieldVal)));
												}
											}
										}
										eleAlreadyAdded = true;
									}
									else {
										alert("Tipo elemento " + detailsJson[idx].type + " non gestito");
									}
								}
								
								if(!eleAlreadyAdded) {
									field = e.selected[0].get(detailsJson[idx].field);
									if(typeof(field) === "boolean"){
										// variable is a boolean
										fieldVal = (field===true)?"si":"no";
									}
									else {
										fieldVal = field;
									}

									// formatta se è un numero
									fieldVal = typeof fieldVal == "number"? numberFormatted(fieldVal) : fieldVal;
									
									$("#"+conf.target + "-detail-panel").append($("<div>").attr("class",classToUse).append($("<span>").attr("class", "bold").text(detailsJson[idx].label)).append($("<span>").text(" " + fieldVal)));	
								}
							}
						}
						else {
							$("#"+conf.target + "-detail-panel").append($("<span>").text(e.selected[0].get('label') ? e.selected[0].get('label') : e.selected[0].get('descrizione')));
						}

						$('#'+conf.target + ' #'+conf.target + '-detail-panel').show();
						callback(e.selected[0]);
					}
				}
			});
		}
	}
	
	var createLegendItem = function(key, tematismo, tematismoId, tematismoLabel, isChecked, callback, multi, divContainerId, legendExist) {
		
		if (conf.debug)
			console.log("createLegendItem");
		
		$("#"+divContainerId).append($("<div>").attr("id", "legend-item_"+key));
		$("#legend-item_"+key).append($("<div>").attr("id","openclose_"+key).attr("style","display:inline"));
		if (multi) {
			$("#legend-item_"+key)
				.append($("<input>")
					.attr("id", "check_"+tematismoId)
					.attr("level", "first")
					.attr("type", "checkbox")
					.attr("class", "p3d-check-tematismo")
					.prop("checked", isChecked));
			$("#check_"+tematismoId).change({"id": tematismoId, "tematismo": tematismo, "map": p3dconfig.map, "div_id": "#legend-item_"+key, "multi": multi, "callback": callback}, switchTheme);
		}
		else {
			$("#legend-item_"+key)
				.append($("<input>")
					.attr("id", "radio_"+tematismoId)
					.attr("name", "radio_tematismi")
					.attr("level", "first")
					.attr("type", "radio")
					.attr("class", "p3d-check-tematismo")
					.prop("checked", false));
			$("#radio_"+tematismoId).change({"id": tematismoId, "tematismo": tematismo, "map": p3dconfig.map, "div_id": "#legend-item_"+key, "multi": multi, "callback": callback}, switchTheme);
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
							"layer_id": tematismoId, 
							"map": p3dconfig.map, 
							"div_id": "#legend-item_"+key, 
							"tematismo": tematismo, 
							"op": "show",
							"multi": multi,
							"callback": callback}, 
							showOrHideAll ))
					.append($("<span>").text(" / "))
						.append($("<a>")
							.prop("disabled", true)
							.attr("id", "hide-all"+tematismoId)
							.attr("class", "disabled")
							.text("Nascondi tutti")
							.click({
									"layer_id": tematismoId, 
									"map": p3dconfig.map, 
									"div_id": "#legend-item_"+key, 
									"tematismo": tematismo, 
									"op": "hide",
									"multi": multi,
									"callback": callback}, 
									showOrHideAll));
		for(var j=0; j< tematismo.values.length; j++){
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
					.prop("checked", typeof tematismo.values[j].checked !== 'undefined' ? tematismo.values[j].checked : isChecked)
					.prop("disabled", true));
			if (tematismo.values[j].color) {
				if(!legendExist) {
					// se non c'è il TAB legenda utilizza gli stili dentro al componente TEMATISMI
					$("#legend-item-value_"+key+"_"+j)
						.append($("<div>")
							.attr("class", "p3d-circle")
							.attr("style", "background: #"+tematismo.values[j].color));
				}
			}
			$("#check_"+key+"_"+j).change({
					"check_id": "#check_"+key+"_"+j, 
					"layer_id": tematismoId, 
					"tematismo": tematismo, 
					"map": p3dconfig.map, 
					"parameters" : tematismo.values[j],
					"multi" : multi,
					"callback" : callback}, 
				changeStyleItemVisibility );
			tematismo.values[j].label = tematismo.values[j].label.replace('@from@', tematismo.values[j].from).replace('@to@', tematismo.values[j].to);
			$("#legend-item-value_"+key+"_"+j)
				.append($("<div>")
					.attr("style", "display: inline-block; width: 200px; padding-left: 5px;").text(tematismo.values[j].label));
		}
		
		//controllo consistenza dei checkbox figli -> semmai aggiorno il padre
		if($("#check_"+tematismoId).is(":checked")){
			$('#show-all'+tematismoId).removeAttr("class","disabled");
			$('#hide-all'+tematismoId).removeAttr("class","disabled");
			
			// lo spengo e lo riaccendo, così si accendono anche i temi in mappa
			$("#check_"+tematismoId).prop("checked",false);
			$("#check_"+tematismoId).click();
		}
	}
	
	var changeStyleItemVisibility = function(event){
		
		if (conf.debug)
			console.log("changeStyleItemVisibility");

		var tematismo = event.data.tematismo;
		if (!event.data.multi) {
			//recupero le feature relative al mio tematismo
			var features = getLayerById(event.data.map, event.data.layer_id).getSource().getFeatures();
			//recupero i parametri che mi servono per tematizzare
			var value = event.data.parameters.value;
			var where = event.data.parameters.where;
			var from = event.data.parameters.from;
			var to = event.data.parameters.to;
			var label = event.data.parameters.label;
			//rimostro lo stile iniziale
			if($(event.data.check_id).is(":checked")){
				for(var i=0; i< features.length; i++) {
					var exactValue = typeof value !== 'undefined' && value == features[i].get('valore_tema');
					var exactWhere = typeof where !== 'undefined' && where == features[i].get('valore_tema');
					var between = typeof from !== 'undefined' && alyssoutils.isNumeric(from) && 
									typeof to !== 'undefined' && alyssoutils.isNumeric(to) && 
									parseFloat(from) <= parseFloat(features[i].get('valore_tema')) 
									&& parseFloat(to) >= parseFloat(features[i].get('valore_tema'));
					if(exactValue || exactWhere || between){
						features[i].setStyle(styleByThemeItems[tematismo.title+label]);
					}
				}
			}
			//nascondo lo stile iniziale
			else{
				for(var i=0; i< features.length; i++) {
					var exactValue = typeof value !== 'undefined' && value == features[i].get('valore_tema');
					var exactWhere = typeof where !== 'undefined' && where == features[i].get('valore_tema');
					var between = typeof from !== 'undefined' && alyssoutils.isNumeric(from) && 
									typeof to !== 'undefined' && alyssoutils.isNumeric(to) &&
									parseFloat(from) <= parseFloat(features[i].get('valore_tema')) 
									&& parseFloat(to) >= parseFloat(features[i].get('valore_tema'));
					if(exactValue || exactWhere || between){
						features[i].setStyle(hiddenStyle[features[i].getGeometry().getType()]);
					}
				}
			}
		}
		else {
			// se spengo l'ultimo figlio, spengo anche il padre
			var item=event.data.check_id;
			var padre=event.data.layer_id;
			if(!$(item).is(":checked")){
				var key=item.substring(7,item.lastIndexOf("_"));
				var target=item.substring(item.lastIndexOf("_")+1);
				var values = typeof cacheTematismo.items === 'undefined' ? cacheTematismo[key].values : cacheTematismo.themes[key].values;
				var attivi=false;
				for(var j=0; j< values.length; j++){
					if($("#check_"+key+"_"+j).is(":checked") && (j!=target)){				
						attivi=true;
						break;
					}
				}
				if(!attivi){
					$("#check_"+padre).prop("checked",false);	
					for(var j=0; j< values.length; j++){
						$("#check_"+key+"_"+j).prop("disabled",true);
					}
					$("#show-all"+padre).prop("class","disabled");
					$("#hide-all"+padre).prop("class","disabled");
				}
			}
			displayJoinedFeatures(cacheTematismo, event.data.callback);
		}
	}
	
	var showOrHideAll = function(event){
		
		if (conf.debug)
			console.log("showOrHideAll");
		
		//recupero i parametri che mi servono
		var div_id = event.data.div_id;
	    if(event.data.op == "show") {
			//seleziono tutte le checkbox relative al mio tema
    		$('input', $(div_id)).each(function() {
    			if($(this)[0].className !== 'p3d-check-tematismo'){
    				$(this).prop("checked", true);
    			}
    		});
	    }
	    else{
	    	//de-seleziono tutte le checkbox relative al mio tema
	    	$('input', $(event.data.div_id)).each(function() {
    			if($(this)[0].className !== 'p3d-check-tematismo'){
    				$(this).prop("checked", false);
    			}
    		});
	    }
		if (!event.data.multi) {
			//recupero le features per il layer che mi interessa
		    var features = getLayerById(event.data.map, event.data.layer_id).getSource().getFeatures();
		    
		    if(event.data.op == "show") {
		    	//recupero lo stile originario per ogni feature
				for(var i=0; i< features.length; i++) {
			    	var feature = features[i];
				    for (var h=0; h<styles[event.data.tematismo.title].length; h++) {
						var styleItem = styles[event.data.tematismo.title][h];
						var exactValue = typeof styleItem.value !== 'undefined' && styleItem.value == feature.get('valore_tema');
						var exactWhere = typeof styleItem.where !== 'undefined' && styleItem.where == feature.get('valore_tema');
						var between = typeof styleItem.from !== 'undefined' && alyssoutils.isNumeric(styleItem.from) && 
										typeof styleItem.to !== 'undefined' && alyssoutils.isNumeric(styleItem.to) &&
										parseFloat(styleItem.from) <= parseFloat(feature.get('valore_tema')) && 
										parseFloat(styleItem.to) >= parseFloat(feature.get('valore_tema'));
						var noRange = (typeof styleItem.from !== 'undefined' && typeof styleItem.to !== 'undefined') &&
										(!alyssoutils.isNumeric(styleItem.from) || !alyssoutils.isNumeric(styleItem.to));
						if (exactValue || exactWhere || between)
							features[i].setStyle(styleByThemeItems[event.data.tematismo.title + styleItem.label]);
						else if (conf.debug && noRange)
							console.log("Attenzione, impossibile caricare il tematismo perchè non in formato numerico. Controllare i range di valori");
					}
		    	}
		    }
		    else{
		    	//nascondo le feature relative al mio tema
		    	for(var i=0; i< features.length; i++) {
			    		features[i].setStyle(hiddenStyle[features[i].getGeometry().getType()]);
		        }
		    }
		}
		else {
			displayJoinedFeatures(cacheTematismo, event.data.callback);
		}
	}
	
	this.loadTematismiAree = function(jsonData, callback) {
		
		if (conf.debug)
			console.log("loadTematismiAree");
		
		var mythis = this;
		if (!ready) {
			setTimeout(function() {
				mythis.loadTematismiAree();
			}, 500);
			return;
		}
		loading(true);

		createDetailPanel();
		createLegendPanel();
		createLayerPopup();
		
		this.processTematismi(callback, jsonData);
		loading(false);
	}
	
	var switchTheme = function(event) {
		
		if (conf.debug)
			console.log("switchTheme");
		
		//abilito/disabilito a seconda del comportamento della checkbox relativa al layer
		$('input[type=checkbox]', $(event.data.div_id)).each(function() {
			if($(this)[0].className !== 'p3d-check-tematismo'){
				$(this).prop("disabled", !$((event.data.multi?"#check_":"#radio_")+event.data.id).is(":checked"));
			}
		});
		//abilito/disabilito il link di selezione multipla sui figli a seconda 
		//del comportamento della checkbox relativa al layer
		if ($((event.data.multi?"#check_":"#radio_")+event.data.id).is(":checked")) {
			$('#'+conf.target + ' #show-all'+event.data.id).removeAttr("class", "disabled");
			$('#'+conf.target + ' #hide-all'+event.data.id).removeAttr("class", "disabled");
			
			var key = event.data.div_id.substring(event.data.div_id.lastIndexOf("_")+1);
			var values = typeof cacheTematismo.items === 'undefined' ? cacheTematismo[key].values : cacheTematismo.themes[key].values;
			var areAllUnChecked = true;
			for (var j=0; j< values.length; j++) {
				if($("#check_"+key+"_"+j).is(":checked")){
					areAllUnChecked=false;
					break;
				}
			}
			if(areAllUnChecked){
				for(var j=0; j< values.length; j++){
					$("#check_"+key+"_"+j).prop("checked", true);
				}
			}
		}
		else{
			$('#'+conf.target + ' #show-all'+event.data.id).attr("class", "disabled");
			$('#'+conf.target + ' #hide-all'+event.data.id).attr("class", "disabled");
		}
		
		if (!event.data.multi) {
			for (var key in event.data.map.getLayers().getArray()) {
				var layer = event.data.map.getLayers().getArray()[key];
				if (layer.get('id').startsWithIgnorCase('tematismo_'))
					layer.setVisible(false);
			}
			getLayerById(event.data.map, event.data.id).setVisible($("#radio_"+event.data.id).is(":checked"));
		}
		else {
			displayJoinedFeatures(cacheTematismo, event.data.callback);
		}
	}
	
	var geometryManager = function(geometry){
		var geoProjected;
		if(geometry.geom)
			geoProjected = p3dconfig.geojson.readGeometry(geometry.geom);
		else
			geoProjected = new ol.geom.Point(ol.proj.transform([geometry.lon, geometry.lat], 'EPSG:4326', p3dconfig.map.getView().getProjection().getCode())); 
		return geoProjected;
	}
	
	this.refreshSelection = function(fidsReloaded){
		
		if (conf.debug)
			console.log("refreshSelection");
		
		p3dconfig.map.removeLayer(vectorLayerSelect);
		this.createSelection(fidsReloaded , layerSelectableId , activeControls, externalSelectFunction);
	}
	
	/**
	 * Funzione che visualizza eventuali feature pre-selzionate provenienti dal chiamante
	 */
	this.createSelection = function(fids, layerId, activeControls, fnc){
		
		if (conf.debug)
			console.log("createSelection");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.createSelection(fids, layerId, activeControls, fnc);
			}, 500);
			return;
		}
		loading(true);
		
		inputObject = fids;
		//recupero la funzione che mi passano dall'esterno
		externalSelectFunction = fnc;
		
		//recupero il layerId che mi passano dall'esterno
		layerSelectableId = layerId;
		
		//recupero i controlli
		activeControls = activeControls;
		
		//aggiungo il layer per la selezione in mappa 
		sourceSelect = new ol.source.Vector();
		
		vectorLayerSelect = new ol.layer.Vector({
			source: sourceSelect,
			style: function(feature){
				return new ol.style.Style({
					fill: new ol.style.Fill({
						color: feature.get('color') ? feature.get('color') : 'rgba(57, 210, 48, 0.6)'
					}),
					stroke: new ol.style.Stroke({
						color: feature.get('color') ? feature.get('color') : 'rgba(57, 210, 48, 0.6)',
						width: 1
					}),
					text: new ol.style.Text({
						text: (feature.get('name')) ? feature.get('name'): "",
								scale: 1.3,
								fill: new ol.style.Fill({
									color: feature.get('color') ? feature.get('color') : 'rgba(57, 210, 48, 0.6)'
								}),
								stroke: new ol.style.Stroke({
									color: '#FFFFFF',
									width: 3.5
								})
					})
				})
			}
		});
		
		p3dconfig.map.addLayer(vectorLayerSelect);
		
		if(activeControls){
			this.addSelectButtons();
		}
		
		var selectableLayerSource = getLayerById(p3dconfig.map, layerSelectableId).getSource();
		var fieldFilter = selectableLayerSource.params_.FIELDFILTER;
		
		var fidsAsStringList = "";
		var labelByFid = {};
		var colorByFid = {};
		if(typeof fids !== 'undefined' && fids != null){
			for(var i=0; i < fids.length; i++){
				fidsAsStringList += " \'" + fids[i][fieldFilter] + "\' " + ",";
				if (fids[i].label || fids[i].RefId) {
					var label = fids[i].label ? fids[i].label + (fids[i].RefId ? "-"+fids[i].RefId : "") : (fids[i].RefId ? fids[i].RefId : "");
					labelByFid[fids[i][fieldFilter]] = label;
				}
				colorByFid[fids[i][fieldFilter]] = fids[i].color;
			}
		
			//tolgo l'ultima virgola
			fidsAsStringList = fidsAsStringList.substring(0, fidsAsStringList.length - 1);
			
			//costruisco la url
			var url = buildWfsCall(selectableLayerSource,  fidsAsStringList);
			
			$.ajax({
				type: "GET",
				url: url,
				async: false,
				success: function(data) {
					if (typeof data.features === 'undefined' || data.features.length == 0) {
						console.log('nessun oggetto disponibile per la selezione '+
								'(è necessario passare un array di JSON ciascuno con catid composto da comune, foglio e mappale, rispettivamente di 4, 4 e 8 caratteri)');
						loading(false);
						return;
					}
					var originalEPSG = data.crs.properties.name.split("EPSG::")[1];
					var features = new ol.format.GeoJSON().readFeatures(data);
					for(var index in features){
						features[index].getGeometry().transform('EPSG:' + originalEPSG, epsg);
						//metto il nome solo se non ce n'è uno dalle feature
						if(features[index].get('name') == null){
							features[index].setProperties({
								'name': labelByFid[features[index].get(fieldFilter)]
							});
						}
						var color = ol.color.asArray(colorByFid[features[index].get(fieldFilter)]);
						color = color.slice();
						color[3] = 0.6;
						features[index].setProperties({
							'color': color
						});
					}
					sourceSelect.addFeatures(features);
					p3dconfig.map.getView().fit(sourceSelect.getExtent(),  p3dconfig.map.getSize());
					loading(false);
				  }
			});
		}
	      
		selectClick = new ol.interaction.Select({
			condition: ol.events.condition.click
		});
		
		var style_modify = function(feature){
			return new ol.style.Style({
		        fill: new ol.style.Fill({
		              color: 'rgba(255, 255, 255, 0.6)'
		            }),
		        stroke: new ol.style.Stroke({
		          color: feature.get('color') ? feature.get('color') : 'rgba(57, 210, 48, 0.6)',
		          width: 1
		        }),
		        text: new ol.style.Text({
		            text: feature.get('name'),
		            scale: 1.3,
		            fill: new ol.style.Fill({
		              color: feature.get('color') ? feature.get('color') : 'rgba(57, 210, 48, 0.6)'
		            }),
		            stroke: new ol.style.Stroke({
		              color: '#FFFFFF',
		              width: 3.5
		            })
		          })
		    	})
	    };
			
        if(!activeControls){
        	p3dconfig.map.addInteraction(selectClick);
			selectClick.on('select', function(e) {
				if (e.target.getFeatures().getLength() == 1) {
					vectorLayerSelect.getSource().getFeatures().forEach(function(feature){
			            feature.setStyle(null);
			            if(feature.get(selectableLayerSource.params_.FIELDFILTER) == e.selected[0].get(selectableLayerSource.params_.FIELDFILTER)){
			            	feature.setStyle(style_modify(feature));
    	    			}
			        });
		            externalSelectFunction(e.selected[0]);
				}
			});
        }

        loading(false);
	}
	
	var buildWfsCall = function(selectableLayerSource, filter){
		
		if (conf.debug)
			console.log("buildWfsCall");
		
		var wfsUrl = selectableLayerSource.urls[0].replace('wms','wfs') + '?service=wfs&version=2.0.0&request=GetFeature&';
		var typeFeature = 'typeNames=' + selectableLayerSource.params_.PREFIX + ':'+ selectableLayerSource.params_.LAYERS;
		var cqlFilter = 'cql_filter=' + selectableLayerSource.params_.FIELDFILTER +' IN ('+ filter + ')';
		var outputFormat = 'outputformat=' + p3dconfig.strApplicationJson;
		
		wfsUrl +=  typeFeature + '&' + cqlFilter + '&' + outputFormat;
		
		return wfsUrl;
	}

	/**
	 * Funzione che aggiunge in mappa il layer per la visualizzazione/creazione di feature gestite lato client
	 */
	this.createVeil = function(fids){
		
		if (conf.debug)
			console.log("createVeil");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.createVeil(fids);
			}, 500);
			return;
		}
		loading(true);
		
		//aggiungo il layer in mappa
		sourceVeil = new ol.source.Vector();

		vectorLayerVeil = new ol.layer.Vector({
			id: vectorLayerVeilId,
			source: sourceVeil,
			style: function(feature){
				return new ol.style.Style({
					fill: new ol.style.Fill({
						color: feature.get('color') ? feature.get('color') : 'rgba(255, 255, 255, 0.6)'
					}),
					stroke: new ol.style.Stroke({
						color: feature.get('color') ? feature.get('color') : '#319FD3',
						width: 1
					}),
					text: new ol.style.Text({
						text: feature.get('name'),
						scale: 1.3,
						fill: new ol.style.Fill({
							color: feature.get('color') ? feature.get('color') :'#319FD3'
						}),
						stroke: new ol.style.Stroke({
							color: '#FFFFFF',
							width: 3.5
						})
					})
				})
			}
		});
	      
		p3dconfig.map.addLayer(vectorLayerVeil);
		
		//creo variabili temporanee per gestire i colori e le etichette da mostrare in pagina
		var geoids = [];
		var labelByGeoid = {};
		var colorBygeoid = {};
		
		if(typeof fids !== 'undefined' && fids.length > 0){
			for(var i=0; i < fids.length; i++){
				geoids.push(fids[i].geoid);
				labelByGeoid[fids[i].geoid] = fids[i].label + '-' + fids[i].RefId;
				colorBygeoid[fids[i].geoid] = fids[i].color;
			}

			//recupero eventuali geometrie passate in input sulla base del geoid
			var response = $.ajax({
				type: "GET",
				url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/read",
				async: false,
				data: {filter: JSON.stringify(geoids)},
				dataType: "json"
			}).responseText;

			//aggiungo le feature al layer in mappa
			var featuresDrawn = new ol.format.GeoJSON().readFeatures(response);
			for(var index in featuresDrawn){
				//setto il colore e la trasparenza
				var color = ol.color.asArray(colorBygeoid[featuresDrawn[index].get('geoid')]);
				color = color.slice();
				color[3] = 0.6;
				featuresDrawn[index].setProperties({
					'name': labelByGeoid[featuresDrawn[index].get('geoid')],
					'color': color
				});
			}
			getLayerById(p3dconfig.map, vectorLayerVeilId).getSource().addFeatures(featuresDrawn);
		}

		loading(false);
	}
	
	/**
	 * Funzione che attiva in mappa il controllo per la selezione sul layer veil
	 */
	
	this.activateVeilSelect = function(externalDrawFunction) {
		
		if (conf.debug)
			console.log("activateVeilSelect");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.activateVeilSelect(externalDrawFunction);
			}, 500);
			return;
		}
		
		selectClick = new ol.interaction.Select({
			condition: ol.events.condition.click
		});
		
		p3dconfig.map.addInteraction(selectClick);
		selectClick.on('select', function(e) {
			if (e.target.getFeatures().getLength() == 1) {
				externalDrawFunction(e.selected[0]);
			}
		});
		
	}
	
	/**
	 * Funzione che predispone una serie di bottoni per le funzionalità
	 * di inizio - termina - elimina - annulla
	 */
	this.displayControlsVeilDraw = function(callbackOnEnd){
		
		if (conf.debug)
			console.log("displayControlsVeilDraw");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.displayControlsVeilDraw(callbackOnEnd);
			}, 500);
			return;
		}
		
		if ($('#'+conf.target + ' #'+conf.target + '-draw-switcher').length == 0) {
			$('#'+conf.target + ' .ol-viewport .ol-overlaycontainer-stopevent').append(
				$('<div>')
					.attr('class','p3d-draw-switcher btn-group switcher')
					.attr('id', conf.target + '-draw-switcher'));
		}

		$('#'+conf.target + ' #'+conf.target + '-draw-switcher').append(
				$('<button>')
					.attr('id','start-draw')
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text('Inizia')));
		$('#'+conf.target + ' #'+conf.target + '-draw-switcher').append(
				$('<button>')
					.attr('id','end-draw')
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text('Termina')));
		$('#'+conf.target + ' #'+conf.target + '-draw-switcher').append(
				$('<button>')
					.attr('id','delete-draw')
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text('Elimina')));
		$('#'+conf.target + ' #'+conf.target + '-draw-switcher').append(
				$('<button>')
					.attr('id','clear-draw')
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text('Annulla')));
		
		//aggiungo gli eventi ai bottoni del disegno
		$('#'+conf.target + ' #start-draw').click(this.activateVeilDraw);
		$('#'+conf.target + ' #end-draw').click({callback: callbackOnEnd}, this.persistVeilDraw);
		$('#'+conf.target + ' #delete-draw').click(this.deleteVeilDraw);
		$('#'+conf.target + ' #clear-draw').click({target: this}, this.deactivateVeilDraw);
	}
	
	/**
	 * Funzione che aggiunge in mappa un pulsante e una funzione su di esso passata dall'esterno
	 */
	this.displayButton = function(item, callback){
		
		if (conf.debug)
			console.log("displayButton");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.displayButton(item, callback);
			}, 500);
			return;
		}
		
		if ($('#'+conf.target + ' #'+conf.target + '-draw-switcher').length == 0) {
			$('#'+conf.target + ' .ol-viewport .ol-overlaycontainer-stopevent').append(
					$('<div>')
						.attr('class','p3d-draw-switcher btn-group switcher')
						.attr('id', conf.target + '-draw-switcher'));
		}

		$('#'+conf.target + ' #'+conf.target + '-draw-switcher').append(
				$('<button>')
					.attr('id',item.id)
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text(item.text)));
		
		//aggiungo gli eventi ai bottoni del disegno
		$('#'+conf.target + ' #'+item.id).click({callback: item.callback}, callback);
	}

	/**
	 * Funzione che gestisce l'evento attivazione della modalità disegno
	 */
	
	this.activateVeilDraw = function(event) {
		
		if (conf.debug)
			console.log("activateVeilDraw");
		
		p3dconfig.map.removeInteraction(draw);
		p3dconfig.map.removeInteraction(cleanDraw);
		draw = new ol.interaction.Draw({
			source: getLayerById(p3dconfig.map, vectorLayerVeilId).getSource(),
			type: 'Polygon'
		});
		p3dconfig.map.addInteraction(draw);
	}
	
	/**
	 * Funzione che controlla se mi arriva un click o una funzione
	 */
	var retrieveCallbackFunction = function(input){
		
		if (conf.debug)
			console.log("retrieveCallbackFunction");
		
		if(input.type == 'click'){
			return input.data.callback
		}
		else{
			return input;
		}
	}
	
	/**
	 * Funzione che salva le feature create lato client ed esegue una callback passata dall'esterno
	 */
	
	this.persistVeilDraw = function(event){
		
		if (conf.debug)
			console.log("persistVeilDraw");
		
		loading(true);
		
		var features = getLayerById(p3dconfig.map, vectorLayerVeilId).getSource().getFeatures();
		var jsonOriginal = p3dconfig.geojson.writeFeatures(features);
		
		//ripulisco il json dalle properties aggiunte in sola visualizzazione
		var obj = JSON.parse(jsonOriginal);
		for(var x=0; x< obj.features.length; x++){
			if(obj.features[x].properties){
				delete obj.features[x].properties['name'];
				delete obj.features[x].properties['color'];
			}
		}
		var json = JSON.stringify(obj);
		json = json.replaceAll("\"properties\":null", "\"properties\":{\"geoid\":-1}"); // serve passare l'attributo altrimenti si incacchia nell'inserimento in postgis
		
		//scrivo su database
		var abortedCall = false;
		var res = $.ajax({
			type: "GET",
			url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/write",
			async: false,
			data: {geoms: json},
			dataType: "json",
	        contentType: "application/x-www-form-urlencoded",
	        beforeSend: function (xhr) {
	        	if((this.url).length > p3dconfig.requestMaxLength){
	        		xhr.abort();
	        		abortedCall = true;
	        		console.log('Richiesta in GET a '+ alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/write" +' troppo lunga, passo in POST');
	                return false
	            }
	          }
		}).responseText;
		
		if(abortedCall){
			res = $.ajax({
				type: "POST",
				url: alyssoutils.getServerUrl(conf.protocol, conf.server, conf.webapp)+"/write",
				async: false,
				data: {geoms: json},
				dataType: "json",
		        contentType: "application/x-www-form-urlencoded"
			}).responseText;
		}

		//elimino i controlli per il disegno
		p3dconfig.map.removeInteraction(draw);
		p3dconfig.map.removeInteraction(cleanDraw);
	    
		var callabackFunction = retrieveCallbackFunction(event);
		callabackFunction(res);
		
	    loading(false);
	}
	
	/**
	 * Funzione che consente di eliminare la geometria selezionata
	 */
	this.deleteVeilDraw = function(event){
		
		if (conf.debug)
			console.log("deleteVeilDraw");
		
		p3dconfig.map.removeInteraction(draw);
		
		cleanDraw = new ol.interaction.Select({
			condition: ol.events.condition.click
		});
		
		p3dconfig.map.addInteraction(cleanDraw);
		cleanDraw.on('select', function(e) {
			if (e.target.getFeatures().getLength() == 1) {
				getLayerById(p3dconfig.map, vectorLayerVeilId).getSource().removeFeature(e.target.getFeatures().array_[0]);
			}
		});
		
	}
	
	/**
	 * Funzione che ripulisce il layer utilizzato per il disegno e disattiva la modalità disegno
	 */
	this.deactivateVeilDraw = function(event){
		
		if (conf.debug)
			console.log("deactivateVeilDraw");
		
		p3dconfig.map.removeInteraction(draw);
		p3dconfig.map.removeInteraction(cleanDraw);
		getLayerById(p3dconfig.map, vectorLayerVeilId).getSource().clear();
		//elimino tutti i pulsanti tranne quello per l'attivazione
		/*if($('#'+conf.target + ' #'+conf.target + '-draw-switcher').length !== 0){
			$('#'+conf.target + ' #'+conf.target + '-draw-switcher').children().each(function(index){
			    if(index > 0){
			    	$(this).remove();
			    }
			});
		}*/
		
		clearAllInteractions();
	}
	
	/**
	 * Funzione che aggiunge in mappa i pulsanti per le modalità di selezione
	 * su layer da geoserver
	 */
	this.addSelectButtons = function(){
		
		if (conf.debug)
			console.log("addSelectButtons");
		
		$('#'+conf.target + ' #'+conf.target + '-layer-switcher').append(
				$('<div>')
					.attr('class','btn-group switcher')
					.attr('id', conf.target + '-sel-switcher')
					.attr('style','float: right; padding-left: 40px;'));
		
		$('#'+conf.target + ' #'+conf.target + '-sel-switcher').append(
				$('<button>')
					.attr('id','start-selection')
					.attr('value', 'Attiva')
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text('Seleziona')));
		
		$('#'+conf.target + ' #'+conf.target + '-sel-switcher').append(
				$('<button>')
					.attr('id','end-selection')
					.attr('value', 'Disattiva')
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text('Termina')));

		$('#'+conf.target + ' #'+conf.target + '-sel-switcher').append(
				$('<button>')
					.attr('id','clear-selection')
					.attr('value', 'Disattiva')
					.attr('type','button')
					.attr('class','btn btn-default')
					.append($('<span>').text('Annulla')));
		
		//aggiungo gli eventi ai bottoni del click
		$('#'+conf.target + ' #start-selection').click({layerSelectableId: layerSelectableId, target: this}, this.addLayerSelection);
		$('#'+conf.target + ' #end-selection').click({layerSelectableId: layerSelectableId, callback: externalSelectFunction}, this.removeLayerSelection);
		$('#'+conf.target + ' #clear-selection').click({}, this.clearLayerSelection);
	}
	
	/**
	 * Funzione che gestisce l'evento di selezione in mappa
	 */
	this.addLayerSelection = function(event){
		
		if (conf.debug)
			console.log("addLayerSelection");
		
		event.data.target.activateClick(function(evt) {
			loading(true);
			loading(true); // ne metto uno in più che verrà spento dalla chiamata ajax
			var sourceBaseLayer = getLayerById(p3dconfig.map, event.data.layerSelectableId).getSource();
	        var url = sourceBaseLayer.getGetFeatureInfoUrl(
	            evt.coordinate, view.getResolution(), epsg,
	            {'INFO_FORMAT': 'application/json'});
	        if (url) {
	        	//in caso di utilizzo del proxy
	        	//url = url.replace(sourceBaseLayer.urls[0], sourceBaseLayer.params_.URLPROXY + p3dconfig.wmsService);
	        	$.ajax({
	        		url: url,
	        		type: "GET"
	        	}).done(function(response) {
	    	    	var format = new ol.format.GeoJSON();
	    	        var features = format.readFeatures(response);
	    	        
	    	        //TODO e se arriva in maniera diversa, dove trovo l'EPSG originale??
	    	        //si deve mettere un formato sul geoserver??
	    	        var originalWmsEPSG = response.crs.properties.name.split("EPSG::")[1];
	    	        
	    	        //riproietto la geometria
	    	        features[0].getGeometry().transform('EPSG:' + originalWmsEPSG, epsg);
	    	        if(!evt.originalEvent.ctrlKey){
	    	        	//recupero le altre feature che hanno il mio stesso catid
	    	        	var urlwfs = buildWfsCall(sourceBaseLayer, "\'"+features[0].get(sourceBaseLayer.params_.FIELDFILTER)+"\'");
	    	        	
	    	        	$.ajax({
	    	    			type: "GET",
	    	    			url: urlwfs,
	    	    			async: false,
	    	    			success: function(data) {
	    	    				var otherFeatures = new ol.format.GeoJSON().readFeatures(data);
	    	    				//TODO lo recupero un'altra volta perchè potrebbe essere diverso
	    	    				var originalWfsEPSG = data.crs.properties.name.split("EPSG::")[1];
	    	    				otherFeatures.forEach(function(value) {
	    	    					value.getGeometry().transform('EPSG:' + originalWfsEPSG, epsg);
	    	    	    		});
		    					if(otherFeatures.length !== 0){
		    						sourceSelect.addFeatures(otherFeatures);
		    					}
		    					else{
		    						sourceSelect.addFeatures(features);
		    					}
		    					loading(false);
	    	    			  }
	    	    		});
	    	        }
	    	        else{
	    				loading(false);
	    	        	var featuresOn = vectorLayerSelect.getSource().getFeatures();
	    	    		featuresOn.forEach(function(value) {
	    	    			if(value.get(sourceBaseLayer.params_.FIELDFILTER) == features[0].get(sourceBaseLayer.params_.FIELDFILTER)){
	    	    				sourceSelect.removeFeature(value);
	    	    			}
	    	    		});
	    	        }
	        	});
	        }
	        loading(false);
      });
	}
	
	/**
	 * Funzione che interroga cosa sta sotto il click
	 */
	this.getFeatureInfo = function(layer, point, callback){
		
		if (conf.debug)
			console.log("getFeatureInfo");
		
		if (!ready) {
			setTimeout(function() {
				getFeatureInfo(layer, point);
			}, 500);
			return;
		}
		loading(true);
		
		var sourceBaseLayer = layer.getSource();
        var url = sourceBaseLayer.getGetFeatureInfoUrl(point, view.getResolution(), epsg,
            {'INFO_FORMAT': 'application/json'});
        if (url) {
        	//in caso di utilizzo del proxy
        	//url = url.replace(sourceBaseLayer.urls[0], sourceBaseLayer.params_.URLPROXY + p3dconfig.wmsService);
        	$.ajax({
        		url: url,
        		type: "GET"
        	}).done(function(response) {
    	    	var format = new ol.format.GeoJSON();
    	        callback(format.readFeatures(response));
        	});
        }
        loading(false);
	}
	
	/**
	 * Funzione che fa cose con gli oggetti selezionati sul layer
	 */
	this.removeLayerSelection = function(event){
		
		if (conf.debug)
			console.log("removeLayerSelection");
		
		var features = vectorLayerSelect.getSource().getFeatures();
		var selectableLayerSource = getLayerById(p3dconfig.map, event.data.layerSelectableId).getSource();
		var fieldFilter = selectableLayerSource.params_.FIELDFILTER;
		
		var result = [];

		features.forEach(function(value) {
			var obj = {};
			var alreadyAdded = false;
			obj[fieldFilter] = value.get(fieldFilter);
			obj["type"] = event.data.layerSelectableId;

			for(var res in result){
				if(result[res][fieldFilter] == obj[fieldFilter]){
					alreadyAdded = true;
					break;
				}
			}

			if(!alreadyAdded){
				result.push(obj);
			}
		});
		
		if(onClick){
			p3dconfig.map.unByKey(onClick);
		}
	    
	    event.data.callback(JSON.stringify(result));
	}
	
	/**
	 * Funzione che gestisce la rimozione dell'evento di selezione in mappa
	 */
	
	this.clearLayerSelection = function(event){
		
		if (conf.debug)
			console.log("clearLayerSelection");
		
		if(onClick){
			p3dconfig.map.unByKey(onClick);
		}
		vectorLayerSelect.getSource().clear();
	}
	
	/**
	 * carica un file KML e lo aggiunge alla mappa
	 * @param {Object} data dati in formato json rappresentanti i markers
	*/
	this.loadKml = function(url) {
		
		if (conf.debug)
			console.log("loadKml");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.loadKml(url);
			}, 500);
			return;
		}
		var vector = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: url,
				format: new ol.format.KML()
			})
		});
		p3dconfig.map.addLayer(vector);
	}
	
	/**TODO funzione per la visualizzazione superficie concava
	*/
	var processGeom = function(geomJson){
		
		if (conf.debug)
			console.log("processGeom");
		
		if (!ready) {
			setTimeout(function() {
				processGeom(geomJson);
			}, 500);
			return;
		}
		loading(true);
		
		var featuresGeo = new Array();
		var geometryGeo = p3dconfig.geojson.readGeometry(geomJson , {
	        dataProjection: 'EPSG:4326',
	        featureProjection: 'EPSG:3857'
	      });
//		geometryGeo.transform('EPSG:4326', 'EPSG:3857');
		var featureGeo = new ol.Feature({
			geometry: geometryGeo
		});
		featuresGeo.push(featureGeo);
		var vectorSourceToDisplay = new ol.source.Vector({
			features: featuresGeo
		});
		var vectorLayerToDisplay = new ol.layer.Vector({
			source: vectorSourceToDisplay,
			style: [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 204, 153, 1)',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 204, 153, 0.5)'
                })
            })]
		});
		p3dconfig.map.addLayer(vectorLayerToDisplay);

		loading(false);
	}
	
	/**
	 * consente lo zoom ad un certo extent della mappa
	 * @param {Double} minX
	 * @param {Double} minY
	 * @param {Double} maxX
	 * @param {Double} maxY
	*/
	this.zoomToExtent = function(minX, minY, maxX, maxY){
		
		if (conf.debug)
			console.log("zoomToExtent");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.zoomToExtent(minX, minY, maxX, maxY);
			}, 500);
			return;
		}
		loading(true);
		
		//costruisco la geometria rettangolare
		var bottomLeft = [minX,minY];
		var topRight = [maxX,maxY];
		//faccio lo zoom verso l'extent
		var ext = ol.extent.boundingExtent([bottomLeft,topRight]);
		p3dconfig.map.getView().fit(ext,p3dconfig.map.getSize());
		
		loading(false);
	}
	
	/**
	 * consente lo zoom con centro e livello di zoom fissato
	 * @param {Double} centerX
	 * @param {Double} centerY
	 * @param {Double} zoomLevel
	*/
	this.zoomToCenter = function(centerX, centerY, zoomLevel){
		
		if (conf.debug)
			console.log("zoomToCenter");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.zoomToCenter(centerX, centerY, zoomLevel);
			}, 500);
			return;
		}
		loading(true);
		
		var center = [centerX, centerY];
		p3dconfig.map.getView().setCenter(center);
		p3dconfig.map.getView().setZoom(zoomLevel);

		loading(false);
	}
	
	/**
	 * consente lo zoom su latlon e livello di zoom fissato
	 * @param {Double} lat
	 * @param {Double} lon
	 * @param {Double} zoomLevel
	*/
	this.zoomToLatLon = function(lat, lon, zoomLevel){
		
		if (conf.debug)
			console.log("zoomToLatLon");
		
		var point = geometryManager({
			"lon" : lon,
			"lat" : lat
		});
		
		this.zoomToCenter(point.getCoordinates()[0], point.getCoordinates()[1], zoomLevel);
	}
	
	/**
	 * consente l'attivazione della selezione rettangolare
	 * @param {Function} funzione di callback, a cui arriva come parametro un array di markers
	*/
	this.activateRectangularSelection = function(callback){
		
		if (conf.debug)
			console.log("activateRectangularSelection");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.activateRectangularSelection(callback);
			}, 500);
			return;
		}
		
		if (typeof(boxControl) === 'undefined') {
			boxControl = new ol.interaction.DragBox({
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: [250, 25, 25, 1]
					})
				})
			});
		}
		
		p3dconfig.map.addInteraction(boxControl);
		boxControl.on('boxend', function(){
			var featureResults = [];
			var extent = this.getGeometry().getExtent();
			markerLayer.getSource().forEachFeatureIntersectingExtent(extent, function(feature) {
				featureResults.push(feature);
			});
			//costruisco l'array di markers a partire dalle features
			var idMarkersToReturn = new Set();
			for(var featureKey in featureResults){
				idMarkersToReturn.add(featureResults[featureKey].getId());
			}
			
			var markerFeatures = new Array();
			existentMarkers.forEach(function(value) {
				if(idMarkersToReturn.has(value.id)){
					markerFeatures.push(value);
				}
			});
			//invoco la vera funzione di callback
			callback(markerFeatures);
		});
	}
	
	/**
	 * consente la disattivazione della selezione rettangolare
	*/
	this.disactivateRectangularSelection = function(){
		
		if (conf.debug)
			console.log("disactivateRectangularSelection");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.disactivateRectangularSelection();
			}, 500);
			return;
		}
		if (boxControl) {
			p3dconfig.map.removeInteraction(boxControl);
		}
	}
	
	
	/**
	 * attiva l'attivazione del click in mappa
	 * @param {Function} funzione di callback, a cui arrivano come parametro le coordinate
	 */
	this.activateClick = function(coordinateCallback){
		
		if (conf.debug)
			console.log("activateClick");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.activateClick(coordinateCallback);
			}, 500);
			return;
		}
		onClick = p3dconfig.map.on('singleclick', function(evt) {
			coordinateCallback(evt);
		});
	}
	
	/**
	 * disattiva il click in mappa
	 */
	this.deactivateClick = function(){
		
		if (conf.debug)
			console.log("deactivateClick");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.deactivateClick();
			}, 500);
			return;
		}
		if(onClick){
			p3dconfig.map.unByKey(onClick);
		}
	}
	
	/**
	 * consente di identificare i markers data una geometria in input
	 * @param {ol.Extent} geometria entro cui cercare i markers
	 * @returns {Array} array di markers identificati
	*/
	this.identifyMarkers = function(extent){
		
		if (conf.debug)
			console.log("identifyMarkers");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.identifyMarkers(extent);
			}, 500);
			return;
		}
		var result = [];
		markerLayer.getSource().forEachFeatureIntersectingExtent(extent, function(feature) {
			result.push(feature);
		});
		return result;
	}
	
	/**
	 * rimuovo i marker che sono presenti in mappa
	 * @param {Object} marker da rimuovere
	*/
	this.removeMarkers = function(data){
		
		if (conf.debug)
			console.log("removeMarkers");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.removeMarkers(data);
			}, 500);
			return;
		}
		for (var markerKey in data){
			var markerToBeDeleted = data[markerKey];
			
			//rimuovo i marker dall'insieme che contiene i markers presenti in mappa
			if(existentMarkers.has(markerToBeDeleted)){
				existentMarkers.delete(markerToBeDeleted);
			}
			
			//rimuovo la feature dal source del layer
			var featureToRemove = markerLayer.getSource().getFeatureById(markerToBeDeleted.id);
			if(featureToRemove && featureToRemove !== null){
				markerLayer.getSource().removeFeature(featureToRemove);
			}
		}
	}
	
	/**
	 * carico i marker e li aggiungo in mappa
	 * @param {Object} data dati in formato json rappresentanti i markers
	*/
	this.addMarkers = function(data) {
		
		if (conf.debug)
			console.log("addMarkers");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.addMarkers(data);
			}, 500);
			return;
		}
		if (data.length == 0) {
			alert("Nessun marker disponibile");
			$.unblockUI();
			return;
		}

		//insieme che contiene l'insieme dei markers generali
		if (typeof(existentMarkers) === 'undefined')
			existentMarkers = new Set();
		//layer per l'evidenziazione dei markers
		if (typeof(markerSource) === 'undefined')
			markerSource = new ol.source.Vector();
		if (typeof(markerLayer) === 'undefined') {
			markerLayer= new ol.layer.Vector({
				source: markerSource
			});
			p3dconfig.map.addLayer(markerLayer);
		}
		
		var markerFeatures = new Array();
		//scorro il Json Array per costruire le feature
		for (var markerKey in data){
			var marker = data[markerKey];
			
			//TODO poi gestire il caso in cui mi arrivino più cose con lo stesso id
			//aggiungo all'insieme che memorizza i markers presenti in mappa
			existentMarkers.add(marker);
			
			var markerFeature = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.transform([marker.lon, marker.lat], 'EPSG:4326', p3dconfig.map.getView().getProjection().getCode()))
			});
			//id mi serve per distinguerle poi
			markerFeature.setId(marker.id);
			
			//interpreto il colore del marker
			var red = parseInt(marker.color.substr(0,2),16);
			var green = parseInt(marker.color.substr(2,2),16);
			var blue = parseInt(marker.color.substr(4,2),16);
			var color = [red, green, blue];
			
			//costruisco lo stile a seconda degli attributi del marker
			var stroke = new ol.style.Stroke({color: 'black', width: 2});
			var fill = new ol.style.Fill({color: color});
			var iconStyle = new ol.style.Style({
				image: new ol.style.RegularShape({
					fill: fill,
					stroke : stroke,
					points: 3,
					radius: marker.size,
		            rotation: Math.PI / 4,
		            angle: 0
				})
			})
			markerFeature.setStyle(iconStyle);
			markerFeatures.push(markerFeature);
		}
		
		markerLayer.getSource().addFeatures(markerFeatures);
	}
	
	/**
	 * Funzione che aggiunge un layer
	 */
	this.addLayer = function(layer) {
		
		if (conf.debug)
			console.log("addLayer");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.addLayer(layer);
			}, 500);
			return;
		}
		p3dconfig.map.addLayer(layer);
	}
	
	/**
	 * Funzione che rimuove un layer
	 */
	this.removeLayer = function(layer) {
		
		if (conf.debug)
			console.log("removeLayer");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.removeLayer(layer);
			}, 500);
			return;
		}
		p3dconfig.map.removeLayer(layer);
	}
	
	/**
	 * Funzione che ottiene un layer data la chiave
	 */
	this.getLayer = function(key) {
		
		if (conf.debug)
			console.log("getLayer");
		
		if (!ready) {
			var mythis = this;
			setTimeout(function() {
				mythis.getLayer(key);
			}, 500);
			return;
		}
		return getLayerById(p3dconfig.map, key);
	};
	
	/**
	 * Funzione che aggiorna le dimensioni della mappa
	 */
	this.updateSize = function() {
		
		if (conf.debug)
			console.log("updateSize");
		
		p3dconfig.map.updateSize();
	}
	
	/**
	 * Funzione che disattiva tutti i controlli in mappa
	 */
	var clearAllInteractions = function(){
		
		if (conf.debug)
			console.log("clearAllInteractions");
		
		var target = undefined;
		if(event){
			target = event.target;
		}
		else{
			target = this;
		}
		if (selectClick) {
			p3dconfig.map.removeInteraction(selectClick);
		}
		if (selectPointerMove) {
			p3dconfig.map.removeInteraction(selectPointerMove);
		}
		if (draw) {
			p3dconfig.map.removeInteraction(draw);
		}
		if (cleanDraw) {
			p3dconfig.map.removeInteraction(cleanDraw);
		}
		if (boxControl) {
			p3dconfig.map.removeInteraction(boxControl);
		}
		if(onClick){
			p3dconfig.map.unByKey(onClick);
		}
	}
	
	// TODO cancellare
	var andorSource = undefined;
	
	var displayJoinedFeatures = function(data, callback) {
	
		if (conf.debug)
			console.log("displayJoinedFeatures");
		
		var switchMeOns = new Array();
		$('#legend-items-container input:checked').each(function() {
		    if ($(this).attr('disabled') !== 'disabled') {
			    switchMeOns.push($(this));
			}
		});
		
		var tematismoRiferimento = null;
		var ands = new Set();
		var ors = undefined;
		for (var key1 in switchMeOns) {
			var switchMeOn = switchMeOns[key1];
			var level = switchMeOn.attr('level');
			if (level == 'first') {
				if (ors) {
					// se ho un set di OR, li aggiungo
					ands.add(ors);
				}
				ors = new Set();
			}
			else if (level == 'second') {
				// TODO ottimizzare
				if (typeof data.items === 'undefined') {
					// vecchia struttura, il JSON è un array di coppie tema-oggetti
					for (var key2 in data) {
						var tematismo = data[key2];
						var items = tematismo.items;
						var values = tematismo.values;
						var title = "tematismo_"+tematismo.title.alyLatinize().replaceAll(" ","-").replaceAll(" ","-")
								.replaceAll("&nbsp;","y").replaceAll(".","").replaceAll(":","");
						if (title == switchMeOn.attr('parent')) {
							var candidates = items.map(function(a) {
								var theme = values[switchMeOn.attr('index')];
								var exactValue = typeof theme.value !== 'undefined' && theme.value == a.valore_tema;
								var exactWhere = typeof theme.where !== 'undefined' && theme.where == a.valore_tema;
								var between = typeof theme.from !== 'undefined' && alyssoutils.isNumeric(theme.from) && 
												typeof theme.to !== 'undefined' && alyssoutils.isNumeric(theme.to) &&
												parseFloat(theme.from) <= parseFloat(a.valore_tema) && 
												parseFloat(theme.to) >= parseFloat(a.valore_tema);
								var noRange = (typeof theme.from !== 'undefined' && typeof theme.to !== 'undefined') &&
												(!alyssoutils.isNumeric(theme.from) || !alyssoutils.isNumeric(theme.to));
								if (exactValue || exactWhere || between)
									return a.assetid;
								else if (conf.debug && noRange)
									console.log("Attenzione, impossibile caricare il tematismo perchè non in formato numerico. Controllare i range di valori");
								return null;
							});
							for (var key3 in candidates) {
								if (candidates[key3] !== null && !ors.has(candidates[key3]))
									ors.add(candidates[key3]);
							}
						}
					}
				}
				else {
					// nuova struttura, il JSON contiene un array di temi ed uno di oggetti
					for (var key2 in data.themes) {
						var tematismo = data.themes[key2];
						var items = data.items;
						var values = tematismo.values;
						var title = "tematismo_"+tematismo.title.alyLatinize().replaceAll(" ","-").replaceAll(" ","-")
								.replaceAll("&nbsp;","y").replaceAll(".","").replaceAll(":","");
						if (title == switchMeOn.attr('parent')) {
							var candidates = items.map(function(a) {
								var theme = values[switchMeOn.attr('index')];
								var value = new Array();
								var field = tematismo.field;
								if (field.indexOf('.') == -1) {
									value.push(a[field]);
								}
								else {
									var dotIndex = field.indexOf('.');
									var children = a[field.substr(0, dotIndex)];
									for (var childIndex in children) {
										value.push(children[childIndex][field.substr(dotIndex+1, field.length)]);
									}
								}
								
								for (var valueItemIndex in value) {
									var valueItem = value[valueItemIndex];
									var exactValue = typeof valueItem !== 'undefined' && valueItem == theme.value;
									var exactWhere = typeof valueItem !== 'undefined' && valueItem == theme.where;
									var between = typeof theme.from !== 'undefined' && alyssoutils.isNumeric(theme.from) && 
													typeof theme.to !== 'undefined' && alyssoutils.isNumeric(theme.to) &&
													parseFloat(theme.from) <= parseFloat(valueItem) && 
													parseFloat(theme.to) >= parseFloat(valueItem);
									var noRange = (typeof theme.from !== 'undefined' && typeof theme.to !== 'undefined') &&
													(!alyssoutils.isNumeric(theme.from) || !alyssoutils.isNumeric(theme.to));
									if (exactValue || exactWhere || between)
										return a.assetid;
									else if (conf.debug && noRange)
										console.log("Attenzione, impossibile caricare il tematismo perchè non in formato numerico. Controllare i range di valori");
								}
								return null;
							});
							for (var key3 in candidates) {
								if (candidates[key3] !== null && !ors.has(candidates[key3]))
									ors.add(candidates[key3]);
							}
						}
					}	
				}
			}
		}
		if (ors) {
			// se ho l'ultimo set di OR, li aggiungo
			ands.add(ors);
		}
		
		// metto in and i vari set 
		var res = null;
		for (var it = ands.values(), item = null; item = it.next().value;) {
			if (item !== null && item.size > 0) {
				if (res == null) {
					res = item;
				}
				else {
					res = res.intersection(item);
				}
			}
		}
		
		// svuoto il layer, se c'era qualcosa
		if (andorSource)
			andorSource.clear();
		
		var items = null;
		if (typeof data.items === 'undefined') {
			// vecchia struttura, il JSON è un array di coppie tema-oggetti
			// cerco il tematismo con il maggior numero di punti
			var numItems = {
					value: -1,
					index: -1
			};
			for (var key in data) {
				if (numItems.value == -1) {
					numItems.value = data[key].items.length;
					numItems.index = key;
				}
				else {
					if (numItems < data[key].items.length) {
						numItems.value = data[key].items.length;
						numItems.index = key;
					}
				}
			}
			items = data[numItems.index].items;
		}
		else {
			// nuova struttura, il JSON contiene un array di temi ed uno di oggetti
			items = data.items; 
		}
		
		// metto in mappa, se c'è qualcosa
		if (res !== null) {
			var features = new Array();
			for (var key in items) {
				var item = items[key];
				if (!res.has(item.assetid)) {
					continue;
				}
				item.geometry = geometryManager(item);
				features.push(new ol.Feature(item));
			}

			andorSource = new ol.source.Vector({
				features: features
			});

			p3dconfig.map.addLayer(new ol.layer.Vector({
				id: 'andor',
				source: andorSource,
				style: function (feature) {
					var color = feature.get('color');
					return color ? new ol.style.Style ({
						image: new ol.style.Circle({
							radius: 5,
							stroke: new ol.style.Stroke({
								color: 'rgba(10, 10, 10, 1)',
								width: 1
							}),
							fill: new ol.style.Fill({
								color: color.indexOf("#") == 0 ? color : "#"+color
							})
						})
					}) : new ol.style.Style ({
						image: new ol.style.Circle({
							radius: 5,
							stroke: new ol.style.Stroke({
								color: 'rgba(10, 10, 10, 1)',
								width: 1
							}),
							fill: new ol.style.Fill({
								color: 'rgba(0, 204, 153, 0.5)'
							})
						})
					})
				}
			}));
		}
	};
	
	var getFeaturesByTematismo = function(items, tematismo) {
		
		if (conf.debug)
			console.log("getFeaturesByTematismo");
		
		var features = new Array();
		var elements = items;
		for(var j=0; j<elements.length; j++){
			elements[j].geometry = geometryManager(elements[j]);
			elements[j].tematismo = tematismo.title;
			
			for (var i=0; i<tematismo.values.length; i++) {
				var styleItem = tematismo.values[i];
				var exactValue = typeof styleItem.value !== 'undefined' && styleItem.value == elements[j][tematismo.field];
				var exactWhere = typeof styleItem.where !== 'undefined' && styleItem.where == elements[j][tematismo.field];
				var between = typeof styleItem.from !== 'undefined' && alyssoutils.isNumeric(styleItem.from) && 
								typeof styleItem.to !== 'undefined' && alyssoutils.isNumeric(styleItem.to) &&
								parseFloat(styleItem.from) <= parseFloat(elements[j][tematismo.field]) && 
								parseFloat(styleItem.to) >= parseFloat(elements[j][tematismo.field]);
				var noRange = typeof styleItem.from !== 'undefined' && typeof styleItem.to !== 'undefined' &&
								(!alyssoutils.isNumeric(styleItem.from) || !alyssoutils.isNumeric(styleItem.to));
				if (styleItem.color && (exactValue || exactWhere || between)) {
					elements[j].color = styleItem.color;
					break;
				}
				else if (conf.debug && noRange)
					console.log("Attenzione, impossibile caricare il tematismo perchè non in formato numerico. Controllare i range di valori");
			}
			
			var feature = new ol.Feature(elements[j]);
			features.push(feature);
			
			// se non l'ho già fatto, metto via lo stile che si applicherebbe alla feature
			for (var i=0; i<styles[feature.get('tematismo')].length; i++) {
				var styleItem = styles[feature.get('tematismo')][i];
				if (typeof styleByThemeItems[feature.get('tematismo') + styleItem.label] === 'undefined'
						&& typeof styleItem.color !== 'undefined') {
					var style;
					if (styleItem.color == null)
						styleItem.color = "444444"; // colore default
					var sum = parseInt(styleItem.color.substr(0,2),16) +
							parseInt(styleItem.color.substr(2,2),16) +
							parseInt(styleItem.color.substr(4,2),16);
					if(feature.getGeometry().getType() == "Point"){
						style = new ol.style.Style ({
							image: new ol.style.Circle({
								radius: parseFloat(styleItem.size*pointSize),
								stroke: new ol.style.Stroke({
									color: sum/3 > 127 ? '#000' : '#FFF'
								}),
								fill: new ol.style.Fill({
									color: styleItem.color.indexOf("#") == 0 ? styleItem.color : "#"+styleItem.color
								})
							})
						});
					}
					else{
						style = new ol.style.Style ({
			                stroke: new ol.style.Stroke({
			                	color: styleItem.color.indexOf("#") == 0 ? styleItem.color : "#"+styleItem.color,
			                    width: 1
			                }),
			                fill: new ol.style.Fill({
			                	color: styleItem.color.indexOf("#") == 0 ? styleItem.color : "#"+styleItem.color
			                })
			            });
					}
					styleByThemeItems[feature.get('tematismo') + styleItem.label] = style;
				}
			}
		};
		return features;
	};
	
	var open = function (event) {
		
		if (conf.debug)
			console.log("open");
		
		$("#legend-item_"+event.data.key+"_content").show();
		$("#legend-item_"+event.data.key+"_open").hide();
		$("#legend-item_"+event.data.key+"_close").show();
	};
	
	var close = function (event) {
		
		if (conf.debug)
			console.log("close");
		
		$("#legend-item_"+event.data.key+"_content").hide();
		$("#legend-item_"+event.data.key+"_open").show();
		$("#legend-item_"+event.data.key+"_close").hide();
	};

	var numberFormatted = function (numValue) {
			var output = numValue;
			var numDecimal = 2;
			
			if (!output || output == null || output == 'null' || (typeof output == 'string' && output.trim() == "")) {
				output = 0;
			}
			else {
					output = '' + output;
					if (output.indexOf(".") >= 0) {
						output = ''+Number(output).toFixed(numDecimal);
					}
					
					// Taglio il valore in parte intera e parte decimale
					output = output.split('.');
				    // Aggiungo il separatore delle migliaia - ogni 3 numeri sulla parte intera
				    if (output[0].length > 3) {        
				    	output[0] = output[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, ".");
				    }
				    
				    // Aggiungo parte decimale a parte intera - separati da separatore decimali
				    output = output.join(",");
			}
			return output;
		};

		var sortObjByKeys = function(obj) {
			// esegue l'ordinamento delle chiavi dell'oggetto
			return Object.keys(obj).sort().reduce(function (result, key) {
		        result[key] = obj[key];
		        return result;
		    }, {});
			
			// versione compatta ma non permessa dal minify
			//return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
		};
}