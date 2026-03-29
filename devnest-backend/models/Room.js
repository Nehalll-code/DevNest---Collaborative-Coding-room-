// models/Room.js
// ─────────────────────────────────────────────────────────
// Represents a collaborative coding room.
//
// Key fields:
//  • roomId    — short ID users share to join (e.g. "abc123")
//  • owner     — User ref; the creator of the room
//  • members   — array of { user, role } — supports viewer/editor/owner
//  • currentCode — the latest state of the editor (updated on save)
//  • language  — drives the Monaco language selector
// ─────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "editor",
    },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [MemberSchema],
    currentCode: {
      type: String,
      default: "// Welcome to DevNest\n",
    },
    language: {
      type: String,
      enum: ["javascript", "python", "cpp"],
      default: "javascript",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
