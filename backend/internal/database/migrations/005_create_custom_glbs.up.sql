-- Create custom_glbs table for user-uploaded 3D models
CREATE TABLE IF NOT EXISTS custom_glbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    thumbnail_path VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_glbs_user ON custom_glbs(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_glbs_category ON custom_glbs(category);

-- Create function to update user storage tracking
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users
        SET storage_used_bytes = storage_used_bytes + NEW.file_size
        WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users
        SET storage_used_bytes = GREATEST(0, storage_used_bytes - OLD.file_size)
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to track storage on insert and delete
CREATE TRIGGER track_user_storage_insert
    AFTER INSERT ON custom_glbs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_storage();

CREATE TRIGGER track_user_storage_delete
    AFTER DELETE ON custom_glbs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_storage();

-- Create function to check GLB limits before insert
CREATE OR REPLACE FUNCTION check_glb_limit()
RETURNS TRIGGER AS $$
DECLARE
    glb_count INT;
    total_storage BIGINT;
    user_premium BOOLEAN;
BEGIN
    SELECT is_premium INTO user_premium FROM users WHERE id = NEW.user_id;

    -- Only premium users can upload custom GLBs
    IF NOT user_premium THEN
        RAISE EXCEPTION 'Custom GLB uploads require premium membership.';
    END IF;

    -- Check count limit (10 GLBs max)
    SELECT COUNT(*), COALESCE(SUM(file_size), 0)
    INTO glb_count, total_storage
    FROM custom_glbs
    WHERE user_id = NEW.user_id;

    IF glb_count >= 10 THEN
        RAISE EXCEPTION 'Maximum 10 custom GLBs allowed per account.';
    END IF;

    -- Check storage limit (50MB total)
    IF total_storage + NEW.file_size > 52428800 THEN
        RAISE EXCEPTION 'Maximum 50MB storage for custom GLBs exceeded.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limits
CREATE TRIGGER enforce_glb_limit
    BEFORE INSERT ON custom_glbs
    FOR EACH ROW
    EXECUTE FUNCTION check_glb_limit();
