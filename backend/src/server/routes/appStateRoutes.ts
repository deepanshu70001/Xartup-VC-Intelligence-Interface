import type { Express } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { getUserAppState, upsertUserAppState } from "../repositories/appStateRepository";
import type { PersistedAppState } from "../types/appState";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function sanitizeState(input: unknown): PersistedAppState | null {
  if (!isObject(input)) return null;

  const thesisRaw = isObject(input.thesis) ? input.thesis : {};
  const userFavoritesRaw = isObject(input.userFavorites) ? input.userFavorites : {};
  const userNotesRaw = isObject(input.userNotes) ? input.userNotes : {};

  const userFavorites: Record<string, string[]> = {};
  for (const [userId, favorites] of Object.entries(userFavoritesRaw)) {
    userFavorites[userId] = toStringArray(favorites);
  }

  const userNotes: Record<string, Record<string, string>> = {};
  for (const [userId, notes] of Object.entries(userNotesRaw)) {
    if (!isObject(notes)) {
      userNotes[userId] = {};
      continue;
    }
    const cleaned: Record<string, string> = {};
    for (const [companyId, note] of Object.entries(notes)) {
      if (typeof note === "string") cleaned[companyId] = note;
    }
    userNotes[userId] = cleaned;
  }

  return {
    companies: Array.isArray(input.companies) ? input.companies : [],
    allLists: Array.isArray(input.allLists) ? input.allLists : [],
    allSavedSearches: Array.isArray(input.allSavedSearches) ? input.allSavedSearches : [],
    allActivities: Array.isArray(input.allActivities) ? input.allActivities : [],
    userFavorites,
    userNotes,
    thesis: {
      sectors: toStringArray(thesisRaw.sectors),
      stages: toStringArray(thesisRaw.stages),
      geography: toStringArray(thesisRaw.geography),
      keywords: toStringArray(thesisRaw.keywords),
      antiPortfolio: toStringArray(thesisRaw.antiPortfolio),
    },
  };
}

export function registerAppStateRoutes({
  app,
  authenticateToken,
}: {
  app: Express;
  authenticateToken: (req: any, res: any, next: any) => void;
}) {
  app.get("/api/app-state", authenticateToken, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const result = await getUserAppState(userId);
      res.json({
        state: result?.state || null,
        updatedAt: result?.updatedAt || null,
      });
    } catch (error) {
      console.error("Get app state error:", error);
      res.status(500).json({ error: "Failed to fetch app state" });
    }
  });

  app.put("/api/app-state", authenticateToken, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const sanitized = sanitizeState(req.body?.state);
      if (!sanitized) {
        return res.status(400).json({ error: "Invalid state payload" });
      }

      const result = await upsertUserAppState(userId, sanitized);
      res.json({ success: true, updatedAt: result?.updatedAt || null });
    } catch (error) {
      console.error("Save app state error:", error);
      res.status(500).json({ error: "Failed to save app state" });
    }
  });
}
