/**** VARIABLES *****/
// Setup basic express server
  var express = require('express');
  var app = express();
  var path = require('path');
  var server = require('http').createServer(app);
  var io = require('socket.io')(server);
  var port = process.env.PORT || 3456;

  var active_users = 0; // turn this into an array?
  var active_rooms = ['Lobby', 'We Like Sports'];

  server.listen(port, function() {
    console.log('Server is listening, shh...');
  });

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client.html');
  });

// a new user connects
  io.on('connection', function (socket) {
    console.log('a new user connected!');

    var logged_in = false;

  // a user sends a message
    socket.on('message_to_server', function(data) {
      console.log(data['message']);

      io.sockets.emit('message_to_client', {
        username: data['username'],
        message: data['message'],
        curr_room: data['curr_room']
      });
    });

  // a user logs in :)
    socket.on('login', function (username) {
      socket.username = username;
      active_users++;
      logged_in = true;
      console.log('a user just signed in.');

      io.sockets.emit('update_rooms', {
        active_rooms: active_rooms
      });

      io.sockets.emit('new_user', {
        username: socket.username,
        active_users: active_users,
        message: 'a new user is here.',
        curr_room: socket.curr_room
      });
    });

  // a user disconnects :(
    socket.on('disconnect', function() {
      if(logged_in) {
        active_users--;
        console.log('a user just disconnected...');

        io.sockets.emit('user_disconnect', {
    			username: socket.username,
          active_users: active_users,
    			message: 'a user disconnected...',
          curr_room: socket.curr_room
    		});
      }
    });

  // a user changes chatrooms
    socket.on('change_room', function (data) {
      socket.username = data['username'];
      socket.curr_room = data['new_room'];

      active_users--; // in old room
      active_users++; // in new room

      io.sockets.emit('new_user', {
        username: socket.username,
        active_users: active_users,
        message: 'a new user is here.',
        curr_room: socket.curr_room
      });
    });

  // a user starts a new chatroom
    socket.on('create_new_room', function (new_room_name) {
      console.log('a new room was just created.');

      active_rooms.push(new_room_name);

      io.sockets.emit('update_rooms', {
        active_rooms: active_rooms
      });
    });

  });
