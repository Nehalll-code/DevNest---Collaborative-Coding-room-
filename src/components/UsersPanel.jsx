import { MOCK_USERS } from "../context/mockData";
import "./UsersPanel.css";

const STATUS_LABEL = {
  typing:  { text: "Typing…",  color: "#3ddc84" },
  idle:    { text: "Idle",     color: "#ffd93d" },
  viewing: { text: "Viewing",  color: "#4da6ff" },
};

export default function UsersPanel() {
  return (
    <aside className="users-panel">
      <div className="panel-header">
        <span className="panel-title">Connected</span>
        <span className="panel-badge">{MOCK_USERS.length}</span>
      </div>

      <ul className="users-list">
        {MOCK_USERS.map((u) => {
          const s = STATUS_LABEL[u.status];
          return (
            <li key={u.id} className="user-item">
              <div className="user-item-avatar" style={{ background: u.color }}>
                {u.initials}
                <span
                  className="user-status-dot"
                  style={{ background: s.color }}
                />
              </div>
              <div className="user-item-info">
                <div className="user-item-name">
                  {u.name}
                  {u.id === 1 && <span className="user-you-tag">you</span>}
                </div>
                <div className="user-item-status" style={{ color: s.color }}>
                  {s.text}
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
          <span className="room-info-val" style={{ color: "var(--text3)" }}>Planned</span>
        </div>
      </div>
    </aside>
  );
}