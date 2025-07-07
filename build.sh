#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building and running Next.js/Go application...${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is installed and running
if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi

# Use docker-compose or docker compose based on availability
if command_exists docker-compose; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p data uploads

# Install frontend dependencies first
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        npm install
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}❌ package.json not found in frontend directory${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${RED}❌ Frontend directory not found${NC}"
    exit 1
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
$COMPOSE_CMD down

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
$COMPOSE_CMD up --build -d

# Check if containers are running
echo -e "${YELLOW}🔍 Checking container status...${NC}"
sleep 5

if $COMPOSE_CMD ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers are running successfully!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}🔗 Backend: http://localhost:8080${NC}"
    echo ""
    echo -e "${YELLOW}To view logs: $COMPOSE_CMD logs -f${NC}"
    echo -e "${YELLOW}To stop: $COMPOSE_CMD down${NC}"
else
    echo -e "${RED}❌ Some containers failed to start. Check logs:${NC}"
    $COMPOSE_CMD logs
fi