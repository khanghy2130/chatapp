const socket = io("/chat"); // namespace

// join room
const joinRoomForm = document.getElementById("join-room-form"),
	usernameInput = document.getElementById("username-input"),
	roomIdInput = document.getElementById("room-id");

// chat room
const usersList = document.getElementById("users-list"),
	messageContainer = document.getElementById('messages-container'),
	messageForm = document.getElementById('send-container'),
	messageInput = document.getElementById("message-input"),
	usernameText = document.getElementById("username-text"),
	roomIdText = document.getElementById("roomId-text");


// initialize
socket.emit("add-user");
loadPage('join-room');


// ------------------ JOIN ROOM -----------------

joinRoomForm.addEventListener('submit', event => {
	event.preventDefault(); // stop the form from submiting

	socket.emit("join-room", usernameInput.value, roomIdInput.value);
});

// switch to chat room when joined
socket.on('join-room', (name, roomId) => {
	loadPage("chatroom");
	usernameText.innerText = name;
	roomIdText.innerText = "Room ID: " + roomId;
	appendMessage("green", 'You joined.');
});



// ------------------ CHAT ROOM --------------------


// when click submit
messageForm.addEventListener('submit', event => {
	event.preventDefault(); // stop the form from submiting

	// send message value to server
	const message = messageInput.value;
	socket.emit("chat-message", message);
	appendMessage("#f0f0f0", "You: " + message);

	messageInput.value = ''; // clear message input box
});

// when click leave room
document.getElementById("leave-button").addEventListener("click", () => {
	loadPage('join-room');
	socket.emit('leave-room');
});

// recieves data about who joined
socket.on('update-users-list', names => {
	usersList.innerText = "Users in this room: " + names.substring(0, names.length - 2);
});

socket.on('announce-new-user', name => {
	appendMessage("green", name + " joined.");
});

socket.on('announce-left-user', name => {
	appendMessage("red", name + " left.");
});


socket.on('chat-message', messageObject => {
	appendMessage(
		"#f0f0f0",
		`${messageObject.name}: ${messageObject.message}`
	);
});



function appendMessage(color, message) {
	const messageElement = document.createElement('p');
	messageElement.style.color = color;
	messageElement.innerText = message;
	messageContainer.append(messageElement);

	// scroll down to bottom
	messageContainer.scrollTop = messageContainer.scrollHeight;
}

function loadPage(page) {
	if (page === "join-room"){
		document.getElementById("chatroom").style.display = "none";
		document.getElementById("join-room").style.display = "block";
		roomIdInput.value = "";
	} 
	// chat room
	else {
		document.getElementById("join-room").style.display = "none";
		document.getElementById("chatroom").style.display = "block";

		// clear messages
		while(messageContainer.firstChild){
			messageContainer.removeChild(messageContainer.firstChild);
		}
		messageInput.value = "";
	}
}