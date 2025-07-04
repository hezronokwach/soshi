package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/utils"
)

// Auth middleware to check if user is authenticated
func Auth(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get session token from cookie
			cookie, err := r.Cookie("session_token")
			if err != nil {
				if err == http.ErrNoCookie {
					utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
					return
				}
				utils.RespondWithError(w, http.StatusBadRequest, "Bad Request")
				return
			}
			sessionToken := cookie.Value

			// Get session
			session, err := models.GetSessionByToken(db, sessionToken)
			if err != nil {
				utils.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
				return
			}
			if session == nil {
				utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			// Get user
			user, err := models.GetUserById(db, session.UserID)
			if err != nil {
				utils.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
				return
			}
			if user == nil {
				utils.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			// Add user to context
			ctx := context.WithValue(r.Context(), "user", user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
