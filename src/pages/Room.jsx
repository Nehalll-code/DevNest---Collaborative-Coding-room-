import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { STARTER_CODE, LANGUAGE_LABELS, MOCK_ROOMS } from "../context/mockData";
import API from "../api/axios";
import useSocket from "../hooks/useSocket";
import UsersPanel from "../components/UsersPanel";
import VersionHistory from "../components/VersionHistory";
import "./Room.css";

const MONACO_LANG = { javascript: "javascript", python: "python", cpp: "cpp" };

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Room() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const roomInfo = MOCK_ROOMS.find((r) => r.id === id) || {
    name: `Room ${id}`,
    language: "javascript",
    role: "Owner",
  };

  const [language, setLanguage]       = useState(roomInfo.language);
  const [code, setCode]               = useState(STARTER_CODE[roomInfo.language]);
  const [versions, setVersions]       = useState([]);
  const [output, setOutput]           = useState(null);
  const [showOutput, setShowOutput]   = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [saveFlash, setSaveFlash]     = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showUsers, setShowUsers]     = useState(true);
  const [liveUsers, setLiveUsers]     = useState([]);

  const { emitCodeChange, emitLanguageChange } = useSocket({
    roomId: id,
    user,
    onCodeChange:     (incomingCode) => setCode(incomingCode),
    onLanguageChange: (incomingLang) => setLanguage(incomingLang),
    onUsersChange:    (users)        => setLiveUsers(users),
  });

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const roomRes = await API.get(`/rooms/${id}`);
        const r = roomRes.data.room;
        if (r.currentCode) setCode(r.currentCode);
        if (r.language)    setLanguage(r.language);
      } catch (err) {}
    };
    const loadVersions = async () => {
      try {
        const vRes = await API.get(`/versions/${id}`);
        setVersions(vRes.data.versions);
      } catch (err) {}
    };
    loadRoom();
    loadVersions();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await API.patch(`/rooms/${id}/code`, { code, language });
      } catch (err) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [code, language, id]);

  const handleCodeChange = useCallback((val) => {
    const newCode = val || "";
    setCode(newCode);
    emitCodeChange(newCode);
  }, [emitCodeChange]);

  const handleLangChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang]);
    emitLanguageChange(lang);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await API.post("/versions/save", { roomId: id, code });
      const v = res.data.version;
      setVersions((prev) => [{
        id:        v._id,
        code:      v.code,
        preview:   v.preview,
        timestamp: new Date(v.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" }),
        savedBy:   v.savedBy?.name || "You",
      }, ...prev]);
    } catch (err) {
      const version = {
        id:        Date.now(),
        code,
        timestamp: formatTime(new Date()),
        preview:   code.split("\n").find((l) => l.trim()) || "(empty)",
        language,
      };
      setVersions((prev) => [...prev, version]);
    } finally {
      setIsSaving(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
    }
  }, [code, language, id]);

  const handleRestore = useCallback((restoredCode) => {
    setCode(restoredCode);
    emitCodeChange(restoredCode);
    setShowOutput(false);
  }, [emitCodeChange]);

  const handleRun = useCallback(async () => {
    setOutput({ result: "Running…", time: "…", loading: true });
    setShowOutput(true);
    try {
      const res = await API.post("/execute", { code, language });
      setOutput({
        result:  res.data.output,
        time:    res.data.time,
        error:   res.data.error,
        loading: false,
      });
    } catch (err) {
      setOutput({
        result:  "Execution failed — check your backend.",
        time:    "—",
        error:   true,
        loading: false,
      });
    }
  }, [code, language]);

  return (
    <div className="room-page">
      <nav className="room-nav">
        <div className="room-nav-left">
          <button className="btn btn-ghost btn-sm room-back" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <div className="room-divider-v" />
          <div className="room-brand">
            <span className="room-brand-icon">⚡</span>
            <span className="room-brand-name">CollabCode</span>
          </div>
          <div className="room-divider-v" />
          <div className="room-info">
            <span className="room-name">{roomInfo.name}</span>
            <span className={`badge ${
              roomInfo.role === "Owner" ? "badge-owner" :
              roomInfo.role === "Editor" ? "badge-editor" : "badge-viewer"
            }`}>{roomInfo.role}</span>
          </div>
        </div>

        <div className="room-nav-center">
          <div className="lang-select-group">
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`lang-tab ${language === key ? "active" : ""}`}
                onClick={() => handleLangChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="room-nav-right">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowUsers((v) => !v)} title="Toggle users panel">👥</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory((v) => !v)} title="Toggle version history">📜</button>
          <button
            className={`btn btn-sm ${saveFlash ? "btn-green" : "btn-surface"}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <><span className="spinner-dark" /> Saving…</> : saveFlash ? "✓ Saved!" : "💾 Save"}
          </button>
          <button className="btn btn-green btn-sm" onClick={handleRun}>▶ Run</button>
          <div className="user-chip">
            <div className="user-chip-avatar">{user?.avatar || "??"}</div>
            <span className="user-chip-name">{user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="room-body">
        <div className="editor-area">
          <div className="editor-topbar">
            <div className="editor-file-tab">
              <span className="editor-file-dot" />
              <span className="mono editor-file-name">
                {language === "javascript" ? "main.js" : language === "python" ? "main.py" : "main.cpp"}
              </span>
            </div>
            <div className="editor-topbar-right">
              <span className="room-id-chip mono">#{id}</span>
            </div>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 16 },
                renderLineHighlight: "gutter",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
              }}
            />
          </div>

          {showOutput && output && (
            <div className="output-panel">
              <div className="output-header">
                <div className="output-title">
                  <span className="output-dot" />
                  Console Output
                </div>
                <div className="output-meta">
                  <span className="output-time">⏱ {output.time}</span>
                  <button className="output-close" onClick={() => setShowOutput(false)}>✕</button>
                </div>
              </div>
              <pre
                className="output-content"
                style={{ color: output.error ? "#e05c5c" : "var(--green)" }}
              >
                {output.result}
              </pre>
            </div>
          )}
        </div>

        {showUsers && (
          <UsersPanel liveUsers={liveUsers} currentUser={user} />
        )}
        {showHistory && (
          <VersionHistory versions={versions} onRestore={handleRestore} />
        )}
      </div>
    </div>
  );
}