// Decide what the editor buffer should hold after a language switch.
//
// Loading the new starter template is only safe while the buffer is still the
// untouched starter (or empty). Once someone has written real code, switching
// language must keep it — it is shared, and the old behaviour deleted it for
// everyone in the room.

export function codeForLanguageSwitch({
  currentCode,
  fromLanguage,
  toLanguage,
  starters,
}) {
  const nextStarter = starters?.[toLanguage];
  if (nextStarter === undefined) return currentCode;

  const current = (currentCode ?? "").trim();
  const previousStarter = (starters?.[fromLanguage] ?? "").trim();

  const untouched = current === "" || current === previousStarter;
  return untouched ? nextStarter : currentCode;
}
