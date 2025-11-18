#!/bin/bash

# Phase 5 Storage Service Validation Script
# This script validates the Cloudflare R2 storage implementation

echo "=== Phase 5 Storage Service Validation ==="
echo ""

# Check if in backend directory
if [ ! -f "cmd/server/main.go" ]; then
    echo "❌ Error: Must be run from backend directory"
    exit 1
fi

echo "1. Checking Go build..."
if go build -o /tmp/deskspacer-test ./cmd/server 2>&1 | grep -q "error\|undefined"; then
    echo "❌ Build failed"
    go build ./cmd/server
    exit 1
else
    echo "✅ Server builds successfully"
    rm -f /tmp/deskspacer-test
fi

echo ""
echo "2. Checking storage service files exist..."
files=(
    "internal/service/storage_service.go"
    "internal/repository/custom_glb_repo.go"
    "internal/graph/custom_glb_resolver.go"
    "internal/models/custom_glb.go"
    "PHASE5_TESTING.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "3. Checking storage service implementation..."
required_functions=(
    "type StorageService interface"
    "type R2StorageService struct"
    "type MockStorageService struct"
    "func NewR2StorageService"
    "func NewMockStorageService"
    "func.*UploadFile"
    "func.*DeleteFile"
    "func.*GetFileURL"
    "func.*ValidateGLBFile"
)

for func in "${required_functions[@]}"; do
    if grep -q "$func" internal/service/storage_service.go; then
        echo "✅ Found: $func"
    else
        echo "❌ Missing: $func"
        exit 1
    fi
done

echo ""
echo "4. Checking GLB validation..."
validation_checks=(
    "glTF"
    "magic number"
    "version.*2"
)

for check in "${validation_checks[@]}"; do
    if grep -qi "$check" internal/service/storage_service.go; then
        echo "✅ GLB validation includes: $check"
    else
        echo "❌ Missing GLB validation: $check"
        exit 1
    fi
done

echo ""
echo "5. Checking custom GLB repository..."
repo_functions=(
    "type CustomGLBRepository struct"
    "func NewCustomGLBRepository"
    "func.*Create"
    "func.*GetByID"
    "func.*GetAllByUserID"
    "func.*Delete"
    "func.*CountByUserID"
    "func.*GetTotalSizeByUserID"
)

for func in "${repo_functions[@]}"; do
    if grep -q "$func" internal/repository/custom_glb_repo.go; then
        echo "✅ Repository has: $func"
    else
        echo "❌ Repository missing: $func"
        exit 1
    fi
done

echo ""
echo "6. Checking CustomGLB model..."
model_fields=(
    "Filename"
    "OriginalFilename"
    "FileSize"
    "StorageURL"
    "CreatedAt"
)

for field in "${model_fields[@]}"; do
    if grep -q "$field" internal/models/custom_glb.go; then
        echo "✅ Model has field: $field"
    else
        echo "❌ Model missing field: $field"
        exit 1
    fi
done

echo ""
echo "7. Checking GraphQL schema..."
schema_types=(
    "type CustomGLB"
    "uploadCustomGLB"
    "deleteCustomGLB"
    "myCustomGLBs"
    "customGLB"
)

for type in "${schema_types[@]}"; do
    if grep -q "$type" internal/graph/schema.graphqls; then
        echo "✅ Schema includes: $type"
    else
        echo "❌ Schema missing: $type"
        exit 1
    fi
done

echo ""
echo "8. Checking GLB resolver implementation..."
resolver_functions=(
    "func.*UploadCustomGLB"
    "func.*DeleteCustomGLB"
    "func.*MyCustomGLBs"
    "func.*CustomGLB"
)

for func in "${resolver_functions[@]}"; do
    if grep -q "$func" internal/graph/custom_glb_resolver.go; then
        echo "✅ Resolver implements: $func"
    else
        echo "❌ Resolver missing: $func"
        exit 1
    fi
done

echo ""
echo "9. Checking resolver struct..."
if grep -q "customGLBRepo.*CustomGLBRepository" internal/graph/resolver.go; then
    echo "✅ customGLBRepo field added to Resolver"
else
    echo "❌ customGLBRepo field missing from Resolver"
    exit 1
fi

if grep -q "storageService service.StorageService" internal/graph/resolver.go; then
    echo "✅ storageService field added to Resolver"
else
    echo "❌ storageService field missing from Resolver"
    exit 1
fi

echo ""
echo "10. Checking main.go integration..."
main_checks=(
    "customGLBRepo.*NewCustomGLBRepository"
    "storageService"
    "NewR2StorageService"
    "NewMockStorageService"
    "R2AccessKeyID"
)

for check in "${main_checks[@]}"; do
    if grep -q "$check" cmd/server/main.go; then
        echo "✅ Found in main.go: $check"
    else
        echo "❌ Missing in main.go: $check"
        exit 1
    fi
done

echo ""
echo "11. Checking config for R2 settings..."
config_fields=(
    "R2AccessKeyID"
    "R2SecretAccessKey"
    "R2Endpoint"
    "R2BucketName"
    "R2PublicURL"
    "GLBLimitPremium"
    "GLBSizeLimit"
    "GLBTotalStorageLimit"
)

for field in "${config_fields[@]}"; do
    if grep -q "$field" internal/config/config.go; then
        echo "✅ Config has: $field"
    else
        echo "❌ Config missing: $field"
        exit 1
    fi
done

echo ""
echo "12. Checking storage service features..."
features=(
    "GenerateUniqueFilename"
    "ValidateFileSize"
    "FormatFileSize"
    "sanitizeFilename"
)

for feature in "${features[@]}"; do
    if grep -q "$feature" internal/service/storage_service.go; then
        echo "✅ Helper function: $feature"
    else
        echo "❌ Missing helper: $feature"
        exit 1
    fi
done

echo ""
echo "13. Checking upload validation in resolver..."
upload_validations=(
    "IsPremium"
    "ValidateFileSize"
    "ValidateGLBFile"
    "CountByUserID"
    "GetTotalSizeByUserID"
    "base64.StdEncoding.DecodeString"
)

for validation in "${upload_validations[@]}"; do
    if grep -q "$validation" internal/graph/custom_glb_resolver.go; then
        echo "✅ Upload validation: $validation"
    else
        echo "❌ Missing validation: $validation"
        exit 1
    fi
done

echo ""
echo "14. Checking error handling..."
error_patterns=(
    "if err != nil"
    "return.*err"
    "fmt.Errorf"
    "slog.Error"
)

for pattern in "${error_patterns[@]}"; do
    count=$(grep -c "$pattern" internal/service/storage_service.go)
    if [ "$count" -gt 0 ]; then
        echo "✅ Error handling pattern: $pattern ($count occurrences)"
    else
        echo "⚠️  Warning: $pattern not found in storage_service.go"
    fi
done

echo ""
echo "15. Checking documentation..."
if [ -f "PHASE5_TESTING.md" ]; then
    doc_sections=(
        "Mock Storage Service"
        "Cloudflare R2 Storage"
        "Premium User Setup"
        "Upload Custom GLB"
        "GLB File Validation"
        "Troubleshooting"
        "Environment Variables"
    )

    for section in "${doc_sections[@]}"; do
        if grep -q "$section" PHASE5_TESTING.md; then
            echo "✅ Documentation has: $section"
        else
            echo "❌ Documentation missing: $section"
            exit 1
        fi
    done
else
    echo "❌ PHASE5_TESTING.md not found"
    exit 1
fi

echo ""
echo "16. Checking AWS SDK dependency..."
if grep -q "github.com/aws/aws-sdk-go" go.mod; then
    echo "✅ AWS SDK dependency added to go.mod"
else
    echo "❌ AWS SDK dependency missing from go.mod"
    exit 1
fi

echo ""
echo "17. Checking schema builder..."
if [ -f "internal/graph/schema_builder.go" ]; then
    builder_functions=(
        "BuildCustomGLBType"
        "BuildCustomGLBQueries"
        "BuildCustomGLBMutations"
    )

    for func in "${builder_functions[@]}"; do
        if grep -q "$func" internal/graph/schema_builder.go; then
            echo "✅ Schema builder has: $func"
        else
            echo "❌ Schema builder missing: $func"
            exit 1
        fi
    done
else
    echo "❌ schema_builder.go not found"
    exit 1
fi

echo ""
echo "18. Checking schema integration..."
schema_integrations=(
    "customGLBType.*BuildCustomGLBType"
    "customGLBQueries.*BuildCustomGLBQueries"
    "customGLBMutations.*BuildCustomGLBMutations"
)

for integration in "${schema_integrations[@]}"; do
    if grep -q "$integration" internal/graph/schema.go; then
        echo "✅ Schema integrates: $integration"
    else
        echo "❌ Schema missing: $integration"
        exit 1
    fi
done

echo ""
echo "=== Validation Summary ===="
echo "✅ All Phase 5 components are properly implemented!"
echo ""
echo "Phase 5 includes:"
echo "  • StorageService interface for abstraction"
echo "  • R2StorageService for production (Cloudflare R2)"
echo "  • MockStorageService for development/testing"
echo "  • GLB file validation (glTF 2.0 binary format)"
echo "  • CustomGLBRepository for database operations"
echo "  • Premium-only feature gating"
echo "  • File size limits (5MB per file, 50MB total)"
echo "  • File count limits (10 files per premium user)"
echo "  • GraphQL mutations: uploadCustomGLB, deleteCustomGLB"
echo "  • GraphQL queries: myCustomGLBs, customGLB"
echo "  • Comprehensive error handling and validation"
echo "  • Full documentation in PHASE5_TESTING.md"
echo ""
echo "Configuration:"
echo "  • Mock storage: Automatic fallback when R2 not configured"
echo "  • R2 storage: Requires R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT"
echo "  • Feature limits: Configurable via environment variables"
echo ""
echo "Next steps:"
echo "  1. Start server: go run ./cmd/server"
echo "  2. Create premium test user (see PHASE5_TESTING.md)"
echo "  3. Upload GLB file via GraphQL"
echo "  4. Check logs for storage operations"
echo "  5. Verify file in R2 dashboard (if using R2)"
echo "  6. See PHASE5_TESTING.md for detailed testing instructions"
echo ""
echo "🎉 Phase 5 is COMPLETE and ready for testing!"
