// Require the packages we will use:
var http = require("http"),
	socketio = require("socket.io"),
	fs = require("fs");

var active_users = 0;

// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html:
var server = http.createServer(function(req, resp) {
	// This callback runs when a new connection is made to our HTTP server.

	fs.readFile("chatroom/client.html", function(err, data) {
		// This callback runs when the client.html file has been read from the filesystem.

		if(err) return resp.writeHead(500);
		resp.writeHead(200);
		resp.end(data);
	});
});
server.listen(3456);

// Do the Socket.IO magic:
var io = socketio.listen(server);
io.sockets.on("connection", function(socket) {
	// This callback runs when a new Socket.IO connection is established.
  console.log("a user connected!");
  active_users++;
  io.sockets.emit("message_to_client", {message: "there are " + active_users + " users currently in the chat room."}) // broadcast the message to other users

  socket.on('disconnect', function(){
    active_users--;
    console.log('a user disconnected...');
    io.sockets.emit("message_to_client", {message: "there are " + active_users + " users currently in the chat room."}) // broadcast the message to other users
  });

	socket.on('message_to_server', function(data) {
		// This callback runs when the server receives a new message from the client.

		console.log("message: "+data["message"]); // log it to the Node.JS output
		io.sockets.emit("message_to_client", {message:data["message"]}) // broadcast the message to other users
	});
});
