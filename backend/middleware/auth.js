const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: protect routes requiring authentication.
 * Reads JWT from Authorization header ("Bearer <token>").
 */
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (without password)
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: optionally attach user if token present (for public routes).
 * Routes can still function for unauthenticated users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (_) { /* ignore invalid token */ }
  next();
};

module.exports = { protect, optionalAuth };
