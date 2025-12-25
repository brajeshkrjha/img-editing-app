import type { Db } from "mongodb";
import { MongoClient } from "mongodb";

type Cached = {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<MongoClient> | null;
};

const globalMongo = globalThis as unknown as {
  __mongoCached?: Cached;
};

const cached: Cached =
  globalMongo.__mongoCached ??
  (globalMongo.__mongoCached = { client: null, db: null, promise: null });

export async function connectToMongo(): Promise<{ client: MongoClient; db: Db }> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  if (!cached.promise) {
    cached.client = new MongoClient(uri);
    cached.promise = cached.client.connect();
  }

  const client = await cached.promise;
  cached.client = client;

  const db = cached.db ?? client.db(dbName);
  cached.db = db;

  return { client, db };
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToMongo();
  return db;
}

