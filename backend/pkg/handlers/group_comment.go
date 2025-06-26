package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"
)

type GroupCommentHandler struct {
	db *sql.DB
}

func NewGroupCommentHandler(db *sql.DB) *GroupCommentHandler {
	return &GroupCommentHandler{db: db}
}

// GetGroupPostComments retrieves comments for a group post
func (h *GroupCommentHandler) GetGroupPostComments(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group post ID from URL
	groupPostIdStr := chi.URLParam(r, "groupPostID")
	groupPostId, err := strconv.Atoi(groupPostIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group post ID")
		return
	}

	// Parse query parameters
	options := make(map[string]interface{})

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			options["page"] = page
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			options["limit"] = limit
		}
	}

	if parentIdStr := r.URL.Query().Get("parent_id"); parentIdStr != "" {
		if parentIdStr == "null" || parentIdStr == "" {
			options["parentId"] = nil
		} else if parentId, err := strconv.Atoi(parentIdStr); err == nil {
			options["parentId"] = &parentId
		}
	}

	comments, err := models.GetGroupPostComments(h.db, groupPostId, user.ID, options)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Log comment data for debugging and enhance with user data
	for i := range comments {
		if comments[i].ImageURL != "" {
			log.Printf("Group Comment %d - Image URL: %s, ParentID: %v", comments[i].ID, comments[i].ImageURL, comments[i].ParentID)
		}
		// Ensure ParentID is properly set
		if comments[i].ParentID != nil && *comments[i].ParentID == 0 {
			comments[i].ParentID = nil
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, comments)
}

// CreateGroupPostComment creates a new comment on a group post
func (h *GroupCommentHandler) CreateGroupPostComment(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get group post ID from URL
	groupPostIdStr := chi.URLParam(r, "groupPostID")
	groupPostId, err := strconv.Atoi(groupPostIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid group post ID")
		return
	}

	// Parse request body
	var req struct {
		Content  string `json:"content"`
		ImageURL string `json:"image_url"`
		ParentID *int   `json:"parent_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields - either content or image is required
	if req.Content == "" && req.ImageURL == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Content or image is required")
		return
	}

	// Create comment
	comment := models.GroupPostComment{
		GroupPostID: groupPostId,
		UserID:      user.ID,
		ParentID:    req.ParentID,
		Content:     req.Content,
		ImageURL:    req.ImageURL,
	}

	commentId, err := models.CreateGroupPostComment(h.db, comment)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get created comment
	createdComment, err := models.GetGroupPostCommentById(h.db, commentId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve created comment")
		return
	}

	// Log the created comment data for debugging
	log.Printf("Created group post comment: ID=%d, GroupPostID=%d, UserID=%d, ImageURL=%s",
		createdComment.ID, createdComment.GroupPostID, createdComment.UserID, createdComment.ImageURL)

	utils.RespondWithJSON(w, http.StatusCreated, createdComment)
}

// GetGroupPostComment retrieves a specific group post comment
func (h *GroupCommentHandler) GetGroupPostComment(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get comment ID from URL
	commentIdStr := chi.URLParam(r, "commentID")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	comment, err := models.GetGroupPostCommentById(h.db, commentId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve comment")
		return
	}

	if comment == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Comment not found")
		return
	}

	// Verify user has access to this comment (must be group member)
	var groupId int
	err = h.db.QueryRow("SELECT group_id FROM group_posts WHERE id = ?", comment.GroupPostID).Scan(&groupId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to verify access")
		return
	}

	var status string
	err = h.db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, user.ID,
	).Scan(&status)
	if err != nil || status != "accepted" {
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, comment)
}

// UpdateGroupPostComment updates a group post comment
func (h *GroupCommentHandler) UpdateGroupPostComment(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get comment ID from URL
	commentIdStr := chi.URLParam(r, "commentID")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid comment ID")
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

	// Update comment
	err = models.UpdateGroupPostComment(h.db, commentId, user.ID, req.Content, req.ImageURL)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get updated comment
	updatedComment, err := models.GetGroupPostCommentById(h.db, commentId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve updated comment")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedComment)
}

// DeleteGroupPostComment deletes a group post comment
func (h *GroupCommentHandler) DeleteGroupPostComment(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get comment ID from URL
	commentIdStr := chi.URLParam(r, "commentID")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	// Delete comment
	err = models.DeleteGroupPostComment(h.db, commentId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Comment deleted successfully"})
}

// AddGroupPostCommentReaction adds or updates a reaction to a group post comment
func (h *GroupCommentHandler) AddGroupPostCommentReaction(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get comment ID from URL
	commentIdStr := chi.URLParam(r, "commentID")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	// Parse request body
	var req struct {
		ReactionType string `json:"reaction_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate reaction type
	if req.ReactionType != "like" && req.ReactionType != "dislike" {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid reaction type")
		return
	}

	// Add reaction
	changes, err := models.AddGroupPostCommentReaction(h.db, commentId, user.ID, req.ReactionType)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, changes)
}

// GetGroupPostCommentReactions retrieves reactions for a group post comment
func (h *GroupCommentHandler) GetGroupPostCommentReactions(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get comment ID from URL
	commentIdStr := chi.URLParam(r, "commentID")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	reactions, err := models.GetGroupPostCommentReactions(h.db, commentId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, reactions)
}
