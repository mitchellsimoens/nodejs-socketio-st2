var express = require('express'),
    gzip    = require('connect-gzip'),
    app     = express.createServer(
        gzip.gzip()
    ),
    io      = require('socket.io').listen(app),
    stores  = {};

app.configure(function () {
    app.use(express.static(__dirname + '/'));
});

app.get('/', function (req, res) {
    res.render('index', { layout : false });
});

app.listen(3000, function () {
    var addr = app.address();
    console.log('   app listening on http://' + addr.address + ':' + addr.port);
});

io.sockets.on('connection', function (socket) {
    socket.on('message', function(data) {
        console.log('***Message received ', data);

        socket.volatile.emit('message', {
            success : true,
            message : 'Got it!'
        });
    });

    socket.on('register', function (socketId) {
        stores[socketId] = true;

        socket.on('read_' + socketId, function(data) {
            socket.volatile.emit('read_' + socketId, {
                success : true,
                total   : 2,
                data    : [
                    { id : 1, text : 'One' },
                    { id : 2, text : 'Two' }
                ]
            });
        });

        socket.on('create_' + socketId, function (data) {
            var ret = [];

            data.id = new Date().getTime();
            ret.push(data);

            socket.volatile.emit('create_' + socketId, {
                success : true,
                total   : ret.length + 2,
                data    : ret
            });
        });

        socket.on('update_' + socketId, function (data) {
            var ret = [];
            ret.push(data);

            socket.volatile.emit('update_' + socketId, {
                success : true,
                total   : ret.length + 2,
                data    : ret
            });
        });

        socket.on('destroy_' + socketId, function (data) {
            var ret = [];
            ret.push(data);

            socket.volatile.emit('destroy_' + socketId, {
                success : true,
                total   : ret.length + 2,
                data    : ret
            });
        });

        socket.on('batch_' + socketId, function (datas) {
            var d = 0,
                dLen = datas.length,
                ret = [],
                time, data;

            for (; d < dLen; d++) {
                time = new Date().getTime();
                data = datas[d];

                if (data.action === 'create') {
                    data.id = time;
                }

                ret.push(data);
            }

            socket.volatile.emit('batch_' + socketId, {
                success : true,
                total   : ret.length + 2,
                data    : ret
            });
        });

        socket.volatile.emit('register', true);
    });

    socket.on('unregister', function (socketId) {
        stores[socketId] = false;

        delete stores[socketId];

        socket.volatile.emit('unregister', true);
    });
});