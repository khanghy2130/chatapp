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
// object with userID as key, {name, roomID}
const usersList = {}; 
// roomID as key, {roomName, password (null => is public)}
const roomsList = {}; 


app.get('/*', function (req, res) {
  	res.render('index');
});


var chat = io.of('chat'); // 'chat' namespace
chat.on("connection", socket => {

	// receives when finish connecting
	socket.on('add-user', () => {
		usersList[socket.id] = {
			name: null,
			roomID: null
		};
	});

	socket.on('disconnect', () => {
		if (isNotInUsersList(socket)) return; // stop if user is not in list

		var roomID = usersList[socket.id].roomID;
		// announce leaving if in a room
		if (roomID){
			usersList[socket.id].roomID = null;
			socket.to(roomID).emit('announce-left-user', usersList[socket.id].name);
			updateUsersList(roomID);
			checkRemoveRoom(roomID);
		}
		
		delete usersList[socket.id]; // remove from usersList
	});

	// client will request this on load only
	socket.on('refresh-rooms-list', () => {
		refreshRoomsList();
	});

	socket.on('create-room', (name, roomName, roomPassword) => {
		if (isNotInUsersList(socket)) return; // stop if user is not in list

		// create the room (with return value of roomID)
		let roomID = creatingRoom(roomName, roomPassword);

		// join the room
		joiningRoom(socket, name, roomID, roomPassword);
	});

	socket.on('join-room', (name, roomID, roomPassword) => {
		if (isNotInUsersList(socket)) return; // stop if user is not in list

		joiningRoom(socket, name, roomID, roomPassword);
	});

	// announce leaving, update users list and remove roomID from user object
	socket.on('leave-room', () => {
		if (isNotInUsersList(socket)) return; // stop if user is not in list

		if (!usersList[socket.id]){
			socket.emit("force-disconnect");
			return;
		}

		var roomID = usersList[socket.id].roomID;

		// if is actually in a room
		if (roomID){
			socket.leave(roomID);
			usersList[socket.id].roomID = null;
			socket.to(roomID).emit('announce-left-user', usersList[socket.id].name);
			updateUsersList(roomID);
			checkRemoveRoom(roomID);
		}
	});

	// when server recieves message from this user
	socket.on('chat-message', message => {
		if (isNotInUsersList(socket)) return; // stop if user is not in list

		var messageObject = {
			name: usersList[socket.id].name, 
			message: message
		};
		socket.to(usersList[socket.id].roomID).emit("chat-message", messageObject);
	});
});



function refreshRoomsList(){
	let roomIDs = Object.keys(roomsList);

	// each is {roomID, roomName, usersAmount, publicity}
	let data = roomIDs.map(roomID => {
		// count number of users in this room
		let ua = 0;
		for (var id in usersList) {
			if (usersList[id].roomID === roomID){
				ua++;
			}
		}

		return {
			roomID: roomID,
			roomName: roomsList[roomID].roomName,
			publicity: (roomsList[roomID].roomPassword) ? "Private" : "Public",
			usersAmount: ua + " user(s)"
		}
	});
	io.of("chat").emit('refresh-rooms-list', data);
}

// create the room then return its roomID
function creatingRoom(roomName, roomPassword){
	let roomID = create_UUID();
	// while this key is taken
	while (roomsList[roomID]){
		roomID = create_UUID();
	}

	roomsList[roomID] = {
		roomName: roomName,
		roomPassword: roomPassword
	};

	refreshRoomsList();
	return roomID;
}

// run to check and remove a room if no more users inside
function checkRemoveRoom(roomID){
	// quit if there is someone in this room
	for (var id in usersList) {
		if (usersList[id].roomID === roomID){
			return;
		}
	}

	delete roomsList[roomID]; // remove room from list because it's empty
	refreshRoomsList();
}

// join a room, if room is private then check password
function joiningRoom (socket, name, roomID, roomPassword){
	// if the room exists
	if (!roomsList[roomID]){
		socket.emit('room-not-found');
		return;
	}

	// this room requires password AND password doesn't match?
	if (roomsList[roomID].roomPassword && roomsList[roomID].roomPassword !== roomPassword){
		socket.emit('wrong-password');
		return;
	}

	// set properties for that user
	usersList[socket.id].name = name;
	usersList[socket.id].roomID = roomID;

	socket.join(roomID);
	socket.emit('join-room', name, roomsList[roomID].roomName); // notify the client
	socket.to(roomID).emit('announce-new-user', usersList[socket.id].name);
	updateUsersList(usersList[socket.id].roomID);
}

// get update of the list of users in a room for that room
function updateUsersList(roomID){
	var names = [];
	for (var id in usersList) {
		if (usersList[id].roomID === roomID){
			names.push(usersList[id].name);
		}
	}
	io.of('chat').to(roomID).emit('update-users-list', names);
}

// check if user doesn't exist in usersList => force disconnect if true
function isNotInUsersList(socket){
	// if the user object is null
	if (!usersList[socket.id]){
		socket.emit("force-disconnect");
		socket.disconnect();
		return true;
	}
	return false;
}

// to create roomID
function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}


server.listen(PORT);

/*  EMIT KEYS

server to client: 
	force-disconnect (when connecting user isn't included in usersList)

JOIN ROOM:
	client to server: 
		add-user
		refresh-rooms-list
		join-room
		leave-room

	server to client: 
		refresh-rooms-list (sending back data)
		join-room  (done joining a room)
		room-not-found

CREATE ROOM:
	client to server: 
		create-room
	server to client:
		join-room

JOIN PRIVATE ROOM:
	client to server: 
		join-room
	server to client:
		wrong-password
		join-room
		room-not-found

CHAT ROOM:
	client to server: 
		chat-message

	server to client: 
		update-users-list
		announce-new-user
		announce-left-user
		chat-message 

*/
