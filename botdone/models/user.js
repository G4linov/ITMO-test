// models/user.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true },
  fullName: String,
  authKey: String,
  isAuthorized: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
