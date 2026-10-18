// The old standalone server, kept so the current Render deployment keeps working until the
// teacher confirms Cloudflare. All routes live in routes.ts and are shared with Next.js
// (app/api/[...path]/route.ts), which is what offline mode and Cloudflare use.
import "dotenv/config";
import cors from "cors";
import express from "express";
import { database } from "./database.ts";
import { apiConfig, handleApi } from "./routes.ts";

const PORT = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map((value) => value.trim());
apiConfig.crossSiteCookies = isProduction; // pages on Vercel, API on Render

const app = express();
app.use(cors({ origin: isProduction ? allowedOrigins : true, credentials: true }));
app.use(express.raw({ type: () => true, limit: "3mb" }));
app.use(async (req, res) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  const hasBody = Buffer.isBuffer(req.body) && req.body.length > 0;
  const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : req.protocol;
  const response = await handleApi(new Request(`${protocol}://${req.headers.host}${req.originalUrl}`, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
  }));
  res.status(response.status);
  response.headers.forEach((value, name) => { if (name !== "set-cookie") res.setHeader(name, value); });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader("Set-Cookie", cookies);
  res.send(Buffer.from(await response.arrayBuffer()));
});

async function startServer() {
  try {
    await database.connect();
    console.log(`${database.mode} database connected`);
  } catch (error) {
    console.error("Database connection failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`CodeShare backend listening on http://0.0.0.0:${PORT}`));
}

void startServer();
