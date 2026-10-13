CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT,
  name TEXT NOT NULL,
  ticket TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  donation_cents INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  last4 TEXT,
  invite_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user ON payments (user_id, created_at DESC);
