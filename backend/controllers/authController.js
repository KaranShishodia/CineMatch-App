const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/** Generate signed JWT for a user ID */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** Send JWT in response */
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      preferences: user.preferences,
    },
  });
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'Email or username already in use.' });

    const user = await User.create({ username, email, password });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;

    // Must explicitly select password (it's hidden by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  // With JWT, logout is client-side (delete the token).
  // If using Redis blocklist, add token here.
  res.json({ message: 'Logged out successfully.' });
};
