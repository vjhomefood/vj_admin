const Bill       = require('../models/Bill');
const DailyOrder = require('../models/DailyOrder');
const DailyMenu  = require('../models/DailyMenu');
const Member     = require('../models/Member');

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeLines(orders, menuMap) {
  const lineMap = {};

  orders.forEach(o => {
    if (!lineMap[o.date]) {
      const menu = menuMap[o.date] || {};
      
      const bfPrice = o.bfType === 'nonveg' ? (menu.breakfast?.nonVegPrice || 0) : (menu.breakfast?.price || 0);
      const lunchPrice = o.lunchType === 'nonveg' ? (menu.lunch?.nonVegPrice || 0) : (menu.lunch?.price || 0);
      const dinnerPrice = o.dinnerType === 'nonveg' ? (menu.dinner?.nonVegPrice || 0) : (menu.dinner?.price || 0);

      // Determine default addons from menu if order addons are empty
      let bfAddons = o.bfAddons || [];
      if (bfAddons.length === 0 && o.bf > 0 && menu.breakfast) {
        bfAddons = o.bfType === 'nonveg'
          ? (menu.breakfast.nonVegAddons || [])
          : (menu.breakfast.addons || []);
      }

      let lunchAddons = o.lunchAddons || [];
      if (lunchAddons.length === 0 && o.lunch > 0 && menu.lunch) {
        lunchAddons = o.lunchType === 'nonveg'
          ? (menu.lunch.nonVegAddons || [])
          : (menu.lunch.addons || []);
      }

      let dinnerAddons = o.dinnerAddons || [];
      if (dinnerAddons.length === 0 && o.dinner > 0 && menu.dinner) {
        dinnerAddons = o.dinnerType === 'nonveg'
          ? (menu.dinner.nonVegAddons || [])
          : (menu.dinner.addons || []);
      }

      lineMap[o.date] = {
        date:             o.date,
        bfQty:            o.bf || 0,
        bfMultiplier:     o.bf === 0 ? 0 : (o.bfQty || 1),
        bfType:           o.bfType || 'veg',
        bfPrice:          bfPrice,
        bfAddons:         bfAddons,
        bfTotal:          0,
        
        lunchQty:         o.lunch || 0,
        lunchMultiplier:  o.lunch === 0 ? 0 : (o.lunchQty || 1),
        lunchType:        o.lunchType || 'veg',
        lunchPrice:       lunchPrice,
        lunchAddons:      lunchAddons,
        lunchTotal:       0,
        
        dinnerQty:        o.dinner || 0,
        dinnerMultiplier: o.dinner === 0 ? 0 : (o.dinnerQty || 1),
        dinnerType:       o.dinnerType || 'veg',
        dinnerPrice:      dinnerPrice,
        dinnerAddons:     dinnerAddons,
        dinnerTotal:      0,
        
        dayTotal:         0
      };
    }
  });

  Object.values(lineMap).forEach(l => {
    const bfAddonSum = (l.bfAddons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
    const lunchAddonSum = (l.lunchAddons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
    const dinnerAddonSum = (l.dinnerAddons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);

    // Base meal cost scales by count × plates; addon cost scales by count only (1 per person)
    l.bfTotal     = l.bfQty * l.bfMultiplier * l.bfPrice     + l.bfQty * bfAddonSum;
    l.lunchTotal  = l.lunchQty * l.lunchMultiplier * l.lunchPrice   + l.lunchQty * lunchAddonSum;
    l.dinnerTotal = l.dinnerQty * l.dinnerMultiplier * l.dinnerPrice + l.dinnerQty * dinnerAddonSum;
    l.dayTotal    = l.bfTotal + l.lunchTotal + l.dinnerTotal;

  });

  return Object.values(lineMap).sort((a, b) => a.date.localeCompare(b.date));
}

function buildDateRange(month, year, startDate, endDate) {
  if (startDate && endDate) return { start: startDate, end: endDate };
  const m       = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${m}-01`,
    end:   `${year}-${m}-${String(lastDay).padStart(2, '0')}`
  };
}

// ── POST /api/bills/generate ──────────────────────────────────────────────────
const generateBills = async (req, res) => {
  try {
    const { batchId, month, year, startDate, endDate, force } = req.body;
    if (!batchId) return res.status(400).json({ message: 'batchId required' });

    const { start, end } = buildDateRange(month, year, startDate, endDate);

    const members = await Member.find({ batchId, status: 'Active' }).lean();
    if (!members.length) return res.json({ generated: 0, bills: [], message: 'No active members in batch' });

    const menus   = await DailyMenu.find({ date: { $gte: start, $lte: end } }).lean();
    const menuMap = {};
    menus.forEach(m => { menuMap[m.date] = m; });

    const results = [];

    for (const member of members) {
      const existingBill = await Bill.findOne({
        batchId,
        memberId: member.memberId,
        ...(month && year ? { month, year } : { startDate: start, endDate: end })
      });
      if (existingBill?.isManuallyEdited && !force) {
        results.push(existingBill);
        continue;
      }

      const orders = await DailyOrder.find({
        batchId,
        memberId: member.memberId,
        date: { $gte: start, $lte: end }
      }).lean();

      const lines      = computeLines(orders, menuMap);
      const grandTotal = lines.reduce((s, l) => s + l.dayTotal, 0);

      const billData = {
        batchId,
        memberId:   member.memberId,
        memberName: member.name,
        isLead:     member.isLead,
        month:      month || null,
        year:       year  || null,
        startDate:  start,
        endDate:    end,
        lines,
        grandTotal,
        updatedAt: new Date()
      };

      const bill = await Bill.findOneAndUpdate(
        {
          batchId,
          memberId: member.memberId,
          ...(month && year ? { month, year } : { startDate: start, endDate: end })
        },
        billData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(bill);
    }

    res.json({ generated: results.length, bills: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/bills ─────────────────────────────────────────────────────────────
const getBills = async (req, res) => {
  try {
    const { batchId, month, year, startDate, endDate } = req.query;
    const filter = {};
    if (batchId)   filter.batchId   = batchId;
    if (month)     filter.month     = Number(month);
    if (year)      filter.year      = Number(year);
    if (startDate) filter.startDate = startDate;
    if (endDate)   filter.endDate   = endDate;

    const bills = await Bill.find(filter).sort({ batchId: 1, isLead: -1, memberName: 1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/bills/my — returns bills for the authenticated user's memberId ───
const getMyBills = async (req, res) => {
  try {
    const memberId = req.user.memberId;
    if (!memberId) return res.status(400).json({ message: 'No memberId associated with this account' });

    const { month, year } = req.query;
    const filter = { memberId };
    if (month) filter.month = Number(month);
    if (year)  filter.year  = Number(year);

    const bills = await Bill.find(filter).sort({ year: -1, month: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/bills/:id ────────────────────────────────────────────────────────
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    // Users can only access their own bills
    if (req.user.role === 'user' && bill.memberId !== req.user.memberId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/bills/:id ────────────────────────────────────────────────────────
const updateBill = async (req, res) => {
  try {
    const { lines, paymentStatus, paidAmount, notes } = req.body;

    const update = { updatedAt: new Date(), isManuallyEdited: true };
    if (lines) {
      update.lines      = lines;
      update.grandTotal = lines.reduce((s, l) => s + (l.dayTotal || 0), 0);
    }
    if (paymentStatus !== undefined) update.paymentStatus = paymentStatus;
    if (paidAmount    !== undefined) update.paidAmount    = paidAmount;
    if (notes         !== undefined) update.notes         = notes;

    const bill = await Bill.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── PATCH /api/bills/:id/payment ──────────────────────────────────────────────
const updateBillPayment = async (req, res) => {
  try {
    const { paymentStatus, paidAmount, notes } = req.body;
    const update = { updatedAt: new Date() };
    if (paymentStatus !== undefined) update.paymentStatus = paymentStatus;
    if (paidAmount    !== undefined) update.paidAmount    = paidAmount;
    if (notes         !== undefined) update.notes         = notes;

    const bill = await Bill.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── GET /api/bills/summary ────────────────────────────────────────────────────
const getBillsSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year)  filter.year  = Number(year);

    const bills       = await Bill.find(filter);
    const totalAmount = bills.reduce((s, b) => s + b.grandTotal, 0);
    const paidAmount  = bills.reduce((s, b) => s + (b.paidAmount || 0), 0);
    const unpaidCount = bills.filter(b => b.paymentStatus !== 'Paid').length;
    const paidCount   = bills.filter(b => b.paymentStatus === 'Paid').length;

    res.json({ totalAmount, paidAmount, unpaidCount, paidCount, totalBills: bills.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  generateBills,
  getBills,
  getMyBills,
  getBillById,
  updateBill,
  updateBillPayment,
  getBillsSummary
};
