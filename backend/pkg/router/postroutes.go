package router

import (
	"net/http"

	"github.com/hezronokwach/soshi/pkg/handlers"
)

// SetupPostRoutes configures post-related routes
func SetupPostRoutes(router *Router, postHandler *handlers.PostHandler, commentHandler *handlers.CommentHandler, authMiddleware func(http.Handler) http.Handler) {
	// Post routes (with auth middleware)
	router.AddRoute("GET", "/api/posts", WithAuth(postHandler.GetPosts, authMiddleware))
	router.AddRoute("GET", "/api/posts/liked", WithAuth(postHandler.GetLikedPosts, authMiddleware))
	router.AddRoute("GET", "/api/posts/commented", WithAuth(postHandler.GetCommentedPosts, authMiddleware))
	router.AddRoute("GET", "/api/posts/saved", WithAuth(postHandler.GetSavedPosts, authMiddleware))
	router.AddRoute("POST", "/api/posts", WithAuth(postHandler.CreatePost, authMiddleware))
	router.AddRoute("PUT", "/api/posts", WithAuth(postHandler.UpdatePost, authMiddleware))
	router.AddRoute("DELETE", "/api/posts", WithAuth(postHandler.DeletePost, authMiddleware))

	// Post-specific routes
	router.AddRoute("GET", "/api/posts/{postID}/saved", WithAuth(postHandler.CheckPostSaved, authMiddleware))
	router.AddRoute("POST", "/api/posts/{postID}/save", WithAuth(postHandler.SavePost, authMiddleware))
	router.AddRoute("DELETE", "/api/posts/{postID}/save", WithAuth(postHandler.UnsavePost, authMiddleware))

	// Post comments
	router.AddRoute("GET", "/api/posts/{postID}/comments", WithAuth(commentHandler.GetPostComments, authMiddleware))
	router.AddRoute("POST", "/api/posts/{postID}/comments", WithAuth(commentHandler.CreateComment, authMiddleware))

	// Post reactions
	router.AddRoute("GET", "/api/posts/{postID}/reactions", WithAuth(postHandler.GetReactions, authMiddleware))
	router.AddRoute("POST", "/api/posts/{postID}/reactions", WithAuth(postHandler.AddReaction, authMiddleware))

	// Comment routes
	router.AddRoute("GET", "/api/comments/{commentID}", WithAuth(commentHandler.GetComment, authMiddleware))
	router.AddRoute("PUT", "/api/comments/{commentID}", WithAuth(commentHandler.UpdateComment, authMiddleware))
	router.AddRoute("DELETE", "/api/comments/{commentID}", WithAuth(commentHandler.DeleteComment, authMiddleware))

	// Comment reactions
	router.AddRoute("GET", "/api/comments/{commentID}/reactions", WithAuth(commentHandler.GetReactions, authMiddleware))
	router.AddRoute("POST", "/api/comments/{commentID}/reactions", WithAuth(commentHandler.AddReaction, authMiddleware))
}
