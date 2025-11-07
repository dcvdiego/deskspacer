-- Rename shared_states table to user_states
ALTER TABLE shared_states RENAME TO user_states;

-- Add new columns for user states
ALTER TABLE user_states
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN name VARCHAR(100),
    ADD COLUMN is_public BOOLEAN DEFAULT TRUE,
    ADD COLUMN public_token UUID,
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing anonymous states to public states
-- Use existing ID as public token and approximate creation time
UPDATE user_states
SET
    is_public = TRUE,
    public_token = id,
    created_at = NOW() - (expires_at - NOW()),
    user_id = NULL
WHERE user_id IS NULL;

-- Create unique constraint on public_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_states_public_token ON user_states(public_token) WHERE public_token IS NOT NULL;

-- Remove expires_at column (no longer needed for user states)
ALTER TABLE user_states DROP COLUMN expires_at;

-- Drop old index
DROP INDEX IF EXISTS idx_shared_states_expires_at;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_user_states_user ON user_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_states_created_at ON user_states(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_states_public ON user_states(is_public) WHERE is_public = TRUE;

-- Add trigger for updated_at (reuse function from users table)
CREATE TRIGGER update_user_states_updated_at
    BEFORE UPDATE ON user_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
