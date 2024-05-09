const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({ messages: [], userCooldowns: {} }).write();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (name) => {
    socket.userName = name;
    console.log(`${name} joined the chat`);
    io.emit('userJoined', name);
  });

  socket.on('message', (message) => {
    const userName = socket.userName;
    const cooldownDuration = 5000; // 5 seconds

    const userCooldown = db.get('userCooldowns').find({ user: userName }).value();

    if (userCooldown && Date.now() - userCooldown.lastMessageTime < cooldownDuration) {
      socket.emit('cooldownMessage', `Please wait ${Math.ceil((cooldownDuration - (Date.now() - userCooldown.lastMessageTime)) / 1000)} seconds before sending another message.`);
    } else {
      db.get('messages').push({ user: userName, message }).write();
      io.emit('newMessage', { user: userName, message });

      db.get('userCooldowns').remove({ user: userName }).write();
      db.get('userCooldowns').push({ user: userName, lastMessageTime: Date.now() }).write();
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});