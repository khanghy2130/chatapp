const socket = require("socket.io");
const io = socket(3000);

const usersList = {};



// when a user connects, a socket is created for them. Set the eventListeners here
io.on("connection", socket => {
	
	// when new user joins with their name
	socket.on('new-user-joins', name => {
		usersList[socket.id] = name;
		socket.broadcast.emit('announce-new-user', name);
		updateUsersList();
	});

	// when server recieves message from this user
	socket.on('send-chat-message', message => {
		var messageObject = {
			name: usersList[socket.id], 
			message: message
		};
		socket.broadcast.emit("chat-message", messageObject);
		updateUsersList();
	});

	socket.on('disconnect', () => {
		socket.broadcast.emit('announce-left-user', usersList[socket.id]);
		delete usersList[socket.id]; // remove from usersList
		updateUsersList();
	});
});


function updateUsersList(){
	var names = '';
	for (var id in usersList) {
		names += usersList[id] + ", ";
	}
	io.sockets.emit('update-users-list', names);
}


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

