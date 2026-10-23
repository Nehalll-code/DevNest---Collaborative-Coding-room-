import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { STARTER_CODE, LANGUAGE_LABELS } from "../context/mockData";
import API from "../api/axios";
import useSocket from "../hooks/useSocket";
import { createAutosave } from "../lib/autosave";
import { codeForLanguageSwitch } from "../lib/languageSwitch";
import { roleForUser } from "../lib/roomRole";
import UsersPanel from "../components/UsersPanel";
import VersionHistory from "../components/VersionHistory";
import "./Room.css";

const MONACO_LANG = { javascript: "javascript", python: "python", cpp: "cpp" };
const DEFAULT_LANGUAGE = "javascript";
const AUTOSAVE_MS = 10000;

function formatDateTime(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Room() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Everything real arrives from GET /rooms/:id below. These are only what the
  // editor shows for the moment before that request resolves.
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState(STARTER_CODE[DEFAULT_LANGUAGE]);
  const [versions, setVersions] = useState([]);
  const [output, setOutput] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const [showUsers, setShowUsers] = useState(true);
  const [liveUsers, setLiveUsers] = useState([]);
  const [roomError, setRoomError] = useState("");

  // ── Room metadata from backend ─────────────────────────
  const [roomMeta, setRoomMeta] = useState({
    name: `Room ${id}`,
    role: "Viewer",
    owner: "—",
    createdAt: "—",
    updatedAt: "—",
  });

  const { emitCodeChange, emitLanguageChange } = useSocket({
    roomId: id,
    user,
    onCodeChange: (incomingCode) => setCode(incomingCode),
    onLanguageChange: (incomingLang) => setLanguage(incomingLang),
    onUsersChange: (users) => setLiveUsers(users),
    onRoomError: (message) => setRoomError(message),
  });

  // ── Load room data, meta and versions on mount ─────────
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const roomRes = await API.get(`/rooms/${id}`);
        const r = roomRes.data.room;
        if (r.currentCode) setCode(r.currentCode);
        if (r.language) setLanguage(r.language);

        const role = roleForUser(r, user?.id);

        setRoomMeta({
          name: r.name || `Room ${id}`,
          role,
          owner:
            typeof r.owner === "object"
              ? r.owner?.name || "Unknown"
              : r.owner || "Unknown",
          createdAt: formatDateTime(r.createdAt),
          updatedAt: formatDateTime(r.updatedAt),
        });
      } catch (err) {
        console.warn("Could not load room:", err.response?.data?.message || err.message);
      }
    };

    const loadVersions = async () => {
      try {
        const vRes = await API.get(`/versions/${id}`);
        setVersions(vRes.data.versions);
      } catch (err) {
        console.warn("Could not load versions:", err.response?.data?.message || err.message);
      }
    };

    loadRoom();
    loadVersions();
  }, [id]);

  // ── Autosave on a fixed schedule ───────────────────────
  // The newest buffer is read through a ref, so typing never restarts the
  // timer. Listing `code` in the dependencies used to rebuild the interval on
  // every keystroke, which meant continuous typing never saved at all.
  const latest = useRef({ code, language });
  latest.current = { code, language };

  useEffect(
    () =>
      createAutosave({
        intervalMs: AUTOSAVE_MS,
        getPayload: () => latest.current,
        save: async ({ code: latestCode, language: latestLanguage }) => {
          try {
            await API.patch(`/rooms/${id}/code`, {
              code: latestCode,
              language: latestLanguage,
            });
            setRoomMeta((prev) => ({
              ...prev,
              updatedAt: formatDateTime(new Date().toISOString()),
            }));
          } catch (err) {
            console.warn("Autosave failed:", err.response?.data?.message || err.message);
          }
        },
      }),
    [id],
  );

  // ── Handlers ──────────────────────────────────────────
  const handleCodeChange = useCallback(
    (val) => {
      const newCode = val || "";
      setCode(newCode);
      emitCodeChange(newCode);
    },
    [emitCodeChange],
  );

  const handleLangChange = (lang) => {
    // Swapping in the starter template is only safe while nobody has written
    // anything yet — this used to wipe the room's work on every switch.
    const nextCode = codeForLanguageSwitch({
      currentCode: code,
      fromLanguage: language,
      toLanguage: lang,
      starters: STARTER_CODE,
    });

    setLanguage(lang);
    emitLanguageChange(lang);

    // If the buffer did change, the room has to hear about it too, or the
    // other clients switch language and keep the old text.
    if (nextCode !== code) {
      setCode(nextCode);
      emitCodeChange(nextCode);
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await API.post("/versions/save", { roomId: id, code });
      const v = res.data.version;
      setVersions((prev) => [
        {
          id: v._id,
          code: v.code,
          preview: v.preview,
          timestamp: new Date(v.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          savedBy: v.savedBy?.name || "You",
        },
        ...prev,
      ]);
      // Update updatedAt on manual save too
      setRoomMeta((prev) => ({
        ...prev,
        updatedAt: formatDateTime(new Date().toISOString()),
      }));

      setSaveError("");
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
    } catch (err) {
      // Deliberately no local fallback snapshot: inventing a version the
      // server never stored showed "Saved!" for something that was lost on
      // refresh.
      const message = err.response?.data?.message || err.message;
      console.warn("Save failed:", message);
      setSaveError(message);
      setTimeout(() => setSaveError(""), 4000);
    } finally {
      setIsSaving(false);
    }
  }, [code, id]);

  const handleRestore = useCallback(
    (restoredCode) => {
      setCode(restoredCode);
      emitCodeChange(restoredCode);
      setShowOutput(false);
    },
    [emitCodeChange],
  );

  const handleRun = useCallback(async () => {
    setOutput({ result: "Running…", time: "…", loading: true });
    setShowOutput(true);
    try {
      const res = await API.post("/execute", { code, language });
      setOutput({
        result: res.data.output,
        time: res.data.time,
        error: res.data.error,
        loading: false,
      });
    } catch (err) {
      setOutput({
        result: "Execution failed — check your backend.",
        time: "—",
        error: true,
        loading: false,
      });
    }
  }, [code, language]);

  return (
    <div className="room-page">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="room-nav">
        <div className="room-nav-left">
          <button
            className="btn btn-ghost btn-sm room-back"
            onClick={() => navigate("/dashboard")}
          >
            ← Back
          </button>
          <div className="room-divider-v" />
          <div className="room-brand">
            <span className="room-brand-icon">⚡</span>
            <span className="room-brand-name">CollabCode</span>
          </div>
          <div className="room-divider-v" />
          <div className="room-info">
            <span className="room-name">{roomMeta.name}</span>
            <span
              className={`badge ${
                roomMeta.role === "Owner"
                  ? "badge-owner"
                  : roomMeta.role === "Editor"
                    ? "badge-editor"
                    : "badge-viewer"
              }`}
            >
              {roomMeta.role}
            </span>
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
            title={saveError || "Save a snapshot"}
          >
            {isSaving ? (
              <>
                <span className="spinner-dark" /> Saving…
              </>
            ) : saveFlash ? (
              "✓ Saved!"
            ) : saveError ? (
              "⚠ Not saved"
            ) : (
              "💾 Save"
            )}
          </button>
          <button className="btn btn-green btn-sm" onClick={handleRun}>
            ▶ Run
          </button>
          <div className="user-chip">
            <div className="user-chip-avatar">{user?.avatar || "??"}</div>
            <span className="user-chip-name">{user?.name}</span>
          </div>
        </div>
      </nav>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="room-body">
        {/* Editor */}
        <div className="editor-area">
          <div className="editor-topbar">
            <div className="editor-file-tab">
              <span className="editor-file-dot" />
              <span className="mono editor-file-name">
                {language === "javascript"
                  ? "main.js"
                  : language === "python"
                    ? "main.py"
                    : "main.cpp"}
              </span>
            </div>
            {/* ── Room meta in topbar ── */}
            <div className="editor-topbar-meta">
              <span className="room-meta-item" title="Room ID">
                <span className="room-meta-icon">🔑</span>
                <span className="room-id-chip mono">#{id}</span>
              </span>
              <span className="room-meta-sep">·</span>
              <span className="room-meta-item" title="Created by">
                <span className="room-meta-icon">👤</span>
                <span className="room-meta-val">{roomMeta.owner}</span>
              </span>
              <span className="room-meta-sep">·</span>
              <span className="room-meta-item" title="Created at">
                <span className="room-meta-icon">🕐</span>
                <span className="room-meta-val">{roomMeta.createdAt}</span>
              </span>
              <span className="room-meta-sep">·</span>
              <span className="room-meta-item" title="Last updated">
                <span className="room-meta-icon">✏️</span>
                <span className="room-meta-val">{roomMeta.updatedAt}</span>
              </span>
            </div>
          </div>

          {roomError && (
            <div
              role="alert"
              style={{
                padding: "10px 16px",
                background: "rgba(224,92,92,0.12)",
                borderBottom: "1px solid rgba(224,92,92,0.35)",
                color: "#e05c5c",
                fontSize: 13,
              }}
            >
              ⚠ {roomError} — live sync is off for this room.
            </div>
          )}

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
                  <button
                    className="output-close"
                    onClick={() => setShowOutput(false)}
                  >
                    ✕
                  </button>
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
          <UsersPanel
            liveUsers={liveUsers}
            currentUser={user}
            roomMeta={roomMeta}
          />
        )}
        {showHistory && (
          <VersionHistory versions={versions} onRestore={handleRestore} />
        )}
      </div>
    </div>
  );
}
