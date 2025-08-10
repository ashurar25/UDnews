import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";

// ใช้ PostgreSQL จาก Render เท่านั้น
const DATABASE_URL = "postgresql://udnews_user:qRNlOyrnlVbrRH16AQJ5itOkjluEebXk@dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com/udnewsdb_8d2c";

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
