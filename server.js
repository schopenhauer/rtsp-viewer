const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const RTSP_URL = process.env.RTSP_URL || 'rtsp://10.0.0.182:7447/SDHa3EtQ0i6wPuOV';
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // FFmpeg stream configuration
  const ffmpegCommand = ffmpeg(RTSP_URL)
    .inputOptions([
      '-rtsp_transport', 'tcp',
      '-analyzeduration', '1000000',
      '-probesize', '1000000'
    ])
    .outputOptions([
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-b:v', '1000k',
      '-bf', '0',
      '-muxdelay', '0.001',
      '-r', '25'
    ])
    .noAudio()
    .on('start', (commandLine) => {
      console.log('FFmpeg started:', commandLine);
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    })
    .on('end', () => {
      console.log('FFmpeg stream ended');
    });

  // Stream the video data to the WebSocket
  const ffmpegStream = ffmpegCommand.pipe();
  
  ffmpegStream.on('data', (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk, { binary: true }, (err) => {
        if (err) {
          console.error('WebSocket send error:', err);
        }
      });
    }
  });

  ffmpegStream.on('error', (err) => {
    console.error('Stream error:', err);
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    ffmpegCommand.kill('SIGKILL');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    ffmpegCommand.kill('SIGKILL');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Streaming from: ${RTSP_URL}`);
});
