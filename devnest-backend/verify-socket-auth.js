// End-to-end check of the socket authorization gate against a real server
// and a real MongoDB. Run from devnest-backend with the server already up:
//
//   node verify-socket-auth.js
//
// It drives the actual HTTP + WebSocket surface the browser uses. Nothing is
// mocked. Exits non-zero if any expectation fails.

require("dotenv").config();

const mongoose = require("mongoose");
const { io } = require("socket.io-client");

const API = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";
const WAIT_MS = 4000;

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "  PASS" : "  FAIL"}  ${name}${detail ? `\n          ${detail}` : ""}`);
}

// ── HTTP helpers ──────────────────────────────────────────
async function request(method, path, { body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let parsed = {};
  try {
    parsed = await res.json();
  } catch {}
  return { status: res.status, body: parsed };
}

// Register, or log in if the account survives from an earlier run.
async function account(name, email, password) {
  let res = await request("POST", "/auth/register", {
    body: { name, email, password },
  });
  if (res.status === 409) {
    res = await request("POST", "/auth/login", { body: { email, password } });
  }
  if (!res.body.token) {
    throw new Error(`could not authenticate ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body; // { token, user: { id, name, email } }
}

// ── Socket helpers ────────────────────────────────────────
// Connect, emit join-room, and report whichever answer arrives first.
function connectAndJoin(token, roomId, displayName) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
    });

    let settled = false;
    const settle = (outcome) => {
      if (settled) return;
      settled = true;
      resolve({ outcome, socket });
    };

    socket.on("connect", () =>
      socket.emit("join-room", { roomId, name: displayName, avatar: "ZZ" }),
    );
    socket.on("room-users", (users) => settle({ type: "room-users", users }));
    socket.on("room-error", (p) => settle({ type: "room-error", message: p?.message }));
    socket.on("connect_error", (e) => settle({ type: "connect_error", message: e.message }));

    setTimeout(() => settle({ type: "timeout" }), WAIT_MS);
    setTimeout(() => {
      if (!settled) reject(new Error("join never settled"));
    }, WAIT_MS + 1000);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("\nSeeding accounts and a room through the real API\n");

  const alice = await account("Alice Owner", "alice.verify@devnest.test", "secret123");
  const bob = await account("Bob Other", "bob.verify@devnest.test", "secret123");

  const created = await request("POST", "/rooms/create", {
    token: alice.token,
    body: { name: "Authorization check", language: "javascript" },
  });
  const roomId = created.body.room?.roomId;
  if (!roomId) throw new Error(`room create failed: ${JSON.stringify(created)}`);
  console.log(`  room ${roomId} owned by ${alice.user.email}`);
  console.log(`  other account: ${bob.user.email}\n`);

  // Alice stays connected for the whole run and records every broadcast she
  // receives, so we can assert on both presence and absence of edits.
  const received = [];
  const aliceJoin = await connectAndJoin(alice.token, roomId, "Alice");
  const aliceSocket = aliceJoin.socket;
  aliceSocket.on("code-update", (code) => received.push(code));

  console.log("Socket authorization gate\n");

  check(
    "the room owner is allowed to join",
    aliceJoin.outcome.type === "room-users",
    `got ${aliceJoin.outcome.type}${aliceJoin.outcome.message ? `: ${aliceJoin.outcome.message}` : ""}`,
  );

  // ── A non-member must be refused ────────────────────────
  const strangerJoin = await connectAndJoin(bob.token, roomId, "Bob");
  check(
    "a non-member with a valid token is refused",
    strangerJoin.outcome.type === "room-error",
    `got ${strangerJoin.outcome.type}${strangerJoin.outcome.message ? `: ${strangerJoin.outcome.message}` : ""}`,
  );

  // ...and must not be able to broadcast anyway.
  received.length = 0;
  strangerJoin.socket.emit("code-change", { roomId, code: "INJECTED_BY_NON_MEMBER" });
  await sleep(600);
  check(
    "a refused non-member cannot broadcast code",
    !received.includes("INJECTED_BY_NON_MEMBER"),
    `owner received ${received.length} update(s): ${JSON.stringify(received)}`,
  );
  strangerJoin.socket.disconnect();

  // ── Joining properly promotes Bob to editor ─────────────
  const joined = await request("POST", "/rooms/join", {
    token: bob.token,
    body: { roomId },
  });
  check("joining over REST succeeds", joined.status === 200, `status ${joined.status}`);

  const editorJoin = await connectAndJoin(bob.token, roomId, "Bob");
  check(
    "a member is allowed to join",
    editorJoin.outcome.type === "room-users",
    `got ${editorJoin.outcome.type}${editorJoin.outcome.message ? `: ${editorJoin.outcome.message}` : ""}`,
  );

  received.length = 0;
  editorJoin.socket.emit("code-change", { roomId, code: "EDIT_FROM_EDITOR" });
  await sleep(600);
  check(
    "an editor's code reaches the other client",
    received.includes("EDIT_FROM_EDITOR"),
    `owner received ${JSON.stringify(received)}`,
  );
  editorJoin.socket.disconnect();

  // ── Demote Bob to viewer, straight in the database ──────
  await mongoose.connect(process.env.MONGO_URI);
  const Room = require("./models/Room");
  const roomDoc = await Room.findOne({ roomId });
  const bobMember = roomDoc.members.find((m) => m.user.toString() === bob.user.id);
  bobMember.role = "viewer";
  await roomDoc.save();
  console.log(`\n  demoted ${bob.user.email} to viewer\n`);

  const viewerJoin = await connectAndJoin(bob.token, roomId, "Bob");
  check(
    "a viewer may still watch the room",
    viewerJoin.outcome.type === "room-users",
    `got ${viewerJoin.outcome.type}${viewerJoin.outcome.message ? `: ${viewerJoin.outcome.message}` : ""}`,
  );

  received.length = 0;
  viewerJoin.socket.emit("code-change", { roomId, code: "EDIT_FROM_VIEWER" });
  viewerJoin.socket.emit("language-change", { roomId, language: "python" });
  await sleep(600);
  check(
    "a viewer cannot broadcast code",
    !received.includes("EDIT_FROM_VIEWER"),
    `owner received ${received.length} update(s): ${JSON.stringify(received)}`,
  );
  viewerJoin.socket.disconnect();

  // ── REST must agree with the socket layer ───────────────
  console.log("\nREST parity\n");

  const viewerPatch = await request("PATCH", `/rooms/${roomId}/code`, {
    token: bob.token,
    body: { code: "VIEWER_PATCH", language: "javascript" },
  });
  check(
    "a viewer is refused by PATCH /rooms/:id/code",
    viewerPatch.status === 403,
    `status ${viewerPatch.status}: ${viewerPatch.body.message}`,
  );

  const ownerPatch = await request("PATCH", `/rooms/${roomId}/code`, {
    token: alice.token,
    body: { code: "OWNER_AUTOSAVE_PAYLOAD", language: "javascript" },
  });
  check(
    "the owner's autosave PATCH succeeds",
    ownerPatch.status === 200,
    `status ${ownerPatch.status}`,
  );

  const reread = await request("GET", `/rooms/${roomId}`, { token: alice.token });
  check(
    "the autosaved code is actually persisted",
    reread.body.room?.currentCode === "OWNER_AUTOSAVE_PAYLOAD",
    `currentCode = ${JSON.stringify(reread.body.room?.currentCode)}`,
  );

  const strangerRead = await request("GET", `/rooms/${roomId}`, { token: bob.token });
  check(
    "a member can read the room over REST",
    strangerRead.status === 200,
    `status ${strangerRead.status}`,
  );

  aliceSocket.disconnect();
  await mongoose.disconnect();

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed\n`,
  );
  if (failed.length) {
    console.log("FAILED:");
    for (const f of failed) console.log(`  - ${f.name}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nharness error:", err.message);
  process.exit(1);
});
