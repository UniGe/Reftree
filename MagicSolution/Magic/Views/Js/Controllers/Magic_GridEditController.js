(function () {
    var angular;

    define(["angular", "MagicSDK", "jQueryUI", "angular-ui-sortable", "angular-magic-grid",
        "lodash", "gridstack", "gridstack-angular"], function (a, m) {
            angular = a;
            MF = m;
            var app = controller.apply({}, arguments);
            app.value("config", {});
            return init;
        });

    loadCss(["gridstack"], window.includesVersion + "/Magic/v/2018.1.0.0/Styles/3rd-party/gridstack/");
    loadCss(["flag-icon"], window.includesVersion + "/Magic/v/2018.1.0.0/Styles/3rd-party/flag-icons/css/");

    function init() {
        var element = getAngularControllerRootHTMLElement("GridEdit");
        $("#grid").html(element);
        angular.bootstrap(element, ["GridEdit"]);
    }

    function controller(angular, MF) {
        return angular
            .module("GridEdit", ["ui.sortable", "gridstack-angular", "magicGrid"])
            .controller("GridEditController", ["$timeout", function ($timeout) {

                var self = this;
                /**  PARAMETERS #start */
                self.gridTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-grid.html";
                self.widgetTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-single_widget.html";
                self.mapWidgetTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-map_widget.html";
                self.groupWidgetTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-group_widget.html";
                self.tabstripWidgetTemplateUrl = "/Magic/Views/Templates/HtmlTemplates/grid-editor-tabstrip_widget.html";

                var textResources = {
                    en: {
                        confirm: 'Okay!',
                        addTab: 'Add Tab',
                        deleteTab: 'Delete Tab',
                        saveTabs: 'Save Layout',
                        reset: 'Reset',

                        editTabWorkingTitle: 'Edit Working Title',
                        editTabInternationalTitle: 'Edit International Titles',
                        englishDescription: 'English Description (en-GB)',
                        italianDescription: 'Italian Description (it-IT)',
                        germanDescription: 'German Description (de-DE)',
                        editTabOrder: 'Edit Tab Order',

                        addWidget: 'Add Widget',
                        moveWidget: 'Move Widget',
                        deleteWidget: 'Delete Widget',
                        desktopLayout: 'Desktop Layout View',
                        tabletLayout: 'Tablet Layout View',
                        mobileLayout: 'Mobile Layout View',

                        selectContentObject: 'Select Content-Object:',
                        selectContentType: 'Select Content-Type:',
                        storedProcedureHeading: 'Set SP-parameters:',
                        storedProcedurePlaceholder1: 'name of stored-procedure',
                        storedProcedurePlaceholder2: 'name of save-stored-procedure',
                        storedProcedurePlaceholder3: 'name of grid',
                        storedProcedurePlaceholder4: 'form code',
                        numOfTextareaLines: '5',
                        additionalCSSHeading: 'Override CSS:',
                        additionalCSSPlaceholderLine1: '{ "mobile":   "col-xs-6",       (½ width)',
                        additionalCSSPlaceholderLine2: '  "tablet":     "col-sm-4",      (⅓ width)',
                        additionalCSSPlaceholderLine3: '  "desktop": "height: 85px; overflow-y: hidden;" }    (additional style in a string)',
                        filterHeading: 'Set filters:',
                        filterPlaceholderLine1: '{ "field": "myField",',
                        filterPlaceholderLine2: '  "operator": "eq",',
                        filterPlaceholderLine3: '  "value": "myValue" }',
                        widgetTitle: 'Set widget titles:',
                        latitude: 'Latitude',
                        longitude: 'Longitude',
                        widgetGroupTitle: 'Set group titles:',
                        unspecifiedWidgets: 'There are unspecified widgets, do you really want to continue?',
                        emptyLayout: 'The layout is empty, do you really want to continue?',
                        selectNumOfFormColums: 'Select number of items per row:',
                        selectHideTabs: 'Hide tabs:',
                        expandedText: 'expanded-status',
                        expandedTitle: 'Toggle default expanded-status',
                        panelTransparentText: 'Set border-panel transparent:',
                        deleteWidget: 'Delete widget',
                        ungroupWidget: 'Ungroup widget',
                        selectStandardActions: 'Show standard actions:',
                        selectCustomActions: 'Show custom actions:',
                        //panelTransparentTitle:'Toggle transparency of border-panel',
                        toolbarConfig: "Toolbar Params",
                        toolbarConfigPlaceholder: "json exxample",
                        setDateFilter: "Set date filter:",
                        dateFilterFieldPlaceholder: "PublishedAt"
                    },
                    it: {},
                    de: {}
                };
                self.text = textResources.en;  //SET LANGUAGE
                self.contentTypeOptions = [//DashbooardCharts             //DashboardGrids
                    "", "MAGIC-FORM", "MAGIC-FORM-SP", "MAGIC-CHART", "MAGIC-CHART-GAUGE", "MAGIC-GRID", "MAGIC-GRID-SP",
                    "MAGIC-IMAGE-SLIDER","MAGIC-IMAGE-CAROUSEL", "GOOGLE-MAP", "MAGIC-INDICATOR", "MAGIC-WIDGET-GROUP", "MAGIC-TABSTRIP", "CUSTOM-HTML"
                ];
                self.numOfFormColumnsOptions = [1, 2, 3, 4, 5, 6, 12];

                self.layoutTypeOptions = [//fa fa-                    
                    { name: 'desktop', icon: 'desktop', title: self.text.desktopLayout },
                    { name: 'tablet', icon: 'tablet', title: self.text.tabletLayout },
                    { name: 'mobile', icon: 'mobile', title: self.text.mobileLayout }
                ];
                self.dropdownDataStructure = {
                    dataTextField: "Description",
                    dataValueField: "ID"
                };
                self.customHTMLDropdownDataStructure = {
                    dataTextField: "Code",
                    dataValueField: "ID"
                };
                self.chartDropdownDataStructure = {
                    dataTextField: "Description",
                    dataValueField: "GUID"
                };
                self.indicatorDropdownDataStructure = {
                    dataTextField: "Description",
                    dataValueField: "Code"
                };

                self.layoutChangesMade = false;
                self.currentLayoutType = 'desktop';

                self.loadTabContent = {};
                self.loadTabContent[0] = true;
                self.loadTsTabContent = {};
                self.loadLayoutContent = {
                    desktop: true,
                };

                /**  PARAMETERS #end */

                /**  DATA_STRUCTURE_DEFINITION #start */
                function Tab(id) {
                    this.id = id;
                    this.titles = {
                        working: '',
                        en: '#rename me',
                        it: '',
                        de: ''
                    };
                    this.widgets = {
                        desktop: [],
                        tablet: [],
                        mobile: []
                    };
                }

                function Widget(wdth, hght, newX = 0, newY = 1860, type = '', path = '') {
                    this.id = null;
                    this.x = newX;
                    this.y = newY;
                    this.width = wdth;
                    this.height = hght;
                    //USED for tabstrip
                    this.tabs = [];
                    this.contentType = type;
                    this.contentObjectPath = path;
                    this.additionalCSS = '';
                    this.filter = '';
                    this.filterObj = {},
                        this.titles = {
                            en: '',
                            it: '',
                            de: '',
                        };
                    this.isMapWidget = false;
                    this.isActive = true;
                    this.groupExpanded = true;
                    this.panelTransparent = false;
                }

                /**  DATA_STRUCTURE_DEFINITION #end */

                /**  GridEdit DATA #start */
                self.EditPageLayout = {
                    Code: '',
                    Description: '',
                    Grid: '',
                    Tabs: [],
                };
                var defaultWidgets = {
                    desktop: new Widget(6, 8),
                    tablet: new Widget(6, 6),
                    mobile: new Widget(12, 6),
                    group: new Widget(4, 6), //inside group
                    tab: new Widget(6, 6)     //inside tab
                };

                /**  INIT DEFAULT DATA #start */
                MF.api.getDataSet({},
                    "dbo.Magic_GetEditPagesContentObjects", true).then(function (res) {
                        self.chartOptions = res[0];
                        self.indicatorOptions = res[1];                         
                        $.each(self.chartOptions, function (i, opt) {
                            opt.Description += "     - (" + opt.ChartType + ")";
                        });
                        self.gaugeOptions = self.chartOptions.filter(function (val) { return val.ChartType == 'kendogauge' })
                        self.chartOptions = _.cloneDeep(self.chartOptions).filter(function (opt) {
                            return opt.ChartType != 'kendogauge';
                        });
                        self.chartOptions.forEach((opt) => {
                            if (!opt.GUID)
                                return;

                            if (opt && opt.GUID && opt.GUID != null)
                                opt.GUID = opt.GUID.toUpperCase();
                        });
                        self.customHtmlOptions = res[2];
                        $timeout();
                    });

                self.showList = true; //must be TRUE      (false for DEV)
                self.toggleTheList = function (e) {
                    //doModal(true);
                    var unmappedGrids = self.gridInstance.dataSource.options.fields[4].values;
                    var mappedGrids = unmappedGrids.map(function (el) {
                        return { ID: parseInt(el.value), Description: el.text };
                    });
                    self.gridOptions = mappedGrids;
                    self.showList = !self.showList;
                    self.dataOfRow = self.gridInstance.dataItem(e.currentTarget.closest("tr"));
                    var tabsFromDatabase = self.dataOfRow.JsonDefinition ? JSON.parse(self.dataOfRow.JsonDefinition) : [];
                    var vals = self.gridInstance.dataSource.options.fields.filter(x => x.field == "MagicGrid_ID")[0].values;
                    var magicGridID = self.dataOfRow.MagicGrid_ID.toString();
                    var result = vals.find(obj => {
                        return obj.value === magicGridID;
                    });
                    var magicGridName = result.text;

                    self.EditPageLayout.Code = self.dataOfRow.Code;
                    self.EditPageLayout.Description = self.dataOfRow.Description;
                    self.EditPageLayout.Grid = magicGridName;
                    self.EditPageLayout.Tabs = tabsFromDatabase;

                    if (tabsFromDatabase.length == 0) { //Default-Tab with <magic-form> widget              

                        var defaultTab = new Tab(0);

                        var magicFormDesktop = new Widget(12, 7, 0, 0, 'MAGIC-FORM', self.EditPageLayout.Grid);
                        magicFormDesktop.id = 'mainForm';
                        magicFormDesktop.isGroupWidget = true;

                        var magicGroupDesktop = new Widget(12, 10, 0, 0, 'MAGIC-WIDGET-GROUP', 'group');
                        magicGroupDesktop.groupWidgets = [];

                        magicGroupDesktop.isGroup = true;
                        magicGroupDesktop.isParent = true;
                        magicGroupDesktop.groupWidgets.push(magicFormDesktop);
                        magicGroupDesktop.groupExpanded = true;
                        magicGroupDesktop.id = 'mainFormGroup';
                        magicFormDesktop.parentId = magicGroupDesktop.id;

                        var magicFormTablet = new Widget(12, 7, 0, 0, 'MAGIC-FORM', self.EditPageLayout.Grid);
                        magicFormTablet.id = 'mainForm';
                        magicFormTablet.isGroupWidget = true;

                        var magicGroupTablet = new Widget(12, 10, 0, 0, 'MAGIC-WIDGET-GROUP', 'group');
                        magicGroupTablet.groupWidgets = [];

                        magicGroupTablet.isGroup = true;
                        magicGroupTablet.isParent = true;
                        magicGroupTablet.groupWidgets.push(magicFormDesktop);
                        magicGroupTablet.groupExpanded = true;
                        magicGroupTablet.id = 'mainFormGroup';
                        magicFormTablet.parentId = magicGroupTablet.id;

                        var magicFormMobile = new Widget(12, 7, 0, 0, 'MAGIC-FORM', self.EditPageLayout.Grid);
                        magicFormMobile.id = 'mainForm';
                        magicFormMobile.isGroupWidget = true;

                        var magicGroupMobile = new Widget(12, 10, 0, 0, 'MAGIC-WIDGET-GROUP', 'group');
                        magicGroupMobile.groupWidgets = [];

                        magicGroupMobile.isGroup = true;
                        magicGroupMobile.isParent = true;
                        magicGroupMobile.groupWidgets.push(magicFormDesktop);
                        magicGroupMobile.groupExpanded = true;
                        magicGroupMobile.id = 'mainFormGroup';
                        magicFormMobile.parentId = magicGroupMobile.id;

                        defaultTab.widgets.desktop.push(magicGroupDesktop);
                        defaultTab.widgets.tablet.push(magicGroupTablet);
                        defaultTab.widgets.mobile.push(magicGroupMobile);

                        self.layoutChangesMade = true;
                        tabsFromDatabase.push(defaultTab);
                    } else {
                        $.each(self.EditPageLayout.Tabs, function (i, tab) {
                            $.each(tab.widgets, function (layoutType, widgets) {
                                $.each(widgets, function (i, widget) {  
                                    initGroupWidget(widget);
                                    initTabstripWidget(widget);
                                });
                            });
                        });
                    }
                    self.ResetLayout = _.cloneDeep(self.EditPageLayout);
                    $timeout();
                }

                initGroupWidget = function (widget) {
                    if (widget.isGroup) {
                        $.each(widget.groupWidgets, function (i, groupWidget) {
                            groupWidget.parentsGroupWidgets = widget.groupWidgets;
                            if (groupWidget.isGroup) {
                                initGroupWidget(groupWidget);
                            } else if (groupWidget.isTabstrip) {
                                initTabstripWidget(groupWidget)
                            }
                        });
                    }
                };
                initTabstripWidget = function (widget) {
                    if (widget.isTabstrip) {
                        $.each(widget.tabs, function (i, tab) {                            
                            if (tab.isActive) {
                                self.loadTsTabContent[tab.id] = true;
                            }
                            $.each(tab.tabWidgets, function (i, tabWidget) {
                                tabWidget.parentsTabWidgets = tab.tabWidgets;
                                if (tabWidget.isGroup) {
                                    initGroupWidget(tabWidget);
                                } else if (tabWidget.isTabstrip) {
                                    initTabstripWidget(tabWidget);
                                }
                            });
                        });
                    }
                };


                self.reset = function () {
                    self.EditPageLayout = _.cloneDeep(self.ResetLayout);
                    self.layoutChangesMade = false;
                    $timeout(function () {
                        $('[href="#tab0"]').tab('show');
                    }, 1);
                };

                self.addTab = function () {
                    self.layoutChangesMade = true;                    
                    var newTabIdx = getNextFreeTabIndex(self.EditPageLayout.Tabs);
                    var newTab = new Tab(newTabIdx);
                    newTab.code = "tab" + newTabIdx;

                    self.EditPageLayout.Tabs.push(newTab);
                    $timeout(function () {
                        var newTabDOM = $('[href="#tab' + newTabIdx + '"]');       //select DOM & activate new tab
                        self.onTabSelected(newTabIdx);
                        newTabDOM.tab('show');
                        $timeout(function () {
                            $('#tab' + newTabIdx).addClass('active');
                        });
                    });
                };

                getNextFreeTabIndex = function (tabs, index = -1) {
                    var idx = -1;
                    if (index > 0) {
                        idx = index;
                    } else {
                        idx = tabs.length;
                    }
                    var idxFoundInArray = false;
                    $.each(tabs, function (i, tab) {
                        if (idx == tab.id) {
                            idxFoundInArray = true;
                        }
                    });

                    if (!idxFoundInArray) {
                        return idx;
                    } else {
                        idx++;
                        return getNextFreeTabIndex(tabs, idx);
                    }
                };
                self.removeTabFromTabstrip = function (tabstripWidget, tabstripTab) {  //remove TAB from WIDGET.tabs
                    var index = tabstripWidget.tabs.indexOf(tabstripTab);
                    if (tabstripTab.isActive) {
                        if (index >= 1) {
                            tabstripWidget.tabs[index - 1].isActive = true;
                        }
                    }
                    tabstripWidget.tabs.splice(index, 1);
                };

                self.removeTab = function (tab) {
                    self.layoutChangesMade = true;
                    var index = parseInt(self.EditPageLayout.Tabs.indexOf(tab));
                    self.EditPageLayout.Tabs.splice(index, 1);
                    $timeout(function () {
                        $('[href="#tab0"]').tab('show');
                    });
                };

                self.editTabstripDescription = function (tabstrip, evt) {
                    self.editTabDescription(tabstrip, evt);
                };

                self.editTabDescription = function (tab, evt) {
                    self.layoutChangesMade = true;
                    var target = $(evt.currentTarget);
                    var editPen = null;
                    var editSpan = null;
                    if (target.is('li')) {
                        var spans = $($(evt.currentTarget).children()[0]).children();
                        editPen = $(spans[0]);
                        editSpan = $(spans[1]);
                    }
                    if (target.is('span')) {
                        var spans = $(evt.currentTarget).parent().children();
                        editPen = $(spans[0]);
                        editSpan = $(spans[1]);
                    }
                    editPen.css("visibility", "hidden");
                    editSpan.attr("contenteditable", "true");
                    editSpan.focus();
                    //############################ mark text
                    var sel, range;
                    var el = editSpan[0];
                    if (window.getSelection && document.createRange) { //Browser compatibility
                        sel = window.getSelection();
                        if (sel.toString() == '') { //no text selection
                            window.setTimeout(function () {
                                range = document.createRange(); //range object
                                range.selectNodeContents(el); //sets Range
                                sel.removeAllRanges(); //remove all ranges from selection
                                sel.addRange(range);//add Range to a Selection.
                            }, 1);
                        }
                    } else if (document.selection) {
                        sel = document.selection.createRange();
                        if (sel.text == '') { //no text selection
                            range = document.body.createTextRange();//Creates TextRange object
                            range.moveToElementText(el);//sets Range
                            range.select(); //make selection.
                        }
                    }
                    //############################ mark text
                    editSpan.keypress(function (e) {
                        if (e.which == 13) {
                            editSpan.focusout();
                        }
                    });
                    //editSpan.keypress(function (e) { return e.which != 13; }); 
                    editSpan.focusout(function () {
                        editSpan.removeAttr("contenteditable").off("focusout");
                        editPen.css("visibility", "visible");
                        if (tab.isTabstripTab) {
                            tab.title = editSpan.text();
                        } else {
                            tab.titles.en = editSpan.text();
                        }
                    });
                };

                self.onTabTitlesModified = function () {
                    self.layoutChangesMade = true;
                };
                self.copyTabCodeToClipboard = function (e, id) {
                    $(e.target).kendoTooltip({
                        position: "top",
                        showOn: "click",
                        autoHide: true,
                        content: "Copied to clipboard!",
                    });
                    $(e.target).data("kendoTooltip").show();
                    var copyCode = document.getElementById("copyCode" + id);
                    copyCode.removeAttribute('disabled');
                    copyCode.select();
                    document.execCommand('copy');
                    copyCode.disabled = true;
                    window.getSelection().removeAllRanges()
                };


                self.saveTabs = function () {
                    var copy = _.cloneDeep(self.EditPageLayout.Tabs);
                    var allWidgetsSpecified = false;
                    var configurationIncludesMainFormWidget = false;
                    $.each(copy, function (idx, tab) {
                        tab.code = "tab" + tab.id;
                        $.each(tab.widgets, function (layoutType, widgets) {
                            $.each(widgets, function (idx, wdgt) {
                                wdgt.filter = wdgt.filter.replace(/\r?\n|\r/g, "");
                                if (wdgt.contentType == '' || wdgt.contentObjectPath == '') {
                                    allWidgetsSpecified = false;
                                } else {
                                    allWidgetsSpecified = true;
                                }
                                if (wdgt.id == 'mainForm') {
                                    configurationIncludesMainFormWidget = true;
                                }

                                if (typeof wdgt.uid == 'undefined') {
                                    wdgt.uid = uid();
                                }

                                if (wdgt.tabs) {
                                    cleanTabWidgetsData(wdgt);
                                    cleanGroupWidgetsData(wdgt);
                                }

                                if (wdgt.groupWidgets) {

                                    cleanGroupWidgetsData(wdgt);
                                    cleanTabWidgetsData(wdgt);
                                    $.each(wdgt.groupWidgets, function (key, groupWdgt) {
                                        if (groupWdgt.id == 'mainForm') {
                                            configurationIncludesMainFormWidget = true;
                                        }
                                        if (groupWdgt.contentType == '' || groupWdgt.contentObjectPath == '') {
                                            allWidgetsSpecified = false;
                                        } else {
                                            allWidgetsSpecified = true;
                                        }
                                    });
                                }

                                if (wdgt.gsNode) {
                                    delete wdgt.gsNode;
                                }
                                if (wdgt.$parent) {
                                    delete wdgt.$parent;
                                }

                            });
                        });
                    })

                    if (!configurationIncludesMainFormWidget) {
                        kendoConsole.log("The configuration you want to save seems to be invalid. Please try again!", 'error');
                        return;
                    }

                    var modalText = '';
                    if (!allWidgetsSpecified) {
                        modalText = self.text.unspecifiedWidgets;
                    }
                    if (self.EditPageLayout.Tabs.length == 0) {
                        modalText = self.text.emptyLayout;
                    }
                  
                    var jsonDefinition = angular.toJson(copy); //USE angular.toJson(obj) instead to prevent writing of useless angular-prop '$$hashKey'
                    rebuildGenericModal();

                    if (modalText.length > 0) {
                        $('#contentofmodal').text(modalText);
                    }
                    $("#wndmodalContainer").modal('show');
                    $("#executesave").click(function () {

                        if ($("#executesave").attr("clicked"))
                            return;
                        $("#executesave").attr("clicked", true);

                        $.each(self.gridInstance.dataSource.data(), function (i, v) {
                            if (v.id == self.dataOfRow.id) {
                                v.JsonDefinition = jsonDefinition;
                                v.dirty = true;
                            }
                        });
                        self.gridInstance.dataSource.sync().then(function () {
                            $("#executesave").attr("clicked", false);
                            $("#wndmodalContainer").modal('hide');
                            self.layoutChangesMade = false;
                        });
                    });
                };


                cleanGroupWidgetsData = function (widget) {

                    if (widget.parentsGroupWidgets) {
                        delete widget.parentsGroupWidgets;
                    }
                    if (typeof widget.uid == 'undefined') {
                        widget.uid = uid();
                    }

                    $.each(widget.groupWidgets, function (i, grWdgt) {
                        //grWdgt.height += 2;
                        cleanGroupWidgetsData(grWdgt);
                        cleanTabWidgetsData(grWdgt);
                    });
                };
                cleanTabWidgetsData = function (widget) {

                    $.each(widget.tabs, function (i, tab) {
                        $.each(tab.tabWidgets, function (i, tabWidget) {
                            if (tabWidget.parentsTabWidgets) {
                                delete tabWidget.parentsTabWidgets;
                            }
                            if (typeof tabWidget.uid == 'undefined') {
                                tabWidget.uid = uid();
                            }
                            if (widget.groupExpanded) {
                                widget.groupExpanded = true;
                            }
                            cleanTabWidgetsData(tabWidget);
                            cleanGroupWidgetsData(tabWidget);
                        })
                    });
                };

                /**  TAB_EVENTS #end  **/

                self.onGroupToggle = function (widget, $event) {
                    var target = $($event.target);
                    var gsItem = target.closest('.grid-stack-item');

                    if (gsItem) {
                        var gridstack = $(gsItem).parent().data('gridstack');
                        if (!widget.groupExpanded) { //show
                            gridstack.resize(gsItem, widget.expandedWidth, widget.expandedHeight);
                            widget.groupExpanded = true;
                        } else if (widget.groupExpanded) {  //hide
                            widget.expandedWidth = widget.width;
                            widget.expandedHeight = widget.height;
                            if (gridstack) {
                                gridstack.resize(gsItem, widget.width, 1);
                            }
                            widget.groupExpanded = false;
                        }
                    }
                };
                
                self.onTabstripTabSelected = function (tabstripTab, tabs) {
                    tabs.forEach((t) => {
                        if (t.id != tabstripTab.id)
                            delete self.loadTsTabContent[t.id];
                    })
                    self.loadTsTabContent[tabstripTab.id] = true;

                    $.each(tabs, function (i, tab) {
                        tab.isActive = false;
                    });
                    tabstripTab.isActive = true;
                };

                uid = function () {
                    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                    );
                };

				/**
				 * Adds a tab to the tabstrip component
				 * @param {any} widget - The tabstrip component reference
				 * @param {any} event - The btn reference
				 */
                self.addTabToTabstrip = function (tabstripWidget, parentTab, event) {
                    $.each(tabstripWidget.tabs, function (i, tab) {
                        tab.isActive = false;
                    });

                    var tabstripTab = { title: "", id: uid(), tabNum: tabstripWidget.tabs.length, tabWidgets: [], isActive: true, isTabstripTab: true };
                    tabstripWidget.tabs.push(tabstripTab);
                    tabstripWidget.activeTabIndex = tabstripTab.tabNum;

                    self.onWidgetModified(tabstripWidget, parentTab);
                };

                /**  WIDGET_EVENTS #start  **/
				/**
				 * add widget to a sub tab
				 * @param {any} tab - the tab
				 * @param {any} widgetTab - The tabstrip widget
				 */

                self.addWidgetToTabstrip = function (tabstripParentWidget, tabstripTab) {
                    //var widgetToAdd = _.cloneDeep(defaultWidgets["tab"]);                   
                    var widgetToAdd = new Widget(6, 4);
                    widgetToAdd.id = "tabWidget_" + tabstripTab.tabWidgets.length;
                    widgetToAdd.contentType = "";
                    widgetToAdd.parentId = tabstripParentWidget.id;

                    //lastEl = tabStripWidget.tabs[tabStripWidget.activeTabIndex].tabWidgets[tabStripWidget.tabs[tabStripWidget.activeTabIndex].tabWidgets.length];
                    var lastEl = tabstripTab.tabWidgets[tabstripTab.tabWidgets.length - 1];
                    if (lastEl) {
                        newXpos = lastEl.x + lastEl.width;
                        newYpos = lastEl.y + lastEl.height;
                    } else {
                        newXpos = 0;
                        newYpos = 0;
                    }
                    if (newXpos + widgetToAdd.width > 12) {
                        newXpos = 0;
                    }
                    widgetToAdd.x = newXpos;
                    widgetToAdd.y = newYpos;
                    widgetToAdd.isTabstripWidget = true;

                    tabstripParentWidget.contentObjectPath = "tabstrip";
                    tabstripTab.tabWidgets.push(widgetToAdd);
                    widgetToAdd.parentsTabWidgets = tabstripTab.tabWidgets;
                };
                self.addWidgetToGroup = function (widgetGroup, tab, evt) {
                    var target = evt.target;
                    var widgetToAdd = _.cloneDeep(defaultWidgets["group"]);
                    widgetGroup.isParentWidget = true;
                    widgetToAdd.id = uid();
                    widgetToAdd.isGroupWidget = true;
                    widgetToAdd.parentId = widgetGroup.id;                    
                    var lastEl = widgetGroup.groupWidgets[widgetGroup.groupWidgets.length - 1];

                    var newXpos, newYpos;
                    if (lastEl) {
                        newXpos = lastEl.x + lastEl.width;
                        if (newXpos + widgetToAdd.width > 12) {
                            newXpos = 0;
                            newYpos = lastEl.y + lastEl.height;
                        } else {
                            newYpos = lastEl.y;
                        }
                    } else {
                        newXpos = 0;
                        newYpos = 0;
                    }
                    widgetToAdd.x = newXpos;
                    widgetToAdd.y = newYpos;
                    widgetGroup.contentObjectPath = "group";
                    widgetGroup.groupWidgets.push(widgetToAdd);
                    widgetToAdd.parentsGroupWidgets = widgetGroup.groupWidgets;
                    if (!widgetGroup.groupExpanded) {
                        self.onGroupToggle(widgetGroup, evt);
                    }

                    //adjust group height after adding a widget in a new line
                    var groupHeaderHeight = 3;
                    var lastGroupWidget = widgetGroup.groupWidgets[widgetGroup.groupWidgets.length - 1];
                    var minHeight = lastGroupWidget.y + lastGroupWidget.height;
                    var gsNode = target.closest('.grid-stack-item');
                    var gridstack = $(gsNode).parent().data('gridstack');


                    if (gridstack) {
                        if (widgetGroup.height - groupHeaderHeight <= minHeight) {
                            gridstack.resize(gsNode, widgetGroup.width, minHeight + groupHeaderHeight);
                            widgetGroup.height = minHeight + groupHeaderHeight;
                        }
                    }
                };

                self.addWidget = function (tab, widgetGroup = null, $event = null, tabStripWidget = null) {
                    self.layoutChangesMade = true;
                    $.each(tab.widgets, function (layoutType, wdgts) {
                        var widgetToAdd = _.cloneDeep(defaultWidgets[layoutType]);
                        widgetToAdd.id = "widget_" + wdgts.length;

                        var lastEl = wdgts[wdgts.length - 1];
                        if (lastEl) {
                            var newXpos = lastEl.x + lastEl.width;
                            var newYpos = lastEl.y + lastEl.height;
                        } else {
                            var newXpos = 0;
                            var newYpos = 0;
                        }

                        if (newXpos + widgetToAdd.width > 12) {
                            newXpos = 0;
                        }
                        widgetToAdd.x = newXpos;
                        widgetToAdd.y = newYpos;
                        wdgts.push(widgetToAdd);
                    });

                };


                self.removeWidget = function (widgetToRemove, tab) {                    
                    self.layoutChangesMade = true;
                    if (widgetToRemove.isGroupWidget) {
                        var index = widgetToRemove.parentsGroupWidgets.indexOf(widgetToRemove);
                        widgetToRemove.parentsGroupWidgets.splice(index, 1);
                    } else if (widgetToRemove.isTabstripWidget) {
                        var index = widgetToRemove.parentsTabWidgets.indexOf(widgetToRemove);
                        widgetToRemove.parentsTabWidgets.splice(index, 1);
                    } else {
                        $.each(tab.widgets, function (layoutType, widgets) {
                            var wdgtToRemove = widgets.find(wdgt => { return wdgt.id == widgetToRemove.id });
                            var index = widgets.indexOf(wdgtToRemove);
                            widgets.splice(index, 1);
                        });
                    }
                };
                self.ungroupWidget = function (widgetToUngroup, tab) {
                    $.each(tab.widgets, function (layoutType, widgets) {
                        var parentGroup = widgets.find((wdgt) => {
                            return wdgt.id = widgetToUngroup.parentId;
                        });
                        var spliceIdx = parentGroup.groupWidgets.indexOf(widgetToUngroup);
                        var addMeToWidgets = parentGroup.groupWidgets.splice(spliceIdx, 1)[0];                        
                        widgets.push(addMeToWidgets);
                    });
                }
                self.onLayoutTypeSelected = function (newType) {
                    self.loadLayoutContent = {};
                    self.loadLayoutContent[newType] = true;
                    self.layoutChangesMade = true;
                    self.currentLayoutType = newType;
                };
                self.onContentTypeSelected = function (widget, tab) {
                    self.layoutChangesMade = true;
                    switch (widget.contentType) {
                        case "MAGIC-WIDGET-GROUP":
                            if (!widget.isGroupWidget) {
                                widget.width = 12;
                                widget.height = 15;
                            }
                            widget.contentObjectPath = 'group';
                            widget.groupExpanded = true;
                            widget.groupWidgets = [];
                            widget.isGroup = true;
                            self.onWidgetModified(widget, tab, true); //updateDims = true (only when widget is widgetGroup)
                            break;
                        case "MAGIC-TABSTRIP":
                            if (!widget.isGroupWidget) {
                                widget.width = 12;
                                widget.height = 9;
                            }
                            widget.contentObjectPath = 'tabstrip';
                            widget.tabs = [];
                            widget.isTabstrip = true;
                            self.onWidgetModified(widget, tab, true); //updateDims = true (only when widget is widgetGroup)
                            break;
                        default:
                            widget.contentObjectPath = '';
                            if (widget.contentType == 'MAGIC-FORM' || widget.contentType == 'MAGIC-FORM-SP') {
                                widget.hideTabs = false;
                                widget.numOfFormColumns = 1;
                            }
                            self.onWidgetModified(widget, tab);
                            break;
                    }
                };

                self.activateSaveBtn = function () {
                    self.layoutChangesMade = true;
                }

                self.onWidgetModified = function (modifiedWidget, tab, updateDimensions = false) {
                    self.layoutChangesMade = true;

                    if (tab) {
                        $.each(tab.widgets, function (layoutType, wdgts) {

                            var widgetToModify = wdgts.find(wdgt => { return wdgt.id == modifiedWidget.id });

                            if (typeof widgetToModify != 'undefined') {
                                widgetToModify.contentType = modifiedWidget.contentType;
                                widgetToModify.contentObjectPath = modifiedWidget.contentObjectPath;

                                widgetToModify.filter = modifiedWidget.filter;
                                widgetToModify.filterObj = modifiedWidget.filterObj;

                                widgetToModify.additionalCSS = modifiedWidget.additionalCSS;
                                widgetToModify.titles = modifiedWidget.titles;
                                if (updateDimensions) {
                                    widgetToModify.width = modifiedWidget.width;
                                    widgetToModify.height = modifiedWidget.height;
                                }

                                widgetToModify.panelTransparent = modifiedWidget.panelTransparent;
                                widgetToModify.groupExpanded = modifiedWidget.groupExpanded;

                                if (modifiedWidget.contentType == 'MAGIC-FORM-SP' || modifiedWidget.contentType == 'MAGIC-GRID-SP' || modifiedWidget.contentType == 'GOOGLE-MAP' || modifiedWidget.contentType == 'MAGIC-IMAGE-SLIDER') {
                                    widgetToModify.SPpath = modifiedWidget.SPpath;
                                    widgetToModify.SSPpath = modifiedWidget.SSPpath;
                                    widgetToModify.SPgridname = modifiedWidget.SPgridname;
                                }
                                if (modifiedWidget.contentType == 'MAGIC-WIDGET-GROUP') {
                                    widgetToModify.groupExpanded = modifiedWidget.groupExpanded;
                                    widgetToModify.groupWidgets = modifiedWidget.groupWidgets;
                                }
                                if (modifiedWidget.contentType == 'MAGIC-TABSTRIP') {
                                    widgetToModify.tabs = modifiedWidget.tabs;
                                }
                                if (modifiedWidget.contentType == 'MAGIC-FORM' || modifiedWidget.contentType == 'MAGIC-FORM-SP') {
                                    widgetToModify.numOfFormColumns = modifiedWidget.numOfFormColumns;
                                    widgetToModify.hideTabs = modifiedWidget.hideTabs;
                                }
                                if (modifiedWidget.parentId == 'mainFormGroup') {
                                    widgetToModify.showCustomActions = modifiedWidget.showCustomActions;
                                    widgetToModify.showStandardActions = modifiedWidget.showStandardActions;
                                }
                            }
                        });

                    }
                };
                self.onJsonInputFocus = function ($event) {
                    self.currentJsonNode = $($event.currentTarget);
                };

                self.validateJsonInput = function (widget, propertyToValidate, type, tab) {

                    var jsonValid = getJsonObject(propertyToValidate);

                    if (jsonValid) {
                        self.currentJsonNode.css("background-color", "rgb(68, 157, 68, 0.3)"); //green "#449d44"
                        if (propertyToValidate == widget.filter) {
                            widget.filterObj = jsonValid;
                        } else if (propertyToValidate == widget.additionalCSS) {
                            widget.additionalCSSObj = jsonValid;
                        }
                    } else {
                        self.currentJsonNode.css("background-color", "rgb(217, 83, 79, 0.3)"); //red "#d9534f"
                    }
                    if (propertyToValidate.length == 0) {
                        self.currentJsonNode.css("background-color", "");
                    }
                    self.onWidgetModified(widget, tab);
                };

                getJsonObject = function (str) {
                    try {
                        return JSON.parse(str);
                    }
                    catch (err) {
                        return false;
                    }
                };
                self.onTabSelected = function (tabId) {
                    doModal(true);
                    self.currentTabId = tabId;
                    self.loadTabContent = {};
                    self.loadTabContent[tabId] = true;
                    $timeout(function () {
                        self.hideSpinner();
                    }, 1);
                };
                self.hideSpinner = function () {
                    doModal(false);
                }

                self.onExpandedStatusSelected = function (widget, tab) {
                    self.layoutChangesMade = true;
                    self.onWidgetModified(widget, tab);
                }
                self.onTransparencyStatusSelected = function (widget, tab) {
                    self.layoutChangesMade = true;
                    self.onWidgetModified(widget, tab);
                }
                /**  WIDGET_EVENTS #end  **/

                //gridstack/sortable OPTS #start
                self.onGridstackChanged = function (ev, items, widget) {
                    self.layoutChangesMade = true;
                };
                self.onGridstackResizeStop = function (event, item) {
                    self.layoutChangesMade = true;
                };
                self.innerGridstackOpts = {
                    removeTimeout: 100,
                };
                self.outerGridstackOpts = {
                    removable: true,
                };
                self.gridstackOptions = {  //main Gridstack
                };
                self.sortableOptions = {
                    group: "tabs",
                    sort: true,
                    handle: '.fa-arrows-h',
                    start: function () {
                    },
                    stop: function (e, ui) {
                    }
                };
                self.onTabstripTabTitleChanged = function () {
                    self.layoutChangesMade = true;
                }
            }
            ]);
    }
}());