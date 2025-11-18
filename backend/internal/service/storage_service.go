package service

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

// StorageService defines the interface for file storage operations
type StorageService interface {
	UploadFile(ctx context.Context, filename string, data []byte, contentType string) (string, error)
	DeleteFile(ctx context.Context, filename string) error
	GetFileURL(filename string) string
	ValidateGLBFile(data []byte) error
}

// R2StorageService implements StorageService using Cloudflare R2
type R2StorageService struct {
	s3Client  *s3.S3
	bucket    string
	publicURL string
}

// NewR2StorageService creates a new Cloudflare R2 storage service
func NewR2StorageService(accountID, accessKeyID, secretAccessKey, bucketName, publicURL string) (*R2StorageService, error) {
	// Cloudflare R2 endpoint
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)

	// Create AWS session configured for Cloudflare R2
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String("auto"),
		Endpoint:    aws.String(endpoint),
		Credentials: credentials.NewStaticCredentials(accessKeyID, secretAccessKey, ""),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create R2 session: %w", err)
	}

	return &R2StorageService{
		s3Client:  s3.New(sess),
		bucket:    bucketName,
		publicURL: publicURL,
	}, nil
}

// UploadFile uploads a file to R2 storage
func (s *R2StorageService) UploadFile(ctx context.Context, filename string, data []byte, contentType string) (string, error) {
	// Validate filename
	if filename == "" {
		return "", fmt.Errorf("filename is required")
	}

	// Sanitize filename (remove path traversal attempts)
	filename = sanitizeFilename(filename)

	// Calculate MD5 hash for integrity
	hash := md5.Sum(data)
	md5Hash := hex.EncodeToString(hash[:])

	// Upload to R2
	_, err := s.s3Client.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(filename),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
		Metadata: map[string]*string{
			"md5": aws.String(md5Hash),
		},
	})
	if err != nil {
		slog.Error("Failed to upload file to R2", "error", err, "filename", filename)
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	slog.Info("File uploaded to R2", "filename", filename, "size", len(data), "md5", md5Hash)

	// Return the public URL
	return s.GetFileURL(filename), nil
}

// DeleteFile deletes a file from R2 storage
func (s *R2StorageService) DeleteFile(ctx context.Context, filename string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	filename = sanitizeFilename(filename)

	_, err := s.s3Client.DeleteObjectWithContext(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(filename),
	})
	if err != nil {
		slog.Error("Failed to delete file from R2", "error", err, "filename", filename)
		return fmt.Errorf("failed to delete file: %w", err)
	}

	slog.Info("File deleted from R2", "filename", filename)
	return nil
}

// GetFileURL returns the public URL for a file
func (s *R2StorageService) GetFileURL(filename string) string {
	return fmt.Sprintf("%s/%s", strings.TrimSuffix(s.publicURL, "/"), filename)
}

// ValidateGLBFile validates that the file is a valid GLB file
func (s *R2StorageService) ValidateGLBFile(data []byte) error {
	if len(data) == 0 {
		return fmt.Errorf("file is empty")
	}

	// Check GLB magic number (glTF 2.0 binary)
	// GLB files start with: 0x676C5446 (ASCII: "glTF")
	if len(data) < 12 {
		return fmt.Errorf("file too small to be a valid GLB")
	}

	// Check magic number
	magic := string(data[0:4])
	if magic != "glTF" {
		return fmt.Errorf("invalid GLB file: missing glTF magic number")
	}

	// Check version (should be 2)
	version := uint32(data[4]) | uint32(data[5])<<8 | uint32(data[6])<<16 | uint32(data[7])<<24
	if version != 2 {
		return fmt.Errorf("unsupported GLB version: %d (expected 2)", version)
	}

	slog.Debug("GLB file validated", "size", len(data), "version", version)
	return nil
}

// MockStorageService implements StorageService for testing
type MockStorageService struct {
	Files map[string][]byte // filename -> data
}

// NewMockStorageService creates a new mock storage service
func NewMockStorageService() *MockStorageService {
	return &MockStorageService{
		Files: make(map[string][]byte),
	}
}

// UploadFile simulates uploading a file
func (m *MockStorageService) UploadFile(ctx context.Context, filename string, data []byte, contentType string) (string, error) {
	if filename == "" {
		return "", fmt.Errorf("filename is required")
	}

	filename = sanitizeFilename(filename)
	m.Files[filename] = data

	slog.Info("Mock: File uploaded", "filename", filename, "size", len(data))
	return fmt.Sprintf("https://mock-storage.test/%s", filename), nil
}

// DeleteFile simulates deleting a file
func (m *MockStorageService) DeleteFile(ctx context.Context, filename string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	filename = sanitizeFilename(filename)

	if _, exists := m.Files[filename]; !exists {
		return fmt.Errorf("file not found: %s", filename)
	}

	delete(m.Files, filename)
	slog.Info("Mock: File deleted", "filename", filename)
	return nil
}

// GetFileURL returns a mock URL for a file
func (m *MockStorageService) GetFileURL(filename string) string {
	return fmt.Sprintf("https://mock-storage.test/%s", filename)
}

// ValidateGLBFile validates GLB file format
func (m *MockStorageService) ValidateGLBFile(data []byte) error {
	// Use same validation as R2 service
	if len(data) == 0 {
		return fmt.Errorf("file is empty")
	}

	if len(data) < 12 {
		return fmt.Errorf("file too small to be a valid GLB")
	}

	magic := string(data[0:4])
	if magic != "glTF" {
		return fmt.Errorf("invalid GLB file: missing glTF magic number")
	}

	version := uint32(data[4]) | uint32(data[5])<<8 | uint32(data[6])<<16 | uint32(data[7])<<24
	if version != 2 {
		return fmt.Errorf("unsupported GLB version: %d (expected 2)", version)
	}

	return nil
}

// Helper functions

// sanitizeFilename removes dangerous characters from filename
func sanitizeFilename(filename string) string {
	// Remove path separators
	filename = strings.ReplaceAll(filename, "/", "")
	filename = strings.ReplaceAll(filename, "\\", "")
	filename = strings.ReplaceAll(filename, "..", "")

	// Trim whitespace
	filename = strings.TrimSpace(filename)

	return filename
}

// GenerateUniqueFilename generates a unique filename with timestamp
func GenerateUniqueFilename(userID, originalFilename string) string {
	timestamp := time.Now().Unix()
	// Keep only the extension
	ext := ""
	if idx := strings.LastIndex(originalFilename, "."); idx != -1 {
		ext = originalFilename[idx:]
	}
	return fmt.Sprintf("%s_%d%s", userID, timestamp, ext)
}

// DetectContentType detects the MIME type of the file
func DetectContentType(data []byte) string {
	// For GLB files, always return model/gltf-binary
	if len(data) >= 4 && string(data[0:4]) == "glTF" {
		return "model/gltf-binary"
	}

	// Fallback to http.DetectContentType
	contentType := http.DetectContentType(data)
	return contentType
}

// ValidateFileSize checks if file size is within limits
func ValidateFileSize(size int64, maxSize int64) error {
	if size == 0 {
		return fmt.Errorf("file is empty")
	}

	if size > maxSize {
		return fmt.Errorf("file size %d bytes exceeds maximum allowed size of %d bytes", size, maxSize)
	}

	return nil
}

// FormatFileSize formats bytes to human-readable format
func FormatFileSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
