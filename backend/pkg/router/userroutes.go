package router

import (
	"net/http"

	"github.com/hezronokwach/soshi/pkg/handlers"
)

// SetupUserRoutes configures user-related routes
func SetupUserRoutes(router *Router, userHandler *handlers.UserHandler, authMiddleware func(http.Handler) http.Handler) {
	// User routes
	router.AddRoute("GET", "/api/users/followers", WithAuth(userHandler.GetFollowers, authMiddleware))
	router.AddRoute("GET", "/api/users/following", WithAuth(userHandler.GetFollowing, authMiddleware))
	router.AddRoute("GET", "/api/users/counts", WithAuth(userHandler.GetFollowCounts, authMiddleware))
	router.AddRoute("GET", "/api/users/suggested", WithAuth(userHandler.GetSuggestedUsers, authMiddleware))
	router.AddRoute("GET", "/api/users/online", WithAuth(userHandler.GetOnlineUsers, authMiddleware))
	router.AddRoute("GET", "/api/users/profile", WithAuth(userHandler.GetProfile, authMiddleware))
	router.AddRoute("PUT", "/api/users/profile", WithAuth(userHandler.UpdateProfile, authMiddleware))
	router.AddRoute("PUT", "/api/users/profile/privacy", WithAuth(userHandler.UpdateProfilePrivacy, authMiddleware))
	router.AddRoute("GET", "/api/users/all", WithAuth(userHandler.GetAllUsers, authMiddleware))
	router.AddRoute("POST", "/api/users/accept-message-request", WithAuth(userHandler.AcceptMessageRequestHandler, authMiddleware))

	// User-specific routes
	router.AddRoute("GET", "/api/users/{userID}/profile", WithAuth(userHandler.GetProfile, authMiddleware))
	router.AddRoute("GET", "/api/users/{userID}/followers", WithAuth(userHandler.GetFollowers, authMiddleware))
	router.AddRoute("GET", "/api/users/{userID}/following", WithAuth(userHandler.GetFollowing, authMiddleware))
	router.AddRoute("GET", "/api/users/{userID}/counts", WithAuth(userHandler.GetFollowCounts, authMiddleware))
	router.AddRoute("GET", "/api/users/{userID}/follow-status", WithAuth(userHandler.GetFollowStatus, authMiddleware))
	router.AddRoute("POST", "/api/users/{userID}/follow", WithAuth(userHandler.FollowUser, authMiddleware))
	router.AddRoute("DELETE", "/api/users/{userID}/follow", WithAuth(userHandler.UnfollowUser, authMiddleware))
	router.AddRoute("DELETE", "/api/users/{userID}/follow-request", WithAuth(userHandler.CancelFollowRequest, authMiddleware))
	router.AddRoute("POST", "/api/users/{userID}/accept-follow", WithAuth(userHandler.AcceptFollowRequest, authMiddleware))
}

// SetupAuthRoutes configures authentication routes
func SetupAuthRoutes(router *Router, authHandler *handlers.AuthHandler) {
	router.AddRoute("POST", "/api/auth/register", authHandler.Register)
	router.AddRoute("POST", "/api/auth/login", authHandler.Login)
	router.AddRoute("POST", "/api/auth/logout", authHandler.Logout)
	router.AddRoute("GET", "/api/auth/session", authHandler.GetSession)
}
