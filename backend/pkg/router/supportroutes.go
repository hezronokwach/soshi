package router

import (
	"net/http"

	"github.com/hezronokwach/soshi/pkg/handlers"
)

// SetupUploadRoutes configures upload-related routes
func SetupUploadRoutes(router *Router, uploadHandler *handlers.UploadHandler, authMiddleware func(http.Handler) http.Handler) {
	// Upload route (authenticated)
	router.AddRoute("POST", "/api/upload", WithAuth(uploadHandler.UploadFile, authMiddleware))
	// Public upload route (for registration)
	router.AddRoute("POST", "/api/upload/public", uploadHandler.UploadFilePublic)
}

// SetupWebSocketRoutes configures WebSocket routes
func SetupWebSocketRoutes(router *Router, wsHandler *handlers.WebSocketHandler) {
	// WebSocket route
	router.AddRoute("GET", "/ws", wsHandler.ServeWS)
}

// SetupMessageRoutes configures message-related routes
func SetupMessageRoutes(router *Router, messageHandler *handlers.MessageHandler, authMiddleware func(http.Handler) http.Handler) {
	// Message routes
	router.AddRoute("GET", "/api/messages/conversations", WithAuth(messageHandler.GetConversations, authMiddleware))
	router.AddRoute("GET", "/api/messages/unread-count", WithAuth(messageHandler.GetUnreadMessageCount, authMiddleware))
	router.AddRoute("GET", "/api/messages/{userID}", WithAuth(messageHandler.GetPrivateMessages, authMiddleware))
	router.AddRoute("POST", "/api/messages/{userID}", WithAuth(messageHandler.SendPrivateMessage, authMiddleware))
	router.AddRoute("PUT", "/api/messages/{userID}/read", WithAuth(messageHandler.MarkMessagesAsRead, authMiddleware))
}

// SetupNotificationRoutes configures notification-related routes
func SetupNotificationRoutes(router *Router, notificationHandler *handlers.NotificationHandler, authMiddleware func(http.Handler) http.Handler) {
	// Notification routes
	router.AddRoute("GET", "/api/notifications", WithAuth(notificationHandler.GetNotifications, authMiddleware))
	router.AddRoute("PUT", "/api/notifications/read", WithAuth(notificationHandler.MarkNotificationAsRead, authMiddleware))
	router.AddRoute("PUT", "/api/notifications/read-all", WithAuth(notificationHandler.MarkAllNotificationsAsRead, authMiddleware))
	router.AddRoute("GET", "/api/notifications/unread-count", WithAuth(notificationHandler.GetUnreadCount, authMiddleware))
}

// SetupActivityRoutes configures activity-related routes
func SetupActivityRoutes(router *Router, activityHandler *handlers.ActivityHandler, authMiddleware func(http.Handler) http.Handler) {
	// Activity routes
	router.AddRoute("GET", "/api/activity", WithAuth(activityHandler.GetUserActivities, authMiddleware))
	router.AddRoute("GET", "/api/activity/posts", WithAuth(activityHandler.GetUserPosts, authMiddleware))
	router.AddRoute("GET", "/api/activity/settings", WithAuth(activityHandler.GetActivitySettings, authMiddleware))
	router.AddRoute("PUT", "/api/activity/settings", WithAuth(activityHandler.UpdateActivitySettings, authMiddleware))
	router.AddRoute("PUT", "/api/activity/{activityID}/hide", WithAuth(activityHandler.HideActivity, authMiddleware))
	router.AddRoute("PUT", "/api/activity/{activityID}/unhide", WithAuth(activityHandler.UnhideActivity, authMiddleware))
	router.AddRoute("GET", "/api/activity/{userID}", WithAuth(activityHandler.GetUserActivities, authMiddleware))
	router.AddRoute("GET", "/api/activity/{userID}/posts", WithAuth(activityHandler.GetUserPosts, authMiddleware))
}
