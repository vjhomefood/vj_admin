const express = require('express');
const router = express.Router();
const {
  getDeliveryPartners,
  createDeliveryPartner,
  getAdminDeliveryStatus,
  bulkAssignBatches,
  markReceived
} = require('../controllers/deliveryController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/partners', protect, adminOnly, getDeliveryPartners);
router.post('/partners', protect, adminOnly, createDeliveryPartner);
router.get('/status', protect, adminOnly, getAdminDeliveryStatus);
router.put('/assign', protect, adminOnly, bulkAssignBatches);
router.patch('/receive', protect, adminOnly, markReceived);

module.exports = router;
