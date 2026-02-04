// JavaScript source code
//inside the functions "this" is the controller scope (e.g onChange)
(function () {
    var extension = {};


    extension.dateFrom = function () {
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        firstDay.setHours(0);
        firstDay.setMinutes(0);
        firstDay.setSeconds(0);
        return firstDay;
    };
    extension.dateTo = function () {
        var date = new Date();
        var lastDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        lastDay.setHours(0);
        lastDay.setMinutes(0);
        lastDay.setSeconds(0);
        return lastDay;
    };


    extension.mDateFrom = extension.dateFrom();
    extension.mDateTo = extension.dateTo();
    extension.person = "";
    extension.project = "";

    extension.initialFilter = {
        type: "customFilter", logic: 'and', filters: [{ field: "Date", operator: "gte", value: extension.mDateFrom, type: "customFilter" }
            , { field: "Date", operator: "lte", value: extension.mDateTo, type: "customFilter" }
            , { field: "FullDescription", operator: "contains", value: extension.person, type: "customFilter" }
            , { field: "ProjectDescription", operator: "contains", value: extension.project, type: "customFilter" }]
    };

    extension.onChange = function () {
        this.initialFilter = {
            type: "customFilter", logic: "and", filters: [{ field: "Date", operator: "gte", value: this.mDateFrom, type: "customFilter" }
                , { field: "Date", operator: "lte", value: this.mDateTo, type: "customFilter" }
                , { field: "FullDescription", operator: "contains", value: this.person, type: "customFilter" }
                , { field: "ProjectDescription", operator: "contains", value: this.project, type: "customFilter" }]
        };
    }

    define([], function () {
        return extension;
    });

})()