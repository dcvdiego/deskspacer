-- Drop trigger
DROP TRIGGER IF EXISTS update_user_states_updated_at ON user_states;

-- Drop new indexes
DROP INDEX IF EXISTS idx_user_states_user;
DROP INDEX IF EXISTS idx_user_states_created_at;
DROP INDEX IF EXISTS idx_user_states_public;
DROP INDEX IF EXISTS idx_user_states_public_token;

-- Add back expires_at column
ALTER TABLE user_states ADD COLUMN expires_at TIMESTAMPTZ;

-- Set expires_at for all existing records (30 days from now as default)
UPDATE user_states SET expires_at = NOW() + INTERVAL '30 days';

-- Make expires_at NOT NULL
ALTER TABLE user_states ALTER COLUMN expires_at SET NOT NULL;

-- Recreate old index
CREATE INDEX IF NOT EXISTS idx_shared_states_expires_at ON user_states(expires_at);

-- Remove new columns
ALTER TABLE user_states
    DROP COLUMN user_id,
    DROP COLUMN name,
    DROP COLUMN is_public,
    DROP COLUMN public_token,
    DROP COLUMN created_at,
    DROP COLUMN updated_at;

-- Rename table back to shared_states
ALTER TABLE user_states RENAME TO shared_states;
