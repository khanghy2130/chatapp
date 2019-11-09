const express = require('express');
const app = express();
const server = require('http').Server(app);
const socket = require("socket.io");
const io = socket(server);

const ejs = require('ejs');

app.set('view engine', 'ejs');
app.use(express.static('public'));

// app variables
const usersList = {};


app.get('/', function (req, res) {
  	res.render('index');
});


var chat = io.of('chat'); // 'chat' namespace
chat.on("connection", socket => {
	socket.on('new-user-joins', name => {
		usersList[socket.id] = name;
		socket.broadcast.emit('announce-new-user', name);
		updateUsersList();
	});

	socket.on('disconnect', () => {
		socket.broadcast.emit('announce-left-user', usersList[socket.id]);
		delete usersList[socket.id]; // remove from usersList
		updateUsersList();
	});

	// when server recieves message from this user
	socket.on('send-chat-message', message => {
		var messageObject = {
			name: usersList[socket.id], 
			message: message
		};
		socket.broadcast.emit("chat-message", messageObject);
	});
});


function updateUsersList(){
	var names = '';
	for (var id in usersList) {
		names += usersList[id] + ", ";
	}
	io.of('chat').emit('update-users-list', names);
}

server.listen(3000);

/*  EMIT KEYS
client to server: 
	new-user-joins
	send-chat-message

server to client: 
	update-users-list
	announce-new-user
	announce-left-user
	chat-message
*/

