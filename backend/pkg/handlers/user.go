package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"
)

type UserHandler struct {
	db *sql.DB
}

func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{db: db}
}

// GetFollowers retrieves users who are following the specified user
func (h *UserHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get followers
	followers, err := models.GetFollowers(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve followers")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, followers)
}

// GetProfile retrieves user profile information
func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if requesting another user's profile
	userIDParam := chi.URLParam(r, "userID")
	var targetUserID int
	var err error

	if userIDParam != "" {
		// Requesting another user's profile
		targetUserID, err = strconv.Atoi(userIDParam)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
			return
		}
	} else {
		// Requesting own profile
		targetUserID = user.ID
	}

	// Get user profile
	profile, err := models.GetUserById(h.db, targetUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve profile")
		}
		return
	}

	// If requesting another user's profile, check privacy
	if targetUserID != user.ID && !profile.IsPublic {
		utils.RespondWithError(w, http.StatusForbidden, "Profile is private")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, profile)
}

// UpdateProfile updates user profile information
func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var updateData models.User
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Update user profile
	updateData.ID = user.ID
	if err := models.UpdateUser(h.db, &updateData); err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Get updated profile
	updatedProfile, err := models.GetUserById(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve updated profile")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedProfile)
}

// UpdateProfilePrivacy updates user profile privacy setting
func (h *UserHandler) UpdateProfilePrivacy(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var privacyData struct {
		IsPublic bool `json:"is_public"`
	}

	if err := json.NewDecoder(r.Body).Decode(&privacyData); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Update privacy setting
	_, err := h.db.Exec(`
		INSERT OR REPLACE INTO user_profiles (user_id, is_public, updated_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
	`, user.ID, privacyData.IsPublic)

	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update privacy setting")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":   true,
		"is_public": privacyData.IsPublic,
	})
}
