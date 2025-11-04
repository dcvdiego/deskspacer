-- Create shared_states table
CREATE TABLE IF NOT EXISTS shared_states (
    id UUID PRIMARY KEY,
    state_data TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create index on expires_at for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_shared_states_expires_at ON shared_states(expires_at);
