// models/User.js
// ─────────────────────────────────────────────────────────
// Defines what a DevNest user looks like in MongoDB.
//
// Key decisions:
//  • password is hashed before save (pre-save hook)
//  • comparePassword() lets login routes verify input safely
//  • email is unique — duplicate registration is rejected
// ─────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
  },
  { timestamps: true }
);

// ── Pre-save hook ──────────────────────────────────────────
// Runs every time a User document is saved.
// Only hashes the password if it was actually modified
// (prevents double-hashing on profile updates).
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method ────────────────────────────────────────
// Called during login: compares plain-text input to stored hash.
UserSchema.methods.comparePassword = function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model("User", UserSchema);
