const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require('bcryptjs');

// --- 1. Configure AWS Client ---
const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKey_id: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "TalkWithTeams";

const User = {
    // 🔐 Create (Register) a new user
    create: async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const newUser = {
            PK: `USER#${userData.email}`, // Using email as a unique identifier for login
            SK: `METADATA#${userData.email}`,
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            profilePicture: userData.profilePicture || '',
            isOnline: false,
            lastSeen: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: newUser,
            ConditionExpression: "attribute_not_exists(PK)" // Prevents duplicate emails
        }));

        return newUser;
    },

    // 🔍 Find user by Email (For Login)
    findByEmail: async (email) => {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${email}`,
                SK: `METADATA#${email}`
            }
        }));
        return result.Item;
    },

    // 🔑 Compare Password helper
    comparePassword: async (providedPassword, hashedPassword) => {
        return await bcrypt.compare(providedPassword, hashedPassword);
    },

    // 🟢 Update Online Status
    updateStatus: async (email, isOnline) => {
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${email}`,
                SK: `METADATA#${email}`
            },
            UpdateExpression: "set isOnline = :o, lastSeen = :l",
            ExpressionAttributeValues: {
                ":o": isOnline,
                ":l": new Date().toISOString()
            }
        }));
    }
};

module.exports = User;
