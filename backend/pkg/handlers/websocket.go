package handlers

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/hezronokwach/soshi/pkg/models"
	"github.com/hezronokwach/soshi/pkg/websocket"

	websocketG "github.com/gorilla/websocket"
)

type WebSocketHandler struct {
	hub *websocket.Hub
	db  *sql.DB
}

func NewWebSocketHandler(hub *websocket.Hub, db *sql.DB) *WebSocketHandler {
	return &WebSocketHandler{hub: hub, db: db}
}

// ServeWS handles WebSocket connections
func (h *WebSocketHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	log.Printf("WebSocket connection attempt from %s", r.RemoteAddr)

	// Validate session manually since WebSocket doesn't use middleware
	sessionCookie, err := r.Cookie("session_token")
	if err != nil {
		log.Printf("WebSocket: No session cookie found: %v", err)
		http.Error(w, "Unauthorized: No session cookie", http.StatusUnauthorized)
		return
	}

	log.Printf("WebSocket: Found session cookie: %s", sessionCookie.Value[:10]+"...")

	// Get user from session
	user, err := models.GetUserBySessionToken(h.db, sessionCookie.Value)
	if err != nil {
		log.Printf("WebSocket: Invalid session token: %v", err)
		http.Error(w, "Unauthorized: Invalid session", http.StatusUnauthorized)
		return
	}

	log.Printf("WebSocket: User authenticated: %d (%s)", user.ID, user.FirstName)

	// Upgrade HTTP connection to WebSocket
	upgrader := websocketG.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	// Create client
	client := &websocket.Client{
		Hub:      h.hub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		UserID:   user.ID,
		Username: user.FirstName + " " + user.LastName,
	}

	// Register client
	client.Hub.Register <- client

	// Start goroutines for reading and writing
	go client.ReadPump()
	go client.WritePump()
}
