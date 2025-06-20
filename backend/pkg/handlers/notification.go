package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"
)

type NotificationHandler struct {
	db *sql.DB
}

func NewNotificationHandler(db *sql.DB) *NotificationHandler {
	return &NotificationHandler{db: db}
}

// GetNotifications retrieves notifications for the current user
func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get pagination parameters
	page := 1
	limit := 20

	if pageParam := r.URL.Query().Get("page"); pageParam != "" {
		if p, err := strconv.Atoi(pageParam); err == nil && p > 0 {
			page = p
		}
	}

	if limitParam := r.URL.Query().Get("limit"); limitParam != "" {
		if l, err := strconv.Atoi(limitParam); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Get notifications
	notifications, err := models.GetUserNotifications(h.db, user.ID, page, limit)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve notifications")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, notifications)
}

// MarkNotificationAsRead marks a notification as read
func (h *NotificationHandler) MarkNotificationAsRead(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get notification ID from URL
	notificationIDParam := r.URL.Query().Get("id")
	notificationID, err := strconv.Atoi(notificationIDParam)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid notification ID")
		return
	}

	// Mark notification as read
	err = models.MarkNotificationAsRead(h.db, notificationID, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to mark notification as read")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Notification marked as read",
	})
}

// MarkAllNotificationsAsRead marks all notifications as read for the current user
func (h *NotificationHandler) MarkAllNotificationsAsRead(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Mark all notifications as read
	err := models.MarkAllNotificationsAsRead(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to mark notifications as read")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "All notifications marked as read",
	})
}

// GetUnreadCount gets the count of unread notifications
func (h *NotificationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get unread count
	count, err := models.GetUnreadNotificationCount(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get notification count")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"count": count,
	})
}
