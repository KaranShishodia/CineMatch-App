/**
 * CineMatch Backend Server
 * Entry point — sets up Express, connects to MongoDB, mounts routes.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes            = require('./routes/auth');
const movieRoutes           = require('./routes/movies');
const userRoutes            = require('./routes/user');
const recommendationRoutes  = require('./routes/recommendations');
const chatbotRoutes         = require('./routes/chatbot');

const app = express();

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting (100 req / 15 min per IP) ───────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Body parsing & logging ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/movies',          movieRoutes);
app.use('/api/user',            userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chatbot',         chatbotRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CineMatch API running on port ${PORT}`));
