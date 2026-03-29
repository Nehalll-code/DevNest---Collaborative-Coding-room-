// src/hooks/useSocket.js
// ─────────────────────────────────────────────────────────
// Custom hook that manages the Socket.io connection for a room.
//
// What it does:
//  1. Connects to the backend with the user's JWT token
//  2. Emits "join-room" so the server knows who is here
//  3. Listens for "code-update" → calls onCodeChange
//  4. Listens for "language-update" → calls onLanguageChange
//  5. Listens for "room-users" → calls onUsersChange (replaces mock users)
//  6. Disconnects cleanly when the Room page unmounts
//
// Usage in Room.jsx:
//   const { emitCodeChange, emitLanguageChange } = useSocket({
//     roomId, user,
//     onCodeChange:     (code) => setCode(code),
//     onLanguageChange: (lang) => setLanguage(lang),
//     onUsersChange:    (users) => setLiveUsers(users),
//   });
// ─────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export default function useSocket({
  roomId,
  user,
  onCodeChange,
  onLanguageChange,
  onUsersChange,
}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !user) return;

    // Connect with JWT so the server can verify who this is
    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
    });
    socketRef.current = socket;

    // Tell the server which room we're joining
    socket.emit("join-room", {
      roomId,
      name:   user.name   || "Developer",
      avatar: user.avatar || "??",
    });

    // ── Incoming events ──────────────────────────────────
    // Another user typed — update our editor
    socket.on("code-update", (code) => {
      onCodeChange?.(code);
    });

    // Another user changed language — sync our selector
    socket.on("language-update", (language) => {
      onLanguageChange?.(language);
    });

    // Server sends updated user list whenever someone joins/leaves
    socket.on("room-users", (users) => {
      onUsersChange?.(users);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    // Cleanup: disconnect when Room unmounts
    return () => {
      socket.disconnect();
    };
  }, [roomId, user?.name]);

  // ── Outgoing events ──────────────────────────────────────
  // Called by Room.jsx on editor onChange
  const emitCodeChange = (code) => {
    socketRef.current?.emit("code-change", { roomId, code });
  };

  // Called by Room.jsx when language tab is clicked
  const emitLanguageChange = (language) => {
    socketRef.current?.emit("language-change", { roomId, language });
  };

  return { emitCodeChange, emitLanguageChange };
}