import { db } from '../db';
import { auditLogs } from '@shared/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export interface AuditLogEntry {
  method: string;
  path: string;
  userId?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  bodySummary?: string | null;
  statusCode?: number | null;
  latencyMs?: number | null;
  createdAt?: Date; // optional override (defaults to DB now())
}

export class AuditLogService {
  private static instance: AuditLogService;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const values: any = {
        method: entry.method,
        path: entry.path,
        userId: entry.userId ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        bodySummary: entry.bodySummary ?? null,
        statusCode: entry.statusCode ?? null,
        latencyMs: entry.latencyMs ?? null,
      };
      if (entry.createdAt) values.createdAt = entry.createdAt;
      await db.insert(auditLogs).values(values as any);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async getLogs({
    from,
    to,
    method,
    path,
    userId,
    statusCode,
    page = 1,
    pageSize = 50,
  }: {
    from?: Date;
    to?: Date;
    method?: string;
    path?: string;
    userId?: number;
    statusCode?: number;
    page?: number;
    pageSize?: number;
  }) {
    const offset = (page - 1) * pageSize;

    const whereClauses: any[] = [];
    if (from) whereClauses.push(gte(auditLogs.createdAt as any, from));
    if (to) whereClauses.push(lte(auditLogs.createdAt as any, to));
    if (method) whereClauses.push(eq(auditLogs.method as any, method));
    if (typeof userId === 'number') whereClauses.push(eq(auditLogs.userId as any, userId));
    if (typeof statusCode === 'number') whereClauses.push(eq(auditLogs.statusCode as any, statusCode));
    if (path) whereClauses.push(sql`path ILIKE '%' || ${String(path)} || '%'`);

    const whereExpr = whereClauses.length ? and(...whereClauses) : undefined;

    const items = await db
      .select()
      .from(auditLogs)
      .where(whereExpr as any)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize as any)
      .offset(offset as any);

    const [{ cnt }] = await db
      .select({ cnt: sql<number>`cast(count(*) as int)` })
      .from(auditLogs)
      .where(whereExpr as any);
    const total = Number(cnt || 0);

    return {
      data: items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async exportLogs(format: 'json' | 'csv' = 'json') {
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10000 as any); // Limit to prevent memory issues

    if (format === 'csv') {
      const { Parser } = await import('json2csv');
      const fields = [
        'createdAt',
        'method',
        'path',
        'userId',
        'statusCode',
        'latencyMs',
        'ipAddress',
        'userAgent',
        'bodySummary',
      ];
      
      const json2csvParser = new Parser({ fields });
      return json2csvParser.parse(logs);
    }

    return logs;
  }
}

export const auditLogService = AuditLogService.getInstance();

