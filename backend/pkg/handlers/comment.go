package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"

	"github.com/go-chi/chi/v5"
)

type CommentHandler struct {
	db *sql.DB
}

func NewCommentHandler(db *sql.DB) *CommentHandler {
	return &CommentHandler{db: db}
}

// GetPostComments retrieves comments for a post
func (h *CommentHandler) GetPostComments(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	// user, ok := r.Context().Value("user").(*models.User)
	// if !ok {
	// 	utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
	// 	return
	// }

	// Get post ID from URL
	postIdStr := chi.URLParam(r, "postID")
	postId, err := strconv.Atoi(postIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	// Parse query parameters
	page := 1
	limit := 20
	var parentId *int = nil

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

	parentIdStr := r.URL.Query().Get("parentId")
	if parentIdStr == "all" {
		// Special case: get all replies (no pagination)
		parentId = new(int) // Set to non-nil to indicate we want replies
		*parentId = -1      // Use -1 as a marker to get all replies
	} else if parentIdStr != "" {
		if p, err := strconv.Atoi(parentIdStr); err == nil && p > 0 {
			parentId = &p
		}
	}

	// Get comments
	options := map[string]interface{}{
		"page":     page,
		"limit":    limit,
		"parentId": parentId,
	}

	comments, err := models.GetPostComments(h.db, postId, options)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve comments")
		return
	}

	// Log comment data for debugging and enhance with user data
	for i := range comments {
		if comments[i].ImageURL != "" {
			log.Printf("Comment %d - Image URL: %s, ParentID: %v", comments[i].ID, comments[i].ImageURL, comments[i].ParentID)
		}
		// Get user data for each comment
		user, err := models.GetUserById(h.db, comments[i].UserID)
		if err == nil {
			comments[i].User = user
		}
		// Ensure ParentID is properly set
		if comments[i].ParentID != nil && *comments[i].ParentID == 0 {
			comments[i].ParentID = nil
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, comments)
}

// CreateComment creates a new comment
func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get post ID from URL
	postIdStr := chi.URLParam(r, "postID")
	postId, err := strconv.Atoi(postIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid post ID")
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

	// Validate required fields
	if req.Content == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Content is required")
		return
	}

	// Create comment
	comment := models.Comment{
		PostID:   postId,
		UserID:   user.ID,
		ParentID: req.ParentID,
		Content:  req.Content,
		ImageURL: req.ImageURL,
	}

	commentId, err := models.CreateComment(h.db, comment)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create comment")
		return
	}

	// Get created comment
	createdComment, err := models.GetCommentById(h.db, commentId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve created comment")
		return
	}

	// Log the created comment data for debugging
	log.Printf("Created comment: ID=%d, PostID=%d, UserID=%d, ImageURL=%s", 
		createdComment.ID, createdComment.PostID, createdComment.UserID, createdComment.ImageURL)

	// Get user data for the comment
	commentUser, err := models.GetUserById(h.db, createdComment.UserID)
	if err == nil {
		createdComment.User = commentUser
	}

	utils.RespondWithJSON(w, http.StatusCreated, createdComment)
}

// GetComment retrieves a comment by ID
func (h *CommentHandler) GetComment(w http.ResponseWriter, r *http.Request) {
	// Get comment ID from URL
	commentIdStr := chi.URLParam(r, "commentID")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	// Get comment
	comment, err := models.GetCommentById(h.db, commentId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve comment")
		return
	}
	if comment == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Comment not found")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, comment)
}

// UpdateComment updates a comment
func (h *CommentHandler) UpdateComment(w http.ResponseWriter, r *http.Request) {
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
	updates := map[string]interface{}{
		"content":   req.Content,
		"image_url": req.ImageURL,
	}

	err = models.UpdateComment(h.db, commentId, updates, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get updated comment
	updatedComment, err := models.GetCommentById(h.db, commentId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve updated comment")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedComment)
}

// DeleteComment deletes a comment
func (h *CommentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
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

	// Get post owner ID (for authorization)
	var postOwnerId int
	err = h.db.QueryRow(`
		SELECT p.user_id 
		FROM comments c
		JOIN posts p ON c.post_id = p.id
		WHERE c.id = ?
	`, commentId).Scan(&postOwnerId)
	if err != nil && err != sql.ErrNoRows {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve post owner")
		return
	}

	// Delete comment
	err = models.DeleteComment(h.db, commentId, user.ID, postOwnerId)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Comment deleted successfully"})
}

// GetReactions gets reactions for a comment
func (h *CommentHandler) GetReactions(w http.ResponseWriter, r *http.Request) {
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

	// Get reactions
	reactions, err := models.GetReplyReactions(h.db, commentId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, reactions)
}

// AddReaction adds a reaction to a comment
func (h *CommentHandler) AddReaction(w http.ResponseWriter, r *http.Request) {
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
	result, err := models.AddReplyReaction(h.db, commentId, user.ID, req.ReactionType)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, result)
}
