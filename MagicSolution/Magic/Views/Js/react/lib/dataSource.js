import DataSourceRegistry from './dataSourceRegistry';

export default class DataSource {

    // create ds registry that allows to register change events by passing ds_id and property

    constructor(definition, id) {
        this.id = id;
        this._definition = {};
        this._events = {
            changed: [],
            filtered: [],
            dependencyChanged: [],
        };
        this._data = [];
        this._viewData = [];
        this._filterValue = {};

        this._dependencyData = [];
        this._dependencyChangeHandlers = [];
        this._dependencyFilters = [];
        this._isDependenciesMet = true;
        this._isDisposed = false;

        this.setDefinition(definition);

        if (this.id) {
            DataSourceRegistry.register(this);
        }
    }

    dispose() {
        this._isDisposed = true;
        if (this.id) {
            DataSourceRegistry.remove(this);
        }
    }

    setDefinition(definition) {
        if (this._dependencyChangeHandlers.length) {
            this._unregisterDependencies();
        }

        this._definition = {};
        this._dependencyData = [];
        this._dependencyChangeHandlers = [];
        this._dependencyFilters = [];
        this._isDependenciesMet = true;
        this._viewData = [];
        this._data = [];
        this._filterValue = {};

        Object.assign(this._definition, this._sanitizeDefinition(definition));

        if (this._definition._dependencies.length) {
            this._registerDependencies();
        }

        if (this._definition._filter) {
            this.setNamedFilter(this._definition._filter);
        }

        if (this._definition._data) {
            this._handleIncomingData(this._definition._data);
        }
        this.fetch();
    }

    get definition() {
        return this._definition;
    }

    _sanitizeDefinition(definition) {
        let definitionDefaults = {
            _select: null,
            _id: ['id'],
            _fields: {},
            _defaultSearchParam: 'q',
            _dependencies: [],
            _isOffline: false,
            // _dependencies: [
            //     {
            //         dataSource: {},
            //         dataSourceId: '',
            //         filter: {}, // or function to build filter, return false to prevent filtering
            //         fields: [
            //             {
            //                 field: 'id',
            //                 required: true, // required means the ds will not load data until all required fields are set
            //             }
            //         ],
            //     }
            // ]
        };

        if (definition) {

            let validDefinition = {};

            // case definition is data
            if (
                Array.isArray(definition)
                || !definition.data
                    && !definition.source
                    && !definition.magicDataSource
            ) {
                validDefinition._data = definition;
                return Object.assign(definitionDefaults, validDefinition);
            }

            if (definition.isOffline === true) {
                validDefinition._isOffline = true;
            }

            if (definition.magicDataSource) {
                validDefinition = this._convertMagicDataSource(definition.magicDataSource);
            }

            if ('defaultSearchParam' in definition) {
                validDefinition._defaultSearchParam = definition.defaultSearchParam;
            }

            if (definition.data) {
                validDefinition._data = definition.data;
            }

            if (definition.fields) {
                validDefinition._fields = definition.fields;
            }

            if (definition.id) {
                if (Array.isArray(definition.id)) {
                    validDefinition._id = definition.id;
                }
                else {
                    validDefinition._id = [definition.id];
                }
            }

            if (definition.source) {
                validDefinition._source = definition.source;
            }

            if (definition.select) {
                validDefinition._select = definition.select;
            }

            if (Array.isArray(definition.dependencies)) {
                validDefinition._dependencies = definition.dependencies;
            }

            if (definition.filter) {
                validDefinition._filter = definition.filter;
            }

            return Object.assign(definitionDefaults, validDefinition);
        }

        return definitionDefaults;
    }

    getId(data) {
        return this._definition
            ._id
            .map(idProperty => data[idProperty])
            .join(',');
    }

    // pass function for local filtering or filter to pass to server
    async filter(condition = null) {
        let data;
        if (typeof condition === 'function') {
            data = this._data.filter(condition);
        }
        else {
            this.setNamedFilter(condition);
            data = await this.fetch();
        }
        if (data) {
            this._viewData = data;
            this.trigger('filtered', data);
        }
    }

    clearFilters() {
        this._filterValue = {};
    }

    // removes existing named filter, then sets new filter (condition)
    setNamedFilter(condition = null, name = 'default', logic = 'and') {
        condition = this._parseFilter(condition);
        if (condition !== null) {
            condition.name = name;
        }
        if (!this._filterValue.filters) {
            if (condition === null) {
                return;
            }
            this._filterValue = {
                filters: [
                    condition,
                ],
                logic,
            };
        }
        else {
            let index = this._filterValue.filters.findIndex(condition => condition.name === name);
            if (index > -1) {
                this._filterValue.filters.splice(index, 1);
            }
            if (condition !== null) {
                this._filterValue.filters.push(condition);
            }
        }
    }

    _parseFilter(condition) {
        if (condition !== null) {
            if (typeof condition === 'string') {
                if (!condition) {
                    return null;
                }
                condition = {
                    field: this._definition._defaultSearchParam,
                    operator: 'contains',
                    value: condition,
                };
                return condition;
            }
            if (condition.filters) {
                $.each(condition.filters, this._parseFilter);
            }
            else {
                if (condition.field === '__id') {
                    condition = this._getIdFilter(condition);
                }
            }
            return condition;
        }
        return null;
    }

    _getIdFilter(condition) {
        let value;
        if (typeof condition.value === 'string') {
            value = condition.value.split(',');
        }
        else if (Array.isArray(condition.value)) {
            value = condition.value;
        }
        else {
            value = [condition.value];
        }
        condition.logic = 'and';
        condition.filters = this._definition._id
            .map((partialId, i) => ({
                field: partialId,
                operator: condition.operator || 'eq',
                value: value[i],
            }));
        delete condition.field;
        delete condition.value;
        delete condition.operator;
        return condition;
    }

    trigger(eventName, data, additionalInfo) {
        setTimeout(() => {
            if (this._isDisposed) {
                return;
            }
            if (this._events[eventName].length) {
                let event = {
                    name: eventName,
                    data,
                    sender: this,
                };
                if (additionalInfo) {
                    event = Object.assign(event, additionalInfo);
                    event.additionalInfo = additionalInfo;
                }
                this
                    ._events[eventName]
                    .map(handler => handler(
                        Object.assign({}, event)
                    ));
            }
        });
    }

    on(eventName, handler) {
        if (eventName in this._events) {
            this._events[eventName].push(handler);
            return true;
        }
        return false;
    }

    unbind(eventName, handler) {
        if (eventName in this._events) {
            let eventHandlers = this._events[eventName];
            for (let i = 0; i < eventHandlers.length; i++) {
                if (handler === eventHandlers[i]) {
                    eventHandlers.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }

    _project(data) {
        let record = {
            ...data,
            __id: data.__id,
        }
        for (let [ column, alias ] of Object.entries(this._definition._select)) {
            if (Array.isArray(alias)) {
                for (const a of alias) {
                    record[a] = data[column];
                }
            }
            else {
                record[alias] = data[column];
            }
        }
        return record;
    }

    async fetch() {
        let data = this._data;
        if (this._definition._source) {
            if (!this._areDependenciesMet()) {
                return this._data;
            }
            let source = this._definition._source;
            let typeOfSource = typeof source;
            if (typeOfSource === 'function') {
                data = await source(this._filterValue);
            }
            else if (typeOfSource === 'string') {
                data = await $.getJSON(source, { q: encodeURIComponent(JSON.stringify(this._filterValue)) });
            }
            data = this._handleIncomingData(data);
        }
        else if (this._definition._isOffline) {
            return this.filterOffline();
        }
        return data;
    }

    filterOffline(filter = this._filterValue) {
        if (!filter) {
            this.trigger('filtered', this._data);
            return this._data;
        }
        if (Array.isArray(this._data)) {
            const data = this._data
                .filter(value => DataSource.recurConditions(filter, value));
            this._viewData = data;
            this.trigger('filtered', data);
            return data;
        }
        return this._data;
    }

    static recurConditions(filter, value) {
        if (filter.filters) {
            const logic = filter.logic || 'and';
            for (const condition of filter.filters) {
                if (logic === 'and') {
                    if (!DataSource.recurConditions(condition, value)) {
                        return false;
                    }
                }
                else {
                    if (DataSource.recurConditions(condition, value)) {
                        return true;
                    }
                }
            }
            if (logic === 'and') {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return DataSource.applyConditionsToValue(filter, value);
        }
    }

    static applyConditionsToValue(conditions, value) {
        if (!(conditions.field in value)) {
            return false;
        }
        switch (conditions.operator) {
            case 'contains':
                const stringValue = value[conditions.field]+'';
                return stringValue.toLowerCase().includes(conditions.value.toLowerCase());
            default:
                return conditions.value === value[conditions.field];
        }
    }

    _registerDependencies() {
        let dependencies = this._definition._dependencies;
        let i = 0;
        while (i < dependencies.length) {
            let dependency = dependencies[i];
            if (
                !dependency.dataSource
                    && !dependency.dataSourceId
                || !dependency.fields
            ) {
                dependencies.splice(i, 1);
                continue;
            }
            this._isDependenciesMet = false;
            let handler = this._dependencyChangeHandler(i);
            this._dependencyFilters.push({});
            this._dependencyChangeHandlers.push(handler);
            if (dependency.dataSource) {
                dependency.dataSource.on('changed', handler);
                this._dependencyData.push(dependency.dataSource.data);
            }
            else {
                DataSourceRegistry.on('changed', dependency.dataSourceId, handler);
                this._dependencyData.push(DataSourceRegistry.getData(dependency.dataSourceId));
            }
            i++;
        }
    }

    _unregisterDependencies() {
        let dependencies = this._definition._dependencies;
        let i = 0;
        while (i < dependencies.length) {
            let dependency = dependencies[i];
            let handler = this._dependencyChangeHandlers.shift();
            if (dependency.dataSource) {
                dataSource.unbind('changed', handler);
            }
            else {
                DataSourceRegistry.unbind('changed', dependency.dataSourceId, handler);
            }
            this._dependencyData.shift();
            i++;
        }
    }

    _dependencyChangeHandler(index) {
        return (event) => {
            if (!this._isDependency(event, index)) {
                return;
            }
            this._dependencyData[index] = event.dataItem;
            // optimization, if all dependencies are met, we only check changed dependency
            if (this._isDependenciesMet) {
                this._isDependenciesMet = this._isDependencyMet(index);
            }
            this.trigger('dependencyChanged', event.data, Object.assign({ dependencyDefinition: this._definition._dependencies[index] }, event.additionalInfo || {}));
            this.fetch();
        };
    }

    _isDependency(event, index) {
        let dependency = this._definition._dependencies[index];
        if (event.property && dependency.fields) {
            return dependency.fields.some((field) => field.name === event.property);
        }
        return false;
    }

    _isDependencyMet(index) {
        let dependency = this._definition._dependencies[index];
        let dependencyData = this._dependencyData[index];
        if (dependencyData) {
            if (dependency.fields) {
                for (let field of dependency.fields) {
                    if (field.required && !dependencyData[field.name]) {
                        return false;
                    }
                }
                let filter = this._parseDependencyFilter(dependency, dependencyData);
                if (filter) {
                    this.setNamedFilter(filter, 'dependencyFilterIndex' + index);
                }
            }
            return true;
        }
        return false;
    }

    _parseDependencyFilter(dependency, dependencyData) {
        if (dependency.filter) {
            return this._recurAndCreateFilter(dependency.filter, dependencyData);
        }
        return null;
    }

    _recurAndCreateFilter(filterBluePrint, data, filter) {
        if (!filter) {
            filter = Object.assign({}, filterBluePrint);
            delete filter.filters;
        }
        if (filterBluePrint.filters) {
            filter.filters = [];
            filterBluePrint.filters.map(filterBluePrint => {
                let newFilter = {};
                newFilter = this._recurAndCreateFilter(filterBluePrint, data, newFilter);
                if (newFilter) {
                    filter.filters.push(newFilter);
                }
            });
            if (!filter.filters.length) {
                delete filter.filters;
            }
        }
        else {
            filter = Object.assign(filter, filterBluePrint);
            if (filter.value.startsWith('__')) {
                let field = filter.value.substring(2);
                if (field in data) {
                    filter.value = data[field];
                }
                else {
                    return null;
                }
            }
        }
        return filter;
    }

    _areDependenciesMet() {
        if (this._isDependenciesMet) {
            return true;
        }
        for (let i = 0; i < this._definition._dependencies.length; i++) {
            if (!this._isDependencyMet(i)) {
                return this._isDependenciesMet = false;
            }
        }
        return this._isDependenciesMet = true;
    }

    _handleIncomingData(data) {
        if (data) {
            if (Array.isArray(data)) {
                if (data.length) {
                    let type = typeof data[0];
                    data = data.map(dataItem => {
                        if (dataItem && type === 'object') {
                            return this._transformIntoDataItem(dataItem, true);
                        }
                        return dataItem;
                    });
                }
            }
            else {
                data = this._transformIntoDataItem(data);
            }
            this._data = this._viewData = data;
            this.trigger('changed', data, { targetOfType: 'data' });
            return data;
        }
        throw new Error('data has to of type Array [] or Object {}');
    }

    _transformIntoDataItem(dataItem) {
        // set __id
        dataItem.__id = this.getId(dataItem);
        // project
        if (this._definition._select) {
            dataItem = this._project(dataItem);
        }
        // transform into proxy to get changes
        dataItem = this._getDataItemProxy(dataItem);
        return dataItem;
    }

    _getDataItemProxy(dataItem) {
        return new Proxy(dataItem, {
            set: (item, property, value) => {
                if (item[property] === value) {
                    return true;
                }
                item[property] = value;
                this.trigger('changed', value, { targetOfType: 'item', property, dataItem: item });
                return true;
            }
        });
    }

    get data() {
        return this._data;
    }

    set data(data) {
        this._handleIncomingData(data);
    }

    get filterValue() {
        return this._filterValue;
    }

    get viewData() {
        return this._viewData;
    }

    _convertMagicDataSource(magicDataSource) {
        let definition = {};

        // default case DropdownValues
        if (magicDataSource.MagicDataSourceValueField) {
            definition._defaultSearchParam = magicDataSource.MagicDataSourceTextField;
            definition._select = {
                value: 'id',
                text: 'description',
            };
            definition._source = function (condition) {
                return $.post({
                    url: '/api/ManageFK/GetDropdownValues',
                    data: JSON.stringify({
                        tablename: magicDataSource.MagicDataSource,
                        valuefield: magicDataSource.MagicDataSourceValueField,
                        textfield: magicDataSource.MagicDataSourceTextField,
                        filter: condition,
                    }),
                    contentType: 'application/json',
                });
            };
            definition._id = [magicDataSource.MagicDataSourceValueField];
        }

        if (magicDataSource.CascadeColumnName) {
            let dependency = {
                dataSource : magicDataSource.getDataSource(),
                fields: [],
                filter: {
                    logic: 'and',
                    filters: [],
                },
            };
            let dependencyFields = magicDataSource.CascadeColumnName.split(',');
            let filterFieldValues = magicDataSource.CascadeFilterColumnName.split(',');
            dependencyFields.map((dependencyFieldName, i) => {
                dependency.fields.push({
                    name: dependencyFieldName,
                    required: true,
                });
                dependency.filter.filters.push({
                    field: filterFieldValues[i],
                    value: '__' + dependencyFieldName,
                    operator: 'eq',
                });
            });
            definition._dependencies = [dependency];
        }

        return definition;
    }

}