//#region template items
//Qui bisogna definire le unita' di base che costituiscono il menu
var menucomponents = {};

var customicons= {};
customicons["metronic"] = "icon-folder";
customicons["webarch"] = "icon-custom-ui";

liclasslevel_0 = "start";
liclasslevel_def = "openpage";

menucomponents["metronic@menuitemnofunc"] = '<li id="m{1}"><a href="javascript:;"><span class="arrow"></span><i class="{2}"></i><span class="title">{0}</span></a>';
menucomponents["metronic@menuitemchildcontainer"] = '<ul class="sub-menu" style="display: none;">';
menucomponents["metronic@menuitemwithfunc"] = '<li id="m{0}" class="{8}"><a code="{5}" funcid="{6}" data-guid="{10}" href="{3}" {1} {4} functext="{9}"><i style="margin-right:3px;" class="{7}"></i><span class="title">{2}</span></a>';

menucomponents["webarch@menuitemnofunc"] = '<li id="m{1}" class><a href="javascript:;"><i class="{2}"></i><span class="title">{0}</span><span class="arrow"></span></a>';
menucomponents["webarch@menuitemchildcontainer"] = '<ul class="sub-menu">';
menucomponents["webarch@menuitemwithfunc"] = '<li id="m{0}" class="{8}"><a code="{5}" funcid="{6}" data-guid="{10}" href="{3}" {1} {4} functext="{9}"><i class="{7}"></i><span class="title">{2}</span></a>';


menucomponents["bucket@menuitemnofunc"] = '<li id="m{1}" class="sub-menu dcjq-parent-li"><a href="javascript:;" class="dcjq-parent"><i class="fa fa-tasks"></i><span class="title">{0}</span><span class="dcjq-icon"></span></a>';
menucomponents["bucket@menuitemchildcontainer"] = '<ul class="sub">';
menucomponents["bucket@menuitemwithfunc"] = '<li id="m{0}" class="openpage"><a code="{5}"  funcid="{6}" data-guid="{10}" href="{3}" {1} {4} >{2}</a>';
//#endregion

function logout() {
    if (window.logoutOverwrite)
        window.logoutOverwrite();
    else {
        getSisenseLogoutURL()
            .done(function (logoutUrl) {

                if (window.sisenseFrames) {  //#sisense #logout
                    $.each(window.sisenseFrames, function (i, frame) {
                        frame.src = logoutUrl;
                        //frame.onload = function (e) { //neccessary to wait?
                        //}
                    });
                }
                abandonSession();
            })
            .fail(function () {
                abandonSession();
            });
    }
}

function abandonSession() {
    $.ajax({
        type: "GET",
        url: "/api/MenuData/AbandonSession",
        success: function (res) {
            sessionStorage.clear();//pulisce eventuali dati messi in sessionStorage
            window.location.href = res || "/login";
        }
    })
}

function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
}

function DeleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
}

function getPathInfoFromJSFilename(filename) {
    var src = "",
        controller = "",
        isCustom = false;
    var isReactComponent = false;
    if(filename){
        src = window.includesVersion;
        controller = filename.length > 13 && filename.substring(filename.length - 13) == "Controller.js" ? "Controllers/" : "";
        isCustom = false;
        if (filename.match(/^Magic/)) {
            src += "/Magic/Views/Js/";
        }
        else {
            src += "/Views/" + window.ApplicationCustomFolder + "/Js/";
            isCustom = true;
        }
        if (filename.match(/.jsx$/)) {
            src += "react/build/" + filename.substring(0, filename.length - 1);
            isReactComponent = true;
        }
        else
            src += controller + filename;
    }
    return {
        path: src,
        isAngularController: !!controller,
        isCustom: isCustom,
        isReactComponent: isReactComponent
    };
}

function getCustomViewsPath() {
    return window.includesVersion + "/Views/" + window.ApplicationCustomFolder + "/"
}

function buildDeps(func) {
    var path = window.includesVersion + "/Custom/" + window.ApplicationCustomFolder + "/Scripts/";
    var magicpath = window.includesVersion + "/Magic/v/" + window.applicationVersion + "/Scripts/";
    var dependencies = [];
    if (func[0].FunctionJSDeps)
        dependencies = $.map(func[0].FunctionJSDeps.split(','), function (v, i) {
            if (v.toLowerCase().indexOf("magic") != -1)
                return magicpath + v; //se contiene "magic" lo cerco nei Magic\v\scripts
            else
                return path + v; // viene cercato nei Custom\idapp(custom folder)\scripts
        });
    dependencies.push(path + "dispatchers.js");
    return dependencies;
}

//Starts the function
function genericMenuClickInlcludeOuterJS(func, isHTMLPage)
{
    var dependencies = buildDeps(func);
    var dependencyOutput;
    var deferred = $.Deferred();
    if (dependencies.length)
        require(dependencies, function (dependencyOutput) {
            deferred.resolve(dependencyOutput);
        });
    else
        deferred.resolve([]);
    $.when(deferred).then(function (dependencyOutput) {
        if (func[0].FunctionJsScript != null || isHTMLPage) {
            var pathInfo = getPathInfoFromJSFilename(func[0].FunctionJsScript);
            if (pathInfo.isReactComponent) {
                // different webpack configs fix
                delete window.webpackJsonp;
                initReact($('#grid'), func[0].FunctionJsScript.replace(".jsx", ""))
                    .then(function (unmount) {
                        $(window).one('hashchange', function () {
                            unmount();
                        });
                    });
            }
            else {
                if (isHTMLPage) {
                    pathInfo.isAngularController = true;
                    if (!pathInfo.path)
                        pathInfo.path = window.includesVersion + "/Magic/Views/Js/Controllers/InitFormOptionsController.js";
                }
                if (pathInfo.isAngularController) {
                    requireConfigAndMore([pathInfo.path], function (init) {
                        if (init)
                            init(func[0].FunctionBaseUrl, dependencyOutput);
                    });
                }
                else
                    $.getScript(pathInfo.path, function (data, textStatus, jqxhr) {
                        loadscript(dependencyOutput);
                    });
            }
        }
        else {
            //getrootfunction from MagicUtils.js
            getrootfunction(func,dependencies);
        }
    });
}

function genericMenuClickTemplateManagement(functionid) {
    return $.ajax({
        type: "GET",
        async: true,
        url: "/api/Magic_Templates/GetTemplateForFunction/" + functionid,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (functemplates)
        {
            //ricostruisco l'HTMl in modo da eliminare qualsiasi precedente contenuto.
            kendo.destroy($("#appcontainer"));
            $("#appcontainer").html("<div id=\"templatecontainer\"></div><div id=\"grid\"></div>");
            $("#templatecontainer").append(functemplates);
            $("#grid-map-controller").hide();
            try {
                var dwgController = $("#grid-dwg-controller");
                if (dwgController && dwgController.length) {
                    kendo.destroy(".gd-dg-viewer");
                    dwgController.remove();
                }
                var mapController = $("#tree-map-controller");
                if (mapController && mapController.length) {
                    mapController.remove();
                }
            }
            catch (ex) {
                console.log(ex);
            }

        }
    });
}

function genericMenuClickHeader(functionid,menuid)
{
    IsValidSession().then(function () { 
        $(window).scrollTop(0);

        sessionStorage.setItem("fid",functionid.toString());
        sessionStorage.setItem("lastmid", sessionStorage.getItem("mid"));
        sessionStorage.setItem("mid", menuid);
        //autocompletes = [];
        //window.history.pushState({ "html": "", "pageTitle": "main" }, "", "/");
        $("li.start").removeClass("active"); // rimozione di active su dashboard
        $('#statisticsRangePicker').remove();
        // reperisco il title ed i valori della funzione per costruire il click sul menu
        getfuncdata(functionid);
    });
}

function openPostbackPageMenu(pathname)
{
    //cerco gli elementi nella pagina che hanno l' href 
    if (pathname.indexOf("dashboard") == -1) {

        var ajquery = $('a').filter(function () {
            return $(this).attr('href').toLowerCase().indexOf(pathname.toLowerCase()) > -1;
        });

        //var ajquery = $('a[href^="' + pathname + '"]');
        var menuid = ajquery.parent("li").attr("id").substring(1, ajquery.parent("li").attr("id").length);
        var funcid = ajquery.attr("funcid");
        getfuncdata(funcid);
        getbreadcrumbs(menuid);
        $("ul#sidemenu span.title").each(function () {
            $(this).closest("li").removeClass("open");
            $(this).parent().next().css("display", "none");
            $(this).prev().prev().removeClass("open");
        })
        // spengo tutte le selezioni dei punti di menu
        $("ul#sidemenu li.openpage").each(function () {
            $(this).removeClass("active");
            $(this).removeClass("open");
        });
        $("#sidemenu li.openpage a span.selected").remove();

        //selezione il punto di menu trovato
        ajquery.closest("li").addClass("active");
        //aggiungo il triangolo bianco in fondo al punto di menu
        ajquery.append("<span class=\"selected\"></span>");
        // apro i punti di menu di primo livello e il modulo
        ajquery.parents("li").each(function () {
            $(this).closest("li").addClass("open");
            $(this).closest("ul").css("display", "block");
            $(this).find("span.arrow").addClass("open");
        })
    }
}

function isPostbackPage() {
    var ret = location.pathname != "/app";
    if (location.pathname == "/dashboard") {
        $("#InitialLi").addClass("active");
    } //else {
        //$("li.start").removeClass("active");
    //}

    return ret;
}
//Use in document ready in aspx page in order to use standard title and descriptions of functions
function getFuncTitleAndDescrAfterRedirect()
{
    if (sessionStorage.getItem("fLabs")) {
        var obj = JSON.parse(sessionStorage.getItem("fLabs"));
        var title = obj.fname;
        var description = obj.ftext;
        genericMenuClickManageTitle(title, description);
    }
}
function getfuncdata(functionid) {
    $(".remove-on-pagechange").remove();

    if (!isPostbackPage())
        var tpl = genericMenuClickTemplateManagement(functionid);

    var $menuPt = $("a[funcid="+functionid+"]");
    var functionIDOrGUID = $menuPt.data("guid") || functionid;

    var func = $.ajax({
        type: "GET",
        url: "/api/Magic_Functions/Get/" + functionIDOrGUID,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (func) {
            var qs = "",
                isHTMLPage = func[0].FunctionBaseUrl.match(/.html$/);
            if (func[0].FunctionQsParameters)
                qs = func[0].FunctionQsParameters;

            //if the function points to a page redirect
            if (!isHTMLPage && func[0].FunctionBaseUrl != "#") { //aspx case
                sessionStorage.setItem("fLabs", JSON.stringify({ fname:func[0].FunctionName, ftext:func[0].FunctionDescription  }));
                window.location.href = func[0].FunctionBaseUrl + "?menuId=" + getMagicAppURIComponents().menuId + "&" + qs;
                return;
            }

            if (qs && window.location.search.indexOf(qs) == -1)
                window.location.search = (window.location.search.length > 1 ? window.location.search + "&" : "?") + qs

            addToSessionObject("targetFunctionIds", functionid, func[0].FunctionID);

            sessionStorage.setItem("fname", func[0].FunctionName);
            genericMenuClickManageTitle(func[0].FunctionNameDescription, func[0].FunctionDescription, func[0].FunctionID);
            var helpData = JSON.parse(func[0].Help);
            try {
                if (func[0].HelpGUID) {
                    addFunctionHelp(null, func[0].HelpGUID)
                        .then(onClickFn => {
                            var $questionMark = $('<i class="fa fa-question fa-3x" style=" display: inline-block; float: right; cursor: pointer;"></i>');
                            $questionMark.click(onClickFn);
                            $(".page-title").append($questionMark);
                        });
                }
                if (func[0].FunctionHelp && func[0].FunctionHelp[0] == "[")
                    addFunctionHelp(func[0].FunctionHelp);
            }
            catch (e) {
                kendoConsole.log("error while adding functionHelp: " + e, true, true);
            }
            if(typeof help == 'function'){
                $.each(activeHelp, function (k, v) {
                    if (k.indexOf("function_") === 0) {
                        activeHelp[k].destroy();
                        delete activeHelp[k];
                    }
                });
                if (helpData != null) {
                    var identifier = "function_" + func[0].FunctionID;
                    help(helpData, identifier);
                }
            }
            if (tpl)
            {
                //MenuDataManager.js
                tpl.success(function () {
                    genericMenuClickInlcludeOuterJS(func, isHTMLPage);
                });
            }
            return func;
        }
    });
};

function setTranslationToCurrentCulture(object, keys) {
    var noTranslationFoundFor =  [];
    $.each(keys, function (i, key) {
        if(!object[key])
            noTranslationFoundFor.push(key);
        else if (typeof object[key] == "object") {
            var translation;
            for (var i = 0; i < object[key].length; i++) {
                if (typeof object[key][i] == "string")
                    translation = object[key][i];
                else if (object[key][i][key] && object[key][i].lang && window.culture.substring(0, object[key][i].lang.length) == object[key][i].lang) {
                    translation = object[key][i][key];
                    break;
                }
            }
            if(!translation)
                noTranslationFoundFor.push(key);
            else
                object[key] = translation;
        }
    });
    return noTranslationFoundFor;
}

function findLanguages(array) {
    var currentLanguage = window.culture;
    var result = array.filter(l => l.language === currentLanguage);
    if (result.length) {
        return result;
    }
    result = array.filter(l => l.language.toLowerCase() === currentLanguage.split('-')[0].toLowerCase());
    if (result.length) {
        return result;
    }
    if (array.length) {
        return [array[0]];
    }
    return [];
}

function addFunctionHelp(functionHelpObject, helpGUID = null) {
    if (helpGUID) {
        return $.ajax({
            url: '/api/Help/GetHelpObject?guid=' + helpGUID,
        })
            .then(
                function (res) {
                    var help = JSON.parse(res).Configuration;
                    var html = '';
                    if (help.languages) {
                        for (var lang of findLanguages(help.languages)) {
                            if (lang.title) {
                                html += `<h1>${lang.title}</h1>`;
                            }
                            if (lang.html) {
                                html += lang.html;
                            }
                        }
                    }
                    if (help.files) {
                        var files = findLanguages(help.files);
                        for (var fileInfo of files) {
                            html += '<br>';
                            html += fileInfo.title;
                            for (var file of fileInfo.files) {
                                html += `<br><a target="_blank" href="/api/MAGIC_SAVEFILE/GetFile?path=${file.name}">${file.name}</a>`;
                            }
                        }
                    }
                    return function () {
                        var $modal = showModal({
                            title: '<i class="fa fa-question fa-4x"></i>',
                            content: html,
                            wide: true
                        }).closest("#wndmodalContainer");
                        $modal.one("hide.bs.modal", function () {
                            cleanModal();
                        });
                    };
                },
                function (res) {
                    kendoConsole.log(res);
                }
        );
        return;
    }
    var $questionMark = $('<i class="fa fa-question fa-3x" style=" display: inline-block; float: right; cursor: pointer;"></i>');
    functionHelpObject = JSON.parse(functionHelpObject);
    functionHelpObject = functionHelpObject.map(function (v, i) {
        var noTranslationFoundFor = setTranslationToCurrentCulture(v, ["html", "title"]);
        if(!v.html)
            return v;

        if (noTranslationFoundFor.indexOf("html") == -1)
            return v;

        functionHelpObject.splice(i, 1);
    });
    if (!functionHelpObject.length)
        return;
    var $questionMark = $('<i class="fa fa-question fa-3x" style=" display: inline-block; float: right; cursor: pointer;"></i>');
    var $modalContent = $(getDataReaderHtml());
    $questionMark.click(function () {
        var $modal = showModal({
            title: '<i class="fa fa-question fa-4x""></i>',
            content: $modalContent,
            wide: true
        }).closest("#wndmodalContainer");
        initAngularController($modalContent[0], "DataReaderController", dataReaderConfig);
        $modal.one("hide.bs.modal", function () {
            cleanModal();
        });
    });
    var dataReaderConfig = {
        dataList: functionHelpObject,
        contentTemplate: function (data) {
            var html = "";
            switch (data.type) {
                case "youtube":
                    var q = "origin=" + window.location.protocol + "//" + window.location.host;
                    if (data.autoplay)
                        q += "&autoplay=1";
                    html += '<div class="keep-ratio-wrapper"><div class="keep-ratio"><iframe style="height:100%;width:100%" id="ytplayer" type="text/html" src="' + window.location.protocol + '//www.youtube.com/embed/' + data.id + '?' + q + '" frameborder="0"/></div></div>';
            }
            if (data.html){
                if (html)
                    html += "<br>";
                html += data.html;
            }
            return html;
        },
        listTemplate: function (data) {
            var html = '<div class="list">';
            switch (data.type) {
                case "youtube":
                    html += '<i class="fa fa-youtube fa-2x"></i>';
            }
            if (data.title)
                html += " " + data.title;
            return html += '</div>';
        }
    };
    $(".page-title").append($questionMark);
}

function IsValidSession() {
  return $.ajax({
        type: "GET",
        url: "/api/MenuData/IsValidSession",
        contentType: "application/json; charset=utf-8",
        dataType: "json"
  }).then(function (check) {
      return $.Deferred(function (deferred) {
          if (check.isvalidsession == false) {
              location.href = 'login';
              return deferred.reject(check);
          }
          deferred.resolve(check);
      }).promise();
  }, function (jqXHR, textStatus, errorThrown) {
      return $.Deferred(function (deferred) {          
              location.href = 'login';
              return deferred.reject();                    
      }).promise();
  });
}


function appendMenuToDom(admintemplatename, callback)
{
   // var menudata = sessionStorage.MenuControllerParameter == undefined ? "dbo.Magic_GetMenuTree" : sessionStorage.MenuControllerParameter;
   // var appareid = sessionStorage.MenuControllerParameter == undefined ? 0 : sessionStorage.ApplicationAreaId;

    var menudata = sessionStorage.MenuControllerParameter == undefined ? "-1" : sessionStorage.MenuControllerParameter;
    var appareid = sessionStorage.MenuControllerParameter == undefined ? -1 : sessionStorage.ApplicationAreaId;

    //Il meta-menu viene restituito in lingua da controller che richiama dbo.[Magic_GetMenuTree]
    var $sideMenu = $("#sidemenu");
    $sideMenu.data("status", "loading");

    var menu = $.ajax({
        type: "POST",
        url: "/api/MenuData/GetMenu",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ storedProcedure: menudata, applicationareaid: appareid }),
        success: function (menuitems) { //Scorro menu andando a fare lo string format degli elementi HTML presi dall'  hash dei menucomponents (var globale)
            //webarch.js
            if (typeof changemenuTitle === "function" && menuitems[0]!=undefined)
            {
                changemenuTitle(menuitems[0].ITEM_MODULE);
            }
            var menustring = "";
            var openitems = [];
            for (var i = 0; i < menuitems.length; i++) {
                if (menuitems[i].ITEM_FUNCTIONID == "") {
                    menustring += menucomponents[admintemplatename + "@menuitemnofunc"].format(menuitems[i].ITEM_LABEL, menuitems[i].ITEM_ID.toString(), menuitems[i].ITEM_ICON == "" ? customicons[template] : menuitems[i].ITEM_ICON);
                    openitems.unshift({ control: "</li>", item: menuitems[i].ITEM_LABEL, level: menuitems[i].ITEM_LEVEL });
                    //controllo se l ' elemento successivo e' innestato nel corrente 
                }
                else {
                    var liclass = liclasslevel_def;
                    if (menuitems[i].ITEM_LEVEL =="2")
                        liclass = liclasslevel_0;
                    var moduleId = menuitems[i].ITEM_PATH.split("|")[0];
                    menustring += menucomponents[admintemplatename + "@menuitemwithfunc"].format(
                        menuitems[i].ITEM_ID.toString(),
                        "",
                        menuitems[i].ITEM_LABEL,
                        ((menuitems[i].ITEM_HREF && menuitems[i].ITEM_HREF != "javascript:void(0)")
                            ? menuitems[i].ITEM_HREF + "?menuId=" + menuitems[i].ITEM_ID
                            : "/app#/function/" + menuitems[i].ITEM_ID + "-" + moduleId + "-" + encodeURI(menuitems[i].ITEM_LABEL)).replace(/%20/g, "-"),
                        "data-item-checksum='" + menuitems[i].ITEM_CHECKSUM + "'",
                        menuitems[i].ITEM_LABEL_ORIG,
                        menuitems[i].ITEM_FUNCTIONID,
                        menuitems[i].ITEM_ICON,
                        (liclass + " menu-" + menuitems[i].ITEM_ID + "-" + moduleId + " menuId-" + menuitems[i].ITEM_ID),
                        menuitems[i].ITEM_LABEL,
                        menuitems[i].ITEM_GUID || "");
                    openitems.unshift({ control: "</li>", item: menuitems[i].ITEM_LABEL, level: menuitems[i].ITEM_LEVEL });
                }
                if ((i + 1) < menuitems.length && parseInt(menuitems[i + 1].ITEM_LEVEL) === (parseInt(menuitems[i].ITEM_LEVEL) + 1)) {
                    menustring += menucomponents[admintemplatename + "@menuitemchildcontainer"];
                    openitems.unshift({ control: "</ul>", item: menuitems[i].ITEM_LABEL, level: menuitems[i].ITEM_LEVEL });
                }
                //chiudo i livelli tra il corrente ed il successivo 
                if (((i + 1) < menuitems.length && parseInt(menuitems[i + 1].ITEM_LEVEL) <= parseInt((menuitems[i].ITEM_LEVEL))) || ((i + 1) > menuitems.length)) {
                    var levelstoclose = menuitems[i].ITEM_LEVEL - menuitems[i + 1].ITEM_LEVEL;

                    if (levelstoclose == 0) {
                        menustring += openitems[0].control;
                        openitems.splice(0, 1);
                    }
                    else
                        // scorro openitems e chiudo tutti gli elementi del livello dell' elemento dei livelli dal (current-1) al (current+1)
                    {
                        for (j = parseInt(menuitems[i + 1].ITEM_LEVEL) ; j <= parseInt(menuitems[i].ITEM_LEVEL) ; j++)
                            for (var n = openitems.length - 1 ; n >= 0; n--)
                                if (parseInt(openitems[n].level) === j) {
                                    menustring += openitems[n].control;
                                }
                        var k = 0;
                        var itemstosplice = [];
                        for (j = parseInt(menuitems[i + 1].ITEM_LEVEL) ; j <= parseInt(menuitems[i].ITEM_LEVEL) ; j++)
                            for (var n = openitems.length - 1; n >= 0; n--)
                                if (parseInt(openitems[n].level) === j) {
                                    itemstosplice[k] = n;
                                    k++;
                                }
                        for (k = 0; k < itemstosplice.length; k++)
                            openitems.splice(itemstosplice[k], 1);

                    }
                }
            }

            $sideMenu.append(menustring);
            //$(".openpage a").bind("click", putuserrightsincookie);
            //D.t includes menu points which are at 2nd level in system modules...
            $("a[funcid]").bind("click", putuserrightsincookie);

            callback();
            $sideMenu.data("status", "ready");
            $sideMenu.trigger("menuReady");
        }
    });

    function putuserrightsincookie(e) {
        var rights = $(e.currentTarget).data("item-checksum");
        //setto un cookie con i diritti dell' ultima funzione-menu selezionati
        //setCookie("urights", rights, 1);
        sessionStorage.setItem("urights", rights);
    }


}

function SearchAutocomplete(domid) {
    var ds = {
        transport: {
            read: {
                // url: "/api/" + researchgrid + "_Autocomplete/Select",
                url: "/api/MenuData/PostPerformMenuResearch",
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
            if (e.response != null && e.response != "") {

                if (e.response.Errors == null && e.type == "create") {
                    e.sender.read();
                    kendo.ui.progress($("#grid"), false);
                    kendoConsole.log(new Date().toLocaleString() + "::" + e.type + " OK", false);
                }
            }
            else
                if (e.type == "update" || e.type == "destroy") {
                    e.sender.read();
                    kendo.ui.progress($("#grid"), false);
                    kendoConsole.log(new Date().toLocaleString() + "::" + e.type + " OK", false);
                }
        },

        batch: false,
        pageSize: 1000,
        serverPaging: true,
        serverSorting: true,
        serverFiltering: true,
        schema: {
            data: "Data",
            total: "Count",
            errors: "Errors"
        }
    }

    var autocomplete = $("#searchedtextautocomplete").kendoAutoComplete({
        minLength: 1,
        dataTextField: "ObjectName",
        filter: "contains",
        //headerTemplate: '<div class="dropdown-header">' +
        //        '<span class="k-widget k-header">Photo</span>' +
        //        '<span class="k-widget k-header">Relevant info</span>' +
        //    '</div>',
        template: buildSearchTemplate,
        dataSource: ds,
        height: 370,
        select: function (e) {
            var data = e.item.find('[data-menu]').data('menu');
            MenuSearchExecutor(window['click' + data.classe], data.ObjectName, data.ObjectKey, data.ObjectContainerID);
        }
    }).data("kendoAutoComplete");
    if (window.vocalCommandsActive) {
        enableVocalCommandsForMagicFormElement($('#searchedtextautocomplete'));
    }
}
function buildSearchTemplate(data)
{

    var classe = "";
    switch (data.ObjectType) 
    {
        case ("module"): classe = "switchColorDarkGrey"; break; 
        case ("menuParent"): classe = "switchColorGrey"; break; 
        case ("menu"): classe = "switchColorBlue"; break; 
        default: classe = "switchColorlightkGrey"; break;
    }
    var MenuData = {
        classe: classe,
        ObjectName: data.ObjectName,
        ObjectKey: data.ObjectKey,
        ObjectContainerID: data.ObjectContainerID
    };
  
    return '<div data-menu=\'' + kendo.stringify(MenuData) + '\'><span class="' + classe + ' click' + classe + '">\
            <i class="icon-folder-open"></i></span>\
            <span class="click' + classe + '"><span class="menuItemFound">' + data.ObjectName + '</span><p><span class="colorBlue">Module::</span> ' + data.ObjectContainer + '</p></span></div>';
}

function MenuSearchExecutor(callback, objname, objid, areaid)
{
    
    //Gestione del cambio area se il menu cliccato e' in area diversa dalla corrente ed il cambio area e' previsto 
    var dsource = new kendo.data.DataSource({
        transport: {
            read: {
                dataType: "json",
                url: "/api/MAGIC_MMB_MODULES/GetAllApplicationAreas",
            }
        },
        change: function (e) {
            var ds = e.items;
            if (areaid !== (sessionStorage.ApplicationAreaId === undefined ? 0 : sessionStorage.ApplicationAreaId)) {
                sessionStorage.ApplicationAreaId = areaid;
                for (var j = 0; j < ds.length; j++) {
                    if (ds[j].ID === parseInt(sessionStorage.ApplicationAreaId)) {
                        var menucontrollersp = ds[j].Solver;
                        sessionStorage.MenuControllerParameter = menucontrollersp; //setto nel session storage 
                        sessionStorage.ApplicationAreaId = ds[j].ID;
                        sessionStorage.ApplicationAreaDescription = ds[j].Description;
                        sessionStorage.ApplicationAreaProfileSettingsType = ds[j].ProfileSettingsType;
                        //Task asyncrono di creazione del menu
                        generateSideMenu();
                        $("#sidemenu").one("menuReady", function () {
                            callback(objname, objid);
                        });
                    }
                }
            }
            else
                callback(objname, objid);
        }

    });

    var ds = dsource.read(); //scatena la change

 

}

// ho trovato un modulo e devo espanderlo
function clickswitchColorDarkGrey(moduloDaAprire,moduleid) {
    $("span.title").each(function () {
        // chiudo tutti i moduli
        $(this).closest("li").removeClass("open");
        $(this).parent().next().css("display", "none");
        $(this).prev().prev().removeClass("open");
        //apro il modulo che mi interessa
        if ($(this).html() == moduloDaAprire) {
            $(this).closest("li").addClass("open");
            $(this).parent().next().css("display", "block");
            $(this).prev().prev().addClass("open");
        }
    });
}

// ho trovato un punto di menu di primo livello e devo espanderlo assieme al suo modulo
function clickswitchColorGrey(moduloDaAprire, menuid) {
    $("span.title").each(function () {
        // chiudo tutti i moduli
        $(this).closest("li").removeClass("open");
        $(this).parent().next().css("display", "none");
        $(this).prev().prev().removeClass("open");
        //apro il modulo che mi interessa
        if (($(this).html() == moduloDaAprire) && ($(this).parent().parent().prop("id")===("m"+menuid) || menuid === undefined )) {
            $(this).parent().next().css("display", "block");
            $(this).prev().prev().addClass("open");
            $(this).closest("li").addClass("open");
            //apro tutti i moduli o menu di primo livello che sono prima di lui
            $(this).parents("li").each(function () {
                $(this).closest("li").addClass("open");
                $(this).closest("ul").css("display", "block");
                $(this).find("span.arrow").addClass("open");
            })
        }
    })
    var $el = $(".menuId-" + menuid).find("a").each(function (k, el) {
        el.click();
    });
}




function Openmenubyid(menuid)
{
    clickswitchColorBlue(null, menuid);
}

// ho trovato un punto di menu e devo caricare i contenuti relativi
function clickswitchColorBlue(moduloDaAprire, menuid,isconfig) {
    var avoidcheckingname = false;
    if (moduloDaAprire === null)
        avoidcheckingname = true;
    var found = false;
    $("ul#sidemenu a").each(function (i,val) {
        if (($(this).attr("functext") == moduloDaAprire || avoidcheckingname) && ($($(this).parent()[0]).prop("id") == ("m" + menuid) || menuid === undefined))
        {
            found = true;
            //recupero gli attributi che caratterizzano il link
            goPage = $(this).attr("href");
            goFunction = $(this).attr("onclick");
            //se goFunction = null significa che sul punto di menu ce un link di postback altrimenti ce una funzione
            if (goFunction == null) {
                location.href = goPage;
            }
            else {
                //chiudo tutti i moduli e i primi livelli 
                $("ul#sidemenu span.title").each(function () {
                    $(this).closest("li").removeClass("open");
                    $(this).parent().next().css("display", "none");
                    $(this).prev().prev().removeClass("open");
                })
                // spengo tutte le selezioni dei punti di menu
                $("ul#sidemenu li.openpage").each(function () {
                    $(this).removeClass("active");
                    $(this).removeClass("open");
                });
                $("#sidemenu li.openpage a span.selected").remove();
                // carico i contenuti
                eval(goFunction);
                //selezione il punto di menu trovato
                $(this).closest("li").addClass("active");
                //aggiungo il triangolo bianco in fondo al punto di menu
                $(this).append("<span class=\"selected\"></span>");
                // apro i punti di menu di primo livello e il modulo
                $(this).parents("li").each(function () {
                    $(this).closest("li").addClass("open");
                    $(this).closest("ul").css("display", "block");
                    $(this).find("span.arrow").addClass("open");
                })

            }
        }
        else {//questo serve quando c'e' un rimando ad una funzione "cross" che non ha il punto di menu nell' area corrente 
              //(es. Grid da pulsante di configurazione o scheduler da pianific.)
            if ((i + 1) === ($("ul#sidemenu a").length) && found === false && isconfig === true) {

                switch(moduloDaAprire) {
                    case "Scheduler":
                        getfuncdata(sessionStorage.SchedulerFunctionID);
                        break;
                    case "User Profile":
                    case getObjectText("personaldata"):
                        getfuncdata(sessionStorage.UserProfileFunctionID);
                        break;
                    default:
                        getfuncdata(window.GridConfigurationFunctionID);
                }

            }
            }
    });
}

function openMenu(id) {
    var $el = $(id),
        $sideMenu = $("#sidemenu");

    resetMenu($sideMenu);

    //click the element
    $el.click();

    //add open styles for clicked menu pt
    $el.parents("li").each(function (k, el) {
        el = $(el);
        el.addClass("open");
        el.find("span.arrow").eq(0).addClass("open");
    });
    $el
        .parents("ul")
        .each(function () {
            if ($(this).is('#sidemenu')) {
                return false;
            }
            if (
                window.outerWidth < 768
                || !$('html').is('.top-menu')
                || !$(this).parent().parent().is('#sidemenu')
            ) {
                $(this).css("display", "block")
            }
        });
}

//remove all open styles from menu
function resetMenu($sideMenu) {
    if (!$sideMenu)
        $sideMenu = $("#sidemenu");

    $sideMenu.find("ul").css("display", "none");
    $sideMenu.find("li").each(function (k, el) {
        el = $(el);
        el.removeClass("open");
        el.removeClass("active");
        el.find("span.arrow").removeClass("open");
    });
}

function redirectToFunction(funcIdOrGuid, queryString, doOpenInNewTab) {
    var key = typeof funcIdOrGuid == "string" && !funcIdOrGuid.match(/^\d$/) ? "funcGuid" : "funcId";
    $.post("/api/MenuData/PostPerformMenuResearch?" + key + "=" + funcIdOrGuid, null).then(function (res) {
        if (res.Data.length) {
            var path = "/app" + (queryString || "") + "#/function/" + res.Data[0].menuID + "-" + res.Data[0].moduleID + "-" + encodeURI(res.Data[0].label).replace(/%20/g, "-");
            if (!doOpenInNewTab)
                window.location.href = path;
            else
                window.open(path, "_blank");
        }
    });
}

function getCurrentFunctionGUID() {
    var components = getMagicAppURIComponents();
    if (components.menuId) {
        var clickedOn = ".menu-" + components.menuId + "-" + components.moduleId,
            $menuPt = $(clickedOn);
        return $menuPt.find("a").data("guid");
    }
    return null;
}

function getCurrentFunctionID() {
    var components = getMagicAppURIComponents();
    if (components.menuId) {
        var clickedOn = ".menu-" + components.menuId + "-" + components.moduleId,
            $menuPt = $(clickedOn);
        return $menuPt.find("a").attr("funcid");
    }
    return null;
}

function getMagicAppURIComponents() {
    var re = /#\/function\/([\d]+)-([\d]+)-?(.*)/;
    var uriComponents = re.exec(window.location.hash);
    if (uriComponents === null || uriComponents.length < 2)
        return {};
    return {
        menuId: uriComponents[1],
        moduleId: uriComponents[2],
        description: uriComponents[3]
    };
}

function favorizeLink(guid, title, parent, element) {
    getConfig("favoriteLinks").done(function (favoriteLinks) {
        var isFavorite = true;
        favoriteLinks = favoriteLinks || [];

        $.each(favoriteLinks, function (k, v) {
            if (v.guid == guid) {
                isFavorite = false;
                favoriteLinks.splice(k, 1);
                return false;
            }
        });

        if (isFavorite) {
            if (element) {
                element.title = getObjectText("removeLinkFromFavorites");
                element.className = 'fa fa-star';
            }
            favoriteLinks.push({
                title: title,
                parent: parent,
                guid: guid
            });
        } else if(element) {
            element.title = getObjectText("addLinkToFavorites");
            element.className = 'fa fa-star-o';
        }

        setConfig("favoriteLinks", favoriteLinks);
    });
}

function renderFavoriteLinks(element) {
    var $menu = $(element).siblings('.dropdown-menu');
    $menu.removeAttr('style').html('<li><br/><p class="text-center"><i class="fa-2x fa fa-spinner fa-spin"></i></p></li>');
    getConfig("favoriteLinks").done(function (favoriteLinks) {
        if (favoriteLinks && favoriteLinks.length) {
            $menu.empty();
            $.each(favoriteLinks, function (k, v) {
                $menu.append('<li><a style="padding-right: 25px;" href="#" onclick="redirectToFunction(\'' + v.guid + '\', \'\', (event.ctrlKey || event.which == 2));event.preventDefault();">' + v.title + (v.parent ? ' (' + v.parent + ')' : '') + '<i style="cursor: move; position:absolute; right: 5px; color: #ccc;" class="fa fa-arrows-v"></i></a></li>');
            });
            $menu.kendoSortable({
                axis: "y",
                handler: "i",
                container: $menu,
                hint: function(element) {
                    return element.clone().wrap('<ul class="dropdown-menu" style="display: block; box-shadow: none; border: none;">').parent();
                },
                end: function (e) {
                    getConfig("favoriteLinks").done(function (favoriteLinks) {
                        var link = favoriteLinks[e.oldIndex];
                        favoriteLinks.splice(e.oldIndex, 1);
                        favoriteLinks.splice(e.newIndex, 0, link);
                        setConfig("favoriteLinks", favoriteLinks);
                    });
                }
            });
        } else {
            $menu.html('<li><br/><p class="text-center"><i>' + getObjectText("noFavoritesLinkSet") + '</i></p></li>');
        }
    });
}

function getSisenseLogoutURL() { //clears cookies in iframes and session
    return $.ajax({
        type: "GET",
        url: "/api/RefTreeSSO/GetSisenseLogoutURL"
    })
}