const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('listening', function() {
  console.log('WebSocket server listening on port 8080');
});

wss.on('connection', function connection(ws) {
  console.log('WebSocket client connected.');

  // Send the contents of data.json every 20 seconds
  const intervalId = setInterval(() => {
    try {
      const data = fs.readFileSync('./data.json', 'utf8');
      ws.send(data);
    } catch (err) {
      console.error(`Error reading data.json: ${err}`);
    }
  }, 20000);

  ws.on('close', () => {
    console.log('WebSocket client disconnected.');
    clearInterval(intervalId);
  });
});
