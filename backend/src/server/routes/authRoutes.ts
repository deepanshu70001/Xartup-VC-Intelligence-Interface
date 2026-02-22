import type { Express } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db from "../../../db.ts";
import type { AuthenticatedRequest } from "../middleware/auth";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
}

export function registerAuthRoutes({
  app,
  jwtSecret,
  cookieSecure,
  cookieSameSite,
  authenticateToken,
}: {
  app: Express;
  jwtSecret: string;
  cookieSecure: boolean;
  cookieSameSite: "lax" | "strict" | "none";
  authenticateToken: (req: any, res: any, next: any) => void;
}) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();

      try {
        const statement = db.prepare(
          "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)"
        );
        statement.run(id, name, email, hashedPassword);
      } catch (error: any) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
          return res.status(400).json({ error: "Email already exists" });
        }
        throw error;
      }

      const token = jwt.sign({ id, email, name }, jwtSecret, { expiresIn: "24h" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ user: { id, name, email }, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const statement = db.prepare("SELECT * FROM users WHERE email = ?");
      const user = statement.get(email) as UserRecord | undefined;

      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: "24h" }
      );
      res.cookie("token", token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
    });
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    const statement = db.prepare(
      "SELECT id, name, email, company, location FROM users WHERE id = ?"
    );
    const user = statement.get((req as AuthenticatedRequest).user.id);
    res.json({ user });
  });

  app.put("/api/auth/profile", authenticateToken, (req, res) => {
    try {
      const { name, email, company, location } = req.body;
      const userId = (req as AuthenticatedRequest).user.id;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const updateStatement = db.prepare(
        "UPDATE users SET name = ?, email = ?, company = ?, location = ? WHERE id = ?"
      );
      updateStatement.run(name, email, company || null, location || null, userId);

      const userStatement = db.prepare(
        "SELECT id, name, email, company, location FROM users WHERE id = ?"
      );
      const user = userStatement.get(userId);
      res.json({ user });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
}
