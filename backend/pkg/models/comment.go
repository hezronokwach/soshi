package models

import (
	"database/sql"
	"errors"
	"time"
)

type Comment struct {
	ID           int       `json:"id"`
	PostID       int       `json:"post_id"`
	UserID       int       `json:"user_id"`
	ParentID     *int      `json:"parent_id"`
	Content      string    `json:"content"`
	ImageURL     string    `json:"image_url,omitempty"`
	LikeCount    int       `json:"like_count"`
	DislikeCount int       `json:"dislike_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	User         *User     `json:"user,omitempty"`
	Replies      []Comment `json:"replies,omitempty"`
}

// CreateComment creates a new comment
func CreateComment(db *sql.DB, comment Comment) (int, error) {
	result, err := db.Exec(
		`INSERT INTO comments (post_id, user_id, parent_id, content, image_url)
		VALUES (?, ?, ?, ?, ?)`,
		comment.PostID, comment.UserID, comment.ParentID, comment.Content, comment.ImageURL,
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

// GetCommentById retrieves a comment by ID
func GetCommentById(db *sql.DB, commentId int) (*Comment, error) {
	comment := &Comment{}

	// Get comment data
	err := db.QueryRow(
		`SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.image_url, 
		COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
		c.created_at, c.updated_at
		FROM comments c
		WHERE c.id = ?`,
		commentId,
	).Scan(
		&comment.ID, &comment.PostID, &comment.UserID, &comment.ParentID, &comment.Content, &comment.ImageURL,
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

// GetPostComments retrieves comments for a post
func GetPostComments(db *sql.DB, postId int, options map[string]interface{}) ([]Comment, error) {
	comments := []Comment{}

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
			SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.image_url, 
			COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
			c.created_at, c.updated_at,
			u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
			FROM comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.post_id = ? AND c.parent_id IS NULL
			ORDER BY c.created_at DESC
			LIMIT ? OFFSET ?
		`
		args = []interface{}{postId, limit, offset}
	} else if *parentId == -1 {
		// Special case: get all replies for the post (no pagination)
		query = `
			SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.image_url, 
			COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
			c.created_at, c.updated_at,
			u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
			FROM comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.post_id = ? AND c.parent_id IS NOT NULL
			ORDER BY c.created_at DESC
		`
		args = []interface{}{postId}
	} else {
		// Get replies to a specific comment
		query = `
			SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.image_url, 
			COALESCE(c.like_count, 0) as like_count, COALESCE(c.dislike_count, 0) as dislike_count, 
			c.created_at, c.updated_at,
			u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
			FROM comments c
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
		var comment Comment
		var user User

		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.UserID, &comment.ParentID, &comment.Content, &comment.ImageURL,
			&comment.LikeCount, &comment.DislikeCount, &comment.CreatedAt, &comment.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		comment.User = &user

		// If this is a top-level comment, get its replies
		if parentId == nil {
			// Get reply count
			var replyCount int
			err := db.QueryRow(
				"SELECT COUNT(*) FROM comments WHERE parent_id = ?",
				comment.ID,
			).Scan(&replyCount)
			if err != nil {
				return nil, err
			}

			// If there are replies, get the first few
			if replyCount > 0 {
				replyLimit := 3 // Just get first few replies
				replies, err := GetPostComments(db, postId, map[string]interface{}{
					"parentId": &comment.ID,
					"limit":    replyLimit,
					"page":     1,
				})
				if err != nil {
					return nil, err
				}
				comment.Replies = replies
			}
		}

		comments = append(comments, comment)
	}

	return comments, nil
}

// UpdateComment updates a comment
func UpdateComment(db *sql.DB, commentId int, updates map[string]interface{}, userId int) error {
	// Check if user owns the comment
	var commentUserId int
	err := db.QueryRow("SELECT user_id FROM comments WHERE id = ?", commentId).Scan(&commentUserId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("comment not found")
		}
		return err
	}

	if commentUserId != userId {
		return errors.New("unauthorized to update this comment")
	}

	// Update comment
	_, err = db.Exec(
		`UPDATE comments SET content = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		updates["content"], updates["image_url"], commentId,
	)
	return err
}

// DeleteComment deletes a comment
func DeleteComment(db *sql.DB, commentId int, userId int, postOwnerId int) error {
	// Check if comment exists
	var commentUserId int
	var postId int
	err := db.QueryRow(
		"SELECT user_id, post_id FROM comments WHERE id = ?",
		commentId,
	).Scan(&commentUserId, &postId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("comment not found")
		}
		return err
	}

	// Check if user is authorized to delete the comment
	// User can delete if they are the comment author, post owner, or admin
	if commentUserId != userId && postOwnerId != userId {
		return errors.New("unauthorized to delete this comment")
	}

	// Delete comment (cascade will handle replies)
	_, err = db.Exec("DELETE FROM comments WHERE id = ?", commentId)
	return err
}

// AddReplyReaction adds or updates a reaction to a comment
func AddReplyReaction(db *sql.DB, commentId int, userId int, reactionType string) (map[string]interface{}, error) {
	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Check if comment exists
	var exists bool
	err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM comments WHERE id = ?)", commentId).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("comment not found")
	}

	// Check existing reaction
	var existingType string
	err = tx.QueryRow(
		"SELECT reaction_type FROM comment_reactions WHERE comment_id = ? AND user_id = ?",
		commentId, userId,
	).Scan(&existingType)

	changes := make(map[string]interface{})

	if err == nil {
		// Reaction exists
		if existingType == reactionType {
			// Remove reaction if same type
			_, err = tx.Exec(
				"DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ?",
				commentId, userId,
			)
			if err != nil {
				return nil, err
			}
			changes[existingType+"_count"] = -1
		} else {
			// Update reaction type
			_, err = tx.Exec(
				"UPDATE comment_reactions SET reaction_type = ? WHERE comment_id = ? AND user_id = ?",
				reactionType, commentId, userId,
			)
			if err != nil {
				return nil, err
			}
			changes[existingType+"_count"] = -1
			changes[reactionType+"_count"] = 1
		}
	} else if err == sql.ErrNoRows {
		// Add new reaction
		_, err = tx.Exec(
			"INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES (?, ?, ?)",
			commentId, userId, reactionType,
		)
		if err != nil {
			return nil, err
		}
		changes[reactionType+"_count"] = 1
	} else {
		return nil, err
	}

	// Update counts in comments table
	for column, change := range changes {
		_, err = tx.Exec(
			"UPDATE comments SET "+column+" = COALESCE("+column+", 0) + ? WHERE id = ?",
			change, commentId,
		)
		if err != nil {
			return nil, err
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Get updated counts
	var likeCount, dislikeCount int
	err = db.QueryRow(
		"SELECT COALESCE(like_count, 0), COALESCE(dislike_count, 0) FROM comments WHERE id = ?",
		commentId,
	).Scan(&likeCount, &dislikeCount)
	if err != nil {
		return nil, err
	}

	// Get user reaction
	var userReaction *string
	err = db.QueryRow(
		"SELECT reaction_type FROM comment_reactions WHERE comment_id = ? AND user_id = ?",
		commentId, userId,
	).Scan(&userReaction)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	return map[string]interface{}{
		"likeCount":    likeCount,
		"dislikeCount": dislikeCount,
		"userReaction": userReaction,
	}, nil
}

// GetReactions gets reaction counts and user reaction for a comment
func GetReplyReactions(db *sql.DB, commentId int, userId int) (map[string]interface{}, error) {
	// Get comment counts
	var likeCount, dislikeCount int
	err := db.QueryRow(
		"SELECT COALESCE(like_count, 0), COALESCE(dislike_count, 0) FROM comments WHERE id = ?",
		commentId,
	).Scan(&likeCount, &dislikeCount)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	// Get user reaction
	var userReaction *string
	err = db.QueryRow(
		"SELECT reaction_type FROM comment_reactions WHERE comment_id = ? AND user_id = ?",
		commentId, userId,
	).Scan(&userReaction)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	return map[string]interface{}{
		"likeCount":    likeCount,
		"dislikeCount": dislikeCount,
		"userReaction": userReaction,
	}, nil
}
