package models

import (
	"database/sql"
	"time"
)

type Session struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// CreateSession creates a new session for a user
func CreateSession(db *sql.DB, userId int, token string) error {
	// Set expiration to 7 days from now
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	_, err := db.Exec(
		`INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`,
		userId, token, expiresAt,
	)
	return err
}

// GetSessionByToken retrieves a session by token
func GetSessionByToken(db *sql.DB, token string) (*Session, error) {
	session := &Session{}
	err := db.QueryRow(
		`SELECT id, user_id, token, created_at, expires_at FROM sessions WHERE token = ?`,
		token,
	).Scan(&session.ID, &session.UserID, &session.Token, &session.CreatedAt, &session.ExpiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Check if session is expired
	if session.ExpiresAt.Before(time.Now()) {
		// Delete expired session
		_, _ = db.Exec("DELETE FROM sessions WHERE id = ?", session.ID)
		return nil, nil
	}

	return session, nil
}

// DeleteSession deletes a session by ID
func DeleteSession(db *sql.DB, sessionId int) error {
	_, err := db.Exec("DELETE FROM sessions WHERE id = ?", sessionId)
	return err
}

// DeleteSessionByToken deletes a session by token
func DeleteSessionByToken(db *sql.DB, token string) error {
	_, err := db.Exec("DELETE FROM sessions WHERE token = ?", token)
	return err
}
