import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:4000');

const ChatApp = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      name: 'System',
      message: 'Welcome to the chat! 👋',
      dateTime: new Date(),
      isSystem: true,
      isOwn: false
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [userName, setUserName] = useState('anonymous');
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messageContainerRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    // Listen for total clients update
    socket.on('clients-total', (count) => {
      setOnlineUsers(count);
    });

    // Listen for incoming messages
    socket.on('chat-message', (data) => {
      const newMessage = {
        id: Date.now(),
        name: data.name,
        message: data.message,
        dateTime: new Date(data.dateTime),
        isSystem: false,
        isOwn: false
      };
      setMessages(prev => [...prev, newMessage]);
    });

    // Listen for typing feedback
    socket.on('feedback', (data) => {
      setFeedback(data.feedback);
      if (data.feedback) {
        setIsTyping(true);
        // Clear feedback after 3 seconds
        setTimeout(() => {
          setFeedback('');
          setIsTyping(false);
        }, 3000);
      } else {
        setIsTyping(false);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('clients-total');
      socket.off('chat-message');
      socket.off('feedback');
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, feedback]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const messageData = {
      name: userName,
      message: currentMessage,
      dateTime: new Date()
    };

    // Emit message to server
    socket.emit('message', messageData);

    // Add to local messages as own message
    const newMessage = {
      id: Date.now(),
      name: userName,
      message: currentMessage,
      dateTime: new Date(),
      isSystem: false,
      isOwn: true
    };
    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    
    // Clear any typing feedback
    socket.emit('feedback', { feedback: '' });
  };

  const handleInputFocus = () => {
    socket.emit('feedback', {
      feedback: `🧑🏼‍💻 ${userName} is typing a message`
    });
  };

  const handleInputBlur = () => {
    socket.emit('feedback', { feedback: '' });
  };

  const handleKeyPress = () => {
    socket.emit('feedback', {
      feedback: `🧑🏼‍💻 ${userName} is typing a message`
    });
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-6 tracking-tight">
        Chat App
      </h1>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* User Input */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <span className="text-gray-500 mr-3">
            <i className="fas fa-user"></i> 👤
          </span>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 rounded-lg transition-colors"
            maxLength={50}
            placeholder="Enter your name"
          />
        </div>

        {/* Messages Container */}
        <div 
          ref={messageContainerRef}
          className="h-96 overflow-y-auto p-4 space-y-3"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-xl shadow-sm ${
                  msg.isSystem
                    ? 'bg-amber-100 text-amber-800'
                    : msg.isOwn
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                <div
                  className={`text-xs font-bold mb-1 ${
                    msg.isSystem
                      ? 'text-amber-600'
                      : msg.isOwn
                      ? 'text-blue-100'
                      : 'text-blue-600'
                  }`}
                >
                  {msg.name}
                </div>
                <p className="text-sm leading-relaxed mb-2">{msg.message}</p>
                <div
                  className={`text-xs opacity-70 ${
                    msg.isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(msg.dateTime)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Feedback */}
          {feedback && (
            <div className="flex justify-start">
              <div className="text-xs text-gray-500 italic bg-gray-100 px-3 py-2 rounded-lg animate-pulse">
                {feedback}
              </div>
            </div>
          )}
        </div>

        {/* Message Form */}
        <div className="flex items-center p-4 border-t border-gray-200">
          <input
            ref={messageInputRef}
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyPress={(e) => {
              handleKeyPress();
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            className="flex-1 px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Type your message..."
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim()}
            className="ml-3 px-5 py-2 bg-blue-500 text-white font-medium text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            Send ✈️
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 font-medium">
        Users Online: {onlineUsers}
      </div>
    </div>
  );
};

export default ChatApp;