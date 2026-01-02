// MongoDB connection and operations
import { MongoClient, Db, Collection, ObjectId, Document } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db();
  return cachedDb;
}

export function getCollection<T extends Document>(
  name: string
): Promise<Collection<T>> {
  return connectToDatabase().then((db) => db.collection<T>(name));
}

export { ObjectId };
