const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name:  { type: String, default: '' },
  price: { type: Number, default: 0 }
}, { _id: false });

const mealSchema = new mongoose.Schema({
  name:  { type: String, default: '' },
  price: { type: Number, default: 0 },
  // Non-veg option — toggled independently per meal
  nonVegEnabled: { type: Boolean, default: false },
  nonVegName:    { type: String,  default: '' },
  nonVegPrice:   { type: Number,  default: 0 },
  addons:        { type: [addonSchema], default: [] },
  nonVegAddons:  { type: [addonSchema], default: [] }
}, { _id: false });

const dailyMenuSchema = new mongoose.Schema({
  date:      { type: String, required: true, unique: true }, // YYYY-MM-DD
  breakfast: { type: mealSchema, default: () => ({}) },
  lunch:     { type: mealSchema, default: () => ({}) },
  dinner:    { type: mealSchema, default: () => ({}) }
});

module.exports = mongoose.model('DailyMenu', dailyMenuSchema);
