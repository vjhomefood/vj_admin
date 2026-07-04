const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const Admin  = require('../models/Admin');
const Token  = require('../models/Token');
const User   = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');

// Helper to generate token and save it in MongoDB
const createSessionToken = async (admin) => {
  const payload = {
    id:       admin._id,
    username: admin.username,
    role:     'admin'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

  // Store token in MongoDB for security
  await Token.create({ userId: admin._id, token });

  return token;
};

// ── Admin Login ───────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Query the dedicated Admin collection
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = await createSessionToken(admin);

    res.json({
      token,
      user: {
        username: admin.username,
        role:     'admin'
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── User Login ───────────────────────────────────────────────────────────────
const userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    let user = await User.findOne({ username });
    let isDeliveryPartner = false;

    if (!user) {
      user = await DeliveryPartner.findOne({ username });
      if (user) {
        isDeliveryPartner = true;
      }
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate token
    const payload = {
      id:       user._id,
      username: user.username,
      role:     user.role || (isDeliveryPartner ? 'delivery partner' : 'user'),
      memberId: user.memberId || null,
      batchId:  user.batchId || null
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Store token in MongoDB
    await Token.create({ userId: user._id, token });

    res.json({
      token,
      user: {
        username: user.username,
        role:     payload.role,
        memberId: payload.memberId,
        batchId:  payload.batchId
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Logout (Revoke token in MongoDB) ─────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (token) {
      await Token.findOneAndDelete({ token });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Change Admin Password ─────────────────────────────────────────────────────
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Get admin from Admin collection using the ID from the JWT token
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    // Hash and update to new password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    // Revoke ALL active sessions for this admin
    await Token.deleteMany({ userId: admin._id });

    res.json({ message: 'Password updated successfully. All other active sessions have been logged out.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  adminLogin,
  logout,
  changeAdminPassword,
  userLogin
};
