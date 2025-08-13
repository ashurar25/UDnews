import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, RefreshCcw, ShieldCheck, Timer } from 'lucide-react';

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

  const adminToken = useMemo(() => localStorage.getItem('adminToken') || '', []);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
      const [pRes, aRes] = await Promise.all([
        fetch('/api/donations?status=pending', { headers }),
        fetch('/api/donations?status=approved&limit=20', { headers }),
      ]);
      const [p, a] = await Promise.all([pRes.json(), aRes.json()]);
      setPending(p || []);
      setApproved(a || []);
    } catch (e) {
      // noop
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
      alert('ไม่พบสิทธิ์ผู้ดูแลระบบ กรุณาเข้าสู่ระบบใหม่');
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
    } catch (e) {
      alert('อนุมัติไม่สำเร็จ');
    }
  };

  const filteredPending = useMemo(() => {
    if (!filter) return pending;
    const f = filter.toLowerCase();
    return pending.filter((d) =>
      (d.donorName || '').toLowerCase().includes(f) ||
      (d.message || '').toLowerCase().includes(f) ||
      d.reference.toLowerCase().includes(f)
    );
  }, [pending, filter]);

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
            className="w-64"
          />
          <Button variant="outline" onClick={fetchDonations} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" /> รีเฟรช
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-kanit flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-500" /> รออนุมัติ ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredPending.length === 0 && (
              <div className="text-sm text-muted-foreground font-sarabun">ไม่มีรายการรออนุมัติ</div>
            )}
            {filteredPending.map((d) => (
              <div key={d.id} className="p-3 border rounded-lg flex items-center gap-3">
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
                  <Button size="sm" onClick={() => approveDonation(d.id)} className="font-sarabun">
                    <ShieldCheck className="h-4 w-4 mr-2" /> อนุมัติ
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-kanit flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" /> อนุมัติล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approved.length === 0 && (
              <div className="text-sm text-muted-foreground font-sarabun">ยังไม่มีรายการ</div>
            )}
            {approved.map((d) => (
              <div key={d.id} className="p-3 border rounded-lg flex items-center gap-3">
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
