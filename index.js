const PORT = process.env.PORT || 3000;

const express = require('express');
const app = express();
const server = require('http').Server(app);
const socket = require("socket.io");
const io = socket(server);

const ejs = require('ejs');

app.set('view engine', 'ejs');
app.use(express.static('public'));

// APP VARIABLES
// object with userID as key for user object {name, roomID}
const usersList = {}; 


app.get('/*', function (req, res) {
  	res.render('index');
});


var chat = io.of('chat'); // 'chat' namespace
chat.on("connection", socket => {

	// receives when finish connecting
	socket.on('add-user', () => {
		usersList[socket.id] = {
			name: null,
			roomId: null
		};
	});

	socket.on('disconnect', () => {
		var roomId = usersList[socket.id].roomId;

		// announce leaving if in a room
		if (roomId){
			socket.to(roomId).emit('announce-left-user', usersList[socket.id].name);
			usersList[socket.id].roomId = null;
			updateUsersList(roomId);
		}
		
		delete usersList[socket.id]; // remove from usersList
	});

	// join a room (assign the roomID)
	socket.on('join-room', (name, roomId) => {
		usersList[socket.id].name = name;
		usersList[socket.id].roomId = roomId;

		socket.join(roomId);
		socket.emit('join-room', name, roomId); // notify the client
		socket.to(roomId).emit('announce-new-user', usersList[socket.id].name);
		updateUsersList(usersList[socket.id].roomId);
	});

	// announce leaving, update users list and remove roomId from user object
	socket.on('leave-room', () => {
		var roomId = usersList[socket.id].roomId;

		socket.to(roomId).emit('announce-left-user', usersList[socket.id].name);
		socket.leave(roomId);
		usersList[socket.id].roomId = null;
		updateUsersList(roomId);
	});

	// when server recieves message from this user
	socket.on('chat-message', message => {
		var messageObject = {
			name: usersList[socket.id].name, 
			message: message
		};
		socket.to(usersList[socket.id].roomId).emit("chat-message", messageObject);
	});
});


function updateUsersList(roomId){
	var names = '';
	for (var id in usersList) {
		if (usersList[id].roomId === roomId){
			names += usersList[id].name + ", ";
		}
	}
	io.of('chat').to(roomId).emit('update-users-list', names);
}

server.listen(PORT);

/*  EMIT KEYS

JOIN ROOM:
	client to server: 
		add-user
		join-room
		leave-room

	server to client: 
		join-room  (done joining a room)


CHAT ROOM:
	client to server: 
		chat-message

	server to client: 
		update-users-list
		announce-new-user
		announce-left-user
		chat-message 

*/
