import type { Express } from "express";
import type { ScoutContextCompany } from "../types";
import { enrichCompanyUrl } from "../services/enrichmentService";
import { generateScoutReply } from "../services/chatService";
import { fetchLiveFeed } from "../services/liveFeedService";

export function registerAiRoutes({
  app,
  authenticateToken,
}: {
  app: Express;
  authenticateToken: (req: any, res: any, next: any) => void;
}) {
  app.post("/api/enrich", authenticateToken, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set");
      }

      const enrichment = await enrichCompanyUrl(url, apiKey);
      res.json(enrichment);
    } catch (error: any) {
      console.error("Enrichment error:", error);
      res.status(500).json({ error: error.message || "Failed to enrich data" });
    }
  });

  app.post("/api/chat", authenticateToken, async (req, res) => {
    try {
      const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
      const thesis = req.body?.thesis || {};
      const rawCompanies = Array.isArray(req.body?.companies) ? req.body.companies : [];
      const companies = rawCompanies.slice(0, 10) as ScoutContextCompany[];

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GROQ_API_KEY is not set" });
      }

      const response = await generateScoutReply({
        apiKey,
        message,
        thesis,
        companies,
      });

      res.json(response);
    } catch (error: any) {
      console.error("Scout chat error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to process scout chat request" });
    }
  });

  app.get("/api/live-feed", authenticateToken, async (req, res) => {
    try {
      const companies = String(req.query.companies || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 10);
      const perCompanyLimit = Math.max(1, Math.min(3, Number(req.query.perCompany || 2)));
      const totalLimit = Math.max(1, Math.min(20, Number(req.query.limit || 10)));

      if (companies.length === 0) {
        return res.json({ items: [] });
      }

      const items = await fetchLiveFeed(companies, perCompanyLimit, totalLimit);
      res.json({ items });
    } catch (error) {
      console.error("Live feed error:", error);
      res.status(500).json({ error: "Failed to fetch live intelligence feed" });
    }
  });
}
