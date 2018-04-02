/***** VARIABLES *****/
var socket = io.connect();

var username;
var curr_room = 'Lobby';
var active_rooms = ['Lobby'];
var logged_in = false;

/***** EVENT LISTENERS *****/
socket.on('message_to_client', function(data) {
  if(data['curr_room'] === curr_room) {
    $('#chatlog').append('<hr /><div class="author">' + data['username'] + ' said...</div>');
    $('#chatlog').append('<div class="message">' + data['message'] + '</div>');
  }
});

socket.on('new_user', function(data) {
  if(data['curr_room'] === curr_room) {
    $('#chatlog').append('<hr /><div class="server_message">' + data['message'] + ' There are now ' + data['active_users'] + ' active users.</div>');
  }
});

socket.on('user_disconnect', function(data) {
  if(data['curr_room'] === curr_room) {
    $('#chatlog').append('<hr /><div class="server_message">' + data['message'] + ' There are now ' + data['active_users'] + ' active users.</div>');
  }
});

socket.on('update_rooms', function(data) {
  active_rooms = data['active_rooms'];
  updateRoomList();
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

$(document).on('click', '.room', moveTo);

/***** FUNCTIONS *****/
function sendMessage() {
  var msg = $('#message_input').val();

  socket.emit('message_to_server', {
    message: msg,
    username: username,
    curr_room: curr_room
  });

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
  curr_room = $(this).closest('li').text();
  socket.emit('change_room', {
    username: username,
    new_room: curr_room
  });
  resetChatlog();
}

function newRoom() {
  if($('#new_room_name').val() != '') {
    var new_room_name = $('#new_room_name').val();
    socket.emit('create_new_room', new_room_name);
    curr_room = new_room_name;
    resetChatlog();
    updateRoomList();
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

  for(var i=0; i<active_rooms.length; i++) {
    $('#roomlist ul').append('<li class="room">' + active_rooms[i] + '</li>');
  }
}

/***** MAIN RUN *****/
$(document).ready(function() {

});
