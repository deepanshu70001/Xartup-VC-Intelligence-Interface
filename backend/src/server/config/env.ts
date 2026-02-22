export interface ServerEnv {
  port: number;
  isProd: boolean;
  jwtSecret: string;
  allowedOrigins: string[];
  allowVercelOrigins: boolean;
  cookieSecure: boolean;
  cookieSameSite: "lax" | "strict" | "none";
}

export function getServerEnv(): ServerEnv {
  const isProd = process.env.NODE_ENV === "production";
  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowVercelOrigins = process.env.CORS_ALLOW_VERCEL === "true";
  const cookieSecure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.COOKIE_SECURE !== "false" && isProd);
  const cookieSameSite = (process.env.COOKIE_SAMESITE ||
    (cookieSecure ? "none" : "lax")) as "lax" | "strict" | "none";

  return {
    port: Number(process.env.PORT || 3000),
    isProd,
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    allowedOrigins,
    allowVercelOrigins,
    cookieSecure,
    cookieSameSite,
  };
}
