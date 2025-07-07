# Soshi - Social Network Platform

A comprehensive Facebook-like social network built with modern web technologies, featuring real-time communication, user profiles, groups, and advanced privacy controls.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure registration and login with sessions and cookies
- **User Profiles**: Public and private profile options with customizable information
- **Posts & Comments**: Create posts with privacy settings (public, almost private, private)
- **Media Support**: Upload and display images (JPEG, PNG, GIF)
- **Follow System**: Follow/unfollow users with request-based following for private profiles

### Social Features
- **Groups**: Create and join groups with invitation system
- **Events**: Group members can create and manage events with RSVP functionality
- **Real-time Chat**: Private messaging and group chat rooms using WebSockets
- **Notifications**: Real-time notifications for follow requests, group invitations, and events
- **Privacy Controls**: Granular privacy settings for posts and profiles

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Real-time**: WebSockets for chat and notifications

### Backend
- **Runtime**: Go 1.21+
- **Database**: SQLite with migrations
- **Authentication**: Sessions and cookies
- **File Storage**: Local file system for media uploads
- **WebSocket**: Gorilla WebSocket for real-time features

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: golang-migrate
- **Security**: bcrypt for password hashing

## 📋 Prerequisites

- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- Git

## 🚀 Getting Started

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://learn.zone01kisumu.ke/git/skisenge/social-network.git soshi
   cd soshi
   ```

2. **Build and run with Docker**
   ```bash
   # Make scripts executable
   chmod +x build.sh dev.sh
   
   # Build and start all services
   ./build.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Option 2: Local Development

1. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Setup Backend**
   ```bash
   cd backend
   go mod download
   go run main.go
   ```

## 📁 Project Structure

```
soshi/
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/               # App router pages
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Utility functions
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── package.json
├── backend/                   # Go backend application
│   ├── pkg/
│   │   ├── db/
│   │   │   ├── migrations/    # Database migrations
│   │   │   └── sqlite/        # SQLite connection
│   │   ├── handlers/          # HTTP handlers
│   │   ├── middleware/        # Authentication & other middleware
│   │   ├── models/            # Database models
│   │   └── websocket/         # WebSocket handlers
│   ├── uploads/               # File uploads directory
│   └── server.go
├── data/                      # SQLite database storage
├── docker-compose.yml         # Docker orchestration
├── build.sh                   # Build script
├── dev.sh                     # Development helper script
└── README.md
```

## 🔧 Development Scripts

### Docker Commands
```bash
# Build and start all services
./dev.sh build

# View logs
./dev.sh logs

# Stop services
./dev.sh stop

# Access backend shell
./dev.sh shell-be

# Access frontend shell
./dev.sh shell-fe

# Clean all containers and images
./dev.sh clean
```

### Local Development
```bash
# Frontend development
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Backend development
cd backend
go run server.go       # Start development server
go build             # Build binary
```

## 🗃️ Database Schema

The application uses SQLite with a migration system. Key entities include:

- **Users**: Authentication and profile information
- **Posts**: User-generated content with privacy settings
- **Groups**: Community spaces with membership management
- **Events**: Group events with RSVP functionality
- **Messages**: Private and group messaging
- **Notifications**: Real-time user notifications
- **Followers**: User relationship management

## 🔐 Authentication & Security

- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Secure session cookies with expiration
- **Privacy Controls**: Multiple privacy levels for posts and profiles
- **Input Validation**: Comprehensive validation on both frontend and backend
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check session status

### Users & Profiles
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/follow` - Follow/unfollow user
- `GET /api/users/followers` - Get followers list

### Posts
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/:id` - Get specific post

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create new group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/events` - Create group event

### Real-time Features
- `WebSocket /ws/chat` - Private messaging
- `WebSocket /ws/notifications` - Real-time notifications
- `WebSocket /ws/groups/:id` - Group chat


## 📝 Environment Variables

### Backend (.env)
```env
PORT=8080
DB_PATH=./data/soshi.db
MIGRATIONS_PATH=file://pkg/db/migrations/sqlite
JWT_SECRET=your-secret-key
UPLOAD_PATH=./uploads
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🚢 Deployment

### Production Build
```bash
# Build Docker images for production
docker-compose -f docker-compose.prod.yml up --build -d
```

### Environment Setup
1. Set appropriate environment variables
2. Configure database path for persistence
3. Set up reverse proxy (nginx/caddy) if needed
4. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built as part of a comprehensive full-stack development project
- Inspired by modern social media platforms
- Uses industry-standard technologies and best practices

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.


## Authors
[Stephen Kisengese](https://www.github.com/stkisengese)
[Hezron Okwatch](https://www.github.com/hezronokwach)
[Philip Ochieng](https://www.github.com/philip38-hub)
[Brian Shisia](https://www.github.com/bshisia)

---

**Built with ❤️ using Next.js, Go, and modern web technologies**