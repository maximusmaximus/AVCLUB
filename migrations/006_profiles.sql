CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  banner TEXT NOT NULL DEFAULT 'amber',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower ON profiles (lower(username));

CREATE TABLE IF NOT EXISTS participations (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_slug TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_slug, role)
);

CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  team TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contributions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_slug TEXT NOT NULL,
  role TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_slug, role)
);

CREATE TABLE IF NOT EXISTS access_grants (
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  PRIMARY KEY (user_id, capability)
);
