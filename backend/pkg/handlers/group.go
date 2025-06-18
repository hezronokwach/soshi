package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"

	"github.com/go-chi/chi/v5"
)

type GroupHandler struct {
	db *sql.DB
}

func NewGroupHandler(db *sql.DB) *GroupHandler {
	return &GroupHandler{db: db}
}

// GetGroups retrieves all groups
func (h *GroupHandler) GetGroups(w http.ResponseWriter, r *http.Request) {
	// Get groups
	groups, err := models.GetAllGroups(h.db)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve groups")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, groups)
}

// CreateGroup creates a new group
func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse request body
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Avatar      string `json:"avatar"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields
	if req.Title == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Title is required")
		return
	}

	// Validate category (set default if empty or invalid)
	validCategories := []string{
		"Technology", "Art", "Travel", "Photography", "Books",
		"Music", "Sports", "General", "Food", "Business",
		"Education", "Health", "Other",
	}

	categoryValid := false
	for _, valid := range validCategories {
		if req.Category == valid {
			categoryValid = true
			break
		}
	}

	if !categoryValid {
		req.Category = "General" // Default to Other if invalid or empty category
	}

	// Create group
	groupId, err := models.CreateGroup(h.db, req.Title, req.Description, req.Category, req.Avatar, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create group")
		return
	}

	// Get created group
	group, err := models.GetGroupById(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve created group")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, group)
}

// GetGroup retrieves a group by ID
func (h *GroupHandler) GetGroup(w http.ResponseWriter, r *http.Request) {
	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Get group
	group, err := models.GetGroupById(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve group")
		return
	}
	if group == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Group not found")
		return
	}

	// Get group members
	members, err := models.GetGroupMembers(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve group members")
		return
	}
	group.Members = members

	utils.RespondWithJSON(w, http.StatusOK, group)
}

// UpdateGroup updates a group
func (h *GroupHandler) UpdateGroup(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Check if user is the group creator
	group, err := models.GetGroupById(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve group")
		return
	}
	if group == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Group not found")
		return
	}
	if group.CreatorID != user.ID {
		utils.RespondWithError(w, http.StatusForbidden, "Only the group creator can update the group")
		return
	}

	// Parse request body
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Avatar      string `json:"avatar"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields
	if req.Title == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Title is required")
		return
	}

	// Validate category (set default if empty or invalid)
	validCategories := []string{
		"Technology", "Art", "Travel", "Photography", "Books",
		"Music", "Sports", "General", "Food", "Business",
		"Education", "Health", "Other",
	}

	categoryValid := false
	for _, valid := range validCategories {
		if req.Category == valid {
			categoryValid = true
			break
		}
	}

	if !categoryValid {
		req.Category = "General" // Default to General if invalid or empty category
	}

	// Update group
	_, err = h.db.Exec(
		"UPDATE groups SET title = ?, description = ?, category = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		req.Title, req.Description, req.Category, req.Avatar, groupId,
	)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update group")
		return
	}

	// Get updated group
	updatedGroup, err := models.GetGroupById(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve updated group")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedGroup)
}

// DeleteGroup deletes a group
func (h *GroupHandler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Check if user is the group creator
	group, err := models.GetGroupById(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve group")
		return
	}
	if group == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Group not found")
		return
	}
	if group.CreatorID != user.ID {
		utils.RespondWithError(w, http.StatusForbidden, "Only the group creator can delete the group")
		return
	}

	// Delete group
	_, err = h.db.Exec("DELETE FROM groups WHERE id = ?", groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete group")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Group deleted successfully"})
}

// JoinGroup handles a user joining a group
func (h *GroupHandler) JoinGroup(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Parse request body
	var req struct {
		InvitedBy *int `json:"invited_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Join group
	err = models.JoinGroup(h.db, groupId, user.ID, req.InvitedBy)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create notification for group creator if it's a join request
	if req.InvitedBy == nil {
		group, err := models.GetGroupById(h.db, groupId)
		if err == nil && group != nil {
			_, _ = models.CreateNotification(
				h.db,
				group.CreatorID,
				"group_join_request",
				user.FirstName+" "+user.LastName+" has requested to join your group",
				user.ID,
			)
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Join request sent successfully"})
}

// LeaveGroup handles a user leaving a group
func (h *GroupHandler) LeaveGroup(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Leave group
	err = models.LeaveGroup(h.db, groupId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Left group successfully"})
}

// UpdateMember updates a member's status in a group
func (h *GroupHandler) UpdateMember(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID and user ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	memberIdStr := chi.URLParam(r, "userID")
	memberId, err := strconv.Atoi(memberIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Check if user is the group creator
	group, err := models.GetGroupById(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve group")
		return
	}
	if group == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Group not found")
		return
	}

	// Parse request body
	var req struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate status
	if req.Status != "accepted" && req.Status != "declined" {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid status")
		return
	}

	// Check if this is a join request or an invitation response
	var invitedBy *int
	var status string
	err = h.db.QueryRow(
		"SELECT invited_by, status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, memberId,
	).Scan(&invitedBy, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, http.StatusNotFound, "Member not found")
		} else {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve member")
		}
		return
	}

	// Handle based on whether it's a join request or invitation response
	if invitedBy == nil {
		// It's a join request, only group creator can respond
		if group.CreatorID != user.ID {
			utils.RespondWithError(w, http.StatusForbidden, "Only the group creator can respond to join requests")
			return
		}
		err = models.RespondToGroupRequest(h.db, groupId, memberId, req.Status, user.ID)
	} else if *invitedBy != 0 && memberId == user.ID {
		// It's an invitation response from the invited user
		err = models.RespondToGroupInvitation(h.db, groupId, user.ID, req.Status)
	} else {
		utils.RespondWithError(w, http.StatusForbidden, "Unauthorized to update this member")
		return
	}

	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create notification for the member if request was accepted
	if req.Status == "accepted" {
		_, _ = models.CreateNotification(
			h.db,
			memberId,
			"group_request_accepted",
			"Your request to join the group has been accepted",
			groupId,
		)
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Member status updated successfully"})
}

// RemoveMember removes a member from a group
func (h *GroupHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID and user ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	memberIdStr := chi.URLParam(r, "userID")
	memberId, err := strconv.Atoi(memberIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Check if user is the group creator
	group, err := models.GetGroupById(h.db, groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve group")
		return
	}
	if group == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Group not found")
		return
	}
	if group.CreatorID != user.ID {
		utils.RespondWithError(w, http.StatusForbidden, "Only the group creator can remove members")
		return
	}

	// Remove member
	_, err = h.db.Exec(
		"DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, memberId,
	)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to remove member")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Member removed successfully"})
}

// GetPosts retrieves posts in a group
func (h *GroupHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Parse query parameters
	page := 1
	limit := 10

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	// Get posts
	posts, err := models.GetGroupPosts(h.db, groupId, user.ID, page, limit)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, posts)
}

// CreatePost creates a new post in a group
func (h *GroupHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Parse request body
	var req struct {
		Content  string `json:"content"`
		ImageURL string `json:"image_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields
	if req.Content == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Content is required")
		return
	}

	// Create post
	postId, err := models.CreateGroupPost(h.db, groupId, user.ID, req.Content, req.ImageURL)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]int{"id": postId})
}

// GetEvents retrieves events in a group
func (h *GroupHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Get events
	events, err := models.GetGroupEvents(h.db, groupId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, events)
}

// CreateEvent creates a new event in a group
func (h *GroupHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group ID from URL
	groupIdStr := chi.URLParam(r, "groupID")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Parse request body
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		EventDate   string `json:"event_date"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields
	if req.Title == "" || req.EventDate == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Title and event date are required")
		return
	}

	// Parse event date
	eventDate, err := time.Parse(time.RFC3339, req.EventDate)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid event date format")
		return
	}

	// Create event
	eventId, err := models.CreateGroupEvent(h.db, groupId, user.ID, req.Title, req.Description, eventDate)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Notify all group members about the new event
	members, err := models.GetGroupMembers(h.db, groupId)
	if err == nil {
		for _, member := range members {
			if member.Status == "accepted" && member.UserID != user.ID {
				_, _ = models.CreateNotification(
					h.db,
					member.UserID,
					"group_event_created",
					"A new event has been created in a group you're a member of",
					eventId,
				)
			}
		}
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]int{"id": eventId})
}

// RespondToEvent handles a user responding to an event
func (h *GroupHandler) RespondToEvent(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get event ID from URL
	eventIdStr := chi.URLParam(r, "eventID")
	eventId, err := strconv.Atoi(eventIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	// Parse request body
	var req struct {
		Response string `json:"response"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate response
	if req.Response != "going" && req.Response != "not_going" {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid response")
		return
	}

	// Respond to event
	err = models.RespondToEvent(h.db, eventId, user.ID, req.Response)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Response recorded successfully"})
}
