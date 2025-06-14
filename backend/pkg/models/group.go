package models

import (
	"database/sql"
	"errors"
	"time"
)

type Group struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatorID   int       `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Creator     *User     `json:"creator,omitempty"`
	Members     []Member  `json:"members,omitempty"`
	Posts       []Post    `json:"posts,omitempty"`
	Events      []Event   `json:"events,omitempty"`
}

type Member struct {
	ID        int       `json:"id"`
	GroupID   int       `json:"group_id"`
	UserID    int       `json:"user_id"`
	Status    string    `json:"status"`
	InvitedBy *int      `json:"invited_by,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      *User     `json:"user,omitempty"`
}

type Event struct {
	ID          int        `json:"id"`
	GroupID     int        `json:"group_id"`
	CreatorID   int        `json:"creator_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	EventDate   time.Time  `json:"event_date"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Creator     *User      `json:"creator,omitempty"`
	Responses   []Response `json:"responses,omitempty"`
}

type Response struct {
	ID        int       `json:"id"`
	EventID   int       `json:"event_id"`
	UserID    int       `json:"user_id"`
	Response  string    `json:"response"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      *User     `json:"user,omitempty"`
}

// CreateGroup creates a new group
func CreateGroup(db *sql.DB, title string, description string, creatorId int) (int, error) {
	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Insert group
	result, err := tx.Exec(
		`INSERT INTO groups (title, description, creator_id) VALUES (?, ?, ?)`,
		title, description, creatorId,
	)
	if err != nil {
		return 0, err
	}

	// Get group ID
	groupId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	// Add creator as a member (automatically accepted)
	_, err = tx.Exec(
		`INSERT INTO group_members (group_id, user_id, status) VALUES (?, ?, 'accepted')`,
		groupId, creatorId,
	)
	if err != nil {
		return 0, err
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return int(groupId), nil
}

// GetAllGroups retrieves all groups
func GetAllGroups(db *sql.DB) ([]Group, error) {
	groups := []Group{}

	rows, err := db.Query(`
		SELECT g.id, g.title, g.description, g.creator_id, g.created_at, g.updated_at,
		u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM groups g
		JOIN users u ON g.creator_id = u.id
		ORDER BY g.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var group Group
		var creator User

		err := rows.Scan(
			&group.ID, &group.Title, &group.Description, &group.CreatorID, &group.CreatedAt, &group.UpdatedAt,
			&creator.ID, &creator.Email, &creator.FirstName, &creator.LastName, &creator.Avatar, &creator.Nickname,
		)
		if err != nil {
			return nil, err
		}

		group.Creator = &creator
		groups = append(groups, group)
	}

	return groups, nil
}

// GetGroupById retrieves a group by ID
func GetGroupById(db *sql.DB, groupId int) (*Group, error) {
	group := &Group{}
	var creator User // Create a separate User variable

	// Get group data
	err := db.QueryRow(`
		SELECT g.id, g.title, g.description, g.creator_id, g.created_at, g.updated_at,
		u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM groups g
		JOIN users u ON g.creator_id = u.id
		WHERE g.id = ?
	`, groupId).Scan(
		&group.ID, &group.Title, &group.Description, &group.CreatorID, &group.CreatedAt, &group.UpdatedAt,
		&creator.ID, &creator.Email, &creator.FirstName, &creator.LastName,
		&creator.Avatar, &creator.Nickname, // Scan into creator variable
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	group.Creator = &creator // Assign the address of creator to group.Creator

	return group, nil
}

// GetGroupMembers retrieves members of a group
func GetGroupMembers(db *sql.DB, groupId int) ([]Member, error) {
	members := []Member{}

	rows, err := db.Query(`
		SELECT gm.id, gm.group_id, gm.user_id, gm.status, gm.invited_by, gm.created_at, gm.updated_at,
		u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at ASC
	`, groupId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var member Member
		var user User

		err := rows.Scan(
			&member.ID, &member.GroupID, &member.UserID, &member.Status, &member.InvitedBy, &member.CreatedAt, &member.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		member.User = &user
		members = append(members, member)
	}

	return members, nil
}

// JoinGroup handles a user joining a group (request or invitation)
func JoinGroup(db *sql.DB, groupId int, userId int, invitedBy *int) error {
	// Check if user is already a member
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)",
		groupId, userId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("user is already a member or has a pending request")
	}

	// Determine status based on whether it's an invitation or request
	status := "pending"
	if invitedBy != nil {
		// Check if inviter is a member
		var inviterStatus string
		err := db.QueryRow(
			"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
			groupId, *invitedBy,
		).Scan(&inviterStatus)
		if err != nil {
			if err == sql.ErrNoRows {
				return errors.New("inviter is not a member of the group")
			}
			return err
		}
		if inviterStatus != "accepted" {
			return errors.New("inviter is not an accepted member of the group")
		}
	}

	// Add member
	_, err = db.Exec(
		`INSERT INTO group_members (group_id, user_id, status, invited_by) VALUES (?, ?, ?, ?)`,
		groupId, userId, status, invitedBy,
	)
	return err
}

// RespondToGroupRequest handles accepting or declining a group join request
func RespondToGroupRequest(db *sql.DB, groupId int, userId int, status string, responderId int) error {
	// Check if responder is the group creator
	var creatorId int
	err := db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupId).Scan(&creatorId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("group not found")
		}
		return err
	}
	if creatorId != responderId {
		return errors.New("only the group creator can respond to join requests")
	}

	// Check if request exists
	var exists bool
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'pending' AND invited_by IS NULL)",
		groupId, userId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("no pending join request found")
	}

	// Update status
	if status == "accepted" || status == "declined" {
		_, err = db.Exec(
			"UPDATE group_members SET status = ? WHERE group_id = ? AND user_id = ?",
			status, groupId, userId,
		)
		return err
	}
	return errors.New("invalid status")
}

// RespondToGroupInvitation handles accepting or declining a group invitation
func RespondToGroupInvitation(db *sql.DB, groupId int, userId int, status string) error {
	// Check if invitation exists
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'pending' AND invited_by IS NOT NULL)",
		groupId, userId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("no pending invitation found")
	}

	// Update status
	if status == "accepted" || status == "declined" {
		_, err = db.Exec(
			"UPDATE group_members SET status = ? WHERE group_id = ? AND user_id = ?",
			status, groupId, userId,
		)
		return err
	}
	return errors.New("invalid status")
}

// LeaveGroup handles a user leaving a group
func LeaveGroup(db *sql.DB, groupId int, userId int) error {
	// Check if user is the group creator
	var creatorId int
	err := db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupId).Scan(&creatorId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("group not found")
		}
		return err
	}
	if creatorId == userId {
		return errors.New("group creator cannot leave the group")
	}

	// Check if user is a member
	var exists bool
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'accepted')",
		groupId, userId,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("user is not a member of the group")
	}

	// Remove member
	_, err = db.Exec(
		"DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, userId,
	)
	return err
}

// CreateGroupPost creates a new post in a group
func CreateGroupPost(db *sql.DB, groupId int, userId int, content string, imageUrl string) (int, error) {
	// Check if user is a member
	var status string
	err := db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, userId,
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

	// Create post
	result, err := db.Exec(
		`INSERT INTO group_posts (group_id, user_id, content, image_url) VALUES (?, ?, ?, ?)`,
		groupId, userId, content, imageUrl,
	)
	if err != nil {
		return 0, err
	}

	postId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(postId), nil
}

// GetGroupPosts retrieves posts in a group
func GetGroupPosts(db *sql.DB, groupId int, userId int, page int, limit int) ([]Post, error) {
	// Check if user is a member
	var status string
	err := db.QueryRow(
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

	offset := (page - 1) * limit
	posts := []Post{}

	rows, err := db.Query(`
		SELECT gp.id, gp.user_id, gp.content, gp.image_url, gp.created_at, gp.updated_at,
		u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM group_posts gp
		JOIN users u ON gp.user_id = u.id
		WHERE gp.group_id = ?
		ORDER BY gp.created_at DESC
		LIMIT ? OFFSET ?
	`, groupId, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var user User

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.CreatedAt, &post.UpdatedAt,
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

// CreateGroupEvent creates a new event in a group
func CreateGroupEvent(db *sql.DB, groupId int, creatorId int, title string, description string, eventDate time.Time) (int, error) {
	// Check if user is a member
	var status string
	err := db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, creatorId,
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

	// Create event
	result, err := db.Exec(
		`INSERT INTO group_events (group_id, creator_id, title, description, event_date) VALUES (?, ?, ?, ?, ?)`,
		groupId, creatorId, title, description, eventDate,
	)
	if err != nil {
		return 0, err
	}

	eventId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(eventId), nil
}

// GetGroupEvents retrieves events in a group
func GetGroupEvents(db *sql.DB, groupId int, userId int) ([]Event, error) {
	// Check if user is a member
	var status string
	err := db.QueryRow(
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

	events := []Event{}

	rows, err := db.Query(`
		SELECT ge.id, ge.group_id, ge.creator_id, ge.title, ge.description, ge.event_date, ge.created_at, ge.updated_at,
		u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM group_events ge
		JOIN users u ON ge.creator_id = u.id
		WHERE ge.group_id = ?
		ORDER BY ge.event_date ASC
	`, groupId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var event Event
		var creator User

		err := rows.Scan(
			&event.ID, &event.GroupID, &event.CreatorID, &event.Title, &event.Description, &event.EventDate,
			&event.CreatedAt, &event.UpdatedAt,
			&creator.ID, &creator.Email, &creator.FirstName, &creator.LastName, &creator.Avatar, &creator.Nickname,
		)
		if err != nil {
			return nil, err
		}

		event.Creator = &creator

		// Get responses for this event
		responses, err := GetEventResponses(db, event.ID)
		if err != nil {
			return nil, err
		}
		event.Responses = responses

		events = append(events, event)
	}

	return events, nil
}

// GetEventResponses retrieves responses for an event
func GetEventResponses(db *sql.DB, eventId int) ([]Response, error) {
	responses := []Response{}

	rows, err := db.Query(`
		SELECT ger.id, ger.event_id, ger.user_id, ger.response, ger.created_at, ger.updated_at,
		u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname
		FROM group_event_responses ger
		JOIN users u ON ger.user_id = u.id
		WHERE ger.event_id = ?
	`, eventId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var response Response
		var user User

		err := rows.Scan(
			&response.ID, &response.EventID, &response.UserID, &response.Response, &response.CreatedAt, &response.UpdatedAt,
			&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		response.User = &user
		responses = append(responses, response)
	}

	return responses, nil
}

// RespondToEvent handles a user responding to an event
func RespondToEvent(db *sql.DB, eventId int, userId int, response string) error {
	// Check if event exists
	var groupId int
	err := db.QueryRow("SELECT group_id FROM group_events WHERE id = ?", eventId).Scan(&groupId)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("event not found")
		}
		return err
	}

	// Check if user is a member of the group
	var status string
	err = db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, userId,
	).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("user is not a member of the group")
		}
		return err
	}
	if status != "accepted" {
		return errors.New("user is not an accepted member of the group")
	}

	// Check if response is valid
	if response != "going" && response != "not_going" {
		return errors.New("invalid response")
	}

	// Check if user has already responded
	var exists bool
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM group_event_responses WHERE event_id = ? AND user_id = ?)",
		eventId, userId,
	).Scan(&exists)
	if err != nil {
		return err
	}

	if exists {
		// Update response
		_, err = db.Exec(
			"UPDATE group_event_responses SET response = ? WHERE event_id = ? AND user_id = ?",
			response, eventId, userId,
		)
	} else {
		// Create response
		_, err = db.Exec(
			"INSERT INTO group_event_responses (event_id, user_id, response) VALUES (?, ?, ?)",
			eventId, userId, response,
		)
	}

	return err
}
