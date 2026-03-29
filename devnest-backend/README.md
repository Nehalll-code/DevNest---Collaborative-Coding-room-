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

## Future Scope (Phase 2)

- Socket.io for real-time code sync
- Cursor presence / user awareness
- Operational Transform for conflict resolution
- Refresh token rotation
- Deployment (Railway / Render)
