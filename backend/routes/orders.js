const express = require('express');
const router = express.Router();
const { getOrders, saveOrders, updateOrder, initOrders, getOrdersRange, checkHoliday, toggleHoliday } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/export', protect, getOrdersRange);      // must be before /:date
router.get('/holiday/check/:date', protect, adminOnly, checkHoliday);
router.post('/holiday/toggle', protect, adminOnly, toggleHoliday);
router.get('/init/:date', protect, adminOnly, initOrders);
router.get('/:date', protect, getOrders);
router.post('/', protect, adminOnly, saveOrders);
router.put('/:id', protect, adminOnly, updateOrder);

module.exports = router;
