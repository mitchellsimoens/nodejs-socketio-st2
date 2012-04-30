Ext.define('Test.view.Main', {
    extend : 'Ext.form.Panel',
    xtype  : 'test-main',

    requires : [
        'Ext.field.Text',
        'Test.view.List'
    ],

    config: {
        scrollable : 'vertical',
        items      : [
            {
                xtype      : 'test-list',
                scrollable : false
            },
            {
                xtype       : 'textfield',
                placeHolder : 'Message',
                name        : 'message'
            },
            {
                xtype  : 'container',
                layout : 'hbox',
                items  : [
                    {
                        xtype  : 'button',
                        flex   : 1,
                        ui     : 'decline',
                        text   : 'Delete First Record',
                        action : 'destroyFirst'
                    },
                    {
                        xtype  : 'button',
                        flex   : 1,
                        ui     : 'action',
                        text   : 'Edit First Record',
                        action : 'editFirst'
                    }
                ]
            },
            {
                xtype  : 'container',
                layout : 'hbox',
                items  : [
                    {
                        xtype  : 'button',
                        flex   : 1,
                        ui     : 'confirm',
                        text   : 'Sync Store',
                        action : 'syncStore'
                    },
                    {
                        xtype  : 'button',
                        flex   : 1,
                        ui     : 'confirm',
                        text   : 'Sync Store (Batched)',
                        action : 'syncStoreBatch'
                    }
                ]
            },
            {
                xtype  : 'button',
                ui     : 'decline',
                text   : 'Destroy List/Store',
                action : 'destroyList'
            }
        ]
    }
});
