package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"
	"github.com/hezronokwach/soshi/pkg/websocket"
)

type UserHandler struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewUserHandler(db *sql.DB, hub *websocket.Hub) *UserHandler {
	return &UserHandler{db: db, hub: hub}
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

// GetFollowing retrieves users that the current user is following
func (h *UserHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if requesting another user's following list
	userIDParam := chi.URLParam(r, "userID")
	var targetUserID int
	var err error

	if userIDParam != "" {
		targetUserID, err = strconv.Atoi(userIDParam)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
			return
		}
	} else {
		targetUserID = user.ID
	}

	// Get following list
	following, err := models.GetFollowing(h.db, targetUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve following")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, following)
}

// GetSuggestedUsers retrieves users that the current user might want to follow
func (h *UserHandler) GetSuggestedUsers(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get suggested users (users not followed by current user)
	suggestedUsers, err := models.GetSuggestedUsers(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve suggested users")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, suggestedUsers)
}

// GetOnlineUsers retrieves users that are currently online (connected via WebSocket)
func (h *UserHandler) GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get online user IDs from WebSocket hub
	onlineUserIDs := h.hub.GetOnlineUserIDs()

	// If no users are online, return empty array
	if len(onlineUserIDs) == 0 {
		utils.RespondWithJSON(w, http.StatusOK, []models.User{})
		return
	}

	// Filter out current user from online users
	var filteredUserIDs []int
	for _, userID := range onlineUserIDs {
		if userID != user.ID {
			filteredUserIDs = append(filteredUserIDs, userID)
		}
	}

	// If no other users are online, return empty array
	if len(filteredUserIDs) == 0 {
		utils.RespondWithJSON(w, http.StatusOK, []models.User{})
		return
	}

	// Get user details for online users
	onlineUsers, err := models.GetUsersByIDs(h.db, filteredUserIDs)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve online users")
		return
	}

	// Limit to 4 users for sidebar display
	if len(onlineUsers) > 4 {
		onlineUsers = onlineUsers[:4]
	}

	utils.RespondWithJSON(w, http.StatusOK, onlineUsers)
}

// GetFollowCounts retrieves follower and following counts for a user
func (h *UserHandler) GetFollowCounts(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if requesting another user's counts
	userIDParam := chi.URLParam(r, "userID")
	var targetUserID int
	var err error

	if userIDParam != "" {
		targetUserID, err = strconv.Atoi(userIDParam)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
			return
		}
	} else {
		targetUserID = user.ID
	}

	// Get follow counts
	counts, err := models.GetFollowCounts(h.db, targetUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve follow counts")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, counts)
}

// FollowUser handles following a user
func (h *UserHandler) FollowUser(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get user ID to follow from URL
	userIDParam := chi.URLParam(r, "userID")
	targetUserID, err := strconv.Atoi(userIDParam)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Follow the user
	err = models.FollowUser(h.db, user.ID, targetUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get the follow status to return
	status, err := models.IsFollowing(h.db, user.ID, targetUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get follow status")
		return
	}

	// Create notification for the followed user
	notificationMessage := user.FirstName + " " + user.LastName + " started following you"
	_, _ = models.CreateNotification(h.db, targetUserID, "follow", notificationMessage, user.ID)

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"status":  status,
		"message": "Follow request sent successfully",
	})
}

// UnfollowUser handles unfollowing a user
func (h *UserHandler) UnfollowUser(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get user ID to unfollow from URL
	userIDParam := chi.URLParam(r, "userID")
	targetUserID, err := strconv.Atoi(userIDParam)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Unfollow the user
	err = models.UnfollowUser(h.db, user.ID, targetUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"status":  "none",
		"message": "Successfully unfollowed user",
	})
}

// GetFollowStatus gets the follow status between current user and target user
func (h *UserHandler) GetFollowStatus(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get target user ID from URL
	userIDParam := chi.URLParam(r, "userID")
	targetUserID, err := strconv.Atoi(userIDParam)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get follow status
	status, err := models.IsFollowing(h.db, user.ID, targetUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get follow status")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status":  status,
		"is_self": user.ID == targetUserID,
	})
}

// CancelFollowRequest cancels a pending follow request
func (h *UserHandler) CancelFollowRequest(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get target user ID from URL
	userIDParam := chi.URLParam(r, "userID")
	targetUserID, err := strconv.Atoi(userIDParam)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Cancel follow request
	err = models.CancelFollowRequest(h.db, user.ID, targetUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"status":  "none",
		"message": "Follow request cancelled",
	})
}
