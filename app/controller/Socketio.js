Ext.define('Test.controller.Socketio', {
    extend : 'Ext.app.Controller',

    config : {
        socket : true
    },

    init : function(app) {
        app.on('socketsendmessage', 'sendMessage', this);
    },

    applySocket : function() {
        return io.connect(location.origin);
    },

    updateSocket : function(socket) {
        var me = this;

        socket.on('message', function (data) {
            me.receiveMessage.call(me, data);
        });
    },

    sendMessage : function(data, event) {
        if (!event || !Ext.isString(event)) {
            event = 'message';
        }

        var socket = this.getSocket();

        console.log(event, data);

        socket.emit(event, data);
    },

    receiveMessage : function(data) {
        console.log('Message received', data);
    }
});