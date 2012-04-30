Ext.define('Test.store.Test', {
    extend : 'Ux.data.WebSocketStore',

    requires : [
        'Test.model.Test'
    ],

    config : {
        autoLoad : true,
        model    : 'Test.model.Test',
        socket   : true,
        storeId  : 'Test'
    },

    applySocket : function(socket) {
        if (typeof socket !== 'object') {
            var app        = Test.app,
                controller = app.getController('Socketio');

            socket = controller.getSocket();
        }

        return socket;
    }
});