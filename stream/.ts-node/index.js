"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const app = (0, express_1.default)();
const uri = process.env.MONGODB_CONNECTION_STRING;
exports.client = new mongodb_1.MongoClient(uri ?? "");
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocket.Server({ server });
wss.on("connection", function connection(ws, req) {
    const origin = req.headers.origin;
    // // only allow gridy.com to connect
    // if (origin && origin.endsWith(".gridy.fun")) {
    //   console.log(`Connection allowed from origin: ${origin}`);
    // } else {
    //   console.log(`Connection denied from origin: ${origin}`);
    //   ws.close(1008, "Origin not allowed"); // Close with a policy violation code
    //   return;
    // }
    ws.on("error", console.error);
    ws.on("message", function incoming(message) {
        // if message is ping, send pong
        try {
            const data = JSON.parse(message.toString());
            if (data.type === "ping") {
                ws.send(JSON.stringify({ type: "pong" }));
            }
        }
        catch (e) {
            console.error("Invalid JSON");
            return;
        }
    });
    ws.on("open", () => {
        console.log("Connected to a client");
    });
    const db = exports.client.db("starknet");
    const collection = db.collection("tiles_mined");
    const changeStream = collection.watch();
    changeStream.on("change", (next) => {
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
//# sourceMappingURL=index.js.map