// lib/roomAccess.js
// ─────────────────────────────────────────────────────────
// One place that answers "may this user do that in this room?".
//
// Both the REST routes and the Socket.io layer use these, so the realtime
// path can no longer be more permissive than the HTTP path. `members[].user`
// may be populated or a raw ObjectId, so both shapes are handled.
// ─────────────────────────────────────────────────────────

const EDIT_ROLES = new Set(["owner", "editor"]);

const idOf = (value) =>
  value && typeof value === "object" ? (value._id ?? value.id) : value;

// The user's role in the room, or null if they are not a member.
function roleInRoom(room, userId) {
  if (!room || !userId) return null;

  const members = Array.isArray(room.members) ? room.members : [];
  const me = members.find((m) => {
    const id = idOf(m && m.user);
    return id != null && String(id) === String(userId);
  });

  return me && me.role ? me.role : null;
}

// Members (any role) may watch a room.
function isRoomMember(room, userId) {
  return roleInRoom(room, userId) !== null;
}

// Whether an already-resolved role may change the code. The socket layer
// caches the role on join-room and re-checks it per edit, so it needs this
// without another database read.
function roleCanEdit(role) {
  return typeof role === "string" && EDIT_ROLES.has(role);
}

// Only owners and editors may change the code.
function canEditRoom(room, userId) {
  return roleCanEdit(roleInRoom(room, userId));
}

module.exports = { roleInRoom, isRoomMember, canEditRoom, roleCanEdit };
