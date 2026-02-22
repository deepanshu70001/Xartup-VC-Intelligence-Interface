import type { Express } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { MongoServerError } from "mongodb";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  createUser,
  findPublicUserById,
  findUserByEmail,
  updateUserProfile,
} from "../repositories/userRepository";

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
        await createUser({
          id,
          name,
          email,
          password: hashedPassword,
          company: null,
          location: null,
        });
      } catch (error: any) {
        if (error instanceof MongoServerError && error.code === 11000) {
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
      const user = await findUserByEmail(email);

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

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const user = await findPublicUserById(userId);
    res.json({ user });
  });

  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const { name, email, company, location } = req.body;
      const userId = (req as AuthenticatedRequest).user.id;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const user = await updateUserProfile({
        id: userId,
        name,
        email,
        company: company || null,
        location: location || null,
      });
      res.json({ user });
    } catch (error: any) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return res.status(400).json({ error: "Email already exists" });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
}
