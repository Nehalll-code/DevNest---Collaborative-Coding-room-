# DevNest Backend

Node + Express + MongoDB backend for the DevNest collaborative coding platform.

## Prerequisites

- Node.js v18+
- MongoDB running locally (`mongod`) **or** a free MongoDB Atlas cluster

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET

# 3. Start development server (auto-restarts on file change)
npm run dev

# 4. Confirm it's alive
curl http://localhost:5000/api/health
```

## API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password }` | Create account → returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | Login → returns JWT |

### Rooms *(all require `Authorization: Bearer <token>`)*
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/rooms/create` | `{ name, language? }` | Create room |
| POST | `/api/rooms/join` | `{ roomId }` | Join by room ID |
| GET | `/api/rooms/my-rooms` | — | List your rooms (Dashboard) |
| GET | `/api/rooms/:roomId` | — | Room details + current code |
| PATCH | `/api/rooms/:roomId/code` | `{ code, language? }` | Autosave code |

### Versions *(all require `Authorization: Bearer <token>`)*
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/versions/save` | `{ roomId, code }` | Save snapshot |
| GET | `/api/versions/:roomId` | — | Get history list |

## Folder Structure

```
devnest-backend/
├── server.js           ← Entry point
├── .env                ← Secrets (never commit)
├── config/
│   └── db.js           ← MongoDB connection
├── models/
│   ├── User.js         ← User schema + password hashing
│   ├── Room.js         ← Room schema with member roles
│   └── Version.js      ← Code snapshot schema
├── middleware/
│   └── auth.js         ← JWT verification
└── routes/
    ├── authRoutes.js   ← Register + Login
    ├── roomRoutes.js   ← Room CRUD
    └── versionRoutes.js ← Version history
```

## Testing

### Unit tests

```bash
npm test
```

Runs on Node's built-in test runner (Node 18+), so there is nothing to
install. Covers the room access rules in `lib/roomAccess.js` — who counts as a
member, who may edit — which both the REST routes and the Socket.io layer use.

### End-to-end verification

```bash
npm run verify:e2e
```

Drives the real HTTP and WebSocket surface with real JWTs against a real
database. Nothing is mocked. It checks that:

- the room owner and members can join the socket channel
- a logged-in **non-member** who knows a room ID is refused, and cannot
  broadcast code even if they try
- a **viewer** may watch but cannot broadcast code or change the language
- the socket layer and `PATCH /rooms/:roomId/code` agree about who may edit
- autosaved code is actually persisted and readable back

Prerequisites — both must be running first:

1. MongoDB reachable at your `MONGO_URI`
2. The server itself (`npm run dev` or `npm start`) on port 5000

It creates two throwaway accounts (`alice.verify@devnest.test`,
`bob.verify@devnest.test`) and one room, and is safe to run repeatedly. Point
`MONGO_URI` at a scratch database rather than anything you care about.

> Note: a member's role is resolved once when they join the socket and cached
> on that connection, so a role change does not take effect until the client
> reconnects. This is deliberate — the alternative is a database read on every
> keystroke — and harmless today, since roles are only set at room create and
> join.

## Future Scope (Phase 2)

- Cursor presence / user awareness
- Operational Transform for conflict resolution
- Refresh token rotation
- Deployment (Railway / Render)
