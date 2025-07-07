package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/hezronokwach/soshi/pkg/db/sqlite"
	"github.com/hezronokwach/soshi/pkg/handlers"
	"github.com/hezronokwach/soshi/pkg/middleware"
	r "github.com/hezronokwach/soshi/pkg/router"
	"github.com/hezronokwach/soshi/pkg/websocket"
)

func main() {
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
	notificationHandler := handlers.NewNotificationHandler(db)

	// Create router
	router := r.NewRouter()
	authMiddleware := middleware.Auth(db)

	// Serve static files for uploads
	fs := http.FileServer(http.Dir("./uploads"))
	router.AddRoute("GET", "/uploads/{file:.*}", func(w http.ResponseWriter, r *http.Request) {
		http.StripPrefix("/uploads/", fs).ServeHTTP(w, r)
	})

	// Setup all routes
	r.SetupAuthRoutes(router, authHandler)
	r.SetupPostRoutes(router, postHandler, commentHandler, authMiddleware)
	r.SetupGroupRoutes(router, groupHandler, groupCommentHandler, messageHandler, authMiddleware)
	r.SetupUserRoutes(router, userHandler, authMiddleware)
	r.SetupActivityRoutes(router, activityHandler, authMiddleware)
	r.SetupNotificationRoutes(router, notificationHandler, authMiddleware)
	r.SetupMessageRoutes(router, messageHandler, authMiddleware)
	r.SetupUploadRoutes(router, uploadHandler, authMiddleware)
	r.SetupWebSocketRoutes(router, wsHandler)

	// Apply global middleware and use our router
	var handler http.Handler = router
	handler = middleware.WithLogging(handler.ServeHTTP)
	handler = middleware.WithRecover(handler.ServeHTTP)
	handler = middleware.WithTimeout(handler.ServeHTTP, 60*time.Second)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	fmt.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
