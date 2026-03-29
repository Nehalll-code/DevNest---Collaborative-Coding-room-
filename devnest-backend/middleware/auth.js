// middleware/auth.js
// ─────────────────────────────────────────────────────────
// JWT verification middleware.
//
// How it works:
//  1. Reads the Authorization header → "Bearer <token>"
//  2. Verifies signature + expiry using JWT_SECRET
//  3. If valid  → attaches req.user = { id, email } and calls next()
//  4. If invalid → returns 401 immediately
//
// This is the server-side equivalent of ProtectedRoute.jsx.
// ProtectedRoute guards the UI; this guards the API.
// ─────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Header must look like: "Bearer eyJhbGci..."
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token — access denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded contains whatever we put in the payload during sign (id + email)
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

module.exports = protect;
