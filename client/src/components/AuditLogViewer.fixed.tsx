import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { CalendarIcon, Filter, Search, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRange {
  from?: Date;
  to?: Date;
}

interface AuditLogItem {
  id: number;
  method: string;
  path: string;
  userId: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  bodySummary: any | null;
  statusCode: number | null;
  latencyMs: number | null;
  createdAt: string;
}

interface AuditLogResponse {
  page: number;
  pageSize: number;
  total: number;
  items: AuditLogItem[];
}

interface UseAuditLogsParams {
  method?: string;
  path?: string;
  userId?: string;
  statusCode?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

function useAuditLogs(params: UseAuditLogsParams) {
  return useQuery<AuditLogResponse>({
    queryKey: ['auditLogs', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (params.method) queryParams.append('method', params.method);
      if (params.path) queryParams.append('path', params.path);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.statusCode) queryParams.append('statusCode', params.statusCode);
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      queryParams.append('page', params.page.toString());
      queryParams.append('pageSize', params.pageSize.toString());
      
      const response = await api.get(`/api/audit-logs?${queryParams.toString()}`);
      return response.data;
    }
  });
}

export default function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [method, setMethod] = useState('');
  const [pathQ, setPathQ] = useState('');
  const [userId, setUserId] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Handle date range selection
  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
    if (range?.from && range?.to) {
      setFrom(format(range.from, 'yyyy-MM-dd'));
      setTo(format(range.to, 'yyyy-MM-dd'));
    } else {
      setFrom('');
      setTo('');
    }
  };

  const query = useAuditLogs({
    method,
    path: pathQ,
    userId,
    statusCode,
    from,
    to,
    page,
    pageSize
  });

  const data = query.data as AuditLogResponse | undefined;
  const { isLoading, isError, refetch } = query as any;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFilterActive = method || pathQ || userId || statusCode || from || to;

  // Load filters from URL
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const m = sp.get('method') || '';
      const pth = sp.get('path') || '';
      const uid = sp.get('userId') || '';
      const sc = sp.get('statusCode') || '';
      const f = sp.get('from') || '';
      const t = sp.get('to') || '';
      const pg = parseInt(sp.get('page') || '1');
      const psz = parseInt(sp.get('pageSize') || '20');
      
      if (m) setMethod(m);
      if (pth) setPathQ(pth);
      if (uid) setUserId(uid);
      if (sc) setStatusCode(sc);
      if (f) setFrom(f);
      if (t) setTo(t);
      if (!isNaN(pg) && pg > 0) setPage(pg);
      if (!isNaN(psz) && psz > 0) setPageSize(psz);
    } catch {}
  }, []);

  // Persist filters to URL
  useEffect(() => {
    const sp = new URLSearchParams();
    if (method) sp.set('method', method);
    if (pathQ) sp.set('path', pathQ);
    if (userId) sp.set('userId', userId);
    if (statusCode) sp.set('statusCode', statusCode);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    
    const qs = sp.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState({}, '', url);
  }, [method, pathQ, userId, statusCode, from, to, page, pageSize]);

  const exportCsv = () => {
    const rows = (data?.items || []).map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      userId: r.userId ?? '',
      method: r.method,
      path: r.path,
      statusCode: r.statusCode ?? '',
      ipAddress: r.ipAddress ?? '',
      latencyMs: r.latencyMs ?? '',
      userAgent: r.userAgent ?? '',
      bodySummary: typeof r.bodySummary === 'string' ? r.bodySummary : JSON.stringify(r.bodySummary ?? ''),
    }));
    
    const header = Object.keys(rows[0] || { id: '', createdAt: '', userId: '', method: '', path: '', statusCode: '', ipAddress: '', latencyMs: '', userAgent: '', bodySummary: '' });
    const escape = (val: any) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    
    const csv = [header.join(',')]
      .concat(rows.map((row) => header.map((h) => escape((row as any)[h])).join(',')))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setMethod('');
    setPathQ('');
    setUserId('');
    setStatusCode('');
    setFrom('');
    setTo('');
    setDateRange(undefined);
    setPage(1);
  };

  const getStatusBadgeVariant = (statusCode: number | null) => {
    if (!statusCode) return 'secondary';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'destructive';
    return 'secondary';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>View and filter system audit logs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {isFilterActive && (
                <span className="flex h-2 w-2 rounded-full bg-primary"></span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="text-sm text-muted-foreground">
          Showing {data?.items?.length || 0} of {total.toLocaleString()} total records
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="method-filter">Method</Label>
              <Select 
                value={method} 
                onValueChange={(v) => { setPage(1); setMethod(v === 'ALL' ? '' : v); }}
              >
                <SelectTrigger id="method-filter">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="path-filter">Path Contains</Label>
              <Input 
                id="path-filter"
                placeholder="e.g. /api/users" 
                value={pathQ} 
                onChange={(e) => { setPage(1); setPathQ(e.target.value); }} 
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="user-id-filter">User ID</Label>
              <Input 
                id="user-id-filter"
                type="number" 
                placeholder="User ID" 
                value={userId} 
                onChange={(e) => { setPage(1); setUserId(e.target.value); }} 
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="status-filter">Status Code</Label>
              <Input 
                id="status-filter"
                type="number" 
                placeholder="Status Code" 
                value={statusCode} 
                onChange={(e) => { setPage(1); setStatusCode(e.target.value); }} 
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {" "}
                          {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-end gap-2 md:col-span-6 pt-2">
              <Button 
                variant="outline" 
                onClick={resetFilters}
                disabled={!isFilterActive}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <Button 
                variant="secondary" 
                onClick={exportCsv}
                disabled={!data?.items?.length}
              >
                Export to CSV
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Method
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Path
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    IP
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Latency
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-destructive">
                      Failed to load audit logs. Please try again.
                    </td>
                  </tr>
                ) : data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      No audit logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((row) => (
                    <tr key={row.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <div className="whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-medium">
                          {row.userId || 'System'}
                        </div>
                        {row.userAgent && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {row.userAgent}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge 
                          variant={
                            row.method === 'DELETE' 
                              ? 'destructive' 
                              : row.method === 'POST' 
                                ? 'default' 
                                : 'secondary'
                          }
                        >
                          {row.method}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-mono text-sm">
                          {row.path}
                        </div>
                        {row.bodySummary && (
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {typeof row.bodySummary === 'string' 
                              ? row.bodySummary 
                              : JSON.stringify(row.bodySummary)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {row.statusCode && (
                          <Badge variant={getStatusBadgeVariant(row.statusCode)}>
                            {row.statusCode}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-mono text-sm">
                          {row.ipAddress || '-'}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-mono text-sm">
                          {row.latencyMs ? `${row.latencyMs}ms` : '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-1">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages || isLoading || !data?.items?.length}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
