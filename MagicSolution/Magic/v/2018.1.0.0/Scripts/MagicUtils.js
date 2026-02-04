var largeSpinnerHTML = '<p class="text-center" style="padding: 20px;"><i class="fa fa-spinner fa-spin fa-5x"></i></p>';
var mediumSpinnerHTML = '<p class="text-center"><i class="fa fa-spinner fa-spin fa-2x"></i></p>';
var smallSpinnerHTML = '<p class="text-center"><i class="fa fa-spinner fa-spin"></i></p>';
var fanzySpinner = '<style>.cssload-container {width: 117px;margin: 0 auto;}.cssload-circle-1 {height: 117px;width: 117px;background: rgb(97,46,141);}.cssload-circle-2 {height: 97px;width: 97px;background: rgb(194,34,134);}.cssload-circle-3 {height: 78px;width: 78px;background: rgb(234,34,94);}.cssload-circle-4 {height: 58px;width: 58px;background: rgb(237,91,53);}.cssload-circle-5 {height: 39px;width: 39px;background: rgb(245,181,46);}.cssload-circle-6 {height: 19px;width: 19px;background: rgb(129,197,64);}.cssload-circle-7 {height: 10px;width: 10px;background: rgb(0,163,150);}.cssload-circle-8 {height: 5px;width: 5px;background: rgb(22,116,188);}.cssload-circle-1,.cssload-circle-2,.cssload-circle-3,.cssload-circle-4,.cssload-circle-5,.cssload-circle-6,.cssload-circle-7,.cssload-circle-8 {border-bottom: none;border-radius: 50%;-o-border-radius: 50%;-ms-border-radius: 50%;-webkit-border-radius: 50%;-moz-border-radius: 50%;box-shadow: 1px 1px 1px rgba(0,0,0,0.1);-o-box-shadow: 1px 1px 1px rgba(0,0,0,0.1);-ms-box-shadow: 1px 1px 1px rgba(0,0,0,0.1);-webkit-box-shadow: 1px 1px 1px rgba(0,0,0,0.1);-moz-box-shadow: 1px 1px 1px rgba(0,0,0,0.1);animation-name: cssload-spin;-o-animation-name: cssload-spin;-ms-animation-name: cssload-spin;-webkit-animation-name: cssload-spin;-moz-animation-name: cssload-spin;animation-duration: 4600ms;-o-animation-duration: 4600ms;-ms-animation-duration: 4600ms;-webkit-animation-duration: 4600ms;-moz-animation-duration: 4600ms;animation-iteration-count: infinite;-o-animation-iteration-count: infinite;-ms-animation-iteration-count: infinite;-webkit-animation-iteration-count: infinite;-moz-animation-iteration-count: infinite;animation-timing-function: linear;-o-animation-timing-function: linear;-ms-animation-timing-function: linear;-webkit-animation-timing-function: linear;-moz-animation-timing-function: linear;}@keyframes cssload-spin {from {transform: rotate(0deg);}to {transform: rotate(360deg);}}@-o-keyframes cssload-spin {from {-o-transform: rotate(0deg);}to {-o-transform: rotate(360deg);}}@-ms-keyframes cssload-spin {from {-ms-transform: rotate(0deg);}to {-ms-transform: rotate(360deg);}}@-webkit-keyframes cssload-spin {from {-webkit-transform: rotate(0deg);}to {-webkit-transform: rotate(360deg);}}@-moz-keyframes cssload-spin {from {-moz-transform: rotate(0deg);}to {-moz-transform: rotate(360deg);}}</style><div class="cssload-container"><div class="cssload-circle-1"><div class="cssload-circle-2"><div class="cssload-circle-3"><div class="cssload-circle-4"><div class="cssload-circle-5"><div class="cssload-circle-6"><div class="cssload-circle-7"><div class="cssload-circle-8"></div></div></div></div></div></div></div></div></div>';

//estendo Jquery per avere una contains che non sia case sensitive
$.expr[':'].containsIgnoreCase = function (n, i, m) {
    return jQuery(n).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

if (!String.prototype.formatObject) {
    String.prototype.formatObject = function (o) {
        var args = o;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}
var controllermethodseparator = '$';
//#region XMLextensionutils

function parseXml(xml) {
    if (xml === null)
        return;
    var dom = null;
    if (window.DOMParser) {
        try {
            dom = (new DOMParser()).parseFromString(xml, "text/xml");
        }
        catch (e) { dom = null; }
    }
    else if (window.ActiveXObject) {
        try {
            dom = new ActiveXObject('Microsoft.XMLDOM');
            dom.async = false;
            if (!dom.loadXML(xml)) // parse error ..

                window.alert(dom.parseError.reason + dom.parseError.srcText);
        }
        catch (e) { dom = null; }
    }
    else
        alert("cannot parse xml string!");
    return dom;
}

function getXmlParser() {
    var X = {
        toObj: function (xml) {
            var o = {};
            if (xml.nodeType == 1) {   // element node ..
                if (xml.attributes.length)   // element with attributes  ..
                    for (var i = 0; i < xml.attributes.length; i++)
                        o["@" + xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || "").toString();
                if (xml.firstChild) { // element has child nodes ..
                    var textChild = 0, cdataChild = 0, hasElementChild = false;
                    for (var n = xml.firstChild; n; n = n.nextSibling) {
                        if (n.nodeType == 1) hasElementChild = true;
                        else if (n.nodeType == 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
                        else if (n.nodeType == 4) cdataChild++; // cdata section node
                    }
                    if (hasElementChild) {
                        if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
                            X.removeWhite(xml);
                            for (var n = xml.firstChild; n; n = n.nextSibling) {
                                if (n.nodeType == 3)  // text node
                                    o["#text"] = X.escape(n.nodeValue);
                                else if (n.nodeType == 4)  // cdata node
                                    o["#cdata"] = X.escape(n.nodeValue);
                                else if (o[n.nodeName]) {  // multiple occurence of element ..
                                    if (o[n.nodeName] instanceof Array)
                                        o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                                    else
                                        o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                                }
                                else  // first occurence of element..
                                    o[n.nodeName] = X.toObj(n);
                            }
                        }
                        else { // mixed content
                            if (!xml.attributes.length)
                                o = X.escape(X.innerXml(xml));
                            else
                                o["#text"] = X.escape(X.innerXml(xml));
                        }
                    }
                    else if (textChild) { // pure text
                        if (!xml.attributes.length)
                            o = X.escape(X.innerXml(xml));
                        else
                            o["#text"] = X.escape(X.innerXml(xml));
                    }
                    else if (cdataChild) { // cdata
                        if (cdataChild > 1)
                            o = X.escape(X.innerXml(xml));
                        else
                            for (var n = xml.firstChild; n; n = n.nextSibling)
                                o["#cdata"] = X.escape(n.nodeValue);
                    }
                }
                if (!xml.attributes.length && !xml.firstChild) o = null;
            }
            else if (xml.nodeType == 9) { // document.node
                o = X.toObj(xml.documentElement);
            }
            else
                kendoConsole.log("error", "MagicUtils.js@xml2json: unhandled node type: " + xml.nodeType, true);
            return o;
        },
        toJson: function (o, name, ind) {
            var json = name ? ("\"" + name + "\"") : "";
            if (o instanceof Array) {
                for (var i = 0, n = o.length; i < n; i++)
                    o[i] = X.toJson(o[i], "", ind + "\t");
                json += (name ? ":[" : "[") + (o.length > 1 ? ("\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind) : o.join("")) + "]";
            }
            else if (o == null)
                json += (name && ":") + "null";
            else if (typeof (o) == "object") {
                var arr = [];
                for (var m in o)
                    arr[arr.length] = X.toJson(o[m], m, ind + "\t");
                json += (name ? ":{" : "{") + (arr.length > 1 ? ("\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind) : arr.join("")) + "}";
            }
            else if (typeof (o) == "string")
                json += (name && ":") + "\"" + o.toString() + "\"";
            else
                json += (name && ":") + o.toString();
            return json;
        },
        innerXml: function (node) {
            var s = ""
            if ("innerHTML" in node)
                s = node.innerHTML;
            else {
                var asXml = function (n) {
                    var s = "";
                    if (n.nodeType == 1) {
                        s += "<" + n.nodeName;
                        for (var i = 0; i < n.attributes.length; i++)
                            s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue || "").toString() + "\"";
                        if (n.firstChild) {
                            s += ">";
                            for (var c = n.firstChild; c; c = c.nextSibling)
                                s += asXml(c);
                            s += "</" + n.nodeName + ">";
                        }
                        else
                            s += "/>";
                    }
                    else if (n.nodeType == 3)
                        s += n.nodeValue;
                    else if (n.nodeType == 4)
                        s += "<![CDATA[" + n.nodeValue + "]]>";
                    return s;
                };
                for (var c = node.firstChild; c; c = c.nextSibling)
                    s += asXml(c);
            }
            return s;
        },
        escape: function (txt) {
            return txt.replace(/[\\]/g, "\\\\")
                .replace(/[\"]/g, '\\"')
                .replace(/[\n]/g, '\\n')
                .replace(/[\r]/g, '\\r');
        },
        removeWhite: function (e) {
            e.normalize();
            for (var n = e.firstChild; n;) {
                if (n.nodeType == 3) {  // text node
                    if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
                        var nxt = n.nextSibling;
                        e.removeChild(n);
                        n = nxt;
                    }
                    else
                        n = n.nextSibling;
                }
                else if (n.nodeType == 1) {  // element node
                    X.removeWhite(n);
                    n = n.nextSibling;
                }
                else                      // any other node
                    n = n.nextSibling;
            }
            return e;
        }
    };
    return X;
}

function xml2json(xml, tab) {
    if (xml.nodeType == 9) // document node
        xml = xml.documentElement;
    var X = getXmlParser();
    var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
    return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
}

function xml2jso(xml) {
    var X = getXmlParser();
    return X.toObj(X.removeWhite(xml));
}

function tryParseXML(xmlString) {

    if (window.DOMParser) {
        try {
            var parser = new DOMParser();
            var parsererrorNS = parser.parseFromString('INVALID', 'text/xml').getElementsByTagName("parsererror")[0].namespaceURI;
            var dom = parser.parseFromString(xmlString, 'text/xml');
            if (dom.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0) {
                return false;
            }
            return dom;
        }
        catch (err) {
            return false;
        }

    }


}

//#endregion
//#region magicframeworkglobalvars

var standardGridfastsearch = '<div style="height: 17px; display: inline-block"></div><input type="search" class="k-input k-textbox" id="maingridsearchandfilter" name="maingridsearchandfilter" onclick="checkAndInitializeFastSearch($(this).closest(\'.k-grid\'));" placeholder="..." />';

var setfromdatabound = false;
var currentgrid = "grid";

var elementineditid = -1;

//hash di stored procedure e jsonpayload associati ai bottoni di riga 
var rowbuttonattributes = {};
var toolbarbuttonattributes = {};
// nell' hash per ogni griglia (id) vado a memorizzare quale sia la sua precendente griglia editata
var prevgridhash = {};
prevgridhash[currentgrid] = { prevgrid: "grid", prevelementineditid: -1, objectinedit: null };

var prevelementineditid = -1;

window.HashOfExportableGrids = {};

var defaultfiltersettings = {};

function setDefaultFilterSettings() {
    defaultfiltersettings = {
        // mode:"row,menu",
        extra: true,
        messages: {
            and: getObjectText("and"),
            or: getObjectText("or"),
            filter: getObjectText("Applyfilter"),
            clear: getObjectText("Clearfilter"),
            info: getObjectText("infofilter"),
            isFalse: getObjectText("isFalse"),
            isTrue: getObjectText("isTrue"),
            selectValue: getObjectText("selectvalue")
        },
        operators: {
            enums: {
                eq: getObjectText("eq"),
                neq: getObjectText("neq")
            },
            email: {
                startswith: getObjectText("startswith"),
                eq: getObjectText("eq"),
                neq: getObjectText("neq"),
                isnull: getObjectText("isnull"),
                isnotnull: getObjectText("isnotnull")
            },
            string: {
                contains: getObjectText("contains"),
                doesnotcontain: getObjectText("doesnotcontains"),
                startswith: getObjectText("startswith"),
                eq: getObjectText("eq"),
                neq: getObjectText("neq"),
                isnull: getObjectText("isnull"),
                isnotnull: getObjectText("isnotnull")
            },
            number: {
                eq: getObjectText("eq"),
                lt: getObjectText("lt"),
                lte: getObjectText("lte"),
                neq: getObjectText("neq"),
                gt: getObjectText("gt"),
                gte: getObjectText("gte"),
                isnull: getObjectText("isnull"),
                isnotnull: getObjectText("isnotnull")

            },
            date: {
                gt: getObjectText("gt"),
                gte: getObjectText("gte"),
                lt: getObjectText("lt"),
                lte: getObjectText("lte"),
                eq: getObjectText("eq"),
                neq: getObjectText("neq"),
                isnull: getObjectText("isnull"),
                isnotnull: getObjectText("isnotnull")
            }
        }
    };
    return defaultfiltersettings;
}
//#endregion
//#region DataBaseAccessUtils
//this gets called each time a value in a drop down list is selected in a kendo grid's  PopUp
function onSelectdropDownManageNotAssignedInModel(e) {
    try {
        var dataValueField = e.sender.options.dataValueField;
        if (e.item) {
            var dataItem = this.dataItem(e.item);
            var selectedValue = dataItem[dataValueField];
            if (selectedValue) //a valid value has been selected 
                return;
            //the option label has been selected --> set the model to 0 (default value for FK)
            //get model of the item which is in edit in the grid
            var dataInfo = getModelAndContainerFromKendoPopUp(e.sender.element);
            var model = dataInfo.model;
            var bindedfield = e.sender.element.attr("data-bind").split(":")[1];
            model[bindedfield] = 0;
        }
    }
    catch (ex) {
        console.log(ex);
    }
}
//orderbyfield e'  sia il campo di ordinamento che il campo testo mostrato dal widget all' utente  textfield
//controllername e' un retaggio: puo' contenere un controller, una tabella vista, una stored procedure a seconda del parametro typeofdatasource
//rowdata e' il data record su cui vive la drop corrispondente ad e.model dell' evento di edit di kendo.
//dstargetdomid e' l' id del widget in modalita' pop up mentre e' il JQuery del widget nell' edit in cell   
function getdropdatasource(controllername, orderbyfield, controllerfunction, dstargetdomid, initialvalue, valuefield, schema, typeofdatasource, rowdata, returndefinition, cascadefrom, cascadefromfield, isMultiselect, container) {
    var datapost = {};
    var serverfilter = false;
    typeofdatasource = solvetypeofdatasource(typeofdatasource);

    controllerfunction = (typeof controllerfunction === "undefined" || controllerfunction == null) ? "GetAll" : controllerfunction;

    //se il nome del controller contiene controllermethodseparator (var globale definita ad inizio magicutils.js) allora faccio un split e prendo il 2o string come  controllerfunction in GET
    if (controllername.indexOf(controllermethodseparator) != -1) {
        controllerfunction = controllername.split(controllermethodseparator)[1];
        controllername = controllername.split(controllermethodseparator)[0];
    }

    var urlvalue = "/api/" + controllername + "/" + controllerfunction; // caso in cui la chiamata sia fatta a mano con initial value popolato senza specificare il typeofdatasource (retrocompatibile con MagicBroker custom funcs)
    var typemethod = "GET";
    //typeofdatasource :  1= stored , 2= table or view (default) , 3 = controller
    if (typeofdatasource === 2) {
        urlvalue = "/api/ManageFK/GetDropdownValues";
        typemethod = "POST";
        datapost = { tablename: controllername, valuefield: valuefield, textfield: orderbyfield, schema: schema, cascadefrom: cascadefrom, cascadefromfield: cascadefromfield };
        if (isMultiselect && cascadefrom && cascadefromfield)
            datapost.filter = { field: cascadefromfield, operator: "eq", value: rowdata[cascadefrom], type: "cascadeFilter" };
        serverfilter = true;
    }
    else if (typeofdatasource === 1) {
        urlvalue = "/api/ManageFK/CallFKStoredProcedure";
        typemethod = "POST";
        serverfilter = true;        
        $.extend(rowdata, { __editField__ : $('#' + dstargetdomid).attr("name") });
        datapost = { storedprocedurename: controllername, valuefield: valuefield, textfield: orderbyfield, schema: schema, rowdata: rowdata};
    }
    else if (typeofdatasource === 3 && controllername.startsWith("base64")) {
        var callInfo = parseWebAPIBase64String(controllername);
        urlvalue = '/api/' + callInfo[1];
        typemethod = callInfo[0];
        serverfilter = true;
        datapost = { tablename: callInfo[2], valuefield: valuefield, textfield: orderbyfield, schema: schema, cascadefrom: cascadefrom, cascadefromfield: cascadefromfield, EntityName: schema + '.' + callInfo[2], take: 1000, rowdata: rowdata };
    }

    var ds = new kendo.data.DataSource({
        transport: {
            read: {
                url: urlvalue,
                data: datapost,
                contentType: "application/json; charset=utf-8",
                type: typemethod,
                dataType: "json"
            },
            parameterMap: function (options, operation) {
                return kendo.stringify(options);
            }
        },
        serverFiltering: serverfilter,
        schema: {
            parse: function (data) {
                if (returndefinition === true) { //in cell edit: mi serve che esistano il value e text props  
                    try {
                        if (!data[0].value) {
                            var ret = [];
                            ret = $.map(data, function (v, i) { return { value: v[valuefield], text: v[orderbyfield] } });
                            ret.unshift({ value: null, text: "N/A" });
                            return ret;
                        }
                    }
                    catch (err) {
                        console.log("FK data is empty!");
                    }
                    data.unshift({ value: null, text: "N/A" });
                    return data;
                }
                else   //altri casi di edit: mi serve che vengano passati i campi configurati
                {
                    if (controllername.startsWith("base64") || typeofdatasource !== 3 && valuefield !== undefined && orderbyfield !== undefined) { //se il datasource non e' un controller aggiungo il "valuefield" ed il "textfield"  al posto di value e text se mancano
                        return manageDBFKAddConfigFields({ data: data, valuefield: valuefield, textfield: orderbyfield });
                    }
                    else
                        return data;
                }
            }
        },
        // sort: { field: orderbyfield, dir: "asc" },
        change: function (data) {
            if (!returndefinition && !cascadefrom) {
                var dom = (typeof dstargetdomid) == "undefined" ? controllername + "dd" : dstargetdomid;
                if (isMultiselect) {//it's a multiselect
                    if (!$("#" + dom, container).data("kendoMultiSelect")) {
                        $("#" + dom, container).kendoMultiSelect({
                            dataValueField: valuefield,
                            dataTextField: orderbyfield,
                            dataSource: [],
                            valuePrimitive: true,
                            change: function (par) {
                                //write the new value into the grid's datasource 
                                par.sender.element.trigger('cascade');
                                //BUG 6287 if a ms is required kendo dows not updates values in model	
                                try {
                                    var dsitem = par.sender.element.closest(".k-popup-edit-form").data("gridDS").data().filter(function (x) { if (x.uid == par.sender.element.closest(".k-popup-edit-form").data("uid")) return x; });
                                    if (dsitem.length)
                                        dsitem[0][par.sender.element.attr("id")] = par.sender.value().join(',');
                                }
                                catch (err) {
                                    console.log(err);
                                }
                            }
                        });
                    }
                    if ($("#" + dom, container).data("kendoMultiSelect") != null) {
                        var dropdown = $("#" + dom, container).data("kendoMultiSelect");
                        dropdown.setDataSource(data.items);
                        if (typeof initialvalue != "undefined") {
                            dropdown.value(initialvalue ? initialvalue.split(",") : []);
                            dropdown.trigger('change');
                        }
                    }
                }
                else {//it's a dropdownlist
                    if ($("#" + dom, container).data("kendoDropDownList") != null) {
                        var dropdown = $("#" + dom, container).data("kendoDropDownList");
                        //if (data.items && data.items.length) {
                        //    var obj = {};
                        //    obj[valuefield] = 0;
                        //    obj[orderbyfield] = "N/A";
                        //    data.items.unshift(obj);
                        //}
                        dropdown.setDataSource(data.items);
                        if (typeof initialvalue != "undefined")
                            dropdown.value(initialvalue);
                        //else
                        //    dropdown.value(0);
                    }
                    else console.log("A dropdown with id property equal to " + dom + " does not exist. Control Template Details, property DOMID.");
                }
            }
        }
    });
    var $input;
    if (container)
        $input = $("#" + dstargetdomid, container);
    else
        $input = $("#" + dstargetdomid);

    //ms and drop cascade (outside of change)
    if (cascadefrom) {
        if (isMultiselect && !$input.data("kendoMultiSelect")) {
            var ms = $input.kendoMultiSelect({
                dataValueField: valuefield,
                dataTextField: orderbyfield,
                dataSource: ds,
                valuePrimitive: true,
                change: function (par) {
                    par.sender.element.trigger('cascade');
                }
            });
            $input.data("kendoMultiSelect").value(initialvalue ? initialvalue.split(",") : []);
            $input.data("kendoMultiSelect").trigger("change");
        }
        else {
            if ($input.data("kendoMultiSelect"))
                isMultiselect = true;
            var cascadedrop = (isMultiselect ? $input.data("kendoMultiSelect") : $input.data("kendoDropDownList"));
            cascadedrop.setDataSource(ds);
            //set the value again if was previsously set checking wether it's a drop or multisect (array)
            if (initialvalue &&
                ((!cascadedrop.value() && !isMultiselect)
                    || (cascadedrop.value() && !cascadedrop.value().length && isMultiselect))) {
                cascadedrop.value(isMultiselect ? initialvalue.split(",") : initialvalue);
                if (isMultiselect)
                    cascadedrop.trigger('change');
                var validator = $input.closest(".k-popup-edit-form").data("kendoValidator");
                if (validator) {
                    cascadedrop.one("change", function () {
                        validator.validateInput($input);
                    });
                }
            }
            if (!initialvalue && isMultiselect)
                cascadedrop.value([]);
        }
        return;
    }
    if (returndefinition) //se mi serve solo la definizione del datasource: in cell 
    {
        return ds;
    }
    else {
        ds.read();  //popup
        return ds.view();
    }
}
//aggiunta dei campi di configurazione nel caso in cui il recordset tornato dalla FK sia nel formato value-text
function manageDBFKAddConfigFields(options) {
    if (options.data.Data) {
        options.data = options.data.Data[0].Table;
    }
    options.data.forEach(function (e) {
        if (e["value"] != undefined) {
            e[options.valuefield] = e.value;
            if (options.valuefield != 'value')
                delete e.value;
        }
        if (e["text"] != undefined && options.textfield != 'text') {
            e[options.textfield] = e.text;
            if (options.textfield != 'text')
                delete e.text;
        }
        e[options.textfield] = e[options.textfield].replace('\n', '\\n'); //eliminazione caratteri a capo dalle descrizioni
    });
    return options.data;
}

//rename del recordset in arrivo da DB per il caso stored procedure creata dall' utente(sviluppatore) o controller (se Table/View la stored generica rinomina i campi by default)
function manageDBFKAddValueText(options) {
    if (options.Data) {
        options.data = options.Data[0].Table;
    }
    else if (options.data.Data) {
        options.data = options.data.Data[0].Table;
    }
    options.data.forEach(function (e) {
        if (e["value"] == undefined) {
            e["value"] = e[options.valuefield];
        }
        if (e["text"] == undefined) {
            e["text"] = e[options.textfield];
        }
    });

    return options.data;
}

//comune di Roma management for sync api calls not intercepted by service worker...synchCallsApiPrefix is set in WebArch.Master code behind and read
//from.configuration file SyncCallsApiUrlPathPrefix property at instance level
function manageAsyncCallsUrl(async, url) {
    let apiSyncCallPrefix = async ? "" : (window.synchCallsApiPrefix || "");
    if (async)
        return url;
    return apiSyncCallPrefix + url;
}
//restituisce la lista di valori in formato value - text di un FK. 
function GetDropdownValues(tablename, valuefield, textfield, schema, typeofdatasource, filter, async, rowdata) {
    if (!async)
        async = false;

    var schemaMatch = tablename.match(/^(\w+)\.(\w+)$/);
    if (schemaMatch) {
        if (schema == schemaMatch[1])
            tablename = schemaMatch[2];
        else if (!schema) {
            schema = schemaMatch[1];
            tablename = schemaMatch[2];
        }
    }

    //typeofdatasource   1 = Stored Procedure, 2 = Table or View , 3 = WEB API Controller metodo GetAll
    //se il type e' nullo o non specificato vado a chiamare la SP standard del framework
    if (typeofdatasource === undefined || typeofdatasource === null || typeofdatasource == "2") {
        var result = $.ajax({
            type: "POST",
            async: async,
            url: manageAsyncCallsUrl(async, "/api/ManageFK/GetDropdownValues"), //"/api/ManageFK/GetDropdownValues",
            data: JSON.stringify({ tablename: tablename, valuefield: valuefield, textfield: textfield, schema: schema, filter: filter }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (e) {
                console.log({ typeofdatasource: typeofdatasource, called_object: tablename, error: e });
            }
        });
        if (result.status != 500)
            return async ? result : JSON.parse(result.responseText);
    }
    else if (typeofdatasource == "1") {
        var result = $.ajax({
            type: "POST",
            async: async,
            url: manageAsyncCallsUrl(async, "/api/ManageFK/CallFKStoredProcedure"),//"/api/ManageFK/CallFKStoredProcedure",
            data: JSON.stringify({ storedprocedurename: tablename, valuefield: valuefield, textfield: textfield, schema: schema, filter: filter, rowdata: rowdata ? rowdata : null }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (e) {
                console.log({ typeofdatasource: typeofdatasource, called_object: tablename, error: e });
            }
        });
        // la stored deve rispondere con i campi rinominati in value e text --> aggiungo io  le prop nel caso in cui non esistano ma esistano i campi indicati in config
        if (result.status != 500)
            return async ? result : manageDBFKAddValueText({ data: JSON.parse(result.responseText), valuefield: valuefield, textfield: textfield });
    }
    //La risposta del controller viene ricondotta ad  un oggetto che prevede i campi value e text  { value: "3", text: "XYZ"  }
    else if (typeofdatasource == "3") {
        var controllerfunction = "GetAll";
        var method = 'GET';
        var tableName = '';
        if (tablename.startsWith('base64')) {
            var controllerInfo = parseWebAPIBase64String(tablename);
            method = controllerInfo[0];
            tablename = controllerInfo[1];
            tableName = controllerInfo[2];
            controllerfunction = '';
        }
        else if (tablename.indexOf(controllermethodseparator) != -1) {
            controllerfunction = tablename.split(controllermethodseparator)[1];
            tablename = tablename.split(controllermethodseparator)[0];
        }
        var result = $.ajax({
            type: method,
            data: method !== 'POST' ? undefined : JSON.stringify({
                schema: schema,
                tablename: tableName,
                EntityName: schema + '.' + tableName,
                valuefield: valuefield,
                textfield: textfield,
                filter: filter,
                rowdata: rowdata ? rowdata : undefined,
                take: 1000,
            }),
            async: async,
            url: manageAsyncCallsUrl(async, "/api/" + tablename + "/" + controllerfunction),// "/api/" + tablename + "/" + controllerfunction,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (e) {
                console.log({ typeofdatasource: typeofdatasource, called_object: tablename, error: e });
            }
        });
        if (result.status != 500)
            return async ? result : manageDBFKAddValueText({ data: JSON.parse(result.responseText), valuefield: valuefield, textfield: textfield });
    }
    return [{ value: null, text: "N/A" }];
}

function parseWebAPIBase64String(string) {
    return atob(string.substring(6)).split(' ')
}

function getdatasource(controllername, orderbyfield, controllerfunction, orderdir, parstring, data) {
    controllerfunction = (typeof controllerfunction === "undefined") ? "GetAll" : controllerfunction;
    var type = (controllerfunction.substring(0, 3) === "Get") ? "GET" : "POST";
    var url = '';
    if (controllername.startsWith('base64')) {
        var controllerInfo = parseWebAPIBase64String(controllername);
        type = controllerInfo[0];
        url = '/api/' + controllerInfo[1];
        data.filter = {
            field: data.dsValueField,
            operator: "eq",
            value: data.value,
        };
        data.EntityName = data.dsSchema + '.' + controllerInfo[2];
        data.take = 1;
    }

    var dsOptions = {
        transport: {
            read: {
                type: type,
                async: false,
                serverFiltering: false,
                url: manageAsyncCallsUrl(false, "/api/" + controllername + "/" + controllerfunction),// url ? url : "/api/" + controllername + "/" + controllerfunction,
                contentType: "application/json",
                data: data,
            },
            parameterMap: function (options, operation) {
                return kendo.stringify(options);
            }
        },
        change: function (data) {
            return data.items;
        },
        sort: { field: orderbyfield, dir: orderdir == null ? "asc" : orderdir }
    };
    if (controllername.startsWith('base64')) {
        dsOptions.schema = {
            data: function (response) {
                if (Array.isArray(response)) {
                    return response;
                }
                return response.Data[0].Table;
            }
        }
    }
    var ds = new kendo.data.DataSource(dsOptions);
    if (type == "GET")
        ds.read();
    else
        ds.read(parstring);
    return ds.view();
};

function getdroparray(ds, dropvalue, droptext) {
    var _data = ds;
    var dsvalues = [{ text: "N/A", value: null }];
    for (var i = 0; i < _data.length; i++) {
        var obj = {
            text: _data[i][droptext],
            value: _data[i][dropvalue]
        };
        dsvalues.push(obj);
    }
    return dsvalues;
}

function getcolumnindex(columns, columnname) {
    for (var i = 0; i < columns.length; i++) {
        if (columns[i].field == columnname) {
            return i;
        }
    }
    return null;
}

function getdroparraycombinetext(ds, dropvalue, droptext1, droptext2, prefix1, prefix2) {
    var _data = ds;
    var dsvalues = [{ text: "N/A", value: null }];
    for (var i = 0; i < _data.length; i++) {
        var obj = {
            text: prefix1 + _data[i][droptext1] + "|" + prefix2 + _data[i][droptext2],
            value: _data[i][dropvalue]
        };
        dsvalues.push(obj);
    }
    return dsvalues;
}


function getdropdatasourcewmethod(asyncflag, method, controllername, orderfield) {
    var ds = new kendo.data.DataSource({
        transport: {
            read: {
                async: asyncflag,
                serverFiltering: true,
                url: manageAsyncCallsUrl(asyncflag, "/api/" + controllername + "/" + method), //"/api/" + controllername + "/" + method,
                dataType: "json"
            }
        },
        sort: { field: orderfield, dir: "asc" }
    });
    ds.read();
    return ds.view();
};

function getmultiselectdatasource(controllername, orderbyfield, controllerfunction, dstargetdomid, initialvalue, valuefield) {

    controllerfunction = (typeof controllerfunction === "undefined" || controllerfunction == null) ? "GetAll" : controllerfunction;

    var urlvalue = "/api/" + controllername + "/" + controllerfunction;
    var typemethod = "GET";
    //if (typeof valuefield != "undefined") {
    if (typeof valuefield != "undefined") {
        urlvalue = "/api/ManageFK/GetDropdownValues";
        typemethod = "POST";
    }

    var datapost = {};
    var serverfilter = false;

    if (typemethod == "POST") {
        serverfilter = true;
        datapost = { tablename: controllername, valuefield: valuefield, textfield: orderbyfield };
    }
    var ds = new kendo.data.DataSource({
        transport: {
            read: {
                url: urlvalue,
                serverFiltering: serverfilter,
                data: datapost,
                contentType: "application/json; charset=utf-8",
                type: typemethod,
                dataType: "json"
            },
            parameterMap: function (options, operation) {
                return kendo.stringify(options);
            }
        },
        schema: {
            parse: function (data) {
                if (urlvalue == "/api/ManageFK/GetDropdownValues") {
                    var retobj = new Array();
                    for (var i = 0; i < data.length; i++) {
                        var stringobj = "{ \"" + valuefield + "\":\"" + data[i].value + "\",\"" + orderbyfield + "\":\"" + data[i].text + "\" }";
                        var obj = JSON.parse(stringobj);
                        retobj.push(eval(obj));
                    }
                    return retobj;
                }
                else
                    return data;
            }
        },
        sort: { field: orderbyfield, dir: "asc" },
        change: function (data) {
            var dom = (typeof dstargetdomid) == "undefined" ? controllername + "dd" : dstargetdomid;
            if ($("#" + dom).data("kendoMultiSelect") != null) {
                var dropdown = null;
                dropdown = $("#" + dom).data("kendoMultiSelect");
                dropdown.setDataSource(data.items);
                if (typeof initialvalue != "undefined")
                    dropdown.value(initialvalue);
            }
        }
    });
    ds.read();
    return ds.view();
}
function buildXMLStoredProcedureReturnDataSet(data, storedprocedurename, returnEmpty) {
    var dataavailable = new $.Deferred();
    data.storedprocedure = storedprocedurename;
    $.ajax({
        url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure", type: "POST", data: JSON.stringify(data),
        success: function (e) {
            var tables = []
            $(e).each(function (i, v) {
                if (v.drows.length)
                    tables.push(v.drows[0].Table);
                else if (returnEmpty)
                    tables.push([]);

            });
            dataavailable.resolve(tables);
        },
        error: function (err) {
            dataavailable.resolve(err);
        },
        dataType: "json",
        contentType: "application/json; charset=utf-8"
    });
    return dataavailable.promise();
}
// permette di chiamare una SP con parametri XML in input e con un recordSet in output
function buildXMLStoredProcedureJSONDataSource(dataobj, success_fn, storedprocedurename) {
    var ds = {
        change: success_fn,
        transport: {
            read: {
                url: "/api/GENERICSQLCOMMAND/SelectFromXMLStoredProcedure",
                type: "POST",
                dataType: "json",
                contentType: "application/json;charset=utf-8"
            },
            parameterMap: function (options, operation) {
                if (operation === "read") {
                    // convert the parameters to a json object
                    return kendo.stringify(options);
                }
                // ALWAYS return options
                return options;
            }

        },
        schema: {
            data: "Data",
            total: "Count",
            errors: "Errors"
        }
    };
    ds.transport.parameterMap = function (options, operation) {
        if (operation === "read") {
            options.layerID = null;
            options.EntityName = storedprocedurename;
            options.functionID = -1;
            options.operation = "read";
            options.Model = null;
            options.Columns = '*';
            //fix issue with circular reference, to avoid regressions try catch 
            try {
                options.data = JSON.stringify(dataobj);
            }
            catch (err) {
                console.log(err);
                var gname = dataobj && dataobj.gridName && typeof dataobj.gridName == "object" ? dataobj.gridName.attr("gridname") : null;
                dataobj.gridName = gname;
                options.data = JSON.stringify(dataobj);
            }
            options.DataSourceCustomParam = JSON.stringify({ read: { Type: "StoredProcedure", Definition: storedprocedurename } });
            return kendo.stringify(options);
        }
        // ALWAYS return options
        return options;
    };
    ds.schema = {
        data: "Data",
        total: "Count",
        errors: "Errors",
        parse: function (response) {
            if (response.Errors)
                kendoConsole.log(response.Errors, true);
            //caso di dati da DataTable da C#
            if (response.Data != null)
                if (response.Data.length >= 1)
                    if (response.Data[0].Table != undefined) {
                        return { Data: response.Data[0].Table, Errors: response.Errors, Count: response.Count };
                    } //dati da model 
            return response;
        }
    }
    return new kendo.data.DataSource(ds);


}

//USERAPI
//return a kendo datasource. Implement 
function getGenericSelectDataSource(options, success_callback) {
    var entityname = "dbo.FakeEntity"
    var functionid = "-1";
    var customjsonparam = null;
    var data = {};

    if (!options.Read) {
        console.log("missing Transport Read");
        return;
    }

    if (!options.Read.url) {
        console.log("missing Transport read.url property");
        return;
    }

    if (options.Data)
        data = options.Data;

    if (typeof options.Definition != "string" && options.Definition)
        customjsonparam = JSON.stringify({ read: options.Definition });

    if (options.EntityName)
        entityname = options.EntityName;

    if (options.FunctionID)
        functionid = options.FunctionID;

    return new kendo.data.DataSource(buildGenericSelectDataSource(options.Read, customjsonparam, entityname, functionid, data, success_callback, options.PageSize));
}

//genera un datasource valido per effettuare la Select del controller generico GENERICSQLCOMMAND
//customjsonparam = corrispondente all' omologo campo della tabella dbo.Magic_dataSource
//entityName = e' il nome della tabella di base dell' operazione. Viene passata alle SP che vengono lanciate (puo' servire per scrivere SP dinamiche come quella generica)
//transportread nome del controller da chiamare e tipo chiamata (es.url:"...", type:"POST", contentType:"application/JSON")
function buildGenericSelectDataSource(transportread, customjsonparam, entityname, functionid, data, success_callback, pagesize) {

    var parseresult = function (response) {
        //caso di dati da DataTable da C#
        if (response.Data != null)
            if (response.Data.length >= 1)
                if (response.Data[0].Table != undefined) {
                    return { Data: response.Data[0].Table, Errors: response.Errors, Count: response.Count };
                } //dati da model 
        return response;
    }

    if (success_callback)
        parseresult = success_callback;

    if (typeof transportread == "string")
        transportread = $.parseJSON(JSON.stringify(eval("(" + transportread + ")")));

    var ds = {    // caso controller 
        transport: {
            read: transportread,
            parameterMap: function (options, operation) {
                if (operation === "read") {
                    // convert the parameters to a json object
                    return kendo.stringify(options);
                }
                // ALWAYS return options
                return options;
            }

        },
        batch: false,
        // error: error,
        pageSize: pagesize ? pagesize : 1000,
        serverPaging: true,
        serverSorting: true,
        serverFiltering: true,
        schema: {
            data: "Data",
            total: "Count",
            errors: "Errors",
            parse: parseresult
        }
    };
    ds.transport.parameterMap = function (options, operation) {
        if (operation === "read") {
            options.layerID = null;
            options.EntityName = entityname;
            options.functionID = functionid;
            options.operation = operation;
            options.Model = null;
            options.Columns = '*';
            options.data = JSON.stringify(data);
            options.DataSourceCustomParam = customjsonparam;
            return kendo.stringify(options);
        }
        // ALWAYS return options
        return options;
    };
    return ds;
}
//pkvalue = valore della primary key
//operation = create/update/destroy
//tabletoquery = nome della tabella/vista su cui inserire, 
//tabletoquerypkfieldname = campo pk della tabella / vista (logica) , storedprocedurename = store da lanciare , 
//dataformat = JSON/XML parametro input stored, 
//functionid , 
//layerid, 
//businessdata = i dati da inserire in tabella { campo:valore, campo2:valore2, ... }
function buildGenericPostInsertUpdateParameter(operation, tabletoquery, tabletoquerypkfieldname, storedprocedurename, dataformat, functionid, layerid, businessdata, pkvalue) {
    var cfgDataSourceCustomParam = '{ read:{Type: "StoredProcedure", Definition:"dbo.Magic_XMLCommands_usp_sel_stmt"},' + operation + ':{ Type: "StoredProcedure", DataFormat: "' + dataformat + '", Definition: "' + storedprocedurename + '" } }';
    businessdata.cfgDataSourceCustomParam = cfgDataSourceCustomParam;
    businessdata.cfgoperation = operation;
    businessdata.cfgfunctionID = (functionid === null) ? 0 : functionid;
    businessdata.cfgEntityName = tabletoquery;
    businessdata.cfglayerID = (layerid === null) ? 0 : layerid;
    businessdata.cfgpkName = tabletoquerypkfieldname;
    businessdata.cfgColumns = [tabletoquerypkfieldname];
    if (operation === "create")
        businessdata[tabletoquerypkfieldname] = pkvalue === undefined ? "0" : pkvalue.toString();
    return JSON.stringify(businessdata);
}

function performGenericPostD(idtodelete, tabletoquery, tabletoquerypkfieldname, storedprocedurename, dataformat, functionid, layerid, businessdata, success_fn) {

    if (success_fn === undefined)
        success_fn = function (result) { kendoConsole.log("OK", false); };

    var cfgDataSourceCustomParam = '{ read:{Type: "StoredProcedure", Definition:"dbo.Magic_XMLCommands_usp_sel_stmt"}, destroy:{ Type: "StoredProcedure", DataFormat: "' + dataformat + '", Definition: "' + storedprocedurename + '" } }';
    businessdata.cfgDataSourceCustomParam = cfgDataSourceCustomParam;
    businessdata.cfgoperation = "destroy";
    businessdata.cfgfunctionID = (functionid === null) ? 0 : functionid;
    businessdata.cfgEntityName = tabletoquery;
    businessdata.cfglayerID = (layerid === null) ? 0 : layerid;
    businessdata.cfgpkName = tabletoquerypkfieldname;
    businessdata.cfgColumns = [];
    eval("businessdata." + tabletoquerypkfieldname + "=" + idtodelete.toString());
    var dataforpost = JSON.stringify(businessdata);
    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/PostD/" + idtodelete,
        data: dataforpost,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: success_fn,
        error: function (message) {
            kendoConsole.log(message.responseText, true);
        }
    });
}
//#endregion
//#region Workflow manager
function deleteActivityConnectionDataBase(c, destinationprecedencestablespecs) {
    var businessdata = {};
    var table = destinationprecedencestablespecs.tablename;
    var pk = destinationprecedencestablespecs.PK;
    performGenericPostD(c, table, pk, "dbo.Magic_Cmnds_ins_upd_del_stmt", "JSON", null, null, businessdata);
}
function updateActivityConnectionDataBase(e, connection, destinationprecedencestablespecs) {
    var sourceID = connection.sourceId.substring(4, connection.sourceId.length);
    var targetID = connection.targetId.substring(4, connection.targetId.length);
    var PrevOutStatus_ID = e.sender.value() == "" ? 0 : e.sender.value();
    var newlabel = e.sender.text();
    var connectionId = connection.getParameter("connectionId");

    //var businessdata = { Activity_ID: targetID, PrevActivity_ID: sourceID, ID: connectionId, PrevOutStatus_ID: PrevOutStatus_ID };
    var businessdata = {};
    businessdata[destinationprecedencestablespecs["Activity_ID"]] = targetID;
    businessdata[destinationprecedencestablespecs["PrevActivity_ID"]] = sourceID;
    businessdata[destinationprecedencestablespecs["PrevStatus_ID"]] = PrevOutStatus_ID;
    businessdata[destinationprecedencestablespecs["PK"]] = connectionId;

    var dataforpost = buildGenericPostInsertUpdateParameter("update", destinationprecedencestablespecs.tablename, destinationprecedencestablespecs.PK, "dbo.Magic_Cmnds_ins_upd_del_stmt", "JSON", null, null, businessdata, connectionId);

    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/PostU/" + connectionId,
        data: dataforpost,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log("OK", false);
            connection.getOverlay("label").setLabel(newlabel);
            connection.setParameter("currentOutputStatusId", e.sender.value());
            $(".connectionmodification").fadeOut();
        },
        error: function (message) {
            kendoConsole.log(message, true);
        }
    });
}
function createActivityConnectionDataBase(info, destinationprecedencestablespecs) {
    var sourceID = info.connection.sourceId.substring(4, info.connection.sourceId.length);
    var targetID = info.connection.targetId.substring(4, info.connection.targetId.length);
    //var businessdata = { Activity_ID: targetID, PrevActivity_ID: sourceID };
    var businessdata = {};
    businessdata[destinationprecedencestablespecs["Activity_ID"]] = targetID;
    businessdata[destinationprecedencestablespecs["PrevActivity_ID"]] = sourceID;

    var dataforpost = buildGenericPostInsertUpdateParameter("create", destinationprecedencestablespecs.tablename, destinationprecedencestablespecs.PK, "dbo.Magic_Cmnds_ins_upd_del_stmt", "JSON", null, null, businessdata);

    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/PostI",
        data: dataforpost,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            var connectionId = result.Data[0].Table[0][destinationprecedencestablespecs.PK];
            info.connection.setParameter("connectionId", connectionId);
            kendoConsole.log("OK", false)
        },
        error: function (message) {
            kendoConsole.log("Error", true);
        }
    });

}

function initializeWorkFlowJsPlumbInstance(clickableareaid, destinationprecedencestablespecs, workflowtabspecs, workflowstatustabspecs) {
    //adding a click handler in jsplumb area
    if (clickableareaid)
        $("#" + clickableareaid).click(function (e) {
            window.lastclickLeft = e.pageX - ($("#jsplumbcontainerwindow").parent().position().left);
            window.lastclickTop = e.pageY - ($("#jsplumbcontainerwindow").parent().position().top);
        });

    var instance = jsPlumb.getInstance({
        Endpoint: ["Dot", { radius: 2 }],
        HoverPaintStyle: { strokeStyle: "#1e8151", lineWidth: 2 },
        ConnectionOverlays: [
            ["Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.8
            }],
            ["Label", { label: "Append To next Operation", id: "label", cssClass: "aLabel" }]
        ],
        Container: "statemachine-demo"
    });

    var windows = jsPlumb.getSelector(".statemachine-demo .w");

    // initialise draggable elements
    instance.draggable(windows, {
        containment: "#jsplumbcontainerwindow"
    });

    // bind a click listener to each connection; the connection is deleted. you could of course
    // just do this: jsPlumb.bind("click", jsPlumb.detach), but I wanted to make it clear what was
    // happening.
    instance.bind("click", function (c) {
        var inst = instance;
        var table = workflowstatustabspecs.tablename;
        window.setTimeout(function () { //aspetto 500 ms per essere sicuro che il click aggiorni i valori di top e left
            $(".connectionmodification").css("top", window.lastclickTop);
            $(".connectionmodification").css("left", window.lastclickLeft);
            $(".connectionmodification").fadeIn();
            var sourceid = c.sourceId.substring(4, c.sourceId.length);
            var connectiondbId = c.getParameter("connectionId");
            var currentOutputStatusId = c.getParameter("currentOutputStatusId");

            var ds = new kendo.data.DataSource({
                transport: {
                    read: {
                        url: "/api/ManageFK/GetCascadeDropdownValues",
                        serverFiltering: true,
                        data: { tablename: table, valuefield: "ID", textfield: "Description", cascade1: "Activity_ID", cascade2: null, cascade1val: sourceid, cascade2val: null },
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        dataType: "json"
                    },
                    parameterMap: function (options, operation) {
                        return kendo.stringify(options);
                    }
                },
                schema: {
                    parse: function (data) {
                        data.unshift({ value: null, text: "N/A" });
                        return data;
                    }
                }

            });

            $("#outconddiv").remove();
            $("#outlab").after('<div class="k-edit-field" id="outconddiv"><input id="outputconditiondd" type="text"></input></div>');

            $("#outputconditiondd").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: ds,
                dataBound: function (e) {
                    e.sender.value(currentOutputStatusId);
                },
                change: function (e) {
                    updateActivityConnectionDataBase(e, c, destinationprecedencestablespecs);
                }
            });

            $("#outputconditiondd").prop("connectionid", connectiondbId);
            $("#deleteconnectionbtn").prop("connectionid", connectiondbId);
            $("#deleteconnectionbtn").unbind("click");
            $("#deleteconnectionbtn").bind("click", function (e) {
                deleteActivityConnectionDataBase(connectiondbId, destinationprecedencestablespecs);
                inst.detach(c);
                connectionwndclose();
            });

        }, 250)
    });

    // bind a connection listener. note that the parameter passed to this function contains more than
    // just the new connection - see the documentation for a full list of what is included in 'info'.
    instance.bind("connection", function (info) {
        var transitionstautslabel = info.connection.getParameter("transitionlabel");
        info.connection.getOverlay("label").setLabel(transitionstautslabel === undefined ? "" : transitionstautslabel);
        var connectionisnew = info.connection.getParameter("connectionId") === undefined ? true : false;
        if (connectionisnew)
            createActivityConnectionDataBase(info, destinationprecedencestablespecs);
    });


    // suspend drawing and initialise.
    instance.doWhileSuspended(function () {
        var isFilterSupported = instance.isDragFilterSupported();
        if (isFilterSupported) {
            instance.makeSource(windows, {
                filter: ".ep",
                anchor: "Continuous",
                connector: ["StateMachine", { curviness: 100 }],
                connectorStyle: { strokeStyle: "#5c96bc", lineWidth: 2, outlineColor: "transparent", outlineWidth: 4 },
                maxConnections: 5,
                onMaxConnections: function (info, e) {
                    alert("Maximum connections (" + info.maxConnections + ") reached");
                }
            });
        }
        else {
            var eps = jsPlumb.getSelector(".ep");
            for (var i = 0; i < eps.length; i++) {
                var e = eps[i], p = e.parentNode;
                instance.makeSource(e, {
                    parent: p,
                    anchor: "Continuous",
                    connector: ["StateMachine", { curviness: 100 }],
                    connectorStyle: { strokeStyle: "#5c96bc", lineWidth: 2, outlineColor: "transparent", outlineWidth: 4 },
                    maxConnections: 5,
                    onMaxConnections: function (info, e) {
                        alert("Maximum connections (" + info.maxConnections + ") reached");
                    }
                });
            }
        }
    });

    // initialise all '.w' elements as connection targets.
    instance.makeTarget(windows, {
        dropOptions: { hoverClass: "dragHover" },
        anchor: "Continuous",
        allowLoopback: true,
        anchor: "Continuous"
    });

    return instance;
}

function connectionwndclose() {
    $(".connectionmodification").fadeOut();
}

savedCoordinates = {};
function showWorkflow(e) {
    e.preventDefault();
    //get WorkFlowID
    //impostazione dei valori di default per la lettura da DB. IL default e' la lettura delle tab Magic_Workflow... in fase di lancio della showWorkflow possono 
    //essere immesse nel payload delle tabelle di source e destinazione differenti.
    var workflowstatustabspecs = { tablename: "Magic_WrkflwActOutStatus" };
    var workflowtabspecs = { tablename: "dbo.Magic_Workflow", PK: "ID" };
    var precendencestab = "dbo.v_Magic_WorkflowPrecedences";
    var activitiestab = "dbo.Magic_WorkFlowActivities";
    var workflowidfield = "ID";
    var workflowdescriptionfield = "Description";
    var orderbyactivitytabfieldnum = "8";
    //questo oggetto descrive come e' fatta la tabella delle precedenze
    var destinationprecedencestablespecs = {};
    destinationprecedencestablespecs.tablename = "dbo.Magic_WorkflowPrecedences";
    destinationprecedencestablespecs.PK = "ID";
    destinationprecedencestablespecs.Activity_ID = "Activity_ID";
    destinationprecedencestablespecs.PrevActivity_ID = "PrevActivity_ID";

    destinationprecedencestablespecs.PrevStatus_ID = "PrevOutStatus_ID";

    var jsonpayload = {};
    try {
        jsonpayload = JSON.parse(rowbuttonattributes[$(e.currentTarget)[0].className].jsonpayload);
        precendencestab = jsonpayload.precendencestab;
        activitiestab = jsonpayload.activitiestab;
        workflowidfield = jsonpayload.workflowidfield;
        workflowdescriptionfield = jsonpayload.workflowdescriptionfield;
        orderbyactivitytabfieldnum = jsonpayload.orderbyactivitytabfieldnum;
        destinationprecedencestablespecs.tablename = jsonpayload.precwrite;
        destinationprecedencestablespecs.Activity_ID = jsonpayload.precwriteactivitiy_id;
        destinationprecedencestablespecs.PrevActivity_ID = jsonpayload.precwriteprevactivitiy_id;
        destinationprecedencestablespecs.PrevStatus_ID = jsonpayload.precwriteprevstatus_id;
        destinationprecedencestablespecs.PK = jsonpayload.precwritepk;
        workflowtabspecs.tablename = jsonpayload.workflowtable;
        workflowtabspecs.PK = jsonpayload.workflowpk;
        workflowstatustabspecs.tablename = jsonpayload.workflowstatustable;
    }
    catch (e) {
        console.log("jsonpayload is not a valid json or is empty:" + e.message);
    }


    //var workflowid = $(e.delegateTarget).data("kendoGrid").dataItem($(e.currentTarget).closest("tr")).ID;
    //var workflowdescription = $(e.delegateTarget).data("kendoGrid").dataItem($(e.currentTarget).closest("tr")).Description;

    var workflowid = $(e.delegateTarget).data("kendoGrid").dataItem($(e.currentTarget).closest("tr"))[workflowidfield];
    var workflowdescription = $(e.delegateTarget).data("kendoGrid").dataItem($(e.currentTarget).closest("tr"))[workflowdescriptionfield];
    var coordinates;
    if (workflowid in savedCoordinates) {
        coordinates = savedCoordinates[workflowid];
    }
    else
        coordinates = JSON.parse($(e.delegateTarget).data("kendoGrid").dataItem($(e.currentTarget).closest("tr"))["EndpointCoordinates"]);
    var endpointmodel = '<div class="w" style="top:{2}em;left:{3}em;{4}" id="{0}">{1}<div class="ep"></div></div>';  //{0} id =act_activityid , 1 activity Description
    //GetWorkFlow operations ordered by Ordinal Position
    var precedences = {};
    //opero la get di tutte le precedenze costruendo un' hash table che abbia come key l' ID di un' attivita' e come values le attivita' che la precedono
    $.ajax({
        type: "POST",
        async: false,
        url: manageAsyncCallsUrl(false, "/api/DocumentRepository/GetWorkflowPrecedences"), //"/api/DocumentRepository/GetWorkflowPrecedences",
        data: JSON.stringify({ table: precendencestab, Workflow_ID: "" + workflowid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            if (result.Count > 0) {
                $.each(result.Data[0].Table, function (index, value) {
                    if (precedences[value.Activity_ID] !== undefined) {
                        precedences[value.Activity_ID].push(value);
                    }
                    else {
                        precedences[value.Activity_ID] = [];
                        precedences[value.Activity_ID].push(value);
                    }
                })
            }
        }
    });

    $.ajax({
        type: "GET",
        url: "/api/DocumentRepository/GetWorkflowActivities/" + workflowid, //ORDER BY COL 8, ActivityLevel
        //  data: JSON.stringify({ table: activitiestab, order: orderbyactivitytabfieldnum, where: "isnull(Active,0)<>0 AND Workflow_ID =" + workflowid }),
        contentType: "application/json; charset=utf-8",
        //dataType: "json",
        success: function (result) {
            if (result.Count == 0) {
                kendoConsole.log("Workflow has no steps.", "info");
                return;
            }
            //Create Window with fixed height and width
            $("#jsplumbcontainerwindow").remove();

            var innerhtml = '<div id="jsplumbcontainerwindow"><div id="mainjsplumb" style="position: relative;">\
                <div class="explanation" style="position: absolute; top: 5px;"><h4 style="width: 70%; display: inline-block;">{0}</h4><a id="newButton">' + getObjectText('new') + '</a><a id="saveLayoutButton">' + getObjectText('saveLayout') + '</a><input id="diagramZoomDrop" value="1" style="width: 50px; float: right; margin-top: 8px; margin-right: 10px;"/></div>\
                <div id="statemachine-demo" class="jsplumbcontainer statemachine-demo" style="overflow: visible">\
                <div class="connectionmodification" style="position:absolute;display:none;border: solid #ccc 1px;z-index:10000;background-color:white;width:300px;text-align:left;">\
                                <div style="width:300px;background-color:whitesmoke;height: 16px;text-align: right;margin-bottom: 4px;border-bottom:solid 1px #ccc;"><div class="k-window-actions"><a  role="button" href="javascript:connectionwndclose();" class="k-window-action k-link"><span  role="presentation" class="k-icon k-i-close">Close</span></a></div></div>\
                                <div class="k-edit-label"><label>Delete Connection</label></div>\
                                <div class="k-edit-field"><a id="deleteconnectionbtn">Delete</a></div>\
                                <div class="k-edit-label" id ="outlab"><label>Output Condition</label></div>\
                                <div class="k-edit-field" id="outconddiv"><input id="outputconditiondd" type="text"></input></div>\
                                </div>\
                    {1}\
                </div></div></div>';

            var prevnode = null;
            var nodes = "";
            var orderedlist = [];
            var topoffset = 10;
            var leftoffset = 20;
            prevlevel = 0;
            var data = result.Data[0].Table;

            for (k = 0; k < data.length; k++) {
                if (data[k].ActivityLevel > prevlevel)
                    topoffset += 15;
                if (data[k].ActivityLevel === prevlevel)
                    leftoffset += 20;
                var backgroundcolor = "";
                if (data[k].IsOver === true)
                    backgroundcolor = "background-color:#1caf9a;"
                if (coordinates != null && coordinates["act_" + data[k].ID]) {
                    nodes += endpointmodel.format("act_" + data[k].ID, data[k].Description, coordinates["act_" + data[k].ID].top, coordinates["act_" + data[k].ID].left, backgroundcolor);
                }
                else {
                    nodes += endpointmodel.format("act_" + data[k].ID, data[k].Description, topoffset, leftoffset, backgroundcolor);
                }
                prevlevel = data[k].ActivityLevel;
            }

            loadCss(['jsplumb']);
            requireConfigAndMore(['jsPlumb'], function (jsPlumb) {

                $("#appcontainer").prepend(innerhtml.format(workflowdescription, nodes));
                $("#deleteconnectionbtn").kendoButton({
                    spriteCssClass: "k-icon k-i-cancel"
                });
                $("#newButton").kendoButton({
                    spriteCssClass: "k-icon k-add",
                    click: function () {
                        var $tr = $(e.currentTarget).closest('tr[data-uid]');
                        if ($tr.next().is('.k-detail-row')) {
                            //detailgrid already opened -> open  add window
                            $tr.next().find('[data-role=grid].Magic_WorkFlowActivities > .k-grid-toolbar > .k-grid-add').trigger("click");
                        } else {
                            //open detail grid and hide it
                            $tr.find('> .k-hierarchy-cell > a').trigger('click').trigger('click');
                            $('#appcontainer').one('kendoGridRendered', function (e, grid) {
                                //if detail grid rendered && gridcode = Magic_WorkFlowActivities
                                if (grid.options.code == "Magic_WorkFlowActivities") {
                                    //wait for databound, then open add window
                                    grid.one("dataBound", function () {
                                        grid.addRow();
                                    });
                                }
                            });
                        }
                    }
                }).css({ 'margin-top': '7px', float: 'right', 'margin-right': '10px' });;
                $("#saveLayoutButton").kendoButton({
                    spriteCssClass: "k-icon k-update",
                    click: saveJSPlumbDiagramLayout
                }).css({ 'margin-top': '7px', float: 'right', 'margin-right': '10px' });
                var dropData = [
                    { zoomFactor: 0.5, value: '50%' },
                    { zoomFactor: 0.75, value: '75%' },
                    { zoomFactor: 1, value: '100%' },
                    { zoomFactor: 1.5, value: '150%' }
                ];
                $("#diagramZoomDrop").kendoDropDownList({
                    dataTextField: "value",
                    dataValueField: "zoomFactor",
                    dataSource: dropData,
                    index: 1,
                    change: function () {
                        var value = $("#diagramZoomDrop").val();
                        $('#statemachine-demo').css({
                            "-webkit-transform": "scale(" + value + ")",
                            "-moz-transform": "scale(" + value + ")",
                            "-ms-transform": "scale(" + value + ")",
                            "-o-transform": "scale(" + value + ")",
                            "transform": "scale(" + value + ")",
                        });
                        if (value == 1.5) {
                            $('#statemachine-demo').css({
                                'margin': (value * 250) + 'px',
                                'margin-top': (value * 250) + 'px',
                            });
                            $('.explanation').css({
                                'top': '-' + ((value * 250) - 5) + 'px'
                            });
                        }
                        else if (value == 0.5) {
                            $('#statemachine-demo').css({
                                'margin-left': '-250px',
                                'margin-top': '-270px',
                                'height': (600 / value) + 'px'
                            });
                            $('.explanation').css({
                                'top': '275px',
                            });
                        }
                        else if (value == 0.75) {
                            $('#statemachine-demo').css({
                                'margin-left': '-130px',
                                'margin-top': '-90px',
                                'height': (600 / value) + 'px'
                            });
                            $('.explanation').css({
                                'top': '95px',
                            });
                        }
                        else {
                            $('#statemachine-demo').css({
                                'margin': '0px',
                                'margin-top': '0px',
                            });
                            $('.explanation').css({
                                'top': '5px',
                                'left': '0px'
                            });
                        }
                        jsPlumb.setZoom(value);
                    }
                });
                $("#diagramZoomDrop").parent().css({ display: 'inline-block', 'margin-bottom': '10px', 'margin-left': '10px' });

                var instance = initializeWorkFlowJsPlumbInstance("statemachine-demo", destinationprecedencestablespecs, workflowtabspecs, workflowstatustabspecs);

                var activitiewithprevioussarray = Object.keys(precedences);
                //itero le attivita' che hanno precedenze
                for (var i = 0; i < activitiewithprevioussarray.length; i++) {
                    //scorro le precedenze e creo le connessioni
                    for (var j = 0; j < precedences[activitiewithprevioussarray[i]].length; j++) {
                        var conn = instance.connect({
                            source: "act_" + precedences[activitiewithprevioussarray[i]][j].PrevActivity_ID.toString(),
                            target: "act_" + activitiewithprevioussarray[i].toString(),
                            parameters: {
                                transitionlabel: precedences[activitiewithprevioussarray[i]][j].PrevStatusCondition == null ? "" : precedences[activitiewithprevioussarray[i]][j].PrevStatusCondition,
                                connectionId: precedences[activitiewithprevioussarray[i]][j].ID,
                                currentOutputStatusId: precedences[activitiewithprevioussarray[i]][j].Condition_ID
                            }

                        });
                    }
                }
                console.log(instance);
                jsPlumb.fire("jsPlumbDemoLoaded", instance);
                $("#jsplumbcontainerwindow").kendoWindow({ width: "95%", height: "90%" }).data("kendoWindow").center();
                $("#jsplumbcontainerwindow").data('workflowID', workflowid);
                $("#jsplumbcontainerwindow").data('workflowtabspecs', workflowtabspecs);
            });

        }
    });

}

function saveJSPlumbDiagramLayout() {
    var workflowid = $("#jsplumbcontainerwindow").data('workflowID');
    var workflowtabspecs = $("#jsplumbcontainerwindow").data('workflowtabspecs');

    if (typeof workflowid == 'undefined')
        return;
    var containerId = '#mainjsplumb',
        elementsId = '.w';
    Objs = {};
    $(containerId + ' ' + elementsId).each(function () {
        var elem = $(this),
            left = elem.css('left').replace('px', ''),
            top = elem.css('top').replace('px', '');
        //width = elem.css('width').replace('px', ''),
        //height = elem.css('height').replace('px', '');
        Objs[$(this).attr('id')] = { left: $(left).toEm(), top: $(top).toEm()/*, width: $(width).toEm(), height: $(height).toEm()*/ };
    });
    var data = {};
    data["EndpointCoordinates"] = JSON.stringify(Objs);
    data[workflowtabspecs.PK] = workflowid;
    //var data = { EndpointCoordinates: JSON.stringify(Objs), ID: workflowid };
    savedCoordinates[workflowid] = Objs;
    var dataforpost = buildGenericPostInsertUpdateParameter("update", workflowtabspecs.tablename, workflowtabspecs.PK, "dbo.Magic_Cmnds_ins_upd_del_stmt", "JSON", null, null, data, workflowid);
    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/PostU/" + workflowid,
        data: dataforpost,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log("OK", false);
        },
        error: function (message) {
            kendoConsole.log(message.responseText, true);
        }
    });
}

scopeVal = '';
$.fn.toEm = function (settings) {
    settings = jQuery.extend({
        scope: 'body'
    }, settings);
    var that = parseInt(this.selector, 10);
    if (scopeVal == '') {
        var scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo(settings.scope);
        scopeVal = scopeTest.height();
        scopeTest.remove();
    }
    return (that / scopeVal).toFixed(8);
}
//#endregion

//#region treemanager
//lancia un report a partire dal tree 
function openReportOnSelect(e) {
    var nodeinfo = $(e.sender.element).data("kendoTreeView").dataItem(e.node);
    var link = nodeinfo.gridtoopen;
    if ($("#reportmaindiv").length > 0)
        $("#reportmaindiv").empty();
    else {
        $("#appcontainer").append('<div id="reportmaindiv"></div>');
        $('#templatecontainer, #reportmaindiv').wrapAll('<div id="right-pane" >');
        $(e.sender.element).wrap('<div id="left-pane" >');
        $('#left-pane,#right-pane').wrapAll('<div id="splitterdivfunc" style="height:900px;">');
        $("#splitterdivfunc").kendoSplitter({
            panes: [
                { collapsible: true, resizable: true, size: "15%" },
                { collapsible: false, resizable: true, size: "84%" }
            ]
        });
    }
    appendReportToPage(link, "reportmaindiv");



}
//apertura di griglia sul click del nodo 
function openGridOnSelect(e) {
    setuserrightsinwindow();
    var nodeinfo = $(e.sender.element).data("kendoTreeView").dataItem(e.node);
    //vado nel container del tree dove ho settato le proprieta' di Funzione in fase di costruzione del tree convertDatabaseToLocalJSONTree
    var functionname = $(e.sender.element).parents(".k-content").prop("functionname");
    var functionid = $(e.sender.element).parents(".k-content").prop("functionid");
    var layer = $(e.sender.element).parents(".k-content").prop("layer");

    //destroy kendo grid
    if ($("#grid").data("kendoGrid") != undefined) {
        $("#grid").data("kendoGrid").destroy();
        $("#grid").remove();
        $("#right-pane").append('<div id="grid" style="margin-left:5px;margin-right:5px;"></div>');
    }

    if ($("#treegridtitle").length === 0) {
        $("#right-pane").prepend('<h3 class="sub-title-tree" style="margin-left:5px;"><span id ="treegridtitle" >' + nodeinfo.title + '</span></h3>');
        $("#grid").css("margin-left", "5px");
        $("#grid").css("margin-right", "5px");
    }
    else
        $("#treegridtitle").text(nodeinfo.title);

    if (nodeinfo.gridtoopen !== null && nodeinfo.gridtoopen !== undefined) {
        var gridname = nodeinfo.gridtoopen.split('|')[0];    // PM_DISEVE_FIERE|{ "field":"ANADIF_ANAGRA_ID","operator":"eq","value":3468 }
        var gridobj = getrootgrid(gridname, functionname, null, functionid, layer);
        gridobj.autoBind = false;
        //filter from tree selection this is applied if no other filter is given...
        var filter = { field: gridobj.dataSource.schema.model["id"], operator: "eq", value: nodeinfo.assetid, type: "navigationFilter" };
        if (nodeinfo.gridtoopen.split('|').length > 1) {
            //16012018 FIX D.T combine by type
            var gridtoopen = nodeinfo.gridtoopen.split('|')[0];
            var filterfromDB = JSON.parse(nodeinfo.gridtoopen.split('|')[1]);
            filter = combineDataSourceFilters(filter, filterfromDB);
            //var filters = [];
            //$.each(nodeinfo.gridtoopen.split('|'), function (i, v) {
            //    if (i > 0) //scarto il gridname
            //        filters.push(JSON.parse(v));
            //})
            //filters.push(filter);
            //filter = { logic: "AND", filters: filters, type: "treefilter" };
        }
        gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, filter);

        var gridfromtree = renderGrid(gridobj, null, undefined, "grid");
        if (typeof postrenderdispatcher == 'function')
            postrenderdispatcher(gridobj, functionname, null, null);
        gridfromtree.data("kendoGrid").dataSource.read();

    }
}
//costruzione del tree a partire da un dataset ottenuto da SP (formato biz# like, tranne l' URL dei nodi che in questo caso e' un gridname + filter in JSON) 
function convertDatabaseToLocalJSONTreeSearchRoot(arrayofnodes) {
    for (var i = 0; i < arrayofnodes.length; i++) {
        if (arrayofnodes[i].TREE_PARENT_ID == -1)
            return arrayofnodes[i];
    }
}
function convertDatabaseToLocalJSONTreeSearchChildren(arrayofnodes, parentnodeid) {
    children = [];
    for (var i = 0; i < arrayofnodes.length; i++) {
        if (arrayofnodes[i].TREE_PARENT_ID == parentnodeid)
            children.push(arrayofnodes[i]);
    }
    return children;
}
//nodeid e' il nodo di partenza della ricerca ricorsiva, il tree e' dove appendo i nodi a mano a mano che li visito in arraykeytoinsert
function treerecursivevisit(tree, arrayofnodes, node, nodeparent, allnodes, startExpanded) {
    var expanded = false;
    if (startExpanded == true)
        expanded = true;
    if (nodeparent === null) //root
    {
        tree.push({ selected: node.TREE_SELECTED, expanded: node.TREE_OPEN || expanded, assettoexplode: node.TREE_LABEL, gridtoopen: node.TREE_URL, assetid: node.TEMP_OBJ_ID, nodeid: node.TREE_ID, nodeparentid: node.TREE_PARENT_ID, type: node.TEMP_OBJ_TYPE, imageUrl: node.TREE_ICON, title: node.TREE_TITLE, items: [] });
    }
    else {
        nodeparent.items.push({ selected: node.TREE_SELECTED, expanded: node.TREE_OPEN, assettoexplode: node.TREE_LABEL, gridtoopen: node.TREE_URL, assetid: node.TEMP_OBJ_ID, nodeid: node.TREE_ID, nodeparentid: node.TREE_PARENT_ID, type: node.TEMP_OBJ_TYPE, imageUrl: node.TREE_ICON, title: node.TREE_TITLE, items: [] });
    }
    //get current node list of children
    var children = convertDatabaseToLocalJSONTreeSearchChildren(allnodes, node.TREE_ID);
    //go back to its caller if this is a leaf
    if (children.length === 0) {
        if (nodeparent !== null) {
            //se non ho figli cancello l' oggetto aggiunto e lo riaggiungo togliendo gli items (evita di mostrare il > per aprire il nodo se non ha figli)
            nodeparent.items.splice(-1);
            nodeparent.items.push({ selected: node.TREE_SELECTED, expanded: node.TREE_OPEN, assettoexplode: node.TREE_LABEL, gridtoopen: node.TREE_URL, assetid: node.TEMP_OBJ_ID, nodeid: node.TREE_ID, nodeparentid: node.TREE_PARENT_ID, type: node.TEMP_OBJ_TYPE, imageUrl: node.TREE_ICON, title: node.TREE_TITLE });
        }
        return;
    }

    //recur into children
    var index = 0;
    var treenode = null;
    if (nodeparent !== null) {
        index = nodeparent.items.length - 1;
        treenode = nodeparent.items[index];
    }
    for (var i = 0; i < children.length; i++) {
        //node becomes parent in the next call
        if (nodeparent == null) // se il parent e' nullo significa che il current tree node e' la root
            treenode = tree[0];
        treerecursivevisit(tree, children, children[i], treenode, allnodes, startExpanded);
    }
}
function refreshtree() {
    var data = window.refreshtreedata;
    if (data && data.datasource) {
        convertDatabaseToLocalJSONTree(data.datasource, data.treeobj.Name, data.treeobj.Description, data.treeobj.MagicTree_ID, data.hasgrids, data.treeobj.DraggableNodes, data.treeobj.NodesItemTemplate, data.treeobj.OnSelectNodeJSFunction, data.treeobj.OnDragEndJSFunction, data.treeobj.OnDragStartJSFunction, data.funcname, data.functid, data.layerid, data.treeobj.StartExpanded, data.treecontainer, data.showtreedescription, data.hidenodeselector, data.callback);
    }
}
//api per creare il tree definito in Magic_Trees sulla base del nome
//options.name = nome del tree oobligatorio
//options.data = oggetto JS da passare nell' xml in input alla stored di selezione indicata nel datasource del tree nei CustomJSONParam
//options.showTreeDescription = mostrare h3 con la descrizione del Tree presa da DB (default true) 
function getrootAndRenderDBTree(options) {
    $.getJSON("/api/Magic_Trees/GetByName/" + options.name, createtree);
    function createtree(thetreeobj) {
        var ds = buildGenericSelectDataSource(thetreeobj.DataSourceRead, thetreeobj.DataSourceCustomJSONParam, thetreeobj.BaseEntityName, -1, options.data);
        var functionhasgrids = false;
        if (options.altNodeTemplate)
            thetreeobj.NodesItemTemplate = options.altNodeTemplate;
        convertDatabaseToLocalJSONTree(ds, thetreeobj.Name, thetreeobj.Description, thetreeobj.MagicTree_ID, functionhasgrids, thetreeobj.DraggableNodes, thetreeobj.NodesItemTemplate, thetreeobj.OnSelectNodeJSFunction, thetreeobj.OnDragEndJSFunction, thetreeobj.OnDragStartJSFunction, null, -1, null, thetreeobj.StartExpanded, options.treecontainer, options.showtreedescription, options.hidenodeselector, options.callback);
        window.refreshtreedata = { datasource: ds, treeobj: thetreeobj, layerid: null, funcname: null, funcid: -1, hasgrids: functionhasgrids, treecontainer: options.treecontainer, showtreedescription: options.showtreedescription, hidenodeselector: options.hidenodeselector, callback: options.callback };
    }
}
//Crea il Tree a partire da un dataset piatto creato con una Stored Prcedure con la lista dei nodi ed i campi Tree_ID e Tree_PARENT_ID per ogni nodo
function convertDatabaseToLocalJSONTree(ds, name, description, databasetreeid, functionhasgrids, draggable, itemstemplate, selectNodeFunction, dragStartFunction, dropFunction, functionname, functionid, layer, startExpanded, outertreecontainer, showdescr, hidenodeselector, callback) {
    //formato node url = { "gridcode":"..." , { "filters": [{  "value":"..." }]}}

    //formato oggetto JS tree per MF :  {assettoexplode:"descriz. nodo",type:"tipo nodo", expanded:true,imageUrl:"/Magic/Styles/Images/group.png",items:[ array di children nodes dello stesso formato]};
    ds.schema.parse = function (response) {
        //caso di dati da DataTable da C# 
        if (response.Data != null)
            if (response.Data.length >= 1)
                if (response.Data[0].Table != undefined) {
                    var array = response.Data[0].Table;
                    var tree = [];
                    var root = convertDatabaseToLocalJSONTreeSearchRoot(array);
                    treerecursivevisit(tree, array, root, null, array, startExpanded);
                    var outc = (outertreecontainer && outertreecontainer.indexOf("#") != -1) ? outertreecontainer.replace("#", '') : outertreecontainer;
                    var treecontainerid = outc ? outc + "_" + "thetreecontainer_" + name : "thetreecontainer_" + name;
                    var treedomid = outc ? outc + "_" + name + "_" + databasetreeid : name + "_" + databasetreeid;
                    var treeSearchdomid = outc ? outc + "_" + name + "_" + databasetreeid + "_search" : name + "_" + databasetreeid + "_search";

                    buildHtmlTree(treecontainerid, treedomid, draggable, itemstemplate, selectNodeFunction, dropFunction, dragStartFunction, treeSearchdomid, false, true, outertreecontainer, showdescr);
                    //tree contains all the definition
                    renderTree(tree, treecontainerid, treedomid, description, treeSearchdomid);
                    if (typeof callback == "function")
                        callback();
                    if (hidenodeselector)
                        $(hidenodeselector).hide();
                    var treecontainerdiv = "#" + treecontainerid;
                    var $tree = $(treecontainerdiv).prop("layer", layer).prop("functionname", functionname).prop("functionid", functionid);
                    //se la funzione ha griglie + tree e non e' ancora stato fatto opero lo split in 2 dello schermo
                    if (functionhasgrids && ($("#left-pane").length === 0)) {
                        //wrap the tree and the grid ()
                        $('#templatecontainer, #grid').wrapAll('<div id="right-pane" class="col-lg-9">');
                        $tree.wrap('<div id="left-pane" class="col-lg-3">');
                        $("#left-pane").prepend('<div id="mf_tree_expander_btn" class="hidden-xs hidden-sm" style="cursor: pointer;p osition:absolute; top: 25px; right: 20px; text-align:right;"><i class="fa fa-plus-circle" style="margin-right: 5px;" onclick="increaseColMd(\'#left-pane\', 12, true);increaseColMd(\'#right-pane\', 12, true)"></i><i class="fa fa-minus-circle" onclick="increaseColMd(\'#left-pane\', 3, true);increaseColMd(\'#right-pane\', 9, true)"></i></div>');
                        //$('#left-pane,#right-pane').wrapAll('<div id="splitterdivfunc" class="row" style="height:600px;">');
                        $('#left-pane,#right-pane').wrapAll('<div id="splitterdivfunc" class="row">');
                    }
                    if (functionhasgrids && $("#left-pane").length) {
                        $("#mf_tree_expander_btn").remove();
                        $("#left-pane").prepend('<div id="mf_tree_expander_btn" class="hidden-xs hidden-sm" style="cursor: pointer;p osition:absolute; top: 25px; right: 20px; text-align:right;"><i class="fa fa-plus-circle" style="margin-right: 5px;" onclick="increaseColMd(\'#left-pane\', 12, true);increaseColMd(\'#right-pane\', 12, true)"></i><i class="fa fa-minus-circle" onclick="increaseColMd(\'#left-pane\', 3, true);increaseColMd(\'#right-pane\', 9, true)"></i></div>');
                    }
                    $("#rootrefresh").click(refreshtree);
                }
        return response;
    };
    //scatena la creazione asincrona del tree
    var dsobj = new kendo.data.DataSource(ds);
    //quando i dati arrivano viene scatenato la function implementata e bindata allo schema.parse (kendo standard behaviour) che crea l' albero in pagina
    //in modo asincrono
    dsobj.read();
}
//costruzione del tree da controller a partire da una certa root richiamando un controller che restituisce il tree gia' risolto in C#
function getJSONTree(rootgroupid, controller, method) {
    var parstring = { "rootgroupid": rootgroupid };
    var response = getdatasource(controller, "", method, "", parstring);
    var tree = [];
    tree = eval("[" + response.join("") + "]");
    return tree;
}

function collapseTree(treedomid) {
    var treeview = $("#" + treedomid).data("kendoTreeView");
    treeview.toggle(".k-item:first");
}
//crea un tree con search string e titolo
//treecontainerdomid = domid del div che contiene il tree 
//treedomid = domid del tree 
//datadraganddrop = se abilitare il drag and drop valori "true" o "false" (null = false)
// datatemplate = template kendo per rappresentare il nodo
// dataselect = funzione javascript da scatenare onselect di un nodo 
// datadrop = funzione js da scatenare on drop
// datadragstart = funzione js da scatenare allo start del drag
// domid della ricerca testuale di  nodi sul tree
//addrootbutton = false  per non avere in automatico il pulsante di ADD sulla root , true  o undefined lo mette
function buildHtmlTree(treecontainerdomid, treedomid, datadraganddrop, datatemplate, dataselect, datadrop, datadragstart, treesearchdomid, addrootbutton, addrefreshbutton, outercontainer, showdescr) {
    var rootaddbutton = "";
    if (addrootbutton === true || addrootbutton === undefined)
        rootaddbutton = '<span class="treeButton"><a class="k-button" id="root"><span class="k-icon k-add"></span></a></span>';
    var rootaddrefreshbutton = "";
    if (addrefreshbutton === true)
        rootaddrefreshbutton = '<span class="treeButton"><a class="k-button" id="rootrefresh"><span class="k-icon k-i-refresh"></span></a></span>';

    var collapsebutton = '<span class="treeButton"><a onclick="collapseTree(\'' + treedomid + '\');" class="k-button" id="rootexpcoll"><span class="k-icon k-i-collapse"></span></a></span>';

    var htmltreetemplate = '<div id="{0}" class="k-content" style="background-color: transparent;margin-left:5px;margin-right:5px; ">\
                            <div class="demo-section files">\
                                {8}\
                                <div class="input-group" style="margin-bottom:5px;">\
                                                <span class="input-group-addon">\
                                                    <i class="k-icon k-i-search"></i>\
                                                </span>\
                                                <span class="twitter-typeahead" style="position: relative; display: inline-block; direction: ltr;">\
                                                    <input type="text" class="form-control tt-hint" disabled="" autocomplete="off" spellcheck="false" style="position: absolute; top: 0px; left: 0px; border-color: transparent; box-shadow: none; background-attachment: scroll; background-clip: border-box; background-color: rgb(255, 255, 255); background-image: none; background-origin: padding-box; background-size: auto; background-position: 0% 0%; background-repeat: repeat repeat;">\
                                                    <input type="text" id="{7}" name="treesearch" class="form-control tt-input" autocomplete="off" spellcheck="false" dir="auto" style="position: relative; vertical-align: top; background-color: transparent;">\
                                                    <pre aria-hidden="true" style="position: absolute; visibility: hidden; white-space: pre; font-family: \'Open Sans\', sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: 400; word-spacing: 0px; letter-spacing: 0px; text-indent: 0px; text-rendering: auto; text-transform: none;"></pre>\
                                                    <span class="tt-dropdown-menu" style="position: absolute; top: 100%; z-index: 100; display: none; left: 0px; right: auto;">\
                                                        <div class="tt-dataset-0"></div>\
                                                    </span></span>\
                                            </div>\
                                <div id="newRootItem"><img class="k-image" alt="" src="/Magic/Styles/Images/tree.png">' + collapsebutton + rootaddbutton + rootaddrefreshbutton + '</div>\
                                <div id ="{1}" data-role="treeview"\
                                    {2} \
                                    data-text-field="assettoexplode" \
                                    {3} \
                                    {4} \
                                    {5} \
                                    {6} \
                                    data-bind="source: files">\
                                </div>\
                            </div>\
                        </div>';

    var datadraganddropstring = datadraganddrop == null ? "" : "data-drag-and-drop=\"" + datadraganddrop + "\"";
    var datatemplatestring = datatemplate == null ? "" : "data-template=\"" + datatemplate + "\"";
    var dataselectstring = dataselect == null ? "" : "data-select=\"" + dataselect + "\"";
    var datadropstring = datadrop == null ? "" : "data-drop=\"" + datadrop + "\"";
    var datadragstartstring = datadragstart == null ? "" : "data-drag-start=\"" + datadragstart + "\"";
    var descr = "";
    if (showdescr == true || showdescr == undefined || showdescr == null)
        descr = '<h3 class="sub-title-tree"><span data-bind="text: name"></span></h3>';
    var htmltoappend = htmltreetemplate.format(treecontainerdomid, treedomid, datadraganddropstring, datatemplatestring, dataselectstring, datadropstring, datadragstartstring, treesearchdomid, descr);
    var containeroftree = "#appcontainer";
    if ($("#" + treecontainerdomid).length > 0) { //caso di un refresh
        $("#" + treecontainerdomid).remove();
        if ($("#left-pane").length > 0)
            containeroftree = "#left-pane";
    }
    if (outercontainer)
        containeroftree = outercontainer;
    $(containeroftree).prepend(htmltoappend); //add the html tree components in page

}
function renderTree(tree, treecontainerdomid, treedomid, treetitle, treesearchdomid) {
    viewModel = kendo.observable({
        name: treetitle,
        files: kendo.observableHierarchy(tree),
        printFiles: function () {
            // helper function that prints the relevant data from the hierarchical model
            var items = this.get("files").toJSON();

            function removeFields(item) {
                delete item.index;

                if (item.items.length == 0) {
                    delete item.items;
                } else {
                    item.items = $.map(item.items, removeFields);
                }

                return item;
            }

            $.map(items, removeFields);

            var jsonString = JSON.stringify(items, null, 2);

            return jsonString.replace(/\n/gi, "\n    ")
                .replace(/\n\s*("name)/gi, " $1")
                .replace(/\n\s*("id)/gi, " $1")
                .replace(/\n\s*("type)/gi, " $1")
                .replace(/\n\s*("expanded)/gi, " $1")
                .replace(/\n\s*("selected)/gi, " $1")
                .replace(/\n\s*("items)/gi, " $1")
                .replace(/\s*\n\s*(})/gi, " $1")
                .replace(/(\s*)]\n\s*}/gi, "] }");
        }
    });


    var treesearcher = function () {
        var thetree = $("#" + treedomid).data('kendoTreeView');
        thetree.expand(".k-item");
        var filterText = $("#" + treesearchdomid).val();
        if (filterText !== "") {
            $("#" + treedomid + " .k-group .k-group .k-in").closest("li").hide();
            $("#" + treedomid + " .k-group .k-group .k-in:containsIgnoreCase('" + filterText + "')").each(function () {
                $(this).parents("ul, li").each(function () {
                    $(this).show();
                });
                //visualizzo i figli TODO valutare se fare ricorsivo
                $.each(thetree.dataItem(this).items, function (i, value) {
                    var uid = value.uid;
                    $(thetree.findByUid(uid)).show()
                });
            });
        }
        else {
            $("#" + treedomid + " .k-group").find("ul").show();
            $("#" + treedomid + " .k-group").find("li").show();
        }
    }

    kendo.bind($("#" + treecontainerdomid), viewModel);
    $("#" + treesearchdomid).keyup(treesearcher);


}
//#endregion
//#region usersfunction
function loginAs(e) {
    console.log(e);
    var info = getRowDataFromButton(e);
    $.get("/api/Magic_Mmb_Users/SetSessionUser/" + info.UserID, function (data) {
        console.log(data);
        location.reload();
    });
}

//funzione configurata nella griglia utenti per l' edit 
function userEditOverride(e, functionname, gridname) {
    if (!e.model.isNew()) {//sono in modifica
        $("input[name=Password]").attr("readonly", "readonly");
        $("input[name=Username]").attr("readonly", "readonly");
    }

    getStandardEditFunction(e, functionname, gridname);
}

function resetUserPassword(e) {
    e.preventDefault();
    var username = $("#grid").data("kendoGrid").dataItem($(e.currentTarget).closest("tr")).Username;


    $.ajax({
        type: "POST",
        url: "/api/Magic_Mmb_Users/resetPassword",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ user: username }),
        success: function (result) {
            kendoConsole.log(result.message, "info");
        },
        error: function (result) {
            kendoConsole.log(result.responseText, true);
        }
    });
}

//#endregion
//#region GRIDAPI
//da mettere nel dataBound per avere il collapse by default dei raggruppmanenti pre-impostati
function triggercollapse(e) {
    var grid = this;
    if ($(grid.element).find("tr.k-grouping-row .k-icon.k-i-collapse").length == 0) //se non ci sono raggruppamenti nascondo il bottone
        $(grid.element).find(".k-button.collman").hide();
    else //lo mostro  e faccio il trigger
    {
        $(grid.element).find(".k-button.collman").show();
        $(grid.element).find(".k-button.collman").trigger("click");

    }
}
function collapseExpand(e) {
    var jqgrid = $(e).closest(".k-grid");
    if ($(e).html().indexOf("k-i-collapse") != -1) {
        //collapse all
        jqgrid.find("tr.k-grouping-row .k-icon.k-i-collapse").trigger("click");
        //turn it into expand
        $(e).html('<span class="k-icon k-i-expand"></span>');
    }
    else {
        jqgrid.find("tr.k-grouping-row .k-icon.k-i-expand").trigger("click");
        $(e).html('<span class="k-icon k-i-collapse"></span>');
    }
}
//da mettere nei data bounds per nascondere le colonne raggruppate
function hideGroupedColumns(o) {
    try {
        var grid = this;
        var gridname = $(grid.element).attr("gridname");
        var gridcontid = "";
        try {
            gridcontid = $(grid.element).parents(".k-content").attr("id");
        }
        catch (Err) {
            console.log("rootGrid");
        }
        for (var i = 0; i < this.columns.length; i++) {
            if (window.groupedcols[gridname].indexOf(this.columns[i].field + gridcontid) != -1)
                grid.showColumn(i);
        }
        grid.element.find("div.k-group-indicator").each(function (i, v) {
            grid.hideColumn($(v).data("field"));
            var colid = $(v).data("field") + gridcontid;
            if (window.groupedcols[gridname].indexOf(colid) == -1)
                window.groupedcols[gridname].push(colid);
        });
    }
    catch (err) {
        console.log("WARN - hide grouped columns failed")
    }
}

//permette di operare un override del parameterMap standard in modo da passare alla griglia un parametro supplementare data da passare come js object
function overrideParameterMap(entityname, storedprocedure, data) {
    return function (options, operation) {
        options.EntityName = entityname;
        options.data = JSON.stringify(data);
        options.layerID = null;
        options.functionID = null;
        options.operation = operation;
        options.Model = null;
        options.Columns = [];
        options.DataSourceCustomParam = '{ read: { type: "StoredProcedure", Definition:"' + storedprocedure + '"} }';
        return kendo.stringify(options);
    }
}

function checkboxContainerEditor(container, options) {
    // create an input element
    var input = $("<input type='checkbox'/>");
    // set its name to the field to which the column is bound ('name' in this case)
    input.attr("name", options.field);
    //add the checkboxClicked onclick
    input.attr("onclick", "checkboxClicked(this,'" + options.field + "','single');");
    // append it to the container
    input.appendTo(container);
}
//edit di checkbox in cell , se passato un valore (qualunque) nel terzo parametro si potra' avere 1 solo checkbox nella stessa griglia a true alla volta
//radioInputs is the ordered list of radio checkboxes columns
function checkboxClicked(element, fieldname, isSingleSelect, radioInputs) {
    var isChecked = element.checked;
    var $grid = $(element).parents(".k-grid");
    grid = $grid.data("kendoGrid");
    var currentcell = $(element).parents("[role=gridcell]"); /* you have to find cell containing check box*/
    var $currentrowcheckboxes = $(element).closest("tr").find("td[role=gridcell] input[type=checkbox]");
    var $allcheckedinputs = $(grid.element).find("input:checked"); //set di checkbox a true presente nella griglia corrente

    if (grid.options.editable == true) {
        //horizontal (radio) selection in same row 
        if (radioInputs && isChecked) //restrict the checkboxes selection to current row
        {
            $currentrowcheckboxes.each(function (i, v) {
                var cell = $(this).closest("[role=gridcell]"); /* you have to find cell containing check box*/
                //        grid.editCell(cell);
                grid.dataItem(cell.closest("tr"))[radioInputs[i]] = (cell.attr("id") == "grid_active_cell");
                grid.dataItem(cell.closest("tr")).dirty = true;
                if (!(cell.attr("id") == "grid_active_cell"))
                    $(this).removeAttr("checked");
            });
        }
        //vertical multi row single selection on same field
        else if (isSingleSelect && isChecked) //devo mettere in edit ed a false  
        {
            $allcheckedinputs.each(function () {
                var cell = $(this).parents("[role=gridcell]"); /* you have to find cell containing check box*/
                grid.editCell(cell);
                grid.dataItem(cell.closest("tr")).set(fieldname, false);
            });
        }
        if (!radioInputs) {
            grid.editCell(currentcell);
            grid.dataItem(currentcell.closest("tr")).set(fieldname, isChecked);
        }

        //if i'm inside a magic-form i immdiately confirm changes (multicheck scenario with more than one page)
        if ($grid.attr("sf-input-options"))
            $grid.find("a.k-grid-save-changes").click();

    }
    else {
        element.checked = !isChecked;
    }
};

function buildToolbarButtons(cmdtext, cmdclass, cmddomid, cmdjsonclick, floatTo, iconspanToset, jsonpayload, storedprocedure, storedproceduredataformat) {
    if (cmdjsonclick == null)
        cmdjsonclick = "genericToolbarButtonFunction";

    var iconspan = '';
    if (iconspanToset !== undefined && iconspanToset != null)
        iconspan = iconspanToset;

    var floatto_ = " pull-right";
    if (!floatTo)
        floatto_ = ' ';
    if (floatTo == "left")
        floatto_ = " pull-left";


    if (cmdclass === "" && cmdtext === "Export") {
        cmdclass = "k-button k-button-icontext";
        iconspan = '<span class="k-icon k-iconExcel"></span>';
    }
    else
        if (cmdclass === "" && cmdtext !== "Export")
            cmdclass = "k-button";
        else
            cmdclass = cmdclass + " k-button"
    var inputpar = 'this';

    toolbarbuttonattributes[cmddomid == "" ? cmdclass : cmddomid] = { jsonpayload: jsonpayload, storedprocedure: storedprocedure, storedproceduredataformat: storedproceduredataformat };
    return '<span class="' + cmdclass + floatto_ + '" style="text-align:center;" id="' + cmddomid + '" onclick="' + cmdjsonclick + '(this);">' + iconspan + getObjectText(cmdtext) + '</span>';
}

function exportToXls(e) {
    exportTofile(e, "xlsx");
}

async function exportTofile(e, format, getObjectOnly) {
    let gridname = $(e).closest(".k-grid").attr("gridName");
    exportobject = window.HashOfExportableGrids[gridname];
    delete exportobject.entity;
    delete exportobject.jsonparam;
    exportobject.gridname = gridname;
    exportobject.functionID = getCurrentFunctionID();

    let grid = $(e).closest(".k-grid").data("kendoGrid");
    var thegridtoexportds = grid.dataSource;
    var filter = thegridtoexportds.filter();
    if (filter) {
        filter = formatDateFilters(filter);//normalizzazione filtri su date.
    }
    exportobject.select = grid.columns.map(function (v) {
        if (v.field && v.field != null && v.field != '' && v.field != undefined)
            return v.field;
    }).filter(x => x);
    exportobject.columns = kendo.stringify(
        grid.columns
            .filter(c => !c.hidden)
    );
    ;
    if (!format)
        exportobject.format = "csv";
    else
        exportobject.format = format;
    exportobject.filter = filter === undefined ? null : filter;

    exportobject.sort = grid.dataSource.sort();
    if (!exportobject.sort) {
        delete exportobject.sort;
    }

    if (getObjectOnly) {
        return exportobject
    }

    doModal(true);
    try {
        await $.fileDownload('/api/GENERICSQLCOMMAND/ExportTofile/', { data: exportobject, httpMethod: "POST" });

    }
    catch (err) {
        console.error(err);
    }
    finally {
        doModal(false);
    }
}

function selectobjects(value) {
    if (typeof value === "object")
        return value;
}

function error(e) {
    setTimeout(function () { $(".k-widget .k-grid-update").show().prev().remove() }, 500);
    $("#grid-is-loading-spinner").remove();
    var grid;
    var found = false;
    $(".k-grid").each(function () {
        if (!found) {
            grid = $(this).data("kendoGrid");
            if (grid && grid !== null && grid.dataSource == e.sender) {
                found = true;
            }
        }
    });

    if (
        found &&
        e.xhr &&
        e.xhr.status == 400 &&
        typeof e.xhr.responseText == 'string' &&
        e.xhr.responseText.startsWith('{') &
        e.xhr.responseText.endsWith('}')
    ) {
        var response = JSON.parse(e.xhr.responseText);
        if (response.isValidation && (response.msgtype == 'WARN' || response.Warning)) {
            var template = kendo.template('<ul>' +
                '<li class="km-actionsheet-title">#:title#</li>' +
                '<li><a href="\\#" class="k-button k-grid-delete">#:confirm#</a></li>' +
                '</ul>');

            new kendo.mobile.ui.ActionSheet(template({
                title: response.message || response.Warning,
                confirm: getObjectText('save')
            }), {
                type: "phone",
                isDesktop: true,
                cancel: getObjectText('cancel'),
                cancelTemplate: '<li class="km-actionsheet-cancel"><a class="k-button" href="\\#">#:cancel#</a></li>',
                close: function () {
                    this.destroy();
                },
                command: function (ev) {
                    if (ev.currentTarget.is('.k-grid-delete')) {
                        this.destroy();
                        var modifiedData = e.sender.updated()
                            .concat(e.sender.created());
                        modifiedData.forEach(data => data.__ignoreWarnings = true);
                        e.sender.sync();
                        modifiedData.forEach(data => delete data.__ignoreWarnings);
                    }
                }
            }).open();
            return;
        }
    }

    //if (e.sender._destroyed.length == 0 && grid) // se e' una delete voglio che il rebind avvenga
    //{
    //    grid.one("dataBinding", function (e) {
    //        e.preventDefault(); // cancel grid rebind if error 
    //    });
    //}
    if (e.xhr != null) {//delete & update errors (HTTPResponse)
        // cancel changes
        if (e.sender._destroyed.length > 0)  //annullo la delete se in errore
            this.cancelChanges();
        kendoConsole.log(e.xhr.responseText, true);
        //alert(e.xhr.responseText); 
    }
    if (e.errors != null)  //insert errors
        kendoConsole.log(e.errors, true);
    //alert(e.errors);

}

function msgTypeToConsole(msgtype) {
    var consoleflag = false;
    switch (msgtype) {
        case "INF":
        case "OK":
            break;
        case "WARN":
            consoleflag = "info";
            break;
        case "ERR":
            consoleflag = true;
            break;
    }
    return consoleflag;
}

function renderGrid(rootgridobj, rootgridclass, container, gridid, title, appendToMagnifyModal = false, magnifyId = null) {

    var jquerygrid = null,
        $grid;
    if (gridid && gridid instanceof jQuery) {
        $grid = gridid;
    }
    else {
        gridid = gridid === undefined ? "grid" : gridid;

        if (appendToMagnifyModal) {
            $(container).append('<br><div id="' + gridid + '" class="' + rootgridclass + ' magnify-grid" data-magnify-id="' + magnifyId + '" data-role="grid"></div>');
        }
        else {
            //se il div non esiste lo creo preceduto da titolo se presente
            if ($("[id^=grid][data-role=grid]").length > 0 && $("#" + gridid).length == 0) // the div does not exists but other grids are in the page                 
                $("[id^=grid][data-role=grid]").last().after('<br><div id="' + gridid + '" data-role="grid"></div>');
            else
                if ($("#" + gridid).length == 0) //grid div is missing and it's the first grid of the page
                    $("#appcontainer").prepend('<br><div id="' + gridid + '" data-role="grid"></div>');
        }

        $grid = $("#" + gridid);
    }
    //Function Grid Title in Magic_FunctionGrids
    if (title !== "" && title != undefined)
        $grid.before('<h3>' + title + '</h3>');
    var element;
    var name = "";
    if ((rootgridclass === null) || (rootgridclass === undefined)) {
        element = $grid.kendoGrid(rootgridobj);
        $grid.attr("detailTemplateName", rootgridobj.detailTemplateName);
        $grid.attr("editableName", rootgridobj.editableName);
        $grid.attr("gridName", rootgridobj.code);
        $grid.attr("editablecolumnnumber", rootgridobj.editablecolumnnumber);
        $grid.attr("entityName", rootgridobj.EntityName);
        name = gridid;
        //Fix for Ios7 Ipad problem
        $grid.data("kendoGrid").one("dataBound", function (e) {
            var that = this;
            that.tbody[0].style.zoom = 1.1;
            setTimeout(function () {
                that.tbody[0].style.zoom = 1;
            });
        });
        jquerygrid = $grid;

    } else if (container.find("." + rootgridclass).length > 0) {
        jquerygrid = container.find("." + rootgridclass);
        jquerygrid.kendoGrid(rootgridobj);
        jquerygrid[0].id = rootgridclass;
        jquerygrid.attr("detailTemplateName", rootgridobj.detailTemplateName);
        jquerygrid.attr("editableName", rootgridobj.editableName);
        jquerygrid.attr("gridName", rootgridobj.code);
        jquerygrid.attr("editablecolumnnumber", rootgridobj.editablecolumnnumber);

        name = rootgridclass;
        jquerygrid.data("kendoGrid").one("dataBound", function (e) {
            var that = this;
            that.tbody[0].style.zoom = 1.1;
            setTimeout(function () {
                that.tbody[0].style.zoom = 1;
            });
        });
    }
    if (magnifyId) {
        jquerygrid.attr("magnifyId", magnifyId);
    }
    //enable fast search if the template is in the toolbar
    if (name !== "")
        //checkAndInitializeFastSearch(name,jquerygrid);
        checkAndInitializeFastSearch(jquerygrid);

    var grid = jquerygrid.data('kendoGrid');

    if (rootgridobj.gridExtension.maxContentHeight || window.grid_maxContentHeight)
        jquerygrid.find('.k-grid-content').css('max-height', (rootgridobj.gridExtension.maxContentHeight || window.grid_maxContentHeight));

    bindRemoveListenerToGrid(grid);

    if (grid.options.editable) {
        // For incell editing (or if editable is simply set to true)
        if (grid.options.editable === true || grid.options.editable == 'incell') {
            grid.bind('saveChanges', function (e) {
                manageGridUploadedFiles(jquerygrid);
            });
        } else {
            grid.bind('save', function (e) {
                // Check if the grid is inside a schema-form-grid
                const isInSchemaFormGrid = jquerygrid.closest('.schema-form-grid').length > 0;

                if (isInSchemaFormGrid) {
                    // Use the original synchronous approach for schema-form-grid
                    manageGridUploadedFiles(jquerygrid);

                    // For popup mode, also handle child grids
                    if (grid.options.editable === 'popup' || (grid.options.editable && grid.options.editable.mode === 'popup')) {
                        $('[ng-controller^="GridPopupChildGridsFormController"] .k-grid', e.container)
                            .each(function () { manageGridUploadedFiles($(this)); });
                    }
                } else {
                    // Use the new async approach for regular grids
                    e.preventDefault();

                    // Find the save button
                    const saveButton = e.container.find(".k-grid-save-changes, .k-grid-save, .k-grid-update");
                    const buttonExists = saveButton.length > 0;

                    // If button exists, check if it's already disabled
                    if (buttonExists && (saveButton.prop("disabled") || saveButton.hasClass("k-state-disabled"))) {
                        return; // Exit if a save operation is already in progress
                    }

                    // Disable the button if it exists
                    if (buttonExists) {
                        saveButton.prop("disabled", true).addClass("k-state-disabled");
                        saveButton.append('<span class="k-loading k-loading-inline"></span>');
                    } else {
                        console.warn("Save button not found in the container. Proceeding without button state management.");
                    }

                    // Single async function implementation
                    (async function () {
                        try {
                            // Wait for the main grid's file management to complete
                            await manageGridUploadedFiles(jquerygrid);

                            // In popup mode, also wait for file management on all child grids
                            if (grid.options.editable === 'popup' || (grid.options.editable && grid.options.editable.mode === 'popup')) {
                                const childGrids = $('[ng-controller^="GridPopupChildGridsFormController"] .k-grid', e.container).toArray();
                                await Promise.all(childGrids.map(element => manageGridUploadedFiles($(element))));
                            }

                            // Once all file management operations succeed, trigger the grid save
                            grid.dataSource.sync();
                        } catch (error) {
                            // If any file management call fails, log the error
                            kendoConsole.log("Errore durante il salvataggio del file.", "error");
                        } finally {
                            // Always re-enable the button when done (if it exists)
                            if (buttonExists) {
                                saveButton.prop("disabled", false).removeClass("k-state-disabled");
                                saveButton.find(".k-loading").remove();
                            }
                        }
                    })();
                }
            });
        }

        if (appendToMagnifyModal) {
            grid.dataSource.bind('requestEnd', function (e) {
                if (e.type == 'update') {

                    var parentGrid = $('[magnifyid=' + magnifyId + ']').not('.magnify-grid');
                    if (parentGrid.length) {
                        var parentKGrid = parentGrid.data("kendoGrid");
                        parentKGrid.dataSource.read();
                    }
                }
            });
        }
    }

    if (grid.options.columnMenu) {
        grid.bind('columnHide', setSessionStorageGridColumnSettings);
        grid.bind('columnShow', setSessionStorageGridColumnSettings);
        grid.bind('columnResize', setSessionStorageGridColumnSettings);
        grid.bind('columnLock', setSessionStorageGridColumnSettings);
        grid.bind('columnUnlock', setSessionStorageGridColumnSettings);
    }

    if (grid.options.reorderable) {
        var usersGridSettings = getSessionStorageGridSettings(grid.options.gridcode, grid.options.functionid);
        if (usersGridSettings.columnOrder && !$.isEmptyObject(usersGridSettings.columnOrder)) {
            var hasCustomOrder = false;
            $.each(usersGridSettings.columnOrder, function (field, pos) {
                $.each(grid.columns, function (k, col) {
                    if (col.field == field && pos != k) {
                        hasCustomOrder = true;
                        grid.reorderColumn(pos, col);
                        return false;
                    }
                });
            });
            if (!hasCustomOrder)
                deleteSessionStorageGridSettingByType(grid);
        }

        grid.bind('columnReorder', function (e) {
            setTimeout(function () { setSessionStorageGridColumnOrderSettings(e) }, 0);
        });
    }
    try {
        $grid.on("mousedown", ".k-grid-cancel-changes", function (e) {
            var gridElement = $(e.target).closest('[data-role="grid"]');

            gridElement.removeData('filesToSave');
            gridElement.removeData('filesToDelete');
        });
    } catch (e) {
        console.log('No "Undo" button present');
    }

    $("#appcontainer").trigger("kendoGridRendered", [grid, gridid]);
    if (typeof CheckGridConstaintsExistance == "function")
        CheckGridConstaintsExistance(grid);
    //D.t added specific per grid event which will be consimend by print models (query_for_template_document)
    $("#appcontainer").trigger("kendoGridRendered_" + rootgridobj.code, [grid, gridid]);
    if (window.vocalCommandsActive && !window.vocalCommandsInitialized) {   //#vocalCommands
        var grids = $('[data-role=grid]');
        for (var i = 0; i < grids.length; i++) {
            var searchField = $(grids[i]).find('#maingridsearchandfilter')
            enableVocalCommandsForMainGridSearchField(searchField);
        }
        window.vocalCommandsInitialized = true;
    }
    if (window.magnifyGridActive && magnifyId)
        addMagnifyIcon(grid.element, magnifyId);

    return element;
}

//#magnify begin
var isMagnified = false;
var magnifyBreadcrumb = "";
var magnifyHistory = [];
var selectedBreadCrumb;
window.magnifyHistory = magnifyHistory;

function addMagnifyIcon(gridElement, magnifyId) {
    var magnifyIcon = '<i id="' + magnifyId + '" class="magnify-tab fa fa-external-link" style="display: inline-flex; align-items: center; border: 1px solid #157299; padding: 5px; border-width:thick; margin-right: 5px; border-radius: 3px; margin-right: 5px; margin-top: 3px;"  title="Apri in tab"></i>';
    var $activeLi = gridElement.parent().siblings('ul.k-tabstrip-items').children('.k-state-active');

    if ($activeLi.length && !$activeLi.children('.magnify-tab').length) {
        $activeLi.append(magnifyIcon);
        $('.magnify-tab').off().on('click', showMagnifyModal);
    }
}

function showMagnifyModal(evt) {

    var $target = $(evt.target);
    var $modalContainer = $('#magnifyModalContainer');
    var $modalContent = $('#magnifyModalContent');
    $modalContent.children().hide();

    let magnifyId = getTargetIDFromMagnifyTarget($target);
    let breadcrumbParentDescription = getParentGridRowDescription($target);
    let tooltipDescription = getToolTipTreeForTarget($target);
    let tabDescription = getTabDescriptionMagnify($target);
    modifyBreadcrumbToHistory(magnifyId, tabDescription, breadcrumbParentDescription, tooltipDescription, true);
    selectedBreadCrumb = magnifyId;
    if (magnifyId && magnifyId.length == 13) { //length of timestamp
        var gridCfg = magnifyGridConfigs[magnifyId];
        var data = gridCfg.data;

        $modalContent.empty();

        renderGrid(data.element, data.tabclass, $modalContent, "magnifyGrid", "", true, magnifyId);
        $modalContainer.on('hide.bs.modal', onHideMagnifyModal);
        $modalContainer.find('.modal-header').css('text-align', 'left');
        refreshBreadcrumb();
        $modalContainer.addClass('modal-wide').modal('show');
        isMagnified = true;
    }
}

function getToolTipTreeForTarget($target) {
    let tooltipTree = "";

    // Start from the next higher level in the hierarchy
    let detailRow = $target.closest('.k-detail-row');
    let gridContent = detailRow.closest('.k-grid-content');
    let currentTarget = gridContent.closest('.k-content.k-state-active');
    while (currentTarget.length > 0) {
        let breadcrumbParentDescription = getParentGridRowDescription(currentTarget);
        let tabDescription = getTabDescriptionMagnify(currentTarget);

        tooltipTree = `-${breadcrumbParentDescription}: <i class='fa fa-th'></i> ${tabDescription} ${(tooltipTree.length > 0 ? "<br/>" : "")} ${tooltipTree}`;
        // Traverse up to the next level
        detailRow = currentTarget.closest('.k-detail-row');
        gridContent = detailRow.closest('.k-grid-content');
        currentTarget = gridContent.closest('.k-content.k-state-active');
    }

    return tooltipTree ? `<div style='text-align: left;'>${tooltipTree}...</div>` : "";
}

function refreshBreadcrumb() {
    var $modalContainer = $('#magnifyModalContainer');
    var breadcrumb = "";

    for (let i = 0; i < magnifyHistory.length; i++) {
        let isSelected = magnifyHistory[i].magnifyId == selectedBreadCrumb;
        let hasTooTip = (magnifyHistory[i].tooltipDescription && magnifyHistory[i].tooltipDescription != "");
        // Container for each breadcrumb item
        breadcrumb += `<div style='display: inline-flex; align-items: center; border: ${isSelected ? '2' : '1'}px solid #ccc; padding: 5px; margin-right: 5px;border-radius: 4px;'>`;
        // Description label
        let breadcrumbSpanId = `breadcrumb-span-${i}`;
        breadcrumb += `<span id='${breadcrumbSpanId}' ${isSelected ? 'disabled="disabled" style="font-weight:bold;"' : ''}>${hasTooTip ? "<i class='fa fa-plus-square'></i>" : ""}${magnifyHistory[i].breadcrumbParentDescription}: </span>`; // Arrow icon added

        // Main breadcrumb button
        breadcrumb += `<button onclick='onMagnifyHistoryStepClicked(event)' class='btn btn-secondary' ${isSelected ? 'disabled="disabled" style="font-weight:bold;"' : ''}  data-magnify-id='${magnifyHistory[i].magnifyId}'><i class='fa fa-th'></i>${magnifyHistory[i].tabDescription} </button>`; // Grid icon added
        // Close button (X) to delete the breadcrumb item
        if (!isSelected) {
            breadcrumb += "<button onclick='onDeleteBreadcrumbItemClicked(event)' class='btn btn-secondary' data-magnify-id='" + magnifyHistory[i].magnifyId + "'>X</button>";
        }
        // Closing container div
        breadcrumb += "</div>";
        // Separator for each breadcrumb item, except the last one
        if (i < magnifyHistory.length - 1) {
            breadcrumb += " > ";
        }
    }

    $modalContainer.find('.modal-title').html(breadcrumb).css('text-align', 'left');
    initializeBreadcrumbTooltips();
}

function initializeBreadcrumbTooltips() {
    for (let i = 0; i < magnifyHistory.length; i++) {
        if (magnifyHistory[i].tooltipDescription != '') {
            let breadcrumbSpanId = `breadcrumb-span-${i}`;
            $(`#${breadcrumbSpanId}`).kendoTooltip({
                position: "bottom",
                content: magnifyHistory[i].tooltipDescription
            });
        }
    }
}

function onDeleteBreadcrumbItemClicked(event) {
    var magnifyId = $(event.target).data('magnify-id');
    modifyBreadcrumbToHistory(magnifyId, null, null, null, false);
}

function modifyBreadcrumbToHistory(magnifyId, tabDescription, breadcrumbParentDescription, tooltipDescription, add) {
    if (add) {
        let historyElement = { magnifyId: magnifyId, tabDescription: tabDescription, breadcrumbParentDescription: breadcrumbParentDescription, tooltipDescription: tooltipDescription };
        magnifyHistory.push(historyElement);
    } else {
        magnifyHistory = magnifyHistory.filter(element => element.magnifyId != magnifyId);
    }

    refreshBreadcrumb();
}

function getTabDescriptionMagnify($target) {

    var $kLink = $target.siblings('.k-link');
    if (!$kLink.length) {
        $kLink = $target.siblings('.k-tabstrip-items').children('.k-state-active').children('.k-link');
    }

    var tabTitle = "";
    if ($kLink.hasClass('dropdown-toggle')) {
        tabTitle = $kLink.siblings('ul.dropdown-menu').children('.k-button.k-state-active').text();
    } else {
        tabTitle = $kLink.text();
    }

    return tabTitle;
}

function getTargetIDFromMagnifyTarget($target) {
    let magnifyId = null;
    var $parent = $target.parent();
    if ($parent.hasClass('dropdown')) {
        var $grid = $parent.closest('.k-tabstrip').children('.k-content.k-state-active').children('[data-role=grid]');
        if ($grid.length && $grid.attr('magnifyId')) {
            magnifyId = $grid.attr('magnifyId');
        }
        $parent.children('ul.dropdown-menu').children('.k-button.k-state-active').text()
    } else {
        magnifyId = $target[0].id;
    }
    return magnifyId;
}

function getParentGridRowDescription($target) {
    let breadcrumbDescriptionKey, parentGridRowDescription;
    var $parentGrid = $target.closest('[data-role=grid]');
    var $parentGridData = $parentGrid.data('kendoGrid');
    var data = $parentGrid.data('kendoGrid').dataSource.data();
    var masterTR = $target.closest('.k-detail-row').prev();
    var rowUID = masterTR.attr('data-uid');
    var parentRowData = data.filter((el) => { return el.uid == rowUID });

    if ($parentGridData && $parentGridData.options && $parentGridData.options.gridExtension) {
        var gridExt = $parentGridData.options.gridExtension;
        if (gridExt && gridExt.magnifyBreadcrumbDescriptionColumn) {
            breadcrumbDescriptionKey = gridExt.magnifyBreadcrumbDescriptionColumn;
        }
    }

    if (parentRowData.length > 0) {
        var recordDescriptionKey = getMagnifyDescriptionKey(parentRowData[0], breadcrumbDescriptionKey);
        if (recordDescriptionKey && recordDescriptionKey.length > 0) {
            parentGridRowDescription = parentRowData[0][recordDescriptionKey];
        }
    }

    return parentGridRowDescription;
}

function getMagnifyDescriptionKey(object, descriptionKey) {
    if (descriptionKey == null || descriptionKey.length == 0) {
        descriptionKey = 'description';
    }
    var keys = Object.keys(object);
    descriptionKey = descriptionKey.toLowerCase();
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.toLowerCase().includes(descriptionKey)) {
            return key;
        }
    }

    descriptionKey = 'descrizione';
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.toLowerCase().includes(descriptionKey)) {
            return key;
        }
    }
    return 'id';
}

function onHideMagnifyModal() {
    magnifyBreadcrumb = "";
    magnifyHistory = [];
    isMagnified = false;
    selectedBreadCrumb = '';
}

function onMagnifyHistoryStepClicked(evt) {
    let magnifyId = $(evt.target).attr('data-magnify-id');
    let gridToRender = magnifyGridConfigs[magnifyId];
    let data = gridToRender.data;
    selectedBreadCrumb = magnifyId;
    $("#magnifyModalContent").empty();
    refreshBreadcrumb();
    renderGrid(data.element, data.tabclass, $("#magnifyModalContent"), "magnifyGrid", "", true, magnifyId);
}

//#magnify end

function manageGridUploadedFiles($container) {
    var data = $container.data();
    var pathAndHash = window.location.pathname + window.location.hash;

    

    if (data && (data.filesToDelete || data.filesToSave)) {
        //spostata per controllare che data non sia undefined 20/03/2024 S.M & D.T.
        // Initialize your request data object
        var requestData = {
            filesToSave: data.filesToSave || [],
            filesToDelete: data.filesToDelete || [],
            referrerUrl: pathAndHash
        };

        // Check if gridcode exists and add it to the request data if it does
        if (data?.kendoGrid?.options?.gridcode) {
            requestData.gridcode = data.kendoGrid.options.gridcode;
        }

        return $.ajax({
            type: 'POST',
            url: manageAsyncCallsUrl("saveFilesAsync" in data ? data.saveFilesAsync : true, '/api/MAGIC_SAVEFILE/ManageUploadedFiles'),
            contentType: "application/json; charset=utf-8",
            async: "saveFilesAsync" in data ? data.saveFilesAsync : true,
            data: JSON.stringify(requestData),
            success: function () {
                var path = data.filesToSave[0] ? data.filesToSave[0].savePath + data.filesToSave[0].name : '';
                delete data.filesToSave;
                delete data.filesToDelete;
                return path;
            },
            error: function () {
                var files = $.map((data.filesToSave || []).concat(data.filesToDelete || []), function (v) { return v.name; });
                kendoConsole.log(getObjectText("manageUploadFilesError").format(files.join(', ')), "error");
            }
        });
    } else {
        var defer = $.Deferred();
        defer.resolve();
        return defer.promise();
    }
}


function checkAndInitializeFastSearch(jquerygrid) {
    var excludefields = [],
        $gridSearchInput = jquerygrid.find("#maingridsearchandfilter");
    if ($gridSearchInput.data("searchInitialized"))
        return;
    $gridSearchInput.prop('onclick', null).off('click').data("searchInitialized", true);
    if (window.gridexcludefromfastsearch) //AdminAreaCustomizations.js
        excludefields = window.gridexcludefromfastsearch; //campi che non devono essere inclusi nelle ricerche fatte da toolbar
    if ($gridSearchInput.length > 0) {
        $gridSearchInput.attr("placeholder", getObjectText('placeholderSearchInGrid'));
        var fieldsingrid = jquerygrid.data("kendoGrid").dataSource.options.fields;
        var listoffields = new Array();
        var fieldvalues = {};
        for (var i = 0; i < fieldsingrid.length; i++) {
            var fields = jquerygrid.data("kendoGrid").dataSource.options.schema.model.fields;
            var xmlFields = jquerygrid.data("kendoGrid").options.xmlFields ? Object.keys(jquerygrid.data("kendoGrid").options.xmlFields) : [];
            var props = null;
            if (fieldsingrid[i].field !== undefined && excludefields.indexOf(fieldsingrid[i].field) == -1)
                props = fields[fieldsingrid[i].field];
            var colidx = getcolumnindex(jquerygrid.data("kendoGrid").columns, fieldsingrid[i].field);
            if (props && (props.type == "string" || jquerygrid.data("kendoGrid").columns[colidx].values)) {
                if (jquerygrid.data("kendoGrid").columns[colidx].values)
                    fieldvalues[fieldsingrid[i].field] = jquerygrid.data("kendoGrid").columns[colidx].values;
                listoffields.push(fieldsingrid[i].field);
            }
        }
        xmlFields = $.map(xmlFields, function (v, i) {
            if (excludefields.indexOf(v) == -1)
                return v;
            else
                return null;
        });
        listoffields = listoffields.concat(xmlFields);
        if (listoffields.length > 0)
            initializeFastSearch(listoffields, $gridSearchInput, jquerygrid, fieldvalues);
    }
}

function getCurrentModelInEdit() {
    return window.gridineditdatasourcemodel;
}

function setEditContext(currgrid, e) {
    if (currgrid !== currentgrid) {
        prevgridhash[currgrid] = { prevgrid: currentgrid, prevelementineditid: elementineditid, objectinedit: window.objectinedit };
    }
    currentgrid = currgrid;
    elementineditid = e.model.id;
    window.objectinedit = e;
    window.gridineditdatasourcemodel = e.model;
    // if autocompletes are on page i want them to be binded to DataBase
    //if (typeof autocompletes != 'undefined')
    enableAutocomplete(currgrid, e);


}

function uploadTemplate(e, path, useController, adminAreaUpload, isKendoField, gridName, colName) {
    var output = '';
    if (e) {
        e.name.replace(/^\/api\/MAGIC_SAVEFILE\/GetFile\?path=/i, "")
        var name = e.name.replace(/^(\/\S+\/)?\d{13,}-/, ''),
            ext = null,
            icon = "";

        try {
            var splitName = name.split('.');
            if (splitName.length > 1)
                ext = splitName[splitName.length - 1];
            else
                ext = "";
        }
        catch (ex) {
            console.log(ex)
        }

        switch (ext) {
            case 'gif':
            case 'jpg':
            case 'jpe':
            case 'jpeg':
            case 'png':
                icon = 'image-o';
                break;
            case 'pdf':
                icon = 'pdf-o';
                break;
            case 'doc':
            case 'docx':
                icon = 'word-o';
                break;
            case 'xls':
            case 'xlsx':
                icon = 'excel-o';
                break;
            case 'txt':
                icon = 'text-o';
                break;
            case 'ppt':
            case 'pptx':
                icon = 'powerpoint-o';
                break;
            case 'zip':
            case 'rar':
                icon = 'archive-o';
                break;
            case 'exe':
            case 'css':
            case 'js':
            case 'html':
                icon = 'code-o';
                break;
            default:
                icon = 'o';
        }

        output = "<span class='fa fa-file-" + icon + "'></span>\
        <span class='k-filename' title='" + name + "'>" + name + "</span>";

        if (typeof path != "undefined" && (!e.files || !e.files.length || !e.files[0].rawFile)) {
            var browserExtensions = ['jpg', 'jpeg', 'png', 'gif', 'css', 'js', 'pdf'],
                href = !useController ? path + e.name : '/api/MAGIC_SAVEFILE/GetFile?path=' + encodeURIComponent(path + e.name) + (adminAreaUpload ? "&adminAreaUpload=true" : ""),
                attribute = browserExtensions.indexOf(ext) > -1 ? 'target="_blank"' : 'download';

            // Check if there's a file link override
            var hasOverride = false;
            if (typeof fileLinkOverrides != "undefined" && gridName && colName) {
                if ((gridName in fileLinkOverrides) && (colName in fileLinkOverrides[gridName])) {
                    href = "javascript:void(0)";
                    attribute = ' onclick="' + fileLinkOverrides[gridName][colName] + '(event)"';
                    hasOverride = true;
                }
            }

            // If it's a PDF and no override exists, use preview instead of default link
            if (!hasOverride && ext && ext.toLowerCase() === 'pdf') {
                var filePath = !useController ? path + e.name : path + e.name;
                var previewData = {
                    fileName: e.name,
                    filePath: filePath,
                    useController: useController,
                    adminAreaUpload: adminAreaUpload
                };

                href = "javascript:void(0)";
                attribute = ' onclick="openPdfPreviewFromTemplate(this)" data-preview=\'' +
                    JSON.stringify(previewData).replace(/'/g, "&apos;") + '\'';
            }

            output = '<a title="' + name + '" href="' + href + '" ' + attribute + '>' + output + '</a>';
        }

        if (isKendoField) {
            output = "<span class='k-progress'></span>" +
                output +
                "<strong class='k-upload-status'>\
                <button type='button' class='k-button k-button-bare k-upload-action' style='min-width: 0;'>\
                    <span class='k-icon k-i-close k-delete' title='" + getObjectText('remove') + "'></span>\
                </button>\
            </strong>";
        }
    }

    return output;
}

// Function to open PDF preview from template
function openPdfPreviewFromTemplate(linkElement) {
    var previewData = JSON.parse($(linkElement).attr('data-preview'));
    var pdfViewerController = $("#pdf-viewer-controller");

    var fileUrl = new $.Deferred();
    var pathFileComplete = previewData.filePath;

    // Resolve immediately with the file path
    fileUrl.resolve(pathFileComplete);

    $.when(fileUrl).then(function (res) {
        if (res == "" || !res) {
            return kendoConsole.log("Nessun file elaborato", true);
        }

        var config = {
            patFile: "",
            nomeFile: previewData.fileName,
            pathFileComplete: res,
            rowData: {},
            reftreeServiceCode: "",
            downloadNotPdf: false,
            ready: function () {
                var interval = setInterval(function () {
                    var fadeout = pdfViewerController.find(".fadeout");
                    if (fadeout.length > 0) {
                        clearInterval(interval);
                        $("#pdf-viewer-controller-spinner").remove();
                        fadeout.addClass("fadein");
                    }
                }, 100);
            },
            close: function (e) {
                $("#idPdfViewer")
                    .find("#btnExit")
                    .click();
            },
        };

        pdfViewerController = $('<div id="pdf-viewer-controller">')
            .append($(getAngularControllerElement("pdfViewerController", config)).addClass("fadeout"));
        pdfViewerController.append(
            '<div id="pdf-viewer-controller-spinner" style="position: absolute; left: 50%; top: 40%">' +
            largeSpinnerHTML +
            "</div>"
        );

    }, function (err) {
        console.log(err);
        kendoConsole.log("Errore nell'apertura del visualizzatore PDF", true);
    });
}
function onUploadSelect(e) {
    if (typeof overrideOnUploadSelect == "function") {
        overrideOnUploadSelect(e);
        return;
    }
    $.each(e.files, function (k, file) {
        //D.T this has been commented beacuase it breaks all the applications relying in p7m upload generated from e.g docx models with a fixed name
        //if (e.files[k].extension !== '.p7m') {
        e.files[k].name = Date.now().toString() + "-" + e.files[k].name.replace(/&(#\d+|\w+);|[^\w\.-]/g, '');
        //}
    });
}

function onUpload(e) {
    /*add to check file size != 0 S.M. L.S. 07/05/2024*/
    $.each(e.files, function (k, file) {
        if (!file.size) {
            kendoConsole.log("Invalid File size " + file.rawFile?.name, true);
            e.preventDefault();
        }
    });

    var fileNames = {};

    if (e.sender.options.validation) {
        try {
            if (e.sender.options.validation.allowedExtensions && e.sender.options.validation.allowedExtensions.length) {
                $.each(e.files, function (k, file) {
                    if (e.sender.options.validation.allowedExtensions.indexOf(file.extension.toLowerCase()) < 0) {
                        kendoConsole.log(getObjectText("fileextensionerror"), true);
                        e.preventDefault();
                    }
                });
            }
            if (e.sender.options.validation.maxFileSize) {
                $.each(e.files, function (k, file) {
                    if (file.size > e.sender.options.validation.maxFileSize) {
                        kendoConsole.log(getObjectText("filesizeerror").format(e.sender.options.validation.maxFileSize / 1024), true);
                        e.preventDefault();
                    }
                });
            }
        }
        catch (err) {
            console.log("Upload did not find the allowed file extensions: control has been skipped!!!");
        }
    }

    try { //control wether a path has been configured for the column
        var savepath = managesavepath(e.sender.options.savepath || e.sender.options.savePath);
    }
    catch (err) {
        console.log("Upload did not find the save path: the path will be defaulted server side!!!");
        savepath = "";
    }

    $.each(e.files, function (k, v) {
        fileNames[v.rawFile.name] = v.name;
    });

    e.data = {
        fileNames: JSON.stringify(fileNames)
    };

}

function uploadSuccess(e, $container, uid, adminAreaUpload) {
    var message = "",
        onUploadsWriteFileNameOnly = window.onUploadsWriteFileNameOnly || false,  //manage exceptions where a single file name is written into DB field as a plain string (no JSON)
        adminAreaUpload = adminAreaUpload || false,
        filesToSave = $container.data('filesToSave') || [],
        dataRow = uid ? $container.data('kendoGrid').dataSource.getByUid(uid) : false,
        value = adminAreaUpload ? (e.sender.options.files.length ? e.sender.options.files[0].name : null) : e.sender.options.files,
        savePath = managesavepath(e.sender.options.savepath || e.sender.options.savePath || "");

    if (e.operation == 'upload') {
        //e.files = new added file(s)
        if (adminAreaUpload)
            value = savePath + e.files[0].name;
        else
            $.each(e.files, function (k, file) {
                if (!onUploadsWriteFileNameOnly)
                    value.push({
                        name: file.name,
                        ext: file.extension,
                        size: file.size,
                    });
                else
                    value = file.name;
            });

        var response = JSON.parse(e.response);
        $.each(response, function (k, file) {
            file.savePath = savePath;
            file.adminAreaUpload = adminAreaUpload;
            filesToSave.push(file);
            try {
                if (file.id) {
                    value[k].name = file.id + value[k].ext;
                }
            }
            catch (e) {
                console.error(e);
            }
        });

        $container.data('filesToSave', filesToSave);
    } else {
        //e.files = removed file(s)
        var fileNames = (adminAreaUpload || onUploadsWriteFileNameOnly) ? (value ? [value] : []) : $.map(value, function (v) { return v.name; });
        var filesToDelete = $container.data('filesToDelete') || [];
        var filesToSaveNames = [];
        if (filesToSave.length)
            filesToSaveNames = $.map(filesToSave, function (v) { return v.name; });

        $.each(e.files, function (k, file) {
            var i = fileNames.indexOf(file.name);
            var k = filesToSaveNames.indexOf(file.name);
            if (i > -1) {
                if (adminAreaUpload || onUploadsWriteFileNameOnly)
                    value = "";
                else
                    value.splice(i, 1);
            }
            if (k > -1)
                filesToSave.splice(k, 1);
            else
                filesToDelete.push({
                    name: file.name,
                    adminAreaUpload: adminAreaUpload,
                    savePath: savePath
                });
        });

        $container.data('filesToSave', filesToSave);
        $container.data('filesToDelete', filesToDelete);
    }

    // aggiorno il valore nel datasource della griglia in edit.
    if (dataRow) {
        dataRow.set(e.sender.element[0].name, value.length ? (adminAreaUpload || onUploadsWriteFileNameOnly) ? value : JSON.stringify(value) : '');
    }

    e.sender.options.files = value;
}

//gridcode is the grid to filter into the grids' function
function ConfigGrid(gridcode) {
    if (gridcode !== "Magic_Grid")
        setSessionStorageGridFilters("Magic_Grid", -1, { field: 'MagicGridName', operator: 'eq', value: gridcode, type: "configFilter" }, true);
}

function SchedulerFunctionSearch() {
    clickswitchColorBlue("Scheduler", undefined, true);
}

function getDefaultTooltipSettings(settings) {
    var defaultSettings = {
        position: 'top',
        showOn: 'click',
        animation: {
            open: {
                effects: 'fade:in',
                duration: 300
            },
            close: {
                effects: 'fade:out',
                duration: 300
            }
        },
        autoHide: false
    }
    if (settings)
        return $.extend(defaultSettings, settings);
    return defaultSettings;
}

function getDefaultGridSettings() {
    return {
        dataBinding: function (e) {
            if (!this.clickEventSet) {
                this.clickEventSet = true;
                var $grid = $(e.sender.element);
                $grid[0].addEventListener("click", function () {
                    window.lastClickedKendoGrid = $grid[0];
                }, true);
            }
        },
        groupable: {
            messages: {
                empty: getObjectText("GROUPING")
            },
            enabled: true,
            showFooter: true
        },
        sortable: true,
        reorderable: true,
        resizable: true,
        columnMenu: {
            messages: {
                columns: getObjectText("columns"),
                filter: getObjectText("filter"),
                sortAscending: getObjectText("sortAsc"),
                sortDescending: getObjectText("sortDesc"),
                settings: getObjectText("settings"),
                done: getObjectText("done"),
                lock: getObjectText("lock"),
                unlock: getObjectText("unlock"),
            }
        },
        filterable: setDefaultFilterSettings(),
        pageable: {
            refresh: true,
            pageSizes: [5, 10, 25, 50, 100, 500, 1000, 30000],
            messages: {
                display: getObjectText("showitems"),//"Showing {0}-{1} from {2} data items"
                empty: getObjectText("nodataingrid"),
                itemsPerPage: getObjectText("dataitemsperpage")
            }
        },
        navigatable: false,
        editable: {
            mode: "popup", confirmation: getObjectText("CONFIRMATION")
        },
        detailTemplate: null,
        detailInit: null,
        detailExpand: function (e) {
            e.masterRow.find("td.k-hierarchy-cell").css("background-color", "lightgrey");

            //trigger click on first menu item in order to enlarge grid and make menu visible for the user
            //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/194/
            var $activeLi = $('.k-item.k-state-aktive');
            if ($activeLi.length) {
                var $firstMenuItem = $activeLi.children('.dropdown-menu').children('.k-button.k-state-active');
                if ($firstMenuItem.length) {
                    setTimeout(function () {
                        $firstMenuItem.trigger('click');
                    }, 400);
                }
            }
        },
        detailCollapse: function (e) {
            e.masterRow.find("td.k-hierarchy-cell").css("background-color", "transparent");
        },
        edit: function (e) { },
        messages: {
            commands: {
                update: getObjectText("save")
            }
        },
        toolbar: [{ name: "create", text: getObjectText("create") }],
        columns: [],
        save: function (e) {
            //manage data for snapshot...
            var snapshot = {};
            var drole,
                name,
                id,
                label = "";

            //management of data snapshot 19/5/2017
            try {
                $.each(e.container.find("input[name],textarea[name]"), function (i, v) {
                    v = $(v);
                    drole = v.attr("data-role");
                    name = v.attr("name");
                    id = v.attr("id");
                    var text = "";
                    var kendoComponents = getKendoComponents();
                    if (kendoComponents[drole]) {
                        if (drole == "multiselect") {
                            var arr = [];
                            var textfield = kendo.widgetInstance(e.container.find("[name=" + name + "]")).options.dataTextField;
                            $.each(kendo.widgetInstance(e.container.find("[name=" + name + "]")).dataItems(), function (j, obj) {
                                arr.push(obj[textfield]);
                            });
                            text = arr.join(",");
                        }
                        else
                            if (typeof kendo.widgetInstance(e.container.find("[name=" + name + "]")).text == "function")
                                text = kendo.widgetInstance(e.container.find("[name=" + name + "]")).text();
                            else
                                if (typeof kendo.widgetInstance(e.container.find("[name=" + name + "]")).value == "function") {
                                    if (drole == "datetimepicker" || drole == "datepicker")
                                        text = kendo.widgetInstance(e.container.find("[name=" + name + "]")).value() ? toTimeZoneLessString(new Date(kendo.widgetInstance(e.container.find("[name=" + name + "]")).value())) : null;
                                    else
                                        text = kendo.widgetInstance(e.container.find("[name=" + name + "]")).value();
                                }
                        if (!text)
                            text = e.model[name];
                    }
                    else
                        text = v.attr("type") == "checkbox" ? (v.attr("checked") == "checked" ? true : false) : v.val();

                    label = e.container.find("label[for=" + id + "]") ? (e.container.find("label[for=" + id + "]").text() ? e.container.find("label[for=" + id + "]").text() : e.container.find("label[for=" + name + "]").text()) : name
                    snapshot[name] = { value: text, label: label ? label : name };
                });
                $("#appcontainer").data("snapshot", snapshot);
            }
            catch (ex) {
                console.log(ex);
            }
            var $parentPopUp = e.sender.wrapper.closest("div.k-popup-edit-form.k-window-content.k-content");
            var ancestorPopUpUID = $parentPopUp.data("uid");
            //if i'm doing an insertion in a grid whose parent is a grid popup in insertion mode
            if ($parentPopUp.length > 0 && $parentPopUp.data("isNew") && e.model.isNew() && !e.sender.wrapper.hasClass("gridItemSelector")) {
                e.preventDefault(); //blocks the saving of data into the database 
                //i forcibly insert the data that the user wants directly in the datasource. I'll later synch it as soon as the main save button is pressed (requestEnd of the datasource)
                var newdata = $.extend(e.model, e.values ? e.values : {});
                e.sender.dataSource.remove(newdata);
                e.sender.dataSource.add(newdata);
                e.sender.dataSource.ancestorPopUpUID = ancestorPopUpUID;
                // to check if the line below is needed -> seems to be called twice after #5473
                // manageGridUploadedFiles(e.sender.wrapper);
            }
            else
                window.lastClickedSaveBtnContainer = e.container.data("uid") ? e.container.data("uid") : null;


        }
    };
}
function undoPKFiltersOnNewEdit(e) {
    try {
        if (!e.model.isNew())
            return;
        let grid = e.sender;
        let pkname = grid.dataSource.options.schema.model.id;
        if (!pkname)
            return;
        let pkDefaultValue = grid.dataSource.options.schema.model.fields[pkname].defaultValue;
        if (pkDefaultValue == e.model.id) {
            e.model.set(pkname, 0);
            e.model.set("id", 0);
        }
    } catch (err) {
        console.log("undoPKFiltersOnNewEdit failed:" + err);
    }
}

function getrootgrid(gridcode, functioname, gridhtmlname, functionid, layerid, async, filterfield, e, hidefiltercolumn, tabclass, showlayeronly, tabItem, gridrelationtype, iscascadesearch, promiseMe, _gridObject) {
    if (!showlayeronly)
        showlayeronly = false;

    if (!window.groupedcols) {
        window.groupedcols = {};
        window.groupedcols[gridcode] = [];
    }
    else
        window.groupedcols[gridcode] = [];

    //vado a pescare in sessione i diritti generali a livello dell' utente per la funzione corrente e li setto in window.usercanxxxxxxx  (export,delete,update,exec)
    setuserrightsinwindow();

    var gridname = gridhtmlname === undefined ? gridcode : gridhtmlname;

    if (functioname == null || functioname == "")
        functioname = "standard";

    if (typeof functionid === "undefined" || functionid === null)
        functionid = -1;

    //set defaults if is a navigation grid
    var usersGridSettings = e == null ? getSessionStorageGridSettings(gridcode, functionid) : {
        filter: null,
        group: [],
        sort: [],
    };
    //Check for filters set at the server SessionHandler level
    var shobj = window.MF_ASPSessionGridFilter ? window.MF_ASPSessionGridFilter : {};
    if (shobj[gridcode]) {
        usersGridSettings.filter = shobj[gridcode];
    }

    var element = getDefaultGridSettings();
    element.initialFilter = filterfield;
    if (_gridObject)
        element = $.extend(element, _gridObject);
    element.dataSource = {
        filter: usersGridSettings.filter && usersGridSettings.filter.type ? { filters: [usersGridSettings.filter], logic: "and" } : usersGridSettings.filter,
        group: usersGridSettings.group,
        sort: usersGridSettings.sort,
        transport: {}, //end of transport definition
        requestStart: function (e) {
            if (e.type == "read") {
                $(".page-title").append('<div id="grid-is-loading-spinner" class="pull-right" style="display:inline-block;">' + smallSpinnerHTML + '</div>');
            }
            else if (e.type == "update" || e.type == "create") //show spinner and disable save button
                $(".k-widget .k-grid-update").hide().before('<div style="display:inline-block;">' + smallSpinnerHTML + '</div>');
        },
        requestEnd: function (e) { // se arriva qui significa che il messaggio e' un 200 (OK) quindi gestisco un messagio di OK o un WARN (fatta eccezione per gli errori SQL non gestiti) 

            //questo chiude la modale bootstrap che contiene una griglia editable incell con save ok.
            function manageActionInCellGrids() {
                if ($("#gridshowactions").length > 0)
                    if ($("#gridshowactions").attr("closeonsave")) {
                        $("#wndmodalContainer").modal("hide");
                        $("#gridshowactions").removeAttr("closeonsave");
                    }
            }
            function evaluateFilteredFields(filter, ds, maingridValuesFromDB) {
                function iterateOverrideDataSource(key, value, ds) {
                    $(ds.data()).each(function (i, dest) {
                        if (value.indexOf('@') == -1) //not a constant value
                            dest[key] = maingridValuesFromDB[value];
                    })
                }
                if (filter) {
                    if (filter.logic && filter.logic.toUpperCase() == "AND") {
                        $(filter.filters).each(function (i, v) {
                            if (v.operator == "eq")
                                iterateOverrideDataSource(v.field, v.value, ds);
                        });
                    }
                    else
                        if (filter.field && filter.operator == "eq")
                            iterateOverrideDataSource(filter.field, filter.value, ds);
                        else
                            if (!filter.field && !filter.operator && !filter.value) //caso del campo singolo
                                iterateOverrideDataSource(filter, e.sender.options.schema.model.id, ds);

                }
            }

            if (!e.type || e.type == "read") {
                $("#grid-is-loading-spinner").remove();
            }
            else if (e.type == "update" || e.type == "create") //remove spinner and enable save button
                setTimeout(function () {
                    $(".k-widget .k-grid-update").show().prev().remove();
                    //refresh the rest of the items if the grid is laying on the dashboard and gridExtension.reloadDashboard flag is true
                    if (e.sender && e.sender.options && e.sender.options.reloadDashboard)
                        $("#ContentPlaceHolder1_dashboardTabs").find(" [id^='dashboard-tab-'].tab-pane.row").each(function (i, v) {
                            if (getGlobalRangePickerObject(v) && getGlobalRangePickerObject(v).$button)
                                getGlobalRangePickerObject(v).$button.click();
                        });
                }, 500);
            if (e.type === "create") {
                if (e.response.Errors == null && (!e.response.Warning)) {
                    e.sender.read();
                    kendoConsole.log(e.type + " OK", false);
                }
                else
                    if (e.response.Warning) {
                        e.sender.read();
                        kendoConsole.log(e.response.Warning, "info");
                    }
                //save dei related data
                var tabstrip = $(".k-edit-form-container").find(".k-tabstrip").data("kendoTabStrip");
                var origFilter = {};
                if (tabstrip) {
                    $(tabstrip.items()).each(function (i, v) {
                        var data = $(v).data();
                        if (data.contentObject && data.contentObject.contentType == "GRID")
                            if (data.contentObject.bindedGridFilter)
                                origFilter[data.contentObject.objectName] = JSON.parse(v["attributes"]["data-content-object"].value).bindedGridFilter;

                    });
                }
                if (e.response.Data)
                    $(".k-edit-form-container").find(".k-grid").each(function (i, v) {
                        try {
                            var maingridValuesFromDB = e.response.Data[0].Table[0];
                            var gridName = $(v).attr("gridname");
                            var ds = $(v).data("kendoGrid").dataSource;
                            if (!window.syncedPopUpUIDs)
                                window.syncedPopUpUIDs = {};
                            //se l' ultimo salvataggio "lanciato" corrisponde ad una popup che deve sincronizzare i ds lancio le sync
                            if (window.lastClickedSaveBtnContainer && (ds.ancestorPopUpUID == window.lastClickedSaveBtnContainer) && !window.syncedPopUpUIDs[ds.ancestorPopUpUID]) {
                                var filter = origFilter[gridName];
                                try {
                                    evaluateFilteredFields(filter, ds, maingridValuesFromDB);
                                }
                                catch (ex) {
                                    console.log(ex)
                                }
                                ds.sync();
                                window.syncedPopUpUIDs[ds.ancestorPopUpUID] = true;
                            }
                        }
                        catch (ex) {
                            console.log(ex);
                        }
                    });
                manageActionInCellGrids();
            }
            if (e.type == "update" || e.type == "destroy") {
                var msg = e.response;
                var consoleflag = false;
                try {
                    var objmsg = $.parseJSON(msg);
                    if (objmsg.msgtype == "WARN")
                        consoleflag = "info";
                    msg = objmsg.message;
                }
                catch (ex) {
                    console.log("WARN in datasource requestEnd for grid::return message of destroy/update is not a JSON and is therefore considered as a success");
                    msg = "OK";
                }
                if (!(e.response instanceof Object && e.response.Errors)) {
                    kendoConsole.log(msg, consoleflag);
                }
                e.sender.read();
                manageActionInCellGrids();
            }
        },
        batch: false,
        // error: error,
        pageSize: 10,
        serverPaging: true,
        serverSorting: true,
        serverFiltering: true,
        schema: {
            parse: function (response) {
                //If session has fallen the response is the login page...so i redirect to login
                if (typeof response == "string" && response.indexOf("<!DOCTYPE html>") != -1) {
                    location.href = 'login';
                    return;
                }
                //caso di dati da DataTable da C#
                if (response.Data != null)
                    if (response.Data.length >= 1)
                        if (response.Data[0].Table != undefined) {
                            //check for xml properties in Table. Value is the data of an element  (row)
                            $.each(response.Data[0].Table, function (index, value) {
                                for (var prop in value) {  //iterate through the property names of each row
                                    if (value.hasOwnProperty(prop)) {
                                        //if (tryParseXML(value[prop]) !== false)  //check wether the value of the field is an XML
                                        if (parseXml(value[prop]) && value[prop]) {   //turn it into JSON and then into JS object
                                            var xmldoc = parseXml(value[prop]);
                                            var jsonstring = xml2json(xmldoc, ' ');
                                            //Make it robust against dirty xml..
                                            if (jsonstring && jsonstring.indexOf('"#text":">",') != -1)
                                                jsonstring = jsonstring.replace('"#text":">",', '');
                                            var o = JSON.parse(jsonstring);
                                            //Add to the dataset the splitted XML values
                                            for (var proptoadd in o[prop]) {
                                                if (!isNaN(Date.parse(o[prop][proptoadd])) && (o[prop][proptoadd].split('/').length == 3)) //se e' una data la trasformo in un oggetto date
                                                {
                                                    //   if (o[prop][proptoadd].split('/').length == 3) //il formato deve contenere giorno, mese , anno per essere considerato una data (in cui vengono salvate le date XML)
                                                    value[proptoadd] = new Date(o[prop][proptoadd]);
                                                }
                                                else { //la riporto come da XML
                                                    //manage values which are not legal numbers but not detected by isNan e.g null
                                                    value[proptoadd] = (Number.isNaN(Number(o[prop][proptoadd])) || o[prop][proptoadd] == null) ? o[prop][proptoadd] : Number(o[prop][proptoadd]);
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                            return { Data: response.Data[0].Table, Errors: response.Errors, Count: response.Count };
                        } //dati da model 
                return response;
            },
            data: "Data",
            errors: "Errors",
            total: "Count",
            model: {
            }
        }
    };

    if (async == undefined) { //griglia master non viene renderizzata in modo async ma in modo sincrono e da codice js di getrootfunction
        prevgridhash[currentgrid] = { prevgrid: gridname, prevelementineditid: -1, objectinedit: null };
        var result = $.ajax({
            type: "POST",
            async: !!promiseMe,
            url: manageAsyncCallsUrl(!!promiseMe, "/api/Magic_Grids/GetByName"),//"/api/Magic_Grids/GetByName"
            data: JSON.stringify({ id: gridcode, functionname: functioname, functionid: functionid, layerid: layerid === undefined ? null : layerid, showlayeronly: showlayeronly }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        })
            .then(function (result) {
                addGridInfo(result);
                fillgridelementWithDBdata(result, element, gridcode, layerid, functioname, functionid, gridname, gridrelationtype);
                return element;
            });
        if (promiseMe)
            return result;
        return element;
    }
    else {
        window.detailfunctionname = functioname;
        //Griglie filgie vengono automaticamente renderizzate in modo async
        if (tabItem.is(".k-state-active")) { //se la griglia e' sul tab attivo (il primo)
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/Magic_Grids/GetByName",
                data: JSON.stringify({ id: gridcode, functionname: functioname, functionid: functionid, layerid: layerid === undefined ? null : layerid, showlayeronly: showlayeronly }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    addGridInfo(result);
                    fillgridelementWithDBdata(result, element, gridcode, layerid, functioname, functionid, (tabclass === null || tabclass === undefined) ? gridname : tabclass, gridrelationtype, e, tabclass, tabItem.closest("tr").prev());
                    var tabstrip = e.detailRow.find(".tabstrip").data("kendoTabStrip");
                    tabstrip.contentElements.each(function (k, content) {
                        if ($(content).is(".k-state-active")) {
                            filtersolver(filterfield, element, e, hidefiltercolumn);
                            renderGrid(element, tabclass, $(content));
                            return false;
                        }
                    })

                    if (typeof postrenderdispatcher == 'function')
                        postrenderdispatcher(element, functioname, e, tabclass);
                }


            });
        }
        else {

            //la chiave e' nome funzione + classe del tab + l' uid (chiave univoca) della riga parent cliccata
            tabItem.data("detailGrid", {
                showlayeronly: showlayeronly,
                element: element,
                e: e,
                result: result,
                gridcode: gridcode,
                layerid: layerid,
                functionid: functionid,
                tabclass: ((tabclass === null || tabclass === undefined) ? gridname : tabclass),
                filterfield: filterfield,
                hidefiltercolumn: hidefiltercolumn,
                gridrelationtype: gridrelationtype
            });
        }


    }

};

let lastUniquePasteHandler = null;
function setUniquePasteEvent(handler) {
    if (lastUniquePasteHandler) {
        document.removeEventListener('paste', lastUniquePasteHandler);
    }
    lastUniquePasteHandler = (e) => {
        let pasteData = (event.clipboardData || window.clipboardData).getData('text');
        handler(e, pasteData);
    };
    document.addEventListener('paste', lastUniquePasteHandler);
}
var magnifyGridConfigs = {};
function ontabactivation(e) {
    var tabItem = $(e.item),
        data = tabItem.data("detailGrid");
    if (data && !$(e.contentElement).children("[data-role=grid]").length) {
        $.ajax({
            type: "POST",
            async: true,
            url: "/api/Magic_Grids/GetByName",
            data: JSON.stringify({ id: data.gridcode, functionname: window.detailfunctionname, functionid: data.functionid, layerid: data.layerid, showlayeronly: data.showlayeronly }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                addGridInfo(result);
                fillgridelementWithDBdata(result, data.element, data.gridcode, data.layerid, window.detailfunctionname, data.functionid, data.tabclass, data.gridrelationtype, undefined, undefined, tabItem.closest("tr").prev());
                filtersolver(data.filterfield, data.element, data.e, data.hidefiltercolumn);
                var magnifyGridDataCopy = Object.assign({}, data);
                var magnifyId = + new Date();
                magnifyGridConfigs[magnifyId] = { data: magnifyGridDataCopy };

                renderGrid(data.element, data.tabclass, $(e.contentElement), undefined, "", false, magnifyId);
                if (typeof postrenderdispatcher == 'function')
                    postrenderdispatcher(data.element, window.detailfunctionname, data.e, data.tabclass);
            }
        });
    }
}

function addOptionalColumns(columns, data, gridExtension, dataSource) {
    if (data.ShowHistory == true) {
        var boDescriptionColumn = gridExtension && gridExtension.new_bo_mail_settings && gridExtension.new_bo_mail_settings.bo_description_column ? gridExtension.new_bo_mail_settings.bo_description_column : "";
        var primaryKey = dataSource.schema.model.id;
        columns.push({
            title: getObjectText("messages"),
            width: "100px",
            template: function (dataItem) {
                return '<span id="BO-message-' + dataItem[primaryKey] + '"><span class="BO-message">' + smallSpinnerHTML + '</span></span>';
            },
            filterable: false
        });
        columns.push({
            title: getObjectText("History"),
            width: "60px",
            template: '#= historyColumn("' + data.FromTable + '","' + data.DocRepositoryBOType + '","' + boDescriptionColumn + '")#',
            filterable: false
        });
        //columns.splice(columns.length && columns[0].command ? 1 : 0, 0, {
        //    title: getObjectText("messages"),
        //    width: "100px",
        //    template: function (dataItem) {
        //        return '<span id="BO-message-' + dataItem[primaryKey] + '"><span class="BO-message">' + smallSpinnerHTML + '</span></span>';
        //    },
        //    filterable: false
        //});
    }
    manageActions(data, columns, gridExtension);
    manageActionsWorkflows(data, columns);
}
function getHistory_idx(columns) {
    var j = columns.length;
    $(columns).each(function (i, v) {
        if (v.title == getObjectText("History") && v.filterable == false && v.template)
            j = i;
    });
    return j;
}

function manageActions(data, columns, gridExtension) {
    //aggiunta dell'  action list (panel bar) per ogni record. Se la chiamata retituisce true
    if (data.QueryForActions || gridExtension.show_function_grid_actions) { //da settare in configurazione della griglia
        dbcalls = [];
        if (data.QueryForActions)
            dbcalls.push("stageactions");
        if (gridExtension.show_function_grid_actions)
            dbcalls.push("customactions");
        var actionobj = { title: getObjectText("actions"), width: "60px", template: "#= getcolumnforaction(\"" + data.FromTable + "\",\"" + dbcalls.join() + "\")#", filterable: false, columnType: "actions" }
        if (window.actionColumnIsFirst) {
            if (columns[0].command)
                columns.splice(1, 0, actionobj);
            else
                columns.unshift(actionobj);
        }
        else
            columns.splice(getHistory_idx(columns), 0, actionobj);
    }
}
function manageActionsWorkflows(data, columns) {
    try {
        if (data.MagicGridExtension)
            if (JSON.parse(data.MagicGridExtension).show_workflow_actions_column) {
                var actionobj = { title: getObjectText("workflowactions"), width: "120px", template: getcolumnforactionworkflow, filterable: false, columnType: "workflowActions" }
                if (window.actionColumnIsFirst) {
                    if (columns[0].command)
                        columns.splice(1, 0, actionobj);
                    else
                        columns.unshift(actionobj);
                }
                else
                    columns.splice(getHistory_idx(columns), 0, actionobj);

            }
    }
    catch (e) {
        console.log(e)
    };
}
function getGridExportTemplate(disabledExportFormats) {
    if (disabledExportFormats && (disabledExportFormats.csv || disabledExportFormats.pdf || disabledExportFormats.xlsx)) {
        // https://gitlab.ilosgroup.com/ilos/operations/-/issues/328
        // return empty div if all formats are disabled
        if (disabledExportFormats.csv && disabledExportFormats.pdf && disabledExportFormats.xlsx) {
            return '<div class="btn-group pull-right"></div>';
        }

        var html = '<div class="btn-group pull-right">\
                        <button type="button" title="'+ getObjectText("export") + '" class="k-button dropdown-toggle" data-toggle="dropdown">\
                        <span class="fa fa-sign-out"/></button>\
                        <ul class="dropdown-menu" role="menu">';

        //add button if not format is not disabled
        if (!disabledExportFormats.csv) {
            html += '<li>{0}</li>';
            html = html.format(buildToolbarButtons("CsvExport", "k-button-icontext", "Export", "exportTofile", "none", "<span class=\'k-icon k-i-excel\'></span>"));
        }
        if (!disabledExportFormats.pdf) {
            html += '<li>{0}</li>';
            html = html.format(buildToolbarButtons("PdfExport", "k-button-icontext k-grid-pdf", "PdfExport", "(function(){})", "none", "<span class=\'k-icon k-i-pdf\'></span>"));
        }
        if (!disabledExportFormats.xlsx) {
            html += '<li>{0}</li>';
            html = html.format(buildToolbarButtons("XlsExport", "k-button-icontext", "XlsExport", "exportToXls", "none", "<span class=\'k-icon k-i-excel\'></span>"));
        }
        html += '</ul></div>';
        return html;
    }
    return '<div class="btn-group pull-right">\
                <button type="button" title="'+ getObjectText("export") + '" class="k-button dropdown-toggle" data-toggle="dropdown">\
                <span class="fa fa-sign-out"/></button>\
                <ul class="dropdown-menu" role="menu">\
                <li>{0}</li>\
                <li>{1}</li>\
                <li>{2}</li>\
                </ul>\
            </div>'.format(
        buildToolbarButtons("CsvExport", "k-button-icontext", "Export", "exportTofile", "none", "<span class=\'k-icon k-i-excel\'></span>"),
        buildToolbarButtons("PdfExport", "k-button-icontext k-grid-pdf", "PdfExport", "(function(){})", "none", "<span class=\'k-icon k-i-pdf\'></span>"),
        buildToolbarButtons("XlsExport", "k-button-icontext", "XlsExport", "exportToXls", "none", "<span class=\'k-icon k-i-excel\'></span>")
    );
}

function buildToolbarBtnTemplate(element, toolbartoadd) {
    var groups = {};
    var buttons = [];

    $.each(toolbartoadd, function (k, btn) {
        if (!btn.groupText) {
            buttons.push({
                name: getObjectText(btn.text),
                template: buildToolbarButtons(btn.text, btn.classname, btn.domid, btn.clickjsfunct, null, null, btn.jsonpayload, btn.storedprocedure, btn.storedproceduredataformat)
            })
        } else {
            var template = "<li>" + buildToolbarButtons(btn.text, "k-button-icontext", btn.domid, btn.clickjsfunct, "none", null, btn.jsonpayload, btn.storedprocedure, btn.storedproceduredataformat) + "</li>{0}";
            if (!(btn.groupText in groups)) {
                groups[btn.groupText] = '<div class="btn-group">\
                        <button type="button" class="k-button dropdown-toggle" data-toggle="dropdown">\
                        {0}</button>\
                        <ul class="dropdown-menu" role="menu">\
                        {1}\
                        </ul>\
                    </div>'.format(getObjectText(btn.groupText), template);
                buttons.push(btn.groupText);
            } else {
                groups[btn.groupText] = groups[btn.groupText].format(template);
            }
        }
    });

    element.toolbar = element.toolbar.concat($.map(buttons, function (btn) {
        if (typeof btn == "string" && btn in groups)
            return { name: getObjectText(btn), template: groups[btn].format('') };
        return btn;
    }));
}

function pushCustomGroupToolbarButton(element, btntemplates, key, floatNone) {
    var btns = '';
    $.each(btntemplates, function (i, v) {
        btns += "<li>" + v + "</li>";
    });
    var stylestr = 'style = "float:left;"';
    if (floatNone)
        stylestr = '';
    //dopo metto i gruppi come dropdown buttons 
    var group = '<div class="btn-group" ' + stylestr + '>\
                <button type="button" class="k-button dropdown-toggle" data-toggle="dropdown">\
                {0}</button>\
                <ul class="dropdown-menu" role="menu">\
                {1}\
                </ul>\
            </div>'.format(getObjectText(key),
        btns
    );
    element.toolbar.push({ name: getObjectText(key), template: group });

}

function evaluatePageSizeAndCustomPagingOptions(element, gridExtension) {
    if (gridExtension && gridExtension.hasOwnProperty('paging_options') && gridExtension.paging_options.disable_server_paging === true) {
        element.dataSource.serverPaging = !gridExtension.paging_options.disable_server_paging;
        element.dataSource.serverFiltering = false;
        element.dataSource.serverSorting = false;
        element.dataSource.pageSize = gridExtension.paging_options.page_size || 10;
    }
    // se le pagine sono state impostate >= 100000 vado a disattivare il paging lato server (significa che non viene passato skip/take che verra' impostato server side a 0 / 100000) 
    else
        if (element.dataSource.pageSize == 0) {
            element.dataSource.serverPaging = false;
            element.dataSource.serverFiltering = false;
            element.dataSource.serverSorting = false;
            element.dataSource.pageSize = 10;
        }
}

function manageHiddenColumns(result, columns) {
    if (result.MagicGridExtension != null) {
        var hiddencolumns = $.map(JSON.parse(result.MagicGridExtension).hidden_columns, function (v, i) { return v.Column });
        if (hiddencolumns && hiddencolumns.length > 0)
            $.each(columns, function (i, v) {
                if (hiddencolumns.indexOf(v.field) != -1)
                    v.hidden = true;
            });
    }
}

function manageGroupedFields(result, element) {
    if (result.MagicGridExtension != null) {
        var groupedfields = $.map(JSON.parse(result.MagicGridExtension).grouped_columns, function (v, i) { return v.Column });
        if (groupedfields && groupedfields.length > 0) {
            element.dataSource.group = [];
            $.each(groupedfields, function (i, v) {
                element.dataSource.group.push({ field: v });
            });
        }
    }
}

//#region Xml fields columns and model  management
function setOverridesToMenuData(gridname, data) {
    var objToStore = getOverridesFromMenuData(gridname);
    if (!objToStore)
        objToStore = {};
    objToStore[gridname] = data;
    $(".menuId-" + getMagicAppURIComponents().menuId).data("overrides", objToStore);
}
function getOverridesFromMenuData(gridName, key) {
    var data = $(".menuId-" + getMagicAppURIComponents().menuId).data("overrides");
    if (data && data[gridName] && data[gridName][key])
        return data[gridName][key];
    return false;
}
//Modify columns for XML fields 
function modifyXmlColumnSet(userFields, containerCol, columns, editFormColumnNum, columnsoverride, gridExtension) {
    $.each(userFields.fields, function (k, v) {
        if (!v.containerColumn)
            v.containerColumn = containerCol;
        var dsinfo = v.dataSourceInfo ? v.dataSourceInfo : {};
        var currentlang = window.culture.substring(0, 2);
        var label = v.labels[currentlang] ? v.labels[currentlang] : k
        var additionalattributes = (v.validation && v.validation.required) ? "required" : "";
        additionalattributes = additionalattributes + " iscustomerfield=true";//add an attribute in order to identify inputs after append
        if (v.column_format) {
            var colformat = v.column_format.indexOf("0:") != -1 ? v.column_format.replace("0:", "").replace("{", "").replace("}", "") : colformat;
            additionalattributes = additionalattributes + " data-format=\"" + colformat + "\"";
        }
        if (gridExtension && gridExtension.columnExtensions && gridExtension.columnExtensions[k])
            if (gridExtension.columnExtensions[k].editable === false) {
                additionalattributes = additionalattributes + " disabled ";
                v.editable = false;
            }
        switch (v.dataRole) {

            case "datetimepicker":
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, v.type, label, additionalattributes);
                v.column_template = function (dataItem) { if (dataItem[k] == null) return ""; else return kendo.toString(dataItem[k], "g"); }
                v.column_attributes = "text-align:center;";
                break;
            case "datepicker":
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, v.type, label, additionalattributes);
                v.column_template = function (dataItem) { if (dataItem[k] == null) return ""; else return kendo.toString(dataItem[k], "d"); }
                v.column_attributes = "text-align:center;";
                break;
            case "timepicker":
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, v.type, label, additionalattributes);
                v.column_template = function (dataItem) { if (dataItem[k] == null) return ""; else return kendo.toString(dataItem[k], "t"); }
                v.column_attributes = "text-align:center;";
                break;
            case "dropdownlist":
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, k, dsinfo.dsValueField, dsinfo.dsTextField, dsinfo.dataSource, label, additionalattributes, k + "dd");
                break;
            //case "searchgrid_autocomplete":
            case "searchgrid":
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, label, v.searchGrid.searchGridLabelColumn, v.searchGrid.searchGridMagicGridName, v.searchGrid.searchGridLabelColumn, "", "", "", (v.validation && v.validation.required) ? "required" : "");
                break;
            case "checkbox":
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, label, additionalattributes);
                v.column_template = '<input type="checkbox" #= {0} ? "checked=checked" : "" # disabled="disabled" ></input>'.format(k);
                break;
            case "colorpicker":
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, label, additionalattributes);
                userFields.fields[k].defaultValue = '#FFFFFF';
                v.column_template = function (dataItem) {
                    var templ = '<div style="height:30px;width:100%;background-color:{0};"></div>';
                    if (dataItem[k] == null) return templ.format("rgb(255,255,255,0)");
                    else return templ.format(dataItem[k]);
                }
                break;
            default:
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, label, additionalattributes);
                break;
        }
        var column;
        //if columns have been overriden then i ignore the standard setting
        if ((!columnsoverride && v.visibleAsColumn) || (columnsoverride && columnsoverride.indexOf(k) != -1)) {
            column = { field: k, title: label };
            if (v.column_template)
                column.template = v.column_template;
            if (v.column_format)
                column.format = v.column_format;
            if (v.column_attributes)
                column.attributes = { style: v.column_attributes };

            if (gridExtension && gridExtension.columnExtensions && gridExtension.columnExtensions[column.field])
                column = $.extend(column, gridExtension.columnExtensions[v.field]);

            columns.push(column);
        }
        var wrapperCols = editFormColumnNum ? 12 / editFormColumnNum : 6;
        v.popupHtml = '<div class="col-sm-' + wrapperCols + '">' + v.popupHtml + '</div>';
        v.isCustomUserField = true;
    });

}
function manageUserFields(result, model, gridExtension, columns) {
    if (!result.userFields || !result.userFields.fields)
        return;
    var containerCol = "";
    $.each(model.fields, function (k, v) {
        if (v.databasetype == "xml") {
            containerCol = k;
            return false;
        }
    });
    //set before creating grids...
    var columnsoverride = getOverridesFromMenuData(result.MagicGridName, "xmlcolumnsoverride");
    modifyXmlColumnSet(result.userFields, containerCol, columns, result.EditFormColumnNum, columnsoverride ? columnsoverride : null, gridExtension);
    $.extend(model.fields, result.userFields.fields);
}
function manageOverwriteColumns(standardConfig, overwriteConfig, kendoPopupID) {
    try {
        overwriteConfig = JSON.parse(overwriteConfig);
        var editableTemplate = $('#' + kendoPopupID);
        var EN = 'en-GB';
        var IT = 'it-IT';
        var DE = 'de-DE';
        if (editableTemplate.length > 0) {
            var $editableTemplateHTML = $(editableTemplate.html());
            for (var i = 0; i < overwriteConfig.length; i++) {
                var ov = overwriteConfig[i];
                var st = $.grep(standardConfig, function (obj) { return obj.field == ov.field })[0];
                var popupLabel = null;
                if (st) {
                    popupLabel = $editableTemplateHTML.find("label[for='" + ov.field + "']");
                    if (!popupLabel.length) {
                        popupLabel = $editableTemplateHTML.find("label[for='" + $editableTemplateHTML.find("input[name='" + ov.field + "']").attr("id") + "']");
                    }
                    if (!ov.visible) {      //if Overwrite-Column is not visible: remove COLUMN from Standard-Configuration, hide Popup-LABEL.
                        var spliced = standardConfig.splice(standardConfig.indexOf(st), 1);
                        popupLabel.parent().parent().hide();
                    }
                    popupLabel.html(ov.title);
                    $.extend(st, ov);       //OVERWRITE COLUMNS's properties () with Overwrite-Column's props.
                    delete st.Translations;
                    //delete st.Columns_OrdinalPosition;
                } else if (ov.visible) {    //Overwrite-Column is added to Configuration if it wasn't included in Standard-Configuration.
                    st = ov;
                    standardConfig.push(st);
                } else {
                    st = {}; //TODO: remove this
                }

                switch (culture) {          //Apply translation to COLUMN & LABEL if setted for current culture.
                    case EN:
                        if (ov.Translations[EN]) {
                            st.title = ov.Translations[EN];
                            if (popupLabel) {
                                popupLabel.html(ov.Translations[EN]);
                            }
                        }
                        break;
                    case IT:
                        if (ov.Translations[IT]) {
                            st.title = ov.Translations[IT];
                            if (popupLabel) {
                                popupLabel.html(ov.Translations[IT]);
                            }
                        }
                        break;
                    case DE:
                        if (ov.Translations[DE]) {
                            st.title = ov.Translations[DE];
                            if (popupLabel) {
                                popupLabel.html(ov.Translations[DE]);
                            }
                        }
                        break;
                }
            }
            editableTemplate.html($editableTemplateHTML);
            standardConfig = sortConfigurationByOrdinalPosition(standardConfig);
        }
    } catch (e) {
        console.error("Error while applying Overwrite-Configuraion!", e);
    }
}
function sortConfigurationByOrdinalPosition(config) {
    return config.sort((a, b) => {
        if (a.command || b.command) {
            return 0;
        }
        return (b.Columns_OrdinalPosition != null) - (a.Columns_OrdinalPosition != null) || a.Columns_OrdinalPosition - b.Columns_OrdinalPosition;
    });
};
/**
 * removes the delete and edit buttons if Editable in the row is === false
 * @param {any} grid - the Jquery element of the underlying grid which corresponds to the popup
 */
function manageEditButtonsOnDataBoundAndPopUpCancel(grid) {
    var gridExtension = null;
    if (grid.data('kendoGrid') && grid.data('kendoGrid').options && grid.data('kendoGrid').options.gridExtension) {
        gridExtension = grid.data('kendoGrid').options.gridExtension;
    }
    grid.find("tbody tr .k-grid-edit").each(function () {
        var currentDataItem = grid.data("kendoGrid").dataItem($(this).closest("tr"));

        //Check in the current dataItem if the row is editable
        //D.T: 3 May 2019 change req. in popup show the button anyway allowing popup opening without showing the save button
        if (currentDataItem != null && typeof currentDataItem.Editable != "undefined")
            if (currentDataItem.Editable == false && (!(grid.data("kendoGrid").options.editable && grid.data("kendoGrid").options.editable.mode == "popup") || gridExtension.magicWizardCode)) {
                $(this).remove();
            }
    });

    //Selects all delete buttons
    grid.find("tbody tr .k-grid-delete").each(function () {
        var currentDataItem = grid.data("kendoGrid").dataItem($(this).closest("tr"));
        //Check in the current dataItem if the row is deletable
        if (currentDataItem != null && typeof currentDataItem.Editable != "undefined")
            if (currentDataItem.Editable == false) {
                $(this).remove();
            }
    });
}
var editFormData = null;

function getGridCodeFromResultIfDifferentFromRequested(result, gridcode) {
    if (result && result.MagicGridName && gridcode != result.MagicGridName)
        return result.MagicGridName;
    return "";
}
function updateGridSettingsRootGridSettings(dataSource, gridCode, functionid) {

    let usersGridSettings = getSessionStorageGridSettings(gridCode, functionid);
    dataSource.filter = usersGridSettings.filter && usersGridSettings.filter.type ? { filters: [usersGridSettings.filter], logic: "and" } : usersGridSettings.filter;
    dataSource.group = usersGridSettings.group;
    dataSource.sort = usersGridSettings.sort;
    //update the grid settings which are set in getrootgrid when that alt grid name is not known yet 
}

function fillgridelementWithDBdata(result, element, gridcode, layerid, functioname, functionid, gridname, gridrelationtype, e, tabclass, $parentGridRow) {
    //if no funcitonid is passed into this function we are going to lookup the funcid attr of the menuPt
    //because this funcid could differ from the functionId on the config-db we have to look it up
    //resolve config functionId 
    function getFormEditData(gridname) {
        return $.get("api/MAGIC_GRIDS/GetEditFormData/", { magicgridname: gridname });
    }
    var functionIdLookup = $.Deferred();
    if (functionid == "-1") {
        var $menuPt = $(".menuId-" + getMagicAppURIComponents().menuId);
        if ($menuPt.length) {
            functionid = $menuPt.find("a").attr("funcid");
            var targetFuncId = getFromSessionObject("targetFunctionIds", functionid);
            if (!targetFuncId) {
                var guid = $menuPt.data("guid");
                if (guid)
                    $.ajax({
                        url: "/api/Magic_Functions/GetIDFromGUID/" + guid,
                        success: function (res) {
                            functionIdLookup.resolve(res);
                        }
                    });
            }
            else
                functionIdLookup.resolve(targetFuncId);
        }
        else
            functionIdLookup.resolve(functionid);
    }
    else
        functionIdLookup.resolve(functionid);

    //wait until config-db functionId is resolved
    functionIdLookup.then(function (functionid) {
        //After modifications for Master-Alternative grids i can request a grid and get a different one, then code and name variables must have this values corresponding to the alt. grid
        if (getGridCodeFromResultIfDifferentFromRequested(result, gridcode)) {
            let gridcodeFromDB = getGridCodeFromResultIfDifferentFromRequested(result, gridcode);
            if (gridcode == gridname)
                gridcode = gridname = gridcodeFromDB;
            else {//e.g searchGrids have a gridname _search...
                gridcode = gridcodeFromDB;
                if (!e) //root level grid
                    //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/234 grid settings with alt layer not properly working for filter, sort, group
                    updateGridSettingsRootGridSettings(element.dataSource, gridcodeFromDB, functionid);
            }
        }
        element.gridcode = gridcode;
        //needed to properly manage searchgrids with layers. need to trace the originally requested name 
        if (result.MasterGridName)
            element.MasterGridName = result.MasterGridName;
        element.functionid = functionid;
        console.log("MagicUtils.js::fillgridelementWithDBdata::begins for grid " + gridcode + " " + new Date().toLocaleString());
        getFormEditData(gridcode).then(function (response) {
            try {
                var parsed = [];
                if (typeof response == 'string') {
                    parsed = JSON.parse(response);
                } else { //already parsed
                    parsed = response;
                }

                if (parsed.msg && parsed.msg == 'No FormEdit-Layout available.') {
                    editFormData = null;
                    return;
                }

                $.each(parsed, function (i, p) {
                    if (p.MagicFormExtension) {
                        try {
                            p.MagicFormExtension = JSON.parse(p.MagicFormExtension);
                        } catch (e) {
                            p.MagicFormExtension = JSON.parse(p.MagicFormExtension.replace(/\\n/g, " ").replace(/\\r/g, " "));
                        }
                    }
                });
                editFormData = parsed;
            }
            catch (ex) {
                console.log(ex);
            }
        });
        var data = result,
            saveGridSettings = !e && (!gridname || !gridname.match(/_searchgrid$/i));
        //La risposta varia a seconda che sia sicrona o asincrona
        if (result.responseJSON !== undefined)
            data = result.responseJSON;

        //delete all carriage return and new lines
        if (data.MagicGridModel)
            data.MagicGridModel = data.MagicGridModel.replace(/(?:\\[rn])+/g, "");
        var model = eval(data.MagicGridModel),
            columns = eval(data.MagicGridColumns),
            gridExtension = data.MagicGridExtension ? JSON.parse(data.MagicGridExtension) : {};
        var parsedAggregations = {
            aggregations: {},
            aliases: {},
            initialTemplate: {
                footer: {},
                header: {}
            }
        };
        if (gridExtension.columnExtensions || gridExtension.aggregateFunctionsForColumnsFooterTemplate) {
            $.each(columns, function (k, v) {
                if (gridExtension.columnExtensions && gridExtension.columnExtensions[v.field])
                    $.extend(v, gridExtension.columnExtensions[v.field]);
                if (v.footerTemplate) {
                    parsedAggregations.initialTemplate.footer[v.field] = v.footerTemplate;
                    v.footerTemplate = '<span class="to-be-replaced" data-column="' + v.field + '" data-template-pos="footer">' + v.footerTemplate.replace(/(^|[^\\]{2,4})(#=?[\s]+(.*?)[\s]+#)/g, function ($0, $1) { return $1 + '<i class="fa fa-spinner fa-spin"></i>'; }) + '</span>';
                }
                if (v.headerTemplate) {
                    parsedAggregations.initialTemplate.header[v.field] = v.headerTemplate;
                    v.headerTemplate = '<span class="to-be-replaced" data-column="' + v.field + '" data-template-pos="header">' + v.headerTemplate.replace(/(^|[^\\]{2,4})(#=?[\s]+(.*?)[\s]+#)/g, function ($0, $1) { return $1 + '<i class="fa fa-spinner fa-spin"></i>'; }) + '</span>';
                }
            });
        }
        if (gridExtension.aggregateFunctionsForColumnsFooterTemplate) {
            var findsAggregations = /(\w+)\(([\w\d]+)\)\s+as\s+\[?([\w\d]+)/g;
            var res;
            while ((res = findsAggregations.exec(gridExtension.aggregateFunctionsForColumnsFooterTemplate)) !== null) {
                if (!(res[2] in parsedAggregations.aggregations))
                    parsedAggregations.aggregations[res[2]] = [];
                parsedAggregations.aggregations[res[2]].push(res[1]);
                parsedAggregations.aliases[res[2] + "_" + res[1]] = res[3];
            }
            parsedAggregations.aggregations = $.map(parsedAggregations.aggregations, function (v, k) { return { column: k, functions: v }; });
            gridExtension.aggregateFunctionsForColumnsFooterTemplate = parsedAggregations;
        }
        element.gridExtension = gridExtension;
        element.guid = data.GUID;

        if (gridExtension.startEmpty) {
            element.autoBind = false;
        }
        manageUserFields(data, model[0], gridExtension, columns);
        if (data.overwrittenColumns) {
            manageOverwriteColumns(columns, data.overwrittenColumns, data.EditableTemplate);
        }
        var xmlFilter = {}, xmlFields = {};
        $.each(model[0].fields, function (k, v) {
            if ("containerColumn" in v) {
                xmlFilter[k] = {
                    type: v.type,
                    column: v.containerColumn
                };
                xmlFields[v.containerColumn] = null;
            }
        });
        //#region datasource overwrite
        //handle grids which shall call the controller with batch data
        try {
            var customParam = eval("[" + data.CustomJSONParam + "]")[0];
            if (customParam && customParam.batch)
                element.dataSource.batch = customParam.batch;
        }
        catch (e) {
            console.log(e);
        }

        var transport = eval(data.MagicGridTransport);

        element.EntityName = data.FromTable;

        element.dataSource.transport = transport[0];
        element.dataSource.transport.CustomJSONParam = data.CustomJSONParam;
        //Di seguito la creazione delle request di input per i controller (parameterMap)

        element.dataSource.transport.parameterMap = function (options, operation) {
            function getXmlFieldsOutOfLayer(model, options) {
                var listofkeysToExclude = [];
                if (!options.listOfXMLFieldsInPopUp && options.MagicBOLayerID == undefined)
                    return listofkeysToExclude;
                var modelrevision = JSON.parse(JSON.stringify(model));
                var liskofkeys = Object.keys(modelrevision[0]["fields"]);
                $(liskofkeys).each(function (i, v) { //cancellazione dei campi che non fanno parte del layer dell' oggetto che sto salvando
                    if (model[0]["fields"][v].containerColumn) //campo che sta nell' xml
                    {   //se e' una colonna con container XML il layer deve essere collegato ad un qualche campo del DB target. Se non trovo questo collegamento cancello le proprieta' dei campi XML
                        //window[layerlistname] e' un array popolato in fase di edit popup che contiene la lista dei layer che il row si porta dietro (sulla base del valore di un certo campo legato al layer su tabella target es. TIPDOC) 
                        if (options.MagicBOLayerID != undefined) {
                            if (options.MagicBOLayerID == null || !window[layerlistname]) //se l' oggetto non appartiene ad uno specifico layer cancello i campi specifici dei layer
                                listofkeysToExclude.push(v);
                            if (window[layerlistname] && window[layerlistname] != null) {
                                if (window[layerlistname].indexOf(model[0]["fields"][v].Layer_ID) == -1) //se l'  oggetto ha un layer diverso da quello del campo esaminato lo cancello
                                    listofkeysToExclude.push(v);
                            }
                        }
                        else if (options.listOfXMLFieldsInPopUp && !options.listOfXMLFieldsInPopUp[v]) {
                            listofkeysToExclude.push(v);
                        }
                    }
                });
                return listofkeysToExclude;
            }

            if (!options.data && element.getApiCallData) {
                options.data = JSON.stringify(element.getApiCallData());
            }

            var colnames = [];

            for (var i = 0; i < columns.length; i++) {
                {
                    if (typeof columns[i].title != "undefined") {
                        if (columns[i].field != null && colnames.indexOf(columns[i].field) == -1)
                            colnames.push(columns[i].field);
                    }
                }
            }

            if (operation != "read") {
                //Bug #4957: work on a copy of the master object in order to avoid modifying the kendo object (problems with dates when db error occurs)
                var options_copy = {};
                $.each(options, function (key, value) {
                    if (value instanceof Date) {
                        options_copy[key] = new Date(value.getTime());
                    }
                    else
                        options_copy[key] = value;
                });


                if (options_copy.MagicBusinessObjectList !== undefined)
                    options_copy.MagicBusinessObjectList = JSON.stringify($('#tabstrippopup .bo-tagbox').bOSelector('getBOs'));

                //parse Date - eliminate Timezone
                try {
                    allPropertiesToTimeZoneLessString(options_copy);
                }
                catch (e) {
                    console.log('Error while parsing date for grid POST: ' + e);
                }
                options_copy.cfglayerID = layerid === undefined ? null : layerid;
                options_copy.cfgfunctionID = functionid;
                options_copy.cfgoperation = operation;
                options_copy.cfgGridName = data.MagicGridName;
                options_copy.cfgColumns = colnames;
                options_copy.cfgsnapShot = gridExtension ? gridExtension.snapshot : false;
                //pass the list of fields that should not be saved into XML field (only for XML fields)
                options_copy.cfgXMLFieldsOutOfLayer = getXmlFieldsOutOfLayer(model, options);
                if (!options_copy.cfgsnapShot)
                    $("#appcontainer").data("snapshot", null);
                if ($("#appcontainer").data("snapshot"))
                    options_copy.cfgsnapShotData = $("#appcontainer").data("snapshot");
                return kendo.stringify(options_copy);
            }
            else {
                if (gridExtension && gridExtension.hasOwnProperty('paging_options') && gridExtension.paging_options.disable_server_paging === true) {
                    options.take = 100000;
                    options.skip = 0;
                    options.page = 1;
                    options.serverPaging = !gridExtension.paging_options.disable_server_paging;
                    options.pageSize = gridExtension.paging_options.page_size || 10;

                    var filter = options.filter || element.dataSource.filter;
                    if (!element.dataSource.serverFiltering) //clear user filters if is not serverFiltering
                        filter = removeFiltersByType($.extend({}, filter), ["searchBar", "user", undefined]);
                    options.filter = formatDateFilters(filter);
                }
                else
                    if (options.skip == undefined) // se e' stato disattivato il serverPaging lo skip ed il take non vengono passati metto io i defaults per il server.
                    {
                        options.take = 100000;
                        options.skip = 0;
                        options.page = 1;
                        var filter = options.filter || element.dataSource.filter;
                        if (!element.dataSource.serverFiltering) //clear user filters if is not serverFiltering
                            filter = removeFiltersByType($.extend({}, filter), ["searchBar", "user", undefined]);
                        options.filter = formatDateFilters(filter);
                    }
                    else {//parse Date - eliminate Timezone
                        options.filter = formatDateFilters(options.filter);
                    }
                options.layerID = layerid === undefined ? null : layerid;
                options.GridName = data.MagicGridName;
                options.functionID = functionid;
                options.operation = operation;
                options.Columns = colnames;
                //insertion of the eventual Qs as a parameter 
                if (getQsPars())
                    options.data = kendo.stringify({ actionfilter: getQsPars() });

                extendPayloadWithUserGeoLocation(options);
                extendPayloadWithParentGridName(options, element.gridElement);

                if (window.getMSSQLFileTable && gridExtension.documentSearchColumns && element.gridElement) {
                    options.documentSearch = {};
                    var hasSearch = false;
                    $('.document-search input', element.gridElement).each(function () {
                        hasSearch = hasSearch || $(this).val();
                        options.documentSearch[$(this).attr('name')] = {
                            searchText: $(this).val(),
                            savePath: $(this).data('savePath')
                        };
                    });
                    $('.document-search > button > .k-filter', element.gridElement).remove();
                    if (hasSearch)
                        $('.document-search > button', element.gridElement).append('<span class="k-icon k-filter"></span>');
                }

                return kendo.stringify(options);
            }
        };
        element.dataSource.error = error;
        element.dataSource.schema.model = model[0];
        $.each(element.dataSource.schema.model.fields, function (k, v) {
            if (v.type == "date")
                element.dataSource.schema.model.fields[k].defaultValue = null;
            if (gridExtension.massiveUpdate_form_columns && $.map(gridExtension.massiveUpdate_form_columns, function (v, i) { return v.Column }).indexOf(k) != -1) {
                element.dataSource.schema.model.fields[k].visibleForMassiveUpdate = true;
            }
        });

        if (gridExtension.reloadDashboard)
            element.dataSource.reloadDashboard = true;
        if (gridExtension.startEmpty)
            element.startEmpty = gridExtension.startEmpty;
        if (gridExtension.showAllAtOnceFilter || window.showAllAtOnceFilter)
            element.showAllAtOnceFilter = gridExtension.showAllAtOnceFilter || window.showAllAtOnceFilter;
        if (gridExtension.magnifyBreadcrumbDescriptionColumn)
            element.magnifyBreadcrumbDescriptionColumn = gridExtension.magnifyBreadcrumbDescriptionColumn;

        //#endregion
        addOptionalColumns(columns, data, gridExtension, element.dataSource);

        //gestione dei filtri di default a livello datasource sulle griglie
        if (result.Filter != null) {
            //setta i default values e i filtri di default (3o parametro e = null)
            filtersolver(result.Filter, element, null, "True", "defaultFilter");
        }
        if (element.dataSource.sort && element.dataSource.sort.length) {
            console.log("user setting of sort set");
        } else {
            try {
                element.dataSource.sort = JSON.parse(result.OrderByFieldName);
            }
            catch (e) {
                console.log("something went wrong while parsing JSON string with sort criteria...");
            }
        }

        manageHiddenColumns(result, columns);
        element.columns = columns;
        //handles grid properties in DB
        var istouchWithMuplipleSelection = false;
        element.selectable = function () {
            if (data.Selectable == null || data.Selectable == "false")
                return false;

            var match = data.Selectable.match(/^multiple(,\s*(\w+))?$/);
            if (match && 'ontouchstart' in window) {
                istouchWithMuplipleSelection = true;
                return match[2] || "row";
            }
            else
                return data.Selectable;
        }();
        element.groupable = (data.Groupable != "true" && data.Groupable != null) ? eval(data.Groupable) : element.groupable;
        if (element.groupable != false)
            manageGroupedFields(result, element);
        element.sortable = data.Sortable != null ? eval(data.Sortable) : element.sortable;
        element.dataSource.pageSize = data.PageSize != null ? eval(data.PageSize) : element.dataSource.pageSize;
        evaluatePageSizeAndCustomPagingOptions(element, gridExtension);
        //#region fk management
        // if the grid is in a tab has been marked as noneditable by getStandard_GetTabRestrictions consider the grid as not Editable. Works only for the detail init case. For popup it's managed in appendGridInEditTemplateTab
        if ($parentGridRow && $parentGridRow.context && $($parentGridRow.context).attr("noneditable") == "true") {
            data.Editable = "false";
        }

        if (data.Editable != null)
            if ((data.Editable == "true") || (data.Editable == "false")) {
                element.editable = toBoolean(data.Editable);
                if (element.editable)
                    //if the grid is incell editable navigatable is set to true else false (gives problems when selecting)
                    element.navigatable = true;
                if (data.EditableTemplate != null) {
                    if ($("#" + data.EditableTemplate).length == 0) {
                        //search for template if not assigned - sync call
                        getTemplateByName(data.EditableTemplate, layerid, functionid)
                            .done(function (template) {
                                if (template) {
                                    if ($("#templatecontainer").length == 0)
                                        $("#appcontainer").after("<div id='templatecontainer'></div>");
                                    $("#templatecontainer").append(template);
                                    element.foreignValues = managegridfk(element, data, $parentGridRow);
                                }
                                else {
                                    console.log("Template " + data.EditableTemplate + " not found");
                                }
                            });
                    }
                    //fk in grids
                    element.foreignValues = managegridfk(element, data, $parentGridRow);
                }
            }
            else {
                var editableobj = {};
                // editableobj.confirmation = function () { return getObjectText("CONFIRMATION"); };
                editableobj.confirmation = getObjectText("CONFIRMATION");
                editableobj.mode = data.Editable;
                if (data.Editable == "incell")
                    element.navigatable = true;
                editableobj.window = { title: getObjectText("edit") };
                if (data.EditableTemplate != null) {
                    if ($("#" + data.EditableTemplate).length == 0) {
                        console.log("Template " + data.EditableTemplate + " is referenced but not assigned. It gets auto-assigned now.");
                        //search for template if not assigned
                        getTemplateByName(data.EditableTemplate, layerid, functionid)
                            .done(function (template) {
                                if (template) {
                                    if ($("#templatecontainer").length == 0)
                                        $("#appcontainer").after("<div id='templatecontainer'></div>");
                                    $("#templatecontainer").append(template);
                                }
                                else
                                    console.log("Template " + data.EditableTemplate + " not found.");
                            });
                    }
                    try {
                        //fix firefox problem with certain templates
                        var ffoxHtmlContentFix = function (jqObject) {
                            if (!jqObject) {
                                console.log("Edit template missing!");
                                return '';
                            }
                            if (jqObject.html())
                                return jqObject.html();
                            else
                                return '<div id="tabstrippopup" data-role="tabstrip" data-activate="popUpTabActivation">' + $($("#" + data.EditableTemplate)[0].firstChild).html() + '</div>';
                        }
                        editableobj.template = kendo.template(ffoxHtmlContentFix($("#" + data.EditableTemplate)));
                        //fk in grids
                        element.foreignValues = managegridfk(element, data, $parentGridRow);
                        element.editable = editableobj;
                    }
                    catch (e) {
                        console.log("Template " + data.EditableTemplate + " is invalid. Please check it.");
                        element.editable = false;
                    }
                }
            }

        if (typeof element.columns[0].command !== "undefined") {
            for (k = 0; k < element.columns[0].command.length; k++) {
                if (element.columns[0].command[k].name === "edit") {
                    element.columns[0].command[k].text = { edit: "", update: getObjectText("save"), cancel: getObjectText("cancel") };
                    break;
                }
            }
            //admin area customization setting. Name has to be unique otherwise it will be called multiple times... kendo bug
            if (gridExtension.addZoomButton)
                element.columns[0].command.push({ name: 'zoom' + new Date().getUTCMilliseconds(), click: zoomByfilteringPrimaryKey, text: '<span class="k-icon k-filter"></span>' });
        }

        manageuserrightsincommandcolumn(element, data, gridExtension);

        var gridHasCommands = true;
        //se non ho comandi non mostro la colonna dei comandi
        if (typeof element.columns[0].command === "undefined")
            gridHasCommands = false;
        else if (element.columns[0].command.length === 0) {
            element.columns.splice(0, 1);
            gridHasCommands = false;
        }

        if (gridHasCommands && window.addCommandsToLastColumn) {
            var commandColumn = element.columns.splice(0, 1);
            element.columns.push(commandColumn[0]);
        }

        //#endregion
        //#region toolbar management
        var toolbartoadd = data.ToolbarCmdToAdd != null ? eval(data.ToolbarCmdToAdd) : null;

        if (data.Editable == "false")
            element.Toolbar = [];
        if (data.Toolbar === null && data.Editable === "true")
            element.toolbar = [{ name: "create", text: getObjectText("create") }, { name: "save", text: getObjectText("save") }, { name: "cancel", text: getObjectText("cancel") }];

        try {
            element.toolbar = data.Toolbar != null ? eval(data.Toolbar) : element.toolbar;
        }
        catch (e) {
            console.log("Evaluation of Toolbar Failed with exception" + e.message + "; Toolbar has been set as void (toolbar = [])");

        }
        // se l' edit e' in popup elimino il save dalla toolbar indipendentemente dai setting utente
        if (data.Editable === "popup" && element.editable && element.editable.window) {
            //manage window dimensions
            element.editable.window.width = parseInt(data.EditFormColumnNum) * 400;

            var toolbarrev = [];
            for (var k = 0; k < element.toolbar.length; k++) {
                if (element.toolbar[k].name !== "save" && element.toolbar[k].name !== "cancel")
                    toolbarrev.push(element.toolbar[k]);
            }
            element.toolbar = toolbarrev;
        }
        //aggiungo la fast search per tutte le master se il Toolbar non e' stato customizzato
        if (data.Toolbar === null && $.isArray(element.toolbar) && gridrelationtype === undefined)
            element.toolbar.push({ template: standardGridfastsearch , alwaysShow:true });
        else if ($.isArray(element.toolbar))
            element.toolbar.push({ template: '<div style="margin: 0 auto; order: 1;"></div>' });
        //creazione del template per i toolbar buttons
        if (toolbartoadd != null)
            buildToolbarBtnTemplate(element, toolbartoadd);
        if (window.UserIsDeveloper === "True" && gridcode !== "Magic_Grid")
            element.toolbar.push({
                template: "<a title=\"Config\" class=\"k-button pull-right\" href=\"/app\\#/function/" + window.GridConfigurationFunctionID + "\" onclick=\"ConfigGrid('" + gridcode + "')\"><span class=\"k-icon k-i-custom\"></span></a>"
            });

        if (gridExtension.show_group_by_functionality) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"Aggregate\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"openGridAggregationOptions(this)\"><span class=\"fa fa-calculator\"></span></a>"
            });
        }
        if (window.getMSSQLFileTable && gridExtension.documentSearchColumns) {
            element.toolbar.push({
                template: '<div class="btn-group pull-right document-search">\
                                <button type="button" title="' + getObjectText('documentSearch') + '" class="k-button dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="fa fa-search"></span></button>\
                                <div class="dropdown-menu" style="background: white; padding: 5px;">\
                                    <div class="dropdown-header">' + getObjectText('documentSearch') + '</div>\
                                    <div class="dropdown-divider"></div>\
                                    <form onsubmit="$(this).closest(\'[data-role=grid]\').data(\'kendoGrid\').dataSource.read(); return false;">' +
                    $.map(gridExtension.documentSearchColumns.split(','), function (column) {
                        var title = column;
                        var savePath = element.dataSource.schema.model.fields[column] && element.dataSource.schema.model.fields[column].uploadInfo ? element.dataSource.schema.model.fields[column].uploadInfo.savePath : "";
                        $.each(element.columns, function (k, col) {
                            if (col.field == column) {
                                title = col.title;
                                return false;
                            }
                        });
                        return '<div><label style="width: 100%" onclick="event.stopPropagation()">' + title + '<br/><input style="width: 100%" type="text" class="k-input k-textbox" name="' + column + '" data-save-path="' + savePath + '" /></label></div>'
                    }).join('\n')
                    + '<p>\
                                        <button type="submit" class="k-button k-primary pull-right" style="width: auto;"><span class="fa fa-search"></span></button>\
                                    </p>\
                                    </form>\
                                </div>\
                            </div>'
            });
        }
        if (gridExtension.show_map) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"Map\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"showGridMap(this)\"><span class=\"fa fa-globe\"></span></a>"
            });
        }
        if (gridExtension.show_tree_map) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"Map\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"showTreeGoogleMap(this)\"><span class=\"fa fa-map\"></span></a>"
            });
        }
        if (gridExtension.show_gisviewer) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"GIS Map\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"showTreeGISMap(this)\"><span class=\"fa fa-road\"></span></a>"
            });
        }
        if (gridExtension.show_tree_scheduler) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"Scheduler with themes tree\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"showTreeScheduler(this,true)\"><span class=\"fa fa-calendar\"></span></a>"
            });
        }
        if (gridExtension.show_scheduler) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"Scheduler\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"showTreeScheduler(this,false)\"><span class=\"glyphicon glyphicon-time\"></span></a>"
            });
        }
        if (gridExtension.magicPivotCodes) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"Show pivots\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"showGridPivot(this,'" + gridExtension.magicPivotCodes + "')\"><span class=\"fa fa-reorder\"></span></a>"
            });
        }
        if (gridExtension.new_bo_mail_settings && gridExtension.new_bo_mail_settings.show_new_mail_button) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"" + getObjectText("newGridBOMail") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"openGridNewBOMail(this, '" + (gridExtension.new_bo_mail_settings.bo_description_column ? gridExtension.new_bo_mail_settings.bo_description_column : "") + "', '" + (data.DocRepositoryBOType ? + data.DocRepositoryBOType : "") + "', " + JSON.stringify(gridExtension.new_bo_mail_settings.system_message_templates || []).replace(/"/g, "'") + ")\"><span class=\"fa fa-envelope\"></span></a>"
            });
        }
        if (gridExtension.show_bo_note_button) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"" + getObjectText("newGridBOMemo") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"openGridNewBOMemo(this, '" + gridExtension.new_bo_mail_settings.bo_description_column + "', '" + data.DocRepositoryBOType + "')\"><span class=\"fa fa-sticky-note\"></span></a>"
            });
        }
        if (element.selectable && data.DocRepositoryBOType && gridExtension.bo_message_settings && gridExtension.bo_message_settings.show_bo_message_button && gridExtension.bo_message_settings.bo_description_column) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"" + getObjectText("newGridMessage") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"openGridMessage(this, '" + data.DocRepositoryBOType + "','" + gridExtension.bo_message_settings.bo_description_column + "')\"><span class=\"fa fa-comment\"></span></a>"
            });
        }
        if ((gridExtension.startEmpty || gridExtension.showAllAtOnceFilter || window.showAllAtOnceFilter) && !e) { //!e means grid is rootgrid
            element.toolbar.push({
                alwaysShow: true, //not depending on user rights
                template: "<a data-toggle=\"tooltip\" title=\"" + getObjectText("setInitialFilterTooltip") + "\" class=\"k-button pull-right\" title=\"" + getObjectText("setInitialFilter") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"setInitialFilter(this)\"><span class=\"fa fa-filter\"></span></a>"
            });
        }
        if (true) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"" + getObjectText("showInFullScreen") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"openGridInFullScreen(this)\"><span class=\"fa fa-expand\"></span></a>"
            });
        }

        if (result.HelpGUID) {
            var id = ('help_' + Math.random()).replace('.', '');
            element.toolbar.push({
                template: "<a id='" + id + "' data-toggle=\"tooltip\" title=\"help\" class=\"k-button pull-right\" title=\"help\" data-role=\"tooltip\" href=\"javascript:void(0)\"><span class=\"fa fa-spinner fa-spin\"></span></a>"
            });
            addFunctionHelp(null, result.HelpGUID)
                .then(onClickFn => {
                    var action = function () {
                        var button = $('#' + id);
                        if (!button.length) {
                            setTimeout(action, 250);
                            return;
                        }
                        button.html('<span class=\"fa fa-question\"></span>')
                            .click(onClickFn);
                    };
                    action();
                });
        }

        if (saveGridSettings) {
            element.toolbar.push({
                alwaysShow:true, //not depending on user rights
                template: "<a class=\"k-button pull-right autoResize\" title=\"" + getObjectText("autoResizeColumns") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"autoResizeColumns(this)\"><span class=\"fa fa-arrows-h\"></span></a>"
                    + "<a class=\"k-button pull-right\" title=\"" + getObjectText("resetUserfilter") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"removeUserFiltersFromToolBarButton(this)\"><span class=\"fa fa-eraser\"></span></a>"
                    + "<a class=\"k-button pull-right\" title=\"" + getObjectText("selectGridSettings") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"selectGridSettings(this)\"><span class=\"fa fa-folder-open-o\"></span></a>"
                    + "<a class=\"k-button pull-right\" title=\"" + getObjectText("saveGridSettings") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"saveUserGridSettings(this)\"><span class=\"fa fa-save\"></span></a>"
                    + "<a class=\"k-button pull-right\" title=\"" + getObjectText("deleteGridSettings") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"deleteUserGridSettings('" + gridcode + "-" + functionid + "', this)\"><span class=\"fa fa-trash-o\"></span></a>"
            });
        }
        element.pdf = {
            title: $("#spanbig").text(),
            fileName: gridcode + ".pdf",
            creator: window.Username,
            margin: { top: "1cm", left: "1cm", right: "1cm", bottom: "1cm" }
        };
        if (element.selectable && element.selectable.indexOf("multiple") == 0 || istouchWithMuplipleSelection) {
            element.toolbar.push({
                template: "<button role='button' data-select-all-sp='" + gridExtension.selectAllSP + "' type='button' class=\"k-button select-all-button\" title=\"" + getObjectText("selectAll") + "\" href=\"javascript:void(0)\" onclick=\"selectAllGridRows(this)\">" + getObjectText("selectAll") + "</button>"
            });
            //add a checkbow that will be used for  multiselection
            if (istouchWithMuplipleSelection)
                element.columns.unshift({
                    template: '<div  align="center"><input class="rowselected__" type="checkbox"  style="height:20px;width:20px;"/></div>'
                });
        }
        const compareColumnNames = ['ExcelFileName__', 'CompareSheet__', 'CompareKeys__'];
        if (Object.keys(element.dataSource.schema.model.fields).filter(col => compareColumnNames.includes(col)).length === 3) {
            element.toolbar.push({
                template: "<button role='button' type='button' class=\"k-button\" title=\"" + getObjectText("compareExcelFiles") + "\" href=\"javascript:void(0)\" onclick=\"compareExcelFiles(this)\">" + getObjectText("compareExcelFiles") + "</button>"
            });
        }
        //#endregion
        if (element.toolbar && Array.isArray(element.toolbar)) {
            for (let i = 0; i < element.toolbar.length; i++) {
                if (element.toolbar[i].template === standardGridfastsearch) {
                    element.toolbar[i].alwaysShow = true;
                    break;  // Exit loop since we found the only possible item
                }
            }
        }

        manageuserrightsintoolbar(element, data);
        //Export to file. This is based on the From table method or to the export property (stored procedure) of the customJsonParam in the grid datasource (it calls the generic DB controller). The FromClass method or a dedicated controller must be custom developed
        var gridRights = getGridRights(gridcode);
        if (data.FromTable != null && data.FromTable != "" && gridRights.usercanexport) {
            window.HashOfExportableGrids[data.MagicGridName] = { entity: data.FromTable, layer: layerid, jsonparam: data.CustomJSONParam };
            if (data.Exportable) {
                element.toolbar.push({ template: getGridExportTemplate((gridExtension && gridExtension.disabled_export_formats) ? gridExtension.disabled_export_formats : null) });
            }
        }
        if (data.DetailTemplate != null && $("#" + data.DetailTemplate).length == 0) {
            getTemplateByName(data.DetailTemplate, layerid, functionid)
                .done(function (template) {
                    if (template) {
                        if ($("#templatecontainer").length == 0)
                            $("#appcontainer").after("<div id='templatecontainer'></div>");
                        $("#templatecontainer").append(template);
                    }
                });
        }
        try {
            element.detailTemplate = data.DetailTemplate != null ? kendo.template($("#" + data.DetailTemplate).html()) : element.detailTemplate;
        }
        catch (e) {
            //search for template if not assigned
            console.log("Template " + data.DetailTemplate + " not found.");
        }
        element.detailInit = (data.DetailInitJSFunction != null && data.DetailInitJSFunction != "true") ? function (e) { eval(data.DetailInitJSFunction + "(e,functioname,functionid);") } : null;
        element.detailInit = (data.DetailInitJSFunction != null && data.DetailInitJSFunction == "true") ? function (e) { getStandardDetailInit(e, functioname, functionid, data.EditFormColumnNum); } : element.detailInit;
        if (element.detailInit == null && element.detailTemplate != null)
            element.detailInit = function (e) { getStandardDetailInit(e, functioname, functionid, data.EditFormColumnNum); };

        element.edit = (data.EditJSFunction != null && data.EditJSFunction != "true") ? function (e) {
            e.functioname = functioname; e.layerid = layerid; e.gridname = gridname;
            e.origfunction__ = function () { getStandardEditFunction(e, functioname, gridname, layerid); };
            e.show_popup_related_grids_on_insert = false;
            try {
                e.show_popup_related_grids_on_insert = gridExtension.show_popup_related_grids_on_insert == true ? true : false;
                e.popupfieldgroups = gridExtension.popupfieldgroups;
            } catch (ex) {
                console.log(ex);
            }
            window[data.EditJSFunction](e, functioname, gridname, layerid);
            forceDataBoundOnCancel(e);
        } : null;
        element.edit = (data.EditJSFunction != null && data.EditJSFunction == "true") ? function (e) {
            e.show_popup_related_grids_on_insert = false;
            try {
                e.show_popup_related_grids_on_insert = gridExtension.show_popup_related_grids_on_insert == true ? true : false;
                e.popupfieldgroups = gridExtension.popupfieldgroups;
            } catch (ex) {
                console.log(ex);
            }
            return getStandardEditFunction(e, functioname, gridname, layerid); forceDataBoundOnCancel(e);
        } : element.edit;
        element.detailTemplateName = data.DetailTemplate != null ? data.DetailTemplate : element.detailTemplate;
        element.editableName = data.EditableTemplate != null ? data.EditableTemplate : element.editable;
        element.editablecolumnnumber = data.EditFormColumnNum;
        element.code = gridcode;

        if (data.Editable === "popup" && gridExtension.addChildGridToParentPopup && gridExtension.addChildGridToParentPopup.length > 0) {
            var editFunction = element.edit;
            var config = {
                gridDefinitions: gridExtension.addChildGridToParentPopup
            };
            element.edit = function (e) {
                if (typeof editFunction == "function")
                    editFunction(e);
                config.parentGridRowDataInEdit = e.model;
                config.parentGridInstance = e.sender;
                e.container.find(".k-tabstrip-wrapper").after(
                    getAngularControllerElement("Magic_GridPopupChildGridsFormController", config, null, null, "gridForm")
                );
            };
            var parameterMap = element.dataSource.transport.parameterMap;
            element.dataSource.transport.parameterMap = function (options, operation) {
                if (config.childGridsData)
                    options.childGridsData = config.childGridsData.data;
                return parameterMap(options, operation);
            };
        }

        if (gridExtension.magicWizardCode && element.editable) {
            element.edit = function (e) {
                e.preventDefault();
                openGridWizard(e.model['WizardCode'] || gridExtension.magicWizardCode, e.model, e.sender, e.container, $parentGridRow);
            }
        }

        var usersGridSettings = getSessionStorageGridSettings(gridcode, functionid);
        if (usersGridSettings.columnSettings) {
            for (var i = 0; i < element.columns.length; i++) {
                if (element.columns[i] && element.columns[i].field && (element.columns[i].field in usersGridSettings.columnSettings)) {
                    //Bug #3914  D.T: if a column has been overridden by the user in a visibile state (hidden undefined or false) be sure to overwrite it against the general configuration
                    if (usersGridSettings.columnSettings[element.columns[i].field] && !usersGridSettings.columnSettings[element.columns[i].field].hidden)
                        usersGridSettings.columnSettings[element.columns[i].field].hidden = false;
                    element.columns[i] = $.extend(element.columns[i], usersGridSettings.columnSettings[element.columns[i].field]);
                    element.columns[i].locked = data.DetailTemplate ? false : element.columns[i].locked;
                }
            }
        }

        $.each(element.columns, function (i, col) {
            if (col && col.field) {
                switch (typeof col.template) {
                    case "undefined":
                        if (col.values) {
                            element.columns[i].template = function (data) {
                                var item = $.grep(col.values, function (item) {
                                    return item.value == data[col.field];
                                })[0];
                                return '<div class="magicGridTd" onclick="initGridCellTooltip(this)">' + (item ? item.text : "") + '</div>';
                            };
                        } else {
                            if (col.format)
                                element.columns[i].template = '<div class="magicGridTd" onclick="initGridCellTooltip(this)">#= typeof ' + col.field + ' == "undefined" || ' + col.field + ' == null ? "" : kendo.toString(' + col.field + ', "' + col.format.replace(/^{0:\s?|}$/g, '') + '") #</div>';
                            else
                                element.columns[i].template = '<div class="magicGridTd" onclick="initGridCellTooltip(this)">#= typeof ' + col.field + ' == "undefined" || ' + col.field + ' == null ? "" : ' + col.field + '.toString().replace(/</g, "&lt;")  #</div>';
                        }
                        break;
                    case "string":
                        element.columns[i].template = '<div class="magicGridTd" onclick="initGridCellTooltip(this)">' + col.template + '</div>';
                        break;
                    case "function":
                        var func = col.template;
                        element.columns[i].template = function (data) {
                            return '<div class="magicGridTd" onclick="initGridCellTooltip(this)">' + func(data) + '</div>';
                        };
                        break;
                }
            }
        });
        //Gestione del Data Bound per togliere i bottoni di edit quando i record non sono editabili, cioe' hanno la proprieta' Editable (se presente) a false (popup)
        //Getione delle FK numeric a null -> le metto a 0  
        //se la relationType e' = 2 (One to One) o 3(M,N) significa che devo togliere il pulsante di Nuovo se c'e gia' un record nel 1o caso sempre nel 2o
        element.dataBound = function onDataBound(e) {

            if (setfromdatabound === true) //non eseguo il databound se e' scatenato da se stesso
            {
                e.preventDefault();
                return false;
            }
            try {
                //#5846 D.T: autoresize by grid extension configuration
                if (e.sender.options.gridExtension && e.sender.options.gridExtension.autoresize)
                    e.sender.element.find("div.k-header.k-grid-toolbar").find("a.autoResize").trigger("click");
            }
            catch (ex) {
                console.log(ex);
            }

            var grid = e.sender.element;
            element.gridElement = grid;
            var gridName = $(grid).attr('gridname');
            //D.T: look up for  grid settings currently set
            updateUserFilterLabel(grid);
            //selectAll must be undone after dataBound is triggered (if active) https://gitlab.ilosgroup.com/ilos/operations/-/issues/298
            undoSelectAllFromDB($(grid));

            //D.T: FIX angular routing conflict with kendo standard commands (buttons)  BEGIN
            $(grid).find("tr a.k-button.k-button-icontext").each(function (i, v) {
                var $v = $(v);
                if (!$v.hasClass("k-grid-delete") && !$v.hasClass("k-grid-edit"))
                    if ($v.attr("href") == "#")
                        $v.attr("href", "javascript:void(0)");
            });
            //END  

            //se gridrelationtype !== undefined significa che sono in master detail (nel detail grid) e devo lavorare sul Nuovo
            if (gridrelationtype !== undefined) {
                if (gridrelationtype == "2") //le griglie sono in 1,1
                {
                    if (e.sender.dataSource.data().length > 0)
                        //remove del Nuovo sulla toolbar
                        grid.find(".k-grid-toolbar .k-grid-add").hide();

                    if (e.sender.dataSource.data().length == 0)
                        //remove del Nuovo sulla toolbar
                        grid.find(".k-grid-toolbar .k-grid-add").show();
                }
                if (gridrelationtype == "3") //le griglie sono in M,N
                {
                    //remove del Nuovo sulla toolbar
                    grid.find(".k-grid-toolbar .k-grid-add").hide();
                    //remove i comandi della delete dalla command column
                    grid.find(".k-grid-delete").hide();
                }
            }
            //fk setto a 0 le FK che hanno valore nullo e setto il dirty a false.
            if (this.options.editable && this.options.editable.mode === undefined) { //se sono nel caso di edit in cell
                $.each(this.columns, function (i, value) {
                    if (value.values !== undefined) {
                        var col = value.field;
                        $.each(e.sender.dataSource.data(), function (index, innerval) {
                            if (innerval[col] === null) {
                                setfromdatabound = true; // uso questa variabile per prevenire il databound quando e' scatenato da se stesso
                                innerval[col] = 0; //fa si che nell' edit incell le FK null vengano viste correttamente anche quando sono null nel DB
                                innerval.dirty = false;
                            }
                        });
                    }
                    setfromdatabound = false; // il prossimo databound viene considerato
                });
            }

            if (this.options.columnMenu) {
                var filterColumns = getFilteredColumns(this.dataSource._filter),
                    sort = this.dataSource.sort(),
                    sortColumns = sort ? $.map(sort, function (v) { return v.field }) : [];
                $("thead th[data-field]", this.element).each(function () {
                    var $this = $(this);
                    $this.find('.k-filter').remove();
                    if (filterColumns.indexOf($this.data("field")) != -1)
                        $this.find('.k-link').append('<span class="k-icon k-filter"></span>');
                });

                if ((filterColumns.length || sortColumns.length) && typeof getMagicMultiValueColumns == "function") {
                    $.each(getMagicMultiValueColumns(gridName), function (k, v) {
                        var $link = $("thead th[data-field='" + k + "'] .k-link", this.element);
                        if ($link.length) {
                            var hasSortIcon = $link.find(".k-filter").length > 0,
                                hasFilterIcon = $link.find("[class*=k-i-arrow-]").length > 0;
                            if (!hasSortIcon || !hasFilterIcon) {
                                $.each(v, function (_k, _v) {
                                    if (!hasFilterIcon && filterColumns.indexOf(_k) != -1) {
                                        hasFilterIcon = true;
                                        $link.append('<span class="k-icon k-filter"></span>');
                                    }
                                    if (!hasSortIcon && sortColumns.indexOf(_k) != -1) {
                                        hasSortIcon = true;
                                        setTimeout(function () {
                                            $link.append('<span class="k-icon k-i-arrow-' + (sort[sortColumns.indexOf(_k)].dir == "asc" ? "n" : "s") + '"></span>');
                                        }, 0);
                                    }
                                });
                            }
                        }
                    });
                }
            }

            if (this.dataSource.filter() && !grid.find("#maingridsearchandfilter").val()) {
                var searchBarFilter = getFiltersByType(this.dataSource.filter(), "searchBar");
                if (searchBarFilter && searchBarFilter.filters && searchBarFilter.filters.length) {
                    grid.find("#maingridsearchandfilter").val(searchBarFilter.filters[0].value);
                }
            }

            if (!this.groupable && !this.detailTemplate) {
                //set width to all columns
                for (var i = 0; i < this.columns.length; i++) {
                    if (!this.columns[i].width) {
                        this.columns[i].width = $('.k-grid-header thead th', this.element).eq(i).outerWidth();
                        this.columns[i].widthHasBeenSetFromUs = true;
                        $('.k-grid-header colgroup col', this.element).eq(i).width(this.columns[i].width);
                        $('.k-grid-content-locked colgroup col, .k-grid-content colgroup col', this.element).eq(i).width(this.columns[i].width);
                    }
                }
            }

            if (saveGridSettings)
                setSessionStorageGridSettings(this);

            //removes all edit buttons where the model 's Editable property === false
            if (grid.data("kendoGrid") != undefined) {
                manageEditButtonsOnDataBoundAndPopUpCancel(grid);
            }

            if (gridExtension.aggregateFunctionsForColumnsFooterTemplate) {
                element.dataSource.filter = e.sender.dataSource.filter() ? e.sender.dataSource.filter() : element.dataSource.filter;
                //D.T:Bug #6549 problems when cleaning filters if aggregations are active
                try {
                    if (element.dataSource.filter && element.dataSource.filter.filters && !element.dataSource.filter.filters.length)
                        element.dataSource.filter = null;
                }
                catch (ex) {
                    console.log(ex);
                }
                var dataSouceOptions = $.extend(true, {}, element.dataSource);
                dataSouceOptions.transport.parameterMap = function (options, operation) {
                    options.aggregations = gridExtension.aggregateFunctionsForColumnsFooterTemplate.aggregations;
                    return element.dataSource.transport.parameterMap.call(this, options, operation);
                };
                var dataSource = new kendo.data.DataSource(dataSouceOptions);
                dataSource.read().then(function () {
                    var data = dataSource.data(),
                        values = {};
                    if (data && data.length) {
                        data = data[0];
                        $.each(gridExtension.aggregateFunctionsForColumnsFooterTemplate.aliases, function (k, v) {
                            if (k in data) {
                                values[v] = data[k];
                            }
                        });
                        grid.find(".k-footer-template span.to-be-replaced, .k-header-template span.to-be-replaced")
                            .each(function (k, el) {
                                var $span = $(el);
                                var columnExistsInDataSourceExtensions = false;
                                try {
                                    // if $span.data("column") is in the dataSourceExtension then do not try to complete the kendo template
                                    //example of the obj:gridExtension. dataSourceExtensions: '{"aggregate": [{"field": "AC_ANAREV_VALUE_TO_CANC","aggregate": "sum","format": "c2"},{"field": "AC_ANAREV_VAT_TO_CANC","aggregate": "sum","format": "c2"}]}'
                                    // this handles only the aggregate fields

                                    if (gridExtension?.dataSourceExtensions && gridExtension?.dataSourceExtensions != "") {
                                        var dataSourceExtensions = JSON.parse(gridExtension?.dataSourceExtensions);
                                        columnExistsInDataSourceExtensions = dataSourceExtensions?.aggregate?.some(function (obj) {
                                            return obj.field === $span.data('column');
                                        });
                                    }
                                }
                                catch (err) {
                                    console.log(`dataSourceExtensions non in formato corretto controllare il json`, err.message);
                                }

                                if (!columnExistsInDataSourceExtensions) {

                                    $span.closest("td").html(
                                        kendo.template(
                                            gridExtension.aggregateFunctionsForColumnsFooterTemplate.initialTemplate[$span.data("template-pos")][$span.data("column")]
                                        )(values)
                                    );
                                }
                            });
                    }
                });
            }

            // get BO history data
            if (data.DocRepositoryBOType) {
                getAssociatedBOForDataSource(e.sender.dataSource, data.DocRepositoryBOType)
                    .then(function (result) {
                        addAssociatedBOToGrid(result, e.sender.element, data.DocRepositoryBOType);
                    });
            }


        };


        if (typeof prerenderdispatcher == 'function')
            prerenderdispatcher(element, functioname, e === undefined ? null : e, tabclass === undefined ? null : tabclass, result);
        //check for dataSourceExtension
        if (gridExtension && gridExtension.dataSourceExtensions) {
            try {
                element.dataSource = $.extend(element.dataSource, JSON.parse(gridExtension.dataSourceExtensions));
            }
            catch (ex) {
                console.log(ex);
            }
        }

        if ($parentGridRow && gridExtension.refreshParentGrid && gridExtension.refreshParentGrid.length > 0) {
            var $parentGrid = $parentGridRow.closest(".k-grid");
            if (gridExtension.refreshParentGrid.indexOf($parentGrid.attr("gridname")) > -1) {
                var $parentGrid = $parentGridRow.closest(".k-grid"),
                    parentGrid = $parentGrid.data("kendoGrid"),
                    oldRequestEndFunction = element.dataSource.requestEnd;
                element.dataSource.requestEnd = function (e) {
                    if (oldRequestEndFunction)
                        oldRequestEndFunction.apply(this, arguments);
                    try {
                        if (e.type == "read")
                            return;
                        if (!parentGrid.dataSource.options.schema.model.id) {
                            console.error("no id defined for parent grid - cannot update parent grid");
                            return;
                        }
                        var dataSource = new kendo.data.DataSource(parentGrid.dataSource.options),
                            dataItem = parentGrid.dataItem($parentGridRow);
                        dataSource.query({
                            filter: {
                                field: parentGrid.dataSource.options.schema.model.id,
                                operator: "eq",
                                value: dataItem[parentGrid.dataSource.options.schema.model.id]
                            }
                        }).then(function (e) {
                            if (dataSource.data().length == 0) {
                                parentGrid.dataSource.remove(dataItem);
                                return;
                            }
                            var newDataItem = dataSource.data()[0],
                                $selectedTab = $parentGridRow.next().find(".k-tabstrip div.k-content.k-state-active"),
                                selectedTabIndex = $parentGridRow.next().find(".k-tabstrip div.k-content").index($selectedTab),
                                //	parentRowIndex = $parentGridRow[0].rowIndex,
                                parentRowID = newDataItem.id,
                                defaultEditable = dataItem.editable;
                            dataItem.editable = function () {
                                return true;
                            };
                            $.each(parentGrid.dataSource.options.schema.model.fields, function (k, v) {
                                dataItem.set(k, newDataItem[k]);
                                dataItem.dirty = false; //Added D.T: Bug #3518 prevents double saving when updating / inserting another row 
                            });
                            //D.T" Bug #3357 reload once after a cancel changes is performed in parent grid (prevents from loosing modifications previously made) 
                            $parentGrid.data("kendoGrid").one("cancel", function (e) {
                                e.sender.dataSource.read();
                            });
                            dataItem.editable = defaultEditable;
                            var rowItem = $parentGrid.data('kendoGrid').dataSource.get(parentRowID);
                            $parentGridRow = $parentGrid.data("kendoGrid").tbody.find("tr[data-uid='" + rowItem.uid + "']");
                            $parentGridRow.find(".k-hierarchy-cell .k-plus").click();
                            var tabStrip = $parentGridRow.next().find(".k-tabstrip").data("kendoTabStrip");
                            //D.T Bug #6113 it seems that in certain cases the tab is already active so the below event does not fire...
                            try {
                                tabStrip.select(selectedTabIndex);
                            }
                            catch (ex) {
                                console.log(ex);
                            }

                            tabStrip.one("activate", function () {
                                tabStrip.select(selectedTabIndex);
                            });
                        });
                    }
                    catch (e) {
                        kendoConsole.log("fillgridelementWithDBdata - gridExtension.refreshParentGrid: " + e, true);
                    }
                };
            }

        }
        window.vocalCommandsInitialized = false;
        console.log("MagicUtils.js::fillgridelementWithDBdata::ends for grid " + gridcode + " " + new Date().toLocaleString());
    });
}

function getAssociatedBOForDataSource(dataSource, BOType) {
    var data = dataSource.data();
    var primaryKey = dataSource.options.schema.model.id;
    var BOIds = [];
    for (var i = 0; i < data.length; i++) {
        BOIds.push(data[i][primaryKey]);
    }
    return $.getJSON("/api/DocumentRepository/Count", { BOIds: BOIds.join(","), BOType: BOType });
}

function addAssociatedBOToGrid(data, element, BOType) {
    element
        .find('.BO-message')
        .remove();
    if (data)
        for (var i = 0; i < data.length; i++) {
            (function (data) {
                var $button = $('<button class="btn btn-primary" type="button"><i class="fa fa-envelope-o" aria-hidden="true"></i> <span class="badge"><span class="unread-messages">' + (data.total_messages - data.read_messages) + '</span>/' + data.total_messages + '</span></button>');
                $button.on('click', function () {
                    readBOMessages(BOType, data.BusinessObject_ID, function () {
                        var $counter = $button.find('.unread-messages');
                        var remaining = parseInt($counter.html()) - 1;
                        if (remaining < 0)
                            remaining = 0;
                        $counter.html(remaining);
                    }, function () {
                        element.data("kendoGrid").dataSource.read();
                    });
                });
                element
                    .find('#BO-message-' + data.BusinessObject_ID)
                    .html($button);
            })(data[i]);
        }
}

function readBOMessages(BOType, BOId, callback, refreshCallback) {
    var unmount = null;
    var componentData = { BOType: BOType, BOId: BOId };
    if (callback)
        componentData.onDocumentRead = callback;
    if (refreshCallback)
        componentData.onBOReaderClose = refreshCallback;
    var $content = showModal({
        wide: true,
        content: largeSpinnerHTML,
        title: '<i class="fa fa-envelope-o fa-2x"></i>',
        onClose: function () {
            if (unmount)
                unmount();
        }
    });
    initReact($content, 'Magic_BOReader', componentData)
        .then(function (fnUnmount) {
            unmount = fnUnmount;
        });
}

function initReact($element, componentName, data) {
    var promise = $.Deferred();
    requireConfigAndMore(['babel-polyfill'], function () {
        var path;
        if (componentName.indexOf('Magic_') === 0) {
            path = '/Magic/Views/Js/react/build/';
            componentName = componentName.substring(6);
        }
        else {
            path = '/Views/' + window.ApplicationCustomFolder + '/Js/react/build/';
        }
        requireWebpackScripts(['react-dom', 'react', { path: path, name: componentName }], function (ReactDOM, React, componentPromise) {
            componentPromise.default.then(function (Component) {
                ReactDOM.render(
                    React.createElement(
                        Component,
                        data
                    )
                    , $element[0]
                );
                promise.resolve(function unmount() {
                    ReactDOM.unmountComponentAtNode($element[0]);
                });
            });
        });
    });
    return promise.promise();
}

var webPackScriptsCache = {};
/**
 * 
 * @param {array of strings or object} arrayOfScripts if object { name, path}
 * @param {string} path path where to take scripts can be omitted, defaults to "/magic/views/js/react/build/"
 * @param {function} callback gets called with scripts as parameters 
 */
function requireWebpackScripts(arrayOfScripts, path, callback) {
    if (!callback) {
        callback = path;
        path = null;
    }
    var promises = [];
    for (var i = 0; i < arrayOfScripts.length; i++) {
        promises.push(
            (function (scriptName) {
                var scriptPath = scriptName.path || path;
                scriptName = scriptName.name || scriptName;
                if (scriptName in webPackScriptsCache)
                    return webPackScriptsCache[scriptName];
                return $.get(window.includesVersion + (scriptPath || "/magic/views/js/react/build/") + scriptName + ".js")
                    .then(function (script) {
                        //sanitize webpack scripts in prod mode
                        if (script[0] === "!") {
                            script = '(' + script.substring(1, script.length - 1).replace(/(;|,)?(()[\w]+\([^)]*\)}\()/, ';return $2') + ')';
                            eval("script = " + script);
                        }
                        else {
                            eval("script = " + script);
                        }
                        return webPackScriptsCache[scriptName] = script;
                    }, function (error) {
                        console.error("error while loading script: " + scriptName, error);
                    });
            })(arrayOfScripts[i])
        );
    }
    return $.when.apply($, promises)
        .then(function () {
            callback.apply(null, arguments);
        });
}
//this returns selected rows both for touch and non touch systems
function getAllSelectedRowsFromGrid(el) {
    var kgrid = $(el).closest('[data-role=grid]').data("kendoGrid")

    //check for selectAll performed via DB 
    var sallIds = kgrid.element.data('allRecords')

    if (sallIds && sallIds.length)
        return sallIds;

    if (detectTouch())
        return $.map($(el).closest('[data-role=grid]').find('.rowselected__'), function (v, i) {
            return kgrid.dataItem(v);
        });
    else
        return $.map(kgrid.select(), function (v, i) {
            return kgrid.dataItem(v);
        })
}
//selects all rows
function undoSelectAllFromDB($grid, $btn) {
    if (!$btn)
        $btn = $grid.find(".k-button[data-select-all-sp]");
    $grid.removeData('allRecords');
    if ($btn)
        $btn.removeClass('k-state-active');
}
function selectAllGridRows(el) {
    var $btn = $(el),
        $grid = $btn.closest('[data-role=grid]'),
        grid = $grid.data("kendoGrid"),
        hasAllSelected = $btn.is('.k-state-active'),
        isMobile = detectTouch(),
        selectAllSP = $btn.data('selectAllSp');
    let changedPage = false; //OM: introduced variable to not execute the de-selection when the user changes page and selects all elements again

    //change event calld after select all from DB is activated
    let changeAfterManager = function (grid) {
        if (changedPage) {
            return;
        }
        if (!grid.select().length || !grid.element.data("allRecords")) {
            //$grid.removeData('allRecords');
            //$btn.removeClass('k-state-active');
            undoSelectAllFromDB($grid, $btn);
            return;
        }
        if ((grid.options.gridExtension.hasOwnProperty('lockSelectAll') && grid.options.gridExtension.lockSelectAll === true) ||
            (grid.options.gridExtension.hasOwnProperty('paging_options') && grid.options.gridExtension.paging_options.disable_server_paging === true)
        ) {
            grid.clearSelection();
            undoSelectAllFromDB($grid, $btn);
            return;
        }
        if (!confirm(getObjectText("keepSelectAllItemsFromDB"))) { //undo select all https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/171
            undoSelectAllFromDB($grid, $btn);
        }
        else {
            //remove from allIds the unselected items in current view https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/171
            let data = grid.dataSource.data();
            let unselected = [];
            let selected = $.map(grid.select(), function (v, i) { return grid.dataItem(v) });
            let selectedIds = selected.map((d) => d.id);
            data.forEach(function (dataItem) {
                if (selectedIds.indexOf(dataItem.id) == -1)
                    unselected.push(dataItem.id);
            });
            let allIds = $grid.data('allRecords');
            let pkName = $grid.data("kendoGrid").dataSource.options.schema.model.id;
            for (let i = allIds.length - 1; i >= 0; i--) {
                if (unselected.indexOf(allIds[i][pkName]) != -1)
                    allIds.splice(i, 1);
            }
            $grid.data('allRecords', allIds);
            //will be triggered again at next selection
            grid.one('change', () => {
                changeAfterManager(grid);
            });
        }
    }

    grid.bind('dataBinding', function () {
        changedPage = true;
    });


    if (selectAllSP == "undefined")
        selectAllSP = null;
    //it's not active will select all 
    if (!hasAllSelected) {
        if (!selectAllSP) //front end management
        {
            if (isMobile)
                $grid.find('.rowselected__')
                    .prop('checked', true)
                    .one('change', function () {
                        undoSelectAllFromDB($grid, $btn);
                    });
            else { //android does not exit on return 
                grid.select("tr");
                grid.one('change', function () {
                    $btn.removeClass('k-state-active');
                });
            }
            $btn.addClass('k-state-active');
        }
        else { //db management (ask for allIds) + front
            if (confirm(getObjectText("confirmSelectAllItemsFromDB").format(grid.dataSource.total()))) {
                $btn
                    .attr('disabled', 'disabled')
                    .prepend('<span class="fa fa-spin fa-spinner"></span>');

                //get grid's datasource definition and build a new one 
                var ds_selAll = grid.dataSource.options;
                ds_selAll.serverPaging = false;
                var currentParameterMap = grid.dataSource.transport.parameterMap;
                ds_selAll.transport.parameterMap = function (options, operation) {
                    var optsAsString = currentParameterMap.call(this, options, operation);
                    var opts = JSON.parse(optsAsString);
                    if (grid.dataSource.filter())
                        opts.filter = grid.dataSource.filter();

                    var data = $.extend(opts.data ? JSON.parse(opts.data) : {}, { user_has_selected_all: true });
                    opts.data = JSON.stringify(data);
                    return kendo.stringify(opts);
                };
                var ds_new = new kendo.data.DataSource(ds_selAll);
                ds_new.read()
                    .then(function () {
                        var pk = ds_new.options.schema.model.id;
                        var ids = [];
                        $.each(ds_new.data(), function (i, v) {
                            var obj = {};
                            obj[pk] = v[pk];
                            ids.push(obj);
                        });
                        $grid.data('allRecords', ids);
                        if (isMobile)
                            $grid
                                .find('.rowselected__')
                                .prop('checked', true)
                                .one('change', function () {
                                    undoSelectAllFromDB($grid, $btn);
                                });
                        else {
                            grid.select("tr");
                            grid.one('change', function () {
                                changeAfterManager(grid);
                            });
                        }
                        $btn
                            .removeAttr('disabled')
                            .addClass('k-state-active')
                            .find('.fa')
                            .remove();
                        changedPage = false;
                    }, function () {
                        $btn
                            .removeAttr('disabled')
                            .find('.fa')
                            .remove();
                    });
                //});
            }
        }
    }
    //select all is active, will toggle and set it off and undone
    if (hasAllSelected) {
        if (isMobile)
            $grid.find('.rowselected__').prop('checked', false);
        else {
            grid.clearSelection();
            undoSelectAllFromDB($grid, $btn);
        }

    }
}

function compareExcelFiles(el) {
    const $btn = $(el),
        $grid = $btn.closest('[data-role=grid]'),
        grid = $grid.data("kendoGrid");

    const selectedData = $.map(grid.select(), function (v, i) {
        return grid.dataItem(v);
    });

    if (selectedData.length != 2) {
        kendoConsole.log(getObjectText("selectTwoRows"), true);
        return;
    }

    const record1 = selectedData[0];
    const record2 = selectedData[1];
    const compareFile1 = record1.ExcelFileName__ || '';
    const compareFile2 = record2.ExcelFileName__ || '';
    const compareKey1 = record1.CompareKeys__ || '';
    const compareKey2 = record2.CompareKeys__ || '';
    const compareSheet1 = record1.CompareSheet__ || '';
    const compareSheet2 = record2.CompareSheet__ || '';

    if (compareFile1.length <= 0) {
        kendoConsole.log("First selected row does not contain a value for 'ExcelFileName__'!", true);
        return;
    }
    if (compareFile2.length <= 0) {
        kendoConsole.log("Second selected row does not contain a value for 'ExcelFileName__'!", true);
        return;
    }
    if (compareSheet1.length <= 0 || compareSheet2.length <= 0) {
        kendoConsole.log("Compare-sheet not specified!", true);
        return;
    }
    if (compareSheet1.toLowerCase() != compareSheet2.toLowerCase()) {
        kendoConsole.log("Compare-sheets do not match!", true);
        return;
    }

    const keyColumns = compareKey1.split(',').map(k => k.trim());
    const params = { file1: compareFile1, file2: compareFile2, sheetName: compareSheet1, keyColumns: keyColumns };
    $.fileDownload('/api/Magic_DocumentModel/CompareTwoExcelFiles', {
        httpMethod: "GET",
        data: params,
        successCallback: function (url) {
            doModal(false);
            kendoConsole.log("Comparison executed successfully!", false);
        },
        failCallback: function (responseHtml, url) {
            doModal(false);
            kendoConsole.log("Comparison failed: " + responseHtml, true);
        },
        prepareCallback: function (url) {
            kendoConsole.log("Starting comparison!", false);
            doModal(true);            
        }
    });
}

function formatDateFilters(filter) {
    if (filter) {
        if (filter.filters && filter.filters.length) {
            $.each(filter.filters, function (k, v) {
                filter.filters[k] = formatDateFilters(v);
            });
        } else if (filter.value && (filter.value instanceof Date || typeof filter.value == "string" && filter.value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/))) {
            filter.value = toTimeZoneLessString(new Date(filter.value));
        }
    }
    return filter;
}

function initGridCellTooltip(el) {
    if (el.offsetHeight < el.scrollHeight || el.offsetWidth < el.scrollWidth) {
        var $el = $(el);
        if (!$el.data("kendoTooltip")) {
            tootlip = $el.kendoTooltip(
                $.extend(
                    getDefaultTooltipSettings(), {
                    content: '<div class="magicTooltip">' + $(el).html() + '</div>',
                }))
                .data("kendoTooltip").show();
        }
    }
}

//given a functionId the template gets associated with the function
function getTemplateByName(templateName, layerId, functionId) {
    return $.ajax({
        url: manageAsyncCallsUrl(false, "/api/Magic_Templates/GetTemplateByName"),// "/api/Magic_Templates/GetTemplateByName",
        async: false,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            templateName: templateName,
            layerId: layerId,
            functionId: functionId
        })
    });
}

function gridShowRowXml($el) {
    var $container = cleanModal();
    //$("#wndmodalContainer").addClass("modal-wide");
    $(".modal-title").text(getObjectText("typeExtension"));
    $container.html(largeSpinnerHTML);
    $("#wndmodalContainer").modal('show');
    requireConfigAndMore(["vkbeautify", "JSONEditor"], function (vkbeautify, JSONEditor) {
        $el = $($el);
        var $grid = $el.closest(".k-grid"),
            kendoGrid = $grid.data("kendoGrid"),
            gridOptions = kendoGrid.options,
            xmlFilters = gridOptions.xmlFilters,
            translationsReady = $.Deferred(),
            columnTranslations = $grid.data("xmlFieldTranslations");
        if (columnTranslations)
            translationsReady.resolve();
        else {
            getColumnLabels({
                gridCode: gridOptions.code,
                columnNames: Object.keys(xmlFilters).concat(Object.keys(gridOptions.xmlFields))
            }).success(function (res) {
                columnTranslations = res;
                $grid.data("xmlFieldTranslations", res);
                translationsReady.resolve();
            });
        }
        var rowData = kendoGrid.dataSource.getByUid($el.closest("tr").attr("data-uid"));
        var jsos = [];
        $.when(translationsReady)
            .then(function () {
                $.each(gridOptions.xmlFields, function (k) {
                    if (k in rowData && rowData[k]) {
                        var jso = xml2jso(parseXml(vkbeautify.xml(rowData[k]))),
                            correctObject = true;
                        if (jso != null) {
                            $.each(jso, function (k, v) {
                                if (k == "body" && typeof v === "object")
                                    correctObject = false;
                                return false;
                            });
                            if (correctObject) {
                                $.each(jso, function (k, v) {
                                    jso[k] = { value: v, column: k };
                                    if (k in xmlFilters) {
                                        jso[k].type = xmlFilters[k].type;
                                    }
                                    if (k in columnTranslations) {
                                        jso[k].label = columnTranslations[k];
                                    }
                                });
                            }
                        }
                        jsos.push({ jso: correctObject ? jso : null, column: columnTranslations[k] || k });
                    }
                });
                $container.html(getDataReaderHtml());
                var htmls = {};
                var config = {
                    filterKeys: ["column"],
                    dataList: jsos,
                    contentTemplate: function (data) {
                        if (data.jso === null)
                            return getObjectText("empty");
                        if (!(data.column in htmls))
                            htmls[data.column] = buildHtmlFormFromSchemaObjects(data.jso, true, kendoGrid);
                        return htmls[data.column];
                    },
                    listTemplate: '<div class="list">{column}</div>',
                };
                initAngularController($container.find('div'), "DataReaderController", config);
            });
    });
}

//array/object needs to contain objects with a type, a value, a column and a label (optional) property
//kendoGrid only needed if multiselect, dropdownlist, autocomplete, or searchgrid contained
function buildHtmlFormFromSchemaObjects(arrayOrObject, readonly, kendoGrid) {
    //var dataSources = {},
    var valuePlaceholder = 0,
        placeholderBase = 'auto-gen-form' + Date.now(),
        values = {};
    //if (kendoGrid) {
    //    var listofds = $("#" + kendoGrid.element.eq(0).attr("editablename")).attr("listofds").split("|");
    //    for (var k = 0; k < listofds.length; k++) {
    //        var props = listofds[k].split(';'),
    //            type = $.trim(props[0]);
    //        if (type == "dropdownlist" || type.indexOf("autocomplete") !== -1 || type == "searchgrid" || type == "multiselect")
    //            dataSources[props[4]] = props;
    //    }
    //}
    var html = '<div class="activeXmlFilters">';
    $.each(arrayOrObject, function (k, v) {
        var row = "";
        if (v.value == null)
            v.value = "";
        if (kendoGrid && v.column && kendoGrid.dataSource.options.schema.model.fields[v.column].dataSourceInfo) {
            if (v.value && v.value != "0") {
                var placeholder = placeholderBase + '-' + (++valuePlaceholder),
                    value = v.value,
                    dataSourceInfo = kendoGrid.dataSource.options.schema.model.fields[v.column].dataSourceInfo;
                GetDropdownValues(dataSourceInfo.dataSource, dataSourceInfo.dsValueField, dataSourceInfo.dsTextField, dataSourceInfo.dsSchema, dataSourceInfo.dsTypeId, null, true)
                    .success(function (res) {
                        if (res) {
                            $.each(res, function (k, v) {
                                if (value == v.value) {
                                    var placeHolder = $("." + placeholder);
                                    if (placeHolder.length)
                                        placeHolder.val(v.text);
                                    else
                                        setTimeout(function () {
                                            placeHolder.val(v.text);
                                        }, 1000);
                                }
                            });
                        }
                    });
            }
            row = '<input class="' + placeholder + ' form-control" type="text" ' + (readonly ? 'readonly disabled ' : '') + 'value="' + (v.value == "0" ? "" : v.value) + '" />';
        }
        else {
            switch (v.type) {
                case "bool":
                case "bit":
                case "boolean":
                    row = '<input type="checkbox" class="form-control" ' + (readonly ? 'readonly disabled ' : '') + (toBoolean(v.value) ? "checked" : "") + '/>';
                    break;
                default:
                    row += '<input type="text" class="form-control" ' + (readonly ? 'readonly disabled ' : '') + 'value="' + v.value + '" />';
                    break;
            }
        }
        if (row)
            html += '<div class="row"><div class="col-md-5"><span>' + (v.label || v.column) + '</span></div><div class="col-md-5">' + row + '</div></div>';
    });
    html += '</div>';
    return html;
}

function addXMLFilters(el) {
    var $el = $(el);
    $el.prop("onclick", null);
    var $searchWindow = $('<div id="gridXMLFilter" ng-controller=\'KendoGridXMLFilterController as xfc\' class=\'dropdown-menu\' style="position: absolute; width: 40%; top:0; left: 60%; overflow: visible; padding: 10px"><i class=\'fa fa-spinner fa-spin\'></i><div>');
    $el.on("click", function () {
        $searchWindow.toggle();
    });
    var $grid = $el.closest(".k-grid"),
        kendoGrid = $grid.data("kendoGrid"),
        gridOptions = kendoGrid.options,
        xmlFilters = gridOptions.xmlFilters,
        $drop = $el.find(".dropdown-menu"),
        data = {
            gridCode: gridOptions.code,
            columnNames: Object.keys(xmlFilters).concat(Object.keys(gridOptions.xmlFields))
        },
        parentsAndGrandParents = $grid.parents(".k-grid");
    if (parentsAndGrandParents.length)
        parentsAndGrandParents.eq(parentsAndGrandParents.length - 1).append($searchWindow);
    else
        $grid.append($searchWindow);
    $searchWindow.toggle();
    var columnTranslations = $grid.data("xmlFieldTranslations"),
        translationsReady = $.Deferred();
    if (columnTranslations)
        translationsReady.resolve(columnTranslations);
    else {
        translationsReady = getColumnLabels(data);
    }
    $.when(translationsReady).then(function (labels) {
        $grid.data("xmlFieldTranslations", $.extend(labels, getUserFieldsLabels(gridOptions)));
        $searchWindow.html("<div ng-include=\"'" + window.includesVersion + "/Magic/Views/Templates/KendoGridXMLFilter.html'\"></div>");
        initAngularController($searchWindow[0], "KendoGridXMLFilterController", { searchValues: labels, kendoGrid: kendoGrid, filterIcon: $el.find("a").eq(0), filterDetails: xmlFilters });
    });
}
function getUserFieldsLabels(gridOptions) {
    var labels = {};
    $.each(gridOptions.dataSource.schema.model.fields, function (k, v) {
        if (v.isCustomUserField)
            labels[k] = v.labels[window.culture.substring(0, 2)];
    });
    return labels;
}
function getColumnLabels(data) {
    return $.ajax({
        url: "/api/Magic_Columns/GetLabels",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(data)
    });
}

function getGridSettingsObject(gridcode, functionid) {
    var key = gridcode + "-" + functionid,
        usersGridsSettings = JSON.parse(sessionStorage.usersGridsSettings || '{}'),
        selectedGridsSettings = JSON.parse(sessionStorage.selectedGridsSettings || '{}'),
        settingsKey = 0;

    if (!usersGridsSettings[key])
        usersGridsSettings[key] = [];

    if (!selectedGridsSettings[key]) {
        $.each(usersGridsSettings[key] || [], function (k, v) {
            if (v.isDefaultSetting) {
                settingsKey = k;
                return false;
            }
        });
        selectedGridsSettings[key] = usersGridsSettings[key][settingsKey] || {};
        sessionStorage.selectedGridsSettings = JSON.stringify(selectedGridsSettings);
    }

    return {
        usersGridsSettings: usersGridsSettings,
        gridKey: key,
        selectedGridsSettings: selectedGridsSettings
    };
}

function setGridSettingsFromObject(settingsObject) {
    sessionStorage.selectedGridsSettings = JSON.stringify(settingsObject.selectedGridsSettings);
}

function setSessionStorageGridFilters(gridcode, functionid, filter, overrideFilter) {
    try {
        var key = gridcode + "-" + functionid,
            selectedGridsSettings = ("selectedGridsSettings" in sessionStorage) ? JSON.parse(sessionStorage.selectedGridsSettings) : {},
            gridSettings = $.extend({ filter: null }, selectedGridsSettings[key]);

        gridSettings.filter = overrideFilter ? filter : combineDataSourceFilters(gridSettings.filter, filter);
        selectedGridsSettings[key] = gridSettings;
        sessionStorage.selectedGridsSettings = JSON.stringify(selectedGridsSettings);
    } catch (e) {
        console.log(e);
    }
}

function setSessionStorageGridColumnOrderSettings(e) {
    if (!e.column.field)
        return;

    var settingsObject = getGridSettingsObject(e.sender.options.gridcode, e.sender.options.functionid);

    settingsObject.selectedGridsSettings[settingsObject.gridKey].columnOrder = {};
    $.each(e.sender.columns, function (k, col) {
        if ("field" in col)
            settingsObject.selectedGridsSettings[settingsObject.gridKey].columnOrder[col.field] = k;
    });

    setGridSettingsFromObject(settingsObject);
}

function deleteSessionStorageGridSettingByType(gridcode, functionid, type) {
    try {
        var settingsObject = getGridSettingsObject(grid.options.gridcode, grid.options.functionid);
        delete settingsObject.selectedGridsSettings[settingsObject.gridKey][type];
        setGridSettingsFromObject(settingsObject);
    }
    catch (err) {
        console.error(err);
    }

}

function setSessionStorageGridColumnSettings(e) {
    var columnSettings = {},
        settingsObject = getGridSettingsObject(e.sender.options.gridcode, e.sender.options.functionid);

    $.each(e.sender.columns, function (k, column) {
        if (column.field) {
            if (column.hidden || column.locked || column.width) {
                columnSettings[column.field] = {};
                if (column.hidden)
                    columnSettings[column.field].hidden = column.hidden;
                if (column.locked)
                    columnSettings[column.field].locked = column.locked;
                if (column.width)
                    columnSettings[column.field].width = column.width;
            } else
                delete columnSettings[column.field];
        }
    });

    if (!$.isEmptyObject(columnSettings))
        settingsObject.selectedGridsSettings[settingsObject.gridKey].columnSettings = columnSettings;
    else
        delete settingsObject.selectedGridsSettings[settingsObject.gridKey].columnSettings;

    setGridSettingsFromObject(settingsObject);
}

function setSessionStorageGridSettings(grid, filterTypes, returnGridSettings) {
    filterTypes = filterTypes || [undefined, "searchBar", "xmlFilter", "cultureFilter", "multiValueFilter"];

    var settingsObject = getGridSettingsObject(grid.options.gridcode, grid.options.functionid),
        userFilter = getFiltersByType(grid.dataSource._filter, filterTypes),
        sort = grid.dataSource.sort(),
        group = grid.dataSource.group();

    //ignore user filter in wizard context https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/206
    if ($('[ng-controller="GridWizardController as gw"]').length && (!userFilter || !userFilter.hasOwnProperty('type'))) {
        userFilter = {};
    }

    //combine grid settings
    if (userFilter && !$.isEmptyObject(userFilter))
        settingsObject.selectedGridsSettings[settingsObject.gridKey].filter = serializeFilterDates($.extend(true, {}, userFilter));
    else
        delete settingsObject.selectedGridsSettings[settingsObject.gridKey].filter;

    if (group && group.length)
        settingsObject.selectedGridsSettings[settingsObject.gridKey].group = group;
    else
        delete settingsObject.selectedGridsSettings[settingsObject.gridKey].group;

    if (sort && sort.length)
        settingsObject.selectedGridsSettings[settingsObject.gridKey].sort = sort;
    else
        delete settingsObject.selectedGridsSettings[settingsObject.gridKey].sort;

    if (returnGridSettings)
        return settingsObject;

    setGridSettingsFromObject(settingsObject);
}

function getSessionStorageGridSettings(gridcode, funcId) {
    //am i in the dashboard ? if yes then i always consider the settings of the funcId (-1 in that case)
    var thisIsTheDashboard = function () {
        return window.location.href.substring(window.location.protocol.length + window.location.host.length + 3, window.location.href.length) == "dashboard-v2";
    };
    window.sisenseFrames = $('iframe'); //#sisense #logout
    var settingsObject = getGridSettingsObject(gridcode, (funcId == -1 && !thisIsTheDashboard()) ? ((sessionStorage.fid && gridcode != "Magic_Grid") ? sessionStorage.fid : -1) : funcId);
    var gridSettings = $.extend({
        filter: null,
        columnSettings: {},
        columnOrder: {},
        group: [],
        sort: [],
    }, settingsObject.selectedGridsSettings[settingsObject.gridKey]);

    if (gridSettings.filter) {
        parseFilterDates(gridSettings.filter);
    }

    return gridSettings;
}

function serializeFilterDates(filter) {
    if ($.isArray(filter.filters)) {
        $.map(filter.filters, function (f) {
            serializeFilterDates(f);
        });
    }
    else if (
        filter.value
        && filter.value instanceof Date
    ) {
        filter.value = toTimeZoneLessString(new Date(filter.value));
    }
    return filter;
}

function parseFilterDates(filter) {
    if ($.isArray(filter.filters)) {
        $.each(filter.filters, function (i, f) {
            parseFilterDates(f);
        });
    }
    else if (
        filter.value
        && typeof filter.value === 'string'
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(filter.value)
    ) {
        filter.value = new Date(filter.value);
    }
}

function saveUserGridSettings(el) {
    var grid = $(el).closest('[data-role=grid]').data('kendoGrid'),
        settingsObject = setSessionStorageGridSettings(grid, [undefined, "xmlFilter", "multiValueFilter"], true),
        selectedGridSettings = settingsObject.selectedGridsSettings[settingsObject.gridKey],
        pk = grid.options.dataSource.schema.model.id;

    if (!selectedGridSettings.filter && !selectedGridSettings.group && !selectedGridSettings.sort && !selectedGridSettings.columnSettings && !selectedGridSettings.columnOrder) {
        kendoConsole.log(getObjectText("noGridSettingsToSave"), "error");
        return;
    }

    var $el = showModal({
        content: '<p><input style="text-indent: 10px; width: 100%" value="' + (selectedGridSettings.settingsName || "") + '" id="settings-name" type="text" style="width: 100%;" placeholder="' + getObjectText("settingsName") + '*" /></p>\
            <p><label><input ' + (selectedGridSettings.isDefaultSetting ? 'checked="checked"' : '') + ' type="checkbox" /> ' + getObjectText("isDefaultSetting") + '</label></p>',
        title: getObjectText("saveGridSettings"),
        footer: '<button class="k-button">' + getObjectText("save") + '</button>'
    }),
        $settingsName = $('#settings-name', $el),
        $isDefault = $('input[type=checkbox]', $el),
        tooltip = $settingsName.kendoTooltip({ content: getObjectText("vErequired").format(getObjectText("settingsName")) }).data("kendoTooltip");

    requireConfigAndMore(["jQueryUI"], function () {
        var widget = $settingsName
            .autocomplete({
                source: $.map(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (v) { if (v.settingsName) return v.settingsName; }),
                minLength: 0,
                select: function (event, ui) {
                    $.each(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (k, v) {
                        if (v.settingsName == ui.item.value) {
                            if (v.isDefaultSetting)
                                $isDefault[0].checked = true;
                            else
                                $isDefault[0].checked = false;
                            return false;
                        }
                    });
                }
            }).autocomplete("instance");
        widget._renderItem = function (ul, item) {
            return $("<li class='list-group-item'>" + item.value + "</li>")
                .appendTo(ul);
        };
        widget._renderMenu = function (ul, items) {
            var that = this;
            $.each(items, function (index, item) {
                that._renderItemData(ul, item);
            });
            $(ul).addClass("list-group");
        };
        if (!selectedGridSettings.settingsName) {
            setTimeout(function () {
                $settingsName.focus().autocomplete("search", "");
            }, 500);
        }
    });

    $el.closest('.modal-content').find('.k-button').click(function () {
        if (!$settingsName.val())
            tooltip.show();
        else {
            var settingExists = false;

            settingsObject.selectedGridsSettings[settingsObject.gridKey].settingsName = $settingsName.val();
            settingsObject.selectedGridsSettings[settingsObject.gridKey].isDefaultSetting = $isDefault[0].checked;
            setGridSettingsFromObject(settingsObject);

            $.each(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (k, v) {
                if (v.settingsName == $settingsName.val()) {
                    //if settingsName exists in gridSettings, overwrite them
                    settingsObject.usersGridsSettings[settingsObject.gridKey][k] =
                    {
                        ...settingsObject.selectedGridsSettings[settingsObject.gridKey],
                        filter: undefined //remove the filter from the object that''ll be saved
                    };
                    settingExists = true;
                } else if ($isDefault[0].checked && v.isDefaultSetting) {
                    //if is set as default setting, reset isDefaultSetting in the other settings
                    settingsObject.usersGridsSettings[settingsObject.gridKey][k].isDefaultSetting = false;
                }
            });

            if (!settingExists)
                (settingsObject.usersGridsSettings[settingsObject.gridKey] || []).push(
                    {
                        ...settingsObject.selectedGridsSettings[settingsObject.gridKey],
                        filter: undefined//remove the filter from the object that''ll be saved
                    });

            sessionStorage.usersGridsSettings = JSON.stringify(settingsObject.usersGridsSettings);

            //save in mongo
            //d.T 23/12/2019 changed controller Config (with mongo) to UserConfig (withoud mongo ...)
            $.post("/api/UserConfig/PostUserGridConfig", "=" + JSON.stringify({
                key: settingsObject.gridKey,
                value: settingsObject.usersGridsSettings[settingsObject.gridKey]
            })).done(function () {
                $("#wndmodalContainer").modal('hide');
                kendoConsole.log(getObjectText("gridSettingsSaved"), false);
                updateUserFilterLabel(grid.wrapper);
            });
        }
    });
}

function selectGridSettings(el) {
    var grid = $(el).closest('[data-role=grid]').data('kendoGrid'),
        settingsObject = getGridSettingsObject(grid.options.gridcode, grid.options.functionid),
        gridSettingsOptions = $.map(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (v, k) { return '<option value="' + k + '"' + (v.settingsName == settingsObject.selectedGridsSettings[settingsObject.gridKey].settingsName ? ' selected' : '') + '>' + (escapeHtml(v.settingsName + (v.isDefaultSetting == true ? getObjectText('isDefaultSetting') : '')) || 'no name') + '</option>' }),
        $el;

    if (!gridSettingsOptions.length && (!settingsObject.selectedGridsSettings[settingsObject.gridKey] || $.isEmptyObject(settingsObject.selectedGridsSettings[settingsObject.gridKey]))) {
        kendoConsole.log(getObjectText("noGridSettings"), "error");
        return;
    }

    gridSettingsOptions.unshift('<option value="">None</option>');

    $el = showModal({
        content: '<select style="width: 100%;">' + gridSettingsOptions.join('') + '</select>',
        title: getObjectText("selectGridSettings"),
        footer: '<button class="k-button">' + getObjectText("select") + '</button>'
    });

    $el.closest('.modal-content').find('.k-button').click(function () {
        $("#wndmodalContainer").modal('hide');
        var value = $('select', $el).val();
        settingsObject.selectedGridsSettings[settingsObject.gridKey] = value != "" ? settingsObject.usersGridsSettings[settingsObject.gridKey][value] : {};
        setGridSettingsFromObject(settingsObject);
        location.reload();
    });
}

function deleteUserGridSettings(key, el) {
    var grid = $(el).closest('[data-role=grid]').data('kendoGrid'),
        settingsObject = getGridSettingsObject(grid.options.gridcode, grid.options.functionid),
        gridSettingsOptions = $.map(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (v, k) { return '<option value="' + k + '">' + (escapeHtml(v.settingsName) || 'no name') + '</option>' }),
        $el;

    if (!gridSettingsOptions.length || gridSettingsOptions.length == 1 && !settingsObject.usersGridsSettings[settingsObject.gridKey][0].settingsName) {
        kendoConsole.log(getObjectText("noGridSettings"), "error");
        return;
    }

    $el = showModal({
        content: '<select style="width: 100%;">' + gridSettingsOptions.join('') + '</select>',
        title: getObjectText("deleteGridSettings"),
        footer: '<button class="k-button">' + getObjectText("delete") + '</button>'
    });

    $el.closest('.modal-content').find('.k-button').click(function () {
        var value = $('select', $el).val(),
            settingsName = settingsObject.usersGridsSettings[settingsObject.gridKey][value].settingsName;
        settingsObject.usersGridsSettings[settingsObject.gridKey].splice(value, 1);

        $.ajax({
            type: settingsObject.usersGridsSettings[settingsObject.gridKey].length ? "POST" : "GET",
            url: settingsObject.usersGridsSettings[settingsObject.gridKey].length ? "/api/UserConfig/PostUserGridConfig" : "/api/UserConfig/DeleteUserGridConfig/" + settingsObject.gridKey,
            data: settingsObject.usersGridsSettings[settingsObject.gridKey].length ? "=" + JSON.stringify({
                key: settingsObject.gridKey,
                value: settingsObject.usersGridsSettings[settingsObject.gridKey]
            }) : "",
            success: function () {
                $("#wndmodalContainer").modal('hide');
                kendoConsole.log(getObjectText("gridSettingsReseted"), false);

                //save in session storage
                if (!settingsObject.usersGridsSettings[settingsObject.gridKey].length)
                    delete settingsObject.usersGridsSettings[settingsObject.gridKey];

                sessionStorage.usersGridsSettings = JSON.stringify(settingsObject.usersGridsSettings);

                //if deleted settings are selected settings, reload page to clear the grid settings
                if (settingsName == settingsObject.selectedGridsSettings[settingsObject.gridKey].settingsName) {
                    delete settingsObject.selectedGridsSettings[settingsObject.gridKey];
                    setGridSettingsFromObject(settingsObject);
                    location.reload();
                }
            }
        });
    });
}

function getFilteredColumns(filter, filterColumns) {
    filterColumns = filterColumns || [];
    if (filter) {
        if (filter.filters) {
            $.each(filter.filters, function (k, f) {
                if (f.filters)
                    filterColumns = getFilteredColumns(f, filterColumns);
                else if (f.field)
                    filterColumns.push(f.field)
            });
        } else if (filter.field) {
            filterColumns.push(filter.field)
        }
    }

    return $.unique(filterColumns);
}

//per risolvere il problema dell'  annullamento delle azioni di dataBound alla pressione di cancel sul popup di edit
function forceDataBoundOnCancel(e) {
    function triggerDataBound(grid) {
        setTimeout(function () {
            grid.trigger("dataBound");
        }, 250);
    }
    //Undo popup 
    e.container.find(".k-grid-cancel").on("click", function () {
        triggerDataBound(e.sender);
    });
    //X sul popup
    e.container.closest(".k-window").find(".k-window-action").on("click", function () {
        triggerDataBound(e.sender);
    });
}

function manageuserrightsintoolbar(element, data) {
    var toolbarrev = [];
    var gridRights = getGridRights(element.gridcode);
    for (var k = 0; k < element.toolbar.length; k++) {
        if (element.toolbar[k].name === "save" && data.Editable !== "false") {
            if (gridRights.usercanupdate)
                toolbarrev.push(element.toolbar[k]);
        }
        else
            if (element.toolbar[k].name === "create" && data.Editable !== "false") {
                if (gridRights.usercaninsert) //usercan insert, if not specified in VisibleGrids is always equal to usercanupdate
                    toolbarrev.push(element.toolbar[k]);
            }
            else
                if ((gridRights.usercanexecute && element.toolbar[k].name !== "create" && element.toolbar[k].name !== "save")
                    || (element.toolbar[k].alwaysShow))//non escludo mai la ricerca veloce e pulsanti di gestione layout e filtri (mail L.Sacchini 12/02/2025)
                toolbarrev.push(element.toolbar[k]);

    }
    element.toolbar = toolbarrev;

}
function manageuserrightsincommandcolumn(element, data, gridExtension) {

    var gridrights = getGridRights(element.gridcode);
    if (typeof element.columns[0].command !== "undefined") {
        var commandsrev = [];
        for (k = 0; k < element.columns[0].command.length; k++) {
            if (element.columns[0].command[k].name === "edit") {
                if (data.Editable !== "true" && data.Editable !== "false" && gridrights.usercanupdate)
                    commandsrev.push(element.columns[0].command[k]);
            }
            else if (element.columns[0].command[k].name === "destroy") {
                if (data.Editable !== "false" && gridrights.usercandelete)
                    commandsrev.push(element.columns[0].command[k]);
            }
            else if (gridrights.usercanexecute) {
                commandsrev.push(element.columns[0].command[k]);
            }

        }
        element.columns[0].command = commandsrev;
    }
    //solo se posso eseguire
    if (gridrights.usercanexecute) {
        var classbase = function (classConfig) { return "k-button k-button-icontext{0} k-grid-".format(classConfig ? " " + classConfig : ""); };

        var headrowtoadd = data.HeadRowCmdToAdd != null ? eval(data.HeadRowCmdToAdd) : null;
        if (headrowtoadd != null) {
            var groups = {};
            var buttons = [];
            $.each(headrowtoadd, function (i, v) {
                if (v.groupText) {
                    var li = '<li><span class="' + classbase(v.classname) + v.domid + '" href="javascript:void(0)" onclick="' + v.clickjsfunct + '({currentTarget: this});">' + getObjectText(v.text) + '</span></li>';
                    if (v.groupText in groups)
                        groups[v.groupText] += li;
                    else
                        groups[v.groupText] = li;
                } else {
                    var btn = {
                        text: getObjectText(v.text),
                        name: v.domid,
                        click: v.clickjsfunct in window ? window[v.clickjsfunct] : v.clickjsfunct
                    };
                    if (v.classname)
                        btn.className = v.classname;
                    buttons.push(btn);
                }
                rowbuttonattributes[classbase(v.classname) + v.domid] = { jsonpayload: v.jsonpayload, storedprocedure: v.storedprocedure, storedproceduredataformat: v.storedproceduredataformat };
            });

            $.each(groups, function (title, content) {
                buttons.push({
                    template: '<div class="btn-group row-head">\
                                <button type="button" class="k-button dropdown-toggle" data-toggle="dropdown">' + title + '</button>\
                                <ul class="dropdown-menu" role="menu">' + content + '</ul>\
                            </div>',
                    attributes: {
                        style: "overflow: visible;"
                    }
                });
            });

            if (!element.columns[0].command) {
                element.columns.unshift({ command: buttons, title: "", width: "85px" });
            } else {
                if (element.columns[0].command.length == 0)
                    element.columns[0].command = buttons;
                else {
                    for (var k = 0; k < buttons.length; k++) {
                        element.columns[0].command.push(buttons[k]);
                    }
                }
            }

            if (!$.isEmptyObject(groups))
                element.columns[0].attributes = { style: "overflow: visible;" };
        }
        var tailrowtoadd = data.TailRowCmdToAdd != null ? eval(data.TailRowCmdToAdd) : null;
        if (tailrowtoadd != null) {
            var groups = {};
            $.each(tailrowtoadd, function (i, v) {
                if (v.groupText) {
                    var li = '<li><a class="' + classbase(v.classname) + v.domid + '" href="javascript:void(0)" onclick="' + v.clickjsfunct + '({currentTarget: this});">' + getObjectText(v.text) + '</a></li>';
                    if (v.groupText in groups)
                        groups[v.groupText] += li;
                    else
                        groups[v.groupText] = li;
                } else {
                    var btntail = {
                        text: getObjectText(v.text),
                        name: v.domid,
                        click: v.clickjsfunct in window ? window[v.clickjsfunct] : v.clickjsfunct
                    };
                    if (v.classname)
                        btntail.className = v.classname;
                    element.columns.push({
                        command: btntail,
                        title: "",
                        width: "85px"
                    });
                }
                rowbuttonattributes[classbase(v.classname) + v.domid] = { jsonpayload: v.jsonpayload, storedprocedure: v.storedprocedure, storedproceduredataformat: v.storedproceduredataformat };
            });

            $.each(groups, function (title, content) {
                element.columns.push({
                    template: '<div class="btn-group row-tail">\
                                <button type="button" class="k-button dropdown-toggle" data-toggle="dropdown">' + title + '</button>\
                                <ul class="dropdown-menu" role="menu">' + content + '</ul>\
                            </div>',
                    attributes: {
                        style: "overflow: visible;"
                    }
                });
            });
        }
    }
    //management of the item "summary" the default is a read-only version of the popup (unless wizard is on D.T 31032020 #6880)
    if (gridExtension.per_record_summary_sp || (element.editable && element.editable.mode == "popup" && !gridExtension.magicWizardCode && !gridExtension.disableReadOnlyButton)) {
        var cmnd = {
            type: "dataReader",
            text: '<i class="fa fa-television"></i>',
            name: element.gridcode + "_view",
            click: function (e) {
                var tr = $(e.target).closest("tr");
                var $grid = $(e.target).closest(".k-grid");
                var rowData = this.dataItem(tr);
                if (typeof showItemCustomForm == "function" && gridExtension.per_record_summary_sp)//showItemCustomForm To be defined in AdminAreaCustomizations
                    showItemCustomForm(rowData, element.gridcode, gridExtension.per_record_summary_sp, null, $grid, tr);
                else {// showRowContentInModal(rowData, element.gridcode, data.EditFormColumnNum, { storedProcedureName: gridExtension.per_record_summary_sp }, gridExtension.per_record_summary_sp ? "Magic_TabContent" : null);
                    //open the kendo popup removing the save button
                    $grid.data("kendoGrid").one("edit", function (e) {
                        e.container.find(".k-grid-update").remove();
                    });
                    $grid.data("kendoGrid").editRow(tr);
                }
            }
        };
        //no command has to be added then ad only the dataReader
        if (!commandsrev) {
            if (element.columns[0].command)
                element.columns[0].command = cmnd;
            else
                element.columns.unshift({
                    command: cmnd
                    , title: ""
                    , width: "85px"
                });
        } //the dataReader will be added if the record cannot be edited and wizard is not linked to edit action
        else {
            var add = true;
            if (!gridExtension.per_record_summary_sp) {
                $.each(commandsrev, function (k, v) {
                    if (v.name == "edit")
                        add = false;
                });
            }
            //when wizard is  bound to edit don't show readonly 
            if (add)
                commandsrev.push(cmnd);
        }
    }

    if (gridExtension.show_copy_row_button && element.editable && gridrights.usercanupdate) {
        var cmnd = {
            text: '<i class="fa fa-copy"></i>',
            name: "copy_row",
            click: createCopy
        };
        if (!commandsrev) {
            if (element.columns[0].command)
                element.columns[0].command = cmnd;
            else
                element.columns.unshift({
                    command: cmnd
                    , title: ""
                    , width: "85px"
                });
        } else {
            commandsrev.push(cmnd);
        }
    }
}

function showContentInModal(options) {
    var element = getAngularControllerRootHTMLElement(options.controllerBase, true);
    var $modalContent = showModal({
        title: '<i class="fa fa-cog"></i>',
        content: element,
        wide: true
    });
    initAngularController(element, options.controller, options.config, undefined, true);
}
function showRowContentInModal(rowData, gridName, itemsPerRow, additionalSettings, controllerName) {
    var element = getAngularControllerRootHTMLElement(controllerName ? controllerName.replace(/^Magic_/, "") : "RowReader"),
        settings = $.extend({
            rowData: rowData,
            gridName: gridName,
            itemsPerRow: itemsPerRow,
            layerID: rowData.MagicBOLayerID,
            magicFormSettings: {}
        }, additionalSettings || {});
    if (window.prefKendoStyle) {
        $("#row-reader-window").closest(".k-window").remove();
        var $window = $('<div id="row-reader-window" class="k-popup-edit-form searchgrid-window">');
        $window.append(element);
        $("#appcontainer").append($window);
        var kendoWindow = $window.kendoWindow({
            width: 400 * itemsPerRow,
            close: function () {
                kendoWindow.destroy();
                $window.remove();
            }
        }).data("kendoWindow").center();
        settings.magicFormSettings.renderDone = function () {
            kendoWindow.center();
        };
        settings.magicFormSettings.kendoStyle = true;
    }
    else {
        var $modalContent = showModal({
            title: '<i class="fa fa-television"></i>',
            content: element,
            wide: true
        });
    }
    initAngularController(element, controllerName ? controllerName.replace(/^Magic_/, "") + "Controller" : "RowReaderController", settings, null, null, controllerName ? controllerName + "Controller" : null);
}
//TODO da rimuovere questa logica sanando tutti i DS in giro per i vari DB!!! (togliere il ds finale quando il nome della tabella non finisce con ds e correggere la stored che crea le griglie omettendo l' aggiunta del ds finale) 
function normalizeDataSource(dataSource) {
    if (dataSource)
        return dataSource.replace(/ds$/, '');

    return null;
}
//element e' l' oggetto griglia
// se la griglia e' in cell gestisce anche il bind a fk.
function managegridfk(element, data, $parentGridRow) {
    var foreignValues = {}, ar = [];
    $.each(element.dataSource.schema.model.fields, function (k, field) {
        var colIndex = getcolumnindex(element.columns, k);
        if (field.dataSourceInfo && field.dataSourceInfo.dataSource && getcolumnindex(element.columns, k) != null) {
            var dsname = normalizeDataSource(field.dataSourceInfo.dataSource),
                filter = $parentGridRow && element.gridExtension && element.gridExtension.columnFilteredByParentsColumn && element.gridExtension.columnFilteredByParentsColumn[k] ? { value: "", operator: "eq", field: element.gridExtension.columnFilteredByParentsColumn[k] } : null;
            if (filter) {
                var masterGrid = $parentGridRow.closest(".k-grid").data("kendoGrid");
                if (masterGrid) {
                    filter.value = masterGrid.dataSource.getByUid($parentGridRow.data("uid"))[filter.field];
                    if (!filter.value) {
                        filter = null;
                    }
                }
            }
            var _data = undefined;
            if (element.__apiCallData) {
                _data = { __apiCallData: element.__apiCallData };
            }
            ar = GetDropdownValues(dsname, field.dataSourceInfo.dsValueField, field.dataSourceInfo.dsTextField, field.dataSourceInfo.dsSchema, field.dataSourceInfo.dsTypeId, filter, false, _data);

            foreignValues[dsname] = ar;
            ar.unshift({ text: "N/A", value: null });
            element.columns[colIndex].values = ar;
            if (!element.columns[colIndex].template) {
                if (field.dataRole.match(/multiselect/)) {
                    element.columns[colIndex].template = function (dataItem) {
                        var fkHash = {};
                        $.each(ar, function (i, v) {
                            fkHash[v.value] = v.text;
                        });
                        var displayValue = [];
                        if (dataItem[k] && dataItem[k].split(',').length) {
                            $.each(dataItem[k].split(','), function (i, v) {
                                displayValue.push(fkHash[v]);
                            });
                        }
                        return displayValue.join('<br>');
                    }
                }
            }
            if (element.editable === true) {
                if (!element.columns[colIndex].editor) {
                    if (field.dataRole == "dropdownlist") {
                        element.columns[colIndex].editor = inlineCascadeDropDown;
                    } else if (field.dataRole.match(/searchgrid/)) {
                        element.columns[colIndex].editor = inlineCascadeSearchGrid;
                    }
                    else if (field.dataRole.match(/multiselect/)) {
                        element.columns[colIndex].editor = inlineCascadeMultiSelect;
                    }
                }
            }
        } else if (!(field.dataSourceInfo && field.dataSourceInfo.dataSource) && getcolumnindex(element.columns, k) != null) {

            if (element.editable === true) {
                if (!element.columns[colIndex].editor) {
                    if (field.dataRole == "dropdownlist") {
                        element.columns[colIndex].editor = inlineCascadeDropDown;
                    } else if (field.dataRole?.match(/searchgrid/)) {
                        element.columns[colIndex].editor = inlineCascadeSearchGrid;
                    }
                    else if (field.dataRole?.match(/multiselect/)) {
                        element.columns[colIndex].editor = inlineCascadeMultiSelect;
                    }
                }
            }

        }
    });
    return foreignValues;
}

function requiredCss($container) {  //setto alla classe opportuna per avere il bordo rosso i campi  obbligatori dei popup (colonna required)
    var requiredClass = 'k-required';
    $('.k-widget > span + input', $container).each(function () {
        if (this.attributes.required)
            $(this).prev().addClass(requiredClass);
        else
            $(this).prev().removeClass(requiredClass);
    });
    $('.k-widget > span > input, .k-textbox > input', $container).each(function () {
        if (this.attributes.required)
            $(this).parent().addClass(requiredClass);
        else
            $(this).parent().removeClass(requiredClass);
    });
    //geo autocomplete
    $('.k-textbox.k-space-right > .k-autocomplete > input[data-role=autocomplete]', $container).each(function () {
        if (this.attributes.required)
            $(this).parent().parent().addClass(requiredClass);
        else
            $(this).parent().parent().removeClass(requiredClass);
    });

}
//#endregion
//#region autocomplete management
function solvetypeofdatasource(typeofdatasource) {
    if (typeofdatasource === undefined || typeofdatasource === "" || typeofdatasource === null || typeofdatasource === "null" || typeofdatasource === "2")
        return 2; //default table or view
    else
        return parseInt(typeofdatasource); //1 = custom stored, 2= Table or View , 3 = Web API Controller
}
function enableAutocomplete(currentgrid, e) {

    var listofautocompletes = [];
    e.container.find("[data-role=autocomplete]", "[data-role=geoautocomplete]").each(function (i, v) {
        var $element = $(v);
        var fieldname = $element.attr("name");
        if (fieldname) {
            var dsinfo = e.sender.options.dataSource.schema.model.fields[fieldname].dataSourceInfo;
            if (dsinfo) {
                bindAutocompleteCurrentValue(dsinfo, $element, e.model[fieldname]);
                listofautocompletes.push({ dsinfo: dsinfo, $element: $element });
            }
        }
    });

    //for (i = 0; i < autocompletes.length; i++) {
    //    if (autocompletes[i].grid === currentgrid)
    //        bindAutocompleteCurrentValue(autocompletes[i].researchgrid, autocompletes[i].researchfield, eval("e.model." + autocompletes[i].field), autocompletes[i].dom, autocompletes[i].textfield, autocompletes[i].typeofdatasource);
    //}
    if (listofautocompletes.length > 0) {
        var target = $(e.container).find(".k-grid-update");
        $(target).data('elementID', e.model.id);
        $(target).data('currgrid', currentgrid);
        $(target).data('currfields', listofautocompletes);
        $(target).data('sender', e.sender);

        $(e.container).find(".k-grid-update").click(bindremoteautocomplete);
    }
};
//on save click cerca il valore degli autocomplete nei loro datasources per trovare l' ID 
function bindremoteautocomplete(e) {
    function checkGeoAutocomplete($element) {
        try {
            if ($element.parents("span").find("a").attr("onclick") == "showGeoSearch(this);")
                return true;
            else
                return false;
        }
        catch (ex) {
            console.log(ex);
        }
        return false;
    }

    //ID del business object nel datasource della grid
    var gridelementid = $(e.currentTarget).data('elementID');
    var gridobj = $(e.currentTarget).data('sender');

    var ds = gridobj.dataSource.data();
    var dsindex = 0;

    //cerco l' elemento di datasource in modifica
    var i = 0;
    for (i = 0; i < ds.length; i++)
        if (ds[i].id == gridelementid) {
            dsindex = i;
        }

    var fieldmapped = $(e.currentTarget).data('currfields');

    //scorro gli autocomplete
    $.each(fieldmapped, function (j, v) {
        var $acdom = v.$element;
        var fieldname = $acdom.attr("name");
        var actext = v.dsinfo.dsTextField;
        var acvalue = v.dsinfo.dsValueField;
        var ac = $acdom.data("kendoAutoComplete").value();
        var acds = $acdom.data("kendoAutoComplete").dataSource.data();

        if (ac == "") {
            ds[dsindex][fieldname] = 0;
            ds[dsindex].dirty = true;
        }
        var datafound = false;
        for (i = 0; i < acds.length; i++) {
            var text = "";
            text = acds[i][actext];
            var currval = ds[dsindex][fieldname];
            var oldval = acds[i][acvalue];
            if (typeof text == "string")
                text = text.toUpperCase();
            if (typeof ac == "string")
                ac = ac.toUpperCase();
            if (typeof currval == "string")
                currval = currval.toUpperCase();
            if (typeof oldval == "string")
                oldval = oldval.toUpperCase();
            //caso in cui viene trovata una corrispondenza
            if (text == ac) {
                if (currval != oldval) {
                    ds[dsindex][fieldname] = acds[i][acvalue];
                    ds[dsindex].dirty = true;
                }
                datafound = true;
            }

        }
        // if it has a value in the attribute set from an external ds but not an owned datasource (it means no search performed) use it as the value
        if (!datafound && !acds.length && ac && $acdom.data("externally_setid")) {
            ds[dsindex][fieldname] = $acdom.data("externally_setid");
            ds[dsindex].dirty = true;
        }
        //we have a value which has been typed from the user, we give it to the Database in a new "virtual field" called fieldname + "__inputvalue"
        if (!$acdom.data("externally_setid")) {
            var haschanged = false;
            //guardo se e' stato variato il valore dell' input rispetto a quello gia' in DB
            var origvalue = $acdom.data("initialDBValue");
            if (origvalue != undefined && (ac.toUpperCase() != origvalue.toUpperCase()))
                haschanged = true;
            else
                if (origvalue == undefined && ac != '')
                    haschanged = true;
            // se il dato non e' stato trovato ed e' variato il valore e l' input e' popolato e non sono in un geoautocomplete 
            if (datafound == false && haschanged == true && "" != ac && !checkGeoAutocomplete($acdom))//vuol dire che e' stato scritto un valore "nuovo" che va passato al server, aggiungo un campo al ds della griglia con il valore dell'  input e annullo il valore del campo 
            {
                ds[dsindex][fieldname + "__inputvalue"] = ac;
                ds[dsindex][fieldname] = 0;
                ds[dsindex].dirty = true;
            }
        }

    });


}

function bindAutocompleteToGridDataSource(readobj, researchfield, textfield, schema, typeofdatasource, rowdata, $element) {
    var gridname = $element.closest('.k-popup-edit-form').data("gridname");
    schema = !schema ? 'dbo' : schema;
    typeofdatasource = solvetypeofdatasource(typeofdatasource);
    //typeofdatasource :  1= stored , 2= table , 3 = controller
    if (researchfield === "undefined" || !researchfield)
        researchfield = "ID";
    var method = 'POST';
    var url = '';
    if (typeof readobj === 'string' && readobj.startsWith("base64")) {
        var callInfo = parseWebAPIBase64String(readobj);
        method = callInfo[0];
        url = callInfo[1];
        readobj = callInfo[2];
    }
    var ds = {    // caso controller 
        transport: {
            read: {
                url: "/api/" + (url ? url : readobj + "/Select"),
                type: method,
                contentType: "application/json"
            },
            parameterMap: function (options, operation) {
                if (operation === "read") {
                    // convert the parameters to a json object
                    return kendo.stringify(options);
                }
                // ALWAYS return options
                return options;
            }

        },
        requestStart: function (e) {
        },
        requestEnd: function (e) {
            if (e.response !== null && e.response !== "") {

                if (e.response.Errors == null && e.type == "create") {
                    e.sender.read();
                    kendoConsole.log(e.type + " OK", false);
                }
            }
            else
                if (e.type == "update" || e.type == "destroy") {
                    e.sender.read();
                    kendoConsole.log(e.type + " OK", false);
                }
        },

        batch: false,
        // error: error,
        pageSize: 1000,
        serverPaging: true,
        serverSorting: true,
        serverFiltering: true,
        schema: {
            data: "Data",
            total: "Count",
            errors: "Errors"
        }
    };

    //TABLE VIEW OR STORED
    if (typeofdatasource === 2 || typeofdatasource === 1 || url !== '') //faccio il doppio controllo per funzionare sia con '1' che con 1
    //Table read or stored procedure launched by GenericSqlCommand Controller
    {
        ds.transport.read = {
            url: "/api/GenericSQLCommand/SelectA",
            type: "POST",
            contentType: "application/json"
        };
        //lancio una sp standard se il tipo e' 2 (Table or View) mentre se e' 1 uso la stored impostata dall' utente nel campo Magic_DataSource 
        var storedprocedure = (typeofdatasource === 2) ? 'magic_autocompletestd' : schema + '.' + readobj;

        ds.transport.parameterMap = function (options, operation) {
            if (operation === "read") {
                options.layerID = null;
                options.EntityName = schema + '.' + readobj;
                options.functionID = null;
                options.operation = operation;
                options.GridName = gridname;
                options.data = JSON.stringify(rowdata);
                options.Columns = [researchfield, textfield];
                options.DataSourceCustomParam = url === '' ? '{ read: { type: "StoredProcedure", Definition:"' + storedprocedure + '"} }' : undefined;
                return kendo.stringify(options);
            }
            // ALWAYS return options
            return options;
        };
        ds.schema = {
            data: "Data",
            total: "Count",
            errors: "Errors",
            parse: function (response) {
                //caso di dati da DataTable da C#
                if (response.Data != null)
                    if (response.Data.length >= 1)
                        if (response.Data[0].Table != undefined) {
                            return { Data: response.Data[0].Table, Errors: response.Errors, Count: response.Count };
                        } //dati da model 
                return response;
            }
        }
    }

    return ds;

}
//assegna la descrizione all' autocomplete quando viene creato il popup editor sulla base del suo valore corrente (campo chiave)
function bindAutocompleteCurrentValue(dsInfo, $element, valuetoresearch) {
    var gridname = $element.closest('.k-popup-edit-form').data("gridname");
    var typeofdatasource = dsInfo.dsTypeId ? dsInfo.dsTypeId : 2;
    var researchgrid = (typeofdatasource != 3) ? (dsInfo.dsSchema ? dsInfo.dsSchema : "dbo") + "." + dsInfo.dataSource : dsInfo.dataSource;
    var researchgridKey = dsInfo.dsValueField;
    var textfield = dsInfo.dsTextField;


    if (!researchgridKey)
        researchgridKey = "ID";

    if (valuetoresearch || valuetoresearch == 0) {
        if (typeofdatasource === 3) //controller
        {
            dsInfo.value = valuetoresearch;
            var ds = getdatasource(researchgrid, researchgridKey, "Get/" + valuetoresearch, undefined, undefined, dsInfo);
            var autocomplete = $element.data("kendoAutoComplete");
            if (ds != null && ds.length > 0) {
                var val = ds[0][textfield];
                autocomplete.value(val);
                $element.data("initialDBValue", val);
            }
            else {
                $element.data("initialDBValue", '');
                autocomplete.value("");
            }
        }
        if (typeofdatasource === 2 || typeofdatasource === 1) //2 =  table or view, 1 = custom SP
        {
            var storedprocedure = (typeofdatasource === 1) ? researchgrid : null;
            $.ajax({
                type: "POST",
                url: "/api/GENERICSQLCOMMAND/SelectA",
                data: JSON.stringify({
                    GridName: gridname,
                    EntityName: researchgrid,
                    take: 1,
                    filter: {
                        field: researchgridKey,
                        operator: "eq",
                        value: valuetoresearch,
                    },
                    DataSourceCustomParam: storedprocedure && '{"read":{"Definition":"' + storedprocedure + '"}}',
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    var autocomplete = $element.data("kendoAutoComplete");
                    if (result.Count > 0) {
                        var val = result.Data[0].Table[0][textfield];
                        autocomplete.value(val);
                        $element.data("initialDBValue", val);
                    }
                    else {
                        $element.data("initialDBValue", '');
                        autocomplete.value("");
                    }
                }
            });
        }


    }
}

//#endregion
//#region managepopupdims
function expandPopUpwindow(container) {
    (container ? container : window.objectinedit.container.children(".k-edit-form-container")).closest(".k-window").width(1200).find('.k-window-content').data("kendoWindow").center();
}

function resetPopupwindowDimension(numcol, gridcontainer) {
    if (numcol === undefined)
        numcol = gridcontainer.closest('.k-popup-edit-form').attr("numcol");
    //ridimensiono il popup
    var window = gridcontainer.closest(".k-window").width(numcol * 400).find('.k-window-content').data("kendoWindow");
    if (window)
        window.center();
}
//#endregion
//#region POPUPMANAGEMENT
function inspectTabsToRemove(tabstriptoinspect, model, restrictedtabs, noneditabletabs) { //<-- closure function with additional par
    var tabstriptoinspectref = tabstriptoinspect; // <-- storing the variable here

    return function (index, value) { // This function gets called by the jQuery 
        var tabcontent = $(value).data("contentObject");
        var isvisible = tabcontent && tabcontent.contentType == "GRID" ? checkGridVisibility(tabcontent.objectName) : true;
        // .each() function and can still access storedVariable
        var tabstripstored = tabstriptoinspectref; // <-- referencing it here
        var contentElementRow = $(tabstripstored.contentElement(index)).find('.row');
        //remove tab if it's empty or it does not own the proper layer or its content is "restricted" via DB 
        if ((contentElementRow.length && !contentElementRow.children().length) || tabHasToBeRemoved(model, value) || (tabcontent && tabContentOrTabHasToBeRemoved(tabcontent, isvisible, restrictedtabs, value)))
            tabstripstored.disable(value);
        //mark the tab as noneditable with an attribute
        if (tabcontent)
            tabContentIsNotEditable(tabcontent, noneditabletabs, value);

    }
}

function removeDetailGridsOnInsert(e) {
    function removeTabStripGrids(e) {
        var tabstrip = $(e.container).find(".k-tabstrip").data("kendoTabStrip");
        e.container.find("li").each(function (i, v) {
            var data = $(v).data();
            {
                if (data.contentObject && data.contentObject.contentType == "GRID")
                    tabstrip.remove($(v));
            }
        });
    }
    //remove related grids for new rows if i'm in a nested popup.The 1st level popup will have them because of the config show_popup_related_grids_on_insert (MagicGridExtension).
    var $parentPopUp = e.sender.wrapper.closest("div.k-popup-edit-form.k-window-content.k-content");
    if ($parentPopUp.length > 0 && $parentPopUp.data("isNew") && e.model.isNew() && e.show_popup_related_grids_on_insert == true) {
        removeTabStripGrids(e);
    }
    else //default: new does not manage the related grids' tabs
        if (e.model.isNew() && !e.show_popup_related_grids_on_insert)
            removeTabStripGrids(e);
}


//alla chiusura del popup di edit vado a considerare in edit la griglia precedente (serve per gestire la search e la detailgrid)
function appendCurrentGridManagementOnPopUpClosure(e) {
    //appendo alla popup il numero di colonne un cui e' disposta 
    e.container.attr("numcol", $(e.sender.element).attr("editablecolumnnumber"));
    var sender = e.sender;
    var manager = function (e) {
        if (this.element.attr("closed") == "closed") {
            e.preventDefault();
            return;
        }
        var curr = currentgrid;
        if (prevgridhash[curr] !== undefined) {
            //mark the window as closing
            this.element.attr("closed", "closed");
            currentgrid = prevgridhash[curr].prevgrid;
            window.objectinedit = prevgridhash[curr].objectinedit;
            elementineditid = prevgridhash[curr].prevelementineditid;
        }
        //due to a kendobug which resets the command columns when popup is closed
        setTimeout(function () {
            manageEditButtonsOnDataBoundAndPopUpCancel(sender.element);
        }, 500);
    };

    var dialog = e.container.closest(".k-window-content").data("kendoWindow");
    if (dialog)
        dialog.bind("close", manager);

}

//valuefield e textfield sono i valori da selezionare sull'  entita' esterna
//tablename e' la tabella/vista che interrogo
function returnInCelldropdatasource(tablename, valuefield, textfield, typeofdatasource, dstargetdomid, schema, field) {
    //POSSIBLESOLUTION
    var ret = function (container, options) { // use a dropdownlist as an editor
        var model = options.model;
        // create an input element with id and name set as the bound field (brandId)
        var input = $('<input id="' + options.field + '" name="' + options.field + '">');
        if (field.validation && field.validation.required)
            input.attr("required", "required");
        // append to the editor container 
        input.appendTo(container);
        var ds = getdropdatasource(tablename, textfield, undefined, dstargetdomid, undefined, valuefield, schema, typeofdatasource, model, true);

        input.kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: ds,
            valuePrimitive: false
        }).appendTo(container);
    };

    return ret;
}
function disableUnEditableItems(fields, container) {
    $.each(fields, function (key, v) {
        if (v.dataRole && v.dataRole.indexOf("searchgrid") != -1 && v.editable == false) {
            container.find("input[name=" + key + "]").attr("disabled", "disabled");
            var span = container.find("input[name=" + key + "]").parents("span");
            span.find("a").hide();
        }
        if (v.dataRole == "textarea" && v.editable == false)
            container.find("textarea[name=" + key + "]").attr("disabled", "disabled");
    });
}
function getKendoComponents() {
    return {
        dropdownlist: "kendoDropDownList",
        timepicker: "kendoTimePicker",
        datepicker: "kendoDatePicker",
        datetimepicker: "kendoDateTimePicker",
        autocomplete: "kendoAutoComplete",
        colorpicker: "kendoColorPicker",
        multiselect: "kendoMultiSelect",
        numerictextbox: "kendoNumericTextBox",
        upload: "kendoUpload",
        combobox: "kendoComboBox",
        //editor: "kendoEditor", --> has no enable function
        flatcolorpicker: "kendoFlatColorPicker",
        maskedtextbox: "kendoMaskedTextBox",
        rangeslider: "kendoRangeSlider",
        slider: "kendoSlider"
    };

}
///Overrides properties of fields in a kendo popup by columnname (e is the edit event)
function detectWidgetTypeAndOverrideBehaviour(columnname, required, editable, defvalue, hide, detaildomid, e, popUplabel) {
    //casi gestiti: una drop, un autocomplete, un textbox, un numeric, una search
    var $element;
    if (detaildomid) {
        $element = $(e.container[0]).find("#" + detaildomid);
    }

    // If element not found by ID (or detaildomid doesn't exist), search by columnname
    if (!$element || $element.length === 0) {
        $element = $(e.container[0]).find("[name=" + columnname + "]");
    }

    var dataRole = $element.attr("data-role"),
        kendoComponents = getKendoComponents();
    if (defvalue != undefined && defvalue != null) {
        if (defvalue.indexOf("{") != -1)
            defvalue = JSON.parse(defvalue);
        if (dataRole && (dataRole in kendoComponents)) {
            var kobject = $element.data(kendoComponents[dataRole]);
            if (dataRole == "numerictextbox" && defvalue == "") {
                e.model.set(columnname, null);
            }
            else
                kobject.value(defvalue && defvalue.text ? defvalue.text : defvalue);
            if (dataRole == "autocomplete") {
                $element.data("externally_setid", defvalue.value ? defvalue.value : defvalue);
                kobject.trigger("change");
                kobject.one("change", function () {
                    $element.data("externally_setid", ""); //when the user modifies the value delete the external id
                });
            }
            else
                kobject.trigger("change");
        }
        else {

            $element.val(defvalue.text ? defvalue.text : defvalue);
            //make sure that the model changes
            //0 means they want to reset the value if it's in the {value:"0",text:""} format
            if (typeof defvalue == "object" && (defvalue.value == "0" || defvalue.value == null))  //set to null
            {
                //big porcheria to unselect searchgrids ....
                if ($element.closest("div").find("a.k-i-cancel").attr("onclick")
                    && $element.closest("div").find("a.k-i-cancel").attr("onclick").indexOf("unselectResearchgridValue") != -1) {
                    var oldValue = e.model[columnname];
                    e.model[columnname] = null;
                    e.model.dirty = oldValue != null;
                    $element
                        .val("")
                        .trigger('searchGridChange', [null, oldValue])
                        .parent().removeClass("has-value");
                }
                else
                    e.model.set(columnname, null);
            }
            else
                e.model.set(columnname, defvalue.value ? defvalue.value : defvalue);
        }
        //Bug #3830 - close the previously created validation tooltip if a value has been set
        try {
            $element.closest("div.k-edit-field").find('span.k-tooltip-button').find('a.k-icon.k-i-close').trigger('click');
        }
        catch (ex) {
            console.log(ex);
        }
    }

    //Feature #7137 - Constraint editable per griglie con edit Inline
    let currentEditableSetting = null;
    if (e && e.sender && e.sender.options && e.sender.options.editable) {
        if (e.sender.options.isSchemaFormGrid && (e.sender.options.editable == true || e.sender.options.editable == "incell")) {
            let kgrid = $(e.container)
                .closest(".k-grid")
                .data("kendoGrid");

            if (kgrid) {
                let model = kgrid.dataSource.at(0);
                currentEditableSetting = model.fields[columnname].editable;

                if (model && (editable === true || editable === false) && currentEditableSetting !== editable)
                    model.fields[columnname].editable = editable;
            }
        }
    }


    if (dataRole && (dataRole in kendoComponents)) {
        if ($element.data(kendoComponents[dataRole]) && currentEditableSetting !== editable) {
            $element.data(kendoComponents[dataRole]).enable(editable);
        }
    } else {

        if (dataRole && $element.parent().hasClass('k-space-right')) {
            if (!editable)
                $element.parent().addClass("k-state-disabled");
            else
                $element.parent().removeClass("k-state-disabled");
        }

        if (!editable)
            $element.attr("disabled", "disabled");
        else
            $element.removeAttr("disabled");

        if ($element.parent().hasClass('k-space-right')) {  //searchgrids
            var span = $element.closest("span");
            if (span.length && !editable)
                span.find("a").hide();
            else if (span.length && editable)
                span.find("a").show();
        }

    }

    if (!required)
        $element.removeAttr("required");
    else
        $element.attr("required", "required");

    if (!hide)
        $element.closest(".k-edit-field").parent("div").show();
    else
        $element.closest(".k-edit-field").parent("div").hide();

    if (popUplabel) {
        var $label = $(e.container[0]).find("label[for='" + $element.attr('id') + "']");
        $label.text(popUplabel);
    }
    requiredCss(e.container[0]);
}

function combineIntoApiFormat() {
    let verb = $("#MagicDataSource_VERB").val(), controller = $("#MagicDataSource_CONTROLLER").val(), APIIdentity = $("#MagicDataSource_IDENTIFIER").val();

    if (!verb || !APIIdentity)  // in this case the old syntax is managed
        $("#MagicDataSource").val(controller.replace("/", "$"));
    else {
        let vals = (verb || 'GET') + ' ' + controller + ' ' + APIIdentity;
        let config = 'base64' + btoa(vals).replace(/=/g, '');
        //$("#MagicDataSource").val(config);
        //get the model of current row
        let $dsourceinput = $("#MagicDataSource");
        let uid = $dsourceinput.closest(".k-popup-edit-form").data("uid");
        let gridDs = $dsourceinput.closest(".k-popup-edit-form").data("gridDS");
        let dsitem = gridDs.data().filter(function (x) { if (x.uid == uid) return x; });
        if (!dsitem.length) {
            console.error("unable to find the item in the dataSource...");
            return;
        }
        dsitem[0].set("MagicDataSource", config);
    }
}
function showWebApiFields($datasource) {
    let $datasourceDiv = $datasource.closest('div.col-sm-6');
    let value = $datasource.val();
    let verb = "", controller = "", APIIdentity = "";
    if (value.startsWith("base64")) {
        let decodedStrings = atob(value.substring(6, value.length)).split(" ");
        verb = decodedStrings[0];
        controller = decodedStrings[1];
        APIIdentity = decodedStrings[2];
    } else if (value) {
        controller = value.replace("$", "/");
    }
    let selectedGet = "";
    let selectedPost = "";
    if (verb == "GET")
        selectedGet = "selected";
    if (verb == "POST")
        selectedPost = "selected";

    $datasource.attr("disabled", "disabled");
    $datasourceDiv.after(`<div class="row">
								<div class="col-sm-6 datasourceAPIFields">
									<div class="k-edit-label">
											<label for= "MagicDataSource_VERB" >Verb</label>
									</div>
									<div class="k-edit-field">
										<select onchange="combineIntoApiFormat()" id="MagicDataSource_VERB"  name="MagicDataSource_VERB">
												<option/>
												<option {0}>GET</option>
												<option {1}>POST</option>
										</select>
									</div>
								  </div>
								<div class="col-sm-6 datasourceAPIFields">
									<div class="k-edit-label">
											<label for= "MagicDataSource_CONTROLLER" >ControllerName / method</label>
									</div>
									<div class="k-edit-field">
										<input onchange="combineIntoApiFormat()" value="{2}" style="width:94%!important;" type="text" id="MagicDataSource_CONTROLLER" class="k-input k-textbox" name="MagicDataSource_CONTROLLER" maxlength="100">
									</div>
								  </div>
								<div class="col-sm-6 datasourceAPIFields">
									<div class="k-edit-label">
											<label for= "MagicDataSource_IDENTIFIER" >API Identifier</label>
									</div>
									<div class="k-edit-field">
										<input onchange="combineIntoApiFormat()" value="{3}" style="width:94%!important;" type="text" id="MagicDataSource_IDENTIFIER" class="k-input k-textbox" name="MagicDataSource_IDENTIFIER" maxlength="100">
									</div>
								  </div>
								</div>`.format(selectedGet, selectedPost, controller, APIIdentity));

}
///ShowLinkToBO deve essere passata nella notazione { appendTo:"tabstrippopup-1" } e fa si che venga creato 
///il search ed associazione a BO in una form di popup
function getStandardEditFunction(e, functionname, gridname, insertLayerid, showLinkToBO, layerpreselect) {
    function addUserFieldsToTemplate(e) {
        function appendUserFieldsAndInitKendo(options) {
            var htmlToAdd = options.htmlToAdd;
            var $tab;
            if (e.container.find(options.tabSelector).length) {
                $tab = e.container.find(options.tabSelector).find("div[class^=row]");
                $tab.append(htmlToAdd);
                kendo.init($tab.find("[iscustomerfield=true]")); kendo.bind($tab.find("[iscustomerfield=true]"), options.model);
            }
        }
        var listOfXMLFieldsInPopUp = {};
        var defer = new $.Deferred(), htmlToAdd = "";
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.getDataSet({ rowData: e.model, gridName: e.sender.wrapper.attr("gridName") }, "USERFIELDS.Magic_GetGridUserColumnsVisible")
                .then(function (res) {
                    if (!res.length) {
                        if (res.status == 500 && res.responseText)
                            console.log(res.responseText);
                        defer.resolve();
                    }
                    var selectors = {};
                    var vtabs = {};
                    $.each(res[0], function (i, v) {
                        //if "UserTabToAppend" from stored procedure has value the a new tab is inserted and the tabselector is ignored 
                        listOfXMLFieldsInPopUp[v.fieldname] = true;
                        if (v.tabtoappend) {
                            var uta = JSON.parse(v.tabtoappend)[window.culture.substring(0, 2)];
                            if (!uta)
                                uta = JSON.parse(v.tabtoappend)["it"];
                            if (!vtabs[uta])
                                vtabs[uta] = [v.fieldname];
                            else
                                vtabs[uta].push(v.fieldname);
                        }
                        //look up for a tabselector
                        else if (v.tabselector) {
                            if (!selectors[v.tabselector])
                                selectors[v.tabselector] = [v.fieldname];
                            else
                                selectors[v.tabselector].push(v.fieldname);
                        }
                    });
                    var ktabstrip = e.container.find(".k-tabstrip").data("kendoTabStrip");
                    //append Vtabs into kendo tabstrip after the 1st 
                    var tabs = [];
                    var j = 2;
                    var tclass = e.container.find("#tabstrippopup-1").find(".row:first").attr("class");
                    $.each(vtabs, function (k, v) {
                        tabs.unshift({ text: k, content: "<div class='{0}'/>".format(tclass) });
                        if (!selectors["#tabstrippopup-" + j.toString()])
                            selectors["#tabstrippopup-" + j.toString()] = v;
                        else
                            selectors["#tabstrippopup-" + j.toString()].push(v);
                        j++;
                    });
                    if (window.vocalCommandsActive) { //#vocalDev
                        if (e && e.container) {
                            var $inputs = e.container.find('.k-edit-field').find('input[type=text].k-textbox:not(:disabled):visible').filter(function () { return $(this).width() > 1 });
                            var $textareas = e.container.find('.k-edit-field').find('textarea:not(:disabled)').filter(function () { return $(this).width() > 1 });
                            var $kendoEditorContainers = e.container.find('table').find('.k-editable-area');

                            enableVocalCommandsForKendoPopupElements($inputs);
                            enableVocalCommandsForKendoPopupElements($textareas);
                            enableVocalCommandsForKendoEditorFields($kendoEditorContainers);
                        }

                    }
                    //append tabs to kendo
                    if (ktabstrip)
                        ktabstrip.insertAfter(tabs, ktabstrip.tabGroup.children().eq(0));
                    $.each(selectors, function (k, v) {
                        var tabselector = k, fields = v;
                        htmlToAdd = "";
                        $.each(fields, function (i, value) {
                            if (e.model.fields[value] && e.model.fields[value].isCustomUserField)
                                htmlToAdd += e.model.fields[value].popupHtml;
                        });
                        //kendo always generates lower case selectors while GUID in sql are uppercase...

                        appendUserFieldsAndInitKendo({ htmlToAdd: htmlToAdd, tabSelector: (tabselector ? tabselector : "").toLowerCase(), model: e.model });
                    });
                    defer.resolve(listOfXMLFieldsInPopUp);
                });
        });
        return defer.promise();
    }
    function addgroupsToPopup(iIndice, oArray, e) {
        var objParentNew;
        var createGroup = false;
        var oUId = e.container.data("uid");
        $(oArray.fields).each(function (index, field) {
            try {
                obj = e.container.find("[name=" + field.Column + "]");
                if (obj.length) {
                    //objParent = obj.closest($("[role='tabpanel']")).find("div:first");
                    objParent = obj.closest($("[id^='tabstrippopup']")).find("div:first");
                    if (objParent.length) {
                        if (!objParentNew) {
                            objParentNew = obj.closest("div").parent().parent().clone().appendTo(objParent.parent());
                            objParentNew.children().remove();
                        }
                        if (e.container.find("#riga-" + iIndice).length == 0) {
                            obj.closest("div").parent().wrapAll('<div id="riga-' + iIndice + '" class="' + objParentNew.attr("class") + '"></div>');
                            e.container.find("#riga-" + iIndice).insertAfter(objParentNew.first("div"));
                            objParentNew.first("div").append(e.container.find("#riga-" + iIndice));
                            createGroup = true;
                        }
                        else {
                            //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/154
                            if (obj.attr("type") != "file")
                                e.container.find("#riga-" + iIndice).append(obj.closest("div").parent());
                            else //if it's a file upload we have to search differently
                                e.container.find("#riga-" + iIndice).append(obj.closest("div[class*=col]"));
                        }
                    }
                }
            }
            catch (err) {
                console.log("Errore grouping fields: " + err.message);
            }
        })

        try {
            if (createGroup) {

                var sDivClassCollapse = "panel-collapse in";

                //sCulture = kendo.culture()["name"].replace('-', '_');
                sCulture = window.culture.replace('-', '_');

                sTitle = oArray["labels"][sCulture];
                if (!sTitle)
                    sTitle = oArray["labels"]["it_IT"];

                if (oArray.collapsed != undefined && oArray.collapsed) {
                    sDivClassCollapse = "panel-collapse collapse";
                }

                e.container.find("#riga-" + iIndice).wrapAll('<div id ="body-' + iIndice + '" class="' + "panel-body" + '"></div>');
                e.container.find("#body-" + iIndice).wrapAll('<div id ="collapse-' + oUId + "-" + iIndice + '" class="' + sDivClassCollapse + '"></div>');
                e.container.find("#collapse-" + oUId + "-" + iIndice).wrapAll('<div id ="default-' + iIndice + '" class="' + "panel panel-primary_r3" + '"></div>');
                e.container.find("#default-" + iIndice).prepend('<div id ="heading-' + iIndice + '" class="panel-heading_r3"><h4 class="panel-title_r3" id="title-' + iIndice + '"><a data-toggle="collapse" data-parent="#group-' + oUId + "-" + iIndice + '" href="#collapse-' + oUId + "-" + iIndice + '" id ="container-' + iIndice + '">' + sTitle + '</a></h4></div>');
                e.container.find("#default-" + iIndice).wrap('<div class="panel-group_r3" id="group-' + oUId + "-" + iIndice + '"></div>');
            }
        }
        catch (err) {
            console.log("Errore raggruppamento creazione gruppo : " + err.message);
        }
    }
    function groupFieldsInTabs(e) {
        if (e.container.find("[class='panel-group_r3']").length > 0)
            e.container.find("[class='panel-group_r3']").parent().children().remove();
        if (e.popupfieldgroups)
            $(e.popupfieldgroups).each(function (i, v) {
                addgroupsToPopup(i, v, e);
            });


    }
    function getDataLayerId(e, insert, insertLayerid) {
        //layer from DB data
        var currentlayerid = e.model["MagicBOLayerID"];
        if (insert == true && !currentlayerid) {
            if (insertLayerid)
                e.model.set("MagicBOLayerID", parseInt(insertLayerid))
            currentlayerid = insertLayerid; //se sono in inserimento non posso guardare il layer della row ma devo basarmi su quello che viene passato alla funzione 
        }
        return !currentlayerid ? null : currentlayerid;
    }
    //allows changing the behaviour of XML fields for a certain popup call
    function overrideXmlFieldsInPopUp(e, listOfXMLFieldsInPopUp) {
        $.each(e.xmlFieldsToAlter, function (key, value) {
            if (listOfXMLFieldsInPopUp && listOfXMLFieldsInPopUp[key])
                detectWidgetTypeAndOverrideBehaviour(key, value.required, value.editable, value.defvalue, e.hide, null, e, value.label);
        });
    }
    function magicDataSourceTypeIdChanged(e) {
        console.log(e);
        let $datasource = $("#MagicDataSource");
        if (e.sender.value() != 3) {//not a web api
            $(".datasourceAPIFields").remove();
            $datasource.removeAttr("disabled");

            return;
        }
        showWebApiFields($datasource);
    }
    function applyFormEditCSS(e) {  //#formedit
        if (editFormData == null) {
            return;
        }
        var fieldContainers = $(e.container).find(".k-tabstrip-wrapper > .k-widget > .k-content");
        for (var i = 0; i < fieldContainers.length; i++) {
            var onlyRow = $(fieldContainers[i]).find(".row");
            var fields = onlyRow.children();
            for (var j = 0; j < fields.length; j++) {
                var field = fields[j];

                var kEditField = $(field).children(".k-edit-field");
                var fieldName = kEditField.find('input').attr("name");          //find name of input
                if (fieldName == undefined) {
                    fieldName = kEditField.find('textarea').attr("name");           //find name of textarea
                }
                if (fieldName == undefined) {
                    fieldName = $(kEditField.find(".k-input")[1]).attr('name');     //find name of numeric input
                }
                if (fieldName == undefined) {
                    fieldName = $(kEditField.find("label")[0]).attr('name');     //find name of label field
                }

                var fieldData = editFormData.find((d) => { return d.ColumnName == fieldName })
                if (fieldData) {
                    if (fieldData.MagicFormExtension == null) {
                        return;
                    }
                    if (fieldData.MagicFormExtension.isApplied && fieldData.MagicFormExtension.isApplied === true && fieldData.MagicFormExtension.isKendoPopupLayout && fieldData.MagicFormExtension.isKendoPopupLayout === true) {
                        var bootstrapClass = fieldData.MagicFormExtension.bootstrapClass;
                        bootstrapClass = bootstrapClass.replace("12", "11");
                        $(field).removeClass();
                        $(field).addClass(bootstrapClass);

                        if (fieldData.MagicFormExtension.numberOfRows) { //#formedit #numberOfTextareaRows
                            $(field).find('textarea')[0].rows = fieldData.MagicFormExtension.numberOfRows;
                        }

                        if (fieldData.MagicFormExtension.hasCustomCSS) { //#labelCSS

                            var el = $(field).find('label:contains("' + fieldData.ColumnName + '")')[0]

                            if (!el) {
                                el = $(field).find('label:contains("' + fieldData.Columns_label + '")')[0];
                            }
                            if (!el) {
                                el = $(field).find('.k-edit-field')[0];

                                var labelFor = $('label[for="' + fieldName + '"]');
                                var label = $('label[name="' + fieldName + '"]');
                                //special case: remove label if no text was set
                                //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/185
                                if (labelFor.text().length == 0) {
                                    labelFor.parents('.col-md-11').removeClass('col-md-11').addClass('col-md-12');
                                    labelFor.parent().hide();
                                    label.parent().css('width', '100%');
                                }
                            }


                            if (el) {
                                el.style.fontSize = fieldData.MagicFormExtension.fontSize;
                                el.style.fontWeight = fieldData.MagicFormExtension.fontWeight;
                                el.style.fontStyle = fieldData.MagicFormExtension.fontStyle;
                                el.style.fontVariantCaps = fieldData.MagicFormExtension.fontVariantCaps;
                                el.style.color = fieldData.MagicFormExtension.color;
                                el.style.backgroundColor = fieldData.MagicFormExtension.backgroundColor;

                                if (fieldData.MagicFormExtension.shadow && fieldData.MagicFormExtension.shadow.length > 0) {
                                    el.style.textShadow = fieldData.MagicFormExtension.shadow;
                                }
                                el.style.textDecorationLine = fieldData.MagicFormExtension.textDecorationLine;
                                el.style.textDecorationStyle = fieldData.MagicFormExtension.textDecorationStyle;
                                el.style.textDecorationColor = fieldData.MagicFormExtension.textDecorationColor;
                            }
                        }

                    }
                }
            }
        }
    }
    //detect if there is an edit page for the grid. If it is true redirect to the proper URL
    if (e.sender.options.gridExtension && e.sender.options.gridExtension.editPageCode) {
        e.preventDefault();

        //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/277
        var isOpenedFromInsideParentGridEditPage = (!window.location.href.includes('/function/') && window.location.href.includes('/edit/')); //previous condition was wrong
        if (isOpenedFromInsideParentGridEditPage && e.sender.options.dataSource.filter) {   //pass filter to next GridEditPage #parentGridFilter
            sessionStorage.setItem("gridEditPage_parentGridFilter", JSON.stringify(e.sender.options.dataSource.filter));
        }

        let sdata = { options: e.sender.dataSource.options, id: e.model.id }

        var currentEvents = $._data(window, "events");
        if (!currentEvents.message) {                   //set message-event if not already present
            $(window).on("message", function (event) {
                if (event.target.origin !== window.origin)
                    return;
                e.sender.dataSource.read();             //refresh grid after receiving message other window
            });
        }
        sessionStorage.setItem("gridEditPage_" + e.sender.options.guid, JSON.stringify(sdata));
        window.open(window.location.protocol + "//" + window.location.host + "/app#/" + (e.model.isNew() ? "new" : "edit") + "/" + e.sender.options.gridExtension.editPageCode + "/" + e.model.id, "_blank");

        //destroy kendo window
        if (e.sender.options.editable.mode == "popup" && e.container.data("kendoWindow"))
            e.container.data("kendoWindow").close();
        e.sender.cancelChanges();
        return;
    }

    var insert = false;

    //if it's new , has a filter on PK and a value https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/203
    undoPKFiltersOnNewEdit(e);

    //init datalist columnExtensions
    if (e.sender.options.gridExtension && e.sender.options.gridExtension.columnExtensions) {
        $.each(e.sender.options.gridExtension.columnExtensions, function (k, v) {
            var $input = $('input[type=text][name="' + k + '"]', e.container);
            if ("dataList" in v && v.dataList.length) {
                if ($input.length) {
                    var attr = k + '_data_list';
                    $input.attr('list', attr);
                    $input.append('<datalist id="' + attr + '"><option value="' + v.dataList.join('"><option value="') + '"></datalist>');
                }
            }
            if ("autocompleteFilterOperator" in v && v.autocompleteFilterOperator && $input.length)
                $input.attr('autocompletefilteroperator', v.autocompleteFilterOperator);
        });
    }

    //in cell edit, non faccio niente in questo metodo che e' dedicato al popup
    if (e.sender.options.editable.mode != "popup") {
        if (e.model.Editable === false)
            e.container.closest("[data-role=grid]").data("kendoGrid").closeCell();
        return;
    }
    else //popup  nascondo il pulsante salva se esplicitato il campo Editable a false e se non sono in inserimento
        if (e.model.Editable == false && e.model.id) //FA #6144: modificato da "===" a "==" in quanto il campo Editable si presenta con 0 o 1
            e.container.find('.k-grid-update').remove();

    var selectDataBounds = new $.Deferred();
    addUserFieldsToTemplate(e).done(function (listOfXMLFieldsInPopUp) {
        if (e.xmlFieldsToAlter)
            overrideXmlFieldsInPopUp(e, listOfXMLFieldsInPopUp);
        //var modelcurrentlyinedit = e.model;
        e.model.listOfXMLFieldsInPopUp = listOfXMLFieldsInPopUp;
        //D.T disable the link on searchgrid label by default
        if (!window.searchGridCurrentValue)
            e.container.find("label a.searchgriddetail__").each(function (i, v) {
                $(v).closest("label").html($(v).html());
                $(v).remove();
            });

        //on hover add to searchgrid labels an ajax call
        var manageToolTipAndLinksForSearchGrids = function () {

            var uid = e.container.data().uid;
            e.container.find("label a.searchgriddetail__").each(function (i, v) {
                var $label = $(v).closest("label");
                var fieldname = $("#" + $label.attr("for")).attr("name");
                var id = 0;
                var valueField = 0;
                $.each(e.sender.dataSource.data(), function (i, row) {
                    if (row.uid == uid) {
                        id = row.id;
                        valueField = row[fieldname];
                        return false; //break
                    }
                });
                var data;
                $label.closest("div.k-edit-label").hover(function () {
                    data = e.sender.dataSource.options.schema.model.fields[fieldname] ? e.sender.dataSource.options.schema.model.fields[fieldname].dataSourceInfo : null;
                    if (!data)
                        return;
                    data.currentPkValue__ = id;
                    data.currentGrid__ = e.sender.element.attr("gridname");
                    data.fieldName__ = fieldname;
                    data.fieldValue__ = valueField;
                    requireConfigAndMore(["MagicSDK"], function (MF) {
                        MF.api.getDataSet(data, "CUSTOM.Magic_SearchGridsOnHover")
                            .then(function (res) {
                                if (res.length && res[0].length)
                                    $label.kendoTooltip({
                                        position: "left",
                                        hide: function () {
                                            $(this.popup.element[0]).closest('.k-animation-container').remove();
                                        },
                                        content: function () {
                                            var html = "";
                                            $(res[0]).each(function (i, vv) {
                                                html += "<div class='row'><div class='col-md-4'><b>" + vv.fieldDescription + ":</b></div><div class='col-md-8 text-left'>" + vv.fieldValue + "</span></div></div>";
                                            });
                                            return html + "</div></div>";
                                        },
                                        width: "500px"
                                    });
                            });
                    });
                });

            });
        };
        if (window.searchGridCurrentValueToolTip)
            manageToolTipAndLinksForSearchGrids();

        //collego la window con l' oggetto datasource del grid e l' ID dell' elemento in modifica
        e.container.data("gridDS", e.sender.dataSource);
        e.container.data("gridDSElementInEditID", e.model.id);
        e.container.data("gridDSElementInEditUID", e.model.uid);
        e.container.data("gridname", e.sender.element.attr("gridname"));
        if (showLinkToBO !== undefined) {
            //append the BO selector to the popup after the given field
            $bOSelector = $('<div class="col-sm-12"></div>');
            $(showLinkToBO.appendTo + ' [class^=col-]:last-child').after($bOSelector);
            var bOselector = $bOSelector.bOSelector({
                tags: insert == false && e.model.MagicBusinessObjectList ? JSON.parse(e.model.MagicBusinessObjectList) : [],
                multiselect: true
            });
            bOselector[0].$element.on('itemAdded itemRemoved', function (e) {
                var model = getCurrentModelInEdit();
                model.dirty = true;
            });
            if (typeof showLinkToBO.callback == "function")
                showLinkToBO.callback();
            //lo popolo coi valori correnti --> e' richiesto che nel model sia presente il campo MagicBusinessObjectList es [ { "BusinessObject_ID":1,"BusinessObjectDescription":"AUTOM 1.2","BusinessObjectType":"CAR" },{  "BusinessObject_ID":3, "BusinessObjectDescription":"UPIM 2.1","BusinessObjectType":"ASSET" }  ]
            if (e.model.MagicBusinessObjectList === undefined)
                console.log("MagicBusinessObjectList should be added to the datasource in order to be rendered");

        }

        //reinit filesToSave and filesToDelete if present D.T 7/9/2015
        e.sender.element.removeData('filesToSave');
        e.sender.element.removeData('filesToDelete');
        e.container.find('input[type=file]:not([data-role=upload])').each(function () {
            var $this = $(this),
                name = $this.attr('name'),
                options = {};

            if (e.model[name])
                options.files = e.model[name].match(/^\[/) ? JSON.parse(e.model[name]) : [{ name: e.model[name] }];

            initKendoUploadField($this, options, e.sender.element, e.model.uid);

        });

        //gestione currentgrid
        appendCurrentGridManagementOnPopUpClosure(e);

        $(".k-grid-cancel").remove(); //toglie l' undo dal form. L' annulla e' rappresentato dalla X
        var textOfTheModal = "";
        var activegridtabstrip = e.sender.element.find("tr[data-uid=" + e.model.uid + "]").closest(".tabstrip");
        if (activegridtabstrip.length)
            textOfTheModal += " - " + activegridtabstrip.data("kendoTabStrip").select().find('span.k-link').first().text();

        if (!e.model.id && !e.model.dirty) { //inserimento, il dirty viene testato per le grid form che non hanno ancora ID ma già inserite
            textOfTheModal = getObjectText("create") + textOfTheModal;
            e.container.closest(".k-window").find(".k-window-title").text(textOfTheModal);
            insert = true;
            e.container.data("isNew", true);
            removeDetailGridsOnInsert(e); //removes the detailGrids (grids inside tabs) if i'm in a popup opened from another popup in order to prevent infinite nesting of savings       
        }
        else //update
        {
            textOfTheModal = getObjectText("edit") + textOfTheModal;
            //get the label of the active tab if any
            e.container.closest(".k-window").find(".k-window-title").text(textOfTheModal);
        }
        if (layerpreselect && insert) {
            e.container.hide();
            e.container.closest('.k-window').hide();
        }
        //setto alla classe opportuna per avere il bordo rosso i campi obbligatori (colonna required)
        requiredCss(e.container);
        try {
            disableUnEditableItems(e.sender.dataSource.options.schema.model.fields, e.container);
        }
        catch (ex) {
            console.log(ex);
        }
        try {
            //lancia la funzione di preselezioni dei tipi passata dal caller
            if (layerpreselect && insert)
                layerpreselect(e);
            //nascondo i campi che sono relativi ad un layer diverso da quello della riga corrente (se e' nullo rimuovo tutto cio' che dipende dai layer )
            var currentlayerid = getDataLayerId(e, insert, insertLayerid);
            if (!(layerpreselect && insert)) // se c'e' il layerpreselect non rimuovo subito perche' chiedo prima all' utente il layer
            {
                //removes tabs for layers (data or application) or restrictions from DB
                removeTabsByLayer(e, currentlayerid).done(function () {
                    selectDataBounds.resolve(populateDataSources(e, gridname ? gridname : "grid"));
                });
            }
            if (e.container.data("kendoWindow") !== undefined)
                e.container.data("kendoWindow").center();
            applyFormEditCSS(e); //#formedit
            //group fields inside popup based on popupfieldgroups array (Advanced grid properties) 
            groupFieldsInTabs(e);
            //attach the change handler to the datasourceType field of the template detail kendo popup 
            if (e.container.find("#Magic_DataSourceTypedd").length) {
                //if current value is 3 show specific fields for web api 
                let $kdatasourcetype = e.container.find("#Magic_DataSourceTypedd").data("kendoDropDownList");
                $("#tabstrippopup").data("kendoTabStrip").bind('activate', function () {
                    setTimeout(function () {
                        //when value changes look for correct layout
                        $kdatasourcetype.bind("change", magicDataSourceTypeIdChanged);
                        if ($kdatasourcetype.value() == 3) //it's a webapi change layout 
                            showWebApiFields(e.container.find("#MagicDataSource"));
                    }, 1000);
                });

            }
        }
        catch (ex) {
            console.log(ex);
        }
    });
    return selectDataBounds;
}
//This works on slave elements which are not kendoDropDownList
function clearCascadingFieldsFrom(columnName, container) {

    function reinitMultiSelect($ele, columnName, $container) {
        var deferred = $.Deferred();
        var filterfield = $ele.data("cascade-from-field");
        setTimeout(function () {
            var model = getModelAndContainerFromKendoPopUp($ele, $container.data("gridDS").options.schema.model.id).model;
            var dsInfo = $container.data("gridDS").options.schema.model.fields[$ele.attr("name")].dataSourceInfo;
            var isMultiselect = ($ele.attr("data-role") === 'multiselect');
            getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $ele.attr("id"), model[columnName] ? model[$ele.attr("name")] : "", dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, model, false, columnName, filterfield, isMultiselect, $container);
            deferred.resolve();
        }
            , 500);
        return deferred.promise();
    }

    if (!container)
        container = "form";
    var $container = $(container);
    $container.find("[class*=searchgrid] > input[data-cascade-from=" + columnName + "]")
        .each(function (i, ele) {
            var $ele = $(ele);
            unselectResearchgridValue($ele.attr("name"), ele);
            $ele.trigger("cascade");
            //setGridColumnValueFromPopupEdit(ele, $ele.attr("name"), "");
        });
    $container.find(".business-object-selector-datarole[data-cascade-from=" + columnName + "]").trigger("cascade");
    //multiselect
    $container.find("input[role=multiselect][data-cascade-from=" + columnName + "]")
        .each(function (i, ele) {
            var $ele = $(ele);
            reinitMultiSelect($ele, columnName, $container).then(function () { $ele.trigger("cascade"); });
        });
}

//popola i datasources all' apertura del popup
function populateDataSources(e, gridn, callback) {
    var rowModel = $.extend({}, e.model);
    var selectDatabounds = {};
    //check di restrizioni nella visibilita' delle griglie dovute ad associazioni "business". La definizione di getStandard_GetTabRestrictions 
    //e' da effettuare (se necessaria) in AdminAreaCustomizations.js della specifica soluzione
    $.each(e.sender.dataSource.options.schema.model.fields, function (k, field) {
        if (field.dataSourceInfo) {
            var type = field.dataRole,
                datasource = normalizeDataSource(field.dataSourceInfo.dataSource),
                text = field.dataSourceInfo.dsTextField,
                value = field.dataSourceInfo.dsValueField,
                schema = field.dataSourceInfo.dsSchema,
                typeofdatasource = field.dataSourceInfo.dsTypeId,
                cascadefrom = field.dataSourceInfo.cascadeColumn,
                cascadefromfield = field.dataSourceInfo.cascadeFilterColumn,
                $element = $("[name=" + k + "]", e.container);

            if (type == "dropdownlist" || type == "multiselect") {
                if ($element.length > 0) {
                    var _data = e.model;
                    if (solvetypeofdatasource(typeofdatasource) === 1 && e.sender && e.sender.options && e.sender.options.__apiCallData)
                        _data.__apiCallData = e.sender.options.__apiCallData;
                    getdropdatasource(datasource, text, undefined, $element[0].id, rowModel[k] || undefined, value, schema, typeofdatasource, _data, false, cascadefrom, cascadefromfield, type == "multiselect", e.container);
                    //add event to handle cascade on non kendo components
                    if (type == "dropdownlist" || type == "multiselect")
                        (function ($element) {
                            var kendoElement = $element.data(type == "dropdownlist" ? "kendoDropDownList" : "kendoMultiSelect");
                            var deferred = $.Deferred();
                            //if the dropdown is slave of another dropdown the dataBoundEvent won't be triggered until the master value has been set so i won't wait for it before loading master's data (manageStageContraints)
                            try {
                                if (!(cascadefrom && e.sender.dataSource.options.schema.model.fields[cascadefrom].dataRole == "dropdownlist"))
                                    selectDatabounds[k] = deferred.promise();
                            }
                            catch (ex) {
                                console.log(ex);
                            }
                            if (type == "multiselect")
                                $element.on("cascade", function () {
                                    clearCascadingFieldsFrom(k, e.container);//clear slave components which are depending from the ms...
                                    resetCascadeSlaveValues(k, rowModel, e.sender.dataSource.options.schema.model, e.container);
                                });
                            if (type == "dropdownlist")
                                kendoElement.one("dataBound", function () {
                                    deferred.resolve();
                                    //wait of kendo filling value before setting trigger listener
                                    setTimeout(function () {
                                        kendoElement.bind("cascade",
                                            function () {
                                                //clear and reload other components if k changes on cascade
                                                clearCascadingFieldsFrom(k, e.container);
                                            });
                                    }, 0);
                                });
                        })($element);
                }
            } else if (type.indexOf("searchgrid") == 0) {
                if (datasource && $element.length)
                    getsearchgridvalueinpopup(datasource, text, undefined, $element[0].id, rowModel[k], value, schema, typeofdatasource, null, e.container, type.indexOf("multi") > -1);
                (function ($element) {
                    $element.on("cascade", function () {
                        clearCascadingFieldsFrom(k, e.container);
                    });
                })($element);
            } else if (type.indexOf("autocomplete") !== -1) {
                if (datasource && $element.length) {
                    //associa un datasource all
                    var ds = bindAutocompleteToGridDataSource(datasource, value, text, schema, typeofdatasource, e.model, $element);
                    var autocomplete = $element.data("kendoAutoComplete");
                    autocomplete.setDataSource(ds);
                }
            }
            else if (type == "business_object_selector") {
                var $bOSelector;
                if (cascadefrom) {
                    $element.attr("data-cascade-from", cascadefrom);
                    $element.on("cascade", function () {
                        setTimeout(function () {
                            $bOSelector.bOSelector('setEntity', { entityName: e.sender.options.gridcode, refValueId: e.model[cascadefrom], fieldName: k });
                            $bOSelector.bOSelector('refreshGridSelector');
                            $bOSelector.bOSelector("removeAll");
                        });
                    });
                }
                $bOSelector = $element.find("div");
                $bOSelector.bOSelector({
                    tags: rowModel[k] ? JSON.parse(rowModel[k]) : [],
                    entityInfo: { entityName: e.sender.options.gridcode, refValueId: rowModel[cascadefrom], popUpfieldName__: k },
                    multiselect: true,
                    onChange: function () {
                        e.model[k] = JSON.stringify($bOSelector.bOSelector("getBOs"));
                        e.model[k].dirty = true;
                    }
                });
                var $parent = $element.parent();
                $parent.attr("class", $parent.attr("class").replace(/(col-\w+)-\d+/g, "$1-12"));
            }
        }
    });

    setEditContext(gridn, e);
    if (typeof callback == "function" && callback)
        callback(selectDatabounds);
    return selectDatabounds;
}
function doremoveFields(result, tabjqcontainer, currentlayerid, model, restrictedtabs, noneditabletabs) {
    if (!currentlayerid && !window.ApplicationLayerId) // se non c'e' il layer elimino tutti gli elementi che hanno l' attributo MagicBOLayer_ID
        tabjqcontainer.find("[magicbolayer_id]").closest("div[class*=col-]").remove();
    else //elimino solo i controlli che hanno l' attributo ma con un valore diverso da currentlayerid
        tabjqcontainer.find("[magicbolayer_id]").each(function (i, v) {
            var l = parseInt($(this).attr("magicbolayer_id"));
            if (result.indexOf(l) == -1 && l != window.ApplicationLayerId) //se il layer non e' quello applicativo o quello relativo al dato rimuovo il campo
                $(this).closest("div[class*=col-]").remove();
        });

    var tabstriptoinspect = $(tabjqcontainer).find(".k-tabstrip").data("kendoTabStrip");
    if (tabstriptoinspect !== undefined) {
        $.each(tabstriptoinspect.items(), inspectTabsToRemove(tabstriptoinspect, model, restrictedtabs, noneditabletabs));
        tabstriptoinspect.remove("li.k-state-disabled");
        tabstriptoinspect.select("li:first");
    }
}
function removeTabsByLayer(e, currentlayerid) {
    var tabjqcontainer = e.container;
    var model = e.model;
    var removalpromise = new $.Deferred();
    var layerlistname = "layerlist" + currentlayerid
    if (!window[layerlistname])
        window[layerlistname] = [];
    //solo se in questa window non ho ancora caricato il layerlist per il layer current
    var defer = $.Deferred();
    if (!window[layerlistname].length && currentlayerid) {
        $.ajax({
            url: "/api/Magic_Grids/GetLayerList/" + currentlayerid,
            contentType: "application/json;charset=utf-8",
            // async: false,
            success: function (result) {
                window["layerlist" + currentlayerid] = result;
                defer.resolve(result);
            },
            error: function (e) {
                defer.reject();
                console.log("Error in layer tree loading method GetLayerList, controller Magic_Grids, layer:" + currentlayerid.toString());
            }
        });
    }
    else
        defer.resolve(window[layerlistname]);
    //tab restrictions from DB ... refTree
    var tabFilterReady = $.Deferred();
    if (window.detailinitTabFilter && typeof getStandard_GetTabRestrictions == 'function') {
        tabFilterReady = window.getStandard_GetTabRestrictions({ ...e, fromForm: true });
    }
    else
        tabFilterReady.resolve([]);
    //rimuovo
    $.when(defer, tabFilterReady).then(function (result, tabFilter) {
        var restrictedtabs = [];
        var noneditabletabs = [];
        if (tabFilter.items) {
            let ritems = tabFilterReader(tabFilter.items);
            restrictedtabs = ritems.restrictedtabs;
            noneditabletabs = ritems.noneditabletabs;
        }
        doremoveFields(result, tabjqcontainer, currentlayerid, model, restrictedtabs, noneditabletabs);
        removalpromise.resolve();
    });
    return removalpromise.promise();
}
//#region toremove
function manageDetailGridCounters() {
    for (var i = 0; i < $("input[id$='binder']").length; i++) {
        var gridname = $("input[id$='binder']")[i].id.substring(0, $("input[id$='binder']")[i].id.length - 7);
        if ($("input[id$='binder']")[i].attributes.filter !== undefined) {
            var filter = $("input[id$='binder']")[i].attributes.filter.value;
            if (filter !== undefined) {
                var gridobj = getrootgrid(gridname);
                filtersolver(filter, gridobj);
                gridobj.dataSource.change = function (e) {
                    if (e.sender._total === 0)
                        hideDetailGrid(this.options.gridname);
                    $($("input[id$='binder']")[(this.options.indexofcounter)]).val("(" + e.sender._total + ")");
                };
                gridobj.dataSource.indexofcounter = i;
                gridobj.dataSource.gridname = gridname;
                var ds = new kendo.data.DataSource(gridobj.dataSource);
                ds.read();
            }
        }
    }

}

function hideDetailGridWithTest() {
    for (var i = 0; i < $("input[id$='binder']").length; i++)
        if ($($("input[id$='binder']")[i]).val() == "(0)") {
            var gridname = $("input[id$='binder']")[i].id.substring(0, $("input[id$='binder']")[i].id.length - 7);
            $("#" + gridname + "_labfield").hide();
            $("#" + gridname + "_edfield").hide();
        }
}

function hideDetailGrid(gridname) {
    $("#" + gridname + "_labfield").hide();
    $("#" + gridname + "_edfield").hide();
}
//#endregion
//#endregion
//#region NAVIGATIONMANAGEMENT

function getUsersGridRights() {
    if (sessionStorage.ApplicationAreaProfileSettingsType === "COMPONENTS")
        return { grids: JSON.parse(sessionStorage.VisibleGridAndRights), userCanAccess: true };
    return { grids: JSON.parse(sessionStorage.GridRightsExceptions), userCanAccess: false };
}

function getGridSessionStorageRights(gridname, profilationtype) {
    var gridId = getGridIdFromGridInfo(gridname);
    if (profilationtype === "COMPONENTS") {
        if (window.UserIsDeveloper == "True")
            return { usercanexport: true, usercanexecute: true, usercandelete: true, usercanupdate: true, usercaninsert: true };
        var gridrights = JSON.parse(sessionStorage.VisibleGridAndRights);
        for (var i = 0; i < gridrights.length; i++)
            if (gridrights[i].GridGUID === gridId)
                return { usercanexport: gridrights[i].export, usercanexecute: gridrights[i].exec, usercandelete: gridrights[i].delete, usercanupdate: gridrights[i].update, usercaninsert: gridrights[i].insert };
        return { usercanexport: false, usercanexecute: false, usercandelete: false, usercanupdate: false };
    }
    else if (profilationtype === "MENU") {
        var gridexcptnrights = JSON.parse(sessionStorage.GridRightsExceptions);
        for (var i = 0; i < gridexcptnrights.length; i++)
            if (gridexcptnrights[i].GridGUID === gridId)
                return { usercanexport: gridexcptnrights[i].export, usercanexecute: gridexcptnrights[i].exec, usercandelete: gridexcptnrights[i].delete, usercanupdate: gridexcptnrights[i].update, usercaninsert: gridexcptnrights[i].insert };
        return { usercanexport: window.usercanexport, usercanexecute: window.usercanexecute, usercandelete: window.usercandelete, usercanupdate: window.usercanupdate, usercaninsert: window.usercanupdate };
    }
}

function getProfileSettingsType(gridname) {
    if (gridname === "Magic_Grid" || gridname === "Magic_Columns"
        || gridname === "Magic_Columns_Base" || gridname === "v_Magic_Grid_NavigationTabs"
        || gridname === "Magic_GridsCommands" || gridname === "Magic_TemplateDetails" || gridname === "Magic_ColumnsFunctionOverrides")
        return "MENU";

    //the dashboard default profilationType if not defined by window variable dashboardRightsLogic is MENU
    if (window.location.pathname.indexOf("dashboard")) {
        profilationtype = window.dashboardRightsLogic || "MENU";
        return profilationtype;
    }

    return (sessionStorage.ApplicationAreaProfileSettingsType == undefined ? "MENU" : sessionStorage.ApplicationAreaProfileSettingsType);
}

function getGridRights(gridname) {
    return getGridSessionStorageRights(gridname, getProfileSettingsType(gridname));
}

function checkIfGridIsInSessionStorage(gridname, profilationtype) {
    var gridId = getGridIdFromGridInfo(gridname);
    var visible = false;
    if (profilationtype === "COMPONENTS") { //si ragiona per regola (RefTree)
        if (window.UserIsDeveloper == "True") //se l' utente e' sviluppatore vede tutto
            return true;
        var gridrights = JSON.parse(sessionStorage.VisibleGridAndRights);
        for (var i = 0; i < gridrights.length; i++)
            if (gridrights[i].GridGUID === gridId)
                return true;
    }
    if (profilationtype === "MENU") //si ragiona per eccezione (MagicFramework standard)
    {
        var gridrights = JSON.parse(sessionStorage.GridRightsExceptions);
        for (var i = 0; i < gridrights.length; i++)
            if (gridrights[i].GridGUID === gridId && gridrights[i].visible !== true)
                return false;
        return true;
    }
    return false;
}

function checkGridVisibility(gridname) {
    var profilationtype = getProfileSettingsType(gridname);
    return checkIfGridIsInSessionStorage(gridname, profilationtype);
}

window.rightsQueue = [];
function isGridVisiblePromise(gridName) {
    var deferred = $.Deferred();
    var checkRights = function () {
        if (checkGridVisibility(gridName))
            deferred.resolve();
        else
            deferred.reject();
    };
    if (isRightsLoadComplete())
        checkRights();
    else
        window.rightsQueue.push(checkRights);
    return deferred;
}

function isRightsLoadComplete() {
    return sessionStorage.rightsLoadedTimestamp == window.LoginTimestamp;
}
function tabHasToBeRemoved(rowdata, item) {
    var applayerid = window.ApplicationLayerId ? window.ApplicationLayerId.toString() : "-1";
    var bolayerid = rowdata && rowdata.MagicBOLayerID ? rowdata.MagicBOLayerID.toString() : "-1";
    var $item = $(item);
    if ($item.attr("data-tab-layer")) { //if the attribute has not been set it means that no restrictions are active
        var tabLayers = $(item).data("tab-layer"); //list of the layers that can access the tab
        tabLayers = (typeof tabLayers == "number") ? [tabLayers.toString()] : (typeof tabLayers == "string" ? tabLayers.split(",") : []);
        //restrizioni per il tab a livello di layer di dato o di applicazione
        if (tabLayers && tabLayers.length && tabLayers.indexOf(applayerid) == -1 && (rowdata && tabLayers.indexOf(bolayerid) == -1)) {
            $item.attr("toberemoved", true);
            return true;
        }
    }
    return false;
}
function tabIsRestricted(restrictedtabs, objectName) {
    if (restrictedtabs && restrictedtabs.indexOf(objectName) != -1)
        return true;
    return false;
}
function tabContentOrTabHasToBeRemoved(contentObject, isvisible, restrictedtabs, item) {
    var $item = $(item);
    if ($item.attr("toberemoved")) return true;
    if (!isvisible || (restrictedtabs && restrictedtabs.indexOf(contentObject.objectName) != -1)) {
        $item.attr("toberemoved", true);
        return true;
    }
    return false;
}
function tabContentIsNotEditable(contentObject, noneditabletabs, item) {
    var $item = $(item);
    if ($item.attr("noneditable")) return true;
    if (noneditabletabs && noneditabletabs.indexOf(contentObject.objectName) != -1) {
        $item.attr("noneditable", true);
        return true;
    }
    return false;
}

function tabFilterReader(tabs) {
    var tabRestrictions = {
        restrictedtabs: [],
        noneditabletabs: []
    };
    tabRestrictions.restrictedtabs = $.map(tabs, function (v, i) {
        if (!v.show)
            return v.gridname;
        else
            return;
    });
    tabRestrictions.noneditabletabs = $.map(tabs, function (v, i) {
        if (v.show && v.editable == false)
            return v.gridname;
        else
            return;
    });
    return tabRestrictions;
}

function getStandardDetailInit(e, functionname, functionid, itemsPerRow) {

    window.detailfunctionname = null; // ad ogni inizializzazione ripulisco la variabile usata nel render di griglie figlie nella funzione (function ontabactivation)
    //se c'e' il tabstrip lo renderizzo
    var $tabStrip = e.detailRow.find(".tabstrip").kendoTabStrip({
        animation: {
            open: { effects: "fadeIn" }
        }
    });
    var tabStrip = $tabStrip.data("kendoTabStrip");
    //check di restrizioni nella visibilita' delle griglie dovute ad associazioni "business". La definizione di getStandard_GetTabRestrictions 
    //e' da effettuare (se necessaria) in AdminAreaCustomizations.js della specifica soluzione
    var tabFilterReady = $.Deferred();
    if (window.detailinitTabFilter && typeof getStandard_GetTabRestrictions == 'function') {
        tabFilterReady = window.getStandard_GetTabRestrictions(e);
    }
    else
        tabFilterReady.resolve([]);
    var the1stTab = false;
    $.when(tabFilterReady).then(function (tabFilter) {
        var restrictedtabs = [];
        var noneditabletabs = [];
        if (tabFilter.items) {
            let ritems = tabFilterReader(tabFilter.items);
            restrictedtabs = ritems.restrictedtabs;
            noneditabletabs = ritems.noneditabletabs;
        }
        // render dei form template 
        tabStrip.deactivateTab(tabStrip.items());
        $.each(tabStrip.items(), function (i, item) {
            var contentObject = $(item).data("contentObject");
            if (!tabHasToBeRemoved(e.data, item) && contentObject) {
                if (!the1stTab && !$(item).attr("data-tab-id") && !(tabIsRestricted(restrictedtabs, contentObject.objectName))) {
                    the1stTab = true;
                    $(item).attr("tobeactivated", true);
                }
                if (contentObject.contentType == "ANGULARCONTROLLER") {
                    if (contentObject.templateToAppendName && typeof contentObject.templateToAppendName == 'string' && contentObject.templateToAppendName.trimStart()[0] == "{") {
                        var $tabContent = $(tabStrip.contentElement(i));
                        if (!$tabContent.find("div[ng-controller]").length) {
                            var controllerData = JSON.parse(contentObject.templateToAppendName);
                            controllerData = $.extend({
                                tabHeaderElement: item,
                                tabContentElement: tabStrip.contentElement(i),
                                itemsPerRow: itemsPerRow ? parseInt(itemsPerRow) : 1,
                                data: e.data,
                                evt: e
                            }, controllerData);
                            $tabContent.html(getAngularControllerElement(controllerData.angularControllerName, controllerData));
                        }
                    }
                }
                else if (contentObject.contentType && contentObject.contentType.indexOf("GRID") != -1) { //griglia standard su tab di navigazione
                    addGridInfo({ MagicGridName: contentObject.objectName, GUID: contentObject.gridGUID });
                    var isvisible = checkGridVisibility(contentObject.objectName);
                    if (noneditabletabs.indexOf(contentObject.objectName) != -1)
                        $(item).attr("noneditable", true);
                    if (!tabContentOrTabHasToBeRemoved(contentObject, isvisible, restrictedtabs, item))
                        getrootgrid(contentObject.objectName, functionname, contentObject.objectName, functionid, undefined, true, contentObject.bindedGridFilter, e, contentObject.bindedGridHideFilterCol, contentObject.groupClass || contentObject.objectName, undefined, $(item), contentObject.bindedGridRelType_ID);
                }
                else {
                    if (contentObject.templateToAppendName && contentObject.MagicTemplateGroupDOMID) {
                        var extdscall = null;
                        var extdsvalue = null;
                        if (contentObject.bindedGridFilter) {
                            extdsvalue = e.data[contentObject.bindedGridFilter];
                            extdscall = "Get/" + extdsvalue;
                        }
                        renderpartialdetail(contentObject.extds, null, extdscall, null, null, contentObject.MagicTemplateGroupDOMID, contentObject.templateToAppendName, extdsvalue, e);
                    }
                }
            }
        });
        tabStrip.remove($("li[toberemoved]"));
        bindDetailTabActivation(tabStrip, ontabactivation);

        //if i have tabs but not of them has the tobeactivated. This happens when the user does not access rights on the 1st tab's content
        if (!tabStrip.element.find("li[tobeactivated]").length && tabStrip.element.find("li:first").length)
            tabStrip.element.find("li:first").attr("tobeactivated", true);

        if (tabStrip.element.find("li[tobeactivated]").length)
            tabStrip.activateTab(tabStrip.element.find("li[tobeactivated]"));
    });

    //tabstrip resizing
    var elements = {
        detailCell: e.detailCell,
        detailTabstrip: $tabStrip,
        parentHeader: $('> .k-grid-header', e.sender.element),
        parentContent: $('> .k-grid-content > table', e.sender.element)
    };

    //set max width of detailTemplate if is not a touch device
    if (!('ontouchstart' in window)) {
        $(window).resize(function () {
            setDetailGridSizes(elements);
        });
        setDetailGridSizes(elements);
    }
}


function setDetailGridSizes(elements) {
    var diff = elements.parentContent.width() - elements.parentHeader.width();
    elements.detailTabstrip.width(diff > 0 ? elements.detailCell.width() - diff : 'auto');
}


//garantisce univocita' attivaz.
function bindDetailTabActivation(tabstrip, ontabactivation) {
    tabstrip.unbind("activate");
    tabstrip.bind("activate", ontabactivation);

}

function renderpartialdetail(controllername, orderbyfield, controllerfunction, orderdir, parstring, domtoappend, templatetorender, filterfieldvalue, e) {


    controllerfunction = (typeof controllerfunction === "undefined") ? "GetAll" : controllerfunction;


    if (controllername != null && controllername != "") {
        var type = (controllerfunction.substring(0, 3) === "Get") ? "GET" : "POST";
        var ds = new kendo.data.DataSource({
            transport: {
                read: {
                    type: type,
                    async: true,
                    serverFiltering: false,
                    url: "/api/" + controllername + "/" + controllerfunction,
                    contentType: "application/json"


                },
                parameterMap: function (options, operation) {
                    return kendo.stringify(options);
                }

            },
            change: function (data) {
                //var rowIndex = e.masterRow[0].rowIndex;
                var rowuid = e.masterRow[0].dataset.uid;
                if ($("#" + domtoappend) != null && $("#" + domtoappend) != undefined) {
                    var javascriptTemplate = kendo.template($("#" + templatetorender).html());
                    if (filterfieldvalue != 0 && filterfieldvalue != null) {
                        var selector = "." + domtoappend;
                        //   if ($("." + domtoappend + ".k-content").length > 0)
                        //       selector = selector + ".k-content";
                        for (var j = 0; j < $(selector).length; j++) {
                            //var tabrowindex = $($($($(selector)[j].parentElement)[0].parentElement)[0].parentElement)[0].previousSibling.rowIndex;
                            var tabrowuid = $(selector).closest("tr")[j].previousSibling.dataset.uid;
                            // if (tabrowindex == rowIndex) {
                            if (tabrowuid == rowuid) {
                                try {
                                    var templ = javascriptTemplate({ e: data.items[0], domidtohook: $(selector)[j] });
                                }
                                catch (e) {
                                    var templ = javascriptTemplate(data.items[0]);
                                }
                                if (($("#" + templatetorender).attr("nohtml") == undefined) && ($("#" + templatetorender).attr("nohtml") != "true"))
                                    $($(selector)[j]).html(templ);
                            }
                        }
                    }
                }
            },
            sort: { field: orderbyfield, dir: orderdir == null ? "asc" : orderdir }
        });
        if (type == "GET")
            ds.read();
        else
            ds.read(parstring);
        return ds.view();
    }
    else {
        var javascriptTemplate = kendo.template($("#" + templatetorender).html());
        // var rowIndex = e.masterRow[0].rowIndex;
        var rowuid = e.masterRow[0].dataset.uid;
        for (var j = 0; j < $("." + domtoappend).length; j++) {
            //var tabrowindex = $("." + domtoappend).closest("tr")[j].previousSibling.rowIndex;
            var tabrowuid = $("." + domtoappend).closest("tr")[j].previousSibling.dataset.uid;

            var templ = null;
            //if (tabrowindex == rowIndex) {
            if (tabrowuid == rowuid) {
                //
                //   $($("." + domtoappend + ".k-content")[j]).html(

                templ = javascriptTemplate({ e: e.data, domidtohook: $("." + domtoappend)[j] });
                if (($("#" + templatetorender).attr("nohtml") == undefined) && ($("#" + templatetorender).attr("nohtml") != "true"))
                    $($("#" + domtoappend)[j]).html(templ);
            }

        }

    }
    return;
}

function gettemplateforlayer(templateid, layerid) {
    var htmltemplate = null;
    if (templateid !== null && templateid !== "" && layerid != null) {
        var detailtemplates;
        $.ajax({
            type: "POST",
            async: false,
            url: manageAsyncCallsUrl(false, "/api/Magic_Templates/GetTemplateByID/"),// "/api/Magic_Templates/GetTemplateByID/",
            data: JSON.stringify({ templateid: templateid, layerid: layerid }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) { detailtemplates = data; }
        });
        htmltemplate = $.parseHTML(detailtemplates);
        var idtoinsert = htmltemplate[0].attributes.id.value + '_' + layerid.toString();
        if ($("." + idtoinsert).length == 0)
            $("#templatecontainer").append($.parseHTML(detailtemplates));
        return idtoinsert;
    }

}
//#endregion
//#region searchgrid
function getsearchgridvalueinpopup(controllername, orderbyfield, controllerfunction, dstargetdomid, initialvalue, valuefield, schema, typeofdatasource, callback, container, isMulti) {
    var datapost = {};
    var serverfilter = false;
    typeofdatasource = solvetypeofdatasource(typeofdatasource);

    if (initialvalue) {
        //limito la chiamata all' id corrente
        if (!isMulti)
            var filter = { logic: "AND", filters: [{ field: valuefield, operator: "eq", value: initialvalue }] };
        else {
            var filter = {
                logic: "OR",
                filters: (!Array.isArray(initialvalue) ? initialvalue
                    .split(',')
                    .filter(v => !!v) : initialvalue)
                    .map(value => ({
                        field: valuefield,
                        operator: "eq",
                        value
                    }))
            };
        }
    }

    controllerfunction = (typeof controllerfunction === "undefined" || controllerfunction == null) ? "GetAll" : controllerfunction;
    var urlvalue = "/api/" + controllername + "/" + controllerfunction; // caso in cui la chiamata sia fatta a mano con initial value popolato senza specificare il typeofdatasource (retrocompatibile con MagicBroker custom funcs)
    var typemethod = "GET";
    //typeofdatasource :  1= stored , 2= table or view (default) , 3 = controller
    if (typeofdatasource === 2) {
        if (!initialvalue) {
            if (dstargetdomid)
                $("#" + dstargetdomid, container).val("");
            if (callback)
                callback("");
            return;
        }
        var schemaMatch = controllername.match(/^(\w+)\.(\w+)$/);
        if (schemaMatch) {
            if (schema == schemaMatch[1])
                controllername = schemaMatch[2];
            else if (!schema) {
                schema = schemaMatch[1];
                controllername = schemaMatch[2];
            }
        }
        urlvalue = "/api/ManageFK/GetDropdownValues";
        typemethod = "POST";
        datapost = { tablename: controllername, valuefield: valuefield, textfield: orderbyfield, schema: schema, filter: filter };
        serverfilter = true;
    }
    else if (typeofdatasource === 1) {
        urlvalue = "/api/ManageFK/CallFKStoredProcedure";
        typemethod = "POST";
        datapost = { storedprocedurename: controllername, valuefield: valuefield, textfield: orderbyfield, schema: schema };
    }
    else if (typeofdatasource === 3 && controllername.startsWith("base64")) {
        var callInfo = parseWebAPIBase64String(controllername);
        urlvalue = '/api/' + callInfo[1];
        typemethod = callInfo[0];
        serverfilter = true;
        datapost = { tablename: callInfo[2], valuefield: valuefield, textfield: orderbyfield, schema: schema, filter: filter, EntityName: schema + '.' + callInfo[2], take: 1 };
    }

    var dsOptions = {
        transport: {
            read: {
                url: urlvalue,
                serverFiltering: serverfilter,
                data: datapost,
                contentType: "application/json; charset=utf-8",
                type: typemethod,
                dataType: "json"
            },
            parameterMap: function (options, operation) {
                return kendo.stringify(options);
            }
        },
        sort: { field: orderbyfield, dir: "asc" },
        change: function (data) {
            if (data.items.length > 0 && initialvalue !== null) {
                var values = [];
                $.each(data.items, function (index, val) {
                    if (!isMulti && val.value == initialvalue) {
                        if (dstargetdomid)
                            $("#" + dstargetdomid, container)
                                .val(val.text)
                                .trigger("searchGridChange", [val.value])
                                .parent()
                                .addClass("has-value");
                        if (callback)
                            callback(val.text);
                    } else if (isMulti && (Array.isArray(initialvalue) ? initialvalue : initialvalue.split(',')).find(v => v == val.value)) {
                        if (dstargetdomid) {
                            $("#" + dstargetdomid, container)
                                .next()
                                .append(`<span class="tag label label-info" data-id="${val.value}">${val.text}</span>`)
                                .parent()
                                .addClass("has-value");
                        } else {
                            values.push({ value: val.value, text: val.text });
                        }
                    }
                });
                if (isMulti && callback)
                    callback(values);
            }
        }
    };
    if (controllername.startsWith('base64')) {
        dsOptions.schema = {
            data: function (response) {
                response.valuefield = valuefield;
                response.textfield = orderbyfield;
                return manageDBFKAddValueText(response);
            }
        }
    }
    var ds = new kendo.data.DataSource(dsOptions);
    ds.read();
    return ds.view();
}
function buildsearchGridFilter(gridobj, cascadeFromColumn, cascadeFilterColumn, operator, model) {

    var maingridmodel = model || getCurrentModelInEdit();
    var value = maingridmodel.get(cascadeFromColumn);
    if (value === null || value === '')
        return;

    if (cascadeFromColumn != gridobj.dataSource.schema.model.id && gridobj.dataSource.schema.model.fields[cascadeFilterColumn]) {
        gridobj.dataSource.schema.model.fields[cascadeFilterColumn].defaultValue = value;
    }
    if (gridobj.dataSource.filter == null)
        gridobj.dataSource.filter = { field: cascadeFilterColumn, operator: operator, value: value, type: "cascadeSearch" };
    else
        gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, { field: cascadeFilterColumn, operator: operator, value: value, type: "cascadeSearch" });

}
//method called on searchgrid label click in order to show the current value in the search grid (for editing purposes)
//this feature is enabled only if window.searchGridCurrentValue == true;
function selectCurrentItemFromResearchGrid(searchgridname, editfield, textfield, e) {
    var $e = $(e);
    var $windowCloseButton = $e.closest(".k-window").find(".k-window-actions");
    var $titlebar = $windowCloseButton.parent();

    var $container = $e.closest("div.k-popup-edit-form");
    var dsineditAll = $container.data('gridDS').data();
    var mainrecordUid = $container.data('gridDSElementInEditUID');
    var dsinedit = null;
    $.each(dsineditAll, function (i, v) {
        if (v.uid == mainrecordUid)
            dsinedit = v;
    });

    if (!dsinedit)
        return;

    $windowCloseButton.hide().addClass("hidden-actions-by-searchgrid");
    $titlebar.append($('<div id="close-researchgrid" class="k-window-actions"><a href="javascript:void(0);" class="k-window-action k-link"><span style="background-position: -32px -16px" class="k-icon">Close</span></a></div>').click(function (e) {
        closesearchgrid($e.closest(".k-window").find(".k-grid .k-grid-toolbar")[0]);
    }));

    if (e !== undefined) {
        var tabStrip = $e.closest(".k-tabstrip").data("kendoTabStrip"); //tabstrip corrente
        tabStrip.select();
        tabStrip.disable(tabStrip.tabGroup.children().not(".k-state-active"));
    }
    var gridobj = getrootgrid(searchgridname, null, searchgridname + "_searchgrid");
    //if the grid is incell editable or inline the toolbar should have the "save" button. Otherwise set it to empty []
    if (gridobj.editable && (gridobj.editable === true || (gridobj.editable.mode == "incell" || gridobj.editable.mode == "inline")))
        gridobj.toolbar = [{ name: "save", text: getObjectText("save") }];
    else
        gridobj.toolbar = [];
    //the record cannot be removed
    $.each(gridobj.columns, function (i, v) {
        var n = null;
        if (v.command) {
            $.each(v.command, function (j, o) {
                if (o.name == "destroy")
                    n = j;
            });
            if (n != null) {
                v.command.splice(n);
            }
        }

    });

    if (gridobj.dataSource.schema.model.id)
        gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, { field: gridobj.dataSource.schema.model.id, operator: 'eq', value: dsinedit[editfield] });
    else
        console.log("WARN: PK not set in searchgrid with selectValue");

    $container.find("div.k-edit-form-container").addClass("search-grid-opened");
    expandPopUpwindow($container);
    //vado a cercare il container div di griglia e input e reperisco il Jquery della griglia
    var gridref = $e.closest('.k-edit-label').siblings("#" + searchgridname + "_searchgrid");
    gridref.show();
    gridref.kendoGrid(gridobj);
    bindRemoveListenerToGrid(gridref.data("kendoGrid"));
    gridref.data("kendoGrid").one("dataBound", function (e) {
        $e.closest(".k-window-content").data("kendoWindow").center();
    });
    gridref.attr("referencetextfield", textfield);
    gridref.attr("referencefield", editfield);
    gridref.attr("editablecolumnnumber", gridobj.editablecolumnnumber);
    gridref.attr("editableName", gridobj.editableName);
    gridref.attr("gridName", searchgridname);
    $titlebar.find('#close-researchgrid a').bind("click", function () {
        var ksearchgridDS = $(gridref).data("kendoGrid").dataSource;
        var data;
        $.each(ksearchgridDS.data(), function (i, v) {
            data = v;
        });
        if (data && data[textfield])
            $container.find("input#" + editfield + "_binder").val(data[textfield]);
    });
}
function selectItemFromResearchgrid(searchgridname, editfield, textfield, cascadeFromColumn, cascadeFilterColumn, operator, pagesize, e, selectValue, isInline, isMulti = false) {
    var $e = $(e);

    //give parent class k-state-disabled to disable input
    if (!selectValue && !isInline && e !== undefined && $e.parent().hasClass('k-state-disabled'))
        return false;

    var $windowCloseButton = $e.closest(".k-window").find(".k-window-actions");
    var $titlebar = $windowCloseButton.parent();
    if (!selectValue && !isInline) {
        $windowCloseButton.hide().addClass("hidden-actions-by-searchgrid");
        $titlebar.append($('<div id="close-researchgrid" class="k-window-actions"><a href="javascript:void(0);" class="k-window-action k-link"><span style="background-position: -32px -16px" class="k-icon">Close</span></a></div>').click(function (e) {
            closesearchgrid($e.closest(".k-window").find(".k-grid .k-grid-toolbar")[0]);
        }));

        if (e !== undefined) {
            var tabStrip = $e.closest(".k-tabstrip").data("kendoTabStrip"); //tabstrip corrente
            tabStrip.select();
            tabStrip.disable(tabStrip.tabGroup.children().not(".k-state-active"));
        }
    }
    var iscascadesearch = function (cascadeFromColumn, cascadeFilterColumn, operator) {
        return (cascadeFromColumn && cascadeFromColumn !== 'null' && cascadeFilterColumn && cascadeFilterColumn != 'null' && operator && operator !== 'null') ? true : false;
    };
    var gridobj = getrootgrid(searchgridname, null, searchgridname + "_searchgrid", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, iscascadesearch(cascadeFromColumn, cascadeFilterColumn, operator));
    //aggiungo al TAG P della chiamata i valori del form corrente

    var rowData;

    if (isInline) {
        var kendoGrid = $e.closest(".k-grid").data("kendoGrid"),
            uid = $e.closest("tr").attr("data-uid");
        rowData = kendoGrid.dataSource.getByUid(uid);
    }

    var origparmap = gridobj.dataSource.transport.parameterMap;
    gridobj.dataSource.transport.parameterMap = function (options, operation) {
        var opts = origparmap.call(this, options, operation);
        var optsobj = JSON.parse(opts);
        let rd = rowData || getCurrentModelInEdit();

        Object.assign(rd, { __editField__: editfield });
        
        optsobj.data = JSON.stringify(rd);
        return kendo.stringify(optsobj);
    }
    //prendo il numero di colonne del Form che ha lanciato la search
    //var buttonclass = "backsearchgrid";

    gridobj.groupable = false;

    //set a default value only if the paging is null or undefined (0 is an accepted value)
    //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/283
    if (!gridobj.dataSource.pageSize
        && gridobj.dataSource.pageSize != 0)
        gridobj.dataSource.pageSize = pagesize || 5;

    gridobj.selectable = false;
    //gridobj.pageable = {
    //    buttonCount: gridobj.dataSource.pageSize
    //};
    gridobj.pageable = getDefaultGridSettings().pageable;
    //tolgo gli action button e aggiungo l' attributo css "modifications" ai bottoni di edit in modo da poter capire se l' utente ha selezionato la row o 
    //schiacciato un bottone
    for (var i = 0; i < gridobj.columns.length; i++) {
        if (gridobj.columns[i].command !== undefined) {
            for (var h = 0; h < gridobj.columns[i].command.length; h++) {
                if (gridobj.columns[i].command[h].name === "edit" || gridobj.columns[i].command[h].name == "destroy") {
                    gridobj.columns[i].command[h].attributes = { "class": "modifications" };
                } else {
                    gridobj.columns[i].command.splice(h, 1);
                }
            }
            gridobj.columns[i].width = 83;
        }
    }
    var searchgridSelector = '#' + searchgridname + '_searchgrid.k-grid';
    if (!isMulti) {
        gridobj.columns.unshift({ template: "<input style='width:50px;' type='checkbox' class='checkbox searchgrid' onclick='onSearchGridCheckRow(this);' />", width: "64px", locked: gridobj.columns[0].locked || false });
    } else {
        gridobj.columns.unshift({
            template: (data) => "<input style='width:50px;' type='checkbox' class='checkbox searchgrid' onchange='onMultiSearchGridCheckRow(this, \"" + data.id + "\", \"" + data[textfield] + "\");'" + ((gridref.data('currentSearchgridValue') || []).find(v => v.id == data.id) ? ' checked=\"checked\"' : '') + " />",
            width: "64px",
            locked: gridobj.columns[0].locked || false
        });
    }
    //tolgo la navigabilita'gridobj.columns[i].
    gridobj.detailTemplate = null;
    gridobj.detailTemplateName = null;
    gridobj.detailInit = null;
    //Aggiunge una condizione alla select della griglia sulla base del valore di un altro campo.
    if (iscascadesearch(cascadeFromColumn, cascadeFilterColumn, operator))
        buildsearchGridFilter(gridobj, cascadeFromColumn, cascadeFilterColumn, operator, isInline ? $e.siblings("input").data("columnData").model : (getModelAndContainerFromKendoPopUp(e) ? getModelAndContainerFromKendoPopUp(e).model : null));
    else
        console.log("WARN: cascade data in search grid are incomplete: cascadeFromColumn = " + cascadeFromColumn + ' cascadeFilterColumn = ' + cascadeFilterColumn + ' operator = ' + operator);

    if (selectValue) {
        if (gridobj.dataSource.schema.model.id)
            gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, { field: gridobj.dataSource.schema.model.id, operator: 'eq', value: selectValue });
        else
            console.log("WARN: PK not set in searchgrid with selectValue");
    }
    else if (!isInline) {
        var $container = $e.closest("div.k-edit-form-container");
        $container.addClass("search-grid-opened");
        expandPopUpwindow($container);
    }
    var gridref;
    if (isInline) {//incell...
        gridref = $('<div id="' + searchgridname + '-searchgrid-window" class="k-popup-edit-form searchgrid-window">');
        $("#grid").append(gridref);
        var window = gridref.kendoWindow({
            // width:800,
            close: function () {
                window.destroy();
                gridref.remove();
            }
        }).data("kendoWindow");
        var parentGrid = $e.closest(".k-grid").data("kendoGrid");
        gridref.data("parentGrid", parentGrid);
        gridref.data("gridDS", parentGrid.dataSource);
        gridref.data("gridDSElementInEditID", $e.siblings("input").data("columnData").model[parentGrid.dataSource.options.schema.model.id]);
        gridref.data("gridDSElementInEditUID", parentGrid.dataItem($(e).closest("tr")).uid);
        gridref.data("cellInEdit", parentGrid.current());//cell in edit
    }
    else {
        //vado a cercare il container div di griglia e input e reperisco il Jquery della griglia
        gridref = $e.closest('.k-edit-field').siblings("#" + searchgridname + "_searchgrid");
    }
    if (!selectValue) {
        gridref.show();
    } else {
        gridref.hide();
        gridobj.dataBound = function (e) {
            e.sender.tbody.find("[data-uid]").first().find('td input.checkbox.searchgrid').trigger('click');
        }
    }

    var apiCallDataObj = !isInline ? $e.closest('.k-popup-edit-form').data('kendoEditable').options.model : $e.closest('.k-grid').data('kendoGrid').options
    gridobj.getApiCallData = function () {
        return apiCallDataObj.__apiCallData;
    };
    if (gridobj.startEmpty) {
        gridobj.autoBind = false;
    }
    gridref.kendoGrid(gridobj);
    if (isMulti) {
        if (isInline) {
            var model = $e
                .closest(".k-grid")
                .data('kendoGrid')
                .dataItem($e.closest("tr"))
        } else {
            var { gridDS, gridDSElementInEditUID } = $e.closest("div.k-popup-edit-form").data();
            var model = gridDS.data().find(row => row.uid === gridDSElementInEditUID);
        }
        var currentValue = (model[editfield] || "")
            .split(',')
            .filter(v => v)
            .map(id => ({id}));
        gridref
            .data('currentSearchgridValue', currentValue)
            .append('<button onclick="onSearchGridCheckRow(this, true)" class="k-button k-button-icontext k-primary k-grid-update pull-right" style="margin-top: 10px;"><span class="k-icon k-update"></span>OK</button>');
    }
    if (isInline)
        gridref.data("kendoWindow").center().open();

    if (!selectValue && !isInline) {
        gridref.data("kendoGrid").one("dataBound", function (e) {
            $e.closest(".k-window-content").data("kendoWindow").center();
        });
    }

    Object.defineProperty(gridref.data('kendoGrid').options, '__apiCallData', {
        get: gridobj.getApiCallData
    });

    checkAndInitializeFastSearch(gridref);
    bindRemoveListenerToGrid(gridref.data("kendoGrid"));
    gridref.attr("referencefield", editfield);
    gridref.attr("referenceTextfield", textfield);
    gridref.attr("editablecolumnnumber", gridobj.editablecolumnnumber);
    gridref.attr("editableName", gridobj.editableName);
    if (gridobj?.gridcode && gridobj.gridcode != searchgridname) {
        gridref.attr("gridName", gridobj.gridcode);

    } else {
        gridref.attr("gridName", searchgridname);
    }

    gridref.attr("entityName", gridobj.EntityName);
    if (typeof CheckGridConstaintsExistance == "function")
        CheckGridConstaintsExistance(gridref.data("kendoGrid")); 
}

function onMultiSearchGridCheckRow(e, id, text) {
    var $grid = $(e).closest('.k-grid');
    var currentValue = $grid.data('currentSearchgridValue');
    if (e.checked)
        currentValue.push({id, text});
    else {
        var i = currentValue.findIndex(v => v.id == id);
        if (i > -1)
            currentValue.splice(i, 1);

    }
    $grid.data('currentSearchgridValue', currentValue);
}

//evento di selezione della riga della search grid
function onSearchGridCheckRow(arg, isMulti = false) {
    var incelledit = $(arg).closest(".searchgrid-window").length ? true : false;
    //ottengo griglia e elemento selezionato andando a vedere gli elementi piu' vicini alla checkbox selezionata
    var gridref = $(arg).parents(".k-grid");
    var grid = gridref.data("kendoGrid");

    var kendoEditGrid = grid;
    if (incelledit)
        kendoEditGrid = gridref.data("parentGrid");
    var closebutton = gridref.find(".k-grid-toolbar")[0];
    var selected = isMulti ? gridref.data('currentSearchgridValue') : grid.dataItem($(arg).closest("tr"));
    var id = isMulti ? selected.map(v => v.id).join(',') : selected.id;
    var fieldinedit = grid.wrapper[0].attributes.referencefield.value;
    var $container = $(arg).closest("div.k-popup-edit-form");
    var dsinedit = $container.data('gridDS').data();
    var uid = dsinedit.uid;
    var mainrecordid = $container.data('gridDSElementInEditID');
    var mainrecordUid = $container.data('gridDSElementInEditUID');
    var cellInEdit = $container.data('cellInEdit');
    var i;
    var inputelement = cellInEdit;
    for (i = 0; i < dsinedit.length; i++) {
        if (dsinedit[i].id == mainrecordid && (mainrecordUid == dsinedit[i].uid)) {
            //if for some reason the cell is closed while opering the search, i open/edit it.
            if (cellInEdit && !cellInEdit.hasClass("k-edit-cell"))
                $container.data("parentGrid").editCell(cellInEdit);
            var oldValue = dsinedit[i][fieldinedit];
            dsinedit[i].dirty = oldValue != id;
            dsinedit[i][fieldinedit] = id;
            dsinedit[i].trigger("change", { field: fieldinedit });

            //incell edit
            if (incelledit) {
                if (dsinedit[i].dirty) {
                    resetCascadeSlaveValues(fieldinedit, dsinedit[i], $container.data("parentGrid").dataSource.options.schema.model, $container);
                }

                $container.data("parentGrid").closeCell();

            }
            else { //popup
                // https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/195  the search grid expected by parent is the master but back-end replaces it with layer grid
                let code_ = grid.options.MasterGridName || grid.options.gridcode; //MasterGridName is evluated only if the grid is the replacement of the expected grid because of layers 
                inputelement = $(arg).closest("#" + code_ + "_searchgrid").parent().find("#" + fieldinedit + "_binder");
                $(arg).closest("#" + code_ + "_searchgrid").parent().find("#" + fieldinedit + "_binder")
                    .val(selected[grid.wrapper[0].attributes.referenceTextfield.nodeValue] || id)
                    .trigger('searchGridChange', [id, oldValue])
                    .parent().addClass("has-value");
                if (isMulti) {
                    inputelement
                        .next()
                        .children()
                        .each((i, child) => {
                            // remove tags that aren't in value anymore
                            var _id = $(child).data('id');
                            if (!selected.find(v => v.id == _id))
                                $(child).remove();

                        });
                    selected
                        .forEach(v => {
                            // add tags where does not exist but are in value
                            if (!inputelement.next().find(`[data-id="${v.id}"]`).length) {
                                inputelement
                                    .next()
                                    .append(`<span class="tag label label-info" data-id="${v.id}">${v.text}</span>`);
                            }
                        });
                }
                if (dsinedit[i].dirty)
                    resetCascadeSlaveValues(fieldinedit, dsinedit[i], $container.data('gridDS').options.schema.model, $container);
            }
            closesearchgrid(closebutton);

            if (typeof custommethod == 'function' && kendoEditGrid.element)
                custommethod(kendoEditGrid, selected, dsinedit[i], fieldinedit);
            //launch the configured change event without propagation. changefunctionname is "DetailonchangeFunctionName" of magic_templatedetails
            if (inputelement && typeof inputelement.attr == "function" && inputelement.attr("changefunctionname"))
                window[inputelement.attr("changefunctionname")](inputelement);
            break;
        }
    }
    clearCascadingFieldsFrom(fieldinedit, $container[0]);

}

//e e' il bottone di annulla sulla searchgrid 
function closesearchgrid(e) {
    var $e = $(e),
        $container = $e.parents("div.k-edit-form-container"),
        $incellWindow = $e.closest(".searchgrid-window");
    if ($incellWindow.length) {
        $incellWindow.data("kendoWindow").destroy();
        return;
    }
    $container.parents(".k-window").find("#close-researchgrid").remove();
    $container.find("div.filter-labels").remove();
    $container.parents(".k-window").find(".hidden-actions-by-searchgrid").show().removeClass("hidden-actions-by-searchgrid");

    var grid = $(e).closest(".gridItemSelector.k-grid");
    grid.fadeOut();
    grid.empty();
    var numcol = $container.parent().attr("numcol");
    $container.removeClass('search-grid-opened');
    resetPopupwindowDimension(numcol, $container);
    var tabStrip = $container.find("[data-role=tabstrip]").data("kendoTabStrip");  //tabstrip corrente
    if (tabStrip)
        tabStrip.enable(tabStrip.tabGroup.children());
}

//Annulla la selezione di valore dalla search 
function unselectResearchgridValue(fieldBindedToSearchGrid, e, isIncell) {
    var $container = $(e).closest("div.k-edit-form-container");
    if (isIncell) {
        var $e = $(e),
            $input = $e.siblings("input"),
            columnData = $input.data("columnData"),
            oldValue = columnData.model[columnData.field];
        $input
            .val("")
            .trigger('searchGridChange', [null, oldValue]);
        columnData.model[columnData.field] = null;
        columnData.model.dirty = oldValue != null;
        //D.T https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/57 inline searchgrid not triggering change event , used set instead of direct assignment.

        if ($(e).closest(".k-grid")?.data("kendoGrid")?.options?.gridExtension?.searchgridInCellColumns) {

            let configurationSearchGridExtension = $(e).closest(".k-grid").data("kendoGrid").options.gridExtension.searchgridInCellColumns.find(x => { return x.Column == columnData.field });
            if (configurationSearchGridExtension) {
                let columnToEmpty = configurationSearchGridExtension.ColumnDescriptionTarget;
                if (columnToEmpty) {
                    columnData.model[columnToEmpty] = "";
                }
            }
        }

        try {
            if (oldValue != null) {

                //OM : https://gitlab.ilosgroup.com/ilos/operations/-/issues/436 Constraint - cancellazione campo di una searchgrid

                columnData.model.trigger("change", { field: columnData.field });
                //$(e).closest(".k-grid").data("kendoGrid").dataSource.trigger("change");
                //D.T: https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/211 dirty gets modified after triggering change event added for bug #57...
                //columnData.model.dirty = oldValue != null;
            }
        }
        catch (ex) {
            console.log(ex);
        }
    }
    else {
        var $field = $container.find("#" + fieldBindedToSearchGrid + "_binder");
        if ($field.parent().hasClass('k-state-disabled'))
            return false;
        //model della griglia in edit
        var modelofgrid = getCurrentModelInEdit(),
            oldValue = modelofgrid[fieldBindedToSearchGrid];
        modelofgrid[fieldBindedToSearchGrid] = null;
        modelofgrid.dirty = oldValue != null;
        $field
            .val("")
            .trigger('searchGridChange', [null, oldValue])
            .parent().removeClass("has-value");
        //works on kendo Components, reset model values and reload selectable values.
        var $popup = $(e).closest("div.k-popup-edit-form");
        resetCascadeSlaveValues(fieldBindedToSearchGrid, modelofgrid, $popup.data('gridDS').options.schema.model, $popup);
        if ($field && typeof $field.attr == "function" && $field.attr("changefunctionname"))
            window[$field.attr("changefunctionname")]($field);
    }
    //works on other search fields (ILOS components)
    clearCascadingFieldsFrom(fieldBindedToSearchGrid, $container[0]);

}

//#endregion
//#region gridfastsearch 
//refresh the grid based on the toolbar input fast search 
//TODO gestire eventuali filtri su campi numerici,date
function addResearchFiltersInGrid(clean, filterfields, val, jquerygrid, fieldvalues) {

    var grid = jquerygrid.data("kendoGrid");
    $xmlHead = grid.options.xmlFilters ? $("thead th.xmlFilterColumn", grid.element) : [];
    if (clean != 1) {

        filters = new Array();
        if (grid.options.gridcode == "Magic_Grid")
            grid.dataSource._filter = removeFiltersByType(grid.dataSource._filter, "configFilter");

        var i = 0;
        for (i = 0; i < filterfields.length; i++) {
            if (!fieldvalues[filterfields[i]])
                filters.push({ field: filterfields[i], operator: "contains", value: val });
            else {
                var subfilter = { logic: "or", filters: [] };
                $.each(fieldvalues[filterfields[i]], function (j, v) {
                    if (v.value && v.text && v.text.toUpperCase().indexOf(val.toUpperCase()) != -1)
                        subfilter.filters.push({ field: filterfields[i], operator: "eq", value: v.value })
                });
                if (subfilter.filters && subfilter.filters.length > 0)
                    filters.push(subfilter);
            }
        }
        grid.dataSource.filter(combineDataSourceFilters(grid.dataSource._filter, { logic: "or", type: "searchBar", filters: filters }));
        if ($xmlHead.length) {
            if (grid.options.columnMenu) {
                $xmlHead.find('.k-filter').remove();
                $xmlHead.find('.k-link').append('<span class="k-icon k-filter"></span>');
            } else {
                $xmlHead.find('.k-grid-filter').addClass("k-state-active");
            }
        }
    }
    else {
        grid.dataSource.filter(removeFiltersByType(grid.dataSource._filter, "searchBar"));
        if ($xmlHead.length) {
            if (grid.options.columnMenu)
                $xmlHead.find('.k-filter').remove();
            else
                $xmlHead.find('.k-grid-filter').removeClass("k-state-active");
        }
    }

}

function initializeFastSearch(fields, domobjid, jquerygrid, fieldvalues) {
    var timeout = null,
        val = '';
    domobjid.on("keydown", function (e) {
        val = domobjid.val();
    });

    domobjid.on("keyup", function (e) {
        if (val != domobjid.val()) {
            if (timeout)
                clearTimeout(timeout);
            timeout = setTimeout(function () {
                if (domobjid.val().length > 0)
                    addResearchFiltersInGrid(0, fields, domobjid.val(), jquerygrid, fieldvalues);
                else
                    addResearchFiltersInGrid(1, fields, domobjid.val(), jquerygrid, fieldvalues);
                timeout = null;
            }, 500);
        }
    });
}


//#endregion
//#region detailGrid
//tab activation method

function popUpTabActivation(e) {
    appendGridInEditTemplateTab(e.item, e.contentElement, this.element.closest(".k-popup-edit-form.k-window-content.k-content"));
}

function sanitizeJSON(string) {
    return string.replace(/{{/g, '{').replace(/}}/g, '}');
}

function appendGridInEditTemplateTab(tab, tabcontent, elementInEditData) {
    var $e = $(tab);
    var $savebtn = $e.parents("div.k-edit-form-container").find("div.k-edit-buttons a.k-grid-update");
    var contentObject = $(tab).data("contentObject");
    if (contentObject && contentObject.contentType.indexOf("GRID") != -1) { //se il tab contiene una griglia
        $savebtn.hide();
        expandPopUpwindow($(tabcontent));
        var gridobj = getrootgrid(contentObject.objectName, undefined, undefined, undefined, undefined, undefined, contentObject.bindedGridFilter, undefined, contentObject.bindedGridHideFilterCol, undefined, undefined, undefined, contentObject.bindedGridRelType_ID);
        //application of filter
        //very weird logic using a window object... mantained to avoid regressions....
        var elementInEdit = window.objectinedit;
        if (!window.objectinedit) //sometimes it's null , fallback to the data attribute of the popup
        {
            var idinedit = elementInEditData.data("gridDSElementInEditID");
            var modelinedit = elementInEditData.data("gridDS").data().filter(x => x.id == idinedit)[0];
            elementInEdit = { data: modelinedit };
        }
        filtersolver(contentObject.bindedGridFilter, gridobj, elementInEdit, contentObject.bindedGridHideFilterCol, "editPopup");
        if (gridobj.gridExtension && !gridobj.gridExtension.detailTemplateOnPopup) {//remove navigation tabs 
            gridobj.detailTemplate = null;
            gridobj.detailTemplateName = null;
            gridobj.detailInit = null;
        }
        //set from inspectTabsToRemove in  getStandardEditFunction (getStandard_GetTabRestrictions with editable = false)
        if ($e.attr("noneditable") == "true") {
            gridobj.Editable = "false";
            manageuserrightsincommandcolumn(gridobj, gridobj, {});
            gridobj.toolbar = [];
        }

        if (!$(tabcontent).children("[data-role=grid]").length) {
            var griddiv = $(tabcontent).children("." + (contentObject.groupClass || contentObject.objectName));
            griddiv.kendoGrid(gridobj);

            let kgrid_ = griddiv.data("kendoGrid");
            kgrid_.one("dataBound", function () {
                $(tabcontent).closest('.k-window-content').data("kendoWindow").center();
            });
            //#5473 saveChanges non triggered
            //rollback
            //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/316 fixed regressions here
            if (kgrid_.options?.editable) {
                if (gridobj.editable === true || gridobj.editable === 'incell') {
                    bindRemoveListenerToGrid(kgrid_);
                    griddiv.data("kendoGrid").bind('saveChanges', function (e) {
                        manageGridUploadedFiles(griddiv);
                    });
                } else if (gridobj.editable) {
                    griddiv.data("kendoGrid").bind('save', function (e) {
                        manageGridUploadedFiles(griddiv);
                    });
                }

                if (typeof appendToMagnifyModal != "undefined"
                    && appendToMagnifyModal) {
                    grid.dataSource.bind('requestEnd', function (e) {
                        if (e.type == 'update') {

                            var parentGrid = $('[magnifyid=' + magnifyId + ']').not('.magnify-grid');
                            if (parentGrid.length) {
                                var parentKGrid = parentGrid.data("kendoGrid");
                                parentKGrid.dataSource.read();
                            }
                        }
                    });
                }
            }
            griddiv.attr("editablecolumnnumber", gridobj.editablecolumnnumber);
            griddiv.attr("editableName", gridobj.editableName);
            griddiv.attr("gridName", contentObject.objectName);
            checkAndInitializeFastSearch(griddiv);
            if (typeof CheckGridConstaintsExistance == "function")
                CheckGridConstaintsExistance(griddiv.data("kendoGrid"));
            griddiv.fadeIn();
        }
    }
    else if (contentObject && contentObject.contentType == "ANGULARCONTROLLER") {
        if (contentObject.templateToAppendName && typeof contentObject.templateToAppendName == 'string' && contentObject.templateToAppendName.trimStart()[0] == "{") {
            var $tabContent = $(tabcontent);
            if (!$tabContent.find("div[ng-controller]").length) {
                var controllerData = JSON.parse(contentObject.templateToAppendName),
                    itemsPerRow = 1,
                    data = {};
                if (window.objectinedit) {
                    if (window.objectinedit.sender.options.editable && window.objectinedit.sender.options.editable.window)
                        itemsPerRow = window.objectinedit.sender.options.editable.window.width / 400;
                    if (window.objectinedit.model)
                        data = window.objectinedit.model;
                }
                controllerData = $.extend({
                    tabHeaderElement: tab,
                    tabContentElement: tabcontent,
                    itemsPerRow: itemsPerRow,
                    data: data
                }, controllerData);
                $tabContent.html(getAngularControllerElement(controllerData.angularControllerName, controllerData));
            }
        }
    }
    else if (contentObject && contentObject.contentType.indexOf("GRID") == -1 && contentObject.templateToAppendName && contentObject.MagicTemplateGroupDOMID) {
        var extdscall = null;
        var extdsvalue = null;
        if (contentObject.bindedGridFilter) {
            extdscall = "Get/" + eval("e.data." + contentObject.bindedGridFilter);
            extdsvalue = eval("e.data." + contentObject.bindedGridFilter);
        }
        try {
            renderpartialdetail(contentObject.extds, null, extdscall, null, null, contentObject.MagicTemplateGroupDOMID, contentObject.templateToAppendName, extdsvalue);
        } catch (e) {
            console.log("ERROR in renderpartialdetail:" + e);
        }
    }
    else if ($(tabcontent).find("[data-role=editor]").length > 0) {
        expandPopUpwindow($(tabcontent));
        $savebtn.show();
    } else { //reupero il numero di colonne in cui e' disposta la griglia di partenza
        var gridcontainer = $(tabcontent).parents(".k-edit-form-container");
        //var numcol = gridcontainer.attr("numcolumnsoriginalform");
        var numcol = $(tab).closest('.k-popup-edit-form').attr("editablecolumnnumber");
        resetPopupwindowDimension(numcol, gridcontainer);
        $savebtn.show();
    }
}

//#endregion
//#region In Cell edit Management
function managesavepath(savepath) {
    if (savepath) {
        if (!savepath.match(/\/$/))
            savepath += '/';
        if (!savepath.match(/^(\/|[a-z]{1}:)/i))
            savepath = '/' + savepath;
    }
    return savepath;
}

function dataURLtoBlob(dataUrl) {
    var promise = $.Deferred();
    var req = new XMLHttpRequest;
    req.open('GET', dataUrl);
    req.responseType = 'blob';
    req.onload = function fileLoaded(e) {
        promise.resolve(this.response);
    };
    req.send();
    return promise.promise();
}

function getBlob(file) {
    if (file instanceof Blob) {
        return $.Deferred().resolve(file).promise();
    }
    if (file.data) {
        return dataURLtoBlob(file.data)
            .then(function (blob) {
                for (var key in file) {
                    blob[key] = file[key];
                }
                return blob;
            });
    }
    return $.Deferred().reject(new Error('file has to be a blob or needs a data property which contains a data uri')).promise();
}

// file can be a blob a JS file (inherits from blob) or a object containing a data property containing a file url produced by FileReader class
// only first param is required
function uploadFile(file, savePath, isAdminAreaUpload) {
    var fileName = Date.now() + '-' + file.name;
    let saveUrl = "/api/MAGIC_SAVEFILE/SaveApplication";
    //FIX FOR COMUNE DI ROMA !!!!  
    if (window.synchCallsApiPrefix)
        saveUrl = window.synchCallsApiPrefix + saveUrl;
    return getBlob(file)
        .then(function (blob) {
            var config = {
                method: 'POST',
                url: saveUrl,
                data: blob,
                processData: false,
                contentType: 'application/binary',
                headers: {
                    'File-Name': fileName,
                }
            };
            return $.ajax(config);
        })
        .then(function (result) {
            var serverFileInfo = JSON.parse(result);
            serverFileInfo[0].savePath = savePath || '';
            serverFileInfo[0].adminAreaUpload = isAdminAreaUpload || false;
            var config = {
                method: 'POST',
                url: '/api/MAGIC_SAVEFILE/ManageUploadedFiles',
                data: JSON.stringify({
                    filesToDelete: [],
                    filesToSave: [
                        serverFileInfo[0],
                    ]
                }),
                contentType: 'application/json',
            };
            return $.ajax(config);
        })
        .then(function () {
            return { name: fileName };
        });
}

function initKendoUploadField($input, options, $container, uid) {
    let shouldDisable = false;

    try {
        let field = $container.data().kendoGrid.options.dataSource.schema.model.fields[$input[0].name];
        shouldDisable = !field.editable;
    } catch (e) {
        console.error(e);
    }

    var inputData = $input.data(),
        path,
        useController = false;
    if (inputData) {
        path = managesavepath(inputData.savepath) || ""
    } else {
        path = "";
    }

    if (inputData && !inputData.adminUpload) {
        useController = window.getMSSQLFileTable || window.FileUploadRootDir || !path.match(/^\//);
    } else if (!path) {
        useController = true; //is adminUpload and no savepath is set, use controller to get filedir from DB
    } else {
        path = ""; //is adminUpload and savepath is set, so clear savepath -> saved in filename
    }

    let saveUrl = "/api/MAGIC_SAVEFILE/SaveApplication";
    //FIX FOR COMUNE DI ROMA !!!!  
    if (window.synchCallsApiPrefix)
        saveUrl = window.synchCallsApiPrefix + saveUrl;

    var data = $.extend({
        async: {
            saveUrl,
            removeUrl: "/api/MAGIC_SAVEFILE/RemoveApplication",
            removeVerb: "GET"
        },
        select: onUploadSelect,
        template: function (e) {
            return uploadTemplate(e, path, useController, inputData.adminUpload, true, $container ? $container.attr('gridname') : null, $input.attr('name'));
        },
        upload: onUpload,
        error: function (e) {
            console.error(e);
            if (e.XMLHttpRequest && e.XMLHttpRequest.response) {
                var msg = JSON.parse(e.XMLHttpRequest.response).ExceptionMessage;
                kendoConsole.log(msg, true);
            }
        },
        success: function (e) {
            uploadSuccess(e, $container, uid, inputData.adminUpload);
        },
        validation: {
            allowedExtensions: $input.attr('accept') ? $input.attr('accept').split(',') : [],
            maxFileSize: window.MaxRequestLength * 1024 //MaxRequestLength is in KB https://msdn.microsoft.com/de-de/library/system.web.configuration.httpruntimesection.maxrequestlength(v=vs.110).aspx
        }
    }, options, inputData);

    $.each(data, function (k, v) {
        if (typeof v == 'string') {
            if (typeof window[v] == "function")
                data[k] = eval(v);
            else if (v.toLowerCase() == 'true')
                data[k] = true;
            else if (v.toLowerCase() == 'false')
                data[k] = false;
        }
    });

    data.localization = {
        select: getObjectText('selectFile'),
        remove: getObjectText('remove'),
        retry: getObjectText('retry'),
        headerStatusUploaded: getObjectText('done'),
        headerStatusUploading: getObjectText('uploading'),
    };

    if (options.localization)
        data.localization = $.extend(data.localization, options.localization);

    var kendoUpload = $input.kendoUpload(data).data("kendoUpload");

    // Apply disabled state after Kendo Upload is initialized
    try {
        if (shouldDisable) {
            kendoUpload.enable(false);
        }
    } catch (e) {
        console.error(e);
    }

    if (options.gallery && options.files && options.files.length) {
        var button = $('<div class="k-button k-upload-button"><i class="fa fa-picture-o" aria-hidden="true"></i></div>');
        kendoUpload.wrapper.find('.k-dropzone').append(button);
        button.on('click', function (e) {
            e.preventDefault();
            showModal({
                content: getGalleryHtml(options.files),
                title: '<i class="fa fa-picture-o" aria-hidden="true"></i>',
                wide: true
            });
        });
    }

    return kendoUpload;
}
function getGalleryHtml(arrayOfFiles) {
    var id = 'carousel-' + getRandomString();
    var html = '<div id="' + id + '" class="carousel slide" data-ride="carousel" data-interval="false">';
    var indicators = '<ol class="carousel-indicators">';
    var slides = '<div class="carousel-inner">';
    var controls = '<a style="top: 25%; bottom: 20%" class="left carousel-control" href="#' + id + '" data-slide="prev"><span class="glyphicon glyphicon-chevron-left"></span></a><a style="top: 25%; bottom: 20%" class="right carousel-control" href="#' + id + '" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>';

    for (var i = 0; i < arrayOfFiles.length; i++) {
        var file = arrayOfFiles[i];
        var extension = file.ext.substring(1).toLowerCase();
        if (!extension)
            continue;
        var name = file.name;
        switch (extension) {
            case 'png':
            case 'jpg':
            case 'jpeg':
                indicators += getCarouselIndicator(i, id);
                slides += '<div class="item' + (i === 0 ? ' active' : '') + '"><img class="center-block" src="/api/MAGIC_SAVEFILE/GetFile?path=' + name + '" alt="' + name + '"><div class="carousel-caption"></div></div>';
                break;
            case 'mp4':
            case 'ogg':
            case 'webm':
                indicators += getCarouselIndicator(i, id);
                slides += '<div class="item' + (i === 0 ? ' active' : '') + '"><video class="center-block" controls><source src="/api/MAGIC_SAVEFILE/GetFile?path=' + name + '" type="video/' + extension + '">Your browser does not support the video tag.</video></div>';
                break;
        }
    }

    indicators += '</ol>';
    slides += '</div>';

    return html += indicators + slides + controls + '</div>';
}

function getCarouselIndicator(index, id) {
    return '<li data-target="#' + id + '" data-slide-to="0"' + (index === 0 ? ' class="active"' : '') + '></li>';
}

function getRandomString() {
    return Date.now() + (Math.random() + '').substring(2);
}

//#region InCellEditor
function kendoNumericTextBoxInCellEditor(container, options, decimals) {
    $('<input name="' + options.field + '"/>')
        .appendTo(container)
        .kendoNumericTextBox({
            format: options.format ? options.format : "{0:n2}",
            decimals: decimals ? decimals : 2
        });
}

function kendoDateTimePickerInCellEditor(container, options) {
    $('<input name="' + options.field + '"/>').appendTo(container).kendoDateTimePicker();
}

function kendoUploadInCellEditor(container, options) {
    var $grid = container.closest('[data-role=grid]'),
        grid = $grid.data("kendoGrid"),
        uploadInfo = grid.dataSource.options.schema.model.fields[options.field].uploadInfo,
        $input = $('<input name="' + options.field + '" type="file" data-savepath="' + uploadInfo.savePath + '" data-admin-upload="' + uploadInfo.adminUpload + '" accept="' + uploadInfo.fileExtensions + '"' + (grid.dataSource.options.schema.model.fields[options.field].validation.required ? ' required="required"' : '') + ' />'),
        data = {
            files: options.model[options.field] ? (options.model[options.field].match(/^\[/) ? JSON.parse(options.model[options.field]) : [{ name: options.model[options.field] }]) : [],
            multiple: uploadInfo.isMulti
        };

    $input.appendTo(container);
    initKendoUploadField($input, data, $grid, options.model.uid);
}

function kendoColorPickerInCellEditor(container, options) {
    container.html('<input type="color" data-role="colorpicker" data-opacity="true" name="' + options.field + '" />');
}

//#endregion
function returnCascadeColumnTemplate(columnname, tablename, valuefield, textfield, parse, schema, typeofdatasource) {
    var field = columnname;
    var ret = function (dataItem) {

        var filter = { logic: "AND", filters: [{ field: valuefield, operator: "eq", value: dataItem[field] }] };

        var ddval = GetDropdownValues(tablename, valuefield, textfield, schema, typeofdatasource, filter);
        var idtosearch = null;
        idtosearch = dataItem[field];
        if (idtosearch == "0" || idtosearch == "" || idtosearch == null)
            return "N/A";
        for (var i = 0; i < ddval.length; i++) {
            if (ddval[i].value == idtosearch)
                return ddval[i].text;
        }
    };
    return ret;
}
//gridtohookvaluefrom --> se il campo cascade non sta sulla griglia corrente lo vado a pescare da quella padre di cui mi faccio passare il nome (MagicgridName)
//cascadeFromField campo di cascade sulla tabella di origine, cascade1 nome del campo di join sulla tabella di destinazione
//valuefield e textfield sono i valori da selezionare sull'  entita' esterna
//tablename e' la tabella/vista che interrogo
// cascadeFromField e' il campo della griglia su cui lavoro di cui prendere il valore
// fields to reset e' un array in cui mettere opzionalmente una lista di campi di cui resettare il valore se cambia il valore del campo su cui lavoro
// cascade1 e' il nome del campo su cui fare filtro di tablename se non passato viene messo = a cascadeFromField
function returnInCellCascadeEditor(tablename, valuefield, textfield, cascadefromField, fieldstoreset, gridtohookvaluefrom, cascade1) {
    if (cascade1 === undefined)
        cascade1 = cascadefromField;  //se sulle 2 tabelle i campi hanno lo stesso nome

    var ret = function (container, options) { // use a dropdownlist as an editor
        // create an input element with id and name set as the bound field (brandId)
        var input = $('<input id="' + options.field + '" name="' + options.field + '">');
        // append to the editor container 
        input.appendTo(container);
        var cascade1val = null;
        if (cascadefromField) {
            if (gridtohookvaluefrom) {
                var selector = "." + gridtohookvaluefrom;
                if (gridtohookvaluefrom === "grid")
                    selector = "#" + gridtohookvaluefrom;
                cascade1val = $(selector).data("kendoGrid").dataItem($(container).closest("div.k-grid").data("kendoGrid").element.closest("tr").prev())[cascadefromField];
            }
            else {
                cascade1val = options.model[cascadefromField];
            }
        }

        var ds = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "/api/ManageFK/GetCascadeDropdownValues",
                    serverFiltering: true,
                    data: { tablename: tablename, valuefield: valuefield, textfield: textfield, cascade1: cascade1, cascade2: null, cascade1val: cascade1val, cascade2val: null },
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    dataType: "json"
                },
                parameterMap: function (options, operation) {
                    return kendo.stringify(options);
                }
            },
            schema: {
                parse: function (data) {
                    data.unshift({ value: null, text: "N/A" });
                    return data;
                }
            }

        });
        // initialize a dropdownlist
        var model = options.model;

        input.kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: ds, // bind it to the brands array
            change: function (e) {
                if (fieldstoreset === undefined)
                    fieldstoreset = [];
                for (var j = 0; j < fieldstoreset.length; j++)
                    model.set(fieldstoreset[i], null);
            }
        }).appendTo(container);
    };

    return ret;
}

function returnInCellEditor(tablename, valuefield, textfield, onselectfunction) {
    var ret = function (container, options) { // use a dropdownlist as an editor
        // create an input element with id and name set as the bound field (brandId)
        var input = $('<input id="' + options.field + '" name="' + options.field + '">');
        // append to the editor container 
        input.appendTo(container);



        var ds = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "/api/ManageFK/GetDropdownValues",
                    serverFiltering: true,
                    data: { tablename: tablename, valuefield: valuefield, textfield: textfield },
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    dataType: "json"
                },
                parameterMap: function (options, operation) {
                    return kendo.stringify(options);
                }
            },
            schema: {
                parse: function (data) {
                    data.unshift({ value: null, text: "N/A" });
                    return data;
                }
            }

        });
        // initialize a dropdownlist
        var model = options.model;

        input.kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: ds, // bind it to the brands array
            select: function (e) {
                if (onselectfunction !== undefined)
                    onselectfunction(e);
            }
        }).appendTo(container);
    };

    return ret;
}
//cascadefromField: campo da filtrare su tablename
//cascade1 : campo di cui prendo il valore dal master per fare il filtro
function buildFKInlineCascadeEditor(field, tablename, valuefield, textfield, cascade1, cascadefromField, fieldstoreset) {


    var ret = function (container, options) { // use a dropdownlist as an editor
        // create an input element with id and name set as the bound field (brandId)
        var input = $('<input id="' + field + '" name="' + field + '">');
        // append to the editor container 
        input.appendTo(container);



        var cascade1val = null;
        if (cascadefromField != null) {
            var id = $(container).closest("div.k-grid")[0].id;
            var allfields = options.model;
            cascade1val = cascade1val = allfields[cascadefromField];
        }


        var ds = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "/api/ManageFK/GetCascadeDropdownValues",
                    serverFiltering: true,
                    data: { tablename: tablename, valuefield: valuefield, textfield: textfield, cascade1: cascade1, cascade2: cascade1, cascade1val: cascade1val, cascade2val: null },
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    dataType: "json"
                },
                parameterMap: function (options, operation) {
                    return kendo.stringify(options);
                }
            },
            schema: {
                parse: function (data) {
                    data.unshift({ value: 0, text: "N/A" });
                    return data;
                }
            }

        });
        // initialize a dropdownlist
        var model = options.model;

        input.kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: ds, // bind it to the brands array
            change: function (e) {
                for (var j = 0; j < fieldstoreset.length; j++)
                    model.set(fieldstoreset[i], 0);
            }
        }).appendTo(container);
    }

    return ret;
}

function inlineCascadeMultiSelect(container, options) {
    var $grid = container.closest('[data-role=grid]'),
        model = container.closest('[data-role=grid]').data('kendoGrid').dataSource.options.schema.model,
        grid = $grid.data("kendoGrid"),
        dsInfo = (grid.dataSource.options.schema.model.fields[options.field].dataSourceInfo),
        $input = $('<select multiple="multiple" id="' + options.field + '" name="' + options.field + '"' + (grid.dataSource.options.schema.model.fields[options.field].validation.required ? ' required="required"' : '') + ' />');
    dataSource = new kendo.data.DataSource();

    if (dsInfo && dsInfo.cascadeFilterColumn && dsInfo.cascadeColumn) {
        var filter = { filters: [{ field: dsInfo.cascadeFilterColumn, value: options.model[dsInfo.cascadeColumn], operator: "eq" }], logic: "AND" };
        GetDropdownValues(normalizeDataSource(dsInfo.dataSource), dsInfo.dsValueField, dsInfo.dsTextField, dsInfo.dsSchema, dsInfo.dsTypeId, filter, true, options.model)
            .then(function (data) {
                if (!data.value)
                    data = manageDBFKAddValueText({ data: data, valuefield: dsInfo.dsValueField, textfield: dsInfo.dsTextField });
                dataSource.data(data);
                //console.log($input.data("kendoDropDownList"));
                if ($input.data("kendoMultiSelect"))
                    $input.data("kendoMultiSelect").open();
            });
    } else {
        dataSource.data(options.values);
    }


    $input
        .appendTo(container)
        .kendoMultiSelect({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: dataSource,
            valuePrimitive: true,
            change: function () {
                resetCascadeSlaveValues(options.field, options.model, model, container);
            }
        });
    setTimeout(function () { $input.data("kendoMultiSelect").value(options.model[options.field] ? options.model[options.field].split(',') : []) }, 500);
}

function inlineCascadeDropDown(container, options) {
    var model = container.closest('[data-role=grid]').data('kendoGrid').dataSource.options.schema.model,
        dsInfo = model.fields[options.field].dataSourceInfo,
        $input = $('<input id="' + options.field + '" name="' + options.field + '"' + (model.fields[options.field].validation && model.fields[options.field].validation.required ? ' required="required"' : '') + '>'),
        dataSource = new kendo.data.DataSource();

    if (dsInfo && dsInfo.cascadeFilterColumn && dsInfo.cascadeColumn) {
        var filter = { filters: [{ field: dsInfo.cascadeFilterColumn, value: options.model[dsInfo.cascadeColumn], operator: "eq" }], logic: "AND" };
        GetDropdownValues(normalizeDataSource(dsInfo.dataSource), dsInfo.dsValueField, dsInfo.dsTextField, dsInfo.dsSchema, dsInfo.dsTypeId, filter, true, options.model)
            .then(function (data) {
                if (!data.value)
                    data = manageDBFKAddValueText({ data: data, valuefield: dsInfo.dsValueField, textfield: dsInfo.dsTextField });
                data.unshift({ value: 0, text: "N/A" });
                dataSource.data(data);
                //console.log($input.data("kendoDropDownList"));
                if ($input.data("kendoDropDownList"))
                    $input.data("kendoDropDownList").open();
            });
    } else {
        dataSource.data(options.values);
    }

    $input
        .appendTo(container)
        .kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: dataSource,
            change: function () {
                resetCascadeSlaveValues(options.field, options.model, model, container);
            }
        });
}
//Performs the reset to null of all cascade values and Reloads kendo DropDowns and MultiSelects 
function resetCascadeSlaveValues(field, rowModel, model, $container) {
    function reloadDropDownAndMultiSelect(field, rowModel, model, $container) {
        $.each(model.fields, function (k, f) {
            if (f.dataSourceInfo && f.dataSourceInfo.cascadeColumn == field) {
                if ($container.length && (f.dataRole == "dropdownlist" || f.dataRole == "multiselect")) {
                    if ($container.find("[name=" + k + "]").length)
                        $container.find("[name=" + k + "]").data(f.dataRole == "dropdownlist" ? "kendoDropDownList" : "kendoMultiSelect").dataSource.read();
                }
            }
        });
    }

    $.each(model.fields, function (k, f) {
        if (f.dataSourceInfo && f.dataSourceInfo.cascadeColumn == field) {
            rowModel.set(k, 0);
            resetCascadeSlaveValues(k, rowModel, model, $container);
        }
    });
    reloadDropDownAndMultiSelect(field, rowModel, model, $container);
}

function inlineCascadeSearchGrid(container, options) {
    var model = container.closest('[data-role=grid]').data('kendoGrid').dataSource.options.schema.model,
        dsIndo = model.fields[options.field].dataSourceInfo,
        type = model.fields[options.field] ? model.fields[options.field].type : null;

    getTemplate(window.includesVersion + "/Magic/Views/Templates/DataRoles/Incell/" + model.fields[options.field].dataRole + ".html")
        .then(function (res) {
            var value = "";
            if (model.fields[options.field].dataRole.indexOf('multiselect') === -1) {
                $.each(options.values, function (k, v) {
                    if (v.value == options.model[options.field]) {
                        value = v.text;
                        return false;
                    }
                });
            } else {
                value = (options.model[options.field] || "")
                    .split(',')
                    .filter(v => v)
                    .map(id => {
                        var v = options.values.find(v => v.value == id);
                        if (v)
                            return `<span class="tag label label-info" data-id="${v.id}">${v.text}</span>`;
                    })
                    .join('')
            }
            var data = [options.field, value, dsIndo.dsTextField, dsIndo.searchGridName, dsIndo.searchGridColumnDesc, dsIndo.cascadeColumn, dsIndo.cascadeFilterColumn, type != "string" ? "eq" : "contains", model.fields[options.field].validation.required ? 'required="required"' : '', dsIndo.dsValueField, ""];
            container.html(res.format.apply(res, data));
            container.find("input").data("columnData", options).focus();
        });
}

function buildCascadeFKFilter(column, tablename, valuefield, textfield) {
    var ar = GetDropdownValues(tablename, valuefield, textfield);
    ar.unshift({ text: "N/A", value: null });
    column.filterable = {
        operators: { string: { eq: "=" } },
        ui: function (element) {
            element.kendoDropDownList({
                dataSource: ar,
                dataTextField: "text",
                dataValueField: "value",
                optionLabel: "--Select Value--"
            });
        }
    }

}
//#endregion
//#region buttonmanager
function getRowDataFromButton(e) {
    var datatoreturn = null;
    //Jquery click
    if (e.currentTarget !== undefined)
        datatoreturn = $(e.currentTarget).closest(".k-grid").data("kendoGrid").dataItem($(e.currentTarget).closest("tr"));
    else //onclick con parametro e = this
        datatoreturn = $(e).closest(".k-grid").data("kendoGrid").dataItem($(e).closest("tr"));

    //tolgo lo utc alle date
    $.each(datatoreturn, function (k, v) {
        if (datatoreturn.hasOwnProperty(k) && v instanceof Date == true)
            datatoreturn[k] = toTimeZoneLessString(datatoreturn[k]);
    });

    return datatoreturn;
}

function refreshGridAfterButtonPress(e) {
    if (!e) {
        return;
    }

    if (e.dataSource) {
        e.dataSource.read();
        return;
    }

    $(e.currentTarget).closest(".k-grid").data("kendoGrid").dataSource.read();
}

function getRowJSONPayload(e) {
    return JSON.parse(rowbuttonattributes[e.currentTarget.className].jsonpayload);
}
function getRowStoredProcedure(e) {
    return rowbuttonattributes[e.currentTarget.className].storedprocedure;
}

function getRowStoreProcedureDataFormat(e) {
    return rowbuttonattributes[e.currentTarget.className].storedproceduredataformat;
}

function getGridFromToolbarButton(e) {
    return $(e).closest(".k-grid").data("kendoGrid");
}

function rebuildGenericModal() {

    $("#wndmodalContainer").removeClass("modal-wide");
    $("#wndmodalContainer").removeClass("modal-full");
    //reset initial modal content
    $("#wndmodalContainer .modal-content").html('<div class="modal-header">\
                                                        <button type="button" class="close" data-dismiss="modal">&times;</button>\
                                                        <h4 class="modal-title"></h4>\
                                                    </div>\
                                                    <div id="contentofmodal" class="modal-body">\
                                                    </div>\
                                                    <div class="modal-footer">\
                                                        <a id="executesave" href="javascript:void(0)" type="button" class="btn btn-primary" aria-label="save">OK\
                                                        </a>\
                                                   </div>');

    $("#contentofmodal").html(getObjectText("proceedwithoperation"));
    if ($(".k-overlay").css("display") == "block")
        $("#wndmodalContainer").css("z-index", 10004);
    else
        $("#wndmodalContainer").css("z-index", "");
}

function genericRowButtonFunction(e, options) {
    let storedprocedure = e ? getRowStoredProcedure(e) : "";
    let storedproceduredataformat = e ? getRowStoreProcedureDataFormat(e) : null;
    let targetgrid = e ? $(e.currentTarget).closest(".k-grid").data("kendoGrid") : options.targetgrid.data("kendoGrid");

    var jsonpayload = {};
    try {
        jsonpayload = options && options.payload ? options.payload : getRowJSONPayload(e);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }
    var rowdata = options?.rowdata ? options.rowdata : getRowDataFromButton(e);
    //aggiunge ai dati di riga il payload impostato dall utente
    //D.t modified in order to prevent modifications of the grid's model  
    var mergeddata = jQuery.extend({}, rowdata, jsonpayload);
    //delete useless fields
    if ('defaults' in mergeddata)
        delete mergeddata.defaults;
    if ('fields' in mergeddata)
        delete mergeddata.fields;
    if ('_defaultId' in mergeddata)
        delete mergeddata._defaultId;

    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, sessionStorage.fid ? sessionStorage.fid : null, null, mergeddata, null);

    let url = jsonpayload && jsonpayload.CustomControllerAPI ? jsonpayload.CustomControllerAPI : "/api/GENERICSQLCOMMAND/ActionButtonSPCall/";

    rebuildGenericModal();
    if (jsonpayload && (jsonpayload.form || jsonpayload.formMassiveUpdate == true)) {
        genericButtonForm({
            e,
            datatopost,
            jsonpayload,
            targetgrid,
            storedprocedure,
            url
        });
    }
    else {
        $("#executesave").click(function () {
            $("#executesave").attr("disabled", "disabled");

            var data = datatopost;
            $.ajax({
                type: "POST",
                url: url,
                data: data,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    var msg = "OK";
                    var msgtype = false;
                    if (result.message !== undefined) {
                        msg = result.message;
                        if (result.msgtype == "WARN")
                            msgtype = "info";
                    }
                    kendoConsole.log(msg, msgtype);
                    refreshGridAfterButtonPress(e || targetgrid);
                    $("#executesave").removeAttr("disabled");
                    $("#wndmodalContainer").modal('toggle');
                },
                error: function (message) {
                    $("#executesave").removeAttr("disabled");
                    kendoConsole.log(message.responseText, true);
                }
            });
        });
        $("#wndmodalContainer").modal('toggle');
    }

}

function genericButtonForm(buttondata) {
    var e = buttondata.e;
    var datatopost = buttondata.datatopost;
    var jsonpayload = buttondata.jsonpayload;
    var targetgrid = buttondata.targetgrid;
    var storedprocedure = buttondata.storedprocedure;
    let url = buttondata.url;

    //deprecated
    if (jsonpayload.formMassiveUpdate == true) {
        //if it's a massiveUpdate and the form/grid is not specified i get the container grid as a form base
        if (!jsonpayload.form)
            jsonpayload.form = targetgrid.wrapper.attr("gridname");
        //if a stored procedure is not specified i use the update default stored for the container grid
        if (!storedprocedure && targetgrid.dataSource.transport.options.CustomJSONParam)
            storedprocedure = JSON.parse(targetgrid.dataSource.transport.options.CustomJSONParam).update.Definition;
    }

    // Function to get the highest z-index from an element and its parents
    function getHighestZIndex(element) {
        var maxZIndex = 0;
        var $element = $(element);

        // Check the element itself and walk up the DOM tree
        $element.parents().addBack().each(function () {
            var zIndex = parseInt($(this).css('z-index'), 10);
            if (!isNaN(zIndex) && zIndex > maxZIndex) {
                maxZIndex = zIndex;
            }
        });

        // Also check if the element is within a modal or dialog
        var $modal = $element.closest('.modal, .ui-dialog, [role="dialog"]');
        if ($modal.length) {
            var modalZIndex = parseInt($modal.css('z-index'), 10);
            if (!isNaN(modalZIndex) && modalZIndex > maxZIndex) {
                maxZIndex = modalZIndex;
            }
        }

        return maxZIndex;
    }

    //check diritti utente
    isGridVisiblePromise(jsonpayload.form)
        .fail(function () {
            kendoConsole.log(getObjectText("missingrights"), true);
        })
        .then(function () {
            if (jsonpayload.formWide == true)
                $("#wndmodalContainer").addClass("modal-wide");

            // Get the z-index from the initiating element
            var initiatorZIndex = 0;
            if (e) {
                try {
                    // Check if e is a jQuery event object or DOM event
                    var targetElement = null;
                    if (e.target) {
                        targetElement = e.target;
                    } else if (e.currentTarget) {
                        targetElement = e.currentTarget;
                    } else if (e.jquery || (e.length !== undefined && e[0])) {
                        // e might be a jQuery object
                        targetElement = e[0] || e;
                    } else if (e.nodeType) {
                        // e is a DOM element
                        targetElement = e;
                    }

                    if (targetElement) {
                        initiatorZIndex = getHighestZIndex(targetElement);
                    }
                } catch (ex) {
                    console.warn('Error getting z-index from initiator element:', ex);
                    initiatorZIndex = 0;
                }
            }

            // Set the modal z-index to be higher than the initiator
            var newZIndex = initiatorZIndex + 1;
            // Ensure minimum z-index for modals (bootstrap default is around 1050)
            if (newZIndex < 1051) {
                newZIndex = 1051;
            }

            // Apply the z-index to the modal
            $("#wndmodalContainer").css('z-index', newZIndex);

            var itemsPerRow = 2; //default
            var hideTabs = "false";
            if (jsonpayload.formItemsPerRow)
                itemsPerRow = jsonpayload.formItemsPerRow > 12 ? 12 : jsonpayload.formItemsPerRow;
            if (jsonpayload.formHideTabs)
                hideTabs = "true";
            requireConfigAndMore(["MagicSDK"], function (MF) {
                $("#wndmodalContainer div.modal-footer").hide();
                var useLoadSP = jsonpayload.formLoadSp ? true : false;
                var directive = '<magic-form  model="c.formData" table-name="' + jsonpayload.form + '" options="{itemsPerRow: ' + itemsPerRow + ' , where: c.options.where ,hideTabs:' + hideTabs + ' }"></magic-form>';
                if (useLoadSP)
                    directive = '<magic-form-sp  model="c.formData" storedprocedure="' + jsonpayload.formLoadSp + '" isreadonly=false formname="' + jsonpayload.form + '" hidetabs=' + hideTabs + ' itemsperrow=' + itemsPerRow + ' options="{kendoStyle:false, where: c.options.where }"></magic-form-sp>';

                var $el = $("#contentofmodal").html('<div id="multiselectform-controller" ng-controller="MultiSelectFormController as c">\
                                                        <form name="form" ng-submit="c.callStoredProcedure(form)">{0}\
                                                            <div><button class="btn btn-primary">OK</button></div>\
                                                        </form>\
                                                    </div>'.format(directive)).find("#multiselectform-controller")[0];

                var config = { MF: MF, e: e, data: datatopost, gridFields: targetgrid.dataSource.options.schema.model.fields, gridModel: targetgrid.dataSource.options.schema.model };
                config.massiveUpdate_form_columns = [];
                config.formMassiveUpdate = jsonpayload.formMassiveUpdate;
                config.formPK = targetgrid.dataSource.options.schema.model.id;
                config.jsonpayload = jsonpayload;
                config.filter = targetgrid.dataSource.filter();
                config.url = url;
                $.each(targetgrid.dataSource.options.schema.model.fields, function (k, v) {
                    if (v.visibleForMassiveUpdate == true)
                        config.massiveUpdate_form_columns.push(k);
                });
                var angular = initAngularController($el, "MultiSelectFormController", config, null, false);
            });
            $("#executesave").show();
            $("#wndmodalContainer").modal('show');
        });
}
function genericToolbarButtonFunction(e, options) {
    var removeReservedWordsFromPayload = function (jsonpayload) {
        if (!jsonpayload)
            return jsonpayload;
        var payloadForExtension = $.extend({}, jsonpayload);
        delete payloadForExtension.form;
        delete payloadForExtension.formLoadSp;
        delete payloadForExtension.storedProcedure;
        delete payloadForExtension.selectionMandatory;
        delete payloadForExtension.formWide;
        delete payloadForExtension.formHideTabs;
        return payloadForExtension;

    }
    var getGridData = function (targetgrid, jsonpayload) {
        var datapayload = [];
        //append the payloads to selection removing front end reserved words
        var payloadForExtension = removeReservedWordsFromPayload(jsonpayload);
        //if the grid is NOT selectable then i'm going to pick the all the rows. If the dirty flag is set to true i'm picking the modified ones only
        if (targetgrid.options && !targetgrid.options.selectable) {
            var datapayload = $.map(targetgrid.dataSource.data(), function (v, i) {
                if ((!jsonpayload) || (jsonpayload && jsonpayload.dirty && v.dirty) || (jsonpayload && !jsonpayload.dirty))
                    //D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
                    return jQuery.extend({}, v, payloadForExtension);
                else
                    return;
            })
        }
        else //selectable return selected rows
        {
            var selecteddata = targetgrid.select();
            let pagingOptions = targetgrid.options.gridExtension.hasOwnProperty('paging_options') ? targetgrid.options.gridExtension.paging_options : null;
            let selectAll = $('.select-all-button').hasClass('k-state-active');

            if (pagingOptions && pagingOptions.disable_server_paging && selectAll) {
                let filters = targetgrid.dataSource.filter();
                let allData = targetgrid.dataSource.data();
                let query = new kendo.data.Query(allData);
                let allRecs = query.filter(filters).data;
                let spColumns = targetgrid.options.gridExtension.hasOwnProperty('sp_columns') ? targetgrid.options.gridExtension.sp_columns : null;

                let unselectedRecs = $('.k-master-row').not('.k-state-selected');
                let unselectedUids = $.map(unselectedRecs, function (rec) { return $(rec).data() && $(rec).data().hasOwnProperty('uid') ? $(rec).data().uid : '' });

                for (let i = 0; i < allRecs.length; i++) {
                    let obj = {};
                    let rec = allRecs[i];

                    //don't add unselected records to payload (kendo.select() only gets selected records of current grid-page)
                    if (rec.hasOwnProperty('uid') && unselectedUids.includes(rec.uid)) {
                        continue;
                    }

                    for (let j = 0; j < spColumns.length; j++) {
                        let column = spColumns[j].Column;
                        if (rec[column]) {
                            obj[column] = rec[column]
                        }
                    }
                    datapayload.push(obj);
                }
                return datapayload;
            }
            //select all from database
            if (targetgrid.element.data('allRecords')) {
                return $.map(targetgrid.element.data('allRecords'), function (v, i) {
                    return jQuery.extend({}, v, payloadForExtension);
                });
            }
            //select all in current browser view
            if (detectTouch() && targetgrid.element.find(".rowselected__").length) {
                selecteddata = [];
                $.each(targetgrid.element.find(".rowselected__"), function (i, v) {
                    if ($(v).prop('checked') == true)
                        selecteddata.push($(v).closest("tr"));
                });
            }

            if (selecteddata.length > 0) {
                for (var i = 0; i < selecteddata.length; i++) {
                    //D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
                    datapayload.push(jQuery.extend({}, targetgrid.dataItem(selecteddata[i]), payloadForExtension));
                }
            }
        }
        //clear useless props
        $.each(datapayload, function (i, v) {
            if ('defaults' in v)
                delete v.defaults;
            if ('fields' in v)
                delete v.fields;
            if ('_defaultId' in v)
                delete v._defaultId;
        })

        return datapayload;
    }

    var key = e.id == "" ? e.className : e.id;
    var storedprocedure = options && options.storedprocedure ? options.storedprocedure : toolbarbuttonattributes[key].storedprocedure;
    var storedproceduredataformat = options && options.storedproceduredataformat ? options.storedproceduredataformat : toolbarbuttonattributes[key].storedproceduredataformat;
    var targetgrid = getGridFromToolbarButton(e);
    var jsonpayload = {};
    try {
        jsonpayload = options && options.payload ? options.payload : JSON.parse(toolbarbuttonattributes[key].jsonpayload);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }
    //se la griglia e' selezionabile vado a prendermi tutte le righe selezionate se non e' selezionabile tutte le dirty rows 
    var datapayload = [];
    try {
        datapayload = getGridData(targetgrid, jsonpayload);
    }
    catch (err) {
        console.log(err);
    }
    if (jsonpayload && jsonpayload.selectionMandatory && !datapayload.length) {
        kendoConsole.log(getObjectText("selectatleastone"), true);
        return;
    }

    var url = "/api/GENERICSQLCOMMAND/ActionButtonSPCall/";
    if (jsonpayload && jsonpayload.CustomControllerAPI) {
        url = jsonpayload.CustomControllerAPI;
    }

    //crea lo stesso payload del caso batch dell' update 
    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, sessionStorage.fid ? sessionStorage.fid : null, null, { models: datapayload }, null);
    rebuildGenericModal();
    //if the form property is set a form is used via magicform directive 
    if (jsonpayload && (jsonpayload.form || jsonpayload.formMassiveUpdate == true)) {
        genericButtonForm({
            e,
            datatopost,
            jsonpayload,
            targetgrid,
            storedprocedure,
            url
        });
    } else {
        $("#executesave").click(function () {
            if (!(jsonpayload && jsonpayload.UI_ImmediateRelease))
                doModal(true);
            else //UI_ImmediateRelease == treu --> the ui must be immediately released !!!
                $("#wndmodalContainer").modal('hide');

            var data = JSON.parse(datatopost);
            $(data.models).each(function (k, v) {
                $.each(v, function (key, val) {
                    if (typeof val == "string" && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
                        v[key] = toTimeZoneLessString(new Date(val));
                });
            });
            $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    var msg = "OK";
                    var msgtype = false;
                    if (result.message !== undefined) {
                        msg = result.message;
                        if (result.msgtype == "WARN")
                            msgtype = "info";
                    }
                    if (jsonpayload && jsonpayload.CallbackFunction) {
                        window[jsonpayload.CallbackFunction](result);
                    }
                    kendoConsole.log(msg, msgtype);
                    targetgrid.dataSource.read();
                    doModal(false);
                    $("#wndmodalContainer").modal('hide');
                },
                error: function (message) {
                    kendoConsole.log(message.responseText, true);
                    if (!(jsonpayload && jsonpayload.UI_ImmediateRelease))
                        doModal(false);
                }
            });
        });
        $("#wndmodalContainer").modal('show');
    }

}
//#endregion
//#region UIprofilemanagement
function generateApplicationAreasDropDown(renewdatasource) {
    if ($("#wndApplicationArea").data("kendoWindow") !== undefined) {
        $("#wndApplicationArea").data("kendoWindow").destroy();
        $("#wndApplicationArea").remove();
    }
    var windowapp = '<div id="wndApplicationArea" class="modalChangeBUnit" style="display:none">\
        <div id="appareas"  style="display:block;text-align:center;">\
          <input id="selectapplicationareas" style="width:90%;"/>\
        </div>\
          <br>\
        <div style="text-align:center;">\
           <button  id="changeappare" style="width:70px;"></button>\
           </div>\
      </div>';

    $("#appcontainer").append(windowapp);



    var windowareatitle = getObjectText('changearea');

    if (window.AppAreasOverrideLabelKey != null && window.AppAreasOverrideLabelKey != "")
        windowareatitle = getObjectText(window.AppAreasOverrideLabelKey);

    var actionwindowapp = $("#wndApplicationArea.modalChangeBUnit").kendoWindow({
        width: "600px",
        title: windowareatitle,
        visible: false,
        modal: true,
        action: []
    }).data("kendoWindow");


    function onChangeArea(e) {
        e.preventDefault();
        var areads = $("#selectapplicationareas").data("kendoDropDownList");
        var selected = areads.select();
        var menucontrollersp = areads.dataSource.data()[selected].Solver;
        sessionStorage.MenuControllerParameter = menucontrollersp; //setto nel session storage 
        sessionStorage.ApplicationAreaId = areads.dataSource.data()[selected].ID;
        sessionStorage.ApplicationAreaDescription = areads.dataSource.data()[selected].Description;
        sessionStorage.ApplicationAreaProfileSettingsType = areads.dataSource.data()[selected].ProfileSettingsType;
        //Task asincrono di creazione del menu
        generateSideMenu();
        //web arch necessita di una init successiva
        if (typeof ReinitMenu === "function")
            ReinitMenu();

        $(e.sender.element.parents(".k-window-content")).data("kendoWindow").close();

    }
    if ($("#changeappare").data("kendoButton") === undefined)
        $("#changeappare").kendoButton({
            icon: "tick",
            click: onChangeArea
        });

    if (renewdatasource === false) {
        $("#selectapplicationareas").kendoDropDownList({
            dataTextField: "Description",
            dataValueField: "ID",
            dataBound: function (e) {
                if (e.sender.dataSource.data().length > 1) {
                    $("li[id$='changeappareli']").show();
                    $("#areagroupchangedivider").show();
                }
                if (sessionStorage.ApplicationAreaId !== undefined)
                    e.sender.select(function (dataItem) {
                        return dataItem.ID === parseInt(sessionStorage.ApplicationAreaId)
                    })
            },
            dataSource: {
                transport: {
                    read: {
                        dataType: "json",
                        url: "/api/MAGIC_MMB_MODULES/GetAllApplicationAreas",
                    }
                }
            }
        });
    }
    else {

        var ds = new kendo.data.DataSource({
            transport: {
                read: {
                    dataType: "json",
                    url: "/api/MAGIC_MMB_MODULES/GetAllApplicationAreas",
                }
            }
        });
        $("#selectapplicationareas").data("kendoDropDownList").setDataSource(ds);
    }

    actionwindowapp.center();
    actionwindowapp.open();
}
//mette in session storage i diritti dell'  utente sulle griglie. Scatta a start della sessione di lavoro (login) e ogni volta che cambia AREVIS. SessionStorage Viene cancellata al LOGOUT
function buildGridRightsSessionStorage() {
    if (sessionStorage.ApplicationInstanceId !== window.ApplicationInstanceId) {
        sessionStorage.clear();
        try {
            //SSO CEI , se c'e' un filtro di sessione non lo distruggo
            if (window.MF_ASPSessionGridFilter)
                sessionStorage.setItem("MF_ASPSessionGridFilter", JSON.stringify(window.MF_ASPSessionGridFilter));
        }
        catch (ex) {
            console.log(ex);
        }
    }
    sessionStorage.ApplicationInstanceId = window.ApplicationInstanceId;

    return $.when(
        $.ajax({
            url: "/api/Magic_Mmb_UserGroupVisibility/getUserVisibleGridsAndRights",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
        }).then(function (result) {
            sessionStorage.VisibleGridAndRights = JSON.stringify(result);
        }),
        $.ajax({
            url: "/api/Magic_Mmb_UserGroupVisibility/getUserGridsExceptions",
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).done(function (result) {
            sessionStorage.GridRightsExceptions = JSON.stringify(result);
        })
    );
}

function generateVisibilityAreasDropDown() {

    if (typeof alternativePortfolioSelector == "function") {
        alternativePortfolioSelector();
        return;
    }

    if ($("#wndVisibility").data("kendoWindow") !== undefined) {
        $("#wndVisibility").data("kendoWindow").destroy();
        $("#wndVisibility").remove();
    }
    var windowvis = '<div id="wndVisibility" class="modalChangeBUnit" style="display:none">\
       <div id="groupclasscontainer"  style="display:none;text-align:center;">\
         <input id="selectgroupclass" style="width:90%;"/>\
       </div>\
         <br>\
        <div style="text-align:center;">\
         <input id="selectgroup" style="width:90%"/>\
        </div>\
        <div style="text-align:center; margin-top: 15px; display:none;">\
         <label><input id="is_default_usergroup_visibility" type="checkbox"/>&nbsp;' + getObjectText('setAsDefaultUserGroupVisibility') + '</label>\
        </div>\
         <br>\
         <div style="text-align:center;">\
          <button  id="changeportfolioapply" style="width:70px;"></button>\
         </div>\
     </div>';

    $("#appcontainer").append(windowvis);

    var windowportfoliotitle = getObjectText('changebusinessunit');

    if (window.UserGroupOverrideLabelKey != null && window.UserGroupOverrideLabelKey != "")
        windowportfoliotitle = getObjectText(window.UserGroupOverrideLabelKey);

    var actionwindow = $("#wndVisibility.modalChangeBUnit").kendoWindow({
        width: "600px",
        title: windowportfoliotitle,
        visible: false,
        modal: true
    }).data("kendoWindow");


    if (!$("#changeportfolioapply").data("kendoButton")) {
        $("#changeportfolioapply").kendoButton({
            icon: "tick",
            click: function (e) {
                var selectgroup = $("#selectgroup").data("kendoDropDownList"),
                    data = {
                        id: selectgroup.value(),
                        isDefault: $("#is_default_usergroup_visibility").prop('checked')
                    };
                if ("userGroupLogo" in selectgroup.dataSource._data[0]) {
                    $.each(selectgroup.dataSource._data, function (k, v) {
                        if (v.ID == data.id) {
                            data.userGroupLogo = v.userGroupLogo || null;
                            return false;
                        }
                    });
                }
                $.ajax({
                    type: "POST",
                    url: "/api/Visibility/setSessionUserVisibilityGroup",
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                }).then(function () {
                    window.UserGroupDescription = selectgroup.text();
                    if (typeof onChangePTFCustomization == "function")
                        onChangePTFCustomization(e, function () { location.reload(true); });
                    else
                        location.reload(true);
                });
            }
        });
    }

    $("#selectgroupclass").kendoDropDownList({
        dataBound: function (e) {
            var groupClassLength = e.sender.dataSource.data().length,
                groupobj = {
                    dataBound: function (e) {
                        if (e.sender.dataSource.data().length > 1 || groupClassLength > 1) {
                            $("li[id$='changeusergroup'], #areagroupchangedivider").show();
                            $("#is_default_usergroup_visibility").closest('div').show();
                        }
                        $("#selectgroup").data("kendoDropDownList").select(function (dataItem) {
                            return dataItem.ID === window.UserGroupVisibilityID;
                        });
                        e.sender.trigger("change");
                    },
                    dataTextField: "Descrizione",
                    dataValueField: "ID",
                    dataSource: {
                        serverFiltering: true,
                        transport: {
                            read: {
                                dataType: "json",
                                url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/GetLinkedGroups",
                            }
                        }
                    }
                };




            if (e.sender.dataItems().length > 0) { //mostro le classi di aree di visibilita' solo se ce ne sono 

                groupobj.cascadeFrom = "selectgroupclass";
                $("#groupclasscontainer").show();
                $.ajax({
                    type: "POST",
                    async: false,
                    url: manageAsyncCallsUrl(false, "/api/Visibility/getSessionUserVisibilityGroupBOType"),// "/api/Visibility/getSessionUserVisibilityGroupBOType",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        if (!isNaN(result)) // se e' un numero
                            result = parseInt(result);
                        var dropdownlist = $("#selectgroupclass").data("kendoDropDownList");
                        dropdownlist.select(function (dataItem) {
                            return dataItem.ID === result;
                        });
                    }
                });
            }
            else {
                $("#selectgroupclass").data("kendoDropDownList").destroy();
                $("#selectgroupclass").remove();
            }
            $("#selectgroup").kendoDropDownList(groupobj);
            $("#selectgroup").data("kendoDropDownList").bind("change", function (e) {
                var val = this.value(),
                    isDefault = false;

                $.each(e.sender.dataSource.data(), function (k, v) {
                    if (v[e.sender.options.dataValueField] == val) {
                        isDefault = v.isDefault;
                        return false;
                    }
                });
                $("#is_default_usergroup_visibility").prop('checked', isDefault);
            });
        },
        dataTextField: "Description",
        dataValueField: "ID",
        dataSource: {
            transport: {
                read: {
                    dataType: "json",
                    url: "/api/MAGIC_MMB_USERGROUPVISIBILITY/GetLinkedGroupClasses",
                }
            }
        }
    });


    actionwindow.center();
    actionwindow.open();


}
//#endregion
//#region report viewer manager



function appendReportToPage(link, reportanchordiv) {

    var reportdomid = "#" + reportanchordiv;

    if ($("#repocontainer").length !== 0)
        $("#repocontainer").empty();


    $(reportdomid).append('<style scoped>\
        .k-tabstrip-items .k-state-active,\
        .k-ie7 .k-tabstrip-items .k-state-active .k-loading\
    {\
            background-color: #ffffff;\
            background-image: none;\
            background-image: none, -webkit-linear-gradient(top, none);\
            background-image: none, -moz-linear-gradient(top, none);\
            background-image: none, -o-linear-gradient(top, none);\
            background-image: none, linear-gradient(to bottom, none);\
            border-color: #3a84fe;\
    }\
    </style>');

    $(reportdomid).append('<iframe id="reportcontainer" src="about:blank" width="100%" height="900px" frameborder="0" scrolling="no"></iframe>');

    //apply_style("/Views/2/Styles/report.css");  //applica css
    //$(".breadcrumb").hide();
    //$(".page-title").hide();


    ///magic/utils/reportviewer.aspx?report=/Privus/Privus
    document.getElementById('reportcontainer').src = link;

}
//#endregion

function detectmobile() {
    var isTouchDevice = function () { return 'ontouchstart' in window || 'onmsgesturechange' in window; };
    var ismobile = window.screenX == 0 && isTouchDevice() ? true : false;
    return ismobile;
}

function detectTouch() {
    var isTouchDevice = function () { return 'ontouchstart' in window || 'onmsgesturechange' in window; };
    return isTouchDevice();
}

function initializegooglemap(map, domid, x, y, title, type, zoom) {
    var latlng = new google.maps.LatLng(x, y);

    var mapOptions = {
        zoom: zoom,
        center: latlng,
        mapTypeId: type
    };
    // map = new google.maps.Map(document.getElementById("map-canvastab"), mapOptions); 
    map = new google.maps.Map(domid, mapOptions);
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: title
    });
    maps.push(map);

}

function getFunctionTree(functionid, rootgridid) {

    var parstring = { "functionid": functionid, "rootgridid": rootgridid };
    var tree = getdatasource("BUILDFUNCTIONTREE", "", "PostBuildFunctionTree", "", parstring);

    return tree;
}

function getrootfunction(func, dependencies) {

    function extractDependencyInitfunction(depfullPath) //cerca una funzione con lo stesso nome del file che se presente viene chiamata come inizializzazione.
    {
        var funcname;
        try {
            var idx = depfullPath.lastIndexOf('/');
            funcname = depfullPath.substring(idx + 1, depfullPath.length - 3);
        }
        catch (ex) {
            console.log(ex);
        }
        return funcname;
    }
    //tree eventualmente associato alla funzione
    var thetree = func[0].TreeDefinition;
    var listofrootgrids = func[0].rootGrids !== null ? func[0].rootGrids.split('|') : [];
    var rootGridIDs = func[0].rootGridIDs !== null ? func[0].rootGridIDs.split('|') : [];
    var listofrootgridstitles = func[0].rootGridTitles !== null ? func[0].rootGridTitles.split('|') : [];
    var functionname = func[0].FunctionName;
    var layer = func[0].Layer_ID;
    var functionid = func[0].FunctionID;
    if (dependencies)
        $.each(dependencies, function (i, v) {
            if (typeof window[extractDependencyInitfunction(v)] == "function")
                window[extractDependencyInitfunction(v)]();
        });
    if (thetree !== null) {
        var thetreeobj = $.parseJSON(thetree);
        var ds = buildGenericSelectDataSource(thetreeobj.DataSourceRead, thetreeobj.DataSourceCustomJSONParam, thetreeobj.BaseEntityName, functionid);
        //se la funzione ha sia il tree che le griglie l' appcontainer viene splittato in 2
        var functionhasgrids = false;
        if (listofrootgrids.length > 0)
            functionhasgrids = true;
        convertDatabaseToLocalJSONTree(ds, thetreeobj.Name, thetreeobj.Description, thetreeobj.MagicTree_ID, functionhasgrids, thetreeobj.DraggableNodes, thetreeobj.NodesItemTemplate, thetreeobj.OnSelectNodeJSFunction, thetreeobj.OnDragEndJSFunction, thetreeobj.OnDragStartJSFunction, functionname, functionid, layer, thetreeobj.StartExpanded);
        window.refreshtreedata = { datasource: ds, treeobj: thetreeobj, layerid: layer, funcname: functionname, funcid: functionid, hasgrids: functionhasgrids };
    }
    // se c'e' un tree in pagina le griglie non vengono create by default ma solo al click dei nodi sul tree (se previsto al click del nodo)
    else {
        //elenco delle griglie root che sono associate alla funzione (isRoot = true in dbo.Magic_FunctionsGrids)
        var listoddivs = func[0].htmldiv !== null ? func[0].htmldiv.split('|') : [];
        //var listoftitles = func[0].rootGridTitles !== null ? func[0].rootGridTitles.split('|') : [];
        setuserrightsinwindow();
        for (var i = 0; i < listofrootgrids.length; i++) {
            if (listofrootgrids[i] != "") {
                var currentgrid__ = { code: listofrootgrids[i], title: listofrootgridstitles[i], id: rootGridIDs[i], div: listoddivs[i] };
                addGridInfo({ MagicGridName: currentgrid__.code, GUID: currentgrid__.id });
                isGridVisiblePromise(currentgrid__.code)
                    .then(function () {
                        var element = getrootgrid(currentgrid__.code, functionname, null, functionid, layer);
                        element.autoBind = false;
                        var grid = renderGrid(element, null, undefined, currentgrid__.div, currentgrid__.title);
                        if (typeof postrenderdispatcher == 'function')
                            postrenderdispatcher(element, functionname, null, null);

                        var kendoGrid = grid.data("kendoGrid");
                        var filter = kendoGrid.dataSource.options.filter;
                        var filterIsPresent = false;

                        if (filter && filter.filters && filter.filters.length > 0) {
                            filterIsPresent = true;
                        }

                        if (!element.startEmpty || filterIsPresent) {
                            kendoGrid.dataSource.read();
                        }

                        if (element.startEmpty || element.showAllAtOnceFilter || window.showAllAtOnceFilter) {
                            $('[data-toggle="tooltip"]').tooltip("show");
                        }

                    });
            }
        }
    }

}

function setuserrightsinwindow() {
    //se ho l' accesso alle funzioni senza passare da un menu assumo che i diritti siano full (calendario, griglie, dati personali)
    if (window.location.hash.indexOf("#/function/") !== 0) {
        window.usercanexecute = true; //comandi (bottoni) su griglia
        window.usercanupdate = true;  // update/insert in grid
        window.usercandelete = true;  // delete from grid
        window.usercanexport = true;  // export data from grid
        return;
    }

    var rightscookie = sessionStorage.getItem("urights");

    if (rightscookie == null) {
        rightscookie = $(".menuId-" + getMagicAppURIComponents().menuId + " a").data("item-checksum");
    }

    if (rightscookie !== undefined) {
        rightscookie = atob(rightscookie);
        var userrights = rightscookie.split('|');
        window.usercanexecute = userrights[0].substring(0, 2) == "NO" ? false : true;
        window.usercanupdate = userrights[1].substring(0, 2) == "NO" ? false : true;
        window.usercandelete = userrights[2].substring(0, 2) == "NO" ? false : true;
        window.usercanexport = userrights[3].substring(0, 2) == "NO" ? false : true;
    }
    else {
        window.usercanexecute = false; //comandi (bottoni) su griglia
        window.usercanupdate = false;  // update/insert in grid
        window.usercandelete = false;  // delete from grid
        window.usercanexport = false;  // export data from grid
    }
}

function autoResizeColumns(el) {
    var grid = $(el).closest('[data-role=grid]').data("kendoGrid");
    $.each(grid.columns, function (k, column) {
        if (column.field)// && column.widthHasBeenSetFromUs)//D.t: makes the autofit only if the column's width was not set from the developer
            grid.autoFitColumn(column);
    });
}

function filtersolver(filterfield, grid, e, hidefiltercolumn, type) {
    function getFilterValue(data, filter) {
        //the property exists but is = null
        if (filter.value in data && data[filter.value] == null)
            return null;
        //it does have a look up in data
        if (data && data[filter.value] != undefined)
            return data[filter.value];
        //no look up, and it's a string (constant)
        if (filter.value && typeof filter.value.indexOf == "function")
            return filter.value.replace("@", '');
        //return the value given by the config
        return filter.value == undefined ? null : filter.value;
    }
    function setDefaultValAndHideColumns(grid, filter, e, logic) {
        if (!grid.dataSource.schema.model.fields[filter.field] || !filter.field) {
            console.log("Field: " + filter.field + " is not part of the grid model.Default value has not been set and column won't be hidden.");
            return;
        }
        if (filter.field != grid.dataSource.schema.model.id && logic.toUpperCase() == "AND" && filter.operator == "eq") {
            grid.dataSource.schema.model.fields[filter.field].defaultValue = filter.value;
            //D.T: removed 09102018 'cause it's a misbehaviour for edit actions
            //if (e)
            //    grid.dataSource.schema.model.fields[filter.field].editable = false;
        }
        grid.dataSource.schema.model.fields[filter.field].filter = false; //disabilita filtro
        if (hidefiltercolumn == "True" || hidefiltercolumn == true) { //nascondo le colonne coi filtri se impostato da configurazione griglia
            if (getcolumnindex(grid.columns, filter.field) != null) {
                grid.columns[getcolumnindex(grid.columns, filter.field)].hidden = true;
            }
        }
    }
    function lookUpValues(filter, type, data, e, grid) {
        //D.T: bug #6590 added var to for i variable init
        for (var i = 0; i < filter.filters.length; i++) {
            var slice = filter.filters[i];
            if (slice.logic) //recur if nested
                lookUpValues(slice, type, data, e, grid);
            slice.value = getFilterValue(data, slice);
            setDefaultValAndHideColumns(grid, slice, e, filter.logic);
            if (filter.logic.toUpperCase() === "AND")
                slice.type = type; //if is a AND-filter set type to every subfilter
        }
        if (filter.logic.toUpperCase() === "OR") //if is a OR-filter set type in first level of filter-object
            filter.type = type;
        return;
    }
    var data = {};
    if (e !== null) // e = null --> default filter of the grid  
        data = e.data ? e.data : e.model;
    var filter = {};
    if (!filterfield)
        return;
    if (typeof filterfield == "string" && filterfield.indexOf("{") != -1)
        filterfield = JSON.parse(filterfield);
    if (typeof filterfield == "object") {
        filter = filterfield;
        if (!type && e !== null)
            type = "navigationFilter";

        if (filter.logic)
            lookUpValues(filter, type, data, e, grid);
        else { //caso di filtri senza logic specificato
            filter.value = getFilterValue(data, filter);
            setDefaultValAndHideColumns(grid, filter, e, "AND");
            filter.type = type;
        }
        grid.dataSource.filter = combineDataSourceFilters(grid.dataSource.filter, filter);
    }
    else {  //nav filter with only field name in cfg
        filter.field = filterfield;
        if (!e || !e.data)
            valuetofilter = elementineditid;//global variable set in setEditContext function
        else
            valuetofilter = e.data.id;
        $.extend(filter, { operator: "eq", value: valuetofilter, type: "navigationFilter" });
        grid.dataSource.filter = combineDataSourceFilters(grid.dataSource.filter, filter);
        setDefaultValAndHideColumns(grid, filter, e, "AND");
    }
}

function filterTypeExists(filter, types) {
    var exists = false;
    if (filter) {
        types = $.isArray(types) ? types : [types];
        if (("type" in filter) && types.indexOf(filter.type) != -1)
            exists = true;
        else if (filter.filters) {
            $.each(filter.filters, function (k, f) {
                if (("type" in f) && types.indexOf(f.type) != -1)
                    exists = true;
                return !exists; //if exists == true breaks each()
            });
        }
    }
    return exists;
}

function getFiltersByType(filter, types) {
    updateFilterLabels();
    if (!filter)
        return filter;

    types = $.isArray(types) ? types : [types];
    if (("type" in filter) && types.indexOf(filter.type) != -1) {
        return filter
    } else if (filter.filters) {
        filter = $.extend({}, filter);
        filter.filters = $.map(filter.filters, function (f) {
            if (types.indexOf(f.type) != -1)
                return f;
        });

        if (filter.filters.length == 1) {
            if (filter.type && !filter.filters[0].type)
                filter.filters[0].type = filter.type;
            return filter.filters[0]
        }
        else if (filter.filters.length)
            return filter;
        else
            return {};
    }

    return null;
}

function removeUserFiltersFromToolBarButton(element) {
    var $grid = $(element).closest(".k-grid"),
        grid = $grid.data("kendoGrid"),
        filter = grid.dataSource.filter();
    filter = removeFiltersByType(filter, ["searchBar", "user", "pivot", "zoom", "chartFilter", undefined]); //user filters
    grid.dataSource.filter(filter);
    $('th[role="columnheader"]', grid.thead)
        .each((i, th) => {
            const columnMenu = $(th).data('kendoColumnMenu');
            if (columnMenu) {
                columnMenu.wrapper.find('.paste-filter-input').val('');
            }
        });
    $grid.find("#maingridsearchandfilter").val('');
    $grid.attr("globalFiltersLabels", "");
    updateUserFilterLabel($grid);
}

var gridFiltersControllers = {}, gridFiltersCurrentGrid = "";
function setInitialFilter(element) {
    var $grid = $(element).closest(".k-grid");
    var gridName = $grid.attr('gridname');

    if (!gridName) {
        kendoConsole.log('Attenzione: funzionalità non abilitata');
        return;
    }
    //D.T the modal is shared with other functions 
    //if (!gridFiltersControllers[gridName] || (gridName != gridFiltersCurrentGrid)) {
    if (!$("#grid-filters").length || !gridFiltersControllers[gridName] || gridName != gridFiltersCurrentGrid) {
        var config = { $grid };
        cleanModal();
        //$("#contentofmodal").html("");
        gridFiltersControllers[gridName] = $('<div id="grid-filters"></div>')
            .append($(getAngularControllerElement("Magic_GridFiltersController", config)))
            .prependTo("#contentofFiltersmodal");
        gridFiltersCurrentGrid = gridName;
    }

    $("#filtersModalContainer").modal('show');
    $("#filtersModalContainer").css("z-index", 10020);

}

function updateUserFilterLabel(grid) {
    try {
        var kgrid = grid.data('kendoGrid'),
            settingsObject = getGridSettingsObject(kgrid.options.gridcode, kgrid.options.functionid);
        $.each(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (i, v) {
            //setting is on
            if (v.settingsName == settingsObject.selectedGridsSettings[settingsObject.gridKey].settingsName) {
                if (!grid.siblings('h4').hasClass('magic-actual-config')) {
                    if (v.isDefaultSetting) {
                        grid.before("<h4 class='magic-actual-config'><span class='label label-info' style='font-size: 0.7em'>" + escapeHtml(v.settingsName) + "<i class='fa fa-cog' title='" + getObjectText('removeAsGridConfigDefaultSetting') + "' onclick='removeAsGridConfigDefault(" + JSON.stringify(v) + ",\"" + settingsObject.gridKey + "\" )' style='margin-left: 5px'></i></span></h4>");
                    } else {
                        grid.before("<h4 class='magic-actual-config'><span class='label label-info' style='font-size: 0.7em'>" + escapeHtml(v.settingsName) + "<i class='fa fa-plus-square-o' title='" + getObjectText('setAsGridConfigDefaultSetting') + "' onclick='setAsGridConfigDefault(" + JSON.stringify(v) + ",\"" + settingsObject.gridKey + "\" )' style='margin-left: 5px'></i></span></h4>");
                    }
                }
                else
                    grid.siblings('h4').find('.label').html(escapeHtml(v.settingsName));
                //break loop
                return false;
            }
        });
    }
    catch (exc) {
        console.log(exc);
    }
}

function removeAsGridConfigDefault(settingsObject, gridKey) {
    if (confirm(getObjectText("removeAsGridConfigDefaultSettingAlert"))) {
        $.ajax({
            type: "GET",
            url: "/api/UserConfig/RemoveAsGridConfigDefault",
            data: {
                gridKey: gridKey,
                settingsName: settingsObject.settingsName,
            },
            success: function (res) {
                sessionStorage.usersGridsSettings = res;
                location.reload();
            },
            error: function (res) { console.log("Error in function removeAsGridConfigDefault():::", res) },
        });
    }
}

function setAsGridConfigDefault(settingsObject, gridKey) {
    if (confirm(getObjectText("setAsGridConfigDefaultSettingAlert"))) {
        $.ajax({
            type: "GET",
            url: "/api/UserConfig/SetAsGridConfigDefault",
            data: {
                gridKey: gridKey,
                settingsName: settingsObject.settingsName,
            },
            success: function (res) {
                sessionStorage.usersGridsSettings = res;
                location.reload();
            },
            error: function (res) { console.log("Error in function setAsGridConfigDefault():::", res) },
        });
    }
}

function updateFilterLabels() {
    var gridDOMs = $('.k-grid');
    var visibleGrids = [];

    $.each(gridDOMs, function (i, grid) {
        grid = $(grid);
        if (grid.is(":visible") && !grid.is(":hidden") && grid.css('display') != 'none') {
            visibleGrids.push(grid);
        }
    });

    $.each(visibleGrids, function (i, grid) {
        updateFiltersForGrid($(grid));
    });

    //add "This grid is filtered" label
    if ($('.filter-labels').children().length > 0) {
        if ($('.filter-labels').children('#thisGridIsFiltered').length == 0) {
            $('.filter-labels').prepend('<span id="thisGridIsFiltered" class="label label-secondary"><b>' + getObjectText("thisGridIsFiltered") + '</b></span>')
        }
    }
}

function updateFiltersForGrid(gridDOM) {
    var eqneq = [];
    if (gridDOM.attr("eqneqFilters")) {
        eqneq = JSON.parse(gridDOM.attr("eqneqFilters"));
    }

    var containerDOM = $('<div class="filter-labels"></div>');
    gridDOM.siblings('.filter-labels').remove();
    gridDOM.before(containerDOM);

    var tableHead = gridDOM.find('thead').first();
    var tableHeaderActiveFilters = tableHead.find('.k-icon.k-filter');

    var html = "";
    $.each(tableHeaderActiveFilters, function (i, filter) {
        if ($(filter).is(':hidden')) {
            return;
        }

        var filterName = $(filter).parent().text();
        if (!(html.includes(filterName)) && !(eqneq.includes(filterName))) {
            html += getFilterLabelHTML(filterName);
        }
    });

    var globalFiltersLabels = gridDOM.attr("globalFiltersLabels");

    if (globalFiltersLabels)
        $.each(JSON.parse(globalFiltersLabels), function (i, v) {
            if (!(html.includes(v)) && !(eqneq.includes(v))) {
                html += getFilterLabelHTML(v);
            }
        });

    containerDOM.html(html);
}

function getFilterLabelHTML(filterName) {
    return '<span class="badge badge-success" style="margin-left: 5px;"><i class="fa fa-filter"></i>' + filterName + '</span>';
}
function removeFiltersByType(filter, types) {
    types = $.isArray(types) ? types : [types];
    if (filter) {
        if (!filter.logic && types.indexOf(filter.type) != -1)
            filter = null;
        else if (filter.filters) {
            filter.filters = $.map(filter.filters, function (f) {
                if (types.indexOf(f.type) == -1)
                    return f;
            });
            if (!filter.filters.length)
                filter = null;
        }
    }
    return filter;
}

function combineDataSourceFilters(f1, f2) {
    try {
        if (f2.type && filterTypeExists(f1, f2.type)) //f2 type already in f1, so remove filters of current type in f1
            f1 = removeFiltersByType(f1, f2.type);

        if (!f1 || $.isEmptyObject(f1)) // f1 not set, or empty
            f1 = { filters: [], logic: "and" };
        else if (!f1.logic || f1.logic.toUpperCase() == "OR") //f1 is single object like: {field:...,operator:...,value:...} or a nested "or"-filter
            f1 = { filters: [f1], logic: "and" };

        if (f2.logic && f2.logic.toUpperCase() == "AND") // this row eats the type of f2 if f1 is undefined and f2 is a complex filter
            $.each(f2.filters, function (k, f) {
                f1.filters.push(f);
            });
        else
            f1.filters.push(f2)
    } catch (e) {
        console.log("Combine filters error: " + e.message);
    }

    return f1
}

//gestione del template di link ai files da campo DB
function showFileInColumnFolder(edittemplatename, columnName, data) {

    try {
        var inputData = $($("#" + edittemplatename).html()).find("[name=" + columnName + "]").data(),
            path = managesavepath(inputData.savepath) || "",
            useController = false;
        if (!inputData.adminUpload) {
            useController = path == "" || !path.match(/^\//);
            if ((!path || path.match(/^\//)) && (window.FileUploadRootDir || window.getMSSQLFileTable)) {
                //path = managesavepath(window.FileUploadRootDir) + path.replace(/^\//, '');
                useController = true;
            }
        } else if (!path) {
            useController = true; //is adminUpload and no savepath is set, use controller to get filedir from DB
        } else {
            path = ""; //is adminUpload and savepath is set, so clear savepath -> saved in filename
        }
        var gridName = $('[gridname][editablename="' + edittemplatename + '"]').attr('gridname');

        var fn = function solveFileLink(e) {
            if (e[columnName]) {
                var files = e[columnName].match(/^\[/) ? JSON.parse(e[columnName]) : [{ name: e[columnName] }],
                    output = '';

                if (files.length) {
                    $.each(files, function (k, v) {
                        output += uploadTemplate(v, path, useController, inputData.adminUpload, false, data ? data.gridcode : null, columnName);
                    });
                    output = '<div class="file-list">' + output + '</div>';
                }
                return output;
            }

            return '';
        }
    }
    catch (err) {
        console.log(err);
        return;
    }
    return fn;
}

function uploadColumnTemplate(columnName, model, element) {
    var uploadInfo = model[0].fields[columnName].uploadInfo || {},
        path = managesavepath(uploadInfo.savePath) || "",
        useController = false;
    if (!uploadInfo.adminUpload) {
        useController = window.FileUploadRootDir || !path.match(/^\//);
    } else if (!path) {
        useController = true; //is adminUpload and no savepath is set, use controller to get filedir from DB
    } else {
        path = ""; //is adminUpload and savepath is set, so clear savepath -> saved in filename
    }

    return function (data) {
        if (data[columnName]) {
            var files = data[columnName].match(/^\[/) ? JSON.parse(data[columnName]) : [{ name: data[columnName] }],
                output = '';

            if (files.length) {
                $.each(files, function (k, v) {
                    output += uploadTemplate(v, path, useController, uploadInfo.adminUpload, false, element ? element.gridcode : null, columnName);
                });
                output = '<div class="file-list">' + output + '</div>';
            }
            return output;
        }

        return '';
    }
}


//rowdata e' un js object con i valori da passare come parametri alla stored
//storedprocedure nome stored con schema
//storedproceduredataformat XML, XMLSTRING, JSON
function storedprocedurelauncher(rowdata, storedprocedure, storedproceduredataformat, msgok, callback) {
    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, sessionStorage.fid ? sessionStorage.fid : null, null, rowdata, null);
    $.ajax({
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
        data: datatopost,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log(msgok === undefined ? "OK" : msgok, false);
            callback();
        },
        error: function (message) {
            kendoConsole.log(message.responseText, true);
        }
    });
}



//#region bootstrapcomponents utils

//populate a JSON editor based modal window { model: JSONeditormodel, title:"title of modal",transformation_fn:function() { //trasformazioni ai componenti HTML  },save_fn:function () { //what to do when pressing save button} }
function customizeModal(options) {

    var defer = $.Deferred();
    var targetcontent = "#contentofmodal";
    var targetsavebtn = "#executesave";

    if (options.container !== undefined && options.container == "kendoWindow") {
        targetcontent = "#kcontentofmodal";
        targetsavebtn = "#kexecutesave"
        var kendowinhtml = '<div id="kcontentofmodalcontainer" class="k-edit-form-container"><div id="kcontentofmodal" style="width:490px;"></div><div class="k-edit-buttons k-state-default"><a id="kexecutesave"class="k-button k-button-icontext k-primary k-grid-update" href="javascript:void(0)"><span class="k-icon k-update"></span>' + getObjectText("save") + '</a></div></div>';
        if ($("#modkwindow").length == 0) {
            var windowobj = {
                title: options.title,
                modal: true,
                visible: true,
                width: 500
            };
            $("#appcontainer").append("<div id='modkwindow'></div>");
            $("#modkwindow").kendoWindow(windowobj);
            $("#modkwindow").data("kendoWindow").content(kendowinhtml);
        }
        else {
            $("#kcontentofmodal").empty();
            $("#executesave").unbind("click");
            $("#modkwindow").data("kendoWindow").content(kendowinhtml);
            $("#modkwindow").data("kendoWindow").title(options.title);
        }


    }
    else {//bootstrap modal
        //clean modal
        rebuildGenericModal();
        $("#contentofmodal").empty();
        $(".modal-title").text(options.title);
    }
    //creazione form da options.formeditorModel

    var optionsmodel = {
        disable_properties: true,
        disable_edit_json: true,
        // disable_collapse: true,
        iconlib: "bootstrap3",
        no_additional_properties: true,
        show_errors: 'always',
        schema: options.model,

    };

    if (options.form !== undefined)
        optionsmodel.form = options.form;
    requireConfig(function () {
        require(['JSONEditor', 'ace'], function (JSONEditor, ace) {
            window.ace = ace;
            JSONEditor.defaults.options.theme = 'bootstrap3';
            var userculture = kendo.culture().name.substring(0, 2);
            JSONEditor.defaults.language = userculture;
            JSONEditor.defaults.languages.it = {
                error_minLength: "Il valore deve avere almeno {{0}} caratteri",
                error_uniqueItems: "La lista deve avere elementi univoci"
            }
            var editor = new JSONEditor($(targetcontent)[0], optionsmodel);
            //applico la funz. di trasformazione al form per integrare ulteriori comportamenti
            if (options.container !== undefined && options.container == "kendoWindow")
                $("#modkwindow").data("kendoWindow").center();
            if (options.transformation_fn !== undefined)
                options.transformation_fn(editor);
            if (options.save_fn !== undefined)
                $(targetsavebtn).click(function (e) { options.save_fn(e, editor); });

            defer.resolve(editor);
        });
    });

    return defer.promise();
    // $(".executesave").attr("href", options.fn_save);
}


//this creates a modal transparent div - if you dont pass in a message a spinner will be shown
function doModal(switchon, message) {
    if (!switchon)
        $('#spin_modal_overlay').remove();
    else
        $('body').append('<div id="spin_modal_overlay" style="background-color: rgba(0, 0, 0, 0.6); width:100%; height:100%; position:fixed; top:0px; left:0px; z-index: 100001"><div style="position: absolute; top: 40%; left: 50%; color: white;' + (message ? ' background-color: white; padding: 20px' : '') + '">' + (message || largeSpinnerHTML) + '</div></div>');
}

//the component generated depends on bootstrap and kendo.ilos.css
//components is a javascript objects  array
function MagicAccordion(components, parseFunction, options) {
    if (!options || typeof (options) !== 'object') this.options = {};
    else this.options = options;
    if (!("id" in options)) accordionId = "accordion";
    else accordionId = options["id"];
    this.accordionId = accordionId;
    this.components = components;
    this.parse = parseFunction;
    this.html = "";

    this.getAccordionHtml = function () {
        if (this.html == "") {
            this.getInnerAccordionHtml();
        }
        return '<div class="panel-group" id="' + accordionId + '">' + this.html + '</div>';
    }

    this.getInnerAccordionHtml = function () {
        if (this.html == "") {
            for (var k in this.components) {
                if (this.components.hasOwnProperty(k))
                    this.recurseAccordionComponents(this.components[k], 0, k);
            }
        }
        return this.html;
    }

    this.recurseAccordionComponents = function (component, depth, panelNo) {
        if (!panelNo) panelNo = 0;
        switch (depth) {
            case 0:
                var cssClass = '';
                if (("classes" in this.options) && this.options.classes.length > panelNo)
                    cssClass = this.options.classes[panelNo];
                this.html += '<div class="panel panel-default panel-no-' + panelNo + ' ' + cssClass + '">\
              <div class="panel-heading">\
                <h4 class="panel-title">\
                  <a data-toggle="collapse" data-parent="#' + this.accordionId + '" href="#collapse-' + this.accordionId + '-' + panelNo + '">' + this.parse(component, depth, panelNo) + '</a>\
                </h4>\
              </div>\
              <div id="collapse-' + this.accordionId + '-' + panelNo + '" class="panel-collapse collapse' + (panelNo == 0 && !this.options.collapseAll ? ' in' : '') + '">\
                <ul class="list-group">';
                break;
            default:
                this.html += '<li class="list-group-item">' + this.parse(component, depth, panelNo) + '\
                    <ul class="list-group">';
        }
        for (var k in component.items) {
            if (component.items.hasOwnProperty(k)) {
                if (component.items[k].items.length > 0)
                    this.recurseAccordionComponents(component.items[k], depth + 1, panelNo);
                else {
                    this.html += '<li class="list-group-item">' + this.parse(component.items[k], depth + 1, panelNo) + '</li>';
                }
            }
        }
        switch (depth) {
            case 0:
                this.html += '</ul>\
              </div>\
            </div>';
                break;
            default:
                this.html += '</ul>\
              </li>';
        }
    }
}
//data is a Class, Type , id flat-table dataset, referencebuilder is the function which builds the href of the last level. The number of levels is fixed and equals 3
function build3LevelBootstrapAccordion(data, accordionid, referencebuilder) {
    //ActionDescription - id: 3o livello , class-classid: 1o liv , Type - typeid : 2oliv 
    var classhash = {};

    $(data.actions).each(function (i, v) {
        var actobj = { id: v.id, actionfilter: v.actionfilter, actiondescription: v.actionDescription || v.actiondescription, actiontype: v.actiontype, boid: data.recordid, actioncommand: v.actioncommand, taskId: v.taskId, actioniconclass: v.actioniconclass, generateBO: v.GenerateBO, botype: v.botype, count: v.count, actionbackgroundcolor: v.actionbackgroundcolor, bodescription: data.description };
        //adapt to other formats of SP returns...
        if (!v.Class)
            v.Class = v.ActionClassDescription;
        if (!v.Type)
            v.Type = v.TypeDescription;
        if (!v.typeiconclass)
            v.typeiconclass = v.type_icon_class;

        if (classhash[v.Class] == undefined) {
            var typehash = {};
            typehash[v.Type] = { icon: v.typeiconclass, actions: [actobj] };
            classhash[v.Class] = typehash;

        }
        else
            if (classhash[v.Class][v.Type] == undefined) {
                var typehash = {};
                typehash[v.Type] = { icon: v.typeiconclass, actions: [actobj] };
                classhash[v.Class][v.Type] = typehash[v.Type];
            }
            else {
                classhash[v.Class][v.Type].actions.push(actobj);
            }
    });

    var content = "";
    var m = 0;

    var firstlevopen = ' <div class="panel panel-info">\
                                <div class="panel-heading">\
                                <h4 class="panel-title">\
                                  <a data-toggle="collapse" data-parent="#' + accordionid + '" href="#' + accordionid + '-collapse-{1}"><span class="glyphicon glyphicon-folder-close">\
                                    </span>{0}</a>\
                                </h4>\
                                </div>\
                                <div id="' + accordionid + '-collapse-{1}" class="panel-collapse collapse in">\
                                <ul class="list-group actionaccordion">';

    //   var firstlevclosure = '</ul></div></div>';
    //var secondlevopen = '<li class="list-group-item"><a class="btn btn-info {4}" style="width:90%;background-color:#13688c;" data-toggle="collapse" href="#inner-collapse-m-{1}"><span class="{2}"></span>{0}</a> <ul id="inner-collapse-m-{1}" class="list-group  {3}">'
    //   var secondlevclosure = '</ul></li>';
    //var thirdlev = '<li {5} class="list-group-item"><a style="width:90%;white-space:pre-wrap;" class="btn btn-success" id="{4}" href="{1}" {3}><span class="{2}"></span> {0}</a></li>'

    //https://gitlab.ilosgroup.com/ilos/operations/-/issues/316
    var firstlevclosure = '</ul></div></div>';
    var secondlevopen = '<li class="list-group-item"><a class="{4}" style="font-weight:bold;width:90%;" data-toggle="collapse" href="#inner-collapse-m-{1}"><span class="{2}"></span>{0}</a> <ul id="inner-collapse-m-{1}" class="list-group  {3}">'
    var secondlevclosure = '</ul></li>';
    var thirdlev = '<li {5} class="list-group-item"><a style="font-style:italic;width:90%;white-space:pre-wrap;"  id="{4}" href="{1}" {3}><span class="{2}"></span> {0}</a></li>'

    for (var key in classhash) {
        if (classhash.hasOwnProperty(key)) {
            content += firstlevopen.format(key, m);
            m++;
            let i_ = 0;
            for (var innerkey in classhash[key]) {
                content += secondlevopen.format(innerkey, m, classhash[key][innerkey].icon ? classhash[key][innerkey].icon : "fa fa-bars", i_ ? 'collapse' : 'in', i_ ? 'collapsed' : 'in');
                m++;
                i_++;
                $.each(classhash[key][innerkey].actions, function (j, k) {
                    var actionexecutor = "javascript:void(0);"
                    if (referencebuilder)
                        actionexecutor = referencebuilder(k, data.currentTarget);
                    var ref = "javascript:void(0);";
                    var click = "";
                    if (typeof actionexecutor == 'string') //caso di javascript:function  su href con parametri espliciti
                        ref = actionexecutor;
                    else
                        click = 'onclick="' + actionexecutor.click + '"';  //caso di click event con parametri su $.data() dell' a
                    var iclass = "glyphicon glyphicon-pencil";
                    if (k.actioniconclass)
                        iclass = k.actioniconclass;
                    if (k.count !== undefined) {
                        k.actiondescription += " (" + k.count + ")";
                        if (k.count < 1)
                            ref = "javascript:void(0);";
                    }
                    var bckcolor = "";
                    if (k.actionbackgroundcolor)
                        bckcolor = "style=\"background-color:" + k.actionbackgroundcolor + ";\"";
                    content += thirdlev.format(k.actiondescription, ref, iclass, click, k.id, bckcolor);
                });
                content += secondlevclosure;
            }
            content += firstlevclosure;
        }
    }

    content = '<div class="panel-group magicaccordion" id="' + accordionid + '">' + content + '</div>';


    return content;

}

function buildCounterBadgeButton(count, text, id) {
    return ' <button id=' + id + ' class="btn btn-primary" type="button">\
                        '+ text + ' <span class="badge">' + count + '</span>\
            </button>';
}
//#endregion


//#region templatefunction 
function refreshtempl_click(e) {
    e.preventDefault();
    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
    if (dataItem.BaseGrid_ID != 0 && dataItem.BaseCUDTable != "")
        if (dataItem.MagicTemplateLayout_ID > 0 && dataItem.MagicTemplateType_ID > 0)
            refreshtempl(dataItem.MagicTemplateID, dataItem.MagicTemplateLayout_ID, dataItem.MagicTemplateType_ID, dataItem.BaseCUDTable, dataItem.BaseGrid_ID);
        else
            kendoConsole.log("Layout and Type must have a value", true);
    else kendoConsole.log("Table and Grid  must be specified", true);
}

function refreshtempl(template, layout, type, table, grid) {

    var data = { templateid: template, layoutid: layout, typeid: type, table: table, grid: grid };

    $.ajax({
        async: false,
        type: "POST",
        url: manageAsyncCallsUrl(false, "/api/Magic_Templates/RefreshTemplateToDb/"),//"/api/Magic_Templates/RefreshTemplateToDb/",
        data: kendo.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log("Template Succesfully updated", false)
            var grid = $("#grid").data("kendoGrid");
            grid.dataSource.read();
        },
        error: function (result) {
            kendoConsole.log("Template update error", true)
        }

    });

}
//#endregion

//extend Kendo Validator
if (window.kendo) {
    (function () {
        var kendo = window.kendo,
            Widget = kendo.ui.Widget,
            NS = ".kendoValidator",
            INVALIDMSG = "k-invalid-msg",
            invalidMsgRegExp = new RegExp(INVALIDMSG, 'i'),
            INVALIDINPUT = "k-invalid",
            emailRegExp = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
            urlRegExp = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
            INPUTSELECTOR = ":input:not(:button,[type=submit],[type=reset],[disabled])",
            CHECKBOXSELECTOR = ":checkbox:not([disabled],[readonly])",
            NUMBERINPUTSELECTOR = "[type=number],[type=range]",
            BLUR = "blur",
            NAME = "name",
            FORM = "form",
            NOVALIDATE = "novalidate";

        function parseHtml(text) {
            if ($.parseHTML) {
                return $($.parseHTML(text));
            }
            return $(text);
        }

        function decode(value) {
            return value.replace(/&amp/g, '&amp;')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
        }

        function resolveRules(element) {
            var resolvers = kendo.ui.validator.ruleResolvers || {},
                rules = {},
                name;

            for (name in resolvers) {
                $.extend(true, rules, resolvers[name].resolve(element));
            }
            return rules;
        }

        kendo.ui.Validator = kendo.ui.Validator.extend({
            init: function (element, options) {
                var that = this,
                    resolved = resolveRules(element),
                    validateAttributeSelector = "[" + kendo.attr("validate") + "!=false]";

                options = options || {};

                options.rules = $.extend({}, kendo.ui.validator.rules, resolved.rules, options.rules);
                options.messages = $.extend({}, kendo.ui.validator.messages, resolved.messages, options.messages);

                Widget.fn.init.call(that, element, options);

                that._errorTemplate = kendo.template(that.options.errorTemplate);

                if (that.element.is(FORM)) {
                    that.element.attr(NOVALIDATE, NOVALIDATE);
                }

                that._inputSelector = INPUTSELECTOR + validateAttributeSelector;
                that._checkboxSelector = CHECKBOXSELECTOR + validateAttributeSelector;

                that._errors = {};
                that.tabs = {};
                that._attachEvents();
                that._isValidated = false;
            },
            _attachEvents: function () {
                var that = this;

                if (that.element.is(FORM)) {
                    that.element.on("submit" + NS, proxy(that._submit, that));
                }

                if (that.options.validateOnBlur) {
                    if (!that.element.is(INPUTSELECTOR)) {
                        that.element.on(BLUR + NS, that._inputSelector, function () {
                            that._checkElement($(this));
                        });

                        that.element.on("click" + NS, that._checkboxSelector, function () {
                            that._checkElement($(this));
                        });
                    } else {
                        that.element.on(BLUR + NS, function () {
                            that._checkElement(that.element);
                        });

                        if (that.element.is(CHECKBOXSELECTOR)) {
                            that.element.on("click" + NS, function () {
                                that._checkElement(that.element);
                            });
                        }
                    }
                }
            },
            _extractMessage: function (input, ruleKey) {
                function getLabelText() {
                    return getObjectText('vE' + ruleKey).format(input.closest('.k-edit-field').prev('.k-edit-label').text() || getObjectText('thisField'), input.val());
                }

                var that = this,
                    customMessage = that.options.messages[ruleKey],
                    fieldName = input.attr(NAME);

                customMessage = kendo.isFunction(customMessage) ? customMessage(input) : customMessage;

                return kendo.format(input.attr(kendo.attr(ruleKey + "-msg")) || input.attr("validationMessage") || getLabelText() || input.attr("title") || customMessage || "", fieldName, input.attr(ruleKey));
            },
            validate: function () {
                var inputs;
                var idx;
                var result = false;
                var length;

                var isValid = this.value();

                //this._errors = {};
                //this.tabs = {};

                if (!this.element.is(INPUTSELECTOR)) {
                    var invalid = false;

                    inputs = this.element.find(this._inputSelector);

                    for (idx = 0, length = inputs.length; idx < length; idx++) {
                        if (!this.validateInput(inputs.eq(idx))) {
                            invalid = true;
                        }
                    }

                    result = !invalid;
                } else {
                    result = this.validateInput(this.element);
                }

                this.trigger("validate", { valid: result });

                if (isValid !== result) {
                    this.trigger("change");
                }

                return result;
            },
            validateInput: function (input) {
                input = $(input);

                this._isValidated = true;

                var that = this,
                    template = that._errorTemplate,
                    result = that._checkValidity(input),
                    valid = result.valid,
                    className = "." + INVALIDMSG,
                    fieldName = (input.attr(NAME) || (input.attr('data-bind') ? input.attr('data-bind').replace('value:', '') : false) || ""),
                    lbl = that._findMessageContainer(fieldName).add(input.next(className).filter(function () {
                        var element = $(this);
                        if (element.filter("[" + kendo.attr("for") + "]").length) {
                            return element.attr(kendo.attr("for")) === fieldName;
                        }

                        return true;

                    })).hide(),
                    messageText;

                if (!fieldName) //added because every input of kendo-editor got evaluated
                    return true;

                input.removeAttr("aria-invalid");
                //Exceptions upload and multiselects...
                if (input.data("role") == "upload" && input.attr("required") && input.data("kendoUpload").options.files.length)
                    valid = true;
                //BUG 6287 validator not working with required multiselects
                if (input.data("role") == "multiselect" && input.attr("required") && input.data("kendoMultiSelect").value().length)
                    valid = true;

                var $tabstrip = input.closest(".k-tabstrip"),
                    contentContainerIndex = $tabstrip.children("div").index(input.parent().closest(".k-content")),
                    $tabHeading = $tabstrip.find("ul > li").eq(contentContainerIndex),
                    tabId = $tabHeading.attr("data-tab-id"),
                    hiddenContentContainerIndex = -1,
                    $subTabElement = null;
                if (tabId) {
                    hiddenContentContainerIndex = contentContainerIndex;
                    $subTabElement = $tabstrip.find('ul > li button[data-tab-id="' + tabId + '"]');
                    $tabHeading = $subTabElement.closest('[role="tab"]');
                    contentContainerIndex = $tabstrip.find("ul > li").index($tabHeading);
                }

                if ($tabHeading.length > 0) {
                    if (!valid && !(fieldName in that._errors)) {
                        if (!that.tabs[contentContainerIndex])
                            that.tabs[contentContainerIndex] = 1;
                        else
                            that.tabs[contentContainerIndex]++;
                        if ($tabHeading.find('div.k-tab-error-underline').length == 0) {
                            var ul = $('<div class="k-tab-error-underline" style="display: none;">');
                            $tabHeading.append(ul);
                            ul.show(1000);
                        }
                        //manages highlighting grouped tabs
                        if (tabId) {
                            if (!that.tabs[hiddenContentContainerIndex])
                                that.tabs[hiddenContentContainerIndex] = 1;
                            else
                                that.tabs[hiddenContentContainerIndex]++;
                            if ($subTabElement.find('div.k-tab-error-underline').length == 0) {
                                var ul = $('<div class="k-tab-error-underline" style="display: none;">');
                                $subTabElement.append(ul);
                                ul.show(1000);
                            }
                        }
                    }
                    else if (valid && (fieldName in that._errors)) {
                        that.tabs[contentContainerIndex] = !that.tabs[contentContainerIndex] ? 0 : --that.tabs[contentContainerIndex];
                        if (!that.tabs[contentContainerIndex])
                            $tabHeading.find('div.k-tab-error-underline').remove();
                        //manages highlighting grouped tabs
                        if (tabId) {
                            if (fieldName in that._errors) {
                                that.tabs[hiddenContentContainerIndex] = !that.tabs[hiddenContentContainerIndex] ? 0 : --that.tabs[hiddenContentContainerIndex];
                            }
                            if (!that.tabs[hiddenContentContainerIndex])
                                $subTabElement.find('div.k-tab-error-underline').remove();
                        }
                    }
                }

                if (!valid) {
                    messageText = that._extractMessage(input, result.key);
                    that._errors[fieldName] = messageText;
                    var messageLabel = parseHtml(template({ message: decode(messageText) }));
                    messageLabel.append('<span class="k-tooltip-button"><a onclick="$(this).closest(\'.k-tooltip\').remove()" href="#" class="k-icon k-i-close">close</a></span>');

                    that._decorateMessageContainer(messageLabel, fieldName);

                    if (!lbl.replaceWith(messageLabel).length) {
                        messageLabel.insertAfter(input.data("role") == "upload" ? input.parent() : input);
                    }
                    messageLabel.show();

                    input.attr("aria-invalid", true);

                } else {
                    $('.k-widget.k-tooltip.k-tooltip-validation[data-for=' + fieldName + ']').remove();
                    delete that._errors[fieldName];
                }

                input.toggleClass(INVALIDINPUT, !valid);

                return valid;
            },
        });

        // default messages
        $.extend(true, kendo.ui.Grid.fn.options.messages, {
            editable: {
                cancelDelete: getObjectText("cancel"),
                confirmation: getObjectText("CONFIRMATION"),
                confirmDelete: getObjectText("delete")
            }
        });

        kendo.ui.plugin(kendo.ui.Grid.extend({
            saveRow: function () {
                var that = this, container = that._editContainer, model = that._modelForContainer(container), editable = that.editable;
                if (container && editable && editable.end()) {
                    if (that.dataSource.online()) {
                        that._confirmSave(() => {
                            if (!that.trigger('save', {
                                container: container,
                                model: model
                            })) {
                                that.dataSource.sync();
                            }
                        });
                    } else if (!that.trigger('save', {
                        container: container,
                        model: model
                    }))
                        that.dataSource.sync();
                }
            },
            saveChanges: function () {
                var that = this;
                if ((that.editable && that.editable.end() || !that.editable)) {
                    if (that.dataSource.online()) {
                        that._confirmSave(() => {
                            if (!that.trigger('saveChanges'))
                                that.dataSource.sync();
                        });
                    } else if (!that.trigger('saveChanges'))
                        that.dataSource.sync();
                }
            },
            _confirmSave: function (callbackFn) {
                this._showMessage({
                    cancelDelete: getObjectText("cancel"),
                    title: getObjectText("confirmSaveChanges"),
                    confirmDelete: getObjectText("save")
                }, undefined, callbackFn);
            },
            _showMessage: function (messages, row, callbackFn) {

                var that = this;

                var template = kendo.template('<ul>' +
                    '<li class="km-actionsheet-title">#:title#</li>' +
                    '<li><a href="\\#" class="k-button k-grid-delete">#:confirmDelete#</a></li>' +
                    '</ul>');

                var html = $(template(messages)).appendTo(that._isMobile ? that.view.element : that.wrapper);
                var actionSheet = that._actionSheet = new kendo.mobile.ui.ActionSheet(html, {
                    type: that._isMobile ? "auto" : "phone",
                    isDesktop: !that._isMobile,
                    cancel: messages.cancelDelete,
                    cancelTemplate: '<li class="km-actionsheet-cancel"><a class="k-button" href="\\#">#:cancel#</a></li>',
                    close: function () {
                        this.destroy();
                    },
                    command: function (e) {
                        if (!$(e.currentTarget).parent().hasClass("km-actionsheet-cancel")) {
                            if (!callbackFn) {
                                that._removeRow(row);
                            } else {
                                this.destroy();
                                callbackFn();
                            }
                        }
                    },
                    popup: that._actionSheetPopupOptions
                });

                actionSheet.open(row);

                return false;
            },
            _tbody: function () {
                var that = this,
                    table = that.table,
                    tbody;
                tbody = table.find(">tbody");

                if (!tbody.length) {
                    tbody = $("<tbody/>").appendTo(table);
                }

                that.tbody = tbody.attr("role", "rowgroup");

                //set min width of 100px for each column (which has no width defined)
                try {
                    var columnsWithoutWidth = [],
                        tableWidth = that.table.width();

                    //if tbody has no with during creation, locked column grids doesn't work
                    if (!tableWidth)
                        return;

                    $.each(that.columns, function (k, v) {
                        tableWidth -= v.width ? parseInt(v.width) : 0;
                        if (!v.width)
                            columnsWithoutWidth.push(k);
                    });

                    if (that.options.detailTemplate)
                        tableWidth -= 27;
                    //else if (!that.options.groupable && !that.options.height && (typeof that.columns[0].lockable == "undefined" || that.columns[0].lockable) && that.columns.length > 1) {
                    //    that.columns[0].locked = true;
                    //    if (!that.columns[0].width) {
                    //        that.columns[0].width = that.columns[0].command ? 80 : Math.max(tableWidth / columnsWithoutWidth.length, 100);
                    //        tableWidth -= that.columns[0].width;
                    //        columnsWithoutWidth.splice(0, 1);
                    //    }
                    //}

                    if (tableWidth / columnsWithoutWidth.length < 100) {
                        $.each(columnsWithoutWidth, function (k, i) {
                            that.columns[i].width = 100;
                            that.columns[i].widthHasBeenSetFromUs = true;
                        });
                    }
                } catch (e) {
                    console.log("grid column size error: " + e);
                }
            },
        }));

        kendo.ui.plugin(kendo.ui.ColumnMenu.extend({

            _init: function () {
                var that = this,
                    isMagicMenu = false;

                var gridName = $(that.element).closest('.k-grid').attr('gridname');

                that.pane = that.options.pane;
                if (that.pane) {
                    that._isMobile = true;
                }

                if (that._isMobile) {
                    that._createMobileMenu();
                } else {
                    if (typeof getMagicMultiValueColumns == "function" && (that.field in getMagicMultiValueColumns(gridName))) {
                        that._createMagicMenu();
                        isMagicMenu = true;
                    } else {
                        that._createMenu();
                    }
                    that.menu.destroy();
                    that.menu = that.wrapper.children()["kendoMenu"]({
                        orientation: "vertical",
                        openOnClick: true,
                        closeOnClick: true
                    }).data("kendoMenu");

                    //CHROME v 55.0.2883.87 FIX
                    that.menu.bind("close", function (e) {
                        var menuitem = $('[role=menuitem]:hover');
                        if (menuitem.length && menuitem[0] == e.item)
                            e.preventDefault();
                    });
                }

                that._angularItems("compile");

                if (isMagicMenu)
                    that._magicSort();
                else
                    that._sort();

                that._columns();

                if (isMagicMenu)
                    that._magicFilter();
                else
                    that._filter();

                that._lockColumns();

                that.trigger("init", { field: that.field, container: that.wrapper });
            },
            _createMagicMenu: function () {
                var that = this,
                    options = that.options;

                var gridName = $(that.element).closest('.k-grid').attr('gridname');

                that.wrapper.html(kendo.template('<ul>' +
                    '#if(sortable){#' +
                    '<li class="k-item k-sort-asc parent-sort-item"><span class="k-link k-sort-asc"><span class="k-sprite k-i-sort-asc"></span>${messages.sortAscending}</span><ul>' +
                    '#$.each(columnValues, function(k,v){#' +
                    '<li data-field="#=k#">#=v#</li>' +
                    '#})#' +
                    '</ul></li>' +
                    '<li class="k-item k-sort-desc parent-sort-item"><span class="k-link"><span class="k-sprite k-i-sort-desc"></span>${messages.sortDescending}</span><ul>' +
                    '#$.each(columnValues, function(k,v){#' +
                    '<li data-field="#=k#">#=v#</li>' +
                    '#})#' +
                    '</ul></li>' +
                    '#if(showColumns || filterable){#' +
                    '<li class="k-separator"></li>' +
                    '#}#' +
                    '#}#' +
                    '#if(showColumns){#' +
                    '<li class="k-item k-columns-item"><span class="k-link"><span class="k-sprite k-i-columns"></span>${messages.columns}</span><ul>' +
                    '#for (var idx = 0; idx < columns.length; idx++) {#' +
                    '<li><input type="checkbox" data-#=ns#field="#=columns[idx].field.replace(/\"/g,"&\\#34;")#" data-#=ns#index="#=columns[idx].index#" data-#=ns#locked="#=columns[idx].locked#"/>#=columns[idx].title#</li>' +
                    '#}#' +
                    '</ul></li>' +
                    '#if(filterable || lockedColumns){#' +
                    '<li class="k-separator"></li>' +
                    '#}#' +
                    '#}#' +
                    '#if(filterable){#' +
                    '<li class="k-item k-filter-item"><span class="k-link"><span class="k-sprite k-filter"></span>${messages.filter}</span><ul>' +
                    '<li><div class="k-content"><form class="k-filter-menu" ng-controller="MultiValueColumnFilterController as mvcf" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/MultiValueColumnFilter.html\'"></form></li>' +
                    '</ul></li>' +
                    '#if(lockedColumns){#' +
                    '<li class="k-separator"></li>' +
                    '#}#' +
                    '#}#' +
                    '#if(lockedColumns){#' +
                    '<li class="k-item k-lock"><span class="k-link"><span class="k-sprite k-i-lock"></span>${messages.lock}</span></li>' +
                    '<li class="k-item k-unlock"><span class="k-link"><span class="k-sprite k-i-unlock"></span>${messages.unlock}</span></li>' +
                    '#}#' +
                    '</ul>')({
                        ns: kendo.ns,
                        messages: options.messages,
                        sortable: options.sortable,
                        filterable: options.filterable,
                        columns: that._ownerColumns(),
                        showColumns: options.columns,
                        lockedColumns: options.lockedColumns,
                        columnValues: getMagicMultiValueColumns(gridName)[that.field]
                    }));

                that.popup = that.wrapper["kendoPopup"]({
                    anchor: that.link,
                    open: $.proxy(that._open, that),
                    activate: $.proxy(that._activate, that),
                    close: function () {
                        if (that.options.closeCallback) {
                            that.options.closeCallback(that.element);
                        }
                    }
                }).data("kendoPopup");

                that.menu = that.wrapper.children()["kendoMenu"]({
                    orientation: "vertical",
                    closeOnClick: false
                }).data("kendoMenu");
            },
            _magicSort: function () {
                var that = this;

                if (that.options.sortable) {
                    that.refresh();
                    that._refreshHandler = $.proxy(that.refresh, that);
                    that.dataSource.bind("change", that._refreshHandler);
                    that.menu.bind("select", function (e) {
                        var item = $(e.item),
                            parent = item.closest('.parent-sort-item'),
                            sortable = that.options.sortable,
                            dir;

                        if (parent.hasClass("k-sort-asc"))
                            dir = "asc";
                        else if (parent.hasClass("k-sort-desc"))
                            dir = "desc";
                        else
                            return

                        if (sortable === true || sortable.mode === "single") {
                            parent.parent().find('.parent-sort-item, .parent-sort-item .k-item').removClass('k-state-selected');
                        } else {
                            var parentSilbing = parent.parent().find(".k-sort-" + (dir == "asc" ? "desc" : "asc"));
                            parentSilbing.find('[data-field="' + item.data('field') + '"]').removeClass('k-state-selected');
                            if (!parentSilbing.find('.k-state-selected').length)
                                parentSilbing.removeClass('k-state-selected');
                        }
                        that._magicSortDataSource(item, parent, dir);
                    });
                }
            },
            _magicFilter: function () {
                var that = this,
                    options = that.options;
                var gridName = $(that.element).closest('.k-grid').attr('gridname');

                if (options.filterable !== false) {
                    initAngularController(that.wrapper.find("[ng-controller]"), "MultiValueColumnFilter", $.extend(
                        {
                            field: that.field,
                            columnFields: getMagicMultiValueColumns(gridName)[that.field],
                            dataSource: that.dataSource
                        }, options.filterable)
                    );
                }
            },
            _magicSortDataSource: function (item, parent, dir) {
                var that = this,
                    sortable = that.options.sortable,
                    compare = sortable.compare === null ? undefined : sortable.compare,
                    dataSource = that.dataSource,
                    idx,
                    length,
                    sort = dataSource.sort() || [],
                    field = item.data('field');

                if (item.hasClass('k-state-selected') && sortable && sortable.allowUnsort !== false) {
                    item.removeClass('k-state-selected');
                    if (!parent.find('.k-state-selected').length)
                        parent.removeClass('k-state-selected');
                    dir = undefined;
                } else {
                    item.addClass('k-state-selected');
                    parent.addClass('k-state-selected');
                }

                if (sortable === true || sortable.mode === "single") {
                    sort = [{ field: field, dir: dir, compare: compare }];
                } else {
                    for (idx = 0, length = sort.length; idx < length; idx++) {
                        if (sort[idx].field === field) {
                            sort.splice(idx, 1);
                            break;
                        }
                    }
                    sort.push({ field: field, dir: dir, compare: compare });
                }
                dataSource.sort(sort);
            }
        }));

        kendo.ui.plugin(kendo.ui.FilterMenu.extend({
            refresh: function () {
                var that = this;

                that.filterModel = kendo.observable({
                    logic: "or",
                    filters: [that._defaultFilter(), that._defaultFilter()]
                });

                var $el = $(that.element);

                // handling paste
                //setTimeout(() => {
                //    $el
                //        .closest('.k-filter-item')
                //        .on('mouseover', () => {
                //            setUniquePasteEvent((e, pasteData) => {
                //                that.parsePasteData(pasteData);
                //            });
                //        });
                //});

                $el
                    .parent()
                    .parent()
                    .css({ width: '600px' });

                that.createFilterMenu();
                that.addCustomPasteFilter($el);
            },
            addCustomPasteFilter($el) {
                const that = this;
                const filterMenuPt = $el.closest('.k-filter-item');
                const menuUl = filterMenuPt.closest('ul');
                if (menuUl.find('.paste-filter').length === 1) {
                    return;
                }
                const filterDuplicate = $(filterMenuPt.prop('outerHTML'));
                filterDuplicate.addClass('paste-filter');
                filterDuplicate.find('span.k-link')
                    .html('<span class="k-sprite k-filter"></span>Paste Filter<span class="k-icon k-i-arrow-e"></span>');
                const buttons = filterDuplicate.find('button[type=submit]').parent();
                const textarea = $('<textarea class="paste-filter-input" style="width:100%"></textarea>');
                filterDuplicate.find('.k-content form')
                    .html(textarea)
                    .append(buttons);
                menuUl.append(filterDuplicate);

                buttons.find('[type=submit]')
                    .on('click', (e) => {
                        e.preventDefault();
                        filterMenuPt.find('button[type=reset]')
                            .click();
                        that.parsePasteData(textarea.val());
                        textarea.val('');
                        filterMenuPt.find('button[type=submit]')
                            .click();
                    });

                buttons.find('[type=reset]')
                    .on('click', (e) => {
                        e.preventDefault();
                        textarea.val('');
                        that._reset();
                        // that.createFilterMenu(that.filterModel);
                        // filterMenuPt.find('button[type=reset]')
                        //     .click();
                    });
            },
            createFilterMenu(filterModel) {
                var that = this,
                    expression = that.dataSource.filter() || { filters: [], logic: "or" };
                that.filterModel = filterModel || that.filterModel;

                if (that.form) {

                    if (!that.table && that.type != "boolean") {
                        // add number format
                        if (that.type === 'number') {
                            var field = that.dataSource.options.fields
                            $.each(that.dataSource.options.fields, function (i, _field) {
                                if (_field.field === that.field) {
                                    field = _field;
                                    return false;
                                }
                            });

                            if (field && field.format) {
                                var formatMatch = field.format.match(/^\{\d*:(.+)\}$/);
                                if (formatMatch) {
                                    $(that.form[0][1])
                                        .add(that.form[0][4])
                                        .attr('data-format', formatMatch[1]);
                                }
                            }
                        }


                        //change html (wrap fields in table) if is first call
                        $(that.form[0][0]).add(that.form[0][3]).width('150px');
                        $(that.form[0][1]).add(that.form[0][4]).width('350px');
                        var templateId = that.field + '-' + Date.now(),
                            firstRow = $(that.form[0][0]).add($(that.form[0][1]).attr('data-template', templateId)).add(that.form[0][2]).wrapAll('<tr data-bind="attr: { class: filters[0].operator }" />').wrap('<td/>').closest('tr'),
                            secondRow = $(that.form[0][3]).add($(that.form[0][4]).attr('data-template', templateId)).wrapAll('<tr data-bind="attr: { class: filters[1].operator }" />').wrap('<td/>').closest('tr'),
                            elements = {
                                removeButton: $('<button title="' + getObjectText('removeCondition') + '" class="remove k-button"><span class="fa fa-minus"></span></button>'),
                                addButton: $('<button title="' + getObjectText('addCondition') + '" class="add k-button"><span class="fa fa-plus"></span></button>'),
                                newRowHtml: secondRow[0].outerHTML
                            };

                        secondRow.append(elements.addButton).append(elements.removeButton);
                        elements.addButton.add(elements.removeButton).wrapAll('<td />');
                        that.table = firstRow.add(secondRow).wrapAll('<table/>').parent();

                        //trigger add and remove buttons
                        elements.addButton.click(function () {
                            that.addFilterField(elements);
                            return false;
                        });
                        elements.removeButton.click(function () {
                            that.removeFilterField(secondRow, 1);
                            return false;
                        });
                        $(that.form).append('<script id="' + templateId + '" type="text/x-kendo-template"><div title="#: data.text #">#: data.text #</div></script >')
                    }

                    kendo.bind(that.form, that.filterModel);
                    that.elements = elements || that.elements;
                }

                if (that._bind(expression)) {
                    that.link.addClass("k-state-active");
                } else {
                    that.link.removeClass("k-state-active");
                }

                //if is first call add filter rows (if length > 2 -> 2 are standart) - do this also for pasted filters
                if (that.elements && that.filterModel.filters.length > that.table.find('tr').length) {
                    for (var i = 2; i < that.filterModel.filters.length; i++)
                        that.addFilterField(that.elements, i)
                } else if (that.table && that.table.children().length > that.filterModel.filters.length) {
                    var rows = that.table.children();

                    //move add btn to last filter row
                    rows.eq(that.filterModel.filters.length - 1)
                        .find('td:last-child')
                        .append(rows.last().find('.add'));

                    //delete unnecessary lines
                    rows
                        .filter(`:nth-child(n+${that.filterModel.filters.length + 1})`)
                        .remove();
                }
            },
            parsePasteData(pasteData) {
                var that = this;
                const dividers = [
                    '\n',
                    ',',
                    '|',
                ];
                let divider = dividers[0];
                // if string ends with newline, strip it - if you copy from excel always a newline is added
                if (pasteData[pasteData.length - 1] === '\n') {
                    pasteData = pasteData.substring(0, pasteData.length - 1);
                }
                for (const d of dividers) {
                    if (pasteData.includes(d)) {
                        divider = d;
                        break;
                    }
                }

                const filterValues = pasteData.split(divider);
                let filters = [];

                for (const filterValue of filterValues) {
                    filters.push({
                        field: that.field,
                        operator: 'eq',
                        value: filterValue,
                    });
                }

                that.filterModel = kendo.observable({
                    logic: "or",
                    filters,
                });

                // kendo.bind(that.form, that.filterModel);
                // that.createFilterMenu(that.filterModel);
            },
            addFilterField: function (elements, index) {
                var that = this,
                    i = index || that.filterModel.filters.length,
                    newRow = $(elements.newRowHtml.replace(/\[1\]/g, '[' + i + ']')),
                    removeButton = elements.removeButton.clone();

                //add html row
                that.table.append(newRow);
                newRow.append(elements.addButton).append(removeButton);
                elements.addButton.add(removeButton).wrapAll('<td />');

                //trigger remove button click
                removeButton.click(function () {
                    that.removeFilterField(newRow, i);
                    return false;
                });

                //add new default filter in filters, if not exists
                if (!index)
                    that.filterModel.filters.push(that._defaultFilter());

                kendo.bind(that.table, that.filterModel);
            },
            removeFilterField: function (row, index) {
                this.filterModel.filters.splice(index, 1);
                var rows = row.parent().children();
                rows.eq(rows.length - 2)
                    .find('td:last-child')
                    .append(rows.last().find('.add'));
                rows.last().remove();
            },
            _submit: function (e) {
                e.preventDefault();
                e.stopPropagation();

                //set/unset fakevalue if operator isnull or isnotnull
                for (var i = 0; i < this.filterModel.filters.length; i++) {
                    var filter = this.filterModel.filters[i];
                    if ((filter.operator == "isnull" || filter.operator == "isnotnull") && !filter.value)
                        filter.value = " ";
                    else if (filter.operator != "isnull" && filter.operator != "isnotnull" && filter.value === " ")
                        filter.value = "";
                }

                this.filter(this.filterModel.toJSON());

                this._closeForm();
            },
            _reset: function () {
                //remove rows
                for (var i = 1; i < this.filterModel.filters.length - 1; i++)
                    this.removeFilterField(this.table.children().eq(i), i);

                this.clear();
                this._closeForm();
            }
        }));

        kendo.ui.plugin(kendo.ui.TabStrip.extend({
            _scrollableAllowed: function () {
                var options = this.options;
                //check for dropdown tabs (make tabstrip not scrollable if there are dropdown tabs)
                return options.scrollable && !isNaN(options.scrollable.distance) && (options.tabPosition == 'top' || options.tabPosition == 'bottom') && !this.tabGroup.children(".dropdown").length;
            },
            _click: function (item) {
                var that = this,
                    link = item.find(".k-link"),
                    href = link.attr("href"),
                    collapse = that.options.collapsible,
                    contentHolder = that.contentHolder(item.index()),
                    prevent, isAnchor;

                if (item.closest(".k-widget")[0] != that.wrapper[0]) {
                    return;
                }

                if (item.is(".dropdown,.k-state-disabled" + (!collapse ? ",.k-state-active" : ""))) {
                    return true;
                }

                isAnchor = link.data("contentUrl") || (href && (href.charAt(href.length - 1) == "#" || href.indexOf("#" + that.element[0].id + "-") != -1));
                prevent = !href || isAnchor;

                if (that.tabGroup.children("[data-animating]").length) {
                    return prevent;
                }

                if (that.trigger("select", { item: item[0], contentElement: contentHolder[0] })) {
                    return true;
                }

                if (prevent === false) {
                    return;
                }

                if (collapse && item.is(".k-state-active")) {
                    that.deactivateTab(item);
                    return true;
                }

                if (that.activateTab(item)) {
                    prevent = true;
                }

                item.parent().find(".dropdown-menu > *").removeClass("k-state-active");
                if (item.is("[data-tab-id]")) {
                    var $el = item.parent().find(".dropdown-menu > [data-tab-id=" + item.data("tabId") + "]");
                    $el.addClass("k-state-active");
                    $el.closest(".dropdown").addClass("k-state-active");
                }

                return prevent;
            },
            remove: function (elements) {
                var that = this;
                var type = typeof elements;
                var contents;

                if (type === "string") {
                    elements = that.tabGroup.find(elements);
                } else if (type === "number") {
                    elements = that.tabGroup.children().eq(elements);
                }

                contents = elements.map(function () {
                    var content = that.contentElement($(this).index());
                    kendo.destroy(content);
                    return content;
                });

                elements.each(function () {
                    var tabId = $(this).data("tabId");
                    if (tabId) {
                        var element = that.tabGroup.find(".dropdown-menu > [data-tab-id=" + tabId + "]");
                        if (!element.siblings().length)
                            element.closest(".dropdown").remove();
                        else
                            element.remove();
                    }
                });

                elements.remove();
                contents.remove();

                that._updateContentElements();

                return that;
            }
        }));

        var alternativeNames = {
            'ComboBox': 'DropDownList',
            'DropDownList': 'ComboBox'
        };

        kendo.ui.Select.fn._parentWidget = function () {
            var that = this,
                name = that.options.name,
                parentElement = $('#' + this.options.cascadeFrom),
                parent = parentElement.data('kendo' + name);

            if (!parent) {
                parent = parentElement.data('kendo' + alternativeNames[name]);

                //parent is searchgrid
                if (!parent && parentElement.parent().is('[class*=searchgrid]')) {
                    var trigger = function (e, value, oldValue) {
                        //fake object with kendodropdonlist functions used in _cascadeSelect
                        that._cascadeSelect({
                            dataItem: function () {
                                return value;
                            },
                            _value: function () {
                                return value;
                            },
                            value: function () {
                                return value;
                            }
                        }, oldValue);
                    };
                    parentElement
                        .unbind("searchGridChange", trigger)
                        .on("searchGridChange", trigger);
                }
            }
            return parent;
        };

        kendo.mobile.ui.plugin(kendo.mobile.ui.ActionSheet.extend({
            open: function (target, context) {
                var that = this;
                that.target = $(target);
                that.context = context;
                that.shim.show(target);
                if (that.options.isDesktop) {
                    that.wrapper.addClass("desktop-action-sheet");
                    that.wrapper.css({
                        bottom: (window.innerHeight - that.wrapper.height()) / 2,
                        left: (window.innerWidth - that.wrapper.width()) / 2
                    });
                }
            }
        }));

        var autoCompleteInit = kendo.ui.AutoComplete.prototype.init;
        kendo.ui.plugin(kendo.ui.AutoComplete.extend({
            init: function (el) {
                autoCompleteInit.apply(this, arguments);
                if (el && el.id != "searchedtextautocomplete")  //avoids rewriting the autocomplete setting for the search menu input
                    $(el).attr('autocomplete', 'new-password');
            }
        }));

        // editor image insert with filepicker & base64 convertion
        var oldInsertImage = kendo.ui.editor.ImageCommand.fn.insertImage;
        var ImageCommand = kendo.ui.editor.ImageCommand.extend({
            insertImage: async function (img, range) {
                var files = Array.from(document.getElementById('k-editor-image-file').files)
                    .filter(file => file.type.startsWith('image/'));
                if (files.length) {
                    //new uploaded image
                    await new Promise((resolve, reject) => {
                        var reader = new FileReader();
                        reader.readAsDataURL(files[0]);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                    }).then(base64 => this.attributes.src = base64, () => null);
                } else if (this.attributes.src && this.attributes.src.startsWith(location.origin)) {
                    // image from url, but internal (same origin)
                    await new Promise(async (resolve, reject) => {
                        try {
                            var res = await fetch(attributes.src);
                            var blob = await res.blob();
                            var reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                        } catch (e) {
                            reject(e);
                        }
                    }).then(base64 => this.attributes.src = base64, () => null);
                }
                return oldInsertImage.apply(this, [img, range]);
            },
            _dialogTemplate: function (showBrowser) {
                return kendo.template('<div class="k-editor-dialog k-popup-edit-form k-edit-form-container">' + '# if (showBrowser) { #' + '<div class="k-filebrowser k-imagebrowser"></div>' + '# } #' +
                    '<div class=\'k-edit-label\'>' + '<label for="k-editor-image-file">#: messages.insertImage #</label>' + '</div>' + '<div class=\'k-edit-field\'>' + '<input type="file" accept="image/*" class="k-input k-textbox" id="k-editor-image-file">' + '</div>' +
                    '<div class=\'k-edit-label\'>' + '<label for="k-editor-image-url">#: messages.imageWebAddress #</label>' + '</div>' + '<div class=\'k-edit-field\'>' + '<input type="text" class="k-input k-textbox" id="k-editor-image-url">' + '</div>' +
                    '<div class=\'k-edit-label\'>' + '<label for="k-editor-image-title">#: messages.imageAltText #</label>' + '</div>' + '<div class=\'k-edit-field\'>' + '<input type="text" class="k-input k-textbox" id="k-editor-image-title">' + '</div>' +
                    '<div class=\'k-edit-label\'>' + '<label for="k-editor-image-width">#: messages.imageWidth #</label>' + '</div>' + '<div class=\'k-edit-field\'>' + '<input type="text" class="k-input k-textbox" id="k-editor-image-width">' + '</div>' +
                    '<div class=\'k-edit-label\'>' + '<label for="k-editor-image-height">#: messages.imageHeight #</label>' + '</div>' + '<div class=\'k-edit-field\'>' + '<input type="text" class="k-input k-textbox" id="k-editor-image-height">' + '</div>' +
                    '<div class="k-edit-buttons k-state-default">' + '<button class="k-dialog-insert k-button k-primary">#: messages.dialogInsert #</button>' + '<button class="k-dialog-close k-button">#: messages.dialogCancel #</button>' + '</div>' + '</div>')({
                    messages: this.editor.options.messages,
                    showBrowser: showBrowser
                });
            }
        });
        // ovwerwrite editor tool command (by registering with same name)
        kendo.ui.editor.ImageCommand = ImageCommand;
        kendo.ui.editor.EditorUtils.registerTool('insertImage', new kendo.ui.editor.Tool({
            command: ImageCommand,
            template: new kendo.ui.editor.ToolTemplate({
                template: kendo.ui.editor.EditorUtils.buttonTemplate,
                title: 'Insert Image'
            })
        }));
    })();
}

function kendoTabStripDropdownItemClick(e) {
    var $e = $(e),
        tabId = $e.data("tabId"),
        $tabStripItems = $e.closest(".k-tabstrip-items");
    $tabStripItems.children(".k-item[data-tab-id=" + tabId + "]").trigger("click");
}


//bootstraps an angular controller
//required values: element, name
function initAngularController(element, name, config, appName, isCustomController, fileName) {
    requireConfig(function () {
        let fileLocation = (window.serviceWorkerUrlPathPrefix ?? '')+(isCustomController ? window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Controllers/" + (fileName || name) + ".js" : window.includesVersion + '/Magic/Views/Js/Controllers/' + (fileName || name) + ".js");

        require(['angular', fileLocation ],
            function (angular, app) {
                if (!appName)
                    appName = name.replace("Controller", "");
                if (config && app)
                    app.value("config", config);
                angular.bootstrap(element, [appName]);
            });
    });
}

function getAngularControllerRootHTMLElement(controllerName, isCustomController, alias, onloadFunctionName, noInclude) {
    if (!alias)
        alias = controllerName.replace(/[a-z]+/g, "").toLowerCase();
    if (onloadFunctionName)
        onloadFunctionName = " onload=\"" + alias + "." + onloadFunctionName + "()\"";
    else
        onloadFunctionName = "";
    return $('<div class="' + controllerName.replace(/([a-z])+([A-Z])/g,
        function ($0, $1, $2) {
            return $1 + "-" + $2
        }).toLowerCase() + '" ng-controller="' + controllerName + 'Controller as ' + alias + '"' + (noInclude ? '' : ' ng-include="\'' + window.includesVersion + '/' + (isCustomController ? ("Views/" + window.ApplicationCustomFolder) : "Magic/Views") + '/Templates/' + controllerName + '.html\'"' + onloadFunctionName) + '>' + (noInclude ? "" : largeSpinnerHTML) + '</div>')[0];
}

function getAngularControllerElement(fileName, config, onloadFunctionName, noInclude, appName) {
    var pathInfo = getPathInfoFromJSFilename(fileName),
        controllerName = fileName.replace(".js", "").replace(/^Magic_/, ""),
        controllerRootElement = getAngularControllerRootHTMLElement(controllerName.replace(/Controller$/, ""), pathInfo.isCustom, null, onloadFunctionName, noInclude);
    initAngularController(controllerRootElement, controllerName, config, appName, pathInfo.isCustom, fileName);
    return controllerRootElement;
}

function requireConfigAndMore(includes, fn) {
    requireConfig(function () {
        require(includes, fn);
    });
}

function requireConfig(fn) {
    require([(window.serviceWorkerUrlPathPrefix??'')+window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/config.js"], function () {
        fn();
    });
}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    //force version management    
    ss.href = window.includesVersion + (href.startsWith("/") ? "" : "/") + href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}

function includejs(href) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    //force version management    
    script.src = window.includesVersion + (href.startsWith("/") ? "" : "/") + href;
    head.appendChild(script);
}

function createCopy(e) {
    var $grid = $(e.target).closest("[data-role=grid]"),
        grid = $grid.data("kendoGrid"),
        editable = grid.getOptions().editable,
        editMode = typeof editable == 'object' ? editable.mode : editable,
        model = grid.dataSource.options.schema.model,
        data = this.dataItem($(e.target).closest("tr")),
        firstDataCell = null,
        newData = {},
        newRow,
        $newRow;

    if (editable === false)
        return false;

    $.each(model.fields, function (field, v) {
        if (!("uploadInfo" in v))
            newData[field] = data[field];
    });

    //set a fake primary key to create the row in html
    newData[model.id] = Number.MAX_SAFE_INTEGER;
    newRow = grid.dataSource.insert(0, newData);
    //reset the primary key
    newRow[model.id] = newRow.id = 0;
    $newRow = $grid.find('tr[data-uid="' + newRow.uid + '"]');

    if (editMode == 'popup') {
        grid.editRow($newRow);
    } else {
        $.each(grid.columns, function (k, v) {
            if (v.field && (v.field in data) && model.fields[v.field].editable)
                firstDataCell = k;
            return !firstDataCell;
        });

        if (firstDataCell)
            grid.editCell($newRow.find('td[role=gridcell]').eq(firstDataCell));
    }
}

function exportConfig(e) {
    var rowdata = getRowDataFromButton(e);
    doModal(true);
    $.ajax({
        type: "POST",
        url: "/api/MAGIC_DEPLOYS/ExportConfigurationsToDestination",
        data: JSON.stringify(rowdata),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            kendoConsole.log(res.message, false);
            $("#grid").data("kendoGrid").dataSource.read();
            doModal(false);
        },
        error: function (err) {
            kendoConsole.log(err.responseText, true);
            $("#grid").data("kendoGrid").dataSource.read();
            doModal(false);
        }
    });

}

//#region history
function historyColumn(entityName, botype, boDescriptionColumn) {
    return '<div style="text-align:center;"><span class="glyphicon glyphicon-list-alt" style="cursor:pointer;"  onclick="recordHistory(this,\'' + entityName + '\',\'' + botype + '\',\'' + boDescriptionColumn + '\')"  class="glyphicon glyphicon-th-list"></span></div>';
}
function recordHistory(e, entityName, botype, boDescriptionColumn) {
    if (!botype)
        botype = entityNameBoTypeMapping[entityName];
    var kendoTooltip = $(e).data("kendoTooltip");
    window.jqueryEditRefTreeGrid = { jqgrid: $(e).closest(".k-grid"), jrow: $(e).closest(".k-grid tr") };
    window.jqueryEditRefTreeGrid.rowData = window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataItem(window.jqueryEditRefTreeGrid.jrow);


    if (kendoTooltip) {
        kendoTooltip.show();
    } else {
        var rowdata = getRowDataFromButton(e),
            pk = $(e).closest(".k-grid").data("kendoGrid").dataSource.options.schema.model.id;

        //$.ajax({
        //    type: "POST",
        //    url: "/api/DocumentRepository/GetCount",
        //    data: JSON.stringify({
        //        bOId: rowdata[pk],
        //        bOType: botype
        //    }),
        //    contentType: "application/json; charset=utf-8",
        //    dataType: "json",
        //    success: function (res) {
        //        var counts = JSON.parse(res),
        var actions = [];
        //actionsobj = {
        //    M: { id: 2, Type: getObjectText("messages"), Typeid: 2, Classid: 1, Class: "Log", actionDescription: "Mail", actiontype: "mail", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-envelope", botype: botype, count: 0 },
        //    DC: { id: 3, Type: getObjectText("messages"), Typeid: 2, Classid: 1, Class: "Log", actionDescription: "Chat", actiontype: "chat", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-comment", botype: botype, count: 0 },
        //    ME: { id: 4, Type: getObjectText("messages"), Typeid: 2, Classid: 1, Class: "Log", actionDescription: "Memo/Note", actiontype: "memo", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-pencil", botype: botype, count: 0 }
        //};
        //for (var i = 0; i < counts.length; i++)
        //    if (counts[i].Code in actionsobj)
        //        actionsobj[counts[i].Code].count = counts[i].Count;
        //actions = $.map(actionsobj, function (v) { return [v]; });
        if (typeof showEventGrid == "function") //To be defined in AdminAreaCustomizations.js for each solution
            actions.unshift({ id: 1, Typeid: 1, Type: "Eventi", Classid: 1, Class: "Log", actionDescription: "Log eventi", actiontype: "EVTGD", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-list-alt", botype: botype });
        if (window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").options.gridExtension && window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").options.gridExtension.snapshot)
            actions.push({ id: 5, Typeid: 3, Type: "Snapshots", Classid: 1, Class: "Log", actionDescription: getObjectText("snapshottable"), actiontype: "SNAGD", actiontypeid: 1, actioncommand: $(e).closest(".k-grid").attr("gridname"), actioniconclass: "glyphicon glyphicon-list-alt", botype: botype })

        actions.push({ id: 6, Type: getObjectText("calendar"), Typeid: 4, Classid: 2, Class: getObjectText("task"), actionDescription: getObjectText("show"), actiontype: "FILTERCAL", actiontypeid: 2, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-calendar", botype: botype });


        $(e).kendoTooltip({
            position: "left",
            showOn: "click",
            autoHide: false,
            content: function () {
                return build3LevelBootstrapAccordion({ recordid: rowdata[pk], currentTarget: e, actions: actions, description: rowdata[boDescriptionColumn] }, "refactionsaccordion-" + rowdata[pk], actionLinkBuilder);
            },
            width: "250px"
        }).data("kendoTooltip").show();
        //}
        //});
    }

    return false;
}
function actionLinkBuilder(data) {
    return "javascript:showReader('" + data.actioncommand + "'," + data.boid + ",'" + data.actiontype + "','" + data.botype + "','" + data.bodescription + "')";
}
//#endregion

//#region actions and wkf
//action dispatch 
function dispatchAction(e, jsonpayload) {
    requireConfigAndMore(["MagicActions"], function (magic) {
        switch (jsonpayload.actiontype) {
            case "RTFUN":
                launchActionFunction(e, jsonpayload); $("#wndmodalContainer").modal('hide');
                break;
            case "NEWGD":
            case "EDTGD":
                editActionGrid(e, jsonpayload);
                break;
            case "JSFUU":
                launchActionJsFunction(e, jsonpayload);
                break;
            case "SQLPU":
                launchStoredProcedure(e, jsonpayload);
                break;
            case "OPURL":
                openURLInNewWindow(e, jsonpayload);
                break;
            case "SHOGD":
                showGrid(e, jsonpayload);
                break;
            //#region REFTREE ONLY
            case "R3BDOC":
                launchReftreeBuildDocumentFromModel(e, jsonpayload);
                break;
            case "R3ASTG":
                launchReftreeAssetGallery(e, jsonpayload);
                break;
            case "CUSTFORM": //an html page initialized with an angular 1 controller. Default is FormOptionsController
                launchCustomForm(e, jsonpayload);
                break;
            case "EXCIMP": //import excel models
                launchExcelImport(e, jsonpayload);
                break;
        }
    });
}
//launch an action from a button 
//eg. of payload {"actiontype":"EDTGD","actionfilter":{ "field":"Magic_MessageID","operator":"eq","value":"@24"} , "actioncommand":"Magic_Messages"}
function launchActionFromButton(e) {
    var jsonpayload = {};
    try {
        jsonpayload = getRowJSONPayload(e);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }
    jsonpayload.rowData = getRowDataFromButton(e);
    //depending on the click binding (jquery click or html onclick)
    var selector = (e.currentTarget ? e.currentTarget : e);
    jsonpayload.jqgrid = $(selector).closest(".k-grid");
    jsonpayload.jrow = $(selector).closest(".k-grid tr");
    if (!jsonpayload.actiontype || !jsonpayload.actioncommand)
        console.log("actioncommand or actiontype not provided");
    dispatchAction(e, jsonpayload);
}

//get actions for a set of selected rows in underlying grid from toolbar button click
function getActionFromToolbarButton(e) {
    var targetgrid = getGridFromToolbarButton(e);
    var jsonpayload = JSON.parse(toolbarbuttonattributes[$(e).attr("id")].jsonpayload);
    if (!jsonpayload.storedProcedure) {
        console.error("define a stored procedure which gets the actions");
        return;
    }
    var ids = $.map(getAllSelectedRowsFromGrid(e), function (v, i) {
        return v.toJSON ? v.toJSON() : v;
    });
    //Build the actions
    openActionsTooltip({
        requestOptions: {
            ids: ids, // handle selezionati
            caller: targetgrid.element.attr('gridname'),
            gridData: {
                gridname: targetgrid.element.attr('gridname'),
                pk: targetgrid.dataSource.options.schema.model.id
            },
            user_latitude: usersGeoLocation ? usersGeoLocation.coords.latitude : null,
            user_longitude: usersGeoLocation ? usersGeoLocation.coords.longitude : null
        },
        storeProcedureName: jsonpayload.storedProcedure,
        accordionId: "multiActionsAccordion",
        element: $(e),
        actionrefs: {
            button: e,
            actionCallback: function () {
                targetgrid.dataSource.read();
            }
        }
    });

}

///template of the Actions column
function getcolumnforaction(entityName, dbcalls) {
    if (!dbcalls)
        dbcalls = JSON.stringify(["stageactions"]); //solo actions che dipendono dallo "stato" del record
    var buttondrop = '<div style="text-align:center;"><span title="Record status actions" class="glyphicon glyphicon-th-list" style="cursor:pointer;"  onclick="getfunctionsforRecord(this,\'' + entityName + '\',\'' + dbcalls + '\')"  class="glyphicon glyphicon-th-list">\
                    </span></div>';
    return buttondrop;
}
function getCurrentFunctionGUIDFromMenu() {
    var guid = null;
    try {
        var $menuPt = $(".menuId-" + getMagicAppURIComponents().menuId);
        if ($menuPt.length) {
            guid = $menuPt.find("a").data().guid;
        }
    }
    catch (e) {
        console.log("FunctionGUID is not set");
    }
    return guid;
}
function getfunctionsforRecord(e, entityName, dbcalls) {
    if (dbcalls)
        dbcalls = dbcalls.split(',');
    else
        dbcalls = ["stageactions"];
    var functionGUID = getCurrentFunctionGUIDFromMenu();
    var rowdata = getRowDataFromButton(e);
    window.jqueryEditRefTreeGrid = { jqgrid: $(e).closest(".k-grid"), jrow: $(e).closest(".k-grid tr") };
    window.jqueryEditRefTreeGrid.rowData = window.jqueryEditRefTreeGrid.jqgrid.data("kendoGrid").dataItem(window.jqueryEditRefTreeGrid.jrow);
    var pk = $(e).closest(".k-grid").data("kendoGrid").dataSource.options.schema.model.id;
    var gridname = $(e).closest(".k-grid").attr("gridname")
    requireConfigAndMore(["MagicActions"], function (magic) {
        //id 3o livello , class: 1o liv , Type : 2oliv 
        $.each(dbcalls, function (i, v) {
            var position = v == "stageactions" ? "left" : "right"
            var accordionid = position == "right" ? ("refactionsaccordion_" + position) : "refactionsaccordion";
            $.ajax({
                type: "POST",
                url: "/api/EVENTS/GetRecordActions/",
                data: JSON.stringify({ entityname: entityName, id: rowdata.id, pk: pk, queryType: v, functionGUID: functionGUID, gridName: gridname }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    var boid = rowdata.id;
                    if (result.length > 0) {
                        //var mock = [{ id: 10, Typeid: 1, Type: "Registrazione firma contratto", Classid: 1, Class: "Modifiche Asset", Catid: 12, actionid: 1, actionDescription: "Link1", actiontype: "Open Stored Procedure", actiontypeid: 1, actioncommand: '{"SP":"dbo.prova"}' },
                        //               { id: 10, Typeid: 1, Type: "Validazione contratto", Classid: 1, Class: "Modifiche Asset", Catid: 12, actionid: 1, actionDescription: "Link1", actiontype: "Open Stored Procedure", actiontypeid: 1, actioncommand: '{"SP":"dbo.prova"}' },
                        //           ];
                        var actions = [];
                        $(result).each(function (i, v) {
                            var act = {};
                            act.id = v.ActionId;
                            act.Typeid = v.TypeId;
                            act.Type = v.Type;
                            act.Classid = v.ClassId;
                            act.Class = v.Class;
                            act.actionDescription = v.ActionDescription;
                            act.actiontype = v.ActionType;
                            act.actioncommand = v.ActionCommand;
                            act.actionfilter = v.ActionFilter;
                            act.actioniconclass = v.ActionIconClass;
                            act.actionbackgroundcolor = v.ActionBackgroundColor;
                            act.typeiconclass = v.TypeIconClass;
                            actions.push(act);
                        });


                        $("#" + accordionid).remove();
                        //e e' l' action span 
                        $(e).kendoTooltip({
                            position: position,
                            showOn: "click",
                            autoHide: false,
                            hide: function () {
                                $(this.popup.element[0]).closest('.k-animation-container').remove();
                            },
                            content: function () {
                                return build3LevelBootstrapAccordion({ recordid: boid, currentTarget: e, actions: actions }, accordionid, actionLinkReferenceBuilder);
                            },
                            width: "250px"
                        }).trigger("tooltipCreated");
                        $(e).data("kendoTooltip").show();
                        setActionSettings(actions, "actionsettings", accordionid);
                        setActionSettings(null, "subsettings");
                    }
                    else {
                        $(e).kendoTooltip({
                            position: position,
                            showOn: "click",
                            autoHide: false,
                            hide: function () {
                                $(this.popup.element[0]).closest('.k-animation-container').remove();
                            },
                            content: function () {
                                return getObjectText("noactionfound");
                            },
                            width: "250px"
                        }).trigger("tooltipCreated");

                        $(e).data("kendoTooltip").show();
                    }
                    if (position == "right")
                        $("#" + accordionid).parents(".k-tooltip").css("background-color", "rgb(156, 161, 189)");
                },
                error: function (result) {
                    kendoConsole.log("Errore nel reperimento delle funzioni per record", true);
                }
            });
        });
    });
    return;
}

function getcolumnforactionworkflow(dataItem) {
    var curract = '';
    var html = '<div class="actdiv{0}" style="text-align:center;"><span title="Workflow" class="glyphicon glyphicon-tasks" style="cursor:pointer;"  onclick="getlistofWfActions(this)"  class="glyphicon glyphicon-th-list"></span></div>';
    var progressbar = '';
    var type = "success";
    var progress = 100;
    if (dataItem.WorkflowActivity) {
        var wact = JSON.parse(dataItem.WorkflowActivity.replace(/\\t/g, "")),
            lang = window.culture.substring(0, 2);
        if (wact.status && ("progress" in wact)) {
            progressbar = '<div class="progress pull-left" style="height: 20px; width: calc(100% - 20px);"><div class="progress-bar progress-bar-{1}" role="progressbar" aria-valuenow="{0}" aria-valuemin="0" aria-valuemax="100" style="width:{0}%">{0}%</div></div>';
            switch (wact.status) {
                case "failure":
                    type = "danger";
                    break;
                case "complete":
                    type = "success";
                    break;
                case "inprogress":
                    type = "info";
                    progress = wact.progress;
                    break;
                default:
                    type = "info";
            }
            progressbar = progressbar.format(progress, type);
            curract = '<span>' + (wact.currentActivityTranslations && (lang in wact.currentActivityTranslations) ? wact.currentActivityTranslations[lang] : wact.currentActivity) || '' + '</span>';
        }
    }

    return curract + progressbar + html.format(progressbar ? " pull-right" : "");
}

function getlistofWfActions(el) {
    requireConfigAndMore(["MagicActionsWorkflow"], function () {
        getWfActionsList(el);
    })
}
//#actions



//#region Show Mail/Chats/notes and logs
function showReader(entityName, BOId, type, boType, boDescription) {
    if (!boType || boType == "undefined")
        boType = entityNameBoTypeMapping[entityName];
    var $container = cleanModal();
    $("#wndmodalContainer").addClass("modal-wide");
    $container.html(getDataReaderHtml(type == "SNAGD" ? true : null));
    var config = {};
    if (type === "SNAGD" || type == "EVTGD" || type == "FILTERCAL") {
        if (type === "EVTGD")
            showEventGrid(entityName, BOId, boType);
        else if (type == "SNAGD") {
            $("#wndmodalContainer").removeClass("modal-wide");
            $("#wndmodalContainer").addClass("modal-full");
            config = { gridname: entityName, Id: BOId };
            initAngularController($container.find('div'), "SnapShotsController", config);
            $(".modal-title").text('Snapshots');
            $("#wndmodalContainer").modal('show');
            return;
        }
        else if (type == "FILTERCAL") {
            window.open('/app?boId={0}&boType={1}&boDescription={2}&filterBO=true#/calendar'.format(BOId, boType, boDescription ? boDescription.replace('#', '') : ""), '_blank');
            return;
        }
    }
    else

        var ajaxData = { BusinessObjectType: boType, BusinessObject_ID: "" + BOId, TransmissionMode: type };
    var ajaxUrl = "/api/DocumentRepository/GetDocumentRepository";
    if (type === "chat") {
        config = {
            filterKeys: ["DocumentFile.current.From", "DocumentFile.UploadedFile", "Type"],
            dataList: function ($http, $q) {
                var deferred = $q.defer();
                $http.post(ajaxUrl, ajaxData)
                    .then(function (res) {
                        if (res.data.Data && res.data.Data.length) {
                            $.each(res.data.Data[0].Table, function (k, v) {
                                if (res.data.Data[0].Table[k].DocumentFile && typeof res.data.Data[0].Table[k].DocumentFile == 'string' && res.data.Data[0].Table[k].DocumentFile.trimStart()[0] == "{") {
                                    res.data.Data[0].Table[k].DocumentFile = JSON.parse(v.DocumentFile);
                                    res.data.Data[0].Table[k].Type = "messages";
                                }
                                else {
                                    res.data.Data[0].Table[k].DocumentFile = { UploadedFile: v.DocumentFile };
                                    res.data.Data[0].Table[k].Type = "shared file";
                                }
                            });
                            deferred.resolve(res.data.Data[0].Table);
                        }
                        else
                            deferred.reject();
                    }, function () {
                        deferred.reject();
                    });
                return deferred.promise;
            },
            contentTemplate: function (object) {
                var html = '<div>' + new Date(object.InsertionDate).toLocaleString() + '</div>';
                if (object.DocumentFile.UploadedFile)
                    return html += 'Link: <a target="_blank" href="' + object.DocumentFile.UploadedFile + '">' + object.DocumentFile.UploadedFile + '</a>';
                html += '<div class="generic-bubble"><div>' + object.DocumentFile.current.From + '</div>' + object.DocumentFile.current.Text + '</div>';
                $.each(object.DocumentFile.history, function (k, v) {
                    html += '<div class="generic-bubble"><div>' + v.From + ' - ' + new Date(v.Received).toLocaleString() + '</div>' + v.Text + '</div>'
                });
                return html;
            },
            listTemplate: function (object) {
                var html = '<div class="list">';
                if (object.DocumentFile.UploadedFile)
                    html += "Shared file: " + object.DocumentFile.UploadedFile.replace(/^.*\\/, "") + " - " + (object.InsertionDate ? new Date(object.InsertionDate).toLocaleString() : "");
                else
                    html += "Messages: <b>" + object.DocumentFile.current.From + '</b> - ' + (object.DocumentFile.current.Timestamp ? new Date(object.DocumentFile.current.Timestamp).toLocaleString() : "");
                return html += '</div>';
            }
        };
        $(".modal-title").text('Chat');
    } else if (type === "memo") {
        config = {
            filterKeys: ["DocumentFile"],
            dataList: function ($http, $q) {
                var deferred = $q.defer();
                $http.post(ajaxUrl, ajaxData)
                    .then(function (res) {
                        if (res.data.Data && res.data.Data.length) {
                            deferred.resolve(res.data.Data[0].Table);
                        }
                        else
                            deferred.reject();
                    }, function () {
                        deferred.reject();
                    });
                return deferred.promise;
            },
            contentTemplate: function (object) {
                var html = '<div>' + new Date(object.InsertionDate).toLocaleString() + '</div>';
                if (object.DueDate)
                    html += '<div>Due Date:&nbsp;' + new Date(object.DueDate).toLocaleString() + '</div>';
                html += '<div class="generic-bubble">' + object.DocumentFile + '</div>';
                return html;
            },
            listTemplate: function (object) {
                var html = '<div class="list">';
                html += object.DocumentFile;
                return html += '</div>';
            }
        };
        $(".modal-title").text('Memo/Note');
    } else {
        //replace html, head, body tags and invalid tags like <o:p></o:p>
        var outlookCleanerRegex = new RegExp('<html[^>]+>[\\s\\S]*<body[^>]*>|<\/body>[\\s\\S]*<\/html>|<\/?\\w+:\\w>', 'g');
        config = {
            filterKeys: ["DocumentFile"],
            dataList: function ($http, $q) {
                var deferred = $q.defer();
                $http.post(ajaxUrl, ajaxData)
                    .then(function (res) {
                        if (res.data.Data && res.data.Data.length) {
                            res.data.Data[0].Table = $.map(res.data.Data[0].Table, function (v) {
                                v.htmlId = "object-" + v.ID;
                                v.DocumentFile = v.DocumentFile.replace(outlookCleanerRegex, '');
                                //fix styles in content
                                v.DocumentFile = v.DocumentFile.replace(/<style([^>]*)>([\S\s]+?)<\/style>/gi, function (match, attr, style) {
                                    style = style.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, function (match, selector) {
                                        return match.replace(selector, "#" + v.htmlId + " " + selector.replace(/body|html/, ''));
                                    });
                                    return '<style' + attr + '>' + style + '</style>'
                                });
                                return v;
                            });
                            deferred.resolve(res.data.Data[0].Table);
                        }
                        else
                            deferred.reject();
                    }, function () {
                        deferred.reject();
                    });
                return deferred.promise;
            },
            contentTemplate: function (object) {
                var html = '<div>' + new Date(object.InsertionDate).toLocaleString() + '</div>';
                html += '<div class="generic-bubble" id="' + object.htmlId + '">' + object.DocumentFile + '</div>';
                return html;
            },
            listTemplate: function (object) {
                var html = '<div class="list">';
                html += object.DocumentFile.match(/([\s\S]+?<br>(Ogetto|Subject):[\s\S]+?)<br>/)[1];
                return html += '</div>';
            }
        };
        $(".modal-title").text('Mail');
    }
    initAngularController($container.find('div'), "DataReaderController", config);
    $("#wndmodalContainer").modal('show');
}

function cleanModal() {
    $("#wndmodalContainer").removeClass("modal-full");
    var $modal = $("#wndmodalContainer").removeClass("modal-wide");
    $modal.find(".modal-title").html('');
    $modal.find(".modal-footer").show().html('');
    var $content = $modal.find("#contentofmodal").empty();
    $modal.find("#executesave").unbind("click");
    $modal.find("#executesave").hide();
    return $content;
}

//wide: bool, content: string, title: string, footer: string, onClose: function
function showModal(config, dontClean) {
    var $modal = $("#wndmodalContainer"),
        $content;
    if (!config)
        config = {};
    if (!dontClean)
        $content = cleanModal();
    else
        $content = $modal.find("#contentofmodal");
    if (config.content) {
        if (typeof config.content == "string")
            $content.html(config.content);
        else
            $content.html('').prepend(config.content);
    }
    if (config.title)
        $modal.find(".modal-title").html(config.title);
    if (config.footer)
        $modal.find(".modal-footer").html(config.footer);
    else
        $modal.find(".modal-footer").hide();
    if (config.wide)
        $modal.addClass("modal-wide");
    if (config.onClose)
        $modal.one('hidden.bs.modal', config.onClose);

    $("#wndmodalContainer").removeAttr("z-index");
    if (config.zIndex)
        $("#wndmodalContainer").css({ "z-index": config.zIndex });


    $modal.modal('show');
    return $content;
}

function hideModal() {
    $("#wndmodalContainer").modal('hide');
}

function getDataReaderHtml(snapshot) {
    if (snapshot)
        return '<div ng-controller="SnapShotsController as ss" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/SnapShot.html\'"></div>';
    return '<div ng-controller="DataReaderController as drc" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/DataReader.html\'"></div>';
}
//#endregion

function jsonStringEscape(str) {
    try {
        JSON.parse(str);
        return str;
    }
    catch (exc) {
        return str
            .replace(/\\/g, "\\\\")
            .replace(/[\n]/g, '')
            .replace(/\r?\n|\r/g, "");

    }
}

function escapeHtml(html, shallFormat) {
    //((<[^\/]+?>)[\n\s]*((<[^\/]+?>[\n\s]*?)+|(<[^\/]+\/[\s]*>[\n\s]*?)))|((<\/[^>]+>|<[^\/]+\/[\s]*>)([\n\s]*<\/[^>]+>)+)
    if (shallFormat) {
        return html
            .replace(/</g, "&lt;")
            .replace(/(>)[/s]*(&lt;)/g, function (match, match1, match2) {
                return match1 + "<br>" + match2;
            });
    }
    return html.replace(/</g, "&lt;");
}

function initManageCultureDropdownFilter($grid, cultureCol) {
    var grid = $grid.data("kendoGrid"),
        cultureFilter = getFiltersByType(grid.dataSource.filter(), "cultureFilter");

    var dropDown = $grid.find("#culture").kendoDropDownList({
        dataTextField: "Magic_LanguageDescription",
        dataValueField: "Magic_CultureID",
        value: cultureFilter && cultureFilter.value ? cultureFilter.value : (window.SessionCultureID || ""),
        autoBind: true,
        index: 0,
        dataBound: function () {
            var value = this.value();
            if (value) {
                grid.dataSource.filter(combineDataSourceFilters(grid.dataSource.filter(), {
                    field: cultureCol,
                    operator: "eq",
                    value: value,
                    type: "cultureFilter"
                }));
            } else {
                grid.dataSource.filter(removeFiltersByType(grid.dataSource.filter(), "cultureFilter"));
            }
        },
        dataSource: {
            data: "{}",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            transport: {
                read: "/api/Magic_Cultures/GetAllManagedCultureLanguages"
            }
        },
        change: function () {
            var value = this.value();
            if (value) {
                grid.dataSource.filter(combineDataSourceFilters(grid.dataSource.filter(), {
                    field: cultureCol,
                    operator: "eq",
                    value: value,
                    type: "cultureFilter"
                }));
            } else {
                grid.dataSource.filter(removeFiltersByType(grid.dataSource.filter(), "cultureFilter"));
            }
        }
    });
}

function openfastlink(src, titlecode) {
    resetMenu();
    $(".breadcrumb").empty();
    var title = getObjectText(titlecode);
    $("#appcontainer").html(largeSpinnerHTML);
    $("#spanbig").text(title);
    $.getScript(src, function (data, textStatus, jqxhr) {
        loadscript();
    });
}

//pass in a instance of Date
function toTimeZoneLessString(date) {
    date.setTime(date.getTime() - date.getTimezoneOffset() * 60000);
    return date.toISOString().replace("Z", "");
}

function allPropertiesToTimeZoneLessString(objectOrArray) {
    $.each(objectOrArray, function (k, v) {
        if (v) {
            if (v instanceof Date)
                objectOrArray[k] = toTimeZoneLessString(v);
            //child grid data condition (typeof v == "object" &&v["__action"]) due to kendo change of constructor
            else if (Array.isArray(v) || v.constructor == Object || (typeof v == "object" && v["__action"]))
                allPropertiesToTimeZoneLessString(v);
        }
    });
    return objectOrArray;
}

function allPropertiesToTimeZoneLessString_full(objectOrArray) {
    $.each(objectOrArray, function (k, v) {
        if (v) {
            if (v instanceof Date)
                objectOrArray[k] = toTimeZoneLessString(v);
            //child grid data condition (typeof v == "object" &&v["__action"]) due to kendo change of constructor
            else if (Array.isArray(v) || v.constructor == Object || (typeof v == "object"))
                allPropertiesToTimeZoneLessString_full(v);
        }
    });
    return objectOrArray;
}

function addGridInfo(gridData) {
    initGridInfo();
    if (gridData.GUID && !(gridData.MagicGridName in gridInfo)) {
        gridInfo[gridData.MagicGridName] = gridData.GUID;
        sessionStorage.gridGuidMapping = JSON.stringify(gridInfo);
    }
}

function getGridIdFromGridInfo(gridName) {
    if (!gridName)
        return;
    initGridInfo();
    if (!gridInfo[gridName]) {
        $.ajax({
            url: manageAsyncCallsUrl(false, "/api/Magic_Grids/GetGUIDByName/" + gridName),// "/api/Magic_Grids/GetGUIDByName/" + gridName,
            async: false,
            success: function (res) {
                addGridInfo({ MagicGridName: gridName, GUID: res });
            }
        });
    }
    return gridInfo[gridName];
}

function initGridInfo() {
    if (typeof gridInfo === 'undefined') {
        gridInfo = sessionStorage.gridGuidMapping ? JSON.parse(sessionStorage.gridGuidMapping) : {};
    }
}

//session storage handling
function addToSessionObject(objectName, key, value, overwrite) {
    var store = getSessionObject(objectName);
    if (!overwrite && (key in store))
        return;
    store[key] = value;
    sessionStorage[objectName] = JSON.stringify(store);
}

function getSessionObject(objectName) {
    if (!sessionStorage[objectName])
        return {};
    else
        return JSON.parse(sessionStorage[objectName]);
}

function getFromSessionObject(objectName, key) {
    return getSessionObject(objectName)[key];
}

function dehunzi(str) {
    //str.substring(1, str.length - 2);
    return str
        //wrap keys without quote with valid double quote
        .replace(/(({|\[|,)\s*)([\$\w]+)\s*:/g, function (_, $1, $2, $3) {
            return $1 + '"' + $3 + '":'
        })
        //escape functions
        .replace(/:[\s]*(function[\s]*.*?)(,[\s]*"|}[\s]*})/g, function (_, $1, $2) {
            return ': "function##' + $1.replace(/"/g, "'") + '"' + $2;
        })
        //replacing single quote wrapped ones to double quote 
        .replace(/(({|\[|,|:)\s*)'([^']+)'(\s*(?!$2)(}|\]|,|:))/g, function (_, $1, $2, $3, $4) {
            return $1 + '"' + $3.replace(/"/g, "'") + '"' + $4;
        })
        //escape variable calls
        .replace(/"\s*:\s?([\w][^,}]*)/g, function (_, $1) {
            var returnValue = "\": ";
            if ($1 == "true" || $1 == "false" || $1 == "null" || !isNaN($1))
                return returnValue + $1;
            else
                return returnValue + '"function##' + $1 + '"';
        })
        ;
}

function deepEvalEscapedJSONFunctions(object, scope) {
    $.each(object, function (k, v) {
        var type = typeof v;
        if (type === 'string' && v.indexOf('function##') === 0) {
            eval("object[k] = " + v.substring(10));
            if (scope) {
                var fn = object[k];
                object[k] = function () {
                    return fn.apply(scope, arguments);
                };
            }
        }
        else if (type === 'object')
            deepEvalEscapedJSONFunctions(v, scope);
    });

    return object;
}

function loadCss(arrayOfCssFileNames, path) {
    if (!path)
        path = (window.serviceWorkerUrlPathPrefix ?? '') + window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Styles/3rd-party/";
    if (typeof asyncCss == "undefined")
        asyncCss = {};
    for (var i = 0; i < arrayOfCssFileNames.length; i++) {
        if (arrayOfCssFileNames[i] in asyncCss)
            continue;
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = path + arrayOfCssFileNames[i] + ".css";
        document.getElementsByTagName("head")[0].appendChild(link);
    }
}

function setInputValueFromColumnModel($input, columnData) {
    if (!columnData)
        columnData = $input.data("columnData");
    if (columnData.model[columnData.field]) {
        $.each(columnData.values, function (k, v) {
            if (v.value == columnData.model[columnData.field]) {
                setTimeout(function () {
                    $input.val(v.text);
                });
                return false;
            }
        });
    }
    else
        setTimeout(function () {
            $input.val("");
        });
}

function openSearchgrid2(tableName, tableColumnName, valueName, keyName, input, cascadeFromColumn, cascadeFilterColumn, operator, isInline) {
    var timeout, gridModel;
    var $input = $(input).prop('onfocus', null).off('focus');
    if ($input.parent().hasClass('k-state-disabled')) {
        $input.prop("disabled", true);
        return;
    }

    if (cascadeFromColumn == "null")
        cascadeFromColumn = null;
    if (cascadeFilterColumn == "null")
        cascadeFilterColumn = null;

    var columnData = isInline ? $input.data("columnData") : null;
    if (isInline) {
        //re-set input value after kendo data binding (sets the id)
        var value = $input.val();
        setTimeout(function () {
            $input.val(value);
        });
        gridModel = $(input).closest("[data-role=grid]").data("kendoGrid").dataSource.options.schema.model;
    }
    //else
    //  gridModel = $(input).closest(".k-popup-edit-form").data("gridDS").options.schema.model;
    requireConfigAndMore(["MagicSDK", "jQueryUI"], function (magic) {
        magic.kendo.getGridObject({ gridName: tableName })
            .then(function (gridObject) {
                keyName = gridObject.dataSource.schema.model.id;
                var dataSource = new kendo.data.DataSource(gridObject.dataSource);
                var widget = $input.autocomplete({
                    source: function (req, callback) {
                        if (cascadeFromColumn && cascadeFilterColumn && operator)
                            buildsearchGridFilter(gridObject, cascadeFromColumn, cascadeFilterColumn, operator, isInline ? columnData.model : gridModel);
                        dataSource.filter(
                            combineDataSourceFilters(gridObject.dataSource.filter, {
                                field: valueName,
                                operator: ($input && $input.attr("autocompleteFilterOperator")) ? $input.attr("autocompleteFilterOperator") : "contains",
                                value: req.term,
                                type: "searchgrid2"
                            })
                        );
                        dataSource.read().then(function () {
                            callback(dataSource.data());
                        });
                    },
                    select: function (e, ui) {
                        clearTimeout(timeout);
                        if (ui.item) {
                            var oldValue = isInline ? columnData.model.get(tableColumnName) : getGridColumnValueFromPopupEdit(input, tableColumnName);
                            if (isInline) {
                                columnData.model.set(tableColumnName, ui.item[keyName || tableColumnName]);
                                $input
                                    .val(ui.item[valueName])
                                    .trigger('searchGridChange', [ui.item[keyName || tableColumnName], oldValue]);
                                resetCascadeSlaveValues(tableColumnName, columnData.model, gridModel);
                            }
                            else {
                                setGridColumnValueFromPopupEdit(input, tableColumnName, ui.item[keyName || tableColumnName]);
                                $input
                                    .trigger("change")
                                    .trigger('searchGridChange', [ui.item[keyName || tableColumnName], oldValue])
                                    .parent()
                                    .addClass("has-value");
                                $input.one("blur", function () {
                                    $input.val(ui.item[valueName]);
                                });
                                $input.blur();
                                clearCascadingFieldsFrom(tableColumnName, $input.closest(".k-window"));
                            }
                        }
                        return false;
                    },
                    open: function () {
                        clearTimeout(timeout);
                    }
                })
                    .autocomplete("instance");
                widget._renderItem = function (ul, item) {
                    return $("<li class='list-group-item'>" + item[valueName] + "</li>")
                        .appendTo(ul);
                };
                widget._renderMenu = function (ul, items) {
                    var that = this;
                    $.each(items, function (index, item) {
                        that._renderItemData(ul, item);
                    });
                    $(ul).addClass("list-group");
                }
            });
        $input.on("keyup", function () {
            clearTimeout(timeout);
            $input
                .trigger('searchGridChange', [null, isInline ? columnData.model.get(tableColumnName) : getGridColumnValueFromPopupEdit(input, tableColumnName)])
                .parent().removeClass("has-value");
            if ($input.val() == "") {
                if (isInline) {
                    columnData.model.set(tableColumnName, "");
                    resetCascadeSlaveValues(tableColumnName, columnData.model, gridModel);
                }
                else {
                    setGridColumnValueFromPopupEdit(input, tableColumnName, "");
                    clearCascadingFieldsFrom(tableColumnName, $input.closest(".k-window"));
                }
            }
            else {
                timeout = setTimeout(function () {
                    if (!$input.data("kendoTooltip"))
                        $input.kendoTooltip(getDefaultTooltipSettings({
                            content: getObjectText("pleaseSelectFromDrop")
                        }));
                    $input.data("kendoTooltip").show();
                }, 1000);
            }
        });
    });
}

function setGridColumnValueFromPopupEdit(editElement, tableColumnName, value) {
    var dsinedit = $(editElement).closest("div.k-popup-edit-form.k-window-content.k-content").data('gridDS').data();
    var mainrecordid = $(editElement).closest("div.k-popup-edit-form.k-window-content.k-content").data('gridDSElementInEditID');
    var mainrecordUID = $(editElement).closest("div.k-popup-edit-form.k-window-content.k-content").data('gridDSElementInEditUID');
    for (var i = 0; i < dsinedit.length; i++) {
        if (dsinedit[i].id == mainrecordid && mainrecordUID == dsinedit[i].uid) {
            dsinedit[i].set(tableColumnName, value);
            break;
        }
    }
}

function getGridColumnValueFromPopupEdit(editElement, tableColumnName) {
    var dsinedit = $(editElement).closest("div.k-popup-edit-form.k-window-content.k-content").data('gridDS').data();
    var mainrecordid = $(editElement).closest("div.k-popup-edit-form.k-window-content.k-content").data('gridDSElementInEditID');
    var mainrecordUID = $(editElement).closest("div.k-popup-edit-form.k-window-content.k-content").data('gridDSElementInEditUID');
    for (var i = 0; i < dsinedit.length; i++) {
        if (dsinedit[i].id == mainrecordid && mainrecordUID == dsinedit[i].uid) {
            return dsinedit[i][tableColumnName];
        }
    }
}

function getFilteredDataFromKendoGrid(gridObject) {
    var dataSource = gridObject.dataSource;
    var filters = dataSource.filter();
    var allData = dataSource.data();
    var query = new kendo.data.Query(allData);
    return query.filter(filters).data;
}

window.userImgErrorHash = {};
//create initials
function userImgError(image, name, title) {
    if (!name)
        return;
    image = $(image);
    var userid = image.attr('data-userid');
    var html = '';
    image.onerror = '';
    if ((userid || name) && (userid || name) in userImgErrorHash)
        html = userImgErrorHash[userid || name];
    else {
        var initials = getInitials(name);
        var color = getRandomColor();
        var bgc = '';
        if (isTooDark(color)) {
            bgc = 'color: white; ';
        }
        html = '<span title="{0}" class="calendar-label" style="' + bgc + 'background-color: ' + color + ';">' + initials + '</span>';
        userImgErrorHash[userid] = html;
    }
    html = html.replace("{0}", title || "");
    $(html).insertBefore(image);
    image.remove();
    return true;
}

window.initialNames = {};
function getInitials(name) {
    if (!name)
        return;
    if (name in initialNames)
        return initialNames[name];
    var initials = name.split(' ');
    var nameShort = '';
    for (var i = 0; i < initials.length && i < 2; i++)
        if (initials[i].length)
            nameShort += initials[i][0].toLocaleLowerCase().replace(/\W/, '');
    initialNames[name] = nameShort;
    return nameShort;
}

//bootstrap functions
function increaseColMd(selector, amount, set) {
    var $pane = $(selector);
    $pane
        .attr("class", $pane.attr("class")
            .replace(/(col-[\w]{2}-)([\d]+)/,
                function ($0, $1, $2) {
                    if (set)
                        amoutn = amount;
                    else
                        amount = parseInt($2) + amount;
                    if (amount > 12)
                        amount = 12;
                    else if (amount < 0)
                        amount = 0;
                    return $1 + amount;
                }));
}

function contactTemplate(textKey, idKey) {
    var isMobile = 'ontouchstart' in window;
    return "# if ({0}) {  # \
    <a{2} class='pull-right contact-button' title='{3}' href='javascript:void(0)' onclick='getContactData(#:{1}#, this)'>\
        <i class='fa fa-phone'></i>\
        <i class='fa fa-envelope-o'></i>\
    </a> #: {0} # # } #".format(textKey, idKey, isMobile ? " style='font-size: 1.5em;'" : "", getObjectText('contactData'));
}

function getConfig(configName, refresh) {
    var userApplicationConfigs = sessionStorage.userApplicationConfigs ? JSON.parse(sessionStorage.userApplicationConfigs) : {};
    if (!refresh & configName in userApplicationConfigs && userApplicationConfigs[configName].timestamp == window.LoginTimestamp)
        return getResolvedPromiseWithValue(userApplicationConfigs[configName].value);
    else {
        userApplicationConfigs[configName] = {};
        var promise = $.Deferred();
        $.get("/api/UserConfig/GetUserConfig/" + configName)
            .done(function (res) {
                promise.resolve(userApplicationConfigs[configName].value = JSON.parse(res));
            })
            .fail(function () {
                promise.resolve(userApplicationConfigs[configName].value = null);
            })
            .always(function () {
                userApplicationConfigs[configName].timestamp = window.LoginTimestamp;
                sessionStorage.userApplicationConfigs = JSON.stringify(userApplicationConfigs);
            });
        return promise;
    }
}

function setConfig(configName, data) {
    var promise = $.Deferred();
    getConfig(configName)
        .done(function (specificConfig) {
            if (configName != "grid" && configName != "pivot" && configName != "calendar") {
                var d = {};
                d[configName] = data;
                data = d;
                configName = "more";
            }
            $.post(
                //D.T changed controller (not using mongo anymore)
                "/api/UserConfig/PostConfig?type=" + configName,
                "=" + encodeURIComponent(JSON.stringify(data))
            )
                .then(function (res) {
                    promise.resolve(res);
                }, function (res) {
                    promise.reject(res);
                });
            var userApplicationConfigs = sessionStorage.userApplicationConfigs ? JSON.parse(sessionStorage.userApplicationConfigs) : {};
            if (configName == "more") {
                $.each(data, function (k, v) {
                    configName = k;
                    data = v;
                    return false;
                });
            }
            userApplicationConfigs[configName].value = data;
            sessionStorage.userApplicationConfigs = JSON.stringify(userApplicationConfigs);
        });
    return promise;
}

function getResolvedPromiseWithValue(value) {
    return $.Deferred(function (promise) { promise.resolve(value); }).promise();
}

function openGridAggregationOptions(el) {
    var element = getAngularControllerRootHTMLElement("GridAggregation");
    var $modalContent = showModal({
        title: '<i class="fa fa-calculator" aria-hidden="true"></i>',
        content: element,
        wide: true
    });
    initAngularController(element, "GridAggregationController", { $el: $(el) });
}

var templates = {};
function getTemplate(path) {
    if (path in templates)
        return getResolvedPromiseWithValue(templates[path]);
    return $.get(path)
        .then(function (res) {
            return templates[path] = res;
        });
}

function makeGridOfflineAvailable(gridInstance, templates) {
    window.open("/Magic/Views/OfflineGrid.html");
    offlineGridData = {
        gridObject: gridInstance.options,
        templates: templates,
        filter: gridInstance.dataSource.filter()
    };
}

//this grid goes offline after first request for getting data
function getOfflineGridObject(gridObject, options) {
    if (!options)
        options = {};
    var gridObject = $.extend(true, {}, gridObject);

    //gridObject.dataSource.pageSize = 100000;
    //gridObject.offlineStorage = gridObject.EntitiyName + "-offline-grid";

    //don't show confirm-button if first col is a boolean col
    //https://gitlab.ilosgroup.com/ilos/operations/-/issues/327
    if ((gridObject.editable === true || gridObject.editable == 'incell') && $.grep(gridObject.toolbar, function (toolbarEl) { return (toolbarEl.type == 'filterSelected') || (toolbarEl.type == 'selectAll') || (toolbarEl.type == 'unselectAll') }).length == 3) {
        options.removeSaveButton = true;
    }

    if (gridObject.toolbar && Array.isArray(gridObject.toolbar)) {
        var i = 0;
        while (i < gridObject.toolbar.length) {
            if (
                gridObject.toolbar[i].name
                && (
                    gridObject.toolbar[i].name == "create"
                    || (!options.removeSaveButton && gridObject.toolbar[i].name == "save")
                )
                || gridObject.toolbar[i].type
                && ["filterSelected", "selectAll", "unselectAll"].indexOf(gridObject.toolbar[i].type) > -1
            ) {
                i++;
                continue;
            }
            gridObject.toolbar.splice(i, 1);
        }
    }

    if (gridObject.columns && Array.isArray(gridObject.columns)) {
        var i = 1;
        while (i < gridObject.columns.length) {
            if (gridObject.columns[i].filterable) {
                i++;
                continue;
            }
            gridObject.columns.splice(i, 1);
        }
    }
    var __origDataBound = gridObject.dataBound;
    gridObject.dataBound = function (e) {
        if (__origDataBound)
            __origDataBound.call(this, e);
        setTimeout(function () {
            e.sender.dataSource.online(false);
        });
    };

    if (gridObject.pageable)
        gridObject.pageable.refresh = false;
    else
        gridObject.pageable = { refresh: false };

    gridObject.dataSource.serverFiltering = false;
    gridObject.dataSource.serverPaging = false;
    gridObject.dataSource.serverSorting = false;
    gridObject.cancel = function (e) {
        //popup case management
        if (e.container && e.container.data()) {
            let containerData = e.container.data();
            let isNew = containerData.isNew;
            if (isNew == true)
                return;
        }
        if (e.model.isNew() && e.model.dirty) //canceling a row previously added but not saved to DB yet...
        {
            e.preventDefault();
            e.sender.refresh();
        }
    };
    return gridObject;
}

function googleMapsDoRefreshIfNeeded() {
    var now = Date.now(),
        uriComps = getMagicAppURIComponents(),
        location = uriComps.moduleId + "-" + uriComps.menuId,
        refreshInfo = (refreshInfo = sessionStorage.googleMapRefresh) ? JSON.parse(refreshInfo) : null,
        doRefresh = false;
    if (refreshInfo && (refreshInfo.location != location || now - refreshInfo.timestamp > 60000)) {
        setTimeout(function () { window.location.reload() });
        doRefresh = true;
    }
    sessionStorage.googleMapRefresh = JSON.stringify({
        timestamp: now,
        location: uriComps.moduleId + "-" + uriComps.menuId
    });
    return doRefresh;
}

function showGridPivot(buttonEl, magicPivotCodes) {
    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        gridPivotController = $("#grid-pivot-controller"),
        config;
    if (gridPivotController.length) {
        gridPivotController.remove();
    }

    gridPivotController.data("expandedColDates", {});
    gridPivotController.data("expandedRowDates", {});


    config = {
        grid: grid,
        close: function () {
            gridPivotController.fadeOut();
        },
        options: {
            onCellClick: function (e) {
                if (e.area == "column" || e.area == "row") {
                    var clickedfield = e.area == "row" ? e.rowFields[e.columnIndex] : e.columnFields[e.rowIndex];
                    if (clickedfield.dataType == "date") {
                        if (clickedfield.groupInterval == "month")
                            return;
                        var dataIdx = e.area == "row" ? "expandedRowDates" : "expandedColDates";
                        var expandedDates = gridPivotController.data(dataIdx) ? gridPivotController.data(dataIdx) : {};
                        // lookup for the year in the path
                        var year;
                        if (clickedfield.groupInterval == "year" && e.cell.isLast) {
                            year = e.cell.text;
                            expandedDates[year] = 1;
                        }
                        else
                            if (clickedfield.groupInterval == "quarter" && e.cell.isLast) {
                                expandedDates[e.cell.path[e.cell.path.length - 2]] += 1;
                            }
                            else
                                expandedDates[e.cell.path[e.cell.path.length - 2]] += -1;

                        gridPivotController.data(dataIdx, expandedDates);
                    }

                    return;
                }
                var getOffset = function (values, type) {
                    var offset = 0;
                    var obj;
                    if (type == "columns")
                        obj = gridPivotController.data("expandedColDates");
                    else
                        obj = gridPivotController.data("expandedRowDates");
                    if (obj)
                        $.each(values, function (i, v) {
                            if (obj[v])
                                offset = obj[v];
                        });
                    return offset;
                };

                var gir = getOffset(e.cell.rowPath, "rows");
                var gic = getOffset(e.cell.columnPath, "columns");

                var filterBuilder = function (filter, fields_, values, offset) {
                    addOffset = false;
                    var idx = { "year": 0, "quarter": 1, "month": 2 };

                    $.each(fields_, function (i, v) {
                        if (v.dataType == "date") {
                            //addOffset = true;
                            if (idx[v.groupInterval] != offset)
                                return true;//skip
                            var year, monthStart, monthEnd;
                            switch (offset) {
                                case 0:
                                    year = values[i];
                                    monthStart = 0;
                                    monthEnd = 11;
                                    break;
                                case 1:
                                    year = values[i - 1];
                                    var monthStart = values[i] * 3 - 3;
                                    var monthEnd = values[i] * 3 - 1;
                                    break;
                                case 2:
                                    year = values[i - 2];
                                    var monthStart = values[i] - 1;
                                    var monthEnd = values[i] - 1;
                                    break;
                            }
                            filter.filters.push({
                                type: "pivot",
                                logic: "and",
                                filters: [
                                    { field: v.dataField, operator: "gte", value: new Date(year, monthStart, 1), type: "pivot" },
                                    { field: v.dataField, operator: "lte", value: new Date(year, monthEnd + 1, 0), type: "pivot" }
                                ]
                            });
                        }
                        else
                            if (values.length > i)
                                filter.filters.push({ field: v.dataField, operator: "eq", value: values[i], type: "pivot" });
                    });
                };
                var filter = { logic: "and", filters: [], type: "pivot" };
                filterBuilder(filter, e.rowFields, e.cell.rowPath, gir);
                filterBuilder(filter, e.columnFields, e.cell.columnPath, gic);
                grid.dataSource.filter(combineDataSourceFilters(grid.dataSource.filter(), filter));
                gridPivotController.fadeOut();
            }
        },
        magicPivotCodes: magicPivotCodes
    };
    gridPivotController = $('<div id="grid-pivot-controller"  class="k-grid" style="position: relative;">')
        .append($(getAngularControllerElement("Magic_GridPivotController", config)))
        .css("height", "1000px")
        .prependTo("#appcontainer");

}

function openGridMessage(buttonEl, boType, boDescriptionColumn) {

    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        gridMessageController = $("#grid-message-controller"),
        config;
    if (gridMessageController.length) {
        gridMessageController.remove();
    }

    //get selected BOIds 
    var BOIds = [];
    BOIds = $.map(grid.select(), function (v) {
        return {
            id: grid.dataItem(v)[grid.dataSource.options.schema.model.id], description: grid.dataItem(v)[boDescriptionColumn]
        };
    });
    if (!BOIds.length) {
        kendoConsole.log(getObjectText("selectRowError"), "error");
        return false;
    }
    doModal(true);
    var deferred = $.Deferred();
    //Call the database to get the potential receivers of this message 
    requireConfigAndMore(["MagicSDK"], function (MF) {
        //admin area customization var
        if (window.userMessageReceiversSp) {
            MF.api.get({ storedProcedureName: window.userMessageReceiversSp, data: { ids: BOIds, BOType: boType } })
                .then(function (result) {
                    deferred.resolve(result);
                    doModal(false);
                }, function (err) {
                    doModal(false);
                    console.log(err);
                });
        }
    });

    $.when(deferred).then(function (usersresult) {
        if (!usersresult.length)
            return;
        config = {
            users: usersresult[0],
            grid: grid,
            boIds: BOIds,
            boType: boType
        };
        gridMessageController = $('<div id="grid-message-controller"  class="k-grid" style="position: relative;">')
            .append($(getAngularControllerElement("Magic_GridMessageController", function () { return config; }, "fileUploadInit")).addClass("fadeout"))
            .prependTo("#appcontainer");
        gridMessageController.removeData();
        gridMessageController.data("gridMessageConfig", config);
        $.each(data, function (k, v) {
            gridMessageController.data(k, v);
        });
    });
}

function showTreeScheduler(buttonEl, showTree) {
    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        schedulerController = $("#tree-scheduler-controller"),
        config;
    if (schedulerController.length) {
        kendo.destroy("#mfkendoscheduler");
        schedulerController.remove();
    }
    doModal(true);
    var deferred = $.Deferred();
    //if the session is managed at the DB level 
    requireConfigAndMore(["MagicSDK"], function (MF) {
        if (window.userSessionManagementSp) {
            MF.api.get({ storedProcedureName: window.userSessionManagementSp, data: { useraction: "init" } })
                .then(function (result) {
                    deferred.resolve(MF);
                }, function (err) {
                    doModal(false);
                    console.log(err);
                });
        }
        else
            deferred.resolve(MF);
    });


    var initTasks = $.Deferred();
    //if the tree is hidden the tasks are initialized before opening the scheduler 
    if (!showTree) {
        if (window.schedulerInitFromGridSp) {
            requireConfigAndMore(["MagicSDK"], function (MF) {
                MF.api.get({
                    storedProcedureName: window.schedulerInitFromGridSp, data: {
                        useraction: "init", view: "month", selected: getAllSelectedRowsFromGrid(buttonEl), gridname: (grid && grid.element ? grid.element.attr('gridname') : "")
                    }
                })
                    .then(function (result) {
                        doModal(false);
                        $.each(result[0], function (i, v) {
                            if (v.editOptions) {
                                try {
                                    v.editOptions = JSON.parse(v.editOptions);
                                }
                                catch (e) {
                                    console.log(e);
                                }
                            }
                        })

                        initTasks.resolve(result);
                    }, function (err) {
                        doModal(false);
                        initTasks.reject();
                        console.log(err);
                    });
            });
        }

    }
    else {
        doModal(false);
        initTasks.resolve([]);
    }
    $.when(deferred, initTasks).then(function (MF, tasks) {
        config = {
            showTree: showTree,
            tasks: tasks,
            grid: grid,
            selected: getAllSelectedRowsFromGrid(buttonEl),
            userSessionManagementSp: window.userSessionManagementSp,
            MF: MF,
            ready: function () {
                schedulerController.find(".fadeout").addClass("fadein");
                setTimeout(function () {
                    schedulerController.find("i.fa.fa-spinner").remove();
                }, 1000)
            }
        };
        schedulerController = $('<div id="tree-scheduler-controller"  class="k-grid" style="position: relative;">')
            .append('<div style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
            .append($(getAngularControllerElement("Magic_TreeSchedulerController", function () { return config; })).addClass("fadeout"))
            .css("height", "1000px")
            .prependTo("#appcontainer");
        schedulerController.removeData();
        schedulerController.data("schedulerConfig", config);
        $.each(data, function (k, v) {
            schedulerController.data(k, v);
        });
    });

}
function showTreeGoogleMap(buttonEl) {
    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        mapController = $("#tree-map-controller"),
        config;
    if (mapController.length) {
        kendo.destroy(".gd-dg-viewer");
        mapController.remove();
    }

    var deferred = $.Deferred();
    //if the session is managed at the DB level 

    requireConfigAndMore(["MagicSDK"], function (MF) {
        if (window.userSessionManagementSp) {
            MF.api.get({ storedProcedureName: window.userSessionManagementSp, data: { useraction: "init" } })
                .then(function (result) {
                    deferred.resolve(MF);
                }, function (err) {
                    console.log(err);
                });
        }
        else
            deferred.resolve(MF);
    });

    $.when(deferred).then(function (MF) {
        config = {
            grid: grid,
            userSessionManagementSp: window.userSessionManagementSp,
            MF: MF,
            ready: function () {
                mapController.find(".fadeout").addClass("fadein");
                setTimeout(function () {
                    mapController.find("i.fa.fa-spinner").remove();
                }, 1000)
            }
        };
        mapController = $('<div id="tree-map-controller" class="k-grid" style="position: relative">')
            .append('<div style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
            .append($(getAngularControllerElement("Magic_TreeGoogleMapController", function () { return config; })).css("height", "100%").addClass("fadeout"))
            .css("height", " 70vh")
            .insertBefore("#appcontainer");
        mapController.removeData();
        mapController.data("mapsConfig", config);
        $.each(data, function (k, v) {
            mapController.data(k, v);
        });
    });

}
function showTreeGISMap(buttonEl) {

    if (!window.showTreeGISMap_implementation)
        console.error("implement function showTreeGISMap_implementation in AdminAreaCustomizations.js with your particular reqs");
    else
        window.showTreeGISMap_implementation(buttonEl);
}

function showGridMap(buttonEl) {
    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        //manage the case of a map opened when grid is in popup 
        selector = !$(buttonEl).closest(".k-window").length ? "grid-map-controller" : "grid-popup-map-controller",
        mapController = selector === "grid-popup-map-controller" ? $(buttonEl).closest(".k-content").find("#" + selector) : $("#" + selector),
        config;

    if (!mapController.length) {
        config = {
            grid: grid,
            ready: function () {
                mapController.find(".fadeout").addClass("fadein");
                setTimeout(function () {
                    mapController.find("i").remove();
                }, 1000);
            }
        };
        mapController = $('<div id="' + selector + '" class="k-grid" style="position: relative">')
            .append('<div style="position: absolute; left: 50%; top: 40%">' + largeSpinnerHTML + '</div>')
            .append($(getAngularControllerElement("Magic_GridGoogleMapController", function () { return config; })).css("height", "100%").addClass("fadeout"))
            .css("height", " 70vh")
            .insertBefore(selector === "#grid-map-controller" ? "#appcontainer" : $(buttonEl).closest(".k-grid"));
    }
    else {
        config = mapController.data("mapsConfig");
        config.setGrid(grid);
        mapController.show(1000);
    }
    mapController.removeData();
    mapController.data("mapsConfig", config);
    $.each(data, function (k, v) {
        mapController.data(k, v);
    });
}

//imgObject { src: "", caption: "", alt: "", height: "", width: "" } src required
function bootstrapAddCarouselTo$el($el, carouselID, arrayOfImgObjects) {
    $el.html(largeSpinnerHTML);
    return $.get("/Magic/Views/Templates/HtmlTemplates/bootstrap-carousel.html")
        .then(function (HTML) {
            HTML = HTML.format(carouselID);
            var itemsHTML = "",
                indicatorsHTML = "",
                style = "";
            $.each(arrayOfImgObjects, function (k, v) {
                style = "";
                if (v.width != undefined) {
                    style += 'width:' + v.width + ' !important;';
                }
                if (v.height != undefined) {
                    style += 'height:' + v.height + ' !important';
                }
                itemsHTML += '<div class="item' + (k == 0 ? ' active' : '') + '"><img src="' + v.src + '"' + (v.alt ? ' alt="' + v.alt + '"' : '') + ' style="' + style + '" /><div class="carousel-caption">' + (v.caption || '') + '</div></div>';
                indicatorsHTML += '<li data-target="#' + carouselID + '" data-slide-to="' + k + '"' + (k == 0 ? ' class="active"' : '') + '></li>';
            });
            var $html = $(HTML);
            $html.find(".carousel-indicators").html(indicatorsHTML);
            $html.find(".carousel-inner").html(itemsHTML);
            $html.carousel();
            $el.html($html);
            if (arrayOfImgObjects.length > 10)
                $el.find(".carousel-indicators").hide();
        });
}

function getQsPars() {
    if (window.location.search)
        return window.location.search.substring(1);
    return null;
}

function query_for_template_document(element, options) {
    if (element.gridExtension && element.gridExtension.query_for_template_document) {
        $("#appcontainer").one("kendoGridRendered_" + element.code, function (e, grid, gridid) {
            options = $.extend({
                stored: "dbo.Magic_GetModels",
                formTableName: "dbo.v_Magic_Models_Form_Culture",
                controllerName: "Magic_DocumentModel",
                renderModelClassesFunction: function (items) {
                    var modelClasses = {};
                    $.each(items, function (k, item) {
                        var modelType = {
                            id: item.ID,
                            code: item.ModelTypeCode,
                            description: item.ModelTypeDescription,
                            batch: item.Flag_Batch,
                            outId: item.OutTypeID,
                            outCode: item.OutTypeCode,
                            outDescription: item.OutTypeDescription
                        };

                        if (item.Class_ID in modelClasses) {
                            modelClasses[item.Class_ID].modelTypes.push(modelType);
                        } else {
                            modelClasses[item.Class_ID] = {
                                code: item.ModelClassCode,
                                description: item.ModelClassDescription,
                                modelTypes: [modelType]
                            }
                        }
                    });
                    return modelClasses;
                }
            }, options || {});

            requireConfigAndMore(["MagicSDK"], function (MF) {
                //D.t: Support #6602 use the event data if available
                var guid = grid.options && grid.options.guid ? grid.options.guid : element.guid;
                var ge = grid.options && grid.options.gridExtension ? grid.options.gridExtension : element.gridExtension;
                MF.kendo.getStoredProcedureDataSource(options.stored, {
                    data: { gridGUID: guid, gridName: gridid, isPublic: ge && ge.isPublic ? ge.isPublic : false },
                    success: function (e) {
                        //alert(guid + " model data returned  " + JSON.stringify(e.items));
                        //D.T: Support #6602 show the button only if something is returned
                        if (e.items && e.items.length) {
                            var modelClasses = options.renderModelClassesFunction(e.items);
                            var drop = '<div class="btn-group"><button class="k-button dropdown-toggle" data-toggle="dropdown">' + getObjectText("buildDocuments") + '</button><ul class="dropdown-menu">'
                            $.each(modelClasses, function (k, modelClass) {
                                drop += '<li class="dropdown-submenu"><span class="k-button" data-toggle="dropdown">' + modelClass.description + '</span><ul class="dropdown-menu">';
                                $.each(modelClass.modelTypes, function (k, modelType) {
                                    drop += '<li><span data-model-type=\'' + JSON.stringify(modelType).replace('\'', '\\\'') + '\' class="k-button"><i style="margin: 0 5px 0 -5px;" class="fa fa-file-' + modelType.outCode + '-o"></i>' + modelType.description + '</span></li>';
                                });
                                drop += '</ul></li>';
                            });
                            drop += "</ul></div>";
                            var $drop = $(drop);
                            grid.element.find('.k-grid-toolbar').append($drop);
                            $drop.find('span[data-model-type]').click(function () {
                                buildDocuments(
                                    grid.dataSource.filter(),
                                    $(this).data('modelType'),
                                    grid.element.data('allRecords') || (grid.options.selectable ? $.map(grid.select(), function (v) { return grid.dataItem(v); }) : []),
                                    null,
                                    options.formTableName,
                                    options.controllerName,
                                    grid
                                );
                            });

                            if (window.vocalCommandsActive) { //#vocalCommands
                                var toolbar = grid.element.find('.k-grid-toolbar');
                                if (toolbar) {
                                    var oldMicSpan = grid.element.find('.k-grid-toolbar').find('.fa-microphone');
                                    if (oldMicSpan && oldMicSpan.length > 0) {
                                        var vocalId = oldMicSpan.data().vocalId;
                                        delete oldMicSpan[0].dataset.vocalId
                                        var $micSpan = $('<span class="fa fa-2x fa-microphone" style="margin-left: 10px; margin-right: 5px;" title="Start recording!" data-vocal-id="' + vocalId + '"></span>');
                                        oldMicSpan.removeClass('fa-microphone');
                                        $micSpan.on('click', onVocalCommandClick);
                                        toolbar.append($micSpan);
                                    }
                                }
                            }
                        }
                    }
                }).read();
            });
        });
    }
}

function buildDocuments(filter, modelType, selected, docIsReadyCallback, formTableName, controllerName, grid, isPublic) {
    var $modal = $("#wndmodalContainer");
    if ($('[ng-controller][data-model-type-id=' + modelType.id + ']', $modal).length) {
        $modal.modal('show');
        return;
    } else {
        cleanModal();
    }

    $el = showModal({
        content: '<div data-model-type-id="' + modelType.id + '" ng-controller="Magic_DocumentModelController as c" style="display: inline-block; width: 100%;">\
            <form ng-if="' + (formTableName ? 'true' : 'false') + '" name="form" ng-submit="c.formSubmit(form)" ng-show="!c.requestSent">\
                <magic-form model="c.formData" table-name="' + modelType.id + '" options="{ itemsPerRow: 2 , source: \'' + formTableName + '\', callback: c.formCallback }">\
                </magic-form>\
                <button ng-class="{\'hidden\': !c.formInputs}" class="btn pull-right" ng-click="c.getDocuments">' + getObjectText("buildDocuments") + '</button>\
            </form>\
            <div ng-show="c.requestSent" class="ng-hide">\
                <div class="progress progress-striped active progress-large"><div ng-style="{width: c.exportProgress + \'%\'}" class="progress-bar progress-bar-success"></div></div>\
                <a ng-if="c.taskID && c.isTaskPaused" href="/api/' + controllerName + '/GetFirstFile?documentFillSessionId={{c.documentFillSessionId}}" target="_blank" class="btn btn-alert">' + getObjectText("preview") + '</a>\
                <button ng-if="c.taskID && c.isTaskPaused" ng-click="c.resumeTask()" class="btn btn-primary">' + getObjectText("continue") + '</button>\
                <button ng-if="c.taskID" ng-click="c.stopTask()" type="button" class="btn btn-alert pull-right">' + getObjectText("cancel") + '</button>\
            </div>\
        </div>',
        title: getObjectText("buildDocuments") + ':&nbsp;<span class="fa fa-file-' + modelType.outCode + '-o"></span>&nbsp;' + modelType.description
    });

    initAngularController($el.find('[ng-controller]'), "Magic_DocumentModelController", {
        filter: filter,
        modelType: modelType,
        selectedRows: selected,
        docIsReadyCallback: docIsReadyCallback,
        formTableName: formTableName,
        controllerName: controllerName,
        grid: grid,
        isPublic: isPublic
    });
}

// -- general UTILS --

function getHTMLFormData($wrappingElement) {
    var obj = {};
    $wrappingElement
        .find("input, select")
        .each(function (k, v) {
            if (v.type == "checkbox")
                obj[v.name || v.value] = v.checked;
            else
                obj[v.name] = v.value;
        });
    return obj;
}

function toBoolean(string) {
    if (typeof string == "string") {
        string = string.toLowerCase();
        if (string === "true" || string === "1" || string === "on" || string === "yes")
            return true;
        return false;
    }
    return !!string;
}

function getUserInstanceIdentifier() {
    return location.host + "-" + window.ApplicationInstanceId + "-" + window.Username;
}

function setLocalUserData(identifier, data, permanent) {
    identifier = getUserInstanceIdentifier() + "-" + identifier;
    if (typeof data == "object")
        data = JSON.stringify(data);
    if (permanent)
        localStorage[identifier] = data;
    else
        sessionStorage[identifier] = data;
}

function getLocalUserData(identifier) {
    identifier = getUserInstanceIdentifier() + "-" + identifier;
    var data = sessionStorage[identifier];
    if (!data)
        data = localStorage[identifier];
    if (data && data.length > 1 && (typeof data == 'string' && (data.trimStart()[0] == "{" && data[data.length - 1] == "}") || (data[0] == "[" && data[data.length - 1] == "]")))
        return JSON.parse(data);
    return data;
}

function extendPayloadWithUserGeoLocation(options) {

    if (!options)
        return;
    if (usersGeoLocation) {
        //if the device is mobile refresh coords
        if (isMobile())
            fetchUsersGeoLocation();
        if (!options.data)
            options.data = kendo.stringify({
                user_latitude: usersGeoLocation.coords.latitude,
                user_longitude: usersGeoLocation.coords.longitude
            });
        else {
            try {
                options.data = kendo.stringify($.extend(JSON.parse(options.data), {
                    user_latitude: usersGeoLocation.coords.latitude,
                    user_longitude: usersGeoLocation.coords.longitude
                }));
            }
            catch (ex) {
                console.log(ex);
            }
        }
    }

}

function extendPayloadWithParentGridName(options, gridElement) {
    if (!options || !gridElement) {
        return;
    }

    const parentGrid = $(gridElement).closest(".k-grid[data-role='grid']");
    if (!parentGrid && !parentGrid.length) {
        return;
    }

    const parentGridName = parentGrid.attr('gridname');
    if (!parentGridName) {
        return;
    }

    let data;
    if (options.data && options.data.length && typeof options.data == 'string') {
        data = JSON.parse(options.data);
        data.ParentGridName = parentGridName;
    } else {
        data = { ParentGridName: parentGridName };
    }
    options.data = JSON.stringify(data);
}


function isMobile() {
    if (sessionStorage.isMobile)
        return toBoolean(sessionStorage.isMobile);
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    sessionStorage.isMobile = check;
    return check;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function isTooDark(c) {
    var c = c.substring(1);
    var rgb = parseInt(c, 16);
    var r = (rgb >> 16) & 0xff;
    var g = (rgb >> 8) & 0xff;
    var b = (rgb >> 0) & 0xff;

    var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luma < 140) {
        return true;
    }
    return false;
}

var selectalltemplate = {};
selectalltemplate["selectall"] = '<a id="seleall" onclick="selectall(this);" class="k-button k-button-icontext pull-left">\
                                            <span class="fa fa-bars" aria-hidden="true"></span>' + getObjectText("selectall") + '</a>';
$("#seleall").prop("selected", false);

function selectall(e) {
    var entityGrid = $(e).closest(".k-grid").data("kendoGrid");

    var selected = !($("#seleall").prop("selected"));
    $("#seleall").prop("selected", selected);

    var text = '<span class="fa fa-bars" aria-hidden="true"></span>';

    if (selected) {
        text += getObjectText("deselectall");
        $("#seleall").html(text);
        entityGrid.select(entityGrid.tbody.find(">tr"));
    }
    else {
        text += getObjectText("selectall");
        $("#seleall").html(text);
        entityGrid.clearSelection();
    }
}

function resetSelectAll(e) {
    var grid = this;
    el = grid.element.find("a#seleall");
    if (el.length > 0) {
        var text = '<span class="fa fa-bars" aria-hidden="true"></span>';
        text += getObjectText("selectall");
        el.html(text);
        el.prop("selected", false);
    }
}

function openGridNewBOMail(el, boDescriptionColumn, BOType, messages) {
    var grid = $(el).closest(".k-grid").data("kendoGrid"),
        fkColumn = grid.dataSource.options.schema.model.id,
        selected = [],// grid.select(),
        showWarning = false,
        selectedData = [],
        gridName = $(el).closest(".k-grid").attr("gridname");

    try {
        selected = grid.select();
    } catch {
        console.log("grid is not selectable...")
    }
    //if (!selected.length) {
    //    kendoConsole.log(getObjectText("selectRowError"), "error");
    //    return false;
    //}
    if (selected.length && boDescriptionColumn)
        selected.each(function (k, v) {
            var data = grid.dataItem(v);
            selectedData.push(data);
            if (!data[boDescriptionColumn])
                showWarning = true;
        });

    if (showWarning && !confirm(getObjectText("emtyBODescriptionWarning")))
        return false;

    cleanModal();
    var $content = showModal({
        title: getObjectText('newGridBOMail'),
        content: '<div id="mailContainer"><p class="text-center"><span class="fa fa-spinner fa-spin fa-4x fa-fw"></span></p></div>',
        wide: true
    }),
        deferrer = $.Deferred();

    if (messages && selectedData.length == 1) {
        var defaultTemplate;
        var templateCodes = [];
        $.map(messages, function (v) {
            if (v.isDefaultTemplate) {
                defaultTemplate = v.templateCode
            }
            templateCodes.push("" + v.templateCode);
            return v.templateCode;
        });

        $.post({
            url: "/api/DocumentRepository/GetSystemMessages",
            data: JSON.stringify({ templateCodes: templateCodes }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                if (result.Count > 0) {
                    deferrer.resolve(result.Data[0].Table, defaultTemplate);
                } else if (!result.Errors) {
                    deferrer.resolve()
                } else {
                    deferrer.reject(result.Errors)
                }
            }
        });
    } else
        deferrer.resolve();

    deferrer.then(function (templatesArray, defaultTemplate) {
        openEditor("new", null, gridName);
        var $mailEditorContainer = $('#mailEditorContainer', $content);
        $('> div', $mailEditorContainer).first().remove();
        $mailEditorContainer.data("returnMessage", true);

        if (templatesArray) {
            options = '<option value="">' + getObjectText("selectEmailTemplate") + '</option>';

            $.each(templatesArray, function (k, v) {
                options += '<option' + (defaultTemplate == v.Code ? ' selected' : '') + ' value="' + k + '">' + v.Subject + '</option>';
            });

            var $templateSelector = $('<select>' + options + '</select>');
            $templateSelector.change(function () {
                var k = $templateSelector.val();
                if (templatesArray[k]) {
                    $("#mailAttachments", $content).html('');

                    $.map(messages, function (message) {
                        if (message.templateCode === templatesArray[k].Code) {
                            if (message.attachmentColumn && selectedData.length && selectedData[0][message.attachmentColumn]) {
                                var html = $.map(selectedData[0][message.attachmentColumn].split(','), function (attachment) { return '<span class="label label-primary" data-attachment-path="' + attachment.trim().replace('"', '\\"') + '">' + attachment.replace(/.*(\\|\/)/, '') + '</span>'; });
                                $("#mailAttachments", $content).html('<h5>' + getObjectText('attachments') + '</h5><p>' + html.join('&nbsp;') + '</p>');
                            }
                            return false;
                        }
                    });


                    if (templatesArray[k].Subject)//FA: #5540 qualora ci fosse un tag che definisce in modo dinamico l'oggetto della mail, faccio in modo che esso venga sostituito
                    // $("input[name=Subject]", $content).val(templatesArray[k].Subject);
                    {
                        var Subject = templatesArray[k].Subject.replace(/-#(.+?)#-/gm, function (string, key) {
                            if (selectedData.length && (key in selectedData[0])) {
                                console.log(grid);
                                var value = selectedData[0][key];
                                //FK & format resolve
                                if (value) {
                                    $.each(grid.columns, function (k, column) {
                                        if (column.field == key) {
                                            if (column.values) {
                                                $.each(column.values, function (k, v) {
                                                    if (v.value == value) {
                                                        value = v.text;
                                                        return false;
                                                    }
                                                });
                                            } else if (column.format) {
                                                value = value ? kendo.toString(value, column.format).replace(/^{0:\s?|}$/g, '') : value;
                                            }
                                            return false;
                                        }
                                    });
                                }

                                return value;
                            }
                            return string;
                        });
                        $("input[name=Subject]", $content).val(Subject);
                    }

                    if (templatesArray[k].To)//FA: #5540 qualora ci fosse un tag che definisce in modo dinamico i destinatari, faccio in modo che esso venga sostituito
                    {
                        var To = templatesArray[k].To.replace(/-#(.+?)#-/gm, function (string, key) {
                            if (selectedData.length && (key in selectedData[0])) {
                                console.log(grid);
                                var value = selectedData[0][key];
                                //FK & format resolve
                                if (value) {
                                    $.each(grid.columns, function (k, column) {
                                        if (column.field == key) {
                                            if (column.values) {
                                                $.each(column.values, function (k, v) {
                                                    if (v.value == value) {
                                                        value = v.text;
                                                        return false;
                                                    }
                                                });
                                            } else if (column.format) {
                                                value = value ? kendo.toString(value, column.format).replace(/^{0:\s?|}$/g, '') : value;
                                            }
                                            return false;
                                        }
                                    });
                                }

                                return value;
                            }
                            return string;
                        });
                        $("input[name=To]", $content).val(To);
                    }
                    // $("input[name=To]", $content).val(templatesArray[k].To);
                    if (templatesArray[k].cc)
                        $("input[name=CC]", $content).val(templatesArray[k].cc);
                    if (templatesArray[k].ccn)
                        $("input[name=BCC]", $content).val(templatesArray[k].ccn);
                    if (templatesArray[k].Body) {
                        var body = templatesArray[k].Body.replace(/-#(.+?)#-/gm, function (string, key) {
                            if (selectedData.length && (key in selectedData[0])) {
                                console.log(grid);
                                var value = selectedData[0][key];

                                //FK & format resolve
                                if (value) {
                                    $.each(grid.columns, function (k, column) {
                                        if (column.field == key) {
                                            if (column.values) {
                                                $.each(column.values, function (k, v) {
                                                    if (v.value == value) {
                                                        value = v.text;
                                                        return false;
                                                    }
                                                });
                                            } else if (column.format) {
                                                value = value ? kendo.toString(value, column.format).replace(/^{0:\s?|}$/g, '') : value;
                                            }
                                            return false;
                                        }
                                    });
                                }

                                return value;
                            }

                            return string;
                        });
                        $("#mailEditor", $content).data("kendoEditor").value(body);
                    }
                }
            });

            if (defaultTemplate)
                $templateSelector.trigger("change");

            $('#mailActions', $content).append($templateSelector);
        }

        var $addXslx = $('<label style="display: inline-block; margin-left: 5px;"><input type="checkbox" />' + getObjectText('addXslx') + '</label>');
        $('#mailActions', $content).append($addXslx);
        $('input', $addXslx)
            .change(function () {
                if (this.checked) {
                    $(this).attr('disabled', 'disabled');
                    $('#mailSend', $mailEditorContainer).attr('disabled', 'disabled');
                    var exportobject = exportTofile(el, "xlsx", true);

                    doModal(true);
                    $.post({
                        url: '/api/GENERICSQLCOMMAND/ExportTofile/',
                        data: exportobject,
                        xhrFields: {
                            responseType: 'blob'
                        }
                    })
                        .then(function (blob, _, request) {
                            doModal(false);
                            var file = new File(
                                [blob],
                                request
                                    .getResponseHeader('Content-Disposition')
                                    .split('=')[1],
                                {
                                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                    lastModified: new Date().getTime()
                                }
                            );
                            var dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            $('#fileInput', $mailEditorContainer)[0].files = dataTransfer.files;
                            $('#fileInput', $mailEditorContainer).trigger('change');
                            $('input', $addXslx).removeAttr('disabled');
                            $('#mailSend', $mailEditorContainer).removeAttr('disabled');
                            $('.attachment [data-attachment-id]', $mailEditorContainer).hide();
                        });
                }
                else {
                    $('.attachment [data-attachment-id]', $mailEditorContainer).click();
                }
            });

        $mailEditorContainer.on('mailSent', function (e, message, draft) {
            if (!draft && typeof message == "object" && BOType && boDescriptionColumn) {
                var document = mailGetBOMessage(message);
                document.attatchments = attatchments;
                document.tags = $.map(selectedData, function (v) {
                    return {
                        Description: v[boDescriptionColumn],
                        Id: v[fkColumn],
                        Type: BOType
                    }
                });

                saveMailBO(document, null, function () {
                    hideModal();
                });
            } else {
                hideModal();
            }
        });
    }, function (error) {
        kendoConsole.log(error, "error");
        hideModal();
    });
}

function openGridNewBOMemo(el, boDescriptionColumn, BOType) {
    requireConfigAndMore(["TagSelector"], function () {
        var grid = $(el).closest(".k-grid").data("kendoGrid"),
            BOIds = $.map(grid.select(), function (v) {
                return grid.dataItem(v)[grid.dataSource.options.schema.model.id];
            });

        if (!BOIds.length) {
            kendoConsole.log(getObjectText("selectRowError"), "error");
            return false;
        }

        var $content = $('<div><form>' +
            (BOIds.length == 1 ? '<div class="k-edit-label">\
    <label for="memo_existing_note">' + getObjectText('selectExistingNote') + '</label>\
</div>\
<div class="k-edit-field">\
    <input type="text" name="memo_existing_note" id="memo_existing_note" class="k-input" />\
</div>' : '') +
            '<div class="k-edit-label">\
    <label for="memo_note">' + getObjectText('note') + '*</label>\
</div>\
<div class="k-edit-field">\
    <textarea id="memo_note" name="memo_note" rows="5" class="k-input k-textbox" required></textarea>\
</div>\
<div class="k-edit-label">\
    <label for="memo_due_date">' + getObjectText('duedateselection') + '</label>\
</div>\
<div class="k-edit-field">\
    <input type="text" name="memo_due_date" id="memo_due_date" class="k-input" />\
</div>\
<div class="k-edit-label">\
    <label for="memo_private">' + getObjectText('private') + '</label>\
</div>\
<div class="k-edit-field">\
    <input type="checkbox" name="memo_private" id="memo_private" value="1" />\
</div>\
<div class="k-edit-label">\
    <label for="memo_tags">' + getObjectText('tags') + '</label>\
</div>\
<div class="k-edit-field">\
    <input type="text" name="memo_tags" id="memo_tags" class="k-input" />\
</div><div class="clearfix"></div>\
<div class="k-edit-buttons k-state-default text-right">' +
            (BOIds.length == 1 ? '<button disabled="true" class="k-button k-button-icontext" type="submit"><span class="k-icon k-delete"></span>' + getObjectText('delete') + '</button>&nbsp;' : '') +
            '<button class="k-button k-button-icontext k-primary" type="submit"><span class="k-icon k-update"></span>' + getObjectText('save') + '</button>\
</div></form></div>');
        $content.kendoWindow({
            title: getObjectText('newGridBOMemo'),
            resizable: false,
            draggable: false,
            modal: true,
            close: function () {
                this.destroy();
            },
            width: 400
        });
        var $datepicker = $content.find('#memo_due_date').kendoDateTimePicker();
        var $note = $content.find('#memo_note');
        var $private = $content.find('#memo_private');
        var $tags = $content.find('#memo_tags');
        $tags.tagSelector();
        if (BOIds.length == 1) {

            var $deleteBTN = $content.find('button[disabled]');
            $deleteBTN.click(function () {
                $('button', this).attr('disabled', true);
                $.post({
                    url: "/api/DocumentRepository/DeleteNote/" + $existing.data("kendoDropDownList").value(),
                    success: function (result) {
                        kendoConsole.log(getObjectText('noteDeleted'), "success");
                        $content.data("kendoWindow").close();
                    },
                    error: function (error) {
                        kendoConsole.log(error, "error");
                        $content.data("kendoWindow").close();
                    }
                });
                return false;
            });

            var $existing = $content.find('#memo_existing_note').kendoDropDownList({
                dataSource: new kendo.data.DataSource({ //#felixtodo
                    transport: {
                        read: {
                            type: "POST",
                            url: "/api/DocumentRepository/GetWithFilter",
                            contentType: "application/json",
                            dataType: "json",
                            data: {
                                order: "InsertionDate DESC",
                                table: "dbo.Magic_DocumentRepository",
                                where: "BusinessObjectType = '" + BOType + "' AND BusinessObject_ID = '" + BOIds[0] + "' AND TransmissionMode = 'memo' AND CreatorUser_ID={idUser} AND DocumentType_ID is not null"
                            }
                        },
                        parameterMap: function () {
                            return JSON.stringify({
                                order: "DocumentFile ASC",
                                table: "dbo.Magic_DocumentRepository",
                                where: "BusinessObjectType = '" + BOType + "' AND BusinessObject_ID = '" + BOIds[0] + "' AND TransmissionMode = 'memo' AND CreatorUser_ID={idUser} AND DocumentType_ID is not null"
                            })
                        }
                    },
                    schema: {
                        data: function (response) {
                            return response.Data.length ? response.Data[0].Table : [];
                        }
                    }
                }),
                optionLabel: getObjectText("selectExistingNote") + '...',
                dataTextField: "DocumentFile",
                dataValueField: "ID",
                change: function () {
                    var id = this.value();
                    if (id) {
                        $deleteBTN.removeAttr('disabled');
                        $.each(this.dataSource.data(), function (k, v) {
                            if (v.ID == id) {
                                $note.val(v.DocumentFile);
                                $datepicker.data('kendoDateTimePicker').value(v.DueDate);
                                $private.prop('checked', !v.IsPublic);
                                if (v.DocumentJSONTags)
                                    $tags.tagSelector('addTags', JSON.parse(v.DocumentJSONTags));
                                return false;
                            }
                        });
                    } else {
                        $deleteBTN.attr('disabled', true);
                        $note.val('');
                        $datepicker.data('kendoDateTimePicker').value('');
                        $private.prop('checked', false);
                        $tags.tagSelector('removeAll');
                    }
                }
            });
        }
        $content.find('form').submit(function () {
            $('button', this).attr('disabled', true);
            var dateTime = $datepicker.data('kendoDateTimePicker').value();
            var data = {
                note: $note.val(),
                dueDate: dateTime ? toTimeZoneLessString(dateTime) : null,
                isPrivate: $private[0].checked,
                BOType: BOType,
                DocumentJSONTags: $tags.tagSelector('getTags')
            };

            if ($existing) {
                Id = $existing.data("kendoDropDownList").value();
                if (Id)
                    data.Id = Id;
            }
            if (!data.Id)
                data.BOIds = BOIds;

            $.post({
                url: "/api/DocumentRepository/AddNotes",
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8",
                success: function (result) {
                    kendoConsole.log(getObjectText(data.Id ? 'noteChanged' : 'noteAdded'), "success");
                    $content.data("kendoWindow").close();
                },
                error: function (error) {
                    kendoConsole.log(error, "error");
                    $content.data("kendoWindow").close();
                }
            });
            return false;
        });
        $content.data("kendoWindow").center().open();
    });
}

//START Print and PDF creation
function printHtml($el) {
    window.open("/Magic/Views/Print.html");
    printData = {
        html: $el[0].innerHTML,
        inputData: getHTMLFormData($el)
    };
}

function kendoCreateImgFromHtml($el, options) {
    if (!options)
        options = {};
    return kendo.drawing.drawDOM($el, options)
        .then(function (group) {
            // Render the result as a PNG image
            return kendo.drawing.exportImage(group);
        });
}

//paperOrientation "l" for landscape or "p" for portrait
function createPdfFromHtml($el, name, paperOrientation) {
    if (!paperOrientation)
        paperOrientation = "p";
    if (!name)
        name = new Date().toLocaleString();
    if (typeof jsPDF == "undefined")
        requireConfigAndMore(["jsPDF", "html2canvas"], function (a, b) {
            jsPDF = a;
            html2canvas = b;
            reallyCreatePdfNow($el, name, paperOrientation);
        });
    else
        reallyCreatePdfNow($el, name, paperOrientation);
}

function reallyCreatePdfNow($el, name, paperOrientation) {
    var doc = new jsPDF(paperOrientation, 'mm'),
        insertImageAtY = 10,
        width = 295,
        heigth = 210,
        $forms = $el.find(".add-to-pdf"),
        promises = [];
    //doc.text(name, 0, 0);
    promises.push(kendoCreateImgFromHtml($el, { paperSize: paperOrientation == "p" ? "A4" : "A3" }).then(function (img) {
        doc.addImage(img, 'PNG', 10, insertImageAtY);
    }));
    if ($forms.length) {
        $forms.each(function (k, form) {
            var promise = $.Deferred();
            promises.push(promise);
            html2canvas(form, {
                onrendered: function (canvas) {
                    var imgData = canvas.toDataURL('image/png');
                    doc.addImage(imgData, 'PNG', 10, insertImageAtY);
                    insertImageAtY += canvas.height / 5 + 10;
                    promise.resolve();
                }
            });
        });
    }
    $.when.apply($, promises)
        .always(function () {
            doc.save(name + '.pdf');
        });
}

//orientation "l" for landscape or "p" for portrait
function setSizeToA4($el, orientation) {
    if (!orientation)
        orientation = "p";
    var measures = [
        210,
        295
    ];
    if ($el.data("initialWidth") === undefined)
        $el.data("initialWidth", $el.width());
    $el.data("orientation", orientation == "p");
    $el.css("width", measures[(orientation == "l") + 0] + "mm");
}

function switchA4Orientation($el) {
    $el.data("orientation", !$el.data("orientation"));
    setSizeToA4($el, $el.data("orientation") ? "p" : "l");
}

function setInitialWidth($el) {
    if ($el.data("initialWidth") !== undefined)
        $el.width($el.data("initialWidth"));
}

function getOrientation($el) {
    if ($el.data("orientation") === false)
        return "l";
    return "p";
}
//END Print and PDF creation


function getExportButtons(options, fileName) {
    //how to hide elements: http://www.telerik.com/forums/hide-header-footer-when-exporting-to-pdf
    options = $.extend({
        types: ["pdf", "png", "svg"], //which types can be exported
        exportObject: kendo.drawing, //kendo element which supports export methods
        exportElement: null, //dom element to export (if no exportObject is defined)
        pdfExportOptions: { //http://docs.telerik.com/kendo-ui/api/javascript/drawing/pdfoptions
            paperSize: "auto",
            margin: { left: "1cm", top: "1cm", right: "1cm", bottom: "1cm" },
            title: fileName
        },
        drawDomOptions: null, //http://docs.telerik.com/kendo-ui/api/javascript/drawing#methods-drawDOM
        //settings to add 
        class: "pull-right",
        style: "",
        id: "",
        buttonClasses: "k-button-icontext k-grid-pdf k-button",
        showButtonText: true,
        beforeExport: null, //function called before export starts (only called in dom element export)
        afterExport: null //function called after export ends
    }, options);

    if (options.exportObject == kendo.drawing && !options.exportElement) {
        console.log("WARNING: exportObject OR exportElement must be defined!");
        return;
    } else if (!options.types.length) {
        console.log("WARNING: almoust one export type must be defined!");
        return;
    }

    var exportButtons = {
        pdf: $('<span class="' + options.buttonClasses + '" href="javascript:void(0)"><span class="fa fa-file-pdf-o"></span>' + (options.showButtonText ? '&nbsp;' + getObjectText('PdfExport') : '') + '</span>'),
        png: $('<span class="' + options.buttonClasses + '" href="javascript:void(0)"><span class="fa fa-file-image-o"></span>' + (options.showButtonText ? '&nbsp;' + getObjectText('ImageExport') : '') + '</span>'),
        svg: $('<span class="' + options.buttonClasses + '" href="javascript:void(0)"><span class="fa fa-file-image-o"></span>' + (options.showButtonText ? '&nbsp;' + getObjectText('SvgExport') : '') + '</span>')
    },
        returnElement;

    if (options.types.length > 1) {
        var $exportDrop = $('<div' + (options.id ? ' id="' + options.id + '"' : '') + ' class="btn-group' + (options.class ? ' ' + options.class : '') + '"' + (options.style ? ' style="' + options.style + '"' : '') + '>\
            <button type="button" title="' + getObjectText('Export') + '" class="k-button dropdown-toggle" data-toggle="dropdown"><span class="fa fa-sign-out"></span></button>\
            <ul class="dropdown-menu" role="menu"></ul>\
        </div>');

        $.each(exportButtons, function (k, v) {
            if (options.types.indexOf(k) > -1) {
                $exportDrop.find('.dropdown-menu').append(v);
                v.wrap('<li>');
            }
        });
        returnElement = $exportDrop;
    } else {
        returnElement = exportButtons[options.types[0]];
        if (options.class)
            returnElement.addClass(options.class);
        if (options.id)
            returnElement.attr("id", options.id);
        if (options.style)
            returnElement.css(options.style);
    }

    $.each(exportButtons, function (k, v) {
        if (options.types.indexOf(k) > -1) {
            v.click(function () {
                var deferrer = $.Deferred(),
                    exportDeferrer = $.Deferred();

                if ($exportDrop)
                    $exportDrop.removeClass('open');

                if (options.exportElement) {
                    if (options.beforeExport)
                        options.beforeExport(options, k);
                    if (!options.drawDomOptions && k == "pdf") {
                        options.drawDomOptions = {};
                        if (options.pdfExportOptions.paperSize)
                            options.drawDomOptions.paperSize = options.pdfExportOptions.paperSize;
                        if (options.pdfExportOptions.landscape)
                            options.drawDomOptions.landscape = options.pdfExportOptions.landscape;
                        if (options.pdfExportOptions.forcePageBreak)
                            options.drawDomOptions.forcePageBreak = options.pdfExportOptions.forcePageBreak;
                    }
                    deferrer = kendo.drawing.drawDOM(options.exportElement, options.drawDomOptions);
                } else
                    deferrer.resolve();

                deferrer.then(function (root) {
                    switch (k) {
                        case "pdf":
                            exportDeferrer = options.exportObject.exportPDF(root, options.pdfExportOptions);
                            break;
                        case "png":
                            exportDeferrer = options.exportObject.exportImage(root);
                            break;
                        case "svg":
                            exportDeferrer = options.exportObject.exportSVG(root);
                            break;
                        default:
                            console.log("WARNING: export type " + k + "is not supported!");
                            exportDeferrer.reject();
                            break;
                    }
                    exportDeferrer.done(function (data) {
                        kendo.saveAs({
                            dataURI: data,
                            fileName: fileName + '.' + k
                        });
                        if (options.afterExport)
                            options.afterExport(options, k);
                    });
                });
            });
        }
    });

    return $exportDrop ? $exportDrop : exportButtons[options.types[0]];
}

function getModelAndContainerFromKendoPopUp(e, primarykey) {
    var model;
    var container = $(e).closest(".k-popup-edit-form");
    if (!primarykey) //try to use kendo schema.model id property if possible...
    {
        try {
            primarykey = container.data("gridDS").options.schema.model.id;
        }
        catch (ex) {
            console.log(ex);
        }
    }
    var dataSource = container.data("gridDS");
    $.each(dataSource.data(), function (i, v) {
        if (v[primarykey ? primarykey : "ID"] == container.data("gridDSElementInEditID")) {
            model = v;
            return false;
        }
    })
    return { container: container, model: model };
}

var usersGeoLocation = null;
function fetchUsersGeoLocation() {
    var deferred = $.Deferred();
    navigator.geolocation.getCurrentPosition(
        function (location) {
            usersGeoLocation = location;
            location.mf = {
                user_latitude: usersGeoLocation.coords.latitude,
                user_longitude: usersGeoLocation.coords.longitude
            };
            deferred.resolve(location);
        },
        function (error) {
            deferred.reject(error);
        }
    );
    return deferred.promise();
}

//#region hide/show fields in popup 
function hideFieldsBasedOn(e, fn)//fn is the fieldname...
{
    var gridname, fieldname, $container, value;
    if (e.sender) {
        gridname = e.sender.element.attr("gridname") ? e.sender.element.attr("gridname") : $('tr[data-uid=' + e.sender.element.closest('.k-popup-edit-form').data("uid") + ']').closest('.k-grid').attr("gridname");
    } else {
        gridname = $('tr[data-uid=' + $(e).closest('.k-popup-edit-form').data("uid") + ']').closest('.k-grid').attr("gridname");
    }

    if (!gridname) {
        gridname = e.sender ? e.sender.element.closest('.k-popup-edit-form').data("gridname") : $(e).closest('.k-popup-edit-form');
    }
    //called from the field change event
    if (e.sender && !e.sender.element.data("kendoGrid")) {

        fieldname = e.sender.element.attr("name");
        $container = e.sender.element.closest('.k-popup-edit-form');
        value = e.sender.value();
    } else if (!e.sender && !$(e).data("kendoGrid")) {
        fieldname = $(e).attr("name");
        $container = $(e).closest('.k-popup-edit-form');

        var value = $(e)
        var type = value.attr("type");

        if (type && (type.toLowerCase() == 'radio' || type.toLowerCase() == "checkbox"))
            value = value.is(":checked");
        else
            value = value.val();
        //	value = $(e).value();
    }
    else {
        //called from the grid popup

        fieldname = fn;
        value = e.model[fn];
        $container = e.container;
    }
    hideFieldsBasedOn_(gridname, fieldname, value, $container);
}

function hideFieldsBasedOn_(gridname, fieldname, value, $container) {

    if (fieldname && changeEvents[gridname] && changeEvents[gridname][fieldname] && changeEvents[gridname][fieldname][value]) {
        if (changeEvents[gridname][fieldname][value].to_show)
            _showFields(changeEvents[gridname][fieldname][value].to_show, $container);
        if (changeEvents[gridname][fieldname][value].to_hide)
            _hideFields(changeEvents[gridname][fieldname][value].to_hide, $container);

    }
}

function _showFields(a, $container) {
    $.each(a, function (i, v) {
        $container.find("[name=" + v + "]").closest("[class*=col-]").show();
    });
}

function _hideFields(a, $container) {
    $.each(a, function (i, v) {
        $container.find("[name=" + v + "]").closest("[class*=col-]").hide();
    });
}
//#endregion

//#region wizard
/**
 * Gets from the database a new state for a form (inside or outside a wizard) when a change event of the form's field occurs
 * @param {any} value - the new value 
 * @param {any} formItems - property of the form
 * @param {any} scope - contains model of the from 
 * @param {any} element - Jquery of magic-form (not used at the moment)
 * @param {any} $timeout - angular timeout
 * @param {any} columnName - the changed field name
 */
function wizard_hideFieldsAndSteps(value, formItems, scope, element, $timeout, columnName) {
    var wizardScope = getWizardScope(scope);
    var model;
    //manage UTC in model of simple form. 
    if (!wizardScope) {
        //clone model, i cannot change it since form is working on it
        if (scope) {
            model = $.extend({}, scope.model);
            $.each(model, function (k, v) {
                if (v instanceof Date)
                    model[k] = toTimeZoneLessString(new Date(v.valueOf()));
            });
        }
    }
    else
        model = scope.model;

    var valueSolver = function (v) {
        if (typeof v == "string" && v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
            return toTimeZoneLessString(new Date(v));
        return v instanceof Date ? toTimeZoneLessString(new Date(v.valueOf())) : v;
    };

    var modelsValueSolver = function (wizardScope, model) {
        if (!wizardScope)
            return model;
        var models = {};
        $.each(wizardScope.models, function (stepKey, innermodel) {
            if (typeof innermodel == "object" || $.isArray(innermodel)) {
                var _model = {};
                $.each(innermodel, function (k, v) {
                    _model[k] = valueSolver(v);
                });
                models[stepKey] = _model;
            }
            else
                models[stepKey] = innermodel;
        });
        return models;
    };
    if (wizardScope || scope)
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.getDataSet({
                wizardCode: wizardScope ? wizardScope.wizardCode : null,
                stepKey: wizardScope ? wizardScope.step.stepKey : null,
                field: columnName,
                value: valueSolver(value),
                models: modelsValueSolver(wizardScope, model),
                formName: wizardScope ? null : scope.tableName
            }, window.wizardShowHideFieldsAndTabsSP ? window.wizardShowHideFieldsAndTabsSP : "CUSTOM.MagicWizard_hideFieldsAndSteps", true).then(function (result) {
                var fields_to_hide = result.length ? result[0] : [];
                var tabs = result.length > 1 ? result[1] : [];
                var fields_to_set = result.length > 2 ? result[2] : [];

                $.each(fields_to_hide, function (i, v) {
                    if (v.field)
                        toggleSchemaFormField(formItems, v.field, v);
                });
                $.each(tabs, function (i, tab) {
                    if (tab.stepkey)
                        toggleSchemaFormWizardStep(formItems, scope, tab.stepkey, tab.show, tab.editable === false);
                });
                $.each(fields_to_set, function (i, v) {
                    if (v.field)
                        toggleSchemaFormField(formItems, v.field, v, scope);
                });

                $timeout(function () { scope.$broadcast('schemaFormRedraw'); }, 100);
            });
        });
}


function stepIndexFromKey(steps, stepKey) {
    var index;
    $.each(steps, function (i, v) {
        if (v.stepKey == stepKey)
            index = i;
    });
    return index;
}


function toggleSchemaFormWizardStep(formItems, scope, stepKey, show, readonly) {


    //hides the tab of the previous contract subscriber person (tab 2.8) in the wizard
    //loop scope parents until I get the wizard scope
    var wizardScope = getWizardScope(scope);
    var wasHidden = false;
    var wasReadonly = false;
    var stepIndex = stepIndexFromKey(wizardScope.settings.steps, stepKey);

    if (wizardScope.settings.steps[stepIndex]) {
        wasHidden = wizardScope.settings.steps[stepIndex].hidden;
        wasReadonly = wizardScope.settings.steps[stepIndex].readonly;
    }

    if (show)
        delete wizardScope.settings.steps[stepIndex].hidden;
    else
        wizardScope.settings.steps[stepIndex].hidden = true;

    wizardScope.settings.steps[stepIndex].readonly = readonly;
    if (wasHidden && show || wasReadonly && !readonly)
        wizardScope.$broadcast('schemaFormValidate');
}

function toggleSchemaFormField(formItems, fieldName, v, scope) {
    var valueSolver = function (schematype, v) {
        // Handle undefined or null values
        if (v.value === undefined || v.value === null) {
            // For boolean schema type, we might want to default to false
            return schematype === "boolean" ? false : v.value;
        }

        // Handle different schema types appropriately
        if (schematype === "number") {
            // If empty string or not a valid number, return 0 or null
            if (v.value === "" || isNaN(parseFloat(v.value))) {
                return null;
            }
            return parseFloat(v.value);
        } else if (schematype === "boolean") {
            // Handle string values
            if (typeof v.value === "string") {
                const lowercaseValue = v.value.trim().toLowerCase();

                // Explicit true values
                if (lowercaseValue === "true" || lowercaseValue === "yes" || lowercaseValue === "1" ||
                    lowercaseValue === "on" || lowercaseValue === "y") {
                    return true;
                }

                // Explicit false values
                if (lowercaseValue === "false" || lowercaseValue === "no" || lowercaseValue === "0" ||
                    lowercaseValue === "off" || lowercaseValue === "n") {
                    return false;
                }

                // Empty string or non-standard value - default to false
                if (lowercaseValue === "" || lowercaseValue === "undefined" || lowercaseValue === "null") {
                    return false;
                }

                // For any other string value, check if it has content and return true/false
                return lowercaseValue.length > 0;
            }

            // Number values: 0 is false, any other number is true
            if (typeof v.value === "number") {
                return v.value !== 0;
            }

            // Handle actual boolean values or other types
            return Boolean(v.value);
        }

        // Default case - return the value as is
        return v.value;
    }
    if (formItems != null) {
        for (var rowKey = 0; rowKey < formItems.length; rowKey++) {
            for (var colKey = 0; colKey < formItems[rowKey].items.length; colKey++) {
                if (formItems[rowKey].items[colKey].items[0].key[0] == fieldName) {
                    try {
                        if (scope) {
                            var schematype = formItems[rowKey].items[colKey].items[0].schema.type;
                            if (formItems[rowKey].items[colKey].items[0].type.indexOf("searchgrid") !== -1) {
                                formItems[rowKey].items[colKey].items[0].defaultValuesTitleMap = [{
                                    value: valueSolver(schematype, v),
                                    name: v.valueDescription || v.value
                                }];
                                formItems[rowKey].items[colKey].items[0].titleMap = [{
                                    value: valueSolver(schematype, v),
                                    name: v.valueDescription || v.value
                                }];
                            }
                            scope.model[fieldName] = valueSolver(schematype, v);
                            break;
                        }
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                    if ('required' in v && v.required !== undefined && v.required !== null) {
                        switch (formItems[rowKey]?.items[colKey]?.items[0]?.type) {
                            case 'select':
                            case 'checkbox':
                            case 'number':
                            case 'text':
                            case 'searchgrid':
                            case 'datetimepicker':
                            case 'textarea':
                                formItems[rowKey].items[colKey].items[0].required = v.required;

                                // Handling the title modification " *"
                                let title = formItems[rowKey].items[colKey].items[0].title || '';
                                if (v.required) {
                                    // Add " *" if it doesn't already exist
                                    if (!title.endsWith(" *")) {
                                        formItems[rowKey].items[colKey].items[0].title = title + " *";
                                    }
                                } else {
                                    // Remove " *" if it exists
                                    if (title.endsWith(" *")) {
                                        formItems[rowKey].items[colKey].items[0].title = title.slice(0, -2);
                                    }
                                }
                                break;
                        }
                    }
                    if ('show' in v && v.show !== undefined && v.show !== null) {
                        formItems[rowKey].items[colKey].condition = v.show.toString();
                    }
                    if ('editable' in v && v.editable !== undefined && v.editable !== null) {
                        formItems[rowKey].items[colKey].readonly = v.editable === false ? true : false;
                    }
                    if (formItems[rowKey]?.items[colKey]?.items[0]?.type == 'searchgrid')
                        formItems[rowKey].items[colKey].items[0].disabled = v.editable === false ? true : false;
                    break;
                }
            }
        }
    }
}

function getWizardScope(scope) {
    var wizardScope = scope;
    try {
        while (wizardScope.$parent && !wizardScope.wizardCode) {
            wizardScope = wizardScope.$parent;
        }

        return wizardScope.wizardCode ? wizardScope : null;
    }
    catch (err) {
        return null;
    }
}

function wizardClearHiddenFields(scope, allData, element) {
    var wizardScope = getWizardScope(scope);
    var jContainer = element;
    var result = allData;
    var formItems = scope.formsItems;
    if (formItems) {
        Object.keys(formItems).forEach(function (stepKey) {
            var step = wizardScope.settings.steps[stepIndexFromKey(wizardScope.settings.steps, stepKey)];
            if (step.hidden) {
                result.data[stepKey] = null;
            } else {
                var stepFormItems = formItems[stepKey];
                for (var i = 0; i < stepFormItems.length; i++) {
                    for (var rowKey = 0; rowKey < stepFormItems[i].items.length; rowKey++) {
                        var row = stepFormItems[i].items[rowKey];
                        if (row.condition) {
                            var jStep = $(jContainer).find('[data-step-key="' + stepKey + '"]');
                            for (var colKey = 0; colKey < row.items.length; colKey++) {
                                var key = row.items[colKey].key[0];
                                //jQuery selectors:
                                //1: Standard components taked by name attribute
                                //2: Autocomplete components taked by on-select attribute
                                //3: Select components
                                var jInput = jStep.find('.schema-form-section *[name="' + key + '"], .schema-form-section *[on-select*="' + key + '"], .schema-form-section *[ng-model="' + key + '"]');
                                if (jInput.length == 0) {
                                    console.log("Deleting " + key);
                                    delete result.data[stepKey][key];
                                }
                            }
                        }
                    }
                }
            }
        })
    }
    return result;
}


//#endregion

//#region generic validators
function isaValidFormatVATCode(value) {
    var regexpVATCode = "^[0-9]{11}$";
    var patt = new RegExp(regexpTAXCode, "gi");
    return (patt.test(value));
}

function isaValidFormatTaxcode(value) {
    var regexpTAXCode = "^[a-zA-Z]{6}[0-9]{2}[abcdehlmprstABCDEHLMPRST]{1}[0-9]{2}([a-zA-Z]{1}[0-9]{3})[a-zA-Z]{1}$";
    var patt = new RegExp(regexpTAXCode, "gi");
    return (patt.test(value));
}

function apiGetResultUserMessage(aResult) {
    var userMessage = aResult.info.userMessage;
    if (userMessage.charAt(0) === '@') {
        var searchLabel = userMessage.substring(1);
        if (aResult.info.messagePayload)
            return getObjectText(searchLabel).formatObject(aResult.info.messagePayload);
        else
            return getObjectText(searchLabel);
    } else
        return userMessage;
}

function apiCallCheckTaxCode(info) {
    if (!isaValidFormatTaxcode(info.data.fiscalCode)) {
        info.onError({ userMessage: getObjectText('fiscalCodeInvalid') });
        return;
    }
    var jData = JSON.stringify(info.data);
    $.ajax(
        {
            url: 'api/Helper/checkFiscalCode',
            type: 'POST',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            async: info.async,
            data: jData,
            success: function (res) {
                try {
                    if (res.info.resultCode == 0) {
                        var calculatedFiscalCode = res.payload.calculatedFiscalCode.toUpperCase();
                        if (calculatedFiscalCode !== info.data.fiscalCode.toUpperCase()) {
                            info.onWarning({ userMessage: getObjectText('calculatedFiscalCode').format(calculatedFiscalCode) });
                        } else {
                            info.onSuccess({ userMessage: getObjectText('fiscalCodeOk') });
                        }
                    }
                    else {
                        info.onWarning({ userMessage: apiGetResultUserMessage(res) });
                    }
                }
                catch (err) {
                    info.onError({ userMessage: err.message });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var errMessage = textStatus + ' - ' + jqXHR.responseText;
                info.onError({ userMessage: errMessage });
            }
        }
    );
}

function apiCallCheckVATCode(info) {
    var jData = JSON.stringify(info.data);
    $.ajax(
        {
            url: 'api/Helper/CheckVATcode',
            type: 'POST',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            async: info.async,
            data: jData,
            success: function (res) {
                try {
                    if (res.info.resultCode === 0)
                        info.onSuccess({ userMessage: apiGetResultUserMessage(res) });
                    else if (res.info.resultCode === -2)
                        info.onWarning({ userMessage: apiGetResultUserMessage(res) });
                    else
                        info.onError({ userMessage: apiGetResultUserMessage(res) });

                }
                catch (err) {
                    info.onError(err.message);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var errMessage = textStatus + ' - ' + jqXHR.responseText;
                info.onError({ userMessage: errMessage });
            }
        }
    );
}

function apiCallCheckIBAN(info) {
    //checks if IBAN is valid
    var jData = JSON.stringify(info.data);
    $.ajax(
        {
            url: 'api/Helper/CheckIBAN',
            type: 'POST',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: jData,
            success: function (res) {
                try {
                    if (res.valid)
                        info.onSuccess({ userMessage: apiGetResultUserMessage(res) })
                    else {
                        info.onError({ userMessage: apiGetResultUserMessage(res) })
                    }
                }
                catch (err) {
                    info.onError({ userMessage: err.message });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var errMessage = textStatus + ' - ' + jqXHR.responseText;
                info.onError({ userMessage: errMessage });
            }
        }
    );
}

function apiExtractPersonModel(model) {
    if (typeof apiExtractCustomPersonModel == 'function') {
        return apiExtractCustomPersonModel(model);
    } else {
        var data = new Object();
        data.name = model.FirstName;
        data.surname = model.LastName;

        if (model.Gender_ID == 1)
            data.gender = 'M';
        else if (model.Gender_ID == 2)
            data.gender = 'F';
        else
            data.gender = null;

        data.DOB = (model.DateOfBirth) ? toTimeZoneLessString(new Date(model.DateOfBirth)) : null;
        data.nationOfBirthId = model.NationOfBirth_ID;
        data.cityOfBirthId = model.CityOFBirth_ID;
        data.fiscalCode = model.TaxCode;
        data.genre = model.Genre_ID;
        data.VATcode = model.VatNumber;
        return data;
    }

}

function checkTaxOrVATcode(e, showOk) {
    try {
        var model = $.extend({}, window.getCurrentModelInEdit());
        var data = apiExtractPersonModel(model);
        //data.fiscalCode = model[$(e).parent().find('input')[0].name];
        data.fiscalCode = $(e).parent().find('input').val();

        var info = {
            async: false,
            onSuccess: function (result) {
                if (showOk)
                    kendoConsole.log(result.userMessage, 'success');
            },
            onError: function (result) {
                kendoConsole.log(result.userMessage, 'error');
            },
            onWarning: function (result) {
                kendoConsole.log(result.userMessage, 'warning');
            }
        }
        //Se è una persona giuridica, allora controllo la partita IVA
        if (data.genre == 2) {
            info.data = { VATcode: data.fiscalCode };
            APIresult = apiCallCheckVATCode(info);
        }
        //Altrimenti se è una ditta individuale o una persona fisica, allora controllo il codice fiscale
        else if ((data.genre == 1) || (data.genre == 4)) {
            info.data = data;
            APIresult = apiCallCheckTaxCode(info);
        }
    }
    catch (err) {
        kendoConsole.log(err.message, true);
    }
}

function mfCheckTAXCode(value, key, scope) {
    var deferred = $.Deferred();
    var model = scope.model;
    var data = apiExtractPersonModel(model);
    data.fiscalCode = value;

    var info = {
        data: data,
        async: true,
        onSuccess: function (result) {
            //kendoConsole.log(result.userMessage, 'success');
            deferred.resolve();
        },
        onError: function (result) {
            scope.$broadcast('schemaForm.error.' + key, 'invalidTax', result.userMessage);
            deferred.reject();
        },
        onWarning: function (result) {
            kendoConsole.log(result.userMessage, 'warning');
            deferred.resolve();
        }
    };

    apiCallCheckTaxCode(info);
    return deferred.promise();
}

function checkVATcode(e, showOk) {
    try {
        var model = $.extend({}, window.getCurrentModelInEdit());
        var data = apiExtractPersonModel(model);
        data.VATcode = $(e).parent().find('input').val();
        var info = {
            data: data,
            async: false,
            onSuccess: function (result) {
                if (showOk)
                    kendoConsole.log(result.userMessage, 'success');
            },
            onError: function (result) {
                kendoConsole.log(result.userMessage, 'error');
            },
            onWarning: function (result) {
                kendoConsole.log(result.userMessage, 'warning');
            }
        }

        //Se è una persona giuridica o una ditta individuale, allora controllo la partita IVA   
        if ((data.genre == 2) || (data.genre == 4)) {
            apiCallCheckVATCode(info);
        }
    }
    catch (err) {
        kendoConsole.log(err.message, true);
    }
}

function mfCheckVATCode(value, key, scope) {
    var deferred = $.Deferred();
    var model = scope.model;
    var data = apiExtractPersonModel(model);
    data.VATcode = value;

    var info = {
        data: data,
        async: true,
        onSuccess: function (result) {
            //kendoConsole.log(result.userMessage, 'success');
            deferred.resolve();
        },
        onError: function (result) {
            scope.$broadcast('schemaForm.error.' + key, 'invalidVat', result.userMessage);
            deferred.reject();
        },
        onWarning: function (result) {
            kendoConsole.log(result.userMessage, 'warning');
            deferred.resolve();
        }
    };

    apiCallCheckVATCode(info);
    return deferred.promise();

}

function checkIBAN(e, showOk) {
    try {
        var data = new Object();
        data.IBAN = $(e).parent().find('input').val();
        var info = {
            data: data,
            async: false,
            onSuccess: function (result) {
                if (showOk)
                    kendoConsole.log(result.userMessage, 'success');
            },
            onError: function (result) {
                kendoConsole.log(result.userMessage, 'error');
            }
        }

        apiCallCheckIBAN(info);

    }
    catch (err) {
        kendoConsole.log(err.message, true);
    }
}

function mfCheckIBAN(value, key, scope) {
    var deferred = $.Deferred();

    var data = new Object();
    data.IBAN = value;

    var info = {
        data: data,
        async: true,
        onSuccess: function (result) {
            //kendoConsole.log(result.userMessage, 'success');
            deferred.resolve();
        },
        onError: function (result) {
            scope.$broadcast('schemaForm.error.' + key, 'invalidIBAN', result.userMessage);
            deferred.reject();
        },
        onWarning: function (result) {
            kendoConsole.log(result.userMessage, 'warning');
            deferred.resolve();
        }
    };

    apiCallCheckIBAN(info);
    return deferred.promise();
}

//#endregion

function openActionsTooltip(options) {

    if (!(options.element instanceof jQuery))
        options.element = $(options.element);
    var def = $.Deferred();
    requireConfigAndMore(["MagicSDK", "MagicActions"], function (MF) {
        MF.api.getDataSet(options.requestOptions, options.storeProcedureName).then(function (actions) {
            var normalizedActions = $.map(actions[0], function (v, i) {
                return $.extend(v, {
                    id: v.id || v.EV_ACTION_ID,
                    actionfilter: v.actionfilter || v.ActionFilter || v.EV_ACTION_FILTER,
                    actiondescription: v.actiondescription || v.actionDescription || v.ActionDescription || v.EV_ACTION_DESCRIPTION,
                    actiontype: v.actiontype || v.ActionType || v.EV_ACTTYP_CODE,
                    actioncommand: v.actioncommand || v.ActionCommand || v.EV_ACTION_COMMAND,
                    actioniconclass: v.actioniconclass || v.action_icon_class,
                    botype: v.botype,
                    count: v.count,
                    actionbackgroundcolor: v.actionbackgroundcolor || v.action_bck_colour,
                    Class: v.Class || v.ActionClassDescription || v.EV_ACTCLA_DESCRIPTION,
                    Type: v.Type || v.EV_ACTGRO_description || v.EV_ACTGRO_DESCRIPTION,
                    typeiconclass: v.typeiconclass || v.type_icon_class
                });
            });

            if (options && options.onActionsReady)
                options.onActionsReady(actions);

            if (actions.status && actions.status == 500) {
                kendoConsole.log(actions.responseText, true);
                return;
            }

            $("#" + options.accordionId).remove();
            options.element.kendoTooltip({
                position: "right",
                showOn: "click",
                autoHide: false,
                hide: function () {
                    $(this.popup.element[0]).closest('.k-animation-container').remove();
                },
                content: function () {
                    if (actions && actions[0] && actions[0].length)
                        return build3LevelBootstrapAccordion({ recordid: options.requestOptions.id, currentTarget: options.element, actions: normalizedActions }, options.accordionId, actionLinkReferenceBuilder);
                    else
                        return getObjectText("noactionfound");
                },
                width: "250px"
            }).trigger("tooltipCreated");
            options.element.data("kendoTooltip").show();
            if (actions && actions.length && actions[0].length) {
                setActionSettings(normalizedActions, "actionsettings", options.accordionId);
                setActionSettings(options.requestOptions, "request", options.accordionId);
                setActionSettings(options.actionrefs, "actionrefs", options.accordionId);
                setActionSettings(null, "subsettings");
            }
        });
    });
    return def.promise();
};

function rowButtonOpenGridWizard(e) {
    try {
        var jsonPayload = getRowJSONPayload(e),
            rowData = getRowDataFromButton(e),
            grid = $(e.currentTarget).closest('[data-role=grid]').data('kendoGrid');

        if (!jsonPayload.wizardCode)
            throw new Error('Missing wizardCode in jsonPayload!');

        openGridWizard(jsonPayload.wizardCode, rowData, grid);
    }
    catch (e) {
        console.log(e.message);
    }
}

function openGridWizard(wizardCode, rowData, grid, $kendoWindow, $parentGridRow) {
    var kendoWindow,
        recordId = rowData[grid.dataSource.options.schema.model.id],
        $element = $('<div ng-controller="GridWizardController as gw"><magic-wizard ng-if="gw.models" wizard-code="{{gw.wizardCode}}" options="gw.wizardOptions" models="gw.models" steps-settings="gw.stepsSettings"></magic-wizard></div>');

    initAngularController($element[0], 'GridWizard', {
        wizardCode: wizardCode,
        recordId: recordId,
        grid: grid,
        $parentGridRow: $parentGridRow,
        onError: function () {
            kendoWindow.close();
        },
        wizardOptions: {
            hideClearButton: recordId != 0,
            onWizardRendered: function () {
                kendoWindow.center();
            },
            onWizardComplete: function () {
                grid.cancelRow();
                grid.dataSource.read();
                //this variable decides if it should NOT clean the wizard
                // true = DO NOT CLEAN THE WIZARD
                // false = CLEAN THE WIZARD
                return false;
            },
            beforeSave: wizardClearHiddenFields
        }
    }, null, false, 'Magic_GridWizardController');

    if (!$kendoWindow) {
        $kendoWindow = $element
            .kendoWindow();
    } else {
        $kendoWindow
            .html($element);
    }

    $kendoWindow
        .closest('.k-widget')
        .removeClass('k-widget')
        .find('.k-header')
        .css('box-sizing', 'content-box');

    kendoWindow = $kendoWindow
        .data('kendoWindow');
    kendoWindow.open()
        .maximize();
}

var lastSpeechRecordCb;
function recordSpeech(callback, vocalId) {
    if (typeof annyang == 'undefined') {
        require(['3rd-party/annyang/annyang.min'], function (annyang) {
            if (!annyang) {
                console.warn('browser not supports speech recognition using annyang');
                window.vocalCommandsActive = false;
                $('.fa-microphone').remove();
                return;
            }
            annyang.abort();
            if (lastSpeechRecordCb) {
                annyang.removeCallback('resultNoMatch', lastSpeechRecordCb);
            }
            annyang.addCallback('resultNoMatch', lastSpeechRecordCb = function (phrases) {
                callback(phrases, annyang, vocalId);
            });
            annyang.setLanguage(window.culture);
            annyang.start();
        });
    } else {
        annyang.abort();
        if (lastSpeechRecordCb) {
            annyang.removeCallback('resultNoMatch', lastSpeechRecordCb);
        }
        annyang.addCallback('resultNoMatch', lastSpeechRecordCb = function (phrases) {
            callback(phrases, annyang, vocalId);
        });
        annyang.setLanguage(window.culture);
        annyang.start();
    }
}

var earlyRequires = [];
function earlyRequire(requireFn) {
    if (typeof gotRequirejs === 'undefined') {
        earlyRequires.push(requireFn);
    }
    else {
        requireFn();
    }
}

function launchEarlyRequires() {
    for (var i = 0; i < earlyRequires.length; i++) {
        (function (i) {
            setTimeout(function () {
                try {
                    earlyRequires[i]();
                }
                catch (e) {
                    console.warn("failed executing earlyRequire: " + e);
                }
            });
        })(i);
    }
}

function zoomByfilteringPrimaryKey(e) {
    var kgrid = $(e.target).closest(".k-grid").data("kendoGrid");
    var pkname = kgrid.dataSource.options.schema.model.id;
    if (!pkname) {
        console.error("primary key is undefined");
        return;
    }
    var tr = $(e.target).closest("tr");
    var iszoomed = kgrid.element.attr("iszoomed");

    var pkvalue = kgrid.dataItem(tr).id;

    var currefilter = kgrid.dataSource.filter();
    var newfilter;
    if (iszoomed) {
        newfilter = removeFiltersByType(currefilter, ["zoom"]);
        kgrid.element.attr("iszoomed", '');
    }
    else {
        newfilter = combineDataSourceFilters(currefilter, { type: "zoom", field: pkname, operator: "eq", value: pkvalue });
        kgrid.one("dataBound", function () {
            kgrid.expandRow(kgrid.element.find("tr.k-master-row:first"));
            kgrid.element.find("[class*='k-grid-zoom']").css("background-color", "deepskyblue");
        });
        kgrid.element.attr("iszoomed", true);
    }

    kgrid.dataSource.filter(newfilter);
}
/**
 * removes the zoom button from a grid object
 * @param {any} columns - the list of columns of the grid 
 */
function removeZoomButton(columns) {
    if (columns.length && columns[0].command) {
        for (var i = columns[0].command.length - 1; i >= 0; i--)
            if (columns[0].command[i].name && columns[0].command[i].name.indexOf("zoom") == 0 && columns[0].command[i].name.length > 4)
                columns[0].command.splice(i, 1);
    }
}

function getEssentialHTMLHeadTags(onloadFunctionName) {
    var tags = $.makeArray(
        $('head .MFessentialTag')
            .map(function (_, el) {
                return el.outerHTML;
            })
    );
    tags.push('<script src="' + window.includesVersion + "/Magic/v/" + window.applicationVersion + '/Scripts/require.js"></script>');
    if (onloadFunctionName) {
        tags.push('<script>' + onloadFunctionName + '();</script>');
    }
    return tags;
}

function openNewWindowContainingHTMLTemplate(uri) {
    var w = window.open(uri + window.location.search);
    w.essentialHeaderData = getEssentialHTMLHeadTags('initMFPage');
    return w;
}

function enableVocalCommandsForMainGridSearchField(searchField) {   //#vocalCommands
    if (!searchField || searchField.length == 0 || typeof searchField == "undefined") {
        return;
    }
    var micClass = 'maingridsearchandfilter-microphone';
    searchField.trigger('click');
    searchField.addClass('vocal-search');
    enableVocalCommandsForKendoPopupElements(searchField, micClass);
}

function enableVocalCommandsForKendoPopupElements(inputs, cssClassForMicSpan = null) {   //#vocalCommands
    $('.k-i-close').click(function () {
        stopAllRecordings();
    });

    $.each(inputs, function (i, input) {
        $input = $(input);
        if ($input.siblings('.fa-microphone').length == 0) {
            var rndId = getRandomString();
            var $micSpan = $('<span class="fa fa-2x fa-microphone pull-left" style="margin-right: 10px;" title="Start recording!" data-vocal-id="' + rndId + '"></span>');
            if (cssClassForMicSpan) {
                $micSpan.addClass(cssClassForMicSpan);
            }

            $input.attr('data-vocal-id', rndId);
            $micSpan.on('click', onVocalCommandClick);
            $micSpan.insertBefore(input);
            var inputWidthPx = $input.width();
            inputWidthPx -= $micSpan.width();
            var figoPadding = 9;
            inputWidthPx -= figoPadding;
            $input.attr('style', 'width: ' + inputWidthPx + 'px !important');
        }
    })
}
function enableVocalCommandsForKendoEditorFields(containers) {   //#vocalCommands
    $.each(containers, function (i, container) {
        var $toolbar = $(container).parent().siblings('[role="presentation"]').find('ul.k-editor-toolbar')
        var $textarea = $(container).children('textarea');
        if ($toolbar.children('.vocalCommand').length > 0) {
            return; //ALREADY INITIALIZED -> skip iteration
        }
        var rndId = getRandomString();
        var $micSpan = $('<li class="k-tool-group k-button-group vocalCommand pull-right" role="presentation"><a href="" role="button" class="k-tool k-group-start k-group-end" unselectable="on" title="Print"><span unselectable="on" class="fa fa-microphone fa-2x" data-vocal-id="' + rndId + '" ></span><span class="k-tool-text">Print</span></a></li>');
        $textarea.attr('data-vocal-id', rndId);
        $micSpan.attr('data-vocal-id', rndId);
        $micSpan.on('click', onVocalCommandClick);
        $toolbar.append($micSpan);
    });
}
function enableVocalCommandsForMagicFormElements(inputs) {   //#vocalCommands
    if (!window.vocalCommandsActive)
        return;
    $.each(inputs, function () {
        enableVocalCommandsForMagicFormElement($(this));
    })
}
function enableVocalCommandsForMagicFormElement($el) {   //#vocalCommands
    if ($el.siblings('.fa-microphone').length == 0) {
        var rndId = getRandomString();
        var $micSpan = $('<span class="fa fa-2x fa-microphone pull-left" style="margin-right: 10px;" title="Start recording!" data-vocal-id="' + rndId + '"></span>');
        $el.attr('data-vocal-id', rndId);
        $micSpan.attr('data-vocal-id', rndId);
        $micSpan.on('click', onVocalCommandClick);
        $micSpan.insertBefore($el);
        var magicPaddingMargin = 13;
        $el.width($el.width() - $micSpan.outerWidth() - magicPaddingMargin);
    }
}
var timeAfterRecordingIsStopped = 5000;
var timeBeforeRecordingIsStarted = 3000;
var lastSpeechRecording = null;
var currentSpeechRecordings = [];
function onVocalCommandClick($evt) {
    var vocalId = $(this).data().vocalId;
    var $micSpan = $('span[data-vocal-id="' + vocalId + '"]')
    var $input = $('input[data-vocal-id="' + vocalId + '"]')
    var widthDelta = 0;
    if ($input.length == 0) {
        $input = $('textarea[data-vocal-id="' + vocalId + '"]')
    }

    var currRec = $.grep(currentSpeechRecordings, function (recording) {
        return recording.id == vocalId;
    })[0];

    if ($micSpan.data().isRecording === true) {
        $micSpan.addClass('recording-ending');
        lastSpeechRecording = currRec;
        setTimeout(function () {
            if (lastSpeechRecording)
                stopRecording($input, lastSpeechRecording, $micSpan);
            lastSpeechRecording = null;
        }, timeAfterRecordingIsStopped);

        var myCallback;
        annyang.addCallback('resultNoMatch', myCallback = function (phrases) {
            currRec.text = currRec.text.trim();
            stopRecording($input, currRec, $micSpan);
            annyang.removeCallback('resultNoMatch', myCallback);
        });
    } else {
        if ($input.hasClass('k-input') && $input.attr('id') != "searchedtextautocomplete" && $input.attr('id') != "maingridsearchandfilter") {
            $input[0].style.cssText = 'width: 186px !important;'
        }
        else {
            if ($input.width() > 1600) {
                widthDelta = 10;
            } else {
                widthDelta = 8;
            }
            $input.width($input.width() - widthDelta)
        }
        $micSpan.removeClass('fa-microphone').addClass('fa-spinner').addClass('fa-pulse');
        $('.fa-microphone').not('.recording-vocals').parent().addClass('recording-cursor-disabled');
        $('.fa-microphone').not('.recording-vocals').addClass('recording-disabled');

        currentSpeechRecordings.push({ id: vocalId, text: "" });

        setTimeout(function () {
            recordSpeech(function (phrases, annyang, vocalId) {
                currRec = $.grep(currentSpeechRecordings, function (recording) {
                    return recording.id == vocalId;
                })[0];
                if (currRec)
                    currRec.text += phrases[0];
            }, vocalId);
            $micSpan.data().isRecording = true;
            $micSpan.removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-microphone').addClass('recording-vocals');
            if ($input.hasClass('k-input') && $input.attr('id') != "searchedtextautocomplete" && $input.attr('id') != "maingridsearchandfilter") {
                $input[0].style.cssText = 'width: 194px !important;'
            }
            else { //if ($input.attr('id') == "searchedtextautocomplete")
                $input.width($input.width() + widthDelta)
            }

            $micSpan.attr('title', "Stop recording!");
        }, timeBeforeRecordingIsStarted)
    }

    var $input = $('input[data-vocal-id="' + vocalId + '"]')
    if ($input.length <= 0) {
        $input = $('textarea[data-vocal-id="' + vocalId + '"]')
    }
}

function stopAllRecordings() {
    currentSpeechRecordings.forEach(function (rec) {
        var $input = $('input[data-vocal-id="' + rec.id + '"]');
        var $micSpan = $('span[data-vocal-id="' + rec.id + '"]');
        stopRecording($input, rec, $micSpan);
    });
    if (typeof annyang != 'undefined') {
        annyang.abort();
        if (lastSpeechRecordCb) {
            annyang.removeCallback(lastSpeechRecordCb);
        }
    }
    $('.recording-disabled').removeClass('recording-disabled');
    $('.recording-cursor-disabled').removeClass('recording-cursor-disabled');
    $('.recording-ending').removeClass('recording-ending');
    $('.recording-vocals').removeClass('recording-vocals');
}

function stopRecording($input, currRec, $micSpan) {
    if (!currRec.isRecordingStopped) {
        currRec.text = currRec.text.trim();
        if (currRec.text.length > 0) {          //add text in normal input field
            if (!$input.data('kendoEditor')) {
                var cursorStart = $input.prop("selectionStart");
                var cursorEnd = $input.prop("selectionEnd");
                if (cursorStart == cursorEnd) { //no text selected
                    if ($input.attr('id') == "searchedtextautocomplete" || $input.attr('id') == "maingridsearchandfilter") {
                        $input.val(currRec.text);
                    }
                    else if ($input[0] && $input[0].value.length == cursorStart) {
                        $input.val(function (i, val) {
                            return val + currRec.text; //append if cursor is at last position
                        });
                    } else {
                        var joinedValue = [$input[0].value.slice(0, cursorStart), currRec.text, $input[0].value.slice(cursorStart)].join(''); //add to cursorStart
                        $input.val(joinedValue);
                    }
                }
                else { //replace selected text with speech 
                    var oldValue = $input[0].value;
                    var textToReplace = oldValue.slice(cursorStart, cursorEnd);
                    var newValue = oldValue.replace(textToReplace, "");
                    var joinedValue = [newValue.slice(0, cursorStart), currRec.text, newValue.slice(cursorStart)].join('');
                    $input.val(joinedValue);
                }
                //if ($input.hasClass('form-control')) { //trigger validation if form field            
                //}
                $input.trigger('change');
            } else {    //kendoEditor case
                var kEditor = $input.data('kendoEditor');
                var selection = kEditor.getRange();
                var cursorStart = selection.startOffset;
                var cursorEnd = selection.endOffset;
                if (cursorStart == kEditor.value().length) { //last position
                    kEditor.value(kEditor.value() + currRec.text);
                } else if (cursorStart == cursorEnd) {
                    var newValue = kEditor.value().slice(0, cursorStart) + currRec.text + kEditor.value().slice(cursorStart, kEditor.value().length);
                    kEditor.value(newValue);
                } else {
                    var joinedValue = [kEditor.value().slice(0, cursorStart), currRec.text, kEditor.value().slice(cursorEnd)].join('');
                    kEditor.value(joinedValue);
                }
                kEditor.trigger('change');
            }
        }
        else {
            kendoConsole.log("Could not recognize speech. Please try again!");
        }
        if ($input.attr('type') == 'search') { //triggers autocomplete-search of grid
            $input.trigger('keyup');
        }
        if ($input.attr('id') == 'searchedtextautocomplete') {  //triggers autocomplete-search of menu
            var autocomplete = $input.data("kendoAutoComplete");
            autocomplete.search(currRec.text);
        }

        currentSpeechRecordings.splice(currentSpeechRecordings.indexOf(currRec), 1);
        $('.recording-disabled').removeClass('recording-disabled');
        $('.recording-cursor-disabled').removeClass('recording-cursor-disabled');
        $micSpan.data().isRecording = false;
        $micSpan.removeClass('recording-ending');
        $micSpan.removeClass('recording-vocals');
        $micSpan.attr('title', "Start recording!");

        annyang.abort();

        currRec.isRecordingStopped = true;
    }
}

if (window.vocalCommandsActive) {
    window.onblur = function () {   //stop recording if tab is changed        
        if (typeof annyang != 'undefined') {
            annyang.abort();
            stopAllRecordings();
        }
    }
}

function enableJsonValidationForElements(elements) {
    elements.on('keyup', validateJsonField);
    elements.on('focus', validateJsonField);
    elements.on('click', validateJsonField);
    elements.on('focusout', resetJsonValidationBackground);
}

var jsonValidationColors = {
    valid_green: "rgb(68, 157, 68, 0.3)",
    invalid_red: "rgb(217, 83, 79, 0.3)",
    neutral_white: "#fff"
};

var jsonValidationFields = [
    { gridname: "Magic_DataSource", attributeType: 'id', fields: ["OrderByFieldName", "CustomJSONParam", "Filter"] },
    { gridname: "Magic_Grid", attributeType: 'name', field: "BindedGridFilter" },
]

function selectJsonValidationFields(e) {
    var field = null;
    var target = $(e.target);
    var gridname = target.closest('#grid.k-grid').attr('gridname') || $('#grid.k-grid').attr('gridname');
    var validationParam = $.grep(jsonValidationFields, function (f) { return f.gridname == gridname })[0];

    if (!validationParam) {
        return;
    }

    if (target.is('td')) {
        field = $(e.target).children('[' + validationParam.attributeType + '=' + validationParam.field + ']');
    } else if (target.is('input') && ((validationParam.field && target.attr(validationParam.attributeType) == validationParam.field) || (validationParam.fields && validationParam.fields.includes(target.attr(validationParam.attributeType))))) {
        field = target;
    } else if (target.is('div') && target.hasClass('magicGridTd')) {
        field = $('[' + validationParam.attributeType + '=' + validationParam.field + ']');
    } else if (target.is('textarea') && validationParam.fields && validationParam.fields.includes(target.attr(validationParam.attributeType))) {
        field = target;
    }

    if (field && field.length > 0) {
        enableJsonValidationForElements(field);
    }
}

function validateJsonField(e) {
    var value = e.target.value;
    var target = $(e.target);
    var validationParam = $.grep(jsonValidationFields, function (f) { return f.field == target.attr('name') });
    if (value.length > 1) {
        if (isValidJson(value)) {
            target.css("background-color", jsonValidationColors.valid_green);
        } else if (validationParam.length > 0 && target.attr('name') == validationParam[0].field && isOneStringWithoutSpecialChars(value)) {
            target.css("background-color", jsonValidationColors.valid_green);
        } else {
            target.css("background-color", jsonValidationColors.invalid_red);
        }
    } else {
        target.css("background-color", jsonValidationColors.neutral_white);
    }
}

function isValidJson(str) {
    try {
        return JSON.parse(str);
    }
    catch (err) {
        return false;
    }
}

function isOneStringWithoutSpecialChars(str) {
    if (/^[a-zA-Z0-9- ]*$/.test(str) == false) {
        return false;
    }
    if (str.includes(" ") || str.includes("'") || str.includes('"') || str.includes(":")) {
        return false;
    }
    return true;
}

//const UPDATE_PASSWORD_COLUMNS = [
//    'Name',
//    'Email',
//    'IsLockedOut',
//];

//function updatePasswordForm(userData) {
//    var currentPWField = window.UserIsDeveloper === 'True' ? '' : '<input name="oldp" type="text" class="input-small" placeholder="Current password">';
//    var $form = $(`<form class="form-inline">
//  <input name="Username" type="text" value="${userData.Username}" class="input-small" placeholder="Username">
//  ${currentPWField}
//  <input name="newpwd" type="password" class="input-small" placeholder="Password">
//  <input name="confirmednewpwd" type="password" class="input-small" placeholder="Repeat the password">
//  <button type="submit" class="btn">Change password</button>
//</form>`);
//    $form.submit(function (e) {
//        e.preventDefault();
//        var paramObj = {};
//        $.each($form.serializeArray(), function (_, kv) {
//            paramObj[kv.name] = kv.value;
//        });
//        $.ajax({
//            url: '/api/Magic_Mmb_Users/changePassword',
//            data: JSON.stringify(paramObj),
//            contentType: 'application/json',
//            type: 'POST',
//        })
//            .then(
//                function () { kendoConsole.log('Ok', false); },
//                function (e) { kendoConsole.log(e); },
//            );
//    });
//    return $form;
//}

//function updatePasswordModal() {
//    requireConfigAndMore(["MagicSDK"], function (MF) {
//        MF.kendo.getGridObject({
//            gridName: "Magic_Mmb_Users",
//        }).then(function (res) {
//            if (window.UserIsDeveloper === 'True') {
//                var $el = $('<div id="' + id + '"></div>');
//                var id = 'updateUserPassword' + Math.random();
//                var commands = res.columns.find(c => c.command);
//                var $form = null;
//                commands.command.push({
//                    text: 'PW',
//                    click: function (e) {
//                        var tr = $(e.target).closest("tr");
//                        var data = this.dataItem(tr);
//                        if ($form) {
//                            $form.remove();
//                        }
//                        $form = updatePasswordForm(data);
//                        $el.prepend($form);
//                    }
//                });
//                res.columns = res.columns.filter(c => UPDATE_PASSWORD_COLUMNS.includes(c.field));
//                res.columns.unshift(commands);
//                var initialEdit = res.edit;
//                res.edit = function (e) {
//                    initialEdit(e);
//                };
//                MF.kendo.appendGridToDom({
//                    kendoGridObject: res,
//                    selector: $el,
//                })
//                    .then(function (kendoGrid) {
//                        showModal({
//                            content: $el,
//                            title: 'Users',
//                            onClose: function () {
//                                kendoGrid.destroy();
//                            }
//                        });
//                    });
//            }
//            else {
//                showModal({
//                    content: updatePasswordForm({ Username: window.Username }),
//                    title: 'Change password',
//                });
//            }
//        });
//    });
//}

function resetJsonValidationBackground(e) {
    $(e.target).css("background-color", "#fff");
}

if (window.jsonFieldValidationActive) {
    $(document).on('click', selectJsonValidationFields);
}

function openLink(el, fieldName) {
    let modelContainer = getModelAndContainerFromKendoPopUp(el);
    let link = modelContainer?.model[fieldName];
    if (link) {
        window.open(link);
    } else {
        kendoConsole.log("File non disponibile", true);
    }
}

function openGridInFullScreen(el) {
    var grid = $(el)
            .closest('.k-grid')
            .data('kendoGrid'),
        filter = grid.dataSource.filter(),
        sort = grid.dataSource.sort(),
        gridConfig = $.extend(true, {}, grid.options, {
            navigatable: true,
            toolbar: null,
            editable: false,
            groupable: false,
            reorderable: false,
            detailTemplate: null,
            detailInit: null,
            selectable: false,
            dataSource: {
                pageSize: 25,
                filter,
                sort
            },
        }),
        $modal = $(`<div id="fullscreen-grid-modal" class="modal fade">
            <div class="modal-dialog">
                <div class="modal-content">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <div class="k-grid"></div>
                </div>
            </div>
        </div>`);
    // remove all columns non binded to a field (buttons, commands, actions etc)
    gridConfig.columns = grid.columns
        .filter(column => !!column.field);
    $(document.body)
        .append($modal)
    $modal
        .modal('show')
        .one('hidden.bs.modal', () => $modal.remove())
        .one('shown.bs.modal', () => {
            // render grid when modal is opened
            var newGrid = $modal
                .find('.modal-content div')
                .kendoGrid(gridConfig)
                .data('kendoGrid');
            newGrid
                .bind('dataBound', () => {
                    // resize columns and content height after every data bound
                    newGrid.columns
                        .forEach(column => newGrid.autoFitColumn(column));
                    $('.k-grid-content', newGrid.element)
                        .attr('style', `max-height: calc(100vh - ${Math.round(newGrid.element.children().not('.k-grid-content').toArray().reduce((height, child) => height + $(child).outerHeight(), 45))}px) !important`);
                })
                .dataSource
                .fetch();
        });
}

function bindRemoveListenerToGrid(grid) {
    grid.bind("remove", function (e) {
        if (e.sender._editMode() === "incell" && e.sender.dataSource.online()) {
            e.sender.dataSource.remove(e.model);
            $.when.apply(null, e.sender.dataSource._send("destroy", e.sender.dataSource._destroyed))
                .then(function (res) {
                    e.sender.dataSource._destroyed = [];
                    if (res.response) {
                        var response = JSON.parse(res.response);
                        kendoConsole.log(response.message, msgTypeToConsole(response.msgtype));
                    }
                });
            return false;
        }
    });
}