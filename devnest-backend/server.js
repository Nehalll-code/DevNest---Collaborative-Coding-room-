require("dotenv").config();

const express       = require("express");
const http          = require("http");
const { Server }    = require("socket.io");
const cors          = require("cors");
const jwt           = require("jsonwebtoken");
const connectDB     = require("./config/db");
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
  // Emitted by Room.jsx on mount
  socket.on("join-room", ({ roomId, name, avatar }) => {
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
  // Emitted on every editor keystroke
  // Broadcast to everyone EXCEPT sender (prevents echo loop)
  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", code);
  });

  // ── language-change ────────────────────────────────────
  // Sync language selector across all users in room
  socket.on("language-change", ({ roomId, language }) => {
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