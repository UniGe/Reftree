define(["angular", "MagicSDK"], function (angular, MF) {
    angular.module("magicTimesheet", [])
        .directive("magicTimesheet",
            function () {
                return {
                    restrict: "E",
                    scope: {},
                    bindToController: {
                        name: "@",
                        period: "@",
                        range: "=",
						projectid: "=",
						options: "=",
						selector:"@"
                    },
                    templateUrl: "/Magic/Views/Templates/Directives/magic-timesheet.html",
                    controllerAs: "t",
                    controller: ["$scope",
                        function ($scope) {
                            var self = this;
                            
                            self.lang = {
                                save: getObjectText("save"),
                                toggleSpreadsheet: getObjectText("toggleSpreadsheet")
                            };
                            self.showSpreadSheet = true;
                            self.numItems = self.options.numItems;
                            self.pageElementsLimit = self.options.pageElementsLimit;
                            if (self.numItems && self.pageElementsLimit && self.numItems > self.pageElementsLimit) { 
                                self.showPages=1;
                            }

                            self.pageNumber = 1;
                            self.spClass = "col-md-12";
                            self.wsClass = "";
							self.wsStatus = false;
							if (!self.selector)
								self.selector = "#mf_spreadsheet";
                            self.$saveBtn = $("#btnsave");
                            self.getFirstDayInPeriod = function (currentDate) {
                                if (self.period == "year") {
                                    var date = (!currentDate) ? new Date() : currentDate, y = date.getFullYear();
                                    var firstDay = new Date(y, 0, 1);
                                    return firstDay;
                                }
                                else
                                    return getMonday(currentDate);
                            }

                            self.setPage = function (increment) {
                                self.pageNumber += increment;
                                if (!self.pageNumber) {
                                    self.pageNumber = 1;
                                }
                                self.calOffset(0);
                            }
                            self.showNext = function () {
                                return !(self.pageNumber * self.pageElementsLimit >= self.numItems)
                            }

                            self.showPrev = function () {
                                return !(self.pageNumber === 1)
                            }
                            self.showingElements = function () {
                                let start = ((self.pageNumber -1) * self.pageElementsLimit)+1;
                                let end = start + self.pageElementsLimit-1;

                                if (end > self.numItems) {
                                    end = self.numItems;
                                }
                                return `${start}-${end} su ${self.numItems} elementi`
                            }

                            self.addFilterSubPeriod = function(dateTo)
                            {
                                if (!self.period || self.period == "week")
                                    dateTo.setDate(dateTo.getDate() + 6);
                                if (self.period == "year")
                                {
                                    dateTo.setDate(31);
                                    dateTo.setMonth(11);
                                    dateTo.setYear(dateTo.getFullYear());
                                }
                            }
                            self.addSubPeriod = function(dateTo, offset)
                            {
                                if (!self.period || self.period == "week")
                                    dateTo.setDate(dateTo.getDate() + (offset * 7));
                                if (self.period == "year")
                                    if (offset > 0) {
                                        dateTo.setDate(31);
                                        dateTo.setMonth(11);
                                        dateTo.setYear(dateTo.getFullYear() + offset);
                                    }
                                    else {
                                        dateTo.setDate(1);
                                        dateTo.setMonth(0);
                                        dateTo.setYear(dateTo.getFullYear() + offset);
                                    }

                            }
                            self.buildSpreadSheet = function (cal) {
                                if (cal)
                                    self.$saveBtn.removeClass("redbutton");
                                var monday = cal ? self.getFirstDayInPeriod(cal.current()) : self.getFirstDayInPeriod(new Date());
                                MF.kendo.getSpreadSheetObject(self.name).done(function (res) {
                                    $.when(MF.kendo.appendSpreadSheetToDom({ spreadSheetObject: res, selector: self.selector, filter: self.buildDateFilter(cal, self.projectid), dataValidator: self.cellValidator(), data: $.extend({ Project_ID: self.projectid, PageNumber: self.pageNumber }, self.options) })).then(function (spreadsheet) {
                                        //writes days on header for weeks....
                                        self.evaluate1stRow(monday, spreadsheet);
                                        $(self.selector).data("kendoSpreadsheet").unbind("change");
                                        $(self.selector).data("kendoSpreadsheet").bind("change", function (arg) {
                                            self.$saveBtn.addClass("redbutton");
                                        });
                                        var datepickercfg = {
                                            change: function (e) {
                                                monday = self.buildSpreadSheet(this);
                                                self.evaluate1stRow(monday, spreadsheet);
                                            }
                                        }
                                        if (self.period == "year")
                                            $.extend(datepickercfg, {
                                                start: "decade",
                                                depth: "decade",
                                                format: "yyyy"
                                            });

                                        if (!$("#weekselector").data("kendoCalendar"))
                                            $("#weekselector").kendoCalendar(datepickercfg);
                                    });
                                });

                                return monday;
                            }
                            self.buildSpreadSheet();
                            $scope.$watch('t.projectid', function () {
                                if (!self.projectid) {
                                    self.projectid = 0;
                                    return;
                                }
                                self.buildSpreadSheet($("#weekselector").data("kendoCalendar"));
                            });
                            self.calOffset = function (offset) {
                                self.$saveBtn.removeClass("redbutton");
                                $(self.selector).data("kendoSpreadsheet").unbind("change");
                                var cal = $("#weekselector").data("kendoCalendar");
                                if (!cal)
                                    return;
                                var date = new Date(cal.current().toString());
                                self.addSubPeriod(date, offset);
                                cal.value(date);
                                cal.trigger("change");
                            }
                            //scrive il nome ed il numero del giorno della settimana (period = "week")
                            self.evaluate1stRow = function (monday, spreadsheet) {
                                if (!self.period || self.period == "week") {
                                    var date = new Date(monday.toString());
                                    var range = ["C1", "D1", "E1", "F1", "G1", "H1", "I1"]
                                    for (var i = 0; i < 7; i++) {
                                        var literal = kendo.toString(date, "ddd d");
                                        date.setDate(date.getDate() + 1);
                                        spreadsheet.activeSheet().range(range[i]).value(literal);
                                    }
                                }
                            }
                            self.buildDateFilter = function (cal) {
                                var currentDate = new Date();
                                if (cal)
                                    currentDate = cal.current();
                                var dateFrom = self.getFirstDayInPeriod(currentDate);
                                if ($(self.selector).data("MF"))
                                    $(self.selector).data("MF").dateFrom = dateFrom;
                                else
                                    $(self.selector).data("MF", { dateFrom: dateFrom });
                                var dateTo = new Date(dateFrom.toString());
                                self.addFilterSubPeriod(dateTo);
                                $("#curdate").text(kendo.toString(dateFrom, "dddd d MMMM yyyy") + " - " + kendo.toString(dateTo, "dddd d MMMM yyyy"));
                                return { logic: "AND", filters: [{ field: "dateFrom", operator: "gte", value: self.adjustDates(dateFrom,true) }, { field: "dateTo", operator: "lte", value: self.adjustDates(dateTo,false,true) }] };
                            }
                            self.appendDataParameter = function (par)
                            {
                                if (self.projectid)
                                    par.Project_ID = self.projectid;
                                if (self.range && self.range.data && self.range.data.columns)
                                {
                                    var from = self.range.data.columns[0];
                                    var to = self.range.data.columns[1];
                                    $.extend(par, { dataColumnFrom: from, dataColumnTo: to });
                                }
                            }
                            
                            self.toggleWeekSelector = function () {
                                //adjust spreadsheet width ... not adaptive
                                self.wsStatus = !self.wsStatus;
                                if (self.wsStatus) {
                                    self.wsClass = "col-md-2";
                                    self.spClass = "col-md-10";
                                }
                                else
                                    self.spClass = "col-md-12";
                                setTimeout(function () {
                                    kendo.resize($(self.selector))
                                }, 300);
                            }
                            self.toggle = function () {
                                self.showSpreadSheet = !self.showSpreadSheet;
                            }
                            self.save = function () {
                                var spreadsheet = $(self.selector).data("kendoSpreadsheet");
                                var payload = spreadsheet.toJSON();
                                payload.currentDateFrom = self.adjustDates($(self.selector).data("MF").dateFrom, true);
                                self.appendDataParameter(payload);
                                requireConfigAndMore(["MagicSDK"], function (MF) {
                                    MF.api.get({
                                        storedProcedureName: $(self.selector).data("MF").writeSP, data: payload, errorCallBack: function (err) {
                                            kendoConsole.log(err.responseJSON.content, true);
                                        }
                                    }).then(function () {
                                        kendoConsole.log(getObjectText("updateok"), false);
                                        //reload
                                        self.calOffset(0);
                                        //refresh grid if present
                                        if ($(".k-grid[gridname=TimeSheet]").length)
                                            $(".k-grid[gridname=TimeSheet]").data("kendoGrid").dataSource.read();
                                    });
                                });
                            }
                            self.adjustDates = function (date,adjTimeFrom,adjTimeTo) {
                                var offset = new Date().getTimezoneOffset();
                                //offset will be in minutes. Add/subtract the minutes from your date
                                date.setMinutes(date.getMinutes() - offset);
                                if (adjTimeFrom) {
                                    date.setHours(0);date.setMinutes(0);date.setSeconds(0);date.setMilliseconds(0);
                                }
                                if (adjTimeTo) {
                                    date.setHours(23);date.setMinutes(59);date.setSeconds(59);date.setMilliseconds(999);
                                }
                                return toTimeZoneLessString(date);
                            }
                            self.cellValidator = function () {
                                var arr =  [{
                                    range: self.range.data.columns,
                                    validation: {
                                        dataType: "numeric",
                                        comparerType: "between",
                                        from: self.range.data.from,//-0.01,
                                        to: self.range.data.to,//24,
                                        allowNulls: false,
                                        type: "reject",
                                        titleTemplate: getObjectText("invalidvalue"),
                                        messageTemplate: getObjectText(self.range.data.message)//"mustbeanhour")
                                    }
                                }]
                                if (self.range.dropclosure)
                                arr.push(
                                {
                                    range: self.range.dropclosure.columns,
                                        validation: {
                                            dataType: "list",
                                            from: '{ "X", "x" }',
                                            allowNulls: true,
                                            showButton: true,
                                            type: "reject",
                                            titleTemplate: getObjectText("invalidvalue"),
                                            messageTemplate: getObjectText("mustbex")
                                    }
                                        });
                                if (self.range.presence)
                                    arr.push(
                                        {
                                            range: self.range.presence.columns,
                                            validation: {
                                                dataType: "list",
                                                from: '{ "P", "p","A", "a" }',
                                                allowNulls: true,
                                                showButton: true,
                                                type: "reject",
                                                titleTemplate: getObjectText("invalidvalue"),
                                                messageTemplate: getObjectText("mustbeAoP")
                                            }
                                        });
                                return arr;
                            }
                          
                        }
                    ]
                }
            });
});