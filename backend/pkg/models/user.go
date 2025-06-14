package models

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID          int       `json:"id"`
	Email       string    `json:"email"`
	Password    string    `json:"-"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	DateOfBirth string    `json:"date_of_birth"`
	Avatar      string    `json:"avatar,omitempty"`
	Nickname    string    `json:"nickname,omitempty"`
	AboutMe     string    `json:"about_me,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	IsPublic    bool      `json:"is_public"`
}

// CreateUser creates a new user in the database
func CreateUser(db *sql.DB, user User) (int, error) {
	// Check if user with email already exists
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", user.Email).Scan(&exists)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return 0, err
	}

	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Insert user
	result, err := tx.Exec(
		`INSERT INTO users (email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		user.Email, string(hashedPassword), user.FirstName, user.LastName, user.DateOfBirth, user.Avatar, user.Nickname, user.AboutMe,
	)
	if err != nil {
		return 0, err
	}

	// Get user ID
	userId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	// Create user profile (default to public)
	_, err = tx.Exec(
		`INSERT INTO user_profiles (user_id, is_public) VALUES (?, ?)`,
		userId, true,
	)
	if err != nil {
		return 0, err
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return int(userId), nil
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(db *sql.DB, email string) (*User, error) {
	user := &User{}
	err := db.QueryRow(
		`SELECT u.id, u.email, u.password, u.first_name, u.last_name, u.date_of_birth, 
		u.avatar, u.nickname, u.about_me, u.created_at, u.updated_at, COALESCE(p.is_public, 1) as is_public
		FROM users u
		LEFT JOIN user_profiles p ON u.id = p.user_id
		WHERE u.email = ?`,
		email,
	).Scan(
		&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName, &user.DateOfBirth,
		&user.Avatar, &user.Nickname, &user.AboutMe, &user.CreatedAt, &user.UpdatedAt, &user.IsPublic,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// GetUserById retrieves a user by ID
func GetUserById(db *sql.DB, id int) (*User, error) {
	user := &User{}
	err := db.QueryRow(
		`SELECT u.id, u.email, u.first_name, u.last_name, u.date_of_birth, 
		u.avatar, u.nickname, u.about_me, u.created_at, u.updated_at, COALESCE(p.is_public, 1) as is_public
		FROM users u
		LEFT JOIN user_profiles p ON u.id = p.user_id
		WHERE u.id = ?`,
		id,
	).Scan(
		&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.DateOfBirth,
		&user.Avatar, &user.Nickname, &user.AboutMe, &user.CreatedAt, &user.UpdatedAt, &user.IsPublic,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// AuthenticateUser authenticates a user with email and password
func AuthenticateUser(db *sql.DB, email, password string) (*User, error) {
	user, err := GetUserByEmail(db, email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}

	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, nil
	}

	return user, nil
}
