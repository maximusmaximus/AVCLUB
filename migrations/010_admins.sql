CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO admin_emails (email)
VALUES ('maxinfeld@gmail.com')
ON CONFLICT (email) DO NOTHING;
