
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Share2, Facebook, Twitter, MessageCircle, Mail, Link, QrCode, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTrackEvent } from '@/lib/useTrackEvent';

interface SocialShareProps {
  newsId: string;
  title: string;
  description: string;
  imageUrl?: string;
  url?: string;
  compact?: boolean;
}

const SocialShare: React.FC<SocialShareProps> = ({
  newsId,
  title,
  description,
  imageUrl,
  url,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const { toast } = useToast();
  const { track } = useTrackEvent();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = url || `${origin}/news/${newsId}`;
  // Server-rendered OG share page ensures crawlers (e.g., Facebook) get the right tags and image
  const shareOgUrl = `${origin}/share/${newsId}`;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedOgUrl = encodeURIComponent(shareOgUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  
  // Add image URL as a query parameter to force Facebook to refetch the share URL
  const imageParam = imageUrl ? `&picture=${encodeURIComponent(imageUrl)}` : '';
  const shareOgUrlWithImage = imageUrl ? `${shareOgUrl}?image=${encodeURIComponent(imageUrl)}` : shareOgUrl;
  const encodedOgUrlWithImage = encodeURIComponent(shareOgUrlWithImage);

  // Track social shares
  const trackShareMutation = useMutation({
    mutationFn: async (platform: string) => {
      return apiRequest('/api/analytics/social-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsId,
          platform,
          url: currentUrl
        })
      });
    },
    onError: (error) => {
      console.error('Error tracking share:', error);
    }
  });

  const shareUrls = {
    // Important: use server-side share page for platforms that read OG tags
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedOgUrlWithImage}&quote=${encodedTitle}${imageParam}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedOgUrl}&text=${encodedTitle}&hashtags=UDNews,อุดรธานี,ข่าว`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedOgUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedOgUrl}`,
    telegram: `https://t.me/share/url?url=${encodedOgUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = async (platform: string) => {
    // fire standardized analytics event
    track('social.share', { platform, newsId, url: currentUrl });
    trackShareMutation.mutate(platform);

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(currentUrl);
        toast({
          title: "คัดลอกลิงก์แล้ว",
          description: "ลิงก์ข่าวได้รับการคัดลอกไปยังคลิปบอร์ดแล้ว",
        });
        track('social.copy_link', { newsId, url: currentUrl });
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast({
          title: "คัดลอกลิงก์แล้ว",
          description: "ลิงก์ข่าวได้รับการคัดลอกแล้ว",
        });
        track('social.copy_link', { newsId, url: currentUrl, fallback: true });
      }
      return;
    }

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: currentUrl,
        });
        toast({
          title: "แชร์สำเร็จ",
          description: "ข่าวได้รับการแชร์แล้ว",
        });
        track('social.share_native', { newsId, url: currentUrl });
      } catch (err) {
        const e = err as { name?: string };
        if (e.name !== 'AbortError') {
          toast({
            title: "ไม่สามารถแชร์ได้",
            description: "กรุณาลองใช้วิธีอื่น",
            variant: "destructive",
          });
        }
      }
      return;
    }

    const url = shareUrls[platform as keyof typeof shareUrls];
    if (url) {
      const width = 600;
      const height = 400;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const win = window.open(
        url,
        'share',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      // Popup blocker fallback
      if (!win || win.closed || typeof win.closed === 'undefined') {
        toast({
          title: 'เปิดหน้าต่างแชร์ไม่สำเร็จ',
          description: 'เบราว์เซอร์อาจบล็อกป๊อปอัพ กรุณาอนุญาตป๊อปอัพสำหรับเว็บไซต์นี้แล้วลองอีกครั้ง',
          variant: 'destructive',
        });
      }
    }
  };

  const generateQRCode = () => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
    return qrCodeUrl;
  };

  const downloadQRCode = () => {
    const qrCodeUrl = generateQRCode();
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${newsId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    trackShareMutation.mutate('qr-download');
    track('social.qr_download', { newsId, url: currentUrl });
    toast({
      title: "ดาวน์โหลด QR Code แล้ว",
      description: "QR Code ได้รับการบันทึกแล้ว",
    });
  };

  const socialPlatforms = [
    {
      name: 'Facebook',
      platform: 'facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'แชร์ไปยัง Facebook'
    },
    {
      name: 'Twitter',
      platform: 'twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      description: 'แชร์ไปยัง Twitter (X)'
    },
    {
      name: 'LINE',
      platform: 'line',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'แชร์ไปยัง LINE'
    },
    {
      name: 'WhatsApp',
      platform: 'whatsapp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'แชร์ไปยัง WhatsApp'
    },
    {
      name: 'Telegram',
      platform: 'telegram',
      icon: MessageCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'แชร์ไปยัง Telegram'
    },
    {
      name: 'Email',
      platform: 'email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'ส่งทางอีเมล'
    }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('native')}
            className="gap-2"
            aria-label="แชร์ข่าวนี้"
            title="แชร์ข่าวนี้"
          >
            <Share2 className="h-4 w-4" />
            แชร์
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('copy')}
          className="gap-2"
          aria-label="คัดลอกลิงก์ข่าว"
          title="คัดลอกลิงก์ข่าว"
        >
          <Copy className="h-4 w-4" />
          คัดลอก
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" aria-label="ตัวเลือกการแชร์เพิ่มเติม" title="ตัวเลือกการแชร์เพิ่มเติม">
              <Share2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-kanit">แชร์ข่าวนี้</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Button
                    key={social.platform}
                    variant="outline"
                    className={`${social.color} text-white border-0 gap-2`}
                    onClick={() => handleShare(social.platform)}
                    aria-label={`แชร์ไปยัง ${social.name}`}
                    title={`แชร์ไปยัง ${social.name}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {social.name}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-kanit">
          <Share2 className="h-5 w-5 text-primary" />
          แชร์ข่าวนี้
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={() => handleShare('native')}
              className="gap-2 bg-primary hover:bg-primary/90"
              aria-label="แชร์ข่าวนี้"
              title="แชร์ข่าวนี้"
            >
              <Share2 className="h-4 w-4" />
              แชร์
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => handleShare('copy')}
            className="gap-2"
            aria-label="คัดลอกลิงก์ข่าว"
            title="คัดลอกลิงก์ข่าว"
          >
            <Copy className="h-4 w-4" />
            คัดลอกลิงก์
          </Button>
        </div>

        <Separator />

        {/* Social Platforms */}
        <div>
          <h4 className="font-semibold font-kanit mb-3">แชร์ไปยังโซเชียลมีเดีย</h4>
          <div className="grid grid-cols-2 gap-3">
            {socialPlatforms.map((social) => {
              const IconComponent = social.icon;
              return (
                <Button
                  key={social.platform}
                  variant="outline"
                  className={`${social.color} text-white border-0 gap-2 h-auto py-3 flex-col`}
                  onClick={() => handleShare(social.platform)}
                  aria-label={`แชร์ไปยัง ${social.name}`}
                  title={`แชร์ไปยัง ${social.name}`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-sarabun text-sm">{social.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* QR Code */}
        <div>
          <h4 className="font-semibold font-kanit mb-3">QR Code</h4>
          <div className="flex items-center gap-4">
            <img
              src={generateQRCode()}
              alt="QR Code"
              className="w-20 h-20 border rounded"
            />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-sarabun mb-2">
                สแกน QR Code เพื่ออ่านข่าวบนมือถือ
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="gap-2 font-sarabun"
                aria-label="ดาวน์โหลด QR Code ของข่าวนี้"
                title="ดาวน์โหลด QR Code ของข่าวนี้"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลด QR Code
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Custom Message */}
        <div>
          <h4 className="font-semibold font-kanit mb-3">ข้อความกำกับ</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="customMessage" className="font-sarabun">
                เพิ่มข้อความของคุณ (ไม่จำเป็น)
              </Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="เพิ่มความคิดเห็นของคุณเกี่ยวกับข่าวนี้..."
                rows={3}
                className="font-sarabun"
              />
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <Label className="font-sarabun text-sm text-muted-foreground">
                ตัวอย่างข้อความที่จะแชร์:
              </Label>
              <div className="mt-2 p-2 bg-background rounded border text-sm font-sarabun">
                {customMessage && (
                  <>
                    <div className="mb-2 text-primary">{customMessage}</div>
                    <Separator className="my-2" />
                  </>
                )}
                <div className="font-semibold">{title}</div>
                <div className="text-muted-foreground mt-1">{description.substring(0, 100)}...</div>
                <div className="text-primary text-xs mt-2">{currentUrl}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Share URL */}
        <div>
          <Label className="font-sarabun text-sm">ลิงก์ข่าว</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={currentUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('copy')}
              className="gap-1 whitespace-nowrap"
              aria-label="คัดลอกลิงก์ข่าว"
              title="คัดลอกลิงก์ข่าว"
            >
              <Copy className="h-4 w-4" />
              คัดลอก
            </Button>
          </div>
        </div>

        {/* Share Stats */}
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm font-sarabun">
            <span className="text-muted-foreground">สถิติการแชร์</span>
            <div className="flex gap-4">
              <span>Facebook: 0</span>
              <span>Twitter: 0</span>
              <span>LINE: 0</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialShare;
