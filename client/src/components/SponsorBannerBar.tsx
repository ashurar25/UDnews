import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Eye, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import type { SponsorBanner } from "@shared/schema";
import { useState, useEffect } from "react";

interface SponsorBannerBarProps {
  position?: "header" | "sidebar" | "footer" | "between_news";
  className?: string;
  autoPlay?: boolean;
  showNavigation?: boolean;
  bannerCount?: number;
}

const SponsorBannerBar = ({ 
  position = "header", 
  className = "",
  autoPlay = true,
  showNavigation = true,
  bannerCount = 3
}: SponsorBannerBarProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { data: allBanners = [], isLoading, isError } = useQuery({
    queryKey: ["/api/sponsor-banners", position],
    queryFn: async () => {
      const response = await axios.get(`/api/sponsor-banners?position=${position}`);
      const data = response.data;
      return Array.isArray(data) ? data as SponsorBanner[] : [];
    },
  });

  // Get only active banners and slice to show limited count
  const banners = allBanners.filter(banner => banner.isActive).slice(0, bannerCount);

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
    alert("ติดต่อสำหรับการสนับสนุนสปอนเซอร์\nโทร: 042-123-456\nอีเมล: sponsor@udnews.com");
  };

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(banners.length, 1));
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(banners.length, 1)) % Math.max(banners.length, 1));
  };

  // Auto play functionality
  useEffect(() => {
    if (autoPlay && banners.length > 1) {
      const interval = setInterval(nextBanner, 4000);
      return () => clearInterval(interval);
    }
  }, [autoPlay, banners.length]);

  const getBarStyles = () => {
    switch (position) {
      case "header":
        return "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg";
      case "sidebar":
        return "bg-gradient-to-b from-secondary/10 to-secondary/5 border border-secondary/20 rounded-lg";
      case "footer":
        return "bg-gradient-to-r from-muted/20 to-muted/10 border border-muted/30 rounded-lg";
      case "between_news":
        return "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-lg";
      default:
        return "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg";
    }
  };

  const getBannerSize = () => {
    switch (position) {
      case "header":
        return "h-24 md:h-28";
      case "sidebar":
        return "h-40 md:h-48";
      case "footer":
        return "h-20 md:h-24";
      case "between_news":
        return "h-16 md:h-20";
      default:
        return "h-24 md:h-28";
    }
  };

  if (isLoading || isError) {
    return (
      <div className={`sponsor-banner-bar-loading ${className}`}>
        <div className={`flex items-center justify-center p-4 ${getBarStyles()}`}>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary/30 rounded-full animate-pulse"></div>
            <span className="text-sm font-sarabun text-muted-foreground">กำลังโหลดแบนเนอร์สปอนเซอร์...</span>
          </div>
        </div>
      </div>
    );
  }

  const getBannerSizeText = () => {
    switch (position) {
      case "header":
        return "ขนาด: 800x100 px";
      case "sidebar":
        return "ขนาด: 300x250 px";
      case "footer":
        return "ขนาด: 728x90 px";
      case "between_news":
        return "ขนาด: 728x60 px";
      default:
        return "ขนาด: 300x200 px";
    }
  };

  if (banners.length === 0) {
    return (
      <div className={`sponsor-banner-bar-empty ${className}`}>
        <div className={`p-4 ${getBarStyles()}`}>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className="font-sarabun text-xs">
                สปอนเซอร์
              </Badge>
              <span className="text-sm font-sarabun text-muted-foreground">
                พื้นที่โฆษณาสำหรับสปอนเซอร์ ({getBannerSizeText()})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleContactSponsor}
              className="font-sarabun text-xs"
            >
              <Phone className="h-3 w-3 mr-2" />
              ติดต่อสนับสนุนสปอนเซอร์
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sponsor-banner-bar ${className}`}>
      <div className={`relative overflow-hidden p-4 ${getBarStyles()}`}>
        {/* Header without contact button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="font-sarabun text-xs bg-primary/20 text-primary">
              สปอนเซอร์
            </Badge>
            {banners.length > 1 && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span className="font-sarabun">{currentIndex + 1}</span>
                <span>/</span>
                <span className="font-sarabun">{banners.length}</span>
              </div>
            )}
          </div>
          {showNavigation && banners.length > 1 && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevBanner}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextBanner}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Banner display */}
        <div className="relative">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div key={banner.id} className="w-full flex-shrink-0">
                <Card
                  className={`relative overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 ${getBannerSize()} mx-1`}
                  onClick={() => handleBannerClick(banner)}
                >
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="secondary" className="text-xs font-sarabun bg-black/30 text-white backdrop-blur-sm">
                      สปอนเซอร์
                    </Badge>
                  </div>
                  
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-white/90 text-xs bg-black/20 backdrop-blur-sm rounded px-2 py-1">
                    <Eye className="h-3 w-3" />
                    <span className="font-sarabun">{banner.clickCount}</span>
                  </div>

                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTAwTDE2MCA4MEwyMDAgNjBMMjQwIDgwTDIwMCAxMDBaIiBmaWxsPSIjOUI5QkE0Ii8+PHRleHQgeD0iMjAwIiB5PSIxMzAiIGZpbGw9IiM5QjlCQTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCII+nBopaHnrrrguYfguKPguZzguKjguJrguK3guKrgu4zguYDguILguK3guLI8L3RleHQ+PC9zdmc+';
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute bottom-2 left-2 right-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-kanit font-semibold truncate mb-1">
                          {banner.title}
                        </div>
                        {banner.linkUrl && (
                          <div className="text-xs font-sarabun text-white/80 truncate">
                            {new URL(banner.linkUrl).hostname}
                          </div>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator */}
        {banners.length > 1 && (
          <div className="flex justify-center space-x-2 mt-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary w-4'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorBannerBar;