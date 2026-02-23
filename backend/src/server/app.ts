import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { getServerEnv } from "./config/env";
import { createCorsMiddleware } from "./middleware/cors";
import { createAuthMiddleware } from "./middleware/auth";
import { initializeMongo } from "./db/mongo";
import { registerHealthRoutes } from "./routes/healthRoutes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerAiRoutes } from "./routes/aiRoutes";
import { registerAppStateRoutes } from "./routes/appStateRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const env = getServerEnv();
  await initializeMongo();

  const app = express();
  const authenticateToken = createAuthMiddleware(env.jwtSecret);
  const frontendViteConfig = path.resolve(__dirname, "../../../frontend/vite.config.ts");

  app.set("trust proxy", 1);
  app.use(createCorsMiddleware(env));
  app.use(express.json());
  app.use(cookieParser());

  registerHealthRoutes(app);
  registerAuthRoutes({
    app,
    jwtSecret: env.jwtSecret,
    cookieSecure: env.cookieSecure,
    cookieSameSite: env.cookieSameSite,
    authenticateToken,
  });
  registerAppStateRoutes({ app, authenticateToken });
  registerAiRoutes({ app, authenticateToken });

  if (!env.isProd) {
    const vite = await createViteServer({
      configFile: frontendViteConfig,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "../../../dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  return { app, port: env.port };
}
