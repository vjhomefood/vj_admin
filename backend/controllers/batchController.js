const Batch  = require('../models/Batch');
const Member = require('../models/Member');
const User   = require('../models/User');
const bcrypt = require('bcryptjs');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate next sequential memberId across ALL members (global M001, M002…) */
async function nextMemberId() {
  const last = await Member.findOne().sort({ createdAt: -1, memberId: -1 });
  if (!last || !last.memberId) return 'M001';
  const m = last.memberId.match(/^M(\d+)$/);
  if (!m) return 'M001';
  return 'M' + String(parseInt(m[1], 10) + 1).padStart(3, '0');
}

// ── GET /api/batches ──────────────────────────────────────────────────────────
const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .select('-password')
      .sort({ batchId: 1 });

    const enriched = await Promise.all(batches.map(async (b) => {
      const members = await Member.find({ batchId: b.batchId, status: 'Active' });
      const lead    = members.find(m => m.isLead);
      return {
        ...b.toObject(),
        memberCount: members.length,
        leadName:  lead ? lead.name  : b.batchName,
        leadPhone: lead ? lead.phone : b.phone
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/batches/:batchId/detail ─────────────────────────────────────────
const getBatchDetail = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId }).select('-password');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    const members = await Member.find({ batchId: req.params.batchId }).sort({ isLead: -1, createdAt: 1 });
    res.json({ batch, members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/batches ─────────────────────────────────────────────────────────
const createBatch = async (req, res) => {
  try {
    const { batchId, batchName, phone, mealSchedule, password, extraMembers = [] } = req.body;

    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create batch
    const batch = await Batch.create({ 
      batchId, 
      batchName, 
      phone, 
      mealSchedule: mealSchedule || 'BF',
      password: hashedPassword
    });

    // Auto-create lead member (name only, no phone required)
    const leadId = await nextMemberId();
    const cleanName = batchName.replace(/\s+batch\s*$/i, '').trim();
    await Member.create({
      memberId: leadId,
      batchId,
      name:   cleanName,
      isLead: true,
      status: 'Active'
    });

    // Auto-create extra members (name only)
    for (const em of extraMembers) {
      if (!em.name || !em.name.trim()) continue;
      const mId = await nextMemberId();
      await Member.create({
        memberId: mId,
        batchId,
        name:   em.name.trim(),
        isLead: false,
        status: 'Active'
      });
    }

    // Upsert a User login account for this batch (username = batchId, role = 'batch')
    // so that batch members can log in using the batch password.
    if (hashedPassword) {
      await User.findOneAndUpdate(
        { username: batchId },
        { username: batchId, password: hashedPassword, role: 'batch', batchId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.status(201).json({ ...batch.toObject(), password: undefined });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── PUT /api/batches/:id ──────────────────────────────────────────────────────
const updateBatch = async (req, res) => {
  try {
    const { phone, password, ...rest } = req.body;
    const update = { ...rest };
    if (phone !== undefined) update.phone = phone;

    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }

    const updated = await Batch.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    ).select('-password');
    if (!updated) return res.status(404).json({ message: 'Batch not found' });

    // Sync phone to the lead member
    if (phone !== undefined) {
      await Member.findOneAndUpdate(
        { batchId: updated.batchId, isLead: true },
        { phone }
      );
    }

    // Sync new password to the matching User login account
    if (password) {
      await User.findOneAndUpdate(
        { username: updated.batchId },
        { password: update.password, role: 'batch', batchId: updated.batchId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── PATCH /api/batches/:batchId/payment ──────────────────────────────────────
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const batch = await Batch.findOneAndUpdate(
      { batchId: req.params.batchId },
      { paymentStatus },
      { new: true }
    ).select('-password');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── DELETE /api/batches/:id ───────────────────────────────────────────────────
const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBatches,
  getBatchDetail,
  createBatch,
  updateBatch,
  updatePaymentStatus,
  deleteBatch
};
