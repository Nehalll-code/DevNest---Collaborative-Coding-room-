// Label a snapshot in the version sidebar.
//
// The list is newest-first, so index 0 is the latest save and the version
// numbers count down from there.

export function versionLabel(index, total) {
  if (index === 0) return "Latest";
  return `v${total - index}`;
}
