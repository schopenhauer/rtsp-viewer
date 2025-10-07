# RTSP Viewer

## Introduction

1. **FFmpeg** connects to the RTSP(S) stream and converts it to MPEG1 format
2. The converted stream is sent via **WebSocket** to connected web clients
3. **JSMpeg** library decodes and displays the MPEG1 video in an HTML5 canvas

## Usage

### Docker (Recommended)

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Or build and run with Docker:
   ```bash
   docker build -t rtsp-viewer .
   docker run -d -p 3001:3001 --name rtsp-viewer rtsp-viewer
   ```

### Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file (optional):

   ```env
   RTSP_URL=rtsp://your-camera-ip:port/stream
   PORT=3001
   ```

3. Start the server:

   ```bash
   npm start
   ```
