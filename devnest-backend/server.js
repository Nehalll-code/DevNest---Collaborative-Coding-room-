require("dotenv").config();

const express       = require("express");
const http          = require("http");
const { Server }    = require("socket.io");
const cors          = require("cors");
const jwt           = require("jsonwebtoken");
const connectDB     = require("./config/db");
const Room          = require("./models/Room");
const { isRoomMember, roleInRoom, roleCanEdit } = require("./lib/roomAccess");
const authRoutes    = require("./routes/authRoutes");
const roomRoutes    = require("./routes/roomRoutes");
const versionRoutes = require("./routes/versionRoutes");
const executeRoutes = require("./routes/executeRoutes");

connectDB();

const app    = express();
const server = http.createServer(app);

const CORS_ORIGIN = ["http://localhost:3000", "http://localhost:5173"];

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "DevNest backend is running ✅" });
});
app.use("/api/auth",     authRoutes);
app.use("/api/rooms",    roomRoutes);
app.use("/api/versions", versionRoutes);
app.use("/api/execute",  executeRoutes);

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ message: "Internal server error" }); });

// ── Socket.io setup ────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
});

// Tracks live users per room: { roomId: [{ socketId, userId, name, avatar }] }
const roomUsers = {};

// ── Auth middleware: verify JWT before any socket event ────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 Connected: ${socket.id} (${socket.user.email})`);

  // ── join-room ──────────────────────────────────────────
  // Emitted by Room.jsx on mount.
  //
  // A valid JWT only proves who you are, not that you belong in this room, so
  // membership is checked here against the room document. The resolved role is
  // cached on the socket, which keeps the per-keystroke events below free of
  // database reads.
  socket.on("join-room", async ({ roomId, name, avatar }) => {
    let room;
    try {
      room = await Room.findOne({ roomId });
    } catch (err) {
      console.error(`join-room lookup failed (${roomId}):`, err.message);
      return socket.emit("room-error", { message: "Could not open that room" });
    }

    if (!room || !isRoomMember(room, socket.user.id)) {
      console.warn(`⛔ ${socket.user.email} denied join on room ${roomId}`);
      return socket.emit("room-error", {
        message: "You are not a member of this room",
      });
    }

    socket.data.roles = socket.data.roles || {};
    socket.data.roles[roomId] = roleInRoom(room, socket.user.id);

    socket.join(roomId);

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    // Remove stale entries for this socket (handles reconnects)
    roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
    roomUsers[roomId].push({ socketId: socket.id, userId: socket.user.id, name, avatar });

    console.log(`👥 ${name} joined room ${roomId} — ${roomUsers[roomId].length} user(s)`);

    // Send updated user list to everyone in the room
    io.to(roomId).emit("room-users", roomUsers[roomId]);
  });

  // ── code-change ────────────────────────────────────────
  // Emitted on every editor keystroke.
  // Broadcast to everyone EXCEPT sender (prevents echo loop).
  // Viewers and non-members are dropped here, matching PATCH /rooms/:id/code.
  socket.on("code-change", ({ roomId, code }) => {
    if (!roleCanEdit(socket.data.roles?.[roomId])) return;
    socket.to(roomId).emit("code-update", code);
  });

  // ── language-change ────────────────────────────────────
  // Sync language selector across all users in room
  socket.on("language-change", ({ roomId, language }) => {
    if (!roleCanEdit(socket.data.roles?.[roomId])) return;
    socket.to(roomId).emit("language-update", language);
  });

  // ── disconnect ─────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    for (const roomId in roomUsers) {
      const before = roomUsers[roomId].length;
      roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
      if (roomUsers[roomId].length !== before) {
        io.to(roomId).emit("room-users", roomUsers[roomId]);
      }
      if (roomUsers[roomId].length === 0) delete roomUsers[roomId];
    }
  });
});

// Use server.listen (not app.listen) so Socket.io shares the same port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 DevNest running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.io ready`);
});