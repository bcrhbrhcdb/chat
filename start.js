const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Load data from the JSON file
const dataFile = 'data.json';
let data = {};
try {
  data = JSON.parse(fs.readFileSync(dataFile));
} catch (err) {
  console.log('Error reading data file:', err);
}

// Initialize data if it doesn't exist
if (!data.messages) data.messages = [];
if (!data.users) data.users = {};

// Save data to the JSON file
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data));
}

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send the current chat messages to the new user
  socket.emit('initialMessages', data.messages);

  // Handle user joining the chat
  socket.on('join', (username) => {
    const existingUser = Object.values(data.users).find(user => user.username === username);
    if (existingUser) {
      socket.emit('error', 'Username already taken');
      return;
    }

    const user = { id: socket.id, username };
    data.users[socket.id] = user;
    socket.broadcast.emit('userJoined', user.username);
    socket.emit('welcome', `Welcome to the chat, ${user.username}!`);
    saveData();
  });

  // Handle user renaming
  socket.on('rename', (newUsername) => {
    const user = data.users[socket.id];
    if (!user) {
      socket.emit('error', 'You must join the chat first');
      return;
    }

    const existingUser = Object.values(data.users).find(u => u.username === newUsername);
    if (existingUser) {
      socket.emit('error', 'Username already taken');
      return;
    }

    const oldUsername = user.username;
    user.username = newUsername;
    socket.broadcast.emit('userRenamed', { oldUsername, newUsername });
    socket.emit('success', `Your username has been changed to ${newUsername}`);
    saveData();
  });

  // Handle new message
  socket.on('message', (message) => {
    const user = data.users[socket.id];
    if (!user) {
      socket.emit('error', 'You must join the chat first');
      return;
    }

    const messageData = { user: user.username, message };
    data.messages.push(messageData);
    io.emit('newMessage', messageData);
    saveData();
  });

  // Handle user leaving the chat
  socket.on('disconnect', () => {
    const user = data.users[socket.id];
    if (user) {
      socket.broadcast.emit('userLeft', user.username);
      delete data.users[socket.id];
      saveData();
    }
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
