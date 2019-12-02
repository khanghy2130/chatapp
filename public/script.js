const socket = io("/chat"); // namespace

const leaveButtons = document.getElementsByClassName("leave-button");

// join room
const joinRoomPage = document.getElementById("join-room"),
	usernameInput = document.getElementById("username-input");

// create room
const createRoomPage = document.getElementById("create-room");

// join private room
const joinPrivateRoomPage = document.getElementById("join-private-room");

// chat room
const chatRoomPage = document.getElementById("chatroom"),
	usersList = document.getElementById("users-list"),
	messageContainer = document.getElementById('messages-container'),
	messageForm = document.getElementById('send-container'),
	messageInput = document.getElementById("message-input"),
	usernameText = document.getElementById("username-text"),
	roomIdText = document.getElementById("roomId-text");



// INITIALIZE
socket.emit("add-user");
loadPage('join-room');

// leave buttons
for (let i = 0; i < leaveButtons.length; i++){
	leaveButtons[i].addEventListener("click", () => {
		loadPage('join-room');
		socket.emit('leave-room');
	});
}


// ------------------ JOIN ROOM -----------------

// deleted
/*
joinRoomForm.addEventListener('submit', event => {
	event.preventDefault(); // stop the form from submiting

	socket.emit("join-room", usernameInput.value, roomIdInput.value);
});*/


// add eventlistener to newly created room panels
function createRoomPanel(){
	
}

function refreshRoomsList(){
	
}

function enteredName(){return usernameInput.reportValidity();}

// ------------------ CREATE ROOM --------------------




// ------------------ JOIN PRIVATE ROOM --------------------




// ------------------ CHAT ROOM --------------------

// switch to chat room when joined
socket.on('join-room', (name, roomId) => {
	loadPage("chatroom");
	usernameText.innerText = "Your username: " + name;
	roomIdText.innerText = "Room ID: " + roomId;
	appendMessage("user-join", 'You joined.');
});

// when click send message
messageForm.addEventListener('submit', event => {
	event.preventDefault(); // stop the form from submiting

	// send message value to server
	const message = messageInput.value;
	socket.emit("chat-message", message);
	appendMessage("self-msg", message);

	messageInput.value = ''; // clear message input box
});

// recieves data about who joined
socket.on('update-users-list', names => {
	usersList.innerText = "Users in room: " + names.substring(0, names.length - 2);
});

socket.on('announce-new-user', name => {
	appendMessage("user-join", name + " joined.");
});

socket.on('announce-left-user', name => {
	appendMessage("user-leave", name + " left.");
});


socket.on('chat-message', messageObject => {
	appendMessage(
		"other-msg",
		`${messageObject.name}: ${messageObject.message}`
	);
});


function appendMessage(className, message) {
	const messageElement = document.createElement('p');

	// set class (other-msg, self-msg, user-join, user-leave)
	messageElement.classList.add(className);
	messageElement.innerText = message;
	messageContainer.append(messageElement);

	// scroll down to bottom
	messageContainer.scrollTop = messageContainer.scrollHeight;
}

function loadPage(page) {
	// hide everything
	joinRoomPage.style.display = "none";
	createRoomPage.style.display = "none";
	joinPrivateRoomPage.style.display = "none";
	chatRoomPage.style.display = "none";

	// switch to and setup for the target page
	switch (page) {
		case "join-room":
			joinRoomPage.style.display = "block";
			roomIdInput.value = "";
			break;

		case "create-room":
			createRoomPage.style.display = "block";
			// reset
			break;

		case "join-private-room":
			joinPrivateRoomPage.style.display = "block";
			// reset
			break;

		case "chatroom":
			chatRoomPage.style.display = "block";

			// clear messages
			while(messageContainer.firstChild){
				messageContainer.removeChild(messageContainer.firstChild);
			}
			messageInput.value = "";
			break;
	}
}