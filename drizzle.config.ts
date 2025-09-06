import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load environment variables from .env (drizzle-kit runs in Node context)
dotenv.config();

// Use Neon as primary by default, but prefer env if provided
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_pq2xNLg1BCJS@ep-soft-tooth-a1ppjto0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
