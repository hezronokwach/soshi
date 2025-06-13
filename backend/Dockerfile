FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main .

# Use a smaller image for the final container
FROM alpine:latest

# Install dependencies for SQLite
RUN apk --no-cache add ca-certificates libc6-compat

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Copy migrations
COPY --from=builder /app/pkg/db/migrations ./pkg/db/migrations

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]
