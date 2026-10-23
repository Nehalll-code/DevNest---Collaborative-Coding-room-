// Bug: the Socket.io layer verified the JWT but never checked whether the user
// was a member of the room, or what role they had. Any logged-in user who knew
// a roomId could join the channel and broadcast edits — including viewers and
// complete non-members — even though the REST routes blocked exactly that.
//
// These helpers centralise the rule so REST and the socket layer agree.

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isRoomMember,
  canEditRoom,
  roleInRoom,
  roleCanEdit,
} = require("./roomAccess");

const ALICE = "64b000000000000000000001";
const BOB = "64b000000000000000000002";
const STRANGER = "64b000000000000000000009";

const room = () => ({
  roomId: "abc123",
  owner: ALICE,
  members: [
    { user: ALICE, role: "owner" },
    { user: BOB, role: "editor" },
  ],
});

test("a member is recognised as a member", () => {
  assert.equal(isRoomMember(room(), BOB), true);
});

test("a stranger is not a member", () => {
  assert.equal(isRoomMember(room(), STRANGER), false);
});

test("the owner may edit", () => {
  assert.equal(canEditRoom(room(), ALICE), true);
});

test("an editor may edit", () => {
  assert.equal(canEditRoom(room(), BOB), true);
});

test("a viewer may not edit", () => {
  const r = room();
  r.members[1].role = "viewer";

  assert.equal(canEditRoom(r, BOB), false);
  assert.equal(isRoomMember(r, BOB), true); // still allowed to watch
});

test("a stranger may not edit", () => {
  assert.equal(canEditRoom(room(), STRANGER), false);
});

test("works with populated member documents", () => {
  const r = {
    owner: { _id: ALICE },
    members: [
      { user: { _id: ALICE }, role: "owner" },
      { user: { _id: BOB }, role: "viewer" },
    ],
  };

  assert.equal(isRoomMember(r, BOB), true);
  assert.equal(canEditRoom(r, BOB), false);
  assert.equal(canEditRoom(r, ALICE), true);
});

test("reports the role inside the room", () => {
  assert.equal(roleInRoom(room(), ALICE), "owner");
  assert.equal(roleInRoom(room(), BOB), "editor");
  assert.equal(roleInRoom(room(), STRANGER), null);
});

test("a missing or malformed room denies everything", () => {
  for (const bad of [null, undefined, {}, { members: null }]) {
    assert.equal(isRoomMember(bad, BOB), false);
    assert.equal(canEditRoom(bad, BOB), false);
    assert.equal(roleInRoom(bad, BOB), null);
  }
});

test("a missing user id denies everything", () => {
  assert.equal(isRoomMember(room(), undefined), false);
  assert.equal(canEditRoom(room(), null), false);
});

// The socket layer resolves the role once on join-room and caches it, so it
// needs to re-check an already-known role without another database read.
test("roleCanEdit accepts owners and editors only", () => {
  assert.equal(roleCanEdit("owner"), true);
  assert.equal(roleCanEdit("editor"), true);
  assert.equal(roleCanEdit("viewer"), false);
});

test("roleCanEdit denies unknown or missing roles", () => {
  for (const bad of [null, undefined, "", "admin", "OWNER", 7]) {
    assert.equal(roleCanEdit(bad), false);
  }
});
