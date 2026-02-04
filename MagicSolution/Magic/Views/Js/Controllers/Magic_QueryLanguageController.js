define(["angular", "MagicSDK"], function (angular, MF) {
    angular
        .module("QueryLanguage", [])
        .controller("QueryLanguageController", [
            '$element',
            '$filter',
            '$timeout',
            function ($element, $filter, $timeout) {
                var self = this,
                    filter = $filter('filter'),
                    $grid,
                    currentlyEditedTextNode,
                    dontRebuildDropMenu = false,
                    spacesBetweenButtons = "&emsp;",
                    $dropMenu = $('<div class="dropdown open remove-on-pagechange dropdown-query-language" tabindex="1">')
                    .on("click", "li", function () {
                        var self = $(this);
                        createTagAtCurrentPosition(self.data("category"), self.data("value"), this.textContent);
                        $dropMenu.hide();
                        $element.focus();
                    })
                    .css({
                        "position": "absolute",
                        "display": "none"
                    });

                var getTagsFromDBCall = MF.api.get({
                    storedProcedureName: "dbo.Magic_QuerySettings",
                    xmlToJson: ["config"]
                })
                .then(
                    function (res) {
                        //self.tags = res[0][0].config;
                        //$.each(self.tags, function (k, v) {
                        //    if (!Array.isArray(v)) {
                        //        self.tags[k] = [v];
                        //    }
                        //});
                        //$.each(self.tags.entity, function (k, v) {
                        //    if (!Array.isArray(v.relations)) {
                        //        v.relations = [v.relations];
                        //    }
                        //    if (!Array.isArray(v.linkedFunctions)) {
                        //        v.linkedFunctions = [v.linkedFunctions];
                        //    }
                        //});
                    },
                    function (res) {
                        kendoConsole.log("Error while retrieving definition from db. Error: " + JSON.stringify(res, null, "   "));
                    }
                );

                self.gridObject = null;

                $("body").append($dropMenu);

                self.stringify = function (json) {
                    return JSON.stringify(json, null, "   ");
                };

                self.init = function () {
                    getTagsFromDBCall.then(function () {
                        $grid = $element.find("#query-result-grid");
                        $element = $element.find("#query-language-tags-container");
                        $element.keydown(handleDropdownKeyInput);
                        $element.on("keyup click focus", handleInput);
                        $element.keydown(checkDeletion);
                        $dropMenu.keydown(handleDropdownKeyInput);
                        $element.focus();
                    });
                };

                self.goTo = function (link) {
                    try{
                        var filters = [],
                            filter = { logic: "or", filters: filters };
                        $.each($grid.data("kendoGrid").dataSource.data(), function (k, v) {
                            filters.push({
                                value: v[link.queryLanguageFilterColumn],
                                field: link.targetTableFilterColumn,
                                operator: "eq"
                            });
                        });
                        $.ajax({
                            url: "/api/Magic_Functions/GetIDFromGUID/" + link.functionGUID,
                            success: function (res) {
                                setSessionStorageGridFilters(link.gridName, res, filter);
                                redirectToFunction(link.functionGUID, null, true);
                            }
                        });
                    }
                    catch (e) {
                        kendoKonsole.log("MagicQueryBuilder: Error on redirecting to function. Error: " + e, true);
                    }
                };

                function getQuery() {
                    var query = [];
                    $element
                        .find("div.btn")
                        .each(function (k, el) {
                            var $el = $(el),
                                index = query.push($el.data()) - 1;
                            $.each($el.find("select, input"), function (k, v) {
                                if (v.type == "checkbox")
                                    query[index][v.name] = v.checked;
                                else
                                    query[index][v.name] = v.value;
                            });
                        });
                    return query;
                }

                self.sendQuery = function () {
                    if (self.hasError())
                        return;
                    self.gridObject = null;
                    $grid.hide();
                    var query = getQuery();
                    MF.api.get({
                        storedProcedureName: "dbo.Magic_QueryParse",
                        data: { query: query }
                    })
                    .then(
                        function (res) {
                            $timeout(function () {
                                self.gridObject = {
                                    toolbar: [{ name: "excel", text: "Excel" }, { name: "pdf", text: "PDF" }],
                                    columns: res.length > 1 && res[1].length ? res[1] : getColumnsOfQuery(query),
                                    pdf: {
                                        allPages: true
                                    },
                                    excel: {
                                        allPages: true
                                    },
                                    dataSource: { data: res[0] }
                                };
                                self.links = res.length > 2 ? res[2] : [];
                                if ($grid.data("kendoGrid"))
                                    $grid.data("kendoGrid").setOptions(self.gridObject);
                                else {
                                    $grid.kendoGrid(self.gridObject);
                                    $grid.click(function () {
                                        $dropMenu.hide();
                                    });
                                }
                                $dropMenu.hide();
                                $grid.show();
                            });
                        },
                        function (res) {
                            kendoConsole.log(res, true);
                        }
                    );
                };

                self.saveExpression = function () {
                    if (self.hasError())
                        return;
                    var name = prompt("Name?"); //TODO: translate, maybe tell user that got not saved
                    if (!name)
                        return;
                    var expression = {
                        query: getQuery(),
                        content: $element.html(),
                        name: name
                    };
                    getConfig("magicQueryLanguageExpressions")
                        .then(function (config) {
                            if (config == null)
                                config = [];
                            config.push(expression);
                            setConfig("magicQueryLanguageExpressions", config)
                                .then(
                                    function (res) {
                                        kendoConsole.log("Expression saved with success!"); //TODO: translate
                                        $timeout();
                                        self.savedExpressions = config;
                                    },
                                    function (res) {
                                        kendoConsole.log("Error while saving expression! Error: " + res, true); //TODO: translate
                                    }
                                );
                        });
                };

                self.getSavedExpressions = function () {
                    getConfig("magicQueryLanguageExpressions")
                        .then(function (config) {
                            self.savedExpressions = config;
                        });
                };

                self.closeDrop = function () {
                    $dropMenu.hide();
                };

                self.setExpression = function (expression) {
                    $element.html(expression.content);
                    $.each($element.find("div.btn"), function (k, v) {
                        var $button = $(v);
                        $button.find("input, select").each(function (kk, vv) {
                            if (vv.name in expression.query[k]) {
                                if(vv.type == "checkbox")
                                    vv.checked = toBoolean(expression.query[k][vv.name]);
                                else
                                    vv.value = expression.query[k][vv.name];
                            }
                        });
                        if($button.data("category") == "entity")
                        {
                            if ("columns" in expression.query[k])
                                $button.data("columns", expression.query[k].columns);
                        }
                    });
                };

                self.deleteExpression = function (index) {
                    if (!confirm("Are you sure to delete: " + self.savedExpressions[index].name)) //TODO: translate
                        return;
                    getConfig("magicQueryLanguageExpressions")
                        .then(function (config) {
                            config.splice(index, 1);
                            setConfig("magicQueryLanguageExpressions", config)
                                .then(
                                    function (res) {
                                        kendoConsole.log("Expression deleted with success!"); //TODO: translate
                                        $timeout(function () {
                                            self.savedExpressions = config;
                                        });
                                    },
                                    function (res) {
                                        kendoConsole.log("Error while deleteing expression! Error: " + res, true); //TODO: translate
                                    }
                                );
                        });
                };

                function getTagByValue(value, category) {
                    return filter(self.tags[category], { value: value }, true)[0];
                }

                self.categories = {
                    "entity": {
                        label: "Entities",
                        "background-color": "#dff0d8",
                        color: "#3c763d",
                        follows: [
                            "$start",
                            "entity"
                        ],
                        button: function (label, value) {
                            var previousValues = getCurrentButtonPreviousButtonValues("entity");
                            if (previousValues.length)
                                return label + ' <input name="INNER_JOIN" type="checkbox" title="dont show empty values for this relation" value="true" onclick="event.stopPropagation()" />'; //TODO: translate
                            return label;
                        },
                        buttonClick: function (value, $button) {
                            var html = "",
                                selectedColumns = $button.data("columns") || "",
                                columns = getTagByValue(value, "entity").columns;
                            selectedColumns = selectedColumns.split(",");
                            $.each(columns, function (k, v) {
                                html += '<label><input type="checkbox" name="' + v.value + '"' + (selectedColumns.indexOf(v.value) > -1 ? ' checked="checked"' : "") + ' />' + v.label + '</label>';
                            });
                            var $modalContent = showModal({
                                title: "Select columns", //TODO: translate
                                content: html,
                                footer: $('<div class="btn btn-success"><i class="fa fa-floppy-o" aria-hidden="true"></i></div>')
                                            .click(function () {
                                                var formColumns = getHTMLFormData($modalContent),
                                                    columnsArray = [];
                                                $.each(formColumns, function (k, v) {
                                                    if (v)
                                                        columnsArray.push(k);
                                                });
                                                if (columns.length == columnsArray.length) {
                                                    $button.css("text-decoration", "none");
                                                    $button.removeData("columns");
                                                }
                                                else {
                                                    $button.css("text-decoration", "underline");
                                                    $button.data("columns", columnsArray.join());
                                                }
                                                hideModal();
                                            })
                            });
                        }
                    },
                    "condition": {
                        label: "Conditions",
                        "background-color": "#fcf8e3",
                        color: "#8a6d3b",
                        follows: [
                            "entity",
                            "conjunction"
                        ],
                        button: function (label, value) {
                            return '<span class="inline-from">' + getColumnSelectFromSetEntities() + ' ' + label + ' <input name="sign" value="' + value + '" style="display:none" /><input name="value" contenteditable="false" class="form-control" type="text" /></span>';
                        }
                    },
                    "conjunction": {
                        label: "Conjunctions",
                        "background-color": "#fcf8e3",
                        color: "#8a6d3b",
                        follows: [
                            "condition",
                        ]
                    },
                    "group": {
                        label: "Grouping",
                        "background-color": "#dff0d8",
                        color: "#3c763d",
                        follows: [
                            "condition",
                            "entity",
                            "group"
                        ],
                        button: function (label, value) {
                            return '<span class="inline-from">' + label + getColumnSelectFromSetEntities() + '</span>';
                        }
                    },
                    "aggregation": {
                        label: "Aggregations",
                        "background-color": "#d9edf7",
                        color: "#31708f",
                        follows: [
                            "group",
                            "condition",
                            "entity",
                            "aggregation"
                        ],
                        button: function (label, value) {
                            return '<span class="inline-from">' + label + getColumnSelectFromSetEntities() + '</span>';
                        }
                    },
                };

                self.tags = {
                    "entity": [
                        {
                            label: "Assets",
                            value: "AS_ASSET_ASSETS",
                            relations: [
                                "DO_DOCUME_DOCUMENTI"
                            ],
                            columns: [
                                { label: "Description", value: "AS_ASSET_ASSETS_Description" },
                                { label: "Address", value: "AS_ASSET_ASSETS_Address" },
                                { label: "Color", value: "AS_ASSET_ASSETS_Color" },
                            ]//,
                            //linkedFunctions: [
                            //    {
                            //        queryLanguageFilterColumn: "",
                            //        targetTableFilterColumn: "",
                            //        functionId: 1,
                            //        linkLabel: "",
                            //        gridName: ""
                            //    }
                            //]
                        },
                        {
                            label: "Documenti",
                            value: "DO_DOCUME_DOCUMENTI",
                            relations: [],
                            columns: [
                                { label: "Description", value: "DO_DOCUME_DOCUMENTI_DESCR" },
                                { label: "Title", value: "DO_DOCUME_DOCUMENTI_TLT" },
                            ]
                        }
                    ],
                    "condition": [
                        { label: "Equals", value: "=" },
                        { label: "Not equals", value: "<>" }
                    ],
                    "conjunction": [
                        { label: "and", value: "AND" },
                        { label: "or", value: "OR" }
                    ],
                    "group": [
                        { label: "group by", value: "GROUP BY" },
                    ],
                    "aggregation": [
                        { label: "show minimum of", value: "MIN" },
                        { label: "show maximum of", value: "MAX" },
                    ],
                };

                function getColumnsOfQuery(query) {
                    var columns = [];
                    for (var i = 0; i < query.length; i++) {
                        if (query[i].category == "entity") {
                            $.each(filter(self.tags.entity, { value: query[i].value }, true)[0].columns, function (k, v) {
                                columns.push({ field: v.value, title: v.label });
                            });
                        }
                        else
                            break;
                    }
                    return columns;
                }

                function handleInput(e) {
                    if (dontRebuildDropMenu) {
                        dontRebuildDropMenu = false;
                        return;
                    }
                    if (e && e.target && e.target != $element[0]) {
                        $dropMenu.hide();
                        return;
                    }
                    var range = window.getSelection();
                    if (range.rangeCount)
                        range = range.getRangeAt(0);
                    else
                        return;
                    currentlyEditedTextNode = range.endContainer;
                    var searchTerm = range.endContainer.nodeValue,
                        lastTagType = getLastTagCategory(range.endContainer),
                        searchResults = getSearchResults(searchTerm, lastTagType);

                    if (searchResults.length) {
                        if (searchResults.length == 1 && searchResults[0].items.length == 1 && searchTerm && searchTerm.trim() == searchResults[0].items[0].label) {
                            createTagAtCurrentPosition(searchResults[0].categoryName, searchResults[0].items[0].value, searchResults[0].items[0].label);
                            handleInput();
                            return;
                        }
                        var offset;
                        if (range.endContainer == $element[0] && range.endOffset != 0) {
                            var child = Math.ceil(range.endOffset / 2 - 1),
                            children = $element.children();
                            if (child >= children.length)
                                child = children.length - 1;
                            offset = children.eq(child).offset();
                        }
                        else {
                            var $cursorElement = $(range.endContainer.previousElementSibling || range.endContainer.parentElement);
                            offset = $cursorElement.offset();
                        }
                        $dropMenu
                            .html(createMenu(searchResults))
                            .css({
                                top: (offset.top + 35)  + "px",
                                left: (offset.left + 35) + "px"
                            })
                            .show(100);
                    }
                    else
                        $dropMenu.hide();
                }

                function createMenu(results) {
                    var content = '<ul class="dropdown-menu">';
                    $.each(results, function (key, categoryResults) {
                        content += '<div class="dropdown-header">' + categoryResults.categoryLabel + '</div>';
                        $.each(categoryResults.items, function (key, item) {
                            content += '<li data-category="' + categoryResults.categoryName + '" data-value="' + item.value + '"><a href="#">' + item.label + '</a></li>';
                        });
                    });
                    content += '</ul>';
                    $dropMenu.removeData("selectionIndex");
                    $dropMenu.html(content);
                }

                function getCurrentButtonPreviousButtonValues(category, el) {
                    return $(el || currentlyEditedTextNode).prevAll("div.btn[data-category=" + category + "]").map(function () { return $(this).data("value"); }).get();
                }

                function getSearchResults(searchTerm, lastCategory) {
                    var results = [];
                    if (searchTerm) {
                        searchTerm = searchTerm.trim();
                    }
                    $.each(self.categories, function (categoryName, category) {
                        if (category.follows.indexOf(lastCategory) != -1) {
                            var items;
                            if (searchTerm)
                                items = filter(self.tags[categoryName], { label: searchTerm });
                            else
                                items = self.tags[categoryName].slice(0);
                            if (items.length) {
                                if (items[0].relations) {
                                    var tagValues = getCurrentButtonPreviousButtonValues(categoryName),
                                        allowedValues = {};
                                    if (tagValues.length) {
                                        $.each(self.tags[categoryName], function (k, v) {
                                            if (v.relations && tagValues.indexOf(v.value) != -1) {
                                                v.relations.map(function (v) {
                                                    allowedValues[v] = null;
                                                });
                                            }
                                        });
                                        $.each(tagValues, function (k, v) {
                                            delete allowedValues[v];
                                        });
                                    }
                                    if (!$.isEmptyObject(allowedValues)) {
                                        var i = 0;
                                        while (i < items.length) {
                                            if (!(items[i].value in allowedValues))
                                                items.splice(i, 1);
                                            else
                                                i++;
                                        }
                                    }
                                    else if (tagValues.length) {
                                        items = [];
                                    }
                                }
                                if(items.length)
                                    results.push({ categoryName: categoryName, categoryLabel: category.label, items: items });
                            }
                        }
                    });
                    return results;
                }

                function getLastTagCategory (el){
                    if (el.previousElementSibling) {
                        return $(el.previousElementSibling).data("category");
                    }
                    return "$start";
                }

                function setCaretPosition(elem) {
                    var range = document.createRange();
                    var sel = window.getSelection();
                    for (var i = $element[0].childNodes.length; i >= 0; --i) {
                        if (elem == $element[0].childNodes[i]) {
                            elem = $element[0].childNodes[++i];
                            break;
                        }
                    }
                    range.setStart(elem, 1);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }

                function createTagAtCurrentPosition(category, value, label) {
                    var $button = createButton(category, value, label);
                    if (self.categories[category]["background-color"])
                        $button.css("background-color", self.categories[category]["background-color"]);
                    if (self.categories[category]["color"])
                        $button.css("color", self.categories[category]["color"]);
                    if ($element[0] != currentlyEditedTextNode) {
                        var $textNode = $(currentlyEditedTextNode);
                        $button.insertAfter($textNode);
                        $textNode.remove();
                    }
                    else {
                        $element.append($button);
                    }
                    $button.before(spacesBetweenButtons);
                    $button.after(spacesBetweenButtons);
                    setCaretPosition($button[0]);
                }

                function createButton(category, value, label) {
                    var customHTML = "";
                    if (self.categories[category].button) {
                        customHTML = self.categories[category].button(label, value);
                    }
                    var $button = $('<div data-category="' + category + '" data-value="' + value + '" data-created="' + Date.now() + '" class="btn btn-success" contenteditable="false">' + (customHTML || label) + '</div>');
                    if (self.categories[category].buttonClick)
                        $button.click(function () { self.categories[category].buttonClick(value, $button) });
                    return $button;
                }

                function checkDeletion(e) {
                    switch (e.keyCode) {
                        case 8:
                        case 46:
                            var range = window.getSelection(),
                                removed = false;
                            if (range.rangeCount) {
                                range = range.getRangeAt(0);
                                if (e.keyCode == 8) {
                                    if (range.startContainer.previousSibling != null && range.startContainer.previousSibling.nodeName.toLowerCase() == "div" && !/\S/.test(range.startContainer.wholeText)) {
                                        $(range.startContainer.previousSibling).remove();
                                        removed = true;
                                    }
                                }
                                else {
                                    if (range.startContainer.nextSibling != null && range.startContainer.nextSibling.nodeName.toLowerCase() == "div" && !/\S/.test(range.startContainer.wholeText)) {
                                        $(range.startContainer.nextSibling).remove();
                                        removed = true;
                                    }
                                }
                            }
                            if(removed)
                                return;
                            
                            setTimeout(function () {
                                var $tags = $element.find("div.btn"),
                                    $button = null;
                                if ($tags.length) {
                                    $tags.each(function (k, v) {
                                        if (v.previousSibling == null || v.previousSibling.nodeName.toLowerCase() == "div") {
                                            $button = $(this).before(spacesBetweenButtons);
                                        }
                                        if (v.nextSibling == null || v.nextSibling.nodeName.toLowerCase() == "div") {
                                            $button = $(this).after(spacesBetweenButtons);
                                        }
                                    });
                                }
                                if ($button) {
                                    setCaretPosition($button[0]);
                                    handleInput();
                                }
                            });
                            break;
                    }
                }

                function handleDropdownKeyInput(e) {
                    var action = null;
                    switch (e.keyCode) {
                        case 38:
                            //case 37:
                            action = -1;
                            break;
                        case 40:
                            //case 39:
                            action = 1;
                            break;
                        case 13:
                            action = "enter";
                            break;
                    }
                    if (action === null)
                        return;
                    e.preventDefault();
                    dontRebuildDropMenu = true;
                    var selectedLi = $dropMenu.data("selectionIndex") === undefined ? -1 : $dropMenu.data("selectionIndex"),
                        $lis = $dropMenu.find("li");
                    if (action == "enter") {
                        $lis.eq(selectedLi).click();
                        $element.focus();
                    }
                    else {
                        $lis.eq(selectedLi).removeClass("super-active");
                        selectedLi += action;
                        if (selectedLi < 0)
                            selectedLi = $lis.length - 1;
                        else
                            selectedLi %= $lis.length;
                        $lis.eq(selectedLi).addClass("super-active");
                        $dropMenu.data("selectionIndex", selectedLi);
                    }
                }

                function checkError() {
                    var error = false,
                        relations,
                        $btns = $element
                                    .find("div.btn");
                    if ($btns.length == 0)
                        return true;
                    $btns.each(function (k, el) {
                        var lastCategory = getLastTagCategory(el),
                            $el = $(el),
                            category = $el.data("category");
                        if (self.categories[category].follows.indexOf(lastCategory) < 0) {
                            errorAt($el);
                            error = true;
                            return false;
                        }
                        else if (category == lastCategory && (relations = filter(self.tags[lastCategory], { value: $el.prev("div.btn").data("value") }, true)[0].relations)) {
                            if (relations.indexOf($el.data("value")) < 0) {
                                errorAt($el);
                                error = true;
                                return false;
                            }
                        }
                    });
                    if (!error)
                        clearErrors();
                    return error;
                }

                self.hasError = function () {
                    var error = checkError();
                    if (error)
                        kendoConsole.log("MagicQueryLanguage: Not valid query", "warning");
                    return error;
                }

                function errorAt($el) {
                    $el.css("border", "2px solid red");
                }

                function clearErrors() {
                    $element
                        .find("div.btn")
                        .css("border", "none");
                }

                function getColumnSelectFromSetEntities() {
                    var previousValues = getCurrentButtonPreviousButtonValues("entity"),
                        options = "";
                    $.each(previousValues, function (k, v) {
                        var entity = filter(self.tags["entity"], { value: v }, true)[0];
                        options += '<optgroup label="' + entity.label + '">';
                        $.each(entity.columns, function (k, v) {
                            options += '<option value="' + entity.value + '.' + v.value + '">' + v.label + '</option>';
                        });
                        options += '</optgroup>';
                    });
                    return '<select name="column" class="form-control">' + options + '</select>';
                }
        }]);

    return function () {
        var element = $("#grid").html('<div ng-controller="QueryLanguageController as q"><div ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/QueryLanguage.html\'" onload="q.init()"></div></div>')[0];
        angular.bootstrap(element, ["QueryLanguage"]);
    }
});