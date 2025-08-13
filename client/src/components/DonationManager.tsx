import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Heart, RefreshCcw, ShieldCheck, Timer } from 'lucide-react';

interface Donation {
  id: number;
  amount: number;
  currency: string;
  status: 'pending'|'approved'|'rejected';
  donorName: string | null;
  isAnonymous: boolean;
  message: string | null;
  reference: string;
  createdAt: string;
  approvedAt?: string | null;
}

const DonationManager: React.FC = () => {
  const [pending, setPending] = useState<Donation[]>([]);
  const [approved, setApproved] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  const adminToken = useMemo(() => localStorage.getItem('adminToken') || '', []);

  const fetchDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const headers: HeadersInit = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
      const [pRes, aRes] = await Promise.all([
        fetch('/api/donations?status=pending', { headers }),
        fetch('/api/donations?status=approved&limit=20', { headers }),
      ]);
      if (!pRes.ok || !aRes.ok) {
        const perr = await pRes.json().catch(() => ({} as any));
        const aerr = await aRes.json().catch(() => ({} as any));
        throw new Error((perr as any)?.error || (aerr as any)?.error || 'ไม่สามารถดึงข้อมูลการบริจาคได้');
      }
      const [p, a] = await Promise.all([pRes.json(), aRes.json()]);
      setPending(p || []);
      setApproved(a || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // Subscribe to donation SSE to live update
    const es = new EventSource('/api/donations/stream');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === 'donation_approved') {
          // Refresh both lists
          fetchDonations();
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  const approveDonation = async (id: number) => {
    if (!adminToken) {
      setError('ไม่พบสิทธิ์ผู้ดูแลระบบ กรุณาเข้าสู่ระบบใหม่');
      return;
    }
    try {
      const res = await fetch(`/api/donations/approve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error || 'Approve failed');
      }
      // Optimistic update: remove from pending
      setPending((prev) => prev.filter((d) => d.id !== id));
      // Refresh approved list
      fetchDonations();
      setNotice('อนุมัติการบริจาคสำเร็จ');
      setTimeout(() => setNotice(''), 2000);
    } catch (e) {
      setError('อนุมัติไม่สำเร็จ');
    }
  };

  const matchFilters = (d: Donation) => {
    // text filter
    if (filter) {
      const f = filter.toLowerCase();
      const hit = (d.donorName || '').toLowerCase().includes(f) || (d.message || '').toLowerCase().includes(f) || d.reference.toLowerCase().includes(f);
      if (!hit) return false;
    }
    // date range (use createdAt for pending, approvedAt fallback)
    const ts = new Date(d.approvedAt || d.createdAt).getTime();
    if (dateFrom) {
      const fromTs = new Date(dateFrom).setHours(0,0,0,0);
      if (ts < fromTs) return false;
    }
    if (dateTo) {
      const toTs = new Date(dateTo).setHours(23,59,59,999);
      if (ts > toTs) return false;
    }
    // amount range
    const min = minAmount ? parseFloat(minAmount) : undefined;
    const max = maxAmount ? parseFloat(maxAmount) : undefined;
    if (!Number.isNaN(min as number) && typeof min === 'number' && d.amount < min) return false;
    if (!Number.isNaN(max as number) && typeof max === 'number' && d.amount > max) return false;
    return true;
  };

  const filteredPending = useMemo(() => pending.filter(matchFilters), [pending, filter, dateFrom, dateTo, minAmount, maxAmount]);
  const filteredApproved = useMemo(() => approved.filter(matchFilters), [approved, filter, dateFrom, dateTo, minAmount, maxAmount]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-kanit text-orange-800 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" /> การบริจาค
        </h3>
        <div className="flex items-center gap-2">
          <Input
            placeholder="ค้นหา (ชื่อ/ข้อความ/reference)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-56"
          />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          <Input type="number" inputMode="decimal" placeholder="ต่ำสุด" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-24" />
          <Input type="number" inputMode="decimal" placeholder="สูงสุด" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-24" />
          <Button variant="outline" onClick={fetchDonations} disabled={loading} className="border-orange-200 hover:bg-orange-50">
            <RefreshCcw className="h-4 w-4 mr-2" /> รีเฟรช
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 font-sarabun">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 border border-green-200 font-sarabun">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle className="font-kanit flex items-center gap-2 text-orange-700">
              <Timer className="h-5 w-5 text-orange-500" /> รออนุมัติ ({filteredPending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredPending.length === 0 && (
              <div className="text-sm text-muted-foreground font-sarabun">ไม่มีรายการรออนุมัติ</div>
            )}
            {filteredPending.map((d) => (
              <div key={d.id} className="p-3 border rounded-lg flex items-center gap-3 hover:bg-orange-50/40 transition-colors">
                <div>
                  <div className="font-sarabun">
                    {d.isAnonymous || !d.donorName ? 'ผู้ไม่ประสงค์ออกนาม' : d.donorName}
                  </div>
                  <div className="text-xs text-muted-foreground font-sarabun">
                    {new Date(d.createdAt).toLocaleString()} • ref: {d.reference}
                  </div>
                  {d.message && (
                    <div className="text-xs text-muted-foreground font-sarabun mt-1">“{d.message}”</div>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className="font-sarabun">{d.amount} บาท</Badge>
                  <Button size="sm" onClick={() => approveDonation(d.id)} className="font-sarabun bg-orange-600 hover:bg-orange-700">
                    <ShieldCheck className="h-4 w-4 mr-2" /> อนุมัติ
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="font-kanit flex items-center gap-2 text-green-700">
              <ShieldCheck className="h-5 w-5 text-green-600" /> อนุมัติล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredApproved.length === 0 && (
              <div className="text-sm text-muted-foreground font-sarabun">ยังไม่มีรายการ</div>
            )}
            {filteredApproved.map((d) => (
              <div key={d.id} className="p-3 border rounded-lg flex items-center gap-3 hover:bg-green-50/40 transition-colors">
                <div>
                  <div className="font-sarabun">
                    {d.isAnonymous || !d.donorName ? 'ผู้ไม่ประสงค์ออกนาม' : d.donorName}
                  </div>
                  <div className="text-xs text-muted-foreground font-sarabun">
                    {d.approvedAt ? new Date(d.approvedAt).toLocaleString() : new Date(d.createdAt).toLocaleString()} • ref: {d.reference}
                  </div>
                  {d.message && (
                    <div className="text-xs text-muted-foreground font-sarabun mt-1">“{d.message}”</div>
                  )}
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="font-sarabun">{d.amount} บาท</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonationManager;
