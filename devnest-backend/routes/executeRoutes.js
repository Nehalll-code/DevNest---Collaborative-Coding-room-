// routes/executeRoutes.js
// ─────────────────────────────────────────────────────────
// POST /api/execute
// Sends user code to Judge0 public instance (free, no API key)
// and returns real output.
//
// Judge0 language IDs:
//   63 = JavaScript (Node.js)
//   71 = Python 3
//   54 = C++
// ─────────────────────────────────────────────────────────

const express = require("express");
const axios   = require("axios");
const protect = require("../middleware/auth");

const router = express.Router();
router.use(protect);

const JUDGE0_URL = "https://ce.judge0.com";

const LANGUAGE_IDS = {
  javascript: 63,
  python:     71,
  cpp:        54,
};

router.post("/", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ message: "code and language are required" });
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return res.status(400).json({ message: "Unsupported language" });
  }

  try {
    // Step 1 — Submit code to Judge0
    const submitRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: languageId,
        stdin: "",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const token = submitRes.data.token;

    // Step 2 — Poll until execution is complete
    // Status id: 1 = In Queue, 2 = Processing, 3 = Accepted, 4+ = Error
    let result = null;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000)); // wait 1s between polls

      const pollRes = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      result = pollRes.data;
      if (result.status?.id > 2) break; // done
    }

    // Step 3 — Shape the response
    const output  = result.stdout            || "";
    const error   = result.stderr            || result.compile_output || "";
    const time    = result.time              || "?";
    const status  = result.status?.description || "Unknown";

    res.json({
      output:  output || error || "No output",
      error:   !!error && !output,
      time:    `${time}s`,
      status,
    });

  } catch (err) {
    console.error("Judge0 error:", err.message);
    res.status(500).json({
      message: "Code execution failed",
      error:   err.message,
    });
  }
});

module.exports = router;