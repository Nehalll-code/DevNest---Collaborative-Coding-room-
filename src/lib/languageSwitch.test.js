// Bug: handleLangChange in Room.jsx always replaced the buffer with
// STARTER_CODE[lang], so switching language destroyed whatever everyone in the
// room had written — and it broadcast only the language, never the new code,
// so the other clients kept the old text and diverged.
//
// Wanted behaviour: only load the new starter when the buffer is still the
// untouched starter (or empty). Real work is never discarded.

import test from "node:test";
import assert from "node:assert/strict";
import { codeForLanguageSwitch } from "./languageSwitch.js";

const STARTERS = {
  javascript: "// js starter\n",
  python: "# py starter\n",
  cpp: "// cpp starter\n",
};

test("loads the new starter when the buffer is the untouched old starter", () => {
  const result = codeForLanguageSwitch({
    currentCode: STARTERS.javascript,
    fromLanguage: "javascript",
    toLanguage: "python",
    starters: STARTERS,
  });

  assert.equal(result, STARTERS.python);
});

test("keeps the user's code when they have edited the buffer", () => {
  const written = "const important = 'do not delete me';\n";

  const result = codeForLanguageSwitch({
    currentCode: written,
    fromLanguage: "javascript",
    toLanguage: "python",
    starters: STARTERS,
  });

  assert.equal(result, written);
});

test("loads the new starter when the buffer is empty or whitespace", () => {
  for (const blank of ["", "   ", "\n\n  \n"]) {
    const result = codeForLanguageSwitch({
      currentCode: blank,
      fromLanguage: "javascript",
      toLanguage: "cpp",
      starters: STARTERS,
    });
    assert.equal(result, STARTERS.cpp);
  }
});

test("ignores trailing whitespace differences when deciding if untouched", () => {
  const result = codeForLanguageSwitch({
    currentCode: STARTERS.javascript + "\n\n  ",
    fromLanguage: "javascript",
    toLanguage: "python",
    starters: STARTERS,
  });

  assert.equal(result, STARTERS.python);
});

test("keeps the current code when the target language has no starter", () => {
  const written = "some code";

  const result = codeForLanguageSwitch({
    currentCode: written,
    fromLanguage: "javascript",
    toLanguage: "rust",
    starters: STARTERS,
  });

  assert.equal(result, written);
});
