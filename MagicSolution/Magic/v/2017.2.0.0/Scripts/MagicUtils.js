var largeSpinnerHTML = '<p class="text-center" style="padding: 20px;"><i class="fa fa-spinner fa-spin fa-5x"></i></p>';
var mediumSpinnerHTML = '<p class="text-center"><i class="fa fa-spinner fa-spin fa-2x"></i></p>';
var smallSpinnerHTML = '<p class="text-center"><i class="fa fa-spinner fa-spin"></i></p>';

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
                startswith: getObjectText("startswith"),
                eq: getObjectText("eq"),
                neq: getObjectText("neq"),
                isnull: getObjectText("isnull"),
                isnotnull: getObjectText("isnotnull")
            },
            number: {
                lt: getObjectText("lt"),
                lte: getObjectText("lte"),
                eq: getObjectText("eq"),
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
            datapost.filter = { field: cascadefromfield, operator: "eq", value: rowdata[cascadefrom], type:"cascadeFilter" };
        serverfilter = true;
    }
    else if (typeofdatasource === 1) {
        urlvalue = "/api/ManageFK/CallFKStoredProcedure";
        typemethod = "POST";
        serverfilter = true;
        datapost = { storedprocedurename: controllername, valuefield: valuefield, textfield: orderbyfield, schema: schema, rowdata: rowdata };
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
                    if (typeofdatasource !== 3 && valuefield !== undefined && orderbyfield !== undefined) { //se il datasource non e' un controller aggiungo il "valuefield" ed il "textfield"  al posto di value e text se mancano
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
                    if (!$("#" + dom, container).data("kendoMultiSelect"))
                    {
                        $("#" + dom, container).kendoMultiSelect({
                            dataValueField: valuefield,
                            dataTextField: orderbyfield,
                            dataSource:[],
                            valuePrimitive: true,
                            change: function (par) {
                                par.sender.element.trigger('cascade');
                            }
                        });
                    }
                    if ($("#" + dom, container).data("kendoMultiSelect") != null) {
                        var dropdown = $("#" + dom, container).data("kendoMultiSelect");
                        dropdown.setDataSource(data.items);
                        if (typeof initialvalue != "undefined") {
                            dropdown.value(initialvalue.split(","));
                            dropdown.trigger('change');
                        }
                    }
                }
                else {//it's a dropdownlist
                    if ($("#" + dom, container).data("kendoDropDownList") != null) {
                        var dropdown = $("#" + dom, container).data("kendoDropDownList");
                        dropdown.setDataSource(data.items);
                        if (typeof initialvalue != "undefined")
                            dropdown.value(initialvalue);
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
            $input.data("kendoMultiSelect").value(initialvalue.split(","));
            $.input.data("kendoMultiSelect").trigger("change");
        }
        else {
            var cascadedrop = $input.data(isMultiselect ? "kendoMultiSelect" : "kendoDropDownList");
            cascadedrop.setDataSource(ds);
            if (initialvalue && !cascadedrop.value()) {
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

//restituisce la lista di valori in formato value - text di un FK. 
function GetDropdownValues(tablename, valuefield, textfield, schema, typeofdatasource, filter, async,rowdata) {
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
            url: "/api/ManageFK/GetDropdownValues",
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
            url: "/api/ManageFK/CallFKStoredProcedure",
            data: JSON.stringify({ storedprocedurename: tablename, valuefield: valuefield, textfield: textfield, schema: schema, filter: filter, rowdata:rowdata ? rowdata : null }),
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
        if (tablename.indexOf(controllermethodseparator) != -1) {
            controllerfunction = tablename.split(controllermethodseparator)[1];
            tablename = tablename.split(controllermethodseparator)[0];
        }
        var result = $.ajax({
            type: "GET",
            async: async,
            url: "/api/" + tablename + "/" + controllerfunction,
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

function getdatasource(controllername, orderbyfield, controllerfunction, orderdir, parstring) {
    controllerfunction = (typeof controllerfunction === "undefined") ? "GetAll" : controllerfunction;
    var type = (controllerfunction.substring(0, 3) === "Get") ? "GET" : "POST";
    var ds = new kendo.data.DataSource({
        transport: {
            read: {
                type: type,
                async: false,
                serverFiltering: false,
                url: "/api/" + controllername + "/" + controllerfunction,
                contentType: "application/json"


            },
            parameterMap: function (options, operation) {
                return kendo.stringify(options);
            }

        },
        change: function (data) {
            return data.items;
        },
        sort: { field: orderbyfield, dir: orderdir == null ? "asc" : orderdir }
    });
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
                url: "/api/" + controllername + "/" + method,
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
function buildXMLStoredProcedureReturnDataSet(data, storedprocedurename) {
    var dataavailable = new $.Deferred();
    data.storedprocedure = storedprocedurename;
    $.ajax({
        url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure", type: "POST", data: JSON.stringify(data),
        success: function (e) {
            var tables = []
            $(e).each(function (i, v) {
                if (v.drows.length)
                    tables.push(v.drows[0].Table);
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
            options.data = JSON.stringify(dataobj);
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

    if (workflowid in savedCoordinates) {
        var coordinates = savedCoordinates[workflowid];
    }
    else
        var coordinates = JSON.parse($(e.delegateTarget).data("kendoGrid").dataItem($(e.currentTarget).closest("tr"))["EndpointCoordinates"]);
    var endpointmodel = '<div class="w" style="top:{2}em;left:{3}em;{4}" id="{0}">{1}<div class="ep"></div></div>';  //{0} id =act_activityid , 1 activity Description
    //GetWorkFlow operations ordered by Ordinal Position
    var precedences = {};
    //opero la get di tutte le precedenze costruendo un' hash table che abbia come key l' ID di un' attivita' e come values le attivita' che la precedono
    $.ajax({
        type: "POST",
        async: false,
        url: "/api/GENERICSQLCOMMAND/GetWithFilter",
        data: JSON.stringify({ table: precendencestab, order: "1", where: "Workflow_ID =" + workflowid }),
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
        type: "POST",
        url: "/api/GENERICSQLCOMMAND/GetWithFilter",
        data: JSON.stringify({ table: activitiestab, order: orderbyactivitytabfieldnum, where: "isnull(Active,0)<>0 AND Workflow_ID =" + workflowid }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
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
                </div></div></div>'

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
        //filter from tree selection
        var filter = { field: gridobj.dataSource.schema.model["id"], operator: "eq", value: nodeinfo.assetid, type: "navigationFilter" };
        if (nodeinfo.gridtoopen.split('|').length > 1) {
            var filters = [];
            $.each(nodeinfo.gridtoopen.split('|'), function (i, v) {
                if (i > 0) //scarto il gridname
                    filters.push(JSON.parse(v));
            })
            filters.push(filter);
            filter = { logic: "AND", filters: filters, type: "treefilter" };
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
        nodeparent.items.push({ selected: node.TREE_SELECTED, expanded: node.TREE_OPEN , assettoexplode: node.TREE_LABEL, gridtoopen: node.TREE_URL, assetid: node.TEMP_OBJ_ID, nodeid: node.TREE_ID, nodeparentid: node.TREE_PARENT_ID, type: node.TEMP_OBJ_TYPE, imageUrl: node.TREE_ICON, title: node.TREE_TITLE, items: [] });
    }
    //get current node list of children
    var children = convertDatabaseToLocalJSONTreeSearchChildren(allnodes, node.TREE_ID);
    //go back to its caller if this is a leaf
    if (children.length === 0) {
        if (nodeparent !== null) {
            //se non ho figli cancello l' oggetto aggiunto e lo riaggiungo togliendo gli items (evita di mostrare il > per aprire il nodo se non ha figli)
            nodeparent.items.splice(-1);
            nodeparent.items.push({ selected: node.TREE_SELECTED, expanded: node.TREE_OPEN , assettoexplode: node.TREE_LABEL, gridtoopen: node.TREE_URL, assetid: node.TEMP_OBJ_ID, nodeid: node.TREE_ID, nodeparentid: node.TREE_PARENT_ID, type: node.TEMP_OBJ_TYPE, imageUrl: node.TREE_ICON, title: node.TREE_TITLE });
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
                    buildHtmlTree("thetreecontainer_" + name, name + "_" + databasetreeid, draggable, itemstemplate, selectNodeFunction, dropFunction, dragStartFunction, name + "_" + databasetreeid + "_search", false, true, outertreecontainer, showdescr);
                    //tree contains all the definition
                    renderTree(tree, "thetreecontainer_" + name, name + "_" + databasetreeid, description, name + "_" + databasetreeid + "_search");
                    if (typeof callback == "function")
                        callback();
                    if (hidenodeselector)
                        $(hidenodeselector).hide();
                    var treecontainerdiv = "#thetreecontainer_" + name;
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
                    if (functionhasgrids && $("#left-pane").length)
                    {
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
    grid = $(element).parents(".k-grid").data("kendoGrid");
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

function exportTofile(e, format) {
    exportobject = window.HashOfExportableGrids[$(e).closest(".k-grid").attr("gridName")];
    var thegridtoexportds = $(e).closest(".k-grid").data("kendoGrid").dataSource;
    var filter = thegridtoexportds.filter();
    if (filter)
        filter = JSON.parse(kendo.stringify(filter)); //normalizzazione filtri su date.
    exportobject.select = $(e).closest(".k-grid").data("kendoGrid").columns.map(function (v, i) {
        if (v.field && v.field != null && v.field != '' && v.field != undefined)
            return v.field;
    });
    exportobject.columns = kendo.stringify($(e).closest(".k-grid").data("kendoGrid").columns);
    if (!format)
        exportobject.format = "csv";
    else
        exportobject.format = format;
    exportobject.filter = filter === undefined ? null : filter;
    try {
        exportobject.model = JSON.stringify([thegridtoexportds.options.schema.model]);
    }
    catch (exc) {
        console.log(exc);
    }
    $.fileDownload('/api/GENERICSQLCOMMAND/ExportTofile/', { data: exportobject, httpMethod: "POST" });
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

    if (e.sender._destroyed.length == 0) // se e' una delete voglio che il rebind avvenga
    {
        grid.one("dataBinding", function (e) {
            e.preventDefault(); // cancel grid rebind if error 
        });
    }
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

function msgTypeToConsole(msgtype)
{
    var consoleflag = false;
    switch (msgtype) {
        case "INF": 
        case "OK":
            break;
        case "WARN":
            consoleflag = "info";
        case "ERR":
            consoleflag = true;
    }
    return consoleflag;
}

function renderGrid(rootgridobj, rootgridclass, container, gridid, title) {

    var jquerygrid = null,
        $grid;
    if (gridid && gridid instanceof jQuery) {
        $grid = gridid;
    }
    else {
        gridid = gridid === undefined ? "grid" : gridid;
        //se il div non esiste lo creo preceduto da titolo se presente
        if ($("[id^=grid][data-role=grid]").length > 0 && $("#" + gridid).length == 0) // the div does not exists but other grids are in the page 
            $("[id^=grid][data-role=grid]").last().after('<br><div id="' + gridid + '" data-role="grid"></div>');
        else
            if ($("#" + gridid).length == 0) //grid div is missing and it's the first grid of the page
                $("#appcontainer").prepend('<br><div id="' + gridid + '" data-role="grid"></div>');

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
    //enable fast search if the template is in the toolbar
    if (name !== "")
        //checkAndInitializeFastSearch(name,jquerygrid);
        checkAndInitializeFastSearch(jquerygrid);

    var grid = jquerygrid.data('kendoGrid');

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

    if (grid.options.editable) {
        grid.bind('save', function (e) {
            manageGridUploadedFiles(jquerygrid)
        });
        grid.bind('saveChanges', function (e) {
            manageGridUploadedFiles(jquerygrid)
        });
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

    $("#appcontainer").trigger("kendoGridRendered", [grid, gridid]);
    return element;
}

function manageGridUploadedFiles($container) {
    var data = $container.data();
    if (data.filesToDelete || data.filesToSave) {
        return $.ajax({
            type: 'POST',
            url: '/api/MAGIC_SAVEFILE/ManageUploadedFiles',
            contentType: "application/json; charset=utf-8",
            async: "saveFilesAsync" in data ? data.saveFilesAsync : true,
            data: JSON.stringify({
                filesToSave: data.filesToSave || [],
                filesToDelete: data.filesToDelete || []
            }),
            success: function () {
                delete data.filesToSave;
                delete data.filesToDelete;
            },
            error: function () {
                var files = $.map((data.filesToSave || []).concat(data.filesToDelete || []), function (v) { return v.name; })
                kendoConsole.log(getObjectText("manageUploadFilesError").format(files.join(', ')), "error");
            }
        });
    } else {
        var defer = $.Deferred();
        setTimeout(function () {
            defer.resolve();
        }, 0);
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
            var colidx = getcolumnindex(jquerygrid.data("kendoGrid").columns,fieldsingrid[i].field);
            if (props && (props.type == "string" || jquerygrid.data("kendoGrid").columns[colidx].values))
            {
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
            ext = name.match(/\.(\w{3,})$/)[1].toLowerCase(),
            icon = "";
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

            if (typeof fileLinkOverrides != "undefined" && gridName && colName) {
                if ((gridName in fileLinkOverrides) && (colName in fileLinkOverrides[gridName])) {
                    href = "javascript:void(0)";
                    attribute = ' onclick="' + fileLinkOverrides[gridName][colName] + '(event)"';
                }
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

function onUploadSelect(e) {
    $.each(e.files, function (k, file) {
        e.files[k].name = Date.now().toString() + "-" + e.files[k].name.replace(/&(#\d+|\w+);|[^\w\.-]/g, '');
    });
}

function onUpload(e) {
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
        var savepath = managesavepath(e.sender.options.savepath);
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
        savePath = managesavepath(e.sender.options.savepath || "");

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

    //aggiorno il valore nel datasource della griglia in edit.
    if (dataRow) {
        dataRow[e.sender.element[0].name] = value.length ? (adminAreaUpload || onUploadsWriteFileNameOnly) ? value : JSON.stringify(value) : '';
        dataRow.dirty = true;
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
        navigatable: true,
        editable: {
            mode: "popup", confirmation: getObjectText("CONFIRMATION")
        },
        detailTemplate: null,
        detailInit: null,
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
                                        text =kendo.widgetInstance(e.container.find("[name=" + name + "]")).value() ? toTimeZoneLessString(new Date(kendo.widgetInstance(e.container.find("[name=" + name + "]")).value())) : null;
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
                manageGridUploadedFiles(e.sender.wrapper);
            }
            else
                window.lastClickedSaveBtnContainer = e.container.data("uid") ? e.container.data("uid") : null;

        }
    };
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

    var element = getDefaultGridSettings();
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
            function manageActionInCellGrids()
            {
                if ($("#gridshowactions").length>0)
                    if ($("#gridshowactions").attr("closeonsave")) {
                        $("#wndmodalContainer").modal("toggle");
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
                setTimeout(function () { $(".k-widget .k-grid-update").show().prev().remove() }, 500);
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
                kendoConsole.log(msg, consoleflag);
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
                if (typeof response == "string" && response.indexOf("<!DOCTYPE html>")!=-1)
                {
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
                                        if (parseXml(value[prop]) && value[prop])
                                        {   //turn it into JSON and then into JS object
                                            var xmldoc = parseXml(value[prop]);
                                            var jsonstring = xml2json(xmldoc, ' ');
                                            var o = JSON.parse(jsonstring);
                                            //Add to the dataset the splitted XML values
                                            for (var proptoadd in o[prop]) {
                                                if (!isNaN(Date.parse(o[prop][proptoadd])) && (o[prop][proptoadd].split('/').length == 3)) //se e' una data la trasformo in un oggetto date
                                                {
                                                    //   if (o[prop][proptoadd].split('/').length == 3) //il formato deve contenere giorno, mese , anno per essere considerato una data (in cui vengono salvate le date XML)
                                                    value[proptoadd] = new Date(o[prop][proptoadd]);
                                                }
                                                else { //la riporto come da XML
                                                    value[proptoadd] = o[prop][proptoadd];
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
            url: "/api/Magic_Grids/GetByName",
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
                gridcode: gridcode,
                gridrelationtype: gridrelationtype
            });
        }


    }

};
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
                //pre-render custom fnctn
                //if (typeof prerenderdispatcher == 'function')
                //    prerenderdispatcher(data.element, window.detailfunctionname, data.e, data.tabclass, result);

                renderGrid(data.element, data.tabclass, $(e.contentElement));
                if (typeof postrenderdispatcher == 'function')
                    postrenderdispatcher(data.element, window.detailfunctionname, data.e, data.tabclass);
            }
        });
    }
}

function addOptionalColumns(columns, data, gridExtension) {
    if (data.ShowHistory == true)
    {
        var boDescriptionColumn  = gridExtension && gridExtension.new_bo_mail_settings && gridExtension.new_bo_mail_settings.bo_description_column ? gridExtension.new_bo_mail_settings.bo_description_column : "";
        columns.push({ title: getObjectText("History"), width: "60px", template: '#= historyColumn("' + data.FromTable + '","' + data.DocRepositoryBOType + '","' + boDescriptionColumn +'")#', filterable: false });
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
                var actionobj = { title: getObjectText("workflowactions"), width: "120px", template:  getcolumnforactionworkflow , filterable: false, columnType: "workflowActions" }
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
function getGridExportTemplate() {
    return '<div class="btn-group pull-right">\
                <button type="button" title="'+ getObjectText("export") + '" class="k-button dropdown-toggle" data-toggle="dropdown">\
                <span class="fa fa-sign-out"/></button>\
                <ul class="dropdown-menu" role="menu">\
                <li>{0}</a></li>\
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

function evaluatePageSize(element) {
    // se le pagine sono state impostate >= 100000 vado a disattivare il paging lato server (significa che non viene passato skip/take che verra' impostato server side a 0 / 100000) 
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
function setOverridesToMenuData(gridname,data)
{
    var objToStore = getOverridesFromMenuData(gridname);
    if (!objToStore)
        objToStore = {};
    objToStore[gridname] = data;
    $(".menuId-" + getMagicAppURIComponents().menuId).data("overrides", objToStore);
}
function getOverridesFromMenuData(gridName,key)
{
    var data = $(".menuId-" + getMagicAppURIComponents().menuId).data("overrides");
    if (data && data[gridName] && data[gridName][key])
        return data[gridName][key];
    return false;
}
//Modify columns for XML fields 
function modifyXmlColumnSet(userFields, containerCol, columns, editFormColumnNum, columnsoverride) {
    $.each(userFields.fields, function (k, v) {
        if (!v.containerColumn)
            v.containerColumn = containerCol;
        var dsinfo = v.dataSourceInfo ? v.dataSourceInfo : {};
        var currentlang = window.culture.substring(0, 2);
        var label = v.labels[currentlang] ? v.labels[currentlang] : k
        var additionalattributes = (v.validation && v.validation.required) ? "required" : "";
        additionalattributes = additionalattributes + " iscustomerfield=true";//add an attribute in order to identify inputs after append
        if (v.column_format) {
            var colformat = v.column_format.indexOf("0:") != -1 ? v.column_format.replace("0:", "") : colformat;
            additionalattributes = additionalattributes + " data-format=\"" + colformat + "\"";
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
            default:
                v.popupHtml = userFields.dataRolesHtml[v.dataRole].format(k, label, additionalattributes);
                break;
        }
        var column;
        //if columns have been overriden then i ignore the standard setting
        if ((!columnsoverride && v.visibleAsColumn) || (columnsoverride && columnsoverride.indexOf(k)!=-1)) {
            column = { field: k, title: label };
            if (v.column_template)
                column.template = v.column_template;
            if (v.column_format)
                column.format = v.column_format;
            if (v.column_attributes)
                column.attributes = { style: v.column_attributes };

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
    if (!containerCol)
        return;
    //set before creating grids...
    var columnsoverride = getOverridesFromMenuData(result.MagicGridName, "xmlcolumnsoverride"); 
    modifyXmlColumnSet(result.userFields, containerCol, columns, result.EditFormColumnNum, columnsoverride ? columnsoverride : null);
    $.extend(model.fields, result.userFields.fields);
}
//#endregion
function fillgridelementWithDBdata(result, element, gridcode, layerid, functioname, functionid, gridname, gridrelationtype, e, tabclass, $parentGridRow) {
    //if no funcitonid is passed into this function we are going to lookup the funcid attr of the menuPt
    //because this funcid could differ from the functionId on the config-db we have to look it up
    //resolve config functionId 
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

        element.gridcode = gridcode;
        element.functionid = functionid;
        console.log("MagicUtils.js::fillgridelementWithDBdata::begins for grid " + gridcode + " " + new Date().toLocaleString());
        var data = result,
            saveGridSettings = !e && (!gridname || !gridname.match(/_searchgrid$/i));
        //La risposta varia a seconda che sia sicrona o asincrona
        if (result.responseJSON !== undefined)
            data = result.responseJSON;

        //template overwrite - component designer
        if (data.overwrittenColumns) {
            var editableTemplate = $('#' + data.EditableTemplate);
            if (editableTemplate.length > 0) {
                var $editableTemplateHTML = $(editableTemplate.html());
                $.each(data.overwrittenColumns, function (k, v) {
                    var label = $editableTemplateHTML.find("label[for='" + k + "']");
                    if(!label.length)
                        label = $editableTemplateHTML.find("label[for='" + $editableTemplateHTML.find("input[name='" + k + "']").attr("id") + "']");
                    if(!label.length)
                        return;
                    if (v.hide)
                        label.parent().parent().hide();
                    if (v.title)
                        label.html(v.title);
                });
                editableTemplate.html($editableTemplateHTML);
            }
        }

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
        manageUserFields(data, model[0],gridExtension,columns);
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

        //handle grids which shall call the controller with batch data
        try {
            var customParam = eval("[" + data.CustomJSONParam + "]")[0];
            if (customParam.batch)
                element.dataSource.batch = customParam.batch;
        }
        catch (e) {
        }

        var transport = eval(data.MagicGridTransport);

        element.EntityName = data.FromTable;

        element.dataSource.transport = transport[0];
        element.dataSource.transport.CustomJSONParam = data.CustomJSONParam;
        //Di seguito la creazione delle request di input per i controller (parameterMap)
        
        addOptionalColumns(columns, data, gridExtension);
        element.dataSource.transport.parameterMap = function (options, operation) {
            function getModelForWrites(model,options)
            {
                if (!options.listOfXMLFieldsInPopUp && options.MagicBOLayerID == undefined)
                    return model[0];
                var modelrevision = JSON.parse(JSON.stringify(model));//jQuery.extend({}, model);
                var liskofkeys = Object.keys(modelrevision[0]["fields"]);
                $(liskofkeys).each(function (i, v) { //cancellazione dei campi che non fanno parte del layer dell' oggetto che sto salvando
                    if (model[0]["fields"][v].containerColumn) //campo che sta nell' xml
                    {   //se e' una colonna con container XML il layer deve essere collegato ad un qualche campo del DB target. Se non trovo questo collegamento cancello le proprieta' dei campi XML
                        //window[layerlistname] e' un array popolato in fase di edit popup che contiene la lista dei layer che il row si porta dietro (sulla base del valore di un certo campo legato al layer su tabella target es. TIPDOC) 
                        if (options.MagicBOLayerID != undefined) {
                            if (options.MagicBOLayerID == null || !window[layerlistname]) //se l' oggetto non appartiene ad uno specifico layer cancello i campi specifici dei layer
                                delete modelrevision[0]["fields"][v];
                            if (window[layerlistname] && window[layerlistname] != null) {
                                if (window[layerlistname].indexOf(model[0]["fields"][v].Layer_ID) == -1) //se l'  oggetto ha un layer diverso da quello del campo esaminato lo cancello
                                    delete modelrevision[0]["fields"][v];
                            }
                        }
                        else if (options.listOfXMLFieldsInPopUp && !options.listOfXMLFieldsInPopUp[v])
                        {
                            delete modelrevision[0]["fields"][v];
                        }
                     }
                });
                return modelrevision["0"];
            }

            var colnames = [];
            var dateCols = [];
            for (var i = 0; i < columns.length; i++) {
                {
                    if (typeof columns[i].title != "undefined") {
                        if (columns[i].field != null)
                            colnames.push(columns[i].field);
                    }
                }
            }

            if (operation != "read") {
                if (options.MagicBusinessObjectList !== undefined)
                    options.MagicBusinessObjectList = JSON.stringify($('#tabstrippopup .bo-tagbox').bOSelector('getBOs'));

                //parse Date - eliminate Timezone
                try {
                    allPropertiesToTimeZoneLessString(options);
                }
                catch (e) {
                    console.log('Error while parsing date for grid POST: ' + e);
                }
                options.cfglayerID = layerid === undefined ? null : layerid;
                options.cfgEntityName = data.FromTable;
                options.cfgfunctionID = functionid;
                options.cfgoperation = operation;
                options.cfgGridName = data.MagicGridName;
                //contiene un oggetto JSON attraverso il quale si possono passare dei parametri custom (es. il nome di una stored impostata dall' untente sul datasource)
                options.cfgDataSourceCustomParam = data.CustomJSONParam;
                options.cfgColumns = colnames;
                options.cfgpkName = model[0].id;//eval(data.MagicGridModel)[0].id;
                options.cfgModel = getModelForWrites(model, options);
                options.cfgsnapShot = gridExtension ? gridExtension.snapshot : false;
                if (!options.cfgsnapShot)
                    $("#appcontainer").data("snapshot", null);
                if ($("#appcontainer").data("snapshot"))
                    options.cfgsnapShotData = $("#appcontainer").data("snapshot");
                return kendo.stringify(options);
            }
            else {
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
                options.layerID = layerid  === undefined ? null : layerid;
                options.GridName = data.MagicGridName;
                options.EntityName = data.FromTable;
                options.functionID = functionid;
                options.operation = operation;
                options.Model = JSON.stringify(model);//data.MagicGridModel;
                options.Columns = colnames;
                //contiene un oggetto JSON attraverso il quale si possono passare dei parametri custom (es. il nome di una stored impostata dall' untente sul datasource)
                options.DataSourceCustomParam = data.CustomJSONParam;
                //insertion of the eventual Qs as a parameter 
                if (getQsPars())
                    options.data = kendo.stringify({ actionfilter: getQsPars() });

                if (usersGeoLocation) {
                    options.user_latitude = usersGeoLocation.coords.latitude;
                    options.user_longitude = usersGeoLocation.coords.longitude;
                }

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
            return options;
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
     for (var key in xmlFilter) {
            if (xmlFilter.hasOwnProperty(key)) {
                element.xmlFields = xmlFields;
                $.each(xmlFields, function (k) {
                    xmlFilter[k] = {
                        column: k,
                        type: "string"
                    };
                });
                xmlFields = Object.keys(xmlFields).join(" || ");
                if (!window.xmlExtensionOverride || window.xmlExtensionOverride[gridcode] !== false)
                    columns.push({
                        title: '<span class=\'' + (element.columnMenu ? 'k-header-column-menu' : 'k-grid-filter') + '\'><span class=\'k-icon ' + (element.columnMenu ? 'k-i-arrowhead-s' : 'k-filter') + '\'></span></span><span class=\'k-link\'>' + getObjectText("typeExtension") + '</span>',
                        headerAttributes: {
                            "class": "k-with-icon xmlFilterColumn",
                            "onclick": "addXMLFilters(this)"
                        },
                        width: "90px",
                        template: '#if (' + xmlFields + ') { # <div style="text-align:center;"><span class="glyphicon glyphicon-th-list" style="cursor:pointer;" onclick="gridShowRowXml(this)"></span></div> # } #'
                    });
                element.xmlFilters = xmlFilter;
                break;
            }
        }
        manageHiddenColumns(result, columns);
        element.columns = columns;
        //handles grid properties in DB
        element.selectable = function () {
            if (data.Selectable == null || data.Selectable == "false")
                return false;

            var match = data.Selectable.match(/^multiple(,\s*(\w+))?$/);
            if (match && 'ontouchstart' in window)
                return match[2] || "row";
            else
                return data.Selectable;
        }();
        element.groupable = (data.Groupable != "true" && data.Groupable != null) ? eval(data.Groupable) : element.groupable;
        if (element.groupable != false)
            manageGroupedFields(result, element);
        element.sortable = data.Sortable != null ? eval(data.Sortable) : element.sortable;
        element.dataSource.pageSize = data.PageSize != null ? eval(data.PageSize) : element.dataSource.pageSize;
        evaluatePageSize(element);
        //#region fk management
        if (data.Editable != null)
            if ((data.Editable == "true") || (data.Editable == "false")) {
                element.editable = toBoolean(data.Editable);
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
                            if (!jqObject)
                            {
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
        if (data.Editable === "popup") {
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
            element.toolbar.push({ template: standardGridfastsearch });
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
        if (element.selectable && data.DocRepositoryBOType && gridExtension.new_bo_mail_settings && gridExtension.new_bo_mail_settings.show_new_mail_button && gridExtension.new_bo_mail_settings.bo_description_column) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"" + getObjectText("newGridBOMail") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"openGridNewBOMail(this, '" + gridExtension.new_bo_mail_settings.bo_description_column + "', '" + data.DocRepositoryBOType + "', " + JSON.stringify(gridExtension.new_bo_mail_settings.system_message_templates || []).replace(/"/g, "'") + ")\"><span class=\"fa fa-envelope\"></span></a>"
            });
        }
        if (gridExtension.show_bo_note_button) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"" + getObjectText("newGridBOMemo") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"openGridNewBOMemo(this, '" + gridExtension.new_bo_mail_settings.bo_description_column + "', '" + data.DocRepositoryBOType + "')\"><span class=\"fa fa-sticky-note\"></span></a>"
            });
        }
        if (saveGridSettings) {
            element.toolbar.push({
                template: "<a class=\"k-button pull-right\" title=\"" + getObjectText("autoResizeColumns") + "\" data-role=\"tooltip\" href=\"javascript:void(0)\" onclick=\"autoResizeColumns(this)\"><span class=\"fa fa-arrows-h\"></span></a>"
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
        if (element.selectable && element.selectable.indexOf("multiple") == 0) {
            element.toolbar.push({
                template: "<button role='button' type='button' class=\"k-button\" title=\"" + getObjectText("selectAll") + "\" href=\"javascript:void(0)\" onclick=\"selectAllGridRows(this)\">" + getObjectText("selectAll") + "</button>"
            });
        }
        //#endregion


        manageuserrightsintoolbar(element, data);
        //Export to file. This is based on the From table method or to the export property (stored procedure) of the customJsonParam in the grid datasource (it calls the generic DB controller). The FromClass method or a dedicated controller must be custom developed
        var gridRights = getGridRights(gridcode);
        if (data.FromTable != null && data.FromTable != "" && gridRights.usercanexport) {
            window.HashOfExportableGrids[data.MagicGridName] = { entity: data.FromTable, layer: layerid, jsonparam: data.CustomJSONParam };
            if (data.Exportable) {
                element.toolbar.push({ template: getGridExportTemplate() });
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
                if(typeof editFunction == "function")
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

                var recordId = e.model[e.sender.dataSource.options.schema.model.id],
                    kendoWindow = e.container.data('kendoWindow'),
                    $element = $('<div ng-controller="GridWizardController as gw"><magic-wizard ng-if="gw.models" wizard-code="{{gw.wizardCode}}" options="gw.wizardOptions" models="gw.models" steps-settings="gw.stepsSettings"></magic-wizard></div>');

                initAngularController($element[0], 'GridWizard', {
                    wizardCode: gridExtension.magicWizardCode,
                    recordId: recordId,
                    onError: function () {
                        kendoWindow.close();
                    },
                    wizardOptions: {
                        hideClearButton: true,
                        onWizardRendered: function () {
                            kendoWindow.center();
                        },
                        onWizardComplete: function () {
                            e.sender.dataSource.read();
                        },
                        beforeSave: wizardClearHiddenFields
                    }
                }, null, false, 'Magic_GridWizardController');

                e.container.html($element)
                    .closest('.k-widget')
                    .removeClass('k-widget')
                    .find('.k-header')
                    .css('box-sizing', 'content-box');
                kendoWindow.maximize();
            }
        }

        var usersGridSettings = getSessionStorageGridSettings(gridcode, functionid);
        if (usersGridSettings.columnSettings) {
            for (var i = 0; i < element.columns.length; i++) {
                if (element.columns[i].field && (element.columns[i].field in usersGridSettings.columnSettings)) {
                    //Bug #3914  D.T: if a column has been overridden by the user in a visibile state (hidden undefined or false) be sure to overwrite it against the general configuration
                    if (usersGridSettings.columnSettings[element.columns[i].field] && !usersGridSettings.columnSettings[element.columns[i].field].hidden)
                        usersGridSettings.columnSettings[element.columns[i].field].hidden = false;
                    element.columns[i] = $.extend(element.columns[i], usersGridSettings.columnSettings[element.columns[i].field])
                    element.columns[i].locked = data.DetailTemplate ? false : element.columns[i].locked;
                }
            }
        }

        $.each(element.columns, function (i, col) {
            if (col.field) {
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
                            return '<div class="magicGridTd" onclick="initGridCellTooltip(this)">' + func(data) + '</div>'
                        }
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
            var grid = e.sender.element;
			element.gridElement = grid;
            var gridName = $(grid).attr('gridname');
           //D.T: look up for  grid settings currently set
             updateUserFilterLabel(grid);
      

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
                                innerval[col]= 0; //fa si che nell' edit incell le FK null vengano viste correttamente anche quando sono null nel DB
                                innerval.dirty = false;
                            }
                        })
                    }
                    setfromdatabound = false; // il prossimo databound viene considerato
                });
            }

            //Gestisco caso aspx o standardpage
            var funcname = sessionStorage.getItem("fname");

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

            if (this.options.xmlFilters) {
                var hasXmlFilter = filterTypeExists(this.dataSource._filter, ["xmlFilter", "searchBar"]),
                    $th = $("thead th.xmlFilterColumn", this.element);
                if (this.options.columnMenu) {
                    $th.find('.k-filter').remove();
                    if (hasXmlFilter)
                        $th.find('.k-link').append('<span class="k-icon k-filter"></span>');
                } else {
                    if (hasXmlFilter)
                        $th.find('.k-grid-filter').addClass("k-state-active");
                    else
                        $th.find('.k-grid-filter').removeClass("k-state-active");
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
                        $('.k-grid-header colgroup col', this.element).eq(i).width(this.columns[i].width);
                        $('.k-grid-content-locked colgroup col, .k-grid-content colgroup col', this.element).eq(i).width(this.columns[i].width);
                    }
                }
            }

            if (saveGridSettings)
                setSessionStorageGridSettings(this);

            //Selects all edit buttons
            if (grid.data("kendoGrid") != undefined) {
                grid.find("tbody tr .k-grid-edit").each(function () {
                    var currentDataItem = grid.data("kendoGrid").dataItem($(this).closest("tr"));

                    //Check in the current dataItem if the row is editable
                    if (currentDataItem != null && typeof currentDataItem.Editable != "undefined")
                        if (currentDataItem.Editable == false) {
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

            if (gridExtension.aggregateFunctionsForColumnsFooterTemplate) {
                element.dataSource.filter = e.sender.dataSource.filter() ? e.sender.dataSource.filter() : element.dataSource.filter;
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
                                $span.closest("td").html(
                                    kendo.template(
                                        gridExtension.aggregateFunctionsForColumnsFooterTemplate.initialTemplate[$span.data("template-pos")][$span.data("column")]
                                    )(values)
                                );
                            });
                    }
                });
            }
        }


        if (typeof prerenderdispatcher == 'function')
            prerenderdispatcher(element, functioname, e === undefined ? null : e, tabclass === undefined ? null : tabclass, result);

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
                                parentRowIndex = $parentGridRow[0].rowIndex,
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
                            $parentGridRow = $(">.k-grid-content>table>tbody>tr", $parentGrid).eq(parentRowIndex);
                            $parentGridRow.find(".k-hierarchy-cell .k-plus").click();
                            var tabStrip = $parentGridRow.next().find(".k-tabstrip").data("kendoTabStrip");
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

        console.log("MagicUtils.js::fillgridelementWithDBdata::ends for grid " + gridcode + " " + new Date().toLocaleString());
    });
}

function selectAllGridRows(el) {
    $(el).closest('[data-role=grid]').data("kendoGrid").select("tr");
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
        url: "/api/Magic_Templates/GetTemplateByName",
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
        $grid.data("xmlFieldTranslations", $.extend(labels,getUserFieldsLabels(gridOptions)));
        $searchWindow.html("<div ng-include=\"'" + window.includesVersion + "/Magic/Views/Templates/KendoGridXMLFilter.html'\"></div>");
        initAngularController($searchWindow[0], "KendoGridXMLFilterController", { searchValues: labels, kendoGrid: kendoGrid, filterIcon: $el.find("a").eq(0), filterDetails: xmlFilters });
    });
}
function getUserFieldsLabels(gridOptions)
{
    var labels = {} ;
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
    var settingsObject = getGridSettingsObject(grid.options.gridcode, grid.options.functionid);
    delete settingsObject.selectedGridsSettings[settingsObject.gridKey][type];
    setGridSettingsFromObject(settingsObject);
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

    //combine grid settings
    if (userFilter && !$.isEmptyObject(userFilter))
        settingsObject.selectedGridsSettings[settingsObject.gridKey].filter = userFilter;
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
    var settingsObject = getGridSettingsObject(gridcode, funcId == -1 ? ((sessionStorage.fid && gridcode != "Magic_Grid") ? sessionStorage.fid : -1) : funcId);

    return $.extend({
        filter: null,
        columnSettings: {},
        columnOrder: {},
        group: [],
        sort: [],
    }, settingsObject.selectedGridsSettings[settingsObject.gridKey]);
}

function saveUserGridSettings(el) {
    var grid = $(el).closest('[data-role=grid]').data('kendoGrid'),
        settingsObject = setSessionStorageGridSettings(grid, [undefined, "xmlFilter", "multiValueFilter"], true),
        selectedGridSettings = settingsObject.selectedGridsSettings[settingsObject.gridKey];

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
                    settingsObject.usersGridsSettings[settingsObject.gridKey][k] = settingsObject.selectedGridsSettings[settingsObject.gridKey];
                    settingExists = true;
                } else if ($isDefault[0].checked && v.isDefaultSetting) {
                    //if is set as default setting, reset isDefaultSetting in the other settings
                    settingsObject.usersGridsSettings[settingsObject.gridKey][k].isDefaultSetting = false;
                }
            });

            if (!settingExists)
                (settingsObject.usersGridsSettings[settingsObject.gridKey] || []).push($.extend({}, settingsObject.selectedGridsSettings[settingsObject.gridKey]));

            sessionStorage.usersGridsSettings = JSON.stringify(settingsObject.usersGridsSettings);

            //save in mongo
            $.post("/api/Config/PostUserGridConfig", "=" + JSON.stringify({
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
        gridSettingsOptions = $.map(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (v, k) { return '<option value="' + k + '"' + (v.settingsName == settingsObject.selectedGridsSettings[settingsObject.gridKey].settingsName ? ' selected' : '') + '>' + (v.settingsName || 'no name') + '</option>' }),
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
        gridSettingsOptions = $.map(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (v, k) { return '<option value="' + k + '">' + (v.settingsName || 'no name') + '</option>' }),
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
            type: settingsObject.usersGridsSettings[settingsObject.gridKey].length ? "POST" : "DELETE",
            url: settingsObject.usersGridsSettings[settingsObject.gridKey].length ? "/api/Config/PostUserGridConfig" : "/api/Config/DeleteUserGridConfig/" + settingsObject.gridKey,
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
    function triggerDataBound(grid)
    {
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
                if (gridRights.usercanupdate)
                    toolbarrev.push(element.toolbar[k]);
            }
            else
                if ((gridRights.usercanexecute && element.toolbar[k].name !== "create" && element.toolbar[k].name !== "save") || (element.toolbar[k].template == standardGridfastsearch)) //non escludo mai la ricerca veloce anche se i diritti non sono dichiarati
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
        var classbase = function (classConfig) { return "k-button k-button-icontext{0} k-grid-".format(classConfig ? " "+classConfig : ""); };

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
                rowbuttonattributes[classbase(v.classname)  +  v.domid] = { jsonpayload: v.jsonpayload, storedprocedure: v.storedprocedure, storedproceduredataformat: v.storedproceduredataformat };
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
    //management of the item "summary" the default is a read-only version of the popup.
    if (gridExtension.per_record_summary_sp || (element.editable && element.editable.mode == "popup")) {
        var cmnd = {
            type: "dataReader",
            text: '<i class="fa fa-television"></i>',
            name: element.gridcode + "_view",
            click: function (e) {
                var tr = $(e.target).closest("tr");
                var $grid = $(e.target).closest(".k-grid");
                var rowData = this.dataItem(tr);
                if (typeof showItemCustomForm == "function" && gridExtension.per_record_summary_sp)//showItemCustomForm To be defined in AdminAreaCustomizations
                    showItemCustomForm(rowData, element.gridcode, gridExtension.per_record_summary_sp,null,$grid,tr); 
                else
                    showRowContentInModal(rowData, element.gridcode, data.EditFormColumnNum, { storedProcedureName: gridExtension.per_record_summary_sp }, gridExtension.per_record_summary_sp ? "Magic_TabContent" : null);
            }
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
        }
        else {
            var add = true;
            if (!gridExtension.per_record_summary_sp) {
                $.each(commandsrev, function (k, v) {
                    if (v.name == "edit")
                        add = false;
                });
            }
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
    if (window.prefKendoStyle)
    {
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
    initAngularController(element, controllerName ? controllerName.replace(/^Magic_/, "") + "Controller" : "RowReaderController", settings, null, null, controllerName? controllerName + "Controller" : null);
}
//TODO da rimuovere questa logica sanando tutti i DS in giro per i vari DB!!! (togliere il ds finale quando il nome della tabella non finisce con ds e correggere la stored che crea le griglie omettendo l' aggiunta del ds finale) 
function normalizeDataSource(dataSource)
{
    if (dataSource)
        return dataSource.replace(/ds$/, '');

    return null;
}
//element e' l' oggetto griglia
// se la griglia e' in cell gestisce anche il bind a fk.
function managegridfk(element, data, $parentGridRow) {
    var foreignValues = {};
    $.each(element.dataSource.schema.model.fields, function (k, field) {
        if (field.dataSourceInfo && field.dataSourceInfo.dataSource && getcolumnindex(element.columns, k) != null) {
            var colIndex = getcolumnindex(element.columns, k),
                dsname = normalizeDataSource(field.dataSourceInfo.dataSource),
                ar = [],
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
                    else if (field.dataRole.match(/multiselect/))
                    {
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
    $.each(fieldmapped,function (j,v) {
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
        if (!datafound && !acds.length && ac && $acdom.data("externally_setid"))
        {
                ds[dsindex][fieldname] = $acdom.data("externally_setid");
                ds[dsindex].dirty = true;
        }
        //we have a value which has been typed from the user, we give it to the Database in a new "virtual field" called fieldname + "__inputvalue"
        if (!$acdom.data("externally_setid"))
        {
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

function bindAutocompleteToGridDataSource(readobj , researchfield, textfield, schema, typeofdatasource, rowdata) {
    schema = !schema  ? 'dbo' : schema;
    typeofdatasource = solvetypeofdatasource(typeofdatasource);
    //typeofdatasource :  1= stored , 2= table , 3 = controller
    if (researchfield === "undefined" || !researchfield)
        researchfield = "ID";
    var ds = {    // caso controller 
        transport: {
            read: {
                url: "/api/" + readobj + "/Select",
                type: "POST",
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
    if (typeofdatasource === 2 || typeofdatasource === 1) //faccio il doppio controllo per funzionare sia con '1' che con 1
        //Table read or stored procedure launched by GenericSqlCommand Controller
    {
        ds.transport.read = {
            url: "/api/GenericSQLCommand/Select",
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
                options.Model = null;
                options.data = JSON.stringify(rowdata); 
                options.Columns = [researchfield, textfield];
                options.DataSourceCustomParam = '{ read: { type: "StoredProcedure", Definition:"' + storedprocedure + '"} }';
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
function bindAutocompleteCurrentValue(dsInfo, $element,valuetoresearch) {

    var typeofdatasource = dsInfo.dsTypeId ? dsInfo.dsTypeId : 2;
    var researchgrid = (typeofdatasource != 3) ? (dsInfo.dsSchema ? dsInfo.dsSchema : "dbo") + "." + dsInfo.dataSource :  dsInfo.dataSource  ;
    var researchgridKey =   dsInfo.dsValueField; 
    var textfield = dsInfo.dsTextField;
    

    if (!researchgridKey)
        researchgridKey = "ID";

    if (valuetoresearch || valuetoresearch == 0) {
        if (typeofdatasource === 3) //controller
        {
            var ds = getdatasource(researchgrid, researchgridKey, "Get/" + valuetoresearch);
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
                url: "/api/GENERICSQLCOMMAND/GetWithFilter",
                data: JSON.stringify({ table: researchgrid, order: "1", where: researchgridKey + "='" + valuetoresearch + "'", storedprocedure: storedprocedure }),
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
function inspectTabsToRemove(tabstriptoinspect,model,restrictedtabs) { //<-- closure function with additional par
    var tabstriptoinspectref = tabstriptoinspect; // <-- storing the variable here

    return function (index, value) { // This function gets called by the jQuery 
        var tabcontent = $(value).data("contentObject");
        var isvisible = tabcontent && tabcontent.contentType == "GRID" ? checkGridVisibility(tabcontent.objectName) : true;
        // .each() function and can still access storedVariable
        var tabstripstored = tabstriptoinspectref; // <-- referencing it here
        var contentElementRow = $(tabstripstored.contentElement(index)).find('.row');
        //remove tab if it's empty or it does not own the proper layer or its content is "restricted" via DB 
        if ((contentElementRow.length && !contentElementRow.children().length) || tabHasToBeRemoved(model, value) || (tabcontent && tabContentOrTabHasToBeRemoved(tabcontent.objectName, isvisible, restrictedtabs, value)))
            tabstripstored.disable(value);
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
    };

    var dialog = e.container.closest(".k-window-content").data("kendoWindow");
    dialog.bind("close", manager);

}
//valuefield e textfield sono i valori da selezionare sull'  entita' esterna
//tablename e' la tabella/vista che interrogo
function returnInCelldropdatasource(tablename, valuefield, textfield, typeofdatasource, dstargetdomid, schema, field) {

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
        if (v.dataRole && v.dataRole.indexOf("searchgrid")!=-1 && v.editable == false) {
            container.find("input[name=" + key + "]").attr("disabled", "disabled");
            var span = container.find("input[name=" + key + "]").parents("span");
            span.find("a").hide();
        }
        if (v.dataRole == "textarea" && v.editable == false)
            container.find("textarea[name=" + key + "]").attr("disabled", "disabled");
    });
}
function getKendoComponents()
{
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
    var $element = $(e.container[0]).find(detaildomid ? "#" + detaildomid : "[name=" + columnname + "]"),
        dataRole = $element.attr("data-role"),
        kendoComponents = getKendoComponents();
    if (defvalue != undefined && defvalue != null) {
        if (defvalue.indexOf("{") != -1)
            defvalue = JSON.parse(defvalue);
        if (dataRole && (dataRole in kendoComponents)) {
            var kobject = $element.data(kendoComponents[dataRole]);
            kobject.value(defvalue.text ? defvalue.text : defvalue);
            if (dataRole == "autocomplete") {
                $element.data("externally_setid", defvalue.value ? defvalue.value : defvalue);
                kobject.trigger("change");
                kobject.one("change", function () {
                    $element.data("externally_setid", ""); //when the user modifies the value delete the external id
                })
            }
            else 
                kobject.trigger("change");
        }
        else {
                $element.val(defvalue.text ? defvalue.text : defvalue);
                //make sure that the model changes
                e.model.set(columnname, defvalue.value ? defvalue.value : defvalue);
        }
        //Bug #3830 - close the previously created validation tooltip if a value has been set
        try {
            $element.closest("div.k-edit-field").find('span.k-tooltip-button').find('a.k-icon.k-i-close').trigger('click');
        }
        catch (ex)
        {
            console.log(ex);
        }
    }


    if (dataRole && (dataRole in kendoComponents)) {
        $element.data(kendoComponents[dataRole]).enable(editable);
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
        var defer = new $.Deferred(),htmlToAdd = "";
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
                        var ktabstrip = e.container.find(".k-tabstrip").data("kendoTabStrip")
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
        $(oArray.fields).each(function (index,field) {
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
                            e.container.find("#riga-" + iIndice).append(obj.closest("div").parent());
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

                var sDivClassCollapse = "panel-collapse in"

                sCulture = kendo.culture()["name"].replace('-', '_');
                sTitle = oArray["labels"][sCulture];


                if (oArray.collapsed != undefined && oArray.collapsed) {
                    sDivClassCollapse = "panel-collapse collapse"
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
    function groupFieldsInTabs(e)
    {
        if (e.container.find("[class='panel-group_r3']").length > 0)
            e.container.find("[class='panel-group_r3']").parent().children().remove();
        if (e.popupfieldgroups)
            $(e.popupfieldgroups).each(function (i,v) {
                addgroupsToPopup(i, v, e);
            });


    }
    function getDataLayerId(e, insert, insertLayerid)
    {
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
    function overrideXmlFieldsInPopUp(e, listOfXMLFieldsInPopUp)
    {
        $.each(e.xmlFieldsToAlter, function (key, value) {
            if (listOfXMLFieldsInPopUp && listOfXMLFieldsInPopUp[key])
                detectWidgetTypeAndOverrideBehaviour(key, value.required, value.editable, value.defvalue, e.hide, null, e,value.label);
        });
    }
    var insert = false;

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
                    $input.attr('autocompletefilteroperator', v.autocompleteFilterOperator)
        });
    }

    //in cell edit, non faccio niente in questo metodo che e' dedicato al popup
    if (e.sender.options.editable.mode != "popup") {
        if (e.model.Editable === false)
            e.container.closest("[data-role=grid]").data("kendoGrid").closeCell();
        return;
    }
    var selectDataBounds = new $.Deferred();
    addUserFieldsToTemplate(e).done(function (listOfXMLFieldsInPopUp) {
        if (e.xmlFieldsToAlter)
            overrideXmlFieldsInPopUp(e, listOfXMLFieldsInPopUp)
        var modelcurrentlyinedit = e.model;
        e.model.listOfXMLFieldsInPopUp = listOfXMLFieldsInPopUp;
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
                options.files = e.model[name].match(/^\[{/) ? JSON.parse(e.model[name]) : [{ name: e.model[name] }];

            initKendoUploadField($this, options, e.sender.element, e.model.uid);
        });

        //gestione currentgrid
        appendCurrentGridManagementOnPopUpClosure(e);

        $(".k-grid-cancel").remove(); //toglie l' undo dal form. L' annulla e' rappresentato dalla X
        if (!e.model.id) { //inserimento
            e.container.closest(".k-window").find(".k-window-title").text(getObjectText("create"));
            insert = true;
            e.container.data("isNew", true);
            removeDetailGridsOnInsert(e); //removes the detailGrids (grids inside tabs) if i'm in a popup opened from another popup in order to prevent infinite nesting of savings       
        }
        else //update
            e.container.closest(".k-window").find(".k-window-title").text(getObjectText("edit"));

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
                    selectDataBounds.resolve( populateDataSources(e, gridname ? gridname : "grid"));
                });
            }
            if (e.container.data("kendoWindow") !== undefined)
                e.container.data("kendoWindow").center();
            //group fields inside popup based on popupfieldgroups array (Advanced grid properties) 
            groupFieldsInTabs(e);
        } 
        catch (ex) {
            console.log(ex);
        }
    });
    return selectDataBounds;
}
//This works on slave elements which are not kendoDropDownList
function clearCascadingFieldsFrom(columnName, container) {

    function reinitMultiSelect($ele,columnName, $container)
    {
        var deferred = $.Deferred();
        var filterfield = $ele.data("cascade-from-field");
        setTimeout(function () {
            var model = getModelAndContainerFromKendoPopUp($ele, $container.data("gridDS").options.schema.model.id).model;
            var dsInfo = $container.data("gridDS").options.schema.model.fields[$ele.attr("name")].dataSourceInfo;
            getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $ele.attr("id"), model[$ele.attr("name")], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, model, false, columnName, filterfield, true, $container);
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
           reinitMultiSelect($ele,columnName, $container).then(function () { $ele.trigger("cascade"); });
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
                        if (type == "dropdownlist" || type=="multiselect")
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
                    if (datasource &&   $element.length)
                        getsearchgridvalueinpopup(datasource, text, undefined, $element[0].id, rowModel[k], value, schema, typeofdatasource, null, e.container);
                    (function ($element) {
                        $element.on("cascade", function () {
                            clearCascadingFieldsFrom(k, e.container);
                        });
                    })($element);
                } else if (type.indexOf("autocomplete") !== -1) {
                    if (datasource && $element.length) {
                        //associa un datasource all
                        var ds = bindAutocompleteToGridDataSource(datasource, value, text, schema, typeofdatasource,e.model);
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
function doremoveFields(result, tabjqcontainer, currentlayerid,model,restrictedtabs) {
    var htmlcontrolswithlayer = $(tabjqcontainer.find("[magicbolayer_id]"));
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
        $.each(tabstriptoinspect.items(), inspectTabsToRemove(tabstriptoinspect, model, restrictedtabs));
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
        tabFilterReady = window.getStandard_GetTabRestrictions(e);
    }
    else
        tabFilterReady.resolve([]);
    //rimuovo
    $.when(defer, tabFilterReady).then(function (result, tabFilter) {
        var restrictedtabs = [];
        if (tabFilter.items) {
            restrictedtabs = $.map(tabFilter.items, function (v, i) {
                return v.gridname;
            });
        };
        doremoveFields(result, tabjqcontainer, currentlayerid, model, restrictedtabs);
        removalpromise.resolve();
    });
    return removalpromise.promise();    
}
//#region toremove
function manageDetailGridCounters() {
    for (var i = 0; i < $("input[id$='binder']").length ; i++) {
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
            return { usercanexport: true, usercanexecute: true, usercandelete: true, usercanupdate: true };
        var gridrights = JSON.parse(sessionStorage.VisibleGridAndRights);
        for (var i = 0; i < gridrights.length; i++)
            if (gridrights[i].GridGUID === gridId)
                return { usercanexport: gridrights[i].export, usercanexecute: gridrights[i].exec, usercandelete: gridrights[i].delete, usercanupdate: gridrights[i].update };
        return { usercanexport: false, usercanexecute: false, usercandelete: false, usercanupdate: false };
    }
    else if (profilationtype === "MENU") {
        var gridexcptnrights = JSON.parse(sessionStorage.GridRightsExceptions);
        for (var i = 0; i < gridexcptnrights.length; i++)
            if (gridexcptnrights[i].GridGUID === gridId)
                return { usercanexport: gridexcptnrights[i].export, usercanexecute: gridexcptnrights[i].exec, usercandelete: gridexcptnrights[i].delete, usercanupdate: gridexcptnrights[i].update };
        return { usercanexport: window.usercanexport, usercanexecute: window.usercanexecute, usercandelete: window.usercandelete, usercanupdate: window.usercanupdate };
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
function tabHasToBeRemoved(rowdata, item)
{
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
function tabIsRestricted(restrictedtabs, objectName)
{
    if (restrictedtabs && restrictedtabs.indexOf(objectName) != -1)
        return true;
    return false;
}
function tabContentOrTabHasToBeRemoved(contentObject,isvisible,restrictedtabs,item)
{
    var $item = $(item);
    if ($item.attr("toberemoved")) return true;
    if (!isvisible || (restrictedtabs && restrictedtabs.indexOf(contentObject.objectName) != -1)) {
        $item.attr("toberemoved", true);
        return true;
    }
    return false;
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
        if (tabFilter.items) {
            restrictedtabs = $.map(tabFilter.items, function (v, i) {
                return v.gridname;
            });
        }
        // render dei form template 
        tabStrip.deactivateTab(tabStrip.items());
        $.each(tabStrip.items(), function (i, item) {
            var contentObject = $(item).data("contentObject");
            if (!tabHasToBeRemoved(e.data, item) && contentObject) {
                if (!the1stTab && !$(item).attr("data-tab-id") && !(tabIsRestricted(restrictedtabs, contentObject.objectName)))
                {
                    the1stTab = true;
                    $(item).attr("tobeactivated", true);
                }
                if (contentObject.contentType == "ANGULARCONTROLLER") {
                    if (contentObject.templateToAppendName && contentObject.templateToAppendName[0] == "{") {
                        var $tabContent = $(tabStrip.contentElement(i));
                        if (!$tabContent.find("div[ng-controller]").length) {
                            var controllerData = JSON.parse(contentObject.templateToAppendName);
                            controllerData = $.extend({
                                tabHeaderElement: item,
                                tabContentElement: tabStrip.contentElement(i),
                                itemsPerRow: itemsPerRow ? parseInt(itemsPerRow) : 1,
                                data: e.data
                            }, controllerData);
                            $tabContent.html(getAngularControllerElement(controllerData.angularControllerName, controllerData));
                        }
                    }
                }
                else if (contentObject.contentType && contentObject.contentType.indexOf("GRID") != -1) { //griglia standard su tab di navigazione
                    addGridInfo({ MagicGridName: contentObject.objectName, GUID: contentObject.gridGUID });
                    var isvisible = checkGridVisibility(contentObject.objectName);
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
            url: "/api/Magic_Templates/GetTemplateByID/",
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
function getsearchgridvalueinpopup(controllername, orderbyfield, controllerfunction, dstargetdomid, initialvalue, valuefield, schema, typeofdatasource, callback, container) {
    var datapost = {};
    var serverfilter = false;
    typeofdatasource = solvetypeofdatasource(typeofdatasource);

    if (initialvalue) {
        //limito la chiamata all' id corrente
        var filter = { logic: "AND", filters: [{ field: valuefield, operator: "eq", value: initialvalue }] };
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
        sort: { field: orderbyfield, dir: "asc" },
        change: function (data) {
            if (data.items.length > 0 && initialvalue !== null)
                $.each(data.items, function (index, val) {
                    if (val.value === initialvalue.toString()) {
                        if (dstargetdomid)
                            $("#" + dstargetdomid, container)
                                .val(val.text)
                                .trigger("searchGridChange", [val.value])
                                .parent().addClass("has-value");
                        if (callback)
                            callback(val.text);
                    }
                })
        }
    });
    ds.read();
    return ds.view();
}
function buildsearchGridFilter(gridobj, cascadeFromColumn, cascadeFilterColumn, operator, model) {

    var maingridmodel = model || getCurrentModelInEdit();
    var value = maingridmodel.get(cascadeFromColumn);
    if (value === null || value === '')
        return;

    if (gridobj.dataSource.filter == null)
        gridobj.dataSource.filter = { field: cascadeFilterColumn, operator: operator, value: value, type: "cascadeSearch" };
    else
        gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, { field: cascadeFilterColumn, operator: operator, value: value, type: "cascadeSearch" });

}
function selectItemFromResearchgrid(searchgridname, editfield, textfield, cascadeFromColumn, cascadeFilterColumn, operator, pagesize, e, selectValue, isInline) {
    var $e = $(e);

    //give parent class k-state-disabled to disable input
    if (!selectValue && !isInline && e !== undefined && $e.parent().hasClass('k-state-disabled'))
        return false;

    var $windowCloseButton = $e.closest(".k-window").find(".k-window-actions");
    var $titlebar = $windowCloseButton.parent();
    if (!selectValue && !isInline) {
        $windowCloseButton.hide().addClass("hidden-actions-by-searchgrid");
        $titlebar.append($('<div id="close-researchgrid" class="k-window-actions"><a href="#" class="k-window-action k-link"><span style="background-position: -32px -16px" class="k-icon">Close</span></a></div>').click(function (e) {
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
    var origparmap = gridobj.dataSource.transport.parameterMap;
    gridobj.dataSource.transport.parameterMap = function (options, operation) {
        var opts = origparmap.call(this, options, operation);
        var optsobj = JSON.parse(opts);
        optsobj.data = JSON.stringify(getCurrentModelInEdit());
        return kendo.stringify(optsobj);
    }
    //prendo il numero di colonne del Form che ha lanciato la search
    //var buttonclass = "backsearchgrid";

    gridobj.groupable = false;
    gridobj.dataSource.pageSize = pagesize || 5;
    gridobj.selectable = false;
    //gridobj.pageable = {
    //    buttonCount: gridobj.dataSource.pageSize
    //};
    gridobj.pageable = getDefaultGridSettings().pageable;
    //tolgo gli action button e aggiungo l' attributo css "modifications" ai bottoni di edit in modo da poter capire se l' utente ha selezionato la row o 
    //schiacciato un bottone
    for (var i = 0 ; i < gridobj.columns.length; i++) {
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
    gridobj.columns.unshift({ template: "<input style='width:50px;' type='checkbox' class='checkbox searchgrid' onclick='onSearchGridCheckRow(this);'/>", width: "64px", locked: gridobj.columns[0].locked || false });
    //tolgo la navigabilita'gridobj.columns[i].
    gridobj.detailTemplate = null;
    gridobj.detailTemplateName = null;
    gridobj.detailInit = null;
    //Aggiunge una condizione alla select della griglia sulla base del valore di un altro campo.
    if (iscascadesearch(cascadeFromColumn, cascadeFilterColumn, operator))
        buildsearchGridFilter(gridobj, cascadeFromColumn, cascadeFilterColumn, operator, isInline ? $e.siblings("input").data("columnData").model : null);
    else
        console.log("WARN: cascade data in search grid are incomplete: cascadeFromColumn = " + cascadeFromColumn + ' cascadeFilterColumn = ' + cascadeFilterColumn + ' operator = ' + operator);

    if (selectValue) {
        if (gridobj.dataSource.schema.model.id)
            gridobj.dataSource.filter = combineDataSourceFilters(gridobj.dataSource.filter, { field: gridobj.dataSource.schema.model.id, operator: 'eq', value: selectValue });
        else
            console.log("WARN: PK not set in searchgrid with selectValue");
    }
    else if(!isInline) {
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
    gridref.kendoGrid(gridobj);
    if (isInline)
        gridref.data("kendoWindow").center().open();

    if (!selectValue && !isInline) {
        gridref.data("kendoGrid").one("dataBound", function (e) {
            $e.closest(".k-window-content").data("kendoWindow").center();
        });
    }

    checkAndInitializeFastSearch(gridref);
    gridref.attr("referencefield", editfield);
    gridref.attr("referenceTextfield", textfield);
    gridref.attr("editablecolumnnumber", gridobj.editablecolumnnumber);
    gridref.attr("editableName", gridobj.editableName);
    gridref.attr("gridName", searchgridname);
}

//evento di selezione della riga della search grid
function onSearchGridCheckRow(arg) {
    var incelledit = $(arg).closest(".searchgrid-window").length ? true : false; 
    //ottengo griglia e elemento selezionato andando a vedere gli elementi piu' vicini alla checkbox selezionata
    var gridref = $(arg).parents(".k-grid");
    var grid = gridref.data("kendoGrid");

    var kendoEditGrid = grid;
    if (incelledit)
        kendoEditGrid = gridref.data("parentGrid");
    var closebutton = gridref.find(".k-grid-toolbar")[0];
    var selected = grid.dataItem($(arg).closest("tr"));
    var id = selected.id;
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
        if (dsinedit[i].id == mainrecordid && (mainrecordUid == dsinedit[i].uid))
        {
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
            } else { //popup
                inputelement = $(arg).closest("#" + grid.options.gridcode + "_searchgrid").parent().find("#" + fieldinedit + "_binder");
                $(arg).closest("#" + grid.options.gridcode + "_searchgrid").parent().find("#" + fieldinedit + "_binder")
                    .val(selected[grid.wrapper[0].attributes.referenceTextfield.nodeValue])
                    .trigger('searchGridChange', [id, oldValue])
                    .parent().addClass("has-value");
                if (dsinedit[i].dirty)
                    resetCascadeSlaveValues(fieldinedit, dsinedit[i], $container.data('gridDS').options.schema.model, $container);
            }
            closesearchgrid(closebutton);
            
            if (typeof custommethod == 'function' && kendoEditGrid.element) 
                custommethod(kendoEditGrid, selected, dsinedit[i]);
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
function addResearchFiltersInGrid(clean, filterfields, val, jquerygrid,fieldvalues) {

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
                    if (v.value && v.text && v.text.toUpperCase().indexOf(val.toUpperCase())!=-1)
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

function initializeFastSearch(fields, domobjid, jquerygrid,fieldvalues) {
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
    appendGridInEditTemplateTab(e.item, e.contentElement);
}

function sanitizeJSON(string) {
    return string.replace(/{{/g, '{').replace(/}}/g, '}');
}

function appendGridInEditTemplateTab(tab, tabcontent) {
    var $e = $(tab);
    var $savebtn = $e.parents("div.k-edit-form-container").find("div.k-edit-buttons a.k-grid-update");
    var contentObject = $(tab).data("contentObject");
    if (contentObject && contentObject.contentType.indexOf("GRID") != -1) { //se il tab contiene una griglia
        $savebtn.hide();
        expandPopUpwindow($(tabcontent));
        var gridobj = getrootgrid(contentObject.objectName, undefined, undefined, undefined, undefined, undefined, contentObject.bindedGridFilter, undefined, contentObject.bindedGridHideFilterCol, undefined, undefined, undefined, contentObject.bindedGridRelType_ID);
        //application of filter
        filtersolver(contentObject.bindedGridFilter, gridobj, window.objectinedit, contentObject.bindedGridHideFilterCol, "editPopup");
        //remove navigation tabs
        gridobj.detailTemplate = null;
        gridobj.detailTemplateName = null;
        gridobj.detailInit = null;

        if (!$(tabcontent).children("[data-role=grid]").length) {
            var griddiv = $(tabcontent).children("." + (contentObject.groupClass || contentObject.objectName));
            griddiv.kendoGrid(gridobj);
            griddiv.data("kendoGrid").one("dataBound", function () {
                $(tabcontent).closest('.k-window-content').data("kendoWindow").center();
            });
            griddiv.attr("editablecolumnnumber", gridobj.editablecolumnnumber);
            griddiv.attr("editableName", gridobj.editableName);
            griddiv.attr("gridName", contentObject.objectName);
            checkAndInitializeFastSearch(griddiv);
            griddiv.fadeIn();
        }
    }
    else if (contentObject && contentObject.contentType == "ANGULARCONTROLLER") {
        if (contentObject.templateToAppendName && contentObject.templateToAppendName.TrimStart()[0] == "{") {
            var $tabContent = $(tabcontent);
            if (!$tabContent.find("div[ng-controller]").length) {
                var controllerData = JSON.parse(contentObject.templateToAppendName),
                    itemsPerRow = 1,
                    data = {};
                if (window.objectinedit){
                    if (window.objectinedit.sender.options.editable && window.objectinedit.sender.options.editable.window)
                        itemsPerRow = window.objectinedit.sender.options.editable.window.width / 400;
                    if(window.objectinedit.model)
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

function initKendoUploadField($input, options, $container, uid) {
    var inputData = $input.data(),
        path = managesavepath(inputData.savepath) || "",
        useController = false;

    if (!inputData.adminUpload) {
        useController = window.getMSSQLFileTable || window.FileUploadRootDir || !path.match(/^\//);
    } else if (!path) {
        useController = true; //is adminUpload and no savepath is set, use controller to get filedir from DB
    } else {
        path = ""; //is adminUpload and savepath is set, so clear savepath -> saved in filename
    }

    var data = $.extend({
        async: {
            saveUrl: "/api/MAGIC_SAVEFILE/SaveApplication",
            removeUrl: "/api/MAGIC_SAVEFILE/RemoveApplication",
            removeVerb: "DELETE"
        },
        select: onUploadSelect,
        template: function (e) {
            return uploadTemplate(e, path, useController, inputData.adminUpload, true,$container ?  $container.attr('gridname') : null, $input.attr('name'));
        },
        upload: onUpload,
        success: function (e) { uploadSuccess(e, $container, uid, inputData.adminUpload) },
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

    //console.log(data);
    $input.kendoUpload(data);
}
//#region InCellEditor
function kendoUploadInCellEditor(container, options) {
    var $grid = container.closest('[data-role=grid]'),
        grid = $grid.data("kendoGrid"),
        uploadInfo = grid.dataSource.options.schema.model.fields[options.field].uploadInfo,
        $input = $('<input name="' + options.field + '" type="file" data-savepath="' + uploadInfo.savePath + '" data-admin-upload="' + uploadInfo.adminUpload + '" accept="' + uploadInfo.fileExtensions + '"' + (grid.dataSource.options.schema.model.fields[options.field].validation.required ? ' required="required"' : '') + ' />'),
        data = {
            files: options.model[options.field] ? (options.model[options.field].match(/^\[{/) ? JSON.parse(options.model[options.field]) : [{ name: options.model[options.field] }]) : [],
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
        GetDropdownValues(normalizeDataSource(dsInfo.dataSource), dsInfo.dsValueField, dsInfo.dsTextField, dsInfo.dsSchema, dsInfo.dsTypeId, filter, true,options.model)
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
        GetDropdownValues(normalizeDataSource(dsInfo.dataSource), dsInfo.dsValueField, dsInfo.dsTextField, dsInfo.dsSchema, dsInfo.dsTypeId, filter, true,options.model)
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
    function reloadDropDownAndMultiSelect(field, rowModel, model, $container)
    {
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
        dsIndo = model.fields[options.field].dataSourceInfo;

    getTemplate(window.includesVersion + "/Magic/Views/Templates/DataRoles/Incell/" + model.fields[options.field].dataRole + ".html")
        .then(function (res) {
            var value = "";
            $.each(options.values, function(k, v){
                if(v.value == options.model[options.field]) {
                    value = v.text;
                    return false;
                }
            });
            var data = [options.field, value, dsIndo.dsTextField, dsIndo.searchGridName, dsIndo.searchGridColumnDesc, dsIndo.cascadeColumn, dsIndo.cascadeFilterColumn, dsIndo.dsSchema && dsIndo.dsSchema != "string" ? "eq" : "contains", model.fields[options.field].validation.required ? 'required="required"' : '', dsIndo.dsValueField, ""];
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

function rebuildGenericModal()
{
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

}

function genericRowButtonFunction(e) {
    var storedprocedure = getRowStoredProcedure(e);
    var storedproceduredataformat = getRowStoreProcedureDataFormat(e);

    var jsonpayload = {};
    try {
        jsonpayload = getRowJSONPayload(e);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }
    var rowdata = getRowDataFromButton(e);
    //aggiunge ai dati di riga il payload impostato dall utente
    //D.t modified in order to prevent modifications of the grid's model  
    var mergeddata =  jQuery.extend({},rowdata,jsonpayload);
    //delete useless fields
    if ('defaults' in mergeddata)
        delete mergeddata.defaults;
    if ('fields' in mergeddata)
        delete mergeddata.fields;
    if ('_defaultId' in mergeddata)
        delete mergeddata._defaultId;

    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, sessionStorage.fid ? sessionStorage.fid : null, null, mergeddata, null);

    rebuildGenericModal();
    if (jsonpayload && (jsonpayload.form || jsonpayload.formMassiveUpdate == true)) {
        genericButtonForm({ e: e, datatopost: datatopost, jsonpayload: jsonpayload, targetgrid: $(e.currentTarget).closest(".k-grid").data("kendoGrid"), storedprocedure: storedprocedure });
    }
    else {
        $("#executesave").click(function () {
            var data = datatopost;
            $.ajax({
                type: "POST",
                url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
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
                    refreshGridAfterButtonPress(e);
                    $("#wndmodalContainer").modal('toggle');
                },
                error: function (message) {
                    kendoConsole.log(message.responseText, true);
                }
            });
        });
        $("#wndmodalContainer").modal('toggle');
    }
    
}

function genericButtonForm(buttondata)
{
    var e = buttondata.e;
    var datatopost = buttondata.datatopost;
    var jsonpayload = buttondata.jsonpayload;
    var targetgrid = buttondata.targetgrid;
    var storedprocedure = buttondata.storedprocedure;

        if (jsonpayload.formMassiveUpdate == true) {
            //if it's a massiveUpdate and the form/grid is not specified i get the container grid as a form base
            if (!jsonpayload.form)
                jsonpayload.form = targetgrid.wrapper.attr("gridname");
            //if a stored procedure is not specified i use the update default stored for the container grid
            if (!storedprocedure && targetgrid.dataSource.transport.options.CustomJSONParam)
                storedprocedure = JSON.parse(targetgrid.dataSource.transport.options.CustomJSONParam).update.Definition;
        }
    //check diritti utente
    isGridVisiblePromise(jsonpayload.form)
        .fail(function () {
            kendoConsole.log(getObjectText("missingrights"), true);
        })
        .then(function () {
        if (jsonpayload.formWide == true)
            $("#wndmodalContainer").addClass("modal-wide");
        var itemsPerRow = 2; //default
        var hideTabs = "false";
        if (jsonpayload.formItemsPerRow)
            itemsPerRow = jsonpayload.formItemsPerRow > 3 ? 3 : jsonpayload.formItemsPerRow;
        if (jsonpayload.formHideTabs)
            hideTabs = "true";
        requireConfigAndMore(["MagicSDK"], function (MF) {
            $("div.modal-footer").remove();
            var useLoadSP = jsonpayload.formLoadSp ? true : false;
            var directive = '<magic-form  model="c.formData" table-name="' + jsonpayload.form + '" options="{itemsPerRow: ' + itemsPerRow + ' , where: c.options.where ,hideTabs:'+ hideTabs +' }"></magic-form>';
            if (useLoadSP)
                directive = '<magic-form-sp  model="c.formData" storedprocedure="' + jsonpayload.formLoadSp + '" isreadonly=false formname="' + jsonpayload.form + '" hidetabs=' + hideTabs + ' itemsperrow=' + itemsPerRow + ' options="{where: c.options.where }"></magic-form-sp>';
            var $el = $("#contentofmodal").html('<div id="multiselectform-controller" ng-controller="MultiSelectFormController as c">\
                                                    <form name="form" ng-submit="c.callStoredProcedure(form)">{0}\
                                                        <div><button class="btn btn-primary">OK</button></div>\
                                                    </form>\
                                                </div>'.format(directive)).find("#multiselectform-controller")[0];
            var config = { MF: MF, e: e, data: datatopost, gridFields: targetgrid.dataSource.options.schema.model.fields };
            config.massiveUpdate_form_columns = [];
            config.formMassiveUpdate = jsonpayload.formMassiveUpdate;
            config.formPK = targetgrid.dataSource.options.schema.model.id;
            config.jsonpayload = jsonpayload;
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


function genericToolbarButtonFunction(e) {
    var getGridData = function (targetgrid, jsonpayload) {
        var datapayload = [];
        //if the grid is NOT selectable then i'm going to pick the all the rows. If the dirty flag is set to true i'm picking the modified ones only
        if (targetgrid.options && !targetgrid.options.selectable) {
            var datapayload = $.map(targetgrid.dataSource.data(), function (v, i) {
                if ((!jsonpayload) || (jsonpayload && jsonpayload.dirty && v.dirty) || (jsonpayload && !jsonpayload.dirty))
                    //D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
                    return jQuery.extend({},v,jsonpayload);
                else
                    return;
            })
        }
        else //selectable return selected rows
        {
            var selecteddata = targetgrid.select();
            if (selecteddata.length > 0) {
                for (var i = 0; i < selecteddata.length; i++) {
                    //D.t modified in order to prevent multiple extension of the grid model (e.g a first call with a certain payload goes in error, grid does not refresh, another call is made with a different payload
                    datapayload.push(jQuery.extend({}, targetgrid.dataItem(selecteddata[i]), jsonpayload));
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
    var storedprocedure = toolbarbuttonattributes[key].storedprocedure;
    var storedproceduredataformat = toolbarbuttonattributes[key].storedproceduredataformat;
    var targetgrid = getGridFromToolbarButton(e);
    var jsonpayload = {};
    try {
        jsonpayload = JSON.parse(toolbarbuttonattributes[key].jsonpayload);
    }
    catch (e) {
        console.log("jsonpayload is not a valid json:" + e.message);
    }
    //se la griglia e' selezionabile vado a prendermi tutte le righe selezionate se non e' selezionabile tutte le dirty rows 
    var datapayload = [];
    try {
        datapayload = getGridData(targetgrid,jsonpayload);
    }
    catch (err) {
        console.log(err);
    }
    if (jsonpayload && jsonpayload.selectionMandatory && !datapayload.length) {
        kendoConsole.log(getObjectText("selectatleastone"), true);
        return;
    }
    //crea lo stesso payload del caso batch dell' update 
    var datatopost = buildGenericPostInsertUpdateParameter("customaction", storedprocedure, null, storedprocedure, storedproceduredataformat, sessionStorage.fid ? sessionStorage.fid : null, null, { models: datapayload }, null);
    rebuildGenericModal();
    //if the form property is set a form is used via magicform directive 
    if (jsonpayload && (jsonpayload.form || jsonpayload.formMassiveUpdate == true)) {
        genericButtonForm({ e: e, datatopost: datatopost, jsonpayload: jsonpayload, targetgrid: targetgrid, storedprocedure: storedprocedure });
    } else {
        $("#executesave").click(function () {
            doModal(true);
            var data = JSON.parse(datatopost);
            $(data.models).each(function (k, v)
            {
                $.each(v, function (key, val) {
                    if (typeof val == "string" && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/))
                        v[key] = toTimeZoneLessString(new Date(val));
                });
            });
            $.ajax({
                type: "POST",
                url: "/api/GENERICSQLCOMMAND/ActionButtonSPCall/",
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
                    kendoConsole.log(msg, msgtype);
                    targetgrid.dataSource.read();
                    doModal(false);
                    $("#wndmodalContainer").modal('hide');
                },
                error: function (message) {
                    kendoConsole.log(message.responseText, true);
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
                    url: "/api/Visibility/getSessionUserVisibilityGroupBOType",
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

    if ($("#repocontainer").lenght !== 0)
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

function getrootfunction(func,dependencies) {

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
                            grid.data("kendoGrid").dataSource.read();
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
        if(column.field)
            grid.autoFitColumn(column);
    });
}

function filtersolver(filterfield, grid, e, hidefiltercolumn, type) {
    function getFilterValue(data,filter)
    {
        //the property exists but is = null
        if (filter.value in data && data[filter.value] == null)
            return null;
        //it does have a look up in data
        if (data && data[filter.value]!=undefined)
            return data[filter.value];
        //no look up, and it's a string (constant)
        if (filter.value && typeof filter.value.indexOf == "function")
            return filter.value.replace("@", '');
        //return the value given by the config
        return filter.value == undefined ? null : filter.value;
    }
    function setDefaultValAndHideColumns(grid, filter,e,logic)
    {
        if (!grid.dataSource.schema.model.fields[filter.field] || !filter.field )
        {
            console.log("Field: " + filter.field + " is not part of the grid model.Default value has not been set and column won't be hidden.");
            return;
        }
        if (filter.field != grid.dataSource.schema.model.id && logic.toUpperCase() == "AND") {
            grid.dataSource.schema.model.fields[filter.field].defaultValue = filter.value;
            if (e)
                grid.dataSource.schema.model.fields[filter.field].editable = false;
        }
        grid.dataSource.schema.model.fields[filter.field].filter = false; //disabilita filtro
        if (hidefiltercolumn == "True" || hidefiltercolumn == true) { //nascondo le colonne coi filtri se impostato da configurazione griglia
            if (getcolumnindex(grid.columns, filter.field) != null) {
                grid.columns[getcolumnindex(grid.columns, filter.field)].hidden = true;
            }
        }
    }
    function lookUpValues(filter, type, data, e, grid) {
        for (i = 0; i < filter.filters.length; i++) {
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
    else
    {  //nav filter with only field name in cfg
        filter.field = filterfield;
        if (!e || !e.data)
            valuetofilter = elementineditid;//global variable set in setEditContext function
        else
            valuetofilter = e.data.id;
        $.extend(filter,{ operator: "eq", value: valuetofilter, type: "navigationFilter"});
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
    filter = removeFiltersByType(filter, ["searchBar", "user", undefined]); //user filters
    grid.dataSource.filter(filter);
    $grid.find("#maingridsearchandfilter").val('');
    updateUserFilterLabel($grid);
}

function updateUserFilterLabel(grid) {
    try {
        var kgrid = grid.data('kendoGrid'),
            settingsObject = getGridSettingsObject(kgrid.options.gridcode, kgrid.options.functionid);
        $.each(settingsObject.usersGridsSettings[settingsObject.gridKey] || [], function (i, v) {
             //setting is on
            if (v.settingsName == settingsObject.selectedGridsSettings[settingsObject.gridKey].settingsName) {
                if (!grid.prev().hasClass('magic-actual-config'))
                    grid.before("<h4 class='magic-actual-config'><span class='label label-info' style='font-size: 0.7em'>" + v.settingsName + "</span></h4>");
                else
                    grid.prev().find('.label').html(v.settingsName);
                //break loop
                return false;
            }
        });
    }
    catch (exc) {
        console.log(exc);
    }
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
                var files = e[columnName].match(/^\[{/) ? JSON.parse(e[columnName]) : [{ name: e[columnName] }],
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
            var files = data[columnName].match(/^\[{/) ? JSON.parse(data[columnName]) : [{ name: data[columnName] }],
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
        var actobj = { id: v.id, actionfilter: v.actionfilter, actiondescription: v.actionDescription, actiontype: v.actiontype, boid: data.recordid, actioncommand: v.actioncommand, taskId: v.taskId, actioniconclass: v.actioniconclass, generateBO: v.GenerateBO, botype: v.botype, count: v.count, actionbackgroundcolor: v.actionbackgroundcolor , bodescription: data.description };
        if (classhash[v.Class] == undefined) {
            var typehash = { };
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

    var firstlevopen = ' <div class="panel panel-default">\
                                <div class="panel-heading">\
                                <h4 class="panel-title">\
                                  <a data-toggle="collapse" data-parent="#' + accordionid + '" href="#' + accordionid + '-collapse-{1}"><span class="glyphicon glyphicon-folder-close">\
                                    </span>{0}</a>\
                                </h4>\
                                </div>\
                                <div id="' + accordionid + '-collapse-{1}" class="panel-collapse collapse in">\
                                <ul class="list-group">';

    var firstlevclosure = '</ul></div></div>';
    var secondlevopen = '<li class="list-group-item"><span class="{2} text-info"></span><a href="javascript:void(0)">{0}</a> <ul class="list-group">'
    var secondlevclosure = '</ul></li>';
    var thirdlev = '<li {5} class="list-group-item"><span class="{2} text-primary"></span><a id="{4}" href="{1}" {3}>{0}</a></li>'

    for (var key in classhash) {
        if (classhash.hasOwnProperty(key)) {
            content += firstlevopen.format(key, m);
            m++;
            for (var innerkey in classhash[key]) {
                content += secondlevopen.format(innerkey, m, classhash[key][innerkey].icon ? classhash[key][innerkey].icon : "glyphicon glyphicon-file");
                m++;
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
        url: "/api/Magic_Templates/RefreshTemplateToDb/",
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
            if (input.data("role") == "upload" && input.attr("required") && input.data("kendoUpload").options.files.length)
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

    kendo.ui.plugin(kendo.ui.Grid.extend({
        _showMessage: function (messages, row) {
            //fix for message translation in all scenarios
            if (messages) {
                messages.cancelDelete = getObjectText("cancel");
                messages.confirmDelete = getObjectText("delete");
                messages.title = getObjectText("CONFIRMATION");
            }

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
                    if (!$(e.currentTarget).parent().hasClass("km-actionsheet-cancel"))
                        that._removeRow(row);
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
                //CHROME v 55.0.2883.87 FIX
                that.menu.bind("close", function (e) {
                    var menuitem = $('[role=menuitem]:hover');
                    if(menuitem.length && menuitem[0] == e.item)
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
            var that = this,
                expression = that.dataSource.filter() || { filters: [], logic: "and" };

            that.filterModel = kendo.observable({
                logic: "and",
                filters: [that._defaultFilter(), that._defaultFilter()]
            });

            if (that.form) {

                if (!that.table && that.type != "boolean") {
                    //change html (wrap fields in table) if is first call
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
            }

            if (that._bind(expression)) {
                that.link.addClass("k-state-active");
            } else {
                that.link.removeClass("k-state-active");
            }

            //if is first call add filter rows (if length > 2 -> 2 are standart)
            if (elements && that.filterModel.filters.length > 2) {
                for (var i = 2; i < that.filterModel.filters.length; i++)
                    that.addFilterField(elements, i)
            } else if (that.table && that.table.children().length > that.filterModel.filters.length) {
                var rows = that.table.children();

                //move add btn to last filter row
                rows.eq(that.filterModel.filters.length - 1)
                    .find('td:last-child')
                    .append(rows.last().find('.add'));

                //delete unnecessary lines
                that.table.children('.undefined').remove();
            }
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
            var filter;

            //set/unset fakevalue if operator isnull or isnotnull
            for (var i = 0; i < this.filterModel.filters.length; i++) {
                filter = this.filterModel.filters[i];
                if ((filter.operator == "isnull" || filter.operator == "isnotnull") && !filter.value)
                    this.filterModel.filters[i].value = " ";
                else if (filter.operator != "isnull" && filter.operator != "isnotnull" && filter.value == " ")
                    this.filterModel.filters[i].value = "";
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
})();


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
        require(['angular', isCustomController ? window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/Js/Controllers/" + (fileName || name) + ".js" : window.includesVersion + '/Magic/Views/Js/Controllers/' + (fileName || name) + ".js"],
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
    require([window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/config.js"], function () {
        fn();
    });
}

function apply_style(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    //force version management    
    ss.href = window.includesVersion + "/" + href;
    document.getElementsByTagName("head")[0].appendChild(ss);
}

function includejs(href) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    //force version management    
    script.src = window.includesVersion + "/" + href;
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
    newRow[model.id] = 0;
    $newRow = $grid.find('tr[data-uid="' + newRow.uid + '"]');

    if (editMode == 'popup') {
        grid.editRow($newRow);
    } else {
        $.each(grid.columns, function (k, v) {
            if (v.field && (v.field in data) && model.fields[v.field].editable)
                firstDataCell = k;
            return !firstDataCell;
        });

        if(firstDataCell)
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

        $.ajax({
            type: "POST",
            url: "/api/DocumentRepository/GetCount",
            data: JSON.stringify({
                bOId: rowdata[pk],
                bOType: botype
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                var counts = JSON.parse(res),
                    actions = [];
                actionsobj = {
                    M: { id: 2, Type: getObjectText("messages"), Typeid: 2, Classid: 1, Class: "Log", actionDescription: "Mail", actiontype: "mail", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-envelope", botype: botype, count: 0 },
                    DC: { id: 3, Type: getObjectText("messages"), Typeid: 2, Classid: 1, Class: "Log", actionDescription: "Chat", actiontype: "chat", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-comment", botype: botype, count: 0 },
                    ME: { id: 4, Type: getObjectText("messages"), Typeid: 2, Classid: 1, Class: "Log", actionDescription: "Memo/Note", actiontype: "memo", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-pencil", botype: botype, count: 0 }
                };
                for (var i = 0; i < counts.length; i++)
                    if (counts[i].Code in actionsobj)
                        actionsobj[counts[i].Code].count = counts[i].Count;
                actions = $.map(actionsobj, function (v) { return [v]; });
                if (typeof showEventGrid == "function") //To be defined in AdminAreaCustomizations.js for each solution
                    actions.unshift({ id: 1, Typeid: 1, Type: "Eventi",  Classid: 1, Class: "Log", actionDescription: "Log eventi", actiontype: "EVTGD", actiontypeid: 1, actioncommand: entityName, actioniconclass: "glyphicon glyphicon-list-alt", botype: botype });
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
            }
        });
    }

    return false;
}
function actionLinkBuilder(data) {
    return "javascript:showReader('" + data.actioncommand + "'," + data.boid + ",'" + data.actiontype + "','" + data.botype + "','" + data.bodescription + "')";
}
//#endregion

//#region actions and wkf
//action dispatch 
function dispatchAction(e,jsonpayload)
{
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
                                return "None";
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
function showReader(entityName, BOId, type, boType,boDescription) {
    if (!boType || boType == "undefined")
        boType = entityNameBoTypeMapping[entityName];
    var $container = cleanModal();
    $("#wndmodalContainer").addClass("modal-wide");
    $container.html(getDataReaderHtml(type == "SNAGD" ? true : null));
    var config = {};
    if (type === "SNAGD" || type == "EVTGD" || type == "FILTERCAL")
    {
        if (type === "EVTGD")
            showEventGrid(entityName, BOId, boType);
        else if (type=="SNAGD") {
            $("#wndmodalContainer").removeClass("modal-wide");
            $("#wndmodalContainer").addClass("modal-full");
            config = { gridname: entityName, Id: BOId };
            initAngularController($container.find('div'), "SnapShotsController", config);
            $(".modal-title").text('Snapshots');
            $("#wndmodalContainer").modal('show');
            return;
        }
        else if (type == "FILTERCAL")
        {
            window.open('/app?boId={0}&boType={1}&boDescription={2}&filterBO=true#/calendar'.format(BOId, boType, boDescription ? boDescription.replace('#','') : ""), '_blank');
            return;
        }
    }
    else
        var ajaxData = {
            table: "dbo.Magic_DocumentRepository",
            order: "InsertionDate DESC",
            where: "BusinessObjectType = '" + boType + "' AND BusinessObject_ID = '" + BOId + "' AND TransmissionMode = '" + type + "' AND (UserGroupVisibility_ID={ugvi} AND IsPublic=1 || CreatorUser_ID={idUser} AND IsPublic=0) AND DocumentType_ID is not null"
        };
        if (type === "chat") {
            config = {
                filterKeys: ["DocumentFile.current.From", "DocumentFile.UploadedFile", "Type"],
                dataList: function ($http, $q) {
                    var deferred = $q.defer();
                    $http.post("/api/DocumentRepository/GetWithFilter", ajaxData)
                    .then(function (res) {
                        if (res.data.Data && res.data.Data.length) {
                            $.each(res.data.Data[0].Table, function (k, v) {
                                if (res.data.Data[0].Table[k].DocumentFile.TrimStart()[0] == "{") {
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
                    $http.post("/api/DocumentRepository/GetWithFilter", ajaxData)
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
                    $http.post("/api/DocumentRepository/GetWithFilter", ajaxData)
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

//wide: bool, content: string, title: string, footer: string
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
    return str
        .replace(/\\/g, "\\\\")
        .replace(/[\n]/g, '');
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
            else if (Array.isArray(v) || v.constructor == Object || (typeof v == "object" &&v["__action"]))
                allPropertiesToTimeZoneLessString(v);
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
            url: "/api/Magic_Grids/GetGUIDByName/" + gridName,
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
    //str.substring(1, str.lenght - 2);
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
    if(!path)
        path = window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Styles/3rd-party/";
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
                            operator: ($input && $input.attr("autocompleteFilterOperator")) ? $input.attr("autocompleteFilterOperator") : "contains" ,
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
        $.get("/api/Config/GetUserConfig/" + configName)
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
                "/api/Config/PostConfig?type=" + configName,
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

    if (gridObject.toolbar && Array.isArray(gridObject.toolbar)) {
        var i = 0;
        while (i < gridObject.toolbar.length) {
            if (gridObject.toolbar[i].name && (gridObject.toolbar[i].name == "create" || (!options.removeSaveButton && gridObject.toolbar[i].name == "save"))) {
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
            if (window.userSessionManagementSp)
            {
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
            MF:MF,
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
function showGridMap(buttonEl) {
    var data = $(buttonEl).closest(".k-grid").data(),
        grid = data.kendoGrid,
        mapController = $("#grid-map-controller"),
        config;
    if (!mapController.length) {
        config = {
            grid: grid,
            ready: function () {
                mapController.find(".fadeout").addClass("fadein");
                setTimeout(function () {
                    mapController.find("i").remove();
                }, 1000)
            }
        };
        mapController = $('<div id="grid-map-controller" class="k-grid" style="position: relative">')
            .append('<div style="position: absolute; left: 50%; top: 40%">'+ largeSpinnerHTML +'</div>')
            .append($(getAngularControllerElement("Magic_GridGoogleMapController", function () { return config; })).css("height", "100%").addClass("fadeout"))
            .css("height", " 70vh")
            .insertBefore("#appcontainer");
    }
    else{
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
                if(v.width != undefined){
                    style += 'width:' + v.width + ' !important;';
                }
                if(v.height != undefined){
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
        $("#appcontainer").one("kendoGridRendered", function (e, grid, gridid) {

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
                MF.kendo.getStoredProcedureDataSource(options.stored, {
                    data: { gridGUID: element.guid ,gridName: gridid, isPublic: (element.gridExtension && element.gridExtension.isPublic) ? element.gridExtension.isPublic : false },
                    success: function (e) {
                        if (e.items) {
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
                                buildDocuments(grid.dataSource.filter(), $(this).data('modelType'), grid.options.selectable ? $.map(grid.select(), function (v) { return grid.dataItem(v); }) : [], null, options.formTableName, options.controllerName, grid);
                            });
                        }
                    }
                }).read();
            });
        });
    }
}

function buildDocuments(filter, modelType, selected, docIsReadyCallback, formTableName, controllerName, grid,isPublic) {
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
            <div ng-show="c.requestSent" class="progress progress-striped active progress-large">\
                <div ng-style="{width: c.exportProgress + \'%\'}" class="progress-bar progress-bar-success"></div>\
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
    if (data && data.length > 1 && ((data.TrimStart()[0] == "{" && data[data.length - 1] == "}") || (data[0] == "[" && data[data.length - 1] == "]")))
        return JSON.parse(data);
    return data;
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
        selected = grid.select(),
        showWarning = false,
        selectedData = [];

    if (!selected.length) {
        kendoConsole.log(getObjectText("selectRowError"), "error");
        return false;
    }

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
        $.post({
            url: "/api/GENERICSQLCOMMAND/GetWithFilter",
            data: JSON.stringify({ table: "dbo.Magic_SystemMessages", order: "1", where: "Code IN ('" + $.map(messages, function (v) { if (v.isDefaultTemplate) { defaultTemplate = v.templateCode } return v.templateCode }).join("', '") + "')" }),
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
        openEditor("new");
        var $mailEditorContainer = $('#mailEditorContainer', $content);
        $('> div', $mailEditorContainer).first().remove();
        $mailEditorContainer.data("returnMessage", true);

        if (templatesArray) {
            var templates = {},
                options = '<option value="">' + getObjectText("selectEmailTemplate") + '</option>';

            $.each(templatesArray, function (k, v) {
                templates[v.Code] = v;
                options += '<option' + (defaultTemplate == v.Code ? ' selected' : '') + '>' + v.Code + '</option>';
            });

            var $templateSelector = $('<select>' + options + '</select>');
            $templateSelector.change(function () {
                var val = $templateSelector.val();
                if (val in templates) {
                    if (templates[val].Subject)
                        $("input[name=Subject]", $content).val(templates[val].Subject);
                    if (templates[val].To)
                        $("input[name=To]", $content).val(templates[val].To);
                    if (templates[val].cc)
                        $("input[name=CC]", $content).val(templates[val].cc);
                    if (templates[val].ccn)
                        $("input[name=BCC]", $content).val(templates[val].ccn);
                    if (templates[val].Body) {
                        var body = templates[val].Body.replace(/-#(.+?)#-/gm, function (string, key) {
                            if (key in selectedData[0]) {
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

        $mailEditorContainer.on('mailSent', function (e, message, draft) {
            if (!draft && typeof message == "object") {
                var document = mailGetBOMessage(message);
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
</div><div class="clearfix"></div>\
<div class="k-edit-buttons k-state-default text-right">' +
(BOIds.length == 1 ? '<button disabled="true" class="k-button k-button-icontext" type="submit"><span class="k-icon k-delete"></span>' + getObjectText('delete') + '</button>&nbsp;' : '')+
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
            dataSource: new kendo.data.DataSource({
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
                        return response.Data.length? response.Data[0].Table : [];
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
                            return false;
                        }
                    });
                } else {
                    $deleteBTN.attr('disabled', true);
                    $note.val('');
                    $datepicker.data('kendoDateTimePicker').value('');
                    $private.prop('checked', false);
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
            BOType: BOType
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
            dataType: "json",
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
}

//START Print and PDF creation
function printHtml($el)
{
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

                if (options.exportElement){
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

function getModelAndContainerFromKendoPopUp(e,primarykey)
{
    var model;
    var container = $(e).closest(".k-popup-edit-form");
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
    navigator.geolocation.getCurrentPosition(function (location) {
        usersGeoLocation = location;
    });
}
//#region hide/show fields in popup 
function hideFieldsBasedOn(e,fn)//fn is the fieldname...
{
    var gridname,fieldname,$container,value;
    gridname = e.sender.element.attr("gridname") ? e.sender.element.attr("gridname") : $('tr[data-uid='+e.sender.element.closest('.k-popup-edit-form').data("uid")+']').closest('.k-grid').attr("gridname");
    if (!gridname)
        gridname = e.sender.element.closest('.k-popup-edit-form').data("gridname");
    //called from the field change event
    if (!e.sender.element.data("kendoGrid"))
    {
         fieldname = e.sender.element.attr("name");
         $container = e.sender.element.closest('.k-popup-edit-form');
         value = e.sender.value();
   }
   else {
    //called from the grid popup
       
       fieldname = fn;
       value = e.model[fn];
       $container = e.container;
    }
    hideFieldsBasedOn_(gridname,fieldname,value,$container);
}

function hideFieldsBasedOn_(gridname,fieldname,value,$container){

    if (fieldname && changeEvents[gridname] && changeEvents[gridname][fieldname] && changeEvents[gridname][fieldname][value]){ 
         if (changeEvents[gridname][fieldname][value].to_show)
            _showFields(changeEvents[gridname][fieldname][value].to_show,$container);
         if (changeEvents[gridname][fieldname][value].to_hide)
            _hideFields(changeEvents[gridname][fieldname][value].to_hide,$container);
         
    }
 }

 function _showFields(a , $container){
     $.each(a,function (i,v) {
            $container.find("[name="+v+"]").closest("[class*=col-]").show();
     });
}   

 function _hideFields(a,$container){
    $.each(a,function (i,v) {
            $container.find("[name="+v+"]").closest("[class*=col-]").hide();
     });
 }
//#endregion

//#region wizard
 function wizard_hideFieldsAndSteps(value, formItems, scope, element, $timeout, columnName) {
     var wizardScope = getWizardScope(scope);

     requireConfigAndMore(["MagicSDK"], function (MF) {
         MF.api.getDataSet({ wizardCode: wizardScope.wizardCode, stepKey: wizardScope.step.stepKey, field: columnName, value: value, models: wizardScope.models }, window.wizardShowHideFieldsAndTabsSP ? window.wizardShowHideFieldsAndTabsSP : "CUSTOM.MagicWizard_hideFieldsAndSteps").then(function (result) {
             var fields_to_hide = result.length ? result[0] : [];
             var tabs_to_hide = result.length > 1 ? result[1] : [];

             $.each(fields_to_hide, function (i, v) {
                 if (v.field) 
                    toggleSchemaFormField(formItems, v.field, v);
             });
             $.each(tabs_to_hide, function (i, v) {
                 if (v.stepkey)
                    toggleSchemaFormWizardStep(formItems, scope, v.stepkey, v.show);
             });

             $timeout(function () { scope.$broadcast('schemaFormRedraw'); },100);
         });
     });
 }


 function stepIndexFromKey (steps, stepKey) {
     var index;
     $.each(steps, function (i, v) {
         if (v.stepKey == stepKey)
             index = i;
     });
     return index;
 }


 function toggleSchemaFormWizardStep(formItems, scope,stepKey, show) {


     //hides the tab of the previous contract subscriber person (tab 2.8) in the wizard
     //loop scope parents until I get the wizard scope
     var wizardScope = getWizardScope(scope);
     var wasHidden = wizardScope.settings.steps[stepIndexFromKey(wizardScope.settings.steps, stepKey)].hidden;
  
     if (show) 
         delete wizardScope.settings.steps[stepIndexFromKey(wizardScope.settings.steps, stepKey)].hidden;
      else 
         wizardScope.settings.steps[stepIndexFromKey(wizardScope.settings.steps, stepKey)].hidden = true;

     if (wasHidden && show)
        wizardScope.$broadcast('schemaFormValidate');
 }

 function toggleSchemaFormField(formItems, fieldName, v) {
     if (formItems != null) {
         for (var rowKey = 0; rowKey < formItems.length; rowKey++) {
             for (var colKey = 0; colKey < formItems[rowKey].items.length; colKey++) {
                 if (formItems[rowKey].items[colKey].items[0].key[0] == fieldName) {
                     formItems[rowKey].items[colKey].condition = v.show.toString();
                     formItems[rowKey].items[colKey].readonly = 1;
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
                                var jInput = jStep.find('.schema-form-section *[name="' + key + '"], .schema-form-section *[on-select*="' + key +'"], .schema-form-section *[ng-model="'+key+'"]');
                                if (jInput.length==0) {                                                
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
     var regexpTAXCode = "^(?:[B-DF-HJ-NP-TV-Z](?:[AEIOU]{2}|[AEIOU]X)|[AEIOU]{2}X|[B-DF-HJ-NP-TV-Z]{2}[A-Z]){2}[0-9LMNP-V]{2}(?:[A-EHLMPR-T](?:[04LQ][1-9MNP-V]|[1256LMRS][0-9LMNP-V])|[DHPS][37PT][0L]|[ACELMRT][37PT][01LM])(?:[A-MZ][1-9MNP-V][0-9LMNP-V]{2}|[A-M][0L](?:[0-9LMNP-V][1-9MNP-V]|[1-9MNP-V][0L]))[A-Z]$";
     var patt = new RegExp(regexpTAXCode, "gi");
     return (patt.test(value));
 }

 function apiGetResultUserMessage(aResult) {
     var userMessage=aResult.info.userMessage;
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
                     else if (res.info.resultCode===-2)                
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
         //var model = $.extend({}, window.getCurrentModelInEdit());
         var data = new Object();
         data.IBAN = e.Iban;
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
    var def = $.Deferred();
    requireConfigAndMore(["MagicSDK", "MagicActions"], function (MF) {
        MF.api.getDataSet(options.requestOptions, options.storeProcedureName).then(function (actions) {
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
                        return build3LevelBootstrapAccordion({ recordid: options.requestOptions.id , currentTarget: options.element, actions: actions[0] }, options.accordionId, actionLinkReferenceBuilder);
                    else
                        return "None";
                },
                width: "250px"
            }).trigger("tooltipCreated");
            options.element.data("kendoTooltip").show();
            if (actions && actions[0].length) {
                setActionSettings(actions[0], "actionsettings", options.accordionId);
                setActionSettings(null, "subsettings");
            }
        });
    });
    return def.promise();
};