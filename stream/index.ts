import express from "express";
import dotenv from "dotenv";
import http from "http";
import { WebSocket } from "ws";
import { ChangeStreamDocument } from "mongodb";
import { MongoClient } from "mongodb";
dotenv.config();

const app = express();

const uri = process.env.MONGODB_CONNECTION_STRING;
export const client = new MongoClient(uri ?? "");

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws, req) {
  const origin = req.headers.origin;

  // only allow gridy.fun to connect
  if (origin && origin.endsWith(".gridy.fun")) {
    console.log(`Connection allowed from origin: ${origin}`);
  } else {
    console.log(`Connection denied from origin: ${origin}`);
    ws.close(1008, "Origin not allowed"); // Close with a policy violation code
    return;
  }

  ws.on("error", console.error);

  ws.on("message", function incoming(message) {
    // if message is ping, send pong

    try {
      const data = JSON.parse(message.toString());
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch (e) {
      console.error("Invalid JSON");
      return;
    }
  });

  ws.on("open", () => {
    console.log("Connected to a client");
  });

  const db = client.db("starknet");
  const collection = db.collection("tiles_mined");
  const changeStream = collection.watch();
  changeStream.on("change", (next: ChangeStreamDocument<Document>) => {
    // process next document
    const operationType = next.operationType;
    if (operationType === "insert") {
      ws.send(JSON.stringify(next.fullDocument));
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(process.env.PORT, () => {
  console.log("Server started on port ", process.env.PORT);
});
