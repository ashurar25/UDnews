
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Newspaper, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AnalyticsDashboard = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch("/api/analytics/summary", {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ</p>
        <p className="text-muted-foreground text-sm">กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">ไม่สามารถโหลดข้อมูลสถิติได้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              การเข้าชมทั้งหมด
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.totalViews ? analytics.totalViews.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              ครั้ง
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              การเข้าชมวันนี้
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.todayViews ? analytics.todayViews.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              ครั้ง
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ข่าวทั้งหมด
            </CardTitle>
            <Newspaper className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.totalNews ? analytics.totalNews.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              บทความ
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เฉลี่ยต่อข่าว
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.totalNews && analytics.totalViews && analytics.totalNews > 0 ? (analytics.totalViews / analytics.totalNews).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              ครั้ง/บทความ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular News Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            ข่าวยอดนิยม (Top 5)
          </CardTitle>
          <CardDescription>
            ข่าวที่มีการเข้าชมสูงสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หัวข้อข่าว</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">การเข้าชม</TableHead>
                <TableHead className="text-right">วันที่เผยแพร่</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.popularNews && analytics.popularNews.length > 0 ? analytics.popularNews.map((article: any, index: number) => (
                <TableRow key={article.id || index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="truncate max-w-md" title={article.title || 'ไม่มีหัวข้อ'}>
                        {article.title || 'ไม่มีหัวข้อ'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {article.category || 'ทั่วไป'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {article.viewCount ? article.viewCount.toLocaleString() : '0'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('th-TH') : '-'}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    ยังไม่มีข้อมูลสถิติการเข้าชม
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {analytics.popularNews.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีข้อมูลสถิติการเข้าชม
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
