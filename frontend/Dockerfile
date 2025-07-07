FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Copy package-lock.json if it exists, otherwise skip
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit || npm install

# Copy the source code
COPY . .

# Build the application
RUN npm run build

# Use a smaller image for the final container
FROM node:18-alpine

WORKDIR /app

# Copy the build output from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
