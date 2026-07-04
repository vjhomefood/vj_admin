const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  date:               { type: String, required: true }, // YYYY-MM-DD
  batchId:            { type: String, required: true },
  deliveryPartner:    { type: String, required: true }, // username
  bfStatus:           { type: String, enum: ['Pending', 'Delivered'], default: 'Pending' },
  bfDeliveredAt:      { type: Date },
  bfReceived:         { type: Boolean, default: false },
  bfReceivedAt:       { type: Date },
  lunchStatus:        { type: String, enum: ['Pending', 'Delivered'], default: 'Pending' },
  lunchDeliveredAt:   { type: Date },
  lunchReceived:      { type: Boolean, default: false },
  lunchReceivedAt:    { type: Date },
  dinnerStatus:       { type: String, enum: ['Pending', 'Delivered'], default: 'Pending' },
  dinnerDeliveredAt:  { type: Date },
  dinnerReceived:     { type: Boolean, default: false },
  dinnerReceivedAt:   { type: Date },
  createdAt:          { type: Date, default: Date.now }
});

// Compound index to ensure one delivery status per batch per date
deliverySchema.index({ date: 1, batchId: 1 }, { unique: true });

module.exports = mongoose.model('Delivery', deliverySchema);
