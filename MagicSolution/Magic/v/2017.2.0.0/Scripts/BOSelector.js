(function ($) {

   
    function bOSelector(element, options, k) {
        var self = this;
        self.options = $.extend({
            multiselect: false,
            isKendoForm: true,
            showLabel: true,
            tags: [],
            labelText: getObjectText('BOTypes'),
            placeholderText: getObjectText('placeholderSearchBO'),
            grid: true,
            filters: [],
            entityInfo: null,
            isReadonly: false,
            showGrid: false,
            onChange: null,
            isRequired: false,
            disableTextualSearch: window.businessObjectSelectorDisableTextualSearch,
            openGridInNewWindow:false
        }, options);

        self.getModelData = function ()
        {
            if (!self.options.isKendoForm)
                return {};
            var uid = self.$element.closest(".k-popup-edit-form").data("uid");
            var model = uid ? self.$element.closest(".k-popup-edit-form").data("gridDS").getByUid(uid) : {};
            return model;
        }

        self.toDo = [];
        self.$element = $(element);
        self.$input = $('<input style="display: none;" type="text" placeholder="' + self.options.placeholderText + '" name="BO" ' + (self.options.isRequired ? 'required' : '') + '/>');
        
        var labelHtml = self.options.showLabel ? '<label for="BO">' + self.options.labelText + (self.options.isRequired ? ' *' : '') + '</label>' : '',
            buttonHtml = self.options.grid ? '<button type="button" class="k-button"' + (self.options.isReadonly ? ' disabled' : '') + ' title="' + getObjectText('advancedSearch') + '"><i class="fa fa-search fa-2x"></i></button>' : '',
            input = self.options.isKendoForm ? $('<div class="k-edit-field"><div></div></div>').find('div').addClass(buttonHtml ? 'has-button' : 'no-button').html(self.$input).append(buttonHtml).parent() : self.$input;
        if (self.options.isKendoForm && labelHtml)
            labelHtml = '<div class="k-edit-label">' + labelHtml  + '</div>';


        self.$element
            .addClass('bo-tagbox')
            .append(labelHtml)
            .append(input);
        if (!self.options.isKendoForm)
            self.$element.append(buttonHtml);

        if(self.options.grid === true){
            self.$grid = $('<div id="boselectorforgrid-' + k + '" class="k-recur-view" style="margin-top:3px; display: none; float: left; max-width: 100%;"></div>');
            if (!self.options.openGridInNewWindow)
                self.$element.append(self.$grid);
        } else if(self.options.grid)
            self.$grid = $(self.options.grid);
        else
            self.$grid = false;

        requireConfig(function () {
            require(['bootstrap-tagsinput'], function () {
                self.tagsinput = self.$input
                        .on('beforeItemAdd', function () {
                            if (!self.options.multiselect)
                                $(this).tagsinput('removeAll');
                        })
                        .tagsinput({
                            freeInput: false,
                            itemValue: function (v) {
                                return v.Id + '-' + v.Type;
                            },
                            itemText: function (v) {
                                return v.Description + ' (' + v.Type + ')';
                            }
                        });

                if (self.options.tags) {
                    $.each(self.options.tags, function (k, tag) {
                        self.tagsinput[0].$element.tagsinput('add', tag);
                    });
                }

                if (self.options.onChange) {
                    self.$input.on('itemAdded', function (event) {
                        self.options.onChange(event);
                    })
                    self.$input.on('itemRemoved', function (event) {
                        self.options.onChange(event);
                    })
                }

                if (buttonHtml && self.$grid) {
                    self.$element.find('button').kendoButton({
                        click: function () {
                            showGrid();
                        }
                    });
                }
                if (self.options.showGrid)
                    showGrid();

                function showGrid() {
                    if (self.options.openGridInNewWindow) {
                        self.$grid
                            .kendoWindow({
                                modal: true,
                                width: 1200,
                                close: function (e) {
                                    e.sender.destroy();
                                    self.$grid = $('<div id="boselectorforgrid-' + k + '" class="k-recur-view" style="margin-top:3px; display: none; float: left; max-width: 100%;"></div>');
                                },
                                open: function (e) {
                                    if (self.options.multiselect) {
                                        window.setTimeout(function () {
                                            $('#unselectButton', e.sender.element).after('<button type="button" style="margin-top: 5px; height: 30px;" class="k-button k-button-icontext k-primary pull-right" onclick="$(this).closest(\'.k-window-content\').data(\'kendoWindow\').close()"><span class="k-icon k-update"></span>' + getObjectText("select") + '</button>')
                                        })
                                    }
                                }
                            })
                            .show()
                            .data("kendoWindow")
                            .center()
                            .open();
                    } else
                        self.$grid.toggle();
                    
                    if (!$("#BOSelectorGrid", self.$grid).length || (window.businessObjectSelectorDropdownStored && self.options.isKendoForm))
                        self.appendGridSelector();
                    else if (self.$grid.is(':visible')) //il grid e' visibile
                            self.refreshGrid();
                }

                $.each(self.toDo, function (k, v) {
                    v();
                });

                if (!self.options.disableTextualSearch) {

                    if (self.options.isReadonly)
                        self.tagsinput[0].$container.addClass('disabled');

                    self.tagsinput[0].$input
                        .removeAttr('style')
                        .kendoAutoComplete({
                            enable: !self.options.isReadonly,
                            minLength: 3,
                            template: function (data) { return '<span data-source=\'' + kendo.stringify(data).replace(/'/g, '&apos;') + '\'><b>' + data.Type + ':</b> ' + data.Description + '</span>' },
                            dataSource: {
                                transport: {
                                    read: {
                                        dataType: "json",
                                        contentType: "application/json; charset=utf-8",
                                        type: "POST",
                                        url: "/api/GENERICSQLCOMMAND/SelectTaggedElements/",
                                    },
                                    parameterMap: function (settings, operation) {
                                        if (operation === "read") {
                                            return kendo.stringify({
                                                storedProcedure: "dbo.Magic_SearchTaggedBOs",
                                                tag: settings.filter.filters[0].value,
                                                BOIds: self.options.filters.join(','),
                                                entityName: (self.options.entityInfo == null ? null : self.options.entityInfo.entityName),
                                                refValueId: (self.options.entityInfo == null ? null : self.options.entityInfo.refValueId)
                                            });
                                        }
                                        return settings;
                                    }
                                },
                                schema: {
                                    parse: function (response) {
                                        return response.Data;
                                    }
                                },
                                serverFiltering: true
                            },
                            dataTextField: "Description",
                            select: function (e) {
                                var obj = e.item.find('span[data-source]').data('source');
                                self.$input.tagsinput('add', obj);
                                window.setTimeout(function () { self.tagsinput[0].$input.val(''); }, 10)
                            }
                        });

                }
                else
                    self.tagsinput[0].$input.hide();

                self.$element.trigger('bOSelector:ready');
            });
        });
    }

    bOSelector.prototype = {
        constructor: bOSelector,
        getBOs: function () {
            return this.$input.tagsinput ? this.$input.tagsinput('items') : this.options.tags;
        },
        addBOs: function (items) {
            var self = this;
            if (!self.tagsinput)
                self.toDo.push(function () { self.addBOs(items) });
            else
                $.each(items, function (k, item) {
                    self.$input.tagsinput('add', item);
                });
        },
        removeAll: function () {
            var self = this;
            if (!self.tagsinput)
                self.toDo.push(function () { self.removeAll() });
            else
                self.$input.tagsinput('removeAll');
        },
        setEntity: function (entityInfo)
        {
            var self = this;
            self.options.entityInfo = entityInfo;
        },
        removeEntity: function ()
        {
            self.options.entityInfo = null;
            self.refreshGrid();
        },
        setFilter: function (filter) {
            var self = this;
            if (typeof filter === 'string' || typeof filter === 'number')
                filter = [filter];

            var mergedFilter = self.options.filters.concat(filter);
            var diff = $(mergedFilter).not(self.options.filters).get();
            if (diff.length) {
                self.options.filters = mergedFilter;
            }
        },
        deleteFilter: function(){
            var self = this;
            if (!self.options.filters.length)
                return;

            self.options.filters = [];
        },
        refreshGrid: function(){
            var self = this;
            var dropDownList = self.$grid.$boselector.$container.$dropdown.data("kendoDropDownList");
            var dataItem = self.$grid.$boselector.$container.$dropdown.data("kendoDropDownList").dataSource.get(dropDownList.value());
            self.populateGrid(dataItem.gridName,dataItem.LoadSP);
        },
        appendGridSelector: function () {
            var self = this;
            if (!self.$grid)
                return false;

            self.$grid.$boselector = $('<div></div>');
            self.$grid.html(self.$grid.$boselector);
            var stamp = Date.now();
            
            self.getGridSelectorDataSource()
                .then(function (res) {
                    self.populateGridSelector(res, stamp);
                });
        },
        populateGridSelector: function (result, stamp) {
            var self = this;
            if (self.$grid.$boselector.$container && self.$grid.$boselector.$container.stamp >= stamp)
                return;

            self.$grid.$boselector.$container = $('<div style="width: 100%; display: inline-block;"></div>');
            self.$grid.$boselector.$container.stamp = stamp;
            self.$grid.$boselector.html(self.$grid.$boselector.$container);
            self.$grid.$boselector.$container.$dropdown = $('<input style="max-width: 300px">');
            self.$grid.$boselector.$container.$grid = $('<div id="BOSelectorGrid"></div>');
            self.$grid.$boselector.$container.$unselect = $('<button id="unselectButton" type="button" style="margin-top: 5px; height: 30px;">' + getObjectText("UnselectBO") + '</button>');
            

            if (self.options.isKendoForm)
                self.$grid.$boselector.$container
                    .html('<div class="k-edit-label"><label>' + getObjectText("BOTypes") + ':&nbsp;</label></div><div class="k-edit-field"></div>')
                    .find('.k-edit-field')
                    .append(self.$grid.$boselector.$container.$dropdown);
            else
                self.$grid.$boselector.$container
                    .html('<label>' + getObjectText("BOTypes") + ':&nbsp;</label>')
                    .append(self.$grid.$boselector.$container.$dropdown);

            self.$grid.$boselector.$container
                .append(self.$grid.$boselector.$container.$grid)
                .append(self.$grid.$boselector.$container.$unselect);

            var dataSource = null,
                promises = [],
                storedDataSource = null;
            if (!result[0].MagicGridName)
                storedDataSource = result;
            if (!storedDataSource) {
                dataSource = [];
                $.each(result, function (i, v) {
                    promises.push(
                        isGridVisiblePromise(v.MagicGridName)
                            .then(function () {
                                dataSource.push({
                                    id: v.BusinessObjectType,
                                    label: v.Description,
                                    gridName: v.MagicGridName,
                                    EntityName: v.EntityName || false,
                                    LoadSP: v.LoadSP
                                });
                            })
                    );
                });
            }
            else {
                promises.push(true);
            }
            $.when.apply($, promises)
                .always(function () {
                    dataSource = $.grep(dataSource || storedDataSource, function (v) {
                        return !self.options.allowedBOTypes || !self.options.allowedBOTypes.length || self.options.allowedBOTypes.indexOf(v.id) !== -1;
                    });
                    if (dataSource.length < 2)
                        self.$grid.$boselector.$container.hide();
                    var dropdown = self.$grid.$boselector.$container.$dropdown.kendoDropDownList({
                        dataTextField: "label",
                        dataValueField: "id",
                        dataSource: dataSource,
                        change: function (e) {
                            var value = this.value();
                            var dataItem = self.$grid.$boselector.$container.$dropdown.data("kendoDropDownList").dataSource.get(value);
                            self.populateGrid(self.currentGrid = dataItem.gridName, self.currentSP = dataItem.LoadSP);
                            self.$grid.$boselector.data('BOS', { BOType: dataItem.id, EntityName: dataItem.EntityName });
                        },
                        schema: {
                            model: { id: "id" }
                        }
                    });
                    //when using stored procedure to read BO caching is disabled on popups
                    if (!storedDataSource && !(window.businessObjectSelectorDropdownStored && self.options.isKendoForm))
                        setLocalUserData(self.getLocalUserDataKey, dataSource);

                    self.dropdown = dropdown.data("kendoDropDownList");
                    if (self.options.tags.length)
                        self.dropdown.value(self.options.tags[0].Type);

                    self.$grid.$boselector.$container.append(dropdown);
                    var index = 0;

                    if (self.options.tags.length)
                        $.each(dataSource, function (i, value) {
                            if (value.id === self.options.tags[0].Type)
                                index = i;
                        })
                    self.populateGrid(self.currentGrid = dataSource[index].gridName,self.currentSP = dataSource[index].LoadSP);
                    self.$grid.$boselector.data('BOS', { BOType: dataSource[index].id, EntityName: dataSource[index].EntityName });
                });
        },
        refreshGridSelector: function () {
            var self = this,
                timestamp = self.gridSelectorRefresh = Date.now();
            if (self.dropdown) {
                self.getGridSelectorDataSource()
                    .then(function (res) {
                        if (timestamp == self.gridSelectorRefresh) {
                            self.dropdown.setDataSource(res);
                            self.refreshGrid();
                        }
                    });
            }
        },
        getGridSelectorDataSource: function () {
            var deferred = $.Deferred(),
                self = this,
                storedDataSource;
            //disable caching when custom stored procedure is enabled 
            if (!(window.businessObjectSelectorDropdownStored && self.options.isKendoForm))
                storedDataSource =  getLocalUserData(self.getLocalUserDataKey);
            if (storedDataSource)
                deferred.resolve(storedDataSource);
            else if (window.businessObjectSelectorDropdownStored) {
                //get the edited row data model if exists
                var model = self.getModelData();
                requireConfigAndMore(["MagicSDK"], function (MF) {
                    MF.api
                        .get({
                            storedProcedureName: window.businessObjectSelectorDropdownStored,
                            data: $.extend({ filters: self.options.filters }, self.options.entityInfo, model)
                        })
                        .then(function (res) {
                            if (res.length && res[0].length)
                                deferred.resolve(res[0]);
                        });
                });
            }
            else {
                var where = self.options.filters.length ? ' AND ID IN (' + self.options.filters.join(',') + ')' : '';
                $.ajax({
                    type: "POST",
                    url: "/api/GENERICSQLCOMMAND/GetWithFilter",
                    data: JSON.stringify({ table: "dbo.v_Magic_BusinessObjectTypes", order: "Description", where: "Active = 1 AND VisibleForBOSelector = 1" + where }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (result) {
                        if (result.Count > 0 && result.Data) {
                            deferred.resolve(result.Data[0].Table);
                        }
                    }
                });
            }
            return deferred.promise();
        },
        getLocalUserDataKey: function () {
            var key = "VisibleBOs",
                self = this;
            if (self.options.entityInfo)
                key += self.options.entityInfo.entityName + "-" + self.options.entityInfo.refValueId;
            return key;
        },
        populateGrid: function (gridName, loadSP) {

            function getGridObject(gridName,loadSP,boSel)
            {
                //pick current model 
                //self.$element.closest(".k-edit-form-container").parent().data().gridDS.getByUid('7b4f58e2-c86f-455f-afe5-ef61d749b0ea')
                var deferred = new $.Deferred();
                if (loadSP)
                    requireConfigAndMore(["MagicSDK"], function (MF) {
                        var model = boSel.getModelData();
                        MF.api.getDataSet($.extend({ gridName: gridName }, model), loadSP).then(function (res) {
                            var columns = JSON.parse(res[1][0].columns);

                            var gridObject = {
                                filterable: setDefaultFilterSettings(),
                                columns: columns,
                                dataSource: new kendo.data.DataSource({
                                    data: res[0],
                                    schema: {
                                        model: $.extend({ id: res[1][0].primaryKey }, JSON.parse(res[1][0].model))
                                    }
                                })
                            };
                            deferred.resolve(gridObject);
                        })
                    });
                else
                    deferred.resolve(getrootgrid(gridName));

                return deferred.promise();
            }
            var self = this;

            getGridObject(gridName, loadSP, self).then(function (gridobj) {
                gridobj.toolbar = null;
                gridobj.scrollable = true;
                gridobj.groupable = false;
                gridobj.editable = false;
                gridobj.selectable = true;
           
                if (!loadSP) {
                    gridobj.dataSource.pageSize = 5;
                    if (self.options.entityInfo != null) //D.t permette di aggiungere alla select del grid dei dati aggiuntivi 
                    {
                        //pass entityinfo in the data setction of parameter map 
                        var origparmap = gridobj.dataSource.transport.parameterMap;
                        gridobj.dataSource.transport.parameterMap = function (options, operation) {
                            var opts = origparmap.call(this, options, operation);
                            opts = JSON.parse(opts);
                            opts.data = kendo.stringify(self.options.entityInfo);
                            return kendo.stringify(opts);
                        }
                    }
                }
                gridobj.pageable = {
                    buttonCount: 5
                };
                gridobj.change = function (e) {
                    var selectedRows = this.select();
                    var dataItem = this.dataItem(selectedRows[0]);
                    if (dataItem == null)
                        return;
                    var data = self.$grid.$boselector.data('BOS');

                    //set k-state-selected class to all rows from selected BOs
                    if (self.options.multiselect) {
                        var selectedBORowSelectors = [];
                        $.each(self.$input.tagsinput('items'), function (k, bo) {
                            if (bo.Type == data.BOType) {
                                $.each(e.sender.dataSource.data(), function (k, d) {
                                    if ((d.id || d.BOId) == bo.Id) {
                                        selectedBORowSelectors.push('tr[data-uid="' + d.uid + '"]')
                                        return false;
                                    }
                                })
                            }
                        })
                        if (selectedBORowSelectors.length)
                            $(selectedBORowSelectors.join(','), e.sender.element).addClass('k-state-selected')
                    }


                    data['id'] = dataItem.id || dataItem.BOId;
                    if (!data.EntityName)
                        delete data.EntityName;
                    var description = "";
                    $.each(e.sender.options.columns, function (k, v) {
                        //depends on datasource type (paging or not)
                        var fields = e.sender.options.dataSource.schema ? e.sender.options.dataSource.schema.model.fields : e.sender.options.dataSource.options.schema.model.fields
                        if (v.field && v.field in fields && fields[v.field].type == 'string') {
                            description = dataItem[v.field];
                            return false;
                        }
                    
                    });
                    data['Description'] = description;
                    self.$grid.$boselector.data('BOS', data);
                    var bo = {
                        Description: data.Description,
                        Id: data.id,
                        Type: data.BOType
                    }
                    if (data.EntityName)
                        bo.EntityName = data.EntityName;
                    self.$input.tagsinput('add', bo);
                    if (!self.options.multiselect && self.options.openGridInNewWindow)
                        e.sender.element.closest('.k-window-content').data("kendoWindow").close();
                };

                //tolgo gli action button
                for (var i = 0 ; i < gridobj.columns.length; i++)
                    if (gridobj.columns[i].command !== undefined)
                        gridobj.columns[i].hidden = true;

                //tolgo la navigabilita'
                gridobj.detailTemplate = null;
                gridobj.detailTemplateName = null;
                gridobj.detailInit = null;

                self.$grid.$boselector.$container.$grid.html('');
                //if the previous grid had user customizations
                self.$grid.$boselector.$container.$grid.prev("h4.magic-actual-config").remove('');

                var grid = self.$grid.$boselector.$container.$grid.kendoGrid(gridobj);
                grid.data("kendoGrid").one("dataBound", function () {
                    if (grid.closest('.k-window-content').length)
                        grid.closest('.k-window-content').data("kendoWindow").center();
                });
                var button = self.$grid.$boselector.$container.$unselect.kendoButton({
                    enable: true,
                    click: function () {
                        self.$grid.$boselector.$container.$grid.data("kendoGrid").clearSelection();
                        self.$grid.$boselector.$container.$grid.data("kendoGrid").dataSource.filter({});
                        var data = self.$grid.$boselector.data('BOS');
                        if ('BOId' in data)
                            delete data['BOId'];
                        self.$grid.$boselector.data('BOS', data);
                        self.$input.tagsinput('removeAll');
                    }
                });

                self.$grid.$boselector.append(grid);
                self.$grid.$boselector.append(button);
            });
        },
        refreshGrid: function() 
        {
            var self = this;
            var j=-1;
            try {
                if (self.dropdown) {
                    var gridFound = false,
                        data = self.dropdown.dataSource.data();
                    for (var i = 0; i < data.length; i++){
                        if (data[i].gridName == self.currentGrid || (data[i].LoadSP == self.currentSP && data[i].LoadSP)) {
                            j = data[i].LoadSP ? i : null;
                            gridFound = true;
                            break;
                        }
                    }
                    //if there's a stored procedure always reload the grid (as it may change by changing other values) 
                    if (gridFound && j>=0)
                    {
                        self.populateGrid(data[j].gridName, data[j].LoadSP);
                        return;
                    }
                    if (!gridFound) {
                        if (!data.length) {
                            self.$grid.hide();
                            self.$grid.html('');
                        }
                        else
                            self.populateGrid(data[0].gridName,data[0].LoadSP);
                        return;
                    }
                }
                $("#BOSelectorGrid").data("kendoGrid").dataSource.read();
            } catch (e) {
                console.log(e);
            }
        }
    }

    $.fn.bOSelector = function (arg1, arg2) {
        var results = [];
        this.each(function (k, v) {
            var boselector = $(this).data('bOSelector');
            if (!boselector) {
                boselector = new bOSelector(this, arg1, k);
                $(this).data('bOSelector', boselector);
                results.push(boselector);
            } else if (!arg1 && !arg2) {
                results.push(boselector);
            } else if (boselector[arg1] !== undefined) {
                var retVal = boselector[arg1](arg2);
                if (retVal !== undefined)
                    results.push(retVal);
            }
        });

        if (typeof arg1 == 'string') {
            return results.length > 1 ? results : results[0];
        } else {
            return results;
        }
    }


    function textBOSelector(element, options) {
        var self = this;
        self.$element = $(element);
        self.options = $.extend({
            multiselect: false,
            tags: {},
            filters: [],
            zIndex: 999999,
            debounces: 100,
            placement: 'bottom|right'
        }, options);

        self.tags = self.options.tags;

        requireConfig(function () {
            require(['jquery-textcomplete'], function () {
                self.$element.textcomplete([{
                    match:/#([^#\s]{1}[^#]{2,})$/,
                    search: function (term, callback) {
                        $.ajax({
                            type: "POST",
                            url: "/api/GENERICSQLCOMMAND/SelectTaggedElements/",
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            data: kendo.stringify({
                                storedProcedure: "dbo.Magic_SearchTaggedBOs",
                                tag: term,
                                BOIds: self.options.filters.join(','),
                                entityName: (self.options.entityInfo == null ? null : self.options.entityInfo.entityName),
                                refValueId: (self.options.entityInfo == null ? null : self.options.entityInfo.refValueId)
                            }),
                            success: function (values) {
                                callback(values.Data ? $.map(values.Data, function (v) { if (!(v.Id + '-' + v.Type in self.tags)) return v; }) : []);
                            },
                            error: function () {
                                callback([]);
                            }
                        });
                    },
                    index: 1,
                    replace: function (element) {
                        var str = element.Description + ' (' + element.Type + ')',
                            key = element.Id + '-' + element.Type;
                        if (key in self.tags)
                            return '';
                        self.tags[key] = element;
                        return '#' + str + '# ';
                    },
                    idProperty: 'Id',
                    template: function (element) {
                        return '<b>' + element.Description + '</b> (' + element.Type + ')';
                    }
                }], {
                    zIndex: self.options.zIndex,
                    debounces: self.options.debounces,
                    placement: self.options.placement,
                }
                ).on('keydown', function (e) {
                    if (e.keyCode == 8 || e.keyCode == 46) {
                        var re = /#.*?#/g, r,
                            range = self.$element.getCursorRange(),
                            deleted = false;
                        if (!range)
                            return;

                        while ((r = re.exec(this.value)) !== null) {
                            if (r.index + (e.keyCode == 8 ? 1 : 0) <= range[1] && range[0] <= (re.lastIndex - (e.keyCode == 46 ? 1 : 0))) {
                                var deletedPiece = this.value.substring(r.index, re.lastIndex);
                                this.value = this.value.substring(0, r.index) + this.value.substring(re.lastIndex).replace('/^\s+/', '');
                                $.each(self.tags, function (k, v) {
                                    if ('#' + v.Description + ' (' + v.Type + ')#' == deletedPiece) {
                                        delete self.tags[v.Id + '-' + v.Type];
                                        return false;
                                    }
                                });
                                return false;
                            }
                        }
                    }
                }).on('keyup', function () {
                    if (this.value.length <= 1)
                        self.tags = {};
                });
            });
        });
    }

    textBOSelector.prototype = {
        constructor: textBOSelector,
        getBOs: function () {
            return $.map(this.tags, function (v, k) {
                return [v];
            })
        }
    }

    $.fn.textBOSelector = function (arg1, arg2) {
        var results = [];
        this.each(function () {
            var textboselector = $(this).data('textboselector');
            if (!textboselector) {
                textboselector = new textBOSelector(this, arg1);
                $(this).data('textboselector', textboselector);
                results.push(textboselector);
            } else if (!arg1 && !arg2) {
                results.push(textboselector);
            } else if (textboselector[arg1] !== undefined) {
                var retVal = textboselector[arg1](arg2);
                if (retVal !== undefined)
                    results.push(retVal);
            }
        });

        if (typeof arg1 == 'string') {
            return results.length > 1 ? results : results[0];
        } else {
            return results;
        }
    }

    $.fn.getCursorRange = function () {
        var input = this.get(0);
        if (input && ('selectionStart' in input) && ('selectionEnd' in input)) {
            return [input.selectionStart, input.selectionEnd];
        }
    }

    function textEntitySelector(element, options)
    {
        function getEntityFormat(element)
        {
            return element.Description + ' (' + element.Code + ')';
        }
        function getEntityKey(element) {
            return element.Code;
        }
        function getFieldFormat(element) {
            return element.Description + ' (' + element.Entity + ')';
        }
        function getFieldKey(element) {
            return element.Code + "_" + element.Entity;
        }
        function getVerbFormat(element)
        {
            return element.Description;
        }
      

        var self = this;
        self.$element = $(element);
        self.options = $.extend({
            multiselect: true,
            tags: {},
            filters: [],
            zIndex: 999999,
            debounces: 100,
            placement: 'bottom|right'
        }, options);

        self.tags = self.options.tags;
        //TODO get from DB...
        var entities = [{ Id: 1, Code: "AS_ASSET_ASSETS", Description: "Assets", Type: "Entity" },
            { Id: 2, Code: "LE_CONTRA_CONTRACTS", Description: "Contracts", Type: "Entity" },
            { Id: 3, Code: "LE_CONTRA_DETAILS", Description: "Contract details", Type: "Entity" },
            { Id: 4, Code: "AS_ASSET_DIMENS", Description: "Asset Dimensions", Type: "Entity" }, ];

        var relations = { "AS_ASSET_ASSETS": ["LE_CONTRA_CONTRACTS","AS_ASSET_DIMENS"] }
        relations["LE_CONTRA_CONTRACTS"] = ["LE_CONTRA_DETAILS"];

        var fields = [
            { Id: 1, Code: "AS_ASSET_CODE", Description: "Code", Type: "Field", Entity: "AS_ASSET_ASSETS", SchemaType: "string" },
            { Id: 2, Code: "AS_ASSET_CREATION", Description: "InsertionDate", Type: "Field", Entity: "AS_ASSET_ASSETS", SchemaType: "date" },
            { Id: 3, Code: "LE_CONTRA_CODE", Description: "Codice contratto", Type: "Field", Entity: "LE_CONTRA_CONTRACTS", SchemaType: "string" },
            { Id: 4, Code: "AS_DIMENS_VALUE", Description: "Valore dimensione", Type: "Field", Entity: "AS_ASSET_DIMENS", SchemaType: "string" }];
        //TODO END

        var operators = { list: [ { Code: "lt", Description: getObjectText("lt")},
            { Code: "lte", Description: getObjectText("lte")},
            {Code:"eq", Description:getObjectText("eq")},
            {Code:"neq", Description:getObjectText("neq")},
            {Code:"gt", Description:getObjectText("gt")},
            {Code:"gte", Description:getObjectText("gte")},
            {Code:"isnull", Description:getObjectText("isnull")},
            {Code:"isnotnull", Description:getObjectText("isnotnull")}],
            enums: ["eq","neq"],
            email: ["startswith","eq","neq","isnull","isnotnull"],
            string:["contains","startswith","eq","neq","isnull","isnotnull"],
            number:["lt","lte","eq","neq","gt","gte","isnull","isnotnull"],
            date: ["lt","lte","eq","neq","gt","gte","isnull","isnotnull"]
        };

        var verbs = {
            list: [{ Id: 1, Code: "INNER_JOIN", Description: "In mandatory relation with", Type:"Verb" },
                   { Id: 2, Code: "LEFT_JOIN", Description: "In relation with", Type: "Verb" },
                   { Id: 3, Code: "WHERE", Description: "Filter field", Type: "Verb" },
                   { Id: 4, Code: "SUM", Description: "Sum values of", Type: "Verb" },
                   { Id: 5, Code: "MIN", Description: "Calculate minimum for", Type: "Verb" },
                   { Id: 6, Code: "MAX", Description: "Calculate maximum for", Type: "Verb" },
                   { Id: 7, Code: "AVG", Description: "Calculate the average for", Type: "Verb" }],
            Entity: ["INNER_JOIN", "LEFT_JOIN"], //used as a criteria for populating dropdown e.g: i allow an entity search only if the previous verb is INNER JOIN or LEFT_JOIN
            Field: ["WHERE", "SUM" , "MIN" , "MAX" , "AVG" ] // for fields... like above
        };

     
        requireConfig(function () {
            require(['jquery-textcomplete'], function () {
                self.$element.textcomplete([{ //Entity strategy
                    match: /\B#([\-+\w]*)$/,
                    search: function (term, callback) {
                        var term_ = term.toLowerCase();
                        callback(entities ? $.map(entities, function (v) {
                            var iscontained = v.Description.toLowerCase().indexOf(term_) != -1 ? true : false;
                            if (Object.keys(self.tags).length == 0) return iscontained ? v : null;
                            var related = [];
                            $.each(self.tags, function (key, value) {
                                if (relations[key].indexOf(v.Code) != -1 && iscontained && self.lastType == "Verb"
                                    && (self.lastVerb && (verbs.Entity.indexOf(self.lastVerb.Code)) != -1)) //id it's in some relations with existing objects and the last item is a verb between entities...
                                {
                                    v.Verb = self.lastVerb.Code;
                                    v.ParentEntity = key;
                                    related.push(v);
                                }
                            });
                            return related;
                        }) : [])
                    },
                    index: 1,
                    replace: function (element) {
                        var str = getEntityFormat(element),
                            key = getEntityKey(element);
                        if (key in self.tags)
                            return '';
                        self.tags[key] = element;
                        self.lastType = "Entity";
                        return '#' + str + '# ';
                    },
                    idProperty: 'Id',
                    template: function (element) {
                        return '<b>' + element.Description + '</b> (' + element.Code + ')';
                    }
                },
                { //fields strategy
                    match: /\B@([\-+\w]*)$/,
                    search: function (term, callback) {
                        var term_ = term.toLowerCase();
                        callback(fields ? $.map(fields, function (v) {
                            var iscontained = v.Description.toLowerCase().indexOf(term_) != -1 ? true : false;
                            if (self.tags[v.Entity] && iscontained && self.lastType == "Verb"
                                    && (self.lastVerb && (verbs.Field.indexOf(self.lastVerb.Code)) != -1)) return v; 
                        }) : [])
                    },
                    index: 1,
                    replace: function (element) {
                        var str = getFieldFormat(element),
                            key = getFieldKey(element);
                        if (!self.tags[element.Entity])
                            self.tags[element.Entity] = {};
                        self.tags[element.Entity][key] = element;
                        self.lastType = "Field";
                        self.lastField = element;
                        return '@' + str + '@ ';
                    },
                    idProperty: 'Id',
                    template: function (element) {
                        return '<b>' + element.Description + '</b> (' + element.Entity + ')';
                    }
                },
                {//verbs strategy
                    match: /\B:([\-+\w]*)$/,
                    search: function (term, callback) {
                        var term_ = term.toLowerCase();
                        callback(verbs.list ? $.map(verbs.list, function (v) {
                            if (self.lastType == "Entity")
                                return v; 
                        }) : [])
                    },
                    index: 1,
                    replace: function (element) {
                        var str = getVerbFormat(element);
                        self.lastVerb = element;
                        self.lastType = "Verb";
                        return ':' + str + ': ';
                    },
                    idProperty: 'Id',
                    template: function (element) {
                        return '<b>' + element.Description + '</b>';
                    }
                },
                {//operator strategy
                    match: /\B%([\-+\w]*)$/,
                    search: function (term, callback) {
                        var term_ = term.toLowerCase();
                        callback(verbs.list ? $.map(verbs.list, function (v) {
                            if (self.lastType == "Field" && self.lastField && operators[self.lastField.type])
                                return v;
                        }) : [])
                    },
                    index: 1,
                    replace: function (element) {
                        var str = getVerbFormat(element);
                        self.lastVerb = element;
                        self.lastType = "Verb";
                        return ':' + str + ': ';
                    },
                    idProperty: 'Id',
                    template: function (element) {
                        return '<b>' + element.Description + '</b>';
                    }
                }], {
                    zIndex: self.options.zIndex,
                    debounces: self.options.debounces,
                    placement: self.options.placement,
                }
                ).on('keydown', function (e) {
                    if (e.keyCode == 8 || e.keyCode == 46) {
                        var entityre = /#.*?#/g,entityfi = /@.*?@/g, r,
                            range = self.$element.getCursorRange(),
                            deleted = false;
                        if (!range)
                            return;
                        //check if an entity has been deleted
                        while ((r = entityre.exec(this.value)) !== null) {
                            if (r.index + (e.keyCode == 8 ? 1 : 0) <= range[1] && range[0] <= (entityre.lastIndex - (e.keyCode == 46 ? 1 : 0))) {
                                var deletedPiece = this.value.substring(r.index, entityre.lastIndex);
                                this.value = this.value.substring(0, r.index) + this.value.substring(entityre.lastIndex).replace('/^\s+/', '');
                                $.each(self.tags, function (k, v) {
                                    if ('#' + getEntityFormat(v) + '#' == deletedPiece) {
                                        delete self.tags[k];
                                        return false;
                                    }
                                });
                                return false;
                            }
                        }
                        while ((r = entityfi.exec(this.value)) !== null) {
                            if (r.index + (e.keyCode == 8 ? 1 : 0) <= range[1] && range[0] <= (entityfi.lastIndex - (e.keyCode == 46 ? 1 : 0))) {
                                var deletedPiece = this.value.substring(r.index, entityfi.lastIndex);
                                this.value = this.value.substring(0, r.index) + this.value.substring(entityfi.lastIndex).replace('/^\s+/', '');
                                $.each(self.tags, function (k, v) {
                                    $.each(v, function (fk, fv) {
                                        if ('@' + getFieldFormat(fv) + '@' == deletedPiece) {
                                            delete v[fk];
                                            return false;
                                        }
                                    });
                                });
                                return false;
                            }
                        }
                    }
                }).on('keyup', function () {
                    if (this.value.length <= 1)
                        self.tags = {};
                });
            });
        });
    }
    textEntitySelector.prototype = {
        constructor: textEntitySelector,
        getExpression: function () {
            return $.map(this.tags, function (v, k) {
                return [v];
            })
        }
    }

    $.fn.textEntitySelector = function (arg1, arg2) {
        var results = [];
        this.each(function () {
            var textentityselector = $(this).data('textentityselector');
            if (!textentityselector) {
                textentityselector = new textEntitySelector(this, arg1);
                $(this).data('textentityselector', textentityselector);
                results.push(textentityselector);
            } else if (!arg1 && !arg2) {
                results.push(textentityselector);
            } else if (textentityselector[arg1] !== undefined) {
                var retVal = textentityselector[arg1](arg2);
                if (retVal !== undefined)
                    results.push(retVal);
            }
        });

        if (typeof arg1 == 'string') {
            return results.length > 1 ? results : results[0];
        } else {
            return results;
        }
    }

}(jQuery));

function populateUploadFileWindow(options) {
    if ($('#uploadWindow').length < 1) {
        if (!options)
            options = {};
        var uploadWindow = $(document.createElement('div'));
        var savePath = "/chatFiles/";
        uploadWindow.attr('id', 'uploadWindow');

        $('body').append(uploadWindow);

        uploadWindow.append('<div class="row">\
                <div class="col-sm-12 bo-tagbox"></div>\
                <div class="col-sm-12" id="uploadFileWrapper" style="clear: both;">\
                    <div class="k-edit-label"><label>' + getObjectText('documentType') + ':</label></div>\
                    <div class="k-edit-field"><input id="documentTypeDropDown" style="width: 300px; margin-bottom: 5px;"></div>\
                    <div class="k-header" style="clear: both;">\
                        <input name="files" id="files" type="file" />\
                    </div>\
                    <button id="uploadFileButton" type="button" style="margin-top: 10px; height: 30px; width: 50px; float: right;">' + getObjectText('send') + '</button>\
                </div>\
                <div class="col-sm-12" id="addToChatMessageContainer" style="display: none; clear: both;">\
                    <button id="addChatMessageToBOButton" type="button" style="margin-top: 10px; height: 30px; float: right;">' + getObjectText('add') + '</button>\
                </div>\
             </div>');

        uploadWindow.find('.bo-tagbox').bOSelector(options);

        var status, documentType = null, thisFileGotTracked = false;

        uploadWindow.find('#documentTypeDropDown').kendoDropDownList({
            dataTextField: "Description",
            dataValueField: "ID",
            change: function (e) {
                var value = this.value();
                documentType = value;
            },
            dataBound: function (e) {
                if (documentType == null) {
                    documentType = "None";
                    var dD = $('#documentTypeDropDown').data("kendoDropDownList");
                    var noneItem = { ID: "None", Description: "None" };
                    var interval = setInterval(function () {
                        var firstItem = dD.dataSource.at(0);
                        if (firstItem && firstItem.ID != "None") {
                            dD.dataSource.insert(0, noneItem);
                            dD.select(function (dataItem) {
                                return dataItem.Description === "None";
                            });
                            clearInterval(interval);
                        }
                    }, 100);
                }
            }
        });
        getdropdatasource("Magic_DocumentRepositoryType", "Description", "", "documentTypeDropDown", null, "ID", null, 2);

        initKendoUploadField(uploadWindow.find('#files'), {
            savepath: savePath,
            multiple: false,
            success: function (e) {
                uploadSuccess(e, uploadWindow);
                $('#uploadFileButton').data("kendoButton").enable(e.operation == 'upload');
            }
        });

        uploadWindow.find('#uploadFileButton').kendoButton({
            enable: false,
            click: function () {
                var upload = uploadWindow.find('#files').data("kendoUpload");
                if (!upload.options.files.length || active_chat.length < 1) {
                    return;
                }
                var message = {
                    Text: '<a href="/api/MAGIC_SAVEFILE/GetFile?path=' + encodeURIComponent(savePath + upload.options.files[0].name) + '" target="_blank">' + upload.options.files[0].name.replace(/^\d{13,}-/, "") + '</a>',
                    File: '/api/MAGIC_SAVEFILE/GetFile?path=' + encodeURIComponent(savePath + upload.options.files[0].name)
                };
                uploadWindow.data("filesToDelete", []);
                manageGridUploadedFiles(uploadWindow);
                uploadWindow.data("kendoWindow").close();
                if (typeof sendMessageTo == 'function')
                    sendMessageTo(active_chat, message);
                if (!thisFileGotTracked) {
                    thisFileGotTracked = true;
                    delete message["Text"];
                    if (documentType != "None")
                        message["DocumentTypeID"] = documentType;
                    var tags = uploadWindow.find(".bo-tagbox").bOSelector('getBOs');
                    if (tags.length > 0) {
                        message['BOType'] = tags[0].Type;
                        message['BOId'] = tags[0].Id;
                    }

                    $.ajax({
                        type: "POST",
                        url: "/api/ChatDocument/Post",
                        data: JSON.stringify(message),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function () {
                            kendoConsole.log('Success', 'success');
                            uploadWindow.data("kendoWindow").close();
                        }
                    });
                }
            }
        });

        uploadWindow.find('#addChatMessageToBOButton').kendoButton({
            click: function () {
                saveBO(uploadWindow.find(".bo-tagbox").bOSelector('getBOs'), function () {
                    uploadWindow.find(".bo-tagbox").bOSelector('removeAll');
                    uploadWindow.data("kendoWindow").close();
                });
            }
        });

        if (!uploadWindow.data("kendoWindow")) {
            uploadWindow.kendoWindow({
                width: "600px",
                //height: "656px",
                //title: "File upload",
                actions: [
                    "Close"
                ],
                pinned: true,
                visible: false
            });
        }

        uploadWindow.data("kendoWindow").open();
        uploadWindow.data("kendoWindow").center();
    }
    else {
        $('#uploadWindow').data("kendoWindow").open();
        $('#uploadWindow').data("kendoWindow").center();
        $('#uploadWindow').find('.bo-tagbox').bOSelector('refreshGrid');
    }
}

function saveBO(tags, callback) {
    var BOSdata = {},
        message = {};

    if (tags.length > 0) {
        BOSdata['BOType'] = tags[0].Type;
        BOSdata['BOId'] = tags[0].Id;
    }

    if (BOSdata && BOSdata.BOType && BOSdata.BOId && BOSMessageText !== undefined && BOSMessageType !== undefined) {
        message['BOType'] = BOSdata.BOType;
        message['BOId'] = BOSdata.BOId;
        $.ajax({
            type: "POST",
            aync: true,
            url: "/api/GENERICSQLCOMMAND/GetWithFilter",
            data: JSON.stringify({ table: "dbo.Magic_DocumentRepositoryType", order: "Description", where: "Description = '" + BOSMessageType + "'" }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                if (result.Count > 0) {
                    message["DocumentTypeID"] = result.Data[0].Table[0].ID;
                }
                if ($('#uploadWindow').lenght > 0)
                    $('#uploadWindow').data("kendoWindow").close();
                var url = "/api/ChatDocument/Post";
                message['File'] = BOSMessageText.trim();
                if ('BOTags' in BOSdata) {
                    var sent = 0;
                    var lenght = 0;
                    $.each(BOSdata.BOTags, function (k, v) {
                        message['BOType'] = v.Type;
                        message['BOId'] = v.Id;
                        length++;
                        $.ajax({
                            type: "POST",
                            url: url,
                            data: JSON.stringify(message),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function () {
                                if (length == ++sent)
                                    kendoConsole.log('Added successfully!', 'success');
                                if (callback)
                                    callback();
                            },
                        });
                    });
                }
                else {
                    $.ajax({
                        type: "POST",
                        url: url,
                        data: JSON.stringify(message),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function () {
                            kendoConsole.log('Added successfully!', 'success');
                            if (callback)
                                callback();
                        }
                    });
                }
            }
        });
    }
}