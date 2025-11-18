package models

import (
	"time"

	"github.com/google/uuid"
)

// CustomGLB represents a user-uploaded 3D model file
type CustomGLB struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"userId"`
	Filename         string    `json:"filename"`         // Unique filename in storage
	OriginalFilename string    `json:"originalFilename"` // Original filename from upload
	FileSize         int64     `json:"fileSize"`         // Size in bytes
	StorageURL       string    `json:"storageUrl"`       // Public URL to access the file
	CreatedAt        time.Time `json:"createdAt"`
}

// NewCustomGLB creates a new custom GLB record
func NewCustomGLB(userID uuid.UUID, filename, originalFilename string, fileSize int64, storageURL string) *CustomGLB {
	return &CustomGLB{
		ID:               uuid.New(),
		UserID:           userID,
		Filename:         filename,
		OriginalFilename: originalFilename,
		FileSize:         fileSize,
		StorageURL:       storageURL,
		CreatedAt:        time.Now(),
	}
}

// IsOwnedBy returns true if the GLB belongs to the given user
func (g *CustomGLB) IsOwnedBy(userID uuid.UUID) bool {
	return g.UserID == userID
}
