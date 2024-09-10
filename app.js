const express = require('express');
const app = express()
const path = require('path');
const { Socket } = require('socket.io');
const PORT = process.env.port || 4000;
const server = app.listen(PORT, () => console.log(`server running on port ${PORT}`));
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')))
let socketsConnected = new Set();

io.on('connection', onConnected)

function onConnected(socket) {
    console.log(socket.id)
    socketsConnected.add(socket.id)
 
    io.emit('clients-total', socketsConnected.size)
 
    socket.on('disconnect', () => {
        console.log(`socket id :    ${socket.id} ---------disconnected`);
        socketsConnected.delete(socket.id);
        io.emit('clients-total', socketsConnected.size)
    })

    socket.on('message',(data)=>{
       // console.log(data);
        socket.broadcast.emit('chat-message',data)
    })

    socket.on('feedback',(data)=>{
        socket.broadcast.emit('feedback',data)
    })
}

