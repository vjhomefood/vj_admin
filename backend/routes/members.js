const express = require('express');
const router = express.Router();
const { getMembers, getNextMemberId, createMember, updateMember, deleteMember } = require('../controllers/memberController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getMembers);
router.get('/next-id', protect, getNextMemberId);
router.post('/', protect, adminOnly, createMember);
router.put('/:id', protect, adminOnly, updateMember);
router.delete('/:id', protect, adminOnly, deleteMember);

module.exports = router;
