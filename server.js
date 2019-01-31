var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var Datastore = require('nedb');
var usersdb = new Datastore({ filename: 'users.db', autoload: true });
var chatsdb = new Datastore({ filename: 'chat.db', autoload: true });
var pcchatsdb = new Datastore({ filename: 'pcchat.db', autoload: true });
users = [];
connections = [];

server.listen(process.env.PORT || 3000);
console.log('Server running...');



app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/push.js', function (req, res) {
    res.sendFile(__dirname + '/push.js');
});

//for connection
io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('connected: %s sockets connected', connections.length);
    var roomname;

    //for disconnect
    socket.on('disconnect', function (data) {
        users.splice(users.indexOf(data), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconncted: %s sockets  connected', connections.length);
    });
    
        socket.on('room msg',function(data){
            console.log(data);
            //console.log("room msg",roomname);
          //  io.sockets.in("chatroom").emit('new pcmessage',{ msg: doc.msgs, user: doc.user1 });
            //  io.sockets.in(roomname1).emit('chatroommsg',{msg:data,user:socket.username});
              io.sockets.in(roomname2).emit('chatroommsg',{msg:data,user:socket.username});
        });

      //get user2
      socket.on('get user2',function(data){
          socket.testuser2 = data;
           
           roomname1 = socket.username+socket.testuser2;
           roomname2 = socket.testuser2+socket.username;
          //console.log("outside roomroom",roomname);
          socket.emit('chatroom',roomname1)
          socket.emit('chatroom',roomname2)

          socket.on("chatroom",function(room)
          {
              socket.join(room);
              //console.log("room",roomname);
           //   console.log("Inside room",room);
          });

          pcchatsdb.find({}).exec(function(err,docs)
         {
           // console.log("pc chats",docs);
            var msgarr = [];
            var count = 0;
           
                for (var i = 0 ; i<docs.length ; i++)
                {
                    
                    if((docs[i].user1==socket.username && docs[i].user2==socket.testuser2) || (docs[i].user1==socket.testuser2 && docs[i].user2==socket.username))
                    {
                        if(count <= 9)
                        {
                            count++;
                            msgarr.push(docs[i].user1,docs[i].msgs,docs[i].user2);
                            io.sockets.emit('new allpcmessage', { msg: docs[i].msgs, user: docs[i].user1 });
                            
                        }
                       
                    }
                  
                }
            
            console.log("pc chts",msgarr);
           console.log("1",docs);
           docs = "";
           console.log("2",docs);
        });
      });

      //for new pcmsg
      socket.on('send pcmsg',function(data){
            var pcchats =
            {
                user1 : socket.username,
                msgs : data,
                user2 : socket.testuser2
            };
            pcchatsdb.insert(pcchats,function(err,doc){
                console.log(doc.user1,"Send",doc.msgs,"to",doc.user2);
            });
            pcchatsdb.findOne({msgs:data},function(err,doc)
            {
               // io.sockets.emit('new pcmessage',{ msg: doc.msgs, user: doc.user1 });
                 // console.log('Found pcuser',doc.user1,doc.msgs);
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
            docs.forEach(function (d) 
            {
                console.log('found :', d.name);
            });
        });
        updateUsernames();
    });
        
    //update online users
    function updateUsernames() {
        io.sockets.emit('get users', users);
    }
});

