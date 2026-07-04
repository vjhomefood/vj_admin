const DailyOrder   = require('../models/DailyOrder');
const DailyMenu    = require('../models/DailyMenu');
const DailySummary = require('../models/DailySummary');
const Member       = require('../models/Member');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calculate income for a set of orders given a menu document.
 * For each order-meal: count × qty × (vegOrNonVegPrice) + addon totals.
 */
function calcIncome(orders, menu) {
  let income = 0;
  if (!menu) return income;

  orders.forEach(o => {
    // Breakfast
    if (o.bf > 0) {
      const bfPrice = (o.bfType === 'nonveg' ? (menu.breakfast?.nonVegPrice || 0) : (menu.breakfast?.price || 0));
      income += o.bf * (o.bfQty || 1) * bfPrice;
      
      let addons = o.bfAddons || [];
      if (addons.length === 0 && menu.breakfast) {
        addons = o.bfType === 'nonveg'
          ? (menu.breakfast.nonVegAddons || [])
          : (menu.breakfast.addons || []);
      }
      addons.forEach(a => { income += o.bf * (Number(a.price) || 0); });

    }
    // Lunch
    if (o.lunch > 0) {
      const lunchPrice = (o.lunchType === 'nonveg' ? (menu.lunch?.nonVegPrice || 0) : (menu.lunch?.price || 0));
      income += o.lunch * (o.lunchQty || 1) * lunchPrice;
      
      let addons = o.lunchAddons || [];
      if (addons.length === 0 && menu.lunch) {
        addons = o.lunchType === 'nonveg'
          ? (menu.lunch.nonVegAddons || [])
          : (menu.lunch.addons || []);
      }
      addons.forEach(a => { income += o.lunch * (Number(a.price) || 0); });

    }
    // Dinner
    if (o.dinner > 0) {
      const dinnerPrice = (o.dinnerType === 'nonveg' ? (menu.dinner?.nonVegPrice || 0) : (menu.dinner?.price || 0));
      income += o.dinner * (o.dinnerQty || 1) * dinnerPrice;
      
      let addons = o.dinnerAddons || [];
      if (addons.length === 0 && menu.dinner) {
        addons = o.dinnerType === 'nonveg'
          ? (menu.dinner.nonVegAddons || [])
          : (menu.dinner.addons || []);
      }
      addons.forEach(a => { income += o.dinner * (Number(a.price) || 0); });

    }
  });

  return income;
}

const getOrders = async (req, res) => {
  try {
    const orders = await DailyOrder.find({ date: req.params.date }).sort({ batchId: 1, memberName: 1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Bulk upsert orders for a date (saves all orders at once)
const saveOrders = async (req, res) => {
  try {
    const { date, orders, menu } = req.body;

    // Upsert all orders — strip Mongo internals (_id, __v) to avoid "Mod on _id not allowed"
    const ops = orders.map(order => {
      // Safely extract only the fields we want — never spread _id or __v
      const bfCount     = Number(order.bf)     || 0;
      const lunchCount  = Number(order.lunch)  || 0;
      const dinnerCount = Number(order.dinner) || 0;

      return {
        updateOne: {
          filter: { date, memberId: order.memberId },
          update: {
            $set: {
              date,
              batchId:    order.batchId    || '',
              memberId:   order.memberId   || '',
              memberName: order.memberName || '',
              bf:         bfCount,
              lunch:      lunchCount,
              dinner:     dinnerCount,
              bfQty:      bfCount     === 0 ? 0 : (Number(order.bfQty)     || 1),
              lunchQty:   lunchCount  === 0 ? 0 : (Number(order.lunchQty)  || 1),
              dinnerQty:  dinnerCount === 0 ? 0 : (Number(order.dinnerQty) || 1),
              bfType:       order.bfType     || 'veg',
              lunchType:    order.lunchType  || 'veg',
              dinnerType:   order.dinnerType || 'veg',
              bfAddons:     Array.isArray(order.bfAddons)     ? order.bfAddons     : [],
              lunchAddons:  Array.isArray(order.lunchAddons)  ? order.lunchAddons  : [],
              dinnerAddons: Array.isArray(order.dinnerAddons) ? order.dinnerAddons : []
            }
          },
          upsert: true
        }
      };
    });
    if (ops.length > 0) await DailyOrder.bulkWrite(ops);

    // Save menu if provided (including non-veg fields)
    if (menu) {
      const menuDoc = {
        date,
        breakfast: {
          name:          menu.breakfast?.name          || '',
          price:         menu.breakfast?.price         || 0,
          nonVegEnabled: menu.breakfast?.nonVegEnabled || false,
          nonVegName:    menu.breakfast?.nonVegName    || '',
          nonVegPrice:   menu.breakfast?.nonVegPrice   || 0,
          addons:        Array.isArray(menu.breakfast?.addons) ? menu.breakfast.addons : [],
          nonVegAddons:  Array.isArray(menu.breakfast?.nonVegAddons) ? menu.breakfast.nonVegAddons : []
        },
        lunch: {
          name:          menu.lunch?.name          || '',
          price:         menu.lunch?.price         || 0,
          nonVegEnabled: menu.lunch?.nonVegEnabled || false,
          nonVegName:    menu.lunch?.nonVegName    || '',
          nonVegPrice:   menu.lunch?.nonVegPrice   || 0,
          addons:        Array.isArray(menu.lunch?.addons) ? menu.lunch.addons : [],
          nonVegAddons:  Array.isArray(menu.lunch?.nonVegAddons) ? menu.lunch.nonVegAddons : []
        },
        dinner: {
          name:          menu.dinner?.name          || '',
          price:         menu.dinner?.price         || 0,
          nonVegEnabled: menu.dinner?.nonVegEnabled || false,
          nonVegName:    menu.dinner?.nonVegName    || '',
          nonVegPrice:   menu.dinner?.nonVegPrice   || 0,
          addons:        Array.isArray(menu.dinner?.addons) ? menu.dinner.addons : [],
          nonVegAddons:  Array.isArray(menu.dinner?.nonVegAddons) ? menu.dinner.nonVegAddons : []
        }
      };
      await DailyMenu.findOneAndUpdate({ date }, menuDoc, { upsert: true, new: true });
    }

    // Recalculate summary
    const allOrders  = await DailyOrder.find({ date });
    const savedMenu  = await DailyMenu.findOne({ date });
    const bfTotal    = allOrders.reduce((s, o) => s + (o.bf    || 0), 0);
    const lunchTotal = allOrders.reduce((s, o) => s + (o.lunch || 0), 0);
    const dinnerTotal= allOrders.reduce((s, o) => s + (o.dinner|| 0), 0);
    const income     = calcIncome(allOrders, savedMenu);

    await DailySummary.findOneAndUpdate(
      { date },
      { date, bfTotal, lunchTotal, dinnerTotal, income },
      { upsert: true, new: true }
    );

    res.json({ message: 'Orders saved successfully', bfTotal, lunchTotal, dinnerTotal, income });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await DailyOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Returns default bf/lunch/dinner values for a given meal schedule code.
 */
function getMealDefaults(mealSchedule) {
  switch (mealSchedule) {
    case 'BL':  return { bf: 1, lunch: 1, dinner: 0 };
    case 'BD':  return { bf: 1, lunch: 0, dinner: 1 };
    case 'LD':  return { bf: 0, lunch: 1, dinner: 1 };
    case 'L':   return { bf: 0, lunch: 1, dinner: 0 };
    case 'BLD':
    default:    return { bf: 1, lunch: 1, dinner: 1 };
  }
}

// Initialize orders for a date from active members (uses each batch's mealSchedule)
const initOrders = async (req, res) => {
  try {
    const { date } = req.params;
    const Batch   = require('../models/Batch');
    const Holiday = require('../models/Holiday');

    // Check if it is a holiday
    const isHoliday = await Holiday.findOne({ date });

    // Load all active members, batches, and daily menu to check for non-veg defaults
    const [members, batches, dailyMenu] = await Promise.all([
      Member.find({ status: 'Active' }),
      Batch.find({}, { batchId: 1, mealSchedule: 1 }),
      DailyMenu.findOne({ date })
    ]);

    const scheduleMap = {};
    batches.forEach(b => { scheduleMap[b.batchId] = b.mealSchedule || 'BLD'; });

    const defaultBfType = dailyMenu?.breakfast?.nonVegEnabled ? 'nonveg' : 'veg';
    const defaultLunchType = dailyMenu?.lunch?.nonVegEnabled ? 'nonveg' : 'veg';
    const defaultDinnerType = dailyMenu?.dinner?.nonVegEnabled ? 'nonveg' : 'veg';

    const ops = members.map(m => {
      const { bf, lunch, dinner } = isHoliday
        ? { bf: 0, lunch: 0, dinner: 0 }
        : getMealDefaults(scheduleMap[m.batchId]);

      return {
        updateOne: {
          filter: { date, memberId: m.memberId },
          update: {
            $setOnInsert: {
              date,
              batchId:    m.batchId,
              memberId:   m.memberId,
              memberName: m.name,
              bf, lunch, dinner,
              bfQty: 1, lunchQty: 1, dinnerQty: 1,
              bfType: defaultBfType, lunchType: defaultLunchType, dinnerType: defaultDinnerType,
              bfAddons: [], lunchAddons: [], dinnerAddons: []
            }
          },
          upsert: true
        }
      };
    });

    if (ops.length > 0) await DailyOrder.bulkWrite(ops);
    const orders = await DailyOrder.find({ date }).sort({ batchId: 1, memberName: 1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Export: all orders in a date range or exact date, optionally filtered by batchId
const getOrdersRange = async (req, res) => {
  try {
    const { startDate, endDate, batchId, date } = req.query;
    const filter = {};
    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }
    if (batchId) filter.batchId = batchId;

    const orders = await DailyOrder.find(filter).sort({ date: 1, batchId: 1, memberName: 1 });

    // Collect unique dates so we can attach menu prices
    const uniqueDates = [...new Set(orders.map(o => o.date))];
    const menus       = await DailyMenu.find({ date: { $in: uniqueDates } });
    const menuMap     = {};
    menus.forEach(m => { menuMap[m.date] = m; });

    // Enrich orders with menu info (includes new nonVeg fields)
    const enriched = orders.map(o => {
      const menu = menuMap[o.date] || {};
      return {
        date:         o.date,
        batchId:      o.batchId,
        memberId:     o.memberId,
        memberName:   o.memberName,
        bf:           o.bf,
        lunch:        o.lunch,
        dinner:       o.dinner,
        bfQty:        o.bf === 0 ? 0 : (o.bfQty || 1),
        lunchQty:     o.lunch === 0 ? 0 : (o.lunchQty || 1),
        dinnerQty:    o.dinner === 0 ? 0 : (o.dinnerQty || 1),
        bfType:       o.bfType     || 'veg',
        lunchType:    o.lunchType  || 'veg',
        dinnerType:   o.dinnerType || 'veg',
        bfAddons:     o.bfAddons     || [],
        lunchAddons:  o.lunchAddons  || [],
        dinnerAddons: o.dinnerAddons || [],
        // Veg prices
        bfPrice:      menu.breakfast?.price    || 0,
        lunchPrice:   menu.lunch?.price        || 0,
        dinnerPrice:  menu.dinner?.price       || 0,
        // Non-veg prices
        bfNonVegEnabled:   menu.breakfast?.nonVegEnabled || false,
        bfNonVegName:      menu.breakfast?.nonVegName    || '',
        bfNonVegPrice:     menu.breakfast?.nonVegPrice   || 0,
        lunchNonVegEnabled:menu.lunch?.nonVegEnabled     || false,
        lunchNonVegName:   menu.lunch?.nonVegName        || '',
        lunchNonVegPrice:  menu.lunch?.nonVegPrice       || 0,
        dinnerNonVegEnabled:menu.dinner?.nonVegEnabled   || false,
        dinnerNonVegName:   menu.dinner?.nonVegName      || '',
        dinnerNonVegPrice:  menu.dinner?.nonVegPrice     || 0,
        // Menu names
        bfMenu:      menu.breakfast?.name || '',
        lunchMenu:   menu.lunch?.name     || '',
        dinnerMenu:  menu.dinner?.name    || '',
        // Menu addons
        bfMenuAddons:      menu.breakfast?.addons   || [],
        bfMenuNonVegAddons: menu.breakfast?.nonVegAddons || [],
        lunchMenuAddons:   menu.lunch?.addons       || [],
        lunchMenuNonVegAddons: menu.lunch?.nonVegAddons || [],
        dinnerMenuAddons:  menu.dinner?.addons      || [],
        dinnerMenuNonVegAddons: menu.dinner?.nonVegAddons || []
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if a date is a holiday
const checkHoliday = async (req, res) => {
  try {
    const { date } = req.params;
    const Holiday  = require('../models/Holiday');
    const holiday  = await Holiday.findOne({ date });
    res.json({ isHoliday: !!holiday });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle holiday status for a date
const toggleHoliday = async (req, res) => {
  try {
    const { date, isHoliday } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const Holiday = require('../models/Holiday');

    if (isHoliday) {
      await Holiday.findOneAndUpdate({ date }, { date }, { upsert: true, new: true });
      await DailyOrder.updateMany({ date }, { bf: 0, lunch: 0, dinner: 0 });

      await DailySummary.findOneAndUpdate(
        { date },
        { date, bfTotal: 0, lunchTotal: 0, dinnerTotal: 0, income: 0 },
        { upsert: true, new: true }
      );

      return res.json({ message: 'Holiday marked successfully. Orders set to 0.', isHoliday: true });
    } else {
      await Holiday.findOneAndDelete({ date });

      const Batch = require('../models/Batch');
      const [members, batches] = await Promise.all([
        Member.find({ status: 'Active' }),
        Batch.find({}, { batchId: 1, mealSchedule: 1 })
      ]);

      const scheduleMap = {};
      batches.forEach(b => { scheduleMap[b.batchId] = b.mealSchedule || 'BLD'; });

      const ops = members.map(m => {
        const { bf, lunch, dinner } = getMealDefaults(scheduleMap[m.batchId]);
        return {
          updateOne: {
            filter: { date, memberId: m.memberId },
            update: {
              $set: { batchId: m.batchId, memberName: m.name, bf, lunch, dinner }
            },
            upsert: true
          }
        };
      });

      if (ops.length > 0) await DailyOrder.bulkWrite(ops);

      const allOrders  = await DailyOrder.find({ date });
      const savedMenu  = await DailyMenu.findOne({ date });
      const bfTotal    = allOrders.reduce((s, o) => s + (o.bf    || 0), 0);
      const lunchTotal = allOrders.reduce((s, o) => s + (o.lunch || 0), 0);
      const dinnerTotal= allOrders.reduce((s, o) => s + (o.dinner|| 0), 0);
      const income     = calcIncome(allOrders, savedMenu);

      await DailySummary.findOneAndUpdate(
        { date },
        { date, bfTotal, lunchTotal, dinnerTotal, income },
        { upsert: true, new: true }
      );

      return res.json({ message: 'Holiday removed. Orders re-initialized.', isHoliday: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOrders, saveOrders, updateOrder, initOrders, getOrdersRange, checkHoliday, toggleHoliday };
