#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Use docker-compose or docker compose based on availability
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

show_help() {
    echo -e "${BLUE}🛠️  Development Helper Script${NC}"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build     - Build and start all containers"
    echo "  start     - Start existing containers"
    echo "  stop      - Stop all containers"
    echo "  restart   - Restart all containers"
    echo "  logs      - Show container logs"
    echo "  status    - Show container status"
    echo "  clean     - Remove containers and images"
    echo "  shell-be  - Access backend container shell"
    echo "  shell-fe  - Access frontend container shell"
    echo "  help      - Show this help message"
}

case "$1" in
    build)
        echo -e "${GREEN}🔨 Building and starting containers...${NC}"
        # Install frontend dependencies first
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        cd frontend && npm install && cd ..
        mkdir -p data uploads
        $COMPOSE_CMD up --build -d
        echo -e "${GREEN}✅ Build complete!${NC}"
        ;;
    start)
        echo -e "${GREEN}🚀 Starting containers...${NC}"
        $COMPOSE_CMD start
        ;;
    stop)
        echo -e "${YELLOW}🛑 Stopping containers...${NC}"
        $COMPOSE_CMD stop
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting containers...${NC}"
        $COMPOSE_CMD restart
        ;;
    logs)
        echo -e "${BLUE}📋 Showing logs...${NC}"
        $COMPOSE_CMD logs -f
        ;;
    status)
        echo -e "${BLUE}📊 Container status:${NC}"
        $COMPOSE_CMD ps
        ;;
    clean)
        echo -e "${RED}🧹 Cleaning up containers and images...${NC}"
        $COMPOSE_CMD down --rmi all --volumes --remove-orphans
        ;;
    shell-be)
        echo -e "${BLUE}🐚 Accessing backend container shell...${NC}"
        $COMPOSE_CMD exec backend sh
        ;;
    shell-fe)
        echo -e "${BLUE}🐚 Accessing frontend container shell...${NC}"
        $COMPOSE_CMD exec frontend sh
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo ""
            show_help
        fi
        ;;
esac