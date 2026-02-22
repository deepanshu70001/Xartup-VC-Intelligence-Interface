import type { Request, Response, NextFunction } from "express";
import type { ServerEnv } from "../config/env";

export function createCorsMiddleware(env: ServerEnv) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowAnyOrigin = env.allowedOrigins.length === 0 && !env.isProd;
    const isVercelOrigin =
      typeof origin === "string" &&
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
    const isAllowedOrigin =
      typeof origin === "string" &&
      (allowAnyOrigin ||
        env.allowedOrigins.includes(origin) ||
        (env.allowVercelOrigins && isVercelOrigin));

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
  };
}
