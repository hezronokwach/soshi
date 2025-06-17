package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"
)

type ActivityHandler struct {
	db *sql.DB
}

func NewActivityHandler(db *sql.DB) *ActivityHandler {
	return &ActivityHandler{db: db}
}

// GetUserActivities retrieves user's activity with filtering options
func (h *ActivityHandler) GetUserActivities(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if requesting another user's activities
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

	// Parse query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 50 {
		limit = 20
	}

	// Parse filters
	filters := make(map[string]interface{})
	
	// Activity types filter
	if activityTypesParam := r.URL.Query().Get("types"); activityTypesParam != "" {
		activityTypes := strings.Split(activityTypesParam, ",")
		filters["activity_types"] = activityTypes
	}

	// Show hidden filter (only for own activities)
	if targetUserID == user.ID {
		showHidden := r.URL.Query().Get("show_hidden") == "true"
		filters["show_hidden"] = showHidden
	}

	// Get activities
	activities, err := models.GetUserActivities(h.db, targetUserID, filters, page, limit)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve activities")
		return
	}

	// If viewing another user's activities, filter based on their privacy settings
	if targetUserID != user.ID {
		activities, err = h.filterActivitiesByPrivacy(activities, targetUserID, user.ID)
		if err != nil {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to filter activities")
			return
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"activities": activities,
		"page":       page,
		"limit":      limit,
		"total":      len(activities),
	})
}

// GetUserPosts retrieves all posts by a user
func (h *ActivityHandler) GetUserPosts(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if requesting another user's posts
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

	// Parse query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 50 {
		limit = 20
	}

	// Get user posts
	posts, err := models.GetUserPosts(h.db, targetUserID, page, limit)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve posts")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"posts": posts,
		"page":  page,
		"limit": limit,
		"total": len(posts),
	})
}

// HideActivity hides an activity from user's activity feed
func (h *ActivityHandler) HideActivity(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get activity ID from URL
	activityIDParam := chi.URLParam(r, "activityID")
	activityID, err := strconv.Atoi(activityIDParam)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid activity ID")
		return
	}

	// Hide the activity
	err = models.HideActivity(h.db, activityID, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to hide activity")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Activity hidden successfully",
	})
}

// UnhideActivity unhides an activity in user's activity feed
func (h *ActivityHandler) UnhideActivity(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get activity ID from URL
	activityIDParam := chi.URLParam(r, "activityID")
	activityID, err := strconv.Atoi(activityIDParam)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid activity ID")
		return
	}

	// Unhide the activity
	err = models.UnhideActivity(h.db, activityID, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to unhide activity")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Activity unhidden successfully",
	})
}

// GetActivitySettings retrieves user's activity display settings
func (h *ActivityHandler) GetActivitySettings(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	settings, err := models.GetActivitySettings(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve activity settings")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, settings)
}

// UpdateActivitySettings updates user's activity display settings
func (h *ActivityHandler) UpdateActivitySettings(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var settings models.ActivitySettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Set user ID
	settings.UserID = user.ID

	// Update settings
	err := models.UpdateActivitySettings(h.db, user.ID, settings)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update activity settings")
		return
	}

	// Get updated settings
	updatedSettings, err := models.GetActivitySettings(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve updated settings")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedSettings)
}

// Helper function to filter activities based on user's privacy settings
func (h *ActivityHandler) filterActivitiesByPrivacy(activities []models.Activity, targetUserID int, viewerUserID int) ([]models.Activity, error) {
	// Get target user's activity settings
	settings, err := models.GetActivitySettings(h.db, targetUserID)
	if err != nil {
		return activities, err // Return original activities if we can't get settings
	}

	// If user restricts to followers only, check if viewer is a follower
	if settings.ShowToFollowersOnly && targetUserID != viewerUserID {
		var isFollower bool
		err := h.db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = ? AND status = 'accepted'
			)
		`, viewerUserID, targetUserID).Scan(&isFollower)
		
		if err != nil || !isFollower {
			return []models.Activity{}, nil // Return empty if not a follower
		}
	}

	// Filter activities based on settings
	var filteredActivities []models.Activity
	for _, activity := range activities {
		shouldShow := false

		switch activity.ActivityType {
		case "post_created":
			shouldShow = settings.ShowPosts
		case "comment_created":
			shouldShow = settings.ShowComments
		case "post_liked", "post_disliked", "comment_liked", "comment_disliked":
			shouldShow = settings.ShowLikes
		default:
			shouldShow = true // Show unknown activity types by default
		}

		if shouldShow {
			filteredActivities = append(filteredActivities, activity)
		}
	}

	return filteredActivities, nil
}
