import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export function createAuthMiddleware(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err || !user || typeof user === "string") {
        return res.status(403).json({ error: "Forbidden" });
      }

      (req as AuthenticatedRequest).user = user as AuthUser;
      next();
    });
  };
}
