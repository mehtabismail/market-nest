ALTER TABLE sellers ADD COLUMN IF NOT EXISTS invite_email TEXT;
CREATE INDEX IF NOT EXISTS idx_sellers_invite_email ON sellers(invite_email);
