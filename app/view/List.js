Ext.define('Test.view.List', {
    extend : 'Ext.dataview.List',
    xtype  : 'test-list',

    requires : [
        'Test.store.Test'
    ],

    config : {
        itemTpl : '{text} id - {id}',
        store   : {
            xclass : 'Test.store.Test'
        }
    },

    destroy : function() {
        var store = this.getStore();

        //if you don't call destroy on the store, the events on the socket
        //will remain and a memory leak will happen
        console.warn('You must call destroy on the store');
        store.destroy();

        this.callParent();
    }
});