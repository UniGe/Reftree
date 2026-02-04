define(['angular', 'angular-sanitize'], function (angular) {
    var app = angular
    .module('DataReader', ['ngSanitize'])
    .controller('DataReaderController', ['$http', 'config', '$q', '$filter', '$sce', function ($http, config, $q, $filter, $sce) {
        if (!config)
            throw "No config provided for DataReader";

        /*--config
            contentTemplate, listTemplate: templates to render list items and content; where u can use the keys of the object
                which get replaced by the objects value or by "" if not found like in this example: object: {sepp: "franz"}
                contentTemplate: <div>{sepp}</div> rendered template: <div>franz</div>; to access keys in subobjects use the dot-notation ex. {key.subarraykey}
                u can also pass a function as template which gest the current object as parameter and has to return a string
            dataList: array of objects || function wich returns $http or $q with data as an array of objects
            md_col_xContent: value of the bootstrap md-col class where 100% are divided into 12 pieces
            filterKeys: string "*" to filter for all object keys even on subojbects || array with keys to filter in dot-notation

            show json only - with ace?
            show list of objects in split
        */

        var self = this;
        self.currentObject = {};
        self.dataList = [];
        self.getData = null;
        self.currentData = config.currentData || {};
        self.filterKeys = config.filterKeys || null;
        self.filterValue = "";

        self.localization = {
            filter: getObjectText("filter")
        };

        if (typeof config.dataList === 'function') {
            self.getData = function () {
                config.dataList($http, $q).then(function (res) {
                    if (res.data)
                        self.dataList = res.data;
                    else
                        self.dataList = res;
                    self.currentObject = self.dataList[0] || {};
                });
            };
            self.getData();
        }
        else {
            self.dataList = config.dataList;
            self.currentObject = self.dataList[0] || {};
        }

        self.listClass = function () {
            return 12 - self.editorClass();
        };

        self.editorClass = function () {
            return self.dataList.length > 1 ? (config.md_col_xContent || 9) : 12;
        };

        self.getContentHtml = function () {
            if (config.contentTemplate)
                return self.renderTemplate(config.contentTemplate, self.getCurrentObject());
            return "<pre>" + JSON.stringify(self.getCurrentObject()) + "</pre>";
        };

        self.getListHtml = function (object) {
            if (config.listTemplate)
                return self.renderTemplate(config.listTemplate, object);
            return JSON.stringify(object);
        };

        self.getCurrentObject = function () {
            return self.currentObject;
        };

        self.renderTemplate = function (template, object) {
            if (typeof template === 'function') {
                if ($.isEmptyObject(object)) return "";
                return $sce.trustAsHtml(template(object));
            }
            else {
                var re = /{([\w\.]+)}/g;
                return $sce.trustAsHtml(template.replace(re, function (match, key) {
                    return getObjectValueByPointNotation(key, object);
                }));
            }
        };

        self.getListData = function () {
            if (self.filterValue && config.filterKeys) {
                if (config.filterKeys === "*")
                    return $filter("filter")(self.dataList, { $: self.filterValue });
                return $filter("filter")(self.dataList, function (v, k) {
                    var found = false;
                    $.each(config.filterKeys, function (kk, vv) {
                        vv = getObjectValueByPointNotation(vv, v);
                        if (vv && vv.toLowerCase().indexOf(self.filterValue.toLowerCase()) != -1) {
                            found = true;
                            return false;
                        }
                    });
                    return found
                });
            }
            return self.dataList;
        };

        self.setCurrentObject = function (object) {
            self.currentObject = object;
        };

    }]);

    function getObjectValueByPointNotation(key, object) {
        var value = object;
        $.each(key.split("."), function (k, v) {
            if (value[v])
                value = value[v];
            else {
                value = "";
                return false;
            }
        });
        return value;
    }

    return app;
});