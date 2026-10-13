CREATE TABLE IF NOT EXISTS invite_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  percent INTEGER NOT NULL CHECK (percent >= 1 AND percent <= 100),
  ticket TEXT NOT NULL CHECK (ticket IN ('night', 'deposit', 'party')),
  label TEXT NOT NULL DEFAULT '',
  used_name TEXT,
  used_ticket TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
