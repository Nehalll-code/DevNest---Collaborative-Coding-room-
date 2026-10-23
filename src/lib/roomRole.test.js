// Bug: Dashboard.jsx computed the role by finding the member whose id matched
// the room's OWNER, not the current user — so every room in the list was
// labelled with the owner's role ("Owner"), whoever was looking at it.

import test from "node:test";
import assert from "node:assert/strict";
import { roleForUser } from "./roomRole.js";

const ALICE = "64b000000000000000000001";
const BOB = "64b000000000000000000002";

test("reports Owner when the current user owns the room", () => {
  const room = {
    owner: { _id: ALICE },
    members: [
      { user: { _id: ALICE }, role: "owner" },
      { user: { _id: BOB }, role: "editor" },
    ],
  };

  assert.equal(roleForUser(room, ALICE), "Owner");
});

test("reports the current user's own role, not the owner's", () => {
  const room = {
    owner: { _id: ALICE },
    members: [
      { user: { _id: ALICE }, role: "owner" },
      { user: { _id: BOB }, role: "editor" },
    ],
  };

  assert.equal(roleForUser(room, BOB), "Editor");
});

test("reports Viewer for a member with the viewer role", () => {
  const room = {
    owner: { _id: ALICE },
    members: [
      { user: { _id: ALICE }, role: "owner" },
      { user: { _id: BOB }, role: "viewer" },
    ],
  };

  assert.equal(roleForUser(room, BOB), "Viewer");
});

test("handles unpopulated member ids", () => {
  const room = {
    owner: ALICE,
    members: [
      { user: ALICE, role: "owner" },
      { user: BOB, role: "editor" },
    ],
  };

  assert.equal(roleForUser(room, BOB), "Editor");
});

test("falls back to Viewer for someone who is not a member", () => {
  const room = {
    owner: { _id: ALICE },
    members: [{ user: { _id: ALICE }, role: "owner" }],
  };

  assert.equal(roleForUser(room, "64b000000000000000000009"), "Viewer");
});

test("falls back to Viewer when the room or user is missing", () => {
  assert.equal(roleForUser(null, ALICE), "Viewer");
  assert.equal(roleForUser({ members: [] }, undefined), "Viewer");
});
