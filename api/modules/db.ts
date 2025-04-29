import "dotenv/config";

import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_CONNECTION_STRING;
export const client = new MongoClient(uri ?? "");
