package models

import (
	"database/sql"
	"encoding/json"
	"time"
)

type Activity struct {
	ID           int                    `json:"id"`
	UserID       int                    `json:"user_id"`
	ActivityType string                 `json:"activity_type"`
	TargetType   string                 `json:"target_type"`
	TargetID     int                    `json:"target_id"`
	TargetUserID *int                   `json:"target_user_id,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	IsHidden     bool                   `json:"is_hidden"`
	CreatedAt    time.Time              `json:"created_at"`
	
	// Populated fields
	User       *User    `json:"user,omitempty"`
	TargetUser *User    `json:"target_user,omitempty"`
	Post       *Post    `json:"post,omitempty"`
	Comment    *Comment `json:"comment,omitempty"`
}

type ActivitySettings struct {
	UserID              int  `json:"user_id"`
	ShowPosts          bool `json:"show_posts"`
	ShowComments       bool `json:"show_comments"`
	ShowLikes          bool `json:"show_likes"`
	ShowToFollowersOnly bool `json:"show_to_followers_only"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// CreateActivity records a new user activity
func CreateActivity(db *sql.DB, activity Activity) error {
	metadataJSON, err := json.Marshal(activity.Metadata)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		INSERT INTO user_activities (user_id, activity_type, target_type, target_id, target_user_id, metadata)
		VALUES (?, ?, ?, ?, ?, ?)
	`, activity.UserID, activity.ActivityType, activity.TargetType, activity.TargetID, 
	   activity.TargetUserID, string(metadataJSON))
	
	return err
}

// GetUserActivities retrieves activities for a user with filtering
func GetUserActivities(db *sql.DB, userID int, filters map[string]interface{}, page, limit int) ([]Activity, error) {
	offset := (page - 1) * limit
	activities := []Activity{}

	// Build WHERE clause based on filters
	whereClause := "WHERE a.user_id = ? AND a.is_hidden = 0"
	args := []interface{}{userID}

	if activityTypes, ok := filters["activity_types"].([]string); ok && len(activityTypes) > 0 {
		// Build IN clause for activity types
		placeholders := make([]string, len(activityTypes))
		for i, actType := range activityTypes {
			placeholders[i] = "?"
			args = append(args, actType)
		}
		whereClause += " AND a.activity_type IN (" + joinStrings(placeholders, ",") + ")"
	}

	if showHidden, ok := filters["show_hidden"].(bool); ok && showHidden {
		// Remove the is_hidden filter if we want to show hidden activities
		whereClause = "WHERE a.user_id = ?"
		args = []interface{}{userID}
	}

	query := `
		SELECT a.id, a.user_id, a.activity_type, a.target_type, a.target_id, 
		       a.target_user_id, a.metadata, a.is_hidden, a.created_at,
		       u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM user_activities a
		JOIN users u ON a.user_id = u.id
		` + whereClause + `
		ORDER BY a.created_at DESC
		LIMIT ? OFFSET ?
	`

	args = append(args, limit, offset)
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var activity Activity
		var user User
		var metadataJSON string
		var targetUserID sql.NullInt64

		err := rows.Scan(
			&activity.ID, &activity.UserID, &activity.ActivityType, &activity.TargetType,
			&activity.TargetID, &targetUserID, &metadataJSON, &activity.IsHidden, &activity.CreatedAt,
			&user.ID, &user.FirstName, &user.LastName, &user.Nickname, &user.Avatar,
		)
		if err != nil {
			return nil, err
		}

		// Parse metadata
		if metadataJSON != "" {
			json.Unmarshal([]byte(metadataJSON), &activity.Metadata)
		}

		if targetUserID.Valid {
			activity.TargetUserID = new(int)
			*activity.TargetUserID = int(targetUserID.Int64)
		}

		activity.User = &user
		activities = append(activities, activity)
	}

	// Populate target details
	for i := range activities {
		if err := populateActivityTarget(db, &activities[i]); err != nil {
			// Log error but continue
			continue
		}
	}

	return activities, nil
}

// GetUserPosts retrieves all posts by a user for activity display
func GetUserPosts(db *sql.DB, userID int, page, limit int) ([]Post, error) {
	offset := (page - 1) * limit
	posts := []Post{}

	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, 
		       COALESCE(p.like_count, 0) as like_count, COALESCE(p.dislike_count, 0) as dislike_count, 
		       p.created_at, p.updated_at,
		       u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.user_id = ?
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := db.Query(query, userID, limit, offset)
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
			&user.ID, &user.FirstName, &user.LastName, &user.Nickname, &user.Avatar,
		)
		if err != nil {
			return nil, err
		}

		post.User = &user
		posts = append(posts, post)
	}

	return posts, nil
}

// HideActivity marks an activity as hidden
func HideActivity(db *sql.DB, activityID int, userID int) error {
	_, err := db.Exec(`
		UPDATE user_activities 
		SET is_hidden = 1 
		WHERE id = ? AND user_id = ?
	`, activityID, userID)
	return err
}

// UnhideActivity marks an activity as visible
func UnhideActivity(db *sql.DB, activityID int, userID int) error {
	_, err := db.Exec(`
		UPDATE user_activities 
		SET is_hidden = 0 
		WHERE id = ? AND user_id = ?
	`, activityID, userID)
	return err
}

// GetActivitySettings retrieves user's activity settings
func GetActivitySettings(db *sql.DB, userID int) (*ActivitySettings, error) {
	settings := &ActivitySettings{
		UserID:              userID,
		ShowPosts:          true,
		ShowComments:       true,
		ShowLikes:          true,
		ShowToFollowersOnly: false,
	}

	err := db.QueryRow(`
		SELECT show_posts, show_comments, show_likes, show_to_followers_only, updated_at
		FROM user_activity_settings
		WHERE user_id = ?
	`, userID).Scan(&settings.ShowPosts, &settings.ShowComments, &settings.ShowLikes, 
		&settings.ShowToFollowersOnly, &settings.UpdatedAt)

	if err == sql.ErrNoRows {
		// Create default settings
		return CreateActivitySettings(db, userID)
	}
	if err != nil {
		return nil, err
	}

	return settings, nil
}

// CreateActivitySettings creates default activity settings for a user
func CreateActivitySettings(db *sql.DB, userID int) (*ActivitySettings, error) {
	_, err := db.Exec(`
		INSERT OR REPLACE INTO user_activity_settings (user_id, show_posts, show_comments, show_likes, show_to_followers_only)
		VALUES (?, 1, 1, 1, 0)
	`, userID)
	if err != nil {
		return nil, err
	}

	return GetActivitySettings(db, userID)
}

// UpdateActivitySettings updates user's activity settings
func UpdateActivitySettings(db *sql.DB, userID int, settings ActivitySettings) error {
	_, err := db.Exec(`
		INSERT OR REPLACE INTO user_activity_settings 
		(user_id, show_posts, show_comments, show_likes, show_to_followers_only, updated_at)
		VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
	`, userID, settings.ShowPosts, settings.ShowComments, settings.ShowLikes, settings.ShowToFollowersOnly)
	return err
}

// Helper function to populate activity target details
func populateActivityTarget(db *sql.DB, activity *Activity) error {
	if activity.TargetType == "post" {
		post, err := GetPostById(db, activity.TargetID, activity.UserID)
		if err != nil {
			return err
		}
		activity.Post = post
	} else if activity.TargetType == "comment" {
		comment, err := GetCommentById(db, activity.TargetID)
		if err != nil {
			return err
		}
		activity.Comment = comment
	}

	// Get target user if specified
	if activity.TargetUserID != nil {
		targetUser, err := GetUserById(db, *activity.TargetUserID)
		if err != nil {
			return err
		}
		activity.TargetUser = targetUser
	}

	return nil
}

// Helper function to join strings
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	if len(strs) == 1 {
		return strs[0]
	}
	
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}

// Activity creation helpers for different types

// CreatePostActivity records when a user creates a post
func CreatePostActivity(db *sql.DB, userID int, postID int, content string) error {
	metadata := map[string]interface{}{
		"content_preview": truncateString(content, 100),
	}
	
	return CreateActivity(db, Activity{
		UserID:       userID,
		ActivityType: "post_created",
		TargetType:   "post",
		TargetID:     postID,
		Metadata:     metadata,
	})
}

// CreateCommentActivity records when a user creates a comment
func CreateCommentActivity(db *sql.DB, userID int, commentID int, postID int, content string, targetUserID int) error {
	metadata := map[string]interface{}{
		"content_preview": truncateString(content, 100),
		"post_id":        postID,
	}

	var targetUID *int
	if targetUserID != userID {
		targetUID = &targetUserID
	}
	
	return CreateActivity(db, Activity{
		UserID:       userID,
		ActivityType: "comment_created",
		TargetType:   "comment",
		TargetID:     commentID,
		TargetUserID: targetUID,
		Metadata:     metadata,
	})
}

// CreateReactionActivity records when a user reacts to content
func CreateReactionActivity(db *sql.DB, userID int, targetType string, targetID int, reactionType string, targetUserID int) error {
	activityType := targetType + "_" + reactionType
	
	var targetUID *int
	if targetUserID != userID {
		targetUID = &targetUserID
	}
	
	return CreateActivity(db, Activity{
		UserID:       userID,
		ActivityType: activityType,
		TargetType:   targetType,
		TargetID:     targetID,
		TargetUserID: targetUID,
		Metadata:     map[string]interface{}{"reaction": reactionType},
	})
}

// Helper to truncate strings for previews
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
