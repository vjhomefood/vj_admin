const express = require('express');
const router  = express.Router();
const { adminLogin, logout, changeAdminPassword, userLogin } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/admin/login',     adminLogin);
router.post('/login',           userLogin);
router.post('/logout',          protect, logout);
router.post('/change-password', protect, adminOnly, changeAdminPassword);

module.exports = router;
