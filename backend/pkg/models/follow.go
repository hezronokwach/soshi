package models

import (
	"database/sql"
	"errors"
)

// GetFollowers retrieves users who are following the specified user
func GetFollowers(db *sql.DB, userId int) ([]User, error) {
	followers := []User{}

	rows, err := db.Query(`
		SELECT u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname, u.about_me, 
		u.created_at, u.updated_at, COALESCE(p.is_public, 1) as is_public
		FROM follows f
		JOIN users u ON f.follower_id = u.id
		LEFT JOIN user_profiles p ON u.id = p.user_id
		WHERE f.following_id = ? AND f.status = 'accepted'
		ORDER BY f.created_at DESC
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user User
		err := rows.Scan(
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname, &user.AboutMe,
			&user.CreatedAt, &user.UpdatedAt, &user.IsPublic,
		)
		if err != nil {
			return nil, err
		}
		followers = append(followers, user)
	}

	return followers, nil
}

// GetFollowing retrieves users that the specified user is following
func GetFollowing(db *sql.DB, userId int) ([]User, error) {
	following := []User{}

	rows, err := db.Query(`
		SELECT u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname, u.about_me, 
		u.created_at, u.updated_at, COALESCE(p.is_public, 1) as is_public
		FROM follows f
		JOIN users u ON f.following_id = u.id
		LEFT JOIN user_profiles p ON u.id = p.user_id
		WHERE f.follower_id = ? AND f.status = 'accepted'
		ORDER BY f.created_at DESC
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user User
		err := rows.Scan(
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname, &user.AboutMe,
			&user.CreatedAt, &user.UpdatedAt, &user.IsPublic,
		)
		if err != nil {
			return nil, err
		}
		following = append(following, user)
	}

	return following, nil
}

// FollowUser handles a user following another user
func FollowUser(db *sql.DB, followerId int, followingId int) error {
	// Check if users are the same
	if followerId == followingId {
		return errors.New("cannot follow yourself")
	}

	// Check if following user exists
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)", followingId).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("user to follow does not exist")
	}

	// Check if already following
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?)",
		followerId, followingId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("already following or request pending")
	}

	// Check if user to follow has a public profile
	var isPublic bool
	err = db.QueryRow(
		"SELECT COALESCE(is_public, 1) FROM user_profiles WHERE user_id = ?",
		followingId,
	).Scan(&isPublic)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	// Set status based on profile type
	status := "pending"
	if isPublic {
		status = "accepted"
	}

	// Create follow relationship
	_, err = db.Exec(
		"INSERT INTO follows (follower_id, following_id, status) VALUES (?, ?, ?)",
		followerId, followingId, status,
	)
	return err
}

// UnfollowUser handles a user unfollowing another user
func UnfollowUser(db *sql.DB, followerId int, followingId int) error {
	// Check if following exists
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted')",
		followerId, followingId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("not following this user")
	}

	// Delete follow relationship
	_, err = db.Exec(
		"DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
		followerId, followingId,
	)
	return err
}

// RespondToFollowRequest handles accepting or declining a follow request
func RespondToFollowRequest(db *sql.DB, followerId int, followingId int, status string) error {
	// Check if request exists
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending')",
		followerId, followingId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("no pending follow request found")
	}

	// Update status
	if status == "accepted" || status == "declined" {
		_, err = db.Exec(
			"UPDATE follows SET status = ? WHERE follower_id = ? AND following_id = ?",
			status, followerId, followingId,
		)
		return err
	}
	return errors.New("invalid status")
}

// GetFollowCounts returns follower and following counts for a user
func GetFollowCounts(db *sql.DB, userId int) (map[string]int, error) {
	counts := make(map[string]int)

	// Get follower count
	var followerCount int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'",
		userId,
	).Scan(&followerCount)
	if err != nil {
		return nil, err
	}
	counts["followers"] = followerCount

	// Get following count
	var followingCount int
	err = db.QueryRow(
		"SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'",
		userId,
	).Scan(&followingCount)
	if err != nil {
		return nil, err
	}
	counts["following"] = followingCount

	return counts, nil
}

// IsFollowing checks if user A is following user B
func IsFollowing(db *sql.DB, followerId int, followingId int) (string, error) {
	var status string
	err := db.QueryRow(
		"SELECT status FROM follows WHERE follower_id = ? AND following_id = ?",
		followerId, followingId,
	).Scan(&status)
	if err == sql.ErrNoRows {
		return "none", nil
	}
	if err != nil {
		return "", err
	}
	return status, nil
}

// GetFollowersWithCursor retrieves followers with pagination
func GetFollowersWithCursor(db *sql.DB, userId int, limit int, cursor string) ([]User, string, error) {
	followers := []User{}
	query := `
		SELECT u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname, u.about_me, 
		u.created_at, u.updated_at, COALESCE(p.is_public, 1) as is_public, f.created_at as follow_date
		FROM follows f
		JOIN users u ON f.follower_id = u.id
		LEFT JOIN user_profiles p ON u.id = p.user_id
		WHERE f.following_id = ? AND f.status = 'accepted'
	`

	args := []interface{}{userId}
	if cursor != "" {
		query += " AND f.created_at < ?"
		args = append(args, cursor)
	}

	query += " ORDER BY f.created_at DESC LIMIT ?"
	args = append(args, limit+1) // Get one extra to check if there are more

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()

	var nextCursor string
	for rows.Next() {
		var user User
		var followDate string
		err := rows.Scan(
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname, &user.AboutMe,
			&user.CreatedAt, &user.UpdatedAt, &user.IsPublic, &followDate,
		)
		if err != nil {
			return nil, "", err
		}
		followers = append(followers, user)
		nextCursor = followDate
	}

	// If we got more results than requested, remove the last one and set cursor
	if len(followers) > limit {
		followers = followers[:limit]
	} else {
		nextCursor = "" // No more results
	}

	return followers, nextCursor, nil
}

// GetFollowingWithCursor retrieves following with pagination
func GetFollowingWithCursor(db *sql.DB, userId int, limit int, cursor string) ([]User, string, error) {
	following := []User{}
	query := `
		SELECT u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname, u.about_me, 
		u.created_at, u.updated_at, COALESCE(p.is_public, 1) as is_public, f.created_at as follow_date
		FROM follows f
		JOIN users u ON f.following_id = u.id
		LEFT JOIN user_profiles p ON u.id = p.user_id
		WHERE f.follower_id = ? AND f.status = 'accepted'
	`

	args := []interface{}{userId}
	if cursor != "" {
		query += " AND f.created_at < ?"
		args = append(args, cursor)
	}

	query += " ORDER BY f.created_at DESC LIMIT ?"
	args = append(args, limit+1) // Get one extra to check if there are more

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()

	var nextCursor string
	for rows.Next() {
		var user User
		var followDate string
		err := rows.Scan(
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname, &user.AboutMe,
			&user.CreatedAt, &user.UpdatedAt, &user.IsPublic, &followDate,
		)
		if err != nil {
			return nil, "", err
		}
		following = append(following, user)
		nextCursor = followDate
	}

	// If we got more results than requested, remove the last one and set cursor
	if len(following) > limit {
		following = following[:limit]
	} else {
		nextCursor = "" // No more results
	}

	return following, nextCursor, nil
}

// CancelFollowRequest cancels a pending follow request
func CancelFollowRequest(db *sql.DB, followerId int, followingId int) error {
	// Check if pending request exists
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending')",
		followerId, followingId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("no pending follow request found")
	}

	// Delete the request
	_, err = db.Exec(
		"DELETE FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'",
		followerId, followingId,
	)
	return err
}
