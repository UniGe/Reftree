//inside the functions "this" is the controller scope (e.g onChange)
(function () {

    var extension = {};

    extension.year = new Date().getFullYear();

    extension.dateFrom = function () {
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), 0, 1);
        firstDay.setHours(0);
        firstDay.setMinutes(0);
        firstDay.setSeconds(0);
        return firstDay;
    };
    extension.dateTo = function () {
        var date = new Date();
        var lastDay = new Date(date.getFullYear(), 11, 31);
        lastDay.setHours(0);
        lastDay.setMinutes(0);
        lastDay.setSeconds(0);
        return lastDay;
    };

    extension.financial = true;
    extension.asset = true;

    extension.mDateFrom = extension.dateFrom();
    extension.mDateTo = extension.dateTo();

    extension.yearChange = function () {
        if (this.year.length == 4) {
            this.mDateFrom = new Date(this.year, 0, 1);
            this.mDateTo = new Date(this.year, 11, 31);
            this.onChange();
        }        
    }

    extension.initialFilter = {
        type: "customFilter", logic: 'and', filters: [{ field: "Year", operator: "eq", value: extension.year, type: "customFilter" }
                                    , { field: "DateFrom", operator: "gte", value: extension.mDateFrom, type: "customFilter" }
                                    , { field: "DateTo", operator: "lte", value: extension.mDateTo, type: "customFilter" }]
    };

    extension.onChange = function () {
        if ((this.financial) && (this.asset)) {
            this.initialFilter = {
                type: "customFilter", logic: "and", filters: [{ field: "Year", operator: "eq", value: this.year, type: "customFilter" }
                                                            , { field: "DateFrom", operator: "gte", value: this.mDateFrom, type: "customFilter" }
                                                            , { field: "DateTo", operator: "lte", value: this.mDateTo, type: "customFilter" }]
            };
        }
        else {
            this.initialFilter = {
                type: "customFilter", logic: "and", filters: [{ field: "Year", operator: "eq", value: this.year, type: "customFilter" }
                                                        , { field: "DateFrom", operator: "gte", value: this.mDateFrom, type: "customFilter" }
                                                        , { field: "DateTo", operator: "lte", value: this.mDateTo, type: "customFilter" }
                                                        , { field: "financial", operator: "eq", value: this.financial, type: "customFilter" }
                                                        , { field: "asset", operator: "eq", value: this.asset, type: "customFilter" }]
            };
        }
    }
 
    define([], function () {
        return extension;
    });

})()