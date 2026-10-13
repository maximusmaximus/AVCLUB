CREATE TABLE IF NOT EXISTS night_phase (
  event_slug TEXT PRIMARY KEY,
  phase TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
