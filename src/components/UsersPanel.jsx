// components/UsersPanel.jsx
// Now accepts liveUsers from Room.jsx (real Socket.io data)
// Falls back to a single "You" entry if socket hasn't connected yet

import "./UsersPanel.css";

export default function UsersPanel({ liveUsers = [], currentUser }) {
  // If socket hasn't sent data yet, show just the current user
  const users = liveUsers.length > 0
    ? liveUsers
    : currentUser
      ? [{ userId: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }]
      : [];

  return (
    <aside className="users-panel">
      <div className="panel-header">
        <span className="panel-title">Connected</span>
        <span className="panel-badge">{users.length}</span>
      </div>

      <ul className="users-list">
        {users.map((u, i) => {
          const isYou = u.userId === currentUser?.id || u.userId === currentUser?._id;
          // Generate a consistent colour from the name
          const colors = ["#6c63ff", "#10d9a0", "#f5a623", "#e05c5c", "#4da6ff", "#ff6bcb"];
          const color  = colors[(u.name?.charCodeAt(0) || 0) % colors.length];
          const initials = u.avatar || u.name?.slice(0, 2).toUpperCase() || "??";

          return (
            <li key={u.socketId || i} className="user-item">
              <div className="user-item-avatar" style={{ background: color }}>
                {initials}
                <span
                  className="user-status-dot"
                  style={{ background: "#3ddc84" }}
                />
              </div>
              <div className="user-item-info">
                <div className="user-item-name">
                  {u.name}
                  {isYou && <span className="user-you-tag">you</span>}
                </div>
                <div className="user-item-status" style={{ color: "#3ddc84" }}>
                  Active
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="panel-divider" />

      <div className="panel-section-title">Room Info</div>
      <div className="room-info-list">
        <div className="room-info-row">
          <span className="room-info-key">Mode</span>
          <span className="room-info-val">Collaborative</span>
        </div>
        <div className="room-info-row">
          <span className="room-info-key">Autosave</span>
          <span className="room-info-val" style={{ color: "var(--green)" }}>On</span>
        </div>
        <div className="room-info-row">
          <span className="room-info-key">Socket</span>
          <span className="room-info-val" style={{ color: "#3ddc84" }}>Live</span>
        </div>
      </div>
    </aside>
  );
}