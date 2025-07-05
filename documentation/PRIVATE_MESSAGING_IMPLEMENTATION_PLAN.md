# Private Messaging Implementation Plan

## Overview

This document outlines the comprehensive plan to implement private messaging functionality for the Soshi social network. The implementation will follow the requirements specified in `instructions.md` and build upon the existing infrastructure.

## Current State Analysis

### ✅ Already Implemented
- **Database Schema**: Messages table with proper foreign keys and constraints
- **Message Model**: Complete CRUD operations for private and group messages
- **WebSocket Infrastructure**: Hub, Client, and basic message broadcasting
- **Authentication**: Session-based auth with middleware
- **Basic Frontend Structure**: Placeholder chat page and components

### ❌ Missing Components
- **Message API Routes**: No REST endpoints for message operations
- **Message Handler**: Backend handler for HTTP requests
- **Frontend Chat Interface**: Functional chat components
- **Real-time Integration**: Complete WebSocket message flow
- **Message Persistence**: WebSocket messages not saved to database

## Implementation Plan

### Phase 1: Backend API Implementation

#### 1.1 Create Message Handler (`backend/pkg/handlers/message.go`)
```go
type MessageHandler struct {
    db *sql.DB
    hub *websocket.Hub
}

// Required methods:
- SendPrivateMessage(w http.ResponseWriter, r *http.Request)
- GetPrivateMessages(w http.ResponseWriter, r *http.Request)
- GetConversations(w http.ResponseWriter, r *http.Request)
- MarkMessagesAsRead(w http.ResponseWriter, r *http.Request)
```

**Key Features:**
- Validate messaging permissions (followers/public profiles)
- Create messages in database
- Broadcast via WebSocket for real-time delivery
- Handle pagination for message history
- Mark messages as read

#### 1.2 Register Message API Routes (`backend/server.go`)
```go
// Message routes
r.Route("/api/messages", func(r chi.Router) {
    r.Use(authMiddleware)
    r.Get("/conversations", messageHandler.GetConversations)
    r.Get("/{userID}", messageHandler.GetPrivateMessages)
    r.Post("/{userID}", messageHandler.SendPrivateMessage)
    r.Put("/{userID}/read", messageHandler.MarkMessagesAsRead)
})
```

#### 1.3 Enhanced WebSocket Message Handling
- Update WebSocket hub to persist private messages
- Improve message routing to specific users
- Add message type validation
- Implement proper error handling

### Phase 2: Frontend Components Development

#### 2.1 Chat Interface Component (`src/components/chat/ChatInterface.jsx`)
**Layout:**
```
┌─────────────────────────────────────────┐
│ Chat Interface                          │
├─────────────┬───────────────────────────┤
│ Conversation│ Message Area              │
│ List        │                           │
│             │ ┌─────────────────────────┐│
│ • User 1    │ │ Message Bubble          ││
│ • User 2    │ │ Message Bubble          ││
│ • User 3    │ │ Message Bubble          ││
│             │ └─────────────────────────┘│
│             │ ┌─────────────────────────┐│
│             │ │ Message Input           ││
│             │ └─────────────────────────┘│
└─────────────┴───────────────────────────┘
```

**Features:**
- Responsive design for mobile and desktop
- Real-time message updates
- Unread message indicators
- User online status (if available)

#### 2.2 Message Components
- **MessageBubble**: Individual message display with timestamp
- **MessageInput**: Text input with send button and emoji support
- **ConversationList**: List of active conversations with last message preview
- **UserSelector**: Modal/dropdown to start new conversations

#### 2.3 API Integration Layer (`src/lib/api.js`)
```javascript
export const messages = {
  getConversations: () => fetchAPI("/api/messages/conversations"),
  getMessages: (userId, page = 1) => fetchAPI(`/api/messages/${userId}?page=${page}`),
  sendMessage: (userId, content) => fetchAPI(`/api/messages/${userId}`, {
    method: "POST",
    body: JSON.stringify({ content })
  }),
  markAsRead: (userId) => fetchAPI(`/api/messages/${userId}/read`, {
    method: "PUT"
  })
}
```

### Phase 3: WebSocket Integration

#### 3.1 Complete WebSocket Hook (`src/hooks/useWebSocket.js`)
```javascript
const useWebSocket = () => {
  // Connection management
  // Message sending
  // Real-time message receiving
  // Connection status
  // Automatic reconnection
}
```

#### 3.2 Message Persistence Integration
- Ensure WebSocket messages are saved to database
- Handle offline message delivery
- Implement message queuing for disconnected users

#### 3.3 Real-time UI Updates
- Live message display
- Typing indicators (future enhancement)
- Message delivery status
- Unread count updates

### Phase 4: Testing and Validation

#### 4.1 End-to-End Testing
- Two users sending messages
- Message persistence across sessions
- Real-time delivery verification
- Mobile responsiveness

#### 4.2 Permission Validation
- Followers can message each other
- Public profile users can receive messages
- Private profile users block non-followers
- Error handling for permission violations

#### 4.3 WebSocket Connection Testing
- Connection establishment
- Automatic reconnection
- Message delivery during connection issues
- Multiple browser tab handling

## Technical Requirements

### Backend Requirements
- **Language**: Go 1.21+
- **Database**: SQLite with existing schema
- **WebSocket**: Gorilla WebSocket
- **Authentication**: Session-based with cookies
- **API**: RESTful endpoints with JSON responses

### Frontend Requirements
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **WebSocket**: Native WebSocket API
- **Real-time**: WebSocket integration

### Security Considerations
- **Authentication**: All endpoints require valid session
- **Authorization**: Message permission validation
- **Input Validation**: Sanitize message content
- **Rate Limiting**: Prevent message spam (future enhancement)

## File Structure

### Backend Files to Create/Modify
```
backend/
├── pkg/handlers/message.go          [CREATE]
├── server.go                        [MODIFY - Add routes]
└── pkg/websocket/hub.go            [MODIFY - Enhance message handling]
```

### Frontend Files to Create/Modify
```
src/
├── app/chat/page.js                 [MODIFY - Replace placeholder]
├── components/chat/
│   ├── ChatInterface.jsx           [CREATE]
│   ├── MessageBubble.jsx           [CREATE]
│   ├── MessageInput.jsx            [CREATE]
│   ├── ConversationList.jsx        [CREATE]
│   └── UserSelector.jsx            [CREATE]
├── hooks/useWebSocket.js            [MODIFY - Complete implementation]
├── hooks/useMessages.js             [CREATE]
└── lib/api.js                       [MODIFY - Add message functions]
```

## Success Criteria

### Functional Requirements
- ✅ Users can send private messages to followers
- ✅ Users with public profiles can receive messages from anyone
- ✅ Messages are delivered in real-time via WebSocket
- ✅ Message history is persisted and retrievable
- ✅ Users can see list of conversations
- ✅ Unread messages are properly tracked

### Technical Requirements
- ✅ RESTful API endpoints for all message operations
- ✅ WebSocket integration for real-time communication
- ✅ Responsive chat interface
- ✅ Proper error handling and validation
- ✅ Session-based authentication for all operations

### User Experience Requirements
- ✅ Intuitive chat interface similar to modern messaging apps
- ✅ Real-time message delivery and updates
- ✅ Clear indication of message status (sent, delivered, read)
- ✅ Easy conversation management and user selection

## Next Steps

1. **Start with Backend API Implementation** - Create message handler and routes
2. **Build Core Frontend Components** - Chat interface and message components
3. **Integrate WebSocket Communication** - Complete real-time messaging
4. **Test and Validate** - Ensure all requirements are met

This plan provides a comprehensive roadmap for implementing private messaging functionality that meets all the requirements specified in the project instructions while building upon the existing codebase infrastructure.
