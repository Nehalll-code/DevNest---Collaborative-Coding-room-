// Bug: VersionHistory.jsx rendered `versions.length - i === 1 ? "Latest" : ...`
// over a newest-first list, so the badge landed on the LAST item — the oldest
// snapshot — and the numbering ran backwards.

import test from "node:test";
import assert from "node:assert/strict";
import { versionLabel } from "./versionLabel.js";

test("labels the newest snapshot Latest", () => {
  assert.equal(versionLabel(0, 3), "Latest");
});

test("numbers older snapshots newest-first", () => {
  assert.equal(versionLabel(1, 3), "v2");
  assert.equal(versionLabel(2, 3), "v1");
});

test("labels the only snapshot Latest", () => {
  assert.equal(versionLabel(0, 1), "Latest");
});

test("never labels an older snapshot Latest", () => {
  const total = 5;
  const labels = Array.from({ length: total }, (_, i) => versionLabel(i, total));

  assert.deepEqual(labels, ["Latest", "v4", "v3", "v2", "v1"]);
});
