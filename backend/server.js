const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create connection to MySQL using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Database connection
//mongoose.connect(process.env.MONGODB_URI || '13.234.210.21://mongodb:27017/talkwithteams')
//  .then(() => console.log('Connected to MongoDB'))
//  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

// Socket.IO connection handling
const Message = require('./models/Message');
const User = require('./models/User');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const message = new Message({
        sender: data.sender,
        content: data.content,
        messageType: data.messageType || 'text',
        room: data.room,
        replyTo: data.replyTo || null,
        forwardedFrom: data.forwardedFrom || null,
        fileName: data.fileName || '',
        timestamp: new Date()
      });
      
      await message.save();
      await message.populate([
        { path: 'sender', select: 'username profilePicture' },
        { 
          path: 'replyTo',
          populate: { path: 'sender', select: 'username' }
        },
        { 
          path: 'forwardedFrom',
          populate: { path: 'sender', select: 'username' }
        }
      ]);
      
      io.to(data.room).emit('receive-message', message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('user-typing', data);
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.room).emit('user-stop-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Talk With Teams server running on port ${PORT}`);
});
