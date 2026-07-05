const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // never return password in queries by default
  },
  avatar: {
    type: String,
    default: null,
  },

  // ── User Preferences ────────────────────────────────────────────────────────
  preferences: {
    favoriteGenres: [{ type: Number }],      // TMDB genre IDs
    favoriteActors: [{ type: String }],
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  },

  // ── Watchlist: array of TMDB movie IDs ─────────────────────────────────────
  watchlist: [{
    movieId: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  }],

  // ── Ratings ─────────────────────────────────────────────────────────────────
  ratings: [{
    movieId: { type: Number, required: true },
    rating: { type: Number, min: 0.5, max: 5, required: true },
    ratedAt: { type: Date, default: Date.now },
  }],

}, { timestamps: true });

// ── Hash password before saving ───────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare passwords ────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: watchlist movie IDs only (flat array) ────────────────────────────
UserSchema.virtual('watchlistIds').get(function () {
  return this.watchlist.map((w) => w.movieId);
});

module.exports = mongoose.model('User', UserSchema);
