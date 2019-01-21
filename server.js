var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var Datastore = require('nedb');
var usersdb = new Datastore({ filename: 'users.db', autoload: true });
var chatsdb = new Datastore({ filename: 'chat.db', autoload: true });
users = [];
connections = [];

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
//for connection
io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('connected: %s sockets connected', connections.length);
//for disconnect
    socket.on('disconnect', function (data) {
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconncted: %s sockets  connected', connections.length);
    });
//for send message
    socket.on('send message', function (data) {
        var chatdata =
        {
            user1: socket.username,
            msgs: data
        };
        chatsdb.insert(chatdata, function (err, doc) {
            console.log(doc.user1, doc.msgs);
        });
        chatsdb.findOne({msgs:data},function(err,doc){
            io.sockets.emit('new message', { msg: doc.msgs, user: doc.user1 });
              console.log('Found user',doc.user1,doc.msgs);
          });
      });
      //for login
    socket.on('new user', function (data, callback) {
        callback(true);
        socket.username = data;
        users.push(socket.username);
            var udata = {
            name: socket.username
        };
        usersdb.insert(udata, function (err, doc) {
            console.log('Inserted', doc.name, 'with id', doc._id);
        });
        usersdb.find({}).sort({ name: 1 }).exec(function (err, docs) {
            docs.forEach(function (d) {
                console.log('found :', d.name);
            });
        });
        updateUsernames();
    });
    function updateUsernames() {
        io.sockets.emit('get users', users);
    }
});

