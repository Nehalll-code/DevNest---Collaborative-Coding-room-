import { versionLabel } from "../lib/versionLabel";
import "./VersionHistory.css";

export default function VersionHistory({ versions, onRestore }) {
  return (
    <aside className="version-panel">
      <div className="panel-header">
        <span className="panel-title">History</span>
        <span className="panel-badge">{versions.length}</span>
      </div>

      {versions.length === 0 ? (
        <div className="version-empty">
          <div className="version-empty-icon">📄</div>
          <div className="version-empty-text">No saves yet</div>
          <div className="version-empty-sub">
            Press <kbd>Save</kbd> to create a snapshot
          </div>
        </div>
      ) : (
        <ul className="version-list">
          {versions.map((v, i) => {
            // The list is newest-first, so index 0 is the most recent save.
            const label = versionLabel(i, versions.length);

            return (
              <li key={v.id} className="version-item">
                <div className="version-item-top">
                  <div className="version-number">
                    {label === "Latest" ? (
                      <span className="version-latest">{label}</span>
                    ) : (
                      label
                    )}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm version-restore-btn"
                    onClick={() => onRestore(v.code)}
                    title="Restore this version"
                  >
                    ↩ Restore
                  </button>
                </div>

                <div className="version-ts">{v.timestamp}</div>
                <div className="version-preview">{v.preview}</div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
