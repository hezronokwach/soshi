package models

import (
	"database/sql"
	"errors"
	"time"
)

type Message struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"sender_id"`
	ReceiverID *int      `json:"receiver_id,omitempty"`
	GroupID    *int      `json:"group_id,omitempty"`
	Content    string    `json:"content"`
	IsRead     bool      `json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
	Sender     *User     `json:"sender,omitempty"`
	Receiver   *User     `json:"receiver,omitempty"`
}

// CreatePrivateMessage creates a new private message between users
func CreatePrivateMessage(db *sql.DB, senderId int, receiverId int, content string) (*Message, error) {
	// Check if users can message each other (one must follow the other)
	var canMessage bool
	err := db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM follows
			WHERE (follower_id = ? AND following_id = ? AND status = 'accepted')
			OR (follower_id = ? AND following_id = ? AND status = 'accepted')
		)`,
		senderId, receiverId, receiverId, senderId,
	).Scan(&canMessage)
	if err != nil {
		return nil, err
	}
	if !canMessage {
		// Check if receiver has a public profile
		var isPublic bool
		err = db.QueryRow(
			"SELECT COALESCE(is_public, 1) FROM user_profiles WHERE user_id = ?",
			receiverId,
		).Scan(&isPublic)
		if err != nil && err != sql.ErrNoRows {
			return nil, err
		}
		if !isPublic {
			return nil, errors.New("cannot message this user")
		}
	}

	// Create message
	result, err := db.Exec(
		`INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
		senderId, receiverId, content,
	)
	if err != nil {
		return nil, err
	}

	messageId, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	// Retrieve the created message
	var message Message
	err = db.QueryRow(`
		SELECT id, sender_id, receiver_id, content, is_read, created_at
		FROM messages
		WHERE id = ?
	`, messageId).Scan(
		&message.ID, &message.SenderID, &message.ReceiverID,
		&message.Content, &message.IsRead, &message.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &message, nil
}

// CreateGroupMessage creates a new message in a group chat
func CreateGroupMessage(db *sql.DB, senderId int, groupId int, content string) (int, error) {
	// Check if user is a member of the group
	var status string
	err := db.QueryRow(
		"SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
		groupId, senderId,
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

	// Create message
	result, err := db.Exec(
		`INSERT INTO messages (sender_id, group_id, content) VALUES (?, ?, ?)`,
		senderId, groupId, content,
	)
	if err != nil {
		return 0, err
	}

	messageId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(messageId), nil
}

// GetPrivateMessages retrieves private messages between two users
func GetPrivateMessages(db *sql.DB, userId1 int, userId2 int, page int, limit int) ([]Message, error) {
	offset := (page - 1) * limit
	messages := []Message{}

	rows, err := db.Query(`
		SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
		s.id, s.email, s.first_name, s.last_name, s.avatar, s.nickname,
		r.id, r.email, r.first_name, r.last_name, r.avatar, r.nickname
		FROM messages m
		JOIN users s ON m.sender_id = s.id
		JOIN users r ON m.receiver_id = r.id
		WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
		ORDER BY m.created_at ASC
		LIMIT ? OFFSET ?
	`, userId1, userId2, userId2, userId1, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var message Message
		var sender User
		var receiver User

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.ReceiverID, &message.Content, &message.IsRead, &message.CreatedAt,
			&sender.ID, &sender.Email, &sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
			&receiver.ID, &receiver.Email, &receiver.FirstName, &receiver.LastName, &receiver.Avatar, &receiver.Nickname,
		)
		if err != nil {
			return nil, err
		}

		message.Sender = &sender
		message.Receiver = &receiver
		messages = append(messages, message)
	}

	// Mark messages as read
	_, err = db.Exec(`
		UPDATE messages 
		SET is_read = 1 
		WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
	`, userId1, userId2)
	if err != nil {
		return nil, err
	}

	return messages, nil
}

// GetGroupMessages retrieves messages in a group chat
func GetGroupMessages(db *sql.DB, groupId int, userId int, page int, limit int) ([]Message, error) {
	// Check if user is a member of the group
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
	messages := []Message{}

	rows, err := db.Query(`
		SELECT m.id, m.sender_id, m.group_id, m.content, m.is_read, m.created_at,
		s.id, s.email, s.first_name, s.last_name, s.avatar, s.nickname
		FROM messages m
		JOIN users s ON m.sender_id = s.id
		WHERE m.group_id = ?
		ORDER BY m.created_at ASC
		LIMIT ? OFFSET ?
	`, groupId, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var message Message
		var sender User

		err := rows.Scan(
			&message.ID, &message.SenderID, &message.GroupID, &message.Content, &message.IsRead, &message.CreatedAt,
			&sender.ID, &sender.Email, &sender.FirstName, &sender.LastName, &sender.Avatar, &sender.Nickname,
		)
		if err != nil {
			return nil, err
		}

		message.Sender = &sender
		messages = append(messages, message)
	}

	return messages, nil
}

// ConversationInfo represents a conversation with additional metadata
type ConversationInfo struct {
	User            User      `json:"user"`
	UnreadCount     int       `json:"unread_count"`
	LastMessage     string    `json:"last_message"`
	LastMessageTime time.Time `json:"last_message_time"`
	IsOnline        bool      `json:"is_online"`
}

// GetUserConversations retrieves a list of users the current user has conversations with
func GetUserConversations(db *sql.DB, userId int) ([]ConversationInfo, error) {
	conversations := []ConversationInfo{}

	// Get users the current user has exchanged messages with
	rows, err := db.Query(`
		SELECT DISTINCT
			CASE
				WHEN m.sender_id = ? THEN m.receiver_id
				ELSE m.sender_id
			END as other_user_id,
			u.id, u.email, u.first_name, u.last_name, u.avatar, u.nickname,
			(SELECT COUNT(*) FROM messages
			 WHERE receiver_id = ? AND sender_id = u.id AND is_read = 0) as unread_count,
			(SELECT content FROM messages
			 WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
			 ORDER BY created_at DESC LIMIT 1) as last_message,
			(SELECT created_at FROM messages
			 WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
			 ORDER BY created_at DESC LIMIT 1) as last_message_time
		FROM messages m
		JOIN users u ON (m.sender_id = u.id OR m.receiver_id = u.id) AND u.id != ?
		WHERE (m.sender_id = ? OR m.receiver_id = ?) AND m.group_id IS NULL
		ORDER BY last_message_time DESC
	`, userId, userId, userId, userId, userId, userId, userId, userId, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var conversation ConversationInfo
		var otherUserId int
		var lastMessage sql.NullString
		var lastMessageTime sql.NullTime

		err := rows.Scan(
			&otherUserId,
			&conversation.User.ID, &conversation.User.Email, &conversation.User.FirstName,
			&conversation.User.LastName, &conversation.User.Avatar, &conversation.User.Nickname,
			&conversation.UnreadCount, &lastMessage, &lastMessageTime,
		)
		if err != nil {
			return nil, err
		}

		if lastMessage.Valid {
			conversation.LastMessage = lastMessage.String
		}
		if lastMessageTime.Valid {
			conversation.LastMessageTime = lastMessageTime.Time
		}

		// TODO: Implement online status check
		conversation.IsOnline = false

		conversations = append(conversations, conversation)
	}

	return conversations, nil
}

// MarkMessagesAsRead marks all messages from a specific user as read
func MarkMessagesAsRead(db *sql.DB, recipientID, senderID int) error {
	query := `
		UPDATE messages
		SET is_read = 1
		WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
	`

	_, err := db.Exec(query, recipientID, senderID)
	return err
}

// GetUnreadMessageCount gets the total number of unread messages for a user
func GetUnreadMessageCount(db *sql.DB, userID int) (int, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM messages
		WHERE receiver_id = ? AND is_read = 0
	`

	err := db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}
