const bcrypt = require('bcryptjs');
const DeliveryPartner = require('../models/DeliveryPartner');
const Batch = require('../models/Batch');
const Member = require('../models/Member');
const Delivery = require('../models/Delivery');
const DailyOrder = require('../models/DailyOrder');

// Get all delivery partners
const getDeliveryPartners = async (req, res) => {
  try {
    const partners = await DeliveryPartner.find().select('-password');
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new delivery partner user account
const createDeliveryPartner = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = await DeliveryPartner.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await DeliveryPartner.create({
      username,
      password: hashedPassword,
      role: 'delivery partner'
    });

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get delivery status of all batches for a specific date (Admin View)
const getAdminDeliveryStatus = async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
    }

    // Get all active batches
    const batches = await Batch.find({ status: 'Active' });

    // Get all delivery statuses for this date
    const deliveries = await Delivery.find({ date });
    const deliveryMap = {};
    deliveries.forEach(d => {
      deliveryMap[d.batchId] = d;
    });

    const results = await Promise.all(batches.map(async (b) => {
      // Find all active members for this batch
      const members = await Member.find({ batchId: b.batchId, status: 'Active' });

      // Find all orders for this batch on this date
      const orders = await DailyOrder.find({ date, batchId: b.batchId });
      const orderMap = {};
      orders.forEach(o => {
        orderMap[o.memberId] = o;
      });

      // Helper to determine default meal counts based on batch schedule
      const getMealDefaults = (mealSchedule) => {
        switch (mealSchedule) {
          case 'BL':  return { bf: 1, lunch: 1, dinner: 0 };
          case 'BD':  return { bf: 1, lunch: 0, dinner: 1 };
          case 'LD':  return { bf: 0, lunch: 1, dinner: 1 };
          case 'L':   return { bf: 0, lunch: 1, dinner: 0 };
          case 'BLD':
          default:    return { bf: 1, lunch: 1, dinner: 1 };
        }
      };

      let bfTotal = 0;
      let lunchTotal = 0;
      let dinnerTotal = 0;

      members.forEach(m => {
        const order = orderMap[m.memberId];
        const counts = order
          ? { bf: order.bf || 0, lunch: order.lunch || 0, dinner: order.dinner || 0 }
          : getMealDefaults(b.mealSchedule || 'BLD');

        bfTotal += counts.bf;
        lunchTotal += counts.lunch;
        dinnerTotal += counts.dinner;
      });

      const deliveryRecord = deliveryMap[b.batchId];
      
      const getStatus = (mealTotal, prefix) => {
        if (!b.deliveryPartner) return 'Unassigned';
        if (mealTotal === 0) return 'No Orders';
        return deliveryRecord ? (deliveryRecord[`${prefix}Status`] || 'Pending') : 'Pending';
      };

      const getDeliveredAt = (prefix) => {
        return deliveryRecord ? deliveryRecord[`${prefix}DeliveredAt`] : null;
      };

      return {
        batchId: b.batchId,
        batchName: b.batchName,
        phone: b.phone,
        location: b.location || '',
        deliveryPartner: b.deliveryPartner || '',
        mealSummary: {
          bf: bfTotal,
          lunch: lunchTotal,
          dinner: dinnerTotal
        },
        deliveryStatus: {
          bf: {
            status: getStatus(bfTotal, 'bf'),
            deliveredAt: getDeliveredAt('bf'),
            received: deliveryRecord ? !!deliveryRecord.bfReceived : false,
            receivedAt: deliveryRecord ? deliveryRecord.bfReceivedAt : null
          },
          lunch: {
            status: getStatus(lunchTotal, 'lunch'),
            deliveredAt: getDeliveredAt('lunch'),
            received: deliveryRecord ? !!deliveryRecord.lunchReceived : false,
            receivedAt: deliveryRecord ? deliveryRecord.lunchReceivedAt : null
          },
          dinner: {
            status: getStatus(dinnerTotal, 'dinner'),
            deliveredAt: getDeliveredAt('dinner'),
            received: deliveryRecord ? !!deliveryRecord.dinnerReceived : false,
            receivedAt: deliveryRecord ? deliveryRecord.dinnerReceivedAt : null
          }
        }
      };
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Bulk assign batches to a delivery partner
const bulkAssignBatches = async (req, res) => {
  try {
    const { deliveryPartner, batchIds } = req.body;
    if (!deliveryPartner) {
      return res.status(400).json({ message: 'Delivery partner username is required' });
    }

    // Unassign all batches currently assigned to this delivery partner
    await Batch.updateMany({ deliveryPartner }, { deliveryPartner: '' });

    // Assign the new set of batches
    if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
      await Batch.updateMany({ batchId: { $in: batchIds } }, { deliveryPartner });
    }

    res.json({ message: 'Batches allotted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/deliveries/receive  (admin marks a meal as received) ───────────
const markReceived = async (req, res) => {
  try {
    const { date, batchId, meal } = req.body; // meal: 'bf' | 'lunch' | 'dinner'
    if (!date || !batchId || !meal) {
      return res.status(400).json({ message: 'date, batchId, and meal are required' });
    }
    const validMeals = ['bf', 'lunch', 'dinner'];
    if (!validMeals.includes(meal)) {
      return res.status(400).json({ message: 'meal must be bf, lunch, or dinner' });
    }

    // Find existing delivery record
    let record = await Delivery.findOne({ date, batchId });
    if (!record) {
      return res.status(404).json({ message: 'No delivery record found for this batch/date' });
    }

    // Toggle received
    const currentVal = record[`${meal}Received`];
    record[`${meal}Received`]   = !currentVal;
    record[`${meal}ReceivedAt`] = !currentVal ? new Date() : null;
    await record.save();

    res.json({
      batchId,
      meal,
      received: record[`${meal}Received`],
      receivedAt: record[`${meal}ReceivedAt`]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getDeliveryPartners,
  createDeliveryPartner,
  getAdminDeliveryStatus,
  bulkAssignBatches,
  markReceived
};
