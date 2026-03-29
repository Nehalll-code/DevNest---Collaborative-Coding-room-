// models/Version.js
// ─────────────────────────────────────────────────────────
// A code snapshot — created every time a user clicks "Save".
//
// Key fields:
//  • room     — which room this snapshot belongs to
//  • code     — the full code at the moment of save
//  • savedBy  — which user triggered the save
//  • preview  — first 80 chars, used in VersionHistory sidebar
//               (your VersionHistory.jsx already renders v.preview)
// ─────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const VersionSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Pre-computed preview so the frontend never slices large strings
    preview: {
      type: String,
    },
  },
  { timestamps: true } // createdAt = the save timestamp
);

// Auto-generate preview before saving
VersionSchema.pre("save", function (next) {
  this.preview = this.code.slice(0, 80).replace(/\n/g, " ");
  next();
});

module.exports = mongoose.model("Version", VersionSchema);
