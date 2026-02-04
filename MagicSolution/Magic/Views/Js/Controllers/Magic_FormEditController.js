(function() {
    var angular;

    define(["angular", "angular-kendo", "angular-filter", "MagicSDK", "angular-magic-grid", "angular-magic-form", "jQueryUI", "lodash", "gridstack", "gridstack-angular"], function(a) {
        angular = a;
        var app = controller.apply({}, arguments);
        app.value("config", {});
        return init;
    });

    loadCss(["gridstack"], window.includesVersion + "/Magic/v/2018.1.0.0/Styles/3rd-party/gridstack/");

    function init() {
        var element = getAngularControllerRootHTMLElement("FormEdit");
        $("#grid").html(element);
        angular.bootstrap(element, ["FormEdit"]);
    }

    function controller(angular) {
        return angular
            .module("FormEdit", ["kendo.directives", "angular.filter", "magicGrid", "gridstack-angular", "magicForm"])
            .controller("FormEditController", ["$scope", "$http", "$filter", "$timeout", function ($scope, $http, $filter, $timeout) {

                var self = this;
                self.singleWidgetTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/form-editor-single-widget.html";
                self.editableGridstackTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/form-editor-editable-gridstack.html";
                var textResources = {
                    en: {
                        saveTitle: 'Save Form-Layout',
                        resetLayout: 'Reset Form-Layout',
                        saveModalText: 'The old Form-Layout will be overwritten and cannot be restored. Do you want to continue?',
                        saved: 'Succesfully saved!',
                        dbError: 'Error while trying to save layout-data.',
                        applyLayout: 'Apply this layout',
                        in: 'in:',
                        applyLayoutInMagicForm: 'MagicForm & MagicWizard',
                        applyLayoutInKendoPopup: 'MagicGrid-PopUp',
                        addEmptyRow: 'Add empty row',
                        layoutContainsEmptyRows: 'There are empty rows specified in current layout. Please remove them in order to continue saving!',
                    },
                    it: {},
                    de: {}
                };
                //language
                self.text = textResources.en;
                self.mainGridInstance = {};
                self.mainGridVisible = true;
                self.Layout = [];
                self.layoutChangesMade = false;
                self.layoutInitialized = false;
                self.renderMagicGrid = false;
                self.renderMagicForm = false;
                self.initialized = false;
                self.itemsPerRow = -1;
                self.formData = null;

                self.isApplied = true;
                self.isMagicFormLayout = true;
                self.isKendoPopupLayout = false;

                //defaults
                self.defaultItemsPerRow = 1;
                self.textareaMinNumberOfRows = 2;    //#formedit #numberOfTextareaRows
                self.textareaDefaultNumberOfRows = 3;
                self.textareaMaxNumberOfRows = 17;
                self.textareasWithSpecifiedNumberOfRows = {};

                self.fieldsWithLabelCSS = {}; //#label font
                self.defaultLabelCSS = {    //#labelCSS
                    fontWeight: "400",
                    fontStyle: "normal",
                    color: "#000000",
                    backgroundColor: "#FFFFFF",
                }

                self.toggleView = function (e) {
                    self.mainGridVisible = false;
                    self.dataOfRow = self.mainGridInstance.dataItem(e.currentTarget.closest("tr"));
                    self.magicGridName = getMagicGridName();
                    self.renderMagicGrid = true;
                    $timeout();
                };
                onMagicFormRendered = function (ui, tabs, form) {
                    let deepCopy = $.extend(true, {}, form[0].items[0].tabs);
                    if (!self.layoutInitialized) {
                        init(-1, deepCopy);     //-->3
                    }
                };
                self.magicFormOptions = { //keep this below onMagicFormRendered()
                    renderDone: onMagicFormRendered,
                };
                getMagicGridName = function () {   //1
                    var vals = self.mainGridInstance.dataSource.options.fields.filter(x => x.field == "MagicGrid_ID")[0].values;
                    var magicGridID = self.dataOfRow.MagicGrid_ID.toString();
                    var result = vals.find(obj => {
                        return obj.value === magicGridID;
                    });
                    getItemsPerRow(magicGridID);
                    getFormEditData(result.text);
                    return result.text;
                };
                getItemsPerRow = function (magicGridId) {   //2
                    $http.get("api/MAGIC_GRIDS/GetGridLayoutData/", {    //GET EditFormData
                        params: { magicgridid: magicGridId }
                    }).then(function (response) {
                        let data = response.data[0];
                        init(data.EditFormColumnNum || self.defaultItemsPerRow, null);    // -->3
                    });
                };
                getFormEditData = function (gridname) {
                    $.get("api/MAGIC_GRIDS/GetEditFormData/", { magicgridname: gridname }).then(function (response) {
                        var parsed = JSON.parse(response);
                        $.each(parsed, function (i, p) {
                            if (p.MagicFormExtension) {
                                try {
                                    p.MagicFormExtension = JSON.parse(p.MagicFormExtension);
                                } catch (e) {
                                    p.MagicFormExtension = JSON.parse(p.MagicFormExtension.replace(/(?:\\[rn])+/g, ""));
                                }
                                setVisibilityProps(p.MagicFormExtension);
                                setupTextareasWithSpecifiedNumberOfRows(p);
                                if (p.MagicFormExtension.hasCustomCSS) {
                                    setupFieldsWithLabelCSS(p.MagicFormExtension, p.ColumnName);
                                }


                            }
                        });
                    });
                }
                setVisibilityProps = function (mfExtension) {

                    if (mfExtension.isMagicFormLayout && mfExtension.isMagicFormLayout === true) {
                        self.isMagicFormLayout = true;
                    } else {
                        self.isMagicFormLayout = false;
                    }
                    if (mfExtension.isKendoPopupLayout && mfExtension.isKendoPopupLayout === true) {
                        self.isKendoPopupLayout = true;
                    } else {
                        self.isKendoPopupLayout = false;
                    }
                    if (mfExtension.isApplied && mfExtension.isApplied === true) {
                        self.isApplied = true;
                    } else {
                        self.isApplied = false;
                    }
                    if (!self.isMagicFormLayout && !self.isKendoPopupLayout) {
                        self.isApplied = false;
                    }
                }
                setupTextareasWithSpecifiedNumberOfRows = function (conf) {
                    if (conf.MagicFormExtension.numberOfRows) {
                        self.textareasWithSpecifiedNumberOfRows[conf.ColumnName] = conf.MagicFormExtension.numberOfRows;
                    }
                }
                setupFieldsWithLabelCSS = function (field, fieldName) {

                    self.fieldsWithLabelCSS[fieldName] = {
                        fontSize: field.fontSize,
                        fontWeight: field.fontWeight,
                        fontStyle: field.fontStyle,
                        fontVariantCaps: field.fontVariantCaps,
                        color: field.color,
                        backgroundColor: field.backgroundColor,
                        backgroundTransparent: field.backgroundTransparent,
                        shadow: field.shadow,
                        shadowActive: field.shadowActive,
                        shadowX: field.shadowX,
                        shadowY: field.shadowY,
                        shadowBlur: field.shadowBlur,
                        shadowColor: field.shadowColor,
                        textDecorationLine: field.textDecorationLine || 'none',
                        textDecorationStyle: field.textDecorationStyle || 'solid',
                        textDecorationColor: field.textDecorationColor || '#000000',
                    };
                }
                self.onTextareaNumberOfRowsChanged = function (item) {
                    if (!item.numberOfRows || typeof item.numberOfRows == 'undefined') {
                        item.numberOfRows = self.textareaMinNumberOfRows;
                        kendoConsole.log("The mininmum number of textarea-rows is " + self.textareaMinNumberOfRows + ".");
                    }
                    self.textareasWithSpecifiedNumberOfRows[item.tag] = item.numberOfRows;
                    self.layoutChangesMade = true;
                }                
                init = function (itemsPerRow, formData) {   //3
                    if (itemsPerRow > 0) {
                        self.itemsPerRow = itemsPerRow;
                        self.magicFormOptions.itemsPerRow = itemsPerRow;
                        self.renderMagicForm = true;
                        $timeout();
                    }
                    if (formData != null) {
                        self.formData = formData;
                    }
                    if (self.itemsPerRow > 0 && self.formData != null) {    //<magic-form> rendered
                        self.Layout = initLayout(self.formData);    //-->4
                        self.layoutInitialized = true;
                        $timeout();

                        $timeout(function () {
                            $.each(self.fieldsWithLabelCSS, function (tag, styles) {
                                var $label = $('[name="' + tag + '_tag"]');
                                if ($label) {
                                    applyLabelCssOnElement(styles, $label);
                                }
                            });
                        }, 500);     //-->renderLayout
                    }
                }
                initLayout = function (tabs) {      //4
                    self.initialized = true;
                    let newLayout = [];
                    $.each(tabs, function (i, tab) {
                        let newTab = initTab(tab, i);      //-->5
                        newLayout.push(newTab);
                        if (i == 0 && newTab.hasSubTabs === false) { //set tab as initial self.activeTab
                            self.activeTab = newTab;
                        }
                    });
                    return newLayout;   //<--3
                };
                initTab = function (rawTab, rawTabIdx) {      //5
                    let tab = new Tab(rawTab.title);
                    if (rawTab.hasSubTabs === false) {
                        tab.hasSubTabs = false;
                        tab.rows = initRows(rawTab.items, tab);     //-->6
                    } else if (rawTab.items[0].type == 'tabs') {
                        // init subtabs
                        tab.hasSubTabs = true;
                        tab.subTabs = [];
                        $.each(rawTab.items[0].tabs, function (subTabIdx, subtab) {
                            let sTab = new Tab(subtab.title);
                            sTab.isSubTab = true;
                            sTab.rows = initRows(subtab.items, sTab);     //-->6
                            tab.subTabs.push(sTab);
                            if (rawTabIdx == 0) { //set subtab as initial self.activeTab
                                self.activeTab = subtab;
                            }
                        });
                    }
                    return tab;
                };
                initRows = function (rawRows, parentTab) {      //6
                    let rows = [];
                    $.each(rawRows, function (i, row) {
                        let newRow = new Row(i);
                        let rowItems = [];
                        let xPrev = 0;
                        let wPrev = 0;
                        $.each(row.items, function (itemIndex, section) {
                            let sectionData = section.items[0];
                            let itm = new Item(sectionData.key[0], sectionData.type, itemIndex, sectionData.editFormClass, xPrev, wPrev);
                            xPrev = itm.x;
                            wPrev = itm.width;
                            rowItems.push(itm);
                        });
                        newRow.items = rowItems;
                        newRow.height = getRowHeight(newRow.items);
                        rows.push(newRow);
                    });
                    return rows;
                };
                function Item(tag, type, posInRow, editFormClass, xPrev, wPrev) {
                    this.tag = tag;
                    this.type = type;
                    this.height = getItemHeight(this.type);
                    this.position = posInRow;
                    this.uid = uid();
                    if (editFormClass) {
                        this.bootstrapClass = editFormClass;
                        this.width = getWidthFromBootstapClass(this.bootstrapClass);
                        this.x = wPrev + xPrev + getXPosFromBootstrapClass(this.bootstrapClass, this.position);
                    } else {
                        this.bootstrapClass = "";
                        this.width = getWidth();
                        this.x = this.width * this.position;
                    }

                    if (this.type == 'textarea') { //#formedit #numberOfTextareaRows
                        this.numberOfRows = self.textareasWithSpecifiedNumberOfRows[tag] || self.textareaDefaultNumberOfRows;
                    }

                    if (self.fieldsWithLabelCSS[tag]) {
                        let labelCSS = self.fieldsWithLabelCSS[tag];

                        this.fontSize = labelCSS.fontSize ? labelCSS.fontSize : 14;
                        this.fontWeight = labelCSS.fontWeight ? labelCSS.fontWeight : self.defaultLabelCSS.fontWeight;
                        this.fontStyle = labelCSS.fontStyle ? labelCSS.fontStyle : self.defaultLabelCSS.fontStyle;
                        this.fontVariantCaps = labelCSS.fontVariantCaps ? labelCSS.fontVariantCaps : self.defaultLabelCSS.fontStyle;

                        this.color = labelCSS.color ? labelCSS.color : self.defaultLabelCSS.color;
                        this.backgroundColor = labelCSS.backgroundColor ? labelCSS.backgroundColor : self.defaultLabelCSS.backgroundColor;
                        this.backgroundTransparent = labelCSS.backgroundColor ? false : true;

                        this.shadow = labelCSS.shadow ? labelCSS.shadow : "";
                        this.textDecorationLine = labelCSS.textDecorationLine ? labelCSS.textDecorationLine : "none";
                        this.textDecorationStyle = labelCSS.textDecorationStyle ? labelCSS.textDecorationStyle : "solid";
                        this.textDecorationColor = labelCSS.textDecorationColor ? labelCSS.textDecorationColor : "#000000";
                    }

                }
                function Row(rowIdx) {
                    this.items = [];
                    this.position = rowIdx;
                    this.height = 1;
                    this.uid = uid();
                };
                function Tab(title, rows, subTabs, hasSubTabs) {
                    this.uid = uid();
                    this.title = title;
                    this.rows = rows;
                    this.subTabs = subTabs;
                    this.hasSubTabs = hasSubTabs;
                };
                getItemHeight = function (type) {
                    let height = 1;
                    if (type == 'textarea') {
                        height = 3;
                    }
                    return height;
                };
                getRowHeight = function (items) {
                    let height = 1;
                    $.each(items, function (i, item) {
                        if (item.type == 'textarea') {
                            height = 3;
                        }
                    })
                    return height;
                };
                getWidthFromBootstapClass = function (bootstrapClass) {
                    let n = bootstrapClass.indexOf("-offset");
                    let substr = bootstrapClass.substr(0, n);
                    substr = substr.replace(" ", "-");
                    let splittedByDashs = bootstrapClass.split('-');
                    return (parseInt(splittedByDashs[2]));
                };
                getXPosFromBootstrapClass = function (bootstrapClass) { //getOffset         
                    let n = bootstrapClass.indexOf("offset");
                    let substr = bootstrapClass.substring(n, bootstrapClass.length);
                    let splittedSubstr = substr.split('-');
                    return parseInt(splittedSubstr[splittedSubstr.length - 1]);
                };
                self.moveItem = function (item, fromRow, direction) {
                    self.layoutChangesMade = true;

                    let fromWidgets = fromRow.items;
                    let toWidgets;

                    if (direction == 'up') {
                        let rowsAbove = $.grep(self.activeTab.rows, function (row) { return row.position < fromRow.position });
                        let toPosition = Math.max.apply(Math, rowsAbove.map(function (o) { return o.position; }));
                        toWidgets = $.grep(rowsAbove, function (row) { return row.position == toPosition })[0].items;
                    } else if (direction == 'down') {   
                        let rowsBelow = $.grep(self.activeTab.rows, function (row) { return row.position > fromRow.position });
                        let toPosition = Math.min.apply(Math, rowsBelow.map(function (o) { return o.position; }));
                        toWidgets = $.grep(rowsBelow, function (row) { return row.position == toPosition })[0].items;
                    }

                    let spliceIdx = fromWidgets.indexOf(item);

                    fromWidgets.splice(spliceIdx, 1);               //remove from old row
                    toWidgets.push(item);                         //add to new row

                    arrangeWidgetsOrder(fromWidgets, toWidgets, item, direction);

                    resizeWidgets(toWidgets);
                    arrangeToWidgetsPositions(toWidgets, item, direction);

                    $.each(fromWidgets, function (i, wdgt) {   //make sure that fromWidgets have the correct positions
                        let wdgtNode = $('#' + wdgt.uid);
                        let gsNode = wdgtNode.closest('.grid-stack');
                        let gridstack = gsNode.data('gridstack');
                        gridstack.move(wdgtNode, wdgt.x, wdgt.y);
                    });
                };
                arrangeWidgetsOrder = function (fromWidgets, toWidgets, modifiedWidget, direction) {
                    if (direction == 'up') {
                        $.each(fromWidgets, function (i, wdgt) {
                            wdgt.position -= 1;
                            wdgt.y = 0;
                        });
                        modifiedWidget.position = toWidgets.length - 1;
                    } else if (direction == 'down') {
                        $.each(toWidgets, function (i, wdgt) {
                            wdgt.position += 1;
                        });
                        modifiedWidget.position = 0;
                    }
                };
                arrangeToWidgetsPositions = function (widgetRow, addedWidget, direction) {
                    if (direction == 'up') {
                        $.each(widgetRow, function (i, wdgt) {
                            wdgt.x = wdgt.position * wdgt.width;
                            wdgt.y = 0;
                            let wdgtNode = $('#' + wdgt.uid);
                            let gsNode = wdgtNode.closest('.grid-stack');
                            let gridstack = gsNode.data('gridstack');
                            gridstack.move(wdgtNode, wdgt.x, wdgt.y);
                        });
                    } else if (direction == 'down') {
                        for (let i = widgetRow.length - 1; i > -1; i--) {
                            let wdgt = widgetRow[i];
                            wdgt.x = wdgt.position * wdgt.width;
                            wdgt.y = 0;

                            let wdgtNode = $('#' + wdgt.uid);
                            let gsNode = wdgtNode.closest('.grid-stack');
                            let gridstack = gsNode.data('gridstack');
                            gridstack.move(wdgtNode, wdgt.x, wdgt.y);
                        }
                        addedWidget.x = 0;
                        addedWidget.y = 0;
                    }
                };
                resizeWidgets = function (widgetRow) {      //fits widgets in row >>> widget.width modified
                    let numOfRowWidgets = widgetRow.length;
                    let newWidth = -1;
                    switch (numOfRowWidgets) {
                        case 1:
                            newWidth = 12;
                            break;
                        case 2:
                            newWidth = 6;
                            break;
                        case 3:
                            newWidth = 4;
                            break;
                        case 4:
                            newWidth = 3;
                            break;
                        case 5:
                            newWidth = 2;
                            break;
                        case 6:
                            newWidth = 2;
                            break;
                        default:
                            newWidth = 1;
                            break;
                    }

                    if (newWidth > 0) {
                        $.each(widgetRow, function (i, wdgt) {
                            wdgt.width = newWidth;
                            let wdgtNode = $('#' + wdgt.uid);
                            let gsNode = wdgtNode.closest('.grid-stack');
                            let gridstack = gsNode.data('gridstack');
                            gridstack.resize(wdgtNode, wdgt.width, wdgt.height);
                        });
                    }
                };
                self.activeTab = null;
                self.renderSubTabs = true;
                self.onTabClicked = function (tab) {
                    if (!tab.hasSubTabs || tab.isSubTab) {
                        self.activeTab = tab;
                    }
                }
                self.addEmptyRow = function () {
                    let maxPosition = Math.max.apply(Math, self.activeTab.rows.map(function (o) { return o.position; }))
                    let emptyRow = new Row(maxPosition + 1);
                    self.activeTab.rows.push(emptyRow);
                }
                self.removeRow = function (row, tab, subtab) {
                    self.activeTab.rows.splice(self.activeTab.rows.indexOf(row), 1);
                    $.each(self.activeTab.rows, function (i, row) {
                        row.position = i;
                    });
                    if (subtab) {
                        tab.hasSubTabs = false;
                        $timeout(function () {
                            tab.hasSubTabs = true;
                        }, 0);
                    }
                }
                self.save = function () {
                    setupSaveLayout();
                    if (self.layoutContainsEmptyRows) {
                        kendoConsole.log(self.text.layoutContainsEmptyRows, 'danger' );
                        return;
                    }
                    addVisibilityAttributes();
                    rebuildGenericModal();
                    $('#contentofmodal').text(self.text.saveModalText);
                    $("#wndmodalContainer").modal('show');
                    $("#executesave").click(function () {
                        doModal(true);
                        if ($("#executesave").attr("clicked"))
                            return;
                        $("#executesave").attr("clicked", true);
                        postLayoutDataToDB(self.FieldsToSave)
                            .then(function (response) {
                                // Request completed successfully                                                          
                                if (response.data) {
                                    $("#executesave").attr("clicked", false);
                                    $("#wndmodalContainer").modal('hide');
                                    doModal(false);
                                    kendoConsole.log(self.text.saved, "success");

                                    self.layoutInitialized = false;
                                    self.renderMagicForm = false;
                                    self.renderMagicGrid = false;
                                    $timeout(function () {
                                        self.renderMagicGrid = true;
                                        self.renderMagicForm = true;
                                        self.layoutChangesMade = false;
                                        $timeout();
                                    }, 1);
                                } else {
                                    kendoConsole.log(self.text.dbError, "error");
                                    return;
                                }
                            })
                            .catch(function (err) {
                                $("#executesave").attr("clicked", false);
                                $("#wndmodalContainer").modal('hide');
                                doModal(false);
                                kendoConsole.log(err, "error");
                            });
                    });
                }
                postLayoutDataToDB = function (layoutData) {
                    let reqData = {
                        MagicGridId: self.dataOfRow.MagicGrid_ID,
                        MagicGridName: self.magicGridName,
                        LayoutData: layoutData
                    }
                    return $http.post("api/MAGIC_GRIDS/RefreshFormEditPagesData", reqData);
                }
                function Field(rowIdx, rowPos, width, offset, name, x, numberOfTextareRows , fontWeight, fontStyle, fontVariantCaps, color, backgroundColor, backgroundTransparent, fontSize, shadow, textDecorationLine, textDecorationStyle, textDecorationColor) {
                    this.row = rowIdx;
                    this.positionInRow = rowPos;
                    this.widthClass = width;
                    this.offsetClass = offset;
                    this.bootstrapClass = width + " " + offset;
                    this.name = name;
                    this.x = x;

                    if (numberOfTextareRows) {
                        this.numberOfRows = numberOfTextareRows;
                    }

                    this.fontSize = fontSize
                    this.fontWeight = fontWeight;
                    this.fontStyle = fontStyle;
                    this.fontVariantCaps = fontVariantCaps;
                    this.color = color;
                    if (!backgroundTransparent) {
                        this.backgroundColor = backgroundColor;
                    } else {
                        this.backgroundColor = '';
                    }
                    if (shadow) {
                        this.shadow = shadow;
                    }

                    if (textDecorationLine && textDecorationLine != 'none') {
                        this.textDecorationLine = textDecorationLine;
                        this.textDecorationStyle = textDecorationStyle;
                        this.textDecorationColor = textDecorationColor;
                    }
                }
                self.FieldsToSave = [];
                comparePositions = function (a, b) {
                    if (a.position < b.position) { return -1; }
                    if (a.position > b.position) { return 1; }
                    return 0;
                };
                setupSaveLayout = function () {
                    self.layoutContainsEmptyRows = false;
                    $.each(self.Layout, function (i, layoutTab) {  //subtabs not initialized here
                        if (layoutTab.rows) {
                            $.each(layoutTab.rows, function (j, layoutRow) {
                                layoutRow.items.sort(comparePositions);
                                setMagicFormCSSProps(layoutRow);
                                if (layoutRow.items.length == 0) {
                                    self.layoutContainsEmptyRows = true;
                                }
                            });
                        }
                        if (layoutTab.subTabs) {
                            $.each(layoutTab.subTabs, function (k, subTab) {
                                $.each(subTab.rows, function (l, layoutRow) {
                                    layoutRow.items.sort(comparePositions);
                                    setMagicFormCSSProps(layoutRow);
                                    if (layoutRow.items.length == 0) {
                                        self.layoutContainsEmptyRows = true;
                                    }
                                });
                            });
                        }
                    });
                };
                addVisibilityAttributes = function () {
                    $.each(self.FieldsToSave, function (i, field) {
                        $.extend(field, { isApplied: self.isApplied });
                        $.extend(field, { isMagicFormLayout: self.isMagicFormLayout });
                        $.extend(field, { isKendoPopupLayout: self.isKendoPopupLayout });
                    });
                };
                setMagicFormCSSProps = function (layoutRow) { //class="schema-form-section col-md-6 col-md-offset-2"                     
                    $.each(layoutRow.items, function (layoutItemIdx, currLayoutItem) {
                        let width, offset;
                        if (currLayoutItem.position == 0 && layoutItemIdx == 0) {   //different offset-calculation for first element in row                             
                            offset = "col-md-offset-" + currLayoutItem.x;
                            width = getBootstrapWidthClass(currLayoutItem.width);
                        } else if (layoutItemIdx > 0) {
                            let prevIdx = layoutItemIdx - 1;
                            let prevLayoutItem = layoutRow.items[prevIdx];
                            offset = getBootstrapOffsetClass(currLayoutItem, prevLayoutItem);
                            width = getBootstrapWidthClass(currLayoutItem.width);
                        }

                        let fieldToSave = new Field(
                            layoutRow.position,
                            currLayoutItem.position,
                            width,
                            offset,
                            currLayoutItem.tag,
                            currLayoutItem.x,
                            currLayoutItem.numberOfRows,
                            currLayoutItem.fontWeight,
                            currLayoutItem.fontStyle,
                            currLayoutItem.fontVariantCaps,
                            currLayoutItem.color,
                            currLayoutItem.backgroundColor,
                            currLayoutItem.backgroundTransparent,
                            currLayoutItem.fontSize,
                            currLayoutItem.shadow,
                            currLayoutItem.textDecorationLine,
                            currLayoutItem.textDecorationStyle,
                            currLayoutItem.textDecorationColor
                        );
                        
                        currLayoutItem.editFormCssClass = width + " " + offset;
                        self.FieldsToSave.push(fieldToSave);
                    });
                };                
                getWidth = function() {
                    let width = -1;
                    switch (self.itemsPerRow) {
                        case 1:
                            width = 12;
                            break;
                        case 2:
                            width = 6;
                            break;
                        case 3:
                            width = 4;
                            break;
                        case 4:
                            width = 3;
                            break;
                        case 5:
                            width = 2;
                            break;
                        case 6:
                            width = 2;
                            break;
                        default:
                            width = 12;
                            break;
                    }
                    if (width > 0) {
                        return width;
                    }
                };
                getBootstrapWidthClass = function(width) {
                    let css = 'col-md-';
                    css += width;
                    return css;
                };
                getBootstrapOffsetClass = function(curr, prev) {
                    let css = 'col-md-offset-';
                    let offset = curr.x - (prev.x + prev.width);
                    css += offset;
                    return css;
                };
                self.onDragStart = function (event, ui, row) {
                    let currentlyDraggedItemID = event.target.id;
                    let gridstack = $(event.currentTarget).data('gridstack');
                    addWhiteSpaceBlockers(gridstack, currentlyDraggedItemID, row.height);
                };
                addWhiteSpaceBlockers = function(gridstack, currentlyDraggedItemID, rowHeight) {
                    let gsItems = gridstack.grid.nodes;
                    let curr = $.grep(gsItems, function(itm) { return itm.id == currentlyDraggedItemID })[0];
                    let currIdx = gsItems.indexOf(curr);

                    let gsItemsWithoutDraggedItem = $.grep(gsItems, function(itm) { return itm.id != currentlyDraggedItemID });

                    let prev = gsItems[currIdx - 1];
                    let next = gsItems[currIdx + 1];

                    let blockedSpaces = getBlockedSpaces(gsItemsWithoutDraggedItem);
                    if (prev) {
                        blockSpaceBeforeX(prev.x, gridstack, blockedSpaces, rowHeight);
                    }
                    if (next) {
                        blockSpaceAfterX(next.x + next.width, gridstack, blockedSpaces, rowHeight);
                    } if (rowHeight > 1 && curr.height == 1) {
                        let textareaWidgets = $.grep(gsItems, function (itm) { return itm.height == 3 });
                        blockSpacesBelow(curr, textareaWidgets, gridstack)
                    }
                };
                getBlockedSpaces = function (gsItems) {
                    let currentlyBlocked = [];
                    $.each(gsItems, function (itmIdx, item) {
                        for (let i = item.x; i < item.x + item.width; i++) {
                            currentlyBlocked.push(i);
                        }
                    });
                    return currentlyBlocked;
                };
                blockSpacesBelow = function (item, textareas, gridstack) {
                    let totalTextareaWidth = 0;
                    textareas.forEach((tArea) => {
                        totalTextareaWidth += tArea.width;
                    });

                    let y = 1, h = 2; //y and height is fixed
                    if (gridstack.willItFit(item.x + item.width, y, 12 - totalTextareaWidth, h)) {
                        let ws = $('.whitespace').clone();
                        gridstack.addWidget(ws, item.x + item.width, y, 12 - totalTextareaWidth, h);
                    }
                };
                blockSpaceBeforeX = function (blockBeforeThisX, gridstack, blocked, rowHeight) {
                    for (let i = 0; i < blockBeforeThisX; i++) {
                        let ws = $('.whitespace').clone();
                        if (!blocked.includes(i)) {
                            if (gridstack.willItFit(i, 0, 1, rowHeight, false)) {
                                gridstack.addWidget(ws, i, 0, 1, rowHeight);

                            }
                        } else if (blocked.includes(i) && rowHeight == 3) {
                            if (gridstack.willItFit(i, 0, 1, rowHeight - 1, false)) {
                                gridstack.addWidget(ws, i, 1, 1, rowHeight - 1);
                            }
                        }
                    }
                };
                blockSpaceAfterX = function (blockAfterThisX, gridstack, blocked, rowHeight) {
                    for (let i = blockAfterThisX; i < 12; i++) {
                        let ws = $('.whitespace').clone();
                        if (!blocked.includes(i)) {
                            gridstack.addWidget(ws, i, 0, 1, rowHeight);
                        } else if (blocked.includes(i) && rowHeight == 3) {
                            gridstack.addWidget(ws, i, 1, 1, rowHeight - 1);
                        }
                    }
                };
                self.onDragStop = function (event, ui) {
                    removeWhitespaces(event);
                    self.layoutChangesMade = true;
                };
                self.onResizeStop = function () {
                    self.layoutChangesMade = true;
                }
                removeWhitespaces = function (event) {
                    let rowGridstack = $($(event.target).closest('.grid-stack')).data('gridstack');
                    if (rowGridstack) {
                        let rowNodes = rowGridstack.grid.nodes;
                        $.each(rowNodes, function (i, rNode) {
                            if (rNode.id === undefined) {
                                rowGridstack.removeWidget(rNode.el);
                            }
                        });
                    }
                };
                self.outerGridstackOptions = {
                    width: 12,          //numOfColumns
                    verticalMargin: 20,
                    removable: false,
                };
                self.innerGridstackOptions = {
                    resizable: {
                        autoHide: false,
                        handles: 'e'    //only horizontal resizing(e=east)
                    },
                    alwaysShowResizeHandle: true,
                    height: 3,
                    maxRow: 3,
                    float: false,
                    animate: true,
                    width: 12,
                };
                uid = function () {
                    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                    );
                };
                let isMFLayoutHitCount = 0;
                $scope.$watch("fe.isMagicFormLayout", function (newValue, oldValue) {
                    if (!self.mainGridVisible && self.layoutInitialized && isMFLayoutHitCount > 0) {
                        self.layoutChangesMade = true;
                    }
                    if (!self.isKendoPopupLayout && !newValue) {
                        self.isApplied = false;
                    }
                    isMFLayoutHitCount++;
                });
                let isKendoPopupLayoutHitCount = 0;
                $scope.$watch("fe.isKendoPopupLayout", function (newValue, oldValue) {
                    if (!self.mainGridVisible && self.layoutInitialized && self.renderMagicGrid && isKendoPopupLayoutHitCount > 0) {
                        self.layoutChangesMade = true;
                    }
                    if (!self.isMagicFormLayout && !newValue) {
                        self.isApplied = false;
                    }
                    isKendoPopupLayoutHitCount++;
                });

                self.styleItem = {};
                let styleItemDefault = {
                    fontSize: 14,
                    fontWeight: "400",
                    fontStyle: "normal",
                    fontVariantCaps: "normal",
                    color: "#000000",
                    backgroundColor: "#FFFFFF",
                    backgroundTransparent: true,

                    shadow: '',
                    shadowActive: false,
                    shadowX: 1,
                    shadowY: 1,
                    shadowBlur: 0,
                    shadowColor: "#000000",

                    textDecorationLine: 'none',
                    textDecorationStyle: 'solid',
                    textDecorationColor: "#000000",

                    tag:"",
                };

                self.currentStyleItem = null;
                self.showStyleModal = function (item) {
                    self.currentStyleItem = item;
                    self.styleItem = JSON.parse(JSON.stringify(styleItemDefault));

                    self.styleItem.tag = item.tag;

                    if (item.fontSize) {
                        self.styleItem.fontSize = item.fontSize;
                    }
                    if (item.fontWeight) {
                        self.styleItem.fontWeight = item.fontWeight;
                    }
                    if (item.fontStyle) {
                        self.styleItem.fontStyle = item.fontStyle;
                    }
                    if (item.fontVariantCaps) {
                        self.styleItem.fontVariantCaps = item.fontVariantCaps;
                    }
                    if (item.color) {
                        self.styleItem.color = item.color;
                    }
                    if (item.backgroundColor) {
                        self.styleItem.backgroundColor = item.backgroundColor;
                    }
                    
                    self.styleItem.backgroundTransparent = item.backgroundTransparent || true;

                    self.styleItem.shadowActive = item.shadowActive || false;

                    if (item.shadow) {
                        self.styleItem.shadowActive = true;

                        var singleVals = item.shadow.split("px");
                        item.shadowX = parseInt(singleVals[0]);
                        item.shadowY = parseInt(singleVals[1]);
                        item.shadowBlur = parseInt(singleVals[2]);
                        item.shadowColor = singleVals[3].trim();
                        //self.styleItem.shadow = item.shadow;
                        item.shadow = "";
                    }


                    if (item.shadowX) {
                        self.styleItem.shadowX = item.shadowX;
                    }
                    if (item.shadowY) {
                        self.styleItem.shadowY = item.shadowY;
                    }
                    if (item.shadowBlur) {
                        self.styleItem.shadowBlur = item.shadowBlur;
                    }
                    if (item.shadowColor) {
                        self.styleItem.shadowColor = item.shadowColor;
                    }
                    
                    if (item.textDecorationLine) {
                        self.styleItem.textDecorationLine = item.textDecorationLine;
                    }
                    if (item.textDecorationStyle) {
                        self.styleItem.textDecorationStyle = item.textDecorationStyle;
                    }
                    if (item.textDecorationColor) {
                        self.styleItem.textDecorationColor = item.textDecorationColor;
                    }

                    $('#styleModal').modal("show");
                    $timeout(function () {
                        self.onFontStyleChanged();
                    }, 1);
                }
                self.onStyleModalSubmit = function () {
                    self.currentStyleItem.fontSize = self.styleItem.fontSize;
                    self.currentStyleItem.fontWeight = self.styleItem.fontWeight;
                    self.currentStyleItem.fontStyle = self.styleItem.fontStyle;
                    self.currentStyleItem.fontVariantCaps = self.styleItem.fontVariantCaps;
                    self.currentStyleItem.color = self.styleItem.color;
                    self.currentStyleItem.backgroundColor = self.styleItem.backgroundColor;
                    self.currentStyleItem.backgroundTransparent = self.styleItem.backgroundTransparent;

                    if (self.styleItem.shadowActive) {
                        self.currentStyleItem.shadowActive = self.styleItem.shadowActive;
                        self.currentStyleItem.shadow = self.styleItem.shadow;
                        self.currentStyleItem.shadowX = self.styleItem.shadowX;
                        self.currentStyleItem.shadowY = self.styleItem.shadowY;
                        self.currentStyleItem.shadowBlur = self.styleItem.shadowBlur;
                        self.currentStyleItem.shadowColor = self.styleItem.shadowColor;
                    }

                    if (self.styleItem.textDecorationLine && self.styleItem.textDecorationLine != 'none') {
                        self.currentStyleItem.textDecorationLine = self.styleItem.textDecorationLine;
                        self.currentStyleItem.textDecorationStyle = self.styleItem.textDecorationStyle;
                        self.currentStyleItem.textDecorationColor = self.styleItem.textDecorationColor;
                    }

                    setupFieldsWithLabelCSS(self.currentStyleItem, self.currentStyleItem.tag);
                    $span = $('#' + self.currentStyleItem.uid + '_tag');                    
                    applyLabelCssOnElement(self.currentStyleItem, $span);
                }
                self.onStyleModalReset = function () {
                    var tag = ""+self.styleItem.tag;
                    self.styleItem = JSON.parse(JSON.stringify(styleItemDefault));
                    self.styleItem.tag = tag;
                    self.onFontStyleChanged();
                }
                self.onStyleModalCancel = function () {
                    self.styleItem = {};
                    self.currentStyleItem = null;
                }
                self.onFontStyleChanged = function (item) {
                    self.layoutChangesMade = true;
                    var $previewLabel = $('#previewLabel');
                    applyLabelCssOnElement(self.styleItem, $previewLabel);
                }
                function applyLabelCssOnElement(styleItem, $element) {
                    $element.css('font-size', styleItem.fontSize);
                    $element.css('font-weight', styleItem.fontWeight);
                    $element.css('font-style', styleItem.fontStyle);
                    $element.css('font-variant-caps', styleItem.fontVariantCaps);
                    $element.css('color', styleItem.color);
                    if (!styleItem.backgroundTransparent) {
                        $element.css('background-color', styleItem.backgroundColor);
                    } else {
                        $element.css('background-color', '');
                    }

                    if (styleItem.shadow && styleItem.shadow.length > 0) {
                        $element[0].style.textShadow = styleItem.shadow;
                    }

                    if (styleItem.shadowActive && styleItem.shadowActive === true) {
                        var shadow = "";
                        shadow += styleItem.shadowX + "px ";
                        shadow += styleItem.shadowY + "px ";
                        shadow += styleItem.shadowBlur + "px ";
                        shadow += styleItem.shadowColor;
                        styleItem.shadow = shadow;
                        $element[0].style.textShadow = styleItem.shadow;
                    } else if (styleItem.shadowActive === false){
                        $element[0].style.textShadow = "";
                        styleItem.shadow = "";
                    }

                    if (styleItem.shadow && styleItem.shadow.length > 0) {
                        $element[0].style.textShadow = styleItem.shadow;
                    }

                    if (styleItem.textDecorationLine && styleItem.textDecorationLine != "none") {
                        $element.css('text-decoration-line', styleItem.textDecorationLine);
                        $element.css('text-decoration-style', styleItem.textDecorationStyle);
                        $element.css('text-decoration-color', styleItem.textDecorationColor);
                    } else {
                        $element.css('text-decoration-line', '');
                        $element.css('text-decoration-style', '');
                        $element.css('text-decoration-color', '');
                    }

                }
            }
            ]);
    }
}())