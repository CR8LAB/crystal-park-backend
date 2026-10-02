const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ========================================
// RECORD ONE QR SCAN
// PUBLIC
// ========================================

router.post("/", async (_req, res, next) => {
  try {
    await pool.query(`
      INSERT INTO scans
      DEFAULT VALUES
    `);

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// GET TOTAL SCANS
// ADMIN ONLY
// ========================================

router.get("/count", requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM scans
    `);

    res.json({
      total: rows[0].total,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
