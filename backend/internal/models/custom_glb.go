package models

import (
	"time"

	"github.com/google/uuid"
)

// CustomGLB represents a user-uploaded 3D model file
type CustomGLB struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"userId"`
	Name          string    `json:"name" validate:"required,min=1,max=100"`
	Category      string    `json:"category" validate:"required,oneof=monitors desks keyboards mousepads mice other"`
	FilePath      string    `json:"filePath"`      // R2 object key
	FileSize      int64     `json:"fileSize"`      // Size in bytes
	ThumbnailPath *string   `json:"thumbnailPath,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
}

// NewCustomGLB creates a new custom GLB record
func NewCustomGLB(userID uuid.UUID, name, category, filePath string, fileSize int64) *CustomGLB {
	return &CustomGLB{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      name,
		Category:  category,
		FilePath:  filePath,
		FileSize:  fileSize,
		CreatedAt: time.Now(),
	}
}

// SetThumbnail sets the thumbnail path
func (g *CustomGLB) SetThumbnail(path string) {
	g.ThumbnailPath = &path
}

// IsOwnedBy returns true if the GLB belongs to the given user
func (g *CustomGLB) IsOwnedBy(userID uuid.UUID) bool {
	return g.UserID == userID
}

// ValidCategories returns the list of valid GLB categories
func ValidCategories() []string {
	return []string{
		"monitors",
		"desks",
		"keyboards",
		"mousepads",
		"mice",
		"other",
	}
}

// IsValidCategory returns true if the category is valid
func IsValidCategory(category string) bool {
	for _, valid := range ValidCategories() {
		if category == valid {
			return true
		}
	}
	return false
}
