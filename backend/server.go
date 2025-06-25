package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/hezronokwach/soshi/pkg/db/sqlite"
	"github.com/hezronokwach/soshi/pkg/handlers"
	middleware1 "github.com/hezronokwach/soshi/pkg/middleware"
	"github.com/hezronokwach/soshi/pkg/websocket"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file008_create_messages_table. found, using default environment variables")
	}

	// Initialize database
	db, err := sqlite.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Apply migrations
	if err := sqlite.ApplyMigrations(); err != nil {
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	// Initialize router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8080"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Cookie"},
		ExposedHeaders:   []string{"Link", "Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	}))

	// Initialize websocket hub
	hub := websocket.NewHub(db)
	go hub.Run()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	postHandler := handlers.NewPostHandler(db)
	commentHandler := handlers.NewCommentHandler(db)
	groupHandler := handlers.NewGroupHandler(db)
	groupCommentHandler := handlers.NewGroupCommentHandler(db)
	userHandler := handlers.NewUserHandler(db, hub)
	messageHandler := handlers.NewMessageHandler(db, hub)
	activityHandler := handlers.NewActivityHandler(db)
	uploadHandler := handlers.NewUploadHandler()
	wsHandler := handlers.NewWebSocketHandler(hub, db)
	authMiddleware := middleware1.Auth(db)

	// Routes
	// Auth routes
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/logout", authHandler.Logout)
		r.Get("/session", authHandler.GetSession)
	})

	// Post routes
	r.Route("/api/posts", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/", postHandler.GetPosts)
		r.Post("/", postHandler.CreatePost)
		r.Put("/", postHandler.UpdatePost)
		r.Delete("/", postHandler.DeletePost)

		// Post comments
		r.Route("/{postID}/comments", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/", commentHandler.GetPostComments)
			r.Post("/", commentHandler.CreateComment)
		})

		// Post reactions
		r.Route("/{postID}/reactions", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/", postHandler.GetReactions)
			r.Post("/", postHandler.AddReaction)
		})
	})

	// Comment routes
	r.Route("/api/comments/{commentID}", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/", commentHandler.GetComment)
		r.Put("/", commentHandler.UpdateComment)
		r.Delete("/", commentHandler.DeleteComment)

		// Comment reactions
		r.Route("/reactions", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/", commentHandler.GetReactions)
			r.Post("/", commentHandler.AddReaction)
		})
	})

	// Group comment routes (for reactions)
	r.Route("/api/groups/comments/{commentID}", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Route("/reactions", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/", groupCommentHandler.GetGroupPostCommentReactions)
			r.Post("/", groupCommentHandler.AddGroupPostCommentReaction)
		})
	})

	// Group routes
	r.Route("/api/groups", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/", groupHandler.GetGroups)
		r.Post("/", groupHandler.CreateGroup)

		r.Route("/{groupID}", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/", groupHandler.GetGroup)
			r.Put("/", groupHandler.UpdateGroup)
			r.Delete("/", groupHandler.DeleteGroup)

			// Group members
			r.Post("/join", groupHandler.JoinGroup)
			r.Delete("/join", groupHandler.LeaveGroup)

			r.Route("/members/{userID}", func(r chi.Router) {
				r.Use(authMiddleware)
				r.Put("/", groupHandler.UpdateMember)
				r.Delete("/", groupHandler.RemoveMember)
			})

			// Group posts
			r.Route("/posts", func(r chi.Router) {
				r.Use(authMiddleware)
				r.Get("/", groupHandler.GetPosts)
				r.Post("/", groupHandler.CreatePost)

				// Group post reactions
				r.Route("/{postID}/reactions", func(r chi.Router) {
					r.Use(authMiddleware)
					r.Get("/", groupHandler.GetGroupPostReactions)
					r.Post("/", groupHandler.AddGroupPostReaction)
				})

				// Group post comments
				r.Route("/{groupPostID}/comments", func(r chi.Router) {
					r.Use(authMiddleware)
					r.Get("/", groupCommentHandler.GetGroupPostComments)
					r.Post("/", groupCommentHandler.CreateGroupPostComment)
				})
			})

			// Group events
			r.Route("/events", func(r chi.Router) {
				r.Use(authMiddleware)
				r.Get("/", groupHandler.GetEvents)
				r.Post("/", groupHandler.CreateEvent)
			})

			// Group chat
			r.Route("/messages", func(r chi.Router) {
				r.Use(authMiddleware)
				r.Get("/", messageHandler.GetGroupMessages)
				r.Post("/", messageHandler.SendGroupMessage)
			})
		})

		// Event responses
		r.Post("/events/{eventID}/respond", groupHandler.RespondToEvent)
	})

	// User routes
	r.Route("/api/users", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/followers", userHandler.GetFollowers)
		r.Get("/following", userHandler.GetFollowing)
		r.Get("/counts", userHandler.GetFollowCounts)
		r.Get("/suggested", userHandler.GetSuggestedUsers)
		r.Get("/online", userHandler.GetOnlineUsers)

		// Profile routes
		r.Get("/profile", userHandler.GetProfile)
		r.Put("/profile", userHandler.UpdateProfile)
		r.Put("/profile/privacy", userHandler.UpdateProfilePrivacy)
		r.Get("/{userID}/profile", userHandler.GetProfile)

		// Follow routes for specific users
		r.Get("/{userID}/followers", userHandler.GetFollowers)
		r.Get("/{userID}/following", userHandler.GetFollowing)
		r.Get("/{userID}/counts", userHandler.GetFollowCounts)
		r.Get("/{userID}/follow-status", userHandler.GetFollowStatus)
		r.Post("/{userID}/follow", userHandler.FollowUser)
		r.Delete("/{userID}/follow", userHandler.UnfollowUser)
		r.Delete("/{userID}/follow-request", userHandler.CancelFollowRequest)

		// Get all users (including private)
		r.Get("/all", userHandler.GetAllUsers)

		// Message request routes
		r.Post("/accept-message-request", userHandler.AcceptMessageRequestHandler)
	})

	// Activity routes
	r.Route("/api/activity", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/", activityHandler.GetUserActivities)
		r.Get("/posts", activityHandler.GetUserPosts)
		r.Get("/settings", activityHandler.GetActivitySettings)
		r.Put("/settings", activityHandler.UpdateActivitySettings)
		r.Put("/{activityID}/hide", activityHandler.HideActivity)
		r.Put("/{activityID}/unhide", activityHandler.UnhideActivity)

		// Other user's activities (with privacy filtering)
		r.Get("/{userID}", activityHandler.GetUserActivities)
		r.Get("/{userID}/posts", activityHandler.GetUserPosts)
	})

	// Notification routes
	notificationHandler := handlers.NewNotificationHandler(db)
	r.Route("/api/notifications", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/", notificationHandler.GetNotifications)
		r.Put("/read", notificationHandler.MarkNotificationAsRead)
		r.Put("/read-all", notificationHandler.MarkAllNotificationsAsRead)
		r.Get("/unread-count", notificationHandler.GetUnreadCount)
	})

	// Message routes
	r.Route("/api/messages", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/conversations", messageHandler.GetConversations)
		r.Get("/unread-count", messageHandler.GetUnreadMessageCount)
		r.Get("/{userID}", messageHandler.GetPrivateMessages)
		r.Post("/{userID}", messageHandler.SendPrivateMessage)
		r.Put("/{userID}/read", messageHandler.MarkMessagesAsRead)
	})

	// Upload route
	r.Route("/api/upload", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Post("/", uploadHandler.UploadFile)
	})

	// WebSocket route (authentication handled in WebSocket handler)
	r.Get("/ws", wsHandler.ServeWS)

	// Serve static files for uploads
	fs := http.FileServer(http.Dir("./uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fs))

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	fmt.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
