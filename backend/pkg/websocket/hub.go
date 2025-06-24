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

	// User ID to clients mapping for targeted messaging
	userClients map[int][]*Client
}

// GetOnlineUserIDs returns a slice of user IDs that are currently connected
func (h *Hub) GetOnlineUserIDs() []int {
	var userIDs []int
	for userID := range h.userClients {
		if len(h.userClients[userID]) > 0 {
			userIDs = append(userIDs, userID)
		}
	}
	return userIDs
}

// SendMessage sends a message to the broadcast channel
func (h *Hub) SendMessage(message []byte) {
	h.broadcast <- message
}

// SendMessageToUser sends a message to a specific user
func (h *Hub) SendMessageToUser(userID int, message []byte) {
	if clients, exists := h.userClients[userID]; exists {
		for _, client := range clients {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.clients, client)
				h.removeUserClient(userID, client)
			}
		}
	}
}

// IsUserOnline checks if a user is currently connected
func (h *Hub) IsUserOnline(userID int) bool {
	clients, exists := h.userClients[userID]
	return exists && len(clients) > 0
}

// addUserClient adds a client to the user mapping
func (h *Hub) addUserClient(userID int, client *Client) {
	if h.userClients == nil {
		h.userClients = make(map[int][]*Client)
	}
	h.userClients[userID] = append(h.userClients[userID], client)
}

// removeUserClient removes a client from the user mapping
func (h *Hub) removeUserClient(userID int, client *Client) {
	if clients, exists := h.userClients[userID]; exists {
		for i, c := range clients {
			if c == client {
				h.userClients[userID] = append(clients[:i], clients[i+1:]...)
				if len(h.userClients[userID]) == 0 {
					delete(h.userClients, userID)
				}
				break
			}
		}
	}
}

// NewHub creates a new hub
func NewHub() *Hub {
	return &Hub{
		broadcast:   make(chan []byte),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		userClients: make(map[int][]*Client),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.clients[client] = true
			h.addUserClient(client.UserID, client)
			log.Printf("Client connected: %d", client.UserID)

			// Send welcome message
			welcomeMsg := map[string]interface{}{
				"type":    "system",
				"message": "Welcome to the chat!",
			}
			welcomeJSON, _ := json.Marshal(welcomeMsg)
			client.Send <- welcomeJSON

			// Broadcast online status to other users (but not to the connecting user)
			onlineMsg := map[string]interface{}{
				"type":      "user_online_status",
				"user_id":   client.UserID,
				"is_online": true,
			}
			onlineJSON, _ := json.Marshal(onlineMsg)

			// Send to all clients except the one that just connected
			for otherClient := range h.clients {
				if otherClient.UserID != client.UserID {
					select {
					case otherClient.Send <- onlineJSON:
					default:
						close(otherClient.Send)
						delete(h.clients, otherClient)
						h.removeUserClient(otherClient.UserID, otherClient)
					}
				}
			}

		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				h.removeUserClient(client.UserID, client)
				close(client.Send)
				log.Printf("Client disconnected: %d", client.UserID)

				// Broadcast offline status if no more clients for this user
				if !h.IsUserOnline(client.UserID) {
					offlineMsg := map[string]interface{}{
						"type":      "user_online_status",
						"user_id":   client.UserID,
						"is_online": false,
					}
					offlineJSON, _ := json.Marshal(offlineMsg)

					// Send to all remaining clients
					for otherClient := range h.clients {
						select {
						case otherClient.Send <- offlineJSON:
						default:
							close(otherClient.Send)
							delete(h.clients, otherClient)
							h.removeUserClient(otherClient.UserID, otherClient)
						}
					}
				}
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
			case "private", "private_message":
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
							h.removeUserClient(client.UserID, client)
						}
					}
				}

			case "typing_indicator":
				// Typing indicator to specific user
				recipientID, ok := msg["recipient_id"].(float64)
				if !ok {
					log.Printf("Typing indicator has no recipient_id")
					continue
				}

				// Send typing indicator to recipient only
				h.SendMessageToUser(int(recipientID), message)

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
						h.removeUserClient(client.UserID, client)
					}
				}

			case "notification":
				// Notification to specific user
				recipientID, ok := msg["recipient_id"].(float64)
				if !ok {
					log.Printf("Notification has no recipient_id")
					continue
				}

				// Send notification to specific user
				h.SendMessageToUser(int(recipientID), message)

			default:
				// Broadcast to all clients
				for client := range h.clients {
					select {
					case client.Send <- message:
					default:
						close(client.Send)
						delete(h.clients, client)
						h.removeUserClient(client.UserID, client)
					}
				}
			}
		}
	}
}
