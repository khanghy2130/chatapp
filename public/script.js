// get the name first before running anything else
var name;
do {
	name = prompt("Please enter your name");
} while(name === "null");

const socket = io("/chat"); // namespace
const usersList = document.getElementById("users-list");
const messageContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById("message-input");
const userName = document.getElementById("user-name");


// initialize
userName.innerText = name;
appendMessage("green", 'You joined.');
socket.emit("new-user-joins", name);

// recieves data about who joined
socket.on('update-users-list', names => {
	usersList.innerText = names;
});



// when click submit
messageForm.addEventListener('submit', event => {
	event.preventDefault(); // stop the form from submiting

	// send message value to server
	const message = messageInput.value;
	socket.emit("send-chat-message", message);
	appendMessage("#f0f0f0", "You: " + message);

	messageInput.value = ''; // clear message input box
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