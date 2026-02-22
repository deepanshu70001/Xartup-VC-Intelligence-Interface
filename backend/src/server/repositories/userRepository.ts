import { getMongoDb } from "../db/mongo";
import type { PublicUser, UserRecord } from "../types/user";

const USERS_COLLECTION = "users";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company ?? null,
    location: user.location ?? null,
  };
}

export async function createUser(user: Omit<UserRecord, "createdAt">) {
  const db = await getMongoDb();
  const record: UserRecord = {
    ...user,
    email: normalizeEmail(user.email),
    createdAt: new Date().toISOString(),
  };

  await db.collection<UserRecord>(USERS_COLLECTION).insertOne(record);
  return toPublicUser(record);
}

export async function findUserByEmail(email: string) {
  const db = await getMongoDb();
  return db
    .collection<UserRecord>(USERS_COLLECTION)
    .findOne({ email: normalizeEmail(email) });
}

export async function findPublicUserById(id: string) {
  const db = await getMongoDb();
  const user = await db
    .collection<UserRecord>(USERS_COLLECTION)
    .findOne(
      { id },
      { projection: { _id: 0, id: 1, name: 1, email: 1, company: 1, location: 1 } }
    );

  if (!user) return null;
  return toPublicUser(user);
}

export async function updateUserProfile({
  id,
  name,
  email,
  company,
  location,
}: {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  location?: string | null;
}) {
  const db = await getMongoDb();
  const normalizedEmail = normalizeEmail(email);

  await db.collection<UserRecord>(USERS_COLLECTION).updateOne(
    { id },
    {
      $set: {
        name,
        email: normalizedEmail,
        company: company ?? null,
        location: location ?? null,
      },
    }
  );

  return findPublicUserById(id);
}
