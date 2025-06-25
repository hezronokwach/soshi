package models

import (
	"database/sql"
	"errors"
	"time"
)

type GroupPostComment struct {
	ID           int                `json:"id"`
	GroupPostID  int                `json:"group_post_id"`
	UserID       int                `json:"user_id"`
	ParentID     *int               `json:"parent_id"`
	Content      string             `json:"content"`
	ImageURL     string             `json:"image_url,omitempty"`
	LikeCount    int                `json:"like_count"`
	DislikeCount int                `json:"dislike_count"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
	User         *User              `json:"user,omitempty"`
	Replies      []GroupPostComment `json:"replies,omitempty"`
}

// CreateGroupPostComment creates a new comment on a group post
func CreateGroupPostComment(db *sql.DB, comment GroupPostComment) (int, error) {
	// First, verify the user is a member of the group that owns this post
	var groupId int
	err := db.QueryRow(
		"SELECT group_id FROM group_posts WHERE id = ?",
		comment.GroupPostID,
	).Scan(&groupId)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, errors.New("group post not found")
		}
		return 0, err
	}

	// Check if user is a member of the group
	var status string
	err = db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, comment.UserID,
	).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, errors.New("user is not a member of the group")
		}
		return 0, err
	}
	if status != "accepted" {
		return 0, errors.New("user is not an accepted member of the group")
	}

	// Create the comment
	result, err := db.Exec(
		`INSERT INTO group_post_comments (group_post_id, user_id, parent_id, content, image_url)
		VALUES (?, ?, ?, ?, ?)`,
		comment.GroupPostID, comment.UserID, comment.ParentID, comment.Content, comment.ImageURL,
	)
	if err != nil {
		return 0, err
	}

	commentId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(commentId), nil
}

// GetGroupPostCommentById retrieves a group post comment by ID
func GetGroupPostCommentById(db *sql.DB, commentId int) (*GroupPostComment, error) {
	comment := &GroupPostComment{}

	// Get comment data
	err := db.QueryRow(
		`SELECT c.id, c.group_post_id, c.user_id, c.parent_id, c.content, c.image_url, 
		COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
		c.created_at, c.updated_at
		FROM group_post_comments c
		WHERE c.id = ?`,
		commentId,
	).Scan(
		&comment.ID, &comment.GroupPostID, &comment.UserID, &comment.ParentID, &comment.Content, &comment.ImageURL,
		&comment.LikeCount, &comment.DislikeCount, &comment.CreatedAt, &comment.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Get comment user
	comment.User, err = GetUserById(db, comment.UserID)
	if err != nil {
		return nil, err
	}

	return comment, nil
}

// GetGroupPostComments retrieves comments for a group post
func GetGroupPostComments(db *sql.DB, groupPostId int, userId int, options map[string]interface{}) ([]GroupPostComment, error) {
	// First, verify the user is a member of the group that owns this post
	var groupId int
	err := db.QueryRow(
		"SELECT group_id FROM group_posts WHERE id = ?",
		groupPostId,
	).Scan(&groupId)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("group post not found")
		}
		return nil, err
	}

	// Check if user is a member of the group
	var status string
	err = db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, userId,
	).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user is not a member of the group")
		}
		return nil, err
	}
	if status != "accepted" {
		return nil, errors.New("user is not an accepted member of the group")
	}

	comments := []GroupPostComment{}

	// Set defaults
	page := 1
	limit := 20
	var parentId *int = nil

	// Override with options if provided
	if p, ok := options["page"].(int); ok {
		page = p
	}
	if l, ok := options["limit"].(int); ok {
		limit = l
	}
	if p, ok := options["parentId"].(*int); ok {
		parentId = p
	}

	offset := (page - 1) * limit

	// Build query based on whether we want top-level comments or replies
	var query string
	var args []interface{}

	if parentId == nil {
		// Get top-level comments
		query = `
			SELECT c.id, c.group_post_id, c.user_id, c.parent_id, c.content, c.image_url, 
			COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
			c.created_at, c.updated_at,
			u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
			FROM group_post_comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.group_post_id = ? AND c.parent_id IS NULL
			ORDER BY c.created_at DESC
			LIMIT ? OFFSET ?
		`
		args = []interface{}{groupPostId, limit, offset}
	} else if *parentId == -1 {
		// Special case: get all replies for the post (no pagination)
		query = `
			SELECT c.id, c.group_post_id, c.user_id, c.parent_id, c.content, c.image_url, 
			COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
			c.created_at, c.updated_at,
			u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
			FROM group_post_comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.group_post_id = ? AND c.parent_id IS NOT NULL
			ORDER BY c.created_at DESC
		`
		args = []interface{}{groupPostId}
	} else {
		// Get replies to a specific comment
		query = `
			SELECT c.id, c.group_post_id, c.user_id, c.parent_id, c.content, c.image_url, 
			COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
			c.created_at, c.updated_at,
			u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
			FROM group_post_comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.parent_id = ?
			ORDER BY c.created_at DESC
			LIMIT ? OFFSET ?
		`
		args = []interface{}{*parentId, limit, offset}
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var comment GroupPostComment
		var user User

		err := rows.Scan(
			&comment.ID, &comment.GroupPostID, &comment.UserID, &comment.ParentID, &comment.Content, &comment.ImageURL,
			&comment.LikeCount, &comment.DislikeCount, &comment.CreatedAt, &comment.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		comment.User = &user
		comments = append(comments, comment)
	}

	return comments, nil
}

// UpdateGroupPostComment updates a group post comment
func UpdateGroupPostComment(db *sql.DB, commentId int, userId int, content string, imageUrl string) error {
	// Check if the comment exists and belongs to the user
	var existingUserId int
	err := db.QueryRow(
		"SELECT user_id FROM group_post_comments WHERE id = ?",
		commentId,
	).Scan(&existingUserId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("comment not found")
		}
		return err
	}

	if existingUserId != userId {
		return errors.New("unauthorized to update this comment")
	}

	// Update the comment
	_, err = db.Exec(
		`UPDATE group_post_comments SET content = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?`,
		content, imageUrl, commentId,
	)
	return err
}

// DeleteGroupPostComment deletes a group post comment
func DeleteGroupPostComment(db *sql.DB, commentId int, userId int) error {
	// Check if the comment exists and belongs to the user
	var existingUserId int
	err := db.QueryRow(
		"SELECT user_id FROM group_post_comments WHERE id = ?",
		commentId,
	).Scan(&existingUserId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("comment not found")
		}
		return err
	}

	if existingUserId != userId {
		return errors.New("unauthorized to delete this comment")
	}

	// Delete the comment (this will cascade to replies and reactions)
	_, err = db.Exec("DELETE FROM group_post_comments WHERE id = ?", commentId)
	return err
}

// AddGroupPostCommentReaction adds or updates a reaction to a group post comment
func AddGroupPostCommentReaction(db *sql.DB, commentId int, userId int, reactionType string) (map[string]interface{}, error) {
	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Check if comment exists and user has access
	var groupPostId int
	err = tx.QueryRow("SELECT group_post_id FROM group_post_comments WHERE id = ?", commentId).Scan(&groupPostId)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	// Verify user is a member of the group
	var groupId int
	err = tx.QueryRow("SELECT group_id FROM group_posts WHERE id = ?", groupPostId).Scan(&groupId)
	if err != nil {
		return nil, err
	}

	var status string
	err = tx.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, userId,
	).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user is not a member of the group")
		}
		return nil, err
	}
	if status != "accepted" {
		return nil, errors.New("user is not an accepted member of the group")
	}

	// Check existing reaction
	var existingType string
	err = tx.QueryRow(
		"SELECT reaction_type FROM group_post_comment_reactions WHERE comment_id = ? AND user_id = ?",
		commentId, userId,
	).Scan(&existingType)

	changes := make(map[string]interface{})

	if err == sql.ErrNoRows {
		// No existing reaction, add new one
		_, err = tx.Exec(
			"INSERT INTO group_post_comment_reactions (comment_id, user_id, reaction_type) VALUES (?, ?, ?)",
			commentId, userId, reactionType,
		)
		if err != nil {
			return nil, err
		}

		// Update comment counts
		if reactionType == "like" {
			_, err = tx.Exec("UPDATE group_post_comments SET like_count = like_count + 1 WHERE id = ?", commentId)
			changes["like_count"] = 1
		} else if reactionType == "dislike" {
			_, err = tx.Exec("UPDATE group_post_comments SET dislike_count = dislike_count + 1 WHERE id = ?", commentId)
			changes["dislike_count"] = 1
		}
		changes["action"] = "added"
		changes["reaction_type"] = reactionType
	} else if err != nil {
		return nil, err
	} else {
		// Existing reaction found
		if existingType == reactionType {
			// Same reaction, remove it
			_, err = tx.Exec(
				"DELETE FROM group_post_comment_reactions WHERE comment_id = ? AND user_id = ?",
				commentId, userId,
			)
			if err != nil {
				return nil, err
			}

			// Update comment counts
			if reactionType == "like" {
				_, err = tx.Exec("UPDATE group_post_comments SET like_count = like_count - 1 WHERE id = ?", commentId)
				changes["like_count"] = -1
			} else if reactionType == "dislike" {
				_, err = tx.Exec("UPDATE group_post_comments SET dislike_count = dislike_count - 1 WHERE id = ?", commentId)
				changes["dislike_count"] = -1
			}
			changes["action"] = "removed"
			changes["reaction_type"] = reactionType
		} else {
			// Different reaction, update it
			_, err = tx.Exec(
				"UPDATE group_post_comment_reactions SET reaction_type = ? WHERE comment_id = ? AND user_id = ?",
				reactionType, commentId, userId,
			)
			if err != nil {
				return nil, err
			}

			// Update comment counts
			if existingType == "like" {
				_, err = tx.Exec("UPDATE group_post_comments SET like_count = like_count - 1 WHERE id = ?", commentId)
				changes["like_count"] = -1
			} else if existingType == "dislike" {
				_, err = tx.Exec("UPDATE group_post_comments SET dislike_count = dislike_count - 1 WHERE id = ?", commentId)
				changes["dislike_count"] = -1
			}

			if reactionType == "like" {
				_, err = tx.Exec("UPDATE group_post_comments SET like_count = like_count + 1 WHERE id = ?", commentId)
				changes["like_count"] = (changes["like_count"].(int)) + 1
			} else if reactionType == "dislike" {
				_, err = tx.Exec("UPDATE group_post_comments SET dislike_count = dislike_count + 1 WHERE id = ?", commentId)
				changes["dislike_count"] = (changes["dislike_count"].(int)) + 1
			}
			changes["action"] = "changed"
			changes["reaction_type"] = reactionType
			changes["previous_type"] = existingType
		}
	}

	if err != nil {
		return nil, err
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, err
	}

	// Get the updated reaction state
	reactions, err := GetGroupPostCommentReactions(db, commentId, userId)
	if err != nil {
		return nil, err
	}

	// Convert to camelCase for frontend compatibility
	result := map[string]interface{}{
		"likeCount":    reactions["like_count"],
		"dislikeCount": reactions["dislike_count"],
	}

	if userReaction, exists := reactions["user_reaction"]; exists {
		result["userReaction"] = userReaction
	} else {
		result["userReaction"] = nil
	}

	return result, nil
}

// GetGroupPostCommentReactions retrieves reactions for a group post comment
func GetGroupPostCommentReactions(db *sql.DB, commentId int, userId int) (map[string]interface{}, error) {
	// Verify user has access to this comment
	var groupPostId int
	err := db.QueryRow("SELECT group_post_id FROM group_post_comments WHERE id = ?", commentId).Scan(&groupPostId)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	// Verify user is a member of the group
	var groupId int
	err = db.QueryRow("SELECT group_id FROM group_posts WHERE id = ?", groupPostId).Scan(&groupId)
	if err != nil {
		return nil, err
	}

	var status string
	err = db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, userId,
	).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user is not a member of the group")
		}
		return nil, err
	}
	if status != "accepted" {
		return nil, errors.New("user is not an accepted member of the group")
	}

	// Get reaction counts
	var likeCount, dislikeCount int
	err = db.QueryRow(
		"SELECT COALESCE(like_count, 0), COALESCE(dislike_count, 0) FROM group_post_comments WHERE id = ?",
		commentId,
	).Scan(&likeCount, &dislikeCount)
	if err != nil {
		return nil, err
	}

	// Get user's reaction if any
	var userReaction string
	err = db.QueryRow(
		"SELECT reaction_type FROM group_post_comment_reactions WHERE comment_id = ? AND user_id = ?",
		commentId, userId,
	).Scan(&userReaction)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	result := map[string]interface{}{
		"like_count":    likeCount,
		"dislike_count": dislikeCount,
	}

	if userReaction != "" {
		result["user_reaction"] = userReaction
	}

	return result, nil
}
