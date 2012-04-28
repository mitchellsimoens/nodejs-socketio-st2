Ext.define('Test.view.Main', {
    extend : 'Ext.form.Panel',
    xtype  : 'test-main',

    requires : [
        'Ext.TitleBar',
        'Ext.Video'
    ],

    config: {
        items : [
            {
                xtype : 'textfield',
                label : 'Message',
                name  : 'message'
            },
            {
                xtype : 'container',
                layout : 'hbox',
                items  : [
                    {
                        xtype  : 'button',
                        flex   : 1,
                        ui     : 'decline',
                        text   : 'Reset',
                        action : 'reset'
                    },
                    {
                        xtype  : 'button',
                        flex   : 1,
                        ui     : 'confirm',
                        text   : 'Send',
                        action : 'send'
                    }
                ]
            }
        ]
    }
});
