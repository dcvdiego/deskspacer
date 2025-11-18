# Phase 5 Storage Service Testing Guide

This guide provides step-by-step instructions for testing the Cloudflare R2 storage integration for custom GLB uploads.

## Overview

Phase 5 adds custom 3D model upload functionality:
- **GLB File Upload**: Premium users can upload custom GLB files
- **File Validation**: Validates GLB format (glTF 2.0 binary)
- **Storage Limits**: 10 files max, 5MB per file, 50MB total storage
- **Cloudflare R2**: Production file storage (S3-compatible)
- **Mock Storage**: Development/testing without R2 credentials

## Prerequisites

### 1. Complete Phase 4 Setup

Ensure Phase 4 (Email Service) is working:
- PostgreSQL database running
- Server configured with `.env` file
- GraphQL endpoint accessible at `http://localhost:5221/graphql`
- Authentication system functional

### 2. Storage Service Configuration

You have two options for testing file storage:

#### Option A: Mock Storage Service (Development/Testing)

No configuration needed! If R2 credentials are not set, the server automatically uses a mock storage service.

```bash
# In .env - just leave R2 credentials commented out
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_ENDPOINT=
```

When the server starts, you'll see:
```
{"level":"WARN","msg":"Using mock storage service (no R2 credentials configured)"}
```

Mock storage simulates file operations and logs them:
```
{"level":"INFO","msg":"Mock: File uploaded","filename":"123e4567-e89b-12d3-a456-426614174000_model.glb","size":1024000}
```

#### Option B: Real Cloudflare R2 Storage (Production-like)

1. **Create Cloudflare R2 Bucket:**
   - Go to https://dash.cloudflare.com
   - Navigate to R2 Object Storage
   - Create a new bucket (e.g., "deskspacer-glbs")
   - Note the bucket name

2. **Get R2 API Credentials:**
   - In R2 dashboard, go to "Manage R2 API Tokens"
   - Click "Create API Token"
   - Give it a name (e.g., "DeskSpacer Storage")
   - Set permissions: Object Read & Write
   - Copy the Access Key ID and Secret Access Key

3. **Get R2 Endpoint:**
   - Format: `https://<account-id>.r2.cloudflarestorage.com`
   - Find your Account ID in the Cloudflare dashboard (top right)

4. **Configure Public URL (Optional):**
   - In R2 bucket settings, enable "Public Access"
   - Copy the public bucket URL
   - Or use a custom domain with R2

5. **Update .env:**
```bash
# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_key_here
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=deskspacer-glbs
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # Optional: your R2 public URL
```

6. **Restart server** to pick up new configuration

## Premium User Setup

Custom GLB uploads require premium membership. First, create and upgrade a test user:

### Create Premium User

```sql
-- Connect to PostgreSQL
psql -d deskspacer -U postgres

-- Update existing user to premium
UPDATE users
SET is_premium = true,
    email_verified = true
WHERE email = 'your-test-email@example.com';

-- Or create a new premium user (after registering via GraphQL)
UPDATE users
SET is_premium = true,
    email_verified = true
WHERE id = 'your-user-id';
```

### Verify Premium Status

```graphql
query {
  me {
    email
    username
    isPremium
    emailVerified
    stateCount
    glbCount
    storageUsed
  }
}
```

Expected response:
```json
{
  "data": {
    "me": {
      "email": "test@example.com",
      "username": "testuser",
      "isPremium": true,
      "emailVerified": true,
      "stateCount": 0,
      "glbCount": 0,
      "storageUsed": 0
    }
  }
}
```

## Testing GLB Upload Flow

### Test 1: Upload Custom GLB File

**Expected Flow:**
1. User uploads GLB file → File validated
2. Storage limits checked → File uploaded to R2/Mock
3. Metadata saved to database → URL returned

**Steps:**

1. **Prepare a GLB file:**

Create a small test GLB file or use base64 encoding of an existing one:

```bash
# Encode a GLB file to base64
base64 -w 0 your-model.glb > model.base64
```

For testing, you can create a minimal valid GLB file:

```python
# create_test_glb.py
import struct

# GLB header: magic (glTF), version (2), length
magic = b'glTF'
version = struct.pack('<I', 2)
length = struct.pack('<I', 20)  # Minimal GLB

# JSON chunk header
json_data = b'{"asset":{"version":"2.0"}}'
json_length = struct.pack('<I', len(json_data))
json_type = struct.pack('<I', 0x4E4F534A)  # 'JSON' in little-endian

# Write GLB
with open('test.glb', 'wb') as f:
    total_length = 12 + 8 + len(json_data)
    f.write(magic)
    f.write(struct.pack('<I', 2))
    f.write(struct.pack('<I', total_length))
    f.write(json_length)
    f.write(json_type)
    f.write(json_data)

print("Created test.glb")
```

Run: `python create_test_glb.py && base64 -w 0 test.glb > test.base64`

2. **Login and get access token:**

```graphql
mutation {
  login(input: {
    email: "test@example.com"
    password: "YourPassword123!"
  }) {
    accessToken
    user {
      id
      isPremium
    }
  }
}
```

Copy the `accessToken` and set it in HTTP headers:
```
Authorization: Bearer your-access-token-here
```

3. **Upload the GLB file:**

```graphql
mutation {
  uploadCustomGLB(
    filename: "desk-lamp.glb"
    fileData: "Z2xURgIAA..."  # Your base64-encoded GLB data
  ) {
    id
    filename
    originalFilename
    fileSize
    storageURL
    createdAt
  }
}
```

Expected response:
```json
{
  "data": {
    "uploadCustomGLB": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "filename": "20251115_123456_deskspacer_desk-lamp.glb",
      "originalFilename": "desk-lamp.glb",
      "fileSize": 524288,
      "storageURL": "https://pub-xxxxx.r2.dev/20251115_123456_deskspacer_desk-lamp.glb",
      "createdAt": "2025-11-15T12:34:56Z"
    }
  }
}
```

4. **Verify upload in logs:**

**Mock service:**
```json
{"level":"INFO","msg":"Mock: File uploaded","filename":"20251115_123456_deskspacer_desk-lamp.glb","size":524288}
```

**R2 service:**
```json
{"level":"INFO","msg":"File uploaded to R2","bucket":"deskspacer-glbs","key":"20251115_123456_deskspacer_desk-lamp.glb","size":524288}
```

5. **Verify in database:**

```sql
SELECT id, user_id, filename, original_filename, file_size,
       storage_url, created_at
FROM custom_glbs
ORDER BY created_at DESC
LIMIT 5;
```

### Test 2: List User's Custom GLBs

```graphql
query {
  myCustomGLBs {
    id
    filename
    originalFilename
    fileSize
    storageURL
    createdAt
  }
}
```

Expected response:
```json
{
  "data": {
    "myCustomGLBs": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "filename": "20251115_123456_deskspacer_desk-lamp.glb",
        "originalFilename": "desk-lamp.glb",
        "fileSize": 524288,
        "storageURL": "https://pub-xxxxx.r2.dev/...",
        "createdAt": "2025-11-15T12:34:56Z"
      }
    ]
  }
}
```

### Test 3: Get Specific GLB

```graphql
query {
  customGLB(id: "123e4567-e89b-12d3-a456-426614174000") {
    id
    filename
    originalFilename
    fileSize
    storageURL
  }
}
```

### Test 4: Delete Custom GLB

```graphql
mutation {
  deleteCustomGLB(id: "123e4567-e89b-12d3-a456-426614174000")
}
```

Expected response:
```json
{
  "data": {
    "deleteCustomGLB": true
  }
}
```

Verify deletion:
- Database record removed
- File deleted from R2 (or mock logged)
- `myCustomGLBs` query no longer includes it

## Testing Validation and Limits

### Test 5: Non-Premium User Upload (Should Fail)

1. Create or login as a non-premium user
2. Attempt GLB upload

Expected error:
```json
{
  "errors": [
    {
      "message": "premium membership required for custom GLB uploads"
    }
  ]
}
```

### Test 6: Invalid GLB File (Should Fail)

Upload a non-GLB file (e.g., plain text file):

```graphql
mutation {
  uploadCustomGLB(
    filename: "test.glb"
    fileData: "SGVsbG8gV29ybGQh"  # "Hello World!" in base64
  ) {
    id
  }
}
```

Expected error:
```json
{
  "errors": [
    {
      "message": "invalid GLB file: missing glTF magic number"
    }
  ]
}
```

### Test 7: File Too Large (Should Fail)

Try uploading a file larger than 5MB:

Expected error:
```json
{
  "errors": [
    {
      "message": "file size exceeds maximum allowed size of 5.00 MB"
    }
  ]
}
```

### Test 8: File Count Limit (Should Fail)

Upload 10 GLB files successfully, then try an 11th:

Expected error:
```json
{
  "errors": [
    {
      "message": "GLB limit reached: maximum 10 files allowed"
    }
  ]
}
```

### Test 9: Storage Limit Exceeded (Should Fail)

Upload files totaling more than 50MB:

Expected error:
```json
{
  "errors": [
    {
      "message": "storage limit exceeded: maximum 50.00 MB allowed, you have used 45.00 MB, this file is 10.00 MB"
    }
  }
}
```

### Test 10: Unauthenticated Upload (Should Fail)

Try uploading without authentication token:

Expected error:
```json
{
  "errors": [
    {
      "message": "authentication required"
    }
  ]
}
```

## GLB File Validation Details

### Valid GLB Requirements

A valid GLB file must:
1. Start with "glTF" magic number (bytes 0-3)
2. Have version 2 (bytes 4-7)
3. Be at least 12 bytes long
4. Contain valid JSON chunk

### GLB Structure

```
Offset  | Size | Description
--------|------|------------
0       | 4    | Magic: 0x46546C67 ("glTF")
4       | 4    | Version: 2
8       | 4    | Total length
12      | 4    | JSON chunk length
16      | 4    | JSON chunk type: 0x4E4F534A
20      | N    | JSON data
20+N    | 4    | Binary chunk length (optional)
24+N    | 4    | Binary chunk type: 0x004E4942
28+N    | M    | Binary data
```

## Storage Service Implementation Details

### R2StorageService

- **Upload**: Uses AWS S3 SDK with R2 endpoint
- **Delete**: Removes file from R2 bucket
- **URL**: Returns public R2 URL or custom domain URL
- **Validation**: Checks GLB magic number and version

### MockStorageService

- **Upload**: Logs operation, returns mock URL
- **Delete**: Logs operation
- **URL**: Returns placeholder URL: `http://localhost/mock-storage/{filename}`
- **Validation**: Same as R2 (checks GLB format)
- **Storage**: Stores metadata in memory (not persisted)

## Database Schema

### custom_glbs Table

```sql
CREATE TABLE custom_glbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_glbs_user_id ON custom_glbs(user_id);
CREATE INDEX idx_custom_glbs_created_at ON custom_glbs(created_at DESC);
```

### Storage Tracking

Automatic storage calculation via PostgreSQL function:

```sql
SELECT user_id,
       COUNT(*) as glb_count,
       SUM(file_size) as total_storage,
       pg_size_pretty(SUM(file_size)::bigint) as storage_formatted
FROM custom_glbs
GROUP BY user_id;
```

## Troubleshooting

### Problem: "invalid GLB file: missing glTF magic number"

**Causes:**
- File is not a GLB file
- File is corrupted
- Base64 encoding is incorrect

**Solutions:**
- Verify file is actually a GLB file: `file your-model.glb` should show "glTF binary"
- Check first 4 bytes: `hexdump -C your-model.glb | head -1` should show `67 6c 54 46` ("glTF")
- Re-encode to base64: `base64 -w 0 your-model.glb`

### Problem: R2 upload fails with "AccessDenied"

**Causes:**
- Invalid R2 credentials
- Insufficient permissions on R2 API token
- Incorrect bucket name

**Solutions:**
- Verify credentials in `.env` match R2 dashboard
- Check API token has "Object Read & Write" permissions
- Verify bucket name is correct (case-sensitive)
- Test R2 connection with AWS CLI:
  ```bash
  aws s3 ls s3://your-bucket-name \
    --endpoint-url https://your-account-id.r2.cloudflarestorage.com \
    --profile r2
  ```

### Problem: "storage limit exceeded" but user has no files

**Cause:** Database storage tracking is out of sync

**Solution:** Recalculate storage:
```sql
-- Check current storage
SELECT user_id, SUM(file_size) FROM custom_glbs WHERE user_id = 'user-id' GROUP BY user_id;

-- If incorrect, verify all file_size values are correct
SELECT id, filename, file_size FROM custom_glbs WHERE user_id = 'user-id';
```

### Problem: Mock storage URLs don't work

**Expected Behavior:** Mock storage returns placeholder URLs that don't actually serve files. This is normal for development.

**Solution:**
- For testing downloads, use real R2 storage
- Or implement a local file server for mock files

### Problem: Files uploaded but not visible in R2 dashboard

**Causes:**
- Using mock storage service
- Wrong bucket configured
- R2 dashboard cache

**Solutions:**
- Check server logs for "R2 storage service initialized"
- Verify `R2_BUCKET_NAME` matches dashboard
- Refresh R2 dashboard page
- Use R2 API to list objects:
  ```bash
  aws s3 ls s3://your-bucket-name --endpoint-url ...
  ```

### Problem: "GLB limit reached" error

**Expected:** Premium users can upload max 10 files

**Solutions:**
- Delete old GLB files using `deleteCustomGLB` mutation
- Or increase limit in config: `GLB_LIMIT_PREMIUM=20` in `.env`

### Problem: Base64 encoding errors

**Symptoms:**
- "illegal base64 data" error
- Upload succeeds but file is corrupted

**Solutions:**
- Ensure no line breaks in base64: use `base64 -w 0`
- Verify base64 is valid: `echo "your-base64" | base64 -d | file -`
- For large files, consider chunked upload (future enhancement)

## Verification Queries

### Check User's GLB Storage

```sql
SELECT
    u.email,
    u.username,
    u.is_premium,
    COUNT(cg.id) as glb_count,
    COALESCE(SUM(cg.file_size), 0) as total_bytes,
    pg_size_pretty(COALESCE(SUM(cg.file_size), 0)::bigint) as total_size,
    ARRAY_AGG(cg.filename ORDER BY cg.created_at DESC) as files
FROM users u
LEFT JOIN custom_glbs cg ON u.id = cg.user_id
WHERE u.email = 'test@example.com'
GROUP BY u.id, u.email, u.username, u.is_premium;
```

### Check All GLBs

```sql
SELECT
    cg.id,
    u.email,
    cg.filename,
    cg.original_filename,
    pg_size_pretty(cg.file_size) as size,
    cg.created_at
FROM custom_glbs cg
JOIN users u ON cg.user_id = u.id
ORDER BY cg.created_at DESC
LIMIT 20;
```

### Check Storage by User

```sql
SELECT
    u.email,
    COUNT(cg.id) as file_count,
    pg_size_pretty(COALESCE(SUM(cg.file_size), 0)::bigint) as total_storage,
    CASE
        WHEN u.is_premium THEN '10 files / 50 MB'
        ELSE 'Premium required'
    END as limits
FROM users u
LEFT JOIN custom_glbs cg ON u.id = cg.user_id
WHERE u.is_premium = true
GROUP BY u.id, u.email, u.is_premium
ORDER BY SUM(cg.file_size) DESC NULLS LAST;
```

## Environment Variables Reference

```bash
# Storage Configuration
R2_ACCESS_KEY_ID=your_r2_access_key           # R2 API access key
R2_SECRET_ACCESS_KEY=your_r2_secret_key       # R2 API secret key
R2_ENDPOINT=https://account.r2.cloudflarestorage.com  # R2 endpoint URL
R2_BUCKET_NAME=deskspacer-glbs                # R2 bucket name
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev        # Optional: R2 public URL

# Feature Limits
GLB_LIMIT_PREMIUM=10                          # Max files per premium user
GLB_SIZE_LIMIT=5242880                        # Max file size (5MB in bytes)
GLB_TOTAL_STORAGE_LIMIT=52428800              # Max total storage (50MB in bytes)
```

## Testing Checklist

- [ ] Server builds successfully
- [ ] Mock storage service works (no R2 credentials)
- [ ] R2 storage service works (with credentials)
- [ ] Premium user can upload GLB
- [ ] Non-premium user upload is rejected
- [ ] Invalid GLB file is rejected
- [ ] File size limit is enforced (5MB)
- [ ] File count limit is enforced (10 files)
- [ ] Total storage limit is enforced (50MB)
- [ ] `myCustomGLBs` query returns user's files
- [ ] `customGLB` query returns specific file
- [ ] `deleteCustomGLB` removes file from storage and database
- [ ] Unauthenticated requests are rejected
- [ ] Users cannot access other users' GLBs
- [ ] Database storage tracking is accurate
- [ ] GLB validation works (checks magic number and version)
- [ ] Error messages are clear and helpful
- [ ] Logs show upload/delete operations

## Next Steps

After confirming Phase 5 works:
- **Phase 6:** Stripe Integration (premium payment processing)
- **Phase 7:** Frontend Implementation (React file upload component)
- **Phase 8:** Production deployment and monitoring

## Performance Considerations

### File Size Limits

- **Per-file limit:** 5MB (configurable)
- **Total storage:** 50MB per user (configurable)
- **Max files:** 10 per user (configurable)

### Scaling Considerations

- R2 has no egress fees (unlike S3)
- R2 supports unlimited bandwidth
- Consider CDN for frequently accessed files
- Implement file compression for larger models
- Add thumbnail generation (future enhancement)

### Cost Estimates (Cloudflare R2)

- **Storage:** $0.015/GB/month
- **Class A Operations:** $4.50/million (write, list)
- **Class B Operations:** $0.36/million (read)
- **Egress:** FREE (no bandwidth charges)

**Example costs for 1000 users:**
- Average 5 files @ 2MB each = 10MB per user
- Total storage: 10GB = $0.15/month
- Uploads (5k/month): ~$0.02/month
- **Total:** ~$0.20/month

## Security Best Practices

1. **File Validation:** Always validate GLB format server-side
2. **Size Limits:** Enforce file size limits to prevent abuse
3. **Authentication:** Require auth for all upload/delete operations
4. **Ownership:** Verify user owns file before delete
5. **Rate Limiting:** Limit upload frequency per user
6. **Virus Scanning:** Consider ClamAV for production (future)
7. **CORS:** Configure R2 CORS for frontend access
8. **Signed URLs:** Use R2 pre-signed URLs for downloads (future)
9. **Content-Type:** Validate content-type matches GLB
10. **Filename Sanitization:** Remove path traversal characters

## Quick Reference

### GraphQL Operations

```graphql
# Upload GLB
mutation { uploadCustomGLB(filename: "model.glb", fileData: "...") { id storageURL } }

# List GLBs
query { myCustomGLBs { id filename originalFilename fileSize storageURL } }

# Get GLB
query { customGLB(id: "uuid") { filename storageURL } }

# Delete GLB
mutation { deleteCustomGLB(id: "uuid") }
```

### Logs to Watch

```bash
# Start server and watch storage logs
cd backend
go run ./cmd/server | grep -i "storage\|glb\|upload\|delete"
```

### Common SQL Queries

```sql
-- User's storage usage
SELECT COUNT(*), pg_size_pretty(SUM(file_size)::bigint)
FROM custom_glbs WHERE user_id = 'uuid';

-- Recent uploads
SELECT filename, created_at FROM custom_glbs
ORDER BY created_at DESC LIMIT 10;

-- Storage by user
SELECT user_id, COUNT(*), pg_size_pretty(SUM(file_size)::bigint)
FROM custom_glbs GROUP BY user_id;
```
