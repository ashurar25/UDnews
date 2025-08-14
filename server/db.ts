import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";

// Primary database (Render) และ backup database (Neon)
const PRIMARY_DATABASE_URL = "postgresql://udnews_user:qRNlOyrnlVbrRH16AQJ5itOkjluEebXk@dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com/udnewsdb_8d2c";
const BACKUP_DATABASE_URL = "postgresql://neondb_owner:npg_pq2xNLg1BCJS@ep-soft-tooth-a1ppjto0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// ใช้ environment variable หรือ primary database เป็นค่าเริ่มต้น
export const DATABASE_URL = process.env.DATABASE_URL || PRIMARY_DATABASE_URL;

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// สร้าง backup connection pool
export const backupPool = new Pool({ 
  connectionString: BACKUP_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
export const backupDb = drizzle(backupPool, { schema });
