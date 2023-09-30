const WebSocket = require('ws');

const headers = {
  'Pragma': 'no-cache',
  'Cache-Control': 'no-cache',
  'Accept-Encoding': 'gzip, deflate ,br',
  'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
  'Sec-WebSocket-Version': '13'
};

const options = {
  headers,
  perMessageDeflate: false // disable compression
};
var ws;
if(process.argv.includes("--debug")){
  ws = new WebSocket('ws://localhost:8080', options);
  console.log("Using local debug server on ws://localhost:8080");
} else {
  ws = new WebSocket('wss://backend.sams-ticker.de/dvv', options);
}

ws.on('open', () => {
  console.log('Connected to wss server');
});

ws.on('error', (err) => {
  console.error('WebSocket error', err);
});

module.exports = ws;
