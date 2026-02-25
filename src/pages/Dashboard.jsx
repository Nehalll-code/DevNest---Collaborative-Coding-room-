import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_ROOMS, LANGUAGE_LABELS } from "../context/mockData";
import "./Dashboard.css";

const LANG_ICONS  = { javascript:"JS", python:"PY", cpp:"C+" };
const LANG_COLORS = {
  javascript:{ bg:"rgba(245,166,35,0.12)", color:"#f5a623", border:"rgba(245,166,35,0.3)", glow:"rgba(245,166,35,0.4)" },
  python:    { bg:"rgba(56,189,248,0.12)",  color:"#38bdf8", border:"rgba(56,189,248,0.3)",  glow:"rgba(56,189,248,0.4)" },
  cpp:       { bg:"rgba(16,217,160,0.12)",  color:"#10d9a0", border:"rgba(16,217,160,0.3)",  glow:"rgba(16,217,160,0.4)" },
};

const THEMES = [
  { id:"purple", label:"Purple", dot:"theme-dot-purple" },
  { id:"cyan",   label:"Cyan",   dot:"theme-dot-cyan"   },
  { id:"amber",  label:"Amber",  dot:"theme-dot-amber"  },
];

function getRoleBadge(role){ return {Owner:"badge-owner",Editor:"badge-editor",Viewer:"badge-viewer"}[role]||"badge-viewer"; }

function Counter({ value }) {
  const [n, setN] = useState(0);
  useEffect(()=>{
    let cur=0;
    const step = Math.max(1, Math.ceil(value/20));
    const id = setInterval(()=>{
      cur += step;
      if(cur >= value){ setN(value); clearInterval(id); } else setN(cur);
    }, 40);
    return ()=>clearInterval(id);
  }, [value]);
  return <span>{n}</span>;
}

function GlitchText({ text }) {
  return <span className="glitch" data-text={text}>{text}</span>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [colorTheme, setColorTheme] = useState("purple");
  const [mode, setMode] = useState("dark");
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name:"", language:"javascript" });
  const [createError, setCreateError] = useState("");
  const [search, setSearch] = useState("");
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [scanLine, setScanLine] = useState(0);
  const canvasRef = useRef(null);

  const isDark = mode === "dark";

  // Scanline
  useEffect(()=>{
    const id = setInterval(()=> setScanLine(v => (v+1)%100), 25);
    return ()=>clearInterval(id);
  },[]);

  // Grid canvas
  useEffect(()=>{
    if(!isDark) return;
    const c = canvasRef.current;
    if(!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
    ctx.clearRect(0,0,c.width,c.height);
    const colors = { purple:"rgba(108,99,255,0.07)", cyan:"rgba(0,212,200,0.07)", amber:"rgba(245,158,11,0.07)" };
    ctx.strokeStyle = colors[colorTheme];
    ctx.lineWidth = 1;
    const size = 44;
    for(let x=0;x<c.width;x+=size){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke(); }
    for(let y=0;y<c.height;y+=size){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke(); }
  },[isDark, colorTheme]);

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.language.includes(search.toLowerCase())
  );

  const handleJoin = () => {
    if(!joinInput.trim()){ setJoinError("Enter a room ID"); return; }
    navigate(`/room/${joinInput.trim()}`);
  };

  const handleCreate = () => {
    if(!newRoom.name.trim()){ setCreateError("Room name is required"); return; }
    const id = `room_${Math.random().toString(36).slice(2,8)}`;
    const created = { id, name:newRoom.name.trim(), language:newRoom.language, role:"Owner", owner:user.name, members:1, lastEdited:"Just now", description:"New workspace." };
    setRooms(prev => [created, ...prev]);
    setShowCreate(false);
    setNewRoom({ name:"", language:"javascript" });
    navigate(`/room/${id}`);
  };

  return (
    <div className={`dash-root theme-${colorTheme} mode-${mode}`}>
      {isDark && <canvas ref={canvasRef} className="dash-grid-canvas" />}
      {isDark && <div className="dash-scanline" style={{ top:`${scanLine}%` }} />}
      {isDark && <><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></>}

      {/* ── Navbar ── */}
      <nav className="dash-nav">
        <div className="nav-brand">
          <div className="nav-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span className="nav-brand-name">DevNest</span>
          <span className="nav-brand-tag">v2.0</span>
        </div>

        <div className="nav-center">
          <div className="nav-search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="nav-search-input" placeholder="Search rooms…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button className="nav-search-clear" onClick={()=>setSearch("")}>✕</button>}
          </div>
        </div>

        <div className="nav-right">
          {/* Theme color dots */}
          <div className="theme-switcher">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`theme-dot-btn ${t.dot} ${colorTheme===t.id?"active":""}`}
                title={`${t.label} theme`}
                onClick={()=>setColorTheme(t.id)}
              />
            ))}
          </div>

          <div className="theme-divider" />

          {/* Dark / Light toggle */}
          <button className="mode-toggle" onClick={()=>setMode(m=>m==="dark"?"light":"dark")}>
            {isDark
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
            {isDark ? "Light" : "Dark"}
          </button>

          <button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            New Room
          </button>

          <div className="nav-user-chip">
            <div className="nav-avatar">{user?.avatar||"??"}</div>
            <div>
              <div className="nav-user-name">{user?.name}</div>
              <div className="nav-user-status"><span className="status-dot"/>online</div>
            </div>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={logout}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Exit
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="dash-main">

        {/* Hero */}
        <div className="dash-hero anim-fade-up">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot"/>
              SYSTEM ONLINE · ALL SERVICES NOMINAL
            </div>
            <h1 className="hero-title">
              <GlitchText text={user?.name || "Developer"}/><br/>
              <span className="hero-title-sub">Command Center</span>
            </h1>
            <p className="hero-desc">Real-time collaborative coding. Multi-user. Version-controlled.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={()=>setShowCreate(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Initialize Room
              </button>
              <div className="hero-terminal">
                <span className="terminal-prompt">$</span>
                <span className="terminal-text"> devnest --connect</span>
                <span className="terminal-cursor">▍</span>
              </div>
            </div>
          </div>

          <div className="stat-grid">
            {[
              { val:rooms.length, label:"Active Rooms",  icon:"⬡" },
              { val:rooms.filter(r=>r.role==="Owner").length, label:"Owned", icon:"◈" },
              { val:rooms.reduce((a,r)=>a+r.members,0), label:"Members", icon:"◎" },
              { val:99, label:"Uptime %", icon:"▲" },
            ].map((s,i) => (
              <div className="stat-card" key={s.label} style={{animationDelay:`${i*0.08}s`}}>
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-val"><Counter value={s.val}/></div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="dash-layout">
          {/* Rooms */}
          <div>
            <div className="section-header">
              <div className="section-title-row">
                <div className="section-hex">⬡</div>
                <span className="section-title">ACTIVE ROOMS</span>
                <span className="section-badge">{filteredRooms.length}</span>
              </div>
              <div className="section-line"/>
            </div>

            <div className="rooms-list">
              {filteredRooms.length===0 ? (
                <div className="empty-state">
                  <div className="empty-ascii">[ NO ROOMS FOUND ]</div>
                  <div className="empty-sub">Initialize a new room to begin</div>
                </div>
              ) : filteredRooms.map((room,i) => {
                const lc = LANG_COLORS[room.language]||{};
                const hov = hoveredRoom===room.id;
                return (
                  <div
                    className={`room-card ${hov?"hovered":""}`}
                    key={room.id}
                    style={{animationDelay:`${i*0.07}s`}}
                    onMouseEnter={()=>setHoveredRoom(room.id)}
                    onMouseLeave={()=>setHoveredRoom(null)}
                    onClick={()=>navigate(`/room/${room.id}`)}
                  >
                    <div className="room-card-corner room-card-corner-tl"/>
                    <div className="room-card-corner room-card-corner-br"/>
                    <div className="room-lang-badge" style={{background:lc.bg,border:`1px solid ${lc.border}`,color:lc.color,boxShadow:hov?`0 0 16px ${lc.glow}`:"none"}}>
                      {LANG_ICONS[room.language]}
                    </div>
                    <div className="room-card-body">
                      <div className="room-card-top">
                        <span className="room-card-name">{room.name}</span>
                        <span className={`badge ${getRoleBadge(room.role)}`}>{room.role}</span>
                      </div>
                      <div className="room-card-meta">
                        <span className="mono room-card-id">{room.id}</span>
                        <span className="meta-sep">//</span>
                        <span>{room.members} nodes</span>
                        <span className="meta-sep">//</span>
                        <span>{room.lastEdited}</span>
                      </div>
                    </div>
                    <div className="room-card-right">
                      <button className="room-enter-btn" onClick={e=>{e.stopPropagation();navigate(`/room/${room.id}`);}}>
                        ENTER <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side */}
          <div className="dash-side">
            <div className="side-panel anim-fade-up" style={{animationDelay:"0.12s"}}>
              <div className="side-panel-header">
                <span className="side-panel-icon">⟳</span>
                <div><div className="side-panel-title">Join Session</div><div className="side-panel-sub">Connect via Room ID</div></div>
              </div>
              <div className="join-row">
                <div className="join-input-wrap">
                  <span className="join-prefix mono">#</span>
                  <input className={`join-input mono ${joinError?"error":""}`} placeholder="room_id…" value={joinInput} onChange={e=>{setJoinInput(e.target.value);setJoinError("");}} onKeyDown={e=>e.key==="Enter"&&handleJoin()}/>
                </div>
                <button className="join-btn" onClick={handleJoin}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
              {joinError && <p className="field-error">{joinError}</p>}
            </div>

            <div className="side-panel anim-fade-up" style={{animationDelay:"0.2s"}}>
              <div className="side-panel-header">
                <span className="side-panel-icon">⊕</span>
                <div><div className="side-panel-title">New Room</div><div className="side-panel-sub">Initialize workspace</div></div>
              </div>
              <button className="create-big-btn" onClick={()=>setShowCreate(true)}>
                <span className="create-big-icon">+</span>
                <span>Create Room</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft:"auto"}}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            <div className="side-panel anim-fade-up" style={{animationDelay:"0.28s"}}>
              <div className="side-panel-title" style={{marginBottom:14}}>SYSTEM STATUS</div>
              {[
                {label:"Collaboration Engine",status:"ONLINE",  color:"#10d9a0"},
                {label:"Version Control",     status:"ONLINE",  color:"#10d9a0"},
                {label:"WebSocket Sync",      status:"PLANNED", color:"#f5a623"},
                {label:"OT Algorithm",        status:"PLANNED", color:"#f5a623"},
              ].map(s=>(
                <div key={s.label} className="status-row">
                  <span className="status-row-label">{s.label}</span>
                  <span className="status-row-val" style={{color:s.color}}>
                    <span className="status-row-dot" style={{background:s.color,boxShadow:`0 0 6px ${s.color}`}}/>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="side-panel anim-fade-up" style={{animationDelay:"0.36s"}}>
              <div className="side-panel-title" style={{marginBottom:14}}>LANGUAGE MATRIX</div>
              {["javascript","python","cpp"].map(lang=>{
                const lc = LANG_COLORS[lang];
                const count = rooms.filter(r=>r.language===lang).length;
                const pct   = rooms.length?(count/rooms.length)*100:0;
                return (
                  <div key={lang} className="lang-row">
                    <span className="lang-row-name" style={{color:lc.color}}>{LANGUAGE_LABELS[lang]}</span>
                    <div className="lang-row-track"><div className="lang-row-fill" style={{width:`${pct}%`,background:lc.color,boxShadow:`0 0 8px ${lc.glow}`}}/></div>
                    <span className="lang-row-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="modal-overlay anim-fade-in" onClick={()=>setShowCreate(false)}>
          <div className="modal anim-fade-up" onClick={e=>e.stopPropagation()}>
            <div className="modal-corner modal-corner-tl"/>
            <div className="modal-corner modal-corner-br"/>
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">// INITIALIZE</div>
                <h3 className="modal-title">New Room</h3>
              </div>
              <button className="modal-close" onClick={()=>setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Room Identifier</label>
                <input className={`form-input ${createError?"is-error":""}`} placeholder="e.g. React Dashboard UI" value={newRoom.name} onChange={e=>{setNewRoom(r=>({...r,name:e.target.value}));setCreateError("");}} autoFocus/>
                {createError && <span className="form-error">{createError}</span>}
              </div>
              <div className="form-group" style={{marginTop:20}}>
                <label className="form-label">Language Protocol</label>
                <div className="lang-picker">
                  {Object.entries(LANGUAGE_LABELS).map(([key,label])=>{
                    const lc = LANG_COLORS[key];
                    const active = newRoom.language===key;
                    return (
                      <button key={key} className={`lang-pick ${active?"active":""}`}
                        style={active?{borderColor:lc.color,background:lc.bg,color:lc.color,boxShadow:`0 0 18px ${lc.glow}`}:{}}
                        onClick={()=>setNewRoom(r=>({...r,language:key}))}>
                        <span className="lang-pick-abbr">{LANG_ICONS[key]}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowCreate(false)}>Abort</button>
              <button className="btn btn-primary" onClick={handleCreate}>Initialize →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}