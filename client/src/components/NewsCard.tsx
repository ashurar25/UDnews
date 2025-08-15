import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface NewsCardProps {
  id?: number;
  title: string;
  summary: string;
  category: string;
  time: string;
  views: string;
  image?: string;
  isBreaking?: boolean;
  size?: "small" | "medium" | "large";
  imageUrl?: string;
  placeholderSvg?: string;
  isUrgent?: boolean;
  categoryLabels?: { [key: string]: string };
  likes?: number;
  publishedAt?: string;
  variant?: "standard" | "overlay";
}

const NewsCard = ({
  id,
  title,
  summary,
  category,
  time,
  views,
  image,
  isBreaking = false,
  size = "medium",
  imageUrl,
  placeholderSvg,
  isUrgent,
  categoryLabels,
  likes,
  publishedAt,
  variant = "standard"
}: NewsCardProps) => {
  const [, setLocation] = useLocation();
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'ข่าวด่วน': return 'bg-news-urgent text-white';
      case 'การเมือง': return 'bg-news-politics text-white';
      case 'กีฬา': return 'bg-news-sport text-white';
      case 'ข่าวท้องถิ่น': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const cardClass = size === "large"
    ? "md:col-span-2 md:row-span-2"
    : size === "small"
    ? "md:col-span-1"
    : "md:col-span-1";

  const handleClick = () => {
    if (id) {
      // Navigate first, then scroll will be handled by NewsDetail page
      setLocation(`/news/${id}`);
    }
  };

  const isOverlay = variant === "overlay";

  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 hover:shadow-news hover:-translate-y-1 animate-fade-in ${cardClass} ${isOverlay ? 'p-0 overflow-hidden' : 'bg-card border-border'}`}
      style={{ transition: 'all 0.3s ease, box-shadow 0.3s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px -2px hsl(20 100% 55% / 0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
      onClick={handleClick}
    >
      {image && (
        <div className={`relative ${isOverlay ? '' : 'overflow-hidden'}`}>
          <img
            src={image}
            alt={title}
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${size === 'large' ? 'h-64' : 'h-48'}`}
            loading="lazy"
            decoding="async"
          />

          {isOverlay && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 flex gap-2">
                {isBreaking && (
                  <Badge className="bg-news-urgent text-white animate-bounce-in">ข่าวด่วน</Badge>
                )}
                <Badge className={getCategoryColor(category)}>{category}</Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className={`font-kanit font-semibold leading-tight text-white drop-shadow ${size === 'large' ? 'text-xl' : 'text-lg'} line-clamp-2`}>{title}</h3>
                <p className={`mt-2 text-white/90 font-sarabun ${size === 'large' ? 'text-sm' : 'text-xs'} line-clamp-2`}>{summary}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/80 font-sarabun">
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /><span>{time}</span></div>
                  {views && (
                    <div className="flex items-center gap-2"><Eye className="h-3 w-3" /><span>{views}</span></div>
                  )}
                </div>
              </div>
            </>
          )}

          {!isOverlay && (
            <>
              {isBreaking && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-news-urgent text-white animate-bounce-in">ข่าวด่วน</Badge>
                </div>
              )}
              <div className="absolute bottom-3 left-3">
                <Badge className={getCategoryColor(category)}>{category}</Badge>
              </div>
            </>
          )}
        </div>
      )}

      {!isOverlay && (
        <>
          <CardHeader className="pb-3">
            <h3 className={`font-kanit font-semibold leading-tight group-hover:text-primary transition-colors ${size === 'large' ? 'text-xl' : 'text-lg'} line-clamp-2`}>
              {title}
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-muted-foreground font-sarabun leading-relaxed mb-4 ${size === 'large' ? 'text-base' : 'text-sm'} line-clamp-3`}>
              {summary}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-sarabun">
              <div className="flex items-center gap-2"><Clock className="h-3 w-3" /><span>{time}</span></div>
              {views && (
                <div className="flex items-center gap-2"><Eye className="h-3 w-3" /><span>{views}</span></div>
              )}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default NewsCard;