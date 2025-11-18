-- Drop refresh tokens table and indexes
DROP INDEX IF EXISTS idx_refresh_tokens_user;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP TABLE IF EXISTS refresh_tokens;

-- Drop password reset tokens table and indexes
DROP INDEX IF EXISTS idx_password_reset_user;
DROP INDEX IF EXISTS idx_password_reset_token;
DROP TABLE IF EXISTS password_reset_tokens;

-- Drop email verification tokens table and indexes
DROP INDEX IF EXISTS idx_email_verification_user;
DROP INDEX IF EXISTS idx_email_verification_token;
DROP TABLE IF EXISTS email_verification_tokens;
