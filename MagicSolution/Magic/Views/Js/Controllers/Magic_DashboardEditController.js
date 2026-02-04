(function () {
    var angular;
    var MF;

    define(["angular", "MagicSDK", "angular-kendo", "angular-filter"], function (a, m) {
        angular = a;
        MF = m;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = getAngularControllerRootHTMLElement("DashboardEdit");
        $("#grid").html(element);
        angular.bootstrap(element, ["DashboardEdit"]);
    }

    function controller(angular, MF) {
        angular
            .module("DashboardEdit", ["kendo.directives", "angular.filter"])
            .controller("DashboardEditController", ["$scope", "$http", "$filter", "$timeout", function ($scope, $http, $filter, $timeout) {
                var self = this,
                    bootstrapBreakpoints = ["xs", "sm", "md"],
                    bootstrapColumns = {
                        2: "1/6",
                        3: "1/4",
                        4: "1/3",
                        6: "1/2",
                        8: "2/3",
                        9: "3/4",
                        12: "Full Width"
                    },
                    contentsToRemove = [],
                    regex = /col-(xs|sm|md)-(2|3|4|6|8|9|12)/g,
                    convertContents = function (contents) {
                        $.each(contents, function (k, content) {
                            contents[k].splittedClasses = ["", "", "col-md-12", content.columnClass.replace(regex, "").trim()];
                            while (m = regex.exec(content.columnClass)) {
                                contents[k].splittedClasses[bootstrapBreakpoints.indexOf(m[1])] = m[0];
                            }
                        });
                        return contents;
                    };

                self.contentFormUrl = "/Magic/Views/Templates/HtmlTemplates/dashboard-content-form.html";
                self.tabGroups = {};
                self.numberData = {
                    min: 0,
                    max: 100,
                    format: "0"
                };
                self.dropdownData = {
                    dataTextField: "label",
                    dataValueField: "value"
                };
                self.data = {
                    tabs: [],
                    groups: [],
                    contents: [],
                    contentTypes: [],
                    contentObjects: {}
                };

                self.lang = {
                    configureContent: "Configure Content",
                    position: "Position",
                    active: "active",
                    none: "None",
                    additionalClass: "additional Class",
                    contentType: "Content Type",
                    contentObject: "Content Object",
                    group: "Group",
                    tab: "Tab",
                    widthClasses: "Width Classes",
                    save: getObjectText('save'),
                    addContent: "Add Content",
                    addTab: "Add Tab",
                    createDashboardContent: getObjectText("createDashboardContent")
                };

                self.bootstrapClasses = {};
                $.each(bootstrapBreakpoints, function (k, bp) {
                    self.bootstrapClasses[bp] = bp != "md" ? [{
                        value: "",
                        label: self.lang.none
                    }] : [];

                    $.each(bootstrapColumns, function (k, v) {
                        self.bootstrapClasses[bp].push({
                            value: "col-" + bp + "-" + k,
                            label: v
                        });
                    });
                });

                self.json = function (val) {
                    return JSON.stringify(val, null, "   ");
                };

                self.setContentObjectId = function (content) {
                    $timeout(function () {
                        content.contentObjectId = self.data.contentObjects[content.contentTypeId].length ? self.data.contentObjects[content.contentTypeId][0].value : null;
                        self.setMagicGridName(content);
                    });
                };

                self.setMagicGridName = function (content) {
                    if (self.getContentType(content.contentTypeId).label == "GRID")
                        content.MagicGridName = $filter('where')(self.data.contentObjects[content.contentTypeId], { value: content.contentObjectId })[0].label;
                    else
                        content.MagicGridName = null;
                };

                self.setPosition = function (content) {
                    $timeout(function () { content.position = parseInt(content.position) });
                };

                $http.get("/api/Magic_Dashboard/getDashboardData").then(function (res) {
                    res.data.contents = convertContents(res.data.contents);
                    

                    $.each(res.data.groups, function (k, group) {
                        if (!(group.tabId in self.tabGroups))
                            self.tabGroups[group.tabId] = [group];
                        else
                            self.tabGroups[group.tabId].push(group);
                    });

                    self.data = res.data;
                });

                self.redirectToObject = function (object) {
                    if (!self.$form.$dirty || confirm("You have not saved modifications\nAre you sure to leave the page?")) {
                        var gridcode, functionid, filterField, filterValue, location;

                        if (object && object.contentTypeId) {
                            //content object redirect
                            filterValue = $.map(self.data.contentObjects[object.contentTypeId], function (v) { if (v.value == object.contentObjectId) return v.label; })[0];
                            filterField = "Description";
                            //D.T: change from id to GUIDS in order to manage different DB IDs
                            switch (parseInt(object.contentTypeId)) {
                                case 1:
                                    gridcode = "Magic_DashBoardIndicators";
                                    functionid = 1061;
                                    location = "75FA59E3-E10A-4AB7-8299-65568E29AF8E";//"/app#/function/1174-5-Stats-config";
                                    break;
                                case 2:
                                    gridcode = "Magic_DashboardCharts";
                                    functionid = 1061;
                                    location = "75FA59E3-E10A-4AB7-8299-65568E29AF8E";//"/app#/function/1174-5-Stats-config";
                                    break;
                                case 3:
                                    filterField = "MagicGridName";
                                    gridcode = "Magic_Grid";
                                    functionid = -1;
                                    location = "08708886-63EC-4751-8EBB-6F2E2CC40FE8";//"/app#/function/47-5-Griglie";
                                    break;
                                case 4:
                                    filterField = "Code";
                                    gridcode = "Magic_HtmlTemplates";
                                    functionid = 8103;
                                    location = "AB09D902-56B9-4CE9-BECD-7999ABE1253A";//"/app#/function/7203-5-Html-plugins";
                                    break;
                            }
                        } else {
                            //tab redirect
                            filterValue = object ? object.code : null;
                            filterField = "Code";
                            gridcode = "Magic_DashBoardTabs";
                            functionid = 8102;
                            location = "0EDF0089-A20A-4D57-A571-BC39307E8BA8";//"/app#/function/7202-5-Tabs-config";
                        }
                        var waitforfuncid = $.Deferred();
                        if (functionid != -1)
                            $.ajax({
                                url: "/api/Magic_Functions/GetIDFromGUID/" + location,
                                success: function (res) {
                                    waitforfuncid.resolve(res);
                                }
                            });
                        else
                            waitforfuncid.resolve(-1);
                        $.when(waitforfuncid).then(function (functionid) {
                            if (object)
                                setSessionStorageGridFilters(gridcode, functionid, { field: filterField, operator: 'eq', value: filterValue, type: "dashboardEdit" }, true);
                            redirectToFunction(location);
                        });
                        
                    }
                };

                self.save = function () {
                    if (contentsToRemove.length || self.$form.$dirty) {
                        if (self.$form.$valid) {
                            var contentsToSave = $.map(self.data.contents, function (content) {
                                if (!content.id || (self.$subForms[content.id].$dirty && contentsToRemove.indexOf(content.id) == -1)) {
                                    var newContent = $.extend({}, content);
                                    newContent.columnClass = content.splittedClasses.join(' ').trim().replace(/\s{2,}/, " ");
                                    delete newContent.splittedClasses;
                                    return newContent;
                                }
                            }),
                                groupsToSave = $.map(self.data.groups, function (group) {
                                    if (group.id && self.$subForms["group-" + group.id].$dirty) {
                                        return {
                                            id: group.id,
                                            position: group.position
                                        };
                                    }
                                });

                            if (contentsToSave.length || contentsToRemove.length || groupsToSave.length) {
                                doModal(true);
                                $http.post("/api/Magic_Dashboard/saveDashboardData", { content: contentsToSave, group: groupsToSave, contentsToRemove: contentsToRemove.join('|') }).then(function (res) {
                                    contentsToRemove = [];
                                    self.data.contents = $.map(self.data.contents, function (content) {
                                        if (!content.creationTimeStamp)
                                            return content;
                                    }).concat(convertContents(res.data));
                                    kendoConsole.log("Successful saved", "success");
                                })
                                .finally(function () {
                                    doModal(false);
                                });
                            }
                        } else {
                            kendoConsole.log("Form not valid!", "error");
                        }
                    }
                }

                self.setSubFormDirty = function (key) {
                    setTimeout(function () {
                        self.$subForms[key].$setDirty();
                    }, 0);
                };

                self.addContent = function (tabId) {
                    var contentTypeId = self.data.contentTypes[0].value;
                    self.data.contents.push({
                        tabId: tabId,
                        contentTypeId: contentTypeId,
                        contentObjectId: self.data.contentObjects[contentTypeId].length ? self.data.contentObjects[contentTypeId][0].value : null,
                        position: 0,
                        splittedClasses: ["", "", "col-md-12", ""],
                        groupId: null,
                        active: true,
                        creationTimeStamp: Date.now() / 1000
                    });
                    self.$form.$setDirty();
                    return false;
                };

                self.deleteContent = function (content) {
                    $.each(self.data.contents, function (k, c) {
                        if (content.id && content.id == c.id || content.creationTimeStamp && content.creationTimeStamp == c.creationTimeStamp) {
                            if (content.id)
                                contentsToRemove.push(content.id);

                            self.data.contents.splice(k, 1);
                            return false;
                        }
                    });
                };

                self.getContentType = function (contentTypeId) {
                    return $filter('where')(self.data.contentTypes, { value: contentTypeId })[0];
                };
               
           }]);
    }
}())