const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// AWS DynamoDB Clients
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// --- 1. Configure DynamoDB ---
const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const docClient = DynamoDBDocumentClient.from(client);

// --- 2. Socket.IO Handling ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send-message', async (data) => {
    // Structure data for Single Table Design
    const newMessage = {
        PK: `ROOM#${data.room}`,               // Partition Key
        SK: `MSG#${new Date().toISOString()}`, // Sort Key (Orders messages by time)
        sender: data.sender,
        content: data.content,
        messageType: data.messageType || 'text',
        timestamp: new Date().toISOString()
    };

    try {
      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: "TalkWithTeams",
        Item: newMessage
      }));

      // Broadcast to room
      io.to(data.room).emit('receive-message', newMessage);
    } catch (error) {
      console.error('DynamoDB Error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
