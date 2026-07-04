const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date:      { type: String, required: true, unique: true }, // YYYY-MM-DD
  createdAt: { type: Date, default: Date.now }
}, { collection: 'holiday' });

module.exports = mongoose.model('Holiday', holidaySchema);
