// Work out the *current user's* role in a room.
//
// `members[].user` arrives either populated (`{ _id, name, email }`) or as a
// raw ObjectId, depending on which endpoint produced the room, so both shapes
// are handled. Anyone we cannot place in the member list is shown as a viewer:
// the display should never over-state what someone is allowed to do.

const idOf = (value) =>
  value && typeof value === "object" ? (value._id ?? value.id) : value;

export function roleForUser(room, userId) {
  if (!room || !userId) return "Viewer";

  const members = Array.isArray(room.members) ? room.members : [];
  const me = members.find((m) => {
    const id = idOf(m?.user);
    return id != null && String(id) === String(userId);
  });

  const role = me?.role;
  if (!role) return "Viewer";

  return role.charAt(0).toUpperCase() + role.slice(1);
}
