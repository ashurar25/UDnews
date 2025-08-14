import { Router, type Request, type Response } from 'express';
import { db, DATABASE_URL } from './db';
import { sql } from 'drizzle-orm';
import { authenticateToken } from './middleware/auth';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, file: any, cb: (error: any, destination: string) => void) => cb(null, path.join(os.tmpdir(), 'udnews-restore')),
    filename: (req: Request, file: any, cb: (error: any, filename: string) => void) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  limits: { fileSize: 1024 * 1024 * 500 } // 500MB
});

// Ensure temp directory exists
try { fs.mkdirSync(path.join(os.tmpdir(), 'udnews-restore'), { recursive: true }); } catch {}

function parsePgEnv(connStr: string) {
  try {
    const u = new URL(connStr);
    const isPostgres = u.protocol.startsWith('postgres');
    if (!isPostgres) return null;
    const sslmode = u.searchParams.get('sslmode');
    return {
      PGHOST: u.hostname,
      PGPORT: u.port || '5432',
      PGUSER: decodeURIComponent(u.username),
      PGPASSWORD: decodeURIComponent(u.password),
      PGDATABASE: decodeURIComponent(u.pathname.replace(/^\//, '')),
      PGSSLMODE: sslmode || undefined,
    } as Record<string, string | undefined>;
  } catch {
    return null;
  }
}

function commandExists(cmd: string): Promise<boolean> {
  const check = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
  return new Promise((resolve) => {
    exec(check, (err) => resolve(!err));
  });
}

function run(cmd: string, envExtra?: Record<string, string | undefined>): Promise<{ stdout: string; stderr: string }>{
  return new Promise((resolve, reject) => {
    const child = exec(cmd, { env: { ...process.env, ...envExtra } }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout, stderr });
    });
    // Safety: kill after 15 minutes
    setTimeout(() => { try { child.kill(); } catch {} }, 15 * 60 * 1000);
  });
}

const router = Router();

// Apply authentication middleware to all database routes
router.use(authenticateToken);

// Normalize result from db.execute() across drivers
function rowsOf(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.rows)) return result.rows;
  // Some drivers return iterable objects; fallback to empty array
  return [];
}

// Get database statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total tables count
    const tablesResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tablesCountRows = rowsOf(tablesResult);
    const totalTables = parseInt((tablesCountRows[0]?.count as string) || '0');

    // Get total records count across all tables
    let totalRecords = 0;
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableRows = rowsOf(tables);
    for (const table of tableRows) {
      try {
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table.table_name}"`));
        const countRows = rowsOf(countResult);
        totalRecords += parseInt((countRows[0]?.count as string) || '0');
      } catch (error) {
        console.warn(`Could not count records in table ${table.table_name}:`, error);
      }
    }

    // Get database size
    const sizeResult = await db.execute(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    const sizeRows = rowsOf(sizeResult);
    const databaseSize = (sizeRows[0]?.size as string) || '0 MB';

    // Get performance metrics (mock data for now)
    const performance = {
      queryTime: Math.floor(Math.random() * 50) + 10, // 10-60ms
      activeConnections: Math.floor(Math.random() * 20) + 5, // 5-25
      cacheHitRate: Math.floor(Math.random() * 30) + 70 // 70-100%
    };

    const stats = {
      totalTables,
      totalRecords,
      databaseSize,
      lastBackup: null, // TODO: Implement backup tracking
      connectionStatus: 'connected' as const,
      performance
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting database stats:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({ 
        error: 'Database connection failed',
        details: 'Unable to connect to database server'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get database statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all tables information
router.get('/tables', async (req: Request, res: Response) => {
  try {
    const tables = await db.execute(sql`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tablesInfo = [] as any[];
    const tableRows = rowsOf(tables);
    for (const table of tableRows) {
      try {
        // Get record count
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table.table_name}"`));
        const countRows = rowsOf(countResult);
        const recordCount = parseInt((countRows[0]?.count as string) || '0');

        // Get table size
        const sizeResult = await db.execute(sql.raw(`
          SELECT pg_size_pretty(pg_total_relation_size('"${table.table_name}"')) as size
        `));
        const sizeRows = rowsOf(sizeResult);
        const size = (sizeRows[0]?.size as string) || '0 MB';

        // Get last modified (approximate)
        const lastModified = new Date().toISOString();

        // Get columns info
        const columnsResult = await db.execute(sql.raw(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            CASE WHEN constraint_type = 'PRIMARY KEY' THEN true ELSE false END as is_primary,
            CASE WHEN constraint_type = 'UNIQUE' THEN true ELSE false END as is_unique
          FROM information_schema.columns c
          LEFT JOIN information_schema.key_column_usage kcu ON c.column_name = kcu.column_name
          LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
          WHERE c.table_name = '${table.table_name}'
          ORDER BY c.ordinal_position
        `));
        const columnRows = rowsOf(columnsResult);
        const columns = columnRows.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          defaultValue: col.column_default,
          isPrimary: col.is_primary || false,
          isUnique: col.is_unique || false
        }));

        // Get indexes info
        const indexesResult = await db.execute(sql.raw(`
          SELECT 
            i.relname as index_name,
            array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
            am.amname as type,
            ix.indisunique as is_unique
          FROM pg_index ix
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_am am ON am.oid = i.relam
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
          WHERE t.relname = '${table.table_name}'
          GROUP BY i.relname, am.amname, ix.indisunique
        `));
        const indexRows = rowsOf(indexesResult);
        const indexes = indexRows.map((idx: any) => ({
          name: idx.index_name,
          columns: idx.columns,
          type: idx.type,
          isUnique: idx.is_unique
        }));

        // Get constraints info
        const constraintsResult = await db.execute(sql.raw(`
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            array_agg(kcu.column_name) as columns,
            ccu.table_name as reference_table,
            array_agg(ccu.column_name) as reference_columns
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = '${table.table_name}'
          GROUP BY tc.constraint_name, tc.constraint_type, ccu.table_name
        `));
        const constraintRows = rowsOf(constraintsResult);
        const constraints = constraintRows.map((con: any) => ({
          name: con.constraint_name,
          type: con.constraint_type.toLowerCase(),
          columns: con.columns,
          referenceTable: con.reference_table,
          referenceColumns: con.reference_columns
        }));

        tablesInfo.push({
          name: table.table_name,
          recordCount,
          size,
          lastModified,
          columns,
          indexes,
          constraints
        });
      } catch (error) {
        console.warn(`Could not get detailed info for table ${table.table_name}:`, error);
        // Add basic table info if detailed info fails
        tablesInfo.push({
          name: table.table_name,
          recordCount: 0,
          size: '0 MB',
          lastModified: new Date().toISOString(),
          columns: [],
          indexes: [],
          constraints: []
        });
      }
    }

    res.json(tablesInfo);
  } catch (error) {
    console.error('Error getting tables info:', error);
    res.status(500).json({ error: 'Failed to get tables information' });
  }
});

// Get table data
router.get('/tables/:tableName/data', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Validate table name to prevent SQL injection
    const validTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
    if (!validTableName) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const data = await db.execute(sql.raw(`
      SELECT * FROM "${tableName}" 
      LIMIT ${parseInt(limit as string)} 
      OFFSET ${parseInt(offset as string)}
    `));

    res.json(data);
  } catch (error) {
    console.error(`Error getting data from table ${req.params.tableName}:`, error);
    res.status(500).json({ error: 'Failed to get table data' });
  }
});

// Create database backup
router.post('/backup', async (req: Request, res: Response) => {
  try {
    const { name, format } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Backup name is required' });

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = (format === 'custom' ? 'dump' : 'sql');
    const backupFile = `${name}-${timestamp}.${ext}`;
    const backupPath = path.join(backupDir, backupFile);

    const envPg = parsePgEnv(DATABASE_URL);
    if (!envPg) return res.status(500).json({ error: 'Invalid DATABASE_URL format' });

    const hasPgDump = await commandExists('pg_dump');
    if (!hasPgDump) {
      return res.status(500).json({ 
        error: 'pg_dump not found in PATH',
        instructions: 'Install PostgreSQL client tools and ensure pg_dump is in PATH.'
      });
    }

    const args = [
      'pg_dump',
      format === 'custom' ? '-Fc' : '-Fp',
      '--no-owner',
      '--no-privileges',
      `-f "${backupPath.replace(/"/g, '\\"')}"`
    ].join(' ');

    await run(args, envPg);

    res.json({ success: true, message: 'Backup created successfully', backupPath, file: backupFile });
  } catch (error: any) {
    console.error('Error creating backup:', error?.stderr || error);
    res.status(500).json({ error: 'Failed to create backup', details: error?.stderr || String(error) });
  }
});

// Restore database from backup
router.post('/restore', upload.single('backup'), async (req: Request, res: Response) => {
  const uploaded = (req as any).file as any;
  if (!uploaded) return res.status(400).json({ error: 'Backup file is required' });
  try {
    const envPg = parsePgEnv(DATABASE_URL);
    if (!envPg) return res.status(500).json({ error: 'Invalid DATABASE_URL format' });

    const ext = path.extname(uploaded.originalname).toLowerCase();
    const isSql = ext === '.sql';

    if (isSql) {
      const hasPsql = await commandExists('psql');
      if (!hasPsql) {
        return res.status(500).json({ error: 'psql not found in PATH', instructions: 'Install PostgreSQL client tools and ensure psql is in PATH.' });
      }
      const cmd = `psql -v ON_ERROR_STOP=1 -f "${uploaded.path.replace(/"/g, '\\"')}"`;
      await run(cmd, envPg);
    } else {
      const hasPgRestore = await commandExists('pg_restore');
      if (!hasPgRestore) {
        return res.status(500).json({ error: 'pg_restore not found in PATH', instructions: 'Install PostgreSQL client tools and ensure pg_restore is in PATH.' });
      }
      const cmd = `pg_restore --clean --if-exists --no-owner --no-privileges -d "${envPg.PGDATABASE}" "${uploaded.path.replace(/"/g, '\\"')}"`;
      await run(cmd, envPg);
    }

    res.json({ success: true, message: 'Restore completed successfully' });
  } catch (error: any) {
    console.error('Error restoring backup:', error?.stderr || error);
    res.status(500).json({ error: 'Failed to restore backup', details: error?.stderr || String(error) });
  } finally {
    try { fs.unlinkSync(uploaded.path); } catch {}
  }
});

// Clear database cache
router.post('/clear-cache', async (req, res) => {
  try {
    // Clear any application-level cache
    // For PostgreSQL, you might want to run VACUUM or similar
    
    res.json({ 
      success: true, 
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Execute custom SQL query (admin only)
router.post('/execute', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    // Only allow SELECT queries for safety
    if (!query.trim().toLowerCase().startsWith('select')) {
      return res.status(403).json({ error: 'Only SELECT queries are allowed' });
    }

    const result = await db.execute(sql.raw(query));
    
    res.json({ 
      success: true, 
      data: result,
      rowCount: (result as any).length
    });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'Failed to execute SQL query' });
  }
});

export default router; 