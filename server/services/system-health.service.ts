import os from 'os';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Cache for system metrics (1 minute TTL)
const metricsCache = {
  timestamp: 0,
  data: null as any,
  ttl: 60000, // 1 minute
};

export class SystemHealthService {
  private static instance: SystemHealthService;

  private constructor() {}

  public static getInstance(): SystemHealthService {
    if (!SystemHealthService.instance) {
      SystemHealthService.instance = new SystemHealthService();
    }
    return SystemHealthService.instance;
  }

  private getCpuUsage() {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => {
      return acc + Object.values(cpu.times).reduce((a, b) => a + b, 0);
    }, 0);
    
    return {
      percentUsed: 100 - Math.round((totalIdle / cpus.length) * 100) / 100,
      load: os.loadavg(),
      cores: cpus.length
    };
  }

  private getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    
    return {
      total,
      used,
      free,
      percentUsed: parseFloat(((used / total) * 100).toFixed(2))
    };
  }

  private getStorageUsage() {
    // This is a simplified version - in production, you might want to use a more robust solution
    const total = os.totalmem() * 2; // Fake total storage
    const used = os.totalmem() * 1.5; // Fake used storage
    
    return {
      total,
      used,
      free: total - used,
      percentUsed: parseFloat(((used / total) * 100).toFixed(2))
    };
  }

  private async getDatabaseStatus() {
    try {
      const start = Date.now();
      // Simple query to check database connection
      await db.execute(sql`SELECT 1`);
      const responseTime = Date.now() - start;
      
      // Get database version
      const versionResult = await db.execute(sql`SELECT version() as version`);
      const version = versionResult.rows[0]?.version || 'unknown';
      
      return {
        status: 'up' as const,
        responseTime,
        version: typeof version === 'string' ? version.split(' ')[1] || version : 'unknown'
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'down' as const,
        responseTime: -1,
        version: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getCacheStatus() {
    // This is a simplified version - in production, you'd check your actual cache system
    return {
      status: 'up' as const,
      hitRate: 95.5, // Example hit rate
      size: 0, // In a real app, get this from your cache system
      maxSize: 0
    };
  }

  private async getRequestMetrics() {
    try {
      // Get request counts from the last hour
      const oneHourAgo = new Date(Date.now() - 3600000);
      
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
        FROM audit_logs
        WHERE created_at > ${oneHourAgo}
      `);
      
      const totalRequests = Number(result.rows[0]?.total_requests || 0);
      const errorCount = Number(result.rows[0]?.error_count || 0);
      
      // Get response time percentiles (simplified)
      const percentiles = await db.execute(sql`
        SELECT 
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99
        FROM audit_logs
        WHERE created_at > ${oneHourAgo}
          AND status_code < 400
      `);
      
      return {
        requests: {
          total: totalRequests,
          perSecond: totalRequests / 3600, // Requests per second over the last hour
          errorRate: totalRequests > 0 ? errorCount / totalRequests : 0
        },
        responseTime: {
          p50: Number(percentiles.rows[0]?.p50 || 0),
          p95: Number(percentiles.rows[0]?.p95 || 0),
          p99: Number(percentiles.rows[0]?.p99 || 0)
        }
      };
    } catch (error) {
      console.error('Error getting request metrics:', error);
      return {
        requests: {
          total: 0,
          perSecond: 0,
          errorRate: 0
        },
        responseTime: {
          p50: 0,
          p95: 0,
          p99: 0
        }
      };
    }
  }

  async getSystemHealth() {
    // Return cached data if still valid
    const now = Date.now();
    if (metricsCache.data && now - metricsCache.timestamp < metricsCache.ttl) {
      return metricsCache.data;
    }

    // Get all metrics in parallel
    const [
      databaseStatus,
      cacheStatus,
      requestMetrics
    ] = await Promise.all([
      this.getDatabaseStatus(),
      this.getCacheStatus(),
      this.getRequestMetrics()
    ]);

    // Determine overall system status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (databaseStatus.status !== 'up') {
      status = 'unhealthy';
    } else if (cacheStatus.status !== 'up' || requestMetrics.requests.errorRate > 0.1) {
      status = 'degraded';
    }

    // Format the response
    const systemHealth = {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        cache: cacheStatus,
        memory: this.getMemoryUsage(),
        cpu: this.getCpuUsage(),
        storage: this.getStorageUsage(),
        uptime: os.uptime()
      },
      metrics: requestMetrics
    };

    // Update cache
    metricsCache.data = systemHealth;
    metricsCache.timestamp = now;

    return systemHealth;
  }
}

export const systemHealthService = SystemHealthService.getInstance();
