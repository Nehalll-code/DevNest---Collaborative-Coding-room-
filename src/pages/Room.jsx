import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { STARTER_CODE, LANGUAGE_LABELS, MOCK_ROOMS } from "../context/mockData";
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

  // Find room info (or create generic one)
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

  const handleLangChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang]);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400)); // Simulate save

    const version = {
      id: Date.now(),
      code,
      timestamp: formatTime(new Date()),
      preview: code.split("\n").find((l) => l.trim()) || "(empty)",
      language,
    };

    setVersions((prev) => [...prev, version]);
    setIsSaving(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }, [code, language]);

  const handleRun = useCallback(() => {
    // Mock run — shows a fake output panel
    setOutput({
      lang: language,
      result: language === "javascript"
        ? "fibonacci(10) = 55\nDoubled: [ 2, 4, 6, 8, 10 ]"
        : language === "python"
        ? "fibonacci(10) = 55\nDoubled: [2, 4, 6, 8, 10]"
        : "fibonacci(10) = 55\n2 4 6 8 10",
      time: "12ms",
    });
    setShowOutput(true);
  }, [language]);

  const handleRestore = useCallback((restoredCode) => {
    setCode(restoredCode);
    setShowOutput(false);
  }, []);

  return (
    <div className="room-page">
      {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
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
          {/* Language Selector */}
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
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowUsers((v) => !v)}
            title="Toggle users panel"
          >
            👥
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowHistory((v) => !v)}
            title="Toggle version history"
          >
            📜
          </button>
          <button
            className={`btn btn-sm ${saveFlash ? "btn-green" : "btn-surface"}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <><span className="spinner-dark" /> Saving…</>
            ) : saveFlash ? (
              "✓ Saved!"
            ) : (
              "💾 Save"
            )}
          </button>
          <button className="btn btn-green btn-sm" onClick={handleRun}>
            ▶ Run
          </button>
          <div className="user-chip">
            <div className="user-chip-avatar">{user?.avatar || "YO"}</div>
            <span className="user-chip-name">{user?.name}</span>
          </div>
        </div>
      </nav>

      {/* ── Editor Area ────────────────────────────────────────────────────── */}
      <div className="room-body">
        {/* Editor Main */}
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
              onChange={(val) => setCode(val || "")}
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

          {/* Output Panel */}
          {showOutput && output && (
            <div className="output-panel">
              <div className="output-header">
                <div className="output-title">
                  <span className="output-dot" />
                  Console Output
                </div>
                <div className="output-meta">
                  <span className="output-time">⏱ {output.time}</span>
                  <button
                    className="output-close"
                    onClick={() => setShowOutput(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <pre className="output-content">{output.result}</pre>
            </div>
          )}
        </div>

        {/* Right Panels */}
        {showUsers && <UsersPanel />}
        {showHistory && (
          <VersionHistory versions={versions} onRestore={handleRestore} />
        )}
      </div>
    </div>
  );
}