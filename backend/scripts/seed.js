/**
 * seed.js — Populate MongoDB with a demo user for local development.
 * Run with: node scripts/seed.js
 */

require('dotenv').config({ path: '../.env' })
const mongoose = require('mongoose')
const User = require('../models/User')

const SEED_USER = {
  username: 'demo_user',
  email: 'demo@cinematch.dev',
  password: 'demo1234',
  preferences: {
    favoriteGenres: [28, 878, 27],  // Action, Sci-Fi, Horror
    favoriteActors: ['Leonardo DiCaprio', 'Cate Blanchett'],
    theme: 'dark',
  },
  watchlist: [
    { movieId: 550 },    // Fight Club
    { movieId: 27205 },  // Inception
    { movieId: 157336 }, // Interstellar
  ],
  ratings: [
    { movieId: 550,    rating: 4.5 },
    { movieId: 27205,  rating: 5.0 },
    { movieId: 157336, rating: 4.5 },
    { movieId: 238,    rating: 5.0 },  // The Godfather
    { movieId: 680,    rating: 4.0 },  // Pulp Fiction
  ],
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinematch')
    console.log('✅ Connected to MongoDB')

    // Remove existing demo user
    await User.deleteOne({ email: SEED_USER.email })

    const user = await User.create(SEED_USER)
    console.log(`✅ Demo user created: ${user.email}`)
    console.log(`   Password: demo1234`)
    console.log(`   Watchlist: ${user.watchlist.length} movies`)
    console.log(`   Ratings: ${user.ratings.length} movies`)
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
