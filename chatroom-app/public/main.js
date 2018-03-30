/***** VARIABLES *****/
var socket = io.connect();

var username;
var logged_in = false;

/***** EVENT LISTENERS *****/
socket.on('message_to_client', function(data) {
  $('#chatlog').append('<hr /><div class="author">' + data['username'] + ' said...</div>');
  $('#chatlog').append('<div class="message">' + data['message'] + '</div>');
});

socket.on('new_user', function(data) {
  $('#chatlog').append('<hr /><div class="server_message">' + data['message'] + ' There are now ' + data['active_users'] + ' active users.</div>');
});

socket.on('user_disconnect', function(data) {
  $('#chatlog').append('<hr /><div class="server_message">' + data['message'] + ' There are now ' + data['active_users'] + ' active users.</div>');
});

$(document).on('change', '#private_checkbox', function() {
  if(this.checked) {
    $('#password').show();
  } else {
    $('#password').hide();
  }
});

/***** FUNCTIONS *****/
function sendMessage() {
  var msg = $('#message_input').val();

  socket.emit('message_to_server', {
    message: msg,
    username: username
  });

  $('#message_input').val('');
}

function login() {
  username = $('#nickname').val();

  $('#login').fadeOut(1000);
// tell server username
  socket.emit('login', username);
}

function moveTo() {

}

function newRoom() {

}

/***** MAIN RUN *****/
$(document).ready(function() {

});