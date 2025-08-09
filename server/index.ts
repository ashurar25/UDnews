// Apply Replit environment configuration
if (process.env.NODE_ENV === 'development') {
  // Set environment variables for Replit compatibility
  process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';
  process.env.WDS_SOCKET_HOST = '0.0.0.0';
  process.env.WDS_SOCKET_PORT = '443';
  process.env.CHOKIDAR_USEPOLLING = 'true';
  
  console.log('✓ Replit development environment configured');
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { rssService } from "./rss-service";

const app = express();

// CORS configuration for Replit domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  // Allow all Replit domains and localhost
  if (origin && (origin.includes('.replit.dev') || origin.includes('.replit.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  const host = "0.0.0.0"; // Explicitly bind to all interfaces for Replit
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start automatic RSS processing after server is ready
    setTimeout(() => {
      rssService.startAutoProcessing();
      log('RSS automatic processing started');
    }, 5000); // Wait 5 seconds for server to be fully ready
  });
})();
