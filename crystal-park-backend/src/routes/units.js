const express = require("express");
const pool = require("../db");

const router = express.Router();

// ========================================
// GET ALL UNITS
// GET /api/units
// ========================================

router.get("/", async (_req, res, next) => {
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
// GET ONE UNIT
// GET /api/units/:unitNumber
// ========================================

router.get("/:unitNumber", async (req, res, next) => {
  try {
    const unitNumber = Number(req.params.unitNumber);

    if (!Number.isInteger(unitNumber) || unitNumber < 1 || unitNumber > 56) {
      return res.status(400).json({
        error: "Invalid unit number.",
      });
    }

    const { rows } = await pool.query(
      `
      SELECT
        id,
        unit_number,
        phase,
        type,
        status,
        updated_at
      FROM units
      WHERE unit_number = $1
      `,
      [unitNumber],
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
