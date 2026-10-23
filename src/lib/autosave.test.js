// Bug: the autosave effect in Room.jsx listed `code` in its dependency array,
// so every keystroke tore down and restarted the 10s interval. A user typing
// continuously never autosaved at all. These tests pin the behaviour we want:
// the schedule is fixed, and each tick saves whatever the latest code is.

import test from "node:test";
import assert from "node:assert/strict";
import { createAutosave } from "./autosave.js";

test("saves the latest payload once per interval", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });

  const saved = [];
  let payload = "initial";
  const stop = createAutosave({
    intervalMs: 10000,
    getPayload: () => payload,
    save: (p) => saved.push(p),
  });

  // Simulate continuous typing inside one interval — this is what used to
  // reset the timer forever.
  for (let i = 0; i < 50; i++) payload = `edit-${i}`;

  t.mock.timers.tick(10000);

  assert.deepEqual(saved, ["edit-49"]);
  stop();
});

test("keeps saving on a fixed schedule across several intervals", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });

  const saved = [];
  let payload = "a";
  const stop = createAutosave({
    intervalMs: 1000,
    getPayload: () => payload,
    save: (p) => saved.push(p),
  });

  t.mock.timers.tick(1000);
  payload = "b";
  t.mock.timers.tick(1000);
  payload = "c";
  t.mock.timers.tick(1000);

  assert.deepEqual(saved, ["a", "b", "c"]);
  stop();
});

test("stop() cancels further saves", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });

  const saved = [];
  const stop = createAutosave({
    intervalMs: 1000,
    getPayload: () => "x",
    save: (p) => saved.push(p),
  });

  t.mock.timers.tick(1000);
  stop();
  t.mock.timers.tick(5000);

  assert.equal(saved.length, 1);
});

test("a save that rejects does not kill the schedule", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });

  const attempts = [];
  const stop = createAutosave({
    intervalMs: 1000,
    getPayload: () => "x",
    save: (p) => {
      attempts.push(p);
      return Promise.reject(new Error("backend down"));
    },
  });

  t.mock.timers.tick(1000);
  t.mock.timers.tick(1000);

  assert.equal(attempts.length, 2);
  stop();
});
