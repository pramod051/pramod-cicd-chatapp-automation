const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "TalkWithTeams";

const Message = {
    // 📝 Save a new message
    create: async (data) => {
        const timestamp = new Date().toISOString();
        const messageId = uuidv4();

        const newMessage = {
            PK: `ROOM#${data.room}`,               // Partition Key (Groups messages by room)
            SK: `MSG#${timestamp}#${messageId}`,   // Sort Key (Orders by time, unique ID appended)
            id: messageId,
            senderId: data.senderId,
            content: data.content,
            messageType: data.messageType || 'text',
            room: data.room,
            replyToMessageId: data.replyToMessageId || null,
            forwardedFromMessageId: data.forwardedFromMessageId || null,
            fileName: data.fileName || '',
            fileSize: data.fileSize || 0,
            isDeleted: false,
            createdAt: timestamp
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: newMessage
        }));

        return newMessage;
    },

    // 🕒 Fetch messages for a specific room (Ordered by time)
    getByRoom: async (roomName, limit = 50) => {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :roomPrefix AND begins_with(SK, :msgPrefix)",
            ExpressionAttributeValues: {
                ":roomPrefix": `ROOM#${roomName}`,
                ":msgPrefix": "MSG#"
            },
            ScanIndexForward: true, // true = Oldest to Newest, false = Newest to Oldest
            Limit: limit
        }));

        return result.Items;
    },

    // 🗑️ Soft Delete a message
    delete: async (room, sk) => {
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `ROOM#${room}`,
                SK: sk
            },
            UpdateExpression: "set isDeleted = :d, deletedAt = :t",
            ExpressionAttributeValues: {
                ":d": true,
                ":t": new Date().toISOString()
            }
        }));
    }
};

module.exports = Message;
