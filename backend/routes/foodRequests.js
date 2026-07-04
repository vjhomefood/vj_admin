const express = require('express');
const router = express.Router();
const {
  getAllRequests,
  getMyRequests,
  createRequest,
  approveRequest,
  rejectRequest
} = require('../controllers/foodRequestController');
const { protect, adminOnly, batchOnly } = require('../middleware/auth');

// Batch user routes
router.get('/my',              protect, batchOnly, getMyRequests);
router.post('/',               protect, batchOnly, createRequest);

// Admin routes
router.get('/',                protect, adminOnly, getAllRequests);
router.patch('/:id/approve',   protect, adminOnly, approveRequest);
router.patch('/:id/reject',    protect, adminOnly, rejectRequest);

module.exports = router;
