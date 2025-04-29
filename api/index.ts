import express from "express";
import dotenv from "dotenv";
import { imageIdToAssets } from "./modules/grid";
import { client } from "./modules/db";
import {
  GEMSTONE_COORDINATES,
  getBlockIndex,
  getLeafData,
  getProof,
  merkleTreeSetup,
} from "./modules/merkleTree";
import { checkIfBlockMined } from "./modules/starknet";
import path from "path";

dotenv.config();
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "assets")));

// Middleware to set headers for all responses
app.use((req, res, next) => {
  // const origin = req.headers.origin as string;
  // res.setHeader("Content-Type", "application/json");

  // // Check if the origin ends with gridy.com
  // if (origin && origin.endsWith(".gridy.fun")) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // }

  next();
});

app.get("/check_for_gemstone", async (req, res) => {
  try {
    if (!req.query.block_id) {
      res.status(400).json({ error: "Block ID not provided" });
      return;
    }

    const block_id = req.query.block_id as string;

    const assets = imageIdToAssets(BigInt(block_id));

    const db = await client.db("starknet");
    const tiles_collection = await db.collection("tiles_mined");

    // const block = await tiles_collection.findOne({
    //   block_id: Number(block_id),
    // });

    let isFound = false;

    // if (!block) {
    //   res.status(400).json({ error: "Block not minted" });
    //   return;
    // }

    const checkIfMined = await checkIfBlockMined(Number(block_id));

    if (!checkIfMined.open_status) {
      res.status(400).json({ error: "Block not minted" });
      return;
    }

    const gemstoneCoordinates = GEMSTONE_COORDINATES;

    const [assetX, assetY, assetZ] = assets;

    for (const key in gemstoneCoordinates) {
      const formatKey = parseInt(key);
      const { x, y, z } =
        gemstoneCoordinates[formatKey as keyof typeof gemstoneCoordinates];

      if (
        BigInt(x + 5) === assetX &&
        BigInt(y + 5) === assetY &&
        BigInt(z) === assetZ
      ) {
        isFound = true;
      }
    }

    if (!isFound) {
      res.json({ result: false });
    } else {
      res.json({ result: true });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error checking for gemstone" });
  }
});

app.get("/get_blocks_mined", async (req, res) => {
  try {
    const game_id = req.query.game_id as string;
    const db = await client.db("starknet");
    const collection = await db.collection("tiles_mined");

    const blocks = await collection
      .find({
        game_id: Number(game_id),
        "_cursor.to": null,
      })
      .toArray();

    res.status(200).json({ blocks });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "Error Fetching Blocks" });
  }
});

app.get("/get_pending_claims", async (req, res) => {
  const address = req.query.address as string;

  const db = await client.db("starknet");
  const collection = await db.collection("tiles_mined");

  const prize_claims = await db.collection("prize_claims");

  const blocks = await collection
    .find({
      player: address.toLowerCase(),
      "_cursor.to": null,
    })
    .toArray();

  let isFound = false;

  const arr = [];

  for (const block of blocks) {
    const gemstoneIndexHash = getBlockIndex(block.block_id);

    if (gemstoneIndexHash === "-1") {
      continue;
    }

    isFound = true;
    arr.push(block.block_id);
  }
  const response = [];

  for (const block of arr) {
    const claim = await prize_claims.findOne({
      block_id: block,
    });

    if (!claim) {
      response.push(block);
    }
  }

  if (!isFound) {
    res.status(200).json({ message: "No pending claims" });
    return;
  }

  res.status(200).json({ result: response });
});

app.get("/get_claim_gemstone_params", async (req, res) => {
  try {
    const block_id = req.query.block_id as string;

    const db = await client.db("starknet");
    const collection = await db.collection("tiles_mined");

    const block = await collection.findOne({
      block_id: Number(block_id),
    });

    if (!block) {
      res.send("Block not minted");
      return;
    }
    const gemstoneIndexHash = getBlockIndex(block_id);

    if (gemstoneIndexHash === "-1") {
      res.send("Block does not contain gemstone");
      return;
    }

    const proof = getProof(gemstoneIndexHash);
    const { nonce, prize } = getLeafData(block_id);
    const game_id = block.game_id;

    res.status(200).json({
      proof,
      nonce,
      prize,
      game_id,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "Error claiming gemstone" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const server = app.listen(process.env.PORT, async () => {
  await merkleTreeSetup();
  console.log("Server ready on port ", process.env.PORT);
});

// Graceful shutdown
function closeGracefully(signal: any) {
  console.log(`Received signal to terminate: ${signal}`);

  server.close(() => {
    // close db connection
    client.close();
    console.log("Http server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
