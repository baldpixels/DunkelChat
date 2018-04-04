/**** VARIABLES *****/
// Setup basic express server
  var express = require('express');
  var app = express();
  var path = require('path');
  var server = require('http').createServer(app);
  var io = require('socket.io')(server);
  var port = process.env.PORT || 3456;

  var active_rooms = {
    'Lobby': {
      'private': false,
      'active_users': 0,
      'usernames': []
    },
    'We Like Sports': {
      'private': false,
      'active_users': 0,
      'usernames': []
    },
  };

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

    socket.logged_in = false;

  // a user logs in :)
    socket.on('login', function (username) {
      loginUser(username, socket);
    });

  // a user disconnects :(
    socket.on('disconnect', function() {
      userDisconnect(socket);
    });

  // a user sends a message
    socket.on('message_to_server', function (msg) {
      deliverUserMessage(msg, socket);
    });

  // a user sends a private message
    socket.on('private_message', function (data) {
      deliverPrivMessage(data['message'], data['target_username'], socket);
    });

  // a user changes chatrooms
    socket.on('change_room', function (curr_room) {
      changeUsersRoom(curr_room, socket);
    });

  // a user starts a new *public* chatroom
    socket.on('create_public_room', function (new_room_name) {
      userCreatesPublicRoom(new_room_name, socket);
    });

  // a user starts a new *private* chatroom
    socket.on('create_private_room', function (data) {
      userCreatesPrivateRoom(data['new_room_name'], data['new_room_password'], socket);
    });

  // a user kicks another user
    socket.on('kick_user', function (targetUser) {
      console.log('a user was just kicked.');

      io.sockets.emit('kicked_user', targetUser);
    });

  });

/***** FUNCTIONS *****/
  function loginUser(username, socket) {
    socket.logged_in = true;
    socket.username = username;
    socket.curr_room = 'Lobby';

    active_rooms['Lobby'].active_users++;
    active_rooms['Lobby'].usernames.push(socket.username);
    console.log('a user just signed in.');

    io.sockets.emit('update_rooms', {
      active_rooms: active_rooms
    });

    io.sockets.emit('new_user', {
      message: 'a new user is here.',
      username: socket.username,
      active_users: active_rooms[socket.curr_room].active_users,
      curr_room: socket.curr_room
    });
  }

  function userDisconnect(socket) {
    if(socket.logged_in) {
      console.log('a user just disconnected...');

      active_rooms[socket.curr_room].active_users--;
      removeUser(active_rooms[socket.curr_room].usernames, socket.username);

      io.sockets.emit('user_disconnect', {
        message: 'a user disconnected...',
        username: socket.username,
        active_users: active_rooms[socket.curr_room].active_users,
        curr_room: socket.curr_room
      });
    }
  }

  function deliverUserMessage(msg, socket) {
    console.log(socket.username + ': ' + msg);

    io.sockets.emit('message_to_client', {
      message: msg,
      username: socket.username,
      curr_room: socket.curr_room
    });
  }

  function deliverPrivMessage(msg, targetUsername, socket) {
    console.log(socket.username + ' sent a private message to ' + targetUsername);

    io.sockets.emit('deliver_private_message', {
      message: msg,
      sender: socket.username,
      target_username: targetUsername,
    });
  }

  function changeUsersRoom(room, socket) {
    active_rooms[socket.curr_room].active_users--; // old room
    removeUser(active_rooms[socket.curr_room].usernames, socket.username);

    io.sockets.emit('user_disconnect', {
      message: 'a user just left the room...',
      username: socket.username,
      active_users: active_rooms[socket.curr_room].active_users,
      curr_room: socket.curr_room
    });

  /** ! **/
    socket.curr_room = room;
    active_rooms[socket.curr_room].active_users++; // new room
    active_rooms[socket.curr_room].usernames.push(socket.username);

    io.sockets.emit('new_user', {
      message: 'a user just joined the room.',
      username: socket.username,
      active_users: active_rooms[socket.curr_room].active_users,
      curr_room: socket.curr_room
    });

    io.sockets.emit('update_rooms', {
      active_rooms: active_rooms
    });
  }

  function userCreatesPublicRoom(roomName, socket) {
    console.log('a new public room was just created.');

    active_rooms[roomName] = {
      'private': false,
      'active_users': 0,
      'usernames': []
    };

    changeUsersRoom(roomName, socket);

    io.sockets.emit('update_rooms', {
      active_rooms: active_rooms
    });
  }

  function userCreatesPrivateRoom(roomName, roomPassword, socket) {
    console.log('a new private room was just created.');

    active_rooms[roomName] = {
      'private': true,
      'active_users': 0,
      'usernames': [],
      'password': roomPassword
    };

    changeUsersRoom(roomName, socket);

    io.sockets.emit('update_rooms', {
      active_rooms: active_rooms
    });
  }

  function removeUser(array, element) {
    const index = array.indexOf(element);

    if (index !== -1) {
        array.splice(index, 1);
    }
  }
