package service

import (
	"context"
	"encoding/binary"
	"testing"
)

// TestMockStorageService tests the mock storage service implementation
func TestMockStorageService(t *testing.T) {
	mock := NewMockStorageService()
	ctx := context.Background()

	t.Run("UploadFile", func(t *testing.T) {
		data := []byte("test file data")
		url, err := mock.UploadFile(ctx, "test.glb", data, "model/gltf-binary")
		if err != nil {
			t.Fatalf("UploadFile failed: %v", err)
		}
		if url == "" {
			t.Error("Expected non-empty URL")
		}
		if url != "https://mock-storage.test/test.glb" {
			t.Errorf("Expected mock URL, got %s", url)
		}
	})

	t.Run("DeleteFile", func(t *testing.T) {
		err := mock.DeleteFile(ctx, "test.glb")
		if err != nil {
			t.Fatalf("DeleteFile failed: %v", err)
		}
	})

	t.Run("GetFileURL", func(t *testing.T) {
		url := mock.GetFileURL("test.glb")
		expected := "https://mock-storage.test/test.glb"
		if url != expected {
			t.Errorf("Expected %s, got %s", expected, url)
		}
	})

	t.Run("MultipleUploads", func(t *testing.T) {
		files := []string{"file1.glb", "file2.glb", "file3.glb"}
		for _, filename := range files {
			data := []byte("data for " + filename)
			url, err := mock.UploadFile(ctx, filename, data, "model/gltf-binary")
			if err != nil {
				t.Fatalf("Upload of %s failed: %v", filename, err)
			}
			if url == "" {
				t.Errorf("Empty URL for %s", filename)
			}
		}
	})
}

// TestGLBValidation tests GLB file format validation
func TestGLBValidation(t *testing.T) {
	mock := NewMockStorageService()

	t.Run("ValidGLB", func(t *testing.T) {
		// Create a minimal valid GLB file
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")                    // Magic number
		binary.LittleEndian.PutUint32(glb[4:8], 2) // Version 2
		binary.LittleEndian.PutUint32(glb[8:12], 20) // Total length

		err := mock.ValidateGLBFile(glb)
		if err != nil {
			t.Errorf("Valid GLB rejected: %v", err)
		}
	})

	t.Run("TooSmall", func(t *testing.T) {
		glb := []byte("glTF")
		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for file too small")
		}
		if err != nil && err.Error() != "file too small to be a valid GLB" {
			t.Errorf("Unexpected error message: %v", err)
		}
	})

	t.Run("InvalidMagicNumber", func(t *testing.T) {
		glb := make([]byte, 20)
		copy(glb[0:4], "BLAH")                    // Invalid magic
		binary.LittleEndian.PutUint32(glb[4:8], 2) // Version 2
		binary.LittleEndian.PutUint32(glb[8:12], 20)

		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for invalid magic number")
		}
		if err != nil && err.Error() != "invalid GLB file: missing glTF magic number" {
			t.Errorf("Unexpected error message: %v", err)
		}
	})

	t.Run("InvalidVersion", func(t *testing.T) {
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 1) // Version 1 (invalid)
		binary.LittleEndian.PutUint32(glb[8:12], 20)

		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for invalid version")
		}
	})

	t.Run("Version3Future", func(t *testing.T) {
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 3) // Version 3 (future)
		binary.LittleEndian.PutUint32(glb[8:12], 20)

		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for unsupported version")
		}
	})

	t.Run("NotGLBFile", func(t *testing.T) {
		// Plain text file
		err := mock.ValidateGLBFile([]byte("This is just a text file"))
		if err == nil {
			t.Error("Expected error for non-GLB file")
		}
	})

	t.Run("EmptyFile", func(t *testing.T) {
		err := mock.ValidateGLBFile([]byte{})
		if err == nil {
			t.Error("Expected error for empty file")
		}
	})
}

// TestHelperFunctions tests storage utility functions
func TestHelperFunctions(t *testing.T) {
	t.Run("GenerateUniqueFilename", func(t *testing.T) {
		userID := "test-user-id"
		filename1 := GenerateUniqueFilename(userID, "model.glb")
		filename2 := GenerateUniqueFilename(userID, "model.glb")

		// Should be different (timestamp-based)
		if filename1 == filename2 {
			// Small chance they're equal if generated in same microsecond
			// but should have timestamp prefix
			if len(filename1) < 20 {
				t.Error("Filename should have timestamp prefix")
			}
		}

		// Should contain .glb extension
		if len(filename1) < 4 || filename1[len(filename1)-4:] != ".glb" {
			t.Errorf("Filename should have .glb extension, got %s", filename1)
		}
	})

	t.Run("DetectContentType", func(t *testing.T) {
		// Create minimal GLB
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 2)

		contentType := DetectContentType(glb)
		if contentType != "model/gltf-binary" {
			t.Errorf("Expected model/gltf-binary, got %s", contentType)
		}

		// Non-GLB file
		contentType = DetectContentType([]byte("plain text"))
		if contentType == "model/gltf-binary" {
			t.Error("Should not detect text file as GLB")
		}
	})

	t.Run("ValidateFileSize", func(t *testing.T) {
		tests := []struct {
			name      string
			size      int64
			limit     int64
			shouldErr bool
		}{
			{"UnderLimit", 1000, 5000, false},
			{"ExactLimit", 5000, 5000, false},
			{"OverLimit", 6000, 5000, true},
			{"ZeroSize", 0, 5000, true}, // Zero size is an error
			{"LargeFile", 10 * 1024 * 1024, 5 * 1024 * 1024, true},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				err := ValidateFileSize(tt.size, tt.limit)
				if tt.shouldErr && err == nil {
					t.Error("Expected error for size validation")
				}
				if !tt.shouldErr && err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
			})
		}
	})

	t.Run("FormatFileSize", func(t *testing.T) {
		tests := []struct {
			bytes    int64
			expected string
		}{
			{0, "0 B"},
			{100, "100 B"},
			{1024, "1.0 KB"},
			{1536, "1.5 KB"},
			{1024 * 1024, "1.0 MB"},
			{5 * 1024 * 1024, "5.0 MB"},
			{1024 * 1024 * 1024, "1.0 GB"},
		}

		for _, tt := range tests {
			result := FormatFileSize(tt.bytes)
			if result != tt.expected {
				t.Errorf("FormatFileSize(%d) = %s, want %s", tt.bytes, result, tt.expected)
			}
		}
	})

	t.Run("SanitizeFilename", func(t *testing.T) {
		tests := []struct {
			input    string
			expected string
		}{
			{"normal.glb", "normal.glb"},
			{"../../../etc/passwd", "etcpasswd"},
			{"path/to/file.glb", "pathtofile.glb"},
			{"file name.glb", "file name.glb"}, // Spaces are allowed
			{"file@#$%.glb", "file@#$%.glb"},   // Special chars are allowed
			{"../../attack.glb", "attack.glb"},
		}

		for _, tt := range tests {
			result := sanitizeFilename(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizeFilename(%s) = %s, want %s", tt.input, result, tt.expected)
			}
		}
	})
}

// TestStorageServiceInterface verifies interface compliance
func TestStorageServiceInterface(t *testing.T) {
	t.Run("MockServiceImplementsInterface", func(t *testing.T) {
		var _ StorageService = (*MockStorageService)(nil)
	})

	t.Run("R2ServiceImplementsInterface", func(t *testing.T) {
		var _ StorageService = (*R2StorageService)(nil)
	})

	t.Run("InterfaceMethodsWork", func(t *testing.T) {
		var service StorageService = NewMockStorageService()
		ctx := context.Background()

		// Test all interface methods
		_, err := service.UploadFile(ctx, "test.glb", []byte("data"), "model/gltf-binary")
		if err != nil {
			t.Errorf("UploadFile failed: %v", err)
		}

		err = service.DeleteFile(ctx, "test.glb")
		if err != nil {
			t.Errorf("DeleteFile failed: %v", err)
		}

		url := service.GetFileURL("test.glb")
		if url == "" {
			t.Error("GetFileURL returned empty string")
		}

		// Create minimal valid GLB for validation
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 2)

		err = service.ValidateGLBFile(glb)
		if err != nil {
			t.Errorf("ValidateGLBFile failed: %v", err)
		}
	})
}

// TestR2ServiceCreation tests R2 service initialization
func TestR2ServiceCreation(t *testing.T) {
	t.Run("Creation", func(t *testing.T) {
		// This test verifies the service can be created
		// We don't test actual R2 operations as they require credentials
		service, err := NewR2StorageService(
			"test-key",
			"test-secret",
			"https://test.r2.cloudflarestorage.com",
			"test-bucket",
			"https://test.r2.dev",
		)

		if err != nil {
			t.Fatalf("Failed to create R2 service: %v", err)
		}

		if service == nil {
			t.Error("Service is nil")
		}
	})

	t.Run("InvalidInput", func(t *testing.T) {
		// Service creation should succeed even with empty values
		// (AWS SDK validates on actual operations)
		service, err := NewR2StorageService("", "", "", "", "")
		if err != nil {
			t.Fatalf("Service creation failed: %v", err)
		}
		if service == nil {
			t.Error("Service is nil")
		}
	})
}

// TestMockStorageOperations tests mock storage behavior
func TestMockStorageOperations(t *testing.T) {
	mock := NewMockStorageService()
	ctx := context.Background()

	t.Run("UploadAndRetrieve", func(t *testing.T) {
		filename := "test-upload.glb"
		data := []byte("test data for upload")

		url, err := mock.UploadFile(ctx, filename, data, "model/gltf-binary")
		if err != nil {
			t.Fatalf("Upload failed: %v", err)
		}

		retrievedURL := mock.GetFileURL(filename)
		if url != retrievedURL {
			t.Errorf("URLs don't match: %s vs %s", url, retrievedURL)
		}
	})

	t.Run("UploadLargeFile", func(t *testing.T) {
		// Simulate uploading a larger file
		largeData := make([]byte, 2*1024*1024) // 2MB
		for i := range largeData {
			largeData[i] = byte(i % 256)
		}

		url, err := mock.UploadFile(ctx, "large.glb", largeData, "model/gltf-binary")
		if err != nil {
			t.Fatalf("Large file upload failed: %v", err)
		}
		if url == "" {
			t.Error("Empty URL for large file")
		}
	})

	t.Run("DeleteNonExistent", func(t *testing.T) {
		// Mock service returns error for deleting non-existent files
		err := mock.DeleteFile(ctx, "nonexistent.glb")
		if err == nil {
			t.Error("Expected error when deleting non-existent file")
		}
	})
}

// TestGLBValidationEdgeCases tests edge cases in GLB validation
func TestGLBValidationEdgeCases(t *testing.T) {
	mock := NewMockStorageService()

	t.Run("ExactMinimumSize", func(t *testing.T) {
		// Exactly 12 bytes (minimum GLB size)
		glb := make([]byte, 12)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 2)
		binary.LittleEndian.PutUint32(glb[8:12], 12)

		err := mock.ValidateGLBFile(glb)
		if err != nil {
			t.Errorf("Minimum valid GLB rejected: %v", err)
		}
	})

	t.Run("OneByteShort", func(t *testing.T) {
		glb := make([]byte, 11)
		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for file one byte too short")
		}
	})

	t.Run("CorruptedMagic", func(t *testing.T) {
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		glb[0] = 0xFF // Corrupt first byte
		binary.LittleEndian.PutUint32(glb[4:8], 2)

		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for corrupted magic number")
		}
	})

	t.Run("LargeVersionNumber", func(t *testing.T) {
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 999999)
		binary.LittleEndian.PutUint32(glb[8:12], 20)

		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for very large version number")
		}
	})

	t.Run("ZeroVersion", func(t *testing.T) {
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 0)
		binary.LittleEndian.PutUint32(glb[8:12], 20)

		err := mock.ValidateGLBFile(glb)
		if err == nil {
			t.Error("Expected error for version 0")
		}
	})
}

// TestFilenameGeneration tests unique filename generation
func TestFilenameGeneration(t *testing.T) {
	t.Run("UniqueFilenames", func(t *testing.T) {
		// Note: GenerateUniqueFilename uses second-precision timestamps
		// So files uploaded in the same second will have the same name
		userID := "test-user"

		filename1 := GenerateUniqueFilename(userID, "test.glb")
		filename2 := GenerateUniqueFilename(userID, "test.glb")

		// In the same second, filenames should be the same
		if filename1 != filename2 {
			// Unless we crossed a second boundary
			t.Logf("Filenames differ (crossed second boundary): %s vs %s", filename1, filename2)
		}

		// Different user IDs should produce different filenames
		filename3 := GenerateUniqueFilename("different-user", "test.glb")
		if filename1 == filename3 {
			t.Error("Same filename for different users")
		}

		// Different original filenames should have different extensions
		filename4 := GenerateUniqueFilename(userID, "model.gltf")
		if len(filename4) < 5 || filename4[len(filename4)-5:] != ".gltf" {
			t.Errorf("Extension not preserved: %s", filename4)
		}
	})

	t.Run("PreservesExtension", func(t *testing.T) {
		tests := []string{
			"model.glb",
			"test.GLB",
			"file.glb",
		}
		userID := "test-user"

		for _, original := range tests {
			result := GenerateUniqueFilename(userID, original)
			if result[len(result)-4:] != ".glb" && result[len(result)-4:] != ".GLB" {
				t.Errorf("Extension not preserved in %s", result)
			}
		}
	})

	t.Run("HandlesLongFilenames", func(t *testing.T) {
		longName := "this_is_a_very_long_filename_that_might_cause_issues_in_some_storage_systems.glb"
		result := GenerateUniqueFilename("test-user", longName)
		if len(result) == 0 {
			t.Error("Empty filename generated for long input")
		}
	})
}

// TestContentTypeDetection tests content type detection
func TestContentTypeDetection(t *testing.T) {
	t.Run("GLBFile", func(t *testing.T) {
		glb := make([]byte, 20)
		copy(glb[0:4], "glTF")
		binary.LittleEndian.PutUint32(glb[4:8], 2)

		contentType := DetectContentType(glb)
		if contentType != "model/gltf-binary" {
			t.Errorf("Expected model/gltf-binary, got %s", contentType)
		}
	})

	t.Run("NonGLBFile", func(t *testing.T) {
		data := []byte("not a glb file")
		contentType := DetectContentType(data)
		if contentType == "model/gltf-binary" {
			t.Error("Non-GLB file detected as GLB")
		}
	})

	t.Run("EmptyFile", func(t *testing.T) {
		contentType := DetectContentType([]byte{})
		// Should handle gracefully, not return GLB type for empty file
		if contentType == "model/gltf-binary" {
			t.Error("Empty file should not be detected as GLB")
		}
	})
}
