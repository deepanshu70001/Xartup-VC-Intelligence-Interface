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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1); // Trust first proxy (required for secure cookies behind nginx)
  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
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
        secure: true, // Required for SameSite=None
        sameSite: 'none', // Required for iframe context
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ user: { id, name, email } });
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
        secure: true, // Required for SameSite=None
        sameSite: 'none', // Required for iframe context
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('token');
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

      console.log(`Enriching URL: ${url}`);

      // 1. Fetch the website content
      // Add a User-Agent to avoid immediate blocking
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      
      // 2. Parse with Cheerio to clean up the HTML (reduce token count)
      const $ = cheerio.load(html);
      
      // Remove scripts, styles, and other non-content elements
      $('script, style, svg, noscript, iframe, link, meta').remove();
      
      // Extract text content
      const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000); // Limit to ~15k chars for Groq context window

      // 3. Call Groq for enrichment
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set");
      }

      const groq = new Groq({ apiKey });

      const prompt = `
        Analyze the following website content for a company. 
        Extract and infer the following information in JSON format.
        
        Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
        
        Required JSON Structure:
        {
          "summary": "A 1-2 sentence summary of the company",
          "what_they_do": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
          "keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
          "derived_signals": ["Signal 1", "Signal 2"]
        }

        Website Content:
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

      res.json({
        ...enrichmentData,
        source: url,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Enrichment error:", error);
      res.status(500).json({ error: error.message || "Failed to enrich data" });
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
