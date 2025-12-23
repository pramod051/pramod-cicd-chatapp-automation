const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },

  type: {
    type: DataTypes.ENUM('private', 'group'),
    defaultValue: 'private'
  },

  createdByUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },

  adminUserId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  lastMessageId: {
    type: DataTypes.UUID,
    allowNull: true
  }

}, {
  tableName: 'rooms',
  timestamps: true
});

module.exports = Room;

