const socket = io("/chat"); // namespace

const leaveButtons = document.getElementsByClassName("leave-button");

// join room
const joinRoomPage = document.getElementById("join-room"),
	roomsContainer = document.getElementById("rooms-list"),
	usernameInput = document.getElementById("username-input"),
	createBtn = document.getElementById("create-btn"),
	refreshBtn = document.getElementById("refresh-btn");

// create room
const createRoomPage = document.getElementById("create-room"),
	createRoomForm = document.getElementById("create-room-form"),
	privateCheckbox = document.getElementById("private-input"),
	roomNameInput = document.getElementById("room-name-input"),
	createRoomPasswordInput = document.getElementById("create-room-password-input");

// join private room
const joinPrivateRoomPage = document.getElementById("join-private-room"),
	privateRoomText = document.getElementById("private-room-text"),
	joinPrivateRoomForm = document.getElementById("join-private-room-form"),
	roomPasswordInput = document.getElementById("room-password-input"),
	incorrectMessage = document.getElementById("incorrect-message");

// chat room
const chatRoomPage = document.getElementById("chatroom"),
	messageContainer = document.getElementById('messages-container'),
	messageForm = document.getElementById('send-container'),
	messageInput = document.getElementById("message-input"),
	usernameText = document.getElementById("username-text"),
	roomNameText = document.getElementById("room-name-text"),
	usersListShowBtn = document.getElementById("show-users-list-btn"),
	usersList = document.getElementById("users-list");

let privateRoomID; // used to hold selected roomID
let showingUsersList = false;

// INITIALIZE
socket.emit("add-user");
loadPage('join-room');

// leave buttons
for (let i = 0; i < leaveButtons.length; i++){
	leaveButtons[i].addEventListener("click", () => {
		// server side will handle if user is in a room or not
		socket.emit('leave-room');
		loadPage('join-room');
	});
}


// ------------------ JOIN ROOM -----------------

createBtn.addEventListener("click", () => {
	if (enteredName()) {
		loadPage("create-room");
	}
});

// refresh rooms list
refreshBtn.addEventListener('click', () => {
	socket.emit("refresh-rooms-list"); // this line is also in loadPage()
});
// receiving rooms list data
socket.on('refresh-rooms-list', roomsList => {
	// remove old contents
	while(roomsContainer.firstChild){
		roomsContainer.removeChild(roomsContainer.firstChild);
	}

	// room is {roomID, roomName, usersAmount, publicity}
	roomsList.forEach(room => {
		let roomPanel = document.createElement("div");
		roomPanel.classList.add("room-on-list");
		
		// appending three h4's
		roomPanel.innerHTML = `<h4>${room.roomName}</h4><h4>${room.usersAmount}</h4><h4>${room.publicity}</h4>`;

		// when clicked
		roomPanel.addEventListener("click", e => {
			if (enteredName()) {
				// accessing room.roomID by closure
				// public or private?
				if (room.publicity === "Public"){
					socket.emit("join-room", usernameInput.value, room.roomID, null);
				}
				else {
					// set room name text
					privateRoomText.innerText = "Joining: " + room.roomName;
					privateRoomID = room.roomID;
					loadPage("join-private-room");
				}
			}
		});

		roomsContainer.appendChild(roomPanel);
	});

	// if there is no room
	if (roomsList.length === 0){
		roomsContainer.innerHTML = "<p>No room exists at the moment.</p>";
	}
});

function enteredName(){return usernameInput.reportValidity();}

// ------------------ CREATE ROOM --------------------

privateCheckbox.addEventListener("click", e => {
	createRoomPasswordInput.disabled = createRoomPasswordInput.hidden = !e.target.checked;
});

// clicking create
createRoomForm.addEventListener("submit", e => {
	e.preventDefault();

	let roomPass = (privateCheckbox.checked) ? createRoomPasswordInput.value : null ;
	socket.emit("create-room", usernameInput.value, roomNameInput.value, roomPass);
});

// ------------------ JOIN PRIVATE ROOM --------------------

joinPrivateRoomForm.addEventListener("submit", e => {
	e.preventDefault();

	socket.emit("join-room", usernameInput.value, privateRoomID, roomPasswordInput.value);
});
socket.on("wrong-password", () => {
	incorrectMessage.hidden = false;
});

socket.on("room-not-found", () => {
	alert("Room not found.");
});

// ------------------ CHAT ROOM --------------------

// when successfully joined the room
socket.on('join-room', (name, roomName) => {
	loadPage("chatroom");
	usernameText.innerText = "Your username: " + name;
	roomNameText.innerText = "Room name: " + roomName;
	appendMessage("user-join", 'You joined.');
});

// when click Show/Hide
usersListShowBtn.addEventListener("click", () => {
	if (showingUsersList){
		// hiding
		showingUsersList = false;
		usersListShowBtn.innerText = "Show";
		usersList.classList.add("collapsed-users-list");
	} else {
		// showing
		showingUsersList = true;
		usersListShowBtn.innerText = "Hide";
		usersList.classList.remove("collapsed-users-list");
	}
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
	// clear usernames
	while(usersList.firstChild){
		usersList.removeChild(usersList.firstChild);
	}
	names.forEach(n => {
		usersList.innerHTML += `<p>${n}</p>`;
	});
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

			socket.emit("refresh-rooms-list"); // refresh
			break;

		case "create-room":
			createRoomPage.style.display = "block";

			// reset
			roomNameInput.value = createRoomPasswordInput.value = "";
			createRoomPasswordInput.disabled = !(privateCheckbox.checked = false);
			createRoomPasswordInput.hidden = true;
			break;

		case "join-private-room":
			joinPrivateRoomPage.style.display = "block";

			// reset
			roomPasswordInput.value = "";
			incorrectMessage.hidden = true;
			break;

		case "chatroom":
			chatRoomPage.style.display = "block";

			// reset
			showingUsersList = false;
			usersListShowBtn.innerText = "Show";
			usersList.classList.add("collapsed-users-list");
			// clear messages
			while(messageContainer.firstChild){
				messageContainer.removeChild(messageContainer.firstChild);
			}
			messageInput.value = "";
			break;
	}
}