const jwt = require('jsonwebtoken');
const Token = require('../models/Token');

// ── Verify JWT and attach decoded payload to req.user ─────────────────────────
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the token exists in MongoDB
    const tokenExists = await Token.findOne({ userId: decoded.id, token });
    if (!tokenExists) {
      return res.status(401).json({ message: 'Token revoked or session expired' });
    }
    
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// ── Admin only ────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required' });
};

// ── Authenticated user (admin or regular user) ────────────────────────────────
const authenticated = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  next();
};

// ── Scope GET requests: admin sees all, user sees only their own batchId ──────
// Users must have batchId set on their JWT payload.
const ownBatchOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'user') {
    req.query.batchId = req.user.batchId;
    return next();
  }
  res.status(403).json({ message: 'Access denied' });
};

// ── Scope to own memberId (user portal bills) ─────────────────────────────────
const ownMemberOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'user') {
    req.memberId = req.user.memberId;
    return next();
  }
  res.status(403).json({ message: 'Access denied' });
};

const batchOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'batch' || req.user.role === 'user')) return next();
  res.status(403).json({ message: 'Batch access required' });
};

module.exports = { protect, adminOnly, authenticated, ownBatchOnly, ownMemberOnly, batchOnly };
