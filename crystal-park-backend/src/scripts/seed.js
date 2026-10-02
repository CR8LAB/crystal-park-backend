require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

function phaseFor(unit) {
  if (unit <= 8) return 1;
  if (unit <= 22) return 2;
  if (unit <= 37) return 3;
  if (unit <= 46) return 4;
  return 5;
}

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let unit = 1; unit <= 56; unit++) {
      await client.query(`
        INSERT INTO units (unit_number, phase, type, status)
        VALUES ($1, $2, 'Type A', 'available')
        ON CONFLICT (unit_number) DO NOTHING
      `, [unit, phaseFor(unit)]);
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (email && password) {
      const hash = await bcrypt.hash(password, 12);
      await client.query(`
        INSERT INTO admins (email, password_hash)
        VALUES ($1, $2)
        ON CONFLICT (email)
        DO UPDATE SET password_hash = EXCLUDED.password_hash
      `, [email, hash]);
    } else {
      console.warn("ADMIN_EMAIL / ADMIN_PASSWORD missing: admin not seeded.");
    }

    await client.query("COMMIT");
    console.log("Seed complete: 56 Crystal Park units loaded.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
