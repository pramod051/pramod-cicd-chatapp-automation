const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  senderId: {
    type: DataTypes.UUID,
    allowNull: false
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  messageType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'file'),
    defaultValue: 'text'
  },

  room: {
    type: DataTypes.STRING,
    allowNull: false
  },

  replyToMessageId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  forwardedFromMessageId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  fileName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },

  fileSize: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true   // createdAt, updatedAt
});

module.exports = Message;

