require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');

const compression = require('compression');

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/batches',    require('./routes/batches'));
app.use('/api/members',    require('./routes/members'));
app.use('/api/menu',       require('./routes/menu'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/summary',    require('./routes/summary'));
app.use('/api/bills',      require('./routes/bills'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/deliveries',    require('./routes/deliveries'));
app.use('/api/food-requests', require('./routes/foodRequests'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', message: 'VJ Home Foods API Running' })
);

// ── Start server ──────────────────────────────────────────────────────────────
// parseInt ensures PORT is always a number (guards against "PORT=5002" style env values)
const PORT = parseInt(process.env.PORT, 10) || 5001;

// Bind to 0.0.0.0 so Render's port scanner can detect the open port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
