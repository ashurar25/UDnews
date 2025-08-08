import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";

interface NewsCardProps {
  title: string;
  summary: string;
  category: string;
  time: string;
  views: string;
  image?: string;
  isBreaking?: boolean;
  size?: "small" | "medium" | "large";
}

const NewsCard = ({ 
  title, 
  summary, 
  category, 
  time, 
  views, 
  image, 
  isBreaking = false,
  size = "medium" 
}: NewsCardProps) => {
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

  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-news hover:-translate-y-1 animate-fade-in ${cardClass}`}>
      {image && (
        <div className="relative overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              size === "large" ? "h-64" : "h-48"
            }`}
          />
          {isBreaking && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-news-urgent text-white animate-bounce-in">
                ข่าวด่วน
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <Badge className={getCategoryColor(category)}>
              {category}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <h3 className={`font-kanit font-semibold leading-tight group-hover:text-primary transition-colors ${
          size === "large" ? "text-xl" : "text-lg"
        }`}>
          {title}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className={`text-muted-foreground font-sarabun leading-relaxed mb-4 ${
          size === "large" ? "text-base" : "text-sm"
        }`}>
          {summary}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground font-sarabun">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            <span>{views}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;