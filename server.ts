import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_ONLY =
  process.env.API_ONLY === "true" || process.env.API_ONLY === "1";
const PORT = Number(process.env.PORT) || 3000;
const HOST =
  process.env.HOST ?? (API_ONLY ? "127.0.0.1" : "0.0.0.0");

function buildCors(): cors.CorsOptions {
  const raw = process.env.CORS_ORIGINS;
  const origins = raw
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origins?.length) {
    return { origin: origins, credentials: true };
  }
  return { origin: true, credentials: true };
}

async function startServer() {
  const app = express();

  app.use(cors(buildCors()));
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!API_ONLY) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV === "production" && API_ONLY) {
    app.use((req, res) => {
      res.status(404).json({ error: "not_found", path: req.path });
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(
      `Server listening on http://${HOST}:${PORT} (API_ONLY=${API_ONLY})`,
    );
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Set a different PORT in .env or stop the other process.`,
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

startServer();
