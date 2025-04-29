const WebSocket = require("ws");

const SERVER_URL = "ws://localhost:3002"; // Change to your server URL
const NUMBER_OF_CLIENTS = 1000; // Number of simulated clients
const MESSAGE_INTERVAL = 1000; // Time in ms between messages

let clients = [];

function createClient(id) {
  const ws = new WebSocket(SERVER_URL);

  ws.on("open", function open() {
    console.log(`Client ${id} connected`);
    setInterval(() => {
      ws.send(`Hello from client ${id}`);
    }, MESSAGE_INTERVAL);
  });

  ws.on("message", function message(data) {
    console.log(`Client ${id} received: ${data}`);
  });

  ws.on("close", function close() {
    console.log(`Client ${id} disconnected`);
  });

  ws.on("error", function error(err) {
    console.log(`Client ${id} error: ${err.message}`);
  });

  clients.push(ws);
}

// Start the test by creating multiple WebSocket clients
for (let i = 1; i <= NUMBER_OF_CLIENTS; i++) {
  createClient(i);
}
