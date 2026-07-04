const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name:  { type: String, default: '' },
  price: { type: Number, default: 0 }
}, { _id: false });

const billLineSchema = new mongoose.Schema({
  date:             { type: String, required: true },   // YYYY-MM-DD
  bfQty:            { type: Number, default: 0 },       // Count
  bfMultiplier:     { type: Number, default: 1 },       // Quantity
  bfType:           { type: String, default: 'veg' },
  bfPrice:          { type: Number, default: 0 },
  bfAddons:         { type: [addonSchema], default: [] },
  bfTotal:          { type: Number, default: 0 },
  
  lunchQty:         { type: Number, default: 0 },       // Count
  lunchMultiplier:  { type: Number, default: 1 },       // Quantity
  lunchType:        { type: String, default: 'veg' },
  lunchPrice:       { type: Number, default: 0 },
  lunchAddons:      { type: [addonSchema], default: [] },
  lunchTotal:       { type: Number, default: 0 },
  
  dinnerQty:        { type: Number, default: 0 },       // Count
  dinnerMultiplier: { type: Number, default: 1 },       // Quantity
  dinnerType:       { type: String, default: 'veg' },
  dinnerPrice:      { type: Number, default: 0 },
  dinnerAddons:     { type: [addonSchema], default: [] },
  dinnerTotal:      { type: Number, default: 0 },
  
  dayTotal:         { type: Number, default: 0 }
}, { _id: false });

const billSchema = new mongoose.Schema({
  batchId:        { type: String, required: true },
  memberId:       { type: String, required: true },
  memberName:     { type: String, required: true },
  isLead:         { type: Boolean, default: false },
  // Period — month+year for monthly bills, or custom date range
  month:          { type: Number },                  // 1–12
  year:           { type: Number },
  startDate:      { type: String },                  // YYYY-MM-DD (custom range)
  endDate:        { type: String },                  // YYYY-MM-DD (custom range)
  lines:          [billLineSchema],
  grandTotal:     { type: Number, default: 0 },
  paymentStatus:  { type: String, enum: ['Unpaid', 'Paid', 'Partial'], default: 'Unpaid' },
  paidAmount:     { type: Number, default: 0 },
  notes:          { type: String, default: '' },
  isManuallyEdited: { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now }
});

// Compound index — unique bill per member per period
billSchema.index({ batchId: 1, memberId: 1, month: 1, year: 1, startDate: 1 });

module.exports = mongoose.model('Bill', billSchema);
