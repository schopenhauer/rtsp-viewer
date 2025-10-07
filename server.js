require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const compression = require('compression');

const app = express();
app.use(compression()); // Enable gzip compression for static files
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const RTSP_URL = process.env.RTSP_URL || 'rtsp://10.0.0.182:7447/SDHa3EtQ0i6wPuOV';
const PORT = process.env.PORT || 3001;

// Shared stream state
let ffmpegCommand = null;
let ffmpegStream = null;
let clients = new Set();
let streamBuffer = [];
let intentionalKill = false;
const MAX_BUFFER_SIZE = 100; // Keep last 100 chunks for new clients

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start FFmpeg stream (shared by all clients)
function startStream() {
  if (ffmpegCommand) return;
  
  console.log('Starting FFmpeg stream...');
  streamBuffer = [];
  intentionalKill = false;
  
  ffmpegCommand = ffmpeg(RTSP_URL)
    .inputOptions([
      '-rtsp_transport', 'tcp',
      '-analyzeduration', '500000',    // Reduced from 1000000
      '-probesize', '500000',          // Reduced from 1000000
      '-fflags', 'nobuffer',           // Minimize buffering
      '-flags', 'low_delay'            // Low latency mode
    ])
    .outputOptions([
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-b:v', '1000k',
      '-bf', '0',
      '-muxdelay', '0.001',
      '-preset', 'ultrafast',          // Fastest encoding
      '-tune', 'zerolatency',          // Zero latency tuning
      '-r', '25'
    ])
    .noAudio()
    .on('start', (commandLine) => {
      console.log('FFmpeg started');
    })
    .on('error', (err) => {
      if (!intentionalKill) {
        console.error('FFmpeg error:', err.message);
      }
      stopStream();
      // Restart stream if clients are still connected and it wasn't intentional
      if (!intentionalKill && clients.size > 0) {
        console.log('Restarting stream in 5 seconds...');
        setTimeout(startStream, 5000);
      }
    })
    .on('end', () => {
      if (!intentionalKill) {
        console.log('FFmpeg stream ended');
      }
      stopStream();
    });

  ffmpegStream = ffmpegCommand.pipe();
  
  ffmpegStream.on('data', (chunk) => {
    // Add to buffer for new clients
    streamBuffer.push(chunk);
    if (streamBuffer.length > MAX_BUFFER_SIZE) {
      streamBuffer.shift();
    }
    
    // Broadcast to all connected clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(chunk, { binary: true }, (err) => {
          if (err) {
            console.error('WebSocket send error:', err);
            clients.delete(client);
          }
        });
      } else {
        clients.delete(client);
      }
    });
  });

  ffmpegStream.on('error', (err) => {
    console.error('Stream error:', err);
  });
}

function stopStream() {
  if (ffmpegCommand) {
    intentionalKill = true;
    try {
      ffmpegCommand.kill('SIGKILL');
    } catch (e) {
      // Ignore errors
    }
    ffmpegCommand = null;
    ffmpegStream = null;
    streamBuffer = [];
  }
}

wss.on('connection', (ws) => {
  console.log(`Client connected (total: ${clients.size + 1})`);
  
  clients.add(ws);
  
  // Start stream if this is the first client
  if (clients.size === 1) {
    startStream();
  } else {
    // Send buffered data to new client for faster initial display
    streamBuffer.forEach((chunk) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk, { binary: true });
      }
    });
  }

  // Handle client disconnect
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected (remaining: ${clients.size})`);
    
    // Stop stream if no clients are connected
    if (clients.size === 0) {
      console.log('No clients connected - stopping FFmpeg');
      stopStream();
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(ws);
    
    if (clients.size === 0) {
      stopStream();
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Streaming from: ${RTSP_URL}`);
});
