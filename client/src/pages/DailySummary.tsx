import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'wouter';

type NewsItem = {
  id: number;
  title: string;
  image_url?: string | null;
  created_at?: string | null;
  summary?: string | null;
};

function useLatestNews(limit = 10) {
  return useQuery<NewsItem[]>({
    queryKey: ['latest-news', limit],
    queryFn: () => api.get(`/api/news?limit=${limit}`),
  });
}

export default function DailySummary() {
  const { data, isLoading, isError, refetch } = useLatestNews(10);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="font-kanit text-orange-700">สรุป 10 ข่าวล่าสุด</CardTitle>
              <button className="text-sm underline" onClick={() => refetch()} disabled={isLoading}>รีเฟรช</button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading && <div>กำลังโหลด...</div>}
            {isError && !isLoading && <div className="text-red-600">ไม่สามารถโหลดข้อมูลได้</div>}
            {!isLoading && !isError && (
              <ul className="space-y-4">
                {data?.map((n) => (
                  <li key={n.id} className="p-4 rounded-lg border border-orange-200 hover:bg-orange-50/40 transition">
                    <Link href={`/news/${n.id}`}>
                      <a className="block">
                        <div className="text-base text-gray-500 mb-1">{n.created_at ? new Date(n.created_at).toLocaleString('th-TH') : ''}</div>
                        <div className="text-lg font-semibold text-orange-700">{n.title}</div>
                        {n.summary && <div className="text-sm text-gray-700 mt-1 line-clamp-2">{n.summary}</div>}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
