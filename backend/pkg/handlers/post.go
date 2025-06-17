package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"

	"github.com/go-chi/chi/v5"
)

type PostHandler struct {
	db *sql.DB
}

func NewPostHandler(db *sql.DB) *PostHandler {
	return &PostHandler{db: db}
}

// GetPosts retrieves posts for the feed
func (h *PostHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse query parameters
	page := 1
	limit := 10
	privacy := []string{"public", "almost_private", "private"}

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
	posts, err := models.GetFeedPosts(h.db, user.ID, page, limit, privacy)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve posts")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, posts)
}

// CreatePost creates a new post
func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse request body
	var req struct {
		Content       string `json:"content"`
		ImageURL      string `json:"image_url"`
		Privacy       string `json:"privacy"`
		SelectedUsers []int  `json:"selected_users"`
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

	// Validate privacy
	if req.Privacy != "public" && req.Privacy != "almost_private" && req.Privacy != "private" {
		req.Privacy = "public"
	}

	// Create post
	post := models.Post{
		UserID:        user.ID,
		Content:       req.Content,
		ImageURL:      req.ImageURL,
		Privacy:       req.Privacy,
		SelectedUsers: req.SelectedUsers,
	}

	postId, err := models.CreatePost(h.db, post)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	// Create activity record
	if err := models.CreatePostActivity(h.db, user.ID, postId, req.Content); err != nil {
		// Log error but don't fail the request
		// In production, you might want to use a proper logger
	}

	// Get created post
	createdPost, err := models.GetPostById(h.db, postId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve created post")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, createdPost)
}

// UpdatePost updates an existing post
func (h *PostHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse request body
	var req struct {
		ID            int    `json:"id"`
		Content       string `json:"content"`
		Privacy       string `json:"privacy"`
		SelectedUsers []int  `json:"selected_users"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields
	if req.ID == 0 || req.Content == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "ID and content are required")
		return
	}

	// Validate privacy
	if req.Privacy != "public" && req.Privacy != "almost_private" && req.Privacy != "private" {
		req.Privacy = "public"
	}

	// Update post
	updates := map[string]interface{}{
		"content":        req.Content,
		"privacy":        req.Privacy,
		"selected_users": req.SelectedUsers,
	}

	err := models.UpdatePost(h.db, req.ID, updates, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get updated post
	updatedPost, err := models.GetPostById(h.db, req.ID, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve updated post")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, updatedPost)
}

// DeletePost deletes a post
func (h *PostHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse request body
	var req struct {
		ID int `json:"id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields
	if req.ID == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "Post ID is required")
		return
	}

	// Delete post
	err := models.DeletePost(h.db, req.ID, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Post deleted successfully"})
}

// GetReactions gets reactions for a post
func (h *PostHandler) GetReactions(w http.ResponseWriter, r *http.Request) {
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

	// Get reactions
	reactions, err := models.GetPostReactions(h.db, postId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, reactions)
}

// AddReaction adds a reaction to a post
func (h *PostHandler) AddReaction(w http.ResponseWriter, r *http.Request) {
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

	// Get post owner before adding reaction
	post, err := models.GetPostById(h.db, postId, user.ID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get post")
		return
	}

	// Add reaction
	result, err := models.AddPostReaction(h.db, postId, user.ID, req.ReactionType)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create activity record for reaction (only if not removing reaction)
	if result["userReaction"] != nil {
		if err := models.CreateReactionActivity(h.db, user.ID, "post", postId, req.ReactionType, post.UserID); err != nil {
			// Log error but don't fail the request
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, result)
}
