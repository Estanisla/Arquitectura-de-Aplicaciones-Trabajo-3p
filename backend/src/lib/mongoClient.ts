import dns from "node:dns";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

let client: MongoClient | null = null;

export const getMongoClient = (): MongoClient => {
  if (!client) {
    if (env.MONGODB_DNS_SERVERS.length > 0) {
      dns.setServers(env.MONGODB_DNS_SERVERS);
    }
    client = new MongoClient(env.MONGODB_URI);
  }
  return client;
};

export const getMongoDb = () => {
  return getMongoClient().db(env.MONGODB_DB_NAME);
};

export const connectMongo = async (): Promise<void> => {
  await getMongoClient().connect();
  const db = getMongoDb();
  await db.collection("reviews").createIndex({ product_id: 1, created_at: -1 });
  await db.collection("reviews").createIndex({ vendor_id: 1 });
};

export const disconnectMongo = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
  }
};
