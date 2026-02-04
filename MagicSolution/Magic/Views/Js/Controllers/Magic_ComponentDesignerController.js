(function () {
    var dependencies = ["angular", "angular-ui-bootstrap", "angular-kendo", "angular-search-drop"];
    var angular;

    define(dependencies, function (a) {
        loadCss(["annotated", "html"]);
        angular = a;
        controller.apply({}, arguments);
        return init;
    });
    loadCss(["flag-icon"], window.includesVersion + "/Magic/v/2018.1.0.0/Styles/3rd-party/flag-icons/css/");

    function init() {
        var element = $("#grid").html('<div ng-controller="ComponentDesignerController as cd" ng-include="\'' + window.includesVersion + '/Magic/Views/Templates/ComponentDesigner.html\'"></div>')[0];
        angular.bootstrap(element, ["ComponentDesigner"]);
    }

    function controller(angular) {
        angular
            .module("ComponentDesigner", ["ui.bootstrap", "kendo.directives", "searchDrop"])
            .controller("ComponentDesignerController", [
                "$scope",
                "$http",
                "$timeout",
                "$filter",
                function ($scope, $http, $timeout, $filter) {
                    var self = this;
                    self.GridSelected = false;
                    self.editableTableTemplate = "/Magic/Views/Templates/HtmlTemplates/component-designer-editable-table.html";
                    self.readonlyTableTemplate = "/Magic/Views/Templates/HtmlTemplates/component-designer-readonly-table.html";

                    self.AvailableConfigurations = [];
                    self.ChangesMade = false;
                    self.ChangesSaved = false;
                    self.ErrorOccured = false;
                    self.ConfigIsActive = true;

                    self.ExistingConfiguration = [];
                    self.EditExistingConfiguration = false;
                    self.CreateNewConfiguration = true;

                    self.ShowEditExistingAlert = false;
                    self.ShowCreateNewAlert = false;
                    self.ShowOrderingAlert = false;
                    self.ShowAlertDurationMS = 5000;
                    self.SaveModalText = "Please note that your old configuration will be overwritten and cannot be restored. Are you sure you wish to continue?"
                    self.SelectConfigText = "Select a Configuration to edit or switch to editor in order to create one!";

                    self.current = {};
                    self.settings = {
                        typeaheadWait: 1000
                    };

                    self.showEditor = function () {
                        self.current = {};
                        self.ExistingConfiguration = [];
                        self.EditExistingConfiguration = false;
                        self.ConfigIsActive = false;
                        self.GridSelected = false;
                        self.view = '';
                    };

                    getAvailableConfigurations = function () {
                        return $http.get("api/MAGIC_GRIDS/GetColumnsOverwrites");
                    };
                    init = function () {
                        getAvailableConfigurations().then(function (res) {
                            if (typeof res.msg == 'undefined' && res.data) {
                                if (res.data.msg && res.data.msg == 'No ColumnOverwrites available.') {
                                    self.SelectConfigText = "There are no overrides available yet. To get started switch to the editor and search for a grid!";
                                }
                                self.AvailableConfigurations = res.data;
                            }
                        });
                    }
                    self.getGrids = function (value) {
                        return $http.get("api/MAGIC_GRIDS/GetGridsForGridOverwrites", {
                            params: { gridname: value }
                        }).then(function (resp) {
                            return resp.data.Data[0].Table;
                        });
                    };
                    self.setGrid = function () {
                        console.log("setGrid", self.current.grid);
                        $http.get("api/MAGIC_COLUMNS/GetColumnsWithTranslations", {
                            params: { id: self.current.grid.MagicGridID }
                        }).then(function (response) {
                            watchCallCount = 1;
                            self.EditExistingConfiguration = false;
                            self.CreateNewConfiguration = true;
                            self.ConfigIsActive = true;
                            $.each(self.AvailableConfigurations, function (i, conf) {
                                if (conf.MagicGridName == self.current.grid.MagicGridName) {
                                    self.EditExistingConfiguration = true;
                                    self.CreateNewConfiguration = false;
                                    self.ExistingConfiguration = JSON.parse(conf.ColumnsConfiguration);
                                    self.ConfigIsActive = conf.IsActive;
                                }
                            });
                            response.data = initConfiguration(response.data);

                            if (self.EditExistingConfiguration) {
                                self.current.grid.StandardConfiguration = angular.copy(response.data);
                                self.ExistingConfiguration = initConfiguration(self.ExistingConfiguration, true);
                                self.current.grid.Columns = self.ExistingConfiguration;
                                self.ShowEditExistingAlert = true;
                                self.ChangesMade = false;
                            } else if (self.CreateNewConfiguration) {
                                self.current.grid.StandardConfiguration = angular.copy(response.data);
                                self.current.grid.Columns = response.data;
                                self.ShowCreateNewAlert = true;
                                self.ChangesMade = true;
                            }                             
                            self.GridSelected = true;
                            $timeout(function () {
                                setTableHeight();
                                initDropdowns();
                                document.getElementById('editableTable').addEventListener('scroll', equalScroll);
                                document.getElementById('readonlyTable').addEventListener('scroll', equalScroll);
                            }, 1);
                            $timeout(function () {
                                self.ShowEditExistingAlert = false;
                                self.ShowCreateNewAlert = false;
                            }, self.ShowAlertDurationMS);
                        });
                    };
                    self.setOverwrite = function (data) {
                        self.ErrorOccured = false;
                        self.ChangesSaved = false;
                        self.ConfigIsActive = data.IsActive;

                        self.ChangesMade = false;
                        self.GridSelected = false;
                        self.EditExistingConfiguration = true;
                        self.CreateNewConfiguration = false;
                        self.current.grid = {};
                        self.current.grid.MagicGridID = data.MagicGridID;
                        self.current.grid.MagicGridName = data.MagicGridName;
                        self.setGrid();
                    };
                    initConfiguration = function (config, isKendoConfiguration) { //adds some layout-parameters
                        for (var i = 0; i < config.length; i++) {
                            config[i].IsMatch = true;
                            var translationObjIsEmpty = Object.entries(config[i].Translations).length === 0 && config[i].Translations.constructor === Object;
                            if (translationObjIsEmpty) {
                                config[i].HasTranslations = false;
                            } else {
                                config[i] = checkTranslations(config[i]);
                            }
                            if (isKendoConfiguration) { //Opposite of getKendoColumns
                                config[i].ColumnName = config[i].field;
                                config[i].Columns_label = config[i].title;
                                config[i].Columns_isSortable = config[i].sortable;
                                config[i].Columns_isFilterable = config[i].filterable;
                                config[i].Columns_visibleingrid = config[i].visible;
                                config[i].Columns_width = config[i].width;
                                config[i].NewOrdinalPosition = config[i].Columns_OrdinalPosition || null;
                                //Translations-Object already there!
                            }
                        }
                        config = sortConfigurationByOrdinalPosition(config, 'Columns_OrdinalPosition');
                        return config;
                    };
                    sortConfigurationByOrdinalPosition = function (config, sortProperty) {
                        return config.sort((a, b) => {
                            return (b[sortProperty] != null) - (a[sortProperty] != null) || a[sortProperty] - b[sortProperty];
                        });
                    };
                    self.filterColumns = function (searchValue) {
                        $.grep(self.current.grid.StandardConfiguration, function (col, i) {
                            var is_match = col.ColumnName.includes(searchValue);
                            if (is_match) {
                                col.IsMatch = true;
                            } else {
                                col.IsMatch = false;
                            }
                            return is_match;
                        });
                        $.grep(self.current.grid.Columns, function (col, i) {
                            var isMatch = col.ColumnName.includes(searchValue);
                            if (isMatch) {
                                col.IsMatch = true;
                            } else {
                                col.IsMatch = false;
                            }
                            return isMatch;
                        });
                        return [];
                    };
                    self.getFilteredColumns = function (column) {
                        if (column) {
                            return column.ColumnName;
                        }
                    };
                    var watchCallCount = 0;
                    $scope.$watch('cd.current.grid.Columns', function (newCols, oldCols) {
                        if (newCols && oldCols && watchCallCount > 1) {
                            //filtering of columns changes '.IsMatch'-property in self.current.grid.Columns, so the $watch is triggered
                            //setting of self.ChangesMade is avoided by following loop
                            //could be BAD FOR PERFORMANCE
                            if (newCols.length == oldCols.length) {
                                for (var i = 0; i < newCols.length; i++) {
                                    var a = newCols[i];
                                    var b = oldCols[i]
                                    if (a.IsMatch != b.IsMatch) {
                                        return;
                                    }                                    
                                    a = checkTranslations(a);
                                }
                            } else { return; }
                            self.ChangesMade = true;
                        }
                        watchCallCount++;
                    }, true);
                    $scope.$watch('cd.currentColumnFilter', function (filter) {
                        if (typeof filter == 'undefined') {
                            return;
                        }
                        if (filter.length == 0) {
                            $.each(self.current.grid.StandardConfiguration, function (i, col) {
                                col.IsMatch = true;
                            });
                            $.each(self.current.grid.Columns, function (i, col) {
                                col.IsMatch = true;
                            });
                        }
                    });
                    self.getCurrentGridObject = function () {
                        var gridObject;
                        $.each(self.current.scriptBuffer, function (k, v) {
                            if (v.Magic_Culture_ID == self.current.cultureID) {
                                gridObject = v.Magic_Script;
                                return false;
                            }
                        });
                        return gridObject;
                    };
                    self.saveColumnOverwrite = function () {
                        var kendoColumns = getKendoColumns(self.current.grid.Columns);
                        rebuildGenericModal();
                        $('#contentofmodal').text(self.SaveModalText);
                        $("#wndmodalContainer").modal('show');
                        $("#executesave").click(function (e) {
                            if ($("#executesave").attr("clicked"))
                                return;
                            $("#executesave").attr("clicked", true);
                            if (self.CreateNewConfiguration && !self.EditExistingConfiguration) {
                                queryDatabase(kendoColumns, 'insert').then(onDatabaseQueried);
                            } else {
                                queryDatabase(kendoColumns, 'update').then(onDatabaseQueried);
                            }
                        });
                    };
                    queryDatabase = function (overwriteConfiguration, action) {
                        var data = { action: action, configuration: JSON.stringify(overwriteConfiguration), active: self.ConfigIsActive ? 1 : 0, gridname: self.current.grid.MagicGridName };
                        return $http.post("api/MAGIC_GRIDS/SetColumnsOverwriteConfiguration", data);
                    };
                    onDatabaseQueried = function (response) {
                        $("#executesave").attr("clicked", false);
                        $("#wndmodalContainer").modal('hide');
                        if (response.data.msg == 'OK') {
                            self.EditExistingConfiguration = true;
                            self.CreateNewConfiguration = false;
                            self.ChangesMade = false;
                            self.ChangesSaved = true;
                            $timeout(function () {
                                self.ChangesSaved = false;
                            }, self.ShowAlertDurationMS);
                        } else {
                            self.ErrorOccured = true;
                        }
                    };
                    getKendoColumns = function (columns) {
                        var kendoCols = [];
                        $.each(columns, function (i, col) {
                            var kendoCol = {};
                            kendoCol.field = col.ColumnName;
                            kendoCol.title = col.Columns_label;
                            kendoCol.sortable = col.Columns_isSortable;
                            kendoCol.filterable = col.Columns_isFilterable;
                            kendoCol.visible = col.Columns_visibleingrid;
                            kendoCol.width = col.Columns_width;
                            kendoCol.Translations = col.Translations;
                            kendoCol.Columns_OrdinalPosition = col.NewOrdinalPosition || null;
                            kendoCols.push(kendoCol);
                        });
                        return kendoCols;
                    };
                    setTableHeight = function () {
                        var padding = 10;
                        var bottomOfTitle = $('#editableTableTitle')[0].getBoundingClientRect().bottom;
                        var windowHeight = $(window).height();
                        var tableHeight = windowHeight - bottomOfTitle;
                        tableHeight -= padding;
                        $('#readonlyTable').height(tableHeight);
                        $('#editableTable').height(tableHeight);
                    };
                    equalScroll = function (e) {
                        setTimeout(function () {
                            $('#editableTable')[0].scrollTop = e.target.scrollTop;
                            $('#readonlyTable')[0].scrollTop = e.target.scrollTop;
                        }, 100);
                        e.preventDefault();
                    };
                    initDropdowns = function () {
                        $('.click-popup').click(function (e) {
                            e.stopPropagation();
                        });
                    };
                    checkTranslations = function (column) {
                        column.HasTranslations = false;
                        $.each(column.Translations, function (key, translation) {
                            if (translation.length > 0) {
                                column.HasTranslations = true;
                            }
                        });
                        return column;
                    };
                    window.onload = init();
                    self.gridOverwriteGridOptions = $.extend(
                        getDefaultGridSettings(),
                        {
                            dataSource: {
                                transport: {
                                    read: {
                                        url: "/api/MAGIC_GRIDS/GetColumnsOverwrites",
                                        type: "GET",
                                        contentType: "application/json",
                                        dataType: "json"
                                    }
                                },
                                schema: {
                                    parse: function (res) {
                                        return res;
                                    }
                                },
                                serverPaging: true,
                                serverFiltering: true,
                                serverSorting: true
                            },
                            groupable: false,
                            sortable: false,
                            filterable: false,
                            columns: [
                                {
                                    field: "MagicGridName"
                                },
                                {
                                    field: "ModifiedUser_ID"
                                },
                                {
                                    field: "ModifiedDate",
                                    template: function (item) {
                                        return $filter("date")(item.ModifiedDate, "medium");
                                    }
                                },
                                {
                                    field: "IsActive"
                                },
                                {
                                    command: [
                                        {
                                            name: "Edit",
                                            text: "Select Overwrite",
                                            click: function (e) {
                                                var tr = $(e.target).closest("tr");
                                                var data = this.dataItem(tr);
                                                self.setOverwrite(data);
                                                self.view = '';
                                            }
                                        }
                                    ]
                                }
                            ],
                            toolbar: null,
                            //remove: function (e) {
                            //    self.deleteOverwrite(e.model._id);
                            //}
                        });
                }]);
    }
}());