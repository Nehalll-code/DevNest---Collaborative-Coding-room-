// routes/roomRoutes.js
// ─────────────────────────────────────────────────────────
// All routes require a valid JWT (protect middleware).
//
// POST /api/rooms/create       — create a new room
// POST /api/rooms/join         — join by roomId
// GET  /api/rooms/my-rooms     — list rooms for current user (Dashboard)
// GET  /api/rooms/:roomId      — get a single room's details + code
// PATCH /api/rooms/:roomId/code — update currentCode (autosave)
// ─────────────────────────────────────────────────────────

const express = require("express");
const Room    = require("../models/Room");
const protect = require("../middleware/auth");

const router = express.Router();

// All room routes are protected
router.use(protect);

// ── POST /api/rooms/create ─────────────────────────────────
// Body: { name, language? }
// Generates a random 6-char roomId. Creator is set as owner.
router.post("/create", async (req, res) => {
  try {
    const { name, language = "javascript" } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }

    // Generate short unique ID — same strategy as your Dashboard.jsx
    const roomId = Math.random().toString(36).substring(2, 8);

    const room = await Room.create({
      roomId,
      name,
      language,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "owner" }],
    });

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/rooms/join ───────────────────────────────────
// Body: { roomId }
// Adds the user as an editor if not already a member.
router.post("/join", async (req, res) => {
  try {
    const { roomId } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is already a member
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
// Returns all rooms where the current user is a member.
// Used by Dashboard to list rooms.
router.get("/my-rooms", async (req, res) => {
  try {
    const rooms = await Room.find({ "members.user": req.user.id })
      .populate("owner", "name email")   // show owner's name in UI
      .sort({ updatedAt: -1 });          // newest first

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/rooms/:roomId ─────────────────────────────────
// Returns room details + current code. Used when Room page loads.
router.get("/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("members.user", "name email");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Only members can view
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
// Body: { code, language? }
// Updates the live code state in the room document.
// Called on autosave — NOT on every keystroke.
router.patch("/:roomId/code", async (req, res) => {
  try {
    const { code, language } = req.body;

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Only editors and owners can modify code
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
