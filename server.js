var express = require('express'),
    gzip    = require('connect-gzip'),
    app     = express.createServer(
        gzip.gzip()
    ),
    io      = require('socket.io').listen(app);

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
    socket.emit('message', {
        hello : 'world'
    });

    socket.on('message', function(data) {
        console.log('***Message received ', data);

        socket.volatile.emit('message', {
            success : true,
            message : 'Got it!'
        });
    });
});