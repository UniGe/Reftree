(function () {
    var dependencies = ["angular", "angular-kendo", "angular-bo-selector", "angular-tag-selector", "tag-selector"],
        angular,
        controllerName = "Notes";

    define(dependencies, function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = $("#grid").html(getAngularControllerRootHTMLElement(controllerName))[0];
        angular.bootstrap(element, [controllerName]);
    }

    function controller(angular) {
        angular
            .module(controllerName, ["kendo.directives", "boSelector", "tagSelector"])
            .filter("notesFilter", function () {
                return function (notes, filters) {
                    var compare = function (from, to, operator) {
                        switch (operator) {
                            case 'gt':
                                return from > to;
                                break;
                            case 'lt':
                                return from < to;
                                break;
                            case 'eq':
                                return from == to;
                                break;
                            case 'isnull':
                                return from == null;
                                break;
                            case 'isnotnull':
                                return from != null;
                                break;
                        }
                        return false;
                    }
                    return $.map(notes, function (note) {
                        var filterText = filters.text.toLowerCase();
                        if (!filterText || note.DocumentFile.toLowerCase().indexOf(filterText) !== -1 || note.BusinessObjectDescription.toLowerCase().indexOf(filterText) !== -1 || note.BusinessObjectType.toLowerCase().indexOf(filterText) !== -1 || $.grep(note.DocumentJSONTags, function (tag) { return tag.toLowerCase().indexOf(filterText) !== -1 }).length) {
                            if (!filters.filterBydueDate || !note.DueDate || (filters.filterBydueDate && compare(note.DueDate, new Date(), 'lt'))) {
                               // if (!filters.creationDate || !note.InsertionDate || compare(note.InsertionDate, filters.creationDate, filters.creationDateOperator)) {
                                    return note;
                               // }
                            }
                        }
                    });
                };
            })
            .controller(controllerName + "Controller", [
                '$timeout',
                '$scope',
                '$element',
                '$http',
                function ($timeout, $scope, $element, $http) {
                    var self = this;
                    self.notes = [];
                    self.now = new Date();
                    self.editNoteId = null;
                    self.lang = {
                        search: getObjectText("search"),
                        dueDateShow: getObjectText("showexpirednotes"),
                        dueDate: getObjectText("duedateselection"),
                        creationDate: getObjectText("creationdate"),
                        note: getObjectText("note"),
                        public: getObjectText("public"),
                        save: getObjectText("save"),
                        delete: getObjectText("delete"),
                        add: getObjectText("add"),
                        tags: getObjectText("tags"),
                    };
                    self.operatorOptions = {
                        dataSource: [
                            { value: 'gt', text: getObjectText("gt") },
                            { value: 'lt', text: getObjectText("lt") },
                            { value: 'eq', text: getObjectText("eq") },
                            { value: 'isnull', text: getObjectText("isnull") },
                            { value: 'isnotnull', text: getObjectText("isnotnull") }
                        ],
                        dataTextField: "text",
                        dataValueField: "value"
                    };
                    self.filters = {
                        text: "",
                        dueDate: null,
                        dueDateOperator: "lt",
                        creationDate: null,
                        creationDateOperator: "gt",
                    };
                    self.formatDate = function (date) {
                        return kendo.toString(date, "g");
                    };
                    self.initBOSelector = function (e) {
                        console.log(e);
                    };
                    self.boChange = function (event, note) {
                        note.BusinessObjectDescription = event.item.Description;
                        note.BusinessObjectType = event.item.Type;
                        note.BusinessObject_ID = event.item.Id;
                    };
                    self.updateNote = function (note) {
                        var data = {
                            note: note.DocumentFile,
                            dueDate: note.DueDate ? toTimeZoneLessString(note.DueDate) : null,
                            isPrivate: !note.IsPublic,
                            BOType: note.BusinessObjectType,
                            DocumentJSONTags: note.DocumentJSONTags && note.DocumentJSONTags.length ? note.DocumentJSONTags : null
                        };

                        if (note.ID) {
                            data.Id = note.ID;
                            data.BOId = note.BusinessObject_ID;
                        } else {
                            data.BOIds = [note.BusinessObject_ID]
                        }

                        if (!note.BusinessObject_ID)
                        {
                            kendoConsole.log(getObjectText("selectBOrequired") + "!", true);
                            return;
                        }

                        $http
                            .post("/api/DocumentRepository/AddNotes", data)
                            .then(function (res) {
                                kendoConsole.log(getObjectText(data.Id ? 'noteChanged' : 'noteAdded'), "success");
                                if (!data.Id) {
                                    if (res.data[0].DocumentJSONTags)
                                        res.data[0].DocumentJSONTags = JSON.parse(res.data[0].DocumentJSONTags);
                                    note = $.extend(note, res.data[0]);
                                    if (note.DueDate)
                                        note.DueDate = new Date(note.DueDate);
                                    if (note.InsertionDate)
                                        note.InsertionDate = new Date(note.InsertionDate);
                                } else {
                                    self.editNoteId = null;
                                }
                            }, function (error) {
                                kendoConsole.log(error, "error");
                                self.editNoteId = null;
                            });
                    };
                    self.deleteNote = function (note) {
                        $http
                        .post("/api/DocumentRepository/DeleteNote/" + note.ID)
                        .then(function (res) {
                            kendoConsole.log(getObjectText('noteDeleted'), "success");
                            $.each(self.notes, function (k, n) {
                                if (n.ID == note.ID) {
                                    self.notes.splice(k, 1);
                                    return false;
                                }
                            });
                            self.editNoteId = null;
                        }, function (error) {
                            kendoConsole.log(error, "error");
                            self.editNoteId = null;
                        });
                    };
                    self.addNote = function () {
                        self.editNoteId = null;
                        self.notes.push({
                            ID: null
                        });
                    };

                    $http
                        .get("/api/DocumentRepository/GetNotes")
                        .then(function (res) {
                            self.notes = $.map(res.data, function (note) {
                                if (note.DueDate)
                                    note.DueDate = new Date(note.DueDate);
                                if (note.InsertionDate)
                                    note.InsertionDate = new Date(note.InsertionDate);
                                note.DocumentJSONTags = note.DocumentJSONTags ? JSON.parse(note.DocumentJSONTags) : [];
                                return note;
                            });
                        });

                }
            ]);
    }
})();