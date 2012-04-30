Ext.define('Test.controller.Main', {
    extend : 'Ext.app.Controller',

    config : {
        control : {
            'textfield[name=message]' : {
                keyup : 'sendMessage'
            },
            'button[action=destroyFirst]' : {
                tap : 'destroyFirst'
            },
            'button[action=editFirst]' : {
                tap : 'editFirst'
            },
            'button[action=syncStore]' : {
                tap : 'syncStore'
            },
            'button[action=syncStoreBatch]' : {
                tap : 'syncStoreBatch'
            },
            'button[action=destroyList]' : {
                tap : 'destroyList'
            }
        }
    },

    sendMessage : function(field, e) {
        if (e.browserEvent.keyCode !== 13) {
            return;
        }

        var message = field.getValue(),
            store   = Ext.getStore('Test');

        if (!message) {
            return;
        }

        store.add({
            text : message
        });

        field.setValue('');
    },

    destroyFirst : function (button) {
        var form  = button.up('formpanel'),
            list  = form.down('list'),
            store = list.getStore(),
            rec   = store.getAt(0);

        store.remove(rec);
    },

    editFirst : function (button) {
        var form  = button.up('formpanel'),
            list  = form.down('list'),
            store = list.getStore(),
            rec   = store.getAt(0);

        rec.set('text', 'Updated at ' + new Date());
    },

    syncStore : function(button) {
        var form  = button.up('formpanel'),
            list  = form.down('list'),
            store = list.getStore();

        store.sync();
    },

    syncStoreBatch : function(button) {
        var form  = button.up('formpanel'),
            list  = form.down('list'),
            store = list.getStore();

        store.sync(true);
    },

    destroyList : function(button) {
        var form = button.up('formpanel'),
            list = form.down('list');

        form.remove(list);
    }
});