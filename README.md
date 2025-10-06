# Door Camera Stream Viewer

A Node.js appli## Usage

### Option 1: Docker (Recommended)

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Or build and run with Docker:
   ```bash
   docker build -t doorcam .
   docker run -d -p 3001:3001 --name doorcam doorcam
   ```

3. Open your browser: `http://localhost:3001`

### Option 2: Node.js

1. Set environment variables (optional):
   ```bash
   export RTSP_URL="rtsp://your-camera-ip:port/stream"
   export PORT=3001
   ```

2. Or edit `server.js` directly to set the default URL

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser: `http://localhost:3001`treams RTSPS (secure RTSP) video feeds and displays them in a web browser using WebSocket and FFmpeg.

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (v14 or higher)
   ```bash
   # Check if installed
   node --version
   npm --version
   ```

2. **FFmpeg** (required for video stream processing)
   
   **On Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```
   
   **On macOS:**
   ```bash
   brew install ffmpeg
   ```
   
   **On Windows:**
   - Download from: https://ffmpeg.org/download.html
   - Add to system PATH

   Verify installation:
   ```bash
   ffmpeg -version
   ```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

3. The stream should start automatically.

## Development

For development with auto-restart on file changes:
```bash
npm run dev
```

## How It Works

1. **FFmpeg** connects to the RTSPS stream and converts it to MPEG1 format
2. The converted stream is sent via **WebSocket** to connected web clients
3. **JSMpeg** library decodes and displays the MPEG1 video in an HTML5 canvas
4. The web interface provides connection status and reconnect functionality

## License

ISC
