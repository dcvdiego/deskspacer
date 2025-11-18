package graph

import (
	"encoding/base64"
	"fmt"

	"github.com/dcvdiego/deskspacer/backend/internal/middleware"
	"github.com/dcvdiego/deskspacer/backend/internal/models"
	"github.com/dcvdiego/deskspacer/backend/internal/service"
	"github.com/google/uuid"
	"github.com/graphql-go/graphql"
)

// ====================
// Custom GLB Query Resolvers
// ====================

// MyCustomGLBs returns all custom GLBs owned by the authenticated user
func (r *Resolver) MyCustomGLBs(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, fmt.Errorf("authentication required")
	}

	// Check if user is premium
	if !user.IsPremium {
		return nil, fmt.Errorf("premium membership required for custom GLB uploads")
	}

	// Get all custom GLBs for user
	glbs, err := r.customGLBRepo.GetAllByUserID(params.Context, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve custom GLBs: %v", err)
	}

	// Convert to response format
	result := make([]map[string]interface{}, len(glbs))
	for i, glb := range glbs {
		result[i] = map[string]interface{}{
			"id":               glb.ID,
			"userID":           glb.UserID,
			"filename":         glb.Filename,
			"originalFilename": glb.OriginalFilename,
			"fileSize":         glb.FileSize,
			"storageURL":       glb.StorageURL,
			"createdAt":        glb.CreatedAt,
		}
	}

	return result, nil
}

// CustomGLB returns a specific custom GLB by ID
func (r *Resolver) CustomGLB(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, fmt.Errorf("authentication required")
	}

	// Parse GLB ID
	glbID, ok := params.Args["id"].(uuid.UUID)
	if !ok {
		return nil, fmt.Errorf("invalid GLB ID")
	}

	// Get GLB from database
	glb, err := r.customGLBRepo.GetByID(params.Context, glbID, user.ID)
	if err != nil {
		if err == models.ErrGLBNotFound {
			return nil, fmt.Errorf("custom GLB not found")
		}
		return nil, fmt.Errorf("failed to retrieve custom GLB: %v", err)
	}

	return map[string]interface{}{
		"id":               glb.ID,
		"userID":           glb.UserID,
		"filename":         glb.Filename,
		"originalFilename": glb.OriginalFilename,
		"fileSize":         glb.FileSize,
		"storageURL":       glb.StorageURL,
		"createdAt":        glb.CreatedAt,
	}, nil
}

// ====================
// Custom GLB Mutation Resolvers
// ====================

// UploadCustomGLB handles uploading a custom GLB file
func (r *Resolver) UploadCustomGLB(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, fmt.Errorf("authentication required")
	}

	// Check if user is premium
	if !user.IsPremium {
		return nil, fmt.Errorf("premium membership required for custom GLB uploads")
	}

	// Parse arguments
	originalFilename, ok := params.Args["filename"].(string)
	if !ok || originalFilename == "" {
		return nil, fmt.Errorf("filename is required")
	}

	fileDataBase64, ok := params.Args["fileData"].(string)
	if !ok || fileDataBase64 == "" {
		return nil, fmt.Errorf("fileData is required")
	}

	// Decode base64 file data
	fileData, err := base64.StdEncoding.DecodeString(fileDataBase64)
	if err != nil {
		return nil, fmt.Errorf("invalid file data: must be base64 encoded")
	}

	// Validate file size
	err = service.ValidateFileSize(int64(len(fileData)), r.config.GLBSizeLimit)
	if err != nil {
		return nil, fmt.Errorf("file size validation failed: %v", err)
	}

	// Validate GLB file format
	err = r.storageService.ValidateGLBFile(fileData)
	if err != nil {
		return nil, fmt.Errorf("file validation failed: %v", err)
	}

	// Check GLB count limit
	glbCount, err := r.customGLBRepo.CountByUserID(params.Context, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check GLB count: %v", err)
	}

	if glbCount >= r.config.GLBLimitPremium {
		return nil, fmt.Errorf("GLB limit reached: maximum %d files allowed", r.config.GLBLimitPremium)
	}

	// Check total storage limit
	totalStorage, err := r.customGLBRepo.GetTotalSizeByUserID(params.Context, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check storage usage: %v", err)
	}

	if totalStorage+int64(len(fileData)) > r.config.GLBTotalStorageLimit {
		return nil, fmt.Errorf("storage limit exceeded: maximum %s allowed", service.FormatFileSize(r.config.GLBTotalStorageLimit))
	}

	// Generate unique filename
	filename := service.GenerateUniqueFilename(user.ID.String(), originalFilename)

	// Detect content type
	contentType := service.DetectContentType(fileData)

	// Upload file to storage
	storageURL, err := r.storageService.UploadFile(params.Context, filename, fileData, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %v", err)
	}

	// Create database record
	glb := models.NewCustomGLB(user.ID, filename, originalFilename, int64(len(fileData)), storageURL)
	err = r.customGLBRepo.Create(params.Context, glb)
	if err != nil {
		// Try to delete uploaded file on database error
		_ = r.storageService.DeleteFile(params.Context, filename)
		return nil, fmt.Errorf("failed to save GLB record: %v", err)
	}

	return map[string]interface{}{
		"id":               glb.ID,
		"userID":           glb.UserID,
		"filename":         glb.Filename,
		"originalFilename": glb.OriginalFilename,
		"fileSize":         glb.FileSize,
		"storageURL":       glb.StorageURL,
		"createdAt":        glb.CreatedAt,
	}, nil
}

// DeleteCustomGLB handles deleting a custom GLB file
func (r *Resolver) DeleteCustomGLB(params graphql.ResolveParams) (interface{}, error) {
	// Get authenticated user from context
	user, ok := middleware.GetUserIDFromContext(params.Context)
	if !ok {
		return nil, fmt.Errorf("authentication required")
	}

	// Parse GLB ID
	glbID, ok := params.Args["id"].(uuid.UUID)
	if !ok {
		return nil, fmt.Errorf("invalid GLB ID")
	}

	// Get GLB from database to verify ownership and get filename
	glb, err := r.customGLBRepo.GetByID(params.Context, glbID, user.ID)
	if err != nil {
		if err == models.ErrGLBNotFound {
			return false, fmt.Errorf("custom GLB not found")
		}
		return false, fmt.Errorf("failed to retrieve custom GLB: %v", err)
	}

	// Delete from storage
	err = r.storageService.DeleteFile(params.Context, glb.Filename)
	if err != nil {
		// Log error but continue with database deletion
		fmt.Printf("Failed to delete file from storage: %v\n", err)
	}

	// Delete from database
	err = r.customGLBRepo.Delete(params.Context, glbID, user.ID)
	if err != nil {
		return false, fmt.Errorf("failed to delete GLB record: %v", err)
	}

	return true, nil
}
