const DailyMenu = require('../models/DailyMenu');

const getMenu = async (req, res) => {
  try {
    const menu = await DailyMenu.findOne({ date: req.params.date });
    if (!menu) return res.json(null);
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMenuRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }
    const menus = await DailyMenu.find(filter).sort({ date: 1 });
    res.json(menus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const upsertMenu = async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;
    const menu = await DailyMenu.findOneAndUpdate(
      { date },
      { date, breakfast, lunch, dinner },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(menu);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getMenu, getMenuRange, upsertMenu };
