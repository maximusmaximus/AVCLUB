ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_session ON payments (stripe_session) WHERE stripe_session IS NOT NULL;
