package router

import (
	"net/http"

	"github.com/hezronokwach/soshi/pkg/handlers"
)

// SetupGroupRoutes configures group-related routes
func SetupGroupRoutes(router *Router, groupHandler *handlers.GroupHandler, groupCommentHandler *handlers.GroupCommentHandler, messageHandler *handlers.MessageHandler, authMiddleware func(http.Handler) http.Handler) {
	// Group routes
	router.AddRoute("GET", "/api/groups", WithAuth(groupHandler.GetGroups, authMiddleware))
	router.AddRoute("POST", "/api/groups", WithAuth(groupHandler.CreateGroup, authMiddleware))
	router.AddRoute("GET", "/api/groups/{groupID}", WithAuth(groupHandler.GetGroup, authMiddleware))
	router.AddRoute("PUT", "/api/groups/{groupID}", WithAuth(groupHandler.UpdateGroup, authMiddleware))
	router.AddRoute("DELETE", "/api/groups/{groupID}", WithAuth(groupHandler.DeleteGroup, authMiddleware))

	// Group members
	router.AddRoute("POST", "/api/groups/{groupID}/join", WithAuth(groupHandler.JoinGroup, authMiddleware))
	router.AddRoute("DELETE", "/api/groups/{groupID}/join", WithAuth(groupHandler.LeaveGroup, authMiddleware))
	router.AddRoute("POST", "/api/groups/{groupID}/invite", WithAuth(groupHandler.InviteToGroup, authMiddleware))
	router.AddRoute("PUT", "/api/groups/{groupID}/members/{userID}", WithAuth(groupHandler.UpdateMember, authMiddleware))
	router.AddRoute("DELETE", "/api/groups/{groupID}/members/{userID}", WithAuth(groupHandler.RemoveMember, authMiddleware))

	// Group posts
	router.AddRoute("GET", "/api/groups/{groupID}/posts", WithAuth(groupHandler.GetPosts, authMiddleware))
	router.AddRoute("POST", "/api/groups/{groupID}/posts", WithAuth(groupHandler.CreatePost, authMiddleware))
	router.AddRoute("GET", "/api/groups/{groupID}/posts/{postID}/reactions", WithAuth(groupHandler.GetGroupPostReactions, authMiddleware))
	router.AddRoute("POST", "/api/groups/{groupID}/posts/{postID}/reactions", WithAuth(groupHandler.AddGroupPostReaction, authMiddleware))

	// Group post comments
	router.AddRoute("GET", "/api/groups/{groupID}/posts/{groupPostID}/comments", WithAuth(groupCommentHandler.GetGroupPostComments, authMiddleware))
	router.AddRoute("POST", "/api/groups/{groupID}/posts/{groupPostID}/comments", WithAuth(groupCommentHandler.CreateGroupPostComment, authMiddleware))

	// Group comment routes
	router.AddRoute("GET", "/api/groups/comments/{commentID}", WithAuth(groupCommentHandler.GetGroupPostComment, authMiddleware))
	router.AddRoute("PUT", "/api/groups/comments/{commentID}", WithAuth(groupCommentHandler.UpdateGroupPostComment, authMiddleware))
	router.AddRoute("DELETE", "/api/groups/comments/{commentID}", WithAuth(groupCommentHandler.DeleteGroupPostComment, authMiddleware))
	router.AddRoute("GET", "/api/groups/comments/{commentID}/reactions", WithAuth(groupCommentHandler.GetGroupPostCommentReactions, authMiddleware))
	router.AddRoute("POST", "/api/groups/comments/{commentID}/reactions", WithAuth(groupCommentHandler.AddGroupPostCommentReaction, authMiddleware))

	// Group events
	router.AddRoute("GET", "/api/groups/{groupID}/events", WithAuth(groupHandler.GetEvents, authMiddleware))
	router.AddRoute("POST", "/api/groups/{groupID}/events", WithAuth(groupHandler.CreateEvent, authMiddleware))
	router.AddRoute("POST", "/api/groups/events/{eventID}/respond", WithAuth(groupHandler.RespondToEvent, authMiddleware))

	// Group chat
	router.AddRoute("GET", "/api/groups/{groupID}/messages", WithAuth(messageHandler.GetGroupMessages, authMiddleware))
	router.AddRoute("POST", "/api/groups/{groupID}/messages", WithAuth(messageHandler.SendGroupMessage, authMiddleware))
}
