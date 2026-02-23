import { getMongoDb } from "../db/mongo";
import type { AppStateRecord, PersistedAppState } from "../types/appState";

const APP_STATES_COLLECTION = "app_states";

export async function getUserAppState(userId: string) {
  const db = await getMongoDb();
  return db
    .collection<AppStateRecord>(APP_STATES_COLLECTION)
    .findOne({ userId }, { projection: { _id: 0, userId: 1, state: 1, createdAt: 1, updatedAt: 1 } });
}

export async function upsertUserAppState(userId: string, state: PersistedAppState) {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  await db.collection<AppStateRecord>(APP_STATES_COLLECTION).updateOne(
    { userId },
    {
      $set: {
        state,
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return getUserAppState(userId);
}

export async function deleteUserAppState(userId: string) {
  const db = await getMongoDb();
  await db.collection<AppStateRecord>(APP_STATES_COLLECTION).deleteOne({ userId });
}
