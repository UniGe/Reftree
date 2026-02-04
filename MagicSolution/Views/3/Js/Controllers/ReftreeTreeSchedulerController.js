define(["angular", "angular-kendo", "angular-magic-form-sp","angular-magic-grid"], function (angular) {
    return angular
        .module("ReftreeTreeScheduler", ["kendo.directives", "magicFormSp", "magicGrid"])
        .controller("ReftreeTreeSchedulerController", [
            "config",
            "$timeout",
            "$scope",
            function (config, $timeout, $scope) {
                //resize scheduler when webarch menu is resized
                $("#layout-condensed-toggle").click(function () {
                    setTimeout(function () { kendo.resize("[kendo-scheduler]") }, 100)
                });

                var self = this;
                self.grid = config().grid;
                self.treeHidden = !config().showTree;               
                self.tematismiTreeOpenPaths = [];
                self.callContext = "ReftreeTreeScheduler";
                self.dates = {};
                self.isNew = true;
                self.singleThemati = false;
                self.startToday = true;
                self.test = "";
                self.toolTipItem = [];

                var sourceItemIds = $.map(self.grid.select(), function (v, i) {
                    return self.grid.dataItem(v)[self.grid.dataSource.options.schema.model.id];
                });

                var sourcegridname = self.grid.element.attr("gridname");

                self.getToolTip = function () {
                    self.toolTipItem = [];
                    var deferred = $.Deferred();
                    config().MF.api.get({
                        storedProcedureName: "core.EXP_SP_TOOLTIP_SCHEDULER",
                        gridname: sourcegridname,
                        data: {
                            datarow: $.map(config().selected, function (e) { return { id : e.id } }),
                        }
                    })
                        .then(function (result) {
                            if (!result) {
                                deferred.resolve();
                            }

                            $.each(result[0], function (i, v) {
                                self.toolTipItem.push(v);
                            })
                            //anytime the user applies a filter the selected node is reset
                             
                            deferred.resolve();
                        }, function (err) {
                            console.log(err);
                        });
                    return deferred.promise();
                }

                self.getToolTip();
                 
                if (!window.schedulerTreeListLoaderSP)
                    kendoConsole.log("window.schedulerTreeListLoaderSP not defined !!!", true);

                self.resizeMenuReftree = function () {
                    if (!$('#main-menu').hasClass('mini')) {

                        $('#main-menu').addClass('mini');
                        $('.page-content').addClass('condensed');
                        $('.scrollup').addClass('to-edge');
                        $('.header-seperation').hide();
                        $('.footer-widget').hide();
                        $('.sub-menu').hide();
                        
                    }
                    $(document).trigger('menuToggled');
                }

                self.triggerWindowResize = function triggerWindowResize() {
                    window.dispatchEvent(new Event('resize'));
                    self.resizeMenuReftree();
                };

                self.resizeMenuReftree();

                var MyWeekView = kendo.ui.MultiDayView.extend({
                    options: {
                        name: "MyWeekView",
                        title: "Week",
                        selectedDateFormat: "{0:D} - {1:D}",
                        
                    },                 
                    name: "my-week",
                    calculateDateRange: function (e) {                        
                        var selectedDate = this.options.date,
                            start = selectedDate,
                            idx, length,
                            dates = [];

                        var today = kendo.date.today();
                        var firstDateOfMonth = kendo.date.firstDayOfMonth(selectedDate);
                        var lastDayOfMonth = kendo.date.lastDayOfMonth(firstDateOfMonth);
                        var length = self.scheduler?.dataSource._data.length ? self.scheduler?.dataSource._data.length : 0;


                        //if (length > 0) {                            
                        //    var maxFirstDateOfMonth = self.scheduler?.dataSource._data[0].start
                        //    var maxLastDayOfMonth = self.scheduler?.dataSource._data[length - 1].end
                        //}
                         
                        if (firstDateOfMonth < today && self.startToday) {
                            firstDateOfMonth = today;
                            lastDayOfMonth = kendo.date.lastDayOfMonth(firstDateOfMonth);

                            if (length > 0) { self.startToday = false; }                            
                        }

                        //firstDateOfMonth = maxFirstDateOfMonth > firstDateOfMonth ? maxFirstDateOfMonth : firstDateOfMonth;
                        //lastDayOfMonth = maxLastDayOfMonth < lastDayOfMonth ? maxLastDayOfMonth : lastDayOfMonth;

                        var date1 = firstDateOfMonth;

                        self.dates = { from: firstDateOfMonth, to: lastDayOfMonth};

                        while (date1 <= lastDayOfMonth) {
                            dates.push(date1);
                            date1 = kendo.date.nextDay(date1);
                        }

                        this._render(dates);
                    },
                    MORE_BUTTON_TEMPLATE: kendo.template(
                        '<div style="width:#=width#px;left:#=left#px;top:#=top#px" class="k-more-events k-button"><span>...</span></div>'
                    ),
                    _positionEvent: function (event, element, slotRange) {
                        kendo.ui.MultiDayView.fn._positionEvent.call(this, event, element, slotRange)

                        var startIndex = slotRange.start.index;
                        var endIndex = slotRange.end.index;
                        var events = slotRange.events();

                        if (events.length > 2) {

                            for (var slotIndex = startIndex; slotIndex <= endIndex; slotIndex++) {
                                var collection = slotRange.collection;

                                var slot = collection.at(slotIndex);

                                var more = $(this.MORE_BUTTON_TEMPLATE({
                                    ns: kendo.ns,
                                    start: slotIndex,
                                    end: slotIndex,
                                    width: slot.clientWidth - 4,
                                    left: slot.offsetLeft + 2,
                                    top: slot.offsetTop + slot.offsetHeight - 12
                                }));

                                this.content[0].appendChild(more[0]);
                            }
                        }

                    },
                    render: function (events) {
                        var that = this;
                        kendo.ui.MultiDayView.fn.render.call(that, events);

                        this.content.on("click", ".k-more-events", function (e) {
                            var offset = $(e.currentTarget).offset();
                            if (offset.left != 0 && offset.top != 0) {
                                var slot = that._slotByPosition(offset.left, offset.top);
                                e.preventDefault();
                                that.trigger("navigate", { view: "day", date: slot.startDate() });
                            }
                        });
                    }
                });

                self.labels = {
                    operator: { it: "Operatore", en: "Operator" },
                    applyfilter: { it: "Applica filtro", en: "Apply filter" },
                    movestart: {
                        it: "Spostamento iniziato...", en: "Moving..."
                    },
                    moveend: {
                        it: "Spostamento terminato", en: "Moving ends"
                    }
                };

                self.getLabels = function (key) {
                    return self.labels[key][window.culture.substring(0, 2)];
                };
                //this is necessary cause when i click outside the scheduler kendo deselects all , so i move the button into the toolbar
                $scope.$watch('ts.scheduler', function (n, o) {
                    if (n) {
                        self.scheduler.toolbar.prepend($("#actions___scheduler"));
                    }
                });

                self.refreshSkeduler = function refreshSkeduler() {
                    this.scheduler._resizeHandler();
                }

                
                self.tasks = [
                    //{
                    //    "description": "BH",
                    //    "end": new Date("2018/1/04 10:00"),
                    //    "id": 26877083371,
                    //    "isAllDay": false,
                    //    "recurrenceException": null,
                    //    "recurrenceId": 26825796528,
                    //    "recurrenceRule": null,
                    //    "start": new Date("2018/1/04 15:00"),
                    //    "title": "Event 1",
                    //editOptions = {
                    //gridName: "SAMPLE_intervGroup",
                    //	filter: { field: "ID", operator: "eq", value: 1 }
                    //}
                    //}, 
                    //{
                    //    "description": "BH",
                    //    "end": new Date("2018/1/03 9:00"),
                    //    "id": 26876983371,
                    //    "isAllDay": false,
                    //    "recurrenceException": null,
                    //    "recurrenceId": 26825796525,
                    //    "recurrenceRule": null,
                    //    "start": new Date("2018/1/03 11:00"),
                    //    "title": "Event 2"
                    //}
                ];

                if (config().tasks && config().tasks.length)
                    self.tasks = config().tasks;

                var minDate = null;

                $.each(self.tasks[0], function (i, v) {
                    var st = new Date(v.start);
                    if (st < minDate || !minDate)
                        minDate = st;
                });

                if (!minDate)
                    minDate = new Date();

                self.schedulerDs = function () {
                    return new kendo.data.SchedulerDataSource({
                        data: new kendo.data.ObservableArray($.map(self.tasks,
                            function (v, i) {
                                if (Array.isArray(v)) {
                                    var minsInDay = 0;
                                    var hashofday = {};
                                    $.each(v, function (ii, vv) {
                                        if (!hashofday[vv.start])
                                            hashofday[vv.start] = { minsInDay: 0 };
                                        var start = vv.start;
                                        var end = vv.end;
                                        vv.start = new Date(vv.start);
                                        vv.end = new Date(vv.end);
                                        //spread events in time if they last 0 seconds 
                                        if (vv.editOptions && vv.editOptions.dragAndDropSp && start == end) {
                                            //i don't want to change the day
                                            if ((hashofday[start].minsInDay + 30) == 1440)
                                                hashofday[start].minsInDay = 0;
                                            vv.start = new Date(vv.start.getTime() + hashofday[start].minsInDay * 60000);
                                            hashofday[start].minsInDay = hashofday[start].minsInDay + 30;
                                            vv.end = new Date(vv.end.getTime() + hashofday[start].minsInDay * 60000);
                                            vv.isAllDay = false;

                                        }
                                        vv.start = toTimeZoneLessString(vv.start);
                                        vv.end = toTimeZoneLessString(vv.end);
                                    });
                                }
                                else {
                                    v.end = new Date(v.end);
                                    v.start = new Date(v.start);
                                }
                                //FORCING DATA FOR DEBUG!!!
                                //v.editOptions = {
                                //	gridName: "SAMPLE_intervGroup",
                                //	filter: { field: "ID", operator: "eq", value: 1 },
                                //	isBlock: true,
                                //	dragAndDropSp: "core.TK_Scheduler_DragAndDrop",
                                //	blockColour: "yellow",
                                //	blockText:"Controlli settimanali 17.5"
                                //}

                                return v;
                            })
                        ),
                        schema: {
                            model: {
                                id: "taskId",
                                fields: {
                                    taskId: { from: "id" },
                                    title: { from: "title", defaultValue: "No title", validation: { required: true } },
                                    start: { type: "date", from: "start" },
                                    end: { type: "date", from: "end" },
                                    description: { from: "description" },
                                    recurrenceId: { from: "recurrenceID" },
                                    recurrenceRule: { from: "recurrenceRule" },
                                    recurrenceException: { from: "recurrenceException" },
                                    isAllDay: { type: "boolean", from: "isAllDay" },
                                }
                            },
                        }
                    })
                };

                self.buildEventTemplate = function (event) {
                


                    return '<div class="r3_task" style="background-color:' + event.color + '">' + event.title + '-' + (event.description ? event.description : '') + '</div>';



                }

                self.dragAndDrop = function (e) {
                    if (!e.event.editOptions || !e.event.editOptions.dragAndDropSp) {
                        e.preventDefault();
                        return;
                    }
                    doModal(true);
                    var MF = config().MF;
                    var draganddropsp = e.event.editOptions.dragAndDropSp;
                    var oldStart = e.event.start;
                    var oldEnd = e.event.end;
                    var event_ = e.event.toJSON();
                    event_.start = toTimeZoneLessString(e.start);
                    event_.end = toTimeZoneLessString(e.end);

                    MF.api.getDataSet({
                        event: event_,
                        schedulerAction: "drag",
                        gridname: sourcegridname,
                        gridids: sourceItemIds,
                        caller: self.callContext
                    }, draganddropsp)
                        .done(function (res) {
                            var ok = true;
                            if (res.status && res.status == 500) {
                                kendoConsole.log(res.responseText, true);
                                e.event.start = oldStart;
                                e.event.end = oldEnd;
                                ok = false;
                            }
                            if (ok) {
                                e.event.start = new Date(event_.start);
                                e.event.end = new Date(event_.end);
                                kendoConsole.log(self.getLabels("moveend"), false);
                            }
                            self.scheduler.refresh();
                            doModal(false);
                        });
                }

                self.schedulerOptions = {
                    date: minDate,
                    eventTemplate: self.buildEventTemplate,
                    allDayEventTemplate: self.buildEventTemplate,
                    selectable: true,
                    dataBinding: function (e) {

                        var selectedView = $("#reftreeScheduler").getKendoScheduler().view();

                            if (selectedView.title != 'Mese') {
                                $(".k-scheduler-content").closest('tr').css("display","none");
                                var view = this.view();
                                view.times.hide();
                                view.timesHeader.hide();
                            }
                    },
                    resize: function (e) {
                        /* The result can be observed in the DevTools(F12) console of the browser. */
                        console.log("Resize", e.slot.start);
                    },
                    
                    dataBound: function (e) {
                        doModal(true);
                        var scheduler = this;
                        var view = scheduler.view();
                        var events = scheduler.dataSource.view();
                        var eventElement;
                        var event;
                        var elements = view.content.find("td");

                        $.each(elements, function (i, el) {
                            //$(el).removeClass("isablock");
                            $(el).css("background-color", "");
                            $(el).removeAttr("title");                      
                        });


                        //for (var idx = 0, length = events.length; idx < length; idx++) {
                        //    event = events[idx];
                        //    //get event element
                        //    eventElement = view.element.find("[data-uid=" + event.uid + "]");
                            
                        //    if (eventElement.hasClass('k-event')) {
                        //        eventElement.offset({ top: eventElement.offset().top + 15 });
                        //    }  
                        //    //set the backgroud of the element
                        //    eventElement.css("background-color", event.color);
                        //    //if it's a "block" which is in the view i will color the background of its slots 
                        //    if (event.editOptions && event.editOptions.isBlock && eventElement.length) {
                        //        $.each(elements, function (i, el) {
                        //            var slotData = scheduler.slotByElement(el)
                        //            if (slotData && slotData.startDate >= event.start && (slotData.endDate <= event.end || (event.isAllDay && slotData.startDate <= event.end))) {
                        //                $(el).css("background-color", event.editOptions.blockColour);
                        //                $(el).attr("title", event.editOptions.blockText);
                        //                return false; //perf issue
                        //            }
                        //        });
                        //    }                            kendoTooltip
                        //}

                       

                        //var allDayEventBlock = scheduler.wrapper.find(".k-scheduler-layout>tbody>tr:nth-child(1)");
                        //var dayViewTimesBlock = scheduler.wrapper.find(".k-scheduler-layout .k-scheduler-times");
                        //var tdNoWorkHours = scheduler.wrapper.find(".k-scheduler-layout .k-nonwork-hour");
                        //var prevCalContentRef = scheduler.wrapper.find(".k-scheduler-layout td.et-options #previewCalDayContent");

                        //allDayEventBlock.remove();
                        //dayViewTimesBlock.remove();
                        //tdNoWorkHours.closest("tr").remove();
                        //prevCalContentRef.attr("href", "#pn-modal-day-preview");

                        //$('div.k-event').each(function (i, e) {
                        //    var currTop = parseInt($(this).css('top'), 10);
                        //    $(this).css('top', currTop + 85 + 'px');
                        //})

                        $(function () {
                            //$("#mfkendoscheduler").kendoTooltip({
                            //    filter: ".k-event",
                            //    position: "top",
                            //    width: 300,
                            //    content: kendo.template($('#calendarPopupTemplate').html()),
                            //});

                            $("#mfkendoscheduler").kendoTooltip({
                                filter: ".k-event",
                                position: "top",
                                width: 300,
                                content: function (e) {
                                    var uid = $(e.target).attr("data-uid");
                                    var scheduler = $(e.target).closest("[data-role=scheduler]").data("kendoScheduler");
                                    var model = scheduler.occurrenceByUid(uid);                                     
                                    var template = $('<div style="text-align:left";></div>')
                                    var ul = $('<ul></ul>');

                                    $.each(self.toolTipItem, function (i, v) {                                        
                                        if (v.id == model.pk_value) {                                            
                                            for (item in v) {
                                                if (item != 'id') {
                                                    $(ul).append($('<li>'+ v[item] +'</li>'))
                                                }
                                            }
                                        }
                                    });

                                    $(template).append(ul);
                                    return template
                                    //var content = model.description;
                                    //return content;
                                }
                            });
                        });
                         
                        doModal(false);
                    },
                    messages: {
                        today: getObjectText('oggi'),
                        allDay: getObjectText('interaGiornata'),
                        date: getObjectText('data'),
                        time: getObjectText('orario'),
                        event: getObjectText('evento'),
                        showFullDay: getObjectText('showFullDay'),
                        showWorkDay: getObjectText('showWorkDay'),
                        views: {
                            day: getObjectText('giorno'),
                            week: getObjectText('settimana'),
                            workWeek: getObjectText('workWeek'),
                            agenda: "Agenda",
                            month: getObjectText('mese'),
                        }
                    },
                    editable: {
                        move: true,
                        resize: true
                    },
                    workDayStart: new Date("1900/1/1 7:00"),
                    workDayEnd: new Date("1900/1/1 19:00"),
                    //views: [                      
                    //    //{ type: "month", selected: false, eventsPerDay: 10, adaptiveSlotHeight: true, showWorkHours: false },
                    //    //{ type: "Multi-week", selected: false, eventsPerDay: 10, adaptiveSlotHeight: true, showWorkHours: false },
                    //    { type: MyWeekView, title: "my week view" , selected: true, eventsPerDay: 10, adaptiveSlotHeight: true, showWorkHours: false }
                    //],                     
                    views: [
                        //{
                        //    type: "day",
                        //    selected: false
                        //},
                        //{
                        //    type: "workWeek",
                        //    selected: false
                        //},
                        //{
                        //    type: "week",
                        //    selected: false
                        //},
                        //{
                        //    type: "month",
                        //    selected: false
                        //},
                        //{
                        //    type: "agenda",
                        //    selected: false
                        //},
                        {
                            type: MyWeekView,
                            title: "MyWeekView",
                            selected: true,
                            eventsPerDay: 10,
                            adaptiveSlotHeight: true,
                            showWorkHours: false
                        }
                    ],
                    //footer: false, // removes the footer
                    //allDaySlot:true,
                    //height: auto,
                    width: "fit-content",
                    timezone: "Gmt/UTC",
                    dateHeaderTemplate: kendo.template("<strong>#=kendo.toString(date, 'dd/MM')#</strong>"),
                    //height: 800,
                    //width: "auto",

                    dataSource: self.schedulerDs(),
                    moveEnd: function (e) {
                        self.dragAndDrop(e);
                    },
                    moveStart: function (e) {
                        kendoConsole.log(self.getLabels("movestart"), "info");
                    },
                    resizeEnd: function (e) {
                        self.dragAndDrop(e);
                    },
                    edit: function (e) {
                        e.preventDefault();
                        if (e.event.editOptions) {
                            doModal(true);
                            var filter = e.event.editOptions.filter ? e.event.editOptions.toJSON().filter : {};
                            var gridname = e.event.editOptions.gridName;
                            var MF = config().MF;
                            if (gridname)
                                MF.kendo.getGridObject({ gridName: gridname }).then(function (gridObject) {

                                    var ore_ = gridObject.dataSource.requestEnd;
                                    gridObject.dataSource.requestEnd = function (p) {
                                        ore_.call(this, p);
                                        if (p.type != "read" && !self.treeHidden)
                                            self.refreshTree();
                                    };
                                    gridObject.dataSource.filter = filter;
                                    var gid = "thehiddengrid_____";
                                    var hiddengridselector = "#" + gid;
                                    if ($(hiddengridselector).data("kendoGrid"))
                                        $(hiddengridselector).data("kendoGrid").destroy();
                                    $("#appcontainer").find(hiddengridselector).remove();
                                    $("#appcontainer").append('<div id="' + gid + '" style="display:none;"></div>');
                                    var promise = MF.kendo.appendGridToDom({
                                        kendoGridObject: gridObject,
                                        selector: $(hiddengridselector)
                                    });
                                    promise.done(function (kgrid) {
                                        doModal(false);
                                        kgrid.one("dataBound", function () {
                                            kgrid.editRow($(hiddengridselector + " tr:eq(1)"));
                                        });
                                    });
                                });
                            else
                                doModal(false);
                        }
                        e.sender.refresh();
                    }
                };

                $timeout(function () {
                    config().ready();
                }, 1000);

                self.treeFilters = { Operator: 'AND' };
                self.showFilters = false;
                self.showScheduler = true;
                self.filtersActive = false;
                self.options = config;
                self.detailInfo = [];
                self.showDetail = false;
                self.closeViewer = function () {
                    $("#layout-condensed-toggle").click();
                    $(".page-title").show();

                    self.showDetail ? self.showDetail = false : function () { $('#mastercancel__').closest('#reftree-tree-scheduler-controller').hide(1000); self.grid.element.show(); }();
                }
                //TODO full screen mode
                self.calcSchedulerClass = function () {
                    if (!self.treeHidden)
                        return "col-xs-10";
                    return "col-xs-12";
                }

                self.toggleFilter = function () {
                    self.showFilters = !self.showFilters;
                }
                //works oonly for non touch systems
                
                try {
                    //manage select all in mobile case 
                    if (self.grid.element.find(".rowselected__").length) {
                        var selecteddata = [];
                        $.each(self.grid.element.find(".rowselected__"), function (i, v) {
                            if ($(v).prop('checked') == true)
                                selecteddata.push($(v).closest("tr"));
                        });
                        sourceItemIds = $.map(selecteddata, function (v, i) {
                            return self.grid.dataItem(v)[self.grid.dataSource.options.schema.model.id];
                        });
                    }
                }
                catch (e) {
                    console.log(e);
                }

                self.checkboxesTemplate = {
                    template: "<input type='checkbox' # if (item.checked) {# checked #}#\
                                #if (!item.checkable){#\
                                disabled /> \
                                #}else{#\
                                  />\
                                #}#"
                };

                self.TreesDs = {
                    transport: {
                        read: {
                            url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                            dataType: "json",
                            contentType: "application/json",
                            data: { storedprocedure: window.schedulerTreeListLoaderSP, gridname: sourcegridname, id: sourceItemIds, caller: self.callContext },
                            type: "POST"
                        },
                        parameterMap: function (options, operation) {
                            return kendo.stringify(options);
                        }
                    },
                    schema: {
                        parse: function (data) {
                            //if (data[0].drows.length) {
                            //    if (data[0].drows[0].Table.length) {
                                    
                            //        //self.selectedTreeExpandedItem = data[0].drows[0].Table[0]
                            //    }
                            //}

                            return data[0].drows.length ? data[0].drows[0].Table : [];
                        }
                    }
                };
                //triggered on databound of the tree in order to load the form corresponding to the selected item in the drop down
                self.loadFilterForm = function (e) {
                    if (self.selectedTree.select() > -1) {
                        self.formName = self.selectedTree.dataItem(self.selectedTree.select()).Form;

                        if (self.singleThemati) {
                            if (!!e.node) {

                                $timeout(function () {
                                    if (!$("#gantttree").find('.k-first').find('.k-checkbox-wrapper:first').find('input:checkbox').is(":checked")) {
                                        $("#gantttree").find('.k-first').find('.k-checkbox-wrapper:first').find('input:checkbox').click();
                                    }
                                }, 500)
                            } else {
                                $timeout(function () {
                                    //$("#gantttree").find('li:first').find('span:first').click();
                                    $("#kendoSKTree").data("kendoTreeView").expand(".k-item");
                                }, 500)                                
                            }
                        }

                        

                    }
                        
                }

                self.filterHandler = function () {
                    if (!self.treeFilters)
                        return null;

                    var filterForDB = { Operator: self.treeFilters.Operator };
                    var valuesArray = [];
                    var obj = {}
                    if (self.treeFilters.Values) {
                        var obj = {};
                        $.each(self.treeFilters.Values, function (key, value) {
                            var iof = key.indexOf('__filterOperator');
                            if (iof != -1) {
                                var sk = key.substring(0, iof);
                                if (!obj[sk])
                                    obj[sk] = {
                                        condition: value
                                    };
                                else
                                    obj[sk].condition = value;
                            }
                            else {
                                if (!obj[key])
                                    obj[key] = { value: value };
                                else
                                    obj[key].value = value;
                            }

                        });
                    }
                    $.each(obj, function (key, value) {
                        valuesArray.push($.extend({ field: key }, value));
                    });
                    filterForDB.Values = valuesArray;
                    return filterForDB;
                }

                self.resetViewer = function () {
                    self.filtersActive = false;
                    self.treeFilters = { Operator: "AND", Values: {} };
                    $scope.$broadcast('schemaFormValidate');
                    self.selectedTreeExpandedItem = null;
                    self.tasks = [];
                    self.scheduler.setDataSource(self.schedulerDs());
                }

                self.onTreeChange = function (caller) {
                    if (!caller)
                        self.resetViewer();
                    self.treeLoaderSp = self.selectedTree.dataItem(self.selectedTree.select()).TreeContentSp;


                    //The data load of the tree items
                    self.selectedTreeData = new kendo.data.HierarchicalDataSource({
                        transport: {
                            read: {
                                url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
                                dataType: "json",
                                contentType: "application/json",
                                data: { storedprocedure: self.treeLoaderSp, from: self.dates.from, to : self.dates.to , gridData: { gridname: sourcegridname, id: sourceItemIds }, treeData: { id: self.selectedTree.value() }, treeFilter: self.filterHandler() },
                                type: "POST"
                                 
                            },
                            parameterMap: function (options, operation) {
                                options.treeData.expandedItem = self.selectedTreeExpandedItem ? self.selectedTreeExpandedItem : null;

                                if (!self.singleThemati) {
                                    self.singleThemati = self.selectedTreeExpandedItem ? false : true;
                                }
                                
                                return kendo.stringify(options);
                            }
                        },
                        schema: {
                            parse: function (data) {
                                if (!data[0].drows.length)
                                    return [];
                                $.each(data[0].drows[0].Table, function (i, v) {
                                    v.ColourTemat = v.ColourTemat && v.ColourTemat.indexOf(" ") != -1 ? v.ColourTemat.replace(/ /g, '') : v.ColourTemat;
                                    if (v.ColourTemat && v.ColourTemat.indexOf("#") == -1)
                                        v.ColourTemat = "#" + v.ColourTemat;
                                    if (!v.id)
                                        v.id = v.ThematiId + '_' + (v.ValueTemat ? v.ValueTemat : "");
                                    if (self.tematismiTreeCheckedNodes && v.id && self.tematismiTreeCheckedNodes[v.id] === true) {
                                        v.checked = true;
                                    }

                                   
                                });

                                return data[0].drows[0].Table;
                            }
                        }
                    });

                }

                //data of the expanded node.It's called before the data load 
                self.setTreeExpandedItem = function (e) {
                    self.selectedTreeExpandedItem = self.openTree.dataItem(e.node);
                }

                self.getTaskInfo = function (node) {
                    var tasks = []
                    if (node.tasks && node.tasks.indexOf('[') != -1) {
                        try {
                            tasks = JSON.parse(node.tasks);
                        }
                        catch (e) {
                            console.log(node.tasks);
                        }
                    }
                    return $.map(tasks, function (v, i) {
                        //v.color = node.ColourTemat;
                        return v;
                    });
                }

                self.getTematFromTree = function (e) {
                    function arraysEqual(arr1, arr2) {
                        if (arr1.length !== arr2.length)
                            return false;
                        for (var i = arr1.length; i--;) {
                            if (arr1[i] !== arr2[i])
                                return false;
                        }

                        return true;
                    }

                    function uncheckChildren(nodedata, isfirst) {
                        if (nodedata.checked && !isfirst)
                            nodedata.set("checked", false);
                        if (nodedata.items)
                            $.each(nodedata.items, function (i, v) {
                                uncheckChildren(v, false);
                            });
                    }

                    // Calculate intersection of multiple array or object values.
                    function intersect(arrList) {
                        var arrLength = Object.keys(arrList).length;
                        // (Also accepts regular objects as input)
                        var index = {};
                        for (var i in arrList) {
                            for (var j in arrList[i]) {
                                var v = arrList[i][j];
                                if (index[v] === undefined) index[v] = {};
                                index[v][i] = true; // Mark as present in i input.
                            };
                        };
                        var retv = [];
                        for (var i in index) {
                            if (Object.keys(index[i]).length == arrLength) retv.push(i);
                        };
                        return retv;
                    };

                    function getTasksIntersection() {
                        var all = []
                        $.each(self.checkedThemes, function (key, value) {
                            all.push(value.tasks);
                        });
                        return intersect(all);
                    }
                    //Build the task list based on checked items
                    function buildTasks(data, newtasks, isIntersection) {
                        if (!newtasks)
                            newtasks = [];
                        if (data.checked) {
                            //se tra i nuovi file selezionati non c'e' quello del nodo corrente deseleziono il nodo
                            $.each(self.getTaskInfo(data), function (i, obj) {
                                if (isIntersection) {
                                    if (self.intersectTasks.indexOf(obj.id.toString()) != -1)
                                        newtasks.push(obj);
                                }
                                else
                                    newtasks.push(obj);

                            });
                        }
                        if (data.items)
                            $.each(data.items, function (i, v) {
                                buildTasks(v, newtasks, isIntersection);
                            });
                    }

                    //recur to top from node's parent
                    function uncheckParentsWithValues(node) {
                        var parentnode = self.openTree.parent(node);
                        if (!parentnode || !parentnode.length)
                            return;
                        var parentdata = self.openTree.dataItem(self.openTree.parent(node));
                        if (parentdata.checkable && parentdata.checked) {
                            //se il nodo ha handles ed un file allora lo deseleziono per non avere conflitti
                            if (self.getTaskInfo(parentdata).length) {
                                parentdata.set("checked", false);
                            }
                        }
                        //recursively uncheck all parents with values 
                        uncheckParentsWithValues(parentnode);

                    }
                    function getCheckedThemes(node, themes) {
                        var theme = node.Treedesc ? node.Treedesc.split('|')[0] : '';
                        var tasks = self.getTaskInfo(node);
                        if (tasks.length && node.checked && theme) {
                            if (!themes[theme])
                                themes[theme] = {
                                    tasks: []
                                };
                            $.each(tasks, function (k, value) {
                                if (themes[theme].tasks.indexOf(value.id) == -1)
                                    themes[theme].tasks.push(value.id);
                            });

                        }
                        if (node.items)
                            $.each(node.items, function (i, v) {
                                getCheckedThemes(v, themes);
                            });
                    }
                    if (e) {   //if the method is called by the tree i have to check if the last check is modifying the checked set
                        //task dell' ultimo nodo checked
                        var nodedata = e.sender.dataItem(e.node);
                        var uncheckallbutcurrent = false;
                        //a node without tasks
                        if (!self.getTaskInfo(nodedata).length) {
                            //still haven't loaded data...
                            if (nodedata.hasChildren && nodedata.items && !nodedata.items.length) {
                                nodedata.set("checked", false);
                                self.openTree.expand(self.openTree.findByUid(nodedata.uid));
                                return;
                            }
                            $.each(nodedata.items, function (i, v) {
                                v.set("checked", nodedata.checked ? nodedata.checked : false);
                            });
                        }
                        else
                            uncheckallbutcurrent = true;

                        if (nodedata.checked) {
                            uncheckParentsWithValues(e.node);
                            if (uncheckallbutcurrent && self.getTaskInfo(nodedata).length)
                                uncheckChildren(nodedata, true);
                        }
                    }

                    self.checkedThemes = {};
                    newtasks = [];
                    $.each(self.openTree.dataSource.data(), function (i, v) {
                        getCheckedThemes(v, self.checkedThemes);
                    });

                    self.intersectTasks = getTasksIntersection();
                    //D.T: P.VARI Request 21/06/2018 don't intersect in scheduler's tree. UNION is then the only operation
                    //if (Object.keys(self.checkedThemes).length > 1) //more than one theme has been selected --> INTERSECT
                    //{
                    //    $.each(self.openTree.dataSource.data(), function (i, v) {
                    //        buildTasks(v, newtasks, true);
                    //    });
                    //}
                    //else //all the selected items have the same theme --> UNION
                    //{
                    $.each(self.openTree.dataSource.data(), function (i, v) {
                        buildTasks(v, newtasks, false);
                    });
                    //}
                    self.tasks = newtasks;
                    var minDate;
                    $.each(self.tasks, function (i, v) {
                        if (!minDate || (new Date(v.start) < minDate))
                            minDate = new Date(v.start);
                    });
                    self.scheduler.setDataSource(self.schedulerDs());
                    self.scheduler.date(minDate);
                };

                self.filterTree = function (form) {
                    $scope.$broadcast('schemaFormValidate');
                    if (form.$valid) //reload the tree with the updated filter values 
                    {
                        self.showFilters = false;
                        self.filtersActive = true;
                        self.manageFilterForUser('apply').then(function () {
                            self.onTreeChange('filter');
                            $timeout();
                            self.tasks = [];
                            self.scheduler.setDataSource(self.schedulerDs());
                        });
                    }
                }

                self.undoFilterTree = function () {
                    self.showFilters = false;
                    self.filtersActive = false;
                    self.treeFilters = { Operator: "AND", Values: {} };
                    $scope.$broadcast('schemaFormValidate');
                    self.selectedTreeExpandedItem = null;
                    self.manageFilterForUser('remove').then(function () {
                        self.onTreeChange('filter');
                        $timeout();
                        self.tasks = [];
                        self.scheduler.setDataSource(self.schedulerDs());
                    });
                }

                self.manageFilterForUser = function (useraction) {
                    var deferred = $.Deferred();
                    config().MF.api.get({
                        storedProcedureName: config().userSessionManagementSp,
                        data: {
                            useraction: useraction,
                            gridData: { gridname: sourcegridname, id: sourceItemIds },
                            treeData: { id: self.selectedTree.value() },
                            treeFilter: self.filterHandler()
                        }
                    })
                        .then(function (result) {
                            //anytime the user applies a filter the selected node is reset
                            if (useraction == "apply")
                                self.selectedTreeExpandedItem = null;
                            deferred.resolve();
                        }, function (err) {
                            console.log(err);
                        });
                    return deferred.promise();
                }

                self.showActionsNew = function () {

                    self.initBlockGridInfoCadFilterStart = {
                        logic: 'and',
                        filters: [
                            {
                                operator: 'eq',
                                field: 'AS_ASSET_ID',
                                value: '',
                            }
                        ]
                    }



                    var selectedTasks = self.scheduler.select();
                    config.rowData = e.sender.dataSource._data[0];
                    config.pk = "LE_VERACT_ID"
                    config.entityname = "core.EXP_VI_ASSET_L";

                    config.actionCallback = function (p) {
                        if (p.type != "read" && !!p.type) {
                            self.actionCallback(p);
                        }
                    }
                    config.multiAction = false;

                    if (e.sender.dataSource.data().length > 1) {

                        config.multiAction = self.fileInfo[self.fileInDetail.fileName].multiActionFile;

                        e.sender.tbody.find('tr').addClass('k-state-selected');

                        if (config.onClickMultiAction) {
                            self.actionCallback();
                            doModal(false);
                            return
                        }
                    }
                    doModal(false);
                    getAngularControllerElement("reftreeDirectiveController", config);

                     
                    self.activateGridForAction = false;
                    self.gridForAction = [];

                    var MF = config().MF;
                    var selectedTasks = self.scheduler.select();
                    var st = [];
                    $.each(selectedTasks.events, function (i, v) {
                        //for some strange reason if i click the button the selected items loose the selected CSS. Let's re-add it... 
                        $("[data-uid=" + v.uid + "]").addClass("k-state-selected");
                        st.push(v.toJSON());
                    });


                    MF.api.get({
                        storedProcedureName: window.schedulerActionSP,
                            caller: self.callContext,
                            treeData: {
                                id: self.selectedTree.value()
                            },
                            currentSelection: st,
                            currentDetail: self.currentDetailIdentifier
                        })
                        .then(
                            function (result) {
                                if (!result.length) {
                                    return;
                                }

                                $timeout(function () {

                                    $.each(result, function (i,v) {
                                        self.gridForAction.push(v);

                                    })
                                    self.activateGridForAction = true;

                                }, 500)


                                

                            },
                            function (err) {
                                 
                            },
                        );

                    //getAngularControllerElement("reftreeDirectiveController", config);
                }

                self.onDataBoundGridNameAction = function onDataBoundGridNameAction(e) {
                    if (e.sender.dataSource.data().length > 0) {

                         
                    }
                    else {
                         
                    }
                }

                self.showActions = function () {
                    if (!window.schedulerActionSP) {
                        kendoConsole.log("schedulerActionSP window variable has not been set in AdminAreaCustomizations.js!");
                        return;
                    }
                    var selectedTasks = self.scheduler.select();
                    //getAngularControllerElement("reftreeDirectiveController", config);

                    var st = [];
                    $.each(selectedTasks.events, function (i, v) {
                        //for some strange reason if i click the button the selected items loose the selected CSS. Let's re-add it... 
                        $("[data-uid=" + v.uid + "]").addClass("k-state-selected");
                        st.push(v.toJSON());
                    });

                    window.jqueryEditRefTreeGrid = {
                        rowData: st[0]
                    }

                    openActionsTooltip({
                        requestOptions: {
                            caller: self.callContext,
                            treeData: {
                                id: self.selectedTree.value()
                            },
                            currentSelection: st,
                            currentDetail: self.currentDetailIdentifier
                        },
                        storeProcedureName: window.schedulerActionSP,
                        accordionId: "schedulerViewerActionsAccordion",
                        element: $('#actions___scheduler')
                    });
                }
                //tree refresh handling
                self.storeTematismiTreeState = function storeTematismiTreeState() {
                    self.tematismiTreeCheckedNodes = {};
                    self.forEachCheckedInput(function ($li, $checkedInput, tree) {
                        var data = tree.dataItem($li);
                        self.tematismiTreeCheckedNodes[data.id] = true;
                        self.exploreTreeTilRoot($li);
                    });
                };

                self.exploreTreeTilRoot = function exploreTreeTilRoot($li, path) {
                    var tree = self.openTree;
                    if (!path) {
                        path = [];
                    }
                    var parentNode = tree.parent($li);
                    if (!parentNode || !parentNode.length) {
                        if (!path.length) {
                            return;
                        }
                        return self.storePathToExplore(path);
                    }
                    var parentData = tree.dataItem(parentNode);
                    // optimization, further path is already contained in path to open
                    if (self.tematismiTreeCheckedNodes[parentData.id] === false) {
                        return;
                    }
                    if (!(parentData.id in self.tematismiTreeCheckedNodes)) {
                        self.tematismiTreeCheckedNodes[parentData.id] = false;
                    }
                    path.unshift(parentData.id);
                    self.exploreTreeTilRoot(parentNode, path);
                };

                self.storePathToExplore = function storePathToExplore(path) {
                    self.tematismiTreeOpenPaths.push(path);
                };

                self.refreshTree = function refreshTree() {
                    self.startToday = true;

                    self.storeTematismiTreeState();
                    self.openTree.one('dataBound', function () {
                        self.openTematismiTree();
                    });
                    self.onTreeChange();

                     
                    $timeout(function () {
                        
                        self.getToolTip();
                    }, 1000);
                };

                self.openTematismiTree = function openTree() {
                    var tree = self.openTree;
                    var path = path = self.tematismiTreeOpenPaths.shift();
                    if (!path) {
                        $timeout(function () {
                            self.getTematFromTree();
                        }, 1000);

                        return;
                    }
                    if (!tree) {
                        return;
                    }
                    tree.expandPath(path, self.openTematismiTree);
                };

                self.forEachCheckedInput = function forEachCheckedInput(func) {
                    var tree = self.openTree;
                    tree
                        .element
                        .find('input:checked')
                        .each(function (i, checkedInput) {
                            var $checkedInput = $(checkedInput);
                            var $li = checkedInput.closest('li');
                            return func($li, $checkedInput, tree);
                        }
                        );
                };
                 
                //end 
            }
        ]);
});