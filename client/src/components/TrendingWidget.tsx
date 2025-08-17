import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp } from "lucide-react";

interface TrendingItem {
  id: number;
  title: string;
  createdAt: string;
  imageUrl?: string;
  category?: string;
  views?: number;
}

interface Props {
  title?: string;
  limit?: number;
  className?: string;
}

export default function TrendingWidget({ title = "ยอดนิยมวันนี้", limit = 10, className }: Props) {
  const { data = [], isLoading } = useQuery<TrendingItem[]>({
    queryKey: ["/api/analytics/popular", limit],
    queryFn: async () => {
      const res = await api.get(`/api/analytics/popular?limit=${limit}`, { auth: false });
      return res || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = (data || []).slice(0, limit);

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "เมื่อสักครู่";
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  };

  return (
    <div className={cn("bg-card rounded-lg p-6 shadow-news", className)}>
      <h3 className="text-xl font-bold font-kanit mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        {title}
      </h3>
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted animate-pulse rounded" />
            ))}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground font-sarabun">ยังไม่มีข้อมูลยอดนิยม</p>
        )}
        {!isLoading && items.map((item, index) => (
          <a
            key={item.id}
            href={`/news/${item.id}`}
            className="flex gap-3 p-3 rounded hover:bg-accent transition-colors cursor-pointer"
          >
            <span className="text-primary font-bold font-kanit text-lg min-w-6 text-center">{index + 1}</span>
            <div className="min-w-0">
              <h4 className="font-semibold font-kanit text-sm leading-tight mb-1 line-clamp-2">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="font-sarabun truncate">{timeAgo(item.createdAt)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
