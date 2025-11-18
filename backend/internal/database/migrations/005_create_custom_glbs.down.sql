-- Drop triggers
DROP TRIGGER IF EXISTS enforce_glb_limit ON custom_glbs;
DROP TRIGGER IF EXISTS track_user_storage_insert ON custom_glbs;
DROP TRIGGER IF EXISTS track_user_storage_delete ON custom_glbs;

-- Drop functions
DROP FUNCTION IF EXISTS check_glb_limit();
DROP FUNCTION IF EXISTS update_user_storage();

-- Drop indexes
DROP INDEX IF EXISTS idx_custom_glbs_user;
DROP INDEX IF EXISTS idx_custom_glbs_category;

-- Drop custom_glbs table
DROP TABLE IF EXISTS custom_glbs;
