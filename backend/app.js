const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS configuration for React frontend
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // React dev server
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
// Store connected sockets
let socketsConnected = new Set();


io.on('connection', onConnected);
function onConnected(socket) {
    console.log(`Socket connected: ${socket.id}`);
    socketsConnected.add(socket.id);
    
    
    io.emit('clients-total', socketsConnected.size);
    
   
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        socketsConnected.delete(socket.id);
        io.emit('clients-total', socketsConnected.size);
    });
    
    // Handle message
    socket.on('message', (data) => {
        console.log('Message received:', data);
        // Broadcast message to all other clients
        socket.broadcast.emit('chat-message', data);
    });
    
    // Handle typing feedback
    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
    });
}

// Basic health check route
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', connectedClients: socketsConnected.size });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
});