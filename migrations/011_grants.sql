CREATE TABLE IF NOT EXISTS grant_applications (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  work TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS grant_applications_email ON grant_applications (email);
CREATE INDEX IF NOT EXISTS grant_applications_status ON grant_applications (status, created_at DESC);
