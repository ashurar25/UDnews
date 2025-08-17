import { db } from '../db';
import { auditLogs } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import type { UserRole } from '@shared/schema';

export interface AuditLogEntry {
  userId: number;
  action: string;
  entityType: string;
  entityId?: string | number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
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
      await db.insert(auditLogs).values({
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId?.toString(),
        details: entry.details || {},
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async getLogs({
    startDate,
    endDate,
    action,
    entityType,
    userId,
    role,
    page = 1,
    pageSize = 20
  }: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    entityType?: string;
    userId?: number;
    role?: UserRole;
    page?: number;
    pageSize?: number;
  }) {
    const offset = (page - 1) * pageSize;
    
    const whereConditions = [];
    
    if (startDate) whereConditions.push(gte(auditLogs.timestamp, startDate));
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(endDate.getDate() + 1);
      whereConditions.push(lt(auditLogs.timestamp, nextDay));
    }
    if (action) whereConditions.push(eq(auditLogs.action, action));
    if (entityType) whereConditions.push(eq(auditLogs.entityType, entityType));
    if (userId) whereConditions.push(eq(auditLogs.userId, userId));
    
    // Add role filter if needed (requires joining with users table)
    if (role) {
      // This assumes you have a users table with a role column
      whereConditions.push(sql`${auditLogs.user}->>'role' = ${role}`);
    }

    const [logs, total] = await Promise.all([
      db.query.auditLogs.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        orderBy: (logs, { desc }) => [desc(logs.timestamp)],
        limit: pageSize,
        offset,
        with: {
          user: {
            columns: {
              username: true,
              role: true,
              email: true
            }
          }
        }
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .then(res => Number(res[0].count) || 0)
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async exportLogs(format: 'json' | 'csv' = 'json') {
    const logs = await db.query.auditLogs.findMany({
      orderBy: (logs, { desc }) => [desc(logs.timestamp)],
      with: {
        user: {
          columns: {
            username: true,
            email: true,
            role: true
          }
        }
      },
      limit: 10000 // Limit to prevent memory issues
    });

    if (format === 'csv') {
      const { Parser } = await import('json2csv');
      const fields = [
        'timestamp',
        'action',
        'entityType',
        'entityId',
        'user.username',
        'user.role',
        'ipAddress',
        'userAgent',
        'details'
      ];
      
      const json2csvParser = new Parser({ fields });
      return json2csvParser.parse(logs);
    }

    return logs;
  }
}

export const auditLogService = AuditLogService.getInstance();
