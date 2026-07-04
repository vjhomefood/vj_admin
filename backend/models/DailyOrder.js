const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name:  { type: String, default: '' },
  price: { type: Number, default: 0 }
}, { _id: false });

const dailyOrderSchema = new mongoose.Schema({
  date:       { type: String, required: true }, // YYYY-MM-DD
  batchId:    { type: String, required: true },
  memberId:   { type: String, required: true },
  memberName: { type: String, required: true },

  // Counts (0 = skip, 1+ = ordered)
  bf:     { type: Number, default: 1, min: 0 },
  lunch:  { type: Number, default: 1, min: 0 },
  dinner: { type: Number, default: 1, min: 0 },

  // Quantity per plate (multiplier for billing). Default 1 — fully backward compatible.
  bfQty:     { type: Number, default: 1, min: 0 },
  lunchQty:  { type: Number, default: 1, min: 0 },
  dinnerQty: { type: Number, default: 1, min: 0 },

  // Food type per meal: 'veg' | 'nonveg'
  bfType:     { type: String, enum: ['veg', 'nonveg'], default: 'veg' },
  lunchType:  { type: String, enum: ['veg', 'nonveg'], default: 'veg' },
  dinnerType: { type: String, enum: ['veg', 'nonveg'], default: 'veg' },

  // Per-member addons per meal
  bfAddons:     { type: [addonSchema], default: [] },
  lunchAddons:  { type: [addonSchema], default: [] },
  dinnerAddons: { type: [addonSchema], default: [] }
});

dailyOrderSchema.index({ date: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('DailyOrder', dailyOrderSchema);
