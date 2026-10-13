CREATE TABLE IF NOT EXISTS night_shares (
  id BIGSERIAL PRIMARY KEY,
  night_on DATE NOT NULL,
  title TEXT NOT NULL,
  team TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS night_snapshots (
  night_on DATE PRIMARY KEY,
  presented JSONB NOT NULL,
  ranking JSONB NOT NULL,
  attendees JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
