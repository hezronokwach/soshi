package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"

	"github.com/google/uuid"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		DateOfBirth string `json:"date_of_birth"`
		Avatar      string `json:"avatar"`
		Nickname    string `json:"nickname"`
		AboutMe     string `json:"about_me"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" || req.DateOfBirth == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	// Create user
	user := models.User{
		Email:       req.Email,
		Password:    req.Password,
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		DateOfBirth: req.DateOfBirth,
		Avatar:      req.Avatar,
		Nickname:    req.Nickname,
		AboutMe:     req.AboutMe,
	}

	userId, err := models.CreateUser(h.db, user)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create session
	sessionToken := uuid.New().String()
	err = models.CreateSession(h.db, userId, sessionToken)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Path:     "/",
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure: false,
	})

	// Get user without password
	userPtr, err := models.GetUserById(h.db, userId)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, http.StatusNotFound, "User not found")
		} else {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve user")
		}
		return
	}

	// Dereference the pointer to get the user value
	user = *userPtr
	user.Password = "" // Clear password
	utils.RespondWithJSON(w, http.StatusCreated, user)
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Authenticate user
	user, err := models.AuthenticateUser(h.db, req.Email, req.Password)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Authentication error")
		return
	}
	if user == nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Create session
	sessionToken := uuid.New().String()
	err = models.CreateSession(h.db, user.ID, sessionToken)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Path:     "/",
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure: false,
	})

	utils.RespondWithJSON(w, http.StatusOK, user)
}

// Logout handles user logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Get session token from cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			utils.RespondWithError(w, http.StatusUnauthorized, "No session token provided")
			return
		}
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request")
		return
	}
	sessionToken := cookie.Value

	// Delete session
	err = models.DeleteSessionByToken(h.db, sessionToken)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete session")
		return
	}

	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure: false,
	})

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// GetSession retrieves the current user session
func (h *AuthHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	// Get session token from cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			utils.RespondWithError(w, http.StatusUnauthorized, "No session token provided")
			return
		}
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request")
		return
	}
	sessionToken := cookie.Value

	// Get session
	session, err := models.GetSessionByToken(h.db, sessionToken)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve session")
		return
	}
	if session == nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Invalid or expired session")
		return
	}

	// Get user
	user, err := models.GetUserById(h.db, session.UserID)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve user")
		return
	}
	if user == nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "User not found")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, user)
}
