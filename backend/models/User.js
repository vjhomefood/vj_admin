const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'batch', 'delivery', 'delivery partner'], default: 'user' },
  memberId: { type: String, default: null },
  batchId:  { type: String, default: null }
});

module.exports = mongoose.model('User', userSchema);
