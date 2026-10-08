const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ========================================
// PUBLIC
// REGISTER INTEREST
//
// POST /api/enquiries
// ========================================

router.post("/", async (req, res, next) => {
  try {
    const { unitNumber, name, phone, email = "", message = "" } = req.body;

    // ------------------------------------
    // VALIDATION
    // ------------------------------------

    if (!unitNumber || !name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        error: "unitNumber, name and phone are required.",
      });
    }

    // ------------------------------------
    // CHECK UNIT EXISTS
    // ------------------------------------

    const unitResult = await pool.query(
      `
        SELECT
          id,
          status
        FROM units
        WHERE unit_number = $1
        `,
      [Number(unitNumber)],
    );

    if (!unitResult.rows[0]) {
      return res.status(404).json({
        error: "Unit not found.",
      });
    }

    // ------------------------------------
    // SAVE ENQUIRY
    //
    // IMPORTANT:
    // An enquiry does NOT reserve a unit
    // or change its availability.
    // ------------------------------------

    const { rows } = await pool.query(
      `
        INSERT INTO enquiries
        (
          unit_id,
          name,
          phone,
          email,
          message
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5
        )

        RETURNING
          id,
          created_at AS "createdAt"
        `,
      [
        unitResult.rows[0].id,
        name.trim(),
        phone.trim(),
        email.trim(),
        message.trim(),
      ],
    );

    res.status(201).json({
      message: "Interest registered successfully.",

      enquiry: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// ========================================
// ADMIN
// GET ALL ENQUIRIES
//
// GET /api/enquiries
//
// Requires:
// Authorization: Bearer <JWT>
// ========================================

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        e.id,
        u.unit_number AS "unitNumber",
        u.phase,
        u.status AS "unitStatus",
        e.name,
        e.phone,
        e.email,
        e.message,
        e.status,
        e.completed_at AS "completedAt",
        e.created_at AS "createdAt"
      FROM enquiries e
      JOIN units u
        ON u.id = e.unit_id
      ORDER BY e.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!["new", "completed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid enquiry status.",
      });
    }

    // Update enquiry in Neon
    const { rows } = await pool.query(
      `
      UPDATE enquiries
      SET
        status = $1::varchar,
        completed_at = CASE
          WHEN $1::varchar = 'completed' THEN NOW()
          ELSE NULL
        END
      WHERE id = $2
      RETURNING
        id,
        status,
        completed_at
      `,
      [status, req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Enquiry not found.",
      });
    }

    res.json({
      message: "Enquiry updated successfully.",
      enquiry: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM enquiries WHERE id = $1",
      [req.params.id],
    );

    if (!rowCount) {
      return res.status(404).json({
        error: "Enquiry not found.",
      });
    }

    res.json({
      message: "Enquiry deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
