package models

import (
	"database/sql"
	"errors"
	"time"
)

type Post struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	Content      string    `json:"content"`
	ImageURL     string    `json:"image_url,omitempty"`
	Privacy      string    `json:"privacy"`
	LikeCount    int       `json:"like_count"`
	DislikeCount int       `json:"dislike_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	User         *User     `json:"user,omitempty"`
	Comments     []Comment `json:"comments,omitempty"`
	SelectedUsers []int    `json:"selected_users,omitempty"`
}

// CreatePost creates a new post
func CreatePost(db *sql.DB, post Post) (int, error) {
	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Insert post
	result, err := tx.Exec(
		`INSERT INTO posts (user_id, content, image_url, privacy) VALUES (?, ?, ?, ?)`,
		post.UserID, post.Content, post.ImageURL, post.Privacy,
	)
	if err != nil {
		return 0, err
	}

	// Get post ID
	postId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	// If privacy is private, add selected users
	if post.Privacy == "private" && len(post.SelectedUsers) > 0 {
		for _, userId := range post.SelectedUsers {
			_, err := tx.Exec(
				`INSERT INTO post_privacy_users (post_id, user_id) VALUES (?, ?)`,
				postId, userId,
			)
			if err != nil {
				return 0, err
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return int(postId), nil
}

// GetPostById retrieves a post by ID
func GetPostById(db *sql.DB, postId int, currentUserId int) (*Post, error) {
	post := &Post{}
	
	// Get post data
	err := db.QueryRow(
		`SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, 
		COALESCE(p.like_count, 0) as like_count, COALESCE(p.dislike_count, 0) as dislike_count, 
		p.created_at, p.updated_at
		FROM posts p
		WHERE p.id = ?`,
		postId,
	).Scan(
		&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
		&post.LikeCount, &post.DislikeCount, &post.CreatedAt, &post.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Check if user can view this post
	canView, err := CanViewPost(db, post, currentUserId)
	if err != nil {
		return nil, err
	}
	if !canView {
		return nil, errors.New("unauthorized to view this post")
	}

	// Get post user
	post.User, err = GetUserById(db, post.UserID)
	if err != nil {
		return nil, err
	}

	// Get selected users if privacy is private
	if post.Privacy == "private" {
		rows, err := db.Query(
			`SELECT user_id FROM post_privacy_users WHERE post_id = ?`,
			post.ID,
		)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var userId int
			if err := rows.Scan(&userId); err != nil {
				return nil, err
			}
			post.SelectedUsers = append(post.SelectedUsers, userId)
		}
	}

	return post, nil
}

// GetFeedPosts retrieves posts for a user's feed
func GetFeedPosts(db *sql.DB, userId int, page, limit int, privacy []string) ([]Post, error) {
	offset := (page - 1) * limit
	posts := []Post{}

	// Build query based on privacy settings
	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, 
		COALESCE(p.like_count, 0) as like_count, COALESCE(p.dislike_count, 0) as dislike_count, 
		p.created_at, p.updated_at,
		u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE 
			(p.privacy = 'public') OR
			(p.privacy = 'almost_private' AND p.user_id = ?) OR
			(p.privacy = 'almost_private' AND EXISTS (
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = p.user_id AND status = 'accepted'
			)) OR
			(p.privacy = 'private' AND p.user_id = ?) OR
			(p.privacy = 'private' AND EXISTS (
				SELECT 1 FROM post_privacy_users 
				WHERE post_id = p.id AND user_id = ?
			))
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, userId, userId, userId, userId, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var user User
		
		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
			&post.LikeCount, &post.DislikeCount, &post.CreatedAt, &post.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}
		
		post.User = &user
		posts = append(posts, post)
	}

	return posts, nil
}

// UpdatePost updates an existing post
func UpdatePost(db *sql.DB, postId int, updates map[string]interface{}, userId int) error {
	// Check if user owns the post
	var postUserId int
	err := db.QueryRow("SELECT user_id FROM posts WHERE id = ?", postId).Scan(&postUserId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("post not found")
		}
		return err
	}

	if postUserId != userId {
		return errors.New("unauthorized to update this post")
	}

	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update post
	_, err = tx.Exec(
		`UPDATE posts SET content = ?, privacy = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		updates["content"], updates["privacy"], postId,
	)
	if err != nil {
		return err
	}

	// If privacy is private, update selected users
	if updates["privacy"] == "private" {
		// Delete existing selected users
		_, err = tx.Exec("DELETE FROM post_privacy_users WHERE post_id = ?", postId)
		if err != nil {
			return err
		}

		// Add new selected users
		if selectedUsers, ok := updates["selected_users"].([]int); ok && len(selectedUsers) > 0 {
			for _, selectedUserId := range selectedUsers {
				_, err = tx.Exec(
					`INSERT INTO post_privacy_users (post_id, user_id) VALUES (?, ?)`,
					postId, selectedUserId,
				)
				if err != nil {
					return err
				}
			}
		}
	}

	// Commit transaction
	return tx.Commit()
}

// DeletePost deletes a post
func DeletePost(db *sql.DB, postId int, userId int) error {
	// Check if user owns the post
	var postUserId int
	err := db.QueryRow("SELECT user_id FROM posts WHERE id = ?", postId).Scan(&postUserId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("post not found")
		}
		return err
	}

	if postUserId != userId {
		return errors.New("unauthorized to delete this post")
	}

	// Delete post (cascade will handle related records)
	_, err = db.Exec("DELETE FROM posts WHERE id = ?", postId)
	return err
}

// CanViewPost checks if a user can view a post
func CanViewPost(db *sql.DB, post *Post, userId int) (bool, error) {
	// Post owner can always view their own posts
	if post.UserID == userId {
		return true, nil
	}

	// Public posts can be viewed by anyone
	if post.Privacy == "public" {
		return true, nil
	}

	// Almost private posts can be viewed by followers
	if post.Privacy == "almost_private" {
		var exists bool
		err := db.QueryRow(
			`SELECT EXISTS(
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = ? AND status = 'accepted'
			)`,
			userId, post.UserID,
		).Scan(&exists)
		if err != nil {
			return false, err
		}
		return exists, nil
	}

	// Private posts can be viewed by selected users
	if post.Privacy == "private" {
		var exists bool
		err := db.QueryRow(
			`SELECT EXISTS(
				SELECT 1 FROM post_privacy_users 
				WHERE post_id = ? AND user_id = ?
			)`,
			post.ID, userId,
		).Scan(&exists)
		if err != nil {
			return false, err
		}
		return exists, nil
	}

	return false, nil
}

// AddReaction adds or updates a reaction to a post
func AddPostReaction(db *sql.DB, postId int, userId int, reactionType string) (map[string]interface{}, error) {
	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Check if post exists
	var exists bool
	err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM posts WHERE id = ?)", postId).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("post not found")
	}

	// Check existing reaction
	var existingType string
	err = tx.QueryRow(
		"SELECT reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?",
		postId, userId,
	).Scan(&existingType)

	changes := make(map[string]interface{})
	
	if err == nil {
		// Reaction exists
		if existingType == reactionType {
			// Remove reaction if same type
			_, err = tx.Exec(
				"DELETE FROM post_reactions WHERE post_id = ? AND user_id = ?",
				postId, userId,
			)
			if err != nil {
				return nil, err
			}
			changes[existingType+"_count"] = -1
		} else {
			// Update reaction type
			_, err = tx.Exec(
				"UPDATE post_reactions SET reaction_type = ? WHERE post_id = ? AND user_id = ?",
				reactionType, postId, userId,
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
			"INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)",
			postId, userId, reactionType,
		)
		if err != nil {
			return nil, err
		}
		changes[reactionType+"_count"] = 1
	} else {
		return nil, err
	}

	// Update counts in posts table
	for column, change := range changes {
		_, err = tx.Exec(
			"UPDATE posts SET "+column+" = COALESCE("+column+", 0) + ? WHERE id = ?",
			change, postId,
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
		"SELECT COALESCE(like_count, 0), COALESCE(dislike_count, 0) FROM posts WHERE id = ?",
		postId,
	).Scan(&likeCount, &dislikeCount)
	if err != nil {
		return nil, err
	}

	// Get user reaction
	var userReaction *string
	err = db.QueryRow(
		"SELECT reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?",
		postId, userId,
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

// GetCommentedPosts retrieves posts that a user has commented on
func GetCommentedPosts(db *sql.DB, userId int, page, limit int) ([]Post, error) {
	offset := (page - 1) * limit
	posts := []Post{}

	query := `
		SELECT DISTINCT p.id, p.user_id, p.content, p.image_url, p.privacy, 
		COALESCE(p.like_count, 0) as like_count, COALESCE(p.dislike_count, 0) as dislike_count, 
		p.created_at, p.updated_at,
		u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM posts p
		JOIN users u ON p.user_id = u.id
		JOIN comments c ON p.id = c.post_id
		WHERE c.user_id = ?
		AND (
			(p.privacy = 'public') OR
			(p.privacy = 'almost_private' AND p.user_id = ?) OR
			(p.privacy = 'almost_private' AND EXISTS (
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = p.user_id AND status = 'accepted'
			)) OR
			(p.privacy = 'private' AND p.user_id = ?) OR
			(p.privacy = 'private' AND EXISTS (
				SELECT 1 FROM post_privacy_users 
				WHERE post_id = p.id AND user_id = ?
			))
		)
		ORDER BY c.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, userId, userId, userId, userId, userId, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var user User
		
		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
			&post.LikeCount, &post.DislikeCount, &post.CreatedAt, &post.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}
		
		post.User = &user
		posts = append(posts, post)
	}

	return posts, nil
}

// SavePost saves a post for a user
func SavePost(db *sql.DB, userID, postID int) error {
	_, err := db.Exec(`
		INSERT INTO saved_posts (user_id, post_id)
		VALUES (?, ?)
		ON CONFLICT(user_id, post_id) DO NOTHING
	`, userID, postID)
	return err
}

// UnsavePost removes a saved post for a user
func UnsavePost(db *sql.DB, userID, postID int) error {
	_, err := db.Exec(`
		DELETE FROM saved_posts 
		WHERE user_id = ? AND post_id = ?
	`, userID, postID)
	return err
}

// IsPostSaved checks if a post is saved by a user
func IsPostSaved(db *sql.DB, userID, postID int) (bool, error) {
	var count int
	err := db.QueryRow(`
		SELECT COUNT(*) 
		FROM saved_posts 
		WHERE user_id = ? AND post_id = ?
	`, userID, postID).Scan(&count)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetSavedPosts retrieves posts that a user has saved
func GetSavedPosts(db *sql.DB, userID, page, limit int) ([]Post, error) {
	offset := (page - 1) * limit
	posts := []Post{}

	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, 
		COALESCE(p.like_count, 0) as like_count, COALESCE(p.dislike_count, 0) as dislike_count, 
		p.created_at, p.updated_at,
		u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM posts p
		JOIN users u ON p.user_id = u.id
		JOIN saved_posts sp ON p.id = sp.post_id
		WHERE sp.user_id = ?
		AND (
			(p.privacy = 'public') OR
			(p.privacy = 'almost_private' AND p.user_id = ?) OR
			(p.privacy = 'almost_private' AND EXISTS (
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = p.user_id AND status = 'accepted'
			)) OR
			(p.privacy = 'private' AND p.user_id = ?) OR
			(p.privacy = 'private' AND EXISTS (
				SELECT 1 FROM post_privacy_users 
				WHERE post_id = p.id AND user_id = ?
			))
		)
		ORDER BY sp.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, userID, userID, userID, userID, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var user User
		
		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
			&post.LikeCount, &post.DislikeCount, &post.CreatedAt, &post.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}
		
		post.User = &user
		posts = append(posts, post)
	}

	return posts, nil
}

// GetLikedPosts retrieves posts that a user has liked
func GetLikedPosts(db *sql.DB, userId int, page, limit int) ([]Post, error) {
	offset := (page - 1) * limit
	posts := []Post{}

	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, 
		COALESCE(p.like_count, 0) as like_count, COALESCE(p.dislike_count, 0) as dislike_count, 
		p.created_at, p.updated_at,
		u.id as user_id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM posts p
		JOIN users u ON p.user_id = u.id
		JOIN post_reactions pr ON p.id = pr.post_id
		WHERE pr.user_id = ? AND pr.reaction_type = 'like'
		AND (
			(p.privacy = 'public') OR
			(p.privacy = 'almost_private' AND p.user_id = ?) OR
			(p.privacy = 'almost_private' AND EXISTS (
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = p.user_id AND status = 'accepted'
			)) OR
			(p.privacy = 'private' AND p.user_id = ?) OR
			(p.privacy = 'private' AND EXISTS (
				SELECT 1 FROM post_privacy_users 
				WHERE post_id = p.id AND user_id = ?
			))
		)
		ORDER BY pr.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, userId, userId, userId, userId, userId, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var user User
		
		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
			&post.LikeCount, &post.DislikeCount, &post.CreatedAt, &post.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}
		
		post.User = &user
		posts = append(posts, post)
	}

	return posts, nil
}

// GetReactions gets reaction counts and user reaction for a post
func GetPostReactions(db *sql.DB, postId int, userId int) (map[string]interface{}, error) {
	// Get post counts
	var likeCount, dislikeCount int
	err := db.QueryRow(
		"SELECT COALESCE(like_count, 0), COALESCE(dislike_count, 0) FROM posts WHERE id = ?",
		postId,
	).Scan(&likeCount, &dislikeCount)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("post not found")
		}
		return nil, err
	}

	// Get user reaction
	var userReaction *string
	err = db.QueryRow(
		"SELECT reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?",
		postId, userId,
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
