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

type MessageHandler struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewMessageHandler(db *sql.DB, hub *websocket.Hub) *MessageHandler {
	return &MessageHandler{db: db, hub: hub}
}

// SendPrivateMessage handles sending a private message
func (h *MessageHandler) SendPrivateMessage(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get recipient user ID from URL
	recipientIDStr := chi.URLParam(r, "userID")
	recipientID, err := strconv.Atoi(recipientIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Parse request body
	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Content == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Message content cannot be empty")
		return
	}

	// Create message
	message, err := models.CreatePrivateMessage(h.db, user.ID, recipientID, req.Content)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create message")
		return
	}

	// Broadcast message via WebSocket for real-time delivery
	h.broadcastMessage(message)

	utils.RespondWithJSON(w, http.StatusCreated, message)
}

// GetPrivateMessages retrieves messages between current user and another user
func (h *MessageHandler) GetPrivateMessages(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get other user ID from URL
	otherUserIDStr := chi.URLParam(r, "userID")
	otherUserID, err := strconv.Atoi(otherUserIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get pagination parameters
	page := 1
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 50
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Get messages
	messages, err := models.GetPrivateMessages(h.db, user.ID, otherUserID, page, limit)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve messages")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, messages)
}

// GetConversations retrieves all conversations for the current user
func (h *MessageHandler) GetConversations(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get conversations
	conversations, err := models.GetUserConversations(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve conversations")
		return
	}

	// Add online status to conversations
	for i := range conversations {
		conversations[i].IsOnline = h.hub.IsUserOnline(conversations[i].User.ID)
	}

	utils.RespondWithJSON(w, http.StatusOK, conversations)
}

// GetUnreadCount returns the count of unread messages for the current user
func (h *MessageHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get unread count from database
	var count int
	err := h.db.QueryRow(`
		SELECT COUNT(*) FROM messages
		WHERE receiver_id = ? AND is_read = 0
	`, user.ID).Scan(&count)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get unread count")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]int{"count": count})
}

// MarkMessagesAsRead marks messages as read
func (h *MessageHandler) MarkMessagesAsRead(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get other user ID from URL
	otherUserIDStr := chi.URLParam(r, "userID")
	otherUserID, err := strconv.Atoi(otherUserIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Mark messages as read
	err = models.MarkMessagesAsRead(h.db, user.ID, otherUserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to mark messages as read")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// GetUnreadMessageCount gets the total unread message count for the current user
func (h *MessageHandler) GetUnreadMessageCount(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get unread count
	count, err := models.GetUnreadMessageCount(h.db, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get unread message count")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]int{"count": count})
}

// broadcastMessage sends a message via WebSocket to connected clients
func (h *MessageHandler) broadcastMessage(message *models.Message) {
	// Create WebSocket message
	wsMessage := map[string]interface{}{
		"type":      "private_message",
		"sender_id": float64(message.SenderID),
		"message":   message,
	}

	// Add recipient_id if it exists (for private messages)
	if message.ReceiverID != nil {
		wsMessage["recipient_id"] = float64(*message.ReceiverID)
	}

	messageBytes, err := json.Marshal(wsMessage)
	if err != nil {
		return
	}

	// Send to WebSocket hub for broadcasting
	h.hub.SendMessage(messageBytes)
}
