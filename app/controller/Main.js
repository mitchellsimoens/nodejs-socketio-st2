Ext.define('Test.controller.Main', {
    extend : 'Ext.app.Controller',

    config : {
        control : {
            'button[action=reset]' : {
                tap : 'resetForm'
            },
            'button[action=send]' : {
                tap : 'sendMessage'
            }
        }
    },

    resetForm : function(button) {
        var form = button.up('formpanel');

        form.setValues({
            message : ''
        });
    },

    sendMessage : function(button) {
        var form   = button.up('formpanel'),
            values = form.getValues();

        this.getApplication().fireEvent('socketsendmessage', {
            message : values.message
        });
    }
});