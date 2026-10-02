CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  unit_number INTEGER UNIQUE NOT NULL CHECK (unit_number BETWEEN 1 AND 56),
  phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 5),
  type VARCHAR(20) NOT NULL DEFAULT 'Type A',
  status VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'under_offer', 'sold')),
  price NUMERIC(12,2),
  x NUMERIC(7,4),
  y NUMERIC(7,4),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id BIGSERIAL PRIMARY KEY,
  unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(160),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS enquiries_unit_id_idx ON enquiries(unit_id);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries(created_at DESC);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
