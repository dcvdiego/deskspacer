-- Drop trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

-- Drop indexes
DROP INDEX IF EXISTS idx_payments_user;
DROP INDEX IF EXISTS idx_payments_stripe_intent;
DROP INDEX IF EXISTS idx_payments_stripe_session;
DROP INDEX IF EXISTS idx_payments_status;

-- Drop payments table
DROP TABLE IF EXISTS payments;
