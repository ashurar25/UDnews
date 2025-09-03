import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables, prefer .env.local over .env at project root
try {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const localEnv = path.join(rootDir, '.env.local');
  const defaultEnv = path.join(rootDir, '.env');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else if (fs.existsSync(defaultEnv)) {
    dotenv.config({ path: defaultEnv });
  }
} catch {}

// Primary database (Render) และ backup database (Neon)
const PRIMARY_DATABASE_URL = "postgresql://udnews_user:qRNlOyrnlVbrRH16AQJ5itOkjluEebXk@dpg-d2a2dp2dbo4c73at42ug-a.singapore-postgres.render.com/udnewsdb_8d2c";
const BACKUP_DATABASE_URL = "postgresql://neondb_owner:npg_pq2xNLg1BCJS@ep-soft-tooth-a1ppjto0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// ใช้ environment variable หรือ primary database เป็นค่าเริ่มต้น
export const DATABASE_URL = process.env.DATABASE_URL || PRIMARY_DATABASE_URL;

// Configure main database pool with optimized settings
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close and remove a connection after it has been used 7500 times
});

// Configure backup database pool with optimized settings
export const backupPool = new Pool({ 
  connectionString: BACKUP_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Fewer connections for backup
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 5000,
});

export const db = drizzle(pool, { schema });
export const backupDb = drizzle(backupPool, { schema });
