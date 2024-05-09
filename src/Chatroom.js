import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io();

const ChatRoom = () => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    socket.on('initialMessages', (initialMessages) => {
      setMessages(initialMessages);
    });

    socket.on('newMessage', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    socket.on('userJoined', (joinedUsername) => {
      setMessages((prevMessages) => [...prevMessages, { notification: `${joinedUsername} joined the chat` }]);
    });

    socket.on('userLeft', (leftUsername) => {
      setMessages((prevMessages) => [...prevMessages, { notification: `${leftUsername} left the chat` }]);
    });

    socket.on('userRenamed', ({ oldUsername, newUsername }) => {
      setMessages((prevMessages) => [...prevMessages, { notification: `${oldUsername} changed their username to ${newUsername}` }]);
    });

    socket.on('welcome', (message) => {
      setMessages((prevMessages) => [...prevMessages, { notification: message }]);
    });

    socket.on('error', (message) => {
      setMessages((prevMessages) => [...prevMessages, { error: message }]);
    });

    socket.on('success', (message) => {
      setMessages((prevMessages) => [...prevMessages, { success: message }]);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = () => {
    if (username) {
      socket.emit('join', username);
    }
  };

  const handleRename = () => {
    if (newUsername) {
      socket.emit('rename', newUsername);
      setNewUsername('');
    }
  };

  const handleSendMessage = () => {
    if (newMessage) {
      socket.emit('message', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div>
      <h1>Chat Room</h1>
      <div id="messages">
        {messages.map((messageData, index) => (
          <div key={index} className="message">
            {messageData.notification && <span className="notification">{messageData.notification}</span>}
            {messageData.error && <span className="error">{messageData.error}</span>}
            {messageData.success && <span className="success">{messageData.success}</span>}
            {messageData.user && (
              <span>
                <span className="username">{messageData.user}:</span> {messageData.message}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input type="text" id="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <button id="joinBtn" onClick={handleJoin}>
        Join
      </button>
      <div id="chatControls" style={{ display: username ? 'block' : 'none' }}>
        <input type="text" id="renameInput" placeholder="Enter a new username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
        <button id="renameBtn" onClick={handleRename}>
          Rename
        </button>
        <input type="text" id="messageInput" placeholder="Enter your message" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button id="sendBtn" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
