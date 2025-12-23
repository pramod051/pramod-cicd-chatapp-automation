const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const User = sequelize.define('User', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: ''
  },

  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'users',
  timestamps: true
});

// 🔐 Hash password before creating user
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 12);
});

// 🔑 Compare password
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;

