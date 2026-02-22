import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;
let initPromise: Promise<void> | null = null;

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return uri;
}

function getMongoDbName() {
  return process.env.MONGODB_DB_NAME || "harmonicvc";
}

export async function getMongoDb() {
  if (db) return db;

  const uri = getMongoUri();
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(getMongoDbName());
  return db;
}

export async function initializeMongo() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const database = await getMongoDb();
    const users = database.collection("users");
    await users.createIndex({ id: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
  })();

  return initPromise;
}
