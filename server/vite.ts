
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer as createViteServer, createLogger, type UserConfig } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    host: '0.0.0.0',
    port: 8080,
    cors: true
  } as const;
  // Resolve the project's Vite config for development
  const baseConfig: UserConfig | Promise<UserConfig> =
    typeof viteConfig === 'function'
      ? viteConfig({ mode: 'development', command: 'serve' } as any)
      : (viteConfig as unknown as UserConfig);
  const resolvedConfig = await Promise.resolve(baseConfig);
  // Ensure root points to client directory during dev
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const root = resolvedConfig.root || path.resolve(__dirname, '..', 'client');

  const vite = await createViteServer({
    ...resolvedConfig,
    root,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production (bundled), this file lives in dist/, so public assets are in dist/public
  // Using ./public works in the bundled output.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "./public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
