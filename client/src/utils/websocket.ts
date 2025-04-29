const ws = new WebSocket(import.meta.env.VITE_WS_URL as string);

const heartbeatInterval = 30000;
let timer: NodeJS.Timeout;
let number_of_pings = 0;

function startHeartbeat() {
  timer = setInterval(() => {
    if (number_of_pings > 6) {
      console.log("Connection is dead");
      ws.close();
      clearInterval(timer);
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
      number_of_pings++;
    }
  }, heartbeatInterval);
}

const resetAndStartHeartbeat = () => {
  clearInterval(timer);
  number_of_pings = 0;
  startHeartbeat();
};

export const establishConnection = (handleTileRemoved: (i: number) => void) => {
  try {
    console.log("Connecting to the server");
    resetAndStartHeartbeat();

    ws.onopen = () => {
      console.log("Connected to the server");
    };

    ws.onclose = () => {
      console.log("Disconnected from the server");
    };

    ws.onmessage = (event) => {
      resetAndStartHeartbeat();
      const data = JSON.parse(event.data);
      if (data?.type === "pong") {
        console.log("Connection is alive");
      } else {
        handleTileRemoved(Number(data?.block_id));
      }
    };
  } catch (error) {
    console.error(error);
  }
};

export const sendData = (data: string) => {
  ws.send(data);
};
