export default new class DataSourceRegistry {
    constructor() {
        if (window.dataSourceRegistry) {
            return window.dataSourceRegistry;
        }

        this._dataSources = {};
        this._events = {};
        this._eventsWaitingToBeAssigned = {};
    }

    register(dataSource) {
        this._dataSources[dataSource.id] = dataSource;
        this._assignEventsWaiting(dataSource);
    }

    remove(dataSource) {
        // move added events to waiting events in order to reappend the handlers in case the dataSource returns to scope
        if (dataSource.id in this._events) {
            this._eventsWaitingToBeAssigned[dataSource.id] = this._events[dataSource.id];
        }
        delete this._dataSources[dataSource.id];
    }

    getData(dataSourceId) {
        if (dataSourceId in this._dataSources) {
            return this._dataSources[dataSourceId].data;
        }
        return null;
    }

    on(eventName, dataSourceId, handler) {
        if (dataSourceId in this._dataSources) {
            let dataSource = this._dataSources[dataSourceId];
            dataSource.on(eventName, handler);
            DataSourceRegistry._add(this._events, dataSourceId, eventName, handler);
        }
        else {
            DataSourceRegistry._add(this._eventsWaitingToBeAssigned, dataSourceId, eventName, handler);
        }
    }

    unbind(eventName, dataSourceId, handler) {
        // if no dataSourceId is provided add to all dataSources?
        if (dataSourceId in this._dataSources) {
            let { item } = DataSourceRegistry._get(this._events, dataSourceId, eventName, handler) || {};
            if (item) {
                this._dataSources[dataSourceId].unbind(eventName, handler);
                return DataSourceRegistry._remove(this._events, dataSourceId, eventName, handler, item);
            }
            return false;
        }
        else {
            return DataSourceRegistry._remove(this._events, dataSourceId, eventName, handler);
        }
    }

    static _add(hashMap, dataSourceId, eventName, handler) {
        if (!(dataSourceId in hashMap)) {
            hashMap[dataSourceId] = [];
        }
        hashMap[dataSourceId].push({ eventName, handler });
    }

    static _remove(hashMap, dataSourceId, eventName, handler, item) {
        if (!item) {
            item = DataSourceRegistry._get(hashMap, dataSourceId, eventName, handler);
        }
        if (item) {
            hashMap[dataSourceId].splice(item.index, 1);
            if (!hashMap[dataSourceId].length) {
                delete hashMap[dataSourceId];
            }
        }
        return item !== null;
    }

    static _get(hashMap, dataSourceId, eventName, handler) {
        if (dataSourceId in hashMap) {
            let index = hashMap[dataSourceId].findIndex(item => item.handler === handler && item.eventName === eventName);
            return index !== -1
                ? {
                    index,
                    item: hashMap[dataSourceId][index],
                }
                : null;
        }
        return null;
    }

    _assignEventsWaiting(dataSource) {
        if (dataSource.id in this._eventsWaitingToBeAssigned) {
            let eventsToAssign = this._eventsWaitingToBeAssigned[dataSource.id];
            while (eventsToAssign.length) {
                let { eventName, handler } = eventsToAssign.pop();
                this.on(eventName, dataSource.id, handler);
            }
            delete this._eventsWaitingToBeAssigned[dataSource.id];
        }
    }

    restoreDataFromSessionStorage(){

    }
}