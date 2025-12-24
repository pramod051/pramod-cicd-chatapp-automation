const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
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

const Room = {
    // 🏠 Create a new Chat Room (Private or Group)
    create: async (data) => {
        const roomId = uuidv4();
        const timestamp = new Date().toISOString();

        const newRoom = {
            PK: `ROOM#${data.name}`,           // Partition Key
            SK: `METADATA#${data.name}`,       // Sort Key for room settings
            id: roomId,
            name: data.name,
            description: data.description || '',
            type: data.type || 'private',
            createdByUserId: data.createdByUserId,
            adminUserId: data.adminUserId || data.createdByUserId,
            lastMessageId: null,               // Updated when new messages arrive
            createdAt: timestamp,
            updatedAt: timestamp
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: newRoom,
            ConditionExpression: "attribute_not_exists(PK)" // Ensures unique room names
        }));

        return newRoom;
    },

    // 🔍 Fetch Room Details
    getByName: async (roomName) => {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `ROOM#${roomName}`,
                SK: `METADATA#${roomName}`
            }
        }));
        return result.Item;
    },

    // 📩 Update Last Message ID (For "Last Message" preview in UI)
    updateLastMessage: async (roomName, messageId) => {
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `ROOM#${roomName}`,
                SK: `METADATA#${roomName}`
            },
            UpdateExpression: "set lastMessageId = :m, updatedAt = :t",
            ExpressionAttributeValues: {
                ":m": messageId,
                ":t": new Date().toISOString()
            }
        }));
    }
};

module.exports = Room;
