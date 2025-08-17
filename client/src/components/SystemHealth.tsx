import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle2, Server, Cpu, Database, Clock, HardDrive, Network } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type SystemStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      version: string;
    };
    cache: {
      status: 'up' | 'down';
      hitRate: number;
      size: number;
      maxSize: number;
    };
    storage: {
      total: number;
      used: number;
      free: number;
      percentUsed: number;
    };
    memory: {
      total: number;
      used: number;
      free: number;
      percentUsed: number;
    };
    cpu: {
      percentUsed: number;
      load: number[];
      cores: number;
    };
    uptime: number;
  };
  metrics: {
    requests: {
      total: number;
      perSecond: number;
      errorRate: number;
    };
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
  };
};

export default function SystemHealth() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { data, isLoading, isError, refetch } = useQuery<SystemStatus>({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await api.get('/api/admin/system/health');
      setLastUpdated(new Date());
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'degraded':
      case 'unhealthy':
      case 'down':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Health</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Failed to load system health data
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Unable to connect to the monitoring service. Please try again later.</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { status, services, metrics } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(status)}`} />
            <span className="text-sm capitalize">
              {status === 'healthy' ? 'All Systems Operational' : 
               status === 'degraded' ? 'Partial Outage' : 'System Unhealthy'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {services.database.version}
              </div>
              <div className="flex items-center">
                {getStatusIcon(services.database.status)}
                <span className={`ml-1 text-xs ${getStatusColor(services.database.status)}`}>
                  {services.database.status.toUpperCase()}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Response: {services.database.responseTime}ms
            </p>
          </CardContent>
        </Card>

        {/* Cache Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {services.cache.hitRate.toFixed(1)}%
              </div>
              <div className="flex items-center">
                {getStatusIcon(services.cache.status)}
                <span className={`ml-1 text-xs ${getStatusColor(services.cache.status)}`}>
                  {services.cache.status.toUpperCase()}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes(services.cache.size)} / {formatBytes(services.cache.maxSize)}
            </p>
          </CardContent>
        </Card>

        {/* CPU Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.cpu.percentUsed.toFixed(1)}%
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Load Average</span>
                <span>{services.cpu.load.map(l => l.toFixed(2)).join(', ')}</span>
              </div>
              <Progress value={services.cpu.percentUsed} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.memory.percentUsed.toFixed(1)}%
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Used / Total</span>
                <span>{formatBytes(services.memory.used)} / {formatBytes(services.memory.total)}</span>
              </div>
              <Progress value={services.memory.percentUsed} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.storage.percentUsed.toFixed(1)}%
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Used / Total</span>
                <span>{formatBytes(services.storage.used)} / {formatBytes(services.storage.total)}</span>
              </div>
              <Progress value={services.storage.percentUsed} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(services.uptime)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Since {new Date(new Date().getTime() - services.uptime * 1000).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Total Requests</h3>
              <div className="text-2xl font-bold">
                {metrics.requests.total.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                {metrics.requests.perSecond.toFixed(2)} req/s
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Error Rate</h3>
              <div className="text-2xl font-bold">
                {(metrics.requests.errorRate * 100).toFixed(2)}%
              </div>
              <p className="text-sm text-muted-foreground">
                of all requests
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Response Times (ms)</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>p50:</span>
                  <span>{metrics.responseTime.p50.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>p95:</span>
                  <span>{metrics.responseTime.p95.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>p99:</span>
                  <span>{metrics.responseTime.p99.toFixed(1)}ms</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
