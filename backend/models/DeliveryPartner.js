const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  role:      { type: String, default: 'delivery partner' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'deliverypartner' });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
