const mongoose = require('mongoose');

const playerStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  highScore: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  lastPlayed: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PlayerStats', playerStatsSchema);
