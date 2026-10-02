const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const VALID_STATUSES = ["available", "under_offer", "sold"];

// ========================================
// SAFE PASSWORD COMPARISON
// ========================================

function safeCompare(a, b) {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

// ========================================
// ADMIN LOGIN
//
// POST /api/admin/login
//
// Body:
// {
//   "password": "your-password"
// }
// ========================================

router.post("/login", (req, res) => {
  const password = String(req.body?.password || "");

  const adminPassword = String(process.env.ADMIN_PASSWORD || "");

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD is not configured.");

    return res.status(500).json({
      error: "Admin login is not configured.",
    });
  }

  if (!password || !safeCompare(password, adminPassword)) {
    return res.status(401).json({
      error: "Invalid password.",
    });
  }

  const token = jwt.sign(
    {
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    },
  );

  res.json({
    token,
  });
});

// ========================================
// GET ADMIN UNITS
//
// GET /api/admin/units
// ========================================

router.get("/units", requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
          SELECT
            id,
            unit_number,
            phase,
            type,
            status,
            updated_at
          FROM units
          ORDER BY unit_number
        `);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ========================================
// UPDATE UNIT STATUS
//
// PATCH /api/admin/units/:unitNumber
//
// Body:
// {
//   "status": "sold"
// }
// ========================================

router.patch("/units/:unitNumber", requireAdmin, async (req, res, next) => {
  try {
    const unitNumber = Number(req.params.unitNumber);

    if (!Number.isInteger(unitNumber) || unitNumber < 1 || unitNumber > 56) {
      return res.status(400).json({
        error: "Invalid unit number.",
      });
    }

    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Invalid status.",
      });
    }

    const { rows } = await pool.query(
      `
          UPDATE units

          SET
            status = $1,
            updated_at = NOW()

          WHERE unit_number = $2

          RETURNING
            id,
            unit_number,
            phase,
            type,
            status,
            updated_at
          `,
      [status, unitNumber],
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: "Unit not found.",
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
