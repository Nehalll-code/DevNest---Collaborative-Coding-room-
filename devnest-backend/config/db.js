// config/db.js
// ─────────────────────────────────────────────────────────
// Connects to MongoDB using the URI from .env.
// Called once at server startup. Crashes loudly on failure
// so you are never silently running without a database.
// ─────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1); // kill the server — don't run without DB
  }
};

module.exports = connectDB;
