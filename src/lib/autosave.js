// Fixed-schedule autosave.
//
// The schedule is created once and never restarted by edits — the caller
// supplies a getter so each tick picks up the newest code. This is the whole
// point: Room.jsx used to rebuild the interval on every keystroke, so a user
// who never paused for a full interval never saved.

export function createAutosave({ intervalMs, getPayload, save }) {
  const id = setInterval(() => {
    let result;
    try {
      result = save(getPayload());
    } catch {
      return; // a throwing save must not cancel the schedule
    }
    // Swallow async failures too — the next tick will try again.
    if (result && typeof result.catch === "function") result.catch(() => {});
  }, intervalMs);

  return () => clearInterval(id);
}
