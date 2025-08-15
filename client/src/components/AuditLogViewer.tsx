import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
  items: AuditLogItem[];
}

function useAuditLogs(params: Record<string, any>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  return useQuery<AuditLogResponse>({
    queryKey: ['audit-logs', params],
    queryFn: () => api.get(`/api/audit-logs?${qs.toString()}`),
    keepPreviousData: true,
  });
}

export default function AuditLogViewer() {
  const [method, setMethod] = React.useState<string>('');
  const [pathQ, setPathQ] = React.useState<string>('');
  const [userId, setUserId] = React.useState<string>('');
  const [statusCode, setStatusCode] = React.useState<string>('');
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(50);

  const { data, isLoading, isError, refetch } = useAuditLogs({ method, path: pathQ, userId, statusCode, from, to, page, pageSize });

  const resetFilters = () => {
    setMethod('');
    setPathQ('');
    setUserId('');
    setStatusCode('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg border border-orange-100">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 font-kanit text-orange-700">
          บันทึกกิจกรรม (Audit Logs)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <Select value={method} onValueChange={(v) => { setPage(1); setMethod(v); }}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Input placeholder="Path contains..." value={pathQ} onChange={(e) => { setPage(1); setPathQ(e.target.value); }} />
          </div>
          <div>
            <Input type="number" placeholder="User ID" value={userId} onChange={(e) => { setPage(1); setUserId(e.target.value); }} />
          </div>
          <div>
            <Input type="number" placeholder="Status" value={statusCode} onChange={(e) => { setPage(1); setStatusCode(e.target.value); }} />
          </div>
          <div className="flex gap-2">
            <Input type="datetime-local" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
            <Input type="datetime-local" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>รีเฟรช</Button>
            <Button variant="ghost" onClick={resetFilters}>ล้างตัวกรอง</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">แสดง</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(parseInt(v)); }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">รายการต่อหน้า</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left p-2">เวลา</th>
                <th className="text-left p-2">ผู้ใช้</th>
                <th className="text-left p-2">เมธอด</th>
                <th className="text-left p-2">พาธ</th>
                <th className="text-left p-2">สถานะ</th>
                <th className="text-left p-2">IP</th>
                <th className="text-left p-2">ดีเลย์</th>
                <th className="text-left p-2">User-Agent</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td className="p-4" colSpan={8}>กำลังโหลด...</td></tr>
              )}
              {isError && !isLoading && (
                <tr><td className="p-4 text-red-600" colSpan={8}>ไม่สามารถโหลดข้อมูลได้</td></tr>
              )}
              {!isLoading && !isError && data?.items?.length === 0 && (
                <tr><td className="p-4" colSpan={8}>ไม่มีข้อมูล</td></tr>
              )}
              {!isLoading && !isError && data?.items?.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="p-2">{row.userId ?? '-'}{row.bodySummary ? <div className="text-xs text-gray-500 truncate max-w-xs">{typeof row.bodySummary === 'string' ? row.bodySummary : JSON.stringify(row.bodySummary)}</div> : null}</td>
                  <td className="p-2"><Badge variant={row.method === 'DELETE' ? 'destructive' : 'secondary'}>{row.method}</Badge></td>
                  <td className="p-2"><div className="max-w-md truncate" title={row.path}>{row.path}</div></td>
                  <td className="p-2">{row.statusCode ?? '-'}</td>
                  <td className="p-2">{row.ipAddress ?? '-'}</td>
                  <td className="p-2">{row.latencyMs ? `${row.latencyMs} ms` : '-'}</td>
                  <td className="p-2"><div className="max-w-md truncate" title={row.userAgent || undefined}>{row.userAgent ?? '-'}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-600">หน้า {page}</div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>ก่อนหน้า</Button>
            <Button variant="default" disabled={isLoading || (data && data.items.length < pageSize)} onClick={() => setPage((p) => p + 1)}>ถัดไป</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
