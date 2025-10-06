let player;
let statusEl;

document.addEventListener('DOMContentLoaded', () => {
  statusEl = document.getElementById('status');
  connect();
});

function connect() {
  const canvas = document.getElementById('canvas');
  const wsUrl = `ws://${window.location.hostname}:${window.location.port || 3001}`;
  
  updateStatus('connecting', 'Connecting...');
  
  try {
    player = new JSMpeg.Player(wsUrl, {
      canvas: canvas,
      autoplay: true,
      audio: false,
      videoBufferSize: 512 * 1024,
      onVideoDecode: function() {
        if (statusEl.classList.contains('connecting')) {
          updateStatus('connected', 'Connected');
          // Hide status after 2 seconds
          setTimeout(() => {
            statusEl.classList.add('hide');
          }, 2000);
        }
      },
      onSourceEstablished: function(source) {
        console.log('WebSocket connected');
      },
      onSourceCompleted: function() {
        console.log('Stream ended');
        updateStatus('error', 'Disconnected');
        statusEl.classList.remove('hide');
        // Try to reconnect after 5 seconds
        setTimeout(reconnect, 5000);
      }
    });
  } catch (error) {
    console.error('Player error:', error);
    updateStatus('error', 'Failed: ' + error.message);
  }
}

function updateStatus(type, message) {
  statusEl.className = type;
  statusEl.textContent = message;
}

function reconnect() {
  if (player) {
    try {
      player.destroy();
    } catch (e) {
      console.error('Error destroying player:', e);
    }
  }
  setTimeout(connect, 500);
}
