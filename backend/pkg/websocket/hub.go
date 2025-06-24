package websocket

import (
	"encoding/json"
	"log"
)

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	Register chan *Client

	// Unregister requests from clients
	Unregister chan *Client
}

// GetOnlineUserIDs returns a slice of user IDs that are currently connected
func (h *Hub) GetOnlineUserIDs() []int {
	var userIDs []int
	for client := range h.clients {
		userIDs = append(userIDs, client.UserID)
	}
	return userIDs
}

// NewHub creates a new hub
func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.clients[client] = true
			log.Printf("Client connected: %d", client.UserID)

			// Send welcome message
			welcomeMsg := map[string]interface{}{
				"type":    "system",
				"message": "Welcome to the chat!",
			}
			welcomeJSON, _ := json.Marshal(welcomeMsg)
			client.Send <- welcomeJSON

		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				log.Printf("Client disconnected: %d", client.UserID)
			}

		case message := <-h.broadcast:
			// Parse message to determine recipients
			var msg map[string]interface{}
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			// Check message type
			msgType, ok := msg["type"].(string)
			if !ok {
				log.Printf("Message has no type")
				continue
			}

			switch msgType {
			case "private":
				// Private message to specific user
				recipientID, ok := msg["recipient_id"].(float64)
				if !ok {
					log.Printf("Private message has no recipient_id")
					continue
				}

				// Find recipient and send message
				for client := range h.clients {
					if client.UserID == int(recipientID) || client.UserID == int(msg["sender_id"].(float64)) {
						select {
						case client.Send <- message:
						default:
							close(client.Send)
							delete(h.clients, client)
						}
					}
				}

			case "group":
				// Group message to all members of a group
				// groupID, ok := msg["group_id"].(float64)
				// if !ok {
				// 	log.Printf("Group message has no group_id")
				// 	continue
				// }

				// In a real implementation, we would check if each client is a member of the group
				// For now, we'll just broadcast to all clients
				for client := range h.clients {
					select {
					case client.Send <- message:
					default:
						close(client.Send)
						delete(h.clients, client)
					}
				}

			case "notification":
				// Notification to specific user
				recipientID, ok := msg["recipient_id"].(float64)
				if !ok {
					log.Printf("Notification has no recipient_id")
					continue
				}

				// Find recipient and send notification
				for client := range h.clients {
					if client.UserID == int(recipientID) {
						select {
						case client.Send <- message:
						default:
							close(client.Send)
							delete(h.clients, client)
						}
					}
				}

			default:
				// Broadcast to all clients
				for client := range h.clients {
					select {
					case client.Send <- message:
					default:
						close(client.Send)
						delete(h.clients, client)
					}
				}
			}
		}
	}
}
