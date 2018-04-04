/***** VARIABLES *****/
var socket = io.connect();

var username;
var logged_in = false;
var curr_room = 'Lobby';
var active_rooms = {};
var owned_rooms = [];

/***** EVENT LISTENERS *****/
socket.on('message_to_client', function(data) {
  if(data['curr_room'] === curr_room) {
    $('#chatlog').append('<hr /><div class="author">' + data['username'] + ' said...</div>');
    $('#chatlog').append('<div class="message">' + data['message'] + '</div>');
  }
});

socket.on('deliver_private_message', function(data) {
  if(data['target_username'] === username) {
    alert('New private message from ' + data['sender'] + ': ' + data['message']);
  }
});

socket.on('new_user', function(data) {
  if(data['curr_room'] === curr_room) {
    $('#chatlog').append('<hr /><div class="server_message">' + data['message'] + ' There are now ' + data['active_users'] + ' active users.</div>');
    updateUserList();
  }
});

socket.on('user_disconnect', function(data) {
  if(data['curr_room'] === curr_room) {
    $('#chatlog').append('<hr /><div class="server_message">' + data['message'] + ' There are now ' + data['active_users'] + ' active users.</div>');
    updateUserList();
  }
});

socket.on('update_rooms', function(data) {
  active_rooms = data['active_rooms'];
  updateRoomList();
  updateUserList();
});

socket.on('kicked_user', function(targetUser) {
  alert(targetUser);
  if(username === targetUser) {
    curr_room = 'Lobby';
    socket.emit('change_room', curr_room);
  }
});

$(document).on('change', '#private_checkbox', function() {
  if(this.checked) {
    $('#password').show();
  } else {
    $('#password').hide();
  }
});

$(document).on('keypress', '#nickname', function(e) {
  if(e.which == 13) {
    $('#login_button').click();
  }
});

$(document).on('keypress', '#message_input', function(e) {
  if(e.which == 13) {
    $('#send_button').click();
  }
});

$(document).on('keypress', '#new_room_name', function(e) {
  if(e.which == 13) {
    $('#create_button').click();
  }
});

$(document).on('keypress', '#password', function(e) {
  if(e.which == 13) {
    $('#create_button').click();
  }
});

/*
$('#active_users').hover( function() {
  $('#active_users').animate({
    top: '34%'
  }, 500, 'swing');
}, function() {
  $('#active_users').delay(1000).animate({
    top: '90%'
  }, 200, 'swing');
});

$('#active_rooms').hover( function() {
  $('#active_rooms').animate({
    top: '0'
  }, 500, 'swing');
}, function() {
  $('#active_rooms').delay(1000).animate({
    top: '90%'
  }, 200, 'swing');
});
*/

$(document).on('click', '.room', moveTo);

/***** FUNCTIONS *****/
function sendMessage() {
  var msg = $('#message_input').val();
  socket.emit('message_to_server', msg);

  $('#message_input').val('');
}

function login() {
  if($('#nickname').val() != '') {
    username = $('#nickname').val();
    $('#login').fadeOut(1);

  // tell server username
    socket.emit('login', username);
  }
  else {
    alert('please enter a nickname.');
  }
}

function moveTo() {
  var targetRoomName = $(this).closest('li').text();

  if(curr_room === targetRoomName) {
    // do nothing
  }
  else {
    if(active_rooms[targetRoomName].private) {
      // this is a private room
      var enteredPassword = prompt("Please enter this room's password.");
      if(enteredPassword === active_rooms[targetRoomName].password) {
        curr_room = targetRoomName;
        socket.emit('change_room', curr_room);
        updateUserList();
        resetChatlog();
      }
      else {
        alert("That was the wrong password.");
      }
    }
    else {
      curr_room = targetRoomName;
      socket.emit('change_room', curr_room);
      updateUserList();
      resetChatlog();
    }
  }
}

function newRoom() {
  if($('#new_room_name').val() != '') {
    var new_room_name = $('#new_room_name').val();

    if($('#private_checkbox').prop('checked')) {
      if($('#password').val() != '') {
        var new_room_password = $('#password').val();
        $('#new_room_name').val('');
        $('#password').hide();
        $('#private_checkbox').prop('checked', false);

        owned_rooms.push(new_room_name);
        curr_room = new_room_name;

        socket.emit('create_private_room', {
          new_room_name: new_room_name,
          new_room_password: new_room_password
        });
        resetChatlog();
        updateUserList();
        updateRoomList();
      }
      else {
        alert('please enter a password for your chatroom.')
      }
    }
    else {
      $('#new_room_name').val('');
      owned_rooms.push(new_room_name);
      curr_room = new_room_name;

      socket.emit('create_public_room', new_room_name);
      resetChatlog();
      updateUserList();
      updateRoomList();
    }
  }
  else {
    alert('please enter a name for your chatroom.');
  }
}

function resetChatlog() {
  $('#chatlog').html('');
  $('#chatroom_name').html(curr_room);
}

function updateRoomList() {
  // first clear the list
  $('#roomlist ul').html('');

  for(var room in active_rooms) {
    if(active_rooms.hasOwnProperty(room)) {
      if(active_rooms[room].private) {
        $('#roomlist ul').append('<img class="private_icon" src="lock_icon.png" alt="private" />')
      }
      $('#roomlist ul').append('<li class="room">' + room + '</li>');
    }
  }
}

function updateUserList() {
  // first clear the list
  $('#userlist ul').html('');

  for(var i=0; i<active_rooms[curr_room].usernames.length; i++) {
    var user = active_rooms[curr_room].usernames[i];

    $('#userlist ul').append('<li id="' + user + '" class="user">' + user + '</li>');

    var userString = "'" + user + "'";

    if(owned_rooms.includes(curr_room)) {
      // the user owns this room
      $('#' + user).append('<span id="' + user + '_interact" class="user_interactions">\
          <button class="interact_button" onclick="privMessage(' + userString + ');" type="button">message</button>\
          <button class="interact_button" onclick="kickUser(' + userString + ');" type="button">kick</button>\
        </span>');
      //$('#' + user + '_interact').hide();
    }
    else {
      $('#' + user).append('<span id="' + user + '_interact" class="user_interactions">\
          <button class="interact_button" onclick="privMessage(' + userString + ');" type="button">message</button>\
        </span>');
      //$('#' + user + '_interact').hide();
    }
    // add event listener to user_interact
    /*
    $('#' + user).hover( function() {
      $('#' + user + '_interact').show();
    }, function() {
      $('#' + user + '_interact').hide();
    });
    */
  }
}

function privMessage(targetUsername) {
  if(targetUsername != username) {
    var msg = prompt('Please enter your message for ' + targetUsername + ':');

    if(msg != '' && msg != null) {
      socket.emit('private_message', {
        message: msg,
        target_username: targetUsername
      });
    }
    else {
      alert('Your message cannot be empty');
    }
  }
  else {
    alert('You cannot send yourself a private message. Are you lonely?');
  }
}

function kickUser(targetUser) {
  if(targetUser != username) {
    socket.emit('kick_user', targetUser);
  }
  else {
    alert('You cannot kick yourself from your own room. Now that is just ridiculous.');
  }
}

/***** MAIN RUN *****/
$(document).ready(function() {

});
