import { defineConfig } from "drizzle-kit";

// ใช้ PostgreSQL จาก Neon
const DATABASE_URL = "postgresql://neondb_owner:npg_pq2xNLg1BCJS@ep-soft-tooth-a1ppjto0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
