# Use Alpine Linux for minimal image size
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY server.js ./
COPY public ./public

# Expose port
EXPOSE 3001

# Run the application
CMD ["node", "server.js"]
