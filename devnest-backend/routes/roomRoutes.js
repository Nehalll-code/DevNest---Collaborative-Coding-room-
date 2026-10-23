// routes/roomRoutes.js

const express = require("express");
const Room    = require("../models/Room");
const protect = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// ── POST /api/rooms/create ─────────────────────────────────
router.post("/create", async (req, res) => {
  try {
    const { name, language = "javascript" } = req.body;
    if (!name) return res.status(400).json({ message: "Room name is required" });

    const roomId = Math.random().toString(36).substring(2, 8);
    const room = await Room.create({
      roomId, name, language,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "owner" }],
    });

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/rooms/join ───────────────────────────────────
router.post("/join", async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const alreadyMember = room.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!alreadyMember) {
      room.members.push({ user: req.user.id, role: "editor" });
      await room.save();
    }

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/rooms/my-rooms ────────────────────────────────
router.get("/my-rooms", async (req, res) => {
  try {
    const rooms = await Room.find({ "members.user": req.user.id })
      .populate("owner", "name email")
      .sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/rooms/:roomId ─────────────────────────────────
// FIX: added .populate("owner", "name email") — was missing before
// which caused owner to show as raw ObjectId instead of name
router.get("/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("owner", "name email")          // ← this was missing
      .populate("members.user", "name email");  // ← this was duplicated before

    if (!room) return res.status(404).json({ message: "Room not found" });

    const isMember = room.members.some(
      (m) => m.user._id.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/rooms/:roomId/code ─────────────────────────
router.patch("/:roomId/code", async (req, res) => {
  try {
    const { code, language } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const member = room.members.find(
      (m) => m.user.toString() === req.user.id
    );
    if (!member || member.role === "viewer") {
      return res.status(403).json({ message: "Viewers cannot edit code" });
    }

    room.currentCode = code;
    if (language) room.language = language;
    await room.save();

    res.json({ message: "Code updated", currentCode: room.currentCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;