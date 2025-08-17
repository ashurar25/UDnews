import { useState, useEffect } from 'react';
import { FiRefreshCw, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// List of available radar images (update with actual TMD radar URLs)
const RADAR_IMAGES = [
  'https://www.tmd.go.th/weather_map/radar/udonthani/UD_latest.png',
  'https://www.tmd.go.th/weather_map/radar/udonthani/UD_prev1.png',
  'https://www.tmd.go.th/weather_map/radar/udonthani/UD_prev2.png',
];

// Fallback radar images in case TMD is down
const FALLBACK_RADAR_IMAGES = [
  '/images/radar-fallback-1.png',
  '/images/radar-fallback-2.png',
  '/images/radar-fallback-3.png',
];

interface WeatherRadarProps {
  className?: string;
}

export default function WeatherRadar({ className = '' }: WeatherRadarProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Initialize with direct URLs first, fall back to proxy if they fail
  useEffect(() => {
    setImages(RADAR_IMAGES);
  }, []);

  const loadImage = (src: string, index: number) => {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  const checkImages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try direct URLs first
      const directAvailable = await Promise.all(RADAR_IMAGES.map(loadImage));
      
      if (directAvailable.some(available => available)) {
        setImages(RADAR_IMAGES);
        setUseProxy(false);
      } else {
        // Fall back to proxy
        const proxyImages = RADAR_IMAGES.map(url => 
          `/api/weather/radar?url=${encodeURIComponent(url)}`
        );
        const proxyAvailable = await Promise.all(proxyImages.map(loadImage));
        
        if (proxyAvailable.some(available => available)) {
          setImages(proxyImages);
          setUseProxy(true);
        } else {
          // Fall back to local images
          setImages(FALLBACK_RADAR_IMAGES);
          setUseProxy(false);
        }
      }
    } catch (err) {
      console.error('Error checking radar images:', err);
      setError('ไม่สามารถโหลดภาพเรดาร์ได้ในขณะนี้');
      setImages(FALLBACK_RADAR_IMAGES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkImages();
  }, []);

  const handleRefresh = () => {
    checkImages();
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-4 ${className}`}>
        <FiRefreshCw className="animate-spin mr-2" />
        <span>กำลังโหลดภาพเรดาร์...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 text-red-600 p-4 rounded-lg flex items-center ${className}`}>
        <FiAlertCircle className="mr-2" />
        <span>{error}</span>
        <button 
          onClick={handleRefresh}
          className="ml-auto text-sm bg-white px-2 py-1 rounded border border-red-200 hover:bg-red-50"
        >
          โหลดใหม่
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
        <h3 className="font-medium text-gray-800">เรดาห์พยากรณ์อากาศ</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {useProxy ? 'กำลังใช้เซิร์ฟเวอร์ตัวกลาง' : 'เชื่อมต่อโดยตรง'}
          </span>
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            title="รีเฟรช"
          >
            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          {images.length > 0 ? (
            <img
              src={images[currentImageIndex]}
              alt={`ภาพเรดาร์ ${currentImageIndex + 1}`}
              className="max-w-full max-h-[400px] object-contain"
              onError={(e) => {
                // If image fails to load, try the next one
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                goToNextImage();
              }}
            />
          ) : (
            <div className="text-gray-400 p-4 text-center">
              <FiAlertCircle className="mx-auto mb-2" size={24} />
              <p>ไม่พบภาพเรดาร์</p>
            </div>
          )}
        </div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
              aria-label="ภาพก่อนหน้า"
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
              aria-label="ภาพถัดไป"
            >
              <FiChevronRight size={20} />
            </button>
            
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-blue-600' : 'bg-white/50'
                  }`}
                  aria-label={`ไปที่ภาพที่ ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t">
        <p className="text-center">ที่มา: กรมอุตุนิยมวิทยา (TMD)</p>
        <p className="text-center text-[10px] mt-1">อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}</p>
      </div>
    </div>
  );
}
