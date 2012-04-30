Ext.define('Ux.data.WebSocketStore', {
    extend : 'Ext.data.Store',
    alias  : 'store.websocketstore',

    config : {
        socketId           : true,
        actionEvents       : {
            create     : 'create_{socketId}',
            read       : 'read_{socketId}',
            update     : 'update_{socketId}',
            destroy    : 'destroy_{socketId}',
            batch      : 'batch_{socketId}',
            register   : 'register',
            unregister : 'unregister'
        },
        runQueueOnAction   : true,
        queue              : null,
        batch              : false,
        socket             : null,
        registered         : false,
        idProperty         : 'id',
        rootProperty       : 'data',
        successProperty    : 'success',
        totalProperty      : 'total',
        messageProperty    : 'message',
        clientIdParam      : 'clientId',
        //paging
        enablePagingParams : true,
        startParam         : 'start',
        pageParam          : 'page',
        limitParam         : 'limit',
        //grouping
        groupParam         : 'group',
        //sorting
        simpleSortMode     : false,
        sortParam          : 'sort',
        directionParam     : 'dir',
        //filtering
        filterParam        : 'filter'
    },

    constructor : function (config) {
        var me = this;

        me.onRegister   = Ext.Function.bind(me.onRegister,   me);
        me.onUnRegister = Ext.Function.bind(me.onUnRegister, me);
        me.onBatch      = Ext.Function.bind(me.onBatch,      me);
        me.onCreate     = Ext.Function.bind(me.onCreate,     me);
        me.onRead       = Ext.Function.bind(me.onRead,       me);
        me.onUpdate     = Ext.Function.bind(me.onUpdate,     me);
        me.onDestroy    = Ext.Function.bind(me.onDestroy,    me);

        me.callParent([config]);
    },

    destroy : function() {
        var me = this;

        me.removeSocketEvents(null, true);

        me.callParent();
    },

    applyProxy : function() {
        this.setSyncRemovedRecords(true);

        return null;
    },

    applySocketId : function (id) {
        if (!Ext.isString(id)) {
            id = Ext.id();
        }

        return id;
    },

    applyActionEvents : function (events) {
        var id = this.getSocketId();

        events.batch   = events.batch  .replace('{socketId}', id);
        events.create  = events.create .replace('{socketId}', id);
        events.read    = events.read   .replace('{socketId}', id);
        events.update  = events.update .replace('{socketId}', id);
        events.destroy = events.destroy.replace('{socketId}', id);

        return events;
    },

    updateSocket : function(socket, oldSocket) {
        var me     = this,
            events = me.getActionEvents(),
            id     = me.getSocketId();

        oldSocket && oldSocket.emit(events.unregister, id);

        if (socket) {
            socket.on(events.register, me.onRegister);

            socket.emit(events.register, id);
        }
    },

    initSocketEvents : function(socket) {
        var me     = this,
            events = me.getActionEvents();

        if (!socket) {
            socket = me.getSocket();
        }

        socket.on( events.register,   me.onRegister   );
        socket.on( events.unregister, me.onUnRegister );
        socket.on( events.batch,      me.onBatch      );
        socket.on( events.create,     me.onCreate     );
        socket.on( events.read,       me.onRead       );
        socket.on( events.update,     me.onUpdate     );
        socket.on( events.destroy,    me.onDestroy    );
    },

    removeSocketEvents: function(socket, destroy) {
        if (!socket) {
            socket = this.getSocket();
        }

        socket && socket.removeAllListeners();

        if (destroy) {
            this.setSocket(null);
        }
    },

    onRegister : function (success) {
        var me = this;

        me.setRegistered(success);

        if (success) {
            var socket = me.getSocket(),
                events = me.getActionEvents();

            me.initSocketEvents(socket);
            socket.removeListener(events.register, me.onRegister);
        }

        if (me.getAutoLoad()) {
            me.load();
        }
    },

    onUnRegister : function (success) {
        if (success) {
            var me     = this,
                socket = me.getSocket(),
                events = me.getActionEvents();

            this.setRegistered(false);

            me.removeSocketEvents(socket);

            socket && socket.on(events.register, me.onRegister);
        }
    },

    onBatch : function(datas) {
        var me            = this,
            d             = 0,
            root          = datas.data,
            dLen          = root.length,
            clientIdParam = me.getClientIdParam(),
            idProperty    = me.getIdProperty(),
            data, action, clientId, rec, removed, newRemoved, r, rLen;

        for (; d < dLen; d++) {
            data     = root[d];
            action   = data.action;
            clientId = data[clientIdParam];
            rec      = me.getById(clientId);

            if (action === 'destroy') {
                if (rec) {
                    //temporarily not keep track of destroyed records
                    //this is because the server is telling the client
                    //to remove the records so we don't need to sync
                    //with the server
                    me.setSyncRemovedRecords(false);

                    me.remove(rec);

                    console.warn('Record removed from store in batch', rec);

                    me.setSyncRemovedRecords(true);
                } else {
                    removed    = me.removed;
                    newRemoved = [];
                    r          = 0;
                    rLen       = removed.length;

                    for (; r < rLen; r++) {
                        rec = removed[r];

                        if (rec.getId() !== clientId) {
                            newRemoved.push(rec)
                        }
                    }

                    me.removed = newRemoved;

                    console.warn('Record removed from batch', data);

                    me.removeFromQueue(clientId, action);
                }
            } else {
                //create and update
                if (rec) {
                    if (action === 'create') {
                        rec.setId(data[idProperty]);
                    }

                    rec.set(data);
                    rec.commit();

                    me.removeFromQueue(clientId, action);

                    console.warn('Record from batch', rec);
                } else {
                    if (action === 'create') {
                        me.add(data);

                        me.removeFromQueue(clientId, action);

                        console.warn('Record create from batch', data);
                    } else {
                        console.warn('Record not found while trying to edit in batch', data);
                    }
                }
            }
        }
    },

    onCreate : function(datas) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            rootProperty     = me.getRootProperty(),
            success          = datas[successProperty],
            total            = datas[totalProperty],
            message          = datas[messageProperty],
            root             = datas[rootProperty],
            model            = me.getModel(),
            idProperty       = model.getIdProperty(),
            clientIdParam    = me.getClientIdParam(),
            r                = 0,
            rLen             = root.length,
            records          = [],
            data, clientId, rec;

        if (success) {
            for (; r < rLen; r++) {
                data     = root[r];
                clientId = data[clientIdParam];
                rec      = me.getById(clientId);

                if (rec) {
                    rec.setId(data[idProperty]);
                    rec.set(data);
                    rec.commit();
                } else {
                    records.push(
                        new model(data)
                    );
                }

                me.removeFromQueue(clientId, 'create');
            }

            me.add(records);

            me.setTotalCount(total);

            //me.fireEvent('addrecords', me, records);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        if (runQueueOnAction) {
            me.runQueue();
        }
    },

    onRead : function(data) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            rootProperty     = me.getRootProperty(),
            success          = data[successProperty],
            total            = data[totalProperty],
            message          = data[messageProperty],
            root             = data[rootProperty],
            records;

        if (success) {
            me.removeAll();

            records = me.add(root);

            me.setTotalCount(total);

            me.fireEvent('load', me, records, success, null);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        if (runQueueOnAction) {
            me.runQueue();
        }
    },

    onUpdate : function(datas) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            rootProperty     = me.getRootProperty(),
            success          = datas[successProperty],
            total            = datas[totalProperty],
            message          = datas[messageProperty],
            root             = datas[rootProperty],
            model            = me.getModel(),
            idProperty       = model.getIdProperty(),
            clientIdParam    = me.getClientIdParam(),
            r                = 0,
            rLen             = root.length,
            data, clientId, rec;

        if (success) {
            for (; r < rLen; r++) {
                data     = root[r];
                clientId = data[clientIdParam];
                rec      = me.getById(clientId);

                if (rec) {
                    if (data[idProperty]) {
                        rec.setId(data[idProperty]);
                    }

                    rec.set(data);
                    rec.commit();

                    me.removeFromQueue(clientId, 'update');
                }
            }

            me.setTotalCount(total);

            //me.fireEvent('updaterecords', me, records);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        if (runQueueOnAction) {
            me.runQueue();
        }
    },

    onDestroy : function(datas) {
        var me               = this,
            runQueueOnAction = me.getRunQueueOnAction(),
            successProperty  = me.getSuccessProperty(),
            rootProperty     = me.getRootProperty(),
            totalProperty    = me.getTotalProperty(),
            messageProperty  = me.getMessageProperty(),
            clientIdParam    = me.getClientIdParam(),
            success          = datas[successProperty],
            root             = datas[rootProperty],
            total            = datas[totalProperty],
            message          = datas[messageProperty],
            r                = 0,
            rLen             = root.length,
            data, clientId, removed, newRemoved, i, iLen, rec;

        if (success) {
            for (; r < rLen; r++) {
                data       = root[r];
                clientId   = data[clientIdParam];
                rec        = me.getById(clientId);

                if (rec) {
                    //temporarily not keep track of destroyed records
                    //this is because the server is telling the client
                    //to remove the records so we don't need to sync
                    //with the server
                    me.setSyncRemovedRecords(false);

                    me.remove(rec);

                    me.setSyncRemovedRecords(true);
                } else {
                    removed    = me.removed;
                    newRemoved = [];
                    i          = 0;
                    iLen       = removed.length;

                    for (; i < iLen; i++) {
                        rec = removed[i];

                        if (rec.getId() !== clientId) {
                            newRemoved.push(rec)
                        }
                    }

                    me.removed = newRemoved;
                }
            }

            me.setTotalCount(total);

            //me.fireEvent('removerecords', me, records);
        } else {
            me.fireEvent('exception', me, success, message);
        }

        if (runQueueOnAction) {
            me.runQueue();
        }
    },

    load : function(options) {
        var socket = this.getSocket(),
            events = this.getActionEvents(),
            params = this.getParams(options);

        //TODO handle paging, filter, sort etc
        socket.emit(events.read, params);
    },

    getParams : function(options) {
        if (!options) {
            options = {};
        }

        var me             = this,
            params         = {},
            //grouping
            groupParam     = me.getGroupParam(),
            grouper        = me.getGrouper(),
            //sorting
            simpleSortMode = me.getSimpleSortMode(),
            sortParam      = me.getSortParam(),
            directionParam = me.getDirectionParam(),
            sorters        = me.getSorters(),
            //filtering
            filterParam    = me.getFilterParam(),
            filters        = me.getFilters(),
            //paging
            page           = options.page     || me.currentPage,
            limit          = options.pagesize || me.getPageSize(),
            start          = (page - 1) * limit,
            pageParam      = me.getPageParam(),
            startParam     = me.getStartParam(),
            limitParam     = me.getLimitParam();

        if (me.getEnablePagingParams()) {
            if (pageParam && page !== null) {
                params[pageParam] = page;
            }

            if (startParam && start !== null) {
                params[startParam] = start;
            }

            if (limitParam && limit !== null) {
                params[limitParam] = limit;
            }
        }

        if (groupParam && grouper) {
            // Grouper is a subclass of sorter, so we can just use the sorter method

            console.warn('Need to test encodeSorters');
            //params[groupParam] = me.encodeSorters([grouper]);
        }

        if (sortParam && sorters && sorters.length > 0) {
            if (simpleSortMode) {
                params[sortParam]      = sorters[0].getProperty();
                params[directionParam] = sorters[0].getDirection();
            } else {
                console.warn('Need to test encodeSorters');
                //params[sortParam] = me.encodeSorters(sorters);
            }
        }

        if (filterParam && filters && filters.length > 0) {
            console.warn('Need to test encodeFilters');
            //params[filterParam] = me.encodeFilters(filters);
        }

        return params;
    },

    encodeSorters : function (sorters) {
        var min  = [],
            sLen = sorters.length,
            s    = 0,
            sorter;

        for (; s < sLen; s++) {
            sorter = sorters[s];
            min[s] = {
                property  : sorter.getProperty(),
                direction : sorter.getDirection()
            };
        }

        return min;

    },

    encodeFilters : function (filters) {
        var min  = [],
            fLen = filters.length,
            f    = 0,
            filter;

        for (; f < fLen; f++) {
            filter = filters[f];
            min[i] = {
                property : filter.getProperty(),
                value    : filter.getValue()
            };
        }

        return min;
    },

    sync : function(batch) {
        var me               = this,
            createdRecords   = me.getNewRecords(),
            updatedRecords   = me.getUpdatedRecords(),
            destroyedRecords = me.getRemovedRecords(),
            clientIdParam    = me.getClientIdParam(),
            queue            = [],
            i                = 0,
            record, data;

        for (; i < createdRecords.length; i++) {
            record = createdRecords[i];
            data   = record.getData();

            data.action         = 'create';
            data[clientIdParam] = record.getId();

            queue.push(data);
        }

        i = 0;

        for (; i < updatedRecords.length; i++) {
            record = updatedRecords[i];
            data   = record.getData();
            data   = record.getData();

            data.action         = 'update';
            data[clientIdParam] = record.getId();

            queue.push(data);
        }

        i = 0;

        for (; i < destroyedRecords.length; i++) {
            record = destroyedRecords[i];
            data   = record.getData();

            data.action         = 'destroy';
            data[clientIdParam] = record.getId();

            queue.push(data);
        }

        console.warn('Queue', queue);

        me.setQueue(queue);
        me.runQueue(batch);
    },

    runQueue : function(batch) {
        var me     = this,
            socket = me.getSocket(),
            queue  = me.getQueue(),
            events = me.getActionEvents(),
            request, event;

        if (!queue || queue.length === 0) {
            console.warn('Queue is empty');
            return;
        }

        console.warn(batch ? 'Going to batch requests' : 'Not going to batch requests');

        if (!batch) {
            batch = me.getBatch();
        }

        if (batch) {
            event = events.batch;

            socket.emit(event, queue);
        } else {
            request = queue[0];
            event   = events[request.action];

            socket.emit(event, request);
        }
    },

    removeFromQueue : function(clientId, action) {
        var me            = this,
            clientIdParam = me.getClientIdParam(),
            queue         = me.getQueue(),
            q             = 0,
            qLen          = queue.length,
            newQueue      = [],
            request;

        for (; q < qLen; q++) {
            request = queue[q];

            if (request[clientIdParam] !== clientId || request.action !== action) {
                console.warn('Removed request from queue', clientId, action);
                break;
            } else {
                newQueue.push(request);
            }
        }

        me.setQueue(newQueue);
    }
});