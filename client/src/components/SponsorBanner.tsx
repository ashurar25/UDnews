import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Eye, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import type { SponsorBanner } from "@shared/schema";

interface SponsorBannerProps {
  position: "header" | "sidebar" | "footer" | "between_news";
  className?: string;
}

const SponsorBannerComponent = ({ position, className = "" }: SponsorBannerProps) => {
  const { data: banners = [], isLoading, isError } = useQuery({
    queryKey: ["/api/sponsor-banners", position],
    queryFn: async () => {
      const response = await axios.get(`/api/sponsor-banners?position=${position}`);
      const data = response.data;
      return Array.isArray(data) ? data as SponsorBanner[] : [];
    },
  });

  const handleBannerClick = async (banner: SponsorBanner) => {
    try {
      await axios.post(`/api/sponsor-banners/${banner.id}/click`);
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to record click:', error);
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleContactSponsor = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Contact information or form for sponsor inquiries
    alert("ติดต่อสำหรับการสนับสนุนสปอนเซอร์\nโทร: 042-123-456\nอีเมล: sponsor@udnews.com");
  };

  if (isLoading || isError || !Array.isArray(banners) || banners.length === 0) {
    // Show sponsor contact button even when no banners are available
    return (
      <div className={`sponsor-contact-section ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleContactSponsor}
          className="font-sarabun text-xs bg-primary/10 hover:bg-primary/20 border-primary/30"
        >
          <Phone className="h-3 w-3 mr-2" />
          ติดต่อสนับสนุนสปอนเซอร์
        </Button>
      </div>
    );
  }

  const getPositionStyles = () => {
    switch (position) {
      case "header":
        return "flex-row gap-4 justify-center items-center";
      case "sidebar":
        return "flex-col gap-3";
      case "footer":
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
      case "between_news":
        return "flex-col gap-2";
      default:
        return "flex-col gap-3";
    }
  };

  const getBannerSize = () => {
    switch (position) {
      case "header":
        return "h-20 md:h-24";
      case "sidebar":
        return "h-32 md:h-40";
      case "footer":
        return "h-24 md:h-28";
      case "between_news":
        return "h-16 md:h-20";
      default:
        return "h-32";
    }
  };

  return (
    <div className={`sponsor-banners-container ${className}`}>
      {/* Sponsor Contact Button */}
      <div className="flex justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleContactSponsor}
          className="font-sarabun text-xs bg-primary/10 hover:bg-primary/20 border-primary/30 shadow-sm"
        >
          <Phone className="h-3 w-3 mr-2" />
          ติดต่อสนับสนุนสปอนเซอร์
        </Button>
      </div>
      
      {/* Sponsor Banners */}
      <div className={`sponsor-banners ${getPositionStyles()}`}>
        {banners.map((banner) => (
          <Card
            key={banner.id}
            className={`relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 ${getBannerSize()}`}
            onClick={() => handleBannerClick(banner)}
          >
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="secondary" className="text-xs font-sarabun bg-black/20 text-white backdrop-blur-sm">
                สปอนเซอร์
              </Badge>
            </div>
            
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-white/80 text-xs">
              <Eye className="h-3 w-3" />
              <span className="font-sarabun">{banner.clickCount}</span>
            </div>

            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTAwTDE2MCA4MEwyMDAgNjBMMjQwIDgwTDIwMCAxMDBaIiBmaWxsPSIjOUI5QkE0Ii8+PC9zdmc+';
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute bottom-2 left-2 right-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center justify-between text-white">
                <span className="text-xs font-kanit font-semibold truncate">
                  {banner.title}
                </span>
                <ExternalLink className="h-3 w-3 ml-2 flex-shrink-0" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SponsorBannerComponent;