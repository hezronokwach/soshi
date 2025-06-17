package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"

	"github.com/google/uuid"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// UploadFile handles file uploads
func (h *UploadHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	// Get file from form
	file, handler, err := r.FormFile("file")
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Failed to get file from form")
		return
	}
	defer file.Close()

	// Check file type
	contentType := handler.Header.Get("Content-Type")
	if !isAllowedFileType(contentType) {
		utils.RespondWithError(w, http.StatusBadRequest, "File type not allowed")
		return
	}

	// Create uploads directory if it doesn't exist
	uploadsDir := "./uploads"
	if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create uploads directory")
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s_%s", user.ID, uuid.New().String(), handler.Filename)
	filename = sanitizeFilename(filename)
	filepath := filepath.Join(uploadsDir, filename)

	// Create file
	dst, err := os.Create(filepath)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create file")
		return
	}
	defer dst.Close()

	// Copy file contents
	if _, err = io.Copy(dst, file); err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Return the full URL path for the uploaded file
	fileURL := fmt.Sprintf("/uploads/%s", filename)
	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"url": fileURL})
}

// isAllowedFileType checks if the file type is allowed
func isAllowedFileType(contentType string) bool {
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
	}
	return allowedTypes[contentType]
}

// sanitizeFilename sanitizes a filename
func sanitizeFilename(filename string) string {
	// Replace spaces with underscores
	filename = strings.ReplaceAll(filename, " ", "_")
	// Remove any characters that aren't alphanumeric, underscore, hyphen, or period
	filename = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' || r == '.' {
			return r
		}
		return -1
	}, filename)
	return filename
}
