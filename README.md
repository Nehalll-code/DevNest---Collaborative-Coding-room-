# ⚡ DevNest — Real-Time Collaborative Coding Platform

> A full-stack, multi-user coding environment with live synchronization, persistent state, and sandboxed code execution.

---

## 🧠 Overview

DevNest is a distributed collaborative coding system where multiple users can join a shared workspace and edit code simultaneously.

The system combines:

* **Real-time state synchronization (Socket.io)**
* **Persistent storage (MongoDB)**
* **Secure authentication (JWT)**
* **Remote code execution (Judge0 API)**

This is not a CRUD app — it is a **multi-layered system handling concurrent user interaction, state consistency, and execution workflows**.

---

## 🚀 Live Capabilities

### 🔐 Authentication & Access Control

* JWT-based authentication
* Protected routes (frontend + backend)
* Role-based access (Owner / Editor / Viewer)

---

### 🏠 Room-Based Collaboration

* Create and join private coding rooms
* Unique `roomId` system
* Member tracking with roles

---

### ⚡ Real-Time Code Synchronization

```text
User A types →
emit("code-change") →
Server broadcasts →
All connected clients update instantly
```

* Room-scoped WebSocket channels
* Bidirectional communication using Socket.io
* Live updates across multiple clients

---

### 👥 Live User Presence

* Real connected users (no mock data)
* Multiple sessions per user handled independently
* Dynamic join/leave updates

---

### 💾 Persistent State (Autosave + Recovery)

* Periodic autosave to MongoDB
* Late joiners load latest code state
* State survives server restarts

---

### 🧠 Version History System

* Snapshot-based versioning
* Timestamped history
* Restore previous code states

---

### ▶️ Real Code Execution (Judge0)

```text
Frontend → Backend → Judge0 API → Backend → Frontend
```

* Supports multiple languages (JS, Python, C++)
* Secure sandbox execution (no local execution risk)
* Displays real stdout/stderr output

---

## 🏗️ System Architecture

```text
┌────────────────────┐
│   React Frontend   │
│ (Monaco Editor UI) │
└─────────┬──────────┘
          │ REST (HTTP)
          ▼
┌────────────────────┐
│   Express Server   │
│  (API + Auth)      │
└─────────┬──────────┘
          │
          ├───────────────┐
          ▼               ▼
┌───────────────┐   ┌────────────────┐
│   MongoDB     │   │  Socket.io     │
│ (Persistence) │   │ (Real-Time)    │
└───────────────┘   └────────────────┘
          │
          ▼
┌────────────────────┐
│    Judge0 API      │
│ (Code Execution)   │
└────────────────────┘
```

---

## 📂 Project Structure

```text
DevNest/
│
├── src/                     # Frontend (React + Vite)
│   ├── api/                # Axios configuration
│   ├── context/            # Auth state management
│   ├── pages/              # Login, Dashboard, Room
│   ├── components/         # UsersPanel, VersionHistory
│   └── hooks/              # Socket logic
│
└── devnest-backend/
    ├── server.js           # Entry point + Socket.io
    ├── config/             # DB connection
    ├── models/             # User, Room, Version
    ├── routes/             # Auth, Rooms, Versions, Execute
    └── middleware/         # JWT auth
```

---

## 🔌 API Overview

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Rooms

* `POST /api/rooms/create`
* `POST /api/rooms/join`
* `GET /api/rooms/my-rooms`
* `PATCH /api/rooms/:id/code`

### Versions

* `POST /api/versions/save`
* `GET /api/versions/:roomId`

### Execution

* `POST /api/execute`

---

## 🔄 Real-Time Event Flow

### Client → Server

```text
join-room
code-change
cursor-move (optional)
```

### Server → Client

```text
code-update
user-joined
user-left
```

---

## ⚙️ Setup Instructions

### 1️⃣ Backend

```bash
cd devnest-backend
npm install
copy .env.example .env
npm run dev
```

---

### 2️⃣ Frontend

```bash
npm install
npm run dev
```

---

### 🌍 Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/devnest
JWT_SECRET=your_secret_key
```

---

## 🧪 How to Verify Functionality

1. Register & login
2. Create a room
3. Open same room in two tabs
4. Type → verify real-time sync
5. Save version → check history
6. Run code → verify actual output

---

## ⚠️ Known Limitations

* Uses **last-write-wins** (no OT/CRDT)
* No distributed scaling (single server instance)
* Execution depends on external Judge0 service
* No rate limiting or advanced security layers

---

## 🔮 Future Improvements

* CRDT / Operational Transform for conflict resolution
* Redis adapter for horizontal scaling (Socket.io)
* Cursor presence visualization
* Docker-based execution environment
* Deployment (Docker + Cloud)

---

## 🧠 Key Engineering Takeaways

* Separation of **real-time vs persistence layers**
* Handling **multi-client synchronization**
* Secure execution of arbitrary user code
* Designing scalable backend architecture

---

## 👨‍💻 Author

Nehal Verma
B.Tech CCE — Full Stack & Systems Engineering

---

## 📄 License

For academic and educational use.
