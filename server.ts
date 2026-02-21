import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db from "./db.ts";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface LiveNewsItem {
  id: string;
  company: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface ScoutContextCompany {
  id?: string;
  name: string;
  industry?: string;
  stage?: string;
  location?: string;
  employee_count?: string;
  total_funding?: string;
  tags?: string[];
  description?: string;
  enrichment?: {
    summary?: string;
    keywords?: string[];
    derived_signals?: string[];
  } | null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === "production";
  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowVercelOrigins = process.env.CORS_ALLOW_VERCEL === "true";
  const cookieSecure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.COOKIE_SECURE !== "false" && isProd);
  const cookieSameSite = (process.env.COOKIE_SAMESITE ||
    (cookieSecure ? "none" : "lax")) as "lax" | "strict" | "none";

  app.set('trust proxy', 1); // Trust first proxy (required for secure cookies behind nginx)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowAnyOrigin = allowedOrigins.length === 0 && !isProd;
    const isVercelOrigin =
      typeof origin === "string" && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
    const isAllowedOrigin =
      typeof origin === "string" &&
      (allowAnyOrigin || allowedOrigins.includes(origin) || (allowVercelOrigins && isVercelOrigin));

    if (isAllowedOrigin && origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });
  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
    const token = req.cookies.token || bearerToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();

      try {
        const stmt = db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)');
        stmt.run(id, name, email, hashedPassword);
      } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ error: "Email already exists" });
        }
        throw err;
      }

      const token = jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '24h' });
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ user: { id, name, email }, token });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as any;

      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
    });
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    // Refresh user data from DB to get latest fields
    const stmt = db.prepare('SELECT id, name, email, company, location FROM users WHERE id = ?');
    const user = stmt.get(req.user.id);
    res.json({ user });
  });

  app.put("/api/auth/profile", authenticateToken, (req: any, res) => {
    try {
      const { name, email, company, location } = req.body;
      const userId = req.user.id;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const stmt = db.prepare('UPDATE users SET name = ?, email = ?, company = ?, location = ? WHERE id = ?');
      stmt.run(name, email, company || null, location || null, userId);

      // Return updated user
      const updatedUserStmt = db.prepare('SELECT id, name, email, company, location FROM users WHERE id = ?');
      const updatedUser = updatedUserStmt.get(userId);

      res.json({ user: updatedUser });
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/enrich", authenticateToken, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const normalizedUrl = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
      const rootUrl = new URL(normalizedUrl);
      const host = rootUrl.hostname;

      console.log(`Enriching URL: ${normalizedUrl}`);

      const getHeaders = () => ({
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      });

      const fetchPageText = async (candidateUrl: string) => {
        const response = await fetch(candidateUrl, { headers: getHeaders() });
        if (!response.ok) return null;
        const html = await response.text();
        const $ = cheerio.load(html);
        $("script, style, svg, noscript, iframe, link, meta").remove();
        const title = $("title").text().trim();
        const text = $("body").text().replace(/\s+/g, " ").trim().substring(0, 12000);
        if (!text) return null;
        return { text: `${title ? `${title}\n` : ""}${text}`, html };
      };

      const home = await fetchPageText(rootUrl.toString());
      if (!home) {
        throw new Error("Failed to fetch company homepage");
      }

      // Crawl only a small set of same-host likely signal pages.
      const $home = cheerio.load(home.html);
      const sourceUrls = new Set<string>([rootUrl.toString()]);
      const likelyPathRe = /(career|jobs|hiring|blog|news|changelog|release|product|pricing|about|team)/i;

      $home("a[href]").each((_, el) => {
        const href = $home(el).attr("href");
        if (!href) return;
        try {
          const abs = new URL(href, rootUrl.toString());
          if (abs.hostname !== host) return;
          if (!likelyPathRe.test(abs.pathname)) return;
          sourceUrls.add(abs.toString());
        } catch {
          // ignore invalid links
        }
      });

      const urlsToFetch = Array.from(sourceUrls).slice(0, 6);
      const fetchedPages = await Promise.all(
        urlsToFetch.map(async (u) => {
          try {
            const result = await fetchPageText(u);
            if (!result) return null;
            return { url: u, text: result.text };
          } catch {
            return null;
          }
        })
      );

      const validPages = fetchedPages.filter((p): p is { url: string; text: string } => !!p);
      const textContent = validPages
        .map((p) => `SOURCE: ${p.url}\n${p.text}`)
        .join("\n\n---\n\n")
        .substring(0, 30000);

      // 3. Call Groq for enrichment
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set");
      }

      const groq = new Groq({ apiKey });

      const prompt = `
Analyze the following multi-page website content for a company and return ONLY valid JSON.

JSON schema:
{
  "summary": "1-2 sentences",
  "what_they_do": ["3-6 bullets"],
  "keywords": ["5-10 concise keywords"],
  "derived_signals": ["2-4 inferred signals from the scraped pages"]
}

Rules:
- Keep statements grounded in provided content.
- "derived_signals" should infer evidence like careers presence, recent updates, docs/changelog, hiring, etc.
- No markdown, no extra text.

CONTENT:
${textContent}
`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const jsonContent = completion.choices[0]?.message?.content;
      
      if (!jsonContent) {
        throw new Error("No content returned from Groq");
      }

      const enrichmentData = JSON.parse(jsonContent);

      const scrapedSources = validPages.map((p) => p.url);

      res.json({
        ...enrichmentData,
        source: normalizedUrl,
        sources: scrapedSources,
        timestamp: new Date().toISOString()
      });

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

      const companyContext = companies
        .map((c, idx) => {
          const enrichmentSummary = c.enrichment?.summary || "";
          const keywords = (c.enrichment?.keywords || []).slice(0, 8).join(", ");
          const signals = (c.enrichment?.derived_signals || []).slice(0, 4).join(" | ");
          return [
            `${idx + 1}. ${c.name}`,
            `Industry: ${c.industry || "Unknown"} | Stage: ${c.stage || "Unknown"} | Location: ${c.location || "Unknown"}`,
            `Employees: ${c.employee_count || "Unknown"} | Funding: ${c.total_funding || "Unknown"}`,
            `Tags: ${(c.tags || []).slice(0, 8).join(", ") || "None"}`,
            `Description: ${c.description || "N/A"}`,
            `Enrichment Summary: ${enrichmentSummary || "N/A"}`,
            `Enrichment Keywords: ${keywords || "N/A"}`,
            `Derived Signals: ${signals || "N/A"}`,
          ].join("\n");
        })
        .join("\n\n");

      const systemPrompt = [
        "You are Scout, a thesis-aware VC copilot.",
        "You help with sourcing, prioritization, and diligence.",
        "Use only the provided thesis and company context.",
        "If data is missing, call it out briefly and provide best-effort recommendations.",
        "Respond with concise, structured guidance suitable for an investment team.",
        "Formatting rules:",
        "- Use short paragraphs and bullet points.",
        "- For rankings, use numbered lines (1., 2., 3.) with one company per line.",
        "- Use plain text markdown only for bold company names (e.g., **Company**).",
        "- Avoid one giant paragraph.",
        "",
        `THESIS CONTEXT (JSON): ${JSON.stringify(thesis).slice(0, 3000)}`,
        "",
        `COMPANY CONTEXT:\n${companyContext || "No company context provided."}`,
      ].join("\n");

      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message.slice(0, 2000) },
        ],
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (!reply) {
        return res.status(500).json({ error: "No response returned from model" });
      }

      res.json({
        reply,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Scout chat error:", error);
      res.status(500).json({ error: error.message || "Failed to process scout chat request" });
    }
  });

  app.get("/api/live-feed", authenticateToken, async (req, res) => {
    try {
      const companiesRaw = String(req.query.companies || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      const perCompanyLimit = Math.max(1, Math.min(3, Number(req.query.perCompany || 2)));
      const totalLimit = Math.max(1, Math.min(20, Number(req.query.limit || 10)));

      if (companiesRaw.length === 0) {
        return res.json({ items: [] as LiveNewsItem[] });
      }

      const parseGoogleNewsRss = (xml: string, company: string): LiveNewsItem[] => {
        const $ = cheerio.load(xml, { xmlMode: true });
        const items: LiveNewsItem[] = [];
        $("item").each((_, el) => {
          if (items.length >= perCompanyLimit) return;
          const title = $(el).find("title").text().trim();
          const url = $(el).find("link").text().trim();
          const source = $(el).find("source").text().trim() || "Google News";
          const publishedAt = $(el).find("pubDate").text().trim();

          if (!title || !url) return;
          items.push({
            id: `${company}-${Buffer.from(url).toString("base64").slice(0, 16)}`,
            company,
            title,
            source,
            url,
            publishedAt: new Date(publishedAt || Date.now()).toISOString(),
          });
        });
        return items;
      };

      const requests = companiesRaw.map(async (company) => {
        const q = encodeURIComponent(`"${company}" startup OR funding OR product OR hiring`);
        const rssUrl = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
        try {
          const response = await fetch(rssUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          if (!response.ok) return [] as LiveNewsItem[];
          const xml = await response.text();
          return parseGoogleNewsRss(xml, company);
        } catch {
          return [] as LiveNewsItem[];
        }
      });

      const results = (await Promise.all(requests)).flat();
      const deduped = Array.from(
        new Map(results.map((item) => [item.url, item])).values()
      )
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, totalLimit);

      res.json({ items: deduped });
    } catch (error: any) {
      console.error("Live feed error:", error);
      res.status(500).json({ error: "Failed to fetch live intelligence feed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
